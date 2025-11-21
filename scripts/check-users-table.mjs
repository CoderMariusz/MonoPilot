#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data, error } = await supabase.from('users').select('id').limit(1);

if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
  console.log('❌ Table "public.users" does NOT exist\n');
  console.log('⚠️  Story 1.1 depends on Story 1.2 (User Management)');
} else if (error) {
  console.log('Error:', error.message);
} else {
  console.log('✅ Table "public.users" exists!');
}
