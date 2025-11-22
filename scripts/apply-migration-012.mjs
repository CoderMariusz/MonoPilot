#!/usr/bin/env node

/**
 * Apply migration 012 (Tax Codes table) via Supabase Management API
 * Story: 1.10 - Tax Code Configuration
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

console.log('🔄 Applying migration 012 (Tax Codes table) via Management API...\n');

// Read migration file
const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/012_create_tax_codes_table.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

async function main() {
  try {
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
      
      if (errorText.includes('already exists') || 
          errorText.includes('duplicate') ||
          errorText.includes('42710')) {
        console.log('\n⚠️  Migration 012 already applied (some objects may already exist)');
      }
      
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 012 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - public.tax_codes table');
    console.log('   - RLS policies (select, insert, update, delete)');
    console.log('   - Indexes: org_id, code, rate');
    console.log('   - Trigger: updated_at auto-update');
    console.log('   - Function: seed_tax_codes_for_organization(org_id, country_code)');
    console.log('\n🎯 Key Features:');
    console.log('   - Multi-tenancy via org_id RLS');
    console.log('   - Country-based tax code seeding (PL, UK, default)');
    console.log('   - Unique tax codes per organization');
    console.log('   - Rate validation (0-100%)');
    console.log('\n💡 Usage:');
    console.log('   SELECT seed_tax_codes_for_organization(\'<org_id>\', \'<country_code>\');');
    console.log('   -- Will seed tax codes based on country (PL: VAT23, VAT8, VAT5, VAT0)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
