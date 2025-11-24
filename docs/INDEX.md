# 📚 MonoPilot Documentation Index

**Project:** MonoPilot (Food Manufacturing ERP)
**Last Updated:** 2025-01-23
**Status:** Active Development

---

## 🎯 Quick Navigation

| You Want To... | Go To |
|----------------|-------|
| **Start coding** | [TEMPLATE_LIBRARY_INDEX.md](TEMPLATE_LIBRARY_INDEX.md) → Quick template reference |
| **Plan next sprint** | [DETAILED_BATCH_BREAKDOWN.md](DETAILED_BATCH_BREAKDOWN.md) → Stories MVP/P1/P2 |
| **Understand architecture** | [CODE_ARCHITECTURE_DOCUMENTATION.md](CODE_ARCHITECTURE_DOCUMENTATION.md) → Batch 0 |
| **Check DB schema** | [DATABASE_SCHEMA_DOCUMENTATION.md](DATABASE_SCHEMA_DOCUMENTATION.md) → All tables |
| **Debug RLS issues** | [RLS_AND_SUPABASE_CLIENTS.md](RLS_AND_SUPABASE_CLIENTS.md) → RLS policies |
| **Write tests** | [templates/template-f-test-suite-pattern.md](templates/template-f-test-suite-pattern.md) → Test patterns |

---

## 📁 Document Structure (Organized)

### 1️⃣ Planning & Context (3 core files)

- **[DETAILED_BATCH_BREAKDOWN.md](DETAILED_BATCH_BREAKDOWN.md)** ⭐ PRIMARY
  - 132 stories rozpiska MVP/P1/P2
  - Konkretne Story IDs, templates, token budgets
  - Sprint planning reference

- **[shared-templates-library.md](shared-templates-library.md)**
  - Pełna biblioteka Templates A-E
  - Full code examples & patterns

- **[epics/](epics/)** directory
  - Epic-level context (Batch Epic-N)
  - 8 epic files (epic-1-settings.md to epic-8-npd.md)

---

### 2️⃣ Code Implementation (3 core files)

- **[CODE_ARCHITECTURE_DOCUMENTATION.md](CODE_ARCHITECTURE_DOCUMENTATION.md)** ⭐ BATCH 0
  - Core architecture (1,556 lines, 31K tokens)
  - Zawsze ładowany jako Batch 0

- **[TEMPLATE_LIBRARY_INDEX.md](TEMPLATE_LIBRARY_INDEX.md)** ⭐ NEW
  - Kompaktowy indeks Templates A-H
  - Quick reference podczas kodowania

- **[DETAILED_BATCH_BREAKDOWN.md](DETAILED_BATCH_BREAKDOWN.md)**
  - Same as above (dual purpose)

---

### 3️⃣ Database & Helpers (3 files)

- **[DATABASE_SCHEMA_DOCUMENTATION.md](DATABASE_SCHEMA_DOCUMENTATION.md)**
  - Complete DB schema, tables, RLS policies

- **[DEVELOPMENT_HELPER_GUIDE.md](DEVELOPMENT_HELPER_GUIDE.md)**
  - Practical dev guides & troubleshooting

- **[RLS_AND_SUPABASE_CLIENTS.md](RLS_AND_SUPABASE_CLIENTS.md)**
  - RLS policy reference & client usage

---

### 4️⃣ Templates Library (3 new templates)

- **[templates/template-f-test-suite-pattern.md](templates/template-f-test-suite-pattern.md)** ⭐ NEW
  - Unit tests pattern (3,500 tokens savings per story)

- **[templates/template-g-dashboard-pattern.md](templates/template-g-dashboard-pattern.md)** ⭐ NEW
  - Dashboard pattern (6,000 tokens savings per story)

- **[templates/template-h-transaction-workflow.md](templates/template-h-transaction-workflow.md)** ⭐ NEW
  - Transaction workflow pattern (7,500 tokens savings per story)

---

### 5️⃣ Additional Reference (keep as-is)

- `API_CONTRACTS_DOCUMENTATION.md` - API specs
- `ux-design-*.md` - UX design references
- `test-design-system.md` - Testing strategy
- `ci.md`, `ci-secrets-checklist.md` - CI/CD setup

---

## 🚀 Development Workflow

### Step 1: Wybierz Story z Batcha
```markdown
Sprawdź: DETAILED_BATCH_BREAKDOWN.md
Przykład: Batch 6 MVP → Story 6.1 (LP QA Status Management)
```

### Step 2: Załaduj Context
```bash
/bmad:bmm:workflows:dev-story 6-1

# Auto-loads:
# 1. Batch 0: CODE_ARCHITECTURE_DOCUMENTATION.md (31K tokens)
# 2. Epic 6: epics/epic-6-quality.md (14K tokens)
# 3. Story 6.1: stories/story-6-1.md (10K tokens)
# Total: ~55K tokens (72% under 200K limit)
```

### Step 3: Sprawdź Template
```markdown
Check: TEMPLATE_LIBRARY_INDEX.md
Story 6.1 → Custom (no standard template)
Story 6.6 → Template A (CRUD)
```

### Step 4: Implementuj
```typescript
// Reference template z TEMPLATE_LIBRARY_INDEX.md
// Napisz TYLKO customizations (nie przepisuj całego template!)
```

### Step 5: Dodaj Testy
```typescript
// Reference: templates/template-f-test-suite-pattern.md
describe('Service', () => {
  it('should do something', async () => { /* ... */ })
})
```

---

## 📊 Project Stats

```
Total Stories: 132 (across 8 epics)
Total Token Budget: 581,000 tokens (83% reduction vs no templates)
Total Effort: 145 days (29 weeks)
Template Coverage: 222 stories (84% reuse rate)
Token Savings: 1,247,500 tokens across project
```

---

## 📝 Files Removed (Cleanup 2025-01-23)

Usunięte duplikaty i przestarzałe:
- ~~MASTER_BATCH_PLAN_MVP_P1_P2.md~~ → Replaced by DETAILED_BATCH_BREAKDOWN.md
- ~~FINAL_SUMMARY_TEMPLATES_AND_BATCHES.md~~ → Merged into INDEX.md
- ~~story-context-optimization-plan.md~~ → Implemented
- ~~story-context-batch-summary.md~~ → Redundant

---

**END OF INDEX**

*Wszystko co potrzebujesz do kodowania MonoPilot znajduje się w tym indexie.* 🚀
