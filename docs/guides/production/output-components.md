# Output Registration Components Guide

**Story:** 04.7a - Output Registration Desktop
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

This guide covers the React components used for output registration in the Production module. These components work together to provide a complete output registration workflow.

## Components

### RegisterOutputModal

**Location:** `components/production/outputs/RegisterOutputModal.tsx`

Modal form for registering production output.

#### Props

```typescript
interface RegisterOutputModalProps {
  /** Work order summary data */
  wo: WorkOrderSummary;
  /** Default location for output */
  defaultLocation?: Location;
  /** Whether QA status is required (from settings) */
  requireQAStatus: boolean;
  /** Confirm callback with form data */
  onConfirm: (data: RegisterOutputInput) => Promise<void>;
  /** Cancel callback */
  onCancel: () => void;
  /** Available locations for dropdown */
  locations?: Location[];
}
```

#### Usage

```tsx
import { RegisterOutputModal } from '@/components/production/outputs/RegisterOutputModal';

function OutputPage() {
  const [showModal, setShowModal] = useState(false);
  const { wo, settings, locations } = useOutputPageData(woId);

  const handleRegister = async (data: RegisterOutputInput) => {
    await registerOutput(data);
    toast.success('Output registered successfully');
    setShowModal(false);
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)}>Register Output</Button>
      {showModal && (
        <RegisterOutputModal
          wo={wo}
          requireQAStatus={settings.require_qa_on_output}
          defaultLocation={wo.default_location_id ? { id: wo.default_location_id, name: wo.default_location_name } : undefined}
          locations={locations}
          onConfirm={handleRegister}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

#### Features

- Auto-calculates expiry date from product shelf life
- Pre-fills batch number from work order
- Pre-selects default location from production line
- Validates QA status requirement from settings
- Shows projected progress after registration
- Keyboard shortcuts: Enter to submit, Escape to cancel

#### Form Fields

| Field | Type | Required | Default Value |
|-------|------|----------|---------------|
| Quantity | number | Yes | Empty |
| UoM | display | - | From product |
| Batch Number | text | Yes | From WO |
| QA Status | select | Conditional | None |
| Location | select | Yes | From line |
| Expiry Date | date | Yes | Today + shelf_life |
| Notes | textarea | No | Empty |

---

### OutputHistoryTable

**Location:** `components/production/outputs/OutputHistoryTable.tsx`

Displays output history with filtering, sorting, and actions.

#### Props

```typescript
interface OutputHistoryTableProps {
  /** List of output records */
  outputs: OutputLP[];
  /** Summary statistics */
  summary: OutputSummary;
  /** Callback to open register output modal */
  onRegisterOutput: () => void;
  /** Callback to export outputs as CSV */
  onExportCSV: () => void;
  /** Callback to view LP details */
  onViewLP: (lpId: string) => void;
  /** Callback to print LP label */
  onPrintLabel: (lpId: string) => void;
  /** Unit of measure for display */
  uom?: string;
}
```

#### Usage

```tsx
import { OutputHistoryTable } from '@/components/production/outputs/OutputHistoryTable';

function OutputsSection() {
  const { outputs, summary } = useOutputData(woId);

  return (
    <OutputHistoryTable
      outputs={outputs}
      summary={summary}
      onRegisterOutput={() => setShowRegisterModal(true)}
      onExportCSV={() => handleExportCSV(woId)}
      onViewLP={(lpId) => router.push(`/warehouse/lps/${lpId}`)}
      onPrintLabel={(lpId) => printLabel(lpId)}
      uom="kg"
    />
  );
}
```

#### Features

- **Filtering**: QA Status, Location
- **Sorting**: All columns (click headers)
- **Actions**: View LP, Print Label
- **Summary**: Total outputs, approved/pending/rejected counts
- **Empty State**: Prompt to register first output
- **Keyboard Accessible**: Tab through filters, Enter/Space to sort

#### Columns

| Column | Sortable | Description |
|--------|----------|-------------|
| LP Number | Yes | License plate identifier |
| Qty | Yes | Output quantity with UoM |
| Batch | Yes | Batch number |
| QA Status | Yes | Approved/Pending/Rejected badge |
| Location | Yes | Storage location name |
| Expiry | Yes | Expiry date |
| Created | Yes | Relative time + user name |
| Actions | No | View, Print buttons |

---

### YieldIndicator

**Location:** `components/production/outputs/YieldIndicator.tsx`

Color-coded yield percentage display.

#### Props

```typescript
interface YieldIndicatorProps {
  /** Yield percentage value (0-100+) */
  value: number | null;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
  /** Optional trend indicator (+/-) */
  trend?: number | null;
  /** Optional additional CSS classes */
  className?: string;
}
```

#### Usage

```tsx
import { YieldIndicator } from '@/components/production/outputs/YieldIndicator';

// Basic usage
<YieldIndicator value={95.5} />

// With size and label
<YieldIndicator value={85.2} size="lg" showLabel />

// With trend
<YieldIndicator value={92.0} trend={+2.5} />

// Null value shows N/A
<YieldIndicator value={null} />
```

#### Color Thresholds

| Yield | Color | Label |
|-------|-------|-------|
| >= 95% | Green | Excellent |
| 80-94% | Yellow | Below Target |
| < 80% | Red | Low Yield |

---

### ByProductsSection

**Location:** `components/production/outputs/ByProductsSection.tsx`

Displays by-products with registration status and progress.

#### Props

```typescript
interface ByProductsSectionProps {
  /** Work order ID */
  woId: string;
  /** Whether auto-create by-products is enabled */
  autoCreateEnabled: boolean;
  /** List of by-products */
  byProducts: ByProduct[];
  /** Callback when Register Now/Add More clicked */
  onRegister: (byProduct: ByProduct) => void;
  /** Callback when Register All clicked */
  onRegisterAll: () => void;
  /** Callback to view by-product LPs */
  onViewLPs?: (byProductId: string) => void;
  /** Loading state */
  isLoading: boolean;
}
```

#### Usage

```tsx
import { ByProductsSection } from '@/components/production/outputs/ByProductsSection';

function ByProductsPanel() {
  const { byProducts, settings, isLoading } = useByProducts(woId);

  return (
    <ByProductsSection
      woId={woId}
      autoCreateEnabled={settings.auto_create_by_product_lp}
      byProducts={byProducts}
      onRegister={(bp) => setSelectedByProduct(bp)}
      onRegisterAll={() => registerAllByProducts()}
      onViewLPs={(id) => router.push(`/warehouse/lps?by_product=${id}`)}
      isLoading={isLoading}
    />
  );
}
```

#### Features

- Auto-create banner when setting enabled
- Progress bars for each by-product
- Expected vs actual quantities
- Register Now / Add More / View LPs actions
- Register All button for batch registration
- Warning for missing expected by-products

---

### OutputProgressCard

**Location:** `components/production/outputs/OutputProgressCard.tsx`

Displays WO output progress with visual indicator.

#### Props

```typescript
interface OutputProgressCardProps {
  wo: {
    wo_number: string;
    product_name: string;
    planned_qty: number;
    output_qty: number;
    uom: string;
    progress_percent: number;
    remaining_qty: number;
  };
}
```

#### Usage

```tsx
import { OutputProgressCard } from '@/components/production/outputs/OutputProgressCard';

<OutputProgressCard wo={workOrder} />
```

---

### OutputsSummary

**Location:** `components/production/outputs/OutputsSummary.tsx`

Summary card with yield metrics and output statistics.

#### Props

```typescript
interface OutputsSummaryProps {
  yields: YieldData;
  summary: OutputSummary;
  onViewDetails?: () => void;
}
```

#### Usage

```tsx
import { OutputsSummary } from '@/components/production/outputs/OutputsSummary';

<OutputsSummary
  yields={yieldData}
  summary={outputSummary}
  onViewDetails={() => setShowYieldHistory(true)}
/>
```

---

## Type Definitions

### WorkOrderSummary

```typescript
interface WorkOrderSummary {
  id: string;
  wo_number: string;
  status: string;
  product_id: string;
  product_name: string;
  product_code: string;
  batch_number: string;
  planned_qty: number;
  output_qty: number;
  uom: string;
  progress_percent: number;
  remaining_qty: number;
  default_location_id: string | null;
  default_location_name: string | null;
  shelf_life_days?: number;
}
```

### OutputLP

```typescript
interface OutputLP {
  id: string;
  lp_id: string;
  lp_number: string;
  quantity: number;
  uom: string;
  batch_number: string;
  qa_status: 'approved' | 'pending' | 'rejected' | null;
  location_id: string | null;
  location_name: string | null;
  expiry_date: string | null;
  created_at: string;
  created_by_name?: string;
  notes?: string;
}
```

### OutputSummary

```typescript
interface OutputSummary {
  total_outputs: number;
  total_qty: number;
  approved_count: number;
  approved_qty: number;
  pending_count: number;
  pending_qty: number;
  rejected_count: number;
  rejected_qty: number;
}
```

### YieldData

```typescript
interface YieldData {
  overall_yield: number | null;
  output_yield: number | null;
  material_yield: number | null;
  operation_yield: number | null;
  output_trend: number | null;
  target_yield: number;
}
```

### ByProduct

```typescript
interface ByProduct {
  product_id: string;
  product_name: string;
  product_code: string;
  material_id: string;
  yield_percent: number;
  expected_qty: number;
  actual_qty: number;
  uom: string;
  lp_count: number;
  status: 'registered' | 'not_registered';
  last_registered_at: string | null;
}
```

---

## Accessibility

All components follow WCAG 2.1 guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Screen reader descriptions for complex components
- **Focus Management**: Modal traps focus, returns on close
- **Color Contrast**: Text meets AA contrast ratios
- **Error Announcements**: Form errors use `role="alert"`

---

## Testing

Each component has comprehensive tests:

```bash
# Run component tests
pnpm test apps/frontend/components/production/outputs/

# Test files
__tests__/RegisterOutputModal.test.tsx
__tests__/OutputHistoryTable.test.tsx
__tests__/YieldIndicator.test.tsx
__tests__/ByProductsSection.test.tsx
__tests__/OutputProgressCard.test.tsx
__tests__/OutputsSummary.test.tsx
```

---

## Related Documentation

- [Output Registration API](../../api/production/output-registration.md)
- [Yield Calculation Guide](./yield-calculation.md)
- [Genealogy Linking Guide](./genealogy-linking.md)
