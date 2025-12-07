# Story 2.22: Technical Settings Configuration

**Epic:** 2 - Technical Core
**Batch:** 2A - Products + Settings
**Status:** Pending
**Priority:** P0 (Blocker)
**Story Points:** 2
**Created:** 2025-11-23

---

## Goal

Create a centralized configuration interface for Technical module settings, allowing administrators to control product field visibility/mandatory status, BOM limits, and conditional flags for organizational customization.

## User Story

**As an** Admin
**I want** to configure Technical module settings
**So that** product and BOM behavior matches our specific operational needs

---

## Problem Statement

Different manufacturing organizations have varying requirements for product master data:

**Food Manufacturing:**
- Shelf life is critical (mandatory)
- Allergen tracking is essential
- Conditional flags for organic/vegan products

**Pharma Manufacturing:**
- Lot tracking is mandatory
- Shelf life and expiry dates critical
- Strict version control (max versions limit)

**Electronics Manufacturing:**
- Serial tracking needed
- Shelf life not relevant (can hide)
- Different conditional flags (RoHS, lead-free)

**General Manufacturing:**
- Variable needs across industries
- Some fields irrelevant to specific operations
- Need flexibility without custom code

Without configurable settings:
- All organizations see all fields (cluttered UI)
- Cannot enforce industry-specific mandatory fields
- Features like conditional BOMs not adaptable
- Lower user adoption (irrelevant options confuse users)

---

## Acceptance Criteria

### AC-2.22.1: Technical Settings Navigation

**Given** I am an Admin user
**When** I navigate to `/settings/technical`
**Then** I see a Technical Settings configuration page

**And** the page contains sections:
1. Product Field Configuration
2. BOM Settings
3. Conditional Flags

**Success Criteria:**
- Page accessible from Settings menu
- Breadcrumb: Settings > Technical
- Non-admin users cannot access (403 Forbidden)

---

### AC-2.22.2: Product Field Configuration Section

**Given** I am on the Technical Settings page
**Then** I see a "Product Field Configuration" section with:
- Title: "Product Field Configuration"
- Subtitle: "Control which fields are visible and mandatory when creating/editing products"

**And** a table showing all configurable product fields:

| Field Name | Visible | Mandatory |
|------------|---------|-----------|
| Shelf Life (days) | ☑️ | ☐ |
| Min Stock Qty | ☑️ | ☐ |
| Max Stock Qty | ☑️ | ☐ |
| Reorder Point | ☑️ | ☐ |
| Cost per Unit | ☑️ | ☐ |
| Category | ☑️ | ☐ |

**And** each row has:
- **Field Name:** Display name of the field
- **Visible Checkbox:** Toggle visibility in product forms
- **Mandatory Checkbox:** Make field required (only if visible)

**When** I uncheck "Visible" for a field
**Then** the "Mandatory" checkbox is automatically unchecked and disabled
**And** helper text appears: "Hidden fields cannot be mandatory"

**When** I check "Mandatory" for a field
**Then** "Visible" is automatically checked (if not already)

**Success Criteria:**
- Clear indication of current configuration
- Intuitive toggle behavior
- Visual feedback on state changes
- Save button at bottom of section

---

### AC-2.22.3: Save Product Field Configuration

**Given** I have modified product field settings
**When** I click "Save Changes" button
**Then** settings are saved via PUT /api/technical/settings
**And** a success toast appears: "Technical settings saved successfully"
**And** the configuration is immediately applied

**When** I create a new product
**Then** only visible fields appear in the form
**And** mandatory fields show required asterisk and validation

**When** I edit an existing product
**Then** only visible fields appear in the edit drawer
**And** mandatory validation applies on save

**Success Criteria:**
- Settings persist across sessions
- Changes apply immediately (no page refresh needed)
- Product forms respect configuration

---

### AC-2.22.4: BOM Settings Section

**Given** I am on the Technical Settings page
**Then** I see a "BOM Settings" section with:
- Title: "BOM Settings"
- Subtitle: "Configure Bill of Materials behavior"

**And** the section contains:

1. **Max BOM Versions:**
   - Label: "Maximum BOM Versions per Product"
   - Number input (optional)
   - Placeholder: "Unlimited"
   - Helper text: "Leave empty for unlimited versions"
   - Validation: Must be > 0 if set

2. **Use Conditional Flags:**
   - Label: "Enable Conditional BOM Items"
   - Toggle switch (on/off)
   - Helper text: "Allow BOM items to be conditionally included based on flags (e.g., organic, vegan)"

**When** I set max BOM versions to 10
**Then** products cannot have more than 10 BOM versions
**And** creating an 11th version fails with error: "Maximum BOM versions (10) reached for this product"

**When** I toggle "Use Conditional Flags" to ON
**Then** the Conditional Flags list section becomes visible

**Success Criteria:**
- Max versions limit is enforced in BOM creation (Story 2.6+)
- Conditional flags toggle controls feature availability
- Settings clearly explained

---

### AC-2.22.5: Conditional Flags Configuration

**Given** "Use Conditional Flags" is enabled
**Then** I see a "Conditional Flags" subsection with:
- Title: "Conditional Flags"
- Subtitle: "Manage flags for conditional BOM items"

**And** a list of default flags (with checkboxes):
- ☑️ organic
- ☑️ gluten_free
- ☑️ vegan
- ☑️ kosher
- ☑️ halal
- ☑️ dairy_free
- ☑️ nut_free
- ☑️ soy_free

**And** an "Add Custom Flag" section with:
- Text input: "Enter custom flag name"
- "Add" button

**When** I uncheck a default flag
**Then** it is removed from available flags for BOM items
**And** existing BOM items with that flag are not affected (historical data preserved)

**When** I add a custom flag (e.g., "halal_certified")
**Then** it is appended to the flags list
**And** becomes available when creating/editing BOM items

**When** I save settings
**Then** the conditional_flags JSONB is updated with active flags

**Success Criteria:**
- Default flags can be enabled/disabled
- Custom flags can be added (no delete, only disable)
- Flag format: lowercase, underscores allowed
- Changes reflected in BOM item forms (Story 2.12)

---

### AC-2.22.6: Settings Initialization for New Organizations

**Given** a new organization is created
**When** the organization is initialized
**Then** a default technical_settings record is created with:

```json
{
  "product_field_config": {
    "shelf_life_days": { "visible": true, "mandatory": false },
    "min_stock_qty": { "visible": true, "mandatory": false },
    "max_stock_qty": { "visible": true, "mandatory": false },
    "reorder_point": { "visible": true, "mandatory": false },
    "cost_per_unit": { "visible": true, "mandatory": false },
    "category": { "visible": true, "mandatory": false }
  },
  "max_bom_versions": null,
  "use_conditional_flags": false,
  "conditional_flags": [
    "organic", "gluten_free", "vegan", "kosher",
    "halal", "dairy_free", "nut_free", "soy_free"
  ]
}
```

**Success Criteria:**
- All fields visible by default (no surprises for new users)
- No mandatory fields by default (ease of onboarding)
- All default conditional flags available

---

### AC-2.22.7: Settings Validation

**Given** I am configuring technical settings
**Then** the following validations apply:

1. **Product Field Config:**
   - Mandatory fields must be visible
   - At least code, name, type, uom must remain visible (cannot hide)

2. **Max BOM Versions:**
   - Must be integer > 0 or null
   - Error: "Max BOM versions must be a positive number"

3. **Conditional Flags:**
   - Flag names must be lowercase_snake_case
   - No duplicates
   - Error: "Flag name must be lowercase letters and underscores only"

**Success Criteria:**
- Client-side validation prevents most errors
- Server-side validation is authoritative
- Clear error messages

---

### AC-2.22.8: Settings Audit Trail

**Given** technical settings are modified
**When** I save changes
**Then** the updated_at timestamp is set to current time
**And** the updated_by field is set to my user ID

**When** I view the settings page
**Then** I see metadata at the bottom:
- "Last updated: Nov 23, 2025 10:30 AM"
- "Last updated by: John Doe"

**Success Criteria:**
- Audit trail for compliance
- Visibility into who changed settings

---

## Technical Implementation

### Database Schema

**technical_settings table** (already defined in migration 014):

```sql
CREATE TABLE technical_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),
  product_field_config JSONB NOT NULL DEFAULT '{
    "shelf_life_days": {"visible": true, "mandatory": false},
    "min_stock_qty": {"visible": true, "mandatory": false},
    "max_stock_qty": {"visible": true, "mandatory": false},
    "reorder_point": {"visible": true, "mandatory": false},
    "cost_per_unit": {"visible": true, "mandatory": false},
    "category": {"visible": true, "mandatory": false}
  }',
  max_bom_versions INTEGER,
  use_conditional_flags BOOLEAN DEFAULT false,
  conditional_flags JSONB DEFAULT '["organic", "gluten_free", "vegan", "kosher", "halal", "dairy_free", "nut_free", "soy_free"]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);
```

### API Endpoints

#### GET /api/technical/settings

**Response:**
```json
{
  "product_field_config": {
    "shelf_life_days": { "visible": true, "mandatory": false },
    "min_stock_qty": { "visible": true, "mandatory": false },
    "max_stock_qty": { "visible": true, "mandatory": false },
    "reorder_point": { "visible": true, "mandatory": false },
    "cost_per_unit": { "visible": true, "mandatory": false },
    "category": { "visible": true, "mandatory": false }
  },
  "max_bom_versions": null,
  "use_conditional_flags": false,
  "conditional_flags": [
    "organic", "gluten_free", "vegan", "kosher",
    "halal", "dairy_free", "nut_free", "soy_free"
  ],
  "updated_at": "2025-11-23T10:00:00Z",
  "updated_by": {
    "id": "uuid",
    "name": "Admin User"
  }
}
```

#### PUT /api/technical/settings

**Request:**
```json
{
  "product_field_config": {
    "shelf_life_days": { "visible": true, "mandatory": true },
    "min_stock_qty": { "visible": false, "mandatory": false }
  },
  "max_bom_versions": 10,
  "use_conditional_flags": true,
  "conditional_flags": [
    "organic", "gluten_free", "vegan", "halal_certified"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "settings": { /* updated settings */ }
}
```

**Implementation:**
```typescript
// app/api/technical/settings/route.ts
export async function GET() {
  const settings = await db.queryRow(`
    SELECT
      ts.*,
      u.name as updated_by_name
    FROM technical_settings ts
    LEFT JOIN users u ON ts.updated_by = u.id
    WHERE ts.org_id = $1
  `, [orgId])

  if (!settings) {
    // Initialize default settings if not exist
    await initializeDefaultSettings(orgId)
    return GET() // Recurse to fetch newly created settings
  }

  return NextResponse.json({
    ...settings,
    updated_by: { id: settings.updated_by, name: settings.updated_by_name }
  })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const validated = technicalSettingsSchema.parse(body)

  // Upsert settings
  await db.execute(`
    INSERT INTO technical_settings (org_id, product_field_config, max_bom_versions, use_conditional_flags, conditional_flags, updated_by)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (org_id)
    DO UPDATE SET
      product_field_config = EXCLUDED.product_field_config,
      max_bom_versions = EXCLUDED.max_bom_versions,
      use_conditional_flags = EXCLUDED.use_conditional_flags,
      conditional_flags = EXCLUDED.conditional_flags,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `, [
    orgId,
    JSON.stringify(validated.product_field_config),
    validated.max_bom_versions,
    validated.use_conditional_flags,
    JSON.stringify(validated.conditional_flags),
    userId
  ])

  const settings = await getSettings(orgId)
  return NextResponse.json({ success: true, settings })
}
```

### Validation Schema

```typescript
const fieldConfigSchema = z.object({
  visible: z.boolean(),
  mandatory: z.boolean()
}).refine(data => !data.mandatory || data.visible, {
  message: 'Mandatory fields must be visible'
})

const technicalSettingsSchema = z.object({
  product_field_config: z.record(fieldConfigSchema),
  max_bom_versions: z.number().int().positive().nullable(),
  use_conditional_flags: z.boolean(),
  conditional_flags: z.array(
    z.string().regex(/^[a-z_]+$/, 'Flag name must be lowercase with underscores only')
  )
})
```

### Frontend Components

```
apps/frontend/app/settings/technical/
├── page.tsx                          # Technical settings page
└── components/
    ├── ProductFieldConfig.tsx        # Field visibility/mandatory toggles
    ├── BomSettingsSection.tsx        # BOM limits and conditional flags
    └── ConditionalFlagsConfig.tsx    # Conditional flags management
```

**ProductFieldConfig.tsx:**
```tsx
export function ProductFieldConfig({ config, onChange }: Props) {
  const fields = [
    { key: 'shelf_life_days', label: 'Shelf Life (days)' },
    { key: 'min_stock_qty', label: 'Min Stock Qty' },
    { key: 'max_stock_qty', label: 'Max Stock Qty' },
    { key: 'reorder_point', label: 'Reorder Point' },
    { key: 'cost_per_unit', label: 'Cost per Unit' },
    { key: 'category', label: 'Category' }
  ]

  function handleVisibleChange(key: string, visible: boolean) {
    onChange({
      ...config,
      [key]: { visible, mandatory: visible ? config[key].mandatory : false }
    })
  }

  function handleMandatoryChange(key: string, mandatory: boolean) {
    onChange({
      ...config,
      [key]: { visible: true, mandatory } // Auto-enable visible if mandatory
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field Name</TableHead>
          <TableHead>Visible</TableHead>
          <TableHead>Mandatory</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map(field => (
          <TableRow key={field.key}>
            <TableCell>{field.label}</TableCell>
            <TableCell>
              <Checkbox
                checked={config[field.key].visible}
                onCheckedChange={(checked) => handleVisibleChange(field.key, !!checked)}
              />
            </TableCell>
            <TableCell>
              <Checkbox
                checked={config[field.key].mandatory}
                disabled={!config[field.key].visible}
                onCheckedChange={(checked) => handleMandatoryChange(field.key, !!checked)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## UI/UX Specifications

### Visual Design

**Settings Page Layout:**
- Sections with clear headings and dividers
- White cards for each section
- Consistent spacing (gap-6)

**Toggles and Checkboxes:**
- Large hit areas for easy clicking
- Disabled state clearly visible (grayed out)
- Tooltips on hover for disabled elements

**Save Button:**
- Fixed at bottom of page
- Primary color, prominent
- Shows loading state when saving

---

## Testing Checklist

### Unit Tests

```typescript
test('validates mandatory fields must be visible', () => {
  expect(() => technicalSettingsSchema.parse({
    product_field_config: {
      shelf_life_days: { visible: false, mandatory: true }
    }
  })).toThrow()
})

test('validates conditional flag format', () => {
  expect(() => technicalSettingsSchema.parse({
    conditional_flags: ['Organic'] // Uppercase not allowed
  })).toThrow()

  const valid = technicalSettingsSchema.parse({
    conditional_flags: ['organic', 'halal_certified']
  })
  expect(valid).toBeDefined()
})
```

### Integration Tests

```typescript
test('PUT /api/technical/settings saves configuration', async () => {
  const response = await fetch('/api/technical/settings', {
    method: 'PUT',
    body: JSON.stringify({
      product_field_config: {
        shelf_life_days: { visible: true, mandatory: true }
      },
      max_bom_versions: 10,
      use_conditional_flags: true,
      conditional_flags: ['organic', 'vegan']
    })
  })
  expect(response.status).toBe(200)
  const data = await response.json()
  expect(data.settings.max_bom_versions).toBe(10)
})

test('Settings initialization for new org', async () => {
  const newOrg = await createOrganization()
  const settings = await getSettings(newOrg.id)

  expect(settings.product_field_config.shelf_life_days.visible).toBe(true)
  expect(settings.use_conditional_flags).toBe(false)
  expect(settings.conditional_flags).toContain('organic')
})
```

### E2E Tests

```typescript
test('Admin configures product field visibility', async ({ page }) => {
  await page.goto('/settings/technical')

  // Hide shelf life field
  await page.click('tr:has-text("Shelf Life") >> input[type="checkbox"]:left')
  await page.click('button:has-text("Save Changes")')
  await expect(page.locator('text=Technical settings saved')).toBeVisible()

  // Verify in product create form
  await page.goto('/technical/products')
  await page.click('button:has-text("Add Product")')
  await expect(page.locator('label:has-text("Shelf Life")')).not.toBeVisible()
})

test('Admin enables conditional flags', async ({ page }) => {
  await page.goto('/settings/technical')

  // Enable conditional flags
  await page.click('label:has-text("Enable Conditional BOM Items") >> input[type="checkbox"]')

  // Add custom flag
  await page.fill('input[placeholder="Enter custom flag name"]', 'halal_certified')
  await page.click('button:has-text("Add")')

  await page.click('button:has-text("Save Changes")')
  await expect(page.locator('text=Technical settings saved')).toBeVisible()
})
```

---

## Dependencies

**Required Before This Story:**
- ✅ Epic 1 (Settings foundation)
- ✅ technical_settings table created
- ✅ Admin role permissions

**Enables:**
- Story 2.1 (Product CRUD) - Field visibility/mandatory enforcement
- Story 2.6+ (BOM) - Max versions limit, conditional flags
- All future Technical module features

---

## Definition of Done

- [ ] technical_settings table seeded with defaults
- [ ] GET /api/technical/settings endpoint
- [ ] PUT /api/technical/settings endpoint
- [ ] Technical Settings page created
- [ ] ProductFieldConfig component with toggles
- [ ] BomSettingsSection component
- [ ] ConditionalFlagsConfig component
- [ ] Settings validation (visible/mandatory logic)
- [ ] Default settings initialization for new orgs
- [ ] Audit trail (updated_by, updated_at)
- [ ] Unit tests (100% coverage)
- [ ] Integration tests for API
- [ ] E2E tests for configuration flow
- [ ] Code review approved
- [ ] Documentation committed

---

## Estimation Breakdown

**2 Story Points = ~3-4 hours**
- API endpoints (GET, PUT): 1 hour
- Technical Settings page layout: 1 hour
- ProductFieldConfig component: 1 hour
- BOM settings + conditional flags: 1 hour
- Testing (unit, integration, E2E): 1 hour
- Bug fixes: 30 min
