import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('Creating test user...\n');

  try {
    // 1. Create organization
    console.log('1. Creating organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'MonoPilot Demo',
        slug: 'monopilot-demo',
        timezone: 'Europe/Warsaw',
        locale: 'pl',
        currency: 'PLN',
        is_active: true,
        onboarding_completed_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (orgError && orgError.code !== '23505') {
      console.error('Organization error:', orgError);
    } else {
      console.log('✅ Organization created');
    }

    // 2. Get admin role
    console.log('2. Getting admin role...');
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'admin')
      .single();

    if (roleError) {
      console.error('Role error:', roleError);
      return;
    }
    console.log('✅ Admin role found:', adminRole.id);

    // 3. Create user in auth.users using Admin API
    console.log('3. Creating auth user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@monopilot.com',
      password: 'test1234',
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    console.log('✅ Auth user created:', authUser.user.id);

    // 4. Create user profile
    console.log('4. Creating user profile...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authUser.user.id,
        org_id: 'a0000000-0000-0000-0000-000000000001',
        email: 'admin@monopilot.com',
        first_name: 'Admin',
        last_name: 'User',
        role_id: adminRole.id,
        language: 'pl',
        is_active: true,
        last_login_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return;
    }
    console.log('✅ User profile created');

    // 5. Verify
    console.log('\n5. Verifying user...');
    const { data: verification, error: verifyError } = await supabase
      .from('users')
      .select(`
        email,
        first_name,
        last_name,
        is_active,
        role:roles(name),
        org:organizations(name)
      `)
      .eq('email', 'admin@monopilot.com')
      .single();

    if (verifyError) {
      console.error('Verification error:', verifyError);
      return;
    }

    console.log('\n✅ TEST USER CREATED SUCCESSFULLY!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:        admin@monopilot.com');
    console.log('Password:     test1234');
    console.log('Role:        ', verification.role.name);
    console.log('Organization:', verification.org.name);
    console.log('Status:       Active');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();
