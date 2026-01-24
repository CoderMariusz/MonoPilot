import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkUser() {
  console.log('Checking user profile...\n');

  // 1. Check auth user
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const adminUser = authUsers.users.find(u => u.email === 'admin@monopilot.com');

  if (adminUser) {
    console.log('✅ Auth user exists:');
    console.log('   ID:', adminUser.id);
    console.log('   Email:', adminUser.email);
    console.log('   Created:', adminUser.created_at);
  } else {
    console.log('❌ Auth user NOT found!');
    return;
  }

  // 2. Check user profile
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*, role:roles(name), org:organizations(name)')
    .eq('email', 'admin@monopilot.com')
    .maybeSingle();

  console.log('\n');
  if (userProfile) {
    console.log('✅ User profile exists:');
    console.log('   ID:', userProfile.id);
    console.log('   Email:', userProfile.email);
    console.log('   Name:', userProfile.first_name, userProfile.last_name);
    console.log('   Role:', userProfile.role ? userProfile.role.name : 'N/A');
    console.log('   Org:', userProfile.org ? userProfile.org.name : 'N/A');
    console.log('   Active:', userProfile.is_active);
    console.log('\n✅ EVERYTHING OK - User can login!');
  } else {
    console.log('❌ User profile NOT FOUND in public.users table!');
    console.log('\n⚠️  This is causing the redirect loop!');
    console.log('\n🔧 FIX: Run QUICK-CREATE-USER.sql in Supabase Dashboard');
    console.log('   https://supabase.com/dashboard/project/pgroxddbtaevdegnidaz/sql/new');
    if (error) console.log('\nError:', error.message);
  }

  // 3. Check organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', 'a0000000-0000-0000-0000-000000000001')
    .maybeSingle();

  console.log('\n');
  if (org) {
    console.log('✅ Organization exists:', org.name);
  } else {
    console.log('❌ Organization NOT found - need to create it!');
  }
}

checkUser();
