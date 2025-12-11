#!/bin/bash
# =============================================================================
# VALIDATE-AGENT.SH - Walidacja struktury agenta
# =============================================================================
# Usage: ./validate-agent.sh <agent-file.md> [--strict]
#        ./validate-agent.sh --all [--strict]
#
# Arguments:
#   agent-file.md  - Path to agent markdown file
#   --all          - Validate all agents in .claude/agents/
#   --strict       - Fail on warnings (not just errors)
#
# Example:
#   ./validate-agent.sh .claude/agents/planning/PM-AGENT.md
#   ./validate-agent.sh --all
#   ./validate-agent.sh --all --strict
# =============================================================================

# Don't use set -e as we handle errors manually

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AGENTS_DIR="$(dirname "$SCRIPT_DIR")/agents"

# Counters
ERRORS=0
WARNINGS=0
PASSED=0
TOTAL_FILES=0

# Strict mode
STRICT_MODE=false

# Required sections in agent files
REQUIRED_SECTIONS=(
    "^---"                           # Frontmatter start
    "^# "                            # Main title
    "<persona>"                      # Persona section
    "## Interface"                   # Interface section
    "## Workflow"                    # Workflow section
    "## Quality Checklist"           # Quality checklist
    "## Error Recovery"              # Error recovery
    "## Handoff Protocols"           # Handoff protocols
)

# Required frontmatter fields
REQUIRED_FRONTMATTER=(
    "name:"
    "description:"
    "type:"
    "tools:"
    "model:"
)

# Recommended sections (warnings if missing)
RECOMMENDED_SECTIONS=(
    "## Common Mistakes"             # or Anti-patterns
    "## Templates"                   # or External References
    "## Output Locations"            # Output file locations
)

# Print header
print_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  AGENT VALIDATOR - Checking agent structure compliance${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Print file header
print_file_header() {
    local file="$1"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Validating: ${CYAN}$file${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Log error
log_error() {
    echo -e "  ${RED}✗ ERROR:${NC} $1"
    ((ERRORS++))
}

# Log warning
log_warning() {
    echo -e "  ${YELLOW}⚠ WARNING:${NC} $1"
    ((WARNINGS++))
}

# Log pass
log_pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED++))
}

# Validate single agent file
validate_agent() {
    local file="$1"
    local file_errors=0
    local file_warnings=0

    print_file_header "$file"

    # Check file exists
    if [ ! -f "$file" ]; then
        log_error "File not found: $file"
        return 1
    fi

    local content
    content=$(cat "$file")

    # ─────────────────────────────────────────────────────────────────────
    # Check frontmatter
    # ─────────────────────────────────────────────────────────────────────
    echo ""
    echo -e "  ${CYAN}Frontmatter:${NC}"

    # Check frontmatter exists
    if ! echo "$content" | head -1 | grep -q "^---"; then
        log_error "Missing YAML frontmatter (must start with ---)"
        ((file_errors++))
    else
        log_pass "Frontmatter present"

        # Extract frontmatter
        local frontmatter
        frontmatter=$(echo "$content" | sed -n '/^---$/,/^---$/p' | head -20)

        # Check required fields
        for field in "${REQUIRED_FRONTMATTER[@]}"; do
            if echo "$frontmatter" | grep -q "$field"; then
                log_pass "Field: $field"
            else
                log_error "Missing frontmatter field: $field"
                ((file_errors++))
            fi
        done

        # Check model value
        local model_value
        model_value=$(echo "$frontmatter" | grep "model:" | sed 's/model:\s*//' | tr -d ' ')
        if [[ -n "$model_value" && ! "$model_value" =~ ^(sonnet|opus|haiku)$ ]]; then
            log_warning "Invalid model value: '$model_value' (expected: sonnet|opus|haiku)"
            ((file_warnings++))
        fi
    fi

    # ─────────────────────────────────────────────────────────────────────
    # Check required sections
    # ─────────────────────────────────────────────────────────────────────
    echo ""
    echo -e "  ${CYAN}Required Sections:${NC}"

    for section in "${REQUIRED_SECTIONS[@]}"; do
        if echo "$content" | grep -qE "$section"; then
            local section_name
            section_name=$(echo "$section" | sed 's/\^//g' | sed 's/\\//g')
            log_pass "Section: $section_name"
        else
            log_error "Missing required section matching: $section"
            ((file_errors++))
        fi
    done

    # ─────────────────────────────────────────────────────────────────────
    # Check recommended sections
    # ─────────────────────────────────────────────────────────────────────
    echo ""
    echo -e "  ${CYAN}Recommended Sections:${NC}"

    for section in "${RECOMMENDED_SECTIONS[@]}"; do
        # Handle "or" alternatives
        if [[ "$section" == *"Common Mistakes"* ]]; then
            if echo "$content" | grep -qE "(## Common Mistakes|## Anti-patterns)"; then
                log_pass "Section: Common Mistakes / Anti-patterns"
            else
                log_warning "Missing recommended section: Common Mistakes / Anti-patterns"
                ((file_warnings++))
            fi
        elif [[ "$section" == *"Templates"* ]]; then
            if echo "$content" | grep -qE "(## Templates|## External References)"; then
                log_pass "Section: Templates / External References"
            else
                log_warning "Missing recommended section: Templates / External References"
                ((file_warnings++))
            fi
        else
            if echo "$content" | grep -qE "$section"; then
                log_pass "Section: $section"
            else
                log_warning "Missing recommended section: $section"
                ((file_warnings++))
            fi
        fi
    done

    # ─────────────────────────────────────────────────────────────────────
    # Check for TODO placeholders
    # ─────────────────────────────────────────────────────────────────────
    echo ""
    echo -e "  ${CYAN}Content Checks:${NC}"

    local todo_count
    todo_count=$(echo "$content" | grep -c "{{TODO" || true)
    if [ "$todo_count" -gt 0 ]; then
        log_warning "Found $todo_count unfilled {{TODO}} placeholders"
        ((file_warnings++))
    else
        log_pass "No unfilled {{TODO}} placeholders"
    fi

    # Check for empty sections (## Header followed by another ## or ---)
    local empty_sections
    empty_sections=$(echo "$content" | grep -cE "^## .+$" || true)
    if [ "$empty_sections" -lt 5 ]; then
        log_warning "Less than 5 main sections found (expected ~8+)"
        ((file_warnings++))
    else
        log_pass "Section count OK ($empty_sections sections)"
    fi

    # Check for critical rules box
    if echo "$content" | grep -qE "(CRITICAL RULES|<critical_rules>|╔════)"; then
        log_pass "Critical rules section present"
    else
        log_warning "Missing critical rules box (╔════ or <critical_rules>)"
        ((file_warnings++))
    fi

    # Check for Input/Output YAML blocks in Interface
    if echo "$content" | grep -qE "### Input.*:"; then
        log_pass "Input interface defined"
    else
        log_error "Missing Input interface definition"
        ((file_errors++))
    fi

    if echo "$content" | grep -qE "### Output.*:"; then
        log_pass "Output interface defined"
    else
        log_error "Missing Output interface definition"
        ((file_errors++))
    fi

    # Check file size (warning if too small or too large)
    local line_count
    line_count=$(wc -l < "$file")
    if [ "$line_count" -lt 100 ]; then
        log_warning "File seems too short ($line_count lines, expected 200+)"
        ((file_warnings++))
    elif [ "$line_count" -gt 800 ]; then
        log_warning "File seems too long ($line_count lines, consider splitting)"
        ((file_warnings++))
    else
        log_pass "File length OK ($line_count lines)"
    fi

    # ─────────────────────────────────────────────────────────────────────
    # Summary for this file
    # ─────────────────────────────────────────────────────────────────────
    echo ""
    if [ "$file_errors" -eq 0 ] && [ "$file_warnings" -eq 0 ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} - No issues found"
    elif [ "$file_errors" -eq 0 ]; then
        echo -e "  ${YELLOW}⚠ PASSED WITH WARNINGS${NC} - $file_warnings warning(s)"
    else
        echo -e "  ${RED}✗ FAILED${NC} - $file_errors error(s), $file_warnings warning(s)"
    fi
    echo ""

    return $file_errors
}

# Print summary
print_summary() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  VALIDATION SUMMARY${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Files validated: ${BLUE}$TOTAL_FILES${NC}"
    echo -e "  Total errors:    ${RED}$ERRORS${NC}"
    echo -e "  Total warnings:  ${YELLOW}$WARNINGS${NC}"
    echo ""

    if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
        echo -e "  ${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "  ${GREEN}  ✓ ALL VALIDATIONS PASSED${NC}"
        echo -e "  ${GREEN}═══════════════════════════════════════════════════════════════${NC}"
        return 0
    elif [ "$ERRORS" -eq 0 ]; then
        echo -e "  ${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "  ${YELLOW}  ⚠ PASSED WITH $WARNINGS WARNING(S)${NC}"
        echo -e "  ${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
        if [ "$STRICT_MODE" = true ]; then
            return 1
        fi
        return 0
    else
        echo -e "  ${RED}═══════════════════════════════════════════════════════════════${NC}"
        echo -e "  ${RED}  ✗ VALIDATION FAILED - $ERRORS ERROR(S)${NC}"
        echo -e "  ${RED}═══════════════════════════════════════════════════════════════${NC}"
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

# Parse arguments
VALIDATE_ALL=false
FILES_TO_VALIDATE=()

for arg in "$@"; do
    case $arg in
        --all)
            VALIDATE_ALL=true
            ;;
        --strict)
            STRICT_MODE=true
            ;;
        --help|-h)
            echo "Usage: $0 <agent-file.md> [--strict]"
            echo "       $0 --all [--strict]"
            echo ""
            echo "Options:"
            echo "  --all     Validate all agents in .claude/agents/"
            echo "  --strict  Fail on warnings (not just errors)"
            echo "  --help    Show this help"
            exit 0
            ;;
        *)
            FILES_TO_VALIDATE+=("$arg")
            ;;
    esac
done

# Validate arguments
if [ "$VALIDATE_ALL" = false ] && [ ${#FILES_TO_VALIDATE[@]} -eq 0 ]; then
    echo -e "${RED}Error: No file specified${NC}"
    echo ""
    echo "Usage: $0 <agent-file.md> [--strict]"
    echo "       $0 --all [--strict]"
    exit 1
fi

print_header

# Get files to validate
if [ "$VALIDATE_ALL" = true ]; then
    while IFS= read -r -d '' file; do
        FILES_TO_VALIDATE+=("$file")
    done < <(find "$AGENTS_DIR" -name "*.md" -type f -print0 | sort -z)

    if [ ${#FILES_TO_VALIDATE[@]} -eq 0 ]; then
        echo -e "${RED}No agent files found in $AGENTS_DIR${NC}"
        exit 1
    fi

    echo -e "Found ${BLUE}${#FILES_TO_VALIDATE[@]}${NC} agent files to validate"
    if [ "$STRICT_MODE" = true ]; then
        echo -e "Mode: ${YELLOW}STRICT${NC} (warnings treated as errors)"
    fi
    echo ""
fi

# Validate each file
EXIT_CODE=0
for file in "${FILES_TO_VALIDATE[@]}"; do
    ((TOTAL_FILES++))
    if ! validate_agent "$file"; then
        EXIT_CODE=1
    fi
done

# Print summary
if ! print_summary; then
    EXIT_CODE=1
fi

echo ""
exit $EXIT_CODE
