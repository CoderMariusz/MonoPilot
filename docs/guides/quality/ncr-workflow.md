# NCR Workflow Guide

Story: 06.9 - Basic NCR Creation

## Overview

Non-Conformance Reports (NCRs) document quality issues found during production, receiving, inspection, or from customer complaints. This guide explains how to create, manage, and close NCRs in MonoPilot.

## What is an NCR?

An NCR is a formal record of any deviation from:
- Product specifications
- Process requirements
- Regulatory standards
- Customer expectations

NCRs provide traceability, root cause analysis, and corrective action tracking for food safety and quality compliance.

---

## NCR Status Workflow

```
[DRAFT] ----submit----> [OPEN] ----close----> [CLOSED]
   |                       |
   | edit/delete           | assign
   v                       v
(editable)            (read-only)
```

### Status Descriptions

| Status | Description | Who Can Act | Actions Available |
|--------|-------------|-------------|-------------------|
| Draft | Initial state after creation | Creator | Edit, Delete, Submit |
| Open | Under investigation | QA Manager, Assignee | Assign, Close |
| Closed | Resolved with documentation | - | View only |

---

## Creating an NCR

### Step 1: Navigate to NCR List

1. Log in to MonoPilot
2. Go to **Quality** > **Non-Conformance Reports** in the sidebar
3. Click the **+ New NCR** button

### Step 2: Fill Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Title** | Brief summary (5-200 chars) | "Temperature deviation during receiving" |
| **Description** | Detailed explanation (20-2000 chars) | "Refrigerated dairy ingredients received at 8C instead of required 0-4C range. Shipment contained 5 pallets of cream cheese from Supplier ABC." |
| **Severity** | Issue importance | Major |
| **Detection Point** | Where found | Incoming |

### Step 3: Add Optional Context

| Field | When to Use |
|-------|-------------|
| **Category** | Helps with reporting (e.g., supplier_issue, equipment_failure) |
| **Source Reference** | Link to inspection, hold, or work order that triggered the NCR |

### Step 4: Choose Initial Status

- **Save as Draft**: Review before submitting. Can edit or delete.
- **Submit Immediately**: Creates in Open status. Cannot edit.

---

## Severity Levels

Choose severity based on potential impact:

### Minor

- Process deviation with no product impact
- Documentation error
- Cosmetic defect within tolerance

**Example**: Label printed with minor alignment issue, product still compliant.

**Response Time**: 72 hours

### Major

- Quality impact that could affect customer satisfaction
- Customer complaint
- Specification deviation

**Example**: Texture variance in finished product, within safe limits but noticeable.

**Response Time**: 48 hours

### Critical

- Food safety risk
- Regulatory violation
- Potential recall situation

**Example**: Metal fragment detected in finished product. Allergen cross-contact.

**Response Time**: 24 hours

---

## Detection Points

Where the non-conformance was discovered:

| Detection Point | Description | Common NCR Types |
|-----------------|-------------|------------------|
| **Incoming** | Goods receipt inspection | Temperature deviation, damaged packaging, wrong product |
| **In-Process** | During production | Equipment malfunction, process deviation, contamination |
| **Final** | Final inspection before shipping | Specification failure, labeling error |
| **Customer** | Customer complaint or return | Quality complaint, defect report |
| **Internal Audit** | Internal quality audit | Process non-compliance, documentation gap |
| **Supplier Audit** | Supplier assessment | Supplier quality issue |
| **Other** | Any other source | Safety observation, regulatory finding |

---

## Editing a Draft NCR

Draft NCRs can be modified before submission:

1. Open the NCR from the list
2. Click **Edit** button
3. Modify fields as needed
4. Click **Save Changes**

**What you can edit**:
- Title
- Description
- Severity
- Detection Point
- Category

**What you cannot edit**:
- NCR Number (auto-generated)
- Detected Date (set at creation)
- Detected By (set at creation)

---

## Submitting an NCR

When ready for investigation:

1. Open the draft NCR
2. Review all information
3. Click **Submit** button
4. Confirm the action

After submission:
- Status changes to **Open**
- NCR becomes read-only
- Investigation can begin

---

## Assigning an NCR

Open NCRs can be assigned to a team member:

1. Open the NCR detail view
2. Click **Assign** button
3. Select user from dropdown
4. Click **Confirm**

The assignee receives notification and the NCR appears in their task list.

---

## Closing an NCR

**Requirement**: Only QA Manager or Admin can close NCRs.

### Step 1: Document Resolution

Before closing, ensure:
- Root cause is identified
- Corrective actions are documented
- Affected product is dispositioned
- Preventive measures are in place

### Step 2: Write Closure Notes

Closure notes must be at least 50 characters and should include:

1. **Root Cause**: What caused the non-conformance?
2. **Corrective Action**: What was done to address the immediate issue?
3. **Preventive Action**: What prevents recurrence?
4. **Disposition**: What happened to affected product?

**Example**:

```
Root Cause: Refrigeration unit failure in supplier truck during transit.
Corrective Action: Rejected shipment and requested replacement from supplier.
Preventive Action: Added temperature monitoring requirement to supplier agreement.
Supplier to provide temperature log with each delivery.
Disposition: 5 pallets returned to supplier for credit.
```

### Step 3: Close the NCR

1. Open the NCR detail view
2. Click **Close NCR** button
3. Enter closure notes in the text area
4. Click **Confirm Close**

The NCR is now closed and serves as a permanent quality record.

---

## Viewing NCR History

### List View Filters

Filter NCRs by:
- **Status**: Draft, Open, Closed
- **Severity**: Minor, Major, Critical
- **Detection Point**: Incoming, In-Process, Final, etc.
- **Category**: Product defect, Supplier issue, etc.
- **Detected By**: Specific user
- **Assigned To**: Specific user
- **Date Range**: Detected date from/to
- **Search**: NCR number or title

### Statistics Dashboard

The NCR list header shows aggregate stats:
- Draft count
- Open count
- Closed count
- Critical count
- Major count
- Minor count

---

## Linking NCRs to Source Records

NCRs can reference their source:

| Source Type | When to Use | Example |
|-------------|-------------|---------|
| Inspection | NCR from failed inspection | Link to Incoming Inspection INS-2026-00015 |
| Hold | NCR from quality hold | Link to Hold HLD-2026-00008 |
| Work Order | NCR from production issue | Link to WO-2026-00123 |
| Batch | NCR affecting specific batch | Link to Batch B-2026-00456 |
| Customer Complaint | NCR from customer feedback | Reference complaint ticket |
| Audit | NCR from audit finding | Link to audit report |

The source reference helps with traceability and root cause analysis.

---

## Best Practices

### Writing Good NCR Titles

**Good**: "Temperature deviation during dairy receiving - 8C vs 0-4C spec"
**Bad**: "Problem with shipment"

**Good**: "Metal fragment in finished product - Line 3 output"
**Bad**: "Contamination"

### Writing Good Descriptions

Include:
1. What happened (the non-conformance)
2. When it happened (date/time/shift)
3. Where it happened (location/line/area)
4. How it was detected (inspection/observation)
5. How much product is affected (quantity/lots)
6. Immediate actions taken

### Choosing Correct Severity

Ask yourself:
- Is there a food safety risk? -> **Critical**
- Could a customer notice or complain? -> **Major**
- Is it a minor process deviation? -> **Minor**

When in doubt, escalate to higher severity.

### Timely Closure

- Close NCRs within SLA based on severity
- Document all actions before closing
- Do not close NCRs without proper investigation

---

## Permission Requirements

| Action | Viewer | Operator | Supervisor | QA Manager | Admin |
|--------|--------|----------|------------|------------|-------|
| View NCRs | Yes | Yes | Yes | Yes | Yes |
| Create NCR | No | Yes | Yes | Yes | Yes |
| Edit Draft | No | Yes | Yes | Yes | Yes |
| Delete Draft | No | Yes | Yes | Yes | Yes |
| Submit NCR | No | Yes | Yes | Yes | Yes |
| Assign NCR | No | No | No | Yes | Yes |
| Close NCR | No | No | No | Yes | Yes |

---

## Common Scenarios

### Scenario 1: Incoming Inspection Failure

1. Inspector finds temperature deviation during receiving
2. Creates NCR with severity "Major", detection point "Incoming"
3. Links to the failing inspection record
4. Submits immediately
5. QA Manager reviews and assigns to Purchasing
6. Purchasing contacts supplier for corrective action
7. QA Manager closes NCR with resolution notes

### Scenario 2: Customer Complaint

1. Customer service logs complaint about product quality
2. QA team creates NCR with severity "Major", detection point "Customer"
3. Links to customer complaint reference
4. Submits immediately
5. QA Manager investigates affected batches
6. Corrective actions implemented
7. Customer notified of resolution
8. QA Manager closes NCR

### Scenario 3: Equipment Failure During Production

1. Operator notices equipment malfunction causing defects
2. Production supervisor creates NCR with severity "Major", detection point "In-Process"
3. Saves as draft for review
4. Adds affected lot numbers to description
5. Submits after shift manager approval
6. Maintenance and QA investigate
7. Equipment repaired, preventive maintenance scheduled
8. QA Manager closes NCR with root cause and preventive actions

---

## Troubleshooting

### Cannot Edit NCR

**Cause**: NCR is not in Draft status.
**Solution**: Only draft NCRs can be edited. Once submitted, changes require creating a new NCR.

### Cannot Close NCR

**Cause**: You are not a QA Manager or Admin.
**Solution**: Contact your QA Manager to close the NCR.

**Cause**: NCR is in Draft status.
**Solution**: Submit the NCR first, then close it.

### Closure Notes Too Short

**Cause**: Notes must be at least 50 characters.
**Solution**: Add more detail about root cause, corrective action, and disposition.

### Cannot Find NCR in List

**Cause**: Filters may be excluding the NCR.
**Solution**: Clear all filters and search by NCR number.

---

## Related Documentation

- [NCR API Reference](/docs/api/quality/ncr.md)
- [Quality Settings Admin Guide](/docs/guides/quality/quality-settings-admin-guide.md)
- [Quality Holds Workflow](/docs/guides/quality-holds-workflow.md)
