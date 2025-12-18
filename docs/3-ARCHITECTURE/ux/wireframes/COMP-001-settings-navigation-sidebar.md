# COMP-001: Settings Navigation Sidebar

**Component Type:** Navigation Sidebar
**Module:** Settings
**Status:** Approved (Auto-Approve Mode)
**Last Updated:** 2025-12-17

---

## Component Purpose

Vertical navigation sidebar for the Settings module, providing hierarchical access to all Settings pages organized by functional sections (Organization, Users & Roles, Infrastructure, Master Data, Integrations, System).

**Usage:** This component is rendered in the Settings module layout and appears on all Settings pages.

---

## ASCII Wireframe

### Success State (Desktop)

```
┌────────────────────────────────┐
│  SETTINGS                      │
├────────────────────────────────┤
│                                │
│  ORGANIZATION                  │
│  📋 Organization Profile       │
│                                │
│  USERS & ROLES                 │
│  👥 Users                      │
│  🔐 Roles & Permissions        │
│  📧 Invitations                │
│                                │
│  INFRASTRUCTURE                │
│  🏭 Warehouses                 │
│  ⚙️  Machines                  │
│  🔧 Production Lines           │
│                                │
│  MASTER DATA                   │
│  ⚠️  Allergens                 │
│  💰 Tax Codes                  │
│                                │
│  INTEGRATIONS                  │
│  🔑 API Keys                   │
│  🔗 Webhooks                   │
│                                │
│  SYSTEM                        │
│  🧩 Modules                    │
│  🔒 Security                   │
│  📋 Audit Logs                 │
│                                │
└────────────────────────────────┘

Active State (Organization Profile):
┌────────────────────────────────┐
│  SETTINGS                      │
├────────────────────────────────┤
│                                │
│  ORGANIZATION                  │
│  ▶ Organization Profile      │ ← Active (primary bg, white text)
│                                │
│  USERS & ROLES                 │
│  👥 Users                      │
│  🔐 Roles & Permissions        │
│  📧 Invitations                │
│                                │
└────────────────────────────────┘

Disabled Item (Unimplemented):
┌────────────────────────────────┐
│  INTEGRATIONS                  │
│  🔑 API Keys                   │
│  🔗 Webhooks                   │
│  📊 Analytics      [Soon]     │ ← Disabled (opacity 50%, cursor not-allowed)
│                                │
└────────────────────────────────┘
```

### Loading State

```
┌────────────────────────────────┐
│  SETTINGS                      │
├────────────────────────────────┤
│                                │
│  ████████████                  │
│  ████████████████              │
│                                │
│  ██████████████                │
│  ████████████                  │
│  ██████████████████            │
│  ████████████████              │
│                                │
│  ████████████████              │
│  ████████████                  │
│  ██████████████████            │
│                                │
└────────────────────────────────┘
```

### Error State

```
┌────────────────────────────────┐
│  SETTINGS                      │
├────────────────────────────────┤
│                                │
│          [⚠ Icon]              │
│                                │
│     Failed to Load Menu        │
│                                │
│      [Retry]                   │
│                                │
└────────────────────────────────┘
```

### No Context State

```
(Component returns null - no render)
```

### Mobile State (< 768px)

```
Sheet Component (Hamburger Triggered):

┌─────────────────────────────────┐
│  [×] SETTINGS                    │
├─────────────────────────────────┤
│                                  │
│  ORGANIZATION                    │
│  📋 Organization Profile         │
│                                  │
│  USERS & ROLES                   │
│  👥 Users                        │
│  🔐 Roles & Permissions          │
│  📧 Invitations                  │
│                                  │
│  INFRASTRUCTURE                  │
│  🏭 Warehouses                   │
│  ⚙️  Machines                    │
│  🔧 Production Lines             │
│                                  │
│  MASTER DATA                     │
│  ⚠️  Allergens                   │
│  💰 Tax Codes                    │
│                                  │
│  INTEGRATIONS                    │
│  🔑 API Keys                     │
│  🔗 Webhooks                     │
│                                  │
│  SYSTEM                          │
│  🧩 Modules                      │
│  🔒 Security                     │
│  📋 Audit Logs                   │
│                                  │
└─────────────────────────────────┘

Mobile Trigger (in header):
[☰]  Settings
```

---

## Layout Specifications

### Desktop (>= 768px)

- **Container**: `<nav>` semantic element
- **Width**: 256px (w-64)
- **Background**: `bg-muted/10` (subtle muted background)
- **Border**: Right border (`border-r`)
- **Padding**: 16px (p-4)
- **Position**: Fixed left, full height

### Section Headers

- **Typography**: Uppercase, 12px (text-xs), font-semibold
- **Color**: `text-muted-foreground`
- **Spacing**: Bottom margin 8px (mb-2), top margin 24px for non-first (mt-6)

### Navigation Items

- **Layout**: Flex row, gap 12px (gap-3)
- **Padding**: 12px horizontal, 8px vertical (px-3 py-2)
- **Typography**: 14px (text-sm), normal weight
- **Border Radius**: 6px (rounded-md)
- **Transition**: `transition-colors` (200ms)

### States

| State | Background | Text Color | Icon | Cursor |
|-------|-----------|------------|------|--------|
| Default | Transparent | `text-muted-foreground` | `text-muted-foreground` | pointer |
| Hover | `bg-muted` | `text-foreground` | `text-foreground` | pointer |
| Active | `bg-primary` | `text-primary-foreground` | `text-primary-foreground` | pointer |
| Disabled | Transparent | `text-muted-foreground` (opacity 50%) | `text-muted-foreground` (opacity 50%) | not-allowed |

### Mobile (< 768px)

- **Trigger**: Hamburger menu icon in header
- **Container**: ShadCN Sheet component
- **Position**: Full-height overlay from left
- **Width**: 80% screen width (max 320px)
- **Behavior**: Closes on navigation item click

---

## Navigation Sections (6)

### Section 1: Organization
- **Items**: 1
  - Organization Profile → `/settings/organization` (SET-007)

### Section 2: Users & Roles
- **Items**: 3
  - Users → `/settings/users` (SET-008)
  - Roles & Permissions → `/settings/roles` (SET-011)
  - Invitations → `/settings/invitations` (SET-010)

### Section 3: Infrastructure
- **Items**: 3
  - Warehouses → `/settings/warehouses` (SET-012)
  - Machines → `/settings/machines` (SET-016)
  - Production Lines → `/settings/production-lines` (SET-018)

### Section 4: Master Data
- **Items**: 2
  - Allergens → `/settings/allergens` (SET-020)
  - Tax Codes → `/settings/tax-codes` (SET-021)

### Section 5: Integrations
- **Items**: 2
  - API Keys → `/settings/api-keys` (SET-023)
  - Webhooks → `/settings/webhooks` (SET-024)

### Section 6: System
- **Items**: 3
  - Modules → `/settings/modules` (SET-022)
  - Security → `/settings/security` (SET-026)
  - Audit Logs → `/settings/audit-logs` (SET-025)

**Total Navigation Items**: 14

---

## Interaction Patterns

### Click Implemented Item
1. User clicks "Organization Profile"
2. `<Link href="/settings/organization">` triggered
3. Navigate to target page
4. Active state updates to highlight current page

### Click Unimplemented Item
1. User hovers over item with `[Soon]` badge
2. Tooltip: "This feature is under development"
3. Click has no action (cursor: not-allowed)
4. Item remains disabled

### Hover State
1. User hovers over "Users" item
2. Background changes to `bg-muted`
3. Text color changes to `text-foreground`
4. Icon color changes to `text-foreground`

### Active State Indication
1. `usePathname()` returns `/settings/users`
2. Navigation item with `path="/settings/users"` matches
3. `aria-current="page"` attribute added
4. Active styling applied (primary background + white text)

### Mobile Sheet Interaction
1. User taps hamburger icon (< 768px)
2. Sheet slides in from left
3. User taps "Warehouses" item
4. Sheet closes automatically
5. Navigate to `/settings/warehouses`

---

## States

### Loading
- **Display**: Skeleton rows (3 sections, 2-3 items each)
- **Pattern**: Animated shimmer effect
- **Duration**: Until org context loads
- **Accessibility**: Screen reader announces "Loading navigation menu"

### Success
- **Display**: Full navigation with all sections and items
- **Active Indicator**: Current page highlighted
- **Disabled Items**: Shown with "Soon" badge and reduced opacity
- **Accessibility**: Screen reader announces "Settings navigation menu with X items"

### Error
- **Display**: Error icon + message + Retry button
- **Message**: "Failed to Load Menu"
- **Action**: [Retry] button refetches navigation
- **Accessibility**: Screen reader announces "Error loading navigation menu, retry button available"

### No Context
- **Display**: Component returns `null` (no render)
- **Trigger**: When `useOrgContext()` returns null (not logged in)
- **Fallback**: Layout redirects to login

---

## Permission Filtering

**Logic**: Navigation items are filtered based on user role and permissions.

### Role-Based Visibility

| Section | Item | Visible Roles |
|---------|------|---------------|
| Organization | Organization Profile | SUPER_ADMIN, ADMIN |
| Users & Roles | Users | SUPER_ADMIN, ADMIN |
| Users & Roles | Roles & Permissions | SUPER_ADMIN, ADMIN |
| Users & Roles | Invitations | SUPER_ADMIN, ADMIN |
| Infrastructure | Warehouses | SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER |
| Infrastructure | Machines | SUPER_ADMIN, ADMIN, PRODUCTION_MANAGER |
| Infrastructure | Production Lines | SUPER_ADMIN, ADMIN, PRODUCTION_MANAGER |
| Master Data | Allergens | SUPER_ADMIN, ADMIN, QUALITY_MANAGER |
| Master Data | Tax Codes | SUPER_ADMIN, ADMIN |
| Integrations | API Keys | SUPER_ADMIN, ADMIN |
| Integrations | Webhooks | SUPER_ADMIN, ADMIN |
| System | Modules | SUPER_ADMIN, ADMIN |
| System | Security | SUPER_ADMIN, ADMIN |
| System | Audit Logs | SUPER_ADMIN, ADMIN |

**Implementation**: Use `buildSettingsNavigation(context)` service to filter items.

---

## Accessibility

### Semantic HTML
- **Container**: `<nav aria-label="Settings navigation">`
- **Sections**: `<div role="group" aria-labelledby="section-header-{id}">`
- **Section Headers**: `<h3 id="section-header-{id}">ORGANIZATION</h3>`
- **Links**: `<Link aria-current={isActive ? "page" : undefined}>`

### Touch Targets
- **Desktop**: 36px height (py-2)
- **Mobile**: 48dp height minimum (py-3)

### Contrast
- **Default Text**: `text-muted-foreground` (4.5:1 on background)
- **Active Text**: `text-primary-foreground` on `bg-primary` (4.5:1)
- **Hover Text**: `text-foreground` (7:1 on background)

### Keyboard Navigation
- **Tab Order**: Top to bottom, section by section
- **Enter Key**: Activates link
- **Focus Indicators**: Visible 2px outline on focus

### Screen Reader
- **Menu Announcement**: "Settings navigation menu, 6 sections, 14 items"
- **Section Announcement**: "Organization section, 1 item"
- **Item Announcement**: "Organization Profile link, current page" (if active)
- **Disabled Item**: "Analytics link, disabled, coming soon"

---

## Technical Implementation

### Component File
`apps/frontend/components/settings/SettingsNav.tsx`

### Dependencies
- `useOrgContext()` - Get user role and permissions
- `usePathname()` - Determine active route
- `buildSettingsNavigation(context)` - Service to filter navigation items
- ShadCN `Sheet` component (mobile)
- ShadCN `Skeleton` component (loading state)
- Lucide icons (all navigation icons)

### Data Source
- **Static Navigation Schema**: Defined in `lib/services/settings-navigation-service.ts`
- **Dynamic Filtering**: Based on `context.role` and enabled modules
- **Active State**: Determined by `pathname` from Next.js

### Example Schema

```typescript
interface NavigationSection {
  section: string;
  items: NavigationItem[];
}

interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
  roles: RoleCode[];
  wireframe: string;
  implemented: boolean;
}
```

### Responsive Breakpoints
- **Desktop**: `>= 768px` - Sidebar visible
- **Tablet**: `768-1024px` - Sidebar visible
- **Mobile**: `< 768px` - Hamburger menu + Sheet

---

## Related Screens

- **Settings Layout**: `app/(authenticated)/settings/layout.tsx` (parent)
- **All Settings Pages**: This nav appears on all 14 Settings pages
- **Mobile Sheet**: ShadCN Sheet component overlay

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [COMP-001-settings-navigation-sidebar]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
