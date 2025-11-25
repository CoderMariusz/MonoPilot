# Story 2.9: BOM Timeline Visualization

Status: ready-for-dev

## Story

As a **Technical user**,
I want to see a visual timeline of BOM versions,
So that I can understand version history at a glance.

## Acceptance Criteria

### AC-2.9.1: Timeline Display on Product Page
**Given** a product has multiple BOM versions
**When** viewing product detail page at /technical/products/:id
**Then** a Gantt-style timeline is displayed showing all BOM versions

**And** timeline positioned in "BOMs" tab or section
**And** timeline takes full width of content area

### AC-2.9.2: Timeline Visual Elements
**Then** timeline shows:
- **X-axis**: Time scale (dates) with appropriate granularity (days, months, years based on range)
- **Y-axis**: BOM versions (rows)
- **Bars**: Each BOM version represented as horizontal bar
  - Start: effective_from date
  - End: effective_to date (or current date + 1 year if NULL)
  - Width: Proportional to date range duration

**And** each bar displays:
- Version number (e.g., "v1.0")
- Date range tooltip on hover (e.g., "Jan 1, 2025 - Dec 31, 2025")
- Items count badge (e.g., "12 items")

### AC-2.9.3: Color Coding by Status
**Then** bars color-coded by status:
- **Active**: Green (#22c55e)
- **Draft**: Gray (#6b7280)
- **Phased Out**: Orange (#f97316)
- **Inactive**: Red (#ef4444)

**And** color legend displayed above timeline

### AC-2.9.4: Interactive Timeline
**When** clicking a bar
**Then** navigate to BOM Detail page /technical/boms/:id

**When** hovering over bar
**Then** show tooltip with:
- Version number
- Status
- Effective date range
- Items count
- Output quantity and UoM

### AC-2.9.5: Timeline Controls
**Given** timeline has >10 versions OR spans >2 years
**Then** timeline controls available:
- Zoom in/out buttons (or mouse wheel zoom)
- Pan left/right (or drag timeline)
- "Fit to view" button (reset zoom to show all)

### AC-2.9.6: Empty State
**Given** product has no BOMs
**Then** show empty state:
"No BOMs yet for this product. Create your first BOM to get started."
**And** "Create BOM" button (primary, large)

### AC-2.9.7: Timeline Legend
**Then** legend displayed showing:
- Color meanings (Active, Draft, Phased Out, Inactive)
- Visual indicators (e.g., dashed border dla infinite range)
- Current date marker (vertical line)

## Tasks / Subtasks

### Task 1: API Endpoint dla Timeline Data (AC: 2.9.1-2.9.2)
- [ ] Implement GET /api/technical/boms/timeline
  - [ ] Query param: product_id (required)
  - [ ] Return: BOMTimelineData
    ```typescript
    interface BOMTimelineData {
      product: {
        id: string
        code: string
        name: string
      }
      boms: Array<{
        id: string
        version: string
        effective_from: Date
        effective_to: Date | null
        status: BOMStatus
        items_count: number
        output_qty: number
        output_uom: string
      }>
      date_range: {
        min_date: Date  // Earliest effective_from
        max_date: Date  // Latest effective_to or current date
      }
    }
    ```
  - [ ] Query aggregates items_count per BOM (COUNT via JOIN)
  - [ ] Sorted by effective_from ascending
  - [ ] Cache: 5 min TTL
- [ ] Add to lib/api/BOMService.ts:
  ```typescript
  export async function getBOMTimeline(productId: string): Promise<BOMTimelineData>
  ```

### Task 2: Timeline Component Setup (AC: 2.9.1)
- [ ] Install recharts (if not already):
  ```bash
  pnpm add recharts
  ```
- [ ] Create components/technical/BOMTimeline.tsx
- [ ] Component props:
  ```typescript
  interface BOMTimelineProps {
    productId: string
  }
  ```
- [ ] Fetch timeline data using SWR:
  ```typescript
  const { data, isLoading, error } = useSWR(
    `/api/technical/boms/timeline?product_id=${productId}`,
    fetcher
  )
  ```

### Task 3: Recharts Timeline Implementation (AC: 2.9.2-2.9.4)
- [ ] Use Recharts BarChart in horizontal mode:
  ```typescript
  <ResponsiveContainer width="100%" height={400}>
    <BarChart
      layout="horizontal"
      data={timelineData}
      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis
        type="number"
        domain={['dataMin', 'dataMax']}
        tickFormatter={(tick) => formatDate(tick)}
      />
      <YAxis type="category" dataKey="version" />
      <Tooltip content={<CustomTooltip />} />
      <Bar dataKey="duration" fill="#22c55e">
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
  ```
- [ ] Transform data dla Recharts:
  ```typescript
  const transformData = (boms: BOM[]) => {
    return boms.map(bom => ({
      version: bom.version,
      start: bom.effective_from.getTime(),
      end: bom.effective_to?.getTime() || Date.now() + 365 * 24 * 60 * 60 * 1000,
      duration: (bom.effective_to?.getTime() || Date.now()) - bom.effective_from.getTime(),
      status: bom.status,
      items_count: bom.items_count,
      bom_id: bom.id
    }))
  }
  ```
- [ ] Status color mapping:
  ```typescript
  const getStatusColor = (status: BOMStatus) => {
    switch (status) {
      case 'active': return '#22c55e'    // Green
      case 'draft': return '#6b7280'     // Gray
      case 'phased_out': return '#f97316' // Orange
      case 'inactive': return '#ef4444'  // Red
    }
  }
  ```

### Task 4: Custom Tooltip (AC: 2.9.4)
- [ ] Create components/technical/BOMTimelineTooltip.tsx:
  ```typescript
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-white border p-3 rounded shadow-lg">
          <p className="font-semibold">BOM {data.version}</p>
          <p className="text-sm">
            Status: <Badge color={getStatusColor(data.status)}>{data.status}</Badge>
          </p>
          <p className="text-sm">
            {formatDate(data.start)} - {data.end ? formatDate(data.end) : 'Ongoing'}
          </p>
          <p className="text-sm">{data.items_count} items</p>
          <p className="text-sm">{data.output_qty} {data.output_uom}</p>
        </div>
      )
    }
    return null
  }
  ```

### Task 5: Timeline Interactivity (AC: 2.9.4)
- [ ] Add onClick handler to bars:
  ```typescript
  <Bar
    dataKey="duration"
    onClick={(data) => router.push(`/technical/boms/${data.bom_id}`)}
    style={{ cursor: 'pointer' }}
  >
  ```
- [ ] Hover effect (CSS):
  ```css
  .recharts-bar-rectangle:hover {
    opacity: 0.8;
    stroke: #000;
    stroke-width: 2;
  }
  ```

### Task 6: Timeline Controls (AC: 2.9.5)
- [ ] Add zoom controls:
  ```typescript
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState(0)

  // Zoom in/out buttons
  <div className="flex gap-2 mb-4">
    <Button onClick={() => setZoomLevel(z => z * 1.5)}>Zoom In</Button>
    <Button onClick={() => setZoomLevel(z => z / 1.5)}>Zoom Out</Button>
    <Button onClick={() => { setZoomLevel(1); setPanOffset(0) }}>Fit to View</Button>
  </div>
  ```
- [ ] Apply zoom to XAxis domain:
  ```typescript
  <XAxis
    domain={[
      'dataMin' - panOffset,
      'dataMax' / zoomLevel + panOffset
    ]}
  />
  ```
- [ ] Pan with drag (optional, nice-to-have):
  - [ ] Use recharts Brush component dla pan control

### Task 7: Timeline Legend (AC: 2.9.3, 2.9.7)
- [ ] Create legend component above timeline:
  ```typescript
  <div className="flex items-center gap-4 mb-4">
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-green-500 rounded" />
      <span className="text-sm">Active</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-gray-500 rounded" />
      <span className="text-sm">Draft</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-orange-500 rounded" />
      <span className="text-sm">Phased Out</span>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 bg-red-500 rounded" />
      <span className="text-sm">Inactive</span>
    </div>
    <div className="ml-auto text-sm text-muted-foreground">
      Current date: {formatDate(new Date())}
    </div>
  </div>
  ```
- [ ] Add current date marker (ReferenceLine):
  ```typescript
  <ReferenceLine
    x={Date.now()}
    stroke="#000"
    strokeDasharray="5 5"
    label="Today"
  />
  ```

### Task 8: Empty State (AC: 2.9.6)
- [ ] If no BOMs dla product:
  ```typescript
  if (!data?.boms || data.boms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <PackageIcon className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No BOMs yet for this product</p>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first BOM to get started.
        </p>
        <Button onClick={() => router.push(`/technical/boms/new?product_id=${productId}`)}>
          Create BOM
        </Button>
      </div>
    )
  }
  ```

### Task 9: Integration into Product Detail Page (AC: 2.9.1)
- [ ] Update /app/technical/products/[id]/page.tsx
- [ ] Add "BOMs" tab with BOMTimeline component:
  ```typescript
  <Tabs defaultValue="details">
    <TabsList>
      <TabsTrigger value="details">Details</TabsTrigger>
      <TabsTrigger value="boms">BOMs</TabsTrigger>
      <TabsTrigger value="allergens">Allergens</TabsTrigger>
      <TabsTrigger value="history">History</TabsTrigger>
    </TabsList>

    <TabsContent value="boms">
      <BOMTimeline productId={params.id} />
    </TabsContent>
  </Tabs>
  ```

### Task 10: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] transformData function (BOM → Recharts format)
  - [ ] getStatusColor mapping (all 4 statuses)
  - [ ] Date range calculation (infinite range handling)
- [ ] Integration tests (lib/api/__tests__/bom-timeline.test.ts):
  - [ ] GET /api/technical/boms/timeline?product_id=X → returns timeline data
  - [ ] Timeline data includes items_count (aggregated)
  - [ ] Date range calculated correctly
- [ ] E2E tests (__tests__/e2e/bom-timeline.spec.ts):
  - [ ] Navigate to product detail page
  - [ ] Click "BOMs" tab → timeline visible
  - [ ] Verify bars dla all BOM versions
  - [ ] Verify color-coding (Active=green, Draft=gray, etc.)
  - [ ] Hover over bar → tooltip shows details
  - [ ] Click bar → navigate to BOM detail page
  - [ ] Zoom in/out → timeline scales correctly
  - [ ] Empty state shown dla product with no BOMs

### Task 11: Documentation & Cleanup
- [ ] Update component documentation
- [ ] Add timeline API endpoint to API docs
- [ ] Screenshot dla UX reference (add to docs/ux-design/)

## Dev Notes

### Technical Stack
- **Charts**: Recharts (React charting library)
- **Interactivity**: Click handlers, hover tooltips
- **Responsive**: Full-width, adapts to container size

### Key Technical Decisions
1. **Chart Library**: Recharts (React-native, easy to customize, good for timelines)
2. **Timeline Type**: Horizontal bar chart (Gantt-style) - standard dla time-based data
3. **Infinite Range Handling**: NULL effective_to → extend bar to current date + 1 year (visual cue)
4. **Zoom/Pan**: Optional feature (nice-to-have, not critical dla MVP)

### Performance Considerations
- **Data Fetching**: Cache timeline data (5 min TTL), refetch on BOM create/update
- **Rendering**: Recharts handles large datasets well (tested up to 100 bars)
- **Lazy Loading**: Timeline only loads when "BOMs" tab active

### Accessibility
- **Keyboard Navigation**: Bars focusable, Enter to navigate
- **Screen Readers**: ARIA labels dla bars, legend readable
- **Color Blindness**: Color + text labels (not color-only)

### Project Structure
```
components/
  technical/
    BOMTimeline.tsx               # Main timeline component
    BOMTimelineTooltip.tsx        # Custom tooltip

app/
  api/
    technical/
      boms/
        timeline/
          route.ts                # GET /api/technical/boms/timeline

app/
  technical/
    products/
      [id]/
        page.tsx                  # Product detail with timeline
```

### Testing Strategy
**Unit Tests**: Data transformation, color mapping
**Integration Tests**: Timeline API endpoint
**E2E Tests**: Complete timeline interaction flow (hover, click, zoom)

### References
- [Source: docs/epics/epic-2-technical.md#Story-2.9]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#BOM-Timeline-Visualization]
- [UX Design: docs/epics/ux-design-technical-module.md#BOM-Timeline]

### Prerequisites
**Story 2.6**: BOMs table and CRUD operations

### Dependencies
**Libraries:**
- recharts (charting library)
- shadcn/ui (Tabs, Badge, Button)

## Dev Agent Record
<!-- Will be filled during implementation -->

## Change Log
- 2025-01-23: Story drafted by Claude Code
