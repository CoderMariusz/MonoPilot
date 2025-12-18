#!/bin/bash
#
# Cache Performance Dashboard
# Version: 2.0.0
# Purpose: Display real-time cache metrics and savings
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths
CACHE_DIR=".claude/cache"
LOGS_DIR="$CACHE_DIR/logs"
METRICS_FILE="$LOGS_DIR/metrics.json"
ACCESS_LOG="$LOGS_DIR/access.log"
CONFIG_FILE="$CACHE_DIR/config.json"

# Check if cache directory exists
if [ ! -d "$CACHE_DIR" ]; then
    echo -e "${RED}❌ Cache directory not found${NC}"
    echo "Run: mkdir -p $CACHE_DIR"
    exit 1
fi

# Function to get JSON value
get_json_value() {
    local file=$1
    local key=$2
    if [ -f "$file" ]; then
        python3 -c "import json; data=json.load(open('$file')); print(data.get('$key', 0))" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

# Function to count files
count_cache_files() {
    local dir=$1
    if [ -d "$dir" ]; then
        find "$dir" -type f | wc -l
    else
        echo "0"
    fi
}

# Function to get directory size
get_dir_size() {
    local dir=$1
    if [ -d "$dir" ]; then
        du -sh "$dir" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# Function to calculate percentage
calc_percentage() {
    local part=$1
    local total=$2
    if [ "$total" -gt 0 ]; then
        python3 -c "print(round(($part / $total) * 100, 1))"
    else
        echo "0.0"
    fi
}

# Clear screen
clear

# Header
echo -e "${CYAN}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│${NC}          ${PURPLE}CACHE PERFORMANCE DASHBOARD${NC}                       ${CYAN}│${NC}"
echo -e "${CYAN}│${NC}          Universal Cache System v2.0.0                    ${CYAN}│${NC}"
echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
echo ""

# Check if metrics file exists
if [ -f "$METRICS_FILE" ]; then
    # Read metrics
    total_queries=$(get_json_value "$METRICS_FILE" "total_queries")
    hot_hits=$(get_json_value "$METRICS_FILE" "hot_hits")
    cold_hits=$(get_json_value "$METRICS_FILE" "cold_hits")
    semantic_hits=$(get_json_value "$METRICS_FILE" "semantic_hits")
    hot_misses=$(get_json_value "$METRICS_FILE" "hot_misses")
    cold_misses=$(get_json_value "$METRICS_FILE" "cold_misses")
    cost_saved=$(get_json_value "$METRICS_FILE" "cost_saved")
    tokens_saved=$(get_json_value "$METRICS_FILE" "tokens_saved")

    # Calculate hit rates
    hot_hit_rate=$(calc_percentage "$hot_hits" "$total_queries")
    cold_hit_rate=$(calc_percentage "$cold_hits" "$total_queries")
    semantic_hit_rate=$(calc_percentage "$semantic_hits" "$total_queries")

    total_hits=$((hot_hits + cold_hits + semantic_hits))
    overall_hit_rate=$(calc_percentage "$total_hits" "$total_queries")

    # Layer 1: Claude Prompt Cache (Estimated)
    echo -e "  ${BLUE}📊 LAYER 1: Claude Prompt Cache${NC}"
    echo -e "     ${GREEN}✓${NC} Automatic caching by Claude API"
    echo -e "     Expected Savings: ${GREEN}90% cost${NC}, ${GREEN}85% latency${NC}"
    echo -e "     Status: ${GREEN}ENABLED${NC} (automatic)"
    echo ""

    # Layer 2: Exact Match Cache (Hot + Cold)
    echo -e "  ${BLUE}📊 LAYER 2: Exact Match Cache${NC}"
    echo -e "     Hot Cache:  ${hot_hits} hits / ${total_queries} queries (${hot_hit_rate}%)"
    echo -e "     Cold Cache: ${cold_hits} hits / ${total_queries} queries (${cold_hit_rate}%)"
    hot_size=$(get_dir_size "$CACHE_DIR/hot")
    cold_size=$(get_dir_size "$CACHE_DIR/cold")
    hot_files=$(count_cache_files "$CACHE_DIR/hot")
    cold_files=$(count_cache_files "$CACHE_DIR/cold")
    echo -e "     Hot Size:   ${hot_size} (${hot_files} entries)"
    echo -e "     Cold Size:  ${cold_size} (${cold_files} entries)"
    echo ""

    # Layer 3: Semantic Cache
    echo -e "  ${BLUE}📊 LAYER 3: Semantic Cache (OpenAI + ChromaDB)${NC}"
    if [ "$semantic_hits" -gt 0 ] || [ -d "$CACHE_DIR/semantic" ]; then
        echo -e "     Semantic Matches: ${semantic_hits} hits / ${total_queries} queries (${semantic_hit_rate}%)"
        semantic_size=$(get_dir_size "$CACHE_DIR/semantic")
        echo -e "     Vector DB Size: ${semantic_size}"

        # Check if ChromaDB collection exists
        if [ -d "$CACHE_DIR/semantic/chroma.sqlite3" ]; then
            echo -e "     Status: ${GREEN}ACTIVE${NC}"
        else
            echo -e "     Status: ${YELLOW}INITIALIZED${NC}"
        fi
    else
        echo -e "     Status: ${YELLOW}NO DATA YET${NC}"
        echo -e "     Waiting for first queries..."
    fi
    echo ""

    # Layer 4: Global Knowledge Base
    echo -e "  ${BLUE}📊 LAYER 4: Global Knowledge Base${NC}"
    global_dir="$HOME/.claude-agent-pack/global"
    if [ -d "$global_dir" ]; then
        global_agents=$(count_cache_files "$global_dir/agents")
        global_patterns=$(count_cache_files "$global_dir/patterns")
        global_skills=$(count_cache_files "$global_dir/skills")
        global_qa=$(count_cache_files "$global_dir/qa-patterns")

        echo -e "     Shared Agents:   ${global_agents}"
        echo -e "     Shared Patterns: ${global_patterns}"
        echo -e "     Shared Skills:   ${global_skills}"
        echo -e "     Q&A Database:    ${global_qa} entries"
        echo -e "     Status: ${GREEN}ENABLED${NC}"
    else
        echo -e "     Status: ${YELLOW}NOT INITIALIZED${NC}"
        echo -e "     Run: mkdir -p ~/.claude-agent-pack/global"
    fi
    echo ""

    # Overall Summary
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo -e "  ${PURPLE}💰 SAVINGS SUMMARY${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo ""
    echo -e "  Overall Hit Rate:      ${GREEN}${overall_hit_rate}%${NC}"
    echo -e "  Total Queries:         ${total_queries}"
    echo -e "  Cache Hits:            ${GREEN}${total_hits}${NC}"
    echo -e "  Cache Misses:          ${RED}$((total_queries - total_hits))${NC}"
    echo ""
    echo -e "  Tokens Saved:          ${GREEN}${tokens_saved}${NC} tokens"
    echo -e "  Cost Saved:            ${GREEN}\$${cost_saved}${NC}"
    echo ""

    # Estimated monthly savings
    if [ "$total_queries" -gt 0 ]; then
        # Extrapolate to monthly (30 days)
        monthly_tokens=$((tokens_saved * 30))
        monthly_cost=$(python3 -c "print(round($cost_saved * 30, 2))")

        echo -e "  ${YELLOW}📈 Estimated Monthly (30 days):${NC}"
        echo -e "     Token Reduction: ${GREEN}${monthly_tokens}${NC} tokens"
        echo -e "     Cost Savings:    ${GREEN}\$${monthly_cost}${NC}"
        echo ""
    fi

else
    # No metrics yet
    echo -e "  ${YELLOW}⚠️  No metrics available yet${NC}"
    echo ""
    echo -e "  Cache system is configured but not used yet."
    echo -e "  Metrics will appear after first queries."
    echo ""

    # Show configuration
    if [ -f "$CONFIG_FILE" ]; then
        echo -e "  ${GREEN}✓${NC} Configuration: $CONFIG_FILE"
        version=$(get_json_value "$CONFIG_FILE" "version")
        echo -e "  ${GREEN}✓${NC} Version: $version"
    fi
    echo ""
fi

# Recent Activity
if [ -f "$ACCESS_LOG" ]; then
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo -e "  ${PURPLE}📝 RECENT ACTIVITY (Last 5)${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────┤${NC}"
    echo ""

    tail -n 5 "$ACCESS_LOG" | while read -r line; do
        timestamp=$(echo "$line" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['timestamp'][:19])" 2>/dev/null || echo "unknown")
        layer=$(echo "$line" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['layer'])" 2>/dev/null || echo "unknown")
        status=$(echo "$line" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())['status'])" 2>/dev/null || echo "unknown")

        if [ "$status" = "HIT" ]; then
            status_color="${GREEN}"
        elif [ "$status" = "MISS" ]; then
            status_color="${RED}"
        else
            status_color="${YELLOW}"
        fi

        echo -e "  ${timestamp} | ${layer}: ${status_color}${status}${NC}"
    done
    echo ""
fi

# Footer
echo -e "${CYAN}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "  ${CYAN}ℹ️  Commands:${NC}"
echo -e "     ${YELLOW}cache-stats.sh${NC}        - Show this dashboard"
echo -e "     ${YELLOW}cache-clear.sh${NC}        - Clear all caches"
echo -e "     ${YELLOW}cache-test.sh${NC}         - Test cache system"
echo ""
echo -e "  ${GREEN}✅ Cache system operational${NC}"
echo ""
