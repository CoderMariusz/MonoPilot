# TEC-014: Shelf Life Configuration

**Module**: Technical
**Feature**: Shelf Life Management (Story 2.90-2.93)
**Type**: Modal Dialog
**Status**: Ready for Review
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (View/Edit Mode)

```
┌──────────────────────────────────────────────────────────────────┐
│  Shelf Life Configuration: Bread Loaf White            [X]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Product: Bread Loaf White (SKU: BREAD-001)                     │
│  BOM Version: 2.1    Effective: 2024-01-15                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Calculated Shelf Life                                     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Calculation Method: Minimum from Ingredients              │ │
│  │                                                            │ │
│  │  Shortest Ingredient: Yeast Fresh (14 days)                │ │
│  │  Processing Impact: -2 days (heat treatment)               │ │
│  │  Safety Buffer: -2 days (20%)                              │ │
│  │                                                            │ │
│  │  Calculated Shelf Life:    10 days                         │ │
│  │                                                            │ │
│  │  [Recalculate from Ingredients]                            │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Final Shelf Life (Override)                               │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  ○ Use Calculated Value (10 days)                          │ │
│  │  ● Manual Override                                         │ │
│  │                                                            │ │
│  │  Shelf Life Days *                                         │ │
│  │  [7__________________]  days                               │ │
│  │                                                            │ │
│  │  Override Reason *                                         │ │
│  │  [Market standard for fresh bread is 7 days___________]    │ │
│  │  [________________________________________________]         │ │
│  │                                                            │ │
│  │  ⚠ Override is 3 days shorter than calculated             │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Storage Conditions                                        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Temperature Range *                                       │ │
│  │  Min: [18__] °C    Max: [25__] °C                          │ │
│  │                                                            │ │
│  │  Humidity Range                                            │ │
│  │  Min: [40__] %     Max: [60__] %                           │ │
│  │                                                            │ │
│  │  Special Conditions                                        │ │
│  │  ☑ Keep in original packaging                              │ │
│  │  ☑ Protect from direct sunlight                            │ │
│  │  ☐ Refrigeration required                                  │ │
│  │  ☐ Freezing allowed                                        │ │
│  │  ☐ Controlled atmosphere                                   │ │
│  │                                                            │ │
│  │  Storage Instructions (Label Text)                         │ │
│  │  [Store in a cool, dry place. Keep away from direct_____] │ │
│  │  [sunlight. Once opened, consume within 2 days.________]  │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Best Before Calculation                                   │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Shelf Life Mode *                                         │ │
│  │  ● Fixed Days (from production date)                       │ │
│  │  ○ Rolling (from ingredient receipt)                       │ │
│  │                                                            │ │
│  │  Label Format *                                            │ │
│  │  ● Best Before: DD/MM/YYYY                                 │ │
│  │  ○ Best Before End: MM/YYYY                                │ │
│  │  ○ Use By: DD/MM/YYYY (for high-risk foods)                │ │
│  │                                                            │ │
│  │  Example Production Date: 2025-12-11                       │ │
│  │  Example Best Before: 2025-12-18 (7 days)                  │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  FIFO/FEFO Settings                                        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Picking Strategy *                                        │ │
│  │  ○ FIFO (First In, First Out)                              │ │
│  │  ● FEFO (First Expired, First Out)                         │ │
│  │                                                            │ │
│  │  Minimum Remaining Shelf Life for Shipment                 │ │
│  │  [5__] days    (71% of total shelf life)                   │ │
│  │                                                            │ │
│  │  ⚠ Products with <5 days shelf life cannot be shipped     │ │
│  │                                                            │ │
│  │  Enforcement Level *                                       │ │
│  │  ○ Suggest (show warning, allow override)                  │ │
│  │  ● Warn (require confirmation to proceed)                  │ │
│  │  ○ Block (prevent shipment entirely)                       │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Ingredient Shelf Lives (Reference)                        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Ingredient            Days    Storage Temp    Notes       │ │
│  │  ────────────────────────────────────────────────────────  │ │
│  │  Flour Type 550        180     18-25°C        Dry storage │ │
│  │  Yeast Fresh           14      2-8°C          Refrigerate │ │
│  │  Butter                60      2-8°C          Refrigerate │ │
│  │  Milk Powder           365     18-25°C        Sealed      │ │
│  │  Packaging Film        730     18-25°C        As received │ │
│  │                                                            │ │
│  │  Shortest: Yeast Fresh (14 days)                           │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Last Updated: 2025-12-10 14:23    By: Jan Kowalski            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Cancel]                                        [Save Changes]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Success State (Ingredient Shelf Life Config)

```
┌──────────────────────────────────────────────────────────────────┐
│  Shelf Life Configuration: Flour Type 550                [X]     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Product Type: Raw Material                                     │
│  SKU: RM-FLOUR-550                                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Shelf Life Settings                                       │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Shelf Life Days *                                         │ │
│  │  [180_________________]  days (6 months)                   │ │
│  │                                                            │ │
│  │  Shelf Life Source *                                       │ │
│  │  ● Supplier Specification                                  │ │
│  │  ○ Internal Testing                                        │ │
│  │  ○ Regulatory Standard                                     │ │
│  │  ○ Industry Standard                                       │ │
│  │                                                            │ │
│  │  Supplier Name                                             │ │
│  │  [ABC Flour Mills Ltd._____________________________]       │ │
│  │                                                            │ │
│  │  Specification Reference                                   │ │
│  │  [SPEC-FL550-2024-v2.1_____________________________]       │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Storage Conditions                                        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Temperature Range *                                       │ │
│  │  Min: [18__] °C    Max: [25__] °C                          │ │
│  │                                                            │ │
│  │  Humidity Range *                                          │ │
│  │  Min: [30__] %     Max: [50__] %                           │ │
│  │                                                            │ │
│  │  Special Conditions                                        │ │
│  │  ☑ Keep in original packaging                              │ │
│  │  ☑ Protect from moisture                                   │ │
│  │  ☑ Protect from pests                                      │ │
│  │  ☐ Refrigeration required                                  │ │
│  │  ☐ Freezing allowed                                        │ │
│  │                                                            │ │
│  │  Storage Location Type                                     │ │
│  │  [Dry storage warehouse________________________]           │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Receiving & Quality Checks                                │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Minimum Acceptable Remaining Shelf Life on Receipt        │ │
│  │  [150_] days    (83% of total shelf life)                  │ │
│  │                                                            │ │
│  │  ⚠ Reject deliveries with <150 days remaining             │ │
│  │                                                            │ │
│  │  Quarantine Required on Receipt                            │ │
│  │  ● Yes    ○ No                                             │ │
│  │                                                            │ │
│  │  Quarantine Duration: [2__] days                           │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Last Updated: 2025-12-05 09:15    By: Anna Nowak              │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Cancel]                                        [Save Changes]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────────────────────┐
│  Shelf Life Configuration: Bread Loaf White            [X]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                          [Spinner Icon]                          │
│                                                                  │
│                  Calculating Shelf Life...                       │
│                                                                  │
│  Analyzing ingredient shelf lives...                             │
│  Calculating processing impact...                                │
│  Applying safety buffers...                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────────────────────────────┐
│  Shelf Life Configuration: Bread Loaf White            [X]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠ Error: Cannot save shelf life configuration                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Calculated Shelf Life                                     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Calculation Method: Minimum from Ingredients              │ │
│  │                                                            │ │
│  │  ❌ Cannot calculate - missing ingredient data:            │ │
│  │  - Yeast Fresh (no shelf life configured)                  │ │
│  │  - Butter (no shelf life configured)                       │ │
│  │                                                            │ │
│  │  [Configure Ingredient Shelf Lives]                        │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Final Shelf Life (Override)                               │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  ○ Use Calculated Value (N/A)                              │ │
│  │  ● Manual Override                                         │ │
│  │                                                            │ │
│  │  Shelf Life Days *                                         │ │
│  │  [____________________]  days                              │ │
│  │  ❌ Required field                                          │ │
│  │                                                            │ │
│  │  Override Reason *                                         │ │
│  │  [__________________________________________________]      │ │
│  │  ❌ Required when using manual override                    │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Storage Conditions                                        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                            │ │
│  │  Temperature Range *                                       │ │
│  │  Min: [35__] °C    Max: [25__] °C                          │ │
│  │  ❌ Minimum cannot be greater than maximum                 │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Cancel]                                        [Save Changes]  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────────────┐
│  Shelf Life Configuration: New Product XYZ             [X]       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      [Calendar Icon]                             │
│                                                                  │
│              No Shelf Life Configuration                         │
│                                                                  │
│  This product doesn't have shelf life settings configured yet.  │
│                                                                  │
│  Options:                                                        │
│  1. Calculate from ingredients (if BOM exists)                   │
│  2. Set manually based on testing or regulations                 │
│                                                                  │
│              [Calculate from Ingredients]                        │
│                                                                  │
│                  [Set Manually]                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Calculated Shelf Life Section
- **Calculation Method**: Shows how shelf life is determined
  - "Minimum from Ingredients" (most common)
  - "Manual Testing" (lab results)
  - "Regulatory Standard" (e.g., FDA guidelines)
- **Shortest Ingredient**: Identifies bottleneck ingredient
- **Processing Impact**: Reduction due to heat, mixing, etc. (configurable)
- **Safety Buffer**: % reduction for safety margin (default 20%)
- **Calculated Result**: Final calculated days
- **Recalculate Button**: Re-run calculation with latest ingredient data

### 2. Final Shelf Life (Override) Section
- **Use Calculated**: Radio option to use auto-calculated value
- **Manual Override**: Radio option to enter custom value
- **Shelf Life Days**: Numeric input (required if override selected)
- **Override Reason**: Text area (required if override selected)
- **Warning Indicator**: Shows if override differs significantly from calculated

### 3. Storage Conditions Section
- **Temperature Range**: Min/Max in Celsius (or Fahrenheit based on org settings)
- **Humidity Range**: Min/Max percentage (optional)
- **Special Conditions**: Multi-select checkboxes
  - Keep in original packaging
  - Protect from direct sunlight
  - Refrigeration required
  - Freezing allowed
  - Controlled atmosphere
- **Storage Instructions**: Free text for label printing
- **Touch Target**: All checkboxes >= 48x48dp

### 4. Best Before Calculation Section
- **Shelf Life Mode**:
  - **Fixed Days**: Best before = production date + shelf life days
  - **Rolling**: Best before = earliest ingredient expiry - processing time
- **Label Format**:
  - Best Before: DD/MM/YYYY (most common)
  - Best Before End: MM/YYYY (for long shelf life products)
  - Use By: DD/MM/YYYY (for perishable/high-risk foods)
- **Example Calculation**: Shows sample dates for clarity

### 5. FIFO/FEFO Settings Section
- **Picking Strategy**:
  - FIFO: First In, First Out (by receipt date)
  - FEFO: First Expired, First Out (by expiry date)
- **Minimum Remaining Shelf Life**: Days required for shipment
- **Enforcement Level**:
  - Suggest: Show warning, allow override
  - Warn: Require confirmation
  - Block: Prevent shipment entirely
- **Warning Message**: Explains shipment restriction

### 6. Ingredient Shelf Lives (Reference)
- **Read-only table**: Shows all BOM ingredients
- **Columns**: Ingredient name, days, storage temp, notes
- **Shortest Highlight**: Highlights ingredient with shortest shelf life
- **Click to Edit**: Clicking ingredient opens its config modal

### 7. Ingredient-Specific Config (Separate Modal)
- **Shelf Life Days**: Numeric input
- **Shelf Life Source**: Dropdown (Supplier, Internal Testing, Regulatory, Industry)
- **Supplier Name**: Text input
- **Specification Reference**: Text input (document number)
- **Minimum Acceptable on Receipt**: Days required when receiving
- **Quarantine Settings**: Yes/No, duration in days

---

## Main Actions

### Primary Actions
- **Save Changes** (Product Config):
  - Validates all required fields
  - Validates temperature range (min < max)
  - If manual override: requires override_reason
  - Calls `PUT /api/technical/shelf-life/products/:id`
  - Updates product_shelf_life table
  - Updates products.shelf_life_days
  - Closes modal
  - Toast: "Shelf life configuration saved successfully"
  - Refreshes parent product detail view

- **Save Changes** (Ingredient Config):
  - Validates required fields
  - Calls `POST /api/technical/shelf-life/ingredients/:id`
  - Updates products.shelf_life_days for ingredient
  - Triggers recalculation for all products using this ingredient
  - Closes modal
  - Toast: "Ingredient shelf life updated. 5 products affected."

### Secondary Actions
- **Recalculate from Ingredients**:
  - Fetches all BOM ingredient shelf lives
  - Finds shortest shelf life
  - Applies processing impact reduction
  - Applies safety buffer
  - Updates calculated_days field
  - Highlights changed value
  - Toast: "Shelf life recalculated: 10 days → 8 days"

- **Calculate from Ingredients** (Empty State):
  - Same as Recalculate
  - Sets mode to "Use Calculated"
  - Pre-fills form with calculated values

- **Set Manually** (Empty State):
  - Sets mode to "Manual Override"
  - Focuses on Shelf Life Days input
  - Requires override reason

- **Configure Ingredient Shelf Lives** (Error State):
  - Opens ingredient shelf life config modal for missing ingredients
  - After saving, returns to product config and recalculates

- **Cancel**: Closes modal without saving

---

## 4 States (One-Line)

- **Loading**: Spinner + "Calculating Shelf Life..." while fetching ingredient data and running calculation
- **Empty**: "No Shelf Life Configuration" with options to calculate or set manually
- **Error**: Red banner + inline field errors (missing ingredient data, invalid temp range, missing override reason)
- **Success**: Form populated with calculated/override values, storage conditions, FIFO/FEFO settings

---

## Validation Rules

| Field | Rules |
|-------|-------|
| Shelf Life Days | Required, positive integer, 1-3650 days (10 years max) |
| Override Reason | Required if manual override selected, 10-500 chars |
| Temperature Min | Required, -40 to 100°C, must be < max |
| Temperature Max | Required, -40 to 100°C, must be > min |
| Humidity Min | Optional, 0-100%, must be < max if provided |
| Humidity Max | Optional, 0-100%, must be > min if provided |
| Storage Instructions | Optional, max 500 chars |
| Minimum Shelf Life for Shipment | Optional, 0 to shelf_life_days |
| Picking Strategy | Required, FIFO or FEFO |
| Enforcement Level | Required, Suggest/Warn/Block |
| Shelf Life Source | Required for ingredients |
| Minimum on Receipt | Required for ingredients, 1 to shelf_life_days |
| Quarantine Duration | Required if quarantine enabled, 1-30 days |

**Validation Timing**:
- On blur: Immediate validation for temp/humidity ranges
- On override toggle: Show/hide override reason field
- On save: All fields validated before API call

---

## Accessibility

- **Touch Targets**: All inputs, checkboxes, radio buttons >= 48x48dp
- **Contrast**: Warning text (#F59E0B), error text (#DC2626) pass WCAG AA
- **Screen Reader**: Announces "Shelf Life Configuration Modal", field labels, validation errors
- **Keyboard**: Tab navigation, Escape closes modal, Enter submits form
- **Focus**: Auto-focus on first input (Shelf Life Days if override, Recalculate button if calculated)
- **ARIA**: Radio groups properly labeled, validation messages associated with fields

---

## Technical Notes

### API Endpoints
- **Get Product Shelf Life**: `GET /api/technical/shelf-life/products/:id`
- **Calculate**: `POST /api/technical/shelf-life/products/:id/calculate`
- **Update/Override**: `PUT /api/technical/shelf-life/products/:id`
- **Get Ingredient Shelf Life**: `GET /api/technical/shelf-life/ingredients/:id`
- **Update Ingredient**: `POST /api/technical/shelf-life/ingredients/:id`

### Calculation Logic
```typescript
// Product Shelf Life Calculation
const ingredientShelfLives = await getIngredientShelfLives(bomId);
const shortestShelfLife = Math.min(...ingredientShelfLives.map(i => i.days));
const shortestIngredient = ingredientShelfLives.find(i => i.days === shortestShelfLife);

const processingImpact = getProcessingImpact(productId); // e.g., -2 days for heat
const safetyBufferPercent = getSafetyBuffer(productId); // e.g., 20%
const safetyBufferDays = Math.floor(shortestShelfLife * (safetyBufferPercent / 100));

const calculatedDays = shortestShelfLife + processingImpact - safetyBufferDays;

// Best Before Date Calculation
const productionDate = new Date();
const bestBeforeDate = new Date(productionDate);
bestBeforeDate.setDate(bestBeforeDate.getDate() + shelfLifeDays);

// FEFO Shipment Check
const remainingDays = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
const canShip = remainingDays >= minimumRemainingShelfLife;
```

### Data Structure
```typescript
// Product Shelf Life
{
  product_id: string;
  calculated_days: number;
  override_days: number | null;
  final_days: number; // override_days || calculated_days
  calculation_method: 'min_ingredient' | 'manual_testing' | 'regulatory';
  shortest_ingredient_id: string | null;
  processing_impact_days: number;
  safety_buffer_percent: number;
  override_reason: string | null;
  storage_temp_min: number;
  storage_temp_max: number;
  storage_humidity_min: number | null;
  storage_humidity_max: number | null;
  storage_conditions: string[]; // checkboxes
  storage_instructions: string;
  shelf_life_mode: 'fixed' | 'rolling';
  label_format: 'best_before_day' | 'best_before_month' | 'use_by';
  picking_strategy: 'FIFO' | 'FEFO';
  min_remaining_for_shipment: number;
  enforcement_level: 'suggest' | 'warn' | 'block';
  calculated_at: Date;
  created_by: string;
  updated_at: Date;
  updated_by: string;
}

// Ingredient Shelf Life
{
  product_id: string; // for raw materials
  shelf_life_days: number;
  shelf_life_source: 'supplier' | 'internal' | 'regulatory' | 'industry';
  supplier_name: string | null;
  specification_reference: string | null;
  storage_temp_min: number;
  storage_temp_max: number;
  storage_humidity_min: number | null;
  storage_humidity_max: number | null;
  storage_conditions: string[];
  storage_location_type: string;
  min_acceptable_on_receipt: number;
  quarantine_required: boolean;
  quarantine_duration_days: number | null;
  updated_at: Date;
  updated_by: string;
}
```

### Recalculation Triggers
- **Ingredient shelf life change**: Auto-recalculate all products using that ingredient
- **BOM change**: Mark shelf life as outdated, suggest recalculation
- **Processing impact change**: Recalculate affected products
- **Safety buffer change**: Recalculate affected products

### Integration with FIFO/FEFO
- **Warehouse Module**: Uses shelf_life_days for expiry date calculation
- **Picking**: FEFO uses expiry date (production_date + shelf_life_days)
- **Receiving**: Checks min_acceptable_on_receipt on GRN
- **Shipping**: Enforces min_remaining_for_shipment per enforcement_level

---

## Related Screens

- **Product Detail**: Parent screen with shelf life summary
- **BOM Detail**: Shows ingredient shelf lives
- **Cost History**: Related to shelf life changes affecting cost
- **Warehouse Receiving**: Validates minimum remaining shelf life
- **Shipping Pick Lists**: Uses FEFO with minimum remaining shelf life

---

## Business Rules

### Calculation Rules
1. **Minimum Ingredient Method** (Default):
   - Find shortest shelf life among all BOM ingredients
   - Subtract processing impact (heat, mixing reduces shelf life)
   - Subtract safety buffer (default 20% of shortest)
   - Result cannot be negative (minimum 1 day)

2. **Rolling Shelf Life**:
   - Best before = earliest ingredient expiry - processing time
   - Used for products with long ingredient shelf lives
   - Example: Flour (180 days) → Bread uses oldest flour lot

3. **Fixed Shelf Life**:
   - Best before = production date + shelf_life_days
   - Most common for food manufacturing
   - Independent of ingredient receipt dates

### Override Rules
1. **Override Shorter than Calculated**: Allowed with warning
2. **Override Longer than Calculated**: Allowed but flagged for quality review
3. **Override Reason Required**: Mandatory for audit trail
4. **Override Cannot Exceed Shortest Ingredient**: Hard limit (safety)

### Storage Conditions
1. **Temperature Range Required**: All products must have temp range
2. **Humidity Optional**: Unless specified by regulation
3. **Special Conditions Inherited**: From ingredients (e.g., if any ingredient requires refrigeration)

### FIFO/FEFO Enforcement
1. **FEFO Default**: For products with <30 days shelf life
2. **FIFO Allowed**: For long shelf life products (>180 days)
3. **Minimum Remaining**: Typically 50-80% of total shelf life for shipment
4. **Enforcement Levels**:
   - Suggest: Operator can override with note
   - Warn: Requires supervisor approval
   - Block: System prevents shipment (for regulatory products)

### Ingredient Receiving
1. **Minimum Acceptable on Receipt**: Typically 80-90% of total shelf life
2. **Rejection Rule**: Auto-reject if below minimum (configurable)
3. **Quarantine**: Required for high-risk ingredients (e.g., meat, dairy)

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use ShadCN Dialog component for modal
2. Zod schema: `lib/validation/shelf-life-schema.ts`
3. Service: `lib/services/shelf-life-service.ts`
4. Recalculate button should show loading spinner
5. Highlight changed values after recalculation (yellow flash)
6. Format dates with org locale (default DD/MM/YYYY)
7. Temperature unit conversion (Celsius/Fahrenheit) based on org settings
8. Toast notifications for success/error
9. Validate temp range on blur (min < max)
10. Show ingredient shelf lives table as read-only reference

### For BACKEND-DEV:
1. Implement shelf life calculation service with BOM ingredient lookup
2. Create trigger to recalculate on ingredient shelf life change
3. Store calculation history for audit (product_shelf_life table with versioning)
4. Add API endpoint to bulk update products when ingredient changes
5. Integrate with warehouse FEFO picking logic
6. Add webhook event for shelf life changes (notify planning/production)
7. Implement GRN validation for minimum acceptable remaining shelf life

---

**Status**: Auto-approved (autonomous mode)
**Approval Required**: No (auto-approve mode)
**Iterations**: 0 of 3
