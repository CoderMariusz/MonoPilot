# Batch 06B-1: Specifications & Test Results - Technical Specification

## Stories
- 6.10: Product Specification Management
- 6.11: Auto-Calculate Pass/Fail for Numeric Tests
- 6.12: Record Test Results Against LPs
- 6.13: Test History Per LP
- 6.14: Compare Results to Specifications
- 6.28: Quality Test Templates

## Database Schema

```sql
CREATE TABLE product_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  product_id uuid NOT NULL REFERENCES products(id),
  test_name text NOT NULL,
  spec_type text NOT NULL CHECK (spec_type IN ('numeric', 'text', 'boolean')),
  min_value decimal,
  max_value decimal,
  expected_value text,
  is_required boolean DEFAULT false,
  test_method text,
  sequence int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  lp_id uuid NOT NULL REFERENCES license_plates(id),
  specification_id uuid NOT NULL REFERENCES product_specifications(id),
  result_value text NOT NULL,
  numeric_value decimal,
  test_status text NOT NULL CHECK (test_status IN ('passed', 'failed', 'overridden')),
  variance_percent decimal,
  override_reason text,
  notes text,
  tested_by uuid NOT NULL REFERENCES profiles(id),
  tested_at timestamptz DEFAULT now()
);

CREATE TABLE test_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  template_name text NOT NULL,
  specification_ids uuid[] NOT NULL,
  default_values jsonb,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_product_specs_product ON product_specifications(product_id);
CREATE INDEX idx_test_results_lp ON test_results(lp_id);
CREATE INDEX idx_test_results_spec ON test_results(specification_id);
```

## API Endpoints

- POST/GET /api/quality/specifications
- POST /api/quality/test-results
- GET /api/quality/test-results?lp_id=X
- POST/GET /api/quality/templates
