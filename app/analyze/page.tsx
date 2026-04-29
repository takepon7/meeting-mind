"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ActionItem = {
  title: string;
  assignee?: string;
  due_date?: string;
  priority?: "high" | "medium" | "low" | string;
};

type AnalysisResult = {
  summary?: string;
  decisions?: string[];
  action_items?: ActionItem[];
  next_steps?: string[];
  key_topics?: string[];
};

type UsageInfo = {
  authenticated: boolean;
  used: number;
  limit: number | null;
  plan: "free" | "pro";
};

const SAMPLE_TEXT = `2024年Q4売上レビュー会議
参加者：田中(営業部長)、鈴木(マーケ)、佐藤(CS)
・Q4売上：目標比92%。来期は新規開拓を強化する方針で合意
・田中：1月末までに新規顧客リスト100件を作成する
・鈴木：SNS広告予算を20%増額。2月から開始予定
・佐藤：チャーン率改善のためオンボーディング改善案を来週月曜提出`;

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return text;
  return text.slice(start, end + 1);
}

export default function AnalyzePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamed, setStreamed] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  useEffect(() => {
    fetch("/api/usage/check")
      .then((r) => r.json())
      .then((data: UsageInfo) => setUsage(data))
      .catch(() => {});
  }, [result]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleAnalyze() {
    if (!text.trim() || loading) return;

    // Enforce free plan limit (authenticated users only)
    if (usage?.authenticated && usage.plan === "free" && usage.limit !== null && usage.used >= usage.limit) {
      setError("__limit_exceeded__");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setStreamed("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_text: text }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      if (!res.body) throw new Error("空のレスポンスを受信しました");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreamed(acc);
      }

      try {
        const parsed = JSON.parse(extractJson(acc)) as AnalysisResult;
        setResult(parsed);
        // Log usage for authenticated users (best-effort, non-blocking)
        if (usage?.authenticated) {
          fetch("/api/usage/log", { method: "POST" }).catch(() => {});
        }
      } catch {
        setError(
          "AIの応答をJSONとして解析できませんでした。もう一度お試しください。",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-gray-950 px-6 py-12 text-white">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-gray-400 transition hover:text-white"
          >
            ← トップに戻る
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-violet-300">
              MeetingMind AI
            </span>
            {usage?.authenticated && (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                ログアウト
              </button>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold sm:text-4xl">会議内容を分析</h1>
        <p className="mt-2 text-gray-400">
          会議メモやトランスクリプトを貼り付けて、AIに解析させましょう。
        </p>

        {usage?.authenticated && <UsageBanner usage={usage} />}

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="meeting-text"
              className="text-sm font-medium text-gray-300"
            >
              会議内容
            </label>
            <button
              type="button"
              onClick={() => setText(SAMPLE_TEXT)}
              className="rounded-md border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20"
            >
              サンプルを使う
            </button>
          </div>
          <textarea
            id="meeting-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ここに会議のメモやトランスクリプトを貼り付け..."
            rows={12}
            className="w-full resize-y rounded-lg border border-white/10 bg-gray-900 p-4 font-mono text-sm leading-relaxed text-gray-100 placeholder:text-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />

          <div className="mt-4 flex items-center justify-end gap-3">
            <span className="text-xs text-gray-500">
              {text.length.toLocaleString()} 文字
            </span>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Spinner />
                  AIが分析中...
                </>
              ) : (
                <>AIで分析する</>
              )}
            </button>
          </div>
        </div>

        {error === "__limit_exceeded__" ? (
          <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
            <p className="text-sm text-amber-200">
              今月の無料枠（5回）を使い切りました。Proプランにアップグレードすると無制限でご利用いただけます。
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              プランを見る
            </Link>
          </div>
        ) : error ? (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {loading && !result && streamed && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
              ストリーミング受信中…
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-gray-400">
              {streamed}
            </pre>
          </div>
        )}

        {result && <ResultPanel result={result} />}
      </div>
    </div>
  );
}

function UsageBanner({ usage }: { usage: UsageInfo }) {
  if (usage.plan === "pro") {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-gray-400">
        今月の利用回数：<span className="font-medium text-white">{usage.used}回</span>
        （Proプラン・無制限）
      </div>
    );
  }
  const remaining = (usage.limit ?? 5) - usage.used;
  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-2.5 text-sm ${
        remaining <= 0
          ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
          : "border-white/10 bg-white/[0.03] text-gray-400"
      }`}
    >
      今月の残り回数：
      <span className="font-medium text-white">
        {Math.max(remaining, 0)}回 / {usage.limit}回
      </span>
      （無料プラン）
    </div>
  );
}

function ResultPanel({ result }: { result: AnalysisResult }) {
  const [copied, setCopied] = useState(false);

  function buildCopyText(): string {
    const lines: string[] = [];

    lines.push("【議事録サマリー】");
    lines.push(result.summary || "（要約はありませんでした）");

    if (result.decisions && result.decisions.length > 0) {
      lines.push("");
      lines.push("【決定事項】");
      result.decisions.forEach((d) => lines.push(`・${d}`));
    }

    if (result.action_items && result.action_items.length > 0) {
      lines.push("");
      lines.push("【アクションアイテム】");
      result.action_items.forEach((item) => {
        const parts = [item.title];
        if (item.assignee) parts.push(`担当：${item.assignee}`);
        if (item.due_date) parts.push(`期日：${item.due_date}`);
        lines.push(`・${parts.join("、")}`);
      });
    }

    if (result.next_steps && result.next_steps.length > 0) {
      lines.push("");
      lines.push("【次のステップ】");
      result.next_steps.forEach((s) => lines.push(`・${s}`));
    }

    return lines.join("\n");
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildCopyText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? "✓ コピーしました" : "結果をコピー"}
        </button>
      </div>
      <Section title="📋 議事録サマリー">
        <p className="leading-relaxed text-gray-200">
          {result.summary || "（要約はありませんでした）"}
        </p>
        {result.key_topics && result.key_topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {result.key_topics.map((topic, i) => (
              <span
                key={i}
                className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </Section>

      {result.decisions && result.decisions.length > 0 && (
        <Section title="🤝 決定事項">
          <ul className="space-y-2">
            {result.decisions.map((d, i) => (
              <li key={i} className="flex gap-3 text-gray-200">
                <span className="text-violet-400">▸</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="✅ アクションアイテム">
        {result.action_items && result.action_items.length > 0 ? (
          <ul className="space-y-3">
            {result.action_items.map((item, i) => (
              <li
                key={i}
                className="rounded-lg border border-white/10 bg-gray-900/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="font-medium text-white">{item.title}</div>
                  {item.priority && <PriorityBadge priority={item.priority} />}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
                  {item.assignee && (
                    <span>
                      <span className="text-gray-500">担当:</span> {item.assignee}
                    </span>
                  )}
                  {item.due_date && (
                    <span>
                      <span className="text-gray-500">期日:</span> {item.due_date}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">アクションアイテムは抽出されませんでした。</p>
        )}
      </Section>

      {result.next_steps && result.next_steps.length > 0 && (
        <Section title="💡 次のステップ提案">
          <ul className="space-y-2">
            {result.next_steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-gray-200">
                <span className="text-fuchsia-400">→</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: "border-red-500/40 bg-red-500/10 text-red-300",
    medium: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  };
  const label: Record<string, string> = {
    high: "高",
    medium: "中",
    low: "低",
  };
  const cls =
    styles[priority] || "border-white/10 bg-white/5 text-gray-300";
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {label[priority] || priority}
    </span>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
