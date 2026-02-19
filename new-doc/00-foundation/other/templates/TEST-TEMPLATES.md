# Test Templates

## Test Strategy Document Template

```markdown
# Test Strategy: Story {N}.{M} - {Story Title}

## Document Info
- **Story:** {story reference}
- **Created:** {date}
- **Test Engineer:** TEST-ENGINEER Agent
- **Coverage Target:** {percentage}%

## Acceptance Criteria Analysis

| AC ID | Acceptance Criteria | Test Type | Priority | Complexity |
|-------|---------------------|-----------|----------|------------|
| AC-1 | {criteria text} | Unit | High | S |
| AC-2 | {criteria text} | Integration | High | M |
| AC-3 | {criteria text} | E2E | Medium | L |

## Test Scenarios

### AC-1: {Criteria Summary}

#### Happy Path
| Scenario | Given | When | Then | Test Type |
|----------|-------|------|------|-----------|
| {name} | {precondition} | {action} | {result} | Unit |

#### Edge Cases
| Scenario | Given | When | Then | Test Type |
|----------|-------|------|------|-----------|
| {edge case} | {precondition} | {action} | {result} | Unit |

#### Error Cases
| Scenario | Given | When | Then | Expected Error |
|----------|-------|------|------|----------------|
| {error case} | {precondition} | {action} | {error} | {error type} |

### AC-2: {Criteria Summary}
{Same format}

## Test Architecture

### Test File Structure
```
tests/
├── unit/
│   └── {feature}/
│       └── {component}.test.{ext}
├── integration/
│   └── {feature}/
│       └── {flow}.test.{ext}
└── e2e/
    └── {feature}/
        └── {journey}.test.{ext}
```

### Mocking Strategy
| Dependency | Mock Type | Reason |
|------------|-----------|--------|
| {service} | Full mock | External API |
| {database} | In-memory | Speed |
| {auth} | Stub | Isolation |

## Coverage Requirements

| Test Type | Target | Minimum | Files |
|-----------|--------|---------|-------|
| Unit | 80% | 70% | {list} |
| Integration | Key paths | - | {list} |
| E2E | Critical flows | - | {list} |

## Test Data Requirements

| Data Set | Purpose | Source | Cleanup |
|----------|---------|--------|---------|
| {dataset} | {purpose} | Fixture/Factory | Auto/Manual |

## Dependencies

| Dependency | Status | Blocker? |
|------------|--------|----------|
| {dep} | Available/Missing | Yes/No |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| {risk} | H/M/L | {mitigation} |

## Handoff Notes for DEV Agent

### Key Test Files
- `{path/to/test1}` - {purpose}
- `{path/to/test2}` - {purpose}

### Running Tests
```bash
{command to run tests}
```

### Expected Failures (RED phase)
All tests should fail with:
- {expected failure 1}
- {expected failure 2}

### Implementation Hints
- {hint for DEV agent}
```

---

## Test Case Template

```markdown
## TC-{ID}: {Test Case Title}

**Test Type:** Unit / Integration / E2E
**Priority:** Critical / High / Medium / Low
**AC Reference:** AC-{N}

### Preconditions
- {precondition 1}
- {precondition 2}

### Test Data
| Input | Value | Notes |
|-------|-------|-------|
| {input} | {value} | {notes} |

### Steps
1. {action 1}
2. {action 2}
3. {action 3}

### Expected Result
{detailed expected outcome}

### Assertions
- [ ] {assertion 1}
- [ ] {assertion 2}

### Cleanup
{cleanup steps if needed}
```

---

## Unit Test Code Patterns

### Basic Test Structure
```
// Arrange
{setup test data and mocks}

// Act
{execute the function/method under test}

// Assert
{verify the expected outcome}
```

### Testing Pure Functions
```
describe('{FunctionName}', () => {
  it('should {expected behavior} when {condition}', () => {
    // Arrange
    const input = {test input};
    const expected = {expected output};

    // Act
    const result = functionName(input);

    // Assert
    expect(result).toEqual(expected);
  });
});
```

### Testing with Mocks
```
describe('{ComponentName}', () => {
  let mockDependency;

  beforeEach(() => {
    mockDependency = createMock({DependencyType});
  });

  it('should {behavior} when {condition}', () => {
    // Arrange
    mockDependency.method.returns({value});

    // Act
    const result = component.action();

    // Assert
    expect(mockDependency.method).toHaveBeenCalledWith({args});
    expect(result).toBe({expected});
  });
});
```

### Testing Async Operations
```
describe('{AsyncFunction}', () => {
  it('should resolve with {expected} when {condition}', async () => {
    // Arrange
    const input = {input};

    // Act
    const result = await asyncFunction(input);

    // Assert
    expect(result).toEqual({expected});
  });

  it('should reject with {error} when {condition}', async () => {
    // Arrange
    const invalidInput = {invalid};

    // Act & Assert
    await expect(asyncFunction(invalidInput))
      .rejects
      .toThrow({ErrorType});
  });
});
```

### Testing Error Handling
```
describe('{Function} error handling', () => {
  it('should throw {ErrorType} when {condition}', () => {
    // Arrange
    const invalidInput = {invalid};

    // Act & Assert
    expect(() => functionName(invalidInput))
      .toThrow({ErrorType});
  });

  it('should return error result when {condition}', () => {
    // Arrange
    const edgeCase = {edge};

    // Act
    const result = functionName(edgeCase);

    // Assert
    expect(result.isError).toBe(true);
    expect(result.error.code).toBe('{ERROR_CODE}');
  });
});
```

---

## Integration Test Code Patterns

### API Endpoint Testing
```
describe('{Endpoint} API', () => {
  beforeAll(async () => {
    // Setup test database/server
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/{resource}', () => {
    it('should create resource and return 201', async () => {
      // Arrange
      const payload = {valid payload};

      // Act
      const response = await request(app)
        .post('/api/{resource}')
        .send(payload)
        .set('Authorization', 'Bearer {token}');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({expected});
    });

    it('should return 400 when {validation fails}', async () => {
      // Arrange
      const invalidPayload = {invalid};

      // Act
      const response = await request(app)
        .post('/api/{resource}')
        .send(invalidPayload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });
});
```

### Database Integration Testing
```
describe('{Repository}', () => {
  let testDb;

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb.clear();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('should persist and retrieve {entity}', async () => {
    // Arrange
    const entity = create{Entity}({data});

    // Act
    await repository.save(entity);
    const retrieved = await repository.findById(entity.id);

    // Assert
    expect(retrieved).toEqual(entity);
  });
});
```

---

## E2E Test Code Patterns

### User Journey Testing
```
describe('{Feature} User Journey', () => {
  beforeEach(async () => {
    // Reset application state
    // Login if needed
  });

  it('should complete {journey name}', async () => {
    // Step 1: {action}
    await page.goto('/start');
    await page.click('[data-testid="start-button"]');

    // Step 2: {action}
    await page.fill('[data-testid="input-field"]', '{value}');
    await page.click('[data-testid="submit"]');

    // Step 3: Verify outcome
    await expect(page.locator('[data-testid="success"]'))
      .toBeVisible();
    await expect(page.locator('[data-testid="result"]'))
      .toHaveText('{expected}');
  });
});
```

### Testing User Flows with State
```
describe('{Multi-step Flow}', () => {
  it('should maintain state across steps', async () => {
    // Step 1
    await navigateTo('/step1');
    await fillForm({step1Data});
    await submitAndContinue();

    // Step 2
    await expect(currentUrl()).toContain('/step2');
    await expect(getPrefilledData()).toEqual({step1Data});
    await fillForm({step2Data});
    await submitAndContinue();

    // Final verification
    await expect(currentUrl()).toContain('/complete');
    await expect(getSummary()).toContain({expectedSummary});
  });
});
```

---

## Coverage Report Template

```markdown
# Test Coverage Report: Story {N}.{M}

## Summary
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Line Coverage | 80% | {X}% | ✅/❌ |
| Branch Coverage | 70% | {X}% | ✅/❌ |
| Function Coverage | 80% | {X}% | ✅/❌ |

## Coverage by File
| File | Lines | Branches | Functions | Status |
|------|-------|----------|-----------|--------|
| {file1} | {X}% | {X}% | {X}% | ✅/❌ |
| {file2} | {X}% | {X}% | {X}% | ✅/❌ |

## Uncovered Code
| File | Lines | Reason | Action |
|------|-------|--------|--------|
| {file} | {lines} | {reason} | Add test / Exclude |

## Test Results
| Test Suite | Tests | Passed | Failed | Skipped |
|------------|-------|--------|--------|---------|
| Unit | {N} | {N} | {N} | {N} |
| Integration | {N} | {N} | {N} | {N} |
| E2E | {N} | {N} | {N} | {N} |

## Notes
{Any important notes about coverage}
```
