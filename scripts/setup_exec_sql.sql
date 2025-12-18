-- Create exec_sql function for remote SQL execution
-- This function allows executing arbitrary SQL via RPC from the Supabase client

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text TEXT;
BEGIN
  EXECUTE sql_query;
  RETURN 'Success';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

COMMENT ON FUNCTION exec_sql IS 'Execute arbitrary SQL - USE WITH CAUTION';
