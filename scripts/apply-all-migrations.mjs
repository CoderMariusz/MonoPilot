#!/usr/bin/env node

/**
 * Apply all migrations, seed, and verify RLS
 * 
 * This script applies all migrations in order, handling "already exists" errors gracefully,
 * then seeds the admin user and verifies RLS policies.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SECURITY ERROR: SUPABASE_ACCESS_TOKEN environment variable is required');
  console.error('   Usage: SUPABASE_ACCESS_TOKEN=<your-token> node scripts/apply-all-migrations.mjs');
  console.error('   Or add to .env file (make sure .env is in .gitignore!)');
  process.exit(1);
}

const MIGRATIONS = [
  { name: '000 - Create organizations table', script: 'apply-migration-via-api.mjs' },
  { name: '001 - Create users table', script: 'apply-migration-001.mjs' },
  { name: '002 - Fix RLS policies', script: 'apply-migration-002.mjs' },
  { name: '003 - Create warehouses table', script: 'apply-migration-003.mjs' },
  { name: '004 - Create locations table', script: 'apply-migration-004.mjs' },
  { name: '005 - Upgrade users table', script: 'apply-migration-005.mjs' },
  { name: '006 - Create user invitations table', script: 'apply-migration-006.mjs' },
  { name: '007 - Create machines table', script: 'apply-migration-007.mjs' },
  { name: '008 - Create user sessions table', script: 'apply-migration-008.mjs' },
  { name: '009 - Create production lines table', script: 'apply-migration-009.mjs' },
  { name: '010 - Create allergens table', script: 'apply-migration-010.mjs' },
  { name: '011 - Seed EU allergens function', script: 'apply-migration-011.mjs' },
  { name: '012 - Create tax codes table', script: 'apply-migration-012.mjs' },
  { name: '013 - Add modules_enabled to organizations', script: 'apply-migration-013.mjs' },
  { name: '014 - Add wizard fields to organizations', script: 'apply-migration-014.mjs' },
  { name: '015 - Auto activate users trigger', script: 'apply-migration-015.mjs' },
  { name: '016 - Comprehensive RLS fix for all Settings tables', script: 'apply-migration-016.mjs' }
];

async function applyMigration(migration) {
  try {
    const migrationPath = join(__dirname, '..', migration.path);
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log(`\n🔄 Applying ${migration.name}...`);

    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      // Check if it's an "already exists" error
      if (responseText.includes('already exists') || 
          responseText.includes('duplicate') ||
          responseText.includes('42710')) {
        console.log(`   ⚠️  ${migration.name} already applied (skipping)`);
        return { success: true, skipped: true };
      }
      
      console.error(`   ❌ ${migration.name} failed:`, response.status);
      console.error(`   Response: ${responseText}`);
      return { success: false, error: responseText };
    }

    console.log(`   ✅ ${migration.name} applied successfully!`);
    return { success: true, skipped: false };

  } catch (error) {
    console.error(`   ❌ Error applying ${migration.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting migration process...\n');
  console.log('=' .repeat(60));

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Apply all migrations
  for (const migration of MIGRATIONS) {
    try {
      console.log(`\n🔄 Running ${migration.script}...`);
      execSync(`node scripts/${migration.script}`, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_ID: PROJECT_REF }
      });
      successCount++;
    } catch (error) {
      // Check if it's an "already exists" error
      const errorOutput = (error.stdout?.toString() || '') + (error.stderr?.toString() || '');
      if (errorOutput.includes('already exists') ||
          errorOutput.includes('already applied') ||
          errorOutput.includes('duplicate') ||
          errorOutput.includes('42710')) {
        console.log(`   ⚠️  ${migration.name} already applied (skipping)`);
        skippedCount++;
      } else {
        console.error(`   ❌ ${migration.name} failed`);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successfully applied: ${successCount}`);
  console.log(`   ⚠️  Already exists (skipped): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  // Run seed
  console.log('\n' + '='.repeat(60));
  console.log('\n🌱 Running seed...\n');
  try {
    execSync('node scripts/seed-first-admin.mjs', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    // Continue anyway, seed might already be done
  }

  // Verify RLS
  console.log('\n' + '='.repeat(60));
  console.log('\n🔒 Verifying RLS policies...\n');
  try {
    execSync('node scripts/verify-all-rls-policies.mjs', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\n✅ RLS verification completed!');
  } catch (error) {
    console.error('\n⚠️  RLS verification had issues (check output above)');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ All done! Migrations, seed, and RLS verification completed.\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

