# Warehouse Module - UX Design Specification

**Date:** 2025-11-19
**Updated:** 2025-11-27 - Integrated with Shared System
**Version:** 2.0
**Status:** Ready for Implementation
**Priority:** P0 (Core Inventory Operations)

---

## 🔗 SHARED UI SYSTEM INTEGRATION (v2.0)

Warehouse Module now integrates with [Shared UI Design System](./ux-design-shared-system.md).

**Applied Components:**
- ✅ **ModuleHeader**: Warehouse | License Plates | ASN/GRN | Movements | Scanner | ⚙️
- ✅ **Stats Cards**: 4 cards (LPs, ASN/GRN, Movements, Inventory Health) - 120px, 2×2 grid
- ✅ **DataTable Base**: LP table, ASN table, GRN table, Movements (sortable, filterable)
- ✅ **Colors**: app-colors.ts (green Create, gray View/Edit, red Delete)
- ✅ **Mobile Responsive**: Tables → Card view on < 768px
- ✅ **Dark Mode**: Settings → Appearance

**Warehouse-Specific Features (Enhanced):**
- 🎯 **License Plate Management** - Track LPs by batch, expiry, status, location
- 🎯 **ASN/GRN Processing** - Inbound workflow (receipt, quality hold, putaway)
- 🎯 **Movement Tracking** - Warehouse transfers, replenishment, picking
- 🎯 **Scanner Integration** - Barcode scanning for LP operations (Phase 2)
- 🎯 **Inventory Health Dashboard** - Expiry dates, aging inventory, space utilization

**Layout:**
```
ModuleHeader: Warehouse│LPs│ASN/GRN│Movements│Scanner│⚙️  ← Shared
[Create LP] [Receive ASN] [Create Movement]               ← Shared buttons
[Stats Cards: LPs, ASN/GRN, Movements, Health]            ← Shared (4 cards)
[LP Table] [Filters] [Mobile Card View]                   ← Warehouse-specific (Shared table base)
Location tracking, Batch management, Expiry alerts        ← Warehouse-specific
```

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project & Users Context](#2-project--users-context)
3. [Design System](#3-design-system)
4. [Desktop UX - LP Management](#4-desktop-ux---lp-management)
5. [Desktop UX - ASN & GRN](#5-desktop-ux---asn--grn)
6. [Desktop UX - Stock Movements](#6-desktop-ux---stock-movements)
7. [Desktop UX - Split & Merge](#7-desktop-ux---split--merge)
8. [Desktop UX - Pallet Management](#8-desktop-ux---pallet-management)
9. [Scanner UX - Mobile Workflows](#9-scanner-ux---mobile-workflows)
10. [Component Library](#10-component-library)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Success Metrics](#12-success-metrics)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

### Problem Statement

The Warehouse module manages all physical inventory through License Plates (LP) - the atomic unit of inventory. Current warehouse operations suffer from:

- **Slow receiving**: Manual entry of batch, expiry, quantities (5+ minutes per PO)
- **No mobile optimization**: Desktop-only workflows force operators to office (ratio: 1 desktop to 20 scanner users)
- **Poor visibility**: No real-time LP status, genealogy difficult to trace
- **Limited bulk operations**: One LP at a time for moves, splits

### Solution Overview

A **dual-interface approach** optimized for the actual usage pattern (1 desktop : 20 scanners):

1. **Desktop View** - Compact, data-dense tables for supervisors/managers
   - LP list with advanced filtering
   - ASN/GRN management with prefill
   - Genealogy visualization
   - Bulk operations

2. **Scanner View** - Mobile-first PWA for operators
   - Step-by-step guided workflows
   - Scrolling interface with large tap targets
   - Offline-capable with sync queue
   - Warehouse-scoped operations (select once, work within)

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data density | Balanced → Compact | Desktop users need high information density |
| Scanner scrolling | Vertical scroll | Mobile operators scroll naturally |
| ASN/GRN prefill | Auto-prefill all | Reduce typing to near-zero |
| Split quantity | Numeric + slider | Emphasis on numeric for precision |
| Merge confirmation | After selection | Show total before commit |
| Location selection | Flat list | Simpler than hierarchy |
| Warehouse scope | Button toggle | Select warehouse once, then all ops within |

### Expected Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| PO receiving time | 5 min | 45s | **85% faster** |
| LP lookup time | 30s | 3s | **90% faster** |
| Stock move time | 2 min | 15s | **88% faster** |
| Split operation | 1 min | 20s | **67% faster** |
| Genealogy trace | 5 min | 30s | **90% faster** |

---

## 2. Project & Users Context

### User Personas

#### Primary Persona: Warehouse Operator (Mobile Scanner)

- **Role:** Executes receiving, moves, splits, packing
- **Device:** Mobile PWA (BYOD smartphone/tablet)
- **Ratio:** 20 operators per 1 desktop
- **Daily volume:** 50-100 LP operations per shift
- **Environment:** Cold storage (-5°C to +5°C), rękawice, słaby Wi-Fi
- **Needs:**
  - Offline mode (operations queue for sync)
  - 56px+ tap targets (gloves)
  - Minimal typing (scan everything)
  - Sound/haptic feedback (noisy environment)
- **Pain points:**
  - Walking to desktop to check status
  - Manual LP number entry
  - No offline capability

#### Secondary Persona: Warehouse Supervisor (Desktop + Mobile)

- **Role:** Reviews LP status, manages exceptions, generates reports
- **Device:** Desktop (1920×1080) + tablet for floor walks
- **Daily volume:** Reviews 100-200 LPs, creates 10-20 movements
- **Needs:**
  - Data-dense views (see many LPs at once)
  - Advanced filtering (product, status, expiry, batch)
  - Bulk operations (move 20 LPs, print 50 labels)
  - Genealogy tracing
- **Pain points:**
  - Too much scrolling in current tables
  - No bulk actions
  - Genealogy buried in multiple screens

#### Tertiary Persona: Inventory Manager (Desktop)

- **Role:** Strategic inventory decisions, audits, reporting
- **Device:** Desktop (1920×1080), dual monitors
- **Needs:**
  - Dashboard with KPIs (turnover, aging, FIFO compliance)
  - Audit trail access
  - Export capabilities
- **Pain points:**
  - No inventory aging visibility
  - Manual Excel reports

### Platform Requirements

| Platform | Users | Breakpoints | Offline | Priority |
|----------|-------|-------------|---------|----------|
| Desktop | 5% | 1024px-1920px | No | P1 |
| Tablet | 15% | 768px-1024px | Yes | P1 |
| Mobile | 80% | 320px-768px | Yes | P0 |

---

## 3. Design System

### Color Palette

Following MonoPilot design system with warehouse-specific states:

#### LP Status Colors
```css
--lp-available: #22c55e;      /* Green-500 */
--lp-reserved: #3b82f6;       /* Blue-500 */
--lp-consumed: #6b7280;       /* Gray-500 */
--lp-blocked: #ef4444;        /* Red-500 */
```

#### QA Status Colors
```css
--qa-pending: #eab308;        /* Yellow-500 */
--qa-passed: #22c55e;         /* Green-500 */
--qa-failed: #ef4444;         /* Red-500 */
--qa-quarantine: #f97316;     /* Orange-500 */
```

#### Expiry Warning Colors
```css
--expiry-ok: #22c55e;         /* >30 days: Green */
--expiry-warning: #eab308;    /* 7-30 days: Yellow */
--expiry-critical: #f97316;   /* 1-7 days: Orange */
--expiry-expired: #ef4444;    /* Expired: Red */
```

### Typography (Desktop)

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Table header | Inter | 12px | 600 | 16px |
| Table cell | Inter | 13px | 400 | 18px |
| LP number | JetBrains Mono | 13px | 500 | 18px |
| Quantity | JetBrains Mono | 13px | 600 | 18px |

### Typography (Scanner)

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Header | Inter | 18px | 600 | 24px |
| Label | Inter | 14px | 500 | 20px |
| Input | Inter | 16px | 400 | 24px |
| Button | Inter | 16px | 600 | 24px |

### Spacing & Tap Targets

| Context | Minimum Size | Recommended |
|---------|--------------|-------------|
| Desktop button | 32px | 36px |
| Desktop row | 36px | 40px |
| Scanner button | 48px | 56px |
| Scanner input | 48px | 56px |
| Scanner row | 56px | 64px |

### Dark Mode

Full dark mode support with user toggle:

```css
/* Light mode */
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--text-primary: #0f172a;
--text-secondary: #475569;

/* Dark mode */
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--text-primary: #f8fafc;
--text-secondary: #94a3b8;
```

---

## 4. Desktop UX - LP Management

### 4.1 LP List View

**Route:** `/warehouse/license-plates`

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  License Plates                              [+ New LP] [Print] │
├─────────────────────────────────────────────────────────────────┤
│  Warehouse: [Main ▼]  Status: [All ▼]  QA: [All ▼]  [Search...] │
│  Product: [All ▼]  Expiry: [All dates ▼]  Batch: [________]     │
├─────────────────────────────────────────────────────────────────┤
│  □  LP Number     Product        Qty    UoM  Location  Status   │
│  ─────────────────────────────────────────────────────────────  │
│  □  LP250119-001  Chicken Breast 100    kg   A-01-01   ● Avail  │
│  □  LP250119-002  Flour          500    kg   B-02-03   ● Avail  │
│  □  LP250119-003  Sugar          250    kg   C-01-01   ● Reserv │
│  □  LP250118-015  Milk           200    L    A-03-02   ● Block  │
│  ...                                                             │
├─────────────────────────────────────────────────────────────────┤
│  Showing 1-50 of 1,234  [< 1 2 3 ... 25 >]   [50 ▼] per page   │
└─────────────────────────────────────────────────────────────────┘
```

#### Table Columns

| Column | Width | Sortable | Description |
|--------|-------|----------|-------------|
| Checkbox | 32px | No | Bulk selection |
| LP Number | 140px | Yes | Monospace, clickable → details |
| Product | 200px | Yes | Product name |
| Qty | 80px | Yes | Right-aligned, monospace |
| UoM | 50px | No | Unit of measure |
| Location | 100px | Yes | Location code |
| Status | 80px | Yes | Color-coded badge |
| QA | 80px | Yes | Color-coded badge |
| Expiry | 100px | Yes | Date with color indicator |
| Batch | 120px | Yes | Batch number |
| Actions | 80px | No | [...] menu |

#### Row Height & Density

- **Compact view:** 36px row height (default for desktop)
- **Comfortable view:** 44px row height (toggle available)
- Row hover: Light background highlight
- Selected row: Subtle border + background

#### Bulk Actions

When rows selected, action bar appears:

```
┌─────────────────────────────────────────────────────────────────┐
│  12 selected   [Move] [Print Labels] [Change QA] [Block] [Clear]│
└─────────────────────────────────────────────────────────────────┘
```

#### Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    📦                                           │
│                                                                 │
│              No License Plates Yet                              │
│                                                                 │
│    License Plates are created when you receive goods from       │
│    Purchase Orders or Transfer Orders.                          │
│                                                                 │
│              [Receive from PO]  [Create Manual LP]              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | New LP (manual) |
| `E` | Edit selected LP |
| `M` | Move selected LP(s) |
| `P` | Print label(s) |
| `Ctrl+A` | Select all |
| `Esc` | Clear selection |
| `/` | Focus search |

### 4.2 LP Detail Modal

Triggered by clicking LP number in list.

```
┌─────────────────────────────────────────────────────────────────┐
│  LP250119-001                                          [X Close]│
├─────────────────────────────────────────────────────────────────┤
│  [Overview] [Genealogy] [History] [Reservations]                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Product         Chicken Breast                                 │
│  Quantity        100 kg                                         │
│  Status          ● Available                                    │
│  QA Status       ● Passed                                       │
│                                                                 │
│  ─────────────────────────────────                              │
│                                                                 │
│  Batch           BATCH-2025-320                                 │
│  Supplier Batch  SUP-ABC-123                                    │
│  Expiry          2025-12-31 (42 days)                          │
│  Manufacture     2025-01-15                                     │
│                                                                 │
│  ─────────────────────────────────                              │
│                                                                 │
│  Warehouse       Main Warehouse                                 │
│  Location        A-01-01 (Receiving Zone)                       │
│  PO Number       PO-2025-0123                                   │
│  GRN             GRN-2025-0456                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Move] [Split] [Block] [Print Label]                           │
└─────────────────────────────────────────────────────────────────┘
```

#### Genealogy Tab

Visual tree showing LP relationships:

```
┌─────────────────────────────────────────────────────────────────┐
│  Genealogy                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Origin                                                         │
│  └── LP250115-001 (Received from PO-2025-0100)                 │
│                                                                 │
│  This LP                                                        │
│  └── LP250119-001 (Split from LP250115-001)                    │
│                                                                 │
│  Children                                                       │
│  ├── LP250120-001 (Split: 50 kg)                               │
│  └── LP250120-002 (Split: 50 kg) → Consumed by WO-2025-0789    │
│                                                                 │
│  [Expand Full Tree]                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### History Tab

Timeline of all operations on this LP:

```
┌─────────────────────────────────────────────────────────────────┐
│  History                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  2025-01-19 14:32  Moved                                       │
│  B-02-03 → A-01-01 by Jan Kowalski                             │
│                                                                 │
│  2025-01-19 10:15  QA Status Changed                           │
│  Pending → Passed by Maria Nowak                                │
│                                                                 │
│  2025-01-18 08:45  Created                                     │
│  Received from PO-2025-0123 by Adam Wiśniewski                 │
│  GRN: GRN-2025-0456                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Desktop UX - ASN & GRN

### 5.1 ASN List View

**Route:** `/warehouse/asn`

```
┌─────────────────────────────────────────────────────────────────┐
│  Advanced Shipping Notices                        [+ Create ASN]│
├─────────────────────────────────────────────────────────────────┤
│  Status: [Pending ▼]  Supplier: [All ▼]  Date: [This week ▼]   │
├─────────────────────────────────────────────────────────────────┤
│  ASN Number    PO Number    Supplier      Expected   Items Stat │
│  ─────────────────────────────────────────────────────────────  │
│  ASN-0123     PO-2025-100  ABC Foods     Today      5    ● Pend│
│  ASN-0124     PO-2025-101  XYZ Supplies  Tomorrow   3    ● Pend│
│  ASN-0122     PO-2025-099  ABC Foods     Yesterday  8    ✓ Recv│
│  ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 GRN Creation Flow (Desktop)

**Auto-prefill pattern**: System fills all fields from ASN/PO, user only confirms or adjusts.

#### Step 1: Select Source

```
┌─────────────────────────────────────────────────────────────────┐
│  Receive Goods                                         [X Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Source Type                                                    │
│  ○ Purchase Order                                               │
│  ○ Transfer Order                                               │
│  ○ ASN (Advanced Shipping Notice)                              │
│                                                                 │
│  ─────────────────────────────────                              │
│                                                                 │
│  Select PO  [Search or scan PO number...]                      │
│                                                                 │
│  Recent POs awaiting receipt:                                   │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  PO-2025-0123  ABC Foods     5 items  Due: Today    │       │
│  │  PO-2025-0124  XYZ Supplies  3 items  Due: Tomorrow │       │
│  │  PO-2025-0120  ABC Foods     8 items  Due: Jan 15   │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 2: Review & Receive (Auto-Prefilled)

```
┌─────────────────────────────────────────────────────────────────┐
│  Receive: PO-2025-0123 (ABC Foods)                     [X Close]│
├─────────────────────────────────────────────────────────────────┤
│  Warehouse: [Main Warehouse ▼]  Location: [A-01-01 Receiving ▼] │
├─────────────────────────────────────────────────────────────────┤
│  Product         Ordered  Received  Batch         Expiry   Loc  │
│  ─────────────────────────────────────────────────────────────  │
│  Chicken Breast  100 kg   [100   ]  [BATCH-320 ]  [Dec 31] [▼] │
│  Flour           500 kg   [500   ]  [BATCH-321 ]  [Mar 15] [▼] │
│  Sugar           250 kg   [250   ]  [BATCH-322 ]  [Jun 30] [▼] │
│  Milk            200 L    [200   ]  [BATCH-323 ]  [Feb 28] [▼] │
│  Eggs            50 doz   [50    ]  [BATCH-324 ]  [Feb 15] [▼] │
├─────────────────────────────────────────────────────────────────┤
│  □ Print LP labels automatically                                │
│  □ Set all QA status to: [Pending ▼]                           │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                                    [Complete Receipt] │
└─────────────────────────────────────────────────────────────────┘
```

**Prefill Sources:**
- Batch: From ASN supplier_batch_number or auto-generate
- Expiry: From ASN expiry_date or product default shelf life
- Location: From warehouse default_receiving_location_id
- QA Status: From warehouse_settings.default_qa_status

---

## 6. Desktop UX - Stock Movements

### 6.1 Create Movement

**Route:** `/warehouse/movements/new`

#### Single LP Move

```
┌─────────────────────────────────────────────────────────────────┐
│  Move License Plate                                    [X Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LP Number      [LP250119-001        ] [Scan]                   │
│                                                                 │
│  ─────────────────────────────────                              │
│  Current: A-01-01 (Receiving) - 100 kg Chicken Breast           │
│  ─────────────────────────────────                              │
│                                                                 │
│  Warehouse      [Main Warehouse ▼]  ← Toggle to change WH       │
│                                                                 │
│  Destination    [Search location...     ]                       │
│                                                                 │
│  Recent:  [A-02-01] [B-01-01] [C-03-02]  ← Flat list shortcuts  │
│                                                                 │
│  ─────────────────────────────────                              │
│                                                                 │
│  Quantity       [100      ] kg   □ Full LP (no split)          │
│                                                                 │
│  Reason         [________________] (optional)                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                                        [Confirm Move] │
└─────────────────────────────────────────────────────────────────┘
```

**Warehouse Scope Pattern:**
- Warehouse dropdown at top acts as scope filter
- Location list only shows locations in selected warehouse
- Recent locations are filtered to current warehouse
- User can change warehouse with explicit action (not every move)

#### Bulk Move (Multiple LPs)

```
┌─────────────────────────────────────────────────────────────────┐
│  Bulk Move (12 LPs selected)                           [X Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Selected LPs:                                                  │
│  LP250119-001 (100 kg), LP250119-002 (500 kg), ...             │
│  [View all 12]                                                  │
│                                                                 │
│  Destination    [B-02-01 Storage Zone  ▼]                      │
│                                                                 │
│  Reason         [Restock storage area  ]                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                                   [Move All 12 LPs]   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Desktop UX - Split & Merge

### 7.1 Split LP

```
┌─────────────────────────────────────────────────────────────────┐
│  Split License Plate                                   [X Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Source LP      LP250119-001                                    │
│  Product        Chicken Breast                                  │
│  Current Qty    100 kg                                          │
│                                                                 │
│  ─────────────────────────────────                              │
│                                                                 │
│  Split Quantity                                                 │
│                                                                 │
│  [====●==========] 30 / 100 kg                                 │
│                                                                 │
│  New LP Qty     [30        ] kg  ← Numeric input (primary)     │
│  Remaining      70 kg                                           │
│                                                                 │
│  ─────────────────────────────────                              │
│                                                                 │
│  New LP Location                                                │
│  ○ Same as source (A-01-01)                                    │
│  ○ Different: [Search location...  ]                           │
│                                                                 │
│  New LP Number  LP250119-045 (auto-generated)                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                                       [Confirm Split] │
└─────────────────────────────────────────────────────────────────┘
```

**Design Notes:**
- Slider for visual reference, but numeric input is primary (user preference)
- Slider updates numeric input and vice versa
- Validation: split qty must be > 0 and < current qty
- New LP inherits all attributes (batch, expiry, QA status)

### 7.2 Merge LPs

```
┌─────────────────────────────────────────────────────────────────┐
│  Merge License Plates                                  [X Close]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Primary LP (keeps number)                                      │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  LP250119-001  Chicken Breast  100 kg  BATCH-320    │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  Add LPs to merge:  [Scan or search LP...]                     │
│                                                                 │
│  Selected for merge:                                            │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  LP250119-005  Chicken Breast  50 kg   BATCH-320  [X]│       │
│  │  LP250119-008  Chicken Breast  75 kg   BATCH-320  [X]│       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  ─────────────────────────────────                              │
│                                                                 │
│  Result Preview:                                                │
│  LP250119-001 = 100 + 50 + 75 = 225 kg                         │
│                                                                 │
│  ⚠ Merged LPs will be marked as consumed                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Cancel]                                      [Confirm Merge]  │
└─────────────────────────────────────────────────────────────────┘
```

**Merge Validation Rules:**
- Same product_id
- Same uom
- Same batch_number (or all null)
- Same qa_status
- Same expiry_date (or within configurable tolerance)

**Confirm After Selection:** User sees full preview with total before committing.

---

## 8. Desktop UX - Pallet Management

### 8.1 Pallet List

**Route:** `/warehouse/pallets`

```
┌─────────────────────────────────────────────────────────────────┐
│  Pallets                                         [+ New Pallet] │
├─────────────────────────────────────────────────────────────────┤
│  Status: [Open ▼]  Location: [All ▼]  Date: [This week ▼]      │
├─────────────────────────────────────────────────────────────────┤
│  Pallet Number  Type      Location  LPs  Weight   Status        │
│  ─────────────────────────────────────────────────────────────  │
│  PAL-2025-001   EUR       S-01-01   8    425 kg   ● Open        │
│  PAL-2025-002   Standard  S-01-02   12   680 kg   ● Closed      │
│  PAL-2024-985   EUR       S-02-01   6    320 kg   ● Shipped     │
│  ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Pallet Detail

```
┌─────────────────────────────────────────────────────────────────┐
│  PAL-2025-001 (Open)                                   [X Close]│
├─────────────────────────────────────────────────────────────────┤
│  Type: EUR Pallet     Location: S-01-01                         │
│  Created: 2025-01-19  Weight: 425 kg                            │
├─────────────────────────────────────────────────────────────────┤
│  License Plates (8)                           [+ Add LP] [Scan] │
│  ─────────────────────────────────────────────────────────────  │
│  LP250119-001  Chicken Breast  100 kg  [Remove]                 │
│  LP250119-002  Flour           200 kg  [Remove]                 │
│  LP250119-003  Sugar           125 kg  [Remove]                 │
│  ...                                                             │
├─────────────────────────────────────────────────────────────────┤
│  [Move Pallet]  [Print Label]              [Close Pallet]       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Scanner UX - Mobile Workflows

### 9.1 Scanner Design Principles

For the mobile scanner (80% of users), these principles apply:

1. **Warehouse-scoped operations**: Select warehouse once via button, then all operations within
2. **Scrolling interface**: Natural vertical scroll, no pagination
3. **56px minimum tap targets**: Gloves-friendly
4. **Offline-first**: Queue operations for sync
5. **Minimal typing**: Scan everything possible
6. **Sound/haptic feedback**: Confirm actions in noisy environment

### 9.2 Scanner Home

```
┌─────────────────────────────┐
│  ≡  MonoPilot Scanner   🌙  │  ← Dark mode toggle
├─────────────────────────────┤
│                             │
│  Warehouse: Main WH    [▼]  │  ← Warehouse scope selector
│                             │
│  ┌───────────────────────┐  │
│  │     📦 RECEIVE        │  │  56px height
│  │     From PO/TO/ASN    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │     ↔️ MOVE           │  │
│  │     LP to Location    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │     ✂️ SPLIT          │  │
│  │     Divide LP         │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │     🔗 MERGE          │  │
│  │     Combine LPs       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │     📦 PACK           │  │
│  │     Add to Pallet     │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│  ● Online          Queue: 0 │  ← Sync status
└─────────────────────────────┘
```

### 9.3 Scanner Receive Workflow

#### Step 1: Select Source

```
┌─────────────────────────────┐
│  ←  Receive                 │
├─────────────────────────────┤
│                             │
│  [Scan PO/ASN barcode...]   │  56px input
│                             │
│  ─────── OR ───────         │
│                             │
│  Pending Receipts:          │
│                             │
│  ┌───────────────────────┐  │
│  │  PO-2025-0123         │  │  Scrollable list
│  │  ABC Foods - 5 items  │  │
│  │  Due: Today           │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  PO-2025-0124         │  │
│  │  XYZ Supplies - 3 itm │  │
│  │  Due: Tomorrow        │  │
│  └───────────────────────┘  │
│                             │
│  [Show more...]             │
│                             │
└─────────────────────────────┘
```

#### Step 2: Scan Items (Auto-Prefill)

```
┌─────────────────────────────┐
│  ←  PO-2025-0123      2/5   │  ← Progress indicator
├─────────────────────────────┤
│                             │
│  Chicken Breast             │
│  Expected: 100 kg           │
│                             │
│  ─────────────────────      │
│                             │
│  Received Qty               │
│  [100            ] kg       │  56px, numeric keyboard
│                             │
│  Batch (prefilled)          │
│  [BATCH-320      ]          │
│                             │
│  Expiry (prefilled)         │
│  [2025-12-31     ]          │
│                             │
│  Location                   │
│  [A-01-01 Receiving ▼]      │
│                             │
├─────────────────────────────┤
│                             │
│  [✓ CONFIRM & NEXT]         │  60px primary button
│                             │
└─────────────────────────────┘
```

#### Step 3: Complete

```
┌─────────────────────────────┐
│  ←  Receipt Complete   ✓    │
├─────────────────────────────┤
│                             │
│           ✓                 │
│                             │
│  GRN-2025-0456 Created      │
│                             │
│  5 License Plates created   │
│                             │
│  ─────────────────────      │
│                             │
│  □ Print labels (5)         │
│                             │
├─────────────────────────────┤
│                             │
│  [RECEIVE ANOTHER]          │  Primary
│                             │
│  [Back to Home]             │  Secondary
│                             │
└─────────────────────────────┘
```

### 9.4 Scanner Move Workflow

```
┌─────────────────────────────┐
│  ←  Move LP                 │
├─────────────────────────────┤
│                             │
│  Scan LP                    │
│  [LP250119-001      ] [📷]  │
│                             │
│  ─────────────────────      │
│  Chicken Breast - 100 kg    │
│  Current: A-01-01           │
│  ─────────────────────      │
│                             │
│  Scan Destination           │
│  [                  ] [📷]  │
│                             │
│  Quick Select:              │
│  [A-02-01] [B-01-01] [C-01] │
│                             │
│  Quantity                   │
│  [100            ] kg       │
│  □ Full LP (no split)       │
│                             │
├─────────────────────────────┤
│                             │
│  [✓ CONFIRM MOVE]           │
│                             │
└─────────────────────────────┘
```

### 9.5 Scanner Split Workflow

```
┌─────────────────────────────┐
│  ←  Split LP                │
├─────────────────────────────┤
│                             │
│  Source LP                  │
│  [LP250119-001      ] [📷]  │
│                             │
│  ─────────────────────      │
│  Chicken Breast - 100 kg    │
│  Batch: BATCH-320           │
│  ─────────────────────      │
│                             │
│  Split Quantity             │
│                             │
│  [===●=========] 30/100     │  Slider for visual
│                             │
│  [30             ] kg       │  Numeric input (primary)
│                             │
│  Remaining: 70 kg           │
│                             │
│  New LP Location            │
│  ○ Same (A-01-01)           │
│  ○ Different: [Select...]   │
│                             │
├─────────────────────────────┤
│                             │
│  [✓ CONFIRM SPLIT]          │
│                             │
└─────────────────────────────┘
```

### 9.6 Scanner Pack Workflow

```
┌─────────────────────────────┐
│  ←  Pack to Pallet          │
├─────────────────────────────┤
│                             │
│  Scan Pallet                │
│  [PAL-2025-001      ] [📷]  │
│                             │
│  ─────────────────────      │
│  Location: S-01-01          │
│  LPs: 5  Weight: 325 kg     │
│  ─────────────────────      │
│                             │
│  Scan LP to Add             │
│  [                  ] [📷]  │
│                             │
│  Added:                     │
│  ┌───────────────────────┐  │
│  │ LP250119-010  100 kg  │  │
│  │ LP250119-011  125 kg  │  │
│  └───────────────────────┘  │
│                             │
│  [+ Scan More]              │
│                             │
├─────────────────────────────┤
│                             │
│  [Close Pallet]  [Done]     │
│                             │
└─────────────────────────────┘
```

### 9.7 Offline Mode

When offline, operations queue for sync:

```
┌─────────────────────────────┐
│  ⚠️ Offline Mode             │
├─────────────────────────────┤
│                             │
│  Operations will sync when  │
│  connection restored.       │
│                             │
│  Queue: 3 pending           │
│                             │
│  • Move LP250119-001        │
│  • Split LP250119-005       │
│  • Receive PO-2025-0123     │
│                             │
│  [View Queue]               │
│                             │
└─────────────────────────────┘
```

---

## 10. Component Library

### 10.1 LP Status Badge

```tsx
<LPStatusBadge status="available" />
// Variants: available, reserved, consumed, blocked
// Colors match design system
```

### 10.2 QA Status Badge

```tsx
<QAStatusBadge status="passed" />
// Variants: pending, passed, failed, quarantine
```

### 10.3 Expiry Indicator

```tsx
<ExpiryIndicator date="2025-12-31" />
// Colors: green (>30d), yellow (7-30d), orange (1-7d), red (expired)
```

### 10.4 Location Selector

```tsx
<LocationSelector
  warehouseId={warehouseId}
  value={locationId}
  onChange={setLocationId}
  showRecent={true}  // Flat list with recent shortcuts
/>
```

### 10.5 Quantity Input with Slider

```tsx
<QuantityInput
  value={quantity}
  onChange={setQuantity}
  max={100}
  unit="kg"
  showSlider={true}  // Visual slider + numeric input
/>
```

### 10.6 Scanner Input

```tsx
<ScannerInput
  placeholder="Scan LP barcode..."
  onScan={handleScan}
  showCamera={true}
  height={56}  // 56px for gloves
/>
```

### 10.7 Offline Indicator

```tsx
<OfflineIndicator
  status="offline"
  queueSize={3}
/>
```

---

## 11. Implementation Roadmap

### Phase 1: Desktop Core (Weeks 1-3)

| Task | Effort | Priority |
|------|--------|----------|
| LP List view with filters | 3d | P0 |
| LP Detail modal with tabs | 2d | P0 |
| GRN creation flow | 3d | P0 |
| Stock movement UI | 2d | P0 |
| Split/Merge dialogs | 2d | P0 |

**Success Metrics:**
- LP lookup: <3s
- GRN creation: <60s for 5 items
- User satisfaction: ≥4/5

### Phase 2: Scanner Core (Weeks 4-6)

| Task | Effort | Priority |
|------|--------|----------|
| Scanner home & navigation | 2d | P0 |
| Receive workflow | 3d | P0 |
| Move workflow | 2d | P0 |
| Split workflow | 2d | P0 |
| Offline queue | 3d | P0 |

**Success Metrics:**
- Receive per item: <15s
- Move operation: <10s
- Offline sync: 100% reliable

### Phase 3: Advanced Features (Weeks 7-9)

| Task | Effort | Priority |
|------|--------|----------|
| Merge workflow | 2d | P1 |
| Pallet management | 3d | P1 |
| Genealogy visualization | 2d | P1 |
| Bulk operations | 2d | P1 |
| Notifications | 2d | P1 |

**Success Metrics:**
- Genealogy trace: <30s
- Bulk move 20 LPs: <30s

---

## 12. Success Metrics

### Efficiency Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| PO receiving time | <60s for 5 items | Timer from start to GRN complete |
| LP lookup | <3s | Time to find specific LP |
| Stock move | <15s | Scanner workflow completion |
| Split operation | <20s | Scanner workflow completion |
| Genealogy trace | <30s | Time to view full tree |

### Adoption Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Scanner adoption | >90% of operators | Daily active scanner users |
| Offline usage | >30% of operations | Operations queued offline |
| Dark mode usage | >40% | User preference setting |

### Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Scan error rate | <2% | Failed scans / total scans |
| Data entry errors | <1% | Corrections needed post-entry |
| Offline sync success | 100% | Failed syncs = 0 |

### User Satisfaction

| Metric | Target | Measurement |
|--------|--------|-------------|
| NPS Score | >50 | Quarterly survey |
| Support tickets | <5/week | Tickets tagged "Warehouse UX" |
| Feature requests | Track | Log for roadmap planning |

---

## 13. Appendix

### 13.1 Notifications

All notifications enabled (per user preference):

| Notification | Trigger | Channel |
|--------------|---------|---------|
| LP below minimum | Qty < threshold | Push, Email |
| ASN arriving today | Expected date = today | Push |
| Order ready to ship | Picking complete | Push |
| LP expiry warning | 7 days to expiry | Push, Email |
| Sync complete | Offline queue processed | Push |

### 13.2 Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| `N` | New record |
| `E` | Edit selected |
| `M` | Move LP(s) |
| `P` | Print label(s) |
| `S` | Split LP |
| `Ctrl+S` | Save |
| `Ctrl+A` | Select all |
| `Del` | Delete/Block |
| `Esc` | Close modal |
| `/` | Focus search |

### 13.3 References

**Internal Docs:**
- PRD: `docs/prd/modules/warehouse.md`
- Architecture: `docs/architecture/modules/warehouse.md`
- Scanner patterns: `docs/architecture/patterns/scanner.md`

**External References:**
- WCAG 2.1 AAA: https://www.w3.org/WAI/WCAG21/quickref/
- Touch Target Sizes: https://web.dev/accessible-tap-targets/
- PWA Best Practices: https://web.dev/progressive-web-apps/

### 13.4 Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-19 | 1.0 | Initial Warehouse UX specification | AI UX Designer |

---

**End of Warehouse Module UX Specification**
