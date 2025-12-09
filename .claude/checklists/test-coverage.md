# Test Coverage Guidelines

> Używane przez: TEST-ENGINEER, CODE-REVIEWER, QA-AGENT

## Coverage Targets by Feature Type

| Feature Type | Min Coverage | Rationale |
|--------------|--------------|-----------|
| Standard features | 80% | Good balance of safety vs effort |
| Auth/Authorization | 90% | Security-critical, must be thorough |
| Payment/Financial | 90% | Business-critical, legal implications |
| Security/Compliance | 95% | Regulatory requirements |
| Infrastructure/DevOps | 70% | Often harder to test, more manual verification |
| UI/Styling | 60% | Visual testing supplements code coverage |

## Test Type Distribution

```
Recommended pyramid:

        /\
       /E2E\        ~10% - User journeys, critical paths
      /------\
     /Integr. \     ~20% - API, DB, service interactions
    /----------\
   /   Unit     \   ~70% - Functions, components, logic
  /--------------\
```

## When to Write Which Test

| Scenario | Test Type | Why |
|----------|-----------|-----|
| Pure function | Unit | Fast, isolated, easy to maintain |
| React component | Unit | Test behavior, not implementation |
| API endpoint | Integration | Real HTTP, real validation |
| Database operation | Integration | Real queries, transactions |
| User login flow | E2E | Full stack, critical path |
| Checkout process | E2E | Business critical, multi-step |

## What to Test vs What NOT to Test

### DO Test:
- [ ] Business logic (calculations, validations)
- [ ] Edge cases (empty, null, max values, boundaries)
- [ ] Error handling (what happens when things fail)
- [ ] User interactions (clicks, form submissions)
- [ ] API contracts (request/response shapes)
- [ ] Authorization (who can access what)

### DON'T Test:
- [ ] Framework internals (React's useState works)
- [ ] Third-party libraries (they have their own tests)
- [ ] Implementation details (private methods, internal state)
- [ ] Trivial code (getters, simple assignments)
- [ ] Generated code (types, migrations)

## Test Scenarios per AC

For EACH Acceptance Criterion, write tests for:

```
1. Happy Path
   - Normal successful flow
   - Expected inputs → expected outputs

2. Edge Cases
   - Empty input / null / undefined
   - Maximum values / minimum values
   - Boundary conditions (0, -1, MAX_INT)
   - Unicode / special characters

3. Error Cases
   - Invalid input types
   - Missing required fields
   - Malformed data
   - Network failures (for async)

4. Security Cases (if applicable)
   - Unauthorized access attempts
   - SQL injection attempts
   - XSS payloads
   - Rate limiting
```

## Coverage Measurement

### Line Coverage vs Branch Coverage

```typescript
function example(x) {
  if (x > 0) {
    return 'positive';
  }
  return 'non-positive';
}

// Line coverage 100% with just:
test('positive', () => expect(example(1)).toBe('positive'));
test('non-positive', () => expect(example(0)).toBe('non-positive'));

// Branch coverage requires testing x > 0 true AND false
```

**Focus on branch coverage** - it catches more bugs.

### Running Coverage

```bash
# Jest
npm test -- --coverage

# Vitest
npx vitest --coverage

# Go
go test -coverprofile=coverage.out ./...

# Python
pytest --cov=src tests/
```

## Coverage Exceptions

Sometimes 100% coverage isn't practical. Document exceptions:

```typescript
/* istanbul ignore next */
// Reason: Error handler for catastrophic failures,
// can't easily simulate in tests
function handleCatastrophicError(error) {
  process.exit(1);
}
```

Valid reasons for exclusion:
- Catastrophic error handlers
- Platform-specific code paths
- Debug/development-only code
- Generated code

## Quality Over Quantity

```typescript
// ❌ High coverage, low value
test('calls function', () => {
  const spy = jest.spyOn(service, 'process');
  component.handleClick();
  expect(spy).toHaveBeenCalled(); // Tests implementation, not behavior
});

// ✅ Tests actual behavior
test('displays success message after submission', async () => {
  render(<Form />);
  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(screen.getByText('Successfully submitted!')).toBeInTheDocument();
});
```

## Coverage Review Checklist

Before marking tests complete:
- [ ] Coverage meets target for feature type
- [ ] All AC have corresponding tests
- [ ] Edge cases covered (not just happy path)
- [ ] Tests are deterministic (no flaky tests)
- [ ] Tests are readable (clear arrange/act/assert)
- [ ] No tests of implementation details
