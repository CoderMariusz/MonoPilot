# ADR-018: API Error Handling and Authentication Standardization

**Date**: 2025-12-31
**Status**: Accepted
**Context**: Story 03.10 - Work Order CRUD Refactoring
**Scope**: API Routes (`apps/frontend/app/api/`)

## Problem

API routes had significant code duplication across endpoints:

1. **Error Handling**: Each route duplicated try-catch-error-response logic
   - ZodError handling (400)
   - Service error handling (varies)
   - Unknown error handling (500)
   - 50-100 lines of boilerplate per endpoint

2. **Authentication**: Each route duplicated auth and role checking
   - Session check (401)
   - User lookup (404)
   - Role extraction
   - Permission validation (403)
   - 30-50 lines of boilerplate per endpoint

3. **Response Format**: Inconsistent success response structure
   - Some routes used `{ success: true, data }` envelope
   - Others returned data directly
   - Meta/pagination placement varied

## Decision

Created **standardized helpers** for API routes:

### 1. Error Handler (`lib/api/error-handler.ts`)

```typescript
// Single function handles all error types
handleApiError(error: unknown, context?: string): NextResponse

// Specific error responses
unauthorizedResponse()
forbiddenResponse(message?)
notFoundResponse(message?)
userNotFoundResponse()

// Success response builder
successResponse<T>(data?, options?: { status, message, meta })
```

**Handles**:
- `AuthError` → 401/403
- `ZodError` → 400 with validation details
- `WorkOrderError` (service errors) → varies
- Unknown errors → 500 with logging

**Format**: All responses use `{ success: true/false, error/data, meta? }` envelope

### 2. Auth Helpers (`lib/api/auth-helpers.ts`)

```typescript
// Throwing versions (use with try-catch)
getAuthContextOrThrow(supabase): Promise<AuthContext>
requireRole(userRole, allowedRoles): void

// Combined helper
getAuthContextWithRole(supabase, allowedRoles): Promise<AuthContext>

// Standard role sets
RoleSets.WORK_ORDER_WRITE
RoleSets.WORK_ORDER_DELETE
RoleSets.WORK_ORDER_TRANSITION
RoleSets.ADMIN_ONLY
```

**Custom Errors**:
- `AuthError` class with code + status
- Integrates with `handleApiError()`

### 3. Refactored API Route Pattern

**Before** (100+ lines):
```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // 40 lines of auth boilerplate
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json(...)
    const { data: user } = await supabase.from('users')...
    if (!user) return NextResponse.json(...)
    const role = user.role.code
    if (!allowedRoles.includes(role)) return NextResponse.json(...)

    // Business logic
    const body = await request.json()
    const validated = schema.parse(body)
    const result = await Service.create(...)

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    // 50 lines of error handling
    if (error instanceof ZodError) return NextResponse.json(...)
    if (error instanceof ServiceError) return NextResponse.json(...)
    return NextResponse.json(...)
  }
}
```

**After** (15 lines):
```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // One line auth + RBAC
    const { orgId, userId } = await getAuthContextWithRole(
      supabase,
      RoleSets.WORK_ORDER_WRITE
    )

    // Business logic
    const body = await request.json()
    const validated = schema.parse(body)
    const result = await Service.create(supabase, orgId, userId, validated)

    return successResponse(result, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/work-orders')
  }
}
```

**Reduction**: ~85% less boilerplate, clearer intent

## Refactored Routes (Story 03.10)

Applied to 8 work order endpoints:

1. `/api/planning/work-orders` (GET, POST)
2. `/api/planning/work-orders/[id]` (GET, PUT, DELETE)
3. `/api/planning/work-orders/[id]/plan` (POST)
4. `/api/planning/work-orders/[id]/release` (POST)
5. `/api/planning/work-orders/[id]/cancel` (POST)
6. `/api/planning/work-orders/[id]/history` (GET)
7. `/api/planning/work-orders/bom-for-date` (GET)
8. `/api/planning/work-orders/next-number` (GET)

**Result**: Reduced from ~1,200 lines to ~350 lines (70% reduction)

## Benefits

### Consistency
- All routes use same error response format
- Standardized auth/RBAC pattern
- Predictable error codes and messages

### Maintainability
- Error handling logic in one place
- Easy to add new error types
- Auth changes require single file update

### Developer Experience
- Less boilerplate to write
- Clear role-based access control
- Self-documenting with RoleSets

### Type Safety
- TypeScript ensures correct error types
- AuthContext typed return
- Success response generic type

## Consequences

### Positive
- 70-85% less code per endpoint
- Easier to test (mock auth/error helpers)
- Consistent API contract for frontend
- Faster endpoint development

### Negative
- Learning curve for new patterns
- Must import helpers in each route
- Breaking change if enum/code changed

### Backward Compatibility
- Old validation schema helpers deprecated (with @deprecated tags)
- Status transition logic stays in service layer
- No breaking changes to API responses (same format maintained)

## Migration Path

For new endpoints:
1. Use `getAuthContextWithRole()` instead of manual auth
2. Use `handleApiError()` in catch block
3. Use `successResponse()` for success cases
4. Use `RoleSets` constants for RBAC

For existing endpoints:
1. Refactor when touching route
2. Maintain backward compatibility
3. Update tests to use new patterns

## Related

- **ADR-013**: RLS Org Isolation Pattern (auth enforces org_id)
- **ADR-007**: Work Order State Machine (used in service layer)
- **Story 03.10**: Work Order CRUD implementation

## Future Considerations

1. **Extend to other modules**: Apply pattern to Settings, Technical, etc.
2. **Generic service errors**: Create base ServiceError class
3. **OpenAPI spec**: Auto-generate from error codes
4. **Rate limiting**: Add middleware layer
5. **Request validation**: Extract query param parsing helper

## Example Usage

See refactored routes in Story 03.10:
- `apps/frontend/app/api/planning/work-orders/route.ts`
- `apps/frontend/app/api/planning/work-orders/[id]/route.ts`
- `apps/frontend/lib/api/error-handler.ts`
- `apps/frontend/lib/api/auth-helpers.ts`
