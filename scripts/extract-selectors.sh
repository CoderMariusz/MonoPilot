#!/bin/bash
# extract-selectors.sh
# Extracts testable selectors from React/TypeScript components
# Usage:
#   Single file: ./scripts/extract-selectors.sh apps/frontend/components/module/Component.tsx
#   Directory:   ./scripts/extract-selectors.sh apps/frontend/components/module/

set -e

INPUT_PATH="$1"

if [ -z "$INPUT_PATH" ]; then
    echo "Usage: ./scripts/extract-selectors.sh <component-file-or-directory>"
    echo "Examples:"
    echo "  Single file:  ./scripts/extract-selectors.sh apps/frontend/components/shipping/PickListDataTable.tsx"
    echo "  Directory:    ./scripts/extract-selectors.sh apps/frontend/components/shipping/"
    exit 1
fi

# Determine if input is file or directory
if [ -f "$INPUT_PATH" ]; then
    # Single file mode
    FILES=("$INPUT_PATH")
elif [ -d "$INPUT_PATH" ]; then
    # Directory mode - find all .tsx files
    mapfile -t FILES < <(find "$INPUT_PATH" -type f -name "*.tsx" | sort)
    if [ ${#FILES[@]} -eq 0 ]; then
        echo "Error: No .tsx files found in directory: $INPUT_PATH"
        exit 1
    fi
else
    echo "Error: Path not found: $INPUT_PATH"
    exit 1
fi

# Function to extract selectors from a single file
extract_from_file() {
    local file="$1"

    echo "{"
    echo "  \"file\": \"$file\","
    echo "  \"selectors\": {"

    # Extract data-testid attributes
    echo "    \"testIds\": ["
    grep -oP 'data-testid="[^"]*"' "$file" 2>/dev/null | \
        sed 's/data-testid="\([^"]*\)"/      "\1"/' | \
        paste -sd ',' - || echo ""
    echo "    ],"

    # Extract form field names
    echo "    \"formFields\": ["
    grep -oP 'name="[^"]*"' "$file" 2>/dev/null | \
        sed 's/name="\([^"]*\)"/      "\1"/' | \
        paste -sd ',' - || echo ""
    echo "    ],"

    # Extract input IDs
    echo "    \"inputIds\": ["
    grep -oP 'id="[^"]*"' "$file" 2>/dev/null | \
        sed 's/id="\([^"]*\)"/      "\1"/' | \
        paste -sd ',' - || echo ""
    echo "    ],"

    # Extract button text content (simple pattern)
    echo "    \"buttons\": ["
    grep -oP '<Button[^>]*>\s*\K[^<]+' "$file" 2>/dev/null | \
        sed 's/^/      "/' | sed 's/$/",/' | \
        head -10 || echo ""
    echo "    ],"

    # Extract aria-label attributes
    echo "    \"ariaLabels\": ["
    grep -oP 'aria-label="[^"]*"' "$file" 2>/dev/null | \
        sed 's/aria-label="\([^"]*\)"/      "\1"/' | \
        paste -sd ',' - || echo ""
    echo "    ]"

    echo "  }"
    echo "}"
}

# Process files
if [ ${#FILES[@]} -eq 1 ]; then
    # Single file - output JSON directly
    extract_from_file "${FILES[0]}"
else
    # Multiple files - output merged JSON array
    echo "["
    for i in "${!FILES[@]}"; do
        extract_from_file "${FILES[$i]}"
        if [ $i -lt $((${#FILES[@]} - 1)) ]; then
            echo ","
        fi
    done
    echo "]"
fi
