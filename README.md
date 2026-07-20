# Kanban Board (API + Web)

A Kanban board application split into two independently deployable services:

- **`api/`** — the backend + database: **Python, FastAPI, SQLAlchemy, Alembic, SQLite**.
- **`web/`** — the frontend: **Next.js 15 (App Router), React 19, Tailwind CSS 4**.

Previously this was a single Next.js monolith (Hono API routes + Drizzle ORM +
Better Auth, all in one process). It has been split so the API owns the database
and all business logic, and the web app is a pure client that talks to the API
over HTTP.

```
kanban-board/
├── api/     # FastAPI service (auth, boards, columns, cards, seeding, migrations)
├── web/     # Next.js frontend
└── docs/    # Product/feature docs
```

## Architecture

```
┌──────────────┐        HTTP (JSON, cookie auth)        ┌────────────────────┐
│  Next.js web │  ───────────────────────────────────▶ │  FastAPI API        │
│  (port 3000) │  ◀───────────────────────────────────  │  (port 8000)        │
└──────────────┘                                        │  SQLAlchemy + SQLite│
                                                        └────────────────────┘
```

- **Auth**: session-cookie based. The API issues an `httponly` cookie on
  sign-in/sign-up; the browser sends it back with `credentials: "include"`.
  The Next.js middleware and Server Components validate the session by calling
  the API's `/api/auth/get-session` (forwarding the incoming cookie).
- **CORS**: the API allows the web origin (`http://localhost:3000` by default)
  with credentials enabled.
- **Response envelope**: every endpoint returns `{ "success": true, "data": ... }`
  or `{ "success": false, "error": "...", "code": "..." }`.

## Run with Docker Compose

The fastest way to run the whole stack:

```bash
cp .env.example .env      # optional: set a real AUTH_SECRET
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:8000 (docs at `/docs`)

On startup the API container runs Alembic migrations and idempotent seeding
(Kanban Admin + demo board), then serves the app. The SQLite database is
persisted in the `api-data` volume.

Compose variables (see `.env.example`):

| Variable | Default | Purpose |
|----------|---------|---------|
| `AUTH_SECRET` | dev placeholder | API auth secret |
| `PUBLIC_API_URL` | `http://localhost:8000` | Browser-facing API URL (baked into the web build) |
| `WEB_ORIGIN` | `http://localhost:3000` | Origin allowed by the API's CORS |

> Note: the web app uses two API URLs — `NEXT_PUBLIC_API_URL` for browser calls
> (`http://localhost:8000`) and `INTERNAL_API_URL` for server-side/middleware
> calls between containers (`http://api:8000`). Compose wires both automatically.

To stop and remove containers (keeping the database volume):

```bash
docker compose down
# add -v to also delete the database volume
```

## Quick start (without Docker)

Run the two services in separate terminals.

### 1. API (backend + database)

```bash
cd api
cp .env.example .env                     # then set a real AUTH_SECRET
uv venv && uv pip install -r requirements.txt   # or: python -m venv .venv && pip install -r requirements.txt
uv run alembic upgrade head              # create the SQLite schema
uv run python -m app.seeding.seed        # (optional) Kanban Admin + demo board
uv run uvicorn app.main:app --reload --port 8000
```

API is now at `http://localhost:8000` (interactive docs at `/docs`).

### 2. Web (frontend)

```bash
cd web
cp .env.example .env                     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

App is now at `http://localhost:3000`.

Sign up, and a demo board + a "crowded" stress-test board are provisioned for
your new account automatically.

## Migrating from the old monolith

The old SQLite database (Drizzle + Better Auth) is **not** reused. The API
manages its own schema via Alembic and its own auth (passwords are re-hashed
with PBKDF2), so existing users need to register again against the new API.

See [`api/README.md`](api/README.md) and [`web/README.md`](web/README.md) for
service-specific details.
