#!/bin/bash
# TypeScript Incremental Type Check for MonoPilot
# Fast pre-push check that only validates staged/modified files
#
# Usage:
#   ./scripts/type-check-incremental.sh           # Check staged files (default)
#   ./scripts/type-check-incremental.sh --all     # Force full check
#   ./scripts/type-check-incremental.sh --help    # Show help
#
# Designed to run in <30 seconds for typical commits (5-10 files)

set -e

# ============================================
# CONFIGURATION
# ============================================

FRONTEND_DIR="apps/frontend"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MAX_FILES_FOR_INCREMENTAL=20
FORCE_FULL_CHECK=false

# ============================================
# COLOR SETUP
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

# ============================================
# HELPER FUNCTIONS
# ============================================

show_help() {
    cat << EOF
TypeScript Incremental Type Check

Usage: $0 [OPTIONS]

Options:
  --all       Force full type check (bypass incremental)
  --help      Show this help message

Description:
  Fast type checking for pre-push hooks. Only checks staged TypeScript files
  unless configuration files changed or too many files are staged.

  Target execution time: <30 seconds for typical commits

Triggers for full check:
  - tsconfig.json or package.json modified
  - More than $MAX_FILES_FOR_INCREMENTAL files staged
  - --all flag provided

Exit codes:
  0  - All type checks passed
  1  - Type errors found
  2  - Script error / invalid usage

Examples:
  $0              # Quick check staged files
  $0 --all        # Full project check

EOF
    exit 0
}

print_header() {
    echo ""
    echo "${CYAN}${BOLD}Quick TypeScript Check (Pre-Push)${RESET}"
    echo "${CYAN}--------------------------------------------${RESET}"
    echo ""
}

print_footer() {
    local total_errors=$1
    local file_count=$2

    echo ""
    echo "${BOLD}--------------------------------------------${RESET}"

    if [[ $total_errors -eq 0 ]]; then
        echo "${GREEN}${BOLD}All $file_count files passed type check${RESET}"
    else
        echo "${RED}${BOLD}Found $total_errors TypeScript errors in staged files${RESET}"
    fi

    echo ""
    echo "${BLUE}This is a quick check. Full validation runs in CI/CD.${RESET}"
    echo "${BLUE}Run full check locally: pnpm type-check:monitor${RESET}"
    echo ""
}

# ============================================
# FILE DETECTION
# ============================================

get_staged_ts_files() {
    # Get staged TypeScript files (Added, Copied, Modified)
    # Also include unstaged modified files for comprehensive check
    local staged_files

    cd "$PROJECT_ROOT" || exit 2

    # Get staged files
    staged_files=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null | grep -E '\.(ts|tsx)$' || true)

    # Also get unstaged modified files (in case someone forgot to stage)
    local modified_files
    modified_files=$(git diff --name-only --diff-filter=M 2>/dev/null | grep -E '\.(ts|tsx)$' || true)

    # Combine and deduplicate
    echo "$staged_files"$'\n'"$modified_files" | grep -v '^$' | sort -u || true
}

check_config_files_changed() {
    cd "$PROJECT_ROOT" || exit 2

    # Check if any config files are staged that require full check
    local config_changed
    config_changed=$(git diff --cached --name-only 2>/dev/null | grep -E '(tsconfig\.json|package\.json|pnpm-lock\.yaml)$' || true)

    if [[ -n "$config_changed" ]]; then
        echo "true"
    else
        echo "false"
    fi
}

filter_frontend_files() {
    local files="$1"

    # Filter to only frontend files and make paths relative to frontend dir
    echo "$files" | while read -r file; do
        if [[ "$file" == apps/frontend/* ]]; then
            # Strip the apps/frontend/ prefix for tsc
            echo "${file#apps/frontend/}"
        fi
    done | grep -v '^$' || true
}

# ============================================
# TYPE CHECKING
# ============================================

create_temp_tsconfig() {
    local files="$1"
    local temp_config="$PROJECT_ROOT/$FRONTEND_DIR/tsconfig.incremental.json"

    # Build JSON array of files
    local files_json=""
    local first=true

    while IFS= read -r file; do
        [[ -z "$file" ]] && continue
        if [[ "$first" == "true" ]]; then
            files_json="\"$file\""
            first=false
        else
            files_json="$files_json, \"$file\""
        fi
    done <<< "$files"

    # Create temporary tsconfig that extends the main one
    cat > "$temp_config" << EOF
{
  "extends": "./tsconfig.json",
  "include": [
    "next-env.d.ts",
    $files_json
  ],
  "exclude": [
    "node_modules",
    "__tests__/**/*"
  ]
}
EOF

    echo "$temp_config"
}

cleanup_temp_config() {
    local temp_config="$PROJECT_ROOT/$FRONTEND_DIR/tsconfig.incremental.json"
    rm -f "$temp_config" 2>/dev/null || true
}

run_incremental_check() {
    local files="$1"
    local file_count
    file_count=$(echo "$files" | grep -c '^' || echo "0")

    echo "Checking ${BOLD}$file_count${RESET} staged TypeScript files..."
    echo ""

    # List files being checked
    echo "${BLUE}Files to check:${RESET}"
    echo "$files" | while read -r file; do
        [[ -z "$file" ]] && continue
        echo "  - $file"
    done
    echo ""

    # Create temporary tsconfig with only the staged files
    local temp_config
    temp_config=$(create_temp_tsconfig "$files")

    # Ensure cleanup on exit
    trap cleanup_temp_config EXIT

    cd "$PROJECT_ROOT/$FRONTEND_DIR" || exit 2

    # Run type check with temporary config
    local output
    local exit_code=0
    local start_time
    start_time=$(date +%s)

    echo "${BLUE}Running TypeScript compiler...${RESET}"
    echo ""

    set +e
    output=$(npx tsc --noEmit --pretty false --project tsconfig.incremental.json 2>&1)
    exit_code=$?
    set -e

    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Count errors (only in our files, not dependencies)
    local total_errors=0
    local our_errors=""

    if [[ $exit_code -ne 0 ]]; then
        # Filter errors to only those in our staged files
        while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            # Get errors for this file
            local file_errors
            file_errors=$(echo "$output" | grep "^$file" || true)
            if [[ -n "$file_errors" ]]; then
                our_errors="$our_errors$file_errors"$'\n'
                local count
                count=$(echo "$file_errors" | grep -c "error TS" || echo "0")
                total_errors=$((total_errors + count))
            fi
        done <<< "$files"
    fi

    # Show results
    if [[ $total_errors -eq 0 ]]; then
        echo "${GREEN}No errors found in staged files!${RESET}"
        echo "${CYAN}(Completed in ${duration}s)${RESET}"
    else
        echo "${RED}${BOLD}Found $total_errors errors in staged files:${RESET}"
        echo ""

        # Show errors grouped by file
        while IFS= read -r file; do
            [[ -z "$file" ]] && continue
            local file_errors
            file_errors=$(echo "$output" | grep "^$file" || true)
            if [[ -n "$file_errors" ]]; then
                local count
                count=$(echo "$file_errors" | grep -c "error TS" || echo "0")
                echo "${RED}$file${RESET} ($count errors):"

                # Show first 5 errors for this file
                echo "$file_errors" | head -5 | while read -r line; do
                    # Extract error code and message
                    local msg
                    msg=$(echo "$line" | sed 's/.*error TS[0-9]*: /  /')
                    echo "  $msg"
                done

                local shown=5
                if [[ $count -gt $shown ]]; then
                    echo "  ... and $((count - shown)) more errors"
                fi
                echo ""
            fi
        done <<< "$files"

        echo "${CYAN}(Completed in ${duration}s)${RESET}"
    fi

    # Print footer
    print_footer "$total_errors" "$file_count"

    # Cleanup
    cleanup_temp_config

    if [[ $total_errors -gt 0 ]]; then
        return 1
    fi
    return 0
}

run_full_check() {
    local reason="$1"

    echo "${YELLOW}Running full type check: $reason${RESET}"
    echo ""

    # Delegate to the full monitor script in summary mode
    if [[ -x "$SCRIPT_DIR/type-check-monitor.sh" ]]; then
        "$SCRIPT_DIR/type-check-monitor.sh" summary
        return $?
    else
        # Fallback to direct tsc
        cd "$PROJECT_ROOT/$FRONTEND_DIR" || exit 2
        npx tsc --noEmit
        return $?
    fi
}

# ============================================
# MAIN
# ============================================

main() {
    setup_colors

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --all)
                FORCE_FULL_CHECK=true
                shift
                ;;
            --help|-h)
                show_help
                ;;
            *)
                echo "${RED}Unknown option: $1${RESET}"
                echo "Use --help for usage information"
                exit 2
                ;;
        esac
    done

    print_header

    # Check if forced full check
    if [[ "$FORCE_FULL_CHECK" == "true" ]]; then
        run_full_check "--all flag provided"
        exit $?
    fi

    # Check for config file changes
    local config_changed
    config_changed=$(check_config_files_changed)

    if [[ "$config_changed" == "true" ]]; then
        run_full_check "Configuration files modified (tsconfig.json/package.json)"
        exit $?
    fi

    # Get staged TypeScript files
    local all_ts_files
    all_ts_files=$(get_staged_ts_files)

    # Filter to frontend files only
    local frontend_files
    frontend_files=$(filter_frontend_files "$all_ts_files")

    # Count files
    local file_count=0
    if [[ -n "$frontend_files" ]]; then
        file_count=$(echo "$frontend_files" | grep -c '^' || echo "0")
    fi

    # Check if no files to check
    if [[ $file_count -eq 0 ]]; then
        echo "${GREEN}No TypeScript files staged for commit.${RESET}"
        echo ""
        echo "${BLUE}Nothing to check. You may proceed with push.${RESET}"
        echo ""
        exit 0
    fi

    # Check if too many files (trigger full check)
    if [[ $file_count -gt $MAX_FILES_FOR_INCREMENTAL ]]; then
        run_full_check "More than $MAX_FILES_FOR_INCREMENTAL files changed ($file_count files)"
        exit $?
    fi

    # Run incremental check
    run_incremental_check "$frontend_files"
    exit $?
}

main "$@"
