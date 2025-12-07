# ADR-003: Technology Stack Selection

## Status
Accepted

## Date
2025-10-15

## Context
Selecting technology stack for MonoPilot - a food manufacturing ERP system requiring:
- Multi-tenant SaaS architecture
- Real-time updates for production floor
- Mobile-friendly for scanner operations
- Strong authentication and authorization

## Decision

### Frontend
- **Next.js 15** - App Router with Server Components
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library (Radix primitives)
- **react-hook-form** - Form handling
- **TanStack Table** - Data tables

### Backend
- **Supabase** - PostgreSQL + Auth + Realtime + Storage
- **Next.js API Routes** - API layer (when needed)
- **Row Level Security** - Authorization at DB level

### Infrastructure
- **Vercel** - Frontend hosting (planned)
- **Supabase Cloud** - Database hosting
- **pnpm** - Package manager
- **Turborepo** - Monorepo tooling

## Consequences

### Positive
- Full TypeScript across stack
- Supabase handles auth, realtime, storage
- RLS provides security at data layer
- shadcn/ui = accessible, customizable components
- Server Components reduce client bundle

### Negative
- Supabase vendor lock-in for auth/realtime
- Next.js 15 App Router still maturing
- RLS complexity for cross-org features

## Alternatives Considered

| Alternative | Pros | Cons | Why Not |
|-------------|------|------|---------|
| Prisma + PostgreSQL | More control | More setup, no realtime | Supabase faster to market |
| tRPC | Type-safe API | Additional layer | Supabase client sufficient |
| Material UI | More components | Larger bundle, opinionated | shadcn more flexible |

---
*Tech stack frozen for v1. Re-evaluate post-launch.*
