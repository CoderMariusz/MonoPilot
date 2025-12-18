#!/bin/bash
# Project Analysis Script
# Scans existing project and generates comprehensive audit report
#
# Usage: bash scripts/analyze-project.sh [project-path] [--output output-dir]
# Example: bash scripts/analyze-project.sh /path/to/project --output .claude/migration
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

# Default values
PROJECT_PATH="."
OUTPUT_DIR=".claude/migration"
CURRENT_DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: bash scripts/analyze-project.sh [project-path] [--output output-dir]"
            echo ""
            echo "Arguments:"
            echo "  project-path    Path to project directory (default: current directory)"
            echo "  --output DIR    Output directory for reports (default: .claude/migration)"
            echo "  --help, -h      Show this help message"
            echo ""
            exit 0
            ;;
        *)
            if [ -z "$1" ] || [[ "$1" == -* ]]; then
                shift
            else
                PROJECT_PATH="$1"
                shift
            fi
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

# Detect tech stack
detect_tech_stack() {
    local project_path="$1"
    local stack=""

    # Flutter/Dart
    if [ -f "$project_path/pubspec.yaml" ]; then
        stack="Flutter/Dart"
    # Node.js
    elif [ -f "$project_path/package.json" ]; then
        if grep -q "\"react\"" "$project_path/package.json" 2>/dev/null; then
            stack="React (Node.js)"
        elif grep -q "\"next\"" "$project_path/package.json" 2>/dev/null; then
            stack="Next.js"
        elif grep -q "\"vue\"" "$project_path/package.json" 2>/dev/null; then
            stack="Vue.js"
        else
            stack="Node.js"
        fi
    # Python
    elif [ -f "$project_path/requirements.txt" ] || [ -f "$project_path/setup.py" ] || [ -f "$project_path/pyproject.toml" ]; then
        if [ -f "$project_path/manage.py" ]; then
            stack="Django (Python)"
        else
            stack="Python"
        fi
    # Go
    elif [ -f "$project_path/go.mod" ]; then
        stack="Go"
    # Ruby
    elif [ -f "$project_path/Gemfile" ]; then
        if [ -f "$project_path/config.ru" ]; then
            stack="Ruby on Rails"
        else
            stack="Ruby"
        fi
    # Java
    elif [ -f "$project_path/pom.xml" ] || [ -f "$project_path/build.gradle" ]; then
        stack="Java"
    # Rust
    elif [ -f "$project_path/Cargo.toml" ]; then
        stack="Rust"
    else
        stack="Unknown"
    fi

    echo "$stack"
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

# Get file size in KB
get_file_size_kb() {
    local file="$1"
    if [ -f "$file" ]; then
        local size=$(wc -c < "$file" | tr -d ' ')
        echo "$((size / 1024))"
    else
        echo "0"
    fi
}

# Estimate tokens (rough: 1 token ≈ 4 characters)
estimate_tokens() {
    local file="$1"
    if [ -f "$file" ]; then
        local chars=$(wc -c < "$file" | tr -d ' ')
        echo "$((chars / 4))"
    else
        echo "0"
    fi
}

# Format number with commas
format_number() {
    printf "%'d" "$1" 2>/dev/null || echo "$1"
}

# Main analysis function
main() {
    # Convert to absolute path
    PROJECT_PATH=$(get_abs_path "$PROJECT_PATH")

    # Validate project path
    if [ ! -d "$PROJECT_PATH" ]; then
        print_error "Project directory does not exist: $PROJECT_PATH"
        exit 1
    fi

    # Show banner
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           PROJECT ANALYSIS - AGENT METHODOLOGY PACK        ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    print_info "Project path: $PROJECT_PATH"
    print_info "Output directory: $OUTPUT_DIR"
    echo ""

    # Create output directory
    mkdir -p "$PROJECT_PATH/$OUTPUT_DIR"

    # ============================================================
    # 1. DETECT TECH STACK
    # ============================================================
    print_header "1. Detecting Tech Stack"

    TECH_STACK=$(detect_tech_stack "$PROJECT_PATH")
    print_success "Detected: $TECH_STACK"

    # ============================================================
    # 2. SCAN PROJECT STRUCTURE
    # ============================================================
    print_header "2. Scanning Project Structure"

    print_step "Analyzing directory tree..."

    # Count files by type
    TOTAL_FILES=$(find "$PROJECT_PATH" -type f 2>/dev/null | wc -l | tr -d ' ')
    MD_FILES=$(find "$PROJECT_PATH" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

    print_info "Total files: $(format_number $TOTAL_FILES)"
    print_info "Markdown files: $(format_number $MD_FILES)"

    # ============================================================
    # 3. FIND LARGE FILES
    # ============================================================
    print_header "3. Finding Large Files"

    print_step "Scanning for files >500 lines or >20KB..."

    LARGE_FILES_LIST="$PROJECT_PATH/$OUTPUT_DIR/large-files.tmp"
    > "$LARGE_FILES_LIST"

    # Find large files (excluding common directories)
    find "$PROJECT_PATH" -type f \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        ! -path "*/build/*" \
        ! -path "*/dist/*" \
        ! -path "*/.dart_tool/*" \
        2>/dev/null | while read -r file; do

        lines=$(count_lines "$file")
        size_kb=$(get_file_size_kb "$file")

        if [ "$lines" -gt 500 ] || [ "$size_kb" -gt 20 ]; then
            rel_path="${file#$PROJECT_PATH/}"
            echo "$rel_path|$lines|$size_kb" >> "$LARGE_FILES_LIST"
        fi
    done

    LARGE_FILES_COUNT=$(wc -l < "$LARGE_FILES_LIST" 2>/dev/null | tr -d ' ')
    print_info "Found $LARGE_FILES_COUNT large files"

    # ============================================================
    # 4. ANALYZE DOCUMENTATION
    # ============================================================
    print_header "4. Analyzing Documentation"

    print_step "Scanning markdown files..."

    DOC_FILES_LIST="$PROJECT_PATH/$OUTPUT_DIR/doc-files.tmp"
    > "$DOC_FILES_LIST"

    find "$PROJECT_PATH" -type f -name "*.md" \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        2>/dev/null | while read -r file; do

        lines=$(count_lines "$file")
        size_kb=$(get_file_size_kb "$file")
        rel_path="${file#$PROJECT_PATH/}"

        echo "$rel_path|$lines|$size_kb" >> "$DOC_FILES_LIST"
    done

    print_success "Documentation analysis complete"

    # ============================================================
    # 5. ESTIMATE TOKEN COUNT
    # ============================================================
    print_header "5. Estimating Token Count"

    print_step "Calculating total project tokens..."

    TOTAL_TOKENS=0
    find "$PROJECT_PATH" -type f \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        ! -path "*/build/*" \
        ! -path "*/dist/*" \
        ! -path "*/.dart_tool/*" \
        2>/dev/null | while read -r file; do

        tokens=$(estimate_tokens "$file")
        echo "$tokens"
    done > "$PROJECT_PATH/$OUTPUT_DIR/tokens.tmp"

    TOTAL_TOKENS=$(awk '{s+=$1} END {print s}' "$PROJECT_PATH/$OUTPUT_DIR/tokens.tmp" 2>/dev/null || echo "0")

    print_info "Estimated total tokens: ~$(format_number $TOTAL_TOKENS)"

    # ============================================================
    # 6. GENERATE AUDIT REPORT
    # ============================================================
    print_header "6. Generating Audit Report"

    AUDIT_REPORT="$PROJECT_PATH/$OUTPUT_DIR/AUDIT-REPORT.md"

    print_step "Creating AUDIT-REPORT.md..."

    cat > "$AUDIT_REPORT" << EOF
# Audit Report: $(basename "$PROJECT_PATH")

**Generated:** $CURRENT_DATE
**Project Path:** $PROJECT_PATH

---

## Summary

- **Total files:** $(format_number $TOTAL_FILES)
- **Documentation files:** $(format_number $MD_FILES)
- **Large files (need sharding):** $(format_number $LARGE_FILES_COUNT)
- **Estimated tokens:** ~$(format_number $TOTAL_TOKENS)

---

## Tech Stack

**Detected:** $TECH_STACK

EOF

    # Add package manager info
    if [ "$TECH_STACK" = "Flutter/Dart" ] && [ -f "$PROJECT_PATH/pubspec.yaml" ]; then
        echo "**Package Manager:** pub/Flutter" >> "$AUDIT_REPORT"
        if grep -q "^name:" "$PROJECT_PATH/pubspec.yaml"; then
            PROJECT_NAME=$(grep "^name:" "$PROJECT_PATH/pubspec.yaml" | awk '{print $2}')
            echo "**Project Name:** $PROJECT_NAME" >> "$AUDIT_REPORT"
        fi
    elif [ -f "$PROJECT_PATH/package.json" ]; then
        echo "**Package Manager:** npm/yarn" >> "$AUDIT_REPORT"
    fi

    cat >> "$AUDIT_REPORT" << EOF

---

## Documentation Found

| File | Lines | Size (KB) | Recommendation |
|------|-------|-----------|----------------|
EOF

    # Add documentation files
    if [ -f "$DOC_FILES_LIST" ] && [ -s "$DOC_FILES_LIST" ]; then
        while IFS='|' read -r file lines size; do
            recommendation="Keep"
            if [ "$lines" -gt 500 ] || [ "$size" -gt 20 ]; then
                recommendation="SHARD"
            fi
            echo "| $file | $lines | ${size}KB | $recommendation |" >> "$AUDIT_REPORT"
        done < "$DOC_FILES_LIST"
    else
        echo "| *(No markdown files found)* | - | - | - |" >> "$AUDIT_REPORT"
    fi

    cat >> "$AUDIT_REPORT" << EOF

---

## Large Files (Need Sharding)

These files exceed 500 lines or 20KB and should be split:

| File | Lines | Size (KB) | Action Needed |
|------|-------|-----------|---------------|
EOF

    # Add large files
    if [ -f "$LARGE_FILES_LIST" ] && [ -s "$LARGE_FILES_LIST" ]; then
        while IFS='|' read -r file lines size; do
            action="Split into smaller files"
            if [[ "$file" == *.md ]]; then
                action="Split sections into separate docs"
            fi
            echo "| $file | $lines | ${size}KB | $action |" >> "$AUDIT_REPORT"
        done < "$LARGE_FILES_LIST"
    else
        echo "| *(No large files found)* | - | - | - |" >> "$AUDIT_REPORT"
    fi

    cat >> "$AUDIT_REPORT" << EOF

---

## Recommended Documentation Mapping

Based on your current structure, here's where files should go:

| Current Location | Recommended Location | Reason |
|------------------|---------------------|--------|
EOF

    # Recommend mappings based on common file names
    if [ -f "$PROJECT_PATH/README.md" ]; then
        echo "| README.md | docs/product/overview.md | Product overview |" >> "$AUDIT_REPORT"
    fi

    if [ -f "$PROJECT_PATH/ARCHITECTURE.md" ] || [ -f "$PROJECT_PATH/docs/architecture.md" ]; then
        echo "| ARCHITECTURE.md | docs/architecture/system-design.md | Architecture docs |" >> "$AUDIT_REPORT"
    fi

    if [ -f "$PROJECT_PATH/API.md" ] || [ -f "$PROJECT_PATH/docs/api.md" ]; then
        echo "| API.md | docs/api/api-specs.md | API documentation |" >> "$AUDIT_REPORT"
    fi

    echo "| *(Add more mappings based on your files)* | - | - |" >> "$AUDIT_REPORT"

    cat >> "$AUDIT_REPORT" << EOF

---

## Missing Files

Agent Methodology Pack requires these files:

- [ ] CLAUDE.md - Main project context file
- [ ] PROJECT-STATE.md - Current project state
- [ ] .claude/ structure - Agent definitions and state
- [ ] docs/product/ - Product requirements and overview
- [ ] docs/architecture/ - Technical design and ADRs
- [ ] docs/epics/ - Feature epics
- [ ] docs/stories/ - User stories
- [ ] docs/sprints/ - Sprint planning and progress
- [ ] docs/api/ - API documentation
- [ ] docs/implementation/ - Implementation guides
- [ ] docs/testing/ - Test plans and documentation
- [ ] docs/archive/ - Completed work

---

## Next Steps

### 1. Review This Report
- Examine large files that need splitting
- Review recommended documentation structure mappings
- Identify files to keep, move, or archive

### 2. Create Core Files
\`\`\`bash
# Create CLAUDE.md
cp agent-methodology-pack/templates/CLAUDE.md.template ./CLAUDE.md

# Create PROJECT-STATE.md
cp agent-methodology-pack/templates/PROJECT-STATE.md.template ./PROJECT-STATE.md
\`\`\`

### 3. Set Up Directory Structure
\`\`\`bash
mkdir -p .claude/{agents,patterns,state,workflows}
mkdir -p docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT,5-ARCHIVE}
\`\`\`

### 4. Generate Agent Workspaces
\`\`\`bash
bash agent-methodology-pack/scripts/generate-workspaces.sh
\`\`\`

### 5. Migrate Documentation
Manually move files according to documentation structure recommendations above.

### 6. Validate Setup
\`\`\`bash
bash agent-methodology-pack/scripts/validate-docs.sh
\`\`\`

---

## Analysis Statistics

- **Analysis Date:** $CURRENT_DATE
- **Analysis Tool:** Agent Methodology Pack v1.0
- **Total Files Scanned:** $(format_number $TOTAL_FILES)
- **Total Tokens Estimated:** ~$(format_number $TOTAL_TOKENS)

---

*Generated by analyze-project.sh*
*Report location: $AUDIT_REPORT*
EOF

    print_success "Audit report created: $AUDIT_REPORT"

    # ============================================================
    # 7. GENERATE FILE MAP
    # ============================================================
    print_header "7. Generating File Map"

    FILE_MAP="$PROJECT_PATH/$OUTPUT_DIR/FILE-MAP.md"

    print_step "Creating FILE-MAP.md..."

    cat > "$FILE_MAP" << EOF
# File Map: $(basename "$PROJECT_PATH")

**Generated:** $CURRENT_DATE
**Project Path:** $PROJECT_PATH

---

## All Files

| File | Type | Lines | Size (KB) | Tokens (est.) |
|------|------|-------|-----------|---------------|
EOF

    # Generate file map
    find "$PROJECT_PATH" -type f \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        ! -path "*/build/*" \
        ! -path "*/dist/*" \
        ! -path "*/.dart_tool/*" \
        2>/dev/null | while read -r file; do

        rel_path="${file#$PROJECT_PATH/}"
        ext="${file##*.}"
        lines=$(count_lines "$file")
        size_kb=$(get_file_size_kb "$file")
        tokens=$(estimate_tokens "$file")

        echo "| $rel_path | .$ext | $lines | ${size_kb}KB | ~$tokens |"
    done | sort >> "$FILE_MAP"

    cat >> "$FILE_MAP" << EOF

---

*Generated by analyze-project.sh*
EOF

    print_success "File map created: $FILE_MAP"

    # Clean up temp files
    rm -f "$LARGE_FILES_LIST" "$DOC_FILES_LIST" "$PROJECT_PATH/$OUTPUT_DIR/tokens.tmp"

    # ============================================================
    # COMPLETION SUMMARY
    # ============================================================
    print_header "ANALYSIS COMPLETE"

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          PROJECT ANALYSIS SUCCESSFULLY COMPLETED           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${CYAN}Generated Reports:${NC}"
    echo -e "  ✓ $AUDIT_REPORT"
    echo -e "  ✓ $FILE_MAP"
    echo ""

    echo -e "${CYAN}Project Statistics:${NC}"
    echo -e "  • Tech Stack: $TECH_STACK"
    echo -e "  • Total Files: $(format_number $TOTAL_FILES)"
    echo -e "  • Documentation Files: $(format_number $MD_FILES)"
    echo -e "  • Large Files: $(format_number $LARGE_FILES_COUNT)"
    echo -e "  • Estimated Tokens: ~$(format_number $TOTAL_TOKENS)"
    echo ""

    print_header "NEXT STEPS"

    echo ""
    echo -e "${YELLOW}1. Review the audit report:${NC}"
    echo -e "   cat $AUDIT_REPORT"
    echo ""
    echo -e "${YELLOW}2. Set up directory structure:${NC}"
    echo -e "   mkdir -p .claude/{agents,patterns,state,workflows}"
    echo -e "   mkdir -p docs/{1-BASELINE,2-MANAGEMENT,3-ARCHITECTURE,4-DEVELOPMENT,5-ARCHIVE}"
    echo ""
    echo -e "${YELLOW}3. Generate agent workspaces:${NC}"
    echo -e "   bash scripts/generate-workspaces.sh"
    echo ""

    echo ""
}

# Run main function
main
