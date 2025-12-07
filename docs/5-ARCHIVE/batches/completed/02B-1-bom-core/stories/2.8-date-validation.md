# Story 2.8: BOM Date Overlap Validation

Status: ready-for-dev

## Story

As a **Technical user**,
I want the system to prevent overlapping BOM dates,
So that there's always one valid BOM per product at any given time.

## Acceptance Criteria

### AC-2.8.1: Date Overlap Detection
**Given** a product has BOM v1.0 with:
- effective_from = 2025-01-01
- effective_to = 2025-12-31

**When** creating new BOM dla same product with:
- effective_from = 2025-06-01 (overlaps with v1.0!)
- effective_to = NULL

**Then** system shows error:
"Date range overlaps with BOM v1.0 (2025-01-01 to 2025-12-31)"

**And** error details include:
- Conflicting BOM version
- Conflicting date range
- Suggested resolution steps

### AC-2.8.2: Infinite Date Range Handling
**Given** existing BOM has:
- effective_from = 2025-01-01
- effective_to = NULL (infinite, no end date)

**When** creating new BOM with:
- effective_from = 2025-06-01

**Then** system shows error:
"Date range overlaps with BOM v1.0 (2025-01-01 to infinity). Please set an effective_to date on BOM v1.0 first."

**And** provides resolution options:
1. Edit BOM v1.0 to set effective_to before 2025-06-01
2. Change new BOM effective_from to after current date (auto-close existing)

### AC-2.8.3: Valid Non-Overlapping Dates
**Given** existing BOM v1.0:
- effective_from = 2025-01-01
- effective_to = 2025-06-30

**When** creating new BOM v1.1 with:
- effective_from = 2025-07-01
- effective_to = NULL

**Then** BOM created successfully (no overlap)

### AC-2.8.4: Self-Update Exception
**Given** editing existing BOM v1.0
**When** updating effective_to date
**Then** overlap check excludes self (allow updating own dates)
**And** only checks overlap with OTHER BOMs dla same product

### AC-2.8.5: Error Response Format
**When** overlap detected
**Then** API returns 400 Bad Request with body:
```json
{
  "error": "BOM_DATE_OVERLAP",
  "message": "Date range overlaps with existing BOM",
  "conflicting_bom": {
    "id": "abc-123",
    "version": "1.0",
    "effective_from": "2025-01-01",
    "effective_to": "2025-12-31"
  },
  "suggested_actions": [
    "Change effective_from to after 2025-12-31",
    "Edit BOM v1.0 to set effective_to before your new date"
  ]
}
```

### AC-2.8.6: Database Trigger Enforcement
**Given** date overlap validation implemented as database trigger
**Then** validation cannot be bypassed (enforced at DB level)
**And** trigger fires on INSERT and UPDATE
**And** trigger execution time <100ms

### AC-2.8.7: UI Error Display
**When** user submits BOM form with overlapping dates
**Then** error modal displayed with:
- Clear error message
- Conflicting BOM details (version, date range)
- Visual timeline showing overlap
- Action buttons: "Edit Dates", "Edit Existing BOM", "Cancel"

## Tasks / Subtasks

### Task 1: Database Trigger Implementation (AC: 2.8.1-2.8.4, 2.8.6)
- [ ] Create check_bom_date_overlap() function:
  ```sql
  CREATE OR REPLACE FUNCTION check_bom_date_overlap()
  RETURNS TRIGGER AS $$
  DECLARE
    v_conflicting_bom RECORD;
  BEGIN
    -- Check for overlapping dates with same product_id
    SELECT id, version, effective_from, effective_to
    INTO v_conflicting_bom
    FROM boms
    WHERE org_id = NEW.org_id
      AND product_id = NEW.product_id
      AND id != NEW.id  -- Exclude self on UPDATE (AC-2.8.4)
      AND (
        -- Case 1: NEW start date falls within existing range
        (NEW.effective_from >= effective_from AND NEW.effective_from <= COALESCE(effective_to, '9999-12-31'))
        OR
        -- Case 2: NEW end date falls within existing range
        (COALESCE(NEW.effective_to, '9999-12-31') >= effective_from AND COALESCE(NEW.effective_to, '9999-12-31') <= COALESCE(effective_to, '9999-12-31'))
        OR
        -- Case 3: NEW range encompasses existing range
        (NEW.effective_from <= effective_from AND COALESCE(NEW.effective_to, '9999-12-31') >= COALESCE(effective_to, '9999-12-31'))
        OR
        -- Case 4: Existing range encompasses NEW range
        (effective_from <= NEW.effective_from AND COALESCE(effective_to, '9999-12-31') >= COALESCE(NEW.effective_to, '9999-12-31'))
      )
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION 'BOM_DATE_OVERLAP: Date range overlaps with BOM % (% to %)',
        v_conflicting_bom.version,
        v_conflicting_bom.effective_from,
        COALESCE(v_conflicting_bom.effective_to::TEXT, 'infinity')
      USING HINT = format('conflicting_bom_id:%s', v_conflicting_bom.id);
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
- [ ] Create trigger:
  ```sql
  CREATE TRIGGER trigger_check_bom_date_overlap
    BEFORE INSERT OR UPDATE ON boms
    FOR EACH ROW
    EXECUTE FUNCTION check_bom_date_overlap();
  ```
- [ ] Add index dla performance:
  ```sql
  CREATE INDEX idx_boms_date_overlap_check
    ON boms(org_id, product_id, effective_from, effective_to);
  ```
- [ ] Run migration and verify trigger fires

### Task 2: API Error Handling (AC: 2.8.5)
- [ ] Create lib/errors/bom-errors.ts:
  ```typescript
  export class BOMDateOverlapError extends Error {
    constructor(
      public conflictingBOM: {
        id: string
        version: string
        effective_from: Date
        effective_to: Date | null
      }
    ) {
      super('BOM date range overlaps with existing BOM')
      this.name = 'BOMDateOverlapError'
    }

    toJSON() {
      return {
        error: 'BOM_DATE_OVERLAP',
        message: this.message,
        conflicting_bom: this.conflictingBOM,
        suggested_actions: [
          `Change effective_from to after ${this.conflictingBOM.effective_to || 'current date'}`,
          `Edit BOM ${this.conflictingBOM.version} to set effective_to before your new date`
        ]
      }
    }
  }
  ```
- [ ] Update POST /api/technical/boms endpoint:
  ```typescript
  try {
    await supabase.from('boms').insert(bomData)
  } catch (error) {
    if (error.message?.includes('BOM_DATE_OVERLAP')) {
      // Parse conflicting_bom_id from HINT
      const conflictingBomId = parseHint(error.hint)
      const conflictingBOM = await fetchBOM(conflictingBomId)

      throw new BOMDateOverlapError(conflictingBOM)
    }
    throw error
  }
  ```
- [ ] API response handler returns 400 with formatted error

### Task 3: Frontend Error Display (AC: 2.8.7)
- [ ] Create components/technical/BOMDateOverlapModal.tsx
- [ ] Display error modal with:
  - [ ] Title: "Date Range Conflict"
  - [ ] Message: Clear explanation of overlap
  - [ ] Conflicting BOM card:
    - [ ] Version badge
    - [ ] Date range (from - to)
    - [ ] "View BOM" link
  - [ ] Visual timeline showing overlap:
    ```typescript
    // Timeline bars:
    // [====== Existing BOM v1.0 ======]
    //            [==== New BOM v1.1 ====]  ← OVERLAP!
    ```
  - [ ] Suggested actions (buttons):
    - [ ] "Edit My Dates" (go back to form)
    - [ ] "Edit BOM v1.0" (navigate to existing BOM edit)
    - [ ] "Cancel" (close modal)
- [ ] Use shadcn/ui Dialog, Alert components

### Task 4: Visual Timeline Conflict Indicator (AC: 2.8.7)
- [ ] In BOMForm, add date range preview:
  ```typescript
  // When user enters dates, fetch existing BOMs
  const existingBOMs = await fetchBOMsForProduct(productId)

  // Check client-side for potential overlap (preview)
  const potentialConflict = checkDateOverlap(newDates, existingBOMs)

  // Show warning before submit (not blocking, just FYI)
  if (potentialConflict) {
    <Alert variant="warning">
      Your dates may overlap with {potentialConflict.version}.
      Please verify before submitting.
    </Alert>
  }
  ```
- [ ] Timeline visualization (mini version in form):
  - [ ] Horizontal bars representing existing BOMs
  - [ ] New BOM dates overlaid (dashed line)
  - [ ] Red highlight if overlap detected

### Task 5: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] Date overlap logic (all 4 cases: start overlap, end overlap, encompasses, encompassed)
  - [ ] Infinite date range (NULL effective_to) handling
  - [ ] Self-update exception (exclude own ID)
- [ ] Integration tests (lib/api/__tests__/bom-date-validation.test.ts):
  - [ ] Test Case 1: Create BOM v1.0 (2025-01-01 to 2025-12-31) → Success
  - [ ] Test Case 2: Create BOM v1.1 (2025-06-01 to NULL) → Error (overlaps v1.0)
  - [ ] Test Case 3: Create BOM v1.1 (2026-01-01 to NULL) → Success (no overlap)
  - [ ] Test Case 4: Update BOM v1.0 effective_to to 2025-06-30 → Success (self-update)
  - [ ] Test Case 5: Infinite range conflict → Error with correct message
  - [ ] Test Case 6: Trigger execution time <100ms (performance test)
- [ ] E2E tests (__tests__/e2e/bom-date-validation.spec.ts):
  - [ ] Create BOM with dates
  - [ ] Attempt to create overlapping BOM → error modal shown
  - [ ] Click "Edit My Dates" → return to form with error highlighted
  - [ ] Fix dates → submit → success
  - [ ] Verify timeline preview shows conflict before submit

### Task 6: Error Recovery Flow (AC: 2.8.2, 2.8.7)
- [ ] Implement "Edit Existing BOM" action:
  - [ ] From error modal, click "Edit BOM v1.0"
  - [ ] Open existing BOM in edit mode (new tab or inline)
  - [ ] Pre-select effective_to field (suggest user to set end date)
  - [ ] After updating existing BOM → suggest retry creating new BOM
- [ ] Implement "Edit My Dates" action:
  - [ ] Close error modal
  - [ ] Return to BOM form
  - [ ] Highlight effective_from / effective_to fields with error state
  - [ ] Show suggested date range (e.g., "Try after 2025-12-31")

### Task 7: Documentation & Cleanup
- [ ] Update API documentation with BOM_DATE_OVERLAP error
- [ ] Add trigger documentation to schema docs
- [ ] Update BOM form help text:
  "Effective dates cannot overlap with existing BOMs dla this product."

## Dev Notes

### Technical Stack
- **Database**: PostgreSQL trigger (BEFORE INSERT OR UPDATE)
- **Frontend**: React error boundaries, shadcn/ui Alert/Dialog
- **Validation**: Database-enforced (cannot bypass)

### Key Technical Decisions
1. **Database Trigger**: Validation at DB level ensures no bypass (not just API validation)
2. **Trigger Performance**: Indexed query, target <100ms execution
3. **Error Format**: Structured JSON with conflicting_bom details + suggested_actions
4. **Self-Update Exception**: Trigger excludes own ID on UPDATE (allow editing dates)
5. **Infinite Range**: NULL effective_to treated as '9999-12-31' dla comparison

### Overlap Detection Algorithm
```typescript
// Four cases of date range overlap:
// Case 1: NEW.start within EXISTING.range
// Case 2: NEW.end within EXISTING.range
// Case 3: NEW encompasses EXISTING (NEW.start <= EXISTING.start AND NEW.end >= EXISTING.end)
// Case 4: EXISTING encompasses NEW (EXISTING.start <= NEW.start AND EXISTING.end >= NEW.end)

// Infinite ranges: NULL effective_to → treat as far future date ('9999-12-31')
```

### Security Considerations
- **Database Trigger**: Cannot be bypassed (even with direct SQL)
- **Error Messages**: Do not expose sensitive data (only BOM version/dates)
- **RLS Policy**: Overlap check only within same org_id

### Project Structure
```
supabase/
  migrations/
    20XX_add_bom_date_overlap_trigger.sql

lib/
  errors/
    bom-errors.ts                 # BOMDateOverlapError class

components/
  technical/
    BOMDateOverlapModal.tsx       # Error display modal
    BOMDateRangePreview.tsx       # Timeline preview in form

app/
  api/
    technical/
      boms/
        route.ts                  # Enhanced error handling
```

### Testing Strategy
**Unit Tests**: Overlap detection logic (4 cases), infinite range handling
**Integration Tests**: Trigger fires on INSERT/UPDATE, performance <100ms
**E2E Tests**: Complete error recovery flow (fix dates, retry submit)

### References
- [Source: docs/epics/epic-2-technical.md#Story-2.8]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#Date-Overlap-Validation-Trigger]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#Workflow-2]

### Prerequisites
**Story 2.6**: BOMs table with effective_from/effective_to columns

### Dependencies
**None** - Database trigger, no external libraries

## Dev Agent Record
<!-- Will be filled during implementation -->

## Change Log
- 2025-01-23: Story drafted by Claude Code
