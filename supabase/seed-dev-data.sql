-- ============================================================================
-- Development Seed Data for Shipping & Quality Modules
-- Generated: 2026-01-23
-- Purpose: Populate test data for development and testing
-- ============================================================================

-- NOTE: This script assumes:
-- 1. You have at least one organization (org_id)
-- 2. You have at least one user (user_id)
-- 3. You have at least one product
-- 4. You have at least one warehouse and location
-- 5. Migrations 131-144 have been applied

-- ============================================================================
-- PART 1: SHIPPING MODULE SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Customers (3 sample customers)
-- ----------------------------------------------------------------------------

-- Get first org_id and user_id for use in inserts
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_product_id UUID;
  v_warehouse_id UUID;
  v_location_id UUID;
  v_customer_id_1 UUID;
  v_customer_id_2 UUID;
  v_customer_id_3 UUID;
  v_address_id UUID;
  v_so_id UUID;
  v_so_line_id UUID;
  v_lp_id UUID;
  v_spec_id UUID;
  v_inspection_id UUID;
BEGIN
  -- Get IDs from existing records
  SELECT id INTO v_org_id FROM organizations WHERE is_active = true LIMIT 1;
  SELECT id INTO v_user_id FROM users WHERE is_active = true LIMIT 1;
  SELECT id INTO v_product_id FROM products WHERE product_type = 'finished' LIMIT 1;
  SELECT id INTO v_warehouse_id FROM warehouses WHERE is_active = true LIMIT 1;
  SELECT id INTO v_location_id FROM locations WHERE is_active = true LIMIT 1;

  -- Exit if required data doesn't exist
  IF v_org_id IS NULL OR v_user_id IS NULL THEN
    RAISE NOTICE 'Required organization or user not found. Skipping seed data.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using org_id: %, user_id: %', v_org_id, v_user_id;

  -- ============================================================================
  -- CUSTOMERS
  -- ============================================================================

  -- Customer 1: Retail
  INSERT INTO customers (org_id, customer_code, name, category, email, phone, payment_terms_days, credit_limit, is_active, created_by, created_at)
  VALUES (
    v_org_id,
    'CUST001',
    'ABC Supermarket Chain',
    'retail',
    'orders@abcsupermarket.com',
    '+1-555-0100',
    30,
    50000.00,
    true,
    v_user_id,
    NOW()
  )
  ON CONFLICT (org_id, LOWER(customer_code)) DO NOTHING
  RETURNING id INTO v_customer_id_1;

  IF v_customer_id_1 IS NOT NULL THEN
    -- Customer 1 Contact
    INSERT INTO customer_contacts (org_id, customer_id, name, title, email, phone, is_primary)
    VALUES (v_org_id, v_customer_id_1, 'John Smith', 'Purchasing Manager', 'john.smith@abcsupermarket.com', '+1-555-0101', true);

    -- Customer 1 Shipping Address
    INSERT INTO customer_addresses (org_id, customer_id, address_type, is_default, address_line1, city, state, postal_code, country)
    VALUES (v_org_id, v_customer_id_1, 'shipping', true, '123 Main Street', 'New York', 'NY', '10001', 'USA')
    RETURNING id INTO v_address_id;
  END IF;

  -- Customer 2: Wholesale
  INSERT INTO customers (org_id, customer_code, name, category, email, phone, payment_terms_days, credit_limit, is_active, created_by, created_at)
  VALUES (
    v_org_id,
    'CUST002',
    'XYZ Distributors Inc',
    'wholesale',
    'orders@xyzdist.com',
    '+1-555-0200',
    45,
    100000.00,
    true,
    v_user_id,
    NOW()
  )
  ON CONFLICT (org_id, LOWER(customer_code)) DO NOTHING
  RETURNING id INTO v_customer_id_2;

  IF v_customer_id_2 IS NOT NULL THEN
    -- Customer 2 Contact
    INSERT INTO customer_contacts (org_id, customer_id, name, title, email, phone, is_primary)
    VALUES (v_org_id, v_customer_id_2, 'Sarah Johnson', 'VP Operations', 'sarah.j@xyzdist.com', '+1-555-0201', true);

    -- Customer 2 Shipping Address
    INSERT INTO customer_addresses (org_id, customer_id, address_type, is_default, address_line1, city, state, postal_code, country)
    VALUES (v_org_id, v_customer_id_2, 'shipping', true, '456 Industrial Blvd', 'Los Angeles', 'CA', '90001', 'USA');
  END IF;

  -- Customer 3: Distributor
  INSERT INTO customers (org_id, customer_code, name, category, email, phone, payment_terms_days, credit_limit, is_active, created_by, created_at)
  VALUES (
    v_org_id,
    'CUST003',
    'Global Food Partners',
    'distributor',
    'procurement@globalfood.com',
    '+1-555-0300',
    60,
    250000.00,
    true,
    v_user_id,
    NOW()
  )
  ON CONFLICT (org_id, LOWER(customer_code)) DO NOTHING
  RETURNING id INTO v_customer_id_3;

  IF v_customer_id_3 IS NOT NULL THEN
    -- Customer 3 Contact
    INSERT INTO customer_contacts (org_id, customer_id, name, title, email, phone, is_primary)
    VALUES (v_org_id, v_customer_id_3, 'Michael Chen', 'Supply Chain Director', 'mchen@globalfood.com', '+1-555-0301', true);

    -- Customer 3 Shipping Address
    INSERT INTO customer_addresses (org_id, customer_id, address_type, is_default, address_line1, city, state, postal_code, country)
    VALUES (v_org_id, v_customer_id_3, 'shipping', true, '789 Distribution Way', 'Chicago', 'IL', '60601', 'USA');
  END IF;

  -- ============================================================================
  -- SALES ORDERS
  -- ============================================================================

  IF v_customer_id_1 IS NOT NULL AND v_address_id IS NOT NULL AND v_product_id IS NOT NULL THEN
    -- Sales Order 1: Draft
    INSERT INTO sales_orders (
      org_id, order_number, customer_id, shipping_address_id,
      order_date, promised_ship_date, status, created_by
    )
    VALUES (
      v_org_id,
      'SO-2026-00001',
      v_customer_id_1,
      v_address_id,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '7 days',
      'draft',
      v_user_id
    )
    ON CONFLICT (org_id, order_number) DO NOTHING
    RETURNING id INTO v_so_id;

    IF v_so_id IS NOT NULL THEN
      -- Sales Order Line 1
      INSERT INTO sales_order_lines (
        org_id, sales_order_id, line_number, product_id,
        quantity_ordered, unit_price
      )
      VALUES (
        v_org_id, v_so_id, 1, v_product_id,
        100.00, 25.50
      )
      RETURNING id INTO v_so_line_id;

      -- Create a test LP for allocation
      IF v_warehouse_id IS NOT NULL AND v_location_id IS NOT NULL THEN
        INSERT INTO license_plates (
          org_id, lp_number, product_id, quantity, unit,
          lot_number, production_date, expiry_date,
          location_id, status, qa_status
        )
        VALUES (
          v_org_id,
          'LP-TEST-' || LPAD((FLOOR(RANDOM() * 10000))::TEXT, 5, '0'),
          v_product_id,
          200.00,
          'CASE',
          'LOT-2026-001',
          CURRENT_DATE - INTERVAL '1 day',
          CURRENT_DATE + INTERVAL '180 days',
          v_location_id,
          'available',
          'passed'
        )
        ON CONFLICT (lp_number) DO NOTHING
        RETURNING id INTO v_lp_id;

        -- Allocate LP to SO line
        IF v_so_line_id IS NOT NULL AND v_lp_id IS NOT NULL THEN
          INSERT INTO inventory_allocations (
            org_id, sales_order_line_id, license_plate_id,
            quantity_allocated, allocated_by
          )
          VALUES (
            v_org_id, v_so_line_id, v_lp_id,
            100.00, v_user_id
          )
          ON CONFLICT (sales_order_line_id, license_plate_id) DO NOTHING;
        END IF;
      END IF;
    END IF;
  END IF;

  -- ============================================================================
  -- QUALITY MODULE SEED DATA
  -- ============================================================================

  -- Quality Settings
  INSERT INTO quality_settings (org_id, auto_create_inspections, require_inspector_assignment, enable_batch_release)
  VALUES (v_org_id, true, true, true)
  ON CONFLICT DO NOTHING;

  -- Quality Status Transitions (common workflows)
  INSERT INTO quality_status_transitions (from_status, to_status, requires_approval, requires_reason)
  VALUES
    ('pending', 'passed', false, false),
    ('pending', 'failed', true, true),
    ('pending', 'on_hold', true, true),
    ('on_hold', 'released', true, true),
    ('on_hold', 'failed', true, true),
    ('passed', 'released', false, false)
  ON CONFLICT DO NOTHING;

  -- Quality Specification
  IF v_product_id IS NOT NULL THEN
    INSERT INTO quality_specifications (
      org_id, spec_number, product_id, version, status,
      effective_date, created_by
    )
    VALUES (
      v_org_id,
      'SPEC-' || SUBSTRING(v_product_id::TEXT, 1, 8),
      v_product_id,
      1,
      'active',
      CURRENT_DATE,
      v_user_id
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_spec_id;

    -- Specification Parameters
    IF v_spec_id IS NOT NULL THEN
      INSERT INTO quality_spec_parameters (spec_id, sequence, parameter_name, parameter_type, min_value, max_value, unit, is_critical)
      VALUES
        (v_spec_id, 1, 'Temperature', 'numeric', 2.0, 8.0, '°C', true),
        (v_spec_id, 2, 'pH Level', 'range', 6.5, 7.5, 'pH', true),
        (v_spec_id, 3, 'Color', 'text', NULL, NULL, NULL, false),
        (v_spec_id, 4, 'Moisture Content', 'numeric', 0.0, 15.0, '%', true);
    END IF;
  END IF;

  -- Sampling Plan
  INSERT INTO sampling_plans (org_id, plan_code, plan_name, inspection_type, aql_level, inspection_level, is_active)
  VALUES (v_org_id, 'AQL-1.5-II', 'Standard AQL 1.5% Level II', 'incoming', 1.5, 'II', true)
  ON CONFLICT DO NOTHING;

  -- Quality Inspection
  IF v_product_id IS NOT NULL AND v_spec_id IS NOT NULL AND v_lp_id IS NOT NULL THEN
    INSERT INTO quality_inspections (
      org_id, inspection_number, inspection_type, reference_type, reference_id,
      product_id, spec_id, lp_id, status, lot_size, sample_size, inspector_id
    )
    VALUES (
      v_org_id,
      'INS-2026-00001',
      'incoming',
      'lp',
      v_lp_id,
      v_product_id,
      v_spec_id,
      v_lp_id,
      'scheduled',
      200,
      13,
      v_user_id
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_inspection_id;
  END IF;

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed Data Summary:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Customers created: 3';
  RAISE NOTICE 'Customer contacts: 3';
  RAISE NOTICE 'Customer addresses: 3';
  RAISE NOTICE 'Sales orders: 1';
  RAISE NOTICE 'Sales order lines: 1';
  RAISE NOTICE 'License plates: 1';
  RAISE NOTICE 'Inventory allocations: 1';
  RAISE NOTICE 'Quality settings: 1';
  RAISE NOTICE 'Quality status transitions: 6';
  RAISE NOTICE 'Quality specifications: 1';
  RAISE NOTICE 'Spec parameters: 4';
  RAISE NOTICE 'Sampling plans: 1';
  RAISE NOTICE 'Quality inspections: 1';
  RAISE NOTICE '========================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment to verify seed data:

-- SELECT COUNT(*) as customer_count FROM customers;
-- SELECT COUNT(*) as customer_contact_count FROM customer_contacts;
-- SELECT COUNT(*) as customer_address_count FROM customer_addresses;
-- SELECT COUNT(*) as sales_order_count FROM sales_orders;
-- SELECT COUNT(*) as sales_order_line_count FROM sales_order_lines;
-- SELECT COUNT(*) as inventory_allocation_count FROM inventory_allocations;
-- SELECT COUNT(*) as quality_spec_count FROM quality_specifications;
-- SELECT COUNT(*) as spec_parameter_count FROM quality_spec_parameters;
-- SELECT COUNT(*) as sampling_plan_count FROM sampling_plans;
-- SELECT COUNT(*) as quality_inspection_count FROM quality_inspections;

  -- ============================================================================
  -- TAX CODES (Settings Module)
  -- ============================================================================

  -- Tax Code 1: VAT 23% Poland (Default)
  INSERT INTO tax_codes (org_id, code, name, country_code, rate, valid_from, valid_to, is_default, created_by, created_at)
  VALUES (
    v_org_id,
    'VAT23',
    'VAT 23%',
    'PL',
    23.00,
    '2024-01-01',
    NULL,
    true,
    v_user_id,
    NOW()
  )
  ON CONFLICT (org_id, LOWER(code), country_code) DO NOTHING;

  -- Tax Code 2: VAT 8% Poland (Reduced)
  INSERT INTO tax_codes (org_id, code, name, country_code, rate, valid_from, valid_to, is_default, created_by, created_at)
  VALUES (
    v_org_id,
    'VAT8',
    'VAT 8% (Reduced)',
    'PL',
    8.00,
    '2024-01-01',
    NULL,
    false,
    v_user_id,
    NOW()
  )
  ON CONFLICT (org_id, LOWER(code), country_code) DO NOTHING;

  -- Tax Code 3: VAT 5% Poland (Food)
  INSERT INTO tax_codes (org_id, code, name, country_code, rate, valid_from, valid_to, is_default, created_by, created_at)
  VALUES (
    v_org_id,
    'VAT5',
    'VAT 5% (Food)',
    'PL',
    5.00,
    '2024-01-01',
    NULL,
    false,
    v_user_id,
    NOW()
  )
  ON CONFLICT (org_id, LOWER(code), country_code) DO NOTHING;

  -- Tax Code 4: VAT 0% Poland (Export)
  INSERT INTO tax_codes (org_id, code, name, country_code, rate, valid_from, valid_to, is_default, created_by, created_at)
  VALUES (
    v_org_id,
    'VAT0',
    'VAT 0% (Export)',
    'PL',
    0.00,
    '2024-01-01',
    NULL,
    false,
    v_user_id,
    NOW()
  )
  ON CONFLICT (org_id, LOWER(code), country_code) DO NOTHING;

  -- Tax Code 5: GST 10% Australia
  INSERT INTO tax_codes (org_id, code, name, country_code, rate, valid_from, valid_to, is_default, created_by, created_at)
  VALUES (
    v_org_id,
    'GST10',
    'GST 10%',
    'AU',
    10.00,
    '2024-01-01',
    NULL,
    false,
    v_user_id,
    NOW()
  )
  ON CONFLICT (org_id, LOWER(code), country_code) DO NOTHING;

  RAISE NOTICE '✓ Tax codes seeded';

