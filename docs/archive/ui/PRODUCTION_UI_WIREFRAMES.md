# Production UI Wireframes

## Overview
This document defines the user interface specifications for the Production Module, including component layouts, table structures, modal designs, and user interaction patterns.

## Main Production Page Layout

### Page Structure
```
/production
├── Header
│   ├── Page Title: "Production"
│   ├── Breadcrumb: Home > Production
│   └── User Actions
├── Tab Navigation
│   ├── Work Orders (active)
│   ├── Yield
│   ├── Consume
│   ├── Operations
│   └── Trace
└── Tab Content
    └── [Dynamic content based on active tab]
```

### Responsive Design
- **Desktop**: Full-width layout with sidebar navigation
- **Tablet**: Collapsible sidebar with main content area
- **Mobile**: Stacked layout with bottom navigation

## Work Orders Tab

### Enhanced Work Orders Table

#### Table Columns
| Column | Width | Sortable | Filterable | Description |
|--------|-------|----------|------------|-------------|
| WO# | 120px | ✓ | ✓ | Work order number |
| Product | 200px | ✓ | ✓ | Product description |
| Planned Qty | 100px | ✓ | - | Planned quantity |
| Actual Output | 100px | ✓ | - | Actual output quantity |
| Yield% | 80px | ✓ | - | Yield percentage |
| Line/Machine | 120px | ✓ | ✓ | Production line |
| Schedule | 150px | ✓ | ✓ | Planned/Actual times |
| QA Flags | 100px | - | ✓ | QA status indicators |
| Shortages | 100px | - | ✓ | Material shortage alerts |
| Priority | 80px | ✓ | ✓ | Work order priority |
| Status | 100px | ✓ | ✓ | Current status |
| Actions | 120px | - | - | Action buttons |

#### Row Data Format
```typescript
interface WorkOrderRow {
  wo_number: string;
  product: {
    id: number;
    description: string;
    part_number: string;
  };
  planned_qty: number;
  actual_output: number;
  yield_percentage: number;
  line: {
    id: string;
    name: string;
  };
  schedule: {
    planned_start: string;
    planned_end: string;
    actual_start: string;
    actual_end: string;
  };
  qa_flags: {
    material_qa: string;
    output_qa: string;
  };
  shortages: {
    count: number;
    materials: string[];
  };
  priority: 'High' | 'Medium' | 'Low';
  status: 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  actions: {
    can_view: boolean;
    can_close: boolean;
    can_edit: boolean;
  };
}
```

#### Filter Controls
```typescript
interface WorkOrderFilters {
  date_bucket: 'day' | 'week' | 'month';
  date_range: {
    from: string;
    to: string;
  };
  line: string[];
  product: string[];
  status: string[];
  qa_status: string[];
  priority: string[];
}
```

#### Action Buttons
- **View**: Open work order details modal
- **Close**: Close work order with validations
- **Edit**: Edit work order details
- **Delete**: Delete work order (with confirmation)

## Yield Tab

### PR/FG Toggle
```typescript
interface YieldToggle {
  scope: 'PR' | 'FG';
  onToggle: (scope: 'PR' | 'FG') => void;
}
```

### KPI Cards Layout
```
┌─────────────────────────────────────────────────────────┐
│ KPI Cards Row                                           │
├─────────────┬─────────────┬─────────────┬─────────────┤
│ Yield%      │ Consumption │ Plan Acc.   │ On-Time%    │
│ 87.5%       │ 1.12 kg/kg  │ 98.2%       │ 94.1%       │
│ ↑ 2.3%      │ ↓ 0.05      │ ↑ 1.8%      │ ↑ 3.2%      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Time Bucket Selector
```typescript
interface TimeBucketSelector {
  bucket: 'day' | 'week' | 'month';
  onBucketChange: (bucket: 'day' | 'week' | 'month') => void;
  dateRange: {
    from: string;
    to: string;
  };
  onDateRangeChange: (range: { from: string; to: string }) => void;
}
```

### Drill-down Table
| Column | Width | Description |
|--------|-------|-------------|
| Date | 100px | Production date |
| Line | 120px | Production line |
| Product | 200px | Product description |
| WO# | 120px | Work order number |
| Planned | 100px | Planned quantity |
| Actual | 100px | Actual quantity |
| Yield% | 80px | Yield percentage |
| Operations | 150px | Per-operation yields |

### Export Button
```typescript
interface ExportButton {
  onExport: () => void;
  loading: boolean;
  format: 'xlsx' | 'csv' | 'pdf';
}
```

## Consume Tab

### Material Variance Table
| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| WO# | 120px | ✓ | Work order number |
| Material | 200px | ✓ | Material description |
| BOM Standard | 100px | ✓ | BOM standard quantity |
| Actual Consumed | 100px | ✓ | Actual consumption |
| Variance (qty) | 100px | ✓ | Quantity variance |
| Variance (%) | 80px | ✓ | Percentage variance |
| Line | 120px | ✓ | Production line |
| Date | 100px | ✓ | Production date |
| Cost Impact | 100px | ✓ | Cost impact of variance |

### BOM Integration Links
- **Material Details**: Link to material information
- **BOM Viewer**: Link to bill of materials
- **LP Issues**: Link to license plate issues
- **Cost Analysis**: Link to cost impact analysis

## Operations Tab

### Per-WO Operations Table
| Column | Width | Description |
|--------|-------|-------------|
| Seq | 60px | Operation sequence |
| Operation | 150px | Operation name |
| Planned IN | 100px | Planned input weight |
| Planned OUT | 100px | Planned output weight |
| Actual IN | 100px | Actual input weight |
| Actual OUT | 100px | Actual output weight |
| Cooking Loss | 100px | Cooking weight loss |
| Trim Loss | 100px | Trim weight loss |
| Marinade Gain | 100px | Marinade weight gain |
| Yield% | 80px | Operation yield |
| Start/End | 150px | Operation times |
| Operator | 120px | Operator name |

### Record Weights Modal
```typescript
interface RecordWeightsModalProps {
  wo_id: number;
  operation_seq: number;
  operation_name: string;
  onSave: (weights: OperationWeights) => void;
  onCancel: () => void;
}

interface OperationWeights {
  actual_input_weight: number;
  actual_output_weight: number;
  cooking_loss_weight: number;
  trim_loss_weight: number;
  marinade_gain_weight: number;
  scrap_breakdown: {
    category: string;
    weight: number;
    reason: string;
  }[];
}
```

## Trace Tab

### Trace Tree Component
```typescript
interface TraceTreeProps {
  tree: TraceTree;
  onNodeClick: (node: TraceNode) => void;
  onExpand: (node: TraceNode) => void;
  onCollapse: (node: TraceNode) => void;
}
```

### Tree Node Display
```
┌─────────────────────────────────────────────────────────┐
│ Trace Tree                                             │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search: [LP Number or WO Number]                    │
├─────────────────────────────────────────────────────────┤
│ 📊 Trace Type: [Forward ▼] [Backward]                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📦 LP-001234-R (Raw Material)                         │
│  ├─ 📋 WO-2025-001 (Work Order)                       │
│  │  ├─ 🔧 Op1: Preparation                            │
│  │  ├─ 🔧 Op2: Smoking                                │
│  │  └─ 🔧 Op3: Dicing                                 │
│  └─ 📦 LP-001234-S (Smoked)                            │
│     ├─ 📋 WO-2025-002 (Work Order)                     │
│     └─ 📦 LP-001234-D (Diced)                         │
│        └─ 📦 LP-001234-P (Packed)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Node Details Panel
```typescript
interface NodeDetailsPanel {
  node: TraceNode;
  onClose: () => void;
}
```

**Display Elements**:
- **Node Type**: GRN, LP, WO, PO
- **Reference Number**: Node identifier
- **Product Information**: Description, part number
- **Quantity**: Amount and UOM
- **QA Status**: Quality assurance status
- **Location**: Current location
- **Dates**: Creation and modification
- **Relationships**: Parent-child connections

### QA Status Badges
```typescript
interface QAStatusBadge {
  status: 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
  size: 'sm' | 'md' | 'lg';
}
```

**Visual Design**:
- **Pending**: 🟡 Yellow with clock icon
- **Passed**: 🟢 Green with checkmark
- **Failed**: 🔴 Red with X icon
- **Quarantine**: 🟠 Orange with warning icon

### Stage Suffix Display
```typescript
interface StageSuffixDisplay {
  suffix: string;
  operation: string;
  color: string;
}
```

**Suffix Meanings**:
- **-R**: Raw material (🔵 Blue)
- **-S**: Smoked (🟤 Brown)
- **-D**: Diced (🟢 Green)
- **-M**: Mixed (🟣 Purple)
- **-P**: Packed (🟡 Yellow)

## Modal Components

### Work Order Details Modal
```typescript
interface WorkOrderDetailsModalProps {
  wo_id: number;
  onClose: () => void;
}
```

**Modal Sections**:
1. **Basic Information**: WO number, product, quantity, status
2. **Schedule**: Planned and actual start/end times
3. **Operations**: Operation sequence with weights
4. **Outputs**: Production outputs and license plates
5. **Materials**: Issued materials and consumption
6. **Quality**: QA status and inspections

### Work Order Close Modal
```typescript
interface WorkOrderCloseModalProps {
  wo_id: number;
  onClose: () => void;
  onConfirm: (closeData: WorkOrderCloseData) => void;
}

interface WorkOrderCloseData {
  actual_end: string;
  actual_output_qty: number;
  actual_boxes?: number;
  notes?: string;
  quality_checks: {
    passed: boolean;
    issues: string[];
  };
}
```

### Record Weights Modal
```typescript
interface RecordWeightsModalProps {
  wo_id: number;
  operation_seq: number;
  onSave: (weights: OperationWeights) => void;
  onCancel: () => void;
}
```

**Form Fields**:
- **Actual Input Weight**: Numeric input with validation
- **Actual Output Weight**: Numeric input with validation
- **Cooking Loss**: Numeric input for cooking losses
- **Trim Loss**: Numeric input for trim losses
- **Marinade Gain**: Numeric input for marinade gains
- **Scrap Breakdown**: Dynamic list of scrap categories

### Trace Details Modal
```typescript
interface TraceDetailsModalProps {
  node: TraceNode;
  onClose: () => void;
}
```

**Modal Sections**:
1. **Node Information**: Type, reference, product details
2. **Quantity Details**: Amount, UOM, conversions
3. **Quality Status**: QA status and inspection results
4. **Location**: Current location and movement history
5. **Relationships**: Parent-child connections
6. **Timeline**: Creation and modification history

## Responsive Design

### Desktop Layout (≥1024px)
- **Sidebar**: 250px fixed width
- **Main Content**: Flexible width
- **Tables**: Full column display
- **Modals**: 800px max width

### Tablet Layout (768px-1023px)
- **Sidebar**: Collapsible, 200px width
- **Main Content**: Flexible width
- **Tables**: Horizontal scroll for overflow
- **Modals**: 90% viewport width

### Mobile Layout (<768px)
- **Navigation**: Bottom tab bar
- **Tables**: Card-based layout
- **Modals**: Full screen
- **Forms**: Stacked layout

## Accessibility

### Keyboard Navigation
- **Tab Order**: Logical tab sequence
- **Focus Indicators**: Clear focus states
- **Keyboard Shortcuts**: Common actions
- **Screen Reader**: Proper ARIA labels

### Visual Accessibility
- **Color Contrast**: WCAG AA compliance
- **Font Sizes**: Minimum 14px base
- **Icon Labels**: Text alternatives
- **High Contrast**: Dark mode support

## Changelog

### 2025-01-27 - Initial Creation
- Defined main production page layout
- Created work orders table specifications
- Designed yield, consume, operations, and trace tabs
- Established modal components and responsive design
- Documented accessibility considerations
