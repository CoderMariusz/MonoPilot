# Tech Spec: Traceability & Dashboard (Epic 2 Batch 2D)

**Date:** 2025-01-23
**Author:** Claude AI
**Stories:** 2.18, 2.19, 2.20, 2.21, 2.23, 2.24
**Status:** Draft

---

## Overview

The Traceability & Dashboard batch provides complete forward and backward traceability for materials and products, recall simulation capabilities, and visual dashboards for the Technical module. This enables compliance with regulatory requirements (FDA, EU regulations) and provides quick insights into product relationships and allergen risks.

**Key Features:**
- Forward traceability: trace materials to see where they were used (Story 2.18)
- Backward traceability: trace products to see what went into them (Story 2.19)
- Recall simulation with FDA-compliant export (Story 2.20)
- Interactive genealogy tree visualization (Story 2.21)
- Grouped product dashboard by category (Story 2.23)
- Allergen matrix visualization (Story 2.24)

---

## Database Schema

### lp_genealogy Table

Records parent-child relationships between License Plates (LPs) when they are split, combined, or transformed through production.

```sql
CREATE TABLE public.lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,
  child_lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Context
  relationship_type VARCHAR(20) NOT NULL, -- split, combine, transform
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  transfer_order_id UUID REFERENCES transfer_orders(id) ON DELETE SET NULL,

  -- Quantities (for audit trail)
  quantity_from_parent DECIMAL(12,3) NOT NULL,
  uom VARCHAR(10) NOT NULL,

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT lp_genealogy_type_check CHECK (relationship_type IN ('split', 'combine', 'transform')),
  CONSTRAINT lp_genealogy_no_self_reference CHECK (parent_lp_id != child_lp_id),
  CONSTRAINT lp_genealogy_quantity_positive CHECK (quantity_from_parent > 0)
);

-- Indexes for performance
CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(work_order_id) WHERE work_order_id IS NOT NULL;
```

### traceability_links Table

Records consumption and production relationships between LPs and Work Orders/Transfer Orders for complete traceability.

```sql
CREATE TABLE public.traceability_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- LP Reference
  lp_id UUID NOT NULL REFERENCES license_plates(id) ON DELETE CASCADE,

  -- Context
  link_type VARCHAR(20) NOT NULL, -- consumption, production
  work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
  transfer_order_id UUID REFERENCES transfer_orders(id) ON DELETE CASCADE,

  -- Transaction Details
  quantity DECIMAL(12,3) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Location (at time of transaction)
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Audit Trail
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT traceability_links_type_check CHECK (link_type IN ('consumption', 'production')),
  CONSTRAINT traceability_links_quantity_positive CHECK (quantity > 0),
  CONSTRAINT traceability_links_wo_or_to CHECK (
    (work_order_id IS NOT NULL AND transfer_order_id IS NULL) OR
    (work_order_id IS NULL AND transfer_order_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_traceability_links_lp ON traceability_links(lp_id);
CREATE INDEX idx_traceability_links_wo ON traceability_links(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_traceability_links_to ON traceability_links(transfer_order_id) WHERE transfer_order_id IS NOT NULL;
CREATE INDEX idx_traceability_links_date ON traceability_links(transaction_date);
```

### Notes on Dependencies

**Important:** The `license_plates`, `work_orders`, and `transfer_orders` tables will be created in Epic 5 (Warehouse) and Epic 3 (Work Orders). For Epic 2 Batch 2D implementation:
- Create these tables as **stubs** (minimal schema) for testing
- Full implementation will be done in respective epics
- Migrations will be designed to be idempotent (can run safely if tables already exist)

---

## API Endpoints

### Forward Traceability (Story 2.18)

```
POST /api/technical/tracing/forward
  Body: {
    lp_id?: string,
    batch_number?: string
  }
  Response: {
    root_lp: LP,
    trace_tree: TraceNode[],
    summary: {
      total_descendants: number,
      total_work_orders: number,
      total_products: number,
      max_depth: number
    }
  }

Interface TraceNode {
  lp: LP,
  relationship_type: 'split' | 'combine' | 'transform',
  children: TraceNode[],
  work_orders: WorkOrder[],
  depth: number
}
```

### Backward Traceability (Story 2.19)

```
POST /api/technical/tracing/backward
  Body: {
    lp_id?: string,
    batch_number?: string
  }
  Response: {
    root_lp: LP,
    trace_tree: TraceNode[],
    summary: {
      total_ancestors: number,
      total_source_materials: number,
      max_depth: number,
      suppliers: Supplier[]
    }
  }
```

### Recall Simulation (Story 2.20)

```
POST /api/technical/tracing/recall
  Body: {
    lp_id?: string,
    batch_number?: string,
    include_shipped?: boolean
  }
  Response: {
    forward_trace: TraceNode[],
    backward_trace: TraceNode[],
    summary: {
      total_affected_lps: number,
      total_quantity: number,
      total_value: number,
      locations: Location[],
      shipped_qty: number,
      customers_affected: number
    },
    export_formats: {
      pdf_url: string,
      fda_json_url: string,
      fda_xml_url: string
    }
  }

GET /api/technical/tracing/recall/:id/export
  Query: ?format=pdf|fda_json|fda_xml
  Response: File download
```

### Genealogy Tree Data (Story 2.21)

```
GET /api/technical/tracing/genealogy/:lp_id
  Query: ?direction=forward|backward|both&max_depth=10
  Response: {
    nodes: TreeNode[],
    edges: TreeEdge[],
    metadata: {
      total_nodes: number,
      total_edges: number,
      max_depth: number
    }
  }

Interface TreeNode {
  id: string,
  lp_id: string,
  lp_number: string,
  product_code: string,
  product_name: string,
  quantity: number,
  uom: string,
  batch_number: string,
  expiry_date: string | null,
  location: string,
  status: 'available' | 'consumed' | 'shipped' | 'quarantine',
  level: number
}

Interface TreeEdge {
  id: string,
  source: string,
  target: string,
  relationship_type: string,
  quantity: number
}
```

### Product Dashboard (Story 2.23)

```
GET /api/technical/dashboard/products
  Query: ?group_by=type&include_stats=true
  Response: {
    groups: [
      {
        category: 'RM' | 'WIP' | 'FG',
        label: string,
        count: number,
        products: Product[],
        recent_changes: ProductChange[]
      }
    ],
    overall_stats: {
      total_products: number,
      active_products: number,
      recent_updates: number
    }
  }
```

### Allergen Matrix (Story 2.24)

```
GET /api/technical/dashboard/allergen-matrix
  Query: ?product_type=RM,FG&sort_by=allergen_count&limit=100&offset=0
  Response: {
    matrix: AllergenMatrixRow[],
    allergens: Allergen[],
    total: number
  }

Interface AllergenMatrixRow {
  product_id: string,
  product_code: string,
  product_name: string,
  product_type: string,
  allergens: {
    [allergen_id: string]: 'contains' | 'may_contain' | 'none'
  },
  allergen_count: number
}

POST /api/technical/dashboard/allergen-matrix/export
  Body: { filters: {...} }
  Response: { excel_url: string }
```

---

## Data Models (TypeScript)

```typescript
// Genealogy
export interface LPGenealogy {
  id: string
  parent_lp_id: string
  child_lp_id: string
  relationship_type: 'split' | 'combine' | 'transform'
  work_order_id: string | null
  transfer_order_id: string | null
  quantity_from_parent: number
  uom: string
  created_by: string | null
  created_at: string
}

export interface TraceabilityLink {
  id: string
  lp_id: string
  link_type: 'consumption' | 'production'
  work_order_id: string | null
  transfer_order_id: string | null
  quantity: number
  uom: string
  transaction_date: string
  location_id: string | null
  created_by: string | null
  created_at: string
}

// Tracing
export interface TraceNode {
  lp: LicensePlate
  relationship_type: 'split' | 'combine' | 'transform' | null
  children: TraceNode[]
  work_orders: WorkOrder[]
  depth: number
  quantity_from_parent?: number
}

export interface TraceSummary {
  total_descendants?: number
  total_ancestors?: number
  total_work_orders?: number
  total_products?: number
  total_source_materials?: number
  max_depth: number
  suppliers?: Supplier[]
}

export interface RecallSummary {
  total_affected_lps: number
  total_quantity: number
  total_value: number
  locations: Location[]
  shipped_qty: number
  customers_affected: number
}

// Tree Visualization
export interface TreeNode {
  id: string
  lp_id: string
  lp_number: string
  product_code: string
  product_name: string
  quantity: number
  uom: string
  batch_number: string
  expiry_date: string | null
  location: string
  status: 'available' | 'consumed' | 'shipped' | 'quarantine'
  level: number
}

export interface TreeEdge {
  id: string
  source: string
  target: string
  relationship_type: string
  quantity: number
}

// Dashboard
export interface ProductGroup {
  category: 'RM' | 'WIP' | 'FG'
  label: string
  count: number
  products: Product[]
  recent_changes: ProductChange[]
}

export interface ProductChange {
  product_id: string
  product_code: string
  change_type: 'created' | 'updated' | 'version_created'
  changed_at: string
  changed_by: string
}

export interface AllergenMatrixRow {
  product_id: string
  product_code: string
  product_name: string
  product_type: string
  allergens: Record<string, 'contains' | 'may_contain' | 'none'>
  allergen_count: number
}
```

---

## Graph Traversal Algorithms

### Forward Trace Algorithm (Recursive CTE)

```sql
WITH RECURSIVE forward_trace AS (
  -- Base case: starting LP
  SELECT
    lg.parent_lp_id AS lp_id,
    lg.child_lp_id,
    lg.relationship_type,
    lg.quantity_from_parent,
    lg.work_order_id,
    1 AS depth,
    ARRAY[lg.parent_lp_id] AS path
  FROM lp_genealogy lg
  WHERE lg.parent_lp_id = $1

  UNION ALL

  -- Recursive case: children of children
  SELECT
    lg.parent_lp_id,
    lg.child_lp_id,
    lg.relationship_type,
    lg.quantity_from_parent,
    lg.work_order_id,
    ft.depth + 1,
    ft.path || lg.parent_lp_id
  FROM lp_genealogy lg
  INNER JOIN forward_trace ft ON lg.parent_lp_id = ft.child_lp_id
  WHERE NOT (lg.child_lp_id = ANY(ft.path)) -- Prevent cycles
    AND ft.depth < 20 -- Max depth limit
)
SELECT
  ft.*,
  lp.lp_number,
  lp.product_id,
  lp.batch_number,
  lp.quantity,
  lp.uom,
  lp.status,
  lp.location_id,
  p.code AS product_code,
  p.name AS product_name
FROM forward_trace ft
INNER JOIN license_plates lp ON lp.id = ft.child_lp_id
INNER JOIN products p ON p.id = lp.product_id
ORDER BY ft.depth, ft.child_lp_id;
```

### Backward Trace Algorithm (Recursive CTE)

```sql
WITH RECURSIVE backward_trace AS (
  -- Base case: starting LP
  SELECT
    lg.child_lp_id AS lp_id,
    lg.parent_lp_id,
    lg.relationship_type,
    lg.quantity_from_parent,
    lg.work_order_id,
    1 AS depth,
    ARRAY[lg.child_lp_id] AS path
  FROM lp_genealogy lg
  WHERE lg.child_lp_id = $1

  UNION ALL

  -- Recursive case: parents of parents
  SELECT
    lg.child_lp_id,
    lg.parent_lp_id,
    lg.relationship_type,
    lg.quantity_from_parent,
    lg.work_order_id,
    bt.depth + 1,
    bt.path || lg.child_lp_id
  FROM lp_genealogy lg
  INNER JOIN backward_trace bt ON lg.child_lp_id = bt.parent_lp_id
  WHERE NOT (lg.parent_lp_id = ANY(bt.path)) -- Prevent cycles
    AND bt.depth < 20 -- Max depth limit
)
SELECT
  bt.*,
  lp.lp_number,
  lp.product_id,
  lp.batch_number,
  lp.quantity,
  lp.uom,
  lp.status,
  lp.location_id,
  p.code AS product_code,
  p.name AS product_name
FROM backward_trace bt
INNER JOIN license_plates lp ON lp.id = bt.parent_lp_id
INNER JOIN products p ON p.id = lp.product_id
ORDER BY bt.depth, bt.parent_lp_id;
```

### Performance Optimization

1. **Indexes**:
   - B-tree indexes on `parent_lp_id` and `child_lp_id` for fast lookups
   - Covering indexes to avoid table lookups during traversal

2. **Depth Limiting**:
   - Max depth of 20 levels to prevent runaway queries
   - Configurable via application setting

3. **Cycle Prevention**:
   - Path tracking using PostgreSQL arrays
   - Check prevents infinite loops in malformed data

4. **Caching**:
   - Cache frequently accessed genealogy trees (Redis, 15 min TTL)
   - Invalidate on LP modifications

5. **Pagination**:
   - Lazy loading for tree nodes beyond depth 3
   - Fetch on-demand when user expands node

---

## Recall Simulation Logic

### Process Flow

1. **Input**: LP ID or Batch Number
2. **Forward Trace**: Find all descendants (where material was used)
3. **Backward Trace**: Find all ancestors (what went into it)
4. **Aggregate Data**:
   - Count affected LPs
   - Sum quantities
   - Group by location
   - Identify shipped items
   - Calculate estimated cost
5. **Generate Exports**:
   - PDF report (human-readable)
   - FDA JSON (FSMA compliance)
   - FDA XML (alternative format)

### Summary Calculations

```typescript
async function calculateRecallSummary(
  forwardTrace: TraceNode[],
  backwardTrace: TraceNode[]
): Promise<RecallSummary> {
  const allAffectedLPs = new Set<string>()

  // Collect all LPs from both traces
  const collectLPs = (nodes: TraceNode[]) => {
    nodes.forEach(node => {
      allAffectedLPs.add(node.lp.id)
      if (node.children) collectLPs(node.children)
    })
  }

  collectLPs(forwardTrace)
  collectLPs(backwardTrace)

  // Query database for summary
  const affected = await db.query(`
    SELECT
      COUNT(*) as lp_count,
      SUM(quantity) as total_qty,
      SUM(quantity * p.unit_cost) as total_value,
      COUNT(DISTINCT location_id) as location_count,
      SUM(CASE WHEN status = 'shipped' THEN quantity ELSE 0 END) as shipped_qty
    FROM license_plates lp
    INNER JOIN products p ON p.id = lp.product_id
    WHERE lp.id = ANY($1)
  `, [Array.from(allAffectedLPs)])

  // Get locations
  const locations = await db.query(`
    SELECT DISTINCT l.*
    FROM license_plates lp
    INNER JOIN locations l ON l.id = lp.location_id
    WHERE lp.id = ANY($1)
  `, [Array.from(allAffectedLPs)])

  return {
    total_affected_lps: affected[0].lp_count,
    total_quantity: affected[0].total_qty,
    total_value: affected[0].total_value,
    locations: locations,
    shipped_qty: affected[0].shipped_qty,
    customers_affected: 0 // TODO: Calculate from shipments in Epic 6
  }
}
```

### FDA Export Format (JSON)

```json
{
  "recall_report": {
    "report_id": "REC-2025-001",
    "generated_at": "2025-01-23T10:30:00Z",
    "generated_by": "user@example.com",
    "trigger": {
      "type": "lp_id",
      "value": "LP-12345",
      "batch_number": "BATCH-2024-11-001"
    },
    "summary": {
      "total_affected_units": 1500,
      "total_value_usd": 45000,
      "affected_locations": 5,
      "shipped_quantity": 300,
      "customers_affected": 12
    },
    "affected_products": [
      {
        "lp_id": "uuid",
        "lp_number": "LP-12345",
        "product_code": "FG-001",
        "product_name": "Chocolate Bar",
        "quantity": 100,
        "uom": "EA",
        "batch_number": "BATCH-001",
        "expiry_date": "2025-12-31",
        "status": "available",
        "location": "WH-A-01-02"
      }
    ],
    "trace_depth": {
      "forward_levels": 3,
      "backward_levels": 2
    }
  }
}
```

---

## Dashboard Aggregation Queries

### Product Grouping Query

```sql
-- Group products by type (RM, WIP, FG)
SELECT
  p.type AS category,
  CASE
    WHEN p.type = 'RM' THEN 'Raw Materials'
    WHEN p.type IN ('WIP', 'SEMI') THEN 'Work in Progress'
    WHEN p.type = 'FG' THEN 'Finished Goods'
  END AS label,
  COUNT(*) AS count,
  json_agg(
    json_build_object(
      'id', p.id,
      'code', p.code,
      'name', p.name,
      'version', p.version,
      'status', p.status
    ) ORDER BY p.updated_at DESC
  ) FILTER (WHERE p.updated_at >= NOW() - INTERVAL '7 days') AS recent_products
FROM products p
WHERE p.org_id = $1
  AND p.status = 'active'
GROUP BY p.type
ORDER BY
  CASE p.type
    WHEN 'RM' THEN 1
    WHEN 'WIP' THEN 2
    WHEN 'SEMI' THEN 2
    WHEN 'FG' THEN 3
  END;
```

### Allergen Matrix Query

```sql
-- Generate allergen matrix with color coding
SELECT
  p.id AS product_id,
  p.code AS product_code,
  p.name AS product_name,
  p.type AS product_type,
  json_object_agg(
    a.id,
    CASE
      WHEN pa.status = 'contains' THEN 'contains'
      WHEN pa.status = 'may_contain' THEN 'may_contain'
      ELSE 'none'
    END
  ) AS allergens,
  COUNT(pa.id) FILTER (WHERE pa.status IN ('contains', 'may_contain')) AS allergen_count
FROM products p
CROSS JOIN allergens a
LEFT JOIN product_allergens pa ON pa.product_id = p.id AND pa.allergen_id = a.id
WHERE p.org_id = $1
  AND p.status = 'active'
  AND ($2::text[] IS NULL OR p.type = ANY($2)) -- Filter by type
GROUP BY p.id, p.code, p.name, p.type
HAVING ($3::integer IS NULL OR COUNT(pa.id) >= $3) -- Min allergen count filter
ORDER BY
  CASE $4 -- Sort parameter
    WHEN 'allergen_count' THEN allergen_count
    WHEN 'code' THEN 0
  END DESC,
  p.code ASC
LIMIT $5 OFFSET $6;
```

---

## Validation Rules

### Traceability Queries
- **LP ID or Batch Number**: At least one required
- **Max Depth**: Default 20, max 50 (configurable)
- **Direction**: 'forward', 'backward', or 'both'

### Recall Simulation
- **Include Shipped**: Boolean, default false
- **Export Format**: 'pdf', 'fda_json', or 'fda_xml'
- **Performance**: Must complete within 30 seconds

### Dashboard
- **Product Type Filter**: Array of valid types (RM, WIP, FG, SEMI)
- **Sort By**: 'code', 'name', 'allergen_count', 'updated_at'
- **Pagination**: Max 100 rows per page for allergen matrix

---

## Business Rules

1. **Genealogy Recording**:
   - Every LP split/combine/transform creates genealogy record
   - Parent-child relationships are immutable once created
   - Cannot create cycles in genealogy graph

2. **Traceability Links**:
   - Links created automatically when LP consumed/produced in WO
   - Each link must reference either WO or TO (not both, not neither)
   - Transaction date defaults to current timestamp

3. **Recall Simulation**:
   - Combines forward + backward traces
   - Performance target: < 30 seconds for 1000+ LPs
   - Must include cost estimation
   - Export must be FDA-compliant (FSMA)

4. **Tree Visualization**:
   - Lazy load nodes beyond depth 3
   - Color coding by LP status:
     - Green: available
     - Blue: consumed
     - Gray: shipped
     - Orange: quarantine
   - Max 1000 nodes per view (pagination required)

5. **Product Dashboard**:
   - RM (Raw Materials): type = 'RM'
   - WIP (Work in Progress): type IN ('WIP', 'SEMI', 'FG' with status != 'released')
   - FG (Finished Goods): type = 'FG' with status = 'released'
   - Recent changes: last 7 days

6. **Allergen Matrix**:
   - Cross-join products × allergens
   - Color coding:
     - Red: Contains
     - Yellow: May Contain
     - Green: None (no record)
   - Sortable by allergen count
   - Filterable by product type

---

## RLS Policies

All tables have standard RLS policies:
- **SELECT**: `org_id = auth.jwt()->>'org_id'`
- **INSERT**: `org_id = auth.jwt()->>'org_id'` AND user has technical/admin role
- **UPDATE**: Not applicable (immutable records)
- **DELETE**: Not applicable (cascade deletes only)

**Note**: Genealogy and traceability records are **immutable** once created. Updates/deletes are not allowed.

---

## Performance Considerations

### Indexes

```sql
-- Genealogy
CREATE INDEX idx_lp_genealogy_parent ON lp_genealogy(parent_lp_id);
CREATE INDEX idx_lp_genealogy_child ON lp_genealogy(child_lp_id);
CREATE INDEX idx_lp_genealogy_wo ON lp_genealogy(work_order_id) WHERE work_order_id IS NOT NULL;

-- Traceability
CREATE INDEX idx_traceability_links_lp ON traceability_links(lp_id);
CREATE INDEX idx_traceability_links_wo ON traceability_links(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_traceability_links_date ON traceability_links(transaction_date);

-- Composite for recall queries
CREATE INDEX idx_lp_genealogy_composite ON lp_genealogy(parent_lp_id, child_lp_id, relationship_type);
```

### Caching Strategy

1. **Genealogy Trees**:
   - Cache complete tree for 15 minutes (Redis)
   - Key: `genealogy:{lp_id}:{direction}:{max_depth}`
   - Invalidate on new genealogy records

2. **Dashboard Aggregations**:
   - Cache grouped product counts for 10 minutes
   - Cache allergen matrix for 5 minutes
   - Invalidate on product/allergen changes

3. **Recall Simulations**:
   - Cache simulation results for 1 hour
   - User-specific cache key (private data)

### Query Optimization

1. **Limit Depth**: Default max depth = 20 to prevent long-running queries
2. **Pagination**: Lazy load tree nodes beyond depth 3
3. **Batch Queries**: Use `WHERE id = ANY($1)` for bulk LP lookups
4. **Materialized Views**: Consider for frequently accessed aggregations

---

## Integration Points

### Epic 1 Dependencies
- Organizations (org_id FK)
- Users (created_by FK)
- Locations (location_id FK)

### Epic 2 Dependencies
- Products (product_id FK in license_plates)
- Allergens (allergen matrix)

### Epic 3 Dependencies
- Work Orders (work_order_id FK)

### Epic 5 Dependencies (Critical)
- **License Plates** (parent table for genealogy)
  - lp_genealogy references license_plates(id)
  - traceability_links references license_plates(id)
- **Transfer Orders** (transfer_order_id FK)

### Epic 6 Dependencies (Future)
- Shipments (for customer recall tracking)

---

## Tree Visualization Technical Design

### Library Choice: react-flow

**Rationale:**
- Modern React-based library
- Better TypeScript support than D3.js
- Built-in pan/zoom/drag
- Easier customization for business users
- Better performance for large graphs

### Component Structure

```typescript
// Tree Visualization Component
interface GenealogyTreeProps {
  lpId: string
  direction: 'forward' | 'backward' | 'both'
  maxDepth?: number
}

export function GenealogyTree({ lpId, direction, maxDepth = 10 }: GenealogyTreeProps) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Fetch tree data
  useEffect(() => {
    fetchGenealogyData(lpId, direction, maxDepth).then(data => {
      const { nodes: treeNodes, edges: treeEdges } = transformToReactFlow(data)
      setNodes(treeNodes)
      setEdges(treeEdges)
    })
  }, [lpId, direction, maxDepth])

  // Custom node renderer
  const nodeTypes = {
    lpNode: LPNode
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      fitView
    >
      <Controls />
      <MiniMap />
      <Background />
    </ReactFlow>
  )
}

// Custom LP Node Component
function LPNode({ data }: { data: TreeNode }) {
  const statusColor = {
    available: 'green',
    consumed: 'blue',
    shipped: 'gray',
    quarantine: 'orange'
  }[data.status]

  return (
    <div className={`lp-node border-${statusColor}`}>
      <div className="font-bold">{data.lp_number}</div>
      <div className="text-sm">{data.product_code}</div>
      <div className="text-xs">{data.quantity} {data.uom}</div>
      <div className="text-xs text-gray-500">Batch: {data.batch_number}</div>
      {data.expiry_date && (
        <div className="text-xs text-red-500">Exp: {data.expiry_date}</div>
      )}
    </div>
  )
}
```

### Lazy Loading Strategy

```typescript
async function fetchGenealogyData(
  lpId: string,
  direction: string,
  maxDepth: number,
  expandedDepth: number = 3
): Promise<{ nodes: TreeNode[], edges: TreeEdge[] }> {
  // Initial fetch: only load up to depth 3
  const response = await fetch(`/api/technical/tracing/genealogy/${lpId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      direction,
      max_depth: Math.min(expandedDepth, maxDepth)
    })
  })

  const data = await response.json()

  // Mark nodes at max depth as expandable
  data.nodes.forEach(node => {
    if (node.level === expandedDepth) {
      node.hasChildren = true // Show expand icon
    }
  })

  return data
}

// Expand node handler
async function handleNodeExpand(nodeId: string, currentDepth: number) {
  const newNodes = await fetch(`/api/technical/tracing/genealogy/${nodeId}`, {
    method: 'GET',
    body: JSON.stringify({
      direction: 'forward',
      max_depth: currentDepth + 3
    })
  })

  // Merge new nodes into existing tree
  setNodes(prev => [...prev, ...newNodes.nodes])
  setEdges(prev => [...prev, ...newNodes.edges])
  setExpandedNodes(prev => new Set([...prev, nodeId]))
}
```

---

## Acceptance Criteria Summary

### Story 2.18: Forward Traceability
- ✅ AC-018.1: Enter LP ID or Batch Number to trace forward
- ✅ AC-018.2: Show tree of child LPs (splits), WOs, output products
- ✅ AC-018.3: Tree is expandable/collapsible
- ✅ AC-018.4: Click nodes to view LP details
- ✅ AC-018.5: Performance < 1 minute for 1000+ LPs

### Story 2.19: Backward Traceability
- ✅ AC-019.1: Enter LP ID or Batch Number to trace backward
- ✅ AC-019.2: Show tree of parent LPs, source materials, supplier info
- ✅ AC-019.3: Tree is expandable/collapsible
- ✅ AC-019.4: Click nodes to view details

### Story 2.20: Recall Simulation
- ✅ AC-020.1: Enter Batch/LP ID and run recall simulation
- ✅ AC-020.2: Perform both forward and backward trace
- ✅ AC-020.3: Show summary: affected LPs, quantity, locations, shipped, cost
- ✅ AC-020.4: Export to PDF, FDA JSON, FDA XML
- ✅ AC-020.5: Performance < 30 seconds

### Story 2.21: Genealogy Tree View
- ✅ AC-021.1: Interactive tree diagram with nodes showing LP details
- ✅ AC-021.2: Color by status (green/blue/gray/orange)
- ✅ AC-021.3: Expand/collapse nodes
- ✅ AC-021.4: Zoom in/out
- ✅ AC-021.5: Click node for LP detail modal
- ✅ AC-021.6: Lazy load deep nodes

### Story 2.23: Grouped Product Dashboard
- ✅ AC-023.1: Products grouped by RM/WIP/FG
- ✅ AC-023.2: Show count per group
- ✅ AC-023.3: Quick filters per group
- ✅ AC-023.4: Recent changes (last 7 days)

### Story 2.24: Allergen Matrix Visualization
- ✅ AC-024.1: Matrix with Products (rows) × Allergens (columns)
- ✅ AC-024.2: Color coding: Red (Contains), Yellow (May Contain), Green (None)
- ✅ AC-024.3: Filter by product type, category
- ✅ AC-024.4: Sort by allergen count
- ✅ AC-024.5: Export to Excel

---

## Testing Strategy

### Unit Tests
- Genealogy validation (no cycles, no self-reference)
- Traceability link validation (WO or TO, not both)
- Recall summary calculations
- Tree transformation logic (API → react-flow format)
- Dashboard grouping logic
- Allergen matrix aggregation

### Integration Tests
- Forward trace recursive query (depth 1, 3, 10)
- Backward trace recursive query
- Recall simulation combining both directions
- LP split creating genealogy record
- WO consumption creating traceability link
- Dashboard API with filters
- Allergen matrix pagination

### E2E Tests
- Create LP splits → verify forward trace shows children
- Consume LP in WO → verify backward trace shows sources
- Run recall simulation → verify summary calculations
- Expand tree node → verify lazy loading
- Filter product dashboard → verify grouping
- Export allergen matrix to Excel

### Performance Tests
- Forward trace with 1000+ LPs (target: < 60 seconds)
- Recall simulation with 500+ affected LPs (target: < 30 seconds)
- Allergen matrix with 1000+ products (target: < 5 seconds)
- Tree rendering with 500+ nodes (target: < 3 seconds)

---

## Implementation Order

### Phase 1: Database & Core Queries (Story 2.18, 2.19)
1. Migration: Create `lp_genealogy` table
2. Migration: Create `traceability_links` table
3. Migration: Create stub `license_plates` table (for testing)
4. Service: `genealogy-service.ts` with forward/backward trace
5. API: `/api/technical/tracing/forward`
6. API: `/api/technical/tracing/backward`
7. Tests: Recursive CTE queries

### Phase 2: Recall Simulation (Story 2.20)
1. Service: Recall summary calculation logic
2. Service: FDA export generators (PDF, JSON, XML)
3. API: `/api/technical/tracing/recall`
4. API: `/api/technical/tracing/recall/:id/export`
5. Tests: Recall simulation

### Phase 3: Tree Visualization (Story 2.21)
1. API: `/api/technical/tracing/genealogy/:lp_id`
2. Component: `GenealogyTree.tsx` (react-flow)
3. Component: `LPNode.tsx` (custom node renderer)
4. Hook: `useGenealogyTree` (lazy loading)
5. Page: `/technical/tracing` with tree view
6. Tests: Tree rendering and interactions

### Phase 4: Dashboard (Story 2.23, 2.24)
1. Service: `dashboard-service.ts` with aggregations
2. API: `/api/technical/dashboard/products`
3. API: `/api/technical/dashboard/allergen-matrix`
4. API: `/api/technical/dashboard/allergen-matrix/export`
5. Component: `ProductDashboard.tsx`
6. Component: `AllergenMatrix.tsx`
7. Page: `/technical/dashboard`
8. Tests: Dashboard aggregations

### Phase 5: Integration & Polish
1. Integrate with Epic 1 settings
2. Add caching layer (Redis)
3. Performance testing and optimization
4. E2E tests
5. Documentation

---

**Next Steps:**
1. Review this tech spec with stakeholders
2. Create 6 story files (2.18-2.21, 2.23-2.24)
3. Begin implementation in order listed above
4. Run retrospective after each phase

**Estimated Effort:** 3-4 weeks (70-85k tokens across 3 sessions)
