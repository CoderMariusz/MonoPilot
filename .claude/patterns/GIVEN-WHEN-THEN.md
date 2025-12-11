# Given/When/Then Pattern (Gherkin)

## Overview

Behavior-Driven Development (BDD) pattern for writing clear, testable acceptance criteria. Used extensively by TEST-ENGINEER and validated by PRODUCT-OWNER.

## Structure

```gherkin
Given {precondition / initial state}
When {action performed}
Then {expected outcome}
And {additional outcome}
```

## When to Use

- Writing acceptance criteria for stories
- Defining test cases
- Clarifying requirements with stakeholders
- Creating E2E test scenarios

## Examples

### Example 1: User Authentication

```gherkin
Feature: User Login

Scenario: Successful login with valid credentials
  Given the user is on the login page
  And the user has a valid account
  When the user enters valid email and password
  And clicks the "Login" button
  Then the user is redirected to the dashboard
  And a welcome message is displayed
  And the session token is stored

Scenario: Failed login with invalid password
  Given the user is on the login page
  When the user enters valid email but wrong password
  And clicks the "Login" button
  Then an error message "Invalid credentials" is displayed
  And the user remains on the login page
  And no session token is created
```

### Example 2: Shopping Cart

```gherkin
Feature: Shopping Cart

Scenario: Add item to cart
  Given the user is viewing a product page
  And the product is in stock
  When the user clicks "Add to Cart"
  Then the item appears in the cart
  And the cart count increases by 1
  And a confirmation toast is shown

Scenario: Remove item from cart
  Given the user has items in the cart
  When the user clicks "Remove" on an item
  Then the item is removed from the cart
  And the cart total is recalculated
```

### Example 3: API Endpoint

```gherkin
Feature: User API

Scenario: Create new user
  Given the API is available
  And the request has valid authentication
  When POST /api/users is called with valid user data
  Then response status is 201 Created
  And response body contains user ID
  And user is stored in database

Scenario: Get user by ID
  Given a user exists with ID "123"
  When GET /api/users/123 is called
  Then response status is 200 OK
  And response body contains user details
```

## Story Template with Given/When/Then

```markdown
## Story {N}.{M}: {Title}

**As a** {user type}
**I want** {goal}
**So that** {benefit}

### Acceptance Criteria

**AC-1: {Criterion name}**
```gherkin
Given {precondition}
When {action}
Then {outcome}
```

**AC-2: {Criterion name}**
```gherkin
Given {precondition}
When {action}
Then {outcome}
```

### Edge Cases
- AC-E1: {edge case scenario}
- AC-E2: {error handling scenario}
```

## Best Practices

### Do
- Keep scenarios focused on one behavior
- Use domain language (ubiquitous language)
- Make preconditions explicit
- Include both happy path and error cases
- Write from user perspective

### Don't
- Don't include implementation details
- Don't chain multiple unrelated actions
- Don't use technical jargon
- Don't skip error scenarios
- Don't make assumptions implicit

## Keywords Reference

| Keyword | Purpose | Example |
|---------|---------|---------|
| Given | Setup preconditions | Given user is logged in |
| When | Action or trigger | When user clicks Submit |
| Then | Expected outcome | Then order is created |
| And | Additional condition | And email is sent |
| But | Negative condition | But error is not shown |

## Integration with Agents

### TEST-ENGINEER
- Converts Given/When/Then to test code
- Ensures all scenarios have tests
- Identifies missing edge cases

### PRODUCT-OWNER
- Validates scenarios match requirements
- Ensures business value is clear
- Approves acceptance criteria

### QA-AGENT
- Uses scenarios for manual testing
- Creates E2E tests from scenarios
- Reports scenario coverage

## Mapping to Test Code

```markdown
## Given/When/Then → Test Code

Given "user is on login page"
  → beforeEach: navigate to /login

When "user enters email and password"
  → action: fill form fields

Then "user is redirected to dashboard"
  → assertion: expect URL to be /dashboard
```

### Dart/Flutter Example

```dart
testWidgets('successful login redirects to dashboard', (tester) async {
  // Given: user is on login page
  await tester.pumpWidget(LoginPage());

  // When: user enters valid credentials and clicks login
  await tester.enterText(find.byKey(Key('email')), 'test@example.com');
  await tester.enterText(find.byKey(Key('password')), 'password123');
  await tester.tap(find.text('Login'));
  await tester.pumpAndSettle();

  // Then: user is redirected to dashboard
  expect(find.byType(DashboardPage), findsOneWidget);
  expect(find.text('Welcome'), findsOneWidget);
});
```

## Related Patterns

- @.claude/patterns/TASK-TEMPLATE.md - Story format
- @.claude/patterns/QUALITY-RUBRIC.md - Test coverage criteria
- @.claude/agents/development/TEST-ENGINEER.md - Test creation
