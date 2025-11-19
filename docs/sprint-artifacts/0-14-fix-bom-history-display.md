# Story 0.14: Fix BOM History Display

**Priority:** P0 (CRITICAL - History not displaying)
**Effort:** 5 SP (10 hours)
**Epic:** Epic 0 - P0 Data Integrity Fixes

---

## Problem Statement

BOM history is saved to database but not displayed in `BomHistoryModal` due to field name mismatches:

**Saved structure (CompositeProductModal:980-985):**
```typescript
{
  bom_id: bomId,
  change_type: 'draft -> active',
  old_values: { version: '1.0', status: 'draft' },
  new_values: { version: '1.1', status: 'active', changes: {...}, description: '...' }
}
```

**Expected by BomHistoryModal:**
```typescript
entry.version        // ❌ undefined (is in new_values.version)
entry.status_from    // ❌ undefined (is in old_values.status)
entry.status_to      // ❌ undefined (is in new_values.status)
entry.changed_at     // ❌ undefined (field is created_at)
entry.description    // ❌ undefined (is in new_values.description)
entry.changes        // ❌ undefined (is in new_values.changes)
```

Result: Modal shows "No history entries found" even when history exists.

---

## User Story

**As a** production manager,
**I want** to see BOM change history when I click the History button,
**So that** I can track who changed what and when for compliance audits.

---

## Acceptance Criteria

### AC1: History Display
**Given** BOM has history entries in database
**When** user opens BomHistoryModal
**Then** history entries are displayed with:
- Version number
- Status change (from → to)
- Change timestamp
- User who made changes
- Change description

### AC2: Changes Detail View
**Given** history entry is displayed
**When** user clicks on entry to expand
**Then** modal shows detailed changes:
- BOM header field changes (old → new)
- Product field changes
- Items added/removed/modified

### AC3: Types Alignment
**Given** `BomHistory` type in `lib/types.ts`
**When** checking against actual DB structure
**Then** type matches what API returns
**And** `BomHistoryModal` uses correct field paths

### AC4: Empty State
**Given** BOM has no history entries
**When** user opens BomHistoryModal
**Then** modal shows "No history entries found"
**And** this is accurate (not due to field mismatches)

---

## Technical Implementation

### Root Cause Analysis

1. **DB Schema** (`bom_history` table):
   - `change_type` - string like "draft -> active"
   - `old_values` - JSONB with previous state
   - `new_values` - JSONB with new state including changes
   - `created_at` - timestamp

2. **BomHistoryModal expects** flat fields that don't exist

3. **Solution:** Update modal to parse JSONB fields correctly

### Files to Modify

1. **`apps/frontend/lib/types.ts`** - Update `BomHistory` interface
2. **`apps/frontend/components/BomHistoryModal.tsx`** - Fix field access

### Implementation Code

**1. Update BomHistory type (`lib/types.ts`):**

```typescript
export interface BomHistory {
  id: number;
  bom_id: number;
  change_type: string;
  changed_by?: string | null;
  created_at: string;  // NOT changed_at
  old_values?: {
    version?: string;
    status?: string;
    [key: string]: any;
  } | null;
  new_values?: {
    version?: string;
    status?: string;
    description?: string;
    changes?: {
      bom?: Record<string, { old: any; new: any }>;
      product?: Record<string, { old: any; new: any }>;
      items?: {
        added?: any[];
        removed?: any[];
        modified?: any[];
      };
    };
    [key: string]: any;
  } | null;
  // Relationships from API
  changed_by_user?: {
    id: string;
    email: string;
  };
  bom?: {
    id: number;
    product_id: number;
    version: number;
    status: string;
    products?: {
      id: number;
      part_number: string;
      description: string;
    };
  };
}
```

**2. Update BomHistoryModal to parse JSONB:**

```typescript
// In BomHistoryModal.tsx, update the mapping:

{history.map((entry) => {
  // Parse values from JSONB fields
  const version = entry.new_values?.version || entry.old_values?.version || 'N/A';
  const statusFrom = entry.old_values?.status || '';
  const statusTo = entry.new_values?.status || '';
  const description = entry.new_values?.description || '';
  const changes = entry.new_values?.changes || {};
  const timestamp = entry.created_at; // NOT changed_at

  return (
    <div
      key={entry.id}
      className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
      onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-900">
            Version {version}
          </span>
          {statusFrom && statusTo && (
            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
              {statusFrom} → {statusTo}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 flex flex-col items-end gap-1">
          <div>{new Date(timestamp).toLocaleString()}</div>
          {entry.changed_by_user?.email && (
            <div className="text-slate-600">
              by {entry.changed_by_user.email}
            </div>
          )}
        </div>
      </div>

      {description && (
        <p className="text-sm text-slate-600 mb-2">{description}</p>
      )}

      {selectedEntry?.id === entry.id && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="space-y-3">
            {/* BOM Header Changes */}
            {changes.bom && Object.keys(changes.bom).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">BOM Header Changes:</h4>
                <div className="bg-slate-50 rounded p-3 space-y-2">
                  {Object.entries(changes.bom).map(([field, change]: [string, any]) => (
                    <div key={field} className="text-sm">
                      <span className="font-medium text-slate-900">{formatFieldName(field)}:</span>{' '}
                      <span className="text-red-600">{formatValue(change.old)}</span>
                      {' → '}
                      <span className="text-green-600">{formatValue(change.new)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items Changes */}
            {changes.items && (
              <ItemsChangesSection items={changes.items} />
            )}
          </div>
        </div>
      )}
    </div>
  );
})}
```

---

## Testing Checklist

- [ ] Create BOM → save → history entry created
- [ ] Edit BOM items → history entry with items.modified
- [ ] Add new item → history entry with items.added
- [ ] Remove item → history entry with items.removed
- [ ] Change BOM status → history entry with status change
- [ ] Click History button → entries display correctly
- [ ] Click entry → changes expand with details
- [ ] User email displays correctly
- [ ] Timestamp displays in local format
- [ ] Empty BOM history shows appropriate message

---

## Definition of Done

- [ ] `BomHistory` type updated in `lib/types.ts`
- [ ] `BomHistoryModal` parses JSONB fields correctly
- [ ] History entries display with all information
- [ ] Expanded view shows detailed changes
- [ ] No TypeScript errors
- [ ] Manual test: Edit BOM → open History → see entry

---

## Architecture Reference

See: `docs/architecture.md` → **bom_history** section (lines 6744-6823)

---

## Dependencies

- Story 0.13 (BOM API GET endpoints should be done first)

## Blocked By

- Story 0.13 (need working edit to test history)

## Blocks

- All BOM-related features requiring audit trail
