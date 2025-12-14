# TEC-012: Allergen Warnings Display

**Module**: Technical
**Feature**: Allergen Warning Label Generation (FR-2.84)
**Type**: Modal Dialog / Label Preview
**Status**: Approved (Auto-Approve Mode)
**Last Updated**: 2025-12-11

---

## ASCII Wireframe

### Success State (Label Preview - EU Format)

```
┌──────────────────────────────────────────────────────────────────┐
│  Allergen Warning Label: Whole Wheat Bread                [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Product: Whole Wheat Bread (PROD-157)                          │
│  Format: [EU FIC 1169/2011 ▼]  [FDA FALCPA ▼]  [Custom ▼]       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Label Size: [4x6" ▼]  [100% ▼]  [Fit to Window]           │ │
│  │ Language: [English ▼]  Background: [White ▼]               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  PREVIEW                                                         │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                  ALLERGEN INFORMATION                      │ │
│  │                                                            │ │
│  │  Product: Whole Wheat Bread                               │ │
│  │  Code: PROD-157                                           │ │
│  │  Date: 2025-12-11                                         │ │
│  │  ──────────────────────────────────────────────────       │ │
│  │                                                            │ │
│  │  CONTAINS:                                                │ │
│  │                                                            │ │
│  │  • GLUTEN (cereals containing gluten: wheat, oats)        │ │
│  │  • MILK (milk and dairy products including lactose)       │ │
│  │  • EGGS (eggs and egg products)                           │ │
│  │  • SOYBEANS (soya and soya products)                      │ │
│  │  • NUTS (tree nuts: walnuts)                              │ │
│  │                                                            │ │
│  │  ──────────────────────────────────────────────────       │ │
│  │                                                            │ │
│  │  MAY CONTAIN:                                             │ │
│  │                                                            │ │
│  │  • PEANUTS (shared production equipment)                  │ │
│  │  • SESAME (shared storage facilities)                     │ │
│  │                                                            │ │
│  │  ──────────────────────────────────────────────────       │ │
│  │                                                            │ │
│  │  For allergen information and advice, please contact:     │ │
│  │  Bakery Co. | +1-555-123-4567 | info@bakery.com          │ │
│  │                                                            │ │
│  │  ──────────────────────────────────────────────────       │ │
│  │  Lot: See packaging | Best Before: See packaging          │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  Compliance Check: ✓ All EU 14 allergens reviewed               │
│                    ✓ Bold formatting applied to allergen names  │
│                    ✓ Contact information included               │
│                                                                  │
│  [Edit Contact Info] [Customize Text] [Add Logo]                │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Close]        [Export PDF] [Print Label] [Save as Template]   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Success State (FDA FALCPA Format)

```
┌──────────────────────────────────────────────────────────────────┐
│  Allergen Warning Label: Whole Wheat Bread                [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Product: Whole Wheat Bread (PROD-157)                          │
│  Format: [FDA FALCPA ▼]                                          │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  PREVIEW (FDA Format)                                            │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │  ALLERGEN STATEMENT                                        │ │
│  │  ──────────────────────────────────────────────────       │ │
│  │                                                            │ │
│  │  CONTAINS: WHEAT, MILK, EGG, SOY, TREE NUTS (WALNUTS)     │ │
│  │                                                            │ │
│  │  MAY CONTAIN: PEANUTS, SESAME                             │ │
│  │                                                            │ │
│  │  ──────────────────────────────────────────────────       │ │
│  │                                                            │ │
│  │  Manufactured in a facility that also processes:          │ │
│  │  Peanuts, Sesame                                          │ │
│  │                                                            │ │
│  │  For more allergen information, contact:                  │ │
│  │  Bakery Co. at 1-555-123-4567                             │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Compliance Check: ✓ Major allergens (Big 8) declared           │
│                    ✓ Common/usual names used (Wheat, not Gluten)│
│                    ✓ Specific tree nut type listed (Walnuts)    │
│                                                                  │
│  ⚠ Note: FDA requires allergens in ingredient list AND          │
│    optional separate "Contains" statement                       │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Close]        [Export PDF] [Print Label] [Save as Template]   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Success State (Package Insert Format)

```
┌──────────────────────────────────────────────────────────────────┐
│  Allergen Warning Label: Whole Wheat Bread                [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Product: Whole Wheat Bread (PROD-157)                          │
│  Format: [Package Insert ▼]                                      │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  PREVIEW (Customer Allergen Card)                                │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ┌────────────────────────────────────────────────────────┐ │ │
│  │ │ [Logo]  ALLERGEN INFORMATION CARD                      │ │ │
│  │ └────────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  Product: Whole Wheat Bread                               │ │
│  │  SKU: PROD-157                                            │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ This product CONTAINS the following allergens:       │ │ │
│  │  │                                                      │ │ │
│  │  │  ☑ Gluten (Wheat, Oats)    ☑ Milk                   │ │ │
│  │  │  ☑ Eggs                    ☑ Soy                    │ │ │
│  │  │  ☑ Tree Nuts (Walnuts)                              │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ This product MAY CONTAIN due to shared facilities:  │ │ │
│  │  │                                                      │ │ │
│  │  │  ⚠ Peanuts    ⚠ Sesame                              │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ This product is FREE FROM:                          │ │ │
│  │  │                                                      │ │ │
│  │  │  ☐ Fish       ☐ Shellfish    ☐ Celery              │ │ │
│  │  │  ☐ Mustard    ☐ Sulphites    ☐ Lupin               │ │ │
│  │  │  ☐ Molluscs                                         │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  For questions or to report an allergic reaction:         │ │
│  │  📞 1-555-123-4567  ✉ allergens@bakery.com               │ │
│  │                                                            │ │
│  │  Printed: 2025-12-11  |  Rev. 3                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ℹ This format is ideal for customer-facing allergen cards,     │
│    retail packaging inserts, or foodservice allergen binders.   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Close]        [Export PDF] [Print Label] [Save as Template]   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌──────────────────────────────────────────────────────────────────┐
│  Allergen Warning Label: Whole Wheat Bread                [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      [Spinner Animation]                         │
│                                                                  │
│              Generating allergen warning label...                │
│                                                                  │
│  Progress:                                                       │
│  ✓ Loaded allergen declarations                                 │
│  ⏳ Formatting label text...                                     │
│  ⏳ Applying compliance rules...                                 │
│  ⏳ Rendering preview...                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌──────────────────────────────────────────────────────────────────┐
│  Allergen Warning Label: Whole Wheat Bread                [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚠ Cannot Generate Allergen Label                               │
│                                                                  │
│  Missing required information:                                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ❌ No allergens declared for this product                   │ │
│  │    Action: Declare allergens in Product > Allergens tab    │ │
│  │                                                            │ │
│  │ ⚠ Contact information not configured                       │ │
│  │    Action: Add company contact in Organization Settings    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Required for compliance:                                        │
│  • At least one allergen declaration (Contains or May Contain)  │
│  • Company contact information (phone/email)                    │
│  • Product name and code                                        │
│                                                                  │
│  [Add Allergen Data] [Configure Contact Info] [Cancel]          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌──────────────────────────────────────────────────────────────────┐
│  Allergen Warning Label Generator                         [X]    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                          [⚠️ Icon]                                │
│                                                                  │
│                   No Product Selected                            │
│                                                                  │
│  Select a product with allergen declarations to generate a       │
│  compliant allergen warning label.                               │
│                                                                  │
│  Available formats:                                              │
│  • EU FIC 1169/2011 (bold allergens, full names)                │
│  • FDA FALCPA (major allergen statement)                        │
│  • Package Insert (customer allergen card)                      │
│  • Custom (editable template)                                   │
│                                                                  │
│  All formats meet regulatory requirements and include:           │
│  ✓ Allergen declarations (Contains/May Contain)                 │
│  ✓ Contact information for allergen inquiries                   │
│  ✓ Product identification (name, code, lot)                     │
│                                                                  │
│                      [Select Product]                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Format Selector
- **Dropdown**: EU FIC, FDA FALCPA, Package Insert, Custom
- **Format Preview**: Shows sample before product data loaded
- **Auto-Select**: Based on organization's country (US → FDA, EU → EU FIC)
- **Custom Templates**: User-defined templates saved in settings

### 2. Label Customization Toolbar
- **Label Size**: Dropdown (2x3", 4x6", A4, A6, custom dimensions)
- **Zoom**: Dropdown (50%, 75%, 100%, 125%, 150%, Fit to Window)
- **Language**: Dropdown (English, Spanish, French, German, Polish - based on org settings)
- **Background**: Dropdown (White, Yellow, None/Transparent)
- **Font Size**: Slider (8pt to 18pt)

### 3. Preview Canvas
- **Live Preview**: Real-time rendering of label with current settings
- **Print-Ready**: WYSIWYG - what you see is what prints/exports
- **Scaling**: Maintains aspect ratio, shows actual size indicator
- **Grid Lines**: Optional toggle to show safe margins (0.25" from edges)

### 4. Allergen Content Display

#### EU FIC Format
- **Bold Text**: All allergen names in BOLD CAPITALS
- **Full Names**: "GLUTEN (cereals containing gluten: wheat, rye, barley, oats, spelt)"
- **Sections**: "CONTAINS:" and "MAY CONTAIN:" clearly separated
- **Source Details**: Shows specific source in parentheses (e.g., "tree nuts: walnuts, almonds")

#### FDA FALCPA Format
- **Common Names**: Uses common/usual names (Wheat, not Gluten; Cow's milk, not Milk)
- **Big 8 Focus**: Emphasizes major allergens (Milk, Eggs, Fish, Shellfish, Tree nuts, Peanuts, Wheat, Soybeans)
- **Specific Nut**: Requires specific tree nut type (e.g., "Tree Nuts (Walnuts)" not just "Tree Nuts")
- **Facility Statement**: "Manufactured in a facility that also processes: ..."

#### Package Insert Format
- **Checkbox Grid**: Visual checkboxes (☑ Contains, ⚠ May Contain, ☐ Free From)
- **Icon Support**: Optional allergen icons (emoji or custom graphics)
- **Contact Emphasis**: Large, clear contact information
- **Customer-Friendly**: Simplified language, visual hierarchy

### 5. Compliance Indicators
- **Green Check**: Regulation requirements met
- **Yellow Warning**: Optional fields missing (e.g., logo, custom text)
- **Red Error**: Compliance issue (e.g., allergen not properly formatted, missing contact)
- **Tooltip**: Hover over indicator for details

### 6. Customization Options
- **[Edit Contact Info]**: Opens org settings to update phone/email
- **[Customize Text]**: Opens text editor for additional statements (e.g., "Vegan", "Organic")
- **[Add Logo]**: Upload company logo (shown in header)
- **[Font Settings]**: Font family, size, color, bold/italic

---

## Main Actions

### Primary Actions
- **[Export PDF]**: Generates print-ready PDF
  - Renders label at actual size (e.g., 4x6" at 300 DPI)
  - Embeds fonts for consistency
  - Includes crop marks if "Print with Bleeds" enabled
  - Downloads as `{product_code}_allergen_label_{date}.pdf`
  - Shows toast: "Allergen label exported to PDF"

- **[Print Label]**: Sends to printer
  - Opens print dialog with label printer selection
  - Pre-configured label sizes (4x6", 2x3", etc.)
  - Option to print multiple copies
  - Supports thermal label printers (Zebra, Brother, Dymo)
  - Shows toast: "Label sent to printer"

- **[Save as Template]**: Saves current settings as template
  - Prompts for template name
  - Saves: format, size, customizations, contact info, font settings
  - Available in "Custom" format dropdown for future labels
  - Shows toast: "Template '{name}' saved"

### Secondary Actions
- **[Edit Contact Info]**: Opens organization settings
  - Quick-edits company name, phone, email
  - Saves to org settings (used across all labels)
  - Returns to label generator with updated info
  - Shows toast: "Contact info updated"

- **[Customize Text]**: Opens text customization modal
  - Header text (default: "ALLERGEN INFORMATION")
  - Footer text (default: contact info)
  - Additional statements (e.g., "Certified Gluten-Free", "Made in USA")
  - Disclaimer text (legal requirements)
  - Saves to template or applies to current label only

- **[Add Logo]**: Opens logo upload
  - Accepts: PNG, JPG, SVG (transparent PNG recommended)
  - Max size: 500x200px (scaled to fit header)
  - Preview before save
  - Saved to org settings (used across all labels)

- **Format Change**: (Dropdown selection)
  - Re-renders label in new format
  - Preserves allergen data, reapplies formatting rules
  - Shows compliance check for new format
  - Updates preview instantly

- **Language Change**: (Dropdown selection)
  - Translates standard text ("CONTAINS", "MAY CONTAIN", etc.)
  - Allergen names translated (uses localized allergen table)
  - Requires nutrition/allergen data in selected language
  - Shows warning if translations missing

---

## 4 States (One-Line)

- **Loading**: Spinner + progress steps ("Loaded allergens", "Formatting label", "Rendering preview") while GET /api/technical/products/:id/allergens/label runs
- **Empty**: "No Product Selected" with explanation of label formats + [Select Product] CTA
- **Error**: Red banner + list of missing requirements (allergens, contact info) + [Add Data] links
- **Success**: Live label preview in selected format + customization toolbar + compliance checks + actions to export/print/save

---

## Label Formats & Compliance

### EU FIC 1169/2011
**Requirements**:
- All 14 EU allergens must be reviewed (present or absent)
- Allergen names in BOLD or with contrasting background
- Full allergen names (not abbreviations)
- Clear separation of "Contains" vs "May Contain"
- Contact information for allergen inquiries

**Example**:
```
CONTAINS: GLUTEN (cereals containing gluten: wheat, oats),
MILK (milk and dairy products including lactose),
EGGS (eggs and egg products)

MAY CONTAIN: PEANUTS, SESAME
```

### FDA FALCPA (US)
**Requirements**:
- Declare "Big 8" major allergens: Milk, Eggs, Fish, Crustacean shellfish, Tree nuts, Peanuts, Wheat, Soybeans
- Use common/usual names (Wheat, not Gluten)
- Specific tree nut/fish/shellfish types must be named
- Can be in ingredient list OR separate "Contains" statement
- Optional: "May contain" or "Manufactured in facility that also processes"

**Example**:
```
CONTAINS: WHEAT, MILK, EGG, SOY, TREE NUTS (WALNUTS)

MAY CONTAIN: PEANUTS, SESAME

Manufactured in a facility that also processes peanuts and sesame.
```

### Canada (Similar to FDA)
**Requirements**:
- Declare priority allergens (10 in Canada: + Sesame, Mustard, Sulphites)
- Bilingual (English/French)
- Common names with specific types

### Australia/NZ
**Requirements**:
- Declare allergens in ingredient list
- Bold or contrasting format
- Specific allergen types

### Package Insert (Best Practices)
**Requirements**:
- Customer-friendly language
- Visual hierarchy (checkboxes, icons)
- Clear contact information
- Product identification (lot, best before)
- Suitable for retail/foodservice

---

## Validation Rules

### Prerequisites
- Product must have at least 1 allergen declaration (Contains or May Contain)
- Organization contact information configured (phone and/or email)
- Product name and code exist

### Compliance Checks
| Format | Check | Rule |
|--------|-------|------|
| EU FIC | All EU 14 reviewed | User must confirm all 14 allergens checked (present/absent) |
| EU FIC | Bold formatting | Allergen names rendered in bold capitals |
| EU FIC | Full names | Uses full allergen descriptions (e.g., "Milk and dairy products") |
| FDA FALCPA | Big 8 declared | If any Big 8 present, must be declared |
| FDA FALCPA | Common names | Uses FDA-approved common names (Wheat, not Gluten) |
| FDA FALCPA | Specific types | Tree nut/fish/shellfish types specified |
| All | Contact info | Phone and/or email included |
| All | Product ID | Product name and code shown |

### Export Validation
- PDF: Label dimensions valid (1" to 12" width/height)
- Print: Printer supports selected label size
- Template: Template name unique (1-50 chars)
- Logo: Image < 5 MB, supported format (PNG/JPG/SVG)

---

## Accessibility

- **Touch Targets**: All buttons, dropdowns >= 48x48dp
- **Contrast**: Label text meets WCAG AA (4.5:1 on white, 3:1 on yellow)
- **Screen Reader**: Announces "Allergen Warning Label for {product}", format, allergen list
- **Keyboard**: Tab navigation, Enter to open dropdowns, Escape to close
- **Focus**: Format selector auto-focused on modal open
- **Print-Friendly**: High contrast, large fonts for readability

---

## Technical Notes

### API Endpoints
- **Get Label**: `GET /api/technical/products/:id/allergens/label?format={eu|fda|insert|custom}`
  ```typescript
  Response: {
    product: { id, code, name };
    allergens: {
      contains: { id, name, description, sources }[];
      may_contain: { id, name, reason }[];
      free_from: { id, name }[];
    };
    contact: { company, phone, email };
    format_config: { size, language, background, font };
  }
  ```

- **Export PDF**: `POST /api/technical/allergens/label/export`
  ```typescript
  Request: {
    product_id: string;
    format: 'eu' | 'fda' | 'insert' | 'custom';
    size: '2x3' | '4x6' | 'a4' | 'a6' | 'custom';
    customizations: { header, footer, additional_text, logo_url };
  }
  Response: PDF binary stream
  ```

- **Save Template**: `POST /api/technical/settings/allergen-label-templates`
  ```typescript
  Request: {
    name: string;
    format: string;
    config: { size, language, background, font, customizations };
  }
  ```

### Label Rendering
- **Technology**: Use `@react-pdf/renderer` or similar for PDF generation
- **Fonts**: Embed fonts for consistency (Arial, Helvetica for compatibility)
- **Resolution**: 300 DPI for print-quality labels
- **Dimensions**: Exact dimensions in mm (e.g., 4x6" = 101.6 x 152.4 mm)
- **Margins**: 0.25" (6.35mm) safe area for bleed

### Format Templates
```typescript
// Label template structure
{
  format: 'eu' | 'fda' | 'insert' | 'custom';
  size: { width_mm: number; height_mm: number };
  sections: {
    header: { text, font_size, bold, align };
    contains: { label, items, format_rule };
    may_contain: { label, items, format_rule };
    free_from: { show, items, format };
    contact: { show, text, font_size };
    footer: { text, font_size };
  };
  styling: {
    font_family: string;
    font_size: number;
    background_color: string;
    text_color: string;
    bold_allergens: boolean;
  };
}
```

### Localization
- Allergen names: Localized in `allergens` table (name_en, name_es, name_fr, etc.)
- Standard text: Localized in i18n files ("CONTAINS" → "CONTIENT" in French)
- Contact info: Pulled from org settings (no translation needed)

### Caching
```typescript
'org:{orgId}:allergen:label:{productId}:{format}:{lang}' // 5 min TTL
```

---

## Related Screens

- **TEC-010-allergen-management**: Allergen declarations (source of data)
- **Product Detail**: Opens label generator from [Generate Allergen Label] button
- **Organization Settings**: Contact info configuration
- **Label Template Manager**: Manage saved custom templates

---

## Handoff Notes

### For FRONTEND-DEV:
1. Use ShadCN Dialog (lg size: 700px) for label generator modal
2. PDF rendering: `@react-pdf/renderer` for React-based PDF generation
3. Print: Use browser print API with page setup for label sizes
4. Preview: Canvas or PDF embed for live preview
5. Dropdowns: ShadCN Select for format, size, language, background
6. Image upload: Drag-drop support for logo (react-dropzone)
7. Template saving: Store in `org_settings` JSONB field
8. Real-time preview: Update on any customization change (debounce 300ms)

### For BACKEND-DEV:
1. Implement label format renderers (EU, FDA, Insert, Custom)
2. Apply formatting rules per format (bold allergens, specific names, etc.)
3. Localization support for allergen names and standard text
4. PDF generation with embedded fonts, exact dimensions
5. Template CRUD (save, load, delete custom templates)
6. Compliance validation (all EU 14 checked, Big 8 declared, etc.)
7. Logo storage with S3/Supabase Storage
8. Audit trail: log all label exports (who, when, which product/format)

---

## Approval Status

**Mode**: auto_approve
**User Approved**: true (explicit opt-in)
**Screens Approved**: [TEC-012-allergen-warnings]
**Iterations Used**: 0
**Ready for Handoff**: Yes

---

**Status**: Approved for FRONTEND-DEV/BACKEND-DEV handoff
