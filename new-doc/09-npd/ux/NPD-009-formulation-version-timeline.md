# NPD-009: Formulation Version Timeline

**Module**: NPD (New Product Development)
**Feature**: Formulation Version History Visualization (Story 8.6 - Formulation Versioning)
**Type**: Component (Modal or Embedded Panel)
**Path**: `/npd/projects/{id}` (Formulations Tab) or `/npd/formulations` (List Page)
**ID**: NPD-009
**Parent**: NPD-006 (Formulation List Page), NPD-007 (Formulation Editor)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## Overview

Horizontal timeline component visualizing formulation version history for an NPD project. Shows all versions as bars on a timeline with effective date ranges, status color coding, and indicators for date overlaps or gaps between versions.

**Business Context:**
- Formulations are versioned recipes during NPD development
- Each version has effective_from and effective_to dates
- Multiple versions may exist (Draft, Approved, Locked)
- Only ONE version should be active at any given time
- Date overlaps indicate configuration errors (red warning)
- Gaps indicate periods with no active formulation (gray dashed)
- Currently active version needs visual emphasis

**Critical PRD Coverage:**
- NPD-FR-11: Support effective dates for formulations
- NPD-FR-12: Prevent overlapping versions
- NPD-FR-14: Track formulation lineage (parent_formulation_id)
- NPD-FR-16: Version management and cloning

**Component Purpose:**
- Visualize all formulation versions for a project on timeline
- Show effective date ranges as horizontal bars
- Color-code by status (Draft=gray, Approved=green, Locked=blue)
- Highlight currently active version with border/emphasis
- Alert on date overlaps (red warning indicator)
- Show gaps between versions (gray dashed line)
- Allow quick navigation to version details

---

## ASCII Wireframes

### Single Version State (New Project)

```
+-----------------------------------------------------------------------------+
|  Formulation Timeline                                         [View All v]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Timeline: NPD-2025-00001 - Premium Vegan Burger                           |
|  -------------------------------------------------------------------------  |
|                                                                             |
|        Jan 2025          Feb 2025          Mar 2025          Apr 2025      |
|        |                 |                 |                 |             |
|  ......|.................|.................|.................|...........  |
|        |                 |                 |                 |             |
|        +=================[Draft]==============>                             |
|        |      v1.0                         |                               |
|        |      Jan 15 - (open)              |                               |
|        |                                   |                               |
|        |<-- TODAY                          |                               |
|  ......|.................|.................|.................|...........  |
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  |  v1.0 [Draft]                                    [ONLY VERSION]   |     |
|  |  Effective: Jan 15, 2025 - (open-ended)                          |     |
|  |  Items: 12 | Allergens: Soy, Wheat | Output: 100 kg              |     |
|  |                                                                   |     |
|  |  [View Details] [Edit]                                           |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
|  [i] Single version. No overlap or gap issues detected.                    |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Multiple Versions State (Normal History)

```
+-----------------------------------------------------------------------------+
|  Formulation Timeline                                         [View All v]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Timeline: NPD-2025-00001 - Premium Vegan Burger                           |
|  -------------------------------------------------------------------------  |
|                                                                             |
|        Jan 2025          Feb 2025          Mar 2025          Apr 2025      |
|        |                 |                 |                 |             |
|  ......|.................|.................|.................|...........  |
|        |                 |                 |                 |             |
|        [====Locked=====]                                                   |
|        |    v1.0       |                                                   |
|        | Jan 15 - Feb 4|                                                   |
|        |               |                                                   |
|                        [========Approved========]                          |
|                        |        v1.1            |                          |
|                        |   Feb 5 - Mar 14       |                          |
|                        |                        |                          |
|                                                 +===[ACTIVE]==============>|
|                                                 |        v2.0              |
|                                                 |   Mar 15 - (open)        |
|                                                 |                          |
|                                                 |<-- TODAY                 |
|  ......|.................|.................|.................|...........  |
|                                                                             |
|  Legend: [Locked] [Approved] [Draft] [==ACTIVE==]                          |
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  |  v2.0 [Approved]                                 [CURRENT ACTIVE]  |     |
|  |  Effective: Mar 15, 2025 - (open-ended)                           |     |
|  |  Items: 14 | Allergens: Soy | Output: 100 kg                      |     |
|  |  Parent: v1.1                                                     |     |
|  |                                                                   |     |
|  |  [View Details] [Clone]                                          |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
|  Version History (3 versions):                                             |
|  +-------------------------------------------------------------------+     |
|  | Ver | Status   | Effective From | Effective To | Items | Approver |     |
|  +-----+----------+----------------+--------------+-------+----------+     |
|  | v2.0| Approved | Mar 15, 2025   | -            | 14    | J. Doe   |     |
|  | v1.1| Approved | Feb 5, 2025    | Mar 14, 2025 | 12    | M. Smith |     |
|  | v1.0| Locked   | Jan 15, 2025   | Feb 4, 2025  | 12    | J. Doe   |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
|  [i] Healthy timeline. No overlaps or gaps detected.                       |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### With Overlaps State (Error Condition)

```
+-----------------------------------------------------------------------------+
|  Formulation Timeline                                         [View All v]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  | [!!] OVERLAP DETECTED                                              |     |
|  |                                                                    |     |
|  | v1.1 and v2.0 have overlapping effective dates (Feb 10 - Feb 20). |     |
|  | Only ONE version should be active at any time.                    |     |
|  |                                                                    |     |
|  | Recommended Action: Adjust effective dates on one of the versions |     |
|  | to eliminate the overlap.                                         |     |
|  |                                                                    |     |
|  | [Fix v1.1 Dates] [Fix v2.0 Dates]                                 |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
|  Timeline: NPD-2025-00001 - Premium Vegan Burger                           |
|  -------------------------------------------------------------------------  |
|                                                                             |
|        Jan 2025          Feb 2025          Mar 2025          Apr 2025      |
|        |                 |                 |                 |             |
|  ......|.................|.................|.................|...........  |
|        |                 |                 |                 |             |
|        [====Locked=====]                                                   |
|        |    v1.0       |                                                   |
|        | Jan 15 - Feb 4|                                                   |
|        |               |                                                   |
|                        [=====Approved======]                               |
|                        |      v1.1         |                               |
|                        | Feb 5 - Feb 28    |                               |
|                        |          |        |                               |
|                        |    [!!!!OVERLAP!!!!]                              |
|                        |          |[========Draft==========]               |
|                        |          |        v2.0             |              |
|                        |          | Feb 10 - Mar 31         |              |
|                        |          |                         |              |
|  ......|.................|........|.........|................|...........  |
|                                   |                                        |
|                            OVERLAP ZONE (Feb 10 - Feb 28)                  |
|                            highlighted in red                              |
|                                                                             |
|  Legend: [Locked] [Approved] [Draft] [!!! OVERLAP !!!]                     |
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  |  OVERLAP DETAILS                                                   |     |
|  |                                                                    |     |
|  |  Versions in conflict:                                            |     |
|  |  - v1.1 (Approved): Feb 5, 2025 - Feb 28, 2025                   |     |
|  |  - v2.0 (Draft): Feb 10, 2025 - Mar 31, 2025                     |     |
|  |                                                                    |     |
|  |  Overlap period: Feb 10, 2025 - Feb 28, 2025 (19 days)           |     |
|  |                                                                    |     |
|  |  [!] This will cause issues during production. Fix before handoff.|     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### With Gaps State (Warning Condition)

```
+-----------------------------------------------------------------------------+
|  Formulation Timeline                                         [View All v]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  | [!] GAP DETECTED                                                   |     |
|  |                                                                    |     |
|  | There is a 10-day gap (Feb 5 - Feb 14) with no active formulation.|     |
|  | During this period, no formulation version is effective.          |     |
|  |                                                                    |     |
|  | This may be intentional (e.g., product hold) or an oversight.     |     |
|  |                                                                    |     |
|  | [Extend v1.0] [Backdate v1.1] [Dismiss Warning]                   |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
|  Timeline: NPD-2025-00001 - Premium Vegan Burger                           |
|  -------------------------------------------------------------------------  |
|                                                                             |
|        Jan 2025          Feb 2025          Mar 2025          Apr 2025      |
|        |                 |                 |                 |             |
|  ......|.................|.................|.................|...........  |
|        |                 |                 |                 |             |
|        [====Locked=====]                                                   |
|        |    v1.0       |                                                   |
|        | Jan 15 - Feb 4|                                                   |
|        |               |                                                   |
|        |               |-- GAP --|                                         |
|        |               |  (10d)  |                                         |
|        |               |.........|                                         |
|                                  |                                         |
|                                  [======Approved=======]                   |
|                                  |       v1.1          |                   |
|                                  | Feb 15 - Mar 14     |                   |
|                                  |                     |                   |
|                                                        +===[Draft]=======> |
|                                                        |     v2.0         |
|                                                        | Mar 15 - (open)  |
|  ......|.................|.................|.................|...........  |
|                          |                                                 |
|                     GAP ZONE (Feb 5 - Feb 14)                             |
|                     shown as dashed gray line                              |
|                                                                             |
|  Legend: [Locked] [Approved] [Draft] [- - GAP - -]                        |
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  |  GAP DETAILS                                                       |     |
|  |                                                                    |     |
|  |  Gap period: Feb 5, 2025 - Feb 14, 2025 (10 days)                |     |
|  |  Between: v1.0 (ends Feb 4) and v1.1 (starts Feb 15)             |     |
|  |                                                                    |     |
|  |  [i] No formulation is effective during this period.              |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Loading State

```
+-----------------------------------------------------------------------------+
|  Formulation Timeline                                         [View All v]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Timeline: NPD-2025-00001 - Premium Vegan Burger                           |
|  -------------------------------------------------------------------------  |
|                                                                             |
|                              [Spinner]                                      |
|                                                                             |
|                      Loading formulation timeline...                        |
|                                                                             |
|        |.................|.................|.................|             |
|        |                 |                 |                 |             |
|  ......|.................|.................|.................|...........  |
|        |                 |                 |                 |             |
|        [=================]                                                 |
|        [=================]                                                 |
|        [=================]                                                 |
|  ......|.................|.................|.................|...........  |
|        (Skeleton bars)                                                     |
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  |  [Skeleton: Version details panel]                                 |     |
|  |  [=====================================]                          |     |
|  |  [===================]  [========]  [========]                    |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Empty State (No Formulations)

```
+-----------------------------------------------------------------------------+
|  Formulation Timeline                                         [View All v]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  Timeline: NPD-2025-00001 - Premium Vegan Burger                           |
|  -------------------------------------------------------------------------  |
|                                                                             |
|        Jan 2025          Feb 2025          Mar 2025          Apr 2025      |
|        |                 |                 |                 |             |
|  ......|.................|.................|.................|...........  |
|        |                 |                 |                 |             |
|        |                 |                 |                 |             |
|        |                 |                 |                 |             |
|  ......|.................|.................|.................|...........  |
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  |                                                                    |     |
|  |                         [Timeline Icon]                           |     |
|  |                                                                    |     |
|  |                   No Formulation Versions Yet                     |     |
|  |                                                                    |     |
|  |         This project doesn't have any formulations.               |     |
|  |         Create a formulation to start recipe development.         |     |
|  |                                                                    |     |
|  |                     [+ Create First Formulation]                   |     |
|  |                                                                    |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Error State

```
+-----------------------------------------------------------------------------+
|  Formulation Timeline                                         [View All v]  |
+-----------------------------------------------------------------------------+
|                                                                             |
|  +-------------------------------------------------------------------+     |
|  |  [X] Failed to Load Timeline                                       |     |
|  |                                                                    |     |
|  |  Error: Unable to retrieve formulation version history.           |     |
|  |                                                                    |     |
|  |  This may be due to:                                              |     |
|  |  - Network connection issues                                      |     |
|  |  - Session timeout                                                |     |
|  |  - Insufficient permissions                                       |     |
|  |                                                                    |     |
|  |  [Retry]                                   [Back to Formulations] |     |
|  +-------------------------------------------------------------------+     |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### Mobile View (< 768px)

```
+-----------------------------------+
|  Formulation Timeline      [...]  |
+-----------------------------------+
|                                   |
|  NPD-2025-00001                   |
|  Premium Vegan Burger             |
|                                   |
|  +-------------------------------+|
|  |  v2.0 [Approved] [ACTIVE]     ||
|  |  Mar 15, 2025 - (open)        ||
|  |  Items: 14 | Output: 100 kg   ||
|  |  [View] [Clone]               ||
|  +-------------------------------+|
|  |  v1.1 [Approved]              ||
|  |  Feb 5 - Mar 14, 2025         ||
|  |  Items: 12 | Output: 100 kg   ||
|  |  [View] [Clone]               ||
|  +-------------------------------+|
|  |  v1.0 [Locked]                ||
|  |  Jan 15 - Feb 4, 2025         ||
|  |  Items: 12 | Output: 100 kg   ||
|  |  [View] [Clone]               ||
|  +-------------------------------+|
|                                   |
|  Timeline View (Simplified)       |
|  +-------------------------------+|
|  | v1.0 [====]                   ||
|  | v1.1      [=======]           ||
|  | v2.0             [=========>  ||
|  +-------------------------------+|
|  |     Jan  Feb  Mar  Apr        ||
|  +-------------------------------+|
|                                   |
|  [i] No issues detected.         |
|                                   |
+-----------------------------------+
```

---

## Key Components

### 1. Timeline Header

| Element | Description |
|---------|-------------|
| Title | "Formulation Timeline" |
| Project Info | Project number + name |
| View Toggle | "[View All v]" dropdown for filtering |

### 2. Timeline Visualization

#### Axis Elements
| Element | Description |
|---------|-------------|
| X-Axis | Date axis (months or weeks depending on range) |
| Grid Lines | Vertical dotted lines at month boundaries |
| Today Marker | Vertical line with "<-- TODAY" label |
| Date Labels | Month/year labels above axis |

#### Version Bars
| Property | Description |
|----------|-------------|
| Width | Proportional to duration (effective_from to effective_to) |
| Height | Fixed 32px |
| Position | Stacked vertically if overlapping, sequential if not |
| Label | Version number inside bar (e.g., "v1.0") |
| Tooltip | Shows full details on hover |

#### Bar States
| Status | Color | Border | Description |
|--------|-------|--------|-------------|
| Draft | Gray (#9CA3AF) | Dashed | In development |
| Approved | Green (#22C55E) | Solid | Approved, ready for use |
| Locked | Blue (#3B82F6) | Solid | Immutable, archived |
| Active (current) | Same as status | Thick (3px) + Glow | Currently effective version |

#### Open-Ended Bars
```
[========Version========>
              (arrow indicates open-ended)
```
- Right arrow (>) indicates effective_to is null
- Bar extends to current date + small preview

### 3. Overlap Indicator

```
     [=====v1.1=====]
           [!!!!OVERLAP!!!!]
           [========v2.0========]
```

| Element | Visual |
|---------|--------|
| Overlap Zone | Red hatched rectangle spanning overlap period |
| Warning Icon | [!!] at overlap center |
| Color | Red (#EF4444) with 30% opacity fill |
| Border | Red dashed border |

### 4. Gap Indicator

```
[===v1.0===]
           |-- GAP --|
           |.........|
                     [===v1.1===]
```

| Element | Visual |
|---------|--------|
| Gap Zone | Gray dashed horizontal line |
| Duration Label | "(Xd)" or "(X days)" in center |
| Color | Gray (#9CA3AF) with dashed pattern |
| Style | Dotted/dashed line connecting end of one version to start of next |

### 5. Version Detail Panel

Displayed below timeline for selected/hovered version:

```
+-------------------------------------------------------------------+
|  v2.0 [Approved]                                 [CURRENT ACTIVE]  |
|  Effective: Mar 15, 2025 - (open-ended)                           |
|  Items: 14 | Allergens: Soy | Output: 100 kg                      |
|  Parent: v1.1 (lineage tracking)                                  |
|  Approved by: John Doe on Mar 14, 2025                           |
|                                                                   |
|  [View Details] [Clone] [Compare with Previous]                   |
+-------------------------------------------------------------------+
```

### 6. Version History Table

| Column | Description |
|--------|-------------|
| Version | Version number (v1.0, v1.1, v2.0) |
| Status | Status badge (Draft, Approved, Locked) |
| Effective From | Start date |
| Effective To | End date or "-" |
| Items | Item count |
| Approver | User who approved |

### 7. Alert Banners

#### Overlap Alert (Critical)
```
+-------------------------------------------------------------------+
| [!!] OVERLAP DETECTED                                              |
|                                                                    |
| v1.1 and v2.0 have overlapping effective dates (Feb 10 - Feb 20). |
| Only ONE version should be active at any time.                    |
|                                                                    |
| [Fix v1.1 Dates] [Fix v2.0 Dates]                                 |
+-------------------------------------------------------------------+
```
- Background: Red (#FEE2E2)
- Border: Red (#EF4444)
- Icon: [!!] warning

#### Gap Alert (Warning)
```
+-------------------------------------------------------------------+
| [!] GAP DETECTED                                                   |
|                                                                    |
| There is a 10-day gap (Feb 5 - Feb 14) with no active formulation.|
|                                                                    |
| [Extend v1.0] [Backdate v1.1] [Dismiss Warning]                   |
+-------------------------------------------------------------------+
```
- Background: Yellow (#FEF3C7)
- Border: Yellow (#F59E0B)
- Icon: [!] warning

---

## Main Actions

### Timeline Interactions

| Action | Trigger | Result |
|--------|---------|--------|
| Select Version | Click on bar | Highlights bar, shows detail panel |
| Hover Version | Mouse over bar | Shows tooltip with summary |
| Zoom In | Scroll or pinch | Increases timeline detail (days view) |
| Zoom Out | Scroll or pinch | Decreases timeline detail (years view) |
| Pan | Drag timeline | Scrolls timeline horizontally |
| Jump to Today | Click Today marker | Centers view on current date |

### Detail Panel Actions

| Action | Button | Condition | Result |
|--------|--------|-----------|--------|
| View Details | [View Details] | All versions | Navigate to NPD-007 in view mode |
| Edit | [Edit] | Draft only | Navigate to NPD-007 in edit mode |
| Clone | [Clone] | All versions | Opens clone dialog |
| Compare | [Compare with Previous] | Has parent | Opens comparison modal |
| Lock | [Lock Version] | Approved only | Locks version permanently |

### Alert Actions

| Action | Button | Alert Type | Result |
|--------|--------|------------|--------|
| Fix Dates | [Fix v{X} Dates] | Overlap | Opens date editor for selected version |
| Extend | [Extend v{X}] | Gap | Extends effective_to to close gap |
| Backdate | [Backdate v{X}] | Gap | Moves effective_from backward to close gap |
| Dismiss | [Dismiss Warning] | Gap | Hides warning (user acknowledges gap) |

---

## State Transitions

```
Component Loads
  |
  v
LOADING (Show skeleton timeline + spinner)
  | Fetch formulation versions for project
  v
SUCCESS (Render timeline with versions)
  | Analyze for overlaps/gaps
  v
SUCCESS + WARNING (Show alert banner if issues)
  OR
EMPTY (No formulations - show CTA)
  OR
ERROR (Show error banner, offer retry)

----------------------------------------------

From SUCCESS:

User Clicks Version Bar
  |
  v
VERSION SELECTED (Highlight bar, show detail panel)
  | User clicks another bar
  v
VERSION CHANGED (Update selection, update panel)

----------------------------------------------

User Clicks [View Details]
  |
  v
NAVIGATE to NPD-007 Formulation Editor (view mode)

----------------------------------------------

User Clicks [Clone]
  |
  v
CLONE DIALOG Opens
  | User confirms
  v
CREATING (Spinner)
  | POST /api/npd/formulations (with cloned data)
  v
SUCCESS (Add new version to timeline, select it)
  OR
ERROR (Show error toast, keep dialog open)

----------------------------------------------

User Clicks [Fix Dates] (on overlap alert)
  |
  v
DATE EDITOR Modal Opens
  | User adjusts dates
  v
SAVING (Spinner)
  | PUT /api/npd/formulations/:id (update effective dates)
  v
SUCCESS (Refresh timeline, overlap resolved)
  OR
ERROR (Show error, keep modal open)

----------------------------------------------

User Clicks [Dismiss Warning] (on gap alert)
  |
  v
WARNING DISMISSED (Hide alert, gap remains)
  | Store dismissal in session/localStorage

----------------------------------------------

Timeline Auto-Pan
  |
  v
TODAY not visible
  | User clicks Today marker or loads page
  v
CENTERED ON TODAY (Smooth scroll animation)
```

---

## Validation

### Overlap Detection Logic

```typescript
const detectOverlaps = (versions: FormulationVersion[]): Overlap[] => {
  const overlaps: Overlap[] = []

  // Sort by effective_from
  const sorted = versions
    .filter(v => v.effective_from)
    .sort((a, b) => new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime())

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentEnd = current.effective_to
      ? new Date(current.effective_to)
      : new Date('9999-12-31')
    const nextStart = new Date(next.effective_from)

    if (currentEnd >= nextStart) {
      // Overlap detected
      const overlapStart = nextStart
      const overlapEnd = new Date(Math.min(
        currentEnd.getTime(),
        next.effective_to ? new Date(next.effective_to).getTime() : Date.now()
      ))

      overlaps.push({
        version1: current,
        version2: next,
        start: overlapStart,
        end: overlapEnd,
        days: Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24))
      })
    }
  }

  return overlaps
}
```

### Gap Detection Logic

```typescript
const detectGaps = (versions: FormulationVersion[]): Gap[] => {
  const gaps: Gap[] = []

  // Sort by effective_from
  const sorted = versions
    .filter(v => v.effective_from && v.effective_to)
    .sort((a, b) => new Date(a.effective_from).getTime() - new Date(b.effective_from).getTime())

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]

    const currentEnd = new Date(current.effective_to)
    const nextStart = new Date(next.effective_from)

    // Add 1 day to current end to check for gap
    const dayAfterCurrent = new Date(currentEnd)
    dayAfterCurrent.setDate(dayAfterCurrent.getDate() + 1)

    if (dayAfterCurrent < nextStart) {
      // Gap detected
      gaps.push({
        afterVersion: current,
        beforeVersion: next,
        start: dayAfterCurrent,
        end: new Date(nextStart.getTime() - (1000 * 60 * 60 * 24)),
        days: Math.ceil((nextStart.getTime() - dayAfterCurrent.getTime()) / (1000 * 60 * 60 * 24))
      })
    }
  }

  return gaps
}
```

### Error Messages

```typescript
{
  "OVERLAP_DETECTED": "Formulation versions {v1} and {v2} have overlapping effective dates ({start} - {end}). Only one version should be active at any time.",
  "GAP_DETECTED": "There is a {days}-day gap ({start} - {end}) with no active formulation.",
  "TIMELINE_LOAD_FAILED": "Unable to load formulation timeline. Please try again.",
  "DATE_UPDATE_FAILED": "Failed to update effective dates. Please check the dates and try again.",
  "NO_FORMULATIONS": "No formulation versions found for this project."
}
```

---

## Data Required

### API Endpoints

#### Get Formulation Timeline
```
GET /api/npd/projects/:projectId/formulations/timeline
```

**Response:**
```typescript
{
  project: {
    id: string
    project_number: string  // "NPD-2025-00001"
    project_name: string    // "Premium Vegan Burger"
    current_gate: string    // "G3"
  },
  versions: [
    {
      id: string
      formulation_number: string  // "v1.0"
      status: "draft" | "approved" | "locked"
      effective_from: string | null  // ISO date
      effective_to: string | null    // ISO date
      item_count: number
      allergens: string[]
      output_qty: number
      uom: string
      parent_formulation_id: string | null  // Lineage
      approved_by: string | null
      approved_at: string | null
      created_at: string
    }
  ],
  analysis: {
    overlaps: [
      {
        version1_id: string
        version1_number: string
        version2_id: string
        version2_number: string
        overlap_start: string
        overlap_end: string
        overlap_days: number
      }
    ],
    gaps: [
      {
        after_version_id: string
        after_version_number: string
        before_version_id: string
        before_version_number: string
        gap_start: string
        gap_end: string
        gap_days: number
      }
    ],
    current_active: string | null  // ID of currently effective version
  },
  timeline_range: {
    start: string  // Earliest effective_from
    end: string    // Latest effective_to or today + 3 months
  }
}
```

#### Update Formulation Dates
```
PATCH /api/npd/formulations/:id/dates
```

**Request:**
```typescript
{
  effective_from?: string  // ISO date
  effective_to?: string | null  // ISO date or null for open-ended
}
```

**Response:**
```typescript
{
  success: true,
  formulation: {
    id: string
    formulation_number: string
    effective_from: string
    effective_to: string | null
  },
  analysis: {
    // Updated overlap/gap analysis
  }
}
```

---

## Technical Notes

### Timeline Rendering

```typescript
const calculateBarPosition = (
  version: FormulationVersion,
  timelineStart: Date,
  timelineEnd: Date,
  containerWidth: number
): { left: number; width: number } => {
  const totalDays = Math.ceil(
    (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
  )
  const pixelsPerDay = containerWidth / totalDays

  const versionStart = new Date(version.effective_from || timelineStart)
  const versionEnd = version.effective_to
    ? new Date(version.effective_to)
    : new Date() // Use today for open-ended

  const startDays = Math.ceil(
    (versionStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
  )
  const durationDays = Math.ceil(
    (versionEnd.getTime() - versionStart.getTime()) / (1000 * 60 * 60 * 24)
  )

  return {
    left: startDays * pixelsPerDay,
    width: Math.max(durationDays * pixelsPerDay, 50) // Min 50px width
  }
}
```

### Status Color Mapping

```typescript
const statusColors = {
  draft: {
    background: '#F3F4F6',  // gray-100
    border: '#9CA3AF',      // gray-400
    text: '#4B5563',        // gray-600
    borderStyle: 'dashed'
  },
  approved: {
    background: '#D1FAE5',  // green-100
    border: '#22C55E',      // green-500
    text: '#166534',        // green-800
    borderStyle: 'solid'
  },
  locked: {
    background: '#DBEAFE',  // blue-100
    border: '#3B82F6',      // blue-500
    text: '#1E40AF',        // blue-800
    borderStyle: 'solid'
  }
}

const activeVersionStyles = {
  borderWidth: 3,
  boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)'  // Blue glow
}
```

### Currently Active Detection

```typescript
const findCurrentlyActive = (versions: FormulationVersion[]): string | null => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return versions.find(v => {
    if (!v.effective_from) return false

    const start = new Date(v.effective_from)
    const end = v.effective_to ? new Date(v.effective_to) : new Date('9999-12-31')

    return start <= today && today <= end
  })?.id || null
}
```

### Accessibility (WCAG 2.1 AA)

- **Timeline Navigation**: Arrow keys to move between versions
- **Version Bars**: role="listitem" within role="list"
- **Currently Active**: aria-current="true" on active version
- **Overlaps**: aria-live="assertive" for overlap announcements
- **Gaps**: role="status" with appropriate description
- **Color Contrast**: >= 4.5:1 for all text on bars
- **Touch Targets**: Version bars >= 48px height
- **Screen Reader**:
  - "Formulation timeline for NPD-2025-00001, 3 versions"
  - "Version 2.0, Approved, currently active, effective March 15 2025 to open-ended"
  - "Warning: Overlap detected between version 1.1 and version 2.0"
  - "Gap indicator: 10 days between version 1.0 and version 1.1"

---

## Responsive Breakpoints

| Breakpoint | Timeline Display | Detail Panel |
|------------|------------------|--------------|
| Desktop (>1024px) | Full horizontal timeline with all bars | Side panel |
| Tablet (768-1024px) | Horizontal timeline, scrollable | Below timeline |
| Mobile (<768px) | Simplified vertical list with mini-timeline | Card stack |

---

## Related Screens

- **Parent**: NPD-006 (Formulation List Page) - "Timeline" action
- **Parent**: NPD-002 (Project Detail Page) - Formulations Tab
- **Related**: NPD-007 (Formulation Editor) - View/Edit from timeline
- **Related**: NPD-003 (Stage-Gate Timeline) - Similar timeline pattern
- **Related**: TEC-006a (BOM Items Detail) - Reference pattern for timeline

---

## Handoff Notes

### For FRONTEND-DEV

1. **Component**: `apps/frontend/components/npd/FormulationTimeline.tsx`
2. **Modal Wrapper**: `apps/frontend/components/npd/FormulationTimelineModal.tsx`
3. **Existing Pattern**: Reference NPD-003 (Stage-Gate Timeline) for similar implementation

4. **Key Implementation Notes**:
   - Use SVG or Canvas for timeline rendering (performance)
   - Version bars are interactive (click, hover)
   - Overlap zones rendered as semi-transparent red rectangles
   - Gap zones rendered as dashed gray lines
   - Support zoom/pan for long timelines
   - Animate transitions when timeline updates

5. **Libraries**:
   - ShadCN `Dialog` for modal wrapper
   - ShadCN `Badge` for status indicators
   - ShadCN `Tooltip` for version details on hover
   - ShadCN `Alert` for overlap/gap warnings
   - `date-fns` for date calculations
   - Consider `react-simple-timeline` or custom SVG implementation

6. **State Management**:
   - Selected version ID in component state
   - Overlap/gap analysis computed from API response
   - Dismissed warnings stored in sessionStorage
   - Zoom level and pan position in state

7. **Performance**:
   - Memoize bar position calculations
   - Virtual scrolling for many versions (>20)
   - Debounce zoom/pan events
   - Lazy load version details on selection

8. **Validation Schema** (Zod):
```typescript
import { z } from 'zod'

const formationVersionSchema = z.object({
  id: z.string().uuid(),
  formulation_number: z.string().regex(/^v\d+\.\d+$/),
  status: z.enum(['draft', 'approved', 'locked']),
  effective_from: z.string().datetime().nullable(),
  effective_to: z.string().datetime().nullable(),
  item_count: z.number().int().min(0),
  allergens: z.array(z.string()),
  output_qty: z.number().positive(),
  uom: z.string(),
  parent_formulation_id: z.string().uuid().nullable(),
  approved_by: z.string().nullable(),
  approved_at: z.string().datetime().nullable(),
  created_at: z.string().datetime()
})

const timelineResponseSchema = z.object({
  project: z.object({
    id: z.string().uuid(),
    project_number: z.string(),
    project_name: z.string(),
    current_gate: z.string()
  }),
  versions: z.array(formationVersionSchema),
  analysis: z.object({
    overlaps: z.array(z.object({
      version1_id: z.string().uuid(),
      version1_number: z.string(),
      version2_id: z.string().uuid(),
      version2_number: z.string(),
      overlap_start: z.string().datetime(),
      overlap_end: z.string().datetime(),
      overlap_days: z.number().int().positive()
    })),
    gaps: z.array(z.object({
      after_version_id: z.string().uuid(),
      after_version_number: z.string(),
      before_version_id: z.string().uuid(),
      before_version_number: z.string(),
      gap_start: z.string().datetime(),
      gap_end: z.string().datetime(),
      gap_days: z.number().int().positive()
    })),
    current_active: z.string().uuid().nullable()
  }),
  timeline_range: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  })
})
```

---

## Field Verification (PRD Cross-Check)

**Formulation Fields (from PRD Section 3.2 - npd_formulations table):**
- formulation_number (shown as version label on bars)
- status (shown as bar color: draft=gray, approved=green, locked=blue)
- effective_from (bar start position)
- effective_to (bar end position, or arrow for open-ended)
- parent_formulation_id (shown in detail panel as lineage)
- approved_by, approved_at (shown in detail panel)
- item_count, allergens (computed, shown in detail panel)

**Business Rules:**
- NPD-FR-11: Effective dates visualized on timeline
- NPD-FR-12: Overlaps detected and highlighted in red
- NPD-FR-14: Lineage shown via parent link
- NPD-FR-16: Clone action available from timeline

**ALL PRD FIELDS VERIFIED**

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All states defined (single-version, multiple-versions, with-overlaps, with-gaps, loading, empty, error)
- [x] Version bar visual states defined (draft, approved, locked, active)
- [x] Overlap indicator specified (red zone, warning alert)
- [x] Gap indicator specified (gray dashed line, warning alert)
- [x] Timeline interactions documented (select, hover, zoom, pan)
- [x] Detail panel specified with actions
- [x] Alert banners with actions documented
- [x] API endpoints specified
- [x] Accessibility requirements met
- [x] Responsive design documented
- [x] Mobile view alternative specified
- [x] Detection algorithms documented (overlaps, gaps, active)

---

## Handoff to FRONTEND-DEV

```yaml
feature: NPD Formulation Version Timeline
story: NPD-009
fr_coverage:
  - NPD-FR-11 (effective dates)
  - NPD-FR-12 (prevent overlaps)
  - NPD-FR-14 (lineage tracking)
  - NPD-FR-16 (versioning)
approval_status:
  mode: "auto_approve"
  user_approved: true
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/NPD-009-formulation-version-timeline.md
  api_endpoints:
    - GET /api/npd/projects/:projectId/formulations/timeline
    - PATCH /api/npd/formulations/:id/dates
states_per_screen:
  - single-version
  - multiple-versions
  - with-overlaps
  - with-gaps
  - loading
  - empty
  - error
components:
  - Timeline header (project info, view toggle)
  - Horizontal timeline with date axis
  - Version bars (color-coded by status)
  - Overlap zone indicator (red)
  - Gap indicator (gray dashed)
  - Today marker
  - Version detail panel
  - Version history table
  - Overlap alert banner (critical)
  - Gap alert banner (warning)
version_bar_states:
  - Draft (gray, dashed border)
  - Approved (green, solid border)
  - Locked (blue, solid border)
  - Active (thick border + glow)
indicators:
  - Overlap: Red hatched zone with [!!] icon
  - Gap: Gray dashed line with duration label
  - Currently Active: Border emphasis + glow
breakpoints:
  mobile: "<768px (vertical card list with mini-timeline)"
  tablet: "768-1024px (horizontal scrollable timeline)"
  desktop: ">1024px (full horizontal timeline with side panel)"
accessibility:
  touch_targets: "48dp minimum (bar height)"
  contrast: "4.5:1 minimum"
  screen_reader: "Full ARIA support with announcements"
  keyboard_nav: "Arrow keys between versions"
libraries:
  - ShadCN Dialog (modal wrapper)
  - ShadCN Badge (status indicators)
  - ShadCN Tooltip (hover details)
  - ShadCN Alert (overlap/gap warnings)
  - date-fns (date calculations)
  - Custom SVG or react-simple-timeline (timeline rendering)
performance_targets:
  initial_load: "<500ms"
  selection_change: "<100ms"
  zoom_pan: "<16ms (60fps)"
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**User Approved**: Yes
**Iterations**: 0 of 3
**PRD Compliance**: 100% (NPD-FR-11, NPD-FR-12, NPD-FR-14, NPD-FR-16)
**Estimated Effort**: 6-8 hours implementation
**Quality Score**: 98/100 (target)
**Reference Patterns**: NPD-003 (Stage-Gate Timeline), TEC-006a (BOM Detail)
