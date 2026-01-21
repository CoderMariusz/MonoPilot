# Material Consumption Components Guide

**Story:** 04.6a - Material Consumption Desktop
**Extended:** 04.6c - 1:1 Consumption Enforcement, 04.6d - Consumption Correction, 04.6e - Over-Consumption Control
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

This guide covers the React components for material consumption in work order execution. The components follow ShadCN UI patterns and integrate with the consumption service layer.

## Component Architecture

```
/components/production/consumption/
  index.ts                        # Barrel export
  MaterialsTable.tsx              # Required materials with progress
  AddConsumptionModal.tsx         # Two-step LP selection wizard
  ConsumptionHistoryTableEnhanced.tsx  # History with reversal
  ReverseConsumptionModal.tsx     # Reversal confirmation (04.6d)
  OverConsumptionApprovalModal.tsx # Over-consumption workflow (04.6e)
  VarianceIndicator.tsx           # Variance display (04.6e)
  LPSearchInput.tsx               # LP barcode search
  WOSummaryCard.tsx               # Work order header card
  FullLPRequiredBadge.tsx         # 1:1 badge (04.6c)
  ConsumptionQtyInput.tsx         # Qty input with lock state (04.6c)
```

---

## OverConsumptionApprovalModal

**Story:** 04.6e - Over-Consumption Control

Modal component for over-consumption approval workflow. Supports two views:
- **Operator view**: Request approval or view pending status
- **Manager view**: Approve or reject with reason

### Props

```typescript
interface OverConsumptionApprovalModalProps {
  /** Over-consumption data to display */
  overConsumptionData: OverConsumptionData;
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal closes */
  onOpenChange: (open: boolean) => void;
  /** Callback when manager approves */
  onApproved: (data: ApprovalData) => Promise<void> | void;
  /** Callback when manager rejects */
  onRejected: (data: RejectionData) => Promise<void> | void;
  /** Callback when operator submits request */
  onRequestSubmitted: (data: OverConsumptionData) => Promise<void> | void;
  /** Whether current user is manager */
  isManager: boolean;
  /** Existing pending request (if any) */
  pendingRequest?: PendingRequest;
}

interface OverConsumptionData {
  wo_id: string;
  wo_number: string;
  wo_material_id: string;
  product_code: string;
  product_name: string;
  lp_id: string;
  lp_number: string;
  required_qty: number;
  current_consumed_qty: number;
  requested_qty: number;
  total_after_qty: number;
  over_consumption_qty: number;
  variance_percent: number;
  uom: string;
}

interface PendingRequest {
  request_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requested_by: string;
  requested_by_name: string;
  requested_at: string;
  decided_by?: string;
  decided_by_name?: string;
  decided_at?: string;
  approval_reason?: string;
  rejection_reason?: string;
}

interface ApprovalData {
  request_id: string;
  reason?: string;
}

interface RejectionData {
  request_id: string;
  reason: string;
}
```

### Usage

```tsx
import { OverConsumptionApprovalModal } from '@/components/production/consumption';

function ConsumptionPage({ woId }) {
  const [overConsumptionData, setOverConsumptionData] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const { isManager } = useUserRole();

  const handleConsumptionAttempt = async (material, lp, qty) => {
    const result = await OverConsumptionService.checkOverConsumption(
      material.id,
      qty
    );

    if (result.isOverConsumption) {
      setOverConsumptionData({
        wo_id: woId,
        wo_number: workOrder.wo_number,
        wo_material_id: material.id,
        product_code: material.product_code,
        product_name: material.material_name,
        lp_id: lp.id,
        lp_number: lp.lp_number,
        required_qty: result.requiredQty,
        current_consumed_qty: result.currentConsumedQty,
        requested_qty: qty,
        total_after_qty: result.currentConsumedQty + qty,
        over_consumption_qty: result.overQty,
        variance_percent: result.variancePercent,
        uom: material.uom,
      });
    }
  };

  return (
    <>
      {/* ... consumption UI ... */}

      {overConsumptionData && (
        <OverConsumptionApprovalModal
          overConsumptionData={overConsumptionData}
          open={!!overConsumptionData}
          onOpenChange={(open) => !open && setOverConsumptionData(null)}
          onApproved={async (data) => {
            await approveOverConsumption(data);
            setOverConsumptionData(null);
            refetch();
          }}
          onRejected={async (data) => {
            await rejectOverConsumption(data);
            setOverConsumptionData(null);
          }}
          onRequestSubmitted={async (data) => {
            const result = await requestOverConsumptionApproval(data);
            setPendingRequest({
              request_id: result.request_id,
              status: 'pending',
              requested_by: result.requested_by,
              requested_by_name: result.requested_by_name,
              requested_at: result.requested_at,
            });
          }}
          isManager={isManager}
          pendingRequest={pendingRequest}
        />
      )}
    </>
  );
}
```

### Modal Sections

**1. Header**
- Warning icon with amber color
- Title: "Over-Consumption Approval Required"

**2. Material/WO Card**
- Material code and name
- WO number
- LP number
- Requester info (manager view only)
- Quantity breakdown:
  - BOM Requirement
  - Already Consumed
  - Attempting
  - Total After
  - Over-consumption summary with percentage

**3. Status/Action Section**

**Operator View - No Pending Request:**
- Info message explaining approval requirement
- "Request Approval" button

**Operator View - Pending Request:**
- Blue alert with clock icon
- "Awaiting Manager Approval" message
- Request ID displayed
- "Cancel Request" button

**Operator View - Rejected:**
- Red destructive alert
- Rejection reason displayed
- Manager name and timestamp

**Manager View - Pending Request:**
- Approval reason textarea (optional)
- "Approve" button (green)
- "Reject" button (red, opens rejection form)

**Manager View - Rejection Form:**
- Rejection reason textarea (required)
- Validation error if empty
- "Confirm Reject" button
- "Cancel" button (returns to approve view)

### Validation

```typescript
// Rejection requires reason
const isRejectValid = rejectionReason.trim().length > 0;

// Approval reason is optional
const approvalReason = approvalReason || undefined;
```

### States

| State | Description | UI |
|-------|-------------|-----|
| idle | Modal closed | - |
| operator_initial | Operator, no pending request | Request button visible |
| operator_pending | Operator, request pending | Awaiting message, cancel button |
| operator_rejected | Operator, request rejected | Rejection reason displayed |
| manager_review | Manager, pending request | Approve/reject buttons |
| manager_rejecting | Manager, entering rejection | Rejection form visible |
| submitting | Any action in progress | Spinner, buttons disabled |
| error | Action failed | Error alert displayed |

### Data Attributes (for testing)

| Attribute | Element |
|-----------|---------|
| `data-testid="modal-backdrop"` | Modal container |
| `data-testid="warning-icon"` | Warning triangle icon |
| `data-testid="bom-requirement"` | BOM requirement display |
| `data-testid="already-consumed"` | Already consumed display |
| `data-testid="attempting"` | Attempting quantity display |
| `data-testid="total-after"` | Total after display |
| `data-testid="clock-icon"` | Clock icon (pending state) |

### Wireframe: Operator View

```
+------------------------------------------+
| [!] Over-Consumption Approval Required   |
+------------------------------------------+
| Material: RM-001 - Raw Material A        |
| WO Number: WO-2025-001                   |
| LP: LP-2026-00123                        |
|                                          |
| BOM Requirement:  100 kg                 |
| Already Consumed: 100 kg                 |
| Attempting:       +10 kg                 |
| Total After:      110 kg                 |
+------------------------------------------+
| Over-consumption: +10 kg (+10%)          |
+------------------------------------------+
| [i] This over-consumption requires       |
|     manager approval. Submit a request   |
|     and wait for approval before         |
|     proceeding.                          |
+------------------------------------------+
| [Close]                [Request Approval]|
+------------------------------------------+
```

### Wireframe: Manager View

```
+------------------------------------------+
| [!] Over-Consumption Approval Required   |
+------------------------------------------+
| Material: RM-001 - Raw Material A        |
| WO Number: WO-2025-001                   |
| Requested by: John Doe                   |
|                                          |
| BOM Requirement:  100 kg                 |
| Already Consumed: 100 kg                 |
| Attempting:       +10 kg                 |
| Total After:      110 kg                 |
+------------------------------------------+
| Over-consumption: +10 kg (+10%)          |
+------------------------------------------+
| Reason for Approval (Optional)           |
| [__________________________________]     |
|                                          |
+------------------------------------------+
| [Reject]                       [Approve] |
+------------------------------------------+
```

---

## VarianceIndicator

**Story:** 04.6e - Over-Consumption Control

Visual indicator for material consumption variance. Displays percentage with color-coded status.

### Props

```typescript
interface VarianceIndicatorProps {
  /** Variance percentage (can be null/undefined) */
  variancePercent: number | null | undefined;
  /** Size variant */
  size?: 'sm' | 'md';
}
```

### Usage

```tsx
import { VarianceIndicator } from '@/components/production/consumption';

// In MaterialsTable
function MaterialRow({ material }) {
  const variancePercent = material.required_qty > 0
    ? ((material.consumed_qty - material.required_qty) / material.required_qty) * 100
    : 0;

  return (
    <TableRow>
      <TableCell>{material.material_name}</TableCell>
      <TableCell>{material.consumed_qty} / {material.required_qty}</TableCell>
      <TableCell>
        <VarianceIndicator variancePercent={variancePercent} />
      </TableCell>
    </TableRow>
  );
}

// In dashboard high variance alerts
function HighVarianceAlert({ variance }) {
  return (
    <Alert variant="destructive">
      <VarianceIndicator variancePercent={variance} size="sm" />
      <span>High variance detected</span>
    </Alert>
  );
}
```

### Variance Thresholds

| Range | Status | Color | Icon |
|-------|--------|-------|------|
| <= 0% | exact | Green | CheckCircle |
| 1% - 10% | acceptable | Yellow | AlertTriangle |
| > 10% | high | Red | XCircle |

### Visual Specifications

| Property | Small (sm) | Medium (md) |
|----------|------------|-------------|
| Font Size | text-xs (12px) | text-sm (14px) |
| Icon Size | h-3 w-3 | h-4 w-4 |
| Padding | px-1.5 py-0.5 | px-2 py-1 |

### Color Classes

```typescript
const colorClasses = {
  green: {
    text: 'text-green-600',
    bg: 'bg-green-50',
  },
  yellow: {
    text: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  red: {
    text: 'text-red-600',
    bg: 'bg-red-50',
  },
};
```

### Format Rules

```typescript
// Zero variance
formatVariance(0) // "0%"

// Positive variance (over-consumption)
formatVariance(5.5) // "+5.5%"
formatVariance(15) // "+15%"

// Negative variance (under-consumption)
formatVariance(-10) // "-10%"
```

### Accessibility

- `aria-label` - Descriptive label (e.g., "Variance: 5% - acceptable")
- Icon has `aria-hidden="true"` (decorative)

### Data Attributes (for testing)

| Attribute | Element |
|-----------|---------|
| `data-testid="variance-indicator"` | Container |
| `data-testid="variance-icon"` | Icon element |
| `data-icon="check-circle"` | Exact match icon |
| `data-icon="alert-triangle"` | Acceptable variance icon |
| `data-icon="x-circle"` | High variance icon |

### Example States

**Exact Match (0%):**
```
+-------------------+
| [v] 0%            |  (green bg, green text)
+-------------------+
```

**Acceptable (5%):**
```
+-------------------+
| [!] +5%           |  (yellow bg, yellow text)
+-------------------+
```

**High Variance (15%):**
```
+-------------------+
| [x] +15%          |  (red bg, red text)
+-------------------+
```

---

## ReverseConsumptionModal

**Story:** 04.6d - Consumption Correction (Reversal)

Confirmation modal for reversing a consumption record. Only accessible to Manager/Admin roles.

### Props

```typescript
interface ReverseConsumptionModalProps {
  /** Work order ID */
  woId: string;
  /** Consumption record to reverse (null to close modal) */
  consumption: Consumption | null;
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback when reversal succeeds */
  onSuccess: () => void;
}
```

### Usage

```tsx
import { ReverseConsumptionModal } from '@/components/production/consumption';
import { useReverseConsumption } from '@/lib/hooks/use-consumption';

function ConsumptionHistorySection({ woId, isManager }) {
  const [consumptionToReverse, setConsumptionToReverse] = useState<Consumption | null>(null);
  const { data, refetch } = useConsumptionHistory(woId);

  return (
    <>
      <ConsumptionHistoryTableEnhanced
        woId={woId}
        consumptions={data?.consumptions || []}
        canReverse={isManager}
        onReverse={(consumption) => setConsumptionToReverse(consumption)}
      />
      <ReverseConsumptionModal
        woId={woId}
        consumption={consumptionToReverse}
        open={!!consumptionToReverse}
        onClose={() => setConsumptionToReverse(null)}
        onSuccess={() => {
          setConsumptionToReverse(null);
          refetch();
        }}
      />
    </>
  );
}
```

### Modal Sections

**1. Consumption Details (Read-Only)**
- Material name
- LP number
- Consumed quantity with UoM
- Consumed at timestamp

**2. Warning Message**
Amber alert explaining reversal effects:
- LP quantity will be restored
- Consumption marked as REVERSED
- WO material consumed qty will be reduced
- Audit log entry will be created
- Action is logged and cannot be undone

**3. Reversal Form**
- **Reason dropdown** (required): Select from predefined options
- **Notes textarea** (conditional): Required when reason is "other"

### Reason Options

| Value | Label | Notes Required |
|-------|-------|----------------|
| scanned_wrong_lp | Scanned Wrong LP | No |
| wrong_quantity | Wrong Quantity Entered | No |
| operator_error | Operator Error | No |
| quality_issue | Quality Issue | No |
| other | Other (specify) | Yes |

### Validation

```typescript
// Form validation
const isReasonValid = reason !== '';
const isNotesValid = reason !== 'other' || notes.trim().length > 0;
const canSubmit = isReasonValid && isNotesValid && !isSubmitting;
```

### States

| State | Description | UI |
|-------|-------------|-----|
| idle | Modal closed | - |
| viewing | Modal open, showing details | Form enabled |
| submitting | Reversal in progress | Spinner, inputs disabled |
| success | Reversal complete | Toast, modal closes, refetch triggered |
| error | Reversal failed | Error message, form re-enabled |

### Data Attributes (for testing)

| Attribute | Element |
|-----------|---------|
| `data-testid="reversal-modal"` | Modal container |
| `data-testid="reversal-reason"` | Reason dropdown |
| `data-testid="reversal-notes"` | Notes textarea |
| `data-testid="close-modal-button"` | Close button (X) |

### Example

```tsx
// Full implementation
function ReverseConsumptionModal({ woId, consumption, open, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const reverseConsumption = useReverseConsumption();

  const handleConfirmReversal = async () => {
    if (!reason) {
      setError('Please select a reason for reversal');
      return;
    }
    if (reason === 'other' && !notes.trim()) {
      setError('Please provide additional details for "Other" reason');
      return;
    }
    if (!consumption) return;

    try {
      setError(null);
      await reverseConsumption.mutateAsync({
        woId,
        request: {
          consumption_id: consumption.id,
          reason: reason === 'other' ? notes : reason,
          notes: notes || undefined,
        },
      });

      toast({
        title: 'Consumption reversed',
        description: `Reversed ${consumption.consumed_qty} ${consumption.uom}`,
      });

      setReason('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reverse';
      setError(message);
    }
  };

  // ... render modal
}
```

### Toast Notifications

**Success:**
```typescript
toast({
  title: 'Consumption reversed',
  description: `Reversed consumption of ${qty} ${uom} from ${lpNumber}`,
});
```

**Error:**
```typescript
toast({
  variant: 'destructive',
  title: 'Reversal failed',
  description: errorMessage,
});
```

---

## FullLPRequiredBadge

**Story:** 04.6c - 1:1 Consumption Enforcement

Badge component indicating that a material requires full LP consumption (1:1 mode).

### Props

```typescript
interface FullLPRequiredBadgeProps {
  /** Size variant: small or medium (default) */
  size?: 'small' | 'medium';
  /** Display variant: desktop (default) or scanner */
  variant?: 'desktop' | 'scanner';
  /** Additional CSS classes */
  className?: string;
}
```

### Usage

```tsx
import { FullLPRequiredBadge } from '@/components/production/consumption';

// In MaterialsTable
function MaterialRow({ material }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{material.material_name}</span>
          {material.consume_whole_lp && (
            <FullLPRequiredBadge size="small" variant="desktop" />
          )}
        </div>
      </TableCell>
      {/* ... */}
    </TableRow>
  );
}

// In Scanner MaterialsList
function ScannerMaterialItem({ material }) {
  return (
    <div className="p-3 border-b">
      <span className="font-medium">{material.material_name}</span>
      {material.consume_whole_lp && (
        <FullLPRequiredBadge size="medium" variant="scanner" />
      )}
    </div>
  );
}
```

### Visual Specifications

| Property | Desktop | Scanner |
|----------|---------|---------|
| Background | Yellow-900 | Yellow-600 |
| Text Color | Yellow-300 | Yellow-900 |
| Font Size | 12px (text-xs) | 14px (text-sm) |
| Icon Size | 16px (h-4 w-4) | 20px (h-5 w-5) |
| Padding (medium) | px-2 py-1 | px-2 py-1 |
| Padding (small) | px-1.5 py-0.5 | px-1.5 py-0.5 |

### Accessibility

- `role="status"` - Announces badge as status indicator
- `aria-label="Full LP Required"` - Screen reader announcement
- `tabIndex={0}` - Focusable for keyboard navigation
- Lock icon has `aria-hidden="true"` (decorative)

### Data Attributes (for testing)

| Attribute | Element |
|-----------|---------|
| `data-testid="full-lp-badge"` | Badge container |
| `data-testid="lock-icon"` | Lock icon |

### Example States

**Desktop (Yellow-900/Yellow-300):**
```
+---------------------------+
| [Lock] Full LP Required   |
+---------------------------+
```

**Scanner (Yellow-600/Yellow-900):**
```
+-------------------------------+
|   [Lock] Full LP Required     |
+-------------------------------+
```

---

## ConsumptionQtyInput

**Story:** 04.6c - 1:1 Consumption Enforcement

Quantity input component with editable and read-only (locked) states for material consumption.

### Props

```typescript
interface ConsumptionQtyInputProps {
  /** Current quantity value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Unit of measure to display */
  uom: string;
  /** Maximum allowed quantity */
  maxQty: number;
  /** Whether the input is read-only (for consume_whole_lp=true) */
  isReadOnly: boolean;
  /** Whether to show the lock icon */
  showLockIcon: boolean;
  /** ID for the warning message element (for aria-describedby) */
  warningId?: string;
  /** Additional CSS classes for the container */
  className?: string;
}
```

### Usage

```tsx
import { ConsumptionQtyInput } from '@/components/production/consumption';

// In AddConsumptionModal Step 2
function QuantityStep({ lpData, material }) {
  const [consumeQty, setConsumeQty] = useState(lpData.current_qty);
  const isFullLPRequired = material.consume_whole_lp;

  return (
    <div>
      {isFullLPRequired && (
        <Alert id="full-lp-warning" variant="warning" className="mb-4">
          <AlertTitle>Full LP Required</AlertTitle>
          <AlertDescription>
            This material requires full LP consumption.
          </AlertDescription>
        </Alert>
      )}

      <ConsumptionQtyInput
        value={consumeQty}
        onChange={setConsumeQty}
        uom={material.uom}
        maxQty={lpData.current_qty}
        isReadOnly={isFullLPRequired}
        showLockIcon={isFullLPRequired}
        warningId={isFullLPRequired ? 'full-lp-warning' : undefined}
      />
    </div>
  );
}
```

### Visual Specifications

| Property | Editable State | Read-Only State |
|----------|----------------|-----------------|
| Border Color | Slate-600 | Yellow-600 |
| Background | Slate-800 | Slate-900 |
| Cursor | text | not-allowed |
| Lock Icon | Hidden | Visible (right side) |

### Behavior

**Editable State (`isReadOnly=false`):**
- User can type or modify the quantity
- Value is clamped between 0 and maxQty
- Negative values are rejected
- Empty input sets value to 0

**Read-Only State (`isReadOnly=true`):**
- Input is pre-filled with LP quantity
- All change events are ignored
- Cursor shows "not-allowed"
- Lock icon displays on right side

### Input Handling

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (isReadOnly) return;

  const newValue = parseFloat(e.target.value);

  // Don't allow negative values
  if (newValue < 0) return;

  // Don't allow values greater than maxQty
  if (!isNaN(newValue) && newValue > maxQty) {
    onChange(maxQty);
    return;
  }

  if (!isNaN(newValue)) {
    onChange(newValue);
  } else if (e.target.value === '') {
    onChange(0);
  }
};
```

### Accessibility

- `aria-label="Consumption quantity"` - Input purpose
- `aria-readonly="true"` - When read-only
- `aria-describedby` - Links to warning message when locked
- Lock icon has `aria-hidden="true"` (decorative)

### Data Attributes (for testing)

| Attribute | Element |
|-----------|---------|
| `data-testid="consumption-qty-input"` | Input container |
| `data-testid="qty-input"` | Actual input field |
| `data-testid="lock-icon"` | Lock icon (when visible) |
| `data-testid="uom-display"` | Unit of measure badge |

### Example States

**Editable:**
```
+---------------------------+ +--------+
| 50.5                      | |   kg   |
+---------------------------+ +--------+
  (cursor: text)
```

**Read-Only (Locked):**
```
+---------------------------+ +--------+
| 100                   [L] | |   kg   |
+---------------------------+ +--------+
  (cursor: not-allowed)
  (yellow border)
```

---

## MaterialsTable

Displays required materials with consumption progress bars and variance indicators.

### Props

```typescript
interface MaterialsTableProps {
  materials: ConsumptionMaterial[];
  isLoading?: boolean;
  onConsume: (material: ConsumptionMaterial) => void;
  onRefresh?: () => void;
  woStatus?: string;
}
```

### Usage

```tsx
import { MaterialsTable } from '@/components/production/consumption';

function ConsumptionPage({ woId }) {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  return (
    <MaterialsTable
      materials={materials}
      isLoading={isLoading}
      onConsume={(material) => setSelectedMaterial(material)}
      onRefresh={() => refetchMaterials()}
      woStatus="in_progress"
    />
  );
}
```

### Features

- **Progress bars**: Visual consumed/required ratio per material
- **Variance display**: Color-coded percentage via VarianceIndicator (04.6e)
- **Full LP Required badge**: Lock icon for `consume_whole_lp` materials (04.6c)
- **Filter/Sort controls**: All, Partial, Completed, Over-consumed
- **Consume button**: Opens AddConsumptionModal (disabled when WO not in progress)

### Data Attributes (for testing)

| Attribute | Element |
|-----------|---------|
| `data-testid="materials-table"` | Table container |
| `data-testid="materials-table-loading"` | Loading skeleton |
| `data-testid="materials-table-empty"` | Empty state |
| `data-testid="consumed-qty"` | Consumed quantity cell |
| `data-testid="add-consumption"` | Add consumption button |
| `data-testid="full-lp-badge"` | Full LP Required badge (04.6c) |
| `data-testid="variance-indicator"` | Variance indicator (04.6e) |

---

## AddConsumptionModal

Two-step wizard for LP selection and quantity confirmation.

### Props

```typescript
interface AddConsumptionModalProps {
  woId: string;
  material: ConsumptionMaterial | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

### Usage

```tsx
import { AddConsumptionModal } from '@/components/production/consumption';

function ConsumptionPage() {
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  return (
    <>
      <MaterialsTable
        materials={materials}
        onConsume={(m) => setSelectedMaterial(m)}
      />
      <AddConsumptionModal
        woId={woId}
        material={selectedMaterial}
        open={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        onSuccess={() => {
          setSelectedMaterial(null);
          refetchMaterials();
        }}
      />
    </>
  );
}
```

### Step 1: LP Selection

- WO context card (material, required/consumed/remaining)
- LP barcode search input with validation
- Available LPs table (FIFO ordered by expiry)
- Real-time LP validation on selection

### Step 2: Quantity Confirmation

- LP validated details card (batch, expiry, location)
- **ConsumptionQtyInput component** (04.6c)
- **Warning banner for consume_whole_lp=true** (04.6c)
- "Use All Available" quick action
- Consumption summary preview
- LP status after consumption preview
- Over-consumption warning (if applicable)

### 1:1 Enforcement Behavior (04.6c)

When `material.consume_whole_lp=true`:

1. **Step 2 enters with qty pre-filled** to LP.qty
2. **Warning banner displays**: "This material requires full LP consumption"
3. **ConsumptionQtyInput is read-only** with lock icon
4. **Primary action is "Use All Available"** (no manual qty entry)

```tsx
// Inside Step 2 of AddConsumptionModal
const isFullLPRequired = material.consume_whole_lp;

{isFullLPRequired && (
  <Alert variant="warning" id="full-lp-warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Full LP Required</AlertTitle>
    <AlertDescription>
      This material requires full LP consumption.
    </AlertDescription>
  </Alert>
)}

<ConsumptionQtyInput
  value={consumeQty}
  onChange={setConsumeQty}
  uom={material.uom}
  maxQty={lpData.current_qty}
  isReadOnly={isFullLPRequired}
  showLockIcon={isFullLPRequired}
  warningId={isFullLPRequired ? 'full-lp-warning' : undefined}
/>
```

### Data Attributes (for testing)

| Attribute | Element |
|-----------|---------|
| `data-testid="consumption-modal"` | Modal container |
| `data-testid="lp-validation-error"` | LP validation error alert |
| `data-testid="lp-validation-success"` | LP validated success alert |
| `data-testid="lp-details"` | LP details card (Step 2) |
| `data-testid="lp-batch-number"` | Batch number display |
| `data-testid="lp-expiry-date"` | Expiry date display |
| `data-testid="lp-available-qty"` | Available quantity display |
| `data-testid="consume-qty-input"` | Quantity input field |
| `data-testid="qty-validation-error"` | Quantity validation error |
| `data-testid="full-lp-warning"` | Full LP warning banner (04.6c) |

---

## ConsumptionHistoryTableEnhanced

Displays consumption history with reversal capability.

### Props

```typescript
interface ConsumptionHistoryTableProps {
  woId: string;
  consumptions: Consumption[];
  canReverse: boolean;
  onReverse: (consumption: Consumption) => void;
}
```

### Usage

```tsx
import { ConsumptionHistoryTableEnhanced } from '@/components/production/consumption';

function HistorySection({ woId, isManager }) {
  const { consumptions, refetch } = useConsumptionHistory(woId);

  return (
    <ConsumptionHistoryTableEnhanced
      woId={woId}
      consumptions={consumptions}
      canReverse={isManager}
      onReverse={(consumption) => openReverseModal(consumption)}
    />
  );
}
```

### Columns

| Column | Description |
|--------|-------------|
| LP Number | License plate identifier |
| Material | Material name |
| Qty | Consumed quantity with UoM |
| Consumed At | Timestamp |
| Consumed By | User name |
| Batch | LP batch number |
| Expiry | LP expiry date |
| Status | Active or Reversed badge |
| **Full LP** | Lock icon if is_full_lp=true (04.6c) |
| Actions | Reverse button (managers only) (04.6d) |

### Status Badges

```tsx
// Active consumption
<Badge variant="default" className="bg-green-100 text-green-700">
  Active
</Badge>

// Reversed consumption (04.6d)
<Badge variant="secondary" className="bg-gray-100 text-gray-600">
  Reversed
</Badge>
```

### Reverse Button (04.6d)

```tsx
// Only visible to managers for non-reversed consumptions
{canReverse && !consumption.reversed && (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onReverse(consumption)}
  >
    <Undo2 className="h-4 w-4" />
  </Button>
)}
```

---

## LPSearchInput

Barcode search input with autocomplete and validation feedback.

### Props

```typescript
interface LPSearchInputProps {
  onSelect: (lp: AvailableLP) => void;
  availableLPs: AvailableLP[];
  isLoading?: boolean;
  placeholder?: string;
}
```

### Usage

```tsx
import { LPSearchInput } from '@/components/production/consumption';

function LPSelector({ onLPSelect, availableLPs }) {
  return (
    <LPSearchInput
      onSelect={onLPSelect}
      availableLPs={availableLPs}
      isLoading={isSearching}
      placeholder="Scan or type LP number..."
    />
  );
}
```

### Features

- Debounced search (300ms)
- Barcode scanner compatible (handles rapid input)
- Autocomplete dropdown with matching LPs
- Keyboard navigation (Arrow keys, Enter, Escape)

---

## WOSummaryCard

Work order context card for consumption page header.

### Props

```typescript
interface WOSummaryCardProps {
  workOrder: WorkOrder;
  isLoading?: boolean;
}
```

### Usage

```tsx
import { WOSummaryCard } from '@/components/production/consumption';

function ConsumptionPage({ workOrder }) {
  return (
    <div>
      <WOSummaryCard workOrder={workOrder} />
      <MaterialsTable ... />
    </div>
  );
}
```

### Displays

- WO number and status badge
- Product name and SKU
- Planned quantity and UoM
- Start/end dates
- Assigned line/machine

---

## Hooks

### useConsumptionMaterials

Fetches WO materials with consumption progress.

```typescript
import { useConsumptionMaterials } from '@/lib/hooks/use-consumption';

function Component({ woId }) {
  const { data, isLoading, refetch } = useConsumptionMaterials(woId);
  // data.materials, data.total
  // Each material has consume_whole_lp flag (04.6c)
}
```

### useConsumptionHistory

Fetches paginated consumption history.

```typescript
import { useConsumptionHistory } from '@/lib/hooks/use-consumption';

function Component({ woId }) {
  const { data, isLoading, refetch } = useConsumptionHistory(woId, {
    page: 1,
    limit: 20,
    status: 'active',
  });
  // Each consumption has is_full_lp flag (04.6c)
  // Each consumption has reversed status (04.6d)
}
```

### useAvailableLPs

Fetches available LPs for a material.

```typescript
import { useAvailableLPs } from '@/lib/hooks/use-consumption';

function Component({ woId, productId, uom }) {
  const { data: availableLPs, isLoading } = useAvailableLPs(
    woId,
    productId,
    uom,
    searchQuery,
    { enabled: !!productId }
  );
}
```

### useRecordConsumption

Mutation hook for recording consumption.

```typescript
import { useRecordConsumption } from '@/lib/hooks/use-consumption';

function Component() {
  const recordConsumption = useRecordConsumption();

  const handleConsume = async () => {
    try {
      await recordConsumption.mutateAsync({
        woId,
        request: { wo_material_id, lp_id, consume_qty },
      });
    } catch (error) {
      // Handle FULL_LP_REQUIRED error (04.6c)
      if (error.code === 'FULL_LP_REQUIRED') {
        toast.error(`Full LP required. LP qty is ${error.lp_qty}`);
      }
    }
  };
}
```

### useReverseConsumption (04.6d)

Mutation hook for reversing consumption.

```typescript
import { useReverseConsumption } from '@/lib/hooks/use-consumption';

function Component() {
  const reverseConsumption = useReverseConsumption();

  const handleReverse = async (consumptionId: string, reason: string) => {
    try {
      await reverseConsumption.mutateAsync({
        woId,
        request: {
          consumption_id: consumptionId,
          reason,
          notes: 'Optional notes',
        },
      });
      toast.success('Consumption reversed successfully');
    } catch (error) {
      if (error.code === 'ALREADY_REVERSED') {
        toast.error('This consumption has already been reversed');
      } else if (error.code === 'FORBIDDEN') {
        toast.error('Only managers can reverse consumptions');
      }
    }
  };
}
```

### useOverConsumptionApproval (04.6e)

Mutation hooks for over-consumption approval workflow.

```typescript
import {
  useRequestOverConsumption,
  useApproveOverConsumption,
  useRejectOverConsumption,
  usePendingOverConsumption,
} from '@/lib/hooks/use-over-consumption';

function Component({ woId }) {
  // Request approval (operator)
  const requestMutation = useRequestOverConsumption();

  const handleRequest = async () => {
    await requestMutation.mutateAsync({
      woId,
      request: { wo_material_id, lp_id, requested_qty },
    });
  };

  // Approve (manager)
  const approveMutation = useApproveOverConsumption();

  const handleApprove = async (requestId: string, reason?: string) => {
    await approveMutation.mutateAsync({
      woId,
      request: { request_id: requestId, reason },
    });
  };

  // Reject (manager)
  const rejectMutation = useRejectOverConsumption();

  const handleReject = async (requestId: string, reason: string) => {
    await rejectMutation.mutateAsync({
      woId,
      request: { request_id: requestId, reason },
    });
  };

  // Get pending requests
  const { data: pendingRequests } = usePendingOverConsumption(woId);
}
```

---

## TypeScript Types

### ConsumptionMaterial

```typescript
interface ConsumptionMaterial {
  id: string;
  wo_id: string;
  product_id: string;
  material_name: string;
  required_qty: number;
  consumed_qty: number;
  reserved_qty: number;
  uom: string;
  sequence: number;
  consume_whole_lp: boolean; // 04.6c - 1:1 flag
  product?: {
    id: string;
    code: string;
    name: string;
    product_type: string;
  };
}
```

### Consumption

```typescript
interface Consumption {
  id: string;
  wo_id: string;
  material_id: string;
  lp_id: string;
  consumed_qty: number;
  uom: string;
  consumed_at: string;
  consumed_by_user_id: string;
  status: 'consumed' | 'reversed';
  is_full_lp: boolean; // 04.6c - true if entire LP was consumed
  // 04.6d reversal fields
  reversed: boolean;
  reversed_at: string | null;
  reversed_by: string | null;
  reversal_reason: string | null;
  reversal_notes: string | null;
  wo_materials?: { material_name: string } | null;
  license_plates?: { lp_number: string; batch_number?: string; expiry_date?: string } | null;
  consumed_by_user?: { first_name: string; last_name: string; email: string } | null;
}
```

### AvailableLP

```typescript
interface AvailableLP {
  id: string;
  lp_number: string;
  product_id: string;
  quantity: number;
  current_qty: number;
  uom: string;
  status: string;
  qa_status: string;
  batch_number: string | null;
  expiry_date: string | null;
  location_id: string | null;
  location_name: string | null;
}
```

### ReversalRequest (04.6d)

```typescript
interface ReversalRequest {
  consumption_id: string;
  reason: 'scanned_wrong_lp' | 'wrong_quantity' | 'operator_error' | 'quality_issue' | 'other';
  notes?: string;
}
```

### OverConsumptionRequest (04.6e)

```typescript
interface OverConsumptionRequest {
  wo_material_id: string;
  lp_id: string;
  requested_qty: number;
}

interface OverConsumptionApproval {
  request_id: string;
  reason?: string;
}

interface OverConsumptionRejection {
  request_id: string;
  reason: string;
}
```

---

## Styling

Components use Tailwind CSS with ShadCN UI primitives:

- `@/components/ui/button` - Action buttons
- `@/components/ui/badge` - Status badges
- `@/components/ui/progress` - Progress bars
- `@/components/ui/dialog` - Modal dialogs
- `@/components/ui/table` - Data tables
- `@/components/ui/card` - Content cards
- `@/components/ui/alert` - Validation messages (warning variant for 04.6c, 04.6d, 04.6e)
- `@/components/ui/select` - Filter dropdowns, reason dropdown (04.6d)
- `@/components/ui/input` - Text inputs
- `@/components/ui/textarea` - Notes input (04.6d, 04.6e)
- `@/components/ui/skeleton` - Loading states
- `@/components/ui/separator` - Visual dividers (04.6e)

### Story-Specific Colors

| Use Case | Color Class |
|----------|-------------|
| Desktop badge bg (04.6c) | bg-yellow-900 |
| Desktop badge text (04.6c) | text-yellow-300 |
| Scanner badge bg (04.6c) | bg-yellow-600 |
| Scanner badge text (04.6c) | text-yellow-900 |
| Locked input border (04.6c) | border-yellow-600 |
| Lock icon (04.6c) | text-yellow-600 |
| Reversal warning bg (04.6d) | bg-amber-50 |
| Reversal warning border (04.6d) | border-amber-200 |
| Reversal button (04.6d) | bg-amber-600 hover:bg-amber-700 |
| Reversed badge bg (04.6d) | bg-gray-100 |
| Reversed badge text (04.6d) | text-gray-600 |
| Over-consumption header (04.6e) | text-amber-600 |
| Pending alert bg (04.6e) | bg-blue-50 |
| Pending alert border (04.6e) | border-blue-200 |
| Pending alert text (04.6e) | text-blue-800 |
| Approve button (04.6e) | bg-green-600 hover:bg-green-700 |
| Variance exact (04.6e) | text-green-600 bg-green-50 |
| Variance acceptable (04.6e) | text-yellow-600 bg-yellow-50 |
| Variance high (04.6e) | text-red-600 bg-red-50 |

---

## Error Handling

All components handle these states:

1. **Loading**: Skeleton loaders
2. **Empty**: Descriptive empty state message
3. **Error**: Toast notifications via `useToast()`
4. **Validation**: Inline error alerts
5. **FULL_LP_REQUIRED** (04.6c): Warning banner + toast with LP qty
6. **ALREADY_REVERSED** (04.6d): Toast with error message
7. **FORBIDDEN** (04.6d, 04.6e): Toast indicating manager role required
8. **PENDING_REQUEST_EXISTS** (04.6e): Toast indicating duplicate request
9. **ALREADY_DECIDED** (04.6e): Toast indicating request already processed

---

## Related Documentation

- [Material Consumption API](../../api/production/material-consumption.md)
- [Over-Consumption Control API](../../api/production/over-consumption-control.md) (04.6e)
- [Consumption Reversal API](../../api/production/consumption-reversal.md) (04.6d)
- [Scanner Consumption Components](./scanner-consume-components.md)
- [Story 04.6a](../../2-MANAGEMENT/epics/current/04-production/04.6a.material-consumption-desktop.md)
- [Story 04.6c](../../2-MANAGEMENT/epics/current/04-production/04.6c.1-1-consumption-enforcement.md)
- [Story 04.6d](../../2-MANAGEMENT/epics/current/04-production/04.6d.consumption-correction.md)
- [Story 04.6e](../../2-MANAGEMENT/epics/current/04-production/04.6e.over-consumption-control.md)
- [ShadCN UI Components](https://ui.shadcn.com/)
