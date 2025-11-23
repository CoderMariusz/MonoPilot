# Story 2.3: Product Version History

**Epic:** 2 - Technical Core
**Batch:** 2A - Products + Settings
**Status:** Pending
**Priority:** P0 (Blocker)
**Story Points:** 3
**Created:** 2025-11-23

---

## Goal

Provide a comprehensive version history view showing all changes made to a product over time, with the ability to compare different versions side-by-side for compliance audits and change tracking.

## User Story

**As a** Technical user or QC Manager
**I want** to view a product's complete version history
**So that** I can audit changes, track compliance, and understand how the product specification evolved

---

## Problem Statement

In regulated industries (food, pharma, medical devices), companies must demonstrate:
- **Complete change history** for all product specifications
- **Audit trails** showing who changed what and when
- **Traceability** linking product versions to batches/lots produced
- **Compliance evidence** for regulatory inspections (FDA, EFSA, etc.)

Without a version history view:
- Users cannot see what changed between versions
- Compliance audits are time-consuming and manual
- Root cause analysis is difficult (e.g., "when did we change the shelf life?")
- Knowledge is lost when team members leave

---

## Acceptance Criteria

### AC-2.3.1: Version History Button

**Given** I am viewing a product detail page
**When** I look at the action buttons
**Then** I see a "History" button near Edit/Delete buttons

**When** I click the "History" button
**Then** a Version History Modal opens (Dialog component)

**Success Criteria:**
- Button is clearly visible and labeled
- Button has an icon (Clock or History icon)
- Modal opens smoothly with animation

---

### AC-2.3.2: Version History Modal Structure

**Given** the Version History Modal is open
**Then** I see:

**Header:**
- Title: "Version History - [Product Code]"
- Subtitle: "Current version: X.Y"
- Close button (X)

**Timeline View:**
- Vertical timeline with entries for each version
- Most recent version at the top
- Each entry shows:
  - **Version number** (e.g., "v1.5")
  - **Date and time** (formatted: "Nov 23, 2025 10:30 AM")
  - **User who made the change** (name + avatar/initials)
  - **Changed fields** with old → new values
  - **Compare button** (to select for comparison)

**Pagination:**
- Show 20 versions per page
- "Load More" button or pagination controls at bottom

**Footer:**
- "Close" button
- "Compare Versions" button (enabled when 2 versions selected)

**Success Criteria:**
- Timeline is easy to scan visually
- Clear visual hierarchy (most recent changes stand out)
- Responsive layout (mobile, tablet, desktop)

---

### AC-2.3.3: Version History Entry Display

**Given** a version history entry exists
**Then** each entry displays:

**Version Badge:**
- Format: "v1.0", "v2.5", etc.
- Color: Primary for current version, muted for older versions

**Timestamp:**
- Format: Relative time for recent changes ("2 hours ago", "yesterday")
- Absolute time for older changes ("Nov 20, 2025 3:45 PM")
- Timezone based on user's locale

**User Info:**
- User's full name
- Small avatar or initials badge
- Link to user profile (future enhancement)

**Changed Fields:**
- List of changed fields with diff format:
  - Field name in bold
  - Old value → New value
  - Color coding: Red for old value, Green for new value
  - If value is long (>50 chars), truncate with "... (expand)"

**Example Display:**
```
v1.5
Nov 23, 2025 10:30 AM • John Doe

- Name: "Wheat Flour" → "Organic Wheat Flour"
- Shelf Life: 180 days → 365 days
- Description: [Updated]

[Compare] button
```

**Success Criteria:**
- All information is clearly readable
- Diff format makes changes obvious
- No information overload (concise display)

---

### AC-2.3.4: Empty State

**Given** a product has never been edited (only v1.0 exists)
**When** I click "History"
**Then** I see an empty state message:
- Icon: Clock or History icon
- Message: "No version history yet"
- Subtext: "This product has not been edited since creation. Version history will appear here after the first edit."

**Success Criteria:**
- Clear explanation for empty state
- Not confusing or alarming to users

---

### AC-2.3.5: Compare Versions Selection

**Given** I am viewing the version history
**When** I click the "Compare" button on a version entry
**Then** that version is marked as selected (checkbox or highlight)

**And** I can select up to 2 versions for comparison

**When** I select a 3rd version
**Then** the first selected version is deselected (FIFO behavior)

**When** I have 2 versions selected
**Then** the "Compare Versions" button in the footer is enabled
**And** shows text: "Compare v1.0 vs v1.5"

**Success Criteria:**
- Visual indication of selected versions (checkbox, highlight)
- Clear feedback on which versions are selected
- Compare button updates dynamically

---

### AC-2.3.6: Version Comparison Dialog

**Given** I have selected 2 versions (e.g., v1.0 and v1.5)
**When** I click "Compare Versions" button
**Then** a Version Comparison Dialog opens

**And** the dialog shows:

**Header:**
- Title: "Compare Versions"
- Subtitle: "v1.0 vs v1.5"
- Close button

**Comparison Table:**
- Columns: Field Name | v1.0 | v1.5
- Rows: Only fields that differ between versions
- Color coding:
  - Green row: Field added in newer version
  - Red row: Field removed in newer version
  - Yellow row: Field value changed
- Old value styled with strikethrough (optional)
- New value styled in bold

**Example:**
```
| Field       | v1.0              | v1.5                      |
|-------------|-------------------|---------------------------|
| Name        | Wheat Flour       | Organic Wheat Flour       | (yellow)
| Shelf Life  | 180 days          | 365 days                  | (yellow)
| Category    | -                 | Bakery                    | (green)
```

**Footer:**
- "Close" button

**Success Criteria:**
- Clear side-by-side comparison
- Only differences shown (not all fields)
- Color coding makes changes obvious
- Responsive layout

---

### AC-2.3.7: Version History API Integration

**Given** the version history is loaded
**When** the modal opens
**Then** it fetches data from GET /api/technical/products/:id/history

**And** the API returns:
```json
{
  "data": [
    {
      "id": "uuid",
      "version": 1.5,
      "changed_fields": {
        "name": { "old": "Wheat Flour", "new": "Organic Wheat Flour" },
        "shelf_life_days": { "old": 180, "new": 365 }
      },
      "changed_by": {
        "id": "uuid",
        "name": "John Doe"
      },
      "changed_at": "2025-11-23T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

**Success Criteria:**
- API called on modal open (not on page load)
- Loading state shown during fetch
- Error handling for API failures

---

### AC-2.3.8: Version Comparison API Integration

**Given** I am comparing versions v1.0 and v1.5
**When** the comparison dialog opens
**Then** it fetches data from GET /api/technical/products/:id/history/compare?v1=1.0&v2=1.5

**And** the API returns:
```json
{
  "v1": 1.0,
  "v2": 1.5,
  "differences": [
    {
      "field": "name",
      "v1_value": "Wheat Flour",
      "v2_value": "Organic Wheat Flour",
      "status": "changed"
    },
    {
      "field": "shelf_life_days",
      "v1_value": 180,
      "v2_value": 365,
      "status": "changed"
    },
    {
      "field": "category",
      "v1_value": null,
      "v2_value": "Bakery",
      "status": "added"
    }
  ]
}
```

**Success Criteria:**
- API called when comparison dialog opens
- Comparison calculated server-side (not client-side)
- Differences clearly categorized (added, removed, changed)

---

## Technical Implementation

### API Endpoints

#### GET /api/technical/products/:id/history

**Query Parameters:**
```typescript
{
  page?: number;   // Default: 1
  limit?: number;  // Default: 20
}
```

**Response:**
```typescript
{
  data: Array<{
    id: string;
    version: number;
    changed_fields: Record<string, { old: any; new: any }>;
    change_summary?: string;
    changed_by: { id: string; name: string; avatar?: string };
    changed_at: string; // ISO 8601
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Implementation:**
```typescript
// app/api/technical/products/[id]/history/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const history = await db.query(`
    SELECT
      pvh.id,
      pvh.version,
      pvh.changed_fields,
      pvh.changed_at,
      u.id as user_id,
      u.name as user_name
    FROM product_version_history pvh
    JOIN users u ON pvh.changed_by = u.id
    WHERE pvh.product_id = $1
      AND pvh.org_id = $2
    ORDER BY pvh.changed_at DESC
    LIMIT $3 OFFSET $4
  `, [params.id, orgId, limit, offset])

  const total = await db.query(`
    SELECT COUNT(*) FROM product_version_history
    WHERE product_id = $1 AND org_id = $2
  `, [params.id, orgId])

  return NextResponse.json({
    data: history.rows.map(row => ({
      id: row.id,
      version: row.version,
      changed_fields: row.changed_fields,
      changed_by: { id: row.user_id, name: row.user_name },
      changed_at: row.changed_at
    })),
    pagination: {
      page,
      limit,
      total: total.rows[0].count,
      totalPages: Math.ceil(total.rows[0].count / limit)
    }
  })
}
```

#### GET /api/technical/products/:id/history/compare

**Query Parameters:**
```typescript
{
  v1: number;  // First version (e.g., 1.0)
  v2: number;  // Second version (e.g., 1.5)
}
```

**Response:**
```typescript
{
  v1: number;
  v2: number;
  differences: Array<{
    field: string;
    v1_value: any;
    v2_value: any;
    status: 'added' | 'removed' | 'changed';
  }>;
}
```

**Implementation:**
```typescript
// app/api/technical/products/[id]/history/compare/route.ts
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const v1 = parseFloat(searchParams.get('v1')!)
  const v2 = parseFloat(searchParams.get('v2')!)

  // Get product state at each version
  const state1 = await getProductStateAtVersion(params.id, v1)
  const state2 = await getProductStateAtVersion(params.id, v2)

  // Calculate differences
  const differences = calculateDifferences(state1, state2)

  return NextResponse.json({
    v1,
    v2,
    differences
  })
}

async function getProductStateAtVersion(productId: string, version: number) {
  // Reconstruct product state by replaying changes up to version
  const history = await db.query(`
    SELECT changed_fields
    FROM product_version_history
    WHERE product_id = $1 AND version <= $2
    ORDER BY version ASC
  `, [productId, version])

  // Start with initial state (version 1.0)
  let state = await getProductInitialState(productId)

  // Apply each change
  for (const change of history.rows) {
    state = applyChanges(state, change.changed_fields)
  }

  return state
}

function calculateDifferences(state1: any, state2: any) {
  const diffs = []
  const allKeys = new Set([...Object.keys(state1), ...Object.keys(state2)])

  for (const key of allKeys) {
    if (state1[key] !== state2[key]) {
      diffs.push({
        field: key,
        v1_value: state1[key] ?? null,
        v2_value: state2[key] ?? null,
        status: !state1[key] ? 'added' : !state2[key] ? 'removed' : 'changed'
      })
    }
  }

  return diffs
}
```

### Frontend Components

```
apps/frontend/app/technical/products/[id]/
└── components/
    ├── ProductHistoryModal.tsx      # Version history timeline
    ├── VersionHistoryEntry.tsx      # Single history entry
    ├── VersionCompareDialog.tsx     # Comparison view
    └── VersionCompareTable.tsx      # Comparison table
```

**ProductHistoryModal.tsx:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useQuery } from '@tanstack/react-query'
import { getProductHistory } from '@/lib/api/technical/products'

export function ProductHistoryModal({ productId, open, onClose }: Props) {
  const [selectedVersions, setSelectedVersions] = useState<number[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['product-history', productId],
    queryFn: () => getProductHistory(productId),
    enabled: open
  })

  function toggleVersionSelection(version: number) {
    setSelectedVersions(prev => {
      if (prev.includes(version)) {
        return prev.filter(v => v !== version)
      }
      if (prev.length >= 2) {
        // FIFO: remove oldest selection
        return [prev[1], version]
      }
      return [...prev, version]
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History - {productCode}</DialogTitle>
          </DialogHeader>

          {isLoading && <Skeleton />}

          {data?.data.length === 0 && (
            <EmptyState
              icon={Clock}
              title="No version history yet"
              description="This product has not been edited since creation."
            />
          )}

          <div className="space-y-4">
            {data?.data.map(entry => (
              <VersionHistoryEntry
                key={entry.id}
                entry={entry}
                isSelected={selectedVersions.includes(entry.version)}
                onToggleSelect={() => toggleVersionSelection(entry.version)}
              />
            ))}
          </div>

          <DialogFooter>
            <Button
              disabled={selectedVersions.length !== 2}
              onClick={() => setCompareOpen(true)}
            >
              Compare v{selectedVersions[0]} vs v{selectedVersions[1]}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VersionCompareDialog
        productId={productId}
        v1={selectedVersions[0]}
        v2={selectedVersions[1]}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </>
  )
}
```

**VersionHistoryEntry.tsx:**
```tsx
export function VersionHistoryEntry({ entry, isSelected, onToggleSelect }: Props) {
  return (
    <div className={cn("border rounded-lg p-4", isSelected && "border-primary")}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
          <Badge variant={entry.isCurrent ? "default" : "secondary"}>
            v{entry.version}
          </Badge>
          <div>
            <p className="text-sm text-muted-foreground">
              {formatRelativeTime(entry.changed_at)} • {entry.changed_by.name}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {Object.entries(entry.changed_fields).map(([field, change]) => (
          <div key={field} className="text-sm">
            <strong>{formatFieldName(field)}:</strong>{' '}
            <span className="text-red-600 line-through">{change.old}</span>
            {' → '}
            <span className="text-green-600 font-medium">{change.new}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## UI/UX Specifications

### Visual Design

**History Modal:**
- Max width: 3xl (768px)
- Max height: 80vh (scrollable)
- Timeline with vertical line connecting entries

**Version Entry Card:**
- Border: subtle gray
- Selected state: primary border color
- Padding: 1rem
- Rounded corners
- Hover: slight shadow

**Comparison Dialog:**
- Table layout with 3 columns
- Row colors:
  - Added: light green background
  - Removed: light red background
  - Changed: light yellow background
- Strikethrough for old values (optional)
- Bold for new values

**Color Palette:**
- Old value: red-600
- New value: green-600
- Added field: green-100 background
- Removed field: red-100 background
- Changed field: yellow-100 background

---

## Testing Checklist

### Unit Tests

```typescript
test('calculateDifferences finds added, removed, changed fields', () => {
  const state1 = { name: 'Old', qty: 100 }
  const state2 = { name: 'New', qty: 100, category: 'Bakery' }

  const diffs = calculateDifferences(state1, state2)

  expect(diffs).toContainEqual({
    field: 'name',
    v1_value: 'Old',
    v2_value: 'New',
    status: 'changed'
  })

  expect(diffs).toContainEqual({
    field: 'category',
    v1_value: null,
    v2_value: 'Bakery',
    status: 'added'
  })
})
```

### Integration Tests

```typescript
test('GET /api/technical/products/:id/history returns version history', async () => {
  const product = await createProduct({ code: 'TEST', name: 'Test' })
  await updateProduct(product.id, { name: 'Updated' })
  await updateProduct(product.id, { description: 'Desc' })

  const response = await fetch(`/api/technical/products/${product.id}/history`)
  const data = await response.json()

  expect(data.data).toHaveLength(2) // 2 edits
  expect(data.data[0].version).toBe(1.2) // Most recent first
  expect(data.data[1].version).toBe(1.1)
})

test('GET /api/technical/products/:id/history/compare compares versions', async () => {
  const product = await createProduct({ code: 'TEST', name: 'Test', shelf_life_days: 100 })
  await updateProduct(product.id, { name: 'Updated', shelf_life_days: 200 })

  const response = await fetch(
    `/api/technical/products/${product.id}/history/compare?v1=1.0&v2=1.1`
  )
  const data = await response.json()

  expect(data.differences).toHaveLength(2)
  expect(data.differences).toContainEqual({
    field: 'name',
    v1_value: 'Test',
    v2_value: 'Updated',
    status: 'changed'
  })
})
```

### E2E Tests

```typescript
test('View version history', async ({ page }) => {
  await createTestProduct({ code: 'E2E', name: 'Original' })
  await updateTestProduct({ name: 'Updated' })

  await page.goto('/technical/products/[id]')
  await page.click('button:has-text("History")')

  await expect(page.locator('text=v1.1')).toBeVisible()
  await expect(page.locator('text=Original → Updated')).toBeVisible()
})

test('Compare two versions', async ({ page }) => {
  await createTestProduct({ code: 'E2E', name: 'V1' })
  await updateTestProduct({ name: 'V2' })
  await updateTestProduct({ name: 'V3' })

  await page.goto('/technical/products/[id]')
  await page.click('button:has-text("History")')

  // Select v1.0 and v1.2
  await page.click('text=v1.0 >> .. >> input[type="checkbox"]')
  await page.click('text=v1.2 >> .. >> input[type="checkbox"]')

  await page.click('button:has-text("Compare")')

  await expect(page.locator('table')).toContainText('V1')
  await expect(page.locator('table')).toContainText('V3')
})
```

---

## Dependencies

**Required Before This Story:**
- ✅ Story 2.2 (Product Versioning) - History data generated
- ✅ product_version_history table populated
- ✅ Database queries optimized (indexed)

**Blocks:**
- Compliance reporting features
- Audit trail exports

---

## Definition of Done

- [ ] Version history API endpoint implemented and tested
- [ ] Version comparison API endpoint implemented and tested
- [ ] ProductHistoryModal component created
- [ ] VersionCompareDialog component created
- [ ] Empty state for products with no history
- [ ] Version selection UI (checkboxes)
- [ ] Pagination for large histories
- [ ] Unit tests for diff calculation (100% coverage)
- [ ] Integration tests for API endpoints
- [ ] E2E tests for history viewing and comparison
- [ ] Code review approved
- [ ] Documentation committed

---

## Estimation Breakdown

**3 Story Points = ~5-7 hours**
- History API endpoint: 1 hour
- Comparison API endpoint: 1.5 hours
- ProductHistoryModal component: 1.5 hours
- VersionCompareDialog component: 1 hour
- Testing (unit, integration, E2E): 2 hours
- Polish and bug fixes: 1 hour
