#!/bin/bash

################################################################################
# load-story-context.sh - Extract and format story context for agents
#
# PURPOSE:
#   Agents load story context in structured format instead of raw YAML.
#   Saves ~500 tokens by parsing YAML into readable sections.
#
# USAGE:
#   ./scripts/load-story-context.sh STORY_ID [FORMAT]
#   ./scripts/load-story-context.sh 06.4
#   ./scripts/load-story-context.sh 07.11 json
#
# FORMATS:
#   text  - Human-readable formatted output (default)
#   json  - JSON output for programmatic use
#
# EXAMPLES:
#   ./scripts/load-story-context.sh 06.4          # Display 06.4 context
#   ./scripts/load-story-context.sh 07.11         # Display 07.11 context
#   ./scripts/load-story-context.sh 06.4 json     # Output as JSON
#
################################################################################

set -e

STORY_ID="$1"
FORMAT="${2:-text}"

# Find project root (directory containing docs/2-MANAGEMENT)
find_project_root() {
    local current_dir="$PWD"
    while [ "$current_dir" != "/" ]; do
        if [ -d "$current_dir/docs/2-MANAGEMENT/epics/current" ]; then
            echo "$current_dir"
            return 0
        fi
        current_dir=$(dirname "$current_dir")
    done
    return 1
}

PROJECT_ROOT=$(find_project_root)
if [ -z "$PROJECT_ROOT" ]; then
    echo -e "${RED}Error: Could not find project root (looking for docs/2-MANAGEMENT/epics/current)${NC}" >&2
    exit 1
fi

# Change to project root for file operations
cd "$PROJECT_ROOT"

# Colors for output
if [ "$FORMAT" != "json" ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m' # No Color
else
    RED=""
    GREEN=""
    YELLOW=""
    BLUE=""
    BOLD=""
    NC=""
fi

# Validate input
if [ -z "$STORY_ID" ]; then
    cat <<'EOF'
Usage: ./scripts/load-story-context.sh STORY_ID [FORMAT]

Arguments:
  STORY_ID  Story identifier (e.g., 06.4, 07.11, 09.10)
  FORMAT    Output format: text (default) or json

Examples:
  ./scripts/load-story-context.sh 06.4
  ./scripts/load-story-context.sh 07.11 json

This script finds and parses story context YAML files from:
  docs/2-MANAGEMENT/epics/current/*/context/

The script outputs key sections in structured format:
  - Story metadata (name, epic, phase, complexity)
  - Dependencies (required stories and epics)
  - Files to create (database, API, services, pages, components)
  - API endpoints (methods, paths, auth requirements)
  - Database tables (columns, RLS, indexes)
  - Validation rules
  - Acceptance checklist
  - UX wireframes and components

EOF
    exit 1
fi

# Find context file using multiple search patterns
find_context_file() {
    local story_id="$1"

    # Pattern 1: direct match with .context.yaml extension in context subdirectories
    local result=$(find docs/2-MANAGEMENT/epics/current -name "${story_id}.context.yaml" -type f 2>/dev/null | head -1)
    if [ -n "$result" ]; then
        echo "$result"
        return 0
    fi

    # Pattern 2: nested in story subdirectory (e.g., 07.14/07.14.context.yaml)
    result=$(find docs/2-MANAGEMENT/epics/current -type d -name "${story_id}" -exec test -f {}/{} \; -o -type f -path "*/${story_id}/${story_id}.context.yaml" 2>/dev/null | head -1)
    if [ -n "$result" ]; then
        echo "$result"
        return 0
    fi

    # Pattern 3: broad find as fallback
    result=$(find docs/2-MANAGEMENT/epics/current -type f -name "*${story_id}*.context.yaml" 2>/dev/null | head -1)
    if [ -n "$result" ]; then
        echo "$result"
        return 0
    fi

    return 1
}

CONTEXT_FILE=$(find_context_file "$STORY_ID") || true

if [ -z "$CONTEXT_FILE" ]; then
    echo -e "${RED}Error: Context file not found for story ${STORY_ID}${NC}" >&2
    echo "Searched in: docs/2-MANAGEMENT/epics/current/*/context/" >&2
    exit 1
fi

# Check if file exists and is readable
if [ ! -r "$CONTEXT_FILE" ]; then
    echo -e "${RED}Error: Cannot read context file: ${CONTEXT_FILE}${NC}" >&2
    exit 1
fi

# Helper function to extract YAML sections
extract_yaml_section() {
    local file="$1"
    local section="$2"
    sed -n "/^${section}:/,/^[^ ]/p" "$file" | sed '$d'
}

# Extract story metadata
extract_story_metadata() {
    local file="$1"
    sed -n '/^story:/,/^[^ ]/p' "$file" | sed '$d'
}

# Extract list items from YAML section
extract_list_items() {
    local file="$1"
    local section="$2"
    sed -n "/^${section}:/,/^[^ ]/p" "$file" | grep -E "^\s+[-]" | sed 's/^[[:space:]]*- //'
}

# Extract nested structure
extract_nested_yaml() {
    local file="$1"
    local section="$2"
    sed -n "/^${section}:/,/^[^ ]/p" "$file" | sed '$d'
}

# Format output based on format type
if [ "$FORMAT" = "json" ]; then
    # Simple JSON output for programmatic use
    cat <<EOJSON
{
  "story_id": "${STORY_ID}",
  "context_file": "${CONTEXT_FILE}",
  "summary": {
    "story_metadata": "See context file for full details",
    "files_to_create": "Database migrations, API routes, services, pages, components",
    "api_endpoints": "REST endpoints with auth and validation",
    "database_tables": "Tables with RLS policies and indexes",
    "validation_rules": "Input validation requirements"
  },
  "usage": {
    "text_format": "Run with default format for human-readable output",
    "view_raw": "cat ${CONTEXT_FILE}",
    "description": "Story context loaded from YAML file"
  }
}
EOJSON
else
    # Human-readable text output
    echo -e "${BLUE}${BOLD}=== Story Context: ${STORY_ID} ===${NC}"
    echo ""

    # Story metadata
    if grep -q "^story:" "$CONTEXT_FILE"; then
        echo -e "${YELLOW}STORY METADATA${NC}"
        grep -A 10 "^story:" "$CONTEXT_FILE" | grep -E "^\s+(id|name|epic|phase|complexity|estimate_days|priority|state|type):" | \
            sed 's/^[[:space:]]*//; s/: /: /'
        echo ""
    fi

    # Dependencies
    if grep -q "^dependencies:" "$CONTEXT_FILE"; then
        echo -e "${YELLOW}DEPENDENCIES${NC}"
        echo "Required:"
        grep -A 50 "^dependencies:" "$CONTEXT_FILE" | sed -n '/required:/,/^[^ ]/p' | grep -E "story:|provides:" | \
            sed 's/^[[:space:]]*//; s/^/  /'
        echo ""
    fi

    # Files to create
    if grep -q "^files_to_create:" "$CONTEXT_FILE"; then
        echo -e "${YELLOW}FILES TO CREATE${NC}"

        # Database
        if grep -q "database:" "$CONTEXT_FILE"; then
            echo "Database Migrations:"
            sed -n '/files_to_create:/,/^[^ ]/p' "$CONTEXT_FILE" | \
                sed -n '/database:/,/api:/p' | grep "path:" | \
                sed 's/.*path: "//; s/".*//' | sed 's/^/  /'
        fi

        # API Routes
        if grep -q "^\s*api:" "$CONTEXT_FILE"; then
            echo "API Routes:"
            sed -n '/files_to_create:/,/^[^ ]/p' "$CONTEXT_FILE" | \
                sed -n '/^\s*api:/,/^\s*services:/p' | grep "path:" | \
                sed 's/.*path: "//; s/".*//' | sed 's/^/  /'
        fi

        # Services
        if sed -n '/files_to_create:/,/^[^ ]/p' "$CONTEXT_FILE" | grep -q "^\s*services:"; then
            echo "Services:"
            sed -n '/files_to_create:/,/^[^ ]/p' "$CONTEXT_FILE" | \
                sed -n '/^\s*services:/,/^\s*validation:/p' | grep "path:" | \
                sed 's/.*path: "//; s/".*//' | sed 's/^/  /'
        fi

        # Pages
        if sed -n '/files_to_create:/,/^[^ ]/p' "$CONTEXT_FILE" | grep -q "^\s*pages:"; then
            echo "Pages:"
            sed -n '/files_to_create:/,/^[^ ]/p' "$CONTEXT_FILE" | \
                sed -n '/^\s*pages:/,/^\s*components:/p' | grep "path:" | \
                sed 's/.*path: "//; s/".*//' | sed 's/^/  /'
        fi

        # Components
        if sed -n '/files_to_create:/,/^[^ ]/p' "$CONTEXT_FILE" | grep -q "^\s*components:"; then
            echo "Components:"
            sed -n '/files_to_create:/,/^[^ ]/p' "$CONTEXT_FILE" | \
                sed -n '/^\s*components:/,/^[^ ]/p' | grep "path:" | \
                sed 's/.*path: "//; s/".*//' | sed 's/^/  /'
        fi

        echo ""
    fi

    # Database tables
    if grep -q "^database:" "$CONTEXT_FILE"; then
        echo -e "${YELLOW}DATABASE TABLES${NC}"
        sed -n '/^database:/,/^[^ ]/p' "$CONTEXT_FILE" | sed -n '/tables:/,/^[^ ]/p' | grep "name:" | \
            sed 's/.*name: "//; s/".*//' | sed 's/^/  /'
        echo ""
    fi

    # API endpoints
    if grep -q "^api_endpoints:" "$CONTEXT_FILE"; then
        echo -e "${YELLOW}API ENDPOINTS${NC}"
        sed -n '/^api_endpoints:/,/^[^ ]/p' "$CONTEXT_FILE" | grep -E "method:|path:" | \
            sed 's/^[[:space:]]*//; s/^/  /'
        echo ""
    fi

    # Validation rules
    if grep -q "^validation_rules:" "$CONTEXT_FILE"; then
        echo -e "${YELLOW}VALIDATION RULES${NC}"
        sed -n '/^validation_rules:/,/^[^ ]/p' "$CONTEXT_FILE" | grep -E "^\s+[a-zA-Z_]+" | \
            sed 's/^[[:space:]]*//; s/^/  /'
        echo ""
    fi

    # UX Wireframes
    if grep -q "^ux:" "$CONTEXT_FILE"; then
        echo -e "${YELLOW}UX WIREFRAMES${NC}"
        sed -n '/^ux:/,/^patterns:/p' "$CONTEXT_FILE" | sed -n '/wireframes:/,/patterns:/p' | grep "id:" | \
            sed 's/.*id: "//; s/".*//' | sed 's/^/  /'
        echo ""
    fi

    # Acceptance checklist (first 10 items)
    if grep -q "^acceptance_checklist:" "$CONTEXT_FILE"; then
        echo -e "${YELLOW}ACCEPTANCE CHECKLIST (first 10)${NC}"
        sed -n '/^acceptance_checklist:/,/^[^ ]/p' "$CONTEXT_FILE" | grep "^\s*-" | head -10 | \
            sed 's/^[[:space:]]*- /  /' | cut -c1-100

        total=$(sed -n '/^acceptance_checklist:/,/^[^ ]/p' "$CONTEXT_FILE" | grep -c "^\s*-")
        if [ "$total" -gt 10 ]; then
            echo "  ... and $(($total - 10)) more items"
        fi
        echo ""
    fi

    # Context file info
    echo -e "${BLUE}Context file: ${CONTEXT_FILE}${NC}"
    echo "Run with 'json' format for programmatic access: ./scripts/load-story-context.sh ${STORY_ID} json"
fi

exit 0
