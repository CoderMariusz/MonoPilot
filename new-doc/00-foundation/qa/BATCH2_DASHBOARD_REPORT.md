# Dashboard QA Batch 2 Report (Items 51-100)

**Date**: 2026-02-09T13:46:08.320Z
**Items Tested**: 51-100
**Passed**: 32/50
**Failed**: 18/50
**Pass Rate**: 64%

## Bugs Found (18)

### BUG-DASH-51
- **Item**: #51
- **Description**: Each activity shows: Icon, entity code, user name, relative timestamp
- **Severity**: MEDIUM

### BUG-DASH-54
- **Item**: #54
- **Description**: Desktop visibility: Visible in right sidebar
- **Severity**: MEDIUM

### BUG-DASH-59
- **Item**: #59
- **Description**: All modules enabled: All 8 module cards displayed
- **Severity**: MEDIUM

### BUG-DASH-60
- **Item**: #60
- **Description**: Analytics page title: "Analytics" displayed
- **Severity**: MEDIUM

### BUG-DASH-65
- **Item**: #65
- **Description**: "Back to Dashboard" button navigates to /dashboard
- **Severity**: MEDIUM

### BUG-DASH-66
- **Item**: #66
- **Description**: Browser back button: Works correctly
- **Severity**: MEDIUM

### BUG-DASH-70
- **Item**: #70
- **Description**: Under development: Status message shown
- **Severity**: MEDIUM

### BUG-DASH-71
- **Item**: #71
- **Description**: Reports page title: "Reports" displayed
- **Severity**: MEDIUM

### BUG-DASH-76
- **Item**: #76
- **Description**: "View Analytics" button navigates to analytics
- **Severity**: MEDIUM

### BUG-DASH-77
- **Item**: #77
- **Description**: "Back to Dashboard" button navigates to dashboard
- **Severity**: MEDIUM

### BUG-DASH-78
- **Item**: #78
- **Description**: Browser back button: Works correctly
- **Severity**: MEDIUM

### BUG-DASH-81
- **Item**: #81
- **Description**: Under development: Status message shown
- **Severity**: MEDIUM

### BUG-DASH-82
- **Item**: #82
- **Description**: "Start Setup Wizard" button navigates to /settings/wizard
- **Severity**: MEDIUM

### BUG-DASH-83
- **Item**: #83
- **Description**: Module primary action buttons: Navigate to create/manage pages
- **Severity**: MEDIUM

### BUG-DASH-87
- **Item**: #87
- **Description**: "Back to Dashboard" button: Ghost style
- **Severity**: MEDIUM

### BUG-DASH-89
- **Item**: #89
- **Description**: "View Analytics" button: Navigates to analytics
- **Severity**: MEDIUM

### BUG-DASH-91
- **Item**: #91
- **Description**: Dropdown items: Show as clickable options
- **Severity**: HIGH
- **Error**: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Create")').first()
    - locator resolved to <button type="button" data-state="open" aria-haspopup="menu" aria-expanded="true" id="radix-_R_binebmqkndlb_" aria-controls="radix-_R_binebmqkndlbH1_" class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 rounded…>…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <html lang="en">…</html> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <html lang="en">…</html> intercepts pointer events
    - retrying click action
      - waiting 100ms
    48 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <html lang="en">…</html> intercepts pointer events
     - retrying click action
       - waiting 500ms


### BUG-DASH-94
- **Item**: #94
- **Description**: Tab navigation through buttons works
- **Severity**: MEDIUM

