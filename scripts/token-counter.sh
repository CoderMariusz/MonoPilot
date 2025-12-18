#!/bin/bash
# Token Counter for Agent Methodology Pack
# Estimates token usage for context budget management
#
# Usage: bash scripts/token-counter.sh [--verbose]
#
# Options:
#   --verbose    Show detailed per-file breakdown
#
# Author: Agent Methodology Pack
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
VERBOSE=false
TOKEN_WARNING_THRESHOLD=2000
TYPICAL_SESSION_BUDGET=100000  # 100K tokens for Claude 3.5 Sonnet

# Parse arguments
if [[ "$1" == "--verbose" ]]; then
    VERBOSE=true
fi

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_subheader() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
}

# Estimate tokens for a file (chars / 4 approximation)
estimate_tokens() {
    local file="$1"
    if [ -f "$file" ]; then
        local chars=$(wc -c < "$file" | tr -d ' ')
        local tokens=$((chars / 4))
        echo "$tokens"
    else
        echo "0"
    fi
}

# Format number with commas
format_number() {
    printf "%'d" "$1" 2>/dev/null || echo "$1"
}

# Print file with token count
print_file_tokens() {
    local file="$1"
    local tokens="$2"
    local filename=$(basename "$file")

    # Color code based on token count
    if [ "$tokens" -gt "$TOKEN_WARNING_THRESHOLD" ]; then
        echo -e "  ${RED}⚠️  $filename${NC} - ${RED}$(format_number $tokens) tokens${NC}"
    elif [ "$tokens" -gt 1000 ]; then
        echo -e "  ${YELLOW}📄 $filename${NC} - ${YELLOW}$(format_number $tokens) tokens${NC}"
    else
        echo -e "  ${GREEN}📄 $filename${NC} - ${GREEN}$(format_number $tokens) tokens${NC}"
    fi
}

# Count tokens in directory
count_directory_tokens() {
    local dir="$1"
    local pattern="${2:-*.md}"
    local total=0
    local file_count=0

    if [ -d "$dir" ]; then
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                tokens=$(estimate_tokens "$file")
                total=$((total + tokens))
                ((file_count++))

                if [ "$VERBOSE" = true ]; then
                    print_file_tokens "$file" "$tokens"
                fi
            fi
        done < <(find "$dir" -type f -name "$pattern" 2>/dev/null)
    fi

    echo "$total|$file_count"
}

# Main script
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║            TOKEN COUNTER - CONTEXT BUDGET ANALYSIS         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

    # Initialize counters
    TOTAL_TOKENS=0

    # ============================================================
    # 1. CORE FILES (Always Loaded)
    # ============================================================
    print_header "1. Core Files (Always Loaded)"

    CORE_TOKENS=0

    if [ -f "CLAUDE.md" ]; then
        tokens=$(estimate_tokens "CLAUDE.md")
        CORE_TOKENS=$((CORE_TOKENS + tokens))
        print_file_tokens "CLAUDE.md" "$tokens"
    fi

    if [ -f "PROJECT-STATE.md" ]; then
        tokens=$(estimate_tokens "PROJECT-STATE.md")
        CORE_TOKENS=$((CORE_TOKENS + tokens))
        print_file_tokens "PROJECT-STATE.md" "$tokens"
    fi

    echo ""
    echo -e "${MAGENTA}  CORE SUBTOTAL: $(format_number $CORE_TOKENS) tokens${NC}"
    TOTAL_TOKENS=$((TOTAL_TOKENS + CORE_TOKENS))

    # ============================================================
    # 2. AGENT DEFINITIONS
    # ============================================================
    print_header "2. Agent Definitions"

    if [ "$VERBOSE" = true ]; then
        print_subheader "Planning Agents"
    fi
    result=$(count_directory_tokens ".claude/agents/planning")
    planning_tokens=$(echo "$result" | cut -d'|' -f1)
    planning_count=$(echo "$result" | cut -d'|' -f2)

    if [ "$VERBOSE" = true ]; then
        print_subheader "Development Agents"
    fi
    result=$(count_directory_tokens ".claude/agents/development")
    dev_tokens=$(echo "$result" | cut -d'|' -f1)
    dev_count=$(echo "$result" | cut -d'|' -f2)

    if [ "$VERBOSE" = true ]; then
        print_subheader "Quality Agents"
    fi
    result=$(count_directory_tokens ".claude/agents/quality")
    quality_tokens=$(echo "$result" | cut -d'|' -f1)
    quality_count=$(echo "$result" | cut -d'|' -f2)

    if [ "$VERBOSE" = true ]; then
        print_subheader "Orchestrator"
    fi
    orch_tokens=0
    if [ -f ".claude/agents/ORCHESTRATOR.md" ]; then
        orch_tokens=$(estimate_tokens ".claude/agents/ORCHESTRATOR.md")
        if [ "$VERBOSE" = true ]; then
            print_file_tokens ".claude/agents/ORCHESTRATOR.md" "$orch_tokens"
        fi
    fi

    AGENT_TOKENS=$((planning_tokens + dev_tokens + quality_tokens + orch_tokens))
    total_agent_files=$((planning_count + dev_count + quality_count))

    echo ""
    echo -e "${CYAN}  Planning: $(format_number $planning_tokens) tokens ($planning_count files)${NC}"
    echo -e "${CYAN}  Development: $(format_number $dev_tokens) tokens ($dev_count files)${NC}"
    echo -e "${CYAN}  Quality: $(format_number $quality_tokens) tokens ($quality_count files)${NC}"
    echo -e "${CYAN}  Orchestrator: $(format_number $orch_tokens) tokens${NC}"
    echo ""
    echo -e "${MAGENTA}  AGENTS SUBTOTAL: $(format_number $AGENT_TOKENS) tokens ($total_agent_files files)${NC}"
    TOTAL_TOKENS=$((TOTAL_TOKENS + AGENT_TOKENS))

    # ============================================================
    # 3. STATE FILES
    # ============================================================
    print_header "3. State Files"

    result=$(count_directory_tokens ".claude/state")
    state_tokens=$(echo "$result" | cut -d'|' -f1)
    state_count=$(echo "$result" | cut -d'|' -f2)

    echo ""
    echo -e "${MAGENTA}  STATE SUBTOTAL: $(format_number $state_tokens) tokens ($state_count files)${NC}"
    TOTAL_TOKENS=$((TOTAL_TOKENS + state_tokens))

    # ============================================================
    # 4. PATTERNS
    # ============================================================
    print_header "4. Patterns & Workflows"

    if [ "$VERBOSE" = true ]; then
        print_subheader "Patterns"
    fi
    result=$(count_directory_tokens ".claude/patterns")
    pattern_tokens=$(echo "$result" | cut -d'|' -f1)
    pattern_count=$(echo "$result" | cut -d'|' -f2)

    if [ "$VERBOSE" = true ]; then
        print_subheader "Workflows"
    fi
    result=$(count_directory_tokens ".claude/workflows")
    workflow_tokens=$(echo "$result" | cut -d'|' -f1)
    workflow_count=$(echo "$result" | cut -d'|' -f2)

    PATTERN_TOTAL=$((pattern_tokens + workflow_tokens))

    echo ""
    echo -e "${CYAN}  Patterns: $(format_number $pattern_tokens) tokens ($pattern_count files)${NC}"
    echo -e "${CYAN}  Workflows: $(format_number $workflow_tokens) tokens ($workflow_count files)${NC}"
    echo ""
    echo -e "${MAGENTA}  PATTERNS SUBTOTAL: $(format_number $PATTERN_TOTAL) tokens${NC}"
    TOTAL_TOKENS=$((TOTAL_TOKENS + PATTERN_TOTAL))

    # ============================================================
    # 5. CONFIGURATION FILES
    # ============================================================
    print_header "5. Configuration Files"

    CONFIG_TOKENS=0
    config_files=("CONTEXT-BUDGET.md" "MODEL-ROUTING.md" "MODULE-INDEX.md" "PROMPTS.md" "TABLES.md" "PATTERNS.md")

    for file in "${config_files[@]}"; do
        if [ -f ".claude/$file" ]; then
            tokens=$(estimate_tokens ".claude/$file")
            CONFIG_TOKENS=$((CONFIG_TOKENS + tokens))
            if [ "$VERBOSE" = true ]; then
                print_file_tokens ".claude/$file" "$tokens"
            fi
        fi
    done

    echo ""
    echo -e "${MAGENTA}  CONFIG SUBTOTAL: $(format_number $CONFIG_TOKENS) tokens${NC}"
    TOTAL_TOKENS=$((TOTAL_TOKENS + CONFIG_TOKENS))

    # ============================================================
    # 6. DOCUMENTATION
    # ============================================================
    print_header "6. Documentation"

    result=$(count_directory_tokens "docs")
    doc_tokens=$(echo "$result" | cut -d'|' -f1)
    doc_count=$(echo "$result" | cut -d'|' -f2)

    echo ""
    echo -e "${MAGENTA}  DOCS SUBTOTAL: $(format_number $doc_tokens) tokens ($doc_count files)${NC}"
    TOTAL_TOKENS=$((TOTAL_TOKENS + doc_tokens))

    # ============================================================
    # SUMMARY & RECOMMENDATIONS
    # ============================================================
    print_header "SUMMARY"

    echo ""
    echo -e "${BLUE}Category Breakdown:${NC}"
    echo -e "  ${GREEN}Core Files:${NC}        $(format_number $CORE_TOKENS) tokens"
    echo -e "  ${GREEN}Agent Definitions:${NC} $(format_number $AGENT_TOKENS) tokens"
    echo -e "  ${GREEN}State Files:${NC}       $(format_number $state_tokens) tokens"
    echo -e "  ${GREEN}Patterns/Workflows:${NC} $(format_number $PATTERN_TOTAL) tokens"
    echo -e "  ${GREEN}Configuration:${NC}     $(format_number $CONFIG_TOKENS) tokens"
    echo -e "  ${GREEN}Documentation:${NC}     $(format_number $doc_tokens) tokens"
    echo ""
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${MAGENTA}  TOTAL ESTIMATED TOKENS: $(format_number $TOTAL_TOKENS)${NC}"
    echo -e "${MAGENTA}═══════════════════════════════════════════════════════════${NC}"
    echo ""

    # ============================================================
    # SESSION BUDGET ANALYSIS
    # ============================================================
    print_header "SESSION BUDGET ANALYSIS"

    # Calculate typical session usage
    RESERVED_TOKENS=$((CORE_TOKENS + 500))  # Core + 1 agent
    AVAILABLE_FOR_TASK=$((TYPICAL_SESSION_BUDGET - RESERVED_TOKENS))

    echo ""
    echo -e "${BLUE}Typical Session Budget:${NC} $(format_number $TYPICAL_SESSION_BUDGET) tokens"
    echo ""
    echo -e "${CYAN}Reserved (always loaded):${NC}"
    echo -e "  - CLAUDE.md + PROJECT-STATE.md + 1 Agent: ~$(format_number $RESERVED_TOKENS) tokens"
    echo ""
    echo -e "${GREEN}Available for task context:${NC} ~$(format_number $AVAILABLE_FOR_TASK) tokens"
    echo ""
    echo -e "${YELLOW}This allows loading:${NC}"
    echo -e "  - ~$((AVAILABLE_FOR_TASK / 500)) small files (500 tokens each)"
    echo -e "  - ~$((AVAILABLE_FOR_TASK / 2000)) large files (2000 tokens each)"
    echo -e "  - Or a mix of documentation, code, and test files"
    echo ""

    # ============================================================
    # WARNINGS
    # ============================================================
    print_header "RECOMMENDATIONS"

    echo ""

    # Check for large files
    LARGE_FILE_COUNT=0
    while IFS= read -r file; do
        if [ -f "$file" ]; then
            tokens=$(estimate_tokens "$file")
            if [ "$tokens" -gt "$TOKEN_WARNING_THRESHOLD" ]; then
                if [ "$LARGE_FILE_COUNT" -eq 0 ]; then
                    echo -e "${YELLOW}⚠️  Large Files (>$TOKEN_WARNING_THRESHOLD tokens):${NC}"
                fi
                echo -e "  ${RED}$file${NC} - $(format_number $tokens) tokens"
                ((LARGE_FILE_COUNT++))
            fi
        fi
    done < <(find . -type f -name "*.md" 2>/dev/null)

    if [ "$LARGE_FILE_COUNT" -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}Consider splitting large files or using selective loading.${NC}"
    else
        echo -e "${GREEN}✅ All files are within recommended token limits.${NC}"
    fi

    echo ""

    # Budget utilization
    PERCENTAGE=$((TOTAL_TOKENS * 100 / TYPICAL_SESSION_BUDGET))

    if [ "$PERCENTAGE" -lt 50 ]; then
        echo -e "${GREEN}✅ Total documentation uses only $PERCENTAGE% of typical session budget.${NC}"
        echo -e "${GREEN}   You have plenty of room for code and context.${NC}"
    elif [ "$PERCENTAGE" -lt 80 ]; then
        echo -e "${YELLOW}⚠️  Total documentation uses $PERCENTAGE% of typical session budget.${NC}"
        echo -e "${YELLOW}   Monitor context usage during development.${NC}"
    else
        echo -e "${RED}⚠️  Total documentation uses $PERCENTAGE% of typical session budget.${NC}"
        echo -e "${RED}   Consider using selective loading and summarization.${NC}"
    fi

    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    ANALYSIS COMPLETE                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Run main function
main
