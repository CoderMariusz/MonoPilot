-- Migration 045: Fix RLS policies and org_id inconsistencies
-- Purpose: Fix missing RLS policies and production_outputs organization_id issue
-- Date: 2025-12-07
-- Priority: P0 CRITICAL

-- ============================================================================
-- 1. FIX production_outputs: Rename organization_id → org_id + Fix FK
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_outputs' AND column_name = 'organization_id'
  ) THEN
    -- Drop existing FK constraint if exists
    ALTER TABLE production_outputs
      DROP CONSTRAINT IF EXISTS production_outputs_organization_id_fkey;

    -- Rename column
    ALTER TABLE production_outputs
      RENAME COLUMN organization_id TO org_id;

    -- Add correct FK constraint
    ALTER TABLE production_outputs
      ADD CONSTRAINT production_outputs_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

    -- Update index
    DROP INDEX IF EXISTS idx_production_outputs_org;
    CREATE INDEX idx_production_outputs_org ON production_outputs(org_id);

    RAISE NOTICE 'production_outputs: Renamed organization_id → org_id and fixed FK';
  ELSE
    RAISE NOTICE 'production_outputs: Column already named org_id';
  END IF;
END $$;

-- Update existing RLS policies to use org_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'production_outputs') THEN
    DROP POLICY IF EXISTS "production_outputs_select" ON production_outputs;
    DROP POLICY IF EXISTS "production_outputs_insert" ON production_outputs;
    DROP POLICY IF EXISTS "production_outputs_update" ON production_outputs;
    DROP POLICY IF EXISTS "production_outputs_delete" ON production_outputs;

    CREATE POLICY production_outputs_select ON production_outputs
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY production_outputs_insert ON production_outputs
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY production_outputs_update ON production_outputs
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY production_outputs_delete ON production_outputs
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'production_outputs: RLS policies updated to use org_id';
  END IF;
END $$;

-- ============================================================================
-- 2. ADD RLS to license_plates (already has RLS, but ensure complete policies)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_plates') THEN
    -- Drop old role-based policies
    DROP POLICY IF EXISTS "Users can view license plates in their org" ON license_plates;
    DROP POLICY IF EXISTS "Technical/Admin can create license plates" ON license_plates;
    DROP POLICY IF EXISTS "Technical/Admin can update license plates" ON license_plates;
    DROP POLICY IF EXISTS "Admin can delete license plates" ON license_plates;

    -- Create granular policies
    CREATE POLICY license_plates_select ON license_plates
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY license_plates_insert ON license_plates
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY license_plates_update ON license_plates
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY license_plates_delete ON license_plates
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'license_plates: RLS policies updated to granular SELECT/INSERT/UPDATE/DELETE';
  END IF;
END $$;

-- ============================================================================
-- 3. ADD RLS to work_orders (already has RLS, but ensure complete policies)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_orders') THEN
    -- Drop old role-based policies
    DROP POLICY IF EXISTS "Users can view work orders in their org" ON work_orders;
    DROP POLICY IF EXISTS "Production/Technical/Admin can create work orders" ON work_orders;
    DROP POLICY IF EXISTS "Production/Technical/Admin can update work orders" ON work_orders;
    DROP POLICY IF EXISTS "Admin can delete work orders" ON work_orders;

    -- Create granular policies
    CREATE POLICY work_orders_select ON work_orders
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY work_orders_insert ON work_orders
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY work_orders_update ON work_orders
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY work_orders_delete ON work_orders
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'work_orders: RLS policies updated to granular SELECT/INSERT/UPDATE/DELETE';
  END IF;
END $$;

-- ============================================================================
-- 4. EXPAND purchase_orders policies (currently only has po_isolation)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
    -- Drop old single policy
    DROP POLICY IF EXISTS "po_isolation" ON purchase_orders;

    -- Create granular policies
    CREATE POLICY purchase_orders_select ON purchase_orders
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY purchase_orders_insert ON purchase_orders
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY purchase_orders_update ON purchase_orders
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY purchase_orders_delete ON purchase_orders
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'purchase_orders: Expanded from po_isolation to granular policies';
  END IF;
END $$;

-- ============================================================================
-- 5. EXPAND po_lines policies (currently only has po_lines_isolation)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'po_lines') THEN
    -- Drop old single policy
    DROP POLICY IF EXISTS "po_lines_isolation" ON po_lines;

    -- Create granular policies
    CREATE POLICY po_lines_select ON po_lines
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY po_lines_insert ON po_lines
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY po_lines_update ON po_lines
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY po_lines_delete ON po_lines
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'po_lines: Expanded from po_lines_isolation to granular policies';
  END IF;
END $$;

-- ============================================================================
-- 6. FIX to_lines policies (currently uses EXISTS subquery)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'to_lines') THEN
    -- Drop old policy
    DROP POLICY IF EXISTS "to_lines_org_isolation" ON to_lines;

    -- to_lines doesn't have org_id, so we need to join through transfer_orders
    CREATE POLICY to_lines_select ON to_lines
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM transfer_orders
          WHERE transfer_orders.id = to_lines.transfer_order_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY to_lines_insert ON to_lines
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM transfer_orders
          WHERE transfer_orders.id = to_lines.transfer_order_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY to_lines_update ON to_lines
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM transfer_orders
          WHERE transfer_orders.id = to_lines.transfer_order_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM transfer_orders
          WHERE transfer_orders.id = to_lines.transfer_order_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY to_lines_delete ON to_lines
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM transfer_orders
          WHERE transfer_orders.id = to_lines.transfer_order_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    RAISE NOTICE 'to_lines: Expanded to granular policies with EXISTS join';
  END IF;
END $$;

-- ============================================================================
-- 7. GRANTS (ensure all tables have correct permissions)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_plates') THEN
    GRANT ALL ON license_plates TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON license_plates TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_orders') THEN
    GRANT ALL ON work_orders TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON work_orders TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
    GRANT ALL ON purchase_orders TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_orders TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'po_lines') THEN
    GRANT ALL ON po_lines TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON po_lines TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'to_lines') THEN
    GRANT ALL ON to_lines TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON to_lines TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  missing_policies TEXT := '';
BEGIN
  -- Check production_outputs uses org_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'production_outputs' AND column_name = 'organization_id'
  ) THEN
    missing_policies := missing_policies || 'production_outputs still has organization_id; ';
  END IF;

  -- Verify all tables have RLS enabled
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'license_plates')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'license_plates' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'license_plates RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_orders')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'work_orders' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'work_orders RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'purchase_orders' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'purchase_orders RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'po_lines')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'po_lines' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'po_lines RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'to_lines')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'to_lines' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'to_lines RLS not enabled; ';
  END IF;

  IF missing_policies = '' THEN
    RAISE NOTICE '✓ SUCCESS: All RLS policies fixed and verified';
  ELSE
    RAISE EXCEPTION 'FAILED: %', missing_policies;
  END IF;
END $$;
