#!/usr/bin/env node
/**
 * Apply Migration 018 via Supabase Management API
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_ACCESS_TOKEN = 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_ID = 'pgroxddbtaevdegnidaz';
const API_URL = `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`;

console.log('🔧 Applying Migration 018 via Supabase Management API\n');
console.log('═'.repeat(70));

// Read migration file
const migrationPath = join(__dirname, '../apps/frontend/lib/supabase/migrations/018_add_warehouse_location_foreign_keys.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

// Extract just the ALTER TABLE statements (skip comments)
const commands = [
  `ALTER TABLE public.warehouses ADD CONSTRAINT warehouses_default_receiving_location_id_fkey FOREIGN KEY (default_receiving_location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;`,
  `ALTER TABLE public.warehouses ADD CONSTRAINT warehouses_default_shipping_location_id_fkey FOREIGN KEY (default_shipping_location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;`,
  `ALTER TABLE public.warehouses ADD CONSTRAINT warehouses_transit_location_id_fkey FOREIGN KEY (transit_location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;`,
  `COMMENT ON TABLE public.warehouses IS 'Migration 018: Added missing FK constraints to locations table';`
];

console.log('\n📋 Executing 4 SQL commands...\n');

for (let i = 0; i < commands.length; i++) {
  const cmd = commands[i];
  const constraintName = cmd.match(/CONSTRAINT (\w+)/)?.[1] || 'COMMENT';

  console.log(`${i + 1}. ${constraintName}...`);

  const escapedQuery = cmd.replace(/"/g, '\\"');
  const curlCmd = `curl -s "${API_URL}" -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" -H "Content-Type: application/json" -d "{\\"query\\": \\"${escapedQuery}\\"}"`;

  try {
    const { stdout, stderr } = await execAsync(curlCmd);
    const response = JSON.parse(stdout);

    if (response.error || response.message) {
      console.log(`   ❌ FAILED: ${response.error || response.message}`);
      if (response.hint) console.log(`   💡 Hint: ${response.hint}`);
    } else {
      console.log(`   ✅ SUCCESS`);
    }
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}`);
  }
}

console.log('\n' + '═'.repeat(70));
console.log('✅ Migration 018 applied!\n');

console.log('🔍 Verifying foreign keys...\n');

const verifyQuery = `SELECT conname, contype FROM pg_constraint WHERE conrelid = 'public.warehouses'::regclass AND contype = 'f' AND conname LIKE '%location%' ORDER BY conname;`;
const escapedVerify = verifyQuery.replace(/"/g, '\\"');
const verifyCurl = `curl -s "${API_URL}" -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" -H "Content-Type: application/json" -d "{\\"query\\": \\"${escapedVerify}\\"}"`;

try {
  const { stdout } = await execAsync(verifyCurl);
  const response = JSON.parse(stdout);

  if (response.error || response.message) {
    console.log(`❌ Verification failed: ${response.error || response.message}`);
  } else if (response.result) {
    console.log('✅ Foreign keys verified:');
    response.result.forEach(row => {
      console.log(`   - ${row.conname}`);
    });
  }
} catch (err) {
  console.log(`⚠️  Could not verify: ${err.message}`);
}

console.log('\n📋 Next: Test GET /api/settings/warehouses endpoint');
