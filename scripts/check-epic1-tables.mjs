#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Checking Epic 1 tables existence and RLS...\n');

const tables = [
  'warehouses',
  'locations',
  'machines',
  'production_lines',
  'allergens',
  'tax_codes',
  'user_invitations',
  'user_sessions',
  'machine_line_assignments'
];

for (const table of tables) {
  console.log(`\n📋 Table: ${table}`);
  console.log('─'.repeat(60));

  // Try to query table
  const { data, error, count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: false });

  if (error) {
    console.log(`❌ Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    console.log(`   Details: ${error.details}`);
  } else {
    console.log(`✅ Table exists!`);
    console.log(`   Row count: ${count}`);
    console.log(`   Sample data:`, data?.slice(0, 2));
  }
}

// Check RLS policies using service role
console.log('\n\n🔒 Checking RLS Policies...\n');
console.log('─'.repeat(60));

const { data: policies, error: policiesError } = await supabase
  .rpc('get_rls_policies');

if (policiesError) {
  console.log('❌ Could not fetch RLS policies (expected - function may not exist)');
  console.log('   Error:', policiesError.message);
} else {
  console.log('✅ RLS Policies:', policies);
}
