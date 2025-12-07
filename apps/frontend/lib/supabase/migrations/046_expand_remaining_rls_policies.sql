-- Migration 046: Expand remaining RLS policies
-- Purpose: Convert _isolation policies to granular SELECT/INSERT/UPDATE/DELETE
-- Date: 2025-12-07
-- Priority: P0 CRITICAL

-- ============================================================================
-- 1. EXPAND transfer_orders policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transfer_orders') THEN
    DROP POLICY IF EXISTS "transfer_orders_org_isolation" ON transfer_orders;

    CREATE POLICY transfer_orders_select ON transfer_orders
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY transfer_orders_insert ON transfer_orders
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY transfer_orders_update ON transfer_orders
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY transfer_orders_delete ON transfer_orders
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'transfer_orders: Expanded to granular policies';
  END IF;
END $$;

-- ============================================================================
-- 2. EXPAND suppliers policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    DROP POLICY IF EXISTS "suppliers_isolation" ON suppliers;

    CREATE POLICY suppliers_select ON suppliers
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY suppliers_insert ON suppliers
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY suppliers_update ON suppliers
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY suppliers_delete ON suppliers
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'suppliers: Expanded to granular policies';
  END IF;
END $$;

-- ============================================================================
-- 3. EXPAND supplier_products policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_products') THEN
    DROP POLICY IF EXISTS "supplier_products_isolation" ON supplier_products;

    CREATE POLICY supplier_products_select ON supplier_products
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY supplier_products_insert ON supplier_products
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY supplier_products_update ON supplier_products
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY supplier_products_delete ON supplier_products
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'supplier_products: Expanded to granular policies';
  END IF;
END $$;

-- ============================================================================
-- 4. EXPAND boms policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boms') THEN
    DROP POLICY IF EXISTS "boms_org_isolation" ON boms;

    CREATE POLICY boms_select ON boms
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY boms_insert ON boms
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY boms_update ON boms
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY boms_delete ON boms
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'boms: Expanded to granular policies';
  END IF;
END $$;

-- ============================================================================
-- 5. EXPAND bom_items policies (uses EXISTS join)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bom_items') THEN
    DROP POLICY IF EXISTS "bom_items_isolation" ON bom_items;

    CREATE POLICY bom_items_select ON bom_items
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id
          AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY bom_items_insert ON bom_items
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id
          AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY bom_items_update ON bom_items
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id
          AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id
          AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY bom_items_delete ON bom_items
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM boms WHERE boms.id = bom_items.bom_id
          AND boms.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    RAISE NOTICE 'bom_items: Expanded to granular policies with EXISTS join';
  END IF;
END $$;

-- ============================================================================
-- 6. EXPAND wo_pauses policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_pauses') THEN
    DROP POLICY IF EXISTS "wo_pauses_isolation" ON wo_pauses;

    CREATE POLICY wo_pauses_select ON wo_pauses
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_pauses_insert ON wo_pauses
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_pauses_update ON wo_pauses
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    CREATE POLICY wo_pauses_delete ON wo_pauses
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        org_id = (auth.jwt() ->> 'org_id')::uuid
      );

    RAISE NOTICE 'wo_pauses: Expanded to granular policies';
  END IF;
END $$;

-- ============================================================================
-- 7. EXPAND lp_genealogy policies (role-based → granular)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lp_genealogy') THEN
    DROP POLICY IF EXISTS "Users can view genealogy in their org" ON lp_genealogy;
    DROP POLICY IF EXISTS "Technical/Admin/QC can create genealogy" ON lp_genealogy;

    CREATE POLICY lp_genealogy_select ON lp_genealogy
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM license_plates lp
          WHERE lp.id = lp_genealogy.parent_lp_id
          AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY lp_genealogy_insert ON lp_genealogy
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM license_plates lp
          WHERE lp.id = lp_genealogy.parent_lp_id
          AND lp.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    -- No UPDATE/DELETE - genealogy is immutable

    RAISE NOTICE 'lp_genealogy: Replaced role-based with granular policies';
  END IF;
END $$;

-- ============================================================================
-- 8. EXPAND to_line_lps policies
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'to_line_lps') THEN
    DROP POLICY IF EXISTS "to_line_lps_org_isolation" ON to_line_lps;

    -- to_line_lps doesn't have org_id, join through to_lines → transfer_orders
    CREATE POLICY to_line_lps_select ON to_line_lps
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM to_lines
          JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
          WHERE to_lines.id = to_line_lps.to_line_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY to_line_lps_insert ON to_line_lps
      FOR INSERT WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM to_lines
          JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
          WHERE to_lines.id = to_line_lps.to_line_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY to_line_lps_update ON to_line_lps
      FOR UPDATE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM to_lines
          JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
          WHERE to_lines.id = to_line_lps.to_line_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      ) WITH CHECK (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM to_lines
          JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
          WHERE to_lines.id = to_line_lps.to_line_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    CREATE POLICY to_line_lps_delete ON to_line_lps
      FOR DELETE USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role') OR
        EXISTS (
          SELECT 1 FROM to_lines
          JOIN transfer_orders ON transfer_orders.id = to_lines.transfer_order_id
          WHERE to_lines.id = to_line_lps.to_line_id
          AND transfer_orders.org_id = (auth.jwt() ->> 'org_id')::uuid
        )
      );

    RAISE NOTICE 'to_line_lps: Expanded to granular policies with nested EXISTS join';
  END IF;
END $$;

-- ============================================================================
-- 9. GRANTS for all tables
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transfer_orders') THEN
    GRANT ALL ON transfer_orders TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON transfer_orders TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
    GRANT ALL ON suppliers TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON suppliers TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_products') THEN
    GRANT ALL ON supplier_products TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON supplier_products TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boms') THEN
    GRANT ALL ON boms TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON boms TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bom_items') THEN
    GRANT ALL ON bom_items TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON bom_items TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_pauses') THEN
    GRANT ALL ON wo_pauses TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON wo_pauses TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lp_genealogy') THEN
    GRANT ALL ON lp_genealogy TO service_role;
    GRANT SELECT, INSERT ON lp_genealogy TO authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'to_line_lps') THEN
    GRANT ALL ON to_line_lps TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON to_line_lps TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- 10. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  missing_policies TEXT := '';
BEGIN
  -- Verify all critical tables have RLS enabled
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transfer_orders')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transfer_orders' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'transfer_orders RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'suppliers' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'suppliers RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'boms')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'boms' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'boms RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bom_items')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bom_items' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'bom_items RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_pauses')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'wo_pauses' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'wo_pauses RLS not enabled; ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lp_genealogy')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'lp_genealogy' AND rowsecurity = true) THEN
    missing_policies := missing_policies || 'lp_genealogy RLS not enabled; ';
  END IF;

  IF missing_policies = '' THEN
    RAISE NOTICE '✓ SUCCESS: All remaining RLS policies expanded and verified';
  ELSE
    RAISE EXCEPTION 'FAILED: %', missing_policies;
  END IF;
END $$;
