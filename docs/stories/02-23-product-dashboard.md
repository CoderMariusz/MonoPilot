# Story 2.23: Grouped Product Dashboard

**Epic:** 2 - Technical Core
**Batch:** 2D - Traceability & Dashboard
**Status:** Draft
**Priority:** P2 (Medium)
**Story Points:** 5
**Created:** 2025-01-23

---

## Goal

Create a visual dashboard for the Technical module that groups products by category (RM, WIP, FG) and displays key metrics, recent changes, and quick access filters to improve discoverability and user experience.

## User Story

**As a** Technical user
**I want** to see products organized by categories in a dashboard view
**So that** I can quickly find products and understand the product catalog at a glance

---

## Problem Statement

The current product list view (Story 2.1) is functional but:
- Shows all products in a flat table (no visual grouping)
- Requires filters to find specific product types
- No overview of product counts by category
- No quick way to see recent activity
- Not engaging or intuitive for new users

A grouped dashboard view provides:
- Visual organization by product type (RM, WIP, FG)
- Quick overview of product counts and distribution
- Recent activity visibility (new products, versions, changes)
- Faster navigation to relevant products
- Better user experience for daily tasks

---

## Acceptance Criteria

### AC-2.23.1: Dashboard Page Access

**Given** the user has Technical role or higher
**When** they navigate to `/technical/dashboard` or `/technical/products`
**Then** they see a dashboard view with:
- Page title: "Technical Dashboard"
- Subtitle: "Product Catalog Overview"
- View toggle buttons:
  - "Dashboard View" (active)
  - "List View" (navigates to `/technical/products/list`)
  - "Allergen Matrix" (navigates to `/technical/products/allergens`)
- Quick stats bar at top
- Grouped product sections below

**And** the dashboard is the default landing page for `/technical/products`

**Success Criteria:**
- Dashboard loads in < 2 seconds
- View toggle is intuitive and accessible
- Breadcrumbs: Technical > Dashboard
- Responsive layout (mobile, tablet, desktop)

---

### AC-2.23.2: Quick Stats Bar

**Given** the dashboard view is displayed
**Then** at the top, show a stats bar with 4 metric cards:

**Card 1: Total Products**
- Large number: Count of all active products
- Subtitle: "Active Products"
- Icon: 📦
- Trend: "+5 this month" (green) or "-2 this month" (red)
- Click → filter to all products

**Card 2: Raw Materials**
- Large number: Count of products where type = 'RM'
- Subtitle: "Raw Materials"
- Icon: 🌾
- Percentage: "35% of catalog"
- Click → scroll to RM section

**Card 3: Work in Progress**
- Large number: Count of products where type IN ('WIP', 'SEMI')
- Subtitle: "Work in Progress"
- Icon: ⚙️
- Percentage: "20% of catalog"
- Click → scroll to WIP section

**Card 4: Finished Goods**
- Large number: Count of products where type = 'FG'
- Subtitle: "Finished Goods"
- Icon: ✅
- Percentage: "45% of catalog"
- Click → scroll to FG section

**And** cards have:
- Colored accent border (top border):
  - RM: Green
  - WIP: Orange
  - FG: Blue
- Hover effect (subtle shadow)
- Loading skeleton during fetch

**Success Criteria:**
- Counts are accurate (fetched from database)
- Percentages sum to 100%
- Trends calculated from last 30 days
- Click navigation works smoothly
- Mobile layout stacks cards vertically

---

### AC-2.23.3: Raw Materials Section

**Given** the dashboard view is displayed
**Then** the first product group section shows:

**Section Header:**
- Title: "Raw Materials" (large, green accent)
- Count badge: "(150)" (number of RM products)
- Quick filters (dropdown):
  - All Raw Materials (default)
  - By Supplier
  - By Category (if categories configured)
  - Recently Updated (last 7 days)
- "View All" link (navigates to list view with type=RM filter)

**Product Grid:**
- Display: Grid layout (4 columns desktop, 2 tablet, 1 mobile)
- Show: First 8 products (most recently updated)
- Each product card shows:
  - Product Code (bold)
  - Product Name (truncated to 2 lines)
  - Current Version (badge)
  - Status (Active/Inactive badge)
  - Last Updated (relative time: "2 days ago")
  - Allergen count (icon + number if > 0)
  - Quick actions:
    - View details (eye icon)
    - Edit (pencil icon, Admin/Technical only)

**Empty State:**
- If no RM products: "No raw materials defined yet. Add your first raw material to get started."
- "Add Raw Material" button (primary action)

**Success Criteria:**
- Grid is responsive and visually balanced
- Product cards are consistent with design system
- Quick filters work in real-time (no page reload)
- "View All" preserves filter context
- Hover effects on cards (subtle elevation)

---

### AC-2.23.4: Work in Progress Section

**Given** the dashboard view is displayed
**Then** the second product group section shows:

**Section Header:**
- Title: "Work in Progress" (large, orange accent)
- Count badge: "(50)"
- Quick filters (dropdown):
  - All WIP
  - Semi-Finished (type = 'SEMI')
  - In Development (status = 'draft' or 'development')
  - Recently Updated
- "View All" link

**Product Grid:**
- Same layout as RM section
- Show: First 8 WIP products
- Cards show same information as RM

**Empty State:**
- If no WIP: "No work-in-progress products defined yet."

**Success Criteria:**
- WIP and SEMI products grouped together
- Orange accent consistent with branding
- Filters work correctly

---

### AC-2.23.5: Finished Goods Section

**Given** the dashboard view is displayed
**Then** the third product group section shows:

**Section Header:**
- Title: "Finished Goods" (large, blue accent)
- Count badge: "(200)"
- Quick filters (dropdown):
  - All Finished Goods
  - Released Only (status = 'released')
  - With BOMs (has BOM assigned)
  - Recently Updated
- "View All" link

**Product Grid:**
- Same layout as RM section
- Show: First 8 FG products
- Cards show same information as RM
- Additional indicator: BOM status (✅ if BOM exists, ⚠️ if missing)

**Empty State:**
- If no FG: "No finished goods defined yet."

**Success Criteria:**
- FG products clearly distinguished
- Blue accent consistent with branding
- BOM indicator helps identify incomplete products

---

### AC-2.23.6: Recent Changes Feed

**Given** the dashboard view is displayed
**Then** on the right sidebar (or below on mobile), show "Recent Activity" section with:

**Section Header:**
- Title: "Recent Activity"
- Subtitle: "Last 7 days"
- Filter dropdown: 7 days, 14 days, 30 days

**Activity Feed:**
- List of recent product changes (max 10 items)
- Each item shows:
  - Change icon:
    - ➕ New product created
    - 📝 Product updated
    - 🔢 New version created
    - 🗑️ Product deleted (inactive)
  - Product code and name (link to product)
  - Change type (Created, Updated, Version 1.2)
  - Changed by (user name)
  - Timestamp (relative: "2 hours ago")

**And** activity feed includes:
- Hover to see full change details tooltip
- Click to navigate to product detail page
- "View All Activity" link at bottom (navigates to audit log)

**Empty State:**
- If no activity: "No recent activity in the last 7 days."

**Success Criteria:**
- Activity fetched from product_versions and products.updated_at
- Real-time updates (if using subscriptions)
- Relative timestamps are user-friendly
- Mobile layout moves feed below sections

---

### AC-2.23.7: Quick Actions Panel

**Given** the dashboard view is displayed
**Then** at the top-right (below header), show a "Quick Actions" panel with:

**Actions:**
- "Add Product" button (primary, green)
- "Import Products" button (secondary, with upload icon)
- "Export Catalog" button (secondary, with download icon)
- "View Allergen Matrix" button (secondary)

**And** actions are role-based:
- Add Product: Admin, Technical only
- Import Products: Admin only
- Export Catalog: All roles
- View Allergen Matrix: All roles

**Success Criteria:**
- Quick actions provide shortcuts to common tasks
- Role-based visibility enforced
- Button styling consistent with design system
- Tooltips explain each action

---

### AC-2.23.8: Search and Global Filter

**Given** the dashboard view is displayed
**Then** at the top, show a search bar with:
- Placeholder: "Search products by code or name..."
- Search icon (magnifying glass)
- Clear button (X) when text entered
- Dropdown filter: "All Types", "RM Only", "WIP Only", "FG Only"

**When** I type in the search box
**Then**:
- All sections filter in real-time (debounced 300ms)
- Only matching products shown in grids
- Section counts update to reflect filtered counts
- If no matches: "No products match your search."

**When** I select a type filter
**Then**:
- Only that section is visible (others hidden)
- Stats bar highlights selected type
- Breadcrumb shows active filter

**When** I clear the search
**Then**:
- All sections return to default (first 8 products each)
- All counts restore

**Success Criteria:**
- Search is fast and responsive
- Filter updates are smooth (no flicker)
- Combined search + type filter works correctly
- URL params updated for shareable links

---

### AC-2.23.9: Dashboard Data Refresh

**Given** the dashboard view is displayed
**When** I make changes to products (create, update, delete)
**Then** the dashboard auto-refreshes:
- Stats bar updates
- Product grids update
- Recent activity feed updates
- Counts recalculated

**And** refresh happens via:
- Real-time subscriptions (if enabled)
- OR manual refresh button (top-right)
- OR automatic polling (every 60 seconds)

**When** I click the manual refresh button
**Then**:
- Show loading indicator
- Re-fetch all dashboard data
- Update all sections
- Success toast: "Dashboard refreshed"

**Success Criteria:**
- Dashboard reflects latest data
- No stale data visible
- Refresh is smooth (no full page reload)
- Loading states are clear

---

### AC-2.23.10: Performance and Caching

**Given** the dashboard view is displayed with 1000+ products
**When** the page loads
**Then** performance optimizations are in place:

**Backend Optimization:**
- Use single aggregated query to fetch counts (not 3 separate queries)
- Index on products(type, status, updated_at)
- Cache results for 5 minutes (Redis)
- Pagination for "View All" links

**Frontend Optimization:**
- Lazy load product grids (only render visible sections)
- Image lazy loading for product thumbnails
- Memoize product cards (React.memo)
- Debounce search (300ms)

**Performance Targets:**
- Initial load: < 2 seconds (incl. all sections)
- Search filter: < 300ms response time
- Scroll smooth at 60 FPS
- Memory usage < 100MB

**Success Criteria:**
- Dashboard is fast even with large catalogs
- No lag during filtering or search
- Caching reduces database load
- Mobile performance is acceptable

---

## Technical Requirements

### API Endpoints

1. **GET /api/technical/dashboard/products**
   - Query: group_by=type, include_stats=true, limit=8
   - Returns: { groups: ProductGroup[], overall_stats: Stats }
   - Auth: Technical, QC Manager, Admin

2. **GET /api/technical/dashboard/recent-activity**
   - Query: days=7
   - Returns: { changes: ProductChange[] }
   - Auth: Technical, QC Manager, Admin

### Database Query (Example)

```sql
-- Grouped product counts with recent products
SELECT
  p.type AS category,
  COUNT(*) AS count,
  json_agg(
    json_build_object(
      'id', p.id,
      'code', p.code,
      'name', p.name,
      'version', p.version,
      'status', p.status,
      'updated_at', p.updated_at,
      'allergen_count', (
        SELECT COUNT(*) FROM product_allergens pa
        WHERE pa.product_id = p.id
      )
    )
    ORDER BY p.updated_at DESC
    LIMIT 8
  ) AS recent_products
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

### Caching Strategy

- Cache dashboard data for 5 minutes (Redis)
- Cache key: `dashboard:products:{org_id}`
- Invalidate on product create/update/delete
- Separate cache for recent activity (1 min TTL)

---

## Implementation Status

### ⏳ Pending
- [ ] Dashboard API endpoint
- [ ] Recent activity API endpoint
- [ ] Product grouping query optimization
- [ ] Dashboard page component
- [ ] Stats bar component
- [ ] Product group sections
- [ ] Recent activity feed
- [ ] Quick actions panel
- [ ] Search and filter logic
- [ ] Auto-refresh mechanism
- [ ] Performance optimization
- [ ] Tests (unit, integration, E2E)

---

## Testing Checklist

### Unit Tests
- [ ] Product grouping logic (RM, WIP, FG)
- [ ] Count calculations
- [ ] Percentage calculations
- [ ] Recent activity filtering (7/14/30 days)
- [ ] Search matching algorithm

### Integration Tests
- [ ] Dashboard API with no products
- [ ] Dashboard API with 1000+ products
- [ ] Recent activity API
- [ ] Search filtering products
- [ ] Type filter (RM only, WIP only, FG only)
- [ ] Cache invalidation on product changes

### E2E Tests
- [ ] Load dashboard → see stats and product groups
- [ ] Click stat card → scroll to section
- [ ] Search "bread" → see filtered products
- [ ] Select type filter "RM Only" → see only RM section
- [ ] Click product card → navigate to detail page
- [ ] Click "View All" → navigate to list view with filter
- [ ] Create new product → dashboard auto-refreshes
- [ ] Manual refresh → data reloads

### Performance Tests
- [ ] Load dashboard with 100 products (< 1 second)
- [ ] Load dashboard with 1000 products (< 2 seconds)
- [ ] Search with 1000+ products (< 300ms)
- [ ] Memory usage during prolonged use (< 100MB)

---

## Dependencies

### Requires
- ✅ Story 2.1: Product CRUD (product data)
- ✅ Story 2.2: Product Versioning (recent activity)
- ✅ Story 2.4: Product Allergens (allergen counts)
- ✅ Epic 1: Organizations, Users, Roles

### Enables
- 🔄 Better user adoption of Technical module
- 🔄 Faster product discovery
- 🔄 Visual overview for management

---

## Notes

- Dashboard is a UX enhancement (P2 priority, not blocking)
- Grouping by type (RM, WIP, FG) is intuitive for food manufacturers
- Recent activity feed provides awareness of team changes
- Performance is critical for large catalogs (1000+ products)
- Design should be visually appealing and professional

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2d-traceability.md`
- PRD: `docs/epics/epic-2-technical.md` (Story 2.23)
- UX Design: `docs/design/ux-design-technical-module.md` (Grouped Dashboard)
- Component: `apps/frontend/app/(authenticated)/technical/dashboard/page.tsx`
