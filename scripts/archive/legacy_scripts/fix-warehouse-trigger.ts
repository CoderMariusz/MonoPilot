#!/usr/bin/env tsx
/**
 * Hotfix script: Fix warehouse_settings trigger
 * Bug: organizations table doesn't have created_by field
 * Story: 05.8 Phase 3 (QA Critical Bug)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env from apps/frontend
dotenv.config({ path: path.resolve(__dirname, '../apps/frontend/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Missing SUPABASE environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function main() {
  console.log('Fixing warehouse_settings trigger...')

  const sql = `
    CREATE OR REPLACE FUNCTION init_warehouse_settings_for_org()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO warehouse_settings (org_id)
      VALUES (NEW.id)
      ON CONFLICT (org_id) DO NOTHING;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `

  const { error } = await supabase.rpc('exec_sql', { query: sql })

  if (error) {
    console.error('Error executing SQL:', error.message)
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:')
    console.log(sql)
    process.exit(1)
  }

  console.log('✓ Trigger fixed successfully!')
}

main()
