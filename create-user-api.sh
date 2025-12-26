#!/bin/bash

SUPABASE_URL="https://pgroxddbtaevdegnidaz.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg"

echo "Creating test user via Supabase Auth Admin API..."

# Create user
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@monopilot.com",
    "password": "test1234",
    "email_confirm": true,
    "user_metadata": {
      "first_name": "Admin",
      "last_name": "User"
    }
  }')

echo "Response: $RESPONSE"

USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "User ID: $USER_ID"

if [ -n "$USER_ID" ]; then
  echo "✅ Auth user created successfully!"
  echo "Now you need to manually create user profile in SQL Editor:"
  echo ""
  echo "Run this SQL in Supabase Dashboard:"
  echo "---------------------------------------"
  cat << 'SQLEOF'
-- Create organization
INSERT INTO public.organizations (id, name, slug, timezone, locale, currency, is_active, onboarding_completed_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'MonoPilot Demo',
  'monopilot-demo',
  'Europe/Warsaw',
  'pl',
  'PLN',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create user profile
INSERT INTO public.users (id, org_id, email, first_name, last_name, role_id, language, is_active)
SELECT
  'USER_ID_HERE'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@monopilot.com',
  'Admin',
  'User',
  r.id,
  'pl',
  true
FROM public.roles r
WHERE r.code = 'admin';
SQLEOF
  echo "---------------------------------------"
  echo "Replace USER_ID_HERE with: $USER_ID"
fi
