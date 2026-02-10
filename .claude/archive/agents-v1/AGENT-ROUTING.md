# Test Agent Routing Guide

## Overview

This guide clarifies the separation between unit/integration testing (TDD) and E2E testing agents to avoid confusion and ensure correct delegation.

## unit-test-writer

**Purpose**: TDD RED phase unit and integration tests using Vitest

**Trigger**:
- User explicitly requests unit tests
- backend-dev or frontend-dev delegates for TDD RED phase (P1 in their workflow)

**Tools**: Vitest, testing-library, MSW

**Model**: Opus (for precision in test design)

**NO E2E**: This agent does NOT write E2E tests. For E2E tests, delegate to e2e-test-writer.

**Workflow**:
1. Receive test strategy from TEST-ENGINEER
2. Write test structure using Vitest
3. Verify all tests FAIL (RED phase)
4. Handoff to DEV agent for GREEN phase

**Output**: Unit test files in `__tests__/` directories, all failing

**Example delegation**:
```
@unit-test-writer: Write unit tests for NCRService.createNCR() method
Context: Story 06.9
Expected: Tests for validation, RLS, audit logging
```

---

## e2e-test-writer

**Purpose**: End-to-end Playwright tests with Phase 0 script automation

**Trigger**: ONLY spawned by master-e2e-test-writer orchestrator

**Tools**: Playwright, Phase 0 scripts (detect-type, extract-selectors)

**Model**: Haiku (for cost efficiency, templates provide structure)

**Savings**: 4000+ tokens via automation (scripts run upfront by orchestrator)

**Workflow**:
1. Phase 0: Scripts already run by orchestrator (data provided)
2. Phase 1: Generate template via `pnpm test:gen`
3. Phase 2-4: Fill TODOs using pre-extracted selectors
4. Phase 5-6: Run tests until 0 failures
5. Phase 7: Report results to orchestrator

**Output**: E2E test files in `e2e/tests/` directory, all passing

**Example delegation** (from master-e2e-test-writer):
```
Use e2e-test-writer for quality/ncr:

Pre-analyzed data (scripts already run):
- Test type detected: crud (98% confidence)
- Selectors extracted: 15 testIds, 9 form fields
- Page path: apps/frontend/app/(authenticated)/quality/ncr/page.tsx

Task: Generate and complete E2E tests, run until passing
Model: haiku
```

---

## When to Use Which

| Scenario | Agent | Reason |
|----------|-------|--------|
| TDD unit tests for service layer | unit-test-writer | Testing business logic in isolation |
| TDD integration tests for API routes | unit-test-writer | Testing API with mocked database |
| E2E tests for entire feature flow | e2e-test-writer | Testing user journey in browser |
| Testing multiple pages in epic | master-e2e-test-writer → e2e-test-writer | Parallel orchestration |
| RED phase before implementation | unit-test-writer | TDD workflow |
| Validation after implementation | e2e-test-writer | Acceptance testing |

---

## Key Differences

| Aspect | unit-test-writer | e2e-test-writer |
|--------|------------------|-----------------|
| **Test type** | Unit, Integration | E2E (Playwright) |
| **Framework** | Vitest | Playwright |
| **Model** | Opus | Haiku |
| **Phase** | RED (TDD) | GREEN (Acceptance) |
| **Orchestrator** | None | master-e2e-test-writer |
| **Script automation** | No | Yes (Phase 0) |
| **Expected state** | Failing tests | Passing tests |
| **Token cost** | ~2K per story | ~500 per feature (with scripts) |

---

## Common Mistakes to Avoid

1. **Don't use unit-test-writer for E2E tests** - It's not designed for Playwright
2. **Don't spawn e2e-test-writer directly** - Always use master-e2e-test-writer orchestrator
3. **Don't skip Phase 0 scripts** - They save 4000 tokens per feature
4. **Don't mix TDD RED with E2E** - Different phases, different agents

---

## Migration Note

**Old name**: `test-writer` (deprecated 2026-01-25)
**New names**:
- `unit-test-writer` (for TDD unit/integration tests)
- `e2e-test-writer` (for E2E Playwright tests)

All references to `test-writer` have been updated to use the appropriate specialized agent.
