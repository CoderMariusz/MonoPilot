# Batch 03C-3: Lifecycle & Settings - Technical Specification

**Batch ID:** 03C-3
**Epic:** 3 - Planning Operations
**Stories:** 3.19-3.22
**Prerequisites:** Stories 3.1-3.10

---

## Overview

Status lifecycle management for PO/TO/WO and centralized planning settings configuration. Includes Gantt view for WO scheduling visualization.

---

## Database Schema

### Planning Settings Table

```sql
CREATE TABLE IF NOT EXISTS planning_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),

  -- PO Settings
  po_statuses JSONB DEFAULT '[
    {"code": "draft", "label": "Draft", "color": "gray", "is_default": true, "sequence": 1},
    {"code": "submitted", "label": "Submitted", "color": "blue", "is_default": false, "sequence": 2},
    {"code": "confirmed", "label": "Confirmed", "color": "green", "is_default": false, "sequence": 3},
    {"code": "receiving", "label": "Receiving", "color": "yellow", "is_default": false, "sequence": 4},
    {"code": "closed", "label": "Closed", "color": "purple", "is_default": false, "sequence": 5}
  ]',
  po_default_status VARCHAR(50) DEFAULT 'draft',
  po_require_approval BOOLEAN DEFAULT false,
  po_approval_threshold NUMERIC(15,2),

  -- TO Settings
  to_statuses JSONB DEFAULT '[
    {"code": "draft", "label": "Draft", "color": "gray", "is_default": true, "sequence": 1},
    {"code": "planned", "label": "Planned", "color": "blue", "is_default": false, "sequence": 2},
    {"code": "shipped", "label": "Shipped", "color": "yellow", "is_default": false, "sequence": 3},
    {"code": "received", "label": "Received", "color": "green", "is_default": false, "sequence": 4}
  ]',
  to_default_status VARCHAR(50) DEFAULT 'draft',
  to_allow_partial BOOLEAN DEFAULT true,
  to_require_lp_selection BOOLEAN DEFAULT false,

  -- WO Settings
  wo_statuses JSONB,
  wo_default_status VARCHAR(50) DEFAULT 'draft',
  wo_status_expiry_days INTEGER,
  wo_material_check BOOLEAN DEFAULT true,
  wo_copy_routing BOOLEAN DEFAULT true,
  wo_source_of_demand BOOLEAN DEFAULT false,

  -- Field Visibility
  po_payment_terms_visible BOOLEAN DEFAULT true,
  po_shipping_method_visible BOOLEAN DEFAULT true,
  po_notes_visible BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE planning_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON planning_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable update for authenticated users"
  ON planning_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

---

## API Endpoints

| Method | Endpoint | Description | Story |
|--------|----------|-------------|-------|
| PUT | `/api/planning/purchase-orders/:id/status` | Change PO status | 3.19 |
| PUT | `/api/planning/transfer-orders/:id/status` | Change TO status | 3.20 |
| GET | `/api/planning/work-orders/schedule` | Get WO schedule data | 3.21 |
| GET | `/api/planning/settings` | Get planning settings | 3.22 |
| PUT | `/api/planning/settings` | Update planning settings | 3.22 |

---

## Stories

| Story | Title | Points | Effort |
|-------|-------|--------|--------|
| 3.19 | PO Status Lifecycle | 3 | 2-3h |
| 3.20 | TO Status Lifecycle | 3 | 2-3h |
| 3.21 | WO Gantt View | 5 | 4-6h |
| 3.22 | Planning Settings Configuration | 5 | 4-6h |

**Total:** 16 points (~14-18 hours)

---

## Dependencies

### Requires
- Story 3.1: PO CRUD
- Story 3.5: PO Statuses
- Story 3.6: TO CRUD
- Story 3.10: WO CRUD

### Blocks
- Epic 4: Production (uses WO status transitions)
- Epic 5: Receiving (uses PO/TO status transitions)
