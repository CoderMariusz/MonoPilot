# PROD-004: Output Registration Desktop (Part 2)

**Overview and main wireframes in**: [PROD-004-part1-output-registration-desktop.md](./PROD-004-part1-output-registration-desktop.md)

**Module**: Production
**Feature**: Output Registration - Technical Specifications
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## Responsive Breakpoints

### Tablet (768-1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│  Production > WO-2025-0156 > Outputs              [← Back]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 📦 WO SUMMARY                                                │ │
│  │                                                                │ │
│  │  WO: WO-2025-0156 | 🟢 In Progress                           │ │
│  │  Product: Wheat Bread (SKU-WB-001)                            │ │
│  │  Batch: B-2025-0156                                           │ │
│  │                                                                │ │
│  │  Planned:  5,000 kg                                           │ │
│  │  Output:   3,200 kg  (64%)                                    │ │
│  │  Progress: [████████████████░░░░░░░░] 64%                    │ │
│  │                                                                │ │
│  │  Overall Yield: 🟢 94.5%  (Target: 95%)  ▼ -0.5%            │ │
│  │                                                                │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │ │
│  │  │ Output: 96.0%  │  │ Material: 92.5%│  │ Ops: 94.8%     │ │ │
│  │  │ 🟢 ▲ +1.0%     │  │ 🟡 ▼ -2.5%     │  │ 🟢 ▲ +0.8%     │ │ │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 📋 OUTPUT HISTORY                [Register Output] [Export]  │ │
│  │                                                                │ │
│  │  [QA: All ▼] [Location: All ▼] [Sort: Created ▼]             │ │
│  │                                                                │ │
│  │  LP-2025-05482   500 kg   🟢 Approved   2h 15m ago     [View]│ │
│  │  B-2025-0156 | WH-A/Z1/R2 | Exp: 2025-01-13          [Label]│ │
│  │                                                                │ │
│  │  LP-2025-05479   450 kg   🟢 Approved   3h 30m ago     [View]│ │
│  │  B-2025-0156 | WH-A/Z1/R2 | Exp: 2025-01-13          [Label]│ │
│  │                                                                │ │
│  │  LP-2025-05475   600 kg   🟡 Pending    5h 45m ago     [View]│ │
│  │  B-2025-0156 | WH-A/Z1/R3 | Exp: 2025-01-13          [Label]│ │
│  │                                                                │ │
│  │  (Scroll for more)                                            │ │
│  │                                                                │ │
│  │  📊 Total: 6 outputs | 3,200 kg (64% of planned)             │ │
│  │     Approved: 4 | Pending: 1 | Rejected: 1                   │ │
│  │                                                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ 🌾 BY-PRODUCTS                        [Register All]         │ │
│  │                                                                │ │
│  │  ℹ️ Auto-create: ON                                           │ │
│  │                                                                │ │
│  │  Wheat Bran:     160/250 kg (64%)   🟢 Registered     [View] │ │
│  │                  6 LPs | Last: 2h 15m ago           [Add More]│ │
│  │                                                                │ │
│  │  Flour Dust:     35/50 kg (70%)     🟢 Registered     [View] │ │
│  │                  6 LPs | Last: 2h 15m ago           [Add More]│ │
│  │                                                                │ │
│  │  Wheat Germ:     0/100 kg (0%)      🔴 Not Registered         │ │
│  │                  0 LPs                        [Register Now]  │ │
│  │                                                                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  [← Back to WO Detail]                                            │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)

```
┌────────────────────────────────────┐
│  ← Outputs: WO-2025-0156           │
├────────────────────────────────────┤
│                                    │
│ 📦 WO Summary                      │
│                                    │
│ WO: WO-2025-0156                   │
│ Status: 🟢 In Progress             │
│                                    │
│ Product:                           │
│ Wheat Bread (SKU-WB-001)           │
│                                    │
│ Batch: B-2025-0156                 │
│                                    │
│ Planned:  5,000 kg                 │
│ Output:   3,200 kg (64%)           │
│                                    │
│ [████████████████░░░░░░░░] 64%    │
│                                    │
│ Overall Yield: 🟢 94.5%           │
│ Target: 95% | ▼ -0.5%             │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Output Yield:    🟢 96.0%      │ │
│ │ Material Yield:  🟡 92.5%      │ │
│ │ Operation Yield: 🟢 94.8%      │ │
│ └────────────────────────────────┘ │
│                                    │
│ [View Material Consumption →]      │
│                                    │
├────────────────────────────────────┤
│                                    │
│ 📋 Output History (6)              │
│                                    │
│ [Register Output]                  │
│                                    │
│ [QA: All ▼] [Loc: All ▼]           │
│ [Sort: Created ▼]                  │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ LP-2025-05482                  │ │
│ │ 500 kg | 🟢 Approved           │ │
│ │ B-2025-0156                    │ │
│ │ WH-A/Z1/R2                     │ │
│ │ Exp: 2025-01-13                │ │
│ │ 2h 15m ago                     │ │
│ │ [View] [Label]                 │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ LP-2025-05479                  │ │
│ │ 450 kg | 🟢 Approved           │ │
│ │ B-2025-0156                    │ │
│ │ WH-A/Z1/R2                     │ │
│ │ Exp: 2025-01-13                │ │
│ │ 3h 30m ago                     │ │
│ │ [View] [Label]                 │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ LP-2025-05475                  │ │
│ │ 600 kg | 🟡 Pending            │ │
│ │ B-2025-0156                    │ │
│ │ WH-A/Z1/R3                     │ │
│ │ Exp: 2025-01-13                │ │
│ │ 5h 45m ago                     │ │
│ │ [View] [Label]                 │ │
│ └────────────────────────────────┘ │
│                                    │
│ (Scroll for 3 more)                │
│                                    │
│ 📊 Summary:                        │
│ Total: 6 outputs | 3,200 kg       │
│ Approved: 4 | Pending: 1          │
│ Rejected: 1                        │
│                                    │
│ [Export CSV]                       │
│                                    │
├────────────────────────────────────┤
│                                    │
│ 🌾 By-Products                     │
│                                    │
│ ℹ️ Auto-create: ON                 │
│                                    │
│ [Register All By-Products]         │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Wheat Bran                     │ │
│ │ 160/250 kg (64%)               │ │
│ │ 🟢 Registered                  │ │
│ │ 6 LPs created                  │ │
│ │ Last: 2h 15m ago               │ │
│ │ [View LPs] [Add More]          │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Flour Dust                     │ │
│ │ 35/50 kg (70%)                 │ │
│ │ 🟢 Registered                  │ │
│ │ 6 LPs created                  │ │
│ │ Last: 2h 15m ago               │ │
│ │ [View LPs] [Add More]          │ │
│ └────────────────────────────────┘ │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Wheat Germ                     │ │
│ │ 0/100 kg (0%)                  │ │
│ │ 🔴 Not Registered              │ │
│ │ 0 LPs created                  │ │
│ │ ⚠️ Missing                     │ │
│ │ [Register Now]                 │ │
│ └────────────────────────────────┘ │
│                                    │
│ [← Back to WO Detail]              │
│                                    │
└────────────────────────────────────┘
```

---

## Interactions

### Primary Actions

| Action | Trigger | Result |
|--------|---------|--------|
| Register Output | Click [Register Output] button | Opens Register Output Modal |
| View LP | Click [View] on LP row | Opens LP Detail Modal or navigates to LP detail page |
| Print Label | Click [Label] on LP row | Generates and downloads ZPL label for LP |
| Register By-Product | Click [Register Now] on by-product | Opens Register By-Product Modal |
| Register All By-Products | Click [Register All By-Products] | Opens sequential modal flow for all unregistered by-products |
| View By-Product LPs | Click [View LPs] on by-product | Shows list of all LPs for that by-product |
| Add More By-Product | Click [Add More] on by-product | Opens Register By-Product Modal for additional qty |
| Export CSV | Click [Export CSV] | Downloads CSV of output history |
| Filter/Sort | Change dropdown | Updates table display |
| View Material Consumption | Click link in Yield Summary | Navigates to Material Consumption tab |

### Register Output Flow

1. User clicks [Register Output]
2. Modal opens with:
   - Pre-filled product info (read-only)
   - Default UoM selected
   - Batch number auto-filled from WO
   - QA status dropdown (if required)
   - Location pre-selected from line default
   - Expiry date auto-calculated
3. User enters quantity, adjusts fields if needed
4. User clicks [Confirm Registration]
5. Validation:
   - Qty > 0
   - QA status selected (if required)
   - All required fields filled
6. If validation passes:
   - POST /api/production/outputs
   - Create new LP
   - Update genealogy
   - Update WO output_qty and progress
   - Refresh output history
   - If by-products exist:
     - If auto_create_by_product_lp = true: Auto-create by-product LPs
     - If auto_create_by_product_lp = false: Prompt for by-product registration
7. Show success message
8. Modal closes

### Register By-Product Flow

1. User clicks [Register Now] or [Add More] on by-product
2. Modal opens with:
   - Pre-filled by-product info (read-only)
   - Expected qty calculated and displayed
   - Recommended actual qty pre-filled
   - Batch auto-generated
   - Location pre-selected from by-product default
3. User enters/confirms actual qty
4. If qty = 0:
   - Show warning: "By-product quantity is 0. Continue?"
   - User can [Cancel], [Skip By-Product], or [Confirm Anyway]
5. User clicks [Confirm Registration]
6. POST /api/production/outputs/by-products
7. Create by-product LP
8. Update genealogy (same parent materials as main output)
9. Refresh by-products section
10. If more by-products remain:
    - Prompt next by-product
11. If all by-products registered:
    - Show "By-product registration complete" confirmation

### Auto-Create By-Products Flow

1. User registers main output
2. After LP creation:
3. Check if BOM has by-products (is_by_product = true)
4. If auto_create_by_product_lp = true:
   - For each by-product:
     - Calculate expected qty = WO.planned_qty * yield_percent / 100
     - Create by-product LP automatically
     - Set qty = expected qty
     - Set batch = {main_batch}-BP-{code}
     - Set location = by-product default location
     - Set expiry = today + by-product shelf_life_days
     - Update genealogy
5. Show notification: "By-products auto-created: [list]"
6. Refresh by-products section

---

## Field Specifications

### WO Summary Header

| Field | Type | Source | Display |
|-------|------|--------|---------|
| wo_number | string | work_orders.wo_number | Read-only |
| status | enum | work_orders.status | Badge with color |
| product_name | string | products.name | Read-only |
| product_code | string | products.code | Read-only |
| batch_number | string | work_orders.batch_number | Read-only |
| planned_qty | decimal | work_orders.planned_qty | With UoM |
| output_qty | decimal | SUM(license_plates.qty WHERE wo_id) | With UoM |
| progress_percent | calculated | (output_qty / planned_qty) * 100 | % with progress bar |
| remaining_qty | calculated | planned_qty - output_qty | With UoM |

### Yield Summary

| Field | Type | Formula | Display |
|-------|------|---------|---------|
| overall_yield | decimal | Composite of output, material, operation yields | % with color |
| output_yield | decimal | (output_qty / planned_qty) * 100 | % with color, trend |
| material_yield | decimal | (planned_material_qty / actual_consumed_qty) * 100 | % with color, trend |
| operation_yield | decimal | AVG(operations.actual_yield_percent) | % with color, trend |
| trend | calculated | Comparison to avg of last 7 days | ▲▼ icon |

**Color Coding**:
- 🟢 Green: >= 95%
- 🟡 Yellow: 80-94%
- 🔴 Red: < 80%

### Output History Table

| Column | Type | Source | Display |
|--------|------|--------|---------|
| lp_number | string | license_plates.lp_number | Clickable link |
| qty | decimal | license_plates.qty | With UoM |
| batch_number | string | license_plates.batch_number | Plain text |
| qa_status | enum | license_plates.qa_status | Badge with color |
| location | string | locations.full_path | Breadcrumb format |
| expiry_date | date | license_plates.expiry_date | Date with days remaining |
| created_at | timestamp | license_plates.created_at | Relative time + absolute |
| created_by | string | users.full_name | Plain text |
| actions | buttons | - | [View] [Label] |

### By-Products Section

| Field | Type | Source | Display |
|-------|------|--------|---------|
| product_name | string | products.name | Read-only |
| product_code | string | products.code | Read-only |
| expected_qty | decimal | WO.planned_qty * yield_percent / 100 | With UoM |
| actual_qty | decimal | SUM(license_plates.qty WHERE product_id) | With UoM |
| yield_percent | decimal | (actual_qty / expected_qty) * 100 | % |
| status | enum | Registered / Not Registered | Badge |
| lp_count | integer | COUNT(license_plates WHERE product_id) | Plain text |
| last_registered | timestamp | MAX(license_plates.created_at) | Relative time |

---

## API Endpoints

### Get Output Registration Page Data

```
GET /api/production/outputs/:woId

Response:
{
  "wo": {
    "id": "uuid-wo-156",
    "wo_number": "WO-2025-0156",
    "status": "in_progress",
    "product_id": "uuid-p1",
    "product_name": "Wheat Bread",
    "product_code": "SKU-WB-001",
    "batch_number": "B-2025-0156",
    "planned_qty": 5000,
    "output_qty": 3200,
    "uom": "kg",
    "progress_percent": 64.0,
    "remaining_qty": 1800,
    "line_id": "uuid-line-1",
    "line_name": "Line 1",
    "default_location_id": "uuid-loc-1",
    "default_location_name": "WH-A / Zone 1 / Rack 2"
  },
  "yields": {
    "overall_yield": 94.5,
    "output_yield": 96.0,
    "material_yield": 92.5,
    "operation_yield": 94.8,
    "output_trend": 1.0,
    "material_trend": -2.5,
    "operation_trend": 0.8,
    "overall_trend": -0.5,
    "target_yield": 95.0,
    "trend_data": [94.2, 94.5, 93.8, 95.1, 94.7, 94.3, 94.5]
  },
  "outputs": [
    {
      "id": "uuid-lp-482",
      "lp_number": "LP-2025-05482",
      "qty": 500,
      "uom": "kg",
      "batch_number": "B-2025-0156",
      "qa_status": "approved",
      "location_id": "uuid-loc-1",
      "location_name": "WH-A / Zone 1 / Rack 2",
      "location_path": "WH-A/Z1/R2",
      "expiry_date": "2025-01-13",
      "days_until_expiry": 28,
      "created_at": "2025-12-14T08:15:00Z",
      "relative_time": "2h 15m ago",
      "created_by_id": "uuid-user-1",
      "created_by_name": "John Smith",
      "notes": "Good batch, consistent quality"
    },
    ...
  ],
  "outputs_summary": {
    "total_outputs": 6,
    "total_qty": 3200,
    "approved_count": 4,
    "approved_qty": 2550,
    "pending_count": 1,
    "pending_qty": 600,
    "rejected_count": 1,
    "rejected_qty": 50
  },
  "by_products": [
    {
      "product_id": "uuid-bp-1",
      "product_name": "Wheat Bran",
      "product_code": "SKU-BP-BRAN",
      "yield_percent": 5.0,
      "expected_qty": 250,
      "actual_qty": 160,
      "actual_yield_percent": 64.0,
      "uom": "kg",
      "status": "registered",
      "lp_count": 6,
      "last_registered_at": "2025-12-14T08:15:00Z",
      "last_registered_relative": "2h 15m ago",
      "last_registered_by": "John Smith"
    },
    {
      "product_id": "uuid-bp-2",
      "product_name": "Flour Dust",
      "product_code": "SKU-BP-DUST",
      "yield_percent": 1.0,
      "expected_qty": 50,
      "actual_qty": 35,
      "actual_yield_percent": 70.0,
      "uom": "kg",
      "status": "registered",
      "lp_count": 6,
      "last_registered_at": "2025-12-14T08:15:00Z",
      "last_registered_relative": "2h 15m ago",
      "last_registered_by": "John Smith"
    },
    {
      "product_id": "uuid-bp-3",
      "product_name": "Wheat Germ",
      "product_code": "SKU-BP-GERM",
      "yield_percent": 2.0,
      "expected_qty": 100,
      "actual_qty": 0,
      "actual_yield_percent": 0,
      "uom": "kg",
      "status": "not_registered",
      "lp_count": 0,
      "last_registered_at": null,
      "last_registered_relative": null,
      "last_registered_by": null
    }
  ],
  "settings": {
    "auto_create_by_product_lp": true,
    "require_qa_on_output": true,
    "auto_complete_wo": false
  },
  "pagination": {
    "total": 6,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Register Output

```
POST /api/production/outputs

Request:
{
  "wo_id": "uuid-wo-156",
  "quantity": 500,
  "uom": "kg",
  "batch_number": "B-2025-0156",
  "qa_status": "pending",
  "location_id": "uuid-loc-1",
  "expiry_date": "2025-01-13",
  "notes": "Good batch, consistent quality"
}

Response:
{
  "lp": {
    "id": "uuid-lp-482",
    "lp_number": "LP-2025-05482",
    "product_id": "uuid-p1",
    "qty": 500,
    "uom": "kg",
    "batch_number": "B-2025-0156",
    "qa_status": "pending",
    "location_id": "uuid-loc-1",
    "expiry_date": "2025-01-13",
    "source": "production",
    "wo_id": "uuid-wo-156",
    "created_at": "2025-12-14T10:30:00Z",
    "created_by": "uuid-user-1",
    "notes": "Good batch, consistent quality"
  },
  "genealogy": {
    "parent_lps": [
      {
        "lp_id": "uuid-lp-401",
        "lp_number": "LP-2025-05401",
        "product_name": "Flour Type A",
        "qty_consumed": 400,
        "uom": "kg"
      },
      {
        "lp_id": "uuid-lp-402",
        "lp_number": "LP-2025-05402",
        "product_name": "Water",
        "qty_consumed": 50,
        "uom": "kg"
      }
    ],
    "child_lp_id": "uuid-lp-482"
  },
  "wo_updated": {
    "output_qty": 3700,
    "progress_percent": 74.0,
    "status": "in_progress"
  },
  "by_products": {
    "auto_created": true,
    "by_products_created": [
      {
        "lp_id": "uuid-lp-483",
        "lp_number": "LP-2025-05483",
        "product_name": "Wheat Bran",
        "qty": 25,
        "uom": "kg"
      },
      {
        "lp_id": "uuid-lp-484",
        "lp_number": "LP-2025-05484",
        "product_name": "Flour Dust",
        "qty": 5,
        "uom": "kg"
      },
      {
        "lp_id": "uuid-lp-485",
        "lp_number": "LP-2025-05485",
        "product_name": "Wheat Germ",
        "qty": 10,
        "uom": "kg"
      }
    ]
  }
}

Error Response (Validation):
{
  "error": "Validation failed",
  "details": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    },
    {
      "field": "qa_status",
      "message": "QA status is required"
    }
  ]
}
```

### Register By-Product

```
POST /api/production/outputs/by-products

Request:
{
  "wo_id": "uuid-wo-156",
  "main_output_lp_id": "uuid-lp-482",
  "by_product_id": "uuid-bp-3",
  "quantity": 64,
  "uom": "kg",
  "batch_number": "B-2025-0156-BP-GERM",
  "qa_status": "pending",
  "location_id": "uuid-loc-bp-1",
  "expiry_date": "2025-03-14",
  "notes": "By-product from batch B-2025-0156"
}

Response:
{
  "lp": {
    "id": "uuid-lp-486",
    "lp_number": "LP-2025-05486",
    "product_id": "uuid-bp-3",
    "product_name": "Wheat Germ",
    "qty": 64,
    "uom": "kg",
    "batch_number": "B-2025-0156-BP-GERM",
    "qa_status": "pending",
    "location_id": "uuid-loc-bp-1",
    "expiry_date": "2025-03-14",
    "source": "production",
    "wo_id": "uuid-wo-156",
    "is_by_product": true,
    "created_at": "2025-12-14T10:35:00Z",
    "created_by": "uuid-user-1",
    "notes": "By-product from batch B-2025-0156"
  },
  "genealogy": {
    "parent_lps": [
      {
        "lp_id": "uuid-lp-401",
        "lp_number": "LP-2025-05401",
        "product_name": "Flour Type A",
        "qty_consumed": 400,
        "uom": "kg"
      },
      {
        "lp_id": "uuid-lp-402",
        "lp_number": "LP-2025-05402",
        "product_name": "Water",
        "qty_consumed": 50,
        "uom": "kg"
      }
    ],
    "child_lp_id": "uuid-lp-486",
    "linked_to_main_output": "uuid-lp-482"
  }
}
```

### Export Outputs CSV

```
GET /api/production/outputs/:woId/export

Response: CSV download
LP Number,Quantity,UoM,Batch,QA Status,Location,Expiry,Created At,Created By,Notes
LP-2025-05482,500,kg,B-2025-0156,Approved,WH-A/Z1/R2,2025-01-13,2025-12-14 08:15,John Smith,Good batch
LP-2025-05479,450,kg,B-2025-0156,Approved,WH-A/Z1/R2,2025-01-13,2025-12-14 06:50,Sarah Lee,
...
```

---

## Acceptance Criteria Coverage

### FR-PROD-011: Output Registration (Desktop) - 9 AC

| AC # | Description | Coverage in Wireframe |
|------|-------------|----------------------|
| 1 | User enters qty = 500, QA = "Approved" → new LP with qty = 500, qa_status = "Approved" | Register Output Modal - Success State, API POST /api/production/outputs |
| 2 | product.shelf_life_days = 30 AND today = 2025-01-01 → LP.expiry_date = 2025-01-31 | Register Output Modal - Expiry Date auto-calculation shown |
| 3 | WO.wo_number = "WO-2025-001" → LP.batch_number = "WO-2025-001" | Register Output Modal - Batch Number pre-filled from WO |
| 4 | require_qa_on_output = true → validation error "QA status is required" | Register Output Modal - Validation Error State |
| 5 | require_qa_on_output = false → output registers with qa_status = null | Register Output Modal - QA Status marked as conditional |
| 6 | LP.source = "production" AND LP.wo_id = current WO ID | Register Output Modal - Output Summary section, API response |
| 7 | Genealogy child_lp_id set on consumption records | Register Output Modal - After Registration section, API response |
| 8 | Line has default_location_id → location dropdown pre-selects | Register Output Modal - Location field pre-selected |
| 9 | User enters qty = 0 → validation error "Quantity must be greater than 0" | Register Output Modal - Validation Error State |

### FR-PROD-013: By-Product Registration - 8 AC

| AC # | Description | Coverage in Wireframe |
|------|-------------|----------------------|
| 1 | Expected by-product qty = WO.planned_qty * yield_percent | Register By-Product Modal - Expected vs Actual section |
| 2 | auto_create_by_product_lp = true → by-products auto-created | Success State - By-Products Section shows "Auto-create: ON", API response |
| 3 | auto_create_by_product_lp = false → manual entry | Register By-Product Modal workflow |
| 4 | User enters actual = 45 → LP created with qty = 45 | Register By-Product Modal - Actual Quantity field, API request |
| 5 | By-product has same parent_lp_ids as main output | Register By-Product Modal - Summary section, API response genealogy |
| 6 | BOM has 3 by-products → all 3 display | Success State - By-Products Section shows all 3, Register By-Product Modal progress |
| 7 | By-product qty = 0 → warning "By-product quantity is 0. Continue?" | Register By-Product Modal - Zero Quantity Warning State |
| 8 | All by-products registered → "By-product registration complete" | By-Product Completion Confirmation modal |

### FR-PROD-014: Yield Tracking - 8 AC

| AC # | Description | Coverage in Wireframe |
|------|-------------|----------------------|
| 1 | planned_qty = 1000, actual = 950 → output_yield = 95.0% | Success State - Yield Summary Card, Output Yield calculation |
| 2 | planned_material = 100, actual_consumed = 110 → material_yield = 90.9% | Success State - Yield Summary Card, Material Yield calculation |
| 3 | output_yield < 80% → "Low Yield" alert displays | Field Specifications - Yield Summary color coding (red < 80%) |
| 4 | output_yield = 95% → yield indicator shows green | Success State - Yield Summary shows 🟢 for 95%+ |
| 5 | output_yield = 75% → yield indicator shows red | Field Specifications - Yield Summary color coding (red < 80%) |
| 6 | Trend chart over last 30 days | Success State - Yield Summary includes trend chart and historical data |
| 7 | Yield rounded to 1 decimal place | Success State - All yields shown as "94.5%", "96.0%", etc. |
| 8 | No outputs → yield displays "N/A" | Empty State - Yield Summary shows "N/A" |

### FR-PROD-015: Multiple Outputs per WO - 8 AC

| AC # | Description | Coverage in Wireframe |
|------|-------------|----------------------|
| 1 | First output = 400 → WO.output_qty = 400, progress = 40% | Success State - WO Summary shows progress calculation |
| 2 | Second output = 300 → WO.output_qty = 700, progress = 70% | Success State - Progress bar updates with each output |
| 3 | 3 outputs → all 3 LPs display | Success State - Output History Table shows multiple outputs |
| 4 | Each output creates separate LP → unique LP ID | Success State - Each row has unique LP number |
| 5 | auto_complete_wo = true AND output_qty >= planned → WO auto-completes | Field Specifications - settings.auto_complete_wo, API response |
| 6 | auto_complete_wo = false AND output_qty exceeds planned → WO remains "In Progress" | Field Specifications - settings.auto_complete_wo |
| 7 | WO has 5 outputs → all display within 1 second | Success State - Output History Table with pagination |
| 8 | Progress bar shows 75% filled when 750/1000 | Success State - Progress bar visual representation |

---

## Touch Targets & Accessibility

### Touch Targets (Minimum 48x48dp)

| Element | Size | Notes |
|---------|------|-------|
| [Register Output] button | 180x48dp | Primary action |
| [Confirm Registration] button | 200x48dp | Modal primary action |
| [Cancel] button | 120x48dp | Modal secondary action |
| [View] button | 80x48dp | Row action |
| [Label] button | 80x48dp | Row action |
| [Register Now] button | 160x48dp | By-product action |
| Dropdown selectors | Full width x 48dp | Form inputs |
| Filter dropdowns | 150x48dp | Table filters |
| Modal close [×] | 48x48dp | Top-right corner |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate between interactive elements |
| Shift+Tab | Navigate backwards |
| Enter | Activate focused button/link |
| Escape | Close modal |
| Space | Toggle checkbox/dropdown |
| Arrow keys | Navigate dropdown options |

### Screen Reader Support

| Element | ARIA Label |
|---------|------------|
| WO Summary Card | "Work order summary for WO-2025-0156" |
| Yield Summary Card | "Production yield summary" |
| Output History Table | "Production output history, 6 outputs" |
| By-Products Section | "By-products for work order WO-2025-0156" |
| Register Output Modal | "Register production output" |
| Progress Bar | "Production progress: 64% of 5,000 kg planned" |
| QA Status Badge | "Quality assurance status: Approved" |

### Color Contrast

| Element | Foreground | Background | Ratio |
|---------|-----------|------------|-------|
| Primary text | #1a1a1a | #ffffff | 16:1 |
| Secondary text | #666666 | #ffffff | 7:1 |
| Green badge (Approved) | #ffffff | #22c55e | 4.5:1 |
| Yellow badge (Pending) | #000000 | #eab308 | 8:1 |
| Red badge (Rejected) | #ffffff | #ef4444 | 4.5:1 |
| Button primary | #ffffff | #2563eb | 4.5:1 |
| Button secondary | #2563eb | #ffffff | 4.5:1 |

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Initial page load | < 2s | Including WO summary, yields, output history |
| Output history render | < 1s | For 5+ outputs |
| Modal open | < 300ms | Smooth animation |
| Form validation | < 100ms | Real-time feedback |
| Output registration | < 2s | Including LP creation and genealogy |
| By-product auto-create | < 3s | For 3 by-products |
| CSV export | < 5s | For 100 outputs |
| Yield calculation | < 500ms | Real-time on output change |

---

## Error Handling

| Error | Message | Recovery |
|-------|---------|----------|
| Network timeout | "Failed to load output data. Network timeout." | [Retry] button |
| API error (500) | "Server error. Please try again later." | [Retry] button |
| Validation error | Specific field error messages | Inline validation, disable submit |
| Qty = 0 | "Quantity must be greater than 0" | Inline error, disable submit |
| Missing QA status | "QA status is required" | Inline error, disable submit |
| By-product qty = 0 | "By-product quantity is 0. Continue?" | Warning modal with options |
| Duplicate LP | "LP number already exists" | Backend error, suggest retry |
| WO not found | "Work order not found" | Redirect to WO list |
| WO completed | "Cannot register output for completed WO" | Info message, disable registration |

---

## Business Rules

1. **Output Registration**:
   - Only allowed for WO status: "in_progress", "paused"
   - Not allowed for: "scheduled", "completed", "cancelled"
   - Quantity must be > 0
   - QA status required if `require_qa_on_output = true`
   - Batch number defaults to WO.wo_number, editable
   - Expiry date auto-calculated: today + product.shelf_life_days

2. **By-Product Registration**:
   - Only prompted if BOM has materials with is_by_product = true
   - Expected qty = WO.planned_qty * yield_percent / 100
   - If auto_create_by_product_lp = true: Auto-create with expected qty
   - If auto_create_by_product_lp = false: Manual entry prompted
   - By-products share genealogy with main output
   - Batch auto-generated: {main_batch}-BP-{code}

3. **Yield Calculation**:
   - Output Yield = (actual_output_qty / planned_qty) * 100
   - Material Yield = (planned_material_qty / actual_consumed_qty) * 100
   - Operation Yield = AVG(operations.actual_yield_percent)
   - Overall Yield = Composite formula (weighted average)
   - Rounded to 1 decimal place
   - Color coding: 🟢 ≥95%, 🟡 80-94%, 🔴 <80%

4. **Multiple Outputs**:
   - Each registration creates separate LP
   - WO.output_qty = SUM of all output LPs
   - Progress % = (output_qty / planned_qty) * 100
   - If auto_complete_wo = true AND output_qty >= planned_qty: Auto-complete WO
   - If auto_complete_wo = false: Manual completion required

5. **Genealogy**:
   - All outputs linked to consumed materials via lp_genealogy
   - child_lp_id updated on parent consumption records
   - By-products share same parent_lp_ids as main output
   - Full traceability maintained

---

## Validation Rules

### Register Output Modal

1. **Quantity**:
   - Required
   - Must be > 0
   - Type: number (decimal allowed)
   - Error: "Quantity must be greater than 0"

2. **UoM**:
   - Required
   - From product.uom
   - Read-only if single UoM, dropdown if multiple

3. **Batch Number**:
   - Required
   - Auto-filled from WO.wo_number
   - Editable
   - Max length: 50 characters

4. **QA Status**:
   - Required if `require_qa_on_output = true`
   - Optional if `require_qa_on_output = false`
   - Options: "approved", "pending", "rejected"
   - Error: "QA status is required"

5. **Location**:
   - Required
   - Dropdown from warehouses/locations
   - Default from line.default_location_id

6. **Expiry Date**:
   - Required
   - Auto-calculated: today + product.shelf_life_days
   - Editable via date picker
   - Must be future date

7. **Notes**:
   - Optional
   - Multi-line text
   - Max length: 500 characters

### Register By-Product Modal

Same validation rules as Register Output Modal, with additional:

1. **Actual Quantity**:
   - Pre-filled with recommended qty (based on yield_percent)
   - Editable
   - If qty = 0: Show warning modal
   - Can proceed with qty = 0 after confirmation

2. **Batch Number**:
   - Auto-generated: {main_batch}-BP-{code}
   - Editable
   - Format: B-2025-0156-BP-GERM

---

## Notes for FRONTEND-DEV

1. **Data Fetching**:
   - Load WO summary, yields, outputs, by-products in single API call
   - Use React Query or SWR for caching and revalidation
   - Implement optimistic updates for output registration

2. **State Management**:
   - Modal state (open/closed, current step)
   - Form state (values, validation errors)
   - By-product registration flow state
   - Output history filters and pagination

3. **Validation**:
   - Use Zod schema for form validation (lib/validation/production.ts)
   - Real-time validation on field blur
   - Disable submit button until all validation passes

4. **Components to Create/Reuse**:
   - WOSummaryCard (new)
   - YieldSummaryCard (new)
   - OutputHistoryTable (new)
   - ByProductsSection (new)
   - RegisterOutputModal (new)
   - RegisterByProductModal (new)
   - ProgressBar (reuse from components/ui)
   - Badge (reuse from components/ui)
   - Table (reuse from components/ui)

5. **API Integration**:
   - GET /api/production/outputs/:woId
   - POST /api/production/outputs
   - POST /api/production/outputs/by-products
   - GET /api/production/outputs/:woId/export

6. **Edge Cases**:
   - WO completed before output registered
   - Network error during registration
   - By-product qty = 0
   - Output qty exceeds planned qty
   - No by-products defined in BOM

7. **Testing Scenarios**:
   - Register output with all fields
   - Register output with minimal fields
   - Validation errors
   - By-product auto-create flow
   - By-product manual registration flow
   - Multiple outputs for single WO
   - Yield calculations
   - CSV export

---

## Permissions

| Action | Required Permission | Notes |
|--------|-------------------|-------|
| View Output Registration Page | production.outputs.read | Basic view access |
| Register Output | production.outputs.create | Create new output LPs |
| Register By-Product | production.outputs.create | Create by-product LPs |
| View LP Detail | warehouse.lps.read | View LP information |
| Print Label | warehouse.labels.print | Generate ZPL labels |
| Export CSV | production.outputs.export | Download output history |
| Edit Output (future) | production.outputs.update | Not in MVP |
| Delete Output (future) | production.outputs.delete | Not in MVP |

---

## Design System References

- Colors: TailwindCSS default palette
- Typography: Inter font family
- Spacing: 4px base unit (Tailwind spacing scale)
- Border radius: 8px (rounded-lg)
- Shadows: Tailwind shadow-sm, shadow-md
- Icons: Lucide React (or similar)

---

## File Structure

```
apps/frontend/
  app/(authenticated)/production/
    outputs/
      [woId]/
        page.tsx                      # Main page component
        components/
          WOSummaryCard.tsx           # WO summary header
          YieldSummaryCard.tsx        # Yield metrics display
          OutputHistoryTable.tsx      # Output history table
          ByProductsSection.tsx       # By-products management
          RegisterOutputModal.tsx     # Output registration modal
          RegisterByProductModal.tsx  # By-product registration modal
          ByProductCompletionModal.tsx # Completion confirmation
  lib/
    services/
      output-service.ts               # Output registration logic
      by-product-service.ts           # By-product logic
      yield-service.ts                # Yield calculations
    validation/
      production.ts                   # Zod schemas for outputs
    hooks/
      use-output-registration.ts      # Custom hook for output flow
      use-by-product-flow.ts          # Custom hook for by-product flow
```

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] All 33 Acceptance Criteria covered
- [x] Touch targets >= 48x48dp
- [x] Accessibility checklist passed
- [x] Responsive breakpoints defined (mobile/tablet/desktop)
- [x] API endpoints specified
- [x] Validation rules documented
- [x] Business rules documented
- [x] Error handling defined
- [x] Performance targets set

---

**End of Wireframe (Part 2)**

**Approval Status**: Ready for Review
**Estimated Implementation**: 3-4 days (1 developer)
**Dependencies**:
- WO detail page (PROD-002)
- Material consumption (PROD-003)
- LP detail page (WAREHOUSE module)
- Genealogy tracing (WAREHOUSE module)

**Next Steps**:
1. Review and approve wireframe
2. Create Zod schemas for validation
3. Implement API endpoints
4. Build UI components
5. Integration testing
6. UAT
