# Scanner Work Order API Implementation Summary

## Created Files

### 1. GET /api/scanner/work-orders
**File:** `apps/frontend/app/api/scanner/work-orders/route.ts`

**Purpose:** Get Work Orders filtered by production line for scanner

**Query Parameters:**
- `line_id` (required) - Production line ID
- `status` (optional) - Comma-separated statuses (default: "released,in_progress")

**Response:**
```typescript
{
  success: boolean,
  data: Array<{
    id: string,
    wo_number: string,
    product: { id, code, name },
    planned_quantity: number,
    produced_quantity: number,
    uom: string,
    status: string,
    materials_status: 'complete' | 'partial' | 'none'
  }>
}
```

**Logic:**
- Queries work_orders table filtered by production_line_id and status
- Queries wo_materials to get all materials for each WO
- Queries wo_material_reservations to get reservation totals
- Calculates materials_status:
  - 'complete' = all materials have reserved_qty >= required_qty
  - 'partial' = some materials have reservations
  - 'none' = no materials reserved

---

### 2. POST /api/scanner/work-orders/[id]/scan-component
**File:** `apps/frontend/app/api/scanner/work-orders/[id]/scan-component/route.ts`

**Purpose:** Scan LP and reserve it to Work Order

**Request Body:**
```typescript
{
  barcode: string  // LP barcode
}
```

**Logic:**
1. Lookup LP by barcode (lp_number column)
2. Validate LP status is 'available'
3. Get LP's product_id
4. Query wo_materials to check if product_id exists in WO BOM
5. If no match: return error "Component not in BOM"
6. If match: Use MaterialReservationService.reserveMaterial()
   - Reserves ENTIRE LP quantity (current_qty or quantity)
   - Creates wo_material_reservations record
   - Updates LP status to 'reserved'
   - Creates lp_genealogy record for traceability
7. Return reservation details with LP and material info

**Response (Success):**
```typescript
{
  success: true,
  data: {
    reservation_id: string,
    lp: {
      id: string,
      barcode: string,
      product_code: string,
      product_name: string,
      quantity: number,
      uom: string,
      location_code: string
    },
    material: {
      id: string,
      product_code: string,
      required_qty: number,
      consumed_qty: number
    }
  }
}
```

**Error Scenarios:**
- LP not found (404)
- LP not available (400) - if status is not 'available'
- Component not in BOM (400) - if LP's product_id not in wo_materials
- Reservation errors (400) - delegated to MaterialReservationService

---

### 3. GET /api/scanner/work-orders/[id]/requirements
**File:** `apps/frontend/app/api/scanner/work-orders/[id]/requirements/route.ts`

**Purpose:** Get WO materials with reservation status

**Response:**
```typescript
{
  success: boolean,
  data: {
    wo: {
      id: string,
      wo_number: string,
      product_code: string,
      product_name: string,
      planned_quantity: number,
      uom: string
    },
    materials: Array<{
      id: string,
      product_id: string,
      product_code: string,
      product_name: string,
      required_qty: number,
      reserved_qty: number,  // Sum of reservations
      status: 'complete' | 'partial' | 'none'
    }>,
    reservations: Array<{
      id: string,
      lp_id: string,
      lp_barcode: string,
      product_code: string,
      quantity: number,
      uom: string,
      reserved_at: string
    }>
  }
}
```

**Logic:**
1. Get work_orders record with product details
2. Get wo_materials with product join
3. Get wo_material_reservations with LP and product joins
4. Calculate reserved_qty for each material (sum of reservations)
5. Calculate status for each material:
   - 'complete' if reserved_qty >= required_qty
   - 'partial' if reserved_qty > 0 but < required_qty
   - 'none' if reserved_qty = 0
6. Return structured response with WO info, materials with status, and all reservations

---

## Key Implementation Details

### Services Used
- **MaterialReservationService** - Used for creating reservations with full validation and atomic transactions
- **Supabase RLS** - All queries respect organization isolation via org_id

### Database Tables
- `work_orders` - WO data
- `wo_materials` - BOM snapshot for WO (uses organization_id column)
- `license_plates` - LP data with lp_number (barcode)
- `wo_material_reservations` - LP reservations to WO
- `lp_genealogy` - Traceability records (created by MaterialReservationService)

### Security
- All endpoints require authentication
- Organization isolation via org_id from JWT
- Role-based permissions enforced in MaterialReservationService
- Input validation on all parameters

### Error Handling
- Consistent error response format
- Descriptive error messages for scanner UI
- Proper HTTP status codes
- Logging of all errors to console

---

## Testing Recommendations

### Endpoint 1: GET /api/scanner/work-orders
```bash
GET /api/scanner/work-orders?line_id=<production-line-id>&status=released,in_progress
```

Test cases:
- Valid line_id with WOs
- Valid line_id with no WOs
- Missing line_id (should return 400)
- Different status filters
- WO with no materials (materials_status = 'none')
- WO with partial reservations
- WO with complete reservations

### Endpoint 2: POST /api/scanner/work-orders/[id]/scan-component
```bash
POST /api/scanner/work-orders/<wo-id>/scan-component
Body: { "barcode": "LP-..." }
```

Test cases:
- Valid LP that matches WO BOM
- LP not found (invalid barcode)
- LP with wrong product (not in BOM)
- LP already reserved
- LP with status != 'available'
- WO not in 'in_progress' status
- Multiple materials with same product_id

### Endpoint 3: GET /api/scanner/work-orders/[id]/requirements
```bash
GET /api/scanner/work-orders/<wo-id>/requirements
```

Test cases:
- WO with materials and reservations
- WO with materials but no reservations
- WO with no materials
- Invalid WO ID (should return 404)
- Materials with partial/complete reservations

---

## Notes

1. **Barcode Lookup:** Currently uses exact match on `lp_number` column. The LP table doesn't have a separate `barcode` column in the current schema.

2. **Reservation Quantity:** Scanner API reserves the ENTIRE LP quantity (as per requirements). The MaterialReservationService handles consume_whole_lp validation.

3. **Materials Status Calculation:** Efficiently calculated by fetching all materials and reservations in bulk queries, then computing status in-memory.

4. **Supabase Joins:** Code handles both single object and array results from Supabase FK joins using defensive coding patterns.

5. **Organization Isolation:** All endpoints check user's org_id and filter queries by organization_id/org_id columns.

6. **Transaction Handling:** The scan-component endpoint delegates to MaterialReservationService which handles atomic transactions (reservation + LP status update + genealogy creation).
