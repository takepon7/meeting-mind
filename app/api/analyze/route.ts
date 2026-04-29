import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const anthropic = new Anthropic();
const MAX_TEXT_LENGTH = 5000;
const FREE_LIMIT = 5;

const SYSTEM_PROMPT = `あなたは会議分析の専門家です。以下の会議内容から以下をJSON形式で抽出してください：
{
  "summary": "会議の要約（3〜5文）",
  "decisions": ["決定事項の配列"],
  "action_items": [{ "title": "...", "assignee": "...", "due_date": "...", "priority": "high|medium|low" }],
  "next_steps": ["次のステップの提案（2〜3件）"],
  "key_topics": ["主要トピックの配列"]
}
日本語で回答してください。JSON以外の文字（説明文・コードフェンスなど）は一切出力せず、JSONオブジェクトのみを返してください。`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  // Check monthly usage for free plan users
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";

  if (plan === "free") {
    const monthYear = new Date().toISOString().slice(0, 7);
    const { count } = await supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("month_year", monthYear);

    if ((count ?? 0) >= FREE_LIMIT) {
      return Response.json(
        {
          error: `今月の無料利用上限（月${FREE_LIMIT}回）に達しました。`,
          used: count,
          limit: FREE_LIMIT,
        },
        { status: 429 },
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const meetingText = (body as { meeting_text?: unknown })?.meeting_text;
  if (typeof meetingText !== "string" || meetingText.trim().length === 0) {
    return Response.json(
      { error: "meeting_text is required" },
      { status: 400 },
    );
  }

  if (meetingText.length > MAX_TEXT_LENGTH) {
    return Response.json(
      { error: `meeting_text must be ${MAX_TEXT_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  // Log usage before streaming to prevent concurrent abuse
  const monthYear = new Date().toISOString().slice(0, 7);
  await supabase.from("usage_logs").insert({
    user_id: user.id,
    month_year: monthYear,
  });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: meetingText }],
  });

  const encoder = new TextEncoder();
  const responseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "stream error";
        controller.enqueue(encoder.encode(`\n\n[ERROR] ${message}`));
        controller.close();
      }
    },
  });

  return new Response(responseStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
