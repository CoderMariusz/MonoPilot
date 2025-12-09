# Batch 04C-1: Config & Traceability - Tech Spec

**Stories:** 4.17-4.20
**Effort:** 6-8 hours
**Dependencies:** Batch 04A-2, 04B-2

---

## Database Tables

### New Tables

```sql
-- Production Settings (per organization)
CREATE TABLE production_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),

  -- WO Lifecycle
  allow_pause_wo BOOLEAN DEFAULT true,
  auto_complete_wo BOOLEAN DEFAULT false,
  require_operation_sequence BOOLEAN DEFAULT false,

  -- Consumption
  allow_over_consumption BOOLEAN DEFAULT false,
  allow_partial_lp_consumption BOOLEAN DEFAULT true,

  -- Output
  require_qa_on_output BOOLEAN DEFAULT true,
  auto_create_by_product_lp BOOLEAN DEFAULT false,

  -- Dashboard
  dashboard_refresh_seconds INTEGER DEFAULT 30,
  alert_shortage_enabled BOOLEAN DEFAULT true,
  alert_delay_enabled BOOLEAN DEFAULT true,
  alert_quality_hold_enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Columns to Add

```sql
-- license_plates additions
ALTER TABLE license_plates ADD COLUMN IF NOT EXISTS consumed_by_wo_id UUID REFERENCES work_orders(id);
```

---

## API Endpoints

| Method | Endpoint | Story | Description |
|--------|----------|-------|-------------|
| GET | `/api/production/settings` | 4.17 | Get production settings |
| PUT | `/api/production/settings` | 4.17 | Update production settings |
| GET | `/api/production/work-orders/:id/timeline` | 4.20 | Get operations timeline |

---

## Frontend Routes

| Route | Component | Story |
|-------|-----------|-------|
| `/settings/production-execution` | ProductionSettingsPage | 4.17 |

---

## Services

### settings-service.ts (for Story 4.17)
```typescript
async function getSettings(orgId: string): Promise<ProductionSettings> {
  const { data } = await supabase
    .from('production_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  // Return defaults if not exists
  return data || defaultSettings;
}

async function updateSettings(orgId: string, settings: Partial<ProductionSettings>) {
  await supabase
    .from('production_settings')
    .upsert({ org_id: orgId, ...settings });
}
```

---

## LP Updates After Consumption (Story 4.18)

Integrated into consumption service:

```typescript
async function consumeMaterial(woId, materialId, lpId, qty, userId) {
  // ... validation ...

  await supabase.rpc('consume_material_atomic', {
    p_wo_id: woId,
    p_material_id: materialId,
    p_lp_id: lpId,
    p_qty: qty,
    p_user_id: userId
  });
}

-- SQL Function
CREATE OR REPLACE FUNCTION consume_material_atomic(
  p_wo_id UUID, p_material_id UUID, p_lp_id UUID, p_qty DECIMAL, p_user_id UUID
) RETURNS void AS $$
DECLARE
  v_lp_qty DECIMAL;
BEGIN
  -- Lock LP
  SELECT current_qty INTO v_lp_qty
  FROM license_plates WHERE id = p_lp_id FOR UPDATE;

  -- Update LP qty
  UPDATE license_plates
  SET current_qty = current_qty - p_qty
  WHERE id = p_lp_id;

  -- If LP empty, mark consumed
  IF v_lp_qty - p_qty <= 0 THEN
    UPDATE license_plates
    SET status = 'consumed', consumed_by_wo_id = p_wo_id
    WHERE id = p_lp_id;
  END IF;

  -- Create consumption record
  INSERT INTO wo_consumption (wo_id, material_id, lp_id, qty, consumed_by_user_id, org_id)
  VALUES (p_wo_id, p_material_id, p_lp_id, p_qty, p_user_id,
    (SELECT org_id FROM work_orders WHERE id = p_wo_id));

  -- Update material consumed qty
  UPDATE wo_materials SET consumed_qty = consumed_qty + p_qty WHERE id = p_material_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Genealogy Record Creation (Story 4.19)

### On Consumption
```sql
INSERT INTO lp_genealogy (parent_lp_id, wo_id, consumed_qty, org_id)
VALUES ($consumed_lp_id, $wo_id, $qty, $org_id);
```

### On Output Registration
```sql
UPDATE lp_genealogy
SET child_lp_id = $output_lp_id
WHERE wo_id = $wo_id AND child_lp_id IS NULL;
```

### Traceability Queries

**Forward Trace (Input → Outputs):**
```sql
SELECT child_lp_id, consumed_qty
FROM lp_genealogy
WHERE parent_lp_id = $input_lp_id;
```

**Backward Trace (Output → Inputs):**
```sql
SELECT parent_lp_id, consumed_qty
FROM lp_genealogy
WHERE child_lp_id = $output_lp_id;
```

---

## Operation Timeline View (Story 4.20)

### API Response
```typescript
interface OperationTimelineItem {
  id: string;
  name: string;
  sequence: number;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at?: string;
  completed_at?: string;
  expected_duration_minutes: number;
  actual_duration_minutes?: number;
}
```

### Timeline Component
```tsx
function OperationTimeline({ operations }) {
  return (
    <div className="flex gap-1">
      {operations.map(op => (
        <div
          key={op.id}
          className={cn(
            'flex-1 h-8 rounded cursor-pointer',
            op.status === 'not_started' && 'bg-gray-200',
            op.status === 'in_progress' && 'bg-blue-500',
            op.status === 'completed' && 'bg-green-500'
          )}
          style={{
            minWidth: `${(op.expected_duration_minutes / totalDuration) * 100}%`
          }}
          onClick={() => openDetails(op.id)}
        />
      ))}
    </div>
  );
}
```

---

## Settings UI (Story 4.17)

### Form Structure
```tsx
<SettingsForm>
  <Section title="WO Lifecycle">
    <Switch name="allow_pause_wo" label="Allow Pause WO" />
    <Switch name="auto_complete_wo" label="Auto-complete when output >= planned" />
    <Switch name="require_operation_sequence" label="Enforce operation sequence" />
  </Section>

  <Section title="Material Consumption">
    <Switch name="allow_over_consumption" label="Allow over-consumption" />
    <Switch name="allow_partial_lp_consumption" label="Allow partial LP consumption" />
  </Section>

  <Section title="Output Registration">
    <Switch name="require_qa_on_output" label="Require QA status on output" />
    <Switch name="auto_create_by_product_lp" label="Auto-create by-product LPs" />
  </Section>

  <Section title="Dashboard">
    <NumberInput name="dashboard_refresh_seconds" label="Refresh interval (seconds)" />
    <Switch name="alert_shortage_enabled" label="Show shortage alerts" />
    <Switch name="alert_delay_enabled" label="Show delay alerts" />
    <Switch name="alert_quality_hold_enabled" label="Show quality hold alerts" />
  </Section>
</SettingsForm>
```

---

## RLS Policies

```sql
ALTER TABLE production_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON production_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON production_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON production_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```
