#!/bin/bash

# API Structure Verification Script
# Verifies that API endpoint files exist for newly migrated tables
# Date: 2026-01-23

echo "=================================================="
echo "API Structure Verification"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
FOUND=0
MISSING=0

# Base path
API_BASE="apps/frontend/app/api"

# Function to check endpoint
check_endpoint() {
    local path=$1
    local description=$2

    echo -n "Checking: $description... "

    if [ -f "$path" ]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        FOUND=$((FOUND + 1))
    else
        echo -e "${RED}✗ MISSING${NC} ($path)"
        MISSING=$((MISSING + 1))
    fi
}

echo "=================================================="
echo "SHIPPING MODULE API ROUTES"
echo "=================================================="
echo ""

echo "Customers:"
check_endpoint "$API_BASE/shipping/customers/route.ts" "Customers list/create"
check_endpoint "$API_BASE/shipping/customers/[id]/route.ts" "Customer get/update/delete"
check_endpoint "$API_BASE/shipping/customers/[id]/contacts/route.ts" "Customer contacts"
check_endpoint "$API_BASE/shipping/customers/[id]/addresses/route.ts" "Customer addresses"

echo ""
echo "Sales Orders:"
check_endpoint "$API_BASE/shipping/sales-orders/[id]/status/route.ts" "SO status update"
check_endpoint "$API_BASE/shipping/sales-orders/[id]/lines/route.ts" "SO lines list/create"
check_endpoint "$API_BASE/shipping/sales-orders/[id]/allocations/route.ts" "SO allocations"
check_endpoint "$API_BASE/shipping/sales-orders/[id]/allocate/route.ts" "SO allocate action"

echo ""
echo "Pick Lists:"
check_endpoint "$API_BASE/shipping/pick-lists/route.ts" "Pick lists list/create"
check_endpoint "$API_BASE/shipping/pick-lists/[id]/route.ts" "Pick list get/update"
check_endpoint "$API_BASE/shipping/pick-lists/[id]/lines/route.ts" "Pick list lines"
check_endpoint "$API_BASE/shipping/pick-lists/[id]/assign/route.ts" "Pick list assign"

echo ""
echo "RMA:"
check_endpoint "$API_BASE/shipping/rma/route.ts" "RMA requests list/create"
check_endpoint "$API_BASE/shipping/rma/[id]/route.ts" "RMA get/update"
check_endpoint "$API_BASE/shipping/rma/[id]/lines/route.ts" "RMA lines"

echo ""

echo "=================================================="
echo "QUALITY MODULE API ROUTES"
echo "=================================================="
echo ""

echo "Settings & Status:"
check_endpoint "$API_BASE/quality/settings/route.ts" "Quality settings"
check_endpoint "$API_BASE/quality/status/types/route.ts" "Status types"
check_endpoint "$API_BASE/quality/status/transitions/route.ts" "Status transitions"
check_endpoint "$API_BASE/quality/status/change/route.ts" "Status change"

echo ""
echo "Specifications:"
check_endpoint "$API_BASE/quality/specifications/route.ts" "Specifications list/create"
check_endpoint "$API_BASE/quality/specifications/[id]/route.ts" "Spec get/update"
check_endpoint "$API_BASE/quality/specifications/[specId]/parameters/route.ts" "Spec parameters"
check_endpoint "$API_BASE/quality/specifications/[id]/approve/route.ts" "Spec approve"

echo ""
echo "Inspections:"
check_endpoint "$API_BASE/quality/inspections/route.ts" "Inspections list/create"
check_endpoint "$API_BASE/quality/inspections/[id]/route.ts" "Inspection get/update"
check_endpoint "$API_BASE/quality/inspections/[id]/complete/route.ts" "Inspection complete"
check_endpoint "$API_BASE/quality/inspections/pending/route.ts" "Pending inspections"
check_endpoint "$API_BASE/quality/inspections/incoming/route.ts" "Incoming inspections"
check_endpoint "$API_BASE/quality/inspections/in-process/route.ts" "In-process inspections"

echo ""
echo "Test Results & Sampling:"
check_endpoint "$API_BASE/quality/test-results/route.ts" "Test results list/create"
check_endpoint "$API_BASE/quality/test-results/[id]/route.ts" "Test result get/update"
check_endpoint "$API_BASE/quality/sampling-plans/route.ts" "Sampling plans list/create"
check_endpoint "$API_BASE/quality/sampling-plans/[id]/route.ts" "Sampling plan get/update"
check_endpoint "$API_BASE/quality/sampling-records/route.ts" "Sampling records"

echo ""
echo "Quality Holds:"
check_endpoint "$API_BASE/quality/holds/route.ts" "Quality holds list/create"
check_endpoint "$API_BASE/quality/holds/[id]/route.ts" "Quality hold get/update"
check_endpoint "$API_BASE/quality/holds/[id]/release/route.ts" "Quality hold release"
check_endpoint "$API_BASE/quality/holds/active/route.ts" "Active holds"

echo ""
echo "NCR Reports:"
check_endpoint "$API_BASE/quality/ncrs/route.ts" "NCR reports list/create"
check_endpoint "$API_BASE/quality/ncrs/[id]/route.ts" "NCR get/update"
check_endpoint "$API_BASE/quality/ncrs/[id]/submit/route.ts" "NCR submit"
check_endpoint "$API_BASE/quality/ncrs/[id]/close/route.ts" "NCR close"

echo ""

# Summary
echo "=================================================="
echo "VERIFICATION SUMMARY"
echo "=================================================="
echo ""
echo -e "Total Endpoints Checked: $((FOUND + MISSING))"
echo -e "${GREEN}Found: $FOUND${NC}"
echo -e "${RED}Missing: $MISSING${NC}"
echo ""

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✓ All API routes are implemented!${NC}"
    echo ""
    echo "Ready for testing:"
    echo "1. Start dev server: npm run dev"
    echo "2. Run integration tests: ./test-api-endpoints.sh"
    exit 0
else
    echo -e "${YELLOW}⚠ Some API routes are missing${NC}"
    echo ""
    echo "Missing routes need to be implemented for:"
    echo "- Complete API coverage"
    echo "- Full CRUD operations"
    exit 1
fi
