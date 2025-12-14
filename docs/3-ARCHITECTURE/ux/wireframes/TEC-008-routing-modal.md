# TEC-008: Routing Create/Edit Modal

**Module**: Technical
**Feature**: Routing Management (Story 2.24 - Routing Restructure)
**Type**: Modal (Create/Edit Form)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-14

---

## Overview

Modal dialog for creating new routings or editing existing ones. Captures routing header information including code, name, description, status, reusability flag, and cost configuration (Phase 2C-2). Operations (production steps) are managed separately in the detail view after routing creation, as they require sequence management and more complex UI.

**Business Context:**
- Routings are templates of production steps that can be reusable or product-specific
- Code is unique identifier (e.g., RTG-BREAD-01, RTG-COOKIES-05)
- Reusable routings can be assigned to multiple products via BOM.routing_id
- Non-reusable routings are product-specific (1:1 relationship)
- Operations added after creation (sequence: 1, 2, 3...)
- Can be marked inactive to prevent use in new BOMs
- Cost fields (setup, working, overhead) for Phase 2C-2 costing (ADR-009)

**Modal Behavior:**
- Opens from TEC-007 list page ([+ Add Routing] button)
- Simple form with core fields + optional cost configuration
- Closes on success, navigates to detail view for operation setup
- Shows "Unsaved changes" warning if dirty on close

---

## ASCII Wireframe

### Success State (Create Mode)

```
┌───────────────────────────────────────────────────────────────────┐
│  Create Routing                                                [X]│
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Routing Code *                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ RTG-BREAD-01                                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Unique identifier (uppercase alphanumeric + hyphens)             │
│                                                                   │
│  Routing Name *                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ e.g., Standard Bread Line                                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Descriptive name for this production workflow                    │
│                                                                   │
│  Description                                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Optional description of the routing process...              │ │
│  │                                                             │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Describe the production steps or purpose (optional)              │
│                                                                   │
│  Status *                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Active ▼                                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Active routings can be assigned to BOMs                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ☑ Reusable Routing                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  If checked, this routing can be assigned to multiple products    │
│                                                                   │
│  Cost Configuration (Optional)       [ℹ️ Cost fields for Phase 2C-2]│
│  ────────────────────────────────────────────                     │
│                                                                   │
│  Setup Cost *                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 0.00                                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Fixed cost per routing run (e.g., machine setup)   [PLN]         │
│                                                                   │
│  Working Cost per Unit *                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 0.00                                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Variable cost per output unit (e.g., energy, consumables) [PLN]  │
│                                                                   │
│  Overhead Percentage                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 0.00                                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Factory overhead percentage (0-100%)                             │
│                                                                   │
│  Currency                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ PLN ▼                                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Currency for all cost fields (PLN, EUR, USD, GBP)                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ℹ Note: You'll add production operations (steps) after     │ │
│  │  creating the routing.                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Cancel]                                      [Create Routing]   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Success State (Edit Mode)

```
┌───────────────────────────────────────────────────────────────────┐
│  Edit Routing - RTG-BREAD-01                         Version: v2 [X]│
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Routing Code *                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ RTG-BREAD-01                                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Unique identifier (uppercase alphanumeric + hyphens)             │
│                                                                   │
│  Routing Name *                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Standard Bread Line                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Descriptive name for this production workflow                    │
│                                                                   │
│  Description                                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Mixing → Proofing → Baking → Cooling workflow for standard │ │
│  │ bread products. Used across multiple bread SKUs.            │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Describe the production steps or purpose (optional)              │
│                                                                   │
│  Status *                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Active ▼                                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Active routings can be assigned to BOMs                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ☑ Reusable Routing                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  If checked, this routing can be assigned to multiple products    │
│                                                                   │
│  Cost Configuration (Optional)       [ℹ️ Cost fields for Phase 2C-2]│
│  ────────────────────────────────────────────                     │
│                                                                   │
│  Setup Cost *                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 50.00                                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Fixed cost per routing run (e.g., machine setup)   [PLN]         │
│                                                                   │
│  Working Cost per Unit *                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 0.25                                                        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Variable cost per output unit (e.g., energy, consumables) [PLN]  │
│                                                                   │
│  Overhead Percentage                                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 15.00                                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Factory overhead percentage (0-100%)                             │
│                                                                   │
│  Currency                                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ PLN ▼                                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  Currency for all cost fields (PLN, EUR, USD, GBP)                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ⚠ Warning: This routing is used by 3 BOM(s). Marking it   │ │
│  │  inactive will prevent assignment to new BOMs but won't    │ │
│  │  affect existing ones.                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Cancel]                                        [Save Changes]   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌───────────────────────────────────────────────────────────────────┐
│  Create Routing                                                [X]│
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│                         [Spinner]                                 │
│                                                                   │
│                    Creating routing...                            │
│                                                                   │
│                 Please wait a moment.                             │
│                                                                   │
│  [Disabled form fields shown as skeleton]                         │
│                                                                   │
│                                                                   │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Cancel (disabled)]                     [Create Routing (disabled)]│
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌───────────────────────────────────────────────────────────────────┐
│  Create Routing                                                [X]│
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ❌ Failed to Create Routing                                │ │
│  │                                                             │ │
│  │  Error: Code "RTG-BREAD-01" already exists in your         │ │
│  │  organization.                                             │ │
│  │                                                             │ │
│  │  Please choose a different code.                           │ │
│  │                                                             │ │
│  │  [Dismiss]                                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  Routing Code * [Error highlighted in red]                        │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ RTG-BREAD-01                                                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│  ⚠ Code already exists                                           │
│                                                                   │
│  [Rest of form...]                                                │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Cancel]                                      [Create Routing]   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Empty State

```
(Not applicable - modal always shows form)
```

---

## Key Components

### 1. Modal Header
- **Create Mode**: "Create Routing"
- **Edit Mode**: "Edit Routing - {code}" with "Version: v{N}" display
- **Close Button**: [X] (top-right)
  - Shows "Unsaved changes" warning if form dirty

### 2. Form Fields

#### Routing Code (Required)
- **Type**: Text input
- **Label**: "Routing Code *"
- **Placeholder**: "RTG-BREAD-01"
- **Format**: Auto-uppercase on input
- **Max Length**: 50 characters
- **Min Length**: 2 characters
- **Validation**:
  - Required
  - Must be unique within organization
  - Regex: `^[A-Z0-9-]+$` (uppercase alphanumeric + hyphens only)
- **Help Text**: "Unique identifier (uppercase alphanumeric + hyphens)"
- **Examples**:
  - "RTG-BREAD-01"
  - "RTG-COOKIES-05"
  - "RTG-SAUCE-BLEND"
  - "RTG-PASTRY-CROISSANT"
- **Error Messages**:
  - "Code already exists" (409 Conflict)
  - "Code must be 2-50 characters"
  - "Code can only contain uppercase letters, numbers, and hyphens"

#### Routing Name (Required)
- **Type**: Text input
- **Label**: "Routing Name *"
- **Placeholder**: "e.g., Standard Bread Line"
- **Max Length**: 100 characters
- **Validation**:
  - Required
  - Min 3 characters
- **Help Text**: "Descriptive name for this production workflow"
- **Examples**:
  - "Standard Bread Line"
  - "Cake Production"
  - "Sauce Blending & Pasteurization"
  - "Pastry Line - Croissants"

#### Description (Optional)
- **Type**: Textarea
- **Label**: "Description"
- **Placeholder**: "Optional description of the routing process..."
- **Max Length**: 500 characters
- **Rows**: 3
- **Help Text**: "Describe the production steps or purpose (optional)"
- **Examples**:
  - "Mixing → Proofing → Baking → Cooling workflow for standard bread products"
  - "Basic cake workflow with mixing, baking, and decorating stages"

#### Status (Required)
- **Type**: Dropdown (Select)
- **Label**: "Status *"
- **Options**:
  - "Active" (default)
  - "Inactive"
- **Help Text**: "Active routings can be assigned to BOMs"
- **Edit Mode Warning** (if changing to Inactive and routing is used):
  - "⚠ Warning: This routing is used by X BOM(s). Marking it inactive will prevent assignment to new BOMs but won't affect existing ones."

#### Is Reusable (Checkbox)
- **Type**: Checkbox
- **Label**: "Reusable Routing"
- **Default**: Checked (true)
- **Help Text**: "If checked, this routing can be assigned to multiple products"
- **Business Logic**:
  - Reusable = true: Routing can be shared across multiple BOMs/products
  - Reusable = false: Routing is product-specific (1:1 relationship)

### 3. Cost Configuration Section (ADR-009)

**Section Header**: "Cost Configuration (Optional)" with info icon tooltip: "Cost fields for Phase 2C-2"

#### Setup Cost (Optional)
- **Type**: Decimal input (2 decimal places)
- **Label**: "Setup Cost *"
- **Placeholder**: "0.00"
- **Default**: 0.00
- **Validation**: >= 0, DECIMAL(10,2)
- **Help Text**: "Fixed cost per routing run (e.g., machine setup)"
- **Display**: "[PLN]" suffix (from currency field)

#### Working Cost per Unit (Optional)
- **Type**: Decimal input (4 decimal places)
- **Label**: "Working Cost per Unit *"
- **Placeholder**: "0.00"
- **Default**: 0.00
- **Validation**: >= 0, DECIMAL(10,4)
- **Help Text**: "Variable cost per output unit (e.g., energy, consumables)"
- **Display**: "[PLN]" suffix (from currency field)

#### Overhead Percentage (Optional)
- **Type**: Decimal input (2 decimal places)
- **Label**: "Overhead Percentage"
- **Placeholder**: "0.00"
- **Default**: 0.00
- **Validation**: 0-100, DECIMAL(5,2)
- **Help Text**: "Factory overhead percentage (0-100%)"

#### Currency (Optional)
- **Type**: Dropdown (Select)
- **Label**: "Currency"
- **Options**: PLN, EUR, USD, GBP
- **Default**: PLN
- **Help Text**: "Currency for all cost fields"

### 4. Info Banner
- **Create Mode**: Blue info banner
  - "ℹ Note: You'll add production operations (steps) after creating the routing."
  - Purpose: Set expectation that this is step 1 of 2
- **Edit Mode**: Warning banner (if routing is used by BOMs and being deactivated)

---

## Main Actions

### Primary Action
- **Create Mode**: "[Create Routing]" button
  - Validates form (code and name required)
  - Calls POST /api/technical/routings
  - On success:
    - Close modal
    - Show toast: "Routing created successfully"
    - Navigate to detail page: `/technical/routings/{id}` (TEC-010)
    - Detail page prompts user to add operations
  - On error: Show error banner in modal

- **Edit Mode**: "[Save Changes]" button
  - Validates form
  - Calls PUT /api/technical/routings/{id}
  - On success:
    - Close modal
    - Show toast: "Routing updated successfully"
    - Refresh parent list view
  - On error: Show error banner in modal

### Secondary Action
- **[Cancel]** button
  - If form dirty: Show "Unsaved changes" confirmation
  - If clean: Close modal immediately
  - Returns to TEC-007 list

---

## State Transitions

```
Modal Opens (Create Mode)
  ↓
SUCCESS (Empty form with defaults)
  ↓ User fills code + name
DIRTY (Form has changes)
  ↓ [Create Routing]
LOADING (Show spinner, disable buttons)
  ↓ Success
CLOSE + Toast notification + Navigate to TEC-010 detail page

OR

LOADING
  ↓ Failure (validation error, e.g., duplicate code)
ERROR (Show error banner, enable buttons)
  ↓ User fixes error
DIRTY
  ↓ Retry

OR

Modal Opens (Edit Mode)
  ↓
LOADING (Show spinner)
  ↓ Fetch routing data
SUCCESS (Pre-filled form)
  ↓ User edits
DIRTY
  ↓ [Save Changes]
LOADING → SUCCESS (close + refresh) OR ERROR (stay open)
```

---

## Validation

### Client-Side (Before Submit)
```typescript
{
  code: {
    required: "Routing code is required",
    minLength: { value: 2, message: "Code must be at least 2 characters" },
    maxLength: { value: 50, message: "Code must be less than 50 characters" },
    pattern: {
      value: /^[A-Z0-9-]+$/,
      message: "Code can only contain uppercase letters, numbers, and hyphens"
    }
  },
  name: {
    required: "Routing name is required",
    minLength: { value: 3, message: "Name must be at least 3 characters" },
    maxLength: { value: 100, message: "Name must be less than 100 characters" }
  },
  description: {
    maxLength: { value: 500, message: "Description must be less than 500 characters" }
  },
  status: {
    required: "Status is required",
    enum: ["Active", "Inactive"]
  },
  is_reusable: {
    // Boolean, no validation needed
  },
  setup_cost: {
    min: { value: 0, message: "Setup cost cannot be negative" }
  },
  working_cost_per_unit: {
    min: { value: 0, message: "Working cost per unit cannot be negative" }
  },
  overhead_percent: {
    min: { value: 0, message: "Overhead percentage cannot be negative" },
    max: { value: 100, message: "Overhead percentage cannot exceed 100%" }
  },
  currency: {
    enum: ["PLN", "EUR", "USD", "GBP"]
  }
}
```

### Server-Side (Business Rules)
1. **Unique Code**: Routing code must be unique within organization
2. **Permissions**: User must have Admin or Production Manager role
3. **Usage Check** (when deactivating): Server returns count of BOMs using this routing

### Error Messages
```typescript
{
  "DUPLICATE_CODE": "Code '[code]' already exists in your organization. Please choose a different code.",
  "INVALID_CODE": "Code must be 2-50 characters and contain only uppercase letters, numbers, and hyphens.",
  "PERMISSION_DENIED": "You do not have permission to create/edit routings.",
  "INVALID_NAME": "Routing name is invalid or too short (min 3 characters)."
}
```

---

## Data Required

### API Endpoints

#### Create Routing
```
POST /api/technical/routings
```

**Request Body:**
```typescript
{
  code: string                // "RTG-BREAD-01"
  name: string                // "Standard Bread Line"
  description?: string | null // "Mixing → Baking..."
  status: "Active" | "Inactive" // "Active" (default)
  is_reusable: boolean        // true (default)
  setup_cost?: number         // 0.00 (default) - ADR-009
  working_cost_per_unit?: number // 0.00 (default) - ADR-009
  overhead_percent?: number   // 0.00 (default) - ADR-009
  currency?: string           // "PLN" (default) - ADR-009
}
```

**Response:**
```typescript
{
  routing: {
    id: string
    org_id: string
    code: string
    name: string
    description: string | null
    status: "Active" | "Inactive"
    is_reusable: boolean
    version: number              // Auto-set to 1 on create
    setup_cost: number           // ADR-009
    working_cost_per_unit: number // ADR-009
    overhead_percent: number     // ADR-009
    currency: string             // ADR-009
    operations_count: number     // 0 initially
    created_at: string
    updated_at: string
    created_by: string
  }
}
```

#### Edit Routing
```
PUT /api/technical/routings/{id}
```

**Request Body:**
```typescript
{
  code: string
  name: string
  description?: string | null
  status: "Active" | "Inactive"
  is_reusable: boolean
  setup_cost?: number           // ADR-009
  working_cost_per_unit?: number // ADR-009
  overhead_percent?: number     // ADR-009
  currency?: string             // ADR-009
}
```

**Response:** (same as create)

#### Check Usage (for Edit Mode)
```
GET /api/technical/routings/{id}/boms
```

**Response:**
```typescript
{
  boms: [
    {
      id: string
      product_code: string
      version: string
    }
  ],
  count: number
}
```

---

## Technical Notes

### Default Values (Create Mode)
```typescript
{
  code: "",
  name: "",
  description: null,
  status: "Active",  // Default to Active
  is_reusable: true,  // Default to reusable
  version: 1,  // Auto-set on create (read-only)
  setup_cost: 0,  // ADR-009
  working_cost_per_unit: 0,  // ADR-009
  overhead_percent: 0,  // ADR-009
  currency: "PLN"  // ADR-009
}
```

### Auto-Uppercase Transform
```typescript
// Apply to code field on input
const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const uppercase = e.target.value.toUpperCase()
  setValue('code', uppercase)
}
```

### Unique Code Check
Server-side validation on create/update:
```sql
SELECT id FROM routings
WHERE org_id = :org_id
  AND LOWER(code) = LOWER(:code)
  AND id != :current_id  -- Exclude self when editing
LIMIT 1;
```

### Navigation After Create
```typescript
// On successful create
const { routing } = await response.json()
router.push(`/technical/routings/${routing.id}`)
toast({
  title: 'Success',
  description: 'Routing created. Now add production operations.'
})
```

### Edit Mode - Usage Warning
```typescript
// Check if routing is used by BOMs
if (editMode && formData.status === 'Inactive' && originalData.status === 'Active') {
  const usageRes = await fetch(`/api/technical/routings/${id}/boms`)
  const usage = await usageRes.json()

  if (usage.count > 0) {
    setWarning(
      `This routing is used by ${usage.count} BOM(s). Marking it inactive will prevent assignment to new BOMs but won't affect existing ones.`
    )
  }
}
```

### Accessibility (WCAG 2.1 AA)

- **Close button**: aria-label="Close modal"
- **Info banners**: role="status" aria-live="polite"
- **Error banners**: aria-live="assertive"
- **All interactive elements**: keyboard navigable (Tab/Shift+Tab)
- **Touch targets**: >= 48x48dp
- **Color contrast**: >= 4.5:1 for text, >= 3:1 for UI components

- **Focus**: First field (Routing Code) auto-focused on open
- **Keyboard**:
  - Tab through all fields
  - Enter submits form
  - Escape closes modal (with dirty check)
- **Screen Reader**: All fields properly labeled with aria-label
- **Error Announce**: Validation errors announced to screen reader
- **Touch Targets**: All buttons >= 48x48dp

---

## Related Screens

- **Previous**: TEC-007 Routings List (opens modal)
- **Next (Create)**: TEC-010 Routing Detail Page (for adding operations)
- **Next (Edit)**: Returns to TEC-007 list
- **Related**: TEC-006 BOM Modal (BOMs reference routings)

---

## Handoff Notes

### For FRONTEND-DEV

1. **Component**: `components/technical/routings/create-routing-modal.tsx`
2. **Existing Code**: ~75% implemented (see file for reference)
3. **Key Changes Needed**:
   - **Add code field** (BEFORE name field)
   - **Replace is_active checkbox with status dropdown**
   - **Add is_reusable checkbox**
   - **Add Cost Configuration section (4 fields)** - ADR-009
   - Add usage warning banner for edit mode (when deactivating used routing)
   - Improve error handling for duplicate codes
   - Add "Unsaved changes" warning
   - Add info banner about operations being added later
   - Add version display in edit mode header

4. **Libraries**:
   - Use ShadCN `Dialog` for modal
   - Use `react-hook-form` + Zod for validation
   - Use ShadCN `Select` for status dropdown and currency dropdown
   - Use ShadCN `Checkbox` for is_reusable toggle
   - Use ShadCN `Textarea` for description
   - Use ShadCN `Input` for number fields (cost fields)

5. **Validation Schema** (Zod):
```typescript
import { z } from 'zod'

const routingFormSchema = z.object({
  code: z.string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code must be less than 50 characters")
    .regex(/^[A-Z0-9-]+$/, "Code can only contain uppercase letters, numbers, and hyphens")
    .transform(val => val.toUpperCase()),
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .nullable()
    .optional(),
  status: z.enum(["Active", "Inactive"]),
  is_reusable: z.boolean(),
  // Cost fields (ADR-009)
  setup_cost: z.number().min(0).default(0),
  working_cost_per_unit: z.number().min(0).default(0),
  overhead_percent: z.number().min(0).max(100).default(0),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']).default('PLN')
})
```

6. **State Management**:
   - Modal open/close state in parent (TEC-007)
   - Form state in react-hook-form
   - Loading state during API calls
   - Error state for validation failures
   - Warning state for usage check (edit mode)

7. **API Integration**:
   - POST for create, PUT for edit
   - Handle 409 Conflict for duplicate codes
   - Handle 400 Bad Request for validation errors
   - Navigate to TEC-010 detail page on create success
   - Refresh parent list on edit success

### Create Flow
```typescript
const handleCreate = async (data: FormData) => {
  setLoading(true)

  try {
    const response = await fetch('/api/technical/routings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      if (response.status === 409) {
        // Duplicate code
        setError('code', {
          message: error.message
        })
        return
      }
      throw new Error(error.message)
    }

    const { routing } = await response.json()

    toast({
      title: 'Success',
      description: 'Routing created. Now add production operations.'
    })

    onClose()
    router.push(`/technical/routings/${routing.id}`)
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    setLoading(false)
  }
}
```

### Edit Flow with Usage Check
```typescript
const handleEdit = async (data: FormData) => {
  // Check usage before deactivating
  if (data.status === 'Inactive' && originalData.status === 'Active') {
    const usageRes = await fetch(`/api/technical/routings/${routingId}/boms`)
    const usage = await usageRes.json()

    if (usage.count > 0) {
      setWarning(
        `This routing is used by ${usage.count} BOM(s). Marking it inactive will prevent assignment to new BOMs but won't affect existing ones.`
      )
    }
  }

  // Proceed with update
  setLoading(true)

  try {
    const response = await fetch(`/api/technical/routings/${routingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) throw new Error('Failed to update')

    toast({
      title: 'Success',
      description: 'Routing updated successfully'
    })

    onClose()
    onSuccess() // Refresh parent list
  } catch (error) {
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    })
  } finally {
    setLoading(false)
  }
}
```

---

## Field Verification (PRD Cross-Check)

**Routing Core Fields (from PRD Section 3.1 - routings table):**
- ✅ id, org_id (auto-generated, internal)
- ✅ code (Text input, required, unique, uppercase, 2-50 chars)
- ✅ name (Text input, required, 3-100 chars)
- ✅ description (Textarea, optional, max 500 chars)
- ✅ status (Dropdown: Active/Inactive, replaces is_active)
- ✅ is_reusable (Checkbox, defaults to true)
- ✅ version (Read-only, display in edit mode header, auto-set to 1 on create)
- ✅ setup_cost (Decimal input, optional, default 0) - **ADR-009**
- ✅ working_cost_per_unit (Decimal input, optional, default 0) - **ADR-009**
- ✅ overhead_percent (Decimal input, optional, default 0, 0-100) - **ADR-009**
- ✅ currency (Dropdown, optional, default PLN) - **ADR-009**
- ✅ created_at, updated_at, created_by (auto-generated, audit fields)

**Note:** Routing operations (routing_operations table) are NOT managed in this modal. They are added in TEC-010 detail view after routing creation.

**Business Rules:**
- ✅ Code must be unique within organization (Server validation)
- ✅ Code auto-uppercase transform (Client-side)
- ✅ Default status = Active (Pre-filled)
- ✅ Default is_reusable = true (Pre-filled)
- ✅ Operations added separately (Info banner in create mode)
- ✅ Inactive routings cannot be assigned to new BOMs (Help text)
- ✅ Deactivating used routing shows warning (Edit mode)
- ✅ Cost fields optional for Phase 2C-2 (ADR-009)

**ALL PRD FIELDS VERIFIED ✅**

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve
**Iterations**: 0 of 3
**PRD Compliance**: 100% (all fields verified + ADR-009 cost fields)
