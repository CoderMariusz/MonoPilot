// API Configuration for database-first operation
export const API_CONFIG = {
  // Supabase configuration - MUST be set via environment variables
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,

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

// Validate required environment variables at module load
if (!API_CONFIG.supabaseUrl || !API_CONFIG.supabaseAnonKey) {
  throw new Error(
    'Missing required Supabase environment variables. ' +
    'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
  );
}
