const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

const supabase = createClient(supabaseUrl, supabaseKey);

const testUsers = {
  admin: {
    email: 'przyslony@gmail.com',
    password: 'Test1234',
    name: 'Mariusz Krawczyk',
    role: 'Admin'
  },
  planner: {
    email: 'planner@forza.com',
    password: 'password123',
    name: 'Planner User',
    role: 'Planner'
  },
  operator: {
    email: 'operator@forza.com',
    password: 'password123',
    name: 'Operator User',
    role: 'Operator'
  },
  technical: {
    email: 'technical@forza.com',
    password: 'password123',
    name: 'Technical User',
    role: 'Technical'
  },
  purchasing: {
    email: 'purchasing@forza.com',
    password: 'password123',
    name: 'Purchasing User',
    role: 'Purchasing'
  },
  warehouse: {
    email: 'warehouse@forza.com',
    password: 'password123',
    name: 'Warehouse User',
    role: 'Warehouse'
  },
  qc: {
    email: 'qc@forza.com',
    password: 'password123',
    name: 'QC User',
    role: 'QC'
  }
};

async function addUserProfile(userData) {
  try {
    console.log(`🔍 Adding profile for: ${userData.email}...`);
    
    // First, get the user from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error(`❌ Auth error:`, authError.message);
      return { success: false, error: authError };
    }
    
    const authUser = authUsers.users.find(u => u.email === userData.email);
    if (!authUser) {
      console.error(`❌ User ${userData.email} not found in auth`);
      return { success: false, error: 'User not found in auth' };
    }
    
    console.log(`✅ Found auth user: ${authUser.id}`);
    
    // Then create the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: 'Active'
      })
      .select();
    
    if (profileError) {
      console.error(`❌ Profile error for ${userData.email}:`, profileError.message);
      return { success: false, error: profileError };
    }
    
    console.log(`✅ User profile created: ${profileData[0].name} (${profileData[0].role})`);
    return { success: true, alreadyExists: false };
    
  } catch (error) {
    console.error(`❌ Error creating profile for ${userData.email}:`, error.message);
    return { success: false, error };
  }
}

async function addAllUserProfiles() {
  console.log('🌱 Adding all user profiles...');
  
  const results = [];
  
  for (const [key, userData] of Object.entries(testUsers)) {
    const result = await addUserProfile(userData);
    results.push({ key, userData, result });
    
    // Wait a bit between users to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Successfully added: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed users:');
    failed.forEach(r => {
      console.log(`   - ${r.userData.email}: ${r.result.error?.message || 'Unknown error'}`);
    });
  }
}

addAllUserProfiles().catch(console.error);
