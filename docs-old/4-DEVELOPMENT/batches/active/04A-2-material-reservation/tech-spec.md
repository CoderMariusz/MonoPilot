# Batch 04A-2: Material Reservation - Tech Spec

**Stories:** 4.7-4.8
**Effort:** 8-10 hours
**Dependencies:** Batch 04A-1, Epic 5 (License Plates)

---

## Database Tables

### New Tables

```sql
-- Material Consumption Records
CREATE TABLE wo_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  material_id UUID NOT NULL REFERENCES wo_materials(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  qty DECIMAL(15,4) NOT NULL,
  uom_id UUID NOT NULL REFERENCES units_of_measure(id),
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consumed_by_user_id UUID NOT NULL REFERENCES users(id),
  reversed BOOLEAN DEFAULT false,
  reversed_at TIMESTAMPTZ,
  reversed_by_user_id UUID REFERENCES users(id),
  notes TEXT,
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- LP Genealogy (consumption → output linkage)
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
  child_lp_id UUID REFERENCES license_plates(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  consumed_qty DECIMAL(15,4) NOT NULL,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Columns to Add

```sql
-- wo_materials additions
ALTER TABLE wo_materials ADD COLUMN IF NOT EXISTS consumed_qty DECIMAL(15,4) DEFAULT 0;
ALTER TABLE wo_materials ADD COLUMN IF NOT EXISTS consume_whole_lp BOOLEAN DEFAULT false;
```

---

## API Endpoints

| Method | Endpoint | Story | Description |
|--------|----------|-------|-------------|
| GET | `/api/production/work-orders/:id/materials` | 4.7 | Get materials with consumption status |
| POST | `/api/production/work-orders/:id/consume` | 4.7, 4.8 | Consume material from LP |
| GET | `/api/production/work-orders/:id/consumption` | 4.7 | Get consumption history |

---

## Frontend Routes

| Route | Component | Story |
|-------|-----------|-------|
| `/production/work-orders/:id/consume` | MaterialConsumptionDesktop | 4.7 |
| `/scanner/consume` | ScannerConsumption | 4.8 |

---

## Services

### consumption-service.ts
- `getMaterials(woId)` - Materials with required/consumed qty
- `consumeMaterial(woId, materialId, lpId, qty, userId)` - Record consumption
- `validateLP(lpId, productId, uomId, requiredQty)` - Validate LP matches material
- `getConsumptionHistory(woId)` - All consumptions for WO

---

## Scanner PWA Components

### ScannerConsumption
1. Scan WO barcode → show required materials
2. Scan LP barcode → validate LP
3. Enter qty or "Full LP"
4. Confirm → consumption recorded
5. Auto-advance to next material

### Validation Flow
```
LP Scanned → Check:
  - LP exists and available
  - Product matches material
  - UoM matches
  - Qty available >= requested
```

---

## Genealogy Creation

On consumption:
```sql
INSERT INTO lp_genealogy (parent_lp_id, wo_id, consumed_qty, consumed_at, org_id)
VALUES ($lp_id, $wo_id, $qty, now(), $org_id);
-- child_lp_id remains NULL until output registered
```

---

## RLS Policies

```sql
ALTER TABLE wo_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;

-- Standard authenticated policies for both tables
```
