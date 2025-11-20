# UX Design: Authentication & Main Dashboard

**Generated:** 2025-11-20
**Stories:** 1.0 (Authentication UI), 1.13 (Main Dashboard)
**Status:** Draft
**Design System:** MonoPilot Design System (Shadcn/UI + Tailwind CSS)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication UI Design](#authentication-ui-design)
   - Login Page
   - Forgot Password Page
   - Reset Password Page
   - User Menu Dropdown
3. [Main Dashboard Design](#main-dashboard-design)
   - Layout & Navigation
   - Module Overview Cards
   - Activity Feed
   - Quick Actions
   - Welcome Banner
4. [Design Tokens](#design-tokens)
5. [Responsive Behavior](#responsive-behavior)
6. [Accessibility](#accessibility)
7. [Validation & Error States](#validation--error-states)

---

## Overview

This document defines the UX/UI design for:
1. **Authentication UI** (Story 1.0): Login, logout, forgot/reset password flows
2. **Main Dashboard** (Story 1.13): Landing page after login with module overview

**Design Principles:**
- **Clarity**: Clear information hierarchy, obvious CTAs
- **Efficiency**: Minimal clicks to complete tasks
- **Consistency**: Align with Shadcn/UI component patterns
- **Responsiveness**: Mobile-first approach, works on all devices
- **Accessibility**: WCAG 2.1 AA compliance

**Tech Stack:**
- Tailwind CSS 3.4
- Shadcn/UI components
- Lucide React icons
- Next.js 15 App Router

---

## Authentication UI Design

### 1. Login Page (`/login`)

#### Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│           [Gradient Background]             │
│                                             │
│     ┌───────────────────────────┐           │
│     │   [MonoPilot Logo]        │           │
│     │                           │           │
│     │   Email                   │           │
│     │   [___________________]   │           │
│     │                           │           │
│     │   Password                │           │
│     │   [___________________]   │           │
│     │                           │           │
│     │   ☐ Remember me           │           │
│     │                           │           │
│     │   [  Sign In  ]           │           │
│     │                           │           │
│     │   Forgot password?        │           │
│     └───────────────────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```

#### Specifications

**Card Container:**
- Max width: `max-w-md` (448px)
- Padding: `p-8`
- Border radius: `rounded-xl`
- Shadow: `shadow-2xl`
- Background: `bg-white dark:bg-gray-900`
- Centered horizontally and vertically

**Background:**
- Gradient: `bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50`
- Dark mode: `dark:from-gray-900 dark:via-gray-800 dark:to-gray-900`

**Logo:**
- Size: 64px x 64px (SVG or image)
- Position: Centered, 32px margin-bottom
- Alt text: "MonoPilot Manufacturing Execution System"

**Form Inputs:**
- Component: Shadcn/UI `<Input>` component
- Width: Full width (`w-full`)
- Height: `h-12`
- Border: `border border-gray-300`
- Focus: `focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- Spacing: 24px between inputs (`space-y-6`)

**"Remember Me" Checkbox:**
- Component: Shadcn/UI `<Checkbox>` component
- Label: `text-sm text-gray-600 dark:text-gray-400`
- Position: Left-aligned, 16px below password input

**Submit Button:**
- Component: Shadcn/UI `<Button>` component
- Variant: `default` (primary blue)
- Size: `lg`
- Width: Full width (`w-full`)
- Height: `h-12`
- Text: "Sign In"
- Loading state: Spinner icon + "Signing in..."

**"Forgot Password?" Link:**
- Component: `<Link>` with Shadcn/UI link styles
- Color: `text-blue-600 hover:text-blue-700 dark:text-blue-400`
- Font size: `text-sm`
- Position: Centered, 16px below button
- Underline: On hover

#### Interaction States

**Default:**
- Inputs empty
- Button enabled
- No error messages

**Focused:**
- Input has blue ring (`ring-2 ring-blue-500`)
- Label color darkens

**Error:**
- Input border red (`border-red-500`)
- Error message below input (`text-red-600 text-sm`)
- Toast notification (top-right): "Invalid email or password"

**Loading:**
- Button disabled with spinner
- Text changes to "Signing in..."
- Inputs disabled

**Success:**
- Redirect to `/dashboard` (or `?redirect` param)
- Success toast: "Welcome back!"

---

### 2. Forgot Password Page (`/forgot-password`)

#### Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│           [Gradient Background]             │
│                                             │
│     ┌───────────────────────────┐           │
│     │   [MonoPilot Logo]        │           │
│     │                           │           │
│     │   Reset Your Password     │           │
│     │   Enter your email and    │           │
│     │   we'll send you a link   │           │
│     │                           │           │
│     │   Email                   │           │
│     │   [___________________]   │           │
│     │                           │           │
│     │   [Send Reset Link]       │           │
│     │                           │           │
│     │   ← Back to login         │           │
│     └───────────────────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```

#### Specifications

**Heading:**
- Text: "Reset Your Password"
- Font: `text-2xl font-bold`
- Color: `text-gray-900 dark:text-white`
- Margin: 16px bottom

**Subtext:**
- Text: "Enter your email and we'll send you a link"
- Font: `text-sm`
- Color: `text-gray-600 dark:text-gray-400`
- Margin: 24px bottom

**Success State:**
- Replace form with success message card
- Icon: Check circle (green)
- Message: "Check your email for a reset link"
- Subtext: "If an account exists for {email}, you'll receive a password reset email."
- "Back to login" link

**Security Note:**
- Always show success message (even if email doesn't exist)
- Prevents email enumeration attacks

---

### 3. Reset Password Page (`/reset-password?token={token}`)

#### Layout

```
┌─────────────────────────────────────────────┐
│                                             │
│           [Gradient Background]             │
│                                             │
│     ┌───────────────────────────┐           │
│     │   [MonoPilot Logo]        │           │
│     │                           │           │
│     │   Create New Password     │           │
│     │                           │           │
│     │   New Password            │           │
│     │   [___________________]   │           │
│     │   [Strength Indicator]    │           │
│     │                           │           │
│     │   Confirm Password        │           │
│     │   [___________________]   │           │
│     │                           │           │
│     │   [Reset Password]        │           │
│     └───────────────────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```

#### Password Strength Indicator

**Component:** Custom component with 3 strength levels

```
Weak:     [▮▯▯▯] Weak
Medium:   [▮▮▯▯] Medium
Strong:   [▮▮▮▮] Strong
```

**Colors:**
- Weak: Red (`bg-red-500`)
- Medium: Yellow (`bg-yellow-500`)
- Strong: Green (`bg-green-500`)

**Criteria:**
- Weak: < 8 chars
- Medium: 8+ chars, 1 uppercase OR 1 number
- Strong: 8+ chars, 1 uppercase AND 1 number

**Position:** Below "New Password" input, 8px margin

**Requirements List:**
```
Password must contain:
✓ At least 8 characters
✓ One uppercase letter
✓ One number
```

- Green checkmark if met, gray if not
- Font size: `text-sm`
- Color: `text-gray-600` (unmet), `text-green-600` (met)

---

### 4. User Menu Dropdown (Top-Right Navigation)

#### Layout

```
┌────────────────────────┐
│  [Avatar] John Doe  ▼  │
└────────────────────────┘
        ↓
┌────────────────────────┐
│  John Doe              │
│  admin@monopilot.com   │
├────────────────────────┤
│  👤 Profile            │
│  ⚙️  Settings          │
├────────────────────────┤
│  🚪 Logout             │
│  🚪 Logout All Devices │
└────────────────────────┘
```

#### Specifications

**Trigger Button:**
- Avatar: 32px circle (initials if no profile pic)
- Name: `text-sm font-medium`
- Chevron down icon
- Hover: `bg-gray-100 dark:bg-gray-800`

**Dropdown Menu:**
- Component: Shadcn/UI `<DropdownMenu>`
- Width: `min-w-[200px]`
- Shadow: `shadow-lg`
- Border: `border border-gray-200`

**User Info Section:**
- Name: `text-sm font-semibold`
- Email: `text-xs text-gray-500`
- Padding: `p-3`
- Background: `bg-gray-50 dark:bg-gray-800`

**Menu Items:**
- Icons: Lucide React icons (16px)
- Hover: `bg-gray-100 dark:bg-gray-800`
- Cursor: `cursor-pointer`

**Logout Confirmation (for "Logout All Devices"):**
- Modal dialog: Shadcn/UI `<AlertDialog>`
- Title: "Logout from all devices?"
- Description: "This will end all active sessions. You'll need to log in again on all devices."
- Actions: "Cancel" (secondary), "Logout All" (destructive red)

---

## Main Dashboard Design

### 1. Layout & Navigation

#### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Settings Planning Production ... [Search] [User]    │ Top Nav
├─────┬───────────────────────────────────────────────┬───────┤
│ S   │                                               │ Act.  │
│ i   │   Welcome Banner (if new user)                │ Feed  │
│ d   ├───────────────────────────────────────────────┤       │
│ e   │   [Quick Actions: Create ▼  Search]           │ - WO  │
│ b   ├───────────────────────────────────────────────┤ - PO  │
│ a   │   Module Cards Grid (2-4 columns)             │ - LP  │
│ r   │   ┌────┐ ┌────┐ ┌────┐ ┌────┐               │ - NCR │
│     │   │Set │ │Tech│ │Plan│ │Prod│               │ ...   │
│ [▸] │   └────┘ └────┘ └────┘ └────┘               │       │
│     │   ┌────┐ ┌────┐ ┌────┐ ┌────┐               │ View  │
│     │   │Ware│ │QA  │ │Ship│ │NPD │               │ All   │
│     │   └────┘ └────┘ └────┘ └────┘               │       │
│     │                                               │       │
└─────┴───────────────────────────────────────────────┴───────┘
```

#### Mobile Layout (<768px)

```
┌─────────────────────────────────┐
│  [Logo] [Search] [User]         │ Top Nav
├─────────────────────────────────┤
│  Welcome Banner (if new user)   │
├─────────────────────────────────┤
│  [Quick Actions: Create ▼]      │
├─────────────────────────────────┤
│  Module Cards (1 column)        │
│  ┌──────────────────────────┐   │
│  │ Settings                 │   │
│  └──────────────────────────┘   │
│  ┌──────────────────────────┐   │
│  │ Technical                │   │
│  └──────────────────────────┘   │
│  ...                            │
├─────────────────────────────────┤
│  Activity Feed                  │
│  - WO-2024-001 started          │
│  - PO-2024-042 approved         │
├─────────────────────────────────┤
│  [Home] [Modules] [Create] [Me] │ Bottom Nav
└─────────────────────────────────┘
```

---

### 2. Top Navigation Bar

#### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  Settings  Planning  Production  Warehouse  QA  ... │
│                             [Global Search]   [🔔] [User ▼] │
└─────────────────────────────────────────────────────────────┘
```

**Specifications:**

**Container:**
- Height: `h-16` (64px)
- Background: `bg-white dark:bg-gray-900`
- Border bottom: `border-b border-gray-200`
- Shadow: `shadow-sm`

**Logo:**
- Size: 40px x 40px
- Margin: 12px left
- Clickable → `/dashboard`

**Module Links:**
- Font: `text-sm font-medium`
- Color: `text-gray-700 hover:text-blue-600`
- Active state: `text-blue-600 border-b-2 border-blue-600`
- Spacing: 24px between links

**Global Search:**
- Component: Shadcn/UI `<Input>` with search icon
- Width: `w-64`
- Placeholder: "Search WO, PO, LP, Product..."
- Debounced input (300ms)
- Dropdown with results on focus

**Notifications Bell:**
- Icon: Lucide `Bell` icon
- Badge: Red dot if unread (future)
- Dropdown: Notifications list (future)

**User Menu:**
- See "User Menu Dropdown" in Auth UI section

---

### 3. Sidebar Navigation

#### Specifications

**Container:**
- Width: `w-64` (expanded), `w-16` (collapsed)
- Background: `bg-gray-50 dark:bg-gray-800`
- Border right: `border-r border-gray-200`
- Transition: `transition-width duration-200`

**Collapse Toggle:**
- Button at top of sidebar
- Icon: `ChevronLeft` (expanded), `ChevronRight` (collapsed)
- Position: Absolute, top-right

**Module Items:**
- Height: `h-12`
- Hover: `bg-gray-100 dark:bg-gray-700`
- Active: `bg-blue-50 border-l-4 border-blue-600`
- Icon: 24px Lucide icon
- Label: `text-sm` (hidden when collapsed)

**Module Icons & Colors:**
- Settings: `Settings` icon, gray (`text-gray-600`)
- Technical: `Wrench` icon, blue (`text-blue-600`)
- Planning: `Calendar` icon, indigo (`text-indigo-600`)
- Production: `Factory` icon, green (`text-green-600`)
- Warehouse: `Warehouse` icon, orange (`text-orange-600`)
- Quality: `ShieldCheck` icon, red (`text-red-600`)
- Shipping: `Truck` icon, purple (`text-purple-600`)
- NPD: `Lightbulb` icon, pink (`text-pink-600`)

---

### 4. Module Overview Cards

#### Card Layout

```
┌────────────────────────┐
│  [Icon] Module Name    │
│                        │
│  5 Active WOs          │
│  12 Pending POs        │
│                        │
│  [Create WO]           │
│  View Details →        │
└────────────────────────┘
```

#### Specifications

**Card Container:**
- Component: Shadcn/UI `<Card>`
- Width: `w-full` (responsive grid)
- Padding: `p-6`
- Border: `border border-gray-200`
- Border radius: `rounded-lg`
- Shadow: `shadow-sm hover:shadow-md` (elevation on hover)
- Transition: `transition-shadow duration-200`

**Grid Layout:**
- Desktop (xl): 4 columns (`grid-cols-4`)
- Desktop (lg): 3 columns (`grid-cols-3`)
- Tablet (md): 2 columns (`grid-cols-2`)
- Mobile (sm): 1 column (`grid-cols-1`)
- Gap: `gap-6`

**Module Icon:**
- Size: 48px
- Background: Color-coded circle (`bg-{color}-100`)
- Icon color: `text-{color}-600`
- Position: Top-left, 16px margin-bottom

**Module Name:**
- Font: `text-xl font-semibold`
- Color: `text-gray-900 dark:text-white`
- Margin: 8px below icon

**Stats:**
- Font: `text-sm`
- Color: `text-gray-600 dark:text-gray-400`
- Line height: `leading-relaxed`
- Margin: 16px top and bottom

**Primary Action Button:**
- Component: Shadcn/UI `<Button>`
- Variant: `default` (primary)
- Size: `sm`
- Width: Full width (`w-full`)
- Text: e.g., "Create WO", "Add Product", "New NCR"

**"View Details" Link:**
- Font: `text-sm`
- Color: `text-blue-600 hover:text-blue-700`
- Icon: `ArrowRight` (Lucide, 16px)
- Position: Bottom-right
- Margin: 8px top

---

### 5. Activity Feed

#### Layout

```
┌─────────────────────────────────┐
│  Recent Activity                │
├─────────────────────────────────┤
│  [Icon] WO-2024-001 started     │
│         by John Doe             │
│         2 minutes ago           │
├─────────────────────────────────┤
│  [Icon] PO-2024-042 approved    │
│         by Admin                │
│         15 minutes ago          │
├─────────────────────────────────┤
│  [Icon] LP-00123 received       │
│         at WH-01                │
│         1 hour ago              │
├─────────────────────────────────┤
│  View All →                     │
└─────────────────────────────────┘
```

#### Specifications

**Container:**
- Width: `w-80` (desktop), full width (mobile)
- Background: `bg-white dark:bg-gray-900`
- Border: `border border-gray-200`
- Border radius: `rounded-lg`
- Padding: `p-4`

**Heading:**
- Text: "Recent Activity"
- Font: `text-lg font-semibold`
- Color: `text-gray-900 dark:text-white`
- Margin: 16px bottom

**Activity Item:**
- Height: `min-h-[72px]`
- Padding: `p-3`
- Hover: `bg-gray-50 dark:bg-gray-800`
- Border bottom: `border-b border-gray-100` (except last)
- Cursor: `cursor-pointer`

**Activity Icon:**
- Size: 32px circle
- Background: Color-coded based on activity type
  - WO: Green (`bg-green-100 text-green-600`)
  - PO: Blue (`bg-blue-100 text-blue-600`)
  - LP: Orange (`bg-orange-100 text-orange-600`)
  - NCR: Red (`bg-red-100 text-red-600`)
- Icon: Lucide icon (16px)

**Activity Description:**
- Font: `text-sm font-medium`
- Color: `text-gray-900 dark:text-white`
- Line 1: Entity code + action (bold)
- Line 2: "by {User}" (lighter)
- Line 3: Relative time (lightest)

**Relative Time:**
- Font: `text-xs`
- Color: `text-gray-500 dark:text-gray-400`
- Library: date-fns `formatDistanceToNow()`

**"View All" Link:**
- Position: Bottom-center
- Font: `text-sm`
- Color: `text-blue-600 hover:text-blue-700`
- Icon: `ArrowRight`

---

### 6. Quick Actions Toolbar

#### Layout

```
┌──────────────────────────────────────────────────────┐
│  [Create ▼]  [Search: ________________] [🔔 3]       │
└──────────────────────────────────────────────────────┘
```

#### Specifications

**Container:**
- Height: `h-14`
- Padding: `px-6 py-3`
- Background: `bg-gray-50 dark:bg-gray-800`
- Border bottom: `border-b border-gray-200`

**Create Dropdown Button:**
- Component: Shadcn/UI `<DropdownMenu>`
- Trigger: `<Button variant="default">`
- Text: "Create"
- Icon: `Plus` icon (left), `ChevronDown` (right)

**Dropdown Menu Items:**
- "Create Purchase Order" → `/planning/purchase-orders/new`
- "Create Work Order" → `/production/work-orders/new`
- "Create NCR" → `/quality/ncr/new`
- "Create Transfer Order" → `/warehouse/transfers/new`
- Conditional: Only show items for enabled modules

**Global Search Bar:**
- Width: `w-96` (desktop), `flex-1` (mobile)
- Placeholder: "Search WO, PO, LP, Product..."
- Icon: `Search` (left side)
- Debounced: 300ms
- Dropdown with results (see "Search Results Dropdown")

**Notifications Bell:**
- Icon: `Bell` (Lucide, 20px)
- Badge: Red circle with count (e.g., "3")
- Hover: `bg-gray-100 dark:bg-gray-700`
- Future: Dropdown with notifications list

---

### 7. Welcome Banner (New Users)

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  👋 Welcome to MonoPilot!                           │
│  Let's set up your organization.                    │
│                                                     │
│  [Start Setup Wizard]  [Skip for now]              │
└─────────────────────────────────────────────────────┘
```

#### Specifications

**Container:**
- Background: Gradient `bg-gradient-to-r from-blue-500 to-indigo-600`
- Text color: `text-white`
- Padding: `p-6`
- Border radius: `rounded-lg`
- Margin: 24px bottom

**Heading:**
- Font: `text-2xl font-bold`
- Icon: Waving hand emoji (👋) or Lucide `Sparkles` icon

**Subtext:**
- Font: `text-base`
- Opacity: `opacity-90`
- Margin: 8px top

**Buttons:**
- Primary: "Start Setup Wizard" (white button, blue text)
- Secondary: "Skip for now" (transparent, white outline)
- Spacing: 16px between buttons

**Dismiss Logic:**
- Show only if `organizations.setup_completed = false`
- "Skip for now" sets `setup_completed = true`
- Wizard completion sets `setup_completed = true`

---

### 8. Empty State (No Modules Enabled)

#### Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              [Empty Box Icon]                       │
│                                                     │
│         No modules are enabled                      │
│    Enable modules in Settings to get started        │
│                                                     │
│            [Go to Settings]                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Specifications

**Container:**
- Centered vertically and horizontally
- Max width: `max-w-md`

**Icon:**
- Lucide `PackageOpen` icon
- Size: 96px
- Color: `text-gray-300`

**Heading:**
- Text: "No modules are enabled"
- Font: `text-xl font-semibold`
- Color: `text-gray-700`
- Margin: 16px top

**Subtext:**
- Text: "Enable modules in Settings to get started"
- Font: `text-sm`
- Color: `text-gray-500`
- Margin: 8px top

**CTA Button:**
- Text: "Go to Settings"
- Link: `/settings/modules`
- Component: Shadcn/UI `<Button variant="default">`
- Margin: 24px top

---

## Design Tokens

### Colors

**Primary Blue:**
- 50: `#eff6ff`
- 100: `#dbeafe`
- 500: `#3b82f6` (primary)
- 600: `#2563eb` (hover)
- 700: `#1d4ed8` (active)

**Module Colors:**
- Settings: Gray 600 `#4b5563`
- Technical: Blue 600 `#2563eb`
- Planning: Indigo 600 `#4f46e5`
- Production: Green 600 `#16a34a`
- Warehouse: Orange 600 `#ea580c`
- Quality: Red 600 `#dc2626`
- Shipping: Purple 600 `#9333ea`
- NPD: Pink 600 `#db2777`

**Semantic Colors:**
- Success: Green 600 `#16a34a`
- Warning: Yellow 600 `#ca8a04`
- Error: Red 600 `#dc2626`
- Info: Blue 600 `#2563eb`

### Typography

**Font Family:**
- Sans: `Inter, system-ui, -apple-system, sans-serif`
- Mono: `'Fira Code', 'Courier New', monospace`

**Font Sizes:**
- xs: `12px` (0.75rem)
- sm: `14px` (0.875rem)
- base: `16px` (1rem)
- lg: `18px` (1.125rem)
- xl: `20px` (1.25rem)
- 2xl: `24px` (1.5rem)
- 3xl: `30px` (1.875rem)

**Font Weights:**
- normal: 400
- medium: 500
- semibold: 600
- bold: 700

### Spacing

**Base unit:** 4px (0.25rem)

- 1: `4px`
- 2: `8px`
- 3: `12px`
- 4: `16px`
- 6: `24px`
- 8: `32px`
- 12: `48px`
- 16: `64px`

### Border Radius

- sm: `4px`
- DEFAULT: `8px`
- md: `8px`
- lg: `12px`
- xl: `16px`
- 2xl: `24px`
- full: `9999px` (circles)

### Shadows

- sm: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- DEFAULT: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
- md: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- lg: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- xl: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`
- 2xl: `0 25px 50px -12px rgb(0 0 0 / 0.25)`

---

## Responsive Behavior

### Breakpoints

- sm: `640px`
- md: `768px`
- lg: `1024px`
- xl: `1280px`
- 2xl: `1536px`

### Layout Changes

#### Desktop (≥1024px)
- Sidebar: Visible, expanded
- Module cards: 3-4 columns
- Activity feed: Right sidebar
- Top nav: Full module links

#### Tablet (768px - 1023px)
- Sidebar: Collapsed (icon only)
- Module cards: 2-3 columns
- Activity feed: Below cards
- Top nav: Hamburger menu for modules

#### Mobile (<768px)
- Sidebar: Hidden
- Module cards: 1 column
- Activity feed: Separate tab or bottom
- Top nav: Minimal (logo + search + user)
- Bottom nav: Home, Modules, Create, Profile

### Mobile Navigation Pattern

**Bottom Navigation Bar:**
```
┌───────┬───────┬───────┬───────┐
│ Home  │ Mods  │ Create│  Me   │
└───────┴───────┴───────┴───────┘
```

- Height: `h-16`
- Icons: Lucide 24px
- Labels: `text-xs`
- Active state: `text-blue-600`

---

## Accessibility

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text: Minimum 4.5:1 contrast ratio
- Large text (≥18px): Minimum 3:1
- Interactive elements: 3:1 contrast with background

**Keyboard Navigation:**
- All interactive elements: `Tab` to focus, `Enter` to activate
- Dropdowns: `Arrow keys` to navigate, `Esc` to close
- Modals: `Esc` to close, focus trap inside modal

**Screen Reader Support:**
- Semantic HTML: `<nav>`, `<main>`, `<aside>`, `<button>`, `<a>`
- ARIA labels: `aria-label`, `aria-labelledby`, `aria-describedby`
- Focus indicators: Visible `focus:ring-2 focus:ring-blue-500`

**Form Labels:**
- All inputs have associated `<label>` elements
- Placeholder text is NOT used as label replacement
- Error messages associated with inputs via `aria-describedby`

**Skip Links:**
- "Skip to main content" link (hidden, visible on focus)

---

## Validation & Error States

### Input Validation

**Inline Validation (on blur):**
- Email: Valid email format check
- Password: Min 8 chars, 1 uppercase, 1 number
- Required fields: Non-empty check

**Visual Indicators:**
- Valid: Green border (`border-green-500`), checkmark icon
- Invalid: Red border (`border-red-500`), error message below
- Neutral: Default gray border

**Error Message Format:**
```
[Input field with red border]
⚠️ Password must be at least 8 characters
```

- Icon: Warning triangle (red)
- Text: `text-red-600 text-sm`
- Position: Below input, 4px margin

### Toast Notifications

**Component:** Shadcn/UI `<Toast>` component

**Types:**
- Success: Green background, checkmark icon
- Error: Red background, X icon
- Info: Blue background, info icon
- Warning: Yellow background, warning icon

**Position:** Top-right corner

**Duration:**
- Success: 3 seconds
- Error: 5 seconds
- Info: 4 seconds

**Example:**
```
┌────────────────────────────────┐
│ ✓  Successfully logged in      │
│    Welcome back, John!         │
└────────────────────────────────┘
```

### Loading States

**Skeleton Loaders:**
- Used for: Module cards, activity feed items
- Component: Shadcn/UI `<Skeleton>` component
- Animation: Shimmer effect (`animate-pulse`)

**Spinner:**
- Component: Lucide `Loader2` icon with `animate-spin`
- Size: 20px (buttons), 32px (full-page)
- Color: `text-blue-600`

**Button Loading State:**
```
[🔄 Signing in...]
```
- Spinner icon (left)
- Text changes (e.g., "Sign In" → "Signing in...")
- Button disabled

---

## Design Files

**Figma:**
- [Link to Figma design file] (to be created)

**Component Library:**
- Shadcn/UI: https://ui.shadcn.com/
- Lucide Icons: https://lucide.dev/

**Accessibility Checker:**
- WAVE Browser Extension
- axe DevTools

---

## Changelog

- **2025-11-20**: Initial draft - Authentication UI & Main Dashboard designs
- **Future**: Add Figma mockups, interactive prototypes

---

## Appendix: Zod Validation Schemas

### LoginSchema

```typescript
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
})

export type LoginInput = z.infer<typeof LoginSchema>
```

### ResetPasswordSchema

```typescript
export const ResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>
```

### ForgotPasswordSchema

```typescript
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>
```

---

**End of Document**
