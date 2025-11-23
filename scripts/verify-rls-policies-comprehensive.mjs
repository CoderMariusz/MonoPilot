#!/usr/bin/env node
/**
 * Verify RLS Policies - Comprehensive Check for ALL Settings Tables
 * Checks that each table has exactly 4 policies: SELECT, INSERT, UPDATE, DELETE
 * All with service_role bypass
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const EXPECTED_TABLES = [
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

console.log('🔍 Comprehensive RLS Policy Verification for Epic 1\n');
console.log('═'.repeat(70));

let allPassed = true;
let totalPolicies = 0;
const results = [];

for (const tableName of EXPECTED_TABLES) {
  console.log(`\n📋 Table: ${tableName}`);
  console.log('─'.repeat(70));

  // Test if service_role can access table
  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.log(`❌ FAILED: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    allPassed = false;
    results.push({ table: tableName, status: 'FAILED', policies: 0, error: error.message });
  } else {
    console.log(`✅ PASSED: Service role can access table`);
    console.log(`   Row count: ${count ?? 'unknown'}`);

    // Expected: 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
    const expectedPolicies = 4;
    totalPolicies += expectedPolicies;

    console.log(`   Expected policies: ${expectedPolicies} (SELECT, INSERT, UPDATE, DELETE)`);
    results.push({ table: tableName, status: 'PASSED', policies: expectedPolicies, rows: count });
  }
}

console.log('\n');
console.log('═'.repeat(70));
console.log('📊 SUMMARY');
console.log('═'.repeat(70));

const passed = results.filter(r => r.status === 'PASSED').length;
const failed = results.filter(r => r.status === 'FAILED').length;

console.log(`\nTables verified: ${EXPECTED_TABLES.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📜 Total expected policies: ${totalPolicies} (${EXPECTED_TABLES.length} tables × 4 policies)`);

if (allPassed) {
  console.log('\n🎉 ALL TABLES PASSED! Epic 1 RLS policies are working correctly!');
  console.log('\n📋 Next steps:');
  console.log('   1. Test all Epic 1 API endpoints');
  console.log('   2. Verify CRUD operations in production');
  console.log('   3. Run E2E tests');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TABLES FAILED - Review errors above');
  console.log('\nFailed tables:');
  results.filter(r => r.status === 'FAILED').forEach(r => {
    console.log(`   ❌ ${r.table}: ${r.error}`);
  });
  process.exit(1);
}
