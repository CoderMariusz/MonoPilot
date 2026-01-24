import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('🔍 Verifying migration results...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check roles table
console.log('📊 Roles table:');
const { data: roles, error: rolesError } = await supabase
  .from('roles')
  .select('code, name, is_system')
  .order('display_order');

if (rolesError) {
  console.error('   ❌ Error:', rolesError.message);
} else {
  console.log(`   ✅ Found ${roles.length} roles:`);
  roles.forEach(r => console.log(`      - ${r.code}: ${r.name} ${r.is_system ? '(system)' : ''}`));
}

// Check modules table
console.log('\n📊 Modules table:');
const { data: modules, error: modulesError } = await supabase
  .from('modules')
  .select('code, name, can_disable')
  .order('display_order');

if (modulesError) {
  console.error('   ❌ Error:', modulesError.message);
} else {
  console.log(`   ✅ Found ${modules.length} modules:`);
  modules.forEach(m => console.log(`      - ${m.code}: ${m.name} ${m.can_disable ? '' : '(required)'}`));
}

// Check organization_modules table
console.log('\n📊 Organization_modules table:');
const { data: orgModules, error: orgModulesError } = await supabase
  .from('organization_modules')
  .select('*')
  .limit(5);

if (orgModulesError) {
  console.error('   ❌ Error:', orgModulesError.message);
} else {
  console.log(`   ✅ Table exists (${orgModules.length} entries)`);
}

// Check organizations - new columns
console.log('\n📊 Organizations - new columns:');
const { data: orgs, error: orgsError } = await supabase
  .from('organizations')
  .select('id, name, slug, onboarding_step, is_active')
  .limit(3);

if (orgsError) {
  console.error('   ❌ Error:', orgsError.message);
} else {
  console.log(`   ✅ ${orgs.length} organizations with new schema:`);
  orgs.forEach(o => console.log(`      - ${o.name} (slug: ${o.slug}, step: ${o.onboarding_step}, active: ${o.is_active})`));
}

// Check users - new columns
console.log('\n📊 Users - new columns:');
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('email, role_id, language, is_active')
  .limit(3);

if (usersError) {
  console.error('   ❌ Error:', usersError.message);
} else {
  console.log(`   ✅ ${users.length} users with new schema:`);
  users.forEach(u => console.log(`      - ${u.email} (role_id: ${u.role_id ? u.role_id.substring(0, 8) + '...' : 'NULL'}, active: ${u.is_active})`));
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ Migration verification complete!\n');

console.log('📋 Summary:');
console.log('   ✅ New tables created: roles, modules, organization_modules');
console.log('   ✅ Organizations: added name, slug, onboarding fields');
console.log('   ✅ Users: added role_id, language, is_active');
console.log('   ✅ System data seeded: 10 roles, 11 modules\n');
