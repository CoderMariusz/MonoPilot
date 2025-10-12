-- Enable RLS on all tables
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wo_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grns ENABLE ROW LEVEL SECURITY;
ALTER TABLE grn_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE asns ENABLE ROW LEVEL SECURITY;
ALTER TABLE asn_items ENABLE ROW LEVEL SECURITY;

-- Basic policies (everyone can read, authenticated users can write)
-- Adjust based on your auth setup and role requirements

-- Work Orders policies
CREATE POLICY "Allow read access to work orders"
  ON work_orders FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert work orders"
  ON work_orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update work orders"
  ON work_orders FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete work orders"
  ON work_orders FOR DELETE
  USING (auth.role() = 'authenticated');

-- Purchase Orders policies
CREATE POLICY "Allow read access to purchase orders"
  ON purchase_orders FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify purchase orders"
  ON purchase_orders FOR ALL
  USING (auth.role() = 'authenticated');

-- Transfer Orders policies
CREATE POLICY "Allow read access to transfer orders"
  ON transfer_orders FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify transfer orders"
  ON transfer_orders FOR ALL
  USING (auth.role() = 'authenticated');

-- Products policies
CREATE POLICY "Allow read access to products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- BOMs policies
CREATE POLICY "Allow read access to boms"
  ON boms FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify boms"
  ON boms FOR ALL
  USING (auth.role() = 'authenticated');

-- BOM Items policies
CREATE POLICY "Allow read access to bom_items"
  ON bom_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify bom_items"
  ON bom_items FOR ALL
  USING (auth.role() = 'authenticated');

-- WO Materials policies
CREATE POLICY "Allow read access to wo_materials"
  ON wo_materials FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify wo_materials"
  ON wo_materials FOR ALL
  USING (auth.role() = 'authenticated');

-- Suppliers policies
CREATE POLICY "Allow read access to suppliers"
  ON suppliers FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify suppliers"
  ON suppliers FOR ALL
  USING (auth.role() = 'authenticated');

-- Purchase Order Items policies
CREATE POLICY "Allow read access to purchase_order_items"
  ON purchase_order_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify purchase_order_items"
  ON purchase_order_items FOR ALL
  USING (auth.role() = 'authenticated');

-- GRNs policies
CREATE POLICY "Allow read access to grns"
  ON grns FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify grns"
  ON grns FOR ALL
  USING (auth.role() = 'authenticated');

-- GRN Items policies
CREATE POLICY "Allow read access to grn_items"
  ON grn_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify grn_items"
  ON grn_items FOR ALL
  USING (auth.role() = 'authenticated');

-- Transfer Order Items policies
CREATE POLICY "Allow read access to transfer_order_items"
  ON transfer_order_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify transfer_order_items"
  ON transfer_order_items FOR ALL
  USING (auth.role() = 'authenticated');

-- ASNs policies
CREATE POLICY "Allow read access to asns"
  ON asns FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify asns"
  ON asns FOR ALL
  USING (auth.role() = 'authenticated');

-- ASN Items policies
CREATE POLICY "Allow read access to asn_items"
  ON asn_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to modify asn_items"
  ON asn_items FOR ALL
  USING (auth.role() = 'authenticated');

-- Audit events: everyone can read, system can write
CREATE POLICY "Allow read access to audit events"
  ON audit_events FOR SELECT
  USING (true);

CREATE POLICY "Allow system to insert audit events"
  ON audit_events FOR INSERT
  WITH CHECK (true);
