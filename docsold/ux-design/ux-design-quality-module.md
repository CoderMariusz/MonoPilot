# Quality Module - UX Design Specification

**Epic:** 6 - Quality Control & Compliance
**Stories:** 6.1+ (QA Status, NCRs, Testing, CoAs)
**Based on:** Shared UI Design System

---

## 🔗 SHARED UI SYSTEM INTEGRATION

Quality Module integrates with [Shared UI Design System](./ux-design-shared-system.md).

**Applied Components:**
- ✅ **ModuleHeader**: Quality | QA Status | Testing | NCRs | CoAs | ⚙️
- ✅ **Stats Cards**: 4 cards (LPs Pending, Passed, Failed, Quarantine) - 120px, 2×2 grid
- ✅ **DataTable Base**: LP QA table, Testing results, NCR log, CoA list (sortable, filterable)
- ✅ **Colors**: app-colors.ts (green Passed, orange Pending, red Failed)
- ✅ **Mobile Responsive**: Tables → Card view on < 768px

**Quality-Specific Features:**
- 🎯 **LP QA Status Management** - Track pending/passed/failed/quarantine per LP
- 🎯 **QA Status Transitions** - Enforce state machine (pending→passed/failed/quarantine, etc.)
- 🎯 **Testing Results** - Log test parameters, results, pass/fail
- 🎯 **Non-Conformance Reports (NCRs)** - Create, investigate, close issues
- 🎯 **Certificates of Authenticity (CoAs)** - Generate, attach to shipments
- 🎯 **Quality Audit Trail** - All status changes logged with user, timestamp

**Layout:**
```
ModuleHeader: Quality│QA Status│Testing│NCRs│CoAs│⚙️      ← Shared
[Update QA Status] [Log Test] [Create NCR]                ← Shared buttons
[Stats: Pending, Passed, Failed, Quarantine]              ← Shared (4 cards)
[LP QA Table] [Testing Log] [NCR List]                    ← Quality-specific (Shared table base)
Audit trail, State transitions, Report generation         ← Quality-specific
```

---

## 1. Navigation

**Header:** Quality | **QA Status** | **Testing** | **NCRs** | **CoAs** | ⚙️
**URL:** `/quality`

---

## 2. Dashboard (`/quality`)

### Stats Cards (4)
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ PENDING      │ │ PASSED       │ │ FAILED       │ │ QUARANTINE   │
│ Count: 45    │ │ Count: 1250  │ │ Count: 8     │ │ Count: 12    │
│ %: 3.2       │ │ %: 88.6      │ │ %: 0.6       │ │ %: 0.9       │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 3. QA Status Page (`/quality/qa-status`)

### LP QA Status Table

**Columns:**
```
[Checkbox] LP # ↕ | Product | Batch | Current Status | Test Date | QC User | Actions
```

**Status Colors:**
- Pending: yellow-200
- Passed: green-200
- Failed: red-200
- Quarantine: orange-200

**Filters:**
- Status (Pending, Passed, Failed, Quarantine)
- Date Range
- Product
- Batch

**Actions:** View 👁️ | Update Status | View Audit Trail | Delete

**Update Status Modal:**
```
┌─────────────────────────────────┐
│ Update QA Status: LP-001        │
├─────────────────────────────────┤
│ Current Status: Pending         │
│ New Status: [Passed ▼]          │
│ Reason/Notes: [Optional]        │
│                                 │
│ [Enforced transitions shown]    │
│ ✓ pending → passed              │
│ ✓ pending → failed              │
│ ✓ pending → quarantine          │
│                                 │
│ [Cancel] [Update]               │
└─────────────────────────────────┘
```

---

## 4. Testing Page (`/quality/testing`)

### Test Results Table

**Columns:**
```
[Checkbox] LP # | Test Type | Result | Pass/Fail | Date | User | Actions
```

**Test Types:**
- Sensory (color, smell, texture)
- Physical (weight, dimensions)
- Chemical (pH, composition)
- Microbial (bacteria count, contamination)
- Custom (user-defined)

**Log Test Modal:**
```
┌─────────────────────────────────┐
│ Log Test Result                 │
├─────────────────────────────────┤
│ LP: [LP-001 ▼]                  │
│ Test Type: [Sensory ▼]          │
│ Parameters:                     │
│   Color: [Normal ▼]             │
│   Smell: [Fresh ▼]              │
│   Texture: [Firm ▼]             │
│ Result: [Pass ▼]                │
│ Notes: [Optional]               │
│                                 │
│ [Cancel] [Save]                 │
└─────────────────────────────────┘
```

---

## 5. NCR Page (`/quality/ncrs`)

### Non-Conformance Report List

**Columns:**
```
[Checkbox] NCR # ↕ | LP | Issue | Status ↕ | Created | Owner | Actions
```

**Status:**
- Open: red-200
- In Investigation: yellow-200
- Closed: green-200

**Create NCR Modal:**
```
┌─────────────────────────────────┐
│ Create NCR                      │
├─────────────────────────────────┤
│ LP: [LP-001 ▼]                  │
│ Issue Category:                 │
│ • Physical defect               │
│ • Contamination                 │
│ • Wrong batch                   │
│ • Other                         │
│                                 │
│ Description: [Text area]        │
│ Assigned To: [User ▼]           │
│                                 │
│ [Cancel] [Create]               │
└─────────────────────────────────┘
```

**Detail Page:**
```
NCR-001 | LP-001 | Discoloration | Status: In Investigation
Owner: John | Created: 2025-11-27 | Due: 2025-12-01

Investigation Notes:
[Timeline of investigation]

[Close NCR] [Reassign] [Add Note]
```

---

## 6. CoA Page (`/quality/coas`)

### Certificate List

**Columns:**
```
[Checkbox] CoA # | LP/SO | Issue Date | Status | Download | Actions
```

**Generate CoA Modal:**
```
┌─────────────────────────────────┐
│ Generate Certificate            │
├─────────────────────────────────┤
│ Type: [CoA ▼]                   │
│ Reference: [LP-001 or SO-123]   │
│ Format: [PDF ▼]                 │
│ Attachments:                    │
│ ☑ Test Results                  │
│ ☑ QA Sign-off                   │
│ ☑ Audit Trail                   │
│                                 │
│ [Preview] [Generate & Download] │
└─────────────────────────────────┘
```

---

## 7. Colors & Interactions

**Shared Colors:**
- Update Status: green-600
- View/Review: gray-600
- Close/Archive: red-600

**Status badge colors:**
- Pending: yellow-200
- Passed: green-200
- Failed: red-200
- Quarantine: orange-200

**Toast notifications:**
- "LP-001 QA status updated to Passed"
- "Invalid transition: Cannot go from Passed to Pending"
- "Test result logged"
- "NCR-001 closed"

---

## 8. Mobile Responsive

**< 768px:** All tables → Card view (expandable)

---

## 9. Implementation Tasks

- [ ] Create QualityHeader + StatsCards
- [ ] Create LP QA Status table + update modal
- [ ] Create Testing log form + results table
- [ ] Create NCR CRUD + detail page
- [ ] Create CoA generation + download
- [ ] Add filters, search to all tables
- [ ] Implement QA status state machine validation
- [ ] Mobile responsive (card view)
- [ ] Apply colors from app-colors.ts

---

**End - ~230 wierszy**
