#!/bin/bash
# TypeScript Status Display for MonoPilot
# Shows current error status and enforcement mode
#
# Usage:
#   ./scripts/type-check-status.sh
#   pnpm type-check:status

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="apps/frontend"
CACHE_DIR="$FRONTEND_DIR/.type-check-cache"

# Source configuration
source "$SCRIPT_DIR/type-check-config.sh"

# ============================================
# COLORS
# ============================================

setup_colors() {
    if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
        RED=$(tput setaf 1 2>/dev/null || echo "")
        GREEN=$(tput setaf 2 2>/dev/null || echo "")
        YELLOW=$(tput setaf 3 2>/dev/null || echo "")
        BLUE=$(tput setaf 4 2>/dev/null || echo "")
        CYAN=$(tput setaf 6 2>/dev/null || echo "")
        BOLD=$(tput bold 2>/dev/null || echo "")
        RESET=$(tput sgr0 2>/dev/null || echo "")
    else
        RED="" GREEN="" YELLOW="" BLUE="" CYAN="" BOLD="" RESET=""
    fi
}

setup_colors

# ============================================
# GET CURRENT ERROR COUNT
# ============================================

get_current_error_count() {
    local trends_file="$CACHE_DIR/error-trends.json"

    if [[ ! -f "$trends_file" ]]; then
        echo "-1"
        return
    fi

    # Get the last total from trends
    local last_entry=$(tail -1 "$trends_file" 2>/dev/null || echo "")

    if [[ -z "$last_entry" ]]; then
        echo "-1"
        return
    fi

    # Extract total using grep/sed (compatible with Git Bash)
    local total=$(echo "$last_entry" | grep -o '"total":[0-9]*' | cut -d: -f2 | head -1)

    if [[ -z "$total" ]]; then
        echo "-1"
    else
        echo "$total"
    fi
}

# ============================================
# PROGRESS BAR
# ============================================

draw_progress_bar() {
    local percentage="$1"
    local width=40
    local filled=$((percentage * width / 100))
    local empty=$((width - filled))

    printf "["
    printf "%${filled}s" | tr ' ' '#'
    printf "%${empty}s" | tr ' ' '-'
    printf "] %d%%" "$percentage"
}

# ============================================
# MAIN DISPLAY
# ============================================

main() {
    echo ""
    echo "${CYAN}${BOLD}+-----------------------------------------------------------+"
    echo "|     TypeScript Enforcement Status                        |"
    echo "+-----------------------------------------------------------+${RESET}"
    echo ""

    local current_errors=$(get_current_error_count)

    # Display current error count
    if [[ "$current_errors" -eq -1 ]]; then
        echo "${YELLOW}Current Errors:${RESET}    Unknown (run 'pnpm type-check:monitor' first)"
        current_errors=$BASELINE_ERRORS  # Use baseline for calculations
    else
        if [[ "$current_errors" -eq 0 ]]; then
            echo "${GREEN}Current Errors:${RESET}    ${GREEN}${BOLD}0${RESET} ${GREEN}(Zero errors!)${RESET}"
        elif [[ "$current_errors" -lt "$STRICT_MODE_THRESHOLD" ]]; then
            echo "${GREEN}Current Errors:${RESET}    ${GREEN}${BOLD}$current_errors${RESET} ${GREEN}(Below threshold!)${RESET}"
        elif [[ "$current_errors" -lt "$BASELINE_ERRORS" ]]; then
            echo "${YELLOW}Current Errors:${RESET}    ${YELLOW}${BOLD}$current_errors${RESET}"
        else
            echo "${RED}Current Errors:${RESET}    ${RED}${BOLD}$current_errors${RESET}"
        fi
    fi

    # Display baseline
    echo "${CYAN}Baseline Errors:${RESET}   $BASELINE_ERRORS (as of initial measurement)"

    # Display errors fixed
    local errors_fixed=$((BASELINE_ERRORS - current_errors))
    if [[ $errors_fixed -gt 0 ]]; then
        echo "${GREEN}Errors Fixed:${RESET}      ${GREEN}+$errors_fixed${RESET}"
    elif [[ $errors_fixed -lt 0 ]]; then
        echo "${RED}Errors Added:${RESET}      ${RED}$errors_fixed${RESET}"
    else
        echo "${YELLOW}Errors Fixed:${RESET}      0"
    fi

    echo ""
    echo "${BOLD}Enforcement Configuration:${RESET}"
    echo "-----------------------------------------------------------"

    # Display current mode
    local mode_desc=$(get_enforcement_mode_description)
    case "$ENFORCEMENT_MODE" in
        warn)
            echo "${YELLOW}Mode:${RESET}              ${YELLOW}$ENFORCEMENT_MODE${RESET} - $mode_desc"
            ;;
        prevent-regression)
            echo "${BLUE}Mode:${RESET}              ${BLUE}$ENFORCEMENT_MODE${RESET} - $mode_desc"
            ;;
        strict)
            echo "${RED}Mode:${RESET}              ${RED}$ENFORCEMENT_MODE${RESET} - $mode_desc"
            ;;
    esac

    echo "${CYAN}Strict Threshold:${RESET}  $STRICT_MODE_THRESHOLD errors (auto-enable strict mode)"

    echo ""
    echo "${BOLD}Progress to Strict Mode:${RESET}"
    echo "-----------------------------------------------------------"

    local percentage=$(get_progress_percentage "$current_errors")
    local errors_remaining=$((current_errors - STRICT_MODE_THRESHOLD))

    if [[ $errors_remaining -le 0 ]]; then
        echo "${GREEN}${BOLD}Ready for strict mode!${RESET}"
        echo ""
        echo "To enable strict mode:"
        echo "  export ENFORCEMENT_MODE=strict"
        echo "  # or edit scripts/type-check-config.sh"
    else
        echo -n "${CYAN}Progress: ${RESET}"
        draw_progress_bar "$percentage"
        echo ""
        echo ""
        echo "Errors to fix before strict mode: ${YELLOW}$errors_remaining${RESET}"
    fi

    echo ""
    echo "${BOLD}Phase Roadmap:${RESET}"
    echo "-----------------------------------------------------------"

    # Phase 1
    if [[ "$ENFORCEMENT_MODE" == "warn" ]]; then
        echo "${GREEN}[CURRENT]${RESET} Phase 1: Warning Mode"
    else
        echo "${GREEN}[DONE]${RESET}    Phase 1: Warning Mode"
    fi
    echo "          - Pre-push shows errors but doesn't block"
    echo "          - CI/CD reports but doesn't fail"
    echo ""

    # Phase 2
    if [[ "$ENFORCEMENT_MODE" == "prevent-regression" ]]; then
        echo "${YELLOW}[CURRENT]${RESET} Phase 2: Prevent Regression"
    elif [[ "$ENFORCEMENT_MODE" == "strict" ]]; then
        echo "${GREEN}[DONE]${RESET}    Phase 2: Prevent Regression"
    else
        echo "${CYAN}[NEXT]${RESET}    Phase 2: Prevent Regression"
    fi
    echo "          - Blocks if error count increases"
    echo "          - Set: export ENFORCEMENT_MODE=prevent-regression"
    echo ""

    # Phase 3
    if [[ "$ENFORCEMENT_MODE" == "strict" ]]; then
        echo "${GREEN}[CURRENT]${RESET} Phase 3: Strict Mode"
    else
        echo "${CYAN}[FUTURE]${RESET}  Phase 3: Strict Mode"
    fi
    echo "          - Blocks all pushes with any errors"
    echo "          - Auto-enables when errors < $STRICT_MODE_THRESHOLD"
    echo ""

    echo "${BOLD}Commands:${RESET}"
    echo "-----------------------------------------------------------"
    echo "  pnpm type-check:monitor   - View current errors"
    echo "  pnpm type-check:full      - View detailed error list"
    echo "  pnpm type-check:status    - This status display"
    echo "  pnpm type-check:report    - Generate HTML report"
    echo ""
}

main "$@"
