#!/bin/bash
# Sync State Script
# Copies PROJECT-STATE.md to root and optionally commits changes
#
# Usage:
#   bash scripts/sync-state.sh                    # Just sync
#   bash scripts/sync-state.sh --commit           # Sync + commit
#   bash scripts/sync-state.sh --commit "message" # Sync + commit with custom message
#   bash scripts/sync-state.sh --phase "discovery" # Update phase + sync + commit
#
# Called automatically by workflows after phase completions
#
# Author: Agent Methodology Pack
# Version: 1.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
STATE_SOURCE=".claude/state/PROJECT-STATE.md"
STATE_TARGET="PROJECT-STATE.md"
AUTO_COMMIT=false
COMMIT_MESSAGE=""
PHASE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --commit)
            AUTO_COMMIT=true
            if [[ -n "$2" && ! "$2" =~ ^-- ]]; then
                COMMIT_MESSAGE="$2"
                shift
            fi
            shift
            ;;
        --phase)
            PHASE="$2"
            AUTO_COMMIT=true
            shift 2
            ;;
        -h|--help)
            echo "Usage: sync-state.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --commit [message]  Commit changes after sync"
            echo "  --phase <phase>     Update phase marker and commit"
            echo "  -h, --help          Show this help"
            echo ""
            echo "Examples:"
            echo "  sync-state.sh                          # Just sync state to root"
            echo "  sync-state.sh --commit                 # Sync + auto-commit"
            echo "  sync-state.sh --commit 'PRD complete'  # Sync + custom message"
            echo "  sync-state.sh --phase discovery        # Mark phase complete + commit"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# Helper functions
print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if in git repo
check_git() {
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        print_warning "Not a git repository - skipping commit"
        return 1
    fi
    return 0
}

# Update phase in PROJECT-STATE.md if specified
update_phase() {
    local phase="$1"
    local state_file="$STATE_TARGET"

    if [[ ! -f "$state_file" ]]; then
        print_warning "PROJECT-STATE.md not found - cannot update phase"
        return 1
    fi

    local date=$(date +%Y-%m-%d)

    # Map phase names to checkbox updates (supports all workflows)
    case "$phase" in
        # Planning phases (new-project, migration, feature)
        discovery)
            sed -i.bak 's/- \[ \] Discovery/- [x] Discovery/' "$state_file"
            ;;
        prd|planning|requirements)
            sed -i.bak 's/- \[ \] PRD (Requirements)/- [x] PRD (Requirements)/' "$state_file"
            ;;
        architecture)
            sed -i.bak 's/- \[ \] Architecture/- [x] Architecture/' "$state_file"
            ;;
        ux|ux_design)
            sed -i.bak 's/- \[ \] UX Design/- [x] UX Design/' "$state_file"
            ;;
        epic|epics|epic_breakdown)
            sed -i.bak 's/- \[ \] Epic Breakdown/- [x] Epic Breakdown/' "$state_file"
            ;;
        stories|story|story_breakdown)
            sed -i.bak 's/- \[ \] Story Breakdown/- [x] Story Breakdown/' "$state_file"
            ;;
        scope|scope_validation)
            sed -i.bak 's/- \[ \] Scope Validation/- [x] Scope Validation/' "$state_file"
            ;;
        sprint|sprint_planning)
            sed -i.bak 's/- \[ \] Sprint Planning/- [x] Sprint Planning/' "$state_file"
            ;;

        # Development phases (story-delivery, bug-workflow, feature-flow)
        development|dev)
            sed -i.bak 's/- \[ \] Development/- [x] Development/' "$state_file"
            ;;
        testing|test)
            sed -i.bak 's/- \[ \] Testing/- [x] Testing/' "$state_file"
            ;;
        code_review|review)
            sed -i.bak 's/- \[ \] Code Review/- [x] Code Review/' "$state_file"
            ;;
        deployment|deploy)
            sed -i.bak 's/- \[ \] Deployment/- [x] Deployment/' "$state_file"
            ;;
        release)
            sed -i.bak 's/- \[ \] Release/- [x] Release/' "$state_file"
            ;;

        # Migration phases
        audit|doc_audit)
            sed -i.bak 's/- \[ \] Doc Audit/- [x] Doc Audit/' "$state_file"
            ;;
        migration_plan)
            sed -i.bak 's/- \[ \] Migration Plan/- [x] Migration Plan/' "$state_file"
            ;;

        # Reset (for new sprint)
        reset_development)
            sed -i.bak 's/- \[x\] Development/- [ ] Development/' "$state_file"
            sed -i.bak 's/- \[x\] Testing/- [ ] Testing/' "$state_file"
            sed -i.bak 's/- \[x\] Code Review/- [ ] Code Review/' "$state_file"
            sed -i.bak 's/- \[x\] Deployment/- [ ] Deployment/' "$state_file"
            ;;
        *)
            print_warning "Unknown phase: $phase"
            return 1
            ;;
    esac

    # Update Last Updated date
    sed -i.bak "s/\*\*Last Updated:\*\* .*/\*\*Last Updated:\*\* $date/" "$state_file"

    # Cleanup backup
    rm -f "$state_file.bak"

    print_success "Phase '$phase' marked complete"
    return 0
}

# Sync state file to root
sync_state() {
    print_step "Syncing PROJECT-STATE.md to root..."

    # Check if source exists in .claude/state/
    if [[ -f "$STATE_SOURCE" ]]; then
        cp "$STATE_SOURCE" "$STATE_TARGET"
        print_success "Synced from $STATE_SOURCE"
    elif [[ -f "$STATE_TARGET" ]]; then
        print_success "PROJECT-STATE.md already in root"
    else
        print_warning "No PROJECT-STATE.md found - creating from template"

        if [[ -f "templates/PROJECT-STATE.md.template" ]]; then
            cp "templates/PROJECT-STATE.md.template" "$STATE_TARGET"
            print_success "Created from template"
        else
            print_error "No template found - please create PROJECT-STATE.md manually"
            return 1
        fi
    fi

    return 0
}

# Commit changes with descriptive message
commit_changes() {
    local message="$1"

    if ! check_git; then
        return 0
    fi

    # Check for changes
    if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
        # Check for untracked files
        if [[ -z $(git ls-files --others --exclude-standard) ]]; then
            print_warning "No changes to commit"
            return 0
        fi
    fi

    print_step "Creating checkpoint commit..."

    # Stage all changes
    git add -A

    # Generate commit message if not provided
    if [[ -z "$message" ]]; then
        if [[ -n "$PHASE" ]]; then
            message="checkpoint: Complete $PHASE phase"
        else
            message="checkpoint: Update project state"
        fi
    fi

    # Add emoji prefix based on phase
    case "$PHASE" in
        discovery)     message="🔍 $message" ;;
        prd|planning)  message="📋 $message" ;;
        architecture)  message="🏗️ $message" ;;
        ux|ux_design)  message="🎨 $message" ;;
        epic|epics)    message="📦 $message" ;;
        stories|story) message="📝 $message" ;;
        sprint*)       message="🏃 $message" ;;
        *)             message="📌 $message" ;;
    esac

    # Commit
    git commit -m "$message

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Agent Methodology Pack <noreply@anthropic.com>" || {
        print_warning "Commit failed or no changes"
        return 0
    }

    print_success "Committed: $message"

    # Show short log
    echo ""
    git log --oneline -1
    echo ""

    return 0
}

# Main execution
main() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  STATE SYNC${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Step 1: Sync state
    if ! sync_state; then
        exit 1
    fi

    # Step 2: Update phase if specified
    if [[ -n "$PHASE" ]]; then
        update_phase "$PHASE"
    fi

    # Step 3: Commit if requested
    if [[ "$AUTO_COMMIT" == "true" ]]; then
        commit_changes "$COMMIT_MESSAGE"
    fi

    echo ""
    print_success "State sync complete"
    echo ""
}

# Run
main
