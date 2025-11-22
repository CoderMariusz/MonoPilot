/**
 * Apply Migration 013: Add modules_enabled to organizations
 * Story: 1.11 Module Activation
 *
 * Usage:
 *   node scripts/apply-migration-013.mjs
 *
 * Or with explicit env vars:
 *   SUPABASE_ACCESS_TOKEN=xxx SUPABASE_PROJECT_ID=xxx node scripts/apply-migration-013.mjs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('Usage: SUPABASE_ACCESS_TOKEN=xxx node scripts/apply-migration-013.mjs');
  process.exit(1);
}

console.log('📦 Migration 013: Add modules_enabled to organizations');
console.log('Project ID:', SUPABASE_PROJECT_ID);
console.log('');

// Read migration SQL file
const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '013_add_modules_enabled_to_organizations.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

// Supabase Management API endpoint
const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/query`;

console.log('🚀 Executing migration...\n');

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      query: migrationSQL,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Migration failed:');
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log('✅ Migration 013 applied successfully!');
  console.log('');
  console.log('Added:');
  console.log('  - Column: organizations.modules_enabled (TEXT[] NOT NULL)');
  console.log('  - Default: [technical, planning, production, warehouse]');
  console.log('  - Constraint: At least one module required');
  console.log('  - Index: GIN index for array contains operations');
  console.log('  - Function: is_module_enabled(org_id, module_code)');
  console.log('');
  console.log('Available modules:');
  console.log('  - technical  (ON)  - Products, BOMs, Routings');
  console.log('  - planning   (ON)  - POs, TOs, WOs');
  console.log('  - production (ON)  - WO Execution');
  console.log('  - warehouse  (ON)  - LPs, Moves, Pallets');
  console.log('  - quality    (OFF) - QA Workflows');
  console.log('  - shipping   (OFF) - SOs, Pick Lists');
  console.log('  - npd        (OFF) - Formulation');
  console.log('  - finance    (OFF) - Costing, Margin Analysis');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Implement Module Service (module-service.ts)');
  console.log('  2. Implement API middleware (moduleCheckMiddleware)');
  console.log('  3. Implement API endpoints (/api/settings/modules)');

} catch (error) {
  console.error('❌ Error applying migration:');
  console.error(error.message);
  process.exit(1);
}
