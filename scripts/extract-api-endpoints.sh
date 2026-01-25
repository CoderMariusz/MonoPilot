#!/bin/bash

##############################################################################
# extract-api-endpoints.sh - Extract API endpoints from Next.js route files
#
# Purpose:
#   Auto-extract all API endpoints from route.ts files in the Next.js app.
#   Generates JSON with path, HTTP methods, auth requirement, and file location.
#   Useful for test-writer to quickly understand API surface.
#
# Usage:
#   ./scripts/extract-api-endpoints.sh [API_DIR]
#   ./scripts/extract-api-endpoints.sh apps/frontend/app/api
#   ./scripts/extract-api-endpoints.sh apps/frontend/app/api/quality
#
# Output:
#   JSON file with all endpoints, suitable for further processing
#
# Examples:
#   ./scripts/extract-api-endpoints.sh apps/frontend/app/api > endpoints.json
#   ./scripts/extract-api-endpoints.sh apps/frontend/app/api/quality | jq '.'
#
##############################################################################

API_DIR="${1:-apps/frontend/app/api}"

# Validate API_DIR exists
if [ ! -d "$API_DIR" ]; then
  echo "Error: Directory '$API_DIR' not found" >&2
  exit 1
fi

# Count total files for progress tracking
TOTAL_FILES=$(find "$API_DIR" -name "route.ts" -type f | wc -l)
CURRENT_FILE=0

# Start JSON
echo "{"
echo "  \"metadata\": {"
echo "    \"api_dir\": \"$API_DIR\","
echo "    \"total_files\": $TOTAL_FILES,"
echo "    \"generated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\""
echo "  },"
echo "  \"endpoints\": ["

# Find all route.ts files and extract metadata
find "$API_DIR" -name "route.ts" -type f | sort | while read -r file; do
  CURRENT_FILE=$((CURRENT_FILE + 1))

  # Extract path from file location
  # Example: apps/frontend/app/api/quality/inspections/route.ts
  # Becomes: /api/quality/inspections
  path=$(echo "$file" | sed 's|^.*/app||' | sed 's|/route\.ts$||')

  # Extract HTTP methods (GET, POST, PUT, DELETE, PATCH)
  # Look for: export async function GET | export const GET | export function GET
  methods=$(grep -h 'export' "$file" 2>/dev/null | grep -E 'GET|POST|PUT|DELETE|PATCH' | \
            grep -oE '(GET|POST|PUT|DELETE|PATCH)' | \
            sort -u | \
            paste -sd ',' - 2>/dev/null || echo "")

  # Check for authentication requirement
  # Look for: getAuthContext, getUser, session, auth, unauthorized, Unauthorized
  auth="false"
  if grep -qi "getAuthContext\|getUser\|session\|unauthorized" "$file" 2>/dev/null; then
    auth="true"
  fi

  # Build methods JSON array
  if [ -n "$methods" ]; then
    methods_json=$(echo "$methods" | sed 's/,/", "/g' | sed 's/^/"/' | sed 's/$/"/')
  else
    methods_json=""
  fi

  # Only output if methods were found
  if [ -n "$methods" ]; then
    printf '    {\n'
    printf '      "path": "%s",\n' "$path"
    printf '      "methods": [%s],\n' "$methods_json"
    printf '      "auth_required": %s,\n' "$auth"
    printf '      "file": "%s"\n' "$file"
    printf '    },\n'
  fi
done | sed '$ s/,$//'  # Remove trailing comma from last endpoint

echo "  ]"
echo "}"
