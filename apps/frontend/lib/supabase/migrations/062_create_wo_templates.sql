-- Migration 062: Create WO Templates table for Production Module
-- Story: 1.5.2 - Production Templates (Variant C)
-- Purpose: Allow Production Planners to save and reuse WO configurations

-- Create wo_templates table
CREATE TABLE IF NOT EXISTS wo_templates (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  description TEXT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  config_json JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT wo_templates_unique_name_per_org UNIQUE (org_id, template_name),
  CONSTRAINT wo_templates_one_default_per_product CHECK (
    -- Only one default template per product per org
    -- This is enforced by a unique partial index below
    is_default IS NOT NULL
  )
);

-- Create indexes for performance
CREATE INDEX idx_wo_templates_org_id ON wo_templates(org_id);
CREATE INDEX idx_wo_templates_product_id ON wo_templates(org_id, product_id);
CREATE INDEX idx_wo_templates_created_by ON wo_templates(created_by);
CREATE INDEX idx_wo_templates_usage_count ON wo_templates(usage_count DESC);
CREATE INDEX idx_wo_templates_last_used ON wo_templates(last_used_at DESC NULLS LAST);

-- Unique partial index to enforce one default template per product per org
CREATE UNIQUE INDEX idx_wo_templates_one_default_per_product
  ON wo_templates(org_id, product_id)
  WHERE is_default = TRUE;

-- RLS Policies for multi-tenant isolation
ALTER TABLE wo_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates from their org
CREATE POLICY wo_templates_select_policy ON wo_templates
  FOR SELECT
  USING (org_id = current_setting('app.current_org_id')::INTEGER);

-- Policy: Users can insert templates for their org
CREATE POLICY wo_templates_insert_policy ON wo_templates
  FOR INSERT
  WITH CHECK (org_id = current_setting('app.current_org_id')::INTEGER);

-- Policy: Users can update templates from their org
CREATE POLICY wo_templates_update_policy ON wo_templates
  FOR UPDATE
  USING (org_id = current_setting('app.current_org_id')::INTEGER)
  WITH CHECK (org_id = current_setting('app.current_org_id')::INTEGER);

-- Policy: Users can delete templates from their org
CREATE POLICY wo_templates_delete_policy ON wo_templates
  FOR DELETE
  USING (org_id = current_setting('app.current_org_id')::INTEGER);

-- Trigger to update updated_at timestamp
CREATE TRIGGER wo_templates_updated_at
  BEFORE UPDATE ON wo_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE wo_templates IS 'Production Templates - Save and reuse Work Order configurations';
COMMENT ON COLUMN wo_templates.config_json IS 'JSONB structure: {product_id, bom_id, line_id, shift, notes, operations[]}';
COMMENT ON COLUMN wo_templates.is_default IS 'Auto-suggest this template when creating WO for this product';
COMMENT ON COLUMN wo_templates.usage_count IS 'Incremented each time template is applied';
COMMENT ON COLUMN wo_templates.last_used_at IS 'Timestamp of last template application';
