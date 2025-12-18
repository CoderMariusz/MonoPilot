# Services Layer

This directory contains business logic services for the MonoPilot application.

## Overview

Services encapsulate business logic and data access patterns. They provide a clean API for components and API routes to interact with the database and external systems.

**Pattern:** Class-based services with static methods (future refactor may introduce instance-based services with dependency injection).

## Services

### Org Context Service

Provides organization context resolution for authenticated sessions.

**File:** `org-context-service.ts`
**Story:** 01.1 - Org Context + Base RLS

#### Functions

##### `getOrgContext(userId: string): Promise<OrgContext>`

Retrieves the complete organization context for an authenticated user.

**Returns:** Organization context with user details, role, permissions, and org info.

**Throws:**
- `UnauthorizedError` - If userId is undefined or invalid
- `NotFoundError` - If user not found (404, not 403 for security)
- `ForbiddenError` - If user or organization is inactive

**Usage:**
```typescript
import { getOrgContext } from '@/lib/services/org-context-service';

const context = await getOrgContext(session.user.id);
console.log(context.org_id);     // "123e4567-e89b-12d3-a456-426614174000"
console.log(context.role_code);  // "admin"
console.log(context.permissions.settings); // "CRUD"
```

**Performance:** Single query with JOINs - no N+1 problem. Expected response time: <50ms.

##### `validateOrgContext(context: OrgContext): boolean`

Validates organization context structure.

**Returns:** `true` if valid, `false` otherwise.

**Usage:**
```typescript
const context = await getOrgContext(userId);
if (!validateOrgContext(context)) {
  throw new Error('Invalid org context structure');
}
```

##### `deriveUserIdFromSession(): Promise<string>`

Derives user ID from Supabase auth session.

**Returns:** User ID from session.

**Throws:**
- `UnauthorizedError` - If no active session or session expired

**Usage:**
```typescript
// In API route
export async function GET(request: Request) {
  try {
    const userId = await deriveUserIdFromSession();
    const context = await getOrgContext(userId);
    // Use context for org-scoped queries
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### Security

This service is the single source of truth for org_id resolution. All Settings API endpoints MUST use this for tenant isolation (ADR-013).

**Critical:** Always use `context.org_id` for database queries. Never trust client-provided org_id.

**See Also:**
- [ADR-013: RLS Org Isolation Pattern](../../../../docs/1-BASELINE/architecture/decisions/ADR-013-rls-org-isolation-pattern.md)
- [Developer Guide: Using Org Context](../../../../docs/3-ARCHITECTURE/guides/using-org-context.md)
- [API Documentation](../../../../docs/3-ARCHITECTURE/api/settings/context.md)

---

### Permission Service

Provides basic permission checks for admin-only operations.

**File:** `permission-service.ts`
**Story:** 01.1 - Org Context + Base RLS

#### Functions

##### `hasAdminAccess(roleCode: string): boolean`

Checks if user has admin access (owner or admin role).

**Returns:** `true` if user has admin access, `false` otherwise.

**Usage:**
```typescript
const context = await getOrgContext(userId);
if (hasAdminAccess(context.role_code)) {
  // User can modify organization settings
}
```

##### `canModifyOrganization(roleCode: string): boolean`

Checks if user can modify organization settings.

**Returns:** `true` if user can modify organization, `false` otherwise.

**Usage:**
```typescript
if (canModifyOrganization(context.role_code)) {
  // Allow organization update
} else {
  throw new ForbiddenError('Insufficient permissions');
}
```

##### `canModifyUsers(roleCode: string): boolean`

Checks if user can manage users (create, update, delete).

**Returns:** `true` if user can modify users, `false` otherwise.

**Usage:**
```typescript
if (canModifyUsers(context.role_code)) {
  // Allow user creation/update/deletion
}
```

##### `isSystemRole(roleCode: string): boolean`

Checks if role is a system role (immutable, cannot be modified).

**Returns:** `true` if role is a system role, `false` otherwise.

**Usage:**
```typescript
if (isSystemRole(role.code)) {
  // Prevent modification of system role
  throw new ForbiddenError('Cannot modify system roles');
}
```

##### `hasPermission(module: string, operation: 'C'|'R'|'U'|'D', permissions: Record<string, string>): boolean`

Checks if user has permission for specific module and operation.

**Parameters:**
- `module` - Module code (settings, technical, planning, etc.)
- `operation` - CRUD operation: 'C' (Create), 'R' (Read), 'U' (Update), 'D' (Delete)
- `permissions` - User's permissions from role (context.permissions)

**Returns:** `true` if user has permission, `false` otherwise.

**Permission Format:**
```json
{
  "settings": "CRUD",   // Full access
  "technical": "CRUD",  // Full access
  "planning": "CR",     // Create and Read only
  "production": "R",    // Read-only
  "warehouse": "-"      // No access
}
```

**Usage:**
```typescript
const context = await getOrgContext(userId);

if (hasPermission('settings', 'U', context.permissions)) {
  // User can update settings
}

if (hasPermission('production', 'C', context.permissions)) {
  // User can create production orders
}
```

#### Full Implementation

Full permission matrix and custom role management will be completed in Story 01.6.

**See Also:**
- [ADR-012: Role Permission Storage](../../../../docs/1-BASELINE/architecture/decisions/ADR-012-role-permission-storage.md)

---

## Adding New Services

### Service Template

```typescript
/**
 * [Service Name] Service
 * Story: [Story ID] - [Story Name]
 *
 * [Brief description of service purpose]
 */

import { createClient } from '@/lib/supabase/client'
// ... other imports

/**
 * [Function description]
 *
 * [Detailed explanation]
 *
 * @param param1 - [Description]
 * @returns [Description]
 * @throws [Error types and conditions]
 *
 * @example
 * ```typescript
 * const result = await functionName(param1);
 * ```
 */
export async function functionName(param1: string): Promise<ReturnType> {
  // Implementation
}
```

### Service Guidelines

1. **Single Responsibility**: Each service should focus on one domain
2. **Pure Functions**: Services should be stateless and side-effect free (except DB calls)
3. **Error Handling**: Use custom error classes (UnauthorizedError, NotFoundError, etc.)
4. **Documentation**: All public functions must have JSDoc comments
5. **Testing**: Aim for 90%+ unit test coverage
6. **Security**: Always validate inputs and check permissions

### Naming Conventions

- **Files:** `kebab-case-service.ts` (e.g., `org-context-service.ts`)
- **Functions:** `camelCase` (e.g., `getOrgContext`)
- **Exports:** Named exports only (no default exports)

---

## Testing

### Unit Tests

All services should have comprehensive unit tests in `__tests__` directory.

**Example:**
```
lib/services/
├── org-context-service.ts
├── permission-service.ts
└── __tests__/
    ├── org-context-service.test.ts
    ├── permission-service.test.ts
```

### Running Tests

```bash
# Run all service tests
pnpm test:unit services

# Run specific service tests
pnpm test:unit org-context-service

# Run with coverage
pnpm test:unit --coverage
```

### Test Coverage

**Current Coverage:**
- `permission-service.ts`: 100% (25/25 tests passing)
- `org-context-service.ts`: Pending (test fixtures need UUID format fix)

**Target:** 90%+ coverage for all services

---

## Dependencies

### Internal Dependencies

- `@/lib/supabase/client` - Supabase client
- `@/lib/types/*` - TypeScript type definitions
- `@/lib/errors/*` - Custom error classes
- `@/lib/utils/validation` - Input validation utilities
- `@/lib/constants/*` - Application constants

### External Dependencies

- `@supabase/supabase-js` - Supabase JavaScript client

---

## Security Considerations

### Multi-Tenant Isolation

All org-scoped queries MUST filter by `org_id` from org context:

```typescript
const context = await getOrgContext(userId);
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('org_id', context.org_id);  // ← CRITICAL
```

### Permission Checking

Check permissions before expensive operations:

```typescript
if (!hasPermission('module', 'C', context.permissions)) {
  throw new ForbiddenError('Insufficient permissions');
}

// Proceed with operation
await expensiveOperation();
```

### Error Handling

Never expose internal error details:

```typescript
// ❌ BAD
catch (error) {
  throw error;  // Exposes stack trace
}

// ✅ GOOD
catch (error) {
  throw new NotFoundError('Resource not found');
}
```

---

## Performance

### Query Optimization

- Use single queries with JOINs instead of multiple queries (no N+1)
- Filter by indexed columns (org_id, id, etc.)
- Use `.select()` to specify required columns only

**Example:**
```typescript
// ✅ GOOD: Single query with JOIN
const { data } = await supabase
  .from('users')
  .select(`
    id,
    email,
    organizations!inner (name, slug),
    roles!inner (code, name, permissions)
  `)
  .eq('id', userId)
  .single();

// ❌ BAD: Multiple queries (N+1)
const user = await supabase.from('users').select('*').eq('id', userId).single();
const org = await supabase.from('organizations').select('*').eq('id', user.org_id).single();
const role = await supabase.from('roles').select('*').eq('id', user.role_id).single();
```

### Caching Recommendations

**Future Optimization (Phase 2):**
- Cache org context in Redis with 5-minute TTL
- Invalidate cache on user/org/role updates
- Expected performance improvement: 90% reduction in database calls

---

## Related Documentation

- [Developer Guide: Using Org Context](../../../../docs/3-ARCHITECTURE/guides/using-org-context.md)
- [API Documentation](../../../../docs/3-ARCHITECTURE/api/settings/context.md)
- [ADR-013: RLS Org Isolation Pattern](../../../../docs/1-BASELINE/architecture/decisions/ADR-013-rls-org-isolation-pattern.md)
- [ADR-012: Role Permission Storage](../../../../docs/1-BASELINE/architecture/decisions/ADR-012-role-permission-storage.md)

---

**Last Updated:** 2025-12-16
**Maintained By:** Backend Team
