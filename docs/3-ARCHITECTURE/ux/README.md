# MonoPilot UX Documentation

**Status**: Settings Module Complete (29 screens)
**Last Updated**: 2025-12-11
**UX-DESIGNER**: Active

---

## Overview

This directory contains all UX design work for MonoPilot - user flows, wireframes, component specifications, and design patterns. UX work follows the **UX-DESIGNER** methodology with mandatory 4-state design (Loading, Empty, Error, Success) and user approval workflow.

---

## Core UI Pattern: Modals Over Page Reloads

**IMPORTANT**: MonoPilot uses lightweight modals for CRUD operations to minimize page reloads.

| Pattern | Implementation | Example |
|---------|----------------|---------|
| **List/Table** | Full page | User List, Warehouse List |
| **Create** | Modal | Create User Modal |
| **Edit** | Modal | Edit Warehouse Modal |
| **View Details** | Modal | View Product Modal |
| **Quick Actions** | Modal | Confirm Delete, Test Webhook |

See: [ui-navigation-patterns.md](./patterns/ui-navigation-patterns.md) for full specification.

---

## Directory Structure

```
docs/3-ARCHITECTURE/ux/
├── README.md                           # This file
├── UX-AUDIT-AND-ROADMAP.md             # Project-wide UX audit and prioritization
├── flows/                              # User flow diagrams
│   ├── flow-scanner-receive.md         # [TODO] Scanner GRN workflow
│   ├── flow-scanner-move.md            # [TODO] Scanner move workflow
│   ├── flow-scanner-putaway.md         # [TODO] Scanner putaway workflow
│   ├── flow-scanner-consumption.md     # [TODO] Production consumption
│   └── flow-scanner-output.md          # [TODO] Production output
├── wireframes/                         # Screen wireframes (all 4 states)
│   ├── scanner-receive/                # [TODO] GRN screens
│   ├── scanner-move/                   # [TODO] Move screens
│   ├── scanner-putaway/                # [TODO] Putaway screens
│   ├── scanner-consumption/            # [TODO] Consumption screens
│   └── scanner-output/                 # [TODO] Output screens
├── specs/                              # Component specifications
│   ├── component-scan-input.md         # [TODO] Scan input field
│   ├── component-scanner-screen.md     # [TODO] Scanner page template
│   └── component-state-handler.md      # [TODO] State wrapper
└── patterns/                           # Design patterns & guidelines
    ├── accessibility-checklist.md      # ✅ A11y requirements
    ├── scanner-ui-patterns.md          # ✅ Scanner design patterns
    └── state-management-patterns.md    # [TODO] State handling guide
```

---

## Current Status

### Completed (2025-12-11)

| Document | Status | Description |
|----------|--------|-------------|
| UX-AUDIT-AND-ROADMAP.md | ✅ Complete | Project audit, gap analysis, 4-phase roadmap |
| accessibility-checklist.md | ✅ Complete | WCAG 2.1 AA checklist, scanner-specific requirements |
| scanner-ui-patterns.md | ✅ Complete | 10 scanner components, workflow patterns |
| ui-navigation-patterns.md | ✅ Complete | Modals vs pages, row click behavior |
| **Settings Module (Epic 1)** | ✅ Complete | **29 wireframes** - full module coverage |

### Settings Module Wireframes (29 screens)

| Group | Screens | Status |
|-------|---------|--------|
| Onboarding Wizard | SET-001 to SET-006 | ✅ 6 screens |
| Organization & Users | SET-007 to SET-011 | ✅ 5 screens |
| Infrastructure | SET-012 to SET-019 | ✅ 8 screens |
| Master Data | SET-020 to SET-022 | ✅ 3 screens |
| Integrations | SET-023 to SET-024 | ✅ 2 screens |
| Security & Audit | SET-025 to SET-027 | ✅ 3 screens |
| Advanced | SET-028 to SET-029 | ✅ 2 screens |

Files: `wireframes/SET-*.md`

### In Progress

| Document | Status | Next Steps |
|----------|--------|------------|
| Technical Module (Epic 2) | ⏳ Pending | Products, Materials, BOMs, Recipes |
| Production Module (Epic 4) | ⏳ Pending | Work Orders, Scanner workflows |
| Warehouse Module (Epic 5) | ⏳ Pending | LP Management, Scanner workflows |
| Component Specs | ⏳ Pending | Define ScanInput, ScannerScreen, StateHandler |

---

## Quick Start

### For Product Managers

1. **Start Here**: Read [UX-AUDIT-AND-ROADMAP.md](./UX-AUDIT-AND-ROADMAP.md)
   - Understand UX gaps across 11 modules
   - Review prioritized 4-phase roadmap
   - Select approval mode (review_each or auto_approve)

2. **Review Patterns**: Read [scanner-ui-patterns.md](./patterns/scanner-ui-patterns.md)
   - See standardized scanner workflows
   - Understand 4-state requirements
   - Review component examples

3. **Approve Flows**: Starting with Phase 1 (Critical Scanner Workflows)
   - Scanner Receive (GRN from PO) - HIGHEST PRIORITY
   - Scanner Move
   - Scanner Putaway
   - Scanner Consumption
   - Scanner Output

### For Designers (UX-DESIGNER)

1. **Follow Methodology**: UX-DESIGNER workflow from `.claude/packs/methodology/agents/UX-DESIGNER.md`
   - UNDERSTAND → CHECK APPROVAL MODE → MAP FLOW → WIREFRAME → COLLECT FEEDBACK → VERIFY → HANDOFF

2. **Use Patterns**: All scanner screens follow [scanner-ui-patterns.md](./patterns/scanner-ui-patterns.md)
   - Scanner Shell layout (Header + Content + Action Bar)
   - 10 component patterns (ScanInput, StateHandler, etc.)
   - 2 common workflows (Scan→Confirm→Complete, List→Select→Scan→Confirm)

3. **Ensure Accessibility**: Every screen must pass [accessibility-checklist.md](./patterns/accessibility-checklist.md)
   - Touch targets >= 48x48dp
   - Contrast >= 4.5:1
   - All 4 states defined
   - Audible feedback specified

4. **Get Approval**: Present each screen to user (or auto-approve if opted in)
   - Max 3 iterations per screen
   - Escalate to PM-AGENT if no agreement

### For Developers (FRONTEND-DEV)

1. **Check Handoff**: Only implement screens with user approval
   - Approval status in handoff YAML
   - All 4 states must be defined
   - Accessibility checklist passed

2. **Use Component Library**: Reuse scanner components
   - ScanInput (from ADR-006 code example)
   - ScannerScreen layout template
   - StateHandler wrapper

3. **Follow ADRs**: Implementation must match architecture decisions
   - [ADR-006](../decisions/ADR-006-scanner-first-mobile-ux.md) - Scanner patterns
   - [ADR-004](../decisions/ADR-004-gs1-barcode-compliance.md) - GS1 parsing
   - [ADR-005](../decisions/ADR-005-fifo-fefo-picking-strategy.md) - FIFO/FEFO UI

---

## Design Principles

### Scanner-First Mobile UX (ADR-006)

All warehouse and production floor workflows prioritize **scanner experience**:

1. **Large Touch Targets**: 48x48dp minimum (glove-friendly)
2. **Scan-First Input**: Hardware scanner primary, keyboard fallback
3. **Linear Task Flows**: Step-by-step, one action per screen
4. **High Contrast**: Slate-900 background, white text (18.96:1 contrast)
5. **Audible Feedback**: Beeps + vibration for success/error
6. **Offline Support**: Works without connectivity, syncs later

### 4-State Requirement (UX-DESIGNER)

Every screen MUST define:

| State | Purpose | Required Elements |
|-------|---------|-------------------|
| **Loading** | Data fetching, barcode lookup | Skeleton/spinner + progress text |
| **Empty** | No data to display | Icon + explanation + action |
| **Error** | Operation failed | Error message + recovery action |
| **Success** | Operation completed | Confirmation + next steps |

**Failure to define all 4 states blocks handoff to FRONTEND-DEV.**

### Accessibility (WCAG 2.1 AA)

All designs must pass:

- Touch targets >= 48x48dp (scanner) or >= 36x36px (desktop)
- Color contrast >= 4.5:1 for text
- Keyboard navigation support
- Screen reader compatibility
- Mobile-first responsive design

Full checklist: [accessibility-checklist.md](./patterns/accessibility-checklist.md)

---

## Approval Workflow

### Option 1: Review Each Screen (Default)

UX-DESIGNER presents each screen individually:

```
1. UX-DESIGNER creates user flow
2. User reviews and approves flow
3. UX-DESIGNER creates wireframe (all 4 states)
4. User reviews and approves wireframe
5. Repeat for next screen
6. Max 3 iterations per screen
7. Handoff to FRONTEND-DEV after approval
```

**Best for**: New features, complex workflows, uncertain requirements

### Option 2: Auto-Approve (Opt-In)

User trusts UX-DESIGNER decisions:

```
1. User explicitly opts for auto-approve
2. UX-DESIGNER creates flows + wireframes
3. User can request changes later
4. Handoff to FRONTEND-DEV immediately
```

**Best for**: Minor updates, established patterns, trusted designer

**Important**: Auto-approve requires **explicit user consent**. Never assume.

---

## Prioritized Roadmap

### Phase 1: Critical Scanner Workflows (Weeks 1-2)

**Goal**: Enable warehouse operations with scanner

| Priority | Module | Workflow | Status |
|----------|--------|----------|--------|
| P0 | Warehouse | Scanner Receive (GRN from PO) | ⏳ Awaiting approval mode |
| P0 | Warehouse | Scanner Move | ⏳ Awaiting approval mode |
| P0 | Warehouse | Scanner Putaway | ⏳ Awaiting approval mode |
| P0 | Production | Scanner Consumption | ⏳ Awaiting approval mode |
| P0 | Production | Scanner Output | ⏳ Awaiting approval mode |

**Rationale**: These 5 workflows are **core** daily operations. Without them, operators cannot work.

### Phase 2: Desktop Critical Paths (Weeks 3-4)

**Goal**: Enable planning and monitoring

| Priority | Module | Workflow | Status |
|----------|--------|----------|--------|
| P0 | Production | WO Lifecycle (Start/Pause/Complete) | Planned |
| P0 | Warehouse | GRN from PO (Desktop) | Planned |
| P0 | Warehouse | LP Management (Split/Merge) | Planned |
| P1 | Planning | PO Creation | Planned |
| P1 | Planning | WO Creation | Planned |

### Phase 3: Component Library (Week 5)

**Goal**: Reusable patterns

| Priority | Component | Status |
|----------|-----------|--------|
| P0 | ScanInput | Planned |
| P0 | ScannerScreen | Planned |
| P0 | StateHandler | Planned |
| P1 | LPCard | Planned |
| P1 | MaterialList | Planned |

### Phase 4: Quality & Shipping (Weeks 6-8)

**Goal**: Complete warehouse-to-shipping flow

| Priority | Module | Workflow | Status |
|----------|--------|----------|--------|
| P1 | Quality | QA Inspection (Scanner) | Planned |
| P1 | Quality | QA Hold/Release | Planned |
| P1 | Shipping | Picking (Scanner) | Planned |
| P1 | Shipping | Packing | Planned |

---

## Gap Analysis Summary

### What Exists

- ✅ PRD documentation (11 modules, 607+ FRs)
- ✅ ADR-006 (Scanner-First Mobile UX architecture)
- ✅ Basic scanner page (`/scanner`)
- ✅ Production dashboard (partial states)

### What's Missing

- ❌ User flows (0 of 50+ workflows)
- ❌ Wireframes (0 of 200+ screens)
- ❌ State definitions (4 states per screen)
- ❌ Component specifications (0 of 15+ components)
- ❌ Desktop UX patterns (undefined)

### Impact

| Module | Code Status | UX Gap | Impact |
|--------|-------------|--------|--------|
| Production | 60% | High | WO workflows blocked |
| Warehouse | 20% | **Critical** | Core operations blocked |
| Quality | 0% | High | QA workflows undefined |
| Shipping | 0% | High | Outbound ops undefined |

**Warehouse UX is CRITICAL** - blocks inventory operations for entire system.

---

## Next Steps

### Immediate (Awaiting User Decision)

1. **User selects approval mode**: Review Each [1] or Auto-Approve [2]
2. **User confirms starting priority**: Scanner Receive (GRN from PO)
3. **UX-DESIGNER creates**:
   - User flow for Scanner Receive
   - Wireframes for Scanner Receive (all 4 states)
   - Component specs (ScanInput, ScannerScreen, StateHandler)

### Week 1-2 (Phase 1)

- Complete 5 critical scanner workflows
- User approval for each workflow
- Handoff to FRONTEND-DEV

### Week 3-4 (Phase 2)

- Complete desktop critical paths
- Focus on WO lifecycle and GRN desktop
- Continue handoffs to FRONTEND-DEV

### Week 5+ (Phases 3-4)

- Build component library
- Complete Quality & Shipping modules
- Achieve 90%+ UX coverage

---

## Quality Metrics

### Coverage Targets

| Metric | Target | Current |
|--------|--------|---------|
| PRD FRs with user flows | 90% | 0% |
| Screens with wireframes | 90% | 0% |
| Screens with all 4 states | 100% | 0% |
| A11y checklist pass rate | 100% | N/A |
| Approval on first iteration | 70% | N/A |

### Success Criteria

- **Phase 1**: 5 scanner workflows ready for development (all states, approved)
- **Phase 2**: Desktop critical paths ready for development
- **Phase 3**: Component library available for reuse
- **Phase 4**: Complete UX coverage for Epic 5 (Warehouse) and Epic 6 (Quality)

---

## Related Documentation

### Architecture Decisions (ADRs)

- [ADR-006: Scanner-First Mobile UX](../decisions/ADR-006-scanner-first-mobile-ux.md) - Scanner patterns
- [ADR-004: GS1 Barcode Compliance](../decisions/ADR-004-gs1-barcode-compliance.md) - Barcode parsing
- [ADR-005: FIFO/FEFO Picking Strategy](../decisions/ADR-005-fifo-fefo-picking-strategy.md) - Pick suggestions

### PRD Modules

- [Warehouse PRD](../../1-BASELINE/product/modules/warehouse.md) - 1,147 lines, 26 FRs
- [Production PRD](../../1-BASELINE/product/modules/production.md) - 1,328 lines, 22 FRs
- [Quality PRD](../../1-BASELINE/product/modules/quality.md) - 731 lines, 16 FRs
- [Shipping PRD](../../1-BASELINE/product/modules/shipping.md) - 1,345 lines, 20 FRs

### Methodology

- [UX-DESIGNER Agent](./.claude/packs/methodology/agents/UX-DESIGNER.md) - Workflow and requirements

---

## Questions & Clarifications

Before starting UX work, need to confirm:

1. **Approval Mode**: Review Each [1] or Auto-Approve [2]?
2. **Starting Priority**: Scanner Receive (GRN from PO) as top priority?
3. **Hardware Context**: Specific scanner hardware (Zebra, Honeywell, generic)?
4. **Offline Priority**: How critical is offline support (Warehouse vs Production)?
5. **Label Printing**: Should UX include label print preview/confirmation screens?

---

**Status**: Ready to start Phase 1 - awaiting user approval mode selection.

**Contact**: UX-DESIGNER agent active, ready for user flows and wireframes.

---

_Last Updated: 2025-12-11_
_Version: 1.0 - Initial UX audit complete_
