#!/bin/bash
# Selective Test Execution
# Runs only tests affected by changed files

set -e

echo "🔍 Detecting changed files..."

# Get changed files in current branch
CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1)

if [ -z "$CHANGED_FILES" ]; then
  echo "⚠️  No changed files detected. Running full test suite..."
  pnpm test:e2e
  exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES" | sed 's/^/  - /'
echo ""

# Check if changes affect testable code
if echo "$CHANGED_FILES" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  echo "✅ Code changes detected. Running tests..."

  # Check if test files themselves changed
  if echo "$CHANGED_FILES" | grep -qE 'tests/.*\.spec\.(ts|js)$'; then
    echo "🧪 Test files changed. Running full suite..."
    pnpm test:e2e
  else
    echo "📦 Source code changed. Running full suite (selective testing not yet implemented)..."
    pnpm test:e2e
  fi
else
  echo "ℹ️  No code changes detected (docs, config, etc.)"
  echo "Skipping tests (or run full suite if required by policy)"
  # Uncomment to run full suite anyway:
  # pnpm test:e2e
fi
