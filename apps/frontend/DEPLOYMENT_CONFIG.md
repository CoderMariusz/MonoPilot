# Deployment Configuration Guide

## Environment Variables Required

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Application Configuration
```bash
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### Vercel Configuration
```bash
VERCEL_URL=your-vercel-url
VERCEL_ENV=production
```

## Deployment Checklist

### Phase 16: Pre-Deployment Preparation

#### 1. TypeScript Type Checking
- [x] All TypeScript files compile without errors
- [x] No linting errors in the codebase
- [x] All imports and exports are properly typed
- [x] API routes have proper type definitions

#### 2. Dependencies Verification
- [x] All required packages are in package.json
- [x] Supabase client libraries are installed
- [x] SheetJS for Excel exports is installed
- [x] Testing libraries are properly configured

#### 3. Build Configuration
- [x] Next.js config is optimized for production
- [x] Output mode is set to 'standalone'
- [x] Bundle optimization is enabled
- [x] TypeScript compilation is configured

#### 4. Database Migrations Ready
- [x] All migration files are created (019-025)
- [x] Seed data script is comprehensive
- [x] Database schema is documented
- [x] RLS policies are configured

#### 5. API Endpoints Verification
- [x] All API routes are implemented
- [x] Error handling is in place
- [x] Authentication is configured
- [x] Excel exports are working

### Phase 17: Vercel Deployment

#### 1. Vercel Configuration
- [ ] Create vercel.json configuration
- [ ] Set up environment variables in Vercel dashboard
- [ ] Configure build settings
- [ ] Set up domain configuration

#### 2. Supabase Integration
- [ ] Apply all migrations via Supabase MCP
- [ ] Run seed data script
- [ ] Verify database connections
- [ ] Test all API endpoints

#### 3. Production Testing
- [ ] Test all UI components
- [ ] Verify scanner integration
- [ ] Test Excel exports
- [ ] Check performance metrics

#### 4. Monitoring Setup
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Configure logging
- [ ] Set up alerts

## Build Commands

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Testing
```bash
npm run test
npm run test:coverage
```

### Type Checking
```bash
npm run typecheck
```

## Vercel Deployment Steps

1. **Connect Repository**
   - Link GitHub repository to Vercel
   - Configure build settings
   - Set root directory to `apps/frontend`

2. **Environment Variables**
   - Add all required environment variables
   - Configure Supabase credentials
   - Set production URLs

3. **Build Configuration**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Domain Configuration**
   - Set up custom domain
   - Configure SSL certificates
   - Set up redirects if needed

## Post-Deployment Verification

### 1. Database Verification
- [ ] All tables are created
- [ ] Migrations are applied successfully
- [ ] Seed data is loaded
- [ ] RLS policies are active

### 2. API Testing
- [ ] All endpoints respond correctly
- [ ] Authentication works
- [ ] Excel exports function
- [ ] Error handling works

### 3. UI Testing
- [ ] All pages load correctly
- [ ] Production module works
- [ ] Scanner integration works
- [ ] Mobile responsiveness

### 4. Performance Testing
- [ ] Page load times are acceptable
- [ ] API response times are good
- [ ] Database queries are optimized
- [ ] No memory leaks

## Troubleshooting

### Common Issues
1. **Build Failures**: Check TypeScript errors and dependencies
2. **Database Connection**: Verify Supabase credentials
3. **API Errors**: Check environment variables
4. **Performance Issues**: Monitor bundle size and queries

### Debug Commands
```bash
# Check build locally
npm run build

# Run type checking
npm run typecheck

# Run tests
npm run test

# Check linting
npm run lint
```
