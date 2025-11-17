#!/usr/bin/env node

/**
 * Script to seed machines table with sample data
 * Run with: node scripts/seed-machines.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMachines() {
  console.log('🌱 Seeding machines...');

  const defaultMachines = [
    { code: 'LINE-1', name: 'Line 1', type: 'production_line', is_active: true },
    { code: 'LINE-2', name: 'Line 2', type: 'production_line', is_active: true },
    { code: 'LINE-3', name: 'Line 3', type: 'production_line', is_active: true },
    { code: 'LINE-4', name: 'Line 4', type: 'production_line', is_active: true },
    { code: 'MIXER-A', name: 'Mixer A', type: 'mixer', is_active: true },
  ];

  console.log(`➕ Adding ${defaultMachines.length} machines...`);

  const { data: insertedMachines, error: insertError } = await supabase
    .from('machines')
    .insert(defaultMachines)
    .select();

  if (insertError) {
    console.error('❌ Error inserting machines:', insertError);
    return;
  }

  console.log(`✅ Added ${insertedMachines?.length || 0} machines`);

  // Display current machines
  const { data: finalMachines } = await supabase
    .from('machines')
    .select('*')
    .order('code');

  console.log('\n📋 Current machines:');
  finalMachines?.forEach(machine => {
    console.log(`  • ${machine.code} - ${machine.name} (${machine.type}) [${machine.is_active ? 'Active' : 'Inactive'}]`);
  });

  console.log('\n✅ Done!');
}

seedMachines().catch(console.error);







