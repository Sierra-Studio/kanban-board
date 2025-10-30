# Kanban Board

A modern, full-stack Kanban board application with drag-and-drop functionality, built with Next.js 15, Better Auth, and Drizzle ORM.

## Features

- 📋 Board Management - Create and manage multiple boards
- 📝 Column & Card Management - Organize tasks with customizable columns
- 🎯 Drag & Drop - Intuitive card movement with visual drop indicators
- 👥 User Management - Role-based access control (Owner, Admin, Member, Viewer)
- 🔐 Authentication - Secure email/password authentication with Better Auth
- 🎨 Modern UI - Clean interface built with Base UI and Tailwind CSS

## Tech Stack

- **Framework:** Next.js 15.2 (App Router)
- **Language:** TypeScript
- **Authentication:** Better Auth
- **Database:** SQLite with Drizzle ORM
- **API:** Hono
- **Styling:** Tailwind CSS 4.0
- **UI Components:** Base UI
- **Icons:** Lucide React
- **Package Manager:** Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed on your machine
- Node.js 20+ (for compatibility)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd kanban-challenge
```

2. **Install dependencies**

```bash
bun install
```

3. **Set up environment variables**

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

```env
# Database
DATABASE_URL="file:./sqlite.db"

# Better-Auth Configuration
# Generate a secret with: openssl rand -base64 32
BETTER_AUTH_SECRET="your-secret-key-min-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

**Important:** Generate a secure secret for `BETTER_AUTH_SECRET`:

```bash
openssl rand -base64 32
```

4. **Set up the database**

Push the database schema:

```bash
bun run db:push
```

This will create the SQLite database and all necessary tables.

5. **Run the development server**

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run lint:fix` - Fix ESLint errors
- `bun run typecheck` - Run TypeScript type checking
- `bun run format:check` - Check code formatting
- `bun run format:write` - Format code with Prettier
- `bun run db:push` - Push database schema changes
- `bun run db:generate` - Generate Drizzle migrations
- `bun run db:studio` - Open Drizzle Studio (database GUI)

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   └── (dashboard)/       # Dashboard pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── sidebar/          # Sidebar navigation
├── lib/                   # Utilities and API clients
│   └── api/              # API request functions
├── server/                # Backend code
│   ├── api/              # Hono API routes
│   ├── auth/             # Better Auth configuration
│   ├── db/               # Drizzle ORM setup
│   └── services/         # Business logic services
└── styles/                # Global styles
```

## Usage

1. **Sign up** for an account at `/sign-up`
2. **Sign in** at `/sign-in`
3. **Create a board** from the sidebar
4. **Add columns** to organize your workflow
5. **Create cards** and drag them between columns
6. **Invite team members** (coming soon)

## Development

### Database Management

View and edit your database using Drizzle Studio:

```bash
bun run db:studio
```

### Code Quality

Before committing, ensure your code passes all checks:

```bash
bun run check
```

This runs both linting and type checking.

## License

MIT
