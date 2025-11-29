# Batch 06B-2: NCR (Non-Conformance Reports) - Technical Specification

## Stories
- 6.15: NCR Creation
- 6.16: NCR Lifecycle Tracking
- 6.17: Link NCRs to Source Documents
- 6.18: Root Cause and Corrective Actions
- 6.27: NCR Workflow

## Database Schema

```sql
CREATE TABLE non_conformance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  ncr_number text NOT NULL,
  issue_type text NOT NULL CHECK (issue_type IN ('material', 'process', 'product', 'other')),
  description text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'corrective_action', 'closed')),
  source_lp_id uuid REFERENCES license_plates(id),
  source_wo_id uuid REFERENCES work_orders(id),
  source_po_id uuid REFERENCES purchase_orders(id),
  detected_by uuid NOT NULL REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  root_cause_analysis text,
  corrective_actions text,
  preventive_actions text,
  responsible_person uuid REFERENCES profiles(id),
  target_date date,
  actual_completion_date date,
  closed_by uuid REFERENCES profiles(id),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ncr_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ncr_id uuid NOT NULL REFERENCES non_conformance_reports(id) ON DELETE CASCADE,
  link_type text NOT NULL CHECK (link_type IN ('lp', 'wo', 'po', 'supplier')),
  link_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ncr_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ncr_id uuid NOT NULL REFERENCES non_conformance_reports(id) ON DELETE CASCADE,
  note_type text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_ncr_number ON non_conformance_reports(organization_id, ncr_number);
CREATE INDEX idx_ncr_status ON non_conformance_reports(organization_id, status);
CREATE INDEX idx_ncr_links_ncr ON ncr_links(ncr_id);
```

## API Endpoints

- POST/GET /api/quality/ncrs
- GET/PUT /api/quality/ncrs/:id
- POST /api/quality/ncrs/:id/notes
- POST /api/quality/ncrs/:id/links
