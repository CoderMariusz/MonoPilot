import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { seedProductionData, TEST_UUIDS } from '../e2e/fixtures/seed-production-data';

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
  console.log('Using org_id:', TEST_UUIDS.org);
  await seedProductionData(supabase);
}

main().catch(console.error);
