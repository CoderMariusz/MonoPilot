#!/bin/bash
# Settings v2 Isolation Checker
# Verifies that v2 code doesn't import from v1

set -e

echo "🔍 Checking Settings v2 Isolation..."
echo ""

ERRORS=0

# ============================================
# 1. Check v2 app code doesn't import from v1 app
# ============================================

echo "1. Checking for v1 app imports in v2 app code..."

BAD_APP_IMPORTS=$(grep -r "from '@/app/(authenticated)/settings/'" "apps/frontend/app/(authenticated)/settings-v2/" 2>/dev/null | grep -v "settings-v2" || true)

if [ -z "$BAD_APP_IMPORTS" ]; then
  echo "   ✅ No v1 app imports found in settings-v2/ pages"
else
  echo "   ❌ Found v1 app imports in settings-v2/ pages:"
  echo "$BAD_APP_IMPORTS"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================
# 2. Check v2 components don't import from v1 components
# ============================================

echo "2. Checking for v1 component imports in v2 components..."

BAD_COMP_IMPORTS=$(grep -r "from '@/components/settings/'" "apps/frontend/components/settings-v2/" 2>/dev/null | grep -v "settings-v2" || true)

if [ -z "$BAD_COMP_IMPORTS" ]; then
  echo "   ✅ No v1 component imports found in settings-v2/ components"
else
  echo "   ❌ Found v1 component imports in settings-v2/ components:"
  echo "$BAD_COMP_IMPORTS"
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ============================================
# 3. Check TypeScript compilation
# ============================================

echo "3. Checking TypeScript compilation..."

cd apps/frontend
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  echo "   ❌ TypeScript compilation errors found"
  ERRORS=$((ERRORS + 1))
else
  echo "   ✅ TypeScript compiles successfully"
fi
cd ../..

echo ""

# ============================================
# 4. Check critical screens exist
# ============================================

echo "4. Checking critical screens exist..."

CRITICAL_SCREENS=(
  "locations/page.tsx"
  "allergens/page.tsx"
  "tax-codes/page.tsx"
)

for screen in "${CRITICAL_SCREENS[@]}"; do
  if [ -f "apps/frontend/app/(authenticated)/settings-v2/$screen" ]; then
    echo "   ✅ $screen exists"
  else
    echo "   ⚠️  $screen not yet created (expected if early in migration)"
  fi
done

echo ""

# ============================================
# 5. Check shared components exist
# ============================================

echo "5. Checking shared components (Foundation)..."

SHARED_COMPONENTS=(
  "DataTableWithDetails.tsx"
  "ActionsMenu.tsx"
  "StatusBadge.tsx"
  "TypeBadge.tsx"
  "EmptyState.tsx"
  "ErrorState.tsx"
  "LoadingState.tsx"
)

SHARED_DIR="apps/frontend/components/settings-v2/shared"

if [ ! -d "$SHARED_DIR" ]; then
  echo "   ⚠️  Shared directory not yet created (run Foundation handoff first)"
else
  for comp in "${SHARED_COMPONENTS[@]}"; do
    if [ -f "$SHARED_DIR/$comp" ]; then
      echo "   ✅ $comp exists"
    else
      echo "   ⚠️  $comp not yet created"
    fi
  done
fi

echo ""

# ============================================
# 6. Check archive exists
# ============================================

echo "6. Checking v1 archive exists..."

if [ -d "apps/frontend/app/(authenticated)/_archive-settings-v1-DO-NOT-TOUCH" ]; then
  echo "   ✅ V1 archive exists (old code preserved)"
else
  echo "   ⚠️  V1 archive not found (may not be created yet)"
fi

echo ""

# ============================================
# SUMMARY
# ============================================

if [ $ERRORS -eq 0 ]; then
  echo "✅ =========================================="
  echo "✅ All isolation checks passed!"
  echo "✅ =========================================="
  echo ""
  echo "V2 code is properly isolated from v1."
  exit 0
else
  echo "❌ =========================================="
  echo "❌ Found $ERRORS isolation violations!"
  echo "❌ =========================================="
  echo ""
  echo "Fix the issues above before proceeding."
  exit 1
fi
