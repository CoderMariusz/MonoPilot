#!/bin/bash
# extract-selectors.sh
# Extracts testable selectors from React/TypeScript components
# Usage: ./scripts/extract-selectors.sh apps/frontend/components/module/Component.tsx

set -e

COMPONENT_FILE="$1"

if [ -z "$COMPONENT_FILE" ]; then
    echo "Usage: ./scripts/extract-selectors.sh <component-file>"
    echo "Example: ./scripts/extract-selectors.sh apps/frontend/components/shipping/PickListDataTable.tsx"
    exit 1
fi

if [ ! -f "$COMPONENT_FILE" ]; then
    echo "Error: File not found: $COMPONENT_FILE"
    exit 1
fi

echo "{"
echo "  \"file\": \"$COMPONENT_FILE\","
echo "  \"selectors\": {"

# Extract data-testid attributes
echo "    \"testIds\": ["
grep -oP 'data-testid="[^"]*"' "$COMPONENT_FILE" 2>/dev/null | \
    sed 's/data-testid="\([^"]*\)"/      "\1"/' | \
    paste -sd ',' - || echo ""
echo "    ],"

# Extract form field names
echo "    \"formFields\": ["
grep -oP 'name="[^"]*"' "$COMPONENT_FILE" 2>/dev/null | \
    sed 's/name="\([^"]*\)"/      "\1"/' | \
    paste -sd ',' - || echo ""
echo "    ],"

# Extract input IDs
echo "    \"inputIds\": ["
grep -oP 'id="[^"]*"' "$COMPONENT_FILE" 2>/dev/null | \
    sed 's/id="\([^"]*\)"/      "\1"/' | \
    paste -sd ',' - || echo ""
echo "    ],"

# Extract button text content (simple pattern)
echo "    \"buttons\": ["
grep -oP '<Button[^>]*>\s*\K[^<]+' "$COMPONENT_FILE" 2>/dev/null | \
    sed 's/^/      "/' | sed 's/$/",/' | \
    head -10 || echo ""
echo "    ],"

# Extract aria-label attributes
echo "    \"ariaLabels\": ["
grep -oP 'aria-label="[^"]*"' "$COMPONENT_FILE" 2>/dev/null | \
    sed 's/aria-label="\([^"]*\)"/      "\1"/' | \
    paste -sd ',' - || echo ""
echo "    ]"

echo "  }"
echo "}"
