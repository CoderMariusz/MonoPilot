# Quality Module Architecture

## Overview

The Quality Module provides comprehensive food safety and quality management capabilities supporting regulatory compliance (HACCP, FDA 21 CFR Part 11). It manages inspections, specifications, NCR/CAPA workflows, Certificate of Analysis (CoA) generation, and supplier quality tracking.

**Module Purpose:**
- QA status tracking (Pending/Passed/Failed/Hold)
- Multi-stage inspections (Incoming/In-Process/Final)
- Product specifications with test parameters
- HACCP plans and CCP monitoring
- NCR (Non-Conformance Report) lifecycle
- CAPA (Corrective/Preventive Action) management
- Certificate of Analysis (CoA) generation
- Supplier quality rating and audits
- Complete audit trail for compliance

**Key Entities:**
- Quality Specifications and Test Parameters
- Inspections and Test Results
- Quality Holds
- NCR Reports and Workflow
- CAPA Records and Actions
- HACCP Plans and CCPs
- CoA Documents

---

## Database Schema

### Core Quality Tables

#### quality_specifications
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
product_id          UUID NOT NULL REFERENCES products(id)
spec_number         TEXT NOT NULL
version             INTEGER DEFAULT 1
name                TEXT NOT NULL
effective_date      DATE NOT NULL
expiry_date         DATE
status              TEXT DEFAULT 'draft'    -- draft, active, expired, superseded
approved_by         UUID REFERENCES users(id)
approved_at         TIMESTAMPTZ
review_frequency_days INTEGER DEFAULT 365
next_review_date    DATE
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, spec_number, version)
```

#### quality_spec_parameters
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
spec_id             UUID NOT NULL REFERENCES quality_specifications(id) ON DELETE CASCADE
sequence            INTEGER NOT NULL
parameter_name      TEXT NOT NULL
parameter_type      TEXT NOT NULL           -- numeric, text, boolean, range
target_value        TEXT
min_value           DECIMAL(15,6)
max_value           DECIMAL(15,6)
unit                TEXT
test_method         TEXT                    -- AOAC, ISO, internal method
instrument_required BOOLEAN DEFAULT false
is_critical         BOOLEAN DEFAULT false   -- Critical parameter flag
acceptance_criteria TEXT                    -- Additional criteria
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(spec_id, sequence)
```

#### quality_inspections
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
inspection_number   TEXT NOT NULL
inspection_type     TEXT NOT NULL           -- incoming, in_process, final
reference_type      TEXT NOT NULL           -- po, to, wo, lp, batch
reference_id        UUID NOT NULL
product_id          UUID NOT NULL REFERENCES products(id)
spec_id             UUID REFERENCES quality_specifications(id)
lp_id               UUID REFERENCES license_plates(id)
batch_number        TEXT
sample_size         INTEGER
lot_size            INTEGER
sampling_plan_id    UUID REFERENCES sampling_plans(id)
inspector_id        UUID NOT NULL REFERENCES users(id)
status              TEXT DEFAULT 'scheduled'  -- scheduled, in_progress, completed, cancelled
scheduled_date      DATE
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
result              TEXT                    -- pass, fail, conditional
result_notes        TEXT
defects_found       INTEGER DEFAULT 0
major_defects       INTEGER DEFAULT 0
minor_defects       INTEGER DEFAULT 0
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, inspection_number)
```

#### quality_test_results
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
inspection_id       UUID NOT NULL REFERENCES quality_inspections(id) ON DELETE CASCADE
parameter_id        UUID NOT NULL REFERENCES quality_spec_parameters(id)
measured_value      TEXT                    -- String to support various types
numeric_value       DECIMAL(15,6)           -- For numeric parameters
result_status       TEXT NOT NULL           -- pass, fail, marginal
tested_by           UUID NOT NULL REFERENCES users(id)
tested_at           TIMESTAMPTZ DEFAULT now()
equipment_id        UUID REFERENCES machines(id)
calibration_date    DATE                    -- Equipment calibration date
notes               TEXT
attachment_url      TEXT                    -- Photo/document evidence
created_at          TIMESTAMPTZ DEFAULT now()
```

#### quality_holds
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
hold_number         TEXT NOT NULL
reason              TEXT NOT NULL
hold_type           TEXT NOT NULL           -- qa_pending, investigation, recall, quarantine
status              TEXT DEFAULT 'active'   -- active, released, disposed
priority            TEXT DEFAULT 'medium'   -- low, medium, high, critical
held_by             UUID NOT NULL REFERENCES users(id)
held_at             TIMESTAMPTZ DEFAULT now()
released_by         UUID REFERENCES users(id)
released_at         TIMESTAMPTZ
release_notes       TEXT
disposition         TEXT                    -- release, rework, scrap, return
ncr_id              UUID REFERENCES ncr_reports(id)
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, hold_number)
```

#### quality_hold_items
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
hold_id             UUID NOT NULL REFERENCES quality_holds(id) ON DELETE CASCADE
reference_type      TEXT NOT NULL           -- lp, wo, batch
reference_id        UUID NOT NULL
quantity_held       DECIMAL(15,4)
uom                 TEXT
location_id         UUID REFERENCES locations(id)
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
```

### NCR Tables

#### ncr_reports
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
ncr_number          TEXT NOT NULL
title               TEXT NOT NULL
description         TEXT NOT NULL
severity            TEXT NOT NULL           -- critical, major, minor
category            TEXT NOT NULL           -- product, process, supplier, equipment
status              TEXT DEFAULT 'draft'
detected_date       DATE NOT NULL
detected_by         UUID NOT NULL REFERENCES users(id)
detection_point     TEXT                    -- incoming, in_process, final, customer
root_cause          TEXT
root_cause_method   TEXT                    -- 5why, fishbone, fmea
immediate_action    TEXT
containment_action  TEXT
reference_type      TEXT                    -- inspection, hold, ccp, customer_complaint
reference_id        UUID
product_id          UUID REFERENCES products(id)
supplier_id         UUID REFERENCES suppliers(id)
wo_id               UUID REFERENCES work_orders(id)
lp_id               UUID REFERENCES license_plates(id)
batch_number        TEXT
quantity_affected   DECIMAL(15,4)
cost_impact         DECIMAL(15,4)
customer_notified   BOOLEAN DEFAULT false
regulatory_report   BOOLEAN DEFAULT false
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)
closed_at           TIMESTAMPTZ
closed_by           UUID REFERENCES users(id)

UNIQUE(org_id, ncr_number)
```

#### ncr_workflow
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
ncr_id              UUID NOT NULL REFERENCES ncr_reports(id) ON DELETE CASCADE
step                TEXT NOT NULL           -- investigation, root_cause, corrective_action, verification
sequence            INTEGER NOT NULL
assigned_to         UUID REFERENCES users(id)
status              TEXT DEFAULT 'pending'  -- pending, in_progress, completed, skipped
due_date            DATE
started_at          TIMESTAMPTZ
completed_at        TIMESTAMPTZ
completed_by        UUID REFERENCES users(id)
notes               TEXT
attachments         TEXT[]
```

### CAPA Tables

#### capa_records
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
capa_number         TEXT NOT NULL
title               TEXT NOT NULL
description         TEXT NOT NULL
capa_type           TEXT NOT NULL           -- corrective, preventive
source_type         TEXT NOT NULL           -- ncr, audit, inspection, customer, internal
source_id           UUID
status              TEXT DEFAULT 'open'     -- open, in_progress, verification, closed
priority            TEXT DEFAULT 'medium'   -- low, medium, high, critical
owner_id            UUID NOT NULL REFERENCES users(id)
root_cause_analysis TEXT
target_close_date   DATE NOT NULL
actual_close_date   DATE
effectiveness_verified BOOLEAN DEFAULT false
effectiveness_date  DATE
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, capa_number)
```

#### capa_actions
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
capa_id             UUID NOT NULL REFERENCES capa_records(id) ON DELETE CASCADE
sequence            INTEGER NOT NULL
action_type         TEXT NOT NULL           -- immediate, corrective, preventive
description         TEXT NOT NULL
assigned_to         UUID NOT NULL REFERENCES users(id)
due_date            DATE NOT NULL
completed_date      DATE
status              TEXT DEFAULT 'pending'  -- pending, in_progress, completed, cancelled
evidence_url        TEXT
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
```

#### capa_effectiveness_checks
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
capa_id             UUID NOT NULL REFERENCES capa_records(id) ON DELETE CASCADE
check_date          DATE NOT NULL
checked_by          UUID NOT NULL REFERENCES users(id)
result              TEXT NOT NULL           -- effective, not_effective, partial
metrics_before      JSONB
metrics_after       JSONB
notes               TEXT
verified            BOOLEAN DEFAULT false
verified_by         UUID REFERENCES users(id)
verified_at         TIMESTAMPTZ
```

### CoA Tables

#### certificates_of_analysis
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
coa_number          TEXT NOT NULL
batch_id            TEXT NOT NULL
product_id          UUID NOT NULL REFERENCES products(id)
lp_id               UUID REFERENCES license_plates(id)
inspection_id       UUID REFERENCES quality_inspections(id)
template_id         UUID REFERENCES coa_templates(id)
issue_date          DATE NOT NULL
issued_by           UUID NOT NULL REFERENCES users(id)
status              TEXT DEFAULT 'draft'    -- draft, issued, voided
document_url        TEXT                    -- Generated PDF URL
expiry_date         DATE
customer_id         UUID
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, coa_number)
```

#### coa_templates
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
name                TEXT NOT NULL
product_type        TEXT                    -- Optional filter by product type
header_template     TEXT                    -- Handlebars/Mustache template
footer_template     TEXT
logo_url            TEXT
parameters_config   JSONB                   -- Which parameters to include
layout_config       JSONB                   -- Page layout settings
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)
```

#### coa_parameters
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
coa_id              UUID NOT NULL REFERENCES certificates_of_analysis(id) ON DELETE CASCADE
sequence            INTEGER NOT NULL
parameter_name      TEXT NOT NULL
specification       TEXT                    -- "5.0 - 6.5"
result              TEXT NOT NULL
method              TEXT
pass_fail           TEXT NOT NULL           -- pass, fail
notes               TEXT
```

### Sampling Tables

#### sampling_plans
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
name                TEXT NOT NULL
inspection_type     TEXT NOT NULL           -- incoming, in_process, final
product_id          UUID REFERENCES products(id)  -- Optional product filter
aql_level           TEXT                    -- I, II, III (general inspection level)
special_level       TEXT                    -- S-1, S-2, S-3, S-4
lot_size_min        INTEGER NOT NULL
lot_size_max        INTEGER NOT NULL
sample_size         INTEGER NOT NULL
acceptance_number   INTEGER NOT NULL        -- Ac
rejection_number    INTEGER NOT NULL        -- Re
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ DEFAULT now()
```

#### sampling_records
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
plan_id             UUID NOT NULL REFERENCES sampling_plans(id)
inspection_id       UUID NOT NULL REFERENCES quality_inspections(id)
sample_identifier   TEXT NOT NULL
location_description TEXT
sampled_by          UUID NOT NULL REFERENCES users(id)
sampled_at          TIMESTAMPTZ DEFAULT now()
notes               TEXT
```

### HACCP Tables

#### haccp_plans
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
product_id          UUID NOT NULL REFERENCES products(id)
plan_number         TEXT NOT NULL
version             INTEGER DEFAULT 1
name                TEXT NOT NULL
description         TEXT
effective_date      DATE NOT NULL
status              TEXT DEFAULT 'draft'    -- draft, active, archived
approved_by         UUID REFERENCES users(id)
approved_at         TIMESTAMPTZ
review_frequency_months INTEGER DEFAULT 12
next_review_date    DATE
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)

UNIQUE(org_id, plan_number, version)
```

#### haccp_ccps
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
haccp_plan_id       UUID NOT NULL REFERENCES haccp_plans(id) ON DELETE CASCADE
ccp_number          TEXT NOT NULL           -- CCP-1, CCP-2
process_step        TEXT NOT NULL
step_name           TEXT NOT NULL
hazard_type         TEXT NOT NULL           -- biological, chemical, physical
hazard_description  TEXT NOT NULL
justification       TEXT
critical_limit_min  DECIMAL(15,6)
critical_limit_max  DECIMAL(15,6)
target_value        DECIMAL(15,6)
unit                TEXT NOT NULL           -- C, ppm, pH, seconds
monitoring_frequency TEXT NOT NULL          -- continuous, every_batch, hourly
monitoring_method   TEXT NOT NULL
corrective_action   TEXT NOT NULL
verification_method TEXT
responsible_role    TEXT
equipment_id        UUID REFERENCES machines(id)
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(haccp_plan_id, ccp_number)
```

#### haccp_monitoring_records
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
ccp_id              UUID NOT NULL REFERENCES haccp_ccps(id)
wo_id               UUID REFERENCES work_orders(id)
operation_id        UUID REFERENCES wo_operations(id)
batch_number        TEXT
monitored_at        TIMESTAMPTZ NOT NULL DEFAULT now()
monitored_by        UUID NOT NULL REFERENCES users(id)
measured_value      DECIMAL(15,6) NOT NULL
within_limits       BOOLEAN NOT NULL
deviation_action    TEXT                    -- If out of limits
notes               TEXT
equipment_id        UUID REFERENCES machines(id)
created_at          TIMESTAMPTZ DEFAULT now()
```

#### haccp_deviations
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
ccp_id              UUID NOT NULL REFERENCES haccp_ccps(id)
monitoring_record_id UUID REFERENCES haccp_monitoring_records(id)
deviation_type      TEXT NOT NULL           -- over_limit, under_limit, equipment_fail
severity            TEXT NOT NULL           -- critical, major, minor
detected_at         TIMESTAMPTZ NOT NULL
detected_by         UUID NOT NULL REFERENCES users(id)
measured_value      DECIMAL(15,6)
limit_value         DECIMAL(15,6)
corrected_at        TIMESTAMPTZ
correction_action   TEXT
correction_notes    TEXT
ncr_id              UUID REFERENCES ncr_reports(id)
product_disposition TEXT                    -- released, rework, destroy, hold
created_at          TIMESTAMPTZ DEFAULT now()
```

#### haccp_verification_records
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
haccp_plan_id       UUID NOT NULL REFERENCES haccp_plans(id)
verification_date   DATE NOT NULL
verified_by         UUID NOT NULL REFERENCES users(id)
verification_type   TEXT NOT NULL           -- record_review, calibration, audit, testing
scope               TEXT
result              TEXT NOT NULL           -- satisfactory, unsatisfactory
findings            TEXT
corrective_actions  TEXT
next_verification   DATE
attachments         TEXT[]
created_at          TIMESTAMPTZ DEFAULT now()
```

### Supplier Quality Tables

#### supplier_quality_ratings
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
supplier_id         UUID NOT NULL REFERENCES suppliers(id)
rating_period       TEXT NOT NULL           -- 2024-Q1, 2024-M01
overall_score       DECIMAL(3,2)            -- 1.00 - 5.00
quality_score       DECIMAL(3,2)
delivery_score      DECIMAL(3,2)
response_score      DECIMAL(3,2)
ncr_count           INTEGER DEFAULT 0
on_time_delivery_pct DECIMAL(5,2)
defect_ppm          DECIMAL(10,2)           -- Parts per million
rated_by            UUID REFERENCES users(id)
rated_at            TIMESTAMPTZ DEFAULT now()
notes               TEXT

UNIQUE(org_id, supplier_id, rating_period)
```

#### supplier_audits
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
supplier_id         UUID NOT NULL REFERENCES suppliers(id)
audit_date          DATE NOT NULL
audit_type          TEXT NOT NULL           -- initial, periodic, for_cause, surveillance
auditor             TEXT NOT NULL
auditor_company     TEXT
scope               TEXT
overall_score       DECIMAL(5,2)            -- 0-100
status              TEXT DEFAULT 'scheduled'  -- scheduled, in_progress, completed
result              TEXT                    -- approved, conditional, not_approved
next_audit_date     DATE
report_url          TEXT
created_at          TIMESTAMPTZ DEFAULT now()
created_by          UUID REFERENCES users(id)
```

#### supplier_audit_findings
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
audit_id            UUID NOT NULL REFERENCES supplier_audits(id) ON DELETE CASCADE
category            TEXT NOT NULL           -- documentation, facility, process, haccp, pest
finding_type        TEXT NOT NULL           -- observation, minor, major, critical
description         TEXT NOT NULL
requirement_ref     TEXT                    -- Standard reference (ISO clause, etc.)
corrective_action   TEXT
due_date            DATE
closed_date         DATE
status              TEXT DEFAULT 'open'     -- open, in_progress, closed, verified
evidence_url        TEXT
```

### Audit Trail Table

#### quality_audit_log
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
entity_type         TEXT NOT NULL           -- inspection, ncr, capa, hold, ccp
entity_id           UUID NOT NULL
action              TEXT NOT NULL           -- create, update, delete, approve, reject
user_id             UUID NOT NULL REFERENCES users(id)
timestamp           TIMESTAMPTZ NOT NULL DEFAULT now()
old_value           JSONB
new_value           JSONB
change_reason       TEXT                    -- Required for critical changes
ip_address          TEXT
```

### Settings Table

#### quality_settings
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id) UNIQUE

-- Inspection Settings
require_incoming_inspection     BOOLEAN DEFAULT true
require_final_inspection        BOOLEAN DEFAULT true
auto_create_inspection_on_grn   BOOLEAN DEFAULT true
default_sampling_level          TEXT DEFAULT 'II'

-- Hold Settings
require_hold_reason             BOOLEAN DEFAULT true
require_disposition_on_release  BOOLEAN DEFAULT true

-- NCR Settings
ncr_auto_number_prefix          TEXT DEFAULT 'NCR-'
ncr_require_root_cause          BOOLEAN DEFAULT true
ncr_critical_response_hours     INTEGER DEFAULT 24
ncr_major_response_hours        INTEGER DEFAULT 48

-- CAPA Settings
capa_auto_number_prefix         TEXT DEFAULT 'CAPA-'
capa_require_effectiveness      BOOLEAN DEFAULT true
capa_effectiveness_wait_days    INTEGER DEFAULT 30

-- CoA Settings
coa_auto_number_prefix          TEXT DEFAULT 'COA-'
coa_require_approval            BOOLEAN DEFAULT false

-- HACCP Settings
ccp_deviation_escalation_minutes INTEGER DEFAULT 15
ccp_auto_create_ncr             BOOLEAN DEFAULT true

-- Audit Settings
require_change_reason           BOOLEAN DEFAULT true
retention_years                 INTEGER DEFAULT 7

created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_inspections_org_status ON quality_inspections(org_id, status);
CREATE INDEX idx_inspections_type ON quality_inspections(org_id, inspection_type);
CREATE INDEX idx_inspections_product ON quality_inspections(product_id);
CREATE INDEX idx_inspections_ref ON quality_inspections(reference_type, reference_id);

CREATE INDEX idx_test_results_inspection ON quality_test_results(inspection_id);
CREATE INDEX idx_test_results_param ON quality_test_results(parameter_id);

CREATE INDEX idx_holds_org_status ON quality_holds(org_id, status);
CREATE INDEX idx_hold_items_hold ON quality_hold_items(hold_id);

CREATE INDEX idx_ncr_org_status ON ncr_reports(org_id, status);
CREATE INDEX idx_ncr_severity ON ncr_reports(org_id, severity);
CREATE INDEX idx_ncr_supplier ON ncr_reports(supplier_id) WHERE supplier_id IS NOT NULL;

CREATE INDEX idx_capa_org_status ON capa_records(org_id, status);
CREATE INDEX idx_capa_owner ON capa_records(owner_id);

CREATE INDEX idx_haccp_product ON haccp_plans(product_id);
CREATE INDEX idx_ccp_plan ON haccp_ccps(haccp_plan_id);
CREATE INDEX idx_ccp_monitoring_ccp ON haccp_monitoring_records(ccp_id);
CREATE INDEX idx_ccp_monitoring_date ON haccp_monitoring_records(monitored_at);

CREATE INDEX idx_coa_org_batch ON certificates_of_analysis(org_id, batch_id);
CREATE INDEX idx_coa_product ON certificates_of_analysis(product_id);

CREATE INDEX idx_supplier_ratings_supplier ON supplier_quality_ratings(supplier_id);
CREATE INDEX idx_supplier_audits_supplier ON supplier_audits(supplier_id);

CREATE INDEX idx_audit_log_entity ON quality_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_date ON quality_audit_log(timestamp);
```

---

## API Design

### Inspections Endpoints
```
GET    /api/quality/inspections                         -- List with filters
GET    /api/quality/inspections/:id                     -- Inspection detail
POST   /api/quality/inspections                         -- Create inspection
POST   /api/quality/inspections/:id/start               -- Start inspection
POST   /api/quality/inspections/:id/complete            -- Complete with result
GET    /api/quality/inspections/pending                 -- Pending inspections
GET    /api/quality/inspections/incoming                -- Incoming queue
GET    /api/quality/inspections/in-process              -- In-process queue
GET    /api/quality/inspections/final                   -- Final queue

POST   /api/quality/test-results                        -- Record test result
GET    /api/quality/test-results/inspection/:id         -- Results by inspection
```

### Specifications Endpoints
```
GET    /api/quality/specifications                      -- List specs
GET    /api/quality/specifications/:id                  -- Spec detail
POST   /api/quality/specifications                      -- Create spec
PUT    /api/quality/specifications/:id                  -- Update spec
POST   /api/quality/specifications/:id/approve          -- Approve spec
GET    /api/quality/specifications/product/:productId   -- Specs for product
```

### Holds Endpoints
```
GET    /api/quality/holds                               -- List holds
GET    /api/quality/holds/:id                           -- Hold detail
POST   /api/quality/holds                               -- Create hold
PATCH  /api/quality/holds/:id/release                   -- Release hold
GET    /api/quality/holds/active                        -- Active holds
POST   /api/quality/holds/:id/items                     -- Add items to hold
```

### NCR Endpoints
```
GET    /api/quality/ncrs                                -- List NCRs
GET    /api/quality/ncrs/:id                            -- NCR detail
POST   /api/quality/ncrs                                -- Create NCR
PUT    /api/quality/ncrs/:id                            -- Update NCR
POST   /api/quality/ncrs/:id/workflow/next              -- Advance workflow
POST   /api/quality/ncrs/:id/close                      -- Close NCR
GET    /api/quality/ncrs/stats                          -- NCR statistics
```

### CAPA Endpoints
```
GET    /api/quality/capa                                -- List CAPAs
GET    /api/quality/capa/:id                            -- CAPA detail
POST   /api/quality/capa                                -- Create CAPA
PUT    /api/quality/capa/:id                            -- Update CAPA
POST   /api/quality/capa/:id/actions                    -- Add action
PUT    /api/quality/capa/:id/actions/:actionId          -- Update action
POST   /api/quality/capa/:id/effectiveness-check        -- Record check
POST   /api/quality/capa/:id/close                      -- Close CAPA
```

### CoA Endpoints
```
GET    /api/quality/coa                                 -- List CoAs
GET    /api/quality/coa/:id                             -- CoA detail
POST   /api/quality/coa                                 -- Create CoA
GET    /api/quality/coa/:id/pdf                         -- Generate PDF
POST   /api/quality/coa/:id/send                        -- Send to customer
GET    /api/quality/coa-templates                       -- List templates
POST   /api/quality/coa-templates                       -- Create template
```

### HACCP Endpoints
```
GET    /api/quality/haccp/plans                         -- List plans
GET    /api/quality/haccp/plans/:id                     -- Plan detail
POST   /api/quality/haccp/plans                         -- Create plan
PUT    /api/quality/haccp/plans/:id                     -- Update plan
POST   /api/quality/haccp/plans/:id/approve             -- Approve plan

GET    /api/quality/haccp/ccps                          -- List CCPs
POST   /api/quality/haccp/ccps                          -- Create CCP
PUT    /api/quality/haccp/ccps/:id                      -- Update CCP

POST   /api/quality/haccp/monitoring                    -- Record CCP value
GET    /api/quality/haccp/monitoring/ccp/:ccpId         -- Monitoring history
GET    /api/quality/haccp/deviations/active             -- Active deviations
POST   /api/quality/haccp/deviations                    -- Create deviation
POST   /api/quality/haccp/verification                  -- Record verification
```

### Sampling Endpoints
```
GET    /api/quality/sampling-plans                      -- List plans
POST   /api/quality/sampling-plans                      -- Create plan
GET    /api/quality/sampling-plans/:id                  -- Plan detail
POST   /api/quality/sampling-records                    -- Record sample
```

### Supplier Quality Endpoints
```
GET    /api/quality/supplier-ratings                    -- List ratings
POST   /api/quality/supplier-ratings                    -- Create rating
GET    /api/quality/supplier-ratings/:supplierId        -- Supplier ratings

GET    /api/quality/supplier-audits                     -- List audits
POST   /api/quality/supplier-audits                     -- Create audit
GET    /api/quality/supplier-audits/:id                 -- Audit detail
POST   /api/quality/supplier-audits/:id/findings        -- Add finding
PUT    /api/quality/supplier-audits/:id/findings/:fId   -- Update finding
```

### Dashboard & Reports Endpoints
```
GET    /api/quality/dashboard                           -- KPIs
GET    /api/quality/reports/audit-trail                 -- Audit log
GET    /api/quality/reports/inspection-summary          -- Inspection report
GET    /api/quality/reports/ncr-trends                  -- NCR trends
GET    /api/quality/reports/ccp-compliance              -- CCP compliance
GET    /api/quality/reports/supplier-scorecard          -- Supplier report
GET    /api/quality/analytics/defect-pareto             -- Pareto analysis
```

### Batch Release Endpoints
```
POST   /api/quality/batch/:batchId/release-check        -- Check release criteria
POST   /api/quality/batch/:batchId/release              -- Release batch
GET    /api/quality/batch/:batchId/status               -- Batch QA status
```

### Settings Endpoints
```
GET    /api/quality/settings
PUT    /api/quality/settings
```

---

## Component Architecture

### Key React Components

```
apps/frontend/app/(authenticated)/quality/
├── page.tsx                    -- Quality dashboard
├── inspections/
│   ├── page.tsx               -- Inspection list
│   ├── [id]/page.tsx          -- Inspection detail with tests
│   └── components/
│       ├── InspectionTable.tsx
│       ├── InspectionForm.tsx
│       ├── TestResultsForm.tsx
│       ├── InspectionQueue.tsx
│       └── ResultsGrid.tsx
├── specifications/
│   ├── page.tsx               -- Spec list
│   ├── [id]/page.tsx          -- Spec detail with parameters
│   └── components/
│       ├── SpecTable.tsx
│       ├── SpecForm.tsx
│       └── ParameterEditor.tsx
├── holds/
│   ├── page.tsx               -- Hold list
│   ├── [id]/page.tsx          -- Hold detail
│   └── components/
│       ├── HoldTable.tsx
│       ├── HoldForm.tsx
│       ├── HoldItemsTable.tsx
│       └── ReleaseModal.tsx
├── ncr/
│   ├── page.tsx               -- NCR list
│   ├── [id]/page.tsx          -- NCR detail with workflow
│   └── components/
│       ├── NCRTable.tsx
│       ├── NCRForm.tsx
│       ├── NCRWorkflow.tsx
│       └── RootCauseAnalysis.tsx
├── capa/
│   ├── page.tsx               -- CAPA list
│   ├── [id]/page.tsx          -- CAPA detail with actions
│   └── components/
│       ├── CAPATable.tsx
│       ├── CAPAForm.tsx
│       ├── ActionsList.tsx
│       └── EffectivenessCheck.tsx
├── coa/
│   ├── page.tsx               -- CoA list
│   ├── [id]/page.tsx          -- CoA detail
│   └── components/
│       ├── CoATable.tsx
│       ├── CoAForm.tsx
│       ├── CoAPreview.tsx
│       └── TemplateEditor.tsx
├── haccp/
│   ├── page.tsx               -- HACCP plans list
│   ├── [id]/page.tsx          -- Plan detail with CCPs
│   ├── monitoring/page.tsx    -- CCP monitoring dashboard
│   └── components/
│       ├── HACCPPlanTable.tsx
│       ├── CCPList.tsx
│       ├── CCPMonitoringForm.tsx
│       ├── DeviationAlert.tsx
│       └── MonitoringChart.tsx
├── supplier-quality/
│   ├── page.tsx               -- Supplier quality dashboard
│   ├── ratings/page.tsx       -- Rating list
│   ├── audits/page.tsx        -- Audit list
│   └── components/
│       ├── SupplierScorecard.tsx
│       ├── RatingForm.tsx
│       ├── AuditForm.tsx
│       └── FindingsTable.tsx
└── settings/
    └── page.tsx               -- Quality settings
```

### Service Dependencies

```
lib/services/
├── inspection-service.ts      -- Inspection CRUD, test results
├── specification-service.ts   -- Spec CRUD, parameters
├── quality-hold-service.ts    -- Hold CRUD, release
├── ncr-service.ts             -- NCR CRUD, workflow
├── capa-service.ts            -- CAPA CRUD, actions, effectiveness
├── coa-service.ts             -- CoA CRUD, PDF generation
├── haccp-service.ts           -- HACCP plans, CCPs, monitoring
├── sampling-service.ts        -- Sampling plans, records
├── supplier-quality-service.ts -- Ratings, audits
├── quality-dashboard-service.ts
└── quality-settings-service.ts
```

---

## Data Flow

### Incoming Inspection Flow
```
+-------------+     +----------------+     +----------------+
|   GRN       | --> |   Auto-create  | --> | quality_       |
|   Complete  |     |   Inspection   |     | inspections    |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |             type='incoming'               |
      |             status='scheduled'            |
      |                    |                      |
      v                    v                      v
+-------------+     +----------------+     +----------------+
|   QA Queue  |     |   Inspector    | --> |   Test Results |
|   Display   |     |   Records      |     |   per param    |
+-------------+     +----------------+     +----------------+
                          |
                          v
                   +----------------+     +----------------+
                   |   Determine    | --> |   LP QA Status |
                   |   Pass/Fail    |     |   Update       |
                   +----------------+     +----------------+
```

### NCR Workflow Flow
```
+-------------+     +----------------+     +----------------+
|   Defect    | --> |   Create NCR   | --> |   ncr_reports  |
|   Detected  |     |   (Draft)      |     |   status=draft |
+-------------+     +----------------+     +----------------+
      |                    |
      |             Submit for Investigation
      |                    |
      v                    v
+-------------+     +----------------+     +----------------+
|   Workflow  | --> |   Investigation| --> |   Root Cause   |
|   Steps     |     |   Step         |     |   Analysis     |
+-------------+     +----------------+     +----------------+
                          |
                          v
                   +----------------+     +----------------+
                   |   Corrective   | --> |   Create CAPA  |
                   |   Action       |     |   (optional)   |
                   +----------------+     +----------------+
                          |
                          v
                   +----------------+     +----------------+
                   |   Verification | --> |   Close NCR    |
                   |   Step         |     |                |
                   +----------------+     +----------------+
```

### CCP Monitoring Flow
```
+-------------+     +----------------+     +----------------+
|   Operator  | --> |   Record CCP   | --> |   Validate     |
|   Scanner   |     |   Value        |     |   vs Limits    |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |                    v                      v
      |             +----------------+     +----------------+
      |             | within_limits  |     |   If FALSE:    |
      |             |   = TRUE/FALSE |     |   Alert!       |
      |             +----------------+     +----------------+
      |                    |                      |
      v                    v                      v
+-------------+     +----------------+     +----------------+
|   Success   |     |   haccp_       |     |   haccp_       |
|   Feedback  |     |   monitoring   |     |   deviations   |
+-------------+     +----------------+     +----------------+
                                                 |
                                          If auto_create_ncr
                                                 |
                                                 v
                                          +----------------+
                                          |   Create NCR   |
                                          |   Automatically|
                                          +----------------+
```

---

## Security

### RLS Policies

```sql
-- Inspections: org_id filter
CREATE POLICY "Inspections org isolation"
ON quality_inspections FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- NCRs: org_id filter
CREATE POLICY "NCR org isolation"
ON ncr_reports FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- CAPAs: org_id filter
CREATE POLICY "CAPA org isolation"
ON capa_records FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Audit log: immutable (no update/delete)
CREATE POLICY "Audit log read only"
ON quality_audit_log FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Audit log insert only"
ON quality_audit_log FOR INSERT
WITH CHECK (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| GET /inspections | Any authenticated |
| POST /inspections | QA Inspector, QA Manager |
| POST /inspections/:id/complete | QA Inspector, QA Manager |
| /specifications | QA Manager, Admin |
| POST /holds | QA Inspector, QA Manager |
| PATCH /holds/:id/release | QA Manager, Admin |
| /ncrs | QA Inspector, QA Manager |
| /ncrs/:id/close | QA Manager |
| /capa | QA Manager, Admin |
| /haccp/monitoring | Operator, QA Inspector |
| /haccp/plans | QA Manager, Admin |
| /settings | Admin |

### E-Signature Requirements (Phase 3)
- Change reason required for critical field modifications
- User ID + timestamp for all approvals
- Password re-entry for release actions
- Compliant with FDA 21 CFR Part 11

---

## Performance Considerations

### Expected Data Volumes

| Entity | Typical Count | Max Count |
|--------|--------------|-----------|
| Inspections per month | 500-2,000 | 20,000 |
| Test results per inspection | 10-50 | 200 |
| Active holds | 10-50 | 500 |
| NCRs per month | 20-100 | 1,000 |
| CAPAs per year | 50-200 | 2,000 |
| CCP monitoring per day | 100-1,000 | 10,000 |
| CoAs per month | 100-500 | 5,000 |

### Query Optimization

1. **Inspection Queue:**
   - Index on (org_id, status, inspection_type)
   - Filter by status='scheduled'
   - Paginate with limit 20

2. **NCR Dashboard:**
   - Index on (org_id, status, severity)
   - Cache KPIs (1 min TTL)
   - Aggregate queries for trends

3. **CCP Monitoring:**
   - Index on (ccp_id, monitored_at)
   - Real-time insert performance critical
   - Batch insert for scanner syncs

4. **Audit Trail:**
   - Append-only table
   - Index on (entity_type, entity_id)
   - Partition by timestamp (monthly)

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:quality:dashboard'          // 1 min TTL
'org:{orgId}:inspection:queue:{type}'    // 30 sec TTL
'org:{orgId}:ncr:active-count'           // 1 min TTL
'org:{orgId}:ccp:{ccpId}:last-reading'   // 5 min TTL
'org:{orgId}:spec:{productId}:active'    // 5 min TTL
```

---

## Integration Points

### Module Dependencies

```
Quality Module
    |
    +---> Settings (users for inspectors, machines for equipment)
    +---> Technical (products for specifications)
    +---> Planning (PO for incoming inspection, suppliers)
    +---> Production (WO for in-process, CCP monitoring)
    +---> Warehouse (LP for holds, QA status updates)
    +---> Shipping (CoA for shipments)
```

### Event Publishing

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `inspection.completed` | Inspection done | LP QA status, Alerts |
| `hold.created` | Hold created | LP blocking, Alerts |
| `hold.released` | Hold released | LP available |
| `ncr.created` | NCR created | Notifications |
| `ncr.escalated` | Critical NCR | Email alerts |
| `ccp.deviation` | CCP out of limits | Alert, NCR creation |
| `coa.issued` | CoA issued | Shipping |
| `batch.released` | Batch released | Shipping |

### Data Dependencies

| Upstream | Data Required |
|----------|---------------|
| Planning | PO for incoming, suppliers |
| Production | WO, operations for in-process |
| Warehouse | LP for inspection reference |
| Technical | Products for specifications |

| Downstream | Data Provided |
|------------|---------------|
| Warehouse | LP QA status updates |
| Shipping | CoA documents, release status |
| Production | CCP deviation alerts |

---

## Business Rules

### Inspections
- Incoming inspection required for GRN (if setting enabled)
- Final inspection required before batch release
- At least one sample per inspection
- All critical parameters must pass for overall pass

### Holds
- Hold blocks LP from consumption
- Release requires disposition decision
- NCR link optional but recommended
- Audit trail for all hold actions

### NCR
- Critical NCR: 24-hour response time
- Major NCR: 48-hour response time
- Root cause analysis required before closure
- CAPA creation recommended for recurring issues

### CAPA
- Effectiveness check required after 30 days (configurable)
- All actions must be completed before closure
- Effectiveness must be verified by different user

### HACCP/CCP
- Critical limits must be defined for each CCP
- Deviation creates immediate alert
- Corrective action required for all deviations
- Auto-NCR creation on critical deviations

### CoA
- All inspection results included automatically
- Batch must pass final inspection
- Digital signature optional (e-signature in Phase 3)

---

## Testing Requirements

### Unit Tests (80%+ coverage)
- Inspection service: CRUD, test results, pass/fail logic
- NCR service: CRUD, workflow state machine
- CAPA service: CRUD, actions, effectiveness
- HACCP service: CCP monitoring, deviation detection
- CoA service: PDF generation

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement
- NCR workflow transitions
- CCP deviation -> NCR creation
- Audit log immutability

### E2E Tests
- Incoming inspection flow (GRN -> inspection -> LP release)
- NCR full workflow (create -> investigate -> correct -> close)
- CCP monitoring -> deviation -> corrective action
- CoA generation and PDF download
