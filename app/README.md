# MonoPilot - Manufacturing Execution System

Next.js 15 application for food manufacturing MES.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.7
- **Styling**: Tailwind CSS 3.4
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Package Manager**: pnpm 8.15+

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Environment Setup

Create `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5000](http://localhost:5000) with your browser.

### Build

```bash
pnpm build
pnpm start
```

## Project Structure

```
app/
├── app/              # Next.js App Router pages
│   ├── api/         # API routes
│   ├── login/       # Authentication pages
│   ├── layout.tsx   # Root layout
│   └── page.tsx     # Home page
├── components/       # React components
├── lib/             # Utilities and API layer
│   ├── api/         # API classes (e.g., WorkOrdersAPI)
│   ├── supabase/    # Supabase clients
│   └── types.ts     # TypeScript types
├── public/          # Static assets
└── middleware.ts    # Authentication middleware
```

## Key Features

- Multi-tenant architecture with org_id isolation
- Row Level Security (RLS) policies
- Server-side authentication with Supabase
- TypeScript type safety
- API layer pattern for data access

## Commands

- `pnpm dev` - Start development server (port 5000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - TypeScript type checking
