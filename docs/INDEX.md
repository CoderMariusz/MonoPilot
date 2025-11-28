# 📚 MonoPilot Documentation Index

**Project:** MonoPilot (Food Manufacturing ERP)
**Last Updated:** 2025-11-28
**Status:** Active Development
**Documentation Structure:** BMad Method (Major Reorganization 2025-11-28)

---

## 🎯 Quick Navigation

| You Want To... | Go To |
|----------------|-------|
| **Start coding a story** | [batches/](batches/) → Stories organized by batch with context.xml |
| **Plan next batch** | [batches/](batches/) → Batch folders with tech-spec.md |
| **Understand architecture** | [reference/code-architecture.md](reference/code-architecture.md) |
| **Check DB schema** | [reference/database-schema.md](reference/database-schema.md) |
| **Debug RLS issues** | [reference/rls-and-supabase-clients.md](reference/rls-and-supabase-clients.md) |
| **Write tests** | [templates/template-f-test-suite-pattern.md](templates/template-f-test-suite-pattern.md) |
| **Fix common errors** | [helpers/HE-code-review-common-errors.md](helpers/HE-code-review-common-errors.md) |
| **Review PRD** | [prd/](prd/) → Product requirements by module |
| **Review UX designs** | [ux-design/](ux-design/) → NEW designs (avoid *-OLD.md files) |

---

## 📁 Document Structure (2025-11-28)

### 🎯 **epics/** - Epic Documentation
**Konwencja:** `0X-nazwa.md` (01-settings, 02-technical, itd.)

9 epiców organizujących funkcjonalność:
- [01-settings.md](epics/01-settings.md) - Authentication, users, configuration
- [02-technical.md](epics/02-technical.md) - Products, BOMs, routing, traceability
- [03-planning.md](epics/03-planning.md) - Purchase orders, transfer orders, suppliers
- [04-production.md](epics/04-production.md) - Work orders, material consumption
- [05-warehouse.md](epics/05-warehouse.md) - License plates, ASN, GRN
- [06-quality.md](epics/06-quality.md) - QA status, holds, specifications, testing
- [07-shipping.md](epics/07-shipping.md) - Sales orders, picking, customers
- [08-npd.md](epics/08-npd.md) - New Product Development
- [09-performance-optimization.md](epics/09-performance-optimization.md)

### 📦 **batches/** - Implementation Batches (NEW STRUCTURE)
**Konwencja:** `0XY-nazwa/` (folder) z `tech-spec.md` + `stories/`

Każdy batch to **folder** zawierający:
```
batches/0XY-nazwa/
├── tech-spec.md              # Specyfikacja techniczna batcha
└── stories/
    ├── X.Y-nazwa.md          # Story file
    └── context/
        └── X.Y.context.xml   # Context XML dla AI
```

#### Epic 1 - Settings (REORGANIZED ✅)
| Batch | Folder | Stories | Status |
|-------|--------|---------|--------|
| 01A | [01A-auth-users/](batches/01A-auth-users/) | 1.0-1.4 (5) | ✅ Done |
| 01B | [01B-infrastructure-config/](batches/01B-infrastructure-config/) | 1.5-1.8 (4) | ✅ Done |
| 01C | [01C-master-data/](batches/01C-master-data/) | 1.9-1.11 (3) | ✅ Done |
| 01D | [01D-dashboards-ux/](batches/01D-dashboards-ux/) | 1.12-1.15 (4) | 🔄 In Progress |
| 01E | [01E-ui-redesign/](batches/01E-ui-redesign/) | 1.16-1.19 (4) | 📋 Todo |

#### Epic 2-3 (Legacy Structure - TO REORGANIZE)
- [02B-products-crud-COMPLETED.md](batches/02B-products-crud-COMPLETED.md) - Products CRUD ✅
- [02-batch-plan-optimized.md](batches/02-batch-plan-optimized.md) - BOM & Routing
- [03-batch-plan-optimized.md](batches/03-batch-plan-optimized.md) - Planning MVP

#### Epic 4 - Production (Context XML Ready)
Stories w `stories/04-*.md` z wygenerowanymi `04-*.context.xml`

📋 [Reorganization Guide](batches/REORGANIZATION-GUIDE.md)

### 📝 **stories/** - Legacy Stories Location
⚠️ **UWAGA:** Stories Epic 1 zostały przeniesione do `batches/01*/stories/`

Pozostałe stories (Epic 2-9) nadal w `stories/`:
- Epic 00 (6 stories): Cross-epic integration
- Epic 02 (24 stories): Technical module
- Epic 03 (30 stories): Planning module
- Epic 04 (20 stories): Production module + context.xml ✅
- Epic 05-07: Warehouse, Quality, Shipping

📋 [View legacy stories](stories/)

### 🔍 **review/** - Code Review Documentation
**Konwencja:** `REV-nazwa.md`

Deep analysis i findings z code review:
- [REV-stories-3-6-3-7-deep-analysis.md](review/REV-stories-3-6-3-7-deep-analysis.md)

📋 [View review index](review/index.md)

### 🛠️ **helpers/** - Development Helpers
**Konwencja:** `HE-nazwa.md`

Quick reference guides i checklists:
- [HE-development-guide.md](helpers/HE-development-guide.md) - Główny przewodnik dla devs
- [HE-code-review-common-errors.md](helpers/HE-code-review-common-errors.md) - Częste błędy

📋 [View helpers index](helpers/index.md)

### 📘 **reference/** - Technical Reference
Dokumentacja referencyjna:
- [code-architecture.md](reference/code-architecture.md) - Architektura aplikacji
- [api-contracts.md](reference/api-contracts.md) - API dokumentacja
- [database-schema.md](reference/database-schema.md) - Schemat bazy danych
- [rls-and-supabase-clients.md](reference/rls-and-supabase-clients.md) - RLS policies
- [test-design-system.md](reference/test-design-system.md) - System testowania
- [template-library-index.md](reference/template-library-index.md) - Indeks szablonów
- [implementation-summary.md](reference/implementation-summary.md) - Status implementacji

📋 [View reference index](reference/index.md)

### 🎨 **ux-design/** - UX Documentation
**⚠️ UWAGA:** Pliki z sufiksem `-OLD.md` są przestarzałe. Używaj TYLKO nowych plików!

**Aktywne pliki UX (używaj tych):**
- [ux-design-shared-system.md](ux-design/ux-design-shared-system.md) - 🌟 Wspólny design system
- [ux-design-settings-module.md](ux-design/ux-design-settings-module.md)
- [ux-design-technical-module.md](ux-design/ux-design-technical-module.md)
- [ux-design-production-module.md](ux-design/ux-design-production-module.md)
- [ux-design-warehouse-module.md](ux-design/ux-design-warehouse-module.md)
- [ux-design-quality-module.md](ux-design/ux-design-quality-module.md)
- [ux-design-shipping-module.md](ux-design/ux-design-shipping-module.md)
- [ux-design-npd-module.md](ux-design/ux-design-npd-module.md)
- [ux-design-planning-po-module.md](ux-design/ux-design-planning-po-module.md)
- [ux-design-planning-to-module.md](ux-design/ux-design-planning-to-module.md)
- [ux-design-planning-wo-spreadsheet.md](ux-design/ux-design-planning-wo-spreadsheet.md)
- [ux-design-detail-page-pattern.md](ux-design/ux-design-detail-page-pattern.md)
- [ux-design-modal-crud-pattern.md](ux-design/ux-design-modal-crud-pattern.md)
- [ux-design-subroute-strategy.md](ux-design/ux-design-subroute-strategy.md)

**Przestarzałe pliki (NIE używaj bez akceptacji):**
- ❌ `*-OLD.md` - Stare wersje, tylko w ostateczności za zgodą

### 🎯 **prd/** - Product Requirements
PRD documentation organizowane według modułów:
- [prd/modules/settings.md](prd/modules/settings.md)
- [prd/modules/technical.md](prd/modules/technical.md)
- [prd/modules/planning.md](prd/modules/planning.md)
- ... (9 modułów)

### 🏗️ **architecture/** - Architecture Documentation
Dokumentacja architektury i wzorców:
- [architecture/modules/](architecture/modules/) - Architektura modułów
- [architecture/patterns/](architecture/patterns/) - Wzorce (API, DB, Security)

### 📐 **templates/** - Code Templates
Reusable code templates i patterns:
- [templates/context/template-a-crud-pattern.md](templates/context/template-a-crud-pattern.md)
- [templates/template-f-test-suite-pattern.md](templates/template-f-test-suite-pattern.md)
- [templates/template-g-dashboard-pattern.md](templates/template-g-dashboard-pattern.md)
- [templates/template-h-transaction-workflow.md](templates/template-h-transaction-workflow.md)

### 📊 **meta/** - Meta Documentation
CI/CD, retrospectives, readiness assessments:
- [meta/sprint-status.yaml](meta/sprint-status.yaml) - Sprint tracking
- [meta/ci.md](meta/ci.md) - CI/CD documentation
- [meta/bmm-readiness-assessment.md](meta/bmm-readiness-assessment.md)
- [meta/retrospectives/](meta/retrospectives/) - Sprint retrospectives
- [meta/readiness-assessment/](meta/readiness-assessment/) - Project readiness

---

## 🚀 Development Workflow

### Step 1: Wybierz Story z Batcha
```bash
# Dla Epic 1 (nowa struktura):
ls docs/batches/01A-auth-users/stories/

# Dla Epic 2-4 (stara struktura):
ls docs/stories/04-*.md
```

### Step 2: Załaduj Tech-Spec i Context
```bash
# Tech-spec batcha (architektura, API, DB)
cat docs/batches/01A-auth-users/tech-spec.md

# Story file
cat docs/batches/01A-auth-users/stories/1.2-user-management-crud.md

# Context XML (dla AI agent)
cat docs/batches/01A-auth-users/stories/context/1.2.context.xml
```

### Step 3: Sprawdź UX Design
```bash
# Shared design system (ZAWSZE sprawdź najpierw)
cat docs/ux-design/ux-design-shared-system.md

# Module-specific design
cat docs/ux-design/ux-design-settings-module.md
```

### Step 4: Implementuj
```typescript
// Follow patterns from tech-spec.md
// Reference context.xml for AI-assisted development
// Use ux-design for UI specifications
```

### Step 5: Review & Merge
```bash
# Update sprint-status.yaml
# Create PR with story reference
```

---

## 📊 Project Stats

```
Total Epics: 9
Total Stories: ~100 (across all epics)
  - Epic 1: 20 stories (reorganized into 5 batches)
  - Epic 4: 20 stories (context.xml ready)
  - Epic 2-3: ~50 stories (legacy structure)
Total Batches: 5 (Epic 1) + legacy batches
Context XML Coverage: Epic 1 (100%), Epic 4 (100%)
Documentation Structure: BMad Method + Modular Batches
```

---

## 🔄 Recent Changes (2025-11-28)

### Major Batch Reorganization
✅ **Epic 1 Batches:** 5 nowych folderów z modularną strukturą
  - `01A-auth-users/` (stories 1.0-1.4)
  - `01B-infrastructure-config/` (stories 1.5-1.8)
  - `01C-master-data/` (stories 1.9-1.11)
  - `01D-dashboards-ux/` (stories 1.12-1.15)
  - `01E-ui-redesign/` (stories 1.16-1.19)

✅ **Tech-Spec per Batch:** Każdy batch ma własny `tech-spec.md`
✅ **Context XML:** 40 plików context.xml (20 Epic 1 + 20 Epic 4)
✅ **UX Design:** Nowe pliki design, stare oznaczone `-OLD.md`

### Removed
❌ **docs/batches/01B-settings-mvp.md** - Zastąpione folderami 01A-01E
❌ **docs/batches/01B-tech-spec.md** - Zastąpione per-batch tech-spec
❌ **docs/stories/01-*.md** - Przeniesione do batches/01*/stories/

### Previous Changes (2025-11-24)
✅ Zmieniono nazwy epics z `epic-X-` na `0X-` format
✅ Wyodrębnione `review/`, `helpers/`, `reference/`, `meta/`

---

## 🏷️ Naming Conventions

### Epic Files
Format: `0X-nazwa.md`
Przykład: `01-settings.md`, `02-technical.md`

### Batch Folders (NEW)
Format: `0XY-nazwa/` (folder)
Przykład: `01A-auth-users/`, `01B-infrastructure-config/`

Struktura wewnętrzna:
```
0XY-nazwa/
├── tech-spec.md
└── stories/
    ├── X.Y-nazwa.md
    └── context/
        └── X.Y.context.xml
```

### Story Files (in batches)
Format: `X.Y-nazwa.md` + `X.Y.context.xml`
Przykład: `1.2-user-management-crud.md` + `1.2.context.xml`

### Story Files (legacy - in stories/)
Format: `0X-Y-nazwa.md` + `0X-Y-nazwa.context.xml`
Przykład: `04-1-production-dashboard.md` + `04-1-production-dashboard.context.xml`

### UX Design Files
Format: `ux-design-nazwa-module.md`
**⚠️ Pliki `-OLD.md` są przestarzałe - NIE używać bez akceptacji!**

### Review Files
Format: `REV-nazwa.md`

### Helper Files
Format: `HE-nazwa.md`

---

**END OF INDEX**

*Modular batch structure + Context XML = AI-ready documentation!* 🚀
