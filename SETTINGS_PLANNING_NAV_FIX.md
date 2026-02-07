# Settings/Planning Section Navigation Fix

## Bug Description
**Severity:** P0 CRITICAL  
**Issue:** Clicking section headers (PO Settings, TO Settings, WO Settings) in `/settings/planning` caused navigation to `/dashboard` and data loss of unsaved form changes.

## Root Cause
The `Button` component inside `CollapsibleTrigger` in `CollapsibleSection.tsx` was missing the `type="button"` attribute. Since the collapsible sections are rendered inside a `<form>` element (PlanningSettingsForm), the button defaulted to `type="submit"`, causing unintended form submission when users clicked to expand/collapse sections.

## Solution Implemented

### 1. Fixed Button Type (Primary Fix)
**File:** `apps/frontend/components/settings/planning/CollapsibleSection.tsx`

Added `type="button"` to the CollapsibleTrigger button:

```tsx
<CollapsibleTrigger asChild>
  <Button
    type="button"  // ✅ ADDED - prevents form submission
    variant="ghost"
    className="flex w-full items-center justify-between p-4 hover:bg-muted/50"
    data-testid={isOpen ? `${testId}-collapse` : `${testId}-expand`}
  >
```

**Impact:** This prevents the button from submitting the form when clicked, eliminating the navigation to `/dashboard`.

### 2. Enhanced Unsaved Changes Protection
**File:** `apps/frontend/lib/hooks/use-unsaved-changes.ts`

Enhanced the hook to intercept link clicks and warn users before navigating:

```typescript
// Added click event listener to intercept internal link navigation
useEffect(() => {
  if (!isDirty) return;

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a[href]') as HTMLAnchorElement;
    
    if (link && link.href) {
      const url = new URL(link.href, window.location.origin);
      const isInternal = url.origin === window.location.origin;
      const isDifferentPage = url.pathname !== window.location.pathname;
      
      if (isInternal && isDifferentPage) {
        if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }
  };

  document.addEventListener('click', handleClick, true);
  return () => document.removeEventListener('click', handleClick, true);
}, [isDirty]);
```

**Impact:** Provides additional protection against data loss when users click sidebar navigation or other internal links while the form has unsaved changes.

## Testing Checklist

### Manual Testing
1. ✅ Navigate to `/settings/planning`
2. ✅ Make changes to any form field (e.g., toggle "PO Require Approval")
3. ✅ Click "PO Settings" section header to collapse/expand
   - **Expected:** Section collapses/expands without navigation
   - **Before Fix:** Would navigate to `/dashboard` and lose changes
4. ✅ Click "TO Settings" section header
   - **Expected:** Section collapses/expands without navigation
5. ✅ Click "WO Settings" section header
   - **Expected:** Section collapses/expands without navigation
6. ✅ Try to navigate away via sidebar (e.g., click "Dashboard" or "Users")
   - **Expected:** Confirmation dialog appears: "You have unsaved changes. Are you sure you want to leave?"
7. ✅ Try to close browser tab or refresh
   - **Expected:** Browser warning about unsaved changes
8. ✅ Save changes and then click section headers
   - **Expected:** Sections collapse/expand normally, no warnings

### Automated Testing (Recommended)
Create E2E test at `e2e/tests/settings/planning-navigation.spec.ts`:

```typescript
test('should not navigate when clicking section headers', async ({ page }) => {
  await page.goto('/settings/planning');
  
  // Make a change to mark form as dirty
  const checkbox = page.locator('[name="po_require_approval"]');
  await checkbox.click();
  
  // Click section header
  const poHeader = page.locator('[data-testid="po-settings-collapse"]');
  await poHeader.click();
  
  // Verify we're still on the same page
  expect(page.url()).toContain('/settings/planning');
  
  // Verify section collapsed
  const content = page.locator('[data-testid="po-settings-content"]');
  await expect(content).not.toBeVisible();
});

test('should warn before navigating with unsaved changes', async ({ page }) => {
  await page.goto('/settings/planning');
  
  // Make a change
  const checkbox = page.locator('[name="po_require_approval"]');
  await checkbox.click();
  
  // Listen for confirm dialog
  page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('unsaved changes');
    await dialog.dismiss();
  });
  
  // Try to navigate via sidebar
  const dashboardLink = page.locator('a[href="/dashboard"]');
  await dashboardLink.click();
  
  // Should still be on planning page after dismissing dialog
  expect(page.url()).toContain('/settings/planning');
});
```

## Verification Steps

1. Start dev server: `pnpm dev`
2. Login with test credentials: `admin@monopilot.com` / `test1234`
3. Navigate to `/settings/planning`
4. Follow manual testing checklist above

## Related Files Changed
- `apps/frontend/components/settings/planning/CollapsibleSection.tsx` - Added `type="button"`
- `apps/frontend/lib/hooks/use-unsaved-changes.ts` - Enhanced with link click interception

## Prevention
This is a common React/HTML gotcha. To prevent similar issues:

1. **Always specify button type** in forms: Use `type="button"` for non-submit buttons
2. **Code review checklist:** Add item to check for missing `type` attributes on buttons inside forms
3. **ESLint rule:** Consider adding `react/button-has-type` rule to catch this automatically

## Status
- [x] Bug identified
- [x] Root cause analyzed
- [x] Fix implemented
- [ ] Manual testing complete
- [ ] Automated tests written
- [ ] Ready for commit

## Commit Message
```
fix(settings/planning): prevent data loss on section navigation

- Add type="button" to CollapsibleSection trigger to prevent form submission
- Enhance useUnsavedChanges hook to intercept link clicks
- Prevents navigation to /dashboard when clicking section headers
- Shows confirmation dialog before navigating with unsaved changes

Fixes: P0 critical bug where clicking PO/TO/WO Settings headers
would navigate away from the page and lose user's unsaved changes.

The root cause was missing type="button" on the collapsible trigger,
causing it to default to type="submit" within the form context.
```
