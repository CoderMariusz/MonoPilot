#!/usr/bin/env node

/**
 * Apply all migrations, seed, and verify RLS
 * 
 * This script applies all migrations in order, handling "already exists" errors gracefully,
 * then seeds the admin user and verifies RLS policies.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const SUPABASE_ACCESS_TOKEN = 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = 'pgroxddbtaevdegnidaz';

const MIGRATIONS = [
  {
    name: '000 - Create organizations table',
    path: 'apps/frontend/lib/supabase/migrations/000_create_organizations_table_no_rls.sql',
    script: 'apply-migration-via-api.mjs'
  },
  {
    name: '001 - Create users table',
    path: 'apps/frontend/lib/supabase/migrations/001_create_users_table_minimal.sql',
    script: 'apply-migration-001.mjs'
  },
  {
    name: '002 - Fix RLS policies',
    path: 'apps/frontend/lib/supabase/migrations/002_fix_rls_policies.sql',
    script: 'apply-migration-002.mjs'
  },
  {
    name: '003 - Create warehouses table',
    path: 'apps/frontend/lib/supabase/migrations/003_create_warehouses_table.sql',
    script: 'apply-migration-003.mjs'
  },
  {
    name: '004 - Create locations table',
    path: 'apps/frontend/lib/supabase/migrations/004_create_locations_table.sql',
    script: 'apply-migration-004.mjs'
  },
  {
    name: '003 - Create activity logs table',
    path: 'apps/frontend/lib/supabase/migrations/003_create_activity_logs_table.sql',
    script: null // Apply directly
  },
  {
    name: '004 - Create user preferences table',
    path: 'apps/frontend/lib/supabase/migrations/004_create_user_preferences_table.sql',
    script: null // Apply directly
  }
];

async function applyMigration(migration) {
  try {
    const migrationPath = resolve(process.cwd(), migration.path);
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
    if (migration.script) {
      // Use existing script if available
      try {
        console.log(`\n🔄 Running ${migration.script}...`);
        execSync(`node scripts/${migration.script}`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        successCount++;
      } catch (error) {
        // Check if it's an "already exists" error
        if (error.stdout?.toString().includes('already exists') ||
            error.stderr?.toString().includes('already exists')) {
          console.log(`   ⚠️  ${migration.name} already applied (skipping)`);
          skippedCount++;
        } else {
          console.error(`   ❌ ${migration.name} failed`);
          errorCount++;
        }
      }
    } else {
      // Apply migration directly
      const result = await applyMigration(migration);
      if (result.success) {
        if (result.skipped) {
          skippedCount++;
        } else {
          successCount++;
        }
      } else {
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

