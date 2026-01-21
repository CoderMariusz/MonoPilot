# Scanner Putaway Workflow Guide

**Story:** 05.21 - Scanner Putaway Workflow
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

This guide explains how to use the Scanner Putaway workflow to move License Plates (LPs) from receiving areas to optimal storage locations. The system uses intelligent FIFO/FEFO algorithms to suggest locations that group similar products together.

**Who is this for:**
- Warehouse operators performing putaway tasks
- Warehouse managers configuring putaway workflows
- Developers integrating putaway features

---

## Quick Start

### Basic Putaway Steps

1. **Scan LP Barcode** - Scan the LP you want to put away
2. **View Suggestion** - System shows optimal location
3. **Scan Location** - Scan the destination location barcode
4. **Confirm** - Review and confirm the putaway
5. **Done** - LP is moved, ready for next item

**Typical time per putaway:** 15-30 seconds

---

## Step-by-Step Workflow

### Step 1: Scan LP Barcode

Scan the License Plate barcode on the received goods.

**What happens:**
- System looks up LP by barcode number
- Validates LP status is 'available' or 'reserved'
- Loads LP details (product, quantity, expiry)

**Valid LP statuses for putaway:**
- `available` - Ready for putaway
- `reserved` - Reserved but can still be moved

**Invalid LP statuses:**
- `consumed` - Already used in production
- `blocked` - On QA hold

**On screen:**
```
[Scan LP Barcode]

Scan the License Plate barcode to begin putaway.

LP Number: [________________]

[Manual Entry]
```

### Step 2: View Suggested Location

After scanning LP, system calculates and displays the optimal storage location.

**Suggestion display:**
```
+------------------------------------------+
| LP: LP-2026-01234                        |
| Product: Wheat Flour                      |
| Quantity: 500 kg                          |
| Expiry: 2026-12-31                        |
| Current: Receiving Dock 1                 |
+------------------------------------------+
|                                          |
| SUGGESTED LOCATION                        |
| [A-01-01]                                |
| Zone A / Rack 01 / Level 01              |
|                                          |
| Reason: FIFO - Place near oldest stock   |
| Strategy: FIFO                            |
|                                          |
+------------------------------------------+
| ALTERNATIVES                              |
| - A-01-02: Same zone, next available     |
| - B-02-01: Alternative zone              |
+------------------------------------------+

[Use Suggested] [Scan Different Location]
```

**Understanding the suggestion:**

| Element | Meaning |
|---------|---------|
| Suggested Location | Optimal location based on FIFO/FEFO |
| Reason | Why this location was chosen |
| Strategy | FIFO, FEFO, or None (from settings) |
| Alternatives | Other valid locations if suggested is full |

### Step 3: Scan Destination Location

Scan the location barcode where you will place the LP.

**Option A: Use Suggested Location**
- Tap "Use Suggested" button
- Proceed directly to confirmation

**Option B: Scan Different Location**
- Scan any valid location barcode
- System validates location is active
- If different from suggestion, override warning shown

**Override warning:**
```
+------------------------------------------+
| LOCATION OVERRIDE                         |
+------------------------------------------+
| You scanned: B-03-02                      |
| Suggested was: A-01-01                    |
|                                          |
| Reason for override (optional):           |
| [_____________________________________]  |
|                                          |
| [Cancel] [Continue Anyway]               |
+------------------------------------------+
```

**When to override:**
- Suggested location is actually occupied
- Faster to use nearby location
- Specific customer requirement
- Space constraints

### Step 4: Confirm Putaway

Review all details before confirming.

**Confirmation screen:**
```
+------------------------------------------+
| CONFIRM PUTAWAY                           |
+------------------------------------------+
| LP: LP-2026-01234                        |
| Product: Wheat Flour (500 kg)            |
|                                          |
| FROM: Receiving Dock 1                   |
| TO:   A-01-01 (Zone A / Rack 01 / 01)   |
|                                          |
| Strategy: FIFO                           |
| Override: No                             |
+------------------------------------------+

[Cancel] [CONFIRM PUTAWAY]
```

### Step 5: Success

After confirmation, system:
1. Creates stock_move record (type: 'putaway')
2. Updates LP location_id
3. Shows success message

**Success screen:**
```
+------------------------------------------+
|          PUTAWAY COMPLETE                |
|                                          |
| LP: LP-2026-01234                        |
| New Location: A-01-01                    |
| Move #: SM-2026-00456                    |
|                                          |
| [Putaway Another LP] [Back to Menu]      |
+------------------------------------------+
```

---

## FIFO vs FEFO Explained

### What is FIFO?

**FIFO = First In, First Out**

**Goal:** Use oldest inventory first to prevent aging.

**How putaway works with FIFO:**
1. System finds existing LPs of same product
2. Identifies where the OLDEST LP is stored
3. Suggests placing new LP in same zone

**Example:**
```
Product: Wheat Flour

Existing stock:
  LP-001: Zone A (received Dec 1) <- Oldest
  LP-002: Zone A (received Dec 15)
  LP-003: Zone B (received Jan 1)

New LP (received Jan 21):
  Suggestion: Zone A (where oldest stock is)
  Reason: "FIFO: Place near oldest stock of same product"
```

**Benefit:** When picking, zone A is depleted first (FIFO order).

### What is FEFO?

**FEFO = First Expired, First Out**

**Goal:** Use items expiring soonest first to minimize waste.

**How putaway works with FEFO:**
1. System finds existing LPs of same product
2. Identifies where LP with SOONEST expiry is stored
3. Suggests placing new LP near similar expiry dates

**Example:**
```
Product: Milk Powder

Existing stock:
  LP-001: Zone A (expires Jun 1)
  LP-002: Zone B (expires Mar 1) <- Soonest
  LP-003: Zone A (expires Sep 1)

New LP (expires Apr 15):
  Suggestion: Zone B (where soonest expiry is)
  Reason: "FEFO: Place with similar expiry dates"
```

**Benefit:** Expiring items are grouped, easier to pick first.

### When to Use Each

| Product Type | Strategy | Reason |
|-------------|----------|--------|
| Non-perishable (flour, sugar) | FIFO | No expiry concern |
| Perishable (dairy, fresh) | FEFO | Minimize expiry waste |
| Long shelf life | FIFO | Chronological rotation |
| Regulated products | FEFO | Compliance tracking |

### Configuring Strategy

Navigate to **Settings > Warehouse** to enable:

| Setting | Effect |
|---------|--------|
| Enable FIFO | Sort by receipt date |
| Enable FEFO | Sort by expiry date |
| Both enabled | FEFO takes precedence |
| Both disabled | No specific strategy |

---

## Location Suggestions Logic

### How Suggestions Are Calculated

```
1. Get LP details (product, warehouse, expiry)
     |
     v
2. Check warehouse settings (FIFO/FEFO)
     |
     v
3. Find existing LPs of same product
     |
     v
4. Determine target zone:
   - FIFO: Zone of oldest LP
   - FEFO: Zone of soonest expiry LP
   - Fallback: Product preferred zone
     |
     v
5. Find available locations in zone
     |
     v
6. Return suggestion + alternatives
```

### Zone Priority

1. **Strategy zone** - Zone from FIFO/FEFO calculation
2. **Product zone** - Product's preferred_zone_id setting
3. **Default zone** - First available location in warehouse

### No Suggestion Scenarios

When `suggested_location = null`:

| Scenario | Message | Action |
|----------|---------|--------|
| No locations in zone | "No available locations in preferred zone" | Show alternatives |
| All locations inactive | "No active locations available" | Contact admin |
| New product (no existing stock) | "Default storage zone" | Use any available |

---

## Capacity Warnings

If location capacity tracking is enabled, system warns about:

### Near Capacity Warning

```
+------------------------------------------+
| CAPACITY WARNING                          |
+------------------------------------------+
| Location A-01-01 is 85% full             |
| Current: 850 kg / 1000 kg capacity       |
|                                          |
| Your LP: 500 kg                          |
| Would exceed by: 350 kg                  |
|                                          |
| [Choose Different] [Override]            |
+------------------------------------------+
```

### Capacity Exceeded

```
+------------------------------------------+
| CANNOT USE LOCATION                       |
+------------------------------------------+
| Location A-01-01 is at capacity          |
| Current: 1000 kg / 1000 kg               |
|                                          |
| Please scan a different location.        |
|                                          |
| Alternatives:                            |
| - A-01-02: 40% full                      |
| - A-02-01: 20% full                      |
+------------------------------------------+
```

---

## Zone Restrictions

### Zone Type Restrictions

Some zones may have restrictions:

| Zone Type | Restriction | Example Products |
|-----------|-------------|------------------|
| Refrigerated | Temperature-sensitive only | Dairy, fresh |
| Frozen | Frozen products only | Ice cream, frozen meat |
| Hazmat | Hazardous materials only | Cleaning chemicals |
| Dry | General storage | Flour, sugar, packaging |

### Restriction Warning

```
+------------------------------------------+
| ZONE RESTRICTION                          |
+------------------------------------------+
| Product: Wheat Flour                      |
| Product type: Dry goods                   |
|                                          |
| Location B-COLD-01 is in:                |
| Zone: Refrigerated Storage               |
| Allowed: Temperature-sensitive only      |
|                                          |
| This product cannot be stored here.      |
|                                          |
| [Scan Different Location]                |
+------------------------------------------+
```

---

## Troubleshooting

### LP Not Found

**Error:** "LP not found"

**Causes:**
- Barcode not in system
- LP belongs to different organization
- Typo in manual entry

**Solutions:**
1. Verify barcode matches LP label
2. Check LP was created during receiving
3. Try scanning again (clean barcode)

### LP Not Available

**Error:** "LP not available for putaway (status: consumed)"

**Causes:**
- LP already used in production
- LP marked as blocked/hold
- LP already at destination location

**Solutions:**
1. Check LP status in system
2. If blocked, resolve QA issue first
3. Select different LP

### Location Not Found

**Error:** "Destination location not found"

**Causes:**
- Location barcode incorrect
- Location deleted from system
- Scanning wrong label

**Solutions:**
1. Verify scanning location barcode (not product)
2. Check location exists in warehouse settings
3. Manual entry with correct location code

### Location Inactive

**Error:** "Destination location not available (inactive)"

**Causes:**
- Location disabled in settings
- Location under maintenance
- Location reserved for other purpose

**Solutions:**
1. Contact warehouse manager
2. Use alternative location
3. Check location settings

### No Available Locations

**Error:** "No available locations in preferred zone"

**Causes:**
- Zone is full
- All locations inactive
- Zone restrictions apply

**Solutions:**
1. Use alternative location from suggestions
2. Clear space in preferred zone
3. Configure additional locations

### Warehouse Mismatch

**Error:** "Location is in different warehouse"

**Causes:**
- LP in Warehouse A, location in Warehouse B
- Scanner connected to wrong warehouse

**Solutions:**
1. Select location in same warehouse as LP
2. Transfer LP to other warehouse first
3. Check current warehouse setting

---

## Best Practices

### For Warehouse Operators

1. **Always use suggested location** when possible
2. **Document override reasons** for auditing
3. **Report full locations** to supervisor
4. **Verify product matches** label before putaway
5. **Group same products** in same zone

### For Warehouse Managers

1. **Configure FIFO/FEFO** based on product types
2. **Set product preferred zones** for new items
3. **Monitor override frequency** for training needs
4. **Review capacity utilization** weekly
5. **Keep location data current** (active/inactive)

### Performance Tips

| Do | Don't |
|----|-------|
| Scan barcodes cleanly | Force damaged barcodes |
| Use suggested locations | Override without reason |
| Group similar products | Mix product types randomly |
| Report issues promptly | Ignore system warnings |

---

## Scanner Components Reference

The putaway workflow uses these components:

| Component | Purpose |
|-----------|---------|
| `ScannerPutawayWizard` | Main wizard container |
| `Step1ScanLP` | LP barcode scanning |
| `Step2ViewSuggestion` | Display suggestion |
| `Step3ScanLocation` | Location barcode scanning |
| `Step4Confirm` | Confirmation screen |
| `Step5Success` | Success message |
| `LocationSuggestion` | Suggestion display card |
| `LocationOverrideWarning` | Override warning modal |

---

## Related Documentation

- [Scanner Putaway API Reference](../../api/warehouse/scanner-putaway.md)
- [FIFO/FEFO Picking Guide](./fifo-fefo-picking.md)
- [Location Management Guide](./location-management.md)
- [Zone Configuration Guide](./zone-configuration.md)

---

## Support

**Story:** 05.21
**Last Updated:** 2026-01-21
