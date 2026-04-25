import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-gray-950 text-white">
      {/* Hero */}
      <section className="flex flex-col items-center px-6 py-24 text-center">
        <span className="rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300">
          MeetingMind AI
        </span>

        <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          会議を、
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            力に変える。
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-400">
          テキストを貼るだけで議事録・アクションアイテムを自動生成
        </p>

        <Link
          href="/analyze"
          className="mt-10 inline-flex h-14 items-center justify-center rounded-full bg-violet-600 px-10 text-base font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 hover:shadow-violet-500/40"
        >
          無料で試す
        </Link>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-2xl font-bold">使い方</h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            <Step number={1} title="テキストを貼り付ける" body="会議のメモやトランスクリプトをそのままペースト" />
            <Step number={2} title="AIで分析する" body="Claude AIがリアルタイムで内容を解析" />
            <Step number={3} title="結果をコピー" body="要約・アクションアイテムをワンクリックでコピー" />
          </ol>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-2xl font-bold">機能一覧</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <FeatureCard icon="📋" title="議事録サマリー" body="長い会議メモを数秒で要約" />
            <FeatureCard icon="✅" title="アクション抽出" body="担当者と期日を自動で割り出す" />
            <FeatureCard icon="💡" title="次の一手" body="次に取るべきステップを提案" />
            <FeatureCard icon="⚡" title="ストリーミング" body="生成中からリアルタイムで確認" />
            <FeatureCard icon="📋" title="ワンクリックコピー" body="整形済みテキストをそのまま共有" />
            <FeatureCard icon="🛡️" title="レート制限" body="1時間10リクエストで安心して利用" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between text-sm text-gray-500">
          <span>© 2025 MeetingMind AI</span>
          <a
            href="https://github.com/TKDR/meeting-mind"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-white"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}

function Step({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <li className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-bold">
        {number}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400">{body}</p>
    </li>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-400">{body}</p>
    </div>
  );
}
