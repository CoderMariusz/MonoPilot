# OEE & Performance Module Architecture

## Version
- **Date**: 2025-12-10
- **Status**: Planned (Premium Module)
- **Epic**: 10

---

## Overview

The OEE (Overall Equipment Effectiveness) Module provides real-time manufacturing performance monitoring, machine utilization tracking, downtime management, and energy efficiency analytics. It enables data-driven continuous improvement for food manufacturing operations.

### Core Capabilities
- Real-time OEE calculation (Availability x Performance x Quality)
- Machine utilization and downtime tracking
- Downtime reason code categorization
- Performance vs target cycle time analysis
- Quality metrics (yield, scrap, rework)
- Energy consumption monitoring
- Automated shift reports
- Historical trend analysis
- Threshold-based alerting

### Module Dependencies
```
Settings Module
(Machines, Lines, Shifts)
      |
      v
Production Module -----> OEE Module -----> Shift Reports
(Work Orders,                |             Energy Reports
 Operations,                 |             Trend Analysis
 Output)                     |
      |                      v
      |              Quality Module
      +------------> (QA Holds, NCRs)
```

---

## Database Schema

### OEE Tracking Tables

```sql
-- OEE Snapshots: Point-in-time OEE calculations
oee_snapshots
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  machine_id            INTEGER NOT NULL REFERENCES machines(id)
  line_id               INTEGER REFERENCES production_lines(id)
  shift_id              INTEGER REFERENCES shifts(id)
  work_order_id         INTEGER REFERENCES work_orders(id)
  snapshot_time         TIMESTAMP NOT NULL
  availability_pct      DECIMAL(5,2)
  performance_pct       DECIMAL(5,2)
  quality_pct           DECIMAL(5,2)
  oee_pct               DECIMAL(5,2)
  planned_production_time DECIMAL(10,2)  -- minutes
  actual_production_time  DECIMAL(10,2)  -- minutes
  ideal_cycle_time      DECIMAL(10,4)    -- minutes per unit
  total_pieces          INTEGER
  good_pieces           INTEGER
  rejected_pieces       INTEGER
  created_at            TIMESTAMP DEFAULT NOW()

-- Downtime Events: Machine stoppage tracking
oee_downtime_events
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  machine_id            INTEGER NOT NULL REFERENCES machines(id)
  line_id               INTEGER REFERENCES production_lines(id)
  work_order_id         INTEGER REFERENCES work_orders(id)
  downtime_type         VARCHAR(30) NOT NULL  -- planned, unplanned
  reason_code_id        INTEGER NOT NULL REFERENCES oee_downtime_reasons(id)
  start_time            TIMESTAMP NOT NULL
  end_time              TIMESTAMP
  duration_minutes      DECIMAL(10,2)
  logged_by             UUID REFERENCES users(id)
  notes                 TEXT
  is_planned            BOOLEAN DEFAULT false
  impact_severity       VARCHAR(20)  -- low, medium, high
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Downtime Reason Codes: Categorization
oee_downtime_reasons
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  code                  VARCHAR(50) NOT NULL
  category              VARCHAR(50) NOT NULL
    -- breakdown, changeover, cleaning, material, quality, utility, operator, other
  description           TEXT
  is_planned            BOOLEAN DEFAULT false
  is_active             BOOLEAN DEFAULT true
  color_code            VARCHAR(7)  -- Hex color for UI
  sort_order            INTEGER DEFAULT 0
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Performance Logs: Cycle time tracking
oee_performance_logs
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  machine_id            INTEGER NOT NULL REFERENCES machines(id)
  work_order_id         INTEGER REFERENCES work_orders(id)
  operation_id          INTEGER REFERENCES wo_operations(id)
  timestamp             TIMESTAMP NOT NULL
  actual_cycle_time     DECIMAL(10,4)   -- minutes per unit
  target_cycle_time     DECIMAL(10,4)   -- minutes per unit
  units_produced        INTEGER
  efficiency_pct        DECIMAL(5,2)
  speed_loss_pct        DECIMAL(5,2)
  created_at            TIMESTAMP DEFAULT NOW()

-- Quality Events: Scrap and defect tracking
oee_quality_events
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  work_order_id         INTEGER NOT NULL REFERENCES work_orders(id)
  operation_id          INTEGER REFERENCES wo_operations(id)
  event_type            VARCHAR(30) NOT NULL  -- scrap, rework, reject
  timestamp             TIMESTAMP NOT NULL
  quantity              INTEGER NOT NULL
  reason_code_id        INTEGER REFERENCES quality_reason_codes(id)
  defect_type           VARCHAR(100)
  logged_by             UUID REFERENCES users(id)
  notes                 TEXT
  created_at            TIMESTAMP DEFAULT NOW()
```

### Energy Tracking Tables

```sql
-- Energy Readings: Consumption data
energy_readings
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  machine_id            INTEGER REFERENCES machines(id)
  line_id               INTEGER REFERENCES production_lines(id)
  reading_time          TIMESTAMP NOT NULL
  kwh_consumed          DECIMAL(15,4) NOT NULL
  meter_reading         DECIMAL(15,4)
  work_order_id         INTEGER REFERENCES work_orders(id)
  batch_id              INTEGER
  reading_type          VARCHAR(30)  -- manual, automatic
  source                VARCHAR(50)  -- meter_name or API
  created_at            TIMESTAMP DEFAULT NOW()

-- Energy Baselines: Expected consumption targets
energy_baselines
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  machine_id            INTEGER REFERENCES machines(id)
  product_id            INTEGER REFERENCES products(id)
  baseline_kwh_per_unit DECIMAL(10,4)
  baseline_kwh_per_hour DECIMAL(10,4)
  effective_date        DATE NOT NULL
  notes                 TEXT
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Energy Costs: Rate configuration
energy_costs
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  rate_per_kwh          DECIMAL(10,4) NOT NULL
  effective_date        DATE NOT NULL
  time_of_day_rate      JSONB  -- {"peak": 0.15, "off_peak": 0.08}
  rate_type             VARCHAR(30)  -- flat, time_of_use
  currency_id           INTEGER REFERENCES currencies(id)
  created_at            TIMESTAMP DEFAULT NOW()
```

### Shift & Performance Tables

```sql
-- Shift Reports: Automated shift summaries
shift_reports
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  shift_id              INTEGER NOT NULL REFERENCES shifts(id)
  line_id               INTEGER REFERENCES production_lines(id)
  report_date           DATE NOT NULL
  start_time            TIMESTAMP
  end_time              TIMESTAMP
  supervisor_id         UUID REFERENCES users(id)
  oee_avg               DECIMAL(5,2)
  availability_avg      DECIMAL(5,2)
  performance_avg       DECIMAL(5,2)
  quality_avg           DECIMAL(5,2)
  total_downtime        DECIMAL(10,2)  -- minutes
  total_output          INTEGER
  good_output           INTEGER
  scrap_count           INTEGER
  status                VARCHAR(20) DEFAULT 'draft'  -- draft, approved
  notes                 TEXT
  generated_at          TIMESTAMP DEFAULT NOW()
  approved_by           UUID REFERENCES users(id)
  approved_at           TIMESTAMP
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Shift Handover Notes: Communication between shifts
shift_handover_notes
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  shift_report_id       INTEGER REFERENCES shift_reports(id)
  from_shift_id         INTEGER NOT NULL REFERENCES shifts(id)
  to_shift_id           INTEGER NOT NULL REFERENCES shifts(id)
  note_type             VARCHAR(30)  -- issue, action_required, information
  message               TEXT NOT NULL
  priority              VARCHAR(20) DEFAULT 'normal'  -- low, normal, high, urgent
  created_by            UUID REFERENCES users(id)
  created_at            TIMESTAMP DEFAULT NOW()
  acknowledged_by       UUID REFERENCES users(id)
  acknowledged_at       TIMESTAMP

-- Performance Targets: OEE goals
performance_targets
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  target_type           VARCHAR(30) NOT NULL  -- machine, line, product
  reference_id          INTEGER NOT NULL
  oee_target            DECIMAL(5,2) DEFAULT 85
  availability_target   DECIMAL(5,2) DEFAULT 90
  performance_target    DECIMAL(5,2) DEFAULT 95
  quality_target        DECIMAL(5,2) DEFAULT 99
  effective_date        DATE NOT NULL
  expiry_date           DATE
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()

-- Performance Alerts: Threshold-based notifications
performance_alerts
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  alert_type            VARCHAR(50) NOT NULL
    -- oee_below_target, availability_low, performance_drop,
    -- quality_issue, extended_downtime, energy_spike
  severity              VARCHAR(20) NOT NULL  -- warning, critical
  metric_name           VARCHAR(50)
  threshold_value       DECIMAL(10,4)
  actual_value          DECIMAL(10,4)
  reference_type        VARCHAR(30)  -- machine, line, work_order
  reference_id          INTEGER
  triggered_at          TIMESTAMP DEFAULT NOW()
  acknowledged_by       UUID REFERENCES users(id)
  acknowledged_at       TIMESTAMP
  resolved_at           TIMESTAMP
  notification_sent     BOOLEAN DEFAULT false
  created_at            TIMESTAMP DEFAULT NOW()
  updated_at            TIMESTAMP DEFAULT NOW()
```

### Analytics Tables

```sql
-- Daily Summary: Pre-aggregated daily metrics
oee_daily_summary
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  summary_date          DATE NOT NULL
  machine_id            INTEGER REFERENCES machines(id)
  line_id               INTEGER REFERENCES production_lines(id)
  shift_id              INTEGER REFERENCES shifts(id)
  total_planned_time    DECIMAL(10,2)
  total_downtime        DECIMAL(10,2)
  total_production_time DECIMAL(10,2)
  oee_avg               DECIMAL(5,2)
  availability_avg      DECIMAL(5,2)
  performance_avg       DECIMAL(5,2)
  quality_avg           DECIMAL(5,2)
  total_output          INTEGER
  good_output           INTEGER
  scrap_output          INTEGER
  created_at            TIMESTAMP DEFAULT NOW()

-- Hourly Summary: For real-time trending
oee_hourly_summary
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  hour_start            TIMESTAMP NOT NULL
  machine_id            INTEGER REFERENCES machines(id)
  line_id               INTEGER REFERENCES production_lines(id)
  oee_avg               DECIMAL(5,2)
  units_produced        INTEGER
  good_units            INTEGER
  downtime_minutes      DECIMAL(10,2)
  created_at            TIMESTAMP DEFAULT NOW()

-- Machine Utilization: Utilization tracking
machine_utilization
  id                    SERIAL PRIMARY KEY
  org_id                UUID NOT NULL REFERENCES organizations(id)
  machine_id            INTEGER NOT NULL REFERENCES machines(id)
  period_start          TIMESTAMP NOT NULL
  period_end            TIMESTAMP NOT NULL
  scheduled_hours       DECIMAL(10,2)
  running_hours         DECIMAL(10,2)
  idle_hours            DECIMAL(10,2)
  down_hours            DECIMAL(10,2)
  utilization_pct       DECIMAL(5,2)
  created_at            TIMESTAMP DEFAULT NOW()
```

### Indexes

```sql
-- OEE snapshots
CREATE INDEX idx_oee_snapshots_machine ON oee_snapshots(machine_id, snapshot_time);
CREATE INDEX idx_oee_snapshots_org_time ON oee_snapshots(org_id, snapshot_time);

-- Downtime events
CREATE INDEX idx_downtime_machine ON oee_downtime_events(machine_id, start_time);
CREATE INDEX idx_downtime_reason ON oee_downtime_events(reason_code_id);

-- Energy readings
CREATE INDEX idx_energy_machine ON energy_readings(machine_id, reading_time);

-- Daily summary
CREATE INDEX idx_daily_summary_date ON oee_daily_summary(org_id, summary_date);

-- Alerts
CREATE INDEX idx_alerts_status ON performance_alerts(org_id, acknowledged_at);
```

---

## API Design

### OEE Calculation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oee/calculate` | Calculate OEE for time period |
| GET | `/api/oee/snapshots` | List OEE snapshots |
| GET | `/api/oee/realtime/:machineId` | Real-time OEE data |

### Downtime Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oee/downtime` | List downtime events |
| POST | `/api/oee/downtime` | Log downtime event |
| PATCH | `/api/oee/downtime/:id` | Update downtime event |
| GET | `/api/oee/downtime/reasons` | List reason codes |
| POST | `/api/oee/downtime/reasons` | Create reason code |
| GET | `/api/oee/downtime/analysis` | Pareto analysis |

### Energy Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oee/energy/readings` | List energy readings |
| POST | `/api/oee/energy/readings` | Log energy reading |
| GET | `/api/oee/energy/consumption/:machineId` | Machine consumption |
| GET | `/api/oee/energy/cost` | Energy cost analysis |
| GET | `/api/oee/energy/baselines` | List baselines |

### Shift Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oee/shift-reports` | List shift reports |
| POST | `/api/oee/shift-reports/generate` | Generate report |
| PATCH | `/api/oee/shift-reports/:id/approve` | Approve report |
| GET | `/api/oee/shift-reports/:id/export` | Export to PDF |
| POST | `/api/oee/handover-notes` | Create handover note |

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oee/alerts` | List alerts |
| GET | `/api/oee/alerts/active` | Active alerts |
| PATCH | `/api/oee/alerts/:id/acknowledge` | Acknowledge alert |
| GET | `/api/oee/alerts/config` | Alert configuration |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/oee/analytics/trends` | Trend analysis |
| GET | `/api/oee/analytics/comparisons` | Period comparisons |
| GET | `/api/oee/analytics/utilization` | Utilization heatmap |
| GET | `/api/oee/analytics/bottlenecks` | Bottleneck analysis |
| GET | `/api/oee/analytics/mtbf` | MTBF/MTTR metrics |

---

## Data Flow

### OEE Calculation Engine

```
                    OEE Formula
                         |
    +--------------------+--------------------+
    |                    |                    |
    v                    v                    v
Availability        Performance          Quality
    |                    |                    |
    v                    v                    v
Production Time      Actual Output       Good Output
------------        -------------       -----------
Planned Time         Target Output      Actual Output

Where:
- Production Time = Planned Time - Downtime
- Target Output = Production Time / Ideal Cycle Time
```

### Real-Time OEE Data Flow

```
1. Production Events
   |
   +-- Work Order started/completed
   +-- Output registered
   +-- Downtime logged
   +-- Operation time recorded
   |
   v
2. Event Processing (every 5 min or on-demand)
   |
   +-- Query current WO data
   +-- Sum downtime events
   +-- Calculate metrics
   |
   v
3. OEE Snapshot Creation
   |
   +-- Calculate Availability %
   +-- Calculate Performance %
   +-- Calculate Quality %
   +-- Calculate OEE %
   |
   v
4. Threshold Check
   |
   +-- Compare to targets
   +-- If below threshold --> Create Alert
   |
   v
5. Dashboard Update
   |
   +-- Push to real-time dashboard
   +-- Refresh machine status cards
```

### Downtime Event Lifecycle

```
1. Downtime Detected
   |
   +-- Manual log by operator, OR
   +-- Auto-detect from WO pause
   |
   v
2. Log Event
   |
   +-- Select machine
   +-- Select reason code
   +-- Set is_planned flag
   +-- Add notes (optional)
   |
   v
3. Downtime Active
   |
   +-- Duration incrementing
   +-- Alert if > threshold (e.g., 15 min)
   |
   v
4. Downtime End
   |
   +-- Manual end, OR
   +-- WO resumed
   |
   v
5. Impact Calculation
   |
   +-- Calculate duration_minutes
   +-- Update OEE snapshot
   +-- Add to shift report data
```

### Shift Report Generation

```
Shift End (+ 15 min buffer)
   |
   v
1. Collect Data
   |
   +-- All WOs in shift
   +-- All downtime events
   +-- All output records
   +-- All quality events
   |
   v
2. Calculate Metrics
   |
   +-- Average OEE (Avail x Perf x Quality)
   +-- Total output / good output
   +-- Total downtime (planned vs unplanned)
   |
   v
3. Generate Report
   |
   +-- Create shift_reports record
   +-- Status = 'draft'
   |
   v
4. Supervisor Review
   |
   +-- Review metrics
   +-- Add notes / handover
   +-- Approve report
   |
   v
5. Distribution
   |
   +-- Email to management
   +-- Archive report
   +-- Lock for editing
```

### Energy Tracking Flow

```
Data Collection
   |
   +-- Manual entry (shift start/end)
   |   +-- Operator records meter reading
   |
   +-- Auto import (if integrated)
       +-- Poll meter every 15 min
       +-- Store raw + calculated
   |
   v
Consumption Calculation
   |
   +-- kWh = End Reading - Start Reading
   +-- Link to Work Order
   +-- Calculate kWh per unit
   |
   v
Baseline Comparison
   |
   +-- Get baseline for product/machine
   +-- Calculate variance
   |
   v
Alert (if variance > 10%)
   |
   +-- Create energy_spike alert
   +-- Notify operators
```

---

## Security

### Row-Level Security

```sql
CREATE POLICY "Tenant isolation" ON oee_snapshots
  USING (org_id = auth.jwt() ->> 'org_id');

CREATE POLICY "Tenant isolation" ON oee_downtime_events
  USING (org_id = auth.jwt() ->> 'org_id');

-- Apply to all OEE tables
```

### Role Permissions

| Role | View OEE | Log Downtime | Approve Reports | Configure |
|------|----------|--------------|-----------------|-----------|
| Admin | Yes | Yes | Yes | Yes |
| Production Mgr | Yes | Yes | Yes | Limited |
| Operator | Dashboard | Yes | No | No |
| Viewer | Dashboard | No | No | No |

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Real-time OEE calculation | <2s response time |
| Dashboard refresh | Every 30s (configurable) |
| Historical queries | <5s for 90 days of data |
| Report generation | <10s for shift report |
| Pareto analysis | <3s |

### Data Retention

| Data Type | Retention |
|-----------|-----------|
| Raw snapshots | 90 days |
| Hourly summaries | 1 year |
| Daily summaries | 3 years |
| Shift reports | 7 years (compliance) |
| Energy readings | 2 years |

---

## Alert Configuration

### Alert Types

| Alert | Condition | Severity | Notification |
|-------|-----------|----------|--------------|
| OEE Below Target | Current OEE < Target | Medium | Email, Dashboard |
| Availability Low | Availability < 80% | High | Email, SMS, Dashboard |
| Performance Drop | Performance < 85% for 30min | Medium | Dashboard |
| Quality Issue | Quality < 95% | High | Email, Dashboard |
| Extended Downtime | Downtime > 15min continuous | High | Email, SMS |
| Energy Spike | kWh > 120% baseline | Medium | Dashboard |
| Shift OEE Miss | Shift OEE < Target at 75% | High | Email |

### Alert Workflow

```
1. Condition Met --> Alert Created
2. Notification Sent --> To configured recipients
3. User Acknowledges --> Mark as seen
4. Action Taken --> Add notes
5. Condition Resolved --> Auto-close or manual
```

---

## OEE Industry Benchmarks

| Industry | World Class OEE | Typical OEE |
|----------|-----------------|-------------|
| Food & Beverage | 85%+ | 60-75% |
| Discrete Manufacturing | 90%+ | 65-80% |
| Process Manufacturing | 85%+ | 60-70% |

---

## Six Big Losses (OEE Framework)

| Loss Type | Category | Impact |
|-----------|----------|--------|
| 1. Breakdowns | Availability | Unplanned stops |
| 2. Setup/Changeovers | Availability | Adjustments |
| 3. Small Stops | Performance | < 5 minutes, jams |
| 4. Reduced Speed | Performance | Below target speed |
| 5. Startup Rejects | Quality | Scrap during ramp-up |
| 6. Production Rejects | Quality | Scrap during normal operation |

---

## References

- PRD: `docs/1-BASELINE/product/modules/oee.md`
- Production Module: `docs/1-BASELINE/architecture/modules/production.md`
- Settings Module: `docs/1-BASELINE/architecture/modules/settings.md`
