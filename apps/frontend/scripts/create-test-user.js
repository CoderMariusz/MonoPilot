const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  try {
    console.log('🔍 Creating test user...');
    
    // First, try to sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'przyslony@gmail.com',
      password: 'Test1234',
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Then create the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name: 'Admin User',
        email: 'przyslony@gmail.com',
        role: 'Admin',
        status: 'Active'
      })
      .select();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return;
    }

    console.log('✅ User profile created:', profileData);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTestUser();
