# ❓ BATCH 4A - CLARIFICATION QUESTIONS

**Status:** 🤔 Awaiting PO Responses
**Date:** 2025-11-28

---

## 🔴 CRITICAL QUESTIONS (Blocking Implementation)

### QUESTION SET 1: Story 4.3 (Pause/Resume)

**Q1.1: Pause Configuration**
- Is pause reason (Breakdown, Break, Material Wait, Other) **required** or **optional**?
- Should there be a **max pause duration** configured (e.g., max 8 hours)?
- Can an operator pause **multiple times** in one WO? (Yes = allow multiple pause/resume cycles)

**Q1.2: Downtime Tracking & Reporting**
- Should downtime be **calculated and displayed** on WO detail page?
- Format: Total downtime (e.g., "Total downtime: 2h 45m") + breakdown by reason?
- Where should this appear? (WO detail view? Production dashboard?)

**Q1.3: Role Restrictions**
- Who can **pause** WO? (Operators + Managers, or Managers only?)
- Who can **resume** WO? (Same as pause, or only Managers?)

**Q1.4: Configuration Toggle**
- Is `allow_pause_wo` setting **per-warehouse** or **global**?
- Default: allow pauses = TRUE?

**Q1.5: Pause Reason Options**
- Are these 4 reasons sufficient: **Breakdown, Break, Material Wait, Other**?
- Or add more? (e.g., Quality Hold, Equipment Maintenance, Scheduled Maintenance)?

---

### QUESTION SET 2: Story 4.4 (Operation Start)

**Q2.1: When Are Operations Created?**
- Operations created during **Story 3.10** (WO CRUD when creating WO)?
- Or during **Story 3.14** (routing when releasing WO)?
- Or **both** (template during 3.10, customized during 3.14)?

**Q2.2: Initial Operation Status**
- When operations are created, what's their initial status?
  - `not_started` (can be started later)?
  - Or `pending` (different from `not_started`)?

**Q2.3: Sequence Enforcement**
- Is sequence enforcement **always on**, or **configurable per warehouse/product**?
- Configuration name: `require_operation_sequence`? `enforce_operation_order`?
- Default: enforce = TRUE?

**Q2.4: Can Operations Be Skipped?**
- If require_operation_sequence = TRUE:
  - Can operator skip operation 2 and go directly to operation 3?
  - Or must ALL operations be done in order?

**Q2.5: Can Operations Be Cancelled?**
- Can a started operation be **cancelled** without completing?
- If yes, what status? (`cancelled`? `skipped`? `not_completed`?)

**Q2.6: Operation Status Enum - Complete Definition**
- Confirm complete enum: `not_started → in_progress → completed`?
- Add other states? (`cancelled`, `skipped`, `blocked`, `pending`?)

---

### QUESTION SET 3: Story 4.5 (Operation Complete)

**Q3.1: Yield Validation**
- Is **yield_percent field required** or **optional**?
- What's valid range?
  - 0-100% only?
  - 0-150%? (allow over-production?)
  - Any positive number?

**Q3.2: Duration Calculation**
- Auto-calculation from:
  - `started_at` to `NOW()` (current time)?
  - Or `started_at` to `completed_at` (which is set to NOW())?
  - Operator can **override** duration?

**Q3.3: Default Values**
- AC 4.5.1 says "actual_duration_minutes (default from started_at)"
  - Does this mean: show calculated value as default, allow operator to override?

**Q3.4: Next Operation Sequencing**
- AC 4.5.8 "Next operation ready to start"
- Does this mean:
  - Next operation **UI automatically updates** to "available"?
  - Or system **emits event** for dashboard to refresh?
  - Or operator **manually starts** next operation (no auto)?

**Q3.5: Notes Field**
- Is notes field on complete modal **required or optional**?

---

### QUESTION SET 4: Story 4.6 (WO Complete)

**Q4.1: Genealogy Validation in Completion**
- AC 4.6.4 Step 5: "VALIDATE genealogy: All lp_genealogy records have child_lp_id filled"
- **When exactly must genealogy be complete?**
  - During material **reservation** (4.7)? Genealogy created then
  - During **output registration** (4.12)? child_lp_id filled then
  - During **WO completion** (4.6)? All must be linked?

**Q4.2: What If Genealogy Incomplete?**
- Should WO completion:
  - **BLOCK** if genealogy incomplete? (error 400 "Genealogy incomplete")
  - Or **WARN** and allow completion?
  - Or **AUTO-CLOSE** unused genealogy records?

**Q4.3: Auto-Complete Feature**
- AC 4.6.3: "auto_complete_wo enabled"
- **Who/what checks if output_qty >= planned_qty?**
  - Automatic background job polling?
  - Trigger when operation complete (4.5)?
  - Trigger when output registered (4.12)?
  - Operator clicks "Auto-Complete" button?

**Q4.4: By-Products Validation**
- AC 4.6.1: "By-products registered (if in BOM)"
- How to detect if **by-products are required**?
  - From BOM? (product_id has by_products entries?)
  - Can WO complete if by-products in BOM but not registered? (error or warning?)

**Q4.5: All Operations Complete**
- AC 4.6.1: "All operations completed (if required)"
- Does "if required" mean:
  - If `require_operations_for_wo = true`? (story configuration)
  - Or always required?

**Q4.6: Concurrency Protection**
- AC 4.6.7: "SELECT...FOR UPDATE" lock
- How long should lock be held?
  - Only during validation? Or entire transaction?

---

### QUESTION SET 5: Story 4.7 (Material Reservation - Desktop)

**Q5.1: Table Name - CRITICAL**
- **Which table name is correct?**
  - `wo_material_reservations` (from ACs)?
  - `wo_consumption` (from Tasks)?
  - `wo_reserved_materials`?
  - Different tables for different purposes?

**Q5.2: Material Requirement Calculation**
- AC 4.7.1: "Required Qty" for each material
- **Where does "Required Qty" come from?**
  - From BOM snapshot stored when WO created (Story 3.10)?
  - From product recipe?
  - From work order specification?

**Q5.3: Genealogy Linking**
- AC 4.7.3: "Genealogy record created" with parent_lp_id, child_lp_id=NULL, wo_id
- **How does genealogy link back to reservation?**
  - Is there FK: `genealogy.wo_material_reservation_id`?
  - Or just identify by: `genealogy.wo_id + genealogy.parent_lp_id`?
  - Or different linking mechanism?

**Q5.4: Partial Consumption Scenario**
- Material requires 100kg
- Reserved: LP-A (80kg) + LP-B (40kg) = 120kg total
- Output uses: 80kg from LP-A + 20kg from LP-B = 100kg
- **How is this handled?**
  - Create 2 genealogy records? (LP-A complete, LP-B partial)
  - Or 1 record? (Update to show partial?)
  - Or split LP-B? (Create new LP with 20kg consumed, 20kg remaining?)

**Q5.5: LP Status After Reservation**
- AC 4.7.3: "LP status changed: license_plates.status = 'reserved'"
- Can a reserved LP be **unreserved** (cancel reservation)?
- What status transitions are allowed from 'reserved'? (→ consumed? → available?)

**Q5.6: Sequence Number Logic**
- AC 4.7.2: "Shows sequence number (e.g., 'LP #1 for Flour', 'LP #2 for Flour')"
- How is sequence number assigned?
  - Auto-increment per material? (first LP for Flour = 1, second = 2)?
  - Or per WO? (first LP reserved = 1, second = 2)?

---

### QUESTION SET 6: Story 4.8 (Material Reservation - Scanner)

**Q6.1: Story 4.9 Dependency**
- **Is Story 4.9 (consume_whole_lp) a prerequisite for 4.8?**
- Can 4.8 be implemented without 4.9? (Always allow qty input?)
- Or must 4.9 exist first?

**Q6.2: Story 5.36 Dependency**
- **Is Story 5.36 (Offline Queue) a prerequisite for 4.8?**
- Can 4.8 be implemented without offline support?
- Or is offline queue blocking 4.8?

**Q6.3: Barcode Format**
- What barcode formats?
  - **WO barcode** (scan WO to start material reservation)?
  - **LP barcode** (scan LP to reserve)?
  - **Both**?

**Q6.4: Material Complete Indicator**
- AC 4.8.7: "When all materials reserved: Green checkmark"
- **How does system determine "all materials reserved"?**
  - Count of reservations = count of required materials?
  - Sum of reserved_qty >= sum of required_qty?
  - Operator marks complete? (radio button "Complete Material Reservation"?)

---

### QUESTION SET 7: Missing Story 4.9

**Q7.1: Should Story 4.9 Exist?**
- **Yes, create Story 4.9** (consume_whole_lp configuration)?
- **No, move consume_whole_lp to another story?**
- **No, make it a setting in Story 4.7/4.8?**

**Q7.2: If Creating 4.9 - What Should It Cover?**
- Configuration setting: `consume_whole_lp` (per BOM? per product? global)?
- Impact on material reservation UI (Story 4.7 & 4.8)
- Impact on output registration (Story 4.12)
- Validation rules: if consume_whole_lp=TRUE, cannot do partial consumption

**Q7.3: Consume Whole LP Logic**
- If `consume_whole_lp = TRUE`:
  - **Cannot split** reserved LP (must use entire LP qty)?
  - Or just **cannot allocate partial** during reservation (reservation qty = LP qty)?
  - What if actual output < reserved LP qty? (waste?)

---

### QUESTION SET 8: Story 3.14 Dependency

**Q8.1: Provide Story 3.14 Details**
- **Need to review Story 3.14** (routing) to understand:
  - When are operations created?
  - What operation fields are set?
  - Is operation sequencing defined in 3.14?

---

### QUESTION SET 9: Story 5.36 Dependency

**Q9.1: Provide Story 5.36 Details**
- **Need to review Story 5.36** (offline queue) to understand:
  - What operations are queued offline?
  - How does material reservation (4.8) integrate with offline queue?
  - Is 5.36 blocking 4.8 or just future integration?

---

## 🟡 SECONDARY QUESTIONS (Nice to Have Clarity)

### Story 4.4 Additional Clarifications

**Q10.1: Operation Status Display**
- Should operation status be displayed in WO detail as **timeline** or **simple list**?
- Example timeline:
  ```
  ✅ Operation 1: Mixing (complete)
  ⏳ Operation 2: Fermentation (in progress - started 10:00)
  ⭕ Operation 3: Packaging (not started)
  ```

**Q10.2: Dashboard Operation Visibility**
- Should production dashboard show **operation progress**, or just **WO progress**?
- If show operations: expand/collapse? Or always visible?

---

### Story 4.6 Additional Clarifications

**Q11.1: WO Error Messages**
- AC 4.6.5 shows generic error: "2 operations not completed"
- Should this be **specific**, e.g.:
  - "Cannot complete WO: Operations not completed: Operation 1 (Mixing), Operation 3 (Curing)"?

**Q11.2: Output Validation**
- AC 4.6.1: "At least one output registered"
- Does "output" mean:
  - At least 1 production output LP created?
  - Or output_qty > 0?
  - Or both?

---

## 📋 SUMMARY TABLE

| Question Set | Story | # Questions | Criticality | Topic |
|--------------|-------|-----------|-------------|--------|
| **Q1** | 4.3 | 5 | 🔴 Critical | Pause/Resume config |
| **Q2** | 4.4 | 6 | 🔴 Critical | Operation lifecycle |
| **Q3** | 4.5 | 5 | 🔴 Critical | Yield & duration |
| **Q4** | 4.6 | 6 | 🔴 Critical | Genealogy & atomicity |
| **Q5** | 4.7 | 6 | 🔴 Critical | Material reservation |
| **Q6** | 4.8 | 4 | 🔴 Critical | Scanner + dependencies |
| **Q7** | 4.9 | 3 | 🔴 Critical | Missing story |
| **Q8** | 3.14 | 1 | 🔴 Critical | Dependency info |
| **Q9** | 5.36 | 1 | 🔴 Critical | Dependency info |
| **Q10** | 4.4 | 2 | 🟡 Secondary | UI/display |
| **Q11** | 4.6 | 2 | 🟡 Secondary | Error detail |

**Total: 41 Questions (33 Critical, 8 Secondary)**

---

## 🚀 PROCESS

1. **Answer the Critical Questions (Q1-Q9)** first - these block implementation
2. **Clarify any Secondary Questions (Q10-Q11)** - nice to have
3. **Once answered**: We'll update the stories together
4. **Create Story 4.9** if needed based on your answers
5. **Finalize Batch 4A** for implementation

---

**Ready to discuss? Pick a question set or let's go through them systematically! 🎯**

