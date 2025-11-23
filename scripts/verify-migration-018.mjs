#!/usr/bin/env node
/**
 * Verify Migration 018: Check Foreign Keys
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Verifying Migration 018: Warehouse-Location Foreign Keys\n');
console.log('═'.repeat(70));

// Test 1: Check if warehouses table is accessible
console.log('\n📋 Test 1: Warehouses table access...\n');

const { data: warehouses, error: whError } = await supabase
  .from('warehouses')
  .select('*', { count: 'exact', head: true });

if (whError) {
  console.log(`❌ FAILED: ${whError.message}`);
} else {
  console.log(`✅ PASSED: Warehouses accessible (${warehouses?.length ?? 0} rows)`);
}

// Test 2: Check if locations table is accessible
console.log('\n📋 Test 2: Locations table access...\n');

const { data: locations, error: locError } = await supabase
  .from('locations')
  .select('*', { count: 'exact', head: true });

if (locError) {
  console.log(`❌ FAILED: ${locError.message}`);
} else {
  console.log(`✅ PASSED: Locations accessible (${locations?.length ?? 0} rows)`);
}

// Test 3: Try to query warehouses with location joins
console.log('\n📋 Test 3: Warehouses with location joins (PostgREST relationship)...\n');

const { data: whWithLocations, error: joinError } = await supabase
  .from('warehouses')
  .select(`
    *,
    default_receiving_location:locations!warehouses_default_receiving_location_id_fkey(*),
    default_shipping_location:locations!warehouses_default_shipping_location_id_fkey(*),
    transit_location:locations!warehouses_transit_location_id_fkey(*)
  `);

if (joinError) {
  console.log(`❌ FAILED: ${joinError.message}`);
  console.log(`   Code: ${joinError.code}`);
  console.log(`   Details: ${joinError.details}`);
  console.log(`   Hint: ${joinError.hint}`);
} else {
  console.log(`✅ PASSED: Join query successful`);
  console.log(`   Rows: ${whWithLocations?.length ?? 0}`);
  if (whWithLocations && whWithLocations.length > 0) {
    const sample = whWithLocations[0];
    console.log(`   Sample warehouse: ${sample.code}`);
  }
}

console.log('\n' + '═'.repeat(70));
console.log('📊 SUMMARY');
console.log('═'.repeat(70));

if (!whError && !locError && !joinError) {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('\n✅ Migration 018 successfully applied!');
  console.log('✅ Foreign keys are working correctly');
  console.log('✅ PostgREST can now join warehouses with locations');
  console.log('\n📋 Next steps:');
  console.log('   1. Test GET /api/settings/warehouses endpoint');
  console.log('   2. Fix RLS policy violations on warehouse creation');
  console.log('   3. Test all Epic 1 CRUD operations');
  process.exit(0);
} else {
  console.log('\n⚠️  SOME TESTS FAILED');
  console.log('\nReview errors above and check:');
  console.log('   1. Migration 018 was applied correctly');
  console.log('   2. All 3 foreign key constraints exist');
  console.log('   3. Tables have proper GRANT permissions (Migration 017)');
  process.exit(1);
}
