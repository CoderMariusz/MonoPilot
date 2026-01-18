/**
 * Migration: Create get_inventory_kpis function
 * Purpose: Calculate inventory KPIs for dashboard
 * Date: 2026-01-15
 */

-- Function to get inventory KPIs
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
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total active License Plates
    COUNT(*) FILTER (WHERE lp.status != 'consumed') AS total_lps,

    -- Total inventory value (at cost)
    COALESCE(
      SUM(lp.quantity * COALESCE(p.unit_cost, 0)) FILTER (WHERE lp.status != 'consumed'),
      0
    ) AS total_value,

    -- Expiring soon (within warning period)
    COUNT(*) FILTER (
      WHERE lp.status = 'available'
        AND lp.expiry_date IS NOT NULL
        AND lp.expiry_date > CURRENT_DATE
        AND lp.expiry_date <= (CURRENT_DATE + p_expiry_warning_days * INTERVAL '1 day')
    ) AS expiring_soon,

    -- Expired (past expiry date)
    COUNT(*) FILTER (
      WHERE lp.status = 'available'
        AND lp.expiry_date IS NOT NULL
        AND lp.expiry_date < CURRENT_DATE
    ) AS expired

  FROM license_plates lp
  LEFT JOIN products p ON p.id = lp.product_id
  WHERE lp.org_id = p_org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_inventory_kpis(UUID, INTEGER) TO authenticated;

-- Comment
COMMENT ON FUNCTION get_inventory_kpis IS 'Calculate inventory KPIs for dashboard (total LPs, value, expiring, expired)';
