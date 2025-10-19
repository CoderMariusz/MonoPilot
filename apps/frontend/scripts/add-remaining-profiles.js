const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

// These are the actual user IDs from Supabase Auth
const userProfiles = [
  {
    id: 'c015071b-e8c4-48cd-8f43-10ff671be4e0', // planner@forza.com
    name: 'Planner User',
    email: 'planner@forza.com',
    role: 'Planner',
    status: 'Active'
  },
  {
    id: '3b4dcc67-3754-4caa-b344-71a12af86ad9', // operator@forza.com
    name: 'Operator User',
    email: 'operator@forza.com',
    role: 'Operator',
    status: 'Active'
  },
  {
    id: '40f00f21-7f3b-4f01-91da-1b1f7357ef6c', // technical@forza.com
    name: 'Technical User',
    email: 'technical@forza.com',
    role: 'Technical',
    status: 'Active'
  },
  {
    id: 'ec08c6a3-2eee-48eb-ab3f-ffa852b5fcee', // purchasing@forza.com
    name: 'Purchasing User',
    email: 'purchasing@forza.com',
    role: 'Purchasing',
    status: 'Active'
  },
  {
    id: '83607816-b1c0-436b-9499-e38bbb1f67cb', // warehouse@forza.com
    name: 'Warehouse User',
    email: 'warehouse@forza.com',
    role: 'Warehouse',
    status: 'Active'
  },
  {
    id: 'c97408d2-72c3-422e-b9c9-0fc66dfb69b7', // qc@forza.com
    name: 'QC User',
    email: 'qc@forza.com',
    role: 'QC',
    status: 'Active'
  }
];

async function addRemainingProfiles() {
  try {
    console.log('🔍 Signing in as admin...');
    
    // First, sign in as admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'przyslony@gmail.com',
      password: 'Test1234',
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }
    
    console.log(`✅ Signed in as admin: ${authData.user.id}`);
    
    // Then add all user profiles
    console.log('🌱 Adding remaining user profiles...');
    
    for (const userProfile of userProfiles) {
      console.log(`🔍 Adding profile for: ${userProfile.email}...`);
      
      const { data, error } = await supabase
        .from('users')
        .upsert(userProfile)
        .select();
      
      if (error) {
        console.error(`❌ Error adding ${userProfile.email}:`, error.message);
        continue;
      }
      
      console.log(`✅ Profile added: ${data[0].name} (${data[0].role})`);
    }
    
    console.log('🎉 All profiles added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addRemainingProfiles();
