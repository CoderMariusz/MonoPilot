#!/bin/bash
# query-table-schema.sh - Extract specific table schema from TABLES.md
# Usage: ./scripts/query-table-schema.sh work_orders
# Purpose: Get schema for specific table without reading full TABLES.md (saves ~2500 tokens)

TABLE_NAME="$1"

if [ -z "$TABLE_NAME" ]; then
    echo "Usage: ./scripts/query-table-schema.sh TABLE_NAME"
    echo "Example: ./scripts/query-table-schema.sh work_orders"
    exit 1
fi

TABLES_FILE=".claude/TABLES.md"

if [ ! -f "$TABLES_FILE" ]; then
    echo "Error: TABLES.md not found at $TABLES_FILE"
    exit 1
fi

# Extract table section (from ### table_name to next ### or ## or end)
# Using awk to find the section
found=0
in_section=0
line_num=0

while IFS= read -r line; do
    ((line_num++))

    # Check if this is the table heading we're looking for
    if [[ "$line" =~ ^###[[:space:]]${TABLE_NAME}$ ]]; then
        in_section=1
        found=1
        echo "$line"
        continue
    fi

    # If we're in the section, print lines until we hit another heading
    if [ "$in_section" = 1 ]; then
        # Stop at next ### or ## heading (not ###+)
        if [[ "$line" =~ ^###[[:space:]] ]] || [[ "$line" =~ ^##[[:space:]] ]]; then
            # Only break if it's not the initial match
            if [ "$found" = 1 ] && [ "$line" != "$1" ]; then
                break
            fi
        fi

        # Stop at --- separator that marks end of table section
        if [[ "$line" =~ ^---$ ]]; then
            echo "$line"
            break
        fi

        echo "$line"
    fi
done < "$TABLES_FILE"

# If table wasn't found, show available tables
if [ "$found" = 0 ]; then
    echo "Table '$TABLE_NAME' not found."
    echo ""
    echo "Available tables:"
    grep "^### " "$TABLES_FILE" | sed 's/^### /  - /' | sort
    exit 1
fi
