#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_ACCESS_TOKEN = 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = 'pgroxddbtaevdegnidaz';

console.log('🔄 Applying migration 002: Fix RLS policies...\n');

const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/002_fix_rls_policies.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: migrationSQL })
});

if (!response.ok) {
  const errorText = await response.text();
  console.error('❌ Migration failed:', response.status, errorText);
  process.exit(1);
}

console.log('✅ Migration 002 applied successfully!');
console.log('   - Fixed RLS policies for organizations');
console.log('   - Fixed RLS policies for users');
console.log('   - Granted proper permissions to service_role and authenticated');
console.log('   - Inserted default organization and linked users\n');
