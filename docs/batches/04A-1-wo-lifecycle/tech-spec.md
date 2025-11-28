# Batch 04A-1: WO Lifecycle - Tech Spec

**Stories:** 4.1-4.6
**Effort:** 12-15 hours
**Dependencies:** Epic 3 (Planning)

---

## Database Tables

### Existing Tables (from Epic 3)
- `work_orders` - WO status, timestamps, quantities
- `wo_operations` - Operations from routing

### New Tables

```sql
-- WO Pauses (for Story 4.3)
CREATE TABLE wo_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  reason TEXT NOT NULL CHECK (reason IN ('breakdown', 'break', 'material_wait', 'other')),
  notes TEXT,
  paused_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resumed_at TIMESTAMPTZ,
  paused_by_user_id UUID NOT NULL REFERENCES users(id),
  resumed_by_user_id UUID REFERENCES users(id),
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (COALESCE(resumed_at, now()) - paused_at)) / 60
  ) STORED,
  org_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Columns to Add

```sql
-- work_orders additions
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS started_by_user_id UUID REFERENCES users(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completed_by_user_id UUID REFERENCES users(id);

-- wo_operations additions
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES users(id);
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS actual_yield_percent DECIMAL(5,2);
ALTER TABLE wo_operations ADD COLUMN IF NOT EXISTS notes TEXT;
```

---

## API Endpoints

| Method | Endpoint | Story | Description |
|--------|----------|-------|-------------|
| GET | `/api/production/dashboard/kpis` | 4.1 | Dashboard KPIs |
| GET | `/api/production/dashboard/active-wos` | 4.1 | Active WOs list |
| GET | `/api/production/dashboard/alerts` | 4.1 | Production alerts |
| POST | `/api/production/work-orders/:id/start` | 4.2 | Start WO |
| POST | `/api/production/work-orders/:id/pause` | 4.3 | Pause WO |
| POST | `/api/production/work-orders/:id/resume` | 4.3 | Resume WO |
| POST | `/api/production/work-orders/:id/operations/:opId/start` | 4.4 | Start operation |
| POST | `/api/production/work-orders/:id/operations/:opId/complete` | 4.5 | Complete operation |
| POST | `/api/production/work-orders/:id/complete` | 4.6 | Complete WO |

---

## Frontend Routes

| Route | Component | Story |
|-------|-----------|-------|
| `/production/dashboard` | ProductionDashboard | 4.1 |
| `/production/work-orders/:id` | WorkOrderDetail | 4.2-4.6 |

---

## Services

### production-dashboard-service.ts
- `getKPIs(orgId)` - Dashboard metrics
- `getActiveWOs(orgId)` - Active WOs with progress
- `getAlerts(orgId)` - Shortages, delays, holds

### wo-execution-service.ts
- `startWO(woId, userId)` - Start production
- `pauseWO(woId, reason, notes, userId)` - Pause with reason
- `resumeWO(woId, userId)` - Resume paused WO
- `completeWO(woId, userId)` - Complete (atomic transaction)

### operation-execution-service.ts
- `startOperation(woId, opId, userId)` - Start operation
- `completeOperation(woId, opId, data, userId)` - Complete with duration/yield

---

## Settings (production_settings)

| Setting | Type | Default | Story |
|---------|------|---------|-------|
| `allow_pause_wo` | boolean | true | 4.3 |
| `require_operation_sequence` | boolean | false | 4.4 |
| `auto_complete_wo` | boolean | false | 4.6 |
| `dashboard_refresh_seconds` | integer | 30 | 4.1 |

---

## Transaction Atomicity (Story 4.6)

WO completion must be atomic:
1. Validate all operations completed (if required)
2. Validate at least one output exists
3. Update WO status → completed
4. Update output LPs status → available
5. Create genealogy records

Rollback on any failure.

---

## RLS Policies

```sql
-- Standard authenticated access
ALTER TABLE wo_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON wo_pauses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON wo_pauses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON wo_pauses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```
