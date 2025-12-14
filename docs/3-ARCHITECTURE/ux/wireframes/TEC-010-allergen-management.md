# TEC-010: Allergen Management (Product)

**Module**: Technical
**Feature**: Product Allergen Declaration (FR-2.4, FR-2.28)
**Type**: Page Section / Modal Dialog
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Product Detail - Allergen Section)

```
┌──────────────────────────────────────────────────────────────────┐
│  Product: Whole Wheat Bread (PROD-157)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Basic Info] [Allergens] [Nutrition] [BOM] [History]           │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  ALLERGEN DECLARATIONS                                           │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🔄 Auto-Inherited from BOM                  [Recalculate]  │ │
│  │ Last Updated: 2025-12-10 15:23 (BOM v3)                    │ │
│  │ 5 allergens detected from 8 ingredients                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Contains (Present in Product)                [+ Add Allergen]  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🌾 Gluten (Cereals with gluten)                            │ │
│  │    Source: Wheat Flour (PROD-001), Oat Fiber (PROD-034)   │ │
│  │    [View Details] [Change to "May Contain"] [Remove]   [⋮] │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ 🥛 Milk (Milk and dairy products)                          │ │
│  │    Source: Milk Powder (PROD-012)                          │ │
│  │    [View Details] [Change to "May Contain"] [Remove]   [⋮] │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ 🥚 Eggs (Eggs and egg products)                            │ │
│  │    Source: Egg White Powder (PROD-023)                     │ │
│  │    [View Details] [Change to "May Contain"] [Remove]   [⋮] │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ 🫘 Soybeans (Soya and soya products)                       │ │
│  │    Source: Soy Lecithin (PROD-067)                         │ │
│  │    [View Details] [Change to "May Contain"] [Remove]   [⋮] │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ 🌰 Nuts (Tree nuts)                                        │ │
│  │    Source: Walnut Pieces (PROD-089)                        │ │
│  │    [View Details] [Change to "May Contain"] [Remove]   [⋮] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  May Contain (Cross-Contamination Risk)       [+ Add Allergen]  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🥜 Peanuts (Peanuts and peanut products)                   │ │
│  │    Reason: Shared production line with peanut products     │ │
│  │    Added: 2025-12-01 by Jane Smith (Manual)                │ │
│  │    [View Details] [Change to "Contains"] [Remove]      [⋮] │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │ 🌱 Sesame (Sesame seeds and products)                      │ │
│  │    Reason: Shared warehouse storage area                   │ │
│  │    Added: 2025-11-15 by John Doe (Manual)                  │ │
│  │    [View Details] [Change to "Contains"] [Remove]      [⋮] │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Free From (Explicitly Allergen-Free)      [+ Add Free From]    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🐟 Fish    🦐 Crustaceans    🌿 Celery    🟡 Mustard       │ │
│  │ 🍇 Sulphites    🫛 Lupin    🐚 Molluscs                    │ │
│  │                                                            │ │
│  │ 7 allergens confirmed as not present         [Manage]     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ⚠ Warnings & Compliance                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✓ All EU 14 allergens reviewed                             │ │
│  │ ⚠ Manual "May Contain" declarations require review every   │ │
│  │   90 days (Next: 2025-03-01)                               │ │
│  │ ✓ Label generation ready                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [View Allergen History] [Generate Allergen Label] [Export PDF] │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Success State (Add Allergen Modal)

```
┌──────────────────────────────────────────────────┐
│  Add Allergen Declaration                 [X]    │
├──────────────────────────────────────────────────┤
│                                                  │
│  Allergen *                                      │
│  [Select allergen ▼]                             │
│    ─ EU 14 Allergens ─                           │
│    🌾 Gluten (Cereals with gluten)               │
│    🦐 Crustaceans                                │
│    🥚 Eggs                                       │
│    🐟 Fish                                       │
│    🥜 Peanuts                                    │
│    🫘 Soybeans                                   │
│    🥛 Milk                                       │
│    🌰 Nuts (Tree nuts)                           │
│    🌿 Celery                                     │
│    🟡 Mustard                                    │
│    🌱 Sesame                                     │
│    🍇 Sulphites                                  │
│    🫛 Lupin                                      │
│    🐚 Molluscs                                   │
│    ─ Custom Allergens ─                          │
│    🍯 Honey                                      │
│                                                  │
│  Relation Type *                                 │
│  ○ Contains (Present in ingredients)             │
│  ⦿ May Contain (Cross-contamination risk)        │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │ ℹ "May Contain" declarations should be     │ │
│  │   based on validated cross-contamination   │ │
│  │   risk assessments (HACCP/allergen audit). │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
│  Reason / Source * (for "May Contain")           │
│  [Shared production line___________________]     │
│  [_________________________________________]     │
│                                                  │
│  Supporting Evidence (Optional)                  │
│  [Browse Files] or drag & drop                   │
│  • HACCP_Allergen_Assessment_2025.pdf (2.3 MB)   │
│                                                  │
│  Review Date (for "May Contain")                 │
│  [2025-03-11____] (90 days from today)           │
│                                                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Cancel]                    [Add Allergen]      │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────────────────────┐
│  Product: Whole Wheat Bread (PROD-157)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Basic Info] [Allergens] [Nutrition] [BOM] [History]           │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  ALLERGEN DECLARATIONS                                           │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│                      [Spinner Animation]                         │
│                                                                  │
│              Analyzing BOM ingredients for allergens...          │
│                                                                  │
│                    Checking 8 ingredients                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────────────────────────────┐
│  Product: Whole Wheat Bread (PROD-157)                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Basic Info] [Allergens] [Nutrition] [BOM] [History]           │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  ALLERGEN DECLARATIONS                                           │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ⚠ Unable to Auto-Calculate Allergens                           │
│                                                                  │
│  Missing allergen declarations for ingredients:                  │
│  • Wheat Flour (PROD-001) - No allergens declared               │
│  • Vegetable Oil (PROD-045) - No allergens declared             │
│  • Flavor Mix (PROD-123) - No allergens declared                │
│                                                                  │
│  To auto-inherit allergens, all BOM ingredients must have        │
│  their allergens declared first.                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Quick Actions:                                             │ │
│  │ [Add Missing Allergen Data]  [Declare Manually Instead]   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Manual Declarations                          [+ Add Allergen]  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ No manual allergen declarations yet.                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Empty State (No BOM)

```
┌──────────────────────────────────────────────────────────────────┐
│  Product: Raw Sugar (PROD-089)                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Basic Info] [Allergens] [Nutrition] [BOM] [History]           │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  ALLERGEN DECLARATIONS                                           │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│                          [🔬 Icon]                               │
│                                                                  │
│                   No Allergens Auto-Detected                     │
│                                                                  │
│  This product is a raw material with no BOM. Allergen auto-      │
│  inheritance requires a Bill of Materials.                       │
│                                                                  │
│  If this product contains or may contain allergens, declare      │
│  them manually based on:                                         │
│  • Supplier specifications                                      │
│  • Certificate of Analysis (CoA)                                │
│  • Manufacturing process assessment                             │
│                                                                  │
│                      [+ Declare Allergen]                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ℹ For raw materials, "Allergen-Free" certification may     │ │
│  │   be required from suppliers for certain allergens.        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Auto-Inheritance Banner
- **Status**: Green banner if auto-calculated, gray if manual only
- **Info**: Last update timestamp, BOM version used, ingredient count
- **Action**: [Recalculate] button to refresh from current BOM
- **Behavior**: Auto-updates when BOM changes (real-time or on page load)

### 2. Contains Section (Direct Allergens)
- **Source**: Auto-inherited from BOM ingredients that declare "contains"
- **Display**: Allergen icon + name + description
- **Details**: Shows which BOM ingredients contribute this allergen
- **Actions**: View Details, Change to "May Contain", Remove (if manual)
- **Badge**: "AUTO" (inherited) or "MANUAL" (user-declared)

### 3. May Contain Section (Cross-Contamination)
- **Source**: Manually declared by user based on risk assessment
- **Display**: Allergen icon + name + reason
- **Metadata**: Added by (user), Added date, Review due date
- **Actions**: View Details, Change to "Contains", Remove
- **Warning**: Yellow banner if review date approaching (<7 days)

### 4. Free From Section (Allergen-Free Claims)
- **Source**: EU 14 allergens not in "Contains" or "May Contain"
- **Display**: Icon grid of allergen-free badges
- **Purpose**: Quick visual confirmation for labeling/marketing
- **Action**: [Manage] to explicitly mark allergen-free (optional certification)

### 5. Warnings & Compliance
- **Checklist**: All EU 14 reviewed, Manual declarations need review, Label ready
- **Alerts**: Review overdue, Missing declarations, Conflicting data
- **Color-coded**: Green (OK), Yellow (Warning), Red (Error)

### 6. Add Allergen Modal
- **Allergen Dropdown**: EU 14 + Custom allergens (from Settings)
- **Relation Type**: Radio buttons (Contains / May Contain)
- **Reason Field**: Required for "May Contain", optional for "Contains"
- **Evidence Upload**: PDF/image upload for HACCP docs, CoA, audits
- **Review Date**: Auto-calculated (90 days) for "May Contain", editable

---

## Main Actions

### Primary Actions
- **[Recalculate]**: Re-runs allergen inheritance from current BOM
  - Fetches all BOM ingredients (active BOM version)
  - Retrieves allergen declarations for each ingredient
  - Aggregates "Contains" declarations
  - Preserves manual "May Contain" entries
  - Updates "Free From" list (EU 14 minus declared)
  - Shows toast: "Allergens updated from BOM v{version}"

- **[+ Add Allergen]**: Opens add allergen modal
  - Validates allergen not already declared
  - If "Contains" selected: saves to `product_allergens` with source = 'manual'
  - If "May Contain" selected: requires reason, sets review_date = +90 days
  - Closes modal, refreshes allergen list
  - Shows toast: "Allergen {name} added as {relation_type}"

- **[Add Allergen]** (in modal): Saves allergen declaration
  - Validates required fields (allergen, relation_type, reason if may_contain)
  - Creates record in `product_allergens` table
  - Uploads evidence files to storage (if provided)
  - Links evidence files to allergen record
  - Sets audit trail (created_by, created_at)
  - Closes modal, refreshes page

### Secondary Actions
- **[View Details]**: Opens allergen detail panel (side panel)
  - Shows full allergen info (name, description, EU code)
  - Lists all BOM ingredients contributing (for "Contains")
  - Shows reason, evidence, review history (for "May Contain")
  - Displays audit trail (who declared, when, changes)

- **[Change to "May Contain"]** / **[Change to "Contains"]**: Updates relation type
  - Shows confirmation dialog
  - If changing to "May Contain": prompts for reason
  - Updates `product_allergens.relation_type`
  - Logs change in audit trail
  - Shows toast: "Allergen relation changed"

- **[Remove]**: Removes allergen declaration
  - Shows confirmation: "Remove {allergen} declaration?"
  - If auto-inherited: shows warning "Will reappear on next BOM recalculation unless removed from ingredients"
  - If manual: deletes from `product_allergens`
  - Logs removal in audit trail
  - Shows toast: "Allergen {name} removed"

- **[Manage]** (Free From): Opens allergen-free management
  - Shows all EU 14 allergens
  - Checkboxes to explicitly mark "Certified Allergen-Free"
  - Attach certification documents (e.g., supplier CoA)
  - Used for marketing claims ("Gluten-Free Certified")

- **[View Allergen History]**: Opens history panel
  - Timeline of all allergen changes
  - BOM version changes (auto-inheritance updates)
  - Manual additions/removals
  - Relation type changes
  - Review date updates

- **[Generate Allergen Label]**: Opens label preview
  - Generates compliant allergen warning label
  - Formats: EU (bold list), FDA (Contains: ...), custom
  - Preview before export/print
  - Links to TEC-012-allergen-warnings

- **[Export PDF]**: Downloads allergen declaration document
  - PDF with product info, allergen list, evidence
  - Suitable for customer/regulatory submission

---

## 4 States (One-Line)

- **Loading**: Spinner + "Analyzing BOM ingredients for allergens..." while GET /api/technical/products/:id/allergens runs
- **Empty**: "No Allergens Auto-Detected" for raw materials (no BOM) + "[+ Declare Allergen]" CTA
- **Error**: Red banner + list of BOM ingredients missing allergen data + quick actions to add data or declare manually
- **Success**: Auto-inherited allergens (Contains) + manual declarations (May Contain) + Free From badges + compliance warnings + actions to add/edit/export

---

## Validation Rules

### Add Allergen
| Field | Required | Rules |
|-------|----------|-------|
| Allergen | Yes | Must be from allergen master list (EU 14 + custom) |
| Relation Type | Yes | "contains" or "may_contain" |
| Reason | Yes (if may_contain) | Min 10 chars, max 500 chars |
| Evidence Files | No | PDF/JPG/PNG, max 10MB per file, max 5 files |
| Review Date | Yes (if may_contain) | Default: today + 90 days, must be future date |

**Business Rules**:
- Cannot declare same allergen twice with same relation type
- Can have both "contains" and "may_contain" for same allergen (e.g., direct + cross-contamination)
- Auto-inherited "contains" cannot be removed unless BOM ingredients updated
- Manual "may_contain" requires review every 90 days (system reminder)
- "Free From" automatically calculated (EU 14 minus declared allergens)

---

## Accessibility

- **Touch Targets**: All buttons, allergen cards >= 48x48dp
- **Contrast**: Banner colors pass WCAG AA (green: #059669, yellow: #D97706, red: #DC2626)
- **Screen Reader**: Announces "Allergen Declarations for {product_name}", allergen list, relation type, source
- **Keyboard**: Tab navigation, Enter to expand details, Escape to close modals
- **Focus**: Search/filter input auto-focused on modal open
- **Icons**: All allergen emoji icons have text alternatives (e.g., 🌾 = "Wheat icon")
- **Color**: Not relying on color alone (badges have text labels)

---

## Technical Notes

### API Endpoints
- **Get**: `GET /api/technical/products/:id/allergens`
- **Recalculate**: `POST /api/technical/boms/:id/allergens` (inheritance from BOM)
- **Add**: `POST /api/technical/products/:id/allergens`
- **Update**: `PUT /api/technical/products/:id/allergens/:allergenId`
- **Remove**: `DELETE /api/technical/products/:id/allergens/:allergenId`
- **History**: `GET /api/technical/products/:id/allergens/history`

### Allergen Inheritance Algorithm
```typescript
// For finished products with BOM:
1. Get active BOM for product
2. For each BOM item (ingredient):
   - Fetch ingredient's allergen declarations (relation_type = 'contains')
   - Aggregate unique allergens
3. Union with manual "contains" declarations for this product
4. Preserve manual "may_contain" declarations (not auto-inherited)
5. Calculate "free_from" = EU 14 - (contains + may_contain)
```

### Data Structure
```typescript
// product_allergens table
{
  id: string;
  product_id: string;
  allergen_id: string; // FK to allergens table
  relation_type: 'contains' | 'may_contain';
  source: 'auto' | 'manual';
  reason?: string; // for may_contain
  evidence_urls?: string[]; // S3 URLs
  review_date?: Date; // for may_contain
  reviewed_at?: Date;
  reviewed_by?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// allergens table (from Settings module)
{
  id: string;
  org_id: string;
  code: string; // ALL-01 to ALL-14, CUST-XX
  name: string;
  description: string;
  icon: string; // emoji
  type: 'eu14' | 'custom';
  is_active: boolean;
}
```

### Real-time Updates
- Subscribe to BOM changes via Supabase Realtime
- Auto-refresh allergen list when BOM updated
- Show notification: "BOM changed. Allergens may have changed. [Recalculate]"

### Compliance
- **EU FIC 1169/2011**: All EU 14 allergens must be declared if present
- **FDA FALCPA**: Major allergens (8 in US: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans)
- **Precautionary Labeling**: "May contain" only if validated cross-contamination risk exists
- **Review Frequency**: Manual "may_contain" declarations reviewed every 90 days

---

## Related Screens

- **Product Detail View**: Parent page, [Allergens] tab
- **SET-020-allergen-list**: Allergen master data (Settings)
- **BOM Detail**: Shows ingredient allergens contributing to product
- **TEC-012-allergen-warnings**: Warning label generation
- **Allergen Detail Panel**: Side panel with full allergen info
- **Allergen History Panel**: Timeline of changes

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use page section (not modal) for allergen management
2. Use ShadCN Dialog for "Add Allergen" modal
3. Use ShadCN Sheet (side panel) for allergen details/history
4. Zod schema: `lib/validation/allergen-schema.ts`
5. Service: `lib/services/allergen-service.ts`
6. Real-time subscription to BOM changes (Supabase Realtime)
7. File upload for evidence: Use Supabase Storage
8. Review date reminders: Check on page load, show warning if <7 days
9. Icon rendering: Emoji with text alternative for accessibility
10. Badge components: "AUTO", "MANUAL", "CONTAINS", "MAY CONTAIN"

### For BACKEND-DEV:
1. Implement allergen inheritance algorithm (recursive for multi-level BOMs)
2. Validate all BOM ingredients have allergen data before auto-calculation
3. Create audit trail for all allergen changes
4. Set up review date reminders (90-day cycle for "may_contain")
5. Evidence file storage with S3/Supabase Storage
6. Label generation API (formats: EU, FDA, custom)
7. Compliance validation (EU 14 coverage check)
8. Real-time events for BOM changes

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [TEC-010-allergen-management]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV/BACKEND-DEV handoff
