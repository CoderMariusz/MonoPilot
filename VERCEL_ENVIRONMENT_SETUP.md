# Vercel Environment Variables Setup Guide

## Required Environment Variables

You need to set these environment variables in your Vercel project dashboard:

### 1. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://pgroxddbtaevdegnidaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgzNzMsImV4cCI6MjA3NTUzNDM3M30.ZeNq9j3n6JZ1dVgnfZ8rjxsIu9kC7tk07DKspEoqEnU
```

### 2. Application Configuration
```
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_APP_URL=https://frontend-q8fsm16du-codermariuszs-projects.vercel.app
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

### 3. Optional Service Role Key (for server-side operations)
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## How to Set Environment Variables in Vercel

### Step 1: Access Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/codermariuszs-projects/frontend)
2. Click on your "frontend" project

### Step 2: Navigate to Settings
1. Click on the "Settings" tab
2. Click on "Environment Variables" in the left sidebar

### Step 3: Add Environment Variables
For each variable above:
1. Click "Add New"
2. Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
3. Enter the variable value
4. Select "Production" environment
5. Click "Save"

### Step 4: Redeploy
After setting all environment variables:
1. Go to the "Deployments" tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Alternative: Use Vercel CLI

You can also set environment variables using the Vercel CLI:

```bash
# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_USE_MOCK_DATA production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NODE_ENV production
vercel env add NEXT_PUBLIC_APP_ENV production

# Deploy
vercel --prod
```

## Current Deployment Status

- **Latest URL**: https://frontend-q8fsm16du-codermariuszs-projects.vercel.app
- **Status**: ERROR (missing environment variables)
- **Issue**: `Error: supabaseUrl is required.`

Once you set the environment variables and redeploy, the application should work correctly!
