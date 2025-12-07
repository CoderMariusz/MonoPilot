# Story 1.12: Settings Wizard (UX Design)

Status: ready-for-dev

## Story

As a **new Admin**,
I want a guided wizard to set up my organization,
so that I don't miss any important configuration.

## Acceptance Criteria

### UX Enhancement: Onboarding Wizard

**AC-012.1**: 6-step wizard triggered on first login:
- After Admin first logs in and organizations.wizard_completed = false
- Modal or full-page wizard with progress indicator (1/6, 2/6, ...)
- Steps:
  1. Organization Basics (company name, logo, address)
  2. Regional Settings (currency, timezone, language, date/number formats)
  3. First Warehouse (code, name, address)
  4. Key Locations (Receiving, Shipping, Transit, Production)
  5. Module Selection (enable/disable 8 modules)
  6. Invite First Users (email list with roles)
- Cannot skip to step N without completing step N-1
- Can dismiss wizard (button: "Skip wizard, do this later")

**AC-012.2**: Each step validates before proceeding:
- Step 1: company_name required (min 2 chars)
- Step 2: timezone, currency, language required
- Step 3: warehouse code and name required
- Step 4: at least Receiving and Shipping locations required
- Step 5: at least one module must be enabled
- Step 6: optional (can skip user invitations)
- On validation error: show inline error, prevent next step

**AC-012.3**: Wizard completion status tracked:
- organizations.wizard_completed: BOOLEAN (default false)
- On wizard completion: set wizard_completed = true
- Progress saved per step: organizations.wizard_progress: JSON { step: 3, data: {...} }
- If user dismisses wizard: wizard_completed = false, can resume later
- Button in Settings: "Resume Setup Wizard" (visible if wizard_completed = false)

**AC-012.4**: Wizard skip and resume functionality:
- "Skip wizard" button: dismiss modal, redirect to dashboard
- Banner on dashboard: "Complete your organization setup" with "Resume" button
- Resume: opens wizard at last completed step
- Once completed: banner hidden, wizard not shown on login

**AC-012.5**: Wizard flow handles circular dependencies:
- Step 3: Create warehouse with default locations = NULL
- Step 4: Create 4 locations (Receiving, Shipping, Transit, Production)
- After step 4: auto-update warehouse defaults with created location IDs
- Resolves circular dependency: warehouse ← locations ← warehouse defaults

**AC-012.6**: Module selection with descriptions:
- Step 5 shows 8 modules with checkboxes (not toggles)
- Each module: name, description, icon, default state
- Defaults: Technical, Planning, Production, Warehouse checked
- Can check/uncheck any module
- At least one module required (validation)

**AC-012.7**: User invitation with role assignment:
- Step 6 has form: add multiple users
- Each user row: email, first_name, last_name, role (dropdown)
- "+ Add Another User" button
- Remove user button (X icon)
- On wizard completion: send invitations to all users
- Users receive email with signup link

**AC-012.8**: Progress indicator and navigation:
- Progress bar or stepper: shows current step (1-6)
- Each step: "Back" and "Next" buttons (Back disabled on step 1)
- Step 6: "Next" → "Complete Setup"
- On completion: success modal, redirect to dashboard

**AC-012.9**: Wizard data validation and error handling:
- All form fields use Zod validation schemas from previous stories
- API errors shown as toast or inline
- If API fails (e.g., warehouse creation): show error, allow retry
- Network errors: show "Retry" button
- Data auto-saved per step (wizard_progress JSON)

**AC-012.10**: Wizard can be accessed later from Settings:
- Navigate to /settings → "Setup Wizard" menu item
- If wizard_completed = true: show "Re-run Setup Wizard" (for templates or multi-warehouse setup)
- Opens wizard in review mode: all data pre-filled, can edit and re-save
- Use case: Create 2nd warehouse, invite more users, etc.

## Tasks / Subtasks

### Task 1: Database Schema - Wizard Tracking (AC: 012.3)
- [ ] Add columns to organizations table:
  - [ ] wizard_completed BOOLEAN DEFAULT false
  - [ ] wizard_progress JSONB (stores current step + form data)
- [ ] Update organizations seed to include wizard fields
- [ ] Run migration and verify

### Task 2: Wizard Data Model (AC: 012.1, 012.3)
- [ ] Define WizardData interface:
  ```typescript
  interface WizardData {
    step: number                  // Current step (1-6)
    organization: {
      company_name: string
      logo?: File
      address: string
      city: string
      postal_code: string
      country: string
    }
    regional: {
      timezone: string
      currency: string
      language: string
      date_format: string
      number_format: string
    }
    warehouse: {
      code: string
      name: string
      address?: string
    }
    locations: {
      receiving: { code: string, name: string }
      shipping: { code: string, name: string }
      transit: { code: string, name: string }
      production: { code: string, name: string }
    }
    modules: string[]             // Array of enabled module codes
    users: Array<{
      email: string
      first_name: string
      last_name: string
      role: UserRole
    }>
  }
  ```

### Task 3: Wizard Service - Core Logic (AC: 012.3, 012.5)
- [ ] Create WizardService class/module
  - [ ] saveWizardProgress(orgId: string, step: number, data: Partial<WizardData>)
    - [ ] Update organizations.wizard_progress
    - [ ] Merge new data with existing data
  - [ ] getWizardProgress(orgId: string)
    - [ ] Query organizations.wizard_progress
    - [ ] Return current step and saved data
  - [ ] completeWizard(orgId: string, data: WizardData)
    - [ ] Step 1: Update organization (company_name, logo, address, etc.)
    - [ ] Step 2: Update regional settings
    - [ ] Step 3: Create warehouse (POST /api/settings/warehouses)
    - [ ] Step 4: Create 4 locations (POST /api/settings/locations x4)
    - [ ] Step 4.5: Update warehouse defaults with location IDs
    - [ ] Step 5: Update modules_enabled
    - [ ] Step 6: Create users and send invitations (POST /api/settings/users x N)
    - [ ] Set wizard_completed = true
    - [ ] Return success
  - [ ] All operations in transaction (rollback on error)

### Task 4: API Endpoints (AC: 012.3, 012.5)
- [ ] Implement POST /api/settings/wizard/progress
  - [ ] Body: { step: number, data: Partial<WizardData> }
  - [ ] Call WizardService.saveWizardProgress
  - [ ] Auth: Admin only
- [ ] Implement GET /api/settings/wizard/progress
  - [ ] Return current wizard progress
  - [ ] Auth: Admin only
- [ ] Implement POST /api/settings/wizard/complete
  - [ ] Body: WizardData
  - [ ] Call WizardService.completeWizard
  - [ ] Auth: Admin only
  - [ ] Response: { success: true }

### Task 5: Frontend Wizard Component (AC: 012.1, 012.2)
- [ ] Create /app/onboarding/wizard/page.tsx (or modal)
- [ ] Implement SetupWizard component
  - [ ] State: currentStep (1-6), wizardData (WizardData)
  - [ ] Progress indicator: show step 1/6, 2/6, etc.
  - [ ] Navigation: Back, Next, Skip, Complete buttons
  - [ ] Step rendering: switch currentStep
- [ ] Create step components:
  - [ ] Step1OrganizationBasics (form fields from Story 1.1)
  - [ ] Step2RegionalSettings (timezone, currency, language dropdowns)
  - [ ] Step3FirstWarehouse (code, name, address)
  - [ ] Step4KeyLocations (4 location forms: Receiving, Shipping, Transit, Production)
  - [ ] Step5ModuleSelection (checkboxes for 8 modules)
  - [ ] Step6InviteUsers (multi-row form with email, name, role)

### Task 6: Step Validation (AC: 012.2)
- [ ] Each step component has validation schema (Zod)
- [ ] On "Next" click: validate current step
  - [ ] If valid: save progress, increment currentStep
  - [ ] If invalid: show inline errors, stay on step
- [ ] Use react-hook-form for each step form
- [ ] Validation schemas from previous stories:
  - [ ] Step 1: UpdateOrganizationSchema (Story 1.1)
  - [ ] Step 3: CreateWarehouseSchema (Story 1.5)
  - [ ] Step 4: CreateLocationSchema x4 (Story 1.6)
  - [ ] Step 6: CreateUserSchema (Story 1.2)

### Task 7: Wizard Progress Auto-Save (AC: 012.3, 012.9)
- [ ] On "Next" click: POST /api/settings/wizard/progress
  - [ ] Save current step and form data
  - [ ] Allows resume if user closes wizard
- [ ] On page load: GET /api/settings/wizard/progress
  - [ ] If progress exists: restore currentStep and wizardData
  - [ ] Prefill form fields with saved data

### Task 8: Wizard Skip and Resume (AC: 012.4)
- [ ] "Skip wizard" button:
  - [ ] Close wizard modal
  - [ ] Redirect to dashboard
  - [ ] Show banner: "Complete your organization setup"
- [ ] Dashboard banner (if wizard_completed = false):
  - [ ] Message: "Complete your organization setup to get started"
  - [ ] "Resume Setup" button → open wizard
  - [ ] Dismissible (close X button)
- [ ] "Resume Setup" in Settings:
  - [ ] Menu item: /settings → "Setup Wizard"
  - [ ] Opens wizard, restores progress

### Task 9: Circular Dependency Resolution (AC: 012.5)
- [ ] Step 3: Create warehouse with defaults = NULL
  - [ ] POST /api/settings/warehouses { code, name, address }
  - [ ] Store warehouse.id in wizardData
- [ ] Step 4: Create 4 locations
  - [ ] POST /api/settings/locations (Receiving) → store location.id
  - [ ] POST /api/settings/locations (Shipping) → store location.id
  - [ ] POST /api/settings/locations (Transit) → store location.id
  - [ ] POST /api/settings/locations (Production) → store location.id
  - [ ] All with warehouse_id = wizardData.warehouse.id
- [ ] After step 4: Auto-update warehouse defaults
  - [ ] PUT /api/settings/warehouses/:id {
      default_receiving_location_id: receivingId,
      default_shipping_location_id: shippingId,
      transit_location_id: transitId
    }
  - [ ] Resolves circular dependency

### Task 10: Wizard Completion (AC: 012.8)
- [ ] On step 6 "Complete Setup" click:
  - [ ] Validate all steps (final check)
  - [ ] POST /api/settings/wizard/complete (all data)
  - [ ] Show loading spinner
  - [ ] On success:
    - [ ] Success modal: "Setup complete! Welcome to MonoPilot"
    - [ ] Redirect to dashboard
  - [ ] On error:
    - [ ] Show error modal with details
    - [ ] "Retry" button

### Task 11: Module Selection UI (AC: 012.6)
- [ ] Step 5: Module selection form
  - [ ] Grid of module cards (2x4 or 3x3)
  - [ ] Each card: checkbox, icon, name, description
  - [ ] Pre-checked: Technical, Planning, Production, Warehouse
  - [ ] At least one module required (validation)
  - [ ] On change: update wizardData.modules array

### Task 12: User Invitation UI (AC: 012.7)
- [ ] Step 6: User invitation form
  - [ ] Multi-row form: email, first_name, last_name, role
  - [ ] "+ Add Another User" button (adds row)
  - [ ] Remove user button (X icon per row)
  - [ ] Role dropdown: 10 roles (from Story 1.2)
  - [ ] Optional step: can skip (no users invited)
  - [ ] On completion: POST /api/settings/users for each user

### Task 13: Wizard Re-run from Settings (AC: 012.10)
- [ ] Add "Setup Wizard" menu item to /settings
  - [ ] If wizard_completed = false: "Complete Setup Wizard"
  - [ ] If wizard_completed = true: "Re-run Setup Wizard"
- [ ] On click: open wizard
  - [ ] If completed: load in review mode (all data pre-filled)
  - [ ] User can edit and re-save (creates 2nd warehouse, invites more users)
  - [ ] Use case: Multi-warehouse setup, bulk user invites

### Task 14: Progress Indicator (AC: 012.8)
- [ ] Implement stepper component
  - [ ] Shows steps 1-6 with labels
  - [ ] Current step highlighted
  - [ ] Completed steps: checkmark icon
  - [ ] Future steps: grayed out
- [ ] Or: Progress bar (linear, 0-100%)
  - [ ] Step 1: 16%, Step 2: 33%, ..., Step 6: 100%

### Task 15: Error Handling (AC: 012.9)
- [ ] API errors:
  - [ ] Show toast with error message
  - [ ] Allow retry (don't auto-advance step)
- [ ] Network errors:
  - [ ] Show "Connection lost" modal
  - [ ] "Retry" button
- [ ] Validation errors:
  - [ ] Show inline per field
  - [ ] Highlight step with error in stepper
- [ ] Transaction rollback:
  - [ ] If warehouse creation succeeds but location fails → rollback warehouse
  - [ ] All-or-nothing approach

### Task 16: Integration & Testing (AC: All)
- [ ] Unit tests: wizard service logic, validation
- [ ] Integration tests:
  - [ ] Complete wizard → all entities created
  - [ ] Skip wizard → progress saved, can resume
  - [ ] Resume wizard → data pre-filled
  - [ ] Validation errors → step blocked
  - [ ] API error → rollback, retry
- [ ] E2E tests (Playwright):
  - [ ] First login → wizard opens
  - [ ] Complete all 6 steps → redirect to dashboard
  - [ ] Skip wizard → banner shown, resume works
  - [ ] Re-run wizard → creates 2nd warehouse

## Dev Notes

### Technical Stack
Same as previous stories: Next.js 15, React 19, TypeScript, Supabase

### Key Technical Decisions

1. **Wizard Trigger**:
   - On first Admin login: check organizations.wizard_completed
   - If false: show wizard (modal or full-page)
   - If true: normal dashboard

2. **Progress Persistence**:
   - organizations.wizard_progress: JSON field
   - Stores current step + form data
   - Allows resume after dismissal

3. **Circular Dependency Resolution** (Step 3-4):
   ```
   Step 3: Create warehouse (defaults = NULL)
     ↓
   Step 4: Create 4 locations (with warehouse_id)
     ↓
   After Step 4: Update warehouse.default_*_location_id
     ↓
   Circular dependency resolved
   ```

4. **All-or-Nothing Approach**:
   - Use database transaction for wizard completion
   - If any step fails: rollback all changes
   - User can retry without partial data

5. **Optional User Invitations**:
   - Step 6 optional (can skip)
   - Rationale: Some admins prefer to invite users later

### Wizard Steps Detail

**Step 1: Organization Basics**
- Fields: company_name, logo (upload), address, city, postal_code, country
- Validation: company_name required, logo max 2MB

**Step 2: Regional Settings**
- Fields: timezone, currency, language, date_format, number_format
- Defaults: UTC, USD, EN, MM/DD/YYYY, 1,000.00

**Step 3: First Warehouse**
- Fields: code, name, address
- Creates warehouse with defaults = NULL

**Step 4: Key Locations**
- 4 forms: Receiving, Shipping, Transit, Production
- Each: code (auto-filled), name, type (pre-selected)
- After creation: update warehouse defaults

**Step 5: Module Selection**
- 8 checkboxes: Technical, Planning, Production, Warehouse, Quality, Shipping, NPD, Finance
- Defaults: first 4 checked
- At least one required

**Step 6: Invite Users**
- Multi-row form: email, first_name, last_name, role
- Can skip (optional)

### Data Model

```typescript
interface WizardProgress {
  step: number                  // 1-6
  data: Partial<WizardData>     // Form data per step
}

// organizations table
interface Organization {
  // ... existing fields
  wizard_completed: boolean     // Default false
  wizard_progress: WizardProgress | null
}
```

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.12]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#Onboarding-Wizard]
- [Source: docs/sprint-artifacts/ux-design-settings-module.md] (Wizard Mode)

### Prerequisites

**All Stories 1.1-1.11**: Wizard integrates all previous stories

### UX Design Integration

This story implements the "Wizard Mode" from ux-design-settings-module.md:
- 6-step guided setup
- Progress tracking
- Skip and resume functionality
- Circular dependency handling

## Dev Agent Record

### Context Reference

Story Context: [docs/sprint-artifacts/1-12-settings-wizard-ux-design.context.xml](./1-12-settings-wizard-ux-design.context.xml)

### Agent Model Used

<!-- Will be filled during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added after story completion -->

### File List

<!-- NEW/MODIFIED/DELETED files will be listed here after implementation -->

## Change Log

- 2025-11-20: Story drafted by Mariusz (from Epic 1 + Tech Spec Epic 1)
