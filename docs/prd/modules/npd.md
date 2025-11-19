# NPD (New Product Development) Module PRD

## Overview

The NPD Module is a **premium add-on** for food manufacturers who need structured product innovation processes before commercial production. It implements **Stage-Gate methodology** with full traceability and compliance documentation.

### Module Type
- **Premium Add-on**: Growth/Enterprise tiers
- **Bounded Context**: Operates standalone OR integrated with Production
- **Feature Flag**: Per-organization activation (`org_settings.enabled_modules: ['npd']`)

### Dependencies
- **Technical Module**: Products, BOMs (for handoff)
- **Planning Module**: Work Orders (pilot WOs)
- **Warehouse Module**: License Plates (trial materials)
- **Quality Module**: Allergens (auto-aggregation)

### Key Concepts
- **Stage-Gate**: G0 (Idea) → G1 (Feasibility) → G2 (Business Case) → G3 (Development) → G4 (Testing) → Launch
- **Formulation**: Recipe version with ingredients, precursor to BOM
- **Handoff**: Transfer formulation to Production (Product + BOM + Pilot WO)
- **Pilot WO**: Small batch trial Work Order

---

## 1. NPD Settings

All NPD features are controlled via Settings toggles.

### 1.1 Configuration Table

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_npd_module` | boolean | false | Enable NPD functionality |
| `npd_only_mode` | boolean | false | NPD without Production (R&D consultancy) |
| `require_costing_approval` | boolean | true | Finance must approve before handoff |
| `cost_variance_warning_pct` | decimal | 20 | Warn when actual > target by % |
| `cost_variance_blocker_pct` | decimal | 50 | Block handoff when variance exceeds % |
| `require_compliance_docs` | boolean | true | Require HACCP, label proof for handoff |
| `enable_pilot_wo` | boolean | true | Create pilot WO during handoff |
| `default_pilot_routing` | FK | null | Default routing for pilot WOs |
| `enable_formulation_export` | boolean | true | Allow PDF/Excel export |
| `event_retention_days` | integer | 90 | Days to retain event logs |
| `max_formulation_versions` | integer | 10 | Max versions per project |

---

## 2. NPD Projects

### 2.1 Project Concept
NPD Project is the container for all innovation activities. It tracks progress through Stage-Gate workflow from idea to launch.

### 2.2 Project Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `project_number` | string | Yes | Auto-generated unique ID |
| `project_name` | string | Yes | Project name |
| `description` | text | No | Project description |
| `portfolio_category` | string | No | Category (e.g., "Premium Burgers", "Vegan Line") |
| `current_gate` | enum | Yes | G0, G1, G2, G3, G4, Launched |
| `status` | enum | Yes | idea, feasibility, business_case, development, testing, launched, cancelled |
| `priority` | enum | No | low, medium, high |
| `owner_id` | FK | Yes | NPD Lead user |
| `target_launch_date` | date | No | Target launch date |
| `actual_launch_date` | date | No | Actual launch date |
| `created_at` | datetime | Yes | When created |

### 2.3 Stage-Gate Workflow

```
G0: Idea
├── Initial concept description
├── Quick feasibility check
└── Go/No-Go decision

G1: Feasibility
├── Technical feasibility
├── Resource requirements
├── Initial cost estimate
└── Approval to proceed

G2: Business Case
├── Financial analysis
├── Target cost setting
├── Market research
└── Business approval

G3: Development
├── Formulation development
├── Trial batches
├── Allergen validation
└── Development complete

G4: Testing
├── Shelf-life testing
├── Sensory evaluation
├── Compliance docs
├── Final approval
└── Ready for handoff

Launched
├── Handoff to Production
└── Commercial production
```

### 2.4 Gate Entry Criteria

| Gate | Entry Criteria |
|------|----------------|
| G0 → G1 | G0 checklist complete |
| G1 → G2 | G1 approval, feasibility confirmed |
| G2 → G3 | G2 approval, business case approved, target cost set |
| G3 → G4 | G3 approval, formulation locked, trials complete |
| G4 → Launch | G4 approval, compliance docs complete, costing approved |

### 2.5 Project UI

#### Kanban Dashboard
- Columns: G0, G1, G2, G3, G4, Launched
- Drag-and-drop project cards
- Color by priority
- Filter by category, owner, priority

#### Timeline View
- Horizontal bars from created_at to target_launch_date
- Visual progress indicator
- Overdue highlighting

#### Project List View
- Filter by: Status, Category, Owner, Priority, Date range
- Columns: Project #, Name, Gate, Priority, Owner, Target Date
- Actions: View, Edit, Archive

#### Project Detail View
- All project fields
- Current gate with checklist
- Formulations list
- Costing summary
- Risks list
- Documents
- Approval history
- Actions: Edit, Advance Gate, Create Formulation, Handoff

---

## 3. Formulations

### 3.1 Formulation Concept
Formulation is the recipe version during development. It becomes a BOM upon handoff. Supports versioning with effective dates and lineage tracking.

### 3.2 Formulation Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `formulation_number` | string | Yes | Version identifier (v1.0, v1.1, v2.0) |
| `npd_project_id` | FK | Yes | Parent project |
| `status` | enum | Yes | draft, approved, locked |
| `effective_from` | date | No | Start date |
| `effective_to` | date | No | End date |
| `parent_formulation_id` | FK | No | Previous version (lineage) |
| `total_qty` | decimal | Yes | Total formulation quantity |
| `uom` | string | Yes | Unit of measure |
| `notes` | text | No | Formulation notes |
| `approved_by` | FK | No | Who approved |
| `approved_at` | datetime | No | When approved |

### 3.3 Formulation Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `formulation_id` | FK | Yes | Parent formulation |
| `product_id` | FK | Yes | Ingredient product |
| `quantity` | decimal | Yes | Ingredient quantity |
| `uom` | string | Yes | Unit of measure |
| `percentage` | decimal | No | % of total |
| `notes` | text | No | Item notes |

### 3.4 Formulation Versioning

- **Major version**: Significant recipe change (v1.0 → v2.0)
- **Minor version**: Small adjustment (v1.0 → v1.1)
- **Lock on approval**: Approved formulation becomes immutable
- **Lineage tracking**: parent_formulation_id links versions
- **Overlap detection**: Database trigger prevents date overlap

### 3.5 Allergen Aggregation

System automatically aggregates allergens from all formulation items:
- Reads allergens from each ingredient product
- Displays combined allergen declaration
- Supports 14 EU major allergens / 9 US FDA allergens
- Cross-contamination warnings based on production line history

### 3.6 Formulation UI

#### Formulation List (per Project)
- Columns: Version, Status, Effective From, Effective To, Items count
- Actions: View, Edit (draft only), Clone, Compare

#### Create/Edit Formulation
- Version number (auto-increment or manual)
- Total quantity and UoM
- Add items with product search
- Calculate percentages
- Preview allergens

#### Formulation Detail View
- All formulation fields
- Items table with product details
- Allergen declaration
- Costing summary
- Lineage tree
- Actions: Edit, Approve, Lock, Clone, Export

#### Compare Versions
- Side-by-side diff view
- Highlight added/removed/changed items
- Show cost difference

---

## 4. Gate Checklists

### 4.1 Checklist Concept
Each gate has a checklist of items that must be completed before advancing to the next gate.

### 4.2 Checklist Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gate` | enum | Yes | G0, G1, G2, G3, G4 |
| `item_description` | string | Yes | What needs to be done |
| `is_required` | boolean | Yes | Must complete to advance |
| `is_completed` | boolean | Yes | Completion status |
| `completed_by` | FK | No | Who completed |
| `completed_at` | datetime | No | When completed |
| `notes` | text | No | Completion notes |
| `attachment_url` | string | No | Supporting document |

### 4.3 Default Checklists

#### G0: Idea
- Initial concept documented
- Target market identified
- Preliminary resource estimate

#### G1: Feasibility
- Technical feasibility confirmed
- Key ingredients identified
- Initial allergen assessment
- Rough cost estimate

#### G2: Business Case
- Business case documented
- Target cost approved
- Target margin confirmed
- Resource plan approved

#### G3: Development
- Formulation created and locked
- Trial batches executed
- Allergen declaration validated
- Sensory evaluation passed

#### G4: Testing
- Shelf-life testing complete
- HACCP plan approved
- Label proof approved
- Compliance documents uploaded
- Costing approved by Finance

### 4.4 Checklist UI
- Collapsible gate sections
- Progress indicator per gate
- Mark items complete with notes
- Upload attachments
- Validation warnings for required items

---

## 5. Costing

### 5.1 Costing Concept
Track target, estimated, and actual costs throughout development. Require Finance approval before handoff.

### 5.2 Costing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `npd_project_id` | FK | Yes | Parent project |
| `formulation_id` | FK | No | Related formulation |
| `target_cost` | decimal | Yes | Target cost (manual entry) |
| `estimated_cost` | decimal | No | Calculated from formulation |
| `actual_cost` | decimal | No | From pilot WO |
| `variance_pct` | decimal | No | (actual - target) / target × 100 |
| `status` | enum | Yes | draft, submitted, approved, rejected |
| `approved_by` | FK | No | Finance approver |
| `approved_at` | datetime | No | When approved |
| `notes` | text | No | Costing notes |

### 5.3 Cost Calculation

```
Estimated Cost = Σ(item.qty × item.unit_price)

Variance = (actual - target) / target × 100

Alerts:
- Warning: variance > 20%
- Blocker: variance > 50%
```

### 5.4 Costing UI

#### Costing Section (in Project Detail)
- Target cost input
- Estimated cost (auto-calculated)
- Actual cost (from pilot WO)
- Variance indicator (color-coded)
- Cost history chart (across versions)
- Approval status
- Actions: Edit Target, Submit for Approval

---

## 6. Risk Management

### 6.1 Risk Concept
Track project risks with likelihood, impact, and mitigation plans.

### 6.2 Risk Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `npd_project_id` | FK | Yes | Parent project |
| `risk_description` | text | Yes | Risk description |
| `likelihood` | enum | Yes | low, medium, high |
| `impact` | enum | Yes | low, medium, high |
| `risk_score` | integer | Yes | Calculated: likelihood × impact (1-9) |
| `mitigation_plan` | text | No | How to mitigate |
| `status` | enum | Yes | open, mitigated, accepted |
| `owner_id` | FK | No | Risk owner |

### 6.3 Risk Score Matrix

| Likelihood/Impact | Low (1) | Medium (2) | High (3) |
|-------------------|---------|------------|----------|
| High (3) | 3 | 6 | 9 |
| Medium (2) | 2 | 4 | 6 |
| Low (1) | 1 | 2 | 3 |

### 6.4 Risk UI
- Risk list sorted by score DESC
- Color-coded risk indicators
- Add/edit risk modal
- Status toggle

---

## 7. Compliance Documents

### 7.1 Document Concept
Store all compliance documentation required for handoff: HACCP plans, label proofs, allergen declarations, certificates.

### 7.2 Document Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `npd_project_id` | FK | Yes | Parent project |
| `file_type` | enum | Yes | formulation, trial, compliance, label, other |
| `file_name` | string | Yes | Original file name |
| `storage_path` | string | Yes | Supabase Storage path |
| `version` | string | No | Document version |
| `mime_type` | string | Yes | File type |
| `file_size` | integer | Yes | Size in bytes |
| `uploaded_by` | FK | Yes | Who uploaded |
| `uploaded_at` | datetime | Yes | When uploaded |

### 7.3 Required Documents for Handoff
- HACCP Plan (compliance)
- Label Proof (label)
- Allergen Declaration (compliance)
- Shelf-Life Report (trial)
- Sensory Evaluation (trial)

### 7.4 Document UI
- Upload with drag-and-drop
- Category filter
- Version history
- Download/preview
- Missing document warnings

---

## 8. Handoff Wizard

### 8.1 Handoff Concept
Transfer approved NPD project to Production by creating Product, BOM, and optionally Pilot WO.

### 8.2 Handoff Workflow

```
Step 1: Validation Checklist
├── Gate G4 approved? ✅
├── Formulation locked? ✅
├── Allergens mapped? ✅
├── Compliance docs complete? ✅
├── Costing approved? ✅
└── All checks must pass

Step 2: Product Decision
├── Create new product OR
└── Update existing product with new BOM version

Step 3: BOM Transfer
├── Copy formulation items to bom_items
├── Set BOM effective dates
├── Link to source formulation
└── Inherit allergens

Step 4: Pilot WO (Optional)
├── Create pilot Work Order
├── Small batch quantity
├── Pilot routing
├── Type = 'pilot'
└── Link to NPD project

Step 5: Confirm & Execute
├── Show summary
├── Execute transactionally
├── Log event
└── Update project status to 'launched'
```

### 8.3 Dual Mode

**Integrated Mode (Production active):**
- Full handoff: Product + BOM + Pilot WO
- Records in production tables

**NPD-Only Mode:**
- Export to PDF/Excel
- No production records
- For R&D consultancies

### 8.4 Handoff UI

#### Validation Screen
- Checklist with pass/fail icons
- Blocker explanations
- Fix issues before proceeding

#### Product Creation Screen
- Create new or link existing
- Product name, code
- Product type

#### BOM Transfer Screen
- Preview BOM items
- Set effective dates
- Confirm allergens

#### Pilot WO Screen (Optional)
- Batch quantity
- Routing selection
- Scheduled date

#### Summary Screen
- Review all actions
- Execute button
- Cancel button

---

## 9. Event Sourcing

### 9.1 Event Concept
Log all critical events for audit trail and retry capability.

### 9.2 Event Types

| Event Type | Description |
|------------|-------------|
| NPD.ProjectCreated | New project created |
| NPD.GateAdvanced | Gate transition |
| NPD.FormulationLocked | Formulation approved |
| NPD.CostingApproved | Finance approved costing |
| NPD.HandoffRequested | Handoff initiated |
| NPD.HandoffCompleted | Handoff successful |
| NPD.HandoffFailed | Handoff failed |

### 9.3 Event Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event_type` | string | Yes | Event type |
| `entity_type` | string | Yes | npd_project, npd_formulation, etc. |
| `entity_id` | integer | Yes | Entity ID |
| `payload` | jsonb | Yes | Event data |
| `status` | enum | Yes | pending, processing, completed, failed |
| `retry_count` | integer | Yes | Retry attempts |
| `error_message` | text | No | Failure reason |
| `created_at` | datetime | Yes | When created |
| `processed_at` | datetime | No | When processed |

### 9.4 Retry Mechanism
- Failed events retry up to 3 times
- Exponential backoff
- Admin can force replay

---

## 10. NPD Roles

| Role | Permissions |
|------|-------------|
| NPD Lead | Full access to all NPD features |
| R&D | View assigned projects, create/edit formulations |
| Regulatory | View projects, upload compliance docs |
| Finance | View/edit costing, approve standard cost |
| Production | View projects in handoff stage (read-only) |

---

## 11. Database Tables

```sql
-- NPD Projects
CREATE TABLE npd_projects (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    project_number VARCHAR(50) NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    description TEXT,
    portfolio_category VARCHAR(100),
    current_gate VARCHAR(20) NOT NULL DEFAULT 'G0',
    status VARCHAR(30) NOT NULL DEFAULT 'idea',
    priority VARCHAR(20) DEFAULT 'medium',
    owner_id UUID REFERENCES auth.users(id),
    target_launch_date DATE,
    actual_launch_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, project_number)
);

-- NPD Formulations
CREATE TABLE npd_formulations (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    npd_project_id INTEGER NOT NULL REFERENCES npd_projects(id),
    formulation_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    effective_from DATE,
    effective_to DATE,
    parent_formulation_id INTEGER REFERENCES npd_formulations(id),
    total_qty DECIMAL(15,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    notes TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(npd_project_id, formulation_number)
);

-- NPD Formulation Items
CREATE TABLE npd_formulation_items (
    id SERIAL PRIMARY KEY,
    formulation_id INTEGER NOT NULL REFERENCES npd_formulations(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(15,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    percentage DECIMAL(5,2),
    notes TEXT
);

-- NPD Costing
CREATE TABLE npd_costing (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    npd_project_id INTEGER NOT NULL REFERENCES npd_projects(id),
    formulation_id INTEGER REFERENCES npd_formulations(id),
    target_cost DECIMAL(15,4) NOT NULL,
    estimated_cost DECIMAL(15,4),
    actual_cost DECIMAL(15,4),
    variance_pct DECIMAL(5,2),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- NPD Risks
CREATE TABLE npd_risks (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    npd_project_id INTEGER NOT NULL REFERENCES npd_projects(id),
    risk_description TEXT NOT NULL,
    likelihood VARCHAR(20) NOT NULL,
    impact VARCHAR(20) NOT NULL,
    risk_score INTEGER NOT NULL,
    mitigation_plan TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- NPD Documents
CREATE TABLE npd_documents (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    npd_project_id INTEGER NOT NULL REFERENCES npd_projects(id),
    file_type VARCHAR(30) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    version VARCHAR(20),
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- NPD Events
CREATE TABLE npd_events (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- NPD Gate Checklists
CREATE TABLE npd_gate_checklists (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id),
    npd_project_id INTEGER NOT NULL REFERENCES npd_projects(id),
    gate VARCHAR(20) NOT NULL,
    item_description TEXT NOT NULL,
    is_required BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    completed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMP,
    notes TEXT,
    attachment_url VARCHAR(500)
);

-- NPD Settings
CREATE TABLE npd_settings (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES orgs(id) UNIQUE,
    enable_npd_module BOOLEAN DEFAULT false,
    npd_only_mode BOOLEAN DEFAULT false,
    require_costing_approval BOOLEAN DEFAULT true,
    cost_variance_warning_pct DECIMAL(5,2) DEFAULT 20,
    cost_variance_blocker_pct DECIMAL(5,2) DEFAULT 50,
    require_compliance_docs BOOLEAN DEFAULT true,
    enable_pilot_wo BOOLEAN DEFAULT true,
    default_pilot_routing INTEGER REFERENCES routings(id),
    enable_formulation_export BOOLEAN DEFAULT true,
    event_retention_days INTEGER DEFAULT 90,
    max_formulation_versions INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Modifications to existing tables
ALTER TABLE work_orders ADD COLUMN type VARCHAR(20) DEFAULT 'production';
ALTER TABLE work_orders ADD COLUMN npd_project_id INTEGER REFERENCES npd_projects(id);
ALTER TABLE products ADD COLUMN npd_project_id INTEGER REFERENCES npd_projects(id);
ALTER TABLE products ADD COLUMN source VARCHAR(30);
ALTER TABLE boms ADD COLUMN npd_formulation_id INTEGER REFERENCES npd_formulations(id);
ALTER TABLE boms ADD COLUMN source VARCHAR(30);
```

### Indexes

```sql
-- NPD Projects
CREATE INDEX idx_npd_projects_org_status ON npd_projects(org_id, status);
CREATE INDEX idx_npd_projects_gate ON npd_projects(current_gate);
CREATE INDEX idx_npd_projects_owner ON npd_projects(owner_id);

-- NPD Formulations
CREATE INDEX idx_npd_formulations_project ON npd_formulations(npd_project_id);
CREATE INDEX idx_npd_formulations_status ON npd_formulations(status);

-- NPD Events
CREATE INDEX idx_npd_events_status ON npd_events(org_id, status);
CREATE INDEX idx_npd_events_type ON npd_events(event_type);
```

---

## 12. API Endpoints

### NPD Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/projects` | List projects with filters |
| GET | `/api/npd/projects/:id` | Get project details |
| POST | `/api/npd/projects` | Create project |
| PUT | `/api/npd/projects/:id` | Update project |
| POST | `/api/npd/projects/:id/advance-gate` | Advance to next gate |
| DELETE | `/api/npd/projects/:id` | Archive project |

### Formulations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/projects/:id/formulations` | List formulations |
| GET | `/api/npd/formulations/:id` | Get formulation details |
| POST | `/api/npd/formulations` | Create formulation |
| PUT | `/api/npd/formulations/:id` | Update formulation |
| POST | `/api/npd/formulations/:id/approve` | Approve and lock |
| POST | `/api/npd/formulations/:id/clone` | Clone to new version |
| GET | `/api/npd/formulations/:id/allergens` | Get allergen declaration |
| GET | `/api/npd/formulations/compare` | Compare two versions |

### Gate Checklists

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/projects/:id/checklists` | Get all checklists |
| PUT | `/api/npd/checklists/:id` | Update checklist item |

### Costing

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/projects/:id/costing` | Get costing |
| PUT | `/api/npd/costing/:id` | Update costing |
| POST | `/api/npd/costing/:id/submit` | Submit for approval |
| POST | `/api/npd/costing/:id/approve` | Approve costing |

### Risks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/projects/:id/risks` | List risks |
| POST | `/api/npd/risks` | Create risk |
| PUT | `/api/npd/risks/:id` | Update risk |
| DELETE | `/api/npd/risks/:id` | Delete risk |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/projects/:id/documents` | List documents |
| POST | `/api/npd/documents` | Upload document |
| DELETE | `/api/npd/documents/:id` | Delete document |

### Handoff

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/projects/:id/handoff/validate` | Validate handoff |
| POST | `/api/npd/projects/:id/handoff` | Execute handoff |
| GET | `/api/npd/projects/:id/export` | Export to PDF/Excel |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/events` | List events (admin) |
| POST | `/api/npd/events/:id/retry` | Retry failed event |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/dashboard` | Get Kanban data |
| GET | `/api/npd/dashboard/timeline` | Get timeline view |

### NPD Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd-settings` | Get settings |
| PUT | `/api/npd-settings` | Update settings |

---

## 13. Functional Requirements

### Core Workflow (FR1-FR7)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-01 | System shall create NPD projects with auto-generated number | Must |
| NPD-FR-02 | System shall advance projects through Stage-Gate workflow | Must |
| NPD-FR-03 | System shall enforce gate entry criteria | Must |
| NPD-FR-04 | System shall display Kanban pipeline view | Must |
| NPD-FR-05 | System shall filter dashboard by category, priority, owner | Must |
| NPD-FR-06 | System shall display timeline view | Should |
| NPD-FR-07 | System shall export project list to CSV | Should |

### Formulation Management (FR8-FR16)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-08 | System shall create formulations with versioning | Must |
| NPD-FR-09 | System shall add formulation items with product search | Must |
| NPD-FR-10 | System shall auto-aggregate allergens | Must |
| NPD-FR-11 | System shall support effective dates | Must |
| NPD-FR-12 | System shall prevent overlapping versions | Must |
| NPD-FR-13 | System shall lock formulation on approval | Must |
| NPD-FR-14 | System shall track formulation lineage | Must |
| NPD-FR-15 | System shall compare formulation versions | Should |
| NPD-FR-16 | System shall clone formulations | Should |

### Gate Reviews (FR17-FR22)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-17 | System shall display gate checklists | Must |
| NPD-FR-18 | System shall mark checklist items complete | Must |
| NPD-FR-19 | System shall support gate approvals | Must |
| NPD-FR-20 | System shall block advancement for incomplete items | Must |
| NPD-FR-21 | System shall log approvals | Must |
| NPD-FR-22 | System shall show approval history | Should |

### Costing (FR23-FR29)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-23 | System shall enter target cost | Must |
| NPD-FR-24 | System shall calculate estimated cost | Must |
| NPD-FR-25 | System shall record actual cost from pilot WO | Must |
| NPD-FR-26 | System shall calculate cost variance | Must |
| NPD-FR-27 | System shall display variance alerts | Must |
| NPD-FR-28 | System shall show cost history | Should |
| NPD-FR-29 | Finance role shall approve costing | Must |

### Compliance (FR30-FR36)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-30 | System shall display allergen declaration | Must |
| NPD-FR-31 | System shall upload compliance documents | Must |
| NPD-FR-32 | System shall categorize documents by type | Must |
| NPD-FR-33 | System shall track document metadata | Must |
| NPD-FR-34 | System shall show document history | Should |
| NPD-FR-35 | System shall validate doc completeness for handoff | Must |
| NPD-FR-36 | System shall generate compliance checklist | Should |

### Handoff (FR37-FR47)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-37 | System shall initiate handoff wizard | Must |
| NPD-FR-38 | System shall validate handoff eligibility | Must |
| NPD-FR-39 | System shall display validation checklist | Must |
| NPD-FR-40 | User can choose create new or update existing product | Must |
| NPD-FR-41 | System shall transfer formulation to BOM | Must |
| NPD-FR-42 | System shall create pilot WO optionally | Should |
| NPD-FR-43 | System shall display handoff summary | Must |
| NPD-FR-44 | System shall execute handoff transactionally | Must |
| NPD-FR-45 | System shall log handoff event | Must |
| NPD-FR-46 | System shall update status to launched | Must |
| NPD-FR-47 | NPD-only mode shall export to PDF/Excel | Must |

### Risk Management (FR48-FR52)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-48 | System shall add risks with likelihood/impact | Must |
| NPD-FR-49 | System shall calculate risk score | Must |
| NPD-FR-50 | System shall enter mitigation plan | Should |
| NPD-FR-51 | System shall update risk status | Must |
| NPD-FR-52 | System shall sort risks by score | Must |

### Event Sourcing (FR53-FR56)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-53 | System shall log critical events | Must |
| NPD-FR-54 | System shall retry failed events | Must |
| NPD-FR-55 | Admin shall view event log | Must |
| NPD-FR-56 | Admin shall replay failed events | Should |

### Integration (FR57-FR62)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-57 | System shall support pilot WO type | Must |
| NPD-FR-58 | System shall track NPD origin on products | Must |
| NPD-FR-59 | System shall track formulation origin on BOM | Must |
| NPD-FR-60 | System shall support trial outputs | Should |
| NPD-FR-61 | System shall reuse allergens table | Must |
| NPD-FR-62 | System shall reuse approvals table | Must |

### Access Control (FR63-FR69)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-63 | NPD Lead shall create/edit/delete projects | Must |
| NPD-FR-64 | R&D shall view/edit assigned formulations | Must |
| NPD-FR-65 | Regulatory shall upload compliance docs | Must |
| NPD-FR-66 | Finance shall approve costing | Must |
| NPD-FR-67 | Production shall view handoff projects | Must |
| NPD-FR-68 | System shall enforce RLS on NPD tables | Must |
| NPD-FR-69 | System shall audit formulation access | Must |

### Notifications (FR70-FR74)

| ID | Requirement | Priority |
|----|-------------|----------|
| NPD-FR-70 | System shall notify on gate approval required | Should |
| NPD-FR-71 | System shall notify Finance for costing approval | Should |
| NPD-FR-72 | System shall alert on cost variance | Should |
| NPD-FR-73 | System shall alert on missing compliance docs | Should |
| NPD-FR-74 | System shall notify Production on handoff | Should |

---

## 14. Success Metrics

### Adoption (4-6 weeks post-launch)
- ≥3 pilot customers activate NPD Module
- ≥10 NPD projects created
- ≥5 handoffs executed successfully

### Workflow Completion
- ≥80% projects G0 → G1 within 2 weeks
- ≥60% projects G1 → G3 within 8 weeks
- ≥1 full cycle (G0 → Launch) within 12 weeks

### User Satisfaction
- ≥4.0/5.0 CSAT for handoff wizard
- ≥70% report time savings vs spreadsheets

### Revenue (12 months)
- $150K ARR from NPD add-on
- ≥5 R&D consultancies as NPD-only customers

---

## Status
- **Module Version**: 1.0
- **Last Updated**: 2025-11-19
- **Status**: Draft - Pending Review
- **Progress**: 0% (Clean Slate)
- **Module Type**: Premium Add-on (Phase 4)
