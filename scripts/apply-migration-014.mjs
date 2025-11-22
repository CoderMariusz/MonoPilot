/**
 * Apply Migration 014: Add wizard fields to organizations
 * Story: 1.12 Settings Wizard
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN required');
  process.exit(1);
}

console.log('📦 Migration 014: Add wizard fields to organizations\n');

const migrationPath = join(__dirname, '..', 'apps', 'frontend', 'lib', 'supabase', 'migrations', '014_add_wizard_fields_to_organizations.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

const url = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/query`;

try {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query: migrationSQL }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('❌ Migration failed:', JSON.stringify(result, null, 2));
    process.exit(1);
  }

  console.log('✅ Migration 014 applied successfully!\n');
  console.log('Added:');
  console.log('  - Column: wizard_completed (BOOLEAN DEFAULT false)');
  console.log('  - Column: wizard_progress (JSONB)');
  console.log('  - Index: idx_organizations_wizard_completed');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
