#!/usr/bin/env node

/**
 * Script to ensure production_lines table exists and has data
 * Run with: node scripts/ensure-production-lines.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function ensureProductionLines() {
  console.log('🔍 Checking production_lines table...');

  // Check if table exists by trying to query it
  const { data: existingLines, error: queryError } = await supabase
    .from('production_lines')
    .select('*')
    .limit(1);

  if (queryError && queryError.code === 'PGRST204') {
    console.log('❌ production_lines table does not exist');
    console.log('');
    console.log('Please run the migration file:');
    console.log('apps/frontend/lib/supabase/migrations/054_production_lines.sql');
    console.log('');
    console.log('You can run it in Supabase SQL Editor:');
    console.log('1. Go to https://supabase.com/dashboard/project/pgroxddbtaevdegnidaz/sql');
    console.log('2. Copy and paste the contents of 054_production_lines.sql');
    console.log('3. Run the SQL');
    return;
  }

  if (queryError) {
    console.error('❌ Error querying production_lines:', queryError);
    return;
  }

  console.log('✅ production_lines table exists');

  // Check if we have any lines
  const { data: lines, error: countError } = await supabase
    .from('production_lines')
    .select('*');

  if (countError) {
    console.error('❌ Error counting production lines:', countError);
    return;
  }

  console.log(`📊 Found ${lines?.length || 0} production lines`);

  if (!lines || lines.length === 0) {
    console.log('➕ Adding default production lines...');

    const defaultLines = [
      { code: 'LINE-1', name: 'Production Line 1', status: 'active', is_active: true },
      { code: 'LINE-2', name: 'Production Line 2', status: 'active', is_active: true },
      { code: 'LINE-3', name: 'Production Line 3', status: 'active', is_active: true },
      { code: 'LINE-4', name: 'Production Line 4', status: 'active', is_active: true },
      { code: 'MIXER-A', name: 'Mixer A', status: 'active', is_active: true },
    ];

    const { data: insertedLines, error: insertError } = await supabase
      .from('production_lines')
      .insert(defaultLines)
      .select();

    if (insertError) {
      console.error('❌ Error inserting production lines:', insertError);
      return;
    }

    console.log(`✅ Added ${insertedLines?.length || 0} production lines`);
  }

  // Display current lines
  const { data: finalLines } = await supabase
    .from('production_lines')
    .select('*')
    .order('code');

  console.log('\n📋 Current production lines:');
  finalLines?.forEach(line => {
    console.log(`  • ${line.code} - ${line.name} [${line.status}]`);
  });

  console.log('\n✅ Done!');
}

ensureProductionLines().catch(console.error);

