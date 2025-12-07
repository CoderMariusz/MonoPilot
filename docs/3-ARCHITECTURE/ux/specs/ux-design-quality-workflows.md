# Quality Module - Detailed Workflows

**Epic:** 6 - Quality Control & Compliance
**Stories:** 6.1-6.28 (QA Status, NCRs, Testing, CoAs)
**Version**: 1.0
**Date**: 2025-12-07
**Status**: Documentation

---

## Overview

This document provides detailed workflow specifications for Quality Module operations that are currently missing from the main UX spec (70% → 90% coverage).

**Missing Workflows Added**:
1. Testing Workflow (Detailed)
2. NCR Investigation Workflow (Step-by-step)

---

## 1. Testing Workflow (Detailed)

### 1.1 Pre-Receive Testing (Incoming Materials)

**Persona**: QC Inspector (Sarah, 29)
**Device**: Tablet (1280×800) at receiving dock
**Goal**: Test incoming material batch before approval

#### Step-by-Step Flow

**1. Navigate to Testing Page** (5s)
- Open `/quality/testing`
- See empty state or previous test results

**2. Click "Log Test Result"** (2s)
- Modal opens: "Log Test Result"

**3. Select LP** (8s)
- Dropdown shows LPs with status "pending" or "received today"
- Filter by product type (Raw Material, Packaging, etc.)
- Example: Select "LP-2025-001234 - Beef Trimmings 80/20"

**4. Select Test Type** (3s)
- Dropdown options:
  - Sensory (color, smell, texture)
  - Physical (weight, dimensions)
  - Chemical (pH, composition, allergen)
  - Microbial (bacteria count, contamination)
  - Custom (user-defined)
- Example: Select "Sensory"

**5. Fill Test Parameters** (30s)
- Dynamic form based on test type
- **Sensory Example**:
  - Color: [Normal ▼] (options: Normal, Off-color, Discolored)
  - Smell: [Fresh ▼] (options: Fresh, Off-odor, Spoiled)
  - Texture: [Firm ▼] (options: Firm, Soft, Mushy, Frozen)
- Each parameter has expected value shown (from product spec)

**6. Overall Result** (5s)
- Radio buttons: Pass / Fail
- Auto-suggests "Pass" if all parameters normal
- If any parameter abnormal → suggests "Fail"

**7. Notes (Optional)** (15s)
- Textarea: "Optional notes..."
- Example: "Slight discoloration on edges, but within spec"

**8. Submit** (2s)
- Click "Save Test Result"
- Loading spinner on button

**9. Success** (3s)
- Toast: "Test result logged for LP-2025-001234"
- Modal closes
- Table refreshes with new entry

**Total**: ~70 seconds per test

#### Post-Test Actions (Automatic)

**If Test Passed**:
- LP status remains "pending" (awaits QA approval in separate workflow)
- Green checkmark badge added to LP in table
- Email notification to QC Manager (if enabled in settings)

**If Test Failed**:
- LP status auto-changed to "failed" or "quarantine" (based on settings)
- Red X badge added to LP
- NCR auto-created (optional, based on settings)
- Email alert to QC Manager + Production Manager
- LP blocked from consumption (enforced by reservation API)

---

### 1.2 In-Process Testing (WIP/Semi-Finished)

**Persona**: Line QC Technician (Mike, 24)
**Device**: Tablet (mounted on production line)
**Goal**: Test semi-finished product during operation (e.g., after mixing, before packaging)

#### Step-by-Step Flow

**1. Auto-Trigger Test (Optional)** (0s)
- System detects operation completion (e.g., "Mixing" finished on WO-0105)
- Auto-opens Test Modal on line tablet (if configured in Production Settings)

**2. Pre-filled Context** (0s)
- LP: Auto-filled with output LP from operation
- Test Type: Pre-selected based on operation (e.g., "Physical" for Mixing)

**3. Run Physical Tests** (60s)
- Weight: [125.8] kg (expected: 125.0 kg, tolerance ±2%)
- Temperature: [4.2] °C (expected: 4.0 °C, tolerance ±1°C)
- pH: [5.8] (expected: 5.5-6.0)

**4. Auto-Validation** (0s)
- System checks if values within tolerance
- Green ✓ or Red ✗ next to each parameter

**5. Result** (2s)
- If all green → "Pass" auto-selected
- If any red → "Fail" auto-selected + reason required

**6. Submit** (2s)
- Click "Save & Continue Production"
- If failed → Production paused, Manager alerted

**Total**: ~65 seconds (in-line testing)

---

### 1.3 Final Product Testing (FG before shipping)

**Persona**: QC Manager (Lisa, 35)
**Device**: Desktop (1920×1080)
**Goal**: Approve final product for shipment

#### Step-by-Step Flow

**1. Batch Selection** (10s)
- Navigate to `/quality/testing`
- Filter: Product = "Sausage Links Premium", Status = "FG", QA Status = "pending"
- See 5 LPs from WO-0105 (total 500 kg)

**2. Multi-Select Testing** (3s)
- Checkbox: Select all 5 LPs
- Bulk action: "Run Batch Test"

**3. Batch Test Modal** (0s)
- Pre-filled: 5 LPs listed
- Test Type: "Final QC" (comprehensive)

**4. Sample Testing** (180s)
- Take physical sample from batch
- Run microbial test (off-system, lab equipment)
- Run allergen test (ELISA kit)
- Enter results in modal:
  - Microbial: [<10 CFU/g] (Pass)
  - Allergen: [None Detected] (Pass)
  - Visual: [Normal]
  - Taste: [Acceptable]

**5. Batch Result** (5s)
- Overall: Pass
- Apply to all 5 LPs? [Yes]
- Notes: "Batch test passed, approved for shipment"

**6. Submit** (2s)
- Click "Approve Batch"
- All 5 LPs status → "passed"
- Available for Sales Order picking

**Total**: ~200 seconds (batch of 5 LPs)

---

## 2. NCR Investigation Workflow (Step-by-step)

### 2.1 NCR Creation

**Persona**: QC Inspector (Sarah)
**Device**: Tablet
**Goal**: Document non-conformance

#### Step-by-Step Flow

**1. Discover Issue** (0s)
- Example: Discolored beef trimmings in LP-2025-001234

**2. Open NCR Page** (3s)
- Navigate to `/quality/ncrs`
- Click "Create NCR" button

**3. Create NCR Modal Opens** (0s)

**4. Fill NCR Form** (60s)
- **LP**: [LP-2025-001234 ▼] (dropdown, searchable)
- **Issue Category**: Select one:
  - [ ] Physical defect
  - [x] Contamination
  - [ ] Wrong batch
  - [ ] Supplier issue
  - [ ] Process deviation
  - [ ] Other
- **Severity**: [Medium ▼] (Low, Medium, High, Critical)
- **Description**: Textarea (required)
  - "Beef trimmings show brown discoloration on edges, ~15% affected. Odor is slightly off."
- **Assigned To**: [Mike Chen ▼] (QC Manager, auto-selected)
- **Due Date**: [2025-12-10] (auto-filled: today + 3 days, editable)
- **Attach Photo**: [Upload] (optional, from tablet camera)

**5. Submit** (2s)
- Click "Create NCR"
- Loading spinner

**6. Success** (3s)
- Toast: "NCR-0042 created and assigned to Mike Chen"
- Email sent to Mike
- LP status auto-changed to "quarantine"
- Modal closes, redirects to NCR detail page

**Total**: ~70 seconds

---

### 2.2 NCR Investigation

**Persona**: QC Manager (Mike Chen)
**Device**: Desktop
**Goal**: Investigate root cause and decide disposition

#### Step-by-Step Flow

**1. Receive Email Notification** (0s)
- Subject: "NCR-0042 Assigned: Contamination - LP-2025-001234"
- Click link → opens `/quality/ncrs/NCR-0042`

**2. NCR Detail Page** (5s)
- **Header**: NCR-0042 | LP-2025-001234 | Contamination | Status: **Open**
- **Owner**: Mike Chen | Created: 2025-12-07 10:32 | Due: 2025-12-10
- **Description**: "Beef trimmings show brown discoloration..."
- **Photos**: [thumbnail of discolored beef]
- **Related Data**:
  - Supplier: "ABC Meat Co."
  - Batch: "BEEF-2025-W49"
  - Receipt Date: 2025-12-07 08:15
  - GRN: GRN-0123

**3. Investigation Timeline** (0s)
- Shows auto-logged events:
  - 2025-12-07 10:32 - NCR created by Sarah
  - 2025-12-07 10:32 - LP quarantined (auto)
  - 2025-12-07 10:33 - Assigned to Mike Chen

**4. Add Investigation Note** (90s)
- Click "Add Note" button
- Modal:
  - **Note Type**: [Investigation ▼] (Investigation, Action Taken, Supplier Contact, Disposition)
  - **Note**: Textarea
    - "Contacted supplier ABC Meat Co. They confirmed batch BEEF-2025-W49 was processed 2 days past optimal date due to equipment downtime. Requesting credit."
  - Click "Save Note"
- Timeline updates with new entry

**5. Change Status** (5s)
- Click "Update Status" dropdown
- Select "In Investigation" → "Under Review"
- Status badge changes from yellow to orange

**6. Request Supplier Action** (30s)
- Click "Contact Supplier" button
- Email template pre-filled:
  - To: abc.meat@example.com
  - Subject: "NCR-0042 - Beef Trimmings Discoloration"
  - Body: Template with NCR details + photo
- Click "Send & Log"
- Timeline logs "Supplier contacted"

**7. Disposition Decision** (10s)
- Click "Set Disposition" dropdown
- Options:
  - [ ] Use as-is (accept)
  - [ ] Rework (trim discolored portions)
  - [x] Reject (return to supplier)
  - [ ] Scrap (dispose)
- Select "Reject"
- Reason: "Quality below spec, supplier credit requested"

**8. Assign Corrective Action** (45s)
- Click "Create Action Item"
- Modal:
  - **Title**: "Update supplier quality requirements for batch age"
  - **Assigned To**: [Procurement Manager ▼]
  - **Priority**: [Medium ▼]
  - **Due Date**: [2025-12-14]
  - Click "Create"
- Action item linked to NCR

**9. Close NCR** (5s)
- Click "Close NCR" button
- Confirmation modal:
  - "Are you sure? LP will be marked as rejected and blocked from use."
  - [Confirm] → NCR status = "Closed"
  - LP status = "rejected"
  - Timeline logs closure

**10. Success** (3s)
- Toast: "NCR-0042 closed. LP-2025-001234 rejected."
- Email sent to Sarah (creator) + Procurement
- NCR badge turns green
- Page shows "Closed" banner

**Total Investigation Time**: ~3-5 minutes (active), 1-3 days (elapsed with supplier contact)

---

### 2.3 NCR Reporting & Analytics

**Persona**: QC Manager (Mike)
**Device**: Desktop
**Goal**: Weekly review of NCR trends

#### Step-by-Step Flow

**1. Navigate to Dashboard** (3s)
- `/quality` main page

**2. View NCR Stats Cards** (5s)
- **Open**: 3 (red badge)
- **In Investigation**: 5 (yellow badge)
- **Closed This Week**: 12 (green badge)
- **Avg Resolution Time**: 2.3 days

**3. Filter NCRs** (10s)
- Click "NCRs" tab
- Filter:
  - Date Range: Last 30 days
  - Status: All
  - Category: All
  - Supplier: "ABC Meat Co."
- See 4 NCRs from this supplier

**4. Identify Trend** (15s)
- Notice 3 out of 4 are "Contamination" or "Physical defect"
- All related to batch age issues

**5. Export Report** (8s)
- Click "Export" button
- Select "PDF Report"
- Report includes:
  - NCR summary table
  - Charts (NCR by category, by supplier, trend over time)
  - Resolution time histogram
- Download "NCR_Report_2025-12-07.pdf"

**6. Create Supplier Review Action** (30s)
- Click "Create Action Item" (from dashboard)
- Title: "Quarterly supplier review - ABC Meat Co. quality issues"
- Assigned to: Procurement Manager
- Linked NCRs: NCR-0042, NCR-0038, NCR-0035
- Due: 2025-12-21

**7. Email Report to Management** (10s)
- Click "Share Report"
- Email template with PDF attached
- To: Operations Director, Procurement Manager
- Subject: "Weekly NCR Report - Week 49"
- Send

**Total**: ~80 seconds (active reporting)

---

## 3. QA Status Transition Rules

### 3.1 State Machine

**Valid Transitions**:

```
pending → passed      ✓ (after testing)
pending → failed      ✓ (failed test)
pending → quarantine  ✓ (investigation needed)
pending → rejected    ✓ (pre-emptive rejection)

quarantine → passed   ✓ (investigation resolved, approved)
quarantine → failed   ✓ (investigation confirmed failure)
quarantine → rejected ✓ (investigation → reject)

failed → quarantine   ✓ (needs investigation)
failed → rejected     ✓ (confirmed reject)

passed → quarantine   ✓ (new issue found post-approval)
passed → rejected     ✓ (recall scenario)

rejected → [none]     ✗ (terminal state)
```

**Invalid Transitions** (enforced by API):
- `passed → pending` ✗ (cannot un-approve)
- `failed → passed` ✗ (must go through quarantine for re-approval)
- `rejected → *` ✗ (terminal state, audit trail only)

### 3.2 Transition UX

**Update Status Modal**:
```
┌─────────────────────────────────────────┐
│ Update QA Status: LP-2025-001234  [×]   │
├─────────────────────────────────────────┤
│ Current Status: Quarantine              │
│                                         │
│ New Status:                             │
│ [Passed ▼                          ]   │
│                                         │
│ Available transitions:                  │
│ ✓ Passed     (approve after investigation)│
│ ✓ Failed     (confirm failure)         │
│ ✓ Rejected   (reject entirely)         │
│                                         │
│ Reason/Notes: (required for some)      │
│ ┌───────────────────────────────────┐  │
│ │ [Reason text area]                │  │
│ └───────────────────────────────────┘  │
│                                         │
│ ⚠️ This change will be logged for      │
│    audit compliance.                   │
│                                         │
│           [Cancel] [Update Status]      │
└─────────────────────────────────────────┘
```

**Client-side Validation**:
- Dropdown only shows valid transitions
- Invalid options disabled with tooltip: "Cannot transition from Passed to Pending"

**Server-side Validation**:
- API returns 400 if invalid transition attempted
- Error message: "Invalid transition: {from} → {to}"

---

## 4. Testing Templates (by Product Type)

### 4.1 Raw Material - Meat

**Test Type**: Sensory + Physical + Microbial

**Parameters**:
- Color: [Normal / Off-color / Discolored]
- Smell: [Fresh / Off-odor / Spoiled]
- Texture: [Firm / Soft / Mushy / Frozen]
- Temperature: [N] °C (expected: 0-4°C)
- Weight: [N] kg (tolerance: ±2%)
- Microbial Count: [N] CFU/g (max: 10 CFU/g)

**Auto-Pass Criteria**: All green
**Auto-Fail Criteria**: Any red

---

### 4.2 Packaging Material

**Test Type**: Physical

**Parameters**:
- Dimensions: [N × N × N] mm (tolerance: ±5mm)
- Weight: [N] g (tolerance: ±10%)
- Integrity: [Intact / Damaged / Torn]
- Print Quality: [Readable / Faded / Smudged]

---

### 4.3 Finished Goods

**Test Type**: Comprehensive (Sensory + Physical + Chemical + Label)

**Parameters**:
- Weight: [N] kg (tolerance: ±1%)
- Allergen Test: [Pass / Fail]
- Label Accuracy: [Correct / Incorrect]
- Packaging: [Sealed / Leaking / Damaged]
- Taste (sample): [Acceptable / Off-flavor / Reject]
- Appearance: [Normal / Discolored / Defect]

---

## 5. CoA Generation Workflow

**Persona**: QC Manager
**Goal**: Generate Certificate of Authenticity for shipment

### Step-by-Step Flow

**1. Sales Order Ready** (0s)
- Sales Order SO-0123 is packed, awaits shipment approval

**2. Navigate to CoA Page** (3s)
- `/quality/coas`
- Click "Generate CoA"

**3. Generate CoA Modal** (0s)

**4. Fill Form** (30s)
- **Type**: [Certificate of Authenticity ▼] (CoA, Test Report, Allergen Statement)
- **Reference**: [SO-0123 ▼] (Sales Order or LP)
- **Format**: [PDF ▼]
- **Attachments**:
  - [x] Test Results (from all FG LPs in SO)
  - [x] QA Sign-off
  - [x] Audit Trail (status changes)
  - [ ] Supplier CoAs (for raw materials)

**5. Preview** (5s)
- Click "Preview"
- PDF opens in new tab
- Shows:
  - Header: Company logo, CoA #, Date
  - Product details: Code, Name, Batch, Quantity
  - Test results summary (all passed)
  - QA signature (digital)
  - Allergen declaration
  - Footer: "This document certifies..."

**6. Generate & Download** (3s)
- Click "Generate & Download"
- PDF saved: "CoA_SO-0123_2025-12-07.pdf"
- CoA record created in database
- Toast: "CoA-0056 generated for SO-0123"

**7. Attach to Shipment** (auto)
- CoA automatically linked to Sales Order
- Visible in SO detail page
- Included in shipment email to customer

**Total**: ~40 seconds

---

## 6. Mobile Responsive (Quality)

### 6.1 Tablet View (768px - 1024px)

**Testing Page**:
- Table → Card view (expandable)
- Each card shows:
  - LP number (large font)
  - Test type badge
  - Pass/Fail badge (color-coded)
  - Date + User
  - Tap to expand → full details + actions

**NCR Page**:
- NCR cards:
  - NCR # + Status badge
  - LP + Issue category
  - Owner + Due date
  - Tap to expand → timeline + actions

### 6.2 Phone View (<768px)

**Not optimized** (Quality module desktop/tablet only)
- Show message: "Quality features optimized for tablet/desktop"

---

## Related Documentation

- Main Quality Module UX: `docs/3-ARCHITECTURE/ux/specs/ux-design-quality-module.md`
- Story 6.1-6.28: QA Status, NCRs, Testing
- Shared UI System: `docs/3-ARCHITECTURE/ux/specs/ux-design-shared-system.md`
- API Documentation: `docs/3-ARCHITECTURE/api/quality-api.md`

---

**Version History**:
- 1.0 (2025-12-07): Initial detailed workflow documentation
