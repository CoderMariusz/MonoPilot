# Story 1.6.4: Settings Wizard Onboarding (6-Step Org Setup)

Status: drafted

## Story

As a **System Administrator / New Organization**,
I want **6-step wizard for complete org setup (warehouses, lines, shifts, users, templates)**,
so that **setup takes 20 minutes (vs 2 hours manual) and onboarding is 90% error-free**.

## Acceptance Criteria

### AC-1: 6-Step Wizard Flow
- Step 1: Organization Info (org_name, industry, country, timezone, default_currency)
- Step 2: Warehouses & Locations (create 1+ warehouse, define default locations: Receiving, Storage, Shipping, QC, Transit)
- Step 3: Production Lines (define lines, assign to warehouse, set capacity, define shifts)
- Step 4: Shifts Configuration (Day 8:00-16:00, Swing 16:00-00:00, Night 00:00-8:00, customize times)
- Step 5: Users & Roles (invite users, assign roles: Admin, Manager, Operator, etc.)
- Step 6: Review & Confirm (summary of all settings, "Finish Setup" button)

### AC-2: Pre-filled Templates
- Industry templates: "Food Manufacturing - Meat Processing", "Food Manufacturing - Bakery", "Food Manufacturing - Dairy", "Generic Manufacturing"
- Template applies: Predefined warehouses (Raw Materials Warehouse, Finished Goods Warehouse), default locations (5 per warehouse), 3 shifts, sample users
- User can edit all pre-filled values before confirming

### AC-3: Progress Tracking
- Progress bar: "Step 3/6 (50%)"
- Save draft: Save incomplete wizard state, resume later
- Skip optional steps: Steps 4, 5 marked as optional (can skip)
- Required validation: Steps 1, 2, 3 must be completed

### AC-4: First-Time Wizard Launch
- Detect first login: If org has 0 warehouses → auto-launch wizard
- Wizard modal: Full-screen, blocking (cannot exit without completing or saving draft)
- "Skip for now" button: Creates minimal config (1 default warehouse, 1 line, Day shift only)

### AC-5: Wizard Completion Actions
- Create database records: org, warehouses (with 5 default locations each), production_lines, shifts, user_roles
- Send welcome email to invited users (with login link)
- Navigate to Dashboard with success toast: "Setup complete! Welcome to MonoPilot"

## Tasks / Subtasks

### Task 1: Wizard Component (6h)
- [ ] Create `<OrgSetupWizard>` component with 6 steps
- [ ] Progress bar, Back/Next buttons, validation
- [ ] Save draft feature (store wizard state in local storage)

### Task 2: Step Components (8h)
- [ ] Step 1: Org Info form (name, industry, country, timezone, currency)
- [ ] Step 2: Warehouses form (name, address, default locations multi-create)
- [ ] Step 3: Production Lines form (name, capacity, warehouse assignment)
- [ ] Step 4: Shifts form (name, start_time, end_time, editable)
- [ ] Step 5: Users form (email, role, send invite checkbox)
- [ ] Step 6: Review summary (read-only, "Finish Setup" button)

### Task 3: Industry Templates (4h)
- [ ] Define 4 industry template JSONs (Meat, Bakery, Dairy, Generic)
- [ ] Template selector on Step 1 (dropdown)
- [ ] Apply template → pre-fill Steps 2-5

### Task 4: First-Time Detection (3h)
- [ ] Detect first login (check warehouses count = 0)
- [ ] Auto-launch wizard modal (blocking, full-screen)
- [ ] "Skip for now" minimal config creation

### Task 5: Completion Actions (4h)
- [ ] Batch create: org, warehouses, locations, lines, shifts, user_roles
- [ ] Send welcome emails (Supabase Auth invite)
- [ ] Navigate to Dashboard with success toast

### Task 6: E2E Tests (3h)
- [ ] E2E: Complete 6-step wizard → org created, warehouses created
- [ ] E2E: Select "Meat Processing" template → Step 2 pre-filled with 2 warehouses
- [ ] E2E: Skip wizard → minimal config created (1 warehouse, 1 line)

### Task 7: Documentation (2h)
- [ ] Update architecture.md with wizard workflow
- [ ] Create setup guide (admin documentation)

**Total Estimated Effort:** 30 hours (~4 days)

## Dev Notes

**Industry Template Example (Meat Processing):**
```json
{
  "industry": "food-meat",
  "warehouses": [
    {"name": "Raw Materials Warehouse", "locations": ["Receiving", "Cold Storage", "Dry Storage", "QC", "Transit"]},
    {"name": "Finished Goods Warehouse", "locations": ["Receiving", "Storage", "Shipping", "QC Hold", "Transit"]}
  ],
  "lines": [
    {"name": "Grinding Line", "capacity_kg_per_hour": 500},
    {"name": "Mixing Line", "capacity_kg_per_hour": 300},
    {"name": "Packaging Line", "capacity_kg_per_hour": 200}
  ],
  "shifts": [
    {"name": "Day", "start_time": "08:00", "end_time": "16:00"},
    {"name": "Swing", "start_time": "16:00", "end_time": "00:00"}
  ]
}
```

**MVP Scope:**
✅ 6-step wizard, 4 industry templates, first-time detection, save draft, completion actions
❌ Growth: Multi-step validation (validate Step 2 before enabling Step 3), wizard customization (add/remove steps), import from Excel

**Dependencies:** None (foundational story)

## Dev Agent Record
### Context Reference
<!-- Will be added by story-context workflow -->
