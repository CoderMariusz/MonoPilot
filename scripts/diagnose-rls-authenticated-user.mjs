#!/usr/bin/env node
/**
 * Diagnose RLS Policy Violations for Authenticated Users
 * Checks why INSERT operations fail with "violates row-level security policy"
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Diagnosing RLS Policy Violations for Authenticated Users\n');
console.log('═'.repeat(70));

// The INSERT policy for warehouses requires:
// 1. org_id = (auth.jwt() ->> 'org_id')::uuid
// 2. EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin' AND org_id = ...)

console.log('\n📋 RLS INSERT Policy Requirements:\n');
console.log('For an authenticated user to INSERT a warehouse, ALL must be true:');
console.log('  1. User must exist in users table');
console.log('  2. User must have role = \'admin\'');
console.log('  3. User must have org_id set');
console.log('  4. auth.jwt() must contain org_id claim');
console.log('  5. Warehouse org_id must match user org_id\n');

console.log('─'.repeat(70));
console.log('🔍 Checking Production Data\n');

// Check 1: Do we have any users?
console.log('📊 Check 1: Users in database...\n');

const { data: users, error: usersError } = await supabase
  .from('users')
  .select('id, email, role, org_id, status')
  .limit(10);

if (usersError) {
  console.log(`❌ FAILED: ${usersError.message}`);
} else if (!users || users.length === 0) {
  console.log('⚠️  WARNING: No users found in database!');
  console.log('   This is the likely cause of RLS violations.');
  console.log('   Solution: Ensure users are created with proper org_id and role.\n');
} else {
  console.log(`✅ Found ${users.length} users:`);
  users.forEach(u => {
    console.log(`   - ${u.email}`);
    console.log(`     Role: ${u.role || 'NULL'}`);
    console.log(`     Org ID: ${u.org_id || 'NULL'}`);
    console.log(`     Status: ${u.status}`);
  });
  console.log('');

  // Check for admin users
  const adminUsers = users.filter(u => u.role === 'admin');
  if (adminUsers.length === 0) {
    console.log('⚠️  WARNING: No admin users found!');
    console.log('   RLS policies require role = \'admin\' for INSERT/UPDATE/DELETE');
    console.log('   Solution: Update at least one user to role = \'admin\'\n');
  } else {
    console.log(`✅ Found ${adminUsers.length} admin user(s)\n`);
  }

  // Check for users without org_id
  const usersWithoutOrg = users.filter(u => !u.org_id);
  if (usersWithoutOrg.length > 0) {
    console.log(`⚠️  WARNING: ${usersWithoutOrg.length} user(s) without org_id:`);
    usersWithoutOrg.forEach(u => console.log(`   - ${u.email}`));
    console.log('   RLS policies require org_id to be set');
    console.log('   Solution: Update users.org_id to match their organization\n');
  }
}

// Check 2: Do we have any organizations?
console.log('📊 Check 2: Organizations in database...\n');

const { data: orgs, error: orgsError } = await supabase
  .from('organizations')
  .select('id, company_name')
  .limit(10);

if (orgsError) {
  console.log(`❌ FAILED: ${orgsError.message}`);
} else if (!orgs || orgs.length === 0) {
  console.log('⚠️  WARNING: No organizations found!');
  console.log('   Users need to belong to an organization.');
} else {
  console.log(`✅ Found ${orgs.length} organization(s):`);
  orgs.forEach(o => {
    console.log(`   - ${o.company_name} (ID: ${o.id})`);
  });
  console.log('');
}

// Check 3: Test INSERT with service_role (should work)
console.log('📊 Check 3: Test INSERT with service_role...\n');

const testWarehouse = {
  org_id: users?.[0]?.org_id || (orgs?.[0]?.id || '00000000-0000-0000-0000-000000000000'),
  code: 'TEST-WH-001',
  name: 'Test Warehouse for RLS Diagnosis',
  is_active: true,
};

const { data: insertedWH, error: insertError } = await supabase
  .from('warehouses')
  .insert(testWarehouse)
  .select()
  .single();

if (insertError) {
  console.log(`❌ Service role INSERT FAILED: ${insertError.message}`);
  console.log(`   Code: ${insertError.code}`);
  console.log('   This should NOT happen - service_role should bypass RLS!');
  console.log('   Check: Migration 016 applied? Migration 017 applied?\n');
} else {
  console.log('✅ Service role INSERT succeeded');
  console.log(`   Created warehouse: ${insertedWH.code}`);
  console.log('   (Will delete this test record...)\n');

  // Clean up test record
  await supabase.from('warehouses').delete().eq('id', insertedWH.id);
}

console.log('═'.repeat(70));
console.log('📋 DIAGNOSIS SUMMARY\n');

const issues = [];

if (!users || users.length === 0) {
  issues.push('❌ No users in database');
}
if (users && users.filter(u => u.role === 'admin').length === 0) {
  issues.push('❌ No admin users (RLS requires role = \'admin\')');
}
if (users && users.filter(u => !u.org_id).length > 0) {
  issues.push('❌ Some users missing org_id');
}
if (!orgs || orgs.length === 0) {
  issues.push('❌ No organizations in database');
}
if (insertError) {
  issues.push('❌ Service role cannot INSERT (Migration 017 issue?)');
}

if (issues.length === 0) {
  console.log('✅ All checks passed!');
  console.log('\nIf authenticated users still get RLS violations, check:');
  console.log('   1. Is auth.jwt() returning org_id in claims?');
  console.log('   2. Is the frontend passing correct org_id in INSERT?');
  console.log('   3. Are cookies/sessions properly configured?');
} else {
  console.log('⚠️  Found issues:\n');
  issues.forEach(issue => console.log(`   ${issue}`));
  console.log('\n📝 Recommended fixes:');
  if (!users || users.length === 0) {
    console.log('   1. Create test user with proper org_id and role = \'admin\'');
  }
  if (users && users.filter(u => u.role === 'admin').length === 0) {
    console.log('   2. UPDATE users SET role = \'admin\' WHERE email = \'your-email@example.com\';');
  }
  if (users && users.filter(u => !u.org_id).length > 0) {
    console.log('   3. UPDATE users SET org_id = \'<org-uuid>\' WHERE org_id IS NULL;');
  }
}
