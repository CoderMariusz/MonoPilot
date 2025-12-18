# Settings Navigation Components

**Story:** 01.2 - Settings Shell: Navigation + Role Guards
**Version:** 1.0.0
**Since:** v0.2.0

---

## Overview

The Settings Navigation system provides a role-based, module-aware sidebar navigation for the Settings module. It consists of 6 components that work together to deliver secure, accessible navigation with proper loading and error states.

**Features:**
- Role-based filtering (10 system roles supported)
- Module-based filtering (disabled modules hide related items)
- 4 states: Loading, Error (with retry), Empty ("Coming Soon"), Success
- 14 navigation items across 6 sections
- Keyboard accessible (Tab, Enter, Space)
- Mobile responsive layout
- Performance optimized (<300ms load time)

**Navigation Structure:**
- Organization (1 item)
- Users & Roles (3 items)
- Infrastructure (3 items)
- Master Data (2 items)
- Integrations (2 items)
- System (3 items)

---

## Components

### SettingsNav

**Path:** `apps/frontend/components/settings/SettingsNav.tsx`

Main navigation sidebar component. Automatically filters navigation based on user's role and enabled modules.

**Usage:**
```typescript
// In settings layout
<div className="flex h-full">
  <SettingsNav />
  <main className="flex-1 overflow-auto p-6">
    {children}
  </main>
</div>
```

**States:**
- **Loading:** Shows SettingsNavSkeleton while context loads
- **Error:** Shows SettingsErrorState with retry button
- **Null:** Returns null (no render)
- **Success:** Renders navigation with filtered items

**Filtering Logic:**
1. Fetches org context via `useOrgContext` hook
2. Passes context to `buildSettingsNavigation` service
3. Filters items by role and module permissions
4. Removes empty sections

**Component Structure:**
```typescript
export function SettingsNav() {
  const { data: context, isLoading, error, refetch } = useOrgContext()

  if (isLoading) {
    return <SettingsNavSkeleton />
  }

  if (error) {
    return <SettingsErrorState error={error} onRetry={refetch} />
  }

  if (!context) {
    return null
  }

  const navigation = buildSettingsNavigation(context)

  return (
    <nav className="w-64 border-r bg-muted/10 p-4">
      {navigation.map((section) => (
        <div key={section.section} className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            {section.section}
          </h3>
          <div className="space-y-1">
            {section.items.map((item) => (
              <SettingsNavItem key={item.path} item={item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
```

**Styling:**
- Width: `w-64` (256px)
- Border: Right border with `border-r`
- Background: Subtle muted background `bg-muted/10`
- Padding: `p-4` (16px)
- Section spacing: `mb-6` (24px)

---

### SettingsNavItem

**Path:** `apps/frontend/components/settings/SettingsNavItem.tsx`

Individual navigation link component with active and disabled states.

**Props:**
```typescript
interface SettingsNavItemProps {
  item: NavigationItem
}
```

**NavigationItem Interface:**
```typescript
interface NavigationItem {
  name: string            // Display label
  path: string            // Route path (e.g., '/settings/users')
  icon: LucideIcon        // Icon component
  implemented: boolean    // Whether route is implemented
  roles?: string[]        // Optional role filter
  module?: string         // Optional module filter
}
```

**Usage:**
```typescript
<SettingsNavItem
  item={{
    name: 'Users',
    path: '/settings/users',
    icon: Users,
    implemented: true,
    roles: ['owner', 'admin']
  }}
/>
```

**States:**

**1. Implemented Route (clickable):**
```typescript
<Link
  href={item.path}
  className={cn(
    'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  )}
>
  <Icon className="h-4 w-4" />
  <span>{item.name}</span>
</Link>
```

**2. Unimplemented Route (disabled):**
```typescript
<div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-50">
  <Icon className="h-4 w-4" />
  <span>{item.name}</span>
  <span className="ml-auto text-xs">Soon</span>
</div>
```

**Active State Detection:**
- Uses `usePathname()` hook from Next.js
- Compares current pathname with `item.path`
- Active items have primary background and foreground colors

**Performance:** Memoized with `React.memo()` to prevent unnecessary re-renders when parent navigation component updates.

---

### SettingsNavSkeleton

**Path:** `apps/frontend/components/settings/SettingsNavSkeleton.tsx`

Loading skeleton displayed while organization context is fetching.

**Usage:**
```typescript
{isLoading && <SettingsNavSkeleton />}
```

**Layout:**
- 3 sections with 2 items each (mimics typical navigation structure)
- Skeleton width matches SettingsNav (w-64 / 256px)
- Uses ShadCN `<Skeleton>` component for shimmer effect

**Component Structure:**
```typescript
export function SettingsNavSkeleton() {
  return (
    <div
      className="w-64 border-r bg-muted/10 p-4 space-y-6"
      data-testid="settings-nav-skeleton"
    >
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-2">
          {/* Section header */}
          <Skeleton className="h-4 w-24" />
          {/* Nav items */}
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  )
}
```

**Dimensions:**
- Section header: `h-4 w-24` (16px × 96px)
- Nav items: `h-9 w-full` (36px height, full width)
- Section spacing: `space-y-6` (24px)
- Item spacing: `space-y-2` (8px)

---

### SettingsErrorState

**Path:** `apps/frontend/components/settings/SettingsErrorState.tsx`

Error state component with retry capability.

**Props:**
```typescript
interface SettingsErrorStateProps {
  error: Error
  onRetry?: () => void
}
```

**Usage:**
```typescript
{error && (
  <SettingsErrorState
    error={error}
    onRetry={() => refetch()}
  />
)}
```

**Features:**
- AlertCircle icon (Lucide) with destructive color
- Error message display (from `error.message`)
- Retry button (if onRetry provided)
- Centered layout matching navigation width

**Component Structure:**
```typescript
export function SettingsErrorState({
  error,
  onRetry,
}: SettingsErrorStateProps) {
  return (
    <div
      className="w-64 border-r bg-muted/10 p-4 flex flex-col items-center justify-center h-[300px] text-center"
      data-testid="settings-error-state"
    >
      <AlertCircle className="h-10 w-10 text-destructive mb-3" />
      <h3 className="text-sm font-semibold mb-1">Failed to Load Navigation</h3>
      <p className="text-xs text-muted-foreground mb-3 max-w-[200px]">
        {error.message || 'An unexpected error occurred'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
```

**Error Handling:**
- Generic error title ("Failed to Load Navigation")
- Shows specific error message from `error.message`
- Fallback message if error.message is undefined
- Optional retry button for recovery

---

### SettingsEmptyState

**Path:** `apps/frontend/components/settings/SettingsEmptyState.tsx`

"Coming Soon" state for unimplemented settings routes.

**Props:**
```typescript
interface SettingsEmptyStateProps {
  title: string
  description?: string
}
```

**Usage:**
```typescript
<SettingsEmptyState
  title="Invitations"
  description="User invitation management is coming soon."
/>
```

**Features:**
- Construction icon (Lucide) in muted color
- Customizable title and description
- Centered layout (h-[400px])
- Default description if not provided

**Component Structure:**
```typescript
export function SettingsEmptyState({
  title,
  description,
}: SettingsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <Construction className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">
        {description || 'This feature is coming soon. Check back later!'}
      </p>
    </div>
  )
}
```

**Usage in Pages:**
```typescript
// In an unimplemented settings page
export default function InvitationsPage() {
  return (
    <SettingsLayout title="Invitations">
      <SettingsEmptyState
        title="Invitations"
        description="User invitation management is coming soon."
      />
    </SettingsLayout>
  )
}
```

---

### SettingsLayout

**Path:** `apps/frontend/components/settings/SettingsLayout.tsx`

Consistent layout wrapper for settings pages.

**Props:**
```typescript
interface SettingsLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}
```

**Usage:**
```typescript
<SettingsLayout
  title="Organization"
  description="Manage your organization settings"
>
  <OrganizationForm />
</SettingsLayout>
```

**Component Structure:**
```typescript
export function SettingsLayout({
  children,
  title,
  description,
}: SettingsLayoutProps) {
  return (
    <div className="space-y-6">
      {(title || description) && (
        <div>
          {title && <h1 className="text-2xl font-bold">{title}</h1>}
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
```

**Features:**
- Optional page title (h1) and description
- Consistent spacing (space-y-6 / 24px)
- Title styling: text-2xl font-bold
- Description styling: text-muted-foreground

**Example with Full Settings Page:**
```typescript
// apps/frontend/app/(authenticated)/settings/organization/page.tsx
export default function OrganizationPage() {
  const { allowed, loading } = useSettingsGuard(['owner', 'admin'])

  if (loading) return <LoadingSkeleton />
  if (!allowed) return <AccessDenied />

  return (
    <SettingsLayout
      title="Organization Profile"
      description="Manage your organization's basic information and settings"
    >
      <OrganizationForm />
    </SettingsLayout>
  )
}
```

---

## Integration Example

Complete example showing how all components work together:

```typescript
// apps/frontend/app/(authenticated)/settings/layout.tsx
export default function SettingsModuleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-full">
      <SettingsNav />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}

// apps/frontend/app/(authenticated)/settings/users/page.tsx
export default function UsersPage() {
  const { allowed, loading } = useSettingsGuard(['owner', 'admin'])

  if (loading) {
    return (
      <SettingsLayout title="Users">
        <LoadingSkeleton />
      </SettingsLayout>
    )
  }

  if (!allowed) {
    return (
      <SettingsLayout title="Users">
        <AccessDenied />
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout
      title="Users"
      description="Manage user accounts and permissions"
    >
      <UsersTable />
    </SettingsLayout>
  )
}
```

---

## Styling Guidelines

### Color Scheme
- **Navigation background:** `bg-muted/10` (subtle gray)
- **Active item:** `bg-primary text-primary-foreground` (brand color)
- **Inactive item:** `text-muted-foreground` (gray text)
- **Hover state:** `hover:bg-muted hover:text-foreground`
- **Disabled item:** `opacity-50` (50% opacity)

### Spacing
- **Navigation width:** `w-64` (256px)
- **Section spacing:** `mb-6` (24px)
- **Item spacing:** `space-y-1` (4px)
- **Item padding:** `px-3 py-2` (12px horizontal, 8px vertical)
- **Icon gap:** `gap-3` (12px)

### Typography
- **Section headers:** `text-xs font-semibold uppercase`
- **Nav items:** `text-sm` (14px)
- **Page title:** `text-2xl font-bold`
- **Page description:** `text-muted-foreground`

### Icons
- **Size:** `h-4 w-4` (16px × 16px)
- **Source:** Lucide React (tree-shakeable imports)
- **Color:** Inherits from parent text color

---

## Accessibility

### Semantic HTML
- Navigation uses `<nav>` element
- Section headers use `<h3>` headings
- Links use Next.js `<Link>` component
- Disabled items use non-interactive `<div>`

### Keyboard Navigation
- Tab key navigates through links
- Enter/Space activates links
- Focus indicators visible on all interactive elements
- Disabled items not focusable (correct behavior)

### Screen Reader Support
- Section headings announced by screen readers
- Active page detection via pathname matching
- Error messages readable
- Loading state indicated with skeleton

### Recommended Improvements (Optional)
1. Add `aria-current="page"` to active links
2. Add `sr-only` text for "Soon" badge
3. Add `aria-live="polite"` to loading skeleton
4. Increase touch target size to `py-3` for mobile
5. Verify color contrast with brand colors (WCAG AA 4.5:1)

---

## Performance

### Optimization Techniques
- Single API request (no waterfall)
- Context cached (no refetch on re-render)
- Tree-shakeable icon imports
- Client-side filtering (O(n) complexity, n=14)
- React.memo on SettingsNavItem prevents unnecessary re-renders

### Load Time
- **Target:** <300ms
- **Expected:** ~160ms
  - Page load: ~50ms (Next.js SSR)
  - Context fetch: ~100ms (API round-trip)
  - Navigation render: ~10ms (14 items)

### Optional Optimizations
1. Add `useMemo` for navigation build in SettingsNav
2. Add `React.memo` to SettingsNavItem component

---

## Security

### Multi-Layered Defense
1. **UI Layer:** Navigation items filtered by role and module
2. **Client Guard Layer:** useSettingsGuard hook prevents navigation
3. **API Layer:** API routes validate session and role
4. **Data Layer:** RLS policies enforce multi-tenancy (Story 01.1)

### Role-Based Filtering
- Navigation items have optional `roles` array
- Users only see items matching their role
- Empty sections removed automatically

### Module-Based Filtering
- Navigation items have optional `module` property
- Users only see items for enabled modules
- Disabled modules hide related items

### No Sensitive Data
- Navigation schema contains only UI metadata
- No database IDs exposed
- No user PII in navigation
- Generic error messages (no info leakage)

---

## Testing

### Unit Tests
- 23/23 tests passing (100%)
- Coverage: 80-90% across all files

### Test Files
- `settings-navigation-service.test.ts` (4 tests)
- `useSettingsGuard.test.ts` (5 tests)
- `useSettingsPermissions.test.ts` (4 tests)
- `SettingsNav.test.tsx` (6 tests)
- `SettingsNavItem.test.tsx` (4 tests)

### Test Coverage
- Role-based filtering
- Module-based filtering
- Loading/error/empty states
- Active state detection
- Unimplemented route handling
- Section removal logic

---

## Related Documentation

- [Settings Hooks](../hooks/settings-hooks.md) - useOrgContext, useSettingsGuard, useSettingsPermissions
- [Settings Navigation Guide](../guides/settings-navigation-guide.md) - Adding new navigation items
- [Settings Navigation Service](../../services/settings-navigation-service.md) - buildSettingsNavigation function
- [Story 01.2 Specification](../../../2-MANAGEMENT/epics/current/01-settings/01.2.settings-shell-navigation.md)
- [Code Review Report](../../../2-MANAGEMENT/reviews/code-review-story-01.2-final.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-17 | Initial release (Story 01.2) |

---

**Last Updated:** 2025-12-17
**Story:** 01.2 - Settings Shell: Navigation + Role Guards
**Status:** Production Ready
