# Vercel Deployment Guide

## Phase 17: Vercel Deployment

### Prerequisites
- [x] TypeScript errors fixed
- [x] Build configuration optimized
- [x] Environment variables documented
- [x] Supabase integration ready

### Step 1: Vercel Project Setup

#### 1.1 Connect Repository
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### 1.2 Configure Project Settings
- **Framework**: Next.js
- **Root Directory**: `apps/frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 2: Environment Variables

#### 2.1 Required Variables
Set these in Vercel dashboard under Project Settings > Environment Variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Application Configuration
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

#### 2.2 Environment-Specific Variables
- **Production**: All variables set
- **Preview**: Use staging Supabase project
- **Development**: Use local development settings

### Step 3: Build Configuration

#### 3.1 Vercel Configuration (vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "apps/frontend/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

#### 3.2 Next.js Configuration
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};
```

### Step 4: Supabase Integration

#### 4.1 Apply Migrations
```bash
# Use Supabase MCP to apply migrations
# Run migrations 019-025 in order
# Apply seed data
```

#### 4.2 Verify Database
- [ ] All tables created
- [ ] Migrations applied
- [ ] Seed data loaded
- [ ] RLS policies active

### Step 5: Deployment Process

#### 5.1 Initial Deployment
```bash
# Deploy to Vercel
vercel --prod

# Or push to main branch (if auto-deploy enabled)
git push origin main
```

#### 5.2 Post-Deployment Verification
- [ ] Application loads correctly
- [ ] API endpoints respond
- [ ] Database connections work
- [ ] Excel exports function
- [ ] Authentication works

### Step 6: Production Testing

#### 6.1 Functional Testing
- [ ] Production module tabs work
- [ ] Scanner integration functions
- [ ] Work order operations
- [ ] Yield reporting
- [ ] Excel exports

#### 6.2 Performance Testing
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Database queries optimized
- [ ] No memory leaks

#### 6.3 Security Testing
- [ ] Authentication required
- [ ] API endpoints secured
- [ ] CORS configured correctly
- [ ] Environment variables secure

### Step 7: Monitoring Setup

#### 7.1 Vercel Analytics
- Enable Vercel Analytics
- Monitor Core Web Vitals
- Track performance metrics

#### 7.2 Error Tracking
- Set up error monitoring
- Configure alerts
- Monitor API errors

#### 7.3 Database Monitoring
- Monitor Supabase usage
- Track query performance
- Set up alerts for issues

### Step 8: Domain Configuration

#### 8.1 Custom Domain
- Add custom domain in Vercel
- Configure DNS settings
- Set up SSL certificates

#### 8.2 Environment URLs
- **Production**: `https://your-domain.com`
- **Preview**: `https://your-project.vercel.app`
- **Development**: `http://localhost:5000`

### Troubleshooting

#### Common Issues
1. **Build Failures**: Check TypeScript errors and dependencies
2. **Environment Variables**: Verify all required variables are set
3. **Database Connection**: Check Supabase credentials
4. **API Errors**: Verify endpoint configurations

#### Debug Commands
```bash
# Check build locally
npm run build

# Run type checking
npm run typecheck

# Test production build
npm run start

# Check Vercel deployment
vercel logs
```

### Success Criteria
- [ ] Application deploys successfully
- [ ] All features work in production
- [ ] Performance meets requirements
- [ ] Security is properly configured
- [ ] Monitoring is set up
- [ ] Documentation is complete

### Next Steps After Deployment
1. Set up CI/CD pipeline
2. Configure automated testing
3. Set up staging environment
4. Plan feature rollouts
5. Monitor production metrics
