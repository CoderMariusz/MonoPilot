# NPD Module - UX Design Specification

**Epic:** 8 - New Product Development
**Stories:** 8.1+ (Projects, Stage-Gate, Formulations, Compliance, Handoff)
**Based on:** Shared UI Design System

---

## 🔗 SHARED UI SYSTEM INTEGRATION

NPD Module integrates with [Shared UI Design System](./ux-design-shared-system.md).

**Applied Components:**
- ✅ **ModuleHeader**: NPD | Projects | Formulations | Compliance | Costing | ⚙️
- ✅ **Stats Cards**: 4 cards (Projects, In Development, Ready to Launch, Launched) - 120px, 2×2 grid
- ✅ **DataTable Base**: Projects list, Formulation versions, Compliance checklists (sortable, filterable)
- ✅ **Colors**: app-colors.ts (green Launched, orange In Dev, yellow Gate Hold, red Blocked)
- ✅ **Mobile Responsive**: Tables → Card view on < 768px

**NPD-Specific Features:**
- 🎯 **Stage-Gate Workflow** - 7 stages (Idea → Concept → Feasibility → Development → Validation → Launch Prep → Launched)
- 🎯 **Gate Entry Criteria** - Validate before advancing stage
- 🎯 **Formulation Management** - Multi-version recipes with allergen tracking
- 🎯 **Compliance Tracking** - Regulatory docs, approvals, checklists
- 🎯 **Costing** - Target vs estimated vs actual cost tracking
- 🎯 **Handoff Wizard** - One-click transfer to Production (Product + BOM + pilot WO)

**Layout:**
```
ModuleHeader: NPD│Projects│Formulations│Compliance│Costing│⚙️  ← Shared
[Create Project] [Start Formulation] [Handoff to Prod]        ← Shared buttons
[Stats: Projects, Dev, Ready, Launched]                       ← Shared (4 cards)
[Projects Pipeline] [Stage-Gate Board] [Kanban View]          ← NPD-specific
Gate enforcement, Compliance tracking, Handoff wizard         ← NPD-specific
```

---

## 1. Navigation

**Header:** NPD | **Projects** | **Formulations** | **Compliance** | **Costing** | ⚙️
**URL:** `/npd`

---

## 2. Dashboard (`/npd`)

### Stats Cards (4)
```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ TOTAL PROJECTS   │ │ IN DEVELOPMENT   │ │ READY TO LAUNCH  │ │ LAUNCHED         │
│ Count: 28        │ │ Count: 8         │ │ Count: 3         │ │ Count: 17        │
│ Active: 11       │ │ Feasibility: 4   │ │ Launch Prep: 3   │ │ Prod: 15         │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 3. Projects Page (`/npd/projects`)

### Projects Table

**Columns:**
```
[Checkbox] Project # ↕ | Name | Category | Stage ↕ | Owner | Target Date | Status | Actions
```

**Categories:**
- New Product
- Line Extension
- Reformulation
- Cost Reduction

**Stages (Color-coded):**
- Idea: gray-200
- Concept: blue-200
- Feasibility: yellow-200
- Development: orange-200
- Validation: purple-200
- Launch Prep: green-200
- Launched: green-200 (filled)

**Filters:**
- Stage (dropdown)
- Category (multi-select)
- Owner (dropdown)
- Status (Active, On Hold, Completed, Archived)
- Date Range

**Create Project Modal:**
```
┌─────────────────────────────────────┐
│ Create NPD Project                  │
├─────────────────────────────────────┤
│ Project Name: [______________]      │
│ Category: [New Product ▼]           │
│ Priority: [Medium ▼]                │
│ Target Launch: [2026-03-01]         │
│ Owner: [John ▼]                     │
│ Description: [Rich text area]       │
│                                     │
│ [Cancel] [Create]                   │
└─────────────────────────────────────┘
```

**Actions:** View 👁️ | Edit ✏️ | Advance Stage | Delete 🗑️

---

## 4. Project Detail Page

**URL:** `/npd/projects/[id]`

**Layout:**
```
PROJECT-001 | Cookie Dough v2.0 | In: Development (Feasibility stage)
Owner: Sarah | Target: 2026-03-01 | Priority: High

┌─────────────────────────────────────┐
│ STAGE-GATE WORKFLOW PROGRESS        │
├─────────────────────────────────────┤
│ ✓ Idea         → ✓ Concept → ✓ Feasibility → ▶ Development → Validation...
│ (2025-08-01)    (2025-09-15)  (2025-10-30)    (2025-11-27)
└─────────────────────────────────────┘

[Formulations Tab] [Compliance Tab] [Costing Tab] [History Tab]

FORMULATIONS:
│ Version | Created | Status | Allergens | Actions
│ v1.0    | Oct 30  | Draft  | Gluten    | [View][Edit][Clone]
│ v2.0    | Nov 27  | Active | Gluten    | [View][Edit]

COMPLIANCE CHECKLIST:
□ Regulatory review (Due: Dec 15)
□ Safety approval (In Progress)
□ Allergen documentation (Complete)
□ Label design (Pending)

COSTING:
Target: €2.50/unit | Estimated: €2.65/unit | Variance: +6%

[Gate Hold] [Advance to Validation] [Handoff to Production]
```

---

## 5. Gate Entry & Advancement

**When:** User clicks [Advance to Next Stage]

**Modal:**
```
┌──────────────────────────────────────┐
│ Advance to Stage: Validation         │
├──────────────────────────────────────┤
│ Gate Entry Criteria:                 │
│ ✓ Feasibility study completed       │
│ ✓ Cost estimate < €3.00             │
│ ✓ Regulatory docs submitted         │
│ ☐ Safety testing passed              ← MISSING
│                                      │
│ Cannot advance: 1 criteria not met  │
│ [See details] [Gate Override]        │
│                                      │
│ [Cancel]                             │
└──────────────────────────────────────┘
```

---

## 6. Handoff to Production Wizard

**When:** User clicks [Handoff to Production]

**Step 1: Confirm Readiness**
```
✓ Formulation finalized
✓ Compliance complete
✓ Cost approved
[Next]
```

**Step 2: Create Product**
```
Product Name: Cookie Dough v2.0
SKU: FG-CD-20
BOM Version: Link current formulation
[Next]
```

**Step 3: Create Pilot WO**
```
Pilot Batch: 100 kg
Line: [Line 1 ▼]
Target Date: [2026-01-15]
[Create & Complete Handoff]
```

**Result:** Product + BOM + Pilot WO created, project status → Launched

---

## 7. Colors & Interactions

**Stage colors:**
- Idea: gray-200
- Concept: blue-200
- Feasibility: yellow-200
- Development: orange-200
- Validation: purple-200
- Launch Prep: green-200
- Launched: green-600 (filled)

**Gate enforcement:** Red highlight on missing criteria, tooltip explains requirement

**Toast:**
- "Project advanced to Development"
- "Gate hold: Safety testing required"
- "Handoff complete - Project launched!"

---

## 8. Mobile Responsive

**< 768px:**
- Projects table → Card view
- Stage-gate pipeline → Vertical timeline
- Tabs become collapsible sections

---

## 9. Implementation Tasks

- [ ] Create NPDHeader + StatsCards
- [ ] Create Projects table + create/edit modals
- [ ] Create Project detail page (tabs: Formulations, Compliance, Costing)
- [ ] Implement Stage-Gate workflow + gate criteria enforcement
- [ ] Create Formulation management section
- [ ] Create Compliance checklist
- [ ] Create Costing dashboard
- [ ] Build Handoff Wizard (3-step modal)
- [ ] Add filters, search to projects table
- [ ] Mobile responsive (card view + vertical timeline)
- [ ] Apply colors from app-colors.ts

---

**End - ~320 wierszy**
