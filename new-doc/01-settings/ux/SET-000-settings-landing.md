# SET-000: Settings Landing Page

**Module**: Settings
**Feature**: Settings Navigation Shell (Story 01.2)
**Status**: Auto-Approved
**Last Updated**: 2026-01-04

---

## Purpose

Landing page for the Settings module at `/settings` route. Provides overview cards for quick navigation to key Settings sections and displays organization context summary.

**Usage:** Entry point to Settings module, accessible from main navigation. Provides orientation and quick access to most-used Settings pages.

---

## ASCII Wireframe

### Success State (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  Welcome to Settings                                                              │
│  Configure your organization, manage users, and customize system preferences.    │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  Organization Summary                                                       │ │
│  │                                                                             │ │
│  │  ┌────────┐                                                                 │ │
│  │  │ [LOGO] │   Acme Food Manufacturing                                       │ │
│  │  └────────┘   Warsaw, Poland • Europe/Warsaw (CET)                         │ │
│  │               admin@acme.com • +48 123 456 789                              │ │
│  │                                                                             │ │
│  │               [Edit Organization Profile →]                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  Quick Access                                                                     │
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │  👥 Users & Roles    │  │  🏭 Infrastructure   │  │  ⚠️  Master Data     │     │
│  │                      │  │                      │  │                      │     │
│  │  Manage team members │  │  Warehouses, machines│  │  Allergens, tax codes│     │
│  │  and permissions     │  │  and production lines│  │  and configurations  │     │
│  │                      │  │                      │  │                      │     │
│  │  8 users             │  │  3 warehouses        │  │  14 allergens        │     │
│  │  10 roles            │  │  5 machines          │  │  4 tax codes         │     │
│  │  2 pending invites   │  │  2 production lines  │  │                      │     │
│  │                      │  │                      │  │                      │     │
│  │  [Manage Users →]    │  │  [Manage →]          │  │  [Manage →]          │     │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │  🔗 Integrations     │  │  🧩 System           │  │  🔒 Security         │     │
│  │                      │  │                      │  │                      │     │
│  │  API keys, webhooks  │  │  Modules, audit logs │  │  Access control and  │     │
│  │  and external apps   │  │  and system settings │  │  security policies   │     │
│  │                      │  │                      │  │                      │     │
│  │  2 API keys          │  │  6 modules enabled   │  │  Last login: 2h ago  │     │
│  │  0 webhooks          │  │  348 audit entries   │  │  Session: Active     │     │
│  │                      │  │                      │  │                      │     │
│  │  [Manage →]          │  │  [Manage →]          │  │  [View Settings →]   │     │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │
│                                                                                   │
│  Recent Activity                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  • John Smith updated organization profile                    2 hours ago   │ │
│  │  • Alice Chen invited new user (jane.doe@example.com)         Yesterday     │ │
│  │  • Bob Wilson added machine "Mixer #3"                        2 days ago    │ │
│  │  • Admin enabled Quality module                               3 days ago    │ │
│  │  • System auto-archived 50 old audit logs                     1 week ago    │ │
│  │                                                                             │ │
│  │  [View All Audit Logs →]                                                    │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ████████████████                                                                 │
│  ████████████████████████████████████████████                                    │
│                                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  ████████████████                                                           │ │
│  │                                                                             │ │
│  │  ████   ████████████████████                                                │ │
│  │         ████████████████████████████                                        │ │
│  │         ████████████████████                                                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                   │
│  ████████████                                                                     │
│                                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                        │
│  │ ████████████  │  │ ████████████  │  │ ████████████  │                        │
│  │               │  │               │  │               │                        │
│  │ ████████████  │  │ ████████████  │  │ ████████████  │                        │
│  │ ████████      │  │ ████████      │  │ ████████      │                        │
│  │               │  │               │  │               │                        │
│  │ ████          │  │ ████          │  │ ████          │                        │
│  │ ████          │  │ ████          │  │ ████          │                        │
│  │               │  │               │  │               │                        │
│  │ ████████████  │  │ ████████████  │  │ ████████████  │                        │
│  └───────────────┘  └───────────────┘  └───────────────┘                        │
│                                                                                   │
│  Loading settings...                                                              │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Empty State (New Organization)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│                                                                                   │
│                                    [⚙️  Icon]                                     │
│                                                                                   │
│                              Welcome to MonoPilot!                                │
│                                                                                   │
│                   Let's get your organization set up in 15 minutes.               │
│                Complete the setup wizard to configure essential settings.         │
│                                                                                   │
│                                                                                   │
│                            [🚀 Start Setup Wizard]                                │
│                                                                                   │
│                              [Skip and Configure Manually]                        │
│                                                                                   │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Settings                                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│                                                                                   │
│                                    [⚠ Icon]                                       │
│                                                                                   │
│                         Failed to Load Settings Dashboard                         │
│                                                                                   │
│                  Unable to retrieve organization settings. Please try again.      │
│                          Error: ORG_CONTEXT_FETCH_FAILED                          │
│                                                                                   │
│                                                                                   │
│                         [Retry]     [Contact Support]                             │
│                                                                                   │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile State (< 768px)

```
┌─────────────────────────────┐
│  < Settings                 │
├─────────────────────────────┤
│                             │
│  Welcome to Settings        │
│  Configure your org...      │
│                             │
│  ┌─────────────────────────┐│
│  │  Org Summary            ││
│  │                         ││
│  │  ┌───┐                  ││
│  │  │[L]│  Acme Food       ││
│  │  └───┘  Warsaw, PL      ││
│  │         CET             ││
│  │                         ││
│  │  [Edit Profile →]       ││
│  └─────────────────────────┘│
│                             │
│  Quick Access               │
│                             │
│  ┌─────────────────────────┐│
│  │  👥 Users & Roles       ││
│  │  8 users, 10 roles      ││
│  │  [Manage →]             ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  🏭 Infrastructure       ││
│  │  3 warehouses, 5 machines││
│  │  [Manage →]             ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  ⚠️  Master Data         ││
│  │  14 allergens, 4 tax... ││
│  │  [Manage →]             ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  🔗 Integrations        ││
│  │  2 API keys, 0 webhooks ││
│  │  [Manage →]             ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  🧩 System              ││
│  │  6 modules, 348 logs    ││
│  │  [Manage →]             ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │  🔒 Security            ││
│  │  Last login: 2h ago     ││
│  │  [View Settings →]      ││
│  └─────────────────────────┘│
│                             │
│  Recent Activity            │
│  ┌─────────────────────────┐│
│  │  • John updated org     ││
│  │    2 hours ago          ││
│  │  • Alice invited user   ││
│  │    Yesterday            ││
│  │  • Bob added machine    ││
│  │    2 days ago           ││
│  │                         ││
│  │  [View All →]           ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

---

## Key Components

1. **Page Header** - Title + description text
2. **Organization Summary Card** - Logo, name, location, timezone, contact info, edit link
3. **Quick Access Cards (6)** - Category cards with icons, descriptions, stats, and action links
   - Users & Roles
   - Infrastructure
   - Master Data
   - Integrations
   - System
   - Security
4. **Recent Activity Feed** - Last 5 admin actions with timestamps
5. **Empty State CTA** - Setup wizard launcher for new organizations

---

## Quick Access Cards

### Card Structure
Each card contains:
- **Icon** - Emoji or Lucide icon (48x48dp)
- **Title** - Category name (text-lg, font-semibold)
- **Description** - Brief explanation (text-sm, text-muted-foreground)
- **Stats** - 2-3 key metrics (text-sm)
- **Action Link** - "Manage →" or "View Settings →" button

### Card Categories

#### 1. Users & Roles
- **Icon**: 👥 (Users)
- **Description**: "Manage team members and permissions"
- **Stats**:
  - User count (e.g., "8 users")
  - Role count (always "10 roles")
  - Pending invitations (e.g., "2 pending invites")
- **Action**: [Manage Users →] → `/settings/users`

#### 2. Infrastructure
- **Icon**: 🏭 (Factory)
- **Description**: "Warehouses, machines and production lines"
- **Stats**:
  - Warehouse count (e.g., "3 warehouses")
  - Machine count (e.g., "5 machines")
  - Production line count (e.g., "2 production lines")
- **Action**: [Manage →] → `/settings/warehouses`

#### 3. Master Data
- **Icon**: ⚠️ (Allergens symbol)
- **Description**: "Allergens, tax codes and configurations"
- **Stats**:
  - Allergen count (default "14 allergens")
  - Tax code count (e.g., "4 tax codes")
- **Action**: [Manage →] → `/settings/allergens`

#### 4. Integrations
- **Icon**: 🔗 (Link)
- **Description**: "API keys, webhooks and external apps"
- **Stats**:
  - API key count (e.g., "2 API keys")
  - Webhook count (e.g., "0 webhooks")
- **Action**: [Manage →] → `/settings/api-keys`

#### 5. System
- **Icon**: 🧩 (Puzzle piece)
- **Description**: "Modules, audit logs and system settings"
- **Stats**:
  - Enabled modules count (e.g., "6 modules enabled")
  - Audit log entries (e.g., "348 audit entries")
- **Action**: [Manage →] → `/settings/modules`

#### 6. Security
- **Icon**: 🔒 (Lock)
- **Description**: "Access control and security policies"
- **Stats**:
  - Last login time (e.g., "Last login: 2h ago")
  - Session status (e.g., "Session: Active")
- **Action**: [View Settings →] → `/settings/security`

---

## States

### Loading
- **Display**: Skeleton for header, organization summary card, 6 quick access cards
- **Pattern**: Animated shimmer effect
- **Duration**: Until org context and stats load (<500ms target)
- **Accessibility**: Screen reader announces "Loading settings dashboard"

### Success
- **Display**: Full dashboard with organization summary, 6 quick access cards, recent activity
- **Stats**: Real-time counts fetched from database
- **Recent Activity**: Last 5 audit log entries
- **Accessibility**: Screen reader announces "Settings dashboard loaded, 6 categories available"

### Empty (New Organization)
- **Display**: Welcome message + Setup Wizard CTA + Skip link
- **Trigger**: When organization has no setup data (wizard not completed)
- **Action**: [Start Setup Wizard] → `/settings/onboarding`
- **Accessibility**: Screen reader announces "Welcome to MonoPilot, start setup wizard button available"

### Error
- **Display**: Error icon + message + Retry + Contact Support buttons
- **Message**: "Failed to Load Settings Dashboard"
- **Error Code**: ORG_CONTEXT_FETCH_FAILED
- **Action**: [Retry] refetches dashboard data
- **Accessibility**: Screen reader announces "Error loading settings dashboard, retry button available"

---

## Organization Summary Card

### Layout
- **Logo**: 80x80px thumbnail (left side)
- **Organization Name**: text-xl, font-semibold
- **Location + Timezone**: text-sm, text-muted-foreground (e.g., "Warsaw, Poland • Europe/Warsaw (CET)")
- **Contact Info**: text-sm, text-muted-foreground (e.g., "admin@acme.com • +48 123 456 789")
- **Edit Link**: [Edit Organization Profile →] button (right aligned)

### Data Fields
| Field | Source | Example |
|-------|--------|---------|
| Logo | organizations.logo_url | Image or placeholder |
| Name | organizations.name | "Acme Food Manufacturing" |
| City | organizations.city | "Warsaw" |
| Country | organizations.country | "Poland" |
| Timezone | organizations.timezone | "Europe/Warsaw (CET)" |
| Contact Email | organizations.contact_email | "admin@acme.com" |
| Contact Phone | organizations.contact_phone | "+48 123 456 789" |

---

## Recent Activity Feed

### Data Source
- **Table**: `audit_logs`
- **Query**: Last 5 entries for current organization, ordered by `created_at DESC`
- **Real-time**: Optional Supabase Realtime subscription for live updates

### Entry Format
```
• {user_name} {action_description}     {relative_time}
```

**Examples**:
- "• John Smith updated organization profile     2 hours ago"
- "• Alice Chen invited new user (jane.doe@example.com)     Yesterday"
- "• Bob Wilson added machine "Mixer #3"     2 days ago"
- "• Admin enabled Quality module     3 days ago"
- "• System auto-archived 50 old audit logs     1 week ago"

### Actions Tracked
- Organization profile updates
- User invitations
- User role changes
- Warehouse/machine/line additions
- Module toggle changes
- Security setting changes

---

## Interaction Patterns

### Click Quick Access Card
1. User clicks "Manage Users →" on Users & Roles card
2. Navigate to `/settings/users`
3. Settings navigation highlights "Users" item
4. User sees User Management page

### Click Edit Organization Profile
1. User clicks [Edit Organization Profile →]
2. Navigate to `/settings/organization`
3. Organization Profile form loads with current data
4. User can edit and save

### Click View All Audit Logs
1. User clicks [View All Audit Logs →]
2. Navigate to `/settings/audit-logs`
3. Full audit log table loads with filters

### Empty State - Start Setup Wizard
1. User clicks [Start Setup Wizard]
2. Navigate to `/settings/onboarding`
3. Onboarding wizard step 1 loads
4. User completes 6-step wizard

### Empty State - Skip Wizard
1. User clicks [Skip and Configure Manually]
2. Remain on Settings landing page
3. Organization summary card appears (minimal data)
4. Quick access cards show "0" stats
5. User can navigate to any Settings page manually

---

## Permission Filtering

**Role-Based Visibility**:

| Element | Visible Roles |
|---------|---------------|
| Organization Summary | All authenticated users |
| Edit Organization Profile link | SUPER_ADMIN, ADMIN |
| Users & Roles card | SUPER_ADMIN, ADMIN |
| Infrastructure card | SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER, PRODUCTION_MANAGER |
| Master Data card | SUPER_ADMIN, ADMIN, QUALITY_MANAGER |
| Integrations card | SUPER_ADMIN, ADMIN |
| System card | SUPER_ADMIN, ADMIN |
| Security card | SUPER_ADMIN, ADMIN |
| Recent Activity feed | SUPER_ADMIN, ADMIN |

**Non-Admin Behavior**:
- Users with roles other than SUPER_ADMIN/ADMIN see limited dashboard
- Only cards they have access to are displayed
- Empty state if no cards are accessible (redirect to dashboard recommended)

---

## Accessibility

### Semantic HTML
- **Container**: `<main>` element
- **Page Title**: `<h1>Welcome to Settings</h1>`
- **Section Headings**: `<h2>Organization Summary</h2>`, `<h2>Quick Access</h2>`, `<h2>Recent Activity</h2>`
- **Cards**: `<article>` elements with `aria-labelledby` pointing to card title
- **Links**: Proper `<a>` or `<Link>` with descriptive text

### Touch Targets
- **Desktop Cards**: 280px height minimum
- **Mobile Cards**: 120px height minimum
- **All Links/Buttons**: 48x48dp touch target (mobile)

### Contrast
- **Card Background**: `bg-card` (WCAG AA 4.5:1)
- **Card Text**: `text-foreground` (7:1 on card background)
- **Muted Text**: `text-muted-foreground` (4.5:1 on card background)

### Keyboard Navigation
- **Tab Order**: Header → Organization Summary → Quick Access cards (left to right, top to bottom) → Recent Activity
- **Enter Key**: Activates card links
- **Focus Indicators**: Visible 2px outline on focus

### Screen Reader
- **Page Announcement**: "Settings dashboard, main navigation for configuration"
- **Card Announcement**: "Users and Roles card, 8 users, 10 roles, 2 pending invitations, Manage Users link"
- **Activity Entry**: "John Smith updated organization profile, 2 hours ago"

---

## Technical Implementation

### Component Files
- **Page**: `apps/frontend/app/(authenticated)/settings/page.tsx`
- **Components**:
  - `SettingsLayout` wrapper (COMP-003)
  - `SettingsDashboard` component (children)
  - `OrgSummaryCard` component
  - `QuickAccessCard` component
  - `RecentActivityFeed` component

### Data Fetching

#### Organization Context
**Source**: `GET /api/v1/settings/context` (from Story 01.1)
**Response**:
```json
{
  "organization": {
    "id": "org-123",
    "name": "Acme Food Manufacturing",
    "logo_url": "https://...",
    "city": "Warsaw",
    "country": "Poland",
    "timezone": "Europe/Warsaw",
    "contact_email": "admin@acme.com",
    "contact_phone": "+48 123 456 789"
  },
  "user": {
    "id": "user-456",
    "name": "John Smith",
    "role": "SUPER_ADMIN"
  }
}
```

#### Dashboard Statistics
**Source**: `GET /api/v1/settings/dashboard/stats`
**Response**:
```json
{
  "users": {
    "total": 8,
    "pending_invitations": 2
  },
  "infrastructure": {
    "warehouses": 3,
    "machines": 5,
    "production_lines": 2
  },
  "master_data": {
    "allergens": 14,
    "tax_codes": 4
  },
  "integrations": {
    "api_keys": 2,
    "webhooks": 0
  },
  "system": {
    "enabled_modules": 6,
    "audit_log_entries": 348
  },
  "security": {
    "last_login": "2026-01-04T12:30:00Z",
    "session_status": "active"
  }
}
```

#### Recent Activity
**Source**: `GET /api/v1/settings/audit-logs?limit=5`
**Response**:
```json
{
  "logs": [
    {
      "id": "log-1",
      "user_name": "John Smith",
      "action": "updated organization profile",
      "created_at": "2026-01-04T12:30:00Z"
    },
    {
      "id": "log-2",
      "user_name": "Alice Chen",
      "action": "invited new user (jane.doe@example.com)",
      "created_at": "2026-01-03T15:20:00Z"
    }
  ]
}
```

### Performance Targets
- **Initial Load**: <500ms (org context + stats)
- **Recent Activity**: <300ms (cached, low priority)
- **Card Click**: <100ms navigation

---

## Responsive Breakpoints

### Desktop (>= 1024px)
- **Cards**: 3 columns, grid layout
- **Card Width**: ~280px each
- **Organization Summary**: Full width, horizontal layout

### Tablet (768-1024px)
- **Cards**: 2 columns, grid layout
- **Card Width**: ~320px each
- **Organization Summary**: Full width, horizontal layout

### Mobile (< 768px)
- **Cards**: 1 column, stacked vertically
- **Card Width**: Full width
- **Organization Summary**: Vertical layout, compact logo

---

## Related Components

- **COMP-001**: Settings Navigation Sidebar (appears in Settings layout)
- **COMP-003**: Settings Layout Component (wraps this page)
- **SET-007**: Organization Profile (linked from summary card)
- **SET-008**: User List (linked from Users & Roles card)
- **SET-025**: Audit Logs (linked from Recent Activity)

---

## Design Tokens

### Spacing
- **Page Padding**: 24px (p-6)
- **Card Grid Gap**: 24px (gap-6)
- **Card Padding**: 20px (p-5)
- **Card Vertical Spacing**: 16px (space-y-4)

### Typography
- **Page Title**: 30px (text-3xl), font-bold
- **Page Description**: 14px (text-sm), text-muted-foreground
- **Card Title**: 18px (text-lg), font-semibold
- **Card Description**: 14px (text-sm), text-muted-foreground
- **Card Stats**: 13px (text-sm), normal weight
- **Activity Entry**: 14px (text-sm), normal weight

### Colors
- **Card Background**: `bg-card` (elevated surface)
- **Card Border**: `border` (subtle border)
- **Card Hover**: `hover:bg-accent` (subtle highlight)
- **Link Color**: `text-primary` (clickable elements)
- **Icon Color**: Emoji or `text-muted-foreground`

---

## Quality Gates

- [✓] All 6 quick access cards implemented
- [✓] Organization summary card with logo, name, location, contact
- [✓] Recent activity feed with last 5 entries
- [✓] Empty state with setup wizard CTA
- [✓] Loading state with skeletons
- [✓] Error state with retry option
- [✓] Mobile-responsive (1/2/3 column grid)
- [✓] Permission filtering for cards
- [✓] All 4 states defined (loading, empty, error, success)
- [✓] Accessibility compliance (WCAG AA)
- [✓] Touch targets >= 48x48dp (mobile)

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screen**: SET-000-settings-landing
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
**Story**: 01.2 - Settings Shell: Navigation + Role Guards
**Related Wireframes**: COMP-001 (Navigation), COMP-003 (Layout)
