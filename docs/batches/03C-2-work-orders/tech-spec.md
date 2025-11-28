# Batch 03C-2: Work Orders - Technical Specification

**Batch ID:** 03C-2
**Epic:** 3 - Planning Operations
**Stories:** 3.10 (+ potentially 3.11-3.15)
**Prerequisites:** Epic 2 (Products, BOMs)

---

## Overview

Work Order management with auto-generated WO numbers, BOM auto-selection, and material snapshot creation.

---

## Database Schema

### Table: work_orders

```sql
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_number VARCHAR(20) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  bom_id UUID REFERENCES boms(id),
  quantity NUMERIC(15,3) NOT NULL CHECK (quantity > 0),
  scheduled_date DATE NOT NULL,
  actual_start_date DATE,
  actual_finish_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  source_type VARCHAR(50),
  source_id UUID,
  line_id UUID REFERENCES production_lines(id),
  machine_id UUID REFERENCES machines(id),
  priority VARCHAR(20) DEFAULT 'medium',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_work_orders_wo_number ON work_orders(org_id, wo_number);
```

---

## WO Number Format

`WO-YYYYMMDD-NNNN` (e.g., WO-20251126-0001)
- Sequential per org per day
- Resets daily

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/planning/work-orders` | List WOs |
| POST | `/api/planning/work-orders` | Create WO |
| GET | `/api/planning/work-orders/:id` | Get WO |
| PUT | `/api/planning/work-orders/:id` | Update WO |
| DELETE | `/api/planning/work-orders/:id` | Delete WO |
| PUT | `/api/planning/work-orders/:id/status` | Change status |

---

## Stories

| Story | Title | Points |
|-------|-------|--------|
| 3.10 | WO CRUD | 5 |

**Total:** 5 points (core WO only)
