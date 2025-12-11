# Epic Technical Specification: Settings UI Redesign

Date: 2025-11-27
Author: MonoPilot Team
Epic ID: 1 - Batch 1E
Status: Ready for Development

---

## Overview

Epic 1 Batch 1E (Settings UI Redesign) implementuje kompleksowe przeprojektowanie interfejsu użytkownika modułu Settings zgodnie ze wspólnym systemem projektowania MonoPilot. Batch zapewnia spójność wizualną i funkcjonalną z modułami Planning (Epic 3) i Technical (Epic 2), tworząc jednolite doświadczenie użytkownika we wszystkich desk-facing modułach.

Batch składa się z 4 stories obejmujących: reusable header component z nawigacją (1.16), compact stats cards dla dashboard (1.17), standaryzację wszystkich tabel (1.18), oraz pełną responsywność mobilną (1.19).

## Objectives and Scope

### In Scope
- ✅ **Reusable SettingsHeader**: Nawigacja z tabami (Settings│Org│Users│WH│Loc│Machines│Lines│Allergens│Tax│Modules│Wizard)
- ✅ **Compact Stats Cards**: 4 karty (Users, Locations, Configuration, System) z 2×2 grid metryk
- ✅ **Standardized Tables**: Jednolite kolumny, sortowanie, filtry, search, paginacja (20/page)
- ✅ **Action Buttons Consistency**: View (gray-600), Edit (gray-600), Delete (red-600)
- ✅ **Status Badge Colors**: Active (green-600), Inactive (gray-400), Pending (yellow-500), Error (red-600)
- ✅ **Mobile Responsive**: Hamburger menu (<768px), table→card view, 44px touch targets
- ✅ **Shared Color System**: Refactor planning-colors.ts → app-colors.ts (shared across modules)
- ✅ **Breadcrumbs Navigation**: Settings > Current Page > Detail
- ✅ **Empty States**: Friendly message + "Create first [resource]" CTA

### Out of Scope (Later Batches/Phases)
- ❌ Setup Wizard UI (Batch 1D - Story 1.12)
- ❌ User Management CRUD (Batch 1A - Stories 1.2-1.4)
- ❌ Warehouse/Location CRUD (Batch 1B - Stories 1.5-1.8)
- ❌ Master Data CRUD (Batch 1C - Stories 1.9-1.11)
- ❌ Settings Dashboard Analytics (Epic 1D - Story 1.15)
- ❌ Dark Mode Implementation (referenced in shared system, not implemented in 1E)

## System Architecture Alignment

### Technology Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Table, Card, Modal, Drawer)
- **Database**: PostgreSQL 15 via Supabase (existing tables from Batches 1A-1D)
- **Auth**: Supabase Auth z JWT sessions
- **State Management**: SWR dla data fetching/caching (stats cards)
- **Responsive**: Mobile-first design (Tailwind breakpoints: sm, md, lg)

### Architecture Constraints
1. **Shared Components**: Komponent SettingsHeader musi być reusable dla wszystkich settings pages
2. **Color System**: Wszystkie kolory z `lib/constants/app-colors.ts` (nie inline hex values)
3. **Responsive Breakpoints**: sm (<640px), md (640-768px), lg (768-1024px), xl (1024px+)
4. **Touch Targets**: Min 44px height dla mobile (zgodność z WCAG AA)
5. **No Horizontal Scroll**: Wszystkie widoki muszą zmieścić się w viewport (no overflow-x)
6. **Consistency with Planning**: Wszystkie komponenty muszą matchować PlanningHeader, PlanningStatsCard, PurchaseOrdersTable

### Referenced Components (Dependencies)
- **Planning Module (Epic 3)**:
  - `PlanningHeader.tsx` - wzór dla SettingsHeader
  - `PlanningStatsCard.tsx` - wzór dla SettingsStatsCards
  - `PurchaseOrdersTable.tsx` - wzór dla SettingsTable
  - `planning-colors.ts` - do refactor → app-colors.ts
- **Technical Module (Epic 2)**:
  - `TechnicalHeader.tsx` - cross-module header pattern
  - DataTable base component (if exists)
- **Shared System**:
  - `docs/ux-design/ux-design-shared-system.md` - design tokens, breakpoints
  - `docs/ux-design/ux-design-settings-module.md` - settings-specific UX

### Cache Dependencies & Events
```typescript
// Batch 1E uses cache from existing Batches 1A-1D
const CACHE_KEYS = {
  settingsStats: 'settings-stats:{org_id}',      // TTL 5 min
  users: 'users:{org_id}',                       // TTL 5 min
  warehouses: 'warehouses:{org_id}',             // TTL 5 min
  locations: 'locations:{org_id}',               // TTL 5 min
  machines: 'machines:{org_id}',                 // TTL 5 min
  productionLines: 'production-lines:{org_id}',  // TTL 5 min
  allergens: 'allergens:{org_id}',               // TTL 10 min
  taxCodes: 'tax-codes:{org_id}',                // TTL 10 min
}

// Cache invalidation events
'user.created' → Invalidate users list + settings stats
'warehouse.created' → Invalidate warehouses list + settings stats
'location.created' → Invalidate locations list + settings stats
```

## Detailed Design

### Services and Modules

| Service/Module | Responsibilities | Inputs | Outputs | Owner |
|----------------|------------------|--------|---------|-------|
| **SettingsStatsService** | Aggregate stats from all settings entities | org_id | Stats object (users count, locations count, etc.) | API |
| **SettingsHeaderService** | Render header with active tab | currentPage | Header JSX with navigation | Component |
| **SettingsTableService** | Generic table with sort/filter/search | data[], columns[], filters[] | Table JSX with pagination | Component |
| **ResponsiveViewService** | Detect screen size, toggle table/card view | breakpoint | View mode (table or card) | Hook |

### Data Models and Contracts

#### Settings Stats API Response
```typescript
interface SettingsStats {
  users: {
    total: number              // Total users count
    active: number             // is_active = true
    pending: number            // Pending invitations
    lastActivity: string       // Last login timestamp (relative, e.g., "2h ago")
  }
  locations: {
    warehouses: number         // Count of warehouses
    locations: number          // Count of locations
    machines: number           // Count of machines
    productionLines: number    // Count of production lines
  }
  configuration: {
    allergens: number          // Count of allergens
    taxCodes: number           // Count of tax codes
    productTypes: number       // Count of distinct product types (from products table)
    activeModules: string      // Format: "6/8" (6 active out of 8 total)
  }
  system: {
    wizardProgress: number     // Wizard completion % (0-100)
    lastUpdated: string        // Last settings update timestamp (relative)
    organizationName: string   // From organizations table
    subscription: string       // Plan name (e.g., "Pro", "Enterprise")
  }
}
```

#### SettingsHeader Props
```typescript
interface SettingsHeaderProps {
  currentPage: 'dashboard' | 'organization' | 'users' | 'warehouses' |
               'locations' | 'machines' | 'lines' | 'allergens' |
               'tax-codes' | 'modules' | 'wizard'
}

// Renders navigation tabs with active state
// Tabs wrap to second row if needed on smaller screens
// Settings button (⚙️) on right side (outline style)
```

#### SettingsTable Props
```typescript
interface SettingsTableProps<T> {
  data: T[]                           // Array of rows
  columns: ColumnDef<T>[]             // Column definitions
  actions?: ActionDef<T>[]            // Row actions (View, Edit, Delete)
  filters?: FilterDef[]               // Filter definitions
  searchable?: boolean                // Show search input (default true)
  pageSize?: number                   // Items per page (default 20)
  emptyMessage?: string               // Custom empty state message
  onCreate?: () => void               // "Create" button callback
  createLabel?: string                // "Create" button label
}

interface ColumnDef<T> {
  key: keyof T                        // Data field
  label: string                       // Column header
  sortable?: boolean                  // Enable sorting (default false)
  render?: (value: any, row: T) => ReactNode  // Custom render function
}

interface ActionDef<T> {
  label: string                       // Action label
  icon: LucideIcon                    // Icon component
  onClick: (row: T) => void           // Callback
  color?: string                      // Tailwind color (default gray-600)
}

interface FilterDef {
  label: string                       // Filter label
  key: string                         // Data field to filter
  options: string[]                   // Filter options
}
```

#### Mobile Card View (responsive < 768px)
```typescript
interface MobileCardProps<T> {
  row: T                              // Row data
  primaryField: keyof T               // Primary info to display (e.g., "name")
  statusField: keyof T                // Status badge field
  expandable: boolean                 // Show expand button (default true)
  actions: ActionDef<T>[]             // Row actions (visible when expanded)
}

// Card shows: Primary info + Status + expand button (>)
// Tap to expand shows all fields + action buttons
// Smooth animation (200ms) on expand/collapse
```

### APIs and Interfaces

#### REST Endpoints

**Settings Stats (NEW)**
```typescript
GET    /api/settings/stats
  Query: {}
  Response: SettingsStats
  Auth: Admin, Manager
  Cache: 5 min TTL

  // Aggregates data from:
  // - users table (total, active, pending invitations)
  // - warehouses, locations, machines, production_lines tables (counts)
  // - allergens, tax_codes tables (counts)
  // - products table (distinct types count)
  // - organizations table (name, subscription)
  // - settings_wizard_progress table (wizard completion %)

  Example Response:
  {
    "users": { "total": 12, "active": 10, "pending": 2, "lastActivity": "2h ago" },
    "locations": { "warehouses": 3, "locations": 25, "machines": 8, "productionLines": 4 },
    "configuration": { "allergens": 14, "taxCodes": 8, "productTypes": 4, "activeModules": "6/8" },
    "system": { "wizardProgress": 80, "lastUpdated": "Today", "organizationName": "Acme Corp", "subscription": "Pro" }
  }
```

**Existing Endpoints (No changes, reused by tables)**
```typescript
GET    /api/settings/users              // Users table data
GET    /api/settings/warehouses         // Warehouses table data
GET    /api/settings/locations          // Locations table data
GET    /api/settings/machines           // Machines table data
GET    /api/settings/production-lines   // Production lines table data
GET    /api/settings/allergens          // Allergens table data
GET    /api/settings/tax-codes          // Tax codes table data
```

### User Interface Components

#### 1. SettingsHeader Component

**File:** `apps/frontend/components/settings/SettingsHeader.tsx`

**Structure:**
```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Logo   Settings│Org│Users│WH│Loc│Machines│Lines│Allergens│Tax│Modules│Wizard     │ (60px)
├───────────────────────────────────────────────────────────────────────────────────┤
│ [Breadcrumb: Settings > Current Page]                    [+ Create] btn           │ (40px)
└───────────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- All tabs visible (no dropdown) - wrap to second row if needed
- Active tab: green-600 bottom border
- Inactive tabs: gray-600 text, hover → gray-900
- Compact height: 60px
- Consistent padding: px-6

**Mobile (<768px):**
```
┌─────────────────────────────────────┐
│ Logo        Settings        ☰      │  (60px)
└─────────────────────────────────────┘
```
- Hamburger menu (right side)
- Tap → full-screen navigation overlay
- Current page highlighted

---

#### 2. SettingsStatsCards Component

**File:** `apps/frontend/components/settings/SettingsStatsCards.tsx`

**Layout:**
```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ USERS            │ │ LOCATIONS        │ │ CONFIGURATION    │ │ SYSTEM           │
│ ┌──────┬───────┐ │ │ ┌──────┬───────┐ │ │ ┌──────┬───────┐ │ │ ┌──────┬───────┐ │
│ │Total │Active │ │ │ │WH    │Loc    │ │ │ │Allerg│Tax    │ │ │ │Wizard│Updated│ │
│ │  12  │  10   │ │ │ │  3   │  25   │ │ │ │  14  │  8    │ │ │ │ 80%  │ Today │ │
│ ├──────┼───────┤ │ │ ├──────┼───────┤ │ │ ├──────┼───────┤ │ │ ├──────┼───────┤ │
│ │Pend  │Last   │ │ │ │Mach  │Lines  │ │ │ │Types │Modules│ │ │ │Org   │Plan   │ │
│ │  2   │ 2h ago│ │ │ │  8   │  4    │ │ │ │  4   │  6/8  │ │ │ │Acme  │Pro    │ │
│ └──────┴───────┘ │ │ └──────┴───────┘ │ │ └──────┴───────┘ │ │ └──────┴───────┘ │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
     (120px)             (120px)             (120px)             (120px)
```

**Features:**
- Max height: 120px per card
- 2×2 grid per card (4 metrics)
- Clickable → navigate to respective section
- Hover: shadow + slight scale
- Loading skeleton while fetching

**Responsive:**
- Desktop (lg): 4 cards in 1 row
- Tablet (md): 2 cards per row
- Mobile (sm): 1 card per row (stacked)

---

#### 3. SettingsTable Component

**File:** `apps/frontend/components/settings/SettingsTable.tsx`

**Structure:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Search: 🔍 Search users...]  [Filter: Status ▼]  [+ Create User]      │
├─────────────────────────────────────────────────────────────────────────┤
│ Name ↕     │ Email              │ Role      │ Status   │ Actions       │
├─────────────────────────────────────────────────────────────────────────┤
│ John Doe   │ john@example.com   │ Admin     │ 🟢Active │ 👁️ ✏️ 🗑️      │
│ Jane Smith │ jane@example.com   │ Planner   │ 🟡Pending│ 👁️ ✏️ 🗑️      │
│ Bob Wilson │ bob@example.com    │ Operator  │ ⚫Inactive│ 👁️ ✏️ 🗑️      │
├─────────────────────────────────────────────────────────────────────────┤
│                    < 1 2 3 ... 10 >  (20 per page)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Sortable headers (click to sort ascending/descending)
- Search input (fuzzy search on primary columns)
- Filter dropdowns (by status, type, etc.)
- Pagination: 20 items per page
- Row hover: subtle gray background
- Action buttons: View (gray-600), Edit (gray-600), Delete (red-600)
- Alternating row colors

**Mobile (<768px) - Card View:**
```
┌─────────────────────────────────────┐
│ John Doe                   🟢Active │
│ Admin                         ▼     │
├─────────────────────────────────────┤
│ Email: john@example.com             │
│ Role: Administrator                 │
│ Created: 2025-01-15                 │
│ [View] [Edit] [Delete]              │
└─────────────────────────────────────┘
```

---

#### 4. SettingsMobileNav Component

**File:** `apps/frontend/components/settings/SettingsMobileNav.tsx`

**Overlay (full-screen):**
```
┌─────────────────────────────────────┐
│                              ✕      │
│                                     │
│   Settings Dashboard                │
│   ─────────────────                 │
│   Organization                      │
│   Users                    ●        │ ← Active page indicator
│   Warehouses                        │
│   Locations                         │
│   Machines                          │
│   Production Lines                  │
│   Allergens                         │
│   Tax Codes                         │
│   Modules                           │
│   Wizard                            │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Full-screen overlay (z-index: 50)
- Backdrop blur
- Smooth slide-in animation (200ms)
- Tap anywhere outside → close
- Close button (✕) top-right
- Current page highlighted (● indicator)

---

### Color System Refactor

#### Create Shared app-colors.ts

**File:** `apps/frontend/lib/constants/app-colors.ts`

```typescript
// Shared across ALL modules (Settings, Planning, Technical, Production, etc.)
export const APP_COLORS = {
  // Primary actions
  CREATE_BUTTON: 'green-600',        // Create buttons
  PRIMARY_CTA: 'green-600',          // Call-to-action

  // Secondary actions
  VIEW_BUTTON: 'gray-600',           // View buttons
  EDIT_BUTTON: 'gray-600',           // Edit buttons
  CANCEL_BUTTON: 'gray-400',         // Cancel buttons

  // Danger actions
  DELETE_BUTTON: 'red-600',          // Delete buttons
  DANGER_CTA: 'red-600',             // Destructive actions

  // Status badges
  STATUS_ACTIVE: 'green-600',        // Active/Enabled
  STATUS_INACTIVE: 'gray-400',       // Inactive/Disabled
  STATUS_PENDING: 'yellow-500',      // Pending/Draft
  STATUS_ERROR: 'red-600',           // Error/Failed
  STATUS_SUCCESS: 'green-500',       // Success/Completed
  STATUS_WARNING: 'amber-500',       // Warning

  // Backgrounds
  STATUS_ACTIVE_BG: 'green-200',     // Active badge background
  STATUS_PENDING_BG: 'yellow-200',   // Pending badge background
  STATUS_INACTIVE_BG: 'gray-200',    // Inactive badge background
  STATUS_ERROR_BG: 'red-200',        // Error badge background

  // Text colors
  STATUS_ACTIVE_TEXT: 'green-800',   // Active badge text
  STATUS_PENDING_TEXT: 'yellow-800', // Pending badge text
  STATUS_INACTIVE_TEXT: 'gray-800',  // Inactive badge text
  STATUS_ERROR_TEXT: 'red-800',      // Error badge text
} as const

export type AppColor = typeof APP_COLORS[keyof typeof APP_COLORS]
```

**Migration:**
- Refactor `planning-colors.ts` → use `app-colors.ts`
- Update all Settings tables to use `app-colors.ts`
- Update Technical module to use `app-colors.ts` (cross-module consistency)

---

### Responsive Breakpoints & Behavior

| Breakpoint | Device | Header | Stats Cards | Tables | Touch Targets |
|-----------|--------|--------|-------------|--------|---------------|
| **sm** (<640px) | Mobile phone | Hamburger menu | 1 per row (stacked) | Card view (expandable) | Min 44px |
| **md** (640-768px) | Tablet portrait | Collapsed tabs | 2 per row | Card view | Min 44px |
| **lg** (768-1024px) | Tablet landscape | Full tabs | 4 per row | Full table | Standard |
| **xl** (1024px+) | Desktop | Full tabs | 4 per row | Full table | Standard |

**Responsive Hooks:**
```typescript
// apps/frontend/lib/hooks/useResponsiveView.ts
export function useResponsiveView() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }

    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  return { isMobile, isTablet, isDesktop: !isMobile && !isTablet }
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

**Components to Test:**
- `SettingsHeader.tsx` - active tab highlighting, navigation links
- `SettingsStatsCards.tsx` - data rendering, click navigation
- `SettingsTable.tsx` - sorting, filtering, pagination
- `SettingsMobileNav.tsx` - open/close animations, active page

**Example Test:**
```typescript
// apps/frontend/__tests__/components/SettingsHeader.test.tsx
describe('SettingsHeader', () => {
  it('highlights active tab', () => {
    render(<SettingsHeader currentPage="users" />)
    expect(screen.getByText('Users')).toHaveClass('border-green-600')
  })

  it('navigates to correct page on tab click', () => {
    render(<SettingsHeader currentPage="dashboard" />)
    fireEvent.click(screen.getByText('Warehouses'))
    expect(mockPush).toHaveBeenCalledWith('/settings/warehouses')
  })
})
```

---

### E2E Tests (Playwright)

**Test Scenarios:**

**Story 1.16 - Header Navigation**
```typescript
// tests/e2e/settings-header.spec.ts
test('should navigate between settings pages via header tabs', async ({ page }) => {
  await page.goto('/settings')

  // Click Users tab
  await page.click('text=Users')
  await expect(page).toHaveURL('/settings/users')
  await expect(page.locator('[data-testid="users-tab"]')).toHaveClass(/border-green-600/)

  // Click Warehouses tab
  await page.click('text=WH')
  await expect(page).toHaveURL('/settings/warehouses')
  await expect(page.locator('[data-testid="warehouses-tab"]')).toHaveClass(/border-green-600/)
})

test('mobile: should open hamburger menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/settings')

  // Click hamburger icon
  await page.click('[data-testid="hamburger-menu"]')
  await expect(page.locator('[data-testid="mobile-nav-overlay"]')).toBeVisible()

  // Click Users in menu
  await page.click('text=Users')
  await expect(page).toHaveURL('/settings/users')
})
```

**Story 1.17 - Stats Cards**
```typescript
// tests/e2e/settings-stats.spec.ts
test('should display settings stats cards with correct data', async ({ page }) => {
  await page.goto('/settings')

  // Users card
  await expect(page.locator('[data-testid="stats-card-users"]')).toContainText('Total')
  await expect(page.locator('[data-testid="stats-card-users"]')).toContainText('Active')

  // Click Users card → navigate to users page
  await page.click('[data-testid="stats-card-users"]')
  await expect(page).toHaveURL('/settings/users')
})

test('stats cards should be responsive', async ({ page }) => {
  await page.goto('/settings')

  // Desktop: 4 cards in 1 row
  await page.setViewportSize({ width: 1280, height: 720 })
  const cardsDesktop = await page.locator('[data-testid^="stats-card-"]').count()
  expect(cardsDesktop).toBe(4)

  // Mobile: stacked cards
  await page.setViewportSize({ width: 375, height: 667 })
  const cardsMobile = await page.locator('[data-testid^="stats-card-"]').count()
  expect(cardsMobile).toBe(4)
})
```

**Story 1.18 - Tables Consistency**
```typescript
// tests/e2e/settings-tables.spec.ts
test('should sort users table by name', async ({ page }) => {
  await page.goto('/settings/users')

  // Click Name column header to sort ascending
  await page.click('[data-testid="column-header-name"]')
  const firstRow = await page.locator('tbody tr:first-child td:first-child').textContent()
  expect(firstRow).toBeTruthy()

  // Click again to sort descending
  await page.click('[data-testid="column-header-name"]')
  const firstRowDesc = await page.locator('tbody tr:first-child td:first-child').textContent()
  expect(firstRowDesc).not.toBe(firstRow)
})

test('should filter users by status', async ({ page }) => {
  await page.goto('/settings/users')

  // Select "Active" from status filter
  await page.selectOption('[data-testid="filter-status"]', 'Active')

  // All rows should show Active status
  const statusBadges = await page.locator('[data-testid="status-badge"]').allTextContents()
  statusBadges.forEach(status => expect(status).toContain('Active'))
})

test('should paginate users table', async ({ page }) => {
  await page.goto('/settings/users')

  // Check pagination controls
  await expect(page.locator('[data-testid="pagination"]')).toBeVisible()

  // Click page 2
  await page.click('[data-testid="page-2"]')
  await expect(page.locator('[data-testid="active-page"]')).toHaveText('2')
})
```

**Story 1.19 - Mobile Responsive**
```typescript
// tests/e2e/settings-mobile.spec.ts
test('mobile: table should convert to card view', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/settings/users')

  // Table should not be visible
  await expect(page.locator('table')).not.toBeVisible()

  // Card view should be visible
  await expect(page.locator('[data-testid="card-view"]')).toBeVisible()

  // Expand first card
  await page.click('[data-testid="card-0"] [data-testid="expand-button"]')
  await expect(page.locator('[data-testid="card-0-expanded"]')).toBeVisible()
})

test('mobile: no horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/settings/users')

  // Check no horizontal overflow
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBe(clientWidth)
})

test('mobile: touch targets are 44px minimum', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/settings/users')

  // Check Create button height
  const createButton = await page.locator('[data-testid="create-button"]')
  const height = await createButton.evaluate(el => el.getBoundingClientRect().height)
  expect(height).toBeGreaterThanOrEqual(44)
})
```

---

## Implementation Roadmap

### Story Breakdown

| Story ID | Title | Story Points | Effort (days) | Dependencies | Priority |
|----------|-------|--------------|---------------|--------------|----------|
| **1.16** | Settings Header Layout | 3 | 0.5 | None | P1 (High) |
| **1.17** | Settings Stats Cards | 2 | 0.5 | 1.16 (header first) | P1 (Medium) |
| **1.18** | Settings Tables Consistency | 3 | 1.0 | 1.16 (header first) | P1 (High) |
| **1.19** | Settings Mobile Responsive | 3 | 1.0 | 1.16, 1.18 (desktop first) | P1 (High) |
| **TOTAL** | | **11** | **3 days** | | |

### Implementation Order

**Phase 1: Header & Infrastructure (Day 1)**
- Story 1.16: Create SettingsHeader component
  - Implement navigation tabs (all visible, no dropdown)
  - Add breadcrumb navigation
  - Apply to all settings pages
  - Test responsive (tabs wrap on small screens)

**Phase 2: Stats & Tables (Day 2)**
- Story 1.17: Create SettingsStatsCards component
  - Implement `/api/settings/stats` endpoint
  - 4 cards with 2×2 grid layout
  - Add to settings dashboard
  - Test responsive (4→2→1 cards per row)

- Story 1.18: Standardize Settings Tables
  - Create SettingsTable base component
  - Refactor planning-colors.ts → app-colors.ts
  - Update all settings tables (Users, Warehouses, Locations, Machines, Lines, Allergens, Tax)
  - Add search/filter/pagination to all tables
  - Consistent action buttons (View, Edit, Delete)

**Phase 3: Mobile Responsive (Day 3)**
- Story 1.19: Mobile Responsive Design
  - Create SettingsMobileNav component (hamburger menu)
  - Create SettingsCardView component (table→card conversion)
  - Implement useResponsiveView hook
  - Test all pages on mobile (no horizontal scroll)
  - Ensure 44px touch targets
  - Test on iOS Safari, Android Chrome

---

### Files to Create/Modify

**New Files:**
```
apps/frontend/
├── components/settings/
│   ├── SettingsHeader.tsx (NEW)
│   ├── SettingsStatsCards.tsx (NEW)
│   ├── SettingsTable.tsx (NEW)
│   ├── SettingsTableActions.tsx (NEW)
│   ├── SettingsMobileNav.tsx (NEW)
│   └── SettingsCardView.tsx (NEW)
├── lib/constants/
│   └── app-colors.ts (NEW - refactor from planning-colors.ts)
├── lib/hooks/
│   └── useResponsiveView.ts (NEW or reuse from planning)
└── app/api/settings/
    └── stats/route.ts (NEW)
```

**Modified Files:**
```
apps/frontend/app/(authenticated)/settings/
├── page.tsx (UPDATE - add header + stats cards)
├── organization/page.tsx (UPDATE - use SettingsHeader)
├── users/page.tsx (UPDATE - use SettingsHeader + SettingsTable)
├── warehouses/page.tsx (UPDATE - use SettingsHeader + SettingsTable)
├── locations/page.tsx (UPDATE - use SettingsHeader + SettingsTable)
├── machines/page.tsx (UPDATE - use SettingsHeader + SettingsTable)
├── production-lines/page.tsx (UPDATE - use SettingsHeader + SettingsTable)
├── allergens/page.tsx (UPDATE - use SettingsHeader + SettingsTable)
├── tax-codes/page.tsx (UPDATE - use SettingsHeader + SettingsTable)
├── modules/page.tsx (UPDATE - use SettingsHeader)
└── wizard/page.tsx (UPDATE - use SettingsHeader)
```

**Cross-Module Refactor:**
```
apps/frontend/
├── components/planning/
│   ├── PlanningHeader.tsx (UPDATE - use app-colors.ts)
│   ├── PlanningStatsCard.tsx (UPDATE - use app-colors.ts)
│   └── PurchaseOrdersTable.tsx (UPDATE - use app-colors.ts)
├── components/technical/
│   └── TechnicalHeader.tsx (UPDATE - use app-colors.ts)
└── lib/constants/
    └── planning-colors.ts (DELETE - replaced by app-colors.ts)
```

---

## Success Criteria

### Definition of Done

✅ **Story 1.16 (Header Layout)**
- [ ] SettingsHeader component created and reusable
- [ ] All 11 tabs visible (Settings│Org│Users│WH│Loc│Machines│Lines│Allergens│Tax│Modules│Wizard)
- [ ] Active tab highlighted with green-600 bottom border
- [ ] Header applied to all settings pages
- [ ] Breadcrumbs show on sub-pages
- [ ] Tabs wrap to second row on smaller screens (no horizontal scroll)

✅ **Story 1.17 (Stats Cards)**
- [ ] `/api/settings/stats` endpoint returns correct data
- [ ] 4 stats cards rendered on dashboard
- [ ] Each card shows 2×2 grid (4 metrics)
- [ ] Cards clickable → navigate to respective section
- [ ] Loading skeleton while fetching
- [ ] Responsive: 4→2→1 cards per row (lg→md→sm)

✅ **Story 1.18 (Tables Consistency)**
- [ ] SettingsTable base component created
- [ ] app-colors.ts created and used across all modules
- [ ] All settings tables use SettingsTable component
- [ ] Sortable headers work on all tables
- [ ] Search/filter/pagination work on all tables
- [ ] Action buttons consistent: View (gray-600), Edit (gray-600), Delete (red-600)
- [ ] Status badges use app-colors.ts (Active green-600, Inactive gray-400, etc.)
- [ ] Empty states show friendly message + "Create first [resource]" CTA

✅ **Story 1.19 (Mobile Responsive)**
- [ ] Hamburger menu on mobile (<768px)
- [ ] SettingsMobileNav overlay works (open/close, active page highlight)
- [ ] All tables convert to card view on mobile
- [ ] Card view expandable (tap to show all fields)
- [ ] No horizontal scroll on any page
- [ ] Touch targets min 44px height
- [ ] Forms stack vertically on mobile (single column)
- [ ] Tested on iOS Safari and Android Chrome

---

### Acceptance Criteria (Cross-Story)

**Visual Consistency:**
- [ ] All settings pages use identical header (60px height, green-600 active tab)
- [ ] All create buttons use green-600 color
- [ ] All view/edit buttons use gray-600 color
- [ ] All delete buttons use red-600 color
- [ ] All status badges match app-colors.ts (no custom hex values)

**Functional Consistency:**
- [ ] All tables sortable by primary columns (Name, Code, etc.)
- [ ] All tables searchable (fuzzy search on primary columns)
- [ ] All tables filterable (by Status, Type, etc.)
- [ ] All tables paginated (20 items per page)
- [ ] All tables have empty states with "Create first [resource]" CTA

**Responsive Consistency:**
- [ ] Header collapses to hamburger menu on mobile (<768px)
- [ ] Stats cards stack on mobile (1 per row)
- [ ] Tables convert to card view on mobile (<768px)
- [ ] No horizontal scroll on any page (all breakpoints)
- [ ] Touch targets min 44px on mobile

**Performance:**
- [ ] Stats API responds in <500ms
- [ ] Table sorting/filtering instant (<100ms)
- [ ] Mobile menu animations smooth (200ms)
- [ ] Card expand/collapse animations smooth (200ms)

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Refactor planning-colors.ts breaks Planning module** | High | Medium | Test Planning module E2E after refactor, use search/replace carefully |
| **Mobile card view complex for tables with many columns** | Medium | High | Prioritize primary fields, hide less important fields unless expanded |
| **Stats API slow if org has 1000+ entities** | Medium | Low | Add pagination to entity counts, cache stats for 5 min |
| **Cross-module color inconsistency after refactor** | Low | Medium | Use TypeScript types for app-colors.ts, enforce via linter |
| **Touch targets <44px on mobile** | High | Medium | Audit all buttons/links, add min-height utility class |

---

## Appendix

### Related Documentation
- [Shared UI Design System](../../ux-design/ux-design-shared-system.md) - Design tokens, breakpoints, component patterns
- [Settings Module UX Design](../../ux-design/ux-design-settings-module.md) - Settings-specific UX flows
- [Planning Module Stories](../03B-tech-spec.md) - Reference for PlanningHeader, PlanningStatsCard
- [Story 1.16 - Settings Header Layout](./stories/1.16-settings-header-layout.md)
- [Story 1.17 - Settings Stats Cards](./stories/1.17-settings-stats-cards.md)
- [Story 1.18 - Settings Tables Consistency](./stories/1.18-settings-tables-consistency.md)
- [Story 1.19 - Settings Mobile Responsive](./stories/1.19-settings-mobile-responsive.md)

### Design Tokens Reference

**Colors (from app-colors.ts):**
- Primary: green-600 (#16a34a)
- Secondary: gray-600 (#4b5563)
- Danger: red-600 (#dc2626)
- Active: green-600, Inactive: gray-400, Pending: yellow-500, Error: red-600

**Typography:**
- h1: text-3xl (30px) - Page titles
- h2: text-2xl (24px) - Section headers
- h3: text-xl (20px) - Card titles
- h4: text-lg (18px) - Metric values
- p: text-base (16px) - Body text
- sm: text-sm (14px) - Labels, tab navigation
- xs: text-xs (12px) - Hints, stat labels

**Spacing:**
- Page padding: px-6 py-6 (24px)
- Card padding: p-4 (16px)
- Button padding: px-4 py-2 (8px vertical, 16px horizontal)
- Gap between sections: gap-6 (24px)
- Gap between items: gap-4 (16px)

**Responsive Breakpoints:**
- sm: 640px (mobile)
- md: 768px (tablet)
- lg: 1024px (desktop)
- xl: 1280px (large desktop)

---

**End of Technical Specification**
