# EPIC: BOM Complexity Enhancement v2

**Priority**: P0 (Highest)  
**Epic ID**: EPIC-001  
**Created**: 2025-01-11  
**Target Sprint**: Q1 2025  
**Estimated Effort**: 4-6 weeks

---

## 🎯 Epic Overview

### Vision Statement

Enable MonoPilot to handle complex Bill of Materials scenarios including by-products, multi-version BOMs, and conditional components, providing the foundation for accurate production planning and traceability in food manufacturing.

### Business Value

**Why This Epic?**
- **BOM is the foundation of MES** - Without proper BOM, you can't create correct Work Orders, reserve materials, or model complex products
- **Supports complex food processing** - Handle bones from meat processing, seasonal recipes, allergen-free variants
- **Enables accurate costing** - Track all outputs (main product + by-products) for true cost analysis
- **Regulatory compliance** - Support multiple recipe versions for auditing and traceability

### Success Metrics

- ✅ Support WOs with 1 main output + N by-products
- ✅ Manage 5+ BOM versions per product simultaneously
- ✅ Handle conditional components based on customer requirements
- ✅ 100% test coverage for new BOM features
- ✅ No regressions in existing BOM functionality

---

## 📋 Features Breakdown

### Feature 1: By-Products Support 🥩

**Business Need**: In meat processing, you often have multiple outputs from a single WO (e.g., ribeye steaks + bones + trim).

**Current Problem**:
- Work Orders can only produce ONE output product
- By-products (bones, trim, fat) are lost in the system
- Cannot track true yield or costs

**Solution**:
Create `wo_by_products` table to track multiple outputs per WO.

**User Stories**:
1. As a Production Planner, I want to define by-products in BOM so they're automatically tracked in WO
2. As a Production Operator, I want to record quantities for all outputs (main + by-products) when completing a WO
3. As a Cost Accountant, I want to see all products created from a WO to calculate true unit cost
4. As a Warehouse Manager, I want by-products to generate separate License Plates for tracking

**Acceptance Criteria**:
- ✅ BOM can define 0-5 by-products with expected yield %
- ✅ WO creation snapshots by-products from BOM
- ✅ WO completion records actual quantities for each by-product
- ✅ Each by-product generates a separate LP with parent-child relationship
- ✅ By-products appear in production output reports

**Technical Implementation**:

**Database Schema**:
```sql
-- Migration: 044_wo_by_products.sql
CREATE TABLE wo_by_products (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  expected_quantity NUMERIC(12,4) NOT NULL,
  actual_quantity NUMERIC(12,4) DEFAULT 0,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER REFERENCES license_plates(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wo_by_products_wo ON wo_by_products(wo_id);
CREATE INDEX idx_wo_by_products_product ON wo_by_products(product_id);
CREATE INDEX idx_wo_by_products_lp ON wo_by_products(lp_id);

-- Enable RLS
ALTER TABLE wo_by_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_users_all" ON wo_by_products 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger
CREATE TRIGGER update_wo_by_products_updated_at 
  BEFORE UPDATE ON wo_by_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE wo_by_products IS 'Secondary outputs from work orders (e.g., bones, trim from meat processing)';
COMMENT ON COLUMN wo_by_products.expected_quantity IS 'Expected yield of by-product based on BOM';
COMMENT ON COLUMN wo_by_products.actual_quantity IS 'Actual quantity produced and recorded by operator';
```

**BOM Items Enhancement**:
```sql
-- Migration: 045_bom_by_products.sql
-- Add by-product flag to bom_items
ALTER TABLE bom_items ADD COLUMN is_by_product BOOLEAN DEFAULT FALSE;
ALTER TABLE bom_items ADD COLUMN yield_percentage NUMERIC(5,2);

COMMENT ON COLUMN bom_items.is_by_product IS 'True if this item is an output (by-product), false if input (material)';
COMMENT ON COLUMN bom_items.yield_percentage IS 'Expected yield % for by-products (e.g., 15% bones from 100kg meat)';
```

**API Changes**:
```typescript
// lib/api/workOrders.ts - Enhanced create method
interface CreateWorkOrderRequest {
  // ... existing fields ...
  by_products?: Array<{
    product_id: number;
    expected_quantity: number;
    uom: string;
  }>;
}

// New method: Record by-product output
static async recordByProductOutput(
  woId: number,
  byProductId: number,
  actualQuantity: number,
  locationId: number
): Promise<{ lp_id: number; lp_number: string }>;
```

**UI Components**:
- `BOMByProductsSection.tsx` - Add/edit by-products in BOM
- `WOByProductsTable.tsx` - Display expected vs actual by-products in WO details
- `RecordByProductModal.tsx` - Record actual by-product quantities

**Tests**:
- Unit tests: BOM by-product validation, WO snapshot logic
- E2E tests: Create BOM with by-products → Create WO → Record outputs

**Effort**: 1.5-2 weeks

---

### Feature 2: Multi-Version BOM 📅

**Business Need**: Need different BOMs for same FG (seasonal variants, supply chain changes, regulatory updates).

**Current Problem**:
- Only ONE active BOM per product
- Changing recipe invalidates historical WOs
- Cannot plan ahead for future recipe changes

**Solution**:
Add date-based versioning to BOMs with `effective_from` and `effective_to` dates.

**User Stories**:
1. As a Product Manager, I want to create a new BOM version without deactivating the current one
2. As a Production Planner, I want to schedule WOs with future BOM versions for planned recipe changes
3. As a Quality Manager, I want to see which BOM version was used for a specific production batch
4. As a Compliance Officer, I want to audit historical BOMs for regulatory reporting

**Acceptance Criteria**:
- ✅ Multiple BOMs can be active for the same product with different date ranges
- ✅ Date ranges cannot overlap for the same product
- ✅ WO automatically selects correct BOM based on `scheduled_start` date
- ✅ Historical WOs preserve the BOM version used (via snapshot)
- ✅ BOM version display shows effective date range

**Technical Implementation**:

**Database Schema**:
```sql
-- Migration: 046_bom_versioning.sql
-- Add date range columns
ALTER TABLE boms ADD COLUMN effective_from TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE boms ADD COLUMN effective_to TIMESTAMPTZ;

-- Add unique constraint: no overlapping date ranges for same product
CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM boms
    WHERE product_id = NEW.product_id
      AND id != COALESCE(NEW.id, -1)
      AND status = 'active'
      AND (
        (NEW.effective_from, COALESCE(NEW.effective_to, 'infinity'::timestamptz)) OVERLAPS
        (effective_from, COALESCE(effective_to, 'infinity'::timestamptz))
      )
  ) THEN
    RAISE EXCEPTION 'BOM date range overlaps with existing active BOM for this product';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_bom_date_overlap_trigger
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  EXECUTE FUNCTION check_bom_date_overlap();

-- Comments
COMMENT ON COLUMN boms.effective_from IS 'Date when this BOM version becomes active';
COMMENT ON COLUMN boms.effective_to IS 'Date when this BOM version expires (NULL = no expiry)';
```

**BOM Selection RPC**:
```sql
-- Migration: 047_select_bom_by_date.sql
CREATE OR REPLACE FUNCTION select_bom_for_wo(
  p_product_id INTEGER,
  p_scheduled_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER AS $$
DECLARE
  v_bom_id INTEGER;
BEGIN
  -- Find active BOM that covers the scheduled date
  SELECT id INTO v_bom_id
  FROM boms
  WHERE product_id = p_product_id
    AND status = 'active'
    AND effective_from <= p_scheduled_date
    AND (effective_to IS NULL OR effective_to > p_scheduled_date)
  ORDER BY effective_from DESC
  LIMIT 1;

  IF v_bom_id IS NULL THEN
    RAISE EXCEPTION 'No active BOM found for product % on date %', p_product_id, p_scheduled_date;
  END IF;

  RETURN v_bom_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION select_bom_for_wo IS 'Select the correct BOM version for a WO based on scheduled date';
```

**API Changes**:
```typescript
// lib/api/boms.ts - Enhanced methods
interface BOM {
  // ... existing fields ...
  effective_from: string;
  effective_to?: string | null;
  is_current: boolean;  // Derived: effective_from <= NOW() < effective_to
  is_future: boolean;   // Derived: effective_from > NOW()
}

// New method: Get BOM for specific date
static async getBOMForDate(
  productId: number,
  date: string
): Promise<BOM | null>;

// New method: Clone BOM for new version
static async cloneBOM(
  bomId: number,
  effectiveFrom: string,
  effectiveTo?: string
): Promise<BOM>;
```

**UI Components**:
- `BOMVersionTimeline.tsx` - Visual timeline of BOM versions
- `CreateBOMVersionModal.tsx` - Create new version from existing
- `BOMVersionSelector.tsx` - Select BOM version when creating WO

**Tests**:
- Unit tests: Date overlap validation, BOM selection logic
- E2E tests: Create multiple BOM versions → Create WO → Verify correct version selected

**Effort**: 1.5-2 weeks

---

### Feature 3: Conditional BOM Components 🔀

**Business Need**: Some materials are optional based on customer requirements (e.g., allergen-free ingredients, special packaging).

**Current Problem**:
- All BOM items are mandatory
- Cannot model customer-specific variations
- Manual adjustments required for each order

**Solution**:
Enhance `bom_items` with conditional rules stored in JSONB.

**User Stories**:
1. As a Sales Manager, I want to flag customer orders that require special ingredients
2. As a Production Planner, I want WOs to automatically include/exclude materials based on order requirements
3. As a Product Manager, I want to define substitution rules for materials (e.g., allergen-free alternative)
4. As a Buyer, I want to see conditional materials in demand forecast

**Acceptance Criteria**:
- ✅ BOM items can have `is_optional` flag
- ✅ BOM items can have JSONB condition rules
- ✅ WO creation evaluates conditions and includes/excludes materials
- ✅ UI shows which materials are conditional and why
- ✅ Condition types: `order_flag`, `customer_preference`, `substitution`

**Technical Implementation**:

**Database Schema**:
```sql
-- Migration: 048_bom_conditional_items.sql
-- Add condition field (already has is_optional)
ALTER TABLE bom_items ADD COLUMN condition JSONB;

-- Example conditions:
-- {"type": "order_flag", "flag": "allergen_free", "action": "exclude"}
-- {"type": "order_flag", "flag": "kosher", "action": "substitute", "substitute_material_id": 456}
-- {"type": "customer_preference", "customer_id": 10, "action": "include"}

-- Validation function
CREATE OR REPLACE FUNCTION validate_bom_condition(condition JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  IF condition IS NULL THEN
    RETURN TRUE;
  END IF;

  IF NOT (condition ? 'type') THEN
    RAISE EXCEPTION 'Condition must have "type" field';
  END IF;

  IF condition->>'type' = 'order_flag' AND NOT (condition ? 'flag') THEN
    RAISE EXCEPTION 'order_flag condition must have "flag" field';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE bom_items ADD CONSTRAINT valid_condition
  CHECK (validate_bom_condition(condition));

-- Comments
COMMENT ON COLUMN bom_items.condition IS 'JSONB condition rules for when this item should be included/excluded/substituted';
```

**WO Material Evaluation RPC**:
```sql
-- Migration: 049_evaluate_bom_conditions.sql
CREATE OR REPLACE FUNCTION evaluate_bom_materials(
  p_bom_id INTEGER,
  p_wo_quantity NUMERIC,
  p_order_flags JSONB DEFAULT '{}'::JSONB,
  p_customer_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  material_id INTEGER,
  total_qty_needed NUMERIC,
  uom VARCHAR,
  is_conditional BOOLEAN,
  condition_met BOOLEAN,
  substituted_from INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN bi.condition->>'action' = 'substitute' 
        AND (bi.condition->>'type' = 'order_flag' AND p_order_flags ? (bi.condition->>'flag'))
      THEN (bi.condition->>'substitute_material_id')::INTEGER
      ELSE bi.material_id
    END AS material_id,
    bi.quantity * p_wo_quantity AS total_qty_needed,
    bi.uom,
    (bi.condition IS NOT NULL) AS is_conditional,
    (
      bi.condition IS NULL OR
      (bi.condition->>'type' = 'order_flag' AND p_order_flags ? (bi.condition->>'flag'))
    ) AS condition_met,
    CASE 
      WHEN bi.condition->>'action' = 'substitute' THEN bi.material_id
      ELSE NULL
    END AS substituted_from
  FROM bom_items bi
  WHERE bi.bom_id = p_bom_id
    AND NOT bi.is_by_product
    AND (
      bi.condition IS NULL OR
      (bi.condition->>'type' = 'order_flag' AND bi.condition->>'action' = 'include' AND p_order_flags ? (bi.condition->>'flag')) OR
      (bi.condition->>'type' = 'order_flag' AND bi.condition->>'action' = 'exclude' AND NOT p_order_flags ? (bi.condition->>'flag')) OR
      (bi.condition->>'type' = 'order_flag' AND bi.condition->>'action' = 'substitute' AND p_order_flags ? (bi.condition->>'flag'))
    )
  ORDER BY bi.sequence;
END;
$$ LANGUAGE plpgsql;
```

**API Changes**:
```typescript
// lib/api/boms.ts - Enhanced BOMItem interface
interface BOMItem {
  // ... existing fields ...
  condition?: {
    type: 'order_flag' | 'customer_preference' | 'substitution';
    flag?: string;
    action: 'include' | 'exclude' | 'substitute';
    substitute_material_id?: number;
    customer_id?: number;
  };
}

// lib/api/workOrders.ts - Enhanced create
interface CreateWorkOrderRequest {
  // ... existing fields ...
  order_flags?: string[];  // e.g., ['allergen_free', 'kosher']
  customer_id?: number;
}
```

**UI Components**:
- `BOMConditionalItemEditor.tsx` - Add condition rules to BOM items
- `WOConditionalMaterialsPanel.tsx` - Show which materials are conditional
- `OrderFlagsSelector.tsx` - Select order flags when creating WO

**Tests**:
- Unit tests: Condition evaluation logic, substitution rules
- E2E tests: Create BOM with conditions → Create WO with flags → Verify correct materials

**Effort**: 1-1.5 weeks

---

## 🗺️ Implementation Roadmap

### Phase 1: By-Products (Weeks 1-2)
- [ ] Week 1: Database schema + migrations
  - [ ] Create `wo_by_products` table
  - [ ] Enhance `bom_items` with `is_by_product` flag
  - [ ] Write unit tests for schema
- [ ] Week 2: API + UI
  - [ ] Implement `WorkOrdersAPI.recordByProductOutput()`
  - [ ] Create `BOMByProductsSection` component
  - [ ] Create `RecordByProductModal` component
  - [ ] E2E tests

### Phase 2: Multi-Version BOM (Weeks 3-4)
- [ ] Week 3: Database schema + BOM selection logic
  - [ ] Add `effective_from`/`effective_to` columns
  - [ ] Create date overlap validation trigger
  - [ ] Create `select_bom_for_wo()` RPC function
  - [ ] Write unit tests
- [ ] Week 4: API + UI
  - [ ] Implement `BOMSAPI.getBOMForDate()` and `cloneBOM()`
  - [ ] Create `BOMVersionTimeline` component
  - [ ] Create `CreateBOMVersionModal` component
  - [ ] E2E tests

### Phase 3: Conditional Components (Weeks 5-6)
- [ ] Week 5: Database schema + evaluation logic
  - [ ] Add `condition` JSONB column to `bom_items`
  - [ ] Create validation function
  - [ ] Create `evaluate_bom_materials()` RPC function
  - [ ] Write unit tests
- [ ] Week 6: API + UI
  - [ ] Enhance `WorkOrdersAPI.create()` with order flags
  - [ ] Create `BOMConditionalItemEditor` component
  - [ ] Create `WOConditionalMaterialsPanel` component
  - [ ] E2E tests

### Phase 4: Integration & Polish (Week 6-7)
- [ ] Integration testing (all features together)
- [ ] Performance testing (BOM with many versions/conditions)
- [ ] Documentation updates
- [ ] Demo preparation

---

## ✅ Acceptance Criteria (Epic Level)

### Functional Requirements
- ✅ Work Orders can produce 1 main output + up to 5 by-products
- ✅ Each product can have up to 10 active BOM versions with non-overlapping date ranges
- ✅ BOM items support 3 condition types: order_flag, customer_preference, substitution
- ✅ All existing BOM functionality continues to work (no regressions)

### Non-Functional Requirements
- ✅ BOM selection query < 100ms for products with 10 versions
- ✅ WO creation with conditional materials < 500ms
- ✅ 100% unit test coverage for new features
- ✅ 80%+ E2E test coverage for critical paths
- ✅ All database migrations are reversible

### Documentation
- ✅ Database schema documentation updated
- ✅ API documentation for new endpoints
- ✅ User guide for BOM versioning and conditions
- ✅ Migration guide for existing BOMs

---

## 🧪 Testing Strategy

### Unit Tests
- BOM date range overlap validation
- BOM selection by date algorithm
- Condition evaluation logic (order_flag, substitution)
- By-product quantity calculations
- **Target**: 100% coverage for new code

### Integration Tests
- Create BOM with by-products → Create WO → Verify snapshot
- Create multiple BOM versions → Create WO → Verify correct version selected
- Create BOM with conditions → Create WO with flags → Verify material list

### E2E Tests (Playwright)
- **Scenario 1**: Create BOM with 2 by-products → Create WO → Record outputs → Verify LPs created
- **Scenario 2**: Create BOM v1 → Create BOM v2 (future date) → Create WO today → Verify v1 used
- **Scenario 3**: Create BOM with allergen-free condition → Create WO with flag → Verify substitution

### Performance Tests
- BOM with 10 versions: select_bom_for_wo() < 100ms
- BOM with 50 conditional items: evaluate_bom_materials() < 200ms
- WO creation with 100 materials: < 1 second

---

## 📊 Success Metrics

### Development Metrics
- All features delivered on time (6 weeks)
- Zero P0/P1 bugs in production
- 100% unit test coverage
- 85%+ E2E test coverage

### Business Metrics
- 50%+ reduction in manual BOM adjustments for custom orders
- 100% by-product tracking (previously 0%)
- 5+ BOM versions managed per product (previously 1)
- 90%+ user satisfaction (post-launch survey)

### Technical Metrics
- BOM selection query: < 100ms (target)
- WO creation: < 500ms (target)
- Zero performance regressions on existing features

---

## 🚧 Risks & Mitigations

### Risk 1: Data Migration Complexity
**Risk**: Existing BOMs need `effective_from` date, unclear what date to use  
**Impact**: HIGH  
**Likelihood**: MEDIUM  
**Mitigation**: 
- Set `effective_from` to BOM `created_at` date
- Set `effective_to` to NULL (indefinite)
- Provide manual override UI for edge cases

### Risk 2: Condition Logic Complexity
**Risk**: JSONB condition evaluation may be hard to debug/maintain  
**Impact**: MEDIUM  
**Likelihood**: MEDIUM  
**Mitigation**:
- Start with simple condition types (order_flag only)
- Add extensive logging in RPC functions
- Create condition validator UI with preview
- Document condition schema with examples

### Risk 3: Performance Degradation
**Risk**: Multiple BOM versions + conditions slow down WO creation  
**Impact**: HIGH  
**Likelihood**: LOW  
**Mitigation**:
- Add indexes on `boms(product_id, effective_from, effective_to)`
- Cache BOM selection results for 5 minutes
- Implement pagination for BOM version lists
- Performance test with 100 versions per product

### Risk 4: User Confusion
**Risk**: Users struggle to understand BOM versioning UI  
**Impact**: MEDIUM  
**Likelihood**: MEDIUM  
**Mitigation**:
- Add visual timeline for BOM versions
- Show "Current/Future/Expired" badges
- Provide wizard for creating new versions
- Create video tutorial

---

## 📚 Related Documentation

- `docs/12_DATABASE_TABLES.md` - Current BOM schema
- `docs/bmm/artifacts/tech-spec.md` - Technical specification
- `docs/bmm/sessions/2025-01-11-brainstorm-init.md` - Epic prioritization

---

## 🎉 Definition of Done

An epic is considered DONE when:
- ✅ All features are implemented and tested
- ✅ All acceptance criteria are met
- ✅ Code is reviewed and approved
- ✅ All tests pass (unit, integration, E2E)
- ✅ Performance benchmarks are met
- ✅ Documentation is updated
- ✅ Demo is presented to stakeholders
- ✅ Product Owner approves

---

**Last Updated**: 2025-01-11  
**Status**: 🟡 Phase 1 Complete (33% Total Progress)  
**Next Action**: Start Phase 2 (Multi-Version BOM) or continue with Phase 1 integration testing

---

## 📊 **Epic Progress**

### ✅ **Phase 1: By-Products Support** - **COMPLETED** (100%)
- ✅ Database schema (2 migrations applied)
- ✅ Unit tests (35 tests, 100% pass)
- ✅ API methods (3 new methods)
- ✅ UI components (3 components)
- ✅ E2E tests (8 scenarios)
- 📄 **Summary**: `docs/EPIC-001_PHASE-1_BY-PRODUCTS_SUMMARY.md`

### ⏳ **Phase 2: Multi-Version BOM** - **PENDING** (0%)
- ⏸️ Database schema (effective_from/to, date overlap validation)
- ⏸️ RPC function (select_bom_for_wo)
- ⏸️ API methods (getBOMForDate, cloneBOM)
- ⏸️ UI components (BOMVersionTimeline, CreateBOMVersionModal)
- ⏸️ E2E tests

### ⏳ **Phase 3: Conditional Components** - **PENDING** (0%)
- ⏸️ Database schema (condition JSONB column)
- ⏸️ RPC function (evaluate_bom_materials)
- ⏸️ API enhancements (order flags support)
- ⏸️ UI components (BOMConditionalItemEditor)
- ⏸️ E2E tests

### ⏳ **Phase 4: Integration & Polish** - **PENDING** (0%)
- ⏸️ Integration testing
- ⏸️ Performance testing
- ⏸️ Documentation updates

**Overall Epic Progress**: 🟡 **33% Complete** (1/3 phases)

