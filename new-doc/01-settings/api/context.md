# GET /api/v1/settings/context

Returns the organization context for the authenticated user.

**Story:** 01.1 - Org Context + Base RLS
**Type:** Security-critical foundation endpoint
**Version:** v1

## Overview

This endpoint provides the complete organization context for an authenticated user, including org_id, role, and permissions. It is the foundation for all org-scoped operations and must be called to establish the user's session context.

**Use Case:** Frontend applications call this endpoint after authentication to determine the user's organization, role, and module permissions.

## Authentication

**Required:** Yes (Bearer token)
**Type:** Supabase Auth JWT

```http
Authorization: Bearer {access_token}
```

## Request

### HTTP Method
```http
GET /api/v1/settings/context HTTP/1.1
```

### Headers
```http
Host: monopilot.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Parameters
None

### Query Parameters
None

### Request Body
None

## Response

### Success (200 OK)

Returns the complete organization context for the authenticated user.

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_id": "987fcdeb-51a2-43d7-9876-543210987654",
  "role_code": "admin",
  "role_name": "Administrator",
  "permissions": {
    "settings": "CRUD",
    "technical": "CRUD",
    "planning": "CRUD",
    "production": "CRUD",
    "warehouse": "CRUD",
    "quality": "CRUD",
    "shipping": "CRUD",
    "npd": "CR",
    "finance": "R",
    "oee": "CR",
    "integrations": "R"
  },
  "organization": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "ACME Foods Ltd",
    "slug": "acme-foods",
    "timezone": "Europe/Warsaw",
    "locale": "pl",
    "currency": "PLN",
    "onboarding_step": 6,
    "onboarding_completed_at": "2025-12-10T14:30:00Z",
    "is_active": true
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `org_id` | UUID | Organization UUID (primary tenant identifier) |
| `user_id` | UUID | User UUID (from auth.users) |
| `role_code` | string | Role code (owner, admin, manager, viewer, etc.) |
| `role_name` | string | Human-readable role name |
| `permissions` | object | Module permissions (CRUD operations) |
| `permissions.{module}` | string | Permission string: "CRUD", "CR", "R", or "-" (no access) |
| `organization` | object | Organization details |
| `organization.id` | UUID | Organization UUID |
| `organization.name` | string | Organization name |
| `organization.slug` | string | URL-safe organization identifier |
| `organization.timezone` | string | Organization timezone (IANA format) |
| `organization.locale` | string | Organization locale (ISO 639-1) |
| `organization.currency` | string | Organization currency (ISO 4217) |
| `organization.onboarding_step` | number | Current onboarding step (0-6) |
| `organization.onboarding_completed_at` | string | ISO 8601 timestamp of onboarding completion (null if incomplete) |
| `organization.is_active` | boolean | Organization active status |

### Permission String Format

Permissions use a compact string format:
- `C` - Create
- `R` - Read
- `U` - Update
- `D` - Delete
- `-` - No access

**Examples:**
- `"CRUD"` - Full access (all operations)
- `"CR"` - Create and Read only
- `"R"` - Read-only access
- `"-"` - No access (module disabled for role)

### Errors

#### 401 Unauthorized

Returned when no valid session exists or session has expired.

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
```

```json
{
  "error": "Unauthorized - No active session"
}
```

**Causes:**
- No Authorization header provided
- Invalid or expired JWT token
- Session revoked by user logout

**Resolution:** Redirect user to login page.

#### 403 Forbidden

Returned when user or organization is inactive.

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
```

```json
{
  "error": "User account is inactive"
}
```

or

```json
{
  "error": "Organization is inactive"
}
```

**Causes:**
- User account deactivated by admin
- Organization subscription expired or manually deactivated

**Resolution:** Display appropriate message to user.

#### 404 Not Found

Returned when user record does not exist or cross-tenant access attempted.

```http
HTTP/1.1 404 Not Found
Content-Type: application/json
```

```json
{
  "error": "User not found"
}
```

**Important Security Note:** This endpoint returns 404 (not 403) for cross-tenant access attempts to prevent user enumeration attacks. An attacker cannot determine if a user ID exists in another organization.

**Causes:**
- User record not found in database
- Cross-tenant access attempt (security protection)
- Invalid UUID format in session

**Resolution:** Treat as authentication failure and redirect to login.

#### 500 Internal Server Error

Returned when an unexpected error occurs.

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "error": "Internal server error"
}
```

**Note:** Error details are logged server-side but not exposed to prevent information leakage.

## Usage Examples

### JavaScript/TypeScript (fetch)

```typescript
async function getOrgContext(): Promise<OrgContext> {
  const response = await fetch('/api/v1/settings/context', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/auth/login';
      return;
    }
    throw new Error(`Failed to fetch context: ${response.statusText}`);
  }

  const context = await response.json();
  console.log(`Logged in as ${context.role_name} for ${context.organization.name}`);

  return context;
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

export function useOrgContext() {
  const [context, setContext] = useState<OrgContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchContext() {
      try {
        const response = await fetch('/api/v1/settings/context');

        if (!response.ok) {
          throw new Error('Failed to fetch org context');
        }

        const data = await response.json();
        setContext(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchContext();
  }, []);

  return { context, loading, error };
}
```

### curl

```bash
curl https://api.monopilot.example.com/api/v1/settings/context \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

## Security Considerations

### 1. Tenant Isolation

This endpoint enforces strict tenant isolation using RLS (Row Level Security):
- Returns data only for authenticated user's organization
- Cross-tenant access attempts return 404 (not 403)
- Uses ADR-013 RLS pattern for consistent isolation

### 2. Enumeration Protection

Returns 404 instead of 403 for cross-tenant access to prevent existence enumeration attacks:
```
❌ BAD:  403 Forbidden → Reveals user exists in different org
✅ GOOD: 404 Not Found → Prevents information disclosure
```

### 3. Session Validation

- Validates session existence before database query
- Checks session expiration timestamp
- Returns 401 for expired or invalid sessions

### 4. Input Validation

- Validates user_id UUID format before database query
- Prevents SQL injection via malformed UUIDs
- Uses regex pattern: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

### 5. Rate Limiting

**Recommendation:** Implement rate limiting to prevent abuse:
- Suggested limit: 100 requests per minute per user
- Prevents brute-force attacks
- Priority: MEDIUM (Phase 2)

### 6. Audit Logging

**Recommendation:** Log failed authentication attempts:
- Track 401/403 responses
- Monitor for suspicious patterns
- Priority: LOW (can be added per ADR-008)

## Performance

### Expected Response Time

- Target: <200ms (p95)
- Typical: <50ms (p50)
- Measured overhead: <1ms for RLS policy check

### Query Optimization

This endpoint performs a single JOIN query (no N+1 problem):
```sql
SELECT users.*, organizations.*, roles.*
FROM users
INNER JOIN organizations ON organizations.id = users.org_id
INNER JOIN roles ON roles.id = users.role_id
WHERE users.id = {auth.uid()}
```

**Indexes used:**
- `users.id` (Primary Key - automatic index)
- `users.org_id` (Foreign Key - indexed)
- `users.role_id` (Foreign Key - indexed)

### Caching Recommendations

**Future Optimization (Phase 2):**
- Cache org context in Redis with 5-minute TTL
- Reduce database load by ~90%
- Invalidate cache on user/org/role updates

## Related Endpoints

This is the foundation endpoint for Story 01.1. Related endpoints will be added in future stories:
- `GET /api/v1/settings/organization` (Story 01.2)
- `GET /api/v1/settings/users` (Story 01.6)
- `PUT /api/v1/settings/organization` (Story 01.8)

## Architecture Decision Records

This endpoint implements the following ADRs:

- [ADR-011: Module Toggle Storage](../../../1-BASELINE/architecture/decisions/ADR-011-module-toggle-storage.md) - Module permissions structure
- [ADR-012: Role Permission Storage](../../../1-BASELINE/architecture/decisions/ADR-012-role-permission-storage.md) - JSONB permissions format
- [ADR-013: RLS Org Isolation Pattern](../../../1-BASELINE/architecture/decisions/ADR-013-rls-org-isolation-pattern.md) - Tenant isolation pattern

## Testing

### Manual Testing

```bash
# 1. Get valid access token
TOKEN=$(supabase auth login --email user@example.com | jq -r '.access_token')

# 2. Test endpoint
curl http://localhost:3000/api/v1/settings/context \
  -H "Authorization: Bearer $TOKEN"

# 3. Verify response contains org_id, user_id, role_code, permissions
```

### Automated Testing

See test files:
- Unit tests: `apps/frontend/lib/services/__tests__/org-context-service.test.ts`
- Integration tests: `supabase/tests/rls-isolation.test.sql`

## Changelog

- **2025-12-16:** Initial implementation (Story 01.1)
  - GET endpoint for org context resolution
  - Single query with JOINs (no N+1)
  - Returns 404 for cross-tenant access (security)
  - ADR-013 RLS pattern implemented

## Support

For issues or questions:
- Review [Developer Guide](../../guides/using-org-context.md)
- Check [Migration Documentation](../../database/migrations/01.1-org-context-rls.md)
- Contact backend team for RLS policy issues
