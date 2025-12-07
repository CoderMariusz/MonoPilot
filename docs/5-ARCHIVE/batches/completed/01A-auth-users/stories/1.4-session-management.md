# Story 1.4: Session Management

Status: done (backend complete, frontend/tests deferred to Story 1.14)

## Story

As a **User**,
I want to see my active sessions and logout from all devices,
so that I can maintain security of my account.

## Acceptance Criteria

### FR-SET-003: Session Management

**AC-003.1**: User widzi listę active sessions:
- Navigate to /settings/users/:id/sessions (own profile) lub Admin viewing any user
- Table columns: Device Info, IP Address, Location (city/country), Login Time, Last Activity, Status, Actions
- Device Info: browser name, OS, device type (desktop/mobile/tablet)
- Status: Active, Expired
- Only active sessions displayed by default (filter to show expired)

**AC-003.2**: "Logout All Devices" functionality:
- Button visible on sessions page
- Click → confirmation modal: "This will log you out of all devices except the current one"
- On confirm: all sessions except current terminated
- All JWT tokens added to Redis blacklist (TTL = token expiry)
- Success toast: "Logged out from all devices"
- Table refreshes showing only current session

**AC-003.3**: Admin może view i terminate any user's sessions:
- Admin navigates to /settings/users/:id/sessions for any user
- Sees all active sessions for that user
- Can terminate individual session (click "Terminate" action)
- Can terminate all sessions for that user
- Terminated user logged out immediately (within 1s via realtime)

**AC-003.4**: Session invalidation propagated via realtime:
- Terminated session triggers Supabase Realtime event: 'session.terminated'
- All devices with that session listen for event
- On event received: force logout (clear localStorage, redirect to login)
- Show toast: "Your session has been terminated"
- Propagation time: <1s

**AC-003.5**: Session tracking on login:
- On successful login: create user_sessions record
- Capture: device_info (user agent), IP address, location (GeoIP), login_time
- JWT token_id stored in session record
- Session marked as active (is_active = true)

**AC-003.6**: Session cleanup on logout:
- Normal logout: update user_sessions.is_active = false, set logged_out_at
- Session remains in DB for audit trail (soft delete pattern)
- JWT not blacklisted (natural expiry after 7 days)

**AC-003.7**: Expired sessions detection:
- Session expires if JWT exp claim passed
- Expired sessions marked with Status = "Expired" in table
- Auto-cleanup: delete expired sessions >90 days old (weekly cron)

**AC-003.8**: Individual session termination:
- Click "Terminate" on specific session → confirmation modal
- On confirm: that session terminated (JWT blacklisted, is_active = false)
- Terminated device logged out immediately
- Current session cannot be terminated (button disabled)

## Tasks / Subtasks

### Task 1: Database Schema - Sessions Table (AC: 003.1, 003.5, 003.6, 003.7)
- [ ] Create `user_sessions` table migration:
  - [ ] id UUID PK
  - [ ] user_id UUID FK → users (NOT org_id - sessions are user-specific)
  - [ ] token_id VARCHAR(255) UNIQUE (JWT jti claim)
  - [ ] device_info TEXT (browser, OS, device type from user agent)
  - [ ] ip_address VARCHAR(45) (IPv4 or IPv6)
  - [ ] location VARCHAR(255) (city, country from GeoIP)
  - [ ] login_time TIMESTAMP DEFAULT NOW()
  - [ ] last_activity TIMESTAMP DEFAULT NOW()
  - [ ] is_active BOOLEAN DEFAULT true
  - [ ] logged_out_at TIMESTAMP
  - [ ] created_at TIMESTAMP DEFAULT NOW()
- [ ] Add index: user_id, token_id, is_active
- [ ] Add check constraint: logged_out_at NULL if is_active = true
- [ ] NO RLS policy needed (user_id check in API)
- [ ] Run migration and verify schema

### Task 2: Session Service - Core Logic (AC: 003.2, 003.3, 003.4, 003.5, 003.6, 003.8)
- [ ] Create SessionService class/module
  - [ ] createSession(userId, tokenId, deviceInfo, ipAddress)
    - [ ] Parse user agent → browser, OS, device type
    - [ ] GeoIP lookup → city, country (optional, use external API)
    - [ ] Insert user_sessions record
    - [ ] Return session object
  - [ ] terminateSession(sessionId, userId)
    - [ ] Validate: session belongs to userId
    - [ ] Update is_active = false, logged_out_at = NOW()
    - [ ] Add JWT token_id to Redis blacklist
    - [ ] Emit Supabase Realtime event: 'session.terminated'
    - [ ] Return success
  - [ ] terminateAllSessions(userId, exceptCurrentToken)
    - [ ] Get all active sessions for userId
    - [ ] Filter out current session (by exceptCurrentToken)
    - [ ] For each session: call terminateSession
    - [ ] Return terminated count
  - [ ] getSessions(userId, includeExpired = false)
    - [ ] Query user_sessions WHERE user_id = userId
    - [ ] Filter is_active = true OR includeExpired
    - [ ] Sort by last_activity DESC
    - [ ] Return sessions array
  - [ ] updateLastActivity(tokenId)
    - [ ] Update last_activity = NOW() for token_id
    - [ ] Called on each API request (middleware)

### Task 3: Redis Blacklist - JWT Invalidation (AC: 003.2, 003.3, 003.4)
- [ ] Create JWTBlacklistService
  - [ ] addToBlacklist(tokenId, expiresAt)
    - [ ] Store in Redis: SET `blacklist:{tokenId}` "1" EX {ttl}
    - [ ] TTL = expiresAt - NOW() (seconds until natural expiry)
    - [ ] Return success
  - [ ] isBlacklisted(tokenId)
    - [ ] Check Redis: GET `blacklist:{tokenId}`
    - [ ] Return boolean (exists = blacklisted)
  - [ ] Use in auth middleware:
    - [ ] After JWT verification, check isBlacklisted(jti)
    - [ ] If blacklisted → 401 Unauthorized, clear session

### Task 4: Device Info Parser (AC: 003.1, 003.5)
- [ ] Install library: `pnpm add ua-parser-js`
- [ ] Create DeviceInfoParser utility
  - [ ] parseUserAgent(userAgent: string)
    - [ ] Extract: browser name, OS, device type
    - [ ] Return formatted string: "Chrome 120 on Windows 10 (Desktop)"
  - [ ] Use in SessionService.createSession

### Task 5: GeoIP Lookup (AC: 003.1, 003.5) - Optional Enhancement
- [ ] Option 1: Use external API (ipapi.co, ip-api.com)
  - [ ] Free tier: 1000 requests/day
  - [ ] Lookup city, country from IP
- [ ] Option 2: Skip GeoIP for MVP
  - [ ] Display IP only, no location
  - [ ] Add GeoIP later as enhancement
- [ ] Recommendation: Skip for MVP, add in Phase 2

### Task 6: API Endpoints (AC: 003.1, 003.2, 003.3, 003.8)
- [ ] Implement GET /api/settings/users/:id/sessions
  - [ ] Validate: current user can only view own sessions OR user is Admin
  - [ ] Call SessionService.getSessions(userId)
  - [ ] Return sessions array
  - [ ] Auth: User (self) or Admin (any user)
- [ ] Implement DELETE /api/settings/users/:id/sessions (Logout All)
  - [ ] Validate: current user or Admin
  - [ ] Get current token_id from JWT
  - [ ] Call SessionService.terminateAllSessions(userId, exceptCurrentToken)
  - [ ] Return { terminated_count: number }
  - [ ] Auth: User (self) or Admin (any user)
- [ ] Implement DELETE /api/settings/users/:id/sessions/:sessionId
  - [ ] Validate: session belongs to userId
  - [ ] Validate: not current session (cannot terminate self)
  - [ ] Call SessionService.terminateSession(sessionId, userId)
  - [ ] Return { success: true }
  - [ ] Auth: User (self) or Admin (any user)

### Task 7: Auth Middleware Enhancement (AC: 003.4, 003.5)
- [ ] Modify existing auth middleware:
  - [ ] After JWT verification, extract jti (token ID)
  - [ ] Check JWTBlacklistService.isBlacklisted(jti)
  - [ ] If blacklisted → return 401, clear session
  - [ ] If valid → call SessionService.updateLastActivity(jti)
  - [ ] Continue to protected route
- [ ] On login (POST /api/auth/login):
  - [ ] After Supabase Auth login, extract JWT jti
  - [ ] Call SessionService.createSession(userId, jti, deviceInfo, ip)
  - [ ] Return session with user

### Task 8: Supabase Realtime Integration (AC: 003.4)
- [ ] Configure Supabase Realtime channel: 'session_events'
- [ ] Server-side (SessionService.terminateSession):
  - [ ] After terminating session, emit event:
    - [ ] supabase.channel('session_events').send({ type: 'broadcast', event: 'session.terminated', payload: { token_id } })
- [ ] Client-side (all authenticated pages):
  - [ ] Subscribe to 'session_events' channel on mount
  - [ ] Listen for 'session.terminated' event
  - [ ] On event: check if event.token_id === current JWT jti
  - [ ] If match: force logout (clear localStorage, redirect /login)
  - [ ] Show toast: "Your session has been terminated"
  - [ ] Unsubscribe on unmount

### Task 9: Frontend Sessions Page (AC: 003.1, 003.2, 003.3, 003.8)
- [ ] Create /app/settings/users/[id]/sessions/page.tsx
- [ ] Implement SessionsTable component
  - [ ] Columns: Device Info, IP Address, Location, Login Time, Last Activity, Status, Actions
  - [ ] Status badge: Active (green), Expired (gray)
  - [ ] Actions: Terminate button (disabled for current session)
  - [ ] Highlight current session (different background color)
- [ ] Implement "Logout All Devices" button
  - [ ] Position: top-right of table
  - [ ] Click → confirmation modal
  - [ ] On confirm → DELETE /api/settings/users/:id/sessions
  - [ ] Success → refresh table, show toast
- [ ] Implement Terminate individual session
  - [ ] Click Terminate → confirmation modal
  - [ ] On confirm → DELETE /api/settings/users/:id/sessions/:sessionId
  - [ ] Success → refresh table, show toast
- [ ] Real-time session updates
  - [ ] Subscribe to 'session_events' channel
  - [ ] On 'session.terminated' → refresh table
  - [ ] Auto-refresh last_activity every 30s (polling or realtime)

### Task 10: Auto-Cleanup Expired Sessions (AC: 003.7)
- [ ] Create background job/cron (Vercel Cron or Supabase Function)
  - [ ] Runs weekly (e.g., Sunday 3am UTC)
  - [ ] Delete sessions WHERE is_active = false AND logged_out_at < NOW() - 90 days
  - [ ] OR delete WHERE is_active = true AND login_time < NOW() - 90 days (abandoned sessions)
  - [ ] Log deleted count
- [ ] Configure cron job in vercel.json

### Task 11: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Device info parser (various user agents)
  - [ ] JWT blacklist (add, check, expiry)
  - [ ] Session termination logic
- [ ] Integration tests:
  - [ ] Login → session created in DB
  - [ ] GET sessions → returns active sessions
  - [ ] DELETE all sessions → all terminated except current
  - [ ] DELETE single session → terminated, JWT blacklisted
  - [ ] Blacklisted JWT → 401 on next request
  - [ ] Realtime event → session terminated on other device
- [ ] E2E tests (Playwright):
  - [ ] Login → view sessions page → see current session
  - [ ] Open 2nd browser → login same user → 2 sessions visible
  - [ ] Logout all devices → 2nd browser logged out
  - [ ] Terminate individual session → specific device logged out
  - [ ] Admin views other user's sessions → can terminate

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript 5.7 strict mode
- **UI**: Tailwind CSS 3.4 + Shadcn/UI components (Table, Dialog, Badge)
- **Database**: PostgreSQL 15 via Supabase
- **Auth**: Supabase Auth (JWT sessions with jti claim)
- **Realtime**: Supabase Realtime (broadcast channel for session termination)
- **Cache**: Redis (Upstash) for JWT blacklist
- **Device Parsing**: ua-parser-js library
- **GeoIP**: Optional (ipapi.co or skip for MVP)

### Architecture Patterns
- **Session Tracking**: user_sessions table records all login sessions
- **JWT Blacklist**: Redis with TTL = token expiry (efficient invalidation)
- **Realtime Logout**: Supabase Realtime broadcast event (<1s propagation)
- **Soft Delete**: Sessions not deleted, marked is_active = false (audit trail)
- **Last Activity**: Updated on each API request via middleware

### Key Technical Decisions

1. **JWT Token ID (jti)**:
   - Supabase Auth JWT includes `jti` claim (unique token identifier)
   - Store jti in user_sessions table for blacklist lookup
   - Blacklist uses jti as Redis key

2. **Session Termination Flow**:
   ```
   User clicks "Logout All Devices"
     ↓
   API: DELETE /api/settings/users/:id/sessions
     ↓
   For each session (except current):
     1. Update is_active = false in DB
     2. Add jti to Redis blacklist (TTL = token expiry)
     3. Emit Realtime event: { token_id: jti }
     ↓
   All devices with terminated sessions:
     1. Receive Realtime event
     2. Check if token_id === current jti
     3. If match: clear localStorage, redirect /login
     ↓
   Result: Logged out within 1s
   ```

3. **Redis Blacklist Strategy**:
   - Key format: `blacklist:{jti}`
   - Value: "1" (boolean flag)
   - TTL: Calculate from JWT exp claim (seconds until natural expiry)
   - Why: After natural expiry, token invalid anyway, no need to keep in blacklist

4. **Device Info Format**:
   - Parse user agent → "Chrome 120 on Windows 10 (Desktop)"
   - Extract: browser name, version, OS, device type
   - Library: ua-parser-js (lightweight, maintained)

5. **GeoIP Decision** (MVP):
   - Skip GeoIP for MVP (external API dependency, rate limits)
   - Display IP address only
   - Add GeoIP in Phase 2 (nice-to-have, not critical)

6. **Last Activity Tracking**:
   - Update on each API request (via middleware)
   - Shows when session was last used
   - Helps identify abandoned sessions

### Security Considerations
- **JWT Blacklist**: Prevents terminated sessions from API access
- **Realtime Force Logout**: Immediate invalidation on client side (<1s)
- **Session Ownership**: Users can only view/terminate own sessions (except Admin)
- **Current Session Protection**: Cannot terminate own current session
- **Audit Trail**: All sessions logged with device info, IP, timestamps
- **Redis TTL**: Auto-cleanup of blacklist entries (no memory leak)

### Project Structure Notes

Expected file locations:
```
app/
  settings/
    users/
      [id]/
        sessions/
          page.tsx          # Sessions table page
  api/
    settings/
      users/
        [id]/
          sessions/
            route.ts        # GET, DELETE (all)
            [sessionId]/
              route.ts      # DELETE (individual)

lib/
  services/
    SessionService.ts       # Session CRUD, termination logic
    JWTBlacklistService.ts  # Redis blacklist operations
  utils/
    DeviceInfoParser.ts     # User agent parsing
  middleware/
    auth.ts                 # Enhanced with blacklist check, last activity update

components/
  settings/
    SessionsTable.tsx       # Sessions table component

supabase/
  migrations/
    XXXX_create_user_sessions.sql  # Sessions table

hooks/
  useRealtimeSessionTermination.ts  # Realtime listener hook
```

### Data Model

```typescript
interface UserSession {
  id: string                    // UUID PK
  user_id: string               // FK → users
  token_id: string              // JWT jti claim (unique)
  device_info: string           // "Chrome 120 on Windows 10 (Desktop)"
  ip_address: string            // IPv4 or IPv6
  location?: string             // "San Francisco, US" (optional, GeoIP)
  login_time: Date              // When session started
  last_activity: Date           // Last API request timestamp
  is_active: boolean            // true = active, false = terminated
  logged_out_at?: Date          // When user logged out
  created_at: Date
}

// Redis Blacklist Entry
// Key: `blacklist:{jti}`
// Value: "1"
// TTL: seconds until JWT exp
```

### API Endpoints

```typescript
GET    /api/settings/users/:id/sessions
  Response: UserSession[]
  Auth: User (self) or Admin (any user)

DELETE /api/settings/users/:id/sessions (Logout All Devices)
  Response: { terminated_count: number }
  Auth: User (self) or Admin
  Side effects: All sessions terminated except current, JWT blacklisted, realtime event

DELETE /api/settings/users/:id/sessions/:sessionId
  Response: { success: boolean }
  Auth: User (self) or Admin
  Validation: Cannot terminate current session
  Side effects: Session terminated, JWT blacklisted, realtime event
```

### Supabase Realtime Event

```typescript
// Server emits:
supabase
  .channel('session_events')
  .send({
    type: 'broadcast',
    event: 'session.terminated',
    payload: { token_id: jti }
  })

// Client listens:
useEffect(() => {
  const channel = supabase
    .channel('session_events')
    .on('broadcast', { event: 'session.terminated' }, (payload) => {
      if (payload.token_id === currentJti) {
        // Force logout
        localStorage.clear()
        router.push('/login')
        toast('Your session has been terminated')
      }
    })
    .subscribe()

  return () => { channel.unsubscribe() }
}, [])
```

### Testing Strategy

**Unit Tests** (Vitest):
- Device info parser (various user agents: Chrome, Firefox, Safari, mobile)
- JWT blacklist add/check operations
- Session termination logic (single, all except current)

**Integration Tests** (Vitest + Supabase Test Client + Redis):
- Login → session created in DB with correct device info
- GET sessions → returns only user's sessions (not other users')
- DELETE all sessions → all terminated, JWTs blacklisted
- Blacklisted JWT → 401 on next API request
- Realtime event emitted on session termination

**E2E Tests** (Playwright):
- Login → view sessions → current session visible
- Open 2 browsers → login same user → both sessions visible
- Logout all devices → both logged out
- Admin views other user's sessions → can terminate
- Individual session termination → specific device logged out

### Performance Targets
- Session list load (10 sessions): <200ms
- Logout all devices: <500ms (incl. Redis blacklist)
- Realtime propagation: <1s (Supabase SLA)
- Last activity update: <10ms (Redis write)

### Learnings from Previous Stories

**From Story 1.2 (User Management - CRUD)**

Story 1.2 is in status "drafted", expected patterns:
- Session termination logic needed when user deactivated (AC-002.4)
- This story provides SessionService.terminateAllSessions for Story 1.2 to use

**From Story 1.3 (User Invitations)**

Story 1.3 is in status "drafted", no direct integration points.

**Key Integration:**
- Story 1.2 DELETE user → calls SessionService.terminateAllSessions (from this story)
- This story must be implemented before or alongside Story 1.2 for full functionality

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.4]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-003]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Session-Management]
- [Source: docs/architecture/patterns/security.md] (JWT blacklist, session security)

### Prerequisites

**Story 1.1**: Organization Configuration (org_id needed)
**Story 1.2**: User Management - CRUD (users table, user deactivation integration)

### Dependencies

**External Services:**
- Supabase (Database, Auth, Realtime)
- Redis (Upstash) for JWT blacklist

**Libraries:**
- ua-parser-js (device info parsing)
- @supabase/supabase-js (Supabase client with Realtime)
- ioredis or @upstash/redis (Redis client)

**Internal Dependencies:**
- users table (from Story 1.2)
- Supabase Auth JWT with jti claim

## Dev Agent Record

### Context Reference

Story Context XML: `docs/sprint-artifacts/1-4-session-management.context.xml`

This context file contains:
- Complete acceptance criteria breakdown (8 ACs)
- Service interfaces (SessionService, JWTBlacklistService, DeviceInfoParser)
- API endpoint specifications (GET/DELETE sessions)
- Realtime integration patterns (Supabase Realtime session.terminated events)
- Testing strategy (Unit, Integration, E2E with multi-browser support)
- Performance targets (Session list <200ms, Logout all <500ms, Realtime propagation <1s)

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story completion -->

### File List

<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log

- 2025-11-20: Story drafted by Mariusz (from Epic 1 + Tech Spec Epic 1)
- 2025-11-22: Backend implementation completed (Tasks 1-7) by Claude Sonnet 4.5
  - Database: user_sessions table with indexes and constraints
  - Services: SessionService, JWTBlacklistService, DeviceInfoParser
  - API endpoints: GET/DELETE sessions (list, logout all, terminate individual)
  - Dependencies: @upstash/redis, ua-parser-js
  - GeoIP skipped for MVP (as per notes)
  - Deferred to Story 1.14: Tasks 8-11 (Frontend, Realtime, Tests, Cron)

Story Context XML: `docs/sprint-artifacts/1-4-session-management.context.xml`

This context file contains:
- Complete acceptance criteria breakdown (8 ACs)
- Service interfaces (SessionService, JWTBlacklistService, DeviceInfoParser)
- API endpoint specifications (GET/DELETE sessions)
- Realtime integration patterns (Supabase Realtime session.terminated events)
- Testing strategy (Unit, Integration, E2E with multi-browser support)
- Performance targets (Session list <200ms, Logout all <500ms, Realtime propagation <1s)
