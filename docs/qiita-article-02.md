# 人事がClaude APIで会議録→アクションアイテム自動抽出を実装してみた

## はじめに

前回の記事（[介護DXアシスト](https://kaigo-dx.vercel.app)）を公開してから、「次は何を作ろう」と考えていたとき、すぐに浮かんだのが **会議** でした。

人事の仕事をしていると、本当に会議が多い。採用会議、評価会議、1on1、全社MTG……。そして会議が終わったあとに必ず起きること——「あれ、次に何するんだっけ？」という抜け漏れです。

議事録は残っているけれど、「誰が・いつまでに・何をするか」というアクションアイテムが散らばっていて、追えなくなる。これ、HR経験者なら誰でも心当たりがあるはずです。

そこで作ったのが **MeetingMind AI** です。会議のテキストを貼り付けると、Claude APIが解析して議事録とアクションアイテムを自動で抽出してくれます。仕組みはシンプルですが、「なんで今まで自分でやってたんだ」という気持ちになります。

---

## 作ったもの

- **本番URL**: https://meetin-mind.vercel.app
- **GitHub**: https://github.com/takepon7/meeting-mind

| レイヤー | 技術 | 役割 |
| --- | --- | --- |
| フロントエンド | **Next.js 16 / TypeScript** | UIとAPI Route |
| AI解析 | **Claude API（claude-sonnet-4-5）** | 議事録・アクションアイテム抽出 |
| DB / 認証 | **Supabase** | ユーザー管理・データ保存 |
| ホスティング | **Vercel** | デプロイ・本番環境 |

技術選定の理由は、前作とほぼ同じです。Next.js + Vercel の組み合わせはデプロイが簡単で、Supabase は認証からDBまで一気通貫で使えて個人開発にちょうどいい。Claude APIは日本語の意図抽出と構造化出力が安定しているので、今回のようなテキスト解析との相性が良いと感じています。

---

## Claude APIのプロンプト設計で工夫したこと

### JSONで構造化して返させる

今回の実装で一番こだわったのが **「返答をJSONで固定する」** 設計です。

議事録ツールとして使うなら、自由文で返ってきても困ります。「summary」「decisions」「action_items」という決まった型に落とし込んでもらえれば、あとはフロントで好きなように表示できます。

そのためにsystem promptでJSON形式を明示しました。実際にコードに入っているsystem promptはこんな感じです。

```text
あなたは会議分析の専門家です。以下の会議内容から以下をJSON形式で抽出してください：
{
  "summary": "会議の要約（3〜5文）",
  "decisions": ["決定事項の配列"],
  "action_items": [{ "title": "...", "assignee": "...", "due_date": "...", "priority": "high|medium|low" }],
  "next_steps": ["次のステップの提案（2〜3件）"],
  "key_topics": ["主要トピックの配列"]
}
日本語で回答してください。JSON以外の文字（説明文・コードフェンスなど）は一切出力せず、
JSONオブジェクトのみを返してください。
```

ポイントは最後の一文です。「コードフェンスなど出力しないで」という指示を入れないと、Claude が親切に ` ```json ` で囲んで返してくることがあり、そのままパースするとエラーになります。

### ストリーミングレスポンスの実装

Next.js の API Route から Anthropic SDK のストリームをそのままブラウザに流す実装にしました。

```ts
const stream = client.messages.stream({
  model: "claude-sonnet-4-5",
  max_tokens: 2000,
  system: SYSTEM_PROMPT,
  messages: [{ role: "user", content: meetingText }],
});

const responseStream = new ReadableStream<Uint8Array>({
  async start(controller) {
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        controller.enqueue(encoder.encode(event.delta.text));
      }
    }
    controller.close();
  },
});

return new Response(responseStream, {
  headers: { "Content-Type": "text/plain; charset=utf-8" },
});
```

ユーザーから見ると「解析中…」と待たされる時間が短く感じられるので、体験としては良いと思います。ただしこれが後述の詰まりポイントにもつながります。

---

## 詰まったところ3つ

### 1. CSPエラー（Next.js 16のproxy.tsでの対応）

Vercel にデプロイした本番環境でだけ、ブラウザのコンソールにこんなエラーが出ました。

```
Refused to evaluate a string as JavaScript because 'unsafe-eval'
is not an allowed source of script in the following Content Security Policy directive
```

ローカルでは一切再現しないので、最初は原因がわかりませんでした。

Next.js 16 では、CSP（Content Security Policy）のヘッダー設定を `proxy.ts` というミドルウェアで管理するのがひとつの方法です。ここに `'unsafe-eval'` を許可する設定を入れていなかったことが原因でした。

```ts
// proxy.ts
response.headers.set(
  'Content-Security-Policy',
  [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    // ...
    "connect-src 'self' https://*.supabase.co https://api.anthropic.com",
    // ...
  ].join('; ')
)
```

`connect-src` に `https://api.anthropic.com` を明示するのも必要でした。これを入れないと、フロントから Claude API へのリクエストがブロックされます。

### 2. JSONパースエラー（ストリーミングとJSONの相性）

ストリーミングでJSONを受け取るとき、チャンクが途中で切れた状態で `JSON.parse()` しようとするとエラーになります。

```
SyntaxError: Unexpected end of JSON input
```

ストリームは「少しずつ届く」という性質上、最初のチャンクが `{"summary": "今日の会議は` で終わっていることがあります。そのタイミングでパースしてしまうと当然壊れます。

対処としては、**ストリームをすべて受け取り終わってから `JSON.parse()` する** というシンプルな方法をとりました。リアルタイムに内容を表示したいなら別の工夫が必要ですが、まずは動くことを優先しました。

```ts
// フロント側: 全チャンクをバッファしてからパース
let buffer = "";
for await (const chunk of reader) {
  buffer += decoder.decode(chunk, { stream: true });
}
const result = JSON.parse(buffer);
```

### 3. Node.jsバージョン問題（v18→v20への切り替え）

ローカルで `npm run dev` は通るのに、Vercel へのデプロイでビルドが途中で止まるという現象がありました。ログをよく見るとこんな記述が。

```
Warning: Node.js 18 is deprecated on this platform.
```

ローカルが Node.js v18 で、Vercel がデフォルトで v20 以上を推奨するようになっていたことが原因でした。`package.json` にエンジン指定を追加して、ローカルも v20 に揃えたら解消しました。

```json
{
  "engines": {
    "node": ">=20"
  }
}
```

バージョンのずれは気づきにくいのでやっかいです。

---

## やってみてわかったこと

**プロンプト設計は、思ったより難しい。**

「JSONで返してください」と書けば終わりかと思っていたら、そう単純ではありませんでした。期待どおりの形式で返ってくるかどうかは、プロンプトの書き方で大きく変わります。エッジケース（担当者が「全員」や「未定」の場合、アクションアイテムが存在しない場合など）への対処をsystem promptに書き込む作業は地味に時間がかかりました。

**ストリーミングとJSONの組み合わせには注意が必要。**

ストリーミングはUXとしては良いのですが、「JSONが完成する前にパースしようとする」という落とし穴があります。リアルタイムでJSONを扱いたい場合は、JSONをストリームに適した形式（JSON Lines など）に変えるか、パース処理をうまく遅延させる工夫が必要になります。今回は「全部届いてからパース」で割り切りましたが、もっとリッチな体験を目指すなら再設計が必要そうです。

**それでも、動いたときの達成感は毎回ある。**

会議テキストを貼り付けて「解析」ボタンを押すと、数秒でアクションアイテムが表示される——これが実際に動いた瞬間は、何度作っても嬉しいです。自分が感じていた課題が、ちゃんとツールとして形になっている感覚があります。

---

## おわりに

MeetingMind AI はまだポートフォリオとしての位置づけで、機能を少しずつ追加しながら開発を続けています。Supabase と組み合わせた過去の会議履歴の保存・検索機能や、Slack 連携なども試してみたいと思っています。

次に作りたいのは、採用・評価・面談など **HR業務に特化したAIアシスタント** です。会議録の次のレイヤーとして、「人事の仕事をそのままAIに任せる」体験を作れないか、ぼちぼち考えているところです。

最後まで読んでいただきありがとうございました。「自分もこういうの作ってみたい」「こうしたらもっとよくなるよ」という方がいれば、コメントで教えていただけると嬉しいです。

---

**書いた人**: kf（人事出身、個人開発でポートフォリオを作り続けています）

タグ: `ClaudeCode` `個人開発` `Next.js` `Claude` `作ってみた`
