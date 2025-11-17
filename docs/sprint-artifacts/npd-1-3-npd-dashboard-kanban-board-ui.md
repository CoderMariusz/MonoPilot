# Story NPD-1.3: NPD Dashboard - Kanban Board UI

Status: ready-for-dev

## Story

As an R&D user,
I want to visualize NPD pipeline as Kanban board,
so that I can see project distribution across gates.

## Acceptance Criteria

1. **AC-1: Kanban Board Layout**
   - Implement `/npd` page with 5 Kanban columns: G0 (Idea), G1 (Concept), G2 (Development), G3 (Testing), G4 (Launch)
   - Column headers display gate name, gate badge (color-coded), and project count
   - Columns are equal width, horizontally scrollable on mobile
   - Background: Innovation Light theme (gray-50 main background, white card surfaces)

2. **AC-2: Project Cards**
   - Display NPD projects as cards using shadcn/ui Card component
   - Card design:
     - Header: Project number (bold), risk indicator (H/M/L colored circle)
     - Body: Project name (max 2 lines), truncated description
     - Footer: Progress badges (formulation version, compliance docs count)
     - Gradient background color-coded by gate (G0 red → G4 green)
   - Cards sorted by priority (High → Medium → Low) within each column

3. **AC-3: Drag-and-Drop Functionality**
   - Implement drag-and-drop using react-beautiful-dnd
   - Users can drag cards between ADJACENT gates only (G0→G1, G1→G2, not G0→G3)
   - Visual feedback:
     - Card shadow increases on drag (hover:shadow-md → shadow-xl)
     - Drop zones highlighted with blue dashed border
     - Placeholder shows card position during drag
   - On drop: Call `NPDProjectsAPI.advanceGate(id, toGate)` to persist change
   - If gate advancement fails (validation error), revert card position and show error toast

4. **AC-4: Stats Bar**
   - Display metrics above Kanban board:
     - Active Projects (total count)
     - G0 count, G1 count, G2-G3 count (combined)
     - Ready for Handoff count (G3 projects with validation passed)
   - Stats update in real-time when cards move

5. **AC-5: Filters**
   - Add filter controls above stats bar:
     - Portfolio Category dropdown (All, Premium Burgers, Vegan Line, etc.)
     - Priority dropdown (All, High, Medium, Low)
     - Owner dropdown (All, John Doe, Jane Smith, etc.)
   - Filtered cards update Kanban board immediately
   - Filter state persisted in URL query params

6. **AC-6: Real-Time Updates**
   - Use SWR with 60-second revalidation interval
   - Optimistic updates on drag-drop (card moves immediately, reverts on error)
   - Show loading skeleton on initial load
   - Display toast notifications for:
     - Successful gate advancement: "Project moved to {gate}"
     - Failed advancement: "Cannot advance: {error_message}"

7. **AC-7: Performance**
   - Dashboard loads in <500ms (p95) for 50 projects
   - Drag-drop animations smooth (60fps)
   - No layout shift during initial load (skeleton matches final layout)

## Tasks / Subtasks

- [ ] **Task 1: Setup NPD Route and Layout** (AC-1)
  - [ ] 1.1: Create `/npd` route group at `apps/frontend/app/(authenticated)/npd/page.tsx`
  - [ ] 1.2: Create NPD layout component with Innovation Light theme overrides
  - [ ] 1.3: Add NPD navigation item to sidebar (icon: Lightbulb, route: /npd)
  - [ ] 1.4: Implement middleware check for NPD feature flag (org_settings.enabled_modules)

- [ ] **Task 2: Install shadcn/ui Components** (AC-2, AC-6)
  - [ ] 2.1: Run `npx shadcn-ui@latest init` (if not already installed)
  - [ ] 2.2: Add shadcn components: `npx shadcn-ui@latest add card badge toast`
  - [ ] 2.3: Install react-beautiful-dnd: `pnpm add react-beautiful-dnd @types/react-beautiful-dnd`
  - [ ] 2.4: Configure Tailwind for Innovation Light theme colors

- [ ] **Task 3: Create Kanban Board Components** (AC-1, AC-2)
  - [ ] 3.1: Create `components/NPD/dashboard/KanbanBoard.tsx` with 5 columns
  - [ ] 3.2: Create `components/NPD/dashboard/KanbanColumn.tsx` with header (gate name, badge, count)
  - [ ] 3.3: Create `components/NPD/dashboard/KanbanCard.tsx` extending shadcn Card
  - [ ] 3.4: Implement card gradient backgrounds per gate (G0 red-500 → G4 green-600)
  - [ ] 3.5: Add risk indicator circle (H=red, M=yellow, L=green)
  - [ ] 3.6: Add progress badges (formulation version, compliance docs)

- [ ] **Task 4: Implement Drag-and-Drop Logic** (AC-3)
  - [ ] 4.1: Wrap KanbanBoard in DragDropContext from react-beautiful-dnd
  - [ ] 4.2: Wrap each column in Droppable component
  - [ ] 4.3: Wrap each card in Draggable component
  - [ ] 4.4: Implement onDragEnd handler with sequential gate validation
  - [ ] 4.5: Call `NPDProjectsAPI.advanceGate()` on valid drop
  - [ ] 4.6: Implement optimistic update + revert on error
  - [ ] 4.7: Add drag visual feedback (shadow, placeholder, drop zone highlight)

- [ ] **Task 5: Create Stats Bar Component** (AC-4)
  - [ ] 5.1: Create `components/NPD/dashboard/StatsBar.tsx`
  - [ ] 5.2: Calculate metrics from projects array (Active, G0, G1, G2-G3, Ready for Handoff)
  - [ ] 5.3: Display metrics as cards with icons and counts
  - [ ] 5.4: Update stats in real-time when projects change

- [ ] **Task 6: Implement Filters** (AC-5)
  - [ ] 6.1: Create `components/NPD/dashboard/FilterControls.tsx`
  - [ ] 6.2: Add Portfolio Category dropdown (populate from unique project categories)
  - [ ] 6.3: Add Priority dropdown (All, High, Medium, Low)
  - [ ] 6.4: Add Owner dropdown (populate from unique project owners)
  - [ ] 6.5: Implement filter logic (filter projects array before rendering)
  - [ ] 6.6: Persist filter state in URL query params (useSearchParams)

- [ ] **Task 7: Setup SWR Data Fetching** (AC-6)
  - [ ] 7.1: Create `hooks/useNPDProjects.ts` with SWR
  - [ ] 7.2: Configure SWR: 60s revalidation, optimistic updates enabled
  - [ ] 7.3: Implement loading skeleton (matches final Kanban layout)
  - [ ] 7.4: Implement error boundary for failed fetches
  - [ ] 7.5: Add toast notifications for gate advancement (success/error)

- [ ] **Task 8: Performance Optimization** (AC-7)
  - [ ] 8.1: Implement React.memo for KanbanCard component
  - [ ] 8.2: Add skeleton loading (no layout shift)
  - [ ] 8.3: Measure dashboard load time with Playwright Performance API
  - [ ] 8.4: Optimize re-renders (useMemo for filtered projects, useCallback for handlers)

- [ ] **Task 9: E2E Tests** (AC-3, AC-6)
  - [ ] 9.1: Create `e2e/npd-dashboard.spec.ts`
  - [ ] 9.2: Test: Dashboard loads with 5 columns
  - [ ] 9.3: Test: Drag-drop card from G0 to G1 (valid)
  - [ ] 9.4: Test: Drag-drop card from G0 to G3 (invalid, should revert)
  - [ ] 9.5: Test: Filter by portfolio category
  - [ ] 9.6: Test: Stats bar updates after gate advancement
  - [ ] 9.7: Test: Performance (<500ms load for 50 projects)

- [ ] **Task 10: Documentation Update**
  - [ ] 10.1: Run `pnpm docs:update` to regenerate API_REFERENCE.md
  - [ ] 10.2: Add screenshots to `docs/screenshots/npd-dashboard-kanban.png`
  - [ ] 10.3: Update `docs/03_APP_GUIDE.md` with NPD Dashboard section

## Dev Notes

### Learnings from Previous Story

**From Story NPD-1.2 (Stage-Gate Workflow Logic) - Status: done**

- **NPDProjectsAPI.advanceGate() Available**: Use this method for drag-drop gate advancement
  - Method: `static async advanceGate(id: string, toGate: NPDProjectGate): Promise<NPDProject>`
  - Location: `apps/frontend/lib/api/npdProjects.ts:319-395`
  - Validation: Sequential gate only (G0→G1, not G0→G3), rejects backwards movement
  - Error handling: Throws error with message "Can only advance to next sequential gate"
  - This method is PERFECT for drag-drop: just call on drop event

- **Gate Constants Defined**: Reuse these constants for Kanban columns
  - `GATE_SEQUENCE`: ['G0', 'G1', 'G2', 'G3', 'G4', 'Launched']
  - `GATE_STATUS_MAP`: Maps gates to status (G0→'idea', G1→'concept', etc.)
  - Location: `apps/frontend/lib/api/npdProjects.ts:64-74`
  - Use GATE_SEQUENCE to dynamically generate Kanban columns

- **Zod Schemas Available**: Validate gate values before API calls
  - `npdProjectGateSchema`: Validates G0/G1/G2/G3/G4/Launched
  - `advanceGateSchema`: Validates advanceGate() input
  - Location: `packages/shared/schemas.ts:60-63`

- **Testing Pattern Established**:
  - Unit tests: Mock Supabase responses, test validation logic independently
  - E2E tests: Test full user flow with real database (current story needs E2E tests)
  - Coverage: All acceptance criteria must have test coverage

- **Code Quality Standards**:
  - TypeScript strict mode: 0 errors required
  - JSDoc on all public components/hooks
  - Follow MonoPilot component patterns (static methods, Promise-based)

[Source: docs/sprint-artifacts/npd-1-2-stage-gate-workflow-logic.md#Dev-Agent-Record]
[Source: docs/sprint-artifacts/npd-1-2-stage-gate-workflow-logic.md#Learnings-from-Previous-Story]

### Architecture Patterns

**Component Structure:**
```
apps/frontend/app/(authenticated)/npd/
├── page.tsx (Dashboard - renders KanbanBoard)
└── layout.tsx (NPD module layout with theme overrides)

apps/frontend/components/NPD/dashboard/
├── KanbanBoard.tsx (DragDropContext wrapper, 5 columns)
├── KanbanColumn.tsx (Droppable, column header, project list)
├── KanbanCard.tsx (Draggable, shadcn Card, gradient background)
├── StatsBar.tsx (5 metrics cards)
└── FilterControls.tsx (3 dropdowns: category, priority, owner)
```

**Color Scheme (Innovation Light Theme):**
```typescript
// Gate colors (from UX Design)
const GATE_COLORS = {
  'G0': 'from-red-500 to-red-600',      // Idea
  'G1': 'from-orange-600 to-orange-700', // Concept
  'G2': 'from-amber-500 to-amber-600',   // Development
  'G3': 'from-lime-500 to-lime-600',     // Testing
  'G4': 'from-green-600 to-green-700',   // Launch
};

// Risk colors
const RISK_COLORS = {
  'high': 'bg-red-500',
  'medium': 'bg-yellow-500',
  'low': 'bg-green-500',
};
```

**Drag-Drop Flow:**
```typescript
const handleDragEnd = (result: DropResult) => {
  if (!result.destination) return; // Dropped outside

  const { source, destination, draggableId } = result;

  // Get project and target gate
  const project = projects.find(p => p.id === draggableId);
  const toGate = destination.droppableId; // Column ID = gate name

  // Optimistic update (move card immediately)
  mutate(optimisticallyUpdateProjects(projects, project, toGate), false);

  // Persist to backend
  NPDProjectsAPI.advanceGate(project.id, toGate)
    .then(() => {
      // Success: revalidate SWR cache
      mutate();
      toast.success(`Project moved to ${toGate}`);
    })
    .catch((error) => {
      // Error: revert optimistic update
      mutate();
      toast.error(`Cannot advance: ${error.message}`);
    });
};
```

### Project Structure Notes

**New Files Created:**
1. `apps/frontend/app/(authenticated)/npd/page.tsx` - Dashboard page
2. `apps/frontend/app/(authenticated)/npd/layout.tsx` - NPD layout with theme
3. `apps/frontend/components/NPD/dashboard/KanbanBoard.tsx` - Main board component
4. `apps/frontend/components/NPD/dashboard/KanbanColumn.tsx` - Column component
5. `apps/frontend/components/NPD/dashboard/KanbanCard.tsx` - Card component
6. `apps/frontend/components/NPD/dashboard/StatsBar.tsx` - Metrics bar
7. `apps/frontend/components/NPD/dashboard/FilterControls.tsx` - Filter dropdowns
8. `apps/frontend/hooks/useNPDProjects.ts` - SWR hook for projects
9. `apps/frontend/e2e/npd-dashboard.spec.ts` - E2E tests

**Modified Files:**
1. `apps/frontend/components/shared/Sidebar.tsx` - Add NPD nav item
2. `apps/frontend/middleware.ts` - Add NPD feature flag check
3. `tailwind.config.js` - Add Innovation Light theme colors

### Testing Standards

**E2E Tests (Playwright):**
- Test drag-drop interactions (valid/invalid gate progressions)
- Test filters (category, priority, owner)
- Test performance (<500ms load time)
- Test real-time updates (multiple browser contexts)

**Visual Regression:**
- Screenshot Kanban board (all 5 columns visible)
- Screenshot card hover states (shadow increase)
- Screenshot drag placeholder

### UX Design Reference

**From `docs/ux-design-npd-module-2025-11-16.md`:**

- **Layout**: Topbar (logo, title, "+ New Project" CTA), Stats Bar (5 metrics), Kanban Board (5 columns)
- **Card Design**:
  - Gradient background (G0 red → G4 green)
  - Header: Project ID (bold), Risk indicator (H/M/L circle)
  - Body: Project name (2 lines max), description truncated
  - Footer: Progress badges (formulation version, compliance docs count)
- **Interactions**:
  - Drag-drop: Adjacent gates only, shadow increases on drag
  - Click card: Opens Project Detail view (deferred to NPD-1.9)
  - Hover: Shadow md → xl

**Interactive Mockup**: `docs/ux-design-directions.html#direction-1`

### Security Considerations

**Feature Flag Check:**
- Middleware must verify `org_settings.enabled_modules` includes 'npd'
- Redirect to 403 if NPD module not enabled

**RLS Enforcement:**
- `NPDProjectsAPI.getAll()` respects org_id isolation via Supabase RLS
- No additional authorization needed (handled by API layer)

**RBAC (Deferred to NPD-1.7):**
- For MVP, any authenticated user can view/drag cards
- Story NPD-1.7 will add role restrictions (NPD Lead, R&D, etc.)

### Performance Notes

**Optimization Strategies:**
- React.memo on KanbanCard (prevent re-renders during drag)
- useMemo for filtered projects array
- useCallback for drag handlers
- Skeleton loading (no layout shift)
- SWR caching (60s stale time, revalidate on focus)

**Performance Targets:**
- Dashboard load: <500ms (p95) for 50 projects
- Drag-drop: 60fps animations (no janky frames)
- Filter update: <100ms (synchronous array filter)

### References

- **Epic Definition**: [Source: docs/NPD-Module-Epics.md#Story-NPD-1.3]
- **UX Design**: [Source: docs/ux-design-npd-module-2025-11-16.md#Direction-1]
- **Architecture**: [Source: docs/NPD-Module-Architecture-2025-11-15.md#Component-Library-Strategy]
- **Previous Story**: [Source: docs/sprint-artifacts/npd-1-2-stage-gate-workflow-logic.md]
- **NPDProjectsAPI**: [Source: apps/frontend/lib/api/npdProjects.ts]
- **shadcn/ui Docs**: [shadcn/ui Card](https://ui.shadcn.com/docs/components/card)
- **react-beautiful-dnd Docs**: [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)

## Dev Agent Record

### Context Reference

**Story Context XML:** `docs/sprint-artifacts/npd-1-3-npd-dashboard-kanban-board-ui.context.xml`

Generated: 2025-11-16 by create-story workflow

### Agent Model Used

(To be filled during implementation)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Created:**
(To be filled during implementation)

**Modified:**
(To be filled during implementation)

## Change Log

| Date       | Author  | Change Description           |
|------------|---------|------------------------------|
| 2025-11-16 | Claude  | Story created (drafted)      |

---

## Senior Developer Review (AI)

**Reviewer:** (To be assigned)
**Date:** (Pending implementation)
**Model:** (Pending)
**Review Type:** Systematic Validation (All ACs + All Tasks)

### Outcome: (Pending)

(To be filled after implementation)

---

### Summary

Story NPD-1.3 implements the NPD Dashboard with Kanban visualization, enabling R&D users to track NPD pipeline progress across Stage-Gate workflow. The implementation builds on NPD-1.2's advanceGate() API to provide drag-and-drop gate advancement with real-time updates.

**Key Features:**
- 5-column Kanban board (G0 → G4)
- Drag-and-drop with sequential gate validation
- Real-time stats and filters
- Innovation Light theme (premium feel)
- Performance-optimized (<500ms load for 50 projects)

**Next Story:** NPD-1.4 - Gate Checklists Management (adds gate entry criteria enforcement)
