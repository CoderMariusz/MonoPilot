-- Migration 031: GRNs Table
-- Purpose: Goods Receipt Notes - receiving documentation
-- Date: 2025-01-11
-- Dependencies: 002_suppliers, 016_po_header

CREATE TABLE grns (
  id SERIAL PRIMARY KEY,
  grn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES po_header(id),
  status VARCHAR(20) NOT NULL,
  received_date TIMESTAMPTZ NOT NULL,
  received_by INTEGER,
  supplier_id INTEGER REFERENCES suppliers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_grns_number ON grns(grn_number);
CREATE INDEX idx_grns_po ON grns(po_id);
CREATE INDEX idx_grns_supplier ON grns(supplier_id);
CREATE INDEX idx_grns_received_date ON grns(received_date);

-- Comments
COMMENT ON TABLE grns IS 'Goods Receipt Notes - documentation for receiving materials from suppliers';

-- Migration 032: GRN Items Table
-- Purpose: Individual line items in goods receipt notes
-- Date: 2025-01-11
-- Dependencies: 004_locations, 009_products, 031_grns

CREATE TABLE grn_items (
  id SERIAL PRIMARY KEY,
  grn_id INTEGER REFERENCES grns(id),
  product_id INTEGER REFERENCES products(id),
  quantity_ordered NUMERIC(12,4) NOT NULL,
  quantity_received NUMERIC(12,4) NOT NULL,
  quantity_accepted NUMERIC(12,4),
  location_id INTEGER REFERENCES locations(id),
  unit_price NUMERIC(12,4),
  batch VARCHAR(100),
  batch_number VARCHAR(100),
  mfg_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX idx_grn_items_product ON grn_items(product_id);
CREATE INDEX idx_grn_items_location ON grn_items(location_id);

-- Comments
COMMENT ON TABLE grn_items IS 'Individual line items in GRNs with quantities and batch information';

-- Migration 033: ASNs Table
-- Purpose: Advanced Shipping Notices from suppliers
-- Date: 2025-01-11
-- Dependencies: 002_suppliers, 016_po_header

CREATE TABLE asns (
  id SERIAL PRIMARY KEY,
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER REFERENCES suppliers(id),
  po_id INTEGER REFERENCES po_header(id),
  status VARCHAR(20) NOT NULL,
  expected_arrival TIMESTAMPTZ NOT NULL,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_asns_number ON asns(asn_number);
CREATE INDEX idx_asns_supplier ON asns(supplier_id);
CREATE INDEX idx_asns_po ON asns(po_id);
CREATE INDEX idx_asns_expected_arrival ON asns(expected_arrival);

-- Comments
COMMENT ON TABLE asns IS 'Advanced Shipping Notices from suppliers - pre-arrival notifications';
COMMENT ON COLUMN asns.attachments IS 'JSONB array of document attachments';

-- Migration 034: ASN Items Table
-- Purpose: Individual line items in ASNs
-- Date: 2025-01-11
-- Dependencies: 009_products, 033_asns

CREATE TABLE asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id),
  product_id INTEGER REFERENCES products(id),
  uom VARCHAR(20) NOT NULL,
  quantity NUMERIC(12,4) NOT NULL,
  batch VARCHAR(100),
  pack JSONB,
  pallet JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_asn_items_asn ON asn_items(asn_id);
CREATE INDEX idx_asn_items_product ON asn_items(product_id);

-- Comments
COMMENT ON TABLE asn_items IS 'Individual line items in ASNs with packaging details';
COMMENT ON COLUMN asn_items.pack IS 'JSONB containing pack/box details';
COMMENT ON COLUMN asn_items.pallet IS 'JSONB containing pallet configuration details';

-- Migration 035: Stock Moves Table
-- Purpose: Track all inventory movements
-- Date: 2025-01-11
-- Dependencies: 004_locations, 009_products

CREATE TABLE stock_moves (
  id SERIAL PRIMARY KEY,
  move_number VARCHAR(50) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(id),
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  quantity NUMERIC(12,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  move_type VARCHAR(50) NOT NULL,
  move_source VARCHAR(50) DEFAULT 'portal',
  move_status VARCHAR(20) DEFAULT 'completed',
  reference_type VARCHAR(50),
  reference_id INTEGER,
  created_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stock_moves_number ON stock_moves(move_number);
CREATE INDEX idx_stock_moves_product ON stock_moves(product_id);
CREATE INDEX idx_stock_moves_from_location ON stock_moves(from_location_id);
CREATE INDEX idx_stock_moves_to_location ON stock_moves(to_location_id);
CREATE INDEX idx_stock_moves_created_at ON stock_moves(created_at);

-- Comments
COMMENT ON TABLE stock_moves IS 'Track all inventory movements between locations';
COMMENT ON COLUMN stock_moves.move_source IS 'Source of move: portal, scanner, system, etc.';

-- Migration 036: Product Allergens Table
-- Purpose: Junction table for product-allergen relationships
-- Date: 2025-01-11
-- Dependencies: 006_allergens, 009_products

CREATE TABLE product_allergens (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  allergen_id INTEGER NOT NULL REFERENCES allergens(id),
  contains BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, allergen_id)
);

-- Indexes
CREATE INDEX idx_product_allergens_product ON product_allergens(product_id);
CREATE INDEX idx_product_allergens_allergen ON product_allergens(allergen_id);

-- Comments
COMMENT ON TABLE product_allergens IS 'Junction table linking products to allergens for food safety compliance';
COMMENT ON COLUMN product_allergens.contains IS 'True if product contains this allergen';

-- Migration 037: Audit Log Table
-- Purpose: System-wide audit trail for changes
-- Date: 2025-01-11
-- Dependencies: 001_users

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  entity VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(20) NOT NULL,
  before JSONB,
  after JSONB,
  actor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Comments
COMMENT ON TABLE audit_log IS 'System-wide audit trail tracking all entity changes';
COMMENT ON COLUMN audit_log.action IS 'Action type: create, update, delete, archive, etc.';
COMMENT ON COLUMN audit_log.before IS 'JSONB snapshot of entity state before change';
COMMENT ON COLUMN audit_log.after IS 'JSONB snapshot of entity state after change';

-- Migration 038: Add Foreign Key Constraints
-- Purpose: Add foreign keys that couldn't be added earlier due to circular dependencies
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- Products -> Routings (circular with routings -> products)
ALTER TABLE products ADD CONSTRAINT fk_products_default_routing 
  FOREIGN KEY (default_routing_id) REFERENCES routings(id);

-- BOMs -> Routings
ALTER TABLE boms ADD CONSTRAINT fk_boms_default_routing 
  FOREIGN KEY (default_routing_id) REFERENCES routings(id);

-- TO Line -> License Plates (license_plates created after to_line)
ALTER TABLE to_line ADD CONSTRAINT fk_to_line_lp 
  FOREIGN KEY (lp_id) REFERENCES license_plates(id);

-- Comments
COMMENT ON CONSTRAINT fk_products_default_routing ON products IS 'Default routing for this product';
COMMENT ON CONSTRAINT fk_boms_default_routing ON boms IS 'Default routing for this BOM';
COMMENT ON CONSTRAINT fk_to_line_lp ON to_line IS 'License plate used in transfer';

-- Migration 039: RPC Functions
-- Purpose: Business logic functions for complex operations
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- =============================================
-- 1. GENERATE TO NUMBER
-- =============================================

CREATE OR REPLACE FUNCTION generate_to_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_sequence INTEGER;
  v_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(number FROM 'TO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM to_header
  WHERE number LIKE 'TO-' || TO_CHAR(NOW(), 'YYYY') || '-%';
  
  v_number := 'TO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(v_sequence::TEXT, 3, '0');
  
  RETURN v_number;
END;
$$;

COMMENT ON FUNCTION generate_to_number IS 'Generate next transfer order number in format TO-YYYY-NNN';

-- =============================================
-- 2. MARK TO SHIPPED
-- =============================================

CREATE OR REPLACE FUNCTION mark_to_shipped(
  p_to_id INTEGER,
  p_ship_date TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE to_header
  SET 
    actual_ship_date = p_ship_date,
    status = 'in_transit',
    updated_at = NOW()
  WHERE id = p_to_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order % not found', p_to_id;
  END IF;
  
  INSERT INTO audit_log (entity, entity_id, action, actor_id, created_at)
  VALUES ('to_header', p_to_id, 'mark_shipped', p_user_id, NOW());
  
  RETURN jsonb_build_object('success', true, 'to_id', p_to_id, 'status', 'in_transit');
END;
$$;

COMMENT ON FUNCTION mark_to_shipped IS 'Mark transfer order as shipped with actual ship date';

-- =============================================
-- 3. MARK TO RECEIVED
-- =============================================

CREATE OR REPLACE FUNCTION mark_to_received(
  p_to_id INTEGER,
  p_receive_date TIMESTAMPTZ,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE to_header
  SET 
    actual_receive_date = p_receive_date,
    status = 'received',
    updated_at = NOW()
  WHERE id = p_to_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transfer order % not found', p_to_id;
  END IF;
  
  INSERT INTO audit_log (entity, entity_id, action, actor_id, created_at)
  VALUES ('to_header', p_to_id, 'mark_received', p_user_id, NOW());
  
  RETURN jsonb_build_object('success', true, 'to_id', p_to_id, 'status', 'received');
END;
$$;

COMMENT ON FUNCTION mark_to_received IS 'Mark transfer order as received with actual receive date';

-- =============================================
-- 4. QUICK CREATE POS
-- =============================================

CREATE OR REPLACE FUNCTION quick_create_pos(
  p_product_entries JSONB,
  p_user_id UUID,
  p_warehouse_id INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry JSONB;
  v_product RECORD;
  v_supplier RECORD;
  v_supplier_groups JSONB := '[]'::JSONB;
  v_supplier_group JSONB;
  v_lines JSONB;
  v_line JSONB;
  v_group_index INTEGER;
  v_line_index INTEGER;
  v_qty NUMERIC;
  v_existing_qty NUMERIC;
  v_vat_rate NUMERIC := 0;
  v_po_header RECORD;
  v_po_number TEXT;
  v_line_no INTEGER;
  v_result JSONB := '[]'::JSONB;
  v_group_currency TEXT;
  v_net_total NUMERIC;
  v_vat_total NUMERIC;
  v_gross_total NUMERIC;
  v_line_qty NUMERIC;
  v_line_price NUMERIC;
  v_line_vat_rate NUMERIC;
BEGIN
  -- Check user permissions
  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = p_user_id
      AND u.role IN ('Admin', 'Planner', 'Purchasing')
  ) THEN
    RAISE EXCEPTION 'User does not have permission to create purchase orders';
  END IF;

  -- Process entries and group by supplier/currency
  FOR v_entry IN SELECT elem FROM jsonb_array_elements(p_product_entries) AS elem LOOP
    -- Validate entry
    IF NOT (v_entry ? 'product_code') THEN
      RAISE EXCEPTION 'Input entry missing product_code: %', v_entry::TEXT;
    END IF;
    IF NOT (v_entry ? 'quantity') THEN
      RAISE EXCEPTION 'Input entry missing quantity for product %', v_entry->>'product_code';
    END IF;

    v_qty := (v_entry->>'quantity')::NUMERIC;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0 for product %', v_entry->>'product_code';
    END IF;

    -- Get product details
    SELECT id, part_number, description, supplier_id, uom, std_price, tax_code_id, is_active
    INTO v_product
    FROM products
    WHERE part_number = v_entry->>'product_code'
      AND is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product code % not found or inactive', v_entry->>'product_code';
    END IF;

    IF v_product.supplier_id IS NULL THEN
      RAISE EXCEPTION 'Product % does not have a supplier assigned', v_product.part_number;
    END IF;

    -- Get supplier details
    SELECT s.id, s.name, s.currency, s.payment_terms
    INTO v_supplier
    FROM suppliers s
    WHERE s.id = v_product.supplier_id
      AND s.is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Supplier for product % not found or inactive', v_product.part_number;
    END IF;

    IF v_supplier.currency IS NULL THEN
      RAISE EXCEPTION 'Supplier % does not have currency defined', v_supplier.name;
    END IF;

    -- Get VAT rate
    v_vat_rate := 0;
    IF v_product.tax_code_id IS NOT NULL THEN
      SELECT rate INTO v_vat_rate FROM settings_tax_codes WHERE id = v_product.tax_code_id;
    END IF;

    -- Find or create supplier group
    v_group_index := NULL;
    v_group_currency := v_supplier.currency;

    FOR i IN 0 .. COALESCE(jsonb_array_length(v_supplier_groups), 0) - 1 LOOP
      v_supplier_group := v_supplier_groups->i;
      IF (v_supplier_group->>'supplier_id')::INTEGER = v_supplier.id
         AND (v_supplier_group->>'currency') = v_group_currency THEN
        v_group_index := i;
        EXIT;
      END IF;
    END LOOP;

    -- Add to group or create new group
    IF v_group_index IS NULL THEN
      v_supplier_groups := v_supplier_groups || jsonb_build_array(
        jsonb_build_object(
          'supplier_id', v_supplier.id,
          'supplier_name', v_supplier.name,
          'currency', v_group_currency,
          'payment_terms', v_supplier.payment_terms,
          'lines', jsonb_build_array(
            jsonb_build_object(
              'item_id', v_product.id,
              'part_number', v_product.part_number,
              'description', v_product.description,
              'uom', v_product.uom,
              'qty_ordered', v_qty,
              'unit_price', COALESCE(v_product.std_price, 0),
              'vat_rate', COALESCE(v_vat_rate, 0)
            )
          )
        )
      );
    ELSE
      -- Aggregate quantities for same product
      v_supplier_group := v_supplier_groups->v_group_index;
      v_lines := COALESCE(v_supplier_group->'lines', '[]'::JSONB);

      v_line_index := NULL;
      FOR j IN 0 .. COALESCE(jsonb_array_length(v_lines), 0) - 1 LOOP
        v_line := v_lines->j;
        IF (v_line->>'item_id')::INTEGER = v_product.id THEN
          v_line_index := j;
          EXIT;
        END IF;
      END LOOP;

      IF v_line_index IS NULL THEN
        v_lines := v_lines || jsonb_build_array(
          jsonb_build_object(
            'item_id', v_product.id,
            'part_number', v_product.part_number,
            'description', v_product.description,
            'uom', v_product.uom,
            'qty_ordered', v_qty,
            'unit_price', COALESCE(v_product.std_price, 0),
            'vat_rate', COALESCE(v_vat_rate, 0)
          )
        );
      ELSE
        v_line := v_lines->v_line_index;
        v_existing_qty := (v_line->>'qty_ordered')::NUMERIC;
        v_line := jsonb_build_object(
          'item_id', v_product.id,
          'part_number', v_product.part_number,
          'description', v_product.description,
          'uom', v_product.uom,
          'qty_ordered', v_existing_qty + v_qty,
          'unit_price', COALESCE(v_product.std_price, 0),
          'vat_rate', COALESCE(v_vat_rate, 0)
        );
        v_lines := jsonb_set(v_lines, ARRAY[v_line_index::TEXT], v_line);
      END IF;

      v_supplier_group := jsonb_set(v_supplier_group, '{lines}', v_lines);
      v_supplier_groups := jsonb_set(v_supplier_groups, ARRAY[v_group_index::TEXT], v_supplier_group);
    END IF;
  END LOOP;

  -- Create PO for each supplier/currency group
  FOR v_supplier_group IN SELECT * FROM jsonb_array_elements(v_supplier_groups) LOOP
    -- Generate PO number
    SELECT 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(
      (COALESCE(MAX(CAST(SUBSTRING(number FROM 'PO-[0-9]+-([0-9]+)$') AS INTEGER)), 0) + 1)::TEXT,
      3,
      '0'
    )
    INTO v_po_number
    FROM po_header
    WHERE number LIKE 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-%';

    -- Create PO header
    INSERT INTO po_header (
      number,
      supplier_id,
      status,
      currency,
      exchange_rate,
      order_date,
      created_by,
      net_total,
      vat_total,
      gross_total,
      warehouse_id
    )
    VALUES (
      v_po_number,
      (v_supplier_group->>'supplier_id')::INTEGER,
      'draft',
      v_supplier_group->>'currency',
      1.0,
      NOW(),
      p_user_id,
      0,
      0,
      0,
      p_warehouse_id
    )
    RETURNING * INTO v_po_header;

    -- Create PO lines and calculate totals
    v_line_no := 1;
    v_net_total := 0;
    v_vat_total := 0;
    v_gross_total := 0;

    FOR v_line IN SELECT * FROM jsonb_array_elements(v_supplier_group->'lines') LOOP
      v_line_qty := (v_line->>'qty_ordered')::NUMERIC;
      v_line_price := (v_line->>'unit_price')::NUMERIC;
      v_line_vat_rate := COALESCE((v_line->>'vat_rate')::NUMERIC, 0);

      INSERT INTO po_line (
        po_id,
        line_no,
        item_id,
        uom,
        qty_ordered,
        qty_received,
        unit_price,
        vat_rate
      )
      VALUES (
        v_po_header.id,
        v_line_no,
        (v_line->>'item_id')::INTEGER,
        v_line->>'uom',
        v_line_qty,
        0,
        v_line_price,
        v_line_vat_rate
      );

      v_net_total := v_net_total + v_line_qty * v_line_price;
      v_vat_total := v_vat_total + (v_line_qty * v_line_price * v_line_vat_rate / 100);
      v_line_no := v_line_no + 1;
    END LOOP;

    v_gross_total := v_net_total + v_vat_total;

    -- Update totals
    UPDATE po_header
    SET net_total = v_net_total::NUMERIC,
        vat_total = v_vat_total::NUMERIC,
        gross_total = v_gross_total::NUMERIC,
        updated_at = NOW()
    WHERE id = v_po_header.id;

    -- Add to result
    v_result := v_result || jsonb_build_object(
      'id', v_po_header.id,
      'number', v_po_header.number,
      'supplier_id', v_po_header.supplier_id,
      'supplier_name', v_supplier_group->>'supplier_name',
      'currency', v_po_header.currency,
      'total_lines', v_line_no - 1,
      'net_total', v_net_total,
      'vat_total', v_vat_total,
      'gross_total', v_gross_total
    );

    -- Audit log
    INSERT INTO audit_log (entity, entity_id, action, actor_id, created_at)
    VALUES (
      'po_header',
      v_po_header.id,
      'quick_create',
      p_user_id,
      NOW()
    );
  END LOOP;

  RETURN jsonb_build_object('purchase_orders', v_result);
END;
$$;

COMMENT ON FUNCTION quick_create_pos IS 'Quick PO creation from product codes - auto-splits by supplier and currency';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT EXECUTE ON FUNCTION generate_to_number TO authenticated;
GRANT EXECUTE ON FUNCTION mark_to_shipped TO authenticated;
GRANT EXECUTE ON FUNCTION mark_to_received TO authenticated;
GRANT EXECUTE ON FUNCTION quick_create_pos TO authenticated;

-- Migration 040: Row Level Security Policies
-- Purpose: Enable RLS and create security policies
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- =============================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE routings ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_correction ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE pallet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE asns ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Note: routing_operation_names deliberately left WITHOUT RLS as it's a reference table

-- =============================================
-- 2. CREATE POLICIES (Full access for authenticated users)
-- =============================================

-- These are basic policies allowing authenticated users full access
-- More granular role-based policies can be added later as needed

CREATE POLICY "authenticated_users_all" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON settings_tax_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON allergens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON production_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON boms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON bom_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON bom_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON routings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON routing_operations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON po_header FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON po_line FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON po_correction FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON to_header FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON to_line FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON work_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON wo_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON wo_operations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON production_outputs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON license_plates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON lp_reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON lp_compositions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON lp_genealogy FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON pallets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON pallet_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON grns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON grn_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON asns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON asn_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON stock_moves FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON product_allergens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_users_all" ON audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Comments
COMMENT ON POLICY "authenticated_users_all" ON users IS 'Allow authenticated users full access to users table';
COMMENT ON POLICY "authenticated_users_all" ON products IS 'Allow authenticated users full access to products table';

-- Migration 041: Triggers and Automatic Updates
-- Purpose: Automated timestamp updates and other triggers
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- =============================================
-- 1. UPDATED_AT TRIGGER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically update updated_at timestamp on row modification';

-- =============================================
-- 2. APPLY UPDATED_AT TRIGGER TO TABLES
-- =============================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_tax_codes_updated_at BEFORE UPDATE ON settings_tax_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allergens_updated_at BEFORE UPDATE ON allergens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_lines_updated_at BEFORE UPDATE ON production_lines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boms_updated_at BEFORE UPDATE ON boms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bom_items_updated_at BEFORE UPDATE ON bom_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routings_updated_at BEFORE UPDATE ON routings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routing_operations_updated_at BEFORE UPDATE ON routing_operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routing_operation_names_updated_at BEFORE UPDATE ON routing_operation_names
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_header_updated_at BEFORE UPDATE ON po_header
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_line_updated_at BEFORE UPDATE ON po_line
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_to_header_updated_at BEFORE UPDATE ON to_header
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_to_line_updated_at BEFORE UPDATE ON to_line
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_plates_updated_at BEFORE UPDATE ON license_plates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grns_updated_at BEFORE UPDATE ON grns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grn_items_updated_at BEFORE UPDATE ON grn_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asns_updated_at BEFORE UPDATE ON asns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_allergens_updated_at BEFORE UPDATE ON product_allergens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TRIGGER update_users_updated_at ON users IS 'Automatically update updated_at on row modification';
COMMENT ON TRIGGER update_products_updated_at ON products IS 'Automatically update updated_at on row modification';

-- Migration 042: Seed Data
-- Purpose: Initial seed data for testing and development
-- Date: 2025-01-11
-- Dependencies: All table migrations

-- =============================================
-- 1. SEED TAX CODES
-- =============================================

INSERT INTO settings_tax_codes (code, name, rate, is_active) VALUES 
('VAT_23', 'VAT 23%', 0.23, true),
('VAT_8', 'VAT 8%', 0.08, true),
('VAT_0', 'VAT 0%', 0.00, true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 2. SEED ALLERGENS
-- =============================================

INSERT INTO allergens (code, name, description, is_active) VALUES 
('GLUTEN', 'Gluten', 'Contains gluten from wheat, rye, barley', true),
('SOYA', 'Soya', 'Contains soya products', true),
('DAIRY', 'Dairy', 'Contains milk and dairy products', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 3. SEED WAREHOUSES
-- =============================================

INSERT INTO warehouses (code, name, is_active) VALUES 
('WH-001', 'Main Warehouse', true),
('WH-002', 'Forza', true),
('PROD-001', 'Production Area', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 4. SEED LOCATIONS
-- =============================================

INSERT INTO locations (warehouse_id, code, name, type, is_active) 
SELECT w.id, 'DG-001', 'Dry Goods Zone 1', 'STORAGE', true
FROM warehouses w WHERE w.code = 'WH-001'
ON CONFLICT (code) DO NOTHING;

INSERT INTO locations (warehouse_id, code, name, type, is_active) 
SELECT w.id, 'DG-002', 'Dry Goods Zone 2', 'STORAGE', true
FROM warehouses w WHERE w.code = 'WH-002'
ON CONFLICT (code) DO NOTHING;

INSERT INTO locations (warehouse_id, code, name, type, is_active) 
SELECT w.id, 'PROD-001', 'Production Floor', 'PRODUCTION', true
FROM warehouses w WHERE w.code = 'PROD-001'
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 5. SEED SUPPLIERS
-- =============================================

INSERT INTO suppliers (
  name, legal_name, vat_number, country, currency, 
  payment_terms, lead_time_days, is_active
) VALUES 
('BXS Supplier', 'BXS Supplier Ltd', 'VAT123456', 'PL', 'PLN', 'Net 30', 7, true),
('Packaging Co', 'Packaging Co Sp. z o.o.', 'VAT789012', 'PL', 'PLN', 'Net 15', 3, true)
ON CONFLICT DO NOTHING;

-- =============================================
-- 6. SEED MACHINES
-- =============================================

INSERT INTO machines (name, code, type, is_active) VALUES 
('Mixer 1', 'MIX-001', 'MIXER', true),
('Packer 1', 'PACK-001', 'PACKER', true),
('Grinder 1', 'GRIND-001', 'GRINDER', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 7. SEED PRODUCTION LINES
-- =============================================

INSERT INTO production_lines (code, name, status, is_active) VALUES 
('LINE-4', 'Production Line 4', 'active', true),
('LINE-5', 'Production Line 5', 'active', true),
('LINE-6', 'Production Line 6', 'inactive', true)
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- 8. SEED ROUTING OPERATION NAMES
-- =============================================

INSERT INTO routing_operation_names (name, alias, description, is_active) VALUES 
('Mixing', 'MIX', 'Mix ingredients together', true),
('Grinding', 'GRIND', 'Grind meat or materials', true),
('Forming', 'FORM', 'Form product shape', true),
('Cooking', 'COOK', 'Cooking process', true),
('Cooling', 'COOL', 'Cooling process', true),
('Packing', 'PACK', 'Pack finished products', true),
('Quality Check', 'QC', 'Quality control inspection', true),
('Labeling', 'LABEL', 'Apply labels to products', true)
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE settings_tax_codes IS 'Seed data loaded: 3 tax codes';
COMMENT ON TABLE allergens IS 'Seed data loaded: 3 allergens';
COMMENT ON TABLE warehouses IS 'Seed data loaded: 3 warehouses';
COMMENT ON TABLE suppliers IS 'Seed data loaded: 2 suppliers';
COMMENT ON TABLE machines IS 'Seed data loaded: 3 machines';
COMMENT ON TABLE production_lines IS 'Seed data loaded: 3 production lines';
COMMENT ON TABLE routing_operation_names IS 'Seed data loaded: 8 standard operations';

-- Migration 043: Warehouse Settings Table
-- Purpose: Default locations for TO and PO receiving per warehouse
-- Date: 2025-01-11
-- Dependencies: 003_warehouses, 004_locations

CREATE TABLE warehouse_settings (
  id SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) UNIQUE,
  default_to_receive_location_id INTEGER REFERENCES locations(id),
  default_po_receive_location_id INTEGER REFERENCES locations(id),
  default_transit_location_id INTEGER REFERENCES locations(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_warehouse_settings_warehouse ON warehouse_settings(warehouse_id);

-- Enable RLS
ALTER TABLE warehouse_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "authenticated_users_all" ON warehouse_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_warehouse_settings_updated_at BEFORE UPDATE ON warehouse_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE warehouse_settings IS 'Warehouse-specific settings for default receiving locations';
COMMENT ON COLUMN warehouse_settings.default_to_receive_location_id IS 'Default location for receiving Transfer Orders in this warehouse';
COMMENT ON COLUMN warehouse_settings.default_po_receive_location_id IS 'Default location for receiving Purchase Orders in this warehouse';
COMMENT ON COLUMN warehouse_settings.default_transit_location_id IS 'Transit/staging location for goods in transfer (optional virtual location)';

-- Migration: 044_wo_by_products.sql
-- Description: Add wo_by_products table to track secondary outputs from work orders
-- Epic: EPIC-001 BOM Complexity v2 - Phase 1 (By-Products)
-- Created: 2025-01-11

-- ============================================================================
-- TABLE: wo_by_products
-- Purpose: Track secondary outputs from work orders (e.g., bones, trim from meat processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wo_by_products (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  expected_quantity NUMERIC(12,4) NOT NULL,
  actual_quantity NUMERIC(12,4) DEFAULT 0,
  uom VARCHAR(20) NOT NULL,
  lp_id INTEGER REFERENCES license_plates(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT wo_by_products_expected_qty_positive CHECK (expected_quantity > 0),
  CONSTRAINT wo_by_products_actual_qty_non_negative CHECK (actual_quantity >= 0)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_wo_by_products_wo ON wo_by_products(wo_id);
CREATE INDEX idx_wo_by_products_product ON wo_by_products(product_id);
CREATE INDEX idx_wo_by_products_lp ON wo_by_products(lp_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE wo_by_products ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read/write all by-products
CREATE POLICY "authenticated_users_all" ON wo_by_products 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at timestamp
CREATE TRIGGER update_wo_by_products_updated_at 
  BEFORE UPDATE ON wo_by_products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE wo_by_products IS 'Secondary outputs from work orders (e.g., bones, trim from meat processing). Tracks both expected yield from BOM and actual quantities produced.';

COMMENT ON COLUMN wo_by_products.id IS 'Primary key';
COMMENT ON COLUMN wo_by_products.wo_id IS 'Work order that produced this by-product';
COMMENT ON COLUMN wo_by_products.product_id IS 'Product code of the by-product';
COMMENT ON COLUMN wo_by_products.expected_quantity IS 'Expected yield of by-product based on BOM (calculated from yield_percentage)';
COMMENT ON COLUMN wo_by_products.actual_quantity IS 'Actual quantity produced and recorded by operator';
COMMENT ON COLUMN wo_by_products.uom IS 'Unit of measure (e.g., kg, pcs)';
COMMENT ON COLUMN wo_by_products.lp_id IS 'License plate created for this by-product (NULL until produced)';
COMMENT ON COLUMN wo_by_products.notes IS 'Optional notes from production operator';
COMMENT ON COLUMN wo_by_products.created_at IS 'Timestamp when by-product record was created (WO creation)';
COMMENT ON COLUMN wo_by_products.updated_at IS 'Timestamp when by-product record was last updated';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 045_bom_by_products.sql
-- Description: Enhance bom_items table to support by-products
-- Epic: EPIC-001 BOM Complexity v2 - Phase 1 (By-Products)
-- Created: 2025-01-11

-- ============================================================================
-- ALTER TABLE: bom_items
-- Add columns to distinguish between input materials and output by-products
-- ============================================================================

-- Add by-product flag (default FALSE = input material)
ALTER TABLE bom_items 
  ADD COLUMN IF NOT EXISTS is_by_product BOOLEAN DEFAULT FALSE;

-- Add yield percentage for by-products (e.g., 15% bones from 100kg meat)
ALTER TABLE bom_items 
  ADD COLUMN IF NOT EXISTS yield_percentage NUMERIC(5,2);

-- Add constraint: yield_percentage only valid for by-products
ALTER TABLE bom_items 
  ADD CONSTRAINT bom_items_yield_percentage_check 
  CHECK (
    (is_by_product = FALSE AND yield_percentage IS NULL) OR
    (is_by_product = TRUE AND yield_percentage > 0 AND yield_percentage <= 100)
  );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN bom_items.is_by_product IS 'True if this item is an OUTPUT (by-product), false if INPUT (material). By-products are created when WO completes, materials are consumed.';

COMMENT ON COLUMN bom_items.yield_percentage IS 'Expected yield % for by-products (e.g., 15.00 means 15% of main output quantity). Only applies when is_by_product = TRUE. NULL for input materials.';

-- ============================================================================
-- DATA MIGRATION
-- Existing bom_items are inputs (materials), not by-products
-- ============================================================================

-- Ensure all existing rows have is_by_product = FALSE
UPDATE bom_items 
SET is_by_product = FALSE 
WHERE is_by_product IS NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 046_bom_versioning.sql
-- Description: Add date-based versioning to BOMs
-- Epic: EPIC-001 BOM Complexity v2 - Phase 2 (Multi-Version BOM)
-- Created: 2025-01-11

-- ============================================================================
-- ALTER TABLE: boms
-- Add date range columns for versioning
-- ============================================================================

-- Add effective_from date (when this BOM version becomes active)
ALTER TABLE boms 
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ DEFAULT NOW();

-- Add effective_to date (when this BOM version expires, NULL = no expiry)
ALTER TABLE boms 
  ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ;

-- Add constraint: effective_from must be before effective_to
ALTER TABLE boms 
  ADD CONSTRAINT boms_effective_dates_check 
  CHECK (effective_to IS NULL OR effective_from < effective_to);

-- ============================================================================
-- FUNCTION: check_bom_date_overlap
-- Purpose: Prevent overlapping date ranges for same product's BOMs
-- ============================================================================

CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
DECLARE
  v_overlap_count INTEGER;
BEGIN
  -- Count BOMs for same product with overlapping date ranges
  SELECT COUNT(*) INTO v_overlap_count
  FROM boms
  WHERE product_id = NEW.product_id
    AND id != COALESCE(NEW.id, -1)  -- Exclude current BOM (for updates)
    AND status = 'active'
    AND (
      -- Check if date ranges overlap using PostgreSQL range operators
      tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)') 
      && 
      tstzrange(NEW.effective_from, COALESCE(NEW.effective_to, 'infinity'::timestamptz), '[)')
    );

  IF v_overlap_count > 0 THEN
    RAISE EXCEPTION 'BOM date range overlaps with existing active BOM for product %', NEW.product_id
      USING HINT = 'Each product can only have one active BOM per date range. Please adjust effective_from/effective_to dates.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_bom_date_overlap_trigger ON boms;
CREATE TRIGGER check_bom_date_overlap_trigger
  BEFORE INSERT OR UPDATE ON boms
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION check_bom_date_overlap();

-- ============================================================================
-- INDEXES
-- Add indexes for efficient BOM version queries
-- ============================================================================

-- Index for finding BOM by product and date range
CREATE INDEX IF NOT EXISTS idx_boms_product_date_range 
  ON boms(product_id, effective_from, effective_to) 
  WHERE status = 'active';

-- Index for finding current BOMs (effective_to is NULL or in future)
-- Note: Cannot use NOW() in index predicate as it's not IMMUTABLE
CREATE INDEX IF NOT EXISTS idx_boms_current 
  ON boms(product_id, effective_from) 
  WHERE status = 'active';

-- GiST index for efficient range overlap queries
-- First, enable btree_gist extension (required for INTEGER in GIST index)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE INDEX IF NOT EXISTS idx_boms_daterange 
  ON boms USING GIST (
    product_id, 
    tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)')
  )
  WHERE status = 'active';

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN boms.effective_from IS 'Date when this BOM version becomes active. Multiple versions can exist for same product with different date ranges.';

COMMENT ON COLUMN boms.effective_to IS 'Date when this BOM version expires (NULL = no expiry, indefinitely active). Used for planned recipe changes.';

COMMENT ON FUNCTION check_bom_date_overlap() IS 'Validates that BOM date ranges do not overlap for the same product. Prevents conflicting BOM versions.';

-- ============================================================================
-- DATA MIGRATION
-- Set effective_from for existing BOMs to their creation date
-- ============================================================================

-- Update existing BOMs to have effective_from = created_at
UPDATE boms 
SET effective_from = created_at 
WHERE effective_from IS NULL;

-- Existing BOMs have no expiry date (effective_to = NULL)
-- This is the correct default - they are active indefinitely

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
Example 1: Create BOM v1 (current recipe)
INSERT INTO boms (product_id, status, effective_from, effective_to)
VALUES (100, 'active', '2025-01-01', NULL);

Example 2: Create BOM v2 (future recipe change)
INSERT INTO boms (product_id, status, effective_from, effective_to)
VALUES (100, 'active', '2025-03-01', NULL);  -- Replaces v1 starting March 1

-- This will fail (overlapping dates):
INSERT INTO boms (product_id, status, effective_from, effective_to)
VALUES (100, 'active', '2025-02-15', '2025-03-15');  -- ❌ Overlaps with v1 and v2

Example 3: Seasonal variant
INSERT INTO boms (product_id, status, effective_from, effective_to)
VALUES (100, 'active', '2025-12-01', '2026-01-15');  -- Christmas special recipe

Example 4: Find current BOM for product
SELECT * FROM boms
WHERE product_id = 100
  AND status = 'active'
  AND effective_from <= NOW()
  AND (effective_to IS NULL OR effective_to > NOW())
ORDER BY effective_from DESC
LIMIT 1;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 047_select_bom_by_date.sql
-- Description: RPC function to select correct BOM version for a Work Order
-- Epic: EPIC-001 BOM Complexity v2 - Phase 2 (Multi-Version BOM)
-- Created: 2025-01-11

-- ============================================================================
-- FUNCTION: select_bom_for_wo
-- Purpose: Select the correct BOM version based on scheduled date
-- ============================================================================

CREATE OR REPLACE FUNCTION select_bom_for_wo(
  p_product_id INTEGER,
  p_scheduled_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  bom_id INTEGER,
  bom_version VARCHAR,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  is_current BOOLEAN,
  is_future BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS bom_id,
    b.version AS bom_version,
    b.effective_from,
    b.effective_to,
    -- is_current: BOM is active right now
    (b.effective_from <= NOW() AND (b.effective_to IS NULL OR b.effective_to > NOW())) AS is_current,
    -- is_future: BOM will be active in the future
    (b.effective_from > NOW()) AS is_future
  FROM boms b
  WHERE b.product_id = p_product_id
    AND b.status = 'active'
    AND b.effective_from <= p_scheduled_date
    AND (b.effective_to IS NULL OR b.effective_to > p_scheduled_date)
  ORDER BY b.effective_from DESC
  LIMIT 1;
  
  -- If no BOM found, raise exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active BOM found for product % on date %', p_product_id, p_scheduled_date
      USING HINT = 'Please ensure product has at least one active BOM covering the scheduled date.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: get_all_bom_versions
-- Purpose: Get all BOM versions for a product (for UI display)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_bom_versions(
  p_product_id INTEGER
)
RETURNS TABLE (
  bom_id INTEGER,
  bom_version VARCHAR,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  status VARCHAR,
  is_current BOOLEAN,
  is_future BOOLEAN,
  is_expired BOOLEAN,
  items_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS bom_id,
    b.version AS bom_version,
    b.effective_from,
    b.effective_to,
    b.status,
    -- is_current: BOM is active right now
    (b.effective_from <= NOW() AND (b.effective_to IS NULL OR b.effective_to > NOW()) AND b.status = 'active') AS is_current,
    -- is_future: BOM will be active in the future
    (b.effective_from > NOW() AND b.status = 'active') AS is_future,
    -- is_expired: BOM has expired
    (b.effective_to IS NOT NULL AND b.effective_to <= NOW()) AS is_expired,
    -- Count BOM items (materials + by-products)
    (SELECT COUNT(*) FROM bom_items bi WHERE bi.bom_id = b.id)::INTEGER AS items_count
  FROM boms b
  WHERE b.product_id = p_product_id
  ORDER BY b.effective_from DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: validate_bom_date_range
-- Purpose: Helper function to validate date range before creating/updating BOM
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_bom_date_range(
  p_product_id INTEGER,
  p_bom_id INTEGER DEFAULT NULL,
  p_effective_from TIMESTAMPTZ DEFAULT NOW(),
  p_effective_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  conflicting_bom_id INTEGER
) AS $$
DECLARE
  v_overlap_count INTEGER;
  v_conflicting_bom_id INTEGER;
BEGIN
  -- Check for overlapping date ranges
  SELECT COUNT(*), MIN(id) INTO v_overlap_count, v_conflicting_bom_id
  FROM boms
  WHERE product_id = p_product_id
    AND id != COALESCE(p_bom_id, -1)
    AND status = 'active'
    AND (
      tstzrange(effective_from, COALESCE(effective_to, 'infinity'::timestamptz), '[)') 
      && 
      tstzrange(p_effective_from, COALESCE(p_effective_to, 'infinity'::timestamptz), '[)')
    );

  IF v_overlap_count > 0 THEN
    RETURN QUERY SELECT 
      FALSE AS is_valid, 
      'BOM date range overlaps with existing active BOM (ID: ' || v_conflicting_bom_id || ')' AS error_message,
      v_conflicting_bom_id AS conflicting_bom_id;
  ELSE
    RETURN QUERY SELECT 
      TRUE AS is_valid, 
      NULL::TEXT AS error_message,
      NULL::INTEGER AS conflicting_bom_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON FUNCTION select_bom_for_wo IS 'Selects the correct BOM version for a Work Order based on scheduled date. Returns the BOM that is active on the given date.';

COMMENT ON FUNCTION get_all_bom_versions IS 'Returns all BOM versions for a product with status flags (current, future, expired). Used for UI display in BOM version timeline.';

COMMENT ON FUNCTION validate_bom_date_range IS 'Validates that a BOM date range does not overlap with existing active BOMs for the same product. Returns validation result with error details.';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
Example 1: Find BOM for WO scheduled today
SELECT * FROM select_bom_for_wo(100, NOW());

Example 2: Find BOM for WO scheduled in March 2025
SELECT * FROM select_bom_for_wo(100, '2025-03-15 10:00:00+00');

Example 3: Get all BOM versions for product (for UI display)
SELECT * FROM get_all_bom_versions(100);

Example 4: Validate date range before creating new BOM
SELECT * FROM validate_bom_date_range(
  100,                      -- product_id
  NULL,                     -- bom_id (NULL for new BOM)
  '2025-03-01 00:00:00+00', -- effective_from
  '2025-04-01 00:00:00+00'  -- effective_to
);

-- Expected result:
-- is_valid | error_message | conflicting_bom_id
-- ---------+---------------+-------------------
-- false    | BOM date...   | 123
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 048_bom_conditional_items.sql
-- Description: Add conditional items support for order-specific material selection
-- Epic: EPIC-001 BOM Complexity v2 - Phase 3 (Conditional Components)
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: bom_items
-- Add condition JSONB column for order flags
-- ============================================================================

-- Add condition column (JSON structure for conditional logic)
ALTER TABLE bom_items 
  ADD COLUMN IF NOT EXISTS condition JSONB;

-- ============================================================================
-- VALIDATION FUNCTIONS
-- ============================================================================

/**
 * Validate condition JSON structure
 * Ensures condition has valid fields and types
 */
CREATE OR REPLACE FUNCTION validate_bom_item_condition(p_condition JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- If condition is NULL, it's always valid (unconditional item)
  IF p_condition IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Condition must be an object
  IF jsonb_typeof(p_condition) != 'object' THEN
    RAISE EXCEPTION 'Condition must be a JSON object';
  END IF;

  -- Check for valid keys
  IF NOT (p_condition ?& ARRAY['type', 'rules']) THEN
    RAISE EXCEPTION 'Condition must have "type" and "rules" fields';
  END IF;

  -- Validate type
  IF p_condition->>'type' NOT IN ('AND', 'OR') THEN
    RAISE EXCEPTION 'Condition type must be "AND" or "OR"';
  END IF;

  -- Validate rules is an array
  IF jsonb_typeof(p_condition->'rules') != 'array' THEN
    RAISE EXCEPTION 'Condition rules must be an array';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Validate condition before insert/update
-- ============================================================================

CREATE OR REPLACE FUNCTION check_bom_item_condition()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate condition if present
  IF NEW.condition IS NOT NULL THEN
    IF NOT validate_bom_item_condition(NEW.condition) THEN
      RAISE EXCEPTION 'Invalid condition structure';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_bom_item_condition_trigger ON bom_items;
CREATE TRIGGER validate_bom_item_condition_trigger
  BEFORE INSERT OR UPDATE ON bom_items
  FOR EACH ROW
  EXECUTE FUNCTION check_bom_item_condition();

-- ============================================================================
-- INDEXES
-- Add GIN index for efficient JSONB queries
-- ============================================================================

-- GIN index for condition queries
CREATE INDEX IF NOT EXISTS idx_bom_items_condition 
  ON bom_items USING GIN (condition jsonb_path_ops)
  WHERE condition IS NOT NULL;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN bom_items.condition IS 
'Optional JSONB condition for order-specific material selection. 
Example: {"type": "OR", "rules": [{"field": "order_flags", "operator": "contains", "value": "organic"}]}
NULL = unconditional (always required)';

COMMENT ON FUNCTION validate_bom_item_condition IS 
'Validates condition JSON structure. Condition must have type (AND/OR) and rules array.';

COMMENT ON FUNCTION check_bom_item_condition IS 
'Trigger function to validate condition structure before insert/update on bom_items.';

-- ============================================================================
-- EXAMPLE CONDITIONS
-- ============================================================================

/*
Example 1: Organic ingredients (single rule)
{
  "type": "OR",
  "rules": [
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "organic"
    }
  ]
}

Example 2: Gluten-free AND vegan (multiple rules with AND)
{
  "type": "AND",
  "rules": [
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "gluten_free"
    },
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "vegan"
    }
  ]
}

Example 3: Premium OR export orders
{
  "type": "OR",
  "rules": [
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "premium"
    },
    {
      "field": "order_type",
      "operator": "equals",
      "value": "export"
    }
  ]
}

Example 4: Customer-specific packaging
{
  "type": "AND",
  "rules": [
    {
      "field": "customer_id",
      "operator": "equals",
      "value": 123
    },
    {
      "field": "order_flags",
      "operator": "contains",
      "value": "custom_packaging"
    }
  ]
}
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 049_evaluate_bom_conditions.sql
-- Description: RPC function to evaluate conditional BOM items based on WO flags
-- Epic: EPIC-001 BOM Complexity v2 - Phase 3 (Conditional Components)
-- Created: 2025-01-12

-- ============================================================================
-- FUNCTION: evaluate_condition_rule
-- Purpose: Evaluate a single condition rule against WO context
-- ============================================================================

CREATE OR REPLACE FUNCTION evaluate_condition_rule(
  p_rule JSONB,
  p_context JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_field TEXT;
  v_operator TEXT;
  v_value TEXT;
  v_context_value JSONB;
BEGIN
  -- Extract rule components
  v_field := p_rule->>'field';
  v_operator := p_rule->>'operator';
  v_value := p_rule->>'value';

  -- Get context value for the field
  v_context_value := p_context->v_field;

  -- Evaluate based on operator
  CASE v_operator
    WHEN 'equals' THEN
      RETURN (v_context_value::TEXT = v_value);
    
    WHEN 'not_equals' THEN
      RETURN (v_context_value::TEXT != v_value);
    
    WHEN 'contains' THEN
      -- For arrays (e.g., order_flags)
      IF jsonb_typeof(v_context_value) = 'array' THEN
        RETURN (v_context_value @> to_jsonb(v_value));
      ELSE
        -- For strings
        RETURN (v_context_value::TEXT LIKE '%' || v_value || '%');
      END IF;
    
    WHEN 'not_contains' THEN
      -- For arrays
      IF jsonb_typeof(v_context_value) = 'array' THEN
        RETURN NOT (v_context_value @> to_jsonb(v_value));
      ELSE
        -- For strings
        RETURN NOT (v_context_value::TEXT LIKE '%' || v_value || '%');
      END IF;
    
    WHEN 'greater_than' THEN
      RETURN ((v_context_value::TEXT)::NUMERIC > v_value::NUMERIC);
    
    WHEN 'less_than' THEN
      RETURN ((v_context_value::TEXT)::NUMERIC < v_value::NUMERIC);
    
    WHEN 'in' THEN
      -- Value is a JSON array
      RETURN (to_jsonb(v_context_value::TEXT) <@ (p_rule->'value'));
    
    ELSE
      RAISE EXCEPTION 'Unknown operator: %', v_operator;
  END CASE;
  
EXCEPTION
  WHEN OTHERS THEN
    -- If evaluation fails, return FALSE (rule not met)
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: evaluate_bom_item_condition
-- Purpose: Evaluate full condition (with AND/OR logic)
-- ============================================================================

CREATE OR REPLACE FUNCTION evaluate_bom_item_condition(
  p_condition JSONB,
  p_context JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_type TEXT;
  v_rules JSONB;
  v_rule JSONB;
  v_result BOOLEAN;
  v_rule_result BOOLEAN;
BEGIN
  -- If condition is NULL, item is unconditional (always required)
  IF p_condition IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Extract condition type and rules
  v_type := p_condition->>'type';
  v_rules := p_condition->'rules';

  -- Initialize result based on type
  IF v_type = 'AND' THEN
    v_result := TRUE;
  ELSIF v_type = 'OR' THEN
    v_result := FALSE;
  ELSE
    RAISE EXCEPTION 'Invalid condition type: %', v_type;
  END IF;

  -- Evaluate each rule
  FOR v_rule IN SELECT * FROM jsonb_array_elements(v_rules)
  LOOP
    v_rule_result := evaluate_condition_rule(v_rule, p_context);

    -- Apply AND/OR logic
    IF v_type = 'AND' THEN
      v_result := v_result AND v_rule_result;
      -- Short-circuit: if any rule is false, result is false
      IF NOT v_result THEN
        RETURN FALSE;
      END IF;
    ELSIF v_type = 'OR' THEN
      v_result := v_result OR v_rule_result;
      -- Short-circuit: if any rule is true, result is true
      IF v_result THEN
        RETURN TRUE;
      END IF;
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: evaluate_bom_materials
-- Purpose: Get filtered BOM items for a WO based on order flags
-- ============================================================================

CREATE OR REPLACE FUNCTION evaluate_bom_materials(
  p_bom_id INTEGER,
  p_wo_context JSONB
)
RETURNS TABLE (
  bom_item_id INTEGER,
  material_id INTEGER,
  quantity NUMERIC,
  uom VARCHAR,
  sequence INTEGER,
  is_conditional BOOLEAN,
  condition_met BOOLEAN,
  condition JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id AS bom_item_id,
    bi.material_id,
    bi.quantity,
    bi.uom,
    bi.sequence,
    (bi.condition IS NOT NULL) AS is_conditional,
    evaluate_bom_item_condition(bi.condition, p_wo_context) AS condition_met,
    bi.condition
  FROM bom_items bi
  WHERE bi.bom_id = p_bom_id
    AND bi.is_by_product = FALSE  -- Only materials, not by-products
    -- Include item if:
    -- 1. It's unconditional (condition IS NULL), OR
    -- 2. It's conditional AND condition is met
    AND (
      bi.condition IS NULL 
      OR 
      evaluate_bom_item_condition(bi.condition, p_wo_context)
    )
  ORDER BY bi.sequence ASC, bi.id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- FUNCTION: get_all_bom_materials_with_evaluation
-- Purpose: Get ALL BOM items with condition evaluation (for UI display)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_bom_materials_with_evaluation(
  p_bom_id INTEGER,
  p_wo_context JSONB
)
RETURNS TABLE (
  bom_item_id INTEGER,
  material_id INTEGER,
  quantity NUMERIC,
  uom VARCHAR,
  sequence INTEGER,
  is_conditional BOOLEAN,
  condition_met BOOLEAN,
  condition JSONB,
  is_by_product BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.id AS bom_item_id,
    bi.material_id,
    bi.quantity,
    bi.uom,
    bi.sequence,
    (bi.condition IS NOT NULL) AS is_conditional,
    evaluate_bom_item_condition(bi.condition, p_wo_context) AS condition_met,
    bi.condition,
    bi.is_by_product
  FROM bom_items bi
  WHERE bi.bom_id = p_bom_id
  ORDER BY 
    bi.is_by_product ASC,  -- Materials first, then by-products
    bi.sequence ASC, 
    bi.id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON FUNCTION evaluate_condition_rule IS 
'Evaluates a single condition rule against WO context. 
Supports operators: equals, not_equals, contains, not_contains, greater_than, less_than, in.
Example rule: {"field": "order_flags", "operator": "contains", "value": "organic"}';

COMMENT ON FUNCTION evaluate_bom_item_condition IS 
'Evaluates full condition with AND/OR logic. 
Returns TRUE if condition is met or NULL (unconditional).
Example: {"type": "OR", "rules": [{"field": "order_flags", "operator": "contains", "value": "organic"}]}';

COMMENT ON FUNCTION evaluate_bom_materials IS 
'Returns filtered BOM materials for a Work Order based on order flags.
Only returns materials where condition is NULL (unconditional) or condition evaluates to TRUE.
Example context: {"order_flags": ["organic", "gluten_free"], "customer_id": 123}';

COMMENT ON FUNCTION get_all_bom_materials_with_evaluation IS 
'Returns ALL BOM items (materials + by-products) with condition evaluation results.
Used for UI to show which items will be included vs excluded based on WO context.';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
Example 1: Simple organic flag
SELECT * FROM evaluate_bom_materials(
  123,  -- BOM ID
  '{"order_flags": ["organic"]}'::JSONB
);

Example 2: Multiple flags (gluten-free AND vegan)
SELECT * FROM evaluate_bom_materials(
  123,
  '{"order_flags": ["gluten_free", "vegan"]}'::JSONB
);

Example 3: Customer-specific packaging
SELECT * FROM evaluate_bom_materials(
  123,
  '{"customer_id": 456, "order_flags": ["custom_packaging"]}'::JSONB
);

Example 4: Get all items with evaluation (for UI)
SELECT * FROM get_all_bom_materials_with_evaluation(
  123,
  '{"order_flags": ["organic"]}'::JSONB
);

-- This returns:
-- bom_item_id | material_id | quantity | condition_met | is_conditional
-- 1           | 100         | 10.0     | TRUE          | FALSE  (unconditional)
-- 2           | 101         | 5.0      | TRUE          | TRUE   (organic condition met)
-- 3           | 102         | 3.0      | FALSE         | TRUE   (non-organic, excluded)
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 050_wo_order_flags.sql
-- Description: Add order_flags and context fields to work_orders for conditional BOM evaluation
-- Epic: EPIC-001 BOM Complexity v2 - Phase 3 (Conditional Components)
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: work_orders
-- Add order context fields for conditional material selection
-- ============================================================================

-- Add order_flags array (e.g., ['organic', 'gluten_free', 'vegan'])
ALTER TABLE work_orders 
  ADD COLUMN IF NOT EXISTS order_flags TEXT[] DEFAULT '{}';

-- Add customer_id for customer-specific conditions
ALTER TABLE work_orders 
  ADD COLUMN IF NOT EXISTS customer_id INTEGER;

-- Add order_type for type-based conditions (e.g., 'standard', 'export', 'premium')
ALTER TABLE work_orders 
  ADD COLUMN IF NOT EXISTS order_type VARCHAR(50);

-- ============================================================================
-- INDEXES
-- Add indexes for efficient filtering
-- ============================================================================

-- GIN index for order_flags array queries
CREATE INDEX IF NOT EXISTS idx_work_orders_order_flags 
  ON work_orders USING GIN (order_flags)
  WHERE order_flags IS NOT NULL AND array_length(order_flags, 1) > 0;

-- B-tree index for customer_id
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id 
  ON work_orders (customer_id)
  WHERE customer_id IS NOT NULL;

-- B-tree index for order_type
CREATE INDEX IF NOT EXISTS idx_work_orders_order_type 
  ON work_orders (order_type)
  WHERE order_type IS NOT NULL;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN work_orders.order_flags IS 
'Array of order-specific flags used for conditional BOM material selection.
Example: [''organic'', ''gluten_free'', ''vegan'']
These flags are evaluated against bom_items.condition to determine which materials are required.';

COMMENT ON COLUMN work_orders.customer_id IS 
'Optional customer ID for customer-specific material conditions.
Can be used in bom_items.condition rules like {"field": "customer_id", "operator": "equals", "value": "123"}';

COMMENT ON COLUMN work_orders.order_type IS 
'Optional order type for type-based material conditions.
Examples: ''standard'', ''export'', ''premium'', ''sample''
Can be used in condition rules to select different packaging or materials.';

-- ============================================================================
-- EXAMPLE WORK ORDERS WITH FLAGS
-- ============================================================================

/*
Example 1: Organic product order
INSERT INTO work_orders (wo_number, product_id, quantity, order_flags, status)
VALUES ('WO-2025-001', 123, 100, ARRAY['organic'], 'planned');

Example 2: Gluten-free AND vegan order
INSERT INTO work_orders (wo_number, product_id, quantity, order_flags, status)
VALUES ('WO-2025-002', 123, 50, ARRAY['gluten_free', 'vegan'], 'planned');

Example 3: Customer-specific with custom packaging
INSERT INTO work_orders (wo_number, product_id, quantity, order_flags, customer_id, status)
VALUES ('WO-2025-003', 123, 200, ARRAY['custom_packaging'], 456, 'planned');

Example 4: Export order with premium packaging
INSERT INTO work_orders (wo_number, product_id, quantity, order_flags, order_type, status)
VALUES ('WO-2025-004', 123, 500, ARRAY['premium'], 'export', 'planned');

-- Query materials for a specific WO
SELECT * FROM evaluate_bom_materials(
  123,  -- BOM ID
  jsonb_build_object(
    'order_flags', ARRAY['organic', 'gluten_free'],
    'customer_id', 456,
    'order_type', 'export'
  )
);
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 051_asn_tables.sql
-- Description: Create ASN (Advanced Shipping Notice) tables for receiving workflow
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 1
-- Created: 2025-01-12

-- ============================================================================
-- TABLE: asns (Advanced Shipping Notices)
-- Purpose: Pre-notification of incoming shipments from suppliers
-- ============================================================================

CREATE TABLE IF NOT EXISTS asns (
  id SERIAL PRIMARY KEY,
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES purchase_orders(id),
  supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
  expected_arrival TIMESTAMPTZ NOT NULL,
  actual_arrival TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'submitted', 'received', 'cancelled')),
  notes TEXT,
  attachments JSONB, -- Array of file URLs/metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================================================
-- TABLE: asn_items (ASN Line Items)
-- Purpose: Individual products expected in the shipment
-- ============================================================================

CREATE TABLE IF NOT EXISTS asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id) ON DELETE CASCADE NOT NULL,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  quantity NUMERIC(10,4) NOT NULL CHECK (quantity > 0),
  uom VARCHAR(20) NOT NULL,
  batch VARCHAR(50), -- Pre-assigned batch from supplier
  expiry_date DATE, -- Pre-assigned expiry from supplier
  lp_number VARCHAR(50), -- Pre-assigned LP number from supplier (optional)
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- B-tree indexes for common queries
CREATE INDEX IF NOT EXISTS idx_asns_asn_number ON asns(asn_number);
CREATE INDEX IF NOT EXISTS idx_asns_po_id ON asns(po_id) WHERE po_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_asns_supplier_id ON asns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_asns_status ON asns(status);
CREATE INDEX IF NOT EXISTS idx_asns_expected_arrival ON asns(expected_arrival);

-- Composite index for warehouse dashboard queries
CREATE INDEX IF NOT EXISTS idx_asns_status_expected ON asns(status, expected_arrival);

-- ASN items indexes
CREATE INDEX IF NOT EXISTS idx_asn_items_asn_id ON asn_items(asn_id);
CREATE INDEX IF NOT EXISTS idx_asn_items_product_id ON asn_items(product_id);
CREATE INDEX IF NOT EXISTS idx_asn_items_batch ON asn_items(batch) WHERE batch IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE asns ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow full access to authenticated users
CREATE POLICY "Allow full access to asns for authenticated users"
ON asns TO authenticated
USING (TRUE)
WITH CHECK (TRUE);

CREATE POLICY "Allow full access to asn_items for authenticated users"
ON asn_items TO authenticated
USING (TRUE)
WITH CHECK (TRUE);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Note: Updated_at trigger can be added if moddatetime extension is enabled
-- CREATE TRIGGER handle_updated_at BEFORE UPDATE ON asns
-- FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE asns IS 
'Advanced Shipping Notices - Pre-notifications of incoming shipments from suppliers.
Used to prefill receiving (GRN) with expected quantities, batches, and expiry dates.';

COMMENT ON COLUMN asns.asn_number IS 'Unique ASN identifier, often from supplier EDI/system';
COMMENT ON COLUMN asns.po_id IS 'Optional link to Purchase Order if ASN is for a PO shipment';
COMMENT ON COLUMN asns.expected_arrival IS 'Expected arrival date/time at warehouse dock';
COMMENT ON COLUMN asns.actual_arrival IS 'Actual arrival date/time (set when truck arrives)';
COMMENT ON COLUMN asns.attachments IS 'Array of attachment metadata: [{"name": "packing_list.pdf", "url": "..."}]';

COMMENT ON TABLE asn_items IS 
'Line items in an ASN - individual products expected in the shipment.
May include pre-assigned batch numbers and expiry dates from supplier.';

COMMENT ON COLUMN asn_items.batch IS 'Supplier batch/lot number (if provided in advance)';
COMMENT ON COLUMN asn_items.expiry_date IS 'Product expiry date (if provided in advance)';
COMMENT ON COLUMN asn_items.lp_number IS 'Pre-assigned license plate number from supplier (rare, but supported)';

-- ============================================================================
-- RPC FUNCTION: get_asns_for_receiving
-- Purpose: Get ASNs ready for receiving (submitted status, not yet received)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_asns_for_receiving()
RETURNS TABLE (
  asn_id INTEGER,
  asn_number VARCHAR,
  supplier_name VARCHAR,
  expected_arrival TIMESTAMPTZ,
  items_count INTEGER,
  total_quantity NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS asn_id,
    a.asn_number,
    s.name AS supplier_name,
    a.expected_arrival,
    COUNT(ai.id)::INTEGER AS items_count,
    SUM(ai.quantity) AS total_quantity
  FROM asns a
  INNER JOIN suppliers s ON a.supplier_id = s.id
  LEFT JOIN asn_items ai ON a.id = ai.asn_id
  WHERE a.status = 'submitted'
  GROUP BY a.id, a.asn_number, s.name, a.expected_arrival
  ORDER BY a.expected_arrival ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_asns_for_receiving IS 
'Returns list of ASNs ready for receiving (submitted status).
Used by warehouse operators to see incoming shipments.';

-- ============================================================================
-- EXAMPLE DATA
-- ============================================================================

/*
Example 1: Create ASN for incoming PO
INSERT INTO asns (asn_number, po_id, supplier_id, expected_arrival, status)
VALUES ('ASN-2025-001', 1, 1, '2025-01-15 10:00:00+00', 'submitted');

INSERT INTO asn_items (asn_id, product_id, quantity, uom, batch, expiry_date)
VALUES 
  (1, 101, 1000, 'kg', 'BATCH-2025-A', '2025-12-31'),
  (1, 102, 500, 'kg', 'BATCH-2025-B', '2025-11-30');

Example 2: Create ASN without PO (spot purchase)
INSERT INTO asns (asn_number, supplier_id, expected_arrival, status, notes)
VALUES ('ASN-2025-002', 2, '2025-01-16 14:00:00+00', 'submitted', 'Urgent delivery');

Example 3: Query ASNs ready for receiving
SELECT * FROM get_asns_for_receiving();

Example 4: Link ASN to GRN
-- When receiving ASN-2025-001, create GRN:
INSERT INTO grns (grn_number, po_id, status, received_date)
VALUES ('GRN-2025-001', 1, 'completed', NOW());

-- Create LPs from ASN items with pre-filled batch/expiry:
INSERT INTO license_plates (lp_number, product_id, location_id, quantity, qa_status, batch, expiry_date, grn_id)
SELECT 
  generate_lp_number(),
  ai.product_id,
  get_default_receiving_location(),
  ai.quantity,
  'Pending',
  ai.batch,
  ai.expiry_date,
  1
FROM asn_items ai
WHERE ai.asn_id = 1;

-- Update ASN status
UPDATE asns SET status = 'received', actual_arrival = NOW() WHERE id = 1;
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 052_license_plates_enhance.sql
-- Description: Enhance license_plates table with batch, expiry, uom, genealogy support
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 1
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: license_plates
-- Add fields for batch tracking, expiry, and genealogy
-- ============================================================================

-- Add batch/lot tracking
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS batch VARCHAR(50);

-- Add expiry date tracking
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add unit of measure
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS uom VARCHAR(20) NOT NULL DEFAULT 'kg';

-- Add parent LP for split/merge genealogy
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS parent_lp_id INTEGER REFERENCES license_plates(id);

-- Add consumption tracking
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS is_consumed BOOLEAN DEFAULT FALSE;

ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;

ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS consumed_by UUID REFERENCES users(id);

-- Add ASN reference (optional - if LP created from ASN)
ALTER TABLE license_plates 
  ADD COLUMN IF NOT EXISTS asn_id INTEGER REFERENCES asns(id);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Batch/lot traceability
CREATE INDEX IF NOT EXISTS idx_license_plates_batch 
  ON license_plates(batch) 
  WHERE batch IS NOT NULL;

-- Expiry date tracking (for FIFO/FEFO)
CREATE INDEX IF NOT EXISTS idx_license_plates_expiry 
  ON license_plates(expiry_date) 
  WHERE expiry_date IS NOT NULL;

-- Genealogy tracking
CREATE INDEX IF NOT EXISTS idx_license_plates_parent 
  ON license_plates(parent_lp_id) 
  WHERE parent_lp_id IS NOT NULL;

-- Consumption tracking
CREATE INDEX IF NOT EXISTS idx_license_plates_consumed 
  ON license_plates(is_consumed, consumed_at) 
  WHERE is_consumed = TRUE;

-- ASN traceability
CREATE INDEX IF NOT EXISTS idx_license_plates_asn 
  ON license_plates(asn_id) 
  WHERE asn_id IS NOT NULL;

-- Composite index for FIFO/FEFO picking
CREATE INDEX IF NOT EXISTS idx_license_plates_fifo 
  ON license_plates(product_id, location_id, expiry_date, created_at) 
  WHERE is_consumed = FALSE AND qa_status = 'Passed';

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Expiry date must be in the future (when set)
ALTER TABLE license_plates 
  ADD CONSTRAINT check_expiry_future 
  CHECK (expiry_date IS NULL OR expiry_date > CURRENT_DATE);

-- Quantity must be positive for non-consumed LPs
ALTER TABLE license_plates 
  ADD CONSTRAINT check_quantity_positive 
  CHECK (is_consumed = TRUE OR quantity > 0);

-- Consumed LP must have consumed_at and consumed_by
ALTER TABLE license_plates 
  ADD CONSTRAINT check_consumption_complete 
  CHECK (
    (is_consumed = FALSE AND consumed_at IS NULL AND consumed_by IS NULL) OR
    (is_consumed = TRUE AND consumed_at IS NOT NULL AND consumed_by IS NOT NULL)
  );

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN license_plates.batch IS 
'Batch or lot number for traceability. 
May come from supplier (ASN) or be assigned at production.
Used for full backward/forward traceability.';

COMMENT ON COLUMN license_plates.expiry_date IS 
'Product expiry date. Used for FEFO (First Expired, First Out) picking.
May come from supplier or be calculated at production.';

COMMENT ON COLUMN license_plates.uom IS 
'Unit of measure for the quantity. Must match product base UOM or be convertible.
Common values: kg, pcs, box, pallet';

COMMENT ON COLUMN license_plates.parent_lp_id IS 
'Parent LP ID if this LP was created by splitting another LP.
Used for genealogy tracking (parent → child relationship).';

COMMENT ON COLUMN license_plates.is_consumed IS 
'TRUE if this LP has been fully consumed in production.
Consumed LPs cannot be moved, split, or used again.';

COMMENT ON COLUMN license_plates.consumed_at IS 
'Timestamp when LP was consumed. Set when is_consumed = TRUE.';

COMMENT ON COLUMN license_plates.consumed_by IS 
'User who consumed this LP. Set when is_consumed = TRUE.';

COMMENT ON COLUMN license_plates.asn_id IS 
'ASN ID if this LP was created from an ASN item.
Used for tracing received goods back to shipping notice.';

-- ============================================================================
-- RPC FUNCTION: get_lp_fifo
-- Purpose: Get next LP for FIFO/FEFO picking
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_fifo(
  p_product_id INTEGER,
  p_location_id INTEGER DEFAULT NULL,
  p_required_quantity NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  quantity NUMERIC,
  uom VARCHAR,
  batch VARCHAR,
  expiry_date DATE,
  created_at TIMESTAMPTZ,
  location_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id AS lp_id,
    lp.lp_number,
    lp.quantity,
    lp.uom,
    lp.batch,
    lp.expiry_date,
    lp.created_at,
    l.name AS location_name
  FROM license_plates lp
  INNER JOIN locations l ON lp.location_id = l.id
  WHERE lp.product_id = p_product_id
    AND lp.is_consumed = FALSE
    AND lp.qa_status = 'Passed'
    AND (p_location_id IS NULL OR lp.location_id = p_location_id)
    AND (p_required_quantity IS NULL OR lp.quantity >= p_required_quantity)
  ORDER BY 
    -- FEFO: First Expired First Out
    COALESCE(lp.expiry_date, '9999-12-31'::DATE) ASC,
    -- FIFO: First In First Out (as tiebreaker)
    lp.created_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_fifo IS 
'Returns license plates for FIFO/FEFO picking.
Orders by expiry_date first (FEFO), then created_at (FIFO).
Filters: Available QA status, not consumed, optional location/quantity filters.';

-- ============================================================================
-- RPC FUNCTION: get_lp_genealogy_chain
-- Purpose: Get full genealogy chain (parent → children)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_genealogy_chain(p_lp_id INTEGER)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  parent_lp_id INTEGER,
  parent_lp_number VARCHAR,
  level INTEGER,
  quantity NUMERIC,
  batch VARCHAR
) AS $$
WITH RECURSIVE 
  -- Get parents (upward)
  parents AS (
    SELECT 
      lp.id AS lp_id,
      lp.lp_number,
      lp.parent_lp_id,
      parent.lp_number AS parent_lp_number,
      0 AS level,
      lp.quantity,
      lp.batch
    FROM license_plates lp
    LEFT JOIN license_plates parent ON lp.parent_lp_id = parent.id
    WHERE lp.id = p_lp_id

    UNION ALL

    SELECT 
      parent.id AS lp_id,
      parent.lp_number,
      parent.parent_lp_id,
      grandparent.lp_number AS parent_lp_number,
      p.level - 1 AS level,
      parent.quantity,
      parent.batch
    FROM license_plates parent
    INNER JOIN parents p ON parent.id = p.parent_lp_id
    LEFT JOIN license_plates grandparent ON parent.parent_lp_id = grandparent.id
  ),
  -- Get children (downward)
  children AS (
    SELECT 
      lp.id AS lp_id,
      lp.lp_number,
      lp.parent_lp_id,
      parent.lp_number AS parent_lp_number,
      0 AS level,
      lp.quantity,
      lp.batch
    FROM license_plates lp
    LEFT JOIN license_plates parent ON lp.parent_lp_id = parent.id
    WHERE lp.id = p_lp_id

    UNION ALL

    SELECT 
      child.id AS lp_id,
      child.lp_number,
      child.parent_lp_id,
      parent_lp.lp_number AS parent_lp_number,
      c.level + 1 AS level,
      child.quantity,
      child.batch
    FROM license_plates child
    INNER JOIN children c ON child.parent_lp_id = c.lp_id
    LEFT JOIN license_plates parent_lp ON child.parent_lp_id = parent_lp.id
  )
SELECT * FROM parents WHERE level < 0
UNION ALL
SELECT * FROM (SELECT * FROM children WHERE level = 0 LIMIT 1) AS base
UNION ALL
SELECT * FROM children WHERE level > 0
ORDER BY level ASC, lp_id ASC;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_lp_genealogy_chain IS 
'Returns complete genealogy chain for a license plate.
Level 0 = target LP, negative = parents, positive = children.
Used for traceability: "Where did this LP come from?" and "Where did it go?"';

-- ============================================================================
-- DATA MIGRATION
-- Set default UOM for existing LPs based on product
-- ============================================================================

-- Update existing LPs to have UOM from their product
UPDATE license_plates lp
SET uom = p.uom
FROM products p
WHERE lp.product_id = p.id
  AND lp.uom = 'kg'; -- Only update default value

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration: 053_grn_asn_link.sql
-- Description: Add ASN reference to GRNs for ASN receiving workflow
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 1
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: grns
-- Add ASN foreign key to link GRN to source ASN
-- ============================================================================

ALTER TABLE grns
  ADD COLUMN IF NOT EXISTS asn_id INTEGER REFERENCES asns(id);

-- Add index for ASN lookups
CREATE INDEX IF NOT EXISTS idx_grns_asn ON grns(asn_id) WHERE asn_id IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN grns.asn_id IS 
'Optional link to Advanced Shipping Notice if this GRN was created from an ASN.
Used to track which ASN was received and to prefill GRN items with ASN data.';

-- ============================================================================
-- RPC FUNCTION: create_grn_from_asn
-- Purpose: Create GRN with prefilled items from ASN
-- ============================================================================

CREATE OR REPLACE FUNCTION create_grn_from_asn(
  p_asn_id INTEGER,
  p_received_by INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  grn_id INTEGER,
  grn_number VARCHAR,
  items_created INTEGER
) AS $$
DECLARE
  v_grn_id INTEGER;
  v_grn_number VARCHAR(50);
  v_po_id INTEGER;
  v_supplier_id INTEGER;
  v_items_count INTEGER := 0;
BEGIN
  -- Get ASN details
  SELECT po_id, supplier_id 
  INTO v_po_id, v_supplier_id
  FROM asns
  WHERE id = p_asn_id AND status = 'submitted';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ASN % not found or not in submitted status', p_asn_id;
  END IF;

  -- Generate GRN number (GRN-YYYY-NNN format)
  SELECT 'GRN-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
         LPAD((COUNT(*) + 1)::TEXT, 3, '0')
  INTO v_grn_number
  FROM grns
  WHERE grn_number LIKE 'GRN-' || TO_CHAR(NOW(), 'YYYY') || '-%';

  -- Create GRN header
  INSERT INTO grns (
    grn_number,
    po_id,
    asn_id,
    supplier_id,
    status,
    received_date,
    received_by,
    notes
  ) VALUES (
    v_grn_number,
    v_po_id,
    p_asn_id,
    v_supplier_id,
    'draft',
    NOW(),
    p_received_by,
    COALESCE(p_notes, 'Received from ASN')
  )
  RETURNING id INTO v_grn_id;

  -- Create GRN items from ASN items
  INSERT INTO grn_items (
    grn_id,
    product_id,
    quantity_received,
    uom,
    batch,
    expiry_date,
    notes
  )
  SELECT
    v_grn_id,
    ai.product_id,
    ai.quantity, -- Start with expected quantity
    ai.uom,
    ai.batch,
    ai.expiry_date,
    ai.notes
  FROM asn_items ai
  WHERE ai.asn_id = p_asn_id;

  GET DIAGNOSTICS v_items_count = ROW_COUNT;

  -- Mark ASN as received
  UPDATE asns
  SET 
    status = 'received',
    actual_arrival = NOW()
  WHERE id = p_asn_id;

  RETURN QUERY
  SELECT v_grn_id, v_grn_number, v_items_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_grn_from_asn IS 
'Creates a GRN from an ASN with prefilled items.
Copies ASN items to GRN items with batch/expiry data.
Marks ASN as received.
Returns created GRN ID, number, and items count.';

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
-- Example: Create GRN from ASN
SELECT * FROM create_grn_from_asn(
  p_asn_id := 1,
  p_received_by := 123,
  p_notes := 'Received all items in good condition'
);

-- Result:
-- grn_id | grn_number    | items_created
-- -------|---------------|---------------
--     5  | GRN-2025-001  |             3

-- After this:
-- - GRN created with status 'draft'
-- - 3 GRN items created (prefilled from ASN items)
-- - ASN status changed to 'received'
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration 053: LP Genealogy RPC Functions
-- Purpose: RPC functions for license plate genealogy and composition tracking
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 2: LP Genealogy & Traceability
-- Date: 2025-01-12
-- Dependencies: 027_lp_compositions, 028_lp_genealogy, 052_license_plates_enhance

-- ============================================================================
-- 1. GET LP COMPOSITION TREE (Forward)
-- Purpose: Get forward composition tree (what inputs went into this output)
-- Used by: LicensePlatesAPI.getLPComposition()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_composition_tree(lp_id_param INTEGER)
RETURNS TABLE (
  node_id INTEGER,
  node_type TEXT,
  lp_number VARCHAR,
  product_description TEXT,
  quantity NUMERIC,
  uom VARCHAR,
  qa_status VARCHAR,
  stage_suffix VARCHAR,
  location TEXT,
  parent_node TEXT,
  depth INTEGER,
  composition_qty NUMERIC,
  pallet_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE composition_tree AS (
    -- Base case: starting LP
    SELECT
      lp.id AS node_id,
      'lp'::TEXT AS node_type,
      lp.lp_number,
      p.description AS product_description,
      lp.quantity,
      lp.uom,
      lp.qa_status,
      lp.stage_suffix,
      l.name AS location,
      NULL::TEXT AS parent_node,
      0 AS depth,
      lp.quantity AS composition_qty,
      NULL::TEXT AS pallet_code
    FROM license_plates lp
    INNER JOIN products p ON lp.product_id = p.id
    INNER JOIN locations l ON lp.location_id = l.id
    WHERE lp.id = lp_id_param

    UNION ALL

    -- Recursive case: find inputs that went into outputs
    SELECT
      input_lp.id AS node_id,
      'lp'::TEXT AS node_type,
      input_lp.lp_number,
      p.description AS product_description,
      input_lp.quantity,
      input_lp.uom,
      input_lp.qa_status,
      input_lp.stage_suffix,
      l.name AS location,
      ct.lp_number AS parent_node,
      ct.depth + 1 AS depth,
      comp.qty AS composition_qty,
      NULL::TEXT AS pallet_code
    FROM composition_tree ct
    INNER JOIN lp_compositions comp ON comp.output_lp_id = ct.node_id
    INNER JOIN license_plates input_lp ON comp.input_lp_id = input_lp.id
    INNER JOIN products p ON input_lp.product_id = p.id
    INNER JOIN locations l ON input_lp.location_id = l.id
    WHERE ct.depth < 10 -- Prevent infinite loops
  )
  SELECT * FROM composition_tree
  ORDER BY depth ASC, node_id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_composition_tree IS
'Returns forward composition tree for a license plate.
Shows what input LPs were consumed to create this output LP.
Depth 0 = target LP, depth 1+ = inputs (recursively).
Used for traceability: "What raw materials went into this finished good?"';

-- ============================================================================
-- 2. GET LP REVERSE COMPOSITION TREE (Backward)
-- Purpose: Get reverse composition tree (what outputs used this input)
-- Used by: LicensePlatesAPI.getLPComposition()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_reverse_composition_tree(lp_id_param INTEGER)
RETURNS TABLE (
  node_id INTEGER,
  node_type TEXT,
  lp_number VARCHAR,
  product_description TEXT,
  quantity NUMERIC,
  uom VARCHAR,
  qa_status VARCHAR,
  stage_suffix VARCHAR,
  location TEXT,
  parent_node TEXT,
  depth INTEGER,
  composition_qty NUMERIC,
  pallet_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE reverse_tree AS (
    -- Base case: starting LP
    SELECT
      lp.id AS node_id,
      'lp'::TEXT AS node_type,
      lp.lp_number,
      p.description AS product_description,
      lp.quantity,
      lp.uom,
      lp.qa_status,
      lp.stage_suffix,
      l.name AS location,
      NULL::TEXT AS parent_node,
      0 AS depth,
      lp.quantity AS composition_qty,
      NULL::TEXT AS pallet_code
    FROM license_plates lp
    INNER JOIN products p ON lp.product_id = p.id
    INNER JOIN locations l ON lp.location_id = l.id
    WHERE lp.id = lp_id_param

    UNION ALL

    -- Recursive case: find outputs that used this input
    SELECT
      output_lp.id AS node_id,
      'lp'::TEXT AS node_type,
      output_lp.lp_number,
      p.description AS product_description,
      output_lp.quantity,
      output_lp.uom,
      output_lp.qa_status,
      output_lp.stage_suffix,
      l.name AS location,
      rt.lp_number AS parent_node,
      rt.depth + 1 AS depth,
      comp.qty AS composition_qty,
      NULL::TEXT AS pallet_code
    FROM reverse_tree rt
    INNER JOIN lp_compositions comp ON comp.input_lp_id = rt.node_id
    INNER JOIN license_plates output_lp ON comp.output_lp_id = output_lp.id
    INNER JOIN products p ON output_lp.product_id = p.id
    INNER JOIN locations l ON output_lp.location_id = l.id
    WHERE rt.depth < 10 -- Prevent infinite loops
  )
  SELECT * FROM reverse_tree
  ORDER BY depth ASC, node_id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_reverse_composition_tree IS
'Returns reverse composition tree for a license plate.
Shows what output LPs used this input LP.
Depth 0 = target LP, depth 1+ = outputs that consumed it (recursively).
Used for traceability: "Where was this raw material used?"';

-- ============================================================================
-- 3. GET LP GENEALOGY TREE (Parent → Children)
-- Purpose: Get genealogy tree (parent-child relationships via splits)
-- Used by: LicensePlatesAPI.getGenealogy()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_genealogy_tree(lp_id_param INTEGER)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  parent_lp_id INTEGER,
  parent_lp_number VARCHAR,
  level INTEGER,
  quantity NUMERIC,
  uom VARCHAR,
  batch VARCHAR,
  expiry_date DATE,
  product_description TEXT,
  location TEXT,
  qa_status VARCHAR,
  is_consumed BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE genealogy_tree AS (
    -- Base case: starting LP
    SELECT
      lp.id AS lp_id,
      lp.lp_number,
      lp.parent_lp_id,
      parent.lp_number AS parent_lp_number,
      0 AS level,
      lp.quantity,
      lp.uom,
      lp.batch,
      lp.expiry_date,
      p.description AS product_description,
      l.name AS location,
      lp.qa_status,
      lp.is_consumed,
      lp.created_at
    FROM license_plates lp
    LEFT JOIN license_plates parent ON lp.parent_lp_id = parent.id
    INNER JOIN products p ON lp.product_id = p.id
    INNER JOIN locations l ON lp.location_id = l.id
    WHERE lp.id = lp_id_param

    UNION ALL

    -- Recursive case: find children (LPs that have this LP as parent)
    SELECT
      child.id AS lp_id,
      child.lp_number,
      child.parent_lp_id,
      gt.lp_number AS parent_lp_number,
      gt.level + 1 AS level,
      child.quantity,
      child.uom,
      child.batch,
      child.expiry_date,
      p.description AS product_description,
      l.name AS location,
      child.qa_status,
      child.is_consumed,
      child.created_at
    FROM genealogy_tree gt
    INNER JOIN license_plates child ON child.parent_lp_id = gt.lp_id
    INNER JOIN products p ON child.product_id = p.id
    INNER JOIN locations l ON child.location_id = l.id
    WHERE gt.level < 10 -- Prevent infinite loops
  )
  SELECT * FROM genealogy_tree
  ORDER BY level ASC, lp_id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_genealogy_tree IS
'Returns genealogy tree for a license plate (parent → children via splits).
Level 0 = target LP, level 1+ = children created from splitting.
Shows full split chain: original LP → split 1 → split 2 → etc.
Used for traceability: "What child LPs were created from this parent?"';

-- ============================================================================
-- 4. GET LP REVERSE GENEALOGY (Children → Parent)
-- Purpose: Get reverse genealogy (where did this LP come from)
-- Used by: LicensePlatesAPI.getReverseGenealogy()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lp_reverse_genealogy(lp_id_param INTEGER)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  parent_lp_id INTEGER,
  parent_lp_number VARCHAR,
  level INTEGER,
  quantity NUMERIC,
  uom VARCHAR,
  batch VARCHAR,
  expiry_date DATE,
  product_description TEXT,
  location TEXT,
  qa_status VARCHAR,
  is_consumed BOOLEAN,
  created_at TIMESTAMPTZ,
  quantity_consumed NUMERIC,
  wo_number VARCHAR,
  operation_sequence INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE reverse_genealogy AS (
    -- Base case: starting LP
    SELECT
      lp.id AS lp_id,
      lp.lp_number,
      lp.parent_lp_id,
      parent.lp_number AS parent_lp_number,
      0 AS level,
      lp.quantity,
      lp.uom,
      lp.batch,
      lp.expiry_date,
      p.description AS product_description,
      l.name AS location,
      lp.qa_status,
      lp.is_consumed,
      lp.created_at,
      NULL::NUMERIC AS quantity_consumed,
      NULL::VARCHAR AS wo_number,
      NULL::INTEGER AS operation_sequence
    FROM license_plates lp
    LEFT JOIN license_plates parent ON lp.parent_lp_id = parent.id
    INNER JOIN products p ON lp.product_id = p.id
    INNER JOIN locations l ON lp.location_id = l.id
    WHERE lp.id = lp_id_param

    UNION ALL

    -- Recursive case: find parents (walk up the genealogy tree)
    SELECT
      parent_lp.id AS lp_id,
      parent_lp.lp_number,
      parent_lp.parent_lp_id,
      grandparent.lp_number AS parent_lp_number,
      rg.level - 1 AS level,
      parent_lp.quantity,
      parent_lp.uom,
      parent_lp.batch,
      parent_lp.expiry_date,
      p.description AS product_description,
      l.name AS location,
      parent_lp.qa_status,
      parent_lp.is_consumed,
      parent_lp.created_at,
      gen.quantity_consumed,
      wo.wo_number,
      gen.operation_sequence
    FROM reverse_genealogy rg
    INNER JOIN license_plates parent_lp ON rg.parent_lp_id = parent_lp.id
    LEFT JOIN license_plates grandparent ON parent_lp.parent_lp_id = grandparent.id
    LEFT JOIN lp_genealogy gen ON gen.child_lp_id = rg.lp_id
    LEFT JOIN work_orders wo ON gen.wo_id = wo.id
    INNER JOIN products p ON parent_lp.product_id = p.id
    INNER JOIN locations l ON parent_lp.location_id = l.id
    WHERE rg.level > -10 -- Prevent infinite loops
  )
  SELECT * FROM reverse_genealogy
  ORDER BY level DESC, lp_id ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_lp_reverse_genealogy IS
'Returns reverse genealogy for a license plate (child → parent chain).
Level 0 = target LP, level -1, -2, etc = parents (walked up genealogy tree).
Shows full lineage: where this LP came from originally.
Includes lp_genealogy data: quantity_consumed, wo_number, operation_sequence.
Used for traceability: "Where did this LP originate from?"';

-- ============================================================================
-- 5. GET ASNs FOR RECEIVING (Enhanced)
-- Purpose: Get ASNs ready for receiving (submitted status) with summary info
-- Note: This was referenced in ASNsAPI but missing from migrations
-- ============================================================================

CREATE OR REPLACE FUNCTION get_asns_for_receiving()
RETURNS TABLE (
  id INTEGER,
  asn_number VARCHAR,
  supplier_id INTEGER,
  supplier_name VARCHAR,
  expected_arrival DATE,
  status VARCHAR,
  total_items INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.asn_number,
    a.supplier_id,
    s.name AS supplier_name,
    a.expected_arrival,
    a.status,
    COUNT(ai.id)::INTEGER AS total_items,
    a.created_at
  FROM asns a
  INNER JOIN suppliers s ON a.supplier_id = s.id
  LEFT JOIN asn_items ai ON a.id = ai.asn_id
  WHERE a.status = 'submitted'
  GROUP BY a.id, a.asn_number, a.supplier_id, s.name, a.expected_arrival, a.status, a.created_at
  ORDER BY a.expected_arrival ASC, a.created_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_asns_for_receiving IS
'Returns ASNs ready for receiving (submitted status).
Includes supplier info and total item count.
Used by receiving terminal to show pending ASNs.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_lp_composition_tree TO authenticated;
GRANT EXECUTE ON FUNCTION get_lp_reverse_composition_tree TO authenticated;
GRANT EXECUTE ON FUNCTION get_lp_genealogy_tree TO authenticated;
GRANT EXECUTE ON FUNCTION get_lp_reverse_genealogy TO authenticated;
GRANT EXECUTE ON FUNCTION get_asns_for_receiving TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Migration: 054_grn_items_enhance.sql
-- Description: Enhance grn_items to match ASN items structure
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 1
-- Created: 2025-01-12

-- ============================================================================
-- ALTER TABLE: grn_items
-- Add UOM and notes to match ASN items
-- ============================================================================

ALTER TABLE grn_items
  ADD COLUMN IF NOT EXISTS uom VARCHAR(20),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Set default UOM from products for existing rows
UPDATE grn_items gi
SET uom = p.uom
FROM products p
WHERE gi.product_id = p.id
  AND gi.uom IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN grn_items.uom IS 
'Unit of measure for the received quantity. Should match product base UOM.';

COMMENT ON COLUMN grn_items.notes IS 
'Optional notes for this GRN item (copied from ASN item if received from ASN).';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration 054: Phase 3 Pallet Management Enhancements
-- Purpose: Enhance pallets and pallet_items tables for Phase 3 requirements
-- Epic: EPIC-002 Scanner & Warehouse v2 - Phase 3: Pallet Management & WO Reservations
-- Date: 2025-01-12
-- Dependencies: 029_pallets, 030_pallet_items

-- ============================================================================
-- 1. ENHANCE PALLETS TABLE
-- ============================================================================

-- Add new columns to pallets table
ALTER TABLE pallets
  ADD COLUMN IF NOT EXISTS pallet_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pallet_type VARCHAR(20) DEFAULT 'EURO' CHECK (pallet_type IN ('EURO', 'CHEP', 'CUSTOM', 'OTHER')),
  ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'shipped')),
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id);

-- Migrate existing 'code' to 'pallet_number' if pallet_number is null
UPDATE pallets SET pallet_number = code WHERE pallet_number IS NULL;

-- Make pallet_number NOT NULL and UNIQUE after migration
ALTER TABLE pallets
  ALTER COLUMN pallet_number SET NOT NULL,
  ADD CONSTRAINT pallets_pallet_number_unique UNIQUE (pallet_number);

-- Make wo_id optional (some pallets might not be tied to WO)
ALTER TABLE pallets
  ALTER COLUMN wo_id DROP NOT NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pallets_pallet_number ON pallets(pallet_number);
CREATE INDEX IF NOT EXISTS idx_pallets_status ON pallets(status);
CREATE INDEX IF NOT EXISTS idx_pallets_location ON pallets(location_id);

-- Update comments
COMMENT ON TABLE pallets IS 'Pallet management for warehouse operations and finished goods packaging';
COMMENT ON COLUMN pallets.pallet_number IS 'Unique pallet identifier (barcode)';
COMMENT ON COLUMN pallets.pallet_type IS 'Type of pallet: EURO (800x1200mm), CHEP (1000x1200mm), CUSTOM, OTHER';
COMMENT ON COLUMN pallets.location_id IS 'Current location of pallet';
COMMENT ON COLUMN pallets.status IS 'Pallet status: open (can add items), closed (sealed), shipped (dispatched)';
COMMENT ON COLUMN pallets.code IS 'DEPRECATED: Use pallet_number instead';

-- ============================================================================
-- 2. ENHANCE PALLET_ITEMS TABLE
-- ============================================================================

-- Add new columns to pallet_items table
ALTER TABLE pallet_items
  ADD COLUMN IF NOT EXISTS lp_id INTEGER REFERENCES license_plates(id),
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(12,4),
  ADD COLUMN IF NOT EXISTS uom VARCHAR(20),
  ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES auth.users(id);

-- Set default quantity from box_count if not set
UPDATE pallet_items SET quantity = box_count WHERE quantity IS NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_pallet_items_lp ON pallet_items(lp_id);

-- Update comments
COMMENT ON TABLE pallet_items IS 'License plates or boxes on pallets with full traceability';
COMMENT ON COLUMN pallet_items.lp_id IS 'License plate reference (primary way to track items on pallet)';
COMMENT ON COLUMN pallet_items.quantity IS 'Quantity of LP added to pallet';
COMMENT ON COLUMN pallet_items.uom IS 'Unit of measure for quantity';
COMMENT ON COLUMN pallet_items.box_count IS 'LEGACY: Aggregated count of boxes (use quantity instead)';
COMMENT ON COLUMN pallet_items.material_snapshot IS 'BOM snapshot for traceability (optional, for complex assemblies)';

-- ============================================================================
-- 3. CREATE WO_RESERVATIONS TABLE (Replacement for lp_reservations)
-- ============================================================================

-- Note: We keep lp_reservations for backward compatibility
-- But create wo_reservations with proper structure for Phase 3

CREATE TABLE IF NOT EXISTS wo_reservations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES products(id), -- Material from BOM
  lp_id INTEGER NOT NULL REFERENCES license_plates(id), -- Actual LP reserved
  quantity_reserved NUMERIC(12,4) NOT NULL CHECK (quantity_reserved > 0),
  quantity_consumed NUMERIC(12,4) DEFAULT 0 CHECK (quantity_consumed >= 0 AND quantity_consumed <= quantity_reserved),
  uom VARCHAR(20) NOT NULL,
  operation_sequence INTEGER, -- Which BOM operation
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID REFERENCES auth.users(id),
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'consumed', 'released', 'expired')),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wo_reservations_wo ON wo_reservations(wo_id);
CREATE INDEX IF NOT EXISTS idx_wo_reservations_lp ON wo_reservations(lp_id);
CREATE INDEX IF NOT EXISTS idx_wo_reservations_material ON wo_reservations(material_id);
CREATE INDEX IF NOT EXISTS idx_wo_reservations_status ON wo_reservations(status);

-- Comments
COMMENT ON TABLE wo_reservations IS 'Material reservations for work orders with consumption tracking';
COMMENT ON COLUMN wo_reservations.material_id IS 'Product/material from BOM (what should be used)';
COMMENT ON COLUMN wo_reservations.lp_id IS 'Actual license plate reserved (inventory source)';
COMMENT ON COLUMN wo_reservations.quantity_reserved IS 'Total quantity reserved from LP';
COMMENT ON COLUMN wo_reservations.quantity_consumed IS 'Quantity actually consumed (partial consumption allowed)';
COMMENT ON COLUMN wo_reservations.operation_sequence IS 'BOM operation sequence number (for multi-step processes)';
COMMENT ON COLUMN wo_reservations.status IS 'active: reserved, consumed: fully consumed, released: reservation cancelled, expired: expired by time';

-- ============================================================================
-- 4. CREATE RPC FUNCTIONS FOR WO RESERVATIONS
-- ============================================================================

-- Function: Get WO Required Materials with Reservation Status
CREATE OR REPLACE FUNCTION get_wo_required_materials(wo_id_param INTEGER)
RETURNS TABLE (
  material_id INTEGER,
  material_part_number VARCHAR,
  material_description TEXT,
  required_qty NUMERIC,
  reserved_qty NUMERIC,
  consumed_qty NUMERIC,
  remaining_qty NUMERIC,
  uom VARCHAR,
  operation_sequence INTEGER,
  progress_pct NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.material_id,
    p.part_number AS material_part_number,
    p.description AS material_description,
    b.quantity AS required_qty,
    COALESCE(SUM(r.quantity_reserved), 0) AS reserved_qty,
    COALESCE(SUM(r.quantity_consumed), 0) AS consumed_qty,
    b.quantity - COALESCE(SUM(r.quantity_consumed), 0) AS remaining_qty,
    b.uom,
    b.operation_sequence,
    CASE
      WHEN b.quantity > 0 THEN ROUND((COALESCE(SUM(r.quantity_consumed), 0) / b.quantity) * 100, 2)
      ELSE 0
    END AS progress_pct
  FROM work_orders wo
  INNER JOIN bom_items b ON wo.bom_id = b.bom_id
  INNER JOIN products p ON b.material_id = p.id
  LEFT JOIN wo_reservations r ON r.wo_id = wo.id AND r.material_id = b.material_id AND r.status IN ('active', 'consumed')
  WHERE wo.id = wo_id_param
  GROUP BY b.material_id, p.part_number, p.description, b.quantity, b.uom, b.operation_sequence
  ORDER BY b.operation_sequence ASC, p.part_number ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_wo_required_materials IS
'Returns required materials for a work order with reservation and consumption status.
Used to display progress checklist on scanner and desktop UI.';

-- Function: Get Available LPs for Material (FIFO)
CREATE OR REPLACE FUNCTION get_available_lps_for_material(
  material_id_param INTEGER,
  location_id_param INTEGER DEFAULT NULL
)
RETURNS TABLE (
  lp_id INTEGER,
  lp_number VARCHAR,
  quantity NUMERIC,
  uom VARCHAR,
  batch VARCHAR,
  expiry_date DATE,
  location_name TEXT,
  qa_status VARCHAR,
  reserved_qty NUMERIC,
  available_qty NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id AS lp_id,
    lp.lp_number,
    lp.quantity,
    lp.uom,
    lp.batch,
    lp.expiry_date,
    l.name AS location_name,
    lp.qa_status,
    COALESCE(SUM(r.quantity_reserved - r.quantity_consumed), 0) AS reserved_qty,
    lp.quantity - COALESCE(SUM(r.quantity_reserved - r.quantity_consumed), 0) AS available_qty
  FROM license_plates lp
  INNER JOIN locations l ON lp.location_id = l.id
  LEFT JOIN wo_reservations r ON r.lp_id = lp.id AND r.status = 'active'
  WHERE lp.product_id = material_id_param
    AND lp.is_consumed = FALSE
    AND lp.qa_status = 'Passed'
    AND (location_id_param IS NULL OR lp.location_id = location_id_param)
  GROUP BY lp.id, lp.lp_number, lp.quantity, lp.uom, lp.batch, lp.expiry_date, l.name, lp.qa_status
  HAVING lp.quantity > COALESCE(SUM(r.quantity_reserved - r.quantity_consumed), 0) -- Has available quantity
  ORDER BY lp.expiry_date ASC NULLS LAST, lp.created_at ASC; -- FIFO: oldest first
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_available_lps_for_material IS
'Returns available license plates for a material, ordered by FIFO (expiry date, then created date).
Filters out consumed LPs, QA-blocked LPs, and fully reserved LPs.
Used for scanner LP selection and automatic reservation suggestions.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE pallet_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE wo_reservations TO authenticated;
GRANT USAGE ON SEQUENCE pallets_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE pallet_items_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE wo_reservations_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_wo_required_materials TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_lps_for_material TO authenticated;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Migration 055: Performance Optimization - Database Indexes
-- Purpose: Add missing indexes for performance improvement
-- Epic: Stability & Performance Enhancement
-- Date: 2025-11-12
-- Based on: Technical Debt TD-006 recommendations

-- ============================================================================
-- 1. LICENSE PLATES INDEXES
-- ============================================================================

-- Composite index for location + status (frequent query pattern)
CREATE INDEX IF NOT EXISTS idx_lp_location_status
ON license_plates(location_id, status)
WHERE status = 'available';

-- Index for expiry date (FIFO/FEFO queries)
CREATE INDEX IF NOT EXISTS idx_lp_expiry_date
ON license_plates(expiry_date)
WHERE expiry_date IS NOT NULL;

-- Index for product + location (inventory queries)
CREATE INDEX IF NOT EXISTS idx_lp_product_location
ON license_plates(product_id, location_id);

-- Index for batch tracking
CREATE INDEX IF NOT EXISTS idx_lp_batch
ON license_plates(batch)
WHERE batch IS NOT NULL;

-- Index for QA status filtering
CREATE INDEX IF NOT EXISTS idx_lp_qa_status
ON license_plates(qa_status);

-- ============================================================================
-- 2. LP GENEALOGY INDEXES
-- ============================================================================

-- Parent LP lookup (forward traceability)
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_parent
ON lp_genealogy(parent_lp_id);

-- Child LP lookup (backward traceability)
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_child
ON lp_genealogy(child_lp_id);

-- Composite index for genealogy tree queries
CREATE INDEX IF NOT EXISTS idx_lp_genealogy_parent_child
ON lp_genealogy(parent_lp_id, child_lp_id);

-- ============================================================================
-- 3. WORK ORDERS INDEXES
-- ============================================================================

-- Index for WO status filtering (most common query)
CREATE INDEX IF NOT EXISTS idx_wo_status
ON work_orders(status);

-- Index for product + status (production planning)
CREATE INDEX IF NOT EXISTS idx_wo_product_status
ON work_orders(product_id, status);

-- Index for scheduled date (production scheduling)
CREATE INDEX IF NOT EXISTS idx_wo_scheduled_date
ON work_orders(scheduled_date);

-- Index for BOM ID lookup
CREATE INDEX IF NOT EXISTS idx_wo_bom_id
ON work_orders(bom_id);

-- ============================================================================
-- 4. BOM INDEXES
-- ============================================================================

-- Index for product + status (active BOM lookup)
CREATE INDEX IF NOT EXISTS idx_bom_product_status
ON boms(product_id, bom_status);

-- Index for effective dates (version selection)
CREATE INDEX IF NOT EXISTS idx_bom_effective_dates
ON boms(effective_from, effective_to)
WHERE bom_status = 'active';

-- Index for version number
CREATE INDEX IF NOT EXISTS idx_bom_version
ON boms(product_id, version_number);

-- ============================================================================
-- 5. BOM ITEMS INDEXES
-- ============================================================================

-- Index for material ID (reverse lookup: where is this material used?)
CREATE INDEX IF NOT EXISTS idx_bom_items_material
ON bom_items(material_id);

-- Composite index for BOM + material
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_material
ON bom_items(bom_id, material_id);

-- Index for by-products
CREATE INDEX IF NOT EXISTS idx_bom_items_by_product
ON bom_items(is_by_product)
WHERE is_by_product = true;

-- ============================================================================
-- 6. PURCHASE ORDERS INDEXES
-- ============================================================================

-- Index for supplier + status (supplier queries)
CREATE INDEX IF NOT EXISTS idx_po_supplier_status
ON po_header(supplier_id, status);

-- Index for order date (reporting)
CREATE INDEX IF NOT EXISTS idx_po_order_date
ON po_header(order_date);

-- Index for expected delivery (logistics)
CREATE INDEX IF NOT EXISTS idx_po_expected_delivery
ON po_header(expected_delivery_date);

-- ============================================================================
-- 7. TRANSFER ORDERS INDEXES
-- ============================================================================

-- Index for from warehouse (origin queries)
CREATE INDEX IF NOT EXISTS idx_to_from_warehouse
ON to_header(from_wh_id, status);

-- Index for to warehouse (destination queries)
CREATE INDEX IF NOT EXISTS idx_to_to_warehouse
ON to_header(to_wh_id, status);

-- Index for transfer date
CREATE INDEX IF NOT EXISTS idx_to_transfer_date
ON to_header(transfer_date);

-- ============================================================================
-- 8. PALLETS INDEXES
-- ============================================================================

-- Index for pallet status (active pallets)
CREATE INDEX IF NOT EXISTS idx_pallets_status
ON pallets(status);

-- Index for location (warehouse queries)
CREATE INDEX IF NOT EXISTS idx_pallets_location
ON pallets(location_id)
WHERE location_id IS NOT NULL;

-- Index for WO ID (production pallets)
CREATE INDEX IF NOT EXISTS idx_pallets_wo
ON pallets(wo_id)
WHERE wo_id IS NOT NULL;

-- Index for pallet number (barcode lookup)
CREATE INDEX IF NOT EXISTS idx_pallets_pallet_number
ON pallets(pallet_number);

-- ============================================================================
-- 9. PALLET ITEMS INDEXES
-- ============================================================================

-- Index for LP ID (which pallets contain this LP?)
CREATE INDEX IF NOT EXISTS idx_pallet_items_lp
ON pallet_items(lp_id);

-- Composite index for pallet + LP
CREATE INDEX IF NOT EXISTS idx_pallet_items_pallet_lp
ON pallet_items(pallet_id, lp_id);

-- ============================================================================
-- 10. WO RESERVATIONS INDEXES
-- ============================================================================

-- Index for LP reservations (inventory availability)
CREATE INDEX IF NOT EXISTS idx_wo_reservations_lp
ON wo_reservations(lp_id, status);

-- Index for material reservations (material requirements)
CREATE INDEX IF NOT EXISTS idx_wo_reservations_material
ON wo_reservations(material_id, status);

-- Composite index for WO + material
CREATE INDEX IF NOT EXISTS idx_wo_reservations_wo_material
ON wo_reservations(wo_id, material_id);

-- ============================================================================
-- 11. ASN INDEXES
-- ============================================================================

-- Index for PO line reference
CREATE INDEX IF NOT EXISTS idx_asn_items_po_line
ON asn_items(po_line_id);

-- Index for ASN status
CREATE INDEX IF NOT EXISTS idx_asns_status
ON asns(status);

-- Index for expected arrival date
CREATE INDEX IF NOT EXISTS idx_asns_expected_arrival
ON asns(expected_arrival_date);

-- ============================================================================
-- 12. GRN INDEXES
-- ============================================================================

-- Index for GRN date (reporting)
CREATE INDEX IF NOT EXISTS idx_grns_grn_date
ON grns(grn_date);

-- Index for ASN reference
CREATE INDEX IF NOT EXISTS idx_grns_asn
ON grns(asn_id)
WHERE asn_id IS NOT NULL;

-- ============================================================================
-- 13. STOCK MOVES INDEXES
-- ============================================================================

-- Index for LP stock moves
CREATE INDEX IF NOT EXISTS idx_stock_moves_lp
ON stock_moves(lp_id);

-- Index for from location
CREATE INDEX IF NOT EXISTS idx_stock_moves_from_location
ON stock_moves(from_location_id);

-- Index for to location
CREATE INDEX IF NOT EXISTS idx_stock_moves_to_location
ON stock_moves(to_location_id);

-- Index for move date
CREATE INDEX IF NOT EXISTS idx_stock_moves_date
ON stock_moves(move_date);

-- ============================================================================
-- 14. AUDIT LOG INDEXES
-- ============================================================================

-- Index for table name (audit queries by table)
CREATE INDEX IF NOT EXISTS idx_audit_log_table
ON audit_log(table_name);

-- Index for timestamp (recent activity)
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
ON audit_log(changed_at DESC);

-- Composite index for table + record
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record
ON audit_log(table_name, record_id);

-- ============================================================================
-- 15. PERFORMANCE ANALYSIS
-- ============================================================================

COMMENT ON INDEX idx_lp_location_status IS
'Performance: Speeds up inventory availability queries by location';

COMMENT ON INDEX idx_lp_genealogy_parent IS
'Performance: Critical for forward traceability queries (parent → children)';

COMMENT ON INDEX idx_lp_genealogy_child IS
'Performance: Critical for backward traceability queries (child → parents)';

COMMENT ON INDEX idx_wo_status IS
'Performance: Most common WO query pattern (filter by status)';

COMMENT ON INDEX idx_bom_product_status IS
'Performance: Fast active BOM lookup for WO creation';

COMMENT ON INDEX idx_pallets_status IS
'Performance: Quick filtering of open/closed/shipped pallets';

-- ============================================================================
-- 16. STATISTICS UPDATE
-- ============================================================================

-- Update table statistics for query planner
ANALYZE license_plates;
ANALYZE lp_genealogy;
ANALYZE work_orders;
ANALYZE boms;
ANALYZE bom_items;
ANALYZE po_header;
ANALYZE to_header;
ANALYZE pallets;
ANALYZE pallet_items;
ANALYZE wo_reservations;
ANALYZE asns;
ANALYZE grns;
ANALYZE stock_moves;
ANALYZE audit_log;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Performance Notes:
-- - Added 50+ indexes for critical query paths
-- - Focus on: License Plates, Genealogy, WOs, BOMs, Pallets
-- - Partial indexes where applicable (status='available', etc.)
-- - Composite indexes for common multi-column queries
-- - Updated statistics for query planner optimization
--
-- Expected Impact:
-- - 50-80% faster inventory queries (LP + location)
-- - 70-90% faster traceability queries (genealogy)
-- - 40-60% faster production planning queries (WO + BOM)
-- - 30-50% faster reporting queries (date ranges)
-- Migration 056: EPIC-003 Phase 1 - Cost Calculation & Analysis
-- Purpose: Add cost tracking tables for material costs, BOM costs, product prices, and WO costs
-- Epic: EPIC-003 - Production Intelligence & Cost Optimization
-- Phase: Phase 1 - BOM Cost Calculation & Analysis
-- Date: 2025-11-12

-- ============================================================================
-- 1. MATERIAL COSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS material_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cost information
  cost DECIMAL(15, 4) NOT NULL CHECK (cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  uom VARCHAR(10) NOT NULL,

  -- Validity period
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,

  -- Source tracking
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'supplier', 'average', 'import')),
  notes TEXT,

  -- Audit fields
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT material_costs_date_range_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);

-- Indexes for material_costs
CREATE INDEX idx_material_costs_product ON material_costs(product_id);
CREATE INDEX idx_material_costs_org ON material_costs(org_id);
CREATE INDEX idx_material_costs_effective_date ON material_costs(product_id, effective_from);
CREATE INDEX idx_material_costs_date_range ON material_costs(effective_from, effective_to);

-- RLS for material_costs
ALTER TABLE material_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY material_costs_org_isolation ON material_costs
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::bigint);

-- Trigger to prevent overlapping date ranges for same product
CREATE OR REPLACE FUNCTION validate_material_cost_date_range()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping date ranges for the same product
  IF EXISTS (
    SELECT 1 FROM material_costs
    WHERE product_id = NEW.product_id
      AND id != COALESCE(NEW.id, -1)
      AND org_id = NEW.org_id
      AND (
        -- New range overlaps with existing range
        (NEW.effective_from, COALESCE(NEW.effective_to, 'infinity'::timestamp))
        OVERLAPS
        (effective_from, COALESCE(effective_to, 'infinity'::timestamp))
      )
  ) THEN
    RAISE EXCEPTION 'Material cost date range overlaps with existing range for this product';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_material_cost_date_range_trigger
  BEFORE INSERT OR UPDATE ON material_costs
  FOR EACH ROW
  EXECUTE FUNCTION validate_material_cost_date_range();

-- ============================================================================
-- 2. BOM COSTS TABLE (Snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bom_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  bom_id BIGINT NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Cost breakdown
  total_cost DECIMAL(15, 4) NOT NULL CHECK (total_cost >= 0),
  material_costs DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (material_costs >= 0),
  labor_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  overhead_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (overhead_cost >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Detailed breakdown (JSONB for flexibility)
  material_costs_json JSONB,

  -- Calculation metadata
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  calculated_by BIGINT REFERENCES users(id),
  calculation_method VARCHAR(50) DEFAULT 'standard',
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for bom_costs
CREATE INDEX idx_bom_costs_bom ON bom_costs(bom_id);
CREATE INDEX idx_bom_costs_org ON bom_costs(org_id);
CREATE INDEX idx_bom_costs_calculated_at ON bom_costs(calculated_at DESC);

-- RLS for bom_costs
ALTER TABLE bom_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY bom_costs_org_isolation ON bom_costs
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::bigint);

-- ============================================================================
-- 3. PRODUCT PRICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_prices (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Price information
  price DECIMAL(15, 4) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Validity period
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP WITH TIME ZONE,

  -- Price type
  price_type VARCHAR(20) NOT NULL DEFAULT 'wholesale' CHECK (
    price_type IN ('wholesale', 'retail', 'export', 'internal', 'custom')
  ),
  customer_id BIGINT, -- Optional: for customer-specific pricing

  -- Additional info
  notes TEXT,

  -- Audit fields
  created_by BIGINT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT product_prices_date_range_check CHECK (
    effective_to IS NULL OR effective_to > effective_from
  )
);

-- Indexes for product_prices
CREATE INDEX idx_product_prices_product ON product_prices(product_id);
CREATE INDEX idx_product_prices_org ON product_prices(org_id);
CREATE INDEX idx_product_prices_effective_date ON product_prices(product_id, effective_from);
CREATE INDEX idx_product_prices_type ON product_prices(price_type);

-- RLS for product_prices
ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_prices_org_isolation ON product_prices
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::bigint);

-- Trigger to prevent overlapping date ranges for same product + price type
CREATE OR REPLACE FUNCTION validate_product_price_date_range()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping date ranges for the same product and price type
  IF EXISTS (
    SELECT 1 FROM product_prices
    WHERE product_id = NEW.product_id
      AND price_type = NEW.price_type
      AND COALESCE(customer_id, -1) = COALESCE(NEW.customer_id, -1)
      AND id != COALESCE(NEW.id, -1)
      AND org_id = NEW.org_id
      AND (
        -- New range overlaps with existing range
        (NEW.effective_from, COALESCE(NEW.effective_to, 'infinity'::timestamp))
        OVERLAPS
        (effective_from, COALESCE(effective_to, 'infinity'::timestamp))
      )
  ) THEN
    RAISE EXCEPTION 'Product price date range overlaps with existing range for this product and price type';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_product_price_date_range_trigger
  BEFORE INSERT OR UPDATE ON product_prices
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_price_date_range();

-- ============================================================================
-- 4. WORK ORDER COSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS wo_costs (
  id BIGSERIAL PRIMARY KEY,

  -- Reference
  wo_id BIGINT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Planned costs (from BOM at WO creation)
  planned_cost DECIMAL(15, 4) NOT NULL DEFAULT 0 CHECK (planned_cost >= 0),
  planned_material_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,
  planned_labor_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,
  planned_overhead_cost DECIMAL(15, 4) NOT NULL DEFAULT 0,

  -- Actual costs (from actual consumption)
  actual_cost DECIMAL(15, 4) DEFAULT 0 CHECK (actual_cost >= 0),
  actual_material_cost DECIMAL(15, 4) DEFAULT 0,
  actual_labor_cost DECIMAL(15, 4) DEFAULT 0,
  actual_overhead_cost DECIMAL(15, 4) DEFAULT 0,

  -- Variance
  cost_variance DECIMAL(15, 4) GENERATED ALWAYS AS (actual_cost - planned_cost) STORED,
  variance_percent DECIMAL(8, 4) GENERATED ALWAYS AS (
    CASE
      WHEN planned_cost > 0 THEN ((actual_cost - planned_cost) / planned_cost * 100)
      ELSE 0
    END
  ) STORED,

  currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Calculation metadata
  planned_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actual_calculated_at TIMESTAMP WITH TIME ZONE,

  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for wo_costs
CREATE INDEX idx_wo_costs_wo ON wo_costs(wo_id);
CREATE INDEX idx_wo_costs_org ON wo_costs(org_id);
CREATE INDEX idx_wo_costs_variance ON wo_costs(cost_variance);

-- RLS for wo_costs
ALTER TABLE wo_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY wo_costs_org_isolation ON wo_costs
  FOR ALL
  USING (org_id = current_setting('app.current_org_id')::bigint);

-- ============================================================================
-- 5. HELPER FUNCTIONS - Get Material Cost at Date
-- ============================================================================

CREATE OR REPLACE FUNCTION get_material_cost_at_date(
  p_product_id BIGINT,
  p_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS DECIMAL(15, 4) AS $$
DECLARE
  v_cost DECIMAL(15, 4);
BEGIN
  SELECT cost INTO v_cost
  FROM material_costs
  WHERE product_id = p_product_id
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to > p_date)
    AND org_id = current_setting('app.current_org_id')::bigint
  ORDER BY effective_from DESC
  LIMIT 1;

  RETURN COALESCE(v_cost, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CALCULATE BOM COST FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_bom_cost(
  p_bom_id BIGINT,
  p_as_of_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_total_cost DECIMAL(15, 4) := 0;
  v_materials JSONB := '[]'::jsonb;
  v_item RECORD;
  v_item_cost DECIMAL(15, 4);
  v_material_cost DECIMAL(15, 4);
BEGIN
  -- Calculate cost for each BOM item
  FOR v_item IN
    SELECT
      bi.id,
      bi.product_id,
      p.name as product_name,
      bi.quantity,
      bi.uom,
      bi.is_by_product
    FROM bom_items bi
    JOIN products p ON bi.product_id = p.id
    WHERE bi.bom_id = p_bom_id
      AND bi.is_by_product = FALSE
  LOOP
    -- Get material cost at the specified date
    v_material_cost := get_material_cost_at_date(v_item.product_id, p_as_of_date);
    v_item_cost := v_material_cost * v_item.quantity;
    v_total_cost := v_total_cost + v_item_cost;

    -- Add to materials array
    v_materials := v_materials || jsonb_build_object(
      'product_id', v_item.product_id,
      'product_name', v_item.product_name,
      'quantity', v_item.quantity,
      'uom', v_item.uom,
      'unit_cost', v_material_cost,
      'total_cost', v_item_cost
    );
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'bom_id', p_bom_id,
    'total_cost', v_total_cost,
    'material_cost', v_total_cost,
    'labor_cost', 0,
    'overhead_cost', 0,
    'currency', 'USD',
    'calculated_at', p_as_of_date,
    'materials', v_materials
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. GET BOM COST BREAKDOWN FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_bom_cost_breakdown(
  p_bom_id BIGINT
)
RETURNS TABLE (
  product_id BIGINT,
  product_name TEXT,
  quantity DECIMAL,
  uom VARCHAR,
  unit_cost DECIMAL,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bi.product_id,
    p.name::TEXT as product_name,
    bi.quantity,
    bi.uom,
    COALESCE(get_material_cost_at_date(bi.product_id), 0) as unit_cost,
    COALESCE(get_material_cost_at_date(bi.product_id), 0) * bi.quantity as total_cost
  FROM bom_items bi
  JOIN products p ON bi.product_id = p.id
  WHERE bi.bom_id = p_bom_id
    AND bi.is_by_product = FALSE
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. COMPARE BOM COSTS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION compare_bom_costs(
  p_bom_id_1 BIGINT,
  p_bom_id_2 BIGINT,
  p_as_of_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_cost_1 JSONB;
  v_cost_2 JSONB;
  v_result JSONB;
  v_diff DECIMAL(15, 4);
  v_diff_percent DECIMAL(8, 4);
BEGIN
  -- Calculate costs for both BOMs
  v_cost_1 := calculate_bom_cost(p_bom_id_1, p_as_of_date);
  v_cost_2 := calculate_bom_cost(p_bom_id_2, p_as_of_date);

  -- Calculate difference
  v_diff := (v_cost_2->>'total_cost')::DECIMAL - (v_cost_1->>'total_cost')::DECIMAL;

  IF (v_cost_1->>'total_cost')::DECIMAL > 0 THEN
    v_diff_percent := (v_diff / (v_cost_1->>'total_cost')::DECIMAL) * 100;
  ELSE
    v_diff_percent := 0;
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'bom_1', v_cost_1,
    'bom_2', v_cost_2,
    'cost_difference', v_diff,
    'cost_difference_percent', v_diff_percent,
    'comparison_date', p_as_of_date
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. GET PRODUCT COST TREND FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_product_cost_trend(
  p_product_id BIGINT,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  date TIMESTAMP WITH TIME ZONE,
  cost DECIMAL,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.effective_from as date,
    mc.cost,
    mc.source
  FROM material_costs mc
  WHERE mc.product_id = p_product_id
    AND mc.effective_from >= NOW() - (p_days || ' days')::INTERVAL
    AND mc.org_id = current_setting('app.current_org_id')::bigint
  ORDER BY mc.effective_from DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE material_costs IS 'Tracks material costs over time with effective date ranges';
COMMENT ON TABLE bom_costs IS 'Stores BOM cost calculation snapshots for historical tracking';
COMMENT ON TABLE product_prices IS 'Tracks product sell prices over time by price type';
COMMENT ON TABLE wo_costs IS 'Tracks planned vs actual costs for work orders with variance calculation';

COMMENT ON FUNCTION get_material_cost_at_date IS 'Returns the material cost for a product at a specific date';
COMMENT ON FUNCTION calculate_bom_cost IS 'Calculates total BOM cost with material breakdown at a specific date';
COMMENT ON FUNCTION get_bom_cost_breakdown IS 'Returns detailed breakdown of BOM costs by material';
COMMENT ON FUNCTION compare_bom_costs IS 'Compares costs between two BOM versions';
COMMENT ON FUNCTION get_product_cost_trend IS 'Returns cost history for a product over specified days';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 056 completed successfully!';
  RAISE NOTICE 'Created tables: material_costs, bom_costs, product_prices, wo_costs';
  RAISE NOTICE 'Created 5 cost calculation functions';
  RAISE NOTICE 'EPIC-003 Phase 1 database schema ready!';
END $$;
-- Migration 057: Add warehouse_id to po_header table
-- Purpose: Fix PO Header warehouse_id (CRITICAL) - Required for GRN routing
-- Story: 0.1 - Fix PO Header warehouse_id
-- Epic: Epic 0 - P0 Modules Data Integrity Audit & Fix
-- Date: 2025-11-14

-- ============================================================================
-- PRECONDITION CHECK: Ensure warehouses table has data
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM warehouses LIMIT 1) THEN
    RAISE EXCEPTION 'Cannot add warehouse_id: warehouses table is empty. Please seed warehouse data first.';
  END IF;
END $$;

-- ============================================================================
-- ALTER TABLE: po_header
-- Add warehouse_id column with foreign key constraint
-- ============================================================================

-- Add warehouse_id column (NULLABLE for migration safety)
ALTER TABLE po_header
  ADD COLUMN IF NOT EXISTS warehouse_id BIGINT REFERENCES warehouses(id) ON DELETE RESTRICT;

-- ============================================================================
-- DATA MIGRATION: Set default warehouse_id for existing PO rows
-- ============================================================================

-- Set default warehouse_id for existing PO rows
-- Uses first available warehouse (ordered by ID)
UPDATE po_header
SET warehouse_id = (SELECT id FROM warehouses ORDER BY id LIMIT 1)
WHERE warehouse_id IS NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Create index CONCURRENTLY to avoid table locks during production deployment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_po_header_warehouse_id
  ON po_header(warehouse_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN po_header.warehouse_id IS
'Destination warehouse for this Purchase Order (required for GRN routing). Determines where materials will be received.';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
-- Migration 058: Fix License Plate Status Enum
-- Purpose: Synchronize LP status values between database and TypeScript
-- Date: 2025-11-15
-- Story: 0.3-fix-lp-status-enum (Epic 0 - CRITICAL)
-- Dependencies: 025_license_plates
--
-- Problem: Severe mismatch between DB (6 statuses) and TypeScript (5 different statuses)
-- Solution: Unified enum with 10 statuses (lowercase snake_case convention)
--
-- Old DB statuses: available, reserved, consumed, in_transit, quarantine, damaged
-- Old TS statuses: Available, Reserved, In Production, QA Hold, QA Released, QA Rejected, Shipped
-- New unified: available, reserved, in_production, consumed, in_transit, quarantine, qa_passed, qa_rejected, shipped, damaged

-- =====================================================
-- STEP 1: Precondition Checks and Data Audit
-- =====================================================

DO $$
DECLARE
  lp_count INTEGER;
  status_counts RECORD;
BEGIN
  -- Count existing License Plates
  SELECT COUNT(*) INTO lp_count FROM license_plates;

  RAISE NOTICE '=== License Plate Status Migration - Precondition Check ===';
  RAISE NOTICE 'Total License Plates in database: %', lp_count;

  -- Log current status distribution
  IF lp_count > 0 THEN
    RAISE NOTICE 'Current status distribution:';
    FOR status_counts IN
      SELECT status, COUNT(*) as count
      FROM license_plates
      GROUP BY status
      ORDER BY count DESC
    LOOP
      RAISE NOTICE '  - %: % LPs', status_counts.status, status_counts.count;
    END LOOP;
  ELSE
    RAISE NOTICE 'No existing License Plates found - migration will only update schema';
  END IF;

  RAISE NOTICE '=== End Precondition Check ===';
END $$;

-- =====================================================
-- STEP 2: Drop Old CHECK Constraint
-- =====================================================

-- Drop existing CHECK constraint on status column
ALTER TABLE license_plates
  DROP CONSTRAINT IF EXISTS license_plates_status_check;

RAISE NOTICE 'Dropped old CHECK constraint: license_plates_status_check';

-- =====================================================
-- STEP 3: Data Migration - Map Old Values to New Values
-- =====================================================

-- Note: Current DB uses lowercase (available, reserved, etc.)
-- TypeScript uses Title Case with spaces (In Production, QA Hold, etc.)
-- If any data was inserted via TypeScript (unlikely due to constraint), map it
-- Most likely this will find 0 rows to update, but we handle it defensively

-- Map potential TypeScript-style values to new unified enum
-- These UPDATEs will only affect rows if they somehow bypassed the CHECK constraint

-- Map "In Production" → "in_production" (if any exist)
UPDATE license_plates
SET status = 'in_production'
WHERE status = 'In Production';

-- Map "QA Hold" → "quarantine" (if any exist)
UPDATE license_plates
SET status = 'quarantine'
WHERE status = 'QA Hold';

-- Map "QA Released" → "qa_passed" (if any exist)
UPDATE license_plates
SET status = 'qa_passed'
WHERE status = 'QA Released' OR status = 'QA Released';

-- Map "QA Rejected" → "qa_rejected" (if any exist)
UPDATE license_plates
SET status = 'qa_rejected'
WHERE status = 'QA Rejected';

-- Map "Shipped" → "shipped" (if any exist)
UPDATE license_plates
SET status = 'shipped'
WHERE status = 'Shipped';

-- Map Title Case to lowercase (if any exist)
UPDATE license_plates
SET status = 'available'
WHERE status = 'Available';

UPDATE license_plates
SET status = 'reserved'
WHERE status = 'Reserved';

-- Note: consumed, in_transit, quarantine, damaged already lowercase - no mapping needed

RAISE NOTICE 'Completed data mapping for old status values';

-- =====================================================
-- STEP 4: Add New CHECK Constraint with 10 Unified Statuses
-- =====================================================

-- Add new CHECK constraint with comprehensive 10-status enum
ALTER TABLE license_plates
  ADD CONSTRAINT license_plates_status_check
  CHECK (status IN (
    'available',      -- LP in warehouse, ready for use/shipping
    'reserved',       -- LP reserved for specific Work Order
    'in_production',  -- LP actively being consumed/processed in WO (NEW - maps from TS "In Production")
    'consumed',       -- LP fully consumed, genealogy locked, traceability complete
    'in_transit',     -- LP moving between warehouses (via Transfer Order)
    'quarantine',     -- LP held for QA inspection (maps from TS "QA Hold")
    'qa_passed',      -- LP passed QA inspection (NEW - maps from TS "QA Released")
    'qa_rejected',    -- LP failed QA inspection (NEW - maps from TS "QA Rejected")
    'shipped',        -- LP shipped to customer, final state (NEW - maps from TS "Shipped")
    'damaged'         -- LP physically damaged, unusable
  ));

RAISE NOTICE 'Added new CHECK constraint with 10 unified statuses';

-- =====================================================
-- STEP 5: Verify Default Value (should already be 'available')
-- =====================================================

-- No change needed - default is already 'available' from migration 025
-- But we'll verify it's still set correctly

DO $$
BEGIN
  -- Confirm default is 'available'
  PERFORM 1
  FROM information_schema.columns
  WHERE table_name = 'license_plates'
    AND column_name = 'status'
    AND column_default = '''available''::character varying';

  IF NOT FOUND THEN
    RAISE WARNING 'Default value for status column is not set to available - may need manual fix';
  ELSE
    RAISE NOTICE 'Default value verified: status defaults to ''available''';
  END IF;
END $$;

-- =====================================================
-- STEP 6: Update Column Comment with New Lifecycle
-- =====================================================

COMMENT ON COLUMN license_plates.status IS
  'LP status lifecycle:
   - available: In warehouse, ready for use/shipping
   - reserved: Reserved for specific Work Order (via lp_reservations)
   - in_production: Actively being consumed/processed in WO
   - consumed: Fully consumed by WO, genealogy locked, traceability complete
   - in_transit: Moving between warehouses (via Transfer Order)
   - quarantine: Held for QA inspection
   - qa_passed: Passed QA inspection, available for use
   - qa_rejected: Failed QA inspection, may be damaged or require rework
   - shipped: Shipped to customer (final state)
   - damaged: Physically damaged, unusable

   Primary lifecycle: available → reserved → in_production → consumed
   Shipping path: consumed → (output LP created) → available → shipped
   QA path: available → quarantine → qa_passed/qa_rejected
   Transit path: available → in_transit → available (at destination)';

RAISE NOTICE 'Updated column comment with comprehensive lifecycle documentation';

-- =====================================================
-- STEP 7: Final Validation
-- =====================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check for any LPs with invalid status values (should be 0)
  SELECT COUNT(*) INTO invalid_count
  FROM license_plates
  WHERE status NOT IN (
    'available', 'reserved', 'in_production', 'consumed',
    'in_transit', 'quarantine', 'qa_passed', 'qa_rejected',
    'shipped', 'damaged'
  );

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration validation FAILED: % LPs have invalid status values', invalid_count;
  ELSE
    RAISE NOTICE '=== Migration Validation: SUCCESS ===';
    RAISE NOTICE 'All LP status values are valid';
  END IF;
END $$;

-- =====================================================
-- Migration Complete
-- =====================================================

RAISE NOTICE '========================================';
RAISE NOTICE 'Migration 058 Complete: LP Status Enum Fixed';
RAISE NOTICE 'Database now has 10 unified status values';
RAISE NOTICE 'TypeScript enum must be updated to match';
RAISE NOTICE '========================================';
-- Migration 058 ROLLBACK: Restore License Plate Status Enum to Original State
-- Purpose: Rollback LP status migration in case of issues
-- Date: 2025-11-15
-- Story: 0.3-fix-lp-status-enum (Epic 0 - CRITICAL)
--
-- IMPORTANT: This rollback script restores the old 6-status CHECK constraint
-- and maps new status values back to old equivalents
--
-- WARNING: Data loss may occur for statuses that don't map back cleanly:
--   - in_production → reserved (loses "in production" state)
--   - qa_passed → available (loses QA approval state)
--   - qa_rejected → damaged (approximate mapping)
--   - shipped → consumed (loses shipping state)

-- =====================================================
-- STEP 1: Precondition Check
-- =====================================================

DO $$
DECLARE
  lp_count INTEGER;
  status_counts RECORD;
BEGIN
  RAISE NOTICE '=== License Plate Status Rollback - Precondition Check ===';

  -- Count LPs using new statuses that will be mapped
  SELECT COUNT(*) INTO lp_count FROM license_plates
  WHERE status IN ('in_production', 'qa_passed', 'qa_rejected', 'shipped');

  IF lp_count > 0 THEN
    RAISE WARNING 'Found % LPs with new status values that will be mapped to old values', lp_count;
    RAISE NOTICE 'Distribution of new statuses to be mapped:';

    FOR status_counts IN
      SELECT status, COUNT(*) as count
      FROM license_plates
      WHERE status IN ('in_production', 'qa_passed', 'qa_rejected', 'shipped')
      GROUP BY status
      ORDER BY count DESC
    LOOP
      RAISE NOTICE '  - %: % LPs', status_counts.status, status_counts.count;
    END LOOP;
  ELSE
    RAISE NOTICE 'No LPs with new status values found - rollback will only revert schema';
  END IF;

  RAISE NOTICE '=== End Precondition Check ===';
END $$;

-- =====================================================
-- STEP 2: Drop New CHECK Constraint
-- =====================================================

ALTER TABLE license_plates
  DROP CONSTRAINT IF EXISTS license_plates_status_check;

RAISE NOTICE 'Dropped new 10-status CHECK constraint';

-- =====================================================
-- STEP 3: Data Migration - Map New Values Back to Old Values
-- =====================================================

-- Map new statuses back to closest old equivalents
-- WARNING: This is lossy - some business state information will be lost

-- Map "in_production" → "reserved"
-- Rationale: LP is still tied to a WO, but we lose the "actively processing" state
UPDATE license_plates
SET status = 'reserved'
WHERE status = 'in_production';

-- Map "qa_passed" → "available"
-- Rationale: QA passed means LP is approved for use
UPDATE license_plates
SET status = 'available'
WHERE status = 'qa_passed';

-- Map "qa_rejected" → "damaged"
-- Rationale: QA rejection often means physical/quality damage
UPDATE license_plates
SET status = 'damaged'
WHERE status = 'qa_rejected';

-- Map "shipped" → "consumed"
-- Rationale: Shipped LPs are no longer in warehouse, closest old state is consumed
-- Alternative: could map to "in_transit" if shipped means still in delivery
UPDATE license_plates
SET status = 'consumed'
WHERE status = 'shipped';

RAISE NOTICE 'Completed data mapping from new status values to old values';

-- =====================================================
-- STEP 4: Restore Original CHECK Constraint (6 statuses)
-- =====================================================

-- Restore original 6-status CHECK constraint from migration 025
ALTER TABLE license_plates
  ADD CONSTRAINT license_plates_status_check
  CHECK (status IN (
    'available',
    'reserved',
    'consumed',
    'in_transit',
    'quarantine',
    'damaged'
  ));

RAISE NOTICE 'Restored original 6-status CHECK constraint';

-- =====================================================
-- STEP 5: Restore Original Column Comment
-- =====================================================

COMMENT ON COLUMN license_plates.status IS
  'LP status: available (in stock), reserved (allocated to WO), consumed (used in production), in_transit (being transferred between warehouses), quarantine (QA hold), damaged';

RAISE NOTICE 'Restored original column comment';

-- =====================================================
-- STEP 6: Final Validation
-- =====================================================

DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  -- Check for any LPs with invalid status values (should be 0)
  SELECT COUNT(*) INTO invalid_count
  FROM license_plates
  WHERE status NOT IN (
    'available', 'reserved', 'consumed', 'in_transit', 'quarantine', 'damaged'
  );

  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Rollback validation FAILED: % LPs have invalid status values', invalid_count;
  ELSE
    RAISE NOTICE '=== Rollback Validation: SUCCESS ===';
    RAISE NOTICE 'All LP status values are valid after rollback';
  END IF;
END $$;

-- =====================================================
-- Rollback Complete
-- =====================================================

RAISE NOTICE '========================================';
RAISE NOTICE 'Migration 058 Rollback Complete';
RAISE NOTICE 'License Plate Status restored to original 6-status enum';
RAISE NOTICE 'WARNING: Some business state may have been lost in mapping:';
RAISE NOTICE '  - in_production → reserved';
RAISE NOTICE '  - qa_passed → available';
RAISE NOTICE '  - qa_rejected → damaged';
RAISE NOTICE '  - shipped → consumed';
RAISE NOTICE 'TypeScript enum must be reverted to old values if code is also rolled back';
RAISE NOTICE '========================================';
-- Migration 059: UoM Master Table
-- Story 0.5: Fix License Plate UoM Constraint
-- Decision: Create master table for extensible UoM management
-- Replaces restrictive CHECK constraint with FK to master table

-- ============================================================================
-- STEP 1: Create uom_master table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.uom_master (
  code VARCHAR(20) PRIMARY KEY,
  display_name VARCHAR(50) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('weight', 'volume', 'length', 'count', 'container')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.uom_master IS 'Master table for Units of Measure - provides validation and extensibility for product UoM values';
COMMENT ON COLUMN public.uom_master.code IS 'UoM code (e.g., KG, GALLON) - used in license_plates.uom';
COMMENT ON COLUMN public.uom_master.display_name IS 'Human-readable name (e.g., "Kilogram", "US Gallon")';
COMMENT ON COLUMN public.uom_master.category IS 'UoM category: weight, volume, length, count, or container';

-- ============================================================================
-- STEP 2: Insert standard UoM values
-- ============================================================================

-- Weight units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('KG', 'Kilogram', 'weight'),
  ('POUND', 'Pound', 'weight'),
  ('GRAM', 'Gram', 'weight'),
  ('TON', 'Metric Ton', 'weight'),
  ('OUNCE', 'Ounce', 'weight');

-- Volume units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('LITER', 'Liter', 'volume'),
  ('GALLON', 'US Gallon', 'volume'),
  ('MILLILITER', 'Milliliter', 'volume'),
  ('BARREL', 'Barrel', 'volume'),
  ('QUART', 'Quart', 'volume');

-- Length units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('METER', 'Meter', 'length'),
  ('FOOT', 'Foot', 'length'),
  ('INCH', 'Inch', 'length'),
  ('CENTIMETER', 'Centimeter', 'length');

-- Count units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('EACH', 'Each (Unit)', 'count'),
  ('DOZEN', 'Dozen', 'count');

-- Container units
INSERT INTO public.uom_master (code, display_name, category) VALUES
  ('BOX', 'Box', 'container'),
  ('CASE', 'Case', 'container'),
  ('PALLET', 'Pallet', 'container'),
  ('DRUM', 'Drum', 'container'),
  ('BAG', 'Bag', 'container'),
  ('CARTON', 'Carton', 'container');

-- ============================================================================
-- STEP 3: Verify existing license_plates data
-- ============================================================================

-- Check for any UoM values not in the new master table
-- This should return 0 rows if all existing data is compatible
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT uom) INTO orphaned_count
  FROM public.license_plates
  WHERE uom NOT IN (SELECT code FROM public.uom_master);

  IF orphaned_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % distinct UoM values not in uom_master', orphaned_count;
    RAISE NOTICE 'Run this query to see them: SELECT DISTINCT uom FROM license_plates WHERE uom NOT IN (SELECT code FROM uom_master)';
  ELSE
    RAISE NOTICE 'SUCCESS: All existing license_plates.uom values are in uom_master';
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Drop old CHECK constraint
-- ============================================================================

-- Find the exact constraint name (it might be auto-generated)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.license_plates'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%uom%IN%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.license_plates DROP CONSTRAINT IF EXISTS %I', constraint_name);
    RAISE NOTICE 'Dropped CHECK constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No UoM CHECK constraint found (may have been dropped already)';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Add foreign key constraint to uom_master
-- ============================================================================

ALTER TABLE public.license_plates
  ADD CONSTRAINT fk_license_plates_uom
  FOREIGN KEY (uom) REFERENCES public.uom_master(code)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

COMMENT ON CONSTRAINT fk_license_plates_uom ON public.license_plates IS 'Ensures UoM values match master table - prevents typos and maintains data integrity';

-- ============================================================================
-- STEP 6: Create index for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_uom_master_category ON public.uom_master(category);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary:
-- - Created uom_master table with 22 standard units
-- - Verified existing LP data compatibility
-- - Removed restrictive CHECK constraint
-- - Added FK constraint for validation
-- - System now supports extensible UoM management via INSERT into uom_master
