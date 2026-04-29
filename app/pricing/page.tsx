"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: PRO_PRICE_ID }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          料金プラン
        </h1>
        <p className="text-center text-gray-500 mb-12">
          あなたの会議をもっとスマートに
        </p>

        {error && (
          <p className="text-center text-red-600 mb-6 text-sm">{error}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                フリー
              </h2>
              <p className="text-4xl font-bold text-gray-900 mt-2">
                ¥0
                <span className="text-base font-normal text-gray-500">
                  /月
                </span>
              </p>
            </div>
            <ul className="space-y-3 text-gray-600 text-sm flex-1 mb-8">
              <li className="flex items-center gap-2">
                <CheckIcon />
                月5回まで分析
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                要約・アクションアイテム抽出
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                基本サポート
              </li>
            </ul>
            <button
              disabled
              className="w-full py-3 rounded-xl border border-gray-300 text-gray-400 text-sm font-medium cursor-not-allowed"
            >
              現在のプラン
            </button>
          </div>

          {/* Pro plan */}
          <div className="bg-indigo-600 rounded-2xl shadow-md p-8 flex flex-col text-white">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-semibold">Pro</h2>
                <span className="text-xs bg-white text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                  おすすめ
                </span>
              </div>
              <p className="text-4xl font-bold mt-2">
                ¥980
                <span className="text-base font-normal text-indigo-200">
                  /月
                </span>
              </p>
            </div>
            <ul className="space-y-3 text-indigo-100 text-sm flex-1 mb-8">
              <li className="flex items-center gap-2">
                <CheckIcon className="text-white" />
                無制限の分析
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="text-white" />
                要約・アクションアイテム抽出
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="text-white" />
                優先サポート
              </li>
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition disabled:opacity-60"
            >
              {loading ? "処理中..." : "アップグレード"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function CheckIcon({ className = "text-indigo-600" }: { className?: string }) {
  return (
    <svg
      className={`w-4 h-4 flex-shrink-0 ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
