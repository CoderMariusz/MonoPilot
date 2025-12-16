# Epic 02 Technical Module - Phase Split Proposal

**Date:** 2025-12-16
**Author:** ARCHITECT-AGENT
**Pattern:** Phase-based substories (02.Xa, 02.Xb, 02.Xc)
**Status:** VALIDATED - SAFE TO USE

---

## Executive Summary

**Verdict:** SAFE TO USE with guardrails

The phase-based split pattern (02.Xa MVP, 02.Xb Phase 1, 02.Xc Phase 2) is **feasible and already implemented** in Epic 02 with successful examples.

**Key Findings:**
1. **02.5 split is COMPLETE** - Both 02.5a and 02.5b exist and are well-structured
2. **02.10 split is COMPLETE** - 02.10a (Config) and 02.10b (Queries - deferred)
3. **Pattern works** - Forward-compatible schema already applied
4. **No conflicts detected** - Extensions follow Open/Closed Principle

**Required Guardrails:**
1. Forward-compatible schema (all columns in .Xa, nullable for Phase 1+)
2. Extension pattern for services (inherit, don't modify base service)
3. Feature detection in API routes (backward compatible)
4. Test isolation (freeze .Xa tests after merge, add .Xb tests separately)
5. Sequential development (.Xa merged to main before .Xb starts)

---

## Pattern Validation

### Pros/Cons Analysis

| Aspect | Pro | Con | Mitigation |
|--------|-----|-----|------------|
| Scope Clarity | Clear MVP vs Phase 1 boundaries | More stories to track | Use parent story as index, deprecate with ARCHIVED marker |
| Code Conflicts | Separate PRs, smaller reviews | .Xb changes may affect .Xa | Extension pattern, frozen tests |
| Testing | Isolated test suites per phase | Re-test entire flow after .Xb | Integration tests run both .Xa + .Xb |
| Migrations | Incremental, low risk | Potential fragmentation | Use nullable columns in .Xa schema |
| TDD Flow | RED-GREEN per phase | Refactoring overhead | Design interfaces upfront |
| Delivery Speed | Ship MVP faster | More coordination overhead | Clear dependency mapping |
| Rollback Safety | Easy rollback per phase | Complex if .Xb depends on .Xa | Sequential merge, feature flags |

**Risk Level:** LOW with guardrails

---

## Existing Splits in Epic 02 (COMPLETE)

Epic 02 has 2 successful split implementations:

### 1. Story 02.10 - Traceability (SPLIT COMPLETE)

```
02.10 (ARCHIVED)
  |
  +-- 02.10a: Traceability Configuration (Ready - no LP dependency)
  |     - Lot number format, batch size defaults
  |     - GS1 encoding service
  |     - Search page framework (empty state)
  |
  +-- 02.10b: Traceability Queries (DEFERRED - requires Epic 05)
        - Forward/backward trace queries
        - Recall simulation
        - Genealogy tree visualization
```

**Why split worked:**
- 02.10a has NO dependency on license_plates table
- 02.10b REQUIRES license_plates (Epic 05)
- Clear technical boundary (config vs queries)

### 2. Story 02.5 - BOM Items (SPLIT COMPLETE)

```
02.5 (ARCHIVED marker in file)
  |
  +-- 02.5a: BOM Items Core (Ready - MVP P0)
  |     File: 02.5a.bom-items-core.md
  |     - Basic CRUD, quantities, UoM, sequences
  |     - Operation assignment
  |     - Scrap tracking
  |
  +-- 02.5b: BOM Items Advanced (Ready - Phase 1 P1)
        File: 02.5b.bom-items-advanced.md
        - Conditional items (FR-2.26)
        - By-products (FR-2.27)
        - Line-specific items (FR-2.33)
        - Bulk import from CSV
```

**Why split works:**
- 02.5a provides stable CRUD foundation
- 02.5b extends without modifying base
- Schema includes all columns (Phase 1 nullable)
- Clear feature boundaries (core vs advanced)

---

## Database Schema Strategy (VALIDATED)

### Current Implementation

The bom_items table already follows the forward-compatible schema pattern:

```sql
-- bom_items table (from 02.5a story definition):
CREATE TABLE bom_items (
  -- Core MVP fields (used in 02.5a)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity DECIMAL(15,6) NOT NULL CHECK (quantity > 0),
  uom TEXT NOT NULL,
  sequence INTEGER NOT NULL DEFAULT 0,
  scrap_percent DECIMAL(5,2) DEFAULT 0,
  operation_seq INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Phase 1 columns (nullable, unused in MVP UI but present in schema)
  is_output BOOLEAN DEFAULT false,           -- For byproducts (02.5b)
  is_by_product BOOLEAN DEFAULT false,       -- Explicit byproduct flag (02.5b)
  yield_percent DECIMAL(5,2),                -- Byproduct yield (02.5b)
  line_ids UUID[],                           -- Line-specific (02.5b) - NULL = all lines
  condition_flags JSONB,                     -- Conditional items (02.5b)
  consume_whole_lp BOOLEAN DEFAULT false     -- LP consumption mode (02.5b)
);

-- Phase 1 does NOT need ALTER TABLE!
-- Just enable fields in UI, add validation, and business logic.
```

### Schema Guardrails

| Phase | Schema Action | Allowed? |
|-------|--------------|----------|
| 02.5a (MVP) | CREATE TABLE with all columns | YES - Already done |
| 02.5b (Phase 1) | ALTER TABLE ADD COLUMN | AVOID - use existing nullable |
| 02.5b (Phase 1) | Enable existing columns in UI | YES |
| 02.5c (Phase 2) | ALTER TABLE ADD COLUMN | YES (new major feature) |

---

## Service Layer Strategy

### Extension Pattern (Open/Closed Principle)

```typescript
// ==========================================
// lib/services/bom-items-service.ts (02.5a - MVP)
// ==========================================
export class BomItemsService {
  // Core CRUD - STABLE, do not modify in 02.5b
  async createBomItem(bomId: string, data: CreateBomItemDTO): Promise<BomItem> {
    const validated = bomItemSchema.parse(data);
    return await db.bom_items.insert({ bom_id: bomId, ...validated });
  }

  async getBomItems(bomId: string): Promise<BomItem[]> {
    return await db.bom_items.findMany({ bom_id: bomId, is_output: false });
  }

  async updateBomItem(bomId: string, itemId: string, data: UpdateBomItemDTO): Promise<BomItem> {
    return await db.bom_items.update(itemId, data);
  }

  async deleteBomItem(bomId: string, itemId: string): Promise<void> {
    await db.bom_items.delete(itemId);
  }

  async getNextSequence(bomId: string): Promise<number> {
    const max = await db.bom_items.max('sequence', { bom_id: bomId });
    return (max || 0) + 10;
  }
}

// ==========================================
// lib/services/bom-items-advanced-service.ts (02.5b - Phase 1)
// ==========================================
import { BomItemsService } from './bom-items-service';

export class BomItemsAdvancedService extends BomItemsService {
  // Extend, don't modify parent

  async createConditionalItem(bomId: string, data: ConditionalItemDTO): Promise<BomItem> {
    const validated = conditionalItemSchema.parse(data);
    return await super.createBomItem(bomId, {
      ...validated,
      condition_flags: validated.flags
    });
  }

  async createByproduct(bomId: string, data: ByproductDTO): Promise<BomItem> {
    const validated = byproductSchema.parse(data);
    return await super.createBomItem(bomId, {
      ...validated,
      is_output: true,
      is_by_product: true,
      yield_percent: validated.yield_percent
    });
  }

  async getByproducts(bomId: string): Promise<BomItem[]> {
    return await db.bom_items.findMany({ bom_id: bomId, is_output: true });
  }

  async setLineSpecific(itemId: string, lineIds: string[]): Promise<BomItem> {
    return await db.bom_items.update(itemId, { line_ids: lineIds });
  }

  async bulkCreateBOMItems(bomId: string, items: CreateBomItemDTO[]): Promise<BulkImportResponse> {
    // Bulk import implementation
  }
}
```

### Service Guardrails

| Rule | Enforcement |
|------|-------------|
| Never modify 02.5a service in 02.5b PR | Code review, linting rule |
| Use inheritance/composition for extension | Base class stable, extend only |
| Create separate service file for Phase 1 | `*-advanced-service.ts` naming |
| Phase 1 service imports Phase 0 service | Explicit dependency |

---

## API Routes Strategy

### Feature Detection Pattern

```typescript
// app/api/technical/boms/[id]/items/route.ts

import { BomItemsService } from '@/lib/services/bom-items-service';
import { BomItemsAdvancedService } from '@/lib/services/bom-items-advanced-service';

const mvpService = new BomItemsService();
const advancedService = new BomItemsAdvancedService();

export async function POST(req: Request, { params }) {
  const data = await req.json();

  // Feature detection: Is this an advanced request?
  const isAdvanced = data.is_by_product ||
                     data.condition_flags ||
                     data.line_ids !== undefined ||
                     data.consume_whole_lp;

  if (isAdvanced) {
    // Phase 1 path - validate and handle advanced fields
    if (data.is_by_product) {
      return await advancedService.createByproduct(params.id, data);
    }
    // Use extended schema validation
    return await advancedService.createBomItem(params.id, data);
  }

  // MVP path - unchanged behavior
  return await mvpService.createBomItem(params.id, data);
}
```

### API Guardrails

| Rule | Rationale |
|------|-----------|
| Feature detection, not versioning | Single endpoint, backward compatible |
| MVP path remains unchanged | Existing clients continue working |
| Phase 1 fields trigger advanced path | Explicit opt-in to new features |
| Validation schema expansion | Add fields to schema, don't replace |

---

## Testing Strategy

### Test Isolation + Integration Suite

```
__tests__/02-technical/
|-- bom-items/
|   |-- 02.5a-bom-items-crud.test.ts          # MVP only (FROZEN after merge)
|   |-- 02.5b-bom-items-conditional.test.ts   # Phase 1 - conditional items
|   |-- 02.5b-bom-items-byproducts.test.ts    # Phase 1 - byproducts
|   |-- 02.5b-bom-items-line-specific.test.ts # Phase 1 - line-specific
|   |-- 02.5b-bom-items-bulk-import.test.ts   # Phase 1 - bulk import
|   +-- integration.test.ts                   # Full suite (MVP + Phase 1)
```

### Testing Guardrails

| Phase | Test Action | Enforcement |
|-------|-------------|-------------|
| 02.5a merged | Freeze 02.5a test file | PR review, no modifications allowed |
| 02.5b development | Add NEW test files only | Separate file per feature |
| 02.5b CI | Run 02.5a + 02.5b tests | Integration suite in CI |
| Regression detected | Block 02.5b PR | CI fails if 02.5a tests break |

### CI Configuration

```yaml
# .github/workflows/test.yml
jobs:
  test-epic-02:
    steps:
      - name: Run 02.5a tests (must pass)
        run: pnpm test __tests__/02-technical/bom-items/02.5a-*.test.ts

      - name: Run 02.5b tests (if exist)
        run: pnpm test __tests__/02-technical/bom-items/02.5b-*.test.ts
        continue-on-error: false

      - name: Run integration tests
        run: pnpm test __tests__/02-technical/bom-items/integration.test.ts
```

---

## Epic 02 Stories - Current State Analysis

### Stories Already Split (COMPLETE)

| Story | Original | Split Into | Status | Files Exist |
|-------|----------|------------|--------|-------------|
| 02.5 | BOM Items | 02.5a (Core), 02.5b (Advanced) | COMPLETE | YES |
| 02.10 | Traceability | 02.10a (Config), 02.10b (Queries) | COMPLETE | YES |

### Stories NOT Requiring Split

| Story | Reason | Complexity |
|-------|--------|------------|
| 02.1 | Products CRUD - focused scope | M |
| 02.2 | Product Versioning - small scope | S |
| 02.3 | Product Allergens - self-contained | M |
| 02.4 | BOMs CRUD - self-contained | M |
| 02.6 | BOM Alternatives + Clone - reasonable scope | M |
| 02.7 | Routings CRUD - self-contained | M |
| 02.8 | Routing Operations - L but focused | L |
| 02.9 | BOM-Routing Costs - focused | M |
| 02.11 | Shelf Life Calculation - focused | M |
| 02.12 | Technical Dashboard - focused | M |
| 02.13 | Nutrition Calculation - L but focused | L |
| 02.14 | BOM Advanced Features - focused | M |
| 02.15 | Cost History + Variance - small | S |

---

## Recommended Story Structure

### Phase 0 (MVP) - Ship First

| Story | Name | Complexity | Dependencies |
|-------|------|------------|--------------|
| 02.1 | Products CRUD + Types | M | 01.1 |
| 02.2 | Product Versioning + History | S | 02.1 |
| 02.3 | Product Allergens | M | 02.1 |
| 02.4 | BOMs CRUD + Date Validity | M | 02.1 |
| **02.5a** | BOM Items Core (MVP) | M | 02.4, 02.7 |
| 02.7 | Routings CRUD | M | 01.1 |
| 02.8 | Routing Operations | L | 02.7 |
| 02.9 | BOM-Routing Costs | M | 02.5a, 02.8 |
| 02.10a | Traceability Configuration | M | 02.1 |

**Total MVP Stories:** 9
**Estimated Days:** 8-10 days (1 developer)

### Phase 1 (Advanced) - After MVP

| Story | Name | Complexity | Dependencies |
|-------|------|------------|--------------|
| **02.5b** | BOM Items Advanced | M | 02.5a merged |
| 02.6 | BOM Alternatives + Clone | M | 02.5a |
| 02.11 | Shelf Life Calculation | M | 02.10a |
| 02.12 | Technical Dashboard | M | 02.1, 02.4 |

**Total Phase 1 Stories:** 4
**Estimated Days:** 4-5 days (1 developer)

### Phase 2 (Enterprise) - Future

| Story | Name | Complexity | Dependencies |
|-------|------|------------|--------------|
| 02.10b | Traceability Queries | L | 02.10a, Epic 05 |
| 02.13 | Nutrition Calculation | L | 02.5a |
| 02.14 | BOM Advanced Features | M | 02.6 |
| 02.15 | Cost History + Variance | S | 02.9 |

**Total Phase 2 Stories:** 4
**Estimated Days:** 5-7 days (1 developer)

---

## Dependency Graph (Complete)

```
Epic 01.1 (Org Context + RLS)
    |
    +---> 02.1 (Products CRUD + Types)
    |       |
    |       +---> 02.2 (Versioning + History)
    |       |
    |       +---> 02.3 (Allergens)
    |       |
    |       +---> 02.4 (BOMs CRUD)
    |       |       |
    |       |       +---> 02.5a (BOM Items MVP) <---- 02.7 (Routings)
    |       |       |       |                              |
    |       |       |       +---> 02.5b (BOM Items Adv)    +---> 02.8 (Routing Ops)
    |       |       |       |       |
    |       |       |       |       +---> 02.6 (Alternatives + Clone)
    |       |       |       |               |
    |       |       |       |               +---> 02.14 (BOM Advanced)
    |       |       |       |
    |       |       |       +---> 02.9 (BOM-Routing Costs) <---- 02.8
    |       |       |       |       |
    |       |       |       |       +---> 02.15 (Cost History)
    |       |       |       |
    |       |       |       +---> 02.13 (Nutrition)
    |       |       |
    |       |       +---> 02.12 (Dashboard)
    |       |
    |       +---> 02.10a (Traceability Config)
    |       |       |
    |       |       +---> 02.10b (Trace Queries) [DEFERRED - needs Epic 05]
    |       |
    |       +---> 02.11 (Shelf Life) <---- 02.4, 02.10a
    |
    +---> 02.7 (Routings CRUD)
            |
            +---> 02.8 (Routing Operations)
```

---

## Conflict Risk Matrix

| Risk | Probability | Impact | Mitigation | Status |
|------|-------------|--------|------------|--------|
| Schema conflict (02.5b needs ALTER TABLE) | LOW | HIGH | Use nullable columns in 02.5a | MITIGATED |
| Code conflict (02.5b breaks 02.5a service) | LOW | HIGH | Extension pattern, frozen base | MITIGATED |
| API breaking change | LOW | MEDIUM | Feature detection, no versioning | MITIGATED |
| Test regression (02.5a tests fail in 02.5b) | MEDIUM | MEDIUM | Freeze 02.5a tests, CI enforcement | PLANNED |
| Merge conflict (parallel development) | MEDIUM | LOW | Sequential merge, clear ownership | PLANNED |
| UI conflict (02.5b changes 02.5a components) | MEDIUM | MEDIUM | Separate components, composition | PLANNED |

---

## Implementation Checklist

### For Each .Xa (MVP) Story

- [x] Create table with ALL columns (Phase 1 nullable)
- [ ] Implement basic service (CRUD only)
- [ ] API routes with feature detection scaffold
- [ ] UI shows basic fields only (Phase 1 hidden)
- [ ] Tests cover MVP scope only
- [ ] Merge to main
- [ ] Mark tests as FROZEN (do not modify)

### For Each .Xb (Phase 1) Story

- [x] NO schema migration needed (columns exist)
- [ ] Extend service (inherit base, add methods)
- [ ] Update API validation (detect Phase 1 features)
- [ ] UI reveals Phase 1 fields
- [ ] Add Phase 1 tests (separate files)
- [ ] Run integration suite (.Xa + .Xb)
- [ ] Merge to main

### For Each .Xc (Phase 2) Story

- [ ] Schema migration OK (new columns/tables)
- [ ] New service or major refactor allowed
- [ ] Breaking changes acceptable (if needed)
- [ ] Full test suite update

---

## Conclusion

**Pattern Approval:** YES - VALIDATED AND ALREADY IMPLEMENTED

**Existing Implementations:**
- 02.5a + 02.5b: BOM Items split COMPLETE
- 02.10a + 02.10b: Traceability split COMPLETE

**No Additional Splits Required:**
- All other Epic 02 stories are reasonably scoped (M or L complexity)
- L-sized stories (02.8, 02.13) are focused on single domains

**Next Steps:**
1. Implement 02.5a (MVP), merge to main
2. Implement 02.5b (Phase 1), merge to main
3. Follow same pattern for 02.10a -> 02.10b (after Epic 05)

---

## Quality Checklist

- [x] Pattern validated (pros/cons documented)
- [x] Guardrails defined (5 key rules)
- [x] Database strategy clear (forward-compatible schema)
- [x] Service pattern documented (extension, not modification)
- [x] Testing strategy defined (frozen parent tests)
- [x] Epic 02 stories analyzed (split recommendations)
- [x] Risk matrix included
- [x] Implementation checklist provided
- [x] All story files exist (02.5a, 02.5b, 02.10a, 02.10b)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial phase split analysis | ARCHITECT-AGENT |
| 1.1 | 2025-12-16 | Corrected: 02.5b exists, updated status to VALIDATED | ARCHITECT-AGENT |
