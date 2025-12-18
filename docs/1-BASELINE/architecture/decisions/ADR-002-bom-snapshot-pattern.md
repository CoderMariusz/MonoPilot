# ADR-002: BOM Snapshot Pattern for Work Orders

## Status: ACCEPTED

**Date**: 2025-12-10
**Decision Makers**: Architecture Team
**Related PRDs**: Technical (Epic 2), Planning (Epic 3), Production (Epic 4)

---

## Context

Work Orders (WOs) require a Bill of Materials (BOM) to define:
- What materials are needed (inputs)
- What operations to perform (routing)
- What outputs are produced

The challenge: BOMs evolve over time (new ingredients, changed quantities, version updates). When a WO is executed days/weeks after creation, which BOM version should apply?

Options:
1. **Live Reference**: WO always uses current BOM
2. **Version Lock**: WO references specific BOM version ID
3. **Snapshot Copy**: WO copies BOM data at creation time

---

## Decision

**Adopt BOM Snapshot Pattern: Copy BOM items and routing to WO tables at creation time.**

When a Work Order is created:
1. Select active BOM based on effective date
2. Copy `bom_items` -> `wo_materials` with quantity scaling
3. Copy `routing_operations` -> `wo_operations`
4. Store `bom_id` and `bom_version` for audit reference

The WO then operates on its own copy, independent of subsequent BOM changes.

---

## Implementation

### BOM Selection

```typescript
// work-order-service.ts
const scheduledDate = input.planned_start_date || new Date()
const activeBom = await getActiveBOMForProduct(input.product_id, scheduledDate)
```

BOM selection uses effective date logic:
```sql
SELECT * FROM boms
WHERE product_id = $1
  AND status = 'active'
  AND effective_from <= $2
  AND (effective_to IS NULL OR effective_to > $2)
ORDER BY effective_from DESC
LIMIT 1;
```

### Material Copy with Scaling

```typescript
// Scale BOM quantities to WO quantity
const woMaterials = bomItems.map(item => ({
  wo_id: woId,
  product_id: item.product_id,
  material_name: item.product?.name,
  required_qty: item.quantity * (woQty / bom.output_qty),
  consumed_qty: 0,
  uom: item.uom,
  bom_item_id: item.id,       // Reference for audit
  bom_version: bom.version,   // Reference for audit
}))
```

### Routing Copy

```typescript
const woOperations = routingOps.map(op => ({
  wo_id: woId,
  sequence: op.sequence,
  operation_name: op.name,
  machine_id: op.machine_id,
  expected_duration_minutes: op.duration,
  status: 'pending',
}))
```

### Data Model

```
boms                          work_orders
+----------------+            +----------------+
| id             |            | id             |
| product_id     |            | product_id     |
| version        |            | bom_id (ref)   |
| output_qty     |            | planned_qty    |
| effective_from |            | produced_qty   |
+----------------+            +----------------+
       |                             |
       v                             v
bom_items                     wo_materials
+----------------+            +----------------+
| bom_id         |            | wo_id          |
| product_id     |  copy -->  | product_id     |
| quantity       |            | required_qty   |
| uom            |            | consumed_qty   |
+----------------+            | bom_item_id    |
                              +----------------+

routing_operations            wo_operations
+----------------+            +----------------+
| routing_id     |            | wo_id          |
| sequence       |  copy -->  | sequence       |
| name           |            | operation_name |
| machine_id     |            | machine_id     |
| duration       |            | expected_dur   |
+----------------+            | actual_dur     |
                              +----------------+
```

---

## Alternatives

| Option | Pros | Cons |
|--------|------|------|
| **Live Reference** | Simple; always current | Production uses wrong BOM if changed mid-WO |
| **Version Lock** | Clear reference; no duplication | BOM delete/archive breaks WO; version cascade |
| **Snapshot Copy (chosen)** | WO is self-contained; immutable; audit safe | Data duplication; requires copy logic |

---

## Consequences

### Positive

1. **Immutability**: WO materials/operations never change after creation
2. **Audit Trail**: Full record of what BOM was used at execution time
3. **BOM Independence**: BOM can be archived/deleted without breaking WOs
4. **Regulatory Compliance**: Clear documentation of exact formulation used
5. **Variance Tracking**: Compare planned (BOM snapshot) vs actual (consumption)

### Negative

1. **Data Duplication**: BOM data copied to every WO
2. **Copy Complexity**: Must handle scaling, conditional items, alternatives
3. **Sync Issues**: WO not updated if BOM error discovered after creation
4. **Storage Growth**: More rows in wo_materials table

### Mitigation

| Challenge | Mitigation |
|-----------|------------|
| Data duplication | Acceptable for audit/compliance; compress old WOs |
| Copy complexity | Encapsulated in `copyBOMToWOMaterials()` function |
| Sync issues | Allow WO re-copy before status=in_progress |
| Storage growth | Archive completed WOs after retention period |

---

## Scaling Formula

```
wo_material.required_qty = bom_item.quantity * (wo.planned_qty / bom.output_qty)
```

Example:
- BOM output_qty: 100 kg
- BOM item: 5 kg flour
- WO planned_qty: 250 kg
- WO material required_qty: 5 * (250/100) = 12.5 kg flour

---

## Edge Cases

### 1. BOM Updated After WO Creation

- **Before WO starts**: Can delete WO and recreate, or allow manual re-copy
- **After WO in_progress**: No change; WO uses snapshot

### 2. Missing BOM at WO Creation

- WO created without BOM (warning logged)
- User can manually add materials
- Or wait for BOM and re-copy before starting

### 3. Conditional BOM Items

```typescript
// Conditional items have condition_flags
if (item.condition_flags?.includes('summer_variant')) {
  // Include only if WO has matching flag
}
```

### 4. Alternative Materials

Alternatives stored in `wo_material_alternatives` (or allow substitution during reservation)

---

## Validation

This decision was validated against:
- [x] Food safety documentation requirements
- [x] Cost variance tracking needs (planned vs actual)
- [x] BOM versioning lifecycle (draft -> active -> obsolete)
- [x] Competitor patterns (SAP, Oracle MES use similar approach)

---

## References

- Work Order Service: `apps/frontend/lib/services/work-order-service.ts`
- BOM Service: `apps/frontend/lib/services/bom-service.ts`
- PRD Planning Module: `docs/1-BASELINE/product/modules/planning.md`
