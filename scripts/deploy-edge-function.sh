#!/bin/bash
# =============================================
# Edge Function Deployment Script
# =============================================
# Epic: NPD-6 (Database Schema & Infrastructure)
# Story: NPD-6.6 - Setup Edge Functions CI/CD Pipeline
# Purpose: Deploy NPD Edge Functions to Supabase
# Usage: ./scripts/deploy-edge-function.sh <function-name> [project-id]
# Example: ./scripts/deploy-edge-function.sh npd-event-processor gvnkzwokxtztyxsfshct
# =============================================

set -e  # Exit on error

# =============================================
# CONFIGURATION
# =============================================

FUNCTION_NAME="${1:-npd-event-processor}"
PROJECT_ID="${2:-${SUPABASE_PROJECT_ID}}"
FUNCTIONS_DIR="apps/frontend/supabase/functions"
FUNCTION_PATH="${FUNCTIONS_DIR}/${FUNCTION_NAME}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================
# HELPER FUNCTIONS
# =============================================

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# =============================================
# VALIDATION
# =============================================

log_info "Starting Edge Function deployment..."
echo ""

# Check if function name provided
if [ -z "$FUNCTION_NAME" ]; then
  log_error "Function name is required"
  echo "Usage: $0 <function-name> [project-id]"
  echo "Example: $0 npd-event-processor"
  exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null && ! command -v npx &> /dev/null; then
  log_error "Supabase CLI not found. Install via: npm install -g supabase"
  echo "Or ensure npx is available to use: npx supabase"
  exit 1
fi

# Determine CLI command (supabase or npx supabase)
if command -v supabase &> /dev/null; then
  SUPABASE_CMD="supabase"
else
  SUPABASE_CMD="npx supabase"
fi

# Verify CLI version
CLI_VERSION=$($SUPABASE_CMD --version 2>&1 | head -n1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
log_info "Supabase CLI version: ${CLI_VERSION}"

# Check if project ID is set
if [ -z "$PROJECT_ID" ]; then
  log_error "SUPABASE_PROJECT_ID environment variable not set"
  echo "Set via: export SUPABASE_PROJECT_ID=your-project-id"
  echo "Or pass as argument: $0 $FUNCTION_NAME your-project-id"
  exit 1
fi

log_success "Project ID: ${PROJECT_ID}"

# Check if function directory exists
if [ ! -d "$FUNCTION_PATH" ]; then
  log_warning "Function directory not found: ${FUNCTION_PATH}"
  log_warning "This is expected for Story NPD-6.6 (infrastructure setup)"
  log_warning "Edge Function code will be created in Epic NPD-1 Story 4"
  echo ""
  log_info "Creating placeholder Edge Function for deployment test..."

  # Create placeholder function directory and index.ts
  mkdir -p "$FUNCTION_PATH"
  cat > "${FUNCTION_PATH}/index.ts" << 'EOF'
// NPD Event Processor Edge Function
// Epic: NPD-1 (Core NPD Project Management)
// Story: NPD-1.4 - Event Sourcing Implementation
// Purpose: Process events from npd_events table (Outbox pattern)
//
// NOTE: This is a placeholder created by Story NPD-6.6 (infrastructure setup)
// Real implementation will be added in Epic NPD-1 Story 4

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { method } = req

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response('ok', { headers, status: 200 })
  }

  // Placeholder response
  const response = {
    message: 'NPD Event Processor - Placeholder',
    status: 'infrastructure_ready',
    version: '0.1.0',
    note: 'Real implementation in Epic NPD-1 Story 4',
    timestamp: new Date().toISOString(),
  }

  return new Response(
    JSON.stringify(response),
    { headers, status: 200 }
  )
})
EOF

  log_success "Placeholder function created at: ${FUNCTION_PATH}/index.ts"
  echo ""
fi

# =============================================
# AUTHENTICATION
# =============================================

log_info "Authenticating with Supabase..."

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  log_error "SUPABASE_ACCESS_TOKEN environment variable not set"
  echo "Generate token at: https://app.supabase.com/account/tokens"
  echo "Set via: export SUPABASE_ACCESS_TOKEN=your-access-token"
  exit 1
fi

# Link to project (authentication test)
if ! $SUPABASE_CMD link --project-ref "$PROJECT_ID" 2>&1; then
  log_error "Failed to authenticate with Supabase"
  echo "Verify SUPABASE_ACCESS_TOKEN is valid"
  exit 1
fi

log_success "Authentication successful"

# =============================================
# DEPLOYMENT
# =============================================

log_info "Deploying Edge Function: ${FUNCTION_NAME}"
echo ""

# Deploy the function
# --no-verify-jwt: Disable JWT verification for development (enable in production)
if $SUPABASE_CMD functions deploy "$FUNCTION_NAME" --project-ref "$PROJECT_ID" --no-verify-jwt; then
  log_success "Edge Function deployed successfully!"
  echo ""

  # Get function URL
  FUNCTION_URL="https://${PROJECT_ID}.supabase.co/functions/v1/${FUNCTION_NAME}"

  log_info "Function Details:"
  echo "  Name: ${FUNCTION_NAME}"
  echo "  URL:  ${FUNCTION_URL}"
  echo "  Project: ${PROJECT_ID}"
  echo ""

  log_info "Testing function availability..."

  # Test function with curl (expect 200 or 401)
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL" || echo "000")

  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
    log_success "Function is responding (HTTP ${HTTP_STATUS})"
  else
    log_warning "Function responded with HTTP ${HTTP_STATUS}"
    log_warning "Check Supabase Dashboard logs for details"
  fi

  echo ""
  log_success "Deployment complete!"
  echo ""
  log_info "Next steps:"
  echo "  1. View logs: https://app.supabase.com/project/${PROJECT_ID}/functions/${FUNCTION_NAME}/logs"
  echo "  2. Test function: curl ${FUNCTION_URL}"
  echo "  3. Monitor metrics: https://app.supabase.com/project/${PROJECT_ID}/functions/${FUNCTION_NAME}/metrics"

else
  log_error "Deployment failed!"
  echo ""
  log_info "Troubleshooting:"
  echo "  1. Check function code syntax (Deno TypeScript)"
  echo "  2. Verify SUPABASE_ACCESS_TOKEN is valid"
  echo "  3. Check Supabase Dashboard for error details"
  echo "  4. Review function logs: $SUPABASE_CMD functions logs ${FUNCTION_NAME}"
  exit 1
fi

# =============================================
# CLEANUP
# =============================================

# Unlink project (cleanup)
$SUPABASE_CMD unlink || true

exit 0
