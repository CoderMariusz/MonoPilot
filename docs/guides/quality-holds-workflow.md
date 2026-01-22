# Quality Holds Workflow Guide

End-to-end workflows for managing quality holds in MonoPilot. Covers creating holds, blocking inventory, releasing decisions, and integrating with LP QA status management.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Quality Hold Lifecycle                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  ACTIVE STATE (Hold created, inventory blocked)              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. QA Team detects quality issue in production              │
│  2. System creates hold                                       │
│  3. Hold assigned unique number (QH-YYYYMMDD-NNNN)           │
│  4. All referenced LPs marked with qa_status = "hold"        │
│  5. Inventory cannot be consumed or picked                   │
│  6. Hold appears on QA dashboard with aging indicator        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  RELEASED        │    │   AGING ALERTS   │
    │  (Disposition)   │    │  (Ongoing)       │
    └──────────────────┘    └──────────────────┘
              │                         │
              │            ┌────────────┼────────────┐
              │            │            │            │
              ▼            ▼            ▼            ▼
         ┌────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐
         │ Release│  │ Rework  │  │  Scrap   │  │  Return  │
         │        │  │         │  │          │  │          │
         │✓ QA OK │  │Need Re- │  │ Destroy  │  │ Back to  │
         │        │  │process  │  │          │  │ Supplier │
         └────────┘  └─────────┘  └──────────┘  └──────────┘
```

---

## Common Workflows

### Workflow 1: Create Hold for Failed Test

**Trigger:** QA inspection fails on license plate

**Participants:** QA Inspector, QA Manager

**Duration:** 2-5 minutes

**Steps:**

1. **QA Inspector navigates to Quality > Holds**
   ```
   URL: /quality/holds
   ```

2. **Inspector clicks [+ Create Hold] button**
   - Modal opens with form fields
   - Status: empty (will be "active" on save)
   - Page load time: <200ms

3. **Inspector fills in hold details**
   - **Reason**: "Failed metal detection test on batch B-2025-001. Metal fragment detected in sample 3 of 5"
   - **Hold Type**: Select "qa_pending" (awaiting full test results)
   - **Priority**: Select "high" (safety concern)
   - Click [+ Add Items]

4. **Inspector selects LPs to hold**
   - Item selection modal opens
   - Filters show available LPs (not already on hold)
   - Selects 3 LPs:
     - LP-20251216-001 (150 KG)
     - LP-20251216-002 (150 KG)
     - LP-20251216-003 (150 KG)
   - Click [Confirm Selection]

5. **Items table shows selected LPs**
   - Rows display: Type, LP#, Location, Qty, UOM
   - Remove icon on each row if needed

6. **Inspector clicks [Create Hold]**
   - Form validates
   - API call: `POST /api/quality/holds`
   - Response includes:
     - Hold object with auto-generated hold_number: "QH-20251216-0001"
     - Hold items with reference_display populated
     - LP updates showing qa_status changed from "passed" → "hold"

7. **Success notification appears**
   - Toast: "Hold QH-20251216-0001 created successfully"
   - Auto-navigates to Hold Detail page

8. **LPs now blocked from consumption**
   - Any production picking operation that attempts to consume LP-20251216-001 receives error:
     ```
     "License plate LP-20251216-001 is on quality hold QH-20251216-0001. Cannot consume."
     ```

**Database Changes:**

```sql
-- quality_holds table
INSERT INTO quality_holds (org_id, reason, hold_type, priority, held_by)
VALUES ('org-456', 'Failed metal detection test on batch B-2025-001...', 'qa_pending', 'high', 'user-123')
RETURNING hold_number; -- QH-20251216-0001

-- quality_hold_items table
INSERT INTO quality_hold_items (hold_id, reference_type, reference_id, quantity_held, uom)
VALUES
  ('hold-uuid-1', 'lp', 'lp-uuid-1', 150, 'KG'),
  ('hold-uuid-1', 'lp', 'lp-uuid-2', 150, 'KG'),
  ('hold-uuid-1', 'lp', 'lp-uuid-3', 150, 'KG');

-- license_plates table
UPDATE license_plates
SET qa_status = 'HOLD', updated_at = now()
WHERE id IN ('lp-uuid-1', 'lp-uuid-2', 'lp-uuid-3')
  AND org_id = 'org-456';
```

---

### Workflow 2: Release Hold After Investigation

**Trigger:** QA team completes investigation and approves items

**Participants:** QA Inspector, QA Manager

**Duration:** 1-3 minutes

**Steps:**

1. **QA Manager navigates to hold detail page**
   ```
   URL: /quality/holds/QH-20251216-0001
   ```

2. **Manager reviews hold details**
   - Hold number, reason, priority, type
   - Items on hold with current status "hold"
   - Aging indicator shows current hold duration
   - [Release Hold] button visible in header (status is "active")

3. **Manager clicks [Release Hold] button**
   - ReleaseModal opens
   - Shows hold summary (number, reason, items)
   - Disposition options displayed:
     - ◯ **Release** - Items approved, safe to consume
     - ◯ **Rework** - Items need reprocessing
     - ◯ **Scrap** - Items destroyed/destroyed
     - ◯ **Return** - Items returned to supplier

4. **Manager selects disposition "Release"**
   - Selection saved in form
   - Example LPs showing what will happen:
     ```
     3 License Plates will have qa_status updated:
     • LP-20251216-001: hold → passed
     • LP-20251216-002: hold → passed
     • LP-20251216-003: hold → passed
     ```

5. **Manager enters release notes**
   - Text area: "All items passed re-inspection. Metal detected in sample 3 was foreign material from test equipment, not product. Batch approved for sale."
   - Character count: 120/1000

6. **Manager clicks [Confirm Release]**
   - Form validates:
     - Disposition selected: ✓
     - Release notes entered and valid: ✓
   - Button changes to loading state
   - API call: `PATCH /api/quality/holds/hold-uuid-1/release`
   - Request body:
     ```json
     {
       "disposition": "release",
       "release_notes": "All items passed re-inspection..."
     }
     ```

7. **Hold released successfully**
   - Response includes:
     - Hold object with:
       - status: "released"
       - released_by: { id, name, email } (current user)
       - released_at: ISO8601 timestamp
       - disposition: "release"
       - release_notes: "All items passed re-inspection..."
     - LP updates showing:
       ```json
       [
         {
           "lp_id": "lp-uuid-1",
           "lp_number": "LP-20251216-001",
           "previous_status": "hold",
           "new_status": "passed",
           "disposition_action": "release"
         },
         ...
       ]
       ```

8. **UI updates to show released hold**
   - Toast: "Hold QH-20251216-0001 released successfully"
   - Page refreshes automatically
   - Hold detail shows:
     - Status badge changes to green "Released"
     - Release information section visible:
       - Released by: Jane Doe
       - Released at: Dec 17, 10:15 AM
       - Disposition: Release
       - Release notes: "All items passed re-inspection..."

9. **LPs now available for consumption**
   - LP-20251216-001 can now be picked and consumed in production
   - qa_status in database is "PASSED" (uppercase in DB, lowercase in API responses)
   - Production picking operation succeeds:
     ```
     ✓ LP-20251216-001 available for picking
     Current quantity: 150 KG
     ```

**Database Changes:**

```sql
-- quality_holds table
UPDATE quality_holds
SET status = 'released',
    released_by = 'user-456',
    released_at = now(),
    disposition = 'release',
    release_notes = 'All items passed re-inspection...',
    updated_by = 'user-456'
WHERE id = 'hold-uuid-1'
  AND org_id = 'org-456';

-- license_plates table
UPDATE license_plates
SET qa_status = 'PASSED', updated_at = now()
WHERE id IN ('lp-uuid-1', 'lp-uuid-2', 'lp-uuid-3')
  AND org_id = 'org-456';
```

---

### Workflow 3: Scrap Items Due to Contamination

**Trigger:** Items found contaminated, must be destroyed

**Participants:** QA Inspector, QA Manager, Warehouse Manager

**Duration:** 2-5 minutes

**Steps:**

1. **QA Manager opens hold detail page for contaminated batch**
   ```
   URL: /quality/holds/QH-20251217-0003
   ```

2. **Reviews hold details**
   - Reason: "Contaminated with foreign material - safety hazard"
   - Priority: "critical" (aging: 18 hours, status: warning)
   - 5 LPs on hold

3. **Manager clicks [Release Hold]**
   - ReleaseModal opens

4. **Selects disposition "Scrap"**
   - Shows warning:
     ```
     ⚠️ CRITICAL: This action will:
     • Set quantity to 0 for all 5 license plates
     • Mark qa_status as "failed"
     • Items will not be recoverable
     ```

5. **Enters detailed scrap justification**
   - Release notes: "Foreign material contamination detected in items. Items do not meet safety standards. Recommend destruction of entire batch B-2025-003. Warehouse Manager to schedule pickup for waste disposal on 2025-12-17."

6. **Confirms release with "Scrap" disposition**
   - API call executes with disposition = "scrap"
   - All 5 LPs get:
     - qa_status = "FAILED"
     - quantity = 0
     - updated_at = now()

7. **Hold shows as "Released" with disposition "Scrap"**
   - Release information section displays:
     ```
     Released by: John Manager
     Released at: Dec 17, 3:45 PM
     Disposition: Scrap
     Release Notes: "Foreign material contamination..."
     ```

8. **LPs now unusable**
   - Each LP shows:
     - qa_status: "failed"
     - quantity: 0 KG
     - Cannot be picked or consumed
     - Appears in waste inventory reports

**Database Changes:**

```sql
UPDATE quality_holds
SET status = 'released',
    released_by = 'user-123',
    released_at = now(),
    disposition = 'scrap',
    release_notes = 'Foreign material contamination...',
    updated_by = 'user-123'
WHERE id = 'hold-uuid-3';

UPDATE license_plates
SET qa_status = 'FAILED',
    quantity = 0,
    updated_at = now()
WHERE id IN (SELECT reference_id FROM quality_hold_items
             WHERE hold_id = 'hold-uuid-3' AND reference_type = 'lp');
```

---

### Workflow 4: Return Items to Supplier

**Trigger:** Supplier sent defective ingredients, items still in sealed packaging

**Participants:** QA Inspector, Procurement Manager

**Duration:** 1-2 hours (investigation phase longer)

**Steps:**

1. **Procurement creates hold for returned items**
   - Reason: "Defective raw material received from Supplier ABC. Moisture content exceeded specification. Items sealed - returning for credit."
   - Hold Type: "investigation"
   - Priority: "high" (impacts production schedule)
   - Items: Batch lot #SUP-2025-12-15, sealed in original pallets

2. **QA investigates and documents defect**
   - Takes photos/samples
   - Records test results
   - Updates hold notes via API (if edit implemented)

3. **Procurement arranges return logistics**
   - Coordinates with supplier pickup
   - Warehouse team holds items in quarantine zone

4. **Once logistics arranged, releases hold with "Return" disposition**
   - ReleaseModal shows:
     ```
     ⚠️ Return Disposition:
     • LP qa_status will be set to "failed"
     • Items reserved for supplier return
     • Warehouse to place in quarantine section
     ```

5. **Enters return details**
   - Release notes: "RMA #12345 issued to Supplier ABC. Items sealed in original packaging. Warehouse to hold in quarantine zone Q-3 pending pickup on 2025-12-20. Supplier will issue credit memo."

6. **Confirms return**
   - Hold released with disposition = "return"
   - All LPs get qa_status = "FAILED" (not "scrap" - they're being returned)
   - Quantity unchanged (full pallets being returned)

7. **Warehouse receives notification**
   - Email: "Hold QH-20251217-0004 released. Items reserved for return RMA #12345. Place in quarantine zone Q-3."

8. **Hold closed, items tracked separately**
   - Inventory reports separate returned items from scraped
   - RMA tracking links back to hold number

---

## Aging Alert Workflow

**Trigger:** Background job runs every 6 hours

**Purpose:** Ensure long-standing holds don't stagnate

**Steps:**

1. **System queries active holds exceeding thresholds**
   ```sql
   SELECT * FROM quality_holds
   WHERE org_id = 'org-456'
     AND status = 'active'
     AND EXTRACT(EPOCH FROM (now() - held_at)) / 3600 > aging_threshold_hours
   ORDER BY priority DESC, held_at ASC
   ```

2. **Calculates aging status for each hold**
   - Priority "critical": threshold 24 hours → status "critical"
   - Priority "high": threshold 48 hours → status "critical"
   - Priority "medium": threshold 72 hours → status "warning"
   - Priority "low": threshold 168 hours → status "warning"

3. **QA Dashboard displays holds with aging indicators**
   - **Critical holds** highlighted in red banner
   - **Warning holds** shown with yellow icon

4. **QA Manager reviews critical holds**
   - Sees list:
     ```
     Critical Aging Holds:
     ✓ QH-20251216-0001 (28 hours)
       - Reason: Failed metal detection test
       - Items: 3 LPs
       - Action: Review and release or escalate
     ```

5. **Manager takes action**
   - Release hold if investigation complete
   - Escalate if investigation blocked
   - Contact department head if hold exceeds SLA

**On Dashboard:**

```
┌───────────────────────────────────────────┐
│ Quality Holds Aging Alert                 │
├───────────────────────────────────────────┤
│                                            │
│ ⚠️  CRITICAL: 2 holds exceeding age limit │
│                                            │
│ • QH-20251216-0001: 28 hours old          │
│   High Priority - Failed metal test       │
│   Action: Release or escalate             │
│                                            │
│ • QH-20251216-0003: 35 hours old          │
│   Critical Priority - Contamination       │
│   Action: *** IMMEDIATE ACTION REQUIRED ***│
│                                            │
│ ⚠️  WARNING: 5 holds approaching threshold│
│                                            │
│ [View All Holds] [Acknowledge]            │
│                                            │
└───────────────────────────────────────────┘
```

---

## LP Blocking Integration

**Scenario:** Production team attempts to consume LP on hold

**Steps:**

1. **Production operator opens warehouse picking interface**
   - Scans or searches for LP-20251216-001
   - System validates LP for picking

2. **Backend checks LP QA status**
   ```typescript
   const canConsume = await QualityHoldService.blockLPConsumption(lpId, orgId);

   if (!canConsume) {
     const hold = await QualityHoldService.getActiveLPHold(lpId, orgId);
     throw new Error(
       `License plate LP-20251216-001 is on quality hold ${hold.hold_number}. Cannot consume.`
     );
   }
   ```

3. **If LP on hold (qa_status = "hold")**:
   - System queries quality_hold_items table
   - Finds active hold containing this LP
   - Returns error message with hold details

4. **Error displayed to operator**
   ```
   ❌ Cannot Pick This Item

   License plate LP-20251216-001 is on quality hold QH-20251216-0001

   Hold Details:
   • Reason: Failed metal detection test
   • Created: Dec 16, 2:30 PM (26 hours ago)
   • Status: Investigation
   • Contact: John Smith (QA Inspector)

   [Close] [Contact QA Team]
   ```

5. **Operator cannot proceed with picking**
   - Application blocks transaction
   - Must select different LP or wait for hold release

6. **Once hold released**:
   - LP qa_status updated to "passed"
   - Operator can retry picking
   - No additional approval needed

**Database Check:**

```sql
-- When attempting to consume LP
SELECT COUNT(*) FROM quality_hold_items qhi
JOIN quality_holds qh ON qhi.hold_id = qh.id
WHERE qhi.reference_type = 'lp'
  AND qhi.reference_id = 'lp-20251216-001'
  AND qh.status = 'active'
  AND qh.org_id = 'org-456';

-- If count > 0, block consumption
```

---

## Multi-Item Hold Workflow

**Scenario:** Hold affects multiple reference types (LPs + Work Orders)

**Steps:**

1. **QA creates hold with mixed item types**
   - Hold Type: "recall"
   - Items:
     - 3 License Plates (finished goods in warehouse)
     - 1 Work Order (batch still in production)
     - 1 Batch identifier (semi-finished product)

2. **Creation logic handles each type**
   ```
   For LPs:
   ✓ Query license_plates table
   ✓ Verify items exist and belong to org
   ✓ Update qa_status = "HOLD"

   For WOs:
   ✓ Query work_orders table
   ✓ Verify WO exists and belongs to org
   ✓ Create hold_item record (WO blocking implemented in Phase 2)

   For Batches:
   ✓ Query batches table
   ✓ Create hold_item record
   ```

3. **Hold detail shows all items**
   - Table displays:
     ```
     Type  | Reference      | Qty    | UOM  | Location
     ─────┼────────────────┼────────┼──────┼──────────────
     LP    | LP-001         | 150    | KG   | Warehouse A
     LP    | LP-002         | 150    | KG   | Warehouse A
     LP    | LP-003         | 150    | KG   | Warehouse B
     WO    | WO-2025-001    | -      | -    | Line 3
     BATCH | BATCH-2025-023 | 75     | KG   | QA Hold Zone
     ```

4. **Release impacts different systems**
   - LPs: qa_status updated to "passed"
   - WOs: Status updated (when WO hold support added)
   - Batches: Batch status updated (when batch hold support added)

---

## Bulk Operations (Future Phase)

**Currently:** Single hold operations

**Future Phase (2+):**
- Release multiple holds at once
- Bulk status change
- Bulk disposition application
- Batch hold templates

---

## Integration with NCR Workflow (Phase 2+)

**Future linking:**

1. **Hold created from failed QA test**
   - Automatically creates Non-Conformance Report (NCR)
   - NCR linked to hold via ncr_id field

2. **NCR investigation**
   - Root cause analysis
   - Corrective actions
   - Effectiveness checks

3. **NCR closure triggers hold evaluation**
   - If NCR approved: hold can be released with "release"
   - If NCR requires rework: hold released with "rework"
   - If NCR determines scrap: hold released with "scrap"

4. **Hold released as part of NCR closure**
   - Disposition determined by NCR decision
   - Audit trail links hold → NCR → disposition

---

## Error Recovery

### Scenario: LP Status Out of Sync

**Problem:** LP shows qa_status = "passed" but hold still shows "active"

**Resolution:**
1. Manually verify hold status: `GET /api/quality/holds/:id`
2. Check LP current status: Query license_plates table
3. Re-release hold with same disposition to force update
4. Verify LP status changed to expected value

### Scenario: Hold Creation Failed Mid-Transaction

**Problem:** Hold record created but LP items not updated

**Resolution:**
1. Hold exists but may be incomplete
2. Options:
   - Delete hold (if has no items)
   - Manually update LP statuses
   - Contact system administrator
3. Retry hold creation with same data

---

## Best Practices

1. **Always provide detailed hold reason**
   - Include what was detected
   - Include affected items/batch IDs
   - Include initial assessment
   - Example: "Failed metal detection test on batch B-2025-001. Metal fragment detected in sample 3 of 5 samples tested. Batch placed on hold pending full sample testing."

2. **Use appropriate priority level**
   - Critical: Safety recalls, immediate risk
   - High: Production-impacting issues, potential safety concerns
   - Medium: Quality issues, routine holds
   - Low: Minor items, administrative holds

3. **Review holds daily**
   - Check aging indicator
   - Release or escalate long-standing holds
   - Update release_notes with investigation findings

4. **Document release decision clearly**
   - Use full sentences in release_notes
   - Reference test results or approvals
   - Include who approved and when
   - Example: "All items passed re-inspection by QA team on 2025-12-17. Metal detected in sample 3 was foreign material from test equipment, not product. Batch approved for sale per manager John Smith."

5. **Don't leave holds in "active" state indefinitely**
   - Set SLA for hold resolution (e.g., 24-48 hours)
   - Escalate if approaching SLA
   - Investigate if threshold exceeded

---

## Performance Tips

- Use filters when listing holds (avoid loading all 1000+ holds)
- Combine status + priority filters for focused queries
- Use pagination (default 20 holds per page)
- Cache holds list on client if viewing frequently
- Load hold detail page separately from list

---

## See Also

- [Quality Holds API Reference](../api/quality-holds-api.md)
- [Component Guide: Quality Holds UI](quality-holds-components.md)
- [Aging Alert Guide](quality-holds-aging-alerts.md)
