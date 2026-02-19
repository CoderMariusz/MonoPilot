# By-Product Registration Guide

## Overview

By-product registration tracks secondary outputs generated during production. When manufacturing a primary product, you often generate by-products (e.g., wheat bran when producing flour). This feature calculates expected by-product quantities from BOM yield percentages, creates proper License Plate (LP) records with genealogy linkage, and tracks registration progress.

## Key Features

- **Expected Quantity Calculation**: Auto-calculates expected by-product qty from BOM yield percentage
- **Auto-Create Mode**: Automatically creates by-product LPs when main output is registered
- **Manual Registration**: Allows operators to enter actual quantities when auto-create is disabled
- **Genealogy Linkage**: By-product LPs share the same parent materials as the main output
- **Zero Quantity Handling**: Warning confirmation when registering zero quantity
- **Progress Tracking**: Visual progress bars showing actual vs expected quantities

## Expected Quantity Calculation

The expected by-product quantity is calculated using the formula:

```
Expected Qty = WO.planned_qty * yield_percent / 100
```

### Examples

| WO Planned Qty | Yield % | Expected By-Product Qty |
|----------------|---------|-------------------------|
| 1000 kg | 5% | 50 kg |
| 5000 kg | 2.5% | 125 kg |
| 2000 kg | 10% | 200 kg |

The calculation is performed in `by-product-service.ts`:

```typescript
export function calculateExpectedByProductQty(
  plannedQty: number,
  yieldPercent: number
): number {
  return (plannedQty * yieldPercent) / 100
}
```

## Registration Workflows

### Auto-Create Workflow

When `auto_create_by_product_lp` setting is enabled:

1. Operator registers main output
2. System automatically creates by-product LPs with expected quantities
3. All by-product LPs created in same transaction
4. Success toast shows count of created LPs

### Manual Registration Workflow

When `auto_create_by_product_lp` setting is disabled:

1. Operator registers main output
2. By-Product Registration dialog opens sequentially for each by-product
3. Quantity pre-filled with expected value (editable)
4. Operator confirms or adjusts quantity
5. LP created with entered quantity

## Batch Number Generation

By-product batch numbers follow the format:

```
{main_batch}-BP-{product_code}
```

### Examples

| Main Batch | Product Code | By-Product Batch |
|------------|--------------|------------------|
| B-2025-0156 | BRAN | B-2025-0156-BP-BRAN |
| WO-0042 | GERM | WO-0042-BP-GERM |

Maximum batch number length: 50 characters (truncated if exceeded).

## Genealogy Linkage

By-product LPs inherit the same genealogy as the main output LP:

```
Parent Materials (Consumed)
        |
        v
+-------+-------+
|               |
Main Output     By-Product
LP              LP
```

Both the main output and by-product LPs have the same `parent_lp_ids` in the genealogy table, enabling full traceability.

## Zero Quantity Handling

When registering a by-product with qty = 0:

1. Warning dialog displays: "By-product quantity is 0. Continue?"
2. Three options:
   - **Confirm Anyway**: Creates LP with qty = 0
   - **Skip By-Product**: Skips this by-product, no LP created
   - **Cancel**: Returns to form for correction

## API Reference

### GET /api/production/work-orders/{id}/by-products

Returns all by-products for a work order with status and progress.

**Response:**
```json
{
  "data": [
    {
      "product_id": "uuid",
      "product_name": "Wheat Bran",
      "product_code": "SKU-BP-BRAN",
      "material_id": "uuid",
      "yield_percent": 5,
      "expected_qty": 50,
      "actual_qty": 45,
      "uom": "kg",
      "lp_count": 2,
      "status": "registered",
      "last_registered_at": "2026-01-21T15:30:00Z"
    }
  ]
}
```

### POST /api/production/work-orders/{id}/by-products

Registers a by-product output.

**Request:**
```json
{
  "by_product_id": "uuid (wo_materials.id)",
  "qty": 45,
  "qa_status": "pending",
  "location_id": "uuid",
  "notes": "Optional notes",
  "main_output_id": "uuid",
  "main_output_lp_id": "uuid",
  "confirm_zero_qty": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "output": {
      "id": "uuid",
      "lpId": "uuid",
      "lpNumber": "BP-WO-0042-ABC123",
      "quantity": 45
    },
    "genealogyRecords": 2,
    "warnings": []
  }
}
```

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| 400 | "qty cannot be negative" | Negative quantity provided |
| 400 | "Material is not a by-product" | Material not marked as by-product |
| 400 | "Work order is not in progress" | WO status is not in_progress |
| 404 | "Work order not found" | WO does not exist or belongs to different org |
| 409 | "Zero quantity requires confirmation" | qty=0 without confirm_zero_qty=true |

## Components

### ByProductsSection

Displays by-products status on the output registration page.

**Location:** `components/production/outputs/ByProductsSection.tsx`

**Features:**
- Auto-create info banner
- By-product list with expected/actual quantities
- Progress bars (color-coded: red < 50%, yellow 50-99%, green >= 100%)
- Register Now / Add More / View LPs actions

**Props:**
```typescript
interface ByProductsSectionProps {
  woId: string
  autoCreateEnabled: boolean
  byProducts: ByProduct[]
  onRegister: (byProduct: ByProduct) => void
  onRegisterAll: () => void
  onViewLPs?: (byProductId: string) => void
  isLoading: boolean
}
```

### ByProductRegistrationDialog

Modal for manual by-product registration.

**Location:** `components/production/ByProductRegistrationDialog.tsx`

**Features:**
- Sequential dialog for multiple by-products
- Quantity pre-filled with expected value
- QA status selection (if required)
- Notes field
- Skip This / Skip All options
- Progress indicator

### ByProductPromptStep (Scanner)

Scanner workflow step for by-product registration.

**Location:** `components/scanner/output/ByProductPromptStep.tsx`

**Features:**
- Touch-friendly interface
- Expected quantity display with yield percentage
- Number pad for quantity entry
- Zero quantity warning dialog
- Yes/Skip/Skip All options

## Database Schema

### production_outputs Table Extensions

```sql
ALTER TABLE production_outputs
  ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_output_id UUID REFERENCES production_outputs(id),
  ADD COLUMN IF NOT EXISTS by_product_material_id UUID REFERENCES wo_materials(id);

CREATE INDEX IF NOT EXISTS idx_production_outputs_by_product
  ON production_outputs(wo_id, is_by_product);
```

### license_plates Table Extensions

```sql
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_license_plates_by_product
  ON license_plates(wo_id, is_by_product)
  WHERE is_by_product = true;
```

## Business Rules

1. **By-products defined in BOM**: Must be marked with `is_by_product = true` and have `yield_percent` set
2. **Auto-create transaction**: All by-product LPs created in same transaction as main output
3. **Expiry date**: Calculated as `today + product.shelf_life_days`
4. **Location**: Uses product default location or production line default
5. **Cross-tenant security**: Returns 404 (not 403) for cross-tenant access attempts

## Validation Rules

| Field | Rule |
|-------|------|
| quantity | >= 0 (allows zero with confirmation) |
| batch_number | Max 50 characters |
| notes | Max 500 characters |
| uom | Required, non-empty |
| location_id | Valid UUID |

## Related Stories

- **04.7a**: Output Registration Desktop - Main output registration
- **04.7b**: Output Registration Scanner - Mobile output registration
- **04.7d**: Multiple Outputs per WO - Support for multiple output batches
- **05.5**: LP Genealogy - Parent-child LP tracking
