#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔄 Adding test organization...\n');

const { data, error } = await supabase
  .from('organizations')
  .insert({
    company_name: 'Test Organization',
    address: '123 Test Street',
    city: 'Warsaw',
    postal_code: '00-001',
    country: 'PL',
    nip_vat: '1234567890',
    date_format: 'DD/MM/YYYY',
    number_format: '1.234,56',
    unit_system: 'metric',
    timezone: 'Europe/Warsaw',
    default_currency: 'PLN',
    default_language: 'PL'
  })
  .select();

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('✅ Test organization added!');
console.log('   ID:', data[0].id);
console.log('   Name:', data[0].company_name);
console.log('   Currency:', data[0].default_currency);
console.log('   Language:', data[0].default_language);
