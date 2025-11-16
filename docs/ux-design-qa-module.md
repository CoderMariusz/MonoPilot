# UX Design Specification: QA Module

**Module**: QA (Quality Assurance - Inspections, NCRs, CoAs, Quarantine)
**Priority**: P1 🟡 (Critical - Compliance & Quality Control)
**Created**: 2025-11-15
**Status**: Draft v1.0
**Methodology**: 7-Step UX Design Process

---

## Executive Summary

### Business Context

The **QA Module** is critical for food manufacturing compliance, managing:
- **Inspections** (incoming materials, in-process, finished goods)
- **NCRs (Non-Conformance Reports)** - issue tracking and CAPA workflow
- **Quarantine Management** - Hold/Release decisions with traceability
- **CoAs (Certificates of Analysis)** - compliance documentation generation

**Current Pain Points**:
1. **Paper-Based Inspections**: Checklists printed daily, manually entered into Excel (2 hours/day wasted)
2. **No NCR Workflow**: NCRs tracked in Excel, no visibility into CAPA progress
3. **Manual CoA Generation**: Copy-paste batch data into Word templates (30 min per CoA)
4. **No Quarantine Tracking**: Hold tags written on pallets, no system integration

**Target Users**:
- **Zofia (QA Inspector)**: Performs inspections on shop floor (mobile, 20-30 inspections/day)
- **Karol (QA Manager)**: Reviews NCRs, approves Hold/Release decisions (desktop, weekly reviews)
- **Anna (Lab Technician)**: Conducts tests, enters results, generates CoAs (desktop, daily)

### Design Strategy: Mobile-First + Offline-Capable

**Rejected**: Variant A (Desktop-only forms) - inspectors can't use desktop on shop floor
**Selected (Hybrid)**:
- **Variant B (P1 MVP)**: Mobile Inspection Checklist (swipe-to-complete, photo upload, offline sync)
- **Variant C (P1)**: NCR Dashboard (Kanban-style workflow: Open → Investigation → CAPA → Closed)
- **Variant D (P2)**: CoA Auto-Generation (PDF templates with batch data auto-fill)
- **Variant E (P2)**: Quarantine Management (Hold/Release workflow with LP integration)

**Key Innovation**: Offline-first mobile inspections with photo evidence and automatic Excel elimination.

### Business Impact

**Time Savings**:
- Daily inspection data entry: **2 hours → 0 min** (eliminate Excel transcription)
- NCR tracking: **1 hour/week → 15 min** (Kanban dashboard vs Excel)
- CoA generation: **30 min → 2 min** (auto-fill vs manual)

**Risk Reduction**:
- **100% inspection traceability** (digital records vs lost paper checklists)
- **Zero missed CAPA deadlines** (NCR workflow with alerts)
- **Instant quarantine status** (system-integrated vs manual tags)

**ROI**: 12 hours/week saved across 3 QA staff = **€15,600/year** (at €25/hour)

---

## Step 1: Project and Users Confirmation

### 1.1 Module Scope

**In Scope**:
1. **Inspection Management**
   - Inspection templates (checklists with pass/fail criteria)
   - Mobile inspection execution (swipe, tap, photo)
   - Offline capability (sync when online)
   - Inspection types: Incoming (RM), In-Process (WO), Finished Goods (FG), Equipment (Machine)

2. **NCR (Non-Conformance Report) Workflow**
   - NCR creation (from failed inspection or manual)
   - CAPA (Corrective Action / Preventive Action) workflow
   - Status lifecycle: Open → Investigation → CAPA → Closed
   - Root cause analysis (5 Whys, Ishikawa diagram)
   - Automatic notifications (assignee, QA Manager)

3. **Quarantine Management**
   - Hold/Release decisions (linked to License Plates)
   - Quarantine reasons (quality, regulatory, customer complaint)
   - Approval workflow (QA Manager sign-off required)
   - Visual indicators (red "HOLD" banner on LP)

4. **CoA (Certificate of Analysis) Generation**
   - PDF templates (customizable per product)
   - Batch data auto-fill (LP info, test results, supplier info)
   - Digital signatures (QA Manager approval)
   - Email to customer

**Out of Scope (Future Phases)**:
- SPC (Statistical Process Control) charts - Phase 3 Epic 3.2
- Lab Information Management System (LIMS) integration - Phase 4
- Supplier Quality Management - Phase 4

### 1.2 User Personas

#### Persona 1: Zofia - QA Inspector
**Role**: QA Inspector (Shop Floor)
**Age**: 38
**Experience**: 12 years in food QA (6 years at current company)
**Tech Savviness**: Medium (uses smartphone, familiar with apps, prefers simple UIs)

**Daily Tasks**:
- Perform 20-30 inspections per day (incoming materials, in-process checks, FG sampling)
- Take photos of defects (packaging damage, contamination, incorrect labels)
- Record measurements (temperature, weight, dimensions, pH, moisture)
- Create NCRs when issues found (5-10 per week)
- Sign off on Hold/Release decisions (with QA Manager)

**Pain Points** (Current Paper/Excel System):
1. **Paper Checklists**: "I carry a clipboard with 30 printed checklists. When they get dirty (grease, water), I have to reprint them."
2. **Manual Data Entry**: "After my shift, I spend 2 hours typing inspection results from paper into Excel. I hate it."
3. **Photo Chaos**: "I take photos on my phone, but then I have to email them to myself, download, rename, attach to Excel. Takes 10 min per photo."
4. **Lost Checklists**: "Sometimes checklists get thrown away by accident. No traceability if auditor asks for proof 6 months later."
5. **No Offline**: "In cold storage (no WiFi), I can't access digital checklists. Forced to use paper."

**Goals**:
- Inspect 20-30 items per day WITHOUT spending 2 hours on data entry
- Take photos and attach them instantly (< 30 seconds)
- Work offline (cold storage, freezer) and sync later
- See inspection history for a product (e.g., "Has this supplier failed before?")

**Quote**: *"I'm a QA inspector, not a data entry clerk. Let me inspect, not type."*

---

#### Persona 2: Karol - QA Manager
**Role**: QA Manager
**Age**: 45
**Experience**: 20 years in food QA (10 years as manager)
**Tech Savviness**: High (power Excel user, comfortable with dashboards, reports)

**Weekly Tasks**:
- Review NCRs (10-15 per week)
- Assign CAPA actions to responsible persons (Production Manager, Maintenance, Purchasing)
- Approve Hold/Release decisions for quarantined lots
- Generate monthly QA reports for senior management (KPIs: defect rate, NCR closure time, supplier performance)
- Conduct audits (internal, external regulatory)

**Pain Points** (Current Excel System):
1. **NCR Chaos**: "I have an Excel file with 200 NCRs. I filter by 'Open' status, but I miss follow-ups. No alerts, no visibility."
2. **CAPA Tracking**: "I assign CAPA actions via email. People forget, I have to chase them. No accountability."
3. **No Dashboard**: "I can't see at a glance: 'How many NCRs are overdue? Which supplier is worst? What's our defect trend?'"
4. **Manual CoA Generation**: "I copy-paste batch data from Excel into a Word template. If I typo a number, it's a compliance violation."
5. **Quarantine Confusion**: "We write 'HOLD' on pallet tags, but warehouse operators sometimes miss it. No system integration."

**Goals**:
- See all NCRs on a Kanban board (Open → Investigation → CAPA → Closed)
- Get alerts when CAPA actions are overdue
- Generate CoAs in 2 minutes (not 30 minutes)
- Track quarantine status in real-time (integrated with License Plates)
- Generate monthly QA reports with 1 click

**Quote**: *"I need visibility and accountability. Excel is a black hole where NCRs go to die."*

---

#### Persona 3: Anna - Lab Technician
**Role**: Lab Technician
**Age**: 29
**Experience**: 5 years in food lab (2 years at current company)
**Tech Savviness**: High (familiar with lab software, Excel, databases)

**Daily Tasks**:
- Conduct lab tests (microbiology, chemical analysis, allergen testing)
- Enter test results into Excel (20-30 tests per day)
- Generate CoAs for customers (5-10 per day)
- Calibrate lab equipment (weekly)
- Archive test records for compliance (regulatory requirement: 7 years)

**Pain Points**:
1. **Double Entry**: "I record results in lab notebook (regulatory requirement), then type them into Excel. Wastes 1 hour/day."
2. **CoA Errors**: "When I manually copy test results to CoA templates, I sometimes transpose numbers (7.2 → 2.7). Caught by QA Manager, embarrassing."
3. **No Templates**: "Each customer wants different CoA format. I maintain 15 Word templates. When customer changes format, I update all historical CoAs."
4. **No Test History**: "When I run a test on 'Beef Burger Batch 2024-11-15', I can't see historical results for comparison. Manual Excel lookup."

**Goals**:
- Enter test results ONCE (not twice - notebook + Excel)
- Auto-generate CoAs with test results pre-filled (no typos)
- See test history for a product/batch (trend charts)
- Digital signatures for CoAs (no printing, signing, scanning)

**Quote**: *"Science should be about testing, not copying numbers between systems."*

---

### 1.3 Current State Analysis

#### Current System: Paper + Excel Workflow

**Inspection Workflow** (Zofia):
1. Print checklists from Excel template (30 checklists/day, 10 min printing)
2. Walk to shop floor with clipboard
3. Perform inspection (check boxes: ☐ Pass ☑ Fail, write notes)
4. Take photos on phone (if defect found)
5. Return to office
6. Type results from paper into Excel (2 hours/day)
7. Email photos to self, download, rename, attach to Excel row (10 min per photo)
8. File paper checklists in binder (for audit trail)

**Time**: 2 hours 30 min per day (data entry + photo handling)

**NCR Workflow** (Karol):
1. Create NCR in Excel (NCR-2024-001, description, severity)
2. Assign CAPA action via email to responsible person
3. Wait for email response ("Done", "In Progress", "Blocked")
4. Manually update Excel NCR status
5. Monthly: Filter Excel for "Open" NCRs, send reminder emails
6. Close NCR when CAPA completed (manual Excel update)

**Time**: 1 hour/week (tracking, chasing, emails)

**CoA Generation Workflow** (Anna):
1. Open Word CoA template
2. Copy batch info from Excel (batch number, production date, expiry date)
3. Copy test results from lab Excel (moisture %, pH, microbiology results)
4. Copy supplier info (if applicable)
5. Manually check for typos (10 min proofreading)
6. Print, sign, scan, email to customer

**Time**: 30 min per CoA × 50 CoAs/week = **25 hours/week** (across 3 QA staff)

**Quarantine Workflow**:
1. Zofia finds defect → creates NCR
2. Karol decides "HOLD" (quarantine)
3. Karol writes "HOLD - NCR-2024-001" on pallet tag (red marker)
4. Warehouse operator sees tag → manually updates Excel inventory to "Quarantined"
5. After CAPA resolved → Karol writes "RELEASED" on tag
6. Warehouse operator updates Excel

**Issues**:
- No system integration (manual tag writing)
- Warehouse operators sometimes miss tags (pallets shipped by accident)
- No audit trail (paper tags lost, Excel manually edited)

---

#### Pain Points Summary

| Pain Point | Impact | Frequency | User |
|------------|--------|-----------|------|
| **Manual data entry** (paper → Excel) | 2 hours/day wasted | Daily | Zofia |
| **Lost paper checklists** | No audit trail, compliance risk | 2-3 times/month | Zofia |
| **Photo handling chaos** | 10 min per photo | 5-10 photos/day | Zofia |
| **No offline capability** | Forced to use paper in cold storage | Daily (30% of inspections) | Zofia |
| **NCR tracking in Excel** | No visibility, missed follow-ups | Weekly | Karol |
| **No CAPA alerts** | Overdue actions, compliance risk | Monthly | Karol |
| **Manual CoA generation** | 30 min per CoA, typo risk | 50 CoAs/week | Anna |
| **No quarantine system integration** | Manual tags, shipping errors | 10-15 holds/month | Karol |

**Total Time Wasted**: 2.5 hours/day (Zofia) + 1 hour/week (Karol) + 25 hours/week (Anna) = **~15 hours/week**

**Compliance Risk**: Lost paper checklists, manual Excel edits (no audit trail), quarantine tag errors

---

### 1.4 Technical Constraints

**Database Tables** (to be created):
- `inspection_templates` (id, name, type, checklist_items, created_by)
- `inspections` (id, template_id, inspector_id, status, inspection_date, offline_synced)
- `inspection_items` (id, inspection_id, item_text, result, notes, photo_url)
- `ncrs` (id, ncr_number, description, severity, status, assigned_to, root_cause, capa_action, created_by, closed_date)
- `quarantine_holds` (id, lp_id, ncr_id, hold_reason, held_by, released_by, hold_date, release_date)
- `coa_templates` (id, product_id, template_html, fields_mapping)
- `coas` (id, coa_number, lp_id, test_results_json, generated_by, signed_by, pdf_url)

**API Classes** (to be created):
- `InspectionsAPI` (createTemplate, executeInspection, uploadPhoto, syncOffline)
- `NCRsAPI` (create, update, assignCAPA, close)
- `QuarantineAPI` (holdLP, releaseLP, getHolds)
- `CoAsAPI` (generate, sign, email)

**Key Business Rules**:
1. **Offline-First Inspections**: Mobile app must work without internet, sync when online
2. **Photo Evidence**: Photos stored in Supabase Storage, linked to inspection items
3. **NCR Auto-Numbering**: NCR-YYYY-NNN (e.g., NCR-2024-001, auto-increment)
4. **Quarantine Hold**: Sets `license_plates.qa_status = 'hold'` (blocks picking)
5. **CoA Digital Signature**: Uses Supabase Auth user signature + timestamp

**Technology Stack**:
- Next.js 15 (App Router), React 19, TypeScript 5.7
- Tailwind CSS 3.4
- Supabase (PostgreSQL, Storage for photos, RLS)
- PWA (Progressive Web App) for offline capability
- Lucide React icons

---

### 1.5 Success Metrics

**Quantitative Metrics**:
1. **Inspection Data Entry Time**: 2 hours/day → 0 min (eliminate Excel transcription)
2. **Photo Handling Time**: 10 min/photo → 30 sec (instant upload)
3. **NCR Closure Time**: 30 days avg → 15 days (workflow visibility + alerts)
4. **CoA Generation Time**: 30 min → 2 min (auto-fill)
5. **Quarantine Errors**: 2-3 per month → 0 (system-integrated Hold/Release)

**Qualitative Metrics**:
1. **User Satisfaction**: Zofia rates "ease of inspections" 3/10 → 9/10
2. **Compliance**: 100% inspection traceability (digital records vs paper)
3. **Training Time**: New QA staff onboarding: 8 hours → 2 hours (mobile app simpler than Excel)

**Business Impact**:
- **Time Savings**: 15 hours/week × €25/hour × 52 weeks = **€19,500/year**
- **Compliance Risk Reduction**: Prevent 1 audit failure (€50,000 penalty) = ROI of 256%

---

## Step 2: Design Variants

### Variant A: Desktop-Only Forms (Status: ❌ REJECTED)

**Description**: Traditional web forms for inspections, NCRs, CoAs (desktop browser only).

**Pros**:
- Easy to build (standard CRUD forms)
- No mobile optimization needed

**Cons**:
- **Zofia can't use on shop floor** (no desktop in cold storage, freezer)
- **No offline capability** (requires internet)
- **No photo upload from mobile** (would need to email photos, same pain point)

**Why Rejected**: Doesn't solve core pain point (mobile inspections). Zofia would still use paper + Excel.

---

### Variant B: Mobile Inspection Checklist (Swipe-to-Complete) (Status: ✅ SELECTED - P1 MVP)

**Description**: Mobile-first PWA for inspections with swipe gestures, instant photo upload, offline sync.

**Layout** (Mobile 375px):
```
┌─────────────────────────────────────┐
│ Inspection: Incoming - Beef Mince   │
│ LP: RM-BEEF-2024-11-15-001          │
├─────────────────────────────────────┤
│                                     │
│ 1. Temperature Check                │
│    Swipe → if Pass, ← if Fail       │
│    ════════════════════════         │
│         [Swipe Area]                │
│                                     │
│ ☑ PASS  (Swiped right)              │
│ Enter value: [4.2°C]                │
│ [📷 Add Photo] (optional)           │
│                                     │
│ ───────────────────────────────────│
│                                     │
│ 2. Packaging Integrity              │
│    Swipe → if Pass, ← if Fail       │
│    ════════════════════════         │
│                                     │
│ ☒ FAIL  (Swiped left)               │
│ Reason: [Torn packaging]            │
│ [📷 Add Photo] (required)           │
│ Photo: [IMG_001.jpg] ✓ Uploaded    │
│                                     │
│ ───────────────────────────────────│
│                                     │
│ 3. Label Accuracy                   │
│    Swipe → if Pass, ← if Fail       │
│    ════════════════════════         │
│         [Swipe Area]                │
│                                     │
│ ───────────────────────────────────│
│                                     │
│ Progress: 2/10 items ■■□□□□□□□□     │
│                                     │
│ [Create NCR] [Complete Inspection]  │
│                                     │
└─────────────────────────────────────┘
```

**Key Features**:
1. **Swipe Gestures**: Right = Pass, Left = Fail (gloves-friendly, 56px swipe area)
2. **Instant Photo Upload**: Camera → Crop → Upload to Supabase Storage (< 5 seconds)
3. **Offline Mode**: Inspection saved locally (IndexedDB), synced when online
4. **Progress Bar**: Visual feedback (2/10 items completed)
5. **Auto-NCR Creation**: If any item fails, "Create NCR" button appears

**Pros**:
- ✅ **Gloves-Friendly**: Swipe gestures work with thick gloves (vs small checkboxes)
- ✅ **Fast**: 8-10 items/min (vs 5-6 items/min tapping checkboxes)
- ✅ **Offline**: Works in cold storage (no WiFi)
- ✅ **Instant Photos**: No email/download/rename workflow
- ✅ **Eliminates Excel**: Results auto-saved to database

**Cons**:
- ⚠️ **Learning Curve**: Users need to learn swipe gesture (training: 10 min demo)
- ⚠️ **Accidental Swipes**: Risk of swiping wrong direction (mitigated by undo button)

**Development Effort**: 3 weeks (3 developer-weeks)
- Week 1: PWA setup, offline sync (IndexedDB), photo upload
- Week 2: Swipe gesture component, inspection template engine
- Week 3: Testing (offline scenarios, photo upload edge cases)

**Priority**: **P1 MVP** (highest impact - eliminates 2 hours/day Excel entry)

---

### Variant C: NCR Dashboard (Kanban-Style Workflow) (Status: ✅ SELECTED - P1)

**Description**: Kanban board for NCR workflow (Open → Investigation → CAPA → Closed) with drag-and-drop.

**Layout** (Desktop 1920px):
```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ NCR Dashboard                                            [+ New NCR]  [Filter ▼]  [Export] │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │ 🔴 Open (5)     │  │ 🔍 Investigation│  │ ✅ CAPA (3)     │  │ ✔️ Closed (12)  │     │
│  │                 │  │     (8)         │  │                 │  │                 │     │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤     │
│  │                 │  │                 │  │                 │  │                 │     │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │     │
│  │ │ NCR-2024-045│ │  │ │ NCR-2024-042│ │  │ │ NCR-2024-038│ │  │ │ NCR-2024-001│ │     │
│  │ │ Beef Mince  │ │  │ │ Packaging   │ │  │ │ Gluten      │ │  │ │ Temperature │ │     │
│  │ │ Temp: 7°C   │ │  │ │ Damage      │ │  │ │ Cross-Cont. │ │  │ │ Excursion   │ │     │
│  │ │             │ │  │ │             │ │  │ │             │ │  │ │             │ │     │
│  │ │ 🔴 Critical │ │  │ │ 🟡 Medium   │ │  │ │ 🔴 Critical │ │  │ │ 🟢 Low      │ │     │
│  │ │ Age: 2 days │ │  │ │ Age: 5 days │ │  │ │ Age: 12 days│ │  │ │ Closed:     │ │     │
│  │ │             │ │  │ │             │ │  │ │ ⚠️ Overdue!  │ │  │ │ 2024-10-15  │ │     │
│  │ │ Assigned:   │ │  │ │ Assigned:   │ │  │ │ Assigned:   │ │  │ │             │ │     │
│  │ │ Karol (QA)  │ │  │ │ Tomasz (Prod│ │  │ │ Ewa (Tech)  │ │  │ │             │ │     │
│  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │     │
│  │                 │  │                 │  │                 │  │                 │     │
│  │ [Drag to move]  │  │                 │  │                 │  │ [View Details]  │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                                            │
│  Overdue Alerts (2):                                                                      │
│  ⚠️ NCR-2024-038 - CAPA overdue by 5 days (assigned to Ewa)                              │
│  ⚠️ NCR-2024-041 - Investigation overdue by 3 days (assigned to Tomasz)                  │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Features**:
1. **Kanban Columns**: 4 stages (Open → Investigation → CAPA → Closed)
2. **Drag-and-Drop**: Move NCR cards between columns (status auto-updates)
3. **Color-Coded Severity**: Red = Critical, Yellow = Medium, Green = Low
4. **Overdue Alerts**: Highlight NCRs exceeding SLA (Investigation: 7 days, CAPA: 14 days)
5. **Assignee Avatars**: Visual indicator of who's responsible

**Pros**:
- ✅ **Visual**: Karol sees all NCRs at a glance (vs Excel rows)
- ✅ **Accountability**: Assignees clear, overdue alerts automatic
- ✅ **Fast**: Drag-and-drop vs manual Excel updates
- ✅ **Metrics**: Count NCRs per column, avg closure time

**Cons**:
- ⚠️ **Desktop-Only**: Not optimized for mobile (Karol works on desktop, acceptable)

**Development Effort**: 2 weeks (2 developer-weeks)
- Week 1: Kanban board component (drag-and-drop, card rendering)
- Week 2: NCR CRUD operations, overdue alert logic, notifications

**Priority**: **P1** (high impact, solves NCR tracking chaos)

---

### Variant D: CoA Auto-Generation (PDF Templates) (Status: ✅ SELECTED - P2)

**Description**: PDF templates with batch data auto-fill, digital signatures, email to customer.

**Layout** (PDF Preview):
```
┌──────────────────────────────────────────────────────────────┐
│ Certificate of Analysis                                      │
│                                                              │
│ Company: MonoPilot Manufacturing Ltd.                        │
│ Product: Beef Burger (FG-001)                                │
│ Batch Number: BF-2024-11-15-001                              │
│ Production Date: 2024-11-15                                  │
│ Expiry Date: 2025-05-15                                      │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Test Results                                           │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ Test            │ Result │ Spec Limit │ Status        │  │
│ ├─────────────────┼────────┼────────────┼───────────────┤  │
│ │ Moisture %      │ 65.2%  │ < 70%      │ ✓ PASS        │  │
│ │ pH              │ 5.8    │ 5.5-6.5    │ ✓ PASS        │  │
│ │ Salmonella      │ ND     │ ND/25g     │ ✓ PASS        │  │
│ │ E. coli         │ < 10   │ < 100 cfu/g│ ✓ PASS        │  │
│ │ Total Plate Cnt │ 2.5E4  │ < 1E5 cfu/g│ ✓ PASS        │  │
│ └─────────────────┴────────┴────────────┴───────────────┘  │
│                                                              │
│ Allergens: Gluten, Soy                                       │
│                                                              │
│ Signed by: Anna (Lab Technician)                             │
│ Date: 2024-11-15 14:30 UTC                                   │
│                                                              │
│ Approved by: Karol (QA Manager)                              │
│ Digital Signature: ✅ Verified                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Features**:
1. **Auto-Fill**: Batch data (LP info, production date, expiry) pulled from database
2. **Test Results**: Anna enters results once, auto-populated in CoA
3. **Digital Signatures**: QA Manager approves via button click (no print/sign/scan)
4. **PDF Generation**: Server-side (jsPDF or Puppeteer), downloadable/emailable
5. **Template Library**: Multiple templates per product (customer-specific formats)

**Pros**:
- ✅ **Time Savings**: 30 min → 2 min (Anna: "Finally, no copy-paste!")
- ✅ **Zero Typos**: Auto-fill eliminates manual transcription errors
- ✅ **Compliance**: Digital signatures with audit trail (who signed, when)
- ✅ **Customer-Specific**: Multiple templates (Walmart format, Tesco format, etc.)

**Cons**:
- ⚠️ **Template Maintenance**: Need to update templates when customer changes format
- ⚠️ **Complex Layouts**: Some CoAs have complex tables, charts (requires custom HTML)

**Development Effort**: 3 weeks (3 developer-weeks)
- Week 1: CoA template editor (HTML/CSS with placeholders)
- Week 2: PDF generation (server-side rendering, test results mapping)
- Week 3: Digital signatures, email integration

**Priority**: **P2** (high value, but not MVP - can defer to Phase 2)

---

### Variant E: Quarantine Management (Hold/Release Workflow) (Status: ✅ SELECTED - P2)

**Description**: System-integrated Hold/Release workflow with LP status updates.

**Layout** (Desktop Quarantine Dashboard):
```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ Quarantine Management                                        [Filter ▼]  [Export Report]   │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│  Currently on Hold (8):                                                                    │
│                                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ LP: RM-BEEF-2024-11-15-001                                     🔴 HOLD (2 days)      │ │
│  ├──────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ Product: Beef Mince (RM-BEEF)                                                        │ │
│  │ Qty: 120 kg                                                                          │ │
│  │ Location: WAREHOUSE-01 / QUARANTINE-ZONE / QA-HOLD-01                                │ │
│  │                                                                                      │ │
│  │ Hold Reason: NCR-2024-045 - Temperature excursion (7°C, spec: < 4°C)                │ │
│  │ Held by: Karol (QA Manager)                                                          │ │
│  │ Hold Date: 2024-11-13 10:30                                                          │ │
│  │                                                                                      │ │
│  │ CAPA Status: Investigation in progress (assigned to Tomasz)                          │ │
│  │                                                                                      │ │
│  │ Actions:                                                                             │ │
│  │ [🚫 Scrap (Destroy)]  [✅ Release (Approve)]  [📋 View NCR]  [📷 View Photos (3)]   │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ LP: FG-BURGER-2024-11-14-005                                   🔴 HOLD (1 day)       │ │
│  ├──────────────────────────────────────────────────────────────────────────────────────┤ │
│  │ Product: Beef Burger (FG-001)                                                        │ │
│  │ Qty: 500 EA                                                                          │ │
│  │ Location: WAREHOUSE-01 / FG-STORAGE / QA-HOLD-02                                     │ │
│  │                                                                                      │ │
│  │ Hold Reason: Customer Complaint - Packaging defect (torn wrapper)                    │ │
│  │ Held by: Karol (QA Manager)                                                          │ │
│  │ Hold Date: 2024-11-14 15:00                                                          │ │
│  │                                                                                      │ │
│  │ CAPA Status: CAPA complete (re-inspection passed, approved for release)              │ │
│  │                                                                                      │ │
│  │ Actions:                                                                             │ │
│  │ [🚫 Scrap (Destroy)]  [✅ Release (Approve)]  [📋 View NCR]  [📷 View Photos (5)]   │ │
│  └──────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                            │
│  Released This Month (15):                                                                │
│  [View History →]                                                                         │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key Features**:
1. **Hold Integration**: When LP is held, `license_plates.qa_status = 'hold'` (blocks picking)
2. **Visual Indicators**: Red "HOLD" banner on LP detail pages, warehouse scanner
3. **Release Workflow**: QA Manager approves → LP status changes to 'available'
4. **Scrap Workflow**: QA Manager scraps → LP status = 'scrapped', qty = 0
5. **Audit Trail**: All Hold/Release actions logged with user, timestamp, reason

**Pros**:
- ✅ **System-Integrated**: No manual pallet tags (eliminates shipping errors)
- ✅ **Instant Visibility**: Warehouse operators see HOLD status in scanner
- ✅ **Audit Trail**: Digital record of all Hold/Release decisions
- ✅ **Linked to NCRs**: Hold reason links to NCR, CAPA status visible

**Cons**:
- ⚠️ **Requires LP System**: Depends on License Plate module (already implemented)
- ⚠️ **Warehouse Training**: Operators must check LP status before picking (training: 1 hour)

**Development Effort**: 2 weeks (2 developer-weeks)
- Week 1: QuarantineAPI, LP status updates, Hold/Release workflows
- Week 2: Quarantine dashboard, visual indicators (scanner integration)

**Priority**: **P2** (high value, but depends on NCR workflow - Phase 2)

---

### Variant Comparison Summary

| Feature | Variant A (Desktop Forms) | Variant B (Mobile Checklist) | Variant C (NCR Kanban) | Variant D (CoA Auto-Gen) | Variant E (Quarantine) |
|---------|---------------------------|------------------------------|------------------------|--------------------------|------------------------|
| **Platform** | Desktop only | Mobile PWA | Desktop | Desktop | Desktop + Scanner |
| **Offline** | ❌ No | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Time Savings** | 0 hours | 2.5 hours/day | 1 hour/week | 25 min/CoA | 30 min/week |
| **User** | Zofia (rejected) | Zofia ✅ | Karol ✅ | Anna ✅ | Karol ✅ |
| **Development** | 2 weeks | 3 weeks | 2 weeks | 3 weeks | 2 weeks |
| **Priority** | ❌ Rejected | ✅ P1 MVP | ✅ P1 | ✅ P2 | ✅ P2 |

**Selected Hybrid Approach**:
- **Phase 1 (MVP)**: Variant B (Mobile Checklist) + Variant C (NCR Kanban) = 5 weeks
- **Phase 2 (Growth)**: + Variant D (CoA Auto-Gen) + Variant E (Quarantine) = +5 weeks

**Total Timeline**: 10 weeks for full QA Module UX redesign

---

## Step 3: Detailed Wireframes

### 3.1 Wireframe: Mobile Inspection Checklist (Swipe-to-Complete)

**Context**: Zofia opens inspection on shop floor, completes checklist via swipe gestures.

**Layout**: Mobile 375px (iPhone SE, common BYOD device)

```
┌───────────────────────────────────────┐
│ ← Back    Incoming Inspection    •••  │
├───────────────────────────────────────┤
│                                       │
│ LP: RM-BEEF-2024-11-15-001            │
│ Product: Beef Mince (RM-BEEF)         │
│ Supplier: Premium Meats Ltd.          │
│ Qty: 120 kg                           │
│                                       │
│ Progress: 3/10 ■■■□□□□□□□ (30%)       │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 1. ✓ Temperature Check          │   │
│ │    Result: 3.8°C (PASS)         │   │
│ │    Spec: < 4°C                  │   │
│ │    📷 Photo (0)                  │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 2. ✓ Packaging Integrity        │   │
│ │    Result: No damage (PASS)     │   │
│ │    📷 Photo (0)                  │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 3. ✓ Label Accuracy             │   │
│ │    Result: All labels OK (PASS) │   │
│ │    📷 Photo (0)                  │   │
│ └─────────────────────────────────┘   │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ 4. Color Check                  │   │  ← Current Item
│ │                                 │   │
│ │    ┌───────────────────────┐   │   │
│ │    │                       │   │   │
│ │    │   ← FAIL   PASS →     │   │   │  ← Swipe Area (56px height)
│ │    │                       │   │   │
│ │    └───────────────────────┘   │   │
│ │                                 │   │
│ │    Spec: Pink to red, no brown  │   │
│ │          or gray patches        │   │
│ │                                 │   │
│ │    [📷 Add Photo]                │   │
│ │    [📝 Add Note]                 │   │
│ │                                 │   │
│ └─────────────────────────────────┘   │
│                                       │
│ [Skip]  [Save Draft]  [Complete →]   │
│                                       │
└───────────────────────────────────────┘
```

**Interaction Flow - Item 4 (Color Check)**:

**Scenario A: PASS (Swipe Right)**
1. User swipes right on swipe area (green arrow appears)
2. Item marked as PASS (✓ checkmark)
3. Item collapses (shows summary: "Result: Pink/red, no defects (PASS)")
4. Next item (5. Odor Check) expands automatically
5. Progress bar updates: 4/10 (40%)

**Scenario B: FAIL (Swipe Left)**
1. User swipes left on swipe area (red arrow appears)
2. Item marked as FAIL (✗ mark)
3. "Add Photo" button pulses (red border, required field)
4. "Add Note" field expands (required: explain failure reason)
5. Modal appears:
   ```
   ┌─────────────────────────────────┐
   │ Item Failed: Color Check        │
   ├─────────────────────────────────┤
   │                                 │
   │ This item requires:             │
   │ • Photo evidence (required)     │
   │ • Failure reason (required)     │
   │                                 │
   │ Would you like to create NCR?   │
   │                                 │
   │ [Yes, Create NCR]  [No, Later]  │
   │                                 │
   └─────────────────────────────────┘
   ```

**Photo Upload Flow**:
1. User clicks "📷 Add Photo"
2. Camera opens (native mobile camera API)
3. User takes photo
4. Crop/rotate UI appears:
   ```
   ┌─────────────────────────────────┐
   │ Crop Photo                      │
   ├─────────────────────────────────┤
   │                                 │
   │  ┌─────────────────────────┐   │
   │  │                         │   │
   │  │   [Photo Preview]       │   │
   │  │   (pinch to zoom,       │   │
   │  │    drag to rotate)      │   │
   │  │                         │   │
   │  └─────────────────────────┘   │
   │                                 │
   │  [↻ Rotate]  [✂ Crop]           │
   │                                 │
   │  [Retake]  [Upload]             │
   │                                 │
   └─────────────────────────────────┘
   ```
5. User clicks "Upload"
6. Photo uploads to Supabase Storage (progress spinner)
7. Success: Thumbnail appears, "📷 Photo (1)" badge updates
8. Photo stored with inspection_id + item_id (e.g., `inspections/123/item-4/photo-001.jpg`)

**Offline Mode**:
- Inspection saved to IndexedDB (local browser storage)
- Photos saved as Base64 (temporary, synced when online)
- "⚠️ Offline Mode" banner at top (yellow)
- When online: Auto-sync button appears "☁️ Sync Now (3 pending)"
- User clicks "Sync Now" → Upload inspection + photos → Success toast "✅ Synced"

---

### 3.2 Wireframe: NCR Dashboard (Kanban Board)

**Context**: Karol opens NCR dashboard to review and manage NCRs.

**Layout**: Desktop 1920px

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ MonoPilot                                                          👤 Karol (QA Manager)         │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 📋 NCR Dashboard                                                                                 │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                  │
│  [+ New NCR]  [Filter: All ▼]  [Assignee: All ▼]  [Severity: All ▼]  [Date Range: Last 30d ▼]  │
│  [Export to Excel ↓]  [Print Report 🖨️]                                                          │
│                                                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐│
│  │ 🔴 Open              │  │ 🔍 Investigation     │  │ ✅ CAPA              │  │ ✔️ Closed    ││
│  │ (5 NCRs)             │  │ (8 NCRs)             │  │ (3 NCRs)             │  │ (12 NCRs)    ││
│  │ SLA: 24 hours        │  │ SLA: 7 days          │  │ SLA: 14 days         │  │              ││
│  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤  ├──────────────┤│
│  │                      │  │                      │  │                      │  │              ││
│  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │  │ ┌──────────────────┐ │  │ ┌──────────┐││
│  │ │ NCR-2024-045     │ │  │ │ NCR-2024-042     │ │  │ │ NCR-2024-038     │ │  │ │NCR-2024- │││
│  │ │ 🔴 Critical      │ │  │ │ 🟡 Medium        │ │  │ │ 🔴 Critical      │ │  │ │001       │││
│  │ ├──────────────────┤ │  │ ├──────────────────┤ │  │ ├──────────────────┤ │  │ ├──────────┤││
│  │ │ Beef Mince       │ │  │ │ Packaging        │ │  │ │ Gluten Cross-    │ │  │ │Temp      │││
│  │ │ Temperature      │ │  │ │ Damage           │ │  │ │ Contamination    │ │  │ │Excursion │││
│  │ │ Excursion        │ │  │ │                  │ │  │ │                  │ │  │ │          │││
│  │ │                  │ │  │ │ Supplier:        │ │  │ │ Root Cause:      │ │  │ │Closed:   │││
│  │ │ LP:              │ │  │ │ PackCo Ltd.      │ │  │ │ Line cleaning    │ │  │ │2024-10-15│││
│  │ │ RM-BEEF-001      │ │  │ │                  │ │  │ │ protocol not     │ │  │ │          │││
│  │ │                  │ │  │ │ Investigation:   │ │  │ │ followed         │ │  │ │          │││
│  │ │ Temp: 7°C        │ │  │ │ Supplier audit   │ │  │ │                  │ │  │ │          │││
│  │ │ Spec: < 4°C      │ │  │ │ scheduled        │ │  │ │ CAPA:            │ │  │ │          │││
│  │ │                  │ │  │ │                  │ │  │ │ Update SOP,      │ │  │ │          │││
│  │ │ Created:         │ │  │ │ Assigned:        │ │  │ │ retrain staff    │ │  │ │          │││
│  │ │ 2024-11-13       │ │  │ │ Tomasz (Prod)    │ │  │ │                  │ │  │ │          │││
│  │ │ 10:30            │ │  │ │                  │ │  │ │ ⚠️ Overdue by    │ │  │ │          │││
│  │ │                  │ │  │ │ Age: 5 days      │ │  │ │ 5 days!          │ │  │ │          │││
│  │ │ Assigned:        │ │  │ │                  │ │  │ │                  │ │  │ │          │││
│  │ │ Karol (QA)       │ │  │ │ 📷 Photos: 2     │ │  │ │ Assigned:        │ │  │ │          │││
│  │ │                  │ │  │ │                  │ │  │ │ Ewa (Tech)       │ │  │ │          │││
│  │ │ Age: 2 days      │ │  │ │ [View Details]   │ │  │ │                  │ │  │ │[View]    │││
│  │ │                  │ │  │ └──────────────────┘ │  │ │ Age: 12 days     │ │  │ └──────────┘││
│  │ │ 📷 Photos: 1     │ │  │                      │  │ │                  │ │  │              ││
│  │ │                  │ │  │                      │  │ │ 📷 Photos: 3     │ │  │              ││
│  │ │ [View Details]   │ │  │                      │  │ │                  │ │  │              ││
│  │ └──────────────────┘ │  │                      │  │ │ [View Details]   │ │  │              ││
│  │                      │  │                      │  │ └──────────────────┘ │  │              ││
│  │ [Drag to move →]     │  │                      │  │                      │  │              ││
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘  └──────────────┘│
│                                                                                                  │
│  ⚠️ Overdue Alerts (2):                                                                         │
│  • NCR-2024-038 - CAPA overdue by 5 days (assigned to Ewa) [Send Reminder 📧]                  │
│  • NCR-2024-041 - Investigation overdue by 3 days (assigned to Tomasz) [Send Reminder 📧]      │
│                                                                                                  │
│  📊 Summary Stats (Last 30 days):                                                               │
│  • Total NCRs: 28                                                                               │
│  • Avg Closure Time: 18 days (Target: < 21 days) ✓                                             │
│  • Overdue Rate: 7% (2/28)                                                                      │
│  • Most Common Issue: Packaging defects (12 NCRs, 43%)                                          │
│                                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Drag-and-Drop Interaction**:

**Scenario: Move NCR-2024-045 from "Open" to "Investigation"**
1. Karol clicks and holds NCR-2024-045 card
2. Card lifts (shadow effect, slight rotation)
3. Karol drags card to "Investigation" column
4. Investigation column highlights (blue border)
5. Karol releases mouse
6. Modal appears:
   ```
   ┌─────────────────────────────────────────────────────┐
   │ Move NCR-2024-045 to Investigation?                 │
   ├─────────────────────────────────────────────────────┤
   │                                                     │
   │ Assign investigation to:                            │
   │ [Tomasz (Production Manager) ▼]                     │
   │                                                     │
   │ Investigation notes (optional):                     │
   │ ┌─────────────────────────────────────────────────┐ │
   │ │ [Checking cold storage logs for temp excursion] │ │
   │ └─────────────────────────────────────────────────┘ │
   │                                                     │
   │ Due date: [2024-11-20] (7 days from now)            │
   │                                                     │
   │ [Move NCR]  [Cancel]                                │
   │                                                     │
   └─────────────────────────────────────────────────────┘
   ```
7. Karol fills form, clicks "Move NCR"
8. Card moves to Investigation column
9. Tomasz receives email notification: "You've been assigned NCR-2024-045 (Investigation)"
10. Database updates: `ncrs.status = 'investigation'`, `ncrs.assigned_to = tomasz_user_id`, `ncrs.investigation_due_date = '2024-11-20'`

**Overdue Alert Interaction**:
1. System checks daily (cron job): "Is CAPA due date < today?"
2. If yes: NCR card shows "⚠️ Overdue by X days" badge
3. Overdue Alerts section populates
4. Karol clicks "Send Reminder 📧" on NCR-2024-038
5. Email sent to Ewa:
   > Subject: NCR-2024-038 CAPA Overdue by 5 Days
   > Body: Hi Ewa, NCR-2024-038 (Gluten Cross-Contamination) CAPA action is overdue by 5 days. Please update status or request extension. [View NCR in MonoPilot →]

---

### 3.3 Wireframe: NCR Detail View (Root Cause Analysis)

**Context**: Karol clicks "View Details" on NCR-2024-045.

**Layout**: Side panel (600px wide, slides from right)

```
┌────────────────────────────────────────────────────────────────┐
│ NCR-2024-045: Temperature Excursion          [✕ Close]        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ Status: 🔍 Investigation          Severity: 🔴 Critical       │
│ Created: 2024-11-13 10:30         Age: 2 days                 │
│ Created by: Zofia (QA Inspector)                              │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Issue Description                                        │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ Incoming Beef Mince (LP: RM-BEEF-2024-11-15-001)         │  │
│ │ received at 7°C. Specification: < 4°C.                   │  │
│ │                                                          │  │
│ │ Temperature excursion detected during incoming           │  │
│ │ inspection. Supplier: Premium Meats Ltd.                 │  │
│ │                                                          │  │
│ │ Immediate action: Lot placed on HOLD (quarantine).       │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Evidence (Photos)                                        │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ ┌──────────┐                                             │  │
│ │ │[Photo 1] │  Thermometer reading: 7.2°C                 │  │
│ │ │          │  Timestamp: 2024-11-13 10:15                │  │
│ │ │          │  [View Full Size ↗]                         │  │
│ │ └──────────┘                                             │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Investigation (Assigned to: Tomasz)                      │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ Due Date: 2024-11-20 (5 days remaining)                  │  │
│ │                                                          │  │
│ │ Investigation Notes:                                     │  │
│ │ • Checked cold storage logs: No equipment failure        │  │
│ │ • Contacted supplier: Delivery truck refrigeration       │  │
│ │   failed during transport (2-hour delay)                 │  │
│ │ • Supplier acknowledged issue, will provide credit       │  │
│ │                                                          │  │
│ │ Root Cause (5 Whys):                                     │  │
│ │ 1. Why was temp 7°C? → Truck refrigeration failed        │  │
│ │ 2. Why did refrigeration fail? → Compressor malfunction  │  │
│ │ 3. Why did compressor malfunction? → Maintenance overdue │  │
│ │ 4. Why was maintenance overdue? → Supplier's preventive  │  │
│ │    maintenance program lapsed                            │  │
│ │ 5. Why did program lapse? → Budget cuts, insufficient    │  │
│ │    oversight                                             │  │
│ │                                                          │  │
│ │ [Edit Investigation]  [Move to CAPA →]                   │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ CAPA (Corrective & Preventive Action)                   │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ Not yet assigned (awaiting investigation completion)     │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Affected Items                                           │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ • LP: RM-BEEF-2024-11-15-001 (120 kg) - HOLD            │  │
│ │   Location: QA-HOLD-01                                   │  │
│ │   [View LP →]  [Release]  [Scrap]                        │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Activity Timeline                                        │  │
│ ├──────────────────────────────────────────────────────────┤  │
│ │ 2024-11-13 10:30 - Zofia created NCR (status: Open)     │  │
│ │ 2024-11-13 10:35 - Karol placed LP on HOLD              │  │
│ │ 2024-11-13 11:00 - Karol moved to Investigation,        │  │
│ │                    assigned to Tomasz                    │  │
│ │ 2024-11-14 09:15 - Tomasz added investigation notes     │  │
│ │ 2024-11-14 14:30 - Tomasz added root cause (5 Whys)     │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
│ Actions:                                                       │
│ [Edit NCR]  [Add Comment]  [Attach Files]  [Print NCR]       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**5 Whys Tool** (Accordion expanded):

**Interaction Flow**:
1. Tomasz clicks "[Edit Investigation]"
2. "Root Cause (5 Whys)" section becomes editable
3. Tomasz enters first "Why":
   ```
   1. Why was temp 7°C?
   [Answer: Truck refrigeration failed          ]
   ```
4. System prompts for next "Why":
   ```
   2. Why did refrigeration fail?
   [Answer: Compressor malfunction              ]
   ```
5. Repeat 3 more times (total: 5 Whys)
6. Tomasz clicks "Save Investigation"
7. Root cause recorded in database: `ncrs.root_cause_5whys = JSON array`

---

### 3.4 Wireframe: CoA Auto-Generation (PDF Preview)

**Context**: Anna generates CoA for Beef Burger batch.

**Layout**: Desktop 1920px

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Generate Certificate of Analysis                                                            │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  Step 1: Select Batch                                                                        │
│                                                                                              │
│  Product: [Beef Burger (FG-001) ▼]                                                           │
│  Batch/LP: [BF-2024-11-15-001 ▼]                                                             │
│                                                                                              │
│  Batch Info (auto-filled):                                                                   │
│  • Production Date: 2024-11-15                                                               │
│  • Expiry Date: 2025-05-15                                                                   │
│  • Qty: 500 EA                                                                               │
│  • Warehouse: WAREHOUSE-01 / FG-STORAGE / A-01-01                                            │
│                                                                                              │
│  ───────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                              │
│  Step 2: Enter Test Results                                                                  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ Test Name        │ Result       │ Unit   │ Spec Limit  │ Status     │ Comments        │ │
│  ├──────────────────┼──────────────┼────────┼─────────────┼────────────┼─────────────────┤ │
│  │ Moisture %       │ [65.2]       │ %      │ < 70%       │ ✓ PASS     │                 │ │
│  │ pH               │ [5.8]        │ -      │ 5.5-6.5     │ ✓ PASS     │                 │ │
│  │ Salmonella       │ [ND]         │ /25g   │ ND/25g      │ ✓ PASS     │                 │ │
│  │ E. coli          │ [<10]        │ cfu/g  │ < 100 cfu/g │ ✓ PASS     │                 │ │
│  │ Total Plate Cnt  │ [2.5E4]      │ cfu/g  │ < 1E5 cfu/g │ ✓ PASS     │                 │ │
│  │ Allergen Test    │ [Gluten, Soy]│ -      │ Declared    │ ✓ PASS     │ No cross-cont.  │ │
│  └──────────────────┴──────────────┴────────┴─────────────┴────────────┴─────────────────┘ │
│                                                                                              │
│  ✓ All tests PASS                                                                            │
│                                                                                              │
│  ───────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                              │
│  Step 3: Select CoA Template                                                                 │
│                                                                                              │
│  Customer: [Walmart ▼]   (auto-selects template: "Walmart CoA Format v2.1")                 │
│                                                                                              │
│  Template Preview:                                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ [PDF Preview - Walmart CoA Format]                                                     │ │
│  │                                                                                        │ │
│  │ CERTIFICATE OF ANALYSIS                                                                │ │
│  │                                                                                        │ │
│  │ Product: Beef Burger (FG-001)                    Batch: BF-2024-11-15-001             │ │
│  │ Production Date: 2024-11-15                      Expiry Date: 2025-05-15              │ │
│  │                                                                                        │ │
│  │ Test Results:                                                                          │ │
│  │ ┌─────────────────┬──────────┬───────────┬─────────┐                                  │ │
│  │ │ Test            │ Result   │ Spec Limit│ Status  │                                  │ │
│  │ ├─────────────────┼──────────┼───────────┼─────────┤                                  │ │
│  │ │ Moisture %      │ 65.2%    │ < 70%     │ PASS ✓  │                                  │ │
│  │ │ pH              │ 5.8      │ 5.5-6.5   │ PASS ✓  │                                  │ │
│  │ │ Salmonella      │ ND       │ ND/25g    │ PASS ✓  │                                  │ │
│  │ │ E. coli         │ < 10     │ < 100     │ PASS ✓  │                                  │ │
│  │ │ Total Plate Cnt │ 2.5E4    │ < 1E5     │ PASS ✓  │                                  │ │
│  │ └─────────────────┴──────────┴───────────┴─────────┘                                  │ │
│  │                                                                                        │ │
│  │ Allergens: Gluten, Soy                                                                 │ │
│  │                                                                                        │ │
│  │ Tested by: Anna (Lab Technician)                Date: 2024-11-15                      │ │
│  │ Approved by: [Pending signature]                                                      │ │
│  │                                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│  ───────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                              │
│  Step 4: Review & Sign                                                                       │
│                                                                                              │
│  Reviewed by: Anna (Lab Technician) ✓                                                        │
│                                                                                              │
│  QA Manager Approval:                                                                        │
│  [Request Signature from Karol (QA Manager)]                                                 │
│                                                                                              │
│  Actions:                                                                                    │
│  [Generate PDF]  [Save Draft]  [Cancel]                                                     │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Digital Signature Flow**:

**Scenario: Anna requests Karol's approval**
1. Anna clicks "Request Signature from Karol"
2. Email sent to Karol:
   > Subject: CoA Approval Request - Beef Burger BF-2024-11-15-001
   > Body: Anna has generated a CoA for Beef Burger (Batch: BF-2024-11-15-001). Please review and approve. [Review CoA in MonoPilot →]
3. Karol clicks email link → Opens CoA preview
4. Karol reviews test results (all PASS)
5. Karol clicks "Approve & Sign"
6. Modal appears:
   ```
   ┌─────────────────────────────────────────────┐
   │ Digital Signature Confirmation              │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ By clicking "Sign", you confirm:            │
   │ • You have reviewed all test results        │
   │ • Results are accurate and complete         │
   │ • Batch meets specifications                │
   │                                             │
   │ Your digital signature will be recorded:    │
   │ Name: Karol (QA Manager)                    │
   │ Date/Time: 2024-11-15 16:45 UTC             │
   │                                             │
   │ [Sign CoA]  [Cancel]                        │
   │                                             │
   └─────────────────────────────────────────────┘
   ```
7. Karol clicks "Sign CoA"
8. Database records signature: `coas.signed_by = karol_user_id`, `coas.signed_at = NOW()`
9. PDF regenerated with signature block:
   ```
   Approved by: Karol (QA Manager)
   Digital Signature: ✅ Verified
   Signed: 2024-11-15 16:45 UTC
   ```
10. Anna receives notification: "CoA approved by Karol, ready to send to customer"
11. Anna clicks "Email to Customer" → PDF attached, sent to customer email

---

### 3.5 Wireframe: Quarantine Dashboard (Hold/Release)

**Context**: Karol reviews quarantined License Plates, decides Hold/Release.

**Layout**: Desktop 1920px

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Quarantine Management                                   [Filter ▼]  [Export Report PDF ↓]   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  Currently on HOLD (8 LPs):                                                                  │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 HOLD - LP: RM-BEEF-2024-11-15-001                              Age: 2 days          │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                                        │ │
│  │ Product: Beef Mince (RM-BEEF)                                                          │ │
│  │ Qty: 120 kg                                                                            │ │
│  │ Location: WAREHOUSE-01 / QUARANTINE / QA-HOLD-01                                       │ │
│  │                                                                                        │ │
│  │ Hold Reason: NCR-2024-045 - Temperature excursion (7°C, spec: < 4°C)                  │ │
│  │ Held by: Karol (QA Manager)                                                            │ │
│  │ Hold Date: 2024-11-13 10:35                                                            │ │
│  │                                                                                        │ │
│  │ ┌────────────────────────────────────────────────────────────────────────────────────┐│ │
│  │ │ NCR Status: 🔍 Investigation (Assigned to: Tomasz)                                 ││ │
│  │ ├────────────────────────────────────────────────────────────────────────────────────┤│ │
│  │ │ Root Cause: Supplier's truck refrigeration failed during transport                 ││ │
│  │ │ Investigation Notes: Supplier acknowledged issue, will provide credit              ││ │
│  │ │ CAPA: Not yet assigned (awaiting investigation completion)                         ││ │
│  │ │                                                                                    ││ │
│  │ │ [View Full NCR →]                                                                  ││ │
│  │ └────────────────────────────────────────────────────────────────────────────────────┘│ │
│  │                                                                                        │ │
│  │ ┌────────────────────────────────────────────────────────────────────────────────────┐│ │
│  │ │ 📷 Evidence (1 photo)                                                              ││ │
│  │ │ ┌──────────┐                                                                       ││ │
│  │ │ │[Photo 1] │  Thermometer reading: 7.2°C                                           ││ │
│  │ │ │          │  [View Full Size ↗]                                                   ││ │
│  │ │ └──────────┘                                                                       ││ │
│  │ └────────────────────────────────────────────────────────────────────────────────────┘│ │
│  │                                                                                        │ │
│  │ Recommended Actions:                                                                   │ │
│  │ ⚠️ CRITICAL: LP held for 2 days. Decision required:                                   │ │
│  │                                                                                        │ │
│  │ [🚫 SCRAP (Destroy)]  [✅ RELEASE (Approve for Use)]  [📋 Extend Hold (Pending CAPA)] │ │
│  │                                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ 🔴 HOLD - LP: FG-BURGER-2024-11-14-005                            Age: 1 day           │ │
│  ├────────────────────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                                        │ │
│  │ Product: Beef Burger (FG-001)                                                          │ │
│  │ Qty: 500 EA                                                                            │ │
│  │ Location: WAREHOUSE-01 / FG-STORAGE / QA-HOLD-02                                       │ │
│  │                                                                                        │ │
│  │ Hold Reason: Customer Complaint - Packaging defect (torn wrapper)                      │ │
│  │ Held by: Karol (QA Manager)                                                            │ │
│  │ Hold Date: 2024-11-14 15:00                                                            │ │
│  │                                                                                        │ │
│  │ NCR Status: ✅ CAPA Complete (Re-inspection passed, approved for release)             │ │
│  │                                                                                        │ │
│  │ ✓ READY FOR RELEASE: CAPA completed, re-inspection PASS                               │ │
│  │                                                                                        │ │
│  │ [🚫 SCRAP (Destroy)]  [✅ RELEASE (Approve for Use)]                                   │ │
│  │                                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                              │
│  ───────────────────────────────────────────────────────────────────────────────────────────│
│                                                                                              │
│  Released This Month (15 LPs):                                                               │
│  [View History →]                                                                            │
│                                                                                              │
│  Scrapped This Month (2 LPs):                                                                │
│  [View History →]                                                                            │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Release Workflow**:

**Scenario: Karol approves release of FG-BURGER-2024-11-14-005**
1. Karol reviews NCR status: "✅ CAPA Complete"
2. Karol clicks "✅ RELEASE (Approve for Use)"
3. Confirmation modal appears:
   ```
   ┌─────────────────────────────────────────────┐
   │ Release License Plate?                      │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ LP: FG-BURGER-2024-11-14-005                │
   │ Product: Beef Burger (FG-001)               │
   │ Qty: 500 EA                                 │
   │                                             │
   │ By releasing this LP, you confirm:          │
   │ • CAPA actions completed                    │
   │ • Re-inspection PASS (if required)          │
   │ • LP is safe for use/shipment               │
   │                                             │
   │ Release notes (optional):                   │
   │ ┌─────────────────────────────────────────┐ │
   │ │ [Re-inspected 100 units, all PASS.     ]│ │
   │ │ [Approved for shipment.]               ]│ │
   │ └─────────────────────────────────────────┘ │
   │                                             │
   │ [Release LP]  [Cancel]                      │
   │                                             │
   └─────────────────────────────────────────────┘
   ```
4. Karol clicks "Release LP"
5. Database updates:
   - `license_plates.qa_status = 'available'` (was 'hold')
   - `quarantine_holds.release_date = NOW()`
   - `quarantine_holds.released_by = karol_user_id`
   - `quarantine_holds.release_notes = "Re-inspected 100 units..."`
6. LP card moves from "Currently on HOLD" to "Released This Month"
7. Warehouse scanner now shows LP as "AVAILABLE" (green status)
8. Success toast: "✅ LP FG-BURGER-2024-11-14-005 released successfully"

**Scrap Workflow**:

**Scenario: Karol decides to scrap RM-BEEF-2024-11-15-001**
1. Karol reviews NCR: "Root cause: Supplier truck failure, no internal issue"
2. Karol decides lot is unsafe (temp excursion too severe)
3. Karol clicks "🚫 SCRAP (Destroy)"
4. Confirmation modal appears:
   ```
   ┌─────────────────────────────────────────────┐
   │ ⚠️ SCRAP License Plate?                     │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ LP: RM-BEEF-2024-11-15-001                  │
   │ Product: Beef Mince (RM-BEEF)               │
   │ Qty: 120 kg (€720 value)                    │
   │                                             │
   │ This action is IRREVERSIBLE:                │
   │ • LP will be marked as SCRAPPED             │
   │ • Qty will be set to 0 (destroyed)          │
   │ • LP cannot be used in production           │
   │                                             │
   │ Scrap reason (required):                    │
   │ ┌─────────────────────────────────────────┐ │
   │ │ [Temperature excursion exceeded safe   ]│ │
   │ │ [limit. Lot unsafe for consumption.]   ]│ │
   │ └─────────────────────────────────────────┘ │
   │                                             │
   │ [Confirm Scrap]  [Cancel]                   │
   │                                             │
   └─────────────────────────────────────────────┘
   ```
5. Karol clicks "Confirm Scrap"
6. Database updates:
   - `license_plates.qa_status = 'scrapped'`
   - `license_plates.qty = 0`
   - `quarantine_holds.scrap_date = NOW()`
   - `quarantine_holds.scrapped_by = karol_user_id`
   - `quarantine_holds.scrap_reason = "Temperature excursion..."`
7. NCR auto-updates: "Disposition: SCRAPPED (120 kg destroyed)"
8. Finance notification: "€720 inventory loss recorded (NCR-2024-045)"
9. Supplier notification (if configured): "Claim filed for lot RM-BEEF-2024-11-15-001 (€720)"

---

## Step 4: Component Library (Summary)

### Core Components:
1. **`MobileInspectionChecklist`** - PWA component with swipe gestures, offline sync (IndexedDB), photo upload
2. **`NCRKanbanBoard`** - Drag-and-drop Kanban (4 columns), overdue alerts, real-time updates
3. **`NCRDetailPanel`** - Side panel with 5 Whys tool, activity timeline, CAPA workflow
4. **`CoAGenerator`** - PDF generation (jsPDF), digital signatures, email integration
5. **`QuarantineDashboard`** - Hold/Release workflow, LP status integration

### Shared Components:
- **`SwipeGestureArea`**: Gloves-friendly swipe component (56px height)
- **`PhotoUploadWidget`**: Camera integration + crop/rotate + Supabase Storage upload
- **`OfflineSyncIndicator`**: Yellow banner + sync button (IndexedDB → Supabase)
- **`OverdueAlertCard`**: Red warning card with "Send Reminder" action
- **`FiveWhysTool`**: Interactive 5-question root cause analysis form

---

## Step 5: User Workflows & Time Savings (Summary)

### Workflow 1: Mobile Inspection (Zofia)
**Current**: Paper checklist → Excel entry (2 hours/day)
**New**: Mobile swipe → Auto-save (0 min entry)
**Time Saved**: **2 hours/day** (€50/day × 250 days = **€12,500/year**)

### Workflow 2: NCR Tracking (Karol)
**Current**: Excel tracking, email chasing (1 hour/week)
**New**: Kanban dashboard with auto-alerts (15 min/week)
**Time Saved**: **45 min/week** (€18.75/week × 52 weeks = **€975/year**)

### Workflow 3: CoA Generation (Anna)
**Current**: Manual Word template (30 min per CoA)
**New**: Auto-fill PDF (2 min per CoA)
**Time Saved**: **28 min per CoA** (€11.67 × 50 CoAs/week = **€30,290/year**)

**Total Annual Savings**: €12,500 + €975 + €30,290 = **€43,765/year**

---

## Step 6: Testing & Success Metrics (Summary)

### E2E Tests (Playwright):
- Mobile inspection: Swipe gestures, offline mode, photo upload
- NCR Kanban: Drag-and-drop, overdue alerts, email notifications
- CoA generation: PDF rendering, digital signatures, customer email
- Quarantine: Hold/Release workflows, LP status updates

### Success Metrics:
- Inspection data entry time: 2 hours → 0 min
- NCR closure time: 30 days → 15 days
- CoA generation time: 30 min → 2 min
- Quarantine errors: 2-3/month → 0
- User satisfaction: 3/10 → 9/10

---

## Step 7: Implementation Roadmap

### Phase 1 (MVP) - Weeks 1-5 (P1)
**Week 1-2**: Mobile Inspection Checklist (PWA, offline, swipe gestures)
**Week 3-4**: NCR Kanban Board (drag-and-drop, alerts, notifications)
**Week 5**: NCR Detail Panel (5 Whys, CAPA workflow)

**Effort**: 5 weeks (40 SP, ~25 dev hours)

### Phase 2 (Growth) - Weeks 6-10 (P2)
**Week 6-7**: CoA Auto-Generation (PDF templates, auto-fill)
**Week 8**: Digital Signatures (approval workflow, email integration)
**Week 9-10**: Quarantine Management (Hold/Release, LP integration)

**Effort**: 5 weeks (34 SP, ~21 dev hours)

**Total**: 10 weeks, 74 SP (~46 dev hours)

**ROI**: €43,765/year savings - €9,600 dev cost = **355% ROI (3-year)**

---

## Summary & Next Steps

### Executive Summary Recap

**Problem**: Paper-based inspections (2 hours/day Excel entry), NCR tracking chaos (Excel), manual CoA generation (30 min per CoA), no quarantine system integration.

**Solution**: Mobile inspection app (offline PWA), NCR Kanban dashboard, CoA auto-generation, quarantine Hold/Release workflow.

**Impact**:
- **Time Savings**: 15 hours/week (€43,765/year)
- **Compliance**: 100% inspection traceability, digital CoA signatures
- **Error Reduction**: Zero quarantine shipping errors

**Timeline**: 10 weeks (Phase 1: 5 weeks MVP, Phase 2: 5 weeks Growth)

**ROI**: 355% (3-year), Payback period: 2.7 months

---

### Next Steps

**For Development Team**:
1. Set up PWA infrastructure (offline sync, IndexedDB, service workers)
2. Implement photo upload to Supabase Storage
3. Create swipe gesture component (gloves-friendly)
4. Build NCR Kanban board (drag-and-drop)
5. Integrate CoA PDF generation (jsPDF or Puppeteer)

**For QA Team (Zofia, Karol, Anna)**:
1. Create inspection templates (checklists with pass/fail criteria)
2. Define NCR SLAs (Investigation: 7 days, CAPA: 14 days)
3. Provide CoA template examples (customer-specific formats)
4. Test offline mode in cold storage (no WiFi scenarios)

**For Product Owner**:
1. Approve Phase 1 MVP scope (5 weeks)
2. Decide Phase 2 timing (immediate or deferred)
3. Plan UAT with Zofia, Karol, Anna (3 days per phase)
4. Communicate elimination of paper checklists + Excel to stakeholders

---

**End of QA Module UX Design Specification**

**Document Version**: v1.0
**Created**: 2025-11-15
**Author**: Claude (AI UX Designer)
**Approved By**: [Pending approval]

