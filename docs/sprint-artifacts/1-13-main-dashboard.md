# Story 1.13: Main Dashboard

Status: ready-for-dev

## Story

As a **User**,
I want to see a main dashboard after login,
so that I can quickly access key information and navigate to different modules.

## Acceptance Criteria

### FR-SET-012: Main Dashboard

**AC-012.1**: Dashboard layout and navigation:
- Main dashboard at `/dashboard` (default landing page after login)
- Top navigation bar with: MonoPilot logo, module links, user menu
- Sidebar navigation (collapsible) with module icons
- Active modules only (based on Story 1.11 Module Activation)
- Responsive layout (desktop: sidebar + content, mobile: bottom nav)

**AC-012.2**: Module overview cards:
- Grid of cards (2-4 columns depending on viewport)
- Each enabled module shows:
  - Module icon and name
  - Quick stats (e.g., "5 Active WOs", "12 Pending POs")
  - Primary action button (e.g., "Create WO", "View Stock")
  - "View Details" link → module dashboard
- Modules: Settings, Technical, Planning, Production, Warehouse, Quality, Shipping, NPD
- Disabled modules not shown (hidden via Story 1.11)

**AC-012.3**: Recent activity feed:
- Right sidebar (or bottom section on mobile)
- Shows last 10 activities across all modules:
  - "WO-2024-001 started by John Doe" (2 minutes ago)
  - "PO-2024-042 approved by Admin" (15 minutes ago)
  - "LP-00123 received at WH-01" (1 hour ago)
- Activity types: WO status change, PO approval, LP received, NCR created, etc.
- Click activity → navigate to relevant entity
- Real-time updates via Supabase Realtime (optional for MVP)

**AC-012.4**: Quick actions toolbar:
- Prominent "Create" button with dropdown:
  - Create Purchase Order (if Planning enabled)
  - Create Work Order (if Production enabled)
  - Create NCR (if Quality enabled)
  - Create Transfer Order (if Warehouse enabled)
- Search bar (global search across all entities):
  - Search by: WO number, PO number, LP barcode, product code, supplier name
  - Returns results grouped by entity type
  - Click result → navigate to detail page
- Notifications bell icon (future: alerts for overdue WOs, stock low, etc.)

**AC-012.5**: Personalization (optional for MVP):
- User can reorder module cards (drag-and-drop)
- User can pin favorite modules to top
- User can hide/show activity feed
- Preferences saved per user in `user_preferences` table

**AC-012.6**: UX/UI requirements:
- Clean, modern design with ample whitespace
- Module cards with hover effects (slight elevation)
- Color-coded module icons (Settings: gray, Planning: blue, Production: green, etc.)
- Loading states for async data (skeleton cards)
- Empty state if no modules enabled: "Enable modules in Settings"
- Responsive grid: 4 cols (xl), 3 cols (lg), 2 cols (md), 1 col (sm)

**Additional Acceptance Criteria:**

**Given** a user logs in for the first time (new org)
**When** they land on the dashboard
**Then** they see a welcome message: "Welcome to MonoPilot! Let's set up your organization."
**And** a "Start Setup Wizard" button → launches Story 1.12 wizard

**Given** a user has Admin role
**When** they view the dashboard
**Then** they see additional quick actions: "Invite User", "Configure Settings"

**Given** no modules are enabled
**When** user views dashboard
**Then** they see empty state with "Enable modules in Settings" CTA

## Tasks / Subtasks

### Task 1: Database Schema for Activity Feed (AC: 012.3)
- [ ] Create `activity_logs` table migration:
  - [ ] id (UUID PK)
  - [ ] org_id (UUID, FK to organizations)
  - [ ] user_id (UUID, FK to users) - who performed the action
  - [ ] activity_type (enum: wo_status_change, po_approved, lp_received, ncr_created, etc.)
  - [ ] entity_type (enum: work_order, purchase_order, license_plate, ncr, etc.)
  - [ ] entity_id (UUID) - polymorphic reference
  - [ ] entity_code (TEXT) - display code (e.g., "WO-2024-001")
  - [ ] description (TEXT) - human-readable message
  - [ ] metadata (JSONB) - additional context
  - [ ] created_at (TIMESTAMP)
- [ ] Create indexes: (org_id, created_at DESC), (entity_type, entity_id)
- [ ] Add RLS policy: users can only see activities from their org

### Task 2: Database Schema for User Preferences (AC: 012.5 - optional)
- [ ] Create `user_preferences` table migration (or JSONB column in users table):
  - [ ] user_id (UUID PK, FK to users)
  - [ ] dashboard_config (JSONB):
    - [ ] module_order: array of module IDs
    - [ ] pinned_modules: array of module IDs
    - [ ] show_activity_feed: boolean
  - [ ] updated_at (TIMESTAMP)
- [ ] Run migration and verify schema

### Task 3: API Endpoints (AC: 012.2, 012.3, 012.4)
- [ ] Implement GET /api/dashboard/overview:
  - [ ] Returns module stats (active WOs, pending POs, stock alerts, etc.)
  - [ ] Query each module's table for counts
  - [ ] Filter by enabled modules (from organizations.modules_enabled)
  - [ ] Cache results (Redis, 5 min TTL)
  - [ ] Response: { modules: [{ name, icon, stats, primaryAction }] }
- [ ] Implement GET /api/dashboard/activity:
  - [ ] Fetch last 10 activities from activity_logs table
  - [ ] Filter by org_id (from JWT)
  - [ ] Order by created_at DESC
  - [ ] Include user name (JOIN users table)
  - [ ] Response: [{ id, type, description, user, createdAt, entityLink }]
- [ ] Implement GET /api/dashboard/search?q={query}:
  - [ ] Search across: work_orders, purchase_orders, license_plates, products, suppliers
  - [ ] Use PostgreSQL full-text search (tsquery) or ILIKE for MVP
  - [ ] Limit 20 results, grouped by entity type
  - [ ] Response: { workOrders: [], purchaseOrders: [], licensePlates: [], products: [] }
- [ ] Implement PUT /api/dashboard/preferences (optional):
  - [ ] Update user_preferences.dashboard_config
  - [ ] Validate with Zod schema

### Task 4: Activity Logging Utility (AC: 012.3)
- [ ] Create `lib/activity/log-activity.ts` utility:
  - [ ] `logActivity(userId, type, entityType, entityId, entityCode, description, metadata?)`
  - [ ] Inserts row into activity_logs table
  - [ ] Called from other modules when key events occur
- [ ] Integrate into existing modules:
  - [ ] Planning: log PO approval, WO creation
  - [ ] Production: log WO start, WO completion, yield entry
  - [ ] Warehouse: log LP received, stock move
  - [ ] Quality: log NCR created, NCR resolved
- [ ] Add background job (optional): cleanup old activities (>90 days)

### Task 5: Frontend Dashboard Page (AC: 012.1, 012.2, 012.6)
- [ ] Create `/app/dashboard/page.tsx`:
  - [ ] Fetch data with SWR: `/api/dashboard/overview`, `/api/dashboard/activity`
  - [ ] Render DashboardLayout component
  - [ ] Top nav: logo, module links (Settings, Planning, Production, etc.)
  - [ ] Sidebar: collapsible nav with icons
  - [ ] Main content: module overview cards grid
  - [ ] Loading state: skeleton cards
  - [ ] Empty state: "Enable modules in Settings" if no modules active
- [ ] Responsive design:
  - [ ] Desktop: sidebar + content area
  - [ ] Tablet: collapsed sidebar (icon only)
  - [ ] Mobile: bottom navigation bar

### Task 6: Module Overview Cards Component (AC: 012.2, 012.6)
- [ ] Create `components/dashboard/ModuleCard.tsx`:
  - [ ] Props: { name, icon, stats, primaryAction, detailsLink }
  - [ ] Card with hover effect (elevation on hover)
  - [ ] Module icon (from lucide-react or custom SVG)
  - [ ] Module name (heading)
  - [ ] Stats display (e.g., "5 Active WOs", "12 Pending POs")
  - [ ] Primary action button (e.g., "Create WO")
  - [ ] "View Details" link (subtle, bottom-right)
- [ ] Color-coded icons:
  - [ ] Settings: gray
  - [ ] Technical: blue
  - [ ] Planning: indigo
  - [ ] Production: green
  - [ ] Warehouse: orange
  - [ ] Quality: red
  - [ ] Shipping: purple
  - [ ] NPD: pink

### Task 7: Activity Feed Component (AC: 012.3, 012.6)
- [ ] Create `components/dashboard/ActivityFeed.tsx`:
  - [ ] Fetch activities from `/api/dashboard/activity`
  - [ ] Display list of activities with:
    - [ ] Activity icon (based on type)
    - [ ] Description text (e.g., "WO-2024-001 started by John Doe")
    - [ ] Relative time (e.g., "2 minutes ago" using date-fns)
    - [ ] Click → navigate to entity detail page
  - [ ] Show "View All" link at bottom (future: activity history page)
  - [ ] Empty state: "No recent activity"
- [ ] Optional: real-time updates via Supabase Realtime:
  - [ ] Subscribe to activity_logs table inserts
  - [ ] Prepend new activities to list

### Task 8: Quick Actions Toolbar Component (AC: 012.4, 012.6)
- [ ] Create `components/dashboard/QuickActions.tsx`:
  - [ ] "Create" button with dropdown menu:
    - [ ] Dropdown items based on enabled modules
    - [ ] "Create Purchase Order" → /planning/purchase-orders/new
    - [ ] "Create Work Order" → /production/work-orders/new
    - [ ] "Create NCR" → /quality/ncr/new
    - [ ] "Create Transfer Order" → /warehouse/transfers/new
  - [ ] Global search bar:
    - [ ] Input with search icon
    - [ ] Debounced input (300ms)
    - [ ] Calls `/api/dashboard/search?q={query}`
    - [ ] Dropdown with results grouped by type
    - [ ] Click result → navigate to detail page
  - [ ] Notifications bell icon (placeholder for future):
    - [ ] Badge with count (e.g., "3")
    - [ ] Dropdown with recent notifications
    - [ ] Future: integrate with alerts system

### Task 9: Dashboard Layout Component (AC: 012.1, 012.6)
- [ ] Create `components/dashboard/DashboardLayout.tsx`:
  - [ ] Top nav bar: logo, module links, search, user menu
  - [ ] Sidebar: collapsible nav with module icons
  - [ ] Main content area: children prop
  - [ ] Footer (optional): version, support link
- [ ] Create `components/navigation/TopNav.tsx`:
  - [ ] MonoPilot logo (links to /dashboard)
  - [ ] Module links (Settings, Planning, Production, etc.)
  - [ ] User menu (from Story 1.0 - UserMenu component)
- [ ] Create `components/navigation/Sidebar.tsx`:
  - [ ] Module icons with tooltips
  - [ ] Collapse/expand toggle
  - [ ] Active state highlighting

### Task 10: Welcome Banner for New Users (AC: 012.6 - additional)
- [ ] Create `components/dashboard/WelcomeBanner.tsx`:
  - [ ] Show only if organization.setup_completed = false
  - [ ] Message: "Welcome to MonoPilot! Let's set up your organization."
  - [ ] "Start Setup Wizard" button → launches Story 1.12
  - [ ] "Skip for now" button → sets setup_completed = true
- [ ] Add setup_completed column to organizations table (migration):
  - [ ] setup_completed (BOOLEAN DEFAULT false)
  - [ ] Set to true when wizard completes (Story 1.12)

### Task 11: Personalization (OPTIONAL - AC: 012.5)
- [ ] Implement drag-and-drop for module cards:
  - [ ] Use @dnd-kit/core library
  - [ ] Reorder cards on drag
  - [ ] Save order to user_preferences
- [ ] Add "Pin" button to module cards:
  - [ ] Pinned modules appear first
  - [ ] Save to user_preferences.pinned_modules
- [ ] Add "Hide Activity Feed" toggle:
  - [ ] Toggle in settings or dashboard
  - [ ] Save to user_preferences.show_activity_feed

### Task 12: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Module card rendering (props, styles)
  - [ ] Activity feed formatting (relative time, descriptions)
  - [ ] Search utility (query parsing)
- [ ] Integration tests:
  - [ ] GET /api/dashboard/overview (returns module stats)
  - [ ] GET /api/dashboard/activity (returns last 10 activities)
  - [ ] GET /api/dashboard/search (returns search results)
  - [ ] Activity logging utility (inserts into activity_logs)
- [ ] E2E tests (Playwright):
  - [ ] Login → land on dashboard → see module cards
  - [ ] Click "Create WO" → navigate to /production/work-orders/new
  - [ ] Search for "WO-2024-001" → see result → click → navigate to detail
  - [ ] View activity feed → click activity → navigate to entity
  - [ ] New user → see welcome banner → click "Start Wizard"

### Task 13: UX Design & Documentation
- [ ] Create UX design mockups for:
  - [ ] Desktop dashboard layout (sidebar + cards grid + activity feed)
  - [ ] Mobile dashboard layout (bottom nav + cards)
  - [ ] Module card design (icon, stats, buttons)
  - [ ] Activity feed design (icons, descriptions, time)
  - [ ] Global search results dropdown
- [ ] Document in `docs/ux-design-main-dashboard.md`:
  - [ ] Layout grid (12-column)
  - [ ] Module card specifications (size, padding, hover effects)
  - [ ] Color palette for module icons
  - [ ] Typography (heading sizes, body text)
  - [ ] Responsive breakpoints
- [ ] Add to existing UX design or create new document

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Card, Button, DropdownMenu, Input, Badge)
- **Data Fetching**: SWR for data fetching/caching
- **Real-time** (optional): Supabase Realtime for activity feed
- **Drag-and-Drop** (optional): @dnd-kit/core for card reordering
- **Search**: PostgreSQL full-text search or ILIKE

### Architecture Patterns
- **Dashboard as Landing Page**: All authenticated users land on `/dashboard` after login
- **Module Stats Caching**: Cache module stats in Redis (5 min TTL) for performance
- **Activity Logging**: Centralized `logActivity()` utility called from all modules
- **Personalization**: User preferences stored in JSONB column (flexible schema)
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

### Key Technical Decisions
1. **Dashboard vs Module Dashboards**: Main dashboard = overview of all modules, Module dashboards (4.1, 7.28) = deep dive into specific module
2. **Activity Logging**: Insert into activity_logs table on key events (WO start, PO approval, etc.) - requires integration in other stories
3. **Search Strategy**: MVP uses ILIKE (simple), Phase 2 uses PostgreSQL full-text search (tsvector)
4. **Real-time Activity Feed**: Optional for MVP (polling every 30s), Supabase Realtime in Phase 2
5. **Module Stats Calculation**: Compute on-demand with caching (avoid denormalization)

### Security Considerations
- **Activity Logs RLS**: Users can only see activities from their organization
- **Module Stats**: Only show stats for enabled modules (prevent data leakage)
- **Search**: Filter results by org_id (prevent cross-tenant access)
- **Personalization**: User preferences scoped to user_id

### Project Structure

Expected file locations (Next.js App Router):
```
app/
  dashboard/
    page.tsx              # Main dashboard page
  api/
    dashboard/
      overview/
        route.ts          # GET /api/dashboard/overview
      activity/
        route.ts          # GET /api/dashboard/activity
      search/
        route.ts          # GET /api/dashboard/search
      preferences/
        route.ts          # PUT /api/dashboard/preferences

lib/
  activity/
    log-activity.ts       # Activity logging utility
  dashboard/
    get-module-stats.ts   # Calculate module stats

components/
  dashboard/
    DashboardLayout.tsx   # Main layout wrapper
    ModuleCard.tsx        # Module overview card
    ActivityFeed.tsx      # Recent activity feed
    QuickActions.tsx      # Create button + search + notifications
    WelcomeBanner.tsx     # Welcome message for new users
  navigation/
    TopNav.tsx            # Top navigation bar
    Sidebar.tsx           # Sidebar navigation

supabase/
  migrations/
    20XX_create_activity_logs.sql     # Activity logs table
    20XX_add_setup_completed.sql      # Add setup_completed to organizations
    20XX_create_user_preferences.sql  # User preferences table (optional)
```

### Testing Strategy

**Unit Tests** (Vitest):
- Module card component (rendering, props)
- Activity feed component (formatting, relative time)
- Search utility (query parsing, result grouping)

**Integration Tests** (Vitest + Supabase Test Client):
- Dashboard API endpoints (overview, activity, search)
- Activity logging utility (inserts into activity_logs)
- Module stats calculation (aggregates from multiple tables)

**E2E Tests** (Playwright):
- Complete dashboard flow (login → dashboard → navigate to modules)
- Quick actions (create WO, search, view activity)
- Welcome banner for new users
- Responsive design (desktop, tablet, mobile)

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.11] (Module Activation)
- [Source: docs/epics/epic-1-settings.md#Story-1.12] (Settings Wizard - welcome flow)
- [Source: docs/epics/epic-4-production.md#Story-4.1] (Production Dashboard - module-specific)
- [Source: docs/epics/epic-7-shipping.md#Story-7.28] (Shipping Dashboard - module-specific)
- [Source: docs/architecture/patterns/frontend.md] (SWR, component patterns)

### Prerequisites

**Story 1.0** (Authentication UI - login/logout flow)
**Story 1.11** (Module Activation - filter enabled modules)

### Dependencies

**External Services:**
- Supabase (Database, Realtime - optional)
- Upstash Redis (caching module stats)

**Libraries:**
- react-hook-form (forms)
- swr (data fetching)
- @supabase/supabase-js (Supabase client)
- shadcn/ui (UI components: Card, Button, DropdownMenu, Input, Badge)
- lucide-react (icons for modules, activities)
- date-fns (relative time formatting)
- @dnd-kit/core (drag-and-drop - optional)

### Integration with Other Stories

**Activity Logging Integration** (requires updates to other stories):
- Story 3.X (Planning module): log PO approval, WO creation
- Story 4.X (Production module): log WO start, WO completion, yield entry
- Story 5.X (Warehouse module): log LP received, stock move
- Story 6.X (Quality module): log NCR created, NCR resolved

**Future Enhancement: Notifications System**
- Phase 2: add notifications table (alerts for overdue WOs, low stock)
- Integrate with notifications bell in QuickActions component

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-13-main-dashboard.context.xml) - Generated 2025-11-20

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story completion -->

### File List

<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log

- 2025-11-20: Story created by Mariusz (missing main dashboard/landing page in Epic 1)
