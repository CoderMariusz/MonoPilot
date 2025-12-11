# Batch 04B-1: Consumption Control - Tech Spec

**Stories:** 4.9-4.11
**Effort:** 6-8 hours
**Dependencies:** Batch 04A-2

---

## Database Tables

Uses tables from Batch 04A-2:
- `wo_consumption` - Consumption records
- `wo_materials` - Material requirements with consume_whole_lp flag

### Columns to Add

```sql
-- wo_materials additions
ALTER TABLE wo_materials ADD COLUMN IF NOT EXISTS variance DECIMAL(15,4) DEFAULT 0;
-- variance = consumed_qty - required_qty
```

---

## API Endpoints

| Method | Endpoint | Story | Description |
|--------|----------|-------|-------------|
| POST | `/api/production/work-orders/:id/consume/reverse` | 4.10 | Reverse consumption |

---

## Business Logic

### Story 4.9: 1:1 Consumption Enforcement

```typescript
// In consumption-service.ts
async function consumeMaterial(woId, materialId, lpId, qty, userId) {
  const material = await getMaterial(materialId);

  if (material.consume_whole_lp) {
    const lp = await getLP(lpId);
    if (qty !== lp.current_qty) {
      throw new Error('Must consume full LP quantity');
    }
  }

  // ... proceed with consumption
}
```

### Story 4.10: Consumption Correction

```typescript
async function reverseConsumption(consumptionId, userId) {
  // Only Manager role
  await requireRole(userId, ['manager', 'admin']);

  // Transaction:
  // 1. Mark consumption as reversed
  // 2. Restore LP qty
  // 3. Update wo_materials.consumed_qty
  // 4. Create audit trail
}
```

### Story 4.11: Over-Consumption Control

```typescript
async function consumeMaterial(woId, materialId, lpId, qty, userId) {
  const settings = await getSettings(orgId);
  const material = await getMaterial(materialId);

  const totalConsumed = material.consumed_qty + qty;

  if (!settings.allow_over_consumption && totalConsumed > material.required_qty) {
    throw new Error(`Over-consumption not allowed. Max: ${material.required_qty - material.consumed_qty}`);
  }

  // If allowed, log variance
  if (totalConsumed > material.required_qty) {
    material.variance = totalConsumed - material.required_qty;
    // Notify supervisor via alert
  }
}
```

---

## Transaction Atomicity (Story 4.11)

Consumption transaction must be atomic:

```sql
BEGIN;

-- 1. Lock rows
SELECT * FROM wo_materials WHERE id = $material_id FOR UPDATE;
SELECT * FROM license_plates WHERE id = $lp_id FOR UPDATE;

-- 2. Validate
-- Check WO status, LP qty, over-consumption rules

-- 3. Execute
INSERT INTO wo_consumption (...) VALUES (...);
UPDATE license_plates SET current_qty = current_qty - $qty WHERE id = $lp_id;
UPDATE wo_materials SET consumed_qty = consumed_qty + $qty WHERE id = $material_id;

-- 4. Check constraints
-- LP qty >= 0
-- Over-consumption rules

COMMIT; -- or ROLLBACK on failure
```

---

## Settings (production_settings)

| Setting | Type | Default | Story |
|---------|------|---------|-------|
| `allow_over_consumption` | boolean | false | 4.11 |
| `allow_partial_lp_consumption` | boolean | true | 4.9 |

---

## Scanner UI Adaptations

### 1:1 Enforcement on Scanner (4.9)
```tsx
// When consume_whole_lp = true
<QtyInput
  value={lp.current_qty}
  disabled={true}
  label={`Full LP: ${lp.current_qty} ${uom.symbol}`}
/>
```

---

## Error Messages

| Scenario | Message |
|----------|---------|
| Partial on 1:1 LP | "This material requires full LP consumption. Qty: {lp.current_qty} {uom}" |
| Over-consumption blocked | "Over-consumption not allowed. Required: {req}, Consumed: {cons}, Max remaining: {rem}" |
| Reversal unauthorized | "Only Managers can reverse consumption records" |
| LP already consumed | "LP {lp_number} has already been fully consumed" |

---

## RLS Policies

Existing tables - no new RLS needed.
