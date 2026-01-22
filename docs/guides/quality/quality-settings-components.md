# Quality Settings Component Usage Guide

Story: 06.0 - Quality Settings (Module Configuration)

## Overview

This guide explains how to use the Quality Settings React components in your application. These components provide a complete UI for configuring quality module operational parameters.

## Component Architecture

```
QualitySettingsForm (main container)
  |-- QualityCollapsibleSection (wrapper for sections)
  |     |-- InspectionSettingsSection
  |     |-- NCRSettingsSection
  |     |-- CAPASettingsSection
  |     |-- HACCPSettingsSection
  |     |-- AuditSettingsSection
```

## Installation

The components are located at:

```
apps/frontend/components/settings/quality/
```

Import from the index file:

```typescript
import {
  QualitySettingsForm,
  QualityCollapsibleSection,
  InspectionSettingsSection,
  NCRSettingsSection,
  CAPASettingsSection,
  HACCPSettingsSection,
  AuditSettingsSection,
} from '@/components/settings/quality';
```

## Dependencies

The components require the following dependencies:

```json
{
  "@tanstack/react-query": "^5.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x",
  "lucide-react": "^0.x"
}
```

Plus ShadCN UI components: Button, Form, Input, Switch, Select, Alert, Skeleton.

---

## QualitySettingsForm

The main container component that renders the complete settings form.

### Usage

```tsx
import { QualitySettingsForm } from '@/components/settings/quality';

export default function QualitySettingsPage() {
  return <QualitySettingsForm />;
}
```

### Features

- Five collapsible sections (Inspection, NCR, CAPA, HACCP, Audit)
- Dirty state tracking with unsaved changes warning
- Save button hidden for non-admin users (read-only mode)
- Success/error toast notifications
- Four states: loading, error, empty, success
- Auto-fetches settings on mount
- Caches settings for 5 minutes

### States

| State | Trigger | UI Behavior |
|-------|---------|-------------|
| Loading | Initial fetch | Shows skeleton placeholders |
| Error | API failure | Shows error message with retry button |
| Empty | No settings found | Shows initialization prompt |
| Success | Settings loaded | Shows form with all sections |

### Props

None. The component is self-contained and manages its own state via React Query hooks.

### Data Attributes for Testing

| Attribute | Description |
|-----------|-------------|
| `data-testid="quality-settings-loading"` | Loading skeleton container |
| `data-testid="quality-settings-error"` | Error state container |
| `data-testid="quality-settings-empty"` | Empty state container |
| `data-testid="quality-settings-form"` | Main form container |
| `data-testid="save-quality-settings"` | Save button |

---

## QualityCollapsibleSection

A reusable wrapper that provides collapsible behavior with localStorage persistence.

### Usage

```tsx
import { QualityCollapsibleSection } from '@/components/settings/quality';
import { ClipboardCheck } from 'lucide-react';

<QualityCollapsibleSection
  title="Inspection Settings"
  icon={<ClipboardCheck className="h-5 w-5" />}
  storageKey="inspection"
  testId="inspection-settings"
  defaultOpen
>
  {/* Section content */}
</QualityCollapsibleSection>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | Yes | - | Section header text |
| `icon` | ReactNode | No | - | Icon displayed before title |
| `storageKey` | string | Yes | - | localStorage key suffix for collapse state |
| `testId` | string | No | - | data-testid attribute value |
| `defaultOpen` | boolean | No | false | Initial open state (if no localStorage) |
| `children` | ReactNode | Yes | - | Section content |

### localStorage Behavior

The collapse state is persisted to localStorage with key format: `quality-settings-{storageKey}-collapsed`

Example: `quality-settings-inspection-collapsed`

---

## InspectionSettingsSection

Renders inspection and hold settings fields.

### Usage

```tsx
import { useForm } from 'react-hook-form';
import { InspectionSettingsSection } from '@/components/settings/quality';

const form = useForm<UpdateQualitySettingsInput>();

<InspectionSettingsSection
  control={form.control}
  isReadOnly={false}
/>
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - | react-hook-form control object |
| `isReadOnly` | boolean | No | false | Disable all inputs |

### Fields Rendered

| Field | Type | Test ID |
|-------|------|---------|
| require_incoming_inspection | Switch | `require_incoming_inspection` |
| require_final_inspection | Switch | `require_final_inspection` |
| auto_create_inspection_on_grn | Switch | `auto_create_inspection_on_grn` |
| default_sampling_level | Select | `default_sampling_level` |
| require_hold_reason | Switch | `require_hold_reason` |
| require_disposition_on_release | Switch | `require_disposition_on_release` |

### Sampling Level Options

| Value | Label |
|-------|-------|
| I | Level I - Reduced Inspection |
| II | Level II - Normal Inspection (Default) |
| III | Level III - Tightened Inspection |
| S-1 | S-1 - Special Level 1 |
| S-2 | S-2 - Special Level 2 |
| S-3 | S-3 - Special Level 3 |
| S-4 | S-4 - Special Level 4 |

---

## NCRSettingsSection

Renders Non-Conformance Report settings fields.

### Usage

```tsx
import { NCRSettingsSection } from '@/components/settings/quality';

<NCRSettingsSection
  control={form.control}
  isReadOnly={false}
/>
```

### Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - |
| `isReadOnly` | boolean | No | false |

### Fields Rendered

| Field | Type | Range | Test ID |
|-------|------|-------|---------|
| ncr_auto_number_prefix | Text Input | 1-10 chars | `ncr_auto_number_prefix` |
| ncr_require_root_cause | Switch | - | `ncr_require_root_cause` |
| ncr_critical_response_hours | Number Input | 1-168 | `ncr_critical_response_hours` |
| ncr_major_response_hours | Number Input | 1-336 | `ncr_major_response_hours` |

---

## CAPASettingsSection

Renders CAPA and CoA settings fields.

### Usage

```tsx
import { CAPASettingsSection } from '@/components/settings/quality';

<CAPASettingsSection
  control={form.control}
  watch={form.watch}
  isReadOnly={false}
/>
```

### Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - |
| `watch` | UseFormWatch<UpdateQualitySettingsInput> | Yes | - |
| `isReadOnly` | boolean | No | false |

### Fields Rendered

| Field | Type | Range | Test ID |
|-------|------|-------|---------|
| capa_auto_number_prefix | Text Input | 1-10 chars | `capa_auto_number_prefix` |
| capa_require_effectiveness | Switch | - | `capa_require_effectiveness` |
| capa_effectiveness_wait_days | Number Input | 0-365 | `capa_effectiveness_wait_days` |
| coa_auto_number_prefix | Text Input | 1-10 chars | `coa_auto_number_prefix` |
| coa_require_approval | Switch | - | `coa_require_approval` |

### Conditional Behavior

The `capa_effectiveness_wait_days` field is disabled when `capa_require_effectiveness` is false. The component uses the `watch` function to observe this dependency.

---

## HACCPSettingsSection

Renders HACCP (Hazard Analysis Critical Control Point) settings fields.

### Usage

```tsx
import { HACCPSettingsSection } from '@/components/settings/quality';

<HACCPSettingsSection
  control={form.control}
  isReadOnly={false}
/>
```

### Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - |
| `isReadOnly` | boolean | No | false |

### Fields Rendered

| Field | Type | Range | Test ID |
|-------|------|-------|---------|
| ccp_deviation_escalation_minutes | Number Input | 1-1440 | `ccp_deviation_escalation_minutes` |
| ccp_auto_create_ncr | Switch | - | `ccp_auto_create_ncr` |

### UI Elements

- Alert banner explaining HACCP settings importance
- Information box about CCP monitoring

---

## AuditSettingsSection

Renders audit trail and document retention settings fields.

### Usage

```tsx
import { AuditSettingsSection } from '@/components/settings/quality';

<AuditSettingsSection
  control={form.control}
  isReadOnly={false}
/>
```

### Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - |
| `isReadOnly` | boolean | No | false |

### Fields Rendered

| Field | Type | Range | Test ID |
|-------|------|-------|---------|
| require_change_reason | Switch | - | `require_change_reason` |
| retention_years | Number Input | 1-50 | `retention_years` |

### UI Elements

- Regulatory note about retention requirements
- Information box listing audit trail coverage

---

## React Query Hooks

### useQualitySettings

Fetches quality settings with 5-minute cache.

```typescript
import { useQualitySettings } from '@/lib/hooks/use-quality-settings';

function MyComponent() {
  const { data: settings, isLoading, error, refetch } = useQualitySettings();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{settings.ncr_auto_number_prefix}</div>;
}
```

### useUpdateQualitySettings

Mutation hook for updating settings.

```typescript
import { useUpdateQualitySettings } from '@/lib/hooks/use-quality-settings';

function MyComponent() {
  const mutation = useUpdateQualitySettings();

  const handleSave = async () => {
    try {
      await mutation.mutateAsync({
        ncr_critical_response_hours: 12
      });
      console.log('Saved!');
    } catch (error) {
      console.error('Failed:', error.message);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={mutation.isPending}
    >
      Save
    </button>
  );
}
```

### useCanUpdateQualitySettings

Checks if current user can update settings.

```typescript
import { useCanUpdateQualitySettings } from '@/lib/hooks/use-quality-settings';

function MyComponent() {
  const { data: canUpdate, isLoading } = useCanUpdateQualitySettings();

  if (isLoading) return null;

  return canUpdate ? (
    <button>Save</button>
  ) : (
    <span>Read-only access</span>
  );
}
```

---

## Custom Section Example

To create a custom section with the same styling:

```tsx
import { QualityCollapsibleSection } from '@/components/settings/quality';
import { Settings } from 'lucide-react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

function CustomSettingsSection({ control, isReadOnly }) {
  return (
    <QualityCollapsibleSection
      title="Custom Settings"
      icon={<Settings className="h-5 w-5" />}
      storageKey="custom"
      testId="custom-settings"
    >
      <div className="space-y-6">
        <FormField
          control={control}
          name="custom_field"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Custom Setting</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isReadOnly}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </QualityCollapsibleSection>
  );
}
```

---

## Styling Conventions

The components follow these TailwindCSS patterns:

| Element | Classes |
|---------|---------|
| Toggle row | `flex flex-row items-center justify-between rounded-lg border p-4` |
| Toggle label wrapper | `space-y-0.5` |
| Input with unit | `flex items-center gap-2` |
| Section divider | `border-t pt-6 mt-6` |
| Info box | `bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground` |

---

## Accessibility

All components include:

- Proper form labels associated with inputs
- ARIA attributes via ShadCN UI components
- Keyboard navigation support
- Focus management
- Disabled states clearly indicated

---

## Testing

Run component tests with:

```bash
pnpm test apps/frontend/__tests__/components/quality
```

Use data-testid attributes for E2E testing:

```typescript
// Playwright example
await page.getByTestId('require_incoming_inspection').click();
await page.getByTestId('ncr_critical_response_hours').fill('12');
await page.getByTestId('save-quality-settings').click();
```
