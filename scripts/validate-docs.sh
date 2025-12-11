#!/bin/bash
# Validate Documentation Structure
# Checks all required files, folders, and references in the Agent Methodology Pack
#
# Usage:
#   bash scripts/validate-docs.sh                    # Validate current directory
#   bash scripts/validate-docs.sh --path /my/project # Validate specific path
#
# Author: Agent Methodology Pack
# Version: 2.0 (Added --path parameter for target project)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERROR_COUNT=0
WARNING_COUNT=0
SUCCESS_COUNT=0

# Parse arguments
TARGET_PATH="."
while [[ $# -gt 0 ]]; do
    case $1 in
        --path)
            TARGET_PATH="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --path PATH    Path to project to validate (default: current directory)"
            echo "  -h, --help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                          # Validate current directory"
            echo "  $0 --path /path/to/project  # Validate specific project"
            echo "  $0 --path ..                # Validate parent directory"
            exit 0
            ;;
        *)
            echo "Unknown argument: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Resolve to absolute path
TARGET_PATH="$(cd "$TARGET_PATH" 2>/dev/null && pwd)"
if [ -z "$TARGET_PATH" ]; then
    echo -e "${RED}ERROR: Invalid path${NC}"
    exit 1
fi

# Helper functions
print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERROR_COUNT++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNING_COUNT++))
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((SUCCESS_COUNT++))
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if file exists (relative to TARGET_PATH)
check_file() {
    local file="$TARGET_PATH/$1"
    local description="$2"

    if [ -f "$file" ]; then
        print_success "$description exists"
        return 0
    else
        print_error "$description missing: $1"
        return 1
    fi
}

# Check if directory exists (relative to TARGET_PATH)
check_dir() {
    local dir="$TARGET_PATH/$1"
    local description="$2"

    if [ -d "$dir" ]; then
        print_success "$description exists"
        return 0
    else
        print_error "$description missing: $1"
        return 1
    fi
}

# Count lines in file
count_lines() {
    local file="$TARGET_PATH/$1"
    if [ -f "$file" ]; then
        wc -l < "$file" | tr -d ' '
    else
        echo "0"
    fi
}

# Extract @references from a file
extract_references() {
    local file="$TARGET_PATH/$1"
    if [ -f "$file" ]; then
        grep -oP '@[a-zA-Z0-9_/.\\-]+\.(md|dart|yaml|json|sh)' "$file" 2>/dev/null || true
    fi
}

# Main validation script
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         AGENT METHODOLOGY PACK - VALIDATION SCRIPT         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_info "Validating: $TARGET_PATH"

    # ============================================================
    # 1. CHECK CORE FILES
    # ============================================================
    print_header "1. Core Files"

    check_file "CLAUDE.md" "Root CLAUDE.md"
    check_file "PROJECT-STATE.md" "Root PROJECT-STATE.md"
    check_file "README.md" "README"
    check_file "INSTALL.md" "Installation guide"
    check_file "QUICK-START.md" "Quick start guide"

    # ============================================================
    # 2. CHECK CLAUDE.md LINE COUNT
    # ============================================================
    print_header "2. CLAUDE.md Validation"

    if [ -f "$TARGET_PATH/CLAUDE.md" ]; then
        CLAUDE_LINES=$(count_lines "CLAUDE.md")
        print_info "CLAUDE.md has $CLAUDE_LINES lines"

        if [ "$CLAUDE_LINES" -le 70 ]; then
            print_success "CLAUDE.md is within 70-line limit"
        else
            print_error "CLAUDE.md exceeds 70-line limit ($CLAUDE_LINES lines)"
        fi
    fi

    # ============================================================
    # 3. CHECK FOLDER STRUCTURE
    # ============================================================
    print_header "3. Folder Structure"

    # Root folders
    check_dir ".claude" ".claude folder"
    check_dir "docs" "docs folder"
    check_dir "scripts" "scripts folder"
    check_dir "templates" "templates folder"

    # .claude subfolders
    check_dir ".claude/agents" "agents folder"
    check_dir ".claude/agents/planning" "planning agents"
    check_dir ".claude/agents/development" "development agents"
    check_dir ".claude/agents/quality" "quality agents"
    check_dir ".claude/patterns" "patterns folder"
    check_dir ".claude/state" "state folder"
    check_dir ".claude/workflows" "workflows folder"

    # docs subfolders
    check_dir "docs/1-BASELINE" "1-BASELINE folder"
    check_dir "docs/2-MANAGEMENT" "2-MANAGEMENT folder"
    check_dir "docs/3-ARCHITECTURE" "3-ARCHITECTURE folder"
    check_dir "docs/4-DEVELOPMENT" "4-DEVELOPMENT folder"
    check_dir "docs/5-ARCHIVE" "5-ARCHIVE folder"

    # ============================================================
    # 4. CHECK AGENT FILES
    # ============================================================
    print_header "4. Agent Definitions"

    # Planning agents
    check_file ".claude/agents/planning/PRODUCT-OWNER.md" "Product Owner"
    check_file ".claude/agents/planning/PM-AGENT.md" "PM Agent"
    check_file ".claude/agents/planning/SCRUM-MASTER.md" "Scrum Master"
    check_file ".claude/agents/planning/ARCHITECT-AGENT.md" "Architect Agent"
    check_file ".claude/agents/planning/UX-DESIGNER.md" "UX Designer"
    check_file ".claude/agents/planning/RESEARCH-AGENT.md" "Research Agent"

    # Development agents
    check_file ".claude/agents/development/FRONTEND-DEV.md" "Frontend Dev"
    check_file ".claude/agents/development/BACKEND-DEV.md" "Backend Dev"
    check_file ".claude/agents/development/SENIOR-DEV.md" "Senior Dev"
    check_file ".claude/agents/development/TEST-ENGINEER.md" "Test Engineer"

    # Quality agents
    check_file ".claude/agents/quality/QA-AGENT.md" "QA Agent"
    check_file ".claude/agents/quality/CODE-REVIEWER.md" "Code Reviewer"
    check_file ".claude/agents/quality/TECH-WRITER.md" "Tech Writer"

    # Orchestrator
    check_file ".claude/agents/ORCHESTRATOR.md" "Orchestrator"

    # ============================================================
    # 5. CHECK STATE FILES
    # ============================================================
    print_header "5. State Files"

    check_file ".claude/state/AGENT-STATE.md" "Agent State"
    check_file ".claude/state/AGENT-MEMORY.md" "Agent Memory"
    check_file ".claude/state/TASK-QUEUE.md" "Task Queue"
    check_file ".claude/state/HANDOFFS.md" "Handoffs"
    check_file ".claude/state/DECISION-LOG.md" "Decision Log"
    check_file ".claude/state/DEPENDENCIES.md" "Dependencies"
    check_file ".claude/state/METRICS.md" "Metrics"

    # ============================================================
    # 6. CHECK PATTERN FILES
    # ============================================================
    print_header "6. Pattern Files"

    check_file ".claude/PATTERNS.md" "Patterns index"
    check_file ".claude/patterns/PLAN-ACT-MODE.md" "Plan-Act Mode"
    check_file ".claude/patterns/ERROR-RECOVERY.md" "Error Recovery"
    check_file ".claude/patterns/QUALITY-RUBRIC.md" "Quality Rubric"
    check_file ".claude/patterns/STATE-TRANSITION.md" "State Transition"

    # ============================================================
    # 7. CHECK CONFIGURATION FILES
    # ============================================================
    print_header "7. Configuration Files"

    check_file ".claude/CONTEXT-BUDGET.md" "Context Budget"
    check_file ".claude/MODEL-ROUTING.md" "Model Routing"
    check_file ".claude/MODULE-INDEX.md" "Module Index"
    check_file ".claude/PROMPTS.md" "Prompts"
    check_file ".claude/TABLES.md" "Tables"

    # ============================================================
    # 8. CHECK TEMPLATE FILES
    # ============================================================
    print_header "8. Templates"

    check_file "templates/CLAUDE.md.template" "CLAUDE.md template"
    check_file "templates/PROJECT-STATE.md.template" "PROJECT-STATE.md template"
    check_file "templates/epic-template.md" "Epic template"

    # ============================================================
    # 9. VALIDATE @REFERENCES
    # ============================================================
    print_header "9. Reference Validation"

    print_info "Checking @references in key files..."

    # Files to check for references
    FILES_TO_CHECK=(
        "CLAUDE.md"
        ".claude/agents/ORCHESTRATOR.md"
        ".claude/agents/planning/PRODUCT-OWNER.md"
        ".claude/agents/planning/PM-AGENT.md"
        ".claude/agents/development/SENIOR-DEV.md"
    )

    TOTAL_REFS=0
    BROKEN_REFS=0

    for file in "${FILES_TO_CHECK[@]}"; do
        if [ -f "$TARGET_PATH/$file" ]; then
            refs=$(extract_references "$file")
            if [ -n "$refs" ]; then
                while IFS= read -r ref; do
                    ((TOTAL_REFS++))
                    # Remove @ symbol
                    ref_path="${ref:1}"

                    if [ ! -f "$TARGET_PATH/$ref_path" ]; then
                        print_warning "Broken reference in $file: $ref"
                        ((BROKEN_REFS++))
                    fi
                done <<< "$refs"
            fi
        fi
    done

    if [ $TOTAL_REFS -gt 0 ]; then
        VALID_REFS=$((TOTAL_REFS - BROKEN_REFS))
        print_info "Found $TOTAL_REFS references, $VALID_REFS valid, $BROKEN_REFS broken"

        if [ $BROKEN_REFS -eq 0 ]; then
            print_success "All file references are valid"
        fi
    else
        print_info "No @references found in checked files"
    fi

    # ============================================================
    # 10. CHECK WORKFLOW FILES
    # ============================================================
    print_header "10. Workflow Files"

    check_file ".claude/workflows/DEVELOPMENT-FLOW.md" "Development Flow"
    check_file ".claude/workflows/EPIC-FLOW.md" "Epic Flow"
    check_file ".claude/workflows/PLANNING-FLOW.md" "Planning Flow"

    # ============================================================
    # SUMMARY
    # ============================================================
    print_header "VALIDATION SUMMARY"

    echo ""
    echo -e "${GREEN}✅ Passed:   $SUCCESS_COUNT${NC}"
    echo -e "${YELLOW}⚠️  Warnings: $WARNING_COUNT${NC}"
    echo -e "${RED}❌ Errors:   $ERROR_COUNT${NC}"
    echo ""

    if [ $ERROR_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  🎉 ALL VALIDATIONS PASSED! PROJECT STRUCTURE IS VALID 🎉  ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        exit 0
    elif [ $ERROR_COUNT -eq 0 ]; then
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║     VALIDATION PASSED WITH WARNINGS - PLEASE REVIEW        ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        exit 0
    else
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║   VALIDATION FAILED - PLEASE FIX ERRORS BEFORE PROCEEDING  ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        exit 1
    fi
}

# Run main function
main
