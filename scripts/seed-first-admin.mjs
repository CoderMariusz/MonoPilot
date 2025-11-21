#!/usr/bin/env node

/**
 * Seed First Admin User
 *
 * Creates the first admin user for MonoPilot using Supabase Admin API.
 * This solves the "chicken and egg" problem for invitation-only systems.
 *
 * Usage:
 *   node scripts/seed-first-admin.mjs
 *
 * Environment variables (from apps/frontend/.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Default credentials (can be overridden):
 *   Email: admin@monopilot.local
 *   Password: Admin123!@#
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load environment variables from apps/frontend/.env.local
const envPath = resolve(process.cwd(), 'apps/frontend/.env.local');
let envVars = {};

try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#') || trimmedLine === '') {
      return;
    }

    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
} catch (error) {
  console.error('❌ Could not read apps/frontend/.env.local');
  console.error('   Make sure the file exists with SUPABASE credentials');
  process.exit(1);
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Default admin credentials (can be overridden via env vars)
const adminEmail = process.env.ADMIN_EMAIL || 'admin@monopilot.local';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Admin';
const adminLastName = process.env.ADMIN_LAST_NAME || 'User';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in apps/frontend/.env.local:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

console.log('🌱 Seeding first admin user...\n');
console.log('📧 Email:', adminEmail);
console.log('🔐 Password:', '***' + adminPassword.slice(-4));
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    // Step 1: Check if any users exist
    console.log('📋 Step 1: Checking existing users...');
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    if (existingUsers.users.length > 0) {
      console.log(`⚠️  Found ${existingUsers.users.length} existing user(s):`);
      existingUsers.users.forEach(user => {
        console.log(`   - ${user.email} (created: ${new Date(user.created_at).toLocaleString()})`);
      });

      // Check if admin already exists
      const adminExists = existingUsers.users.find(u => u.email === adminEmail);
      if (adminExists) {
        console.log(`\n✅ Admin user already exists: ${adminEmail}`);
        console.log('   No action needed.');
        process.exit(0);
      }

      console.log(`\n⚠️  Continuing to create admin: ${adminEmail}`);
    } else {
      console.log('✓ No existing users found');
    }

    // Step 2: Create admin user
    console.log('\n📋 Step 2: Creating admin user...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: adminFirstName,
        last_name: adminLastName,
        role: 'admin'
      }
    });

    if (createError) {
      console.error('❌ Error creating admin user:', createError.message);
      process.exit(1);
    }

    console.log('✓ Admin user created successfully');
    console.log('   User ID:', newUser.user.id);
    console.log('   Email confirmed:', newUser.user.email_confirmed_at ? 'Yes' : 'No');

    // Step 3: Display credentials
    console.log('\n' + '='.repeat(60));
    console.log('✅ FIRST ADMIN USER CREATED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📝 Login Credentials:\n');
    console.log('   Email:    ', adminEmail);
    console.log('   Password: ', adminPassword);
    console.log('\n🔗 Login URL:\n');
    console.log('   http://localhost:3000/login');
    console.log('\n⚠️  IMPORTANT:\n');
    console.log('   - Change the password after first login');
    console.log('   - This user has admin privileges');
    console.log('   - Keep these credentials secure');
    console.log('\n' + '='.repeat(60) + '\n');

    // Step 4: Verify user can be retrieved
    console.log('📋 Step 3: Verifying user...');
    const { data: userData, error: getError } = await supabase.auth.admin.getUserById(newUser.user.id);

    if (getError) {
      console.error('⚠️  Warning: Could not verify user:', getError.message);
    } else {
      console.log('✓ User verified successfully');
    }

    console.log('\n🎉 Seed completed!\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
