-- Check bom_items table schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'bom_items'
ORDER BY ordinal_position;
