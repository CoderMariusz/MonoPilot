# Settings Components

**Story:** 01.2 - Settings Shell: Navigation + Role Guards
**Version:** 1.0.0

---

## Overview

This directory contains UI components for the Settings module. These components provide navigation, layout, and state handling for all settings pages.

---

## Components

### Navigation Components

#### SettingsNav
**File:** `SettingsNav.tsx`

Main navigation sidebar with role-based and module-based filtering.

**Features:**
- Automatically filters items by user role
- Hides items for disabled modules
- Shows loading skeleton while context loads
- Displays error state with retry button
- Removes empty sections

**Usage:**
```typescript
<SettingsNav />
```

**States:**
- Loading: `<SettingsNavSkeleton />`
- Error: `<SettingsErrorState error={error} onRetry={refetch} />`
- Success: Renders filtered navigation

---

#### SettingsNavItem
**File:** `SettingsNavItem.tsx`

Individual navigation link with active state and disabled state handling.

**Props:**
```typescript
interface SettingsNavItemProps {
  item: NavigationItem
}
```

**Features:**
- Active state highlighting (primary background)
- Disabled state for unimplemented routes
- "Soon" badge on unimplemented items
- Memoized with React.memo for performance

**Usage:**
```typescript
<SettingsNavItem
  item={{
    name: 'Users',
    path: '/settings/users',
    icon: Users,
    implemented: true
  }}
/>
```

---

#### SettingsNavSkeleton
**File:** `SettingsNavSkeleton.tsx`

Loading skeleton displayed while org context is fetching.

**Features:**
- 3 sections with 2 items each
- Matches SettingsNav width (w-64)
- Uses ShadCN Skeleton component

**Usage:**
```typescript
{isLoading && <SettingsNavSkeleton />}
```

---

### State Components

#### SettingsErrorState
**File:** `SettingsErrorState.tsx`

Error state for navigation when context fails to load.

**Props:**
```typescript
interface SettingsErrorStateProps {
  error: Error
  onRetry?: () => void
}
```

**Features:**
- AlertCircle icon with destructive color
- Error message display
- Optional retry button
- Centered layout (h-[300px])

**Usage:**
```typescript
<SettingsErrorState
  error={new Error('Failed to load')}
  onRetry={() => refetch()}
/>
```

---

#### SettingsEmptyState
**File:** `SettingsEmptyState.tsx`

"Coming Soon" state for unimplemented settings routes.

**Props:**
```typescript
interface SettingsEmptyStateProps {
  title: string
  description?: string
}
```

**Features:**
- Construction icon
- Customizable title and description
- Default description if not provided
- Centered layout (h-[400px])

**Usage:**
```typescript
<SettingsEmptyState
  title="Invitations"
  description="User invitation management is coming soon."
/>
```

---

### Layout Components

#### SettingsLayout
**File:** `SettingsLayout.tsx`

Consistent layout wrapper for settings pages.

**Props:**
```typescript
interface SettingsLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}
```

**Features:**
- Optional page title (h1) and description
- Consistent spacing (space-y-6)
- Simple wrapper for page content

**Usage:**
```typescript
<SettingsLayout
  title="Organization"
  description="Manage your organization settings"
>
  <OrganizationForm />
</SettingsLayout>
```

---

## File Structure

```
components/settings/
├── SettingsNav.tsx              # Main navigation sidebar
├── SettingsNavItem.tsx          # Individual nav item
├── SettingsNavSkeleton.tsx      # Loading skeleton
├── SettingsErrorState.tsx       # Error state with retry
├── SettingsEmptyState.tsx       # Coming soon state
├── SettingsLayout.tsx           # Page layout wrapper
└── README.md                    # This file
```

---

## Dependencies

### Internal Dependencies
- `@/lib/hooks/useOrgContext` - Fetch org context
- `@/lib/services/settings-navigation-service` - Build navigation
- `@/lib/utils` - cn utility

### External Dependencies
- `lucide-react` - Icons
- `next/link` - Navigation
- `next/navigation` - usePathname hook
- `@/components/ui/skeleton` - ShadCN skeleton
- `@/components/ui/button` - ShadCN button

---

## Common Patterns

### Settings Page with Navigation

```typescript
// app/(authenticated)/settings/layout.tsx
export default function SettingsLayout({ children }) {
  return (
    <div className="flex h-full">
      <SettingsNav />
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
```

### Settings Page with Guards

```typescript
// app/(authenticated)/settings/users/page.tsx
import { useSettingsGuard } from '@/lib/hooks/useSettingsGuard'
import { SettingsLayout } from '@/components/settings/SettingsLayout'

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
      description="Manage user accounts"
    >
      <UsersTable />
    </SettingsLayout>
  )
}
```

### Unimplemented Page

```typescript
// app/(authenticated)/settings/invitations/page.tsx
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { SettingsEmptyState } from '@/components/settings/SettingsEmptyState'

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

## Styling

### Color Scheme
- **Navigation background:** `bg-muted/10`
- **Active item:** `bg-primary text-primary-foreground`
- **Inactive item:** `text-muted-foreground`
- **Hover state:** `hover:bg-muted hover:text-foreground`
- **Disabled item:** `opacity-50`

### Spacing
- **Navigation width:** `w-64` (256px)
- **Section spacing:** `mb-6` (24px)
- **Item spacing:** `space-y-1` (4px)
- **Item padding:** `px-3 py-2` (12px × 8px)

### Typography
- **Section headers:** `text-xs font-semibold uppercase`
- **Nav items:** `text-sm`
- **Page title:** `text-2xl font-bold`
- **Page description:** `text-muted-foreground`

---

## Accessibility

### Semantic HTML
- `<nav>` element for navigation
- `<h3>` for section headers
- `<h1>` for page titles
- Next.js `<Link>` for navigation items
- `<div>` (non-interactive) for disabled items

### Keyboard Navigation
- Tab through navigation items
- Enter/Space activates links
- Focus indicators visible
- Disabled items not focusable

### Screen Reader Support
- Section headings announced
- Active page detection
- Error messages readable
- Loading state indicated

---

## Performance

### Optimizations
- React.memo on SettingsNavItem
- Tree-shakeable icon imports
- Client-side filtering (O(n))
- Single API request for context

### Load Time
- Target: <300ms
- Expected: ~160ms
- Context fetch: ~100ms
- Navigation render: ~10ms

---

## Testing

### Unit Tests
Located in `__tests__/` subdirectories:
- `SettingsNav.test.tsx` (6 tests)
- `SettingsNavItem.test.tsx` (4 tests)

### Test Coverage
- Role-based filtering
- Module-based filtering
- Loading/error states
- Active state detection
- Unimplemented route handling

---

## Related Documentation

- [Settings Navigation Components (Full)](../../../docs/3-ARCHITECTURE/components/settings/settings-navigation.md)
- [Settings Hooks](../../../docs/3-ARCHITECTURE/hooks/settings-hooks.md)
- [Settings Navigation Guide](../../../docs/3-ARCHITECTURE/guides/settings-navigation-guide.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-17 | Initial release (Story 01.2) |

---

**Last Updated:** 2025-12-17
**Story:** 01.2 - Settings Shell: Navigation + Role Guards
