# Story 2.24: Allergen Matrix Visualization

**Epic:** 2 - Technical Core
**Batch:** 2D - Traceability & Dashboard
**Status:** Draft
**Priority:** P1 (High)
**Story Points:** 8
**Created:** 2025-01-23

---

## Goal

Create an interactive allergen matrix visualization that displays all products (rows) against all allergens (columns) with color-coded cells to quickly identify allergen presence, cross-contamination risks, and compliance gaps.

## User Story

**As a** Technical user or QC Manager
**I want** to see an allergen matrix for all products
**So that** I can quickly identify cross-contamination risks and ensure allergen compliance

---

## Problem Statement

Allergen management is critical for:
- **Regulatory Compliance**: FDA, EU regulations require allergen labeling
- **Consumer Safety**: Incorrect allergen info can cause severe allergic reactions
- **Cross-Contamination Risk**: Shared equipment increases "may contain" risks

Current challenges:
- No visual overview of allergens across product catalog
- Difficult to spot patterns (e.g., all wheat products)
- Hard to identify products missing allergen declarations
- No quick way to assess cross-contamination risk by production line

An allergen matrix provides:
- At-a-glance view of allergen presence across all products
- Visual patterns for risk assessment
- Quick filtering by product type or allergen
- Export for regulatory audits and HACCP documentation

---

## Acceptance Criteria

### AC-2.24.1: Allergen Matrix Page Access

**Given** the user has Technical role or higher
**When** they navigate to `/technical/products/allergens`
**Then** they see an allergen matrix page with:
- Page title: "Allergen Matrix"
- Subtitle: "Product Allergen Overview"
- View toggle buttons:
  - "Dashboard View"
  - "List View"
  - "Allergen Matrix" (active)
- Filter panel (top)
- Matrix table (center, full width)
- Pagination controls (bottom)
- Export button (top-right)

**Success Criteria:**
- Matrix loads in < 3 seconds for 100 products
- Responsive layout (horizontal scroll on mobile)
- Breadcrumbs: Technical > Products > Allergen Matrix
- Professional, data-dense UI

---

### AC-2.24.2: Allergen Matrix Table Structure

**Given** the allergen matrix is displayed
**Then** show a table with:

**Columns (Fixed):**
- Product Code (sticky left, 120px width)
- Product Name (sticky left, 200px width)
- Product Type (80px, RM/WIP/FG badge)

**Columns (Dynamic - Allergens):**
- One column per allergen (14 EU mandatory + custom)
- Column header: Allergen name (rotated 45° for space)
- Column width: 40px each
- Allergen order: Alphabetical or custom priority

**EU Mandatory 14 Allergens:**
1. Cereals (Gluten)
2. Crustaceans
3. Eggs
4. Fish
5. Peanuts
6. Soybeans
7. Milk (Dairy)
8. Tree Nuts
9. Celery
10. Mustard
11. Sesame
12. Sulfites
13. Lupin
14. Molluscs

**Columns (Summary):**
- Allergen Count (right-sticky, 80px, total allergens per product)

**Rows:**
- One row per product (active products only)
- Row height: 48px
- Hover effect: Highlight entire row (light background)
- Click row: Navigate to product detail page

**Success Criteria:**
- Table is horizontally scrollable (sticky columns stay visible)
- Column headers are readable (rotated text or icons)
- Table handles 100+ products without lag
- Sticky columns work on all browsers

---

### AC-2.24.3: Cell Color Coding

**Given** the allergen matrix is displayed
**Then** each cell is color-coded based on allergen status:

**Color Scheme:**
- **Red (Dark)**: Contains - Product contains this allergen
  - Background: `#FEE2E2` (light red)
  - Icon: ✅ (checkmark) or "C"
  - Tooltip: "Contains [Allergen Name]"

- **Yellow (Warning)**: May Contain - Cross-contamination risk
  - Background: `#FEF3C7` (light yellow)
  - Icon: ⚠️ (warning) or "M"
  - Tooltip: "May Contain [Allergen Name] - Cross-contamination risk"

- **Green (Safe)**: None - No allergen present
  - Background: `#D1FAE5` (light green)
  - Icon: ✓ (thin checkmark) or empty
  - Tooltip: "Does not contain [Allergen Name]"

- **Gray (Unknown)**: Not Declared - No allergen record
  - Background: `#F3F4F6` (light gray)
  - Icon: ? (question mark) or "-"
  - Tooltip: "Allergen status not declared"

**And** cells have:
- Center-aligned content
- Icon or text indicator
- Hover effect (darker shade)
- Click to edit (Admin/Technical only, opens allergen edit modal)

**Success Criteria:**
- Colors are distinct and accessible (WCAG AA contrast)
- Icons are clear at small size
- Tooltips provide context
- Color blind friendly (not relying solely on color, also icon/text)

---

### AC-2.24.4: Filter Panel

**Given** the allergen matrix is displayed
**Then** the filter panel at the top shows:

**Filter Controls:**
1. **Product Type Filter** (multi-select dropdown):
   - All Types (default)
   - Raw Materials (RM)
   - Work in Progress (WIP)
   - Finished Goods (FG)
   - Custom types (if configured)

2. **Allergen Presence Filter** (dropdown):
   - All Products (default)
   - Has Allergens Only (allergen_count > 0)
   - No Allergens (allergen_count = 0)
   - Missing Declarations (has gray cells)

3. **Specific Allergen Filter** (multi-select):
   - Dropdown with all allergens
   - Select 1+ allergens
   - Show only products with selected allergens (Contains or May Contain)

4. **Allergen Count Filter** (range slider):
   - Min: 0, Max: 14 (or highest count)
   - Show products with allergen count in range

5. **Search** (text input):
   - Search by product code or name
   - Real-time filtering

**And** filter panel has:
- "Clear All Filters" button
- Active filter chips (removable)
- Filter count indicator: "Showing 45 of 200 products"

**When** I apply filters
**Then**:
- Matrix updates in real-time (< 500ms)
- URL params updated for shareable links
- Pagination resets to page 1
- Export respects active filters

**Success Criteria:**
- Filters are intuitive and responsive
- Multiple filters combine correctly (AND logic)
- Clear filters resets to default view
- Filter state persists on page refresh

---

### AC-2.24.5: Sorting and Column Reordering

**Given** the allergen matrix is displayed
**Then** users can sort and reorder columns:

**Sortable Columns:**
- Product Code (A-Z, Z-A)
- Product Name (A-Z, Z-A)
- Product Type (RM → WIP → FG or reverse)
- Allergen Count (ascending, descending)
- Individual Allergen Columns (Contains first, None last)

**When** I click a column header
**Then**:
- Table sorts by that column (toggle ASC/DESC)
- Sort indicator appears (▲ or ▼)
- Previous sort is cleared (single-column sort only)

**Column Reordering (Optional):**
- Drag column header to reorder allergen columns
- Reorder persisted in user preferences
- "Reset to Default Order" button

**Success Criteria:**
- Sorting is fast (< 500ms for 1000 products)
- Sort indicator is clear
- Drag-drop reordering is smooth (if implemented)
- Default order is logical (alphabetical or priority)

---

### AC-2.24.6: Pagination

**Given** the allergen matrix has > 100 products
**Then** pagination controls at the bottom show:
- Items per page: 50, 100, 200 (dropdown)
- Current page: "Page 1 of 5"
- Navigation: First, Previous, Next, Last buttons
- Page number input: Jump to page

**And** pagination:
- Default: 100 items per page
- Preserves sort and filter state
- Smooth scroll to top on page change
- URL param updated: ?page=2

**Success Criteria:**
- Pagination handles 1000+ products
- Page changes are instant (data pre-fetched or cached)
- No full page reload on navigation

---

### AC-2.24.7: Export Allergen Matrix

**Given** the allergen matrix is displayed
**When** I click "Export" button
**Then** a dropdown shows export options:
- **Export as Excel** (default, most common)
- **Export as CSV**
- **Export as PDF** (formatted table)

**When** I select "Export as Excel"
**Then** download begins immediately
**And** Excel file contains:
- **Sheet 1: Allergen Matrix**
  - Formatted table with color coding
  - Headers: Product Code, Name, Type, Allergens (columns), Total
  - Cells color-coded as in UI (red, yellow, green, gray)
  - Freeze panes (first 3 columns frozen)
- **Sheet 2: Legend**
  - Color legend explaining red/yellow/green/gray
  - Allergen list with descriptions
  - Export metadata (timestamp, user, filters applied)
- **Sheet 3: Summary**
  - Count of products by type
  - Count of products with each allergen
  - Most common allergens (chart)

**API Endpoint:**
```
POST /api/technical/dashboard/allergen-matrix/export
Body: {
  filters: {
    product_types?: string[],
    allergen_ids?: string[],
    allergen_count_min?: number,
    allergen_count_max?: number
  },
  format: 'excel' | 'csv' | 'pdf'
}
Response: { file_url: string, filename: string }
```

**Success Criteria:**
- Export includes all products (respects filters, ignores pagination)
- Excel formatting is professional (conditional formatting)
- CSV is clean (proper escaping)
- PDF is print-ready (fits on landscape pages)
- Filename includes timestamp: allergen-matrix-{date}.xlsx

---

### AC-2.24.8: Cell Click to Edit Allergen

**Given** the allergen matrix is displayed
**And** I have Admin or Technical role
**When** I click a cell in the matrix
**Then** a quick-edit popover opens with:
- Product name (header)
- Allergen name (header)
- Radio buttons:
  - ⭕ Contains
  - ⭕ May Contain
  - ⭕ None (remove allergen record)
- "Save" and "Cancel" buttons

**When** I select an option and click "Save"
**Then**:
- Cell updates immediately (color changes)
- Allergen count updates
- API call: PUT /api/technical/products/:id/allergens
- Success toast: "Allergen updated"

**When** I click "Cancel" or click outside popover
**Then**:
- Popover closes without saving
- Cell remains unchanged

**Success Criteria:**
- Quick-edit provides fast allergen updates
- Changes reflect immediately (optimistic UI)
- Error handling if API fails (revert change)
- Role-based access enforced (Viewer can't edit)

---

### AC-2.24.9: Allergen Risk Insights

**Given** the allergen matrix is displayed
**Then** above the matrix, show an "Insights" panel with:

**Insight Cards:**
1. **High-Risk Products**
   - Count of products with 5+ allergens
   - List of top 3 products (code, name, allergen count)
   - Warning icon

2. **Missing Declarations**
   - Count of products with gray cells (not declared)
   - Call to action: "Review 15 products"
   - Link to filtered view (missing declarations)

3. **Most Common Allergens**
   - Top 3 allergens across catalog
   - Bar chart showing product count per allergen
   - Click allergen → filter matrix to that allergen

4. **Cross-Contamination Alerts**
   - Count of products with "May Contain" status
   - Suggests reviewing production line segregation
   - Link to production line settings

**Success Criteria:**
- Insights provide actionable information
- Calculations are accurate (real-time)
- Links navigate to relevant filtered views
- Insights help prioritize allergen management tasks

---

### AC-2.24.10: Performance and Optimization

**Given** the allergen matrix with 1000+ products and 14+ allergens
**When** the page loads
**Then** performance optimizations are in place:

**Backend Optimization:**
- Single aggregated query with CROSS JOIN
- JSON aggregation for allergen status per product
- Indexed on product_allergens(product_id, allergen_id)
- Pagination on database level (LIMIT/OFFSET)
- Cache results for 5 minutes (Redis)

**Frontend Optimization:**
- Virtual scrolling for > 200 products
- Memoized cell components (React.memo)
- Debounced search and filters (300ms)
- Lazy rendering of non-visible cells
- Progressive enhancement (load visible rows first)

**Performance Targets:**
- Initial load: < 3 seconds (100 products)
- Scroll/filter: 60 FPS (no lag)
- Export generation: < 10 seconds (1000 products)
- Memory usage: < 150MB

**Success Criteria:**
- Matrix is fast even with large catalogs
- No lag during scrolling or filtering
- Export offloaded to background job for large datasets
- Mobile performance is acceptable (horizontal scroll)

---

## Technical Requirements

### API Endpoints

1. **GET /api/technical/dashboard/allergen-matrix**
   - Query: product_types, allergen_ids, allergen_count_min/max, limit, offset, sort_by
   - Returns: { matrix: AllergenMatrixRow[], allergens: Allergen[], total: number }
   - Auth: Technical, QC Manager, Admin

2. **POST /api/technical/dashboard/allergen-matrix/export**
   - Body: { filters, format }
   - Returns: { file_url: string }
   - Auth: Technical, QC Manager, Admin

3. **GET /api/technical/dashboard/allergen-insights**
   - Returns: { high_risk_count, missing_declarations, common_allergens, cross_contamination_alerts }
   - Auth: Technical, QC Manager, Admin

### Database Query (Example)

```sql
SELECT
  p.id AS product_id,
  p.code AS product_code,
  p.name AS product_name,
  p.type AS product_type,
  json_object_agg(
    a.id,
    COALESCE(pa.status, 'none')
  ) AS allergens,
  COUNT(pa.id) FILTER (WHERE pa.status IN ('contains', 'may_contain')) AS allergen_count
FROM products p
CROSS JOIN allergens a
LEFT JOIN product_allergens pa ON pa.product_id = p.id AND pa.allergen_id = a.id
WHERE p.org_id = $1
  AND p.status = 'active'
  AND ($2::text[] IS NULL OR p.type = ANY($2)) -- Filter by type
GROUP BY p.id, p.code, p.name, p.type
HAVING ($3::integer IS NULL OR COUNT(pa.id) >= $3) -- Min allergen count
ORDER BY
  CASE $4 -- Sort parameter
    WHEN 'allergen_count' THEN COUNT(pa.id)
    WHEN 'code' THEN 0
  END DESC,
  p.code ASC
LIMIT $5 OFFSET $6;
```

### Data Model

```typescript
export interface AllergenMatrixRow {
  product_id: string
  product_code: string
  product_name: string
  product_type: 'RM' | 'WIP' | 'SEMI' | 'FG'
  allergens: Record<string, 'contains' | 'may_contain' | 'none'>
  allergen_count: number
}
```

---

## Implementation Status

### ⏳ Pending
- [ ] Allergen matrix API endpoint
- [ ] Allergen insights API endpoint
- [ ] Export generation (Excel, CSV, PDF)
- [ ] Matrix page component
- [ ] Matrix table with sticky columns
- [ ] Cell color coding logic
- [ ] Filter panel
- [ ] Quick-edit popover
- [ ] Insights panel
- [ ] Export functionality
- [ ] Performance optimization
- [ ] Tests (unit, integration, E2E)

---

## Testing Checklist

### Unit Tests
- [ ] Allergen matrix aggregation query
- [ ] Cell color logic (contains → red, may_contain → yellow, none → green)
- [ ] Filter combination logic
- [ ] Sort logic (by allergen count, product code)
- [ ] Export file generation (Excel, CSV, PDF)

### Integration Tests
- [ ] Allergen matrix API with 100 products
- [ ] Matrix with filters applied
- [ ] Matrix with sort applied
- [ ] Quick-edit allergen status
- [ ] Export generation (all formats)
- [ ] Insights calculation

### E2E Tests
- [ ] Load matrix → see color-coded cells
- [ ] Filter by product type "RM" → see only RM products
- [ ] Filter by allergen "Gluten" → see only products with gluten
- [ ] Sort by allergen count → see descending order
- [ ] Click cell → quick-edit popover opens
- [ ] Update allergen status → cell color changes
- [ ] Export as Excel → file downloads
- [ ] View insights → see high-risk products
- [ ] Pagination → navigate to page 2

### Performance Tests
- [ ] Load matrix with 100 products (< 3 seconds)
- [ ] Load matrix with 500 products (< 5 seconds)
- [ ] Load matrix with 1000+ products (< 10 seconds with virtual scroll)
- [ ] Filter/sort with 1000 products (< 500ms)
- [ ] Export 1000+ products (background job, < 30 seconds)

---

## Dependencies

### Requires
- ✅ Story 2.1: Product CRUD (product data)
- ✅ Story 2.4: Product Allergens (allergen assignments)
- ✅ Epic 1: Allergen settings (14 EU allergens)
- ✅ Epic 1: Organizations, Users, Roles

### Enables
- 🔄 Regulatory compliance (FDA, EU labeling)
- 🔄 HACCP documentation
- 🔄 Allergen risk assessment
- 🔄 Cross-contamination analysis

---

## Notes

- Allergen matrix is P1 critical for regulatory compliance
- Color coding must be accessible (WCAG AA)
- Export to Excel is most requested format for audits
- Cross JOIN query can be expensive with many allergens (optimize with indexes)
- Matrix UI should be professional and data-dense (not cluttered)

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2d-traceability.md`
- PRD: `docs/epics/epic-2-technical.md` (Story 2.24)
- UX Design: `docs/design/ux-design-technical-module.md` (Allergen Matrix)
- Component: `apps/frontend/app/(authenticated)/technical/products/allergens/page.tsx`
- EU Allergen Regulations: https://ec.europa.eu/food/safety/labelling-and-nutrition/food-allergens_en
