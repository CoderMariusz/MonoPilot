# Dependencies

**Last Updated:** {YYYY-MM-DD HH:MM}
**Updated By:** SCRUM-MASTER

## Epic Dependencies

```
Epic 0 (Foundation)
    │
    ├─→ Story 0.1: Project setup ─────────┐
    │                                      │
    ├─→ Story 0.2: Architecture design ────┤
    │                                      │
    └─→ Story 0.3: Database schema ────────┼─→ Epic 1 (Auth System)
                                           │       │
                                           │       ├─→ Story 1.1: UX Design
                                           │       │       │
                                           │       ├─→ Story 1.2: Backend RLS ──┐
                                           │       │       │                    │
                                           │       ├─→ Story 1.3: Frontend UI   ├─→ Story 1.5: Integration
                                           │       │                            │
                                           │       └─→ Story 1.4: Middleware ───┘
                                           │
                                           └─→ Epic 2 (User Dashboard)
                                                   │
                                                   └─→ Depends on Epic 1 complete
```

## Story Dependencies (Current Epic: E1)

### Critical Path (Longest Chain)
```
E1-S1.1 (UX Design)
    → E1-S1.3 (Frontend UI)
        → E1-S1.5 (Integration Tests)
            → E1-S1.6 (Documentation)
                → E1-S1.7 (Performance Testing)
```
**Critical Path Duration:** ~8-10 hours

### Dependency Matrix

| Story | Depends On | Type | Status | Blocker | Resolution ETA |
|-------|------------|------|--------|---------|----------------|
| E1-S1.1 | - | - | ✓ Complete | - | - |
| E1-S1.2 | E0-S0.3 | Hard | ✓ Ready | - | - |
| E1-S1.3 | E1-S1.1 | Hard | ⏸ Blocked | Handoff pending | 2025-12-05 10:30 |
| E1-S1.4 | E1-S1.2 | Hard | ⏳ Waiting | Backend in progress | 2025-12-05 12:00 |
| E1-S1.5 | E1-S1.3, E1-S1.4 | Hard | ⏳ Waiting | Multiple deps | 2025-12-05 14:00 |
| E1-S1.6 | E1-S1.4 | Soft | ⏳ Waiting | Impl complete | 2025-12-05 13:00 |
| E1-S1.7 | E1-S1.5 | Soft | ⏳ Waiting | Tests complete | 2025-12-06 09:00 |
| - | - | - | - | - | - |

**Legend:**
- ✓ Complete - Dependency satisfied
- ✓ Ready - No blockers
- ⏸ Blocked - Waiting on action
- ⏳ Waiting - Dependency in progress
- ❌ Failed - Dependency blocked

## External Dependencies

| Dependency | Type | Owner | Required For | Status | ETA | Risk | Mitigation |
|------------|------|-------|--------------|--------|-----|------|------------|
| Supabase Auth API | External Service | Supabase | E1-S1.2, E1-S1.4 | ✓ Available | - | Low | Mock for tests |
| Design System v2 | Internal Team | Design Team | E1-S1.3 | ⏳ In Progress | 2025-12-05 12:00 | Medium | Use v1 fallback |
| PostgreSQL 15+ | Infrastructure | DevOps | E1-S1.2 | ✓ Available | - | Low | Local dev setup |
| - | - | - | - | - | - | - | - |

**Dependency Types:**
- **External Service:** Third-party APIs, cloud services
- **Internal Team:** Cross-team dependencies
- **Infrastructure:** Platform, tools, environments
- **Data:** Test data, migrations, seeds

## Blockers (Active)

| Item | Type | Blocked By | Impact | Since | Owner | Resolution Plan | Priority |
|------|------|------------|--------|-------|-------|-----------------|----------|
| E1-S1.3 | Story | UX handoff pending | Frontend dev idle | 2025-12-05 08:30 | SCRUM-MASTER | Execute handoff now | P0 |
| - | - | - | - | - | - | - | - |

## Blocker Resolution History

| Date | Blocker | Resolution | Duration | Impact Avoided | Lesson Learned |
|------|---------|------------|----------|----------------|----------------|
| 2025-12-04 | Design System delay | Used v1 components | 2h | 4h dev time saved | Maintain fallback options |
| 2025-12-03 | Database migration failed | Rollback + fix | 1h | Data corruption avoided | Test migrations locally first |
| - | - | - | - | - | - |

## Cross-Story Dependencies

### Backend → Frontend Flow
```
E1-S1.2 (Backend RLS) ──────→ E1-S1.4 (Middleware)
                                      │
                                      ↓
                              E1-S1.3 (Frontend UI) ←── E1-S1.1 (UX Design)
                                      │
                                      ↓
                              E1-S1.5 (Integration Tests)
```

### Test-Driven Flow
```
TEST-ENGINEER writes tests ──→ BACKEND-DEV implements ──→ QA-AGENT validates
       (E1-S1.1-T)                    (E1-S1.2)                (E1-S1.5)
```

## Dependency Chains (All)

**Chain 1: Authentication Backend**
- E0-S0.3 (DB Schema) → E1-S1.2 (RLS) → E1-S1.4 (Middleware) → E1-S1.5 (Integration)

**Chain 2: Frontend UI**
- E1-S1.1 (UX) → E1-S1.3 (UI Impl) → E1-S1.5 (Integration)

**Chain 3: Documentation**
- E1-S1.4 (Middleware) → E1-S1.6 (Docs) → E1-S1.7 (Performance)

**Chain 4: Quality Gates**
- E1-S1.5 (Integration) → E1-S1.7 (Performance) → Epic 1 Complete

## Parallel Work Opportunities

### No Dependencies (Can Start Now)
- ✓ E1-S1.2 (Backend RLS) - Active
- ⏸ E1-S1.3 (Frontend UI) - Blocked by handoff

### After E1-S1.2 Complete
**Can run in parallel:**
- E1-S1.4 (Middleware refactor)
- E1-S1.2-R (Code review)
- E1-S1.3 continues (independent)

### After E1-S1.3 & E1-S1.4 Complete
**Must wait for both:**
- E1-S1.5 (Integration tests)

**Can run in parallel:**
- E1-S1.6 (Documentation) - only needs E1-S1.4

## Dependency Risk Assessment

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Design System v2 delay | Medium | High | Use v1 fallback, create adapter layer | FRONTEND-DEV |
| External API downtime | Low | High | Implement circuit breaker, use mocks | BACKEND-DEV |
| Test data generation delay | Low | Medium | Use faker library, automate generation | TEST-ENGINEER |
| Cross-team handoff delays | Medium | Medium | Define clear handoff criteria, automate | SCRUM-MASTER |
| - | - | - | - | - |

## Dependency Management Rules

### Adding Dependencies
1. Identify during story breakdown (SCRUM-MASTER)
2. Classify type (Hard/Soft/External)
3. Add to matrix with ETA
4. Update dependency graph
5. Notify affected agents

### Monitoring Dependencies
- **Daily:** Check blocked items
- **On completion:** Update dependent stories
- **On blocker:** Escalate immediately
- **Weekly:** Review external dependencies

### Resolution Process
1. **Identify blocker** - Any agent can flag
2. **Assess impact** - SCRUM-MASTER evaluates
3. **Create plan** - Assign owner, set deadline
4. **Execute** - Owner resolves
5. **Verify** - Confirm unblocked
6. **Document** - Add to resolution history

## Alerts & Warnings

- [ ] **CRITICAL:** P0 story blocked > 1h → E1-S1.3 blocked 1h 45m
- [ ] **WARNING:** Dependency chain depth = 4 (at limit)
- [ ] **INFO:** 2 stories waiting on E1-S1.2 completion
- [ ] **MONITOR:** Design System v2 ETA approaching (12:00)

## Dependency Metrics

**Current Sprint:**
- Total stories: 7
- Stories with dependencies: 6 (86%)
- Hard dependencies: 8
- Soft dependencies: 2
- External dependencies: 3
- Blocked stories: 1 (14%)
- Average chain length: 2.8
- Longest chain: 5 stories

**Target Metrics:**
- Blocked stories: < 20%
- Max chain length: ≤ 4
- External deps: < 30%
- Blocker resolution: < 2h

## Notes
- Keep dependency chains short (max 4 deep)
- Identify parallel opportunities early
- Monitor external dependencies proactively
- Document all blockers and resolutions
- Update matrix as stories complete
