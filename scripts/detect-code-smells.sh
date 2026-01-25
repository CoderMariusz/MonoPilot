#!/bin/bash
# detect-code-smells.sh - Identify code smells for refactoring
# Usage: ./scripts/detect-code-smells.sh apps/frontend/lib/services/batch-release-service.ts

FILE="$1"

if [ -z "$FILE" ]; then
    echo "Usage: ./scripts/detect-code-smells.sh FILE"
    echo "Example: ./scripts/detect-code-smells.sh apps/frontend/lib/services/batch-release-service.ts"
    exit 1
fi

if [ ! -f "$FILE" ]; then
    echo "Error: File not found: $FILE"
    exit 1
fi

echo "{"
echo "  \"file\": \"$FILE\","
echo "  \"smells\": {"

# 1. Long functions (>50 lines)
LONG_FUNCS=$(grep -n "function\|async.*{" "$FILE" | while read line; do
    linenum=$(echo "$line" | cut -d: -f1)
    # Count lines to next function or end
    tail -n +$linenum "$FILE" | awk '/^}$/{print NR; exit}' | head -1
done | awk '$1 > 50 {count++} END {print count+0}')
if [ -z "$LONG_FUNCS" ]; then LONG_FUNCS=0; fi

echo "    \"longFunctions\": $LONG_FUNCS,"

# 2. Magic numbers
MAGIC_NUMS=$(grep -oP '\d{2,}' "$FILE" | grep -v "^[12]$" | wc -l)
if [ -z "$MAGIC_NUMS" ]; then MAGIC_NUMS=0; fi
echo "    \"magicNumbers\": $MAGIC_NUMS,"

# 3. Nested conditionals (>3 levels)
NESTED=$(grep -E "if.*if.*if.*if" "$FILE" | wc -l)
if [ -z "$NESTED" ]; then NESTED=0; fi
echo "    \"deepNesting\": $NESTED,"

# 4. TODO/FIXME comments
TODOS=$(grep -c "TODO\|FIXME" "$FILE" 2>/dev/null)
if [ -z "$TODOS" ]; then TODOS=0; fi
echo "    \"todos\": $TODOS,"

# 5. Duplicate string literals
DUPS=$(grep -oP '"[^"]{10,}"' "$FILE" | sort | uniq -d | wc -l)
if [ -z "$DUPS" ]; then DUPS=0; fi
echo "    \"duplicateStrings\": $DUPS,"

# 6. Long lines (>120 chars)
LONG_LINES=$(awk 'length > 120 {count++} END {print count+0}' "$FILE")
if [ -z "$LONG_LINES" ]; then LONG_LINES=0; fi
echo "    \"longLines\": $LONG_LINES"

echo "  },"

# Calculate total smell score
TOTAL=$((LONG_FUNCS * 5 + MAGIC_NUMS * 2 + NESTED * 10 + TODOS * 3 + DUPS * 2 + LONG_LINES))
echo "  \"smellScore\": $TOTAL,"

# Recommend action
if [ $TOTAL -gt 50 ]; then
    echo "  \"recommendation\": \"REFACTOR_NEEDED\""
elif [ $TOTAL -gt 20 ]; then
    echo "  \"recommendation\": \"MINOR_CLEANUP\""
else
    echo "  \"recommendation\": \"LOOKS_GOOD\""
fi

echo "}"
