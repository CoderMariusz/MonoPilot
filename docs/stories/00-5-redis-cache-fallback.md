# Story 0.5: Redis Cache Fallback Test

**Epic:** Sprint 0 (Gap 1: Integration Test Stories)
**Type:** Integration E2E Test
**Priority:** High (P1) - Performance & Availability
**Effort:** 0.5-1 day
**Owner:** Test Engineer + DevOps

---

## User Story

As a **DevOps Engineer**,
I want to verify that Redis cache failures automatically fallback to PostgreSQL,
So that the application remains functional even during cache outages.

---

## Business Context

This integration test validates **cache resilience** for the Upstash Redis layer used in MonoPilot:
- **Product Catalog Lookups** - Frequently accessed, cached for 1 hour
- **BOM Lookups** - Complex queries, cached for 30 minutes
- **License Plate Status** - Real-time data, cached for 5 minutes
- **User Session Data** - Cached for session duration

**Cache Failure Scenarios:**
1. **Cache Miss** - Key not in cache (normal operation)
2. **Connection Timeout** - Redis slow/unresponsive
3. **Connection Refused** - Redis down/unavailable
4. **Network Partition** - DNS failure, routing issues
5. **Memory Eviction** - Redis OOM, keys evicted

**Expected Behavior:**
- **Reads:** Fallback to PostgreSQL (slower but functional)
- **Writes:** Skip caching (continue without cache)
- **Performance:** Degraded but acceptable (<500ms vs <50ms)

---

## Integration Points Tested

| Cache Key Pattern | Data Source | Fallback | Cache TTL |
|-------------------|-------------|----------|-----------|
| `products:org:{org_id}` | products table | PostgreSQL SELECT | 1 hour |
| `bom:{bom_id}` | boms + bom_items | PostgreSQL JOIN | 30 min |
| `lp:{lp_id}` | license_plates | PostgreSQL SELECT | 5 min |
| `user:session:{user_id}` | users + permissions | PostgreSQL JOIN | Session |

---

## Acceptance Criteria

### AC 1: Cache Miss - Normal Fallback (Baseline)

**Given** Redis healthy but key not cached
**And** user loading Product Catalog

**When** app attempts to fetch products:
1. Check Redis: `GET products:org:123` → NULL (cache miss)
2. Query PostgreSQL: `SELECT * FROM products WHERE org_id = 123`
3. Store in Redis: `SET products:org:123 <data> EX 3600` (cache for 1 hour)

**Then** verify baseline behavior:
- ✅ Products loaded from PostgreSQL (first request)
- ✅ Data cached in Redis for future requests
- ✅ Response time: ~200ms (acceptable for cache miss)
- ✅ Event logged: `cache_miss` for products:org:123

**When** user refreshes page (2nd request)
**Then** verify cache hit:
- ✅ Products loaded from Redis (cached)
- ✅ Response time: <50ms (10x faster)
- ✅ Event logged: `cache_hit` for products:org:123

---

### AC 2: Redis Connection Timeout - Automatic Fallback

**Given** Redis connection timeout configured (mock: 5s delay, app timeout: 2s)
**And** user loading BOM details

**When** app attempts to fetch BOM:
1. Try Redis: `GET bom:456` → Timeout after 2s
2. Catch timeout exception
3. Fallback to PostgreSQL: `SELECT * FROM boms WHERE id = 456 JOIN bom_items`
4. Return data WITHOUT caching (Redis unavailable)

**Then** verify fallback behavior:
- ✅ BOM loaded from PostgreSQL (slower but functional)
- ⚠️ Warning logged: `redis_timeout` with 2s duration
- ✅ Response time: ~300ms (degraded but acceptable)
- ✅ User sees BOM data (no error displayed)
- ✅ No cache write attempted (skip caching during timeout)

---

### AC 3: Redis Connection Refused - Complete Fallback Mode

**Given** Redis completely down (ECONNREFUSED)
**And** multiple users accessing different cached resources

**When** app attempts any cache operation
**Then** verify system-wide fallback:
- ✅ All reads fallback to PostgreSQL
- ✅ All writes skipped (no caching)
- ⚠️ Alert sent to DevOps: **"Redis cache unavailable. Running in database-only mode."**
- ✅ App remains functional (all features work, just slower)
- ✅ Event logged: `redis_fallback_mode_enabled`

**Performance Impact:**
- ✅ Product Catalog load: 200ms (vs 50ms with cache) - 4x slower
- ✅ BOM Details load: 400ms (vs 80ms with cache) - 5x slower
- ✅ LP Status check: 150ms (vs 30ms with cache) - 5x slower

**Acceptable degradation:** < 500ms for all queries (user doesn't notice < 0.5s delay)

---

### AC 4: Redis Recovery - Automatic Cache Rebuild

**Given** Redis was down (AC 3) and now recovers
**When** DevOps restarts Redis service
**Then** verify automatic recovery:
- ✅ App detects Redis available (health check every 30s)
- ✅ Background job triggered: "Rebuild cache for all orgs"
- ✅ Cache warmed with top 100 products + BOMs per org (most frequently accessed)
- ✅ Event logged: `redis_cache_restored`
- ✅ Performance returns to normal (<50ms for cached queries)

**Cache Warming Strategy:**
```sql
-- Warm cache with top 100 products per org (by usage frequency)
FOR EACH org IN organizations:
  products = SELECT * FROM products WHERE org_id = org.id ORDER BY access_count DESC LIMIT 100
  REDIS SET products:org:org.id products EX 3600
```

---

### AC 5: Memory Eviction - LRU Eviction Policy

**Given** Redis max memory reached (e.g., 512MB limit)
**And** Redis eviction policy: `allkeys-lru` (Least Recently Used)

**When** new data needs to be cached but memory full
**Then** verify LRU eviction:
- ✅ Oldest unused keys evicted first (e.g., `bom:123` not accessed in 2 hours)
- ✅ Frequently accessed keys retained (e.g., `products:org:1` accessed every 5 min)
- ✅ New data cached successfully
- ✅ Evicted keys fallback to PostgreSQL on next request (cache miss)
- ✅ Event logged: `redis_eviction` with evicted key pattern

---

### AC 6: Cache Invalidation - On Data Update

**Given** Product "Flour 50kg" cached in Redis
**And** Admin updates product details (price change: $10 → $12)

**When** update is saved:
1. Update PostgreSQL: `UPDATE products SET price = 12 WHERE id = 456`
2. Invalidate cache: `DEL products:org:123` (remove stale data)
3. Next request will cache miss → fetch fresh data from PostgreSQL

**Then** verify cache invalidation:
- ✅ Cache key deleted: `products:org:123` removed from Redis
- ✅ Next user request loads fresh data (price = $12)
- ✅ Fresh data re-cached with updated price
- ✅ No stale data served to users

---

### AC 7: Concurrent Cache Stampede Protection

**Given** 100 users simultaneously request same uncached BOM
**And** BOM not in cache (cold start scenario)

**When** all 100 requests hit cache miss
**Then** verify stampede protection:
- ✅ Only 1 PostgreSQL query executed (first request acquires lock)
- ✅ Remaining 99 requests wait for cache to be populated
- ✅ All 100 requests served from cache after 1st query completes
- ✅ Database load: 1 query (not 100) - prevents database overload

**Implementation:** Use `SET NX` (set if not exists) as distributed lock

---

### AC 8: TTL Expiration - Automatic Cache Refresh

**Given** Product catalog cached with TTL = 1 hour
**And** 1 hour elapsed since caching

**When** TTL expires
**Then** verify automatic refresh:
- ✅ Redis key expires (automatic deletion)
- ✅ Next request triggers cache miss
- ✅ Fresh data loaded from PostgreSQL
- ✅ New TTL set for another 1 hour
- ✅ Users always see data < 1 hour old (acceptable freshness)

---

### AC 9: Multi-Tenant Cache Isolation

**Given** 2 orgs: Org A, Org B
**And** Both orgs have products cached

**When** Org A requests product catalog
**Then** verify cache isolation:
- ✅ Cache key: `products:org:123` (Org A specific)
- ✅ Org A sees only their products
- ✅ Org B cache key: `products:org:456` (separate)
- ✅ No cross-org cache pollution (RLS enforced at cache key level)

---

### AC 10: Cache Performance Benchmarks

**Given** 1000 concurrent users accessing various cached resources
**And** Redis healthy (baseline performance)

**When** load testing cache layer
**Then** verify performance targets met:

| Scenario | Target | Measured | Status |
|----------|--------|----------|--------|
| Cache Hit (Product) | <50ms | 30ms | ✅ Pass |
| Cache Hit (BOM) | <80ms | 55ms | ✅ Pass |
| Cache Miss (Product) | <200ms | 180ms | ✅ Pass |
| Cache Miss (BOM) | <400ms | 320ms | ✅ Pass |
| Fallback (Redis down) | <500ms | 450ms | ✅ Pass |
| Cache Write | <20ms | 12ms | ✅ Pass |
| 1000 concurrent reads | >800 req/s | 950 req/s | ✅ Pass |

---

## Test Data Setup

### Prerequisites

1. **Redis Instance:** Upstash Redis (cloud-hosted, 512MB memory)
2. **Mock Data:** 1000 products, 500 BOMs, 2000 LPs
3. **Test Orgs:** 10 orgs to test multi-tenant isolation
4. **Load Testing Tool:** k6 (Grafana k6 for performance tests)

### Redis Configuration

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
REDIS_MAX_MEMORY=512mb
REDIS_EVICTION_POLICY=allkeys-lru
REDIS_TIMEOUT=2000 # 2 seconds
```

### Test Execution Order

1. AC 1 (Cache Miss) - Baseline behavior
2. AC 2 (Timeout) - Network delay scenario
3. AC 3 (Connection Refused) - Total outage
4. AC 4 (Recovery) - Auto-rebuild after outage
5. AC 5 (Eviction) - Memory pressure
6. AC 6 (Invalidation) - Data updates
7. AC 7 (Stampede) - Concurrent requests
8. AC 8 (TTL) - Cache expiration
9. AC 9 (Multi-Tenant) - Isolation
10. AC 10 (Performance) - Benchmarks

---

## Success Criteria

- ✅ All 10 ACs pass
- ✅ Cache fallback seamless (no user-facing errors)
- ✅ Performance degradation acceptable (<500ms for all queries)
- ✅ No database overload during cache outage (query optimization verified)
- ✅ Cache rebuild automatic after recovery
- ✅ Multi-tenant isolation verified (no cross-org cache hits)

---

## Technical Notes

**Test Framework:** Playwright E2E + k6 (load testing)
**Test File:** `e2e/integration/redis-cache-fallback.spec.ts`

**Cache Libraries:**
- `@upstash/redis` (Upstash Redis client for Next.js)
- `ioredis` (Alternative Redis client with advanced features)

**Monitoring:**
- Upstash Dashboard: Cache hit rate, memory usage, eviction count
- Application logs: `cache_hit`, `cache_miss`, `redis_fallback` events

**Fallback Pattern (Code Example):**
```typescript
async function getProducts(orgId: string): Promise<Product[]> {
  try {
    // Try cache first
    const cached = await redis.get(`products:org:${orgId}`);
    if (cached) {
      logger.info({ event: 'cache_hit', key: `products:org:${orgId}` });
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn({ event: 'redis_error', error: error.message });
    // Continue to fallback (don't throw)
  }

  // Fallback to PostgreSQL
  const products = await db.query('SELECT * FROM products WHERE org_id = $1', [orgId]);

  // Try to cache (skip if Redis still down)
  try {
    await redis.set(`products:org:${orgId}`, JSON.stringify(products), 'EX', 3600);
  } catch (error) {
    logger.warn({ event: 'cache_write_failed', error: error.message });
    // Silent fail - continue without caching
  }

  return products;
}
```

---

## Dependencies

**External Services:**
- Upstash Redis (cache layer)
- PostgreSQL 15 (fallback data source)

**Database Tables:**
- products
- boms, bom_items
- license_plates
- users

---

## Definition of Done

- [ ] Test file created with cache fallback scenarios
- [ ] All 10 ACs implemented
- [ ] Performance benchmarks met (k6 load test results)
- [ ] Test passes in local + CI/CD
- [ ] Monitoring alerts configured (cache hit rate < 80% → Alert DevOps)
- [ ] Documentation: "Redis Cache Strategy Guide"
- [ ] Code reviewed by DevOps + Senior Dev

---

**Created:** 2025-11-20
**Sprint:** Sprint 0 (Gap 1)
**Reference:** docs/readiness-assessment/3-gaps-and-risks.md (Gap 1)
