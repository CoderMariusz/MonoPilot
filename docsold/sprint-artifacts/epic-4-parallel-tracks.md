# Epic 4: Production - Plan 2 Równoległych Tracków

**Data:** 2025-11-29
**Epic:** 4 - Production Execution
**Stories:** 20+ (4.1-4.20)
**Szacowany czas:** 3-4 tygodnie

---

## 🎯 Strategia Podziału

Tracki podzielone według **ODRĘBNYCH OBSZARÓW DANYCH** - zero konfliktów!

| Track | Fokus | Główne Tabele | Agent |
|-------|-------|---------------|-------|
| **Track A** | WO Lifecycle + Settings | `wo_pauses`, `wo_operations`, `production_settings` | Agent 1 |
| **Track B** | Consumption + Output + Genealogy | `wo_consumption`, `production_outputs`, `lp_genealogy` | Agent 2 |

---

## 🔵 TRACK A: WO Lifecycle & Settings

**Agent:** 1
**Fokus:** Uruchamianie/zatrzymywanie WO, operacje, dashboard, ustawienia
**Konflikty:** BRAK - operuje na innych tabelach niż Track B

### Kolejność Stories

```
Week 1:
4.17 → 4.1 → 4.2 → 4.3

Week 2:
4.4 → 4.5 → 4.6 → 4.20
```

### Szczegółowy Plan

#### 📋 Story 4.17: Production Settings (STARTER)
**Effort:** 3h | **Priority:** P0 (Blocker)

**Dlaczego pierwsza?** Wszystkie inne stories używają ustawień!

**Tabela:**
```sql
CREATE TABLE production_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  allow_pause_wo BOOLEAN DEFAULT true,
  auto_complete_wo BOOLEAN DEFAULT false,
  require_operation_sequence BOOLEAN DEFAULT false,
  allow_over_consumption BOOLEAN DEFAULT false,
  allow_partial_lp_consumption BOOLEAN DEFAULT true,
  require_qa_on_output BOOLEAN DEFAULT false,
  auto_create_by_product_lp BOOLEAN DEFAULT false,
  dashboard_refresh_seconds INTEGER DEFAULT 30,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);
```

**Endpoints:**
- `GET /api/production/settings`
- `PUT /api/production/settings`

**Frontend:**
- `/settings/production-execution` page

---

#### 📋 Story 4.1: Production Dashboard
**Effort:** 4-5h | **Priority:** P0

**Endpoints:**
- `GET /api/production/dashboard/kpis`
- `GET /api/production/dashboard/active-wos`
- `GET /api/production/dashboard/alerts`

**Frontend:**
- `/production/dashboard` page
- KPI cards, Active WOs table, Alerts panel
- Auto-refresh (uses `dashboard_refresh_seconds` from 4.17)

---

#### 📋 Story 4.2: WO Start
**Effort:** 2-3h | **Priority:** P0

**Endpoint:**
- `POST /api/production/work-orders/:id/start`

**Logic:**
```typescript
// Validate: status === 'released'
// Update: status → 'in_progress', started_at, started_by_user_id
```

**Frontend:**
- "Start Production" button on WO detail
- Confirmation modal

---

#### 📋 Story 4.3: WO Pause/Resume
**Effort:** 3h | **Priority:** P1

**Tabela:**
```sql
CREATE TABLE wo_pauses (
  id UUID PRIMARY KEY,
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  reason TEXT NOT NULL, -- 'breakdown', 'break', 'material_wait', 'other'
  notes TEXT,
  paused_at TIMESTAMPTZ NOT NULL,
  resumed_at TIMESTAMPTZ,
  paused_by_user_id UUID NOT NULL,
  resumed_by_user_id UUID,
  duration_minutes INTEGER GENERATED
);
```

**Endpoints:**
- `POST /api/production/work-orders/:id/pause`
- `POST /api/production/work-orders/:id/resume`

**Warunek:** `allow_pause_wo` from Settings (4.17)

---

#### 📋 Story 4.4: Operation Start
**Effort:** 2h | **Priority:** P0

**Endpoint:**
- `POST /api/production/work-orders/:id/operations/:opId/start`

**Logic:**
```typescript
// If require_operation_sequence: validate previous ops completed
// Update: wo_operations.status → 'in_progress', started_at, operator_id
```

---

#### 📋 Story 4.5: Operation Complete
**Effort:** 2h | **Priority:** P0

**Endpoint:**
- `POST /api/production/work-orders/:id/operations/:opId/complete`

**Request:**
```typescript
{
  actual_duration_minutes: number,
  actual_yield_percent: number,
  notes?: string
}
```

---

#### 📋 Story 4.6: WO Complete
**Effort:** 4h | **Priority:** P0

**Endpoint:**
- `POST /api/production/work-orders/:id/complete`

**Atomic Transaction:**
1. Validate all operations completed (if required)
2. Validate output_qty > 0
3. Update WO status → 'completed'
4. Update all output LPs status → 'available'

**Warunek:** `auto_complete_wo` for automatic completion

---

#### 📋 Story 4.20: Operation Timeline View
**Effort:** 3h | **Priority:** P2

**Frontend only** - visualization component
- Timeline SVG/CSS
- Color by status
- Click for details

---

### Track A - Podsumowanie

| Story | Tabele | Endpoints | Konflikty z Track B |
|-------|--------|-----------|---------------------|
| 4.17 | `production_settings` | settings | ❌ NONE |
| 4.1 | READ ONLY | dashboard | ❌ NONE |
| 4.2 | `work_orders` (status) | start | ❌ NONE |
| 4.3 | `wo_pauses` | pause/resume | ❌ NONE |
| 4.4 | `wo_operations` | op/start | ❌ NONE |
| 4.5 | `wo_operations` | op/complete | ❌ NONE |
| 4.6 | `work_orders` (status) | complete | ❌ NONE |
| 4.20 | NONE (UI only) | - | ❌ NONE |

---

## 🟢 TRACK B: Consumption & Output & Genealogy

**Agent:** 2
**Fokus:** Konsumpcja materiałów, rejestracja outputu, śledzenie genealogii
**Konflikty:** BRAK - operuje na innych tabelach niż Track A

### Kolejność Stories

```
Week 1:
4.7 → 4.9 → 4.10 → 4.11

Week 2:
4.18 → 4.19 → 4.12 → 4.12a → 4.12b

Week 3:
4.14 → 4.15 → 4.16 → 4.8 → 4.13
```

### Szczegółowy Plan

#### 📋 Story 4.7: Material Consumption (Desktop)
**Effort:** 4-5h | **Priority:** P0 (Blocker)

**Tabela:**
```sql
CREATE TABLE wo_consumption (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  wo_id UUID NOT NULL REFERENCES work_orders(id),
  material_id UUID NOT NULL REFERENCES wo_materials(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  qty DECIMAL(15,4) NOT NULL,
  consumed_at TIMESTAMPTZ DEFAULT now(),
  consumed_by_user_id UUID NOT NULL,
  reversed BOOLEAN DEFAULT false,
  reversed_at TIMESTAMPTZ,
  reversed_by_user_id UUID
);
```

**Endpoint:**
- `POST /api/production/work-orders/:id/consume`

**Request:**
```typescript
{
  material_id: string,
  lp_id: string,
  qty: number
}
```

---

#### 📋 Story 4.9: 1:1 Consumption Enforcement
**Effort:** 2h | **Priority:** P0

**Logic:**
```typescript
// If wo_materials.consume_whole_lp === true:
//   qty MUST equal lp.current_qty
//   No partial consumption allowed
```

---

#### 📋 Story 4.10: Consumption Correction
**Effort:** 2h | **Priority:** P1

**Endpoint:**
- `POST /api/production/work-orders/:id/consume/reverse`

**Logic:**
- Mark consumption as `reversed = true`
- Restore LP qty
- Record `reversed_by`, `reversed_at`
- **Role required:** Manager

---

#### 📋 Story 4.11: Over-Consumption Control
**Effort:** 2h | **Priority:** P1

**Logic:**
```typescript
// Uses production_settings.allow_over_consumption (from 4.17)
// If total_consumed > required_qty:
//   If !allow_over_consumption: BLOCK
//   If allow_over_consumption: WARN + continue
```

---

#### 📋 Story 4.18: LP Updates After Consumption
**Effort:** 2h | **Priority:** P0

**Atomic with consumption:**
```sql
-- In same transaction as wo_consumption INSERT:
UPDATE license_plates SET current_qty = current_qty - :consumed_qty;
UPDATE license_plates SET status = 'consumed' WHERE current_qty = 0;
UPDATE license_plates SET consumed_by_wo_id = :wo_id WHERE current_qty = 0;
```

---

#### 📋 Story 4.19: Genealogy Record Creation
**Effort:** 3h | **Priority:** P0

**Tabela:**
```sql
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY,
  parent_lp_id UUID NOT NULL,  -- consumed LP
  child_lp_id UUID,            -- output LP (NULL initially)
  operation_type VARCHAR(50),  -- 'consume', 'produce', 'split', 'merge'
  wo_id UUID,
  material_id UUID,
  consumed_qty DECIMAL(15,4),
  status VARCHAR(50) DEFAULT 'active'
);
```

**Flow:**
1. On consumption: INSERT genealogy (child_lp_id = NULL)
2. On output: UPDATE genealogy SET child_lp_id = output_lp_id

---

#### 📋 Story 4.12: Output Registration (Desktop)
**Effort:** 4h | **Priority:** P0

**Tabela:**
```sql
CREATE TABLE production_outputs (
  id UUID PRIMARY KEY,
  wo_id UUID NOT NULL,
  product_id UUID NOT NULL,
  output_lp_id UUID NOT NULL,
  qty DECIMAL(15,4) NOT NULL,
  qa_status TEXT DEFAULT 'pending',
  location_id UUID,
  is_over_production BOOLEAN DEFAULT false
);
```

**Endpoint:**
- `POST /api/production/work-orders/:id/outputs`

**Creates:**
- New LP (output product)
- production_outputs record
- Updates lp_genealogy.child_lp_id

---

#### 📋 Story 4.12a: Output-Driven Sequential Consumption
**Effort:** 5h | **Priority:** P0

**Algorithm:**
```typescript
// When registering output:
// 1. Calculate required materials for output_qty
// 2. Auto-consume from reserved LPs (FIFO by expiry)
// 3. Create genealogy links
// 4. Return consumption summary
```

---

#### 📋 Story 4.12b: Over-Production Handling
**Effort:** 3h | **Priority:** P1

**Flow:**
```
If output_qty > all_reserved_materials:
  → Prompt: "Select parent LP for over-production"
  → Operator selects LP manually
  → Create genealogy with is_over_production = true
```

---

#### 📋 Story 4.14: By-Product Registration
**Effort:** 3h | **Priority:** P1

**Endpoint:**
- `POST /api/production/work-orders/:id/by-products`

**Logic:**
- Create LP for each by-product
- Link to same genealogy tree
- Optional auto-create (from Settings)

---

#### 📋 Story 4.15: Yield Tracking
**Effort:** 2h | **Priority:** P2

**Endpoint:**
- `GET /api/production/work-orders/:id/yield`

**Calculations:**
```typescript
{
  output_yield: actual_output / planned * 100,
  material_yield: planned_material / consumed * 100,
  operation_yields: [...each operation]
}
```

---

#### 📋 Story 4.16: Multiple Outputs per WO
**Effort:** 2h | **Priority:** P1

**Logic:**
- Each output creates separate LP
- `work_orders.output_qty = SUM(production_outputs.qty)`
- Auto-complete when output_qty >= planned_qty

---

#### 📋 Story 4.8: Material Consumption (Scanner)
**Effort:** 3h | **Priority:** P1

**Same API as 4.7** - different UI:
- `/scanner/consume` page
- Touch-optimized
- Barcode scanning

---

#### 📋 Story 4.13: Output Registration (Scanner)
**Effort:** 3h | **Priority:** P1

**Same API as 4.12** - different UI:
- `/scanner/output` page
- ZPL label printing

---

### Track B - Podsumowanie

| Story | Tabele | Endpoints | Konflikty z Track A |
|-------|--------|-----------|---------------------|
| 4.7 | `wo_consumption` | consume | ❌ NONE |
| 4.9 | validation only | - | ❌ NONE |
| 4.10 | `wo_consumption` | reverse | ❌ NONE |
| 4.11 | validation only | - | ❌ NONE (reads settings) |
| 4.18 | `license_plates` | - | ❌ NONE |
| 4.19 | `lp_genealogy` | - | ❌ NONE |
| 4.12 | `production_outputs` | outputs | ❌ NONE |
| 4.12a | `wo_consumption`, `lp_genealogy` | - | ❌ NONE |
| 4.12b | `production_outputs`, `lp_genealogy` | - | ❌ NONE |
| 4.14 | `production_outputs` | by-products | ❌ NONE |
| 4.15 | READ ONLY | yield | ❌ NONE |
| 4.16 | `production_outputs` | - | ❌ NONE |
| 4.8 | same as 4.7 | consume | ❌ NONE |
| 4.13 | same as 4.12 | outputs | ❌ NONE |

---

## ⚠️ Punkty Synchronizacji

### Jedyny Shared Access

| Tabela | Track A | Track B | Rozwiązanie |
|--------|---------|---------|-------------|
| `work_orders` | status changes | output_qty update | Różne kolumny - OK |
| `production_settings` | CRUD | READ ONLY | Track B tylko czyta - OK |

### Kolejność Migracji

**Dzień 1 (oba tracki):**
1. Track A: `CREATE TABLE production_settings`
2. Track A: `CREATE TABLE wo_pauses`
3. Track B: `CREATE TABLE wo_consumption`
4. Track B: `CREATE TABLE production_outputs`
5. Track B: `CREATE TABLE lp_genealogy`

**Reszta:** Niezależnie

---

## 📊 Timeline

```
        Week 1              Week 2              Week 3
Track A: 4.17→4.1→4.2→4.3  4.4→4.5→4.6→4.20   (buffer/polish)
Track B: 4.7→4.9→4.10→4.11 4.18→4.19→4.12     4.12a→4.12b→4.14→4.15→4.16→4.8→4.13
```

---

## ✅ Checklist Przed Startem

### Track A Agent
- [ ] Przeczytaj: `docs/batches/04A-1-wo-lifecycle/tech-spec.md`
- [ ] Przeczytaj: `docs/batches/04C-1-config-traceability/stories/4.17-production-settings.md`
- [ ] Zacznij od Story 4.17 (Settings)
- [ ] NIE dotykaj tabel: `wo_consumption`, `production_outputs`, `lp_genealogy`

### Track B Agent
- [ ] Przeczytaj: `docs/batches/04A-2-material-reservation/tech-spec.md`
- [ ] Przeczytaj: `docs/batches/04B-1-consumption/tech-spec.md`
- [ ] Przeczytaj: `docs/batches/04B-2-output-registration/tech-spec.md`
- [ ] Zacznij od Story 4.7 (Consumption Desktop)
- [ ] NIE dotykaj tabel: `wo_pauses`, `production_settings`
- [ ] Możesz CZYTAĆ `production_settings` (dla 4.11)

---

## 🚀 Start Commands

**Track A:**
```
Implementuj Epic 4 Track A.
Kolejność: 4.17 → 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6 → 4.20
Przeczytaj docs/sprint-artifacts/epic-4-parallel-tracks.md sekcję Track A.
NIE dotykaj tabel: wo_consumption, production_outputs, lp_genealogy.
```

**Track B:**
```
Implementuj Epic 4 Track B.
Kolejność: 4.7 → 4.9 → 4.10 → 4.11 → 4.18 → 4.19 → 4.12 → 4.12a → 4.12b → 4.14 → 4.15 → 4.16 → 4.8 → 4.13
Przeczytaj docs/sprint-artifacts/epic-4-parallel-tracks.md sekcję Track B.
NIE dotykaj tabel: wo_pauses, production_settings (możesz CZYTAĆ settings).
```
