# TD-201: Skip Step Button - RED Phase Report

**Date**: 2024-12-24
**Agent**: TEST-WRITER
**Phase**: RED (Failing Tests)
**Status**: COMPLETE

## Summary

All 15 test cases for the Skip Step button feature have been written and verified to fail correctly. Tests cover all requirements from TEST-ENGINEER's design.

## Test File Created

**Path**: `apps/frontend/components/settings/onboarding/__tests__/OrganizationProfileStep.TD-201.test.tsx`

**Lines of Code**: 400+
**Test Cases**: 15
**Test Groups**: 5

## Test Results

```
Test Files  1 failed (1)
Tests       15 failed (15)
Duration    10.37s
```

### All Tests Failing (RED State Confirmed)

```
✗ TC-201.1: should render Skip Step button with correct styling
✗ TC-201.2: should display Skip Step button with info icon
✗ TC-201.3: should position Skip Step button to the left of Next button
✗ TC-201.4: should bypass validation when Skip Step clicked with empty form
✗ TC-201.5: should use default placeholder data when Skip Step clicked
✗ TC-201.6: should merge partial data with defaults when Skip Step clicked
✗ TC-201.7: should handle Skip Step click with validation errors present
✗ TC-201.8: should enable Skip Step button when form is pristine
✗ TC-201.9: should keep Skip Step button enabled when form has validation errors
✗ TC-201.10: should disable Skip Step button during form submission
✗ TC-201.11: should have proper ARIA label for Skip Step button
✗ TC-201.12: should support keyboard navigation to Skip Step button
✗ TC-201.13: should announce skip action to screen readers
✗ TC-201.14: should prevent double-click on Skip Step button
✗ TC-201.15: should handle Skip Step when initialData already provided
```

## Expected Failure Message

```
TestingLibraryElementError: Unable to find an accessible element with the role "button" and name `/skip step/i`
```

This is the CORRECT failure - the Skip Step button doesn't exist in the component yet.

## Test Coverage by Group

### Group 1: Button Rendering (3 tests)
- **TC-201.1**: Verify ghost variant styling
- **TC-201.2**: Verify InfoCircle icon presence
- **TC-201.3**: Verify positioning (left of Next button)

**Expected Failures**: Button not found in DOM

### Group 2: Click Behavior - Bypass Validation (4 tests)
- **TC-201.4**: Bypass validation with empty form
- **TC-201.5**: Use default placeholder data
- **TC-201.6**: Merge partial user data with defaults
- **TC-201.7**: Clear validation errors on skip

**Expected Failures**: Button not found, handleSkip function missing

### Group 3: Button States (3 tests)
- **TC-201.8**: Enabled when pristine
- **TC-201.9**: Enabled with validation errors
- **TC-201.10**: Disabled during submission

**Expected Failures**: Button not found, state management missing

### Group 4: Accessibility (3 tests)
- **TC-201.11**: Proper ARIA label
- **TC-201.12**: Keyboard navigation support
- **TC-201.13**: Screen reader announcements

**Expected Failures**: Button not found, ARIA attributes missing, no announcement region

### Group 5: Edge Cases (2 tests)
- **TC-201.14**: Double-click prevention
- **TC-201.15**: InitialData handling

**Expected Failures**: Button not found, debounce logic missing

## Test Patterns Used

### 1. Given/When/Then Structure
```typescript
// GIVEN wizard step 1 loads with empty form
render(<OrganizationProfileStep onComplete={mockOnComplete} />)

// WHEN Skip Step clicked
const skipButton = screen.getByRole('button', { name: /skip step/i })
await user.click(skipButton)

// THEN onComplete called with default data
expect(mockOnComplete).toHaveBeenCalledWith(...)
```

### 2. User Event Setup
```typescript
const user = userEvent.setup()
await user.click(skipButton)
```

### 3. Browser Detection Mock (Reused)
```typescript
vi.mock('@/lib/utils/browser-detection', () => ({
  getBrowserTimezone: vi.fn(() => 'Europe/Warsaw'),
  getBrowserLanguage: vi.fn(() => 'pl'),
}))
```

### 4. Async Submission Testing
```typescript
const slowOnComplete = vi.fn(
  (_data: OrganizationProfileStepData) =>
    new Promise<void>((resolve) => setTimeout(resolve, 1000))
)
```

## Quality Gates Checklist

- [x] All 15 tests written
- [x] All tests FAILING (RED state)
- [x] Each test has clear name following TC-201.X pattern
- [x] Tests cover all scenarios from TEST-ENGINEER design
- [x] NO implementation code written
- [x] Edge cases included (double-click, initialData)
- [x] Follows existing test patterns from OrganizationProfileStep.test.tsx
- [x] No TypeScript errors
- [x] Mock data comprehensive

## Test File Structure

```typescript
describe('TD-201: Skip Step Button Feature', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Group 1: Button Rendering', () => { ... })
  describe('Group 2: Click Behavior - Bypass Validation', () => { ... })
  describe('Group 3: Button States', () => { ... })
  describe('Group 4: Accessibility', () => { ... })
  describe('Group 5: Edge Cases', () => { ... })
})
```

## Next Steps - Handoff to DEV Agent

### Required Implementation

**File to Modify**: `apps/frontend/components/settings/onboarding/OrganizationProfileStep.tsx`

**Changes Required**:

1. **Add Skip Button UI**:
   - Ghost variant Button
   - InfoCircle icon from lucide-react
   - Positioned left of Next button
   - ARIA label: "Skip this step and use default values"

2. **Add Skip Logic**:
   - `handleSkip` function
   - Bypass form validation
   - Merge current form data with defaults
   - Default organization name: "My Organization"
   - Preserve auto-detected timezone/language
   - Clear validation errors

3. **Add State Management**:
   - Disable button during submission (reuse isSubmitting)
   - Enable button always (even with validation errors)

4. **Add Accessibility**:
   - ARIA live region for skip announcements
   - Keyboard navigation (tab order)
   - Screen reader support

5. **Add Double-Click Prevention**:
   - Reuse isSubmitting flag
   - Disable button after first click

### Run Command After Implementation

```bash
cd apps/frontend
npm test -- OrganizationProfileStep.TD-201.test
```

**Expected Result**: 15/15 tests PASSING (GREEN)

### Handoff Data

```yaml
test_file: apps/frontend/components/settings/onboarding/__tests__/OrganizationProfileStep.TD-201.test.tsx
component_file: apps/frontend/components/settings/onboarding/OrganizationProfileStep.tsx
run_command: npm test -- OrganizationProfileStep.TD-201.test
scenarios_count: 15
test_groups: 5
status: RED
all_tests_failing: true
error_message: "Unable to find button with name /skip step/i"
ready_for_dev: true
```

## Notes

- Tests reuse existing mock patterns from OrganizationProfileStep.test.tsx
- All tests are independent and can run in parallel
- Browser detection mock already configured
- Form behavior well-understood from existing tests
- No breaking changes to existing component expected

---

**RED Phase Status**: ✅ COMPLETE
**Next Agent**: DEV
**Next Phase**: GREEN (Implementation)
