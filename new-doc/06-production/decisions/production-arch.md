# Production Module Architecture

## Overview

The Production Module handles shop floor execution of Work Orders from start to completion. It manages material consumption (LP-based), output registration with traceability, operations tracking, and production analytics including OEE monitoring.

**Module Purpose:**
- Work Order lifecycle execution (start, pause, resume, complete)
- Material consumption with LP tracking and reservations
- Output registration with lot/batch creation
- Operations tracking with time and yield capture
- Production Dashboard with real-time KPIs
- OEE tracking (Availability, Performance, Quality)
- Scanner workflows for shop floor operators

**Key Entities:**
- Work Order execution state
- Material Consumptions (LP-based)
- Production Outputs (new LPs created)
- Operation Logs
- OEE Records

---

## Database Schema

### Core Tables

#### material_consumptions
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
wo_id               UUID NOT NULL REFERENCES work_orders(id)
wo_material_id      UUID NOT NULL REFERENCES wo_materials(id)
lp_id               UUID NOT NULL REFERENCES license_plates(id)
quantity            DECIMAL(15,6) NOT NULL
uom                 TEXT NOT NULL
batch_number        TEXT
consumed_at         TIMESTAMPTZ DEFAULT now()
consumed_by         UUID REFERENCES users(id)
operation_id        UUID REFERENCES wo_operations(id)
notes               TEXT
reversed            BOOLEAN DEFAULT false
reversed_at         TIMESTAMPTZ
reversed_by         UUID REFERENCES users(id)
reversal_reason     TEXT
created_at          TIMESTAMPTZ DEFAULT now()
```

#### production_outputs
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
wo_id               UUID NOT NULL REFERENCES work_orders(id)
product_id          UUID NOT NULL REFERENCES products(id)
lp_id               UUID NOT NULL REFERENCES license_plates(id)  -- Created LP
quantity            DECIMAL(15,6) NOT NULL
uom                 TEXT NOT NULL
batch_number        TEXT NOT NULL
qa_status           TEXT DEFAULT 'pending'  -- pending, passed, failed, hold
location_id         UUID REFERENCES locations(id)
expiry_date         DATE
is_by_product       BOOLEAN DEFAULT false
registered_at       TIMESTAMPTZ DEFAULT now()
registered_by       UUID REFERENCES users(id)
notes               TEXT
created_at          TIMESTAMPTZ DEFAULT now()
```

#### operation_logs
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
wo_operation_id     UUID NOT NULL REFERENCES wo_operations(id)
event_type          TEXT NOT NULL           -- started, paused, resumed, completed
event_at            TIMESTAMPTZ DEFAULT now()
user_id             UUID REFERENCES users(id)
yield_percent       DECIMAL(5,2)            -- For completion event
notes               TEXT
```

#### material_reservations
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
wo_id               UUID NOT NULL REFERENCES work_orders(id)
wo_material_id      UUID NOT NULL REFERENCES wo_materials(id)
lp_id               UUID NOT NULL REFERENCES license_plates(id)
reserved_qty        DECIMAL(15,6) NOT NULL
consumed_qty        DECIMAL(15,6) DEFAULT 0
status              TEXT DEFAULT 'active'   -- active, consumed, released
reserved_at         TIMESTAMPTZ DEFAULT now()
reserved_by         UUID REFERENCES users(id)
released_at         TIMESTAMPTZ
released_by         UUID REFERENCES users(id)
release_reason      TEXT
created_at          TIMESTAMPTZ DEFAULT now()
```

#### over_consumption_approvals
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
wo_id               UUID NOT NULL REFERENCES work_orders(id)
wo_material_id      UUID NOT NULL REFERENCES wo_materials(id)
requested_qty       DECIMAL(15,6) NOT NULL
reason              TEXT NOT NULL
status              TEXT DEFAULT 'pending'  -- pending, approved, rejected
requested_by        UUID REFERENCES users(id)
requested_at        TIMESTAMPTZ DEFAULT now()
approved_by         UUID REFERENCES users(id)
approved_at         TIMESTAMPTZ
approval_notes      TEXT
```

### OEE Tables

#### oee_records
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
record_date         DATE NOT NULL
shift_id            UUID REFERENCES shifts(id)
production_line_id  UUID REFERENCES production_lines(id)
machine_id          UUID REFERENCES machines(id)
planned_production_time DECIMAL(10,2)       -- Minutes
operating_time      DECIMAL(10,2)           -- Minutes
ideal_cycle_time    DECIMAL(10,4)           -- Minutes per unit
actual_output       DECIMAL(15,4)
good_output         DECIMAL(15,4)
availability_percent DECIMAL(5,2)
performance_percent DECIMAL(5,2)
quality_percent     DECIMAL(5,2)
oee_percent         DECIMAL(5,2)            -- A x P x Q
created_at          TIMESTAMPTZ DEFAULT now()
calculated_at       TIMESTAMPTZ

UNIQUE(org_id, record_date, shift_id, production_line_id, machine_id)
```

#### downtime_records
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
production_line_id  UUID REFERENCES production_lines(id)
machine_id          UUID REFERENCES machines(id)
wo_id               UUID REFERENCES work_orders(id)
downtime_reason_id  UUID REFERENCES downtime_reasons(id)
start_time          TIMESTAMPTZ NOT NULL
end_time            TIMESTAMPTZ
duration_minutes    INTEGER                 -- Calculated
is_planned          BOOLEAN DEFAULT false
notes               TEXT
reported_by         UUID REFERENCES users(id)
created_at          TIMESTAMPTZ DEFAULT now()
```

#### downtime_reasons
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
code                TEXT NOT NULL
name                TEXT NOT NULL
category            TEXT NOT NULL           -- mechanical, electrical, material, other
is_planned          BOOLEAN DEFAULT false   -- changeover, cleaning, maintenance
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, code)
```

#### shifts
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id)
name                TEXT NOT NULL           -- Morning, Afternoon, Night
start_time          TIME NOT NULL
end_time            TIME NOT NULL
break_minutes       INTEGER DEFAULT 0
days_of_week        INTEGER[]               -- 0=Sun, 1=Mon, etc.
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ DEFAULT now()

UNIQUE(org_id, name)
```

### Settings Table

#### production_settings
```sql
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id              UUID NOT NULL REFERENCES organizations(id) UNIQUE

-- WO Execution
allow_pause_wo              BOOLEAN DEFAULT false
auto_complete_wo            BOOLEAN DEFAULT false
require_operation_sequence  BOOLEAN DEFAULT true
allow_over_consumption      BOOLEAN DEFAULT false
allow_partial_lp_consumption BOOLEAN DEFAULT true
require_qa_on_output        BOOLEAN DEFAULT true
auto_create_by_product_lp   BOOLEAN DEFAULT true
enable_material_reservations BOOLEAN DEFAULT true

-- Dashboard
dashboard_refresh_seconds   INTEGER DEFAULT 30
show_material_alerts        BOOLEAN DEFAULT true
show_delay_alerts           BOOLEAN DEFAULT true
show_quality_alerts         BOOLEAN DEFAULT true

-- OEE
enable_oee_tracking         BOOLEAN DEFAULT false
target_oee_percent          DECIMAL(5,2) DEFAULT 85
enable_downtime_tracking    BOOLEAN DEFAULT false

created_at          TIMESTAMPTZ DEFAULT now()
updated_at          TIMESTAMPTZ DEFAULT now()
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_consumptions_wo ON material_consumptions(wo_id);
CREATE INDEX idx_consumptions_lp ON material_consumptions(lp_id);
CREATE INDEX idx_consumptions_date ON material_consumptions(consumed_at);
CREATE INDEX idx_outputs_wo ON production_outputs(wo_id);
CREATE INDEX idx_outputs_lp ON production_outputs(lp_id);
CREATE INDEX idx_outputs_date ON production_outputs(registered_at);
CREATE INDEX idx_reservations_wo ON material_reservations(wo_id);
CREATE INDEX idx_reservations_lp ON material_reservations(lp_id);
CREATE INDEX idx_reservations_status ON material_reservations(status);
CREATE INDEX idx_oee_date_line ON oee_records(record_date, production_line_id);
CREATE INDEX idx_downtime_line_date ON downtime_records(production_line_id, start_time);
```

---

## API Design

### WO Execution Endpoints
```
POST   /api/production/work-orders/:id/start           -- Start WO
POST   /api/production/work-orders/:id/pause           -- Pause WO
POST   /api/production/work-orders/:id/resume          -- Resume WO
POST   /api/production/work-orders/:id/complete        -- Complete WO

GET    /api/production/work-orders/:id/materials       -- Material status
GET    /api/production/work-orders/:id/operations      -- Operation status
GET    /api/production/work-orders/:id/outputs         -- Output history
```

### Operation Endpoints
```
POST   /api/production/operations/:id/start            -- Start operation
POST   /api/production/operations/:id/complete         -- Complete with yield
```

### Consumption Endpoints
```
POST   /api/production/consumption                     -- Record consumption
POST   /api/production/consumption/:id/reverse         -- Reverse consumption (manager)
GET    /api/production/consumption/wo/:woId            -- Consumption history

POST   /api/production/over-consumption/request        -- Request approval
POST   /api/production/over-consumption/:id/approve    -- Approve request
POST   /api/production/over-consumption/:id/reject     -- Reject request
```

### Output Endpoints
```
POST   /api/production/output                          -- Register output (creates LP)
GET    /api/production/output/wo/:woId                 -- Output history
POST   /api/production/output/:id/label                -- Print LP label (ZPL)
```

### Reservation Endpoints
```
GET    /api/production/reservations/wo/:woId           -- List reservations
POST   /api/production/reservations/:id/release        -- Release reservation (manager)
```

### Dashboard Endpoints
```
GET    /api/production/dashboard                       -- KPIs and alerts
GET    /api/production/dashboard/active-wos            -- Active WOs table
GET    /api/production/dashboard/alerts                -- All alerts
```

### OEE Endpoints
```
GET    /api/production/oee/summary                     -- OEE dashboard
GET    /api/production/oee/by-line                     -- OEE by production line
GET    /api/production/oee/by-machine                  -- OEE by machine
GET    /api/production/oee/trend                       -- OEE trend over time
POST   /api/production/oee/calculate                   -- Trigger OEE calculation

GET    /api/production/downtime                        -- Downtime list
POST   /api/production/downtime                        -- Record downtime
PUT    /api/production/downtime/:id                    -- Update downtime
GET    /api/production/downtime/analysis               -- Downtime pareto
```

### Scanner Endpoints
```
POST   /api/scanner/consume                            -- Scanner consumption
POST   /api/scanner/output                             -- Scanner output
POST   /api/scanner/validate-lp/:barcode               -- Validate LP barcode
POST   /api/scanner/validate-wo/:barcode               -- Validate WO barcode
```

### Settings Endpoints
```
GET    /api/production/settings
PUT    /api/production/settings

GET    /api/production/downtime-reasons
POST   /api/production/downtime-reasons
PUT    /api/production/downtime-reasons/:id
DELETE /api/production/downtime-reasons/:id

GET    /api/production/shifts
POST   /api/production/shifts
PUT    /api/production/shifts/:id
DELETE /api/production/shifts/:id
```

---

## Component Architecture

### Key React Components

```
apps/frontend/app/(authenticated)/production/
├── page.tsx                    -- Production redirect
├── dashboard/
│   └── page.tsx               -- Production dashboard
│       └── components/
│           ├── KPICards.tsx
│           ├── ActiveWOsTable.tsx
│           ├── AlertsPanel.tsx
│           └── OEESummary.tsx
├── execution/
│   └── [woId]/page.tsx        -- WO execution screen
│       └── components/
│           ├── WOHeader.tsx
│           ├── MaterialsPanel.tsx
│           ├── OperationsTimeline.tsx
│           ├── OutputsTable.tsx
│           └── ActionButtons.tsx
├── consumption/
│   └── page.tsx               -- Desktop consumption screen
│       └── components/
│           ├── WOSelector.tsx
│           ├── MaterialsTable.tsx
│           ├── ConsumptionModal.tsx
│           ├── LPSearch.tsx
│           └── ConsumptionHistory.tsx
├── outputs/
│   └── page.tsx               -- Desktop output screen
│       └── components/
│           ├── WOSelector.tsx
│           ├── OutputForm.tsx
│           ├── ByProductPrompt.tsx
│           └── OutputHistory.tsx
├── oee/
│   └── page.tsx               -- OEE analytics
│       └── components/
│           ├── OEEGauges.tsx
│           ├── OEETrendChart.tsx
│           ├── DowntimePareto.tsx
│           └── LineComparison.tsx
└── settings/
    └── page.tsx               -- Production settings

apps/frontend/app/(authenticated)/scanner/
├── consume/
│   └── page.tsx               -- Mobile consumption
│       └── components/
│           ├── WOScanner.tsx
│           ├── LPScanner.tsx
│           ├── QtyInput.tsx
│           └── ConfirmScreen.tsx
└── output/
    └── page.tsx               -- Mobile output
        └── components/
            ├── WOScanner.tsx
            ├── QtyInput.tsx
            ├── QASelector.tsx
            └── PrintButton.tsx
```

### Service Dependencies

```
lib/services/
├── production-execution-service.ts   -- WO start/pause/resume/complete
├── consumption-service.ts            -- Material consumption + reversal
├── output-service.ts                 -- Output registration + LP creation
├── reservation-service.ts            -- Material reservations
├── oee-service.ts                    -- OEE calculation + downtime
├── production-dashboard-service.ts   -- Dashboard KPIs + alerts
└── production-settings-service.ts    -- Settings CRUD
```

---

## Data Flow

### WO Start Flow
```
+-------------+     +----------------+     +----------------+
|   User      | --> |   Execution    | --> |   work_orders  |
|   Start WO  |     |   Service      |     |   status='in_  |
|             |     |   /start       |     |   progress'    |
+-------------+     +----------------+     +----------------+
      |                    |
      |     If enable_material_reservations = true
      |                    |
      |                    v
      |             +----------------+     +----------------+
      |             |  Reservation   | --> |   material_    |
      |             |  Service       |     |   reservations |
      |             +----------------+     +----------------+
      |                    |
      |             For each wo_material:
      |             - Find available LPs (FIFO/FEFO)
      |             - Create reservation records
      |             - Update LP.status = 'reserved'
```

### Material Consumption Flow
```
+-------------+     +----------------+     +----------------+
|   Operator  | --> |  Consumption   | --> |   Validate     |
|   Scan LP   |     |   API          |     |   LP           |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |             Check: LP exists              |
      |                    LP.status = available  |
      |                    LP.product = material  |
      |                    LP.qty >= consume_qty  |
      |                    |                      |
      v                    v                      v
+-------------+     +----------------+     +----------------+
|             |     |   Consumption  | --> |   Update LP    |
|             |     |   Service      |     |   LP.qty -=    |
|             |     +----------------+     |   consume_qty  |
+-------------+           |               +----------------+
                          |                      |
                          v                      v
                   +----------------+     +----------------+
                   |   material_    |     |   lp_genealogy |
                   |   consumptions |     |   (parent_lp)  |
                   +----------------+     +----------------+
```

### Output Registration Flow
```
+-------------+     +----------------+     +----------------+
|   Operator  | --> |   Output API   | --> |   Create LP    |
|   Register  |     |   /output      |     |   (finished    |
|   Output    |     |                |     |   goods)       |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |             Create LP with:               |
      |             - product_id from WO          |
      |             - qty from output             |
      |             - batch_number from WO        |
      |             - expiry_date calculated      |
      |             - source = 'production'       |
      |                    |                      |
      v                    v                      v
+-------------+     +----------------+     +----------------+
|   Print LP  |     |   production_  |     |   lp_genealogy |
|   Label     |     |   outputs      |     |   (child_lp)   |
+-------------+     +----------------+     +----------------+
                          |
                          v
                   +----------------+
                   |   Update WO    |
                   |   produced_qty |
                   +----------------+
```

### OEE Calculation Flow
```
+-------------+     +----------------+     +----------------+
|   Cron Job  | --> |   OEE Service  | --> |   work_orders  |
|   (hourly)  |     |   /calculate   |     |   (completed)  |
+-------------+     +----------------+     +----------------+
      |                    |                      |
      |             Availability = operating_time / planned_time
      |             Performance = (units * cycle_time) / operating_time
      |             Quality = good_units / total_units
      |             OEE = A x P x Q
      |                    |                      |
      v                    v                      v
+-------------+     +----------------+     +----------------+
|             |     |   oee_records  |     |   downtime_    |
|             |     |   (insert)     |     |   records      |
+-------------+     +----------------+     +----------------+
```

---

## Security

### RLS Policies

```sql
-- Consumptions: org_id filter
CREATE POLICY "Consumptions org isolation"
ON material_consumptions FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Outputs: org_id filter
CREATE POLICY "Outputs org isolation"
ON production_outputs FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Reservations: org_id filter
CREATE POLICY "Reservations org isolation"
ON material_reservations FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- OEE: org_id filter
CREATE POLICY "OEE org isolation"
ON oee_records FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Role Requirements

| Endpoint | Required Role |
|----------|---------------|
| /work-orders/:id/start | Operator, Production Manager |
| /work-orders/:id/pause | Production Manager (if allowed) |
| /work-orders/:id/complete | Operator, Production Manager |
| POST /consumption | Operator, Production Manager |
| POST /consumption/:id/reverse | Manager, Admin |
| POST /output | Operator, Production Manager |
| /over-consumption/:id/approve | Manager, Admin |
| /reservations/:id/release | Manager, Admin |
| /settings | Admin |

---

## Performance Considerations

### Expected Data Volumes

| Entity | Typical Count | Max Count |
|--------|--------------|-----------|
| Consumptions per day | 200-1,000 | 10,000 |
| Outputs per day | 100-500 | 5,000 |
| Reservations (active) | 100-500 | 5,000 |
| OEE records per day | 20-100 | 1,000 |
| Downtime records per day | 10-50 | 500 |

### Query Optimization

1. **Dashboard KPIs:**
   - Aggregate queries with date filter (today)
   - Index on (org_id, status, completed_at)
   - Cache KPIs (30 sec TTL)

2. **Active WOs Table:**
   - Filter: status = 'in_progress'
   - Index on (org_id, status)
   - Paginate with limit 20

3. **Consumption History:**
   - Index on (wo_id, consumed_at)
   - Filter by WO
   - Paginate with limit 50

4. **OEE Calculation:**
   - Batch process by shift/line
   - Run hourly or on-demand
   - Store aggregated results

### Caching Strategy

```typescript
// Redis keys
'org:{orgId}:production:dashboard'           // 30 sec TTL
'org:{orgId}:production:active-wos'          // 30 sec TTL
'org:{orgId}:wo:{woId}:materials'            // 30 sec TTL
'org:{orgId}:wo:{woId}:consumptions'         // 30 sec TTL
'org:{orgId}:oee:summary:{date}'             // 5 min TTL
```

---

## Integration Points

### Module Dependencies

```
Production Module
    |
    +---> Settings (lines, machines, users)
    +---> Technical (products for output)
    +---> Planning (work orders - status updates)
    +---> Warehouse (LP consumption, LP creation)
    +---> Quality (QA status on output)
```

### Event Publishing

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `wo.started` | WO started | Dashboard refresh |
| `wo.paused` | WO paused | Downtime tracking |
| `wo.completed` | WO completed | OEE calculation |
| `consumption.recorded` | Material consumed | Genealogy, LP update |
| `consumption.reversed` | Consumption reversed | LP update |
| `output.registered` | Output registered | Genealogy, LP creation |
| `downtime.started` | Downtime started | OEE calculation |
| `downtime.ended` | Downtime ended | OEE calculation |

### Data Dependencies

| Upstream | Data Required |
|----------|---------------|
| Planning | Work Orders with materials and operations |
| Warehouse | License Plates (inventory) |
| Technical | Products, BOMs (for output) |

| Downstream | Data Provided |
|------------|---------------|
| Warehouse | Updated LP quantities, new output LPs |
| Technical | Traceability links (genealogy) |
| Quality | QA status on outputs |

---

## Business Rules

### WO Execution
- WO must be 'released' status to start
- Only one active operation at a time (if sequence enforced)
- WO cannot complete without at least one output
- Pause/Resume requires setting enabled
- Auto-complete triggers when output >= planned (if enabled)

### Material Consumption
- LP must be 'available' status
- LP product must match material product
- LP UoM must match material UoM
- consume_whole_lp flag enforces 1:1 consumption
- Over-consumption requires approval (if not allowed)
- Manager can reverse consumption with reason

### Output Registration
- Creates new LP with 'production' source
- Batch number defaults from WO number
- Expiry date calculated from shelf_life_days
- QA status required (if setting enabled)
- By-products prompted after main output
- Genealogy updated: consumed LPs -> output LP

### Reservations
- Created on WO start (if enabled)
- FIFO/FEFO priority for LP selection
- Released on WO complete/cancel
- Consumed qty tracked against consumption
- Manager can release unused reservations

### OEE Calculation
- Availability = Operating Time / Planned Time
- Performance = (Actual Output x Ideal Cycle) / Operating Time
- Quality = Good Output / Total Output
- OEE = Availability x Performance x Quality
- Target OEE configurable (default 85%)

---

## Scanner UI Requirements

### Touch Targets
- Minimum 48x48 pixels for all interactive elements
- Large number pad for quantity input
- Clear visual feedback (green/red indicators)

### Audio Feedback
- Success tone on valid scan
- Error beep on invalid scan
- Confirmation sound on submission

### Offline Support (Phase 2)
- Queue consumptions locally
- Sync when connection restored
- Maximum 100 offline transactions

### Label Printing
- ZPL format for Zebra printers
- Auto-print on output registration
- Include: LP barcode, product, qty, batch, expiry

---

## Testing Requirements

### Unit Tests (80%+ coverage)
- Execution service: start/pause/resume/complete
- Consumption service: validation, recording, reversal
- Output service: LP creation, genealogy update
- OEE service: calculation formulas

### Integration Tests
- API endpoint coverage (80%+)
- RLS policy enforcement
- Consumption validation rules
- WO state transitions

### E2E Tests
- WO start -> consume materials -> register output -> complete
- Scanner consumption workflow
- Scanner output workflow
- Over-consumption approval flow
- OEE dashboard display
