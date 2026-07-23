# RevCollect

AI-powered accounts receivable and collections dashboard. Review customer replies, approve AI-drafted follow-ups, and manage overdue invoices from a single inbox.

Built on [Next.js 16](https://nextjs.org), [shadcn/ui](https://ui.shadcn.com), and [Tailwind CSS v4](https://tailwindcss.com).

## Features

- **Inbox** — three-panel workflow: message list, thread + AI draft, customer context
- **Customers** — searchable table with collection status, balance, and days overdue
- **Aging report** — AR buckets (Current, 1–30, 31–60, 61–90, 90+)
- **Agent** — configure tone, escalation rules, and email signature
- **Settings** — workspace, integrations (Xero, Gmail, Stripe), billing
- **Onboarding** — connect email and accounting to get started

Mock data lives in one place today (`src/features/revcollect/mock-data.ts`) so the UI can be swapped to Supabase later without rewriting screens.

## Routes

| Route                       | Description                              |
| --------------------------- | ---------------------------------------- |
| `/`                         | Welcome / opening page                   |
| `/login`                    | Supabase sign-in                         |
| `/signup`                   | Supabase sign-up                         |
| `/auth/callback`            | Auth email confirmation callback         |
| `/inbox`                    | Collections inbox (default landing page) |
| `/customers`                | Customer list                            |
| `/customers/[id]`           | Customer detail, invoices, activity      |
| `/aging`                    | Aging report                             |
| `/agent`                    | AI agent configuration                   |
| `/settings`                 | General workspace settings               |
| `/settings/integrations`    | Xero, Gmail, Stripe                      |
| `/settings/billing`         | Plan and usage                           |
| `/onboarding`               | Setup checklist                          |
| `/onboarding/connect-gmail` | Gmail connect flow (step 1)              |
| `/onboarding/connect-xero`  | Xero connect flow (step 2)               |

## Tech stack

- **Framework** — Next.js 16 (App Router), React 19, TypeScript
- **UI** — shadcn/ui, Tailwind CSS v4, multi-theme support
- **Forms** — TanStack Form + Zod
- **Tables** — TanStack Table + nuqs URL state
- **State / data** — TanStack React Query (ready for Supabase service layer)
- **Command palette** — kbar

## Project structure

```plaintext
src/
├── app/
│   ├── (app)/                 # RevCollect routes (sidebar + header layout)
│   │   ├── inbox/
│   │   ├── customers/
│   │   ├── aging/
│   │   ├── agent/
│   │   ├── settings/
│   │   └── onboarding/
│   └── page.tsx               # redirects to /inbox
├── components/
│   ├── layout/                # Sidebar, header, page shell
│   ├── ui/                    # shadcn primitives + data table
│   └── themes/                # Theme system
└── features/revcollect/
    ├── mock-data.ts           # Single source of mock business data
    ├── types.ts
    ├── components/            # Shared UI (status pill, invoice card, etc.)
    ├── inbox/
    ├── customers/
    ├── aging/
    ├── agent/
    ├── settings/
    └── onboarding/
```

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 20+

### Install and run

```bash
git clone https://github.com/nextgrid-digital/RevCollect.git
cd RevCollect
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will land on **Inbox**.

### Bun not found?

Add to `~/.zshrc`:

```bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
```

Then run `source ~/.zshrc`.

### Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `bun run dev`   | Start development server |
| `bun run build` | Production build         |
| `bun run start` | Start production server  |
| `bun run lint`  | Run OxLint               |

## Environment variables

Copy `env.example.txt` to `.env.local` when you add Sentry or other integrations. RevCollect runs without auth or external services in mock-data mode.

Optional Sentry (disable in dev with `NEXT_PUBLIC_SENTRY_DISABLED="true"`).

## Data layer (current → Supabase)

Today, pages import from `src/features/revcollect/mock-data.ts` only — not from components inline.

When connecting Supabase, add:

```plaintext
src/features/revcollect/api/
├── types.ts
├── service.ts    # swap mock-data for Supabase queries
└── queries.ts    # React Query options + key factories
```

Components stay unchanged; only `service.ts` changes.

## Deploy

Production build uses Next.js standalone output. Dockerfiles are included (`Dockerfile`, `Dockerfile.bun`).

See [Next.js deployment docs](https://nextjs.org/docs/app/getting-started/deploying).

## License

Private — [Nextgrid Digital](https://nextgrid.digital)
