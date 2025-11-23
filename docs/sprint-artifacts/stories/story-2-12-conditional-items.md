# Story 2.12: Conditional BOM Items

Status: ready-for-dev

## Story

As a **Technical user**,
I want to add conditions to BOM items,
So that certain materials are only used for specific variants.

## Acceptance Criteria

### AC-2.12.1: Conditional Flags Feature Toggle
**Given** technical_settings.conditional_flags_enabled = true
**When** adding/editing BOM item
**Then** conditional flags section visible in form

**And** if feature disabled (conditional_flags_enabled = false):
- Conditional flags fields hidden
- Existing conditional items still saved (not deleted)
- Conditions ignored during consumption (all items consumed)

### AC-2.12.2: Conditional Flags Selection
**When** adding/editing BOM item with flags enabled
**Then** form shows:
- "Conditional Flags" multi-select field
- "Condition Logic" radio buttons (AND / OR)

**And** flags populated from:
- Default flags: organic, gluten_free, vegan, kosher, halal, dairy_free, nut_free, soy_free
- Custom flags (defined in technical_settings)

**And** condition_logic required only if condition_flags selected (1+ flags)

### AC-2.12.3: AND Logic Example
**Given** BOM item "Organic Flour" has:
- condition_flags: ["organic", "vegan"]
- condition_logic: "AND"

**Then** item tooltip shows:
"Only consumed when Work Order has BOTH organic AND vegan flags"

**And** during WO consumption (Epic 4):
- If WO has flags ["organic", "vegan", "gluten_free"] → consume item ✅
- If WO has flags ["organic"] only → skip item ❌
- If WO has flags ["vegan"] only → skip item ❌

### AC-2.12.4: OR Logic Example
**Given** BOM item "Sugar" has:
- condition_flags: ["organic", "kosher"]
- condition_logic: "OR"

**Then** item tooltip shows:
"Only consumed when Work Order has EITHER organic OR kosher flag"

**And** during WO consumption (Epic 4):
- If WO has flags ["organic"] → consume item ✅
- If WO has flags ["kosher"] → consume item ✅
- If WO has flags ["halal"] only → skip item ❌

### AC-2.12.5: Visual Indication in Items Table
**Given** BOM items table
**Then** conditional items shown with flag badges:
- Item row has "Conditional" badge
- Hover shows: flags list + logic
- Example: "organic, vegan (AND)"

**And** non-conditional items (no flags) shown normally

### AC-2.12.6: Custom Flags Management
**Given** Admin navigates to /settings/technical
**Then** can add custom conditional flags:
- Flag code (e.g., "sugar_free")
- Flag name (e.g., "Sugar Free")

**And** custom flags available in BOM item form multi-select
**And** custom flags displayed in BOM items table

### AC-2.12.7: No Conditions (Default Behavior)
**Given** BOM item has no condition_flags (NULL or empty array)
**Then** item always consumed (unconditional)
**And** no "Conditional" badge shown

## Tasks / Subtasks

### Task 1: Database Schema Updates (AC: 2.12.1-2.12.2)
- [ ] Verify bom_items table has columns:
  ```sql
  condition_flags TEXT[],
  condition_logic VARCHAR(10) CHECK (condition_logic IN ('AND', 'OR'))
  ```
  - [ ] Already added in Story 2.7, verify migration applied
- [ ] Add technical_settings.conditional_flags_enabled column:
  ```sql
  ALTER TABLE technical_settings
  ADD COLUMN conditional_flags_enabled BOOLEAN DEFAULT true;
  ```
- [ ] Add technical_settings.custom_flags column:
  ```sql
  ALTER TABLE technical_settings
  ADD COLUMN custom_flags JSONB DEFAULT '[]';
  ```
  - [ ] custom_flags format: `[{ code: "sugar_free", name: "Sugar Free" }, ...]`
- [ ] Run migration

### Task 2: Default Conditional Flags (AC: 2.12.2)
- [ ] Create lib/constants/conditional-flags.ts:
  ```typescript
  export const DEFAULT_CONDITIONAL_FLAGS = [
    { code: 'organic', name: 'Organic' },
    { code: 'gluten_free', name: 'Gluten Free' },
    { code: 'vegan', name: 'Vegan' },
    { code: 'kosher', name: 'Kosher' },
    { code: 'halal', name: 'Halal' },
    { code: 'dairy_free', name: 'Dairy Free' },
    { code: 'nut_free', name: 'Nut Free' },
    { code: 'soy_free', name: 'Soy Free' }
  ]

  export type ConditionalFlag = {
    code: string
    name: string
  }
  ```

### Task 3: Fetch Conditional Flags API (AC: 2.12.2, 2.12.6)
- [ ] Implement GET /api/technical/settings/conditional-flags
  - [ ] Return: `{ enabled: boolean, flags: ConditionalFlag[] }`
  - [ ] Merge default flags + custom flags from technical_settings
  - [ ] Cache: 10 min TTL
- [ ] Add to lib/api/SettingsService.ts:
  ```typescript
  export async function getConditionalFlags(): Promise<{
    enabled: boolean
    flags: ConditionalFlag[]
  }>
  ```

### Task 4: BOM Item Form - Conditional Flags Section (AC: 2.12.1-2.12.2)
- [ ] Update components/technical/BOMItemModal.tsx
- [ ] Fetch conditional flags on mount:
  ```typescript
  const { data: flagsConfig } = useSWR('/api/technical/settings/conditional-flags', fetcher)
  ```
- [ ] If flagsConfig.enabled = false → hide conditional fields
- [ ] Add conditional section to form:
  ```typescript
  {flagsConfig?.enabled && (
    <div className="space-y-4 border-t pt-4 mt-4">
      <h4 className="font-medium">Conditional Consumption</h4>
      <p className="text-sm text-muted-foreground">
        Select flags to consume this item only for specific variants
      </p>

      <FormField name="condition_flags">
        <FormLabel>Conditional Flags</FormLabel>
        <MultiSelect
          options={flagsConfig.flags.map(f => ({ value: f.code, label: f.name }))}
          value={form.watch('condition_flags') || []}
          onChange={(values) => form.setValue('condition_flags', values)}
          placeholder="Select flags (optional)"
        />
        <FormDescription>
          Leave empty to always consume this item
        </FormDescription>
      </FormField>

      {form.watch('condition_flags')?.length > 0 && (
        <FormField name="condition_logic">
          <FormLabel>Condition Logic</FormLabel>
          <RadioGroup
            value={form.watch('condition_logic') || 'AND'}
            onValueChange={(value) => form.setValue('condition_logic', value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AND" id="logic-and" />
              <Label htmlFor="logic-and">
                AND (all flags required)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="OR" id="logic-or" />
              <Label htmlFor="logic-or">
                OR (any flag required)
              </Label>
            </div>
          </RadioGroup>
          <FormDescription>
            AND: Item consumed only if WO has ALL selected flags<br/>
            OR: Item consumed if WO has ANY selected flag
          </FormDescription>
        </FormField>
      )}
    </div>
  )}
  ```

### Task 5: BOM Items Table - Flag Badges (AC: 2.12.5)
- [ ] Update components/technical/BOMItemsTable.tsx
- [ ] Add "Conditions" column (after Scrap %):
  ```typescript
  {item.condition_flags && item.condition_flags.length > 0 ? (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="secondary" className="cursor-help">
          Conditional
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div>
          <p className="font-medium">Flags:</p>
          <ul className="list-disc pl-4">
            {item.condition_flags.map(flag => (
              <li key={flag}>{getFlagName(flag)}</li>
            ))}
          </ul>
          <p className="mt-2">Logic: {item.condition_logic}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {item.condition_logic === 'AND'
              ? 'All flags required'
              : 'Any flag required'}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
  ```
- [ ] Helper function dla flag name lookup:
  ```typescript
  const getFlagName = (code: string) => {
    const flag = allFlags.find(f => f.code === code)
    return flag?.name || code
  }
  ```

### Task 6: Custom Flags Management UI (AC: 2.12.6)
- [ ] Update /app/settings/technical/page.tsx
- [ ] Add "Conditional Flags" section:
  ```typescript
  <Card>
    <CardHeader>
      <CardTitle>Conditional BOM Items</CardTitle>
      <CardDescription>
        Configure flags dla conditional material consumption
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Conditional Flags</Label>
          <Switch
            checked={settings.conditional_flags_enabled}
            onCheckedChange={(checked) => updateSetting('conditional_flags_enabled', checked)}
          />
        </div>

        {settings.conditional_flags_enabled && (
          <>
            <div>
              <Label>Default Flags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DEFAULT_CONDITIONAL_FLAGS.map(flag => (
                  <Badge key={flag.code} variant="secondary">
                    {flag.name}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Default flags are always available
              </p>
            </div>

            <div>
              <Label>Custom Flags</Label>
              <CustomFlagsList
                flags={settings.custom_flags || []}
                onAdd={handleAddCustomFlag}
                onRemove={handleRemoveCustomFlag}
              />
            </div>
          </>
        )}
      </div>
    </CardContent>
  </Card>
  ```
- [ ] Create components/settings/CustomFlagsList.tsx:
  - [ ] List custom flags with delete button
  - [ ] "Add Custom Flag" button → opens dialog
  - [ ] Dialog fields: code, name
  - [ ] Validation: code must be unique, lowercase, no spaces

### Task 7: Validation Schema Updates (AC: 2.12.2)
- [ ] Update CreateBOMItemSchema:
  ```typescript
  export const CreateBOMItemSchema = z.object({
    // ... existing fields
    condition_flags: z.array(z.string()).optional(),
    condition_logic: z.enum(['AND', 'OR']).optional()
      .refine((val, ctx) => {
        if (ctx.parent.condition_flags?.length > 0 && !val) {
          return false  // condition_logic required if flags selected
        }
        return true
      }, 'Condition logic required when flags selected')
  })
  ```

### Task 8: Consumption Logic (Epic 4 Integration Note)
- [ ] Document consumption logic dla Epic 4:
  ```typescript
  // Epic 4: WO Material Consumption
  function shouldConsumeItem(
    item: BOMItem,
    woFlags: string[]
  ): boolean {
    // No conditions → always consume
    if (!item.condition_flags || item.condition_flags.length === 0) {
      return true
    }

    // AND logic → all flags required
    if (item.condition_logic === 'AND') {
      return item.condition_flags.every(flag => woFlags.includes(flag))
    }

    // OR logic → any flag required
    if (item.condition_logic === 'OR') {
      return item.condition_flags.some(flag => woFlags.includes(flag))
    }

    // Default: consume
    return true
  }
  ```
- [ ] Add to Epic 4 tech spec as reference

### Task 9: Integration & Testing (AC: All)
- [ ] Unit tests:
  - [ ] CreateBOMItemSchema validation (condition_flags + logic)
  - [ ] shouldConsumeItem logic (AND/OR, various flag combos)
- [ ] Integration tests (lib/api/__tests__/conditional-bom-items.test.ts):
  - [ ] POST BOM item with condition_flags → saved correctly
  - [ ] GET BOM items → condition_flags returned
  - [ ] Update technical_settings.conditional_flags_enabled → flags hidden/shown
  - [ ] Add custom flag → available in flags list
- [ ] E2E tests (__tests__/e2e/conditional-bom-items.spec.ts):
  - [ ] Navigate to BOM detail page
  - [ ] Click "Add Item"
  - [ ] Select conditional flags (organic, vegan)
  - [ ] Select logic (AND)
  - [ ] Submit → item saved with conditions
  - [ ] Verify "Conditional" badge shown in table
  - [ ] Hover badge → tooltip shows flags + logic
  - [ ] Navigate to Settings → disable conditional_flags_enabled
  - [ ] Return to BOM → conditional section hidden
  - [ ] Add custom flag → verify available in form

### Task 10: Documentation & Cleanup
- [ ] Document conditional flags feature (admin guide)
- [ ] Add consumption logic example to Epic 4 tech spec
- [ ] Update API documentation (conditional flags endpoint)

## Dev Notes

### Technical Stack
- **Multi-Select**: shadcn/ui MultiSelect (or custom with Popover + Checkbox)
- **Feature Toggle**: technical_settings.conditional_flags_enabled
- **Consumption Logic**: Implemented in Epic 4 (WO Material Consumption)

### Key Technical Decisions
1. **Feature Toggle**: conditional_flags_enabled allows disabling feature without deleting data
2. **Default + Custom Flags**: 8 default flags always available, custom flags addable
3. **AND/OR Logic**: Simple boolean logic (not complex expressions)
4. **Epic 4 Integration**: Consumption logic implemented in Epic 4, BOM just stores conditions

### Consumption Logic Examples
```typescript
// Example 1: AND logic
item.condition_flags = ['organic', 'vegan']
item.condition_logic = 'AND'

WO flags = ['organic', 'vegan', 'gluten_free'] → ✅ consume (has both)
WO flags = ['organic'] → ❌ skip (missing vegan)
WO flags = [] → ❌ skip (no flags)

// Example 2: OR logic
item.condition_flags = ['organic', 'kosher']
item.condition_logic = 'OR'

WO flags = ['organic'] → ✅ consume (has organic)
WO flags = ['kosher'] → ✅ consume (has kosher)
WO flags = ['halal'] → ❌ skip (has neither)
WO flags = [] → ❌ skip (no flags)

// Example 3: No conditions
item.condition_flags = null or []

WO flags = (any) → ✅ always consume
```

### Security Considerations
- **RLS Policy**: Conditional flags inherit org_id isolation
- **Validation**: Flag codes validated (lowercase, no spaces, unique)
- **Feature Toggle**: Cannot bypass by manipulating API (checked server-side)

### Project Structure
```
lib/
  constants/
    conditional-flags.ts          # Default flags list

components/
  technical/
    BOMItemModal.tsx              # Updated with conditional section
    BOMItemsTable.tsx             # Updated with flag badges
  settings/
    CustomFlagsList.tsx           # Manage custom flags

app/
  api/
    technical/
      settings/
        conditional-flags/
          route.ts                # GET conditional flags

app/
  settings/
    technical/
      page.tsx                    # Technical settings with flags management
```

### Testing Strategy
**Unit Tests**: Validation schema, consumption logic (AND/OR)
**Integration Tests**: API endpoints, feature toggle behavior
**E2E Tests**: Complete flow (add item with flags, toggle feature, custom flags)

### References
- [Source: docs/epics/epic-2-technical.md#Story-2.12]
- [Source: docs/sprint-artifacts/tech-spec-epic-2-batch-2b.md#Conditional-BOM-Items]

### Prerequisites
**Story 2.7**: BOM Items Management (condition_flags columns)
**Batch 2A**: Technical Settings table

### Dependencies
**Libraries:**
- shadcn/ui (MultiSelect, RadioGroup, Switch, Badge, Tooltip)

## Dev Agent Record
<!-- Will be filled during implementation -->

## Change Log
- 2025-01-23: Story drafted by Claude Code
