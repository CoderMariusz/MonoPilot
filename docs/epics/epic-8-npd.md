# Epic 8: New Product Development (NPD)

**Goal:** Enable end-to-end new product development with Stage-Gate workflow, formulation management, compliance tracking, and seamless handoff to production.

**Dependencies:** Epic 1 (Settings), Epic 2 (Technical - Products, BOMs)
**Required by:** None (upstream development process)

**FRs Covered:** 74 (NPD-FR-01 to NPD-FR-74)
**Stories:** 68
**Priority:** Should Have (Growth/Phase 2)
**Effort Estimate:** 6-8 weeks

**UX Design Reference:** [ux-design-npd-module.md](../ux-design-npd-module.md)

---

## Overview

NPD Module implements a Stage-Gate workflow for new product development in food manufacturing, from concept to production handoff.

**Key Features:**
- **Stage-Gate Pipeline**: 7 stages (Idea, Concept, Feasibility, Development, Validation, Launch Prep, Launched)
- **Formulation Management**: Multi-version formulations with allergen tracking
- **Compliance Tracking**: Regulatory docs, approvals, checklists
- **Costing**: Target vs estimated vs actual cost tracking
- **Handoff Wizard**: One-click transfer from NPD → Production (Product + BOM + pilot WO)

---

## Story 8.1: NPD Project CRUD

As an **NPD Lead**,
I want to create and manage NPD projects,
So that I can track new product development.

**Acceptance Criteria:**

**Given** the user has NPD Lead role
**When** they navigate to /npd/projects
**Then** they see a table with: Project Number, Name, Category, Stage, Owner, Created Date

**When** clicking "New Project"
**Then** modal opens with:
- project_name (required)
- category (dropdown: New Product, Line Extension, Reformulation, Cost Reduction)
- priority (Low, Medium, High, Strategic)
- target_launch_date (optional)
- project_owner (user dropdown)
- description (rich text)

**When** saving
**Then** project created with:
- Auto-generated project_number
- status = 'active'
- current_stage = 'idea'

**Prerequisites:** Epic 1

**Technical Notes:**
- FR: NPD-FR-01
- npd_projects table
- API: GET/POST/PUT/DELETE /api/npd/projects

---

## Story 8.2: Stage-Gate Workflow

As an **NPD Lead**,
I want projects to move through Stage-Gate,
So that development is structured.

**Acceptance Criteria:**

**Given** NPD project exists
**Then** has 7 stages:
1. Idea - Initial concept
2. Concept - Refined concept with target
3. Feasibility - Market & technical feasibility
4. Development - Formulation & prototyping
5. Validation - Testing & refinement
6. Launch Prep - Scale-up planning
7. Launched - In production

**When** advancing to next stage
**Then** gate entry criteria validated
**And** stage_entry_date recorded

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-02
- current_stage field, stage_history table

---

## Story 8.3: Gate Entry Criteria Enforcement

As a **System**,
I want to enforce gate entry criteria,
So that projects don't advance prematurely.

**Acceptance Criteria:**

**Given** project in stage N
**When** attempting to advance to N+1
**Then** validates gate criteria:
- All checklists complete
- Required approvals obtained
- Formulation approved (for Dev+ stages)
- Costing approved (for Validation+ stages)
- Compliance docs uploaded (for Launch Prep)

**When** criteria not met
**Then** shows blocking reasons
**And** prevents advancement

**Prerequisites:** Story 8.2

**Technical Notes:**
- FR: NPD-FR-03
- Gate validation logic per stage

---

## Story 8.4: Kanban Pipeline View

As an **NPD Manager**,
I want to see projects in Kanban pipeline,
So that I visualize progress.

**Acceptance Criteria:**

**Given** the user navigates to /npd/dashboard
**Then** Kanban board shows 7 columns (one per stage)

**And** each card shows:
- Project name
- Category badge
- Priority indicator
- Owner avatar
- Days in stage

**When** dragging card to next column
**Then** advances project (if criteria met)

**And** can filter by category, priority, owner

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-04
- Drag-drop UI with react-beautiful-dnd

---

## Story 8.5: Dashboard Filters

As an **NPD Manager**,
I want to filter dashboard,
So that I focus on relevant projects.

**Acceptance Criteria:**

**Given** viewing Kanban dashboard
**When** applying filters
**Then** can filter by:
- Category (multi-select)
- Priority (multi-select)
- Owner (multi-select)
- Status (Active, On Hold, Cancelled, Launched)
- Date range (created, launch target)

**And** filters persist across sessions

**Prerequisites:** Story 8.4

**Technical Notes:**
- FR: NPD-FR-05
- URL params for filter state

---

## Story 8.6: Timeline View

As an **NPD Manager**,
I want to see projects in timeline,
So that I plan resources.

**Acceptance Criteria:**

**Given** the user selects "Timeline View"
**Then** Gantt chart shows:
- X-axis: dates
- Each row: one project
- Bar: start → target launch
- Color by stage
- Milestones: gate transitions

**And** can zoom in/out
**And** can filter like Kanban

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-06
- Use recharts for timeline

---

## Story 8.7: Export Project List to CSV

As an **NPD Manager**,
I want to export project list,
So that I can report externally.

**Acceptance Criteria:**

**Given** viewing project list
**When** clicking "Export"
**Then** CSV downloads with columns:
- Project Number, Name, Category, Stage, Priority, Owner, Created, Target Launch, Status

**And** respects current filters

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-07
- CSV generation client-side

---

## Story 8.8: Formulation CRUD with Versioning

As an **R&D user**,
I want to create formulations with versions,
So that I iterate on recipes.

**Acceptance Criteria:**

**Given** NPD project in Development+ stage
**When** creating formulation
**Then** modal opens with:
- formulation_name (default: product name)
- version (auto: 1.0, 1.1, 2.0...)
- output_qty, output_uom
- effective_from (optional)
- effective_to (optional)
- status (Draft, Under Test, Approved, Rejected)

**And** formulation linked to project

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-08
- npd_formulations table (similar to BOMs)
- API: POST /api/npd/formulations

---

## Story 8.9: Add Formulation Items with Product Search

As an **R&D user**,
I want to add ingredients to formulation,
So that recipe is complete.

**Acceptance Criteria:**

**Given** formulation is being edited
**When** adding item
**Then** can search products by:
- Code
- Name
- Type (filter: RM, PKG)

**And** select product
**And** enter:
- quantity
- uom (from product)
- scrap_percent (optional)
- sequence (drag-drop reorder)

**Prerequisites:** Story 8.8

**Technical Notes:**
- FR: NPD-FR-09
- npd_formulation_items table

---

## Story 8.10: Auto-Aggregate Allergens

As a **System**,
I want to aggregate allergens from formulation items,
So that allergen declaration is accurate.

**Acceptance Criteria:**

**Given** formulation has items
**Then** automatically calculates allergens:
- Contains: union of all item "Contains"
- May Contain: union of all item "May Contain"

**And** shows on formulation detail
**And** updates when items change

**Prerequisites:** Story 8.9, Epic 2 (Product allergens)

**Technical Notes:**
- FR: NPD-FR-10
- Calculated on-the-fly or cached

---

## Story 8.11: Effective Date Support

As an **R&D user**,
I want to set effective dates on formulations,
So that versions are time-bound.

**Acceptance Criteria:**

**Given** creating formulation version
**Then** can set:
- effective_from (optional)
- effective_to (optional)

**And** only one version can be effective at a time (per product)

**Prerequisites:** Story 8.8

**Technical Notes:**
- FR: NPD-FR-11
- Date range validation (same as BOMs)

---

## Story 8.12: Prevent Overlapping Versions

As a **System**,
I want to prevent overlapping formulation dates,
So that there's no ambiguity.

**Acceptance Criteria:**

**Given** formulation exists with date range
**When** creating new version with overlapping dates
**Then** system blocks with error

**And** suggests available date ranges

**Prerequisites:** Story 8.11

**Technical Notes:**
- FR: NPD-FR-12
- Database trigger or API validation

---

## Story 8.13: Lock Formulation on Approval

As a **System**,
I want to lock approved formulations,
So that they can't be changed.

**Acceptance Criteria:**

**Given** formulation status = 'approved'
**Then** all fields become read-only
**And** can't add/remove items

**When** changes needed
**Then** must create new version

**And** Manager can override lock (with reason)

**Prerequisites:** Story 8.8

**Technical Notes:**
- FR: NPD-FR-13
- UI disable + API validation

---

## Story 8.14: Track Formulation Lineage

As an **R&D user**,
I want to see formulation version history,
So that I trace evolution.

**Acceptance Criteria:**

**Given** product has multiple formulation versions
**When** viewing formulation lineage
**Then** shows timeline:
- Version number
- Dates
- Status
- Created by
- Changes summary

**And** can compare versions

**Prerequisites:** Story 8.8

**Technical Notes:**
- FR: NPD-FR-14
- formulation_version_history table

---

## Story 8.15: Compare Formulation Versions

As an **R&D user**,
I want to compare formulation versions,
So that I see differences.

**Acceptance Criteria:**

**Given** multiple formulation versions
**When** selecting "Compare"
**Then** side-by-side view shows:
- Items added (green)
- Items removed (red)
- Items changed (yellow) with qty/% diff

**And** allergen differences

**Prerequisites:** Story 8.8

**Technical Notes:**
- FR: NPD-FR-15
- Diff algorithm

---

## Story 8.16: Clone Formulations

As an **R&D user**,
I want to clone formulations,
So that I create variants quickly.

**Acceptance Criteria:**

**Given** formulation exists
**When** clicking "Clone"
**Then** creates new formulation with:
- All items copied
- New version number
- Status = Draft
- Effective dates cleared

**And** user can edit immediately

**Prerequisites:** Story 8.8

**Technical Notes:**
- FR: NPD-FR-16
- API: POST /api/npd/formulations/:id/clone

---

## Story 8.17: Display Gate Checklists

As an **NPD Lead**,
I want to see gate checklists,
So that I know requirements.

**Acceptance Criteria:**

**Given** project in any stage
**When** viewing project detail
**Then** shows checklist for current gate:
- Checklist items (predefined per gate)
- Status (pending, completed, n/a)
- Responsible user
- Due date

**And** can mark items complete

**Prerequisites:** Story 8.2

**Technical Notes:**
- FR: NPD-FR-17
- gate_checklists table (template)
- project_checklist_items (instance)

---

## Story 8.18: Mark Checklist Items Complete

As an **NPD Lead**,
I want to mark checklist items complete,
So that progress is tracked.

**Acceptance Criteria:**

**Given** viewing gate checklist
**When** clicking checkbox
**Then** item status → completed
**And** completed_by, completed_at recorded

**When** all required items complete
**Then** gate criteria partially met

**Prerequisites:** Story 8.17

**Technical Notes:**
- FR: NPD-FR-18
- API: PUT /api/npd/projects/:id/checklist/:itemId

---

## Story 8.19: Support Gate Approvals

As a **Manager**,
I want to approve gates,
So that projects can advance.

**Acceptance Criteria:**

**Given** project ready for gate approval
**When** Manager views gate
**Then** sees "Approve" button

**When** approving
**Then** records:
- approved_by
- approved_at
- approval_notes

**And** gate approval criteria met

**Prerequisites:** Story 8.2

**Technical Notes:**
- FR: NPD-FR-19
- gate_approvals table

---

## Story 8.20: Block Advancement for Incomplete Items

As a **System**,
I want to block gate advancement,
So that all requirements are met.

**Acceptance Criteria:**

**Given** gate has incomplete required checklist items
**When** attempting to advance
**Then** system blocks with message:
"Complete all required checklist items before advancing"

**And** highlights incomplete items

**Prerequisites:** Story 8.17, Story 8.3

**Technical Notes:**
- FR: NPD-FR-20
- Validation logic

---

## Story 8.21: Log Approvals

As a **System**,
I want to log all approvals,
So that audit trail exists.

**Acceptance Criteria:**

**Given** approval is granted
**Then** creates audit log entry:
- project_id
- gate/entity approved
- approved_by
- timestamp
- approval_type (gate, formulation, costing)

**And** visible in project timeline

**Prerequisites:** Story 8.19

**Technical Notes:**
- FR: NPD-FR-21
- npd_approval_log table

---

## Story 8.22: Show Approval History

As an **NPD Manager**,
I want to see approval history,
So that I review decisions.

**Acceptance Criteria:**

**Given** viewing project
**When** navigating to Approvals tab
**Then** shows all approvals:
- Date
- Type (gate, formulation, costing)
- Approver
- Status (approved, rejected)
- Notes

**And** sorted by date DESC

**Prerequisites:** Story 8.21

**Technical Notes:**
- FR: NPD-FR-22
- API: GET /api/npd/projects/:id/approvals

---

## Story 8.23: Enter Target Cost

As an **NPD Lead**,
I want to enter target cost,
So that financial goals are set.

**Acceptance Criteria:**

**Given** project in Concept+ stage
**When** viewing Costing tab
**Then** can enter:
- target_cost_per_unit
- target_currency
- target_margin_percent

**And** saves automatically

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-23
- Costing fields in npd_projects table

---

## Story 8.24: Calculate Estimated Cost

As a **System**,
I want to calculate estimated cost from formulation,
So that R&D knows if on target.

**Acceptance Criteria:**

**Given** formulation with items
**Then** calculates estimated_cost:
- For each item: qty × unit_price
- Sum all items
- Divide by output_qty

**And** shows:
- Estimated cost per unit
- Variance from target: (estimated - target) / target × 100%

**Prerequisites:** Story 8.9, Story 8.23

**Technical Notes:**
- FR: NPD-FR-24
- Uses product unit_price from master data

---

## Story 8.25: Record Actual Cost from Pilot WO

As a **System**,
I want to capture actual cost from pilot,
So that real costs are known.

**Acceptance Criteria:**

**Given** pilot WO is completed
**When** calculating actual cost
**Then** sums:
- Actual material consumed (qty × price)
- Labor cost (if tracked)
- Overhead allocation

**And** updates:
- actual_cost_per_unit in NPD project
- Shows on costing tab

**Prerequisites:** Story 8.23, Epic 4 (WO)

**Technical Notes:**
- FR: NPD-FR-25
- Links to pilot_wo_id

---

## Story 8.26: Calculate Cost Variance

As a **System**,
I want to show cost variance,
So that gaps are visible.

**Acceptance Criteria:**

**Given** target and estimated/actual costs exist
**Then** calculates:
- Estimated variance: (estimated - target) / target × 100%
- Actual variance: (actual - target) / target × 100%

**And** color codes:
- 🟢 Green: within ±5%
- 🟡 Yellow: ±5-10%
- 🔴 Red: > ±10%

**Prerequisites:** Story 8.24, Story 8.25

**Technical Notes:**
- FR: NPD-FR-26
- Calculated fields in UI

---

## Story 8.27: Display Variance Alerts

As an **NPD Lead**,
I want variance alerts,
So that I'm notified of overruns.

**Acceptance Criteria:**

**Given** cost variance exceeds threshold
**Then** shows alert banner:
"Cost exceeds target by X%"

**And** optionally notifies:
- Project owner
- Finance role (if > 10%)

**Prerequisites:** Story 8.26

**Technical Notes:**
- FR: NPD-FR-27
- Alert threshold in settings

---

## Story 8.28: Show Cost History

As an **NPD Manager**,
I want to see cost evolution,
So that I track changes.

**Acceptance Criteria:**

**Given** viewing project Costing tab
**Then** shows timeline:
- Target set (date, value)
- Estimated cost per version
- Actual cost from pilot

**And** chart showing cost over time

**Prerequisites:** Story 8.23-8.25

**Technical Notes:**
- FR: NPD-FR-28
- costing_history table or timeline view

---

## Story 8.29: Finance Approve Costing

As a **Finance user**,
I want to approve project costing,
So that financial viability is confirmed.

**Acceptance Criteria:**

**Given** project in Validation+ stage
**When** Finance reviews costing
**Then** can Approve/Reject

**When** approving
**Then** records finance_approved_by, finance_approved_at

**And** gate criteria updated

**Prerequisites:** Story 8.23

**Technical Notes:**
- FR: NPD-FR-29
- finance_approval_status field

---

## Story 8.30: Display Allergen Declaration

As an **R&D user**,
I want to see allergen declaration,
So that labeling is accurate.

**Acceptance Criteria:**

**Given** formulation exists
**When** viewing Allergens tab
**Then** shows:
- Contains: list of allergens
- May Contain: list of allergens

**And** formatted for label copy-paste

**Prerequisites:** Story 8.10

**Technical Notes:**
- FR: NPD-FR-30
- Auto-generated from formulation items

---

## Story 8.31: Upload Compliance Documents

As a **Regulatory user**,
I want to upload compliance docs,
So that regulatory requirements are met.

**Acceptance Criteria:**

**Given** project in Feasibility+ stage
**When** viewing Compliance tab
**Then** can upload documents:
- USDA/FDA approval
- Nutritional analysis
- Safety data sheet
- Allergen statement
- Other

**And** each doc has:
- doc_type
- upload_date
- uploaded_by
- expiry_date (optional)

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-31
- npd_compliance_docs table
- Supabase storage
- API: POST /api/npd/projects/:id/compliance-docs

---

## Story 8.32: Categorize Documents by Type

As a **Regulatory user**,
I want to categorize documents,
So that they're organized.

**Acceptance Criteria:**

**Given** uploading document
**Then** must select doc_type:
- Regulatory Approval
- Nutritional Analysis
- Safety Data
- Allergen Statement
- Test Report
- Other

**And** docs grouped by type in UI

**Prerequisites:** Story 8.31

**Technical Notes:**
- FR: NPD-FR-32
- doc_type enum

---

## Story 8.33: Track Document Metadata

As a **Regulatory user**,
I want to track document metadata,
So that I know status.

**Acceptance Criteria:**

**Given** document is uploaded
**Then** records:
- file_name
- file_size
- uploaded_by
- uploaded_at
- expiry_date (for approvals)
- verification_status (pending, verified)
- notes

**Prerequisites:** Story 8.31

**Technical Notes:**
- FR: NPD-FR-33
- Full metadata in table

---

## Story 8.34: Show Document History

As a **Regulatory user**,
I want to see document history,
So that I track versions.

**Acceptance Criteria:**

**Given** multiple versions of same doc type uploaded
**Then** shows timeline:
- Version (1, 2, 3...)
- Upload date
- Uploaded by
- Current/Superseded indicator

**And** can download any version

**Prerequisites:** Story 8.31

**Technical Notes:**
- FR: NPD-FR-34
- version field in table

---

## Story 8.35: Validate Doc Completeness for Handoff

As a **System**,
I want to validate document completeness,
So that handoff only occurs when ready.

**Acceptance Criteria:**

**Given** project ready for Launch Prep
**Then** validates required docs:
- Regulatory approval (if applicable)
- Nutritional analysis (required)
- Allergen statement (required)

**When** docs missing
**Then** blocks handoff with list

**Prerequisites:** Story 8.31, Story 8.3

**Technical Notes:**
- FR: NPD-FR-35
- Required docs configurable per category

---

## Story 8.36: Generate Compliance Checklist

As a **Regulatory user**,
I want compliance checklist,
So that I know requirements.

**Acceptance Criteria:**

**Given** project in Feasibility+ stage
**When** viewing Compliance tab
**Then** shows checklist:
- Regulatory approval obtained
- Nutritional analysis complete
- Allergen declaration verified
- Safety data available
- Labeling approved

**And** can mark complete

**Prerequisites:** Story 8.31

**Technical Notes:**
- FR: NPD-FR-36
- Checklist template per category

---

## Story 8.37: Initiate Handoff Wizard

As an **NPD Lead**,
I want to hand off to production,
So that NPD becomes live product.

**Acceptance Criteria:**

**Given** project in Launch Prep stage
**When** clicking "Handoff to Production"
**Then** wizard modal opens showing:
- Step 1: Validation
- Step 2: Product Selection
- Step 3: BOM Transfer
- Step 4: Pilot WO (optional)
- Step 5: Confirmation

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-37
- Multi-step wizard UI

---

## Story 8.38: Validate Handoff Eligibility

As a **System**,
I want to validate handoff readiness,
So that incomplete projects don't transfer.

**Acceptance Criteria:**

**Given** initiating handoff
**Then** validates:
- Project in Launch Prep or later
- Formulation approved
- Costing approved (if required)
- Required compliance docs uploaded
- All gates approved

**When** validation fails
**Then** shows blockers
**And** prevents proceeding

**Prerequisites:** Story 8.37, Story 8.3

**Technical Notes:**
- FR: NPD-FR-38
- Step 1 validation

---

## Story 8.39: Display Validation Checklist

As an **NPD Lead**,
I want to see validation checklist in wizard,
So that I know what's needed.

**Acceptance Criteria:**

**Given** viewing handoff Step 1
**Then** shows checklist:
- ✅/❌ Formulation approved
- ✅/❌ Costing approved
- ✅/❌ Compliance docs complete
- ✅/❌ All gates approved

**When** all ✅
**Then** "Next" button enabled

**Prerequisites:** Story 8.38

**Technical Notes:**
- FR: NPD-FR-39
- Visual checklist

---

## Story 8.40: Choose Create New or Update Existing Product

As an **NPD Lead**,
I want to choose product action,
So that I handle reformulations vs new products.

**Acceptance Criteria:**

**Given** handoff Step 2
**Then** shows radio options:
- Create New Product
- Update Existing Product

**When** Create New selected
**Then** can enter new product code, name

**When** Update Existing selected
**Then** can search and select existing product

**Prerequisites:** Story 8.37

**Technical Notes:**
- FR: NPD-FR-40
- Step 2 of wizard

---

## Story 8.41: Transfer Formulation to BOM

As a **System**,
I want to convert formulation to BOM,
So that production can use it.

**Acceptance Criteria:**

**Given** handoff Step 3
**When** transferring
**Then** creates BOM:
- product_id: from Step 2
- version: new BOM version
- output_qty, output_uom: from formulation
- status: Active
- effective_from: today or user-selected
- Items: copied from formulation_items

**And** links:
- bom.npd_project_id
- bom.formulation_id

**Prerequisites:** Story 8.40, Epic 2 (BOMs)

**Technical Notes:**
- FR: NPD-FR-41
- One-click BOM creation

---

## Story 8.42: Create Pilot WO Optionally

As an **NPD Lead**,
I want to create pilot WO,
So that I can run trial production.

**Acceptance Criteria:**

**Given** handoff Step 4
**Then** shows checkbox: "Create Pilot Work Order"

**When** checked
**Then** can enter:
- quantity (default: BOM output_qty × 1)
- scheduled_date (default: today + 7 days)
- line_id (optional)

**When** unchecked
**Then** skips WO creation

**Prerequisites:** Story 8.41, Epic 3 (WO)

**Technical Notes:**
- FR: NPD-FR-42
- WO type: 'pilot'

---

## Story 8.43: Display Handoff Summary

As an **NPD Lead**,
I want to see handoff summary,
So that I confirm before executing.

**Acceptance Criteria:**

**Given** handoff Step 5
**Then** shows summary:
- Product: Code, Name (new or updated)
- BOM: Version, Items count, Output qty
- Pilot WO: Number, Qty, Date (if created)
- Allergens: Full list
- Compliance: Docs transferred

**And** "Execute Handoff" button

**Prerequisites:** Story 8.41, Story 8.42

**Technical Notes:**
- FR: NPD-FR-43
- Read-only summary view

---

## Story 8.44: Execute Handoff Transactionally

As a **System**,
I want handoff to be atomic,
So that partial failures don't occur.

**Acceptance Criteria:**

**Given** clicking "Execute Handoff"
**Then** in single transaction:
1. Create/update Product
2. Create BOM with items
3. Create pilot WO (if selected)
4. Update NPD project: handoff_completed = true, status = 'launched'
5. Create audit log entry

**When** any step fails
**Then** rollback all
**And** show error

**When** success
**Then** show success message with links to created entities

**Prerequisites:** Story 8.43

**Technical Notes:**
- FR: NPD-FR-44
- Database transaction
- API: POST /api/npd/projects/:id/handoff

---

## Story 8.45: Log Handoff Event

As a **System**,
I want to log handoff,
So that audit trail exists.

**Acceptance Criteria:**

**Given** handoff executes
**Then** creates log entry:
- project_id
- handoff_date
- handoff_by (user)
- product_id (created/updated)
- bom_id
- wo_id (if pilot)
- summary (JSON of all actions)

**Prerequisites:** Story 8.44

**Technical Notes:**
- FR: NPD-FR-45
- npd_handoff_log table

---

## Story 8.46: Update Status to Launched

As a **System**,
I want to mark project as launched,
So that lifecycle is complete.

**Acceptance Criteria:**

**Given** handoff completes
**Then** updates:
- project.status → 'launched'
- project.current_stage → 'launched'
- project.launch_date → today

**And** project moves to "Launched" column in Kanban

**Prerequisites:** Story 8.44

**Technical Notes:**
- FR: NPD-FR-46
- Automatic status update

---

## Story 8.47: NPD-Only Mode Export

As an **NPD Lead in NPD-only mode**,
I want to export formulation,
So that I can share with external systems.

**Acceptance Criteria:**

**Given** organization uses NPD-only mode (no production handoff)
**When** viewing formulation
**Then** can export to:
- PDF: Formatted recipe document
- Excel: Formulation table with items, allergens, cost

**And** includes:
- Project details
- Formulation items
- Allergens
- Costing summary

**Prerequisites:** Story 8.8

**Technical Notes:**
- FR: NPD-FR-47
- For orgs that don't integrate NPD → Production

---

## Story 8.48: Add Risks with Likelihood/Impact

As an **NPD Lead**,
I want to track project risks,
So that mitigation is planned.

**Acceptance Criteria:**

**Given** viewing project Risks tab
**When** clicking "Add Risk"
**Then** modal opens with:
- risk_description (required)
- likelihood (Low, Medium, High)
- impact (Low, Medium, High)
- mitigation_plan (text)
- owner (user)
- status (Open, Mitigated, Accepted)

**When** saving
**Then** risk added to project

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-48
- npd_risks table

---

## Story 8.49: Calculate Risk Score

As a **System**,
I want to calculate risk score,
So that priority is clear.

**Acceptance Criteria:**

**Given** risk has likelihood and impact
**Then** calculates score:
- Low/Low = 1 (🟢 Green)
- Low/Med or Med/Low = 2-3 (🟡 Yellow)
- Med/Med or High/Low = 4-6 (🟠 Orange)
- High/Med or Med/High = 7-8 (🔴 Red)
- High/High = 9 (🔴 Critical)

**And** color codes risk list by score

**Prerequisites:** Story 8.48

**Technical Notes:**
- FR: NPD-FR-49
- Score = likelihood_value × impact_value

---

## Story 8.50: Enter Mitigation Plan

As an **NPD Lead**,
I want to document mitigation,
So that risks are managed.

**Acceptance Criteria:**

**Given** risk exists
**When** editing risk
**Then** can enter:
- mitigation_plan (rich text)
- mitigation_actions (checklist)
- target_date
- responsible_user

**And** track mitigation progress

**Prerequisites:** Story 8.48

**Technical Notes:**
- FR: NPD-FR-50
- mitigation fields in table

---

## Story 8.51: Update Risk Status

As an **NPD Lead**,
I want to update risk status,
So that resolution is tracked.

**Acceptance Criteria:**

**Given** risk exists
**Then** can change status:
- Open → Mitigated (action taken)
- Open → Accepted (acknowledged, no action)

**When** status changes
**Then** records:
- status_changed_by
- status_changed_at
- notes

**Prerequisites:** Story 8.48

**Technical Notes:**
- FR: NPD-FR-51
- Status history in audit

---

## Story 8.52: Sort Risks by Score

As an **NPD Lead**,
I want risks sorted by score,
So that I prioritize.

**Acceptance Criteria:**

**Given** viewing risks list
**Then** sorted by score DESC (critical first)

**And** can toggle to sort by:
- Date created
- Status
- Owner

**Prerequisites:** Story 8.49

**Technical Notes:**
- FR: NPD-FR-52
- Default sort: score DESC

---

## Story 8.53: Log Critical Events

As a **System**,
I want to log critical NPD events,
So that timeline is captured.

**Acceptance Criteria:**

**Given** critical event occurs
**Then** creates event log:
- Event type (stage_change, approval, handoff, formulation_update)
- Timestamp
- User
- Details (JSONB)

**And** visible in project timeline

**Prerequisites:** Story 8.1

**Technical Notes:**
- FR: NPD-FR-53
- npd_event_log table

---

## Story 8.54: Retry Failed Events

As an **Admin**,
I want to retry failed events,
So that transient errors are handled.

**Acceptance Criteria:**

**Given** event failed (e.g., notification send)
**Then** marked as status = 'failed'

**When** Admin clicks "Retry"
**Then** attempts event again
**And** updates status

**Prerequisites:** Story 8.53

**Technical Notes:**
- FR: NPD-FR-54
- Event queue with retry logic

---

## Story 8.55: View Event Log

As an **Admin**,
I want to view event log,
So that I troubleshoot.

**Acceptance Criteria:**

**Given** navigating to /npd/admin/events
**Then** shows event log:
- Date, Event Type, Project, User, Status, Error (if failed)

**And** can filter by:
- Status (success, failed, pending)
- Event type
- Date range

**Prerequisites:** Story 8.53

**Technical Notes:**
- FR: NPD-FR-55
- Admin-only view

---

## Story 8.56: Replay Failed Events

As an **Admin**,
I want to replay events,
So that data is synced.

**Acceptance Criteria:**

**Given** failed event exists
**When** Admin clicks "Replay"
**Then** re-executes event logic
**And** updates status

**And** can bulk replay multiple events

**Prerequisites:** Story 8.54

**Technical Notes:**
- FR: NPD-FR-56
- Idempotent event handlers

---

## Story 8.57: Support Pilot WO Type

As a **System**,
I want to distinguish pilot WOs,
So that they're tracked separately.

**Acceptance Criteria:**

**Given** WO is created from NPD handoff
**Then** wo_type = 'pilot'

**And** pilot WOs:
- Excluded from regular production metrics
- Visible in NPD project
- Costs tracked separately

**Prerequisites:** Epic 3 (WO), Story 8.42

**Technical Notes:**
- FR: NPD-FR-57
- wo_type field

---

## Story 8.58: Track NPD Origin on Products

As a **System**,
I want to track NPD origin on products,
So that lineage is clear.

**Acceptance Criteria:**

**Given** product created from NPD
**Then** records:
- products.npd_project_id
- products.source = 'npd'

**And** visible in product detail

**Prerequisites:** Story 8.44, Epic 2

**Technical Notes:**
- FR: NPD-FR-58
- Traceability link

---

## Story 8.59: Track Formulation Origin on BOM

As a **System**,
I want to track formulation origin on BOM,
So that source is known.

**Acceptance Criteria:**

**Given** BOM created from formulation
**Then** records:
- boms.npd_formulation_id
- boms.source = 'npd'

**And** visible in BOM detail

**Prerequisites:** Story 8.41, Epic 2

**Technical Notes:**
- FR: NPD-FR-59
- Traceability link

---

## Story 8.60: Support Trial Outputs

As a **System**,
I want to track trial outputs,
So that test batches are recorded.

**Acceptance Criteria:**

**Given** pilot WO outputs
**Then** LPs created with:
- lp_type = 'trial'
- source_wo_id (pilot WO)

**And** trial LPs:
- Not counted in regular inventory reports
- Visible in NPD project
- Can be destroyed/consumed for testing

**Prerequisites:** Story 8.57, Epic 5

**Technical Notes:**
- FR: NPD-FR-60
- lp_type field

---

## Story 8.61: Reuse Allergens Table

As a **System**,
I want NPD to use shared allergens,
So that data is consistent.

**Acceptance Criteria:**

**Given** NPD formulation uses allergens
**Then** references same allergens table as Products

**And** 14 EU allergens + custom available

**Prerequisites:** Story 8.10, Epic 1

**Technical Notes:**
- FR: NPD-FR-61
- Shared allergens table

---

## Story 8.62: Reuse Approvals Table

As a **System**,
I want to reuse approvals infrastructure,
So that approval logic is centralized.

**Acceptance Criteria:**

**Given** NPD uses approvals (gates, formulations, costing)
**Then** uses shared approvals table

**And** approval workflow consistent across modules

**Prerequisites:** Story 8.19, Epic 1

**Technical Notes:**
- FR: NPD-FR-62
- Shared approvals architecture

---

## Story 8.63: NPD Lead Role Permissions

As an **NPD Lead**,
I want full NPD permissions,
So that I can manage projects.

**Acceptance Criteria:**

**Given** user has NPD Lead role
**Then** can:
- Create/edit/delete projects
- Create/edit/approve formulations
- Upload compliance docs
- Initiate handoff
- Manage all project aspects

**Prerequisites:** Epic 1 (RBAC)

**Technical Notes:**
- FR: NPD-FR-63
- Role: npd_lead

---

## Story 8.64: R&D Role Permissions

As an **R&D user**,
I want formulation permissions,
So that I can work on assigned projects.

**Acceptance Criteria:**

**Given** user has R&D role
**Then** can:
- View assigned projects
- Create/edit formulations (assigned projects only)
- Add/remove formulation items
- View costing (read-only)

**Can NOT:**
- Approve formulations
- Handoff to production
- Manage project lifecycle

**Prerequisites:** Epic 1 (RBAC)

**Technical Notes:**
- FR: NPD-FR-64
- Role: r_and_d

---

## Story 8.65: Regulatory Role Permissions

As a **Regulatory user**,
I want compliance permissions,
So that I manage regulatory docs.

**Acceptance Criteria:**

**Given** user has Regulatory role
**Then** can:
- Upload/manage compliance docs
- Mark compliance checklist complete
- View all projects (read-only except compliance)

**Prerequisites:** Epic 1 (RBAC)

**Technical Notes:**
- FR: NPD-FR-65
- Role: regulatory

---

## Story 8.66: Finance Role Permissions

As a **Finance user**,
I want costing permissions,
So that I approve financials.

**Acceptance Criteria:**

**Given** user has Finance role
**Then** can:
- View all projects (read-only)
- Approve/reject costing
- View detailed cost breakdown

**Prerequisites:** Epic 1 (RBAC)

**Technical Notes:**
- FR: NPD-FR-66
- Role: finance

---

## Story 8.67: Production Role Visibility

As a **Production user**,
I want to see handed-off projects,
So that I prepare for launch.

**Acceptance Criteria:**

**Given** user has Production role
**When** navigating to /npd/handed-off
**Then** sees projects with handoff_completed = true

**And** can view:
- Product
- BOM
- Pilot WO (if exists)

**Can NOT edit NPD data**

**Prerequisites:** Story 8.44, Epic 1

**Technical Notes:**
- FR: NPD-FR-67
- Read-only access to launched projects

---

## Story 8.68: RLS on NPD Tables

As a **System**,
I want Row-Level Security on NPD,
So that multi-tenant isolation is enforced.

**Acceptance Criteria:**

**Given** all NPD tables have org_id
**Then** RLS policies enforce:
- Users only see own org's projects
- No cross-tenant access

**And** tested with multiple orgs

**Prerequisites:** Epic 1 (RLS infrastructure)

**Technical Notes:**
- FR: NPD-FR-68
- RLS policies on all NPD tables

---

## FR Coverage

Total: 74 FRs mapped to 68 stories (some stories cover multiple FRs)

| FR Range | Coverage | Stories |
|----------|----------|---------|
| NPD-FR-01 to 07 | Project CRUD, Kanban, Timeline | 8.1-8.7 |
| NPD-FR-08 to 16 | Formulation Management | 8.8-8.16 |
| NPD-FR-17 to 22 | Gate Checklists & Approvals | 8.17-8.22 |
| NPD-FR-23 to 29 | Costing | 8.23-8.29 |
| NPD-FR-30 | Allergen Declaration | 8.30 |
| NPD-FR-31 to 36 | Compliance Docs | 8.31-8.36 |
| NPD-FR-37 to 47 | Handoff Wizard | 8.37-8.47 |
| NPD-FR-48 to 52 | Risk Management | 8.48-8.52 |
| NPD-FR-53 to 56 | Event Logging | 8.53-8.56 |
| NPD-FR-57 to 62 | Integration & Reuse | 8.57-8.62 |
| NPD-FR-63 to 74 | RBAC & Security | 8.63-8.68 |

**Coverage:** 74 of 74 FRs (100%)
