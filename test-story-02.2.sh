#!/bin/bash
# Test runner for Story 02.2 - Product Versioning + History
# Runs all backend tests and displays summary

echo "========================================="
echo "Story 02.2 - Product Versioning + History"
echo "GREEN Phase - Backend Implementation Tests"
echo "========================================="
echo ""

# Set to fail on error
set -e

# Test 1: Validation Schemas
echo "[1/4] Testing validation schemas..."
pnpm test -- apps/frontend/lib/validation/__tests__/product-history.test.ts --run --reporter=dot
echo "✓ Validation schemas passed"
echo ""

# Test 2: Service Layer
echo "[2/4] Testing service layer..."
pnpm test -- apps/frontend/lib/services/__tests__/product-history-service.test.ts --run --reporter=dot
echo "✓ Service layer passed"
echo ""

# Test 3: Versions API
echo "[3/4] Testing versions API endpoint..."
pnpm test -- "apps/frontend/app/api/v1/technical/products/[id]/versions/__tests__/route.test.ts" --run --reporter=dot
echo "✓ Versions API passed"
echo ""

# Test 4: History API
echo "[4/4] Testing history API endpoint..."
pnpm test -- "apps/frontend/app/api/v1/technical/products/[id]/history/__tests__/route.test.ts" --run --reporter=dot
echo "✓ History API passed"
echo ""

echo "========================================="
echo "✓ All backend tests PASSED!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Apply database migration: npx supabase db push"
echo "2. Run SQL tests: psql -f supabase/tests/product_version_history_rls.test.sql"
echo "3. Run trigger tests: psql -f supabase/tests/product_version_trigger.test.sql"
echo ""
