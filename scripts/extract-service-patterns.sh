#!/bin/bash
# extract-service-patterns.sh - Find similar service patterns
# Usage: ./scripts/extract-service-patterns.sh batch-release

SERVICE_NAME="$1"

if [ -z "$SERVICE_NAME" ]; then
    echo "Usage: ./scripts/extract-service-patterns.sh SERVICE_NAME"
    echo "Example: ./scripts/extract-service-patterns.sh batch-release"
    exit 1
fi

SERVICES_DIR="apps/frontend/lib/services"

# Find service file
SERVICE_FILE=$(find "$SERVICES_DIR" -name "*${SERVICE_NAME}*.ts" -o -name "*${SERVICE_NAME}*-service.ts" | head -1)

if [ -z "$SERVICE_FILE" ]; then
    echo "Service not found. Available services:"
    ls "$SERVICES_DIR"/*.ts | xargs -n1 basename | sed 's/-service.ts//' | sed 's/^/  - /'
    exit 1
fi

echo "{"
echo "  \"service\": \"$SERVICE_NAME\","
echo "  \"file\": \"$SERVICE_FILE\","
echo "  \"patterns\": {"

# Extract class name
echo "    \"className\": \""$(grep -oP 'class \K\w+' "$SERVICE_FILE" | head -1)"\","

# Extract static methods
echo "    \"staticMethods\": ["
grep -oP 'static async \K\w+' "$SERVICE_FILE" | sed 's/^/      "/' | sed 's/$/",/' | head -10
echo "    ],"

# Check for Supabase usage
echo "    \"usesSupabase\": "$(grep -q "createClient\|supabase" "$SERVICE_FILE" && echo "true" || echo "false")","

# Check for Redis usage
echo "    \"usesRedis\": "$(grep -q "redis\|cache" "$SERVICE_FILE" && echo "true" || echo "false")","

# Extract error handling pattern
echo "    \"errorHandling\": \""$(grep -oP 'throw new \K\w+Error' "$SERVICE_FILE" | head -1 || echo "standard")"\""

echo "  },"

# Find similar services (same imports/patterns)
echo "  \"similarServices\": ["
grep -l "createClient" "$SERVICES_DIR"/*.ts 2>/dev/null | grep -v "$SERVICE_FILE" | head -3 | xargs -n1 basename | sed 's/^/    "/' | sed 's/$/",/'
echo "  ]"
echo "}"
