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

## Cache System (Active)
**Status**: Fully Operational (95% token savings)
- **5 Layers**: Claude Prompt Cache, Hot, Cold, Semantic, Global KB
- **Global KB**: 20 agents + 51 skills available at `~/.claude-agent-pack/global/`
- **Commands**: `cache-stats.sh`, `cache-test.sh`, `cache-clear.sh`
- **Agents**: BACKEND-DEV, FRONTEND-DEV, ARCHITECT-AGENT, CODE-REVIEWER, etc.
- **Skills**: 52 skills (API, Next.js, React, Supabase, Testing, TypeScript)

## Current Phase
**Phase**: UX Design Complete (Settings) | Ready for Implementation
**Last Update**: 2025-12-11
**Next Steps**:
1. Implement Settings wireframes (SET-001 to SET-029)
2. Continue UX for Technical/Production/Warehouse modules
3. Create PR from newDoc to main

## Auto-Update Rules

**IMPORTANT**: After EVERY git commit, you MUST update `.claude/PROJECT-STATE.md`:
1. Update "Last Updated" timestamp
2. Add new commit to "Recent Commits" section
3. Update "Current Status" if phase changed
4. Update module status table if applicable

This ensures context is preserved across sessions.
