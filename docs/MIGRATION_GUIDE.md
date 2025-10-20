# Migration Guide: From Mock Data to Supabase

This guide outlines the steps to migrate from the current mock data system to Supabase backend.

## Current Status

✅ **Completed:**
- Removed Replit connections
- Upgraded Next.js to 15.5.4
- Added performance optimizations
- Created Supabase client utilities
- Created API abstraction layer
- Organized components by feature domain
- Created database schema
- Fixed metadata export errors

## Migration Steps

### Phase 1: Supabase Setup (When Ready)

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com and create a new project
   # Note down your project URL and anon key
   ```

2. **Configure Environment Variables**
   ```bash
   # Update .env.local
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```

3. **Run Database Schema**
   ```sql
   -- Copy and paste the contents of apps/frontend/lib/supabase/schema.sql
   -- into your Supabase SQL editor and execute
   ```

### Phase 2: Install Supabase Dependencies

```bash
cd apps/frontend
pnpm add @supabase/supabase-js @supabase/ssr
```

### Phase 3: Update API Layer

The API abstraction layer is already prepared for dual-mode operation. When ready to migrate:

1. **Update API Classes**
   - Uncomment the Supabase queries in `apps/frontend/lib/api/workOrders.ts`
   - Add similar implementations for other API classes
   - Remove the fallback to mock data

2. **Update State Management**
   - Replace `clientState.ts` calls with API layer calls
   - Update components to use the new API layer

### Phase 4: Authentication Setup

1. **Configure Supabase Auth**
   - Set up authentication providers in Supabase dashboard
   - Configure email templates and redirect URLs

2. **Implement Auth Components**
   - Create login/signup pages
   - Add authentication guards to protected routes
   - Implement role-based access control

### Phase 5: Data Migration

1. **Export Mock Data**
   ```typescript
   // Create a script to export current mock data
   // This will help populate the Supabase database
   ```

2. **Import to Supabase**
   - Use Supabase dashboard or API to import data
   - Verify data integrity and relationships

## File Structure After Migration

```
apps/frontend/
├── lib/
│   ├── api/              # ✅ API abstraction layer
│   ├── supabase/         # ✅ Supabase client utilities
│   └── clientState.ts    # 🔄 Will be replaced with API calls
├── components/
│   ├── planning/         # ✅ Organized by feature
│   ├── production/        # ✅ Organized by feature
│   ├── warehouse/         # ✅ Organized by feature
│   └── ...
└── app/
    ├── (auth)/           # 🔄 To be created for authentication
    ├── planning/         # ✅ Working with mock data
    ├── production/       # ✅ Working with mock data
    └── warehouse/        # ✅ Working with mock data
```

## Benefits of Current Setup

1. **Easy Migration**: API abstraction layer allows switching between mock and real data
2. **No Breaking Changes**: Current functionality preserved during transition
3. **Type Safety**: Database schema matches TypeScript types
4. **Performance**: Optimized bundle size and lazy loading
5. **Maintainability**: Components organized by feature domain

## Testing the Migration

1. **Test with Mock Data**
   ```bash
   pnpm dev
   # Verify all functionality works with mock data
   ```

2. **Test with Supabase**
   ```bash
   # Set NEXT_PUBLIC_USE_MOCK_DATA=false
   pnpm dev
   # Verify all functionality works with real data
   ```

## Rollback Plan

If issues arise during migration:

1. Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`
2. Restart the development server
3. The app will automatically fall back to mock data

## Next Steps

1. **Immediate**: Continue development with mock data
2. **When Ready**: Follow Phase 1-5 migration steps
3. **Future**: Add real-time subscriptions, advanced queries, and optimizations

## Support

- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Project Issues: Create GitHub issues for any problems
