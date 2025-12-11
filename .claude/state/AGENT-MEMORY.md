# Agent Memory

**Last Updated:** {YYYY-MM-DD HH:MM}
**Current Session:** Session-{ID}
**Active Agents:** 3

---

## Session Overview

**Session Started:** 2025-12-05 09:30
**Session Duration:** 45 minutes
**Context Tokens Used:** 12,500 / 200,000 (6.3%)
**Agents Active:** SCRUM-MASTER, BACKEND-DEV, TEST-ENGINEER

**Current Focus:** Sprint planning for Epic 1 (Authentication System)

---

## Per-Agent Memory

### BACKEND-DEV (Sonnet 4.5)

**Last Active:** 2025-12-05 10:15
**Session Duration:** 45 minutes
**Context Usage:** 15,000 / 200,000 (7.5%)
**Current Task:** Implementing RLS policies (E1-S1.2)
**Status:** Active - 50% complete

#### Working Context
- Implementing Row Level Security for user data isolation
- Using Supabase Auth for authentication
- PostgreSQL 15+ with RLS enabled
- Test-driven approach (tests from TEST-ENGINEER)

#### Key Decisions Made
- Use database-level RLS (not application-level) - [D-004]
- Implement helper functions for common auth patterns
- RLS policies: `users_policy`, `profiles_policy`, `sessions_policy`

#### Files Being Modified
```
/database/migrations/20251205_rls_policies.sql
/database/functions/auth_helpers.sql
/lib/supabase/rls-policies.ts
/tests/integration/auth-rls.test.ts
```

#### Open Questions
- None currently

#### Next Steps
1. Complete `users_policy` implementation
2. Add RLS for `profiles` table
3. Test with multiple user scenarios
4. Handoff to CODE-REVIEWER

#### Learned This Session
- Supabase RLS syntax is slightly different from vanilla PostgreSQL
- Need to enable RLS on table AND create policies
- `auth.uid()` function available in policy context
- Performance impact minimal for simple policies

#### Gotchas Encountered
- **GOTCHA:** RLS policies must be created AFTER enabling RLS on table
  - **Solution:** Two-step migration: `ALTER TABLE ... ENABLE RLS;` then `CREATE POLICY`
- **GOTCHA:** `auth.uid()` returns NULL if not authenticated
  - **Solution:** Always check for NULL in policies

---

### TEST-ENGINEER (Sonnet 4.5)

**Last Active:** 2025-12-05 10:15
**Session Duration:** 15 minutes
**Context Usage:** 8,000 / 200,000 (4.0%)
**Current Task:** Writing integration tests for auth (E1-S1.1-T)
**Status:** Active - 80% complete

#### Working Context
- Writing tests BEFORE implementation (TDD Red phase)
- Covering RLS policies, user isolation, edge cases
- Using Jest + Supabase test client
- Target: 90%+ coverage for critical auth paths

#### Test Scenarios Covered
- [x] User can only read their own data
- [x] User cannot read other users' data
- [x] Admin can read all data
- [x] Anonymous users blocked
- [ ] Edge case: Concurrent sessions (in progress)
- [ ] Edge case: Token expiry

#### Files Created
```
/tests/unit/rls-policies.test.ts (complete)
/tests/integration/auth-rls.test.ts (80% complete)
/tests/edge-cases/rls.test.ts (40% complete)
/tests/fixtures/users.ts (complete)
```

#### Test Data Strategy
- Using `@faker-js/faker` for realistic test data
- 3 test users: `user_alice`, `user_bob`, `admin_charlie`
- Isolated test database (reset between tests)

#### Next Steps
1. Complete concurrent session tests
2. Add token expiry tests
3. Review with BACKEND-DEV
4. Handoff test suite (expected 11:00)

#### Learned This Session
- Supabase test client has built-in auth helpers
- Can simulate different users with `supabase.auth.setSession()`
- RLS policies apply even in test environment (good!)

#### Gotchas Encountered
- **GOTCHA:** Test database RLS must be enabled separately
  - **Solution:** Add RLS setup to test initialization script
- **GOTCHA:** `faker` generates random UUIDs that may collide
  - **Solution:** Use deterministic seeds for test data

---

### SCRUM-MASTER (Sonnet 4.5)

**Last Active:** 2025-12-05 10:15
**Session Duration:** 30 minutes
**Context Usage:** 12,500 / 200,000 (6.3%)
**Current Task:** Sprint planning for Epic 1
**Status:** Active

#### Working Context
- Breaking down Epic 1 into 7 stories
- Mapping dependencies between stories
- Assigning agents to stories
- Identifying parallel work opportunities

#### Key Insights
- E1-S1.3 blocked by pending handoff (1h 45m old)
- Current velocity below target (2.67 vs 4.0 pts/day)
- Need to unblock FRONTEND-DEV immediately
- 2 stories can run in parallel (E1-S1.2, E1-S1.3)

#### Impediments Identified
1. **Handoff H-005 delayed** (UX → Frontend)
   - **Impact:** High - blocking 8-point story
   - **Resolution:** Escalate to ORCHESTRATOR
   - **ETA:** Immediate

2. **Velocity behind target** (33% below)
   - **Impact:** Medium - risk to sprint goal
   - **Resolution:** Unblock parallel work
   - **ETA:** Today

#### Sprint Plan Summary
- 7 stories, 40 points total
- 3 stories have no dependencies (can start now)
- Critical path: 5 stories deep (at limit)
- Estimated completion: 88% confidence

#### Next Steps
1. Escalate handoff to ORCHESTRATOR
2. Monitor velocity after unblock
3. Check in with BACKEND-DEV (45m session time)
4. Complete sprint planning document

#### Learned This Session
- Handoff delays have cascading impact (8 points at risk)
- Dependency chains should be max 4 deep (we're at 5)
- Early identification of blockers prevents larger issues

---

### UX-DESIGNER (Haiku 4.0)

**Last Session:** 2025-12-05 08:45
**Session Duration:** 2h 15m
**Context Usage:** N/A (completed)
**Last Task:** Create wireframes for auth flow (E1-S1.1)
**Status:** Complete - Ready

#### What Was Delivered
- [x] Wireframes for login, registration, password reset, profile
- [x] Design tokens (colors, typography, spacing)
- [x] Component specifications
- [x] User flow diagrams
- [x] Accessibility requirements (WCAG 2.1 AA)
- [x] Responsive breakpoints

#### Quality Assessment
**9.8/10** - Exceptional work
- Clear, comprehensive specifications
- Excellent attention to detail
- Strong accessibility focus
- Ready for implementation

#### Handoff Ready
**H-005:** UX-DESIGNER → FRONTEND-DEV
- **Status:** Queued (1h 30m)
- **Action Required:** Execute handoff

#### Key Design Decisions
- Dark mode support (toggle in UI)
- Form validation: inline + on submit
- Animation: 300ms ease-in-out transitions
- Mobile-first responsive design

---

### FRONTEND-DEV (Sonnet 4.5)

**Last Active:** 2025-12-05 08:30
**Session Duration:** N/A
**Current Task:** UI implementation (E1-S1.3) - BLOCKED
**Status:** Waiting - Blocked by handoff

#### Waiting For
- **Handoff H-005** from UX-DESIGNER
- **Contains:** Wireframes, design tokens, component specs
- **Queued Since:** 08:45 (1h 45m ago)
- **Impact:** Cannot start 8-point story

#### Planned Approach (Once Unblocked)
1. Review wireframes and design specs
2. Set up component structure
3. Implement design tokens
4. Build form components (TDD approach)
5. Add Cypress E2E tests
6. Handoff to QA-AGENT

#### Estimated Duration
**4-6 hours** (Medium complexity)

#### Preparation Done
- Development environment ready
- Dependencies installed
- Familiar with design system v2

---

### SENIOR-DEV (Sonnet 4.5)

**Last Session:** 2025-12-04 17:00
**Session Duration:** 2h 30m
**Last Task:** Integration work (E1-S0.5)
**Status:** Ready - Available for new assignment

#### Last Accomplishments
- Completed integration of auth flow
- Code reviewed and merged
- Documentation updated

#### Available For
- E1-S1.4: Auth middleware refactoring
- Waiting for E1-S1.2 (Backend RLS) to complete
- Expected availability: After 12:00

#### Strengths/Preferences
- Complex integrations
- Architecture decisions
- Mentoring other developers
- Refactoring for clarity

---

### QA-AGENT (Haiku 4.0)

**Last Session:** 2025-12-04 16:00
**Last Task:** Test review (E1-S0.4)
**Status:** Ready - Available

#### Ready For
- E1-S1.5: Integration testing (waiting on E1-S1.3 + E1-S1.4)
- Can assist with test review if needed

#### Recent Quality Catches
- Found 3 edge cases in Sprint 2
- 92% first-pass test success rate
- Excellent test coverage recommendations

---

### CODE-REVIEWER (Sonnet 4.5)

**Last Session:** 2025-12-04 17:30
**Last Task:** Code review (E1-S0.5)
**Status:** Ready - Available

#### Ready For
- E1-S1.2-R: Code review for RLS implementation
- Expected after BACKEND-DEV completes (~12:00)

#### Review Focus Areas
- Security (RLS policies)
- Test coverage
- Code clarity
- Performance implications

---

## Cross-Agent Shared Knowledge

### Project-Wide Context

**Tech Stack:**
- Frontend: React 18 + TypeScript 5 + Tailwind CSS
- Backend: Supabase (PostgreSQL 15)
- Auth: Supabase Auth
- Testing: Jest + Cypress
- Deployment: Vercel

**Key Architectural Decisions:**
- [ADR-001] React + TypeScript + Supabase stack
- [ADR-002] TDD for all backend code
- [ADR-004] Database-level RLS for security
- [ADR-005] Supabase Auth (not custom)

**Current Sprint:** Sprint 3
- **Goal:** Implement authentication system (Epic 1)
- **Duration:** 2025-12-02 to 2025-12-13 (10 days)
- **Committed:** 40 story points
- **Completed:** 8 points (20%)
- **Status:** Behind schedule (4 points)

---

## Learned Patterns (All Agents)

### Pattern: TDD Workflow
**Context:** All backend development
**Process:**
1. TEST-ENGINEER writes failing tests (RED)
2. DEVELOPER implements to pass tests (GREEN)
3. DEVELOPER refactors for clarity (REFACTOR)
4. QA-AGENT validates integration

**Success Rate:** 95%
**Benefit:** 50% fewer bugs, better design

---

### Pattern: Handoff Process
**Context:** Between any two agents
**Process:**
1. FROM-AGENT completes work + documents
2. FROM-AGENT creates handoff in HANDOFFS.md
3. ORCHESTRATOR validates completeness
4. TO-AGENT reviews and acknowledges
5. TO-AGENT begins work

**Success Rate:** 95%
**Average Duration:** 23 minutes
**Key Success Factor:** Complete documentation

---

### Pattern: RLS Policy Implementation
**Context:** Database security (Supabase/PostgreSQL)
**Process:**
1. Enable RLS on table: `ALTER TABLE ... ENABLE RLS;`
2. Create policy: `CREATE POLICY ... USING (auth.uid() = user_id);`
3. Test with multiple users
4. Verify no data leakage

**Gotchas:**
- Must enable RLS BEFORE creating policies
- `auth.uid()` returns NULL when not authenticated
- Policies apply in test environment

---

### Pattern: Design-to-Code Handoff
**Context:** UX-DESIGNER → FRONTEND-DEV
**Required Artifacts:**
- Wireframes (Figma/link)
- Design tokens (code file)
- Component specifications
- User flows
- Accessibility requirements
- Responsive breakpoints

**Typical Duration:** 20-30 minutes
**Success Factor:** Comprehensive component specs

---

## Gotchas & Pitfalls (Project-Specific)

### Database

**GOTCHA: RLS Enable Order**
- **Issue:** Creating policy before enabling RLS fails
- **Solution:** Two-step migration: enable RLS, then create policy
- **Affected:** BACKEND-DEV
- **Discovered:** 2025-12-05

**GOTCHA: auth.uid() NULL Handling**
- **Issue:** `auth.uid()` returns NULL for unauthenticated users
- **Solution:** Always check NULL in policies: `WHERE auth.uid() IS NOT NULL AND ...`
- **Affected:** BACKEND-DEV, TEST-ENGINEER
- **Discovered:** 2025-12-05

---

### Testing

**GOTCHA: Test DB RLS Not Auto-Enabled**
- **Issue:** Test database doesn't inherit RLS settings
- **Solution:** Add RLS enable to test setup script
- **Affected:** TEST-ENGINEER
- **Discovered:** 2025-12-05

**GOTCHA: Faker UUID Collisions**
- **Issue:** Random UUIDs can collide in tests
- **Solution:** Use deterministic seeds: `faker.seed(123)`
- **Affected:** TEST-ENGINEER
- **Discovered:** 2025-12-05

---

### Frontend

**GOTCHA: Design System v2 Breaking Changes**
- **Issue:** Token names changed from v1
- **Solution:** Use migration guide, maintain v1 fallback
- **Affected:** FRONTEND-DEV
- **Discovered:** 2025-12-04

---

### Process

**GOTCHA: Handoff Delays Cascade**
- **Issue:** 1h handoff delay → 8 point story blocked → velocity drops
- **Solution:** Execute handoffs within 30m of completion
- **Affected:** SCRUM-MASTER, ORCHESTRATOR
- **Discovered:** 2025-12-05

---

## Useful Discoveries

### Supabase RLS Helpers
```sql
-- Get current user ID
auth.uid()

-- Get user role
auth.jwt() ->> 'role'

-- Check if user is admin
auth.jwt() ->> 'role' = 'admin'
```

### Test Data Factory Pattern
```typescript
// Reusable test user factory
const createTestUser = (seed: number) => {
  faker.seed(seed);
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName()
  };
};
```

### Handoff Quality Checklist
- [ ] All deliverables complete
- [ ] Documentation comprehensive
- [ ] Context provided
- [ ] Questions answered/documented
- [ ] Receiving agent acknowledged

**Result:** 95% handoff success rate when checklist followed

---

## Open Questions (Across Team)

### Q1: State Management Library Choice
**Asked By:** FRONTEND-DEV
**Context:** Need to decide Redux vs Zustand for E1-S1.3
**Status:** Pending decision (D-006)
**Due:** 2025-12-06
**Blockers:** None

### Q2: API Rate Limiting Strategy
**Asked By:** BACKEND-DEV
**Context:** Production deployment needs rate limiting
**Status:** Pending decision (D-007)
**Due:** 2025-12-06
**Priority:** P2

---

## Cross-Session Continuity

### Critical Information to Remember

**Epic 1 Status:**
- 7 stories, 40 points total
- 1 story complete, 2 in progress, 4 queued
- 1 blocker: Handoff H-005 (1h 45m old)
- Behind schedule: 4 points

**Active Blockers:**
1. **H-005 Handoff:** UX → Frontend (P0, immediate action)
2. **Velocity Issue:** 33% below target (monitor)

**Key Dates:**
- Sprint ends: 2025-12-13
- Demo scheduled: 2025-12-15
- Epic 1 deadline: 2025-12-13

**Dependencies:**
- E1-S1.3 depends on E1-S1.1 (handoff pending)
- E1-S1.4 depends on E1-S1.2 (in progress)
- E1-S1.5 depends on E1-S1.3 + E1-S1.4

---

## Recovery Information

### If Session Interrupted

**Current State:**
- Sprint planning in progress (SCRUM-MASTER)
- Backend RLS implementation active (BACKEND-DEV, 50% complete)
- Tests being written (TEST-ENGINEER, 80% complete)
- Frontend blocked (FRONTEND-DEV, waiting handoff)

**Immediate Actions Needed:**
1. Execute handoff H-005 (highest priority)
2. Monitor BACKEND-DEV progress (45m session time)
3. Prepare for TEST-ENGINEER → BACKEND-DEV handoff (~11:00)

**Files to Check:**
- `.claude/state/AGENT-STATE.md` - Agent status
- `.claude/state/TASK-QUEUE.md` - Task priorities
- `.claude/state/HANDOFFS.md` - Pending handoffs
- `.claude/state/DEPENDENCIES.md` - Blockers

**Context Preserved In:**
- AGENT-STATE.md - Real-time agent status
- HANDOFFS.md - Detailed handoff information
- DECISION-LOG.md - Decisions made
- METRICS.md - Progress tracking

---

## Memory Management Strategy

### What to Keep
**Critical (Always Retain):**
- Epic/sprint goals
- Active blockers
- Pending decisions
- Key architectural decisions
- Agent assignments

**Session (Summarize at End):**
- Detailed work logs
- File-level changes
- Intermediate steps
- Question/answer pairs

**Temporary (Clear After Task):**
- Debug output
- Test results
- Exploration notes
- Dead ends

### Memory Optimization
- Archive completed sprint data weekly
- Summarize old decisions (keep ID + summary)
- Compress detailed logs after 30 days
- Keep recent context (7 days) in full detail

---

## Agent-Specific Preferences

### BACKEND-DEV
- Prefers: Clear test requirements, architecture diagrams
- Communication: Technical detail appreciated
- Handoff needs: Complete test suite, acceptance criteria

### FRONTEND-DEV
- Prefers: Visual mockups, component specs
- Communication: Design rationale helpful
- Handoff needs: Design tokens, responsive breakpoints

### TEST-ENGINEER
- Prefers: User stories, edge case scenarios
- Communication: Examples of expected behavior
- Handoff needs: API docs, business rules

### SENIOR-DEV
- Prefers: Architecture context, trade-off analysis
- Communication: High-level then details
- Handoff needs: Design decisions, system constraints

---

## Notes

- Update this file as agents complete work
- Each agent should add learnings to their section
- Share gotchas immediately (prevent others hitting same issue)
- Archive old session data monthly
- Keep "Learned Patterns" section current and practical
- Cross-reference with DECISION-LOG.md for architectural memory

**Last Memory Optimization:** 2025-12-01
**Next Optimization:** 2025-12-31
