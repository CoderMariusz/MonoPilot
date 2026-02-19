# Scanner QA Workflow Guide

Mobile-optimized quality inspection workflow for warehouse floor operations. Scan LP barcodes, perform quick pass/fail inspections, and work offline when needed.

---

## Overview

The Scanner QA workflow enables QA Inspectors to:

1. Scan License Plate (LP) barcodes on the warehouse floor
2. View inspection details with product information
3. Record pass or fail decisions with optional notes
4. Work offline and sync when connectivity returns

**Regulatory Compliance**: All scanner actions are logged with user, timestamp, and device ID for audit trail compliance (FDA FSMA, HACCP, GFSI).

---

## Roles and Permissions

| Role | Scanner Access | Can Pass | Can Fail | Can Sync |
|------|---------------|----------|----------|----------|
| QA_INSPECTOR | Yes | Yes | Yes | Yes |
| QA_MANAGER | Yes | Yes | Yes | Yes |
| ADMIN | Yes | Yes | Yes | Yes |
| OWNER | Yes | Yes | Yes | Yes |
| PRODUCTION | No | - | - | - |
| VIEWER | No | - | - | - |

Users without scanner access see: `"Scanner access requires QA Inspector role"`

---

## Workflow Diagram

```
     +------------------+
     | Scanner QA Home  |
     | /scanner/qa/     |
     +--------+---------+
              |
              v
     +--------+---------+
     | Scan LP Barcode  |
     | (or manual entry)|
     +--------+---------+
              |
    +---------+---------+
    |         |         |
    v         v         v
+---+---+ +---+---+ +---+---+
| LP    | | LP No | | LP    |
| Found | | Inspec| | Not   |
+---+---+ +---+---+ | Found |
    |         |     +---+---+
    |         |         |
    |         v         v
    |    +----+----+ +--+---+
    |    | "No     | | Error|
    |    | pending | | Beep |
    |    | inspect"| | Retry|
    |    +---------+ +------+
    |
    v
+---+------------+
| Inspection     |
| Detail Screen  |
+---+---+--------+
    |   |
    v   v
+---+---+  +---+---+
| Quick |  | Quick |
| Pass  |  | Fail  |
+---+---+  +---+---+
    |          |
    v          v
+---+------+  +--------+
| Confirm  |  | Add    |
| Pass?    |  | Notes? |
+---+------+  +---+----+
    |             |
    v             v
+---+------+  +---+----+
| Update   |  | Confirm|
| LP=PASSED|  | Fail?  |
+----------+  +---+----+
                  |
                  v
              +---+----+
              | Update |
              | LP=FAIL|
              +--------+
```

---

## Step-by-Step Instructions

### Step 1: Access Scanner QA Home

Navigate to `/scanner/qa/` in your browser or scanner device.

**Home Screen Elements:**

| Element | Description |
|---------|-------------|
| Header | "Quality Inspection" title with user badge |
| Sync Status | Green (online), Orange (offline), Blue (syncing) |
| Scan Button | Large 96px "Scan LP or WO" button |
| Secondary | "View Pending Inspections" link |
| Footer | Last sync timestamp, queue count |

The scan input auto-focuses for hardware scanner input.

---

### Step 2: Scan LP Barcode

Scan an LP barcode using hardware scanner or enter manually.

**Valid Barcode Format:** `LP00000001` (LP prefix + 8 digits)

**Possible Outcomes:**

| Outcome | Visual Feedback | Audio | Next Action |
|---------|----------------|-------|-------------|
| LP found with inspection | Product card displayed | Success beep | Go to Step 3 |
| LP found, no inspection | "No pending inspection" message | Info tone | Return to home |
| LP not found | "LP not found" error | Error beep | Clear input, retry |

**Example: Successful Lookup**

After scanning `LP00000001`:
- System calls: `GET /api/warehouse/license-plates/barcode/LP00000001`
- Then: `GET /api/quality/inspections/by-lp/{lp_id}`
- Displays inspection detail screen

---

### Step 3: View Inspection Details

The inspection detail screen shows all relevant information.

**Screen Layout:**

```
+----------------------------------+
| [<] INS-INC-2025-00001           |
|     LP: LP00000001               |
+----------------------------------+
| +------------------------------+ |
| | FLOUR, ALL PURPOSE           | |
| | Batch: BATCH-2025-001        | |
| | Qty: 100 kg                  | |
| | Status: [PENDING] (yellow)   | |
| +------------------------------+ |
+----------------------------------+
| +------------------------------+ |
| | [QUICK PASS]  [QUICK FAIL]   | |
| | (green 56px)  (red 56px)     | |
| +------------------------------+ |
+----------------------------------+
```

**Touch Target Sizes:**

| Element | Minimum Size |
|---------|-------------|
| Pass/Fail buttons | 56px height |
| Product info card | 64px height |
| Back button | 48x48px |
| All interactive | 48px minimum |

---

### Step 4a: Quick Pass Workflow

Tap [QUICK PASS] to mark inspection as passed.

**Confirmation Dialog:**

```
+----------------------------------+
|         Confirm Pass             |
+----------------------------------+
| Mark inspection as PASSED?       |
|                                  |
| Product: Flour, All Purpose      |
| LP: LP00000001                   |
|                                  |
| [Cancel]  [Confirm Pass]         |
|  (48px)      (green 56px)        |
+----------------------------------+
```

**After Confirmation:**

1. API call: `POST /api/v1/quality/scanner/quick-inspection`
   ```json
   {
     "inspection_id": "uuid",
     "result": "pass",
     "inspection_method": "scanner",
     "scanner_device_id": "device-id"
   }
   ```

2. System updates:
   - `quality_inspections.status` = `completed`
   - `quality_inspections.result` = `pass`
   - `license_plates.qa_status` = `passed`

3. Success screen displays (3 seconds):
   ```
   +----------------------------------+
   |                                  |
   |        [Green Checkmark]         |
   |                                  |
   |      INSPECTION PASSED           |
   |                                  |
   +----------------------------------+
   ```

4. Return to Scanner QA Home

---

### Step 4b: Quick Fail Workflow

Tap [QUICK FAIL] to mark inspection as failed.

**Fail Dialog (with optional notes):**

```
+----------------------------------+
|         Confirm Fail             |
+----------------------------------+
| Mark inspection as FAILED?       |
|                                  |
| Notes (optional):                |
| +------------------------------+ |
| | Damaged packaging observed   | |
| |                              | |
| +------------------------------+ |
|                                  |
| Defects Found: [    3    ]       |
|                (48px input)      |
|                                  |
| [Cancel]  [Confirm Fail]         |
|  (48px)      (red 56px)          |
+----------------------------------+
```

**After Confirmation:**

1. API call: `POST /api/v1/quality/scanner/quick-inspection`
   ```json
   {
     "inspection_id": "uuid",
     "result": "fail",
     "result_notes": "Damaged packaging observed",
     "defects_found": 3,
     "inspection_method": "scanner",
     "scanner_device_id": "device-id"
   }
   ```

2. System updates:
   - `quality_inspections.status` = `completed`
   - `quality_inspections.result` = `fail`
   - `quality_inspections.result_notes` = notes text
   - `quality_inspections.defects_found` = count
   - `license_plates.qa_status` = `failed`

3. Fail screen displays (3 seconds):
   ```
   +----------------------------------+
   |                                  |
   |          [Red X]                 |
   |                                  |
   |      INSPECTION FAILED           |
   |                                  |
   +----------------------------------+
   ```

4. Return to Scanner QA Home

---

## Offline Mode

### Detection and Indicators

When network connectivity is lost:

| Indicator | Appearance | Meaning |
|-----------|------------|---------|
| Sync Badge | Orange "Offline" | Device disconnected |
| Footer | "Working offline. Actions will sync when online." | Explanation |
| Queue Badge | "3 actions queued" | Count of pending actions |

### Queuing Actions

When offline, pass/fail actions queue locally in IndexedDB:

```typescript
{
  id: "local-uuid-001",
  type: "quick_inspection",
  payload: {
    inspection_id: "uuid",
    result: "pass",
    inspection_method: "scanner"
  },
  timestamp: "2025-01-23T10:30:00Z",
  synced: false,
  retry_count: 0
}
```

**Queue Limits:**

| Limit | Value | Action When Exceeded |
|-------|-------|---------------------|
| Max queue size | 50 actions | Warning: "Offline queue full. Connect to sync." |
| Max sync batch | 100 actions | Split into multiple sync requests |

### Auto-Sync When Online

When connectivity restores:

1. Sync badge changes to blue "Syncing..."
2. System calls: `POST /api/v1/quality/scanner/sync-offline`
3. Actions processed in chronological order (oldest first)
4. Success toast: "3 actions synced successfully"
5. Queue cleared from IndexedDB
6. Sync badge changes to green "Synced"

**Partial Failure Handling:**

If some actions fail during sync:
- Successful actions removed from queue
- Failed actions retained for retry
- Toast: "2 synced, 1 failed. Tap to retry."
- Sync badge shows orange "Sync errors"

---

## Audio Feedback

All audio can be muted via settings toggle (persisted locally).

| Event | Sound | Frequency | Duration |
|-------|-------|-----------|----------|
| Valid barcode scan | Success beep | 440 Hz | 100ms |
| Invalid barcode | Error beep | 220 Hz | 200ms |
| Inspection passed | Success chime | Ascending | 300ms |
| Inspection failed | Alert tone | Descending | 300ms |
| Sync complete | Success beep | 440 Hz | 100ms |
| Sync error | Error beep | 220 Hz | 200ms |

---

## Dark Theme UI

Scanner pages use high-contrast dark theme for warehouse visibility:

| Element | Color |
|---------|-------|
| Background | slate-900 (#0f172a) |
| Text (primary) | white |
| Text (secondary) | gray-300 |
| Pass button | green-600 |
| Fail button | red-600 |
| Pending badge | yellow-500 |
| Passed badge | green-500 |
| Failed badge | red-500 |

---

## QA Status Badges

LP QA status displayed as color-coded badges:

| Status | Color | Description |
|--------|-------|-------------|
| PENDING | Yellow | Awaiting inspection |
| PASSED | Green | Inspection passed, ready for use |
| FAILED | Red | Inspection failed, cannot use |
| HOLD | Orange | Under investigation |
| RELEASED | Blue | Released from hold |
| QUARANTINED | Dark Red | Isolated pending review |
| COND_APPROVED | Light Yellow | Limited use allowed |

---

## Error Handling

### Common Errors and Resolution

| Error | Cause | Resolution |
|-------|-------|------------|
| "LP not found" | Barcode typo or wrong LP | Verify barcode, scan again |
| "No pending inspection" | LP already inspected or not scheduled | Check desktop for inspection status |
| "Inspection already completed" | Duplicate scan attempt | LP already processed |
| "Scanner access requires QA Inspector role" | Wrong user role | Contact admin for role upgrade |
| "Offline queue full" | 50 actions pending | Connect to sync before continuing |
| "Sync failed" | Network or server error | Retry sync, check connectivity |

### Recovery Steps

1. **Network timeout**: Wait for auto-retry (10 seconds) or tap "Retry"
2. **Validation error**: Check input data, correct and resubmit
3. **Server error**: Retry once, if persistent contact admin
4. **Queue full**: Connect to network, wait for sync, then continue

---

## Best Practices

### Efficient Scanning

1. Position scanner 6-12 inches from barcode
2. Ensure adequate lighting on barcode
3. Keep scanner battery above 20%
4. Connect to WiFi when entering office areas to sync

### Data Quality

1. Add notes when failing inspections (helps NCR process)
2. Record accurate defect counts
3. Verify correct LP before confirming
4. Sync within 15 minutes of connectivity for audit compliance

### Device Care

1. Clean scanner lens weekly
2. Charge overnight
3. Report device issues immediately
4. Use protective case on warehouse floor

---

## Troubleshooting

### Scanner Won't Scan

| Check | Action |
|-------|--------|
| Lens dirty | Clean with soft cloth |
| Battery low | Charge device |
| Barcode damaged | Enter manually |
| Bluetooth disconnected | Reconnect ring scanner |

### Stuck in Offline Mode

| Check | Action |
|-------|--------|
| WiFi connected | Verify network settings |
| Server reachable | Try browser test |
| App hung | Force close and reopen |
| Cache full | Clear browser cache |

### Sync Not Working

| Check | Action |
|-------|--------|
| Auth expired | Re-login |
| Server error | Wait and retry |
| Actions malformed | Contact support |
| Queue corrupted | Clear queue (data loss) |

---

## Related Documentation

- [Scanner QA API Reference](/docs/api/quality/scanner-qa.md) - API endpoints and schemas
- [Quality Status Types](/docs/guides/quality/quality-settings-configuration.md) - Status definitions
- [Incoming Inspection](/docs/guides/quality/in-process-inspection-workflow.md) - Desktop inspection workflow
- [Quality Holds](/docs/guides/quality-holds-workflow.md) - Managing held inventory

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-23 | Initial workflow guide for Story 06.8 |
