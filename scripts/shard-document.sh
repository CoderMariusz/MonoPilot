#!/bin/bash

# shard-document.sh
# Splits a large document into smaller focused files
# Part of the Agent Methodology Pack

set -euo pipefail

# ============================================================================
# COLORS AND FORMATTING
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# ============================================================================
# DEFAULT CONFIGURATION
# ============================================================================

INPUT_FILE=""
OUTPUT_DIR=""
MAX_LINES=300
STRATEGY="heading"
DRY_RUN=false
SHOW_HELP=false

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_header() {
    echo -e "${MAGENTA}${BOLD}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║              DOCUMENT SHARDING TOOL                         ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_help() {
    cat << EOF
${BOLD}USAGE:${NC}
    bash shard-document.sh FILE [OPTIONS]

${BOLD}DESCRIPTION:${NC}
    Splits a large document into smaller focused files for better
    AI context management. Creates an index file and preserves the original.

${BOLD}ARGUMENTS:${NC}
    FILE                File to shard (required)

${BOLD}OPTIONS:${NC}
    --output DIR        Output directory (default: {filename}-sharded/)
    --max-lines NUM     Maximum lines per shard (default: 300)
    --strategy TYPE     Sharding strategy: heading|fixed|smart (default: heading)
    --dry-run           Show what would be done without making changes
    -h, --help          Show this help message

${BOLD}STRATEGIES:${NC}
    heading     Split at ## level headings (keeps sections together)
    fixed       Split at fixed line counts (ignores structure)
    smart       Combine heading + max-lines (split large sections)

${BOLD}EXAMPLES:${NC}
    # Shard using default heading strategy
    bash shard-document.sh docs/architecture.md

    # Use smart strategy with custom max lines
    bash shard-document.sh README.md --strategy smart --max-lines 400

    # Dry run to preview changes
    bash shard-document.sh docs/api.md --dry-run

    # Custom output directory
    bash shard-document.sh guide.md --output docs/guide-parts

${BOLD}OUTPUT STRUCTURE:${NC}
    {filename}-sharded/
    ├── 00-index.md          # Overview + links to all sections
    ├── 01-{section}.md      # First section
    ├── 02-{section}.md      # Second section
    └── ...

    Original file is preserved as {filename}.original

EOF
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local filled=$((width * current / total))
    local empty=$((width - filled))

    printf "\r${CYAN}Progress: [${NC}"
    printf "%${filled}s" | tr ' ' '='
    printf "%${empty}s" | tr ' ' ' '
    printf "${CYAN}] %3d%%${NC}" "$percentage"
}

slugify() {
    local text="$1"
    echo "$text" | \
        tr '[:upper:]' '[:lower:]' | \
        sed 's/[^a-z0-9]/-/g' | \
        sed 's/--*/-/g' | \
        sed 's/^-//' | \
        sed 's/-$//'
}

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            print_help
            exit 0
            ;;
        --output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --max-lines)
            MAX_LINES="$2"
            shift 2
            ;;
        --strategy)
            STRATEGY="$2"
            if [[ ! "$STRATEGY" =~ ^(heading|fixed|smart)$ ]]; then
                log_error "Invalid strategy: $STRATEGY. Use: heading, fixed, or smart"
                exit 1
            fi
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            print_help
            exit 1
            ;;
        *)
            INPUT_FILE="$1"
            shift
            ;;
    esac
done

# ============================================================================
# VALIDATION
# ============================================================================

if [ -z "$INPUT_FILE" ]; then
    log_error "No input file specified"
    print_help
    exit 1
fi

if [ ! -f "$INPUT_FILE" ]; then
    log_error "File not found: $INPUT_FILE"
    exit 1
fi

# Set default output directory if not specified
if [ -z "$OUTPUT_DIR" ]; then
    input_basename=$(basename "$INPUT_FILE" .md)
    input_dir=$(dirname "$INPUT_FILE")
    OUTPUT_DIR="$input_dir/${input_basename}-sharded"
fi

# ============================================================================
# MAIN LOGIC
# ============================================================================

print_header

echo -e "${BOLD}Configuration:${NC}"
echo -e "  Input file:  ${CYAN}$INPUT_FILE${NC}"
echo -e "  Output dir:  ${CYAN}$OUTPUT_DIR${NC}"
echo -e "  Strategy:    ${CYAN}$STRATEGY${NC}"
echo -e "  Max lines:   ${CYAN}$MAX_LINES${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "  Mode:        ${YELLOW}DRY RUN${NC}"
fi
echo ""

# Read input file
log_info "Analyzing document structure..."

total_lines=$(wc -l < "$INPUT_FILE")
log_info "Total lines: $total_lines"

# Find all ## headings
declare -a headings
declare -a heading_lines
declare -a heading_titles

while IFS= read -r line; do
    if [[ "$line" =~ ^##[[:space:]](.+)$ ]]; then
        title="${BASH_REMATCH[1]}"
        heading_titles+=("$title")
    fi
done < "$INPUT_FILE"

if [ ${#heading_titles[@]} -eq 0 ] && [ "$STRATEGY" = "heading" ]; then
    log_warning "No ## headings found, switching to 'smart' strategy"
    STRATEGY="smart"
fi

log_info "Found ${#heading_titles[@]} sections"
echo ""

# ============================================================================
# SHARDING STRATEGY
# ============================================================================

declare -a shard_files
declare -a shard_titles
declare -a shard_line_counts

case $STRATEGY in
    heading)
        log_info "Using HEADING strategy (split at ## headings)..."
        current_shard=0
        current_title=""
        current_content=""
        current_line_count=0

        while IFS= read -r line; do
            if [[ "$line" =~ ^##[[:space:]](.+)$ ]]; then
                # Save previous shard
                if [ -n "$current_content" ] && [ "$current_line_count" -gt 0 ]; then
                    shard_files+=("$current_content")
                    shard_titles+=("$current_title")
                    shard_line_counts+=("$current_line_count")
                fi

                # Start new shard
                current_title="${BASH_REMATCH[1]}"
                current_content="$line"$'\n'
                current_line_count=1
                current_shard=$((current_shard + 1))
            else
                current_content+="$line"$'\n'
                current_line_count=$((current_line_count + 1))
            fi
        done < "$INPUT_FILE"

        # Save last shard
        if [ -n "$current_content" ] && [ "$current_line_count" -gt 0 ]; then
            shard_files+=("$current_content")
            shard_titles+=("$current_title")
            shard_line_counts+=("$current_line_count")
        fi
        ;;

    fixed)
        log_info "Using FIXED strategy (split at $MAX_LINES lines)..."
        current_line=0
        current_shard=0
        current_content=""
        current_line_count=0

        while IFS= read -r line; do
            current_content+="$line"$'\n'
            current_line_count=$((current_line_count + 1))
            current_line=$((current_line + 1))

            if [ "$current_line_count" -ge "$MAX_LINES" ]; then
                shard_files+=("$current_content")
                shard_titles+=("Part $((current_shard + 1))")
                shard_line_counts+=("$current_line_count")

                current_content=""
                current_line_count=0
                current_shard=$((current_shard + 1))
            fi
        done < "$INPUT_FILE"

        # Save last shard
        if [ -n "$current_content" ] && [ "$current_line_count" -gt 0 ]; then
            shard_files+=("$current_content")
            shard_titles+=("Part $((current_shard + 1))")
            shard_line_counts+=("$current_line_count")
        fi
        ;;

    smart)
        log_info "Using SMART strategy (heading + max lines)..."
        current_shard=0
        current_title=""
        current_content=""
        current_line_count=0
        part_counter=1

        while IFS= read -r line; do
            if [[ "$line" =~ ^##[[:space:]](.+)$ ]]; then
                # Check if current shard should be saved
                if [ -n "$current_content" ] && [ "$current_line_count" -gt 0 ]; then
                    shard_files+=("$current_content")
                    shard_titles+=("$current_title")
                    shard_line_counts+=("$current_line_count")
                fi

                # Start new shard
                current_title="${BASH_REMATCH[1]}"
                current_content="$line"$'\n'
                current_line_count=1
                current_shard=$((current_shard + 1))
                part_counter=1
            else
                # Check if we need to split this section
                if [ "$current_line_count" -ge "$MAX_LINES" ] && [ -n "$current_title" ]; then
                    shard_files+=("$current_content")
                    shard_titles+=("$current_title (part $part_counter)")
                    shard_line_counts+=("$current_line_count")

                    part_counter=$((part_counter + 1))
                    current_content="$line"$'\n'
                    current_line_count=1
                else
                    current_content+="$line"$'\n'
                    current_line_count=$((current_line_count + 1))
                fi
            fi
        done < "$INPUT_FILE"

        # Save last shard
        if [ -n "$current_content" ] && [ "$current_line_count" -gt 0 ]; then
            shard_files+=("$current_content")
            shard_titles+=("$current_title")
            shard_line_counts+=("$current_line_count")
        fi
        ;;
esac

log_success "Split into ${#shard_files[@]} shards"
echo ""

# ============================================================================
# PREVIEW SHARDS
# ============================================================================

echo -e "${BOLD}${CYAN}Shard Preview:${NC}"
printf "\n${BOLD}%-5s %-50s %10s${NC}\n" "No." "Title" "Lines"
printf "${DIM}%s${NC}\n" "────────────────────────────────────────────────────────────────────"

for i in "${!shard_titles[@]}"; do
    title="${shard_titles[$i]}"
    lines="${shard_line_counts[$i]}"

    # Truncate title if too long
    if [ ${#title} -gt 48 ]; then
        title="${title:0:45}..."
    fi

    # Color code based on size
    if [ "$lines" -gt "$MAX_LINES" ]; then
        color="$YELLOW"
    else
        color="$GREEN"
    fi

    printf "${color}%02d.   %-50s %10d${NC}\n" "$((i + 1))" "$title" "$lines"
done

echo ""

# ============================================================================
# CREATE OUTPUT
# ============================================================================

if [ "$DRY_RUN" = true ]; then
    log_warning "Dry run mode - no files will be created"
    echo ""
    exit 0
fi

log_info "Creating output directory..."
mkdir -p "$OUTPUT_DIR"

# Backup original file
backup_file="${INPUT_FILE}.original"
if [ ! -f "$backup_file" ]; then
    log_info "Backing up original file to: $backup_file"
    cp "$INPUT_FILE" "$backup_file"
else
    log_warning "Backup already exists: $backup_file"
fi

# Create shard files
log_info "Writing shard files..."

for i in "${!shard_files[@]}"; do
    progress_bar "$((i + 1))" "${#shard_files[@]}"

    title="${shard_titles[$i]}"
    content="${shard_files[$i]}"
    slug=$(slugify "$title")
    filename=$(printf "%02d-%s.md" "$((i + 1))" "$slug")
    filepath="$OUTPUT_DIR/$filename"

    echo -e "$content" > "$filepath"
done

echo "" # New line after progress bar

# ============================================================================
# CREATE INDEX FILE
# ============================================================================

log_info "Creating index file..."

input_basename=$(basename "$INPUT_FILE" .md)
index_file="$OUTPUT_DIR/00-index.md"

cat > "$index_file" << EOF
# $input_basename (Index)

This document has been sharded for better AI context management.

## Sections

EOF

# Add links to all sections
for i in "${!shard_titles[@]}"; do
    title="${shard_titles[$i]}"
    slug=$(slugify "$title")
    filename=$(printf "%02d-%s.md" "$((i + 1))" "$slug")
    lines="${shard_line_counts[$i]}"

    # Extract first sentence or description if available
    description="Section content"

    echo "$((i + 1)). [$title](./$filename) - $lines lines" >> "$index_file"
done

cat >> "$index_file" << EOF

## Quick Stats
- Original: $total_lines lines
- Sharded: ${#shard_files[@]} files
- Largest section: $(printf '%s\n' "${shard_line_counts[@]}" | sort -rn | head -1) lines
- Average section: $((total_lines / ${#shard_files[@]})) lines

## Usage

Each section is self-contained and can be used independently.
Reference this index to navigate between sections.

---
*Sharded by shard-document.sh on $(date +%Y-%m-%d)*
*Original file preserved as: $backup_file*
*Strategy: $STRATEGY | Max lines: $MAX_LINES*
EOF

log_success "Index file created: $index_file"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}✓ SHARDING COMPLETE${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BOLD}Output:${NC}"
echo -e "  Location:    ${CYAN}$OUTPUT_DIR${NC}"
echo -e "  Files:       ${CYAN}$((${#shard_files[@]} + 1))${NC} (${#shard_files[@]} shards + 1 index)"
echo -e "  Backup:      ${CYAN}$backup_file${NC}"
echo ""

echo -e "${BOLD}Statistics:${NC}"
echo -e "  Original:    ${YELLOW}$total_lines lines${NC} in 1 file"
echo -e "  Sharded:     ${GREEN}$total_lines lines${NC} in ${#shard_files[@]} files"

# Calculate estimated token savings
original_tokens=$((total_lines * 25))
# Index file adds ~50 lines
index_lines=50
total_sharded_lines=$((total_lines + index_lines))
sharded_tokens=$((total_sharded_lines * 25))
savings_percent=$(( (original_tokens - (original_tokens / ${#shard_files[@]})) * 100 / original_tokens ))

echo -e "  Token estimate: ${GREEN}~$savings_percent% context savings${NC} per file access"
echo ""

echo -e "${BOLD}Next Steps:${NC}"
echo -e "  1. Review the sharded files in ${CYAN}$OUTPUT_DIR${NC}"
echo -e "  2. Update any links to the original file"
echo -e "  3. Delete or archive the original file: ${DIM}$INPUT_FILE${NC}"
echo ""

log_success "All done!"
exit 0
