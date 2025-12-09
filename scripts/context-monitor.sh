#!/bin/bash
# Context Budget Monitor for Claude Code
# Monitors context usage and provides alerts
#
# Usage:
#   bash scripts/context-monitor.sh check         Check current context estimate
#   bash scripts/context-monitor.sh estimate FILE Estimate tokens for file
#   bash scripts/context-monitor.sh budget        Show context budget status
#   bash scripts/context-monitor.sh alert PERCENT Trigger alert if over threshold
#
# Version: 1.0

set -e

# Configuration
CONTEXT_LIMIT=200000  # Claude's context window
WARNING_THRESHOLD=70
ALERT_THRESHOLD=85
CRITICAL_THRESHOLD=95

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Estimate tokens from character count (rough: ~4 chars per token)
estimate_tokens() {
    local chars=$1
    echo $((chars / 4))
}

# Estimate tokens from file
estimate_file_tokens() {
    local file="$1"
    if [ -f "$file" ]; then
        local chars=$(wc -c < "$file")
        estimate_tokens "$chars"
    else
        echo "0"
    fi
}

# Estimate tokens from text
estimate_text_tokens() {
    local text="$1"
    local chars=${#text}
    estimate_tokens "$chars"
}

# Get project context size (loaded files)
get_project_context() {
    local project_root="${1:-.}"
    local total_tokens=0

    # CLAUDE.md
    if [ -f "$project_root/CLAUDE.md" ]; then
        local tokens=$(estimate_file_tokens "$project_root/CLAUDE.md")
        total_tokens=$((total_tokens + tokens))
    fi

    # PROJECT-STATE.md
    if [ -f "$project_root/PROJECT-STATE.md" ]; then
        local tokens=$(estimate_file_tokens "$project_root/PROJECT-STATE.md")
        total_tokens=$((total_tokens + tokens))
    fi

    # Active agent (estimate largest)
    local agent_tokens=7000  # DISCOVERY-AGENT is largest

    echo $((total_tokens + agent_tokens))
}

# Show context budget visualization
show_budget() {
    local used=${1:-0}
    local limit=$CONTEXT_LIMIT
    local percent=$((used * 100 / limit))
    local remaining=$((limit - used))

    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║              CONTEXT BUDGET MONITOR                          ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"

    # Progress bar
    local bar_width=50
    local filled=$((percent * bar_width / 100))
    local empty=$((bar_width - filled))

    local color=$GREEN
    if [ $percent -ge $CRITICAL_THRESHOLD ]; then
        color=$RED
    elif [ $percent -ge $ALERT_THRESHOLD ]; then
        color=$YELLOW
    elif [ $percent -ge $WARNING_THRESHOLD ]; then
        color=$YELLOW
    fi

    printf "${CYAN}║${NC} "
    printf "${color}"
    printf '%*s' "$filled" '' | tr ' ' '█'
    printf '%*s' "$empty" '' | tr ' ' '░'
    printf "${NC}"
    printf " %3d%% ${CYAN}║${NC}\n" "$percent"

    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    printf "${CYAN}║${NC} %-20s %'10d tokens %18s ${CYAN}║${NC}\n" "Used:" "$used" ""
    printf "${CYAN}║${NC} %-20s %'10d tokens %18s ${CYAN}║${NC}\n" "Remaining:" "$remaining" ""
    printf "${CYAN}║${NC} %-20s %'10d tokens %18s ${CYAN}║${NC}\n" "Limit:" "$limit" ""
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"

    # Status message
    local status_msg=""
    local status_color=$GREEN
    if [ $percent -ge $CRITICAL_THRESHOLD ]; then
        status_msg="CRITICAL - Run /compact NOW!"
        status_color=$RED
    elif [ $percent -ge $ALERT_THRESHOLD ]; then
        status_msg="HIGH - Consider running /compact"
        status_color=$YELLOW
    elif [ $percent -ge $WARNING_THRESHOLD ]; then
        status_msg="MODERATE - Monitor usage"
        status_color=$YELLOW
    else
        status_msg="OK - Plenty of context available"
        status_color=$GREEN
    fi

    printf "${CYAN}║${NC} Status: ${status_color}%-50s${NC} ${CYAN}║${NC}\n" "$status_msg"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check agent sizes
show_agent_sizes() {
    local agents_dir="${1:-.}/.claude/agents"

    echo ""
    echo -e "${CYAN}=== Agent Token Estimates ===${NC}"
    echo ""
    printf "%-25s %10s\n" "Agent" "Tokens"
    echo "----------------------------------------"

    local total=0
    for category in "" "planning" "development" "quality"; do
        local dir="$agents_dir/$category"
        if [ -d "$dir" ]; then
            for agent in "$dir"/*.md; do
                if [ -f "$agent" ]; then
                    local name=$(basename "$agent" .md)
                    local tokens=$(estimate_file_tokens "$agent")
                    printf "%-25s %'10d\n" "$name" "$tokens"
                    total=$((total + tokens))
                fi
            done
        fi
    done

    echo "----------------------------------------"
    printf "%-25s %'10d\n" "TOTAL" "$total"
    echo ""
}

# Estimate conversation tokens (rough estimate based on message count)
estimate_conversation() {
    local messages=${1:-10}
    local avg_tokens_per_msg=500
    echo $((messages * avg_tokens_per_msg))
}

# Full context check
check_context() {
    local project_root="${1:-.}"

    echo ""
    echo -e "${MAGENTA}Analyzing context usage...${NC}"
    echo ""

    # Base context
    local claude_md=0
    local project_state=0
    local agent_estimate=7000

    if [ -f "$project_root/CLAUDE.md" ]; then
        claude_md=$(estimate_file_tokens "$project_root/CLAUDE.md")
    fi

    if [ -f "$project_root/PROJECT-STATE.md" ]; then
        project_state=$(estimate_file_tokens "$project_root/PROJECT-STATE.md")
    fi

    # Estimate conversation (assume 20 turns average)
    local conversation=$(estimate_conversation 20)

    # Total
    local total=$((claude_md + project_state + agent_estimate + conversation))

    echo "Context breakdown:"
    echo ""
    printf "  %-25s %'8d tokens\n" "CLAUDE.md" "$claude_md"
    printf "  %-25s %'8d tokens\n" "PROJECT-STATE.md" "$project_state"
    printf "  %-25s %'8d tokens\n" "Active agent (est.)" "$agent_estimate"
    printf "  %-25s %'8d tokens\n" "Conversation (est. 20 turns)" "$conversation"
    echo "  ─────────────────────────────────────"
    printf "  %-25s %'8d tokens\n" "ESTIMATED TOTAL" "$total"
    echo ""

    show_budget "$total"
}

# Alert check (for hooks)
check_alert() {
    local percent=${1:-0}

    if [ $percent -ge $CRITICAL_THRESHOLD ]; then
        echo -e "${RED}⚠️  CRITICAL: Context at ${percent}%! Run /compact immediately!${NC}"
        return 2
    elif [ $percent -ge $ALERT_THRESHOLD ]; then
        echo -e "${YELLOW}⚠️  ALERT: Context at ${percent}%. Consider running /compact${NC}"
        return 1
    elif [ $percent -ge $WARNING_THRESHOLD ]; then
        echo -e "${YELLOW}ℹ️  WARNING: Context at ${percent}%. Monitor usage.${NC}"
        return 0
    fi

    return 0
}

# Interactive mode
interactive() {
    echo ""
    echo -e "${CYAN}Context Budget Monitor - Interactive Mode${NC}"
    echo ""
    echo "Enter token count or file path to analyze:"
    echo "(or 'q' to quit)"
    echo ""

    while true; do
        read -p "> " input

        case "$input" in
            q|quit|exit)
                break
                ;;
            [0-9]*)
                show_budget "$input"
                ;;
            *)
                if [ -f "$input" ]; then
                    local tokens=$(estimate_file_tokens "$input")
                    echo -e "File: $input"
                    echo -e "Estimated tokens: ${GREEN}$tokens${NC}"
                    echo ""
                else
                    echo "Invalid input. Enter a number or file path."
                fi
                ;;
        esac
    done
}

# Main command handler
case "${1:-check}" in
    check)
        check_context "${2:-.}"
        ;;
    estimate)
        if [ -n "$2" ]; then
            tokens=$(estimate_file_tokens "$2")
            echo -e "File: $2"
            echo -e "Estimated tokens: ${GREEN}$tokens${NC}"
        else
            echo "Usage: $0 estimate FILE"
        fi
        ;;
    budget)
        show_budget "${2:-50000}"
        ;;
    alert)
        check_alert "${2:-0}"
        ;;
    agents)
        show_agent_sizes "${2:-.}"
        ;;
    interactive|i)
        interactive
        ;;
    help|--help|-h)
        echo "Context Budget Monitor v1.0"
        echo ""
        echo "Usage:"
        echo "  $0 check [PROJECT_DIR]     Check current context estimate"
        echo "  $0 estimate FILE           Estimate tokens for file"
        echo "  $0 budget [TOKENS]         Show budget visualization"
        echo "  $0 alert PERCENT           Check if alert needed"
        echo "  $0 agents [PROJECT_DIR]    Show agent token sizes"
        echo "  $0 interactive             Interactive mode"
        echo ""
        echo "Thresholds:"
        echo "  Warning:  ${WARNING_THRESHOLD}%"
        echo "  Alert:    ${ALERT_THRESHOLD}%"
        echo "  Critical: ${CRITICAL_THRESHOLD}%"
        echo ""
        echo "Context limit: ${CONTEXT_LIMIT} tokens"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage"
        exit 1
        ;;
esac
