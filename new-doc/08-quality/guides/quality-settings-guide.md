# Quality Settings Guide

Story: 06.0 - Quality Settings (Module Configuration)

## Overview

This comprehensive guide covers quality settings configuration, admin usage, and component integration for the MonoPilot Quality module. Quality settings control how the Quality module operates across your organization, affecting inspections, non-conformance reports (NCRs), corrective/preventive actions (CAPAs), HACCP monitoring, and audit trails.

**Key Points**:
- Settings apply to new quality records only (existing records are not modified retroactively)
- Changes require Admin, Owner, or Quality Manager role
- All settings are organization-wide and affect all users

---

## Table of Contents

1. [Technical Configuration](#technical-configuration)
   - Default Settings
   - Configuration Scenarios
   - API Request Examples
   - Validation Constraints
2. [Admin Guide](#admin-guide)
   - Accessing Settings
   - Permission Requirements
   - Settings Sections
   - Saving Changes
   - Troubleshooting
3. [Component Reference](#component-reference)
   - Component Architecture
   - Usage Examples
   - React Query Hooks
   - Testing

---

# Technical Configuration

## Default Settings

When a new organization is created, quality settings are automatically initialized with these defaults:

```json
{
  "require_incoming_inspection": true,
  "require_final_inspection": true,
  "auto_create_inspection_on_grn": true,
  "default_sampling_level": "II",
  "require_hold_reason": true,
  "require_disposition_on_release": true,
  "ncr_auto_number_prefix": "NCR-",
  "ncr_require_root_cause": true,
  "ncr_critical_response_hours": 24,
  "ncr_major_response_hours": 48,
  "capa_auto_number_prefix": "CAPA-",
  "capa_require_effectiveness": true,
  "capa_effectiveness_wait_days": 30,
  "coa_auto_number_prefix": "COA-",
  "coa_require_approval": false,
  "ccp_deviation_escalation_minutes": 15,
  "ccp_auto_create_ncr": true,
  "require_change_reason": true,
  "retention_years": 7
}
```

---

## Configuration Scenarios

### 1. Food Safety Startup (Basic Configuration)

**Scenario**: Small manufacturer just starting quality management. Wants simple processes.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "ncr_require_root_cause": false,
    "capa_require_effectiveness": false,
    "retention_years": 3
  }'
```

**Rationale**:
- Keep inspections enabled for traceability
- Disable root cause and effectiveness requirements to reduce complexity
- 3-year retention meets basic regulatory requirements

---

### 2. GFSI/SQF Certified Facility

**Scenario**: Facility with GFSI certification requires strict documentation and rapid response.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "require_hold_reason": true,
    "require_disposition_on_release": true,
    "ncr_require_root_cause": true,
    "ncr_critical_response_hours": 4,
    "ncr_major_response_hours": 24,
    "capa_require_effectiveness": true,
    "capa_effectiveness_wait_days": 90,
    "ccp_deviation_escalation_minutes": 5,
    "ccp_auto_create_ncr": true,
    "require_change_reason": true,
    "retention_years": 10
  }'
```

**Rationale**:
- Critical NCR response in 4 hours (same-shift resolution)
- 90-day effectiveness wait for meaningful verification
- 5-minute CCP escalation for immediate food safety response
- 10-year retention for audit trail compliance

---

### 3. Co-Packer with Multiple Customers

**Scenario**: Contract manufacturer handling products for different brand owners with varying requirements.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "III",
    "ncr_auto_number_prefix": "NC-",
    "capa_auto_number_prefix": "CA-",
    "coa_auto_number_prefix": "COA-",
    "coa_require_approval": true,
    "retention_years": 7
  }'
```

**Rationale**:
- Level III sampling (tightened) for stricter customer requirements
- Shorter prefixes for cleaner document numbers
- CoA approval required as customers request certificates

---

### 4. High-Volume Production Facility

**Scenario**: Large-scale facility with trusted suppliers and high throughput.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": false,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": false,
    "default_sampling_level": "I",
    "ncr_critical_response_hours": 48,
    "ncr_major_response_hours": 72,
    "ccp_deviation_escalation_minutes": 30,
    "retention_years": 5
  }'
```

**Rationale**:
- Skip incoming inspection for approved suppliers
- Level I sampling (reduced) based on supplier history
- Longer response times given volume of minor issues
- 5-year retention (balance storage vs. compliance)

---

### 5. Allergen-Handling Facility

**Scenario**: Facility producing allergen-containing products requiring strict controls.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "require_hold_reason": true,
    "require_disposition_on_release": true,
    "ncr_require_root_cause": true,
    "ncr_critical_response_hours": 1,
    "ncr_major_response_hours": 8,
    "ccp_deviation_escalation_minutes": 5,
    "ccp_auto_create_ncr": true,
    "require_change_reason": true,
    "retention_years": 15
  }'
```

**Rationale**:
- 1-hour critical NCR response for potential allergen issues
- 5-minute CCP escalation for immediate containment
- 15-year retention (product lifecycle + liability period)
- Mandatory change reasons for complete audit trail

---

### 6. Organic/Non-GMO Certified Facility

**Scenario**: Facility with organic certification requiring ingredient traceability.

**Configuration**:

```bash
curl -X PUT https://your-domain.com/api/quality/settings \
  -H "Content-Type: application/json" \
  -d '{
    "require_incoming_inspection": true,
    "require_final_inspection": true,
    "auto_create_inspection_on_grn": true,
    "default_sampling_level": "II",
    "coa_require_approval": true,
    "require_change_reason": true,
    "retention_years": 7
  }'
```

**Rationale**:
- All inspections enabled for chain of custody
- CoA approval for ingredient verification
- Standard retention meeting organic certification requirements

---

## Reference Tables

### AQL Sampling Level Reference

| Level | Use Case | Sample Size |
|-------|----------|-------------|
| I | Reduced inspection - trusted suppliers | Smallest |
| II | Normal inspection - standard operations | Standard |
| III | Tightened inspection - new suppliers or issues | Larger |
| S-1 | Special - expensive testing | Very small |
| S-2 | Special - destructive testing | Small |
| S-3 | Special - moderate testing | Medium |
| S-4 | Special - extensive testing | Medium-large |

**When to Change Levels**:

- **Reduce to Level I**: After 10 consecutive lots pass at Level II
- **Tighten to Level III**: After 2 of 5 lots fail at Level II
- **Return to Level II**: After 5 consecutive lots pass at Level III

---

### NCR Response Time Guidelines

| Severity | Recommended Hours | Scenario |
|----------|-------------------|----------|
| Critical (1-4h) | 1-4 | Allergen contamination, pathogen detection |
| Critical (4-24h) | 4-24 | Foreign material, equipment failure |
| Major (24h) | 24 | Label errors, packaging defects |
| Major (48h) | 48 | Documentation gaps, minor deviations |
| Minor (72h+) | 72+ | Cosmetic issues, non-safety concerns |

---

### Retention Period Guidelines

| Industry Standard | Years | Notes |
|-------------------|-------|-------|
| FDA 21 CFR Part 117 | 2+ | 2 years beyond shelf life or 3 years from creation |
| GFSI/SQF | 5-7 | Depends on certification level |
| Organic (USDA NOP) | 5 | 5 years minimum |
| EU Regulations | 5+ | Product lifecycle + 5 years |
| Allergen Documentation | 10-15 | Extended liability period |

---

## Validation Constraints

### Numeric Field Limits

| Field | Min | Max | Default |
|-------|-----|-----|---------|
| ncr_critical_response_hours | 1 | 168 | 24 |
| ncr_major_response_hours | 1 | 336 | 48 |
| capa_effectiveness_wait_days | 0 | 365 | 30 |
| ccp_deviation_escalation_minutes | 1 | 1440 | 15 |
| retention_years | 1 | 50 | 7 |

### String Field Limits

| Field | Min | Max | Pattern |
|-------|-----|-----|---------|
| ncr_auto_number_prefix | 1 | 10 | Any text |
| capa_auto_number_prefix | 1 | 10 | Any text |
| coa_auto_number_prefix | 1 | 10 | Any text |

### Sampling Level Values

Valid values: `I`, `II`, `III`, `S-1`, `S-2`, `S-3`, `S-4`

---

## API Request Examples

### TypeScript

```typescript
const response = await fetch('/api/quality/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ncr_critical_response_hours: 4,
    ncr_major_response_hours: 24,
    retention_years: 10
  })
});

if (!response.ok) {
  const error = await response.json();
  console.error('Validation error:', error.details);
}
```

### Python

```python
import requests

response = requests.put(
    'https://your-domain.com/api/quality/settings',
    json={
        'ncr_critical_response_hours': 4,
        'ncr_major_response_hours': 24,
        'retention_years': 10
    },
    headers={'Content-Type': 'application/json'}
)

if response.status_code == 400:
    print('Validation error:', response.json()['details'])
```

---

## Configuration Troubleshooting

### Error: "Must be at least 1 hour"

```json
{
  "error": "Invalid request data",
  "details": [{
    "code": "too_small",
    "path": ["ncr_critical_response_hours"],
    "message": "Must be at least 1 hour"
  }]
}
```

**Solution**: Ensure numeric values meet minimum requirements. Zero is not valid for response hours.

### Error: "Forbidden: Admin, Owner, or Quality Manager role required"

```json
{
  "error": "Forbidden: Admin, Owner, or Quality Manager role required"
}
```

**Solution**: Request settings update from a user with admin, owner, or quality_manager role.

### Error: "Invalid sampling level"

```json
{
  "error": "Invalid request data",
  "details": [{
    "path": ["default_sampling_level"],
    "message": "Invalid enum value"
  }]
}
```

**Solution**: Use one of the valid values: `I`, `II`, `III`, `S-1`, `S-2`, `S-3`, `S-4`

---

# Admin Guide

## Accessing Quality Settings

1. Log in to MonoPilot with an Admin, Owner, or Quality Manager account
2. Navigate to **Quality** > **Settings** in the sidebar
3. The settings page loads with your current configuration

**URL**: `/quality/settings`

## Permission Requirements

| Role | View Settings | Edit Settings | Save Changes |
|------|---------------|---------------|--------------|
| Admin | Yes | Yes | Yes |
| Owner | Yes | Yes | Yes |
| Quality Manager | Yes | Yes | Yes |
| Production Supervisor | Yes | No | No |
| Warehouse Operator | Yes | No | No |
| Viewer | Yes | No | No |

Users without edit permission see a read-only view with all inputs disabled and no Save button.

---

## Settings Overview

The settings page is divided into five collapsible sections:

1. **Inspection Settings** - Incoming/final inspection requirements
2. **NCR Settings** - Non-Conformance Report configuration
3. **CAPA Settings** - Corrective/Preventive Action and CoA settings
4. **HACCP Settings** - Critical Control Point monitoring
5. **Audit Settings** - Change tracking and document retention

Click the section header to expand or collapse each section. Your collapse preferences are saved in your browser.

---

## Section 1: Inspection Settings

### Require Incoming Inspection

**Default**: On

When enabled, all received materials must pass incoming inspection before they can be used in production. Materials are placed on hold until inspection is completed.

**Turn off when**:
- You have approved supplier programs with skip-lot agreements
- Materials are pre-inspected at supplier location
- You use third-party testing with direct release

### Require Final Inspection

**Default**: On

When enabled, finished products must pass final inspection before they can be shipped. Products are held until inspection approval.

**Turn off when**:
- Products ship directly from production with inline QC
- Customer accepts product without CoA

### Auto-Create Inspection on GRN

**Default**: On

When enabled, the system automatically creates an incoming inspection task when a Goods Receipt Note (GRN) is completed.

**Turn off when**:
- You want to manually select which receipts need inspection
- Some materials are pre-approved and skip inspection

### Default Sampling Level

**Default**: Level II (Normal)

Sets the default AQL sampling level for new inspection plans.

| Level | Description | When to Use |
|-------|-------------|-------------|
| Level I | Reduced inspection | Trusted suppliers with good history |
| Level II | Normal inspection | Standard operations |
| Level III | Tightened inspection | New suppliers or after quality issues |
| S-1 to S-4 | Special levels | Expensive/destructive testing |

### Require Hold Reason

**Default**: On

When enabled, users must provide a reason when placing inventory on hold. The reason is recorded in the audit trail.

### Require Disposition on Release

**Default**: On

When enabled, users must document the disposition decision (Accept, Reject, Rework) when releasing held inventory.

---

## Section 2: NCR Settings

### NCR Auto-Number Prefix

**Default**: NCR-

The prefix for automatically generated NCR numbers. Example: NCR-0001, NCR-0002.

**Tips**:
- Keep it short (1-10 characters)
- Consider including plant code for multi-site: PLT1-NCR-
- Avoid special characters that may cause issues in exports

### Require Root Cause Analysis

**Default**: On

When enabled, NCRs cannot be closed until a root cause is documented.

**Turn off when**:
- You want faster closure for minor NCRs
- Root cause is optional for non-critical issues

### Critical NCR Response Time

**Default**: 24 hours

Maximum time allowed to respond to critical severity NCRs. The system can alert when SLA is approaching.

**Recommended values**:
- High-risk products: 1-4 hours
- Standard food manufacturing: 8-24 hours
- Low-risk products: 24-48 hours

### Major NCR Response Time

**Default**: 48 hours

Maximum time allowed to respond to major severity NCRs.

**Recommended values**:
- Standard operations: 24-72 hours
- High volume with many NCRs: 48-168 hours

---

## Section 3: CAPA Settings

### CAPA Auto-Number Prefix

**Default**: CAPA-

The prefix for automatically generated CAPA numbers. Example: CAPA-0001.

### Require Effectiveness Check

**Default**: On

When enabled, CAPAs cannot be closed until an effectiveness verification is completed.

**Turn off when**:
- You want to close CAPAs before effectiveness review
- You track effectiveness separately

### Effectiveness Wait Period

**Default**: 30 days

Minimum days to wait after implementing a CAPA before effectiveness can be verified. This ensures enough time has passed to see if the corrective action worked.

**Recommended values**:
- Process changes: 30-60 days
- Major system changes: 60-90 days
- Training updates: 14-30 days

This field is disabled when "Require Effectiveness Check" is off.

### CoA Auto-Number Prefix

**Default**: COA-

The prefix for automatically generated Certificate of Analysis numbers.

### Require CoA Approval

**Default**: Off

When enabled, Certificates of Analysis must be approved by an authorized user before they can be released to customers.

**Turn on when**:
- Customers require signed CoAs
- You have formal release procedures

---

## Section 4: HACCP Settings

These settings control Critical Control Point (CCP) monitoring and deviation handling. They are essential for food safety compliance.

### CCP Deviation Escalation Time

**Default**: 15 minutes

Time in minutes before a CCP deviation is escalated to the QA Manager. This ensures timely response to food safety issues.

**Recommended values**:
- High-risk CCPs (cooking, metal detection): 5-15 minutes
- Medium-risk CCPs (temperature monitoring): 15-30 minutes
- Low-risk CCPs (pH checks): 30-60 minutes

### Auto-Create NCR on CCP Deviation

**Default**: On

When enabled, the system automatically creates a Non-Conformance Report when a CCP deviation is recorded. This ensures full traceability of all deviations.

**Turn off when**:
- You want to manually decide which deviations warrant NCRs
- Minor deviations are handled through corrective action logs

---

## Section 5: Audit Settings

### Require Change Reason

**Default**: On

When enabled, users must provide a reason when modifying critical quality records. This creates a complete audit trail.

**Records requiring change reason**:
- NCR status changes and disposition decisions
- CAPA action modifications
- Inspection result corrections
- Hold and release decisions
- Quality settings changes

### Document Retention Period

**Default**: 7 years

How long quality records are retained in the system.

**Regulatory guidance**:
| Standard | Minimum Retention |
|----------|-------------------|
| FDA 21 CFR Part 117 | 2 years beyond shelf life or 3 years |
| GFSI/SQF Level 3 | 5-7 years |
| Organic (USDA NOP) | 5 years |
| BRC Food Safety | 5 years |
| Allergen documentation | 10-15 years (liability) |

**Important**: Consult your compliance team for specific requirements. This setting affects archive policies but does not automatically delete records.

---

## Saving Changes

1. Make your desired changes in any section
2. An "Unsaved changes" indicator appears in the header
3. Click **Save Changes** at the bottom of the page
4. Wait for the success notification
5. Your changes are now active for all users

**If you navigate away with unsaved changes**, a warning dialog appears asking you to confirm.

---

## Admin Troubleshooting

### "You have read-only access" message

You are logged in with a role that cannot modify settings. Contact your administrator to:
- Request elevated permissions, or
- Ask an Admin/Owner/Quality Manager to make the change

### Save button is disabled

The Save button is disabled when:
- No changes have been made (nothing to save)
- A save operation is in progress (wait for completion)
- You have read-only access (see above)

### Validation error on save

If a field has invalid data, an error message appears below that field. Common issues:
- Response hours must be between 1 and the maximum value
- Retention years must be between 1 and 50
- Prefix text must be 1-10 characters

### Settings not taking effect

Settings apply to **new records** only. Existing NCRs, CAPAs, and inspections use the settings that were active when they were created.

### Changes not visible to other users

Settings changes take effect immediately, but other users may need to:
- Refresh their browser page
- Wait up to 5 minutes for cached data to expire

---

## Best Practices

1. **Review settings quarterly** - Ensure settings match current processes
2. **Document changes** - Keep a changelog of settings modifications
3. **Test in staging** - If available, test setting changes before production
4. **Coordinate with QA team** - Discuss NCR/CAPA requirements before changing
5. **Consider compliance** - Verify retention periods meet all certifications
6. **Train users** - Inform staff when significant changes are made

---

# Component Reference

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

## Section Components

### InspectionSettingsSection

Renders inspection and hold settings fields.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - | react-hook-form control object |
| `isReadOnly` | boolean | No | false | Disable all inputs |

#### Fields Rendered

| Field | Type | Test ID |
|-------|------|---------|
| require_incoming_inspection | Switch | `require_incoming_inspection` |
| require_final_inspection | Switch | `require_final_inspection` |
| auto_create_inspection_on_grn | Switch | `auto_create_inspection_on_grn` |
| default_sampling_level | Select | `default_sampling_level` |
| require_hold_reason | Switch | `require_hold_reason` |
| require_disposition_on_release | Switch | `require_disposition_on_release` |

---

### NCRSettingsSection

Renders Non-Conformance Report settings fields.

#### Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - |
| `isReadOnly` | boolean | No | false |

#### Fields Rendered

| Field | Type | Range | Test ID |
|-------|------|-------|---------|
| ncr_auto_number_prefix | Text Input | 1-10 chars | `ncr_auto_number_prefix` |
| ncr_require_root_cause | Switch | - | `ncr_require_root_cause` |
| ncr_critical_response_hours | Number Input | 1-168 | `ncr_critical_response_hours` |
| ncr_major_response_hours | Number Input | 1-336 | `ncr_major_response_hours` |

---

### CAPASettingsSection

Renders CAPA and CoA settings fields.

#### Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - |
| `watch` | UseFormWatch<UpdateQualitySettingsInput> | Yes | - |
| `isReadOnly` | boolean | No | false |

#### Fields Rendered

| Field | Type | Range | Test ID |
|-------|------|-------|---------|
| capa_auto_number_prefix | Text Input | 1-10 chars | `capa_auto_number_prefix` |
| capa_require_effectiveness | Switch | - | `capa_require_effectiveness` |
| capa_effectiveness_wait_days | Number Input | 0-365 | `capa_effectiveness_wait_days` |
| coa_auto_number_prefix | Text Input | 1-10 chars | `coa_auto_number_prefix` |
| coa_require_approval | Switch | - | `coa_require_approval` |

#### Conditional Behavior

The `capa_effectiveness_wait_days` field is disabled when `capa_require_effectiveness` is false. The component uses the `watch` function to observe this dependency.

---

### HACCPSettingsSection

Renders HACCP (Hazard Analysis Critical Control Point) settings fields.

#### Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - |
| `isReadOnly` | boolean | No | false |

#### Fields Rendered

| Field | Type | Range | Test ID |
|-------|------|-------|---------|
| ccp_deviation_escalation_minutes | Number Input | 1-1440 | `ccp_deviation_escalation_minutes` |
| ccp_auto_create_ncr | Switch | - | `ccp_auto_create_ncr` |

---

### AuditSettingsSection

Renders audit trail and document retention settings fields.

#### Props

| Prop | Type | Required | Default |
|------|------|----------|---------|
| `control` | Control<UpdateQualitySettingsInput> | Yes | - |
| `isReadOnly` | boolean | No | false |

#### Fields Rendered

| Field | Type | Range | Test ID |
|-------|------|-------|---------|
| require_change_reason | Switch | - | `require_change_reason` |
| retention_years | Number Input | 1-50 | `retention_years` |

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

---

## Related Documentation

- [Quality Settings API Reference](/docs/api/quality/quality-settings-api.md)
- [Quality Module PRD](/docs/1-BASELINE/product/prd-quality.md)
- [Settings Module Overview](/docs/settings/README.md)
