# MonoPilot

## Overview
Food Manufacturing MES system for small-to-medium food manufacturers (5-100 employees). Handles product lifecycle from formulation through production to shipping, with full traceability and quality management. Multi-tenant SaaS architecture.

**Positioning**: Cloud-native, easy-deploy MES - between Excel and enterprise ERP
**Pricing Model**: Freemium + $50/user/month

## Tech Stack
- Frontend: Next.js 15.5, React 19, TypeScript, TailwindCSS, ShadCN UI
- Backend: Supabase (PostgreSQL + Auth + RLS + Edge Functions)
- Validation: Zod schemas
- Cache: Redis
- Testing: Vitest (unit), Playwright (e2e)
- Monorepo: pnpm workspaces

## Project Structure
```
apps/frontend/
  app/(authenticated)/[module]/  - Module pages (45 pages)
  app/api/[module]/              - API routes (99 endpoints)
  lib/services/                  - Business logic (25+ services)
  lib/validation/                - Zod schemas (18 files)
  components/                    - UI components (70+)
docs/
  0-DISCOVERY/                   - Market research, competitive analysis
  1-BASELINE/product/            - PRD modules (11 modules, 13.5K lines)
supabase/
  migrations/                    - Database migrations (42 files)
  functions/                     - Edge functions
```

## Modules (11 Total)

### Core Modules (Epic 1-7)
| Epic | Module | PRD Lines | Code Status | Path |
|------|--------|-----------|-------------|------|
| 1 | Settings | 703 | ~80% Done | /settings/* |
| 2 | Technical | 772 | ~80% Done | /technical/* |
| 3 | Planning | 2,793 | ~70% Done | /planning/* |
| 4 | Production | 1,328 | ~60% Done | /production/* |
| 5 | Warehouse | 1,147 | Planned | /warehouse/* |
| 6 | Quality | 731 | Planned | /quality/* |
| 7 | Shipping | 1,345 | Planned | /shipping/* |

### Premium & New Modules (Epic 8-11)
| Epic | Module | PRD Lines | Code Status | Path |
|------|--------|-----------|-------------|------|
| 8 | NPD | 1,004 | Planned | /npd/* |
| 9 | Finance | 892 | Planned | /finance/* |
| 10 | OEE | 914 | NEW - Planned | /oee/* |
| 11 | Integrations | 1,647 | NEW - Planned | /integrations/* |

## Key Patterns
- **Multi-tenancy**: All tables have org_id, RLS on every query
- **License Plate (LP)**: Atomic inventory unit, no loose qty, full genealogy
- **BOM Snapshot**: WO captures BOM at creation, immutable
- **GS1 Compliance**: GTIN-14 products, GS1-128 lot/expiry, SSCC-18 pallets
- **FIFO/FEFO**: Pick suggestions by receipt date or expiry
- **API Routes**: /api/[module]/[resource]/[id]/[action]
- **Service Layer**: lib/services/*-service.ts
- **Validation**: Zod schemas in lib/validation/

## Key Files
- `.claude/PROJECT-STATE.md` - Current project state after context clear
- `.claude/PATTERNS.md` - Code patterns and conventions
- `.claude/TABLES.md` - Database schema reference (43 tables)
- `docs/1-BASELINE/product/prd.md` - PRD index (11 modules)
- `docs/0-DISCOVERY/FEATURE-GAP-ANALYSIS.md` - Competitive analysis

## Database
- **43 tables** organized by module
- **~100 RLS policies** for multi-tenancy
- **42 migrations** in supabase/migrations/

## Current Phase
**Phase**: PRD Complete | Ready for Implementation Planning
**Last Update**: 2025-12-10
**Next Steps**:
1. Create tech specs from PRDs
2. Generate stories for Epic 5 (Warehouse)
3. Continue Epic 4 (Production) implementation
