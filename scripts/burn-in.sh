#!/bin/bash
# Standalone Burn-In Loop
# Detects flaky tests by running the suite multiple times

ITERATIONS=${1:-10}  # Default to 10 iterations

echo "🔥 Starting burn-in loop ($ITERATIONS iterations)"
echo ""

FAILED=0

for i in $(seq 1 $ITERATIONS); do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔥 Burn-in iteration $i/$ITERATIONS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if pnpm test:e2e; then
    echo "✅ Iteration $i passed"
  else
    echo "❌ Iteration $i FAILED"
    FAILED=$((FAILED + 1))
  fi

  echo ""
done

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILED -eq 0 ]; then
  echo "✅ Burn-in passed! All $ITERATIONS iterations successful."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "❌ Burn-in FAILED! $FAILED/$ITERATIONS iterations failed."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "⚠️  This indicates flaky or non-deterministic tests!"
  echo "Review the failures and fix before merging."
  exit 1
fi
