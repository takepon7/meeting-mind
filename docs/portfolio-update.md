# Portfolio Site 更新指示書

対象リポジトリ: https://github.com/takepon7/portfolio-site

MeetingMind AI を Works に追加し、Skills セクションを更新するための指示書です。

---

## 1. Works セクションへのカード追加

`works` 配列（または該当するデータ定義箇所）に以下のオブジェクトを追加してください。

```ts
{
  title: "MeetingMind AI",
  subtitle: "BtoB SaaS（開発中）",
  description:
    "会議テキストをClaude APIで解析し、議事録・アクションアイテム・担当者・期日を自動抽出。HR出身者のドメイン知識をAIで実装。",
  href: "https://meeting-mind.vercel.app",
}
```

### フィールド一覧

| key | value |
| --- | --- |
| title | MeetingMind AI |
| subtitle | BtoB SaaS（開発中） |
| description | 会議テキストをClaude APIで解析し、議事録・アクションアイテム・担当者・期日を自動抽出。HR出身者のドメイン知識をAIで実装。 |
| href | https://meeting-mind.vercel.app |

### 配置位置

- Works セクションの **先頭**（最新作品として最も目立つ位置）に配置することを推奨。
- 既存カードと同じコンポーネント／レイアウトを再利用すること（独自スタイルは追加しない）。

### 表示確認チェックリスト

- [ ] カードのタイトル・サブタイトル・説明文が正しく表示される
- [ ] href が新規タブで開く（`target="_blank"` + `rel="noopener noreferrer"` の有無は既存実装に合わせる）
- [ ] モバイル幅（375px）でレイアウトが崩れない
- [ ] サムネイル／OGP画像を後日差し替えられるようプロパティを残す（任意）

---

## 2. Skills セクションへの追加スキル

既存の Skills 配列に、以下の3項目を追加してください。

- **Prompt Engineering（Claude API）**
  - Anthropic Claude API を使った構造化抽出・JSON Mode・few-shot 設計の実務経験
- **Playwright E2E Testing**
  - 認証フロー・課金フロー・ダッシュボードの E2E 自動化を Playwright で実装
- **Stripe Webhook**
  - Subscription / Checkout / Invoice 系イベントの署名検証＆冪等処理

### 配置位置の目安

- 既存スキル（Next.js, TypeScript 等）の **後ろ** に追加。
- AI / テスト / 決済 のカテゴリ分けがある場合はそれぞれに振り分ける。

### チェックリスト

- [ ] 3スキルすべてが Skills セクションで表示される
- [ ] アイコンを使う構成の場合は仮アイコンでも可（後で差し替え）
- [ ] 並び順が「フロントエンド → AI/API → テスト → 決済」になっていると見栄えが良い

---

## 3. 反映フロー

1. `portfolio-site` を clone / pull
2. Works データ定義ファイルを編集（`src/data/works.ts` などプロジェクト構成に従う）
3. Skills データ定義ファイルを編集
4. `pnpm dev`（または `npm run dev`）でローカル確認
5. `git checkout -b feat/add-meeting-mind`
6. コミット → プッシュ → PR 作成
7. Vercel Preview で表示確認後、main にマージ

---

## 4. 補足

- MeetingMind AI 本体URL: https://meeting-mind.vercel.app
- 詳細記事は Qiita 記事②③ にて別途公開予定（`docs/qiita-article-02-outline.md`, `docs/qiita-article-03-outline.md`）
- ポートフォリオに「Qiita 記事一覧」セクションがあれば、公開後にリンクを追加する。
