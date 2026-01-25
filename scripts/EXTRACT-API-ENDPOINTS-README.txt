================================================================================
EXTRACT-API-ENDPOINTS.SH - USAGE GUIDE
================================================================================

QUICK START:
  ./scripts/extract-api-endpoints.sh apps/frontend/app/api/quality

FULL API:
  ./scripts/extract-api-endpoints.sh apps/frontend/app/api

SAVE TO FILE:
  ./scripts/extract-api-endpoints.sh apps/frontend/app/api > endpoints.json

================================================================================
EXAMPLE 1: Extract Quality Module Endpoints
================================================================================

$ ./scripts/extract-api-endpoints.sh apps/frontend/app/api/quality

Output:
  {
    "metadata": {
      "api_dir": "apps/frontend/app/api/quality",
      "total_files": 46,
      "generated_at": "2026-01-24T21:00:29Z"
    },
    "endpoints": [
      {
        "path": "/api/quality/holds/[id]/release",
        "methods": ["PATCH"],
        "auth_required": true,
        "file": "apps/frontend/app/api/quality/holds/[id]/release/route.ts"
      },
      ...
    ]
  }

Result: 46 quality endpoints extracted

================================================================================
EXAMPLE 2: Extract Auth Module Endpoints
================================================================================

$ ./scripts/extract-api-endpoints.sh apps/frontend/app/api/auth

Result: 3 endpoints:
  - POST /api/auth/accept-invitation (public)
  - POST /api/auth/login (auth required)
  - GET /api/auth/me (auth required)

================================================================================
EXAMPLE 3: Full API Extraction
================================================================================

$ ./scripts/extract-api-endpoints.sh apps/frontend/app/api

Result: 482+ endpoints across all modules

================================================================================
FEATURES
================================================================================

✓ Auto-extract all HTTP methods (GET, POST, PUT, DELETE, PATCH)
✓ Detect authentication requirements
✓ Generate valid JSON output
✓ Include file paths for navigation
✓ Works with dynamic routes ([param_name])
✓ Fast extraction (482 files in ~5-10 seconds)

================================================================================
OUTPUT FIELDS
================================================================================

path:          API endpoint path (e.g., /api/quality/holds)
methods:       Array of HTTP methods ["GET", "POST", ...]
auth_required: Boolean indicating if auth is required
file:          Path to route.ts file

================================================================================
INTEGRATION WITH TEST-WRITER
================================================================================

Use this JSON to:
1. Verify all endpoints have tests
2. Generate test templates
3. Document API surface
4. Validate auth coverage
5. Find untested endpoints

See docs/guides/EXTRACT-API-ENDPOINTS.md for full documentation.

================================================================================
