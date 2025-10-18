#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { testUsers } from '../e2e/fixtures/test-data';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedTestUsers() {
  console.log('🌱 Seeding test users...');

  const users = Object.entries(testUsers).map(([key, user]) => ({
    email: user.email,
    password: user.password,
    name: user.name,
    role: user.role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  try {
    // Check if users already exist
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email')
      .in('email', users.map(u => u.email));

    const existingEmails = existingUsers?.map(u => u.email) || [];
    const newUsers = users.filter(user => !existingEmails.includes(user.email));

    if (newUsers.length === 0) {
      console.log('✅ All test users already exist');
      return;
    }

    // Insert new users
    const { data, error } = await supabase
      .from('users')
      .insert(newUsers);

    if (error) {
      console.error('❌ Error seeding users:', error);
      throw error;
    }

    console.log(`✅ Successfully seeded ${newUsers.length} test users:`);
    newUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    if (existingEmails.length > 0) {
      console.log(`ℹ️  ${existingEmails.length} users already existed:`);
      existingEmails.forEach(email => {
        console.log(`   - ${email}`);
      });
    }

  } catch (error) {
    console.error('❌ Failed to seed test users:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    await seedTestUsers();
    console.log('🎉 Test user seeding completed successfully!');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedTestUsers };
