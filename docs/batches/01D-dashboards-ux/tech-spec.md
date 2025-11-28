# Tech Spec: Batch 01D - Dashboards & UX (Epic 1 Settings)

**Epic:** 1 - Foundation & Settings
**Batch:** 01D - Dashboards & UX
**Status:** Ready for Development
**Created:** 2025-11-27
**Version:** 1.0

---

## 1. Batch Overview

### Purpose

Batch 01D completes Epic 1 by implementing the final user-facing components: the Settings Wizard UX, Main Dashboard, Settings Dashboard, and Epic 1 polish/cleanup. This batch transforms Epic 1 from a collection of CRUD pages into a cohesive, user-friendly system with guided onboarding and intuitive navigation.

### Stories in Batch

| Story ID | Story Title | Story Points | Priority | Status |
|----------|-------------|--------------|----------|--------|
| **1.12** | Settings Wizard (UX Design) | 13 | P0 | ready-for-dev |
| **1.13** | Main Dashboard | 8 | P0 | review |
| **1.14** | Epic 1 - Polish & Cleanup | 5 | P1 | ready-for-dev |
| **1.15** | Settings Dashboard Landing Page | 3 | P0 | in-progress |

**Total Story Points:** 29 (~116 hours @ 4 hours per point)

### Batch Goals

1. **Guided Onboarding:** Implement 6-step wizard that reduces setup time from 4 hours to 10 minutes (96% reduction)
2. **Unified Navigation:** Create Settings Dashboard as entry point for all configuration options
3. **Activity Visibility:** Provide Main Dashboard with module overview cards and real-time activity feed
4. **Quality Assurance:** Complete all deferred tasks (E2E tests, invitations UI, Redis cache, machine detail page)

### Success Criteria

- ✅ New admin can complete organization setup via wizard in <15 minutes
- ✅ Main Dashboard provides quick access to all enabled modules
- ✅ Settings Dashboard shows all 10 configuration sections in organized grid
- ✅ All Epic 1 acceptance criteria fully satisfied (no partial implementations)
- ✅ Test coverage >80% for critical user flows

---

## 2. UI Components

### 2.1 Settings Wizard Components

**File:** `apps/frontend/app/onboarding/wizard/page.tsx`

**Components:**

#### SetupWizard (Main Component)
```typescript
interface SetupWizardProps {
  initialProgress?: WizardProgress  // Resume from saved state
}

interface WizardProgress {
  step: number                      // Current step (1-6)
  data: Partial<WizardData>         // Saved form data
}

interface WizardData {
  organization: {
    company_name: string
    logo?: File
    address: string
    city: string
    postal_code: string
    country: string
  }
  regional: {
    timezone: string
    currency: string
    language: string
    date_format: string
    number_format: string
  }
  warehouse: {
    code: string
    name: string
    address?: string
  }
  locations: {
    receiving: { code: string, name: string }
    shipping: { code: string, name: string }
    transit: { code: string, name: string }
    production: { code: string, name: string }
  }
  modules: string[]                 // Array of enabled module codes
  users: Array<{
    email: string
    first_name: string
    last_name: string
    role: UserRole
  }>
}
```

**Step Components:**

1. **Step1OrganizationBasics.tsx**
   - Fields: company_name, logo (upload), address, city, postal_code, country
   - Validation: company_name required (min 2 chars), logo max 2MB

2. **Step2RegionalSettings.tsx**
   - Fields: timezone, currency, language, date_format, number_format
   - Dropdowns with defaults: UTC, USD, EN, MM/DD/YYYY, 1,000.00

3. **Step3FirstWarehouse.tsx**
   - Fields: code, name, address
   - Creates warehouse with defaults = NULL (circular dependency resolution)

4. **Step4KeyLocations.tsx**
   - 4 location forms: Receiving, Shipping, Transit, Production
   - Auto-filled codes, pre-selected types
   - After creation: updates warehouse defaults with location IDs

5. **Step5ModuleSelection.tsx**
   - Grid of 8 module cards (2x4 or 3x3)
   - Each card: checkbox, icon, name, description
   - Pre-checked: Technical, Planning, Production, Warehouse
   - Validation: at least one module required

6. **Step6InviteUsers.tsx**
   - Multi-row form: email, first_name, last_name, role
   - "+ Add Another User" button
   - Remove user button (X icon per row)
   - Optional step: can skip (no users invited)

**Shared Components:**

- **WizardProgressIndicator.tsx:** Shows steps 1-6 with checkmarks for completed steps
- **WizardNavigation.tsx:** Back, Next, Skip, Complete buttons
- **WizardBanner.tsx:** Dashboard banner for incomplete wizard (if wizard_completed = false)

### 2.2 Main Dashboard Components

**File:** `apps/frontend/app/dashboard/page.tsx`

**Components:**

#### ModuleCard.tsx
```typescript
interface ModuleCardProps {
  name: string                      // e.g., "Technical"
  moduleKey: string                 // e.g., "technical" (for filtering)
  icon: LucideIcon                  // Module icon
  stats: string                     // e.g., "5 Active WOs"
  primaryAction: {
    label: string                   // e.g., "Create WO"
    href: string                    // e.g., "/production/work-orders/new"
  }
  detailsLink: string               // e.g., "/production"
  color: string                     // e.g., "text-green-600"
}
```

**Module Definitions:**
- Settings: gray (Building2 icon)
- Technical: blue (Wrench icon)
- Planning: indigo (Calendar icon)
- Production: green (Factory icon)
- Warehouse: orange (Package icon)
- Quality: red (CheckCircle icon)
- Shipping: purple (Truck icon)
- NPD: pink (Lightbulb icon)

#### ActivityFeed.tsx
```typescript
interface Activity {
  id: string
  activity_type: string             // e.g., "wo_status_change"
  entity_type: string               // e.g., "work_order"
  entity_id: string                 // UUID
  entity_code: string               // e.g., "WO-2024-001"
  description: string               // e.g., "WO-2024-001 started by John Doe"
  created_at: string                // ISO timestamp
  user: {
    first_name: string
    last_name: string
  }
}
```

**Features:**
- Fetches last 10 activities from `/api/dashboard/activity`
- Displays with icons based on activity_type
- Relative time formatting (date-fns: "2 minutes ago")
- Click activity → navigate to entity detail page (Link wrapper)
- Auto-refresh every 30s (useEffect interval)

#### QuickActions.tsx
- Create dropdown menu (filtered by enabled modules)
- Global search bar (debounced 300ms, calls `/api/dashboard/search`)
- Search results dropdown (grouped by entity type)

#### WelcomeBanner.tsx
- Conditional rendering: only if `setup_completed = false`
- Message: "Welcome to MonoPilot! Let's set up your organization."
- "Start Setup Wizard" button → launches Story 1.12
- "Skip for now" button → sets `setup_completed = true`

#### Sidebar.tsx
```typescript
interface SidebarProps {
  enabledModules: string[]          // Filter modules by enabled_modules
  isCollapsed: boolean              // Controlled by parent
  onToggleCollapse: () => void
}
```

**Features:**
- Collapsible sidebar (w-64 expanded ↔ w-16 collapsed)
- Module icons (filtered by enabledModules)
- Active state highlighting (bg-blue-50, border-left-4)
- Expand/collapse button (ChevronLeft/ChevronRight)

### 2.3 Settings Dashboard Components

**File:** `apps/frontend/app/settings/page.tsx`

**Component:**

#### SettingsModuleCard.tsx
```typescript
interface SettingsModule {
  name: string                      // e.g., "Organization Settings"
  description: string               // e.g., "Company profile, logo, and basic information"
  icon: LucideIcon                  // e.g., Building2
  href: string                      // e.g., "/settings/organization"
  color: string                     // e.g., "text-blue-600"
}
```

**10 Settings Modules:**

**Organization & Users:**
1. Organization Settings (Building2, blue) → `/settings/organization`
2. User Management (Users, blue) → `/settings/users`

**Warehouse & Facilities:**
3. Warehouses (Warehouse, orange) → `/settings/warehouses`
4. Locations (MapPin, orange) → `/settings/locations`
5. Machines (Cpu, orange) → `/settings/machines`
6. Production Lines (Factory, orange) → `/settings/production-lines`

**Product Configuration:**
7. Allergens (AlertTriangle, red) → `/settings/allergens`
8. Tax Codes (Receipt, pink) → `/settings/tax-codes`

**System Configuration:**
9. Module Activation (Grid, purple) → `/settings/modules`
10. Setup Wizard (Wand2, indigo) → `/settings/wizard`

**Layout:**
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Card hover effect: `hover:shadow-lg transition-shadow`
- Page title: "Settings"
- Subtitle: "Configure your MonoPilot system"

### 2.4 Polish & Cleanup Components

**Story 1.14 Components:**

#### InvitationsTable.tsx (AC-1.1)
```typescript
interface Invitation {
  id: string
  email: string
  role: UserRole
  invited_by: string                // User name
  sent_date: string                 // ISO timestamp
  expires_at: string                // ISO timestamp
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}
```

**Features:**
- Table columns: Email, Role, Invited By, Sent Date, Expires At, Status, Actions
- Status badges: Pending (blue), Accepted (green), Expired (red), Cancelled (gray)
- Search by email
- Filter by status dropdown
- Resend button → `POST /api/settings/invitations/:id/resend`
- Cancel button → confirmation modal → `DELETE /api/settings/invitations/:id`

#### InvitationModal.tsx (AC-1.2)
- Success message display
- QR code generation (client-side with qrcode library)
- Copy link to clipboard functionality (Clipboard API)
- Expiry notice: "Expires in 7 days"
- Close and "Send another invitation" actions

#### MachineDetailPage.tsx (AC-2.4)
**File:** `apps/frontend/app/settings/machines/[id]/page.tsx`

- Display machine basic info (code, name, status, capacity)
- Display assigned production lines with navigation links
- Show metadata (created_at, updated_at)
- Edit button (redirects to machines list with edit modal)
- Back navigation to machines list
- Placeholder for Epic 4: Active WOs section

---

## 3. Frontend Routes

### New Routes

| Route | Component | Purpose | Auth Required |
|-------|-----------|---------|---------------|
| `/onboarding/wizard` | SetupWizard | 6-step organization setup | Admin |
| `/dashboard` | Dashboard | Main landing page after login | Any User |
| `/settings` | SettingsDashboard | Settings landing page | Any User |
| `/settings/wizard` | SetupWizard | Re-run wizard (review mode) | Admin |
| `/settings/machines/[id]` | MachineDetailPage | Machine detail view | Admin/Manager |

### Existing Routes (Modified)

| Route | Modification | Story |
|-------|--------------|-------|
| `/settings/users` | Add Invitations tab (InvitationsTable) | 1.14 |
| `/settings/machines` | Add View button (Eye icon) to table | 1.14 |

### Navigation Flow

```
Login → /dashboard (Main Dashboard)
  ├─ Click "Settings" → /settings (Settings Dashboard)
  │    ├─ Click "Organization Settings" → /settings/organization
  │    ├─ Click "User Management" → /settings/users
  │    ├─ Click "Machines" → /settings/machines
  │    │    └─ Click View (Eye icon) → /settings/machines/[id]
  │    └─ Click "Setup Wizard" → /settings/wizard
  │
  ├─ Click "Create WO" (QuickActions) → /production/work-orders/new
  ├─ Click Module Card "Production" → /production
  └─ Click Activity Feed item → /[module]/[entity]/[id]

First Login (setup_completed = false):
  ├─ WelcomeBanner shown on /dashboard
  └─ Click "Start Setup Wizard" → /onboarding/wizard (6 steps)
       └─ On completion → /dashboard (wizard_completed = true)
```

---

## 4. UX Design References

### Wizard Mode (Story 1.12)

**Reference:** `docs/ux-design/ux-design-settings-module.md` - "Variant B (P0 MVP): Setup Wizard + Grouped Dashboard"

**Key UX Principles:**

1. **Guided Onboarding:** 6-step wizard with progress indicator (1/6, 2/6, etc.)
2. **Step Validation:** Cannot proceed to step N+1 without completing step N
3. **Progress Persistence:** Auto-save after each step to `organizations.wizard_progress` (JSONB)
4. **Skip & Resume:** Can dismiss wizard, resume later from saved progress
5. **Circular Dependency Resolution:** Create warehouse (step 3) → create locations (step 4) → update warehouse defaults
6. **Template Support (Future):** Pre-fill wizard data with Small/Medium/Large plant templates

**Time Savings:**
- Initial setup: 4 hours → 10 minutes (96% reduction)
- Validation + templates reduce setup errors by 95%

### Dashboard Design (Story 1.13)

**Reference:** `docs/ux-design/ux-design-shared-system.md` - "ModuleHeader, Colors, Mobile Responsive"

**Key UX Principles:**

1. **Module Overview Cards:** Visual dashboard with icons, stats, primary actions
2. **Activity Feed:** Real-time visibility into system activity across all modules
3. **Quick Actions:** Prominent "Create" dropdown and global search for fast navigation
4. **Responsive Layout:**
   - Desktop: Sidebar (collapsible) + cards grid + activity feed
   - Tablet: Collapsed sidebar (icon only)
   - Mobile: Bottom navigation bar + stacked cards

5. **Color-Coded Modules:**
   - Settings: gray (administrative)
   - Technical/Planning: blue/indigo (planning)
   - Production/Warehouse: green/orange (operations)
   - Quality/Shipping: red/purple (quality & logistics)

### Settings Dashboard (Story 1.15)

**Reference:** `docs/epics/01-settings.md` - "FR Coverage Matrix"

**Key UX Principles:**

1. **Organized Grid:** 10 settings modules grouped by category (4 categories)
2. **Hover Effects:** Visual feedback with shadow elevation on hover
3. **Icon-Driven:** Each card has distinctive icon and color (lucide-react)
4. **Consistent Layout:** Matches main dashboard design pattern

**Categories:**
- **Organization & Users:** Blue icons (admin/people)
- **Warehouse & Facilities:** Orange icons (logistics)
- **Product Configuration:** Red/Pink icons (products)
- **System Configuration:** Purple/Indigo icons (system)

---

## 5. Dependencies

### Database Schema

#### New Tables

**organizations table (migrations):**
```sql
-- Story 1.12: Wizard tracking
wizard_completed BOOLEAN DEFAULT false NOT NULL
wizard_progress JSONB                            -- { step: number, data: Partial<WizardData> }

-- Story 1.13: Setup completion tracking
setup_completed BOOLEAN DEFAULT false NOT NULL   -- Migration 005
```

**activity_logs table (Story 1.13):**
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL,                   -- 27 types (wo_status_change, po_approved, etc.)
  entity_type TEXT NOT NULL,                     -- 9 types (work_order, purchase_order, etc.)
  entity_id UUID NOT NULL,
  entity_code TEXT NOT NULL,                     -- Display code (e.g., "WO-2024-001")
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_org_created ON activity_logs(org_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
```

**user_preferences table (Story 1.13):**
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  dashboard_config JSONB,                        -- { module_order, pinned_modules, show_activity_feed }
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

**Story 1.12 (Wizard):**
- `POST /api/settings/wizard/progress` - Save wizard progress per step
- `GET /api/settings/wizard/progress` - Retrieve saved progress
- `POST /api/settings/wizard/complete` - Complete wizard (all-or-nothing transaction)

**Story 1.13 (Dashboard):**
- `GET /api/dashboard/overview` - Module stats (active WOs, pending POs, etc.)
- `GET /api/dashboard/activity` - Last 10 activities (with user JOIN)
- `GET /api/dashboard/search?q={query}` - Global search (ILIKE pattern matching)
- `PUT /api/dashboard/preferences` - Update user preferences

**Story 1.14 (Cleanup):**
- `POST /api/settings/invitations/:id/resend` - Resend invitation email
- `DELETE /api/settings/invitations/:id` - Cancel invitation
- `GET /api/cron/cleanup-invitations` - Auto-cleanup cron job (weekly)

### External Services

**Story 1.12:**
- Supabase: Organizations table updates, transactions
- None (all operations server-side)

**Story 1.13:**
- Supabase Realtime (optional): Activity feed real-time updates (deferred to future)
- Upstash Redis (optional): Module stats caching (5 min TTL) - deferred to Epic 9

**Story 1.14:**
- SendGrid: Resend invitation emails
- Vercel Cron: Weekly cleanup job (Sunday 2am UTC)

### Libraries

```json
{
  "dependencies": {
    "date-fns": "^4.1.0",                   // Story 1.13: Relative time formatting
    "qrcode": "^1.5.3",                     // Story 1.14: QR code generation
    "@types/qrcode": "^1.5.5",              // TypeScript types
    "react-hook-form": "^7.48.0",           // Wizard forms (existing)
    "zod": "^3.22.0",                       // Validation schemas (existing)
    "lucide-react": "^0.294.0"              // Icons (existing)
  }
}
```

### Prerequisites

**Story 1.12 (Wizard):**
- All Stories 1.1-1.11 (wizard integrates all previous stories)
- API endpoints from Stories 1.1, 1.5, 1.6, 1.2 (organization, warehouse, location, user)

**Story 1.13 (Dashboard):**
- Story 1.0 (Authentication UI - login/logout flow)
- Story 1.11 (Module Activation - filter enabled modules)

**Story 1.14 (Cleanup):**
- Story 1.3 (User Invitations - base API)
- Story 1.7 (Machine Configuration - detail page enhancement)

**Story 1.15 (Settings Dashboard):**
- All Stories 1.1-1.12 (all settings pages exist)
- shadcn/ui Card component installed

### Integration Points

**Cross-Story Integration:**

1. **Wizard → Organization/Warehouse/Location/User APIs**
   - Step 1 → `PUT /api/settings/organization` (Story 1.1)
   - Step 3 → `POST /api/settings/warehouses` (Story 1.5)
   - Step 4 → `POST /api/settings/locations` x4 (Story 1.6)
   - Step 6 → `POST /api/settings/users` (Story 1.2)

2. **Dashboard → Activity Logging (Future)**
   - Planning module (Epic 3): log PO approval, WO creation
   - Production module (Epic 4): log WO start, WO completion
   - Warehouse module (Epic 5): log LP received, stock move
   - Quality module (Epic 6): log NCR created, NCR resolved

3. **Settings Dashboard → All Settings Pages**
   - Links to 10 existing settings routes (Stories 1.1-1.12)

---

## 6. Testing Strategy

### Unit Tests

**Story 1.12 (Wizard):**
- Wizard service logic: `saveWizardProgress()`, `getWizardProgress()`, `completeWizard()`
- Validation schemas: Each step's Zod schema (organization, warehouse, location, user)
- Circular dependency resolution: Warehouse → Locations → Update warehouse defaults

**Story 1.13 (Dashboard):**
- ✅ Activity logging types and descriptions (`lib/activity/__tests__/log-activity.test.ts` - 12 tests)
- Module card rendering (props, styles)
- Activity feed formatting (relative time, descriptions)
- Search utility (query parsing)

**Story 1.14 (Cleanup):**
- ✅ Invitation utilities (12 tests): Token validation, expiry detection, QR generation, status badges
- Cron cleanup logic (query expired invitations >30 days, delete records)

### Integration Tests

**Story 1.12 (Wizard):**
- Complete wizard → all entities created (organization, warehouse, 4 locations, users, modules)
- Skip wizard → progress saved, can resume
- Resume wizard → data pre-filled
- Validation errors → step blocked
- API error → rollback, retry

**Story 1.13 (Dashboard):**
- `GET /api/dashboard/overview` (returns module stats)
- `GET /api/dashboard/activity` (returns last 10 activities)
- `GET /api/dashboard/search` (returns search results grouped by type)
- Activity logging utility (inserts into activity_logs)

**Story 1.14 (Cleanup):**
- ✅ Token generation with 7-day expiry validation
- ✅ Token validation with expired tokens (expires_at in past)
- ✅ Invitation record created with all required fields
- ✅ Resend invitation → new token, old invalidated
- ✅ Signup with valid token → user.status = 'active' (via trigger)
- ✅ Invitation status lifecycle (pending → cancelled/accepted/expired)
- ✅ Cleanup old expired invitations (>30 days)

### E2E Tests (Playwright)

**Story 1.12 (Wizard):**
- First login → wizard opens
- Complete all 6 steps → redirect to dashboard
- Skip wizard → banner shown, resume works
- Re-run wizard → creates 2nd warehouse

**Story 1.13 (Dashboard):**
- Login → land on dashboard → see module cards
- Click "Create WO" → navigate to `/production/work-orders/new`
- Search for "WO-2024-001" → see result → click → navigate to detail
- View activity feed → click activity → navigate to entity
- New user → see welcome banner → click "Start Wizard"

**Story 1.14 (Cleanup):**
- ✅ Machine CRUD: Create, edit, delete, filter, search, sort (16 tests)
- ⏭️ Invitation flow (deferred to future): Create user → email sent → signup → dashboard

**Story 1.15 (Settings Dashboard):**
- Navigate to `/settings` → page loads without errors
- All 10 setting cards displayed
- Click each card → navigate to correct sub-page
- Responsive layout (mobile, tablet, desktop)

---

## 7. Migration Files

### Required Migrations

**Migration 005:** Add setup_completed to organizations (Story 1.13)
```sql
-- File: apps/frontend/lib/supabase/migrations/005_add_setup_completed_to_organizations.sql
ALTER TABLE organizations
  ADD COLUMN setup_completed BOOLEAN DEFAULT false NOT NULL;

-- Update existing orgs to true (assume already set up)
UPDATE organizations SET setup_completed = true;
```

**Migration 006:** Add wizard tracking to organizations (Story 1.12)
```sql
-- File: apps/frontend/lib/supabase/migrations/006_add_wizard_tracking_to_organizations.sql
ALTER TABLE organizations
  ADD COLUMN wizard_completed BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN wizard_progress JSONB;

COMMENT ON COLUMN organizations.wizard_completed IS 'Tracks if setup wizard has been completed';
COMMENT ON COLUMN organizations.wizard_progress IS 'Stores current wizard step and form data for resume functionality';
```

**Migration 003:** Create activity_logs table (Story 1.13) ✅ Completed
```sql
-- File: apps/frontend/lib/supabase/migrations/003_create_activity_logs_table.sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_code TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_org_created ON activity_logs(org_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);

-- RLS policies
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see activities from their organization"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));
```

**Migration 004:** Create user_preferences table (Story 1.13) ✅ Completed
```sql
-- File: apps/frontend/lib/supabase/migrations/004_create_user_preferences_table.sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dashboard_config JSONB,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Helper function: get_default_dashboard_config()
CREATE OR REPLACE FUNCTION get_default_dashboard_config()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'module_order', ARRAY[]::text[],
    'pinned_modules', ARRAY[]::text[],
    'show_activity_feed', true
  );
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only manage their own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

**Migration 015:** Auto-activate users trigger (Story 1.14) ✅ Completed
```sql
-- File: apps/frontend/lib/supabase/migrations/015_add_auto_activate_user_trigger.sql
-- Database trigger to automatically activate users after signup (via invitation token)
-- Replaces $20/month Vercel webhook - FREE database-side solution
```

---

## 8. Implementation Notes

### Story Priorities

1. **Story 1.15 (Settings Dashboard)** - P0, 3 points, **START HERE**
   - Blocking: Users get 404 when clicking "Settings" in sidebar
   - Fast win: 4-6 hours, single page component

2. **Story 1.12 (Settings Wizard)** - P0, 13 points
   - Highest complexity: 6-step wizard, circular dependency resolution
   - Estimated: 52 hours (~1.5 weeks)

3. **Story 1.13 (Main Dashboard)** - P0, 8 points, **IN REVIEW**
   - 4 HIGH issues fixed (migration 005, sidebar, module filtering, activity clickable)
   - Approved, ready for merge

4. **Story 1.14 (Epic Polish)** - P1, 5 points
   - Split into sub-tasks: Invitations UI (AC-1.1, AC-1.2), Machine tests (AC-2.1), Machine detail page (AC-2.4)
   - Auto-cleanup cron (AC-1.5) ✅ Completed
   - Signup automation trigger (AC-1.4) ✅ Completed

### Technical Decisions

**Wizard Circular Dependency Resolution:**
```
Step 3: Create warehouse (defaults = NULL)
  ↓
Step 4: Create 4 locations (with warehouse_id)
  ↓
After Step 4: Update warehouse.default_*_location_id
  ↓
Circular dependency resolved
```

**Wizard All-or-Nothing Approach:**
- Use database transaction for wizard completion
- If any step fails: rollback all changes
- User can retry without partial data

**Activity Feed Real-time Updates:**
- MVP: Polling every 30s (useEffect interval)
- Future: Supabase Realtime (deferred to Epic 9 performance optimization)

**Module Stats Caching:**
- MVP: No caching (acceptable performance)
- Future: Upstash Redis (5 min TTL) - deferred to Epic 9

**Settings Dashboard Layout:**
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Consistent with main dashboard design pattern

### Security Considerations

**Wizard:**
- Only Admin can access wizard (role check)
- All API endpoints validate session and org_id
- Transaction rollback prevents partial data

**Dashboard:**
- Activity logs RLS: Users can only see activities from their organization
- Module stats: Only show stats for enabled modules (prevent data leakage)
- Search: Filter results by org_id (prevent cross-tenant access)

**Settings Dashboard:**
- No data access (pure navigation page)
- Links to existing settings pages (rely on existing auth checks)

---

## 9. Acceptance Criteria Summary

### Story 1.12 (10 ACs)

- AC-012.1: 6-step wizard triggered on first login (organizations.wizard_completed = false)
- AC-012.2: Each step validates before proceeding (inline errors, prevent next step)
- AC-012.3: Wizard completion status tracked (wizard_completed, wizard_progress JSONB)
- AC-012.4: Wizard skip and resume functionality (dismiss modal, resume later)
- AC-012.5: Wizard flow handles circular dependencies (warehouse → locations → update defaults)
- AC-012.6: Module selection with descriptions (8 modules, checkboxes, defaults)
- AC-012.7: User invitation with role assignment (multi-row form, optional step)
- AC-012.8: Progress indicator and navigation (stepper 1-6, Back/Next/Complete buttons)
- AC-012.9: Wizard data validation and error handling (Zod schemas, API errors, retry)
- AC-012.10: Wizard can be accessed later from Settings (re-run wizard, review mode)

### Story 1.13 (6 ACs)

- AC-012.1: Dashboard layout and navigation (top nav, collapsible sidebar, responsive)
- AC-012.2: Module overview cards (grid, icons, stats, primary actions, filtered by enabled)
- AC-012.3: Recent activity feed (last 10, clickable, relative time)
- AC-012.4: Quick actions toolbar (Create dropdown, global search, notifications placeholder)
- AC-012.5: Personalization (optional - deferred to future)
- AC-012.6: UX/UI requirements (clean design, hover effects, color-coded, loading states, responsive grid)

### Story 1.14 (3 ACs + Tech Debt)

- AC-1: Story 1.3 deferred items (Invitations Tab UI, Invitation Modal, Expired indicators, Signup automation ✅, Auto-cleanup ✅, Tests ✅)
- AC-2: Story 1.7 deferred items (E2E Tests ✅, Redis Cache → Epic 9, Line Assignment UI ✅, Machine Detail Page ✅)
- AC-3: Other Epic 1 deferred items (review, prioritize, complete or postpone with justification)

### Story 1.15 (5 ACs)

- AC-015.1: Settings Dashboard page structure (title, subtitle, grid of cards)
- AC-015.2: Settings cards/modules display (10 modules, icons, descriptions, links)
- AC-015.3: Card interaction & navigation (clickable, Next.js Link, hover states)
- AC-015.4: Responsive layout (1 col mobile, 2 cols tablet, 3 cols desktop)
- AC-015.5: Consistent layout with application (sidebar, topbar, container/padding, shadcn/ui Card)

---

## 10. Known Issues & Tech Debt

### From Story 1.13 Review

**Resolved (2025-11-22):**
- ✅ Migration 005 created (setup_completed column)
- ✅ Sidebar component implemented (collapsible, module icons, filtered)
- ✅ Module filtering by enabled_modules (prevent data leakage)
- ✅ Activity feed clickable (Link wrapper with getEntityLink function)

**Deferred to Story 1.14:**
- Module links in top nav (AC-012.1)
- Create dropdown filtering by enabled modules (AC-012.4)
- Empty state if no modules enabled (AC-012.6)
- Admin role-based quick actions

**Deferred to Future (Epic 9 Performance):**
- SWR migration (replace fetch+useEffect with SWR hooks)
- Redis caching for module stats (5 min TTL)
- Supabase Realtime for activity feed (replace 30s polling)

### From Story 1.7 Review

**Deferred to Epic 9:**
- Redis cache integration (AC-2.2) - performance optimization, not MVP blocker
- Backend events already emit cache invalidation hooks ('machine.updated')

---

## 11. Definition of Done

### Story 1.12 (Wizard)

- [ ] All 16 tasks completed (database schema, wizard service, API endpoints, frontend components, tests)
- [ ] 6-step wizard implemented with validation and progress persistence
- [ ] Circular dependency resolution tested (warehouse → locations → update defaults)
- [ ] Skip and resume functionality working
- [ ] Integration tests: complete wizard, skip, resume, validation errors, rollback
- [ ] E2E tests: first login → wizard → completion, skip → resume
- [ ] Code review approved
- [ ] Documentation updated

### Story 1.13 (Dashboard)

- [x] All 13 tasks completed (database schema, API endpoints, activity logging, frontend components)
- [x] 4 HIGH issues fixed (migration 005, sidebar, module filtering, activity clickable)
- [x] Module cards filtered by enabled_modules
- [x] Activity feed clickable with navigation
- [x] Sidebar collapsible with module icons
- [x] Welcome banner for new users
- [x] Code review approved ✅

### Story 1.14 (Polish & Cleanup)

- [x] AC-1.4: Signup automation trigger deployed ✅
- [x] AC-1.5: Auto-cleanup cron job configured ✅
- [x] AC-1.6: Invitation flow tests (12 unit + 7 integration) ✅
- [x] AC-2.1: E2E Tests for Machine CRUD (16 tests) ✅
- [x] AC-2.3: Line Assignment UI ✅
- [x] AC-2.4: Machine Detail Page ✅
- [ ] AC-1.1: Invitations Tab UI
- [ ] AC-1.2: Invitation Modal
- [ ] AC-2.2: Moved to Epic 9 (not blocking)
- [ ] All Epic 1 acceptance criteria fully satisfied
- [ ] Test coverage >80% for critical paths
- [ ] Documentation up to date

### Story 1.15 (Settings Dashboard)

- [ ] Settings Dashboard page created at `/settings/page.tsx`
- [ ] All 10 setting modules displayed as cards
- [ ] Responsive grid layout implemented (1/2/3 cols)
- [ ] Navigation to all sub-pages works correctly
- [ ] Consistent styling with main dashboard
- [ ] Manual testing completed
- [ ] Code review approved
- [ ] Story documentation committed to repo
- [ ] sprint-status.yaml updated

---

## 12. Related Documentation

### Epic & Story Files

- [Epic 1: Foundation & Settings](../../epics/01-settings.md)
- [Story 1.12: Settings Wizard](../stories/1.12-settings-wizard-ux-design.md)
- [Story 1.13: Main Dashboard](../stories/1.13-main-dashboard.md)
- [Story 1.14: Epic Polish & Cleanup](../stories/1.14-epic-polish-cleanup.md)
- [Story 1.15: Settings Dashboard](../stories/1.15-settings-dashboard.md)

### UX Design References

- [UX Design - Settings Module](../../ux-design/ux-design-settings-module.md)
- [UX Design - Shared System](../../ux-design/ux-design-shared-system.md)
- [UX Design - Auth & Dashboard](../../ux-design/ux-design-auth-and-dashboard.md)

### Architecture

- [Frontend Patterns](../../architecture/patterns/frontend.md)
- [Database Schema](../../architecture/database-schema.md)
- [API Design](../../architecture/api-design.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Next Review:** After Story 1.15 completion
