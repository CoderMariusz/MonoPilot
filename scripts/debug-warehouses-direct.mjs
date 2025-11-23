#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Testing warehouses table (same code as debug-tables.mjs)...\n');

// Exact same approach as debug-tables.mjs
const { data: warehouses, error: warehousesError } = await supabase
  .from('warehouses')
  .select('*');

console.log('Warehouses:');
console.log('  Data:', warehouses);
console.log('  Error:', warehousesError);
console.log('');

// Try machines
const { data: machines, error: machinesError } = await supabase
  .from('machines')
  .select('*');

console.log('Machines:');
console.log('  Data:', machines);
console.log('  Error:', machinesError);
console.log('');

// Try production_lines
const { data: lines, error: linesError } = await supabase
  .from('production_lines')
  .select('*');

console.log('Production Lines:');
console.log('  Data:', lines);
console.log('  Error:', linesError);
console.log('');

// Try locations
const { data: locations, error: locationsError } = await supabase
  .from('locations')
  .select('*');

console.log('Locations:');
console.log('  Data:', locations);
console.log('  Error:', locationsError);
