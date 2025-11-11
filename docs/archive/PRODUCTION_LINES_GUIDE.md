# Production Lines Guide

## Overview

Production Lines are a core concept in the MonoPilot MES system that enable line-specific materials, routing, and work order management. This guide explains how production lines integrate with BOMs, work orders, and materials.

## Table of Contents

- [Concept](#concept)
- [Database Structure](#database-structure)
- [Line-Specific Materials](#line-specific-materials)
- [BOM Line Compatibility](#bom-line-compatibility)
- [Work Order Line Assignment](#work-order-line-assignment)
- [Common Scenarios](#common-scenarios)
- [Best Practices](#best-practices)

---

## Concept

Production lines represent physical manufacturing lines in a facility (e.g., Line 4, Line 5). Each line may require different materials or configurations for the same product.

### Key Features:

- **Line-Specific Materials**: Different materials can be used on different lines (e.g., Box 12 for Line 4, Box 34 for Line 5)
- **BOM Line Restrictions**: BOMs can be restricted to specific production lines
- **WO Line Assignment**: Work orders are assigned to a specific line, which filters available materials
- **Line Compatibility Validation**: System ensures WO line is compatible with BOM

---

## Database Structure

### production_lines Table

```sql
CREATE TABLE production_lines (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,       -- e.g., 'LINE-4', 'LINE-5'
  name VARCHAR(200) NOT NULL,             -- e.g., 'Production Line 4'
  status VARCHAR(20) DEFAULT 'active',    -- 'active' | 'inactive'
  warehouse_id INTEGER REFERENCES warehouses(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Line References in Other Tables

- **boms.line_id**: INTEGER[] - Array of production line IDs (NULL = all lines)
- **bom_items.line_id**: INTEGER[] - Line-specific materials (NULL = all lines from parent BOM)
- **work_orders.line_id**: INTEGER NOT NULL - Production line where WO will be executed

---

## Line-Specific Materials

### Problem Solved

Different production lines may require different materials for the same product. Example:

- **Product**: Chicken Curry Finished Good
- **Line 4**: Uses Box 12 (small box)
- **Line 5**: Uses Box 34 (large box)

### Implementation

#### BOM Level Line Restrictions

```sql
-- BOM restricted to Line 4 and Line 5 only
INSERT INTO boms (product_id, version, status, line_id)
VALUES (100, '1.0', 'active', ARRAY[4, 5]);
```

#### BOM Item Line Restrictions

```sql
-- All items use chicken base (no line restriction)
INSERT INTO bom_items (bom_id, material_id, quantity, uom, line_id)
VALUES (1, 200, 10.0, 'KG', NULL);  -- Available on all BOM lines

-- Box 12 only for Line 4
INSERT INTO bom_items (bom_id, material_id, quantity, uom, line_id)
VALUES (1, 301, 1.0, 'EACH', ARRAY[4]);

-- Box 34 only for Line 5
INSERT INTO bom_items (bom_id, material_id, quantity, uom, line_id)
VALUES (1, 302, 1.0, 'EACH', ARRAY[5]);
```

### Snapshot Behavior

When a work order is created:

1. User selects product → Available BOMs loaded
2. User selects BOM → Line selection filtered to BOM-compatible lines
3. User selects line (e.g., Line 4)
4. On WO release → `create_wo_bom_snapshot(wo_id, bom_id, line_id)` called
5. Snapshot function filters BOM items:
   - Items with `line_id = NULL` → included
   - Items with `line_id` containing WO line → included
   - Other items → excluded

**Result**: WO for Line 4 gets Chicken Base + Box 12 (not Box 34)

---

## BOM Line Compatibility

### Rules

1. **NULL line_id on BOM** → Available on all production lines
2. **Array of lines on BOM** → Only those lines can use this BOM
3. **BOM Item line_id** must be subset of BOM line_id (or NULL)

### Validation

The system enforces compatibility at multiple levels:

#### Database Trigger

```sql
-- In create_wo_bom_snapshot function
IF v_bom.line_id IS NOT NULL AND NOT (p_line_id = ANY(v_bom.line_id)) THEN
  RAISE EXCEPTION 'Line % not allowed for BOM %. Allowed lines: %', 
    p_line_id, p_bom_id, array_to_string(v_bom.line_id, ', ');
END IF;
```

#### UI Validation

CreateWorkOrderModal filters available lines:

```typescript
const calculateAvailableLines = () => {
  const selectedBom = availableBoms.find(b => b.id === Number(formData.bom_id));
  
  // If BOM has line restrictions, only show those lines
  if (selectedBom && selectedBom.line_id && selectedBom.line_id.length > 0) {
    return productionLines.filter(line => selectedBom.line_id!.includes(line.id));
  }
  
  // Otherwise, show all active production lines
  return productionLines;
};
```

---

## Work Order Line Assignment

### Assignment Process

1. **WO Creation**:
   - User selects product
   - System loads active/draft BOMs
   - UI displays BOM versions with line info: `v1.2 - active (Lines: 4, 5)`

2. **Line Selection**:
   - If BOM has line restrictions → only those lines shown
   - If BOM has no restrictions → all active lines shown
   - Line selection is **required**

3. **Snapshot**:
   - WO status changes from 'draft' to 'released'
   - `create_wo_bom_snapshot(wo_id, bom_id, line_id)` called
   - BOM items filtered by line_id
   - Materials copied to `wo_materials` table

### Immutability

Once a WO is released:
- Line cannot be changed
- BOM snapshot is frozen
- Materials are fixed

---

## Common Scenarios

### Scenario 1: Single-Line Product

**Setup**:
- Product: Simple Widget
- BOM: NULL line_id (all lines)
- No line-specific materials

**Behavior**:
- WO can be created on any line
- All materials used regardless of line
- Most flexible configuration

### Scenario 2: Multi-Line Product with Shared Materials

**Setup**:
- Product: Chicken Curry
- BOM: line_id = [4, 5]
- All materials: line_id = NULL

**Behavior**:
- WO can only be created on Line 4 or Line 5
- Same materials used on both lines
- Line restriction for operational reasons

### Scenario 3: Multi-Line Product with Line-Specific Materials

**Setup**:
- Product: Chicken Curry
- BOM: line_id = [4, 5]
- Chicken Base: line_id = NULL (shared)
- Box 12: line_id = [4]
- Box 34: line_id = [5]

**Behavior**:
- WO on Line 4 → gets Chicken Base + Box 12
- WO on Line 5 → gets Chicken Base + Box 34
- Optimal: different box sizes for different lines

### Scenario 4: Single-Line Dedicated Product

**Setup**:
- Product: Special Item
- BOM: line_id = [6]
- All materials: line_id = [6]

**Behavior**:
- WO can only be created on Line 6
- Materials enforced as Line 6 only
- Most restrictive: dedicated product line

---

## Best Practices

### 1. BOM Design

✅ **DO:**
- Use NULL line_id for products that can run on any line
- Use line_id array when product is restricted to specific lines
- Use item-level line_id only when materials differ by line

❌ **DON'T:**
- Create duplicate BOMs for each line (use line-specific items instead)
- Set line_id on items if they're the same across all lines
- Leave line_id NULL on BOM if product is actually line-restricted

### 2. Material Management

✅ **DO:**
- Group shared materials with NULL line_id
- Clearly name line-specific materials (e.g., "Box 12 - Line 4")
- Document why materials differ by line (size, supplier, etc.)

❌ **DON'T:**
- Create separate BOMs for every line combination
- Use line-specific items when not needed
- Mix units of measure without clear purpose

### 3. Work Order Planning

✅ **DO:**
- Validate line capacity before creating WO
- Consider line changeover time when scheduling
- Use BOM line restrictions to guide scheduling

❌ **DON'T:**
- Create WOs on incompatible lines
- Change line after WO is released
- Override snapshot materials

### 4. Testing

✅ **DO:**
- Test snapshot creation for each line combination
- Verify correct materials are filtered
- Validate line compatibility checks

❌ **DON'T:**
- Assume line filtering works without testing
- Skip validation for edge cases
- Ignore line_id NULL vs empty array differences

---

## API Reference

### ProductionLinesAPI

```typescript
// Get all active production lines
const lines = await ProductionLinesAPI.getActive();

// Get lines by warehouse
const warehouseLines = await ProductionLinesAPI.getByWarehouse(warehouseId);

// Validate BOM line compatibility
const isCompatible = await ProductionLinesAPI.validateLineCompatibility(bomId, lineId);
```

### create_wo_bom_snapshot

```sql
-- Create snapshot with line filtering
SELECT create_wo_bom_snapshot(
  p_wo_id := 123,
  p_bom_id := 456,
  p_line_id := 4
);
-- Returns: JSONB with snapshot metadata
```

---

## Migration Notes

### From line_number to line_id

**Old Schema**:
```sql
work_orders.line_number VARCHAR  -- Free text field
```

**New Schema**:
```sql
work_orders.line_id INTEGER NOT NULL REFERENCES production_lines(id)
```

**Migration Path**:
1. Create `production_lines` table
2. Seed with existing line codes
3. Add `line_id` to `work_orders` (nullable initially)
4. Backfill existing WOs with default line
5. Make `line_id` NOT NULL
6. Drop `line_number` column

---

## Troubleshooting

### Issue: "Line not allowed for BOM"

**Cause**: Trying to create WO on a line that's not in BOM's line_id array

**Solution**: 
1. Check BOM.line_id in database
2. Either select a compatible line OR
3. Update BOM to include the desired line

### Issue: WO missing expected materials

**Cause**: Materials were line-specific and WO line didn't match

**Solution**:
1. Check bom_items.line_id for the material
2. Verify WO line_id matches one of the material's lines
3. Update BOM item line_id if incorrect

### Issue: Can't change WO line after release

**Cause**: Line is immutable after snapshot creation

**Solution**:
1. Cancel the WO
2. Create a new WO with correct line
3. This is by design for traceability

---

## Related Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Full schema reference
- [API_REFERENCE.md](./API_REFERENCE.md) - API endpoints
- [BUSINESS_FLOWS.md](./BUSINESS_FLOWS.md) - Work order flows
- [BOM_HISTORY.md](./BOM_HISTORY.md) - BOM versioning

---

**Last Updated**: 2025-01-04
**Version**: 1.0

