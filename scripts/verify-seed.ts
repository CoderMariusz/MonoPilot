import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { TEST_UUIDS } from '../e2e/fixtures/seed-production-data';

// Load .env.test
dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('Verifying seeded data for org:', TEST_UUIDS.org);

  // Production settings
  const { data: settings } = await supabase
    .from('production_settings')
    .select('*')
    .eq('org_id', TEST_UUIDS.org)
    .single();
  console.log('\nProduction settings:', settings ? 'EXISTS' : 'MISSING');

  // Work order
  const { data: wo } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, planned_quantity')
    .eq('id', TEST_UUIDS.workOrderReleased)
    .single();
  console.log('Work order:', wo);

  // License plate
  const { data: lp } = await supabase
    .from('license_plates')
    .select('id, lp_number, quantity, status, qa_status')
    .eq('id', TEST_UUIDS.lpFlour)
    .single();
  console.log('License plate:', lp);

  // Production lines in org
  const { data: lines } = await supabase
    .from('production_lines')
    .select('id, name, code')
    .eq('org_id', TEST_UUIDS.org);
  console.log('Production lines:', lines?.length, 'found');
}

main().catch(console.error);
