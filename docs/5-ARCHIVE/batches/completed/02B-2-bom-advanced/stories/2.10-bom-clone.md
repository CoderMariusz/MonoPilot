# Story 2.10: BOM Clone

Status: ready-for-dev

## Story

As a **Technical user**,
I want to clone an existing BOM,
So that I can create new versions quickly.

## Acceptance Criteria

### AC-2.10.1: Clone Button Visibility
**Given** a BOM exists
**When** viewing BOM Detail page /technical/boms/:id
**Then** "Clone" button visible in page header actions

**And** button labeled "Clone BOM" with duplicate icon
**And** button positioned next to Edit, Delete buttons

### AC-2.10.2: Clone Dialog
**When** clicking "Clone" button
**Then** dialog opens with title "Clone BOM v{version}"

**And** dialog shows:
- Current BOM summary (version, date range, items count)
- Form fields:
  - new_effective_from (date picker, required)
  - new_effective_to (date picker, optional)
  - notes (textarea, optional, pre-filled from source)
- Info message: "All {X} items will be copied to the new BOM"
- Note: "New version will be {calculated_version}"

### AC-2.10.3: Version Auto-Increment Calculation
**Given** cloning BOM v1.0
**Then** new version calculated as:
- v1.0 → v1.1
- v1.9 → v2.0 (rollover)
- v2.5 → v2.6

**And** version preview shown in dialog
**And** version conflicts checked before submit

### AC-2.10.4: Clone Operation Success
**When** submitting clone form with valid dates
**Then** new BOM created with:
- Same product_id
- New version (auto-incremented)
- New effective_from / effective_to (from form)
- Status = Draft (always starts as Draft)
- All items copied:
  - Same product_id (components)
  - Same quantity, scrap_percent, sequence
  - Same consume_whole_lp, is_by_product, yield_percent
  - Same condition_flags, condition_logic
  - Same notes
- created_by = current user
- created_at = now

**And** success toast: "BOM v{new_version} created successfully"
**And** navigate to new BOM Detail page

### AC-2.10.5: Clone with Date Validation
**Given** cloning BOM v1.0
**When** entering new_effective_from that overlaps with existing BOM
**Then** date overlap validation triggers (Story 2.8)
**And** error shown: "Date range overlaps with BOM v{X}"

**And** user can fix dates without losing clone dialog state

### AC-2.10.6: Clone Item Count Verification
**Given** source BOM has 12 items
**When** clone operation completes
**Then** new BOM also has 12 items (exact copy)

**And** sequence numbers preserved (1-12)
**And** effective_qty calculated correctly dla each item

### AC-2.10.7: Audit Trail
**When** BOM cloned
**Then** audit trail entry created:
- Action: "BOM v{new_version} cloned from v{source_version}"
- User: current user
- Timestamp: now

## Tasks / Subtasks

### Task 1: API Endpoint dla Clone (AC: 2.10.3-2.10.6)
- [ ] Implement POST /api/technical/boms/:id/clone
  - [ ] Body: CloneBOMInput
    ```typescript
    interface CloneBOMInput {
      effective_from: Date
      effective_to?: Date
      notes?: string
    }
    ```
  - [ ] Process:
    1. Fetch source BOM by id (with org_id check)
    2. Validate user has Technical role
    3. Calculate new version:
       ```typescript
       const maxVersion = await getMaxVersion(orgId, productId)
       const newVersion = incrementVersion(maxVersion)
       ```
    4. Validate new dates (date overlap check)
    5. Begin transaction:
       a. Insert new BOM record:
          ```sql
          INSERT INTO boms (
            org_id, product_id, version, effective_from, effective_to,
            status, output_qty, output_uom, notes,
            created_by, updated_by
          )
          SELECT
            org_id, product_id, :new_version, :new_effective_from, :new_effective_to,
            'draft', output_qty, output_uom, :notes,
            :current_user_id, :current_user_id
          FROM boms WHERE id = :source_bom_id
          RETURNING id
          ```
       b. Clone all bom_items:
          ```sql
          INSERT INTO bom_items (
            bom_id, product_id, quantity, uom, scrap_percent, sequence,
            consume_whole_lp, is_by_product, yield_percent,
            condition_flags, condition_logic, notes
          )
          SELECT
            :new_bom_id, product_id, quantity, uom, scrap_percent, sequence,
            consume_whole_lp, is_by_product, yield_percent,
            condition_flags, condition_logic, notes
          FROM bom_items WHERE bom_id = :source_bom_id
          ORDER BY sequence
          ```
    6. Commit transaction
    7. Invalidate BOM cache dla product
  - [ ] Response: New BOM object (with items_count)
  - [ ] Error handling: rollback on failure, return clear error
- [ ] Add to lib/api/BOMService.ts:
  ```typescript
  export async function cloneBOM(
    bomId: string,
    input: CloneBOMInput
  ): Promise<BOM>
  ```

### Task 2: Version Increment Logic (AC: 2.10.3)
- [ ] Create lib/utils/bom-version.ts:
  ```typescript
  export function incrementVersion(version: string): string {
    const [major, minor] = version.split('.').map(Number)

    if (minor >= 9) {
      // Rollover: 1.9 → 2.0
      return `${major + 1}.0`
    } else {
      // Normal increment: 1.0 → 1.1
      return `${major}.${minor + 1}`
    }
  }

  export function parseVersion(version: string): { major: number, minor: number } {
    const [major, minor] = version.split('.').map(Number)
    return { major, minor }
  }
  ```
- [ ] Unit tests dla all cases:
  - [ ] "1.0" → "1.1"
  - [ ] "1.9" → "2.0"
  - [ ] "2.5" → "2.6"

### Task 3: Clone Dialog Component (AC: 2.10.1-2.10.2)
- [ ] Create components/technical/CloneBOMDialog.tsx
- [ ] Props:
  ```typescript
  interface CloneBOMDialogProps {
    bom: BOM
    isOpen: boolean
    onClose: () => void
    onSuccess: (newBOM: BOM) => void
  }
  ```
- [ ] Dialog content:
  - [ ] Title: "Clone BOM v{bom.version}"
  - [ ] Source BOM summary card:
    - [ ] Version badge
    - [ ] Date range
    - [ ] Items count: "{items_count} items will be copied"
    - [ ] Status
  - [ ] Form (react-hook-form + Zod):
    - [ ] new_effective_from (date picker, required)
    - [ ] new_effective_to (date picker, optional)
    - [ ] notes (textarea, pre-filled from source, optional)
  - [ ] Version preview:
    - [ ] Fetch max version dla product (on dialog open)
    - [ ] Calculate new version using incrementVersion()
    - [ ] Show: "New version will be v{calculated_version}"
  - [ ] Info alert:
    - [ ] Icon: InfoIcon
    - [ ] Message: "All items will be copied with their quantities, scrap %, and conditions. The new BOM will start in Draft status."
  - [ ] Action buttons:
    - [ ] Cancel (ghost)
    - [ ] Clone (primary, submit form)

### Task 4: Form Validation (AC: 2.10.5)
- [ ] Zod schema:
  ```typescript
  const CloneBOMSchema = z.object({
    effective_from: z.string().datetime('Invalid date'),
    effective_to: z.string().datetime().optional()
      .refine((val, ctx) => {
        if (val && ctx.parent.effective_from) {
          return new Date(val) > new Date(ctx.parent.effective_from)
        }
        return true
      }, 'effective_to must be after effective_from'),
    notes: z.string().optional()
  })
  ```
- [ ] Client-side date overlap check (optional, preview warning):
  ```typescript
  // Before submit, check potential overlap
  const existingBOMs = await fetchBOMsForProduct(bom.product_id)
  const potentialConflict = checkDateOverlap(newDates, existingBOMs)

  if (potentialConflict) {
    setWarning(`Potential overlap with ${potentialConflict.version}`)
  }
  ```
- [ ] Server-side date overlap validation (Story 2.8 trigger)

### Task 5: Clone Button in BOM Detail Page (AC: 2.10.1)
- [ ] Update /app/technical/boms/[id]/page.tsx
- [ ] Add "Clone" button to header actions:
  ```typescript
  <div className="flex gap-2">
    <Button variant="outline" onClick={handleEdit}>
      <EditIcon /> Edit
    </Button>
    <Button variant="outline" onClick={handleClone}>
      <CopyIcon /> Clone
    </Button>
    <Button variant="destructive" onClick={handleDelete}>
      <TrashIcon /> Delete
    </Button>
  </div>
  ```
- [ ] State dla dialog:
  ```typescript
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)

  const handleClone = () => setCloneDialogOpen(true)

  const handleCloneSuccess = (newBOM: BOM) => {
    setCloneDialogOpen(false)
    toast.success(`BOM ${newBOM.version} created successfully`)
    router.push(`/technical/boms/${newBOM.id}`)
  }
  ```

### Task 6: Transaction Safety (AC: 2.10.4, 2.10.6)
- [ ] Ensure atomic transaction dla clone:
  ```typescript
  const { data, error } = await supabase.rpc('clone_bom', {
    p_source_bom_id: bomId,
    p_new_version: newVersion,
    p_new_effective_from: effectiveFrom,
    p_new_effective_to: effectiveTo,
    p_notes: notes,
    p_current_user_id: userId
  })
  ```
- [ ] Alternative: Use Supabase transactions (if RPC not used):
  ```typescript
  const { data: newBOM, error: bomError } = await supabase
    .from('boms')
    .insert({ ... })
    .select()
    .single()

  if (bomError) throw bomError

  const { error: itemsError } = await supabase
    .from('bom_items')
    .insert(clonedItems)

  if (itemsError) {
    // Rollback: delete BOM
    await supabase.from('boms').delete().eq('id', newBOM.id)
    throw itemsError
  }
  ```
- [ ] Verify items count matches source (test assertion)

### Task 7: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] incrementVersion function (all cases)
  - [ ] CloneBOMSchema validation
- [ ] Integration tests (lib/api/__tests__/bom-clone.test.ts):
  - [ ] POST /api/technical/boms/:id/clone → new BOM created
  - [ ] New BOM has incremented version (1.0 → 1.1)
  - [ ] All items copied (verify count matches)
  - [ ] New BOM status = Draft
  - [ ] Transaction rollback on error (e.g., date overlap)
  - [ ] Clone preserves: quantity, scrap%, sequence, conditions
- [ ] E2E tests (__tests__/e2e/bom-clone.spec.ts):
  - [ ] Navigate to BOM detail page
  - [ ] Click "Clone" button
  - [ ] Dialog opens with source BOM summary
  - [ ] Enter valid dates
  - [ ] Verify version preview shows v1.1
  - [ ] Submit form → success toast
  - [ ] Navigate to new BOM detail page
  - [ ] Verify items count matches source (12 items)
  - [ ] Verify item details preserved (qty, scrap%, etc.)

### Task 8: Documentation & Cleanup
- [ ] Update API documentation (clone endpoint)
- [ ] Add JSDoc comments to incrementVersion function
- [ ] Update BOM CRUD flow documentation

## Dev Notes

### Technical Stack
- **Transaction**: Supabase RPC or manual rollback
- **Validation**: Date overlap trigger (Story 2.8)
- **UI**: shadcn/ui Dialog, Form components

### Key Technical Decisions
1. **Version Increment**: Auto-calculated (X.Y format, rollover at 9)
2. **Transaction Safety**: Atomic clone (BOM + items) or rollback on failure
3. **Status**: New BOM always starts as Draft (user activates manually)
4. **Sequence Preservation**: Clone preserves original sequence (1-12 → 1-12)

### Transaction Flow
```typescript
BEGIN TRANSACTION
  1. INSERT new BOM record (status = Draft, new version)
  2. INSERT all bom_items (copy from source, new bom_id)
  3. COMMIT
ON ERROR
  ROLLBACK
  Return error to client
```

### Security Considerations
- **RLS Policy**: Enforce org_id isolation
- **Role Check**: Technical role required dla clone
- **Validation**: Date overlap trigger enforced at DB level

### Project Structure
```
app/
  technical/
    boms/
      [id]/
        page.tsx                  # BOM detail with Clone button

components/
  technical/
    CloneBOMDialog.tsx            # Clone dialog component

lib/
  utils/
    bom-version.ts                # Version increment logic

app/
  api/
    technical/
      boms/
        [id]/
          clone/
            route.ts              # POST /api/technical/boms/:id/clone
```

### Testing Strategy
**Unit Tests**: Version increment logic
**Integration Tests**: Clone API endpoint, transaction safety
**E2E Tests**: Complete clone flow (dialog, submit, verify items)

### References
- [Source: docs/epics/epic-2-technical.md#Story-2.10]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#Workflow-3]

### Prerequisites
**Story 2.6**: BOMs CRUD
**Story 2.7**: BOM Items Management
**Story 2.8**: Date Overlap Validation (integrated)

### Dependencies
**None** - Uses existing BOM/items tables

## Dev Agent Record
<!-- Will be filled during implementation -->

## Change Log
- 2025-01-23: Story drafted by Claude Code
