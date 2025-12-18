#!/bin/bash
# Cleanup Script - Remove Agent Methodology Pack after migration
#
# This script safely removes the pack directory after successful migration.
# It performs safety checks before deletion.
#
# Usage:
#   bash scripts/cleanup.sh                    # Interactive mode
#   bash scripts/cleanup.sh --pack-path /path  # Specify pack location
#   bash scripts/cleanup.sh --force            # Skip confirmation
#
# Author: Agent Methodology Pack
# Version: 1.0

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACK_ROOT="$(dirname "$SCRIPT_DIR")"

# Options
FORCE=false
CUSTOM_PACK_PATH=""

# Helper functions
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ ERROR: $1${NC}"; }

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --pack-path)
            CUSTOM_PACK_PATH="$2"
            shift 2
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --pack-path PATH   Path to pack directory to remove"
            echo "  --force, -f        Skip confirmation prompt"
            echo "  -h, --help         Show this help"
            echo ""
            echo "Examples:"
            echo "  $0                           # Remove current pack (with confirmation)"
            echo "  $0 --force                   # Remove without confirmation"
            echo "  $0 --pack-path /path/to/pack # Remove specific pack directory"
            exit 0
            ;;
        *)
            print_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Use custom path if provided
if [ -n "$CUSTOM_PACK_PATH" ]; then
    PACK_ROOT="$CUSTOM_PACK_PATH"
fi

# Resolve to absolute path
PACK_ROOT="$(cd "$PACK_ROOT" 2>/dev/null && pwd)" || {
    print_error "Pack directory not found: $PACK_ROOT"
    exit 1
}

# Safety checks
safety_checks() {
    print_header "SAFETY CHECKS"

    local errors=0

    # Check 1: Is this actually a pack directory?
    if [ ! -f "$PACK_ROOT/.claude/agents/ORCHESTRATOR.md" ]; then
        print_error "This doesn't look like an Agent Methodology Pack directory"
        print_info "Missing: .claude/agents/ORCHESTRATOR.md"
        ((errors++))
    else
        print_success "Pack structure verified"
    fi

    # Check 2: Are we not deleting user's home or root?
    if [ "$PACK_ROOT" = "$HOME" ] || [ "$PACK_ROOT" = "/" ]; then
        print_error "Cannot delete home or root directory!"
        ((errors++))
    else
        print_success "Safe path (not home/root)"
    fi

    # Check 3: Is the pack directory named appropriately?
    local dirname="$(basename "$PACK_ROOT")"
    if [[ "$dirname" != *"agent"* ]] && [[ "$dirname" != *"methodology"* ]] && [[ "$dirname" != *"pack"* ]]; then
        print_warning "Directory name doesn't contain 'agent', 'methodology', or 'pack'"
        print_info "Directory: $dirname"
        print_info "Proceeding anyway, but please verify this is correct"
    else
        print_success "Directory name looks correct"
    fi

    # Check 4: Is git clean? (warn if uncommitted changes)
    if [ -d "$PACK_ROOT/.git" ]; then
        cd "$PACK_ROOT"
        if ! git diff --quiet 2>/dev/null; then
            print_warning "Pack has uncommitted changes"
            print_info "These changes will be lost"
        else
            print_success "No uncommitted changes in pack"
        fi
    fi

    return $errors
}

# Show what will be deleted
show_deletion_summary() {
    print_header "DELETION SUMMARY"

    echo ""
    echo -e "  Pack to delete: ${RED}$PACK_ROOT${NC}"
    echo ""

    # Count files
    local file_count=$(find "$PACK_ROOT" -type f 2>/dev/null | wc -l)
    local dir_count=$(find "$PACK_ROOT" -type d 2>/dev/null | wc -l)
    local size=$(du -sh "$PACK_ROOT" 2>/dev/null | cut -f1)

    echo -e "  Files:       ${YELLOW}$file_count${NC}"
    echo -e "  Directories: ${YELLOW}$dir_count${NC}"
    echo -e "  Total size:  ${YELLOW}$size${NC}"
    echo ""

    # Show main directories that will be deleted
    echo -e "  ${BLUE}Main directories:${NC}"
    for dir in ".claude" "docs" "scripts" "templates"; do
        if [ -d "$PACK_ROOT/$dir" ]; then
            echo -e "    - $dir/"
        fi
    done
    echo ""
}

# Perform deletion
delete_pack() {
    print_header "DELETING PACK"

    print_info "Removing: $PACK_ROOT"
    echo ""

    # Change to parent directory first (can't delete current dir)
    cd "$(dirname "$PACK_ROOT")"

    if rm -rf "$PACK_ROOT"; then
        print_success "Pack deleted successfully!"
        echo ""
        print_info "The Agent Methodology Pack has been removed."
        print_info "Your project should now have its own copy of the pack files."
    else
        print_error "Failed to delete pack"
        exit 1
    fi
}

# Main
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         AGENT METHODOLOGY PACK - CLEANUP SCRIPT            ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Run safety checks
    if ! safety_checks; then
        print_error "Safety checks failed. Aborting."
        exit 1
    fi

    # Show what will be deleted
    show_deletion_summary

    # Confirm unless --force
    if [ "$FORCE" = false ]; then
        echo -e "${RED}⚠️  WARNING: This action cannot be undone!${NC}"
        echo ""
        echo -n -e "${YELLOW}Are you sure you want to delete the pack? (yes/no): ${NC}"
        read -r confirm

        if [ "$confirm" != "yes" ]; then
            print_info "Cleanup cancelled"
            exit 0
        fi
    fi

    # Delete
    delete_pack
}

main
