/**
 * Verify E2E Seed Data
 * Quick script to verify seeded data exists in database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyData() {
  console.log('🔍 Verifying seeded data...\n');

  // Get org
  const { data: org } = await supabase.from('organizations').select('*').limit(1).single();
  console.log(`📋 Organization: ${org.name} (${org.id})\n`);

  // Count suppliers
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('code, name, contact_email, contact_phone')
    .eq('org_id', org.id);
  console.log(`📦 Suppliers (${suppliers?.length || 0}):`);
  suppliers?.forEach(s => console.log(`   - ${s.code}: ${s.name} | ${s.contact_email} | ${s.contact_phone}`));

  // Count warehouses
  const { data: warehouses } = await supabase
    .from('warehouses')
    .select('code, name, type')
    .eq('org_id', org.id);
  console.log(`\n🏭 Warehouses (${warehouses?.length || 0}):`);
  warehouses?.forEach(w => console.log(`   - ${w.code}: ${w.name} (${w.type})`));

  // Count products
  const { data: products } = await supabase
    .from('products')
    .select('code, name, base_uom, status, shelf_life_days')
    .eq('org_id', org.id);
  console.log(`\n🥫 Products (${products?.length || 0}):`);
  products?.forEach(p => console.log(`   - ${p.code}: ${p.name} | ${p.base_uom} | ${p.status} | ${p.shelf_life_days} days`));

  console.log('\n✅ Verification complete!');
}

verifyData();
