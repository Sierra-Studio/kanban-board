# Kanban Board Web

The frontend for the Kanban Board, built with **Next.js 15** (App Router),
**React 19**, and **Tailwind CSS 4**. It is a pure client of the Python
[`api/`](../api) service — it has no database or server-side business logic.

## Tech stack

- **Framework:** Next.js 15.2 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.0
- **UI components:** Base UI
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod

## Prerequisites

- Node.js 20+
- The API service running (see [`../api/README.md`](../api/README.md))

## Getting started

```bash
cp .env.example .env      # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Browser-facing base URL of the Python API (e.g. `http://localhost:8000`). Inlined into the client bundle at build time. |
| `INTERNAL_API_URL` | Optional. Base URL used for server-side (SSR/middleware) calls; needed in Docker where the API is reachable at `http://api:8000`. Falls back to `NEXT_PUBLIC_API_URL`. |
| `NODE_ENV` | `development` \| `test` \| `production` |

## How it talks to the API

- **Client components** call the API through `apiFetch` in `src/lib/api/*`,
  which prefixes `NEXT_PUBLIC_API_URL` and sends `credentials: "include"` so the
  session cookie is attached.
- **Auth** goes through `src/lib/auth-client.ts` (`signIn`, `signUp`, `signOut`),
  which POSTs to the API's `/api/auth/*` endpoints.
- **Server Components** use `src/lib/server-api.ts`, which reads the incoming
  cookie via `next/headers` and forwards it to the API for `getSession`,
  `getBoards`, and `getBoardDetail`.
- **`middleware.ts`** protects routes by validating the session against the
  API's `/api/auth/get-session`.

## Available scripts

- `npm run dev` — start the dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — start the production server
- `npm run lint` / `npm run lint:fix`
- `npm run typecheck`
- `npm run format:check` / `npm run format:write`

## Project structure

```
web/src/
├── app/                    # App Router pages
│   ├── (auth)/            # sign-in / sign-up
│   └── (dashboard)/       # protected dashboard, boards, profile, settings
├── components/            # UI + sidebar
├── lib/
│   ├── api/              # client API wrappers (config, boards, columns, cards, users)
│   ├── auth-client.ts    # cookie-based auth client
│   ├── server-api.ts     # server-side fetch helpers (cookie forwarding)
│   └── types.ts          # shared response types
└── env.js                 # client env validation (@t3-oss/env-nextjs)
```
