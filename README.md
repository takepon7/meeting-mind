# MeetingMind AI

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Claude API](https://img.shields.io/badge/Claude-API-D97757?logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

> Transform meeting notes into actionable insights with Claude AI.

## Features

- **Paste & analyze** — drop any meeting transcript and Claude AI processes it instantly
- **Structured output** — auto-extracts summary, decisions, action items (with assignee & due date), and next steps
- **Streaming responses** — real-time feedback as the AI generates results
- **Rate limiting** — 10 requests / hour per IP to prevent abuse
- **One-click copy** — copy the full structured result to clipboard in a formatted template
- **Sample text** — built-in demo text for a quick tryout

## Tech Stack

| Layer     | Technology                           |
| --------- | ------------------------------------ |
| Framework | Next.js 16 (App Router, React 19)    |
| Language  | TypeScript 5                         |
| Styling   | Tailwind CSS v4                      |
| AI        | Claude API (`@anthropic-ai/sdk`)     |
| Database  | Supabase (Postgres + RLS)            |
| Hosting   | Vercel (Fluid Compute)               |

## Live Demo

**[https://meetin-mind.vercel.app](https://meetin-mind.vercel.app)**

## Getting Started

### Prerequisites

- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com/)
- A [Supabase](https://supabase.com/) project

### 1. Clone & install

```bash
git clone https://github.com/TKDR/meeting-mind.git
cd meeting-mind
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in the values — see Environment Variables below
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm run start
```

## Environment Variables

| Variable                        | Description                             |
| ------------------------------- | --------------------------------------- |
| `ANTHROPIC_API_KEY`             | Claude API key for AI analysis          |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key                |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-only) |

> Never commit `.env.local`. The service role key bypasses RLS — keep it server-side only.

## Related Article

- Qiita article ② — _link to be added_
- [人事がClaude Codeで介護記録SaaSを作ってみた](https://qiita.com/takepon7/items/aab9486f8e3d2b807e4e) — Qiita article ①

## Author

**Ryosuke Takeda** — [portfolio](https://ryosuke-portfolio.vercel.app)

## License

MIT — see [LICENSE](LICENSE) for details.
