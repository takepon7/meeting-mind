import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic();

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

  const stream = client.messages.stream({
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
        controller.enqueue(
          encoder.encode(`\n\n[ERROR] ${message}`),
        );
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
