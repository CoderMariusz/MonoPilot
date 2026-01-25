#!/bin/bash
# extract-component-patterns.sh - Find similar component patterns
# Usage: ./scripts/extract-component-patterns.sh DataTable

COMPONENT_TYPE="$1"

if [ -z "$COMPONENT_TYPE" ]; then
    echo "Usage: ./scripts/extract-component-patterns.sh COMPONENT_TYPE"
    echo "Example: ./scripts/extract-component-patterns.sh DataTable"
    echo "         ./scripts/extract-component-patterns.sh Modal"
    exit 1
fi

COMPONENTS_DIR="apps/frontend/components"

echo "{"
echo "  \"componentType\": \"$COMPONENT_TYPE\","
echo "  \"matches\": ["

# Find matching components
first=true
find "$COMPONENTS_DIR" -name "*${COMPONENT_TYPE}*.tsx" -type f 2>/dev/null | while read file; do
    module=$(echo "$file" | sed 's|apps/frontend/components/||' | cut -d'/' -f1)
    name=$(basename "$file" .tsx)

    # Check patterns
    hasDataTable=$(grep -q "DataTable\|useReactTable" "$file" && echo "true" || echo "false")
    hasForm=$(grep -q "useForm\|react-hook-form" "$file" && echo "true" || echo "false")
    hasModal=$(grep -q "Dialog\|DialogContent" "$file" && echo "true" || echo "false")
    hasShadcn=$(grep -q "@/components/ui/" "$file" && echo "true" || echo "false")
    hasLoading=$(grep -q "loading\|isLoading\|isFetching" "$file" && echo "true" || echo "false")
    hasError=$(grep -q "error\|Error\|exception" "$file" && echo "true" || echo "false")

    echo "    {"
    echo "      \"file\": \"$file\","
    echo "      \"module\": \"$module\","
    echo "      \"name\": \"$name\","
    echo "      \"hasDataTable\": $hasDataTable,"
    echo "      \"hasForm\": $hasForm,"
    echo "      \"hasModal\": $hasModal,"
    echo "      \"usesShadcn\": $hasShadcn,"
    echo "      \"hasLoading\": $hasLoading,"
    echo "      \"hasError\": $hasError"
    echo "    },"
done | sed '$ s/,$//'  # Remove trailing comma

echo "  ]"
echo "}"
