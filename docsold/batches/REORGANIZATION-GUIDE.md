# Epic 5 Documentation Reorganization Guide for AI

**Purpose:** Convert monolithic story descriptions into modular batch structure

**Status:** Template for AI-assisted reorganization

---

## What to Do

Convert from OLD structure → NEW structure:

### OLD (Monolithic)
```
docs/batches/
├── 05A-tech-spec.md     (4800 lines - all LP + Receiving)
└── 05A-stories.md       (3500 lines - stories 5.1-5.13)
```

### NEW (Modular per Batch)
```
docs/batches/
├── 05A-1-lp-core/
│   ├── tech-spec.md
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
```

---

## Pattern (Example: Story 5.1)

### Step 1: Extract Story from Original File
**FROM:** `05A-stories.md` → Search "## Story 5.1: License Plate Creation"
- Copy full story section (including all ACs, tasks, tests)
- Lines: ~350-400 lines per story

### Step 2: Create Story File
**TO:** `05A-1-lp-core/stories/5.1-lp-creation.md`

**Format:**
```markdown
# Story 5.1: License Plate Creation

**ID:** 5.1
**Batch:** 5A-1
**Story Points:** 8
**Effort:** 8-10 hours
**Status:** Todo

## User Story
> As a...

## Acceptance Criteria
### AC 1: ...
...

## Technical Tasks
...

## Testing
...

## Acceptance Criteria Checklist
...

## Dependencies
...

## Notes
...
```

### Step 3: Extract Tech Details
**FROM:** Story's "Technical Tasks" section
- Get tables, APIs, components, hooks
- Get database schema (usually in first story of batch)

### Step 4: Create Context XML
**TO:** `05A-1-lp-core/stories/context/5.1.context.xml`

**Format:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<story>
  <metadata>
    <id>5.1</id>
    <title>License Plate Creation</title>
    <batch>5A-1</batch>
    <points>8</points>
    <effort_hours>8-10</effort_hours>
    <status>todo</status>
  </metadata>

  <description>Brief description</description>

  <dependencies>
    <blocks>
      <story id="5.2">LP Status Tracking</story>
      <!-- ... -->
    </blocks>
    <requires>
      <epic id="1">Organizations, Users, Locations</epic>
    </requires>
  </dependencies>

  <technical_context>
    <tables>
      <table>
        <name>license_plates</name>
        <columns>
          <!-- Extract from tech-spec -->
        </columns>
      </table>
    </tables>

    <api_endpoints>
      <!-- Extract from tech-spec -->
    </api_endpoints>

    <frontend_routes>
      <!-- Extract from tech-spec -->
    </frontend_routes>

    <components_to_create>
      <!-- Extract from technical tasks -->
    </components_to_create>
  </technical_context>

  <acceptance_criteria>
    <!-- Reference from story -->
  </acceptance_criteria>

  <test_plan>
    <!-- Extract from Testing section -->
  </test_plan>

  <implementation_notes>
    <!-- Extract key notes -->
  </implementation_notes>
</story>
```

---

## Batches to Reorganize

### Batch 5A-1: LP Core (Stories 5.1-5.4)
**From:** 05A-stories.md - Stories 5.1-5.4 section
**To:** `docs/batches/05A-1-lp-core/`

Stories:
- 5.1: License Plate Creation
- 5.2: LP Status Tracking
- 5.3: LP Batch/Expiry Tracking
- 5.4: LP Number Generation

**Tech-spec focus:** LP table schema, lp_number_sequence, API endpoints

---

### Batch 5A-2: LP Operations (Stories 5.5-5.7)
**From:** 05A-stories.md - Stories 5.5-5.7 section
**To:** `docs/batches/05A-2-lp-operations/`

Stories:
- 5.5: LP Split
- 5.6: LP Merge
- 5.7: LP Genealogy Tracking

**Tech-spec focus:** lp_genealogy table, split/merge transaction logic, circular dependency checks (Gap 2)

---

### Batch 5A-3: Receiving (Stories 5.8-5.13)
**From:** 05A-stories.md - Stories 5.8-5.13 section
**To:** `docs/batches/05A-3-receiving/`

Stories:
- 5.8: ASN Creation
- 5.9: ASN Item Management
- 5.10: Over-Receipt Validation
- 5.11: GRN and LP Creation (Atomic - Gap 6)
- 5.12: Auto-Print Labels
- 5.13: Update PO/TO Received Qty

**Tech-spec focus:** asn, grn, grn_items tables, atomic transaction (Gap 6), ZPL label generation

---

### Batch 5B-1: Stock Moves (Stories 5.14-5.18)
**From:** 05B-stories.md - Stories 5.14-5.18 section
**To:** `docs/batches/05B-1-stock-moves/`

Stories:
- 5.14: LP Location Move
- 5.15: Movement Audit Trail
- 5.16: Partial Move
- 5.17: Destination Validation
- 5.18: Movement Types

**Tech-spec focus:** stock_moves table, movement type enums, validation logic

---

### Batch 5B-2: Pallets (Stories 5.19-5.22)
**From:** 05B-stories.md - Stories 5.19-5.22 section
**To:** `docs/batches/05B-2-pallets/`

Stories:
- 5.19: Pallet Creation
- 5.20: Pallet LP Management
- 5.21: Pallet Move
- 5.22: Pallet Status

**Tech-spec focus:** pallets, pallet_items tables, status lifecycle

---

### Batch 5C-1: Scanner Core (Stories 5.23-5.27)
**From:** 05C-stories.md - Stories 5.23-5.27 section
**To:** `docs/batches/05C-1-scanner-core/`

Stories:
- 5.23: Guided Workflows
- 5.24: Barcode Validation
- 5.25: Feedback
- 5.26: Operations Menu
- 5.27: Session Timeout

**Tech-spec focus:** Scanner PWA architecture, state machines, UI components

---

### Batch 5C-2: Traceability & Workflows (Stories 5.28-5.35)
**From:** 05C-stories.md - Stories 5.28-5.35 section
**To:** `docs/batches/05C-2-traceability-workflows/`

Stories:
- 5.28: Forward/Backward Traceability
- 5.29: Genealogy Recording
- 5.30: Source Document Linking
- 5.31: Warehouse Settings
- 5.32: Desktop Receive from PO
- 5.33: Desktop Receive from TO
- 5.34: Scanner Receive Workflow
- 5.35: Inventory Count

**Tech-spec focus:** Recursive queries for traceability, UI components, workflows

---

### Batch 5C-3: Offline Queue (Story 5.36)
**From:** 05C-stories.md - Story 5.36 section
**To:** `docs/batches/05C-3-offline-queue/`

Stories:
- 5.36: Scanner Offline Queue Management (Gap 5)
  - 10 Acceptance Criteria
  - IndexedDB offline queue
  - Auto-sync on reconnect

**Tech-spec focus:** Service Worker, IndexedDB, sync engine, batch processing (Gap 5)

---

## File Structure Template

For each batch:

```
docs/batches/05X-Y-name/
├── tech-spec.md                    # ~300-500 lines
│                                    # Include: tables, APIs, services, dependencies
│
├── stories/
│   ├── 5.N-story-name.md           # ~300-500 lines per story
│   ├── 5.N+1-story-name.md
│   ├── 5.N+2-story-name.md
│   └── context/
│       ├── 5.N.context.xml         # ~400-600 lines per story
│       ├── 5.N+1.context.xml
│       └── 5.N+2.context.xml
│
└── README.md (OPTIONAL)             # Brief batch overview
```

---

## Extraction Rules

### When Extracting Story Content:

1. **Acceptance Criteria:** Copy all ACs verbatim
2. **Technical Tasks:** Extract backend/frontend/database/tests sections
3. **Tests:** Include unit, integration, E2E test plans
4. **Dependencies:** Extract from story's depends-on section
5. **Notes:** Include any implementation notes

### When Creating Tech-Spec:

1. **Tables:** Extract FROM story tech details (usually in 1st story of batch)
2. **APIs:** List endpoints from all stories in batch
3. **Services:** Extract service descriptions from technical tasks
4. **Dependencies:** Reference which epics/stories are required
5. **RLS Policies:** Add RLS policy templates for each table

### When Creating Context XML:

1. **Metadata:** Story ID, title, batch, points, hours, status
2. **Dependencies:** Which stories it blocks/requires
3. **Technical Context:** Exact table definitions, API signatures, components
4. **Validation Rules:** Extract from ACs
5. **Test Plan:** Specific test cases (not just categories)
6. **Implementation Notes:** Warnings, critical points, gotchas

---

## Naming Conventions

**Batch Folders:**
- `05A-1-lp-core` (not `05A1` or `batch-5a-1`)
- Pattern: `{epic}{batch}-{descriptor}`

**Story Files:**
- `5.1-lp-creation.md` (not `story-5.1.md` or `5-1.md`)
- Pattern: `{story-id}-{kebab-case-title}`

**Context Files:**
- `5.1.context.xml` (not `5-1.context.xml` or `context.5.1.xml`)
- Pattern: `{story-id}.context.xml`

---

## Git Workflow

For each batch:

```bash
# 1. Create batch folder structure
mkdir -p docs/batches/05X-Y-name/{stories/context}

# 2. Create tech-spec.md
# 3. Create story files (5.N-*.md)
# 4. Create context XMLs (5.N.context.xml)

# 5. Commit
git add docs/batches/05X-Y-name/
git commit -m "feat: Create Batch 05X-Y (stories 5.N-5.M)

- Add tech-spec.md (architecture for batch subset)
- Add individual story files (5.N-5.M)
- Add context XMLs for AI-assisted development
- Extract from original 05X-stories.md
"

# 6. Push
git push origin claude/create-epic-5-stories-011a5cYqZULQ6KTY8mKScV8d
```

---

## Quality Checklist

Before committing each batch:

- ✅ All stories in batch have `.md` file
- ✅ All stories have `.context.xml` file
- ✅ Tech-spec includes all tables used by batch stories
- ✅ Tech-spec includes all API endpoints used by batch stories
- ✅ Dependencies clearly marked (blocks/requires)
- ✅ No duplicated content across stories
- ✅ Naming conventions followed (kebab-case)
- ✅ Context XMLs valid XML (well-formed)
- ✅ File paths match folder structure

---

## Example: Full Batch 5A-1 Reorganization

**Input:** 05A-stories.md contains Story 5.1-5.4 (1400 lines)

**Output:**
```
docs/batches/05A-1-lp-core/
├── tech-spec.md                    (Extract: license_plates table, APIs, services)
├── stories/
│   ├── 5.1-lp-creation.md          (Extract: Story 5.1 section, ~350 lines)
│   ├── 5.2-lp-status.md            (Extract: Story 5.2 section, ~200 lines)
│   ├── 5.3-lp-expiry.md            (Extract: Story 5.3 section, ~200 lines)
│   ├── 5.4-lp-numbering.md         (Extract: Story 5.4 section, ~200 lines)
│   └── context/
│       ├── 5.1.context.xml         (Generate: from story + tech-spec, ~500 lines)
│       ├── 5.2.context.xml         (Generate: from story + tech-spec, ~400 lines)
│       ├── 5.3.context.xml         (Generate: from story + tech-spec, ~400 lines)
│       └── 5.4.context.xml         (Generate: from story + tech-spec, ~400 lines)
```

**Total:** ~1200 lines in batch folder (manageable + focused)

---

## Notes for AI

- You're NOT modifying content, just **reorganizing & modularizing**
- Keep original ACs, tasks, tests **exactly as written**
- Context XMLs are **derived from** story content + tech-spec
- Each story is **independent file** (can be worked on separately)
- Tech-spec **summarizes** technical details from all stories in batch
- Commit **per batch** (not per story)
