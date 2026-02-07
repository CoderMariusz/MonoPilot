/**
 * Migration: Fix get_inventory_kpis function
 * Migration Number: 147 (sequential after 146)
 * Purpose: Correct stats calculation with proper org_id filtering
 * Bug: BUG-011 - Stats showing 0 LPs/$0 when table shows actual data
 * 
 * Root Causes Fixed:
 * 1. LEFT JOIN products without org_id filter could cause cross-org product matching
 * 2. Status comparison should be case-insensitive for robustness
 * 
 * Date: 2026-02-07
 */

-- Drop and recreate the function with proper filtering
CREATE OR REPLACE FUNCTION get_inventory_kpis(
  p_org_id UUID,
  p_expiry_warning_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_lps BIGINT,
  total_value NUMERIC,
  expiring_soon BIGINT,
  expired BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total active License Plates (all statuses except consumed)
    COUNT(lp.id)::BIGINT AS total_lps,

    -- Total inventory value (at cost)
    COALESCE(
      SUM(lp.quantity * COALESCE(p.cost_per_unit, 0)),
      0
    )::NUMERIC AS total_value,

    -- Expiring soon (within warning period, only available LPs)
    COUNT(lp.id) FILTER (
      WHERE LOWER(lp.status) = 'available'
        AND lp.expiry_date IS NOT NULL
        AND lp.expiry_date > CURRENT_DATE
        AND lp.expiry_date <= (CURRENT_DATE + p_expiry_warning_days * INTERVAL '1 day')
    )::BIGINT AS expiring_soon,

    -- Expired (past expiry date, only available LPs)
    COUNT(lp.id) FILTER (
      WHERE LOWER(lp.status) = 'available'
        AND lp.expiry_date IS NOT NULL
        AND lp.expiry_date < CURRENT_DATE
    )::BIGINT AS expired

  FROM license_plates lp
  LEFT JOIN products p ON p.id = lp.product_id AND p.org_id = p_org_id
  WHERE lp.org_id = p_org_id
    AND LOWER(lp.status) != 'consumed';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_inventory_kpis(UUID, INTEGER) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_inventory_kpis IS 'Calculate inventory KPIs for dashboard (total LPs, value, expiring, expired). Fixed in migration 147 with proper org_id filtering and case-insensitive status checks.';
