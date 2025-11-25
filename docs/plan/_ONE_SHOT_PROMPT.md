# ONE-SHOT PROMPT dla Cursor (Plan Mode)

Skopiuj poniższy prompt i dostosuj sekcję INPUT, a następnie uruchom w Cursor Plan Mode.

---

## ROLE

Jesteś Plan Composer dla repo MonoPilot (Next.js 15 + Supabase, RLS ON, Filament-style UI). 

Twoim zadaniem jest wygenerować gotowy plan (Markdown) według szablonu `docs/plan/_template-plan-standard.md` i zapisać go w `docs/plan/`.

## CONSTRAINTS (domyślne, dodaj do planu)

- RLS ON dla wszystkich tabel/operacji
- UI: Filament-style (Create/Edit/List, Columns, Filters)
- Plan = bez kodu; tylko kroki, kontrakty, testy, DoD
- Conventional Commits w PR
- Zwięźle, jednoznacznie, realne ścieżki plików

## TEMPLATE — SEKCJE DO WYPEŁNIENIA

1. **Front-matter** (YAML)
2. **Brief** (użyj dokładnie moich 5 zdań)
3. **Constraints** (scal domyślne + moje, jeśli podałem)
4. **Notes** (jeśli podałem)
5. **Impact Analysis**
6. **File Plan** (frontend/api/sql z realnymi ścieżkami)
7. **DB & RLS** (migracje up/down, polityki read/write)
8. **Contracts** (DTO/Zod/types, endpointy, enumy)
9. **Algorithm / Flow**
10. **Tests First** (unit/integration/UI + edge cases)
11. **DoD** (testy zielone, tsc clean, RLS działa, Filament-style, CC commits)
12. **Risks & Notes**
13. **Links**

## NAMING — GDZIE ZAPISAĆ PLIK

**Ścieżka:** `docs/plan/`

**Nazwa:** `NNN--module--slug--pX.md`

- `NNN` = plan_number (np. 003)
- `module` = podane lub wywnioskowane z tematu (jeden z: `PLAN|TECH|PROD|WH|SCN|QA|SET`)
- `slug` = kebab-case z tytułu (max 6 słów)
- `pX` = priorytet `p0|p1|p2` (podany lub wywnioskowany)

**Zapisz plik na dysk w powyższej ścieżce.**

## FRONT-MATTER — WZÓR (wypełnij danymi)

```yaml
---
id: <NNN>
title: <TITLE>
module: <MODULE>
priority: <P0|P1|P2>
owner: @mariusz
status: draft
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
tags: [auto, rls-on, next15, supabase, filament-style]
---
```

## MODUŁY (module)

- `PLAN` - Planowanie i zarządzanie
- `TECH` - Technical/BOM
- `PROD` - Produkcja
- `WH` - Magazyn (Warehouse)
- `SCN` - Scanner/Terminal
- `QA` - Quality Assurance
- `SET` - Ustawienia (Settings)

## PRIORYTETY (priority)

- `P0` - Krytyczny, blokujący (must have)
- `P1` - Ważny (should have)
- `P2` - Nice to have (could have)

---

## INPUT (wypełnij tylko to; resztę zrobi Cursor)

```yaml
plan_number: <NNN>
title_one_liner: <jeden krótki tytuł>
task_5_sentences: |
  <Dokładnie 5 zdań opisujących co trzeba zrobić.
  Każde zdanie powinno być konkretne i actionable.
  Unikaj ogólników.
  Opisz co, dlaczego i jak.
  Określ kryterium sukcesu.>

module: <PLAN|TECH|PROD|WH|SCN|QA|SET> # opcjonalne, jeśli puste — wywnioskuj
priority: <P0|P1|P2> # opcjonalne, jeśli puste — wywnioskuj

ui_inputs: # opcjonalne, przykład poniżej
  - "orderNo:string:required"
  - "supplier:ref:required"
  - "eta:date"
  - "status:enum(draft,active,archived):required"

constraints: # opcjonalne
  - "bez migracji schematu"
  - "re-use tabeli production_outputs"

notes: # opcjonalne
  - "zachowaj nazwy kolumn jak w Filament Lists"
  - "ważny wydajnościowo agregat"
```

---

## ACTION (co ma zrobić Cursor)

1. Utwórz nazwę pliku z wejścia (zgodnie z regułami)
2. Wygeneruj pełen plan z sekcjami wg `_template-plan-standard.md`
   - Brief = moje 5 zdań
   - Constraints = domyślne + moje
   - Notes = moje
   - Reszta = wypełniona zgodnie z logiką zadania
3. Zapisz jako Markdown w `docs/plan/<NNN>--<module>--<slug>--pX.md`
4. Nic więcej nie wypisuj poza zawartością pliku

---

## PRZYKŁAD UŻYCIA

```yaml
plan_number: 003
title_one_liner: Work Orders — kolumny Made/Progress + agregacja z production_outputs
task_5_sentences: |
  Dodaj widoczne w liście WO kolumny Made i Progress.
  Progress licz jako procent wykonania względem planned_qty.
  Agreguj dane z production_outputs po wo_id z uwzględnieniem RLS.
  Nie zmieniaj schematu DB w tej iteracji.
  Zapewnij testy i DoD zgodnie ze standardem.

module: PROD
priority: P0

ui_inputs:
  - "woId:string:required"
  - "plannedQty:number:required"
  - "madeQty:number:readonly"
  - "progressPct:number:readonly"

constraints:
  - "RLS ON"
  - "bez migracji schematu"

notes:
  - "pasek procentowy w kolumnie Table"
  - "edge case: plannedQty=0 → progress=0"
```

**Wynikowy plik:** `docs/plan/003--PROD--wo-made-progress-columns--p0.md`

---

## TIPS

- **5 zdań w Brief** = najbardziej istotne; to one trafiają do planu 1:1
- **Constraints** = co MUSI być zachowane (RLS, style, bez zmian DB)
- **Notes** = dodatkowe wskazówki techniczne lub biznesowe
- **ui_inputs** = pomaga określić kontrakt UI (jakie pola, typy, wymagania)
- Jeśli nie wiesz jaki `module` lub `priority` → pozostaw puste, Cursor wywnioskuje

---

## UWAGI

- Plan NIE zawiera kodu - tylko opis, kroki, kontrakty
- Kod powstaje w fazie implementacji (Execute Mode)
- Plan = blueprint + DoD + testy
- Każdy plan powinien być **kompletny** i **jednoznaczny**

