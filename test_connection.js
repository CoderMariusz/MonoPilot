const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MjQ0MjEsImV4cCI6MjA1MDMwMDQyMX0.x_RLI8qYm0r8FqGt9TBUKVz-_nOw9RWqJ-VhF3lXCd8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('organizations').select('*').limit(1);
  if (error) console.error('Error:', error);
  else console.log('Success! Data:', data);
}

test();
