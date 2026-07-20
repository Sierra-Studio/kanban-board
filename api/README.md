# Kanban Board API

The backend and database for the Kanban Board, built with **FastAPI**,
**SQLAlchemy**, **Alembic**, and **SQLite**.

## Tech stack

- **Framework:** FastAPI
- **ORM:** SQLAlchemy 2.0
- **Migrations:** Alembic
- **Database:** SQLite
- **Server:** Uvicorn
- **Auth:** session cookies + PBKDF2 password hashing (stdlib only)

## Requirements

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (recommended) or `pip`

## Setup

```bash
cp .env.example .env
# Edit .env and set a strong AUTH_SECRET

# Create a virtualenv and install dependencies
uv venv
uv pip install -r requirements.txt
# (or) python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt

# Apply database migrations
uv run alembic upgrade head

# (Optional) seed the Kanban Admin system user + demo board
uv run python -m app.seeding.seed

# Run the dev server
uv run uvicorn app.main:app --reload --port 8000
```

Interactive API docs are available at `http://localhost:8000/docs`.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./kanban.db` | SQLAlchemy database URL |
| `AUTH_SECRET` | _(required)_ | Secret for auth material |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed browser origins |
| `SESSION_COOKIE_NAME` | `kanban_session` | Session cookie name |
| `SESSION_EXPIRES_DAYS` | `7` | Session lifetime in days |
| `COOKIE_SECURE` | `false` | Set `true` when serving over HTTPS |
| `ENVIRONMENT` | `development` | `development` \| `test` \| `production` |

## Database migrations (Alembic)

```bash
uv run alembic upgrade head                       # apply migrations
uv run alembic revision --autogenerate -m "msg"   # generate a new migration
uv run alembic downgrade -1                        # roll back one revision
```

## Project structure

```
api/
├── app/
│   ├── main.py            # FastAPI app, CORS, exception handlers
│   ├── config.py          # Pydantic settings (env)
│   ├── database.py        # SQLAlchemy engine/session, SQLite FK pragma
│   ├── models.py          # SQLAlchemy models (users, sessions, boards, columns, cards, ...)
│   ├── schemas.py         # Pydantic request bodies
│   ├── security.py        # password hashing, id/token generation
│   ├── auth_service.py    # sign-up / sign-in / sessions
│   ├── deps.py            # auth dependency + rate limiter
│   ├── responses.py       # success/list/error envelope helpers
│   ├── routers/           # auth, users, boards, columns, cards
│   ├── services/          # business logic (ported from the Node services)
│   └── seeding/           # Kanban Admin, demo board, crowded board, onboarding
├── alembic/               # migration environment + versions
├── alembic.ini
└── requirements.txt
```

## API endpoints

All responses use the envelope `{ "success": bool, "data"|"error": ... }`.
Protected routes require the session cookie and are rate limited to 120
requests/minute per user (or IP).

### Auth (`/api/auth`)
- `POST /sign-up` — `{ name, email, password }` → sets session cookie
- `POST /sign-in` — `{ email, password }` → sets session cookie
- `POST /sign-out` — clears session cookie
- `GET  /get-session` — current `{ user, session }` or `null`

### Users (`/api/user`) — protected
- `GET  /me`, `PATCH /me`, `POST /onboard`, `GET /{id}`

### Boards (`/api/boards`) — protected
- `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}`
- `POST /{id}/archive`, `POST /{id}/duplicate`, `GET /{id}/columns`
- `POST /{id}/columns` → 405 (column creation is disabled by design)

### Columns (`/api/columns`) — protected
- `PATCH /{id}`, `POST /{id}/collapse`, `POST /reorder`
- `DELETE /{id}` → 405 (column deletion is disabled by design)

### Cards — protected
- `GET|POST /api/columns/{columnId}/cards`
- `GET|PATCH|DELETE /api/cards/{id}`
- `POST /api/cards/{id}/move`, `POST /api/cards/reorder`, `POST /api/cards/{id}/duplicate`