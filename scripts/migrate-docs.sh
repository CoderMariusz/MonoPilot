#!/bin/bash
# Documentation Migration Script
# Migrates existing documentation to standard structure
#
# Usage: bash scripts/migrate-docs.sh [source-dir] [options]
# Example: bash scripts/migrate-docs.sh ./old-docs --target docs/ --auto
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
BOLD='\033[1m'

# Default values
SOURCE_DIR=""
TARGET_DIR="docs"
DRY_RUN=false
AUTO_MODE=false
MIGRATION_REPORT_DIR=".claude/migration"
CURRENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Counters
MOVED_COUNT=0
SKIPPED_COUNT=0
ERROR_COUNT=0

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --target)
            TARGET_DIR="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --auto)
            AUTO_MODE=true
            shift
            ;;
        --help|-h)
            cat << EOF
Usage: bash scripts/migrate-docs.sh [source-dir] [options]

Migrates existing documentation to standard structure.

Arguments:
  source-dir      Source directory containing existing docs (required)

Options:
  --target DIR    Target directory (default: docs/)
  --dry-run       Preview migration without making changes
  --auto          Auto-categorize without prompts
  --help, -h      Show this help message

Examples:
  # Interactive migration
  bash scripts/migrate-docs.sh ./old-docs

  # Dry run to preview
  bash scripts/migrate-docs.sh ./old-docs --dry-run

  # Fully automated
  bash scripts/migrate-docs.sh ./old-docs --auto

Documentation Structure:
  docs/
  ├── product/          Product requirements & overview
  ├── architecture/     Technical design & ADRs
  ├── epics/            Epics and features
  ├── stories/          User stories
  ├── sprints/          Sprint planning & progress
  ├── api/              API documentation
  ├── implementation/   Implementation guides
  ├── testing/          Test plans & documentation
  └── archive/          Completed work

Category Detection:
  - "prd", "requirements", "product" → docs/product/
  - "architecture", "design", "adr" → docs/architecture/
  - "epic", "story", "sprint" → docs/{epics|stories|sprints}/
  - "api", "implementation" → docs/{api|implementation}/
  - "research" → docs/research/

EOF
            exit 0
            ;;
        *)
            if [ -z "$SOURCE_DIR" ]; then
                SOURCE_DIR="$1"
            fi
            shift
            ;;
    esac
done

# Validate source directory
if [ -z "$SOURCE_DIR" ]; then
    echo -e "${RED}ERROR: Source directory required${NC}"
    echo "Usage: bash scripts/migrate-docs.sh [source-dir] [options]"
    echo "Try: bash scripts/migrate-docs.sh --help"
    exit 1
fi

if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}ERROR: Source directory does not exist: $SOURCE_DIR${NC}"
    exit 1
fi

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
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

# Detect category from filename and content
detect_category() {
    local file="$1"
    local filename=$(basename "$file" .md)
    local content=""

    # Read first 50 lines for detection
    if [ -f "$file" ]; then
        content=$(head -n 50 "$file" | tr '[:upper:]' '[:lower:]')
    fi

    local filename_lower=$(echo "$filename" | tr '[:upper:]' '[:lower:]')

    # Product & Requirements
    if [[ "$filename_lower" =~ (prd|requirements?|product|vision|roadmap) ]] ||
       echo "$content" | grep -qE "(product requirement|user need|business goal|product vision)"; then
        echo "docs/product"
        return
    fi

    # Architecture
    if [[ "$filename_lower" =~ (architect|design|adr|system|technical) ]] ||
       echo "$content" | grep -qE "(architecture|system design|technical design|architecture decision)"; then
        echo "docs/architecture"
        return
    fi

    # Research
    if [[ "$filename_lower" =~ research ]] ||
       echo "$content" | grep -qE "(research question|research finding|market research)"; then
        echo "docs/research"
        return
    fi

    # Epic
    if [[ "$filename_lower" =~ epic ]] ||
       echo "$content" | grep -qE "^#+ epic [0-9]"; then
        echo "docs/epics"
        return
    fi

    # Story
    if [[ "$filename_lower" =~ story ]] ||
       echo "$content" | grep -qE "^#+ story [0-9]"; then
        echo "docs/stories"
        return
    fi

    # Sprint
    if [[ "$filename_lower" =~ sprint ]] ||
       echo "$content" | grep -qE "^#+ sprint [0-9]"; then
        echo "docs/sprints"
        return
    fi

    # API
    if [[ "$filename_lower" =~ api ]] ||
       echo "$content" | grep -qE "(api endpoint|rest api|graphql)"; then
        echo "docs/api"
        return
    fi

    # Implementation
    if [[ "$filename_lower" =~ (implement|code|dev) ]] ||
       echo "$content" | grep -qE "(implementation detail|code structure)"; then
        echo "docs/implementation"
        return
    fi

    # Testing
    if [[ "$filename_lower" =~ test ]] ||
       echo "$content" | grep -qE "(test case|test plan|testing strategy)"; then
        echo "docs/testing"
        return
    fi

    # Default to archive
    echo "docs/archive"
}

# Suggest filename based on content
suggest_filename() {
    local original="$1"
    local category="$2"
    local basename=$(basename "$original" .md)

    # Convert to lowercase with hyphens
    local suggested=$(echo "$basename" | tr '[:upper:]' '[:lower:]' | tr '_' '-' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g')

    # Add context based on category
    case "$category" in
        "docs/product")
            if [[ ! "$suggested" =~ ^(prd|requirements) ]]; then
                suggested="${suggested}"
            fi
            ;;
        "docs/architecture")
            if [[ ! "$suggested" =~ ^(arch|design|adr) ]]; then
                suggested="${suggested}"
            fi
            ;;
        "docs/epics")
            if [[ ! "$suggested" =~ ^epic ]]; then
                suggested="epic-${suggested}"
            fi
            ;;
        "docs/sprints")
            if [[ ! "$suggested" =~ ^sprint ]]; then
                suggested="sprint-${suggested}"
            fi
            ;;
    esac

    echo "${suggested}.md"
}

# Ask user for confirmation
ask_user() {
    local prompt="$1"
    local default="$2"

    if [ "$AUTO_MODE" = true ]; then
        echo "$default"
        return
    fi

    echo -e "${CYAN}${prompt}${NC}"
    read -r response

    if [ -z "$response" ]; then
        echo "$default"
    else
        echo "$response"
    fi
}

# Update @references in file
update_references() {
    local file="$1"
    local old_path="$2"
    local new_path="$3"

    if [ ! -f "$file" ]; then
        return
    fi

    # Extract relative path from project root
    local old_rel="${old_path#./}"
    local new_rel="${new_path#./}"

    # Update references
    sed -i.bak "s|@${old_rel}|@${new_rel}|g" "$file"
    rm -f "${file}.bak"
}

# Main migration function
main() {
    # Convert to absolute paths
    SOURCE_DIR=$(get_abs_path "$SOURCE_DIR")

    # Show banner
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║              DOCUMENTATION MIGRATION                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN MODE - No files will be moved"
    fi

    if [ "$AUTO_MODE" = true ]; then
        print_info "AUTO MODE - Using automatic categorization"
    fi

    print_info "Source: $SOURCE_DIR"
    print_info "Target: $TARGET_DIR"
    echo ""

    # Create migration report directory
    mkdir -p "$MIGRATION_REPORT_DIR"

    # Check for existing FILE-MAP.md from analyze-project.sh
    FILE_MAP="$MIGRATION_REPORT_DIR/FILE-MAP.md"
    if [ ! -f "$FILE_MAP" ]; then
        print_warning "FILE-MAP.md not found, will scan files directly"
    fi

    # ============================================================
    # 1. SCAN FOR MARKDOWN FILES
    # ============================================================
    print_header "1. Scanning Documentation Files"

    print_step "Finding markdown files in $SOURCE_DIR..."

    # Find all markdown files
    MD_FILES=$(find "$SOURCE_DIR" -type f -name "*.md" 2>/dev/null)
    FILE_COUNT=$(echo "$MD_FILES" | grep -c . || echo "0")

    if [ "$FILE_COUNT" -eq 0 ]; then
        print_error "No markdown files found in $SOURCE_DIR"
        exit 1
    fi

    print_success "Found $FILE_COUNT markdown files"

    # ============================================================
    # 2. CREATE MIGRATION PLAN
    # ============================================================
    print_header "2. Creating Migration Plan"

    print_step "Analyzing files and detecting categories..."

    MIGRATION_PLAN="$MIGRATION_REPORT_DIR/migration-plan.tmp"
    > "$MIGRATION_PLAN"

    echo "$MD_FILES" | while read -r file; do
        if [ -z "$file" ]; then
            continue
        fi

        # Detect category
        category=$(detect_category "$file")

        # Suggest filename
        suggested_name=$(suggest_filename "$file" "$category")

        # Build target path
        target_path="$TARGET_DIR/$category/$suggested_name"

        # Store in plan: source|target|category
        echo "$file|$target_path|$category" >> "$MIGRATION_PLAN"
    done

    # ============================================================
    # 3. DISPLAY MIGRATION PLAN
    # ============================================================
    print_header "3. Migration Plan"

    echo ""
    echo -e "${BOLD}| Source | Target | Action |${NC}"
    echo -e "${BOLD}|--------|--------|--------|${NC}"

    while IFS='|' read -r source target category; do
        rel_source="${source#$SOURCE_DIR/}"
        rel_target="${target#./}"
        echo "| $rel_source | $rel_target | MOVE |"
    done < "$MIGRATION_PLAN"

    echo ""

    # ============================================================
    # 4. CONFIRM MIGRATION
    # ============================================================
    if [ "$DRY_RUN" = false ]; then
        print_header "4. Confirmation"

        echo ""
        response=$(ask_user "Proceed with migration? (y/n): " "n")

        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            print_warning "Migration cancelled by user"
            rm -f "$MIGRATION_PLAN"
            exit 0
        fi
    fi

    # ============================================================
    # 5. EXECUTE MIGRATION
    # ============================================================
    print_header "5. Executing Migration"

    echo ""

    while IFS='|' read -r source target category; do
        rel_source="${source#$SOURCE_DIR/}"
        rel_target="${target#./}"

        print_step "Migrating: $rel_source → $rel_target"

        if [ "$DRY_RUN" = true ]; then
            print_info "  [DRY RUN] Would move file"
            ((MOVED_COUNT++))
            continue
        fi

        # Create target directory
        target_dir=$(dirname "$target")
        if ! mkdir -p "$target_dir" 2>/dev/null; then
            print_error "  Failed to create directory: $target_dir"
            ((ERROR_COUNT++))
            continue
        fi

        # Check if target exists
        if [ -f "$target" ]; then
            print_warning "  Target exists, skipping: $rel_target"
            ((SKIPPED_COUNT++))
            continue
        fi

        # Move file
        if cp "$source" "$target" 2>/dev/null; then
            # Update references in moved file
            update_references "$target" "$source" "$target"

            print_success "  Moved successfully"
            ((MOVED_COUNT++))

            # Remove original
            rm -f "$source"
        else
            print_error "  Failed to move file"
            ((ERROR_COUNT++))
        fi

    done < "$MIGRATION_PLAN"

    # ============================================================
    # 6. UPDATE REFERENCES IN EXISTING FILES
    # ============================================================
    if [ "$DRY_RUN" = false ]; then
        print_header "6. Updating References"

        print_step "Scanning for @references in existing files..."

        # Update references in CLAUDE.md
        if [ -f "CLAUDE.md" ]; then
            while IFS='|' read -r source target category; do
                update_references "CLAUDE.md" "$source" "$target"
            done < "$MIGRATION_PLAN"
            print_success "Updated CLAUDE.md"
        fi

        # Update references in all .md files
        ref_count=0
        find "$TARGET_DIR" -type f -name "*.md" 2>/dev/null | while read -r file; do
            while IFS='|' read -r source target category; do
                update_references "$file" "$source" "$target"
            done < "$MIGRATION_PLAN"
            ((ref_count++))
        done

        if [ $ref_count -gt 0 ]; then
            print_success "Updated references in $ref_count files"
        fi
    fi

    # ============================================================
    # 7. GENERATE MIGRATION REPORT
    # ============================================================
    print_header "7. Generating Migration Report"

    REPORT_FILE="$MIGRATION_REPORT_DIR/MIGRATION-REPORT.md"

    cat > "$REPORT_FILE" << EOF
# Migration Report

**Date:** $CURRENT_DATE
**Source:** $SOURCE_DIR
**Target:** $TARGET_DIR
**Mode:** $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")

---

## Summary

- **Files Moved:** $MOVED_COUNT
- **Files Skipped:** $SKIPPED_COUNT
- **Errors:** $ERROR_COUNT
- **Total Processed:** $FILE_COUNT

---

## Migration Details

| Source | Target | Status |
|--------|--------|--------|
EOF

    while IFS='|' read -r source target category; do
        rel_source="${source#$SOURCE_DIR/}"
        rel_target="${target#./}"

        if [ -f "$target" ]; then
            status="✅ Moved"
        elif [ "$DRY_RUN" = true ]; then
            status="⏸️ Dry run"
        else
            status="❌ Failed"
        fi

        echo "| $rel_source | $rel_target | $status |" >> "$REPORT_FILE"
    done < "$MIGRATION_PLAN"

    cat >> "$REPORT_FILE" << EOF

---

## Category Distribution

| Category | Count |
|----------|-------|
EOF

    # Count by category
    awk -F'|' '{print $3}' "$MIGRATION_PLAN" | sort | uniq -c | while read -r count cat; do
        echo "| $cat | $count |" >> "$REPORT_FILE"
    done

    cat >> "$REPORT_FILE" << EOF

---

## Next Steps

1. **Review Migration**
   - Check moved files in target directories
   - Verify @references are updated correctly
   - Confirm categorization is accurate

2. **Validate Structure**
   \`\`\`bash
   bash scripts/validate-docs.sh
   \`\`\`

3. **Update Project State**
   - Update CLAUDE.md if needed
   - Update PROJECT-STATE.md with new structure
   - Commit changes to version control

4. **Clean Up Source**
   - Remove empty directories in source
   - Archive or delete original source directory

---

*Generated by migrate-docs.sh*
*Report location: $REPORT_FILE*
EOF

    print_success "Migration report saved: $REPORT_FILE"

    # Clean up
    rm -f "$MIGRATION_PLAN"

    # ============================================================
    # COMPLETION SUMMARY
    # ============================================================
    print_header "MIGRATION COMPLETE"

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║        DOCUMENTATION MIGRATION COMPLETED                   ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}Migration Summary:${NC}"
    echo -e "  ${GREEN}✅ Moved: $MOVED_COUNT${NC}"
    echo -e "  ${YELLOW}⚠️  Skipped: $SKIPPED_COUNT${NC}"
    echo -e "  ${RED}❌ Errors: $ERROR_COUNT${NC}"
    echo ""

    echo -e "${CYAN}Report Location:${NC}"
    echo -e "  $REPORT_FILE"
    echo ""

    print_header "NEXT STEPS"

    echo ""
    echo -e "${YELLOW}1. Review migration report:${NC}"
    echo -e "   cat $REPORT_FILE"
    echo ""
    echo -e "${YELLOW}2. Validate documentation structure:${NC}"
    echo -e "   bash scripts/validate-migration.sh"
    echo ""
    echo -e "${YELLOW}3. Update project files:${NC}"
    echo -e "   - Review CLAUDE.md for outdated references"
    echo -e "   - Update PROJECT-STATE.md if needed"
    echo ""

    if [ "$ERROR_COUNT" -gt 0 ]; then
        exit 1
    fi

    echo ""
}

# Run main function
main
