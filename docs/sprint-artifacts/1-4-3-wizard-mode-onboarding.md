# Story 1.4.3: Wizard Mode Onboarding

Status: drafted

## Story

As a **Junior Planner / New User**,
I want **5-step wizard for guided Work Order creation with contextual help and smart defaults**,
so that **I can create my first WO in 48 seconds with 0% errors (vs 90 seconds and 30% error rate with modal)**.

## Acceptance Criteria

### AC-1: 5-Step Wizard Component
- Create `<WOWizard>` component with step-by-step flow (linear navigation)
- Progress bar: Visual indicator showing "Step 3/5 (60%)"
- Back button: Return to previous step (preserve all inputs)
- Next button: Advance to next step (disabled until current step valid)
- Cancel button: Exit wizard with unsaved changes confirmation
- Step validation: Prevent advancing until required fields completed

### AC-2: Step 1/5 - Select Product
- Large search box with auto-complete (type "CHICK" → show matching products)
- Product cards: Display product image (if available), name, code, default UoM
- Recently used products: Show last 5 products created as WOs (quick select)
- Contextual help: 💡 "Tip: Type product code or description to search"
- Required validation: Must select product to enable "Next" button

### AC-3: Step 2/5 - Set Quantity
- Number input with large font (easy to see)
- UoM display: Auto-filled from selected product (read-only)
- Quick buttons: 100 / 500 / 1000 / 5000 (common quantities, pre-fill on click)
- Output calculation: Show expected output LPs (e.g., "1000 kg → ~10 pallets")
- Contextual help: 💡 "Tip: Most WOs are between 500-2000 kg"
- Validation: Quantity > 0 and <= 999999

### AC-4: Step 3/5 - Set Date & Shift
- Date picker with calendar view
- Quick buttons: Today / Tomorrow / +1 week (pre-fill dates)
- Shift selector: Radio buttons (Day 8:00-16:00 / Swing 16:00-00:00 / Night 00:00-8:00)
- Smart default: Select Day shift by default (most common)
- Contextual help: 💡 "Tip: Most WOs scheduled 1-3 days ahead"
- Validation: Date >= today (cannot schedule in past)

### AC-5: Step 4/5 - Select Line
- Line cards: Display line name, capacity %, recommendation badge
- Recommendation logic: Show "✓ Recommended" on BOM preferred_line OR lowest capacity line
- Capacity indicator: Green (<75%), Yellow (75-100%), Red (>100% overbooked)
- Allergen warning: Show ⚠️ "Allergen conflict" if product cannot run on line
- Contextual help: 💡 "Tip: Line A is optimized for sausages (allergen-free)"
- Validation: Must select line (no allergen conflicts)

### AC-6: Step 5/5 - Review & Confirm
- Summary card: Show all inputs (Product, Qty, Date, Shift, Line, BOM version)
- Calculated fields: Auto-filled scheduled_start, scheduled_end, due_date
- Inline edit links: Click "Edit" next to any field → jump back to that step
- BOM version display: Show auto-selected BOM (latest active for scheduled_date)
- Confirmation button: "Create Work Order" (large, prominent)
- Preview warning: If line >100% capacity → show ⚠️ "Line overbooked, consider rescheduling"

### AC-7: Success Screen
- Success message: "✓ Work Order WO-0109 created successfully!"
- WO summary: Product, Quantity, Line, Date (read-only summary)
- Action buttons: "Create Another" / "View Work Order" / "View Timeline" / "Done"
- Create Another: Restart wizard with last product pre-selected (faster repeat)
- View Work Order: Navigate to WO detail page
- Done: Return to Planning page (WO list view)

### AC-8: First-Time User Detection & Graduation
- First-time detection: Check user.created_at < 14 days OR wo_created_count < 3
- Default mode: Show Wizard by default for new users (instead of Mode Selection Dialog)
- Graduation popup: After 3rd WO created → "You're getting good! Try Spreadsheet Mode for faster bulk creation?"
- Mode suggestion: Link to Spreadsheet Mode with pre-filled row (last WO as template)
- Preference save: "Don't show this again" → save to user_preferences.default_wo_mode = 'spreadsheet'

### AC-9: Documentation
- Update `docs/architecture.md` with Wizard Mode workflow diagram
- Document step validation rules and smart defaults
- Create user onboarding guide (screenshot-based tutorial)
- Update `docs/API_REFERENCE.md` with wizard data endpoints

## Tasks / Subtasks

### Task 1: Wizard Component & Navigation (AC-1) - 6 hours
- [ ] 1.1: Create `<WOWizard>` component with step state management
- [ ] 1.2: Implement progress bar (Step 3/5 = 60%)
- [ ] 1.3: Add Back/Next/Cancel buttons with validation
- [ ] 1.4: Step validation: disable Next until current step valid
- [ ] 1.5: Cancel confirmation modal if unsaved changes
- [ ] 1.6: Add unit tests for step navigation, validation

### Task 2: Step 1 - Select Product (AC-2) - 4 hours
- [ ] 2.1: Create large search box with auto-complete (product search)
- [ ] 2.2: Render product cards (image, name, code, UoM)
- [ ] 2.3: Show recently used products (last 5 WOs)
- [ ] 2.4: Add contextual help tooltip
- [ ] 2.5: Validation: require product selection to enable Next

### Task 3: Step 2 - Set Quantity (AC-3) - 3 hours
- [ ] 3.1: Create number input with large font
- [ ] 3.2: Display auto-filled UoM (read-only)
- [ ] 3.3: Add quick buttons (100, 500, 1000, 5000)
- [ ] 3.4: Calculate output LPs (quantity ÷ pallet_capacity)
- [ ] 3.5: Validation: quantity > 0 and <= 999999

### Task 4: Step 3 - Set Date & Shift (AC-4) - 4 hours
- [ ] 4.1: Create date picker with calendar view
- [ ] 4.2: Add quick buttons (Today, Tomorrow, +1 week)
- [ ] 4.3: Render shift selector (radio buttons: Day, Swing, Night)
- [ ] 4.4: Default to Day shift (most common)
- [ ] 4.5: Validation: date >= today (no past dates)

### Task 5: Step 4 - Select Line (AC-5) - 5 hours
- [ ] 5.1: Create line cards (name, capacity %, recommendation badge)
- [ ] 5.2: Recommendation logic: BOM preferred_line OR lowest capacity
- [ ] 5.3: Capacity indicator color coding (green/yellow/red)
- [ ] 5.4: Allergen conflict detection (show ⚠️ if invalid)
- [ ] 5.5: Validation: require line selection, no allergen conflicts

### Task 6: Step 5 - Review & Confirm (AC-6) - 5 hours
- [ ] 6.1: Create summary card (all inputs displayed)
- [ ] 6.2: Auto-calculate scheduled_start, scheduled_end, due_date
- [ ] 6.3: Display auto-selected BOM version (latest active)
- [ ] 6.4: Inline edit links (jump back to specific step)
- [ ] 6.5: Preview warning if line >100% capacity
- [ ] 6.6: "Create Work Order" button (API call)

### Task 7: Success Screen (AC-7) - 3 hours
- [ ] 7.1: Create success screen component
- [ ] 7.2: Display WO summary (product, qty, line, date)
- [ ] 7.3: Add action buttons (Create Another, View WO, View Timeline, Done)
- [ ] 7.4: "Create Another" → restart wizard with last product pre-selected
- [ ] 7.5: Navigation logic for each button

### Task 8: First-Time User Detection & Graduation (AC-8) - 4 hours
- [ ] 8.1: Implement first-time user detection (created_at < 14 days OR wo_count < 3)
- [ ] 8.2: Default to Wizard mode for new users (skip Mode Selection Dialog)
- [ ] 8.3: Track wo_created_count in user_preferences table
- [ ] 8.4: Graduation popup after 3rd WO created
- [ ] 8.5: Save default_wo_mode preference on "Don't show again"

### Task 9: E2E Tests (4 hours)
- [ ] 9.1: E2E test: Complete wizard 5 steps → WO created successfully
- [ ] 9.2: E2E test: Back button → previous step preserved inputs
- [ ] 9.3: E2E test: Step validation → Next disabled until valid
- [ ] 9.4: E2E test: Quick buttons (Today, 1000 kg) → fields auto-filled
- [ ] 9.5: E2E test: Graduation popup → switch to Spreadsheet Mode

### Task 10: Documentation (AC-9) - 2 hours
- [ ] 10.1: Run `pnpm docs:update` to regenerate API docs
- [ ] 10.2: Update `docs/architecture.md` with Wizard Mode workflow
- [ ] 10.3: Create user onboarding guide (screenshot tutorial)
- [ ] 10.4: Document step validation rules and smart defaults

**Total Estimated Effort:** 40 hours (~5 days)

## Dev Notes

### Requirements Source
[Source: docs/ux-design-planning-module.md#Variant-D-Wizard-Mode, lines 514-549]

**Wizard Mode Key Features:**
- 5-step guided flow (1 question at a time)
- 0% error rate (step validation prevents invalid inputs)
- 71% faster onboarding (2 days vs 1 week for new planners)
- Smart defaults (BOM version, line, shift auto-filled)
- Quick buttons (Today, Tomorrow, 100/500/1000 qty presets)
- Contextual help (💡 tooltips explain each field)

[Source: docs/ux-design-planning-module.md#Expected-Impact, lines 60-61]
**Quantitative Benefits:**
- New user onboarding: 1 week → 2 days (71% faster)
- Error rate: 30% → 0% (step validation)
- Time per WO: 90s → 48s (smart defaults reduce typing)

### Architecture Constraints

**Step Validation Rules:**
- Step 1: product_id REQUIRED (must select product)
- Step 2: quantity > 0 AND quantity <= 999999
- Step 3: scheduled_date >= today (no past dates)
- Step 4: line_id REQUIRED AND no allergen conflicts
- Step 5: BOM version auto-selected (latest active for scheduled_date)

**Smart Defaults:**
```typescript
// Step 2: Output calculation
const pallet_capacity = product.default_pallet_qty || 100; // kg per pallet
const expected_pallets = Math.ceil(quantity / pallet_capacity);
// Display: "1000 kg → ~10 pallets"

// Step 3: Default shift
const default_shift = 'Day'; // 8:00-16:00 (most common)

// Step 4: Recommended line
const recommended_line =
  bom.preferred_line_id || // BOM preference first
  getLowestCapacityLine(scheduled_date, shift); // fallback to lowest capacity

// Step 5: Auto-calculated fields
const scheduled_start = getShiftStartTime(scheduled_date, shift); // e.g., 8:00 for Day
const duration = getBOMDuration(bom_id); // from routing operations
const scheduled_end = new Date(scheduled_start.getTime() + duration);
const due_date = new Date(scheduled_end.getTime() + 24*60*60*1000); // +1 day
```

**First-Time User Detection:**
```typescript
function isFirstTimeUser(user: User): boolean {
  const account_age_days = (new Date() - user.created_at) / (1000*60*60*24);
  const wo_count = getUserPreference(user.id, 'wo_created_count') || 0;
  return account_age_days < 14 || wo_count < 3;
}

// After WO created successfully
async function incrementWOCount(user_id: string) {
  const current_count = getUserPreference(user_id, 'wo_created_count') || 0;
  await setUserPreference(user_id, 'wo_created_count', current_count + 1);

  if (current_count + 1 === 3) {
    showGraduationPopup(); // "Try Spreadsheet Mode for faster bulk creation?"
  }
}
```

### Testing Strategy

**Risk-Based E2E Coverage:**
- COMPLEX: 5-step wizard flow (multi-step form, state preservation) = E2E required
- HIGH RISK: Step validation (prevent invalid WOs) = E2E required
- COMPLEX: First-time user detection + graduation (user state tracking) = E2E required
- Simple: Quick buttons, smart defaults = unit test sufficient

**E2E Test Scenarios:**
1. Complete wizard 5 steps → WO created → success screen shows
2. Back button → previous step → inputs preserved
3. Next disabled until step valid → complete step → Next enabled
4. Quick buttons (Today, 1000 kg, Day shift) → fields auto-filled
5. Allergen conflict (product on Line A) → ⚠️ warning → cannot select
6. Create 3rd WO → graduation popup → "Try Spreadsheet" → mode switched
7. "Create Another" → wizard restarts → last product pre-selected

### Project Structure Notes

**Files to Create/Modify:**
- `apps/frontend/components/WOWizard.tsx` - Main wizard component
- `apps/frontend/components/wizard/Step1SelectProduct.tsx` - Step 1 component
- `apps/frontend/components/wizard/Step2SetQuantity.tsx` - Step 2 component
- `apps/frontend/components/wizard/Step3SetDate.tsx` - Step 3 component
- `apps/frontend/components/wizard/Step4SelectLine.tsx` - Step 4 component
- `apps/frontend/components/wizard/Step5ReviewConfirm.tsx` - Step 5 component
- `apps/frontend/components/wizard/WizardSuccessScreen.tsx` - Success screen
- `apps/frontend/components/wizard/GraduationPopup.tsx` - Graduation popup
- `apps/frontend/lib/utils/wizardDefaults.ts` - Smart defaults logic
- `apps/frontend/lib/api/userPreferences.ts` - User preferences API
- `apps/frontend/__tests__/woWizard.test.ts` - Unit tests
- `apps/frontend/e2e/wizard-mode-onboarding.spec.ts` - E2E tests
- `docs/architecture.md` - Wizard Mode documentation

### MVP Scope

✅ **MVP Features** (ship this):
- 5-step wizard (Product, Quantity, Date/Shift, Line, Review)
- Progress bar and step validation
- Quick buttons (Today, Tomorrow, 100/500/1000)
- Smart defaults (shift, line, BOM version)
- Success screen with "Create Another"
- First-time user detection (show Wizard by default)
- Graduation popup (after 3 WOs)

❌ **Growth Phase** (defer):
- Recently used products list (show all products in MVP)
- Output calculation (pallet count) - static info in MVP
- Inline edit in review step - use Back button in MVP
- Contextual help tooltips - basic labels only in MVP
- Wizard for PO/TO creation - WO only in MVP

### Dependencies

**Prerequisites:**
- Story 1.4.1 (Spreadsheet Mode) - for graduation popup transition
- Existing work_orders API (create method)
- User preferences table (wo_created_count, default_wo_mode)

**Blocks:**
- None (independent story)

### Learnings from Previous Stories

**From Story 1.4.1 (Spreadsheet Mode):**
- Mode Selection Dialog pattern → Wizard is one of 3 modes
- Smart defaults pattern → apply to Wizard auto-fill logic

**From Story 1.4.2 (Timeline Mode):**
- Conflict detection → apply to Wizard line selection (allergen conflicts)
- Capacity calculation → show in Step 4 line cards

**From Epic 0 Retrospective:**
- Risk-Based E2E Strategy → 5-step wizard is COMPLEX (multi-step state)
- MVP Discipline → defer inline edit, output calculation to Growth
- Incremental Documentation → create user onboarding guide with screenshots

**Reuse Patterns:**
- Product search auto-complete → reuse from existing product selectors
- Date picker → reuse from existing date inputs
- Smart defaults → similar to Story 1.4.1 auto-scheduling

## Dev Agent Record

### Context Reference

<!-- Will be added by story-context workflow -->

### Agent Model Used

<!-- Will be filled during dev-story execution -->

### Debug Log References

### Completion Notes List

### File List
