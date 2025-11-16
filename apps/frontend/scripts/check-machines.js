#!/usr/bin/env node

/**
 * Script to check machines in database
 * Run with: node scripts/check-machines.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMachines() {
  console.log('🔍 Checking machines table...');

  const { data: machines, error } = await supabase
    .from('machines')
    .select('*')
    .order('name');

  if (error) {
    console.error('❌ Error querying machines:', error);
    return;
  }

  console.log(`📊 Found ${machines?.length || 0} machines`);

  if (machines && machines.length > 0) {
    console.log('\n📋 Current machines:');
    machines.forEach(machine => {
      console.log(`  • ID: ${machine.id}, Code: ${machine.code}, Name: ${machine.name}, Active: ${machine.is_active}`);
    });
  } else {
    console.log('\n⚠️ No machines found in database!');
    console.log('Please add machines through the UI or run a seed script.');
  }

  console.log('\n✅ Done!');
}

checkMachines().catch(console.error);





