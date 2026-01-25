import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env.test
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceRoleKey || !supabaseUrl) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  // Query the test user
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, org_id, organizations(id, name)')
    .eq('id', '85c0b1fd-4a73-4a35-a50b-1170ef3d93fc')
    .single();

  if (userError) {
    console.error('User error:', userError);
  } else {
    console.log('User data:', JSON.stringify(userData, null, 2));
  }

  // Also check what seeded data exists
  const { data: testOrg, error: testOrgError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', '550e8400-e29b-41d4-a716-446655440001')
    .single();

  console.log('\nSeeded test org:', testOrg || testOrgError);

  // Check if production_settings exist for the user's org
  if (userData?.org_id) {
    const { data: settings, error: settingsError } = await supabase
      .from('production_settings')
      .select('*')
      .eq('org_id', userData.org_id)
      .single();

    console.log('\nProduction settings for user org:', settings || settingsError);
  }

  // Check work orders
  const { data: wos, error: wosError } = await supabase
    .from('work_orders')
    .select('id, wo_number, org_id, status')
    .eq('wo_number', 'wo-id-123')
    .single();

  console.log('\nWork order wo-id-123:', wos || wosError);
}

main().catch(console.error);
