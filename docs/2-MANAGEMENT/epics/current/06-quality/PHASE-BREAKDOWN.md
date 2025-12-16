# Epic 06: Quality Module - 4-Phase Structure

**Date:** 2025-12-16
**Status:** PLANNING (Stories pending full creation)
**Total Stories:** 45 across 4 phases
**Total Effort:** 60-78 days (1 dev), 30-39 days (2 devs)

---

## Executive Summary

Epic 06 Quality Module is organized into 4 sequential phases, each building on the previous:

| Phase | Name | Stories | Effort | Focus | Status |
|-------|------|---------|--------|-------|--------|
| **1** | MVP | 11 | 14-18 days | Inspections, Holds, Specs | 📋 Stories pending |
| **2** | NCR Workflow | 12 | 16-20 days | NCR investigation, Batch release | 📋 Stories pending |
| **3** | HACCP/CCP | 12 | 16-20 days | HACCP plans, CCP monitoring | 📋 Stories pending |
| **4** | CAPA & Supplier | 10 | 14-18 days | CAPA tracking, Supplier quality | 📋 Stories pending |

**Total:** 45 stories, 60-78 days (sequential), 30-39 days (2 devs parallel)

---

## Phase 1: MVP - Inspections, Holds, Specifications (Week 9-12)

**Status:** Analysis complete, stories need full specs
**Effort:** 14-18 days (2 devs), 7-9 days (2 devs parallel)
**Start:** Week 9-10 (after Epic 05 Phase 0 stable)
**Prerequisites:** Epic 05.1, 05.4, Epic 02.1, Epic 04.1

### Phase 1 Stories (11 Total)

#### Foundation (3 stories)

**06.1: Quality Settings**
- Configure org-level quality rules
- Define inspection scopes (receiving, in-process, final)
- Set default sampling plans
- Define approval authorities
- **Days:** 1-2
- **Complexity:** S

**06.2: Product Specifications CRUD + Parameters**
- Create product spec templates
- Define test parameters (temp, pH, moisture, etc.)
- Set pass/fail criteria per parameter
- Link specs to products + versions
- **Days:** 3-4
- **Complexity:** M

**06.3: Quality Holds CRUD + LP Blocking**
- Create hold records for LPs
- Link holds to quality reasons (failed test, OOS, missing)
- Block LP from warehouse picking
- Release LP when resolved
- **Days:** 3-4
- **Complexity:** M

#### Inspection Workflows (4 stories)

**06.5a: Incoming Inspection (Core)**
- Create inspection batch from GRN
- Assign test parameters from product spec
- Desktop recording of test results
- Pass/fail decision workflow
- **Days:** 5-7
- **Complexity:** L
- **Note:** Advanced sampling deferred to 06.5b

**06.6: In-Process Inspection**
- Inspect during WO operation
- Record critical parameters (temp, time, agitation)
- Compare to operation spec limits
- Alert if out-of-spec
- **Days:** 4-5
- **Complexity:** M

**06.7: Final Inspection (Batch Release)**
- Pre-shipment inspection check
- Review all test results
- Final pass/fail decision
- Update LP status to "released"
- **Days:** 3-4
- **Complexity:** M

**06.8: Test Results Recording**
- Record individual test values
- Attach lab certificates
- Support manual + automated (scanner) entry
- Calculation of summary statistics
- **Days:** 2-3
- **Complexity:** S

#### Sampling & Release (3 stories)

**06.9: Sampling Plans CRUD + AQL**
- Define sampling plans (e.g., ANSI Z1.4)
- Set acceptable quality level (AQL %)
- Calculate sample size + acceptance number
- Apply plan to incoming inspection
- **Days:** 3-4
- **Complexity:** M

**06.10: Quality Hold + Release Workflow**
- Create hold from failed inspection
- Link hold to LP + reason
- Block LP from production/warehouse
- Release workflow: investigate → resolve → release
- **Days:** 2-3
- **Complexity:** S

**06.11: Quality Dashboard**
- Inspection count by type (incoming, in-process, final)
- Hold count by reason
- Pass rate trend
- Recent holds + resolutions
- **Days:** 2-3
- **Complexity:** S

#### Basic NCR (1 story - MVP only)

**06.4: Basic NCR Creation**
- Create NCR from hold
- Document non-conformance reason
- Notify supervisor + QA
- Defer workflow to Phase 2
- **Days:** 2-3
- **Complexity:** S

### Phase 1 Workflow - End-to-End

```
┌─────────────────────────────────────────────────┐
│            INCOMING INSPECTION FLOW              │
└─────────────────────────────────────────────────┘

GRN Created (Epic 05.11)
    ↓
06.5a: Create Inspection Batch
    ├─ Link to GRN LP
    ├─ Assign product spec (06.2)
    ├─ Select sampling plan (06.9)
    └─ Calculate sample size
    ↓
06.8: Record Test Results
    ├─ Enter each test value
    ├─ Compare to spec limits (06.2)
    └─ Flag if out-of-spec
    ↓
Decision Point:
    ├─ ALL PASS ✓
    │   └─→ Update LP qc_status = "pass"
    │   └─→ Available for production
    │
    └─ ANY FAIL ✗
        └─→ Create Hold (06.3, 06.10)
        └─→ Create NCR (06.4 basic)
        └─→ Update LP qc_status = "hold"
        └─→ Block LP from picking
        └─→ Notify QA team

┌─────────────────────────────────────────────────┐
│          IN-PROCESS INSPECTION FLOW              │
└─────────────────────────────────────────────────┘

WO Operation Started (Epic 04.3)
    ↓
06.6: Record In-Process Parameters
    ├─ Temperature, time, agitation
    └─ Compare to operation spec (06.2)
    ↓
Decision Point:
    ├─ WITHIN SPEC ✓ → Continue
    └─ OUT OF SPEC ✗
        ├─→ Alert supervisor
        └─→ Create Hold (06.3)

┌─────────────────────────────────────────────────┐
│           BATCH RELEASE FLOW                     │
└─────────────────────────────────────────────────┘

WO Operations Complete (Epic 04)
    ↓
06.7: Final Inspection
    ├─ Review all test results
    └─ Confirm no holds
    ↓
Decision Point:
    ├─ PASS ✓
    │   └─→ 06.10: Release Batch
    │   └─→ Update LP qc_status = "released"
    │   └─→ Available in warehouse for picking
    │
    └─ FAIL ✗
        └─→ Create Hold (06.3)
        └─→ Block batch from release
```

### Phase 1 Data Model (Key Tables)

```
quality_specifications
├─ id (PK)
├─ org_id (RLS)
├─ product_id (FK)
├─ product_version
├─ test_type (incoming/in-process/final)
└─ is_active

quality_parameters
├─ id (PK)
├─ spec_id (FK)
├─ parameter_name (temp, pH, moisture, etc.)
├─ min_value
├─ max_value
├─ test_method
└─ required

quality_inspections
├─ id (PK)
├─ org_id (RLS)
├─ lp_id (FK) → license_plates
├─ spec_id (FK) → quality_specifications
├─ inspection_type (incoming/in-process/final)
├─ sampled_qty
├─ accepted_qty
├─ rejected_qty
├─ status (pending/pass/fail/hold)
└─ created_at

quality_test_results
├─ id (PK)
├─ inspection_id (FK)
├─ parameter_id (FK) → quality_parameters
├─ recorded_value
├─ test_date
├─ passed (boolean)
└─ lab_reference

quality_holds
├─ id (PK)
├─ org_id (RLS)
├─ lp_id (FK) → license_plates
├─ reason (failed_test, oos, missing)
├─ status (active/resolved)
├─ created_by
├─ resolved_at
└─ resolution_note

sampling_plans
├─ id (PK)
├─ org_id (RLS)
├─ aql_level (0.65, 1.0, 1.5, 2.5, 4.0, 6.5)
├─ sample_size
├─ acceptance_number
├─ rejection_number
└─ is_active
```

### Phase 1 API Endpoints

```
POST   /api/quality/settings                 → Create/update org settings
GET    /api/quality/settings                 → Get current settings
POST   /api/quality/specifications           → Create product spec
GET    /api/quality/specifications/:id       → Get spec + parameters
POST   /api/quality/parameters               → Add test parameter
POST   /api/quality/holds                    → Create hold (blocks LP)
GET    /api/quality/holds?lp_id=X            → Get holds for LP
PUT    /api/quality/holds/:id/release        → Release hold
POST   /api/quality/inspections              → Create inspection batch
POST   /api/quality/inspections/:id/results  → Record test results
GET    /api/quality/inspections/:id          → Get inspection details
POST   /api/quality/samplings                → Get sampling plan
GET    /api/quality/dashboard                → Inspection metrics
```

### Phase 1 Success Criteria

- [ ] Product spec linked to 5+ products
- [ ] Incoming inspection created from GRN
- [ ] Test results recorded correctly
- [ ] Hold created + LP blocked from picking
- [ ] Hold released + LP unblocked
- [ ] Batch release updates LP status to "released"
- [ ] Dashboard shows 10+ inspections with 80%+ pass rate
- [ ] Traceability complete: GRN → Inspection → Hold/Pass → LP status
- [ ] All inspection records audit-trailed (created_by, created_at)

---

## Phase 2: NCR Workflow (Week 13-16)

**Status:** Analysis complete, stories need full specs
**Effort:** 16-20 days (2 devs), 8-10 days (2 devs parallel)
**Start:** Week 13 (after Phase 1 running 2+ weeks)
**Prerequisites:** Phase 1 complete, Epic 04 Phase 1, Epic 03 Phase 1

### Phase 2 Stories (12 Total)

#### NCR Core (2 stories)

**06.12: NCR CRUD + Severity**
- Create NCR from hold or manually
- Document non-conformance details
- Set severity (critical, major, minor)
- Link to product + batch
- **Days:** 2-3
- **Complexity:** S

**06.13a: NCR Investigation Workflow (Core)**
- Assign NCR to investigator
- Document findings (what happened)
- Determine root cause (5 Why analysis)
- Propose corrective action
- **Days:** 3-4
- **Complexity:** M

#### NCR Advanced (2 stories - split from 06.13)

**06.13b: NCR Workflow - Verification + Approval**
- QA review of findings
- Verify corrective action effectiveness
- Approve or request additional investigation
- Close NCR + archive
- **Days:** 2-3
- **Complexity:** M

**06.14: Root Cause Analysis Tools**
- 5 Why methodology template
- Fishbone diagram builder
- RCA decision tree
- Export analysis as PDF
- **Days:** 4-5
- **Complexity:** M

#### Disposition (3 stories)

**06.15: Batch Disposition CRUD**
- Define disposition options (scrap, rework, accept-as-is, return-to-supplier)
- Link disposition to NCR
- Generate disposal instructions
- Track batch movement
- **Days:** 2-3
- **Complexity:** M

**06.16: Rework + Accept-As-Is Logic**
- Rework: re-inspect with new batch number
- Accept-as-is: document customer notification
- Scrap: generate scrap documentation
- **Days:** 2-3
- **Complexity:** M

**06.17: Customer Notification**
- Generate customer notification letter
- Track notification date + method
- Document customer response
- Link to batch serial numbers
- **Days:** 2-3
- **Complexity:** S

#### Analysis & Reporting (3 stories)

**06.18: Regulatory Reporting**
- Export NCR data for regulatory submissions
- Format per FDA, EU requirements
- Include RCA + corrective actions
- Generate audit trail report
- **Days:** 3-4
- **Complexity:** M

**06.19: NCR Analytics & Trends**
- NCR count by severity + type
- Top root causes trend
- Corrective action effectiveness rate
- Pareto analysis of NCR reasons
- **Days:** 2-3
- **Complexity:** S

**06.20: NCR Dashboard**
- Open NCRs by age
- Pending approvals
- Recent investigations
- Metrics: count, severity, response time
- **Days:** 2-3
- **Complexity:** S

### Phase 2 Workflow

```
┌─────────────────────────────────────────────────┐
│              NCR INVESTIGATION FLOW              │
└─────────────────────────────────────────────────┘

Hold Created (Phase 1)
    ↓
06.12: Create NCR
    ├─ Link to LP / batch
    ├─ Set severity (critical/major/minor)
    └─ Document what failed
    ↓
06.13a: Investigate
    ├─ Assign to investigator
    ├─ Root Cause Analysis (06.14)
    │   ├─ 5 Why template
    │   ├─ Fishbone diagram
    │   └─ Determine root cause
    └─ Propose corrective action
    ↓
06.13b: Verify & Approve
    ├─ QA review findings
    ├─ Verify effectiveness
    └─ Approve corrective action
    ↓
06.15/06.16: Determine Disposition
    ├─ Scrap (06.15)
    ├─ Rework (06.16)
    ├─ Accept-as-is (06.16)
    └─ Return-to-supplier (06.15)
    ↓
06.17: Customer Notification
    ├─ IF customer affected
    ├─ Generate notification letter
    └─ Track customer response
    ↓
Close NCR
    └─→ Archive with full investigation record
```

### Phase 2 Key Tables

```
non_conformances (NCRs)
├─ id (PK)
├─ org_id (RLS)
├─ lp_id (FK, optional)
├─ product_id (FK)
├─ batch_number
├─ severity (critical/major/minor)
├─ description
├─ root_cause
├─ corrective_action
├─ status (open/in-review/closed)
├─ created_at
└─ closed_at

ncr_investigations
├─ id (PK)
├─ ncr_id (FK)
├─ investigator_id (FK)
├─ findings
├─ root_cause_analysis (JSON)
├─ proposed_action
├─ completed_at
└─ approved_at

batch_disposition
├─ id (PK)
├─ ncr_id (FK)
├─ disposition_type (scrap/rework/accept/return)
├─ disposition_date
├─ scrap_qty
└─ notes
```

### Phase 2 Success Criteria

- [ ] 10+ NCRs created from holds
- [ ] 8+ NCRs investigated with root cause
- [ ] 5+ NCRs closed with verification
- [ ] Batch disposition tracked (scrap/rework/accept)
- [ ] Customer notification sent for 3+ NCRs
- [ ] RCA tools used in 80%+ of NCRs
- [ ] NCR trends show declining root causes
- [ ] Average resolution time < 5 days
- [ ] All NCRs audit-trailed + archived

---

## Phase 3: HACCP/CCP Monitoring (Week 17-20)

**Status:** Analysis complete, stories need full specs
**Effort:** 16-20 days (2 devs), 8-10 days (2 devs parallel)
**Start:** Week 17 (after Phase 2 running 2+ weeks + HACCP guidelines documented)
**Prerequisites:** Phase 2 complete, Epic 04 Phase 1, Regulatory guidance

### Phase 3 Stories (12 Total)

#### HACCP Planning (2 stories - split from 06.21)

**06.21a: HACCP Plans CRUD**
- Create HACCP plan per product
- Define process steps
- Identify potential hazards
- Link to production routing (Epic 04 operations)
- **Days:** 3-4
- **Complexity:** M

**06.21b: HACCP CCPs + Critical Limits (Core)**
- Define CCPs (Critical Control Points)
- Set critical limits (min/max values)
- Define monitoring method + frequency
- Assign CCP owner
- **Days:** 3-4
- **Complexity:** M

#### CCP Monitoring (3 stories)

**06.22: CCP Monitoring (Desktop)**
- Record CCP measurements during production
- Compare to critical limits
- Alert if deviation
- Document corrective action taken
- **Days:** 3-4
- **Complexity:** M

**06.23: CCP Monitoring (Scanner)**
- Mobile/barcode-based CCP monitoring
- Scan WO → Scan parameter value
- Real-time deviation alerts
- Offline queue support
- **Days:** 3-4
- **Complexity:** M

**06.24: CCP Deviation Alerts**
- Alert when measurement exceeds critical limit
- Escalate to supervisor
- Halt production if critical
- Document deviation + reason
- **Days:** 2-3
- **Complexity:** S

#### Corrective Actions (2 stories)

**06.25: CCP Corrective Actions**
- Define corrective actions per CCP
- Execute when deviation detected
- Document action taken + result
- Re-check measurements
- **Days:** 2-3
- **Complexity:** M

**06.26: HACCP Verification**
- Review HACCP plan effectiveness
- Audit CCP monitoring records
- Verify corrective actions implemented
- Update plan based on findings
- **Days:** 2-3
- **Complexity:** M

#### Documentation & Reports (3 stories)

**06.27a: HACCP Documentation (Core)**
- Generate HACCP certification records
- Daily monitoring logs
- Deviation + corrective action records
- Archive for audit trail
- **Days:** 2-3
- **Complexity:** S

**06.27b: CoA Generation (Certificate of Analysis)**
- Create CoA from inspection + CCP data
- Format per customer requirements
- Include test results + deviations
- PDF export + email delivery
- **Days:** 2-3
- **Complexity:** M

**06.28: HACCP Dashboard**
- CCP monitoring trend
- Deviation frequency by parameter
- Corrective action effectiveness
- Compliance status per product
- **Days:** 2-3
- **Complexity:** S

#### Advanced Features (2 stories)

**06.29: CoA Customization**
- Custom CoA templates per customer
- Variable field mapping
- Multi-language support
- Digital signature support (Phase 4)
- **Days:** 2-3
- **Complexity:** M

**06.30: Trend Analysis**
- CCP measurement trends over time
- Statistical process control (SPC)
- Predict when limits will be exceeded
- Recommend proactive adjustments
- **Days:** 3-4
- **Complexity:** L

### Phase 3 Workflow

```
┌─────────────────────────────────────────────────┐
│          HACCP PLAN CREATION FLOW                │
└─────────────────────────────────────────────────┘

Product + Routing Defined (Epic 02, 04)
    ↓
06.21a: Create HACCP Plan
    ├─ Document process steps
    ├─ Identify hazards per step
    └─ Evaluate risk level
    ↓
06.21b: Define CCPs
    ├─ Select critical control points
    ├─ Set critical limits
    ├─ Define monitoring method
    └─ Assign CCP owner
    ↓
06.22/06.23: Set Up Monitoring
    ├─ Configure desktop (06.22)
    ├─ OR configure scanner (06.23)
    └─ Ready for production

┌─────────────────────────────────────────────────┐
│       CCP MONITORING DURING PRODUCTION           │
└─────────────────────────────────────────────────┘

WO Operation Started (Epic 04)
    ↓
06.22/06.23: Monitor CCP
    ├─ Record measurement (temp, pH, time)
    └─ Compare to critical limit
    ↓
Decision Point:
    ├─ WITHIN LIMIT ✓ → Log + Continue
    │
    └─ OUT OF LIMIT ✗
        ├─→ 06.24: Alert generated
        ├─→ 06.25: Execute corrective action
        │   ├─ Adjust parameter (temp up, time +5min)
        │   ├─ Re-monitor
        │   └─ Document action
        └─→ Escalate if critical

┌─────────────────────────────────────────────────┐
│        HACCP CERTIFICATION FLOW                  │
└─────────────────────────────────────────────────┘

Batch Complete (After Final Inspection)
    ↓
06.27a: Compile HACCP Documentation
    ├─ Daily monitoring log
    ├─ All CCP measurements
    ├─ Deviations + corrective actions
    └─ Signed by shift supervisor
    ↓
06.27b: Generate CoA
    ├─ Test results (Phase 1 inspection)
    ├─ CCP monitoring summary
    ├─ Customer format (06.29)
    └─ Ready for shipment
    ↓
Package with Shipment
    └─→ Customer receives CoA with batch
```

### Phase 3 Key Tables

```
haccp_plans
├─ id (PK)
├─ org_id (RLS)
├─ product_id (FK)
├─ routing_id (FK)
├─ hazard_analysis (JSON)
├─ version
└─ is_active

ccps (Critical Control Points)
├─ id (PK)
├─ plan_id (FK)
├─ process_step
├─ parameter_name
├─ critical_limit_min
├─ critical_limit_max
├─ monitoring_method
├─ monitoring_frequency
├─ owner_id (FK)
└─ corrective_action_plan (JSON)

ccp_monitoring
├─ id (PK)
├─ org_id (RLS)
├─ ccp_id (FK)
├─ wo_id (FK) → work_orders
├─ operation_id (FK)
├─ measured_value
├─ recorded_at
├─ is_deviation (boolean)
└─ corrective_action_taken

ccp_corrective_actions
├─ id (PK)
├─ monitoring_id (FK)
├─ action_taken
├─ result
├─ completed_at
└─ verified_by

certificates_of_analysis
├─ id (PK)
├─ org_id (RLS)
├─ lp_id (FK)
├─ product_id (FK)
├─ test_results (JSON)
├─ ccp_monitoring_summary (JSON)
├─ generated_at
└─ pdf_path
```

### Phase 3 Success Criteria

- [ ] 5+ HACCP plans created per major product
- [ ] 20+ CCPs defined across products
- [ ] 100+ CCP measurements recorded
- [ ] 5+ deviations detected + corrective actions taken
- [ ] CoA generated for 50+ batches
- [ ] HACCP plan verified quarterly
- [ ] Corrective action effectiveness > 95%
- [ ] Zero regulatory non-conformances related to HACCP
- [ ] All CCP documentation audit-trailed

---

## Phase 4: CAPA & Supplier Quality (Week 21-26)

**Status:** Analysis complete, stories need full specs
**Effort:** 14-18 days (2 devs), 7-9 days (2 devs parallel)
**Start:** Week 21 (after Phase 3 running 2+ weeks + multiple CAPA cycles completed)
**Prerequisites:** Phase 3 complete, Phase 2 complete, 6+ months operational data

### Phase 4 Stories (10 Total)

#### CAPA Core (3 stories)

**06.31: CAPA CRUD**
- Create CAPA (Corrective/Preventive Action) record
- Document issue (from NCR, inspection, audit)
- Set urgency + due date
- Link to quality issue
- **Days:** 2-3
- **Complexity:** M

**06.32: CAPA Actions Management**
- Define immediate actions (stop-gap)
- Define root cause investigation
- Define long-term corrective action
- Assign owners + deadlines
- **Days:** 2-3
- **Complexity:** M

**06.33: CAPA Effectiveness Checks**
- Re-audit after corrective action
- Verify issue resolved
- Document evidence
- Close CAPA or re-investigate
- **Days:** 2-3
- **Complexity:** M

#### Supplier Quality (3 stories)

**06.34: Supplier Quality Ratings**
- Rate suppliers based on inspection history
- On-time delivery + quality metrics
- Compliance to specs
- Performance trend
- **Days:** 2-3
- **Complexity:** M

**06.35: Supplier Audits CRUD**
- Schedule supplier audit
- Document audit findings
- Categorize findings (critical, major, minor)
- Assign corrective actions to supplier
- **Days:** 3-4
- **Complexity:** M

**06.36: Audit Findings Management**
- Track supplier findings by category
- Monitor supplier corrective action
- Verify effectiveness
- Update supplier rating
- **Days:** 2-3
- **Complexity:** M

#### Analytics & Compliance (2 stories)

**06.37: CAPA Dashboard**
- Open CAPAs by age
- Effectiveness rate
- Most common issues
- Action item status
- **Days:** 2-3
- **Complexity:** S

**06.38: Supplier Scorecard**
- Supplier performance metrics
- Quality, delivery, responsiveness scores
- Trend analysis
- Qualified suppliers list
- **Days:** 2-3
- **Complexity:** S

#### Compliance & Audit (2 stories)

**06.39: Quality Audit Trail (21 CFR Part 11)**
- Complete audit trail of all quality records
- User identification + timestamp
- Change logs (before/after values)
- No record deletion (immutable)
- **Days:** 2-3
- **Complexity:** M

**06.40: E-Signature Support (FDA Compliance)**
- Digital signature field on inspection/CoA
- Signature timestamp + user
- Signature verification
- Meets 21 CFR Part 11 requirements
- **Days:** 2-3
- **Complexity:** M

### Phase 4 Workflow

```
┌─────────────────────────────────────────────────┐
│              CAPA CREATION FLOW                  │
└─────────────────────────────────────────────────┘

Issue Identified
    ├─ NCR investigation (Phase 2)
    ├─ Inspection failure (Phase 1)
    ├─ CCP deviation (Phase 3)
    └─ Customer complaint (external)
    ↓
06.31: Create CAPA
    ├─ Document issue
    ├─ Set urgency
    └─ Link to root cause
    ↓
06.32: Define Actions
    ├─ Immediate action (stop-gap)
    ├─ Root cause investigation
    ├─ Long-term corrective action
    └─ Assign owners + dates
    ↓
Execute Actions
    └─→ Track progress, update status
    ↓
06.33: Effectiveness Check
    ├─ Re-audit
    ├─ Verify resolution
    └─ Close CAPA or re-investigate

┌─────────────────────────────────────────────────┐
│        SUPPLIER QUALITY FLOW                     │
└─────────────────────────────────────────────────┘

Supplier Relationship Established (Epic 03)
    ↓
06.34: Rate Supplier
    ├─ Track incoming inspection results
    ├─ Track delivery performance
    ├─ Track spec compliance
    └─ Calculate quality score
    ↓
06.35: Schedule Audit
    ├─ Annual, semi-annual based on risk
    ├─ Document audit findings
    └─ Assign corrective actions
    ↓
06.36: Track Findings
    ├─ Monitor supplier progress
    ├─ Verify corrective actions
    └─ Update rating based on audit
    ↓
06.38: Supplier Scorecard
    ├─ Overall performance score
    ├─ Quality, delivery, responsiveness
    ├─ Trend (improving/stable/declining)
    └─ Decision: approved/conditional/suspended
```

### Phase 4 Key Tables

```
corrective_preventive_actions (CAPAs)
├─ id (PK)
├─ org_id (RLS)
├─ issue_type (ncr/inspection/ccp/customer)
├─ issue_id (FK - can reference NCR, inspection, etc.)
├─ description
├─ urgency (immediate/high/medium/low)
├─ due_date
├─ status (open/in-progress/completed/verified/closed)
├─ created_at
└─ closed_at

capa_actions
├─ id (PK)
├─ capa_id (FK)
├─ action_type (immediate/investigation/correction)
├─ description
├─ owner_id (FK)
├─ due_date
├─ completed_at
└─ evidence

capa_verification
├─ id (PK)
├─ capa_id (FK)
├─ verification_date
├─ verified_by (FK)
├─ is_effective (boolean)
├─ evidence
└─ follow_up_required

supplier_ratings
├─ id (PK)
├─ org_id (RLS)
├─ supplier_id (FK)
├─ rating_date
├─ quality_score (1-100)
├─ delivery_score (1-100)
├─ responsiveness_score (1-100)
├─ overall_score (1-100)
└─ trend (improving/stable/declining)

supplier_audits
├─ id (PK)
├─ org_id (RLS)
├─ supplier_id (FK)
├─ audit_date
├─ auditor_id (FK)
├─ findings (JSON)
├─ critical_findings_count
├─ major_findings_count
├─ minor_findings_count
└─ next_audit_date

quality_audit_trail
├─ id (PK)
├─ org_id (RLS)
├─ record_type (inspection/hold/ncr/capa/etc)
├─ record_id (FK)
├─ user_id (FK)
├─ action (create/update/delete)
├─ before_values (JSON)
├─ after_values (JSON)
├─ timestamp
└─ signature (optional, Phase 4)
```

### Phase 4 Success Criteria

- [ ] 20+ CAPAs created + tracked
- [ ] 80%+ CAPA effectiveness rate
- [ ] Supplier ratings updated quarterly
- [ ] 5+ supplier audits completed
- [ ] Supplier audit findings tracked + resolved
- [ ] Quality audit trail 100% complete (zero gaps)
- [ ] E-signatures on 50+ critical records
- [ ] Zero 21 CFR Part 11 non-conformances
- [ ] Supplier scorecard drives sourcing decisions

---

## Cross-Phase Dependencies

### Phase 1 → Phase 2

- **Unblocks:** NCR investigation requires 10+ inspections with some failures
- **Timeline:** Phase 2 can start Week 13 (after Phase 1 Week 12)
- **Data Dependency:** Inspection pass rates, hold reasons

### Phase 2 → Phase 3

- **Unblocks:** HACCP CCP monitoring requires process stability (NCR trends stable)
- **Timeline:** Phase 3 can start Week 17 (after Phase 2 Week 16)
- **Data Dependency:** NCR root causes identified, corrective actions stabilizing

### Phase 3 → Phase 4

- **Unblocks:** CAPA effectiveness checks require CCP monitoring data (6+ months)
- **Timeline:** Phase 4 can start Week 21 (after Phase 3 Week 20 + 4 weeks data)
- **Data Dependency:** CCP deviations resolved, CAPA cycle completed

---

## Total Story Count Verification

| Phase | Stories |
|-------|---------|
| Phase 1 MVP | 11 |
| Phase 2 NCR | 12 |
| Phase 3 HACCP | 12 |
| Phase 4 CAPA | 10 |
| **TOTAL** | **45** |

---

## Story Creation Status

### Stories Needed Before Implementation

| Phase | Status | Timeline | Action |
|-------|--------|----------|--------|
| **Phase 1** | 📋 Analysis only | Week 7-8 | Create full specs (11 stories) |
| **Phase 2** | 📋 Analysis only | Week 12-13 | Create full specs (12 stories) |
| **Phase 3** | 📋 Analysis only | Week 16-17 | Create full specs (12 stories) |
| **Phase 4** | 📋 Analysis only | Week 20-21 | Create full specs (10 stories) |

**Current Deliverables:**
- Epic 06.0: Overview ✅ DONE
- Epic 06.1-06.11: Story descriptions (.md files) ✅ DONE
- Epic 06: Full story specs ❌ NEEDED (with AC, API design, test strategy)

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0 | 2025-12-16 | DRAFT | Initial 4-phase breakdown from analysis |

---

**Status:** READY FOR REVIEW
**Next Step:** Approve 4-phase structure, confirm Week 9 start date, assign story creation
