#!/usr/bin/env node

/**
 * Verify test user profile script
 *
 * This script checks if the test user has a profile record in the users table.
 * If not, it creates one.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const testUserEmail = process.env.TEST_USER_EMAIL || 'przyslony@gmail.com';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

console.log('🔍 Verifying test user profile...');
console.log('📧 Test user email:', testUserEmail);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    // 1. Check if user exists in auth.users
    console.log('\n📋 Step 1: Checking auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error listing auth users:', authError);
      process.exit(1);
    }

    const authUser = authUsers.users.find(u => u.email === testUserEmail);

    if (!authUser) {
      console.error(`❌ User ${testUserEmail} not found in auth.users`);
      console.log('💡 Please create the user first via signup or Supabase dashboard');
      process.exit(1);
    }

    console.log('✅ User found in auth.users');
    console.log('   User ID:', authUser.id);
    console.log('   Email:', authUser.email);
    console.log('   Created:', authUser.created_at);

    // 2. Check if user has profile in public.users
    console.log('\n📋 Step 2: Checking public.users...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('❌ Error fetching profile:', profileError);
      process.exit(1);
    }

    if (profile) {
      console.log('✅ User profile exists:');
      console.log('   ID:', profile.id);
      console.log('   Name:', profile.name);
      console.log('   Email:', profile.email);
      console.log('   Role:', profile.role);
      console.log('   Status:', profile.status);
      console.log('\n✅ Test user is properly configured!');
      process.exit(0);
    }

    // 3. Create profile if missing
    console.log('⚠️  User profile not found in public.users');
    console.log('🔧 Creating profile...');

    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || 'Test User',
        role: 'Admin',
        status: 'active'
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating profile:', createError);
      process.exit(1);
    }

    console.log('✅ Profile created successfully:');
    console.log('   ID:', newProfile.id);
    console.log('   Name:', newProfile.name);
    console.log('   Email:', newProfile.email);
    console.log('   Role:', newProfile.role);
    console.log('   Status:', newProfile.status);
    console.log('\n✅ Test user is now properly configured!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
