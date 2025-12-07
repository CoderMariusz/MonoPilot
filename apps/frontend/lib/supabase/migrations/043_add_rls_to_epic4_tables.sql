-- Migration 043: Add RLS to Epic 4 tables (SAFE VERSION)
-- Fix: P0-1 from MASTER-FINDINGS.md
-- Date: 2025-12-06
-- NOTE: Uses DO blocks to safely skip non-existent tables

-- ============================================================================
-- 1. PRODUCTION_OUTPUTS TABLE (uses organization_id)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_outputs') THEN
    ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "production_outputs_select" ON production_outputs;
    DROP POLICY IF EXISTS "production_outputs_insert" ON production_outputs;
    DROP POLICY IF EXISTS "production_outputs_update" ON production_outputs;
    DROP POLICY IF EXISTS "production_outputs_delete" ON production_outputs;

    CREATE POLICY production_outputs_select ON production_outputs
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        organization_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY production_outputs_insert ON production_outputs
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        organization_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY production_outputs_update ON production_outputs
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        organization_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        organization_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY production_outputs_delete ON production_outputs
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        organization_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'production_outputs RLS policies created';
  ELSE
    RAISE NOTICE 'production_outputs table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- 2. WO_MATERIALS TABLE (uses org_id)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_materials') THEN
    DROP POLICY IF EXISTS wo_materials_isolation ON wo_materials;
    DROP POLICY IF EXISTS "wo_materials_select" ON wo_materials;
    DROP POLICY IF EXISTS "wo_materials_insert" ON wo_materials;
    DROP POLICY IF EXISTS "wo_materials_update" ON wo_materials;
    DROP POLICY IF EXISTS "wo_materials_delete" ON wo_materials;

    CREATE POLICY wo_materials_select ON wo_materials
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_materials_insert ON wo_materials
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_materials_update ON wo_materials
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_materials_delete ON wo_materials
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'wo_materials RLS policies created';
  ELSE
    RAISE NOTICE 'wo_materials table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- 3. WO_OPERATIONS TABLE (uses org_id)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_operations') THEN
    DROP POLICY IF EXISTS wo_operations_isolation ON wo_operations;
    DROP POLICY IF EXISTS "wo_operations_select" ON wo_operations;
    DROP POLICY IF EXISTS "wo_operations_insert" ON wo_operations;
    DROP POLICY IF EXISTS "wo_operations_update" ON wo_operations;
    DROP POLICY IF EXISTS "wo_operations_delete" ON wo_operations;

    CREATE POLICY wo_operations_select ON wo_operations
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_operations_insert ON wo_operations
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_operations_update ON wo_operations
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_operations_delete ON wo_operations
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'wo_operations RLS policies created';
  ELSE
    RAISE NOTICE 'wo_operations table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- 4. WO_CONSUMPTION TABLE (uses org_id)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_consumption') THEN
    DROP POLICY IF EXISTS "Users can view consumption in their org" ON wo_consumption;
    DROP POLICY IF EXISTS "Users can create consumption in their org" ON wo_consumption;
    DROP POLICY IF EXISTS "Users can update consumption in their org" ON wo_consumption;
    DROP POLICY IF EXISTS "wo_consumption_select" ON wo_consumption;
    DROP POLICY IF EXISTS "wo_consumption_insert" ON wo_consumption;
    DROP POLICY IF EXISTS "wo_consumption_update" ON wo_consumption;
    DROP POLICY IF EXISTS "wo_consumption_delete" ON wo_consumption;

    CREATE POLICY wo_consumption_select ON wo_consumption
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_consumption_insert ON wo_consumption
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_consumption_update ON wo_consumption
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_consumption_delete ON wo_consumption
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'wo_consumption RLS policies created';
  ELSE
    RAISE NOTICE 'wo_consumption table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- 5. LP_MOVEMENTS TABLE (uses org_id)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lp_movements') THEN
    DROP POLICY IF EXISTS "Users can view movements in their org" ON lp_movements;
    DROP POLICY IF EXISTS "Users can create movements in their org" ON lp_movements;
    DROP POLICY IF EXISTS "lp_movements_select" ON lp_movements;
    DROP POLICY IF EXISTS "lp_movements_insert" ON lp_movements;
    DROP POLICY IF EXISTS "lp_movements_update" ON lp_movements;
    DROP POLICY IF EXISTS "lp_movements_delete" ON lp_movements;

    CREATE POLICY lp_movements_select ON lp_movements
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY lp_movements_insert ON lp_movements
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY lp_movements_update ON lp_movements
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY lp_movements_delete ON lp_movements
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'lp_movements RLS policies created';
  ELSE
    RAISE NOTICE 'lp_movements table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- 6. WO_MATERIAL_RESERVATIONS TABLE (uses org_id)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_material_reservations') THEN
    DROP POLICY IF EXISTS "wo_material_reservations_isolation" ON wo_material_reservations;
    DROP POLICY IF EXISTS "wo_material_reservations_select" ON wo_material_reservations;
    DROP POLICY IF EXISTS "wo_material_reservations_insert" ON wo_material_reservations;
    DROP POLICY IF EXISTS "wo_material_reservations_update" ON wo_material_reservations;
    DROP POLICY IF EXISTS "wo_material_reservations_delete" ON wo_material_reservations;

    CREATE POLICY wo_material_reservations_select ON wo_material_reservations
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_material_reservations_insert ON wo_material_reservations
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_material_reservations_update ON wo_material_reservations
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_material_reservations_delete ON wo_material_reservations
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'wo_material_reservations RLS policies created';
  ELSE
    RAISE NOTICE 'wo_material_reservations table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- GRANTS (only for existing tables)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_outputs') THEN
    GRANT ALL ON production_outputs TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON production_outputs TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_materials') THEN
    GRANT ALL ON wo_materials TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON wo_materials TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_operations') THEN
    GRANT ALL ON wo_operations TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON wo_operations TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_consumption') THEN
    GRANT ALL ON wo_consumption TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON wo_consumption TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lp_movements') THEN
    GRANT ALL ON lp_movements TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON lp_movements TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_material_reservations') THEN
    GRANT ALL ON wo_material_reservations TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON wo_material_reservations TO authenticated;
  END IF;
END $$;
