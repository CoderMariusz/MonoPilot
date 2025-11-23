#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Checking if tables exist in database...\n');

// Query pg_tables to see what tables actually exist
const { data, error } = await supabase
  .rpc('exec_sql', {
    sql_query: `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('warehouses', 'locations', 'machines', 'production_lines', 'allergens', 'tax_codes', 'user_invitations', 'user_sessions', 'machine_line_assignments')
      ORDER BY tablename;
    `
  });

if (error) {
  console.log('❌ Error querying pg_tables:', error.message);
  console.log('   Trying alternative approach...\n');

  // Alternative: Try direct query
  const tables = ['warehouses', 'locations', 'machines', 'production_lines', 'allergens', 'tax_codes', 'user_invitations', 'user_sessions'];

  for (const table of tables) {
    try {
      const result = await supabase.rpc('table_exists', { table_name: table });
      console.log(`${table}: ${result.data ? '✅ EXISTS' : '❌ DOES NOT EXIST'}`);
    } catch (e) {
      console.log(`${table}: ❓ UNKNOWN (function not available)`);
    }
  }
} else {
  console.log('✅ Tables found in database:');
  console.log(data);
}

// Check grants/permissions
console.log('\n\n🔑 Checking table permissions...\n');

const permQuery = `
  SELECT
    schemaname,
    tablename,
    tableowner,
    has_table_privilege('service_role', schemaname || '.' || tablename, 'SELECT') as can_select,
    has_table_privilege('service_role', schemaname || '.' || tablename, 'INSERT') as can_insert,
    has_table_privilege('service_role', schemaname || '.' || tablename, 'UPDATE') as can_update,
    has_table_privilege('service_role', schemaname || '.' || tablename, 'DELETE') as can_delete
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename LIKE '%warehouse%' OR tablename LIKE '%machine%' OR tablename LIKE '%location%'
  ORDER BY tablename;
`;

const { data: perms, error: permsError } = await supabase.rpc('exec_sql', { sql_query: permQuery });

if (permsError) {
  console.log('❌ Cannot check permissions (exec_sql function may not exist)');
  console.log('   Error:', permsError.message);
} else {
  console.log('Table Permissions:', perms);
}
