# Story 1.15: Settings Dashboard Landing Page

**Epic:** 1 - Foundation & Settings
**Status:** In Progress
**Priority:** P0 (Blocker)
**Story Points:** 3
**Created:** 2025-11-22

---

## Goal

Create a Settings landing page (`/settings`) that provides a visual dashboard overview of all available settings sections, allowing users to easily discover and navigate to different configuration areas.

## User Story

**As a** system administrator
**I want** a Settings dashboard that shows all available configuration options
**So that** I can quickly understand what settings are available and navigate to the section I need

---

## Problem Statement

Currently, when users click "Settings" in the sidebar (`href="/settings"`), there is no landing page - only nested routes exist:
- `/settings/organization`
- `/settings/users`
- `/settings/warehouses`
- `/settings/locations`
- `/settings/machines`
- `/settings/production-lines`
- `/settings/allergens`
- `/settings/tax-codes`
- `/settings/modules`
- `/settings/wizard`

This creates a poor UX where:
1. Users get a 404 or blank page when clicking Settings
2. Users don't know what settings are available
3. Navigation requires knowing exact URLs

---

## Acceptance Criteria

### AC-015.1: Settings Dashboard Page Structure
**Given** I am logged in as any user
**When** I navigate to `/settings` or click "Settings" in sidebar
**Then** I should see a Settings Dashboard page with:
- Page title: "Settings"
- Subtitle: "Configure your MonoPilot system"
- Grid of setting cards/modules organized by category

**Success Criteria:**
- Page loads successfully at `/settings` route
- Consistent with main dashboard design pattern
- Responsive layout (grid adapts to screen size)

---

### AC-015.2: Settings Cards/Modules Display
**Given** I am on the Settings Dashboard
**Then** I should see cards for each settings section:

**Organization & Users:**
1. **Organization Settings**
   - Icon: Building/Briefcase
   - Description: "Company profile, logo, and basic information"
   - Link: `/settings/organization`

2. **User Management**
   - Icon: Users
   - Description: "Manage users, roles, and permissions"
   - Link: `/settings/users`

**Warehouse & Facilities:**
3. **Warehouses**
   - Icon: Warehouse
   - Description: "Configure warehouse locations and sites"
   - Link: `/settings/warehouses`

4. **Locations**
   - Icon: MapPin
   - Description: "Manage storage locations and bins"
   - Link: `/settings/locations`

5. **Machines**
   - Icon: Cpu/Cog
   - Description: "Configure production equipment"
   - Link: `/settings/machines`

6. **Production Lines**
   - Icon: Factory
   - Description: "Set up production line configurations"
   - Link: `/settings/production-lines`

**Product Configuration:**
7. **Allergens**
   - Icon: AlertTriangle
   - Description: "Manage allergen tags for products"
   - Link: `/settings/allergens`

8. **Tax Codes**
   - Icon: Receipt
   - Description: "Configure VAT and tax codes"
   - Link: `/settings/tax-codes`

**System Configuration:**
9. **Module Activation**
   - Icon: Grid/Package
   - Description: "Enable/disable system modules"
   - Link: `/settings/modules`

10. **Setup Wizard**
    - Icon: Wand/Sparkles
    - Description: "Initial system setup assistant"
    - Link: `/settings/wizard`

**Success Criteria:**
- All 10 setting sections displayed as cards
- Each card has icon, title, description, and clickable link
- Cards use consistent styling and spacing
- Hover states provide visual feedback

---

### AC-015.3: Card Interaction & Navigation
**Given** I am on the Settings Dashboard
**When** I click on any settings card
**Then** I should be navigated to the corresponding settings page

**Success Criteria:**
- All cards are clickable and navigate correctly
- Navigation uses Next.js Link component (client-side navigation)
- Active/hover states provide clear visual feedback

---

### AC-015.4: Responsive Layout
**Given** I am on the Settings Dashboard
**When** I view the page on different screen sizes
**Then** the card grid should adapt responsively:
- **Mobile (< 768px):** 1 column
- **Tablet (768px - 1024px):** 2 columns
- **Desktop (> 1024px):** 3 columns

**Success Criteria:**
- Grid layout uses Tailwind responsive classes
- Cards maintain readable spacing on all screen sizes
- No horizontal scrolling required

---

### AC-015.5: Consistent Layout with Application
**Given** I am on the Settings Dashboard
**Then** the page should:
- Use the same layout wrapper as other pages (Sidebar + Topbar)
- Match the visual design of the main dashboard
- Use consistent typography, colors, and spacing from design system

**Success Criteria:**
- Sidebar is visible on the left
- Topbar with UserMenu is visible at top
- Page follows same container/padding pattern as main dashboard
- Uses shadcn/ui Card component for consistency

---

## Technical Implementation

### File Structure
```
apps/frontend/app/settings/
├── page.tsx              # NEW - Settings Dashboard (this story)
├── organization/
│   └── page.tsx
├── users/
│   └── page.tsx
├── warehouses/
│   └── page.tsx
└── ... (other existing pages)
```

### Technology Stack
- **Framework:** Next.js 15 (App Router)
- **Components:** React Server Components
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Card, Button)
- **Icons:** lucide-react

### Component Structure

**apps/frontend/app/settings/page.tsx:**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Building2, Users, Warehouse, MapPin, Cpu, Factory, AlertTriangle, Receipt, Grid, Wand2 } from 'lucide-react'

// Settings module definitions
const settingsModules = [
  {
    name: 'Organization Settings',
    description: 'Company profile, logo, and basic information',
    icon: Building2,
    href: '/settings/organization',
    color: 'text-blue-600',
  },
  // ... rest of modules
]

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your MonoPilot system</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <module.icon className={`h-10 w-10 ${module.color}`} />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

---

## UI/UX Specifications

### Visual Design
- **Card Component:** Use shadcn/ui `Card` with `CardHeader`, `CardTitle`, `CardDescription`
- **Icons:** 10x10 size (h-10 w-10), colored based on category
- **Hover Effect:** `hover:shadow-lg transition-shadow` for visual feedback
- **Grid:** Responsive grid with gap-6
- **Typography:**
  - Page title: text-3xl font-bold
  - Subtitle: text-muted-foreground
  - Card title: text-lg
  - Card description: default CardDescription styling

### Color Palette (Icon Colors)
- Organization & Users: Blue (text-blue-600)
- Warehouse & Facilities: Orange/Amber (text-orange-600)
- Product Configuration: Red/Pink (text-red-600, text-pink-600)
- System Configuration: Purple/Indigo (text-purple-600, text-indigo-600)

---

## Testing Checklist

### Manual Testing
- [ ] Navigate to `/settings` - page loads without errors
- [ ] All 10 setting cards are displayed
- [ ] Each card shows correct icon, title, and description
- [ ] Clicking each card navigates to correct sub-page
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Hover effects work correctly
- [ ] Sidebar and topbar are visible
- [ ] Back button returns to dashboard correctly

### Accessibility Testing
- [ ] All interactive elements are keyboard accessible
- [ ] Focus states are visible
- [ ] Screen reader announces card titles and descriptions
- [ ] Semantic HTML structure is correct

### Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Dependencies

**Required Before This Story:**
- ✅ All existing settings pages (Stories 1.1 - 1.12)
- ✅ shadcn/ui Card component installed
- ✅ Sidebar component with Settings link

**Blocked Stories:**
- None (this is a polish/UX improvement)

---

## Notes

### Why This Story Was Added
- **Discovery:** During Epic 1 implementation, individual settings pages were created but the landing page was overlooked
- **Impact:** Without this page, Settings link in sidebar leads to 404/blank page
- **Priority:** Marked P0 as it blocks basic navigation and creates poor first impression

### Future Enhancements (Not in MVP)
- Search/filter settings cards
- Quick actions on cards (e.g., "Add User" directly from card)
- Stats on each card (e.g., "15 users", "3 warehouses")
- Categorization/grouping of cards with section headers
- Settings navigation breadcrumbs

---

## Definition of Done

- [ ] Settings Dashboard page created at `/settings/page.tsx`
- [ ] All 10 setting modules displayed as cards
- [ ] Responsive grid layout implemented
- [ ] Navigation to all sub-pages works correctly
- [ ] Consistent styling with main dashboard
- [ ] Manual testing completed
- [ ] Code review approved
- [ ] Story documentation committed to repo
- [ ] sprint-status.yaml updated with Story 1.15

---

## Estimation Breakdown

**3 Story Points = ~4-6 hours**
- Create page component: 1 hour
- Define all 10 setting modules: 1 hour
- Implement responsive grid layout: 1 hour
- Styling and polish: 1 hour
- Testing and fixes: 1-2 hours
- Documentation: 30 min (already done)
