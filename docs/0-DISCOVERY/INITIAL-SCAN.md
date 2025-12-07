# INITIAL-SCAN: MonoPilot

## Document Info
- **Version:** 2.0
- **Created:** 2025-12-06
- **Scan Agent:** DOC-AUDITOR (quick mode)
- **Scan Type:** Existing Project Migration

## Executive Summary
**MonoPilot** to aplikacja ERP/MES dla przemysłu produkcyjnego (food manufacturing). Projekt jest aktywnie rozwijany z ukończonymi Epic 1-3 (Settings, Technical, Planning) i trwającym Epic 4 (Production). Wykorzystuje Next.js 15 + Supabase + TypeScript.

## Project Structure Overview

```
MonoPilot/
├── apps/frontend/             # Next.js 15 Application
│   ├── app/                   # App Router (pages + API)
│   │   ├── (authenticated)/   # Protected routes
│   │   │   ├── dashboard/
│   │   │   ├── settings/
│   │   │   ├── technical/
│   │   │   ├── planning/
│   │   │   └── production/
│   │   ├── api/              # Route handlers
│   │   └── auth/             # Auth pages
│   ├── components/           # React components
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── settings/
│   │   ├── technical/
│   │   ├── planning/
│   │   └── production/
│   ├── lib/                  # Business logic
│   │   ├── services/         # Service layer (20+ services)
│   │   ├── validation/       # Zod schemas
│   │   ├── supabase/         # DB clients + migrations
│   │   └── cache/            # Redis caching
│   └── __tests__/            # Vitest tests
│
├── docs/                     # Documentation
│   ├── epics/                # Epic definitions (01-09)
│   ├── batches/              # Sprint batches with stories
│   ├── ux-design/            # UX specifications
│   ├── reference/            # Technical reference
│   ├── meta/                 # Retrospectives, reviews
│   └── helpers/              # Development guides
│
├── .claude/                  # Agent Methodology Pack
│   ├── agents/               # AI agents (ORCHESTRATOR, etc.)
│   ├── workflows/            # DISCOVERY-FLOW, EPIC-WORKFLOW
│   ├── patterns/
│   └── state/
│
└── scripts/                  # Automation scripts
```

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.1.4 | App Router, SSR |
| React | 19.0.0 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 3.4.1 | Styling |
| shadcn/ui | - | Component library |
| Supabase | 2.84.0 | PostgreSQL + Auth + RLS |
| Zod | 3.25.76 | Validation |
| Vitest | 4.0.12 | Testing |
| Playwright | 1.56.1 | E2E testing |
| pnpm | - | Package manager |

## Database Schema Summary

**Tables:** 47+ in public schema
**Multi-tenancy:** All tables with `org_id`
**RLS:** Enabled on all tables
**Migrations:** 51 SQL files applied

### Core Tables
- `organizations` - Tenant root
- `users` - User accounts (synced with auth.users)
- `warehouses` - Warehouse definitions
- `locations` - Storage locations
- `machines` - Production machines
- `production_lines` - Manufacturing lines
- `products` - Product catalog (RM, WIP, FG, PKG, BP)
- `boms` / `bom_items` - Bills of Materials
- `routings` / `routing_operations` - Production processes
- `purchase_orders` / `po_lines` - Purchasing
- `work_orders` - Production orders
- `license_plates` - Inventory tracking (LP/batch)

## Epic Status

| Epic | Name | Status | Batches |
|------|------|--------|---------|
| 1 | Settings | ✅ Complete | 01A-01E |
| 2 | Technical | ✅ Complete | 02A-02D |
| 3 | Planning | ✅ Complete | 03A-03C |
| 4 | Production | 🔄 In Progress | 04A-04C |
| 5 | Warehouse | 📋 Planned | - |
| 6 | Quality | 📋 Planned | - |
| 7 | Shipping | 📋 Planned | - |
| 8 | NPD | 📋 Planned | - |
| 9 | Performance | 📋 Planned | - |

## Existing Documentation

### Epic Definitions
- `docs/epics/01-settings.md` - Settings module
- `docs/epics/02-technical.md` - Technical/products
- `docs/epics/03-planning.md` - Planning/PO/TO
- `docs/epics/04-production.md` - Production/WO
- `docs/epics/06-quality.md` - Quality/QC
- `docs/epics/07-shipping.md` - Shipping
- `docs/epics/08-npd.md` - New Product Development
- `docs/epics/09-performance-optimization.md` - Performance

### Story Documentation
- `docs/batches/01A-auth-users/stories/` - 4 stories
- `docs/batches/01B-infrastructure-config/stories/` - 4 stories
- `docs/batches/01C-master-data/stories/` - 3 stories
- `docs/batches/01D-dashboards-ux/stories/` - 4 stories
- `docs/batches/01E-ui-redesign/stories/` - 4 stories
- `docs/batches/04B-2-output-registration/stories/`
- `docs/batches/04C-1-config-traceability/stories/`
- `docs/batches/05A-1-lp-core/stories/`
- `docs/batches/05A-2-lp-operations/stories/`
- `docs/batches/05A-3-receiving/stories/`

### Technical Reference
- `docs/reference/database-schema.md` - Full DB documentation
- `docs/reference/code-architecture.md` - Architecture guide
- `docs/reference/rls-and-supabase-clients.md` - RLS patterns
- `docs/reference/template-system-guide.md` - Component templates

### UX Design
- `docs/ux-design/ux-design-settings-module.md`
- `docs/ux-design/ux-design-technical-module.md`
- `docs/ux-design/ux-design-planning-po-module.md`
- `docs/ux-design/ux-design-production-module.md`
- `docs/ux-design/ux-design-warehouse-module.md`
- `docs/ux-design/ux-design-quality-module.md`
- `docs/ux-design/ux-design-shipping-module.md`
- `docs/ux-design/ux-design-npd-module.md`

### Development Helpers
- `docs/helpers/HE-development-guide.md`
- `docs/helpers/HE-code-review-common-errors.md`

### AI Helper Files (.claude/)
- `.claude/CLAUDE.md` - AI efficiency guide
- `.claude/FILE-MAP.md` - Project structure index
- `.claude/TABLES.md` - Database quick reference
- `.claude/PATTERNS.md` - Code patterns
- `.claude/PROMPTS.md` - Prompt templates

## Key Findings

### Strengths
1. **Well-documented** - Extensive epic/story/reference docs
2. **Clear architecture** - Layered service pattern
3. **Type-safe** - Full TypeScript with Zod validation
4. **Multi-tenant** - RLS-based org isolation
5. **Test coverage** - Vitest + Playwright setup
6. **AI-optimized** - Token efficiency guides

### Observations
1. **Migration in progress** - Agent Methodology Pack being integrated
2. **Epic 4 active** - Production module implementation ongoing
3. **BMAD structure** - Migrating to new doc organization (0-5 folders)
4. **Multiple doc systems** - Legacy (`docs/`) + new (`.claude/`, `docs/0-DISCOVERY/`)

### Questions for Discovery Interview
1. Jaki jest aktualny status Epic 4 (Production)?
2. Które stories są w trakcie implementacji?
3. Czy są blokery lub problemy techniczne?
4. Jakie są priorytety na najbliższy sprint?
5. Czy migracja do Agent Methodology Pack jest głównym celem?

## Gate: SCAN_COMPLETE

```
Condition: Initial project scan completed
Validation:
- [x] Project structure mapped
- [x] Existing documentation identified
- [x] Key files listed
- [x] Technology stack indicators noted

Status: PASSED
Next: Proceed to Phase 2 (Discovery Interview)
```

---
**Scan completed:** 2025-12-06
**Project:** MonoPilot (ERP/MES for food manufacturing)
**Next Phase:** Discovery Interview with DISCOVERY-AGENT
