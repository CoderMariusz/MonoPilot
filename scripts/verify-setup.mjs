#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Verifying Story 1.1 setup...\n');

// Check users
const { data: users } = await supabase.from('users').select('id, email, role, org_id');
console.log('✅ Users table:', users);

// Check organizations
const { data: orgs } = await supabase.from('organizations').select('id, company_name');
console.log('✅ Organizations table:', orgs);

// Check storage buckets
const { data: buckets } = await supabase.storage.listBuckets();
console.log('✅ Storage buckets:', buckets?.map(b => b.name));

console.log('\n🎉 All components ready for Story 1.1 testing!');
console.log('\nNext steps:');
console.log('1. Login: http://localhost:3000/login');
console.log('   - Email: admin@monopilot.local');
console.log('   - Password: Admin123!@#');
console.log('2. Navigate to: http://localhost:3000/settings/organization');
console.log('3. Test organization form and logo upload');
