#!/bin/bash

# find-large-files.sh
# Finds files that need sharding based on size/lines
# Part of the Agent Methodology Pack

set -euo pipefail

# ============================================================================
# COLORS AND FORMATTING
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# ============================================================================
# DEFAULT CONFIGURATION
# ============================================================================

SCAN_PATH="."
MIN_LINES=500
MIN_SIZE_KB=20
FILE_TYPE="md"
SHOW_HELP=false

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              LARGE FILE FINDER                              ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_help() {
    cat << EOF
${BOLD}USAGE:${NC}
    bash find-large-files.sh [PATH] [OPTIONS]

${BOLD}DESCRIPTION:${NC}
    Finds files that need sharding based on size/lines.
    Helps identify documentation that exceeds AI context limits.

${BOLD}ARGUMENTS:${NC}
    PATH                Directory to scan (default: current directory)

${BOLD}OPTIONS:${NC}
    --min-lines NUM     Minimum line count threshold (default: 500)
    --min-size NUM      Minimum size in KB (default: 20)
    --type EXT          File extension to filter (default: md)
    -h, --help          Show this help message

${BOLD}EXAMPLES:${NC}
    # Scan current directory with defaults
    bash find-large-files.sh

    # Scan specific directory
    bash find-large-files.sh ./docs

    # Custom thresholds
    bash find-large-files.sh --min-lines 1000 --min-size 50

    # Find large TypeScript files
    bash find-large-files.sh ./src --type ts --min-lines 300

${BOLD}OUTPUT:${NC}
    - List of files exceeding thresholds
    - Line count, size, and estimated token count
    - Recommendations for each file
    - Summary statistics

EOF
}

estimate_tokens() {
    local lines=$1
    # Rough estimation: 1 line ≈ 25 tokens (conservative)
    echo $((lines * 25))
}

format_size() {
    local size_kb=$1
    if [ "$size_kb" -lt 1024 ]; then
        echo "${size_kb}KB"
    else
        local size_mb=$((size_kb / 1024))
        echo "${size_mb}MB"
    fi
}

get_action() {
    local lines=$1
    local size_kb=$2

    if [ "$lines" -gt 2000 ] || [ "$size_kb" -gt 100 ]; then
        echo -e "${RED}SHARD NOW${NC}"
    elif [ "$lines" -gt 1000 ] || [ "$size_kb" -gt 50 ]; then
        echo -e "${YELLOW}SHARD SOON${NC}"
    else
        echo -e "${GREEN}CONSIDER${NC}"
    fi
}

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_help
            exit 0
            ;;
        --min-lines)
            MIN_LINES="$2"
            shift 2
            ;;
        --min-size)
            MIN_SIZE_KB="$2"
            shift 2
            ;;
        --type)
            FILE_TYPE="$2"
            shift 2
            ;;
        -*)
            echo -e "${RED}Error: Unknown option $1${NC}"
            print_help
            exit 1
            ;;
        *)
            SCAN_PATH="$1"
            shift
            ;;
    esac
done

# ============================================================================
# VALIDATION
# ============================================================================

if [ ! -d "$SCAN_PATH" ]; then
    echo -e "${RED}Error: Directory '$SCAN_PATH' does not exist${NC}"
    exit 1
fi

# ============================================================================
# MAIN LOGIC
# ============================================================================

print_header

echo -e "${BOLD}Scanning:${NC} $(cd "$SCAN_PATH" && pwd)"
echo -e "${BOLD}Thresholds:${NC} >${MIN_LINES} lines OR >${MIN_SIZE_KB}KB"
echo -e "${BOLD}File type:${NC} *.${FILE_TYPE}"
echo ""

# Find all files of specified type
mapfile -t files < <(find "$SCAN_PATH" -type f -name "*.${FILE_TYPE}" 2>/dev/null | sort)

if [ ${#files[@]} -eq 0 ]; then
    echo -e "${YELLOW}No *.${FILE_TYPE} files found in $SCAN_PATH${NC}"
    exit 0
fi

# Analyze files
large_files=()
declare -A file_stats

for file in "${files[@]}"; do
    # Get line count
    lines=$(wc -l < "$file" 2>/dev/null || echo 0)

    # Get size in KB
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        size_bytes=$(stat -f%z "$file" 2>/dev/null || echo 0)
    else
        # Linux/Git Bash
        size_bytes=$(stat -c%s "$file" 2>/dev/null || echo 0)
    fi
    size_kb=$((size_bytes / 1024))

    # Check if file exceeds thresholds
    if [ "$lines" -ge "$MIN_LINES" ] || [ "$size_kb" -ge "$MIN_SIZE_KB" ]; then
        large_files+=("$file")
        file_stats["$file"]="$lines|$size_kb"
    fi
done

# Display results
if [ ${#large_files[@]} -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ No large files found!${NC}"
    echo ""
    echo -e "${DIM}All files are within acceptable limits.${NC}"
    exit 0
fi

echo -e "${YELLOW}${BOLD}LARGE FILES FOUND:${NC}"
echo ""

# Table header
printf "${BOLD}%-60s %8s %10s %12s %15s${NC}\n" "File" "Lines" "Size" "Tokens" "Action"
printf "${DIM}%s${NC}\n" "────────────────────────────────────────────────────────────────────────────────────────────────────────────────────"

total_tokens=0
total_estimated_savings=0

for file in "${large_files[@]}"; do
    IFS='|' read -r lines size_kb <<< "${file_stats[$file]}"

    tokens=$(estimate_tokens "$lines")
    total_tokens=$((total_tokens + tokens))

    # Estimate savings (assuming 60% reduction after sharding)
    savings=$((tokens * 60 / 100))
    total_estimated_savings=$((total_estimated_savings + savings))

    # Format file path (shorten if too long)
    display_file="$file"
    if [ ${#display_file} -gt 58 ]; then
        display_file="...${display_file: -55}"
    fi

    action=$(get_action "$lines" "$size_kb")
    size_formatted=$(format_size "$size_kb")
    tokens_formatted=$(printf "%'d" "$tokens" 2>/dev/null || echo "$tokens")

    printf "%-60s %8d %10s %12s %15s\n" \
        "$display_file" \
        "$lines" \
        "$size_formatted" \
        "~$tokens_formatted" \
        "$action"
done

echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}Summary:${NC}"
echo -e "  • Files needing attention: ${YELLOW}${BOLD}${#large_files[@]}${NC}"
echo -e "  • Total estimated tokens: ${CYAN}$(printf "%'d" "$total_tokens" 2>/dev/null || echo "$total_tokens")${NC}"
echo -e "  • Potential savings after sharding: ${GREEN}~$(printf "%'d" "$total_estimated_savings" 2>/dev/null || echo "$total_estimated_savings") tokens${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Recommendations
echo -e "${BOLD}${MAGENTA}RECOMMENDATIONS:${NC}"
echo ""
echo -e "  ${BOLD}1.${NC} Start with ${RED}SHARD NOW${NC} files (>2000 lines or >100KB)"
echo -e "  ${BOLD}2.${NC} Then handle ${YELLOW}SHARD SOON${NC} files (>1000 lines or >50KB)"
echo -e "  ${BOLD}3.${NC} Monitor ${GREEN}CONSIDER${NC} files for future growth"
echo ""
echo -e "${BOLD}To shard a file, run:${NC}"
echo -e "  ${CYAN}bash scripts/shard-document.sh <file>${NC}"
echo ""

# List files that need immediate attention
immediate_files=()
for file in "${large_files[@]}"; do
    IFS='|' read -r lines size_kb <<< "${file_stats[$file]}"
    if [ "$lines" -gt 2000 ] || [ "$size_kb" -gt 100 ]; then
        immediate_files+=("$file")
    fi
done

if [ ${#immediate_files[@]} -gt 0 ]; then
    echo -e "${RED}${BOLD}⚠ IMMEDIATE ACTION NEEDED:${NC}"
    for file in "${immediate_files[@]}"; do
        echo -e "  ${RED}•${NC} $file"
    done
    echo ""
fi

exit 0
