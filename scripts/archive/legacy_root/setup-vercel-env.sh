#!/bin/bash

cd apps/frontend

# Read values from .env.local
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" ../../.env.local | cut -d= -f2)
SUPABASE_ANON=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" ../../.env.local | cut -d= -f2)
SERVICE_ROLE=$(grep "SUPABASE_SERVICE_ROLE_KEY=" ../../.env.local | cut -d= -f2)
REDIS_URL=$(grep "UPSTASH_REDIS_REST_URL=" ../../.env.local | cut -d= -f2)
REDIS_TOKEN=$(grep "UPSTASH_REDIS_REST_TOKEN=" ../../.env.local | cut -d= -f2)
JWT_SECRET="your-strong-jwt-secret-key-minimum-32-characters-long"

echo "Adding environment variables to Vercel..."

# Add to production
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "$SUPABASE_ANON" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "$SERVICE_ROLE" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "$REDIS_URL" | vercel env add UPSTASH_REDIS_REST_URL production
echo "$REDIS_TOKEN" | vercel env add UPSTASH_REDIS_REST_TOKEN production
echo "$JWT_SECRET" | vercel env add JWT_SECRET production

echo "✓ Environment variables added to production!"
echo "Now deploying..."

cd ../..
vercel --prod --yes
