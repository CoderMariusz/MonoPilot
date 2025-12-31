-- Migration: Create transfer orders tables
-- Story: 03.8 - Transfer Orders CRUD + Lines
-- Date: 2025-12-31
--
-- Creates:
-- - transfer_orders: Transfer Order headers for inter-warehouse movements
-- - transfer_order_lines: Transfer Order line items
-- - RLS policies for multi-tenancy (ADR-013 pattern)
-- - Auto-numbering trigger (TO-YYYY-NNNNN format)
-- - Indexes for performance

-- ============================================================================
-- TRANSFER ORDERS TABLE
-- ============================================================================

CREATE TABLE transfer_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  to_number             TEXT NOT NULL,
  from_warehouse_id     UUID NOT NULL REFERENCES warehouses(id),
  to_warehouse_id       UUID NOT NULL REFERENCES warehouses(id),
  planned_ship_date     DATE NOT NULL,
  planned_receive_date  DATE NOT NULL,
  actual_ship_date      DATE,
  actual_receive_date   DATE,
  status                TEXT NOT NULL DEFAULT 'draft',
  priority              TEXT DEFAULT 'normal',
  notes                 TEXT,
  shipped_by            UUID REFERENCES users(id),
  received_by           UUID REFERENCES users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  created_by            UUID REFERENCES users(id),
  updated_by            UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT transfer_orders_org_number_unique UNIQUE(org_id, to_number),
  CONSTRAINT transfer_orders_warehouses_different CHECK (from_warehouse_id != to_warehouse_id),
  CONSTRAINT transfer_orders_dates_valid CHECK (planned_receive_date >= planned_ship_date),
  CONSTRAINT transfer_orders_status_check CHECK (status IN ('draft', 'planned', 'shipped', 'received', 'closed', 'cancelled')),
  CONSTRAINT transfer_orders_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Indexes for performance
CREATE INDEX idx_transfer_orders_org_id ON transfer_orders(org_id);
CREATE INDEX idx_transfer_orders_org_status ON transfer_orders(org_id, status);
CREATE INDEX idx_transfer_orders_from_warehouse ON transfer_orders(from_warehouse_id);
CREATE INDEX idx_transfer_orders_to_warehouse ON transfer_orders(to_warehouse_id);
CREATE INDEX idx_transfer_orders_ship_date ON transfer_orders(planned_ship_date);
CREATE INDEX idx_transfer_orders_created_at ON transfer_orders(org_id, created_at DESC);

-- ============================================================================
-- TRANSFER ORDER LINES TABLE
-- ============================================================================

CREATE TABLE transfer_order_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_id             UUID NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
  line_number       INTEGER NOT NULL,
  product_id        UUID NOT NULL REFERENCES products(id),
  quantity          DECIMAL(15,4) NOT NULL CHECK (quantity > 0),
  uom               TEXT NOT NULL,
  shipped_qty       DECIMAL(15,4) DEFAULT 0 CHECK (shipped_qty >= 0),
  received_qty      DECIMAL(15,4) DEFAULT 0 CHECK (received_qty >= 0),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT transfer_order_lines_to_line_unique UNIQUE(to_id, line_number),
  CONSTRAINT transfer_order_lines_to_product_unique UNIQUE(to_id, product_id),
  CONSTRAINT transfer_order_lines_shipped_qty_limit CHECK (shipped_qty <= quantity),
  CONSTRAINT transfer_order_lines_received_qty_limit CHECK (received_qty <= quantity)
);

-- Indexes for performance
CREATE INDEX idx_transfer_order_lines_to_id ON transfer_order_lines(to_id);
CREATE INDEX idx_transfer_order_lines_product_id ON transfer_order_lines(product_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_order_lines ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - TRANSFER ORDERS (ADR-013 pattern)
-- ============================================================================

-- SELECT: All authenticated users in org can read
CREATE POLICY transfer_orders_select ON transfer_orders
  FOR SELECT
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- INSERT: Only owner, admin, warehouse_manager can create
CREATE POLICY transfer_orders_insert ON transfer_orders
  FOR INSERT
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'warehouse_manager')
    )
  );

-- UPDATE: Only owner, admin, warehouse_manager can update
CREATE POLICY transfer_orders_update ON transfer_orders
  FOR UPDATE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'warehouse_manager')
    )
  );

-- DELETE: Only owner, admin can delete
CREATE POLICY transfer_orders_delete ON transfer_orders
  FOR DELETE
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- RLS POLICIES - TRANSFER ORDER LINES (inherited via JOIN)
-- ============================================================================

-- SELECT: Inherit from parent TO
CREATE POLICY transfer_order_lines_select ON transfer_order_lines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transfer_orders
      WHERE id = transfer_order_lines.to_id
        AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
  );

-- INSERT: Only owner, admin, warehouse_manager with access to parent TO
CREATE POLICY transfer_order_lines_insert ON transfer_order_lines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transfer_orders
      WHERE id = transfer_order_lines.to_id
        AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'warehouse_manager')
    )
  );

-- UPDATE: Only owner, admin, warehouse_manager with access to parent TO
CREATE POLICY transfer_order_lines_update ON transfer_order_lines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transfer_orders
      WHERE id = transfer_order_lines.to_id
        AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'warehouse_manager')
    )
  );

-- DELETE: Only owner, admin, warehouse_manager with access to parent TO
CREATE POLICY transfer_order_lines_delete ON transfer_order_lines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transfer_orders
      WHERE id = transfer_order_lines.to_id
        AND org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    )
    AND (
      (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
      IN ('owner', 'admin', 'warehouse_manager')
    )
  );

-- ============================================================================
-- TRIGGER: Auto-generate TO number (TO-YYYY-NNNNN format)
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_to_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  year_prefix TEXT;
BEGIN
  -- Only generate if to_number is null
  IF NEW.to_number IS NOT NULL THEN
    RETURN NEW;
  END IF;

  year_prefix := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Find the next number for this org and year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(to_number FROM 'TO-' || year_prefix || '-(.*)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM transfer_orders
  WHERE org_id = NEW.org_id
    AND to_number LIKE 'TO-' || year_prefix || '-%';

  -- Format: TO-2024-00001
  NEW.to_number := 'TO-' || year_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_transfer_orders_auto_number
  BEFORE INSERT ON transfer_orders
  FOR EACH ROW
  WHEN (NEW.to_number IS NULL)
  EXECUTE FUNCTION generate_to_number();

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE TRIGGER tr_transfer_orders_updated_at
  BEFORE UPDATE ON transfer_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_transfer_order_lines_updated_at
  BEFORE UPDATE ON transfer_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Auto-increment line_number
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_to_line_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Get next line number for this TO
  SELECT COALESCE(MAX(line_number), 0) + 1
  INTO NEW.line_number
  FROM transfer_order_lines
  WHERE to_id = NEW.to_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_transfer_order_lines_auto_number
  BEFORE INSERT ON transfer_order_lines
  FOR EACH ROW
  EXECUTE FUNCTION generate_to_line_number();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE transfer_orders IS 'Transfer Order headers for inter-warehouse movements (Story 03.8)';
COMMENT ON TABLE transfer_order_lines IS 'Transfer Order line items (Story 03.8)';

COMMENT ON COLUMN transfer_orders.to_number IS 'Auto-generated TO number in TO-YYYY-NNNNN format';
COMMENT ON COLUMN transfer_orders.from_warehouse_id IS 'Source warehouse (must be different from to_warehouse_id)';
COMMENT ON COLUMN transfer_orders.to_warehouse_id IS 'Destination warehouse (must be different from from_warehouse_id)';
COMMENT ON COLUMN transfer_orders.status IS 'Lifecycle: draft -> planned -> shipped -> received -> closed | cancelled';
COMMENT ON COLUMN transfer_orders.priority IS 'Priority level: low, normal, high, urgent';

COMMENT ON COLUMN transfer_order_lines.to_id IS 'FK to transfer_orders (ON DELETE CASCADE)';
COMMENT ON COLUMN transfer_order_lines.line_number IS 'Auto-incremented line number per TO';
COMMENT ON COLUMN transfer_order_lines.shipped_qty IS 'Cumulative shipped quantity (cannot exceed quantity)';
COMMENT ON COLUMN transfer_order_lines.received_qty IS 'Cumulative received quantity (cannot exceed quantity)';

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON transfer_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transfer_order_lines TO authenticated;
