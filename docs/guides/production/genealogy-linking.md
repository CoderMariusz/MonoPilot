# Genealogy Linking Guide

**Story:** 04.7a - Output Registration Desktop
**Status:** DEPLOYED
**Module:** Production / Warehouse
**Last Updated:** 2026-01-21

## Overview

Genealogy linking establishes parent-child relationships between License Plates (LPs) during production. When materials are consumed and output is registered, genealogy records trace which input LPs were used to create each output LP.

This enables:
- **Forward Traceability**: From raw materials to finished goods
- **Backward Traceability**: From finished goods back to raw materials
- **Recall Support**: Quickly identify affected products
- **Quality Investigation**: Track contamination or defect origins

## Data Model

### lp_genealogy Table

```sql
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- Relationship
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
  child_lp_id UUID NOT NULL REFERENCES license_plates(id),

  -- Context
  operation_type TEXT NOT NULL, -- 'production', 'split', 'merge', 'consumption'
  quantity NUMERIC(15,4),       -- Qty from parent used in child
  uom TEXT,
  wo_id UUID REFERENCES work_orders(id),

  -- Audit
  operation_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Reversal support
  is_reversed BOOLEAN DEFAULT FALSE,
  reversed_at TIMESTAMPTZ,
  reversed_by UUID REFERENCES users(id),
  reverse_reason TEXT,

  -- Over-production tracking
  is_over_production BOOLEAN DEFAULT FALSE,
  over_production_source TEXT,

  CONSTRAINT unique_parent_child UNIQUE (parent_lp_id, child_lp_id, wo_id)
);

-- Indexes for fast traversal
CREATE INDEX idx_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_genealogy_wo ON lp_genealogy(wo_id);
CREATE INDEX idx_genealogy_org ON lp_genealogy(org_id);
```

## Genealogy Creation Flow

### 1. Material Consumption

When materials are consumed from an LP:

```typescript
// Consumption recorded in wo_consumption table
const consumption = {
  wo_id: workOrderId,
  lp_id: sourceLpId,
  consumed_qty: 100,
  uom: 'kg',
  consumed_by: userId,
};
```

### 2. Output Registration

When output is registered, genealogy links consumed LPs to output LP:

```typescript
// For each consumed LP, create genealogy record
const genealogyRecords = consumedLPs.map((c) => ({
  parent_lp_id: c.lp_id,        // Input material LP
  child_lp_id: outputLpId,      // Output product LP
  operation_type: 'production',
  quantity: c.consumed_qty,
  uom: c.uom,
  wo_id: workOrderId,
  created_by: userId,
}));

await supabase.from('lp_genealogy').insert(genealogyRecords);
```

### 3. Resulting Structure

```
Raw Material LP-001 (100kg Sugar)    ──┐
                                      ├──► Output LP-003 (500kg Cookies)
Raw Material LP-002 (50kg Flour)     ──┘
```

## Service Functions

### createOutputGenealogy

Creates genealogy records when output is registered.

**Location:** `lib/services/genealogy-service.ts`

```typescript
export async function createOutputGenealogy(
  woId: string,
  outputLpId: string,
  consumptions: Array<{
    reservation_id: string;
    lp_id: string;
    consumed_qty: number;
    uom: string;
  }>,
  userId: string
): Promise<GenealogyRecord[]> {
  const supabase = createAdminClient();

  const records = consumptions.map((c) => ({
    parent_lp_id: c.lp_id,
    child_lp_id: outputLpId,
    operation_type: 'production',
    quantity: c.consumed_qty,
    uom: c.uom,
    wo_id: woId,
    created_by: userId,
  }));

  const { data, error } = await supabase
    .from('lp_genealogy')
    .insert(records)
    .select();

  if (error) throw new Error(`Genealogy creation failed: ${error.message}`);
  return data;
}
```

### traceForward

Finds all child LPs derived from a parent LP.

```typescript
export async function traceForward(lpId: string): Promise<LP[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('lp_genealogy')
    .select(`
      child_lp_id,
      quantity,
      operation_type,
      operation_date,
      license_plates!lp_genealogy_child_lp_id_fkey(
        id, lp_number, product_id, quantity, status,
        products(name, product_code)
      )
    `)
    .eq('parent_lp_id', lpId)
    .eq('is_reversed', false);

  if (error) throw error;
  return data?.map((r) => r.license_plates) || [];
}
```

### traceBackward

Finds all parent LPs that contributed to a child LP.

```typescript
export async function traceBackward(lpId: string): Promise<LP[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('lp_genealogy')
    .select(`
      parent_lp_id,
      quantity,
      operation_type,
      operation_date,
      license_plates!lp_genealogy_parent_lp_id_fkey(
        id, lp_number, product_id, quantity, status, batch_number,
        products(name, product_code)
      )
    `)
    .eq('child_lp_id', lpId)
    .eq('is_reversed', false);

  if (error) throw error;
  return data?.map((r) => r.license_plates) || [];
}
```

### getFullGenealogy

Recursively traces entire genealogy tree.

```typescript
export async function getFullGenealogy(
  lpId: string,
  direction: 'forward' | 'backward' | 'both',
  maxDepth: number = 10
): Promise<GenealogyTree> {
  const tree: GenealogyTree = {
    root: await getLPDetails(lpId),
    parents: [],
    children: [],
  };

  if (direction === 'backward' || direction === 'both') {
    tree.parents = await recursiveTrace(lpId, 'backward', maxDepth);
  }

  if (direction === 'forward' || direction === 'both') {
    tree.children = await recursiveTrace(lpId, 'forward', maxDepth);
  }

  return tree;
}
```

## By-Product Genealogy

By-products share the same parent LPs as the main output:

```typescript
// By-product has same genealogy as main output
const byProductGenealogy = mainOutputGenealogy.map((g) => ({
  ...g,
  child_lp_id: byProductLpId,
}));
```

### Example

```
Sugar LP-001 (100kg)     ──┬──► Main Output LP-003 (500kg Cookies)
                          │
Flour LP-002 (50kg)      ──┼──► By-Product LP-004 (25kg Cookie Crumbs)
                          │
                          └──► By-Product LP-005 (10kg Trim Waste)
```

## Over-Production Genealogy

When over-production occurs, genealogy links to manually selected parent LP:

```typescript
if (isOverProduction && overProductionParentLpId) {
  await supabase.from('lp_genealogy').insert({
    parent_lp_id: overProductionParentLpId,
    child_lp_id: outputLpId,
    operation_type: 'production',
    quantity: overProductionQty,
    wo_id: woId,
    is_over_production: true,
    over_production_source: 'operator_selected',
    created_by: userId,
  });
}
```

## Reversal Handling

When consumption is reversed, genealogy records are marked as reversed:

```typescript
export async function reverseGenealogy(
  consumptionId: string,
  woId: string,
  parentLpId: string,
  reason: string,
  userId: string
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('lp_genealogy')
    .update({
      is_reversed: true,
      reversed_at: new Date().toISOString(),
      reversed_by: userId,
      reverse_reason: reason,
    })
    .eq('parent_lp_id', parentLpId)
    .eq('wo_id', woId);
}
```

## API Endpoints

### GET /api/warehouse/lps/{lpId}/genealogy

Returns full genealogy for an LP.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| direction | string | "both" | forward, backward, both |
| depth | number | 10 | Max traversal depth |

**Response:**

```json
{
  "root": {
    "id": "uuid",
    "lp_number": "LP-003",
    "product_name": "Cookies",
    "quantity": 500,
    "uom": "kg"
  },
  "parents": [
    {
      "lp_id": "uuid",
      "lp_number": "LP-001",
      "product_name": "Sugar",
      "quantity_used": 100,
      "operation_date": "2026-01-21T10:00:00Z"
    },
    {
      "lp_id": "uuid",
      "lp_number": "LP-002",
      "product_name": "Flour",
      "quantity_used": 50,
      "operation_date": "2026-01-21T10:00:00Z"
    }
  ],
  "children": []
}
```

## Traceability Reports

### Forward Trace Report

"Where did this raw material go?"

```typescript
const report = await generateForwardTraceReport(lpId);
// Returns all products that used this LP as input
```

### Backward Trace Report

"What materials were used to make this product?"

```typescript
const report = await generateBackwardTraceReport(lpId);
// Returns all raw materials that went into this LP
```

### Recall Impact Report

"Which products are affected by this batch?"

```typescript
const affectedProducts = await getRecallImpact(batchNumber);
// Returns all child LPs derived from any LP with this batch
```

## Best Practices

### 1. Always Create Genealogy on Output

```typescript
// Bad - output without genealogy
await createOutputLP(data);

// Good - output with genealogy
const output = await createOutputLP(data);
await createOutputGenealogy(woId, output.id, consumptions, userId);
```

### 2. Handle Missing Genealogy Gracefully

```typescript
if (genealogyInputs.length === 0) {
  warnings.push('No consumed materials for genealogy');
  // Still create output, just log warning
}
```

### 3. Preserve Genealogy on Reversal

```typescript
// Don't delete genealogy records
// Mark as reversed for audit trail
await supabase
  .from('lp_genealogy')
  .update({ is_reversed: true, ... })
  .eq('id', genealogyId);
```

### 4. Include Genealogy in Queries

```typescript
// When fetching LP details, include genealogy counts
const { data: lp } = await supabase
  .from('license_plates')
  .select(`
    *,
    parent_count:lp_genealogy!lp_genealogy_child_lp_id_fkey(count),
    child_count:lp_genealogy!lp_genealogy_parent_lp_id_fkey(count)
  `)
  .eq('id', lpId)
  .single();
```

## Performance Considerations

### Indexing

```sql
-- Critical for traversal performance
CREATE INDEX idx_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_genealogy_wo ON lp_genealogy(wo_id);
CREATE INDEX idx_genealogy_active ON lp_genealogy(org_id) WHERE is_reversed = false;
```

### Query Limits

```typescript
// Limit depth to prevent infinite loops
const maxDepth = 10;

// Paginate large genealogy trees
const pageSize = 100;
```

---

## Related Documentation

- [Output Registration API](../../api/production/output-registration.md)
- [LP Genealogy API](../../api/lp-genealogy-tracking.md)
- [Material Consumption API](../../api/production/material-consumption.md)
