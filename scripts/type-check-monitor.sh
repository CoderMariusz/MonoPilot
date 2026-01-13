#!/bin/bash
# TypeScript Error Monitor for MonoPilot
# Comprehensive TypeScript error detection and categorization
#
# Usage:
#   ./scripts/type-check-monitor.sh           # Summary mode (default)
#   ./scripts/type-check-monitor.sh full      # Full detailed output
#   ./scripts/type-check-monitor.sh json      # JSON output for automation
#   ./scripts/type-check-monitor.sh ci        # CI/CD mode (GitHub Actions)
#
# Version: 2.0.0
# Changes:
#   - Comprehensive error handling
#   - Proper JSON escaping
#   - SCRIPT_DIR-based path handling
#   - Improved categorization with warnings

set -e

# ============================================
# SCRIPT DIRECTORY DETECTION
# ============================================

# Get the directory where this script is located
# Works from any directory the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ============================================
# CONFIGURATION
# ============================================

FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"
CACHE_DIR="$FRONTEND_DIR/.type-check-cache"
OUTPUT_MODE="${1:-summary}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S 2>/dev/null || date +%Y%m%d_%H%M%S)

# Error categories with patterns and priorities
declare -A ERROR_PATTERNS=(
    ["missing_props"]="is missing the following properties|Property .* does not exist on type"
    ["test_promise"]="Object literal may only specify known properties.*Promise|does not exist in type 'Promise"
    ["type_mismatch"]="Type .* is not assignable to type"
    ["missing_import"]="Cannot find module|Cannot find name"
    ["missing_export"]="has no exported member|Module .* has no exported member|no exported member named"
    ["missing_file"]="File .* is not a module|File .* was not found|is not a module"
    ["implicit_any"]="implicitly has an 'any' type"
    ["null_safety"]="Type .* \| null' is not assignable|Object is possibly 'null'|Object is possibly 'undefined'|is possibly 'undefined'"
    ["callable"]="This expression is not callable"
    ["void_check"]="cannot be tested for truthiness|void.*cannot be"
    ["overload"]="No overload matches this call"
    ["schema_validation"]="Argument of type .* is not assignable to parameter"
    ["unused_vars"]="is declared but its value is never read|is declared but never used"
    ["readonly_violation"]="Cannot assign to .* because it is a read-only property"
    ["generic_error"]="Type argument .* is not assignable|Generic type .* requires"
    ["index_signature"]="Element implicitly has an 'any' type because|No index signature"
)

declare -A PRIORITY_MAP=(
    ["missing_props"]="HIGH"
    ["type_mismatch"]="HIGH"
    ["missing_import"]="HIGH"
    ["missing_export"]="HIGH"
    ["missing_file"]="HIGH"
    ["test_promise"]="MEDIUM"
    ["schema_validation"]="MEDIUM"
    ["generic_error"]="MEDIUM"
    ["void_check"]="MEDIUM"
    ["overload"]="MEDIUM"
    ["null_safety"]="LOW"
    ["implicit_any"]="LOW"
    ["callable"]="LOW"
    ["unused_vars"]="LOW"
    ["readonly_violation"]="LOW"
    ["index_signature"]="LOW"
)

# ============================================
# COLOR SETUP
# ============================================

setup_colors() {
    # Check if output is a terminal and tput is available
    if [[ -t 1 ]] && command -v tput >/dev/null 2>&1; then
        RED=$(tput setaf 1 2>/dev/null || echo "")
        GREEN=$(tput setaf 2 2>/dev/null || echo "")
        YELLOW=$(tput setaf 3 2>/dev/null || echo "")
        BLUE=$(tput setaf 4 2>/dev/null || echo "")
        MAGENTA=$(tput setaf 5 2>/dev/null || echo "")
        CYAN=$(tput setaf 6 2>/dev/null || echo "")
        BOLD=$(tput bold 2>/dev/null || echo "")
        RESET=$(tput sgr0 2>/dev/null || echo "")
    else
        # Fallback for non-tty or Windows without tput
        RED="" GREEN="" YELLOW="" BLUE="" MAGENTA="" CYAN="" BOLD="" RESET=""
    fi
}

# ============================================
# ERROR HANDLING FUNCTIONS
# ============================================

log_error() {
    echo "${RED}ERROR:${RESET} $1" >&2
}

log_warn() {
    echo "${YELLOW}WARNING:${RESET} $1" >&2
}

log_info() {
    echo "${BLUE}INFO:${RESET} $1"
}

# Check prerequisites before running
check_prerequisites() {
    local errors=0

    # Check if npx is available
    if ! command -v npx >/dev/null 2>&1; then
        log_error "npx is not installed or not in PATH"
        log_error "Please install Node.js and npm first"
        errors=$((errors + 1))
    fi

    # Check if frontend directory exists
    if [[ ! -d "$FRONTEND_DIR" ]]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        log_error "Please run this script from the MonoPilot project root"
        errors=$((errors + 1))
    fi

    # Check if TypeScript config exists
    if [[ ! -f "$FRONTEND_DIR/tsconfig.json" ]]; then
        log_error "tsconfig.json not found in: $FRONTEND_DIR"
        errors=$((errors + 1))
    fi

    return $errors
}

# Check write permissions for cache directory
check_write_permissions() {
    local parent_dir
    parent_dir=$(dirname "$CACHE_DIR")

    if [[ ! -d "$parent_dir" ]]; then
        log_error "Parent directory does not exist: $parent_dir"
        return 1
    fi

    # Try to create cache directory
    if ! mkdir -p "$CACHE_DIR" 2>/dev/null; then
        log_error "Cannot create cache directory: $CACHE_DIR"
        log_error "Check write permissions for: $parent_dir"
        return 1
    fi

    # Check if we can write to it
    local test_file="$CACHE_DIR/.write-test-$$"
    if ! touch "$test_file" 2>/dev/null; then
        log_error "Cannot write to cache directory: $CACHE_DIR"
        return 1
    fi
    rm -f "$test_file"

    return 0
}

# Check available disk space (basic check)
check_disk_space() {
    # Try to get available space using df
    # This is a basic check - skip if df is not available
    if command -v df >/dev/null 2>&1; then
        local available
        available=$(df -k "$CACHE_DIR" 2>/dev/null | tail -1 | awk '{print $4}')
        if [[ -n "$available" && "$available" =~ ^[0-9]+$ ]]; then
            # Require at least 10MB free (10240 KB)
            if [[ "$available" -lt 10240 ]]; then
                log_warn "Low disk space: only ${available}KB available"
            fi
        fi
    fi
    return 0
}

# ============================================
# JSON HELPER FUNCTIONS
# ============================================

# Escape a string for JSON output
# Handles: backslash, double quote, newline, carriage return, tab
json_escape() {
    local input="$1"
    local output=""
    local i char

    # Process character by character
    for ((i=0; i<${#input}; i++)); do
        char="${input:i:1}"
        case "$char" in
            \\) output+="\\\\" ;;
            '"') output+="\\\"" ;;
            $'\n') output+="\\n" ;;
            $'\r') output+="\\r" ;;
            $'\t') output+="\\t" ;;
            *)
                # Check for control characters (ASCII 0-31)
                local ord
                ord=$(printf '%d' "'$char" 2>/dev/null || echo 0)
                if [[ $ord -lt 32 && $ord -ge 0 ]]; then
                    # Escape as \uXXXX
                    output+=$(printf '\\u%04x' "$ord")
                else
                    output+="$char"
                fi
                ;;
        esac
    done

    echo -n "$output"
}

# Validate JSON structure (basic validation without jq)
validate_json() {
    local json_file="$1"

    if [[ ! -f "$json_file" ]]; then
        log_error "JSON file does not exist: $json_file"
        return 1
    fi

    local content
    content=$(cat "$json_file")

    # Check if it starts and ends with proper brackets
    if [[ ! "$content" =~ ^\[.*\]$ ]]; then
        log_error "Invalid JSON structure: does not start/end with []"
        return 1
    fi

    # Check for balanced braces (basic check)
    local open_braces close_braces
    open_braces=$(echo "$content" | tr -cd '{' | wc -c)
    close_braces=$(echo "$content" | tr -cd '}' | wc -c)

    if [[ "$open_braces" -ne "$close_braces" ]]; then
        log_error "Invalid JSON: unbalanced braces (open: $open_braces, close: $close_braces)"
        return 1
    fi

    # Check for balanced brackets
    local open_brackets close_brackets
    open_brackets=$(echo "$content" | tr -cd '[' | wc -c)
    close_brackets=$(echo "$content" | tr -cd ']' | wc -c)

    if [[ "$open_brackets" -ne "$close_brackets" ]]; then
        log_error "Invalid JSON: unbalanced brackets (open: $open_brackets, close: $close_brackets)"
        return 1
    fi

    return 0
}

# ============================================
# CACHE FUNCTIONS
# ============================================

init_cache() {
    # Check write permissions first
    if ! check_write_permissions; then
        return 1
    fi

    # Check disk space
    check_disk_space

    # Initialize error trends file if doesn't exist
    if [[ ! -f "$CACHE_DIR/error-trends.json" ]]; then
        echo "[]" > "$CACHE_DIR/error-trends.json"
    fi

    return 0
}

# ============================================
# TYPECHECK FUNCTIONS
# ============================================

run_typecheck() {
    # Status messages go to stderr so they don't mix with the file path output
    echo "${BLUE}${BOLD}Running TypeScript compilation...${RESET}" >&2
    echo "" >&2

    local original_dir
    original_dir=$(pwd)

    cd "$FRONTEND_DIR" || {
        log_error "Cannot change to frontend directory: $FRONTEND_DIR"
        return 1
    }

    # Capture both stdout and stderr, preserve exit code
    local output_file="$CACHE_DIR/tsc-output-$TIMESTAMP.txt"
    set +e
    npx tsc --noEmit --pretty false > "$output_file" 2>&1
    local exit_code=$?
    set -e

    cd "$original_dir" || {
        log_error "Cannot return to original directory: $original_dir"
        return 1
    }

    # Check if output file was created
    if [[ ! -f "$output_file" ]]; then
        log_error "TypeScript output file was not created"
        return 1
    fi

    # Only the file path goes to stdout
    echo "$output_file"
    return $exit_code
}

# ============================================
# ERROR CATEGORIZATION
# ============================================

categorize_errors() {
    local output_file="$1"
    local temp_categorized="$CACHE_DIR/categorized-$TIMESTAMP.json"

    # Status messages go to stderr so they don't mix with file path output
    echo "${BLUE}Analyzing errors...${RESET}" >&2
    echo "" >&2

    if [[ ! -f "$output_file" ]]; then
        log_error "Output file does not exist: $output_file"
        echo "[]" > "$temp_categorized"
        echo "$temp_categorized"
        return 1
    fi

    # Build JSON array
    local errors_json="["
    local first=true
    local error_count=0
    local uncategorized_count=0
    local line_number=0

    while IFS= read -r line || [[ -n "$line" ]]; do
        line_number=$((line_number + 1))

        # Strip carriage return (Windows line endings)
        line="${line%$'\r'}"

        # Match TypeScript error pattern: file(line,col): error TS####: message
        # Using a more portable pattern matching approach
        if [[ "$line" =~ ^(.+)\(([0-9]+),([0-9]+)\):[[:space:]]*error[[:space:]]+TS([0-9]+):[[:space:]]*(.*)$ ]]; then
            local file="${BASH_REMATCH[1]}"
            local line_num="${BASH_REMATCH[2]}"
            local col="${BASH_REMATCH[3]}"
            local ts_code="${BASH_REMATCH[4]}"
            local message="${BASH_REMATCH[5]}"

            # Also strip any trailing CR from message
            message="${message%$'\r'}"

            # Categorize by pattern matching
            local category="uncategorized"
            local priority="MEDIUM"  # Default to MEDIUM for uncategorized

            for cat in "${!ERROR_PATTERNS[@]}"; do
                if [[ "$message" =~ ${ERROR_PATTERNS[$cat]} ]]; then
                    category="$cat"
                    priority="${PRIORITY_MAP[$cat]}"
                    break
                fi
            done

            if [[ "$category" == "uncategorized" ]]; then
                uncategorized_count=$((uncategorized_count + 1))
            fi

            # Escape strings for JSON
            local escaped_message escaped_file
            escaped_message=$(json_escape "$message")
            escaped_file=$(json_escape "$file")

            # Add comma for all entries after the first
            [[ "$first" == false ]] && errors_json+=","
            first=false

            # Build JSON object
            errors_json+="{\"file\":\"$escaped_file\",\"line\":$line_num,\"col\":$col,\"code\":\"TS$ts_code\",\"message\":\"$escaped_message\",\"category\":\"$category\",\"priority\":\"$priority\"}"
            error_count=$((error_count + 1))
        fi
    done < "$output_file"

    errors_json+="]"

    # Save to file
    echo "$errors_json" > "$temp_categorized"

    # Validate the generated JSON
    if ! validate_json "$temp_categorized"; then
        log_error "Generated JSON is invalid, creating empty array"
        echo "[]" > "$temp_categorized"
    fi

    # Warn if too many uncategorized errors
    if [[ $error_count -gt 0 ]]; then
        local uncategorized_percent=$((uncategorized_count * 100 / error_count))
        if [[ $uncategorized_percent -gt 10 ]]; then
            log_warn "$uncategorized_count errors ($uncategorized_percent%) are uncategorized"
            log_warn "Consider adding new patterns to ERROR_PATTERNS"

            # Show sample uncategorized errors for pattern development
            if [[ "$OUTPUT_MODE" != "json" ]]; then
                echo "" >&2
                echo "${YELLOW}Sample uncategorized errors (first 3):${RESET}" >&2
                grep '"category":"uncategorized"' "$temp_categorized" 2>/dev/null | \
                    head -3 | \
                    sed 's/.*"message":"\([^"]*\)".*/  - \1/' >&2 || true
            fi
        fi
    fi

    echo "$temp_categorized"
}

# ============================================
# COUNTING FUNCTIONS
# ============================================

count_category() {
    local categorized_file="$1"
    local category="$2"
    grep -o "\"category\":\"$category\"" "$categorized_file" 2>/dev/null | wc -l | tr -d ' '
}

count_priority() {
    local categorized_file="$1"
    local priority="$2"
    grep -o "\"priority\":\"$priority\"" "$categorized_file" 2>/dev/null | wc -l | tr -d ' '
}

# ============================================
# OUTPUT FUNCTIONS
# ============================================

generate_summary() {
    local categorized_file="$1"

    echo ""
    echo "${BOLD}======================================================${RESET}"
    echo "${BOLD}         TypeScript Error Summary${RESET}"
    echo "${BOLD}======================================================${RESET}"
    echo ""

    # Count total errors
    local total_errors
    total_errors=$(grep -o '"category"' "$categorized_file" 2>/dev/null | wc -l | tr -d ' ')

    if [[ "$total_errors" -eq 0 ]]; then
        echo "${GREEN}${BOLD}No TypeScript errors found!${RESET}"
        echo ""
        return 0
    fi

    echo "${CYAN}Total Errors: ${BOLD}$total_errors${RESET}"
    echo ""

    # Category breakdown
    echo "${BOLD}By Category:${RESET}"
    echo "----------------------------------------------------"

    for category in "${!ERROR_PATTERNS[@]}"; do
        local count
        count=$(count_category "$categorized_file" "$category")
        if [[ $count -gt 0 ]]; then
            local priority="${PRIORITY_MAP[$category]}"
            local color="$YELLOW"
            [[ "$priority" == "HIGH" ]] && color="$RED"
            [[ "$priority" == "LOW" ]] && color="$GREEN"

            printf "  ${color}%-20s${RESET} %3d  [%s]\n" "$category" "$count" "$priority"
        fi
    done

    # Check for uncategorized errors
    local uncategorized
    uncategorized=$(count_category "$categorized_file" "uncategorized")
    if [[ $uncategorized -gt 0 ]]; then
        printf "  ${MAGENTA}%-20s${RESET} %3d  [UNKNOWN]\n" "uncategorized" "$uncategorized"
    fi

    echo ""

    # Top 10 files with most errors
    echo "${BOLD}Top 10 Files with Errors:${RESET}"
    echo "----------------------------------------------------"

    grep -o '"file":"[^"]*"' "$categorized_file" 2>/dev/null | \
        sed 's/"file":"//g;s/"//g' | \
        sort | uniq -c | sort -rn | head -10 | \
        while read -r count file; do
            # Simplify path for display (remove common prefix)
            local short_file
            short_file=$(echo "$file" | sed 's|.*apps/frontend/||;s|.*MonoPilot/apps/frontend/||')
            printf "  ${RED}%3d${RESET} errors - %s\n" "$count" "$short_file"
        done

    echo ""

    # Priority breakdown
    echo "${BOLD}By Priority:${RESET}"
    echo "----------------------------------------------------"

    local high_count med_count low_count
    high_count=$(count_priority "$categorized_file" "HIGH")
    med_count=$(count_priority "$categorized_file" "MEDIUM")
    low_count=$(count_priority "$categorized_file" "LOW")

    printf "  ${RED}HIGH${RESET}    %3d errors (address first)\n" "$high_count"
    printf "  ${YELLOW}MEDIUM${RESET}  %3d errors (address next)\n" "$med_count"
    printf "  ${GREEN}LOW${RESET}     %3d errors (address last)\n" "$low_count"

    echo ""
    echo "${BOLD}======================================================${RESET}"
}

save_trends() {
    local categorized_file="$1"
    local total_errors
    total_errors=$(grep -o '"category"' "$categorized_file" 2>/dev/null | wc -l | tr -d ' ')

    # Create trend entry with proper escaping
    local iso_timestamp
    iso_timestamp=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)
    local trend_entry="{\"timestamp\":\"$iso_timestamp\",\"total\":$total_errors,\"file\":\"categorized-$TIMESTAMP.json\"}"

    # Read existing trends
    local trends_file="$CACHE_DIR/error-trends.json"
    local existing
    existing=$(cat "$trends_file" 2>/dev/null || echo "[]")

    # Validate existing trends
    if [[ ! "$existing" =~ ^\[.*\]$ ]]; then
        log_warn "Trends file corrupted, resetting"
        existing="[]"
    fi

    # Append new entry
    if [[ "$existing" == "[]" ]]; then
        echo "[$trend_entry]" > "$trends_file"
    else
        # Remove trailing ] and add new entry
        echo "${existing%]},${trend_entry}]" > "$trends_file"
    fi
}

show_full_output() {
    local categorized_file="$1"

    echo ""
    echo "${BOLD}Full Error List by Priority:${RESET}"
    echo "======================================================"
    echo ""

    # HIGH priority errors
    local high_count
    high_count=$(count_priority "$categorized_file" "HIGH")
    if [[ $high_count -gt 0 ]]; then
        echo "${RED}${BOLD}HIGH Priority Errors ($high_count):${RESET}"
        echo "------------------------------------------------------"
        grep '"priority":"HIGH"' "$categorized_file" 2>/dev/null | \
            sed 's/.*"file":"\([^"]*\)".*"line":\([^,]*\).*"message":"\([^"]*\)".*/  \1:\2 - \3/' | \
            head -50
        echo ""
    fi

    # MEDIUM priority errors
    local med_count
    med_count=$(count_priority "$categorized_file" "MEDIUM")
    if [[ $med_count -gt 0 ]]; then
        echo "${YELLOW}${BOLD}MEDIUM Priority Errors ($med_count):${RESET}"
        echo "------------------------------------------------------"
        grep '"priority":"MEDIUM"' "$categorized_file" 2>/dev/null | \
            sed 's/.*"file":"\([^"]*\)".*"line":\([^,]*\).*"message":"\([^"]*\)".*/  \1:\2 - \3/' | \
            head -30
        echo ""
    fi

    # LOW priority errors (summary only)
    local low_count
    low_count=$(count_priority "$categorized_file" "LOW")
    if [[ $low_count -gt 0 ]]; then
        echo "${GREEN}${BOLD}LOW Priority Errors ($low_count):${RESET}"
        echo "------------------------------------------------------"
        echo "  Use 'json' mode to see full list"
        echo ""
    fi
}

generate_json_output() {
    local categorized_file="$1"

    # Validate before output
    if validate_json "$categorized_file"; then
        cat "$categorized_file"
    else
        echo "[]"
        return 1
    fi
}

show_ci_output() {
    local categorized_file="$1"
    local total_errors
    total_errors=$(grep -o '"category"' "$categorized_file" 2>/dev/null | wc -l | tr -d ' ')

    echo "::group::TypeScript Errors Summary"
    generate_summary "$categorized_file"
    echo "::endgroup::"

    if [[ $total_errors -gt 0 ]]; then
        echo "::error::Found $total_errors TypeScript errors"
        return 1
    else
        echo "::notice::No TypeScript errors found"
        return 0
    fi
}

show_help() {
    cat <<EOF
TypeScript Error Monitor for MonoPilot

Usage:
  $0 [mode]

Modes:
  summary   Summary of errors by category and priority (default)
  full      Detailed output with individual errors listed
  json      JSON output for automation/tooling
  ci        GitHub Actions compatible output
  help      Show this help message

Examples:
  $0                # Run with summary mode
  $0 full           # Run with full details
  $0 json > errors.json  # Export to JSON

Environment:
  Script location: $SCRIPT_DIR
  Project root: $PROJECT_ROOT
  Frontend dir: $FRONTEND_DIR
  Cache dir: $CACHE_DIR
EOF
}

# ============================================
# MAIN EXECUTION
# ============================================

main() {
    setup_colors

    # Handle help mode
    if [[ "$OUTPUT_MODE" == "help" || "$OUTPUT_MODE" == "--help" || "$OUTPUT_MODE" == "-h" ]]; then
        show_help
        return 0
    fi

    # Validate output mode
    case "$OUTPUT_MODE" in
        summary|full|json|ci) ;;
        *)
            log_error "Unknown output mode: $OUTPUT_MODE"
            echo "Valid modes: summary, full, json, ci, help"
            return 1
            ;;
    esac

    # Check prerequisites
    if ! check_prerequisites; then
        log_error "Prerequisites check failed"
        return 1
    fi

    # Initialize cache
    if ! init_cache; then
        log_error "Failed to initialize cache"
        return 1
    fi

    # Banner goes to stderr so it doesn't pollute JSON output
    echo "${CYAN}${BOLD}+=====================================================+${RESET}" >&2
    echo "${CYAN}${BOLD}|   MonoPilot TypeScript Error Monitor              |${RESET}" >&2
    echo "${CYAN}${BOLD}+=====================================================+${RESET}" >&2
    echo "" >&2

    # Run TypeScript compilation
    local output_file
    set +e
    output_file=$(run_typecheck)
    local tsc_exit=$?
    set -e

    # Check if run_typecheck returned a valid file
    if [[ -z "$output_file" || ! -f "$output_file" ]]; then
        log_error "TypeScript check failed to produce output"
        return 1
    fi

    # Warn if tsc exited with error but no output
    local output_lines
    output_lines=$(wc -l < "$output_file" | tr -d ' ')
    if [[ $tsc_exit -ne 0 && $output_lines -eq 0 ]]; then
        log_warn "TypeScript exited with error code $tsc_exit but produced no output"
        log_warn "This may indicate a configuration error"
    fi

    # Categorize errors
    local categorized_file
    categorized_file=$(categorize_errors "$output_file")

    # Verify categorization produced results
    local error_count
    error_count=$(grep -o '"category"' "$categorized_file" 2>/dev/null | wc -l | tr -d ' ')

    # Check for mismatch between tsc exit code and parsed errors
    if [[ $tsc_exit -ne 0 && $error_count -eq 0 && $output_lines -gt 0 ]]; then
        log_warn "TypeScript reported errors but none were parsed"
        log_warn "Check if error format matches expected pattern"
        log_warn "First few lines of output:"
        head -5 "$output_file" | while read -r line; do
            echo "  $line"
        done
    fi

    # Save trends (only if we have valid data)
    if validate_json "$categorized_file"; then
        save_trends "$categorized_file"
    fi

    # Output based on mode
    case "$OUTPUT_MODE" in
        summary)
            generate_summary "$categorized_file"
            ;;
        full)
            generate_summary "$categorized_file"
            show_full_output "$categorized_file"
            ;;
        json)
            generate_json_output "$categorized_file"
            ;;
        ci)
            show_ci_output "$categorized_file"
            return $?
            ;;
    esac

    # Return TypeScript exit code
    return $tsc_exit
}

main "$@"
