const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgroxddbtaevdegnidaz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

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

async function createTestUser(userData) {
  try {
    console.log(`🔍 Creating user: ${userData.email}...`);
    
    // First, try to sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`⚠️  User ${userData.email} already exists in auth`);
        return { success: true, alreadyExists: true };
      }
      console.error(`❌ Auth error for ${userData.email}:`, authError.message);
      return { success: false, error: authError };
    }

    console.log(`✅ Auth user created: ${authData.user?.id}`);

    // Then create the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
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
    console.error(`❌ Error creating ${userData.email}:`, error.message);
    return { success: false, error };
  }
}

async function createAllTestUsers() {
  console.log('🌱 Creating all test users...');
  
  const results = [];
  
  for (const [key, userData] of Object.entries(testUsers)) {
    const result = await createTestUser(userData);
    results.push({ key, userData, result });
    
    // Wait a bit between users to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Summary:');
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  const alreadyExists = results.filter(r => r.result.success && r.result.alreadyExists);
  
  console.log(`✅ Successfully created: ${successful.length - alreadyExists.length}`);
  console.log(`⚠️  Already existed: ${alreadyExists.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed users:');
    failed.forEach(r => {
      console.log(`   - ${r.userData.email}: ${r.result.error?.message || 'Unknown error'}`);
    });
  }
  
  if (alreadyExists.length > 0) {
    console.log('\n⚠️  Already existing users:');
    alreadyExists.forEach(r => {
      console.log(`   - ${r.userData.email} (${r.userData.role})`);
    });
  }
}

createAllTestUsers().catch(console.error);
