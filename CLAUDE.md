# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MonoPilot** (forza-mes) is a Manufacturing Execution System (MES) for food manufacturing, built as a pnpm monorepo with Next.js 15, React 19, TypeScript 5.7, and Supabase (PostgreSQL).

**Core domain**: Purchase Orders, Transfer Orders, Work Orders, Bill of Materials (with versioning), License Plate inventory tracking, ASN receiving, production execution, and full forward/backward traceability (genealogy).

## Essential Commands

```bash
# Installation & Setup
pnpm install:all                    # Install all dependencies
pnpm gen-types                      # Generate Supabase TypeScript types (requires SUPABASE_PROJECT_ID env var)

# Development
pnpm frontend:dev                   # Start Next.js dev server on port 5000
pnpm dev                            # Start all apps in parallel

# Build & Quality
pnpm build                          # Build all apps
pnpm lint                           # Lint all workspaces
pnpm lint:fix                       # Auto-fix linting issues
pnpm type-check                     # TypeScript type checking across all workspaces

# Testing
pnpm test:unit                      # Run Vitest unit tests
pnpm test:e2e:critical              # Run critical E2E tests (auth, PO, TO)
pnpm test:e2e:ui                    # Run Playwright in UI mode
pnpm test:e2e:auth                  # Run authentication tests only
pnpm test:e2e:po                    # Run purchase order tests only
pnpm test:e2e:to                    # Run transfer order tests only

# Documentation & Code Generation
pnpm docs:update                    # Auto-generate API_REFERENCE.md, DATABASE_SCHEMA.md, DATABASE_RELATIONSHIPS.md
pnpm gen-types                      # Generate TypeScript types from Supabase schema

# Pre-commit/Pre-push
pnpm pre-commit                     # Type-check, update docs, gen types, lint-staged
pnpm pre-push                       # Run all tests

# BMAD Method (AI-driven development)
pnpm bmad                           # Run BMAD Method CLI
pnpm bmad:status                    # Check current epic/phase status
pnpm bmad:list                      # List available workflows
```

## High-Level Architecture

### Monorepo Structure
- `apps/frontend/` - Next.js 15 App Router application (main MES app)
- `apps/backend/` - Placeholder for future backend services
- `packages/shared/` - Shared TypeScript types and Zod schemas
- `docs/` - 30+ documentation files (business flows, architecture, modules, epics)
- `scripts/` - Build and documentation generation scripts
- `.bmad/` - BMAD Method tooling for AI-driven development

### Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4
- **Backend/Database**: Supabase (PostgreSQL, Auth, RLS, Real-time)
- **State**: React Context, SWR for data fetching
- **Validation**: Zod schemas
- **Testing**: Playwright (100+ E2E tests), Vitest (unit tests)
- **Package Manager**: pnpm 8.15 (workspaces)
- **Deployment**: Vercel (standalone output)

### API Layer Pattern

**Class-based API services** in `apps/frontend/lib/api/`:
```typescript
// Example: WorkOrdersAPI, PurchaseOrdersAPI, etc.
class WorkOrdersAPI {
  static async getAll(filters?): Promise<WorkOrder[]>
  static async getById(id): Promise<WorkOrder | null>
  static async create(data): Promise<WorkOrder>
  static async update(id, data): Promise<WorkOrder>
  // 15+ methods per API
}
```

**28 API classes**: AllergensAPI, ASNsAPI, AuditAPI, BomHistoryAPI, BomsAPI, ConsumeAPI, LicensePlatesAPI, LocationsAPI, MachinesAPI, ProductsAPI, PurchaseOrdersAPI, RoutingsAPI, SuppliersAPI, TaxCodesAPI, TraceabilityAPI, TransferOrdersAPI, UsersAPI, WarehousesAPI, WorkOrdersAPI, YieldAPI, etc.

### Data Flow
```
UI Components → API Classes → Supabase Client → PostgreSQL (40+ tables)
                                ↓
                           RLS Policies (org_id enforcement)
```

### Authentication & Multi-Tenancy
- **Supabase Auth** with session-based JWT tokens
- **Row Level Security (RLS)**: Every business table has `org_id` column with automatic tenant isolation
- **Middleware**: `apps/frontend/middleware.ts` handles session refresh and auth checks
- **RBAC**: 7 roles (Admin, Manager, Operator, Viewer, Planner, Technical, Purchasing, Warehouse, QC)
- **Protected routes**: All except `/login`, `/signup`

### Module Boundaries (App Router Pages)
1. **Technical** (`/technical`) - Products, BOMs (with versioning), Routings, Allergens
2. **Planning** (`/planning`) - Purchase Orders, Transfer Orders, Work Orders
3. **Production** (`/production`) - WO execution, operations, yield, by-products
4. **Warehouse** (`/warehouse`) - ASN receiving, GRN, License Plates, stock moves, pallets
5. **Scanner** (`/scanner`) - Mobile terminal UI (process/pack flows)
6. **Settings** (`/settings`) - Warehouses, locations, machines, suppliers, users

## Key Architectural Patterns & Business Rules

### 1. License Plate (LP) Pattern
- **LP is the atomic unit of inventory** (no loose qty tracking)
- Full genealogy: `parent_lp_id`, `consumed_by_wo_id` for traceability
- FIFO/FEFO support with `expiry_date`, `manufacture_date`
- Batch tracking: `batch_number`, `po_number`, `supplier_batch_number`

### 2. BOM Snapshot Pattern (Immutability)
- When WO is created, **BOM is snapshot into `wo_materials` table**
- Includes: qty, UoM, scrap%, `consume_whole_lp` flag, allergens, product_version, bom_version
- Prevents mid-production recipe changes

### 3. Multi-Version BOM (Date-Based)
- Multiple BOM versions per product with `effective_from` / `effective_to` date ranges
- **Database trigger prevents overlapping dates** for same product
- Automatic BOM selection based on WO `scheduled_date`
- Visual timeline UI in BOM management
- BOM lifecycle: Draft → Active → Phased Out → Inactive

### 4. 1:1 (Consume Whole LP) Pattern
- Flag on BOM items: `consume_whole_lp`
- Enforces **full LP consumption** (no partial splits)
- Critical for allergen control and traceability
- Scanner blocks partial consumption when flag is set

### 5. Warehouse vs Location Distinction
- **Transfer Orders**: Between warehouses (`from_wh_id`, `to_wh_id`) - no location in header
- **Stock Moves**: Between locations (`from_location_id`, `to_location_id`)
- Transit location concept for in-transit inventory
- Policy enforced in `bmad.structure.yaml`: `transfer_orders.mode: warehouse_based`

### 6. UoM Handling
- **No automatic conversions** between units of measure
- Scanner validates UoM matches before operations
- UoM preserved throughout lifecycle: PO → GRN → LP → Consume → Output

### 7. Quick PO Entry Workflow
- Specialized rapid data entry for known suppliers
- Pre-fills: currency, tax codes, lead times, default location per warehouse
- Documented in `docs/QUICK_PO_ENTRY_IMPLEMENTATION.md`

## Epic-Based Development

Projects use **BMAD Method** (AI-driven development) with structured epics/phases:
- **Epic → Phase → Implementation → E2E Tests → Summary**
- Documented in `docs/EPIC-*_PHASE-*_SUMMARY.md`
- Quality gates defined in `bmad.structure.yaml`
- Automated doc generation via `pnpm docs:update`

**Recent Epics:**
- EPIC-001: BOM Complexity (by-products, multi-version BOMs) - Complete
- EPIC-002: Scanner & Warehouse v2 (ASN, receiving, genealogy) - Phase 1 in progress

## Database Architecture (40+ Tables)

### Core Patterns:
1. **Multi-tenant**: `org_id` on all business tables with RLS policies
2. **Audit trail**: `created_by`, `updated_by`, `created_at`, `updated_at` on most tables
3. **Status lifecycles**: `bom_status`, `wo_status`, `po_status`, etc. (enums)
4. **Genealogy**: `lp_genealogy` table tracks parent-child relationships and consumption

### Key Table Groups:
- **Products & BOMs**: `products`, `boms` (versioned), `bom_items`, `bom_history`
- **Planning**: `po_header`, `po_line`, `to_header`, `to_line`, `work_orders`, `wo_materials`, `wo_operations`, `wo_by_products`
- **Inventory**: `license_plates`, `lp_reservations`, `lp_compositions`, `lp_genealogy`, `stock_moves`
- **Warehouse**: `asns`, `asn_items`, `grns`, `grn_items`, `pallets`, `pallet_items`
- **Production**: `production_outputs`, `routings`, `routing_operations`
- **Settings**: `warehouses`, `locations`, `machines`, `production_lines`, `suppliers`, `allergens`
- **Audit**: `audit_log`

### Migrations:
- 85+ SQL migrations in `apps/frontend/lib/supabase/migrations/`
- Sequential naming: `001_description.sql`, `002_description.sql`, etc.
- Tracked in `docs/13_DATABASE_MIGRATIONS.md`

## Naming Conventions

### Database:
- Tables: `snake_case` (`work_orders`, `license_plates`)
- Enums: lowercase with underscores (`bom_status`, `product_type`)
- Indexes: `idx_<table>_<column>`
- Foreign keys: `fk_<table>_<column>`

### Code:
- Components: `PascalCase` (`WorkOrdersTable.tsx`)
- API Classes: `PascalCase` + `API` suffix (`WorkOrdersAPI`)
- API Routes: `kebab-case` (`/api/work-orders`)
- Types: `PascalCase` (`WorkOrder`, `PurchaseOrder`)

### Files:
- Components: `ComponentName.tsx`
- API routes: `apps/frontend/app/api/<resource>/route.ts`
- API classes: `apps/frontend/lib/api/<ResourceName>API.ts`
- Migrations: `NNN_description.sql`

## Critical Files to Understand

### Configuration:
- `bmad.structure.yaml` - Project structure, quality gates, workflows, policies
- `apps/frontend/lib/api/config.ts` - API configuration (mock mode, error handling)
- `apps/frontend/middleware.ts` - Authentication middleware (session refresh, redirects)

### Type Definitions:
- `apps/frontend/lib/types.ts` - Core domain types
- `apps/frontend/lib/supabase/generated.types.ts` - Auto-generated from Supabase (via `pnpm gen-types`)
- `packages/shared/src/schemas.ts` - Shared Zod validation schemas

### Database:
- `apps/frontend/lib/supabase/client.ts` - Browser Supabase client
- `apps/frontend/lib/supabase/server.ts` - Server-side Supabase client
- `apps/frontend/lib/supabase/migrations/` - All SQL migrations

### Documentation (Essential Reading Order):
1. `docs/01_SYSTEM_OVERVIEW.md` - High-level architecture
2. `docs/11_PROJECT_STRUCTURE.md` - File organization
3. `docs/03_APP_GUIDE.md` - UI patterns, page mapping
4. `docs/02_BUSINESS_PROCESS_FLOWS.md` - End-to-end workflows
5. Module docs: `04_PLANNING`, `05_PRODUCTION`, `06_TECHNICAL`, `07_WAREHOUSE_AND_SCANNER`
6. `docs/DATABASE_SCHEMA.md` - Auto-generated database reference
7. `docs/API_REFERENCE.md` - Auto-generated API documentation

### Auto-Generated Docs (DO NOT EDIT MANUALLY):
- `docs/API_REFERENCE.md` - Generated from API classes via `pnpm docs:update`
- `docs/DATABASE_SCHEMA.md` - Generated from migrations via `pnpm docs:update`
- `docs/DATABASE_RELATIONSHIPS.md` - Generated from foreign keys via `pnpm docs:update`

## Development Workflow

### Before Starting Work:
1. Read relevant epic/phase summaries in `docs/EPIC-*_SUMMARY.md`
2. Check technical debt in `docs/TECHNICAL_DEBT_TODO.md` and `docs/14_NIESPOJNOSCI_FIX_CHECKLIST.md`
3. Review quality gates in `bmad.structure.yaml` for current epic

### When Adding Features:
1. Update or create migration in `apps/frontend/lib/supabase/migrations/`
2. Run `pnpm gen-types` to regenerate Supabase types
3. Update API class in `apps/frontend/lib/api/`
4. Update UI components
5. Run `pnpm docs:update` to regenerate API/DB docs
6. Add E2E tests in `apps/frontend/e2e/`
7. Run `pnpm type-check` and `pnpm test:e2e:critical`

### When Modifying Database:
1. Create new migration file (sequential numbering)
2. Run `pnpm gen-types` to update TypeScript types
3. Run `pnpm docs:update` to update schema docs
4. Update API classes to match new schema
5. Update affected components

### Testing Strategy:
- **E2E tests (Playwright)**: Critical user flows (100+ tests in `apps/frontend/e2e/`)
- **Unit tests (Vitest)**: API classes, utilities, components
- **Manual testing**: Scanner flows, complex workflows
- Run `pnpm test:e2e:critical` before committing major changes

## BMAD Method Integration

This project uses **BMAD Method** (Build-Measure-Adapt-Deploy) for AI-assisted development:

- `.bmad/` - Contains agents, workflows, and automation scripts
- `bmad.structure.yaml` - Defines project structure, quality gates, documentation hierarchy
- `pnpm bmad` - Launch BMAD CLI for guided workflows
- `pnpm bmad:status` - Check current epic/phase progress

### BMAD Agents:
- **Architecture Agent** (`docs/architecture_agent.md`) - System design decisions
- **QA Agent** (`docs/qa_agent.md`) - Quality assurance checks
- **Master Agent** (`docs/master_bmad.md`) - Orchestrates workflows

### Quality Gates (in `bmad.structure.yaml`):
- `QG-DB`: Database schema consistency
- `QG-UI`: UI/UX patterns
- `QG-PROC`: Business process alignment
- `QG-TECH`: Technical module integrity
- `QG-WH`: Warehouse/scanner workflows
- `QG-AUDIT`: Documentation sync

## Important Constraints & Policies

### From `bmad.structure.yaml`:
1. **Transfer Orders**: Warehouse-based (no location in header), transit handled by warehouse_transit_location
2. **Default locations**: Required for PO and TO (set in warehouse settings)
3. **Documentation**: Auto-generated docs must be regenerated via `pnpm docs:update` after API/DB changes
4. **Migrations**: Sequential numbering, no gaps, tracked in docs/13_DATABASE_MIGRATIONS.md

### Business Rules:
1. **No automatic UoM conversions** - must be explicit
2. **1:1 consumption** - when `consume_whole_lp` flag is set, entire LP must be consumed
3. **BOM immutability** - WO captures BOM snapshot at creation time
4. **LP-based inventory** - no loose qty, all inventory tracked via License Plates
5. **Multi-tenant isolation** - all queries filtered by `org_id` via RLS

## Common Pitfalls

1. **Don't manually edit auto-generated docs** - Use `pnpm docs:update` instead
2. **Always run `pnpm gen-types` after schema changes** - Otherwise TypeScript types will be stale
3. **Transfer Orders don't have locations in header** - Only warehouse-to-warehouse
4. **Don't assume UoM conversions** - System doesn't do this automatically
5. **Remember BOM snapshot** - Changing active BOM doesn't affect in-progress WOs
6. **Check `consume_whole_lp` flag** - Partial consumption not allowed when true
7. **Respect multi-tenant boundaries** - Never query across `org_id` in UI/API layer (RLS handles it at DB level)

## Support & References

- Project uses **pnpm workspaces** - always use `pnpm` (not npm/yarn)
- Node.js >= 20.0.0 required
- Supabase project ID must be set in `.env.local` for `pnpm gen-types`
- Port 5000 is default for frontend dev server
- All dates stored in UTC, displayed in user's timezone
- dalej 
Failed to load resource: the server responded with a status of 401 ()
C:\Users\Mariusz K\D…essionsTable.tsx:32 Error loading sessions: 
Object
pgroxddbtaevdegnidaz…r=login_time.desc:1 
 Failed to load resource: the server responded with a status of 401 ()
C:\Users\Mariusz K\D…essionsTable.tsx:32 Error loading sessions: 
Object
error-boundary-callbacks.js:68 TypeError: Cannot read properties of undefined (reading 'company_name')
    at SettingsForm (C:\Users\Mariusz K\D…tingsForm.tsx:88:39)


The above error occurred in the <SettingsForm> component. It was handled by the <ErrorBoundaryHandler> error boundary.
C:\Users\Mariusz K\D…nd\app\error.tsx:14 Application error: TypeError: Cannot read properties of undefined (reading 'company_name')
    at SettingsForm (C:\Users\Mariusz K\D…tingsForm.tsx:88:39)
C:\Users\Mariusz K\D…nd\app\error.tsx:14 Application error: TypeError: Cannot read properties of undefined (reading 'company_name')
    at SettingsForm (C:\Users\Mariusz K\D…tingsForm.tsx:88:39)