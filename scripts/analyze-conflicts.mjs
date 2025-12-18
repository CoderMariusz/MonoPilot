import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Analyzing database conflicts...\n');

// Get current organizations structure
const { data: orgs } = await supabase.from('organizations').select('*').limit(1);
console.log('📊 CURRENT organizations columns:');
if (orgs?.[0]) {
  console.log('   ', Object.keys(orgs[0]).join(', '));
}

console.log('\n🆕 NEW organizations columns (from migration 054):');
console.log('    id, name, slug, timezone, locale, currency, logo_url,');
console.log('    onboarding_step, onboarding_started_at, onboarding_completed_at, onboarding_skipped,');
console.log('    is_active, created_at, updated_at');

console.log('\n⚠️  CONFLICTS in organizations:');
console.log('    - OLD has: company_name');
console.log('    - NEW has: name, slug');
console.log('    - Missing in NEW: address, city, postal_code, country, nip_vat, fiscal_year_start,');
console.log('                       date_format, number_format, unit_system, modules_enabled,');
console.log('                       wizard_completed, wizard_progress');

// Get current users structure
const { data: users } = await supabase.from('users').select('*').limit(1);
console.log('\n\n📊 CURRENT users columns:');
if (users?.[0]) {
  console.log('   ', Object.keys(users[0]).join(', '));
}

console.log('\n🆕 NEW users columns (from migration 056):');
console.log('    id, org_id, email, first_name, last_name, role_id, language,');
console.log('    is_active, last_login_at, created_at, updated_at');

console.log('\n⚠️  CONFLICTS in users:');
console.log('    - OLD has: role (TEXT), status, created_by, updated_by, default_warehouse_id');
console.log('    - NEW has: role_id (UUID FK to roles), language');
console.log('    - OLD needs migration: role -> role_id mapping');

console.log('\n\n💡 MIGRATION STRATEGY:');
console.log('1. Create NEW tables: roles, modules, organization_modules (no conflicts)');
console.log('2. Seed roles and modules (migration 059)');
console.log('3. ALTER organizations: add missing columns (name, slug, onboarding fields)');
console.log('4. Migrate data: company_name -> name, generate slug');
console.log('5. ALTER users: add role_id column');
console.log('6. Migrate data: map old role TEXT to new role_id UUID');
console.log('7. Add RLS policies (migration 058)');
console.log('8. Verify all constraints work');

console.log('\n\n📋 SAFE EXECUTION PLAN:');
console.log('Phase 1: Create non-conflicting tables (roles, modules, organization_modules)');
console.log('Phase 2: Seed system data');
console.log('Phase 3: Alter existing tables with new columns (non-breaking)');
console.log('Phase 4: Migrate data');
console.log('Phase 5: Add constraints and RLS policies');
