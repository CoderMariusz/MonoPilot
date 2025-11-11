# Traceability Specification

## Overview
This document defines the traceability system for the Production Module, including forward and backward traceability algorithms, data structures, and user interface specifications.

## Traceability Concepts

### Forward Traceability
Track materials from receipt (GRN) through production to finished goods (FG).

**Flow**: GRN → LP → WO → LP → FG

### Backward Traceability
Track finished goods back to original raw materials and purchase orders.

**Flow**: FG → LP → WO → LP → GRN → PO

### Parent-Child Relationships
Track internal material splits and combinations through license plate hierarchies.

## Data Structures

### Trace Node Types

#### GRN Node
```typescript
interface GRNNode {
  type: 'GRN';
  id: number;
  grn_number: string;
  po_id: number;
  po_number: string;
  supplier: string;
  received_date: string;
  status: string;
  items: GRNItemNode[];
}
```

#### License Plate Node
```typescript
interface LPNode {
  type: 'LP';
  id: number;
  lp_number: string;
  product_id: number;
  product_description: string;
  quantity: number;
  uom: string;
  location: string;
  qa_status: 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
  stage_suffix: string;
  parent_lp_id?: number;
  parent_lp_number?: string;
  origin_type: 'GRN' | 'WO_OUTPUT' | 'SPLIT';
  origin_ref: any;
  created_at: string;
}
```

#### Work Order Node
```typescript
interface WONode {
  type: 'WO';
  id: number;
  wo_number: string;
  product_id: number;
  product_description: string;
  quantity: number;
  status: string;
  kpi_scope: 'PR' | 'FG';
  actual_start: string;
  actual_end: string;
  line_number: string;
  operations: WOOperationNode[];
}
```

#### Purchase Order Node
```typescript
interface PONode {
  type: 'PO';
  id: number;
  po_number: string;
  supplier: string;
  status: string;
  due_date: string;
  items: POItemNode[];
}
```

### Trace Tree Structure
```typescript
interface TraceTree {
  root: TraceNode;
  children: TraceNode[];
  depth: number;
  path: string[];
  metadata: {
    total_quantity: number;
    qa_status: string;
    trace_completeness: number;
  };
}

interface TraceNode {
  id: string;
  type: 'GRN' | 'LP' | 'WO' | 'PO';
  data: GRNNode | LPNode | WONode | PONode;
  children: TraceNode[];
  parent?: TraceNode;
  relationships: TraceRelationship[];
}
```

## Forward Traceability Algorithm

### Algorithm Steps
1. **Start with GRN LP**: Begin with license plate from goods receipt
2. **Find WO Issues**: Locate stock moves with move_type='WO_ISSUE'
3. **Follow WO Operations**: Track through work order operations
4. **Find WO Outputs**: Locate stock moves with move_type='WO_OUTPUT'
5. **Track Child LPs**: Follow parent-child relationships
6. **Continue to FG**: Repeat until reaching finished goods

### SQL Implementation
```sql
-- Forward trace from LP to WO
WITH RECURSIVE forward_trace AS (
  -- Base case: Start with input LP
  SELECT 
    lp.id as lp_id,
    lp.lp_number,
    lp.product_id,
    lp.quantity,
    lp.qa_status,
    0 as depth,
    ARRAY[lp.lp_number] as path
  FROM license_plates lp
  WHERE lp.lp_number = $1
  
  UNION ALL
  
  -- Recursive case: Find WO issues and outputs
  SELECT 
    lp.id as lp_id,
    lp.lp_number,
    lp.product_id,
    lp.quantity,
    lp.qa_status,
    ft.depth + 1,
    ft.path || lp.lp_number
  FROM forward_trace ft
  JOIN stock_moves sm ON sm.lp_id = ft.lp_id
  JOIN license_plates lp ON lp.id = sm.lp_id
  WHERE sm.move_type IN ('WO_ISSUE', 'WO_OUTPUT')
)
SELECT * FROM forward_trace;
```

### Edge Cases
- **Multiple Parents**: Handle LPs with multiple parent relationships
- **Circular References**: Detect and prevent infinite loops
- **Orphaned LPs**: Handle LPs without clear parent relationships
- **Partial Traces**: Handle incomplete traceability chains

## Backward Traceability Algorithm

### Algorithm Steps
1. **Start with FG LP**: Begin with finished goods license plate
2. **Find Parent LPs**: Climb parent_lp_id hierarchy
3. **Find WO Outputs**: Locate work orders that produced the LP
4. **Find WO Issues**: Locate materials issued to work orders
5. **Find GRN LPs**: Trace back to original goods receipt
6. **Find PO**: Connect GRN to purchase order

### SQL Implementation
```sql
-- Backward trace from FG to GRN
WITH RECURSIVE backward_trace AS (
  -- Base case: Start with FG LP
  SELECT 
    lp.id as lp_id,
    lp.lp_number,
    lp.product_id,
    lp.quantity,
    lp.qa_status,
    0 as depth,
    ARRAY[lp.lp_number] as path
  FROM license_plates lp
  WHERE lp.lp_number = $1
  
  UNION ALL
  
  -- Recursive case: Find parent LPs and WO issues
  SELECT 
    lp.id as lp_id,
    lp.lp_number,
    lp.product_id,
    lp.quantity,
    lp.qa_status,
    bt.depth + 1,
    bt.path || lp.lp_number
  FROM backward_trace bt
  JOIN license_plates lp ON lp.id = bt.lp_id
  WHERE lp.parent_lp_id IS NOT NULL
)
SELECT * FROM backward_trace;
```

## Traceability API

### API Endpoints

#### Forward Trace
```typescript
GET /api/production/trace/forward?lp={lp_number}
```

**Response**:
```typescript
interface ForwardTraceResponse {
  success: boolean;
  data: {
    root: TraceNode;
    tree: TraceTree;
    summary: {
      total_nodes: number;
      trace_completeness: number;
      qa_status: string;
      total_quantity: number;
    };
  };
  error?: string;
}
```

#### Backward Trace
```typescript
GET /api/production/trace/backward?lp={lp_number}
```

**Response**:
```typescript
interface BackwardTraceResponse {
  success: boolean;
  data: {
    root: TraceNode;
    tree: TraceTree;
    summary: {
      total_nodes: number;
      trace_completeness: number;
      qa_status: string;
      total_quantity: number;
    };
  };
  error?: string;
}
```

### API Implementation
```typescript
// Forward trace implementation
export async function getForwardTrace(lpNumber: string): Promise<ForwardTraceResponse> {
  try {
    const { data, error } = await supabase
      .rpc('get_forward_trace', { lp_number: lpNumber });
    
    if (error) throw error;
    
    return {
      success: true,
      data: {
        root: data.root,
        tree: data.tree,
        summary: data.summary
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## User Interface Specifications

### Trace Tree Component
```typescript
interface TraceTreeProps {
  tree: TraceTree;
  onNodeClick: (node: TraceNode) => void;
  onExpand: (node: TraceNode) => void;
  onCollapse: (node: TraceNode) => void;
}
```

### Node Display Components

#### LP Node Display
```typescript
interface LPNodeDisplayProps {
  node: LPNode;
  showDetails: boolean;
  onToggleDetails: () => void;
}
```

**Display Elements**:
- LP Number with stage suffix (-R, -S, -D)
- Product description
- Quantity and UOM
- QA status badge
- Location information
- Parent/child relationships

#### WO Node Display
```typescript
interface WONodeDisplayProps {
  node: WONode;
  showOperations: boolean;
  onToggleOperations: () => void;
}
```

**Display Elements**:
- Work order number
- Product description
- Quantity and status
- Start/end times
- Production line
- Operation sequence

#### GRN Node Display
```typescript
interface GRNNodeDisplayProps {
  node: GRNNode;
  showItems: boolean;
  onToggleItems: () => void;
}
```

**Display Elements**:
- GRN number
- Purchase order reference
- Supplier information
- Received date
- Status and items

### QA Status Indicators
```typescript
interface QAStatusBadgeProps {
  status: 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
  size?: 'sm' | 'md' | 'lg';
}
```

**Visual Indicators**:
- **Pending**: Yellow badge with clock icon
- **Passed**: Green badge with checkmark icon
- **Failed**: Red badge with X icon
- **Quarantine**: Orange badge with warning icon

### Stage Suffix Display
```typescript
interface StageSuffixProps {
  suffix: string;
  operation: string;
}
```

**Suffix Meanings**:
- **-R**: Raw material
- **-S**: Smoked
- **-D**: Diced
- **-M**: Mixed
- **-P**: Packed

## Export Specifications

### Traceability Export Format
```typescript
interface TraceExportData {
  trace_type: 'forward' | 'backward';
  root_lp: string;
  generated_at: string;
  nodes: TraceNode[];
  relationships: TraceRelationship[];
  summary: TraceSummary;
}
```

### Excel Export Columns
- **Node ID**: Unique node identifier
- **Node Type**: GRN, LP, WO, PO
- **Node Number**: Reference number
- **Product**: Product description
- **Quantity**: Quantity and UOM
- **QA Status**: Quality assurance status
- **Stage Suffix**: Operation stage indicator
- **Location**: Current location
- **Dates**: Creation and modification dates
- **Relationships**: Parent-child relationships

## Performance Considerations

### Database Optimization
- **Indexes**: Strategic indexing on trace-related columns
- **Materialized Views**: Pre-calculate common trace paths
- **Caching**: Cache frequently accessed trace data
- **Pagination**: Handle large trace trees efficiently

### Query Optimization
- **Recursive CTEs**: Efficient recursive queries
- **Depth Limiting**: Prevent infinite recursion
- **Path Optimization**: Optimize trace path calculations
- **Batch Processing**: Handle multiple traces efficiently

## Error Handling

### Trace Errors
- **Incomplete Traces**: Handle missing trace data
- **Circular References**: Detect and prevent loops
- **Data Inconsistencies**: Handle conflicting data
- **Permission Errors**: Handle access restrictions

### User Experience
- **Loading States**: Show progress during trace generation
- **Error Messages**: Clear error communication
- **Fallback Views**: Alternative display for errors
- **Retry Mechanisms**: Allow users to retry failed traces

## Changelog

### 2025-01-27 - Initial Creation
- Defined traceability algorithms and data structures
- Created API specifications and UI components
- Established export formats and performance considerations
- Documented error handling and user experience guidelines
