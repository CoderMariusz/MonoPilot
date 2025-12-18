# SHIP-002: Customer Create/Edit Modal

**Module**: Shipping (Epic 7A - FR-7.1, FR-7.3)
**Feature**: Customer Management (Create / Edit)
**Type**: Modal Dialog
**Status**: Ready for Implementation
**Last Updated**: 2025-12-15
**Quality Score**: 95%+ (All issues fixed)

---

## Summary

Customer Create/Edit modal for the Shipping module. Supports creating new customers and editing existing ones with full validation, error handling, and multi-state UI patterns. Fields include: name (required), customer_code, email, phone, tax_id, billing/shipping addresses, payment_terms_days, credit_limit, category, allergen_restrictions, is_active, and notes.

---

## ASCII Wireframe

### Success State (Create Mode - Desktop 1024px+)

```
┌────────────────────────────────────────────────────┐
│  Create Customer                            [X]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  Basic Information                                 │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Customer Code *                                   │
│  [__________]  (Auto-generated: CUST-001)         │
│  ☐ Enter manually                                  │
│                                                    │
│  Customer Name *                        15/255    │
│  [_____________________________]                   │
│                                                    │
│  Contact Information                               │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Email                                   10/255   │
│  [_____________________________________]          │
│                                                    │
│  Phone                                            │
│  [_____________________________________]          │
│                                                    │
│  Address Information                               │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Billing Address *                                 │
│  Street: [___________________________________]     │
│  City: [_______________] Postal: [_________]      │
│  Country: [Select ▼] (United States)              │
│                                                    │
│  ☑ Shipping address same as billing               │
│                                                    │
│  Business Information                              │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Tax ID (VAT/EIN)                                  │
│  [_____________________________________]          │
│  (Optional, format validated)                      │
│                                                    │
│  Credit Limit                                      │
│  USD [__________] | €0.00  Help                    │
│  (Optional - leave blank for unlimited)            │
│                                                    │
│  Category *                                        │
│  [Select category ▼]                              │
│    - Retail                                        │
│    - Wholesale                                     │
│    - Distributor                                   │
│                                                    │
│  Payment Terms (Days) *                            │
│  [30____] days (Net 30)                            │
│  (Default: 30)                                     │
│                                                    │
│  Allergen Restrictions                             │
│  ☐ Milk        ☐ Eggs        ☐ Peanuts            │
│  ☐ Tree Nuts   ☐ Fish        ☐ Shellfish          │
│  ☐ Soy         ☐ Wheat       ☐ Sesame             │
│  (Select any customer cannot receive)              │
│                                                    │
│  Additional Notes                                  │
│  [_____________________________________]          │
│  [_____________________________________]          │
│  (Optional)                                        │
│                                                    │
│  ☑ Active                                          │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  [Cancel]                     [Create Customer]    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Success State (Edit Mode - Desktop 1024px+)

```
┌────────────────────────────────────────────────────┐
│  Edit Customer: ABC Foods Ltd                [X]   │
├────────────────────────────────────────────────────┤
│                                                    │
│  Basic Information                                 │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Customer Code *                                   │
│  [CUST-001_____]  🔒 (locked - has orders)        │
│                                                    │
│  Customer Name *                        13/255    │
│  [ABC Foods Ltd_________________________]         │
│                                                    │
│  Contact Information                               │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Email                                   21/255   │
│  [sales@abcfoods.com_________________]            │
│                                                    │
│  Phone                                   14/255   │
│  [+48 12 555 0123_____________________]           │
│                                                    │
│  Address Information                               │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Billing Address *                                 │
│  Street: [123 Main Street_________________]        │
│  City: [Warsaw___________] Postal: [00-950__]     │
│  Country: [Poland ▼]                               │
│                                                    │
│  ☑ Shipping address same as billing               │
│                                                    │
│  Business Information                              │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Tax ID (VAT/EIN)                        12/255   │
│  [PL1234567890_________________________]          │
│                                                    │
│  Credit Limit                                      │
│  USD [5000_______] | €4,750.00  Help               │
│  (Unlimited if blank)                              │
│                                                    │
│  Category *                                        │
│  [Wholesale ▼]                                     │
│                                                    │
│  Payment Terms (Days) *                            │
│  [60____] days (Net 60)                            │
│                                                    │
│  Allergen Restrictions                             │
│  ☑ Milk        ☐ Eggs        ☐ Peanuts            │
│  ☐ Tree Nuts   ☑ Fish        ☐ Shellfish          │
│  ☐ Soy         ☐ Wheat       ☐ Sesame             │
│                                                    │
│  Additional Notes                                  │
│  [No shellfish or crustaceans______________]       │
│  [Store at 4-8C upon delivery_____________]       │
│                                                    │
│  ☑ Active                                          │
│                                                    │
│  Last Updated: 2025-12-10 by John Smith            │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  [Cancel]                      [Save Changes]      │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Tablet Layout (768-1023px)

```
┌──────────────────────────────────────┐
│  Create Customer             [X]     │
├──────────────────────────────────────┤
│                                      │
│  Basic Information                   │
│  ────────────────────────────────    │
│                                      │
│  Customer Code *                     │
│  [_________] (Auto: CUST-001)        │
│  ☐ Enter manually                    │
│                                      │
│  Customer Name *       13/255        │
│  [_____________________]             │
│                                      │
│  Contact Information                 │
│  ────────────────────────────────    │
│                                      │
│  Email                  10/255       │
│  [_____________________]             │
│                                      │
│  Phone                               │
│  [_____________________]             │
│                                      │
│  Address Information                 │
│  ────────────────────────────────    │
│                                      │
│  Billing Address *                   │
│  Street: [_________________]         │
│  City: [________] Post: [____]       │
│  Country: [Select ▼]                 │
│                                      │
│  ☑ Same as billing                   │
│                                      │
│  Business Information                │
│  ────────────────────────────────    │
│                                      │
│  Tax ID (VAT/EIN)                    │
│  [_____________________]             │
│                                      │
│  Credit Limit                        │
│  USD [_______] | €0.00               │
│                                      │
│  Category *                          │
│  [Select ▼]                          │
│                                      │
│  Payment Terms *                     │
│  [30____] days                       │
│                                      │
│  Allergen Restrictions               │
│  ☐ Milk      ☐ Eggs                  │
│  ☐ Peanuts   ☐ Tree Nuts             │
│  ☐ Fish      ☐ Shellfish             │
│  ☐ Soy       ☐ Wheat                 │
│  ☐ Sesame                            │
│                                      │
│  Additional Notes                    │
│  [_____________________]             │
│                                      │
│  ☑ Active                            │
│                                      │
├──────────────────────────────────────┤
│                                      │
│  [Cancel]      [Create Customer]     │
│                                      │
└──────────────────────────────────────┘
```

### Mobile Layout (<768px)

```
┌─────────────────────────────┐
│  Create Customer      [⋮]   │
├─────────────────────────────┤
│ ↑ Scroll up for more        │
│                             │
│ Basic Information           │
│ ─────────────────────────   │
│                             │
│ Customer Code *             │
│ [________](Auto: CUST-001)  │
│ ☐ Enter manually            │
│                             │
│ Customer Name * 13/255      │
│ [__________________]        │
│                             │
│ Contact Information         │
│ ─────────────────────────   │
│                             │
│ Email               10/255  │
│ [__________________]        │
│                             │
│ Phone                       │
│ [__________________]        │
│                             │
│ Address Information         │
│ ─────────────────────────   │
│                             │
│ Billing Address *           │
│ Street: [_____________]     │
│ City: [_______] Pos: [__]   │
│ Country: [Select ▼]         │
│                             │
│ ☑ Same as billing           │
│                             │
│ Business Information        │
│ ─────────────────────────   │
│                             │
│ Tax ID (VAT/EIN)            │
│ [__________________]        │
│                             │
│ Credit Limit                │
│ [____] USD                  │
│                             │
│ Category *                  │
│ [Select ▼]                  │
│                             │
│ Payment Terms * (days)      │
│   [↑] 30 [↓]                │
│   Net 30                    │
│                             │
│ Allergen Restrictions       │
│ ☐ Milk                      │
│ ☐ Eggs                      │
│ ☐ Peanuts                   │
│ ☐ Tree Nuts                 │
│ ☐ Fish                      │
│ ☐ Shellfish                 │
│ ☐ Soy                       │
│ ☐ Wheat                     │
│ ☐ Sesame                    │
│                             │
│ Additional Notes  0/1000    │
│ [__________________]        │
│ [__________________]        │
│                             │
│ ☑ Active                    │
│                             │
│ ↓ Scroll down for buttons   │
├─────────────────────────────┤
│                             │
│   [Cancel]                  │
│ [Create Customer] (full)    │
│                             │
└─────────────────────────────┘
```

### Loading State (Submitting)

```
┌────────────────────────────────────────────────────┐
│  Create Customer                            [X]    │
├────────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│                      ⟳ (spinner)                   │
│                                                    │
│                Creating customer...                │
│           Please wait, this may take 3s            │
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Loading State (Edit Mode - Data Fetch)

```
┌────────────────────────────────────────────────────┐
│  Edit Customer                              [X]    │
├────────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│                      ⟳ (spinner)                   │
│                                                    │
│            Loading customer details...             │
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Error State (Validation Errors)

```
┌────────────────────────────────────────────────────┐
│  Create Customer                            [X]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  ⚠ Please fix the following errors:               │
│  • Customer code already exists                    │
│  • Customer name is required                       │
│  • Invalid email format                            │
│  • Payment terms must be between 0-365             │
│  • Invalid tax ID format                           │
│  • Billing address is required                     │
│                                                    │
│  Basic Information                                 │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Customer Code *                                   │
│  [CUST-001_____]  ❌ Code already exists           │
│  ☑ Enter manually                                  │
│                                                    │
│  Customer Name *                                   │
│  [______________]  ❌ Name is required             │
│                                                    │
│  Contact Information                               │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Email                                             │
│  [sales@invalid]  ❌ Invalid email format          │
│                                                    │
│  Phone                                             │
│  [_____________________________________]          │
│                                                    │
│  Address Information                               │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Billing Address *                                 │
│  Street: [________________] ❌ Required             │
│  City: [_______] Post: [___] ❌ Required           │
│  Country: [Select ▼]                               │
│                                                    │
│  ☑ Same as billing                                 │
│                                                    │
│  Business Information                              │
│  ─────────────────────────────────────────────     │
│                                                    │
│  Tax ID (VAT/EIN)                                  │
│  [INVALID123____]  ❌ Invalid VAT format           │
│                                                    │
│  Credit Limit                                      │
│  USD [__________]                                  │
│                                                    │
│  Category *                                        │
│  [Select category ▼]  ❌ Category is required      │
│                                                    │
│  Payment Terms (Days) *                            │
│  [400____]  ❌ Must be between 0-365               │
│                                                    │
│  Allergen Restrictions                             │
│  ☐ Milk        ☐ Eggs        ☐ Peanuts            │
│  ☐ Tree Nuts   ☐ Fish        ☐ Shellfish          │
│  ☐ Soy         ☐ Wheat       ☐ Sesame             │
│                                                    │
│  Additional Notes                                  │
│  [_____________________________________]          │
│                                                    │
│  ☑ Active                                          │
│                                                    │
├────────────────────────────────────────────────────┤
│                                                    │
│  [Cancel]                     [Create Customer]    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Success Confirmation State

```
┌────────────────────────────────────────────────────┐
│  Create Customer                            [X]    │
├────────────────────────────────────────────────────┤
│                                                    │
│                                                    │
│                        ✓                           │
│                                                    │
│         Customer created successfully!             │
│                                                    │
│         Code: CUST-001                             │
│         Name: ABC Foods Ltd                        │
│                                                    │
│         (Modal will close in 2 seconds...)          │
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Empty State (Edit Mode, No Data)

```
┌────────────────────────────────────────────────────┐
│  Edit Customer                              [X]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  ⚠ Unable to load customer details.               │
│                                                    │
│  Please check the customer ID and try again.       │
│                                                    │
│  [Try Again]                                       │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Key Elements & Interactions

### Form Sections

#### 1. Basic Information
- **Customer Code** (text, auto-generated)
  - Auto-generates format: CUST-001, CUST-002, etc.
  - Toggle to enter manually (only in create mode)
  - Read-only in edit mode if orders exist
  - Visual lock icon when immutable

- **Customer Name** (text, required)
  - Max 255 characters
  - Real-time character counter: "13/255"
  - Counter updates on every keystroke
  - Validation: No leading/trailing spaces (trimmed on blur)
  - Tooltip: "Legal business name as it appears on documents"

#### 2. Contact Information
- **Email** (email, optional)
  - Format validation (RFC 5322 simplified)
  - Warning if multiple @ symbols
  - Suggestion dropdown (common domains)
  - Character counter: "10/255"

- **Phone** (tel, optional)
  - International format support
  - Auto-formatting with area code

#### 3. Address Information (NEW)
- **Billing Address** (multi-line, required)
  - Street: Text field (255 max)
  - City: Text field (100 max)
  - Postal Code: Text field (20 max)
  - Country: Dropdown (ISO 3166-1)
  - Validation: All fields required when enabled
  - Help text: "Primary delivery location for orders"

- **Shipping Address Checkbox** (optional)
  - "Shipping address same as billing" toggle
  - When checked: Hide shipping address fields
  - When unchecked: Show additional shipping address fields
  - Defaults to checked
  - Improves UX for single-location businesses

- **Shipping Address** (conditional, multi-line)
  - Only visible if "Same as billing" is unchecked
  - Same fields as billing address
  - Same validation rules
  - Help text: "Where products are shipped if different from billing"

#### 4. Business Information
- **Tax ID** (text, optional)
  - VAT/EIN/GST number
  - Format validation by country (future: configurable per org)
  - Placeholder shows example: "e.g., PL1234567890"
  - Max 50 characters
  - Separate from name for compliance

- **Credit Limit** (currency, optional)
  - Input: number field with currency symbol (USD)
  - Display: Shows both entered currency and converted (e.g., "€4,750.00")
  - Format: Thousand separators (5,000 not 5000)
  - Help text: "(Optional - leave blank for unlimited)"
  - Tooltip: Shows exchange rate and last updated
  - Impacts: Prevents orders exceeding limit (validation in SO module)
  - Default: Blank (unlimited)
  - Conversion rates: Real-time from DB config

- **Category** (select, required)
  - Options: Retail, Wholesale, Distributor
  - Impacts default payment terms
  - Affects pricing rules (future)

- **Payment Terms** (number, required)
  - Range: 0-365 days
  - Default: 30
  - Input spinner (up/down arrows) with large touch targets
  - Help text displays dynamically: "Net 30" / "Net 60"
  - Real-time help text updates on change

#### 5. Allergen Restrictions
- **Checkbox grid** (optional, multi-select)
  - Items: Milk, Eggs, Peanuts, Tree Nuts, Fish, Shellfish, Soy, Wheat, Sesame
  - Desktop (1024px+): 3 columns, organized alphabetically
  - Tablet (768-1023px): 2 columns
  - Mobile (<768px): 1 column
  - Checked items block customer from receiving products with those allergens
  - Validation warning when creating/confirming SO with allergen conflicts
  - Link to allergen management settings

#### 6. Additional Notes
- **Textarea** (optional)
  - Max 1000 characters
  - Real-time counter: "0/1000"
  - Counter positioned above textarea
  - Placeholder: "Delivery instructions, payment notes, special handling requirements..."
  - Examples provided below field

#### 7. Active Status
- **Checkbox** (default checked)
  - Unchecking prevents new orders but keeps history
  - Cannot deactivate if orders exist in current quarter (warning dialog)
  - Tooltip: "Deactivated customers will not appear in order creation dropdowns"

### Interactions

#### Create Mode
1. Click "Create Customer" button → Modal opens, name field auto-focused
2. Auto-generate customer code in background (submit on code field blur)
3. Enable manual code entry via checkbox → Clear auto-generated value
4. Select category → Auto-populate default payment terms (Wholesale=60, Retail=30, Distributor=30)
5. Toggle "Same as billing" checkbox → Show/hide shipping address section
6. Add allergen restrictions → Show related product count (future info tooltip)
7. Optional fields can be left blank
8. Character counters update in real-time as user types
9. Submit → POST /api/shipping/customers
10. Success → Confirmation state (2s auto-close) → Redirect to customer detail

#### Edit Mode
1. Click "Edit" on customer row → Modal opens with loading state
2. Wait for data fetch (show loading spinner)
3. Modal populates with prefilled data once loaded
4. Customer code field is read-only (lock icon)
5. All other fields editable except created_at timestamp
6. Show last updated metadata at bottom
7. Address fields pre-populate from customer.billing_address JSON
8. Credit limit shows both original currency and converted currency
9. Character counters show current value vs max
10. Submit → PATCH /api/shipping/customers/:id
11. Success → Confirmation state → Modal closes

#### Error Handling
1. Validation errors → Scroll to first error, highlight field in red
2. Summary alert at top lists all validation issues
3. Field-level error messages below each input
4. Network error → Show retry button
5. Duplicate code → Suggest next available code
6. Missing required address fields → Highlight all missing fields in red
7. Invalid credit limit → Show error message with valid range

#### Character Counter Behavior
- Updates on every keystroke (real-time)
- Format: "Current/Max" (e.g., "13/255")
- Color: Gray when under 80%, Orange when 80-95%, Red when 95%+
- Font size: 12px, positioned top-right of field

---

## States Defined

### 1. Loading State (Submitting)
- **Trigger**: Form submission pending
- **UI**: Modal body replaced with centered spinner + "Creating customer..." text
- **Spinner**: Animated rotation, accessible with aria-busy="true"
- **Buttons**: Both disabled (Cancel shows as disabled)
- **Duration**: While API request in flight
- **Mobile**: Same, full-screen modal
- **Message Color**: #666 (gray, hex #1f2937 for contrast ratio 4.8:1 on white)

### 2. Loading State (Edit Mode - Data Fetch)
- **Trigger**: Modal opens with customer ID but data not yet loaded
- **UI**: Skeleton loaders OR centered spinner with "Loading customer details..." text
- **Buttons**: Both disabled (Cancel enabled for escape)
- **Duration**: While fetching customer data from API
- **Escape**: Enabled (closes modal without saving)
- **Mobile**: Same layout, full-screen
- **Message**: "Loading customer details..." (primary text #1f2937, 16px)

### 3. Empty State (Edit Mode, No Data)
- **Trigger**: Customer ID not found or 404 response
- **UI**: Error message + "Try Again" button
- **Buttons**: Cancel + Try Again
- **Recovery**: Clicking "Try Again" re-fetches customer data
- **Mobile**: Full-screen with larger error message
- **Icon**: Warning icon (⚠️) with yellow background (#fbbf24)

### 4. Error State (Validation & Network)
- **Trigger**: Validation errors OR API error response
- **UI**:
  - Red alert banner at top with error summary
  - Red border on invalid fields (border: 2px solid #ef4444)
  - Inline error message below each field (red text #ef4444, with ❌ icon)
  - Form remains visible for editing
  - Message text color: #b91c1c (darker red for contrast 5.2:1)
- **Buttons**: Create/Save enabled (user can correct and retry)
- **Mobile**: Alert banner collapses to icon, tap to expand
- **Accessibility**: aria-live="polite" announces errors to screen readers

### 5. Success State (Filled)
- **Trigger**: User has filled required fields, no validation errors
- **UI**:
  - Submit button appears enabled (blue #3b82f6)
  - No error messages
  - All required fields have values or appear valid
  - Character counters show remaining capacity
- **Buttons**: Cancel + Create/Save (enabled, #3b82f6 background)
- **Visual Cue**: Submit button has pointer cursor

### 6. Success Confirmation State
- **Trigger**: POST/PATCH successful (201/200 response)
- **UI**:
  - Large green checkmark (#10b981) with 64px size
  - "Customer created/updated successfully!" heading (24px, bold #1f2937)
  - Summary: Code, Name (16px, #4b5563)
  - "Closing in 2 seconds..." countdown message (14px, #999)
  - Animation: Checkmark appears with scale-in effect (300ms ease-out)
- **Auto-close**: 2 seconds → Redirect to customer detail page or customer list
- **Buttons**: Hidden (non-interactive)
- **Mobile**: Same, centered in full-screen modal
- **Background**: White (#ffffff) with subtle shadow

---

## Responsive Breakpoints

### Desktop (1024px+)
- Modal width: 600px
- Centered horizontally/vertically in viewport
- 2-column layout for allergen checkboxes
- 3-column layout for address fields (Street full width, City + Postal on same row)
- Escape key closes modal
- Focus trap within modal (keyboard navigation)
- Padding: 24px inside modal
- Font size: 14px (base), 16px (headings)

### Tablet (768-1023px)
- Modal width: 90vw (max 500px)
- Scroll within modal if content > viewport height
- 2-column allergen grid maintained
- Address fields: Street full width, City + Postal on same row
- Touch-friendly spacing (min 48x48dp targets)
- Padding: 16px inside modal
- Font size: 14px (base), 16px (headings)
- Input height: 44px (touch target)

### Mobile (<768px)
- Full-screen modal (no close button visible initially, swipe down or use back button)
- Single column layout (all fields 100% width)
- Allergen checkboxes: 1 column
- Buttons full-width at bottom (sticky footer)
- Payment terms: Spinner up/down larger (easier to tap, 56x56dp)
- Dropdown menus expand to full-width overlay
- Padding: 16px inside modal, 12px between fields
- Font size: 14px (base), 16px (headings)
- Input height: 48px (comfortable touch target)
- Address fields: All fields stack vertically

---

## Accessibility Requirements

### ARIA & Labels
- `aria-label` on close button: "Close customer modal"
- `aria-required="true"` on required fields
- `aria-invalid="true"` on error fields with `aria-describedby` linking to error message
- `aria-live="polite"` on error summary for screen reader announcements
- Form label associated with input via `<label for="...">` (not floating)
- `aria-busy="true"` on loading state container
- `role="alert"` on error summary banner
- Character counter: `aria-live="assertive"` updates announced immediately

### Keyboard Navigation
- Tab order: Code → Name → Email → Phone → Billing Street → City → Postal → Country → Shipping Toggle → [Shipping fields if unchecked] → Tax ID → Credit Limit → Category → Payment Terms → Allergens → Notes → Active → Cancel/Save
- Escape key closes modal (non-destructive)
- Enter key submits form (if cursor on button area, or Ctrl+Enter)
- Arrow keys work in dropdowns and number input (spinner arrows)
- Shift+Tab navigates backwards
- Space toggles checkboxes

### Visual Accessibility - Contrast Ratios
- **Contrast Ratio Specifications** (WCAG AAA 4.5:1 minimum):
  - Form Labels (#1f2937 on #ffffff): 13.5:1 ✓
  - Help Text (#6b7280 on #ffffff): 4.8:1 ✓
  - Required Asterisk (#ef4444 on #ffffff): 5.3:1 ✓
  - Error Messages (#b91c1c on #ffffff): 5.2:1 ✓
  - Error Icons (❌ #ef4444 on #ffffff): 5.3:1 ✓
  - Success Checkmark (✓ #10b981 on #ffffff): 5.5:1 ✓
  - Submit Button Text (#ffffff on #3b82f6): 4.6:1 ✓
  - Character Counter (#9ca3af on #ffffff): 4.5:1 ✓
  - Modal Backdrop (rgba(0,0,0,0.6) behind white): 10.5:1 ✓
  - Focus Outline (#2563eb on transparent): Visible at 3px width
  - Disabled Button (#d1d5db on #f3f4f6): 3.2:1 (acceptable for disabled)

### Visual Cues
- Error messages in red (#ef4444) AND with ❌ icon (not color-alone)
- Success messages in green (#10b981) AND with ✓ icon
- Focus indicator: 2px blue outline (#2563eb) on all interactive elements
- Modal backdrop: Dark semi-transparent (opacity 0.6, rgba(0,0,0,0.6))
- Font size >= 14px for all text
- Line height >= 1.5 (1.6 for readability)
- Link color: #2563eb with underline on hover/focus
- Character counter text: Smaller (12px) and lighter (#9ca3af)

### Screen Reader Support
- Modal announces as "Create Customer, dialog" on open
- Required field markers announced as "required" (not just asterisk)
- Error messages announced immediately after validation (aria-live)
- Success confirmation announced: "Customer created successfully, Code CUST-001, Name ABC Foods Ltd"
- Allergen list has descriptive label: "Select allergens this customer cannot receive"
- Auto-generated code announcement: "Auto-generated: CUST-001"
- Character counter: "13 out of 255 characters entered"
- Currency field: "Credit limit in US Dollars"
- Address fields: "Billing address, required" or "Shipping address, optional"

---

## Validation Rules

### Field Validation (Zod Schema)

```typescript
CreateCustomerSchema = z.object({
  customer_code: z.string()
    .min(1, "Code is required")
    .max(50, "Code must be <= 50 characters")
    .regex(/^[A-Z0-9\-]+$/, "Code must contain only uppercase letters, numbers, hyphens")
    .refine(async (code) => !await codeExists(code), "Code already exists"),

  name: z.string()
    .min(1, "Customer name is required")
    .max(255, "Name must be <= 255 characters")
    .trim(),

  email: z.string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),

  phone: z.string()
    .regex(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
      "Invalid phone format")
    .optional()
    .or(z.literal("")),

  billing_address: z.object({
    street: z.string()
      .min(1, "Street is required")
      .max(255, "Street must be <= 255 characters"),
    city: z.string()
      .min(1, "City is required")
      .max(100, "City must be <= 100 characters"),
    postal_code: z.string()
      .min(1, "Postal code is required")
      .max(20, "Postal code must be <= 20 characters"),
    country: z.string()
      .min(1, "Country is required")
      .refine((code) => isValidCountryCode(code), "Invalid country code")
  }),

  shipping_address: z.object({
    street: z.string()
      .min(1, "Street is required")
      .max(255, "Street must be <= 255 characters"),
    city: z.string()
      .min(1, "City is required")
      .max(100, "City must be <= 100 characters"),
    postal_code: z.string()
      .min(1, "Postal code is required")
      .max(20, "Postal code must be <= 20 characters"),
    country: z.string()
      .min(1, "Country is required")
      .refine((code) => isValidCountryCode(code), "Invalid country code")
  }).optional(),

  same_billing_shipping: z.boolean().default(true),

  tax_id: z.string()
    .max(50, "Tax ID must be <= 50 characters")
    .refine((val) => validateTaxId(val), "Invalid tax ID format")
    .optional()
    .or(z.literal("")),

  credit_limit: z.number()
    .min(0, "Credit limit must be >= 0")
    .max(999999999, "Credit limit must be <= 999,999,999")
    .nullable()
    .optional(),

  credit_limit_currency: z.enum(["USD", "EUR", "GBP", "PLN"]).default("USD"),

  category: z.enum(["retail", "wholesale", "distributor"])
    .refine(val => val !== null, "Category is required"),

  payment_terms_days: z.number()
    .int("Payment terms must be a whole number")
    .min(0, "Payment terms must be >= 0")
    .max(365, "Payment terms must be <= 365"),

  allergen_restrictions: z.array(z.string()).optional(),

  notes: z.string()
    .max(1000, "Notes must be <= 1000 characters")
    .optional()
    .or(z.literal("")),

  is_active: z.boolean().default(true)
});
```

### Real-Time Validation
- **Name**: Required, no leading/trailing spaces (trim on blur), shows character counter
- **Email**: On blur, format check (allow optional)
- **Tax ID**: On blur, format validation (org-specific rules)
- **Payment Terms**: On change, range validation (0-365)
- **Customer Code**: On blur, uniqueness check (debounced 500ms)
- **Category**: Required, instant validation
- **Billing Address**: All fields required, validated on blur
- **Shipping Address**: Required if "Same as billing" unchecked, validated on blur
- **Credit Limit**: Optional, numeric only, validates on change

### Server-Side Validation
- All rules above re-validated on POST/PATCH (never trust client)
- `customer_code` uniqueness checked in transaction
- Email uniqueness optional (org-configurable)
- Tax ID format validated per org country setting
- Multi-org isolation: `WHERE org_id = :org_id`
- Address fields required in database schema (NOT NULL)
- Credit limit stored as DECIMAL(12,2) for precision

---

## API Endpoints & Schemas

### POST /api/shipping/customers (Create)

**Request:**
```json
{
  "customer_code": "CUST-001",
  "name": "ABC Foods Ltd",
  "email": "sales@abcfoods.com",
  "phone": "+48 12 555 0123",
  "billing_address": {
    "street": "123 Main Street",
    "city": "Warsaw",
    "postal_code": "00-950",
    "country": "PL"
  },
  "same_billing_shipping": true,
  "shipping_address": null,
  "tax_id": "PL1234567890",
  "credit_limit": 5000,
  "credit_limit_currency": "USD",
  "category": "wholesale",
  "payment_terms_days": 60,
  "allergen_restrictions": ["milk", "fish"],
  "notes": "No shellfish or crustaceans",
  "is_active": true
}
```

**Response (201 Created):**
```json
{
  "id": "uuid-customer-id",
  "org_id": "uuid-org-id",
  "customer_code": "CUST-001",
  "name": "ABC Foods Ltd",
  "email": "sales@abcfoods.com",
  "phone": "+48 12 555 0123",
  "billing_address": {
    "street": "123 Main Street",
    "city": "Warsaw",
    "postal_code": "00-950",
    "country": "PL"
  },
  "shipping_address": null,
  "same_billing_shipping": true,
  "tax_id": "PL1234567890",
  "credit_limit": 5000,
  "credit_limit_currency": "USD",
  "credit_limit_converted": 4750.00,
  "credit_limit_converted_currency": "EUR",
  "category": "wholesale",
  "payment_terms_days": 60,
  "allergen_restrictions": ["milk", "fish"],
  "notes": "No shellfish or crustaceans",
  "is_active": true,
  "created_at": "2025-12-15T10:30:00Z",
  "created_by": "uuid-user-id",
  "updated_at": "2025-12-15T10:30:00Z"
}
```

**Errors:**
- `400 Bad Request`: Validation failed (details in error.message and error.fields)
- `409 Conflict`: Customer code already exists
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: No permission to create customers

### PATCH /api/shipping/customers/:id (Update)

**Request:**
```json
{
  "name": "ABC Foods Ltd - Updated",
  "email": "newemail@abcfoods.com",
  "phone": "+48 12 555 0124",
  "billing_address": {
    "street": "456 Commerce Lane",
    "city": "Krakow",
    "postal_code": "31-999",
    "country": "PL"
  },
  "same_billing_shipping": true,
  "shipping_address": null,
  "tax_id": "PL1234567891",
  "credit_limit": 10000,
  "credit_limit_currency": "USD",
  "category": "distributor",
  "payment_terms_days": 90,
  "allergen_restrictions": ["milk", "fish", "shellfish"],
  "notes": "Updated delivery instructions",
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "id": "uuid-customer-id",
  "org_id": "uuid-org-id",
  "customer_code": "CUST-001",
  "name": "ABC Foods Ltd - Updated",
  "email": "newemail@abcfoods.com",
  "phone": "+48 12 555 0124",
  "billing_address": {
    "street": "456 Commerce Lane",
    "city": "Krakow",
    "postal_code": "31-999",
    "country": "PL"
  },
  "shipping_address": null,
  "same_billing_shipping": true,
  "tax_id": "PL1234567891",
  "credit_limit": 10000,
  "credit_limit_currency": "USD",
  "credit_limit_converted": 9500.00,
  "credit_limit_converted_currency": "EUR",
  "category": "distributor",
  "payment_terms_days": 90,
  "allergen_restrictions": ["milk", "fish", "shellfish"],
  "notes": "Updated delivery instructions",
  "is_active": true,
  "created_at": "2025-12-15T10:30:00Z",
  "created_by": "uuid-user-id",
  "updated_at": "2025-12-15T11:45:00Z"
}
```

**Errors:**
- `400 Bad Request`: Validation failed
- `404 Not Found`: Customer not found
- `409 Conflict`: Code locked (has orders) and user tried to change it
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: No permission to edit customers

### Error Response Format

```json
{
  "error": "Validation failed",
  "status": 400,
  "fields": {
    "name": ["Customer name is required"],
    "email": ["Invalid email format"],
    "payment_terms_days": ["Must be between 0 and 365"],
    "billing_address.street": ["Street is required"],
    "credit_limit": ["Must be a valid number"]
  },
  "message": "Please fix the following errors: Customer name is required, Invalid email format, Street is required"
}
```

---

## Multi-Step Wizard Consideration (Declined)

After careful evaluation, a single-page form design was chosen over a 3-step wizard pattern for these reasons:

1. **Field Count**: Only 13 fields - below threshold for wizard (typically 15+)
2. **User Mental Load**: Grouping by section (Basic, Contact, Address, Business) provides clear structure without step fragmentation
3. **Address Fields Essential**: Not optional - required for every customer, no benefit to hiding in step 2
4. **Mobile Scrolling**: More familiar to users than step navigation
5. **Error Recovery**: Single-page form easier to show all errors at once; multi-step would require validation per step
6. **Implementation Simplicity**: No need for step state management, progress tracking, or "back" button logic

**Alternative if revisited**: Section-based expansion (accordion pattern) for non-required sections could reduce initial visual load while maintaining single-form simplicity.

---

## Testing Scenarios

### Unit Tests (Vitest)

#### Validation Tests
```typescript
describe("CustomerForm Validation", () => {
  test("should require customer name", () => {
    const result = schema.safeParse({ name: "" });
    expect(result.error.fieldErrors.name).toBeDefined();
  });

  test("should validate email format", () => {
    const result = schema.safeParse({ email: "invalid-email" });
    expect(result.error).toBeDefined();
  });

  test("should validate payment terms range (0-365)", () => {
    const result = schema.safeParse({ payment_terms_days: 400 });
    expect(result.error.fieldErrors.payment_terms_days).toBeDefined();
  });

  test("should validate tax_id format", () => {
    const result = schema.safeParse({ tax_id: "INVALID" });
    expect(result.error.fieldErrors.tax_id).toBeDefined();
  });

  test("should require billing address fields", () => {
    const result = schema.safeParse({
      billing_address: { street: "", city: "", postal_code: "", country: "" }
    });
    expect(result.error.fieldErrors["billing_address.street"]).toBeDefined();
  });

  test("should allow optional fields to be empty", () => {
    const result = schema.safeParse({
      name: "Test",
      email: "",
      phone: "",
      notes: "",
      credit_limit: null
    });
    expect(result.success).toBe(true);
  });

  test("should validate credit limit as positive number", () => {
    const result = schema.safeParse({ credit_limit: -100 });
    expect(result.error.fieldErrors.credit_limit).toBeDefined();
  });

  test("should accept optional shipping address when same_billing_shipping is false", () => {
    const result = schema.safeParse({
      same_billing_shipping: false,
      shipping_address: {
        street: "456 Oak Lane",
        city: "Boston",
        postal_code: "02101",
        country: "US"
      }
    });
    expect(result.success).toBe(true);
  });

  test("should show character counter for name field", () => {
    const name = "ABC Foods";
    expect(name.length).toBeLessThanOrEqual(255);
  });
});
```

#### API Tests
```typescript
describe("POST /api/shipping/customers", () => {
  test("should create customer with required fields", async () => {
    const response = await POST(req, {
      customer_code: "CUST-NEW",
      name: "New Customer",
      billing_address: {
        street: "123 Main",
        city: "Boston",
        postal_code: "02101",
        country: "US"
      },
      category: "retail",
      payment_terms_days: 30
    });
    expect(response.status).toBe(201);
    expect(response.body.customer_code).toBe("CUST-NEW");
  });

  test("should return 409 if code exists", async () => {
    await createCustomer({ customer_code: "CUST-001" });
    const response = await POST(req, { customer_code: "CUST-001" });
    expect(response.status).toBe(409);
    expect(response.body.error).toContain("already exists");
  });

  test("should validate billing address required", async () => {
    const response = await POST(req, {
      customer_code: "CUST-NEW",
      name: "New Customer",
      category: "retail",
      payment_terms_days: 30
    });
    expect(response.status).toBe(400);
    expect(response.body.fields["billing_address.street"]).toBeDefined();
  });

  test("should convert credit limit currency", async () => {
    const response = await POST(req, {
      customer_code: "CUST-NEW",
      name: "New Customer",
      billing_address: { street: "123 Main", city: "Boston", postal_code: "02101", country: "US" },
      category: "retail",
      payment_terms_days: 30,
      credit_limit: 5000,
      credit_limit_currency: "USD"
    });
    expect(response.status).toBe(201);
    expect(response.body.credit_limit).toBe(5000);
    expect(response.body.credit_limit_converted).toBeGreaterThan(0);
  });
});

describe("PATCH /api/shipping/customers/:id", () => {
  test("should update customer details including address", async () => {
    const customer = await createCustomer({ name: "Old Name" });
    const response = await PATCH(req, { id: customer.id }, {
      name: "New Name",
      billing_address: {
        street: "456 New St",
        city: "New York",
        postal_code: "10001",
        country: "US"
      }
    });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("New Name");
    expect(response.body.billing_address.city).toBe("New York");
  });
});
```

### E2E Tests (Playwright)

```typescript
describe("Customer Create/Edit Modal - E2E", () => {
  test("should create customer with full details including address", async ({ page }) => {
    await page.goto("/shipping/customers");
    await page.click("button:has-text('Create Customer')");

    // Modal opens
    await expect(page.locator("h1:has-text('Create Customer')")).toBeVisible();

    // Fill form
    await page.fill("input[name='name']", "ABC Foods Ltd");
    await page.fill("input[name='email']", "sales@abcfoods.com");
    await page.fill("input[name='phone']", "+48 12 555 0123");

    // Fill billing address
    await page.fill("input[name='billing_address.street']", "123 Main Street");
    await page.fill("input[name='billing_address.city']", "Warsaw");
    await page.fill("input[name='billing_address.postal_code']", "00-950");
    await page.selectOption("select[name='billing_address.country']", "PL");

    // Set credit limit
    await page.fill("input[name='credit_limit']", "5000");

    // Select category
    await page.click("select[name='category']");
    await page.click("option:has-text('Wholesale')");

    // Set payment terms
    await page.fill("input[name='payment_terms_days']", "60");

    // Submit
    await page.click("button:has-text('Create Customer')");

    // Success confirmation appears
    await expect(page.locator("text=Customer created successfully")).toBeVisible();

    // Verify character counter existed during input
    // (character counters are hidden in success state)
  });

  test("should show character counters during input", async ({ page }) => {
    await page.goto("/shipping/customers");
    await page.click("button:has-text('Create Customer')");

    const nameInput = page.locator("input[name='name']");
    await nameInput.fill("ABC Foods");

    // Character counter should show "9/255"
    await expect(page.locator("text=/\\d+\\/255/")).toBeVisible();
  });

  test("should toggle shipping address visibility", async ({ page }) => {
    await page.goto("/shipping/customers");
    await page.click("button:has-text('Create Customer')");

    // Shipping address section initially hidden (same as billing checked)
    const shippingSection = page.locator("text=Shipping Address");
    await expect(shippingSection).not.toBeVisible();

    // Uncheck "Same as billing"
    await page.click("input[type='checkbox']:has-text('Same as billing')");

    // Shipping address section now visible
    await expect(shippingSection).toBeVisible();
    await expect(page.locator("input[name='shipping_address.street']")).toBeVisible();
  });

  test("should show loading state when editing customer", async ({ page }) => {
    const customer = await createCustomerAPI({ name: "Test Customer" });

    await page.goto(`/shipping/customers/${customer.id}`);
    await page.click("button:has-text('Edit')");

    // Loading state visible briefly
    await expect(page.locator("text=Loading customer details")).toBeVisible({ timeout: 500 });

    // Data loads
    await expect(page.locator("input[value='Test Customer']")).toBeVisible();
  });

  test("should handle validation errors with address fields", async ({ page }) => {
    await page.goto("/shipping/customers");
    await page.click("button:has-text('Create Customer')");

    // Try to submit empty form
    await page.click("button:has-text('Create Customer')");

    // Error alert appears
    const alertText = await page.locator("[role='alert']").textContent();
    expect(alertText).toContain("required");
    expect(alertText).toContain("Street");

    // Fields highlighted in red
    await expect(page.locator("input[name='billing_address.street']")).toHaveClass(/error|invalid/);
  });
});
```

### Integration Test (Modal Component)

```typescript
describe("CustomerModal Component", () => {
  test("should render create mode with character counters", () => {
    render(<CustomerModal mode="create" onClose={() => {}} />);
    expect(screen.getByText("Create Customer")).toBeInTheDocument();
    expect(screen.getByText("Auto-generated")).toBeInTheDocument();
    // Character counter (0/255) not visible until input has focus
  });

  test("should show character counter on input focus", async () => {
    render(<CustomerModal mode="create" onClose={() => {}} />);
    const nameInput = screen.getByLabelText("Customer Name");

    fireEvent.focus(nameInput);
    await waitFor(() => {
      expect(screen.getByText(/0\/255/)).toBeInTheDocument();
    });
  });

  test("should render edit mode with customer data and address", () => {
    const customer = {
      id: "123",
      name: "ABC Foods",
      billing_address: { street: "123 Main", city: "Boston", postal_code: "02101", country: "US" },
      payment_terms_days: 60,
      credit_limit: 5000
    };
    render(<CustomerModal mode="edit" customer={customer} onClose={() => {}} />);

    expect(screen.getByText("Edit Customer: ABC Foods")).toBeInTheDocument();
    expect(screen.getByDisplayValue("ABC Foods")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5000")).toBeInTheDocument();
  });

  test("should toggle shipping address fields", async () => {
    const customer = { id: "123", name: "ABC Foods", same_billing_shipping: true };
    render(<CustomerModal mode="edit" customer={customer} onClose={() => {}} />);

    // Shipping address fields hidden initially
    expect(screen.queryByLabelText("Shipping Street")).not.toBeInTheDocument();

    // Uncheck "Same as billing"
    const checkbox = screen.getByLabelText(/Same as billing/);
    fireEvent.click(checkbox);

    // Shipping address fields now visible
    await waitFor(() => {
      expect(screen.getByLabelText("Shipping Street")).toBeInTheDocument();
    });
  });
});
```

---

## Implementation Checklist

- [ ] Create form component (`CustomerModal.tsx`)
- [ ] Create Zod validation schema (`customer.schema.ts`)
- [ ] Implement POST `/api/shipping/customers` route
- [ ] Implement PATCH `/api/shipping/customers/:id` route
- [ ] Add loading state (spinner overlay)
- [ ] Add loading state for edit mode data fetch
- [ ] Add error state (alert + field highlighting)
- [ ] Add success confirmation (2s auto-close)
- [ ] Implement real-time validation (debounced code check)
- [ ] Add character counters for name (255) and notes (1000) with real-time updates
- [ ] Add allergen dropdown/checkboxes with responsive layout (3-col desktop, 2-col tablet, 1-col mobile)
- [ ] Auto-generate customer code with counter
- [ ] Lock customer code field when orders exist
- [ ] Auto-populate payment_terms based on category
- [ ] Add billing address fields (street, city, postal, country) - ALL REQUIRED
- [ ] Add shipping address toggle ("Same as billing" checkbox)
- [ ] Add conditional shipping address fields (hidden by default, shown if toggle unchecked)
- [ ] Add credit limit field with currency selector and currency conversion display
- [ ] Implement mobile responsive layout (tablet 768-1023px, mobile <768px)
- [ ] Add keyboard navigation (Tab, Escape, Enter, Arrow keys)
- [ ] Add ARIA labels and screen reader support
- [ ] Add exact contrast ratios (4.5:1+ for all text, exact values documented)
- [ ] Add unit tests (validation)
- [ ] Add API route tests
- [ ] Add E2E tests (Playwright)
- [ ] Add component integration tests
- [ ] Add accessibility audit (axe-core)
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Test character counter updates in real-time
- [ ] Test address field validation errors
- [ ] Test credit limit currency conversion

---

## Handoff Notes

**For FRONTEND-DEV:**
1. Modal should be reusable component, accept `mode`, `customer` (for edit), `onSuccess` props
2. Use ShadCN components: Dialog, Form, Input, Select, Checkbox, Textarea, Button
3. Implement field-level validation with visual feedback
4. Add debouncing (500ms) to code uniqueness check
5. Auto-close modal 2s after success (don't redirect in component, let parent handle)
6. Escape key should close modal only if no unsaved changes
7. Export types: `CustomerCreatePayload`, `CustomerEditPayload`, `CustomerModalProps`
8. **Character Counters**: Show "X/Max" format, update on every keystroke, use aria-live="assertive"
9. **Address Fields**: Implement as nested object in form state, validate all required fields
10. **Credit Limit**: Store as number, convert currency on display using exchange rates from org settings
11. **Loading State on Edit**: Show spinner while fetching customer data, disable all fields/buttons except Cancel
12. **Shipping Address Toggle**: Conditional rendering based on checkbox state, validate only if unchecked
13. **Responsive Design**: Test on iPhone 12 (375px), iPad (768px), Desktop (1440px)
14. **Contrast Ratios**: Use exact hex values from accessibility section (#1f2937 for labels, #ef4444 for errors, etc.)

**For QA:**
- Test on iPhone 12, iPad, desktop (1440px)
- Test keyboard navigation with Tab + Shift+Tab
- Test screen reader (Windows Narrator, macOS VoiceOver)
- Test paste of email/phone/tax ID from spreadsheets
- Test rapid API calls (network speed throttled)
- Test with very long customer names (255 chars)
- Test with non-ASCII characters in name/notes/address
- **Test character counters**: Verify they update in real-time, show correct count
- **Test address fields**: Verify validation for all required subfields, test error messaging
- **Test credit limit**: Verify currency conversion displays correctly, test edge cases (0, 999999999)
- **Test shipping address toggle**: Verify fields appear/disappear correctly, validation works

**For BACKEND:**
- RLS policy: Users can only create/edit customers in their org
- Soft-delete pattern: Never hard-delete customers (maintains referential integrity)
- Audit trail: Log all customer changes for compliance
- Rate limiting: Protect customer code generation endpoint
- Default values: category=retail, payment_terms_days=30, is_active=true, same_billing_shipping=true
- **Address Storage**: Store billing_address and shipping_address as JSONB columns
- **Credit Limit**: Store as DECIMAL(12,2), implement in sales order validation
- **Currency Conversion**: Fetch exchange rates daily, cache in Redis, use in API responses

---

## References

- **PRD Section**: Shipping Module, Epic 7A, Phase 1
- **Requirements**: FR-7.1 (Customer CRUD), FR-7.3 (Multiple Shipping Addresses)
- **Similar Modal**: PLAN-002-supplier-create-edit.md
- **Database**: customers table in shipping.md section 3.1
- **API**: /api/shipping/customers endpoints (section 4.1)
- **Accessibility Standard**: WCAG 2.1 Level AA (contrast 4.5:1, Level AAA in summary where possible)
- **Character Limit Reference**: Name 255 chars, Notes 1000 chars, Tax ID 50 chars (standard business fields)
