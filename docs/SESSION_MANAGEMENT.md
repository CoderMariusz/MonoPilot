# Session Management Architecture

**Story**: 0.10 - Fix Session Management
**Date**: 2025-11-15
**Status**: Implemented

---

## Overview

MonoPilot uses **Supabase Auth** for authentication with automatic session refresh to prevent users from losing their work during idle periods.

### Key Features

- ✅ **Automatic Session Refresh**: Tokens refresh 10 minutes before expiry
- ✅ **Graceful Expiration Handling**: Redirect to login with preserved return URL
- ✅ **User Info Persistence**: User data remains visible during navigation
- ✅ **Data Loading Stability**: API calls work seamlessly with refreshed tokens
- ✅ **Developer-Friendly Logging**: Clear console logs for debugging

---

## Architecture

### Token Lifecycle

```
User Login
    ↓
Session Created (60 min lifetime)
    ↓
Middleware checks session on each request
    ↓
[50 min mark] → Auto-refresh triggered
    ↓
New tokens issued (another 60 min)
    ↓
User continues working (no interruption)
```

### Middleware Flow

```typescript
Request → Middleware → Check Session
                ↓
        Time until expiry?
                ↓
    [< 10 min] → Refresh Session
                ↓
        Refresh successful?
                ↓
        [Yes] → Continue with new session
                ↓
        [No] → Redirect to /login?returnTo=<current-path>
```

---

## Implementation

### Location

**File**: `apps/frontend/lib/supabase/middleware.ts`

### Key Logic

```typescript
// 1. Get current session
const { data: { session } } = await supabase.auth.getSession();

// 2. Check if refresh needed
if (session) {
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;
  const refreshThreshold = 10 * 60; // 10 minutes

  // 3. Refresh if close to expiry
  if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
    const { data, error } = await supabase.auth.refreshSession();

    if (!error && data.session) {
      // Session refreshed successfully
      refreshedSession = data.session;
    }
  }
}

// 4. Validate user
const { data: { user } } = await supabase.auth.getUser();

// 5. Redirect if no valid session
if (!user) {
  return NextResponse.redirect('/login?returnTo=...');
}
```

### Configuration

**Token Lifetime**: 3600 seconds (60 minutes) - Supabase default
**Refresh Threshold**: 600 seconds (10 minutes) before expiry
**Effective Session Duration**: ~50 minutes between refreshes

---

## Console Logging

### Session Refresh Events

```
Middleware - Session expires in 9 min, refreshing...
Middleware - Session refreshed successfully
```

### Session Expiry

```
Middleware - Session expired, attempting refresh...
Middleware - Session refresh failed for expired session: <error>
```

### Navigation

```
Middleware - Path: /planning User: true Session: true
```

### Debug Mode

To enable verbose logging, check browser console during:
- Page navigation
- API calls
- Session state changes

---

## Testing

### E2E Tests

**File**: `apps/frontend/e2e/13-session-management.spec.ts`

**Scenarios**:
1. **Moderate Idle** - 2 min idle, verify session persists
2. **Console Logging** - Verify middleware logs appear
3. **Token Expiration** - Clear cookies, verify redirect to login
4. **Return URL Preservation** - Verify returnTo parameter set
5. **Data Loading** - Navigate between pages, verify data loads
6. **API Calls** - Verify no 401/403 errors after navigation
7. **User Info Persistence** - Verify user info visible across pages
8. **Loading Spinner** - Verify no persistent spinner after auth

### Manual Testing

**Test 1: Long Idle**
1. Login to app
2. Navigate to Planning or Warehouse
3. Idle for 15 minutes
4. Click around - verify no logout
5. Check console for "Session refreshed" logs

**Test 2: Session Expiry**
1. Login to app
2. Open DevTools → Application → Cookies
3. Delete all `sb-*` cookies
4. Try to navigate to another page
5. Verify redirect to `/login?returnTo=...`

**Test 3: Data Persistence**
1. Login and navigate to Planning
2. View Purchase Orders table (should have data)
3. Idle for 10 minutes
4. Navigate to Warehouse, then back to Planning
5. Verify Purchase Orders still load

---

## Troubleshooting

### Issue: User logged out after 5 minutes

**Cause**: Session not refreshing automatically
**Fix**: Check middleware logs - should see "refreshing..." messages
**Verify**: Middleware file has refresh logic (lines 33-75)

### Issue: Empty tables after idle

**Cause**: API calls failing with expired tokens
**Fix**: Verify session refresh is working
**Debug**: Check Network tab for 401/403 errors

### Issue: User info disappears

**Cause**: User context not updated after refresh
**Fix**: Middleware refresh should automatically update session
**Verify**: Check cookies are being set correctly

### Issue: Infinite redirect loop

**Cause**: Middleware redirecting authenticated users
**Fix**: Check user validation logic (line 79)
**Debug**: Add console.log for user and session status

---

## Best Practices

### For Developers

1. **Always check middleware logs** when debugging auth issues
2. **Test with real idle periods** (5-15 min) not just page loads
3. **Monitor Network tab** for 401/403 errors during testing
4. **Check cookie expiration** in DevTools → Application → Cookies

### For Frontend Code

1. **Don't cache auth state** - always rely on Supabase session
2. **Handle 401 errors gracefully** - redirect to login
3. **Use SWR/React Query** for data fetching (auto-retry on refresh)
4. **Avoid localStorage for session** - cookies only (SSR compatible)

---

## Configuration Options

### Adjust Refresh Threshold

To refresh earlier/later before expiry, modify `refreshThreshold`:

```typescript
const refreshThreshold = 10 * 60; // Current: 10 minutes

// Examples:
const refreshThreshold = 5 * 60;   // More aggressive (5 min)
const refreshThreshold = 20 * 60;  // Less aggressive (20 min)
```

### Token Lifetime

Controlled by Supabase project settings:
- Dashboard → Authentication → Settings
- JWT expiry: 3600 seconds (default)
- Refresh token rotation: Enabled

---

## Related Files

- `apps/frontend/middleware.ts` - Main middleware entry point
- `apps/frontend/lib/supabase/middleware.ts` - Session management logic
- `apps/frontend/lib/api/config.ts` - Supabase configuration
- `apps/frontend/e2e/13-session-management.spec.ts` - E2E tests

---

## Acceptance Criteria (Story 0.10)

| AC | Description | Status |
|----|-------------|--------|
| AC-1 | Session refresh logic implemented | ✅ |
| AC-2 | Token expiration handling | ✅ |
| AC-3 | User info persistence | ✅ |
| AC-4 | Data loading stability | ✅ |
| AC-5 | E2E test coverage | ✅ |
| AC-6 | Developer experience (logs, docs) | ✅ |

---

## Future Improvements

1. **Session Activity Tracking**: Log user activity for analytics
2. **Configurable Refresh Threshold**: Environment variable control
3. **Session Expiry Warning**: Toast notification 5 min before expiry
4. **Remember Me**: Optional 30-day session for trusted devices
5. **Session Metrics**: Track refresh success rate, expiry frequency

---

**Last Updated**: 2025-11-15
**Implemented By**: AI Agent (Claude Sonnet 4.5)
**Reviewed By**: Pending code review
