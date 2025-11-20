# Story 0.4: External Service Resilience Tests

**Epic:** Sprint 0 (Gap 1: Integration Test Stories)
**Type:** Integration E2E Test
**Priority:** High (P1) - System Stability
**Effort:** 1-1.5 days
**Owner:** Test Engineer + DevOps

---

## User Story

As a **DevOps Engineer**,
I want to verify that MonoPilot gracefully handles external service failures,
So that temporary outages don't cause data loss or system crashes.

---

## Business Context

This integration test validates **resilience patterns** for all external service integrations:
1. **SendGrid** (Email Service) - User invitations, notifications, alerts
2. **Stripe** (Payment Processing) - Subscription billing (Phase 2)
3. **Upstash Redis** (Cache Layer) - Product/BOM lookups
4. **Supabase Storage** (File Storage) - Documents, images, CoAs

**Failure Scenarios to Test:**
- Service timeouts (slow response, connection hang)
- Service downtime (503 Service Unavailable)
- API rate limiting (429 Too Many Requests)
- Authentication failures (401 Unauthorized)
- Network failures (DNS resolution, connection refused)

---

## Integration Points Tested

| Service | Use Case | Expected Behavior on Failure |
|---------|----------|------------------------------|
| SendGrid | User invitation email | Non-blocking: User created, email queued for retry |
| SendGrid | QA Hold notification | Non-blocking: Hold created, email queued |
| SendGrid | Password reset | Non-blocking: Token generated, email queued |
| Stripe | Subscription charge | Blocking: Transaction fails, user notified |
| Upstash Redis | Product cache | Fallback to PostgreSQL, cache miss logged |
| Supabase Storage | CoA upload | Retry 3× with backoff, fail gracefully |

---

## Acceptance Criteria

### AC 1: SendGrid Timeout - User Invitation (Non-Blocking)

**Given** Admin creating new user
**And** SendGrid API timeout configured (mock: delay 15s, app timeout: 10s)

**When** Admin invites user:
1. Navigate to Settings > Users > Add User
2. Email: "newuser@example.com"
3. Role: "Operator"
4. Click "Send Invitation"

**Then** verify non-blocking behavior:
- ✅ User record created: `users` table has row for "newuser@example.com"
- ✅ User status = 'Invited' (not blocked by email failure)
- ✅ Invitation token generated and stored
- ⚠️ Warning displayed: **"User created successfully. Invitation email is being sent. If email fails, you can copy the invitation link manually."**
- ✅ Admin can copy invitation link from UI (manual fallback)
- ✅ Email queued for retry (background job scheduled)
- ✅ Event logged: `sendgrid_timeout` with request ID

**When** SendGrid recovers (next retry after 30s)
**Then** verify email sent:
- ✅ Email delivered to "newuser@example.com"
- ✅ Event logged: `sendgrid_success` with retry attempt number
- ✅ UI notification: "Invitation email sent to newuser@example.com"

---

### AC 2: SendGrid 503 Downtime - QA Hold Notification

**Given** QA places LP on hold
**And** SendGrid returns 503 Service Unavailable (maintenance mode)

**When** QA submits hold:
1. Quality > LP QA > Place on Hold
2. LP: LP-001
3. Reason: "Contamination suspected"
4. Notify: Production Manager
5. Submit

**Then** verify non-blocking behavior:
- ✅ LP status updated: `qa_status = 'Hold'`
- ✅ Hold reason saved
- ⚠️ Warning: **"QA Hold created. Email notification to Production Manager is pending due to email service outage."**
- ✅ Notification queued for retry (3 attempts: 2s, 4s, 8s backoff)
- ✅ Production Manager can still see hold in UI (real-time update)

---

### AC 3: SendGrid Rate Limit (429 Too Many Requests)

**Given** Bulk user invitation (100 users)
**And** SendGrid rate limit: 10 emails/second

**When** Admin invites 100 users simultaneously
**Then** verify rate limiting handling:
- ✅ First 10 emails sent immediately
- ✅ Remaining 90 queued with rate-limited retry strategy
- ✅ Emails sent in batches of 10 every 1 second
- ✅ All 100 users created (email failure doesn't block user creation)
- ⚠️ Warning: **"Sending 100 invitations. Due to email rate limits, this will take ~10 seconds."**
- ✅ Progress indicator shown: "Sent 10/100, 20/100, ..."

---

### AC 4: Stripe Payment Failure - Subscription Charge (Blocking)

**Given** subscription renewal attempt
**And** Stripe API returns "Card declined" error

**When** system attempts to charge subscription
**Then** verify blocking behavior:
- ❌ Subscription NOT renewed
- ❌ User account downgraded to "Free" tier (per subscription policy)
- ✅ User notified: **"Payment failed: Card declined. Please update payment method."**
- ✅ Event logged: `stripe_payment_failed` with error code
- ✅ Admin alerted: "Subscription payment failed for Org: XYZ"
- ✅ Retry scheduled for 24 hours later (dunning strategy)

**Note:** Stripe failures are BLOCKING because financial transactions require guaranteed success.

---

### AC 5: Upstash Redis Cache Miss - Product Lookup Fallback

**Given** Redis cache unavailable (connection timeout)
**And** user loading Product Catalog page

**When** app attempts to fetch product list:
1. Try Redis: `GET products:org:123` → Timeout after 2s
2. Fallback to PostgreSQL: `SELECT * FROM products WHERE org_id = 123`

**Then** verify fallback behavior:
- ✅ Product list loaded from PostgreSQL (slower but functional)
- ⚠️ Performance degraded: Page load 500ms (vs 50ms with cache)
- ✅ Event logged: `redis_cache_miss` with timeout reason
- ✅ Cache rebuild scheduled (background job)
- ✅ User sees products (no user-facing error)

---

### AC 6: Upstash Redis Total Outage - System Remains Functional

**Given** Redis completely down (DNS failure, server crash)
**And** multiple users accessing BOM catalog

**When** app attempts cache operations
**Then** verify graceful degradation:
- ✅ All cache reads fallback to PostgreSQL (slower but functional)
- ✅ All cache writes skipped (no caching during outage)
- ⚠️ Alert sent to DevOps: **"Redis cache unavailable. System running in fallback mode."**
- ✅ App logs: `redis_fallback_mode_enabled` event
- ✅ Users experience slower page loads but no errors

**When** Redis recovers
**Then** verify cache rebuild:
- ✅ Background job triggers: "Rebuild cache for all orgs"
- ✅ Cache warmed with top 100 products + BOMs per org
- ✅ Performance returns to normal (<50ms page loads)
- ✅ Event logged: `redis_cache_restored`

---

### AC 7: Supabase Storage Upload Failure - CoA Document

**Given** QA uploading Certificate of Analysis (CoA) for received goods
**And** Supabase Storage returns 500 Internal Server Error

**When** QA uploads CoA:
1. Quality > Certificates > Upload CoA
2. File: "CoA_Batch_2025_001.pdf" (2MB)
3. Click "Upload"

**Then** verify retry logic:
- ⚠️ Attempt 1: Fails (500 error) → Retry after 2s
- ⚠️ Attempt 2: Fails (500 error) → Retry after 4s
- ⚠️ Attempt 3: Fails (500 error) → Stop retrying

**After 3 failed attempts:**
- ❌ Upload fails
- ❌ Error displayed: **"Upload failed: Storage service temporarily unavailable. Please try again later. Your file has been saved locally for manual upload."**
- ✅ File saved to browser's IndexedDB (local persistence)
- ✅ UI shows: "Pending Upload: CoA_Batch_2025_001.pdf (Click to retry)"
- ✅ Event logged: `supabase_storage_upload_failed` with error details

**When** user clicks "Retry" after service recovery
**Then** verify successful upload:
- ✅ File uploaded from IndexedDB to Supabase Storage
- ✅ CoA record created: `certificates` table
- ✅ Event logged: `supabase_storage_upload_success` with retry count
- ✅ IndexedDB entry deleted (cleanup)

---

### AC 8: Network Failure - DNS Resolution Error

**Given** Network outage (ISP failure, DNS down)
**And** user attempting to send email

**When** app tries to call SendGrid API
**Then** verify network error handling:
- ❌ DNS resolution fails: "getaddrinfo ENOTFOUND api.sendgrid.com"
- ✅ App catches network error (not unhandled exception)
- ✅ Error displayed: **"Network error: Unable to connect to email service. Check your internet connection."**
- ✅ Event logged: `network_error` with error code
- ✅ App remains functional (other features work if they don't require external services)

---

### AC 9: Timeout Configuration - Custom per Service

**Given** different timeout requirements per service:
- SendGrid: 10s (emails can be slow)
- Stripe: 30s (payment processing takes time)
- Redis: 2s (cache should be fast or skip)
- Supabase Storage: 30s (file uploads can be large)

**When** each service is called
**Then** verify timeout enforcement:
- ✅ SendGrid timeout after 10s → Fallback to queue
- ✅ Stripe timeout after 30s → Fail transaction
- ✅ Redis timeout after 2s → Fallback to PostgreSQL
- ✅ Supabase timeout after 30s → Retry with backoff

---

### AC 10: Circuit Breaker Pattern (Advanced Resilience)

**Given** SendGrid failing repeatedly (5 consecutive failures)
**And** Circuit Breaker threshold: 5 failures in 1 minute

**When** 5th failure occurs
**Then** verify circuit breaker opens:
- ✅ Circuit state: OPEN (stop calling SendGrid for 5 minutes)
- ✅ All email requests immediately queued (no API calls)
- ⚠️ Alert: **"Email service circuit breaker OPEN. All emails queued for retry."**
- ✅ Event logged: `circuit_breaker_open` for SendGrid

**After 5 minutes (cooldown period):**
- ✅ Circuit state: HALF-OPEN (allow 1 test request)
- ✅ If test succeeds → Circuit CLOSED (resume normal operation)
- ✅ If test fails → Circuit remains OPEN for another 5 minutes

---

## Test Data Setup

### Prerequisites

1. **Mock Services:** Use Mock Service Worker (MSW) to simulate external APIs
2. **Failure Scenarios:** Configure MSW handlers to return errors, delays, rate limits
3. **Test Users:** 100 dummy users for bulk invitation test
4. **Test Files:** Sample CoA PDF (2MB) for upload test

### Mock Configuration Examples

```typescript
// Mock SendGrid timeout
rest.post('https://api.sendgrid.com/v3/mail/send', async (req, res, ctx) => {
  await delay(15000); // 15s delay, exceeds 10s timeout
  return res(ctx.status(200));
});

// Mock Stripe card decline
rest.post('https://api.stripe.com/v1/charges', (req, res, ctx) => {
  return res(ctx.status(402), ctx.json({ error: { code: 'card_declined' } }));
});

// Mock Redis connection refused
rest.get('https://upstash-redis.com/*', (req, res, ctx) => {
  return res.networkError('ECONNREFUSED');
});
```

### Test Execution Order

1. AC 1-3 (SendGrid resilience) - Email service failures
2. AC 4 (Stripe blocking) - Payment failures
3. AC 5-6 (Redis fallback) - Cache failures
4. AC 7 (Storage retry) - File upload failures
5. AC 8 (Network errors) - DNS/connectivity issues
6. AC 9 (Timeout config) - Service-specific timeouts
7. AC 10 (Circuit breaker) - Advanced pattern

---

## Success Criteria

- ✅ All 10 ACs pass without crashing the app
- ✅ No unhandled exceptions (all errors caught gracefully)
- ✅ Users notified clearly when services fail
- ✅ Fallback mechanisms work (queue, retry, PostgreSQL fallback)
- ✅ System remains functional during external outages
- ✅ Alerts sent to DevOps for critical failures

---

## Technical Notes

**Test Framework:** Playwright E2E + Mock Service Worker (MSW)
**Test File:** `e2e/integration/external-service-resilience.spec.ts`

**Retry Strategy:**
- Exponential backoff: 2s, 4s, 8s, 16s
- Max retries: 3 (SendGrid, Storage), Infinite (Redis fallback)

**Circuit Breaker Library:** `opossum` (Node.js circuit breaker)

---

## Dependencies

**External Services:**
- SendGrid (Epic 1: User invitations)
- Stripe (Epic 1: Subscription billing - Phase 2)
- Upstash Redis (Epic 2: Product/BOM cache)
- Supabase Storage (Epic 6: CoA documents)

**Database Tables:**
- users
- email_queue (retry queue)
- certificates
- event_log

---

## Definition of Done

- [ ] Test file created with MSW mocks
- [ ] All 10 ACs implemented
- [ ] Test passes in local + CI/CD
- [ ] Alerts configured for DevOps
- [ ] Documentation: "External Service Resilience Guide"
- [ ] Code reviewed by DevOps + Senior Dev

---

**Created:** 2025-11-20
**Sprint:** Sprint 0 (Gap 1)
**Reference:** docs/readiness-assessment/3-gaps-and-risks.md (Gap 1)
