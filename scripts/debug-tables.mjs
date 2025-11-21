#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Debugging tables...\n');

// Check orgs with error handling
const { data: orgs, error: orgsError } = await supabase
  .from('organizations')
  .select('*');

console.log('Organizations:');
console.log('  Data:', orgs);
console.log('  Error:', orgsError);
console.log('');

// Check users with error handling
const { data: users, error: usersError } = await supabase
  .from('users')
  .select('*');

console.log('Users:');
console.log('  Data:', users);
console.log('  Error:', usersError);
console.log('');

// Check auth.users
const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
console.log('Auth Users:');
console.log('  Data:', authUsers?.map(u => ({ id: u.id, email: u.email })));
console.log('  Error:', authError);
