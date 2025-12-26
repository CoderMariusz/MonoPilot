#!/bin/bash
SUPABASE_URL="https://pgroxddbtaevdegnidaz.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm94ZGRidGFldmRlZ25pZGF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk1ODM3MywiZXhwIjoyMDc1NTM0MzczfQ.ZdMzCB9SPMuPLvM5pq1g6s7p-8qvYdyf6WfCoDIPVDg"
USER_ID="85c0b1fd-4a73-4a35-a50b-1170ef3d93fc"

echo "1. Creating organization..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/organizations" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation,resolution=merge-duplicates" \
  -d '{"id":"a0000000-0000-0000-0000-000000000001","name":"MonoPilot Demo","slug":"monopilot-demo","timezone":"Europe/Warsaw","locale":"pl","currency":"PLN","is_active":true,"onboarding_completed_at":"2025-12-23T21:40:00Z"}'

echo ""
echo "2. Getting admin role ID..."
ADMIN_ROLE=$(curl -s "${SUPABASE_URL}/rest/v1/roles?code=eq.admin&select=id" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
ADMIN_ROLE_ID=$(echo $ADMIN_ROLE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Admin role ID: $ADMIN_ROLE_ID"

echo ""
echo "3. Creating user profile..."
curl -s -X POST "${SUPABASE_URL}/rest/v1/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation,resolution=merge-duplicates" \
  -d "{\"id\":\"${USER_ID}\",\"org_id\":\"a0000000-0000-0000-0000-000000000001\",\"email\":\"admin@monopilot.com\",\"first_name\":\"Admin\",\"last_name\":\"User\",\"role_id\":\"${ADMIN_ROLE_ID}\",\"language\":\"pl\",\"is_active\":true}"

echo ""
echo ""
echo "✅ TEST USER CREATED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email:        admin@monopilot.com"
echo "Password:     test1234"
echo "Role:         Administrator"
echo "Organization: MonoPilot Demo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "You can now login at: http://localhost:3000"
