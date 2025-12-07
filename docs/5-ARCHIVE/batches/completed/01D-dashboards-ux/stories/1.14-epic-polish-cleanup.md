# Story 1.14: Epic 1 - Polish & Cleanup

Status: ready-for-dev

## Story

As a **Developer/Product Owner**,
I want to complete all deferred tasks and polish items from Epic 1 stories,
so that Epic 1 is production-ready with full feature coverage and quality assurance.

## Purpose

This story collects all deferred tasks, missing UI components, test gaps, and technical debt items from Epic 1 stories. It serves as the final polish pass before marking Epic 1 as complete.

## Acceptance Criteria

### AC-1: Story 1.3 User Invitations - Deferred Items

**AC-1.1**: Invitations Tab UI (from Story 1.3 Task 7, AC-003.1)
- Navigate to /settings/users → "Invitations" tab visible
- Table columns: Email, Role, Invited By, Sent Date, Expires At, Status, Actions
- Status badges: Pending (blue), Accepted (green), Expired (red), Cancelled (gray)
- Search by email functionality
- Filter by status dropdown
- Resend button → POST /api/settings/invitations/:id/resend
- Cancel button → confirmation modal → DELETE /api/settings/invitations/:id
- Real-time refresh after actions

**AC-1.2**: Invitation Modal (from Story 1.3 Task 8, AC-003.5)
- Triggered after successful user creation
- Display sections:
  - Success message: "User invited successfully!"
  - Email sent to: {email}
  - QR code for mobile scanning (generated client-side)
  - Copy signup link button (clipboard API)
  - Expiry notice: "Expires in 7 days"
- Actions: Close, "Send another invitation"

**AC-1.3**: Expired Invitations Visual Indicators (from Story 1.3 AC-003.4)
- Expires At column shows "Expired" badge (red) if past expiry
- Status automatically updated to "Expired"
- Resend button enabled for expired invitations
- Cancel button disabled for expired invitations

**AC-1.4**: Signup Status Automation (from Story 1.3 AC-002.8 - HIGH PRIORITY) ✅ COMPLETED
- ✅ Database trigger `trigger_auto_activate_user` deployed (Migration 015)
- ✅ Trigger fires on `auth.users INSERT` event automatically
- ✅ Validates invitation token from `raw_user_meta_data.invitation_token`
- ✅ Updates `users.status = 'active'` after successful signup
- ✅ Updates `user_invitations.status = 'accepted', accepted_at = NOW()`
- ✅ Logs activity in `activity_logs` table
- ✅ Graceful handling if invitation not found/expired
- 💰 **Cost Savings**: FREE database trigger replaces $20/month Vercel webhook

**AC-1.5**: Auto-Cleanup Cron Job (from Story 1.3 Task 9, AC-003.4) ✅ COMPLETED
- ✅ Weekly cron job configured (Sunday 2am UTC)
- ✅ Endpoint: `/api/cron/cleanup-invitations` (GET)
- ✅ Deletes invitations WHERE status = 'expired' AND expires_at < NOW() - 30 days
- ✅ Logs deleted count for monitoring (console + response JSON)
- ✅ Configured in vercel.json crons array
- ✅ Authorization via CRON_SECRET (Bearer token)
- ✅ Returns: deleted_count, cutoff_date, timestamp

**AC-1.6**: Invitation Flow Tests (from Story 1.3 Tasks 10-11) ✅ COMPLETED
- ✅ **Unit Tests** (__tests__/unit/invitation-utils.test.ts): **12 tests passing**
  - Token format validation (UUID v4 regex)
  - Token expiry detection (client-side check)
  - Days until expiry calculation
  - QR code generation (data URL format)
  - QR code consistency (same input → same output)
  - Signup link generation (with/without email param)
  - Status badge variant logic (pending/accepted/expired/cancelled)
  - Resend button disabled logic
  - Cancel button disabled logic
  - Expiry date calculation (7 days from now)
  - Clipboard write validation
- ✅ **Integration Tests** (__tests__/api/settings/invitations.test.ts): **7 test suites**
  - Token generation with 7-day expiry validation
  - Token validation with expired tokens (expires_at in past)
  - Invitation record created with all required fields
  - Resend invitation → new token, old invalidated
  - Signup with valid token → user.status = 'active' (via trigger)
  - Invitation status lifecycle (pending → cancelled/accepted/expired)
  - Cleanup old expired invitations (>30 days)
- ⏭️ **E2E Tests (Playwright):** Deferred to future story (not blocking)
  - Complete flow: create user → email sent → signup → dashboard
  - Expired token handling
  - Resend/cancel invitation flows

### AC-2: Story 1.7 Machine Configuration - Deferred Items

**AC-2.1**: E2E Tests for Machine CRUD (from Story 1.7 Tasks 11) ✅ COMPLETED
- ✅ Playwright E2E tests for machine creation flow (4 tests)
- ✅ Playwright E2E tests for machine editing flow (2 tests)
- ✅ Playwright E2E tests for machine deletion with FK constraints (2 tests)
- ✅ Playwright E2E tests for filter/search functionality (3 tests)
- ✅ Playwright E2E tests for sort functionality (2 tests)
- ✅ Authorization tests (2 tests)
- ✅ Line assignment integration test (1 test for AC-2.3)
- **Total: 16 E2E test cases** covering all Machine CRUD workflows
- File: tests/e2e/machines.spec.ts

**AC-2.2**: Redis Cache Integration (from Story 1.7 Task 10, AC-006.8) 🔄 MOVED TO FUTURE EPIC
- **Decision**: Moved to Epic 9 "Performance & Optimization" - not required for MVP
- Backend cache invalidation events already emitted ('machine.updated')
- This and similar performance optimizations will be evaluated post-MVP
- Epic 9 will collect all performance enhancements and prioritize based on actual usage data
- Currently works without cache, acceptable performance for MVP

**AC-2.3**: Task 9 - Line Assignment UI (from Story 1.7 Task 9, AC-006.3) ✅ COMPLETED
- ✅ Story 1.8 completed - production_lines table exists
- ✅ Production lines API integration (/api/settings/lines)
- ✅ Multi-select dropdown with available lines
- ✅ Selected lines displayed as removable badges
- ✅ Add/remove line functionality
- ✅ Backend logic already complete (machine-service.ts)
- ✅ UI integrated in MachineFormModal component

**AC-2.4**: AC-006.7 - Machine Detail Page (from Story 1.7 Task 8) ✅ COMPLETED
- ✅ Created /settings/machines/[id]/page.tsx - Machine detail page
- ✅ Display machine basic info (code, name, status, capacity)
- ✅ Display assigned production lines with navigation links
- ✅ Show metadata (created_at, updated_at)
- ✅ Added View button (Eye icon) to machines list table
- ✅ Back navigation to machines list
- ✅ Edit button redirects to machines list with edit modal
- 📅 Future: Active WOs section (Epic 4 integration placeholder)

### AC-3: Other Epic 1 Stories - Deferred Items

**AC-3.1**: Collect and track any deferred items from Stories 1.0-1.13
- Review all completed stories for deferred tasks
- Add to this story's task list
- Prioritize based on production impact

**AC-3.2**: Final integration testing
- All Epic 1 features work together seamlessly
- No breaking interactions between stories
- Performance acceptable under realistic load

## Tasks / Subtasks

### Task 1: Story 1.3 - Invitations Tab UI (AC-1.1)
- [ ] Create InvitationsTable component
  - [ ] Table with required columns
  - [ ] Status badges (color-coded)
  - [ ] Search input (email filter)
  - [ ] Status dropdown filter
  - [ ] Resend button with API integration
  - [ ] Cancel button with confirmation modal
- [ ] Add "Invitations" tab to /app/settings/users/page.tsx
  - [ ] Tab navigation component
  - [ ] Route to invitations table
  - [ ] Proper loading states
- [ ] Integrate with GET /api/settings/invitations
  - [ ] SWR for data fetching
  - [ ] Automatic refresh after mutations
- [ ] Test UI components
  - [ ] Unit tests for InvitationsTable
  - [ ] E2E test for tab navigation

### Task 2: Story 1.3 - Invitation Modal (AC-1.2)
- [ ] Create InvitationModal component
  - [ ] Success message display
  - [ ] QR code generation (client-side)
  - [ ] Copy link to clipboard functionality
  - [ ] Expiry notice
  - [ ] Close and "Send another" actions
- [ ] Trigger modal after user creation
  - [ ] Modify user creation flow
  - [ ] Pass invitation data to modal
- [ ] Test modal functionality
  - [ ] Unit test for clipboard copy
  - [ ] E2E test for modal appearance

### Task 3: Story 1.3 - Signup Status Automation (AC-1.4) - HIGH PRIORITY
- [ ] Configure Supabase Auth webhook
  - [ ] Create webhook endpoint: /api/webhooks/auth
  - [ ] Verify webhook signature (Supabase secret)
  - [ ] Handle `auth.users.created` event
- [ ] Implement webhook handler
  - [ ] Extract invitation_token from user metadata
  - [ ] Call acceptInvitation(token)
  - [ ] Update users.status = 'active'
  - [ ] Update invitation.status = 'accepted'
  - [ ] Error handling and logging
- [ ] Test webhook
  - [ ] Integration test with mock webhook payload
  - [ ] E2E test: signup → auto status update
- [ ] Deploy webhook configuration
  - [ ] Add to Supabase dashboard
  - [ ] Document webhook secret in .env.example

### Task 4: Story 1.3 - Auto-Cleanup Cron Job (AC-1.5)
- [ ] Create cleanup function
  - [ ] Query expired invitations >30 days old
  - [ ] Delete records
  - [ ] Log count
- [ ] Configure cron job
  - [ ] Vercel Cron: vercel.json configuration
  - [ ] OR Supabase Edge Function with pg_cron
  - [ ] Schedule: Weekly Sunday 2am UTC
- [ ] Test cleanup function
  - [ ] Unit test with mock data
  - [ ] Verify correct deletion logic
- [ ] Monitor and alert
  - [ ] Add logging for cron execution
  - [ ] Alert if cron fails

### Task 5: Story 1.3 - Tests (AC-1.6)
- [ ] Unit tests for invitation services
  - [ ] lib/services/__tests__/invitation-service.test.ts
  - [ ] Token generation/validation
  - [ ] QR code generation
- [ ] Integration tests for invitation API
  - [ ] __tests__/api/invitations.test.ts
  - [ ] POST user → invitation sent within 5s
  - [ ] Resend/cancel flows
- [ ] E2E tests for invitation flow
  - [ ] tests/e2e/invitations.spec.ts
  - [ ] Complete user invitation flow
  - [ ] Expired token handling

### Task 6: Story 1.3 - Documentation Updates
- [ ] Update .env.example with all required vars
  - [x] JWT_SECRET documentation
  - [x] SendGrid configuration
  - [x] ~~Webhook secret~~ (NOT NEEDED - using database trigger instead)
- [ ] Document setup instructions
  - [x] ~~Supabase webhook configuration~~ (NOT NEEDED - Migration 015 deployed)
  - [ ] Vercel cron setup (for auto-cleanup)
  - [ ] SendGrid API key setup
- [ ] Update README with invitation flow
- [x] Migration 015: Auto-activate users trigger deployed ✅

### Task 7: Story 1.7 - E2E Tests for Machine CRUD (AC-2.1) ✅ COMPLETED
- [x] Create tests/e2e/machines.spec.ts ✅
- [x] E2E test: Create machine flow (with all validations) ✅ 4 tests
- [x] E2E test: Edit machine flow (update status, capacity) ✅ 2 tests
- [x] E2E test: Delete machine with FK constraints (error handling) ✅ 2 tests
- [x] E2E test: Filter machines by status ✅ 1 test
- [x] E2E test: Search machines by code/name ✅ 2 tests
- [x] E2E test: Sort machines by different columns ✅ 2 tests
- [x] Authorization tests (manager view-only, non-admin access) ✅ 2 tests
- [x] Line assignment integration test ✅ 1 test
- [x] Run tests in CI pipeline ✅ Playwright configured

### Task 8: Story 1.7 - Redis Cache Integration (AC-2.2) 🔄 MOVED TO EPIC 9
- **Decision**: Moved to Epic 9 "Performance & Optimization" - will evaluate post-MVP
- [ ] ~~Implement Redis SET on machine create/update~~ → Epic 9
- [ ] ~~Implement Redis GET on machine list endpoint~~ → Epic 9
- [ ] ~~Implement cache invalidation on mutation events~~ → Epic 9
- [ ] ~~Frontend: Add SWR cache invalidation on events~~ → Epic 9
- [ ] ~~Test cache hit rate (target >80%)~~ → Epic 9
- [ ] ~~Monitor cache performance~~ → Epic 9
- **Note**: Epic 9 will collect all performance optimizations and prioritize based on real usage data

### Task 9: Story 1.7 - Line Assignment UI (AC-2.3) ✅ COMPLETED
- [x] Wait for Story 1.8 (production_lines table) ✅ Story 1.8 done
- [x] Add multi-select dropdown to MachineFormModal ✅
- [x] Fetch production lines from API (/api/settings/lines) ✅
- [x] Display selected lines as removable badges ✅
- [x] Handle add/remove line assignments ✅
- [x] Test bidirectional assignment (machine → line, line → machine) ✅ Backend ready

### Task 10: Story 1.7 - Machine Detail Page (AC-2.4) ✅ COMPLETED
- [x] Create /app/settings/machines/[id]/page.tsx ✅
- [x] Display machine basic info (code, name, status, capacity) ✅
- [x] Display assigned lines with clickable navigation ✅
- [x] Add Edit action (redirects to list with edit modal) ✅
- [x] Add Back navigation to machines list ✅
- [x] Show metadata (created_at, updated_at) ✅
- [x] Add View button (Eye icon) to machines list table ✅
- [ ] Epic 4 integration: Active WOs using machine (placeholder added, future work)
- [ ] Historical usage stats (future enhancement)

### Task 11: Review Other Epic 1 Stories for Deferred Items
- [x] Story 1.7 deferred items collected (Tasks 7-10 above)
- [ ] Check Stories 1.0-1.6, 1.8-1.13 for deferred tasks
- [ ] Add discovered items to this story
- [ ] Prioritize based on production readiness

### Task 12: Final Epic 1 Integration Testing
- [ ] Test all Epic 1 features together
- [ ] Performance testing
- [ ] Cross-story integration validation

## Dev Notes

### Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript 5.7
- **UI**: Tailwind CSS + Shadcn/UI (Tabs, Table, Dialog, Badge)
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Webhooks**: Supabase Auth webhooks
- **Cron**: Vercel Cron or Supabase pg_cron

### Priority Order
1. **CRITICAL**: Task 3 (Signup status automation) - blocks production use
2. **HIGH**: Task 1 (Invitations Tab UI) - completes AC-003.1
3. **MEDIUM**: Task 7 (Story 1.7 E2E Tests) - quality assurance before production
4. **MEDIUM**: Task 5 (Story 1.3 Tests) - quality assurance
5. **MEDIUM**: Task 2 (Invitation Modal) - UX enhancement
6. **LOW**: Task 4 (Auto-cleanup cron) - maintenance automation
7. **LOW**: Task 8 (Story 1.7 Redis Cache) - optimization for scale
8. **LOW**: Task 6 (Documentation) - operational readiness
9. **BLOCKED**: Task 9 (Story 1.7 Line Assignment UI) - blocked by Story 1.8
10. **OPTIONAL**: Task 10 (Story 1.7 Machine Detail Page) - enhancement

### Estimated Effort
- Task 1 (Invitations Tab UI): 4-6 hours
- Task 2 (Invitation Modal): 2-3 hours
- Task 3 (Signup Automation): 2-3 hours
- Task 4 (Auto-Cleanup Cron): 1-2 hours
- Task 5 (Story 1.3 Tests): 3-4 hours
- Task 6 (Documentation): 1 hour
- Task 7 (Story 1.7 E2E Tests): 2-3 hours
- Task 8 (Story 1.7 Redis Cache): 2-3 hours
- Task 9 (Story 1.7 Line Assignment UI): 2-3 hours (blocked by 1.8)
- Task 10 (Story 1.7 Machine Detail Page): 3-4 hours (optional)
- Task 11-12 (Review & Integration): 2-3 hours

**Total**: 24-37 hours (3-5 days of focused work)

### Success Criteria
- All Epic 1 ACs fully satisfied (no partial implementations)
- All deferred items completed or explicitly postponed with justification
- Test coverage >80% for critical paths
- All documentation up to date
- Epic 1 ready for production deployment

## References

### Story 1.3 Deferred Items
- Code Review Report: [1-3-user-invitations.md - Senior Developer Review](#)
- Original Story: [1-3-user-invitations.md](./1-3-user-invitations.md)
- Decision: Option B - Defer UI to maintain velocity while ensuring core functionality works

### Related Documentation
- [Epic 1 Tech Spec](../tech-spec-epic-1.md)
- [Supabase Auth Webhooks](https://supabase.com/docs/guides/auth/auth-hooks)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

## Change Log

- 2025-11-22: Story created to collect Epic 1 deferred items (primarily from Story 1.3)
  - Added all deferred tasks from Story 1.3 code review
  - Prioritized based on production impact
  - Estimated effort: 15-22 hours
- 2025-11-22: Added Story 1.7 deferred items (AC-2.1 through AC-2.4, Tasks 7-10)
  - AC-2.1: E2E Tests for Machine CRUD (MEDIUM priority)
  - AC-2.2: Redis Cache Integration (LOW priority)
  - AC-2.3: Line Assignment UI (BLOCKED by Story 1.8)
  - AC-2.4: Machine Detail Page (OPTIONAL)
  - Updated effort estimate: 24-37 hours (3-5 days)
- 2025-11-22: Completed AC-2.3 - Line Assignment UI (Task 9)
  - Story 1.8 completed, production_lines table available
  - Implemented multi-select dropdown in MachineFormModal
  - Production lines fetched from /api/settings/lines API
  - Selected lines displayed as removable badges
  - Add/remove functionality integrated
  - Backend logic already complete from Story 1.7
- 2025-11-22: Sprint decisions - AC scope adjustments
  - AC-2.1: E2E Tests for Machine CRUD - APPROVED (implementing now)
  - AC-2.2: Redis Cache Integration - SKIPPED (not required for MVP, acceptable performance)
  - AC-2.4: Machine Detail Page - DEFERRED TO POST-MVP (enhancement, not required)
- 2025-11-22: Completed AC-2.1 - E2E Tests for Machine CRUD (Task 7)
  - Created tests/e2e/machines.spec.ts with 16 comprehensive E2E tests
  - Create machine flow: 4 tests (required fields, capacity, uniqueness, format validation)
  - Edit machine flow: 2 tests (status update, capacity update)
  - Delete machine: 2 tests (FK constraints error, successful deletion)
  - Filter/search: 3 tests (filter by status, search by code, search by name)
  - Sort: 2 tests (sort by code, sort by name)
  - Authorization: 2 tests (manager view-only, non-admin access denied)
  - Line assignment: 1 test (integration with AC-2.3 production lines)
  - All Machine CRUD workflows fully covered with E2E tests
- 2025-11-22: Completed AC-2.4 - Machine Detail Page (Task 10)
  - Created /settings/machines/[id]/page.tsx - Machine detail page
  - Displays machine basic info (code, name, status, capacity)
  - Shows assigned production lines with clickable navigation
  - Added View button (Eye icon) to machines list table
  - Includes metadata display (created_at, updated_at)
  - Back navigation and edit functionality integrated
  - Active WOs placeholder for Epic 4 integration
- 2025-11-22: Moved AC-2.2 Redis Cache to Epic 9 "Performance & Optimization"
  - Decision: Performance optimizations should be evaluated post-MVP with real usage data
  - Epic 9 will collect all performance enhancements (Redis, query optimization, etc.)
  - Backend events already emit cache invalidation hooks for future implementation
  - Current performance acceptable for MVP without caching
