<!-- e6255666-55a2-42b8-a09f-32dab99b204c 9341577b-03f6-4057-b569-da5b1fbf49fe -->
# Phase 1-2: Work Orders List & Details Improvements

## Overview

Phase 1 focuses on improving the Work Orders table with "at a glance" columns and actions.

Phase 2 enhances the Work Order Details modal with KPI tiles, shortage calculations, and Cancel functionality.

## Phase 1: Work Orders Table Improvements

### Goal

Add comprehensive columns and actions to the Work Orders table for better visibility.

### Tasks

**File**: `apps/frontend/components/WorkOrdersTable.tsx`

Add columns in this order:

1. **WO #** - Work order number
2. **Product** - Product name/description
3. **Qty + UoM** - Quantity and unit of measure (e.g., "100 kg")
4. **Status** - Status badge with color coding
5. **Line/Machine** - Production line or machine assignment
6. **Dates** - Scheduled start/end or due date
7. **Priority** - Priority level (1-5 or Low/Medium/High)
8. **Progress %** - Optional progress indicator (placeholder for now)
9. **Shortages** - Count of BOM items with shortages (show "–" until calculated)
10. **Actions** - Dropdown menu with:

    - View details (existing)
    - Cancel (disabled if status is completed/cancelled)

### Implementation Details

```typescript
// Column structure
const columns = [
  { header: 'WO #', accessor: 'wo_number' },
  { header: 'Product', accessor: 'product' },
  { header: 'Qty + UoM', accessor: (row) => `${row.quantity} ${row.uom}` },
  { header: 'Status', accessor: 'status', render: (status) => <StatusBadge status={status} /> },
  { header: 'Line/Machine', accessor: 'line_number' or 'machine' },
  { header: 'Dates', accessor: 'scheduled_start' or 'due_date' },
  { header: 'Priority', accessor: 'priority' },
  { header: 'Progress %', accessor: (row) => calculateProgress(row) },
  { header: 'Shortages', accessor: (row) => calculateShortages(row) || '–' },
  { header: 'Actions', render: (row) => <ActionsMenu workOrder={row} /> }
];
```

**Shortage Calculation** (temporary, until API ready):

- For now, show "–" in the table
- Will compute in details modal where BOM data is available
- Formula: count BOM rows where `stock_on_hand < total_qty_needed`

## Phase 2: Work Order Details Modal Enhancements

### Goal

Add KPI tiles, shortage calculations in BOM table, and Cancel action.

### Tasks

**File**: `apps/frontend/components/WorkOrderDetailsModal.tsx`

#### 1. Add 3 KPI Tiles (above details grid)

```typescript
<div className="grid grid-cols-3 gap-4 mb-6">
  {/* KPI 1: Shortages */}
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="text-sm text-red-600 font-medium">Shortages</div>
    <div className="text-2xl font-bold text-red-900">{calculateShortages()}</div>
    <div className="text-xs text-red-500">BOM items short</div>
  </div>
  
  {/* KPI 2: Plan vs Real */}
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <div className="text-sm text-blue-600 font-medium">Plan vs Real</div>
    <div className="text-sm text-blue-900">
      Scheduled: {formatDate(scheduled_start)} - {formatDate(scheduled_end)}
      {actual_start && <div>Actual: {formatDate(actual_start)} - {formatDate(actual_end)}</div>}
    </div>
  </div>
  
  {/* KPI 3: Progress/Yield */}
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <div className="text-sm text-green-600 font-medium">Progress/Yield</div>
    <div className="text-2xl font-bold text-green-900">
      {actual_output ? `${(actual_output / quantity * 100).toFixed(1)}%` : 'Pending'}
    </div>
  </div>
</div>
```

**Shortages Calculation**:

```typescript
const calculateShortages = () => {
  if (!bomItems) return 0;
  return bomItems.filter(item => 
    item.total_qty_needed > (item.stock_on_hand || 0)
  ).length;
};
```

#### 2. Extend BOM Table with New Columns

Add to existing BOM table:

- **Reserved** column (placeholder: 0 for now)
- **Shortage** column with formula: `max(total_qty_needed - stock_on_hand, 0)`
- Highlight rows where shortage > 0 (red background)
```typescript
<table>
  <thead>
    <tr>
      <th>Material</th>
      <th>Qty Needed</th>
      <th>On Hand</th>
      <th>Reserved</th>
      <th>Shortage</th>
    </tr>
  </thead>
  <tbody>
    {bomItems.map(item => {
      const shortage = Math.max(item.total_qty_needed - (item.stock_on_hand || 0), 0);
      return (
        <tr className={shortage > 0 ? 'bg-red-50' : ''}>
          <td>{item.material_name}</td>
          <td>{item.total_qty_needed} {item.uom}</td>
          <td>{item.stock_on_hand || 0}</td>
          <td>0</td>
          <td className={shortage > 0 ? 'text-red-600 font-medium' : ''}>
            {shortage > 0 ? shortage : '–'}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
```


#### 3. Add Cancel WO Button

Add to modal footer or header actions:

```typescript
const canCancel = ['draft', 'planned', 'released'].includes(workOrder.status);

<button
  onClick={handleCancel}
  disabled={!canCancel}
  className={`px-4 py-2 rounded-md ${
    canCancel 
      ? 'bg-red-600 hover:bg-red-700 text-white' 
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
>
  Cancel WO
</button>
```

**Cancel Handler**:

```typescript
const handleCancel = async () => {
  if (!confirm('Are you sure you want to cancel this work order?')) return;
  
  const reason = prompt('Cancellation reason (optional):');
  
  // Call clientState function
  cancelWorkOrder(workOrder.id, reason);
  
  toast.success(`Work Order ${workOrder.wo_number} cancelled`);
  onClose();
  onSuccess(); // Refresh list
};
```

## Phase 2 Continued: Client State Updates

### File: `apps/frontend/lib/clientState.ts`

Add `cancelWorkOrder` function:

```typescript
const cancelWorkOrder = (id: string, reason?: string) => {
  const index = workOrders.findIndex(wo => wo.id === id);
  if (index === -1) return;
  
  const oldStatus = workOrders[index].status;
  
  // Update status
  workOrders[index] = {
    ...workOrders[index],
    status: 'cancelled',
    updated_at: new Date().toISOString()
  };
  
  // Add audit event (in-memory for now)
  auditEvents.push({
    id: `audit_${Date.now()}`,
    entity_type: 'work_order',
    entity_id: id,
    event_type: 'cancel',
    old_value: { status: oldStatus },
    new_value: { status: 'cancelled' },
    user_id: 'current_user', // Replace with actual user
    timestamp: new Date().toISOString(),
    reason: reason || undefined
  });
  
  notifySubscribers();
};

// Export
export const clientState = {
  // ... existing exports
  cancelWorkOrder
};
```

Add types if needed:

```typescript
interface AuditEvent {
  id: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  old_value: any;
  new_value: any;
  user_id: string;
  timestamp: string;
  reason?: string;
}

let auditEvents: AuditEvent[] = [];
```

## Acceptance Criteria

### Phase 1

- ✅ Work Orders table displays all new columns in correct order
- ✅ Shortages column shows "–" (will compute later)
- ✅ Actions menu appears with "View details" and "Cancel"
- ✅ "Cancel" button is disabled for completed/cancelled work orders

### Phase 2

- ✅ KPI tiles visible above details grid
- ✅ Shortages KPI shows correct count
- ✅ Plan vs Real shows scheduled dates (and actual if available)
- ✅ Progress/Yield shows percentage or "Pending"
- ✅ BOM table includes Reserved and Shortage columns
- ✅ BOM rows with shortages are highlighted (red background)
- ✅ Cancel WO button shows correct enabled/disabled state
- ✅ Clicking Cancel WO updates status to 'cancelled' in UI
- ✅ Toast confirmation appears on successful cancel
- ✅ Audit event is created (in-memory)

## Files to Modify

1. `apps/frontend/components/WorkOrdersTable.tsx` - Add new columns and actions menu
2. `apps/frontend/components/WorkOrderDetailsModal.tsx` - Add KPI tiles, BOM columns, Cancel button
3. `apps/frontend/lib/clientState.ts` - Add cancelWorkOrder function and audit events array
4. `apps/frontend/lib/types.ts` - Add AuditEvent type if needed

## Notes

- Keep existing product→line filtering logic intact
- Do not change create/edit form logic
- Status badges should use existing color coding
- Shortage calculations use simple formula: `max(needed - on_hand, 0)`
- For now, "Reserved" column always shows 0
- Progress % can be placeholder/computed from actual_output if available

### To-dos

- [ ] Replace router.replace() with window.location.href for immediate redirect
- [ ] Fix root page to only redirect when on root path
- [ ] Remove or consolidate conflicting useEffects in login page
- [ ] Test that redirect actually navigates to correct page