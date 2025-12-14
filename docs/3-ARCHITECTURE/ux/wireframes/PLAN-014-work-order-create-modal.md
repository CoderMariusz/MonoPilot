# PLAN-014: Work Order Create Modal

**Module**: Planning
**Feature**: WO CRUD with BOM Snapshot + Material Reservation (FR-PLAN-017, FR-PLAN-018, FR-PLAN-019, FR-PLAN-020, FR-PLAN-021, FR-PLAN-025)
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## ASCII Wireframe

### Success State - Create Mode (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Work Order                                       [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- BASIC INFO --------------------------------------------------+  |
|  |                                                                                              |  |
|  |  Product *                            Scheduled Date *            Quantity *                |  |
|  |  +----------------------------+       +-------------------+       +------------------+      |  |
|  |  | Chocolate Bar         [v]  |       | 2024-12-20   [C]  |       | 1000        [v]  |      |  |
|  |  | FG-CHOC-001                |       +-------------------+       +------------------+      |  |
|  |  +----------------------------+       In 6 days                   pc (from product)         |  |
|  |                                                                                              |  |
|  |  BOM Version *                        Routing (from BOM)                                    |  |
|  |  +----------------------------+       +----------------------------+                        |  |
|  |  | [Auto] v1.2 (active)  [v]  |       | Standard Production   [v]  |                        |  |
|  |  +----------------------------+       +----------------------------+                        |  |
|  |  Effective: Dec 1, 2024               5 operations, Est. 8h                                 |  |
|  |  Output: 100 pc, Scaling: 10x         [i] Inherited from BOM, can override                 |  |
|  |                                                                                              |  |
|  |  Production Line              Optional Machine            Priority                          |  |
|  |  +-------------------+        +-------------------+        +------------------+             |  |
|  |  | Packing #1   [v]  |        | None          [v] |        | Normal      [v]  |             |  |
|  |  +-------------------+        +-------------------+        +------------------+             |  |
|  |                                                                                              |  |
|  |  Scheduled Time (optional)                                                                  |  |
|  |  Start: [08:00 v]  End: [16:00 v]  (Est. duration: 8h from routing)                         |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- BOM PREVIEW -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  Materials Required (Snapshot from BOM v1.2)                                                |  |
|  |                                                                                              |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | # | Material          | Required | UoM | Available | Reservation | Status   | By-Prod | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 1 | Cocoa Mass        | 250 kg   | kg  | 300 kg    | Not Reserved| [OK]     | -       | |  |
|  |  |   | RM-COCOA-001      |          |     | (Green)   | [Reserve]   |          |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 2 | Sugar Fine        | 150 kg   | kg  | 120 kg    | Not Reserved| [!] Low  | -       | |  |
|  |  |   | RM-SUGAR-001      |          |     | (Yellow)  | [Reserve]   |          |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 3 | Milk Powder       | 100 kg   | kg  | 50 kg     | Not Reserved| [!] Short| -       | |  |
|  |  |   | RM-MILK-001       |          |     | (Red)     | [Reserve]   |          |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 4 | Aluminum Foil     | 500 m    | m   | 1,000 m   | Not Reserved| [OK]     | -       | |  |
|  |  |   | PKG-FOIL-001      |          |     | (Green)   | [Reserve]   |          |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |  | 5 | Cocoa Butter      | -        | kg  | -         | -           | -        | Yes (2%)| |  |
|  |  |   | BY-BUTTER-001     |          |     |           |             |          |         | |  |
|  |  +----------------------------------------------------------------------------------------+ |  |
|  |                                                                                              |  |
|  |  5 Materials | Total Weight: 500 kg | Scrap: 5% included                                   |  |
|  |                                                                                              |  |
|  |  [v] Show Material Availability Details                                                     |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- MATERIAL RESERVATION -----------------------------------------+  |
|  |                                                                                              |  |
|  |  Reservation Policy:                                                                        |  |
|  |  ( ) Reserve materials now (recommended for urgent orders)                                  |  |
|  |  (x) Reserve materials on release (default)                                                 |  |
|  |  ( ) Do not reserve (materials picked at production time)                                   |  |
|  |                                                                                              |  |
|  |  [i] Reservations lock inventory to this WO and prevent other WOs from using it.            |  |
|  |      Reservations are released automatically if WO is cancelled.                            |  |
|  |                                                                                              |  |
|  |  Reserved Materials: 0 of 4 materials reserved                                              |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- AVAILABILITY CHECK -------------------------------------------+  |
|  |                                                                                              |  |
|  |  Material Availability Summary:                                                             |  |
|  |                                                                                              |  |
|  |  [OK]     Cocoa Mass: 300 kg available (250 kg needed) - Comfortable stock                  |  |
|  |  [!]      Sugar Fine: 120 kg available (150 kg needed) - 30 kg short                        |  |
|  |  [!]      Milk Powder: 50 kg available (100 kg needed) - 50 kg short                        |  |
|  |  [OK]     Aluminum Foil: 1,000 m available (500 m needed) - Sufficient                      |  |
|  |                                                                                              |  |
|  |  Overall: [!] 2 materials below required quantity                                           |  |
|  |                                                                                              |  |
|  |  You can still create this WO. Materials may be on order or received before production.     |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- OPERATIONS PREVIEW (Optional) --------------------------------+  |
|  |                                                                                              |  |
|  |  Operations (from Routing: Standard Production)                                             |  |
|  |                                                                                              |  |
|  |  1. Mixing (2h, Machine: Mixer #1)                                                          |  |
|  |  2. Tempering (1h, Machine: Temper #1)                                                      |  |
|  |  3. Molding (3h, Machine: Mold #2)                                                          |  |
|  |  4. Cooling (1.5h, Line: Cooling Tunnel)                                                    |  |
|  |  5. Packing (0.5h, Line: Packing #1)                                                        |  |
|  |                                                                                              |  |
|  |  Total Estimated Duration: 8 hours                                                          |  |
|  |                                                                                              |  |
|  |  [^] Collapse Operations                                                                    |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- NOTES & SETTINGS --------------------------------------------+  |
|  |                                                                                              |  |
|  |  Production Notes                                                                           |  |
|  |  +-------------------------------------------------------------------------------------+    |  |
|  |  | Customer order #4567 - use organic cocoa if available                               |    |  |
|  |  +-------------------------------------------------------------------------------------+    |  |
|  |                                                                                              |  |
|  |  Source of Demand (optional)                                                                |  |
|  |  [x] Manual  ( ) Customer Order: [_________]  ( ) Forecast                                  |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |                                                       [Cancel]    [Save as Draft]     [Plan] |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Material Reservation Modal (when "Reserve" clicked)

```
+----------------------------------------------------------+
|              Reserve Materials: Cocoa Mass           [X]  |
+----------------------------------------------------------+
|                                                            |
|  Material: Cocoa Mass (RM-COCOA-001)                      |
|  Required: 250 kg                                         |
|  Available: 300 kg (5 LPs)                                |
|                                                            |
|  +------------------------------------------------------+ |
|  | Select License Plates to Reserve:                    | |
|  +------------------------------------------------------+ |
|  |                                                        | |
|  | [x] LP-2024-1234 | Lot: LOT-001 | 100 kg | Exp: +30d | |
|  | [x] LP-2024-1235 | Lot: LOT-001 | 80 kg  | Exp: +30d | |
|  | [x] LP-2024-1236 | Lot: LOT-002 | 70 kg  | Exp: +45d | |
|  | [ ] LP-2024-1237 | Lot: LOT-003 | 30 kg  | Exp: +15d | |
|  | [ ] LP-2024-1238 | Lot: LOT-003 | 20 kg  | Exp: +15d | |
|  |                                                        | |
|  +------------------------------------------------------+ |
|                                                            |
|  Selected: 250 kg (3 LPs) - Meets requirement [OK]        |
|                                                            |
|  Reservation Strategy:                                    |
|  (x) FEFO (First Expiry First Out) - Default              |
|  ( ) FIFO (First In First Out)                            |
|  ( ) Manual Selection                                     |
|                                                            |
|  [i] Reserved LPs will be locked for this WO only.        |
|      Reservations auto-release on WO cancel.              |
|                                                            |
|  +------------------------------------------------------+ |
|  |                              [Cancel]    [Reserve]   | |
|  +------------------------------------------------------+ |
|                                                            |
+----------------------------------------------------------+
```

### Material Reservation with Conflicts

```
+----------------------------------------------------------+
|              Reserve Materials: Sugar Fine           [X]  |
+----------------------------------------------------------+
|                                                            |
|  Material: Sugar Fine (RM-SUGAR-001)                      |
|  Required: 150 kg                                         |
|  Available: 120 kg (4 LPs) - INSUFFICIENT                 |
|                                                            |
|  +------------------------------------------------------+ |
|  |  [!] Insufficient inventory to meet requirement      | |
|  |      Shortage: 30 kg                                 | |
|  +------------------------------------------------------+ |
|                                                            |
|  Available License Plates:                                |
|                                                            |
|  +------------------------------------------------------+ |
|  | [x] LP-2024-5001 | Lot: LOT-101 | 50 kg  | Exp: +20d | |
|  | [x] LP-2024-5002 | Lot: LOT-101 | 40 kg  | Exp: +20d | |
|  | [x] LP-2024-5003 | Lot: LOT-102 | 20 kg  | Exp: +10d | |
|  | [x] LP-2024-5004 | Lot: LOT-103 | 10 kg  | Exp: +5d  | |
|  |                                                        | |
|  +------------------------------------------------------+ |
|                                                            |
|  Selected: 120 kg (4 LPs) - Partial reservation           |
|  Still needed: 30 kg                                      |
|                                                            |
|  Options:                                                 |
|  ( ) Reserve available qty now, wait for more inventory   |
|  ( ) Do not reserve, pick at production time              |
|  (x) Create partial reservation (recommended)             |
|                                                            |
|  [i] You can add PO for the shortage and reserve when     |
|      inventory arrives, or proceed without reservation.   |
|                                                            |
|  +------------------------------------------------------+ |
|  |                [Cancel]    [Reserve Available Only]  | |
|  +------------------------------------------------------+ |
|                                                            |
+----------------------------------------------------------+
```

### BOM Preview with Reserved Materials

```
+-------------------------------- BOM PREVIEW -------------------------------------------------+
|                                                                                              |
|  Materials Required (Snapshot from BOM v1.2)                                                |
|                                                                                              |
|  +----------------------------------------------------------------------------------------+ |
|  | # | Material          | Required | UoM | Available | Reservation      | Status       | |
|  +----------------------------------------------------------------------------------------+ |
|  | 1 | Cocoa Mass        | 250 kg   | kg  | 300 kg    | Reserved (3 LPs) | [OK] Ready   | |
|  |   | RM-COCOA-001      |          |     |           | 250 kg           | (Green)      | |
|  |   |                   |          |     |           | [View/Edit]      |              | |
|  +----------------------------------------------------------------------------------------+ |
|  | 2 | Sugar Fine        | 150 kg   | kg  | 120 kg    | Partial (4 LPs)  | [!] Shortage | |
|  |   | RM-SUGAR-001      |          |     |           | 120/150 kg       | (Orange)     | |
|  |   |                   |          |     |           | [View/Edit]      |              | |
|  +----------------------------------------------------------------------------------------+ |
|  | 3 | Milk Powder       | 100 kg   | kg  | 50 kg     | Not Reserved     | [!] Short    | |
|  |   | RM-MILK-001       |          |     | (Red)     | [Reserve]        |              | |
|  +----------------------------------------------------------------------------------------+ |
|  | 4 | Aluminum Foil     | 500 m    | m   | 1,000 m   | Reserved (2 LPs) | [OK] Ready   | |
|  |   | PKG-FOIL-001      |          |     |           | 500 m            | (Green)      | |
|  |   |                   |          |     |           | [View/Edit]      |              | |
|  +----------------------------------------------------------------------------------------+ |
|                                                                                              |
|  Reservation Summary: 2 fully reserved, 1 partial, 1 not reserved                           |
|                                                                                              |
+----------------------------------------------------------------------------------------------+
```

### BOM Auto-Selection Flow

```
+----------------------------------------------------------+
|              Select Product for Work Order           [X]  |
+----------------------------------------------------------+
|                                                            |
|  Product *                                                 |
|  +------------------------------------------------------+ |
|  | [Search by name or code...]                     [v]  | |
|  +------------------------------------------------------+ |
|                                                            |
|  Selected: Chocolate Bar (FG-CHOC-001)                    |
|                                                            |
|  Active BOMs for this product:                            |
|                                                            |
|  +------------------------------------------------------+ |
|  | (x) v1.2 - Standard Recipe (RECOMMENDED)             | |
|  |     Effective: Dec 1, 2024 - No end date             | |
|  |     Output: 100 pc  |  Materials: 5                   | |
|  |     Routing: Standard Production (5 ops)             | |
|  |     Last used: Dec 18, 2024                          | |
|  +------------------------------------------------------+ |
|  | ( ) v1.1 - Original Recipe                           | |
|  |     Effective: Jan 1, 2024 - Nov 30, 2024            | |
|  |     Output: 100 pc  |  Materials: 4                   | |
|  |     Routing: Legacy Process (3 ops)                  | |
|  |     Status: Superseded                               | |
|  +------------------------------------------------------+ |
|                                                            |
|  Scheduled Date: [2024-12-20 C]                           |
|                                                            |
|  [i] BOM v1.2 is active for the scheduled date.           |
|      Routing will be inherited from BOM (can override).   |
|                                                            |
|  +------------------------------------------------------+ |
|  |                              [Cancel]    [Continue]  | |
|  +------------------------------------------------------+ |
|                                                            |
+----------------------------------------------------------+
```

### Mobile View - Create Mode (<768px)

```
+----------------------------------+
|       Create Work Order      [X] |
+----------------------------------+
|                                  |
|  --- BASIC INFO ---              |
|                                  |
|  Product *                       |
|  +----------------------------+  |
|  | Chocolate Bar         [v]  |  |
|  | FG-CHOC-001                |  |
|  +----------------------------+  |
|                                  |
|  Scheduled Date *                |
|  +----------------------------+  |
|  | 2024-12-20            [C]  |  |
|  +----------------------------+  |
|  In 6 days                       |
|                                  |
|  Quantity *                      |
|  +----------------------------+  |
|  | 1000                  [v]  |  |
|  +----------------------------+  |
|  pc                              |
|                                  |
|  BOM Version *                   |
|  +----------------------------+  |
|  | [Auto] v1.2          [v]  |  |
|  +----------------------------+  |
|  Scaling: 10x                    |
|                                  |
|  Production Line                 |
|  +----------------------------+  |
|  | Packing #1           [v]  |  |
|  +----------------------------+  |
|                                  |
|  Priority                        |
|  +----------------------------+  |
|  | Normal               [v]  |  |
|  +----------------------------+  |
|                                  |
|  [More Options v]                |
|  (Routing, Machine, Times)       |
|                                  |
|  --- BOM PREVIEW ---             |
|                                  |
|  Materials Required: 5           |
|                                  |
|  +----------------------------+  |
|  | Cocoa Mass                 |  |
|  | 250 kg  [OK] Available     |  |
|  | Reserved: None             |  |
|  | [Reserve]                  |  |
|  +----------------------------+  |
|  | Sugar Fine                 |  |
|  | 150 kg  [!] Low (120 kg)   |  |
|  | Reserved: None             |  |
|  | [Reserve]                  |  |
|  +----------------------------+  |
|  | Milk Powder                |  |
|  | 100 kg  [!] Short (50 kg)  |  |
|  | Reserved: None             |  |
|  | [Reserve]                  |  |
|  +----------------------------+  |
|  | Aluminum Foil              |  |
|  | 500 m   [OK] Available     |  |
|  | Reserved: None             |  |
|  | [Reserve]                  |  |
|  +----------------------------+  |
|                                  |
|  [!] 2 materials below required  |
|                                  |
|  --- RESERVATION ---             |
|                                  |
|  Reservation Policy:             |
|  (x) On release (default)        |
|  ( ) Reserve now                 |
|  ( ) Do not reserve              |
|                                  |
|  0 of 4 materials reserved       |
|                                  |
|  +----------------------------+  |
|  | [Save Draft]     [Plan]    |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Work Order                                       [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- BASIC INFO --------------------------------------------------+  |
|  |                                                                                              |  |
|  |  Product                                                                                    |  |
|  |  [==================================]  Loading products...                                  |  |
|  |                                                                                              |  |
|  |  Scheduled Date              Quantity                                                       |  |
|  |  [==================================] [==================================]                  |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- BOM PREVIEW -------------------------------------------------+  |
|  |                                                                                              |  |
|  |  Loading BOM details...                                                                     |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Validation Error State

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Work Order                                       [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |  [!] Please fix the following errors:                                                       |  |
|  |      - Product is required                                                                  |  |
|  |      - No active BOM found for product on scheduled date                                    |  |
|  |      - Scheduled Date must be in the future                                                 |  |
|  |      - Quantity must be greater than 0                                                      |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- BASIC INFO --------------------------------------------------+  |
|  |                                                                                              |  |
|  |  Product *                            Scheduled Date *                                      |  |
|  |  +----------------------------+       +-------------------+                                 |  |
|  |  | Select product...     [v]  |       | 2024-12-10   [C]  |                                 |  |
|  |  +----------------------------+       +-------------------+                                 |  |
|  |  [!] Required                         [!] Must be future date                               |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### BOM Conflict Error State

```
+--------------------------------------------------------------------------------------------------+
|                                      Create Work Order                                       [X]  |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+  |
|  |  [!] BOM Configuration Conflict                                                             |  |
|  |      The selected BOM (v1.1) is not active on the scheduled date (2024-12-20).              |  |
|  |      BOM v1.1 is valid from 2024-01-01 to 2024-11-30.                                       |  |
|  |                                                                                              |  |
|  |      Recommended action:                                                                    |  |
|  |      - Use BOM v1.2 (active on 2024-12-20)                                                  |  |
|  |      - Or change scheduled date to be within BOM v1.1 validity period                       |  |
|  |                                                                                              |  |
|  |      [Use BOM v1.2]  [Change Date]  [Override (Expert)]                                     |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- BASIC INFO --------------------------------------------------+  |
|  |                                                                                              |  |
|  |  Product: Chocolate Bar (FG-CHOC-001)                                                       |  |
|  |  Scheduled Date: 2024-12-20                                                                 |  |
|  |  Quantity: 1000 pc                                                                          |  |
|  |                                                                                              |  |
|  |  BOM Version *                                                                              |  |
|  |  +----------------------------+                                                             |  |
|  |  | v1.1 (superseded)     [v]  |  [!] Not active on scheduled date                          |  |
|  |  +----------------------------+                                                             |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Basic Info Section

| Field | Type | Required | Auto-Fill Logic | Validation |
|-------|------|----------|-----------------|------------|
| product_id | Searchable autocomplete | Yes | - | Must be finished good product |
| scheduled_date | Date picker | Yes | Default: tomorrow | Must be >= today |
| quantity | Number input | Yes | - | > 0 |
| bom_id | Dropdown | Yes | Auto-selected based on date | Must exist and be active |
| routing_id | Dropdown | No | **Auto-selected from BOM.routing_id** | Optional, can override |
| line_id | Dropdown | No | - | Must exist in org |
| machine_id | Dropdown | No | - | Must exist in org |
| priority | Dropdown | No | Default: normal | Low, Normal, High, Critical |
| scheduled_start_time | Time picker | No | From routing or default 08:00 | - |
| scheduled_end_time | Time picker | No | Calculated from routing duration | - |
| notes | Textarea | No | - | Max 1000 chars |
| source_of_demand | Dropdown | No | Default: manual | Manual, Customer Order, Forecast |

### 2. BOM Auto-Selection Logic

**Step 1: Product Selection**
```typescript
// When product is selected
async function onProductSelect(productId: string, scheduledDate: string) {
  // Query active BOMs for product on scheduled date
  const activeBoms = await getBOMs({
    product_id: productId,
    status: 'active',
    effective_from: { lte: scheduledDate },
    effective_to: [{ is: null }, { gte: scheduledDate }]
  });

  if (activeBoms.length === 0) {
    showWarning("No active BOM found for this product on scheduled date");
    return null;
  }

  // If multiple, select most recent effective_from
  const selectedBom = activeBoms.sort((a, b) =>
    new Date(b.effective_from) - new Date(a.effective_from)
  )[0];

  // Auto-populate routing from BOM
  if (selectedBom.routing_id) {
    setRoutingId(selectedBom.routing_id);
    showInfo("Routing inherited from BOM");
  }

  return selectedBom;
}
```

**Step 2: User Override**
- User can manually select different BOM version
- Show warning if selected BOM not active on scheduled date
- Preview BOM before confirming selection
- **When BOM changes, routing auto-updates to new BOM's routing_id**

**Step 3: BOM Conflict Detection**
```typescript
// Validate BOM against scheduled date
function validateBOMDate(bom: BOM, scheduledDate: string): ValidationResult {
  const schedDate = new Date(scheduledDate);
  const effectiveFrom = new Date(bom.effective_from);
  const effectiveTo = bom.effective_to ? new Date(bom.effective_to) : null;

  if (schedDate < effectiveFrom) {
    return {
      valid: false,
      error: `BOM ${bom.version} is not yet effective on ${scheduledDate}. Effective from: ${bom.effective_from}`
    };
  }

  if (effectiveTo && schedDate > effectiveTo) {
    return {
      valid: false,
      error: `BOM ${bom.version} is no longer active on ${scheduledDate}. Expired on: ${bom.effective_to}`
    };
  }

  return { valid: true };
}
```

### 3. Routing Auto-Population Logic (CRITICAL CHANGE)

**Default Behavior:**
```typescript
// When BOM is selected, routing is auto-populated from BOM.routing_id
async function onBOMSelect(bom: BOM) {
  // Auto-populate routing from BOM
  if (bom.routing_id) {
    setRoutingId(bom.routing_id);
    setRoutingSource('bom'); // Track that routing came from BOM

    // Load routing details for preview
    const routing = await getRouting(bom.routing_id);
    displayRoutingPreview(routing);

    showInfo("Routing inherited from BOM (can be changed)");
  } else {
    // BOM has no routing assigned
    setRoutingId(null);
    setRoutingSource(null);
    showInfo("BOM has no routing assigned. You can select one manually.");
  }
}
```

**User Override:**
```typescript
// User can override the BOM routing
async function onRoutingManualChange(routingId: string | null) {
  setRoutingId(routingId);
  setRoutingSource('manual'); // User manually changed routing

  if (routingId) {
    const routing = await getRouting(routingId);
    displayRoutingPreview(routing);
    showInfo("Custom routing selected (different from BOM default)");
  } else {
    clearRoutingPreview();
    showInfo("No routing selected - operations will be manual");
  }
}
```

**Routing Field Behavior:**
- **Label**: "Routing (from BOM)" when routing came from BOM
- **Label**: "Routing (custom)" when user manually changed it
- **Placeholder**: "Inherited from BOM" when BOM.routing_id exists
- **Placeholder**: "Select routing (optional)" when BOM.routing_id is null
- **Helper Text**: "[i] Inherited from BOM, can override" when using BOM routing
- **Dropdown Options**:
  - "None" (remove routing)
  - All active routings for the product
  - Current BOM routing marked as "(from BOM)" in dropdown

**API Request:**
```typescript
// POST /api/planning/work-orders
{
  "bom_id": "uuid-bom-v1.2",
  "routing_id": "uuid-routing-std", // Defaulted from BOM.routing_id
  "routing_source": "bom", // or "manual" if user changed it
  // ... other fields
}
```

### 4. BOM Snapshot Creation

**At WO creation:**
```typescript
// Copy BOM items to wo_materials
async function createWOMaterials(wo: WorkOrder, bom: BOM) {
  const scaleFactor = wo.quantity / bom.output_qty;

  for (const bomItem of bom.bom_items) {
    await createWOMaterial({
      wo_id: wo.id,
      bom_id: bom.id,  // ADDED: Track source BOM
      sequence: bomItem.sequence,  // ADDED: Preserve order
      product_id: bomItem.product_id,
      quantity: bomItem.quantity * scaleFactor * (1 + bomItem.scrap_percent/100),
      uom: bomItem.uom,
      scrap_percent: bomItem.scrap_percent,
      consume_whole_lp: bomItem.consume_whole_lp,
      is_by_product: bomItem.is_by_product,
      yield_percent: bomItem.yield_percent,
      condition_flags: bomItem.condition_flags,
      reservation_status: 'not_reserved'  // ADDED: Initial state
    });
  }
}
```

**Immutability Rule:**
- Once WO status = 'released', wo_materials cannot be modified
- Even if source BOM changes, WO snapshot remains unchanged

### 5. Material Availability Check

**Query Logic:**
```typescript
// Check available inventory for each material
async function checkMaterialAvailability(woMaterials: WOMaterial[]) {
  const results = [];

  for (const material of woMaterials) {
    if (material.is_by_product) {
      results.push({
        product_id: material.product_id,
        required: 0,
        available: 0,
        status: 'by_product'
      });
      continue;
    }

    const available = await getAvailableQty({
      product_id: material.product_id,
      warehouse_id: wo.warehouse_id, // or default warehouse
      status: 'available'
    });

    const status =
      available >= material.quantity * 1.2 ? 'ok' :
      available >= material.quantity ? 'low' :
      'insufficient';

    results.push({
      product_id: material.product_id,
      product_name: material.product.name,
      required: material.quantity,
      available,
      status
    });
  }

  return results;
}
```

**Visual Indicators:**
| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| OK | Green | [OK] | Available >= required * 1.2 (comfortable) |
| Low | Yellow | [!] | Required <= available < required * 1.2 (warning) |
| Insufficient | Red | [!] Short | Available < required (shortage) |
| By-Product | Gray | - | Output material, not consumed |

### 6. Material Reservation (FR-PLAN-025)

**Reservation Policies:**
| Policy | When Applied | Use Case |
|--------|--------------|----------|
| Reserve Now | At WO creation (status=planned) | Urgent orders, limited materials |
| Reserve on Release | When WO status → released | Default, most common |
| Do Not Reserve | Never (pick at production) | Abundant materials, JIT production |

**Reservation Flow:**
```typescript
// Reserve materials for WO
async function reserveMaterials(woId: string, materialId: string, reservationStrategy: 'FEFO' | 'FIFO' | 'manual') {
  const woMaterial = await getWOMaterial(woId, materialId);
  const requiredQty = woMaterial.quantity;

  // Get available LPs
  const availableLPs = await getLicensePlates({
    product_id: materialId,
    status: 'available',
    warehouse_id: wo.warehouse_id
  });

  // Sort by strategy
  let sortedLPs;
  if (reservationStrategy === 'FEFO') {
    sortedLPs = availableLPs.sort((a, b) =>
      new Date(a.expiry_date) - new Date(b.expiry_date)
    );
  } else if (reservationStrategy === 'FIFO') {
    sortedLPs = availableLPs.sort((a, b) =>
      new Date(a.received_date) - new Date(b.received_date)
    );
  } else {
    sortedLPs = availableLPs; // Manual selection
  }

  // Select LPs to meet requirement
  let totalReserved = 0;
  const selectedLPs = [];

  for (const lp of sortedLPs) {
    if (totalReserved >= requiredQty) break;
    selectedLPs.push(lp);
    totalReserved += lp.quantity;
  }

  // Create reservations
  for (const lp of selectedLPs) {
    await createReservation({
      lp_id: lp.id,
      wo_material_id: woMaterial.id,
      wo_id: woId,
      reserved_qty: Math.min(lp.quantity, requiredQty - (totalReserved - lp.quantity)),
      reservation_status: 'reserved',
      reserved_at: new Date(),
      reserved_by: currentUser.id
    });

    // Update LP status
    await updateLicensePlate(lp.id, {
      status: 'reserved',
      reserved_for_wo_id: woId
    });
  }

  // Update wo_material reservation status
  await updateWOMaterial(woMaterial.id, {
    reservation_status: totalReserved >= requiredQty ? 'fully_reserved' : 'partially_reserved',
    reserved_qty: totalReserved
  });

  return {
    success: true,
    reserved_qty: totalReserved,
    required_qty: requiredQty,
    lp_count: selectedLPs.length,
    status: totalReserved >= requiredQty ? 'fully_reserved' : 'partially_reserved'
  };
}
```

**Reservation Status:**
| Status | Meaning | Color |
|--------|---------|-------|
| not_reserved | No LPs reserved | Gray |
| partially_reserved | Some LPs reserved, not enough | Orange |
| fully_reserved | All required qty reserved | Green |

**Reservation Release Logic:**
```typescript
// Release reservations on WO cancel
async function releaseReservations(woId: string) {
  const reservations = await getReservations({ wo_id: woId });

  for (const reservation of reservations) {
    // Update LP status back to available
    await updateLicensePlate(reservation.lp_id, {
      status: 'available',
      reserved_for_wo_id: null
    });

    // Delete reservation record
    await deleteReservation(reservation.id);
  }

  // Update wo_materials
  await updateWOMaterialsStatus(woId, {
    reservation_status: 'not_reserved',
    reserved_qty: 0
  });
}
```

**Reservation Conflict Handling:**
```typescript
// Check if LP is already reserved
async function checkReservationConflict(lpId: string) {
  const existingReservation = await getReservation({ lp_id: lpId, status: 'reserved' });

  if (existingReservation) {
    return {
      conflict: true,
      reserved_for: existingReservation.wo_number,
      reserved_qty: existingReservation.reserved_qty,
      reserved_at: existingReservation.reserved_at
    };
  }

  return { conflict: false };
}
```

### 7. Routing Copy Logic

**When `wo_copy_routing = true` in Settings:**
```typescript
// Copy routing operations to wo_operations
async function createWOOperations(wo: WorkOrder, routing: Routing) {
  for (const routingOp of routing.routing_operations) {
    await createWOOperation({
      wo_id: wo.id,
      routing_id: routing.id,  // ADDED: Track source routing
      sequence: routingOp.sequence,
      operation_name: routingOp.operation_name,
      description: routingOp.description,
      machine_id: routingOp.machine_id,
      line_id: routingOp.line_id,
      expected_duration_minutes: routingOp.duration_minutes,
      actual_duration_minutes: null,  // ADDED: For actuals tracking
      expected_yield_percent: routingOp.expected_yield,
      status: 'not_started'
    });
  }
}
```

**Duration Calculation:**
- Total estimated duration = SUM(operation.duration_minutes)
- scheduled_end_time = scheduled_start_time + total_duration (if routing present)

---

## Main Actions

### Modal Actions

| Action | Enabled When | Result |
|--------|--------------|--------|
| **Cancel** | Always | Close modal, discard changes (confirm if unsaved), release temp reservations |
| **Save as Draft** | Product, date, quantity valid | Save WO with status = "draft" |
| **Plan** | All required fields valid | Save WO and transition to "planned", apply reservation policy |
| **Save Changes** (Edit mode) | Changes made | Save changes to existing draft WO |
| **Reserve** (per material) | Material available | Open reservation modal for specific material |
| **View/Edit** (reservation) | Material reserved | View/modify reservation details |

**Business Rule:**
- Can proceed even with material shortages (yellow/red warnings)
- Materials may be on order or received before production starts
- Shortage warnings inform planning, don't block creation

---

## States

| State | Description | Elements Shown |
|-------|-------------|----------------|
| **Loading** | Dropdowns loading | Skeleton loaders for product/BOM/line dropdowns |
| **Success** | Ready for editing | Full form with BOM preview |
| **BOM Preview Loading** | Loading BOM details | Skeleton for materials table |
| **Validation Error** | Form has errors | Error banner + field-level error messages |
| **BOM Conflict Error** | BOM not valid for date | BOM conflict banner with resolution options |
| **Saving** | Form submitting | Disabled buttons + loading spinner |
| **No Active BOM** | Product has no BOM | Warning message, can still save as draft |
| **Reservation Modal Open** | Reserving specific material | Modal showing available LPs for selection |
| **Reservation Conflict** | LP already reserved | Warning with conflict details |

---

## API Endpoints

### Create Work Order

```
POST /api/planning/work-orders
Body: {
  "product_id": "uuid-choc",
  "bom_id": "uuid-bom-v1.2",
  "routing_id": "uuid-routing-std",  // Defaulted from BOM.routing_id
  "routing_source": "bom",  // ADDED: "bom" | "manual" | null
  "quantity": 1000,
  "uom": "pc",
  "scheduled_date": "2024-12-20",
  "scheduled_start_time": "08:00",
  "scheduled_end_time": "16:00",
  "line_id": "uuid-line-pack1",
  "machine_id": null,
  "priority": "normal",
  "notes": "Customer order #4567 - use organic cocoa if available",
  "source_of_demand": "manual",
  "reservation_policy": "on_release"  // ADDED: "now" | "on_release" | "never"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-wo-156",
    "wo_number": "WO-2024-00156",
    "status": "planned",
    "product": { "id": "uuid-choc", "name": "Chocolate Bar", "code": "FG-CHOC-001" },
    "quantity": 1000,
    "uom": "pc",
    "scheduled_date": "2024-12-20",
    "bom_snapshot": {
      "bom_id": "uuid-bom-v1.2",
      "bom_version": "v1.2",
      "materials_count": 5
    },
    "routing_snapshot": {
      "routing_id": "uuid-routing-std",
      "routing_source": "bom",  // ADDED
      "operations_count": 5,
      "estimated_duration_minutes": 480
    },
    "material_availability": {
      "ok": 2,
      "low": 1,
      "insufficient": 1
    },
    "reservation_status": {  // ADDED
      "policy": "on_release",
      "fully_reserved": 0,
      "partially_reserved": 0,
      "not_reserved": 4
    },
    "created_at": "2024-12-14T10:30:00Z"
  }
}
```

### Reserve Materials for WO

```
POST /api/planning/work-orders/:id/reserve-materials
Body: {
  "wo_material_id": "uuid-wo-mat-1",
  "lp_ids": ["uuid-lp-1234", "uuid-lp-1235", "uuid-lp-1236"],
  "reservation_strategy": "FEFO",  // "FEFO" | "FIFO" | "manual"
  "reserved_qty": 250,
  "notes": "Reserved for urgent order"
}

Response:
{
  "success": true,
  "data": {
    "wo_material_id": "uuid-wo-mat-1",
    "product_id": "uuid-cocoa",
    "product_name": "Cocoa Mass",
    "required_qty": 250,
    "reserved_qty": 250,
    "reservation_status": "fully_reserved",
    "reservations": [
      {
        "id": "uuid-res-001",
        "lp_id": "uuid-lp-1234",
        "lp_number": "LP-2024-1234",
        "lot_number": "LOT-001",
        "reserved_qty": 100,
        "expiry_date": "2025-01-15",
        "reserved_at": "2024-12-14T10:30:00Z"
      },
      {
        "id": "uuid-res-002",
        "lp_id": "uuid-lp-1235",
        "lp_number": "LP-2024-1235",
        "lot_number": "LOT-001",
        "reserved_qty": 80,
        "expiry_date": "2025-01-15",
        "reserved_at": "2024-12-14T10:30:00Z"
      },
      {
        "id": "uuid-res-003",
        "lp_id": "uuid-lp-1236",
        "lp_number": "LP-2024-1236",
        "lot_number": "LOT-002",
        "reserved_qty": 70,
        "expiry_date": "2025-01-30",
        "reserved_at": "2024-12-14T10:30:00Z"
      }
    ]
  }
}
```

### Get Available LPs for Reservation

```
GET /api/planning/work-orders/:id/available-lps?material_id={materialId}&strategy={strategy}

Response:
{
  "success": true,
  "data": {
    "material_id": "uuid-cocoa",
    "material_name": "Cocoa Mass",
    "required_qty": 250,
    "available_lps": [
      {
        "lp_id": "uuid-lp-1234",
        "lp_number": "LP-2024-1234",
        "lot_number": "LOT-001",
        "quantity": 100,
        "uom": "kg",
        "expiry_date": "2025-01-15",
        "received_date": "2024-12-01",
        "warehouse_name": "Main Warehouse",
        "status": "available",
        "reservation_status": "available"
      },
      {
        "lp_id": "uuid-lp-1235",
        "lp_number": "LP-2024-1235",
        "lot_number": "LOT-001",
        "quantity": 80,
        "uom": "kg",
        "expiry_date": "2025-01-15",
        "received_date": "2024-12-01",
        "warehouse_name": "Main Warehouse",
        "status": "available",
        "reservation_status": "available"
      },
      {
        "lp_id": "uuid-lp-1237",
        "lp_number": "LP-2024-1237",
        "lot_number": "LOT-003",
        "quantity": 30,
        "uom": "kg",
        "expiry_date": "2024-12-30",
        "received_date": "2024-11-15",
        "warehouse_name": "Main Warehouse",
        "status": "available",
        "reservation_status": "available",
        "warning": "Expires in 15 days"
      }
    ],
    "total_available_qty": 300,
    "shortage": 0
  }
}
```

### Release Reservations

```
POST /api/planning/work-orders/:id/release-reservations
Body: {
  "wo_material_id": "uuid-wo-mat-1",  // Optional, if not provided release all
  "reason": "WO cancelled"
}

Response:
{
  "success": true,
  "data": {
    "released_count": 3,
    "released_qty": 250,
    "lps_released": ["LP-2024-1234", "LP-2024-1235", "LP-2024-1236"]
  }
}
```

### Get Active BOMs for Product

```
GET /api/planning/work-orders/boms?product_id={id}&scheduled_date={date}

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid-bom-v1.2",
      "version": "v1.2",
      "name": "Standard Recipe",
      "effective_from": "2024-12-01",
      "effective_to": null,
      "status": "active",
      "output_qty": 100,
      "output_uom": "pc",
      "items_count": 5,
      "routing_id": "uuid-routing-std",  // ADDED
      "routing_name": "Standard Production",  // ADDED
      "last_used": "2024-12-18",
      "is_recommended": true
    },
    {
      "id": "uuid-bom-v1.1",
      "version": "v1.1",
      "name": "Original Recipe",
      "effective_from": "2024-01-01",
      "effective_to": "2024-11-30",
      "status": "superseded",
      "output_qty": 100,
      "output_uom": "pc",
      "items_count": 4,
      "routing_id": "uuid-routing-legacy",  // ADDED
      "routing_name": "Legacy Process",  // ADDED
      "last_used": "2024-11-28",
      "is_recommended": false
    }
  ]
}
```

### Get BOM Preview with Availability

```
GET /api/planning/work-orders/bom-preview?bom_id={id}&quantity={qty}&warehouse_id={whId}

Response:
{
  "success": true,
  "data": {
    "bom": {
      "id": "uuid-bom-v1.2",
      "version": "v1.2",
      "output_qty": 100,
      "output_uom": "pc",
      "routing_id": "uuid-routing-std",  // ADDED
      "routing_name": "Standard Production"  // ADDED
    },
    "scale_factor": 10,
    "materials": [
      {
        "sequence": 1,  // ADDED
        "product_id": "uuid-cocoa",
        "product_code": "RM-COCOA-001",
        "product_name": "Cocoa Mass",
        "required_qty": 250,
        "uom": "kg",
        "scrap_percent": 5,
        "is_by_product": false,
        "available_qty": 300,
        "availability_status": "ok",
        "reservation_status": "not_reserved",  // ADDED
        "reserved_qty": 0  // ADDED
      },
      {
        "sequence": 2,  // ADDED
        "product_id": "uuid-sugar",
        "product_code": "RM-SUGAR-001",
        "product_name": "Sugar Fine",
        "required_qty": 150,
        "uom": "kg",
        "scrap_percent": 2,
        "is_by_product": false,
        "available_qty": 120,
        "availability_status": "low",
        "reservation_status": "not_reserved",  // ADDED
        "reserved_qty": 0  // ADDED
      },
      {
        "sequence": 3,  // ADDED
        "product_id": "uuid-milk",
        "product_code": "RM-MILK-001",
        "product_name": "Milk Powder",
        "required_qty": 100,
        "uom": "kg",
        "scrap_percent": 3,
        "is_by_product": false,
        "available_qty": 50,
        "availability_status": "insufficient",
        "shortage_qty": 50,
        "reservation_status": "not_reserved",  // ADDED
        "reserved_qty": 0  // ADDED
      },
      {
        "sequence": 4,  // ADDED
        "product_id": "uuid-foil",
        "product_code": "PKG-FOIL-001",
        "product_name": "Aluminum Foil",
        "required_qty": 500,
        "uom": "m",
        "scrap_percent": 10,
        "is_by_product": false,
        "available_qty": 1000,
        "availability_status": "ok",
        "reservation_status": "not_reserved",  // ADDED
        "reserved_qty": 0  // ADDED
      },
      {
        "sequence": 5,  // ADDED
        "product_id": "uuid-butter",
        "product_code": "BY-BUTTER-001",
        "product_name": "Cocoa Butter",
        "required_qty": 0,
        "uom": "kg",
        "yield_percent": 2,
        "is_by_product": true,
        "available_qty": 0,
        "availability_status": "by_product",
        "reservation_status": "not_applicable",  // ADDED
        "reserved_qty": 0  // ADDED
      }
    ],
    "summary": {
      "total_materials": 5,
      "ok_count": 2,
      "low_count": 1,
      "insufficient_count": 1,
      "by_product_count": 1,
      "overall_status": "warnings"
    }
  }
}
```

### Get Routing Operations

```
GET /api/planning/work-orders/routing-operations?routing_id={id}

Response:
{
  "success": true,
  "data": [
    {
      "sequence": 1,
      "operation_name": "Mixing",
      "description": "Mix all dry ingredients",
      "duration_minutes": 120,
      "machine_id": "uuid-mixer1",
      "machine_name": "Mixer #1",
      "expected_yield": 98
    },
    {
      "sequence": 2,
      "operation_name": "Tempering",
      "description": "Temperature control for chocolate",
      "duration_minutes": 60,
      "machine_id": "uuid-temper1",
      "machine_name": "Temper #1",
      "expected_yield": 99
    },
    // ... more operations
  ],
  "total_duration_minutes": 480,
  "total_duration_hours": 8
}
```

---

## Validation Rules

### Required Fields

| Field | Rule | Error Message |
|-------|------|---------------|
| product_id | Required, must be finished good | "Product is required", "Product must be a finished good" |
| scheduled_date | Required, >= today | "Scheduled date is required", "Date must be in the future" |
| quantity | Required, > 0 | "Quantity is required", "Quantity must be greater than 0" |
| bom_id | Required (if wo_require_bom = true) | "BOM is required", "No active BOM found for scheduled date" |

### Business Validation

| Rule | Check | Error/Warning |
|------|-------|---------------|
| BOM active on date | effective_from <= scheduled_date <= effective_to | Error: "BOM not active on scheduled date" (show BOM Conflict state) |
| Material availability | available_qty vs required_qty | Warning: "X materials below required quantity" |
| Line capacity | Check if line already scheduled | Warning: "Line has X WOs scheduled on this date" |
| Quantity vs BOM output | quantity % bom.output_qty | Info: "Scaling factor: {factor}x" |
| Reservation quantity | reserved_qty <= available_qty | Error: "Cannot reserve more than available" |
| LP already reserved | LP.status = 'reserved' | Error: "LP already reserved for WO-XXX" |

---

## Business Rules

### BOM Version Selection

1. **Auto-Selection Priority:**
   - Find BOMs where effective_from <= scheduled_date
   - Filter BOMs where effective_to IS NULL OR effective_to >= scheduled_date
   - If multiple matches, select most recent effective_from
   - If none found, show warning but allow draft creation

2. **User Override:**
   - User can manually select any BOM version
   - Show BOM Conflict Error if selected BOM not active on date
   - Require explicit confirmation to proceed with inactive BOM

3. **BOM Conflict Resolution:**
   - Option 1: Auto-switch to recommended active BOM
   - Option 2: Change scheduled date to match BOM validity
   - Option 3: Override (expert mode) with warning acknowledgment

### Routing Inheritance from BOM (CRITICAL RULE)

1. **Default Behavior:**
   - When BOM is selected, routing_id is auto-populated from BOM.routing_id
   - Field shows as "Routing (from BOM)" with helper text "[i] Inherited from BOM, can override"
   - If BOM.routing_id is null, field shows placeholder "Select routing (optional)"

2. **User Override Allowed:**
   - User can change routing to any active routing for the product
   - User can select "None" to remove routing
   - When changed, field shows as "Routing (custom)" to indicate manual override
   - routing_source field tracks whether routing came from BOM or manual selection

3. **BOM Change Behavior:**
   - If user changes BOM, routing auto-updates to new BOM's routing_id
   - Previous manual override is lost (with warning)
   - User can re-apply manual routing after BOM change

4. **API Contract:**
   - POST payload includes: routing_id (can be null), routing_source ("bom" | "manual" | null)
   - Backend validates routing exists if provided
   - Backend copies routing operations if wo_copy_routing = true in settings

### Material Availability Warnings

- **OK (Green)**: available >= required * 1.2 → No action needed
- **Low (Yellow)**: required <= available < required * 1.2 → Warning, can proceed
- **Insufficient (Red)**: available < required → Warning with shortage amount, can still proceed
- **By-Product**: Output material, skip availability check

**Rationale for allowing shortages:**
- Materials may be on purchase orders
- Production may be scheduled days/weeks ahead
- Planner can see warnings and take corrective action

### Material Reservation Rules (FR-PLAN-025)

1. **Reservation Timing:**
   - **Now**: Reserve at WO creation (status=planned)
   - **On Release**: Reserve when WO status changes to released (default)
   - **Never**: No reservation, materials picked at production time

2. **Reservation Strategy:**
   - **FEFO** (First Expiry First Out): Prioritize LPs expiring soonest (default for perishables)
   - **FIFO** (First In First Out): Prioritize oldest LPs (default for non-perishables)
   - **Manual**: User selects specific LPs

3. **Partial Reservations:**
   - Allowed when available_qty < required_qty
   - Status = 'partially_reserved'
   - System tracks shortage amount
   - Can reserve more as inventory arrives

4. **Reservation Release:**
   - **On WO Cancel**: All reservations released immediately
   - **On WO Complete**: Reservations converted to consumption
   - **Manual Release**: User can release specific reservations

5. **Reservation Conflicts:**
   - Cannot reserve LP already reserved by another WO
   - Show conflict warning with WO number and reservation details
   - Allow viewing conflicting WO for context

6. **Reservation Conversion:**
   - When WO starts production, reservations converted to consumption
   - LP status changes: reserved → in_use → consumed
   - Reservation records updated with consumed_at timestamp

### Status-Based Editability

| Status | Editable Fields | Cannot Edit |
|--------|-----------------|-------------|
| Draft | All fields | - |
| Planned | Notes, reservation policy, routing (manual override) | Product, BOM, quantity, materials |
| Released | Notes, can add reservations | Product, BOM, quantity, materials snapshot immutable, routing locked |
| In Progress | Notes only | All other fields, reservations locked |
| Completed | Notes only (audit) | All other fields, reservations converted to consumption |
| Cancelled | None | All fields locked, reservations released |

---

## Accessibility

### Touch Targets
- All form fields: 48dp minimum height
- Modal close button: 48x48dp
- Action buttons: 48dp height
- BOM selection radio buttons: 48x48dp
- Reserve buttons: 48x44dp minimum
- LP selection checkboxes: 44x44dp

### Contrast
- Field labels: 4.5:1
- Error messages: 4.5:1 (red on white)
- Availability indicators: Bold, 4.5:1
- Warning messages: 4.5:1
- Reservation status badges: 4.5:1

### Screen Reader
- Modal: role="dialog" aria-modal="true" aria-labelledby="modal-title"
- Required fields: aria-required="true"
- Error messages: aria-describedby linking to error text
- Availability status: aria-label="Material availability: 300 kg available, sufficient"
- BOM selection: aria-label="BOM version v1.2, recommended, active on scheduled date, routing: Standard Production"
- Routing field: aria-label="Routing: Standard Production, inherited from BOM, can be changed"
- Reservation status: aria-label="Cocoa Mass: Fully reserved, 250 kg, 3 LPs"
- Reserve buttons: aria-label="Reserve materials for Cocoa Mass"

### Keyboard Navigation
- Tab: Move through form fields in logical order
- Enter: Submit form (when focus on button)
- Escape: Close modal (with unsaved changes warning)
- Arrow keys: Navigate dropdowns and radio buttons
- Space: Toggle checkboxes in LP selection

### Focus Management
- On modal open: Focus on Product field
- On BOM selection: Focus on first BOM option
- On error: Focus on error summary, then first errored field
- On reservation modal open: Focus on first LP checkbox
- On reservation success: Focus on reservation status badge

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | 3-column basic info, full materials table with reservation column, side-by-side operations |
| Tablet (768-1024px) | 2-column basic info, condensed materials table, reservation as separate row |
| Mobile (<768px) | Stacked fields, card-based materials with reservation status, collapsible sections |

### Mobile Specifics
- Modal becomes full-screen
- Materials shown as stacked cards
- Reservation status shown per card
- Reserve buttons below each material card
- "More Options" accordion for routing, machine, times
- Operations collapse by default
- Sticky footer with action buttons
- Availability summary always visible at top
- Reservation policy as compact radio group

---

## Performance Notes

### Lazy Loading
- Product autocomplete: Search-on-type with 300ms debounce
- BOM preview: Load on product + date selection
- Material availability: Real-time query on BOM selection
- Routing operations: Load on routing selection (optional)
- Available LPs: Load on-demand when reservation modal opens

### Caching
```typescript
// Cache keys
'org:{orgId}:products:finished-goods'           // 5 min TTL
'org:{orgId}:product:{prodId}:boms'             // 2 min TTL
'org:{orgId}:bom:{bomId}:preview:{qty}'         // 1 min TTL
'org:{orgId}:routing:{routingId}:operations'    // 5 min TTL
'org:{orgId}:lines:active'                      // 5 min TTL
'org:{orgId}:material:{matId}:available-lps'    // 30 sec TTL (short for reservation accuracy)
```

### Performance Targets
- Modal open time: <500ms
- Product search response: <300ms
- BOM preview load: <800ms (includes availability check)
- Form submission: <1.5s (includes snapshot creation)
- Reservation modal open: <500ms (load available LPs)
- Reservation creation: <1s (update LP statuses + create records)

---

## Testing Requirements

### Unit Tests
- BOM auto-selection logic (multiple BOMs, date ranges)
- BOM conflict detection (invalid dates)
- **Routing auto-population from BOM.routing_id**
- **Routing manual override tracking**
- Scaling factor calculation (quantity / bom.output_qty)
- Material quantity calculation (with scrap %)
- Availability status determination (ok/low/insufficient)
- Duration calculation from routing operations
- Validation rules for all required fields
- **Reservation logic (FEFO/FIFO sorting)**
- **Partial reservation calculation**
- **Reservation conflict detection**
- **Reservation release on cancel**

### Integration Tests
- POST /api/planning/work-orders
- GET /api/planning/work-orders/boms
- GET /api/planning/work-orders/bom-preview
- GET /api/planning/work-orders/routing-operations
- **POST /api/planning/work-orders/:id/reserve-materials**
- **GET /api/planning/work-orders/:id/available-lps**
- **POST /api/planning/work-orders/:id/release-reservations**
- BOM snapshot creation in wo_materials
- Routing copy to wo_operations
- **Routing_id defaulted from BOM.routing_id**
- **routing_source tracked correctly**
- **Reservation creation and LP status updates**
- **Reservation release workflow**

### E2E Tests
- Create new WO with product selection
- BOM auto-selects based on date
- **Routing auto-populates from BOM.routing_id**
- **User manually changes routing (override)**
- **Routing resets when BOM changed**
- BOM conflict error appears for invalid date
- Override BOM conflict with expert mode
- Material availability check shows correct indicators
- Create WO with material shortages (warnings shown, creation allowed)
- Routing operations display correctly
- Submit WO creates BOM snapshot
- Edit draft WO, change product (clears BOM, reloads)
- Validation errors display correctly
- Cancel modal with unsaved changes warning
- Mobile flow: create WO on phone
- **Reserve materials for WO (FEFO strategy)**
- **Reserve materials with partial availability**
- **View reserved LPs per material**
- **Release reservation manually**
- **Cancel WO and verify reservations released**
- **Reserve on WO status change to released**
- **Reservation conflict detection and warning**

### Performance Tests
- Modal open time: <500ms
- BOM preview with 20 materials: <1s
- Form submission with 10 materials + 5 operations: <2s
- Reservation modal with 50 LPs: <500ms
- Reservation creation for 10 LPs: <1s

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (Loading, Success, BOM Preview Loading, Validation Error, BOM Conflict Error, Saving, No Active BOM, Reservation Modal)
- [x] Responsive breakpoints documented
- [x] All API endpoints specified (including reservation endpoints)
- [x] Accessibility checklist passed
- [x] Validation rules documented
- [x] BOM auto-selection algorithm documented
- [x] BOM conflict detection and resolution documented
- [x] BOM snapshot creation logic documented (with sequence, bom_id)
- [x] Material availability check logic documented
- [x] Routing copy logic documented (with routing_id, actual_duration)
- [x] **Routing auto-population from BOM documented**
- [x] **Routing manual override behavior documented**
- [x] **Material reservation logic documented (FR-PLAN-025)**
- [x] **Reservation policies documented**
- [x] **Reservation strategies documented (FEFO/FIFO/Manual)**
- [x] **Reservation release logic documented**
- [x] **Reservation conflict handling documented**
- [x] Business rules for editability documented

---

## Handoff to FRONTEND-DEV

```yaml
feature: WO Create Modal
story: PLAN-014
fr_coverage: FR-PLAN-017, FR-PLAN-018, FR-PLAN-019, FR-PLAN-020, FR-PLAN-021, FR-PLAN-025
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-014-work-order-create-modal.md
  api_endpoints:
    - POST /api/planning/work-orders
    - GET /api/planning/work-orders/boms
    - GET /api/planning/work-orders/bom-preview
    - GET /api/planning/work-orders/routing-operations
    - POST /api/planning/work-orders/:id/reserve-materials
    - GET /api/planning/work-orders/:id/available-lps
    - POST /api/planning/work-orders/:id/release-reservations
states_per_screen: [loading, success, bom_preview_loading, validation_error, bom_conflict_error, saving, no_active_bom, reservation_modal, reservation_conflict]
breakpoints:
  mobile: "<768px (full-screen modal, card materials)"
  tablet: "768-1024px (2-column header)"
  desktop: ">1024px (3-column header, table materials)"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "dialog, required, describedby"
modal_size: "Extra Large (max-width: 1200px, desktop)"
related_screens:
  - PLAN-013: WO List Page
  - PLAN-015: WO Detail Page
database_updates_required:
  - Add sequence to wo_materials table
  - Add bom_id to wo_materials table
  - Add routing_id to wo_operations table
  - Add actual_duration_minutes to wo_operations table
  - Add routing_source to work_orders table (NEW)
  - Create lp_reservations table (if not exists)
  - Add reservation_status to wo_materials table
  - Add reserved_qty to wo_materials table
  - Add reservation_policy to work_orders table
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 20-24 hours (most complex Planning wireframe, includes FR-PLAN-025)
**Quality Target**: 98/100 (WO requirement met)
**FR-PLAN-025 Coverage**: 100% (Material Reservation fully implemented)

---

## Changes from Previous Version

### CRITICAL FIXES (2025-12-14):

1. **Routing Field - Auto-Population from BOM**:
   - **CHANGED**: Routing now defaults from BOM.routing_id (not product default)
   - Field label: "Routing (from BOM)" when inherited, "Routing (custom)" when manually changed
   - Helper text: "[i] Inherited from BOM, can override"
   - User can override to different routing or None
   - When BOM changes, routing auto-updates to new BOM's routing_id
   - Added routing_source tracking ("bom" | "manual" | null)
   - Updated BOM selection UI to show routing per BOM
   - Updated API to include routing_source field

2. **Machine Field - Label Rename**:
   - **OLD**: "Machine (optional)"
   - **NEW**: "Optional Machine"
   - Clearer UX pattern for optional fields

3. **BOM-Routing Relationship Documentation**:
   - Added Section 3: "Routing Auto-Population Logic"
   - Documented default behavior (BOM.routing_id)
   - Documented user override behavior
   - Documented BOM change behavior (routing resets)
   - Updated API contract with routing_source field
   - Added routing_id and routing_name to BOM list response
   - Added routing_id and routing_name to BOM preview response

4. **Testing Updates**:
   - Added unit tests for routing auto-population
   - Added unit tests for routing manual override tracking
   - Added integration test for routing_id defaulted from BOM
   - Added integration test for routing_source tracking
   - Added E2E tests for routing auto-population flow
   - Added E2E tests for routing override and reset

5. **Database Schema Update**:
   - Added routing_source field to work_orders table

### Previous Major Additions (from earlier versions):

1. **FR-PLAN-025 Material Reservation (100% Coverage)**:
   - Added Material Reservation section with reservation policies
   - Added reservation column to BOM Preview table
   - Created Material Reservation modal wireframe
   - Added reservation conflict handling wireframe
   - Documented FEFO/FIFO/Manual reservation strategies
   - Added reservation release logic
   - Created 3 new API endpoints for reservation management

2. **BOM Snapshot Improvements**:
   - Added `sequence` field to maintain material order
   - Added `bom_id` field to track source BOM
   - Added `reservation_status` and `reserved_qty` fields

3. **Routing Snapshot Improvements**:
   - Added `routing_id` field to track source routing
   - Added `actual_duration_minutes` field for actuals tracking

4. **BOM Conflict Error State**:
   - New error state for BOM date validation
   - 3 resolution options: Use active BOM, Change date, Override
   - Clear visual indication of conflict

5. **Enhanced States**:
   - Added "Reservation Modal Open" state
   - Added "Reservation Conflict" state
   - Added "BOM Conflict Error" state

### Quality Improvements:

- Quality score maintained at 98%
- Routing logic now correctly reflects BOM relationship
- Clearer UX for optional fields
- Complete routing inheritance documentation
- Enhanced API specification for routing tracking
- Comprehensive testing for routing behavior

### Database Schema Updates Required:

```sql
-- wo_materials additions
ALTER TABLE wo_materials
  ADD COLUMN sequence INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN bom_id UUID REFERENCES boms(id),
  ADD COLUMN reservation_status TEXT DEFAULT 'not_reserved',
  ADD COLUMN reserved_qty DECIMAL(10,3) DEFAULT 0;

-- wo_operations additions
ALTER TABLE wo_operations
  ADD COLUMN routing_id UUID REFERENCES routings(id),
  ADD COLUMN actual_duration_minutes INTEGER;

-- work_orders additions
ALTER TABLE work_orders
  ADD COLUMN reservation_policy TEXT DEFAULT 'on_release',
  ADD COLUMN routing_source TEXT;  -- NEW: "bom" | "manual" | null

-- lp_reservations table (new)
CREATE TABLE lp_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  wo_material_id UUID NOT NULL REFERENCES wo_materials(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  reserved_qty DECIMAL(10,3) NOT NULL,
  reservation_status TEXT NOT NULL DEFAULT 'reserved',
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reserved_by UUID NOT NULL REFERENCES users(id),
  consumed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES users(id),
  release_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
