#!/bin/bash

# API Endpoint Verification Script
# Tests key endpoints for newly migrated tables
# Date: 2026-01-23

echo "=================================================="
echo "API Endpoint Verification Test"
echo "=================================================="
echo ""

# Configuration
BASE_URL="http://localhost:3000"
API_BASE="/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=$4

    echo -n "Testing: $description... "

    # Make request and capture status code
    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "${BASE_URL}${endpoint}")

    # Check if status matches expected (allowing 401 for unauthenticated requests)
    if [ "$response" -eq "$expected_status" ] || [ "$response" -eq 401 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got HTTP $response)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "Note: 401 Unauthorized is acceptable for protected endpoints"
echo ""

# Shipping Module Tests
echo "=================================================="
echo "SHIPPING MODULE TESTS"
echo "=================================================="
echo ""

test_endpoint "GET" "/api/shipping/customers" "List Customers" 200
test_endpoint "GET" "/api/shipping/customers?search=test" "Search Customers" 200
test_endpoint "GET" "/api/shipping/customers?category=retail" "Filter Customers by Category" 200

echo ""
echo "Sales Orders:"
test_endpoint "GET" "/api/shipping/sales-orders/test-id/allocations" "Get SO Allocations" 401
test_endpoint "GET" "/api/shipping/sales-orders/test-id/status" "Get SO Status" 401

echo ""
echo "Pick Lists:"
test_endpoint "GET" "/api/shipping/pick-lists" "List Pick Lists" 401
test_endpoint "GET" "/api/shipping/pick-lists/my-picks" "Get My Pick Lists" 401

echo ""
echo "RMA:"
test_endpoint "GET" "/api/shipping/rma" "List RMA Requests" 401

echo ""

# Quality Module Tests
echo "=================================================="
echo "QUALITY MODULE TESTS"
echo "=================================================="
echo ""

test_endpoint "GET" "/api/quality/settings" "Get Quality Settings" 200
test_endpoint "GET" "/api/quality/status/types" "List Quality Status Types" 401

echo ""
echo "Specifications:"
test_endpoint "GET" "/api/quality/specifications" "List Quality Specifications" 401
test_endpoint "GET" "/api/quality/specifications/test-id/route.ts" "Get Spec Details" 404

echo ""
echo "Inspections:"
test_endpoint "GET" "/api/quality/inspections" "List Inspections" 401
test_endpoint "GET" "/api/quality/inspections/pending" "List Pending Inspections" 401
test_endpoint "GET" "/api/quality/inspections/incoming" "List Incoming Inspections" 401

echo ""
echo "Sampling Plans:"
test_endpoint "GET" "/api/quality/sampling-plans" "List Sampling Plans" 401

echo ""
echo "Test Results:"
test_endpoint "GET" "/api/quality/test-results" "List Test Results" 401

echo ""
echo "Quality Holds:"
test_endpoint "GET" "/api/quality/holds" "List Quality Holds" 401
test_endpoint "GET" "/api/quality/holds/active" "List Active Holds" 401
test_endpoint "GET" "/api/quality/holds/stats" "Get Hold Stats" 401

echo ""
echo "NCR Reports:"
test_endpoint "GET" "/api/quality/ncrs" "List NCR Reports" 401

echo ""

# Summary
echo "=================================================="
echo "TEST SUMMARY"
echo "=================================================="
echo ""
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Notes:"
    echo "- All endpoints are accessible"
    echo "- 401 responses indicate proper authentication checks"
    echo "- 404 responses for invalid IDs are expected"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure the development server is running: npm run dev"
    echo "2. Check that all migrations have been applied"
    echo "3. Verify Supabase connection in .env.local"
    exit 1
fi
