#!/usr/bin/env node

/**
 * Apply migration 011 (Seed EU Allergens Function) via Supabase Management API
 * Story: 1.9 - Allergen Management
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = 'pgroxddbtaevdegnidaz';

console.log('🔄 Applying migration 011 (Seed EU Allergens Function) via Management API...\n');

// Read migration file
const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/011_seed_eu_allergens_function.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function main() {
  try {
    // Use Supabase Management API to execute SQL
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Migration failed:', response.status, response.statusText);
      console.error('Response:', errorText);
      
      // Check if it's an "already exists" error
      if (errorText.includes('already exists') || 
          errorText.includes('duplicate') ||
          errorText.includes('42710')) {
        console.log('\n⚠️  Migration 011 already applied (function may already exist)');
        console.log('   This is normal if migration was partially applied before.');
      }
      
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 011 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - Function: seed_eu_allergens(p_org_id UUID)');
    console.log('   - Security: SECURITY DEFINER (runs with function owner privileges)');
    console.log('   - Permissions: EXECUTE granted to authenticated');
    console.log('\n🎯 Key Features:');
    console.log('   - Seeds 14 EU major allergens (Regulation EU 1169/2011)');
    console.log('   - Idempotent: ON CONFLICT DO NOTHING (safe to re-run)');
    console.log('   - Allergens:');
    console.log('     • MILK - Milk');
    console.log('     • EGGS - Eggs');
    console.log('     • FISH - Fish');
    console.log('     • SHELLFISH - Crustaceans');
    console.log('     • TREENUTS - Tree Nuts');
    console.log('     • PEANUTS - Peanuts');
    console.log('     • WHEAT - Gluten (Wheat)');
    console.log('     • SOYBEANS - Soybeans');
    console.log('     • SESAME - Sesame Seeds');
    console.log('     • MUSTARD - Mustard');
    console.log('     • CELERY - Celery');
    console.log('     • LUPIN - Lupin');
    console.log('     • SULPHITES - Sulphur Dioxide/Sulphites');
    console.log('     • MOLLUSCS - Molluscs');
    console.log('\n💡 Usage:');
    console.log('   SELECT seed_eu_allergens(\'<org_id>\');');
    console.log('   -- Will seed 14 allergens for the specified organization\n');

    if (result && Object.keys(result).length > 0) {
      console.log('API Response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

