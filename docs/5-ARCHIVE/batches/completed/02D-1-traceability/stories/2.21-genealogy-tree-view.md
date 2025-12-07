# Story 2.21: Genealogy Tree View

**Epic:** 2 - Technical Core
**Batch:** 2D - Traceability & Dashboard
**Status:** Draft
**Priority:** P1 (High)
**Story Points:** 8
**Created:** 2025-01-23

---

## Goal

Implement an interactive visual genealogy tree that displays License Plate relationships in an intuitive, explorable diagram using react-flow, enabling users to quickly understand complex material flows.

## User Story

**As a** QC Manager or Technical user
**I want** an interactive visual tree of LP relationships
**So that** I can easily explore genealogy without reading complex data tables

---

## Problem Statement

Textual tree representations (Stories 2.18, 2.19) are functional but:
- Difficult to understand complex genealogies at a glance
- Hard to follow multiple branches simultaneously
- Not intuitive for non-technical users
- Don't leverage spatial/visual thinking

A visual tree diagram:
- Makes complex relationships immediately clear
- Enables spatial exploration (pan, zoom, expand)
- Supports pattern recognition (splits, combines, bottlenecks)
- More engaging and user-friendly

---

## Acceptance Criteria

### AC-2.21.1: Tree Visualization Library Integration

**Given** the development team is implementing genealogy tree view
**Then** use **react-flow** library for tree visualization

**Rationale:**
- Modern React-based library with TypeScript support
- Built-in pan, zoom, and drag capabilities
- Easier customization than D3.js
- Better performance for large graphs (1000+ nodes)
- Active community and good documentation

**Technical Setup:**
```bash
npm install reactflow
```

**Success Criteria:**
- react-flow installed and configured
- Basic tree rendering works
- Pan and zoom functional
- Custom node types supported

---

### AC-2.21.2: Tree View Page and Navigation

**Given** the user has QC Manager or Technical role
**When** they navigate to `/technical/tracing`
**And** execute a forward or backward trace
**Then** below the tree list view, a "Switch to Visual Tree" button appears

**When** they click "Switch to Visual Tree"
**Then** the page transitions to a full-screen tree visualization
**And** the button changes to "Switch to List View"

**Or** when they navigate to `/technical/tracing/tree/:lp_id?direction=forward`
**Then** the visual tree loads directly

**And** the tree view includes:
- **Header Bar**:
  - Breadcrumbs: Technical > Tracing > Genealogy Tree
  - LP/Batch identifier being traced
  - Direction toggle: Forward | Backward | Both
  - "Switch to List View" button
- **Controls Panel** (top-right):
  - Zoom In (+)
  - Zoom Out (-)
  - Fit to Screen
  - Reset View
  - Download as PNG
- **Tree Canvas**: Full screen (minus header)
- **Mini Map**: Bottom-right corner showing full tree with viewport indicator

**Success Criteria:**
- Smooth transition between list and tree views
- Controls are intuitive and accessible
- Mini map helps navigate large trees
- Header stays visible during scroll

---

### AC-2.21.3: Custom LP Node Component

**Given** the tree view is displayed
**Then** each LP node is rendered as a custom component with:

**Visual Structure:**
```
┌─────────────────────────┐
│ [Status Icon]           │ ← Status indicator (top-left)
│                         │
│   LP-12345              │ ← LP Number (bold, large)
│   FG-BREAD-01           │ ← Product Code (medium)
│   Whole Wheat Bread     │ ← Product Name (small, truncated)
│                         │
│   150.5 KG              │ ← Quantity + UOM (medium)
│   Batch: B-2024-11-001  │ ← Batch Number (small)
│   Exp: 2025-12-31       │ ← Expiry Date (small, conditional)
│                         │
│   📍 WH-A-01-02         │ ← Location (icon + code)
└─────────────────────────┘
```

**Node Styling:**
- **Border Color** (status-based):
  - Green: available
  - Blue: consumed
  - Gray: shipped
  - Orange: quarantine
  - Red: recalled (simulation)
- **Border Width**: 2px
- **Background**: White
- **Shadow**: Subtle shadow for depth
- **Padding**: 12px
- **Border Radius**: 8px
- **Min Width**: 200px
- **Max Width**: 250px

**Conditional Elements:**
- Expiry date only shown if within 60 days or past
- Location shown if available
- Status icon changes based on status:
  - ✅ Available (green checkmark)
  - 🔵 Consumed (blue circle)
  - 📦 Shipped (box icon)
  - ⚠️ Quarantine (warning triangle)
  - ❌ Recalled (red X)

**Success Criteria:**
- Nodes are visually distinct and professional
- Color coding is intuitive
- Text is readable at default zoom (no truncation issues)
- Icons are clear and recognizable

---

### AC-2.21.4: Tree Layout and Edges

**Given** the tree view is displayed
**Then** nodes are arranged in a hierarchical layout:

**Forward Trace Layout:**
- Root LP at **top** (starting point)
- Children below in successive levels
- Siblings spread horizontally
- Vertical spacing: 100px
- Horizontal spacing: 50px

**Backward Trace Layout:**
- Root LP at **bottom** (final product)
- Parents above in successive levels
- Sources at top
- Same spacing as forward

**Both Directions Layout:**
- Root LP at **center**
- Parents to the left
- Children to the right
- Vertical alignment centered

**Edges (Connections):**
- **Line Style**: Smooth bezier curves
- **Line Width**: 2px
- **Line Color**: Gray (#666)
- **Arrows**: At child end (pointing to child)
- **Relationship Label**: Displayed on edge:
  - "Split" (1 → many)
  - "Combine" (many → 1)
  - "Transform" (WO production)
- **Quantity Label**: "150.5 KG" (shown on edge if different from node qty)

**Success Criteria:**
- Tree is auto-arranged (no manual positioning)
- Layout is balanced and symmetrical
- Edges don't overlap nodes
- Labels are readable without zooming
- Smooth curves look professional

---

### AC-2.21.5: Interactive Expand/Collapse

**Given** the tree view is displayed
**And** a node has children (or parents) beyond depth 3
**Then** the node shows an expand icon: ⊕ (plus in circle)

**When** I click the expand icon on a node
**Then**:
- Fetch children/parents from API (lazy load)
- Render new nodes in tree
- Animate expansion (smooth transition)
- Icon changes to collapse: ⊖ (minus in circle)
- Tree re-layouts to accommodate new nodes

**When** I click the collapse icon on a node
**Then**:
- Hide all descendant nodes
- Animate collapse
- Icon changes back to expand
- Tree re-layouts

**And** expand/collapse state is:
- Tracked per node ID
- Persisted during session (session storage)
- Restored on page refresh
- Cleared on new search

**Success Criteria:**
- Lazy loading reduces initial load time
- Animations are smooth (< 300ms)
- State persists across interactions
- No visual glitches during expand/collapse
- Keyboard accessible (Enter key to expand/collapse)

---

### AC-2.21.6: Pan, Zoom, and Navigation

**Given** the tree view is displayed
**Then** users can navigate the tree via:

**Pan (Move):**
- Click and drag canvas to pan
- Touch and drag on mobile/tablet
- Arrow keys (10px increments)
- Smooth inertia on release (ease-out)

**Zoom:**
- Mouse wheel up/down (10% increments)
- Pinch gesture on mobile/tablet
- Zoom In (+) button (25% increment)
- Zoom Out (-) button (25% decrement)
- Double-click node to zoom to fit
- Min zoom: 10% (0.1)
- Max zoom: 200% (2.0)

**Fit to Screen:**
- "Fit to Screen" button centers tree and zooms to show all nodes
- Auto-fit on initial load
- Padding: 50px on all sides

**Reset View:**
- "Reset View" button returns to initial position and 100% zoom

**Mini Map:**
- Shows entire tree at small scale
- Highlights current viewport (blue rectangle)
- Click mini map to jump to area
- Dragging viewport rectangle pans main view

**Success Criteria:**
- Navigation is intuitive (no learning curve)
- Smooth animations (60 FPS)
- Touch gestures work on mobile
- Mini map accurately reflects viewport
- Keyboard shortcuts work (Ctrl+0 to reset, Ctrl+/- to zoom)

---

### AC-2.21.7: Node Click for Details Drawer

**Given** the tree view is displayed
**When** I click on any LP node
**Then** a right-side drawer opens (40% width) showing:

**Drawer Header:**
- LP Number (large text)
- Product Code and Name (subtitle)
- Status badge (colored)
- Close button (X icon)

**Drawer Content (Tabs):**

**Tab 1: Overview**
- Quantity and UOM
- Batch Number
- Location (warehouse, zone, bin)
- Manufacturing Date
- Expiry Date
- Status
- Current Value (qty × unit_cost)

**Tab 2: Genealogy**
- Parent LPs (list with links)
- Child LPs (list with links)
- Relationship types
- "View in Tree" button (highlights node)

**Tab 3: Transactions**
- Work Orders that consumed this LP
- Work Orders that produced this LP
- Transfer Orders
- Transaction dates and quantities

**Tab 4: Quality**
- QC inspections
- Test results
- COA (Certificate of Analysis) status
- Quarantine history

**Drawer Footer:**
- "View Full Details" button (navigates to LP detail page)
- "Export LP History" button (PDF)

**When** I click another node without closing the drawer
**Then** the drawer content updates to the new LP (no animation, instant)

**When** I click "View in Tree" in Genealogy tab
**Then** the tree pans and zooms to highlight the related node

**Success Criteria:**
- Drawer loads data from GET /api/warehouse/license-plates/:id
- Lazy loaded (fetches on click)
- Smooth slide-in animation (300ms)
- Tabs organize information clearly
- Quick actions in footer are accessible
- Mobile-friendly (full screen on small devices)

---

### AC-2.21.8: Search and Highlight

**Given** the tree view is displayed
**When** I type in the search box (top-right)
**Then** as I type:
- Matching nodes are highlighted (yellow glow)
- Matching criteria:
  - LP Number (contains)
  - Product Code (contains)
  - Batch Number (exact or contains)
- Non-matching nodes are dimmed (50% opacity)
- Scroll/pan to first match automatically

**And** search shows result count: "5 of 12 nodes match"

**When** I click "Next" arrow in search box
**Then** pan to next matching node

**When** I click "Previous" arrow
**Then** pan to previous matching node

**When** I clear the search box
**Then** all nodes return to normal (no highlight, full opacity)

**Success Criteria:**
- Search is real-time (no delay)
- Highlighting is visually clear
- Navigation through results is smooth
- Search works on large trees (1000+ nodes)
- Keyboard shortcuts (Ctrl+F to focus search, Enter for next)

---

### AC-2.21.9: Export Tree as Image

**Given** the tree view is displayed
**When** I click "Download as PNG" button
**Then** the tree is exported as a PNG image with:
- Full tree visible (all nodes, even collapsed ones shown expanded)
- High resolution (2x scale for clarity)
- White background
- Logo and title at top: "[Org Name] - LP Genealogy Tree"
- Footer: Generated date, LP ID, user name
- Filename: genealogy-tree-{lp_number}-{date}.png

**And** export process:
- Show progress indicator during export
- No visible UI elements (controls, mini map, etc.) in export
- Export includes only the tree canvas

**Alternative formats:**
- SVG export for vector graphics (future enhancement)

**Success Criteria:**
- Exported PNG is high quality
- All nodes are visible in export
- Export completes in < 5 seconds for 500 nodes
- Filename is descriptive and timestamped
- Header/footer provide context

---

### AC-2.21.10: Performance with Large Trees

**Given** a genealogy tree with 500+ nodes
**When** the tree loads
**Then** performance optimizations are in place:

**Lazy Loading:**
- Initial load: depth 3 only (root + 2 levels)
- Nodes beyond depth 3 show expand icon
- Fetch additional levels on demand

**Virtual Rendering:**
- Render only nodes in viewport + buffer (100px)
- Nodes outside viewport are hidden (but in DOM)
- Re-render on pan/zoom

**Memoization:**
- Node components are memoized (React.memo)
- Re-render only when node data changes
- Edge components memoized separately

**Throttling:**
- Pan/zoom events throttled (16ms / 60 FPS)
- Search input debounced (300ms)

**Performance Targets:**
- 500 nodes: Load in < 3 seconds, 60 FPS interaction
- 1000 nodes: Load in < 5 seconds, 30 FPS interaction
- 2000+ nodes: Pagination required (show message: "Tree too large, showing first 2000 nodes")

**Success Criteria:**
- No lag or freezing during interaction
- Smooth animations maintained
- Memory usage stays under 200MB
- CPU usage stays under 50%

---

## Technical Requirements

### Library Integration

**react-flow:**
```typescript
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom node type
const nodeTypes = {
  lpNode: LPNodeComponent
}
```

### API Endpoints

1. **GET /api/technical/tracing/genealogy/:lp_id**
   - Query: direction (forward, backward, both), max_depth (default: 3)
   - Returns: { nodes: TreeNode[], edges: TreeEdge[], metadata }
   - Auth: QC Manager, Technical, Admin

2. **GET /api/technical/tracing/genealogy/:lp_id/expand**
   - Query: node_id, direction
   - Returns: { nodes: TreeNode[], edges: TreeEdge[] } (incremental)
   - Auth: QC Manager, Technical, Admin

### Component Structure

```typescript
// Main Tree Component
function GenealogyTree({ lpId, direction }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Fetch initial data
  useEffect(() => {
    fetchGenealogyData(lpId, direction, 3).then(transformToReactFlow)
  }, [lpId, direction])

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

// Custom LP Node
function LPNode({ data }: { data: TreeNode }) {
  const statusColor = getStatusColor(data.status)

  return (
    <div className={`lp-node border-${statusColor}`}>
      <StatusIcon status={data.status} />
      <div className="lp-number">{data.lp_number}</div>
      <div className="product-code">{data.product_code}</div>
      <div className="product-name">{data.product_name}</div>
      <div className="quantity">{data.quantity} {data.uom}</div>
      <div className="batch">Batch: {data.batch_number}</div>
      {data.expiry_date && (
        <div className="expiry">Exp: {data.expiry_date}</div>
      )}
      <div className="location">📍 {data.location}</div>
    </div>
  )
}
```

---

## Implementation Status

### ⏳ Pending
- [ ] react-flow library integration
- [ ] API endpoint for genealogy tree data
- [ ] Tree transformation logic (data → react-flow format)
- [ ] Custom LP node component
- [ ] Tree layout algorithm integration
- [ ] Lazy loading / expand-collapse logic
- [ ] Pan/zoom/fit controls
- [ ] Mini map integration
- [ ] Node click drawer
- [ ] Search and highlight
- [ ] PNG export functionality
- [ ] Performance optimizations
- [ ] Tests (unit, integration, E2E)

---

## Testing Checklist

### Unit Tests
- [ ] Tree data transformation (API → react-flow format)
- [ ] Node color logic (status → border color)
- [ ] Edge relationship labels
- [ ] Search matching algorithm
- [ ] Export filename generation

### Integration Tests
- [ ] Genealogy tree API (depth 3)
- [ ] Lazy load additional nodes API
- [ ] Tree renders with 10, 50, 100 nodes
- [ ] Expand/collapse updates state correctly
- [ ] Search highlights correct nodes

### E2E Tests
- [ ] Load tree → see visual nodes
- [ ] Pan tree → viewport updates
- [ ] Zoom in/out → nodes scale
- [ ] Click node → drawer opens
- [ ] Expand node → children load
- [ ] Search "LP-123" → node highlighted
- [ ] Download PNG → file downloads
- [ ] Fit to screen → tree centers
- [ ] Switch to list view → navigate back

### Performance Tests
- [ ] Load tree with 100 nodes (target: < 1 second)
- [ ] Load tree with 500 nodes (target: < 3 seconds, 60 FPS)
- [ ] Load tree with 1000 nodes (target: < 5 seconds, 30 FPS)
- [ ] Pan/zoom with 500 nodes (smooth interaction)
- [ ] Export PNG with 500 nodes (< 5 seconds)

---

## Dependencies

### Requires
- ✅ Story 2.18: Forward Traceability (forward trace data)
- ✅ Story 2.19: Backward Traceability (backward trace data)
- ✅ Epic 1: Organizations, Users, Roles
- 🔄 Epic 5: License Plates

### Enables
- ✅ Story 2.20: Recall Simulation (uses tree visualization)
- 🔄 Better user adoption of traceability features

---

## Notes

- react-flow is preferred over D3.js for maintainability and React integration
- Lazy loading is critical for performance with large genealogies
- Color coding must be consistent with Stories 2.18, 2.19, 2.20
- PNG export is valuable for presentations and reports
- Tree view improves user experience significantly over list view

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2d-traceability.md`
- PRD: `docs/epics/epic-2-technical.md` (Story 2.21)
- react-flow Docs: https://reactflow.dev/
- Component: `apps/frontend/components/technical/GenealogyTree.tsx`
