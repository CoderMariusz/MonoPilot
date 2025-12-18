# QA-012: CoA (Certificate of Analysis) Templates

**Module**: Quality Management
**Feature**: CoA Templates (FR-QA-012)
**Status**: Auto-Approved
**Last Updated**: 2025-12-15

---

## ASCII Wireframes

### 1. CoA Templates List - Success State (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Quality > CoA Templates                                  [+ Create Template]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Search templates...           ] [Type: All ▼] [Status: All ▼] [Sort ▼]    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Name              Type        Default  Status   Used By  Actions        │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Yogurt Standard   Dairy       ★        Active   8        [⋮]            │ │
│  │                   Header: Logo + Address • Footer: Signatures           │ │
│  │                   Sections: Physical, Microbial, Chemical (3) • Updated: 2 days ago │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Cheese CoA        Dairy       ○        Active   5        [⋮]            │ │
│  │                   Header: Custom • Footer: Accreditation               │ │
│  │                   Sections: Composition, Sensory, Safety (3) • 1 week ago │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Bread Standard    Bakery      ★        Active   12       [⋮]            │ │
│  │                   Header: Logo + Accreditation • Footer: Signatures    │ │
│  │                   Sections: Sensory, Physical, Microbial (3) • 3 days ago │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Juice Template    Beverage    ○        Active   3        [⋮]            │ │
│  │                   Header: Logo • Footer: Legal disclaimers             │ │
│  │                   Sections: Microbial, Chemical (2) • 1 month ago       │ │
│  ├─────────────────────────────────────────────────────────────────────────┤ │
│  │ Old Formula CoA   Dairy       ○        Inactive 0        [⋮]            │ │
│  │                   Header: Legacy • Footer: Deprecated                  │ │
│  │                   Sections: Standard (1) • 6 months ago                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Showing 5 of 12 templates                                    [1] [2]        │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

[⋮] Menu:
  - View Details
  - Preview as PDF
  - Edit Template
  - Clone Template
  - Set as Default (for product type)
  - View Usage
  - Set Status (Active/Inactive)
  - Delete Template (if unused)
```

### 2. CoA Templates List - Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Quality > CoA Templates                                  [+ Create Template]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [Skeleton: Search...           ] [Type ▼] [Status ▼] [Sort ▼]              │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]    │ │
│  │ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  │ [██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │ │
│  │ [████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Loading CoA templates...                                                     │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. CoA Templates List - Empty State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Quality > CoA Templates                                  [+ Create Template]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          [📄 Icon]                                            │
│                                                                               │
│                    No CoA Templates Found                                     │
│                                                                               │
│       CoA templates define the format and layout for certificates of         │
│       analysis. Create templates for each product type with your company     │
│       logo, accreditations, test parameters, and signature fields.           │
│                                                                               │
│                    [+ Create Your First Template]                             │
│                                                                               │
│       Or import from template library: [Import Templates]                     │
│                                                                               │
│       📚 Learn more: CoA template best practices                              │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. CoA Templates List - Error State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Quality > CoA Templates                                  [+ Create Template]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│                          [⚠ Icon]                                             │
│                                                                               │
│                Failed to Load CoA Templates                                   │
│                                                                               │
│       Unable to retrieve CoA template list. Please check your connection.    │
│                   Error: TEMPLATE_FETCH_FAILED                                │
│                                                                               │
│                        [Retry]  [Contact Support]                             │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. CoA Template Create/Edit Modal - Desktop

### Success State (Edit Mode)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Edit CoA Template                                              [✕]           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Template Information                                                         │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │ Template Name *                                                       │   │
│  │ [Yogurt Standard CoA                                                 ]│   │
│  │                                                                       │   │
│  │ Product Type *                                                        │   │
│  │ [Dairy              ▼]   Options: Dairy, Bakery, Beverage, Confect.. │   │
│  │                                                                       │   │
│  │ Set as Default for Product Type                                       │   │
│  │ [★ Set as Default]  (Currently: Yogurt Standard CoA)                 │   │
│  │                                                                       │   │
│  │ Description                                                           │   │
│  │ [Standard CoA template for yogurt products with dairy accreditation] │   │
│  │                                                                       │   │
│  │ □ Active   (Uncheck to disable template)                             │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Header Template                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │ □ Include Company Logo        [Upload Logo]                          │   │
│  │ □ Include Company Address     [Edit Address]                         │   │
│  │ □ Include Accreditation Info  [ISO 9001, ISO 22000, FDA]            │   │
│  │ □ Include Batch/Lot Number                                           │   │
│  │ □ Include Manufacturing Date                                         │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Footer Template                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │ □ Include Signature Fields    [2 signatures]                         │   │
│  │ □ Include Legal Disclaimer    [Edit Text]                            │   │
│  │ □ Include Next Test Date                                             │   │
│  │ □ Include Equipment Calibration Info                                 │   │
│  │ □ Include Expiration Date                                            │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Test Parameters Selection                              [+ Add Section]      │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │ Section: Physical Analysis                                             │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ ☑ Color (Lab)             ☑ Appearance (Visual)  ☑ Viscosity (cP)   │   │
│  │ ☑ Texture (Sensory)        ☑ Particle Size (nm)  ☑ Density (g/mL)   │   │
│  │                                                                       │   │
│  │ Section: Microbial Analysis                                           │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ ☑ Total Plate Count (CFU/mL)  ☑ E.coli (Negative)  ☑ Salmonella     │   │
│  │ ☑ Listeria (CFU/g)            ☑ Coliforms (CFU/mL)                  │   │
│  │                                                                       │   │
│  │ Section: Chemical Analysis                                            │   │
│  ├───────────────────────────────────────────────────────────────────────┤   │
│  │ ☑ pH                    ☑ Titratable Acidity (%)  ☑ Protein (%)     │   │
│  │ ☑ Fat (%)               ☑ Lactose (%)             ☑ Total Solids (%)│   │
│  │                                                                       │   │
│  │ [Edit Available Parameters]  [Manage Sections]                        │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Parameters JSON                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐   │
│  │ Display Format                                                        │   │
│  │ ○ Table Layout (all parameters in single table)                      │   │
│  │ ○ Grouped Layout (grouped by section, multiple tables)               │   │
│  │ ○ Custom Layout (full control over sections and order)               │   │
│  │                                                                       │   │
│  │ Include Column Headers                                                │   │
│  │ ☑ Parameter Name  ☑ Unit  ☑ Target  ☑ Min  ☑ Max  ☑ Measured Value │   │
│  │ ☑ Result (Pass/Fail)  ☑ Equipment Used  ☑ Test Date                 │   │
│  │                                                                       │   │
│  │ Page Layout                                                           │   │
│  │ Paper Size: [A4             ▼]   Orientation: [Portrait  ▼]         │   │
│  │ Font Size: [10pt            ▼]   Include Page Numbers: [Yes ▼]       │   │
│  │                                                                       │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Used by 8 product specifications                         [View Products]    │
│                                                                               │
│                                              [Cancel]  [Preview PDF]  [Save]   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. CoA Template Preview Modal - PDF View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Preview: Yogurt Standard CoA                              [Download]  [✕]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         [ABC Foods Logo]                              │   │
│  │                   Certificate of Analysis                             │   │
│  │                                                                        │   │
│  │  Product: Yogurt, Plain (SKU: YGT-001)                               │   │
│  │  Lot/Batch: LOT-20250115-Y001                                         │   │
│  │  Manufacturing Date: 2025-01-15                                       │   │
│  │                                                                        │   │
│  │  Company Address                                                       │   │
│  │  ABC Foods Inc.                                                        │   │
│  │  123 Dairy Lane, Farmville, CA 94000                                 │   │
│  │                                                                        │   │
│  │  Accreditations: ISO 9001, ISO 22000, FDA Registered                 │   │
│  │  ═══════════════════════════════════════════════════════════════     │   │
│  │                                                                        │   │
│  │  PHYSICAL ANALYSIS RESULTS                                            │   │
│  │  ───────────────────────────────────────────────────────────────    │   │
│  │  Parameter          Unit      Target    Min       Max       Measured │   │
│  │  Color (Lab)        -         52.0      50.0      55.0      52.3  ✓ │   │
│  │  Appearance         Visual    Clear     Clear     Clear      Clear ✓ │   │
│  │  Viscosity          cP        85.0      75.0      95.0       84.5  ✓ │   │
│  │  Texture (Sensory)  Panel     Smooth    Smooth    Creamy     Smooth ✓ │   │
│  │                                                                        │   │
│  │  MICROBIAL ANALYSIS RESULTS                                           │   │
│  │  ───────────────────────────────────────────────────────────────    │   │
│  │  Parameter          Unit      Limit           Result         Status  │   │
│  │  Total Plate Count  CFU/mL    <10,000         <100           ✓ Pass  │   │
│  │  E.coli             Negative  Must be Neg.    Negative       ✓ Pass  │   │
│  │  Salmonella         Negative  Must be Neg.    Negative       ✓ Pass  │   │
│  │  Listeria           CFU/g     <10             <10            ✓ Pass  │   │
│  │                                                                        │   │
│  │  CHEMICAL ANALYSIS RESULTS                                            │   │
│  │  ───────────────────────────────────────────────────────────────    │   │
│  │  Parameter          Unit      Target    Min       Max       Measured │   │
│  │  pH                 pH        4.5       4.3       4.7       4.48   ✓ │   │
│  │  Titratable Acidity %         0.9       0.8       1.0       0.92   ✓ │   │
│  │  Protein            %         3.8       3.5       4.1       3.82   ✓ │   │
│  │  Fat                %         0.1       0.0       0.5       0.08   ✓ │   │
│  │  Lactose            %         4.2       4.0       4.5       4.18   ✓ │   │
│  │                                                                        │   │
│  │  ═══════════════════════════════════════════════════════════════     │   │
│  │                                                                        │   │
│  │  OVERALL RESULT: PASSED - All parameters within specification         │   │
│  │                                                                        │   │
│  │  Tested by: ___________________    QA Manager: ___________________   │   │
│  │  Date: ________________________                                        │   │
│  │                                                                        │   │
│  │  This product meets all regulatory and quality requirements.          │   │
│  │  Certificate valid for one year from manufacturing date.              │   │
│  │  Equipment calibration verified. Next test date: 2025-07-15          │   │
│  │                                                                        │   │
│  │  Page 1 of 1                                                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  [← Previous Page]  [Next Page →]  [Download PDF]  [Print]  [Close]         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Mobile/Tablet Views

### Template List - Tablet (768px)

```
┌─────────────────────────────────────────────────────────┐
│  Quality > CoA Templates               [+ Create]       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Search...        ] [Type ▼] [Status ▼]               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Yogurt Standard              [⋮]                │   │
│  │ Dairy • Default • Active                        │   │
│  │ Used by 8 products • Updated 2 days ago         │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Cheese CoA                   [⋮]                │   │
│  │ Dairy • Active                                  │   │
│  │ Used by 5 products • Updated 1 week ago         │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Bread Standard               [⋮]                │   │
│  │ Bakery • Default • Active                       │   │
│  │ Used by 12 products • Updated 3 days ago        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Showing 3 of 12                       [1] [2] [3]     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Template Create - Mobile (375px)

```
┌─────────────────────────────────────────┐
│  [←] Create CoA Template                │
├─────────────────────────────────────────┤
│                                         │
│  Template Information                   │
│                                         │
│  Template Name *                        │
│  [                                    ] │
│                                         │
│  Product Type *                         │
│  [Dairy             ▼]                  │
│                                         │
│  Description                            │
│  [                                    ] │
│  [                                    ] │
│                                         │
│  [Show more options]                    │
│                                         │
│  Test Parameters                        │
│                                         │
│  [+ Add Parameter Group]                │
│                                         │
│  □ Active                               │
│                                         │
│         [Cancel]  [Save Template]       │
│                                         │
└─────────────────────────────────────────┘
```

### Template Preview - Mobile (375px)

```
┌─────────────────────────────────────────┐
│  [←] Preview CoA Template               │
├─────────────────────────────────────────┤
│                                         │
│          [ABC Foods Logo]               │
│                                         │
│    Certificate of Analysis              │
│                                         │
│  Product: Yogurt, Plain                 │
│  Lot: LOT-20250115-Y001                 │
│  Mfg Date: 2025-01-15                   │
│                                         │
│  ABC Foods Inc.                         │
│  123 Dairy Lane, CA 94000               │
│                                         │
│  Accreditations                         │
│  ISO 9001, ISO 22000, FDA               │
│                                         │
│  ───────────────────────────────────    │
│                                         │
│  PHYSICAL ANALYSIS                      │
│                                         │
│  Color (Lab): 52.3 ✓                    │
│  Appearance: Clear ✓                    │
│  Viscosity: 84.5 cP ✓                   │
│                                         │
│  [Show more tests]                      │
│                                         │
│  MICROBIAL ANALYSIS                     │
│                                         │
│  TPC: <100 CFU/mL ✓                     │
│  E.coli: Negative ✓                     │
│  Salmonella: Negative ✓                 │
│                                         │
│  [Show more tests]                      │
│                                         │
│  OVERALL: PASSED                        │
│                                         │
│  [Download PDF]  [Print]                │
│                                         │
└─────────────────────────────────────────┘
```

---

## Key Components

### CoA Template List Page
1. **Data Table/Cards** - Template name, product type, default indicator, status, usage count, actions
2. **Row Details** - Header/footer summary, sections count, parameters count, last updated
3. **Search/Filter Bar** - Text search (name), product type filter, status filter, sort dropdown
4. **Create Template Button** - Primary CTA, opens create modal
5. **Actions Menu** - View, Preview, Edit, Clone, Set Default, Usage, Set Status, Delete
6. **Type Badges** - Dairy, Bakery, Beverage, Confectionery, Specialty
7. **Status Badges** - Active (green), Inactive (gray)
8. **Default Indicator** - Star icon showing default template per product type
9. **Usage Indicator** - "Used by X products" with link to view

### CoA Template Create/Edit Modal
1. **Template Info Section** - Name, product type, description, active checkbox
2. **Header Template** - Logo, address, accreditation, batch/lot, manufacturing date checkboxes
3. **Footer Template** - Signature fields, legal disclaimer, next test date, calibration, expiration
4. **Parameters Section** - Groups of parameters by category (Physical, Microbial, Chemical, etc.)
5. **Parameter Selection** - Checkboxes to include/exclude parameters from quality_spec_parameters
6. **Parameters JSON** - Display format (table/grouped/custom), column headers, page setup
7. **Add Section Button** - Allows user to create custom parameter groupings
8. **Preview Button** - Opens PDF preview modal
9. **Save/Cancel Buttons** - Primary actions

### CoA Template Preview Modal
1. **PDF Viewer** - Full-page PDF preview with scrolling
2. **Header** - Company logo (if enabled), CoA title, product info
3. **Results Tables** - One per section (Physical, Microbial, Chemical, etc.)
4. **Footer** - Signatures, disclaimers, next test date, calibration info
5. **Download/Print Buttons** - Export and print options
6. **Navigation** - Previous/next page if multi-page

---

## Main Actions

### CoA Template List Page
**Primary:**
- **[+ Create Template]** - Opens create modal → creates new CoA template
- **Row Click** - Opens preview modal with PDF view

**Secondary (Row Actions):**
- **View Details** - Opens read-only view with all configuration
- **Preview as PDF** - Opens PDF preview modal
- **Edit Template** - Opens edit modal → modifies template and layout
- **Clone Template** - Creates copy with new name and all parameters
- **Set as Default** - Marks as default template for product type
- **View Usage** - Shows all products using this template
- **Set Status** - Toggle Active/Inactive
- **Delete Template** - Confirmation modal → soft delete (only if unused)

**Filters/Search:**
- **Search** - Real-time filter by template name
- **Filter by Type** - Dropdown: All, Dairy, Bakery, Beverage, Confectionery, Specialty
- **Filter by Status** - Dropdown: All, Active, Inactive
- **Sort** - Name, Type, Created Date, Updated Date, Usage Count

### CoA Template Create/Edit
**Primary:**
- **[Save Template]** - Validates and saves template with all configurations
- **[Preview PDF]** - Opens preview modal with sample PDF

**Secondary:**
- **[Cancel]** - Closes modal without saving (confirmation if changes)
- **[+ Add Section]** - Opens dialog to add custom parameter group
- **Edit Available Parameters** - Opens modal to select/deselect parameters
- **Manage Sections** - Reorder or remove parameter sections
- **Edit Address** - Opens dialog to customize company address
- **Edit Disclaimer** - Opens text editor for legal disclaimer
- **Upload Logo** - File uploader for company logo image
- **Set as Default** - Marks template as default for its product type

---

## States

### CoA Template List
- **Loading**: Skeleton rows (4), "Loading CoA templates..." text
- **Empty**: "No CoA templates found" illustration, "Create Your First Template" CTA, import option
- **Error**: "Failed to load templates" warning, Retry + Contact Support buttons
- **Success**: Table/cards with templates, search/filter controls, pagination if >12 templates

### CoA Template Create/Edit
- **Create Mode**: Empty form, "Create CoA Template" title, no usage counter
- **Edit Mode**: Pre-filled form, "Edit CoA Template" title, usage counter shown, "Preview" button available
- **Validation Error**: Red border + message for invalid fields (name required, product type required, at least 1 parameter)
- **Save Loading**: Button shows spinner, "Saving..." text
- **Save Success**: Toast notification "Template saved successfully", modal closes

### CoA Template Preview
- **Loading**: Skeleton PDF layout, "Generating preview..." text
- **Success**: Full PDF preview with all configured sections and parameters
- **Error**: "Failed to generate preview", Retry button
- **Multi-page**: Navigation arrows if preview spans multiple pages

---

## Data Fields

### CoA Template

| Field | Type | Display | Notes |
|-------|------|---------|-------|
| template_name | string | Main row | Max 255 chars, required, unique per org |
| product_type | enum | Badge | Dairy, Bakery, Beverage, Confectionery, Specialty |
| description | text | Edit modal | Optional, max 1000 chars |
| is_default | boolean | Star icon | Only one default per product type |
| active | boolean | Badge | Active/Inactive |
| header_template | TEXT | Hidden | Logo URL, address text, accreditation array, includes |
| footer_template | TEXT | Hidden | Signature count, disclaimer text, includes |
| parameters_json | JSONB | Hidden | Display format, column includes, page setup, parameter groups |
| usage_count | computed | Main row | Count of products using template |
| updated_at | timestamp | Row details | Last modified date |
| created_by | UUID | Audit trail | User who created |

### CoA Header Template (TEXT)

```json
{
  "include_logo": true,
  "logo_url": "https://...",
  "include_address": true,
  "address_text": "ABC Foods Inc.\n123 Dairy Lane...",
  "include_accreditation": true,
  "accreditations": ["ISO 9001", "ISO 22000", "FDA"],
  "include_batch_lot": true,
  "include_manufacturing_date": true
}
```

### CoA Footer Template (TEXT)

```json
{
  "signature_count": 2,
  "signature_labels": ["Technician", "QA Manager"],
  "include_disclaimer": true,
  "disclaimer_text": "This product meets...",
  "include_next_test_date": true,
  "include_calibration_info": true,
  "include_expiration_date": true
}
```

### CoA Parameters JSON (JSONB)

```json
{
  "format": "grouped",
  "columns": ["parameter_name", "unit", "target", "min", "max", "measured", "result"],
  "paper_size": "A4",
  "orientation": "portrait",
  "font_size": "10pt",
  "include_page_numbers": true,
  "parameter_ids": ["param_001", "param_002", "param_003"],
  "parameter_groups": [
    {
      "name": "Physical Analysis",
      "parameters": ["color", "appearance", "viscosity"]
    }
  ]
}
```

---

## Business Rules

### Template Management
1. **Template Name**: Must be unique within organization
2. **Product Type Required**: Must select one of 5 types
3. **Parameters Required**: At least 1 parameter/section required
4. **Default Template**: Only one default per product type; changing default updates all products
5. **Delete Restriction**: Cannot delete template if used by any product specification
6. **Inactive Template**: Can be set inactive, but existing specs retain it for audit
7. **Clone**: Creates copy with "(Copy)" suffix, all configurations duplicated
8. **Parameter Source**: All parameters must exist in quality_spec_parameters table

### PDF Generation
1. **Header Rendering**: Company logo (if file exists), address (if configured), accreditations (if array not empty)
2. **Parameter Sections**: Group by configured sections, one table per group or single table if table format
3. **Results Population**: At generation time, current test results inserted into template
4. **Footer Rendering**: Signature lines (count configurable), disclaimer text, dates, calibration note
5. **Page Layout**: Configurable paper size, orientation, font size; auto-paginate if content exceeds 1 page
6. **Immutable**: PDFs reflect template + result state at generation time; no live updates

### Template Default Logic
1. **One Per Product Type**: Setting template as default unsets any other default for that type
2. **New Products Default**: When creating product of type X, pre-select default template for X
3. **Display Indicator**: Star icon (★) next to default template name in list
4. **Preserve Link**: Changing default does not break products using old template

---

## Validation Rules

### Template Create/Edit
- **Name**: Required, 3-255 chars, unique per org
- **Product Type**: Required, one of enum values
- **Description**: Optional, max 1000 chars
- **Parameters**: At least 1 parameter must be selected
- **Logo URL**: If provided, must be valid image file (PNG, JPG, SVG)
- **Address Text**: Optional, max 500 chars
- **Disclaimer Text**: Optional, max 2000 chars
- **Signature Count**: 1-3 signatures allowed
- **Column Includes**: At least 1 column must be selected for display
- **Page Size**: Must be one of (A4, Letter, A3)
- **Orientation**: Must be Portrait or Landscape
- **Font Size**: 8pt-14pt range

### Parameter Selection
- **Parameter ID Validation**: All parameter IDs must exist in quality_spec_parameters
- **Duplicate Check**: Each parameter can only be included once per template
- **Section Assignment**: Each parameter must be assigned to a section
- **Section Name**: Required, 1-100 chars per custom section

---

## Permissions

| Role | View Templates | Create Template | Edit Template | Delete Template | Preview PDF | Set Default |
|------|---------------|----------------|---------------|-----------------|------------|------------|
| QA Inspector | Yes | No | No | No | Yes | No |
| QA Manager | Yes | Yes | Yes | Yes | Yes | Yes |
| Production Lead | Yes | No | No | No | Yes | No |
| Quality Director | Yes | Yes | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |
| Operator | No | No | No | No | No | No |

---

## Accessibility

### CoA Template List
- **Touch targets**: All buttons/menu items >= 48x48dp
- **Contrast**: Type and status badges pass WCAG AA (4.5:1)
- **Screen reader**: Row announces "Template: {name}, Product Type: {type}, Default: {yes/no}, Status: {status}"
- **Keyboard**: Tab navigation, Enter to open modal, Arrow keys for actions menu
- **ARIA**: Table has proper headers, role="grid" for sortable columns

### CoA Template Modal
- **Focus Management**: Focus on first field (template name) on open
- **Tab Order**: Logical flow through form fields and checkbox groups
- **Error Announcements**: aria-live for validation errors
- **Modal Trap**: Focus trapped within modal until closed
- **Escape Key**: Closes modal (with confirmation if unsaved changes)
- **Expandable Sections**: Keyboard accessible collapse/expand controls

### PDF Preview Modal
- **Keyboard Navigation**: Previous/Next page via arrow keys
- **Touch Gestures**: Swipe to change pages on mobile
- **Text Selection**: PDF text selectable for accessibility
- **Screen Reader**: Page count announced, content readable via PDF reader
- **Download/Print**: Clear button labels and keyboard access

---

## Related Screens

- **QA-003 Product Specifications**: CoA templates linked to products
- **QA-004 Test Templates**: Test parameters included in CoA templates
- **QA-005/006/007 Inspections**: Test results populated into CoA at generation
- **QA-011 Generated CoAs**: CoA instances generated from these templates
- **SET-016 Machine/Equipment List**: Equipment info included in CoA footer

---

## API Specifications

### CoA Template Management

**GET /api/quality/coa-templates**
- Query params: `search`, `product_type`, `status`, `sort`, `order`, `page`, `limit`
- Returns: Paginated list with parameter counts, usage counts, default status
- RLS: Filtered by org_id

**POST /api/quality/coa-templates**
- Body: `{ template_name, product_type, description, is_default, header_template, footer_template, parameters_json, active }`
- Validation: Name unique, product type valid, parameters_json contains parameter_ids, config valid JSON
- Returns: Created template with ID
- Side effects: If is_default=true, unsets default on other templates of same type

**GET /api/quality/coa-templates/:id**
- Returns: Full template with all configurations
- RLS: Org_id match

**PUT /api/quality/coa-templates/:id**
- Body: Same as POST
- Validation: Name unique (excluding self), product type valid, config valid
- Returns: Updated template
- Side effects: If is_default changed to true, unsets default on others of same type

**DELETE /api/quality/coa-templates/:id**
- Validation: Cannot delete if usage_count > 0
- Returns: Success message
- Side effects: Soft delete (deleted_at set)

**POST /api/quality/coa-templates/:id/clone**
- Body: `{ new_name }`
- Validation: New name unique
- Returns: Cloned template with new ID, all configs copied
- Side effects: Creates new template, is_default=false

**POST /api/quality/coa-templates/:id/preview**
- Body: `{ sample_results: {} }` (optional sample test results)
- Returns: PDF binary with preview
- Side effects: None (no persistence)

**POST /api/quality/coa-templates/:id/set-default**
- Body: Empty
- Validation: Template exists and is active
- Returns: Success message
- Side effects: Sets is_default=true, sets is_default=false for other templates of same product_type

**GET /api/quality/coa-templates/:id/usage**
- Returns: List of products using this template
- Includes: Product name, code, specification ID
- RLS: Org_id match

**GET /api/quality/coa-templates/:id/parameters**
- Returns: Array of quality_spec_parameters referenced by template
- RLS: Org_id match

---

## Technical Notes

### Performance
- **Template List**: Index on (org_id, product_type, is_active)
- **Parameter Query**: Joined with quality_spec_parameters, select only needed fields
- **Usage Count**: Pre-computed or cached (5 min TTL)
- **PDF Generation**: Client-side rendering (jsPDF library) or server-side (node-html2pdf)
- **Load Time Target**: <1s for template list, <2s for PDF preview

### Caching
- **Template List**: Redis key `org:{orgId}:quality:coa-templates:list` (5 min TTL)
- **Template Detail**: Redis key `org:{orgId}:quality:coa-template:{id}` (10 min TTL)
- **Usage Count**: Redis key `org:{orgId}:quality:coa-template:{id}:usage` (1 hour TTL)
- **Default Template**: Redis key `org:{orgId}:quality:coa-default:{product_type}` (1 hour TTL)
- **Invalidation**: On template create/edit/delete, clear related keys

### Real-time
- **Template Updates**: Supabase Realtime subscription on `quality_coa_templates` table
- **Default Changes**: Broadcast to other users viewing template list
- **Sync**: No real-time needed for PDF preview (single user)

### Data Integrity
- **Parameter Immutability**: Parameters selected are stored as array of IDs in parameters_json; external parameter edits don't auto-update template
- **Template Versioning**: No versioning (edit in place); each save creates audit log entry
- **PDF Stability**: At generation time, all data (logo, parameters, results) frozen into PDF
- **Foreign Keys**: templates → quality_spec_parameters (validate on save), products → templates (soft delete safe)

### PDF Generation Libraries
- **Frontend**: jsPDF + html2canvas for client-side preview
- **Backend**: node-html2pdf or puppeteer for server-side generation (if email delivery)
- **Template Engine**: Handlebars or similar for dynamic section rendering

---

## Error Handling

### Template Creation
| Error | Cause | User Message | Recovery |
|-------|-------|--------------|----------|
| TEMPLATE_NAME_EXISTS | Name not unique | "A template with this name already exists" | Change name |
| INVALID_PRODUCT_TYPE | Product type not in enum | "Please select a valid product type" | Choose from list |
| NO_PARAMETERS | No parameters selected | "At least one parameter is required" | Add parameters |
| INVALID_PARAMETER_IDS | Parameter ID not found | "One or more parameters do not exist" | Reselect parameters |
| INVALID_JSON_CONFIG | Header/footer/layout JSON malformed | "Configuration is invalid. Please check syntax" | Review and correct |
| NETWORK_ERROR | API timeout | "Failed to save template. Please try again." | Retry |

### PDF Preview
| Error | Cause | User Message | Recovery |
|-------|-------|--------------|----------|
| PREVIEW_TIMEOUT | PDF generation >10s | "Preview is taking too long. Try again?" | Retry or simplify template |
| INVALID_LOGO_URL | Logo file not found | "Company logo could not be loaded" | Re-upload logo file |
| PARAMETER_NOT_FOUND | Referenced parameter deleted | "One or more parameters are no longer available" | Update template |
| PDF_GENERATION_ERROR | Backend rendering failed | "Failed to generate preview" | Retry or contact support |

---

## Notification & Alerts

| Event | Recipients | Channel | Content | Urgency |
|-------|-----------|---------|---------|---------|
| Template Created | QA Team | Email | Template name, product type, created by, parameter count | Low |
| Template Edited (in use) | Users who used template | Email | Template name, changes summary, products affected | Medium |
| Default Template Changed | Relevant product owners | Email | Old default, new default, affected product count | Medium |
| Template Set Inactive | QA Team | Email | Template name, product type, products still using it | Low |

---

## Integration Points

### Internal Modules
- **Quality Specifications (FR-QA-003)**: CoA templates linked to product specs
- **Test Templates (FR-QA-004)**: Test parameters used in CoA template selections
- **Inspections (FR-QA-005/006/007)**: Test results data fed into CoA at generation
- **Generated CoAs (FR-QA-011)**: CoA instances created from these templates
- **Equipment (Settings)**: Equipment info included in footer if configured
- **Users/Roles**: Creator and signature authority tracking

### External Systems
- **PDF Libraries**: jsPDF, node-html2pdf, or puppeteer for generation
- **Cloud Storage**: Optional S3/GCS for logo images and generated PDFs
- **Email Service**: SendGrid/Twilio for PDF delivery (future feature)
- **Regulatory Reporting**: CoAs included in compliance/traceability reports

---

## Mobile/Tablet Breakpoints

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| Desktop (>1024px) | Full config panels side-by-side, PDF preview in modal | Optimal UX |
| Tablet (768-1024px) | Stacked config sections, PDF preview in modal, scrollable | Touch-friendly |
| Mobile (<768px) | Collapsible config sections, PDF preview full-screen or modal | Minimal scrolling, readable |

### Mobile Optimizations
- **Collapsible Sections**: Header/footer/layout configs collapse to save space
- **Card Interface**: Parameter selection as cards instead of table on mobile
- **One Column**: PDF preview optimized for single-column viewing
- **Touch Targets**: 48x48dp minimum buttons
- **Horizontal Scroll**: Table columns scrollable if needed (try to avoid)
- **Preview Zoom**: PDF preview zoomable with pinch gesture

---

## Success Criteria

### CoA Template Management (95%+ quality target)
- [ ] Template list loads in <1s with 30+ templates
- [ ] Create template with 15+ parameters in <3 seconds
- [ ] Search/filter returns results in <500ms
- [ ] Clone template preserves all configurations accurately
- [ ] Set-as-default logic correctly handles one-per-type constraint
- [ ] Delete validation prevents orphaned product specs
- [ ] Usage count accurate within 1 minute of spec change

### PDF Preview & Generation (95%+ quality target)
- [ ] PDF preview renders in <2 seconds
- [ ] Preview matches actual PDF layout exactly
- [ ] Company logo displays at correct size and position
- [ ] Parameter sections render with proper formatting
- [ ] Signature blocks have correct spacing and line count
- [ ] Multi-page PDFs navigate correctly with prev/next
- [ ] Download PDF function works in all major browsers
- [ ] Mobile PDF preview readable at 375px width

### Data Integrity (100% requirement)
- [ ] Parameter list immutable after template save
- [ ] Default template uniqueness enforced per product type
- [ ] All parameter IDs validated against quality_spec_parameters
- [ ] Audit trail captures all template changes with user/timestamp
- [ ] PDF generation deterministic (same inputs = same PDF)

---

## Open Questions

1. Should CoA support multi-language templates (English/Spanish/etc.)?
2. Digital signature support (e-signature integration)?
3. Barcode/QR code generation in CoA header for traceability?
4. Custom header/footer HTML editor instead of configuration?
5. Template preview with real test data (pull from recent inspection)?
6. Bulk download/print of multiple CoAs for same product/batch?
7. Email delivery of CoA directly to customer at shipment?
8. Regulatory format templates (FDA, EU, ISO standard formats)?

---

**Status**: Auto-Approved
**Approval Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Iterations**: 0 of 3
**Quality Target**: 95%+
**Lines**: ~1,120
