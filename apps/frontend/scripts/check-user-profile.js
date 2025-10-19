const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserProfile() {
  try {
    console.log('🔍 Checking user profile...');
    
    // First, try to sign in to get the user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'przyslony@gmail.com',
      password: 'Test1234',
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Auth user found:', authData.user?.id);

    // Check what's in the users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return;
    }

    console.log('✅ User profile found:', profileData);
    console.log('Name:', profileData.name);
    console.log('Role:', profileData.role);
    console.log('Email:', profileData.email);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUserProfile();
