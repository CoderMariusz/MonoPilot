// API Configuration for dual-mode operation (mock/real data)
export const API_CONFIG = {
  // Use mock data when NEXT_PUBLIC_USE_MOCK_DATA=true
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  
  // Supabase configuration
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgroxddbtaevdegnidaz.supabase.co',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU',
  
  // API endpoints (for future use)
  endpoints: {
    workOrders: '/api/work-orders',
    purchaseOrders: '/api/purchase-orders',
    transferOrders: '/api/transfer-orders',
    products: '/api/products',
    grns: '/api/grns',
    licensePlates: '/api/license-plates',
    stockMoves: '/api/stock-moves',
    users: '/api/users',
    sessions: '/api/sessions',
    settings: '/api/settings',
    locations: '/api/locations',
    machines: '/api/machines',
    allergens: '/api/allergens',
  }
};

// Helper function to determine data source
export const shouldUseMockData = () => {
  return API_CONFIG.useMockData || !API_CONFIG.supabaseUrl || API_CONFIG.supabaseUrl === 'your-supabase-url';
};
