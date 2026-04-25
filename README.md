# Meeting Mind

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Claude API](https://img.shields.io/badge/Claude-API-D97757?logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

> AI-powered meeting intelligence — turn raw conversation into structured minutes, action items, and shareable summaries in seconds.

Meeting Mind ingests meeting audio or transcripts, sends them through Claude for semantic understanding, and produces editable, searchable minutes. Built for product teams, consultancies, and ops orgs that lose hours every week to note-taking and follow-up triage.

## Features

- **Audio & transcript ingestion** — upload recordings or paste transcripts; both routes converge on the same pipeline.
- **AI-generated minutes** — structured summary, decisions, and per-owner action items powered by Claude.
- **Editable output** — every section is human-revisable before sharing; AI is a starting point, not a black box.
- **Semantic search** — find past decisions across meetings without remembering exact wording.
- **Email delivery** — send polished minutes to attendees via Resend.
- **Row-level security** — Supabase RLS keeps each workspace's data isolated by default.

## Tech Stack

| Layer       | Technology                                  |
| ----------- | ------------------------------------------- |
| Framework   | Next.js 16 (App Router, React 19)           |
| Language    | TypeScript 5                                |
| Styling     | Tailwind CSS v4                             |
| AI          | Claude API (`@anthropic-ai/sdk`)            |
| Database    | Supabase (Postgres + Auth + RLS)            |
| Email       | Resend                                      |
| Hosting     | Vercel                                      |
| Linting     | ESLint 9 + `eslint-config-next`             |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+ (or pnpm / yarn / bun)
- A Supabase project
- An Anthropic API key
- A Resend API key (optional, only needed for email delivery)

### 1. Clone & install

```bash
git clone https://github.com/<your-org>/meeting-mind.git
cd meeting-mind
npm install
```

### 2. Configure environment

Create a `.env.local` file at the project root (see [Environment Variables](#environment-variables) below).

### 3. Apply database schema

```bash
# From the Supabase SQL editor, or via the Supabase CLI:
supabase db push
```

The `supabase/` directory contains the schema and RLS policies.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build for production

```bash
npm run build
npm run start
```

## Environment Variables

| Variable                          | Required | Description                                      |
| --------------------------------- | :------: | ------------------------------------------------ |
| `ANTHROPIC_API_KEY`               |    ✅    | Claude API key for minute generation             |
| `NEXT_PUBLIC_SUPABASE_URL`        |    ✅    | Supabase project URL                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   |    ✅    | Supabase public anon key (safe for browser)      |
| `SUPABASE_SERVICE_ROLE_KEY`       |    ✅    | Supabase service role key (server-only)          |
| `RESEND_API_KEY`                  |          | Resend API key — required for email delivery    |
| `NEXT_PUBLIC_APP_URL`             |    ✅    | Public base URL (e.g. `http://localhost:3000`)   |

> ⚠️ Never commit `.env.local`. The service role key bypasses RLS — keep it server-side only.

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add every variable from the table above under **Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_APP_URL` to your production domain.
5. Deploy. Vercel will detect Next.js automatically.

### Other platforms

Any host that runs Node 20+ and supports Next.js 16's standalone output works. Set the same environment variables and run `npm run build && npm run start`.

## Project Structure

```
meeting-mind/
├── app/              # Next.js App Router routes & layouts
├── public/           # Static assets
├── supabase/         # Schema, migrations, RLS policies
├── docs/             # Internal documentation
└── ...
```

## License

MIT — see [LICENSE](LICENSE) for details.
