# NPD (New Product Development) Module Architecture

## Version
- **Date**: 2025-12-10
- **Status**: Planned (Premium Module)
- **Epic**: 8

---

## Overview

The NPD Module provides structured product innovation processes for food manufacturers. It implements Stage-Gate methodology with full traceability, formulation management, and handoff to production. This is a premium add-on module available in Growth/Enterprise tiers.

### Core Capabilities
- Stage-Gate workflow (G0-G4 + Launch)
- Formulation versioning with lineage tracking
- Allergen aggregation from ingredients
- Costing and finance approval workflow
- Risk management with likelihood/impact matrix
- Compliance document management
- Handoff wizard to Production (Product + BOM + Pilot WO)

### Module Dependencies
```
Settings Module
     |
     v
Technical Module  <---- NPD Module ----> Planning Module
(Products, BOMs)        |                (Pilot WOs)
                        |
                        v
                Warehouse Module
                (Trial Materials)
```

---

## Database Schema

### Core Tables

```sql
-- NPD Projects: Container for all innovation activities
npd_projects
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  project_number        VARCHAR(50) NOT NULL UNIQUE
  project_name          VARCHAR(200) NOT NULL
  description           TEXT
  portfolio_category    VARCHAR(100)
  current_gate          VARCHAR(20) DEFAULT 'G0'  -- G0, G1, G2, G3, G4, Launched
  status                VARCHAR(30) DEFAULT 'idea'
  priority              VARCHAR(20) DEFAULT 'medium'
  owner_id              UUID REFERENCES users(id)
  target_launch_date    DATE
  actual_launch_date    DATE
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
  created_by            UUID REFERENCES users(id)

-- NPD Formulations: Recipe versions during development
npd_formulations
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  npd_project_id        INTEGER NOT NULL REFERENCES npd_projects(id)
  formulation_number    VARCHAR(20) NOT NULL  -- v1.0, v1.1, v2.0
  status                VARCHAR(20) DEFAULT 'draft'  -- draft, approved, locked
  effective_from        DATE
  effective_to          DATE
  parent_formulation_id INTEGER REFERENCES npd_formulations(id)
  total_qty             DECIMAL(15,4) NOT NULL
  uom                   VARCHAR(20) NOT NULL
  notes                 TEXT
  approved_by           UUID REFERENCES users(id)
  approved_at           TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
  UNIQUE(npd_project_id, formulation_number)

-- NPD Formulation Items: Ingredients in formulation
npd_formulation_items
  id                    SERIAL PRIMARY KEY
  formulation_id        INTEGER NOT NULL REFERENCES npd_formulations(id)
  product_id            INTEGER NOT NULL REFERENCES products(id)
  quantity              DECIMAL(15,4) NOT NULL
  uom                   VARCHAR(20) NOT NULL
  percentage            DECIMAL(5,2)
  notes                 TEXT

-- NPD Costing: Target vs actual cost tracking
npd_costing
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  npd_project_id        INTEGER NOT NULL REFERENCES npd_projects(id)
  formulation_id        INTEGER REFERENCES npd_formulations(id)
  target_cost           DECIMAL(15,4) NOT NULL
  estimated_cost        DECIMAL(15,4)
  actual_cost           DECIMAL(15,4)
  variance_pct          DECIMAL(5,2)
  status                VARCHAR(20) DEFAULT 'draft'  -- draft, submitted, approved, rejected
  approved_by           UUID REFERENCES users(id)
  approved_at           TIMESTAMP
  notes                 TEXT
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- NPD Risks: Project risk tracking
npd_risks
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  npd_project_id        INTEGER NOT NULL REFERENCES npd_projects(id)
  risk_description      TEXT NOT NULL
  likelihood            VARCHAR(20) NOT NULL  -- low, medium, high
  impact                VARCHAR(20) NOT NULL  -- low, medium, high
  risk_score            INTEGER NOT NULL      -- Calculated: 1-9
  mitigation_plan       TEXT
  status                VARCHAR(20) DEFAULT 'open'  -- open, mitigated, accepted
  owner_id              UUID REFERENCES users(id)
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- NPD Documents: Compliance documentation
npd_documents
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  npd_project_id        INTEGER NOT NULL REFERENCES npd_projects(id)
  file_type             VARCHAR(30) NOT NULL  -- formulation, trial, compliance, label, other
  file_name             VARCHAR(255) NOT NULL
  storage_path          VARCHAR(500) NOT NULL
  version               VARCHAR(20)
  mime_type             VARCHAR(100) NOT NULL
  file_size             INTEGER NOT NULL
  uploaded_by           UUID REFERENCES users(id)
  uploaded_at           TIMESTAMP DEFAULT NOW()

-- NPD Gate Checklists: Gate entry criteria
npd_gate_checklists
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  npd_project_id        INTEGER NOT NULL REFERENCES npd_projects(id)
  gate                  VARCHAR(20) NOT NULL  -- G0, G1, G2, G3, G4
  item_description      TEXT NOT NULL
  is_required           BOOLEAN DEFAULT true
  is_completed          BOOLEAN DEFAULT false
  completed_by          UUID REFERENCES users(id)
  completed_at          TIMESTAMP
  notes                 TEXT
  attachment_url        VARCHAR(500)

-- NPD Events: Event sourcing for audit trail
npd_events
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  event_type            VARCHAR(50) NOT NULL
  entity_type           VARCHAR(50) NOT NULL
  entity_id             INTEGER NOT NULL
  payload               JSONB NOT NULL
  status                VARCHAR(20) DEFAULT 'pending'  -- pending, processing, completed, failed
  retry_count           INTEGER DEFAULT 0
  error_message         TEXT
  created_at            TIMESTAMP DEFAULT NOW()
  processed_at          TIMESTAMP

-- NPD Settings: Per-organization configuration
npd_settings
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id) UNIQUE
  enable_npd_module     BOOLEAN DEFAULT false
  npd_only_mode         BOOLEAN DEFAULT false
  require_costing_approval BOOLEAN DEFAULT true
  cost_variance_warning_pct DECIMAL(5,2) DEFAULT 20
  cost_variance_blocker_pct DECIMAL(5,2) DEFAULT 50
  require_compliance_docs BOOLEAN DEFAULT true
  enable_pilot_wo       BOOLEAN DEFAULT true
  default_pilot_routing INTEGER REFERENCES routings(id)
  enable_formulation_export BOOLEAN DEFAULT true
  event_retention_days  INTEGER DEFAULT 90
  max_formulation_versions INTEGER DEFAULT 10
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
```

### Schema Modifications (Existing Tables)

```sql
-- Add NPD reference to work_orders
ALTER TABLE work_orders ADD COLUMN type VARCHAR(20) DEFAULT 'production';
ALTER TABLE work_orders ADD COLUMN npd_project_id INTEGER REFERENCES npd_projects(id);

-- Add NPD reference to products
ALTER TABLE products ADD COLUMN npd_project_id INTEGER REFERENCES npd_projects(id);
ALTER TABLE products ADD COLUMN source VARCHAR(30);

-- Add formulation reference to BOMs
ALTER TABLE boms ADD COLUMN npd_formulation_id INTEGER REFERENCES npd_formulations(id);
ALTER TABLE boms ADD COLUMN source VARCHAR(30);
```

### Indexes

```sql
CREATE INDEX idx_npd_projects_org_status ON npd_projects(org_id, status);
CREATE INDEX idx_npd_projects_gate ON npd_projects(current_gate);
CREATE INDEX idx_npd_projects_owner ON npd_projects(owner_id);
CREATE INDEX idx_npd_formulations_project ON npd_formulations(npd_project_id);
CREATE INDEX idx_npd_formulations_status ON npd_formulations(status);
CREATE INDEX idx_npd_events_status ON npd_events(org_id, status);
CREATE INDEX idx_npd_events_type ON npd_events(event_type);
```

---

## API Design

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

### Handoff

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/projects/:id/handoff/validate` | Validate handoff eligibility |
| POST | `/api/npd/projects/:id/handoff` | Execute handoff |
| GET | `/api/npd/projects/:id/export` | Export to PDF/Excel |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/npd/dashboard` | Get Kanban data |
| GET | `/api/npd/dashboard/timeline` | Get timeline view |

---

## Data Flow

### Stage-Gate Workflow

```
G0: Idea                G1: Feasibility           G2: Business Case
+---------------+       +---------------+         +---------------+
| Initial       |       | Technical     |         | Financial     |
| concept       | ----> | feasibility   | -----> | analysis      |
| description   |       | assessment    |         | Target cost   |
+---------------+       +---------------+         +---------------+
       |                       |                         |
       v                       v                         v
  Checklist:              Checklist:                Checklist:
  - Concept doc           - Tech feasibility        - Business case
  - Target market         - Key ingredients         - Target margin
  - Resource est          - Allergen assess         - Resource plan
                          - Rough cost est

                    G3: Development           G4: Testing
                    +---------------+         +---------------+
                    | Formulation   |         | Shelf-life    |
                    | development   | -----> | Sensory eval  |
                    | Trial batches |         | Compliance    |
                    +---------------+         +---------------+
                           |                         |
                           v                         v
                      Checklist:                Checklist:
                      - Formulation locked      - Shelf-life complete
                      - Trials complete         - HACCP approved
                      - Allergen validated      - Label proof
                      - Sensory passed          - Costing approved

                                               LAUNCH
                                         +---------------+
                                         | Handoff to    |
                                         | Production    |
                                         | Product + BOM |
                                         +---------------+
```

### Handoff Workflow

```
1. Validation Check
   |
   +-- Gate G4 approved?
   +-- Formulation locked?
   +-- Allergens mapped?
   +-- Compliance docs complete?
   +-- Costing approved?
   |
   v (All must pass)
2. Product Decision
   |
   +-- Create NEW product, OR
   +-- Update EXISTING product
   |
   v
3. BOM Transfer
   |
   +-- Copy formulation items -> bom_items
   +-- Set BOM effective dates
   +-- Link source formulation
   +-- Inherit allergens
   |
   v
4. Pilot WO (Optional)
   |
   +-- Create pilot Work Order
   +-- Small batch quantity
   +-- Pilot routing
   +-- Type = 'pilot'
   |
   v
5. Execute Transactionally
   |
   +-- Wrap in DB transaction
   +-- Log NPD.HandoffCompleted event
   +-- Update project status = 'launched'
```

### Allergen Aggregation Flow

```
Formulation Items                    Allergen Declaration
+-------------------+               +-------------------+
| Item 1: Flour     |               | Contains:         |
|   - Wheat         | ----+         |   - Wheat         |
|   - Gluten        |     |         |   - Gluten        |
+-------------------+     |         |   - Milk          |
                          |         |   - Eggs          |
+-------------------+     |         +-------------------+
| Item 2: Milk Pwd  |     +------>  |
|   - Milk          |               | May Contain:      |
+-------------------+               |   - Nuts (line)   |
                                    +-------------------+
+-------------------+
| Item 3: Egg Pwd   |
|   - Eggs          |
+-------------------+

Logic:
1. For each formulation item, get product allergens
2. Aggregate unique allergens
3. Check production line history for cross-contamination
4. Generate declaration with 14 EU / 9 US allergens
```

---

## Security

### Row-Level Security (RLS)

```sql
-- All NPD tables use org_id for tenant isolation
CREATE POLICY "Tenant isolation" ON npd_projects
  USING (org_id = auth.jwt() ->> 'org_id');

-- Repeat for all npd_* tables
```

### Role Permissions

| Role | Projects | Formulations | Costing | Handoff |
|------|----------|--------------|---------|---------|
| NPD Lead | Full CRUD | Full CRUD | View/Edit | Execute |
| R&D | View assigned | Edit assigned | View | - |
| Regulatory | View | View | - | - |
| Finance | View | View | Approve | - |
| Production | View (handoff) | View (handoff) | - | - |

### IP Protection

```sql
-- Log all formulation access for IP protection
CREATE TRIGGER log_formulation_access
  AFTER SELECT ON npd_formulations
  FOR EACH ROW
  EXECUTE FUNCTION log_sensitive_access();
```

---

## Event Sourcing

### Event Types

| Event | Trigger | Payload |
|-------|---------|---------|
| NPD.ProjectCreated | New project | project_id, project_number |
| NPD.GateAdvanced | Gate transition | project_id, from_gate, to_gate |
| NPD.FormulationLocked | Approval | formulation_id, approved_by |
| NPD.CostingApproved | Finance approval | costing_id, approved_by |
| NPD.HandoffRequested | Wizard started | project_id |
| NPD.HandoffCompleted | Successful handoff | project_id, product_id, bom_id |
| NPD.HandoffFailed | Failed handoff | project_id, error_message |

### Retry Mechanism

```
Failed Event -> Retry Queue
     |
     +-- Retry 1 (5s delay)
     +-- Retry 2 (30s delay)
     +-- Retry 3 (5m delay)
     |
     +-- Max retries reached -> Dead Letter Queue
```

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| NPD Dashboard load | <500ms (p95) for 50 projects |
| Formulation detail page | <300ms (p95) including allergen aggregation |
| Handoff validation | <2 seconds |
| Handoff execution | <5 seconds (Product + BOM + WO) |
| CSV export | <3 seconds for 200 projects |
| Document upload | Up to 50MB with progress indicator |

---

## References

- PRD: `docs/1-BASELINE/product/modules/npd.md`
- Technical Module: `docs/1-BASELINE/architecture/modules/technical.md`
- Planning Module: `docs/1-BASELINE/architecture/modules/planning.md`
