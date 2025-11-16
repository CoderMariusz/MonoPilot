# Brainstorming Session Results - NPD Module

**Session Date:** 2025-11-15
**Facilitator:** Business Analyst Mary
**Participant:** Mariusz

## Session Start

### Chosen Approach
**Progressive Technique Flow** - Systematyczna podróż przez 4 techniki (Divergent → Deep Dive → Convergent)

### Techniques Selected
1. **First Principles Thinking** (Creative, 15-20 min) - Fundamenty NPD w food manufacturing
2. **Six Thinking Hats** (Structured, 20-25 min) - Analiza architektury Stand-alone vs Integral
3. **SCAMPER Method** (Structured, 20-25 min) - Integracja z istniejącymi modułami
4. **Assumption Reversal** (Deep, 15-20 min) - Odblokownie MVP bez Finance/Planning modules

**Total Duration:** 70-90 minut

### Context Provided
User provided comprehensive NPD Module specification including:
- Stand-alone vs Integral architecture decision
- Benchmark analysis (Stage-Gate, PLM systems: Stage-Gate International, Sciforma, Arena, aha.io)
- Functional scope: Stage-Gate (G0-G5), formulation/recipe dev, compliance, trials, costing, DMS, handoff to production
- Database schema design (npd_projects, npd_formulations, npd_trials, npd_gate_reviews, etc.)
- API boundaries and events (NPD.SpecApproved, NPD.FormulationReady, NPD.HandoffRequested)
- Integration with existing modules (Products/BOM/WO/QA/Warehouse/Scanner)
- Role-based permissions (NPD Lead, R&D, Regulatory, Packaging, Finance, Production)
- UI/UX concepts (Filament-style dashboard, mobile approvals, templates)
- Implementation phases (4 phases: MVP 4-6 weeks, Formulation, Compliance, Change Control)

### Missing Modules Referenced
User noted modules not yet in MonoPilot that NPD would integrate with:
1. **Planning Module** (for finance planning, roadmaps, portfolio management)
2. **Finance Module** (costing, budgeting, P&L, target cost tracking)
3. Need to design NPD to work WITHOUT these in MVP

### Key Challenge
How to deliver NPD MVP without blocking on Finance/Planning modules - need pragmatic solutions for costing and roadmaps.

## Executive Summary

**Topic:** NPD Module (New Product Development) - Stage-Gate system for food manufacturing product innovation

**Session Goals:**
- Decide architecture: Stand-alone (schema npd_*) vs Integral (extend Products/BOM)
- Define MVP scope that works without Finance/Planning modules
- Design seamless handoff: NPD → Products/BOM/WO (automatic pilot creation)
- Benchmark best NPD/PLM features for food industry
- Plan 4-phase implementation roadmap

**Techniques Used:**
1. First Principles Thinking (Creative, 20 min)
2. Six Thinking Hats (Structured, 25 min)
3. SCAMPER Method (Structured, 20 min)
4. Assumption Reversal (Deep, 15 min)

**Total Duration:** 80 minut (Deep research + architectural decisions)

**Total Ideas/Decisions Generated:** 50+ architectural decisions, integrations, and MVP scope items

### Key Themes Identified:

**1. Bounded Context Architecture (Modular NPD)**
- NPD = stand-alone module with optional integration (not monolithic extension)
- Feature flags per org (`enabled_modules: ['npd', 'production']`)
- Clean separation: `npd_*` tables (no pollution of production tables)
- Event-based integration (NPD.HandoffRequested → Products.ProductCreated)

**2. Pragmatic MVP (Flow > Sophistication)**
- P0: Stage-Gate flow (G0-G4), formulation versioning, handoff, compliance
- P1: Migration wizard, shared VersioningService, basic costing
- P2: Advanced DMS, FMEA, analytics
- P3: LP reservations, e-signatures, document workflows

**3. Reuse > Rebuild**
- Shared services: VersioningService, RLSService, AuditLogService, ApprovalsService
- Reużycie tabel: production_outputs (trials), allergens (compliance), license_plates (trials)
- Pilot simplifications: 1-2 operacje routing, flat cost per operation

**4. Audit Trail = Business Value**
- Duplikacja npd_formulations → boms = valuable (shows project evolution)
- Formulation lineage (v1 → v2 → v3 → final) = traceability for recalls
- Event sourcing = replay, debugging, compliance audits

**5. Financial Approval = Gate-Keeper**
- Standard cost must be approved by Finance role before handoff
- Simple costing MVP (target vs estimated vs actual)
- Phase 2: Integration with Finance Module (overhead, labor rates)

**6. NPD-only Scenario = Export Path**
- R&D firms without production → NPD exports to Excel/PDF/CSV
- Handoff wizard has 2 paths: Transfer (if production) OR Export (if NPD-only)
- Migration wizard: NPD-only → +Production (migrate accepted projects to BOM)

## Technique Sessions

### Technique 1: First Principles Thinking (Creative, 20 min)

**Cel:** Zbudować fundamenty NPD - nie kopiując systemy PLM, ale rozumiejąc esencję procesu w food manufacturing.

#### Prompt 1: Fundamentalne prawdy o NPD

**User Response - Universal PLM Thinking Model:**

**3 fundamenty oceny każdego pomysłu:**
1. **Wartość** → Popyt, pozycjonowanie, business case
2. **Ryzyko** → Technologia, łańcuch dostaw, regulacje
3. **Ograniczenia** → Linia produkcyjna, koszty, lead-time, compliance

**Stage-Gate (lekki, ale strukturalny):**
- Fazy: Idea → Feasibility → Business Case → Development → Testing/Pilot → Launch
- Bramki: **Go / Kill / Recycle** z minimalnym zestawem dowodów
- Dowody: Wymagania, prototyp/próba, koszt, ryzyka, zgodność

**Design for X (od początku):**
- DFM/DFT (produkcyjność/testowalność)
- Serwisowalność
- Traceability (partie/LP/genealogia)
- Bezpieczeństwo + zrównoważenie

**Jedno źródło prawdy:**
- Receptura/BOM są centralne
- Wersjonowanie w czasie (daty efektywności)
- Snapshot w WO/pilotach (zachowanie historii)
- Planowanie zmian receptur na przyszłość

**Świadoma traceability:**
- Od surowca do wyrobu (partie/LP)
- Genealogia (parent-child relationships)
- Raport odwoławczy (recall readiness)
- Wpływ na etykiety, pakowanie, skanowanie

---

#### Food Manufacturing - Realne kroki (G0 → G4)

**G0 - Idea/Feasibility:**
- Brief rynkowy + ograniczenia technologiczne linii
- **Surowce:** Kwalifikacja dostawców, alternatywy, COA/SPEC, MoQ/lead-time
- **Alergeny:** Status alergenów, zgodność Halal/Kosher
- **Pre-compliance:** Wstępne wymagania etykietowe/claims, HACCP dla nowego procesu

**G1 - Formulacja (lab):**
- Próby receptury
- **Kalkulacja kosztu:** Target cost vs actual (warianty)
- **Wersjonowanie receptury:** Drafty, planowanie wersji sezonowych
- **Testy:** Mikro (skrining), sensoryka, kompatybilność z opakowaniem

**G2 - Pilot (linia testowa / krótka seria):**
- **Pilot WO:** Snapshot BOM, rejestracja partii/LP
- **Genealogia:** Skanery + traceability
- **Shelf-life:** Start testów (przyspieszone/stabilne)
- **Walidacja:** Migracja z opakowania, CIP/SIP (czyszczenie linii)

**G3 - Pre-Launch:**
- **Dokumenty kompletne:** Karta techniczna, etykieta, alergeny, instrukcja procesu
- **QA criteria:** COA przy przyjęciu, limity mikro, testy linii
- **Alternatywne surowce:** Zabezpieczone + przełączanie BOM wg dat (sezonowość)

**G4 - Launch & Kontrola:**
- **Pierwsze serie komercyjne:** Skanowanie, LP, etykiety
- **Monitoring:** Yield vs plan, produkty uboczne
- **Raporty:** Zgodność/odwołania (LP genealogy od surowca do FG)

---

#### Inne branże (cross-industry insights)

**Elektronika/Automotive:**
- EVT/DVT/PVT (prototyp → produkcja)
- DFM/DFT, testy środowiskowe, EMC
- Compliance: RoHS/REACH, APQP/PPAP, DFMEA/PFMEA
- Traceability: Serial numbers / partie
- Narzędzia: Formy, przyrządy, obsolescencja komponentów
- ECO (Engineering Change Orders)

**Farmacja/Kosmetyki/Chemia:**
- Pre-formulacja + DoE (Design of Experiments)
- Stabilność: Długoterminowa/przyspieszona
- GxP: IQ/OQ/PQ linii, walidacja procesu i metod analitycznych
- Dokumentacja wsadowa (batch records)
- SDS/CLP/INCI, claims, etykiety
- Rygorystyczna genealogia wsadów i materiałów pomocniczych

**Maszyny/Equipment (ETO/CTO):**
- Konfigurator wariantów, modułowość
- FAT/SAT (Factory/Site Acceptance Testing)
- Certyfikacje: CE/UL
- Dokumentacja serwisowa + plan części zamiennych

---

#### Entry/Exit Criteria (esencja bramek)

**Entry do lab/pilota:**
- Min. 2 kwalifikowanych dostawców kluczowych surowców/komponentów
- Wstępne koszty
- Akceptowalne lead-time
- Zmapowane alergeny/zgodność

**Exit z pilota:**
- Stabilna receptura/BOM (z wersją i datami)
- Parametry procesu
- Kryteria QA
- Komplet etykiet i materiałów prawnych
- Potwierdzona obsługa traceability na skanerach
- Wyniki shelf-life/wytrzymałości

---

#### 🎯 KLUCZOWY INSIGHT: Automatyczne zadania na "Create Idea"

**Zaraz po utworzeniu pomysłu, system automatycznie tworzy:**

1. **Checklistę Gate-0** z terminami i właścicielami (Biz/R&D/QA/Regulatory)
2. **Szkielet BOM/Spec** (pusty, draft) + numer projektu
3. **Zadanie supply-chain:** Kwalifikacja min. 2 dostawców, MoQ/lead-time, alternatywy
4. **Wstępny costing:** Target cost vs prognoza (alert >X% odchyłki)
5. **Pre-compliance:** Lista wymagań (alergeny/etykiety/RoHS/GxP) + placeholder dokumentów
6. **Plan eksperymentów:** Szablon DoE/sensory/testy + sloty w kalendarzu lab/linii
7. **Traceability plan:** Matryca LP/partii i wymaganych skanów
8. **Ryzyka i FMEA:** Rejestr ryzyk z scoringiem + zadania mitigacyjne
9. **Packaging/Artwork:** Zadania dla etykiety/opakowania (claims, barcodes, GS1, proofy)
10. **KPI projektu:** Time-to-Gate, First-Time-Right, koszt vs target (dashboard)
11. **Reguły wersjonowania:** Wymóg dat efektywności + blokada kolizji zakresów
12. **Przygotowanie skanerów:** Lista kodów, etykiet, testy E2E (ASN→GRN→LP→output)
13. **Workflow guards:** Statusy, uprawnienia, log historii

---

#### Prompt 2: "Jedno źródło prawdy" - Versioning & Transfer

**Scenariusz:** Receptura "Burger Wegański" v1.0 (active 1 marca) → Pilot WO (10 kwietnia) → Nowa wersja v2.0 (active 1 czerwca)

**User Response:**

**1. Pilot WO z 10 kwietnia:**
- **Używa BOM v1.0** (snapshot przy utworzeniu)
- Wersja **może zostać przełączona**, ale zależy kiedy WO zostało stworzone:
  - **Opcja A:** Zakończyć stare WO na v1.0
  - **Opcja B:** Wystawić nowe WO z v2.0

**2. Pilot trwający 2 miesiące (kwiecień-maj):**
- **Może skończyć na starej wersji** (v1.0)
- Nie ma automatycznego przełączania mid-flight

**3. Gdzie "żyje" receptura przed BOM:**
- **Odpowiedź: B (osobne tabele)**
- `npd_formulations` (R&D playground) → transfer do `boms` (produkcja)
- Transfer następuje **przy zatwierdzeniu** (approval gate)
- **BOM dziedziczy po npd_formulations** (nie tworzy od zera)

**Kluczowy insight:** NPD i Production mają osobne przestrzenie, ale z kontrolowanym transferem + dziedziczeniem.

---

#### Prompt 3: Handoff - "Jedno kliknięcie" → Product + BOM + Routing + WO

**User Response - Co się dzieje przy "Handoff to Production":**

**1. Product creation:**
- **Hybrid approach** - user **wybiera**:
  - **Opcja A:** Utworzyć nowy produkt
  - **Opcja B:** Nadać nową major version istniejącemu produktowi (reformulacja)
- Decyzja manualna przy handoff

**2. BOM creation/update:**
- **Nowa wersja BOM** (zawsze)
- Transfer z npd_formulations → boms

**3. Routing:**
- **Wybierane przez NPD** (nie auto-guess)
- User wskazuje routing podczas handoff (lista dostępnych routings)

**4. Pilot WO:**
- **Manualnie zaznaczone** jako "pilot WO"
- Nie automatyczne (user decyduje: tak/nie + ile sztuk)

**5. Rezerwacje LP:**
- **Brak czystego systemu rezerwacji** w MVP
- Robione **manualnie**
- Przewidziane w **późniejszej fazie projektu (P3)**

**6. QA checklisty:**
- **W zależności od ustawień** (configurable)
- Możliwość podpięcia checklist z npd_trials do WO

**Charakter handoff:**
- **Nie w pełni transakcyjny** (user ma kontrolę nad krokami)
- **Guided wizard** z możliwością wyboru opcji

---

#### Prompt 4: MVP Prioritization (P0 / P1 / P2)

**User Ranking automatycznych zadań przy "Create Idea":**

**P0 (MVP - konieczne w 4-6 tygodni):**
1. ✅ **Checklistę Gate-0** - strukturalne bramki
2. ✅ **Szkielet BOM/Spec** (draft) + numer projektu
3. ✅ **Wersjonowanie:** Reguły dat efektywności + blokada kolizji
4. ✅ **Workflow guards:** Statusy, uprawnienia, log historii
5. ✅ **Pre-compliance** (alergeny/etykiety) - **krytyczne dla food!**
6. ✅ **Traceability plan** - jeśli pilot używa LP (w food - tak!)

**P1 (Faza 2 - ważne, ale MVP działa bez tego):**
- **Supply-chain:** Kwalifikacja dostawców (MVP = 1 dostawca ok)
- **Wstępny costing:** Target cost (MVP = hardcoded/manual)
- **KPI projektu:** Dashboard (MVP = basic metrics)
- **Przygotowanie skanerów:** E2E testy (jeśli pilot używa LP - może P0!)

**P2 (Faza 3-4 - nice-to-have):**
- **Plan eksperymentów:** DoE/sensory (MVP = free-form notes)
- **Ryzyka i FMEA:** Scoring (MVP = simple risk list)
- **Packaging/Artwork:** Zadania GS1/proofy (może być manual w MVP)

**Kluczowy insight:** MVP skupia się na **flow** (Idea → Gates → Formulation → Handoff), nie na **sophistication** (FMEA, DoE, artwork automation).

---

#### 🎯 SYNTEZA: Fundamentalne prawdy NPD (First Principles)

**Co MUSI robić NPD system (esencja):**

1. **Wartość → Ryzyko → Ograniczenia** (3-wymiarowa ocena pomysłów)
2. **Stage-Gate flow** (Go/Kill/Recycle) z dowodami na każdej bramce
3. **Wersjonowanie receptur** z datami efektywności + dziedziczenie BOM
4. **Kontrolowany transfer** NPD → Production (npd_formulations → boms)
5. **Świadoma traceability** od surowca do FG (LP/partie/genealogia)
6. **Automatyzacja przy "Create Idea"** (checklisty, szkielet BOM, compliance, workflow guards)
7. **Guided Handoff** z wyborem: nowy produkt vs major version + routing + pilot WO
8. **Entry/Exit criteria** dla bramek (dostawcy, koszty, testy, dokumenty)

**Co MOŻE CZEKAĆ na Fazy 2-3:**
- Sophisticated costing (MVP = manual)
- LP reservations (MVP = manual, P3 = auto)
- DoE/FMEA automation (MVP = notes/lists)
- Artwork workflow (MVP = manual proofy)

**Cross-industry insights do zaadaptowania:**
- **Automotive:** APQP/PPAP, DFMEA → adapt dla food (HACCP plan)
- **Pharma:** IQ/OQ/PQ → adapt dla food (CIP/SIP validation)
- **Machinery:** Konfigurator → potential dla NPD templates (burger variants)

---

**Gotowi do Technique 2?** Mamy fundamenty - teraz czas zdecydować **architekturę**! 🏗️

---

### Technique 2: Six Thinking Hats (Structured, 25 min)

**Cel:** Przeanalizować architekturę NPD z 6 perspektyw i podjąć decyzję o modularności.

#### ⚪ White Hat: Fakty o architekturze modułowej

**🎯 KLUCZOWE WYJAŚNIENIE ARCHITEKTURY (User clarification):**

**NIE: Stand-alone SYSTEM**
**TAK: Stand-alone MODULE z opcjonalną integracją**

**Fakty architektoniczne:**

**1. Modularność:**
- Firma może mieć **TYLKO moduł NPD** bez modułów produkcyjnych (Growth/Enterprise bez fabryki)
- Firma może mieć **Products/BOM bez NPD** (bezpośrednie tworzenie receptur)
- Firma może mieć **NPD + Production** (pełna integracja)

**2. Osobne tabele (`npd_*`) - TAK:**
- **NIE zaśmiecać production tables** kolumnami NPD
- Wszystkie tabele NPD są osobne: `npd_projects`, `npd_formulations`, `npd_trials`, etc.
- Czystość: Production działa bez "martwych" kolumn NPD

**3. Długość projektów:**
- **Krótkie** (tygodnie, nie lata)
- Implikacja: Nie potrzeba heavy project management (Gantt, dependencies)
- Implikacja: MVP może być prostszy (kanban wystarczy)

**4. Scenariusze użycia:**

**Scenariusz A: NPD-only (bez produkcji)**
- R&D firma projektuje produkty dla klientów
- **Handoff** = export do Excel/CSV/PDF (specyfikacja dla klienta)
- Planning module **bardzo ograniczony** (brak WO, tylko roadmapy/timeline)
- **Nie ma** automatycznego tworzenia Product/BOM w MonoPilot (bo klient produkuje gdzie indziej)

**Scenariusz B: Production-only (bez NPD)**
- Firma produkuje według zewnętrznych receptur (toll manufacturing)
- BOM tworzony bezpośrednio w Technical Module
- **Nie ma** NPD gate'ów, trials, formulation versioning

**Scenariusz C: NPD + Production (pełna integracja)**
- Firma projektuje i produkuje
- **Handoff** = automatyczne Product + BOM + pilot WO
- Pełna traceability: idea → formulation → trial → production → recall

**5. Integracja (optional dependencies):**
- **NPD → Production:** Event-based (NPD.HandoffRequested → Products.ProductCreated)
- **Jeśli Production nie istnieje:** NPD eksportuje dane (nie crashuje)
- **Jeśli NPD nie istnieje:** Products/BOM działają normalnie

**6. Analogia architektoniczna:**
- **Microservices w monolicie** (bounded contexts)
- NPD = bounded context z własną domeną
- Integration via events/RPC (not direct DB coupling)

---

**Fundamentalne fakty techniczne:**

**Co NPD MUSI mieć własne (duplikacja nieunikniona):**
- ✅ Wersjonowanie formulations (inne niż BOM versioning - draft/iterations)
- ✅ Gate workflow (nie ma w production)
- ✅ Trials tracking (nie ma w production)
- ✅ Compliance checklists (specyficzne dla NPD)
- ✅ Project statuses (idea/feasibility/development - nie ma w production)

**Co NPD może reużyć z MonoPilot Core:**
- ✅ RLS mechanizm (org_id, role-based permissions)
- ✅ Audit log patterns (created_by, updated_at)
- ✅ Supabase Storage (dokumenty NPD)
- ✅ Authentication (te same role: NPD Lead, R&D, Regulatory)

**Co NPD może integrować opcjonalnie:**
- ⚡ Products API (jeśli istnieje) - create via handoff
- ⚡ BOM API (jeśli istnieje) - transfer formulation
- ⚡ WorkOrders API (jeśli istnieje) - create pilot WO
- ⚡ LicensePlates API (jeśli istnieje) - reserve for trials

**Implikacje dla MVP:**
- NPD MVP musi działać **bez założenia, że production istnieje**
- Handoff wizard ma 2 ścieżki:
  - **Path A:** Export (if production modules not active)
  - **Path B:** Transfer (if production modules active)
- Feature flags: `FEATURE_NPD_PRODUCTION_INTEGRATION`

---

#### 🔴 Red Hat: Emocje, intuicja i wyjaśnienia

**User Response:**

**1. Modularność = Feature flags (włączone/wyłączone):**
- **NIE:** Osobne produkty sprzedawane oddzielnie
- **TAK:** Moduły włączane/wyłączane per organization
- **NPD = Premium add-on** do całości (bonus dla Growth/Enterprise)

**2. Migracja NPD-only → Production:**
- Scenariusz: Klient zaczyna z NPD-only (projektuje produkty)
- Później chce dodać produkcję
- **Potrzebna migracja:** Zaakceptowane projekty NPD → tabela BOM
- Migration wizard: "Enable Production Module" → migrate npd_formulations to boms

**3. User confusion - NIE MA:**
- Każdy dział w firmie ma dostęp do **odpowiednich modułów** (RBAC)
- R&D → NPD Module
- Production → Planning/WO/Scanner
- **Nie powinno być confusion** (izolacja per rola)

**4. Events - muszą być persisted + retryable:**
- Event sourcing pattern
- Events zapisane w tabeli (event log)
- Możliwość **powtórzenia** w przypadku failure
- Przykład: `npd_events` (type, payload, status, retry_count)

**5. Duplikacja logiki = Audit trail (WARTOŚĆ!):**
- NPD może mieć **różne pomysły/iteracje** przed final BOM
- Duplikacja **pokazuje ile razy projekt się zmienił** przed produkcją
- To jest **valuable for traceability**, nie waste!
- Przykład: formulation v1 → v2 → v3 → final BOM v1.0

**Intuicja:**
- Podejście wydaje się **naturalne**
- **Obawy:** Migracja NPD → Production (ale to jest controlled process)
- **Ekscytacja:** Audit trail iteracji (traceability for recalls!)
- **Czerwone flagi:** Event failures (ale rozwiązane przez event log + retry)

---

#### 🟡 Yellow Hat: Korzyści bounded context

**Co jest ŚWIETNE:**

**Biznesowe:**
- ✅ **Premium tier differentiation:** Base (Production) vs Growth (+ NPD)
- ✅ **Upsell path:** Klient zaczyna NPD-only → dodaje Production (revenue growth)
- ✅ **Target market expansion:** R&D firmy bez fabryk (NPD-only customers)

**Development:**
- ✅ **Niezależny rozwój:** NPD team deployuje bez ryzyka dla production
- ✅ **Czystość kodu:** Production bez "if (is_npd)" wszędzie
- ✅ **Testowanie izolowane:** NPD module testowany z mock integration
- ✅ **Feature flags:** Easy enable/disable per org

**Utrzymanie:**
- ✅ **Debugging:** NPD issues nie mieszają się z production issues
- ✅ **Monitoring:** Osobne metryki dla NPD (time-to-gate, formulation iterations)
- ✅ **Audit trail:** Duplikacja = valuable history (compliance, recalls)

**Skalowalność:**
- ✅ **NPD może mieć 10x więcej projektów niż active products** (krótkie projekty)
- ✅ **Osobne tabele = brak query slowdown** na production (no JOIN npd_*)

**Dodatkowe korzyści (User insights):**
- ✅ **Migracja kontrolowana:** Wizard przenosi tylko zaakceptowane projekty (nie draft spam)
- ✅ **Event sourcing:** Replay events = data recovery, debugging, analytics
- ✅ **RBAC natural:** Działy mają dostęp tylko do swoich modułów (security)

---

#### ⚫ Black Hat: Ryzyka i mitigation

**Potencjalne problemy i rozwiązania:**

**1. Duplikacja logiki (Versioning):**
- ⚠️ **Ryzyko:** NPD versioning vs BOM versioning może się rozjechać
- ✅ **Mitigation:** Shared utility: `VersioningService` (reużywany przez NPD i BOM)
- ✅ **Acceptable:** Duplikacja = audit trail (pokazuje ewolucję projektu)

**2. Event failures:**
- ⚠️ **Ryzyko:** NPD.HandoffRequested event nie wysłany → data loss
- ✅ **Mitigation:** Event log table (`npd_events`) + retry mechanism
- ✅ **Monitoring:** Alert jeśli event status = 'failed' po 3 retries
- ✅ **Manual recovery:** Admin UI do replay failed events

**3. Data migration (NPD → Production):**
- ⚠️ **Ryzyko:** Ręczne mapowanie pól formulation → BOM (error-prone)
- ✅ **Mitigation:** Migration wizard z validation
- ✅ **Dry run:** Preview przed migracją (user confirms)
- ✅ **Rollback:** Backup npd_formulations przed migracją

**4. User confusion:**
- ⚠️ **Ryzyko:** "Dlaczego ten produkt w NPD, a ten w Products?"
- ✅ **Mitigation:** RBAC (każdy dział widzi swoje moduły)
- ✅ **Status clarity:** NPD projects mają status (idea/development/launched)
- ✅ **Handoff UI:** Wyraźne "Transfer to Production" button

**5. Schema evolution:**
- ⚠️ **Ryzyko:** NPD schema zmienia się → migracje trudne
- ✅ **Mitigation:** Versioned migration scripts
- ✅ **Backward compatibility:** Event payload versioning (v1, v2)

**6. Integration complexity:**
- ⚠️ **Ryzyko:** Zbyt wiele event types (NPD.X, NPD.Y, NPD.Z)
- ✅ **Mitigation:** Minimal events (tylko kluczowe: HandoffRequested, ProjectApproved)
- ✅ **Keep it simple:** MVP = 2-3 event types max

**Akceptowalne ryzyka (trade-offs):**
- ⚠️ **Duplikacja kodu:** Versioning logic w NPD i BOM
  - **OK:** Audit trail > DRY principle (dla traceability)
- ⚠️ **Manual migration:** NPD-only → Production wymaga wizarda
  - **OK:** Rzadki scenariusz (większość klientów ma od razu NPD+Production)

---

#### 🟢 Green Hat: Kreatywne rozwiązania i alternatywy

**Czy są hybrydy lub alternatywy?**

**Idea 1: Shared Versioning Service**
- `VersioningService` jako shared utility (reużywany przez NPD i BOM)
- Centralna logika: effective_from/to, overlap detection, snapshot
- NPD i BOM wywołują ten sam serwis (DRY + consistency)

**Idea 2: Event Sourcing with Outbox Pattern**
- Tabela `npd_events` jako outbox (transactional safety)
- Background job procesuje eventy (retry on failure)
- Monitoring dashboard: event status, retry count, failed events

**Idea 3: Migration Wizard (NPD-only → Production)**
- Step 1: Preview (pokazuje co zostanie przeniesione)
- Step 2: Validation (checks: dostawcy, alergeny, compliance)
- Step 3: Dry-run (tworzy draft BOM, user reviewuje)
- Step 4: Execute (migration + backup)
- Step 5: Verify (sprawdza konsystencję)

**Idea 4: Feature Flag Levels**
- Level 1: **Core** (Products/BOM/Production) - base tier
- Level 2: **+NPD** (Premium add-on) - Growth/Enterprise
- Level 3: **+Finance/Planning** (Full suite) - Enterprise
- Flags per org: `features: ['npd', 'finance']`

**Idea 5: NPD as "Pre-Production" namespace**
- Koncepcyjnie: NPD = "Products in development" (statusy: draft/trial/approved)
- Production = "Products in market" (statusy: active/phased-out)
- **Same domain**, different lifecycle stages
- Ale fizycznie osobne tabele (npd_* vs boms/products)

---

#### 🔵 Blue Hat: Meta - Finalna decyzja

**Proces decyzyjny:**

**Fakty (White Hat):**
- 3 scenariusze: NPD-only, Production-only, NPD+Production
- Feature flags per org
- Event-based integration (optional)
- Migration wizard potrzebny

**Emocje (Red Hat):**
- Podejście wydaje się naturalne
- Duplikacja = audit trail (wartość!)
- Events + retry = confidence
- NPD = premium add-on (nie separate product)

**Korzyści (Yellow Hat):**
- Premium tier differentiation
- Niezależny rozwój
- Skalowalność (NPD może mieć 10x projects)
- RBAC natural per dział

**Ryzyka (Black Hat):**
- Event failures → mitigation: event log + retry
- Migration NPD → Production → mitigation: wizard + validation
- Schema evolution → mitigation: versioned migrations

**Kreatywność (Green Hat):**
- Shared VersioningService
- Event sourcing + outbox pattern
- Migration wizard z dry-run
- Feature flag levels

---

**🎯 DECYZJA ARCHITEKTURY:**

**Bounded Context Pattern + Feature Flags + Event Sourcing**

**Schema:**
- ✅ Osobne tabele: `npd_*` (projects, formulations, trials, gate_reviews, events, documents, risks, costing)
- ✅ Integracja: Event-based (NPD.HandoffRequested → Products.ProductCreated)
- ✅ Migration: Wizard (NPD-only → +Production)

**API:**
- ✅ Osobne API: `NPDProjectsAPI`, `FormulationsAPI`, `TrialsAPI`, `GateReviewsAPI`
- ✅ Shared utilities: `VersioningService`, `RLSService`, `AuditLogService`

**Deployment:**
- ✅ Feature flags: `FEATURE_NPD_MODULE`, `FEATURE_NPD_PRODUCTION_INTEGRATION`
- ✅ Per-org config: `org_settings.enabled_modules: ['npd', 'production']`

**MVP Priorities:**
- ✅ P0: NPD standalone (działa bez production)
- ✅ P0: Event log + basic retry
- ✅ P1: Migration wizard (NPD → Production)
- ✅ P1: Shared VersioningService
- ✅ P2: Advanced event monitoring dashboard

---

### Technique 3: SCAMPER Method (Structured, 20 min)

**Cel:** Systematycznie zbadać integracje NPD z istniejącymi modułami MonoPilot.

#### S - Substitute (Zastąpić)

**1. npd_formulations vs bom_items:**
- ❌ **NIE zastępować** - podejście **czyste** (separate domains)
- `npd_formulations` (R&D playground) → `boms` (production) przy approval
- **Uzasadnienie:** Czystość domen > DRY principle (audit trail wartościowy)

**2. npd_trials vs production_outputs:**
- ✅ **TAK, można reużyć** `production_outputs` dla trials
- `production_outputs.type = 'trial'` (filter w UI)
- **Korzyść:** Wspólny format yield, by-products, batch tracking

**3. npd_gate_reviews vs generic approvals:**
- ✅ **TAK, można użyć** generic `approvals` table
- `approvals.entity_type = 'npd_project', entity_id = project.id, gate_stage = 'G1'`
- **Korzyść:** Reużycie approval workflow logic (notifications, permissions)

---

#### C - Combine (Połączyć)

**User: "Wszystko tak a tak może to zaadoptować"**

**Potwierdzenie kombinacji:**

1. ✅ **npd_formulations + boms:** Inheritance przy handoff (shared struktura składników)
2. ✅ **npd_trials + work_orders:** Pilot WO (`work_orders.type = 'pilot'`)
3. ✅ **npd_compliance + allergens:** Reużycie `allergens` table (auto-check w formulation)
4. ✅ **npd_documents + Supabase Storage:** Folder `npd/{org_id}/{project_id}/`

**Dodatkowe kombinacje:**
- ✅ **npd_projects + org_settings:** Feature flags per org (`enabled_modules: ['npd']`)
- ✅ **npd_formulation_items + products:** Foreign key do `products.id` (składniki)
- ✅ **npd_trials + license_plates:** Trial używa LP (traceability od próby)

---

#### A - Adapt (Zaadaptować)

**Potwierdzenie adaptacji:**

1. ✅ **BOM Versioning → Formulation Versioning:** Shared `VersioningService`
2. ✅ **LP Genealogy → Formulation Iterations:** `npd_formulation_lineage` table
3. ✅ **RLS Policies → NPD Projects:** Ten sam pattern (org_id + policies)
4. ✅ **Scanner flows → NPD Trial flows:** Mobile UI dla lab trials

**💡 User insights - Routing & Costing dla trials:**

**5. ✅ Routing - Pilot (uproszczony):**
- Można **wybrać "pilot routing"** (simplified vs production routing)
- **Pilot routing:** 1-2 operacje (np. "Mix & Pack")
- **Production routing:** 10+ operacji (Prep → Mix → Cook → Cool → Pack → Label → Palletize)
- **Korzyść:** Szybsze trial setup, mniej overhead

**6. ✅ Costing - Jedna operacja (uproszczony):**
- **Koszt przypisany do jednej operacji** zamiast rozbijania na poszczególne
- Przykład trial: "Mix & Pack" = $500 flat (zamiast: Mix $200 + Pack $150 + Labor $150)
- **Korzyść:** MVP costing bez sophisticated rollup

---

#### M - Modify (Zmodyfikować istniejące tabele)

**Co trzeba zmodyfikować w MonoPilot:**

**1. `work_orders` table:**
```sql
ALTER TABLE work_orders
ADD COLUMN type TEXT CHECK (type IN ('production', 'pilot')) DEFAULT 'production';

ADD COLUMN npd_project_id UUID REFERENCES npd_projects(id) ON DELETE SET NULL;
```
- Pilot WO linkuje do NPD project

**2. `products` table:**
```sql
ALTER TABLE products
ADD COLUMN npd_project_id UUID REFERENCES npd_projects(id) ON DELETE SET NULL;

ADD COLUMN source TEXT CHECK (source IN ('direct', 'npd_handoff')) DEFAULT 'direct';
```
- Traceability: Product → NPD project

**3. `boms` table:**
```sql
ALTER TABLE boms
ADD COLUMN npd_formulation_id UUID REFERENCES npd_formulations(id) ON DELETE SET NULL;

ADD COLUMN source TEXT CHECK (source IN ('direct', 'npd_handoff')) DEFAULT 'direct';
```
- Traceability: BOM → NPD formulation

**4. `production_outputs` table:**
```sql
ALTER TABLE production_outputs
ADD COLUMN type TEXT CHECK (type IN ('production', 'trial')) DEFAULT 'production';

ADD COLUMN npd_trial_id UUID REFERENCES npd_trials(id) ON DELETE SET NULL;
```
- Trial outputs linkują do npd_trials

**5. `routings` table (optional):**
```sql
ALTER TABLE routings
ADD COLUMN type TEXT CHECK (type IN ('production', 'pilot')) DEFAULT 'production';
```
- Pilot routings (simplified, 1-2 operations)

**6. `license_plates` table (optional):**
```sql
ALTER TABLE license_plates
ADD COLUMN type TEXT CHECK (type IN ('production', 'trial', ...)) DEFAULT 'production';
```
- LP dla trials (małe qty, różne prefixy?)

---

#### P - Put to other use (Użyć inaczej)

**Istniejące features użyte dla NPD:**

1. ✅ **Traceability/Genealogy → Formulation lineage:**
   - `lp_genealogy` pattern → `npd_formulation_lineage`
   - Śledzenie: idea → v1 → v2 → v3 → final BOM

2. ✅ **Work Orders → R&D Experiment Plans:**
   - `work_orders.type = 'experiment'` (lab trials, nie linia)
   - Batch size małe (kg, nie tony)

3. ✅ **Purchase Orders → Ingredient sourcing for trials:**
   - `po_header.type = 'trial'` (próbki, MoQ bypass)
   - Fast-track delivery dla R&D

4. ✅ **Scanner → Lab data entry:**
   - Tablet w lab: Scan ingredients, log parameters, photo results
   - Reużycie Scanner UI (mobile-first, offline-capable)

5. ✅ **Approvals workflow → Gate reviews:**
   - Reużycie approval logic dla NPD gates (notifications, RBAC)

---

#### E - Eliminate (Wyeliminować z MVP)

**Co NPD NIE potrzebuje (over-engineering):**

1. ✅ **Heavy project management:** Gantt, dependencies, critical path
   - **MVP:** Kanban wystarczy (projekty krótkie)

2. ✅ **Sophisticated costing:** Multi-level BOM rollup, overhead allocation
   - **MVP:** Flat cost per operation (User insight: jedna operacja = $X)

3. ✅ **LP reservations:** Auto-reserve logic
   - **MVP:** Manual (User: planned for P3)

4. ✅ **Advanced routing:** Multi-step dependencies, parallel operations
   - **MVP:** Pilot routing (1-2 operacje, User insight)

5. ✅ **Complex approval matrix:** Multi-level, conditional
   - **MVP:** Simple gate checklist (Go/Kill, single approver per gate)

6. ✅ **Advanced analytics:** Predictive models, AI insights
   - **MVP:** Basic KPIs (time-to-gate, first-time-right)

---

#### R - Reverse (Odwrócić flow)

**Odwrócone patterns w NPD:**

1. ✅ **BOM → Product (zamiast Product → BOM):**
   - NPD: Formulation first → Product przy handoff
   - Insight: Receptura jest primary, produkt secondary

2. ✅ **Purchase → Production (zamiast Production → Purchase):**
   - NPD: Kupujesz próbki (PO.trial) → decydujesz produkcję
   - Insight: Badasz dostępność składników PRZED commitment

3. ✅ **Production → Design (loop, nie linear):**
   - NPD: Trial → feedback → nowa formulation → kolejny trial
   - Insight: Iteracje (nie waterfall)

4. ✅ **QA testing BEFORE scale-up (zamiast AFTER):**
   - NPD: QA testuje trials na bramce G2 → G3 (blocker)
   - Production: QA testuje po produkcji (post-facto)
   - Insight: QA w NPD jest gate-keeper

---

#### 🎯 SYNTEZA: Konkretne integracje NPD ↔ MonoPilot

**Tabele do modyfikacji (foreign keys + enums):**
1. ✅ `work_orders` - dodaj `type: 'pilot'`, `npd_project_id`
2. ✅ `products` - dodaj `npd_project_id`, `source: 'npd_handoff'`
3. ✅ `boms` - dodaj `npd_formulation_id`, `source: 'npd_handoff'`
4. ✅ `production_outputs` - dodaj `type: 'trial'`, `npd_trial_id`
5. ✅ `routings` - dodaj `type: 'pilot'` (optional)
6. ✅ `license_plates` - dodaj `type: 'trial'` (optional)

**Shared services (reużycie):**
1. ✅ `VersioningService` - formulation versioning + BOM versioning
2. ✅ `RLSService` - org_id enforcement dla npd_*
3. ✅ `AuditLogService` - created_by, updated_at dla npd_*
4. ✅ `ApprovalsService` - gate reviews (generic workflow)
5. ✅ `StorageService` - Supabase Storage dla NPD documents

**Pilot-specific simplifications:**
1. ✅ **Pilot routing:** 1-2 operacje (Mix & Pack)
2. ✅ **Pilot costing:** Flat cost per operation ($500 zamiast rollup)
3. ✅ **Pilot WO:** Małe batch (kg, nie tony)
4. ✅ **Pilot LP:** Trials używają LP (traceability), ale może inne prefixy

**Handoff flow (NPD → Production):**
```
npd_formulations (approved)
  → Transfer wizard
    → Creates: Product (npd_project_id set)
    → Creates: BOM v1.0 (npd_formulation_id set, source='npd_handoff')
    → Optionally: Pilot WO (type='pilot', npd_project_id set)
    → Optionally: Reserve LP for trial materials
```

---

### Technique 4: Assumption Reversal (Deep, 15 min)

**Cel:** Zakwestionować założenia o brakujących modułach i znaleźć pragmatyczne rozwiązania dla MVP.

#### Założenie 1: "NPD potrzebuje Finance Module do costingu"

**Odwrócenie:** Prosty kalkulator w NPD wystarczy na start

**User Response:** ✅ **NIE potrzebuje Finance Module**

**MVP Solution - Simple Costing:**
```sql
CREATE TABLE npd_costing (
  id UUID PRIMARY KEY,
  npd_project_id UUID REFERENCES npd_projects(id),
  target_cost DECIMAL(10,2), -- manual input (R&D Lead)
  estimated_cost DECIMAL(10,2), -- calculated from formulation
  actual_cost DECIMAL(10,2), -- from trial WO
  variance_pct DECIMAL(5,2), -- (actual - target) / target * 100
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Kalkulacja (Excel-style):**
```typescript
function calculateEstimatedCost(formulation: Formulation): number {
  return formulation.items.reduce((total, item) => {
    return total + (item.qty * item.unit_price);
  }, 0);
}
```

**Alerts:**
- Variance > 20% → warning (koszt znacząco przekracza target)
- Missing target_cost → prompt R&D Lead

**Phase 2:** Integration z Finance Module (standard cost, overhead, labor rates)

---

#### Założenie 2: "NPD potrzebuje Planning Module do roadmap"

**Odwrócenie:** Roadmapa to tylko widok nad npd_projects z datami

**User Response:** ✅ **TAK, Kanban + dates wystarczy do MVP**

**MVP Solution - Simple Roadmap:**
```sql
ALTER TABLE npd_projects
ADD COLUMN target_launch_date DATE,
ADD COLUMN estimated_duration_weeks INT DEFAULT 8,
ADD COLUMN priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
ADD COLUMN portfolio_category TEXT; -- e.g., 'Premium Burgers', 'Vegan Line'
```

**UI Components:**
1. **Kanban Board:** Kolumny per gate (G0 → G1 → G2 → G3 → G4 → Launched)
2. **Timeline View:** Horizontal bars (created_at → target_launch_date)
3. **CSV Export:** Export dla external planning tools

**Phase 2:** Integration z Planning Module (resource allocation, capacity planning)

---

#### Założenie 3: "Handoff wymaga pełnej integracji"

**Odwrócenie:** RPC API + basic validation wystarczą

**User Response:** ✅ **Financial approve costing (standard cost)**

**MVP Solution - Minimal Handoff:**
```typescript
class NPDHandoffAPI {
  static async handoffToProduction(projectId: string, options: {
    createProduct: boolean,
    productName?: string,
    createBOM: boolean,
    createPilotWO: boolean,
    pilotQty?: number,
    standardCost?: number // financial approval required
  }): Promise<HandoffResult> {

    // Validation checklist
    const checks = await this.validateHandoff(projectId);
    if (!checks.passed) return { errors: checks.errors };

    // Financial approval check
    if (options.standardCost) {
      const approved = await this.checkFinancialApproval(projectId, options.standardCost);
      if (!approved) return { errors: ['Financial approval required for standard cost'] };
    }

    // Execute handoff (transactional)
    const result = await this.executeHandoff(projectId, options);

    // Log event
    await this.logHandoffEvent(projectId, result);

    return result;
  }
}
```

**Validation checklist:**
- ✅ Gate G3 approved?
- ✅ Formulation locked?
- ✅ Allergens mapped?
- ✅ Compliance docs uploaded?
- ✅ **Standard cost approved by Finance role?**

**Handoff paths:**
- **Path A (Production active):** Create Product + BOM + Pilot WO
- **Path B (NPD-only):** Export to Excel/PDF

---

#### Założenie 4: "NPD potrzebuje sophisticated FMEA"

**Odwrócenie:** Prosty risk list wystarczy na start

**User Response:** ✅ **TAK, simple risk list wystarczy**

**MVP Solution - Simple Risk Management:**
```sql
CREATE TABLE npd_risks (
  id UUID PRIMARY KEY,
  npd_project_id UUID REFERENCES npd_projects(id),
  risk_description TEXT NOT NULL,
  likelihood TEXT CHECK (likelihood IN ('low', 'medium', 'high')) DEFAULT 'medium',
  impact TEXT CHECK (impact IN ('low', 'medium', 'high')) DEFAULT 'medium',
  risk_score INT GENERATED ALWAYS AS (
    CASE likelihood
      WHEN 'low' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'high' THEN 3
    END *
    CASE impact
      WHEN 'low' THEN 1
      WHEN 'medium' THEN 2
      WHEN 'high' THEN 3
    END
  ) STORED, -- max 9
  mitigation_plan TEXT,
  owner_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('open', 'mitigated', 'accepted')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI:** Simple table sorted by risk_score DESC (highest risk first)

**Phase 2:** Full FMEA (Severity, Occurrence, Detection, RPN)

---

#### Założenie 5: "NPD potrzebuje DMS (Document Management)"

**Odwrócenie:** Supabase Storage + metadata wystarczą

**User Response:** ✅ **Wystarczy na start, ALE później trzeba solidniejsze rozwiązanie**

**MVP Solution - Simple DMS:**
```sql
CREATE TABLE npd_documents (
  id UUID PRIMARY KEY,
  npd_project_id UUID REFERENCES npd_projects(id),
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('formulation', 'trial', 'compliance', 'label', 'other')),
  version INT DEFAULT 1,
  file_size_bytes BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);
```

**Storage structure:**
```
/npd/{org_id}/{project_id}/
  /formulations/formulation_v1.pdf
  /trials/trial_001_results.xlsx
  /compliance/allergen_declaration.pdf
  /labels/label_v1_proof.pdf
```

**MVP Features:**
- ✅ Upload (drag & drop)
- ✅ Download
- ✅ Version history (file_name + version)
- ✅ Basic metadata (file_type, description)

**🎯 P3 Features (DO NOT LOSE!):**
- ❌ Check-in/check-out (document locking)
- ❌ Approval workflows (review → approve → publish)
- ❌ E-signatures (FDA 21 CFR Part 11 compliance)
- ❌ Full audit trail (who viewed, when, changes)
- ❌ Document templates (auto-generate CoA, specs)
- ❌ Advanced search (full-text, metadata filters)

---

#### 🎯 SYNTEZA: MVP bez Finance/Planning Modules

**Co działa bez external modules:**

1. ✅ **Costing:** Simple calculator (target vs estimated vs actual)
2. ✅ **Roadmap:** Kanban + timeline view + CSV export
3. ✅ **Handoff:** RPC API + financial approval (standard cost)
4. ✅ **Risk:** Simple list (likelihood × impact)
5. ✅ **DMS:** Storage + metadata (basic versioning)

**Co potrzebuje integracji (jeśli moduły istnieją):**

1. **Finance Module (Phase 2):**
   - Standard cost calculation (overhead, labor rates)
   - Approval workflow dla costingu
   - Budget tracking (project spend vs budget)

2. **Planning Module (Phase 2):**
   - Resource allocation (R&D capacity)
   - Portfolio balancing (high/medium/low priority)
   - Release planning (quarter-based roadmaps)

**Co odkładamy na P3 (zazanotowane!):**

1. **Advanced DMS:**
   - Check-in/check-out
   - Approval workflows
   - E-signatures
   - Full audit trail
   - Document templates
   - Advanced search

2. **LP Reservations:** Auto-reserve dla trials (currently manual)

3. **Advanced Analytics:** Predictive models, AI insights

---

{{technique_sessions}}

## Idea Categorization

### Immediate Opportunities (MVP - 4-6 weeks)

_Ready to implement now for MVP:_

**Architecture:**
1. ✅ Bounded Context pattern (npd_* tables, event sourcing)
2. ✅ Feature flags (`FEATURE_NPD_MODULE`, `FEATURE_NPD_PRODUCTION_INTEGRATION`)
3. ✅ Event log table (`npd_events`) with retry mechanism

**Core Tables (P0):**
1. `npd_projects` - Project management (gates, status, dates)
2. `npd_formulations` + `npd_formulation_items` - Receptury (versioned)
3. `npd_trials` - Próby (reużycie production_outputs.type='trial')
4. `npd_costing` - Simple calculator (target vs estimated vs actual)
5. `npd_risks` - Simple risk list (likelihood × impact)
6. `npd_documents` - Storage metadata (Supabase Storage)
7. `npd_events` - Event sourcing (handoff, approvals)

**Integrations (P0):**
1. Modify `work_orders` - dodaj `type: 'pilot'`, `npd_project_id`
2. Modify `products` - dodaj `npd_project_id`, `source: 'npd_handoff'`
3. Modify `boms` - dodaj `npd_formulation_id`, `source: 'npd_handoff'`
4. Reużyj `allergens` table - auto-check w formulation
5. Reużyj `approvals` table - gate reviews

**UI (P0):**
1. NPD Dashboard - Pipeline Kanban (G0 → G1 → G2 → G3 → G4 → Launched)
2. Project Detail - Tabs (Overview, Formulation, Trials, Costing, Risks, Docs, Gates)
3. Handoff Wizard - Guided transfer (Product + BOM + Pilot WO)
4. Simple costing calculator - Target vs Estimated vs Actual

---

### Future Innovations (Phase 2-3)

_Requires development/integration:_

**Phase 2 (P1 - 4-6 weeks):**
1. **Migration Wizard:** NPD-only → +Production (migrate accepted projects to BOM)
2. **Shared VersioningService:** Centralized versioning logic (NPD + BOM)
3. **Finance Integration:** Standard cost calculation (overhead, labor rates)
4. **Planning Integration:** Resource allocation, portfolio balancing
5. **Pilot routing templates:** 1-2 operacje (Mix & Pack, Test & Pack)
6. **Advanced costing:** Multi-level rollup (if Finance Module exists)

**Phase 3 (P2 - 8-10 weeks):**
1. **Advanced DMS:** Check-in/check-out, approval workflows, e-signatures
2. **LP Reservations:** Auto-reserve dla trials (currently manual)
3. **Full FMEA:** Severity, Occurrence, Detection, RPN
4. **Advanced analytics:** Time-to-gate, first-time-right, iteration velocity
5. **Document templates:** Auto-generate CoA, specs, labels
6. **Advanced search:** Full-text search across documents

---

### Moonshots (Phase 4 - Future)

_Ambitious, transformative concepts:_

**Cross-Industry Adaptations:**
1. **Automotive APQP/PPAP** → adapt dla food (HACCP plan automation)
2. **Pharma IQ/OQ/PQ** → adapt dla food (CIP/SIP validation automation)
3. **Machinery Configurator** → NPD templates (burger variants auto-generator)

**AI-Powered Features:**
1. **Formulation optimizer:** AI suggests ingredient substitutions (cost ↓, nutrition ↑)
2. **Shelf-life predictor:** ML model predicts shelf-life from formulation + trials
3. **Allergen risk scorer:** Auto-detect cross-contamination risks

**Advanced Compliance:**
1. **Regulatory autopilot:** Auto-submit to FDA/EFSA (pre-market notification)
2. **Label generator:** AI writes label claims from formulation (FDA-compliant)
3. **Traceability simulator:** "What-if" recall scenarios (impact analysis)

---

### Insights and Learnings

_Key realizations from the session:_

**1. Duplikacja ≠ Waste (jeśli ma wartość biznesową):**
- npd_formulations → boms = audit trail (pokazuje ewolucję projektu)
- Valuable for traceability, recalls, compliance
- Trade-off: DRY principle vs business value → **business value wins**

**2. MVP = Flow, nie Sophistication:**
- P0: Idea → Gates → Formulation → Handoff (end-to-end flow)
- Nie P0: Gantt charts, FMEA, advanced analytics
- Lesson: Users potrzebują działającego flow przed fancy features

**3. Bounded Context > Monolith:**
- Osobne tabele (`npd_*`) = niezależny rozwój, łatwiejsze testy
- Event-based integration = loose coupling, resilience
- Feature flags = flexibility (NPD-only, Production-only, NPD+Production)

**4. Financial Approval = Non-Negotiable:**
- Standard cost must be approved przed handoff
- Costing nie jest "nice-to-have" - to gate-keeper
- Lesson: Compliance features są P0 w regulated industries

**5. Pilot ≠ Production (uproszczenia mają sens):**
- Pilot routing: 1-2 operacje (nie 10+)
- Pilot costing: Flat cost (nie multi-level rollup)
- Pilot batch: kg (nie tony)
- Lesson: Over-engineering pilota spowalnia R&D

**6. Export Path = Unlock NPD-only Market:**
- R&D firmy bez fabryk = nowy segment klientów
- NPD eksportuje do Excel/PDF = integracja z external workflows
- Lesson: NPD module ma wartość POZA MonoPilot ecosystem

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: Create NPD Module PRD (Product Requirements Document)

**Rationale:**
- PRD is foundation for MVP development (defines scope, requirements, success metrics)
- Without PRD, development will drift (scope creep, missing features)
- PRD captures all brainstorming insights in structured format
- Needed for alignment with stakeholders (R&D, Finance, Production teams)

**Next steps:**
1. **Transform brainstorming results → PRD structure:**
   - Executive Summary (business case, ROI)
   - User Personas (NPD Lead, R&D, Regulatory, Finance)
   - Functional Requirements (Stage-Gate, formulation, handoff, costing)
   - Technical Requirements (bounded context, event sourcing, integrations)
   - Success Metrics (time-to-gate, first-time-right, adoption rate)
   - MVP Scope (P0: 4-6 weeks, 7 core tables, 4 UI screens)
   - Phase 2-3 Roadmap (migration wizard, advanced DMS, LP reservations)

2. **Define API contracts:**
   - NPDProjectsAPI (CRUD, gates, status transitions)
   - FormulationsAPI (versioning, inheritance, transfer to BOM)
   - TrialsAPI (create, results, link to WO)
   - HandoffAPI (validation, transfer, export)

3. **Document integration points:**
   - Modifications to existing tables (work_orders, products, boms, production_outputs)
   - Shared services (VersioningService, RLSService, ApprovalsService)
   - Event types (NPD.HandoffRequested, NPD.ProjectApproved)

4. **Review with stakeholders:**
   - R&D Lead (formulation workflow, trial management)
   - Finance (costing approval, standard cost)
   - Production (handoff wizard, pilot WO)

**Resources needed:**
- Business Analyst (you) - 8-12 hours (transform brainstorming → PRD)
- Domain expert (food manufacturing R&D) - 2-4 hours (review, feedback)
- Tech Lead - 2 hours (review API contracts, integrations)

**Timeline:**
- **Week 1:** Draft PRD (Executive Summary, User Personas, Functional Requirements)
- **Week 1:** Define API contracts + integration points
- **Week 2:** Stakeholder review + revisions
- **Week 2:** Final PRD approval
- **Total: 2 weeks**

**Deliverable:** `docs/MonoPilot-NPD-PRD-2025-11-15.md` (ready for architecture phase)

---

#### #2 Priority: Design Database Schema (npd_* tables + migrations)

**Rationale:**
- Schema is foundation for MVP development (defines data model)
- Early schema design prevents rework later (costly to change after code is written)
- Schema validation ensures integrity (constraints, foreign keys, RLS policies)
- Migrations must be sequential and versioned (consistency with MonoPilot pattern)

**Next steps:**
1. **Create core NPD tables (7 tables):**
```sql
-- 001_create_npd_projects.sql
CREATE TABLE npd_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  project_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('idea', 'feasibility', 'business_case', 'development', 'testing', 'launched', 'cancelled')),
  current_gate TEXT CHECK (current_gate IN ('G0', 'G1', 'G2', 'G3', 'G4')) DEFAULT 'G0',
  target_launch_date DATE,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  portfolio_category TEXT,
  owner_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, project_number)
);

-- RLS policies
ALTER TABLE npd_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY npd_projects_org_isolation ON npd_projects
  FOR ALL USING (org_id = auth.jwt() ->> 'org_id');

-- 002_create_npd_formulations.sql (versioned, effective_from/to)
-- 003_create_npd_formulation_items.sql (składniki)
-- 004_create_npd_costing.sql (target vs estimated vs actual)
-- 005_create_npd_risks.sql (likelihood × impact)
-- 006_create_npd_documents.sql (Storage metadata)
-- 007_create_npd_events.sql (event sourcing, retry)
```

2. **Modify existing tables (4 tables):**
```sql
-- 008_modify_work_orders_for_npd.sql
ALTER TABLE work_orders
ADD COLUMN type TEXT CHECK (type IN ('production', 'pilot')) DEFAULT 'production',
ADD COLUMN npd_project_id UUID REFERENCES npd_projects(id) ON DELETE SET NULL;

-- 009_modify_products_for_npd.sql
-- 010_modify_boms_for_npd.sql
-- 011_modify_production_outputs_for_npd.sql
```

3. **Create shared VersioningService utility:**
- Centralized logic: effective_from/to, overlap detection, snapshot
- Reużywany przez NPD formulations + BOM versioning

4. **Write migration rollback scripts:**
- Each migration has corresponding `*_rollback.sql`

**Resources needed:**
- Database Architect (or Tech Lead) - 12-16 hours (schema design, migrations)
- Backend Developer - 4 hours (VersioningService implementation)
- QA Engineer - 2 hours (migration testing on staging DB)

**Timeline:**
- **Week 3:** Design npd_* tables schema (review brainstorming + PRD)
- **Week 3:** Write migrations (001-011)
- **Week 4:** Implement VersioningService
- **Week 4:** Test migrations on staging DB
- **Week 4:** Deploy to production (feature flag OFF initially)
- **Total: 2 weeks**

**Deliverable:** 11 migration files + VersioningService + RLS policies

---

#### #3 Priority: Prototype Handoff Wizard (UI + API)

**Rationale:**
- Handoff is THE critical flow (NPD → Production transfer)
- Prototype validates architecture (bounded context, event sourcing, validation)
- Early UI feedback from stakeholders (before full implementation)
- De-risks MVP (proves integration works before committing to full build)

**Next steps:**
1. **Design Handoff Wizard UI (Figma prototype):**
```
Step 1: Validation
  [ ] Gate G3 approved ✅
  [ ] Formulation locked ✅
  [ ] Allergens mapped ✅
  [ ] Compliance docs ⚠️ Missing
  [Continue] (disabled until all ✅)

Step 2: Product Decision
  ○ Create new product: [Product Name: _______]
  ○ Update existing product: [Select Product ▼]
  [Standard Cost: $_______] (Finance approval required)

Step 3: BOM Transfer
  ✅ Transfer formulation v2.0 → BOM v1.0
  Preview: [Show formulation items table]

Step 4: Pilot WO (Optional)
  ☐ Create pilot Work Order
  [Quantity: _______] [UoM: kg ▼]
  [Routing: Pilot - Mix & Pack ▼]

Step 5: Confirm
  Summary: [Product, BOM, WO details]
  [Cancel] [Execute Handoff]
```

2. **Implement HandoffAPI (TypeScript):**
```typescript
class NPDHandoffAPI {
  static async validateHandoff(projectId: string): Promise<ValidationResult>
  static async checkFinancialApproval(projectId, standardCost): Promise<boolean>
  static async executeHandoff(projectId, options): Promise<HandoffResult>
  static async logHandoffEvent(projectId, result): Promise<void>
  static async exportProject(projectId, format): Promise<Blob> // NPD-only path
}
```

3. **Implement Event Sourcing:**
```sql
INSERT INTO npd_events (type, payload, status) VALUES
  ('NPD.HandoffRequested', {...}, 'pending');

-- Background job processes event
UPDATE npd_events SET status = 'completed' WHERE id = ...;
```

4. **Test with stakeholders:**
   - R&D Lead: Walkthrough handoff flow (validation, transfer)
   - Finance: Test standard cost approval
   - Production: Test pilot WO creation

**Resources needed:**
- UI/UX Designer - 4 hours (Figma prototype)
- Frontend Developer - 16 hours (Wizard UI implementation)
- Backend Developer - 12 hours (HandoffAPI + event sourcing)
- R&D Lead (stakeholder) - 2 hours (feedback session)

**Timeline:**
- **Week 5:** Figma prototype (handoff wizard flow)
- **Week 5:** Implement HandoffAPI (validation, transfer, events)
- **Week 6:** Implement Wizard UI (5 steps, validation states)
- **Week 6:** Stakeholder testing + feedback
- **Total: 2 weeks**

**Deliverable:** Working handoff wizard (validation → transfer → pilot WO) + event log

---

**Summary: First 6 Weeks Plan**

| Week | Priority #1 (PRD) | Priority #2 (Schema) | Priority #3 (Handoff) |
|------|-------------------|----------------------|-----------------------|
| 1    | Draft PRD         | -                    | -                     |
| 2    | Stakeholder review| -                    | -                     |
| 3    | ✅ PRD approved   | Design schema        | -                     |
| 4    | -                 | Migrations + test    | -                     |
| 5    | -                 | ✅ Schema deployed   | API + Figma prototype |
| 6    | -                 | -                    | ✅ Handoff wizard     |

**After Week 6:** Full MVP development (remaining UI, API, E2E tests) → 2-3 weeks → **MVP Launch (Week 8-9)**

## Reflection and Follow-up

### What Worked Well

**1. Progressive Technique Flow (4 techniques):**
- ✅ **First Principles** → fundamentals (Stage-Gate, formulation versioning, traceability)
- ✅ **Six Thinking Hats** → architecture decision (Bounded Context + Event Sourcing)
- ✅ **SCAMPER** → integrations (reuse production_outputs, allergens, approvals)
- ✅ **Assumption Reversal** → MVP pragmatism (no Finance/Planning dependency)
- **Result:** Comprehensive design in 80 minutes (vs typical 3-4 hours)

**2. Deep Research Integration:**
- User provided cross-industry insights (Automotive APQP, Pharma GxP, Machinery ETO)
- Benchmark analysis (Stage-Gate International, Arena, Sciforma, aha.io)
- Real-world constraints (financial approval, pilot simplifications, LP manual reservations)
- **Result:** NPD design grounded in industry best practices + MonoPilot reality

**3. Iterative Refinement:**
- Started with "Stand-alone vs Integral" debate
- User clarified: "Feature flags (enabled/disabled), not separate products"
- Pivot: Bounded context WITH optional integration
- **Result:** Architecture that serves NPD-only AND NPD+Production scenarios

**4. Concrete Deliverables:**
- 7 core tables (npd_projects, formulations, trials, costing, risks, documents, events)
- 4 table modifications (work_orders, products, boms, production_outputs)
- 5 shared services (VersioningService, RLSService, AuditLogService, ApprovalsService, StorageService)
- Handoff wizard (5-step flow with validation)
- **Result:** Clear MVP scope (not vague "NPD module")

---

### Areas for Further Exploration

**1. Finance Module Integration (Phase 2):**
- How does Finance Module approve standard cost? (workflow, API contract)
- Overhead allocation for trials (if Finance exists)
- Budget tracking (project spend vs budget per gate)

**2. Cross-org Collaboration (Future):**
- Can NPD projects be shared across orgs? (R&D firm + contract manufacturer)
- RLS policy adjustments (guest access, limited permissions)
- Event sharing (external org subscribes to NPD.HandoffRequested)

**3. Regulatory Compliance (Food-specific):**
- FDA pre-market notification automation (Form 2541a)
- FSMA 204 traceability requirements (KDEs for NPD trials)
- HACCP plan automation (auto-generate from formulation + process)

**4. Mobile Scanner for Lab Trials:**
- How do lab techs use Scanner for trials? (tablet, not barcode gun)
- Scan ingredients → record trial parameters → photo results
- Offline mode in lab (no WiFi) + sync when back online

**5. UX Design for NPD Module:**
- Mobile vs Desktop priorities (R&D uses desktop, but QA/trials mobile)
- Kanban board vs Timeline view (which is primary?)
- Handoff wizard UX (5 steps too many? Collapse to 3?)

---

### Recommended Follow-up Techniques

**For PRD Creation (Priority #1):**
- **Mind Mapping:** Visualize NPD domain (entities, relationships, workflows)
- **User Story Mapping:** Break down epics (Stage-Gate, Formulation, Handoff, Trials)

**For API Design (Priority #2):**
- **API Contract Testing:** Define contracts → mock → test before implementation
- **Event Storming:** Map all events (NPD.X) and event handlers

**For UX Design (Priority #3):**
- **Wireframing:** Low-fi sketches → Figma → interactive prototype
- **User Testing:** R&D Lead walkthrough (think-aloud protocol)

---

### Questions That Emerged

**1. Migration Path (NPD-only → +Production):**
- **Q:** How do we handle incomplete NPD projects during migration? (draft formulations)
- **A:** Migration wizard filters: Only "approved" projects (gate G3+) are migrated

**2. Financial Approval Workflow:**
- **Q:** Who approves standard cost if Finance Module doesn't exist yet?
- **A:** Admin or NPD Lead manually enters "approved" cost (no workflow in MVP)

**3. Pilot WO vs Production WO:**
- **Q:** Can pilot WO be converted to production WO? (scale-up)
- **A:** No conversion - pilot is separate entity (small batch, trial routing)
- **Rationale:** Pilot → Production requires new WO (different routing, batch size)

**4. Allergen Cross-Contamination:**
- **Q:** Does NPD auto-detect allergen risks from formulation? (e.g., "contains peanuts + milk")
- **A:** MVP: Display allergens from składniki (reużyj `allergens` table)
- **P2:** Cross-contamination warnings (if production line handles peanuts)

**5. Document Approval (Compliance Docs):**
- **Q:** Do compliance docs need approval before handoff? (e.g., HACCP plan)
- **A:** MVP: Manual check (upload required, no approval workflow)
- **P3:** Approval workflow (Regulatory → approve → publish)

---

### Next Session Planning

**Immediate Next Steps (Week 1-2):**

**1. PRD Creation Session (8-12 hours):**
- Transform brainstorming results → structured PRD
- Define API contracts (NPDProjectsAPI, FormulationsAPI, HandoffAPI)
- Document integration points (table modifications, shared services)
- **Preparation:** Review brainstorming doc, MonoPilot architecture.md

**2. Architecture Review (2 hours):**
- Present Bounded Context approach to Tech Lead
- Validate event sourcing pattern (npd_events table, retry mechanism)
- Review shared VersioningService design
- **Preparation:** Draft VersioningService interface

**3. Stakeholder Interviews (4-6 hours):**
- R&D Lead: Formulation workflow, trial management pain points
- Finance: Costing approval requirements, standard cost calculation
- Production: Handoff expectations, pilot WO setup
- **Preparation:** Interview guide (20 questions per stakeholder)

---

**Suggested Follow-up Topics:**
1. **NPD Module PRD** (transform brainstorming → PRD)
2. **NPD Architecture Document** (bounded context, event sourcing, integrations)
3. **NPD UX Design** (wireframes, workflows, prototypes)
4. **NPD Database Schema** (migrations, RLS policies, VersioningService)

**Recommended Timeframe:**
- **Week 1-2:** PRD + Architecture Document
- **Week 3-4:** Database Schema + VersioningService
- **Week 5-6:** Handoff Wizard Prototype
- **Week 7-9:** Full MVP Development + E2E Tests

**Preparation Needed:**
1. Review MonoPilot existing modules (Technical, Planning, Production, Warehouse)
2. Study food manufacturing NPD best practices (Stage-Gate International, APQP)
3. Interview R&D stakeholders (pain points, workflows, compliance requirements)
4. Benchmark competitive NPD/PLM systems (Arena, Sciforma, aha.io)

---

_Session facilitated using the BMAD CIS brainstorming framework_

---

_Session facilitated using the BMAD CIS brainstorming framework_
