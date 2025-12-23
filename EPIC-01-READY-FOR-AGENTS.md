# ✅ EPIC 01 SETTINGS - GOTOWE DLA AGENTÓW

**Data:** 2025-12-23
**Branch:** `feature/settings-v2-rebuild`
**Status:** ✅ Setup Complete - Ready for Agent Execution

---

## 🎯 CO ZOSTAŁO ZROBIONE

### **1. Struktura Katalogów**
```
✅ apps/frontend/app/(authenticated)/settings-v2/
   ├── 18 subdirectories created (organization, users, locations, etc.)
   └── README.md with agent rules

✅ apps/frontend/components/settings-v2/
   ├── 11 subdirectories created (shared, users, warehouses, etc.)
   └── Ready for component creation

✅ Archiwum v1 (read-only reference):
   ├── app/(authenticated)/_archive-settings-v1-DO-NOT-TOUCH/
   ├── components/_archive-settings-v1-DO-NOT-TOUCH/
   └── README.md z ostrzeżeniami
```

### **2. Dokumentacja dla Agentów**
```
✅ docs/2-MANAGEMENT/EPIC-01-MIGRATION-PLAN.md
   └── Kompletny plan migracji (szczegółowy)

✅ docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/
   ├── README.md (index wszystkich handoffs)
   ├── 00-FOUNDATION-shared-components.yaml (6-8h)
   ├── 01-CRITICAL-locations-tree-rewrite.yaml (14-16h)
   ├── 02-CRITICAL-allergens-custom-rewrite.yaml (10-12h)
   ├── 03-CRITICAL-tax-codes-effective-dates.yaml (8-10h)
   ├── 04-users-actions-menu.yaml (8-10h)
   ├── 05-machines-2nd-row-maintenance.yaml (8-10h)
   └── 06-production-lines-machine-flow.yaml (8-10h)

✅ docs/2-MANAGEMENT/epics/current/01-settings/
   ├── AGENT-START-HERE.md (quick start)
   └── MASTER-PROMPT-FOR-AGENTS.md (copy-paste ready)
```

### **3. Narzędzia Weryfikacyjne**
```
✅ scripts/check-settings-v2-isolation.sh
   └── Sprawdza izolację (zero importów z v1)
```

### **4. Git Setup**
```
✅ Branch: feature/settings-v2-rebuild (created)
✅ Tag: settings-v1-backup-YYYYMMDD-HHMM (created)
✅ Commits: 2 commits (setup + docs)
```

---

## 🚀 JAK WYSTARTOWAĆ AGENTÓW

### **OPCJA 1: Ręcznie (przez Claude Code)**

#### **Krok 1: Pierwszego Agenta (Foundation)**
```yaml
# Skopiuj i wklej do Claude Code:

Przeczytaj plik:
docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/00-FOUNDATION-shared-components.yaml

Wykonaj zadanie zgodnie z tym handoff file.

WAŻNE:
- Twórz pliki TYLKO w: apps/frontend/components/settings-v2/shared/
- NIE edytuj plików w: app/(authenticated)/settings/ (v1 frozen)
- NIE importuj z: @/components/settings/ (używaj settings-v2/)
- Zbuduj 9 shared components według specyfikacji

Po zakończeniu uruchom:
bash scripts/check-settings-v2-isolation.sh
```

#### **Krok 2: Drugiego Agenta (Locations Tree)**
```yaml
# Po zakończeniu Foundation, uruchom:

Przeczytaj plik:
docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/01-CRITICAL-locations-tree-rewrite.yaml

Wykonaj zadanie zgodnie z tym handoff file.

KRYTYCZNE:
- To COMPLETE REWRITE (v1 ma flat table, v2 potrzebuje tree)
- NIE kopiuj UI z v1 code (zły design)
- Zbuduj tree view według SET-014 wireframe
- Update lib/validation/location-schemas.ts (zmień typy)

Estimated: 14-16 godzin (najtrudniejszy ekran)
```

#### **Krok 3: Trzeci Agent (Allergens)**
```yaml
Przeczytaj plik:
docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/02-CRITICAL-allergens-custom-rewrite.yaml

V1 jest READ-ONLY, v2 potrzebuje custom CRUD + multi-language!
```

---

### **OPCJA 2: Automatycznie (batch launch)**

```bash
# Launch wszystkich agentów po kolei:

# Agent 1: Foundation
claude-agent --handoff docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/00-FOUNDATION-shared-components.yaml

# Po zakończeniu Agent 1, launch Agent 2:
claude-agent --handoff docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/01-CRITICAL-locations-tree-rewrite.yaml

# Etc...
```

---

## 📋 KOLEJNOŚĆ WYKONANIA

### **Faza 1: Foundation (MUST DO FIRST)**
```
1. Handoff: 00-FOUNDATION-shared-components.yaml
   Agent: frontend-dev
   Effort: 6-8h
   Output: 9 shared components
   Blocks: ALL other work

   ✅ Start immediately
```

### **Faza 2: Critical Rewrites (DO EARLY)**
```
2. Handoff: 01-CRITICAL-locations-tree-rewrite.yaml
   Agent: frontend-dev
   Effort: 14-16h
   Output: Location tree view
   Priority: HIGHEST (waliduje approach)

   ✅ Start after Foundation complete

3. Handoff: 02-CRITICAL-allergens-custom-rewrite.yaml
   Agent: frontend-dev
   Effort: 10-12h
   Output: Allergen management
   Can run: In parallel with Locations

4. Handoff: 03-CRITICAL-tax-codes-effective-dates.yaml
   Agent: frontend-dev
   Effort: 8-10h
   Output: Tax codes with dates
   Can run: In parallel with above
```

### **Faza 3: Core Refactors (MEDIUM PRIORITY)**
```
5-6. Users, Machines, Production Lines
   Handoffs: 04, 05, 06
   Can run: In parallel (independent)
   Effort: 8-10h each
```

### **Faza 4: Pozostałe (TODO - handoffs will be created)**
```
7. Warehouses (migrate + activity log)
8. Modules (redesign to grouped sections)
9. Organization (verify)
10-19. New screens (API Keys, Webhooks, Audit Logs, etc.)
20. Onboarding (verify existing)
```

---

## 🛡️ ISOLATION - JAK TO DZIAŁA

### **Struktura:**
```
Old code (v1):
├── app/(authenticated)/settings/           ← FROZEN, agents NIE MOGĄ edytować
├── components/settings/                    ← FROZEN, agents NIE MOGĄ edytować
└── _archive-settings-v1-DO-NOT-TOUCH/     ← Backup, READ ONLY

New code (v2):
├── app/(authenticated)/settings-v2/        ← Agenci TUTAJ TWORZĄ
└── components/settings-v2/                 ← Agenci TUTAJ TWORZĄ

Reusable (shared):
├── lib/services/                           ← Agenci MOGĄ używać/updateować
├── lib/validation/                         ← Agenci MOGĄ używać/updateować
└── lib/hooks/                              ← Agenci MOGĄ używać/tworzyć
```

### **Jak to zapobiega konfliktom:**
- ✅ V1 kod dalej działa (users mogą używać app)
- ✅ V2 kod nie koliduje z v1 (osobne katalogi)
- ✅ Agenci nie psują istniejącego kodu
- ✅ Można testować v2 osobno (/settings-v2 route)
- ✅ Łatwy rollback (zmień symlink)
- ✅ Atomic swap (kiedy v2 ready → rename directories)

---

## 🔍 WERYFIKACJA

### **Sprawdź izolację:**
```bash
# Uruchom po każdym agencie:
bash scripts/check-settings-v2-isolation.sh

# Powinno pokazać:
✅ No v1 app imports found
✅ No v1 component imports found
✅ TypeScript compiles successfully
✅ All isolation checks passed!
```

### **Sprawdź progress:**
```bash
# Ile ekranów gotowych?
ls apps/frontend/app/\(authenticated\)/settings-v2/*/page.tsx 2>/dev/null | wc -l

# Powinno rosnąć: 0 → 1 → 2 → ... → 18+ (all screens)
```

---

## 📞 TROUBLESHOOTING

### **Problem: Agent importuje z v1**
```
Error: import { WarehouseModal } from '@/components/settings/warehouses'

Solution:
1. Przerwij agenta
2. Pokaż mu MASTER-PROMPT-FOR-AGENTS.md
3. Wyjaśnij: "Use @/components/settings-v2/ not @/components/settings/"
4. Restart task
```

### **Problem: Agent edytuje v1 kod**
```
Error: Modified apps/frontend/app/(authenticated)/settings/locations/page.tsx

Solution:
1. Git revert changes
2. Pokaż agentowi settings-v2/README.md (FORBIDDEN section)
3. Wyjaśnij: "V1 is frozen - build in settings-v2/ only"
4. Restart in correct directory
```

### **Problem: Agent myli wireframe z v1 code**
```
Symptom: Agent says "old code already has this feature"

Solution:
1. Pokaż diff między wireframe a v1 code
2. Wyjaśnij: "Wireframe is the spec, v1 may be incomplete"
3. Instruct: "Build from wireframe, not from old code"
```

---

## 🎯 KIEDY V2 JEST GOTOWE

### **Checklist przed swap:**
```
☐ All 33 wireframes mają działające UI
☐ 3 critical rewrites complete (Locations, Allergens, Tax Codes)
☐ Import audit passes (zero v1 imports)
☐ TypeScript compiles (zero errors)
☐ All tests pass
☐ Visual QA complete (wireframes vs UI)
☐ Performance OK (all pages < 1s)
☐ Manual testing complete
```

### **Atomic Swap:**
```bash
# When ready:
cd apps/frontend/app/\(authenticated\)/
mv settings settings-v1-backup
mv settings-v2 settings

git add .
git commit -m "feat(settings): atomic swap to v2 UI (33 wireframes complete)"

# Instant migration!
# Rollback = reverse rename (if bugs)
```

---

## 📊 PODSUMOWANIE

### **Gotowe:**
- ✅ Struktura katalogów settings-v2/
- ✅ V1 kod zarchiwizowany (_archive-settings-v1-DO-NOT-TOUCH/)
- ✅ 7 agent handoffs (YAML format, gotowe do użycia)
- ✅ Master prompt (copy-paste ready)
- ✅ Isolation checker (verify after each task)
- ✅ Migration plan (szczegółowy)
- ✅ Git branch + tag (rollback ready)

### **Do zrobienia:**
- ⏳ 33 wireframes → code (0/33 done)
- ⏳ Foundation shared components (start here!)
- ⏳ 3 critical rewrites (Locations, Allergens, Tax Codes)
- ⏳ Core refactors (Users, Machines, Lines, Modules)
- ⏳ 10 new screens (API Keys, Webhooks, etc.)

### **Timeline:**
- **Conservative:** 15 dni (1 agent)
- **Aggressive:** 15 dni (3 agents parallel)
- **Critical Path:** Foundation → Locations → Others

---

## 🚀 NASTĘPNY KROK

### **Uruchom pierwszego agenta:**

**Prompt:**
```
Przeczytaj i wykonaj zadanie z pliku:
docs/2-MANAGEMENT/epics/current/01-settings/agent-handoffs/00-FOUNDATION-shared-components.yaml

To jest Foundation - tworzysz 9 shared components które odblokują całą resztę pracy.

Krytyczne reguły:
- Twórz w: apps/frontend/components/settings-v2/shared/
- NIE edytuj: components/settings/ (v1 frozen)
- NIE importuj z v1 paths
- Użyj ShadCN UI jako base

Po zakończeniu uruchom:
bash scripts/check-settings-v2-isolation.sh

Estimated effort: 6-8 godzin
```

---

**Setup Time:** ~30 minut
**Agents Ready:** ✅
**First Task:** Foundation (shared components)
**Next Task:** Locations tree (critical rewrite)

**LET'S GO! 🚀**
