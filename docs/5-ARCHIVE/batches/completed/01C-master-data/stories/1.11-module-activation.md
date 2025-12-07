# Story 1.11: Module Activation

Status: ready-for-dev

## Story

As an **Admin**,
I want to enable/disable modules for my organization,
so that we only see features we need.

## Acceptance Criteria

### FR-SET-010: Module Activation

**AC-010.1**: Admin może toggle 8 modules:
- Navigate to /settings/modules
- Grid or list of modules with toggle switches:
  - Technical (default: On) - Products, BOMs, Routings (Epic 2)
  - Planning (default: On) - POs, TOs, WOs (Epic 3)
  - Production (default: On) - WO execution (Epic 4)
  - Warehouse (default: On) - LPs, moves, pallets (Epic 5)
  - Quality (default: Off) - QA workflows (Epic 6)
  - Shipping (default: Off) - SOs, pick lists (Epic 7)
  - NPD (default: Off) - Formulation (Epic 8)
  - Finance (default: Off) - Costing, margin analysis (future)
- Each module has: name, description, icon, toggle switch, status badge (Active/Inactive)

**AC-010.2**: Default enabled modules:
- On organization creation: Technical, Planning, Production, Warehouse enabled
- Stored in organizations.modules_enabled array: ['technical', 'planning', 'production', 'warehouse']
- Quality, Shipping, NPD, Finance disabled by default
- User can enable/disable any module

**AC-010.3**: Disabled module hidden from navigation:
- Navbar/sidebar hides links to disabled modules
- Example: If Quality disabled → /quality/* routes hidden
- Dashboard widgets for disabled modules hidden
- Navigation rebuild on module toggle

**AC-010.4**: API endpoints dla disabled module return 403:
- API middleware checks organizations.modules_enabled array
- If module disabled → return 403 Forbidden
- Error message: "Module 'Quality' is not enabled for your organization"
- Frontend: redirect to 403 page or show toast

**AC-010.5**: Confirmation modal przy toggle off:
- Click toggle to disable → confirmation modal
- Modal shows:
  - "Disabling [Module] will hide [X] active entities"
  - List affected entities (e.g., "5 active Quality Checks will be hidden")
  - Warning: "Data will not be deleted, only hidden. You can re-enable later."
  - Actions: Cancel, Disable Module
- On confirm: module disabled, navigation updated, toast shown

**AC-010.6**: Module dependencies validation:
- Some modules depend on others (e.g., Shipping requires Warehouse)
- If disabling Warehouse: warn "Shipping module requires Warehouse. Disable both?"
- Dependencies (future):
  - Shipping → Warehouse
  - Production → Planning
  - NPD → Technical
- For MVP: no hard dependencies, just warnings

**AC-010.7**: Module activation affects role permissions:
- Roles are module-specific (e.g., qc role only useful if Quality enabled)
- If Quality disabled: qc users still have role, but no access
- Admin can reassign roles when enabling/disabling modules
- Role management integration (Story 1.2)

**AC-010.8**: Module enable/disable audit log:
- Track: who, when, which module, action (enable/disable)
- Display in audit log (future feature)
- For MVP: log to organizations.updated_by, updated_at

## Tasks / Subtasks

### Task 1: Database Schema - modules_enabled Column (AC: 010.1, 010.2)
- [ ] Add column to organizations table:
  - [ ] modules_enabled TEXT[] (array of module codes)
  - [ ] Default: ['technical', 'planning', 'production', 'warehouse']
  - [ ] NOT NULL, check constraint: array length > 0 (at least one module)
- [ ] Update organizations seed/migration to set defaults
- [ ] Run migration and verify

### Task 2: Module Configuration (AC: 010.1)
- [ ] Define module constants/config
  ```typescript
  const MODULES = [
    { code: 'technical', name: 'Technical', description: 'Products, BOMs, Routings', defaultEnabled: true, epic: 2 },
    { code: 'planning', name: 'Planning', description: 'POs, TOs, WOs', defaultEnabled: true, epic: 3 },
    { code: 'production', name: 'Production', description: 'WO Execution', defaultEnabled: true, epic: 4 },
    { code: 'warehouse', name: 'Warehouse', description: 'LPs, Moves, Pallets', defaultEnabled: true, epic: 5 },
    { code: 'quality', name: 'Quality', description: 'QA Workflows', defaultEnabled: false, epic: 6 },
    { code: 'shipping', name: 'Shipping', description: 'SOs, Pick Lists', defaultEnabled: false, epic: 7 },
    { code: 'npd', name: 'NPD', description: 'Formulation', defaultEnabled: false, epic: 8 },
    { code: 'finance', name: 'Finance', description: 'Costing, Margin Analysis', defaultEnabled: false, epic: null }
  ]
  ```
- [ ] Store in lib/config/modules.ts

### Task 3: Module Service - Core Logic (AC: 010.1, 010.5)
- [ ] Create ModuleService class/module
  - [ ] getEnabledModules(orgId: string)
    - [ ] Query organizations.modules_enabled
    - [ ] Return array of module codes
  - [ ] updateModules(orgId: string, modules: string[])
    - [ ] Validate: at least one module enabled
    - [ ] Update organizations.modules_enabled
    - [ ] Invalidate cache
    - [ ] Return success
  - [ ] toggleModule(orgId: string, moduleCode: string, enabled: boolean)
    - [ ] If disabling: check active entities (query count)
    - [ ] Update modules_enabled array (add or remove)
    - [ ] Return { success, affectedCount }
  - [ ] checkModuleActive(moduleCode: string, orgId: string)
    - [ ] Query organizations.modules_enabled
    - [ ] Return boolean (module in array)

### Task 4: API Middleware - Module Check (AC: 010.4)
- [ ] Create moduleCheckMiddleware
  - [ ] Extract module from route path (e.g., /api/quality/* → 'quality')
  - [ ] Query organizations.modules_enabled for current org
  - [ ] If module not in array → return 403 Forbidden
  - [ ] Error: { error: 'Module not enabled', module: 'quality' }
  - [ ] Otherwise: continue to route handler
- [ ] Apply middleware to all module-specific API routes
  - [ ] /api/technical/* → check 'technical'
  - [ ] /api/planning/* → check 'planning'
  - [ ] /api/production/* → check 'production'
  - [ ] /api/warehouse/* → check 'warehouse'
  - [ ] /api/quality/* → check 'quality'
  - [ ] /api/shipping/* → check 'shipping'
  - [ ] /api/npd/* → check 'npd'
  - [ ] /api/finance/* → check 'finance'
- [ ] Exclude /api/settings/* from module check (settings always accessible)

### Task 5: API Endpoints (AC: 010.1, 010.5)
- [ ] Implement GET /api/settings/modules
  - [ ] Return: current modules_enabled array + full module config
  - [ ] Auth: Authenticated
- [ ] Implement PUT /api/settings/modules
  - [ ] Body: { modules: string[] }
  - [ ] Validate: at least one module enabled
  - [ ] Call ModuleService.updateModules
  - [ ] Auth: Admin only
  - [ ] Invalidate org cache
- [ ] Implement POST /api/settings/modules/toggle
  - [ ] Body: { module: string, enabled: boolean }
  - [ ] If disabling: return affected entity count
  - [ ] Call ModuleService.toggleModule
  - [ ] Auth: Admin only

### Task 6: Frontend Modules Page (AC: 010.1, 010.2, 010.3)
- [ ] Create /app/settings/modules/page.tsx
- [ ] Implement ModulesGrid component
  - [ ] Grid layout (2x4 or 3x3)
  - [ ] Each module card:
    - [ ] Icon (module-specific)
    - [ ] Name, description
    - [ ] Status badge (Active green, Inactive gray)
    - [ ] Toggle switch
  - [ ] Toggle switch onClick → confirmation modal
- [ ] Fetch: GET /api/settings/modules
- [ ] Update: POST /api/settings/modules/toggle

### Task 7: Module Toggle Confirmation Modal (AC: 010.5)
- [ ] Create ModuleToggleModal component
  - [ ] Show when disabling module
  - [ ] Display:
    - [ ] "Disable [Module]?"
    - [ ] "[X] active entities will be hidden"
    - [ ] Entity breakdown (e.g., "5 Quality Checks, 3 QA Users")
    - [ ] Warning: "Data not deleted, only hidden. Re-enable anytime."
  - [ ] Actions: Cancel, Disable Module
  - [ ] On confirm: PUT /api/settings/modules

### Task 8: Navigation Rebuild (AC: 010.3)
- [ ] Create useEnabledModules hook
  - [ ] Fetches organizations.modules_enabled
  - [ ] Returns array of enabled module codes
  - [ ] Used in navigation component
- [ ] Update navigation component
  - [ ] Filter nav links by enabled modules
  - [ ] Example:
    ```typescript
    const navLinks = [
      { path: '/technical', module: 'technical', label: 'Technical' },
      { path: '/planning', module: 'planning', label: 'Planning' },
      // ...
    ].filter(link => enabledModules.includes(link.module))
    ```
  - [ ] Dashboard widgets filtered similarly
- [ ] Realtime update: subscribe to module changes, rebuild nav

### Task 9: Module Dependencies Validation (AC: 010.6) - Optional for MVP
- [ ] Define module dependencies:
  ```typescript
  const MODULE_DEPENDENCIES = {
    shipping: ['warehouse'],
    production: ['planning'],
    npd: ['technical']
  }
  ```
- [ ] When disabling module: check dependencies
  - [ ] If dependent module enabled: show warning
  - [ ] "Shipping requires Warehouse. Disable both?"
  - [ ] Option: disable all, cancel
- [ ] Recommendation: Skip for MVP, add in Phase 2

### Task 10: Role-Module Integration (AC: 010.7) - Optional
- [ ] When module disabled: qc/npd users lose access
- [ ] Admin can reassign roles
- [ ] For MVP: just hide UI, keep role assignments
- [ ] Phase 2: suggest role reassignment on module disable

### Task 11: Affected Entities Count (AC: 010.5)
- [ ] When disabling module: query active entity counts
  - [ ] Quality: count active QA checks
  - [ ] Shipping: count active SOs
  - [ ] NPD: count active formulations
- [ ] Return count in toggle API response
- [ ] Display in confirmation modal

### Task 12: Integration & Testing (AC: All)
- [ ] Unit tests: module validation, toggle logic
- [ ] Integration tests:
  - [ ] Update modules_enabled → nav updated
  - [ ] Disable module → API returns 403
  - [ ] Enable module → API accessible again
  - [ ] Toggle with active entities → count returned
- [ ] E2E tests:
  - [ ] Toggle module → confirmation modal
  - [ ] Disable module → nav link hidden
  - [ ] API request to disabled module → 403 error

## Dev Notes

### Technical Stack
Same as previous stories: Next.js 15, React 19, TypeScript, Supabase

### Key Technical Decisions

1. **Storage**:
   - organizations.modules_enabled: TEXT[] (PostgreSQL array)
   - Example: ['technical', 'planning', 'production', 'warehouse']
   - Default on org creation

2. **Module Codes**:
   - technical, planning, production, warehouse, quality, shipping, npd, finance
   - Lowercase, no spaces
   - Used in API paths, nav routing, database

3. **API Middleware**:
   - Extract module from route: /api/quality/* → 'quality'
   - Check organizations.modules_enabled
   - Return 403 if disabled

4. **UI Hiding**:
   - Frontend: filter nav links by enabled modules
   - Backend: 403 for API requests
   - Data not deleted: just hidden/inaccessible

5. **Default Modules** (MVP):
   - Technical, Planning, Production, Warehouse: ON
   - Quality, Shipping, NPD, Finance: OFF
   - Rationale: core MES features enabled, advanced features opt-in

### Data Model

```typescript
// organizations table
interface Organization {
  // ... existing fields
  modules_enabled: string[]     // Array of module codes
  // Default: ['technical', 'planning', 'production', 'warehouse']
}

interface Module {
  code: string                  // e.g., 'technical', 'quality'
  name: string                  // Display name
  description: string           // Short description
  defaultEnabled: boolean       // Default state on org creation
  epic: number | null           // Associated epic (2-8)
}
```

### Module Configuration

```typescript
const MODULES = [
  { code: 'technical', name: 'Technical', description: 'Products, BOMs, Routings', defaultEnabled: true, epic: 2 },
  { code: 'planning', name: 'Planning', description: 'POs, TOs, WOs', defaultEnabled: true, epic: 3 },
  { code: 'production', name: 'Production', description: 'WO Execution', defaultEnabled: true, epic: 4 },
  { code: 'warehouse', name: 'Warehouse', description: 'LPs, Moves, Pallets', defaultEnabled: true, epic: 5 },
  { code: 'quality', name: 'Quality', description: 'QA Workflows', defaultEnabled: false, epic: 6 },
  { code: 'shipping', name: 'Shipping', description: 'SOs, Pick Lists', defaultEnabled: false, epic: 7 },
  { code: 'npd', name: 'NPD', description: 'Formulation', defaultEnabled: false, epic: 8 },
  { code: 'finance', name: 'Finance', description: 'Costing, Margin Analysis', defaultEnabled: false, epic: null }
]
```

### References

- [Source: docs/epics/epic-1-settings.md#Story-1.11]
- [Source: docs/sprint-artifacts/tech-spec-epic-1.md#FR-SET-010]

### Prerequisites

**Story 1.1**: Organizations (modules_enabled column)

### Downstream

- All Epics 2-8: Check module activation before showing UI/API

## Dev Agent Record

### Context Reference

Story Context: [docs/sprint-artifacts/1-11-module-activation.context.xml](./1-11-module-activation.context.xml)

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
