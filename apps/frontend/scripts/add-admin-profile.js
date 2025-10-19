const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdminProfile() {
  try {
    console.log('🔍 Adding admin profile...');
    
    // First, try to sign in as admin to get the user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'przyslony@gmail.com',
      password: 'Test1234',
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }
    
    console.log(`✅ Signed in as admin: ${authData.user.id}`);
    
    // Then create the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        name: 'Mariusz Krawczyk',
        email: 'przyslony@gmail.com',
        role: 'Admin',
        status: 'Active'
      })
      .select();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return;
    }
    
    console.log(`✅ Admin profile created: ${profileData[0].name} (${profileData[0].role})`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addAdminProfile();
