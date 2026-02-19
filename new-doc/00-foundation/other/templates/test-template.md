# Test Strategy: Story {N}.{M}

> **Story:** @docs/2-MANAGEMENT/epics/current/story-{N}.{M}.md
> **Autor:** TEST-ENGINEER
> **Data:** {DATA}
> **Faza TDD:** RED

---

## Test Overview

| Metryka | Target | Current |
|---------|--------|---------|
| Unit Test Coverage | ≥80% | {X}% |
| Integration Tests | All AC | {Y}/{Z} |
| E2E Tests | Happy paths | {status} |

---

## Test Categories

### 1. Unit Tests

#### {Component/Module 1}

```typescript
// Plik: tests/unit/{component}.test.ts

describe('{Component}', () => {
  describe('{method/function}', () => {
    it('should {expected behavior} when {condition}', () => {
      // Arrange
      const input = {/* test data */};

      // Act
      const result = component.method(input);

      // Assert
      expect(result).toBe(expectedValue);
    });

    it('should throw {ErrorType} when {invalid condition}', () => {
      // Arrange
      const invalidInput = {/* invalid data */};

      // Act & Assert
      expect(() => component.method(invalidInput))
        .toThrow(ErrorType);
    });
  });
});
```

**Test Cases:**

| # | Scenario | Input | Expected | Priority |
|---|----------|-------|----------|----------|
| U1 | Happy path | {valid} | {success} | High |
| U2 | Empty input | {} | {error} | High |
| U3 | Boundary value | {max} | {success} | Medium |
| U4 | Invalid type | {wrong type} | {error} | Medium |

---

### 2. Integration Tests

#### AC1: {Nazwa kryterium}

```typescript
// Plik: tests/integration/{feature}.test.ts

describe('AC1: {nazwa}', () => {
  beforeEach(async () => {
    // Setup test database/mocks
  });

  afterEach(async () => {
    // Cleanup
  });

  it('Given {precondition}, When {action}, Then {result}', async () => {
    // Given
    await setupPrecondition();

    // When
    const response = await performAction();

    // Then
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({/* expected */});
  });
});
```

**Test Cases:**

| AC | Scenario | Setup | Action | Expected |
|----|----------|-------|--------|----------|
| AC1 | Happy path | {setup} | {action} | {result} |
| AC1 | Error case | {setup} | {bad action} | {error} |
| AC2 | Happy path | {setup} | {action} | {result} |

---

### 3. E2E Tests

#### User Journey: {Nazwa}

```typescript
// Plik: tests/e2e/{journey}.spec.ts

describe('User Journey: {nazwa}', () => {
  it('should complete {journey} successfully', async () => {
    // Step 1: {opis}
    await page.goto('/start');
    await page.fill('#field', 'value');

    // Step 2: {opis}
    await page.click('button[type="submit"]');

    // Step 3: {opis}
    await expect(page.locator('.success')).toBeVisible();
  });
});
```

**Journeys to Test:**

| # | Journey | Steps | Priority |
|---|---------|-------|----------|
| E1 | {Happy path} | {N} | High |
| E2 | {Error recovery} | {N} | Medium |

---

## Edge Cases & Boundary Tests

| # | Case | Input | Expected | Test Type |
|---|------|-------|----------|-----------|
| EC1 | Max length | {max chars} | Accept | Unit |
| EC2 | Max + 1 | {max+1 chars} | Reject | Unit |
| EC3 | Concurrent edit | {2 users} | Conflict handling | Integration |
| EC4 | Network timeout | {timeout} | Graceful error | E2E |

---

## Mocking Strategy

### External Services

| Service | Mock Type | When to Mock |
|---------|-----------|--------------|
| {API 1} | MSW/nock | Unit, Integration |
| {Database} | In-memory | Unit |
| {Auth} | Fake provider | Unit, Integration |

### Mock Data

```typescript
// Plik: tests/fixtures/{feature}.fixtures.ts

export const validUser = {
  id: 'test-user-1',
  email: 'test@example.com',
  // ...
};

export const invalidUser = {
  id: '',
  email: 'not-an-email',
  // ...
};
```

---

## Test Data Requirements

| Data Type | Source | Setup | Cleanup |
|-----------|--------|-------|---------|
| Users | Fixtures | beforeEach | afterEach |
| Orders | Factory | beforeAll | afterAll |
| Config | Environment | CI/CD | N/A |

---

## Coverage Goals

### Files to Cover

| File | Target | Notes |
|------|--------|-------|
| src/{feature}/service.ts | 90% | Core logic |
| src/{feature}/controller.ts | 80% | API layer |
| src/{feature}/utils.ts | 100% | Pure functions |

### Exclusions (with reason)

| File/Pattern | Reason |
|--------------|--------|
| *.config.ts | Configuration only |
| *.types.ts | Type definitions |
| index.ts | Re-exports |

---

## Test Checklist (RED Phase)

### Before Implementation

- [ ] All AC have corresponding test cases
- [ ] Edge cases identified and test cases written
- [ ] Test data/fixtures prepared
- [ ] Mocks configured
- [ ] Tests FAIL (nothing implemented yet)
- [ ] Tests fail for the RIGHT reasons

### Verification

```bash
# Run tests - should see failures
npm test -- --grep "{feature}"

# Expected output:
# ✗ AC1: should {behavior}
# ✗ AC2: should {behavior}
#
# X failing, 0 passing
```

---

## Notes for GREEN Phase

Po napisaniu testów, przekaż do DEV:

- [ ] Wszystkie testy są w `tests/` directory
- [ ] Fixtures w `tests/fixtures/`
- [ ] Mocks skonfigurowane
- [ ] README z instrukcją uruchomienia testów

**Handoff command:**
```bash
npm test -- --grep "{feature}" --watch
```

---

**Handoff do:** BACKEND-DEV / FRONTEND-DEV (faza GREEN)
