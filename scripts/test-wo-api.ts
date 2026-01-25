import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { TEST_UUIDS } from '../e2e/fixtures/seed-production-data';

// Load .env.test
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create anon client (like browser would)
const supabaseAnon = createClient(supabaseUrl, anonKey);

// Create service client (bypasses RLS)
const supabaseService = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Testing WO API access...\n');
  console.log('WO UUID:', TEST_UUIDS.workOrderReleased);

  // Test 1: Service role can access
  console.log('\n1. Service role query:');
  const { data: serviceData, error: serviceError } = await supabaseService
    .from('work_orders')
    .select('id, wo_number, status, org_id')
    .eq('id', TEST_UUIDS.workOrderReleased)
    .single();

  if (serviceError) {
    console.log('   ERROR:', serviceError);
  } else {
    console.log('   Found:', serviceData);
  }

  // Test 2: Try with anon key (would need auth)
  console.log('\n2. Anon query (no auth - should fail with RLS):');
  const { data: anonData, error: anonError } = await supabaseAnon
    .from('work_orders')
    .select('id, wo_number, status')
    .eq('id', TEST_UUIDS.workOrderReleased)
    .single();

  if (anonError) {
    console.log('   Expected error:', anonError.code, anonError.message);
  } else {
    console.log('   Found:', anonData);
  }

  // Test 3: Check if work order has the correct org_id
  console.log('\n3. Verify org_id matches test user org:');
  const expectedOrgId = 'a0000000-0000-0000-0000-000000000001';
  if (serviceData?.org_id === expectedOrgId) {
    console.log('   OK: WO org_id matches test user org');
  } else {
    console.log('   MISMATCH: WO org_id =', serviceData?.org_id, 'vs expected', expectedOrgId);
  }
}

main().catch(console.error);
