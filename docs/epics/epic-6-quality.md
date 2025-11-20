# Epic 6: Quality Control & Compliance

**Goal:** Enable comprehensive quality management - LP QA status, quality holds, specifications, test results, NCRs, CoAs, and quality reporting.

**Dependencies:** Epic 1 (Settings), Epic 5 (Warehouse - LP)
**Required by:** None (enhancement to existing flows)

**FRs Covered:** 26 (QC-FR-01 to QC-FR-26)
**Stories:** 28
**Priority:** Should Have (Growth/Phase 2)
**Effort Estimate:** 3-4 weeks

**UX Design Reference:** [ux-design-quality-module.md](../ux-design-quality-module.md)

---

## Story 6.1: LP QA Status Management

As a **QC user**,
I want to assign and track QA status on every LP,
So that quality state is clear.

**Acceptance Criteria:**

**Given** LP exists
**Then** has qa_status:
- pending: Awaiting inspection
- passed: QA approved
- failed: QA rejected
- quarantine: Under investigation

**When** QC user changes status
**Then** status updated
**And** timestamp and user recorded
**And** audit trail entry created

**Prerequisites:** Epic 5 (LP)

**Technical Notes:**
- FR: QC-FR-01, QC-FR-02
- API: PUT /api/warehouse/license-plates/:id/qa-status

---

## Story 6.2: QA Status Transition Rules

As a **System**,
I want to enforce QA status transitions,
So that invalid changes are prevented.

**Acceptance Criteria:**

**Given** LP has qa_status
**Then** only these transitions allowed:
- pending → passed, failed, quarantine
- quarantine → passed, failed
- failed → quarantine (only)
- passed → (no changes except via Manager override)

**When** invalid transition attempted
**Then** system blocks with error message

**Prerequisites:** Story 6.1

**Technical Notes:**
- FR: QC-FR-02
- State machine validation

---

## Story 6.3: Prevent Shipping Non-Passed LPs

As a **System**,
I want to block shipping of non-passed LPs,
So that only approved inventory ships.

**Acceptance Criteria:**

**Given** LP has qa_status != 'passed'
**When** attempting to ship (via SO, TO)
**Then** system blocks operation
**And** shows error: "LP must have QA status: passed"

**When** picking for order
**Then** only passed LPs shown in picker

**Prerequisites:** Story 6.1, Epic 7 (Shipping)

**Technical Notes:**
- FR: QC-FR-03
- Validation in shipping workflow

---

## Story 6.4: Control Consumption of Pending LPs

As an **Admin**,
I want to configure if pending LPs can be consumed,
So that production can start before QA.

**Acceptance Criteria:**

**Given** Admin configures quality_settings.allow_consume_pending
**When** toggle = ON
**Then** production can consume pending LPs (with warning)

**When** toggle = OFF
**Then** only passed LPs can be consumed

**And** default = OFF (strict mode)

**Prerequisites:** Story 6.1, Epic 4

**Technical Notes:**
- FR: QC-FR-04
- Toggle in quality_settings table

---

## Story 6.5: QA Change Audit Trail

As a **QC Manager**,
I want to see audit trail of all QA changes,
So that I can track who approved/rejected.

**Acceptance Criteria:**

**Given** the user navigates to /quality/audit
**Then** they see table with:
- LP number
- Old status → New status
- User
- Timestamp
- Reason/Notes

**And** can filter by LP, user, date range, status

**Prerequisites:** Story 6.1

**Technical Notes:**
- FR: QC-FR-05
- qa_status_changes table
- API: GET /api/quality/audit

---

## Story 6.6: Quality Hold Creation

As a **QC user**,
I want to create quality holds on LPs,
So that problematic inventory is flagged.

**Acceptance Criteria:**

**Given** QC user identifies issue
**When** clicking "Create Hold" on LP
**Then** modal opens with:
- hold_reason (required, dropdown + custom)
- description (required, text)
- severity (Low, Medium, High, Critical)
- notify_users (optional, multi-select)

**When** saving
**Then** quality_hold created
**And** LP.qa_status → quarantine
**And** LP blocked from use

**Prerequisites:** Story 6.1

**Technical Notes:**
- FR: QC-FR-06, QC-FR-07
- quality_holds table
- API: POST /api/quality/holds

---

## Story 6.7: Quality Hold Notifications

As a **QC Manager**,
I want to be notified when holds are created,
So that I can respond quickly.

**Acceptance Criteria:**

**Given** notifications enabled in Settings
**When** quality hold created
**Then** email/in-app notification sent to:
- QC Manager role
- Users selected in notify_users

**And** notification includes:
- LP number
- Product
- Reason
- Severity
- Link to hold detail

**Prerequisites:** Story 6.6

**Technical Notes:**
- FR: QC-FR-08
- Toggle in quality_settings.enable_hold_notifications

---

## Story 6.8: Quality Hold Release Approval

As an **Admin**,
I want to require approval for releasing holds,
So that only authorized users can unblock.

**Acceptance Criteria:**

**Given** approval enabled in Settings
**When** QC user attempts to release hold
**Then** requires Manager/Admin approval

**When** Manager approves release
**Then** hold status → released
**And** LP.qa_status → passed (or pending for re-test)
**And** approval recorded

**Prerequisites:** Story 6.6

**Technical Notes:**
- FR: QC-FR-09
- Toggle in quality_settings.require_hold_release_approval

---

## Story 6.9: Hold Investigation Tracking

As a **QC user**,
I want to track investigation and resolution,
So that we document the fix.

**Acceptance Criteria:**

**Given** quality hold exists
**When** viewing hold detail
**Then** can add investigation notes:
- root_cause (text)
- corrective_action (text)
- preventive_action (text)
- investigation_by (user)
- attachments (files)

**And** timeline shows all updates

**Prerequisites:** Story 6.6

**Technical Notes:**
- FR: QC-FR-10
- hold_investigation_notes table

---

## Story 6.10: Product Specification Management

As a **QC user**,
I want to define specifications per product,
So that test limits are clear.

**Acceptance Criteria:**

**Given** viewing product detail
**When** navigating to Specifications tab
**Then** can add specs with:
- test_name (required, e.g., "pH", "Moisture %")
- spec_type (numeric, text, boolean)
- min_value, max_value (for numeric)
- expected_value (for text/boolean)
- is_required (toggle)
- test_method (optional text)

**When** saving spec
**Then** linked to product
**And** shown in spec list

**Prerequisites:** Epic 2 (Products)

**Technical Notes:**
- FR: QC-FR-11, QC-FR-12
- product_specifications table
- API: POST/PUT /api/quality/specifications

---

## Story 6.11: Auto-Calculate Pass/Fail for Numeric Tests

As a **System**,
I want to auto-determine pass/fail for numeric tests,
So that manual judgment is minimized.

**Acceptance Criteria:**

**Given** test result entered for numeric spec
**When** result is within min/max range
**Then** test_status = 'passed'

**When** result outside range
**Then** test_status = 'failed'

**And** variance calculated: (result - expected) / expected × 100

**Prerequisites:** Story 6.10

**Technical Notes:**
- FR: QC-FR-13
- Calculation: min <= result <= max

---

## Story 6.12: Record Test Results Against LPs

As a **QC user**,
I want to record test results against LPs,
So that quality data is tracked.

**Acceptance Criteria:**

**Given** LP exists
**When** navigating to /quality/test-results
**Then** can select LP and product

**When** product has specs
**Then** shows spec list with input fields

**When** entering results
**Then** for each spec:
- Enter result_value
- Pass/fail auto-calculated (numeric)
- Can override (with reason)
- Add notes

**When** saving
**Then** test results created
**And** linked to LP

**Prerequisites:** Story 6.10

**Technical Notes:**
- FR: QC-FR-14
- test_results table
- API: POST /api/quality/test-results

---

## Story 6.13: Test History Per LP

As a **QC user**,
I want to see test history for an LP,
So that I can review all tests.

**Acceptance Criteria:**

**Given** viewing LP detail
**When** clicking "Test History" tab
**Then** shows all test results:
- Test date
- Specification
- Result value
- Pass/Fail
- Tested by
- Notes

**And** can filter by test name, status, date

**Prerequisites:** Story 6.12

**Technical Notes:**
- FR: QC-FR-15
- API: GET /api/quality/test-results?lp_id=X

---

## Story 6.14: Compare Results to Specifications

As a **QC user**,
I want to compare results to specs,
So that I can see deviations.

**Acceptance Criteria:**

**Given** viewing test results
**Then** shows side-by-side:
- Specification (min/max or expected)
- Actual result
- Variance (% or absolute)
- Pass/Fail indicator

**And** variance color-coded:
- 🟢 Green: within spec
- 🟡 Yellow: near limits (< 10% margin)
- 🔴 Red: out of spec

**Prerequisites:** Story 6.12, Story 6.10

**Technical Notes:**
- FR: QC-FR-16
- Visual comparison in UI

---

## Story 6.15: NCR Creation

As a **QC user**,
I want to create Non-Conformance Reports,
So that quality issues are documented.

**Acceptance Criteria:**

**Given** quality issue identified
**When** creating NCR
**Then** modal opens with:
- ncr_number (auto-generated)
- issue_type (dropdown: Material, Process, Product, Other)
- description (required text)
- severity (Low, Medium, High, Critical)
- source_lp_id (optional)
- source_wo_id (optional)
- source_po_id (optional)
- detected_by (user, auto-filled)

**When** saving
**Then** NCR created with status = 'open'

**Prerequisites:** Epic 1

**Technical Notes:**
- FR: QC-FR-17
- non_conformance_reports table
- API: POST /api/quality/ncrs

---

## Story 6.16: NCR Lifecycle Tracking

As a **QC Manager**,
I want to track NCR through lifecycle,
So that resolution is monitored.

**Acceptance Criteria:**

**Given** NCR exists
**Then** has status:
- open: newly created
- investigating: under review
- corrective_action: fix in progress
- closed: resolved

**When** status changes
**Then** timestamp recorded
**And** can add notes per status

**Prerequisites:** Story 6.15

**Technical Notes:**
- FR: QC-FR-18
- Status workflow in ncrs table

---

## Story 6.17: Link NCRs to Source Documents

As a **QC user**,
I want to link NCRs to LPs/WOs/POs,
So that root cause is traceable.

**Acceptance Criteria:**

**Given** creating/editing NCR
**Then** can link to:
- License Plate (material defect)
- Work Order (process defect)
- Purchase Order (supplier issue)

**And** multiple links allowed

**When** viewing linked document
**Then** shows related NCRs

**Prerequisites:** Story 6.15

**Technical Notes:**
- FR: QC-FR-19
- Polymorphic associations: ncr_links table

---

## Story 6.18: Root Cause and Corrective Actions

As a **QC user**,
I want to document root cause and actions,
So that we learn from issues.

**Acceptance Criteria:**

**Given** NCR is investigating+
**When** editing NCR
**Then** can add:
- root_cause_analysis (text)
- corrective_actions (text)
- preventive_actions (text)
- responsible_person (user)
- target_date (date)
- actual_completion_date (date)

**And** timeline shows all updates

**Prerequisites:** Story 6.15

**Technical Notes:**
- FR: QC-FR-20
- Fields in NCR table

---

## Story 6.19: Certificate of Analysis (CoA) Upload

As a **QC user**,
I want to upload and store CoAs,
So that supplier certificates are tracked.

**Acceptance Criteria:**

**Given** receiving material with CoA
**When** processing GRN
**Then** can upload CoA file (PDF, image)

**And** CoA linked to:
- GRN
- Supplier
- Product
- Batch number

**When** viewing LP
**Then** can download linked CoA

**Prerequisites:** Epic 5 (GRN)

**Technical Notes:**
- FR: QC-FR-21
- certificates_of_analysis table
- Supabase storage for files
- API: POST /api/quality/coas

---

## Story 6.20: Require CoA on Receipt

As an **Admin**,
I want to require CoA for certain products,
So that compliance is enforced.

**Acceptance Criteria:**

**Given** Admin configures product.require_coa = true
**When** receiving that product
**Then** GRN cannot complete without CoA upload

**And** warning shown if missing

**Prerequisites:** Story 6.19

**Technical Notes:**
- FR: QC-FR-22
- Toggle per product: require_coa

---

## Story 6.21: CoA Verification Tracking

As a **QC user**,
I want to track CoA verification status,
So that review is documented.

**Acceptance Criteria:**

**Given** CoA is uploaded
**Then** has verification_status:
- pending_review
- verified
- rejected

**When** QC reviews CoA
**Then** can mark as verified/rejected
**And** add verification notes
**And** record verifier and timestamp

**Prerequisites:** Story 6.19

**Technical Notes:**
- FR: QC-FR-23
- verification fields in coas table

---

## Story 6.22: Quality Dashboard

As a **QC Manager**,
I want to see quality KPIs,
So that I can monitor performance.

**Acceptance Criteria:**

**Given** the user navigates to /quality/dashboard
**Then** they see KPI cards:
- Open Quality Holds: count
- Open NCRs by Severity
- Avg Time to Resolve Holds
- Failed Test Rate: % failed / total tests
- Pending CoAs: count

**And** charts:
- NCR trend (by month)
- Top defect types
- Supplier defect rate

**And** auto-refresh (configurable)

**Prerequisites:** Stories 6.6, 6.15, 6.19

**Technical Notes:**
- FR: QC-FR-24
- API: GET /api/quality/dashboard

---

## Story 6.23: Quality Reports Generation

As a **QC Manager**,
I want to generate quality reports,
So that I can share with stakeholders.

**Acceptance Criteria:**

**Given** the user navigates to /quality/reports
**Then** can select report type:
- NCR Summary (by date range, severity, type)
- Test Results Summary (by product, date)
- Quality Hold Report
- CoA Compliance Report
- Supplier Quality Performance

**When** generating report
**Then** shows preview
**And** can export to PDF or Excel

**Prerequisites:** All Epic 6 stories

**Technical Notes:**
- FR: QC-FR-25
- API: POST /api/quality/reports/generate

---

## Story 6.24: Export Reports to PDF/Excel

As a **QC Manager**,
I want to export reports in multiple formats,
So that I can share easily.

**Acceptance Criteria:**

**Given** report is generated
**When** clicking Export
**Then** can choose:
- PDF (formatted, ready to print)
- Excel (raw data for analysis)

**And** file downloads immediately

**Prerequisites:** Story 6.23

**Technical Notes:**
- FR: QC-FR-26
- Use libraries: jspdf, xlsx

---

## Story 6.25: Quality Settings Configuration

As an **Admin**,
I want to configure Quality module settings,
So that behavior matches our process.

**Acceptance Criteria:**

**Given** Admin navigates to /settings/quality
**Then** can configure:
- allow_consume_pending (toggle)
- enable_hold_notifications (toggle)
- require_hold_release_approval (toggle)
- default_qa_status (dropdown)
- auto_fail_on_out_of_spec (toggle)

**Prerequisites:** Epic 1

**Technical Notes:**
- quality_settings table
- API: GET/PUT /api/quality/settings

---

## Story 6.26: Quality Hold Workflow

As a **QC user**,
I want a streamlined hold workflow,
So that I can manage holds efficiently.

**Acceptance Criteria:**

**Given** the user navigates to /quality/holds
**Then** sees hold list with:
- Hold number
- LP number
- Product
- Severity
- Status
- Created date

**And** can filter by status, severity, product, date

**When** clicking hold
**Then** shows detail with:
- All fields
- Investigation notes
- Timeline
- Actions: Investigate, Release, Escalate

**Prerequisites:** Story 6.6

**Technical Notes:**
- Streamlined UX for hold management

---

## Story 6.27: NCR Workflow

As a **QC Manager**,
I want a streamlined NCR workflow,
So that issues are resolved systematically.

**Acceptance Criteria:**

**Given** the user navigates to /quality/ncrs
**Then** sees NCR list with:
- NCR number
- Type
- Severity
- Status
- Assigned to
- Target date

**And** can filter by status, severity, type, user

**When** viewing NCR
**Then** shows detail with tabs:
- Details
- Root Cause Analysis
- Actions
- Timeline
- Linked Documents

**Prerequisites:** Story 6.15

**Technical Notes:**
- Workflow optimized for CAPA process

---

## Story 6.28: Quality Test Templates

As a **QC user**,
I want to create test templates,
So that common tests are reusable.

**Acceptance Criteria:**

**Given** Admin creates test template
**Then** template includes:
- Template name
- List of specifications (from master list)
- Default values

**When** testing LP
**Then** can apply template
**And** all specs pre-filled

**Prerequisites:** Story 6.10

**Technical Notes:**
- test_templates table
- Speeds up test data entry

---

## FR Coverage

| FR ID | Requirement | Stories |
|-------|-------------|---------|
| QC-FR-01 | LP QA Status Tracking | 6.1 |
| QC-FR-02 | Status Transition Enforcement | 6.2 |
| QC-FR-03 | Prevent Shipping Non-Passed LPs | 6.3 |
| QC-FR-04 | Control Consumption of Pending | 6.4 |
| QC-FR-05 | QA Change Audit Trail | 6.5 |
| QC-FR-06 | Create Quality Holds | 6.6 |
| QC-FR-07 | Move to Quarantine | 6.6 |
| QC-FR-08 | Hold Notifications | 6.7 |
| QC-FR-09 | Hold Release Approval | 6.8 |
| QC-FR-10 | Hold Investigation Tracking | 6.9 |
| QC-FR-11 | Define Product Specifications | 6.10 |
| QC-FR-12 | Support Multiple Spec Types | 6.10 |
| QC-FR-13 | Auto-Calculate Pass/Fail | 6.11 |
| QC-FR-14 | Record Test Results | 6.12 |
| QC-FR-15 | Test History Per LP | 6.13 |
| QC-FR-16 | Compare Results to Specs | 6.14 |
| QC-FR-17 | Create NCRs | 6.15 |
| QC-FR-18 | NCR Lifecycle Tracking | 6.16 |
| QC-FR-19 | Link NCRs to Documents | 6.17 |
| QC-FR-20 | Root Cause & Corrective Actions | 6.18 |
| QC-FR-21 | Upload and Store CoAs | 6.19 |
| QC-FR-22 | Require CoA on Receipt | 6.20 |
| QC-FR-23 | CoA Verification Tracking | 6.21 |
| QC-FR-24 | Quality Dashboard | 6.22 |
| QC-FR-25 | Generate Quality Reports | 6.23 |
| QC-FR-26 | Export Reports to PDF/Excel | 6.24 |

**Coverage:** 26 of 26 FRs (100%)
