import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-white/5 bg-gray-950/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold text-white">
          MeetingMind AI
        </Link>

        <nav className="flex items-center gap-5">
          {user ? (
            <>
              <Link
                href="/analyze"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                分析する
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                プラン
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm text-gray-300 transition hover:text-white"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                無料で始める
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
