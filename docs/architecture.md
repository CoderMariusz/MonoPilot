# MonoPilot MES - Architecture Document

## Executive Summary

**MonoPilot** is a Manufacturing Execution System (MES) designed for SME food manufacturers (20-250 employees), built as a **SaaS B2B multi-tenant platform** using modern web technologies.

**Current Status:** Brownfield project at **82.5% MVP implementation**, 60% production-ready with tests.

**Architectural Approach:**

- **Mobile-First PWA** - BYOD strategy eliminates $30K-$50K scanner hardware costs
- **Multi-Tenant SaaS** - Row Level Security (RLS) with org_id isolation across 40+ tables
- **Class-Based API Layer** - 28 API classes with 10-22 methods each, TypeScript strict mode
- **Hybrid Snapshot Pattern** - BOM materials copied to `wo_materials` for true immutability + queryability
- **LP-Centric Genealogy** - License Plates as atomic inventory units with <1 min traceability queries

**Key Architectural Innovations:**

1. **LP = PALLET Pattern** - Output registration creates pallets directly (not separate pallet building step)
2. **Dual Consumption Model** - Automatic (BOM-based) + Manual (operator scan) + Odkonsumpcja (reverse)
3. **Hard LP Reservation** - Reserved LPs completely locked to WO (not soft allocation)
4. **Strict UoM Enforcement** - No automatic conversions, BOM UoM = LP UoM mandatory
5. **Hybrid Offline Sync** - Critical operations pessimistic (ASN, Output, QA), non-critical optimistic (Movements, Consumption)

**Technology Stack:**

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3.4
- **Backend:** Supabase PostgreSQL 15 with RLS, 40+ tables, 85+ migrations
- **Testing:** Playwright (100+ E2E tests), Vitest (24/28 APIs unit tested - 86% coverage)
- **Mobile:** PWA with offline-first IndexedDB cache, camera barcode scanning
- **Deployment:** Vercel (standalone output), Supabase cloud

**Compliance & Performance:**

- FDA 21 CFR Part 11, FSMA 204, GDPR, EU Regulation 178/2002
- <200ms API response time (p95), <1 min traceability queries (100+ LP tree)
- 99.0-99.9% uptime target (MVP → Growth)

---

## Project Initialization

**Project Type:** SaaS B2B Platform (Multi-Tenant)
**Domain:** Food Manufacturing → Universal Manufacturing (Phase 2 expansion)
**Complexity:** Medium-High (regulated industry, complex domain model)
**State:** Brownfield (70% feature complete, refactoring for production readiness)

**Development Team:**

- Primary Developer: Mariusz
- AI Assistant: Claude Sonnet 4.5 (architecture, implementation, testing)
- User Skill Level: Intermediate

**Repository:**

- Monorepo: pnpm workspaces
- Primary app: `apps/frontend` (Next.js 15)
- Shared types: `packages/shared`

**Key Dates:**

- Architecture Document: 2025-11-14
- MVP Target: 4-6 weeks (reduced from 10-14 weeks due to EPIC-001/002 completion)
- Production Beta: Q1 2026

---

## Decision Summary

| #   | Category            | Decision                                             | Version | Affects Modules       | Rationale                                                                                                                                  |
| --- | ------------------- | ---------------------------------------------------- | ------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Database            | **Squash Migrations Periodically**                   | v1.0    | All                   | Currently 85+ migration files. Squash quarterly to baseline for faster new env setup while preserving granular history in Git.             |
| 2   | BOM Snapshot        | **Hybrid - Copy `bom_items` Rows**                   | v1.0    | Technical, Production | True immutability (changes to BOM don't affect WOs) + queryable as table (no JSON parsing). Copy rows to `wo_materials` at WO creation.    |
| 3   | LP Genealogy        | **Recursive Queries (PostgreSQL CTE)**               | v1.0    | Warehouse, Production | Simple, standard SQL. Meets <1 min requirement for 100+ LP tree. Monitor performance, fallback to Closure Table if needed.                 |
| 4   | Offline Sync        | **Hybrid - Critical Pessimistic, Others Optimistic** | v1.0    | Scanner, Warehouse    | ASN/Output/QA = pessimistic (queue+retry). Movements/Consumption = optimistic (immediate UI). Best UX + data integrity balance.            |
| 4b  | Conflict Resolution | **Timestamp Wins + Notify Later User**               | v1.0    | Scanner               | Earliest timestamp wins chronologically. User who acted later receives notification about conflict.                                        |
| 5   | Multi-Tenancy       | **RLS + Application-Level Filtering**                | v1.0    | All                   | RLS as bulletproof safety net + explicit app-level `org_id` filtering for better performance and debugging.                                |
| 6   | Feature Flags       | **Database Table `organization_features`**           | v1.0    | Settings, All modules | Per-org control, audit trail, dynamic activation. Checked at API middleware (403 if disabled) + UI component guards.                       |
| 7   | API Structure       | **Module-Based Grouping**                            | v1.0    | All                   | Organize 28 API classes into module folders: `lib/api/planning/`, `lib/api/production/`, etc. Clear module boundaries.                     |
| 8   | Testing Coverage    | **High Coverage - 95%+ Target**                      | v1.0    | All                   | E2E: All user workflows. Unit: 95%+ coverage. Integration: All API routes. Maximum confidence for production deployment.                   |
| 9   | Caching             | **Application-Level (SWR, React Query)**             | v1.0    | Frontend              | Client-side cache with stale-while-revalidate. Better UX, reduced API calls. No server-side cache (Redis) for MVP.                         |
| 10  | Audit Trail         | **Basic MVP, Advanced in Growth Phase**              | v1.0    | Security, Compliance  | `created_by/updated_by/timestamps` sufficient for MVP. pgAudit + e-signatures deferred to Growth (P2) when targeting pharma/FDA customers. |
| 11  | ZPL Printing        | **Server-Side Generation**                           | v1.0    | Scanner, Warehouse    | API route generates ZPL, returns to client. Consistent formatting, easy template updates, works with network printers.                     |
| 12  | Barcode Format      | **Both - Code 128 + QR (future)**                    | v1.0    | Scanner, Warehouse    | Code 128 for MVP (alphanumeric, compact). QR Code in future (rich JSON data).                                                              |
| 13  | Background Jobs     | **Supabase Edge Functions (or Vercel Cron)**         | v1.0    | Production, Reporting | Serverless cron for nocne batch reports, email notifications, data archiving. Choose based on ease of implementation.                      |
| 14  | File Storage        | **Supabase Storage**                                 | v1.0    | Quality, Shipping     | Native integration, RLS support, good for MVP scale. Migrate to S3/R2 if cost becomes issue.                                               |
| 15  | Real-Time Updates   | **Supabase Realtime (WebSocket)**                    | v1.0    | Production Dashboard  | Critical tables (WO status, LP availability, QA alerts) use WebSocket subscriptions. Better than 30s polling for real-time needs.          |

---

## Project Structure

```
MonoPilot/
├── apps/
│   ├── frontend/                    # Next.js 15 App Router (main MES app)
│   │   ├── app/                     # App Router pages
│   │   │   ├── (auth)/              # Auth group (login, signup)
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── planning/            # Planning module (PO, TO, WO)
│   │   │   ├── production/          # Production module (WO execution, yield)
│   │   │   ├── technical/           # Technical module (Products, BOMs, Routings)
│   │   │   ├── warehouse/           # Warehouse module (ASN, GRN, LP, Stock Moves)
│   │   │   ├── scanner/             # Scanner PWA module (mobile-first)
│   │   │   ├── settings/            # Settings module (Warehouses, Users, Suppliers)
│   │   │   ├── quality/             # Quality module (Inspections, QA, NCRs) [TODO]
│   │   │   ├── shipping/            # Shipping module (SO, BOL, Pallet Loading) [TODO]
│   │   │   └── api/                 # API routes (Next.js Route Handlers)
│   │   │       ├── production/      # /api/production/consume, /api/production/yield
│   │   │       ├── technical/       # /api/technical/boms/:id/evaluate-materials
│   │   │       └── ...
│   │   ├── lib/                     # Shared libraries
│   │   │   ├── api/                 # API classes (28 classes) [REORGANIZE to module folders - Decision #7]
│   │   │   │   ├── planning/        # [NEW] PurchaseOrdersAPI, TransferOrdersAPI, WorkOrdersAPI
│   │   │   │   ├── production/      # [NEW] WorkOrdersAPI, ConsumeAPI, YieldAPI, OutputsAPI
│   │   │   │   ├── technical/       # [NEW] ProductsAPI, BomsAPI, RoutingsAPI, AllergensAPI
│   │   │   │   ├── warehouse/       # [NEW] ASNsAPI, GRNsAPI, LicensePlatesAPI, PalletsAPI, StockMovesAPI
│   │   │   │   ├── settings/        # [NEW] WarehousesAPI, LocationsAPI, SuppliersAPI, MachinesAPI, UsersAPI
│   │   │   │   └── security/        # [NEW] AuthAPI, AuditAPI
│   │   │   ├── supabase/            # Supabase clients
│   │   │   │   ├── client-browser.ts   # Client-side Supabase client
│   │   │   │   ├── server.ts           # Server-side Supabase client (for API routes)
│   │   │   │   ├── generated.types.ts  # Auto-generated types (pnpm gen-types)
│   │   │   │   └── migrations/         # SQL migrations (85+ files)
│   │   │   ├── hooks/               # React hooks (useAuth, useAuthAwareEffect, useSWR wrappers)
│   │   │   ├── types.ts             # Core domain types
│   │   │   └── utils/               # Utility functions
│   │   ├── components/              # Shared React components
│   │   ├── e2e/                     # Playwright E2E tests (100+ tests)
│   │   │   ├── 01-auth.spec.ts
│   │   │   ├── 02-purchase-orders.spec.ts
│   │   │   ├── 03-transfer-orders.spec.ts
│   │   │   ├── 04-work-orders.spec.ts    # 4 basic + 6 TODO advanced
│   │   │   ├── 10-asn-workflow.spec.ts
│   │   │   ├── 11-lp-genealogy.spec.ts
│   │   │   ├── 12-pallet-management.spec.ts
│   │   │   └── ...
│   │   ├── middleware.ts            # Auth middleware (session refresh, RLS context)
│   │   ├── package.json
│   │   └── playwright.config.ts
│   └── backend/                     # [FUTURE] Placeholder for future backend services
├── packages/
│   └── shared/                      # Shared TypeScript types and Zod schemas
│       ├── src/
│       │   ├── schemas.ts           # Zod validation schemas
│       │   └── types.ts             # Shared types
│       └── package.json
├── docs/                            # 30+ documentation files
│   ├── MonoPilot-PRD-2025-11-13.md  # Product Requirements Document
│   ├── architecture.md              # This file
│   ├── API_REFERENCE.md             # Auto-generated API documentation
│   ├── DATABASE_SCHEMA.md           # Auto-generated database schema
│   ├── DATABASE_RELATIONSHIPS.md    # Auto-generated FK relationships
│   ├── 01_SYSTEM_OVERVIEW.md
│   ├── 02_BUSINESS_PROCESS_FLOWS.md
│   ├── 03_APP_GUIDE.md
│   ├── 04_PLANNING_MODULE.md
│   ├── 05_PRODUCTION_MODULE.md
│   ├── 06_TECHNICAL_MODULE.md
│   ├── 07_WAREHOUSE_AND_SCANNER.md
│   ├── 11_PROJECT_STRUCTURE.md
│   ├── 13_DATABASE_MIGRATIONS.md
│   ├── 14_NIESPOJNOSCI_FIX_CHECKLIST.md
│   ├── TECHNICAL_DEBT_TODO.md
│   └── EPIC-*_SUMMARY.md            # Epic completion summaries
├── scripts/                         # Build and documentation generation scripts
├── .bmad/                           # BMAD Method tooling for AI-driven development
├── pnpm-workspace.yaml              # pnpm workspaces configuration
├── package.json                     # Root package.json
└── turbo.json                       # Turborepo configuration (if using)
```

**Key Architectural Boundaries:**

- **App Router Pages** (`app/*/`) - UI layer, module routing
- **API Routes** (`app/api/*/`) - Server-side Next.js Route Handlers
- **API Classes** (`lib/api/*/`) - Business logic, database access (will be reorganized into module folders)
- **Supabase Migrations** (`lib/supabase/migrations/`) - Sequential SQL migrations (001-085+)
- **E2E Tests** (`e2e/*.spec.ts`) - Playwright tests for critical user workflows

---

## Novel Pattern Designs

**CRITICAL FOR AI AGENT CONSISTENCY**: These patterns are unique to MonoPilot and differ from traditional MES systems. All AI agents implementing features MUST adhere to these patterns.

### Pattern 1: LP = PALLET (Output Creates Pallet Directly)

**Traditional MES Pattern (REJECTED):**

```
1. Production Output: Create LP (box) → LP-001 (single box)
2. Pallet Building: Operator scans 40 boxes → Pallet-001 contains [LP-001, LP-002, ..., LP-040]
3. Storage: Store Pallet-001 in location
```

**MonoPilot Pattern (IMPLEMENTED):**

```
1. Production Output: Register 38 boxes → LP-OUT-001 (pallet with 38 boxes)
2. Next Output: Register 50 boxes → LP-OUT-002 (pallet with 50 boxes)
3. Storage: Store LP-OUT-001, LP-OUT-002 directly
```

**Key Characteristics:**

- **1 LP = 1 Pallet** (not 1 LP = 1 Box)
- **No separate pallet building step** - pallet is created during output registration
- **LP quantity is in BOX unit** - `license_plates.quantity` represents number of boxes on pallet
- **Output workflow**: WO planned 100 boxes → Output 48 boxes (LP-OUT-001) → Output 50 boxes (LP-OUT-002) → Total 98 boxes

**Database Schema:**

```sql
-- license_plates table
CREATE TABLE license_plates (
  id UUID PRIMARY KEY,
  lp_number TEXT UNIQUE NOT NULL,         -- 'LP-OUT-001', 'LP-OUT-002'
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(10,2) NOT NULL,        -- 38 (boxes), 50 (boxes)
  uom TEXT NOT NULL,                      -- 'BOX' (from WO/BOM)
  location_id UUID REFERENCES locations(id),
  wo_id UUID REFERENCES work_orders(id),  -- Output LP linked to WO
  ...
);
```

**Scanner UI Flow:**

```typescript
// Output Registration (Scanner)
async function registerOutput(woId: string, boxQuantity: number) {
  // Step 1: Validate against WO planned quantity
  const wo = await WorkOrdersAPI.getById(woId);
  const totalOutputSoFar = await LicensePlatesAPI.getTotalOutputForWO(woId);

  if (totalOutputSoFar + boxQuantity > wo.planned_quantity) {
    throw new Error('Output exceeds WO planned quantity');
  }

  // Step 2: Create LP = Pallet directly
  const lpNumber = await generateLPNumber('OUT'); // 'LP-OUT-001'
  const newLP = await LicensePlatesAPI.create({
    lp_number: lpNumber,
    product_id: wo.product_id,
    quantity: boxQuantity, // 38 boxes, 50 boxes, etc.
    uom: wo.output_uom, // 'BOX'
    wo_id: woId,
    location_id: await getDefaultProductionOutputLocation(),
  });

  // Step 3: Trigger automatic BOM consumption (see Pattern 2)
  await ConsumeAPI.consumeAutomaticFromBOM(woId, boxQuantity);

  // Step 4: Update WO actual quantity
  await WorkOrdersAPI.update(woId, {
    actual_quantity: totalOutputSoFar + boxQuantity,
  });

  return newLP;
}
```

**AI Agent Implementation Rules:**

1. **NEVER implement separate pallet building step** - output registration IS pallet creation
2. **ALWAYS use BOX unit for output LPs** - even if BOM has kg/each/liter
3. **ALWAYS link output LP to WO** via `wo_id` foreign key
4. **NEVER create LPs for individual boxes** - each LP represents a full pallet

---

### Pattern 2: Dual Consumption Model (Automatic + Manual + Odkonsumpcja)

**Three Consumption Types:**

#### 2a. Automatic Consumption (BOM-Based)

- **Trigger**: When production output is registered (`registerOutput()`)
- **Logic**: Calculate material requirements from BOM based on output quantity
- **Example**: Output 38 boxes → BOM requires 2 kg flour per box → Consume 76 kg flour

```typescript
// Triggered automatically during registerOutput()
async function consumeAutomaticFromBOM(woId: string, outputBoxes: number) {
  const woMaterials = await WOMaterialsAPI.getAllForWO(woId); // BOM snapshot

  for (const material of woMaterials) {
    const requiredQty =
      material.qty_per_unit * outputBoxes * (1 + material.scrap_percentage);

    // Find reserved LPs for this material
    const reservedLPs = await LPReservationsAPI.getReservedForWOMaterial(
      woId,
      material.product_id
    );

    // Consume from reserved LPs (FIFO)
    await consumeFromReservedLPs(reservedLPs, requiredQty, material.uom, woId);
  }
}
```

#### 2b. Manual Consumption (Operator Scan)

- **Trigger**: Operator scans LP barcode on scanner
- **Logic**: Validate LP is reserved for this WO, consume specified quantity
- **Example**: Operator scans LP-123, enters 10 kg to consume

```typescript
// Scanner: Manual Consumption Flow
async function manualConsume(
  woId: string,
  lpNumber: string,
  qtyToConsume: number
) {
  const lp = await LicensePlatesAPI.getByLPNumber(lpNumber);

  // Validation 1: LP must be reserved for this WO (HARD LOCK)
  const reservation = await LPReservationsAPI.getByLPAndWO(lp.id, woId);
  if (!reservation) {
    throw new Error('LP not reserved for this WO - cannot consume');
  }

  // Validation 2: Sufficient quantity available
  if (lp.quantity < qtyToConsume) {
    throw new Error('Insufficient quantity on LP');
  }

  // Validation 3: UoM must match BOM (no automatic conversions)
  const woMaterial = await WOMaterialsAPI.getByWOAndProduct(
    woId,
    lp.product_id
  );
  if (lp.uom !== woMaterial.uom) {
    throw new Error(
      `UoM mismatch: LP is ${lp.uom}, BOM requires ${woMaterial.uom}`
    );
  }

  // Validation 4: Check consume_whole_lp flag
  if (woMaterial.consume_whole_lp && qtyToConsume !== lp.quantity) {
    throw new Error('Must consume entire LP (consume_whole_lp flag set)');
  }

  // Create consumption record
  await ConsumeAPI.create({
    wo_id: woId,
    lp_id: lp.id,
    product_id: lp.product_id,
    quantity: qtyToConsume,
    uom: lp.uom,
    consumption_type: 'MANUAL',
  });

  // Update LP quantity
  await LicensePlatesAPI.update(lp.id, {
    quantity: lp.quantity - qtyToConsume,
    consumed_by_wo_id: woId, // Genealogy tracking
  });

  // Update reservation
  await LPReservationsAPI.updateConsumedQty(reservation.id, qtyToConsume);
}
```

#### 2c. Odkonsumpcja (Reverse Consumption)

- **Trigger**: Operator made mistake, needs to return material to LP
- **Logic**: Reverse consumption transaction, restore LP quantity
- **Example**: Operator consumed 15 kg instead of 10 kg → reverse 5 kg

```typescript
// Scanner: Odkonsumpcja (Reverse Consumption)
async function reverseConsumption(consumptionId: string, qtyToReverse: number) {
  const consumption = await ConsumeAPI.getById(consumptionId);

  if (qtyToReverse > consumption.quantity) {
    throw new Error('Cannot reverse more than originally consumed');
  }

  // Restore LP quantity
  const lp = await LicensePlatesAPI.getById(consumption.lp_id);
  await LicensePlatesAPI.update(lp.id, {
    quantity: lp.quantity + qtyToReverse,
  });

  // Update consumption record
  await ConsumeAPI.update(consumptionId, {
    quantity: consumption.quantity - qtyToReverse,
    reversed_quantity: qtyToReverse,
    reversed_at: new Date().toISOString(),
  });

  // Update reservation (restore available qty)
  const reservation = await LPReservationsAPI.getByLPAndWO(
    lp.id,
    consumption.wo_id
  );
  await LPReservationsAPI.updateConsumedQty(reservation.id, -qtyToReverse);
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS trigger automatic consumption** when output is registered
2. **ALWAYS validate LP reservation** before manual consumption
3. **ALWAYS check consume_whole_lp flag** - block partial consumption if set
4. **ALWAYS validate UoM match** - no automatic conversions allowed
5. **ALWAYS support odkonsumpcja** - operators make mistakes, must be reversible

---

### Pattern 3: Hard LP Reservation (Complete Lock)

**Traditional MES Pattern (REJECTED - Soft Allocation):**

```
- LP-123 allocated to WO-001 (10 kg of 50 kg)
- LP-123 can still be moved to different location
- LP-123 can be allocated to WO-002 (another 15 kg)
- LP-123 can be merged with LP-124
```

**MonoPilot Pattern (IMPLEMENTED - Hard Lock):**

```
- LP-123 reserved to WO-001 (entire LP, even if only 10 kg needed from 50 kg)
- LP-123 CANNOT be moved to different location
- LP-123 CANNOT be consumed by any other WO
- LP-123 CANNOT be split, merged, or modified
- LP-123 LOCKED until WO-001 completes or reservation is manually released
```

**Database Schema:**

```sql
CREATE TABLE lp_reservations (
  id UUID PRIMARY KEY,
  lp_id UUID REFERENCES license_plates(id) NOT NULL,
  wo_id UUID REFERENCES work_orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  reserved_quantity DECIMAL(10,2) NOT NULL,  -- Full LP quantity
  consumed_quantity DECIMAL(10,2) DEFAULT 0,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID REFERENCES users(id),

  CONSTRAINT uq_lp_reservation UNIQUE(lp_id)  -- ONE LP = ONE WO only
);
```

**Reservation Enforcement (API Layer):**

```typescript
// LicensePlatesAPI - Block operations on reserved LPs
class LicensePlatesAPI {
  static async move(lpId: string, toLocationId: string) {
    const reservation = await LPReservationsAPI.getByLP(lpId);
    if (reservation) {
      throw new Error(
        `LP is reserved for WO ${reservation.wo_id} - cannot move`
      );
    }
    // ... proceed with move
  }

  static async split(lpId: string, splitQty: number) {
    const reservation = await LPReservationsAPI.getByLP(lpId);
    if (reservation) {
      throw new Error(
        `LP is reserved for WO ${reservation.wo_id} - cannot split`
      );
    }
    // ... proceed with split
  }

  static async merge(lpId1: string, lpId2: string) {
    const res1 = await LPReservationsAPI.getByLP(lpId1);
    const res2 = await LPReservationsAPI.getByLP(lpId2);
    if (res1 || res2) {
      throw new Error('Cannot merge reserved LPs');
    }
    // ... proceed with merge
  }
}

// ConsumeAPI - Validate reservation before consumption
class ConsumeAPI {
  static async validateConsumption(woId: string, lpId: string) {
    const reservation = await LPReservationsAPI.getByLP(lpId);

    // LP must be reserved
    if (!reservation) {
      throw new Error('LP not reserved - cannot consume');
    }

    // LP must be reserved for THIS WO
    if (reservation.wo_id !== woId) {
      throw new Error(`LP reserved for WO ${reservation.wo_id}, not ${woId}`);
    }

    return true;
  }
}
```

**Scanner UI - Show Reserved Status:**

```typescript
// Scanner: LP Details Screen
function LPDetailsScreen({ lpNumber }: { lpNumber: string }) {
  const lp = useSWR(`/api/license-plates/${lpNumber}`, fetcher);
  const reservation = useSWR(`/api/lp-reservations/by-lp/${lp.data?.id}`, fetcher);

  return (
    <div>
      <h2>{lpNumber}</h2>
      {reservation.data && (
        <div className="bg-red-100 border-red-500 p-4">
          <LockIcon />
          <span className="font-bold">RESERVED</span>
          <p>WO: {reservation.data.wo_id}</p>
          <p>Reserved: {reservation.data.reserved_quantity} {lp.data.uom}</p>
          <p>Consumed: {reservation.data.consumed_quantity} {lp.data.uom}</p>
          <p className="text-sm text-red-700">
            Cannot move, split, merge, or consume for other WOs
          </p>
        </div>
      )}
    </div>
  );
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS check reservation status** before any LP operation (move, split, merge, consume)
2. **ALWAYS throw error if LP is reserved** and operation is not allowed
3. **ALWAYS enforce 1 LP = 1 WO constraint** - one LP can only be reserved to one WO at a time
4. **ALWAYS reserve FULL LP quantity** - partial reservations not supported
5. **NEVER allow cross-WO consumption** - LP reserved to WO-001 cannot be consumed by WO-002

---

### Pattern 4: Strict UoM Enforcement (No Automatic Conversions)

**Traditional MES Pattern (REJECTED - Automatic Conversion):**

```
BOM: 2 kg flour per box
LP-123: 5000 g flour (UoM = gram)
System: Auto-convert 5000 g → 5 kg, consume OK ✓
```

**MonoPilot Pattern (IMPLEMENTED - Strict Matching):**

```
BOM: 2 kg flour per box (UoM = kg)
LP-123: 5000 g flour (UoM = gram)
System: UoM mismatch (kg ≠ gram), BLOCK consumption ✗
```

**Rationale:**

- **Food manufacturing requires exact traceability** - automatic conversions introduce rounding errors
- **Regulatory compliance** - FDA/FSMA require exact quantities as recorded
- **Operator awareness** - UoM mismatch often indicates wrong product selected
- **BOM integrity** - UoM is part of recipe definition, must match exactly

**Validation Layer (API):**

```typescript
// ConsumeAPI - UoM validation before consumption
class ConsumeAPI {
  static async validateUoM(woId: string, lpId: string) {
    const lp = await LicensePlatesAPI.getById(lpId);
    const woMaterial = await WOMaterialsAPI.getByWOAndProduct(
      woId,
      lp.product_id
    );

    // STRICT MATCH - no conversions
    if (lp.uom !== woMaterial.uom) {
      throw new Error(
        `UoM mismatch: LP has ${lp.uom}, BOM requires ${woMaterial.uom}. ` +
          `Cannot consume - contact supervisor to correct BOM or re-receive LP.`
      );
    }

    return true;
  }
}

// WOMaterialsAPI - Capture UoM during BOM snapshot
class WOMaterialsAPI {
  static async snapshotFromBOM(woId: string, bomId: string) {
    const bomItems = await BomItemsAPI.getAllForBOM(bomId);

    for (const item of bomItems) {
      await this.create({
        wo_id: woId,
        product_id: item.product_id,
        qty_per_unit: item.quantity,
        uom: item.uom, // Snapshot UoM from BOM
        scrap_percentage: item.scrap_percentage,
        consume_whole_lp: item.consume_whole_lp,
      });
    }
  }
}
```

**Scanner UI - UoM Validation:**

```typescript
// Scanner: Consumption Screen
async function handleLPScan(lpNumber: string, woId: string) {
  const lp = await LicensePlatesAPI.getByLPNumber(lpNumber);
  const woMaterial = await WOMaterialsAPI.getByWOAndProduct(
    woId,
    lp.product_id
  );

  // Check UoM match
  if (lp.uom !== woMaterial.uom) {
    showError({
      title: 'UoM Mismatch',
      message: `LP is ${lp.uom}, BOM requires ${woMaterial.uom}`,
      actions: [
        { label: 'Contact Supervisor', action: () => notifySupervisor() },
        { label: 'Scan Different LP', action: () => resetScanner() },
      ],
    });
    return;
  }

  // Proceed with consumption
  proceedToConsumption(lp, woMaterial);
}
```

**AI Agent Implementation Rules:**

1. **NEVER implement automatic UoM conversions** (kg ↔ g, liter ↔ ml, etc.)
2. **ALWAYS validate exact UoM match** before consumption (lp.uom === woMaterial.uom)
3. **ALWAYS snapshot UoM from BOM** to wo_materials table at WO creation
4. **ALWAYS show clear error** to operator when UoM mismatch detected
5. **ALWAYS suggest corrective actions** - contact supervisor, scan different LP, etc.

---

### Pattern 5: Hybrid Offline Sync (Critical Pessimistic + Non-Critical Optimistic)

**Operation Classification:**

| Operation              | Sync Strategy | Rationale                                                |
| ---------------------- | ------------- | -------------------------------------------------------- |
| **ASN Receiving**      | Pessimistic   | Financial impact, supplier relationship, legal receipt   |
| **Production Output**  | Pessimistic   | Inventory creation, traceability root, yield calculation |
| **QA Status Change**   | Pessimistic   | Cannot ship rejected inventory, compliance               |
| **Stock Movements**    | Optimistic    | Low risk, can be reconciled, frequent operation          |
| **Manual Consumption** | Optimistic    | Reversible (odkonsumpcja), validated against reservation |

**Pessimistic Sync (Queue + Retry):**

```typescript
// Scanner: Pessimistic operation (ASN Receiving)
async function receiveASNItem(asnItemId: string, lpData: LPCreateData) {
  // Step 1: Add to offline queue (IndexedDB)
  const queueItem = await OfflineQueue.add({
    operation: 'ASN_RECEIVE',
    payload: { asnItemId, lpData },
    timestamp: Date.now(),
    status: 'PENDING',
  });

  // Step 2: Show "queued" state to operator
  showToast({
    type: 'info',
    message: 'ASN receive queued - syncing...',
    icon: 'sync',
  });

  // Step 3: Attempt sync (with retry)
  try {
    const result = await syncWithRetry(
      async () => {
        return await fetch('/api/asn/receive', {
          method: 'POST',
          body: JSON.stringify({ asnItemId, lpData }),
        });
      },
      { maxRetries: 3, backoffMs: 1000 }
    );

    // Step 4: Mark queue item as synced
    await OfflineQueue.markSynced(queueItem.id);

    showToast({
      type: 'success',
      message: 'ASN received successfully',
      icon: 'check',
    });

    return result;
  } catch (error) {
    // Step 5: Failed - keep in queue, show warning
    await OfflineQueue.updateStatus(queueItem.id, 'FAILED');

    showToast({
      type: 'warning',
      message: 'ASN receive queued for later sync (offline)',
      icon: 'cloud-off',
    });

    // Background sync will retry when online
  }
}
```

**Optimistic Sync (Immediate UI Update):**

```typescript
// Scanner: Optimistic operation (Stock Movement)
async function moveLP(lpId: string, toLocationId: string) {
  const lp = await LicensePlatesAPI.getById(lpId);

  // Step 1: Update UI immediately (optimistic)
  await updateLocalCache(lpId, { location_id: toLocationId });

  showToast({
    type: 'success',
    message: `LP moved to ${toLocationId}`,
    icon: 'check',
  });

  // Step 2: Sync in background (fire-and-forget)
  syncInBackground(async () => {
    await fetch('/api/stock-moves', {
      method: 'POST',
      body: JSON.stringify({
        lp_id: lpId,
        from_location_id: lp.location_id,
        to_location_id: toLocationId,
        timestamp: Date.now(),
      }),
    });
  }).catch(async error => {
    // Step 3: Failed - rollback UI, show error
    await updateLocalCache(lpId, { location_id: lp.location_id });

    showToast({
      type: 'error',
      message: 'Movement failed - rolled back',
      icon: 'x',
    });
  });
}
```

**Conflict Resolution (Timestamp Wins):**

```typescript
// Background Sync Service
async function resolveConflict(localOp: QueueItem, serverState: any) {
  // Rule: Earliest timestamp wins chronologically
  if (localOp.timestamp < serverState.updated_at) {
    // Local operation happened first - apply it
    await applyLocalOperation(localOp);
    return { winner: 'local', action: 'applied' };
  } else {
    // Server operation happened first - local operation is stale
    await discardLocalOperation(localOp);

    // Notify operator who performed later operation
    await NotificationsAPI.create({
      user_id: localOp.user_id,
      type: 'CONFLICT_RESOLVED',
      message: `Your ${localOp.operation} was discarded (another operator acted first)`,
      severity: 'WARNING',
    });

    return { winner: 'server', action: 'discarded' };
  }
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS use pessimistic sync** for ASN, Output, QA status
2. **ALWAYS use optimistic sync** for Movements, Consumption
3. **ALWAYS queue failed pessimistic operations** for retry
4. **ALWAYS implement conflict resolution** using timestamp comparison
5. **ALWAYS notify user** when their operation is discarded due to conflict

---

## Implementation Patterns

### API Architecture (Class-Based Services)

**Pattern:** Static class methods with standardized signatures across all 28 API classes.

**Standard API Class Structure:**

```typescript
// lib/api/planning/WorkOrdersAPI.ts
import { supabase } from '@/lib/supabase/client-browser';
import type { Database } from '@/lib/supabase/generated.types';

type WorkOrder = Database['public']['Tables']['work_orders']['Row'];
type WorkOrderInsert = Database['public']['Tables']['work_orders']['Insert'];
type WorkOrderUpdate = Database['public']['Tables']['work_orders']['Update'];

export class WorkOrdersAPI {
  // Standard CRUD methods (all APIs must implement)
  static async getAll(filters?: WorkOrderFilters): Promise<WorkOrder[]> {
    let query = supabase
      .from('work_orders')
      .select('*, product:products(*), bom:boms(*)')
      .eq('is_active', true);

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.product_id) query = query.eq('product_id', filters.product_id);

    const { data, error } = await query.order('wo_number', {
      ascending: false,
    });
    if (error) throw new Error(`Failed to fetch work orders: ${error.message}`);
    return data || [];
  }

  static async getById(id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*, product:products(*), bom:boms(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching work order:', error);
      return null;
    }
    return data;
  }

  static async create(workOrder: WorkOrderInsert): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .insert(workOrder)
      .select()
      .single();

    if (error) throw new Error(`Failed to create work order: ${error.message}`);
    return data;
  }

  static async update(
    id: string,
    updates: WorkOrderUpdate
  ): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update work order: ${error.message}`);
    return data;
  }

  static async delete(id: string): Promise<void> {
    // Soft delete pattern
    const { error } = await supabase
      .from('work_orders')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(`Failed to delete work order: ${error.message}`);
  }

  // Domain-specific methods (10-20 per API)
  static async start(woId: string): Promise<WorkOrder> {
    /* ... */
  }
  static async complete(woId: string): Promise<WorkOrder> {
    /* ... */
  }
  static async calculateYield(woId: string): Promise<number> {
    /* ... */
  }
  static async getReservedMaterials(woId: string): Promise<LPReservation[]> {
    /* ... */
  }
  // ... 15+ more domain methods
}
```

**API Organization (Module-Based - Decision #7):**

```
lib/api/
├── planning/
│   ├── PurchaseOrdersAPI.ts     # PO header + line management
│   ├── TransferOrdersAPI.ts     # Warehouse-to-warehouse transfers
│   └── WorkOrdersAPI.ts          # Production orders
├── production/
│   ├── ConsumeAPI.ts             # Material consumption (automatic + manual + odkonsumpcja)
│   ├── YieldAPI.ts               # Yield calculation, scrap tracking
│   └── OutputsAPI.ts             # Production output registration
├── technical/
│   ├── ProductsAPI.ts            # Product master data
│   ├── BomsAPI.ts                # BOM versioning, effective dates
│   ├── BomItemsAPI.ts            # BOM components
│   └── RoutingsAPI.ts            # Production routings
├── warehouse/
│   ├── ASNsAPI.ts                # Advance Ship Notices
│   ├── GRNsAPI.ts                # Goods Receipt Notes
│   ├── LicensePlatesAPI.ts       # LP CRUD, genealogy queries
│   ├── LPReservationsAPI.ts      # Hard lock reservations
│   └── StockMovesAPI.ts          # Location-to-location movements
├── settings/
│   ├── WarehousesAPI.ts
│   ├── LocationsAPI.ts
│   ├── MachinesAPI.ts
│   └── SuppliersAPI.ts
└── security/
    ├── AuthAPI.ts
    └── AuditAPI.ts
```

**Error Handling Pattern:**

```typescript
// Consistent error handling across all APIs
static async someOperation(id: string): Promise<Result> {
  try {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Log error for debugging
      console.error(`[API Error] someOperation failed for id=${id}:`, error);

      // Throw user-friendly error
      throw new Error(`Failed to perform operation: ${error.message}`);
    }

    return data;
  } catch (err) {
    // Re-throw with context
    throw new Error(`API Error in someOperation: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
```

---

### Multi-Tenant RLS Enforcement (Decision #5)

**Two-Layer Defense:**

1. **PostgreSQL RLS Policies** (bulletproof safety net)
2. **Application-Level Filtering** (performance + explicit debugging)

**Database RLS Policies (All 40+ Business Tables):**

```sql
-- Example: work_orders table RLS
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/modify their organization's work orders
CREATE POLICY "Users access own org work orders"
  ON work_orders
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::uuid)
  WITH CHECK (org_id = current_setting('app.current_org_id')::uuid);
```

**Application-Level Filtering (API Layer):**

```typescript
// Middleware sets org_id context
// apps/frontend/middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createMiddlewareClient({ req: request });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    // Set org_id from user metadata
    const orgId = session.user.user_metadata?.org_id;
    await supabase.rpc('set_current_org_id', { org_id: orgId });
  }

  return NextResponse.next();
}

// API Classes: Explicit org_id filtering for performance
class WorkOrdersAPI {
  static async getAll(): Promise<WorkOrder[]> {
    // RLS ensures org_id isolation, but explicit filter improves query plan
    const session = await supabase.auth.getSession();
    const orgId = session.data.session?.user.user_metadata?.org_id;

    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('org_id', orgId) // Explicit filter (better EXPLAIN plan)
      .eq('is_active', true);

    if (error) throw new Error(`Failed to fetch work orders: ${error.message}`);
    return data || [];
  }
}
```

**Why Both Layers?**

- **RLS**: Bulletproof security, prevents accidental cross-org leaks even if app code is buggy
- **App-level filtering**: Better query performance (PostgreSQL can use indexes), easier debugging (logs show explicit org_id filter)

---

### BOM Snapshot Pattern (Decision #2)

**Hybrid Approach:** Copy `bom_items` rows to `wo_materials` table at WO creation.

**Implementation:**

```typescript
// WOMaterialsAPI - Snapshot BOM at WO creation
class WOMaterialsAPI {
  static async snapshotFromBOM(woId: string, bomId: string): Promise<void> {
    // Step 1: Fetch active BOM items
    const bomItems = await BomItemsAPI.getAllForBOM(bomId);

    // Step 2: Copy to wo_materials (immutable snapshot)
    const woMaterialsData = bomItems.map(item => ({
      wo_id: woId,
      product_id: item.product_id,
      qty_per_unit: item.quantity,
      uom: item.uom,
      scrap_percentage: item.scrap_percentage || 0,
      consume_whole_lp: item.consume_whole_lp || false,
      allergens: item.allergens || [],
      product_version: item.product_version,
      bom_version: item.bom_version,
      effective_from: item.effective_from,
    }));

    const { error } = await supabase
      .from('wo_materials')
      .insert(woMaterialsData);

    if (error) throw new Error(`Failed to snapshot BOM: ${error.message}`);
  }
}

// WorkOrdersAPI - Trigger snapshot during WO creation
class WorkOrdersAPI {
  static async create(woData: WorkOrderInsert): Promise<WorkOrder> {
    // Step 1: Create WO header
    const { data: wo, error } = await supabase
      .from('work_orders')
      .insert(woData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create WO: ${error.message}`);

    // Step 2: Snapshot BOM to wo_materials (immutable)
    await WOMaterialsAPI.snapshotFromBOM(wo.id, woData.bom_id);

    return wo;
  }
}
```

**Benefits:**

1. **True Immutability**: Changes to active BOM don't affect in-progress WOs
2. **Queryable**: Can query `wo_materials` table directly (no JSON parsing)
3. **Auditable**: Full BOM history preserved per WO
4. **Performance**: Indexed table queries faster than JSON traversal

**Database Schema:**

```sql
CREATE TABLE wo_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID REFERENCES work_orders(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  qty_per_unit DECIMAL(10,4) NOT NULL,
  uom TEXT NOT NULL,
  scrap_percentage DECIMAL(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT FALSE,
  allergens TEXT[],
  product_version INTEGER,
  bom_version INTEGER,
  effective_from DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast WO material lookups
CREATE INDEX idx_wo_materials_wo_id ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_product_id ON wo_materials(product_id);
```

---

### LP Genealogy Pattern (Decision #3)

**Recursive Queries (PostgreSQL CTE)** for forward/backward traceability.

**Forward Traceability (Where did this input go?):**

```typescript
// TraceabilityAPI.ts
class TraceabilityAPI {
  static async forwardTrace(lpId: string): Promise<TraceNode[]> {
    const { data, error } = await supabase.rpc('trace_forward', {
      start_lp_id: lpId,
    });
    if (error) throw new Error(`Forward trace failed: ${error.message}`);
    return data || [];
  }
}
```

**PostgreSQL Function (Recursive CTE):**

```sql
-- Forward Trace: Find all output LPs that consumed this input LP
CREATE OR REPLACE FUNCTION trace_forward(start_lp_id UUID)
RETURNS TABLE (
  lp_id UUID,
  lp_number TEXT,
  product_id UUID,
  product_name TEXT,
  quantity DECIMAL,
  uom TEXT,
  wo_id UUID,
  wo_number TEXT,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE forward_tree AS (
    -- Base case: Start LP
    SELECT
      lp.id AS lp_id,
      lp.lp_number,
      lp.product_id,
      p.name AS product_name,
      lp.quantity,
      lp.uom,
      lp.wo_id,
      wo.wo_number,
      0 AS level
    FROM license_plates lp
    JOIN products p ON lp.product_id = p.id
    LEFT JOIN work_orders wo ON lp.wo_id = wo.id
    WHERE lp.id = start_lp_id

    UNION ALL

    -- Recursive case: Find children (LPs that consumed this LP)
    SELECT
      child_lp.id,
      child_lp.lp_number,
      child_lp.product_id,
      child_p.name,
      child_lp.quantity,
      child_lp.uom,
      child_lp.wo_id,
      child_wo.wo_number,
      ft.level + 1
    FROM forward_tree ft
    JOIN lp_genealogy lg ON ft.lp_id = lg.parent_lp_id
    JOIN license_plates child_lp ON lg.child_lp_id = child_lp.id
    JOIN products child_p ON child_lp.product_id = child_p.id
    LEFT JOIN work_orders child_wo ON child_lp.wo_id = child_wo.id
    WHERE ft.level < 10  -- Prevent infinite recursion
  )
  SELECT * FROM forward_tree;
END;
$$ LANGUAGE plpgsql;
```

**Backward Traceability (What went into this output?):**

```sql
-- Backward Trace: Find all input LPs that were consumed to create this output LP
CREATE OR REPLACE FUNCTION trace_backward(start_lp_id UUID)
RETURNS TABLE (
  lp_id UUID,
  lp_number TEXT,
  product_id UUID,
  product_name TEXT,
  quantity DECIMAL,
  uom TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  batch_number TEXT,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE backward_tree AS (
    -- Base case: Start LP
    SELECT
      lp.id AS lp_id,
      lp.lp_number,
      lp.product_id,
      p.name AS product_name,
      lp.quantity,
      lp.uom,
      lp.supplier_id,
      s.name AS supplier_name,
      lp.batch_number,
      0 AS level
    FROM license_plates lp
    JOIN products p ON lp.product_id = p.id
    LEFT JOIN suppliers s ON lp.supplier_id = s.id
    WHERE lp.id = start_lp_id

    UNION ALL

    -- Recursive case: Find parents (LPs that were consumed to create this LP)
    SELECT
      parent_lp.id,
      parent_lp.lp_number,
      parent_lp.product_id,
      parent_p.name,
      parent_lp.quantity,
      parent_lp.uom,
      parent_lp.supplier_id,
      parent_s.name,
      parent_lp.batch_number,
      bt.level + 1
    FROM backward_tree bt
    JOIN lp_genealogy lg ON bt.lp_id = lg.child_lp_id
    JOIN license_plates parent_lp ON lg.parent_lp_id = parent_lp.id
    JOIN products parent_p ON parent_lp.product_id = parent_p.id
    LEFT JOIN suppliers parent_s ON parent_lp.supplier_id = parent_s.id
    WHERE bt.level < 10  -- Prevent infinite recursion
  )
  SELECT * FROM backward_tree;
END;
$$ LANGUAGE plpgsql;
```

**Performance Characteristics:**

- **Target**: <1 minute for 100+ LP tree (met in testing)
- **Current**: ~5-10 seconds for typical 30-50 LP tree
- **Fallback Plan**: If performance degrades beyond 1 min, migrate to Closure Table pattern

---

## Consistency Rules

### Naming Conventions

**Database Tables:**

- **Format**: `snake_case` (lowercase with underscores)
- **Examples**: `work_orders`, `license_plates`, `bom_items`, `lp_reservations`
- **Foreign Keys**: `<table>_id` pattern (`product_id`, `warehouse_id`, `supplier_id`)
- **Junction Tables**: `<table1>_<table2>` pattern (`pallet_items`, `lp_genealogy`)

**Database Columns:**

- **Format**: `snake_case`
- **Audit Columns** (all business tables):
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `updated_at TIMESTAMPTZ`
  - `created_by UUID REFERENCES users(id)`
  - `updated_by UUID REFERENCES users(id)`
- **Soft Delete**: `is_active BOOLEAN DEFAULT TRUE`
- **Multi-Tenant**: `org_id UUID REFERENCES organizations(id) NOT NULL`

**Database Constraints:**

- **Primary Keys**: `pk_<table>` (e.g., `pk_work_orders`)
- **Foreign Keys**: `fk_<table>_<column>` (e.g., `fk_wo_materials_wo_id`)
- **Indexes**: `idx_<table>_<column>` (e.g., `idx_license_plates_lp_number`)
- **Unique Constraints**: `uq_<table>_<column>` (e.g., `uq_products_sku`)

**Enums:**

- **Format**: lowercase with underscores
- **Examples**: `bom_status`, `wo_status`, `po_status`, `product_type`
- **Values**: lowercase with underscores (`draft`, `active`, `in_progress`, `completed`)

**TypeScript Code:**

- **Components**: `PascalCase` (`WorkOrdersTable.tsx`, `LPDetailsScreen.tsx`)
- **API Classes**: `PascalCase` + `API` suffix (`WorkOrdersAPI`, `LicensePlatesAPI`)
- **Types/Interfaces**: `PascalCase` (`WorkOrder`, `LicensePlate`, `BomItem`)
- **Functions**: `camelCase` (`registerOutput`, `consumeFromReservedLPs`)
- **Constants**: `UPPER_SNAKE_CASE` (`MAX_RETRIES`, `DEFAULT_TIMEOUT_MS`)

**File Names:**

- **Components**: `ComponentName.tsx` (PascalCase)
- **API Classes**: `ResourceNameAPI.ts` (e.g., `WorkOrdersAPI.ts`)
- **API Routes**: `route.ts` inside `app/api/<resource>/` folder
- **Migrations**: `NNN_descriptive_name.sql` (sequential numbering, snake_case description)
- **Tests**: `<filename>.test.ts` (e.g., `suppliers.test.ts`, `locations.test.ts`)

**API Routes:**

- **Format**: `kebab-case` URL paths
- **Examples**:
  - `/api/work-orders` → `app/api/work-orders/route.ts`
  - `/api/license-plates/:id` → `app/api/license-plates/[id]/route.ts`
  - `/api/boms/:id/evaluate-materials` → `app/api/boms/[id]/evaluate-materials/route.ts`

---

### Code Organization Rules

**Module Boundaries (App Router Pages):**

```
app/
├── (auth)/              # Authentication (login, signup)
├── dashboard/           # Overview dashboard
├── planning/            # PO, TO, WO planning
├── production/          # WO execution, yield, by-products
├── technical/           # Products, BOMs, Routings
├── warehouse/           # ASN, GRN, LP, Stock Moves
├── scanner/             # Mobile terminal UI
├── settings/            # Warehouses, Locations, Users, Suppliers
├── quality/             # [TODO] QA, Inspections, NCRs
└── shipping/            # [TODO] SO, BOL, Pallet Loading
```

**Each Module Must Have:**

1. **Page Components** (`app/<module>/page.tsx`)
2. **API Routes** (`app/api/<module>/route.ts`)
3. **API Classes** (`lib/api/<module>/<Resource>API.ts`)
4. **E2E Tests** (`e2e/<NN>-<module>.spec.ts`)
5. **Documentation** (`docs/<NN>_<MODULE>.md`)

**Import Order (Enforced by ESLint):**

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client-browser';

// 2. Internal absolute imports (@/ alias)
import { WorkOrdersAPI } from '@/lib/api/planning/WorkOrdersAPI';
import type { WorkOrder } from '@/lib/types';

// 3. Relative imports (components, utilities)
import { Button } from '@/components/ui/button';
import { formatDate } from '../utils/dateUtils';

// 4. CSS imports (last)
import styles from './WorkOrders.module.css';
```

---

### Error Handling Patterns

**API Layer (Throw Errors):**

```typescript
class WorkOrdersAPI {
  static async getById(id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Log for debugging
      console.error(`[WorkOrdersAPI.getById] Failed for id=${id}:`, error);

      // Throw user-friendly error
      throw new Error(`Failed to fetch work order: ${error.message}`);
    }

    return data;
  }
}
```

**UI Layer (Try-Catch + User Feedback):**

```typescript
// React Component
async function handleStartWO(woId: string) {
  try {
    setLoading(true);
    await WorkOrdersAPI.start(woId);

    showToast({
      type: 'success',
      message: 'Work order started successfully',
    });

    await mutate(); // Revalidate SWR cache
  } catch (error) {
    showToast({
      type: 'error',
      message:
        error instanceof Error ? error.message : 'Failed to start work order',
    });

    console.error('Error starting WO:', error);
  } finally {
    setLoading(false);
  }
}
```

**Scanner Layer (Graceful Degradation):**

```typescript
// Scanner: Offline-aware error handling
async function scanLP(lpNumber: string) {
  try {
    const lp = await LicensePlatesAPI.getByLPNumber(lpNumber);
    return lp;
  } catch (error) {
    // Check if offline
    if (!navigator.onLine) {
      showToast({
        type: 'warning',
        message: 'Offline - using cached data',
        icon: 'cloud-off',
      });

      // Fallback to IndexedDB cache
      return await getCachedLP(lpNumber);
    }

    // Re-throw if not offline issue
    throw error;
  }
}
```

---

### Logging Standards

**Console Logging (Development):**

```typescript
// Use structured logging with context
console.log('[WorkOrdersAPI.create] Creating WO:', woData);
console.error('[ConsumeAPI.validateUoM] UoM mismatch:', {
  lpUom: lp.uom,
  bomUom: woMaterial.uom,
});
console.warn('[OfflineQueue] Failed sync attempt #3 for operation:', operation);
```

**Audit Logging (Production):**

```typescript
// AuditAPI - Critical business operations
class AuditAPI {
  static async log(event: AuditEvent): Promise<void> {
    await supabase.from('audit_log').insert({
      user_id: event.userId,
      action: event.action, // 'WO_START', 'LP_CONSUME', 'ASN_RECEIVE'
      resource_type: event.resourceType, // 'work_order', 'license_plate', 'asn'
      resource_id: event.resourceId,
      changes: event.changes, // JSONB: before/after state
      ip_address: event.ipAddress,
      user_agent: event.userAgent,
      timestamp: new Date().toISOString(),
    });
  }
}

// Usage
await AuditAPI.log({
  userId: session.user.id,
  action: 'WO_START',
  resourceType: 'work_order',
  resourceId: woId,
  changes: { status: { from: 'RELEASED', to: 'IN_PROGRESS' } },
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
});
```

---

## Production Module Patterns

### Pattern 6: Multi-Operation WO with Intermediate LPs

**Traditional MES Pattern (REJECTED):**

```
WO → Single operation → Final product output
```

**MonoPilot Pattern (IMPLEMENTED):**

```
WO → Operation 1 (dice) → LP-OP1-123 (492 kg dice meat) → Stock
WO → Operation 2 (mix)  → Consume LP-OP1-123 (200 kg) → LP-OP2-345 (200 kg mixed)
Remaining: LP-OP1-123 (292 kg) stays on stock for next WO
```

**Key Characteristics:**

- **Each routing operation can produce LP** - intermediate products can be stored
- **LP numbering includes operation** - LP-OP1-123, LP-OP2-345 (traceability)
- **Operation output = input for next operation** - or different WO (WO chains)
- **Partial operation consumption** - operation 1 produces 500 kg, operation 2 uses only 200 kg

**Example Workflow:**

```typescript
// Operation 1: Dice meat
const op1Output = await registerOperationOutput({
  wo_id: 'WO-001',
  operation_number: 10, // op10
  quantity: 492, // After weighing (500 kg input → 492 kg output, 8 kg yield loss)
  uom: 'kg',
  product_id: 'PR-DICE-MEAT',
});
// Creates: LP-OP1-123 (492 kg)

// Operation 2: Mix (uses only part of op1 output)
const op2Input = await consumeOperationLP({
  wo_id: 'WO-001',
  operation_number: 20, // op20
  lp_id: 'LP-OP1-123',
  quantity: 200, // Consume only 200 kg from 492 kg
});
// LP-OP1-123: 492 kg → 292 kg remaining (goes to stock)

const op2Output = await registerOperationOutput({
  wo_id: 'WO-001',
  operation_number: 20,
  quantity: 200,
  uom: 'kg',
  product_id: 'PR-MIXED-MEAT',
});
// Creates: LP-OP2-345 (200 kg)

// Remaining 292 kg from LP-OP1-123 available for:
// - Next batch in same WO
// - Different WO (WO-002 consuming PR-DICE-MEAT)
```

**Database Schema:**

```sql
CREATE TABLE production_outputs (
  id UUID PRIMARY KEY,
  wo_id UUID REFERENCES work_orders(id),
  operation_number INTEGER,        -- 10, 20, 30 (from routing)
  lp_id UUID REFERENCES license_plates(id),
  quantity DECIMAL(10,2),
  uom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LP naming convention includes operation
-- LP-OP1-123 → WO operation 1, sequence 123
-- LP-OP2-345 → WO operation 2, sequence 345
```

**AI Agent Implementation Rules:**

1. **ALWAYS allow operation output registration** - each operation can produce LP
2. **ALWAYS include operation number in LP naming** - LP-OP{operation_number}-{sequence}
3. **ALWAYS support partial consumption** - operation 2 can use subset of operation 1 output
4. **ALWAYS track operation yields separately** - op1 yield (492/500), op2 yield (200/200)

---

### Pattern 7: Process Products (PR) - Intermediate Goods

**Product Type Hierarchy:**

```
RM (Raw Material)      → Cannot have BOM, purchased from suppliers
ING (Ingredient)       → Cannot have BOM, purchased from suppliers
PR (Process Product)   → Can have BOM, produced internally, used in other WOs
FG (Finished Goods)    → Can have BOM, final products for customers
BY (By-Product)        → Auto-created during production, may have value
```

**Process Product Use Cases:**

**Use Case 1: Multi-Stage Production**

```
WO-001: Produce PR-DICE-MEAT
  Input: RM-BEEF (500 kg)
  Operation 1: Dice → LP-OP1-123 (492 kg dice meat)
  Operation 2: Mix + Seasoning → LP-OP2-345 (200 kg seasoned dice)

WO-002: Produce FG-PIZZA
  Input: PR-DICE-MEAT (from LP-OP1-123 or LP-OP2-345)
  Input: ING-CHEESE, ING-DOUGH, ING-SAUCE
  Output: FG-PIZZA (100 boxes)
```

**Use Case 2: Heat Treatment (Metal Industry)**

```
WO-001: Produce PR-GEAR
  Input: RM-STEEL-BAR
  Operation 1: Cutting → PR-GEAR-RAW
  Operation 2: Hardening → PR-GEAR-HARDENED ← Process product

WO-002: Produce FG-GEAR-ASSEMBLY
  Input: PR-GEAR-HARDENED (from WO-001)
  Input: RM-BEARING, RM-SHAFT
  Output: FG-GEAR-ASSEMBLY
```

**Database Schema:**

```sql
CREATE TYPE product_type AS ENUM ('RM', 'ING', 'PR', 'FG', 'BY');

CREATE TABLE products (
  id UUID PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT,
  type product_type NOT NULL,
  is_saleable BOOLEAN DEFAULT FALSE,  -- PR can be sold if TRUE (e.g., dice meat to restaurants)
  -- ... other fields
);

-- Validation: RM/ING cannot have BOM
-- PR/FG can have BOM
-- BY auto-created from wo_by_products
```

**AI Agent Implementation Rules:**

1. **ALWAYS validate product type constraints** - RM/ING cannot have BOM
2. **ALWAYS support PR → FG workflow** - PR can be consumed in FG production
3. **ALWAYS support PR → PR workflow** - multi-stage processing (dice → mix → cook)
4. **ALWAYS allow PR as saleable** - optional flag (B2B intermediate products)

---

### Pattern 8: Dual Yield Metrics (Consumption-Based vs Output-Based)

**Traditional MES:** Single yield = actual output / planned output × 100%

**MonoPilot:** Dual metrics for complete production visibility

**Metric 1: Material Yield (Consumption-Based)**

```
Material Yield = Actual Output Qty / Actual Consumption Qty × 100%

Example:
  Planned: 100 boxes (requires 100 kg meat per BOM)
  Actual Output: 95 boxes
  Actual Consumption: 108 kg meat (95 kg auto + 10 kg manual + 3 kg auto-scrap)

  Material Yield (Meat) = 95 kg / 108 kg × 100% = 87.96%
  ↑ Shows production efficiency (material usage)
```

**Metric 2: Planning Coverage (Output-Based)**

```
Planning Coverage = Actual Output / Planned Output × 100%

Example:
  Planned: 100 boxes
  Actual Output: 95 boxes

  Planning Coverage = 95 / 100 × 100% = 95%
  ↑ Shows planning accuracy (production fulfillment)
```

**Combined Dashboard View:**

```typescript
interface WOPerformanceMetrics {
  wo_number: string;
  planned_quantity: number;
  actual_quantity: number;

  // Output-based metric
  planning_coverage: number; // 95%

  // Consumption-based metrics (per material)
  material_yields: {
    product_id: string;
    product_name: string;
    planned_consumption: number;
    actual_consumption: number;
    yield_percentage: number;
  }[];

  // Example:
  // [{
  //   product_id: 'RM-MEAT',
  //   product_name: 'Ground Beef',
  //   planned_consumption: 100,  // 100 boxes × 1 kg/box
  //   actual_consumption: 108,   // 95 kg auto + 10 kg manual + 3 kg auto-scrap
  //   yield_percentage: 87.96
  // }]

  // Scrap breakdown
  scrap_breakdown: {
    auto_scrap: number; // 3 kg (BOM scrap_percentage = 3%)
    manual_scrap: number; // 10 kg (operator decision at WO close)
    total_scrap: number; // 13 kg
  };
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS calculate both metrics** - planning coverage AND material yield
2. **ALWAYS show scrap breakdown** - auto-scrap (BOM) vs manual-scrap (operator)
3. **ALWAYS calculate yield per material** - flour yield, meat yield, packaging yield
4. **NEVER conflate metrics** - planning coverage ≠ material yield

---

### Pattern 9: 2-Step WO Closure (Operator COMPLETE → Supervisor CLOSE)

**Status Flow:**

```
DRAFT → RELEASED → IN_PROGRESS → COMPLETED (operator) → CLOSED (supervisor)
```

**Rationale:**

- **Operator COMPLETE** - Production work done, all outputs registered
- **Supervisor CLOSE** - Final verification, cost reconciliation, audit trail lock

**Implementation:**

```typescript
// Step 1: Operator completes WO
async function completeWO(woId: string, operatorId: string) {
  // Validate: All operations finished, outputs registered
  const wo = await WorkOrdersAPI.getById(woId);
  const operations = await OperationsAPI.getByWO(woId);

  if (operations.some(op => op.status !== 'COMPLETED')) {
    throw new Error('Cannot complete WO - pending operations exist');
  }

  // Update status
  await WorkOrdersAPI.update(woId, {
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
    completed_by: operatorId,
  });

  // Notify supervisor
  await NotificationsAPI.create({
    user_id: wo.supervisor_id,
    type: 'WO_READY_FOR_CLOSURE',
    message: `WO ${wo.wo_number} completed by operator, ready for final closure`,
  });
}

// Step 2: Supervisor closes WO
async function closeWO(
  woId: string,
  supervisorId: string,
  closeData: {
    manual_scrap?: number;
    notes?: string;
  }
) {
  const wo = await WorkOrdersAPI.getById(woId);

  if (wo.status !== 'COMPLETED') {
    throw new Error('WO must be COMPLETED before closure');
  }

  // Handle manual scrap (if materials not returned)
  if (closeData.manual_scrap > 0) {
    await ScrapAPI.create({
      wo_id: woId,
      quantity: closeData.manual_scrap,
      type: 'MANUAL',
      reason: closeData.notes,
    });
  }

  // Lock WO (no further changes allowed)
  await WorkOrdersAPI.update(woId, {
    status: 'CLOSED',
    closed_at: new Date().toISOString(),
    closed_by: supervisorId,
    is_editable: false, // Audit trail locked
  });

  // Calculate final costs, yields
  await WOCostingAPI.calculateFinalCosts(woId);
}
```

**UI Flow:**

```
Operator:
1. Scanner → WO details → "Complete WO" button
2. Confirmation modal: "All outputs registered?"
3. Status → COMPLETED
4. Notification sent to supervisor

Supervisor:
5. Desktop → Notifications → "WO-123 ready for closure"
6. Review: outputs, yields, scrap, costs
7. Decision:
   - Return unused materials? (odkonsumpcja)
   - Register manual scrap? (if materials lost/damaged)
8. "Close WO" button → Status → CLOSED
```

**AI Agent Implementation Rules:**

1. **ALWAYS enforce 2-step closure** - operator cannot CLOSE, only COMPLETE
2. **ALWAYS notify supervisor** when WO status → COMPLETED
3. **ALWAYS lock WO on CLOSED** - no edits allowed (audit trail)
4. **ALWAYS handle manual scrap** at closure (operator decision)

---

### Pattern 10: Auto-Scrap + Manual Scrap

**Scrap Types:**

**1. Auto-Scrap (BOM-Defined)**

```sql
-- BOM item configuration
CREATE TABLE bom_items (
  id UUID PRIMARY KEY,
  bom_id UUID,
  product_id UUID,
  quantity DECIMAL(10,4),
  uom TEXT,
  scrap_percentage DECIMAL(5,2) DEFAULT 0,  -- e.g., 3.00 = 3% auto-scrap
  -- ...
);

-- Example: Pizza BOM
-- Meat: 1 kg per box, scrap_percentage = 3%
-- Auto-consumption = 1 kg × 1.03 = 1.03 kg per box
```

**2. Manual Scrap (Operator Decision)**

```typescript
// At WO closure, supervisor decides
interface WOClosureData {
  manual_scrap_items: {
    product_id: string;
    quantity: number;
    reason: string; // "poor quality raw material", "equipment malfunction", etc.
  }[];
}

// Example:
// WO planned 100 boxes, produced 95 boxes
// BOM: 1 kg meat/box, scrap 3%
// Auto-consumption: 95 kg × 1.03 = 97.85 kg
// Operator brought 100 kg to line, nothing returned
// Manual scrap: 100 kg - 97.85 kg = 2.15 kg
```

**Combined Scrap Calculation:**

```typescript
interface WOScrapBreakdown {
  wo_id: string;

  // Auto-scrap (from BOM)
  auto_scrap: {
    product_id: string;
    planned_scrap: number;  // Based on BOM scrap_percentage
    actual_scrap: number;   // Based on actual output
  }[];

  // Manual scrap (operator decision)
  manual_scrap: {
    product_id: string;
    quantity: number;
    reason: string;
  }[];

  // Total scrap per material
  total_scrap: {
    product_id: string;
    quantity: number;
    percentage: number;  // total scrap / total consumption × 100%
  }[];
}

// Example:
{
  wo_id: 'WO-001',
  auto_scrap: [
    { product_id: 'RM-MEAT', planned_scrap: 3.0, actual_scrap: 2.85 }  // 95 boxes × 3%
  ],
  manual_scrap: [
    { product_id: 'RM-MEAT', quantity: 2.15, reason: 'Equipment malfunction - material stuck in grinder' }
  ],
  total_scrap: [
    { product_id: 'RM-MEAT', quantity: 5.0, percentage: 5.0 }  // (2.85 + 2.15) / 100 × 100%
  ]
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS apply auto-scrap from BOM** - consumption = qty × (1 + scrap_percentage)
2. **ALWAYS allow manual scrap at closure** - supervisor decision
3. **ALWAYS track scrap reasons** - manual scrap requires reason text
4. **ALWAYS calculate total scrap** - auto + manual for complete picture

---

### Pattern 11: By-Products Registration

**By-Product Scenarios:**

- **Meat processing**: Chicken breast → chicken skin (by-product)
- **Dairy**: Cheese production → whey (by-product)
- **Baking**: Bread → bread crumbs from trimming (by-product)

**Implementation:**

```typescript
// BOM defines by-products
CREATE TABLE wo_by_products (
  id UUID PRIMARY KEY,
  wo_id UUID REFERENCES work_orders(id),
  product_id UUID REFERENCES products(id),  -- BY-PRODUCT type
  expected_ratio DECIMAL(10,4),             -- e.g., 0.15 = 15% of main product output
  -- Copied from BOM at WO creation (snapshot)
);

// Separate output registration for by-products
async function registerByProductOutput(woId: string, byProductData: {
  by_product_id: string;
  quantity: number;
  uom: string;
}) {
  // Generate LP for by-product
  const lpNumber = await generateLPNumber('BY'); // 'LP-BY-001'

  const byProductLP = await LicensePlatesAPI.create({
    lp_number: lpNumber,
    product_id: byProductData.by_product_id,
    quantity: byProductData.quantity,
    uom: byProductData.uom,
    wo_id: woId,
    type: 'BY_PRODUCT',
    location_id: await getByProductLocation(),  // Special location for by-products
  });

  // Genealogy tracking - by-product inherits parent materials
  await LPGenealogyAPI.linkByProduct({
    child_lp_id: byProductLP.id,
    parent_wo_id: woId,
    // By-product LP inherits genealogy from main product output
  });

  return byProductLP;
}
```

**Scanner UI Flow:**

```
WO Details Screen:
┌────────────────────────────────────┐
│ WO-001: Chicken Breast Production  │
│ Status: IN_PROGRESS                │
├────────────────────────────────────┤
│ Main Product Output:               │
│ ✓ 500 kg registered (LP-OUT-001)   │
├────────────────────────────────────┤
│ By-Products:                       │
│ • Chicken Skin (expected: 75 kg)   │
│   [Register By-Product] button     │←─ Separate button
└────────────────────────────────────┘

Tap "Register By-Product":
1. Scan/enter quantity: 72 kg
2. System creates LP-BY-001 (72 kg chicken skin)
3. LP-BY-001 inherits genealogy from WO-001
4. By-product yield = 72/75 × 100% = 96% (separate metric)
```

**AI Agent Implementation Rules:**

1. **ALWAYS support by-product registration** - separate from main output
2. **ALWAYS create separate LP** - LP-BY-{sequence} naming convention
3. **ALWAYS track by-product genealogy** - inherits from WO consumed materials
4. **ALWAYS calculate by-product yield** - actual vs expected (from BOM ratio)

---

## Planning Module Patterns

### Pattern 12: PO Multi-Supplier Auto-Split (Quick Entry)

**Scenario:** Planner enters 4 products in Quick PO Entry, 3 different suppliers

**Input (Single Form):**

```
Line 1: RM-001 (Flour) → Supplier A → 1000 kg
Line 2: RM-002 (Sugar) → Supplier A → 500 kg
Line 3: RM-003 (Butter) → Supplier B → 200 kg
Line 4: BXS-001 (Boxes) → Supplier C → 1000 pcs
```

**Output (3 POs Auto-Created):**

```
PO-001 (Supplier A):
  - Line 1: RM-001 (Flour) 1000 kg
  - Line 2: RM-002 (Sugar) 500 kg

PO-002 (Supplier B):
  - Line 1: RM-003 (Butter) 200 kg

PO-003 (Supplier C):
  - Line 1: BXS-001 (Boxes) 1000 pcs
```

**Implementation:**

```typescript
async function createQuickPO(lines: QuickPOLine[]) {
  // Group lines by supplier
  const linesBySupplier = _.groupBy(lines, 'supplier_id');

  const createdPOs = [];

  for (const [supplierId, supplierLines] of Object.entries(linesBySupplier)) {
    const supplier = await SuppliersAPI.getById(supplierId);

    // Create PO header with supplier defaults
    const po = await PurchaseOrdersAPI.create({
      supplier_id: supplierId,
      currency: supplier.default_currency,
      tax_code: supplier.default_tax_code,
      payment_terms: supplier.payment_terms,
      expected_delivery_date: calculateDeliveryDate(supplier.lead_time_days),
    });

    // Create PO lines
    for (const line of supplierLines) {
      await POLineAPI.create({
        po_id: po.id,
        product_id: line.product_id,
        quantity: line.quantity,
        unit_price:
          line.unit_price ||
          (await getLastPurchasePrice(line.product_id, supplierId)),
        warehouse_id: line.warehouse_id,
        location_id: supplier.default_location_per_warehouse[line.warehouse_id],
      });
    }

    createdPOs.push(po);
  }

  // Show success message
  showToast({
    type: 'success',
    message: `Created ${createdPOs.length} purchase orders`,
    details: createdPOs
      .map(po => `${po.po_number} (${po.supplier_name})`)
      .join(', '),
  });

  return createdPOs;
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS group by supplier** - single entry form → multiple POs
2. **ALWAYS apply supplier defaults** - currency, tax, payment terms, lead time
3. **ALWAYS show PO summary** - "Created 3 POs: PO-001 (Supplier A), PO-002 (Supplier B), PO-003 (Supplier C)"
4. **ALWAYS validate inventory** - show warnings if low stock before PO creation

---

### Pattern 13: Smart LP Suggestions (FEFO/FIFO) - No Auto-Reservation

**Traditional MES:** WO creation auto-reserves LPs (hard lock)

**MonoPilot:** Smart suggestions, planner decides

**Scenario:** Create WO for 100 boxes pizza (requires 100 kg mozzarella)

**System Behavior:**

```typescript
async function showMaterialAvailability(woId: string) {
  const wo = await WorkOrdersAPI.getById(woId);
  const woMaterials = await WOMaterialsAPI.getByWO(woId);

  const availability = [];

  for (const material of woMaterials) {
    // Get available LPs (not reserved, not QA hold, not expired)
    const availableLPs = await LicensePlatesAPI.getAvailable({
      product_id: material.product_id,
      uom: material.uom,
      warehouse_id: wo.warehouse_id,
    });

    // Calculate total available
    const totalAvailable = _.sumBy(availableLPs, 'quantity');
    const required = material.qty_per_unit * wo.planned_quantity;

    // Sort LPs by strategy
    const sortedLPs = sortLPsByStrategy(availableLPs, material.strategy);
    // strategy = 'FEFO' (products with expiry) or 'FIFO' (no expiry)

    availability.push({
      product: material.product_name,
      required: required,
      available: totalAvailable,
      shortage: Math.max(0, required - totalAvailable),
      suggested_lps: sortedLPs.slice(0, 5),  // Show top 5 suggestions
      status: totalAvailable >= required ? 'OK' : 'SHORTAGE',
    });
  }

  return availability;
}

// UI displays suggestions (no auto-reservation)
function MaterialAvailabilityTable({ availability }: { availability: MaterialAvailability[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Material</th>
          <th>Required</th>
          <th>Available</th>
          <th>Status</th>
          <th>Suggested LPs (FEFO)</th>
        </tr>
      </thead>
      <tbody>
        {availability.map(item => (
          <tr>
            <td>{item.product}</td>
            <td>{item.required} {item.uom}</td>
            <td className={item.status === 'OK' ? 'text-green' : 'text-red'}>
              {item.available} {item.uom}
            </td>
            <td>
              {item.status === 'SHORTAGE' && (
                <span className="text-red">⚠️ Shortage: {item.shortage} {item.uom}</span>
              )}
            </td>
            <td>
              {item.suggested_lps.map(lp => (
                <div key={lp.id}>
                  {lp.lp_number} - {lp.quantity} {lp.uom}
                  {lp.expiry_date && ` (expires: ${lp.expiry_date})`}
                </div>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Reservation happens at WO START (not creation):**

```typescript
async function startWO(
  woId: string,
  lpSelections: { material_id: string; lp_ids: string[] }[]
) {
  // Planner manually selected which LPs to use (or accepted suggestions)

  for (const selection of lpSelections) {
    for (const lpId of selection.lp_ids) {
      await LPReservationsAPI.create({
        lp_id: lpId,
        wo_id: woId,
        reserved_at: new Date().toISOString(),
        reserved_by: session.user.id,
      });
    }
  }

  await WorkOrdersAPI.update(woId, { status: 'IN_PROGRESS' });
}
```

**AI Agent Implementation Rules:**

1. **NEVER auto-reserve on WO creation** - only suggestions shown
2. **ALWAYS show FEFO/FIFO sorted suggestions** - planner can see best LPs
3. **ALWAYS show shortage warnings** - "⚠️ Shortage: 50 kg, create PO?"
4. **ALWAYS reserve on WO START** - planner confirms LP selection first

---

### Pattern 14: Transit Inventory Awareness (MRP)

**Traditional MRP:** Only checks on-hand inventory

**MonoPilot MRP:** Checks on-hand + in-transit (planned deliveries)

**Scenario:** Create WO scheduled for Friday, material needed: 500 kg flour

**MRP Calculation:**

```typescript
async function checkMaterialAvailability(
  productId: string,
  requiredQty: number,
  neededByDate: Date
) {
  // 1. On-hand inventory
  const onHandQty = await LicensePlatesAPI.getAvailableQty({
    product_id: productId,
    as_of_date: new Date(), // Right now
  });

  // 2. In-transit inventory (ASNs expected before needed_by_date)
  const inTransitQty = await ASNsAPI.getInTransitQty({
    product_id: productId,
    expected_before: neededByDate,
  });

  // 3. Reserved inventory (for other WOs before this one)
  const reservedQty = await LPReservationsAPI.getReservedQty({
    product_id: productId,
    reserved_before: neededByDate,
  });

  // 4. Net available = on-hand + in-transit - reserved
  const netAvailable = onHandQty + inTransitQty - reservedQty;

  return {
    on_hand: onHandQty,
    in_transit: inTransitQty,
    reserved: reservedQty,
    net_available: netAvailable,
    shortage: Math.max(0, requiredQty - netAvailable),
    status: netAvailable >= requiredQty ? 'OK' : 'SHORTAGE',
    breakdown: {
      message: `On-hand: ${onHandQty} kg, In-transit: ${inTransitQty} kg (PO-123 arrives Thu), Reserved: ${reservedQty} kg (WO-100, WO-101)`,
    },
  };
}
```

**UI Display:**

```
Material Availability Check (WO-102 scheduled Friday):

Flour (500 kg required):
  ✓ On-hand: 200 kg
  ✓ In-transit: 400 kg (PO-123 arrives Thursday) ← Shows planned delivery
  ⚠️ Reserved: 100 kg (WO-100, WO-101)
  ─────────────────────
  Net Available: 500 kg ✓ OK
```

**AI Agent Implementation Rules:**

1. **ALWAYS include in-transit inventory** - ASNs expected before WO date
2. **ALWAYS subtract reservations** - other WOs scheduled before this one
3. **ALWAYS show breakdown** - on-hand, in-transit, reserved (transparency)
4. **ALWAYS suggest PO creation** if shortage detected

---

## Settings Module Patterns

### Pattern 15: Multi-Role Users

**Traditional RBAC:** One user = one role (rigid)

**MonoPilot RBAC:** One user = multiple roles (flexible)

**Use Cases:**

- Small plant: Manager is also Planner (wears 2 hats)
- Night shift: Operator also does QC inspections (Operator + QC roles)
- Startup: Technical Engineer also handles Purchasing (Technical + Purchasing roles)

**Implementation:**

```typescript
// User model
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  org_id UUID REFERENCES organizations(id),
  roles TEXT[] NOT NULL DEFAULT ARRAY['operator'],  -- Array of roles
  -- Max 2-3 roles to avoid permission complexity
);

// Permission check (OR logic)
function hasPermission(user: User, requiredRoles: string[]): boolean {
  return requiredRoles.some(role => user.roles.includes(role));
}

// Example:
// User: { roles: ['operator', 'planner'] }
// Create WO requires: ['planner', 'manager', 'admin']
// Result: TRUE (user has 'planner' role)
```

**AI Agent Implementation Rules:**

1. **ALWAYS support multiple roles** - users.roles is array, not single value
2. **ALWAYS use OR logic** - user needs ANY of required roles (not ALL)
3. **ALWAYS limit to 2-3 roles max** - avoid permission complexity
4. **ALWAYS show role badges** in UI - "John Doe [Operator, Planner]"

---

### Pattern 16: Production Line vs Machine Distinction

**Key Difference:**

- **Production Line**: WO assignment, capacity planning, scheduling
- **Machine**: Cost tracking, maintenance, OEE calculation

**Example:**

```
Production Line 1 (Pizza Line):
  ├── Mixer A (machine) ← Cost center, maintenance schedule
  ├── Oven B (machine) ← Cost center, maintenance schedule
  └── Cooler C (machine) ← Cost center, maintenance schedule

WO-001 assigned to: "Production Line 1" (not individual machines)
Cost calculation: Sum of (Mixer A runtime × cost/hour) + (Oven B runtime × cost/hour) + ...
```

**Database Schema:**

```sql
CREATE TABLE production_lines (
  id UUID PRIMARY KEY,
  name TEXT,
  code TEXT UNIQUE,
  warehouse_id UUID REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT TRUE,
  -- Optional: Product restrictions (allergen segregation)
  allowed_product_types TEXT[],  -- ['dairy', 'bakery'], NULL = no restrictions
);

CREATE TABLE machines (
  id UUID PRIMARY KEY,
  name TEXT,
  code TEXT UNIQUE,
  production_line_id UUID REFERENCES production_lines(id),  -- Many-to-one
  cost_per_hour DECIMAL(10,2),
  maintenance_schedule JSONB,  -- Future: Growth Phase P1
);

-- Note: Machines can be SHARED between lines
-- Example: Shared forklift, shared scale
CREATE TABLE machine_line_assignments (
  machine_id UUID REFERENCES machines(id),
  production_line_id UUID REFERENCES production_lines(id),
  is_primary BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (machine_id, production_line_id)
);
```

**WO Planning:**

```typescript
// Planner selects LINE (not machine)
const wo = await WorkOrdersAPI.create({
  product_id: 'FG-PIZZA',
  planned_quantity: 1000,
  production_line_id: 'line-1', // ← Line, not machine
  scheduled_date: '2025-11-20',
});

// Capacity check warns if LINE conflict
const lineSchedule = await ProductionLinesAPI.getSchedule(
  'line-1',
  '2025-11-20'
);
// Shows: WO-001 (10:00-14:00), WO-002 (14:00-18:00)
// Warning if new WO overlaps
```

**AI Agent Implementation Rules:**

1. **ALWAYS assign WO to production_line** - not machine
2. **ALWAYS support machine-line many-to-many** - shared equipment
3. **ALWAYS use machines for costing** - calculate runtime × cost_per_hour
4. **ALWAYS check LINE capacity** - warn on conflicts

---

### Pattern 17: Configurable Planning Horizon

**Traditional MES:** Fixed planning window (e.g., 90 days)

**MonoPilot:** Admin configurable per organization

**Use Cases:**

- **Short horizon (30 days)**: Job shop, make-to-order, high variability
- **Medium horizon (90 days)**: Food manufacturing, seasonal products
- **Long horizon (365 days)**: Capital equipment, long lead times

**Implementation:**

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  -- Planning configuration
  planning_horizon_days INTEGER DEFAULT 90,
  fiscal_year_start_month INTEGER DEFAULT 1,  -- 1 = January
  default_uom_system TEXT DEFAULT 'metric',   -- 'metric' or 'imperial'
  -- ...
);
```

**Validation:**

```typescript
async function validateWOScheduleDate(woData: WorkOrderInsert) {
  const org = await OrganizationsAPI.getById(session.user.org_id);

  const maxScheduleDate = addDays(new Date(), org.planning_horizon_days);

  if (new Date(woData.scheduled_date) > maxScheduleDate) {
    throw new Error(
      `Cannot schedule beyond planning horizon (${org.planning_horizon_days} days). ` +
        `Max date: ${formatDate(maxScheduleDate)}`
    );
  }
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS enforce planning horizon** - block scheduling beyond org.planning_horizon_days
2. **ALWAYS show max date in UI** - calendar picker disabled after max date
3. **ALWAYS allow admin override** - Settings → Organization → Planning Horizon
4. **ALWAYS default to 90 days** - if not configured

---

## Technical Module Patterns

### Pattern 18: BOM Version Auto-Selection with Override

**Scenario:** Planner creates WO scheduled for 2025-11-20

**BOM Versions:**

```
BOM v2: effective_from 2024-01-01, effective_to 2024-12-31
BOM v3: effective_from 2024-11-01, effective_to 2025-06-30 ← Active on 2025-11-20
BOM v4: effective_from 2025-07-01, effective_to NULL (future)
```

**Auto-Selection Logic:**

```typescript
async function suggestBOMVersion(
  productId: string,
  scheduledDate: Date
): Promise<BOM> {
  const boms = await BomsAPI.getAllVersions(productId);

  // Filter: active BOMs that cover scheduled_date
  const eligibleBOMs = boms.filter(
    bom =>
      bom.status === 'ACTIVE' &&
      new Date(bom.effective_from) <= scheduledDate &&
      (bom.effective_to === null || new Date(bom.effective_to) >= scheduledDate)
  );

  if (eligibleBOMs.length === 0) {
    throw new Error('No active BOM for scheduled date');
  }

  if (eligibleBOMs.length === 1) {
    return eligibleBOMs[0]; // Exact match
  }

  // Multiple BOMs cover date (overlapping period - transition scenario)
  // Return newest version, but WARN planner
  const newest = _.maxBy(eligibleBOMs, 'effective_from');

  showWarning({
    message: `Multiple BOM versions active on ${scheduledDate}`,
    boms: eligibleBOMs.map(
      b => `${b.version} (${b.effective_from} to ${b.effective_to})`
    ),
    suggested: newest.version,
    action: 'Please confirm BOM version to use',
  });

  return newest;
}
```

**UI Flow:**

```
Create WO Form:
┌─────────────────────────────────────┐
│ Product: Pizza Margherita           │
│ Scheduled Date: 2025-11-20          │
│                                     │
│ BOM Version: v3 (2024-11-01) ✓     │← Auto-selected
│   [Change BOM] button               │← Override option
└─────────────────────────────────────┘

If multiple BOMs (overlapping):
⚠️ Warning: 2 BOM versions active on 2025-11-20
  - BOM v2 (2024-01-01 to 2024-12-31)
  - BOM v3 (2024-11-01 to 2025-06-30) ← Suggested

  [Use BOM v2] [Use BOM v3 ✓]
```

**AI Agent Implementation Rules:**

1. **ALWAYS auto-select BOM** based on WO scheduled_date
2. **ALWAYS warn if multiple BOMs** cover the date (overlapping period)
3. **ALWAYS allow manual override** - planner can choose different version
4. **ALWAYS snapshot chosen BOM** to wo_materials (immutability)

---

### Pattern 19: Optional BOM Components

**Use Case:** Configurable products (optional toppings, extra features, etc.)

**Example: Pizza BOM**

```
Base BOM (Mandatory):
  - Dough: 200 g
  - Sauce: 50 g
  - Cheese: 100 g

Optional Components (Customer choice):
  - Extra Cheese: 50 g (is_optional = TRUE)
  - Pepperoni: 40 g (is_optional = TRUE)
  - Olives: 20 g (is_optional = TRUE)
```

**Database Schema:**

```sql
CREATE TABLE bom_items (
  id UUID PRIMARY KEY,
  bom_id UUID REFERENCES boms(id),
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(10,4),
  uom TEXT,
  is_optional BOOLEAN DEFAULT FALSE,  ← New field
  -- ...
);
```

**Production Workflow:**

```typescript
// Scanner: Material Consumption Screen
function MaterialConsumptionList({ woId }: { woId: string }) {
  const woMaterials = useWOMaterials(woId);

  return (
    <div>
      <h3>Mandatory Materials:</h3>
      {woMaterials.filter(m => !m.is_optional).map(material => (
        <MaterialRow material={material} required={true} />
      ))}

      <h3>Optional Materials:</h3>
      {woMaterials.filter(m => m.is_optional).map(material => (
        <MaterialRow material={material} required={false}>
          <Checkbox label="Include this component?" />  ← Operator decision
        </MaterialRow>
      ))}
    </div>
  );
}

// Consumption validates mandatory materials only
async function validateWOConsumption(woId: string) {
  const woMaterials = await WOMaterialsAPI.getByWO(woId);
  const consumed = await ConsumeAPI.getByWO(woId);

  for (const material of woMaterials) {
    if (!material.is_optional) {
      // Mandatory - must be consumed
      const consumedQty = _.sumBy(
        consumed.filter(c => c.product_id === material.product_id),
        'quantity'
      );

      if (consumedQty < material.qty_per_unit * wo.actual_quantity) {
        throw new Error(`Insufficient consumption for ${material.product_name}`);
      }
    }
    // Optional - skip validation
  }
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS support is_optional flag** on bom_items
2. **ALWAYS show optional materials separately** - clear UI distinction
3. **ALWAYS validate mandatory materials only** - optional can be skipped
4. **ALWAYS track optional consumption** - for costing/reporting

---

## Cross-Module Integration Patterns

### Pattern 20: QA Hold Blocks Consumption

**Integration:** Quality → Production/Warehouse

**Workflow:**

```
1. ASN received → LP created (status: QA_PENDING)
2. QA inspection → PASS/FAIL/HOLD decision
3. If HOLD → LP locked (cannot be reserved/consumed)
4. Planner creates WO → Material availability check shows warning
5. WO cannot start until QA releases LP (status: QA_APPROVED)
```

**Implementation:**

```typescript
// QA inspection result handling
async function updateQAStatus(
  lpId: string,
  qaStatus: 'PASS' | 'FAIL' | 'HOLD',
  reason?: string
) {
  await LicensePlatesAPI.update(lpId, {
    qa_status: qaStatus,
    qa_inspected_at: new Date().toISOString(),
    qa_notes: reason,
  });

  if (qaStatus === 'HOLD' || qaStatus === 'FAIL') {
    // Check if LP is already reserved
    const reservation = await LPReservationsAPI.getByLP(lpId);
    if (reservation) {
      // Notify planner - material for WO is blocked
      await NotificationsAPI.create({
        user_id: reservation.reserved_by,
        type: 'QA_HOLD_RESERVED_LP',
        message: `LP ${lp.lp_number} (reserved for WO ${reservation.wo_id}) is QA ${qaStatus}`,
        severity: 'HIGH',
      });
    }
  }
}

// Consumption validation
async function consumeLP(woId: string, lpId: string, qty: number) {
  const lp = await LicensePlatesAPI.getById(lpId);

  // QA block check
  if (lp.qa_status === 'HOLD') {
    throw new Error(`LP ${lp.lp_number} is on QA HOLD - cannot consume`);
  }

  if (lp.qa_status === 'FAIL') {
    throw new Error(`LP ${lp.lp_number} failed QA inspection - cannot consume`);
  }

  if (lp.qa_status === 'PENDING') {
    showWarning({
      message: `LP ${lp.lp_number} pending QA inspection`,
      action: 'Proceed anyway? (requires supervisor approval)',
    });
  }

  // ... proceed with consumption
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS check qa_status before consumption** - block if HOLD/FAIL
2. **ALWAYS notify planner** if reserved LP is QA blocked
3. **ALWAYS show QA status in LP list** - color-coded (green=PASS, red=FAIL, yellow=HOLD)
4. **ALWAYS require supervisor approval** for consuming QA_PENDING LPs

---

### Pattern 21: LP Split Before Shipping

**Integration:** Warehouse → Shipping

**Scenario:** SO needs 50 kg, LP has 100 kg (partial shipment)

**Workflow:**

```typescript
// Sales Order picks LP for shipment
async function pickLPForSO(soLineId: string, lpId: string, qtyToShip: number) {
  const lp = await LicensePlatesAPI.getById(lpId);

  if (qtyToShip === lp.quantity) {
    // Ship entire LP (no split needed)
    await SOPicksAPI.create({
      so_line_id: soLineId,
      lp_id: lpId,
      quantity: qtyToShip,
    });

    // Update LP status
    await LicensePlatesAPI.update(lpId, {
      status: 'PICKED', // Ready for shipment
    });
  } else if (qtyToShip < lp.quantity) {
    // Partial ship - SPLIT LP first
    const splitResult = await LicensePlatesAPI.split(lpId, qtyToShip);
    // splitResult = { lp1: { id: lpId, quantity: qtyToShip }, lp2: { id: newLpId, quantity: remaining } }

    // Ship split LP
    await SOPicksAPI.create({
      so_line_id: soLineId,
      lp_id: splitResult.lp1.id, // Original LP (now reduced qty)
      quantity: qtyToShip,
    });

    await LicensePlatesAPI.update(splitResult.lp1.id, {
      status: 'PICKED',
    });

    // Remaining LP stays on stock
    await LicensePlatesAPI.update(splitResult.lp2.id, {
      status: 'AVAILABLE',
      location_id: lp.location_id, // Same location
    });

    // Genealogy: Both LPs inherit original genealogy
    await LPGenealogyAPI.copySplitGenealogy(lpId, [
      splitResult.lp1.id,
      splitResult.lp2.id,
    ]);
  } else {
    throw new Error('Cannot ship more than LP quantity');
  }
}

// LP split implementation
async function splitLP(
  lpId: string,
  splitQty: number
): Promise<{ lp1: LP; lp2: LP }> {
  const lp = await LicensePlatesAPI.getById(lpId);

  if (splitQty >= lp.quantity) {
    throw new Error('Split quantity must be less than LP quantity');
  }

  // Check if LP can be split
  if (lp.status === 'RESERVED') {
    throw new Error('Cannot split reserved LP');
  }

  const remainingQty = lp.quantity - splitQty;

  // Update original LP (reduce quantity)
  const lp1 = await LicensePlatesAPI.update(lpId, {
    quantity: splitQty,
  });

  // Create new LP for remaining quantity
  const newLpNumber = await generateLPNumber('SPLIT');
  const lp2 = await LicensePlatesAPI.create({
    lp_number: newLpNumber,
    product_id: lp.product_id,
    quantity: remainingQty,
    uom: lp.uom,
    batch_number: lp.batch_number,
    expiry_date: lp.expiry_date,
    manufacture_date: lp.manufacture_date,
    supplier_id: lp.supplier_id,
    location_id: lp.location_id,
    // Inherit all attributes
  });

  return { lp1, lp2 };
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS support LP split** - partial shipment is common
2. **ALWAYS inherit attributes** - split LPs have same batch, expiry, supplier
3. **ALWAYS copy genealogy** - both split LPs track to same origin
4. **ALWAYS block split if reserved** - LP must be unreserved first

---

### Pattern 22: BOM Change Warning for Active WO

**Integration:** Technical → Production

**Scenario:** BOM edited while WO using that BOM is IN_PROGRESS

**Behavior:**

```typescript
// BOM edit handler
async function updateBOM(bomId: string, updates: BOMUpdate) {
  // Check if any active WOs use this BOM
  const activeWOs = await WorkOrdersAPI.getActiveWOsUsingBOM(bomId);

  if (activeWOs.length > 0) {
    // Show warning banner (doesn't block edit - WOs have snapshot)
    showWarning({
      title: 'Active WOs using this BOM',
      message: `${activeWOs.length} work orders are currently using BOM ${bom.version}`,
      wos: activeWOs.map(wo => wo.wo_number).join(', '),
      note: 'WOs use snapshot - changes will NOT affect them. New WOs will use updated BOM.',
    });

    // Notify supervisors
    for (const wo of activeWOs) {
      await NotificationsAPI.create({
        user_id: wo.supervisor_id,
        type: 'BOM_CHANGED_ACTIVE_WO',
        message: `BOM ${bom.version} for ${bom.product_name} was updated. WO ${wo.wo_number} uses snapshot (not affected).`,
        severity: 'INFO',
      });
    }
  }

  // Proceed with BOM update (snapshot protects active WOs)
  await BomsAPI.update(bomId, updates);
}
```

**Product Deactivation:**

```typescript
async function deactivateProduct(productId: string) {
  // Check active WOs
  const activeWOs = await WorkOrdersAPI.getActiveWOsForProduct(productId);

  if (activeWOs.length > 0) {
    // Block deactivation (requires confirmation)
    const confirmed = await confirmDialog({
      title: 'Cannot Deactivate Product',
      message: `${activeWOs.length} active work orders exist for this product`,
      wos: activeWOs.map(wo => `${wo.wo_number} (${wo.status})`).join('\n'),
      options: ['Cancel', 'Force Deactivate (WOs will complete normally)'],
    });

    if (confirmed !== 'Force Deactivate') {
      return;
    }
  }

  // Deactivate (WOs continue - they have snapshot)
  await ProductsAPI.update(productId, { is_active: false });
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS show warning** when editing BOM with active WOs
2. **ALWAYS notify supervisors** - inform about BOM changes
3. **ALWAYS require confirmation** for product deactivation if active WOs exist
4. **NEVER block edits** - snapshot protects WOs, changes safe

---

## Quality Module Patterns

### Pattern #23: QA Inspection Workflow

**Problem:**
Quality inspections must be performed at critical control points (receiving, in-process, finished goods) with standardized checklists, photo documentation, and hold/release capabilities. Failed inspections must block consumption/shipment.

**Solution:**
Structured QA inspection workflow with status-driven blocking mechanism.

**QA Status Flow:**

```
PENDING (default on LP creation)
  ↓
INSPECTING (inspection started)
  ↓
┌─────────┬──────────┐
PASS      HOLD       FAIL
  ↓         ↓          ↓
Available  Quarantine  Rejected
```

**Database Schema:**

```sql
-- QA Inspections table
CREATE TABLE qa_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Inspection context
  inspection_type VARCHAR(50) NOT NULL, -- 'RECEIVING', 'IN_PROCESS', 'FINISHED_GOODS'
  lp_id UUID REFERENCES license_plates(id), -- LP being inspected
  wo_id UUID REFERENCES work_orders(id),    -- WO being inspected (in-process)

  -- Inspection details
  inspector_id UUID NOT NULL REFERENCES users(id),
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'INSPECTING', 'PASS', 'HOLD', 'FAIL'

  -- Checklist results (JSON structure)
  checklist_results JSONB, -- { "temp_check": "PASS", "visual_check": "PASS", "weight_check": "FAIL" }

  -- Documentation
  notes TEXT,
  photos JSONB, -- Array of Supabase Storage URLs

  -- Hold/Fail reasons
  hold_reason TEXT,
  fail_reason TEXT,
  corrective_action TEXT,

  -- Release tracking (for HOLD → PASS)
  released_by UUID REFERENCES users(id),
  released_at TIMESTAMPTZ,
  release_notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA Templates (checklist definitions)
CREATE TABLE qa_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  name VARCHAR(255) NOT NULL,
  inspection_type VARCHAR(50) NOT NULL,

  -- Checklist items (JSON array)
  checklist_items JSONB NOT NULL,
  -- Example: [
  --   { "id": "temp", "label": "Temperature (4-7°C)", "type": "number", "required": true, "min": 4, "max": 7 },
  --   { "id": "visual", "label": "Visual Appearance", "type": "select", "options": ["PASS", "FAIL"], "required": true },
  --   { "id": "photo", "label": "Product Photo", "type": "photo", "required": false }
  -- ]

  -- Auto-apply rules
  product_type VARCHAR(50), -- Apply to specific product types (RM, FG, etc.)
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update license_plates table to add qa_status
ALTER TABLE license_plates
ADD COLUMN qa_status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PASS', 'HOLD', 'FAIL'
ADD COLUMN qa_inspection_id UUID REFERENCES qa_inspections(id);

-- Index for QA queries
CREATE INDEX idx_lp_qa_status ON license_plates(qa_status) WHERE is_active = TRUE;
CREATE INDEX idx_qa_inspections_status ON qa_inspections(status) WHERE status IN ('PENDING', 'INSPECTING', 'HOLD');
```

**Implementation - QA Inspection API:**

```typescript
class QualityAPI {
  /**
   * Start QA inspection for LP (receiving or finished goods)
   */
  static async startInspection(
    lpId: string,
    templateId: string
  ): Promise<QAInspection> {
    const lp = await LicensePlatesAPI.getById(lpId);
    const template = await QATemplatesAPI.getById(templateId);

    // Create inspection record
    const inspection = await supabase
      .from('qa_inspections')
      .insert({
        lp_id: lpId,
        inspection_type:
          lp.product_type === 'RM' ? 'RECEIVING' : 'FINISHED_GOODS',
        inspector_id: getCurrentUserId(),
        status: 'INSPECTING',
        checklist_results: {}, // Initialized empty
      })
      .select()
      .single();

    // Update LP status
    await LicensePlatesAPI.update(lpId, {
      qa_status: 'PENDING', // Still pending until inspection complete
      qa_inspection_id: inspection.id,
    });

    return inspection;
  }

  /**
   * Complete inspection with results (PASS/HOLD/FAIL)
   */
  static async completeInspection(
    inspectionId: string,
    results: {
      status: 'PASS' | 'HOLD' | 'FAIL';
      checklist_results: Record<string, any>;
      notes?: string;
      photos?: string[];
      hold_reason?: string;
      fail_reason?: string;
    }
  ): Promise<QAInspection> {
    const {
      status,
      checklist_results,
      notes,
      photos,
      hold_reason,
      fail_reason,
    } = results;

    // Validate all required checklist items completed
    const template = await this.getTemplateForInspection(inspectionId);
    const requiredItems = template.checklist_items.filter(
      (item: any) => item.required
    );
    const missingItems = requiredItems.filter(
      (item: any) => !checklist_results[item.id]
    );

    if (missingItems.length > 0) {
      throw new Error(
        `Missing required checklist items: ${missingItems.map(i => i.label).join(', ')}`
      );
    }

    // Update inspection
    const inspection = await supabase
      .from('qa_inspections')
      .update({
        status,
        checklist_results,
        notes,
        photos,
        hold_reason: status === 'HOLD' ? hold_reason : null,
        fail_reason: status === 'FAIL' ? fail_reason : null,
        inspection_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', inspectionId)
      .select()
      .single();

    // Update LP qa_status
    const lp = await LicensePlatesAPI.getByInspectionId(inspectionId);
    await LicensePlatesAPI.update(lp.id, {
      qa_status: status,
    });

    // If HOLD, create notification
    if (status === 'HOLD') {
      await NotificationsAPI.create({
        type: 'QA_HOLD',
        severity: 'WARNING',
        message: `LP ${lp.lp_number} placed on QA HOLD: ${hold_reason}`,
        recipients: ['qa_manager', 'supervisor'],
      });
    }

    // If FAIL, mark LP as inactive (rejected)
    if (status === 'FAIL') {
      await LicensePlatesAPI.update(lp.id, {
        is_active: false,
        status: 'REJECTED',
      });

      await NotificationsAPI.create({
        type: 'QA_FAIL',
        severity: 'ERROR',
        message: `LP ${lp.lp_number} FAILED QA: ${fail_reason}`,
        recipients: ['qa_manager', 'supervisor', 'planner'],
      });
    }

    return inspection;
  }

  /**
   * Release LP from HOLD → PASS
   */
  static async releaseFromHold(
    inspectionId: string,
    releaseNotes: string
  ): Promise<QAInspection> {
    const inspection = await this.getById(inspectionId);

    if (inspection.status !== 'HOLD') {
      throw new Error('Can only release inspections with HOLD status');
    }

    // Update inspection
    const updated = await supabase
      .from('qa_inspections')
      .update({
        status: 'PASS',
        released_by: getCurrentUserId(),
        released_at: new Date().toISOString(),
        release_notes: releaseNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inspectionId)
      .select()
      .single();

    // Update LP status
    const lp = await LicensePlatesAPI.getByInspectionId(inspectionId);
    await LicensePlatesAPI.update(lp.id, {
      qa_status: 'PASS',
    });

    // Notify
    await NotificationsAPI.create({
      type: 'QA_RELEASED',
      severity: 'INFO',
      message: `LP ${lp.lp_number} released from QA HOLD by ${getCurrentUserName()}`,
      recipients: ['supervisor', 'warehouse'],
    });

    return updated;
  }
}
```

**Integration with Consumption (Pattern #20 Implementation):**

```typescript
async function consumeMaterial(woId: string, lpId: string, quantity: number) {
  const lp = await LicensePlatesAPI.getById(lpId);

  // CRITICAL: Check QA status before consumption
  if (lp.qa_status === 'PENDING') {
    throw new Error('Cannot consume LP - QA inspection pending');
  }

  if (lp.qa_status === 'HOLD') {
    throw new Error(
      'Cannot consume LP - QA HOLD (requires QA manager release)'
    );
  }

  if (lp.qa_status === 'FAIL') {
    throw new Error('Cannot consume LP - QA FAILED (rejected)');
  }

  if (lp.qa_status !== 'PASS') {
    throw new Error('Cannot consume LP - invalid QA status');
  }

  // Proceed with consumption (qa_status = PASS)
  await ConsumeAPI.consumeLP(woId, lpId, quantity);
}
```

**Scanner UI - QA Inspection Flow:**

```typescript
// apps/frontend/app/scanner/qa-inspection/page.tsx
export default function QAInspectionPage() {
  const [step, setStep] = useState<'scan' | 'checklist' | 'photos' | 'submit'>('scan');
  const [inspection, setInspection] = useState<QAInspection | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const handleScanLP = async (lpNumber: string) => {
    const lp = await LicensePlatesAPI.getByLPNumber(lpNumber);

    // Start inspection
    const template = await QATemplatesAPI.getForProductType(lp.product_type);
    const newInspection = await QualityAPI.startInspection(lp.id, template.id);

    setInspection(newInspection);
    setStep('checklist');
  };

  const handleChecklistItem = (itemId: string, value: any) => {
    setResults(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async (finalStatus: 'PASS' | 'HOLD' | 'FAIL') => {
    await QualityAPI.completeInspection(inspection!.id, {
      status: finalStatus,
      checklist_results: results,
      notes: results._notes,
      photos: results._photos,
      hold_reason: finalStatus === 'HOLD' ? results._hold_reason : undefined,
      fail_reason: finalStatus === 'FAIL' ? results._fail_reason : undefined,
    });

    // Show success and reset
    showToast({
      type: finalStatus === 'PASS' ? 'success' : 'warning',
      message: `Inspection ${finalStatus}`,
    });

    setStep('scan');
    setInspection(null);
    setResults({});
  };

  return (
    <div className="qa-inspection-scanner">
      {step === 'scan' && (
        <LPScanner onScan={handleScanLP} />
      )}

      {step === 'checklist' && (
        <ChecklistForm
          template={inspection!.template}
          results={results}
          onChange={handleChecklistItem}
          onNext={() => setStep('photos')}
        />
      )}

      {step === 'photos' && (
        <PhotoCapture
          photos={results._photos || []}
          onChange={photos => setResults(prev => ({ ...prev, _photos: photos }))}
          onNext={() => setStep('submit')}
        />
      )}

      {step === 'submit' && (
        <InspectionReview
          results={results}
          onPass={() => handleSubmit('PASS')}
          onHold={() => handleSubmit('HOLD')}
          onFail={() => handleSubmit('FAIL')}
        />
      )}
    </div>
  );
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS check qa_status** before LP consumption/shipment
2. **ALWAYS block consumption** if qa_status != 'PASS'
3. **ALWAYS create notification** on HOLD or FAIL
4. **ALWAYS require QA manager** to release from HOLD
5. **ALWAYS mark LP inactive** on FAIL status
6. **NEVER allow status bypass** - no admin override for consumption

---

### Pattern #24: CoA (Certificate of Analysis) Generation

**Problem:**
Food manufacturers must provide Certificates of Analysis (CoA) for finished goods shipments, documenting test results, lot numbers, production dates, and compliance statements. Manual CoA generation is time-consuming and error-prone.

**Solution:**
Template-based CoA generation with auto-population from QA inspections and LP data.

**Database Schema:**

```sql
-- CoA Templates
CREATE TABLE coa_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  name VARCHAR(255) NOT NULL,
  product_id UUID REFERENCES products(id), -- Template for specific product (or NULL for generic)

  -- Template content (HTML with placeholders)
  template_html TEXT NOT NULL,
  -- Example: "<h1>Certificate of Analysis</h1><p>Product: {{product_name}}</p>..."

  -- Header/Footer
  header_html TEXT,
  footer_html TEXT,

  -- Company branding
  logo_url TEXT, -- Supabase Storage URL

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated CoAs
CREATE TABLE coas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Reference data
  coa_number VARCHAR(50) UNIQUE NOT NULL, -- COA-2025-001
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  product_id UUID NOT NULL REFERENCES products(id),
  qa_inspection_id UUID REFERENCES qa_inspections(id),

  -- CoA metadata
  generated_by UUID NOT NULL REFERENCES users(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Content
  template_id UUID REFERENCES coa_templates(id),
  html_content TEXT NOT NULL, -- Rendered HTML
  pdf_url TEXT, -- Supabase Storage URL to PDF

  -- Data used for generation (snapshot for audit)
  data_snapshot JSONB NOT NULL,
  -- Example: {
  --   "lp_number": "LP-2025-001",
  --   "batch_number": "BATCH-123",
  --   "manufacture_date": "2025-11-14",
  --   "expiry_date": "2025-12-14",
  --   "qa_results": { "temp": 5.2, "visual": "PASS" },
  --   "product_name": "Chocolate Chip Cookies",
  --   "quantity": 100,
  --   "uom": "kg"
  -- }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attach CoAs to shipments
ALTER TABLE shipments
ADD COLUMN coa_ids UUID[] DEFAULT '{}'; -- Array of CoA IDs

CREATE INDEX idx_coas_lp ON coas(lp_id);
CREATE INDEX idx_coas_product ON coas(product_id);
```

**Implementation - CoA Generation:**

```typescript
class CoAAPI {
  /**
   * Generate CoA for finished goods LP
   */
  static async generateCoA(lpId: string): Promise<CoA> {
    const lp = await LicensePlatesAPI.getById(lpId);
    const product = await ProductsAPI.getById(lp.product_id);
    const qaInspection = await QualityAPI.getByLPId(lpId);

    // Validate LP is finished goods with PASS status
    if (lp.product_type !== 'FG') {
      throw new Error('CoA can only be generated for finished goods');
    }

    if (lp.qa_status !== 'PASS') {
      throw new Error('CoA requires QA PASS status');
    }

    // Get template for product
    const template = await CoATemplatesAPI.getForProduct(lp.product_id);

    // Prepare data for template rendering
    const data = {
      // LP data
      lp_number: lp.lp_number,
      batch_number: lp.batch_number,
      manufacture_date: lp.manufacture_date,
      expiry_date: lp.expiry_date,
      quantity: lp.quantity,
      uom: lp.uom,

      // Product data
      product_name: product.name,
      product_code: product.code,
      product_description: product.description,

      // QA data
      qa_inspection_date: qaInspection.inspection_date,
      qa_inspector: await UsersAPI.getById(qaInspection.inspector_id),
      qa_results: qaInspection.checklist_results,

      // Company data
      company_name: await OrganizationsAPI.getCurrentName(),
      company_address: await OrganizationsAPI.getCurrentAddress(),

      // CoA metadata
      coa_number: await this.generateCoANumber(),
      generated_date: new Date().toISOString(),
      generated_by: await UsersAPI.getCurrent(),
    };

    // Render HTML from template
    const htmlContent = this.renderTemplate(template.template_html, data);

    // Generate PDF
    const pdfUrl = await this.generatePDF(htmlContent, {
      header: template.header_html,
      footer: template.footer_html,
      logo: template.logo_url,
    });

    // Save CoA record
    const coa = await supabase
      .from('coas')
      .insert({
        coa_number: data.coa_number,
        lp_id: lpId,
        product_id: lp.product_id,
        qa_inspection_id: qaInspection.id,
        generated_by: getCurrentUserId(),
        template_id: template.id,
        html_content: htmlContent,
        pdf_url: pdfUrl,
        data_snapshot: data,
      })
      .select()
      .single();

    return coa;
  }

  /**
   * Render template with data
   */
  private static renderTemplate(
    template: string,
    data: Record<string, any>
  ): string {
    // Simple Handlebars-style templating
    let rendered = template;

    Object.keys(data).forEach(key => {
      const value = data[key];
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(placeholder, String(value));
    });

    // Handle nested data (QA results)
    if (data.qa_results) {
      Object.keys(data.qa_results).forEach(key => {
        const value = data.qa_results[key];
        const placeholder = new RegExp(`{{qa_results.${key}}}`, 'g');
        rendered = rendered.replace(placeholder, String(value));
      });
    }

    return rendered;
  }

  /**
   * Generate PDF from HTML using Puppeteer or similar
   */
  private static async generatePDF(
    htmlContent: string,
    options: { header?: string; footer?: string; logo?: string }
  ): Promise<string> {
    // In production: Use Puppeteer via Vercel Serverless Function or Supabase Edge Function
    // For MVP: Can use client-side PDF generation (jsPDF) or server-side service

    // Example with Vercel Serverless Function:
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: htmlContent,
        header: options.header,
        footer: options.footer,
        logo: options.logo,
      }),
    });

    const { pdfUrl } = await response.json();
    return pdfUrl; // Supabase Storage URL
  }

  /**
   * Generate unique CoA number
   */
  private static async generateCoANumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await supabase
      .from('coas')
      .select('id', { count: 'exact' })
      .like('coa_number', `COA-${year}-%`);

    const nextNumber = (count.count || 0) + 1;
    return `COA-${year}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Attach CoA to shipment
   */
  static async attachToShipment(
    coaId: string,
    shipmentId: string
  ): Promise<void> {
    const shipment = await ShipmentsAPI.getById(shipmentId);
    const updatedCoAIds = [...(shipment.coa_ids || []), coaId];

    await ShipmentsAPI.update(shipmentId, {
      coa_ids: updatedCoAIds,
    });
  }
}
```

**CoA Template Example:**

```html
<!-- Default CoA Template -->
<!DOCTYPE html>
<html>
  <head>
    <title>Certificate of Analysis</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 40px;
      }
      .header {
        text-align: center;
        margin-bottom: 40px;
      }
      .header img {
        max-width: 200px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      th,
      td {
        border: 1px solid #ddd;
        padding: 12px;
        text-align: left;
      }
      th {
        background-color: #f2f2f2;
      }
      .signature {
        margin-top: 60px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="{{logo_url}}" alt="Company Logo" />
      <h1>Certificate of Analysis</h1>
      <p><strong>CoA Number:</strong> {{coa_number}}</p>
      <p><strong>Date Issued:</strong> {{generated_date}}</p>
    </div>

    <h2>Product Information</h2>
    <table>
      <tr>
        <th>Product Name</th>
        <td>{{product_name}}</td>
      </tr>
      <tr>
        <th>Product Code</th>
        <td>{{product_code}}</td>
      </tr>
      <tr>
        <th>Batch/Lot Number</th>
        <td>{{batch_number}}</td>
      </tr>
      <tr>
        <th>Manufacture Date</th>
        <td>{{manufacture_date}}</td>
      </tr>
      <tr>
        <th>Expiry Date</th>
        <td>{{expiry_date}}</td>
      </tr>
      <tr>
        <th>Quantity</th>
        <td>{{quantity}} {{uom}}</td>
      </tr>
    </table>

    <h2>Quality Control Results</h2>
    <table>
      <tr>
        <th>Test Parameter</th>
        <th>Result</th>
        <th>Specification</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Temperature</td>
        <td>{{qa_results.temp}}°C</td>
        <td>4-7°C</td>
        <td>✓ PASS</td>
      </tr>
      <tr>
        <td>Visual Appearance</td>
        <td>{{qa_results.visual}}</td>
        <td>No defects</td>
        <td>✓ PASS</td>
      </tr>
      <tr>
        <td>Weight Check</td>
        <td>{{qa_results.weight}} kg</td>
        <td>±2% tolerance</td>
        <td>✓ PASS</td>
      </tr>
    </table>

    <div class="signature">
      <p><strong>Inspected by:</strong> {{qa_inspector.name}}</p>
      <p><strong>Inspection Date:</strong> {{qa_inspection_date}}</p>
      <p><strong>Signature:</strong> _______________________</p>
    </div>

    <p style="margin-top: 40px; font-size: 12px; color: #666;">
      This certificate is issued in accordance with ISO 22000 standards and
      applicable food safety regulations. For questions regarding this
      certificate, please contact {{company_name}} at {{company_address}}.
    </p>
  </body>
</html>
```

**AI Agent Implementation Rules:**

1. **ALWAYS verify qa_status = PASS** before generating CoA
2. **ALWAYS use FG (finished goods) only** - no CoAs for RM/ING/PR
3. **ALWAYS attach CoA to shipment** before shipping
4. **ALWAYS snapshot data** in coa record (immutable audit trail)
5. **ALWAYS generate unique CoA number** (COA-YYYY-NNNN format)
6. **NEVER regenerate CoA** - create new version if changes needed

---

## Shipping Module Patterns

### Pattern #25: Sales Order → Shipment Flow

**Problem:**
Sales orders must be fulfilled by allocating available LPs, creating shipments, and tracking delivery. Partial shipments, pallet consolidation, and BOL generation must be supported.

**Solution:**
Sales order management with LP allocation, shipment creation, and status tracking.

**Database Schema:**

```sql
-- Sales Orders
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  so_number VARCHAR(50) UNIQUE NOT NULL, -- SO-2025-001
  customer_id UUID NOT NULL REFERENCES customers(id),

  -- Order details
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_delivery_date DATE,

  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  -- 'DRAFT', 'CONFIRMED', 'PICKING', 'PARTIAL_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED'

  -- Shipping info
  shipping_address TEXT NOT NULL,
  shipping_notes TEXT,
  carrier VARCHAR(100),

  -- Totals
  total_amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales Order Lines
CREATE TABLE sales_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  so_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  line_number INT NOT NULL,

  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,

  unit_price DECIMAL(15,2),
  line_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

  -- Fulfillment tracking
  qty_allocated DECIMAL(15,3) DEFAULT 0,
  qty_shipped DECIMAL(15,3) DEFAULT 0,
  qty_remaining DECIMAL(15,3) GENERATED ALWAYS AS (quantity - qty_shipped) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(so_id, line_number)
);

-- Shipments
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  shipment_number VARCHAR(50) UNIQUE NOT NULL, -- SHIP-2025-001
  so_id UUID NOT NULL REFERENCES sales_orders(id),

  -- Shipment details
  shipment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,

  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  -- 'DRAFT', 'READY', 'PICKED', 'PACKED', 'SHIPPED', 'DELIVERED'

  -- Carrier info
  carrier VARCHAR(100),
  tracking_number VARCHAR(100),
  freight_cost DECIMAL(15,2),

  -- Documents
  bol_id UUID REFERENCES bols(id),
  coa_ids UUID[] DEFAULT '{}',
  packing_list_url TEXT,

  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment Items (LP allocations)
CREATE TABLE shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
  so_line_id UUID NOT NULL REFERENCES sales_order_lines(id),

  lp_id UUID NOT NULL REFERENCES license_plates(id),
  quantity DECIMAL(15,3) NOT NULL, -- Can be partial if LP split
  uom VARCHAR(20) NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  shipping_address TEXT,
  billing_address TEXT,

  -- Defaults
  default_carrier VARCHAR(100),
  payment_terms VARCHAR(100),

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_so_status ON sales_orders(status) WHERE status NOT IN ('SHIPPED', 'DELIVERED', 'CANCELLED');
CREATE INDEX idx_shipment_status ON shipments(status) WHERE status NOT IN ('DELIVERED');
```

**Implementation - Sales Order & Shipment API:**

```typescript
class SalesOrdersAPI {
  /**
   * Create sales order
   */
  static async create(data: {
    customer_id: string;
    requested_delivery_date: Date;
    shipping_address: string;
    lines: Array<{
      product_id: string;
      quantity: number;
      uom: string;
      unit_price: number;
    }>;
  }): Promise<SalesOrder> {
    const soNumber = await this.generateSONumber();

    // Create SO header
    const so = await supabase
      .from('sales_orders')
      .insert({
        so_number: soNumber,
        customer_id: data.customer_id,
        requested_delivery_date: data.requested_delivery_date,
        shipping_address: data.shipping_address,
        status: 'DRAFT',
        created_by: getCurrentUserId(),
      })
      .select()
      .single();

    // Create SO lines
    for (let i = 0; i < data.lines.length; i++) {
      const line = data.lines[i];
      await supabase.from('sales_order_lines').insert({
        so_id: so.id,
        line_number: i + 1,
        product_id: line.product_id,
        quantity: line.quantity,
        uom: line.uom,
        unit_price: line.unit_price,
      });
    }

    return this.getById(so.id);
  }

  /**
   * Suggest LPs for SO line allocation (Pattern #13 integration)
   */
  static async suggestLPsForLine(soLineId: string): Promise<LicensePlate[]> {
    const line = await SOLinesAPI.getById(soLineId);
    const product = await ProductsAPI.getById(line.product_id);

    // Get available LPs with matching product and UoM (Pattern #13: Smart LP Suggestions)
    const suggestions = await LicensePlatesAPI.getAll({
      product_id: line.product_id,
      uom: line.uom, // Pattern #4: Strict UoM - no conversion
      qa_status: 'PASS', // Pattern #20: QA Hold Blocks
      status: 'AVAILABLE',
      sort: product.is_perishable ? 'FEFO' : 'FIFO',
    });

    return suggestions;
  }

  /**
   * Allocate LP to SO line
   */
  static async allocateLP(
    soLineId: string,
    lpId: string,
    quantity: number
  ): Promise<void> {
    const line = await SOLinesAPI.getById(soLineId);
    const lp = await LicensePlatesAPI.getById(lpId);

    // Validation
    if (lp.product_id !== line.product_id) {
      throw new Error('LP product does not match SO line product');
    }

    if (lp.uom !== line.uom) {
      throw new Error(
        'LP UoM does not match SO line UoM (no automatic conversion)'
      );
    }

    if (lp.qa_status !== 'PASS') {
      throw new Error('Cannot allocate LP with non-PASS QA status');
    }

    if (quantity > lp.quantity) {
      throw new Error('Allocation quantity exceeds LP quantity');
    }

    // Split LP if partial allocation (Pattern #21: LP Split Before Shipping)
    let allocatedLP = lp;
    if (quantity < lp.quantity) {
      const { splitLP } = await LicensePlatesAPI.split(lpId, quantity);
      allocatedLP = splitLP;
    }

    // Reserve LP (Pattern #3: Hard LP Reservation)
    await LPReservationsAPI.create({
      lp_id: allocatedLP.id,
      reserved_for_type: 'SALES_ORDER',
      reserved_for_id: line.so_id,
      quantity: quantity,
    });

    // Update SO line allocated qty
    await SOLinesAPI.update(soLineId, {
      qty_allocated: line.qty_allocated + quantity,
    });
  }
}

class ShipmentsAPI {
  /**
   * Create shipment from sales order
   */
  static async createFromSO(
    soId: string,
    options?: {
      partial?: boolean; // Allow partial shipment
      lpIds?: string[]; // Specific LPs to ship (for partial)
    }
  ): Promise<Shipment> {
    const so = await SalesOrdersAPI.getById(soId);
    const shipmentNumber = await this.generateShipmentNumber();

    // Create shipment header
    const shipment = await supabase
      .from('shipments')
      .insert({
        shipment_number: shipmentNumber,
        so_id: soId,
        carrier: so.customer.default_carrier,
        status: 'DRAFT',
        created_by: getCurrentUserId(),
      })
      .select()
      .single();

    // Get allocated LPs for SO
    const allocatedLPs = await LPReservationsAPI.getByReservation(
      'SALES_ORDER',
      soId
    );

    // Filter to specific LPs if partial shipment
    const lpsToShip = options?.lpIds
      ? allocatedLPs.filter(lp => options.lpIds!.includes(lp.id))
      : allocatedLPs;

    // Create shipment items
    for (const lp of lpsToShip) {
      const soLine = await SOLinesAPI.getByProduct(soId, lp.product_id);

      await supabase.from('shipment_items').insert({
        shipment_id: shipment.id,
        so_line_id: soLine.id,
        lp_id: lp.id,
        quantity: lp.quantity,
        uom: lp.uom,
      });
    }

    return this.getById(shipment.id);
  }

  /**
   * Generate CoAs for all FG LPs in shipment
   */
  static async generateCoAsForShipment(shipmentId: string): Promise<CoA[]> {
    const items = await ShipmentItemsAPI.getByShipment(shipmentId);
    const coas: CoA[] = [];

    for (const item of items) {
      const lp = await LicensePlatesAPI.getById(item.lp_id);

      if (lp.product_type === 'FG') {
        // Generate CoA (Pattern #24)
        const coa = await CoAAPI.generateCoA(lp.id);
        coas.push(coa);

        // Attach to shipment
        await CoAAPI.attachToShipment(coa.id, shipmentId);
      }
    }

    return coas;
  }

  /**
   * Mark shipment as shipped
   */
  static async ship(
    shipmentId: string,
    data: {
      tracking_number: string;
      carrier: string;
      shipment_date?: Date;
    }
  ): Promise<Shipment> {
    const shipment = await this.getById(shipmentId);

    // Update shipment
    const updated = await supabase
      .from('shipments')
      .update({
        status: 'SHIPPED',
        tracking_number: data.tracking_number,
        carrier: data.carrier,
        shipment_date: data.shipment_date || new Date(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', shipmentId)
      .select()
      .single();

    // Update SO line qty_shipped
    const items = await ShipmentItemsAPI.getByShipment(shipmentId);
    for (const item of items) {
      const soLine = await SOLinesAPI.getById(item.so_line_id);
      await SOLinesAPI.update(item.so_line_id, {
        qty_shipped: soLine.qty_shipped + item.quantity,
      });
    }

    // Update SO status
    const so = await SalesOrdersAPI.getById(shipment.so_id);
    const allLines = await SOLinesAPI.getBySO(so.id);
    const allShipped = allLines.every(line => line.qty_remaining === 0);
    const anyShipped = allLines.some(line => line.qty_shipped > 0);

    if (allShipped) {
      await SalesOrdersAPI.update(so.id, { status: 'SHIPPED' });
    } else if (anyShipped) {
      await SalesOrdersAPI.update(so.id, { status: 'PARTIAL_SHIP' });
    }

    // Release LP reservations (LPs now consumed by shipment)
    for (const item of items) {
      await LPReservationsAPI.releaseByLP(item.lp_id);
      await LicensePlatesAPI.update(item.lp_id, { status: 'SHIPPED' });
    }

    return updated;
  }
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS use LP suggestions** (Pattern #13) for allocation
2. **ALWAYS validate UoM match** (Pattern #4) - no conversion
3. **ALWAYS check qa_status = PASS** (Pattern #20) before allocation
4. **ALWAYS split LP** (Pattern #21) if partial quantity
5. **ALWAYS generate CoAs** (Pattern #24) for FG before shipping
6. **ALWAYS update SO line qty_shipped** when shipment ships
7. **NEVER ship without CoAs** for finished goods

---

### Pattern #26: BOL (Bill of Lading) Generation

**Problem:**
Shipping carriers require standardized Bills of Lading documenting shipment contents, weights, pallet counts, and carrier information. Manual BOL creation is error-prone.

**Solution:**
Auto-generated BOL from shipment data with PDF export.

**Database Schema:**

```sql
-- Bill of Lading
CREATE TABLE bols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  bol_number VARCHAR(50) UNIQUE NOT NULL, -- BOL-2025-001
  shipment_id UUID NOT NULL REFERENCES shipments(id),

  -- BOL metadata
  bol_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Shipper (from org)
  shipper_name VARCHAR(255) NOT NULL,
  shipper_address TEXT NOT NULL,

  -- Consignee (from customer)
  consignee_name VARCHAR(255) NOT NULL,
  consignee_address TEXT NOT NULL,

  -- Carrier
  carrier_name VARCHAR(100) NOT NULL,
  carrier_scac VARCHAR(4), -- Standard Carrier Alpha Code
  pro_number VARCHAR(50), -- Progressive number (carrier tracking)

  -- Shipment details
  total_pallets INT NOT NULL,
  total_weight DECIMAL(15,3) NOT NULL,
  weight_uom VARCHAR(10) DEFAULT 'kg',

  -- Freight terms
  freight_terms VARCHAR(50), -- 'PREPAID', 'COLLECT', 'THIRD_PARTY'
  freight_charge DECIMAL(15,2),

  -- Items summary (JSON)
  items_summary JSONB NOT NULL,
  -- Example: [
  --   { "product": "Chocolate Cookies", "quantity": 100, "uom": "kg", "pallets": 2 },
  --   { "product": "Vanilla Cookies", "quantity": 50, "uom": "kg", "pallets": 1 }
  -- ]

  -- Generated PDF
  pdf_url TEXT, -- Supabase Storage URL

  -- Audit
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bol_shipment ON bols(shipment_id);

-- Attach BOL to shipment
ALTER TABLE shipments
ADD COLUMN bol_id UUID REFERENCES bols(id);
```

**Implementation - BOL Generation:**

```typescript
class BOLsAPI {
  /**
   * Generate BOL for shipment
   */
  static async generateForShipment(shipmentId: string): Promise<BOL> {
    const shipment = await ShipmentsAPI.getById(shipmentId);
    const so = await SalesOrdersAPI.getById(shipment.so_id);
    const customer = await CustomersAPI.getById(so.customer_id);
    const org = await OrganizationsAPI.getCurrent();

    // Get shipment items and calculate totals
    const items = await ShipmentItemsAPI.getByShipment(shipmentId);
    const itemsSummary = await this.buildItemsSummary(items);
    const totalPallets = itemsSummary.reduce(
      (sum, item) => sum + item.pallets,
      0
    );
    const totalWeight = itemsSummary.reduce(
      (sum, item) => sum + item.weight,
      0
    );

    const bolNumber = await this.generateBOLNumber();

    // Create BOL record
    const bol = await supabase
      .from('bols')
      .insert({
        bol_number: bolNumber,
        shipment_id: shipmentId,

        // Shipper (org)
        shipper_name: org.name,
        shipper_address: org.address,

        // Consignee (customer)
        consignee_name: customer.name,
        consignee_address:
          customer.shipping_address || customer.billing_address,

        // Carrier
        carrier_name: shipment.carrier,
        carrier_scac: await this.getCarrierSCAC(shipment.carrier),
        pro_number: shipment.tracking_number,

        // Totals
        total_pallets: totalPallets,
        total_weight: totalWeight,
        weight_uom: 'kg',

        // Freight
        freight_terms:
          customer.payment_terms === 'PREPAID' ? 'PREPAID' : 'COLLECT',
        freight_charge: shipment.freight_cost,

        items_summary: itemsSummary,

        generated_by: getCurrentUserId(),
      })
      .select()
      .single();

    // Generate PDF
    const pdfUrl = await this.generateBOLPDF(bol);

    // Update BOL with PDF URL
    await supabase.from('bols').update({ pdf_url: pdfUrl }).eq('id', bol.id);

    // Attach to shipment
    await ShipmentsAPI.update(shipmentId, { bol_id: bol.id });

    return { ...bol, pdf_url: pdfUrl };
  }

  /**
   * Build items summary with pallet counts
   */
  private static async buildItemsSummary(
    items: ShipmentItem[]
  ): Promise<any[]> {
    const grouped = _.groupBy(items, 'product_id');
    const summary = [];

    for (const [productId, productItems] of Object.entries(grouped)) {
      const product = await ProductsAPI.getById(productId);
      const totalQty = productItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const totalWeight = await this.calculateTotalWeight(productItems);
      const palletCount = productItems.length; // Assuming 1 LP = 1 pallet (Pattern #1)

      summary.push({
        product: product.name,
        quantity: totalQty,
        uom: productItems[0].uom,
        pallets: palletCount,
        weight: totalWeight,
      });
    }

    return summary;
  }

  /**
   * Generate BOL PDF
   */
  private static async generateBOLPDF(bol: BOL): Promise<string> {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Bill of Lading - ${bol.bol_number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background-color: #f0f0f0; }
    .signature-box { margin-top: 40px; border: 1px solid #000; padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>BILL OF LADING</h1>
    <p><strong>BOL Number:</strong> ${bol.bol_number}</p>
    <p><strong>Date:</strong> ${bol.bol_date}</p>
  </div>

  <div class="section">
    <h3>Shipper</h3>
    <p>${bol.shipper_name}<br>${bol.shipper_address}</p>
  </div>

  <div class="section">
    <h3>Consignee</h3>
    <p>${bol.consignee_name}<br>${bol.consignee_address}</p>
  </div>

  <div class="section">
    <h3>Carrier Information</h3>
    <p><strong>Carrier:</strong> ${bol.carrier_name}</p>
    <p><strong>SCAC:</strong> ${bol.carrier_scac}</p>
    <p><strong>PRO Number:</strong> ${bol.pro_number}</p>
    <p><strong>Freight Terms:</strong> ${bol.freight_terms}</p>
  </div>

  <div class="section">
    <h3>Shipment Details</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>UoM</th>
          <th>Pallets</th>
          <th>Weight (kg)</th>
        </tr>
      </thead>
      <tbody>
        ${bol.items_summary
          .map(
            item => `
          <tr>
            <td>${item.product}</td>
            <td>${item.quantity}</td>
            <td>${item.uom}</td>
            <td>${item.pallets}</td>
            <td>${item.weight}</td>
          </tr>
        `
          )
          .join('')}
        <tr style="font-weight: bold;">
          <td colspan="3">TOTAL</td>
          <td>${bol.total_pallets}</td>
          <td>${bol.total_weight}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="signature-box">
    <p><strong>Shipper Signature:</strong> _______________________  <strong>Date:</strong> __________</p>
    <p><strong>Carrier Signature:</strong> _______________________  <strong>Date:</strong> __________</p>
    <p><strong>Consignee Signature:</strong> ______________________  <strong>Date:</strong> __________</p>
  </div>

  <p style="margin-top: 30px; font-size: 10px;">
    This is to certify that the above-named materials are properly classified, described, packaged,
    marked and labeled, and are in proper condition for transportation according to applicable
    regulations of the Department of Transportation.
  </p>
</body>
</html>
    `;

    // Generate PDF (same as CoA generation)
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: htmlContent }),
    });

    const { pdfUrl } = await response.json();
    return pdfUrl;
  }

  /**
   * Generate unique BOL number
   */
  private static async generateBOLNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await supabase
      .from('bols')
      .select('id', { count: 'exact' })
      .like('bol_number', `BOL-${year}-%`);

    const nextNumber = (count.count || 0) + 1;
    return `BOL-${year}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Get carrier SCAC code
   */
  private static async getCarrierSCAC(carrierName: string): Promise<string> {
    const scacMap: Record<string, string> = {
      FedEx: 'FDEG',
      UPS: 'UPGF',
      DHL: 'DHLG',
      USPS: 'USPS',
      // Add more as needed
    };

    return scacMap[carrierName] || 'UNKN';
  }
}
```

**AI Agent Implementation Rules:**

1. **ALWAYS generate BOL** before marking shipment as SHIPPED
2. **ALWAYS calculate total pallets** from shipment items (LP count)
3. **ALWAYS include all items** in items_summary
4. **ALWAYS attach BOL** to shipment record
5. **ALWAYS generate unique BOL number** (BOL-YYYY-NNNN format)
6. **NEVER ship without BOL** - critical shipping document

---

## BI & Monitoring Architecture

### Real-Time vs Batch Calculations

**Real-Time Metrics** (WebSocket updates):

- WO progress (% complete, actual vs planned quantity)
- Inventory levels (available qty, reserved qty)
- Machine status (running, idle, down)

**Batch Metrics** (Calculated hourly/daily):

- OEE (Overall Equipment Effectiveness)
- Material yields (daily/weekly aggregates)
- Scrap rates (trend analysis)
- WO completion rate (on-time %)
- Cost variance (planned vs actual)

**Implementation:**

```sql
-- Real-time view (materialized, refreshed on data change)
CREATE MATERIALIZED VIEW inventory_summary AS
SELECT
  product_id,
  SUM(quantity) FILTER (WHERE status = 'AVAILABLE') AS available_qty,
  SUM(quantity) FILTER (WHERE status = 'RESERVED') AS reserved_qty,
  SUM(quantity) FILTER (WHERE status = 'QA_HOLD') AS qa_hold_qty,
  COUNT(*) AS total_lps
FROM license_plates
WHERE is_active = TRUE
GROUP BY product_id;

-- Refresh trigger (real-time update)
CREATE TRIGGER refresh_inventory_summary
AFTER INSERT OR UPDATE OR DELETE ON license_plates
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_materialized_view('inventory_summary');

-- Batch calculation (nightly job)
CREATE TABLE production_kpis_daily (
  date DATE,
  wo_id UUID REFERENCES work_orders(id),
  oee DECIMAL(5,2),           -- Overall Equipment Effectiveness
  availability DECIMAL(5,2),  -- Uptime %
  performance DECIMAL(5,2),   -- Speed %
  quality DECIMAL(5,2),       -- Yield %
  material_yields JSONB,      -- { 'RM-MEAT': 87.96, 'RM-FLOUR': 92.3 }
  scrap_rate DECIMAL(5,2),
  cost_variance DECIMAL(10,2),
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nightly calculation (Supabase Edge Function / Vercel Cron)
async function calculateDailyKPIs() {
  const yesterday = subDays(new Date(), 1);
  const completedWOs = await WorkOrdersAPI.getCompletedOnDate(yesterday);

  for (const wo of completedWOs) {
    const kpis = await calculateWOKPIs(wo.id);
    await ProductionKPIsAPI.saveDailyKPI(yesterday, wo.id, kpis);
  }
}
```

**Notification Rules:**

```typescript
interface NotificationRule {
  event: string;
  condition: string;
  recipients: string[]; // User IDs or roles
  delivery: 'in-app' | 'email' | 'both';
}

const NOTIFICATION_RULES: NotificationRule[] = [
  {
    event: 'WO_DELAYED',
    condition: 'scheduled_date < NOW() AND status != COMPLETED',
    recipients: ['planner', 'manager'],
    delivery: 'both',
  },
  {
    event: 'LOW_STOCK',
    condition: 'available_qty < reorder_point',
    recipients: ['planner', 'purchasing'],
    delivery: 'both',
  },
  {
    event: 'QA_HOLD',
    condition: 'qa_status = HOLD',
    recipients: ['qa_manager', 'planner'],
    delivery: 'in-app',
  },
  {
    event: 'YIELD_VARIANCE_HIGH',
    condition: 'ABS(yield - 100) > 10', // >10% variance
    recipients: ['production_manager', 'supervisor'],
    delivery: 'email',
  },
];
```

**AI Agent Implementation Rules:**

1. **ALWAYS use real-time for critical data** - inventory, WO progress
2. **ALWAYS use batch for analytics** - OEE, yields, trends
3. **ALWAYS configure notifications** - per event type
4. **ALWAYS support email + in-app** - dual delivery

---

## Testing Strategy

### Test Coverage Target (Decision #8)

**95%+ Coverage** across all layers - highest rigor for production readiness.

**Coverage Breakdown:**

- **E2E Tests (Playwright)**: 100% critical user workflows
- **Unit Tests (Vitest)**: 95%+ API class coverage (24/28 APIs tested = 86% → target 95%+)
- **Integration Tests**: All API routes with database round-trips

### E2E Testing (Playwright)

**Test Organization:**

```
e2e/
├── 01-auth.spec.ts                    # Login, signup, session management
├── 02-purchase-orders.spec.ts         # PO CRUD, line items
├── 03-transfer-orders.spec.ts         # TO CRUD, warehouse transfers
├── 04-work-orders.spec.ts             # WO creation, BOM snapshot
├── 05-work-orders-advanced.spec.ts    # [TODO] WO start, output, yield
├── 10-asn-workflow.spec.ts            # ASN receiving, LP creation
├── 11-lp-genealogy.spec.ts            # Forward/backward traceability
├── 12-pallet-management.spec.ts       # Pallet composition
├── 20-scanner-consume.spec.ts         # [TODO] Manual consumption flow
├── 21-scanner-output.spec.ts          # [TODO] Production output registration
└── 22-scanner-odkonsumpcja.spec.ts    # [TODO] Reverse consumption
```

**Example E2E Test (Work Order Creation with BOM Snapshot):**

```typescript
// e2e/04-work-orders.spec.ts
test('should create WO and snapshot BOM materials', async ({ page }) => {
  await page.goto('/planning/work-orders');
  await page.click('button:has-text("New Work Order")');

  // Fill WO form
  await page.selectOption('select[name="product_id"]', 'Chocolate Chip Cookie');
  await page.selectOption('select[name="bom_id"]', 'BOM v3 (2024-11-01)');
  await page.fill('input[name="planned_quantity"]', '100');
  await page.fill('input[name="scheduled_date"]', '2025-11-20');

  // Submit and verify WO created
  await page.click('button:has-text("Create Work Order")');
  await expect(page.locator('.toast-success')).toContainText(
    'Work order created'
  );

  // Verify BOM snapshot in wo_materials table
  const woNumber = await page.locator('.wo-number').textContent();
  const woMaterials = await getWOMaterialsFromDB(woNumber);

  expect(woMaterials).toHaveLength(4); // 4 BOM items
  expect(woMaterials[0]).toMatchObject({
    product_id: 'flour-id',
    qty_per_unit: 2.5,
    uom: 'kg',
    scrap_percentage: 0.05,
  });
});
```

**Critical Workflows to Test (E2E):**

1. **Planning Module**:
   - Create PO with 3 lines → Submit → Verify in DB
   - Create TO between warehouses → Verify transit location
   - Create WO → Verify BOM snapshot in wo_materials
2. **Warehouse Module**:
   - Create ASN → Receive 2 items → Verify LPs created
   - Move LP to different location → Verify stock_moves record
   - Trace LP genealogy forward/backward → Verify tree structure
3. **Scanner Module (Critical!)**:
   - Register production output (38 boxes) → Verify LP-OUT-001 created
   - Manual consume LP-123 → Verify reservation, genealogy link
   - Odkonsumpcja (reverse 5 kg) → Verify LP qty restored
   - Offline scenario → Queue operation → Sync when online
4. **Production Module**:
   - Start WO → Verify status change
   - Register output with automatic consumption → Verify wo_materials consumed
   - Calculate yield → Verify scrap tracking

### Unit Testing (Vitest)

**API Class Test Template:**

```typescript
// lib/api/__tests__/suppliers.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuppliersAPI } from '../suppliers';

vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('SuppliersAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch only active suppliers', async () => {
      const mockSuppliers = [
        { id: 1, name: 'ABC Ltd', code: 'ABC', is_active: true },
        { id: 2, name: 'XYZ Co', code: 'XYZ', is_active: true },
      ];

      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockSuppliers, error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await SuppliersAPI.getAll();

      expect(supabase.from).toHaveBeenCalledWith('suppliers');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockSuppliers);
    });

    it('should return empty array when no suppliers exist', async () => {
      // ... test implementation
    });
  });

  describe('create', () => {
    it('should create new supplier with contact details', async () => {
      // ... test implementation
    });

    it('should throw error when supplier code is duplicate', async () => {
      // ... test implementation
    });
  });

  // ... 8-12 more test cases per API
});
```

**Unit Test Coverage Requirements:**

- **All CRUD operations**: `getAll`, `getById`, `create`, `update`, `delete`
- **Domain-specific methods**: `start`, `complete`, `calculateYield`, etc.
- **Validation logic**: UoM validation, reservation checks, conflict resolution
- **Error handling**: Database errors, constraint violations, not found scenarios

**Current Status (24/28 APIs tested):**

- ✅ Tested (24): SuppliersAPI, LocationsAPI, WarehousesAPI, MachinesAPI, ProductsAPI, BomsAPI, BomItemsAPI, RoutingsAPI, AllergensAPI, PurchaseOrdersAPI, TransferOrdersAPI, WorkOrdersAPI, ASNsAPI, GRNsAPI, LicensePlatesAPI, LPReservationsAPI, StockMovesAPI, ConsumeAPI, YieldAPI, PalletsAPI, TaxCodesAPI, BomHistoryAPI, TraceabilityAPI, UsersAPI
- ⏳ TODO (4): AuthAPI, AuditAPI, OutputsAPI, QualityAPI

---

## Deployment Architecture

### Infrastructure (MVP)

**Hosting:**

- **Frontend**: Vercel (Next.js standalone output)
- **Database**: Supabase PostgreSQL (cloud-hosted)
- **Storage**: Supabase Storage (documents, QA photos)
- **Auth**: Supabase Auth (JWT sessions)

**Deployment Topology:**

```
┌─────────────────────────────────────────────────────────────┐
│                      Internet                                │
└────────────┬──────────────────────────────┬─────────────────┘
             │                              │
             │                              │
     ┌───────▼──────────┐          ┌────────▼─────────┐
     │  Vercel CDN      │          │  Supabase Cloud   │
     │  (Edge Network)  │          │  (us-east-1)      │
     │                  │          │                   │
     │  - Next.js SSR   │◄─────────┤  - PostgreSQL 15  │
     │  - API Routes    │  RPC     │  - RLS Policies   │
     │  - Static Assets │          │  - Realtime       │
     │                  │          │  - Storage        │
     └──────────────────┘          └───────────────────┘
             │
             │ (PWA Install)
             │
     ┌───────▼──────────┐
     │  Mobile Devices  │
     │  (Scanner PWA)   │
     │                  │
     │  - IndexedDB     │
     │  - Service Worker│
     │  - Camera API    │
     └──────────────────┘
```

### Environment Configuration

**Required Environment Variables:**

```bash
# .env.local (local development)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Server-side only
SUPABASE_PROJECT_ID=xxx  # For pnpm gen-types

# Vercel Production
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional (Growth Phase)
STRIPE_SECRET_KEY=sk_live_...
SENTRY_DSN=https://...@sentry.io/...
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG...
```

### Deployment Workflow

**CI/CD Pipeline (GitHub Actions + Vercel):**

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8.15.0
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install:all

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Unit tests
        run: pnpm test:unit

      - name: E2E tests (critical)
        run: pnpm test:e2e:critical

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**Database Migrations (Supabase CLI):**

```bash
# Apply migrations to production
npx supabase db push --db-url $SUPABASE_DB_URL

# Rollback migration
npx supabase db reset --db-url $SUPABASE_DB_URL --version <migration-number>

# Generate TypeScript types
pnpm gen-types
```

### Monitoring & Observability (Growth Phase)

**Metrics to Track:**

- **Performance**: API response time (p50, p95, p99), page load time
- **Errors**: Error rate by API route, client-side exceptions
- **Business**: WOs created/day, LPs generated/day, traceability queries/day
- **Uptime**: 99.0% (MVP) → 99.9% (Growth) → 99.95% (Scale)

**Tools (Future):**

- **APM**: Sentry (error tracking, performance monitoring)
- **Logs**: Vercel logs, Supabase logs, custom structured logging
- **Alerts**: PagerDuty (critical errors, downtime)

---

## Development Workflow

### Before Starting Work

1. **Check Epic/Phase Status**: `pnpm bmad:status`
2. **Read Relevant Documentation**:
   - Epic summary: `docs/EPIC-00X_SUMMARY.md`
   - Module guide: `docs/0X_MODULE_NAME.md`
   - Architecture decisions: `docs/architecture.md` (this file)
3. **Verify Quality Gates**: `bmad.structure.yaml` for current epic
4. **Review Technical Debt**: `docs/TECHNICAL_DEBT_TODO.md`, `docs/14_NIESPOJNOSCI_FIX_CHECKLIST.md`

### When Adding Features

**Step-by-Step:**

```bash
# 1. Create database migration (if schema changes)
touch apps/frontend/lib/supabase/migrations/086_add_qa_inspections.sql

# 2. Write migration SQL
# (CREATE TABLE qa_inspections, indexes, RLS policies)

# 3. Apply migration locally
npx supabase db reset  # Resets to migration 086

# 4. Generate TypeScript types
pnpm gen-types

# 5. Update API class
# lib/api/quality/QualityAPI.ts

# 6. Update UI components
# app/quality/inspections/page.tsx

# 7. Write unit tests
# lib/api/__tests__/quality.test.ts

# 8. Write E2E tests
# e2e/30-quality-inspections.spec.ts

# 9. Run tests
pnpm test:unit
pnpm test:e2e:critical

# 10. Type check
pnpm type-check

# 11. Update documentation
pnpm docs:update  # Auto-generates API_REFERENCE.md, DATABASE_SCHEMA.md

# 12. Commit with conventional commit message
git add .
git commit -m "feat(quality): add QA inspections module with E2E tests"

# 13. Push and create PR
git push origin feature/qa-inspections
```

### Pre-Commit Checklist

```bash
# Run before every commit
pnpm pre-commit

# Equivalent to:
pnpm type-check       # TypeScript errors
pnpm docs:update      # Regenerate auto-docs
pnpm gen-types        # Refresh Supabase types
pnpm lint:fix         # Auto-fix linting issues
```

### Pre-Push Checklist

```bash
# Run before pushing to remote
pnpm pre-push

# Equivalent to:
pnpm test:unit        # All unit tests
pnpm test:e2e:critical  # Critical E2E flows
```

### Code Review Checklist

**For AI Agents Reviewing Code:**

1. ✅ **Novel patterns followed?** (LP=PALLET, Dual Consumption, Hard Reservation, UoM Strict, Hybrid Sync)
2. ✅ **Multi-tenant isolation?** (RLS policies + app-level org_id filter)
3. ✅ **BOM snapshot immutability?** (wo_materials copied at WO creation)
4. ✅ **Error handling?** (Try-catch, user-friendly messages, logging)
5. ✅ **Naming conventions?** (snake_case DB, PascalCase classes, camelCase functions)
6. ✅ **Tests written?** (Unit + E2E for new features)
7. ✅ **Docs updated?** (`pnpm docs:update` run after API/DB changes)
8. ✅ **Migration sequential?** (No gaps in migration numbering)

---

## Future Considerations

### Growth Phase (P2) - After MVP Launch

**Features Deferred to Growth:**

1. **Advanced Audit Trail**: pgAudit, e-signatures (FDA 21 CFR Part 11 full compliance)
2. **QoS Tiers**: Free (99.0%), Pro (99.9%), Enterprise (99.95% uptime)
3. **Advanced Reporting**: Power BI/Tableau integration, custom dashboards
4. **Quality Module**: NCRs, CAPAs, audit management
5. **Shipping Module**: Sales Orders, BOL, pallet loading optimization
6. **ERP Integration**: SAP, Oracle, NetSuite connectors
7. **Multi-Language**: i18n support (Polish, German, Spanish)

### Scalability Considerations

**When to Optimize:**

- **Database**: If traceability queries exceed 1 min → migrate to Closure Table pattern
- **Caching**: If API response time >200ms p95 → add Redis server-side cache
- **Search**: If product/LP search slow → add Algolia/Elasticsearch
- **Background Jobs**: If nocne batch reports slow → migrate to BullMQ + Redis

**Horizontal Scaling (Enterprise):**

- **Database**: Read replicas for reporting queries
- **API**: Vercel Edge Functions for low-latency global access
- **Storage**: Migrate to Cloudflare R2 for lower costs at scale

### Security Hardening (Enterprise)

**Additional Security Layers:**

1. **IP Whitelisting**: Restrict access to specific IP ranges
2. **2FA/MFA**: Two-factor authentication for all users
3. **E-Signatures**: Regulatory compliance for pharma/medical device manufacturers
4. **Penetration Testing**: Annual security audits
5. **SOC 2 Compliance**: Type II certification for enterprise customers

---

## Appendix

### Key Files Reference

**Must-Read Documentation:**

1. `docs/architecture.md` (this file) - Architecture decisions, patterns, consistency rules
2. `docs/MonoPilot-PRD-2025-11-13.md` - Product requirements, feature roadmap
3. `docs/API_REFERENCE.md` - Auto-generated API documentation (28 API classes)
4. `docs/DATABASE_SCHEMA.md` - Auto-generated database schema (40+ tables)
5. `docs/02_BUSINESS_PROCESS_FLOWS.md` - End-to-end workflows, business logic
6. `docs/07_WAREHOUSE_AND_SCANNER.md` - Scanner PWA architecture, offline sync

**Configuration Files:**

- `bmad.structure.yaml` - Project structure, quality gates, policies
- `.bmad/bmm/workflows/3-solutioning/architecture/workflow.yaml` - Architecture workflow
- `apps/frontend/middleware.ts` - Auth middleware, session management
- `apps/frontend/lib/api/config.ts` - API configuration

**Type Definitions:**

- `apps/frontend/lib/types.ts` - Core domain types
- `apps/frontend/lib/supabase/generated.types.ts` - Auto-generated from DB schema

### Commands Quick Reference

```bash
# Development
pnpm frontend:dev              # Start dev server (port 5000)
pnpm gen-types                 # Generate Supabase types
pnpm docs:update               # Regenerate auto-docs

# Testing
pnpm test:unit                 # Unit tests (Vitest)
pnpm test:e2e:ui               # E2E tests UI mode (Playwright)
pnpm test:e2e:critical         # Critical E2E flows only

# Quality
pnpm type-check                # TypeScript errors
pnpm lint                      # ESLint check
pnpm lint:fix                  # Auto-fix linting issues

# Pre-commit/Pre-push
pnpm pre-commit                # Type-check, docs, gen-types, lint
pnpm pre-push                  # All tests

# Build
pnpm build                     # Production build
```

### Contact & Support

**Development Team:**

- **Lead Developer**: Mariusz
- **AI Assistant**: Claude Sonnet 4.5 (architecture, implementation, testing)

**BMAD Method Workflows:**

- `/bmad:bmm:workflows:prd` - Create/update PRD
- `/bmad:bmm:workflows:architecture` - Architecture workflow (this document)
- `/bmad:bmm:workflows:dev-story` - Execute user story implementation

---

**Document Version**: 1.0
**Last Updated**: 2025-11-14
**Next Review**: After EPIC-003 completion (Production Intelligence & Cost Optimization)
