# master.bmad.md

> Plik **master/orchestrator** w stylu BMAD: prowadzi po dokumentach w `docs/`, definiuje workflow, bramki jakości oraz minimalne dyrektywy BMAD (komentarze HTML), które pozwalają runnerowi wyłapać include/gate/checklist/task.

## 0) Metadane
- Projekt: **MonoPilot MES — Documentation Control**
- Repo docroot: `docs/`
- Język: **PL**

## 1) Spis treści (artefakty)
- [01_SYSTEM_OVERVIEW.md](./01_SYSTEM_OVERVIEW.md)
- [02_BUSINESS_PROCESS_FLOWS.md](./02_BUSINESS_PROCESS_FLOWS.md)
- [03_APP_GUIDE.md](./03_APP_GUIDE.md)
- [04_PLANNING_MODULE.md](./04_PLANNING_MODULE.md)
- [05_PRODUCTION_MODULE.md](./05_PRODUCTION_MODULE.md)
- [06_TECHNICAL_MODULE.md](./06_TECHNICAL_MODULE.md)
- [07_WAREHOUSE_AND_SCANNER.md](./07_WAREHOUSE_AND_SCANNER.md)
- [08_SETTINGS_AND_CONFIG.md](./08_SETTINGS_AND_CONFIG.md)
- [09_DATABASE_SCHEMA.md](./09_DATABASE_SCHEMA.md)
- [10_AI_HELPER_GUIDE.md](./10_AI_HELPER_GUIDE.md)
- [11_DOCUMENTATION_AUDIT.md](./11_DOCUMENTATION_AUDIT.md)
- [12_NIESPOJNOSCI_FIX_CHECKLIST.md](./12_NIESPOJNOSCI_FIX_CHECKLIST.md)
- Agenci: [architecture.agent.md](./architecture.agent.md), [qa.agent.md](./qa.agent.md)
- Zadania: [TODO.md](./TODO.md)

## 2) Minimalne dyrektywy BMAD (propozycja)
Dyrektywy w formie komentarzy HTML — czytelne dla ludzi, parsowalne przez runnera:

- **Include** sekcji z innego pliku:
  ```html
  <!-- bmad:include path="./09_DATABASE_SCHEMA.md#4-klucze-indeksy-ograniczenia" -->
  ```
- **Gate** (bramka jakości do zaliczenia przed merge):
  ```html
  <!-- bmad:gate id="QG-DB" requires="09_DATABASE_SCHEMA.md#4-klucze-indeksy-ograniczenia" -->
  ```
- **Checklist** (odwołanie do listy kontrolnej):
  ```html
  <!-- bmad:checklist ref="./12_NIESPOJNOSCI_FIX_CHECKLIST.md#10-1-kontrakt-ui-↔-db" -->
  ```
- **Task** (zadanie powiązane z TODO):
  ```html
  <!-- bmad:task id="T3" ref="./TODO.md#t3--tomoves-na-location" -->
  ```

> Jeśli nie masz runnera: same linki Markdown działają. Dyrektywy są opcjonalne i nieszkodliwe.

## 3) Workflow (kolejność działań)
1. **Audit Sync** – uruchom P0 z `12_NIESPOJNOSCI_FIX_CHECKLIST.md`. <!-- bmad:gate id="QG-AUDIT" requires="./12_NIESPOJNOSCI_FIX_CHECKLIST.md#1-priorytety-p0-blokujące" -->
2. **Migrations** – wykonaj migracje z `09_DATABASE_SCHEMA.md#9-backlog-migracji-p0`. <!-- bmad:task id="T-MIG" ref="./09_DATABASE_SCHEMA.md#9-backlog-migracji-p0" -->
3. **Refactor UI/API** – PO/TO/WO zgodnie z `03_APP_GUIDE.md` i kontraktami ze schematu. <!-- bmad:gate id="QG-UI" requires="./03_APP_GUIDE.md#8-checklisty-qa--akceptacja" -->
4. **Features** – ASN prefill + Scanner E2E + KPI. <!-- bmad:task id="T-FEAT" ref="./TODO.md#p1" -->
5. **Docs Sync** – aktualizacja `15_DOCUMENTATION_AUDIT.md` i odhaczanie checklist. <!-- bmad:checklist ref="./11_DOCUMENTATION_AUDIT.md#5-checklisty-akceptacyjne" -->

## 4) Bramki jakości (Quality Gates)
- **QG‑DB**: zgodność nazw, FK/indeksy, RLS → `09_DATABASE_SCHEMA.md`.
- **QG‑UI**: zgodność Page↔API↔DB → `03_APP_GUIDE.md`.
- **QG‑PROC**: E2E flow (PO/TO/WO/Receive/Trace) → `02_BUSINESS_PROCESS_FLOWS.md`.
- **QG‑TECH**: BOM/routing/linie/UoM/1:1 → `06_TECHNICAL_MODULE.md`.
- **QG‑WH**: Receive/Moves/Split/Merge/Pack → `07_WAREHOUSE_AND_SCANNER.md`.

## 5) Kontrakt nazewniczy (normatywny)
- **Tabela** `bom` (nie `boms`); `bom.line_id int[] null`.
- **PO**: `currency`, `due_date`, `created_by/approved_by`.
- **WO**: `line_id`, `bom_id`, `actual_start/end`; snapshot BOM.

## 6) Role i agenci
- **Architecture Agent** → `architecture.agent.md`: spójność architektury, migracje, indeksy, RLS, decyzje domenowe.
- **QA Agent** → `qa.agent.md`: strategia testów, checklisty, kryteria wyjścia, a11y, E2E.

## 7) Notatki
- Zmiany w DB muszą aktualizować `09_DATABASE_SCHEMA.md` i mieć migracje.
- Zmiany w UI/API muszą przejść bramkę **QG‑UI**.
- Każdy task w `TODO.md` linkuje do sekcji w dokumentach źródłowych.

