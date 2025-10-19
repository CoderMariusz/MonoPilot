const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log(`📊 Found ${users.length} users in the table:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ID: ${user.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsersTable();
