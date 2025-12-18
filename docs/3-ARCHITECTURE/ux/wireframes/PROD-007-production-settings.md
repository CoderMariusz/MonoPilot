# PROD-007: Production Settings

**Module**: Production
**Feature**: Production Execution Configuration
**Route**: `/settings/production-execution`
**Status**: Ready for Review
**Last Updated**: 2025-12-14

---

## Overview

**Purpose**: Configurable production execution settings controlling WO lifecycle, material consumption, output registration, dashboard behavior, and OEE tracking.

**FR Coverage**: FR-PROD-017 (Production Settings) - 9 AC
**PRD Reference**: Lines 746-781 in `docs/1-BASELINE/product/modules/production.md`

**Settings Count**: 15 total
- WO Lifecycle: 2 settings
- Operations: 1 setting
- Material Consumption: 2 settings
- Output Registration: 2 settings
- Dashboard: 3 settings
- OEE & Downtime (Phase 2): 4 settings
- Advanced: 1 setting

---

## ASCII Wireframe

### Success State

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Settings > Production Execution                                   [Unsaved *]│
├───────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Configure production execution behavior including work order lifecycle,    │
│  material consumption, output registration, and dashboard settings.         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🏭 WORK ORDER LIFECYCLE                             [Collapse ▲]   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Allow Pause/Resume Work Orders                      [OFF ──●]      │   │
│  │ Enable pause and resume functionality for active work orders        │   │
│  │ Default: OFF                                                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Auto-Complete Work Orders                           [OFF ──●]      │   │
│  │ Automatically complete WO when output >= planned quantity           │   │
│  │ Default: OFF                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚙ OPERATIONS                                        [Collapse ▲]   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Require Operation Sequence                          [ON  ●──]      │   │
│  │ Operations must be completed in sequential order                    │   │
│  │ Default: ON                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📦 MATERIAL CONSUMPTION                             [Collapse ▲]   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Allow Over-Consumption                              [OFF ──●]      │   │
│  │ Allow material consumption to exceed BOM requirements               │   │
│  │ Default: OFF                                                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Enable Material Reservations                        [ON  ●──]      │   │
│  │ Automatically reserve materials when WO starts                      │   │
│  │ Default: ON                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📋 OUTPUT REGISTRATION                              [Collapse ▲]   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Require QA Status on Output                         [ON  ●──]      │   │
│  │ Output license plates require quality assurance status              │   │
│  │ Default: ON                                                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Auto-Create By-Product License Plates               [ON  ●──]      │   │
│  │ Automatically create LPs for by-products during output registration │   │
│  │ Default: ON                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📊 DASHBOARD                                        [Collapse ▲]   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Dashboard Refresh Interval (seconds)                                │   │
│  │ How often the dashboard auto-refreshes (min: 5s, max: 300s)        │   │
│  │ [30                      ]  seconds                                 │   │
│  │ Default: 30                                                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Show Material Shortage Alerts                       [ON  ●──]      │   │
│  │ Display alerts when materials are insufficient for WO               │   │
│  │ Default: ON                                                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Show Work Order Delay Alerts                        [ON  ●──]      │   │
│  │ Display alerts when work orders are past due date                   │   │
│  │ Default: ON                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📈 OEE & DOWNTIME (Phase 2)                         [Collapse ▲]   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Show Quality Hold Alerts                            [ON  ●──]      │   │
│  │ Display alerts when output is placed on quality hold                │   │
│  │ Default: ON                                                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Enable OEE Tracking                                 [OFF ──●]      │   │
│  │ Enable Overall Equipment Effectiveness calculation                  │   │
│  │ Default: OFF                                                        │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Target OEE Percentage                                               │   │
│  │ Target OEE % displayed on dashboards (min: 0, max: 100)            │   │
│  │ [85                      ]  %                                       │   │
│  │ Default: 85                                                         │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Enable Downtime Tracking                            [OFF ──●]      │   │
│  │ Track and categorize machine downtime events                        │   │
│  │ Default: OFF                                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚙ ADVANCED                                          [Collapse ▲]   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ Allow Partial License Plate Consumption             [ON  ●──]      │   │
│  │ Allow consuming partial quantities from license plates              │   │
│  │ Default: ON                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ℹ Changes to these settings affect all users in your organization.        │
│                                                                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                [Cancel]  [Save Changes]    │
└───────────────────────────────────────────────────────────────────────────┘

Interactions:
- Click toggle: Changes setting value, enables [Save Changes] button, shows [Unsaved *] indicator
- Edit number field: Updates value, validates on blur, shows inline error if out of range
- Click section header: Expands/collapses section (all expanded by default)
- Click [Save Changes]: Validates all settings → saves to database → shows success toast → removes [Unsaved *]
- Click [Cancel]: Reverts all changes to last saved state → removes [Unsaved *]
- Navigate away with unsaved changes: Shows confirmation modal
- Hover over setting name: Shows tooltip with detailed explanation and impact
```

### Loading State

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Settings > Production Execution                                           │
├───────────────────────────────────────────────────────────────────────────┤
│  Configure production execution behavior including work order lifecycle,    │
│  material consumption, output registration, and dashboard settings.         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🏭 WORK ORDER LIFECYCLE                                             │   │
│  │ [████████████████████████████░░░░░░░░░░░░░░░░░░]                   │   │
│  │ [████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░]                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ⚙ OPERATIONS                                                        │   │
│  │ [████████████████████████████░░░░░░░░░░░░░░░░░░]                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 📦 MATERIAL CONSUMPTION                                             │   │
│  │ [████████████████████████████░░░░░░░░░░░░░░░░░░]                   │   │
│  │ [████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░]                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Loading production settings...                                            │
└───────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Settings > Production Execution                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          [⚙ Icon]                                          │
│                 No Production Settings Found                                │
│        Production settings have not been configured for your organization.  │
│           Initializing with default recommended settings...                 │
│                                                                             │
│                    [Initialize Default Settings]                            │
│                                                                             │
│  Note: Default settings are optimized for food manufacturing best practices.│
└───────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌───────────────────────────────────────────────────────────────────────────┐
│  Settings > Production Execution                                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                          [⚠ Icon]                                          │
│           Failed to Load Production Settings                                │
│      Unable to retrieve production configuration. Check your connection.    │
│                Error: PRODUCTION_SETTINGS_FETCH_FAILED                      │
│                                                                             │
│                       [Retry]  [Contact Support]                            │
│                                                                             │
└───────────────────────────────────────────────────────────────────────────┘
```

### Validation Error State (Number Input Out of Range)

```
┌─────────────────────────────────────────────────────────────────────┐
│  📊 DASHBOARD                                        [Collapse ▲]   │
├─────────────────────────────────────────────────────────────────────┤
│  Dashboard Refresh Interval (seconds)                               │
│  How often the dashboard auto-refreshes (min: 5s, max: 300s)       │
│  [0                       ]  seconds                                │
│  ⚠ Refresh interval must be at least 5 seconds                     │
│  Default: 30                                                        │
└─────────────────────────────────────────────────────────────────────┘

Alternative: Target OEE validation error
┌─────────────────────────────────────────────────────────────────────┐
│  📈 OEE & DOWNTIME (Phase 2)                         [Collapse ▲]   │
├─────────────────────────────────────────────────────────────────────┤
│  Target OEE Percentage                                              │
│  Target OEE % displayed on dashboards (min: 0, max: 100)           │
│  [110                     ]  %                                      │
│  ⚠ Target OEE must be between 0 and 100                            │
│  Default: 85                                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Unsaved Changes Warning Modal

```
┌───────────────────────────────────────────────────┐
│  Unsaved Changes                          [×]     │
├───────────────────────────────────────────────────┤
│                                                   │
│  You have unsaved production setting changes.     │
│  Leave without saving?                            │
│                                                   │
│  Changed settings:                                │
│  • Allow Pause/Resume Work Orders: OFF → ON       │
│  • Dashboard Refresh Interval: 30 → 15            │
│                                                   │
│         [Cancel]  [Discard]  [Save & Leave]       │
│                                                   │
└───────────────────────────────────────────────────┘
```

### Success Toast (After Save)

```
┌─────────────────────────────────────┐
│  ✓ Production settings saved        │
│  Changes applied successfully       │
└─────────────────────────────────────┘
```

---

## Key Components

### 1. Page Header
- **Title**: "Settings > Production Execution"
- **Breadcrumb**: Settings > Production Execution
- **Unsaved Indicator**: [Unsaved *] badge appears when any setting changed
- **Description**: Explains purpose of settings and scope (organization-wide)

### 2. Section Containers (7 sections)
- **Section Header**: Icon + Title + Collapse/Expand toggle
- **Collapsible**: Click header to expand/collapse (all expanded by default)
- **Visual Grouping**: Border + background differentiation
- **Settings Count**: Shows number of settings per section in collapsed state

### 3. Setting Row (Toggle)
- **Layout**: Label (left) + Description (below) + Toggle switch (right)
- **Label**: 16px bold, setting name
- **Description**: 14px regular, Slate-500, explains what setting controls
- **Default Indicator**: "Default: {value}" in Slate-400, 12px
- **Toggle Switch**: ON (green, ●──) or OFF (gray, ──●)
- **Touch Target**: 48x48dp minimum for toggle area

### 4. Setting Row (Number Input)
- **Layout**: Label (left) + Description (below) + Input field + Unit label (right)
- **Input Field**: 120px wide, right-aligned number, validation on blur
- **Unit Label**: "seconds" or "%" next to input
- **Validation**: Min/max range check, inline error message below input
- **Error State**: Red border + red error text + warning icon

### 5. Validation Error Message
- **Icon**: ⚠ warning icon (red)
- **Text**: Red, 14px, specific error message
- **Position**: Below input field, replaces default indicator when active
- **Examples**:
  - "Refresh interval must be at least 5 seconds"
  - "Refresh interval cannot exceed 300 seconds"
  - "Target OEE must be between 0 and 100"

### 6. Footer Actions
- **Layout**: Fixed footer, right-aligned buttons
- **[Cancel]**: Secondary button, reverts all changes to last saved state
- **[Save Changes]**: Primary button, enabled only when changes exist
- **Button State**: Disabled (gray) when no changes, enabled (blue) when unsaved changes

### 7. Info Banner
- **Position**: Above footer, full width
- **Icon**: ℹ info icon (blue)
- **Text**: "Changes to these settings affect all users in your organization."
- **Background**: Light blue tint

### 8. Unsaved Changes Modal
- **Trigger**: Navigate away or close tab with unsaved changes
- **Title**: "Unsaved Changes"
- **Message**: "You have unsaved production setting changes. Leave without saving?"
- **Changed List**: Bullet list of changed settings with old → new values
- **Actions**: [Cancel] [Discard] [Save & Leave]

### 9. Success Toast
- **Position**: Top-right corner, auto-dismiss after 3 seconds
- **Icon**: ✓ checkmark (green)
- **Title**: "Production settings saved"
- **Message**: "Changes applied successfully"

### 10. Tooltip on Hover
- **Trigger**: Hover over setting label or (i) icon
- **Content**: Detailed explanation of setting impact
- **Examples**:
  - "Allow Pause/Resume: When enabled, operators can pause active work orders. Paused WOs show in 'Paused' status and do not consume resources."
  - "Auto-Complete: When enabled, work orders automatically transition to Completed status when output quantity >= planned quantity. Reduces manual completion steps."

---

## Settings Details

### 🏭 Work Order Lifecycle (2 settings)

#### 1. Allow Pause/Resume Work Orders
- **Type**: Toggle (Boolean)
- **Default**: OFF
- **Impact**: When ON, WO detail pages show [Pause] button for "In Progress" WOs
- **Related AC**: AC #2 - Toggle allow_pause_wo OFF → ON → WO detail shows "Pause" button
- **Tooltip**: "Enable pause and resume functionality for active work orders. Paused WOs can be resumed later without losing progress."

#### 2. Auto-Complete Work Orders
- **Type**: Toggle (Boolean)
- **Default**: OFF
- **Impact**: When ON, WO status changes to "Completed" when output_quantity >= planned_quantity
- **Tooltip**: "Automatically complete work orders when output quantity meets or exceeds planned quantity. Reduces manual completion steps."

### ⚙ Operations (1 setting)

#### 3. Require Operation Sequence
- **Type**: Toggle (Boolean)
- **Default**: ON
- **Impact**: When ON, operations must be completed in sequence order (operation_sequence ASC)
- **Tooltip**: "Enforce sequential operation completion. Operation 2 cannot start until Operation 1 is complete."

### 📦 Material Consumption (2 settings)

#### 4. Allow Over-Consumption
- **Type**: Toggle (Boolean)
- **Default**: OFF
- **Impact**: When OFF, consumption is blocked if consumed_quantity + new_qty > bom_quantity
- **Tooltip**: "Allow material consumption to exceed BOM requirements. Useful for handling scrap or variation in formulas."

#### 5. Enable Material Reservations
- **Type**: Toggle (Boolean)
- **Default**: ON
- **Impact**: When ON, materials are reserved (allocated but not consumed) when WO starts
- **Tooltip**: "Automatically reserve materials when work order starts. Prevents stock allocation conflicts between concurrent WOs."

### 📋 Output Registration (2 settings)

#### 6. Require QA Status on Output
- **Type**: Toggle (Boolean)
- **Default**: ON
- **Impact**: When ON, output LP creation requires selecting qa_status (Pass/Fail/Hold/Pending)
- **Tooltip**: "Require quality assurance status for all output license plates. Ensures traceability and quality control."

#### 7. Auto-Create By-Product License Plates
- **Type**: Toggle (Boolean)
- **Default**: ON
- **Impact**: When ON, by-product LPs are auto-created during output registration based on BOM by_products
- **Tooltip**: "Automatically create license plates for by-products (e.g., whey, trim) during output registration."

### 📊 Dashboard (3 settings)

#### 8. Dashboard Refresh Interval (seconds)
- **Type**: Number
- **Default**: 30
- **Min**: 5
- **Max**: 300
- **Validation**: "Refresh interval must be between 5 and 300 seconds"
- **Impact**: Production dashboard auto-refreshes at this interval
- **Related AC**: AC #3 - Enter 15 → saved → dashboard refreshes every 15 seconds
- **Related AC**: AC #4 - Enter 0 → validation error "must be at least 5 seconds"
- **Related AC**: AC #5 - Enter 5 → saves successfully
- **Tooltip**: "How often the production dashboard automatically refreshes data. Lower values increase server load."

#### 9. Show Material Shortage Alerts
- **Type**: Toggle (Boolean)
- **Default**: ON
- **Impact**: When ON, dashboard shows banner when WO materials have insufficient stock
- **Tooltip**: "Display alerts on dashboard when materials are insufficient for work order execution."

#### 10. Show Work Order Delay Alerts
- **Type**: Toggle (Boolean)
- **Default**: ON
- **Impact**: When ON, dashboard shows banner when WO due_date < now() and status != "Completed"
- **Tooltip**: "Display alerts on dashboard when work orders are past their due date."

### 📈 OEE & Downtime (Phase 2 - 4 settings)

#### 11. Show Quality Hold Alerts
- **Type**: Toggle (Boolean)
- **Default**: ON
- **Impact**: When ON, dashboard shows banner when output LP has qa_status = "Hold"
- **Tooltip**: "Display alerts on dashboard when output is placed on quality hold status."

#### 12. Enable OEE Tracking
- **Type**: Toggle (Boolean)
- **Default**: OFF
- **Impact**: When ON, OEE calculation runs for machines, OEE dashboard becomes visible
- **Tooltip**: "Enable Overall Equipment Effectiveness tracking and calculation. Requires OEE module (Phase 2)."

#### 13. Target OEE Percentage
- **Type**: Number
- **Default**: 85
- **Min**: 0
- **Max**: 100
- **Validation**: "Target OEE must be between 0 and 100"
- **Impact**: Displayed as target line on OEE dashboard charts
- **Related AC**: AC #6 - Enter 110 → validation error "must be between 0 and 100"
- **Related AC**: AC #7 - Enter 85 → saved → OEE dashboard shows 85% target line
- **Tooltip**: "Target OEE percentage shown on dashboards as goal line. Industry standard is 85%."

#### 14. Enable Downtime Tracking
- **Type**: Toggle (Boolean)
- **Default**: OFF
- **Impact**: When ON, operators can log downtime events with reason codes
- **Tooltip**: "Track and categorize machine downtime events. Contributes to OEE availability calculation."

### ⚙ Advanced (1 setting)

#### 15. Allow Partial License Plate Consumption
- **Type**: Toggle (Boolean)
- **Default**: ON
- **Impact**: When ON, operators can consume partial quantity from LP (splits LP into consumed + remaining)
- **Tooltip**: "Allow consuming partial quantities from license plates. Remaining quantity stays on original LP or creates new LP."

---

## Main Actions

### Primary Actions

#### 1. Toggle Setting ON/OFF
**Flow**:
1. User clicks toggle switch
2. Toggle animates to new state (ON ↔ OFF)
3. [Unsaved *] indicator appears in header
4. [Save Changes] button becomes enabled (blue)
5. Changed setting added to unsaved changes list

**Validation**: None (toggles have no validation, always valid)

#### 2. Edit Number Input
**Flow**:
1. User clicks input field → field gains focus
2. User types new value
3. On blur (focus lost):
   - Validate: value >= min AND value <= max
   - If invalid: show inline error message, highlight field red, keep old value
   - If valid: accept new value, [Unsaved *] indicator appears, [Save Changes] enabled

**Validation**:
- `dashboard_refresh_seconds`: 5 ≤ value ≤ 300
- `target_oee_percent`: 0 ≤ value ≤ 100

**Error Messages**:
- `dashboard_refresh_seconds < 5`: "Refresh interval must be at least 5 seconds"
- `dashboard_refresh_seconds > 300`: "Refresh interval cannot exceed 300 seconds"
- `target_oee_percent < 0`: "Target OEE must be at least 0"
- `target_oee_percent > 100`: "Target OEE cannot exceed 100"

#### 3. Save Changes
**Flow**:
1. User clicks [Save Changes]
2. Validate all number inputs (should already be valid from on-blur)
3. If validation fails: scroll to first error, focus input
4. If validation passes:
   - Show loading spinner on button
   - `PUT /api/settings/production-execution` with all 15 settings
   - On success:
     - Show success toast: "Production settings saved"
     - Remove [Unsaved *] indicator
     - Disable [Save Changes] button
     - Clear unsaved changes list
   - On error:
     - Show error toast: "Failed to save settings: {error_message}"
     - Re-enable [Save Changes] button
     - Keep [Unsaved *] indicator

**Related AC**: AC #8 - Change setting + click "Save" → success toast "Settings saved"

**API Request**:
```json
PUT /api/settings/production-execution
{
  "allow_pause_wo": true,
  "auto_complete_wo": false,
  "require_operation_sequence": true,
  "allow_over_consumption": false,
  "enable_material_reservations": true,
  "require_qa_on_output": true,
  "auto_create_by_product_lp": true,
  "dashboard_refresh_seconds": 15,
  "show_material_alerts": true,
  "show_delay_alerts": true,
  "show_quality_alerts": true,
  "enable_oee_tracking": false,
  "target_oee_percent": 85,
  "enable_downtime_tracking": false,
  "allow_partial_lp_consumption": true
}
```

#### 4. Cancel Changes
**Flow**:
1. User clicks [Cancel]
2. All settings revert to last saved state (page reload or state reset)
3. Remove [Unsaved *] indicator
4. Disable [Save Changes] button
5. Clear unsaved changes list
6. No confirmation modal (instant revert)

### Secondary Actions

#### 5. Navigate Away with Unsaved Changes
**Flow**:
1. User clicks browser back, sidebar link, or closes tab
2. System detects unsaved changes
3. Show unsaved changes modal:
   - Title: "Unsaved Changes"
   - Message: "You have unsaved production setting changes. Leave without saving?"
   - List: Show changed settings with old → new values
   - Actions: [Cancel] [Discard] [Save & Leave]
4. User choice:
   - **[Cancel]**: Close modal, stay on page, keep unsaved changes
   - **[Discard]**: Close modal, navigate away, lose changes
   - **[Save & Leave]**: Save changes → navigate away on success

**Related AC**: AC #9 - Change setting without saving + navigate away → confirmation "Unsaved changes. Leave?"

#### 6. Expand/Collapse Section
**Flow**:
1. User clicks section header
2. Section content animates expand/collapse
3. Toggle icon changes: ▲ (expanded) ↔ ▼ (collapsed)
4. State persists in localStorage: `production_settings_sections_collapsed: ["oee", "advanced"]`

#### 7. Hover Tooltip
**Flow**:
1. User hovers over setting label or (i) icon
2. After 300ms delay, tooltip appears
3. Tooltip shows detailed explanation and impact
4. Tooltip disappears on mouse out

---

## States

### Loading State
- **Trigger**: Page load, fetching settings from API
- **Display**:
  - Skeleton loaders for section headers (7)
  - Skeleton loaders for setting rows (2-4 per section)
  - "Loading production settings..." text at bottom
- **Duration**: Typically <500ms, max 3s before timeout error

### Empty State
- **Trigger**: Settings not found in database (new org, migration issue)
- **Display**:
  - Center-aligned icon (⚙)
  - "No Production Settings Found" heading
  - Explanation message
  - [Initialize Default Settings] button
- **Action**: Creates settings row with all 15 default values
- **Transition**: After initialization → Success State

### Error State
- **Trigger**: API fetch fails (network error, 500, timeout)
- **Display**:
  - Center-aligned warning icon (⚠)
  - "Failed to Load Production Settings" heading
  - Error message: "Unable to retrieve production configuration. Check your connection."
  - Error code: "PRODUCTION_SETTINGS_FETCH_FAILED"
  - [Retry] button (primary)
  - [Contact Support] button (secondary)
- **Actions**:
  - **[Retry]**: Re-fetch settings from API
  - **[Contact Support]**: Opens support modal with error context

### Success State
- **Trigger**: Settings loaded successfully from API
- **Display**:
  - All 7 sections expanded by default
  - All 15 settings populated with current values
  - Toggles reflect saved state (ON/OFF)
  - Number inputs show saved values
  - [Save Changes] button disabled (no unsaved changes)
  - No [Unsaved *] indicator
- **Interactions**: All toggle, input, collapse actions available

### Unsaved State
- **Trigger**: User changes any setting (toggle or input)
- **Display**:
  - [Unsaved *] indicator in page header
  - [Save Changes] button enabled (blue)
  - Changed settings tracked in memory
- **Persist**: State persists across section collapse/expand
- **Warning**: Triggers unsaved changes modal on navigation

### Validation Error State (Number Input)
- **Trigger**: User enters invalid number, blurs input
- **Display**:
  - Input field border turns red
  - Warning icon (⚠) appears next to input
  - Error message in red below input
  - "Default: X" text replaced by error message
- **Recovery**: User enters valid value → error clears on next blur
- **Save Blocked**: [Save Changes] remains enabled, but click triggers scroll to first error

---

## Acceptance Criteria Coverage

### AC #1: Page loads → all 15 settings display with current values
- **State**: Success State
- **Verification**: All 7 sections expanded, all 15 settings visible with values from database
- **API**: `GET /api/settings/production-execution` returns all settings

### AC #2: Toggle allow_pause_wo OFF → ON → saved → WO detail shows "Pause" button
- **Flow**:
  1. Settings page: allow_pause_wo toggle shows [OFF ──●]
  2. User clicks toggle → changes to [ON ●──]
  3. User clicks [Save Changes] → API saves setting
  4. User navigates to WO detail page (WO status = "In Progress")
  5. WO detail page queries settings, reads allow_pause_wo = true
  6. [Pause] button renders in WO actions area
- **Component**: Toggle setting #1 (Allow Pause/Resume Work Orders)

### AC #3: Enter dashboard_refresh_seconds = 15 → saved → dashboard refreshes every 15s
- **Flow**:
  1. Settings page: dashboard_refresh_seconds input shows [30]
  2. User clicks input, types "15", blurs
  3. Validation passes (15 >= 5 and 15 <= 300)
  4. User clicks [Save Changes] → API saves setting
  5. User navigates to Production Dashboard
  6. Dashboard reads setting, sets refresh interval to 15,000ms
  7. Dashboard auto-refreshes every 15 seconds
- **Component**: Number input #8 (Dashboard Refresh Interval)

### AC #4: Enter dashboard_refresh_seconds = 0 → validation error "must be at least 5"
- **Flow**:
  1. Settings page: dashboard_refresh_seconds input shows [30]
  2. User clicks input, types "0", blurs
  3. Validation fails (0 < 5)
  4. Input border turns red
  5. Error message appears: "⚠ Refresh interval must be at least 5 seconds"
  6. Input retains old value (30) OR allows 0 but blocks save
- **Component**: Number input #8 with validation error state
- **Error Message**: "Refresh interval must be at least 5 seconds"

### AC #5: Enter dashboard_refresh_seconds = 5 → saves successfully
- **Flow**:
  1. Settings page: dashboard_refresh_seconds input shows [30]
  2. User clicks input, types "5", blurs
  3. Validation passes (5 >= 5 and 5 <= 300)
  4. No error message, input border green/normal
  5. User clicks [Save Changes] → API saves setting
  6. Success toast: "Production settings saved"
- **Component**: Number input #8 (edge case: minimum valid value)

### AC #6: Enter target_oee_percent = 110 → validation error "must be between 0 and 100"
- **Flow**:
  1. Settings page: target_oee_percent input shows [85]
  2. User clicks input, types "110", blurs
  3. Validation fails (110 > 100)
  4. Input border turns red
  5. Error message appears: "⚠ Target OEE must be between 0 and 100"
  6. Input retains old value (85) OR allows 110 but blocks save
- **Component**: Number input #13 with validation error state
- **Error Message**: "Target OEE must be between 0 and 100"

### AC #7: Enter target_oee_percent = 85 → saved → OEE dashboard shows 85% target
- **Flow**:
  1. Settings page: target_oee_percent input shows [85]
  2. User changes to "90", blurs
  3. Validation passes (90 >= 0 and 90 <= 100)
  4. User clicks [Save Changes] → API saves setting
  5. User navigates to OEE Dashboard (future: Epic 10)
  6. OEE Dashboard queries settings, reads target_oee_percent = 90
  7. Chart renders horizontal line at 90% as target
- **Component**: Number input #13 (Target OEE Percentage)

### AC #8: Change setting + click "Save" → success toast "Settings saved"
- **Flow**:
  1. User toggles any setting (e.g., show_material_alerts OFF → ON)
  2. User clicks [Save Changes]
  3. API request succeeds
  4. Success toast appears: "✓ Production settings saved | Changes applied successfully"
  5. Toast auto-dismisses after 3 seconds
- **Component**: Success toast component
- **Toast Message**: "Production settings saved" (title) + "Changes applied successfully" (message)

### AC #9: Change setting without saving + navigate away → confirmation "Unsaved changes. Leave?"
- **Flow**:
  1. User toggles setting (e.g., allow_pause_wo OFF → ON)
  2. [Unsaved *] indicator appears
  3. User clicks sidebar link or browser back (without clicking [Save Changes])
  4. Unsaved changes modal opens:
     - Title: "Unsaved Changes"
     - Message: "You have unsaved production setting changes. Leave without saving?"
     - Changed list: "• Allow Pause/Resume Work Orders: OFF → ON"
     - Actions: [Cancel] [Discard] [Save & Leave]
  5. User choice determines outcome
- **Component**: Unsaved changes modal
- **Modal Message**: "Unsaved changes. Leave?" (condensed) or "You have unsaved production setting changes. Leave without saving?" (full)

---

## Validation Rules

### Number Input Validation

#### Dashboard Refresh Interval (seconds)
- **Field**: `dashboard_refresh_seconds`
- **Type**: Integer
- **Min**: 5
- **Max**: 300
- **Default**: 30
- **Validation**:
  - `value < 5`: ❌ "Refresh interval must be at least 5 seconds"
  - `value > 300`: ❌ "Refresh interval cannot exceed 300 seconds"
  - `5 ≤ value ≤ 300`: ✅ Valid
- **Edge Cases**:
  - Empty input: ❌ Treat as 0, show "must be at least 5 seconds"
  - Non-numeric: ❌ "Please enter a valid number"
  - Decimal (e.g., 15.5): ✅ Round to 16 (or reject, TBD)

#### Target OEE Percentage
- **Field**: `target_oee_percent`
- **Type**: Integer
- **Min**: 0
- **Max**: 100
- **Default**: 85
- **Validation**:
  - `value < 0`: ❌ "Target OEE must be at least 0"
  - `value > 100`: ❌ "Target OEE cannot exceed 100"
  - `0 ≤ value ≤ 100`: ✅ Valid
- **Edge Cases**:
  - Empty input: ❌ Treat as 0, allow (edge case)
  - Non-numeric: ❌ "Please enter a valid number"
  - Decimal (e.g., 85.5): ✅ Round to 86 (or reject, TBD)

### Toggle Validation
- **No validation**: Toggles are always valid (true/false)
- **No constraints**: All toggles can be independently toggled without dependencies

### Save Validation
- **Pre-save check**: All number inputs must pass validation
- **If invalid**: Block save, scroll to first error, focus input
- **If valid**: Proceed with API request

---

## Permissions

### Role-Based Access

| Role | Can View | Can Edit | Can Save |
|------|----------|----------|----------|
| Super Admin | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes |
| Manager | Yes | No | No |
| Operator | No | No | No |
| Viewer | No | No | No |

**Notes**:
- Production settings are **organization-level**, not user-level
- Changes affect all users in the organization
- Only Admin roles can modify settings

### Permission Enforcement
- **Frontend**: Hide [Save Changes] button if user lacks permission
- **Frontend**: Disable all toggles and inputs if user lacks permission
- **Backend**: RLS policy blocks `UPDATE` if user not in (Super Admin, Admin) roles
- **Error**: If Manager tries to save via API: "Insufficient permissions to modify production settings"

---

## Accessibility

### Touch Targets
- **Toggle switches**: 48x48dp minimum (entire row clickable)
- **Number inputs**: 48dp height minimum
- **Buttons**: 48x48dp minimum ([Save Changes], [Cancel], [Retry])
- **Section headers**: 48dp height for collapse/expand

### Contrast
- **Toggle ON**: Green background (#22C55E) + white checkmark (≥4.5:1)
- **Toggle OFF**: Gray background (#E5E7EB) + dark text (≥4.5:1)
- **Labels**: Slate-900 on white (≥7:1)
- **Descriptions**: Slate-500 on white (≥4.5:1)
- **Error text**: Red-600 on white (≥4.5:1)

### Screen Reader
- **Page**: "Settings, Production Execution page, 15 settings"
- **Section**: "Work Order Lifecycle section, expanded, 2 settings"
- **Toggle setting**: "Allow Pause/Resume Work Orders, toggle switch, currently off, Enable pause and resume functionality for active work orders"
- **Number input**: "Dashboard Refresh Interval, number input, current value 30 seconds, How often the dashboard auto-refreshes, minimum 5, maximum 300"
- **Error**: "Dashboard Refresh Interval, invalid, Refresh interval must be at least 5 seconds"
- **Save button**: "Save Changes button, enabled, saves 2 unsaved changes"

### Keyboard Navigation
- **Tab order**: Sections → Setting toggles/inputs (top to bottom) → Footer buttons
- **Space**: Toggle switch (when focused)
- **Enter**: Save button (when focused), Collapse/Expand section (when header focused)
- **Arrow keys**: (Optional) Navigate between settings within section
- **Escape**: Cancel edit (reverts number input to old value)

### Focus Indicators
- **All interactive elements**: 2px solid blue outline on focus (#3B82F6)
- **Offset**: 2px gap between element and outline
- **Visibility**: High contrast, visible on all backgrounds

### Color Independence
- **Status not color-only**: Toggle ON/OFF uses icon + position (not just color)
- **Sections use icons**: 🏭, ⚙, 📦, 📋, 📊, 📈 (not just color)
- **Errors use icon**: ⚠ warning icon + red text (not just red color)

---

## Related Screens

### 1. Production Dashboard
- **Trigger**: User navigates to `/production/dashboard`
- **Dependency**: Reads `dashboard_refresh_seconds`, `show_material_alerts`, `show_delay_alerts`, `show_quality_alerts`
- **Impact**: Auto-refresh interval, alert visibility

### 2. Work Order Detail
- **Trigger**: User navigates to `/production/work-orders/:id`
- **Dependency**: Reads `allow_pause_wo`, `require_qa_on_output`, `auto_create_by_product_lp`
- **Impact**: [Pause] button visibility, QA status requirement on output

### 3. Material Consumption Page
- **Trigger**: User navigates to `/production/work-orders/:id/consume`
- **Dependency**: Reads `allow_over_consumption`, `allow_partial_lp_consumption`, `enable_material_reservations`
- **Impact**: Validation rules, reservation logic, partial consumption

### 4. OEE Dashboard (Phase 2)
- **Trigger**: User navigates to `/oee/dashboard` (Epic 10)
- **Dependency**: Reads `enable_oee_tracking`, `target_oee_percent`, `enable_downtime_tracking`
- **Impact**: OEE calculation, target line on charts, downtime tracking

### 5. Unsaved Changes Modal
- **Trigger**: User navigates away with unsaved changes
- **Content**: Shows changed settings list, actions: [Cancel] [Discard] [Save & Leave]
- **Reusable**: Same modal used across all settings pages

---

## Technical Notes

### Database Schema

**Table**: `production_settings` (singleton per org)

```sql
CREATE TABLE production_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),

  -- WO Lifecycle
  allow_pause_wo BOOLEAN DEFAULT FALSE,
  auto_complete_wo BOOLEAN DEFAULT FALSE,

  -- Operations
  require_operation_sequence BOOLEAN DEFAULT TRUE,

  -- Material Consumption
  allow_over_consumption BOOLEAN DEFAULT FALSE,
  enable_material_reservations BOOLEAN DEFAULT TRUE,

  -- Output Registration
  require_qa_on_output BOOLEAN DEFAULT TRUE,
  auto_create_by_product_lp BOOLEAN DEFAULT TRUE,

  -- Dashboard
  dashboard_refresh_seconds INTEGER DEFAULT 30 CHECK (dashboard_refresh_seconds BETWEEN 5 AND 300),
  show_material_alerts BOOLEAN DEFAULT TRUE,
  show_delay_alerts BOOLEAN DEFAULT TRUE,

  -- OEE & Downtime (Phase 2)
  show_quality_alerts BOOLEAN DEFAULT TRUE,
  enable_oee_tracking BOOLEAN DEFAULT FALSE,
  target_oee_percent INTEGER DEFAULT 85 CHECK (target_oee_percent BETWEEN 0 AND 100),
  enable_downtime_tracking BOOLEAN DEFAULT FALSE,

  -- Advanced
  allow_partial_lp_consumption BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- RLS Policy
ALTER TABLE production_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view production_settings for their org"
  ON production_settings FOR SELECT
  USING (org_id = auth.org_id());

CREATE POLICY "Admins can update production_settings for their org"
  ON production_settings FOR UPDATE
  USING (org_id = auth.org_id() AND auth.role() IN ('super_admin', 'admin'));
```

### API Endpoints

#### GET /api/settings/production-execution
- **Method**: GET
- **Auth**: Required (any authenticated user)
- **RLS**: Filters by `org_id`
- **Response**: JSON object with all 15 settings
- **Cache**: Cache-Control: private, max-age=60
- **Error Codes**:
  - 401: Unauthorized (not logged in)
  - 404: Settings not found (should auto-create with defaults)
  - 500: Server error

**Response Example**:
```json
{
  "org_id": "123e4567-e89b-12d3-a456-426614174000",
  "allow_pause_wo": false,
  "auto_complete_wo": false,
  "require_operation_sequence": true,
  "allow_over_consumption": false,
  "enable_material_reservations": true,
  "require_qa_on_output": true,
  "auto_create_by_product_lp": true,
  "dashboard_refresh_seconds": 30,
  "show_material_alerts": true,
  "show_delay_alerts": true,
  "show_quality_alerts": true,
  "enable_oee_tracking": false,
  "target_oee_percent": 85,
  "enable_downtime_tracking": false,
  "allow_partial_lp_consumption": true,
  "updated_at": "2025-12-14T10:30:00Z",
  "updated_by": "user-uuid"
}
```

#### PUT /api/settings/production-execution
- **Method**: PUT
- **Auth**: Required (Admin or Super Admin only)
- **RLS**: Checks role via RLS policy
- **Body**: JSON object with all 15 settings
- **Validation**:
  - `dashboard_refresh_seconds`: 5-300
  - `target_oee_percent`: 0-100
- **Response**: Updated settings object
- **Error Codes**:
  - 400: Validation error (invalid range)
  - 401: Unauthorized (not logged in)
  - 403: Forbidden (not Admin role)
  - 500: Server error

**Request Example**:
```json
{
  "allow_pause_wo": true,
  "auto_complete_wo": false,
  "require_operation_sequence": true,
  "allow_over_consumption": false,
  "enable_material_reservations": true,
  "require_qa_on_output": true,
  "auto_create_by_product_lp": true,
  "dashboard_refresh_seconds": 15,
  "show_material_alerts": true,
  "show_delay_alerts": true,
  "show_quality_alerts": true,
  "enable_oee_tracking": false,
  "target_oee_percent": 85,
  "enable_downtime_tracking": false,
  "allow_partial_lp_consumption": true
}
```

**Error Response Example** (400):
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Refresh interval must be between 5 and 300 seconds",
  "field": "dashboard_refresh_seconds",
  "value": 0
}
```

### Frontend Implementation Notes

#### State Management
- **Library**: Zustand or React Context
- **Store**: `useProductionSettingsStore`
- **State**:
  - `settings`: Current saved settings (from API)
  - `draftSettings`: User's edits (unsaved)
  - `hasUnsavedChanges`: Boolean (draftSettings !== settings)
  - `isLoading`: Boolean (API fetch in progress)
  - `isSaving`: Boolean (API save in progress)
  - `validationErrors`: Object (field → error message)

#### Unsaved Changes Detection
```typescript
const hasUnsavedChanges = useMemo(() => {
  return Object.keys(draftSettings).some(
    key => draftSettings[key] !== settings[key]
  );
}, [draftSettings, settings]);
```

#### Navigation Guard
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires this
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [hasUnsavedChanges]);

// For SPA navigation (Next.js router)
useEffect(() => {
  const handleRouteChange = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Leave without saving?'
      );
      if (!confirmed) {
        router.events.emit('routeChangeError');
        throw 'Route change aborted.';
      }
    }
  };

  router.events.on('routeChangeStart', handleRouteChange);
  return () => router.events.off('routeChangeStart', handleRouteChange);
}, [hasUnsavedChanges]);
```

#### Validation Logic
```typescript
const validateNumberInput = (field: string, value: number) => {
  if (field === 'dashboard_refresh_seconds') {
    if (value < 5) return 'Refresh interval must be at least 5 seconds';
    if (value > 300) return 'Refresh interval cannot exceed 300 seconds';
  }

  if (field === 'target_oee_percent') {
    if (value < 0) return 'Target OEE must be at least 0';
    if (value > 100) return 'Target OEE cannot exceed 100';
  }

  return null; // Valid
};
```

### Real-Time Sync
- **Not Required**: Production settings are org-level, not collaborative
- **No Realtime**: No Supabase Realtime subscription needed
- **Optimistic Updates**: Not recommended (settings changes are critical, wait for server confirmation)

### Caching Strategy
- **Client Cache**: React Query with 60s stale time
- **Cache Key**: `['production-settings', orgId]`
- **Invalidation**: On successful save, invalidate cache
- **Background Refetch**: Every 5 minutes (low priority)

---

## User Flows

### Flow 1: Enable "Allow Pause WO" Setting (Simple Toggle)

**Actors**: Admin user
**Precondition**: User has Admin role, production settings already exist

1. Admin navigates to `/settings/production-execution`
2. Page loads → Success State (all 15 settings displayed)
3. Admin locates "Allow Pause/Resume Work Orders" toggle (currently [OFF ──●])
4. Admin clicks toggle
5. Toggle animates to [ON ●──]
6. [Unsaved *] indicator appears in page header
7. [Save Changes] button turns blue (enabled)
8. Admin clicks [Save Changes]
9. Button shows loading spinner
10. API request: `PUT /api/settings/production-execution` with `allow_pause_wo: true`
11. API responds 200 OK
12. Success toast appears: "✓ Production settings saved"
13. [Unsaved *] indicator disappears
14. [Save Changes] button turns gray (disabled)
15. Admin navigates to `/production/work-orders/WO-001` (status: In Progress)
16. WO detail page loads
17. WO detail page reads production settings (allow_pause_wo = true)
18. [Pause] button renders in WO actions area
19. **Flow complete** ✅ (AC #2 verified)

### Flow 2: Change Dashboard Refresh to 15 Seconds (Number Input)

**Actors**: Admin user
**Precondition**: User has Admin role, dashboard_refresh_seconds currently 30

1. Admin navigates to `/settings/production-execution`
2. Page loads → Success State
3. Admin scrolls to "Dashboard" section (expanded)
4. Admin locates "Dashboard Refresh Interval (seconds)" input (shows [30])
5. Admin clicks input field → field gains focus, cursor appears
6. Admin selects all (Ctrl+A), types "15"
7. Admin clicks outside input (blur event)
8. Validation runs: 15 >= 5 AND 15 <= 300 → ✅ Valid
9. Input value changes to 15
10. [Unsaved *] indicator appears
11. [Save Changes] button enabled
12. Admin clicks [Save Changes]
13. API request: `PUT /api/settings/production-execution` with `dashboard_refresh_seconds: 15`
14. API responds 200 OK
15. Success toast: "✓ Production settings saved"
16. Admin navigates to `/production/dashboard`
17. Dashboard component reads production settings (dashboard_refresh_seconds = 15)
18. Dashboard sets refresh interval: `setInterval(() => fetchData(), 15000)`
19. Dashboard auto-refreshes every 15 seconds
20. **Flow complete** ✅ (AC #3 verified)

### Flow 3: Enter Invalid Dashboard Refresh (Validation Error)

**Actors**: Admin user
**Precondition**: User has Admin role

1. Admin navigates to `/settings/production-execution`
2. Page loads → Success State
3. Admin locates "Dashboard Refresh Interval (seconds)" input (shows [30])
4. Admin clicks input, types "0"
5. Admin presses Tab (blur event)
6. Validation runs: 0 < 5 → ❌ Invalid
7. Input border turns red (#EF4444)
8. Warning icon (⚠) appears next to input
9. Error message appears below input: "⚠ Refresh interval must be at least 5 seconds"
10. "Default: 30" text is replaced by error message
11. Input value remains "0" (or reverts to 30, depending on UX choice)
12. [Save Changes] button remains enabled
13. Admin clicks [Save Changes]
14. Save blocked → page scrolls to error
15. Input field gains focus
16. Admin corrects value to "5"
17. Admin blurs input
18. Validation runs: 5 >= 5 AND 5 <= 300 → ✅ Valid
19. Input border turns normal (gray)
20. Error message disappears
21. "Default: 30" text reappears
22. Admin clicks [Save Changes]
23. API request succeeds
24. Success toast: "✓ Production settings saved"
25. **Flow complete** ✅ (AC #4, AC #5 verified)

### Flow 4: Enter Invalid Target OEE (Out of Range)

**Actors**: Admin user
**Precondition**: User has Admin role

1. Admin navigates to `/settings/production-execution`
2. Page loads → Success State
3. Admin scrolls to "OEE & Downtime" section (expanded)
4. Admin locates "Target OEE Percentage" input (shows [85])
5. Admin clicks input, types "110"
6. Admin presses Enter (blur event)
7. Validation runs: 110 > 100 → ❌ Invalid
8. Input border turns red
9. Error message appears: "⚠ Target OEE must be between 0 and 100"
10. Input value remains "110" (shows invalid state)
11. Admin cannot save until corrected
12. Admin changes value to "85"
13. Admin blurs input
14. Validation passes: 85 >= 0 AND 85 <= 100 → ✅ Valid
15. Error clears, border normal
16. Admin saves successfully
17. **Flow complete** ✅ (AC #6, AC #7 verified)

### Flow 5: Save Multiple Settings (Batch Update)

**Actors**: Admin user
**Precondition**: User has Admin role

1. Admin navigates to `/settings/production-execution`
2. Page loads → Success State
3. Admin toggles "Allow Pause/Resume Work Orders" [OFF → ON]
4. [Unsaved *] appears
5. Admin toggles "Auto-Complete Work Orders" [OFF → ON]
6. Admin changes "Dashboard Refresh Interval" [30 → 20]
7. Admin toggles "Enable OEE Tracking" [OFF → ON]
8. Admin changes "Target OEE Percentage" [85 → 90]
9. Unsaved changes: 5 settings modified
10. Admin clicks [Save Changes]
11. API request: `PUT /api/settings/production-execution` with all 15 settings (5 changed, 10 unchanged)
12. API responds 200 OK
13. Success toast: "✓ Production settings saved"
14. All changes persisted
15. **Flow complete** ✅ (AC #8 verified)

### Flow 6: Navigate Away with Unsaved Changes (Modal Warning)

**Actors**: Admin user
**Precondition**: User has unsaved changes

1. Admin navigates to `/settings/production-execution`
2. Page loads → Success State
3. Admin toggles "Allow Pause/Resume Work Orders" [OFF → ON]
4. [Unsaved *] appears
5. Admin clicks sidebar link "Production > Dashboard" (without saving)
6. Navigation intercepted
7. Unsaved changes modal opens:
   - Title: "Unsaved Changes"
   - Message: "You have unsaved production setting changes. Leave without saving?"
   - Changed list: "• Allow Pause/Resume Work Orders: OFF → ON"
   - Actions: [Cancel] [Discard] [Save & Leave]
8. **Option A**: Admin clicks [Cancel]
   - Modal closes
   - Navigation cancelled
   - Admin stays on settings page
   - Unsaved changes preserved
9. **Option B**: Admin clicks [Discard]
   - Modal closes
   - Navigation proceeds
   - Admin lands on Dashboard
   - Settings changes lost
10. **Option C**: Admin clicks [Save & Leave]
    - Save API request triggered
    - On success: Modal closes → navigation proceeds
    - On error: Modal stays open, shows error toast
11. **Flow complete** ✅ (AC #9 verified)

### Flow 7: First-Time Setup (Empty State → Initialize Defaults)

**Actors**: Admin user (new organization)
**Precondition**: Settings not yet created in database

1. Admin navigates to `/settings/production-execution`
2. API fetch returns 404 (settings not found)
3. Page displays Empty State:
   - Icon: ⚙
   - Heading: "No Production Settings Found"
   - Message: "Production settings have not been configured for your organization. Initializing with default recommended settings..."
   - Button: [Initialize Default Settings]
4. Admin clicks [Initialize Default Settings]
5. API request: `POST /api/settings/production-execution` with all defaults
6. API responds 201 Created
7. Page transitions to Success State
8. All 15 settings displayed with default values
9. Success toast: "Production settings initialized with defaults"
10. **Flow complete** ✅

### Flow 8: Permission Denied (Manager Role)

**Actors**: Manager user (non-admin)
**Precondition**: User has Manager role (cannot edit production settings)

1. Manager navigates to `/settings/production-execution`
2. Page loads → Success State (read-only)
3. All toggles are **disabled** (grayed out, cannot click)
4. All number inputs are **read-only** (grayed out, cannot edit)
5. [Save Changes] button is **hidden** (not rendered)
6. Info banner displays: "ℹ You do not have permission to modify production settings. Contact an administrator."
7. Manager can view current settings but cannot change them
8. **Flow complete** ✅ (Permission enforcement verified)

---

## Approval Status

**Mode**: review_each (user review required)
**User Approved**: Pending
**Screens Approved**: []
**Iterations Used**: 0
**Ready for Handoff**: No (awaiting user approval)

---

## Review Request

**Screen**: PROD-007 - Production Settings

### Key Elements:
1. **15 settings** organized into 7 sections (WO Lifecycle, Operations, Material, Output, Dashboard, OEE, Advanced)
2. **2 number inputs** with validation (dashboard_refresh_seconds: 5-300, target_oee_percent: 0-100)
3. **13 toggle switches** (no validation)
4. **All 4 states**: Loading, Empty, Error, Success (plus validation error state)
5. **9 AC coverage**: All acceptance criteria from PRD mapped to wireframe
6. **Unsaved changes modal**: Warns user before navigation
7. **Permissions**: Admin-only edit access
8. **Accessibility**: 48x48dp touch targets, WCAG AA contrast, screen reader support

### Interactions:
- Toggle setting → [Unsaved *] appears → [Save Changes] enabled
- Edit number input → validate on blur → show inline error if invalid
- Click [Save Changes] → API request → success toast or error
- Navigate away with unsaved → modal: [Cancel] [Discard] [Save & Leave]
- Hover setting label → tooltip with detailed explanation

### States Defined:
- **Loading**: Skeleton loaders for all sections
- **Empty**: "No settings found" → [Initialize Default Settings]
- **Error**: "Failed to load" → [Retry] [Contact Support]
- **Success**: All 15 settings populated with current values
- **Validation Error**: Red border + error message for invalid number input

### AC Coverage:
- ✅ AC #1: Page loads → all 15 settings display
- ✅ AC #2: Toggle allow_pause_wo → WO detail shows "Pause" button
- ✅ AC #3: Enter dashboard_refresh_seconds = 15 → dashboard refreshes every 15s
- ✅ AC #4: Enter 0 → validation error "must be at least 5 seconds"
- ✅ AC #5: Enter 5 → saves successfully
- ✅ AC #6: Enter target_oee_percent = 110 → validation error "must be between 0 and 100"
- ✅ AC #7: Enter 85 → OEE dashboard shows 85% target line
- ✅ AC #8: Change setting + Save → success toast "Settings saved"
- ✅ AC #9: Unsaved changes + navigate → confirmation modal

**Do you approve this screen?** [Approve / Request Changes / Skip]
