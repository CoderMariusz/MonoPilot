# Batch 06C-1: Certificate of Analysis (CoA) - Technical Specification

## Stories
- 6.19: Certificate of Analysis Upload
- 6.20: Require CoA on Receipt
- 6.21: CoA Verification Tracking

## Database Schema

```sql
CREATE TABLE certificates_of_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  grn_id uuid REFERENCES goods_received_notes(id),
  supplier_id uuid REFERENCES suppliers(id),
  product_id uuid NOT NULL REFERENCES products(id),
  batch_number text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size int,
  verification_status text DEFAULT 'pending_review' CHECK (verification_status IN ('pending_review', 'verified', 'rejected')),
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  verification_notes text,
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Add require_coa to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS require_coa boolean DEFAULT false;

CREATE INDEX idx_coa_product ON certificates_of_analysis(product_id);
CREATE INDEX idx_coa_grn ON certificates_of_analysis(grn_id);
CREATE INDEX idx_coa_status ON certificates_of_analysis(organization_id, verification_status);
```

## API Endpoints

- POST /api/quality/coas (with file upload)
- GET /api/quality/coas
- GET /api/quality/coas/:id
- PUT /api/quality/coas/:id/verify
- GET /api/quality/coas/download/:id

## Supabase Storage

Bucket: `coa-documents`
Path: `{org_id}/{product_id}/{filename}`
