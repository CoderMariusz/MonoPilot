# Story 1.19: Settings Mobile Responsive

**Epic:** 1 - Foundation & Settings
**Batch:** 1E - Settings UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 1 day

---

## Goal

Make all Settings pages fully responsive for mobile devices, matching Planning module's mobile design.

---

## User Story

**As a** Mobile Administrator
**I want** to access settings on my phone without horizontal scrolling
**So that** I can manage configuration on the go

---

## Problem Statement

Settings pages are not optimized for mobile:
- Tables overflow horizontally
- Header navigation doesn't collapse
- Touch targets too small
- Forms don't stack properly

---

## Acceptance Criteria

### AC-1.19.1: Mobile Header with Hamburger Menu
**Given** I view settings on mobile (<768px)
**When** the page loads
**Then**:
- SettingsHeader collapses to hamburger menu
- Menu icon on right side
- Tap opens full-screen navigation overlay
- Current page highlighted in menu

### AC-1.19.2: Table to Card View Conversion
**Given** I view a settings table on mobile
**When** screen width is <768px
**Then**:
- Table converts to card view
- Each row becomes expandable card
- Primary info visible (name, status)
- Tap to expand shows all fields
- Actions visible on expanded card

### AC-1.19.3: Touch-Friendly Targets
**Given** I interact with settings on mobile
**When** tapping buttons/links
**Then**:
- All touch targets min 44px height
- Min 8px spacing between clickable elements
- Buttons full-width on mobile forms
- Form inputs have adequate padding

### AC-1.19.4: No Horizontal Scroll
**Given** I view any settings page on mobile
**When** checking layout
**Then**:
- No horizontal scrollbar appears
- All content fits within viewport
- Stats cards stack vertically
- Forms use single-column layout

### AC-1.19.5: Responsive Forms
**Given** I edit a settings form on mobile
**When** interacting with fields
**Then**:
- Labels above inputs (not inline)
- Full-width inputs
- Submit button full-width at bottom
- Keyboard doesn't obscure inputs

---

## Implementation Tasks

- [ ] Add hamburger menu to SettingsHeader
- [ ] Create mobile nav overlay component
- [ ] Implement useResponsiveView hook for table/card switching
- [ ] Update all settings tables with card view for mobile
- [ ] Test and fix horizontal overflow on all pages
- [ ] Ensure 44px touch targets on all interactive elements
- [ ] Update form layouts for mobile (single column)
- [ ] Test on actual mobile devices (iOS Safari, Android Chrome)

---

## Design Notes

### Mobile Header (collapsed)
```
┌─────────────────────────────────────┐
│ Logo        Settings        ☰      │  (60px)
└─────────────────────────────────────┘
```

### Mobile Card View (table replacement)
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

### Mobile Nav Overlay
```
┌─────────────────────────────────────┐
│                              ✕      │
│                                     │
│   Settings Dashboard                │
│   ─────────────────                 │
│   Organization                      │
│   Users                    ●        │
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

---

## Files to Modify

```
apps/frontend/
├── components/settings/
│   ├── SettingsHeader.tsx (UPDATE - add hamburger)
│   ├── SettingsMobileNav.tsx (NEW)
│   └── SettingsCardView.tsx (NEW - mobile card component)
├── lib/hooks/
│   └── useResponsiveView.ts (REUSE from planning or create)
└── app/(authenticated)/settings/
    └── **/*.tsx (AUDIT - ensure responsive)
```

---

**Status:** Ready for Development
**Next:** Story 2.25 (Technical Header)
