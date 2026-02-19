# MonoPilot UX Audit & Roadmap

**Date**: 2025-12-11
**Status**: Initial UX Assessment
**UX-DESIGNER**: Active

---

## Executive Summary

MonoPilot is a food manufacturing MES system with 11 modules, targeting SMB manufacturers (5-100 employees). After reviewing PRDs, architecture decisions, and existing code, this document provides:

1. **UX Audit** - Current state analysis
2. **Gap Analysis** - What UX work is missing
3. **Prioritized Roadmap** - What to design first
4. **Initial Wireframe Plan** - Starting with critical modules

---

## Current State Analysis

### What Exists

#### PRD Documentation (95% Quality)
- **11 modules** fully documented with functional requirements
- **607+ FRs** with acceptance criteria
- Clear feature descriptions but **NO user flows or wireframes**
- Desktop and scanner workflows described in text only

#### Architecture Decisions
- **ADR-006**: Scanner-First Mobile UX (ACCEPTED)
  - Separate routes under `/scanner/*`
  - 48px minimum touch targets
  - Scan-first input patterns
  - Offline support with sync
  - **Code examples provided but no visual designs**

#### Implemented Code (Partial)
- **Scanner Terminal**: Basic navigation page exists (`/scanner`)
  - 6 module cards (Output, Reserve LP, Ship TO, Receive TO, Production, Count)
  - Quick scan section
  - **No standardized scanner workflow components**
  - **No loading/empty/error states defined**

- **Production Dashboard**: Implemented (`/production/dashboard`)
  - 5 KPI cards
  - Active WOs table
  - Alerts panel
  - **Missing states**: Loading exists, empty states partial, no error recovery UX

- **Warehouse Module**: Code at 20%, no pages implemented
- **Quality, Shipping**: 0% implementation

### What's Missing

| Gap Category | Impact | Priority |
|--------------|--------|----------|
| **User Flows** | High | P0 |
| **Wireframes** | High | P0 |
| **State Definitions** | High | P0 |
| **Scanner UX Patterns** | Critical | P0 |
| **Desktop UX Patterns** | High | P1 |
| **Component Specs** | Medium | P1 |
| **Accessibility Guidelines** | Medium | P1 |
| **Mobile Responsiveness** | Medium | P2 |

---

## Gap Analysis by Module

### Epic 4: Production (60% Code Complete)

**PRD Coverage**: 1,328 lines, 22 FRs
**Code Status**: Dashboard exists, WO execution partial

| Feature | PRD | UX Flow | Wireframe | Implementation |
|---------|-----|---------|-----------|----------------|
| Production Dashboard | Yes | No | No | Yes (partial states) |
| WO Start | Yes | No | No | No |
| WO Pause/Resume | Yes | No | No | No |
| Material Consumption (Desktop) | Yes | No | No | No |
| Material Consumption (Scanner) | Yes | No | No | No |
| Output Registration (Scanner) | Yes | No | Basic page only | Basic page only |

**UX Gaps**:
- No user flow for WO lifecycle (Released → In Progress → Completed)
- No wireframes for consumption workflows
- States undefined: What happens when material not found? QA hold? Shortage?
- Scanner patterns not standardized

### Epic 5: Warehouse (20% Code Complete) - CRITICAL

**PRD Coverage**: 1,147 lines, 26 FRs
**Code Status**: Minimal, scanner pages missing

| Feature | PRD | UX Flow | Wireframe | Implementation |
|---------|-----|---------|-----------|----------------|
| GRN from PO | Yes | No | No | No |
| Scanner Receive | Yes | No | No | No |
| Scanner Move | Yes | No | No | No |
| Scanner Putaway | Yes | No | No | No |
| LP Split/Merge | Yes | No | No | No |
| QA Status Management | Yes | No | No | No |

**UX Gaps**:
- Scanner workflows critical but not designed
- FIFO/FEFO picking suggestions - how to display?
- GS1 barcode parsing feedback - visual confirmation?
- Offline sync UX - how to show sync status?
- Error recovery - what if wrong barcode scanned?

### Epic 6: Quality (0% Code Complete)

**PRD Coverage**: 731 lines, 16 FRs
**Code Status**: Not started

**UX Gaps**: Everything missing

### Epic 7: Shipping (0% Code Complete)

**PRD Coverage**: 1,345 lines, 20 FRs
**Code Status**: Not started

**UX Gaps**: Everything missing

---

## Critical UX Requirements (Scanner-First)

Based on ADR-006, scanner workflows are **PRIMARY** for warehouse and production floor operators.

### Scanner UX Principles (from ADR-006)

1. **Large Touch Targets**: 48px minimum (glove-friendly)
2. **Scan-First Input**: Hardware scanner as primary input
3. **Linear Task Flows**: Step-by-step, not dashboard navigation
4. **Minimal Decisions**: One action per screen
5. **Offline Support**: Works without connectivity, syncs later
6. **Audible Feedback**: Success beeps, error alerts

### States Required (ALL Scanner Workflows)

Per UX-DESIGNER identity, ALL screens need 4 states:

| State | Scanner Context | Example |
|-------|-----------------|---------|
| **Loading** | Barcode lookup, API call | Skeleton with "Scanning..." |
| **Empty** | No items to receive, no WOs | "No pending receipts" + action |
| **Error** | Barcode not found, QA hold | Specific error + retry action |
| **Success** | Item scanned, move completed | Confirmation + next step |

---

## Prioritized UX Roadmap

### Phase 1: Critical Scanner Workflows (Weeks 1-2)

**Goal**: Enable warehouse operations with scanner

| Priority | Module | Workflow | Deliverable |
|----------|--------|----------|-------------|
| P0 | Warehouse | Scanner Receive (GRN from PO) | Flow + Wireframes (4 states) |
| P0 | Warehouse | Scanner Move | Flow + Wireframes (4 states) |
| P0 | Warehouse | Scanner Putaway | Flow + Wireframes (4 states) |
| P0 | Production | Scanner Consumption | Flow + Wireframes (4 states) |
| P0 | Production | Scanner Output | Flow + Wireframes (4 states) |

**Rationale**: These 5 workflows are the **core** of daily operations. Without them, operators cannot work.

### Phase 2: Desktop Critical Paths (Weeks 3-4)

**Goal**: Enable planning and monitoring

| Priority | Module | Workflow | Deliverable |
|----------|--------|----------|-------------|
| P0 | Production | WO Lifecycle (Start/Pause/Complete) | Flow + Wireframes (4 states) |
| P0 | Warehouse | GRN from PO (Desktop) | Flow + Wireframes (4 states) |
| P0 | Warehouse | LP Management (Split/Merge) | Flow + Wireframes (4 states) |
| P1 | Planning | PO Creation | Flow + Wireframes (4 states) |
| P1 | Planning | WO Creation | Flow + Wireframes (4 states) |

### Phase 3: Component Library (Week 5)

**Goal**: Reusable patterns

| Priority | Component | Purpose |
|----------|-----------|---------|
| P0 | ScanInput | Standard scan input with fallback |
| P0 | ScannerScreen | Scanner page template (header + content + action bar) |
| P0 | StateHandler | Loading/Empty/Error/Success wrapper |
| P1 | LPCard | License Plate display card |
| P1 | MaterialList | Expected materials list with status |
| P1 | ProgressIndicator | Step-by-step progress |

### Phase 4: Quality & Shipping (Weeks 6-8)

**Goal**: Complete warehouse-to-shipping flow

| Priority | Module | Workflow | Deliverable |
|----------|--------|----------|-------------|
| P1 | Quality | QA Inspection (Scanner) | Flow + Wireframes (4 states) |
| P1 | Quality | QA Hold/Release | Flow + Wireframes (4 states) |
| P1 | Shipping | Picking (Scanner) | Flow + Wireframes (4 states) |
| P1 | Shipping | Packing | Flow + Wireframes (4 states) |

---

## Approval Mode Selection

Before starting wireframes, I need your approval mode preference:

### How would you like to review the wireframes?

1. **Review Each Screen** (recommended) - I'll present each screen for your approval
2. **Auto-Approve** - Trust my design decisions (you can still request changes later)

**Please choose**: [1] or [2]

---

## Immediate Next Steps (Pending Your Choice)

Once you select approval mode, I will:

### Step 1: User Flows for Warehouse Scanner Workflows

Create user flows for:
1. **Scanner Receive (GRN from PO)** - Most critical, blocks inventory
2. **Scanner Move** - Daily operations
3. **Scanner Putaway** - FIFO/FEFO compliance

### Step 2: Wireframes for Top Priority Workflow

Start with **Scanner Receive (GRN from PO)** - all 4 states:
- Loading: Barcode lookup in progress
- Empty: No pending POs to receive
- Error: Barcode not found / Over-receipt / QA hold
- Success: Receipt confirmed, LP created

### Step 3: Component Specs

Define reusable scanner components:
- ScanInput (from ADR-006 code example)
- ScannerScreen layout
- StateHandler wrapper

---

## Design Constraints & Patterns

### From ADR-006 (Scanner-First Mobile UX)

```
Route Structure: /scanner/[workflow]/[action]
Touch Targets: 48px minimum
Text Sizes: 24px primary, 18px secondary
Colors: High contrast (slate-900 bg, white text)
Input: inputMode="none" for hardware scanners
Feedback: Audible success/error
Offline: IndexedDB queue, sync on reconnect
```

### From ADR-001 (License Plate Inventory)

```
Core Concept: LP is atomic unit, no loose quantity
Display: Always show LP number, product, qty, batch, expiry, location
Actions: Scan → Lookup → Display → Confirm
Genealogy: Track splits/merges in all UX
```

### From ADR-004 (GS1 Barcode Compliance)

```
Barcode Parsing: GTIN-14 (01), Batch (10), Expiry (17), SSCC-18 (00)
UX Feedback: Show parsed fields immediately after scan
Validation: Visual confirmation of product match
Error Handling: Clear message for invalid GTIN
```

### From ADR-005 (FIFO/FEFO Picking Strategy)

```
Pick Suggestions: Show recommended LP with reason
Display: LP list sorted by receipt date or expiry
Warnings: Yellow for FEFO violation, red for block
Override: Allow with reason (if settings permit)
```

---

## Accessibility Requirements

Per UX-DESIGNER identity, all designs must pass:

- [ ] Touch targets >= 48x48dp
- [ ] Color contrast >= 4.5:1
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Mobile-first responsive (breakpoints: <768px, 768-1024px, >1024px)
- [ ] Loading indicators with ARIA labels
- [ ] Error messages with clear recovery actions
- [ ] Success confirmations with visual + audible feedback

---

## Quality Gates (Before Handoff to FRONTEND-DEV)

Before any workflow can be handed off for implementation:

- [ ] User flow approved (explicit user approval OR auto-approve opt-in)
- [ ] All 4 states wireframed (Loading, Empty, Error, Success)
- [ ] Touch targets verified (48px minimum)
- [ ] Accessibility checklist passed
- [ ] Breakpoints defined (mobile/tablet/desktop)
- [ ] Component specs created (if new components needed)
- [ ] Feedback iterations completed (max 3 per screen)

---

## Deliverables Structure

All UX work will be organized as:

```
docs/3-ARCHITECTURE/ux/
├── flows/
│   ├── flow-scanner-receive.md
│   ├── flow-scanner-move.md
│   ├── flow-scanner-putaway.md
│   ├── flow-scanner-consumption.md
│   └── flow-scanner-output.md
├── wireframes/
│   ├── wireframe-scanner-receive-scan-po.md
│   ├── wireframe-scanner-receive-scan-product.md
│   ├── wireframe-scanner-receive-confirm.md
│   └── wireframe-scanner-receive-success.md
├── specs/
│   ├── component-scan-input.md
│   ├── component-scanner-screen.md
│   └── component-state-handler.md
└── patterns/
    ├── accessibility-checklist.md
    ├── scanner-ui-patterns.md
    └── state-management-patterns.md
```

---

## Questions for Clarification

Before I start designing, please confirm:

1. **Approval Mode**: Review each screen [1] or Auto-approve [2]?
2. **Starting Priority**: Should I start with "Scanner Receive (GRN from PO)" as top priority?
3. **Hardware Context**: Do you have specific scanner hardware in mind (Zebra, Honeywell, or generic)?
4. **Offline Priority**: How critical is offline support? (Warehouse vs Production floor)
5. **Label Printing**: Should UX include label print preview/confirmation screens?

---

## Success Metrics

UX design quality measured by:

- **Coverage**: % of PRD FRs with user flows and wireframes
- **State Completeness**: % of screens with all 4 states defined
- **Approval Rate**: % of wireframes approved on first iteration
- **Accessibility**: % of designs passing A11y checklist
- **Handoff Readiness**: % of workflows ready for FRONTEND-DEV

**Target**: 90%+ on all metrics for Phase 1 (Critical Scanner Workflows)

---

**Next Action**: Awaiting your approval mode selection and confirmation on starting priority.

Once confirmed, I will create:
1. User flow for Scanner Receive (GRN from PO)
2. Wireframes for each step (all 4 states)
3. Component specs for ScanInput, ScannerScreen, StateHandler

**Estimated Timeline**:
- User Flow: 1 day
- Wireframes (5-7 screens × 4 states): 3-5 days
- Component Specs: 1 day
- **Total for first workflow**: ~1 week

---

_Document Version: 1.0_
_UX-DESIGNER: Ready to start Phase 1_
