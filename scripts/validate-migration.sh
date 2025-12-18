#!/bin/bash
# Validate Migration Script
# Validates completed migration to Agent Methodology Pack structure
#
# Usage: bash scripts/validate-migration.sh [project-path] [options]
# Example: bash scripts/validate-migration.sh /path/to/project --strict
#
# Author: Agent Methodology Pack
# Version: 1.0

# Don't use set -e because counter increments return non-zero when incrementing from 0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Default values
PROJECT_PATH="."
STRICT_MODE=false
FIX_MODE=false

# Counters
PASSED_COUNT=0
WARNING_COUNT=0
FAILED_COUNT=0

# Issue tracking
declare -a WARNINGS
declare -a ERRORS
declare -a RECOMMENDATIONS

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --strict)
            STRICT_MODE=true
            shift
            ;;
        --fix)
            FIX_MODE=true
            shift
            ;;
        --help|-h)
            cat << EOF
Usage: bash scripts/validate-migration.sh [project-path] [options]

Validates completed migration to Agent Methodology Pack structure.

Arguments:
  project-path    Path to project directory (default: current directory)

Options:
  --strict        Fail on warnings (exit code 1)
  --fix           Auto-fix simple issues
  --help, -h      Show this help message

Checks:
  1. Required files exist (CLAUDE.md, PROJECT-STATE.md)
  2. CLAUDE.md < 70 lines
  3. All @references are valid
  4. Docs structure complete (all required folders)
  5. No orphan documentation
  6. Agent workspaces exist
  7. Memory bank initialized
  8. All scripts executable
  9. No broken internal links
  10. Large files identified (warning)

Examples:
  # Basic validation
  bash scripts/validate-migration.sh

  # Strict mode (fail on warnings)
  bash scripts/validate-migration.sh --strict

  # Auto-fix issues
  bash scripts/validate-migration.sh --fix

EOF
            exit 0
            ;;
        *)
            PROJECT_PATH="$1"
            shift
            ;;
    esac
done

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_pass() {
    local message="$1"
    echo -e "${GREEN}[✅]${NC} $message"
    ((PASSED_COUNT++))
}

check_warn() {
    local message="$1"
    echo -e "${YELLOW}[⚠️]${NC} $message"
    ((WARNING_COUNT++))
    WARNINGS+=("$message")
}

check_fail() {
    local message="$1"
    echo -e "${RED}[❌]${NC} $message"
    ((FAILED_COUNT++))
    ERRORS+=("$message")
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

add_recommendation() {
    local message="$1"
    RECOMMENDATIONS+=("$message")
}

# Get absolute path
get_abs_path() {
    local path="$1"
    if [ -d "$path" ]; then
        (cd "$path" && pwd)
    else
        echo "$path"
    fi
}

# Count lines in file
count_lines() {
    local file="$1"
    if [ -f "$file" ]; then
        wc -l < "$file" | tr -d ' '
    else
        echo "0"
    fi
}

# Extract @references from file
extract_references() {
    local file="$1"
    if [ -f "$file" ]; then
        grep -oP '@[a-zA-Z0-9_/.\\-]+\.(md|dart|yaml|json|sh|ts|js|py)' "$file" 2>/dev/null || true
    fi
}

# Check if file is executable
is_executable() {
    local file="$1"
    [ -x "$file" ]
}

# Make file executable
make_executable() {
    local file="$1"
    chmod +x "$file" 2>/dev/null
}

# Main validation function
main() {
    # Convert to absolute path
    PROJECT_PATH=$(get_abs_path "$PROJECT_PATH")

    # Validate project path
    if [ ! -d "$PROJECT_PATH" ]; then
        print_error "Project directory does not exist: $PROJECT_PATH"
        exit 1
    fi

    # Change to project directory
    cd "$PROJECT_PATH"

    # Show banner
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              MIGRATION VALIDATION                          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_info "Validating: $PROJECT_PATH"
    if [ "$STRICT_MODE" = true ]; then
        print_warning "STRICT MODE: Warnings will be treated as errors"
    fi
    if [ "$FIX_MODE" = true ]; then
        print_info "FIX MODE: Simple issues will be auto-fixed"
    fi
    echo ""

    # ============================================================
    # 1. CHECK CORE FILES
    # ============================================================
    print_header "CHECKS"
    echo ""

    # Check CLAUDE.md
    if [ -f "CLAUDE.md" ]; then
        lines=$(count_lines "CLAUDE.md")
        if [ "$lines" -le 70 ]; then
            check_pass "CLAUDE.md exists ($lines lines - OK)"
        elif [ "$lines" -le 80 ]; then
            check_warn "CLAUDE.md exists ($lines lines - slightly over limit)"
            add_recommendation "Consider trimming CLAUDE.md to under 70 lines"
        else
            check_fail "CLAUDE.md exceeds 70 lines ($lines lines)"
            add_recommendation "Trim CLAUDE.md to under 70 lines by moving content to referenced files"
        fi
    else
        check_fail "CLAUDE.md missing"
        add_recommendation "Create CLAUDE.md using: cp templates/CLAUDE.md.template CLAUDE.md"
    fi

    # Check PROJECT-STATE.md
    if [ -f "PROJECT-STATE.md" ]; then
        check_pass "PROJECT-STATE.md exists"
    else
        check_fail "PROJECT-STATE.md missing"
        add_recommendation "Create PROJECT-STATE.md using: cp templates/PROJECT-STATE.md.template PROJECT-STATE.md"
    fi

    # ============================================================
    # 2. CHECK DOCS STRUCTURE
    # ============================================================

    # Check docs folders
    docs_complete=true
    for folder in "product" "architecture" "epics" "stories" "sprints" "api" "implementation" "testing" "archive"; do
        if [ -d "docs/$folder" ]; then
            : # Folder exists, do nothing
        else
            docs_complete=false
            if [ "$FIX_MODE" = true ]; then
                mkdir -p "docs/$folder"
                print_info "  Created: docs/$folder"
            fi
        fi
    done

    if [ "$docs_complete" = true ] || [ "$FIX_MODE" = true ]; then
        check_pass "Docs structure complete"
    else
        check_fail "Docs structure incomplete"
        add_recommendation "Create missing directories: mkdir -p docs/{product,architecture,epics,stories,sprints,api,implementation,testing,archive}"
    fi

    # ============================================================
    # 3. CHECK .claude/ STRUCTURE
    # ============================================================

    # Check .claude folders
    claude_complete=true
    for folder in "agents" "agents/planning" "agents/development" "agents/quality" "patterns" "state" "workflows"; do
        if [ -d ".claude/$folder" ]; then
            : # Folder exists
        else
            claude_complete=false
            if [ "$FIX_MODE" = true ]; then
                mkdir -p ".claude/$folder"
                print_info "  Created: .claude/$folder"
            fi
        fi
    done

    if [ "$claude_complete" = true ] || [ "$FIX_MODE" = true ]; then
        check_pass ".claude/ structure complete"
    else
        check_fail ".claude/ structure incomplete"
        add_recommendation "Create .claude structure: mkdir -p .claude/{agents/{planning,development,quality},patterns,state,workflows}"
    fi

    # ============================================================
    # 4. CHECK AGENT WORKSPACES
    # ============================================================

    # Count agent files
    agent_count=0
    required_agents=(
        "ORCHESTRATOR.md"
        "planning/RESEARCH-AGENT.md"
        "planning/PM-AGENT.md"
        "planning/UX-DESIGNER.md"
        "planning/ARCHITECT-AGENT.md"
        "planning/PRODUCT-OWNER.md"
        "planning/SCRUM-MASTER.md"
        "development/TEST-ENGINEER.md"
        "development/BACKEND-DEV.md"
        "development/FRONTEND-DEV.md"
        "development/SENIOR-DEV.md"
        "quality/QA-AGENT.md"
        "quality/CODE-REVIEWER.md"
        "quality/TECH-WRITER.md"
    )

    missing_agents=()
    for agent in "${required_agents[@]}"; do
        if [ -f ".claude/agents/$agent" ]; then
            ((agent_count++))
        else
            missing_agents+=("$agent")
        fi
    done

    if [ "$agent_count" -eq 14 ]; then
        check_pass "14 agent workspaces generated"
    elif [ "$agent_count" -gt 10 ]; then
        check_warn "$agent_count agent workspaces found (expected 14)"
        add_recommendation "Missing agents: ${missing_agents[*]}"
    else
        check_fail "Only $agent_count agent workspaces found (expected 14)"
        add_recommendation "Generate agent workspaces: bash scripts/generate-workspaces.sh"
    fi

    # ============================================================
    # 5. CHECK MEMORY BANK
    # ============================================================

    # Check state files
    state_files_exist=0
    required_state_files=(
        "AGENT-STATE.md"
        "AGENT-MEMORY.md"
        "TASK-QUEUE.md"
        "HANDOFFS.md"
        "DECISION-LOG.md"
        "DEPENDENCIES.md"
        "METRICS.md"
    )

    for state_file in "${required_state_files[@]}"; do
        if [ -f ".claude/state/$state_file" ]; then
            ((state_files_exist++))
        fi
    done

    if [ "$state_files_exist" -eq 7 ]; then
        check_pass "Memory bank initialized"
    elif [ "$state_files_exist" -gt 4 ]; then
        check_warn "Memory bank partially initialized ($state_files_exist/7 files)"
        add_recommendation "Initialize all state files: bash scripts/init-project.sh --state-only"
    else
        check_fail "Memory bank not initialized ($state_files_exist/7 files)"
        add_recommendation "Initialize state files: bash scripts/init-project.sh --state-only"
    fi

    # ============================================================
    # 6. CHECK LARGE FILES
    # ============================================================

    # Find large files
    large_files=()
    find . -type f -name "*.md" \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        ! -path "*/build/*" \
        2>/dev/null | while read -r file; do

        lines=$(count_lines "$file")
        if [ "$lines" -gt 800 ]; then
            large_files+=("$file ($lines lines)")
        fi
    done

    large_file_count=$(find . -type f -name "*.md" \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        2>/dev/null | while read -r file; do
        lines=$(count_lines "$file")
        if [ "$lines" -gt 800 ]; then
            echo "$file"
        fi
    done | wc -l | tr -d ' ')

    if [ "$large_file_count" -eq 0 ]; then
        check_pass "No large files found"
    elif [ "$large_file_count" -le 2 ]; then
        check_warn "$large_file_count large files found (consider sharding)"
        # List large files
        find . -type f -name "*.md" \
            ! -path "*/node_modules/*" \
            ! -path "*/.git/*" \
            2>/dev/null | while read -r file; do
            lines=$(count_lines "$file")
            if [ "$lines" -gt 800 ]; then
                add_recommendation "Consider sharding: $file ($lines lines)"
            fi
        done
    else
        check_warn "$large_file_count large files found"
        add_recommendation "Run: bash scripts/find-large-files.sh for details"
    fi

    # ============================================================
    # 7. VALIDATE @REFERENCES
    # ============================================================

    # Check @references in key files
    ref_files=(
        "CLAUDE.md"
        ".claude/agents/ORCHESTRATOR.md"
    )

    total_refs=0
    broken_refs=0

    for file in "${ref_files[@]}"; do
        if [ -f "$file" ]; then
            refs=$(extract_references "$file")
            if [ -n "$refs" ]; then
                while IFS= read -r ref; do
                    ((total_refs++))
                    # Remove @ symbol
                    ref_path="${ref:1}"

                    # Check if file exists
                    if [ ! -f "$ref_path" ]; then
                        ((broken_refs++))
                        add_recommendation "Fix broken reference in $file: $ref"
                    fi
                done <<< "$refs"
            fi
        fi
    done

    if [ "$total_refs" -eq 0 ]; then
        check_pass "No @references to validate"
    elif [ "$broken_refs" -eq 0 ]; then
        check_pass "All @references valid ($total_refs checked)"
    elif [ "$broken_refs" -le 2 ]; then
        check_warn "$broken_refs broken references (out of $total_refs)"
    else
        check_fail "$broken_refs broken references (out of $total_refs)"
    fi

    # ============================================================
    # 8. CHECK SCRIPTS EXECUTABLE
    # ============================================================

    # Check if scripts are executable
    if [ -d "scripts" ]; then
        non_executable=0
        script_files=$(find scripts -type f -name "*.sh" 2>/dev/null)

        if [ -n "$script_files" ]; then
            while IFS= read -r script; do
                if ! is_executable "$script"; then
                    ((non_executable++))
                    if [ "$FIX_MODE" = true ]; then
                        make_executable "$script"
                        print_info "  Fixed: $script (made executable)"
                    fi
                fi
            done <<< "$script_files"

            if [ "$non_executable" -eq 0 ] || [ "$FIX_MODE" = true ]; then
                check_pass "All scripts executable"
            else
                check_warn "$non_executable scripts not executable"
                add_recommendation "Make scripts executable: chmod +x scripts/*.sh"
            fi
        else
            check_warn "No scripts found"
        fi
    else
        check_warn "Scripts directory missing"
    fi

    # ============================================================
    # 9. CHECK ORPHAN DOCUMENTATION
    # ============================================================

    # Look for markdown files outside docs/ and .claude/
    orphan_count=0
    find . -type f -name "*.md" \
        ! -path "./docs/*" \
        ! -path "./.claude/*" \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        ! -name "CLAUDE.md" \
        ! -name "PROJECT-STATE.md" \
        ! -name "README.md" \
        ! -name "CHANGELOG.md" \
        ! -name "INSTALL.md" \
        ! -name "QUICK-START.md" \
        2>/dev/null | while read -r file; do
        ((orphan_count++))
    done

    orphan_count=$(find . -type f -name "*.md" \
        ! -path "./docs/*" \
        ! -path "./.claude/*" \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        ! -name "CLAUDE.md" \
        ! -name "PROJECT-STATE.md" \
        ! -name "README.md" \
        ! -name "CHANGELOG.md" \
        ! -name "INSTALL.md" \
        ! -name "QUICK-START.md" \
        2>/dev/null | wc -l | tr -d ' ')

    if [ "$orphan_count" -eq 0 ]; then
        check_pass "No orphan documentation"
    else
        check_warn "$orphan_count orphan documentation files"
        add_recommendation "Review and migrate orphan files to docs/ or .claude/"
    fi

    # ============================================================
    # 10. CHECK BROKEN INTERNAL LINKS
    # ============================================================

    # Check for broken links in markdown files
    broken_link_count=0

    # This is a simplified check - only looks for [text](file.md) style links
    find docs -type f -name "*.md" 2>/dev/null | while read -r file; do
        # Extract markdown links
        grep -oP '\[.*?\]\(\K[^)]+(?=\))' "$file" 2>/dev/null | while read -r link; do
            # Skip external links
            if [[ "$link" =~ ^https?:// ]]; then
                continue
            fi

            # Get absolute path
            link_dir=$(dirname "$file")
            link_path="$link_dir/$link"

            # Check if file exists
            if [ ! -f "$link_path" ]; then
                ((broken_link_count++))
                add_recommendation "Broken link in $file: $link"
            fi
        done
    done

    broken_link_count=$(find docs -type f -name "*.md" 2>/dev/null | while read -r file; do
        grep -oP '\[.*?\]\(\K[^)]+(?=\))' "$file" 2>/dev/null | while read -r link; do
            if [[ "$link" =~ ^https?:// ]]; then
                continue
            fi
            link_dir=$(dirname "$file")
            link_path="$link_dir/$link"
            if [ ! -f "$link_path" ]; then
                echo "broken"
            fi
        done
    done | wc -l | tr -d ' ')

    if [ "$broken_link_count" -eq 0 ]; then
        check_pass "No broken internal links"
    else
        check_warn "$broken_link_count broken internal links"
    fi

    # ============================================================
    # SUMMARY
    # ============================================================
    echo ""
    print_header "SUMMARY"

    echo ""
    echo -e "${GREEN}✅ Passed:   $PASSED_COUNT${NC}"
    echo -e "${YELLOW}⚠️  Warnings: $WARNING_COUNT${NC}"
    echo -e "${RED}❌ Failed:   $FAILED_COUNT${NC}"
    echo ""

    # ============================================================
    # RECOMMENDATIONS
    # ============================================================
    if [ ${#RECOMMENDATIONS[@]} -gt 0 ]; then
        print_header "RECOMMENDATIONS"
        echo ""
        for i in "${!RECOMMENDATIONS[@]}"; do
            echo -e "${CYAN}$((i+1)). ${RECOMMENDATIONS[$i]}${NC}"
        done
        echo ""
    fi

    # ============================================================
    # FINAL STATUS
    # ============================================================
    print_header "MIGRATION STATUS"
    echo ""

    if [ $FAILED_COUNT -eq 0 ] && [ $WARNING_COUNT -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║             MIGRATION STATUS: COMPLETE ✅                  ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""

        print_header "NEXT STEPS"
        echo ""
        echo -e "${CYAN}1. Test agents:${NC} Load ORCHESTRATOR and describe a task"
        echo -e "   claude --project . '[ORCHESTRATOR] Analyze project state'"
        echo ""
        echo -e "${CYAN}2. Run first sprint planning:${NC}"
        echo -e "   claude --project . '[SCRUM-MASTER] Create Sprint 1'"
        echo ""
        echo -e "${CYAN}3. Onboard team:${NC} Share QUICK-START.md with team members"
        echo ""

        exit 0

    elif [ $FAILED_COUNT -eq 0 ]; then
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║      MIGRATION STATUS: COMPLETE WITH WARNINGS ⚠️           ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""

        if [ "$STRICT_MODE" = true ]; then
            print_error "STRICT MODE: Exiting with error due to warnings"
            exit 1
        else
            print_warning "Please review warnings above"
            exit 0
        fi

    else
        echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║       MIGRATION STATUS: INCOMPLETE - ACTION NEEDED ❌      ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
        echo ""

        print_header "ACTION REQUIRED"
        echo ""
        echo -e "${RED}Please fix errors above before proceeding.${NC}"
        echo ""
        echo -e "${CYAN}Quick fixes:${NC}"
        echo -e "1. Run with --fix flag to auto-fix simple issues:"
        echo -e "   bash scripts/validate-migration.sh --fix"
        echo ""
        echo -e "2. See recommendations above for manual fixes"
        echo ""

        exit 1
    fi
}

# Run main function
main
