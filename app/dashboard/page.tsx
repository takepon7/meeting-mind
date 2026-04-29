import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, email, full_name")
    .eq("id", user.id)
    .single();

  const plan = (profile?.plan as string) ?? "free";
  const params = await searchParams;
  const justUpgraded = params.upgraded === "true";

  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {justUpgraded && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-200 text-green-800 px-5 py-4 text-sm font-medium">
            Proプランへのアップグレードが完了しました！
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-1">ダッシュボード</h1>
        <p className="text-gray-500 text-sm mb-8">
          {profile?.email ?? user.email}
        </p>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                現在のプラン
              </p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {plan === "pro" ? "Pro" : "フリー"}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full ${
                plan === "pro"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {plan === "pro" ? "有効" : "無料"}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href="/analyze"
            className="flex-1 text-center py-3 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            会議を分析する
          </a>
          {plan === "pro" ? (
            <form action="/api/stripe/portal" method="POST">
              <button
                type="submit"
                className="py-3 px-5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                請求を管理する
              </button>
            </form>
          ) : (
            <a
              href="/pricing"
              className="py-3 px-5 rounded-xl border border-indigo-300 text-indigo-600 text-sm font-medium hover:bg-indigo-50 transition"
            >
              Proにアップグレード
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
