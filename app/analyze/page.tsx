"use client";

import Link from "next/link";
import { useState } from "react";

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
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamed, setStreamed] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!text.trim() || loading) return;
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
          <span className="text-sm font-medium text-violet-300">
            MeetingMind AI
          </span>
        </div>

        <h1 className="text-3xl font-bold sm:text-4xl">会議内容を分析</h1>
        <p className="mt-2 text-gray-400">
          会議メモやトランスクリプトを貼り付けて、AIに解析させましょう。
        </p>

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

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

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

function ResultPanel({ result }: { result: AnalysisResult }) {
  return (
    <div className="mt-8 space-y-6">
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
