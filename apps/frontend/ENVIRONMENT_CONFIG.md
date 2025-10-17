# Environment Configuration for Deployment

## Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://pgroxddbtaevdegnidaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

## Vercel Configuration (auto-set by Vercel)
```bash
VERCEL_URL=your-vercel-url
VERCEL_ENV=production
```

## Instructions for Vercel Deployment

1. **Set Environment Variables in Vercel Dashboard:**
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add all the variables above

2. **Service Role Key:**
   - You need to get the service role key from Supabase dashboard
   - Go to Settings > API > service_role key
   - Copy and paste it as SUPABASE_SERVICE_ROLE_KEY

3. **Deploy:**
   - The application is ready for deployment
   - All TypeScript issues have been resolved
   - Build configuration is optimized
