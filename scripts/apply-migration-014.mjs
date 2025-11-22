#!/usr/bin/env node

/**
 * Apply migration 014 (Add wizard fields to organizations) via Supabase Management API
 * Story: 1.12 - Settings Wizard UX Design
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_746ebb84f490d20073c38c4d1fdb503b2267a2ac';
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'pgroxddbtaevdegnidaz';

console.log('🔄 Applying migration 014 (Add wizard fields to organizations) via Management API...\n');

// Read migration file
const migrationPath = resolve(process.cwd(), 'apps/frontend/lib/supabase/migrations/014_add_wizard_fields_to_organizations.sql');
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
        console.log('\n⚠️  Migration 014 already applied (columns may already exist)');
      }
      
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Migration 014 applied successfully!');
    console.log('\n📋 Created:');
    console.log('   - Column: organizations.wizard_completed (BOOLEAN, default false)');
    console.log('   - Column: organizations.wizard_progress (JSONB, nullable)');
    console.log('   - Index: idx_organizations_wizard_completed');
    console.log('\n🎯 Key Features:');
    console.log('   - Wizard completion status tracking');
    console.log('   - Wizard progress persistence (step + form data)');
    console.log('   - Resume wizard from last step');
    console.log('   - JSON structure: { step: number, data: object }');
    console.log('\n💡 Usage:');
    console.log('   - Set wizard_completed = true after wizard completion');
    console.log('   - Store progress in wizard_progress JSONB column\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
