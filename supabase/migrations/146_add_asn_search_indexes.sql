-- Migration 097: Add ASN Search Performance Indexes
-- Purpose: Optimize ASN search queries for <500ms response time
-- Phase: REFACTOR - Performance optimization

-- Add text pattern search index for asn_number (supports ILIKE queries)
CREATE INDEX idx_asns_asn_number_pattern ON asns(org_id, asn_number text_pattern_ops);

-- Add index on po_number for join optimization
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(org_id, po_number);

-- Add index on supplier name for join optimization
CREATE INDEX idx_suppliers_name ON suppliers(org_id, name);

-- Comment
COMMENT ON INDEX idx_asns_asn_number_pattern IS 'Text pattern search index for ASN number ILIKE queries (Story 05.8 - Performance)';
COMMENT ON INDEX idx_purchase_orders_po_number IS 'PO number index for ASN list joins (Story 05.8 - Performance)';
COMMENT ON INDEX idx_suppliers_name IS 'Supplier name index for ASN list joins (Story 05.8 - Performance)';
