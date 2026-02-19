# COMP-003: Settings Layout Component

**Component Type:** Page Layout Wrapper
**Module:** Settings
**Status:** Approved (Auto-Approve Mode)
**Last Updated:** 2025-12-17

---

## Component Purpose

Consistent page wrapper for all Settings pages. Provides standardized spacing, optional title/description header, and content area. Ensures visual consistency across all 14 Settings pages.

**Usage:** Wraps content on every Settings page to provide consistent layout and spacing.

---

## ASCII Wireframe

### With Title and Description

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Organization Profile                                         │
│  Manage your organization's basic information and settings.   │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  [Page Content Here]                                          │
│                                                               │
│  Form fields, tables, or other page-specific components       │
│  rendered as children of this layout component.              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Without Title (Children Only)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  [Page Content Here]                                          │
│                                                               │
│  Custom page content renders directly without header.         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### With Title Only (No Description)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Audit Logs                                                   │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  [Page Content Here]                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Layout Specifications

### Container
- **Display**: Flex column (flex flex-col)
- **Spacing**: Vertical gap 24px (space-y-6)
- **Padding**: 24px all sides (p-6)
- **Width**: Full width (w-full)
- **Max Width**: None (content determines width)

### Header Section (Optional)
- **Display**: Flex column
- **Spacing**: Vertical gap 8px (space-y-2)
- **Margin Bottom**: 16px (mb-4)

### Title (Optional)
- **Typography**: 24px (text-2xl), font-bold (700)
- **Color**: `text-foreground`
- **Line Height**: 1.2

### Description (Optional)
- **Typography**: 14px (text-sm), normal weight
- **Color**: `text-muted-foreground`
- **Line Height**: 1.5
- **Max Width**: 672px (max-w-prose)

### Divider (If Title Present)
- **Border**: 1px solid (border-b)
- **Color**: `border` color (border-border)
- **Margin**: 16px bottom (mb-4)

### Content Area
- **Display**: Default block
- **Children**: Rendered as-is

---

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | React.ReactNode | Yes | - | Page content to render |
| `title` | string | No | undefined | Page title (h1) |
| `description` | string | No | undefined | Page description text |

---

## Component Variants

### Variant 1: Full Header (Title + Description)

**Props**:
```typescript
{
  title: "Organization Profile",
  description: "Manage your organization's basic information and settings.",
  children: <OrganizationForm />
}
```

**Use Case**: Most Settings pages (Organization Profile, Users, Warehouses, etc.)

---

### Variant 2: Title Only

**Props**:
```typescript
{
  title: "Audit Logs",
  children: <AuditLogTable />
}
```

**Use Case**: Pages where description is redundant or obvious

---

### Variant 3: Content Only (No Header)

**Props**:
```typescript
{
  children: <CustomPageContent />
}
```

**Use Case**: Pages with custom headers or dashboards (e.g., Settings landing page)

---

## States

### Default
- **Display**: Container + optional header + children
- **Accessibility**: Title uses `<h1>` for semantic hierarchy

### No Title
- **Display**: Container + children only
- **No Divider**: Divider not rendered

### Empty Children
- **Display**: Container + optional header + empty content area
- **Fallback**: Component still renders structure

---

## Interaction Patterns

### No Direct Interactions
- **Passive Wrapper**: No buttons or interactive elements
- **Content Driven**: All interactions come from children components

---

## Accessibility

### Semantic HTML
- **Container**: `<div className="settings-layout">`
- **Header**: `<div className="settings-header">` (if title provided)
- **Title**: `<h1>{title}</h1>` (semantic heading)
- **Description**: `<p className="settings-description">{description}</p>`
- **Content**: `<div className="settings-content">{children}</div>`

### Heading Hierarchy
- **h1**: Page title (this component)
- **h2**: Section headings (child components)
- **h3**: Subsection headings (child components)

### Screen Reader
- **Title Announcement**: "Page: {title}"
- **Description**: Read as normal text after title

### Keyboard Navigation
- **No Focusable Elements**: Layout is purely structural
- **Focus Flows to Children**: Tab order determined by child components

### Contrast
- **Title**: `text-foreground` (7:1 on background)
- **Description**: `text-muted-foreground` (4.5:1 on background)

---

## Technical Implementation

### Component File
`apps/frontend/components/settings/SettingsLayout.tsx`

### Dependencies
- React
- TailwindCSS utilities

### Example Code

```typescript
interface SettingsLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function SettingsLayout({
  children,
  title,
  description,
}: SettingsLayoutProps) {
  return (
    <div className="flex flex-col space-y-6 p-6">
      {title && (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground max-w-prose">
                {description}
              </p>
            )}
          </div>
          <div className="border-b mb-4" />
        </>
      )}
      <div>
        {children}
      </div>
    </div>
  );
}
```

---

## Usage Examples

### Example 1: Organization Profile

```tsx
export default function OrganizationProfilePage() {
  return (
    <SettingsLayout
      title="Organization Profile"
      description="Manage your organization's basic information and settings."
    >
      <OrganizationForm />
    </SettingsLayout>
  );
}
```

### Example 2: Users Page

```tsx
export default function UsersPage() {
  return (
    <SettingsLayout
      title="User Management"
      description="Invite and manage team members, assign roles, and control access."
    >
      <UserTable />
    </SettingsLayout>
  );
}
```

### Example 3: Audit Logs (Title Only)

```tsx
export default function AuditLogsPage() {
  return (
    <SettingsLayout
      title="Audit Logs"
    >
      <AuditLogTable />
    </SettingsLayout>
  );
}
```

### Example 4: Settings Dashboard (No Header)

```tsx
export default function SettingsPage() {
  return (
    <SettingsLayout>
      <SettingsDashboard />
    </SettingsLayout>
  );
}
```

---

## Related Components

- **SettingsNav**: Navigation sidebar (sibling in Settings module layout)
- **SettingsEmptyState**: Used as children for unimplemented pages
- **Error Boundaries**: Wrap this component for error handling

---

## Design Tokens

### Spacing
- **Container Padding**: 24px (p-6)
- **Vertical Spacing**: 24px (space-y-6)
- **Header Spacing**: 8px (space-y-2)
- **Divider Margin Bottom**: 16px (mb-4)

### Typography
- **Title Font Size**: 24px (text-2xl)
- **Title Font Weight**: 700 (font-bold)
- **Title Line Height**: 1.2
- **Description Font Size**: 14px (text-sm)
- **Description Font Weight**: 400 (normal)
- **Description Line Height**: 1.5
- **Description Max Width**: 672px (max-w-prose)

### Colors
- **Title Color**: `text-foreground` (hsl(var(--foreground)))
- **Description Color**: `text-muted-foreground` (hsl(var(--muted-foreground)))
- **Divider Color**: `border-border` (hsl(var(--border)))

---

## Responsive Behavior

### Desktop (>= 768px)
- **Padding**: 24px (p-6)
- **Title Font Size**: 24px (text-2xl)
- **Description Max Width**: 672px (max-w-prose)

### Tablet (768-1024px)
- **Padding**: 24px (p-6)
- **Title Font Size**: 24px (text-2xl)
- **Description Max Width**: 100% (responsive)

### Mobile (< 768px)
- **Padding**: 16px (p-4)
- **Title Font Size**: 20px (text-xl)
- **Description Font Size**: 13px (text-xs)
- **Vertical Spacing**: 16px (space-y-4)

---

## Pattern Consistency

### All Settings Pages Should Use This Layout

| Page | Title | Description | Children |
|------|-------|-------------|----------|
| Organization Profile | "Organization Profile" | "Manage your organization..." | OrganizationForm |
| Users | "User Management" | "Invite and manage team members..." | UserTable |
| Roles & Permissions | "Roles & Permissions" | "View system roles..." | RoleMatrix |
| Invitations | "Pending Invitations" | "Manage pending user invites..." | InvitationTable |
| Warehouses | "Warehouses" | "Manage warehouse locations..." | WarehouseTable |
| Machines | "Machines" | "Register and manage machines..." | MachineTable |
| Production Lines | "Production Lines" | "Configure production lines..." | LineTable |
| Allergens | "Allergen Management" | "Configure allergens for products..." | AllergenTable |
| Tax Codes | "Tax Codes" | "Manage tax rates and codes..." | TaxCodeTable |
| Modules | "Module Configuration" | "Enable or disable system modules..." | ModuleToggles |
| API Keys | "API Keys" | "Manage API access keys..." | APIKeyTable |
| Webhooks | "Webhooks" | "Configure event webhooks..." | WebhookTable |
| Audit Logs | "Audit Logs" | - | AuditLogTable |
| Security | "Security Settings" | "Configure security policies..." | SecurityForm |

---

## Quality Gates

- [✓] Consistent spacing across all pages (space-y-6, p-6)
- [✓] Optional title and description props
- [✓] Semantic h1 for title
- [✓] Responsive padding adjustments
- [✓] No layout shift when title/description added or removed
- [✓] Accessible heading hierarchy

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [COMP-003-settings-layout]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV handoff
