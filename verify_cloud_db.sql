-- Verify Cloud Database Setup

-- 1. Check tables count
SELECT 
  'Tables' as type,
  count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Check roles (should be 10)
SELECT 'Roles' as type, count(*) as count FROM roles;

-- 3. Check modules (should be 11)
SELECT 'Modules' as type, count(*) as count FROM modules;

-- 4. Check RLS policies count
SELECT 
  'RLS Policies' as type,
  count(*) as count
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. List all tables
SELECT 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
