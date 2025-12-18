# SET-013: Warehouse Create/Edit Modal

**Module**: Settings
**Feature**: Warehouse Management (Story 1.13)
**Type**: Modal Dialog
**Status**: Approved (Auto-approve mode)
**Last Updated**: 2025-12-15
**Related FRs**: FR-SET-040, FR-SET-041, FR-SET-045

---

## ASCII Wireframe

### Success State (Create/Edit)

```
┌───────────────────────────────────────────┐
│  Create Warehouse                  [X]    │
├───────────────────────────────────────────┤
│                                           │
│  Code *                                   │
│  [____________]  (2-20 chars, uppercase)  │
│                                           │
│  Name *                                   │
│  [_____________________________]          │
│                                           │
│  Type *                                   │
│  [Select type ▼]                          │
│    - General                              │
│    - Raw Materials                        │
│    - WIP                                  │
│    - Finished Goods                       │
│    - Quarantine                           │
│                                           │
│  Address                                  │
│  [_____________________________]          │
│  [_____________________________]          │
│  [_____________________________]          │
│                                           │
│  Contact Email                            │
│  [_____________________________]          │
│                                           │
│  Contact Phone                            │
│  [_____________________________]          │
│                                           │
│  ☑ Active                                 │
│                                           │
├───────────────────────────────────────────┤
│  [Cancel]              [Create Warehouse] │
└───────────────────────────────────────────┘
```

---

## Key Components

- **Code**: Text input, 2-20 chars, auto-uppercase, unique per org, required
- **Name**: Text input, 2-100 chars, required
- **Type**: Dropdown (5 options), required, default "General"
- **Address**: Multi-line text (3 lines), optional, max 500 chars
- **Contact Email**: Email input, optional, valid email format (FR-SET-045)
- **Contact Phone**: Text input, optional, max 20 chars (FR-SET-045)
- **Active**: Checkbox, default ON

---

## Main Actions

- **Create**: Validates code uniqueness, saves warehouse, closes modal, shows toast
- **Edit**: Updates warehouse, preserves code if LPs exist, shows toast
- **Cancel/[X]**: Closes without saving

---

## 4 States

- **Loading**: Spinner + "Creating warehouse..." while POST /api/settings/warehouses runs
- **Empty**: N/A (modal triggered by button click)
- **Error**: Red banner + inline errors (code exists, invalid format, missing required fields, invalid email)
- **Success**: Form fields populated (edit) or blank (create), ready for input

---

## Warehouse Types (Reference)

| Type | Purpose | Default For |
|------|---------|-------------|
| General | Multi-purpose storage | Small orgs |
| Raw Materials | Ingredients, packaging | PO receiving |
| WIP | Work-in-progress | Production output |
| Finished Goods | Completed products | Sales orders |
| Quarantine | QA hold inventory | Quality failures |

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Code | Required, 2-20 chars, uppercase, unique per org, immutable if LPs exist |
| Name | Required, 2-100 chars |
| Type | Required, one of 5 types |
| Address | Optional, 0-500 chars |
| Contact Email | Optional, valid email format (RFC 5322) |
| Contact Phone | Optional, 0-20 chars |
| Active | Boolean, default true |

**Validation Timing**: On blur (code uniqueness, email format), on submit (all fields)

---

## Accessibility

- **Touch Targets**: All inputs >= 48x48dp
- **Contrast**: WCAG AA (4.5:1)
- **Keyboard**: Tab, Enter submit, Escape closes
- **Focus**: Code field auto-focused on open
- **Screen Reader**: Announces "Create Warehouse Modal", field labels, errors
- **Error Announcements**: Screen reader announces validation errors on blur and submit

---

## Technical Notes

### API Endpoints
- **Create**: `POST /api/settings/warehouses`
- **Update**: `PATCH /api/settings/warehouses/:id`
- **Validation**: `GET /api/settings/warehouses/validate-code?code={code}`

### Data Structure
```typescript
{
  code: string;        // 2-20 chars, uppercase, unique per org
  name: string;        // 2-100 chars
  type: 'GENERAL' | 'RAW_MATERIALS' | 'WIP' | 'FINISHED_GOODS' | 'QUARANTINE';
  address: string;     // optional, max 500 chars
  contact_email?: string;  // optional, valid email (FR-SET-045)
  contact_phone?: string;  // optional, max 20 chars (FR-SET-045)
  active: boolean;     // default true
  org_id: string;      // auto-populated
}
```

### Database Fields (Supabase)
```sql
-- Added columns for FR-SET-045 compliance
ALTER TABLE warehouses ADD COLUMN contact_email TEXT;
ALTER TABLE warehouses ADD COLUMN contact_phone TEXT;

-- Updated code constraint
ALTER TABLE warehouses ALTER COLUMN code SET CONSTRAINT code_length_check
  CHECK (char_length(code) >= 2 AND char_length(code) <= 20);
```

---

## Related Screens

- **Warehouse List**: [SET-012-warehouse-list.md] (parent screen)

---

## Handoff Notes

1. ShadCN Dialog component for modal
2. Zod schema: `lib/validation/warehouse-schema.ts` - UPDATE with contact fields
3. Service: `lib/services/warehouse-service.ts` - UPDATE create/update methods
4. Code uniqueness: debounce 500ms on blur
5. Code immutable if warehouse has LPs (show warning in edit mode)
6. Type tooltips: explain business rules per type
7. Email validation: client-side with regex, server-side RFC 5322 validation
8. Phone validation: client-side length check, server-side normalization
9. Database: Run migration to add contact_email and contact_phone columns
10. Compliance: FR-SET-040 (warehouse CRUD), FR-SET-045 (address & contact)

---

## Changes from Previous Version

**Fixed Issues:**
- Added Contact Email field (optional, FR-SET-045)
- Added Contact Phone field (optional, FR-SET-045)
- Updated Code validation from "4 chars" to "2-20 chars" (match PRD flexibility)
- Updated data structure with new optional contact fields
- Added database migration note for new columns
- Updated validation rules table
- Added email format error handling

---

**Approval Status**: Auto-approved
**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 1 of 3 (data gap fixes applied)
