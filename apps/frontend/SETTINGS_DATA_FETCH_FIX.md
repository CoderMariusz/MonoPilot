# Settings Data Fetch Fix

## Problem Description

When navigating from other pages (like Planning) to Settings, the data in all Settings tabs (Locations, Machines, Allergens, Suppliers, Warehouses, Tax Codes, Routings) would not load, showing empty tables. A full page refresh was required to see the data.

## Root Cause

All settings table components and Planning data hooks were fetching data immediately on component mount using `useEffect(() => { fetchData(); }, [])`, without waiting for the authentication session to be initialized.

When navigating between pages:

1. The component would mount
2. The data fetch would start immediately
3. The Supabase client might not have the auth session cookies properly set yet
4. Row-Level Security (RLS) policies in Supabase would reject the queries
5. The table would remain empty

After a page refresh, the auth session was already initialized before the component mounted, so the data would load successfully.

## Solution

Created a centralized auth-aware data fetching pattern:

### 1. Created `useAuthAwareEffect` Hook

**File:** `apps/frontend/lib/hooks/useAuthAwareEffect.ts`

A custom hook that wraps `useEffect` and waits for the `AuthContext` loading state to be `false` before running the effect. This ensures all API calls happen only after the auth session is ready.

```typescript
export function useAuthAwareEffect(
  effect: () => void | (() => void),
  deps: DependencyList = []
) {
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      console.log('[useAuthAwareEffect] Auth ready, running effect');
      return effect();
    } else {
      console.log('[useAuthAwareEffect] Auth still loading, waiting...');
    }
  }, [authLoading, ...deps]);
}
```

### 2. Updated All Settings Table Components

Updated the following components to use `useAuthAwareEffect` instead of `useEffect`:

- `LocationsTable.tsx` - Locations management
- `MachinesTable.tsx` - Machines management
- `AllergensTable.tsx` - Allergens management
- `WarehousesTable.tsx` - Warehouses management
- `SuppliersTable.tsx` - Suppliers management
- `TaxCodesTable.tsx` - Tax codes management
- `RoutingsTable.tsx` - Routings management

**Change Pattern:**

```typescript
// BEFORE
useEffect(() => {
  async function fetchData() {
    // fetch data
  }
  fetchData();
}, [showToast]);

// AFTER
useAuthAwareEffect(() => {
  async function fetchData() {
    // fetch data
  }
  fetchData();
}, [showToast]);
```

### 3. Updated Planning Data Hooks

Updated the following hooks in `apps/frontend/lib/hooks/useSupabaseData.ts` to check auth loading state:

- `useSupabaseWorkOrders()`
- `useSupabasePurchaseOrders()`
- `useSupabaseTransferOrders()`

**Change Pattern:**

```typescript
export function useSupabaseWorkOrders() {
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to be ready before fetching
    if (authLoading) {
      console.log('[useSupabaseWorkOrders] Auth still loading, waiting...');
      return;
    }

    async function loadData() {
      // fetch data
    }
    loadData();
  }, [authLoading]);
}
```

## Benefits

1. **Reliable Data Loading**: Data now loads consistently when navigating between pages
2. **No More Refresh Required**: Users don't need to refresh the page to see data
3. **Better Error Handling**: Prevents RLS policy errors from failed auth checks
4. **Centralized Pattern**: All data fetching follows the same auth-aware pattern
5. **Debug Logging**: Added console logs to help trace auth state and data loading

## Testing

To test the fix:

1. Start the frontend application
2. Log in with valid credentials
3. Navigate to Planning page
4. Navigate to Settings page
5. Click through all tabs (Locations, Machines, Allergens, etc.)
6. Verify that data loads in all tabs without requiring a page refresh
7. Check browser console for auth readiness logs

## Console Logs

You should see logs like:

```
[useAuthAwareEffect] Auth ready, running effect
[useSupabaseWorkOrders] Auth ready, fetching work orders...
```

If auth is not ready, you'll see:

```
[useAuthAwareEffect] Auth still loading, waiting...
[useSupabaseWorkOrders] Auth still loading, waiting...
```

## Future Improvements

Consider applying this pattern to other components that fetch data on mount, such as:

- Warehouse page tables
- Production page data
- Scanner page data
- Any other component that uses Supabase queries on mount

