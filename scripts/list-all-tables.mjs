#!/usr/bin/env node
/**
 * List all tables in public schema
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Listing ALL tables in public schema...\n');

// Get list of all tables by trying to query information_schema equivalent
// Since we can't query pg_tables directly, we'll try each expected table

const allPossibleTables = [
  'organizations',
  'users',
  'warehouses',
  'locations',
  'machines',
  'production_lines',
  'allergens',
  'tax_codes',
  'user_invitations',
  'user_sessions',
  'machine_line_assignments',
  'activity_logs',
  'user_preferences'
];

console.log('Testing which tables exist:\n');

const existingTables = [];
const missingTables = [];

for (const tableName of allPossibleTables) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`❌ ${tableName.padEnd(30)} - DOES NOT EXIST or NO ACCESS`);
    console.log(`   Error: ${error.message}`);
    missingTables.push(tableName);
  } else {
    console.log(`✅ ${tableName.padEnd(30)} - EXISTS`);
    existingTables.push(tableName);
  }
}

console.log('\n' + '═'.repeat(70));
console.log('SUMMARY');
console.log('═'.repeat(70));
console.log(`\n✅ Existing tables: ${existingTables.length}`);
existingTables.forEach(t => console.log(`   - ${t}`));

console.log(`\n❌ Missing tables: ${missingTables.length}`);
missingTables.forEach(t => console.log(`   - ${t}`));

if (missingTables.length > 0) {
  console.log('\n⚠️  WARNING: Missing tables need to be created!');
  console.log('   These migrations may not have been run on production:');

  const migrationMap = {
    'warehouses': '003_create_warehouses_table.sql',
    'locations': '004_create_locations_table.sql',
    'machines': '007_create_machines_table.sql',
    'production_lines': '009_create_production_lines_table.sql',
    'allergens': '010_create_allergens_table.sql',
    'tax_codes': '012_create_tax_codes_table.sql',
    'user_invitations': '006_create_user_invitations_table.sql',
    'user_sessions': '008_create_user_sessions_table.sql',
  };

  missingTables.forEach(t => {
    if (migrationMap[t]) {
      console.log(`   - ${migrationMap[t]}`);
    }
  });
}
