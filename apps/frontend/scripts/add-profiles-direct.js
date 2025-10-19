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

async function addUserProfiles() {
  try {
    console.log('🌱 Adding user profiles...');
    
    const { data, error } = await supabase
      .from('users')
      .upsert(userProfiles)
      .select();
    
    if (error) {
      console.error('❌ Error adding profiles:', error);
      return;
    }
    
    console.log(`✅ Successfully added ${data.length} user profiles:`);
    data.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addUserProfiles();
