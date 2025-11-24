# 📚 MonoPilot Documentation Index

**Project:** MonoPilot (Food Manufacturing ERP)
**Last Updated:** 2025-11-24
**Status:** Active Development
**Documentation Structure:** BMad Method (Reorganized 2025-11-24)

---

## 🎯 Quick Navigation

| You Want To... | Go To |
|----------------|-------|
| **Start coding a story** | [stories/](stories/) → All stories with context.xml |
| **Plan next batch** | [batches/](batches/) → Batch plans & tech specs |
| **Understand architecture** | [reference/code-architecture.md](reference/code-architecture.md) |
| **Check DB schema** | [reference/database-schema.md](reference/database-schema.md) |
| **Debug RLS issues** | [reference/rls-and-supabase-clients.md](reference/rls-and-supabase-clients.md) |
| **Write tests** | [templates/template-f-test-suite-pattern.md](templates/template-f-test-suite-pattern.md) |
| **Fix common errors** | [helpers/HE-code-review-common-errors.md](helpers/HE-code-review-common-errors.md) |
| **Review PRD** | [prd/](prd/) → Product requirements by module |
| **Review UX designs** | [ux-design/](ux-design/) → UX documentation |

---

## 📁 New Document Structure (2025-11-24)

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

### 📝 **stories/** - User Stories + Context
**Konwencja:** `0X-Y-nazwa.md` + `0X-Y-nazwa.context.xml`
- **0X**: Epic number (00-09)
- **Y**: Story number within epic
- **nazwa**: Short descriptive name

**78 stories** organized by epic:
- Epic 00 (6 stories): Cross-epic integration stories
- Epic 01 (15 stories): Settings module
- Epic 02 (24 stories): Technical module
- Epic 03 (10 stories): Planning module
- Epic 04 (5 stories): Production module
- Epic 05 (7 stories): Warehouse module
- Epic 06 (5 stories): Quality module
- Epic 07 (5 stories): Shipping module

📋 [View complete stories index](stories/index.md)

### 📦 **batches/** - Implementation Batches
**Konwencja:** `0XB-nazwa.md` + `0XB-tech-spec.md`

Batches grupują stories dla efektywnej implementacji:
- [01B-settings-mvp.md](batches/01B-settings-mvp.md) - Settings MVP
- [02B-products-crud.md](batches/02B-products-crud-COMPLETED.md) - Products CRUD ✅
- [02C-bom-management.md](batches/02-batch-plan-optimized.md) - BOM & Routing
- [02E-traceability.md](batches/02E-traceability-status.md) - Traceability
- [03B-orders-mvp.md](batches/03-batch-plan-optimized.md) - Planning MVP

Tech specs per batch: `0XB-tech-spec.md`

📋 [View complete batches index](batches/index.md)

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
Projekty UX dla wszystkich modułów:
- [ux-design-settings-module.md](ux-design/ux-design-settings-module.md)
- [ux-design-technical-module.md](ux-design/ux-design-technical-module.md)
- [ux-design-planning-module.md](ux-design/ux-design-planning-module.md)
- ... (11 plików UX)

📋 [View UX design index](ux-design/index.md)

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

### Step 1: Wybierz Story
```bash
# Sprawdź batch plan
cat docs/batches/03-batch-plan-optimized.md

# Wybierz story z MVP traku
# Przykład: 03-6 (Transfer Order CRUD)
```

### Step 2: Załaduj Story Context
```bash
# Przeczytaj story
cat docs/stories/03-6-to-crud.md

# Załaduj context.xml (tech spec)
cat docs/stories/03-6-to-crud.context.xml
```

### Step 3: Sprawdź Template
```bash
# Story 03-6 używa Template A (CRUD)
cat docs/templates/context/template-a-crud-pattern.md
```

### Step 4: Sprawdź Helper Guides
```bash
# Development best practices
cat docs/helpers/HE-development-guide.md

# Unikaj typowych błędów
cat docs/helpers/HE-code-review-common-errors.md
```

### Step 5: Implementuj
```typescript
// Follow template pattern
// Reference tech spec (context.xml)
// Use helper guide for best practices
```

### Step 6: Review
```bash
# Przed PR sprawdź checklist w helper guide
# Oznacz story jako "review" w sprint-status.yaml
```

---

## 📊 Project Stats

```
Total Epics: 9
Total Stories: 78 (57 .md files + 47 .context.xml files)
Total Batches: 5+ (organized by epic)
Template Coverage: High reuse rate
Documentation Structure: BMad Method compliant
```

---

## 🔄 Recent Changes (2025-11-24)

### Major Reorganization
✅ **Epics:** Zmieniono nazwy z `epic-X-` na `0X-` format
✅ **Stories:** Wszystkie stories przeniesione do `stories/` z formatem `0X-Y-`
✅ **Batches:** Wyodrębnione do `batches/` z formatem `0XB-`
✅ **Review:** Nowy katalog `review/` z prefiksem `REV-`
✅ **Helpers:** Nowy katalog `helpers/` z prefiksem `HE-`
✅ **Reference:** Dokumentacja techniczna w `reference/`
✅ **UX Design:** Projekty UX w `ux-design/`
✅ **Meta:** CI/CD i meta docs w `meta/`

### Removed
❌ **sprint-artifacts/** - Zawartość przeniesiona do odpowiednich katalogów
❌ **retrospectives/** - Przeniesione do `meta/retrospectives/`
❌ **readiness-assessment/** - Przeniesione do `meta/readiness-assessment/`

---

## 🏷️ Naming Conventions

### Epic Files
Format: `0X-nazwa.md`
Przykład: `01-settings.md`, `02-technical.md`

### Story Files
Format: `0X-Y-nazwa.md` + `0X-Y-nazwa.context.xml`
Przykład: `03-6-to-crud.md` + `03-6-to-crud.context.xml`

### Batch Files
Format: `0XB-nazwa.md` + `0XB-tech-spec.md`
Przykład: `03B-orders-mvp.md` + `03B-tech-spec.md`

### Review Files
Format: `REV-nazwa.md`
Przykład: `REV-stories-3-6-3-7-deep-analysis.md`

### Helper Files
Format: `HE-nazwa.md`
Przykład: `HE-development-guide.md`

---

**END OF INDEX**

*Nowa struktura dokumentacji BMad Method - wszystko uporządkowane i łatwe do znalezienia!* 🚀
