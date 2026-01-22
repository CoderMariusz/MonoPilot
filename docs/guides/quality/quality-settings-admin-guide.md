# Quality Settings Admin User Guide

Story: 06.0 - Quality Settings (Module Configuration)

## Overview

The Quality Settings page allows administrators to configure how the Quality module operates across your organization. Changes affect all users and apply to new quality records (existing records are not modified retroactively).

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

## Troubleshooting

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

## Related Documentation

- [Quality Settings API Reference](/docs/api/quality/quality-settings-api.md)
- [Quality Settings Component Guide](/docs/guides/quality/quality-settings-components.md)
- [Quality Settings Configuration Examples](/docs/guides/quality/quality-settings-configuration.md)
