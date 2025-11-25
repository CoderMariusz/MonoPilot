# MonoPilot - UX Design Index

**Date:** 2025-11-15
**Designer:** Mary (Business Analyst / UX Designer)
**Methodology:** BMAD Method UX Design Workflow
**Status:** Phase 1 Complete - Scanner, Planning, Production, Settings Modules Done

---

## Overview

This index tracks all UX design work for MonoPilot modules. Each module follows the **7-Step UX Design Methodology** established in the Scanner Module deep dive.

**Design Philosophy:**
- **Mobile-First** - 70% of operators use mobile devices (BYOD strategy)
- **Gloves-Friendly** - 56px minimum tap targets for cold storage environments
- **Offline-First** - Scanner works without internet, syncs on reconnect
- **Scan-First, Type-Last** - Minimize manual data entry (80% reduction target)
- **High Contrast** - WCAG AAA (7:1 ratio) for outdoor visibility
- **Error Prevention** - Validate early, fail gracefully, undo easily

---

## Module Status

| Module | Priority | Status | Spec Document | Completion Date | Notes |
|--------|----------|--------|---------------|-----------------|-------|
| **Scanner** | P0 🔴 | ✅ **Complete** | [ux-design-scanner-module.md](./ux-design-scanner-module.md) | 2025-11-15 | Hybrid approach: Variant B (default) + Variant D (expert) |
| **Planning** | P0 🔴 | ✅ **Complete** | [ux-design-planning-module.md](./ux-design-planning-module.md) | 2025-11-15 | Hybrid approach: Spreadsheet (bulk) + Timeline (visual) + Wizard (onboarding) |
| **Production** | P0 🔴 | ✅ **Complete** | [ux-design-production-module.md](./ux-design-production-module.md) | 2025-11-15 | Hybrid approach: Variant B (Kanban P0) + Variant C (Templates P0) + Variant D (Analytics P2) |
| **Settings** | P0 🔴 | ✅ **Complete** | [ux-design-settings-module.md](./ux-design-settings-module.md) | 2025-11-15 | Hybrid approach: Variant B (Wizard P0) + Variant C (Templates P0) + Variant D (Analytics P2) |
| **Technical** | P1 🟡 | ✅ **Complete** | [ux-design-technical-module.md](./ux-design-technical-module.md) | 2025-11-15 | Grouped Dashboard (3 categories) + BOM Timeline + Allergen Matrix |
| **QA** | P1 🟡 | ✅ **Complete** | [ux-design-qa-module.md](./ux-design-qa-module.md) | 2025-11-15 | Mobile PWA (offline) + NCR Kanban + CoA Auto-gen + Quarantine |
| **Warehouse** | P0 🔴 | ✅ **Complete** | [ux-design-warehouse-module.md](./ux-design-warehouse-module.md) | 2025-11-19 | Dual-interface: Desktop compact + Scanner mobile (1:20 ratio) |
| **Shipping** | P1 🟡 | ✅ **Complete** | [ux-design-shipping-module.md](./ux-design-shipping-module.md) | 2025-11-19 | Paper + Scanner toggle, Scan-to-pack, Generic carriers, PDF BOL |
| **NPD** | P1 🟡 | ✅ **Complete** | [ux-design-npd-module-2025-11-16.md](./ux-design-npd-module-2025-11-16.md) | 2025-11-16 | Idea management, innovation pipeline (Growth/Enterprise) |

**Legend:**
- ✅ **Complete** - Specification finished, ready for implementation
- 🚧 **In Progress** - Active design work
- 📋 **Planned** - Queued for design
- ⏸️ **Paused** - Blocked or deprioritized

---

## UX Design Methodology (7 Steps)

This methodology is applied to all modules. See **Scanner Module** as reference implementation.

### Step 1: Project & Users Confirmation ✅
**Goal:** Validate understanding of project vision, target users, core features, platform requirements.

**Deliverables:**
- Project vision summary
- Target user personas (3-4 primary)
- Core features list
- Platform requirements (mobile/desktop, responsive breakpoints)
- User journeys specific to module

**Template Output:** `<template-output id="project_and_users_confirmed">`

**Example (Scanner):**
- Primary Persona: Warehouse Operator (mobile PWA, BYOD, 50-100 scans/shift)
- Core Features: ASN receiving, LP creation, WO material consumption
- Platform: Mobile-first PWA (375px-768px), offline-capable

---

### Step 2: Current State Analysis + Design Variants ✅
**Goal:** Review existing implementation, identify pain points, create 3-4 design variants.

**Deliverables:**
- Code review (current implementation)
- "What works well" vs "UX problems" table
- "Before" user journey (step-by-step with timings/taps/typing)
- 3-4 design variants with wireframes
- Comparison matrix (speed, learning curve, error prevention)
- Recommendation: Hybrid approach (default + expert toggle)

**Template Output:** `<template-output id="scanner_ux_deep_dive">`

**Example (Scanner):**
- **Variant A:** Card-Based Wizard (current enhanced) - 4-5 items/min
- **Variant B:** Single-Screen Scanner (recommended default) - 8-10 items/min 🏆
- **Variant C:** Guided Conversation (onboarding) - 3-4 items/min
- **Variant D:** Bulk Mode (expert toggle) - 12-15 items/min ⚡
- **Recommendation:** Hybrid B+D (80% use default, 20% expert)

---

### Step 3: Detailed Wireframes ✅
**Goal:** Create pixel-perfect wireframes for recommended variants (default + expert).

**Deliverables:**
- ASCII wireframes (mobile 375px, desktop 1024px)
- Interaction flows (step-by-step with timings)
- Error handling for each step
- Pre/post-conditions
- Success metrics

**Format:**
```
┌─────────────────────────────┐
│  Header (ASN-12345)   [⚙️]  │
├─────────────────────────────┤
│ Camera Viewfinder (40%)     │
│ [Point at barcode to scan]  │
├─────────────────────────────┤
│ Scanned Items (40%)         │
│ ✓ Chicken - 100kg           │
├─────────────────────────────┤
│ [Retry] [✓ Finish]          │
└─────────────────────────────┘
```

**Example (Scanner):**
- Variant B: Single-Screen wireframe (mobile + desktop)
- Variant D: Bulk Mode wireframe (desktop table view)
- Workflow 1: Receive ASN (10 steps, 15-20s, 3 taps, 0 typing)
- Workflow 2: Process WO (10 steps, 20-25s, 8 taps, 2 chars typing)

---

### Step 4: Component Library Design ✅
**Goal:** Define reusable components, color palette, typography, spacing for module.

**Deliverables:**
- Color palette (light + dark mode, WCAG AAA)
- Typography (font sizes, weights, gloves-friendly)
- Spacing (tap targets 56px+, padding, gaps)
- Component specs (buttons, inputs, cards, modals)
- Interaction patterns (haptic, toasts, loading states)

**Components:**
```tsx
<ScannerButton size="large" variant="primary" haptic={true} />
<ScannerInput size="large" type="numeric" autoFocus={true} />
<ScannedItemCard item={item} swipeable={true} height={60} />
<CameraViewfinder onScanSuccess={handleScan} overlayGuide={true} />
<NumericKeypad maxLength={6} decimalPlaces={2} />
<OfflineIndicator status="offline" queueSize={3} />
```

**Example (Scanner):**
- Primary button: 60px height, blue-500, haptic feedback
- Input: 56px height, 24px font, auto-focus
- Tap targets: 56px minimum (gloves), 60px recommended
- Contrast: 7:1 (WCAG AAA) for outdoor visibility

---

### Step 5: Detailed Workflows ✅
**Goal:** Document key workflows with step-by-step tables, timings, error handling.

**Deliverables:**
- Workflow tables (step, screen, action, response, duration)
- Total time/taps/typing comparison (before → after)
- Error handling table (error, trigger, response, operator action)
- Pre/post-conditions
- Success metrics

**Table Format:**
| Step | Screen | Actor Action | System Response | Duration |
|------|--------|--------------|-----------------|----------|
| 1 | Scanner Hub | Tap "Receive" | Navigate to `/scanner/receive` | <1s |
| 2 | Receive - Select | Scan ASN barcode | Load ASN, navigate to Scan | <2s |
| ... | ... | ... | ... | ... |

**Example (Scanner):**
- Workflow 1: Receive ASN (Variant B)
  - Before: 50-75s, 40-50 taps, 100 chars typing
  - After: 15-20s, 3 taps, 0 chars typing
  - Improvement: 70% faster, 93% fewer taps, 100% less typing

---

### Step 6: Implementation Roadmap ✅
**Goal:** Define phases (MVP, Pro, Accessibility) with tasks, timelines, success metrics.

**Deliverables:**
- Phase 1: MVP (default variant) - Week 1-2
- Phase 2: Pro features (expert variant) - Week 3-4
- Phase 3: Accessibility (guided variant elements) - Week 5-6
- Task breakdown (component, days)
- Success metrics per phase

**Example (Scanner):**
- **Phase 1 (P0):** Variant B (Single-Screen) - 2 weeks
  - Camera integration (2 days)
  - Single-screen UI (3 days)
  - Offline queue (2 days)
  - UX polish (2 days)
  - Fallback to Variant A (1 day)
  - **Metrics:** ≥8 items/min, ≥4/5 stars, <5% error rate

- **Phase 2 (P1):** Variant D (Bulk Mode) - 2 weeks
  - Bulk scan UI (2 days)
  - Keyboard shortcuts (1 day)
  - Mobile compact view (2 days)
  - Settings & onboarding (2 days)
  - **Metrics:** ≥12 items/min, ≥20% adoption, <10% error rate

---

### Step 7: Save Design Specification ✅
**Goal:** Create comprehensive markdown document with all sections.

**File Structure:**
```
docs/ux-design-{module}-module.md
├── 1. Executive Summary
├── 2. Project & Users Context
├── 3. Current State Analysis
├── 4. Design Variants (3-4 approaches)
├── 5. Comparison Matrix
├── 6. Recommendation (Hybrid Approach)
├── 7. Implementation Roadmap
├── 8. Design System - Component Library
├── 9. Workflows - Detailed Interactions
├── 10. Next Steps
├── 11. Appendix (Glossary, References, Changelog)
```

**Example:** [ux-design-scanner-module.md](./ux-design-scanner-module.md) (13,500+ words)

---

## Design Principles (All Modules)

### 1. Mobile-First (Scanner, QA)
- Design for 375px first, scale up to 1024px+
- Thumb zone navigation (bottom 20% of screen)
- 56px minimum tap targets (gloves-friendly)
- Offline-first architecture (Service Workers)

### 2. Desktop-Optimized (Planning, Technical)
- Keyboard shortcuts (Enter, Ctrl+Z, Esc)
- Multi-column layouts (2-3 columns)
- Bulk actions (batch edit, mass select)
- Compact views (40px rows, tables)

### 3. Responsive Hybrid (Production, Settings)
- Adaptive layouts (mobile 1-col, desktop 2-3 col)
- Contextual navigation (mobile: bottom tabs, desktop: sidebar)
- Touch + keyboard friendly
- Graceful degradation (desktop features → mobile)

### 4. Accessibility (WCAG AAA)
- **Color Contrast:** 7:1 ratio (AAA) for primary text
- **Font Sizes:** 16px minimum (body), 20px (buttons), 24px (inputs)
- **ARIA Labels:** All interactive elements
- **Keyboard Navigation:** Tab order, focus states, Esc to close
- **Screen Readers:** Semantic HTML, ARIA roles
- **Haptic Feedback:** 50ms vibrate on success, 100ms on error

### 5. Performance
- **UI Response:** <200ms (real-time production workflows)
- **Camera Start:** <1s (scanner viewfinder)
- **Offline Sync:** <2s background sync
- **API Response:** <500ms p95 (scanner operations)
- **Page Load:** <3s (mobile 3G)

---

## Key Metrics (Success Criteria)

### Operator Efficiency (Scanner, Production, QA)
- **Speed:** 100% faster (items/min) vs current
- **Taps:** 80-90% reduction vs current
- **Typing:** 100% reduction (scan-first, type-last)
- **Error Rate:** <5% (acceptable for speed)

### Planner Productivity (Planning, Technical)
- **Workflow Time:** 50% faster (PO/TO/WO creation)
- **Bulk Actions:** 200% faster (bulk edit, mass select)
- **Learning Curve:** <30 min to proficiency
- **User Satisfaction:** ≥4/5 stars

### Adoption Metrics (All Modules)
- **DAU/MAU:** ≥80% (mission-critical usage)
- **Expert Mode:** ≥20% adoption within 3 months
- **Mobile Usage:** ≥70% for Scanner/QA, ≥30% for Planning
- **Offline Usage:** ≥50% of scanner operations

### Quality Metrics (All Modules)
- **Error Prevention:** ≥95% reduction in data entry errors
- **Undo Rate:** <5% (good default choices)
- **Support Tickets:** 50% reduction (UX issues)
- **Training Time:** 50% reduction (intuitive UX)

---

## Next Modules Roadmap

### Phase 1: Foundation (Week 1-2) - COMPLETE ✅
- **Scanner Module** (P0)
  - Variant B (Single-Screen) - default
  - Variant D (Bulk Mode) - expert toggle
  - Specification: 13,500+ words, 4 variants, 2 workflows

### Phase 2: Planning Module (Week 3-4) - COMPLETE ✅
- **Planning Module** (P0)
  - Variant B (Spreadsheet Mode) - PRIMARY for bulk creation
  - Variant C (Timeline Mode) - VISUAL for drag-drop scheduling
  - Variant D (Wizard Mode) - ONBOARDING for new users
  - Specification: 24,000+ words, 4 variants, 4 workflows
  - Key Innovation: Drag-drop row reordering for production priority
  - Expected Impact: 97% time savings, $332k/year ROI

---

### Phase 3: Technical Module (Week 5-6)
**Priority:** P1 (Important for process engineers)
**Estimated Effort:** 2-3 days

**Scope:**
- Product Management (CRUD, categories, allergens)
- BOM Management (multi-version, date-based, visual timeline)
- Routing Operations (sequencing, machine assignment)
- Allergen Matrix (cross-contamination visualization)

**Primary Personas:**
- Process Engineer (desktop, BOM versioning, technical specs)
- R&D Manager (desktop, recipe development, reformulation)

**Expected Variants:**
- Variant A: Form-Based (current)
- Variant B: Visual Timeline (multi-version BOM, drag-and-drop dates)
- Variant C: Spreadsheet Import (bulk BOM creation)
- Variant D: AI-Assisted (suggest BOM items from product type)

---

### Phase 4: Production Module (Week 7-8)
**Priority:** P1 (High for production managers)
**Estimated Effort:** 2-3 days

**Scope:**
- Production Dashboard (real-time KPIs, OEE, line utilization)
- WO Execution Monitor (progress, material shortages)
- Yield Tracking (planned vs actual, variance alerts)
- Downtime Tracking (reasons, duration, impact)

**Primary Personas:**
- Production Manager (desktop + mobile, dashboard review)
- Line Supervisor (tablet, real-time monitoring)

**Expected Variants:**
- Variant A: Card-Based Dashboard (current)
- Variant B: Real-Time Board (WebSocket updates, visual alerts)
- Variant C: KPI Focus Mode (single metric full-screen)
- Variant D: Customizable Widgets (drag-and-drop layout)

---

### Phase 5: QA Module (Week 9-10)
**Priority:** P2 (Medium for QA teams)
**Estimated Effort:** 2-3 days

**Scope:**
- QA Inspections (mobile checklists, photo upload)
- NCR Management (non-conformance reports, root cause)
- CoA Generation (certificates of analysis, PDF export)
- Quarantine Management (hold/release workflows)

**Primary Personas:**
- QA Inspector (mobile + tablet, shop floor inspections)
- QA Manager (desktop, NCR review, CoA approval)

**Expected Variants:**
- Variant A: Form-Based Inspection (current)
- Variant B: Checklist Mode (mobile, swipe-to-complete)
- Variant C: Photo-First (camera → annotate → submit)
- Variant D: Voice Inspection (hands-free, audio notes)

---

### Phase 6: Settings Module (Week 11-12)
**Priority:** P2 (Low frequency, admin-only)
**Estimated Effort:** 1-2 days

**Scope:**
- User Management (RBAC, roles, permissions)
- Warehouse Settings (locations, zones, default settings)
- System Configuration (org settings, modules, features)
- Integrations (ERP, IoT, label printers)

**Primary Personas:**
- IT Manager (desktop, system configuration)
- Admin (desktop, user management)

**Expected Variants:**
- Variant A: Tab-Based Settings (current)
- Variant B: Search-First (find setting by keyword)
- Variant C: Wizard (onboarding flow for new org)

---

## Tools & Templates

### Design Tools
- **Wireframes:** ASCII art (markdown), Figma (visual mockups)
- **Prototypes:** Figma (interactive), HTML/CSS (code prototypes)
- **User Testing:** UserTesting.com, Loom (screen recording)
- **Collaboration:** Figma comments, GitHub Issues

### Templates (Reusable)

#### 1. UX Design Specification Template
```markdown
# {Module} - UX Design Specification

## 1. Executive Summary
## 2. Project & Users Context
## 3. Current State Analysis
## 4. Design Variants (3-4 approaches)
## 5. Comparison Matrix
## 6. Recommendation (Hybrid Approach)
## 7. Implementation Roadmap
## 8. Design System - Component Library
## 9. Workflows - Detailed Interactions
## 10. Next Steps
## 11. Appendix (Glossary, References, Changelog)
```

#### 2. Workflow Table Template
```markdown
| Step | Screen | Actor Action | System Response | Duration |
|------|--------|--------------|-----------------|----------|
| 1 | Hub | Tap card | Navigate | <1s |
| 2 | List | Select item | Load details | <2s |
```

#### 3. Component Spec Template
```markdown
### ComponentName

**Props:**
- `size`: "small" | "medium" | "large"
- `variant`: "primary" | "secondary" | "danger"
- `disabled`: boolean
- `onClick`: () => void

**Specs:**
- Height: 60px (large), 56px (medium), 48px (small)
- Tap target: 56px minimum
- Haptic: 50ms vibrate on tap
- ARIA: role="button", aria-label="..."
```

---

## References

### Internal Docs
- **PRD Index:** [prd/index.md](./prd/index.md) (216 FRs across 9 modules)
- **PRD Modules:** `docs/prd/modules/*.md` (Settings, Technical, Planning, Production, Warehouse, Quality, Shipping, NPD, Finance)
- **Architecture Index:** [architecture/index.md](./architecture/index.md)
- **Architecture Patterns:** `docs/architecture/patterns/*.md` (Infrastructure, Database, API, Frontend, Security, Scanner)
- **Architecture Modules:** `docs/architecture/modules/*.md` (Settings, Technical, Planning, Production, Warehouse, Quality, Shipping)
- **Product Brief:** [product-brief-MonoPilot-2025-11-15.md](./product-brief-MonoPilot-2025-11-15.md)
- **Brainstorming:** [brainstorming-session-results-2025-11-15.md](./brainstorming-session-results-2025-11-15.md)
- **Sprint Status:** [sprint-artifacts/sprint-status.yaml](./sprint-artifacts/sprint-status.yaml)

### External References
- **WCAG 2.1 AAA:** https://www.w3.org/WAI/WCAG21/quickref/
- **Touch Target Sizes:** https://web.dev/accessible-tap-targets/
- **PWA Best Practices:** https://web.dev/progressive-web-apps/
- **Mobile UX Patterns:** https://mobbin.com/browse/ios/apps
- **Design Systems:** Tailwind UI, Shadcn UI, Material Design

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-15 | 1.0 | Created UX Design Index, Scanner Module complete | Mary |
| 2025-11-15 | 1.1 | Planning Module complete (Spreadsheet + Timeline + Wizard) | Mary |
| 2025-11-15 | 1.2 | Production Module complete (Kanban + Templates + Analytics) | Mary |
| 2025-11-15 | 1.3 | Settings Module complete (Wizard + Templates + Analytics) | Mary |
| 2025-11-15 | 1.4 | Technical Module complete (Grouped Dashboard + BOM Timeline + Allergen Matrix) | Mary |
| 2025-11-15 | 1.5 | QA Module complete (Mobile PWA + NCR Kanban + CoA + Quarantine) | Mary |
| 2025-11-16 | 1.6 | NPD Module complete (Innovation pipeline, Idea management) | Mary |
| 2025-11-19 | 2.0 | **Major Update:** Warehouse + Shipping modules complete, references updated to modular PRD/Architecture structure | AI UX Designer |

---

**End of UX Design Index**
