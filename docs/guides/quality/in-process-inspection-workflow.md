# In-Process Inspection Workflow Guide

> How to perform quality inspections during work order (WO) operations in MonoPilot.

## Overview

In-process inspections verify product quality at critical points during manufacturing. Unlike incoming inspections (which check received goods) or final inspections (which check finished products), in-process inspections happen while production is underway.

**When to use in-process inspections:**
- After critical operations (mixing, cooking, packaging)
- When operations are flagged as quality control points
- To verify process parameters (temperature, time, weight)
- Before proceeding to the next production step

## Prerequisites

Before starting:

1. **Work Order must be in progress** - Only active WOs can have in-process inspections
2. **Operation must exist** - The WO operation you want to inspect must be defined in the routing
3. **Quality specification (optional)** - Define expected parameters for consistent testing
4. **Sampling plan (optional)** - Define how many samples to test based on lot size

## Workflow Steps

### Step 1: Identify Operations Requiring Inspection

Operations that require QA checks are configured in the routing template. You can check if an operation needs inspection in two ways:

**Via WO Details:**
Navigate to Production > Work Orders > [WO Number] and view the Operations tab. Operations with a QA icon require inspection.

**Via API:**
```bash
# Check if specific operation requires inspection
curl -X GET "/api/quality/inspections/operation/{operationId}" \
  -H "Authorization: Bearer {token}"
```

Response includes `operation.qa_status` which will be `pending` if inspection is required.

### Step 2: Create the Inspection

Create an inspection record for the operation:

**Via UI:**
1. Navigate to Quality > Inspections
2. Click "New Inspection"
3. Select "In-Process" as type
4. Select the Work Order
5. Select the Operation
6. Set priority and assign inspector (optional)
7. Click "Create"

**Via API:**
```bash
curl -X POST "/api/quality/inspections" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "wo_id": "123e4567-e89b-12d3-a456-426614174000",
    "wo_operation_id": "456e4567-e89b-12d3-a456-426614174001",
    "priority": "normal",
    "scheduled_date": "2026-01-23"
  }'
```

**Automatic Creation:**
If your organization has `auto_create_inspection_on_operation` enabled, inspections are created automatically when operations complete.

### Step 3: Start the Inspection

When ready to inspect, start the inspection workflow:

**Via UI:**
1. Navigate to Quality > Inspections > In-Process Queue
2. Find the inspection in status "Scheduled"
3. Click "Start Inspection"

**Via API:**
```bash
curl -X POST "/api/quality/inspections/{inspectionId}/start" \
  -H "Authorization: Bearer {token}"
```

**What happens:**
- Status changes from `scheduled` to `in_progress`
- `started_at` timestamp is recorded
- If no inspector was assigned, you become the inspector

### Step 4: Perform the Inspection

Execute the quality tests according to your specification or SOP:

1. **Take samples** according to the sampling plan
2. **Test each parameter** defined in the specification
3. **Record measurements** and observations
4. **Note any defects** found during inspection

**Recording Test Results:**
Use the Test Results API to record individual parameter measurements:
```bash
curl -X POST "/api/quality/test-results" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "inspection_id": "{inspectionId}",
    "parameter_id": "{parameterId}",
    "measured_value": "180",
    "result": "pass"
  }'
```

### Step 5: Complete the Inspection

After all tests are done, complete the inspection with a final result:

**Via UI:**
1. In the inspection detail view, click "Complete Inspection"
2. Select result: Pass, Fail, or Conditional
3. Enter any notes and defect counts
4. If Conditional, provide reason and restrictions
5. Click "Submit"

**Via API:**
```bash
# Pass result
curl -X POST "/api/quality/inspections/{inspectionId}/complete" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "pass",
    "result_notes": "All parameters within specification"
  }'

# Fail result with NCR
curl -X POST "/api/quality/inspections/{inspectionId}/complete" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "fail",
    "result_notes": "Temperature exceeded max limit",
    "defects_found": 1,
    "major_defects": 1,
    "create_ncr": true
  }'

# Conditional result
curl -X POST "/api/quality/inspections/{inspectionId}/complete" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "result": "conditional",
    "result_notes": "Moisture slightly above target",
    "conditional_reason": "Moisture at 12.5% vs target 12%",
    "conditional_restrictions": "Use within 48 hours only",
    "conditional_expires_at": "2026-01-25T00:00:00.000Z"
  }'
```

### Step 6: Handle the Result

After completion, the system automatically:

1. **Updates WO operation QA status** - Reflects pass/fail/conditional
2. **Notifies production team** - Alert sent about inspection completion
3. **Blocks next operation (if configured)** - Prevents continuation on failure
4. **Creates NCR (if requested)** - Starts non-conformance workflow

## Result Types

| Result | Description | WO Operation QA Status | Next Op Allowed |
|--------|-------------|------------------------|-----------------|
| **Pass** | All parameters within spec | `passed` | Yes |
| **Fail** | One or more parameters out of spec | `failed` | Depends on settings |
| **Conditional** | Approved with restrictions | `conditional` | Yes |

## Operation Blocking

When an inspection fails, the next operation may be blocked based on organization settings:

**Check if next operation can start:**
```bash
# Response includes canStart boolean and blockedReason if blocked
curl -X GET "/api/quality/inspections/operation/{nextOperationId}" \
  -H "Authorization: Bearer {token}"
```

**Override blocking:**
Set `block_next_operation: false` when completing the inspection to allow continuation despite failure (requires QA Manager approval).

## Using Sampling Plans

Sampling plans define how many samples to test based on lot size (following ISO 2859/ANSI Z1.4):

1. **Create a sampling plan** in Quality > Sampling Plans
2. **Link to product or inspection type**
3. **System calculates sample size** automatically
4. **Record samples** during inspection
5. **Accept/Reject based on defects vs acceptance number**

**Example:**
- Lot size: 1000 units
- AQL Level II
- Sample size: 80
- Acceptance number: 5
- Rejection number: 6

If 5 or fewer defects found in 80 samples: Pass
If 6 or more defects found: Fail

## Viewing WO Quality Summary

Get an overview of all inspections for a Work Order:

**Via UI:**
Navigate to Production > Work Orders > [WO Number] > Quality tab

**Via API:**
```bash
curl -X GET "/api/quality/inspections/wo/{woId}" \
  -H "Authorization: Bearer {token}"
```

Response includes:
- All inspections for the WO
- Summary counts (completed, passed, failed, pending)
- Overall quality status

## Monitoring Overdue Inspections

Inspections become overdue after `inspection_sla_hours` (default: 2 hours) of being scheduled but not started.

**Via UI:**
Quality Dashboard shows overdue inspections with visual indicators.

**Via API:**
Filter in-process inspections by date:
```bash
curl -X GET "/api/quality/inspections/in-process?status=scheduled&date_to=2026-01-23" \
  -H "Authorization: Bearer {token}"
```

## Permissions

| Action | Required Role |
|--------|---------------|
| Create inspection | qa_inspector, qa_manager, admin |
| Start inspection | qa_inspector, qa_manager, admin |
| Complete inspection | qa_inspector, qa_manager, admin |
| Approve conditional | qa_manager, admin |
| Assign inspector | qa_manager, admin |
| Override blocking | qa_manager, admin |

## Troubleshooting

### "Work Order must be in progress"

The WO status must be `in_progress` to create in-process inspections. Check the WO status and ensure production has started.

### "Cannot inspect - Work Order is paused"

Resume the WO before starting the inspection. Paused WOs indicate production is temporarily stopped.

### "Only scheduled inspections can be started"

The inspection may already be in progress or completed. Check the current status.

### "Conditional reason and restrictions required"

When selecting `conditional` result, you must provide both `conditional_reason` and `conditional_restrictions` fields.

### "Only QA Manager can approve conditional results"

Conditional results require QA Manager level approval. Contact your QA Manager to complete this inspection.

### Next operation is blocked but shouldn't be

Check organization settings for `block_next_operation_on_fail`. A QA Manager can also override blocking when completing the failed inspection.

## Best Practices

1. **Use sampling plans** for consistent, statistically valid sampling
2. **Define specifications** before inspections to standardize acceptance criteria
3. **Record process parameters** captured during inspection for traceability
4. **Create NCRs for failures** to track corrective actions
5. **Don't skip conditional restrictions** - they exist to ensure product safety
6. **Monitor overdue inspections** to prevent production delays

## Related Documentation

- [In-Process Inspections API Reference](../../api/quality/in-process-inspections.md)
- [Sampling Plans Guide](./sampling-plans.md)
- [Quality Holds Guide](./quality-holds.md)
- [NCR Workflow Guide](./ncr-workflow.md)
