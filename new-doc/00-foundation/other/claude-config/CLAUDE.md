# MonoPilot

## Overview
Food Manufacturing MES system for small-to-medium food manufacturers (5-100 employees). Handles product lifecycle from formulation through production to shipping, with full traceability and quality management. Multi-tenant SaaS architecture.

**Positioning**: Cloud-native, easy-deploy MES - between Excel and enterprise ERP
**Pricing Model**: Freemium + $50/user/month

## Tech Stack
- Frontend: Next.js 16, React 19, TypeScript, TailwindCSS, ShadCN UI
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

## Story Context Format (YAML)

**IMPORTANT**: Every story MUST have a `.context.yaml` file for AI agent consumption.

**Location**: `docs/2-MANAGEMENT/epics/current/{epic}/context/{story-id}.context.yaml`

**Lookup order** (agent reads first available):
1. `{story-id}.context.yaml` - Primary source
2. `{story-id}.md` - Story markdown (fallback)
3. Epic overview - General context
4. PRD/Architecture docs - Reference material

**Required YAML structure**:
```yaml
story:
  id: "XX.Y"
  name: "Story Name"
  epic: "XX-module-name"
  phase: "1A|1B|2|3"
  complexity: "S|M|L|XL"
  estimate_days: N

dependencies:
  required:
    - story: "XX.Y"
      provides: ["table_name", "service_name"]

files_to_read:
  prd: "path/to/prd.md"
  prd_sections: ["FR-XXX-NNN"]
  architecture: "path/to/arch.md"
  story: "path/to/story.md"
  patterns:
    - "path/to/example/file.ts"

files_to_create:
  database: [{path, type}]
  api: [{path, methods}]
  services: [{path}]
  validation: [{path}]
  pages: [{path}]
  components: [{path}]

database:
  tables:
    - name: "table_name"
      columns: ["col1", "col2"]
      rls: true|false
      indexes: ["col1"]

api_endpoints:
  - method: "GET|POST|PUT|DELETE|PATCH"
    path: "/api/..."
    auth: true|false
    roles: ["role1", "role2"]

ux:
  wireframes:
    - id: "SET-XXX"
      path: "path/to/wireframe.md"
      components: ["Component1", "Component2"]
  patterns:
    table: "ShadCN DataTable pattern"
    modal: "ShadCN Dialog pattern"
  states: ["loading", "empty", "error", "success"]

validation_rules:
  field_name: "validation description"

patterns:
  rls: "ADR-013"
  api: "REST with org_id filter"
  service: "class-based with static methods"
  validation: "zod schemas"

acceptance_checklist:
  - "Checklist item 1"
  - "Checklist item 2"

output_artifacts:
  - "Expected output 1"
  - "Expected output 2"
```

**UX in context**: Include UX references in same YAML file (not separate). Reference wireframe paths, don't duplicate content.

## Roadmap & Status
- **Quick status**: `.claude/NEXT-ACTIONS.yaml` (~55 lines, load this first)
- **Full details**: `.claude/IMPLEMENTATION-ROADMAP.yaml` (load only when needed)
- **Dashboard**: `.claude/PROJECT-DASHBOARD.md`

## Agent System (7 agents)
- **Orchestrator prompt**: `.claude/MASTER-PROMPT-FOR-AGENTS.md`
- **Agents**: `.claude/agents/` (planner, developer, tester, quality, documenter, devops, researcher)
- **Handoffs**: `.claude/handoffs/{STORY_ID}-frontend.md` / `-backend.md`
- **External AI**: Kimi K2.5 (KiloCode, frontend P3a), Codex CLI (backend P3b)
- **Codex instructions**: `AGENTS.md` (project root)

## Key Files
- `.claude/TECHNICAL-REFERENCE.md` - Database schema, patterns, API docs
- `.claude/SUPABASE-CONNECTION.md` - **Cloud Supabase connection guide**
- `docs/1-BASELINE/product/prd.md` - PRD index (11 modules)
- `docs/0-DISCOVERY/FEATURE-GAP-ANALYSIS.md` - Competitive analysis

## Database
- **43 tables** organized by module
- **~100 RLS policies** for multi-tenancy
- **26 migrations** in supabase/migrations/ (renumbered 001-026)

## Supabase Cloud Connection (2025-12-23)
**Status**: ✅ Connected and Synced

**Quick Connect**:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_6be6d9c3e23b75aef1614dddb81f31b8665794a3
npx supabase link --project-ref pgroxddbtaevdegnidaz
npx supabase db push
```

**Important**: Always export `SUPABASE_ACCESS_TOKEN` from `.env` before any Supabase CLI commands.

**Full Instructions**: See `.claude/SUPABASE-CONNECTION.md` for complete guide including:
- Authentication credentials
- Step-by-step connection
- Troubleshooting common issues
- Migration management
- Database verification

## Current Phase
**Phase**: Implementation (Epic 06-07 active, Epic 01-05 MVP complete)
**Last Update**: 2026-02-10
**Next Steps**: See `.claude/NEXT-ACTIONS.yaml`

## Auto-Update Rules

**IMPORTANT**: After EVERY session/run, you MUST:

1. **Update `.claude/PROJECT-STATE.md`**:
   - Update "Last Updated" timestamp
   - Add new commits to "Recent Commits" section
   - Update "Current Status" if phase changed
   - Update module status table if applicable

2. **Declare at end of each run**:
   ```
   ## Session Summary
   ### Done:
   - [list completed tasks]

   ### To Fix/Continue:
   - [list pending issues or next steps]

   ### Commits:
   - [hash] - [message]
   ```

This ensures nothing is lost between sessions and context is preserved.
