#!/bin/bash
# Local CI Pipeline Mirror
# Mirrors the CI pipeline execution locally for debugging

set -e  # Exit on error

echo "🔍 Running CI pipeline locally..."
echo ""

# Stage 1: Lint
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Stage 1: Code Quality Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd app
pnpm lint || { echo "❌ Lint failed"; exit 1; }
pnpm type-check || { echo "❌ Type check failed"; exit 1; }
cd ..
echo "✅ Lint passed"
echo ""

# Stage 2: Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Stage 2: E2E Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pnpm test:e2e || { echo "❌ Tests failed"; exit 1; }
echo "✅ Tests passed"
echo ""

# Stage 3: Burn-in (reduced iterations for local)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Stage 3: Burn-In Loop (3 iterations)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for i in {1..3}; do
  echo "🔥 Burn-in iteration $i/3"
  pnpm test:e2e || { echo "❌ Burn-in failed on iteration $i"; exit 1; }
done
echo "✅ Burn-in passed"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Local CI pipeline passed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
