# PLAN-027: WO Material Availability Panel

**Module**: Planning
**Feature**: Material Availability Check for Work Orders (FR-PLAN-021)
**Status**: Ready for Review
**Last Updated**: 2026-01-08
**Story**: 03.13 - WO Material Availability Check

---

## Overview

This wireframe defines the UI components for checking material availability on Work Orders. The panel displays real-time inventory status with traffic light indicators, allowing planners to make informed decisions about production scheduling.

**Components Defined:**
1. WOAvailabilityPanel - Main container panel
2. AvailabilityMaterialRow - Individual material availability row
3. AvailabilityTrafficLight - Status indicator (Green/Yellow/Red)
4. AvailabilitySummaryCard - Header with overall status
5. AvailabilityWarningModal - Shortage warning confirmation

---

## Component 1: WOAvailabilityPanel

### Success State (Desktop)

```
+--------------------------------------------------------------------------------------------------+
|  +-------------------------------- AVAILABILITY CHECK ----------------------------------------+   |
|  |                                                                                            |   |
|  |  +---------------------------- SUMMARY CARD ------------------------------------------+   |   |
|  |  |  [O] Material Availability                           Last checked: 2 min ago [R]   |   |   |
|  |  |                                                                                     |   |   |
|  |  |  +----------------+  +----------------+  +----------------+  +----------------+     |   |   |
|  |  |  | Total          |  | [O] Sufficient |  | [O] Low Stock  |  | [O] Shortage   |     |   |   |
|  |  |  | Materials      |  |                |  |                |  |                |     |   |   |
|  |  |  |      10        |  |       6        |  |       3        |  |       1        |     |   |   |
|  |  |  |                |  |                |  |                |  |                |     |   |   |
|  |  |  +----------------+  +----------------+  +----------------+  +----------------+     |   |   |
|  |  |                                                                                     |   |   |
|  |  |  Overall Status: [O] LOW STOCK - 3 materials need attention                        |   |   |
|  |  +-------------------------------------------------------------------------------------+   |   |
|  |                                                                                            |   |
|  |  +------------------------ MATERIALS LIST ---------------------------------------------+   |   |
|  |  |                                                                                     |   |   |
|  |  | Filter: [All v]  Search: [                        ]                                |   |   |
|  |  |                                                                                     |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | St | Material              | Required  | Available | Shortage  | Coverage | UOM | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Cocoa Mass            | 250.00    | 300.00    | -50.00    | 120%     | kg  | |   |   |
|  |  | |    | RM-COCOA-001          |           |           | (surplus) |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Sugar Fine            | 150.00    | 150.00    | 0.00      | 100%     | kg  | |   |   |
|  |  | |    | RM-SUGAR-001          |           |           |           |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Milk Powder           | 100.00    | 75.00     | 25.00     | 75%      | kg  | |   |   |
|  |  | |    | RM-MILK-001           |           | (15 exp.) |           |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Vanilla Extract       | 5.00      | 5.50      | -0.50     | 110%     | L   | |   |   |
|  |  | |    | RM-VAN-001            |           |           | (surplus) |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Cocoa Butter          | 50.00     | 22.00     | 28.00     | 44%      | kg  | |   |   |
|  |  | |    | RM-BUTTER-001         |           | [!] Low   |           |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Lecithin              | 2.50      | 2.50      | 0.00      | 100%     | kg  | |   |   |
|  |  | |    | RM-LECI-001           |           |           |           |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Aluminum Foil         | 500.00    | 600.00    | -100.00   | 120%     | m   | |   |   |
|  |  | |    | PKG-FOIL-001          |           |           | (surplus) |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Cardboard Box         | 100.00    | 80.00     | 20.00     | 80%      | pc  | |   |   |
|  |  | |    | PKG-BOX-001           |           |           |           |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Label Sticker         | 1000.00   | 1200.00   | -200.00   | 120%     | pc  | |   |   |
|  |  | |    | PKG-LABEL-001         |           |           | (surplus) |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [O]| Shrink Wrap           | 200.00    | 150.00    | 50.00     | 75%      | m   | |   |   |
|  |  | |    | PKG-WRAP-001          |           |           |           |          |     | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  |                                                                                     |   |   |
|  |  | Showing 10 of 10 materials                                                          |   |   |
|  |  |                                                                                     |   |   |
|  |  +-------------------------------------------------------------------------------------+   |   |
|  |                                                                                            |   |
|  |  Legend: [O] Green = Sufficient (>=100%)  [O] Yellow = Low Stock (50-99%)                 |   |
|  |          [O] Red = Shortage (<50%)                                                         |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+

[O] = Traffic light indicator (colored circle)
[R] = Refresh button
[!] = Warning icon
```

### Success State (Mobile < 768px)

```
+----------------------------------+
|  Material Availability      [R]  |
|  Last checked: 2 min ago         |
+----------------------------------+
|                                  |
|  +----------------------------+  |
|  | [O] Overall: LOW STOCK     |  |
|  | 3 materials need attention |  |
|  +----------------------------+  |
|                                  |
|  +------+ +------+ +------+     |
|  | 10   | | 6    | | 3    |     |
|  | Total| | [O]  | | [O]  |     |
|  +------+ +------+ +------+     |
|           | Suff | | Low  |     |
|           +------+ +------+     |
|  +------+                       |
|  | 1    |                       |
|  | [O]  |                       |
|  +------+                       |
|  | Short|                       |
|  +------+                       |
|                                  |
|  Filter: [All v]                |
|                                  |
|  +----------------------------+  |
|  | [O] Cocoa Mass             |  |
|  | RM-COCOA-001               |  |
|  | Required: 250.00 kg        |  |
|  | Available: 300.00 kg       |  |
|  | Coverage: 120% (surplus)   |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [O] Sugar Fine             |  |
|  | RM-SUGAR-001               |  |
|  | Required: 150.00 kg        |  |
|  | Available: 150.00 kg       |  |
|  | Coverage: 100%             |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [O] Milk Powder            |  |
|  | RM-MILK-001                |  |
|  | Required: 100.00 kg        |  |
|  | Available: 75.00 kg        |  |
|  | Coverage: 75%              |  |
|  | (15 kg excluded - expired) |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [O] Cocoa Butter           |  |
|  | RM-BUTTER-001              |  |
|  | Required: 50.00 kg         |  |
|  | Available: 22.00 kg        |  |
|  | Coverage: 44% SHORTAGE     |  |
|  | Shortage: 28.00 kg         |  |
|  +----------------------------+  |
|                                  |
|  [Load More - 6 remaining]       |
|                                  |
+----------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  +-------------------------------- AVAILABILITY CHECK ----------------------------------------+   |
|  |                                                                                            |   |
|  |  +---------------------------- SUMMARY CARD ------------------------------------------+   |   |
|  |  |  [Spinner] Checking material availability...                                       |   |   |
|  |  |                                                                                     |   |   |
|  |  |  +----------------+  +----------------+  +----------------+  +----------------+     |   |   |
|  |  |  | [==========]   |  | [==========]   |  | [==========]   |  | [==========]   |     |   |   |
|  |  |  | [========]     |  | [========]     |  | [========]     |  | [========]     |     |   |   |
|  |  |  +----------------+  +----------------+  +----------------+  +----------------+     |   |   |
|  |  |                                                                                     |   |   |
|  |  +-------------------------------------------------------------------------------------+   |   |
|  |                                                                                            |   |
|  |  +------------------------ MATERIALS LIST ---------------------------------------------+   |   |
|  |  |                                                                                     |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [======================================================================]        | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [======================================================================]        | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [======================================================================]        | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [======================================================================]        | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  | | [======================================================================]        | |   |   |
|  |  | +---------------------------------------------------------------------------------+ |   |   |
|  |  |                                                                                     |   |   |
|  |  | Loading material availability data...                                               |   |   |
|  |  |                                                                                     |   |   |
|  |  +-------------------------------------------------------------------------------------+   |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
+--------------------------------------------------------------------------------------------------+

Note: Skeleton loaders shown as [======] blocks
Progress > 3 seconds shows: "Calculating availability for X materials..."
```

### Empty State (No Materials in WO)

```
+--------------------------------------------------------------------------------------------------+
|  +-------------------------------- AVAILABILITY CHECK ----------------------------------------+   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  |                                      [Package Icon]                                        |   |
|  |                                                                                            |   |
|  |                                   No Materials to Check                                    |   |
|  |                                                                                            |   |
|  |              This Work Order has no materials in its BOM snapshot.                        |   |
|  |              Material availability check requires at least one material.                   |   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  |                              [View BOM]     [Add Materials]                               |   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  +-------------------------------- AVAILABILITY CHECK ----------------------------------------+   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  |                                    [Warning Icon]                                          |   |
|  |                                                                                            |   |
|  |                           Failed to Check Material Availability                            |   |
|  |                                                                                            |   |
|  |            Unable to retrieve inventory data. This may be due to a network                |   |
|  |            issue or server error. The WO can still be saved without availability check.   |   |
|  |                                                                                            |   |
|  |                              Error: AVAILABILITY_CHECK_FAILED                             |   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  |                           [Retry]     [Continue Without Check]                            |   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
+--------------------------------------------------------------------------------------------------+
```

### Disabled State (Setting Off)

```
+--------------------------------------------------------------------------------------------------+
|  +-------------------------------- AVAILABILITY CHECK ----------------------------------------+   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  |                                      [Info Icon]                                           |   |
|  |                                                                                            |   |
|  |                          Material Availability Check Disabled                              |   |
|  |                                                                                            |   |
|  |            Material availability checking is disabled in Planning Settings.               |   |
|  |            Contact your administrator to enable this feature.                              |   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  |                                 [Go to Settings]                                           |   |
|  |                                                                                            |   |
|  |                                                                                            |   |
|  +--------------------------------------------------------------------------------------------+   |
+--------------------------------------------------------------------------------------------------+

Note: This state shown when planning_settings.wo_material_check = false
```

---

## Component 2: AvailabilityMaterialRow

### Row States

```
SUFFICIENT (Green) - Coverage >= 100%
+---------------------------------------------------------------------------------+
| [O] | Cocoa Mass            | 250.00    | 300.00    | -50.00    | 120%     | kg  |
|     | RM-COCOA-001          |           |           | (surplus) |          |     |
+---------------------------------------------------------------------------------+
- Traffic light: Green circle
- Shortage shows as negative (surplus) in green text
- Coverage shows percentage

LOW STOCK (Yellow) - Coverage 50-99%
+---------------------------------------------------------------------------------+
| [O] | Milk Powder           | 100.00    | 75.00     | 25.00     | 75%      | kg  |
|     | RM-MILK-001           |           | (15 exp.) |           |          |     |
+---------------------------------------------------------------------------------+
- Traffic light: Yellow circle
- Shortage in black text
- Shows expired qty excluded in parentheses (15 exp.)

SHORTAGE (Red) - Coverage < 50%
+---------------------------------------------------------------------------------+
| [O] | Cocoa Butter          | 50.00     | 22.00     | 28.00     | 44%      | kg  |
|     | RM-BUTTER-001         |           | [!] Low   |           |          |     |
+---------------------------------------------------------------------------------+
- Traffic light: Red circle
- Shortage in red text
- Warning icon [!] indicates critical

NO STOCK (Red) - Coverage = 0%
+---------------------------------------------------------------------------------+
| [O] | New Ingredient        | 100.00    | 0.00      | 100.00    | 0%       | kg  |
|     | RM-NEW-001            |           | No Stock  |           |          |     |
+---------------------------------------------------------------------------------+
- Traffic light: Red circle (filled)
- "No Stock" text displayed
- Coverage 0%
```

### Row Hover State (Desktop)

```
+---------------------------------------------------------------------------------+
| [O] | Cocoa Butter          | 50.00     | 22.00     | 28.00     | 44%      | kg  |
|     | RM-BUTTER-001         |           | [!] Low   |           |          |     |
+---------------------------------------------------------------------------------+
       ^
       | Tooltip appears on hover:
       +--------------------------------------------------------+
       | SHORTAGE - Available stock covers 44% of requirement   |
       |                                                        |
       | Available: 22.00 kg                                    |
       | Reserved by others: 8.00 kg                            |
       | Excluded (expired): 5.00 kg                            |
       | Net available: 22.00 kg                                |
       |                                                        |
       | Need: 28.00 kg more to fulfill requirement             |
       +--------------------------------------------------------+
```

### Mobile Row (Card Layout)

```
+----------------------------+
| [O] Cocoa Butter           |
| RM-BUTTER-001              |
+----------------------------+
| Required      | 50.00 kg   |
| Available     | 22.00 kg   |
| Shortage      | 28.00 kg   |
| Coverage      | 44%        |
+----------------------------+
| [!] 5 kg excluded (expired)|
| [!] 8 kg reserved by others|
+----------------------------+
```

---

## Component 3: AvailabilityTrafficLight

### Traffic Light Variants

```
SUFFICIENT (Green)
+-------+
|  [O]  |   <- Solid green circle
|       |      Color: #22c55e (green-500)
+-------+      Tooltip: "Sufficient - Stock available"

LOW STOCK (Yellow)
+-------+
|  [O]  |   <- Solid yellow/amber circle
|       |      Color: #eab308 (yellow-500)
+-------+      Tooltip: "Low Stock - 50-99% available"

SHORTAGE (Red)
+-------+
|  [O]  |   <- Solid red circle
|       |      Color: #ef4444 (red-500)
+-------+      Tooltip: "Shortage - Less than 50% available"

NO STOCK (Red Outline)
+-------+
|  (O)  |   <- Red circle outline only
|       |      Color: #ef4444 (red-500)
+-------+      Tooltip: "No Stock - 0% available"
```

### Inline Usage

```
Text with indicator:
"Material status: [O] Sufficient"
"Material status: [O] Low Stock"
"Material status: [O] Shortage"

Size variants:
- Small (16px): For table cells, inline text
- Medium (24px): For summary cards, headers
- Large (32px): For modal headers, emphasis

Accessibility:
- aria-label="Status: Sufficient, 120% coverage"
- role="img"
- Color + icon + text (not color alone)
```

---

## Component 4: AvailabilitySummaryCard

### Summary Card Variants

```
ALL SUFFICIENT (Green Overall)
+--------------------------------------------------------------------------------------------------+
|  [O] Material Availability                                         Last checked: 2 min ago [R]   |
|                                                                                                   |
|  +----------------+  +----------------+  +----------------+  +----------------+                  |
|  | Total          |  | [O] Sufficient |  | [O] Low Stock  |  | [O] Shortage   |                  |
|  | Materials      |  |                |  |                |  |                |                  |
|  |      10        |  |      10        |  |       0        |  |       0        |                  |
|  +----------------+  +----------------+  +----------------+  +----------------+                  |
|                                                                                                   |
|  Overall Status: [O] SUFFICIENT - All materials available                                        |
+--------------------------------------------------------------------------------------------------+

SOME LOW STOCK (Yellow Overall)
+--------------------------------------------------------------------------------------------------+
|  [O] Material Availability                                         Last checked: 2 min ago [R]   |
|                                                                                                   |
|  +----------------+  +----------------+  +----------------+  +----------------+                  |
|  | Total          |  | [O] Sufficient |  | [O] Low Stock  |  | [O] Shortage   |                  |
|  | Materials      |  |                |  |                |  |                |                  |
|  |      10        |  |       7        |  |       3        |  |       0        |                  |
|  +----------------+  +----------------+  +----------------+  +----------------+                  |
|                                                                                                   |
|  Overall Status: [O] LOW STOCK - 3 materials below 100%                                          |
+--------------------------------------------------------------------------------------------------+

SOME SHORTAGE (Red Overall)
+--------------------------------------------------------------------------------------------------+
|  [O] Material Availability                                         Last checked: 2 min ago [R]   |
|                                                                                                   |
|  +----------------+  +----------------+  +----------------+  +----------------+                  |
|  | Total          |  | [O] Sufficient |  | [O] Low Stock  |  | [O] Shortage   |                  |
|  | Materials      |  |                |  |                |  |                |                  |
|  |      10        |  |       6        |  |       3        |  |       1        |                  |
|  +----------------+  +----------------+  +----------------+  +----------------+                  |
|                                                                                                   |
|  Overall Status: [O] SHORTAGE - 1 material with critical shortage                                |
|                                                                                                   |
|  [!] Warning: Cocoa Butter has only 44% coverage (28 kg shortage)                                |
+--------------------------------------------------------------------------------------------------+

NO STOCK (Red Overall - Worst Case)
+--------------------------------------------------------------------------------------------------+
|  [O] Material Availability                                         Last checked: 2 min ago [R]   |
|                                                                                                   |
|  +----------------+  +----------------+  +----------------+  +----------------+                  |
|  | Total          |  | [O] Sufficient |  | [O] Low Stock  |  | [O] Shortage   |                  |
|  | Materials      |  |                |  |                |  |                |                  |
|  |      10        |  |       5        |  |       3        |  |       2        |                  |
|  +----------------+  +----------------+  +----------------+  +----------------+                  |
|                                                                                                   |
|  Overall Status: [O] NO STOCK - Some materials have zero inventory                               |
|                                                                                                   |
|  [!] Critical: New Ingredient has 0% coverage - no stock available                               |
|  [!] Critical: Cocoa Butter has 44% coverage - 28 kg shortage                                    |
+--------------------------------------------------------------------------------------------------+
```

### Cached Indicator

```
+--------------------------------------------------------------------------------------------------+
|  [O] Material Availability                      [Cached] Last checked: 2 min ago [R]             |
|                                                                                                   |
|  ...                                                                                              |
|                                                                                                   |
|  [i] Data cached. Refreshing in 28 seconds or click [R] to refresh now.                          |
+--------------------------------------------------------------------------------------------------+

[Cached] badge indicates data from Redis cache (30s TTL)
Shows countdown to next auto-refresh
```

---

## Component 5: AvailabilityWarningModal

### Warning Modal (Shortages Present)

```
+--------------------------------------------------------------------------------------------------+
|  +------------------------------------------------------------------------------------------------+
|  |                                                                                      [X]      |
|  |                                                                                               |
|  |                                    [Warning Icon - Large]                                     |
|  |                                                                                               |
|  |                              Material Shortages Detected                                      |
|  |                                                                                               |
|  |       You are about to release/save this Work Order with material shortages.                 |
|  |       Production may be delayed or incomplete without sufficient materials.                  |
|  |                                                                                               |
|  |  +-----------------------------------------------------------------------------------------+  |
|  |  | Materials with Issues:                                                                  |  |
|  |  |                                                                                         |  |
|  |  | [O] Cocoa Butter (RM-BUTTER-001)                                                        |  |
|  |  |     Required: 50.00 kg | Available: 22.00 kg | Shortage: 28.00 kg (44%)                |  |
|  |  |                                                                                         |  |
|  |  | [O] Milk Powder (RM-MILK-001)                                                          |  |
|  |  |     Required: 100.00 kg | Available: 75.00 kg | Shortage: 25.00 kg (75%)               |  |
|  |  |                                                                                         |  |
|  |  | [O] Cardboard Box (PKG-BOX-001)                                                         |  |
|  |  |     Required: 100.00 pc | Available: 80.00 pc | Shortage: 20.00 pc (80%)               |  |
|  |  +-----------------------------------------------------------------------------------------+  |
|  |                                                                                               |
|  |                                                                                               |
|  |                         Are you sure you want to proceed?                                    |
|  |                                                                                               |
|  |                                                                                               |
|  |  +-------------------+                                           +-------------------+       |
|  |  |      Cancel       |                                           | Proceed Anyway   |       |
|  |  +-------------------+                                           +-------------------+       |
|  |        (Primary)                                                      (Secondary)            |
|  |                                                                                               |
|  +------------------------------------------------------------------------------------------------+
+--------------------------------------------------------------------------------------------------+

Note:
- Modal appears when user clicks "Release" or "Save" with shortages
- "Cancel" returns to WO form (primary action - safer choice)
- "Proceed Anyway" continues with the action (secondary - caution)
```

### Mobile Warning Modal (Full Screen)

```
+----------------------------------+
|  [<] Material Shortages          |
+----------------------------------+
|                                  |
|      [Warning Icon - Large]      |
|                                  |
|  Material Shortages Detected     |
|                                  |
|  Production may be delayed or    |
|  incomplete without sufficient   |
|  materials.                      |
|                                  |
+----------------------------------+
|  Materials with Issues:          |
|                                  |
|  +----------------------------+  |
|  | [O] Cocoa Butter           |  |
|  | Required: 50.00 kg         |  |
|  | Available: 22.00 kg        |  |
|  | Shortage: 28.00 kg (44%)   |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [O] Milk Powder            |  |
|  | Required: 100.00 kg        |  |
|  | Available: 75.00 kg        |  |
|  | Shortage: 25.00 kg (75%)   |  |
|  +----------------------------+  |
|                                  |
|  +----------------------------+  |
|  | [O] Cardboard Box          |  |
|  | Required: 100.00 pc        |  |
|  | Available: 80.00 pc        |  |
|  | Shortage: 20.00 pc (80%)   |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
|  [    Cancel    ]                |
|  [  Proceed Anyway  ]            |
+----------------------------------+
```

### No Warning (All Sufficient)

```
When all materials have sufficient coverage (>=100%),
the modal does NOT appear. Action proceeds directly.

User flow:
1. User clicks "Release" or "Save"
2. System checks availability
3. All materials sufficient -> Action proceeds
4. Success toast: "Work Order released successfully"
```

---

## Integration with WO Detail Page (PLAN-015)

### Placement in WO Detail

```
+--------------------------------------------------------------------------------------------------+
|  Planning > Work Orders > WO-2024-00156                           [Edit] [Actions v] [Print]     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +-------------------------------- HEADER INFO -------------------------------------------------+  |
|  |  (Existing header content from PLAN-015)                                                     |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- AVAILABILITY CHECK ------------------------------------------+  |
|  |                                                                                              |  |
|  |  (WOAvailabilityPanel - NEW - Collapsible)                                                  |  |
|  |                                                                                              |  |
|  |  [v] Material Availability                           Last checked: 2 min ago [R]            |  |
|  |                                                                                              |  |
|  |  (Summary and materials list shown when expanded)                                           |  |
|  |                                                                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
|  +-------------------------------- MATERIALS TAB -----------------------------------------------+  |
|  |  (Existing materials tab content from PLAN-015)                                              |  |
|  +----------------------------------------------------------------------------------------------+  |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+

Note: Availability panel appears between Header and Tabs
Panel is collapsible (expanded by default when shortages exist)
Hidden when wo_material_check setting is false
```

### WO Create/Edit Modal Integration

```
+--------------------------------------------------------------------------------------------------+
|  Create Work Order                                                                     [X]       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  (Form fields: Product, Quantity, Scheduled Date, etc.)                                          |
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  | [v] Material Availability                                    [Check Availability]         |   |
|  |                                                                                           |   |
|  | Click "Check Availability" to see material stock status                                  |   |
|  |                                                                                           |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  (After Check Availability clicked - panel expands with results)                                 |
|                                                                                                   |
|  +-------------------------------------------------------------------------------------------+   |
|  | [v] Material Availability                           Last checked: just now [R]            |   |
|  |                                                                                           |   |
|  | Overall: [O] LOW STOCK - 2 materials need attention                                       |   |
|  |                                                                                           |   |
|  | (Summary cards and material rows)                                                         |   |
|  +-------------------------------------------------------------------------------------------+   |
|                                                                                                   |
|  [Cancel]                                                            [Save as Draft] [Release]   |
|                                                                                                   |
+--------------------------------------------------------------------------------------------------+

Note:
- "Check Availability" button triggers API call
- Results cached for 30 seconds
- Clicking Release with shortages triggers AvailabilityWarningModal
```

---

## Key Elements

### 1. WOAvailabilityPanel

| Element | Type | Description |
|---------|------|-------------|
| summary_card | AvailabilitySummaryCard | Overall status header |
| materials_list | AvailabilityMaterialRow[] | List of material rows |
| filter | Dropdown | Filter by status (All, Sufficient, Low Stock, Shortage) |
| search | Input | Search by material name/code |
| refresh_button | Button | Manual refresh trigger |
| collapse_toggle | Button | Expand/collapse panel |

### 2. AvailabilityMaterialRow

| Element | Source | Display |
|---------|--------|---------|
| traffic_light | status | Colored circle indicator |
| product_name | products.name | "Cocoa Mass" |
| product_code | products.code | "RM-COCOA-001" |
| required_qty | wo_materials.required_qty | "250.00" |
| available_qty | calculated | "300.00" |
| shortage_qty | calculated | "-50.00" or "28.00" |
| coverage_percent | calculated | "120%" or "44%" |
| uom | products.uom | "kg" |
| expired_excluded | calculated | "(15 exp.)" |

### 3. AvailabilityTrafficLight

| Status | Color | Threshold | Tooltip |
|--------|-------|-----------|---------|
| sufficient | Green (#22c55e) | >= 100% | "Sufficient - Stock available" |
| low_stock | Yellow (#eab308) | 50-99% | "Low Stock - Partial availability" |
| shortage | Red (#ef4444) | 1-49% | "Shortage - Critical" |
| no_stock | Red outline (#ef4444) | 0% | "No Stock - None available" |

### 4. AvailabilitySummaryCard

| Element | Description |
|---------|-------------|
| total_materials | COUNT of all wo_materials |
| sufficient_count | COUNT where status = 'sufficient' |
| low_stock_count | COUNT where status = 'low_stock' |
| shortage_count | COUNT where status IN ('shortage', 'no_stock') |
| overall_status | Worst case status (priority: no_stock > shortage > low_stock > sufficient) |
| checked_at | Timestamp of last check |
| cached | Boolean indicating if from cache |

### 5. AvailabilityWarningModal

| Element | Type | Description |
|---------|------|-------------|
| warning_icon | Icon | Large warning triangle |
| title | Text | "Material Shortages Detected" |
| description | Text | Context about proceeding with shortages |
| shortage_list | List | Materials with shortage/low_stock status |
| cancel_button | Button | Primary - returns to form |
| proceed_button | Button | Secondary - continues action |

---

## API Endpoint Integration

### GET /api/planning/work-orders/:id/availability

```typescript
// Request
GET /api/planning/work-orders/uuid-wo-156/availability

// Success Response (200)
{
  "wo_id": "uuid-wo-156",
  "checked_at": "2026-01-08T10:30:00Z",
  "overall_status": "low_stock",
  "materials": [
    {
      "wo_material_id": "uuid-wom-1",
      "product_id": "uuid-cocoa",
      "product_code": "RM-COCOA-001",
      "product_name": "Cocoa Mass",
      "required_qty": 250.00,
      "available_qty": 300.00,
      "reserved_qty": 0.00,
      "shortage_qty": -50.00,
      "coverage_percent": 120.00,
      "status": "sufficient",
      "uom": "kg",
      "expired_excluded_qty": 0.00
    },
    {
      "wo_material_id": "uuid-wom-2",
      "product_id": "uuid-butter",
      "product_code": "RM-BUTTER-001",
      "product_name": "Cocoa Butter",
      "required_qty": 50.00,
      "available_qty": 22.00,
      "reserved_qty": 8.00,
      "shortage_qty": 28.00,
      "coverage_percent": 44.00,
      "status": "shortage",
      "uom": "kg",
      "expired_excluded_qty": 5.00
    }
  ],
  "summary": {
    "total_materials": 10,
    "sufficient_count": 6,
    "low_stock_count": 3,
    "shortage_count": 1
  },
  "enabled": true,
  "cached": true,
  "cache_expires_at": "2026-01-08T10:30:30Z"
}

// Disabled Response (200)
{
  "enabled": false,
  "message": "Material check disabled in settings"
}

// Error Response (404)
{
  "error": "WO_NOT_FOUND",
  "message": "Work Order not found"
}

// Error Response (403)
{
  "error": "FORBIDDEN",
  "message": "Access denied - organization mismatch"
}
```

---

## States Summary

| Component | Loading | Empty | Error | Success |
|-----------|---------|-------|-------|---------|
| WOAvailabilityPanel | Skeleton cards + rows | "No materials to check" | "Failed to check" + Retry | Full panel with data |
| AvailabilityMaterialRow | Skeleton row | N/A | N/A | Data populated |
| AvailabilityTrafficLight | Gray placeholder | N/A | N/A | Colored indicator |
| AvailabilitySummaryCard | Skeleton stats | Zero counts | N/A | Populated counts |
| AvailabilityWarningModal | N/A | N/A | N/A | Materials with issues |

---

## Permissions

| Role | View Availability | Refresh | Proceed with Shortages |
|------|-------------------|---------|------------------------|
| Admin | Yes | Yes | Yes |
| Production Manager | Yes | Yes | Yes |
| Production Operator | Yes | Yes | No (Release disabled) |
| Planner | Yes | Yes | Yes |
| Viewer | Yes | No | No |

---

## Accessibility

### Touch Targets
- All buttons: 48x48dp minimum
- Traffic light indicators: 24x24dp (with 48x48dp touch area)
- Material row actions: 48x48dp
- Modal buttons: 48x48dp, full width on mobile

### Contrast
- Traffic light colors: 3:1 minimum against background
- Text on colored backgrounds: 4.5:1 minimum
- Status text (shortage): Red (#dc2626) on white = 5.91:1
- Status text (sufficient): Green (#16a34a) on white = 4.52:1

### Screen Reader
- Panel: role="region" aria-label="Material Availability Check"
- Summary card: "Overall status: Low Stock, 6 sufficient, 3 low stock, 1 shortage out of 10 materials"
- Traffic light: aria-label="Status: Sufficient, 120% coverage"
- Material row: "Cocoa Mass, RM-COCOA-001, Required 250 kg, Available 300 kg, 120 percent coverage, Sufficient"
- Modal: role="alertdialog" aria-labelledby="warning-title"

### Keyboard Navigation
- Tab: Navigate between filter, search, refresh, material rows
- Enter: Expand row details, trigger refresh, submit modal
- Escape: Close modal, collapse panel
- Arrow keys: Navigate within material list

---

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (>1024px) | Full table layout, 4 summary cards in row |
| Tablet (768-1024px) | Condensed table, 2x2 summary cards |
| Mobile (<768px) | Card layout for materials, stacked summary stats, full-screen modal |

---

## Performance Notes

### Loading
- Initial check: <500ms target
- Cached response: <100ms
- Large WO (50+ materials): <1s
- Very large WO (200+ materials): <2s with virtualization

### Caching
```typescript
// Redis cache key
'org:{orgId}:wo:{woId}:availability'  // 30 sec TTL

// Cache invalidation triggers
- LP created/updated in org
- wo_materials modified
- Manual refresh clicked
```

### Lazy Loading
- Materials list: First 20 loaded immediately
- Remaining materials: Loaded on scroll (infinite scroll)
- Mobile: "Load More" button pattern

---

## Testing Requirements

### Unit Tests
- Coverage percentage calculation (edge cases: 0%, 100%, >100%)
- Status determination thresholds (sufficient/low_stock/shortage/no_stock)
- Shortage calculation (positive = shortage, negative = surplus)
- Overall status determination (worst case wins)
- Expired LP exclusion logic

### Integration Tests
- API returns correct availability data
- RLS enforcement (cross-org isolation)
- Cache hit/miss behavior
- Setting toggle (enabled/disabled)

### E2E Tests
- Panel displays in WO detail page
- Refresh button updates data
- Filter dropdown works
- Warning modal appears when proceeding with shortages
- Modal cancel returns to form
- Modal proceed continues action
- Mobile responsive layout
- Collapsed/expanded state persists

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Error, Success)
- [x] All 5 components specified with wireframes
- [x] Responsive breakpoints documented (Desktop/Tablet/Mobile)
- [x] API integration documented
- [x] Accessibility requirements met (touch targets, contrast, ARIA)
- [x] Performance targets defined (<500ms, caching)
- [x] Permission matrix documented
- [x] Integration points identified (WO Detail, WO Create/Edit)
- [x] Traffic light color meanings documented
- [x] Warning modal flow documented

---

## Handoff to FRONTEND-DEV

```yaml
feature: WO Material Availability Check
story: 03.13
wireframe: PLAN-027
prd_coverage: "FR-PLAN-021"
approval_status:
  mode: "review_each"
  user_approved: pending
  screens_approved: []
  iterations_used: 0
components:
  - name: WOAvailabilityPanel
    path: components/planning/work-orders/WOAvailabilityPanel.tsx
    states: [loading, empty, error, success, disabled]
  - name: AvailabilityMaterialRow
    path: components/planning/work-orders/AvailabilityMaterialRow.tsx
    states: [sufficient, low_stock, shortage, no_stock]
  - name: AvailabilityTrafficLight
    path: components/planning/work-orders/AvailabilityTrafficLight.tsx
    variants: [sufficient, low_stock, shortage, no_stock]
    sizes: [small, medium, large]
  - name: AvailabilitySummaryCard
    path: components/planning/work-orders/AvailabilitySummaryCard.tsx
    states: [loading, success, cached]
  - name: AvailabilityWarningModal
    path: components/planning/work-orders/AvailabilityWarningModal.tsx
    states: [open, closed]
api_endpoints:
  - GET /api/planning/work-orders/:id/availability
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "region, alertdialog, img"
  keyboard_nav: "Tab, Enter, Escape, Arrow keys"
performance_targets:
  initial_load: "<500ms"
  cached_response: "<100ms"
  large_wo: "<1s (50+ materials)"
  cache_ttl: "30 seconds"
integration_points:
  - PLAN-015: WO Detail Page (availability panel placement)
  - PLAN-014: WO Create Modal (check availability button)
  - Planning Settings (wo_material_check toggle)
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 8-10 hours
**Quality Target**: 95/100
