# ADR-009: Routing-Level Costs Implementation Guide

**ADR ID**: 009
**Title**: Implement Routing-Level Cost Tracking
**Status**: ACCEPTED
**Story**: 02.7 - Routings CRUD + Header Management
**Module**: Technical
**Implemented**: 2025-12-28

---

## Overview

ADR-009 defines routing-level cost tracking to capture the cost structure of production workflows. Costs are configured at the routing level and used to calculate total BOM costs per unit in Story 02.9 (BOM-Routing Costs).

**Problem Statement**:
Manufacturing facilities need to track how much each production routing costs to execute. Costs vary by:
- Fixed setup costs (machine calibration, material prep)
- Variable costs per unit produced
- Factory overhead allocation
- Currency/location-specific pricing

**Solution**:
Store four cost fields on the routings table and expose them through the API.

---

## Architecture

### Database Schema

The routings table includes 4 cost fields:

```sql
CREATE TABLE routings (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  is_reusable BOOLEAN DEFAULT TRUE,

  -- ADR-009: Cost fields
  setup_cost DECIMAL(10,2) NOT NULL DEFAULT 0
    CHECK (setup_cost >= 0),
  working_cost_per_unit DECIMAL(10,4) NOT NULL DEFAULT 0
    CHECK (working_cost_per_unit >= 0),
  overhead_percent DECIMAL(5,2) NOT NULL DEFAULT 0
    CHECK (overhead_percent >= 0 AND overhead_percent <= 100),
  currency TEXT NOT NULL DEFAULT 'PLN'
    CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP')),

  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by UUID
);
```

**Constraints**:
- All cost fields are non-negative
- overhead_percent: 0-100 range only
- currency: limited to PLN, EUR, USD, GBP
- All cost fields have sensible defaults (0)

**Indexes**:
```sql
CREATE INDEX idx_routings_costs
ON routings(org_id, currency);
```

---

## Field Specifications

### 1. setup_cost (DECIMAL 10,2)

**Type**: Fixed/One-time cost
**Unit**: Currency amount per routing execution
**Precision**: 2 decimal places

**Purpose**:
Captures fixed costs incurred every time the routing is executed, regardless of output quantity:
- Machine setup/calibration: 50 PLN
- Material prep/staging: 25 PLN
- Quality check overhead: 15 PLN
- **Total for routing run: 90 PLN**

**Example**:
```json
{
  "code": "RTG-BREAD-01",
  "setup_cost": 90.00,
  "currency": "PLN"
}
```

**Calculation**:
When producing 100 units with setup_cost=90:
```
Setup cost per unit = 90 / 100 = 0.90 per unit
```

### 2. working_cost_per_unit (DECIMAL 10,4)

**Type**: Variable/Incremental cost
**Unit**: Currency amount per unit produced
**Precision**: 4 decimal places (supports fractional costs)

**Purpose**:
Captures variable costs that scale with production quantity:
- Direct labor: 1.5000 PLN per unit
- Machine time: 0.7500 PLN per unit
- Utilities: 0.2500 PLN per unit
- **Total per unit: 2.5000 PLN**

**Example**:
```json
{
  "code": "RTG-BREAD-01",
  "working_cost_per_unit": 2.5000,
  "currency": "PLN"
}
```

**Calculation**:
For producing 100 units:
```
Total working cost = 2.5000 * 100 = 250.00 PLN
```

### 3. overhead_percent (DECIMAL 5,2)

**Type**: Overhead allocation
**Unit**: Percentage (0-100)
**Precision**: 2 decimal places

**Purpose**:
Allocates facility-wide overhead costs to this routing:
- Rent/facilities: 5%
- Quality department: 3%
- Maintenance: 4%
- Management/admin: 3%
- **Total overhead: 15%**

**Example**:
```json
{
  "code": "RTG-BREAD-01",
  "overhead_percent": 15.00,
  "currency": "PLN"
}
```

**Calculation**:
If material + labor + setup totals 350 PLN:
```
Overhead amount = 350 * (15 / 100) = 52.50 PLN
Total with overhead = 350 + 52.50 = 402.50 PLN
```

**Range**: 0-100 (validated at DB level with CHECK constraint)

### 4. currency (TEXT)

**Type**: Currency code (enum)
**Valid Values**: PLN, EUR, USD, GBP
**Default**: PLN

**Purpose**:
Specifies the currency for all cost amounts on this routing. Allows multi-currency organizations to track costs in their preferred currency.

**Example**:
```json
{
  "code": "RTG-BREAD-01",
  "currency": "EUR"
}
```

**Validation**:
```sql
CHECK (currency IN ('PLN', 'EUR', 'USD', 'GBP'))
```

---

## API Integration

### Create Routing with Costs

```typescript
// POST /api/v1/technical/routings
const response = await fetch('/api/v1/technical/routings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'RTG-BREAD-01',
    name: 'Standard Bread Line',
    setup_cost: 90.00,
    working_cost_per_unit: 2.5000,
    overhead_percent: 15.00,
    currency: 'PLN'
  })
})

const { routing } = await response.json()
console.log(routing.setup_cost)  // 90.00
console.log(routing.currency)     // PLN
```

### Update Costs

```typescript
// PUT /api/v1/technical/routings/:id
const response = await fetch(`/api/v1/technical/routings/${routingId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    setup_cost: 100.00,          // Changed
    overhead_percent: 20.00       // Changed
    // currency: 'EUR'            // NOT allowed - immutable
  })
})

// Version auto-increments due to cost changes
const { routing } = await response.json()
console.log(routing.version)      // Incremented (e.g., 2 -> 3)
```

### Validation Schema

```typescript
import { z } from 'zod'

const createRoutingSchema = z.object({
  code: z.string().min(2).max(50),
  name: z.string().min(1).max(100),

  // ADR-009 Cost fields
  setup_cost: z
    .number()
    .min(0, 'Setup cost cannot be negative')
    .default(0),

  working_cost_per_unit: z
    .number()
    .min(0, 'Working cost per unit cannot be negative')
    .default(0),

  overhead_percent: z
    .number()
    .min(0, 'Overhead cannot be negative')
    .max(100, 'Overhead cannot exceed 100%')
    .default(0),

  currency: z
    .enum(['PLN', 'EUR', 'USD', 'GBP'])
    .default('PLN')
})
```

---

## Version Control Integration

Cost field changes trigger automatic version increments via database trigger:

```sql
CREATE OR REPLACE FUNCTION increment_routing_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.setup_cost IS DISTINCT FROM NEW.setup_cost
     OR OLD.working_cost_per_unit IS DISTINCT FROM NEW.working_cost_per_unit
     OR OLD.overhead_percent IS DISTINCT FROM NEW.overhead_percent
     OR OLD.currency IS DISTINCT FROM NEW.currency
  THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_routing_version_increment
BEFORE UPDATE ON routings
FOR EACH ROW
EXECUTE FUNCTION increment_routing_version();
```

**Behavior**:
- Version increments when ANY cost field changes
- Provides audit trail of cost modifications
- Used by Story 02.9 to track BOM cost history

---

## Cost Calculation Examples

### Example 1: Simple BOM with Single Routing

**BOM**: 100 units of Product X
**Routing**: RTG-BREAD-01

```json
{
  "code": "RTG-BREAD-01",
  "setup_cost": 90.00,
  "working_cost_per_unit": 2.50,
  "overhead_percent": 15.00,
  "currency": "PLN"
}
```

**Cost Calculation**:
```
1. Material cost per unit:        5.00 PLN
2. Routing working cost per unit: 2.50 PLN
3. Subtotal per unit:             7.50 PLN
4. Subtotal for 100 units:        750.00 PLN

5. Setup cost (one-time):         90.00 PLN
6. Total before overhead:         840.00 PLN

7. Overhead (15% of 840):         126.00 PLN
8. TOTAL COST FOR RUN:            966.00 PLN

Cost per unit = 966.00 / 100 = 9.66 PLN
```

### Example 2: Multi-Step Routing with Labor

**BOM**: 500 units of Product Y
**Routing**: RTG-CAKE-02

```json
{
  "code": "RTG-CAKE-02",
  "setup_cost": 150.00,         // Equipment setup + QC
  "working_cost_per_unit": 1.7500, // 0.5h @ 350/h labor
  "overhead_percent": 20.00,     // Higher overhead allocation
  "currency": "PLN"
}
```

**Cost Calculation**:
```
1. Material cost per unit:        8.00 PLN
2. Routing working cost per unit: 1.75 PLN
3. Subtotal per unit:             9.75 PLN
4. Subtotal for 500 units:        4,875.00 PLN

5. Setup cost (one-time):         150.00 PLN
6. Total before overhead:         5,025.00 PLN

7. Overhead (20% of 5,025):       1,005.00 PLN
8. TOTAL COST FOR RUN:            6,030.00 PLN

Cost per unit = 6,030.00 / 500 = 12.06 PLN
```

---

## Multi-Currency Scenarios

### Currency Consistency

All costs for a single routing must use the same currency:

```typescript
// VALID - all PLN
{
  code: 'RTG-POLAND-01',
  setup_cost: 100.00,
  working_cost_per_unit: 2.50,
  currency: 'PLN'  // ✅ Consistent
}

// VALID - all EUR
{
  code: 'RTG-GERMANY-01',
  setup_cost: 25.00,
  working_cost_per_unit: 0.60,
  currency: 'EUR'  // ✅ Consistent
}

// INVALID - mixed currencies
{
  code: 'RTG-MIXED-01',
  setup_cost: 100.00,        // Assumes PLN
  working_cost_per_unit: 2.50,
  currency: 'EUR'             // ❌ Conflict
}
```

**Rule**: A routing's currency applies to ALL cost fields on that routing. If you need multi-currency, create separate routings per currency.

### Currency Conversion (Story 02.9 Future)

In future versions, BOM costing may convert routing costs to BOM's preferred currency:

```typescript
// Pseudo-code for future implementation
function convertRoutingCost(
  routingCost: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) return routingCost
  return routingCost * exchangeRate
}
```

---

## Best Practices

### 1. Consistent Cost Structure

Establish organization-wide cost allocation rules:

```typescript
// Example: Standard allocation for manufacturing
const COST_STRUCTURE = {
  setup_cost: {
    description: 'Machine setup + QC prep',
    typical_range: '50-150'  // PLN
  },
  working_cost_per_unit: {
    description: 'Direct labor + utilities + supplies',
    typical_range: '1.00-5.00'  // PLN per unit
  },
  overhead_percent: {
    description: 'Facility + management overhead',
    typical_range: '10-25'  // Percent
  }
}
```

### 2. Regular Cost Reviews

Cost fields should be reviewed and updated quarterly:

```typescript
// Track cost history via version numbers
async function getCostHistory(routingId: string) {
  // Version 1: setup_cost = 80.00 (created)
  // Version 2: setup_cost = 90.00 (updated)
  // Version 3: overhead_percent = 20.00 (updated)

  // Users can see what changed and when
  return routingVersions
}
```

### 3. Validate Against Labor Rates

Ensure working_cost_per_unit aligns with actual labor costs:

```typescript
// Example validation
function validateWorkingCost(
  workingCostPerUnit: number,
  estimatedHours: number,
  laborRatePerHour: number
): boolean {
  const expectedCost = estimatedHours * laborRatePerHour
  const tolerance = 0.10  // 10% tolerance

  return Math.abs(workingCostPerUnit - expectedCost)
    <= (expectedCost * tolerance)
}
```

### 4. Document Cost Basis

Add cost justification in description field:

```typescript
{
  code: 'RTG-BREAD-01',
  name: 'Standard Bread Line',
  description: `
    Setup: 90 PLN (1h setup @ 90/h)
    Working: 2.50 PLN/unit (0.5h @ 350/h labor + supplies)
    Overhead: 15% (facility + QC + maintenance)
    Updated: Dec 2025 (seasonal rate increase)
  `,
  setup_cost: 90.00,
  working_cost_per_unit: 2.50,
  overhead_percent: 15.00,
  currency: 'PLN'
}
```

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('ADR-009: Routing Cost Validation', () => {
  it('should accept valid cost configuration', () => {
    const schema = createRoutingSchema
    const result = schema.safeParse({
      code: 'RTG-TEST-01',
      name: 'Test Routing',
      setup_cost: 100.00,
      working_cost_per_unit: 2.50,
      overhead_percent: 15.00,
      currency: 'PLN'
    })
    expect(result.success).toBe(true)
  })

  it('should reject negative setup cost', () => {
    const result = schema.safeParse({
      code: 'RTG-TEST-01',
      name: 'Test Routing',
      setup_cost: -50.00  // ❌ Invalid
    })
    expect(result.success).toBe(false)
  })

  it('should reject overhead > 100%', () => {
    const result = schema.safeParse({
      code: 'RTG-TEST-01',
      name: 'Test Routing',
      overhead_percent: 120.00  // ❌ Invalid
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid currency', () => {
    const result = schema.safeParse({
      code: 'RTG-TEST-01',
      name: 'Test Routing',
      currency: 'JPY'  // ❌ Not in enum
    })
    expect(result.success).toBe(false)
  })

  it('should use sensible defaults', () => {
    const result = schema.safeParse({
      code: 'RTG-TEST-01',
      name: 'Test Routing'
      // No cost fields provided
    })
    expect(result.data.setup_cost).toBe(0)
    expect(result.data.working_cost_per_unit).toBe(0)
    expect(result.data.overhead_percent).toBe(0)
    expect(result.data.currency).toBe('PLN')
  })
})
```

### Database Tests

```sql
-- Test: Check constraint on setup_cost
BEGIN;
INSERT INTO routings (org_id, code, name, setup_cost)
VALUES ('org-123', 'TEST-01', 'Test', -50);
-- Expected: CONSTRAINT violation
ROLLBACK;

-- Test: Check constraint on overhead_percent
BEGIN;
INSERT INTO routings (org_id, code, name, overhead_percent)
VALUES ('org-123', 'TEST-01', 'Test', 150);
-- Expected: CONSTRAINT violation
ROLLBACK;

-- Test: Currency enum validation
BEGIN;
INSERT INTO routings (org_id, code, name, currency)
VALUES ('org-123', 'TEST-01', 'Test', 'JPY');
-- Expected: CONSTRAINT violation
ROLLBACK;

-- Test: Version increment on cost change
UPDATE routings SET setup_cost = 100 WHERE id = 'routing-123';
-- Expected: version incremented
SELECT version FROM routings WHERE id = 'routing-123';
```

---

## Migration Path

### Phase 1 (Current): Foundation
- Cost fields added to routings table
- Validation at DB and API levels
- Version control triggers cost changes
- **Status**: Complete in Story 02.7

### Phase 2: BOM Costing (Story 02.9)
- Use routing costs to calculate BOM unit cost
- Display cost breakdown in BOM detail view
- Track cost history via version history

### Phase 3: Cost Analytics (Future)
- Cost trend analysis per routing
- Profitability analysis per product
- Labor rate variance reporting

---

## Related Documentation

- **[API Documentation: Routings CRUD](../3-ARCHITECTURE/api/technical/routings-crud.md)**
- **[Story 02.7: Routings CRUD](../../2-MANAGEMENT/epics/current/02-technical/context/02.7/)**
- **[Story 02.9: BOM-Routing Costs](../../2-MANAGEMENT/epics/current/02-technical/context/02.9/)**
- **[Database Schema: Routings](../3-ARCHITECTURE/database/routings-schema.md)**

---

## FAQ

**Q: Why 4 decimal places for working_cost_per_unit but only 2 for setup_cost?**
A: Setup cost is typically larger and doesn't need fractional precision. Working cost is per-unit and benefits from finer granularity for accurate total cost calculation.

**Q: Can I change currency after creating a routing?**
A: Yes, via PUT endpoint. Currency changes trigger version increment.

**Q: What happens if I clone a routing?**
A: All cost fields are copied to the new routing. Operations are also cloned.

**Q: How are costs used in multi-BOM scenarios?**
A: Each BOM can assign any routing. If 3 BOMs use RTG-BREAD-01, they all use the same cost values (but each BOM has its own effective_from version).

**Q: Can overhead exceed 100%?**
A: No, database CHECK constraint prevents it. Maximum is 100%.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-28
**Author**: TECH-WRITER Agent
