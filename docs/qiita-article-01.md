# 人事出身の私がClaude Codeで介護SaaSをゼロから作った話【Next.js/Supabase/Stripe】

## はじめに

はじめまして。私は長年、人事責任者として採用や組織開発に携わってきた、いわゆる「ビジネス職」のキャリアを歩んできた人間です。コードを書く仕事は一度もしたことがなく、`git clone` と打つだけで手が震えるレベルからのスタートでした。

そんな私が、約2週間で **「介護DXアシスト」** という介護記録の自動生成SaaSをゼロから作り上げ、本番リリースまで漕ぎ着けることができました。

- 本番URL: https://kaigo-dx.vercel.app
- 機能：音声録音 → Whisperで文字起こし → Claude APIで介護記録を自動生成 → Supabaseに保存

なぜ作ったのか。きっかけは「**個人開発で年間1億円を目指したい**」という、自分でも少し恥ずかしくなるほど大きな目標を立てたことでした。介護業界は深刻な人手不足と記録業務の負担に苦しんでおり、ここに自分のドメイン知識を活かせると確信したのです。

この記事では、コードが書けなかった私が **Claude Code** という相棒と一緒にどうやってフルスタックSaaSを完成させたか、技術選定の理由から詰まりどころまで、すべて晒していきます。同じように「ビジネス職からエンジニアリングの世界に踏み込みたい」と思っている方の参考になれば嬉しいです。

---

## Claude Codeとは何か

まず、私のような非エンジニアが2週間でSaaSを作れた最大の要因である **Claude Code** について簡単に説明させてください。

Claude Codeは、Anthropic社が提供するターミナルで動作するAIコーディングエージェントです。ChatGPTやGitHub Copilotとの最大の違いは、**「単なるコード補完ではなく、ファイル操作・コマンド実行・テスト実行まで自律的に行うエージェントである」** という点にあります。

従来のAIコーディング体験はこうでした。

1. ChatGPTに質問する
2. 出てきたコードをコピーする
3. エディタに貼り付ける
4. エラーが出たらまたコピペで質問する

これに対しClaude Codeは、ターミナル上で会話するだけで、

- ファイルを読み、構造を理解する
- 必要なファイルを書き換える
- `npm install` や `npx playwright test` を自分で叩く
- エラーを見て自分でデバッグする

ということを連続的に行ってくれます。**「コードを書く人」ではなく「一緒に開発する人」** なのです。

私のようなノーコード層でも使えた理由は、自然言語で「Supabaseにprofilesテーブルを作って、RLSを有効にして」と頼めば、SQLマイグレーションファイルを生成してマイグレーションまで実行してくれるからです。書けないなら、書ける相棒を雇えばいい。それがClaude Codeでした。

---

## 技術スタック選定の理由

技術スタックは「Claude Codeに相談しながら、2026年時点でモダンかつ情報量が多い構成」を選びました。

| レイヤー | 技術 | 選定理由 |
| --- | --- | --- |
| フロントエンド | **Next.js 14（App Router）** | SSRとAPI Routesが同居、Vercelデプロイが簡単 |
| 認証・DB | **Supabase** | PostgreSQL + Auth + RLSが揃っている |
| 音声→テキスト | **OpenAI Whisper** | 日本語の精度が圧倒的、医療介護用語にも強い |
| 記録生成 | **Claude API（Sonnet 4.6）** | 長文の介護記録生成で破綻しない |
| 決済 | **Stripe** | サブスク管理のデファクト |
| ホスティング | **Vercel** | Next.jsとの親和性、無料枠で十分スタートできる |

特にこだわったのが **Supabase** です。RLS（Row Level Security）でテナント分離を行うことで、SaaSとして必須のマルチテナント構造をDBレベルで安全に実現できます。

```sql
-- 自分のレコードしか読めないRLSポリシー
create policy "Users can read own records"
on care_records for select
using (auth.uid() = user_id);
```

たった3行のSQLで、アプリ側のバグがあっても他人のデータが漏れないという保証が得られる。これは個人開発者にとって本当にありがたい仕組みです。

---

## 並列開発という手法

ここからが本記事の白眉です。私はClaude Codeを **5つのターミナルで同時に動かす** という手法を採用しました。

各ターミナルに役割を与え、Stream A〜Eと名付けました。

- **Stream A**: 認証・プロフィール周り（Supabase Auth、profilesテーブル）
- **Stream B**: 音声録音 → Whisper連携の中核機能
- **Stream C**: Claude APIによる記録生成ロジック
- **Stream D**: Stripe決済とサブスク管理
- **Stream E**: テスト（Playwright）とCI整備

それぞれのStreamは独立したgitブランチで作業し、最後にメインへマージしていく流れです。1人のエンジニアが順番に作っていたら2ヶ月はかかったであろう作業量を、**実装だけなら6日間** で終えることができました（テストとデバッグを入れても約2週間）。

```bash
# 私の机の上はこうなっていた
Terminal 1: ~/kaigo-dx (Stream A) — auth/profiles
Terminal 2: ~/kaigo-dx (Stream B) — voice/whisper
Terminal 3: ~/kaigo-dx (Stream C) — claude/records
Terminal 4: ~/kaigo-dx (Stream D) — stripe/billing
Terminal 5: ~/kaigo-dx (Stream E) — playwright/ci
```

人間（私）の役割は、各Streamの状況をモニタリングし、コンフリクトしそうな箇所を事前に伝え、優先順位を決めること。**「PMとして指示を出す」だけで、実装はAIが並列で進めてくれる** 体験は、コーディング観を完全に書き換えました。

---

## 詰まったポイントと解決法（5選）

順風満帆だったわけではありません。ここでは特に苦しんだ5つを共有します。

### 1. Supabase RLSでデータが取れない

最初の関門。RLSを有効にした瞬間、すべてのクエリが空配列を返すようになりました。

```ts
const { data, error } = await supabase
  .from("care_records")
  .select("*");
// data は [] になる。errorはnull。これが厄介。
```

原因は、サーバーコンポーネントで `createClient()` を呼ぶ際に **Cookieからセッションを引き継ぐ実装になっていなかった** こと。`@supabase/ssr` の `createServerClient` を使い、`cookies()` を渡すよう修正したら一発で解決しました。

### 2. Stripe Webhookの本番設定

ローカルでは `stripe listen` で動いていたWebhookが、本番でだけ署名検証エラーを吐き続けました。

```
StripeSignatureVerificationError: No signatures found matching the expected signature
```

原因は、Next.js App Routerの `route.ts` で `await req.text()` ではなく `await req.json()` を使っていたこと。**生のbodyでないと署名検証は通らない** のです。

```ts
// NG
const body = await req.json();
// OK
const body = await req.text();
const event = stripe.webhooks.constructEvent(body, sig, secret);
```

### 3. Claude APIのモデル名エラー

```
404: model: claude-3-sonnet-latest
```

学習データが古かったため、Claude Code自身が古いモデル名を提案してきました。2026年4月時点での正しいモデル名は `claude-sonnet-4-6` 系です。**AIに任せきりにせず、最新ドキュメントを確認するクセは絶対に必要** だと痛感しました。

### 4. CSPエラー（eval blocked）

Vercelデプロイ後、本番でだけ画面が真っ白に。

```
Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script
```

`next.config.ts` のCSP設定が厳しすぎて、Next.jsの内部処理までブロックしていました。`script-src` に `'self' 'unsafe-inline'` を許可しつつ、`'unsafe-eval'` は本番でも許容する判断に。セキュリティと利便性のバランスはまだ勉強中です。

### 5. profilesテーブルの自動作成

ユーザー登録時に `profiles` テーブルへ行を作る処理を、最初はAPI Route内で書いていました。しかしSupabase Authのサインアップ直後は権限が不安定で、たまに失敗します。

解決策は **DBトリガー** にすること。

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

DBレベルで保証すれば、アプリ側のバグやネットワーク断の影響を受けません。

---

## できあがったもの

最終的に完成したのは、以下の機能を持つフルスタックSaaSです。

- メールアドレスでのサインアップ・ログイン
- ブラウザでの音声録音（最大10分）
- Whisperによる日本語文字起こし
- Claude APIによる介護記録（SOAP形式）の自動生成
- 利用者ごとの記録一覧・検索
- Stripe月額サブスク（無料プラン / Pro 2,980円）
- ダッシュボードでの利用状況可視化

そして品質保証として、**Playwrightで書いた37個のE2Eテストがすべてグリーン** になっています。

```bash
$ npx playwright test
Running 37 tests using 4 workers
  37 passed (1.2m)
```

非エンジニアの私でも、テストの重要性は痛いほどわかっていました。Claude Codeが書いてくれたテストが落ちることで、何度もリグレッションを未然に防げたのは本当にありがたかったです。

本番はこちらで触れます → https://kaigo-dx.vercel.app

---

## まとめ・学び

最後に、この2週間で得た学びをお伝えします。

**ドメイン知識 × AI開発は、想像以上に強力な掛け算です。**

私は介護業界の現場で、職員さんが夜勤明けに記録を書きながら涙ぐむ姿を何度も見てきました。「何の記録をどう書けば本当に現場で使えるか」を知っていたからこそ、Claude Codeへの指示が的確になり、無駄な実装を避けられました。コードが書けることよりも、**「何を作るべきかを知っていること」** のほうが、SaaS開発では本質的に重要だと確信しています。

次は議事録自動化SaaS **「MeetingMind AI」** に着手しています。会議が多すぎる現代のビジネスパーソンを救うサービスを目指して、また5並列のターミナルを開いているところです。

最後に、同じく「コードが書けないけど作りたいものがある」と思っている方へ。

> 書けないなら、書けるAIと組めばいい。
> あなたのドメイン知識は、世界のどんなエンジニアよりも価値があるかもしれない。

長文をお読みいただきありがとうございました。質問や感想はコメント欄でお待ちしています。

---

**書いた人**: kf（人事出身、個人開発で年間1億円を目指し中）
