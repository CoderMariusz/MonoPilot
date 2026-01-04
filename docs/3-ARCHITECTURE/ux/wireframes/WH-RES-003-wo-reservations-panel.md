# WH-RES-003: WO Reservations Panel

**Story**: 05.3 - LP Reservations + FIFO/FEFO Picking
**Component**: `ReservationsPanel.tsx`
**Pattern**: ShadCN DataTable in panel/card
**States**: Loading, Empty, Error, Success
**Location**: Work Order detail page (`/production/work-orders/[id]`)

---

## Purpose
Panel on WO detail page showing all material reservations for this work order, with actions to release or add reservations.

---

## Layout

### Success State (Active Reservations)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Work Order: WO-00123 - Batch Production                            [Edit]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ... [other WO sections: General, Materials, Schedule, etc.] ...            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Material Reservations (5)                           [+ Reserve Materials]   │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ Filter: [Status ▼] [Material ▼] [Location ▼]              🔍         │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ┌───────────────────────────────────────────────────────────────────────────┐│
│ │ Material         LP Number  Batch   Qty      Consumed  Remaining  Status ││
│ ├───────────────────────────────────────────────────────────────────────────┤│
│ │ Flour Type 550   LP-00123   B-4501  40 kg    20 kg     20 kg     Active  ││
│ │ 📍 A1-01         2026-06-15                                       [Release│││
│ ├───────────────────────────────────────────────────────────────────────────┤│
│ │ Flour Type 550   LP-00124   B-4502  50 kg    0 kg      50 kg     Active  ││
│ │ 📍 A1-02         2026-07-20                                       [Release│││
│ ├───────────────────────────────────────────────────────────────────────────┤│
│ │ Flour Type 550   LP-00125   B-4503  10 kg    10 kg     0 kg      Consumed││
│ │ 📍 A2-01         2026-08-10                                               ││
│ ├───────────────────────────────────────────────────────────────────────────┤│
│ │ Sugar White      LP-00345   B-2201  25 kg    0 kg      25 kg     Active  ││
│ │ 📍 B3-05         2026-12-01                                       [Release│││
│ ├───────────────────────────────────────────────────────────────────────────┤│
│ │ Salt Fine        LP-00678   B-1105  5 kg     0 kg      5 kg      Active  ││
│ │ 📍 C1-01         No Expiry                                        [Release│││
│ └───────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ Summary:                                                                    │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ Total Reserved: 130 kg  |  Consumed: 30 kg  |  Remaining: 100 kg     │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ℹ️ Consumed quantities update automatically when materials are issued.     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements**:
- **Section Header**: "Material Reservations (5)" with count
- **Action Button**: "+ Reserve Materials" (opens WH-RES-001 picker)
- **Filters**: Status, Material, Location dropdowns + search
- **Table Columns**:
  - Material (name)
  - LP Number
  - Batch
  - Reserved Qty
  - Consumed Qty
  - Remaining Qty (reserved - consumed)
  - Status badge (Active/Consumed/Released)
  - Actions: [Release] button (for active only)
- **Row Details**: Location (📍 icon), expiry date (below LP number)
- **Summary Bar**: Total reserved, consumed, remaining across all materials
- **Info Note**: Explanation of auto-update behavior

**Interactions**:
- **+ Reserve Materials**: Opens WH-RES-001 (Available LPs Picker)
- **[Release]**: Opens WH-RES-004 (Release Modal) for confirmation
- **Filter dropdowns**: Filter table by status/material/location
- **Search**: Filter by LP number, batch, material name
- **Row click**: Expand row to show reservation history (optional)

---

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Work Order: WO-00123 - Batch Production                            [Edit]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ... [other WO sections: General, Materials, Schedule, etc.] ...            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Material Reservations                                                       │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │                                                                       │   │
│ │                    🔄 Loading reservations...                         │   │
│ │                                                                       │   │
│ │                    ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░                          │   │
│ │                                                                       │   │
│ │         [Skeleton table rows with shimmer effect]                    │   │
│ │                                                                       │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Displays**:
- Spinner icon
- "Loading reservations..." message
- Skeleton table (5 shimmer rows)
- No action buttons until loaded

---

### Empty State (No Reservations)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Work Order: WO-00123 - Batch Production                            [Edit]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ... [other WO sections: General, Materials, Schedule, etc.] ...            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Material Reservations (0)                           [+ Reserve Materials]   │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │                                                                       │   │
│ │                              📦                                       │   │
│ │                                                                       │   │
│ │                   No Material Reservations                            │   │
│ │                                                                       │   │
│ │         No license plates have been reserved for this work order.     │   │
│ │                                                                       │   │
│ │         Reserve materials now to ensure availability before           │   │
│ │         production starts.                                            │   │
│ │                                                                       │   │
│ │                      [+ Reserve Materials]                            │   │
│ │                                                                       │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ ℹ️ Tip: Use FIFO/FEFO picking to select optimal license plates.            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Displays**:
- Empty box illustration
- "No Material Reservations" heading
- Explanation (no LPs reserved)
- **Call to action**: "Reserve materials now..." message
- **Action button**: "+ Reserve Materials"
- **Tip**: Mention FIFO/FEFO picking

---

### Error State (Failed to Load)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Work Order: WO-00123 - Batch Production                            [Edit]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ... [other WO sections: General, Materials, Schedule, etc.] ...            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Material Reservations                                                       │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │                                                                       │   │
│ │                              ⚠️                                        │   │
│ │                                                                       │   │
│ │                  Failed to Load Reservations                          │   │
│ │                                                                       │   │
│ │         Error: Unable to fetch reservations (Network timeout)         │   │
│ │                                                                       │   │
│ │         Please try again. If the problem persists, contact            │   │
│ │         support with error code: WH-RES-003-LOAD-ERR                  │   │
│ │                                                                       │   │
│ │                          [Try Again]                                  │   │
│ │                                                                       │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Displays**:
- Warning icon
- "Failed to Load Reservations" heading
- Error message (network timeout, permission denied, etc.)
- Error code for support
- **Action**: "Try Again" button (refetch)

---

## Expanded Row (Reservation History - Optional MVP)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Material         LP Number  Batch   Qty      Consumed  Remaining  Status  [▼]││
├───────────────────────────────────────────────────────────────────────────────┤
│ Flour Type 550   LP-00123   B-4501  40 kg    20 kg     20 kg     Active      ││
│ 📍 A1-01         2026-06-15                                       [Release]   ││
│ ┌─────────────────────────────────────────────────────────────────────────┐   ││
│ │ Reservation History:                                                    │   ││
│ │                                                                         │   ││
│ │ • Reserved: 2026-01-02 14:35:00 by John Smith (40 kg)                  │   ││
│ │ • Consumed: 2026-01-03 08:15:00 by Maria Garcia (20 kg)                │   ││
│ │   Transaction: MAT-00567                                                │   ││
│ │ • Remaining: 20 kg available for consumption                            │   ││
│ │                                                                         │   ││
│ │ ℹ️ Reservation ID: RES-00456                                            │   ││
│ │                                                                         │   ││
│ └─────────────────────────────────────────────────────────────────────────┘   ││
└───────────────────────────────────────────────────────────────────────────────┘
```

**Displays** (when row expanded):
- Reservation timestamp + user
- Consumption events (timestamp, user, qty, transaction ref)
- Remaining qty
- Reservation ID

**Interaction**: Click row or [▼] icon to expand/collapse

---

## Status Badges

```
┌─────────────────────────────────────────────┐
│ Active     - Green badge, bold              │
│ Consumed   - Gray badge                     │
│ Released   - Orange badge                   │
│ Partial    - Blue badge (consumed > 0)      │
└─────────────────────────────────────────────┘
```

**Badge Logic**:
- **Active**: status='active' AND remaining > 0
- **Consumed**: status='consumed' OR remaining = 0
- **Released**: status='released'
- **Partial**: status='active' AND consumed > 0 AND remaining > 0

---

## Component Props

```typescript
interface ReservationsPanelProps {
  woId: string;
  woNumber: string;
  woStatus: string;  // To enable/disable Reserve button
  onReservationsChange?: () => void;  // Callback after add/release
}

interface ReservationWithLP {
  id: string;
  lpId: string;
  lpNumber: string;
  materialId: string;
  materialName: string;
  batch: string | null;
  location: string;
  expiryDate: string | null;
  reservedQty: number;
  consumedQty: number;
  remainingQty: number;
  status: 'active' | 'consumed' | 'released';
  reservedAt: string;
  reservedBy: string;
}
```

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Nav | Tab through rows, buttons, filters |
| Screen Reader | ARIA labels: "Reservation for Flour Type 550, LP-00123, 40 kg reserved, 20 kg consumed" |
| Focus Indicators | 2px blue outline on focus |
| Table Semantics | role="table", role="row", role="cell" |
| Touch Targets | 48x48dp buttons, row click areas |
| Sort Indicators | ARIA sort attributes on column headers |
| Live Region | Reservation changes announced |

---

## Mobile Responsive (Not MVP - Desktop First)

**MVP**: Desktop-only table (1024px+)
**Future**: Mobile card-based list UI

---

## Business Rules

1. **Permission**: Only Manager/Production Planner can release reservations
2. **WO Status**: Cannot reserve/release if WO status='completed' or 'cancelled'
3. **Consumed Reservations**: [Release] button hidden if status='consumed'
4. **Auto-update**: Consumed qty updates when material issued (Epic 04.6a)
5. **Remaining Calculation**: remaining_qty = reserved_qty - consumed_qty
6. **Real-time**: Fetch fresh data on panel load (not cached)
7. **Multi-material**: Group by material if same material has multiple LPs
8. **Pagination**: If >50 reservations, paginate table

---

## Technical Notes

- **Service Call**: `getReservations(woId)` on panel mount
- **Polling**: Consider polling every 30s if WO is in-progress (live updates)
- **Optimistic Update**: When user releases, update UI immediately, rollback on error
- **Toast Notifications**: Show toast on successful reserve/release
- **Cache Invalidation**: Invalidate cache after reserve/release actions

---

## Integration with Epic 04.8

**Note**: Epic 04.8 (Material Reservations) will:
- Add "Auto-Reserve" toggle on WO start
- Link reservations to `wo_materials` table
- Implement consumption logic (update consumed_qty)
- This panel will display those auto-reservations

**For now** (05.3 scope):
- Manual reservation only (via "+ Reserve Materials" button)
- Consumed qty = 0 (no consumption logic yet)
- wo_material_id column exists but not used

---

## Next Steps

After WH-RES-003, create:
- **WH-RES-004**: Release Modal
- **WH-RES-005**: All Reservations List
