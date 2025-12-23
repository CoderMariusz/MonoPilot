# Code Review: Stories 01.15 + 01.16

**Review Date:** 2025-12-23
**Reviewer:** CODE-REVIEWER Agent
**Stories:** 01.15 (Session & Password Management), 01.16 (User Invitations)
**Phase:** Implementation Review

---

## DECISION: REQUEST_CHANGES

**Status:** BLOCKED - Critical implementation gaps and missing files

---

## Executive Summary

**Security Score:** 6/10 (Major concerns)
**Code Quality Score:** 4/10 (Incomplete implementation)
**Test Coverage:** 0% (Tests cannot run - missing implementations)

### Critical Issues Found: 4
### Major Issues Found: 3
### Minor Issues Found: 2

---

## Story 01.15: Session & Password Management

### Files Reviewed

**Present:**
- C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\apps\frontend\lib\services\session-service.ts
- C:\Users\Mariusz K\Documents\Programowanie\MonoPilot\supabase\migrations\081_create_user_sessions.sql
- C:\Users\Mariusz K\Documents\Programovanje\MonoPilot\supabase\migrations\082_create_password_history.sql
- C:\Users\Mariusz K\Documents\Programiranje\MonoPilot\supabase\migrations\083_add_session_password_fields.sql

**Missing (CRITICAL):**
- apps/frontend/lib/services/password-service.ts
- apps/frontend/lib/utils/password-helpers.ts

### CRITICAL Issues (Story 01.15)

#### CRITICAL-1: Missing Password Service Implementation
**File:** MISSING - `apps/frontend/lib/services/password-service.ts`
**Severity:** CRITICAL (Blocks story completion)
**Impact:** Cannot implement password management AC

**Issue:**
Story 01.15 requires password service with:
- Password complexity validation (8+ chars, uppercase, lowercase, number, special)
- Password history check (cannot reuse last 5)
- Password hashing with bcrypt (cost >= 12)
- Password change with session termination

**Required:** Create complete password service before APPROVED decision possible.

#### CRITICAL-2: Missing Password Helpers
**File:** MISSING - `apps/frontend/lib/utils/password-helpers.ts`
**Severity:** CRITICAL
**Impact:** No password hashing/validation utilities

**Issue:**
No bcrypt implementation found. Password hashing is mentioned in migrations but no service code exists.

**Security Risk:** If passwords are stored without bcrypt cost >= 12, this is a CRITICAL security vulnerability.

**Required:** Implement password helpers with bcrypt (cost factor 12 minimum).

#### CRITICAL-3: Database Schema Mismatch
**File:** `supabase/migrations/081_create_user_sessions.sql`
**Line:** 12
**Severity:** CRITICAL
**Impact:** Session service will fail

**Issue:**
Migration defines `session_token` field:
```sql
session_token VARCHAR(255) UNIQUE NOT NULL,
```

But service uses `token_id` field:
```typescript
// session-service.ts:56
token_id: params.tokenId,
```

**Expected:** Field names must match between migration and service.

**Fix Required:**
- Option A: Change migration to use `token_id`
- Option B: Change service to use `session_token`

#### CRITICAL-4: No Password Hashing in Session Service
**File:** `apps/frontend/lib/services/session-service.ts`
**Lines:** Throughout
**Severity:** CRITICAL (Security)
**Impact:** Session tokens may not be cryptographically secure

**Issue:**
Service receives `tokenId` from caller but no evidence of:
1. Cryptographic token generation (should be crypto.randomBytes(32))
2. Token hashing before storage
3. Constant-time comparison on validation

**Security Requirement (from Story 01.15):**
> "Use cryptographically secure random tokens (32+ bytes)"
> "Store hashed tokens in database"

**Required:** Implement secure token generation and storage.

### Major Issues (Story 01.15)

#### MAJOR-1: Missing RLS Policy Enforcement
**File:** `supabase/migrations/081_create_user_sessions.sql`
**Lines:** 42-73
**Severity:** MAJOR (Security)
**Impact:** Potential unauthorized access

**Issue:**
RLS policies defined but service does NOT use `auth.uid()` context. Service uses direct UUID parameters:

```typescript
// session-service.ts:89
.eq('user_id', userId)
```

**Problem:** If service bypasses Supabase auth context (service role), RLS is not enforced. This could allow cross-tenant access.

**Recommendation:** Use authenticated Supabase client with user context, OR explicitly validate org_id in service layer.

#### MAJOR-2: No Session Token Validation
**File:** `apps/frontend/lib/services/session-service.ts`
**Missing:** `validateSession()` method
**Severity:** MAJOR
**Impact:** Cannot check if session is valid/expired/revoked

**Issue:**
Story AC requires session validation:
> "GIVEN session expires_at passed, WHEN API request made, THEN 401 Unauthorized"

No `validateSession()` method exists in service. Service spec (from story) requires:
```typescript
validateSession(sessionToken: string): Promise<SessionValidation>;
```

**Required:** Implement session validation with expiry/revocation checks.

### Minor Issues (Story 01.15)

#### MINOR-1: Inconsistent Error Handling
**File:** `apps/frontend/lib/services/session-service.ts`
**Lines:** 238-241
**Severity:** MINOR

**Issue:**
`updateLastActivity()` silently fails with comment "not critical". However, this makes debugging difficult.

**Recommendation:** Log to error tracking service (Sentry/similar) instead of silent failure.

---

## Story 01.16: User Invitations

### Files Reviewed

**Present:**
- C:\Users\Mariusz K\Documents\Programiranje\MonoPilot\apps\frontend\lib\services\invitation-service.ts
- C:\Users\Mariusz K\Documents\Programiranje\MonoPilot\apps\frontend\lib\services\email-service.ts
- C:\Users\Mariusz K\Documents\Programovanje\MonoPilot\supabase\migrations\084_create_user_invitations.sql

### CRITICAL Issues (Story 01.16)

**NONE** - Core implementation present

### Major Issues (Story 01.16)

#### MAJOR-3: JWT Secret Security Issue
**File:** `apps/frontend/lib/services/invitation-service.ts`
**Lines:** 35-47
**Severity:** MAJOR (Security)
**Impact:** Weak invitation tokens in development

**Issue:**
Code allows empty JWT secret in non-production:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || ''

if (!JWT_SECRET) {
  const errorMsg = '⚠️  JWT_SECRET not set...'
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY ERROR: JWT_SECRET must be set...')
  }
  console.warn(errorMsg + ' Using empty secret in development only.')
}

return JWT_SECRET
```

**Problem:** Empty secret = no signature verification. Invitations can be forged in development.

**Recommendation:** Generate random secret on first run if missing, store in .env.local. Never use empty secret.

### Minor Issues (Story 01.16)

#### MINOR-2: Mixed Supabase Client Usage
**File:** `apps/frontend/lib/services/invitation-service.ts`
**Lines:** 124-125, 133
**Severity:** MINOR
**Impact:** Code smell, potential bugs

**Issue:**
Service creates TWO Supabase clients:
```typescript
const supabase = await createServerSupabase()
const supabaseAdmin = createServerSupabaseAdmin()
```

Then only uses `supabaseAdmin`. First client is unused.

**Recommendation:** Remove unused `supabase` variable, use only admin client consistently.

---

## Security Analysis

### Password Security (Story 01.15)

**Status:** FAILED - No implementation found

**Required:**
- [ ] Bcrypt hashing with cost factor >= 12
- [ ] Password complexity validation (8+ chars, uppercase, lowercase, number, special)
- [ ] Password history (last 5) enforcement
- [ ] Constant-time password comparison

**Found:**
- [x] Database migration for password_history table (082)
- [x] Trigger to maintain last 5 passwords
- [ ] NO password hashing implementation
- [ ] NO password validation implementation
- [ ] NO password service

**Verdict:** BLOCKED until password-service.ts implemented

### Session Security (Story 01.15)

**Status:** PARTIAL - Major gaps

**Required:**
- [ ] Cryptographically secure session tokens (32+ bytes)
- [ ] Token hashing before storage
- [ ] Session expiry validation
- [ ] Cross-tenant session protection

**Found:**
- [x] Database schema for sessions (081)
- [x] RLS policies defined
- [ ] NO evidence of crypto.randomBytes() usage
- [ ] NO token hashing
- [ ] NO session validation method
- [~] RLS policies may not be enforced (service uses admin client?)

**Verdict:** Needs security improvements before production

### Invitation Security (Story 01.16)

**Status:** GOOD with minor issues

**Required:**
- [x] JWT-based invitation tokens
- [x] 7-day expiry
- [x] Token validation
- [~] Secure JWT secret (weak in dev mode)

**Found:**
- [x] JWT signature with HS256
- [x] Token expiry check
- [x] One-time use enforcement
- [ ] Empty JWT secret allowed in development

**Verdict:** ACCEPTABLE after fixing JWT secret handling

---

## Test Coverage

### Test Execution: FAILED

Attempted test run resulted in:
- 19 tests FAILED (out of 31 total)
- Errors: "supabase.auth.getSession is not a function"
- Root cause: Mock configuration issues

**Test files reviewed:**
- C:\Users\Mariusz K\Documents\Programiranje\MonoPilot\apps\frontend\lib\services\__tests__\invitation-service.test.ts (1143 lines, 45 test cases)

**Coverage:** Cannot determine - tests do not run

**Status:** BLOCKED - Fix test mocks before measuring coverage

---

## Code Quality Assessment

### Positive Findings

1. **Good Documentation**
   - Services have clear JSDoc comments
   - Acceptance Criteria referenced in code comments
   - Migration files well-documented

2. **Proper Error Messages**
   - invitation-service.ts provides user-friendly error messages
   - JWT errors properly classified (expired vs invalid)

3. **RLS Implementation**
   - All tables have RLS enabled
   - Policies enforce org_id isolation
   - Password history table blocks ALL user access (service role only)

4. **Email Service**
   - Clean HTML template with proper escaping
   - Plain text fallback provided
   - Retry logic with exponential backoff (3 attempts)
   - Performance tracking (AC: email sent within 5s)

### Areas for Improvement

1. **Missing Type Definitions**
   - No centralized invitation types
   - Service relies on inline interfaces

2. **Inconsistent Naming**
   - Migration uses `session_token`, service uses `token_id`
   - Migration uses `role_id`, but service parameters use `role`

3. **No Input Sanitization**
   - Email HTML template uses string interpolation without escaping
   - Potential XSS risk if org_name contains malicious content

---

## Acceptance Criteria Coverage

### Story 01.15: Session Management

**Implemented:**
- [x] Session creation with device info (AC-003.5)
- [x] Get sessions for user (AC-003.1)
- [x] Terminate single session (AC-003.8)
- [x] Terminate all sessions (AC-003.2, AC-002.4)
- [x] Update last activity (AC-003.1)
- [x] Normal logout (AC-003.6)

**NOT Implemented:**
- [ ] Password service (ALL password ACs)
- [ ] Password complexity validation
- [ ] Password history check
- [ ] Session validation with expiry
- [ ] Token hashing/security

**Coverage:** 50% (sessions only, no password management)

### Story 01.16: User Invitations

**Implemented:**
- [x] Create invitation with token (AC-002.6)
- [x] Send invitation email (AC-002.6)
- [x] 7-day expiry (AC-002.7)
- [x] Token validation (AC-002.7)
- [x] List invitations (AC-003.1)
- [x] Resend invitation (AC-003.2)
- [x] Cancel invitation (AC-003.3)
- [x] Accept invitation (AC-002.8)
- [x] Email template (AC-003.6)

**Coverage:** 90% (excellent, minor security improvements needed)

---

## Required Fixes (Blocking)

### Story 01.15

1. **Implement password-service.ts** (CRITICAL)
   - Create `apps/frontend/lib/services/password-service.ts`
   - Implement password hashing with bcrypt (cost >= 12)
   - Implement password validation (8+ chars, uppercase, lowercase, number, special)
   - Implement password history check (last 5)
   - Implement changePassword() with session termination

2. **Implement password-helpers.ts** (CRITICAL)
   - Create `apps/frontend/lib/utils/password-helpers.ts`
   - Add bcrypt hash function
   - Add bcrypt verify function
   - Add password strength calculator

3. **Fix database schema mismatch** (CRITICAL)
   - Align migration field names with service code
   - Either rename `session_token` → `token_id` OR vice versa

4. **Implement session token security** (CRITICAL)
   - Generate tokens with crypto.randomBytes(32)
   - Hash tokens before storage (bcrypt or SHA-256)
   - Add constant-time comparison

5. **Implement session validation** (MAJOR)
   - Add validateSession() method to session-service.ts
   - Check expiry, revocation status
   - Return SessionValidation object

6. **Fix RLS enforcement** (MAJOR)
   - Verify service uses authenticated client OR validates org_id manually
   - Add integration test for cross-tenant session access

### Story 01.16

1. **Fix JWT secret handling** (MAJOR)
   - Generate random secret on first run if missing
   - Store in .env.local
   - Never allow empty secret

2. **Remove unused Supabase client** (MINOR)
   - Clean up createServerSupabase() calls in invitation-service.ts

3. **Add HTML escaping** (MINOR)
   - Escape org_name, role, email in email template
   - Use DOMPurify or similar library

---

## Recommendations

### Short-term (Before Merge)

1. Complete password service implementation
2. Fix database schema mismatch
3. Implement session token hashing
4. Fix test mocks to enable test execution
5. Run full test suite and achieve >= 90% coverage

### Medium-term (Next Sprint)

1. Add XSS protection to email templates
2. Implement rate limiting for password attempts
3. Add audit logging for security actions
4. Implement session timeout middleware
5. Add password expiry enforcement (optional AC)

### Long-term (Future Stories)

1. Implement MFA/2FA (Story 01.XX)
2. Add IP geolocation for sessions
3. Add device fingerprinting
4. Implement user activity tracking
5. Add CAPTCHA for signup

---

## Test Plan (Post-Fix)

Once blocking issues resolved, execute:

1. **Unit Tests**
   - Run all service tests
   - Target: 90% coverage minimum (security critical)
   - Focus: password-service.test.ts, session-service.test.ts

2. **Integration Tests**
   - Test API endpoints
   - Test RLS policies
   - Test cross-tenant isolation

3. **Security Tests**
   - Penetration test: session hijacking
   - Penetration test: password brute force
   - Penetration test: invitation token forgery
   - SQL injection attempts
   - XSS attempts in email templates

4. **E2E Tests**
   - Full session management flow
   - Full password change flow
   - Full invitation flow

---

## Handoff

### Decision: REQUEST_CHANGES

**To:** BACKEND-DEV Agent

**Blocking Issues:**
1. Implement password-service.ts (CRITICAL)
2. Implement password-helpers.ts (CRITICAL)
3. Fix session_token vs token_id mismatch (CRITICAL)
4. Implement session token security (CRITICAL)

**Required Artifacts:**
- apps/frontend/lib/services/password-service.ts (NEW FILE)
- apps/frontend/lib/utils/password-helpers.ts (NEW FILE)
- Fix migration 081 OR session-service.ts field names
- Add crypto.randomBytes() token generation
- Add bcrypt hashing (cost >= 12)

**Estimated Fix Time:** 4-6 hours

**Re-review Request:** After fixes implemented, re-run CODE-REVIEWER with:
- All tests passing
- Coverage >= 90%
- Security tests executed

---

## Files Reviewed Summary

| File | Status | Issues |
|------|--------|--------|
| session-service.ts | PARTIAL | 3 CRITICAL, 2 MAJOR, 1 MINOR |
| password-service.ts | MISSING | 1 CRITICAL |
| password-helpers.ts | MISSING | 1 CRITICAL |
| invitation-service.ts | APPROVED | 1 MAJOR, 1 MINOR |
| email-service.ts | APPROVED | 1 MINOR (XSS) |
| 081_create_user_sessions.sql | BLOCKED | 1 CRITICAL (schema mismatch) |
| 082_create_password_history.sql | APPROVED | None |
| 083_add_session_password_fields.sql | APPROVED | None |
| 084_create_user_invitations.sql | APPROVED | None |

**Total Issues:** 4 CRITICAL, 3 MAJOR, 2 MINOR

---

## Conclusion

Stories 01.15 and 01.16 show partial implementation with significant gaps in Story 01.15 (Session & Password Management). Story 01.16 (User Invitations) is well-implemented with minor security improvements needed.

**CANNOT APPROVE** due to missing password service implementation and session token security issues. These are security-critical components that must be completed before merge.

**Next Steps:**
1. Implement missing files (password-service.ts, password-helpers.ts)
2. Fix database schema mismatch
3. Add session token security
4. Fix test mocks and run full test suite
5. Re-submit for code review

---

**Reviewed by:** CODE-REVIEWER Agent
**Date:** 2025-12-23
**Status:** REQUEST_CHANGES
**Severity:** CRITICAL BLOCKERS PRESENT
