# Technical Debt

## API Routes - Next.js 15 Async Params Migration

**Priority:** Low
**Created:** 2025-11-23
**Affected Files:**
- `apps/frontend/app/api/technical/routings/[id]/operations/[operationId]/route.ts`
- `apps/frontend/app/api/technical/routings/[id]/products/route.ts`
- `apps/frontend/app/api/technical/routings/[id]/operations/route.ts` (partial)

**Issue:**
Next.js 15 changed params from synchronous objects to Promises. Some API route handlers have malformed async param destructuring that needs to be cleaned up.

**Expected Pattern:**
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ... rest of handler
}
```

**Current State:**
Files have syntax errors from incomplete migration. Functionality is not affected as these routes are new and haven't been deployed yet.

**Effort:** ~30 minutes
**Risk:** Low - isolated to 3 files, clear fix pattern
