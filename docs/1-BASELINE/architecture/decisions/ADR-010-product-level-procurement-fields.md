# ADR-010: Move Lead Time and MOQ to Product Level

## Status
ACCEPTED

## Context

In the current schema (migration 025), procurement-related fields are stored at the supplier level:
- `suppliers.lead_time_days` - Default lead time in days
- `suppliers.moq` - Minimum Order Quantity

**Problem:**
Lead time and MOQ vary significantly by product, not by supplier. For example:
- Supplier A supplies both flour (1-day lead time, 50kg MOQ) and packaging (7-day lead time, 1000-unit MOQ)
- Storing these values on supplier record forces same lead time/MOQ for all products from that supplier
- This limits procurement planning accuracy and flexibility

**Real-World Use Cases:**
1. **Product-specific lead times**: Raw materials ship faster than custom packaging
2. **Product-specific MOQs**: Bulk commodities have different MOQ than specialty ingredients
3. **Multi-supplier products**: Same product from different suppliers can have different terms
4. **Procurement planning**: MRP calculations need accurate per-product lead times

**Current Workaround:**
The `supplier_products` table allows lead time override, but MOQ cannot be overridden. This creates inconsistency.

---

## Decision

**Move `lead_time_days` and `moq` from `suppliers` table to `products` table.**

### Schema Changes

#### 1. Products Table (ADD fields)
```sql
ALTER TABLE products
  ADD COLUMN lead_time_days INTEGER DEFAULT 7,
  ADD COLUMN moq DECIMAL(10,2);

COMMENT ON COLUMN products.lead_time_days IS 'Procurement lead time in days (default: 7)';
COMMENT ON COLUMN products.moq IS 'Minimum order quantity for procurement';
```

#### 2. Suppliers Table (REMOVE fields)
```sql
ALTER TABLE suppliers
  DROP COLUMN lead_time_days,
  DROP COLUMN moq;
```

### Data Migration Strategy

```sql
-- For products with supplier assignments, copy lead time from supplier_products override
-- or supplier default
UPDATE products p
SET lead_time_days = COALESCE(
  (SELECT sp.lead_time_days
   FROM supplier_products sp
   WHERE sp.product_id = p.id
     AND sp.is_default = true
   LIMIT 1),
  (SELECT s.lead_time_days
   FROM supplier_products sp
   JOIN suppliers s ON sp.supplier_id = s.id
   WHERE sp.product_id = p.id
   LIMIT 1),
  7  -- Default fallback
);

-- For products with supplier assignments, copy MOQ from supplier
UPDATE products p
SET moq = (
  SELECT s.moq
  FROM supplier_products sp
  JOIN suppliers s ON sp.supplier_id = s.id
  WHERE sp.product_id = p.id
    AND sp.is_default = true
  LIMIT 1
);
```

### BOM-Routing Relationship

**CONFIRMED:**
- `boms.routing_id` references `routings(id)` - BOM has default routing
- Work Order inherits routing from BOM (not from product)
- WO creation captures full routing snapshot (immutable)

**Documentation Update:**
Added routing relationship notes to:
- `.claude/DATABASE-SCHEMA.md`
- Architecture module docs (already present)

---

## Consequences

### Positive

1. **Granular Procurement Control**: Lead time and MOQ configured per product
2. **Accurate MRP**: Material Requirements Planning uses correct lead times
3. **Multi-Supplier Support**: Same product from different suppliers can have different terms (via supplier_products overrides if needed)
4. **Consistent Model**: All procurement attributes at product level
5. **Flexible Planning**: Product-specific MOQ enables better order batching

### Negative

1. **Schema Migration**: Breaking change for existing data
2. **UI Updates**: Product form needs lead_time_days and moq fields
3. **API Updates**: Product CRUD endpoints need new fields
4. **Data Entry**: Users must set lead time/MOQ per product (default: 7 days, null)
5. **Backward Compatibility**: Existing integrations expecting supplier-level fields will break

### Neutral

1. **Supplier Role Shift**: Supplier becomes purely a vendor contact, not procurement config
2. **Supplier-Product Overrides**: Can still use supplier_products for specific overrides (if needed in future)
3. **Default Values**: Products default to 7-day lead time, null MOQ (optional)

---

## Alternatives Considered

### Option 1: Keep Fields on Supplier (Status Quo)
**Rejected:**
- Cannot model product-specific lead times
- MOQ is always supplier-wide (inaccurate)
- Forces workarounds for multi-product suppliers

### Option 2: Use Only supplier_products Overrides
**Rejected:**
- Requires supplier assignment before setting lead time/MOQ
- Doesn't support standalone products (make-only, no supplier)
- More complex data model (requires JOIN)

### Option 3: Add Both (Supplier Default + Product Override)
**Rejected:**
- Over-engineered for current needs
- Adds confusion (which value is used?)
- More UI complexity (two places to configure)

---

## Implementation Plan

### Phase 1: Database Migration (Priority: P1)
```
Migration: 052_move_lead_time_moq_to_products.sql
- ADD products.lead_time_days
- ADD products.moq
- Migrate data from suppliers to products
- DROP suppliers.lead_time_days
- DROP suppliers.moq
```

### Phase 2: Schema Documentation (Priority: P1)
- [x] Update `.claude/DATABASE-SCHEMA.md`
- [x] Create ADR-010
- [ ] Update `docs/1-BASELINE/architecture/modules/planning.md`
- [ ] Update `docs/1-BASELINE/architecture/modules/technical.md`

### Phase 3: API Updates (Priority: P1)
- [ ] Update Product API: GET/POST/PUT endpoints to include new fields
- [ ] Update Product validation schemas (Zod)
- [ ] Update Supplier API: Remove deprecated fields from response

### Phase 4: UI Updates (Priority: P2)
- [ ] Update Product form (TEC-001): Add lead_time_days, moq fields
- [ ] Update Product detail view
- [ ] Update Supplier form (PLAN-002): Remove lead_time_days, moq fields
- [ ] Update documentation/help text

### Phase 5: Testing (Priority: P1)
- [ ] Unit tests: Product service with new fields
- [ ] Integration tests: Product CRUD with lead_time/moq
- [ ] E2E tests: Product creation workflow
- [ ] Migration rollback test

---

## Validation

- [x] Supports FR-PLAN-001: Product master data with procurement fields
- [x] Supports FR-PLAN-017: Supplier management (simplified)
- [x] Supports FR-PLAN-003: MRP with accurate lead times
- [x] Supports FR-TECH-001: Product CRUD (enhanced)
- [x] Maintains multi-tenancy (org_id on products)
- [x] No impact on existing RLS policies
- [x] Compatible with License Plate pattern (ADR-001)
- [x] Compatible with BOM Snapshot pattern (ADR-002)

---

## Related

### Affected Modules
- **Technical Module**: Products table (primary)
- **Planning Module**: Suppliers table, MRP calculations
- **Warehouse Module**: Procurement receiving (uses lead_time indirectly)

### ADRs
- ADR-001: License Plate Inventory (no impact)
- ADR-002: BOM Snapshot Pattern (no impact)
- ADR-009: Routing-Level Costs (no impact)

### PRDs
- `docs/1-BASELINE/product/modules/technical.md` (FR-TECH-001 to FR-TECH-010)
- `docs/1-BASELINE/product/modules/planning.md` (FR-PLAN-001 to FR-PLAN-020)

### UX Wireframes
- TEC-001: Product List (needs update)
- TEC-002: Product Create/Edit Modal (needs update)
- PLAN-001: Supplier List (remove fields)
- PLAN-002: Supplier Create/Edit Modal (remove fields)

### Database Files
- Migration 025: `apps/frontend/lib/supabase/migrations/025_create_suppliers_table.sql` (superseded)
- Migration 024: `apps/frontend/lib/supabase/migrations/024_create_products_tables.sql` (superseded)
- Migration 052 (NEW): `052_move_lead_time_moq_to_products.sql` (to be created)

---

## References

- Schema Reference: `.claude/DATABASE-SCHEMA.md`
- Architecture Planning: `docs/1-BASELINE/architecture/modules/planning.md`
- Architecture Technical: `docs/1-BASELINE/architecture/modules/technical.md`
- Migration 025: `apps/frontend/lib/supabase/migrations/025_create_suppliers_table.sql`
- Migration 024: `apps/frontend/lib/supabase/migrations/024_create_products_tables.sql`
