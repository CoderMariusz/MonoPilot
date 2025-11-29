# Batch 06C-3: Quality Settings - Technical Specification

## Stories
- 6.25: Quality Settings Configuration

## Database Schema

```sql
CREATE TABLE quality_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  allow_consume_pending boolean DEFAULT false,
  enable_hold_notifications boolean DEFAULT true,
  require_hold_release_approval boolean DEFAULT true,
  default_qa_status text DEFAULT 'pending' CHECK (default_qa_status IN ('pending', 'passed')),
  auto_fail_on_out_of_spec boolean DEFAULT true,
  ncr_number_prefix text DEFAULT 'NCR-',
  hold_number_prefix text DEFAULT 'HOLD-',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## API Endpoints

- GET /api/quality/settings
- PUT /api/quality/settings

## UI Location

/settings/quality - under Settings module (Epic 1 sidebar)
