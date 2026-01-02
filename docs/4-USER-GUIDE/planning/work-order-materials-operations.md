# Work Order Materials & Operations Guide

## Overview

When you create a work order, MonoPilot automatically captures two critical snapshots:

1. **Materials (BOM Snapshot)**: The exact ingredients/components required to produce the planned quantity
2. **Operations (Routing Copy)**: The production steps needed to complete the work order

Both snapshots are created at the moment you release your work order, ensuring that production follows the exact specifications from that point in time, even if the BOM or routing changes later.

## Materials Tab Guide

### Understanding the BOM Snapshot

The Materials tab shows all ingredients and components required for your work order. This list is copied from your Bill of Materials (BOM) when the work order is released.

**Key Concept**: The snapshot is immutable. If you change your BOM after releasing the work order, the materials list stays the same. This ensures traceability and prevents mid-production surprises.

### Viewing Materials

When you open a work order and select the **Materials** tab, you see:

| Column | Meaning |
|--------|---------|
| **Material** | Product name and code with type badge (RM=Raw Material, ING=Ingredient, PKG=Packaging, etc.) |
| **Sequence** | Order number showing where this material appears in the BOM |
| **Required Qty** | How much you need, already scaled for your planned production quantity |
| **UoM** | Unit of Measure (kg, L, boxes, etc.) |
| **Scrap %** | Wastage percentage factored into the required quantity |
| **Reserved** | How much inventory has been set aside for this work order (if using reservation feature) |
| **Consumed** | How much has actually been used during production |
| **Status** | Visual indicator of consumption progress |

### Understanding Quantity Scaling

Let's say your BOM is for 100 units and includes "5 kg flour". If you create a work order for 250 units:
- Scaled quantity = (250 ÷ 100) × 5 kg = **12.5 kg flour**

If flour has a 5% scrap percentage:
- With scrap = 12.5 kg × (1 + 5%) = **13.125 kg flour**

The system automatically calculates this when you create the snapshot.

### By-Products Explained

By-products are secondary outputs (like whey from cheese production). You'll see them marked with a "By-product" badge.

**Important**: By-products show a yield percentage but have **zero required quantity**. You're tracking their output, not managing their consumption like regular materials.

### Refreshing the BOM Snapshot

You can only refresh the snapshot if your work order is still in **draft** or **planned** status.

**To refresh**:
1. Click the **"Refresh from BOM"** button in the Materials header
2. A confirmation dialog appears asking you to confirm
3. Click **"Refresh"**
4. The system deletes the old materials list and creates a new one based on your current BOM

**Why refresh?** If you changed the BOM after creating the work order, you might want to re-snapshot it before releasing the order.

**Why can't you refresh after release?** Once production starts, changing the materials would cause confusion and traceability issues. Instead, you'd create a new work order.

### Reading Consumption Progress

During production, the **Consumed** column fills in as materials are used. The status bar shows at a glance:
- **Pending**: 0% consumed
- **In Progress**: 0-99% consumed
- **Complete**: 100% or more consumed
- **By-product**: Always shows as by-product status

### Common Scenarios

**Scenario 1: BOM has 10 items, but you only see 9 materials**

The missing item might be marked as conditional in your BOM—it only gets included under certain conditions that don't apply to this work order.

**Scenario 2: Required quantity looks too high**

Check the scrap percentage. A high scrap % significantly increases required quantities. For example, 10% scrap on 100 units increases it to 110 units.

**Scenario 3: I need to use a different material**

You can't swap materials mid-production for a released work order. Create a new work order with the correct BOM instead.

## Operations Tab Guide

### Understanding the Operations Timeline

The Operations tab displays the production steps (operations) copied from your routing when the work order was released. Each operation represents one step in your production process.

**Key Concept**: Operations are a snapshot like materials—they capture your routing at release time. Changes to the routing after release don't affect this work order's operations.

### Operation Statuses Explained

Each operation moves through these states:

| Status | Meaning | Who Updates |
|--------|---------|-------------|
| **Pending** | Not started yet | System (default) |
| **In Progress** | Production operator is currently working on this | Production operator |
| **Completed** | Finished with actual time/yield recorded | Production operator |
| **Skipped** | Intentionally bypassed (with reason noted) | Production operator |

### Viewing Operation Details

Click any operation card to open the detail panel showing:

| Information | Purpose |
|-------------|---------|
| **Operation Name** | What is this step called? |
| **Description** | Brief summary of the operation |
| **Instructions** | Detailed steps for production operators to follow |
| **Expected Duration** | How many minutes this should take |
| **Actual Duration** | How long it actually took (filled during production) |
| **Duration Variance** | Positive = took longer than planned, Negative = faster than planned |
| **Expected Yield** | Projected output percentage |
| **Actual Yield** | Real output recorded during production |
| **Yield Variance** | How far off from expected (good variance = close to zero) |
| **Machine/Line** | Which production equipment is assigned |
| **Started/Completed** | When this operation ran and who ran it |

### Reading Duration and Yield Variances

**Duration Variance** helps identify bottlenecks:
- Red variance (positive): Operation took longer than expected. Investigate why.
- Green variance (negative): Operation finished ahead of schedule. Great!

**Yield Variance** shows quality performance:
- Small variance: Production stayed on target
- Large variance: Check for quality issues or equipment problems

### Operations Progress

In the Operations header, you see a progress bar showing:
```
Completed/Total Operations (X%)
```

This includes both **Completed** and **Skipped** operations. A fully skipped work order (all operations skipped) shows 100% progress.

### Common Scenarios

**Scenario 1: Operations tab is empty**

Your work order either doesn't have a routing assigned, or the routing has no operations. Operations are only copied when you release the work order.

**Scenario 2: Operation took much longer than expected**

Check the **Duration Variance** in the detail panel. This could indicate:
- Equipment issues
- Training issues
- Routing estimate was unrealistic
- Unexpected complexity in the product

**Scenario 3: I need to add a new operation**

Operations can't be added to a released work order. If your production changed mid-run, this is handled by production operators through notes and is analyzed in your OEE module later.

**Scenario 4: Yield is way below expected**

The **Yield Variance** shows how much output differed from the plan. Investigate:
- Quality issues
- Equipment malfunction
- Material defects
- Operator error

## Screenshots & Wireframe Reference

See **PLAN-015 - Work Order Detail** wireframe in the technical documentation for visual layouts of:
- Materials tab table structure
- Operations timeline cards
- Detail panel layouts
- Progress indicators

Path: `docs/3-ARCHITECTURE/ux/wireframes/PLAN-015-work-order-detail.md`

## Common Tasks

### Create a Work Order with Materials

1. Navigate to **Planning > Work Orders**
2. Click **Create Work Order**
3. Select a product and planned quantity
4. Choose a **Bill of Materials**
5. Click **Create**
6. In the **Materials** tab, review the scaled quantities
7. Click **Release** when ready to start production
8. Materials snapshot is now locked and immutable

### Update Materials Before Release

1. Open the work order (status = draft or planned)
2. Go to **Materials** tab
3. If the BOM changed, click **Refresh from BOM**
4. Confirm the refresh
5. Review the new quantities
6. Make any final adjustments
7. Click **Release** to lock the materials

### Start an Operation

1. Open the work order and go to **Operations** tab
2. Click the operation you want to start
3. In the detail panel, click **Start Operation**
4. The system records the start time and who started it
5. Operation status changes to "In Progress"

### Complete an Operation

1. Production is finished
2. Open the operation detail panel
3. Enter the **Actual Duration** and **Actual Yield Percent**
4. Click **Complete Operation**
5. The system calculates variances automatically
6. Status changes to "Completed"

### Skip an Operation

1. Open the operation detail panel
2. Click **Skip Operation** (usually if it's not needed for this batch)
3. Enter a skip reason (required)
4. Click **Confirm**
5. Status changes to "Skipped"

## Troubleshooting

### Issue: Materials list shows quantities that seem wrong

**Possible causes:**
- High scrap percentage (check the Scrap % column)
- Wrong planned quantity entered
- BOM output quantity set incorrectly

**Solution:**
1. Check your planned quantity matches what you intended
2. Review the scrap % values in your BOM
3. Verify the BOM output quantity matches your BOM definition
4. If needed, create a new work order with correct values

### Issue: Required materials add up to more than I expected

**Possible causes:**
- Multiple materials with scrap percentages compound the increase
- Yield percentages on raw materials
- Conditional materials included that you didn't expect

**Solution:**
1. Open each material's detail to see if it has scrap %
2. Check your BOM definition for any active conditional rules
3. Calculate manually: (planned_qty ÷ bom_output_qty) × item_qty × (1 + scrap%)

### Issue: I can't refresh the materials

**Reason:** Your work order is in "released" or later status.

**Solution:**
- Materials are locked after release to prevent mid-production changes
- To modify materials, create a new work order
- If the work order hasn't started production yet, ask an admin to reset the status to "planned" (if allowed by your org settings)

### Issue: Operations tab shows no operations

**Possible causes:**
1. Work order is still in draft/planned (operations copy on release)
2. Routing assigned has no operations
3. Organization has wo_copy_routing setting disabled

**Solution:**
1. Check work order status—must be "released" or later
2. Check if a routing is assigned to the work order
3. Verify the routing has operations defined in Technical module
4. Contact admin if wo_copy_routing is disabled

### Issue: Duration variance is very high (red)

**Why it matters:** Your operation took much longer than planned.

**Next steps:**
1. Check if there were equipment issues or downtime not logged
2. Review the instructions—were they clear?
3. Check if the planned duration was realistic for this product
4. Update the routing estimate if it was consistently off

### Issue: I see consumed_qty but don't remember entering it

**Explanation:** The Production module (Epic 04) automatically updates consumed quantities when materials are used in production. You don't manually enter these values.

### Issue: Can't see completed operation times

**Reason:** Operations are created as "pending" when the work order releases. Times are only filled in during production when operators mark them completed.

**Solution:** Operators need to use the Production module to start and complete operations. The operations you see are read-only in the Planning module.

## Integration with Other Modules

- **Technical Module**: BOM and Routing definitions feed into snapshots
- **Production Module (Epic 04)**: Operators use operations to track what they're working on and update actual times/yields
- **Warehouse Module (Epic 05)**: Uses materials list to reserve inventory and track consumption
- **Quality Module (Epic 06)**: Reviews yield variances to identify quality issues
- **OEE Module (Epic 10)**: Analyzes duration/yield variances for performance metrics

## Key Takeaways

- **Materials and Operations are snapshots**: They freeze at release time to ensure traceability
- **Snapshots are immutable after release**: No changes allowed to prevent confusion
- **Scaling is automatic**: Quantities adjust based on your planned production volume
- **Variances track performance**: Use them to optimize your routing and training
- **By-products are tracked differently**: They show yield, not consumption
- **Production module is where the action happens**: Operators update times/yields there

## Related Documentation

- User Guide: [Work Order Creation](./work-order-creation.md)
- Technical: [WO Materials & Operations Architecture](../architecture/technical/wo-materials-operations.md)
- API Reference: [Work Order Materials API](../architecture/api/planning-wo-materials-operations.md)
- ADR-002: [BOM Snapshot Pattern](../1-BASELINE/architecture/decisions/ADR-002-bom-snapshot-pattern.md)
- ADR-007: [Work Order State Machine](../1-BASELINE/architecture/decisions/ADR-007-work-order-state-machine.md)
