-- Migration 044: Fix missing org_id columns
-- Problem: Migrations 035+ were not applied to Supabase - tables exist but missing org_id
-- Date: 2025-12-06

-- ============================================================================
-- 1. ADD org_id TO wo_materials (if missing)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'wo_materials'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wo_materials' AND column_name = 'org_id'
  ) THEN
    -- Add org_id column
    ALTER TABLE wo_materials
      ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    -- Populate from work_orders
    UPDATE wo_materials wm
    SET org_id = wo.org_id
    FROM work_orders wo
    WHERE wm.work_order_id = wo.id;

    -- Make NOT NULL after population
    ALTER TABLE wo_materials
      ALTER COLUMN org_id SET NOT NULL;

    -- Add index
    CREATE INDEX IF NOT EXISTS idx_wo_materials_org ON wo_materials(org_id);

    RAISE NOTICE 'wo_materials: org_id column added and populated';
  ELSE
    RAISE NOTICE 'wo_materials: org_id already exists or table missing';
  END IF;
END $$;

-- ============================================================================
-- 2. ADD org_id TO wo_operations (if missing)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'wo_operations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wo_operations' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE wo_operations
      ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    UPDATE wo_operations wop
    SET org_id = wo.org_id
    FROM work_orders wo
    WHERE wop.work_order_id = wo.id;

    ALTER TABLE wo_operations
      ALTER COLUMN org_id SET NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_wo_operations_org ON wo_operations(org_id);

    RAISE NOTICE 'wo_operations: org_id column added and populated';
  ELSE
    RAISE NOTICE 'wo_operations: org_id already exists or table missing';
  END IF;
END $$;

-- ============================================================================
-- 3. ADD org_id TO wo_consumption (if missing)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'wo_consumption'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wo_consumption' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE wo_consumption
      ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    UPDATE wo_consumption wc
    SET org_id = wo.org_id
    FROM work_orders wo
    WHERE wc.work_order_id = wo.id;

    ALTER TABLE wo_consumption
      ALTER COLUMN org_id SET NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_wo_consumption_org ON wo_consumption(org_id);

    RAISE NOTICE 'wo_consumption: org_id column added and populated';
  ELSE
    RAISE NOTICE 'wo_consumption: org_id already exists or table missing';
  END IF;
END $$;

-- ============================================================================
-- 4. ADD org_id TO lp_movements (if missing)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'lp_movements'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lp_movements' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE lp_movements
      ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    -- Populate from license_plates
    UPDATE lp_movements lpm
    SET org_id = lp.org_id
    FROM license_plates lp
    WHERE lpm.lp_id = lp.id;

    ALTER TABLE lp_movements
      ALTER COLUMN org_id SET NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_lp_movements_org ON lp_movements(org_id);

    RAISE NOTICE 'lp_movements: org_id column added and populated';
  ELSE
    RAISE NOTICE 'lp_movements: org_id already exists or table missing';
  END IF;
END $$;

-- ============================================================================
-- 5. ADD org_id TO wo_material_reservations (if missing)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'wo_material_reservations'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wo_material_reservations' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE wo_material_reservations
      ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

    -- Populate from wo_materials
    UPDATE wo_material_reservations wmr
    SET org_id = wm.org_id
    FROM wo_materials wm
    WHERE wmr.wo_material_id = wm.id;

    -- If still NULL, try work_orders
    UPDATE wo_material_reservations wmr
    SET org_id = wo.org_id
    FROM work_orders wo
    WHERE wmr.work_order_id = wo.id AND wmr.org_id IS NULL;

    ALTER TABLE wo_material_reservations
      ALTER COLUMN org_id SET NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_wo_material_reservations_org ON wo_material_reservations(org_id);

    RAISE NOTICE 'wo_material_reservations: org_id column added and populated';
  ELSE
    RAISE NOTICE 'wo_material_reservations: org_id already exists or table missing';
  END IF;
END $$;

-- ============================================================================
-- 6. Verify all org_id columns exist
-- ============================================================================

DO $$
DECLARE
  missing_cols TEXT := '';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_materials')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wo_materials' AND column_name = 'org_id') THEN
    missing_cols := missing_cols || 'wo_materials.org_id, ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_operations')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wo_operations' AND column_name = 'org_id') THEN
    missing_cols := missing_cols || 'wo_operations.org_id, ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_consumption')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wo_consumption' AND column_name = 'org_id') THEN
    missing_cols := missing_cols || 'wo_consumption.org_id, ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lp_movements')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lp_movements' AND column_name = 'org_id') THEN
    missing_cols := missing_cols || 'lp_movements.org_id, ';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wo_material_reservations')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wo_material_reservations' AND column_name = 'org_id') THEN
    missing_cols := missing_cols || 'wo_material_reservations.org_id, ';
  END IF;

  IF missing_cols = '' THEN
    RAISE NOTICE 'SUCCESS: All org_id columns are present';
  ELSE
    RAISE EXCEPTION 'FAILED: Still missing columns: %', missing_cols;
  END IF;
END $$;
