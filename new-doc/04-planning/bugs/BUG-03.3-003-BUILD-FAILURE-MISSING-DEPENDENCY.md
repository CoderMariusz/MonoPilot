# BUG-03.3-003: Build Failure - Missing @tanstack/react-table Dependency

**Status**: OPEN
**Severity**: CRITICAL
**Story**: 03.3 (PO CRUD + Lines)
**AC Affected**: AC-01-1, AC-01-2, AC-01-3, AC-01-4 (all list/filter functionality)

---

## Description

The frontend build fails because `@tanstack/react-table` package is not installed. Components in the purchase-orders module attempt to import this package, causing build failure and blocking all QA testing.

---

## Build Error

```
./components/planning/purchase-orders/PODataTable.tsx
Module not found: Can't resolve '@tanstack/react-table'

./components/planning/purchase-orders/POLinesDataTable.tsx
Module not found: Can't resolve '@tanstack/react-table'

> Build failed because of webpack errors
```

---

## Root Cause

Missing dependency in `apps/frontend/package.json`:
- @tanstack/react-table (required for DataTable component pattern used across application)

Package.json has @tanstack/react-query but not @tanstack/react-table:
```json
"@tanstack/react-query": "^5.90.12",
// Missing:
// "@tanstack/react-table": "^8.x.x"
```

---

## How to Reproduce

```bash
cd apps/frontend
npm run build
# OR
pnpm build

# Error output:
# Module not found: Can't resolve '@tanstack/react-table'
```

---

## Impact

**Blocking**:
- npm run build (production build)
- npm run dev (development server)
- All UI testing
- All E2E testing
- QA validation of all UI-related ACs

**Files affected**:
- `components/planning/purchase-orders/PODataTable.tsx`
- `components/planning/purchase-orders/POLinesDataTable.tsx`
- Any other components using react-table patterns

---

## Solution

### Step 1: Install the Missing Package

```bash
cd apps/frontend

# Using pnpm (preferred in this repo)
pnpm add @tanstack/react-table@^8.0.0

# OR using npm
npm install @tanstack/react-table@^8.0.0
```

### Step 2: Verify Installation

```bash
# Check package.json
grep "@tanstack/react-table" package.json

# Should show:
# "@tanstack/react-table": "^8.0.0"
```

### Step 3: Rebuild

```bash
pnpm build
# Should succeed with no webpack errors
```

---

## Version Compatibility

Compatible versions with existing dependencies:
- `@tanstack/react-table@^8.x.x` (latest: 8.20+)
- Works with React 19 (compatible)
- Works with TypeScript 5.x

---

## Testing After Fix

```bash
# 1. Verify build succeeds
pnpm build

# 2. Start dev server
pnpm dev

# 3. Navigate to /planning/purchase-orders
# Should see:
# - PO list page loads
# - PODataTable renders
# - POFilters render
# - KPI cards display
```

---

## Files to Update

1. `apps/frontend/package.json` (add dependency)
2. No code changes required once dependency installed

---

## Related

- AC-01-1: View purchase orders list (cannot test without build)
- AC-01-2: Search POs (cannot test without build)
- AC-01-3: Filter by status (cannot test without build)
- AC-01-4: Pagination (cannot test without build)

---

## Blocking For

- Story 03.3 QA E2E testing
- Cannot pass QA until build succeeds
- Cannot move to documentation phase until E2E tests pass

---

## Notes

This is a simple dependency installation issue. Once installed, should unblock all remaining QA activities.

**Priority**: CRITICAL
**Effort**: 5 minutes
**Impact**: Unblocks entire QA phase
