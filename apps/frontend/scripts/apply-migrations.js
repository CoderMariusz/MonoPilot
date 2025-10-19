#!/usr/bin/env node

/**
 * Migration Runner Script
 * This script applies database migrations to fix missing tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(migrationFile) {
  try {
    console.log(`📄 Applying migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '..', 'lib', 'supabase', 'migrations', migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error(`❌ Error applying ${migrationFile}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully applied ${migrationFile}`);
    return true;
  } catch (err) {
    console.error(`❌ Error reading ${migrationFile}:`, err.message);
    return false;
  }
}

async function applyCriticalMigrations() {
  console.log('🚀 Applying critical migrations...\n');
  
  // Critical migrations for routing functionality
  const criticalMigrations = [
    '008_bom_routing.sql',
    '009_routing_requirements.sql'
  ];
  
  let successCount = 0;
  
  for (const migration of criticalMigrations) {
    const success = await applyMigration(migration);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Applied ${successCount}/${criticalMigrations.length} migrations`);
  
  if (successCount === criticalMigrations.length) {
    console.log('✅ All critical migrations applied successfully!');
    return true;
  } else {
    console.log('❌ Some migrations failed. Check the errors above.');
    return false;
  }
}

// Run the migrations
applyCriticalMigrations()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Error applying migrations:', error);
    process.exit(1);
  });
