# PLAN-026: WO Material Reservation Components

**Story**: 03.11b - WO Material Reservations (LP Allocation)
**Status**: Ready for Review
**Last Updated**: 2026-01-08
**Dependencies**: Epic 05 (License Plates), Story 03.11a (WO BOM Snapshot)

---

## Overview

Four interconnected components for managing Work Order material reservations:
1. **ReservedLPsList** - Expandable list showing reserved LPs per WO material
2. **ReserveLPModal** - Manual LP selection modal with quantity input
3. **AvailableLPsTable** - Table showing selectable LPs (FIFO/FEFO sorted)
4. **ReservationStatusBadge** - Coverage indicator (full/partial/none)

These components integrate into the existing WO Detail page (PLAN-015) Materials tab.

---

## Component 1: ReservedLPsList

### Purpose
Expandable rows within WOMaterialsTable showing all reserved LPs for a specific wo_material with reservation details.

### Integration Point
PLAN-015 Materials tab - each material row can expand to show reserved LPs.

### Success State (Desktop - Expanded Row)

```
+--------------------------------------------------------------------------------------------------+
|  Materials Required (BOM Snapshot v1.2 - Immutable)                                              |
+--------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  +----------------------------------------------------------------------------------------------+ |
|  | # | Material          | Required | Reserved | Consumed | Remaining | Status        | Action | |
|  +----------------------------------------------------------------------------------------------+ |
|  | v | Cocoa Mass        | 250 kg   | 250 kg   | 162 kg   | 88 kg     | [Full 100%]   | [Res]  | |
|  |   | RM-COCOA-001      |          | 3 LPs    |          |           |               | [View] | |
|  +----------------------------------------------------------------------------------------------+ |
|  |   +----------------------------------------------------------------------------------------+  |
|  |   | RESERVED LICENSE PLATES (3)                                          [+ Reserve More]  |  |
|  |   +----------------------------------------------------------------------------------------+  |
|  |   |                                                                                        |  |
|  |   | +---+------------+----------+------------+----------+----------+----------+--------+  |  |
|  |   | |   | LP Number  | Lot      | Expiry     | Location | Reserved | Consumed | Action |  |  |
|  |   | +---+------------+----------+------------+----------+----------+----------+--------+  |  |
|  |   | |   | LP-00145   | B-4501   | 2026-06-15 | A1-01    | 100 kg   | 65 kg    | [Rel]  |  |  |
|  |   | |   | Status: Active | Reserved by: John Smith on Jan 5, 2026            | [View] |  |  |
|  |   | +---+------------+----------+------------+----------+----------+----------+--------+  |  |
|  |   | |   | LP-00146   | B-4502   | 2026-07-20 | A1-02    | 100 kg   | 65 kg    | [Rel]  |  |  |
|  |   | |   | Status: Active | Reserved by: John Smith on Jan 5, 2026            | [View] |  |  |
|  |   | +---+------------+----------+------------+----------+----------+----------+--------+  |  |
|  |   | |   | LP-00147   | B-4503   | 2026-08-10 | A2-01    | 50 kg    | 32 kg    | [Rel]  |  |  |
|  |   | |   | Status: Active | Reserved by: John Smith on Jan 5, 2026            | [View] |  |  |
|  |   | +---+------------+----------+------------+----------+----------+----------+--------+  |  |
|  |   |                                                                                        |  |
|  |   | Total Reserved: 250 kg | Total Consumed: 162 kg | Remaining: 88 kg                    |  |
|  |   |                                                                                        |  |
|  |   +----------------------------------------------------------------------------------------+  |
|  +----------------------------------------------------------------------------------------------+ |
|  | > | Sugar Fine        | 150 kg   | 120 kg   | 0 kg     | 120 kg    | [Partial 80%] | [Res]  | |
|  |   | RM-SUGAR-001      |          | 2 LPs    |          |           | ! 30 kg short | [View] | |
|  +----------------------------------------------------------------------------------------------+ |
|  | > | Milk Powder       | 100 kg   | 0 kg     | 0 kg     | 0 kg      | [None 0%]     | [Res]  | |
|  |   | RM-MILK-001       |          | 0 LPs    |          |           |               | [View] | |
|  +----------------------------------------------------------------------------------------------+ |
|                                                                                                    |
+--------------------------------------------------------------------------------------------------+
```

### Collapsed State (Default)

```
+----------------------------------------------------------------------------------------------+
| # | Material          | Required | Reserved | Consumed | Remaining | Status        | Action |
+----------------------------------------------------------------------------------------------+
| > | Cocoa Mass        | 250 kg   | 250 kg   | 162 kg   | 88 kg     | [Full 100%]   | [Res]  |
|   | RM-COCOA-001      |          | 3 LPs    |          |           |               | [View] |
+----------------------------------------------------------------------------------------------+
| > | Sugar Fine        | 150 kg   | 120 kg   | 0 kg     | 120 kg    | [Partial 80%] | [Res]  |
|   | RM-SUGAR-001      |          | 2 LPs    |          |           | ! 30 kg short | [View] |
+----------------------------------------------------------------------------------------------+
| > | Milk Powder       | 100 kg   | 0 kg     | 0 kg     | 0 kg      | [None 0%]     | [Res]  |
|   | RM-MILK-001       |          | 0 LPs    |          |           |               | [View] |
+----------------------------------------------------------------------------------------------+
```

### Empty State (No Reservations for Material)

```
+----------------------------------------------------------------------------------------+
| RESERVED LICENSE PLATES (0)                                           [+ Reserve LPs]  |
+----------------------------------------------------------------------------------------+
|                                                                                        |
|                              [Box Icon]                                                |
|                                                                                        |
|                       No LPs Reserved for This Material                               |
|                                                                                        |
|       This material does not have any reserved License Plates yet.                    |
|       Reserve LPs to ensure inventory is allocated for this Work Order.              |
|                                                                                        |
|                           [Reserve LPs]    [View Available LPs]                       |
|                                                                                        |
+----------------------------------------------------------------------------------------+
```

### Loading State (Expanding Row)

```
+----------------------------------------------------------------------------------------+
| RESERVED LICENSE PLATES                                                               |
+----------------------------------------------------------------------------------------+
|                                                                                        |
|     [====]  Loading reserved LPs...                                                   |
|                                                                                        |
|     +--------------------------------------------------------------------+            |
|     |  [====================================]  [=====]  [========]       |            |
|     |  [====================================]  [=====]  [========]       |            |
|     +--------------------------------------------------------------------+            |
|                           (skeleton table rows)                                       |
|                                                                                        |
+----------------------------------------------------------------------------------------+
```

### Error State (Failed to Load Reservations)

```
+----------------------------------------------------------------------------------------+
| RESERVED LICENSE PLATES                                                               |
+----------------------------------------------------------------------------------------+
|                                                                                        |
|                           [Warning Icon]                                               |
|                                                                                        |
|                  Failed to Load Reservations                                          |
|                                                                                        |
|       Unable to fetch reserved LPs for this material.                                |
|       Error Code: PLAN-026-RES-LOAD-ERR                                              |
|                                                                                        |
|                      [Retry]    [Contact Support]                                     |
|                                                                                        |
+----------------------------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  Cocoa Mass                      |
|  RM-COCOA-001                    |
|                                  |
|  Required: 250 kg                |
|  Reserved: 250 kg (3 LPs)        |
|  Consumed: 162 kg                |
|                                  |
|  Status: [Full 100%]             |
|                                  |
|  [v] Show Reserved LPs           |
|                                  |
|  +----------------------------+  |
|  | LP-00145                   |  |
|  | Lot: B-4501 | 2026-06-15   |  |
|  | Location: A1-01            |  |
|  | Reserved: 100 kg           |  |
|  | Consumed: 65 kg            |  |
|  | [Release] [View]           |  |
|  +----------------------------+  |
|  | LP-00146                   |  |
|  | Lot: B-4502 | 2026-07-20   |  |
|  | Location: A1-02            |  |
|  | Reserved: 100 kg           |  |
|  | Consumed: 65 kg            |  |
|  | [Release] [View]           |  |
|  +----------------------------+  |
|                                  |
|  [+ Reserve More LPs]            |
|                                  |
+----------------------------------+
```

### Component Props

```typescript
interface ReservedLPsListProps {
  woMaterialId: string;
  materialName: string;
  productCode: string;
  requiredQty: number;
  reservedQty: number;
  consumedQty: number;
  uom: string;
  reservations: WOMaterialReservation[];
  isLoading: boolean;
  error?: string;
  canModify: boolean;  // Based on WO status
  onReserveMore: () => void;
  onRelease: (reservationId: string) => Promise<void>;
  onViewLP: (lpId: string) => void;
  onRetry: () => void;
}

interface WOMaterialReservation {
  id: string;
  lpId: string;
  lpNumber: string;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
  reservedQty: number;
  consumedQty: number;
  status: 'active' | 'released' | 'consumed';
  reservedAt: string;
  reservedBy: {
    id: string;
    name: string;
  };
}
```

---

## Component 2: ReserveLPModal

### Purpose
Manual LP selection modal for reserving specific LPs for a WO material. Includes FIFO/FEFO sorting, quantity input, and over-reservation warnings.

### Success State (Default View - Desktop)

```
+---------------------------------------------------------------------------------+
|  Reserve License Plates                                                       X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Material: Cocoa Mass (RM-COCOA-001)                                           |
|  Required Quantity: 250 kg                                                      |
|  Currently Reserved: 0 kg                                                       |
|  Warehouse: Main Production (WH-PROD)                                          |
|                                                                                 |
|  +------ PROGRESS INDICATOR ------------------------------------------------+  |
|  |                                                                          |  |
|  |  Reserved: 0 / 250 kg                                     [  0%  ]      |  |
|  |  [                                                                ]      |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ SORT ORDER --------------------------------------------------------+  |
|  |                                                                          |  |
|  |  Sort by:  (o) FIFO (First In, First Out)    ( ) FEFO (First Expiry)   |  |
|  |                                                                          |  |
|  |  LPs are sorted by [created_at / expiry_date] to prioritize older stock  |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ FILTERS (collapsed by default) ------------------------------------+  |
|  |  [v] Filters  |  Lot: [           ]  |  Location: [All        v]        |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  Available License Plates (5)                                                   |
|  +-------------------------------------------------------------------------+   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |   | LP Number  | Lot      | Expiry     | Location | Avail Qty| Reserve|   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00145   | B-4501   | 2026-06-15 | A1-01    | 100 kg   | [   ] ||   |
|  | |   | Received: Jan 1, 2026 | Shelf: 5 months remaining                ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00146   | B-4502   | 2026-07-20 | A1-02    | 100 kg   | [   ] ||   |
|  | |   | Received: Jan 3, 2026 | Shelf: 6 months remaining                ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00147   | B-4503   | 2026-08-10 | A2-01    | 75 kg    | [   ] ||   |
|  | |   | Received: Jan 5, 2026 | Shelf: 7 months remaining                ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00148   | B-4504   | 2026-09-05 | A2-02    | 50 kg    | [   ] ||   |
|  | |   | Received: Jan 6, 2026 | Shelf: 8 months remaining                ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00149   | B-4505   | 2026-10-01 | A3-01    | 30 kg    | [   ] ||   |
|  | |   | Received: Jan 7, 2026 | Shelf: 9 months remaining                ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  +-------------------------------------------------------------------------+   |
|                                                                                 |
|  Showing 5 of 5 available LPs                          [< 1 2 3 ... >] 10/page |
|                                                                                 |
|  +------ SELECTED LPs SUMMARY (0) ------------------------------------------+  |
|  |                                                                          |  |
|  |  No License Plates selected yet.                                        |  |
|  |  Check the boxes above and enter quantities to reserve LPs.             |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                       [Cancel]    [Reserve Selected (0 kg)]     |
+---------------------------------------------------------------------------------+
```

### With Selections (Partial Reservation)

```
+---------------------------------------------------------------------------------+
|  Reserve License Plates                                                       X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Material: Cocoa Mass (RM-COCOA-001)                                           |
|  Required Quantity: 250 kg                                                      |
|  Currently Reserved: 0 kg                                                       |
|  Warehouse: Main Production (WH-PROD)                                          |
|                                                                                 |
|  +------ PROGRESS INDICATOR ------------------------------------------------+  |
|  |                                                                          |  |
|  |  Reserving: 200 / 250 kg                                  [ 80%  ]      |  |
|  |  [======================================                          ]      |  |
|  |  ! 50 kg remaining to fully reserve                                      |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ SORT ORDER --------------------------------------------------------+  |
|  |  Sort by:  (o) FIFO (First In, First Out)    ( ) FEFO (First Expiry)   |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  Available License Plates (5)                                                   |
|  +-------------------------------------------------------------------------+   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |   | LP Number  | Lot      | Expiry     | Location | Avail Qty| Reserve|   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[x]| LP-00145   | B-4501   | 2026-06-15 | A1-01    | 100 kg   | [100] ||   |
|  | |   | Received: Jan 1, 2026 | Shelf: 5 months remaining                ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[x]| LP-00146   | B-4502   | 2026-07-20 | A1-02    | 100 kg   | [100] ||   |
|  | |   | Received: Jan 3, 2026 | Shelf: 6 months remaining                ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  | |[ ]| LP-00147   | B-4503   | 2026-08-10 | A2-01    | 75 kg    | [   ] ||   |
|  | +---+------------+----------+------------+----------+----------+-------+|   |
|  +-------------------------------------------------------------------------+   |
|                                                                                 |
|  +------ SELECTED LPs SUMMARY (2) ------------------------------------------+  |
|  |                                                                          |  |
|  |  +-------------------------------------------------------------+        |  |
|  |  | LP-00145 | Lot: B-4501 | Expiry: 2026-06-15 | 100 kg  [X]  |        |  |
|  |  +-------------------------------------------------------------+        |  |
|  |  | LP-00146 | Lot: B-4502 | Expiry: 2026-07-20 | 100 kg  [X]  |        |  |
|  |  +-------------------------------------------------------------+        |  |
|  |                                                                          |  |
|  |  Total Selected: 200 kg                                                 |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                       [Cancel]    [Reserve Selected (200 kg)]   |
+---------------------------------------------------------------------------------+
```

### Over-Reservation Warning (Soft Block)

```
+---------------------------------------------------------------------------------+
|  Reserve License Plates                                                       X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Material: Cocoa Mass (RM-COCOA-001)                                           |
|  Required Quantity: 250 kg                                                      |
|  Currently Reserved: 200 kg                                                     |
|  Warehouse: Main Production (WH-PROD)                                          |
|                                                                                 |
|  +------ PROGRESS INDICATOR (Warning) --------------------------------------+  |
|  |                                                                          |  |
|  |  Reserving: 300 / 250 kg                                  [120%  ]      |  |
|  |  [============================================================] (yellow)|  |
|  |  ! Over-reserved by 50 kg                                                |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  +------ WARNING MESSAGE ---------------------------------------------------+  |
|  |  !  Over-Reservation Warning                                             |  |
|  |                                                                          |  |
|  |  Total reserved (300 kg) exceeds required quantity (250 kg) by 50 kg.   |  |
|  |                                                                          |  |
|  |  This is allowed (soft reservation) but may reduce availability for     |  |
|  |  other Work Orders. Only the required quantity will be consumed.        |  |
|  |                                                                          |  |
|  |  [ ] I understand, proceed with over-reservation                        |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
|  (table same as above with selections)                                         |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                              [Cancel]    [Reserve Selected (300 kg)] (yellow)   |
+---------------------------------------------------------------------------------+
```

### LP Already Reserved by Other WOs (Soft Warning)

```
+---+------------+----------+------------+----------+----------+-------+
|   | LP Number  | Lot      | Expiry     | Location | Avail Qty| Reserve|
+---+------------+----------+------------+----------+----------+-------+
|[ ]| LP-00150   | B-4506   | 2026-06-30 | A1-03    | 80 kg    | [   ] |
|   | Received: Jan 2, 2026                                            |
|   | ! Reserved: 60 kg by WO-2024-00155 (20 kg unreserved)           |
+---+------------+----------+------------+----------+----------+-------+
```

### Input Validation - Exceeds LP Available

```
+---+------------+----------+------------+----------+----------+-------+
|   | LP Number  | Lot      | Expiry     | Location | Avail Qty| Reserve|
+---+------------+----------+------------+----------+----------+-------+
|[x]| LP-00145   | B-4501   | 2026-06-15 | A1-01    | 100 kg   | [150] |
    |                                                            ^^^^^  |
    |                                            ! Max available: 100 kg |
+---+------------+----------+------------+----------+----------+-------+
```

### Loading State

```
+---------------------------------------------------------------------------------+
|  Reserve License Plates                                                       X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Material: Cocoa Mass (RM-COCOA-001)                                           |
|  Required Quantity: 250 kg                                                      |
|  Warehouse: Main Production (WH-PROD)                                          |
|                                                                                 |
|  +--------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |                     [====]  Loading available LPs...                    |  |
|  |                                                                          |  |
|  |                     Checking inventory in Main Production               |  |
|  |                     Using FIFO ordering                                 |  |
|  |                                                                          |  |
|  |  +--------------------------------------------------------------------+  |  |
|  |  |  [====================================]  [=====]  [========]       |  |  |
|  |  |  [====================================]  [=====]  [========]       |  |  |
|  |  |  [====================================]  [=====]  [========]       |  |  |
|  |  +--------------------------------------------------------------------+  |  |
|  |                           (skeleton table rows)                         |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                              [Cancel]           |
+---------------------------------------------------------------------------------+
```

### Empty State

```
+---------------------------------------------------------------------------------+
|  Reserve License Plates                                                       X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Material: Cocoa Mass (RM-COCOA-001)                                           |
|  Required Quantity: 250 kg                                                      |
|  Warehouse: Main Production (WH-PROD)                                          |
|                                                                                 |
|  +--------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |                              [Box Icon]                                  |  |
|  |                                                                          |  |
|  |                   No Available License Plates                            |  |
|  |                                                                          |  |
|  |       No LPs found for Cocoa Mass in Main Production Warehouse          |  |
|  |       with available quantity.                                           |  |
|  |                                                                          |  |
|  |       Possible reasons:                                                  |  |
|  |       - All LPs are already fully reserved by other Work Orders         |  |
|  |       - No inventory received for this product                          |  |
|  |       - All LPs are blocked, quarantined, or expired                    |  |
|  |                                                                          |  |
|  |                                                                          |  |
|  |                   [View All Inventory]  [Clear Filters]                  |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                              [Close]            |
+---------------------------------------------------------------------------------+
```

### Error State

```
+---------------------------------------------------------------------------------+
|  Reserve License Plates                                                       X |
+---------------------------------------------------------------------------------+
|                                                                                 |
|  Material: Cocoa Mass (RM-COCOA-001)                                           |
|  Required Quantity: 250 kg                                                      |
|  Warehouse: Main Production (WH-PROD)                                          |
|                                                                                 |
|  +--------------------------------------------------------------------------+  |
|  |                                                                          |  |
|  |                           [Warning Icon]                                 |  |
|  |                                                                          |  |
|  |                  Failed to Load Available LPs                            |  |
|  |                                                                          |  |
|  |       Error: Unable to fetch available inventory                        |  |
|  |                                                                          |  |
|  |       This may be due to:                                                |  |
|  |       - Network connectivity issues                                      |  |
|  |       - Server temporarily unavailable                                   |  |
|  |                                                                          |  |
|  |       Error Code: PLAN-026-LP-LOAD-ERR                                  |  |
|  |                                                                          |  |
|  |                                                                          |  |
|  |                      [Retry]    [Contact Support]                       |  |
|  |                                                                          |  |
|  +--------------------------------------------------------------------------+  |
|                                                                                 |
+---------------------------------------------------------------------------------+
|                                                              [Close]            |
+---------------------------------------------------------------------------------+
```

### Mobile View (<768px)

```
+----------------------------------+
|  Reserve LPs                   X |
+----------------------------------+
|                                  |
|  Cocoa Mass                      |
|  RM-COCOA-001                    |
|                                  |
|  Need: 250 kg                    |
|  From: Main Production           |
|                                  |
|  Progress: 200 / 250 kg          |
|  [========================    ]  |
|  ! 50 kg remaining               |
|                                  |
|  Sort: (o) FIFO  ( ) FEFO        |
|                                  |
|  +----------------------------+  |
|  |  [v] Filters               |  |
|  +----------------------------+  |
|                                  |
|  Available LPs (5)               |
|                                  |
|  +----------------------------+  |
|  | [x] LP-00145               |  |
|  | Lot: B-4501 | 2026-06-15   |  |
|  | Location: A1-01            |  |
|  | Available: 100 kg          |  |
|  | Reserve: [100    ] kg      |  |
|  +----------------------------+  |
|  | [x] LP-00146               |  |
|  | Lot: B-4502 | 2026-07-20   |  |
|  | Location: A1-02            |  |
|  | Available: 100 kg          |  |
|  | Reserve: [100    ] kg      |  |
|  +----------------------------+  |
|  | [ ] LP-00147               |  |
|  | Lot: B-4503 | 2026-08-10   |  |
|  | Location: A2-01            |  |
|  | Available: 75 kg           |  |
|  | Reserve: [       ] kg      |  |
|  +----------------------------+  |
|                                  |
|  Selected (2): 200 kg            |
|                                  |
|  +----------------------------+  |
|  | LP-00145: 100 kg       [X] |  |
|  | LP-00146: 100 kg       [X] |  |
|  +----------------------------+  |
|                                  |
+----------------------------------+
|  [Cancel]  [Reserve (200 kg)]    |
+----------------------------------+
```

### Component Props

```typescript
interface ReserveLPModalProps {
  // Context
  woId: string;
  woMaterialId: string;
  woNumber: string;

  // Material info
  productId: string;
  productName: string;
  productCode: string;
  requiredQty: number;
  currentlyReservedQty: number;
  uom: string;

  // Warehouse info
  warehouseId: string;
  warehouseName: string;
  warehouseCode: string;

  // Algorithm (from warehouse settings)
  defaultAlgorithm: 'fifo' | 'fefo';

  // Callbacks
  onReserve: (selections: LPReservation[]) => Promise<void>;
  onCancel: () => void;
}

interface LPReservation {
  lpId: string;
  lpNumber: string;
  quantity: number;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
}

interface AvailableLP {
  id: string;
  lpNumber: string;
  lotNumber: string | null;
  expiryDate: string | null;
  location: string | null;
  availableQty: number;
  totalQty: number;
  uom: string;
  createdAt: string;  // Receipt date for FIFO
  // Soft reservation info (other WOs)
  otherReservations?: Array<{
    woNumber: string;
    quantity: number;
  }>;
}
```

---

## Component 3: AvailableLPsTable

### Purpose
Reusable table component showing available LPs for selection, with FIFO/FEFO sorting, checkbox selection, and quantity input per row.

### Table Structure (Desktop)

```
+-----------------------------------------------------------------------------------------+
| +---+------------+----------+------------+----------+----------+-----------+----------+ |
| |   | LP Number  | Lot      | Expiry     | Location | Avail Qty| Shelf Life| Reserve  | |
| +---+------------+----------+------------+----------+----------+-----------+----------+ |
| |[ ]| LP-00145   | B-4501   | 2026-06-15 | A1-01    | 100 kg   | 5 mo      | [      ] | |
| |   | Rcvd: Jan 1, 2026                                                               | |
| +---+------------+----------+------------+----------+----------+-----------+----------+ |
| |[ ]| LP-00146   | B-4502   | 2026-07-20 | A1-02    | 100 kg   | 6 mo      | [      ] | |
| |   | Rcvd: Jan 3, 2026                                                               | |
| +---+------------+----------+------------+----------+----------+-----------+----------+ |
| |[ ]| LP-00147   | B-4503   | 2026-08-10 | A2-01    | 75 kg    | 7 mo      | [      ] | |
| |   | Rcvd: Jan 5, 2026                                                               | |
| +---+------------+----------+------------+----------+----------+-----------+----------+ |
+-----------------------------------------------------------------------------------------+
```

### Column Definitions

| Column | Width | Description | Sortable |
|--------|-------|-------------|----------|
| Checkbox | 40px | Selection toggle | No |
| LP Number | 120px | License plate identifier | Yes |
| Lot | 100px | Lot/batch number | Yes |
| Expiry | 100px | Expiration date | Yes (FEFO default) |
| Location | 100px | Warehouse location | Yes |
| Avail Qty | 100px | Available to reserve | Yes |
| Shelf Life | 80px | Time until expiry | No |
| Reserve | 100px | Quantity input | No |

### Row States

**Normal Row:**
```
| |[ ]| LP-00145   | B-4501   | 2026-06-15 | A1-01    | 100 kg   | 5 mo      | [      ] |
```

**Selected Row:**
```
| |[x]| LP-00145   | B-4501   | 2026-06-15 | A1-01    | 100 kg   | 5 mo      | [100   ] |
|     (row highlighted with light blue background)
```

**Partially Reserved by Other WOs:**
```
| |[ ]| LP-00150   | B-4506   | 2026-06-30 | A1-03    | 80 kg*   | 5 mo      | [      ] |
|     * 60 kg reserved by WO-2024-00155 (tooltip on hover)
|     (available qty shown as net available)
```

**Near Expiry Warning (< 30 days):**
```
| |[ ]| LP-00151   | B-4507   | 2026-02-05 | A1-04    | 50 kg    | 28 days ! | [      ] |
|     (expiry column highlighted yellow)
```

**Expired (Should Not Show - Filtered Out):**
Expired LPs are excluded from the available list by default.

### Component Props

```typescript
interface AvailableLPsTableProps {
  lps: AvailableLP[];
  selectedLPs: Map<string, number>;  // lpId -> quantity
  sortOrder: 'fifo' | 'fefo';
  isLoading: boolean;
  onSelect: (lpId: string, selected: boolean) => void;
  onQuantityChange: (lpId: string, quantity: number) => void;
  onSortChange: (order: 'fifo' | 'fefo') => void;
}
```

---

## Component 4: ReservationStatusBadge

### Purpose
Visual indicator showing reservation coverage status for a WO material.

### Badge Variants

**Full Coverage (100%):**
```
+---------------+
| Full 100%     |
+---------------+
Color: Green (bg-green-100, text-green-800)
Icon: Checkmark circle
```

**Partial Coverage (1-99%):**
```
+---------------+
| Partial 80%   |
+---------------+
Color: Yellow (bg-yellow-100, text-yellow-800)
Icon: Warning triangle
Tooltip: "30 kg short of required 150 kg"
```

**No Coverage (0%):**
```
+---------------+
| None 0%       |
+---------------+
Color: Gray (bg-gray-100, text-gray-800)
Icon: Circle outline
Tooltip: "No LPs reserved yet"
```

**Over-Reserved (>100%):**
```
+---------------+
| Over 120%     |
+---------------+
Color: Blue (bg-blue-100, text-blue-800)
Icon: Plus circle
Tooltip: "50 kg over required quantity"
```

### Size Variants

**Default (Table Cell):**
```
Height: 24px
Padding: 4px 8px
Font size: 12px
```

**Large (Card Header):**
```
Height: 32px
Padding: 6px 12px
Font size: 14px
```

### Component Props

```typescript
interface ReservationStatusBadgeProps {
  requiredQty: number;
  reservedQty: number;
  uom: string;
  size?: 'default' | 'large';
  showTooltip?: boolean;
}

// Computed properties
type ReservationStatus = 'full' | 'partial' | 'none' | 'over';

function getReservationStatus(required: number, reserved: number): ReservationStatus {
  if (reserved === 0) return 'none';
  if (reserved >= required * 1.0) {
    return reserved > required ? 'over' : 'full';
  }
  return 'partial';
}

function getCoveragePercent(required: number, reserved: number): number {
  if (required === 0) return 0;
  return Math.round((reserved / required) * 100);
}
```

---

## API Endpoints

### GET Available LPs for Material

```
GET /api/planning/work-orders/:id/materials/:materialId/available-lps
?sort=fifo|fefo
&lot_number=B-450*
&location=A1

Response 200:
{
  "success": true,
  "data": {
    "lps": [
      {
        "id": "uuid-lp-145",
        "lp_number": "LP-00145",
        "lot_number": "B-4501",
        "expiry_date": "2026-06-15",
        "location": "A1-01",
        "available_qty": 100,
        "total_qty": 100,
        "uom": "kg",
        "created_at": "2026-01-01T08:00:00Z",
        "other_reservations": [
          { "wo_number": "WO-2024-00155", "quantity": 0 }
        ]
      },
      // ... more LPs
    ],
    "total_available": 355,
    "sort_order": "fifo",
    "filters_applied": {
      "warehouse_id": "uuid-wh-prod",
      "product_id": "uuid-cocoa",
      "qa_status": "passed"
    }
  }
}
```

### POST Reserve LPs

```
POST /api/planning/work-orders/:id/materials/:materialId/reservations

Request Body:
{
  "reservations": [
    { "lp_id": "uuid-lp-145", "quantity": 100 },
    { "lp_id": "uuid-lp-146", "quantity": 100 }
  ],
  "acknowledge_over_reservation": false  // Required if over 100%
}

Response 200:
{
  "success": true,
  "data": {
    "reservations": [
      {
        "id": "uuid-res-1",
        "lp_id": "uuid-lp-145",
        "lp_number": "LP-00145",
        "reserved_qty": 100,
        "status": "active",
        "reserved_at": "2026-01-08T10:30:00Z",
        "reserved_by": {
          "id": "uuid-user-1",
          "name": "John Smith"
        }
      },
      // ...
    ],
    "total_reserved": 200,
    "required_qty": 250,
    "coverage_percent": 80,
    "is_complete": false
  },
  "message": "2 License Plates reserved successfully"
}

Response 400 (Over-Reservation Not Acknowledged):
{
  "success": false,
  "error": {
    "code": "OVER_RESERVATION_NOT_ACKNOWLEDGED",
    "message": "Total reserved (300 kg) exceeds required (250 kg). Set acknowledge_over_reservation to true to proceed."
  }
}
```

### DELETE Release Reservation

```
DELETE /api/planning/work-orders/:id/reservations/:reservationId

Response 200:
{
  "success": true,
  "data": {
    "released_qty": 100,
    "new_total_reserved": 150,
    "coverage_percent": 60
  },
  "message": "Reservation released successfully"
}
```

---

## Accessibility (WCAG 2.1 AA)

### All Components

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | Tab through checkboxes, inputs, buttons; Enter to toggle |
| Focus Indicators | 2px blue outline on focus for all interactive elements |
| Color Independence | Status shown with icon + text, not color alone |
| Touch Targets | 48x48dp minimum for checkboxes, buttons |
| ARIA Labels | "Select LP-00145, 100 kg available", "Reserve quantity for LP-00145" |

### ReservedLPsList
- Expandable rows use aria-expanded="true/false"
- Table structure with proper th/td and scope attributes
- "Release" buttons labeled: "Release reservation for LP-00145"

### ReserveLPModal
- Modal has role="dialog" and aria-labelledby
- Focus trapped within modal
- Escape key closes modal
- Progress indicator uses aria-valuenow, aria-valuemin, aria-valuemax
- Over-reservation warning announced via aria-live="polite"

### AvailableLPsTable
- Checkbox labels: "Select LP-00145 for reservation"
- Quantity inputs: aria-label="Reserve quantity for LP-00145"
- Sort order announced when changed
- Row selection state announced

### ReservationStatusBadge
- Badge has aria-label describing full status
- Tooltip content accessible via aria-describedby

---

## Responsive Breakpoints

| Breakpoint | ReservedLPsList | ReserveLPModal | AvailableLPsTable | Badge |
|------------|-----------------|----------------|-------------------|-------|
| Desktop (>1024px) | Full table | Full modal | Full table | Default |
| Tablet (768-1024px) | Condensed table | Full modal | Condensed | Default |
| Mobile (<768px) | Card layout | Full-screen | Card layout | Small |

---

## Business Rules

### Reservation Rules

1. **Soft Reservations**: Same LP can be reserved by multiple WOs (with warnings)
2. **Status Filter**: Only LPs with status='available' and qa_status='passed' shown
3. **Warehouse Filter**: Only LPs from WO.warehouse_id shown
4. **Expiry Filter**: Expired LPs excluded (expiry_date < today)
5. **Over-Reservation**: Allowed with acknowledgment; shows warning

### Status-Based Access

| WO Status | Reserve LPs | Release Reservations |
|-----------|-------------|---------------------|
| Draft | No (BOM not finalized) | No |
| Planned | Yes | Yes |
| Released | Yes | Yes |
| In Progress | Yes (with warning) | Yes (partial release) |
| On Hold | No | No |
| Completed | No | No |
| Cancelled | No | No (auto-released) |

### FIFO/FEFO Algorithm

| Sort Order | Primary Sort | Secondary Sort |
|------------|--------------|----------------|
| FIFO | created_at ASC | expiry_date ASC |
| FEFO | expiry_date ASC (NULL last) | created_at ASC |

---

## Performance Requirements

- ReservedLPsList load: <300ms for up to 50 reservations
- ReserveLPModal open to LPs displayed: <500ms
- Reservation submission: <1000ms
- Badge rendering: <50ms

---

## Testing Requirements

### Unit Tests
- ReservationStatusBadge renders correct status for all coverage levels
- AvailableLPsTable sorts correctly (FIFO, FEFO)
- Quantity validation (min, max, exceeds available)
- Over-reservation warning logic

### Integration Tests
- GET /api/.../available-lps returns sorted LPs
- POST /api/.../reservations creates reservations
- DELETE /api/.../reservations releases reservation
- Over-reservation acknowledgment flow

### E2E Tests
- Expand material row to see reserved LPs
- Open modal, select LPs, submit reservation
- Release individual reservation
- Mobile responsive layout
- Keyboard navigation through all components

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined per component (Loading, Empty, Error, Success)
- [x] All 4 components wireframed (ReservedLPsList, ReserveLPModal, AvailableLPsTable, ReservationStatusBadge)
- [x] Mobile responsive views documented
- [x] API endpoints documented
- [x] Component props interfaces defined
- [x] Accessibility requirements met (WCAG 2.1 AA)
- [x] Business rules documented
- [x] FIFO/FEFO algorithm documented
- [x] Over-reservation handling documented
- [x] Error handling defined
- [x] Performance requirements stated

---

## Handoff to FRONTEND-DEV

```yaml
feature: WO Material Reservation Components
story: 03.11b
wireframe_id: PLAN-026
fr_coverage: FR-PLAN-025
status: DEFERRED (requires Epic 05)
approval_status:
  mode: "review_each"
  user_approved: false  # PENDING USER REVIEW
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/PLAN-026-wo-reservation-components.md
  components:
    - ReservedLPsList.tsx
    - ReserveLPModal.tsx
    - AvailableLPsTable.tsx
    - ReservationStatusBadge.tsx
  api_endpoints:
    - GET /api/planning/work-orders/:id/materials/:materialId/available-lps
    - POST /api/planning/work-orders/:id/materials/:materialId/reservations
    - DELETE /api/planning/work-orders/:id/reservations/:reservationId
    - GET /api/planning/work-orders/:id/materials/:materialId/reservations
states_per_component:
  ReservedLPsList: [loading, empty, error, success]
  ReserveLPModal: [loading, empty, error, success, validation_warning, validation_error]
  AvailableLPsTable: [loading, empty, success]
  ReservationStatusBadge: [full, partial, none, over]
breakpoints:
  mobile: "<768px"
  tablet: "768-1024px"
  desktop: ">1024px"
accessibility:
  touch_targets: "48dp minimum"
  contrast: "4.5:1 minimum"
  keyboard: "full navigation support"
  screen_reader: "ARIA labels and live regions"
related_screens:
  - PLAN-015: WO Detail Page (integration point)
  - PLAN-025: TO LP Picker Modal (pattern source)
dependencies:
  - Epic 05: License Plates infrastructure
  - Story 03.11a: WO BOM Snapshot (wo_materials table)
```

---

**Status**: Ready for User Review
**Approval Mode**: review_each (default)
**User Approved**: Pending
**Iterations**: 0 of 3
**Estimated Effort**: 10-12 hours (frontend implementation)
**Quality Target**: 95/100
**Blocked By**: Epic 05 (License Plates)
