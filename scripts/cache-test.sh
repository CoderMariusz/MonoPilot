#!/bin/bash
#
# Cache System Test Script
# Version: 2.0.0
# Purpose: Test all cache layers with sample queries
#

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}        ${YELLOW}CACHE SYSTEM TEST${NC}                                 ${CYAN}║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo -e "❌ Python 3 required"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "❌ .env.local not found"
    exit 1
fi

# Export API keys
export $(cat .env.local | grep -v '^#' | xargs)

# Test 1: Unified Cache System (All Layers)
echo -e "${YELLOW}Test 1: Unified Cache System (ALL 4 LAYERS)${NC}"
echo "Running unified_cache.py..."
cd .claude/cache
python3 unified_cache.py
echo ""

# Test 2: Display Dashboard
echo -e "${YELLOW}Test 2: Cache Dashboard${NC}"
cd ../..
bash scripts/cache-stats.sh

echo ""
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Check metrics: ${YELLOW}bash scripts/cache-stats.sh${NC}"
echo -e "  2. Test with real queries"
echo -e "  3. Monitor savings over time"
echo ""
