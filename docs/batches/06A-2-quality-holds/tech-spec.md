# Batch 06A-2: Quality Holds - Technical Specification

## Stories
- 6.6: Quality Hold Creation
- 6.7: Quality Hold Notifications
- 6.8: Quality Hold Release Approval
- 6.9: Hold Investigation Tracking
- 6.26: Quality Hold Workflow

## Database Schema

```sql
CREATE TABLE quality_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  hold_number text NOT NULL,
  lp_id uuid NOT NULL REFERENCES license_plates(id),
  hold_reason text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'pending_release', 'released', 'closed')),
  notify_users uuid[],
  root_cause text,
  corrective_action text,
  preventive_action text,
  investigation_by uuid REFERENCES profiles(id),
  released_by uuid REFERENCES profiles(id),
  released_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE hold_investigation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_id uuid NOT NULL REFERENCES quality_holds(id) ON DELETE CASCADE,
  note_type text NOT NULL,
  content text NOT NULL,
  attachments jsonb,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_quality_holds_number ON quality_holds(organization_id, hold_number);
CREATE INDEX idx_quality_holds_lp ON quality_holds(lp_id);
CREATE INDEX idx_quality_holds_status ON quality_holds(organization_id, status);
```

## API Endpoints

- POST /api/quality/holds
- GET /api/quality/holds
- GET /api/quality/holds/:id
- PUT /api/quality/holds/:id
- PUT /api/quality/holds/:id/release
- POST /api/quality/holds/:id/notes
