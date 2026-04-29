import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>;
}

export default async function ConfirmPage({ searchParams }: Props) {
  const params = await searchParams;

  if (params.error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl">⚠️</div>
          <h1 className="mt-4 text-xl font-bold text-white">確認に失敗しました</h1>
          <p className="mt-2 text-sm text-gray-400">
            {params.error_description ?? "リンクが無効か期限切れです。"}
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block text-sm text-violet-400 hover:underline"
          >
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  if (params.token_hash && params.type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: params.token_hash,
      type: params.type as EmailOtpType,
    });
    if (!error) redirect("/analyze");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl">⚠️</div>
        <h1 className="mt-4 text-xl font-bold text-white">リンクが無効です</h1>
        <p className="mt-2 text-sm text-gray-400">
          確認リンクが無効か期限切れです。もう一度お試しください。
        </p>
        <Link
          href="/auth/signup"
          className="mt-6 inline-block text-sm text-violet-400 hover:underline"
        >
          新規登録ページへ
        </Link>
      </div>
    </div>
  );
}
