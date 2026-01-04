# Purchase Order Approval Workflow - User Guide

**Version**: 1.0
**Last Updated**: 2026-01-02
**For**: Planners, Purchasers, Managers, Administrators

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Submitting a PO for Approval](#submitting-a-po-for-approval)
4. [Approving a Purchase Order](#approving-a-purchase-order)
5. [Rejecting a Purchase Order](#rejecting-a-purchase-order)
6. [Viewing Approval History](#viewing-approval-history)
7. [Common Workflows](#common-workflows)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Overview

The Purchase Order Approval Workflow ensures that purchase orders above a specified amount are reviewed and authorized before being sent to suppliers. This provides financial controls and budget compliance for your organization.

### Key Benefits

- **Financial Control**: Ensure POs above threshold are reviewed
- **Budget Compliance**: Prevent unauthorized spending
- **Audit Trail**: Complete history of approval decisions
- **Email Notifications**: Automatic notifications to approvers and creators
- **Flexible Configuration**: Customize threshold and approval roles

### Who Can Do What

| Role | Submit PO | Approve PO | Reject PO | View History |
|------|-----------|------------|-----------|--------------|
| Planner | Yes | No* | No* | Yes |
| Purchaser | Yes | No* | No* | Yes |
| Manager | Yes | Yes | Yes | Yes |
| Administrator | Yes | Yes | Yes | Yes |

*Unless explicitly added to approval roles in settings

---

## Getting Started

### Prerequisites

Before using the approval workflow, ensure:

1. **Approval is Enabled**: Your administrator has enabled PO approval in Planning Settings
2. **Threshold is Set**: An approval threshold amount is configured (or set to require approval for all POs)
3. **Approval Roles Defined**: Roles that can approve POs are configured (typically Manager and Admin)

### Check Approval Settings

To view your organization's approval settings:

1. Navigate to **Settings** → **Planning**
2. Scroll to **Purchase Order Approval** section
3. Review:
   - **Require Approval**: Whether approval is enabled
   - **Approval Threshold**: Amount above which approval is required
   - **Approval Roles**: Roles that can approve POs

**Example Settings**:
```
Require Approval: Enabled
Approval Threshold: $10,000.00
Approval Roles: Manager, Administrator
```

In this example, any PO with a total of $10,000 or more will require approval from a Manager or Administrator.

---

## Submitting a PO for Approval

### Step 1: Create and Complete Your PO

1. Navigate to **Planning** → **Purchase Orders**
2. Click **New Purchase Order**
3. Fill in PO details:
   - Select supplier
   - Select warehouse
   - Set expected delivery date
   - Add line items
4. Review PO totals

**Important**: You must add at least one line item before submitting.

### Step 2: Submit the PO

1. Click the **Submit for Approval** button (if total >= threshold) or **Submit** button (if total < threshold)
2. System will automatically determine if approval is required based on:
   - PO total amount
   - Configured approval threshold

### Step 3: What Happens Next

**If Approval Required** (total >= threshold):
- PO status changes to **Pending Approval**
- Email notifications sent to all users with approval roles
- You receive confirmation: "Purchase order submitted for approval. Approvers have been notified."

**If Approval NOT Required** (total < threshold):
- PO status changes to **Submitted**
- No approval needed
- You receive confirmation: "Purchase order submitted successfully"

### Visual Indicators

**Pending Approval Status Badge**:

![Pending Badge](https://via.placeholder.com/150x30/FEF3C7/F59E0B?text=Pending+Approval)

The badge will pulse to indicate action is needed.

### Example Scenario

**Scenario**: Submit $15,000 PO (threshold is $10,000)

```
1. Create PO with total $15,000
2. Click "Submit for Approval"
3. PO status → Pending Approval
4. Email sent to: john.smith@company.com (Manager)
                  jane.doe@company.com (Admin)
5. Wait for approval decision
```

---

## Approving a Purchase Order

### Who Can Approve

Only users with roles configured in **Approval Roles** setting can approve POs (typically Manager and Administrator).

### Step 1: Receive Notification

You'll receive an email notification when a PO is submitted for approval:

```
Subject: Purchase Order PO-2024-00123 requires your approval

Hello John,

A purchase order requires your approval:

PO Number: PO-2024-00123
Supplier: ABC Supplies Inc.
Total Amount: $15,000.00
Submitted By: Jane Doe (Planner)

[Approve] [Reject] [View Details]
```

### Step 2: Review the PO

1. Click **View Details** in the email, or
2. Navigate to **Planning** → **Purchase Orders**
3. Filter by status: **Pending Approval**
4. Click on the PO number to view details

### Step 3: Approve the PO

1. On the PO detail page, click **Approve** button
2. Approval modal opens showing:
   - PO summary (supplier, warehouse, expected delivery)
   - Line items (read-only)
   - Totals breakdown
   - Approval threshold indicator
3. Optionally enter approval notes (e.g., "Budget approved by finance committee")
4. Click **Approve PO** button

### Step 4: Confirmation

- PO status changes to **Approved**
- Email notification sent to PO creator
- Success message: "Purchase order approved successfully"
- Approval recorded in history

### Visual Flow

```
Pending Approval → [Review] → [Enter Notes] → [Approve] → Approved
```

### Example Approval

```
PO-2024-00123
Total: $15,000.00
Threshold: $10,000.00

Notes: "Budget approved by finance committee. Proceed with order."

[Cancel] [Approve PO]
```

---

## Rejecting a Purchase Order

### When to Reject

Reject a PO when:
- It exceeds budget constraints
- Pricing is too high
- Supplier is not approved
- Timing is not appropriate
- Other business reasons

### Step 1: Review the PO

Follow the same steps as approving (receive notification, navigate to PO).

### Step 2: Reject the PO

1. On the PO detail page, click **Reject** button
2. Rejection modal opens showing PO details
3. **Required**: Enter rejection reason (minimum 10 characters)
   - Be specific and actionable
   - Example: "Exceeds quarterly budget. Please reduce quantity by 30% or defer to Q2."
4. Click **Reject PO** button

### Step 3: What Happens Next

- PO status changes to **Rejected**
- Email notification sent to PO creator with rejection reason
- PO creator can edit and resubmit the PO

### Rejection Reason Requirements

- **Minimum Length**: 10 characters
- **Maximum Length**: 1000 characters
- **Purpose**: Provide clear, actionable feedback

**Good Rejection Reasons**:
- "Exceeds quarterly budget by $5,000. Please reduce quantity or defer to Q2."
- "Supplier not on approved vendor list. Please select from approved suppliers."
- "Pricing is 15% higher than market rate. Request quote from alternative suppliers."

**Poor Rejection Reasons**:
- "Too high" (not specific)
- "No" (not actionable)
- "Budget" (no context)

### Example Rejection

```
PO-2024-00123
Total: $15,000.00

Rejection Reason*:
"Exceeds quarterly budget. Please reduce quantity by 30% or defer to Q2 when additional budget becomes available."

[Cancel] [Reject PO]
```

---

## Viewing Approval History

Every PO maintains a complete approval history showing all actions taken.

### Access Approval History

1. Navigate to **Planning** → **Purchase Orders**
2. Click on a PO number to view details
3. Scroll to **Approval History** section

### What's Displayed

The approval history timeline shows:
- **Action**: Submitted, Approved, or Rejected
- **User**: Name and role of person who performed action
- **Timestamp**: When action occurred
- **Notes**: Approval or rejection notes

### Timeline Format

```
[Icon] Approved
       by John Smith (Manager)
       Jan 15, 2024, 2:32 PM
       Notes: "Budget approved by finance committee."

[Icon] Rejected
       by John Smith (Manager)
       Jan 14, 2024, 10:15 AM
       Notes: "Exceeds budget. Reduce quantity."

[Icon] Submitted for Approval
       by Jane Doe (Planner)
       Jan 14, 2024, 9:00 AM
```

### History Persistence

- History is **permanent** and cannot be deleted
- History persists even if PO is later edited
- User names and roles are frozen at time of action (for historical accuracy)

---

## Common Workflows

### Workflow 1: Standard Approval (Above Threshold)

```
1. Planner creates PO for $15,000 (threshold: $10,000)
2. Planner clicks "Submit for Approval"
3. Status → Pending Approval
4. Email sent to Managers/Admins
5. Manager reviews PO
6. Manager clicks "Approve"
7. Status → Approved
8. Email sent to Planner
9. Planner clicks "Confirm" to send to supplier
10. Status → Confirmed
```

**Timeline**: Typically 1-24 hours depending on approver availability.

### Workflow 2: Direct Submission (Below Threshold)

```
1. Planner creates PO for $5,000 (threshold: $10,000)
2. Planner clicks "Submit"
3. Status → Submitted (skips approval)
4. Planner clicks "Confirm" to send to supplier
5. Status → Confirmed
```

**Timeline**: Immediate (no approval needed).

### Workflow 3: Rejection and Resubmission

```
1. Planner submits PO for $15,000
2. Status → Pending Approval
3. Manager reviews and rejects: "Exceeds budget"
4. Status → Rejected
5. Email sent to Planner with rejection reason
6. Planner edits PO (reduces quantity to $12,000)
7. Planner clicks "Submit for Approval" again
8. Status → Pending Approval
9. Manager reviews and approves
10. Status → Approved
```

**Timeline**: 1-3 days depending on revision cycle.

### Workflow 4: Approval Disabled

```
1. Admin disables approval in settings
2. Planner creates PO for any amount
3. Planner clicks "Submit"
4. Status → Submitted (no approval required)
5. Planner clicks "Confirm"
6. Status → Confirmed
```

**Timeline**: Immediate (approval workflow bypassed).

---

## Troubleshooting

### Issue 1: Cannot Submit PO

**Symptom**: "Submit for Approval" button is disabled or greyed out.

**Possible Causes**:
- PO has no line items
- PO is not in draft status
- You lack permission to submit POs

**Solution**:
1. Ensure PO has at least one line item
2. Check PO status (must be "Draft")
3. Verify you have Planner or Purchaser role

---

### Issue 2: Not Receiving Approval Notifications

**Symptom**: You're a Manager but not receiving approval emails.

**Possible Causes**:
- Your role is not in approval roles setting
- Email address is incorrect in your profile
- Emails going to spam folder

**Solution**:
1. Check Settings → Planning → Approval Roles includes your role
2. Verify email address in your profile
3. Check spam/junk folder
4. Contact administrator to verify settings

---

### Issue 3: Cannot Approve PO

**Symptom**: "Approve" button not visible or click results in error.

**Possible Causes**:
- Your role is not in approval roles
- PO is not in pending approval status
- Another user already approved the PO

**Solution**:
1. Verify your role is in approval roles setting
2. Check PO status (must be "Pending Approval")
3. Refresh page to see if status changed
4. Contact PO creator or administrator

---

### Issue 4: Rejection Reason Validation Error

**Symptom**: "Rejection reason must be at least 10 characters" error.

**Possible Causes**:
- Rejection reason is too short

**Solution**:
Provide a detailed, actionable rejection reason (minimum 10 characters).

**Example**:
- ❌ "Too high" (8 chars)
- ✅ "Exceeds budget by $5,000" (24 chars)

---

### Issue 5: PO Stuck in Pending Approval

**Symptom**: PO has been pending approval for days.

**Possible Causes**:
- Approvers haven't reviewed yet
- Approvers are out of office
- Approvers didn't receive notification

**Solution**:
1. Check approval history to see if any action taken
2. Manually notify approvers (email or message)
3. Contact administrator to add additional approvers if needed
4. Consider escalation if urgent

---

## FAQ

### Q1: What happens if I edit a PO after submitting for approval?

**A**: You cannot edit a PO while it's in "Pending Approval" status. If the PO is rejected, you can edit it and resubmit.

---

### Q2: Can I approve my own purchase order?

**A**: Not recommended. While technically possible if you have approval permissions, it violates separation of duties best practices. Most organizations configure settings to prevent this.

---

### Q3: What if the approval threshold changes after I submit?

**A**: The approval decision is based on the threshold at the time of submission. Changing the threshold later does not affect POs already submitted.

---

### Q4: Can I cancel a PO that's pending approval?

**A**: Yes, you can cancel a PO in pending approval status. Navigate to the PO detail page and click "Cancel PO".

---

### Q5: How many approval levels are supported?

**A**: Currently, the system supports single-level approval (one approve/reject decision). Multi-level approvals (e.g., Manager → Director → CFO) are planned for a future release.

---

### Q6: What if multiple approvers approve the same PO?

**A**: The system detects concurrent approvals. The first approver's decision is recorded, and subsequent attempts will receive a message: "This PO has already been approved by [name]".

---

### Q7: Can I set different thresholds for different departments?

**A**: Not currently. The approval threshold is organization-wide. Department-specific thresholds are planned for a future release.

---

### Q8: How do I know if a PO requires approval before submitting?

**A**: When creating a PO, the system will show "Submit for Approval" button if the total >= threshold, or "Submit" button if below threshold. You can also check the threshold in Settings → Planning.

---

### Q9: Can I add multiple rejection reasons?

**A**: No, only one rejection reason can be provided per rejection action. However, you can include multiple points in a single rejection reason (up to 1000 characters).

---

### Q10: What happens to approval history if I delete a PO?

**A**: Approval history is preserved even if the PO is deleted (via cascade rules). However, only draft POs can be deleted. POs with approval history (submitted, pending, approved, rejected) cannot be deleted.

---

## Tips and Best Practices

### For Planners/Purchasers

1. **Review Threshold Before Creating PO**: Know your organization's approval threshold to set expectations
2. **Complete PO Details**: Ensure all required fields are filled before submitting
3. **Add Context in Notes**: Include internal notes explaining urgency or special requirements
4. **Monitor Status**: Check PO status regularly if time-sensitive
5. **Respond to Rejections Quickly**: Address rejection feedback promptly to avoid delays

### For Approvers (Managers/Admins)

1. **Review Promptly**: Aim to review pending approvals within 24 hours
2. **Provide Clear Feedback**: If rejecting, provide specific, actionable reasons
3. **Check Budget Impact**: Verify budget availability before approving
4. **Use Notes Field**: Document approval rationale for audit trail
5. **Enable Notifications**: Ensure email notifications are enabled for timely awareness

### For Administrators

1. **Set Appropriate Threshold**: Balance control with efficiency (not too low)
2. **Review Approval Roles**: Ensure adequate coverage (backup approvers)
3. **Monitor Approval Metrics**: Track average approval time and bottlenecks
4. **Communicate Changes**: Notify users when threshold or roles change
5. **Regular Audits**: Review approval history for compliance

---

## Getting Help

### Support Resources

- **In-App Help**: Click the ? icon in the top right corner
- **Email Support**: support@monopilot.com
- **Documentation**: https://docs.monopilot.com
- **Training Videos**: https://training.monopilot.com

### Reporting Issues

When reporting an issue, please include:
- PO number
- Your role
- Steps to reproduce
- Screenshot (if applicable)
- Error message (if applicable)

---

## Related Guides

- [Purchase Order Management](./purchase-order-guide.md) - Complete PO guide
- [Planning Settings](../../settings/planning-settings-guide.md) - Configure approval settings
- [User Roles and Permissions](../../settings/user-roles-guide.md) - Understanding roles

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-02 | Initial user guide for PO approval workflow |

---

## Feedback

We're constantly improving our documentation. If you have suggestions or found this guide helpful, please let us know at docs-feedback@monopilot.com.
