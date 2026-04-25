import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-950 px-6 text-white">
      <main className="flex w-full max-w-3xl flex-col items-center gap-10 py-24 text-center">
        <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300">
          MeetingMind AI
        </span>

        <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          会議を、
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            力に変える。
          </span>
        </h1>

        <p className="max-w-xl text-lg leading-relaxed text-gray-400">
          テキストを貼るだけで議事録・アクションアイテムを自動生成
        </p>

        <Link
          href="/analyze"
          className="inline-flex h-14 items-center justify-center rounded-full bg-violet-600 px-10 text-base font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 hover:shadow-violet-500/40"
        >
          無料で試す
        </Link>

        <div className="mt-8 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <FeatureCard
            icon="📋"
            title="議事録サマリー"
            body="長い会議メモを数秒で要約"
          />
          <FeatureCard
            icon="✅"
            title="アクション抽出"
            body="担当者と期日を自動で割り出す"
          />
          <FeatureCard
            icon="💡"
            title="次の一手"
            body="次に取るべきステップを提案"
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{body}</p>
    </div>
  );
}
