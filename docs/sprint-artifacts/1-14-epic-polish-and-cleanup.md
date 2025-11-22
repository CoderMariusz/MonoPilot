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

**AC-1.4**: Signup Status Automation (from Story 1.3 AC-002.8 - HIGH PRIORITY)
- Supabase Auth webhook configured for `auth.users.created` event
- Webhook handler calls `acceptInvitation(token)` automatically
- Updates `users.status = 'active'` after successful signup
- Updates `user_invitations.status = 'accepted', accepted_at = NOW()`
- Invalidates invitation token (one-time use enforced)

**AC-1.5**: Auto-Cleanup Cron Job (from Story 1.3 Task 9, AC-003.4)
- Weekly cron job configured (Sunday 2am UTC)
- Deletes invitations WHERE status = 'expired' AND expires_at < NOW() - 30 days
- Logs deleted count for monitoring
- Configured in vercel.json or Supabase Edge Functions

**AC-1.6**: Invitation Flow Tests (from Story 1.3 Tasks 10-11)
- **Unit Tests:**
  - Token generation with 7-day expiry validation
  - Token validation with expired tokens
  - QR code generation output format
- **Integration Tests:**
  - POST /api/settings/users → invitation sent within 5s
  - Invitation record created in DB with correct expiry
  - Resend invitation → new token, old invalidated
  - Signup with valid token → user.status = 'active'
- **E2E Tests (Playwright):**
  - Complete flow: create user → email sent → signup → dashboard
  - Expired token handling
  - Resend/cancel invitation flows

### AC-2: Story 1.7 Machine Configuration - Deferred Items

**AC-2.1**: E2E Tests for Machine CRUD (from Story 1.7 Tasks 11, Priority: MEDIUM)
- Playwright E2E tests for machine creation flow
- Playwright E2E tests for machine editing flow
- Playwright E2E tests for machine deletion with FK constraints
- Playwright E2E tests for filter/search functionality
- Integration tests currently in place, E2E coverage needed before production

**AC-2.2**: Redis Cache Integration (from Story 1.7 Task 10, AC-006.8, Priority: LOW)
- Backend cache invalidation events already emitted ('machine.updated')
- Redis SET/GET calls need implementation
- Frontend SWR cache invalidation on events
- Cache key: `machines:{org_id}`, TTL: 5 min
- Currently works without cache, optimization for scale

**AC-2.3**: Task 9 - Line Assignment UI (from Story 1.7 Task 9, AC-006.3, Priority: BLOCKED)
- Blocked by Story 1.8 (production_lines table creation)
- Line assignment multi-select dropdown in MachineFormModal
- Backend logic already complete (machine-service.ts)
- Can be completed immediately after Story 1.8

**AC-2.4**: AC-006.7 - Machine Detail Page (from Story 1.7 Task 8, Priority: OPTIONAL)
- Optional enhancement (list + modal provides full functionality)
- Navigate to /settings/machines/:id
- Display: code, name, status, capacity, assigned lines
- Related entities: Active WOs (Epic 4 integration)
- Can be deferred to later phase

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
  - [ ] Webhook secret
- [ ] Document setup instructions
  - [ ] Supabase webhook configuration
  - [ ] Vercel cron setup
  - [ ] SendGrid API key setup
- [ ] Update README with invitation flow

### Task 7: Story 1.7 - E2E Tests for Machine CRUD (AC-2.1)
- [ ] Create tests/e2e/machines.spec.ts
- [ ] E2E test: Create machine flow (with all validations)
- [ ] E2E test: Edit machine flow (update status, capacity)
- [ ] E2E test: Delete machine with FK constraints (error handling)
- [ ] E2E test: Filter machines by status
- [ ] E2E test: Search machines by code/name
- [ ] E2E test: Sort machines by different columns
- [ ] Run tests in CI pipeline

### Task 8: Story 1.7 - Redis Cache Integration (AC-2.2)
- [ ] Implement Redis SET on machine create/update
- [ ] Implement Redis GET on machine list endpoint
- [ ] Implement cache invalidation on mutation events
- [ ] Frontend: Add SWR cache invalidation on events
- [ ] Test cache hit rate (target >80%)
- [ ] Monitor cache performance

### Task 9: Story 1.7 - Line Assignment UI (AC-2.3) - BLOCKED BY STORY 1.8
- [ ] Wait for Story 1.8 (production_lines table)
- [ ] Add multi-select dropdown to MachineFormModal
- [ ] Fetch production lines from API
- [ ] Display selected lines as removable badges
- [ ] Handle add/remove line assignments
- [ ] Test bidirectional assignment (machine → line, line → machine)

### Task 10: Story 1.7 - Machine Detail Page (AC-2.4) - OPTIONAL
- [ ] Create /app/settings/machines/[id]/page.tsx
- [ ] Display machine basic info
- [ ] Display assigned lines with links
- [ ] Add Edit/Change Status actions
- [ ] Epic 4 integration: Active WOs using machine
- [ ] Historical usage stats

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
