#!/bin/bash

# Module test runner script
# Usage: ./scripts/test-module.sh <module-name>
# Example: ./scripts/test-module.sh auth

set -e

MODULE=$1
REPORT_DIR="test-results"
REPORTS_DIR="test-reports"

if [ -z "$MODULE" ]; then
    echo "❌ Error: Module name is required"
    echo "Usage: ./scripts/test-module.sh <module-name>"
    echo "Available modules: auth, bom, planning, production, warehouse, scanner, settings, admin, performance, error-handling, components"
    exit 1
fi

echo "🧪 Running tests for module: $MODULE"

# Create directories if they don't exist
mkdir -p "$REPORT_DIR"
mkdir -p "$REPORTS_DIR"

# Set the grep pattern based on module
case $MODULE in
    "auth")
        GREP_PATTERN="auth"
        ;;
    "bom")
        GREP_PATTERN="BOM"
        ;;
    "planning")
        GREP_PATTERN="Planning"
        ;;
    "production")
        GREP_PATTERN="Production"
        ;;
    "warehouse")
        GREP_PATTERN="Warehouse"
        ;;
    "scanner")
        GREP_PATTERN="Scanner"
        ;;
    "settings")
        GREP_PATTERN="Settings"
        ;;
    "admin")
        GREP_PATTERN="Admin"
        ;;
    "performance")
        GREP_PATTERN="performance"
        ;;
    "error-handling")
        GREP_PATTERN="error-handling"
        ;;
    "components")
        GREP_PATTERN="components"
        ;;
    *)
        echo "❌ Error: Unknown module '$MODULE'"
        echo "Available modules: auth, bom, planning, production, warehouse, scanner, settings, admin, performance, error-handling, components"
        exit 1
        ;;
esac

# Run the tests
echo "🔍 Running: pnpm test:e2e --grep \"$GREP_PATTERN\" --reporter=json"
pnpm test:e2e --grep "$GREP_PATTERN" --reporter=json > "$REPORT_DIR/${MODULE}-results.json" 2>&1
TEST_EXIT_CODE=$?

# Generate the report
echo "📊 Generating report for $MODULE module..."
tsx scripts/generate-test-report.ts "$MODULE" "$REPORT_DIR/${MODULE}-results.json" "$REPORTS_DIR/${MODULE}-module.md"

# Check if report generation was successful
if [ $? -eq 0 ]; then
    echo "✅ Report generated: $REPORTS_DIR/${MODULE}-module.md"
else
    echo "❌ Failed to generate report"
    exit 1
fi

# Exit with the test result code
exit $TEST_EXIT_CODE
