# Batch 06A-1: QA Status - Technical Specification

## Stories
- 6.1: LP QA Status Management
- 6.2: QA Status Transition Rules
- 6.3: Prevent Shipping Non-Passed LPs
- 6.4: Control Consumption of Pending LPs
- 6.5: QA Change Audit Trail

## Database Schema

```sql
-- QA status on license_plates (add column if not exists)
ALTER TABLE license_plates ADD COLUMN IF NOT EXISTS qa_status text DEFAULT 'pending';
ALTER TABLE license_plates ADD CONSTRAINT lp_qa_status_check
  CHECK (qa_status IN ('pending', 'passed', 'failed', 'quarantine'));

-- QA status change audit trail
CREATE TABLE qa_status_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lp_id uuid NOT NULL REFERENCES license_plates(id),
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL REFERENCES profiles(id),
  reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_qa_status_changes_lp ON qa_status_changes(lp_id);
CREATE INDEX idx_qa_status_changes_org ON qa_status_changes(organization_id);
```

## API Endpoints

- PUT /api/warehouse/license-plates/:id/qa-status
- GET /api/quality/audit

## State Machine (Story 6.2)

```
pending → passed | failed | quarantine
quarantine → passed | failed
failed → quarantine (only)
passed → (no changes, Manager override only)
```
