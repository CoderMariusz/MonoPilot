# Material Reservations Workflow Guide

**Story:** 04.8 - Material Reservations
**Status:** DEPLOYED
**Module:** Production
**Last Updated:** 2026-01-21

## Overview

Material reservations allow operators to allocate specific License Plates (LPs) to Work Order materials before consumption. This prevents allocation conflicts when multiple Work Orders need the same inventory and ensures FIFO/FEFO compliance.

## When to Use Reservations

| Scenario | Recommendation |
|----------|----------------|
| Multiple WOs for same product | Reserve to prevent conflicts |
| Limited inventory | Reserve early to secure materials |
| FIFO/FEFO compliance required | Reserve suggested LPs |
| Large batch requiring multiple LPs | Reserve all needed LPs upfront |
| Time-sensitive production | Reserve before shift starts |

## Reservation Workflow

### Step 1: Open Work Order Materials Tab

1. Navigate to **Production > Work Orders**
2. Click on an **in_progress** Work Order
3. Select the **Materials** tab

You will see a table of required materials with columns:
- Material name and code
- Required quantity
- Reserved quantity
- Consumed quantity
- Actions (Reserve, Consume)

### Step 2: Open Reserve LP Modal

1. Find the material you want to reserve
2. Click the **Reserve** button on that row
3. The Reserve LP Modal opens showing:
   - Material information (name, code, required qty)
   - Currently reserved quantity
   - Available LPs table

### Step 3: Select LPs to Reserve

The Available LPs table shows:
- LP Number
- Available Quantity
- Expiry Date (if tracked)
- Location
- Suggestion badge (FIFO/FEFO recommended)

**To select an LP:**
1. Check the checkbox next to the LP
2. Enter the quantity to reserve (or use full LP qty)
3. Repeat for additional LPs if needed

**Suggestion Badges:**
- **FIFO: oldest** - Oldest LP, recommended for non-perishables
- **FEFO: expires MM/DD** - Nearest expiry, recommended for perishables

### Step 4: Confirm Reservation

1. Review the selected LPs and quantities
2. Add optional notes (reason for selection)
3. Click **Reserve Selected**
4. Success toast confirms reservation

---

## FIFO vs FEFO Explained

### FIFO (First In, First Out)

**What it means:** Use the oldest inventory first.

**How it works:**
- LPs are sorted by receipt date (created_at)
- The LP that arrived first is suggested first
- Prevents inventory from aging indefinitely

**When to use:**
- Raw materials without expiry dates
- Packaging materials
- Finished goods with long shelf life
- Default setting in most warehouses

**Example:**
```
LP-001: Received 2026-01-01 (100 kg) <- Suggested first
LP-002: Received 2026-01-10 (50 kg)
LP-003: Received 2026-01-15 (75 kg)
```

### FEFO (First Expired, First Out)

**What it means:** Use inventory with nearest expiry first.

**How it works:**
- LPs are sorted by expiry_date
- The LP expiring soonest is suggested first
- LPs without expiry dates are sorted last
- Minimizes waste from expired inventory

**When to use:**
- Perishable ingredients (dairy, produce)
- Materials with shelf life requirements
- Ingredients requiring expiry tracking
- Food safety compliance

**Example:**
```
LP-002: Expires 2026-02-15 (50 kg) <- Suggested first
LP-001: Expires 2026-03-30 (100 kg)
LP-003: No expiry (75 kg) <- Sorted last
```

### Switching Strategies

1. Go to **Settings > Warehouse Settings**
2. Find **Picking Strategy** section
3. Toggle between:
   - **Enable FIFO** - First In, First Out
   - **Enable FEFO** - First Expired, First Out
4. Save settings

**Note:** FEFO takes precedence when both are enabled.

### Violation Warnings

If you select an LP that violates the picking strategy:

**FIFO Violation:**
```
Warning: FIFO violation - LP-003 (Jan 15) is newer than suggested LP-001 (Jan 01)
```

**FEFO Violation:**
```
Warning: FEFO violation - LP-001 (expires Mar 30) has later expiry than suggested LP-002 (expires Feb 15)
```

Violations show a **warning** but do not block the reservation. You can acknowledge and proceed if there's a valid reason (location convenience, partial LP needed, etc.).

---

## Auto-Release Behavior

### When Reservations are Released Automatically

1. **WO Cancelled:**
   - All reservations for the WO are released
   - LPs return to "available" status
   - lp_genealogy records are deleted

2. **WO Completed:**
   - Unused reservations (reserved > consumed) are released
   - Fully consumed reservations remain with "consumed" status
   - Genealogy remains for traceability

3. **Reservation Consumed:**
   - When material is consumed from a reserved LP
   - Reservation status changes from "reserved" to "consumed"
   - No manual release needed

### Manual Release

To release a reservation before consumption:

1. Open the WO Materials tab
2. Expand the material row to see reservations
3. Click the **Release** (trash) icon on the reservation
4. Confirm the release

**When to manually release:**
- Wrong LP reserved
- WO requirements changed
- LP quality issue discovered
- Need to free LP for urgent WO

---

## Troubleshooting

### Problem: Cannot find LP in available list

**Possible Causes:**
1. LP status is not "available" (already reserved or consumed)
2. LP product doesn't match material product
3. LP UoM doesn't match material UoM
4. LP QA status is not "passed"
5. LP has expired

**Solution:**
1. Check LP status in Warehouse > License Plates
2. Verify product and UoM match
3. Check QA status and expiry date
4. If LP is reserved by another WO, coordinate with that WO owner

### Problem: INSUFFICIENT_QTY error

**Cause:** Requested quantity exceeds LP available quantity.

**Solution:**
1. Check LP current quantity (may have been partially consumed)
2. Reduce reservation quantity
3. Reserve additional LPs to meet requirement

### Problem: CONSUME_WHOLE_LP_VIOLATION error

**Cause:** Material has `consume_whole_lp=true` but you're trying to reserve partial quantity.

**Solution:**
This material requires full LP consumption for:
- Allergen control (prevent cross-contamination)
- Traceability requirements
- Sealed packaging

You must reserve the **exact** LP quantity. If LP has 25kg, reserve exactly 25kg.

### Problem: LP_ALREADY_RESERVED error

**Cause:** The LP is already reserved for this Work Order.

**Solution:**
1. Check existing reservations in the Materials tab
2. Select a different LP
3. If duplicate reservation attempted by mistake, no action needed

### Problem: CONCURRENCY_ERROR

**Cause:** Another user reserved the same LP at the same time.

**Solution:**
1. Refresh the available LPs list
2. The LP will no longer appear (status changed)
3. Select a different LP

### Problem: Reservation disappeared after creation

**Possible Causes:**
1. Page not refreshed after creation
2. Another user released the reservation
3. WO status changed (cancelled/completed)

**Solution:**
1. Refresh the Materials tab
2. Check WO status
3. Check activity log for changes

---

## Best Practices

### Do:

- Reserve materials **before** starting production
- Use **FIFO/FEFO suggested LPs** when possible
- Document reasons when overriding suggestions
- Reserve **all needed LPs** for large batches upfront
- Communicate with other operators about reserved LPs

### Don't:

- Reserve more than needed (over-reservation)
- Ignore FIFO/FEFO warnings without valid reason
- Leave reservations hanging (release if not needed)
- Reserve LPs without checking expiry dates
- Assume LP is available without refreshing

---

## Reservation States

| Status | Description | LP Status | Can Release |
|--------|-------------|-----------|-------------|
| reserved | LP allocated to WO, not yet consumed | reserved | Yes |
| consumed | Material consumed from LP | consumed/available | No |
| released | Reservation manually released | available | N/A |

---

## Related Documentation

- [Material Reservations API](../../api/production/material-reservations.md)
- [Material Consumption Guide](./consumption-components.md)
- [FIFO/FEFO Picking Guide](../warehouse/fifo-fefo-picking.md)
- [Warehouse Settings](../warehouse/warehouse-settings.md)
- [LP Genealogy Tracking](../../api/lp-genealogy-tracking.md)
