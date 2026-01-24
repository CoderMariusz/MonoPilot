#!/bin/bash
# detect-test-type.sh
# Automatically detects E2E test type from component analysis
# Usage: ./scripts/detect-test-type.sh apps/frontend/app/(authenticated)/module/feature/page.tsx

set -e

PAGE_FILE="$1"

if [ -z "$PAGE_FILE" ]; then
    echo "Usage: ./scripts/detect-test-type.sh <page-file>"
    echo "Example: ./scripts/detect-test-type.sh apps/frontend/app/(authenticated)/production/work-orders/page.tsx"
    exit 1
fi

if [ ! -f "$PAGE_FILE" ]; then
    echo "Error: File not found: $PAGE_FILE"
    exit 1
fi

# Read file content
CONTENT=$(cat "$PAGE_FILE")

# Initialize scores
CRUD_SCORE=0
FORM_SCORE=0
FLOW_SCORE=0
AUTH_SCORE=0

# Check for indicators
grep -qi "DataTable" "$PAGE_FILE" && CRUD_SCORE=$((CRUD_SCORE + 30))
grep -qi "Modal.*Edit\|Edit.*Modal" "$PAGE_FILE" && CRUD_SCORE=$((CRUD_SCORE + 20))
grep -qi "create.*button\|button.*create" "$PAGE_FILE" && CRUD_SCORE=$((CRUD_SCORE + 15))
grep -qi "delete\|remove" "$PAGE_FILE" && CRUD_SCORE=$((CRUD_SCORE + 10))

grep -qi "useForm\|react-hook-form" "$PAGE_FILE" && FORM_SCORE=$((FORM_SCORE + 25))
grep -qi "Zod\|zod" "$PAGE_FILE" && FORM_SCORE=$((FORM_SCORE + 20))
grep -qi "form.*submit\|onSubmit" "$PAGE_FILE" && FORM_SCORE=$((FORM_SCORE + 15))

grep -qi "Wizard\|Stepper\|Steps" "$PAGE_FILE" && FLOW_SCORE=$((FLOW_SCORE + 40))
grep -qi "step.*1\|step.*2\|step.*3" "$PAGE_FILE" && FLOW_SCORE=$((FLOW_SCORE + 30))
grep -qi "next.*button\|button.*next" "$PAGE_FILE" && FLOW_SCORE=$((FLOW_SCORE + 20))
grep -qi "back.*button\|button.*back\|previous" "$PAGE_FILE" && FLOW_SCORE=$((FLOW_SCORE + 15))

grep -qi "checkPermission\|hasPermission" "$PAGE_FILE" && AUTH_SCORE=$((AUTH_SCORE + 35))
grep -qi "role.*admin\|role.*manager" "$PAGE_FILE" && AUTH_SCORE=$((AUTH_SCORE + 25))
grep -qi "storageState\|\.auth/" "$PAGE_FILE" && AUTH_SCORE=$((AUTH_SCORE + 20))

# Determine type
MAX_SCORE=0
TEST_TYPE="form"  # Default

if [ $CRUD_SCORE -gt $MAX_SCORE ]; then
    MAX_SCORE=$CRUD_SCORE
    TEST_TYPE="crud"
fi

if [ $FORM_SCORE -gt $MAX_SCORE ]; then
    MAX_SCORE=$FORM_SCORE
    TEST_TYPE="form"
fi

if [ $FLOW_SCORE -gt $MAX_SCORE ]; then
    MAX_SCORE=$FLOW_SCORE
    TEST_TYPE="flow"
fi

if [ $AUTH_SCORE -gt $MAX_SCORE ]; then
    MAX_SCORE=$AUTH_SCORE
    TEST_TYPE="auth"
fi

# Calculate confidence
TOTAL=$((CRUD_SCORE + FORM_SCORE + FLOW_SCORE + AUTH_SCORE))
if [ $TOTAL -gt 0 ]; then
    CONFIDENCE=$(awk "BEGIN {printf \"%.2f\", $MAX_SCORE / $TOTAL}")
else
    CONFIDENCE="0.00"
fi

# Output JSON
echo "{"
echo "  \"type\": \"$TEST_TYPE\","
echo "  \"confidence\": $CONFIDENCE,"
echo "  \"scores\": {"
echo "    \"crud\": $CRUD_SCORE,"
echo "    \"form\": $FORM_SCORE,"
echo "    \"flow\": $FLOW_SCORE,"
echo "    \"auth\": $AUTH_SCORE"
echo "  },"
echo "  \"indicators\": ["
grep -i "DataTable\|Modal\|useForm\|Wizard\|checkPermission" "$PAGE_FILE" 2>/dev/null | \
    head -5 | \
    sed 's/^/    "/' | sed 's/$/",/' || echo ""
echo "  ]"
echo "}"
