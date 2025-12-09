# INITIAL-SCAN: MonoPilot (Manufacturing ERP)

## Document Info
- **Version:** 2.0
- **Created:** 2025-12-09
- **Scan Agent:** DISCOVERY-AGENT (brownfield mode)
- **Scan Type:** Brownfield Project - Existing Codebase Analysis
- **Project Type:** Manufacturing ERP (MES/MOM System)

## Executive Summary
**MonoPilot** is an advanced manufacturing ERP system focused on food manufacturing. It's a comprehensive MES/MOM (Manufacturing Execution System / Manufacturing Operations Management) platform built with Next.js 15, React 19, TypeScript, and Supabase.

**Current State:** Production-ready system with multiple completed epics covering Settings, Technical, Planning, Production, and Warehouse modules. Active refactoring to cleanup documentation and agent methodology.

## Project Structure Overview

```
MonoPilot/
├── CLAUDE.md                    # Project configuration (template - needs update)
├── PROJECT-STATE.md             # Sprint state tracking (template)
├── package.json                 # Monorepo root
├── .gitignore                   # Git configuration
│
├── .claude/                     # Agent Methodology Pack integration
│   └── agents/
│       └── ORCHESTRATOR.md      # Task routing agent
│
├── apps/
│   └── frontend/                # Next.js 15 application
│       ├── app/                 # App router structure
│       │   ├── (authenticated)/ # Protected routes
│       │   │   ├── dashboard/
│       │   │   ├── settings/    # Settings module
│       │   │   ├── technical/   # Products, BOMs, Routings, Tracing
│       │   │   ├── planning/    # PO, TO, WO management
│       │   │   ├── production/  # Production execution
│       │   │   ├── warehouse/   # LP, ASN, GRN, Inventory
│       │   │   └── scanner/     # Mobile scanner workflows
│       │   ├── login/
│       │   ├── signup/
│       │   └── forgot-password/
│       ├── components/          # React components (100+ files)
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── settings/
│       │   ├── technical/
│       │   ├── planning/
│       │   ├── production/
│       │   ├── warehouse/
│       │   ├── scanner/
│       │   ├── ui/              # shadcn/ui components
│       │   └── common/
│       ├── lib/                 # Business logic
│       │   ├── supabase/
│       │   │   └── migrations/  # 57+ database migrations
│       │   ├── services/        # Business services
│       │   ├── validation/      # Zod schemas
│       │   ├── scanner/         # Offline-first scanner logic
│       │   └── config/
│       └── package.json
│
├── docs/                        # BMAD documentation structure
│   ├── 0-DISCOVERY/             # Project understanding
│   │   ├── INITIAL-SCAN.md      # This file
│   │   ├── PROJECT-UNDERSTANDING.md
│   │   └── GAPS-AND-QUESTIONS.md
│   ├── 1-BASELINE/              # Foundation (previously had architecture + product docs)
│   ├── 2-MANAGEMENT/            # Project management (epics deleted in refactor)
│   ├── 3-ARCHITECTURE/          # Design artifacts (UX specs deleted in refactor)
│   ├── 4-DEVELOPMENT/           # Implementation (batches/stories deleted in refactor)
│   └── 5-ARCHIVE/               # Historical documents
│
└── scripts/                     # Project scripts
    └── seed-first-admin.mjs     # Admin seeding script
```

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1.4 | React framework with App Router |
| **React** | 19.0.0 | UI library |
| **TypeScript** | 5.9.3 | Type safety |
| **Tailwind CSS** | 3.4.1 | Styling |
| **shadcn/ui** | Latest | Component library (Radix UI based) |
| **React Hook Form** | 7.66.1 | Form management |
| **Zod** | 3.25.76 | Schema validation |
| **Lucide React** | 0.554.0 | Icons |
| **date-fns** | 4.1.0 | Date manipulation |
| **react-flow** | 11.11.4 | Genealogy tree visualization |
| **qrcode** | 1.5.4 | QR code generation for labels |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Supabase** | 2.84.0 | BaaS (Auth, Database, RLS, Edge Functions) |
| **PostgreSQL** | Latest (via Supabase) | Relational database |
| **RLS (Row Level Security)** | Native PostgreSQL | Multi-tenancy enforcement |

### Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | 4.0.12 | Unit testing |
| **Playwright** | 1.49.0 | E2E testing |
| **Testing Library** | 16.3.0 | Component testing |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| **pnpm** | 8.15.0 | Package manager |
| **ESLint** | 9 | Linting |
| **Husky** | Latest | Git hooks |
| **lint-staged** | 16.2.7 | Pre-commit linting |

## Existing Documentation

### Discovery Documentation (docs/0-DISCOVERY/)
| File | Status | Notes |
|------|--------|-------|
| INITIAL-SCAN.md | ⚠️ Outdated | Was for agent-methodology-pack, now updated |
| PROJECT-UNDERSTANDING.md | ⚠️ Outdated | Was for agent-methodology-pack, needs update |
| GAPS-AND-QUESTIONS.md | ⚠️ Outdated | Was for agent-methodology-pack, needs update |

### Baseline Documentation (docs/1-BASELINE/)
| Category | Files | Status |
|----------|-------|--------|
| Product | prd.md, project-brief.md, user-stories.md | 🟡 Placeholder files |
| Architecture | (deleted in refactor) | 🔴 Missing - previously had architecture overview, ADRs, module docs, patterns |
| Reference | (deleted in refactor) | 🔴 Missing - previously had API contracts, DB schema, code architecture |

### Management Documentation (docs/2-MANAGEMENT/)
| Category | Status | Notes |
|----------|--------|-------|
| Epics | 🔴 Deleted | Previously had 9 epics (5 completed, 4 current) |
| Sprints | 🔴 Deleted | Previously had sprint status and planning docs |

### Architecture Documentation (docs/3-ARCHITECTURE/)
| Category | Status | Notes |
|----------|--------|-------|
| UX Specs | 🔴 Deleted | Previously had 20+ UX design documents |

### Development Documentation (docs/4-DEVELOPMENT/)
| Category | Status | Notes |
|----------|--------|-------|
| Batches/Stories | 🔴 Deleted | Previously had implementation batches with tech specs and stories |
| Testing | 🔴 Deleted | Previously had test strategies |

## Database Schema Overview

### Core Tables (from migrations)
Based on 57 migration files, the system includes:

**Multi-tenancy & Auth:**
- `organizations` - Tenant isolation
- `users` - User accounts with RLS
- `user_sessions` - Session tracking
- `user_invitations` - Invitation system
- `user_preferences` - User settings

**Settings Module (Epic 1):**
- `warehouses` - Warehouse definitions
- `locations` - Storage locations
- `machines` - Production machines
- `production_lines` - Production line configurations
- `allergens` - EU allergen tracking
- `tax_codes` - Tax code management
- Various settings tables (planning, production, warehouse)

**Technical Module (Epic 2):**
- `products` - Product master data (RM, WIP, FG, PKG, BP)
- `product_allergens` - Product-allergen relationships
- `routings` - Production routing definitions
- `routing_operations` - Operations in routing
- `product_routings` - Product-routing assignments
- `boms` - Bill of Materials headers
- `bom_items` - BOM line items
- `lp_genealogy` - License plate genealogy tracking
- `traceability_links` - Traceability relationships
- `recall_simulations` - Recall simulation data

**Planning Module (Epic 3):**
- `suppliers` - Supplier master data
- `supplier_products` - Supplier-product catalog
- `purchase_orders` - Purchase orders
- `po_lines` - PO line items
- `po_approvals` - Approval workflow
- `transfer_orders` - Transfer orders
- `to_lines` - TO line items
- `to_line_lps` - LP assignments to TO lines
- `work_orders` - Production work orders
- `wo_materials` - WO material requirements
- `wo_operations` - WO operations

**Production Module (Epic 4):**
- `wo_material_reservations` - Material reservations
- `wo_consumption` - Consumption transactions
- `production_outputs` - Output registration
- `lp_movements` - License plate movements

**Warehouse Module (Epic 5):**
- `license_plates` - License plate tracking
- `asns` - Advanced Shipment Notices
- `asn_items` - ASN line items
- `grns` - Goods Receipt Notes
- `grn_lines` - GRN line items
- `pallets` - Pallet management
- `inventory_counts` - Cycle counting

### Key Features
- **Row Level Security (RLS):** All tables enforce `org_id` isolation
- **Audit Trail:** `created_at`, `updated_at`, `created_by`, `updated_by` on most tables
- **Versioning:** BOM and routing versioning with date effective ranges
- **Genealogy:** Comprehensive tracking via `lp_genealogy` and `traceability_links`
- **Soft Deletes:** Status-based archiving (not hard deletes)

## Implemented Modules

### Module Structure (from routes analysis)
Based on 60+ page routes identified:

1. **Settings Module** (`/settings`)
   - Organization setup
   - User management + invitations
   - Warehouses & locations
   - Machines & production lines
   - Allergens & tax codes
   - Module configuration
   - Wizard setup flow

2. **Technical Module** (`/technical`)
   - Products (CRUD + versioning)
   - BOMs (clone, compare, versioning)
   - Routings (operations management)
   - Tracing (genealogy tree view)
   - Allergen management

3. **Planning Module** (`/planning`)
   - Suppliers
   - Purchase Orders (fast flow workflow)
   - Transfer Orders
   - Work Orders (spreadsheet view)
   - Material availability panel

4. **Production Module** (`/production`)
   - Production dashboard
   - WO lifecycle (start, pause, resume, complete)
   - Material reservations
   - Consumption enforcement
   - Output registration
   - Operation tracking

5. **Warehouse Module** (`/warehouse`)
   - License Plates
   - ASNs (Advanced Shipment Notice)
   - Receiving (PO + TO)
   - Inventory management
   - Pallets
   - Inventory counting

6. **Scanner Module** (`/scanner`)
   - Offline-first architecture (IndexedDB + sync engine)
   - Production workflows (entry, output)
   - Warehouse workflows (receive, putaway, pick, move)
   - Barcode scanning
   - Session persistence

## Key Architectural Patterns

### Frontend Architecture
- **App Router:** Next.js 15 with App Router (not Pages Router)
- **Server Components:** Extensive use of React Server Components
- **Form Handling:** React Hook Form + Zod validation
- **State Management:** React hooks + Server Actions
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS with custom design system

### Backend Architecture
- **Multi-tenancy:** Enforced via RLS at database level
- **Authentication:** Supabase Auth with JWT claims (`org_id` in token)
- **Authorization:** RLS policies check `org_id` from JWT
- **API:** Server Actions + Supabase client (service role for admin operations)
- **Offline-first:** Scanner workflows use IndexedDB + background sync

### Scanner Architecture
- **IndexedDB:** Local storage for offline transactions
- **Sync Engine:** Background sync when online
- **Network Monitor:** Detects online/offline state
- **Session Store:** Persistent workflow sessions
- **Workflow Definitions:** Declarative workflow configuration

## Module Status

Based on git history analysis (from commit messages):

| Epic | Module | Status | Last Activity |
|------|--------|--------|---------------|
| Epic 1 | Settings | ✅ Complete | 2025-11-xx |
| Epic 2 | Technical | ✅ Complete | 2025-11-xx |
| Epic 3 | Planning | ✅ Complete | 2025-11-xx |
| Epic 4 | Production | ✅ Complete | 2025-12-xx |
| Epic 5 | Warehouse | 🟡 Partial | 2025-12-xx (Stories 5.23-5.27 completed) |
| Epic 6 | Quality | ⚪ Not Started | - |
| Epic 7 | Shipping | ⚪ Not Started | - |
| Epic 8 | NPD | ⚪ Not Started | - |
| Epic 9 | Performance | ⚪ Not Started | - |

## Recent Activity

### Latest Commits (from git log)
```
ade7508 Update agent-methodology-pack submodule
a55d9c2 simple messafe
b7cb2c2 feat: Implement Scanner UI for Stories 5.23-5.27
6e41ca8 feat: Implement Scanner Core API for Stories 5.23-5.27
249f427 feat: Complete Stories 4.9-4.14 - Consumption & Output Registration
```

### Current Branch
- **Branch:** `refactor-doc-i-nowi-agenci`
- **Main:** `main`
- **Status:** Large refactor in progress (deletion of .bmad structure, docs reorganization)

## Observations

### What Works Well
1. ✅ **Solid tech stack** - Modern, production-ready technologies
2. ✅ **Multi-tenancy** - Enforced at database level via RLS
3. ✅ **Comprehensive database** - 57 migrations, well-structured schema
4. ✅ **Module coverage** - 5 out of 9 planned modules implemented
5. ✅ **Offline-first scanner** - Advanced IndexedDB + sync engine
6. ✅ **Component library** - 100+ components, consistent UI
7. ✅ **Testing setup** - Vitest + Playwright configured

### What Needs Attention
1. ⚠️ **Documentation gaps** - Massive deletion of docs in recent refactor
2. ⚠️ **CLAUDE.md outdated** - Still shows template values
3. ⚠️ **PROJECT-STATE.md outdated** - Still shows template values
4. ⚠️ **No epic documentation** - All epics deleted from docs/2-MANAGEMENT/
5. ⚠️ **No architecture docs** - ADRs, architecture overview deleted
6. ⚠️ **No UX specs** - All UX design docs deleted
7. ⚠️ **No story documentation** - Implementation batches deleted
8. ⚠️ **No API documentation** - API contracts deleted
9. ⚠️ **Incomplete warehouse module** - Epic 5 partially done

### Critical Gaps
1. 🔴 **No product requirements** - PRD, user stories are placeholders
2. 🔴 **No architecture documentation** - System architecture undocumented
3. 🔴 **No module documentation** - Feature documentation missing
4. 🔴 **No implementation guide** - Development docs deleted
5. 🔴 **No test documentation** - Test strategy missing

## Questions for Discovery Interview

### Business Context
1. What is the primary business goal of MonoPilot? (food manufacturing ERP - confirmed from metadata)
2. Who are the target users? (manufacturers - inferred)
3. What is the current deployment status? (development/staging/production?)
4. What are the immediate priorities? (complete Epic 5? start Epic 6? stabilize?)

### Technical Context
5. Why was the documentation deleted? (intentional cleanup? fresh start?)
6. Should we recreate minimal docs or comprehensive docs?
7. What is the strategy for remaining epics (6-9)?
8. Are there any known technical debt items?

### Scope Context
9. What is the MVP scope? (Epics 1-5? Or full system?)
10. What features are explicitly out of scope?
11. What is the timeline for remaining work?

### Next Steps
12. Should DISCOVERY-AGENT proceed to recreate PROJECT-UNDERSTANDING.md?
13. Should we document existing epics based on codebase analysis?
14. Should we create architecture documentation from schema?

## Gate: SCAN_COMPLETE

```
Condition: Initial brownfield project scan completed
Validation:
- [x] Project structure mapped
- [x] Tech stack identified
- [x] Existing implementation analyzed (modules, routes, components)
- [x] Database schema reviewed (57 migrations)
- [x] Documentation gaps identified
- [x] Recent activity analyzed

Status: ✅ PASSED
Next: Phase 2 - Discovery Interview (standard mode)
      Focus: Fill documentation gaps, understand priorities
```

---
**Scan completed:** 2025-12-09
**Next Phase:** Discovery Interview with user to clarify scope and priorities
**Recommended depth:** standard (2-3 rounds, 14-21 questions)
