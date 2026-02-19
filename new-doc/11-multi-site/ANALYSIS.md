# 11-Multi-Site Module: Gap & Architecture Analysis

**Analysis Date**: 2026-02-16
**Scope**: Comprehensive investigation of multi-site mentions across new-doc directory
**Status**: Complete
**Analyst**: Claude Code

---

## Executive Summary

The multi-site module (Epic 11) is **NEW** - it doesn't exist in the current codebase yet but is planned for Phase 3. This analysis identifies:

1. **36 references** to multi-site/multi-location across the documentation
2. **Current state**: MonoPilot is single-site per organization (org_id only, no site_id)
3. **Competitive requirement**: All 4 competitors (AVEVA, Plex, Aptean, CSB) have multi-site support
4. **Architecture implications**: Major - requires org_id → site_id hierarchy change
5. **Scope**: High complexity feature affecting warehouse, production, quality, shipping, and financial modules

---

## 1. EXISTING REFERENCES: Where Multi-Site Is Mentioned

### 1.1 Foundation Documents (Strategic Level)

**File**: `/new-doc/00-foundation/prd/project-brief.md`
- **Statement**: "Multi-Site | - | Multiple warehouse/plant locations under one org | Phase 3 | SMB focus is single-site"
- **Context**: Listed in "Out of Scope (Phase 2+)" section
- **Implication**: Recognized as planned feature but not MVP-blocking
- **Timeline**: Phase 3 (after Phases 1-2 complete)

**File**: `/new-doc/00-foundation/ANALYSIS.md`
- **Statement 1**: "**Multi-Site Support** (Phase 3): Currently single-site per org; multi-site planned for Phase 3"
- **Statement 2**: "Planned Phase 3: Epics 8-9 (NPD, Finance, OEE) - plus advanced scheduling, multi-site, EDI"
- **Statement 3**: "Currently single-site per org; multi-site planned for Phase 3"
- **Context**: Part of competitive gaps analysis and phase roadmap
- **Current Status**: Explicitly deferred to Phase 3

### 1.2 Competitive Analysis (Market Position)

**File**: `/new-doc/00-foundation/other/discovery/FEATURE-GAP-ANALYSIS.md`

**Gap Identification**:
| Finding | Detail | Source |
|---------|--------|--------|
| **Critical Gap** | "Multi-Site Support \| ✅ Deep \| ✅ \| ✅ \| ✅ \| ❌ Single-site only \| Medium - Enterprise buyers expect this \| P2 \| Phase 3" | Table: Critical Gaps - All Competitors Have |
| **Competitor Pressure** | All 4 competitors (AVEVA, Plex, Aptean, CSB) have multi-site | Feature Gap Analysis section |
| **Impact** | "Medium - Enterprise buyers expect this" | Gap analysis scoring |
| **Priority** | Phase 3 (NOT Phase 2) | Explicit decision made |
| **Effort** | 12 weeks | Phase 3 recommendations |
| **Recommendation** | "Phase 3: Focus Phase 2 on quality/shipping, defer multi-site to scale phase" | Decision 3: Multi-Site Support Timing |
| **Rationale** | "Single-site serves 80% SMB market" | Key Finding #4 |

**Competitive Context**:
- AVEVA: Deep multi-site standardization with model-driven architecture
- Plex: Full multi-site support with single-instance multi-tenant
- Aptean: Full multi-site with multiple editions
- CSB: Multiple facility support with industry-specific customization

**Architecture Note**: "org_id → site_id hierarchy, cross-site transfers" (planned for Phase 3 prep by architect)

**File**: `/new-doc/00-foundation/other/discovery/DISCOVERY-REPORT-V4.md`

**Gap Identified**:
> "**Scalability & Multi‑Site Support**: MonoPilot is multi‑tenant but not clearly multi‑site within a tenant. Large SMBs may operate multiple factories. Multi‑site support with centralised management and site‑level configuration is often essential when scaling to multi‑factory operations."

**Pricing Implication**: "Consider tiered plans... premium tier with AI, digital twins and **multi-site support**"

**File**: `/new-doc/00-foundation/other/discovery/DISCOVERY-MARKET-REPORT.md`

- AVEVA: "Model-Driven Architecture - templates i libraries dla multi-site standardization"
- AVEVA Use Case: "Multi-site standardization, complex batch processes"
- MonoPilot Response: "Single-site focus (MVP), multi-site later"

---

### 1.3 Module-Specific References

#### Production Module (Epic 4)

**File**: `/new-doc/06-production/stories/04.10a.oee-summary-report.md`
- **Reference**: "Cross-plant comparison (multi-site - future)"
- **Context**: Out of scope for Phase 2 OEE reports
- **Implication**: Reporting will need site filtering/aggregation in Phase 3

**File**: `/new-doc/06-production/stories/04.9a.oee-calculation.md`
- **Reference**: "OEE comparison across plants (multi-site - future)"
- **Context**: Out of scope for Phase 2 OEE calculation
- **Implication**: Metrics calculation needs site_id field addition

**File**: `/new-doc/06-production/ux/PROD-010-shift-management.md`
- **Mention**: Plant/facility context (reading list context)
- **Implication**: Shifts are facility-specific

**File**: `/new-doc/06-production/stories/04.5.production-settings.md`
- **Context**: Production Settings module configuration
- **Implication**: Will need site-level overrides in Phase 3

#### Warehouse Module (Epic 5)

**File**: `/new-doc/03-warehouse/stories/05.9-STORY-COMPLETION-REPORT.md`
- **Reference**: "Multi-location receive in Phase 2"
- **Context**: Transfer orders between warehouses (same org, single site)
- **Clarification**: This is "multi-location" (within one warehouse), NOT "multi-site"

**File**: `/new-doc/03-warehouse/guides/warehouse-management.md`
- **Mention**: Warehouse setup (single warehouse context)
- **Future**: Site hierarchy will add warehouse_site_id

#### Quality Module (Epic 6)

**File**: `/new-doc/08-quality/guides/quality-settings-admin-guide.md`
- **Reference**: "Consider including plant code for multi-site: PLT1-NCR-"
- **Context**: NCR numbering scheme
- **Implication**: NCR codes need site prefix for multi-site operations
- **Current**: No plant code field (org_id only)

**File**: `/new-doc/08-quality/ux/QA-009-ncr-detail.md`
- **Reference**: "Replace all mixer bearings across facility (Mixer #1-5)"
- **Context**: Equipment scope in NCR
- **Implication**: Equipment tracking needs facility context

#### Finance Module (Epic 9)

**File**: `/new-doc/10-finance/prd/finance.md`
- **Reference**: "Multi-site cost consolidation"
- **Context**: Cost center consolidation across sites
- **Implication**: Costing needs site_id for cost allocation

**File**: `/new-doc/10-finance/stories/09.7.inventory-valuation-fifo-wac.md`
- **Reference**: "Multi-location valuation (Phase 2)"
- **Context**: Inventory valuation across warehouses
- **Clarification**: Phase 2 work on single-site, multi-warehouse case

**File**: `/new-doc/10-finance/stories/09.2.standard-cost-definition.md`
- **Reference**: "Multi-site cost differences (Phase 2)"
- **Context**: Site-specific cost variations
- **Timeline**: Shows Phase 2 awareness of multi-site needs

**File**: `/new-doc/10-finance/stories/09.1.finance-settings-module-config.md`
- **Reference**: "Multi-site cost center consolidation"
- **Context**: Rollup accounting across sites

#### OEE Module (Epic 10)

**File**: `/new-doc/12-oee/stories/10.5.realtime-machine-dashboard.md`
- **Story**: "As a **Plant Manager**, I want to **see aggregated OEE across production lines** so that **I can assess overall facility performance...**"
- **Implication**: Machine/line aggregation is facility-level, not org-level
- **Future**: Phase 3 multi-site will need site-level aggregation

#### Planning Module (Epic 3)

**File**: `/new-doc/04-planning/stories/03.23.replenishment-rules.md`
- **Reference**: "**Multi-Location Optimization**: Cross-warehouse inventory balancing"
- **Context**: Inventory balancing across warehouses
- **Current**: Single-site context

**File**: `/new-doc/04-planning/stories/03.19.demand-forecasting.md`
- **Reference**: "Multi-location safety stock optimization"
- **Context**: Safety stock calculation across sites
- **Future**: Phase 3 implementation

#### Shipping Module (Epic 7)

**File**: `/new-doc/07-shipping/guides/customer-management.md`
- **Reference**: "Regional distribution, multi-location"
- **Context**: Customer shipping locations
- **Implication**: Customer has multiple receiving locations (not MonoPilot multi-site)

#### Technical Module (Epic 2)

**File**: `/new-doc/02-technical/stories/02.3.product-allergens.md`
- **Reference**: "Produced in facility that also processes..."
- **Context**: Allergen cross-contamination declarations
- **Implication**: Product records need facility context for allergen statements

#### Settings Module (Epic 1)

**File**: `/new-doc/01-settings/ux/SET-004-onboarding-location.md`
- **Mention**: "Multi-line facility, >50 SKUs" as a use case
- **Context**: Location template selection
- **Current**: Single warehouse, multiple locations within warehouse
- **Future**: Multi-site adds warehouse → location hierarchy

---

## 2. ARCHITECTURE IMPLICATIONS

### 2.1 Current Architecture (Single-Site Model)

**Tenant Isolation Pattern (Existing)**:
```
organizations (org_id)
  └── All resources (org_id foreign key)
      ├── warehouses (warehouse_id, org_id)
      ├── products (product_id, org_id)
      ├── work_orders (wo_id, org_id)
      ├── machines (machine_id, org_id)
      ├── production_lines (line_id, org_id)
      └── [all tables] (org_id)
```

**Key Characteristic**: Single org_id per tenant; all resources filtered by org_id
**RLS Enforcement**: `WHERE org_id = current_org_id()`
**Data Isolation**: Complete (org-level)

### 2.2 Proposed Multi-Site Architecture (Phase 3)

**Hierarchy**:
```
organizations (org_id)
  └── sites (site_id, org_id)
      ├── warehouses (warehouse_id, site_id, org_id)
      ├── production_lines (line_id, site_id, org_id)
      ├── machines (machine_id, site_id, org_id)
      ├── work_orders (wo_id, site_id, org_id)
      ├── users (user_id, org_id, [site_id list or via site_user_access])
      └── [location-specific tables] (site_id, org_id)

Cross-Site Resources (org_level):
  ├── products (product_id, org_id) - shared across all sites
  ├── routings (routing_id, org_id) - shared across all sites
  ├── suppliers (supplier_id, org_id) - shared across all sites
  └── [master data] (org_id)
```

### 2.3 Database Schema Changes Required

#### New Tables

| Table | Purpose | Schema |
|-------|---------|--------|
| `sites` | Site/plant/facility master | `id (uuid), org_id, name, code, location, active, created_at` |
| `site_settings` | Site-specific configuration | `id, site_id, org_id, setting_key, setting_value` |
| `site_user_access` | User access control per site | `id, user_id, site_id, org_id, access_level, created_at` |
| `transfer_orders` | Inter-site inventory transfers | `id, org_id, from_site_id, to_site_id, status, items[]` |
| `inter_site_transfers` | Move inventory between sites | `id, org_id, from_warehouse_id, to_warehouse_id, site_from, site_to, items[]` |

#### Modified Tables

All location-specific tables need `site_id` addition:

| Table | Add Column | Logic |
|-------|------------|-------|
| `warehouses` | `site_id` | Each warehouse belongs to one site |
| `production_lines` | `site_id` | Lines are site-specific |
| `machines` | `site_id` | Machines belong to a site |
| `work_orders` | `site_id` | WO executed at specific site |
| `product_licenses` | `site_id` | Nullable - site can operate specific products (optional) |
| `quality_ncrs` | `site_id` | NCRs are site-specific |
| `quality_inspections` | `site_id` | Inspections at specific site |
| `production_shifts` | `site_id` | Shifts per site |
| `license_plates` | `site_id` | LP tracked at specific site/warehouse |
| `stock_movements` | `site_id` | Movements within/between sites |
| `work_order_outputs` | `site_id` | Output at producing site |

#### Master Data Tables (Remain Org-Level)

| Table | Reason |
|-------|--------|
| `products` | Shared across all sites |
| `routings` | Shared recipe/process templates |
| `boms` | Shared recipes |
| `suppliers` | Org-level supplier master |
| `customers` | Org-level customer master |
| `cost_centers` | Can be org or site-level (TBD) |

### 2.4 RLS Policy Changes Required

**Current Pattern**:
```sql
CREATE POLICY "org_isolation" ON work_orders
  USING (org_id = current_org_id());
```

**Phase 3 Pattern** (Option 1 - Org + Site):
```sql
CREATE POLICY "org_and_site_isolation" ON work_orders
  USING (org_id = current_org_id() AND site_id IN (
    SELECT site_id FROM site_user_access
    WHERE user_id = auth.uid()
  ));
```

**Phase 3 Pattern** (Option 2 - Simplified):
```sql
CREATE POLICY "org_and_site_isolation" ON work_orders
  USING (org_id = current_org_id() AND site_id = current_site_id());
```

**Complexity**: Adds second dimension to security policies
**Risk**: Potential for data leakage if site filtering missed

---

## 3. FEATURE REQUIREMENTS FOR MULTI-SITE MODULE

### 3.1 Site/Plant/Facility Entity Management

**Functional Scope**:
- Create, read, update, delete sites
- Site master data: name, code, location, timezone, active status
- Site capacity constraints (throughput, storage, headcount)
- Site-specific holidays/closures
- Inter-site distance/transfer time matrix

**User Stories**:
- "As admin, I want to create a new production site so I can track operations independently"
- "As plant manager, I want to view only my site's data and not other sites"
- "As procurement officer, I want to consolidate all sites' inventory in reporting"

**API Endpoints**:
```
GET    /api/settings/sites                    # List all org sites
POST   /api/settings/sites                    # Create site
GET    /api/settings/sites/{site_id}          # Get site details
PUT    /api/settings/sites/{site_id}          # Update site
DELETE /api/settings/sites/{site_id}          # Deactivate site
```

**Complexity**: Low-Medium
**Effort**: 1-2 weeks

### 3.2 Cross-Site Inventory Transfers

**Functional Scope**:
- Create transfer orders between sites
- Track transfer in-transit status
- Update GRN upon arrival at destination site
- Reverse transfers (RMA)
- Transfer cost allocation (shipping, handling)
- Transfer visibility (both sites)

**User Stories**:
- "As warehouse manager at Site A, I want to transfer excess inventory to Site B so inventory is available where needed"
- "As procurement, I want to see all inter-site transfers in progress with ETAs"
- "As finance, I want to allocate transfer costs to the destination site"

**API Endpoints**:
```
POST   /api/warehouse/transfer-orders         # Create inter-site transfer
GET    /api/warehouse/transfer-orders         # List transfers
PATCH  /api/warehouse/transfer-orders/{id}/dispatch
PATCH  /api/warehouse/transfer-orders/{id}/receive
```

**Database**:
```sql
CREATE TABLE inter_site_transfers (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  from_site_id uuid NOT NULL,
  to_site_id uuid NOT NULL,
  status enum ('draft', 'dispatched', 'in_transit', 'received'),
  items jsonb,
  expected_arrival timestamp,
  actual_arrival timestamp,
  transfer_cost numeric,
  created_at timestamp
);
```

**Complexity**: Medium
**Effort**: 3-4 weeks

### 3.3 Cross-Site Production Planning

**Functional Scope**:
- View aggregate demand across all sites
- Allocate production to sites based on capacity/constraints
- Transfer finished goods between sites
- Aggregate OEE/yield metrics across sites
- Site-specific scheduling constraints (maintenance windows, holidays)

**User Stories**:
- "As planner, I want to allocate a purchase order to the site with available capacity"
- "As production director, I want to see OEE metrics aggregated across all sites for facility comparison"
- "As scheduler, I want to see available production capacity at each site before scheduling WOs"

**API Endpoints**:
```
GET    /api/planning/capacity-by-site        # Capacity planning across sites
GET    /api/production/oee-by-site           # OEE comparison across sites
POST   /api/planning/allocation              # Allocate WO to specific site
```

**Complexity**: Medium-High
**Effort**: 4-6 weeks

### 3.4 Site-Specific Settings & Configuration

**Functional Scope**:
- Site-level overrides (allergens, quality standards, machines, lines)
- Site-specific warehouse structures (different zones per site)
- Site-specific shift patterns
- Site-specific quality plans
- Site-specific cost centers

**User Stories**:
- "As admin, I want to enable the Quality module only at the main site initially"
- "As QA manager, I want different inspection levels per site based on certifications"
- "As finance, I want to track costs per site with different cost centers"

**API Endpoints**:
```
GET    /api/settings/sites/{site_id}/config
PATCH  /api/settings/sites/{site_id}/config
```

**Complexity**: Medium
**Effort**: 2-3 weeks

### 3.5 Consolidated Reporting Across Sites

**Functional Scope**:
- Aggregate production output across sites
- Aggregate inventory (global stock view)
- Aggregate quality metrics (defect rate per site)
- Consolidated financials (cost, margin by site)
- Cross-site comparisons (efficiency benchmarking)
- Consolidation in shipping (orders fulfilled from multiple sites)

**User Stories**:
- "As operations director, I want a dashboard showing total output, inventory, and quality KPIs across all sites"
- "As finance, I want a consolidated income statement with cost of goods sold by site"
- "As CEO, I want to benchmark Site A efficiency vs Site B"

**API Endpoints**:
```
GET    /api/reports/production-consolidated
GET    /api/reports/inventory-consolidated
GET    /api/reports/quality-consolidated
GET    /api/reports/financial-consolidated
GET    /api/reports/site-comparison
```

**Complexity**: Medium-High
**Effort**: 4-5 weeks

### 3.6 User Access Control Per Site

**Functional Scope**:
- Assign users to one or multiple sites
- Role-based access (admin at Site A, operator at Site B)
- Site-aware RLS enforcement
- User dashboard shows only assigned sites
- Audit trail of user access changes

**User Stories**:
- "As admin, I want to assign Alice as QA manager at Site A and Site B"
- "As Site A manager, I want to see only Site A data in my dashboard"
- "As Bob (multi-site user), I want to switch between Site A and Site B contexts"

**Database**:
```sql
CREATE TABLE site_user_access (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  site_id uuid NOT NULL,
  org_id uuid NOT NULL,
  access_level enum ('viewer', 'operator', 'manager', 'admin'),
  created_at timestamp,
  UNIQUE(user_id, site_id)
);
```

**RLS Pattern**:
```sql
-- User sees only sites they have access to
CREATE POLICY "site_access" ON site_user_access
  USING (user_id = auth.uid());
```

**Complexity**: Medium
**Effort**: 2-3 weeks

---

## 4. DEPENDENCIES: Which Existing Modules Need Changes

### 4.1 Core Module Dependencies (MUST CHANGE)

| Module | Impact | Required Changes | Effort |
|--------|--------|------------------|--------|
| **Warehouse (Epic 5)** | HIGH | Add `site_id` to warehouses, LPs, stock moves; enable inter-site transfers | 4-5w |
| **Production (Epic 4)** | HIGH | Add `site_id` to WOs, machines, lines; site-specific scheduling; OEE per site | 4-5w |
| **Planning (Epic 3)** | HIGH | Site-aware capacity planning; allocation logic; cross-site demand consolidation | 3-4w |
| **Quality (Epic 6)** | HIGH | Add `site_id` to NCRs, inspections; site-specific quality plans; consolidation reporting | 2-3w |
| **Settings (Epic 1)** | HIGH | New sites management UI; site-level configuration overrides; user access control | 3-4w |

### 4.2 Dependent Module Changes (MODERATE)

| Module | Impact | Required Changes | Effort |
|--------|--------|------------------|--------|
| **Shipping (Epic 7)** | MEDIUM | Allocate orders to fulfilling site; cross-site pickup logic; shipment tracking per site | 2-3w |
| **Finance (Epic 9)** | MEDIUM | Add `site_id` for cost allocation; consolidated P&L; site-level cost centers | 3-4w |
| **Technical (Epic 2)** | MEDIUM | Products remain org-level (shared); facility-specific allergen declarations possible | 1-2w |
| **OEE (Epic 10)** | MEDIUM | Aggregate metrics per site; cross-site benchmarking; site-specific targets | 2-3w |

### 4.3 Non-Breaking Changes (LOW)

| Module | Impact | Change | Effort |
|--------|--------|--------|--------|
| **NPD (Epic 8)** | LOW | Add site context to trial BOMs; phase-in strategy per site | 1-2w |
| **Integrations (Epic 11)** | LOW | Site context in integration payloads (accounting, EDI) | 1w |

### 4.4 Total Refactoring Effort

**Estimate**: 30-40 weeks (7-10 months) for full multi-site implementation across all modules

**Team Composition** (Parallelizable):
- **Team A** (Backend): Warehouse + Production site logic (4-5w parallel)
- **Team B** (Frontend): Settings UI + Site selection (3-4w parallel)
- **Team C** (Planning): Capacity & allocation logic (3-4w parallel)
- **Team D** (Quality + Finance): Quality metrics + consolidation (2-3w parallel)

**Critical Path**: Settings (site CRUD) → Warehouse/Production (site_id propagation) → Reporting (consolidation)

---

## 5. GAP ANALYSIS: What's Missing vs What's Partially There

### 5.1 Completely Missing (NOT in Phase 1-2)

| Feature | Status | Reason | Phase 3 Effort |
|---------|--------|--------|----------------|
| **Site Master Data Management** | ❌ Missing | No site entity exists | 1-2w |
| **Site User Access Control** | ❌ Missing | No site_user_access table; currently org-level only | 2-3w |
| **Inter-Site Transfers** | ❌ Missing | Transfer orders only for same warehouse | 3-4w |
| **Cross-Site Production Planning** | ❌ Missing | No multi-site allocation logic | 3-4w |
| **Consolidated Reporting** | ❌ Missing | Reports are org/warehouse level, not site-aggregated | 4-5w |
| **Site-Specific Configuration** | ❌ Missing | Settings are org-level only | 2-3w |
| **Site-Level RLS Policies** | ❌ Missing | RLS only enforces org_id, not site_id | 1-2w |

### 5.2 Partially There (Needs Extension)

| Feature | Current State | What Works | What's Missing | Phase 3 Effort |
|---------|---------------|-----------|-----------------|----------------|
| **Warehouse Locations** | ✅ Partially | Single warehouse with location hierarchy | Multi-warehouse per site; inter-site visible locations | 2w |
| **Production Lines** | ✅ Partially | Single line per org | Multi-line per site; site-specific constraints | 1w |
| **Machines** | ✅ Partially | Machine master data | Site assignment; site-specific maintenance schedules | 1w |
| **Work Orders** | ✅ Partially | WO execution | Site routing (which site executes); inter-site material flows | 2w |
| **Quality Plans** | ✅ Partially | Generic QA specs | Site-specific inspection levels; site-specific certifications | 1w |
| **OEE Metrics** | ✅ Partially | OEE calculation | Site-level aggregation; cross-site comparison | 2w |
| **Cost Tracking** | ✅ Partially | Cost per WO | Site-specific cost centers; consolidated P&L | 2-3w |
| **License Plates** | ✅ Partially | LP genealogy per WO | LP tracking across sites; inter-site LP visibility | 2w |
| **Stock Movements** | ✅ Partially | Moves within warehouse | Inter-site movement logic; transfer orders | 2-3w |

### 5.3 Already Complete (No Change Needed)

| Feature | Status | Reason |
|---------|--------|--------|
| **Product Master Data** | ✅ Complete | Products are org-level; shared across all sites |
| **Routing/BOM Templates** | ✅ Complete | Recipes are org-level; sites execute same templates |
| **Supplier Management** | ✅ Complete | Suppliers are org-level; deliver to any site |
| **Customer Management** | ✅ Complete | Customers are org-level; receive from any site |
| **Allergen Management** | ✅ Complete | EU-14 allergens are product-level (shared); facility cross-contamination noted in product record |

---

## 6. ARCHITECTURE PATTERNS TO ADOPT

### 6.1 Site Context Pattern

**Goal**: Make site_id a first-class context (like org_id) throughout the system

**Implementation**:
```typescript
// auth.ts - extend current org context
export function getCurrentSiteId(request: NextRequest): string {
  const siteId = request.headers.get('x-site-id');
  if (!siteId) {
    // Default to first assigned site or error
    throw new Error('Site context required');
  }
  return siteId;
}

// services pattern
export class WarehouseService {
  static async getInventory(orgId: string, siteId: string) {
    return db
      .from('license_plates')
      .select('*')
      .eq('org_id', orgId)
      .eq('site_id', siteId);
  }
}

// RLS pattern - enforce site context
CREATE POLICY "site_isolation" ON warehouses
  USING (org_id = current_org_id() AND site_id = current_site_id());
```

### 6.2 Aggregation Service Pattern

**Goal**: Provide rollup methods for cross-site metrics

```typescript
export class CrossSiteService {
  static async getAggregateInventory(orgId: string): Promise<AggregateInventory> {
    const allSites = await getSitesForOrg(orgId);
    const perSiteInventory = await Promise.all(
      allSites.map(site => getInventoryBySite(orgId, site.id))
    );
    return aggregate(perSiteInventory);
  }

  static async getOEETrend(orgId: string, dateRange): Promise<OEETrendData> {
    // Aggregate OEE across all sites
  }
}
```

### 6.3 Multi-Site Validation Pattern

**Goal**: Validate that cross-site operations are permitted

```typescript
async function validateInterSiteTransfer(
  orgId: string,
  fromSiteId: string,
  toSiteId: string
): Promise<ValidationResult> {
  // Check both sites exist in org
  // Check user has access to both sites
  // Check transfer is not between same site
  // Check destination has receiving location
}
```

---

## 7. ROADMAP POSITIONING

### 7.1 Why Phase 3 (Not Phase 2)

**Evidence from FEATURE-GAP-ANALYSIS.md**:

| Criterion | Finding |
|-----------|---------|
| **SMB Market Coverage** | "Single-site serves 80% SMB market" |
| **Competitive Priority** | P2 (Important but not blocking MVP) |
| **Recommended Timing** | "Phase 3: Focus Phase 2 on quality/shipping, defer multi-site to scale phase" |
| **MVP Feasibility** | MVP can launch with single-site for 5-50 employee companies |
| **Enterprise Readiness** | Multi-site needed for 100-500 employee companies only |

**Phase 2 Priority**: Quality (Epic 6), Shipping (Epic 7), GS1, HACCP, FEFO
**Phase 3 Priority**: OEE, Multi-Site, Advanced Scheduling, EDI, Finance

### 7.2 Prerequisites Before Phase 3 Starts

- Phase 1 complete (MVP production-ready)
- Phase 2 complete (Enterprise features: Quality, Shipping, GS1, HACCP)
- Customer feedback from 10+ deployments indicating multi-site need
- Architecture review approved for org_id → site_id hierarchy
- RLS policy audit completed

### 7.3 Estimated Timeline

**Duration**: 8-10 months with 3-5 person team
**Start**: After Phase 2 complete (estimated Q4 2026 or Q1 2027)
**Deliverable**: Full multi-site support with consolidation reporting

---

## 8. IMPLICATIONS BY ROLE

### 8.1 For Architects

**Actions Required**:
1. Design site_id hierarchy (org → site → location)
2. Create RLS policy strategy for site context
3. Plan database migration strategy (add site_id to 15+ tables)
4. Define data synchronization for shared resources (products, suppliers)
5. Plan cross-site transfer integrity constraints

### 8.2 For Backend Developers

**Actions Required**:
1. Refactor service layer to accept site_id parameter
2. Implement inter-site transfer API
3. Create cross-site aggregation queries
4. Update all RLS policies to include site_id
5. Add site context middleware

### 8.3 For Frontend Developers

**Actions Required**:
1. Build site selector (top-level nav component)
2. Create Sites management UI in Settings
3. Add site-aware dashboards (per-site views)
4. Implement consolidated reporting views
5. Add site filter to all data tables

### 8.4 For QA/Testing

**Actions Required**:
1. Test multi-site user isolation (RLS validation)
2. Test inter-site transfer workflows
3. Test consolidated reporting accuracy
4. Performance test: aggregate queries with 100+ sites
5. Test site context persistence across navigation

### 8.5 For Product/PM

**Actions Required**:
1. Gather multi-site customer feedback from Phase 2 deployments
2. Prioritize multi-site features vs other Phase 3 items (OEE, Finance)
3. Define which reports must consolidate vs stay per-site
4. Plan customer migration strategy for existing single-site customers
5. Decide pricing impact (premium tier for multi-site?)

---

## 9. KEY QUESTIONS FOR CLARIFICATION

### Strategic Questions

1. **User Experience**: When a user is assigned to 2 sites, should they:
   - Have a site switcher and work in one site at a time?
   - See merged data from both sites automatically?
   - Have separate dashboards per site with consolidation dashboard?

2. **Cross-Site Transfers**: Should inter-site transfers:
   - Use existing purchase order workflow?
   - Create a new "transfer order" entity?
   - Be treated like internal movements (no cost allocation)?

3. **Reporting Consolidation**: Should consolidated reports:
   - Be in a separate "Executive Dashboard"?
   - Be available per-site with toggle to "all sites"?
   - Be real-time or batch-calculated nightly?

4. **Shared vs Site-Specific Master Data**: Which of these should be site-specific?
   - Machines (currently org-level) → per-site?
   - Quality standards (currently org-level) → per-site?
   - Cost centers (currently org-level) → per-site?

5. **Geographic Scope**: Phase 3 should cover:
   - Multi-warehouse in single location? (Already in Phase 2)
   - Multi-site in same country?
   - Multi-site across countries (currency, tax implications)?

### Technical Questions

1. **RLS Performance**: With 50 sites per org, will `site_id IN (SELECT...)` RLS policy be performant?
2. **Data Integrity**: How to prevent accidental cross-site data mixing after migration?
3. **Backward Compatibility**: Should Phase 1-2 single-site deployments auto-migrate or require manual setup?
4. **Transfer Cost Model**: How to allocate inter-site shipping costs (actual, standard, negotiated)?

---

## 10. RECOMMENDATIONS

### Immediate (Before Phase 3 Starts)

1. **Architect**: Create detailed database migration plan (add site_id to 15 tables)
2. **PM**: Collect multi-site requirements from 2-3 Phase 2 customers
3. **Team**: Decide on site context implementation pattern (middleware vs parameter)
4. **QA**: Plan RLS isolation testing strategy for multi-site

### During Phase 3 Planning

1. Confirm multi-site is priority vs OEE/Finance (competing Phase 3 features)
2. Create detailed user stories for each site feature (6-8 stories)
3. Identify which modules are blocking vs nice-to-have for multi-site MVP
4. Plan data migration strategy for existing Phase 1-2 customers

### Technical Debt to Address Before Phase 3

1. Audit all RLS policies for correctness (org_id filtering only)
2. Review service layer for potential site context misses
3. Create site_id constants to prevent typos
4. Add integration tests for cross-site operations

---

## 11. APPENDIX: File References

### Foundation & Strategic
- `/new-doc/00-foundation/prd/project-brief.md` - Phase 3 scope definition
- `/new-doc/00-foundation/ANALYSIS.md` - Phase prioritization
- `/new-doc/00-foundation/other/discovery/FEATURE-GAP-ANALYSIS.md` - Competitive gap analysis + multi-site timing decision

### Module-Specific
- `/new-doc/06-production/stories/04.10a.oee-summary-report.md` - Cross-plant reporting future
- `/new-doc/06-production/stories/04.9a.oee-calculation.md` - Cross-plant OEE future
- `/new-doc/03-warehouse/stories/05.9-STORY-COMPLETION-REPORT.md` - Multi-location mention
- `/new-doc/08-quality/guides/quality-settings-admin-guide.md` - Plant code in NCR numbering
- `/new-doc/10-finance/prd/finance.md` - Multi-site cost consolidation
- `/new-doc/12-oee/stories/10.5.realtime-machine-dashboard.md` - Facility-level aggregation

### Discovery & Competitive Analysis
- `/new-doc/00-foundation/other/discovery/DISCOVERY-REPORT-V4.md` - Multi-site scalability gap
- `/new-doc/00-foundation/other/discovery/DISCOVERY-MARKET-REPORT.md` - Competitor multi-site features

---

## ANALYSIS CONCLUSION

**Multi-site is a significant Phase 3 feature** that:

✅ **Is needed** for enterprise market (100-500 employee companies)
✅ **Is competitive table stakes** (all 4 competitors have it)
✅ **Is correctly deferred** to Phase 3 (80% SMB market is single-site)
✅ **Requires major architecture changes** (site_id throughout system)
✅ **Impacts all core modules** (Warehouse, Production, Quality, Finance, Planning)
❌ **Is not blocking MVP** (MVP serves 5-50 employee companies)
❌ **Cannot be partially done** (site context must be consistent everywhere)

**Recommended Action**: Plan Phase 3 multi-site as coordinated 8-10 month effort, starting after Phase 2 complete and customer feedback confirms multi-site demand.

---

**Analysis End**
**Prepared by**: Claude Code
**Status**: COMPLETE
**References**: 36 mentions across 23 files
**Confidence**: High (backed by competitive analysis, PRD, and strategic planning docs)
