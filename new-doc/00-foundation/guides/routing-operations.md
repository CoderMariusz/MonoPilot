# Routing Operations User Guide

**Feature**: Routing Operations Management
**Module**: Technical
**Story**: 02.8
**Audience**: Production Managers, Technical Specialists
**Last Updated**: 2025-12-28

---

## Overview

Routing operations define the sequential steps in your production workflow. Each operation specifies:
- **Sequence**: Order of execution (1, 2, 3, etc.)
- **Name**: What this step does (e.g., "Mixing", "Baking")
- **Machine**: Equipment needed (optional)
- **Time**: Duration, setup time, cleanup time
- **Yield**: Expected output percentage
- **Cost**: Labor hourly rate
- **Instructions**: Detailed steps for operators

**Key Benefit**: MonoPilot automatically calculates total production time and cost, helping you optimize workflows and identify bottlenecks.

---

## Getting Started

### Access Routing Operations

1. Click **Technical** in left sidebar
2. Click **Routings** tab
3. Click on a routing to view its operations
4. Or click **[+ New Routing]** to create first

### Understand Your Current Routing

The routing detail page shows:
- **Routing Header**: Name, code, status, version
- **Operations Table**: All production steps in order
- **Summary Panel**: Total time, cost, and yield statistics
- **Related BOMs**: Products using this routing

---

## Adding Operations

### Create First Operation

1. Click **[+ Add Operation]** button
2. Fill in required fields:
   - **Sequence**: Start with 1
   - **Operation Name**: e.g., "Mixing", "Baking"
   - **Expected Duration**: Minutes for this step
3. Fill optional fields for accuracy:
   - **Machine**: Select equipment if used
   - **Setup Time**: Minutes to prepare before operation
   - **Cleanup Time**: Minutes to clean after
   - **Labor Cost per Hour**: Hourly wage/cost
   - **Expected Yield**: % of output (default 100%)
   - **Instructions**: Step-by-step guide for operators

4. Click **[Add Operation]**

### Example: Bread Production Line

```
Seq 1: Mixing
  - Duration: 15 min
  - Machine: Mixer-01
  - Setup: 5 min (attach dough)
  - Cleanup: 2 min (clean bowl)
  - Labor Cost: $12/hr
  - Yield: 98%
  - Instructions: Mix at medium speed, check consistency

Seq 2: Proofing
  - Duration: 45 min
  - Machine: Proofer-A
  - Setup: 0 min
  - Cleanup: 0 min
  - Labor Cost: $8/hr
  - Yield: 100%

Seq 3: Baking
  - Duration: 30 min
  - Machine: Oven-02
  - Setup: 10 min (preheat)
  - Cleanup: 3 min (cool down)
  - Labor Cost: $15/hr
  - Yield: 95%
```

---

## Editing Operations

### Modify an Existing Operation

1. Find operation in table
2. Click **[Edit]** button (pencil icon)
3. Update any fields
4. Click **[Save Changes]**

### Change Operation Order

Use **[^]** (up) and **[v]** (down) arrows to reorder:

1. Click **[^]** to move operation earlier
2. Click **[v]** to move operation later
3. Order updates immediately (no confirmation needed)

**Disabled Cases**:
- **[^]** disabled on first operation
- **[v]** disabled on last operation

---

## Understanding the Summary Panel

The **Cost & Duration Summary** shows automatic calculations:

### Total Duration

Shows how long entire workflow takes (in hours and minutes).

**Important**: If operations run in parallel, this is shorter than sum of individual times.

Example:
- Seq 1: Mixing 15 min
- Seq 2: Proofing 45 min
- Seq 2: Heating 40 min (parallel with Proofing)
- Seq 3: Baking 30 min

Total: 15 + 45 + 30 = **90 minutes** (not 130!)

### Total Labor Cost

Sum of all labor costs for the entire workflow.

**Important**: Even parallel operations are fully costed because both workers are paid.

Example (from above):
- Seq 1: 15 min × $12/hr = $3.00
- Seq 2: 45 min × $8/hr = $6.00
- Seq 2 (parallel): 40 min × $10/hr = $6.67
- Seq 3: 30 min × $15/hr = $7.50

Total: **$23.17**

### Average Yield

Overall output quality across all operations (weighted by duration).

- 100% = No loss
- 95% = 5% of product lost/rejected
- 98.5% = Average quality across workflow

---

## Parallel Operations (Advanced)

### What Are Parallel Operations?

Operations at the **same sequence number** run simultaneously:

```
Sequential (takes longer):
Seq 1: Prep A (10 min)
Seq 2: Cook A (20 min)     <- Must wait for Seq 1
Seq 3: Cool (10 min)
Total: 40 minutes

Parallel (optimized):
Seq 1: Prep A (10 min)
Seq 2: Cook A (20 min)     }
Seq 2: Prep B (15 min)     } Run together = MAX(20, 15) = 20 min
Seq 3: Cool (10 min)
Total: 40 minutes (saved Prep B time!)
```

### Create Parallel Operation

1. Click **[+ Add Operation]**
2. Enter sequence number that **already exists** (e.g., sequence 2 if another op is already at seq 2)
3. System shows info: "[i] Sequence 2 already used. This operation will run in parallel."
4. Click **[Add Operation]** anyway (not an error, it's the feature!)

**Example**: Parallel Heating and Proofing
```
Seq 1: Mixing (15 min, required first)
Seq 2: Proofing (45 min)  }
Seq 2: Heating (40 min)   } Both happen together
Seq 3: Baking (30 min)
```

### When to Use Parallel Operations

Use when:
- ✓ Multiple machines available (no resource conflict)
- ✓ Operations don't depend on each other
- ✓ You have enough staff for both
- ✓ Process allows simultaneous steps

Don't use when:
- ✗ Same machine needed for both steps
- ✗ Second operation depends on first being complete
- ✗ You don't have staff for both

### How Summary Changes with Parallel Ops

**Without parallel** (4 sequential operations):
- Total time: 15 + 45 + 30 + 20 = **110 minutes**
- Total cost: $12 + $8 + $15 + $5 = **$40**

**With parallel** (operations 2 & 3 simultaneous):
- Total time: 15 + MAX(45, 40) + 30 + 20 = **105 minutes** (5 min saved!)
- Total cost: $12 + $8 + $10 + $15 + $5 = **$50** (both workers paid)

**Key Insight**: Parallel ops save time but increase cost because you need more resources!

---

## Managing Attachments

### Upload Instructions or Documents

1. Click **[Edit]** on operation
2. Scroll to **Attachments** section
3. Click **[Choose File]** or drag-and-drop
4. Select file (PDF, PNG, JPG, DOCX only)
5. Click **[Upload]**

**Limits**:
- Max 5 attachments per operation
- Max 10 MB per file
- Allowed formats: PDF, PNG, JPG, DOCX

### Download or Delete

- **Download**: Click filename to download
- **Delete**: Click **[X]** next to filename

**Use Case**: Attach mixing instructions, equipment manuals, or temperature reference charts

---

## Deleting Operations

### Remove an Operation

1. Click **[Delete]** (trash icon)
2. Confirm: "Delete operation 'Mixing'? This action cannot be undone."
3. Click **[Delete]**

**Side Effects**:
- Operation is removed
- All attachments deleted
- Other operations keep their sequences (no reordering)

**Careful**: Deletion cannot be undone!

---

## Permissions

### Who Can Do What

| Action | Required Role | Required Permission |
|--------|---------------|-------------------|
| View operations | Any authenticated user | Read access to routing |
| Add operation | Production Manager, Admin | technical:Create |
| Edit operation | Production Manager, Quality Manager, Admin | technical:Update |
| Delete operation | Admin, Owner | technical:Delete |
| Reorder operations | Production Manager, Admin | technical:Update |
| Upload attachments | Production Manager, Admin | technical:Update |

**Note**: If you can't see action buttons, you lack the required permission. Ask your manager or administrator.

---

## Best Practices

### 1. Be Precise with Time Estimates

- Measure actual time, don't guess
- Include setup and cleanup separately
- Account for operator skill level
- Test with small batches first

### 2. Calculate Labor Cost Correctly

- Use actual hourly wage
- Include benefits and overhead if applicable
- Consider skill level (expert operator vs. trainee)

### 3. Set Realistic Yield

- Default to 100%, then adjust from experience
- Account for product loss, rejections, sampling
- Document why yield < 100% in instructions

### 4. Use Machine Assignments

- Assign actual machine used
- Helps with resource planning later
- Enables conflict detection when available

### 5. Document Complex Steps

- Use instructions field for non-obvious operations
- Include:
  - Temperature/pressure settings
  - Quality checkpoints
  - Common mistakes to avoid
  - Safety precautions

### 6. Optimize with Parallel Operations

- Review workflow for concurrent steps
- But don't over-optimize (need resources for parallel)
- Monitor actual times to validate calculations

---

## Troubleshooting

### Problem: Duration seems wrong

**Check**:
1. Are any operations in parallel (same sequence number)?
2. Parallel ops use MAX duration, not SUM
3. Setup and cleanup time included in total

**Solution**: Click **[View Breakdown]** in summary to see per-operation times.

### Problem: Cost is higher than expected

**Check**:
1. Are any operations in parallel?
2. Parallel ops SUM costs (both workers paid)
3. Labor cost includes per-hour rate
4. Duration calculated correctly (affects cost)

**Solution**: Review each operation's labor cost and duration. Parallel ops can significantly increase cost.

### Problem: Can't edit operation

**Possible Causes**:
- You don't have update permission
- Routing is inactive (inactive routings are read-only)
- Session expired

**Solution**: Check your permissions with manager or refresh page.

### Problem: Can't reorder operations

**Possible Causes**:
- Operation is first (can't move up)
- Operation is last (can't move down)
- You lack update permission

**Solution**: Try moving in opposite direction, or check your role.

---

## Tips & Tricks

### Tip 1: Copy Operations Between Routings

If another routing has similar operations:
1. Write down the operation details
2. Add to new routing
3. Adjust times as needed

(Future: Bulk copy feature planned)

### Tip 2: Use Sequence Gaps

You can use sequence numbers 1, 3, 5 (skipping 2, 4). Useful for:
- Leaving room for future steps
- Marking special operations

### Tip 3: Draft Mode

- Save routing without all operations
- Add operations iteratively
- Test on small batches before rollout

### Tip 4: Review Summary Before Launch

Before using routing in production:
- Click **[View Breakdown]** to verify times
- Total cost matches budget?
- All required machines assigned?
- Instructions complete?

---

## Common Scenarios

### Scenario 1: Bread Production Line

Create this workflow:
```
Seq 1: Mixing (15 min setup, 15 min duration, 2 min cleanup)
Seq 2: Proofing (0 min setup, 45 min duration)
Seq 2: Heating (2 min setup, 40 min duration)  <- Parallel
Seq 3: Baking (10 min setup, 30 min duration, 3 min cleanup)
Seq 4: Cooling (0 min setup, 20 min duration)
```

Result: 15 + 45 + 30 + 20 = **110 minutes**, vs 130 sequential

### Scenario 2: Multi-Line Production

Assign different machines to parallel operations:
```
Seq 1: Prep (Prep-Station-01)
Seq 2: Cook Line A (Oven-01)     }
Seq 2: Cook Line B (Oven-02)     } Same time, different machines
Seq 3: Cool (Cool-Station)
```

This requires two ovens, but maximizes throughput.

### Scenario 3: Quality Checkpoints

Add sequential quality checks:
```
Seq 1: Production (20 min)
Seq 2: Inspection (5 min)  <- Must happen after production
Seq 3: Rework if needed (10 min, optional)
```

### Scenario 4: Training Workflow

Lower costs for trainee operations:
```
Seq 1: Expert Mixing (15 min, $20/hr)
Seq 2: Trainee Baking (30 min, $8/hr) <- Lower rate
Seq 3: Expert Quality Check (10 min, $20/hr)
```

---

## Related Help

- **Routing Overview**: [Managing Routings](./routing-overview.md)
- **Technical Module**: [Technical Module Guide](./technical-module.md)
- **BOMs**: BOMs reference routings for cost calculation
- **API Documentation**: [Routing Operations API](../3-ARCHITECTURE/api/technical/routing-operations.md)

---

## Contact & Support

**Questions about**:
- How to create/edit operations → Ask your Production Manager
- Permissions or access issues → Contact your Administrator
- Feature requests or bugs → Submit through support portal

---

**Last Updated**: 2025-12-28
**Version**: 1.0
**Status**: Published & Current
