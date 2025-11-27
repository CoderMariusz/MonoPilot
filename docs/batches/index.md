# Epic 5: Warehouse & Scanner Module - Batches Index

**Epic:** 5 (Warehouse & Scanner)
**Total Stories:** 35 (5.1-5.36)
**Total Batches:** 7
**Total Effort:** ~255-310 hours
**Duration:** 8-10 weeks (2-person team)
**Status:** Drafted

---

## 📦 Batch Organization

Epic 5 is organized into **7 focused batches**, each with:
- Own folder: `docs/batches/05X-Y/`
- Tech spec (architecture for batch subset)
- Individual story files (one file per story)
- Context XMLs (for AI-assisted development)
- Story points: ~1200-1400 lines per batch

### Batch Grouping Strategy

| Batch | Stories | Focus | Hours | Duration |
|-------|---------|-------|-------|----------|
| **5A-1** | 5.1-5.4 | License Plate Core | 28-35 | 3-4 days |
| **5A-2** | 5.5-5.7 | LP Operations (Split/Merge/Genealogy) | 29-35 | 3-4 days |
| **5A-3** | 5.8-5.13 | Receiving Flow (ASN/GRN) | 41-51 | 5-6 days |
| **5B-1** | 5.14-5.18 | Stock Movements | 23-31 | 3-4 days |
| **5B-2** | 5.19-5.22 | Pallet Management | 20-25 | 2-3 days |
| **5C-1** | 5.23-5.27 | Scanner Core UI | 25-31 | 3-4 days |
| **5C-2** | 5.28-5.35 | Traceability, Workflows, Settings, Count | 32-41 | 4-5 days |
| **5C-3** | 5.36 | Offline Queue Management (Gap 5) | 20-25 | 2-3 days |

---

## 📂 Folder Structure

```
docs/batches/
├── index.md                          # This file - master organizer
│
├── 05A-1-lp-core/                   # License Plate Core (5.1-5.4)
│   ├── tech-spec.md                 # Architecture: LP CRUD, numbering
│   └── stories/
│       ├── 5.1-lp-creation.md
│       ├── 5.2-lp-status.md
│       ├── 5.3-lp-expiry.md
│       ├── 5.4-lp-numbering.md
│       └── context/
│           ├── 5.1.context.xml
│           ├── 5.2.context.xml
│           ├── 5.3.context.xml
│           └── 5.4.context.xml
│
├── 05A-2-lp-operations/             # LP Operations: Split/Merge/Genealogy (5.5-5.7)
│   ├── tech-spec.md
│   └── stories/
│       ├── 5.5-lp-split.md
│       ├── 5.6-lp-merge.md
│       ├── 5.7-lp-genealogy.md
│       └── context/
│           ├── 5.5.context.xml
│           ├── 5.6.context.xml
│           └── 5.7.context.xml
│
├── 05A-3-receiving/                 # Receiving Flow (5.8-5.13)
│   ├── tech-spec.md
│   └── stories/
│       ├── 5.8-asn-creation.md
│       ├── 5.9-asn-items.md
│       ├── 5.10-over-receipt.md
│       ├── 5.11-grn-creation.md
│       ├── 5.12-label-print.md
│       ├── 5.13-po-update.md
│       └── context/
│           ├── 5.8.context.xml
│           ├── 5.9.context.xml
│           ├── 5.10.context.xml
│           ├── 5.11.context.xml
│           ├── 5.12.context.xml
│           └── 5.13.context.xml
│
├── 05B-1-stock-moves/               # Stock Movements (5.14-5.18)
│   ├── tech-spec.md
│   └── stories/
│       ├── 5.14-lp-move.md
│       ├── 5.15-movement-audit.md
│       ├── 5.16-partial-move.md
│       ├── 5.17-destination-validation.md
│       ├── 5.18-movement-types.md
│       └── context/
│           ├── 5.14.context.xml
│           ├── 5.15.context.xml
│           ├── 5.16.context.xml
│           ├── 5.17.context.xml
│           └── 5.18.context.xml
│
├── 05B-2-pallets/                   # Pallet Management (5.19-5.22)
│   ├── tech-spec.md
│   └── stories/
│       ├── 5.19-pallet-creation.md
│       ├── 5.20-pallet-lp-mgmt.md
│       ├── 5.21-pallet-move.md
│       ├── 5.22-pallet-status.md
│       └── context/
│           ├── 5.19.context.xml
│           ├── 5.20.context.xml
│           ├── 5.21.context.xml
│           └── 5.22.context.xml
│
├── 05C-1-scanner-core/              # Scanner Core UI (5.23-5.27)
│   ├── tech-spec.md
│   └── stories/
│       ├── 5.23-guided-workflows.md
│       ├── 5.24-barcode-validation.md
│       ├── 5.25-feedback.md
│       ├── 5.26-operations-menu.md
│       ├── 5.27-session-timeout.md
│       └── context/
│           ├── 5.23.context.xml
│           ├── 5.24.context.xml
│           ├── 5.25.context.xml
│           ├── 5.26.context.xml
│           └── 5.27.context.xml
│
├── 05C-2-traceability-workflows/    # Traceability & Workflows (5.28-5.35)
│   ├── tech-spec.md
│   └── stories/
│       ├── 5.28-forward-trace.md
│       ├── 5.29-genealogy-recording.md
│       ├── 5.30-source-linking.md
│       ├── 5.31-settings.md
│       ├── 5.32-desktop-receive-po.md
│       ├── 5.33-desktop-receive-to.md
│       ├── 5.34-scanner-receive.md
│       ├── 5.35-inventory-count.md
│       └── context/
│           ├── 5.28.context.xml
│           ├── 5.29.context.xml
│           ├── 5.30.context.xml
│           ├── 5.31.context.xml
│           ├── 5.32.context.xml
│           ├── 5.33.context.xml
│           ├── 5.34.context.xml
│           └── 5.35.context.xml
│
└── 05C-3-offline-queue/             # Offline Queue (5.36)
    ├── tech-spec.md
    └── stories/
        ├── 5.36-offline-queue.md
        └── context/
            └── 5.36.context.xml
```

---

## 🎯 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Batch 5A-1 + 5A-2** (LP Core + Operations)
- License Plate CRUD
- Status tracking, batch/expiry management
- Split/Merge with genealogy
- **Blocker for:** Batch 5A-3, 5B-1, 5C-2

### Phase 2: Receiving (Weeks 2-3)
**Batch 5A-3** (Receiving Flow)
- ASN, GRN, PO integration
- Atomic transactions (Gap 6)
- LP genealogy atomicity (Gap 2)
- **Enables:** Batch 5C-1, 5C-2

### Phase 3: Warehouse Operations (Weeks 4-5)
**Batch 5B-1 + 5B-2** (Movements + Pallets)
- Stock move audit trail
- Pallet management
- Movement categorization
- **Parallel with:** Batch 5C-1

### Phase 4: Scanner & Advanced (Weeks 5-7)
**Batch 5C-1 + 5C-2 + 5C-3** (Scanner UI + Offline)
- Scanner guided workflows
- Traceability UI
- Desktop workflows
- Offline queue with sync (Gap 5)

---

## 📊 Effort Breakdown

| Phase | Batches | Stories | Points | Hours | Weeks |
|-------|---------|---------|--------|-------|-------|
| 1 | 5A-1, 5A-2 | 5.1-5.7 | 48 | 57-70 | 2 |
| 2 | 5A-3 | 5.8-5.13 | 41 | 41-51 | 1.5 |
| 3 | 5B-1, 5B-2 | 5.14-5.22 | 43 | 43-56 | 2 |
| 4 | 5C-1, 5C-2, 5C-3 | 5.23-5.36 | 106 | 114-133 | 3-4 |
| **Total** | **7** | **35** | **238** | **255-310** | **8-10** |

---

## 🔗 Dependencies

### Epic Dependencies
- ✅ **Epic 1**: Organizations, Users, Locations, Warehouses, Settings
- ✅ **Epic 2**: Products, BOM, Routing, Traceability
- ✅ **Epic 3**: Purchase Orders, Transfer Orders
- ⏳ **Epic 4**: Work Orders (for Batch 5C-2, 5C-3)

### Batch Dependencies
```
5A-1 (LP Core)
  ├─→ 5A-2 (LP Ops)
  │    ├─→ 5A-3 (Receiving)
  │    │    └─→ 5B-1 (Moves)
  │    │         └─→ 5C-2 (Traceability)
  │    └─→ 5C-2 (Genealogy UI)
  ├─→ 5B-1 (Moves)
  │    └─→ 5B-2 (Pallets)
  └─→ 5C-2 (Receive workflows)

5C-1 (Scanner Core)
  └─→ 5C-2 (Workflows)
      └─→ 5C-3 (Offline - consumes all operations)
```

### Parallel Tracks
- **Track A**: 5A-1 → 5A-2 → 5A-3 (sequential, foundational)
- **Track B**: 5B-1 → 5B-2 (sequential, ~2 weeks)
- **Track C**: 5C-1 + 5C-2 (parallel, ~2-3 weeks)
- **Track D**: 5C-3 (depends on C, ~1 week)

---

## 💾 Story Context Format

Each story has a `.context.xml` file with:
```xml
<story>
  <id>5.1</id>
  <title>License Plate Creation</title>
  <batch>5A-1</batch>
  <points>8</points>
  <status>todo</status>

  <dependencies>
    <epic id="1">Organizations, Users, Locations</epic>
    <epic id="2">Products with UoM</epic>
    <story id="5.1">Blocks: 5.2, 5.3, 5.5, 5.6, 5.7</story>
  </dependencies>

  <technical_context>
    <tables>license_plates, lp_number_sequence</tables>
    <api_endpoints>/api/warehouse/license-plates</api_endpoints>
    <frontend_pages>/warehouse/license-plates</frontend_pages>
  </technical_context>

  <acceptance_criteria_count>5</acceptance_criteria_count>
  <technical_tasks_count>12</technical_tasks_count>
  <test_categories>unit, integration, e2e</test_categories>
</story>
```

---

## 🚀 Getting Started

1. **Review** this index and batch you're starting
2. **Read** batch tech-spec for architecture overview
3. **Read** individual story files for detailed ACs
4. **Load** `.context.xml` into your AI assistant
5. **Code** implementing the story
6. **Test** according to story's test plan
7. **Move to next** story in batch

---

## 📝 Notes

- Each batch is **self-contained** (folder structure)
- **Tech-specs** describe database schema, APIs, services
- **Stories** detail requirements, ACs, tasks, tests
- **Context XMLs** optimize for AI-assisted development
- **Index.md** serves as single source of truth for organization

---

## References

- **Epic 5 Definition**: [docs/epics/05-warehouse.md](../epics/05-warehouse.md)
- **Gap 2** (LP Genealogy): Atomicity, FK validation, circular checks
- **Gap 5** (Offline Queue): Queue management, auto-sync, failures
- **Gap 6** (GRN+LP): Transaction atomicity, rollback on error
