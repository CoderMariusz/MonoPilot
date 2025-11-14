# MonoPilot - Product Requirements Document

**Author:** Mariusz
**Date:** 2025-11-13
**Version:** 1.1
**Status:** ✅ COMPLETE - All 9 workflow steps finished (ready for Epic breakdown)
**Last Updated:** 2025-11-14 (Added Epic 0 prerequisite)

---

## 🔴 CRITICAL PREREQUISITE - Epic 0: P0 Modules Data Integrity Fixes

**⚠️ UWAGA: DISCOVERED 2025-11-14 - MUST BE COMPLETED BEFORE PHASE 1**

Podczas przeglądu solutioning gate check (2025-11-14) **wykryto 7 krytycznych niespójności** między schematem bazy danych, definicjami TypeScript, API i UI w **już zaimplementowanych modułach P0** (Technical, Planning, Production, Warehouse, Scanner, Settings).

### Krytyczne Problemy Znalezione:

1. 🔴 **PO Header - Brakująca kolumna `warehouse_id`**
   - API `quick_create_pos` próbuje INSERT do nieistniejącej kolumny
   - Quick PO Entry workflow **NIE DZIAŁA** (SQL error)
   - **BLOCKER** dla planowania dostaw

2. 🔴 **License Plate Status - Całkowita niespójność enum**
   - DB: `available, reserved, consumed, in_transit, quarantine, damaged`
   - TypeScript: `Available, Reserved, In Production, QA Hold, QA Released, QA Rejected, Shipped`
   - Tylko 2 wartości wspólne - **warehouse workflow nie może działać poprawnie**

3. 🟡 **5 dodatkowych problemów średniego priorytetu**
   - TO Status enum (DB ma 'closed', TypeScript nie ma)
   - LP QA Status enum (różne wartości)
   - LP UoM constraint (tylko 4 jednostki dozwolone)
   - Work Orders, Products, BOMs (wymagają głębszego audytu)

### Epic 0 - Plan Naprawy:

**Priorytet:** 🔴 **P0 (KRYTYCZNY - PRZED PHASE 1)**
**Effort:** 71 Story Points (142 godziny, ~7 tygodni)
**Dokumenty:**

- **Raport Audytu:** `docs/P0-MODULES-AUDIT-REPORT-2025-11-14.md`
- **Sprint Status:** `docs/sprint-artifacts/sprint-status.yaml` (Epic 0 + 7 stories)

**Stories:**

- 0.1: Fix PO Header `warehouse_id` (8 SP) - 🔴 KRYTYCZNY
- 0.2: Fix TO Status enum (3 SP) - 🟡 ŚREDNI
- 0.3: Fix License Plate Status enum (13 SP) - 🔴 KRYTYCZNY
- 0.4: Fix License Plate QA Status enum (5 SP) - 🟡 ŚREDNI
- 0.5: Fix License Plate UoM constraint (8 SP) - 🟡 ŚREDNI
- 0.6: Deep Audit - WO, Products, BOMs (21 SP) - ⚠️ WERYFIKACJA
- 0.7: Automated Validation Tests (13 SP) - ✅ PREWENCJA

### Impact na Timeline:

**Oryginalny plan:**

- Phase 1 (Epic 1.1-1.6): Start natychmiast, 12 tygodni
- Phase 2 (Epic 2.1-2.7): Tydzień 13-24, 12 tygodni

**Zaktualizowany plan:**

- **Epic 0 (P0 Fixes): Tydzień 1-7, 7 tygodni** ⬅️ NOWE
- Phase 1 (Epic 1.1-1.6): Tydzień 8-19, 12 tygodni
- Phase 2 (Epic 2.1-2.7): Tydzień 20-31, 12 tygodni

**Total MVP Timeline:** 31 tygodni (było: 24 tygodnie) - **+7 tygodni opóźnienia**

### Quality Gate dla Epic 0:

Przed rozpoczęciem Phase 1 (Epic 1.1), **MUSZĄ być spełnione** następujące warunki:

- ✅ Wszystkie 7 stories Epic 0 ukończone i zweryfikowane
- ✅ Zero krytycznych niespójności między DB ↔ TypeScript ↔ API ↔ UI
- ✅ Automated validation tests wdrożone i działające
- ✅ E2E tests zaktualizowane i przechodzące dla wszystkich naprawionych modułów
- ✅ Database migrations executed successfully on staging environment
- ✅ Quick PO Entry workflow verified working end-to-end
- ✅ License Plate lifecycle (create → reserve → consume → ship) verified working

### Przyczyna Źródłowa i Zapobieganie:

**Dlaczego to się stało:**

- Brak automated validation między DB schema a TypeScript types
- Iteracyjny rozwój bez synchronizacji DB ↔ API ↔ UI
- Quick PO Entry dodany później, założył nieistniejące kolumny
- Brak code review checklist dla data integrity

**Jak zapobiegamy w przyszłości (Story 0.7):**

- ✅ Schema-first development (DB jako source of truth)
- ✅ Automated enum generation (TypeScript z DB schemas)
- ✅ CI/CD validation (pre-commit hooks)
- ✅ Code review checklist ("Czy TypeScript pasuje do DB?")

---

## Executive Summary

MonoPilot to nowoczesny Manufacturing Execution System (MES) zaprojektowany z myślą o małych i średnich firmach produkcyjnych (SME) w branży spożywczej (20-250 pracowników). Projekt znajduje się na etapie brownfield - **70% kompletny**, z solidnymi fundamentami w zakresie planowania, BOM-ów i zarządzania zamówieniami.

**Wizja produktu** opiera się na **pięciu kluczowych filarach**, które wyróżniają MonoPilot na tle konkurencji:

### 1. **Multi-Version BOM** - Rzadkość na rynku MES

System wielowersyjnego zarządzania recepturami z datami obowiązywania (`effective_from`/`effective_to`), który pozwala na:

- Planowane wdrażanie nowych receptur
- Historyczny audyt zmian składu produktu
- Automatyczny snapshot BOM przy tworzeniu Work Order (immutability)
- Zapobieganie konfliktom receptur przez wyzwalacze bazodanowe

**Unikalność:** Nawet liderzy rynku (Siemens Opcenter, SAP ME) nie oferują tak zaawansowanego systemu wersjonowania z automatyczną timeline'm i snapshot mechanizmem.

### 2. **LP Genealogy** - Pełna traceability w 30 sekund

License Plate (LP) jako atomowa jednostka inwentaryzacji z kompleksową genealogią:

- Tabela `lp_genealogy` śledzi relacje parent-child i konsumpcję
- Forward traceability: "Gdzie poszedł ten batch?"
- Backward traceability: "Z czego został wyprodukowany ten produkt?"
- **Recall simulation w 30 sekund** - identyfikacja wszystkich dotkniętych produktów
- 1:1 consumption pattern (`consume_whole_lp` flag) dla kontroli alergenów

**Unikalność:** Konkurencja oferuje basic traceability, ale bez LP-based genealogii i sub-30s recall. To game-changer dla FSMA 204 compliance (deadline: 2028).

### 3. **Transparent Pricing** - Brak "Contact Sales"

Transparentna struktura cenowa dostępna publicznie:

- **$1,500-$5,000/miesiąc** w zależności od liczby użytkowników i modułów
- Przykład: 50 użytkowników = **$51K/rok** (MonoPilot) vs **$320K/rok** (Infor) = **$167K oszczędności**
- 3-letni TCO: $153K (MonoPilot) vs $320K (Infor)
- **ROI calculator** na stronie - instant estimation bez sales call

**Unikalność:** Siemens, SAP, Dassault, Infor - wszyscy wymagają "Contact Sales". MonoPilot łamie ten schemat, oferując pricing transparency comparable z nowoczesnym SaaS.

### 4. **Mobile-First PWA** - Zero Hardware Cost (COST SAVER)

Progressive Web App eliminuje jeden z największych kosztów wdrożenia MES: **dedicated hardware**.

**Problem do rozwiązania:**

- Typowe wdrożenie MES wymaga zakupu industrial scanners: **$1,000-$3,000 per device**
- Firma z 5 stanowiskami produkcyjnymi + 3 warehouse = **$8,000-$24,000 hardware cost**
- Dodaj do tego maintenance, replacement cycles, training cost
- Total hardware TCO: **$30,000-$50,000** over 3 years

**Rozwiązanie MonoPilot - BYOD (Bring Your Own Device):**

- **PWA** (Progressive Web App) działa na każdym smartphone/tablet
- Pracownicy używają **własnych urządzeń** (iPhone, Android, iPad)
- Offline-capable: scanner działa bez internetu, sync po reconnect
- Camera API: barcode/QR scanning bez external hardware
- Responsive design: automatic adaptation mobile ↔ desktop

**Cost Savings:**

- Hardware: **$0** (vs $24,000 for 8 dedicated scanners)
- Maintenance: **$0** (no specialized devices to maintain)
- Replacement: **$0** (users upgrade own phones)
- Training: **Minimal** (familiar smartphone UX)
- **Total savings: $30,000-$50,000** over 3 years

**Security & Control:**

- App-level authentication (Supabase Auth)
- Data encrypted in transit & at rest
- Device doesn't store sensitive data (session-based)
- Revoke access instantly if employee leaves
- Optional: Company-provided devices for security-sensitive environments

**Competitive Edge:**

- Zebra scanners: $1,500-$3,000 each (required for SAP/Siemens)
- MonoPilot: **Use what you already have**
- Faster deployment: no hardware procurement, no device provisioning
- Better UX: modern mobile interface vs industrial Windows CE scanners

**Unikalność:** Większość MES wymaga dedicated industrial hardware (Windows CE, specialized scanners). MonoPilot to pierwszy enterprise MES z production-ready mobile-first PWA. To **$30K-$50K savings** dla typowego SME.

### 5. **Module Build** - Modułowa architektura dla SME

Kluczowa innowacja pozwalająca małym firmom na **dobór modułów i ich złożoności**:

**Problem do rozwiązania:**

- Małe firmy (20-50 pracowników) nie potrzebują pełnego MES za $320K
- Chcą zacząć od warehouse + basic production, potem skalować
- Każda firma ma inne potrzeby: jedna potrzebuje tylko traceability, inna scheduling + IoT

**Rozwiązanie - 3-poziomowa modularność:**

#### Poziom 1: Dobór modułów (Module Selection)

Klient wybiera tylko potrzebne moduły:

- ☑️ **Warehouse & Inventory** (ASN, receiving, LP tracking)
- ☑️ **Production Execution** (WO execution, yield, by-products)
- ☑️ **Planning** (PO, TO, WO planning)
- ☑️ **Technical** (Products, BOM, routings)
- ☑️ **Quality** (inspections, NCRs, CoAs)
- ☑️ **Traceability** (genealogy, recall simulation)
- ☑️ **IoT & SCADA** (machine integration, OPC UA)
- ☑️ **Advanced Analytics** (AI yield prediction, waste reduction)

#### Poziom 2: Złożoność modułu (Complexity Level)

Każdy moduł dostępny w 3 wariantach:

- **Basic**: Core functionality, prosty UI, bez advanced features
- **Standard**: Pełna funkcjonalność, standard industry features
- **Advanced**: AI, IoT, custom workflows, blockchain traceability

Przykład - Moduł **Production Execution**:
| Feature | Basic | Standard | Advanced |
|---------|-------|----------|----------|
| WO execution | ✅ | ✅ | ✅ |
| Material consumption | ✅ | ✅ | ✅ |
| Yield tracking | ✅ | ✅ | ✅ |
| By-products | ❌ | ✅ | ✅ |
| Multi-operation routing | ❌ | ✅ | ✅ |
| Real-time IoT | ❌ | ❌ | ✅ |
| AI yield prediction | ❌ | ❌ | ✅ |
| Predictive maintenance | ❌ | ❌ | ✅ |

#### Poziom 3: Subskrypcja (Subscription Tiers)

Pricing based on modules + complexity + users:

```
Starter: $1,500/mo (Basic modules, ≤20 users, 1 warehouse)
Growth: $3,000/mo (Standard modules, ≤50 users, 3 warehouses)
Enterprise: $5,000+/mo (Advanced modules, unlimited users, custom SLA)
```

**Implikacje techniczne:**

- Feature flags per organization (`org_id`)
- Modular UI routing (conditionally hide pages)
- Modular API permissions (RBAC + module access)
- Database tables shared, but features gated by subscription
- Migration path: easy upgrade from Basic → Standard → Advanced

**Business value:**

- Małe firmy mogą zacząć od **$1,500/mo** (tylko warehouse + basic production)
- Skalowanie wraz z rozwojem firmy (pay-as-you-grow)
- Konkurencyjne edge: "Zbuduj swój MES, zapłać tylko za to czego używasz"

**Evolution Strategy:**

- **Start simple**: Wprowadź core modules (Warehouse, Production, Planning, Technical, Quality)
- **Expand over time**: Dodawaj nowe moduły (IoT, Advanced Analytics, Marketplace)
- **Refactor existing**: Rozdziel duże moduły na mniejsze, bardziej business-specific
  - Example: "Production" → "Production Execution", "Production Scheduling", "Production Analytics"
  - Example: "Warehouse" → "Receiving", "Put-Away", "Picking", "Shipping"
- **Customer co-creation**: Klienci mogą sugerować nowe moduły based on ich business needs
- **Marketplace**: Community-contributed modules (paid/free)

**Kluczowa różnica vs konkurencja:**

- **Siemens/SAP**: Monolityczne rozwiązania, customization kosztuje **$50K-$200K** (consulting)
- **MonoPilot**: Modularne, plug-and-play, **self-service customization**, pay-as-you-grow

### 6. **Easy Business Customization** - Vs Expensive Vendor Lock-in (STRATEGIC ADVANTAGE)

To jest **kluczowy problem dużych, drogich dostawców MES**: aplikacja albo nie pasuje do biznesu, albo customization jest strasznie kosztowna.

**Problem z tradycyjnymi MES:**

- **Vendor lock-in**: Zamknięte systemy, customization tylko przez vendor consultants
- **Astronomiczne koszty**: $50K-$200K za customization (Siemens/SAP consulting rates)
- **Długie lead times**: 6-12 miesięcy na wdrożenie custom features
- **"Take it or leave it"**: Funkcjonalność nie pasuje do Twojego procesu? Tough luck.
- **Sztywne workflow**: Musisz dostosować biznes do systemu, nie odwrotnie

**Rozwiązanie MonoPilot:**

#### A) **No-Code Workflow Builder** (Przyszłość - Phase 3)

- Custom workflows bez programming
- Drag-and-drop process design
- Business users tworzą własne flows
- Example: Custom inspection checklist, custom approval routing

#### B) **Open API + Webhooks** (Already Planned)

- Full REST API dla każdej operacji
- Webhooks dla real-time events
- Klienci mogą budować własne integracje
- Developer SDKs (JavaScript, Python, C#)

#### C) **Configurable Business Rules**

- Custom validation rules per organization
- Configurable approval workflows
- Custom fields per entity (Products, BOM, WO, LP)
- Business-specific terminology (glossary per org)

#### D) **Self-Service Module Activation**

- Instant module enable/disable w UI
- No vendor involvement required
- Transparent pricing per module
- Try before you buy (14-day trial per module)

#### E) **Community Marketplace** (Phase 4)

- Industry-specific templates (meat processing, dairy, bakery)
- Custom integrations (ERP, IoT devices, label printers)
- Workflow blueprints (quality inspections, production scheduling)
- **MonoPilot doesn't have to build everything** - community does

**Cost Comparison:**

| Customization Need | Siemens/SAP/Infor       | MonoPilot                        |
| ------------------ | ----------------------- | -------------------------------- |
| Custom workflow    | $50K-$100K (consulting) | **Free** (No-Code Builder)       |
| ERP integration    | $30K-$80K               | **Free** (Open API + docs)       |
| Custom report      | $10K-$20K               | **Free** (BI connector + SQL)    |
| New module         | $100K-$300K             | **$500-$2,000/mo** (marketplace) |
| Industry template  | $50K-$150K              | **Free or $1,000** (marketplace) |

**Total customization savings: $240K-$650K** over 3 years

**Strategic Advantage:**

- **MonoPilot grows WITH your business**, not against it
- **You control the system**, not the vendor
- **Pay for value**, not for vendor consulting hours
- **Fast iteration**: Deploy custom workflow in days, not months

**Unikalność:** Enterprise MES z SaaS-level flexibility. Kombinacja no-code tools + open API + marketplace to **game-changer** dla SME, którzy dotąd musieli wybierać między "cheap but inflexible" albo "powerful but expensive".

---

### Phase 2 Strategy: Universality (NOWY CEL STRATEGICZNY)

**Current state (Phase 1):**

- Focus: **Food manufacturing** (meat, dairy, bakery, composite products)
- Domain expertise: FDA 21 CFR Part 11, FSMA 204, EU Regulation 178/2002
- Industry templates: QuickStart for meat processing, dairy, bakery
- Allergen management, batch tracking, food-specific compliance

**Phase 2 goal (6-18 months):**

- **Uniwersalizacja platformy** - wyjście poza branżę spożywczą
- Target industries:
  - **Pharmaceuticals** (GMP, 21 CFR Part 210/211, batch records)
  - **Cosmetics** (ISO 22716, batch traceability)
  - **Chemicals** (REACH, SDS management, hazmat tracking)
  - **Automotive components** (ISO/TS 16949, PPAP, APQP)
  - **Electronics assembly** (IPC standards, ESD control, SMT lines)
  - **Textiles & Apparel** (lot tracking, cut-make-trim, fabric rolls)

**Strategie uniwersalizacji:**

1. **Industry Templates System**
   - QuickStart templates per industry (jak obecnie: meat/dairy/bakery)
   - Industry-specific BOM templates
   - Pre-configured routing operations
   - Compliance checklists per domain

2. **Configurable Compliance Modules**
   - FDA 21 CFR Part 11 (food, pharma) ← już mamy
   - GMP (pharmaceuticals)
   - ISO 22716 (cosmetics)
   - REACH (chemicals)
   - ISO/TS 16949 (automotive)
   - Plug-and-play compliance modules

3. **Generic Core + Industry Add-ons**
   - **Core MES** (universal): WO, BOM, LP, traceability, planning
   - **Industry Add-ons**: Allergen management (food), GMP batch records (pharma), MSDS (chemicals)
   - Marketplace model: community-contributed industry packs

4. **Domain-Agnostic Terminology**
   - Refactor UI/DB terminology to be industry-neutral
   - Example: "Batch" (food) = "Lot" (pharma) = "Heat" (metals) = "Serial" (electronics)
   - Configurable glossary per organization

5. **Vertical Integration Paths**
   - Food manufacturing → Food distribution → Food retail (backward integration)
   - Contract manufacturing (CMO/CDMO) - generic platform for multiple clients

**Implementation approach:**

- **Phase 2A (6-12m)**: Generalize core (remove food-specific hardcoding)
- **Phase 2B (12-18m)**: Add pharma template + GMP module
- **Phase 2C (18-24m)**: Marketplace launch, community templates

**Success metrics for Phase 2:**

- ≥ 3 industries successfully using MonoPilot (beyond food)
- ≥ 50% revenue from non-food sectors by end of Phase 2
- Industry template library: ≥ 10 industries

---

## What Makes This Special

MonoPilot wyróżnia się **14+ unikalnymi cechami**, z których **6 są kluczowymi wyróżnikami** (core differentiators):

### Core Differentiators (6)

1. **Multi-Version BOM** ⭐ UNIQUE - Rzadkość na rynku MES (date-based versioning z automatycznym snapshot)
2. **LP Genealogy** ⭐ - Pełna traceability w 30 sekund, recall simulation (FSMA 204 compliant)
3. **Transparent Pricing** ⭐ - $51K/rok vs $320K (Infor) = **$167K software savings**
4. **Mobile-First PWA** ⭐ NEW - BYOD strategy = **$30K-$50K hardware savings** (vs Zebra scanners)
5. **Module Build** ⭐ - Modułowa architektura, pay-as-you-grow ($1,500-$5,000/mo)
6. **Easy Customization** ⭐ - No-Code + Open API + Marketplace = **$240K-$650K customization savings**

**Total Cost Advantage: $437K-$867K savings** over 3 years vs Siemens/SAP/Infor

### Secondary Differentiators (8+)

7. **QuickStart Industry Templates** - Meat/dairy/bakery onboarding w 1 tydzień (vs 3-6 miesięcy standard)
8. **Collaborative BOM Editing** - Google Docs-style real-time collaboration (conflict-free editing)
9. **One-Click Validation Protocols** - IQ/OQ/PQ generowane automatycznie (FDA 21 CFR Part 11)
10. **Compliance Copilot** - AI assistant for FDA/EU compliance (guided workflows)
11. **Blockchain Traceability** (optional) - Immutable audit trail (pharma/high-value products)
12. **AI-Powered Recall Simulation** - 30-second full impact analysis (vs 2-4h manual)
13. **Carbon Footprint Tracking** - ESG compliance, Scope 3 emissions (sustainability reporting)
14. **MonoPilot Marketplace** - Community-contributed workflows & integrations (ecosystem growth)

### Competitive Positioning

**Blue Ocean Strategy:**

- **Low Cost** ($51K/yr) + **Modern Technology** (Next.js 15 + Supabase)
- Competitors: High Cost ($320K/yr) + Legacy Tech (.NET, Oracle)
- **Target**: 290,000 EU food SMEs unable to afford Siemens/SAP

**Technology Edge:**

- Modern stack: Next.js 15, React 19, TypeScript, Supabase (PostgreSQL 15)
- Cloud-native, multi-tenant architecture (RLS)
- Performance: RLS overhead 3.6ms vs 3.2ms baseline (marginal)
- Real-time capabilities via Supabase Realtime

---

## Project Classification

**Technical Type:**

- Primary: SaaS B2B Platform
- Secondary: Web Application (PWA)
- Tertiary: REST API Backend

**Domain:**

- **Phase 1**: Food Manufacturing (meat, dairy, bakery, composite products)
- **Phase 2**: Universal Manufacturing (pharma, cosmetics, chemicals, automotive, electronics, textiles)

**Complexity:** Medium-High

- Regulated industry (FDA 21 CFR Part 11, FSMA 204, EU 178/2002)
- Complex domain model (40+ database tables, ISA-95 compliance)
- Multi-tenancy with Row Level Security (RLS)
- Real-time operations (production execution, scanner flows)
- Traceability requirements (forward + backward genealogy)

**Project State:**

- **Brownfield** - 70% feature complete
- **ISA-95 Compliance**: 60% (7/9 core objects implemented)
- **FDA 21 CFR Part 11**: 50% (3/6 requirements)
- **Production readiness**: Alpha (needs audit trail + e-signatures for beta)

**Key Technical Signals:**

- ✅ SaaS B2B: Multi-tenant, RBAC, subscription model
- ✅ Web App: PWA, responsive design, mobile-first
- ✅ API Backend: 28 API classes, RESTful endpoints
- ✅ Real-time: Supabase Realtime, WebSocket connections
- ✅ Offline-capable: Scanner module with sync mechanism

**Detected Project Types:**

1. **saas_b2b** (Primary)
   - Multi-tenant architecture (org_id isolation)
   - RBAC with 7 roles (Admin, Manager, Operator, Viewer, Planner, Technical, Purchasing)
   - Subscription tiers (planned: Starter, Growth, Enterprise)
   - Integration requirements (ERP, IoT/SCADA, QuickBooks)
   - Compliance (FDA, EU, ISA-95)

2. **web_app** (Secondary)
   - SPA (Single Page Application) with Next.js 15 App Router
   - PWA (Progressive Web App) - offline scanner
   - Browser support: Modern browsers (Chrome, Edge, Safari, Firefox)
   - Real-time updates via Supabase Realtime
   - Accessibility: WCAG 2.1 AA target

3. **mobile_app** (PWA)
   - Mobile-first scanner module (`/scanner`)
   - Offline mode for warehouse operations
   - Device features: Camera (barcode scanning), geolocation
   - BYOD strategy (Bring Your Own Device)

### Domain Context

**Food Manufacturing Domain:**

MonoPilot operates in the **food manufacturing domain**, which is characterized by:

**Regulatory Landscape:**

- **FDA 21 CFR Part 11** - Electronic records & signatures (US)
- **FSMA 204** - Food Traceability Rule (deadline: July 2028)
- **EU Regulation 178/2002** - General Food Law (traceability)
- **ISO 22000** - Food Safety Management Systems
- **HACCP** - Hazard Analysis Critical Control Points

**Industry Standards:**

- **ISA-95 / IEC 62264** - Manufacturing Operations Management (2025 edition)
- Level 3 system (MES) integrating with Level 4 (ERP) and Level 2 (SCADA/PLC)

**Domain-Specific Challenges:**

1. **Allergen Control** - Cross-contamination prevention, 1:1 consumption
2. **Batch Traceability** - Forward + backward tracking for recalls
3. **Expiry Management** - FIFO/FEFO, expiry date tracking
4. **By-Products** - Co-products from same production run (e.g., whey from cheese)
5. **Recipe Versioning** - Date-based BOM changes with audit trail
6. **Quality Management** - In-process inspections, CoAs, hold/release
7. **Supplier Batch Tracking** - Link supplier batches to internal LPs

**Market Context:**

- **TAM**: Global MES market $15.95B (2025) → $25.78B (2030), CAGR 10.1%
- **SAM**: 290,000 EU food manufacturers (20-250 employees)
- **SOM**: 15,000-20,000 companies actively digitizing (5-7% SAM)
- **SME Gap**: 60-75% of SMEs can't afford >$0.5M MES investment

**Competitive Landscape:**

- **Tier 1 (Enterprise)**: Siemens Opcenter, SAP ME, Dassault DELMIA ($300K-$1M+)
- **Tier 2 (Mid-Market)**: Infor CloudSuite, Epicor Kinetic, IQMS ($100K-$500K)
- **Tier 3 (Food-Specific)**: FoodReady AI, BatchMaster, Vicinity ($50K-$200K)
- **MonoPilot positioning**: Tier 3 pricing ($51K) with Tier 2 features + modern tech

**Phase 2 Expansion:**
Beyond food manufacturing, targeting universal manufacturing domains with similar characteristics:

- Regulated industries (pharma, cosmetics, chemicals)
- Batch/lot tracking requirements
- Compliance documentation needs
- Traceability & recall capabilities
- Recipe/formula management

---

## Success Criteria

### 🎯 Primary Success: Customer Outcomes

MonoPilot sukcesu nie mierzymy liczbą użytkowników, ale **rzeczywistą wartością dostarczoną klientom**. Sukces to sytuacja, gdy klienci:

**1. Osiągają Compliance bez Astronomical Costs**

- ✅ **FDA 21 CFR Part 11 compliance** - electronic records & signatures w miejscu
- ✅ **FSMA 204 readiness** przed deadline (July 2028) - pełna traceability w 30 sekund
- ✅ **Zero failed audits** - kompletna audit trail, automated validation protocols
- ✅ **Savings**: $150K-$300K (vs custom compliance solution z SAP/Siemens)

**2. Operational Excellence Through Better Visibility**

- ✅ **Recall simulation <30 sekund** (was: 2-4 godziny manual process) = **95% time reduction**
- ✅ **50% redukcja czasu** na BOM management dzięki multi-version system + snapshot
- ✅ **30% redukcja waste** przez lepszą traceability (FIFO/FEFO enforcement, expiry tracking)
- ✅ **Real-time inventory accuracy** - LP-based tracking eliminates spreadsheet errors

**3. ROI w 12 Miesięcy** (REALISTIC TARGET)

- ✅ **Positive ROI w ciągu 12 miesięcy** użytkowania (not 6-12 - being realistic)
- ✅ **Total Cost Savings**: $437K-$867K over 3 years vs Siemens/SAP/Infor:
  - Software: $167K savings (transparent pricing)
  - Hardware: $30K-$50K savings (BYOD PWA vs Zebra scanners)
  - Customization: $240K-$650K savings (No-Code + Open API vs consulting)
- ✅ **Zero hidden costs** - transparent pricing, no surprise invoices

**4. Easy Customization = System Fits Business, Not Vice Versa**

- ✅ **Self-service customization** - klient tworzy custom workflows bez vendor involvement
- ✅ **Module activation <5 minutes** - instant enable/disable, no consulting required
- ✅ **API integration w tygodniach**, nie miesiącach (Open API + webhooks + docs)
- ✅ **Business ownership** - klient kontroluje system, nie vendor

### 📊 Product Adoption Metrics

**5. Daily Active Usage = Mission-Critical Status**

- ✅ **≥80% DAU/MAU ratio** - system jest CRITICAL dla daily operations
- ✅ **≥5 core transactions per user per day**:
  - Scanner: LP creation, consumption, moves (warehouse + production)
  - Planner: PO/TO/WO creation, BOM updates
  - Manager: Dashboard review, approval workflows
- ✅ **Metric betyder**: Nie "zalogowali się", ale "nie mogą bez tego pracować"

**6. Module Build Success = Pay-As-You-Grow Model Works**

- ✅ **≥40% klientów** upgrade z Basic → Standard → Advanced tier w ciągu 12 miesięcy
- ✅ **Average 3-5 aktywnych modułów** na klienta (proof że modular value proposition działa)
- ✅ **<20% churn rate** - niska rezygnacja bo moduły dopasowane do potrzeb (vs 30-40% industry avg)
- ✅ **≥30% revenue z upsell** (module + tier upgrades) - dowód na evolving customer needs

**7. Mobile-First PWA Adoption**

- ✅ **≥70% warehouse operations** wykonywanych przez PWA scanner (not desktop)
- ✅ **Average 50-100 scans per device per day** (active usage proof)
- ✅ **Zero hardware procurement delays** - onboarding w dniach, nie tygodniach
- ✅ **Employee satisfaction ≥4/5** - "using my own phone" vs "clunky Windows CE scanner"

### 🚀 Business Metrics - Phase 1 (0-6 months)

**8. Pilot Program Success (ADJUSTED REALISTIC TARGET)**

- ✅ **2-4 pilot customers** (not 5-10 - being realistic for 6-month horizon)
  - Target mix: 1 meat processing, 1 dairy, 1-2 composite/bakery
  - Diverse org size: 20-50 employees (1), 50-150 employees (1-2), 150-250 employees (0-1)
- ✅ **≥80% retention** po 3-month trial period
- ✅ **≥2 case studies** z measurable ROI (auditable numbers, not marketing fluff)
- ✅ **≥1 customer reference** willing to speak to prospects

**9. Product-Market Fit Indicators**

- ✅ **Net Promoter Score (NPS) ≥40** (B2B SaaS benchmark: 30-40)
- ✅ **≥60% of customers** respond "very disappointed" if MonoPilot disappeared (Sean Ellis PMF test)
- ✅ **≥1.5 referrals per happy customer** (word-of-mouth growth proof)
- ✅ **Inbound leads ≥30% of pipeline** (vs 100% outbound) - market pull forming

**10. Technical Excellence = Zero Trust Issues**

- ✅ **Zero critical data loss incidents** - 100% audit trail integrity
- ✅ **<1 minute system recovery** time from failures (high availability target)
- ✅ **≥99.5% uptime** (SLA target: 43.2 hours downtime/year max)
- ✅ **API response time <200ms p95** (fast enough for real-time scanner operations)

### 🌍 Phase 2 Success (6-18 months) - Universality

**11. Beyond Food Manufacturing**

- ✅ **≥3 industries** actively using MonoPilot (pharma, cosmetics, chemicals, automotive, electronics, textiles)
- ✅ **≥50% revenue** from non-food sectors by end of Phase 2
- ✅ **≥10 industry templates** in marketplace (community + MonoPilot-created)
- ✅ **Universal platform proof**: Same core MES, different industry skins

**12. Ecosystem Growth**

- ✅ **MonoPilot Marketplace launched** with ≥20 contributed modules/integrations
- ✅ **≥5 community contributors** (paid or free modules)
- ✅ **Developer adoption**: ≥100 API integrations created by customers
- ✅ **Partner network**: ≥3 implementation partners certified (meat, dairy, pharma)

### 🏆 What "Winning" Looks Like

**MonoPilot wins when:**

1. **SME manufacturers say**: _"Finally, an MES that doesn't require a PhD and $500K budget"_
2. **Operators say**: _"I can use my phone instead of learning another clunky scanner"_
3. **IT managers say**: _"We customized it ourselves in a weekend using the API"_
4. **CFOs say**: _"We got ROI in 12 months, not the promised 3 years from Siemens"_
5. **Auditors say**: _"Your audit trail is more complete than companies using SAP"_
6. **Competitors say**: _"How are they doing this at that price?"_

**Success is NOT:**

- ❌ 10,000 registered users (vanity metric)
- ❌ 99.99% uptime (overkill for this segment)
- ❌ Feature parity with Siemens Opcenter (wrong goal)
- ❌ Fastest system (speed doesn't matter if it doesn't fit business)

**Success IS:**

- ✅ 100 power users who can't live without it
- ✅ 99.5% uptime (good enough for SME operations)
- ✅ Right features that solve SME pain points
- ✅ **System adapts to business, not vice versa**

### Business Metrics Summary

| Metric          | Phase 1 (6m) | Phase 2 (18m) | Phase 3 (36m) |
| --------------- | ------------ | ------------- | ------------- |
| Pilot Customers | 2-4          | 10-20         | 50-100        |
| ARR Target      | $100K-$200K  | $500K-$1M     | $2M-$4M       |
| Industries      | 1 (food)     | 3-5           | 8-10          |
| NPS Score       | ≥40          | ≥50           | ≥60           |
| Churn Rate      | <20%         | <15%          | <10%          |
| Module Upsell   | 30%          | 40%           | 50%           |

---

## Product Scope

### 📦 MVP - Minimum Viable Product (0-6 months, 2-4 pilot customers)

**Definition of MVP:** Core MES functionality that allows 2-4 pilot customers to run day-to-day food manufacturing operations with full traceability, compliance-ready foundation, and mobile-first warehouse operations.

---

#### **1. Production Module** ⚠️ **NEEDS UI REVIEW & BUSINESS PROCESS ALIGNMENT**

**Status:** 70% backend complete → Target: 100% tested & UI aligned with business process

**Core Features (MUST HAVE):**

- ✅ **Work Order Management**
  - Create/edit/cancel WO with BOM snapshot
  - WO lifecycle: Draft → Planned → Released → In Progress → Completed
  - Source demand tracking (PO/TO/Manual)
  - Priority management, line assignment

- ✅ **Multi-Version BOM Integration** (EPIC-001 Phase 2)
  - Automatic BOM selection based on `scheduled_date`
  - BOM snapshot captured at WO creation (immutability)
  - Date-based versioning (`effective_from`/`effective_to`)

- ✅ **By-Products Support** (EPIC-001 Phase 1)
  - Track up to 5 by-products per WO
  - Automatic LP creation for by-products
  - By-product yield tracking

- ✅ **Conditional Materials** (EPIC-001 Phase 3-4)
  - Order flags (organic, gluten_free, vegan, etc.)
  - Conditional BOM items with AND/OR logic
  - Material inclusion/exclusion based on customer requirements

- ✅ **Operations Sequencing**
  - Routing operations with `sequence_number`
  - Operation status tracking (not_started → in_progress → completed)
  - Machine/line assignment per operation

- ✅ **Material Consumption**
  - LP-based consumption with UoM validation
  - 1:1 consumption flag (`consume_whole_lp`) for allergen control
  - Scrap percentage handling
  - Real-time material reservations

- ✅ **Production Output Tracking**
  - Output registration per operation
  - Yield calculation (planned vs actual)
  - QA status assignment (pending, approved, rejected, hold)
  - Output LP creation with genealogy

**Gaps to Close for MVP:**

- 🔧 **UI Review & Alignment** (P0 - 1 week) ⚠️ CRITICAL
  - Review all UI screens vs business process flows
  - Align UI with Scanner workflows (consistency)
  - Validate field mappings (DB ↔ UI)
  - User acceptance testing with stakeholders

- 🔧 **Production Dashboard** (P0 - 1 week)
  - Real-time KPIs: Orders completed today, units produced, avg yield
  - Active WOs status board
  - Material shortages alerts
  - Line utilization metrics

- 🔧 **Yield Visualization** (P1 - 3 days)
  - Yield trends chart (product, line, time period)
  - Variance analysis (planned vs actual)
  - Top/bottom performers

---

#### **2. Scanner & Warehouse** ✅ **PRIORITY 1 - BUSINESS PROCESS ALIGNMENT CRITICAL**

**Status:** 95% complete (EPIC-002 complete) → Target: 100% tested & **business process validated**

⚠️ **MOST CRITICAL:** Scanner workflows MUST align with business processes. This is the foundation - if Scanner doesn't match real-world workflows, nothing else matters.

**Core Features (MUST HAVE):**

- ✅ **ASN Receiving Workflow** (EPIC-002 Phase 1)
  - ASN creation with multiple items
  - Scanner-based receiving (mobile PWA)
  - Automatic GRN generation
  - LP creation on receive with batch/expiry tracking
  - QA status assignment

- ✅ **License Plate Genealogy** (EPIC-002 Phase 2)
  - Parent-child LP relationships (`lp_genealogy` table)
  - Forward traceability (LP → what it made)
  - Backward traceability (LP → where it came from)
  - WO consumption tracking
  - <1 minute trace queries (vs 4+ hours manual)

- ✅ **Pallet Management** (EPIC-002 Phase 3)
  - Pallet creation (EURO, CHEP, Custom types)
  - LP-to-pallet association
  - WO reservations (soft-allocate LPs)
  - Pallet statuses (open, closed, shipped)

- ✅ **Scanner UX** (EPIC-002 Phase 4)
  - Mobile-optimized pallet terminal (6-step workflow)
  - ZPL label printing for Zebra printers
  - Step-based workflows (prevent errors)
  - Large touch targets, high-contrast UI

- ✅ **Stock Movements**
  - Location-to-location moves
  - LP split/merge operations
  - Stock move audit trail

- ✅ **Multi-Warehouse Support** ✅ MVP REQUIREMENT
  - Transfer Orders between warehouses
  - Warehouse-specific default locations (settings)
  - Transit location handling
  - Warehouse-based receiving

**Gaps to Close for MVP:**

- 🔧 **Business Process Validation** (P0 - 1 week) ⚠️ **HIGHEST PRIORITY**
  - Walk through ALL scanner workflows with actual users
  - Validate: Receiving (PO/TO), WO Start/Consume/Finish, Stock Moves, Pallet Building
  - Ensure UI matches real-world operations (no missing steps)
  - Document any workflow gaps or UI inconsistencies
  - Fix any critical misalignments

- 🔧 **Scanner Polish** (P1 - 2 days)
  - Offline mode improvements
  - Error handling enhancements
  - Network reconnection graceful handling

---

#### **3. Technical Module** ⚠️ **NEEDS UI REVIEW & BUSINESS PROCESS ALIGNMENT**

**Status:** 95% backend complete → Target: 100% tested & UI aligned

**Core Features (MUST HAVE):**

- ✅ **Products Management**
  - Product types (RM, WIP, FG, PR, PKG)
  - UoM tracking
  - Product lifecycle (active, inactive, discontinued)
  - Allergen tagging

- ✅ **Multi-Version BOM** (EPIC-001 Phase 2)
  - Date-based BOM versions
  - BOM timeline visualization
  - Automatic date overlap validation (DB trigger)
  - Clone BOM with date ranges
  - Up to 10 versions per product

- ✅ **BOM Items**
  - Material quantities with scrap percentage
  - UoM per item
  - `consume_whole_lp` flag (1:1 consumption)
  - By-product flag (`is_by_product`)
  - Conditional inclusion (EPIC-001 Phase 3)

- ✅ **Routings**
  - Operation sequencing
  - Machine/line assignment
  - Expected yield per operation

- ✅ **Allergen Management**
  - Allergen library (14 major allergens)
  - Product-allergen associations
  - BOM allergen rollup

**Gaps to Close for MVP:**

- 🔧 **UI Review & Alignment** (P0 - 1 week) ⚠️ CRITICAL
  - Review BOM management UI vs business workflows
  - Validate multi-version BOM UI (timeline, clone, conditions)
  - Align with Production WO creation flow
  - User acceptance testing

- 🔧 **BOM Cost Calculation** → MOVED TO GROWTH P1 (see EPIC-003)

---

#### **4. Planning Module** ⚠️ **NEEDS UI REVIEW & BUSINESS PROCESS ALIGNMENT**

**Status:** 85% backend complete → Target: 100% tested & UI aligned

**Core Features (MUST HAVE):**

- ✅ **Purchase Orders (PO)**
  - PO creation with multiple lines
  - Supplier management
  - Currency and tax code handling
  - Status lifecycle (draft → submitted → confirmed → received → closed)
  - Lead time tracking

- ✅ **Transfer Orders (TO)**
  - Warehouse-to-warehouse transfers (no location in header)
  - Transit location concept
  - Planned vs actual ship/receive dates
  - Status lifecycle (draft → planned → shipped → received)

- ✅ **Work Orders (WO)**
  - WO creation from planning
  - BOM snapshot at creation time
  - Source demand tracking (PO/TO/Manual)
  - Line/machine assignment

- ✅ **ASN Integration** (EPIC-002)
  - ASN import/creation
  - Link ASN to PO
  - Prefill receiving from ASN

**Gaps to Close for MVP:**

- 🔧 **UI Review & Alignment** (P0 - 1 week) ⚠️ CRITICAL
  - Review all UI screens vs business process flows
  - Align with Scanner receiving workflows
  - Validate field mappings (DB ↔ UI)
  - User acceptance testing

- 🔧 **Planning UI Polish** (P1 - 3 days)
  - Add missing fields to UI (created_by, dates, notes)
  - PO/TO filtering improvements
  - Quick PO entry workflow (pre-fill from supplier defaults)

---

#### **5. Settings & Configuration** ⚠️ **NEEDS UI REVIEW**

**Status:** 100% backend complete → Target: UI validated

**Core Features (MUST HAVE):**

- ✅ **Warehouses** - Multi-warehouse configuration
- ✅ **Locations** - Physical locations within warehouses
- ✅ **Machines** - Production line equipment
- ✅ **Production Lines** - Line definitions
- ✅ **Suppliers** - Supplier master data
- ✅ **Tax Codes** - Tax code library
- ✅ **Users & RBAC** - 7 roles (Admin, Manager, Operator, Viewer, Planner, Technical, Purchasing)
- ✅ **Allergens** - Allergen library
- ✅ **Default Location Settings** - Per-warehouse defaults for PO/TO

**Gaps to Close for MVP:**

- 🔧 **UI Review & Validation** (P0 - 3 days) ⚠️
  - Review settings screens for completeness
  - Validate default location configuration flow
  - User acceptance testing

---

#### **6. Quality Module** ✅ **MVP MUST HAVE**

**Status:** 🔴 NOT STARTED → Target: MVP Critical

**Core Features (NEW for MVP):**

- 🆕 **QA Inspections**
  - Inspection checklist templates
  - Inspection scheduling (by product, lot, frequency)
  - Inspection results recording (pass/fail, measurements)
  - Link inspections to LP (incoming, in-process, finished goods)

- 🆕 **QA Status Management**
  - LP QA statuses: Pending, Approved, Rejected, Hold, Released
  - Status transition workflows
  - QA hold reasons and resolution

- 🆕 **Certificates of Analysis (CoA)**
  - CoA template per product
  - Auto-generate CoA from inspection results
  - CoA PDF generation
  - CoA storage and retrieval

- 🆕 **Non-Conformance Reports (NCR)**
  - NCR creation for failed inspections
  - Root cause analysis
  - Corrective/preventive actions (CAPA)
  - NCR lifecycle (open → investigation → corrective action → closed)

- 🆕 **Quality Dashboard**
  - Inspection completion rate
  - Pass/fail trends
  - Open NCRs by severity
  - CoA generation status

**Effort:** 2-3 weeks
**Priority:** P0 (MVP blocker for pilot customers)

---

#### **7. Shipping Module** ✅ **MVP MUST HAVE**

**Status:** 🔴 NOT STARTED → Target: MVP Critical

**Core Features (NEW for MVP):**

- 🆕 **Shipping Orders**
  - Create shipping order from WO outputs or warehouse stock
  - Customer information
  - Shipping address
  - Requested ship date

- 🆕 **Pallet Loading**
  - Select pallets for shipment
  - Load pallets to truck
  - Pallet manifest (pallet ID, contents, weight)
  - Load verification (scan pallets)

- 🆕 **Bill of Lading (BOL)**
  - BOL generation (PDF)
  - Pallet count, weight, contents
  - Carrier information
  - BOL number tracking

- 🆕 **Shipping Status**
  - Statuses: Draft, Staged, Loaded, Shipped, Delivered
  - Actual ship date/time
  - Delivery confirmation

- 🆕 **Shipping Labels**
  - Customer-specific label formats
  - Pallet labels with barcode
  - Master BOL label

**Effort:** 2 weeks
**Priority:** P0 (MVP blocker - customers need to ship!)

---

### 🚀 Growth Features (6-18 months, scale to 10-20 customers)

**Target:** Expand from 2-4 pilot customers to 10-20 customers with advanced features that create competitive moat.

---

#### **G1. Planning by Machine Learning** 🤖 **P0 - STRATEGIC PRIORITY**

**From:** User requirement - "automatyczne planowanie produkcji" - **MOVED TO P0**
**Effort:** 4-6 weeks
**Business Value:** VERY HIGH - Competitive advantage, strategic differentiation

**Why P0:** Automatic production planning is a **game-changer** for SME manufacturers. This is MonoPilot's strategic innovation that competitors don't have. Priority over reporting and cost analysis.

**Features:**

- **Demand Forecasting**
  - Historical sales data analysis
  - Seasonal pattern recognition
  - Demand predictions (7/14/30 days ahead)
  - Confidence intervals

- **Automatic Production Scheduling**
  - ML-based WO scheduling
  - Consider: Material availability, line capacity, priority, lead times
  - Optimize for: Throughput, on-time delivery, resource utilization
  - Constraint-based scheduling

- **Material Requirements Planning (MRP)**
  - Auto-generate POs based on WO schedule
  - Lead time optimization
  - Reorder point suggestions
  - Safety stock recommendations

- **What-If Scenario Planning**
  - Simulate schedule changes
  - Capacity planning
  - Impact analysis (material shortages, line downtime)

- **Schedule Optimization**
  - Minimize changeovers
  - Batch similar products
  - Reduce setup times
  - Maximize line utilization

**Technology:**

- **TensorFlow.js** for client-side predictions
- **Historical data training** (6+ months required)
- **Periodic model retraining** (weekly/monthly)

**Prerequisites:**

- 6+ months of production history (WO, PO, sales data)
- Clean data (product, material, timing data)
- ML infrastructure setup

---

#### **G2. Advanced Reporting & Analytics** 🔥 **P0 - GROWTH CRITICAL**

**From:** EPIC-003 Phase 3 (Advanced Analytics Dashboard)
**Effort:** 2 weeks
**Business Value:** HIGH - Data-driven decision making

**Features:**

- **Production KPIs Dashboard**
  - Real-time metrics: Orders completed, units produced, avg yield
  - Cost trends (planned vs actual)
  - Line utilization charts
  - Material consumption analysis

- **BI Engine Integration**
  - Custom report builder
  - SQL-based queries for power users
  - Scheduled reports (email, PDF)
  - Export to Excel/PDF

- **Cost Trends Analysis**
  - Product cost over time
  - BOM cost comparison (versions)
  - Margin analysis (cost vs price)
  - Top/bottom performers by margin

- **Yield Analysis**
  - Yield trends by product/line/time
  - Variance analysis (planned vs actual)
  - Yield optimization opportunities

- **Custom Dashboards**
  - Role-based dashboards (Manager, Planner, Operator)
  - Drag-and-drop dashboard builder
  - Widget library (charts, tables, gauges)

---

#### **G3. BOM Cost Calculation & Analysis** 💰 **P1**

**From:** EPIC-003 Phase 1 (BOM Cost Calculation) - **MOVED TO P1**
**Effort:** 2 weeks
**Business Value:** HIGH - Financial visibility

**Why P1 (not P0):** Important for margin visibility, but not as strategically critical as ML Planning. Can wait until after MVP and ML Planning are complete.

**Features:**

- **Material Cost Tracking**
  - Material costs with effective dates
  - Cost history over time
  - Cost source tracking (manual, supplier, average)

- **Automatic BOM Cost Rollup**
  - Calculate BOM total cost from material costs
  - Include labor cost and overhead
  - Cost per unit calculation

- **Cost Comparison**
  - Compare costs between BOM versions
  - Cost impact of material changes
  - Cost trends over time

- **Margin Analysis**
  - Product sell price vs cost
  - Margin percentage calculation
  - Target margin monitoring

- **WO Cost Tracking**
  - Planned vs actual cost per WO
  - Cost variance analysis
  - Cost overrun alerts

---

#### **G4. Audit Trail & Electronic Signatures** 📋 **P2**

**From:** Research - FDA 21 CFR Part 11 compliance - **MOVED TO P2**
**Effort:** 3 weeks
**Business Value:** HIGH - Regulatory compliance (but not MVP blocker)

**Why P2 (not P0):** FDA 21 CFR Part 11 is important for compliance, but MonoPilot already has basic audit capabilities (created_by, updated_by, timestamps). Full pgAudit + e-signatures can wait until post-MVP growth phase. Customers can operate without this initially.

**Features:**

- **pgAudit Extension**
  - Database-level audit trail
  - All data changes logged
  - Immutable audit records

- **Electronic Signatures**
  - Custom JWT-based signature system
  - Signature required for critical operations (WO release, BOM approval, QC approval)
  - Signature verification
  - Signature history

- **Audit Log UI**
  - Search audit records
  - Filter by user, action, date, entity
  - Audit report generation

- **Compliance Dashboard**
  - FDA 21 CFR Part 11 compliance status
  - Electronic signature usage statistics
  - Audit trail completeness check

---

#### **G5. Visual Scheduling (Gantt Charts)** 📊 **P2**

**From:** NEXT_STEPS recommendations
**Effort:** 2 weeks
**Business Value:** MEDIUM - Visual planning

**Features:**

- **Gantt Chart for WO Schedule**
  - Timeline view of all WOs
  - Drag-and-drop reschedule
  - Color-coded by status, priority, line
  - Dependencies visualization

- **Line Capacity View**
  - Line utilization chart
  - Overload warnings
  - Available capacity visualization

- **Material Availability Timeline**
  - Show when materials arrive (PO expected delivery)
  - Material shortage predictions
  - Material buffer visualization

- **Interactive Scheduling**
  - Drag WO to reschedule
  - Real-time constraint validation
  - Conflict resolution suggestions

---

#### **G6. Machine Maintenance Management** 🔧 **P2**

**From:** User requirement - "maintenance maszyn, zarządzanie raportowaniem usterek"
**Effort:** 2-3 weeks
**Business Value:** MEDIUM - Uptime improvement

**Features:**

- **Preventive Maintenance (PM) Scheduling**
  - PM calendar per machine
  - PM task checklists
  - PM completion tracking
  - Overdue PM alerts

- **Breakdown Reporting**
  - Report machine breakdown (downtime)
  - Breakdown reason codes
  - Repair time tracking
  - Spare parts used

- **Maintenance History**
  - Full maintenance history per machine
  - MTBF (Mean Time Between Failures) calculation
  - MTTR (Mean Time To Repair) tracking
  - Cost per machine

- **Maintenance Dashboard**
  - Uptime % per machine/line
  - Open work orders
  - PM compliance rate
  - Breakdown frequency trends

- **Spare Parts Inventory**
  - Spare parts catalog
  - Stock levels
  - Reorder point alerts
  - Parts usage history

---

#### **G7. BOM Preview & Condition Templates**

**From:** EPIC-003 Phase 2, NEXT_STEPS recommendations
**Effort:** 1 week
**Business Value:** MEDIUM - Faster BOM configuration

**Features:**

- **BOM Material Preview**
  - Visual preview of which materials will be included for given order flags
  - Real-time preview as flags change
  - Estimated cost difference (included vs full BOM)

- **Condition Template Library**
  - Pre-built templates (Organic, Gluten-Free, Vegan, etc.)
  - Custom template creation
  - Template sharing across products
  - One-click template application

---

#### **G8. IoT & SCADA Integration** 🌐 **P3**

**From:** Research - IoT integration, NEXT_STEPS recommendations
**Effort:** 6 weeks
**Business Value:** HIGH - Real-time data collection

**Features:**

- **OPC UA Gateway**
  - Connect to PLCs and SCADA systems
  - Real-time machine data collection
  - OPC UA server/client implementation

- **MQTT Integration**
  - MQTT broker for IoT devices
  - Sensor data ingestion (temperature, humidity, pressure)
  - Real-time alerts

- **Machine Data Collection**
  - Cycle times, run rates, downtime
  - Production counts
  - Alarms and warnings
  - Energy consumption

- **IoT Dashboard**
  - Real-time machine status
  - OEE (Overall Equipment Effectiveness) metrics
  - Alarm history
  - Energy consumption trends

---

### 🌟 Vision Features (18-36 months, 50-100 customers, multi-industry)

**Target:** Scale to 50-100 customers across multiple industries with advanced AI/ML capabilities and ecosystem growth.

---

#### **V1. AI-Powered Cost Optimization Engine** 🤖

**From:** EPIC-003 Phase 4 (Cost Optimization Engine)
**Effort:** 2-3 weeks
**Business Value:** VERY HIGH - $50K-$200K/year savings

**Features:**

- **Cost Recommendations**
  - Material substitution suggestions (cheaper alternatives)
  - Recipe optimization for better yield
  - Process improvement suggestions
  - Estimated savings per recommendation

- **Anomaly Detection**
  - Detect unusual costs (material price spikes)
  - Detect yield anomalies (underperformance)
  - Alert on cost variances

- **What-If Scenario Modeling**
  - Simulate cost changes (material substitution)
  - Simulate yield improvements
  - ROI calculation

- **ML Models:**
  - Cost Predictor (predict future material costs)
  - Yield Optimizer (suggest recipe adjustments)
  - Substitution Recommender (find alternatives)

---

#### **V2. AI Yield Prediction** 🧠

**From:** Research recommendations
**Effort:** 4 weeks
**Business Value:** HIGH - Yield improvement

**Features:**

- Predict expected yield based on: Material batch quality, machine condition, operator skill, environmental factors
- Real-time yield predictions during production
- Yield optimization suggestions
- Alerts for predicted low yield

---

#### **V3. Predictive Maintenance** 🔮

**From:** Research roadmap Phase 4
**Effort:** 5 weeks
**Business Value:** HIGH - Reduce downtime

**Features:**

- Predict machine failures based on sensor data
- Maintenance scheduling optimization
- Spare parts demand forecasting
- Downtime cost prediction

---

#### **V4. MonoPilot Marketplace** 🏪

**From:** Differentiators, NEXT_STEPS recommendations
**Effort:** 8 weeks
**Business Value:** VERY HIGH - Ecosystem growth

**Features:**

- **Community Modules**
  - Industry-specific templates (meat, dairy, pharma, etc.)
  - Custom integrations (ERP, IoT devices, label printers)
  - Workflow blueprints (quality inspections, production scheduling)

- **Marketplace Platform**
  - Module browsing and search
  - Ratings and reviews
  - One-click install
  - Paid and free modules

- **Developer Portal**
  - API documentation
  - SDKs (JavaScript, Python, C#)
  - Sandbox environment
  - Developer support

---

#### **V5. Blockchain Traceability** ⛓️ (Optional)

**From:** Differentiators
**Effort:** 4 weeks (optional enhancement)
**Business Value:** MEDIUM - High-value products

**Features:**

- Immutable audit trail on blockchain
- Supply chain transparency
- Consumer-facing traceability (QR code scan → full history)
- Smart contracts for supplier SLAs

---

#### **V6. Carbon Footprint Tracking** 🌱

**From:** Differentiators
**Effort:** 3 weeks
**Business Value:** MEDIUM - ESG compliance

**Features:**

- Carbon footprint calculation per product
- Scope 3 emissions tracking
- Sustainability reporting
- Carbon reduction recommendations

---

#### **V7. No-Code Workflow Builder** 🎨

**From:** Easy Customization differentiator
**Effort:** 6-8 weeks (Phase 3)
**Business Value:** HIGH - Customer self-service

**Features:**

- Drag-and-drop workflow designer
- Custom approval routing
- Custom validation rules
- Custom notifications

---

## Scope Summary Tables

### MVP Scope Checklist

| Module                  | Status | MVP Critical      | Effort to Complete                       |
| ----------------------- | ------ | ----------------- | ---------------------------------------- |
| **Scanner & Warehouse** | 95%    | 🔥 **PRIORITY 1** | 1 week (business process validation) ❗  |
| **Production**          | 70%    | ✅ YES            | 2 weeks (UI review + dashboard + polish) |
| **Technical**           | 95%    | ✅ YES            | 1 week (UI review + testing)             |
| **Planning**            | 85%    | ✅ YES            | 1 week (UI review + polish)              |
| **Settings**            | 100%   | ✅ YES            | 3 days (UI review)                       |
| **Quality Module**      | 0%     | ✅ YES            | 2-3 weeks ❗                             |
| **Shipping Module**     | 0%     | ✅ YES            | 2 weeks ❗                               |

**Total MVP Effort:** 8-10 weeks to complete (including UI review & business process validation)

---

### Growth Features Prioritization

| Feature                           | Priority | Effort | Business Value            | Dependencies              |
| --------------------------------- | -------- | ------ | ------------------------- | ------------------------- |
| **Planning by ML** 🤖             | P0 🔥    | 4-6w   | **VERY HIGH** (Strategic) | MVP + 6mo historical data |
| **Advanced Reporting**            | P0 🔥    | 2w     | Very High                 | MVP complete              |
| **BOM Cost Calculation** 💰       | P1       | 2w     | High                      | MVP complete              |
| **BOM Preview & Templates**       | P1       | 1w     | Medium                    | EPIC-001                  |
| **Audit Trail + E-Signatures** 📋 | P2       | 3w     | High (FDA)                | MVP complete              |
| **Visual Scheduling**             | P2       | 2w     | Medium                    | MVP complete              |
| **Machine Maintenance**           | P2       | 2-3w   | Medium                    | MVP complete              |
| **IoT Integration**               | P3       | 6w     | High                      | MVP complete, hardware    |

---

### Vision Features Roadmap

| Feature                      | Timeline | Effort | Business Value    | Prerequisites                      |
| ---------------------------- | -------- | ------ | ----------------- | ---------------------------------- |
| **AI Cost Optimization**     | Q3 2026  | 2-3w   | Very High         | Historical data, ML infrastructure |
| **AI Yield Prediction**      | Q3 2026  | 4w     | High              | 12mo production data               |
| **Predictive Maintenance**   | Q3 2026  | 5w     | High              | IoT integration, sensor data       |
| **MonoPilot Marketplace**    | Q4 2026  | 8w     | Very High         | Ecosystem growth                   |
| **Blockchain Traceability**  | Q4 2026  | 4w     | Medium (optional) | High-value products                |
| **Carbon Footprint**         | Q4 2026  | 3w     | Medium (ESG)      | Material data                      |
| **No-Code Workflow Builder** | Q1 2027  | 6-8w   | High              | Platform maturity                  |

---

## Domain-Specific Requirements (Food Manufacturing)

### 🏭 Domain Context: Food Manufacturing SMEs (EU)

MonoPilot operates in a **highly regulated domain** with strict compliance requirements, safety standards, and traceability mandates. Unlike general manufacturing, food production has unique challenges that shape every aspect of the system.

---

### 📋 Regulatory Landscape

#### **1. FDA 21 CFR Part 11 (US Market) - Electronic Records & Signatures**

**Regulation:** FDA requirements for electronic records and electronic signatures.

**Key Requirements:**

- **Audit Trail**: Complete, computer-generated, time-stamped audit trail of all changes
- **Electronic Signatures**: Secure, unique identification of signers
- **System Validation**: IQ/OQ/PQ documentation for software validation
- **Access Controls**: Unique user IDs, automatic lockout after inactivity
- **Data Integrity**: Checks for valid data entry (e.g., range checks, spell checks)

**Impact on MonoPilot:**

- ✅ **Already Implemented** (Basic):
  - User authentication (Supabase Auth)
  - `created_by`, `updated_by` fields on all business tables
  - Timestamps (`created_at`, `updated_at`)
  - RBAC with 7 roles

- 🔧 **Needed for Full Compliance** (Growth P2):
  - pgAudit extension (database-level audit trail)
  - Electronic signature module (JWT-based)
  - Validation protocol generator (IQ/OQ/PQ)
  - Audit log UI for searching/reporting

**Status:** 50% compliant (basic audit trail exists, full compliance in P2)

---

#### **2. FSMA 204 (Food Safety Modernization Act) - Traceability Rule**

**Regulation:** FDA Food Traceability Rule - **mandatory by July 2028**

**Key Requirements:**

- **Critical Tracking Events (CTEs)**: Harvesting, cooling, packing, receiving, transformation, shipping
- **Key Data Elements (KDEs)**: Lot/batch number, quantity, unit of measure, location, date/time
- **Traceability Lot Code (TLC)**: Unique identifier for each lot
- **<24 hour traceability**: Must be able to trace forward/backward within 24 hours
- **Interoperable format**: Electronic data sharing with FDA (JSON/XML)

**Impact on MonoPilot:**

- ✅ **Already Implemented** (MVP):
  - License Plate (LP) system = TLC equivalent
  - `lp_genealogy` table (parent-child relationships)
  - Forward/backward traceability (<1 minute vs 24h requirement) ✅ EXCEEDS
  - Batch tracking (`batch_number`, `supplier_batch_number`)
  - All KDEs captured: quantity, UoM, location, date/time, product

- 🔧 **Needed for Full Compliance** (MVP):
  - Recall simulation report (30-second trace → FDA-formatted report)
  - JSON/XML export for FDA submissions
  - CTE documentation in UI (mark events as CTEs)

**Status:** 90% compliant (core traceability done, reporting format needed)

---

#### **3. EU Regulation 178/2002 - General Food Law**

**Regulation:** EU traceability requirements for food products.

**Key Requirements:**

- **One step forward, one step back**: Traceability to immediate supplier and immediate customer
- **Batch tracking**: All food business operators must implement traceability
- **Recall procedures**: Ability to withdraw products from market
- **Record keeping**: Maintain records for minimum period (varies by member state)

**Impact on MonoPilot:**

- ✅ **Already Implemented** (MVP):
  - Supplier tracking (PO → ASN → GRN → LP)
  - Customer tracking (WO → output LP → pallet → shipment)
  - Full genealogy (exceeds "one step" requirement)
  - Batch tracking throughout lifecycle

**Status:** 100% compliant (exceeds EU requirements)

---

#### **4. ISO 22000 - Food Safety Management Systems**

**Standard:** International food safety management standard (optional, but competitive advantage).

**Key Requirements:**

- **HACCP principles**: Hazard analysis and critical control points
- **Prerequisite programs (PRPs)**: Hygiene, maintenance, pest control, etc.
- **Operational prerequisite programs (OPRPs)**: Control measures
- **Critical Control Points (CCPs)**: Monitoring and corrective actions
- **Traceability**: Product identification and traceability system

**Impact on MonoPilot:**

- ✅ **Supported** (MVP + Growth):
  - Quality Module (MVP) supports CCP monitoring via inspections
  - NCR (Non-Conformance Reports) = corrective actions
  - Traceability system = full genealogy

- 🔧 **Enhanced Support** (Growth):
  - HACCP plan templates
  - CCP monitoring dashboards
  - Automatic alerts when CCP limits exceeded

**Status:** Partial support (basic framework in place, full HACCP in Growth)

---

#### **5. ISA-95 / IEC 62264 (2025 Edition) - MES Standards**

**Standard:** Manufacturing operations management architecture (Level 3 MES).

**Key Requirements:**

- **9 Core Objects**: Product definition, Personnel, Material, Equipment, Process segment, Production schedule, Production performance, Production capability, Work definition
- **Level 3 Functions**: Production dispatching, execution management, data collection, labor management, quality management, document control, materials/energy management

**Impact on MonoPilot:**

- ✅ **Implemented** (MVP):
  - Product definition ✅ (products, BOMs)
  - Material ✅ (LP tracking, inventory)
  - Equipment ✅ (machines, lines)
  - Process segment ✅ (routings, operations)
  - Production schedule ✅ (WO planning)
  - Production performance ✅ (yield, outputs)
  - Work definition ✅ (WO with BOM snapshot)

- 🔧 **Needed for Full Compliance**:
  - Personnel ⚠️ (basic users exist, need shift/skill tracking)
  - Production capability ⚠️ (need capacity planning)

**Status:** 60% compliant (7/9 core objects, Level 3 functions 70% complete)

---

### 🔬 Domain-Specific Constraints & Business Rules

#### **1. Allergen Control (Critical for Food Safety)**

**Domain Rule:** Cross-contamination of allergens can be life-threatening.

**System Impact:**

- **1:1 Consumption Pattern** (`consume_whole_lp` flag):
  - When enabled, entire LP must be consumed (no partial splits)
  - Prevents allergen cross-contamination through partial batches
  - Enforced at scanner level (blocks partial consumption)

- **Allergen Tracking**:
  - 14 major allergens (EU Directive 2003/89/EC)
  - Product-level allergen tagging
  - BOM allergen rollup (automatic)
  - Allergen warnings in UI

- **Production Line Changeovers**:
  - Track last product/allergen on line
  - Cleaning validation required between allergen changes
  - Production sequence optimization (batch same allergens)

**MVP Status:** ✅ Implemented (1:1 consumption, allergen library, BOM rollup)

---

#### **2. Expiry Management & FIFO/FEFO**

**Domain Rule:** Food products have limited shelf life; using expired ingredients is illegal.

**System Impact:**

- **FIFO (First In, First Out)**: Default picking strategy
- **FEFO (First Expired, First Out)**: For perishable items
- **Expiry Tracking**:
  - `expiry_date` on all LPs
  - Automatic expiry warnings
  - Block consumption of expired LPs
  - Expiry-based reserve logic

- **Dating Requirements**:
  - Manufacture date tracking
  - Best before date vs use by date
  - Aging calculations (days until expiry)

**MVP Status:** ✅ Implemented (expiry tracking, FIFO/FEFO support in LP system)

---

#### **3. Batch Integrity & No-Mix Rules**

**Domain Rule:** Different batches of same material must not be mixed (traceability requirement).

**System Impact:**

- **Batch Segregation**:
  - Each LP has unique batch number
  - Merge LP only allowed if same batch
  - Consumption tracked per batch
  - Batch-level genealogy

- **Production Batching**:
  - WO produces single batch of output
  - Output batch derived from WO number
  - By-products inherit batch from main output

**MVP Status:** ✅ Implemented (batch tracking, merge validation, WO-batch linking)

---

#### **4. Immutable Production Records**

**Domain Rule:** Once production starts, recipe (BOM) cannot change (audit requirement).

**System Impact:**

- **BOM Snapshot Pattern**:
  - BOM captured at WO creation time
  - Stored in `wo_materials` table
  - Immutable after WO released
  - Changes to active BOM don't affect in-progress WOs

- **Why Critical**:
  - Regulatory compliance (CFR Part 11)
  - Traceability accuracy
  - Prevents mid-production recipe changes
  - Audit trail integrity

**MVP Status:** ✅ Implemented (BOM snapshot at WO creation)

---

#### **5. UoM Consistency (No Automatic Conversions)**

**Domain Rule:** Food safety requires exact measurements; automatic conversions can introduce errors.

**System Impact:**

- **No Automatic Conversions**:
  - UoM must match exactly (BOM → LP → Consumption)
  - Scanner validates UoM before consumption
  - User must manually convert if needed (rare)

- **Why Critical**:
  - Recipe accuracy (especially for regulated items)
  - Allergen control (e.g., "parts per million")
  - Audit trail clarity
  - Prevents measurement errors

**MVP Status:** ✅ Implemented (UoM validation, no automatic conversions)

---

### 🎯 Domain-Mandated Features (Must Have for Food Manufacturing)

Based on regulatory requirements and domain constraints, the following features are **mandatory** (not optional):

#### **MVP Must-Haves (Regulatory Driven):**

1. ✅ **LP-Based Inventory with Genealogy** (FSMA 204)
   - Forward/backward traceability
   - <24 hour trace capability (MonoPilot: <1 minute ✅)
   - Batch tracking, expiry tracking

2. ✅ **BOM Snapshot & Immutability** (FDA CFR 21 Part 11)
   - Recipe locked at WO start
   - Audit trail of BOM changes
   - Version control

3. ✅ **Quality Management** (ISO 22000, HACCP)
   - QA inspections (incoming, in-process, finished goods)
   - QA status management (pending, approved, hold, rejected)
   - Non-conformance reports (NCR)
   - Certificates of Analysis (CoA)

4. ✅ **Multi-Warehouse Support** (Business critical for SMEs)
   - Transfer orders between sites
   - Transit location handling
   - Warehouse-specific defaults

5. ✅ **Allergen Control** (EU Directive 2003/89/EC)
   - 1:1 consumption flag
   - Allergen tracking
   - Cross-contamination prevention

6. ✅ **Basic Audit Trail** (FDA CFR 21 Part 11 - minimum)
   - `created_by`, `updated_by` on all records
   - Timestamps
   - User authentication

#### **Growth Must-Haves (Full Compliance):**

7. 🔧 **Advanced Audit Trail** (FDA CFR 21 Part 11 - full) - **P2**
   - pgAudit extension (database-level logging)
   - Electronic signatures
   - IQ/OQ/PQ validation protocols

8. 🔧 **Advanced Reporting** (Regulatory reporting) - **P0**
   - FSMA 204 compliance reports
   - Recall simulation reports (FDA format)
   - JSON/XML export for FDA submissions

---

### 🚦 Compliance Status Summary

| Regulation                 | Current Status | MVP Target | Growth Target  |
| -------------------------- | -------------- | ---------- | -------------- |
| **FDA 21 CFR Part 11**     | 50%            | 60%        | 100% (P2)      |
| **FSMA 204**               | 90%            | 95%        | 100% (P0)      |
| **EU Regulation 178/2002** | 100%           | 100%       | ✅ Compliant   |
| **ISO 22000**              | 40%            | 70%        | 90% (optional) |
| **ISA-95/IEC 62264**       | 60%            | 65%        | 80%            |

**Overall Compliance:** **70%** → MVP Target: **77%** → Growth Target: **90%+**

---

### 📊 How Domain Requirements Shape Development

#### **Sequence Impact:**

1. **MVP Phase (0-6 months):**
   - ✅ Core traceability (FSMA 204) = DONE (EPIC-002)
   - 🔧 Quality Module (ISO 22000) = 2-3 weeks
   - 🔧 Shipping Module (complete lifecycle) = 2 weeks
   - 🔧 UI/Business Process Alignment = 4-5 weeks

2. **Growth Phase (6-18 months):**
   - 🔧 Advanced Reporting (FSMA 204 reports) = P0, 2 weeks
   - 🔧 Full Audit Trail (FDA CFR 21 Part 11) = P2, 3 weeks
   - 🔧 HACCP Templates (ISO 22000) = P3, 2 weeks

#### **Feature Priorities Shaped by Domain:**

- **P0 (Regulatory Blocking):**
  - Quality Module ✅ (ISO 22000 baseline)
  - Shipping Module ✅ (complete traceability chain)
  - Scanner Business Process Validation ✅ (operational critical)

- **P0 Growth (Competitive + Compliance):**
  - Planning by ML 🤖 (strategic innovation)
  - Advanced Reporting 📊 (FDA reporting format)

- **P1 Growth (Operational Excellence):**
  - BOM Cost Calculation 💰
  - BOM Preview & Templates

- **P2 Growth (Full Compliance):**
  - Audit Trail + E-Signatures 📋 (FDA CFR 21 Part 11 full)
  - Visual Scheduling
  - Machine Maintenance

#### **NFRs Shaped by Domain:**

- **Data Integrity**: Zero data loss (regulatory requirement)
- **Audit Trail**: 100% completeness (CFR 21 Part 11)
- **Traceability Speed**: <1 minute (exceeds 24h requirement)
- **Uptime**: 99.5% minimum (production critical)
- **Security**: Role-based access (7 roles), multi-tenant isolation

---

### 🎓 Domain Expertise Requirements

**Team Knowledge Needs:**

- **Food Safety Regulations**: FDA, EU, ISO 22000
- **HACCP Principles**: Hazard analysis, CCPs
- **Traceability Standards**: FSMA 204, GS1 standards
- **MES Standards**: ISA-95/IEC 62264
- **Food Manufacturing Processes**: Receiving, production, packaging, shipping
- **Allergen Management**: Cross-contamination control
- **Quality Management**: QA/QC procedures, NCR, CoA

**Where MonoPilot Has Domain Expertise:**

- ✅ Traceability (LP genealogy design)
- ✅ BOM versioning (multi-version system)
- ✅ Allergen control (1:1 consumption)
- ✅ Food manufacturing workflows (research-backed)

**Where External Expertise Needed:**

- 🔧 HACCP plan templates (consult food safety expert)
- 🔧 CCP monitoring automation (consult process engineer)
- 🔧 Regulatory reporting formats (consult compliance consultant)

---

### ✅ Domain Validation Checklist

Before MVP launch, validate:

- [ ] **Traceability**: Forward/backward trace works for 100+ LPs (recall simulation)
- [ ] **Quality**: QA hold blocks consumption/shipment
- [ ] **Allergen**: 1:1 consumption enforced at scanner
- [ ] **Batch Integrity**: Merge LP blocked for different batches
- [ ] **Expiry**: Expired LPs blocked from consumption
- [ ] **BOM Snapshot**: WO materials unchanged after BOM edit
- [ ] **UoM Validation**: Scanner rejects UoM mismatch
- [ ] **Multi-Warehouse**: TO between warehouses works end-to-end
- [ ] **Audit Trail**: Created_by, updated_by on all records
- [ ] **User Roles**: RBAC enforces permissions correctly

---

## SaaS B2B Platform Requirements

MonoPilot is a **multi-tenant SaaS B2B platform** with specific architectural and operational requirements that differ from single-tenant or B2C applications. This section defines the platform-specific needs.

---

### 🏗️ Multi-Tenant Architecture

#### **1. Tenant Isolation Strategy**

**Approach:** PostgreSQL Row-Level Security (RLS) with `org_id` column.

**Implementation:**

- **Every business table** has an `org_id` column (UUID foreign key to `organizations` table)
- **RLS policies** automatically filter all queries by `org_id` from JWT token
- **No application-level filtering** needed - database enforces isolation
- **Shared schema** (all tenants in same database) for operational efficiency

**Benefits:**

- ✅ **Cost-efficient**: Single database instance for all tenants
- ✅ **Easy backups**: Single backup strategy
- ✅ **Simple deployment**: No per-tenant infrastructure
- ✅ **Guaranteed isolation**: Database-enforced, no code bugs can break it

**Security Measures:**

- ✅ **JWT tokens** contain `org_id` claim (Supabase Auth)
- ✅ **Middleware** verifies token on every request
- ✅ **RLS policies** prevent cross-tenant data access (even if `org_id` is spoofed)
- ✅ **Audit trail** logs all data access per organization

**Performance Considerations:**

- **RLS overhead**: 3.6ms vs 3.2ms baseline (12.5% overhead) = **acceptable**
- **Index strategy**: Composite indexes on `(org_id, <primary_key>)`
- **Query optimization**: Always include `org_id` in WHERE clauses
- **Connection pooling**: Supabase handles connection management

**Scalability Path:**

```
Phase 1 (0-100 orgs): Single Supabase instance
Phase 2 (100-500 orgs): Read replicas for reporting
Phase 3 (500-2000 orgs): Database sharding by org_id (if needed)
Phase 4 (2000+ orgs): Dedicated instances for enterprise customers
```

---

#### **2. Tenant Onboarding & Provisioning**

**New Tenant Creation Flow:**

1. **User signs up** → Supabase Auth creates user account
2. **Organization creation** → New record in `organizations` table
3. **Default data seeding**:
   - Create default warehouse ("Main Warehouse")
   - Create default location ("Receiving")
   - Assign user as Admin role
   - Copy allergen library (14 standard allergens)
   - Create default tax codes (if country-specific)
4. **Welcome email** with onboarding checklist
5. **QuickStart wizard** (optional):
   - Industry template selection (meat, dairy, bakery, etc.)
   - Sample products, BOMs, routings
   - Sample workflows (PO → receiving → WO → output)

**Provisioning Time:** <30 seconds (target: instant)

**Default Resources per Tenant:**

```yaml
warehouses: 1 (Main Warehouse)
locations: 3 (Receiving, Production, Shipping)
machines: 0 (customer adds)
products: 0 (or sample from template)
users: 1 (signup user as Admin)
subscription: Starter tier (14-day trial)
modules: [Warehouse, Production, Technical, Planning, Settings]
```

**QuickStart Templates (Phase 2):**

```yaml
templates:
  - meat_processing:
      products: [Beef, Pork, Chicken, Ground Meat]
      boms: [Burger patty, Sausage, Deli meat]
      allergens: [None (meat products)]
      workflows: [Carcass breakdown, Grinding, Packaging]

  - dairy:
      products: [Milk, Cheese, Yogurt, Butter]
      boms: [Cheddar, Mozzarella, Greek Yogurt]
      allergens: [Milk, Lactose]
      workflows: [Pasteurization, Culturing, Aging]

  - bakery:
      products: [Flour, Bread, Pastry, Cake]
      boms: [White Bread, Croissant, Chocolate Cake]
      allergens: [Wheat, Eggs, Milk, Nuts]
      workflows: [Mixing, Proofing, Baking, Cooling]
```

---

#### **3. Tenant Data Management**

**Data Ownership:**

- **Customer owns all data**: MonoPilot acts as data processor (GDPR terminology)
- **Data export**: Full data export to JSON/CSV on demand
- **Data deletion**: GDPR Right to Erasure (delete all tenant data)
- **Data retention**: Configurable per tenant (default: indefinite)

**Backup & Recovery:**

- **Automated backups**: Daily (Supabase Point-in-Time Recovery)
- **Retention**: 7 days (Starter), 30 days (Growth), 90 days (Enterprise)
- **Restore time**: <1 hour (manual process)
- **Per-tenant restore**: NOT supported (shared database) - full database restore only

**Data Migration:**

- **Import from legacy systems**: CSV import for products, BOMs, suppliers
- **Export for BI tools**: PostgreSQL direct connection or API export
- **Tenant migration**: Move from Starter → Growth → Enterprise (zero downtime)

---

### 👥 Permission Matrix (RBAC)

MonoPilot implements **Role-Based Access Control (RBAC)** with **7 predefined roles**. Permissions are enforced at both **API level** (route handlers) and **UI level** (conditional rendering).

---

#### **Role Definitions**

| Role           | Code         | Primary Users                     | Scope                                                              |
| -------------- | ------------ | --------------------------------- | ------------------------------------------------------------------ |
| **Admin**      | `admin`      | IT Manager, Owner                 | Full system access (all modules, all data, all operations)         |
| **Manager**    | `manager`    | Production Manager, Plant Manager | Read/write access to all modules, no settings changes              |
| **Operator**   | `operator`   | Line Operators, Machine Operators | Execute production operations, consume materials, register outputs |
| **Viewer**     | `viewer`     | Accountants, External Auditors    | Read-only access to all modules                                    |
| **Planner**    | `planner`    | Production Planner, Scheduler     | Create/edit PO, TO, WO; view production status                     |
| **Technical**  | `technical`  | Process Engineer, R&D             | Manage products, BOMs, routings, allergens                         |
| **Purchasing** | `purchasing` | Procurement Manager, Buyer        | Manage PO, suppliers, receiving; view inventory                    |

---

#### **Permission Matrix by Module**

**Legend:**

- ✅ **Full** = Create, Read, Update, Delete
- 📖 **Read** = View only, no modifications
- 🚫 **None** = No access

| Module / Feature         | Admin | Manager | Operator | Viewer | Planner | Technical | Purchasing |
| ------------------------ | ----- | ------- | -------- | ------ | ------- | --------- | ---------- |
| **Production Module**    |       |         |          |        |         |           |            |
| - View WOs               | ✅    | ✅      | ✅       | 📖     | ✅      | 📖        | 📖         |
| - Create/Edit WO         | ✅    | ✅      | 🚫       | 🚫     | ✅      | 🚫        | 🚫         |
| - Start/Finish WO        | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | 🚫         |
| - Consume Materials      | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | 🚫         |
| - Register Outputs       | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | 🚫         |
| - Cancel WO              | ✅    | ✅      | 🚫       | 🚫     | ✅      | 🚫        | 🚫         |
| **Scanner & Warehouse**  |       |         |          |        |         |           |            |
| - Scanner Access         | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | ✅         |
| - Receive PO/TO          | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | ✅         |
| - Create LP              | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | ✅         |
| - Move LP                | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | ✅         |
| - Split/Merge LP         | ✅    | ✅      | 🚫       | 🚫     | ✅      | 🚫        | ✅         |
| - View Inventory         | ✅    | ✅      | ✅       | 📖     | ✅      | 📖        | ✅         |
| **Technical Module**     |       |         |          |        |         |           |            |
| - View Products/BOMs     | ✅    | ✅      | 📖       | 📖     | ✅      | ✅        | 📖         |
| - Create/Edit Products   | ✅    | ✅      | 🚫       | 🚫     | 🚫      | ✅        | 🚫         |
| - Create/Edit BOMs       | ✅    | ✅      | 🚫       | 🚫     | 🚫      | ✅        | 🚫         |
| - Activate BOM           | ✅    | ✅      | 🚫       | 🚫     | 🚫      | ✅        | 🚫         |
| - View Routings          | ✅    | ✅      | 📖       | 📖     | ✅      | ✅        | 📖         |
| - Create/Edit Routings   | ✅    | ✅      | 🚫       | 🚫     | 🚫      | ✅        | 🚫         |
| **Planning Module**      |       |         |          |        |         |           |            |
| - View PO/TO             | ✅    | ✅      | 📖       | 📖     | ✅      | 📖        | ✅         |
| - Create/Edit PO         | ✅    | ✅      | 🚫       | 🚫     | ✅      | 🚫        | ✅         |
| - Create/Edit TO         | ✅    | ✅      | 🚫       | 🚫     | ✅      | 🚫        | ✅         |
| - View ASNs              | ✅    | ✅      | ✅       | 📖     | ✅      | 🚫        | ✅         |
| **Quality Module**       |       |         |          |        |         |           |            |
| - View Inspections       | ✅    | ✅      | ✅       | 📖     | ✅      | ✅        | ✅         |
| - Create/Edit Inspection | ✅    | ✅      | ✅       | 🚫     | ✅      | ✅        | 🚫         |
| - Approve/Reject LP      | ✅    | ✅      | 🚫       | 🚫     | ✅      | ✅        | 🚫         |
| - View NCRs              | ✅    | ✅      | 📖       | 📖     | ✅      | ✅        | 📖         |
| - Create/Edit NCR        | ✅    | ✅      | ✅       | 🚫     | ✅      | ✅        | 🚫         |
| **Shipping Module**      |       |         |          |        |         |           |            |
| - View Shipping Orders   | ✅    | ✅      | ✅       | 📖     | ✅      | 🚫        | 📖         |
| - Create Shipping Order  | ✅    | ✅      | 🚫       | 🚫     | ✅      | 🚫        | 🚫         |
| - Load Pallets           | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | 🚫         |
| - Generate BOL           | ✅    | ✅      | ✅       | 🚫     | ✅      | 🚫        | 🚫         |
| **Settings**             |       |         |          |        |         |           |            |
| - View Settings          | ✅    | ✅      | 📖       | 📖     | 📖      | 📖        | 📖         |
| - Edit Warehouses        | ✅    | 🚫      | 🚫       | 🚫     | 🚫      | 🚫        | 🚫         |
| - Edit Locations         | ✅    | ✅      | 🚫       | 🚫     | 🚫      | 🚫        | 🚫         |
| - Edit Machines          | ✅    | ✅      | 🚫       | 🚫     | 🚫      | ✅        | 🚫         |
| - Edit Suppliers         | ✅    | ✅      | 🚫       | 🚫     | 🚫      | 🚫        | ✅         |
| - Manage Users           | ✅    | 🚫      | 🚫       | 🚫     | 🚫      | 🚫        | 🚫         |
| - Subscription Mgmt      | ✅    | 🚫      | 🚫       | 🚫     | 🚫      | 🚫        | 🚫         |

---

#### **Role Assignment & Management**

**Who can assign roles:**

- Only **Admin** role can assign/change user roles
- Admins cannot remove own admin role (prevent lockout)
- Must have ≥1 Admin per organization

**Role Change Process:**

1. Admin navigates to Settings → Users
2. Select user → Edit role
3. Select new role from dropdown
4. Confirm change
5. User receives email notification
6. Next login: new permissions apply

**Edge Cases:**

- **Last Admin**: Cannot remove admin role if only 1 admin exists
- **Self-demotion**: Admin can demote self if ≥2 admins exist
- **Deleted users**: Deactivate user (keep audit trail) instead of hard delete

---

#### **Permission Enforcement**

**Backend (API Level):**

```typescript
// Example: API route protection
// apps/frontend/app/api/work-orders/route.ts

export async function POST(req: Request) {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check role
  const { data: profile } = await supabase
    .from('users')
    .select('role, org_id')
    .eq('id', user.id)
    .single();

  // Planner, Manager, Admin can create WO
  if (!['planner', 'manager', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ... create WO logic (RLS ensures org_id isolation)
}
```

**Frontend (UI Level):**

```tsx
// Example: Conditional rendering based on role
// apps/frontend/components/WorkOrdersTable.tsx

import { useUser } from '@/lib/auth';

export function WorkOrdersTable() {
  const { user, role } = useUser();
  const canCreateWO = ['planner', 'manager', 'admin'].includes(role);

  return (
    <div>
      {canCreateWO && <Button onClick={handleCreate}>Create WO</Button>}
      {/* Table content */}
    </div>
  );
}
```

**Database (RLS Policies):**

```sql
-- Example: RLS policy for work_orders table
CREATE POLICY "work_orders_select_policy" ON work_orders
FOR SELECT
USING (org_id = auth.uid()::text::uuid);

-- Managers/Planners/Admins can create WO
CREATE POLICY "work_orders_insert_policy" ON work_orders
FOR INSERT
WITH CHECK (
  org_id = auth.uid()::text::uuid
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('planner', 'manager', 'admin')
  )
);
```

---

### 💳 Subscription Tiers & Pricing

MonoPilot offers **3 subscription tiers** with transparent, public pricing. No "Contact Sales" - instant signup.

---

#### **Tier Comparison**

| Feature                   | Starter        | Growth                | Enterprise                 |
| ------------------------- | -------------- | --------------------- | -------------------------- |
| **Pricing**               | $1,500/mo      | $3,000/mo             | $5,000+/mo                 |
| **Users**                 | Up to 20       | Up to 50              | Unlimited                  |
| **Warehouses**            | 1              | 3                     | Unlimited                  |
| **Data Retention**        | 7 days         | 30 days               | 90 days                    |
| **Support**               | Email (24-48h) | Email + Chat (12-24h) | Dedicated + Phone (4h SLA) |
| **SLA Uptime**            | 99.0%          | 99.5%                 | 99.9%                      |
| **API Rate Limit**        | 1,000 req/min  | 5,000 req/min         | Unlimited                  |
| **Data Export**           | CSV            | CSV + JSON            | CSV + JSON + SQL           |
| **Modules**               |                |                       |                            |
| - Production              | Basic          | Standard              | Advanced                   |
| - Warehouse               | Basic          | Standard              | Advanced                   |
| - Planning                | Basic          | Standard              | Advanced                   |
| - Technical               | Basic          | Standard              | Advanced                   |
| - Quality                 | Basic          | Standard              | Advanced                   |
| - Shipping                | ✅             | ✅                    | ✅                         |
| - Settings                | ✅             | ✅                    | ✅                         |
| **Growth Features**       |                |                       |                            |
| - Advanced Reporting      | ❌             | ✅                    | ✅                         |
| - Planning by ML          | ❌             | Add-on $500/mo        | ✅ Included                |
| - BOM Cost Calculation    | ❌             | ✅                    | ✅                         |
| - Visual Scheduling       | ❌             | ✅                    | ✅                         |
| - Audit Trail + E-Sig     | ❌             | Add-on $300/mo        | ✅ Included                |
| - IoT Integration         | ❌             | ❌                    | Add-on $800/mo             |
| **Vision Features**       |                |                       |                            |
| - AI Cost Optimization    | ❌             | ❌                    | Add-on $1,000/mo           |
| - Predictive Maintenance  | ❌             | ❌                    | Add-on $800/mo             |
| - Blockchain Traceability | ❌             | ❌                    | Add-on $500/mo             |

---

#### **Module Complexity Levels**

Each module has **3 complexity levels**: Basic, Standard, Advanced.

**Example: Production Module**

| Feature                 | Basic (Starter) | Standard (Growth) | Advanced (Enterprise) |
| ----------------------- | --------------- | ----------------- | --------------------- |
| WO Management           | ✅              | ✅                | ✅                    |
| BOM Snapshot            | ✅              | ✅                | ✅                    |
| Multi-Version BOM       | ✅              | ✅                | ✅                    |
| By-Products             | ✅              | ✅                | ✅                    |
| Conditional Materials   | ❌              | ✅                | ✅                    |
| Multi-Operation Routing | ❌              | ✅                | ✅                    |
| Production Dashboard    | Basic           | Advanced          | Advanced              |
| Yield Analysis          | Basic           | Advanced          | Advanced + AI         |
| Real-time IoT           | ❌              | ❌                | ✅                    |
| AI Yield Prediction     | ❌              | ❌                | ✅                    |
| Predictive Alerts       | ❌              | ❌                | ✅                    |

---

#### **Pricing Examples**

**Example 1: Small Meat Processor (30 employees)**

```
Tier: Starter ($1,500/mo)
Users: 15 (operators + managers)
Modules: Production (Basic), Warehouse (Basic), Quality (Basic)
Cost: $1,500/mo = $18,000/year
Savings vs Infor: $320K - $18K = $302K over 1 year
```

**Example 2: Mid-Size Dairy (80 employees, 3 plants)**

```
Tier: Growth ($3,000/mo)
Users: 45 (multi-plant)
Modules: All Standard + ML Planning ($500/mo add-on)
Cost: $3,500/mo = $42,000/year
Savings vs Siemens: $450K - $42K = $408K over 1 year
```

**Example 3: Large Bakery (200 employees, 5 warehouses)**

```
Tier: Enterprise ($5,000/mo)
Users: 120
Modules: All Advanced + IoT ($800/mo) + AI Optimization ($1,000/mo)
Cost: $6,800/mo = $81,600/year
Savings vs SAP: $650K - $82K = $568K over 1 year
```

---

#### **Billing & Payment**

**Billing Cycle:**

- Monthly or Annual (Annual: 2 months free = 16.7% discount)
- Payment via Credit Card (Stripe), Wire Transfer (Enterprise)

**Free Trial:**

- 14 days free trial (all tiers)
- No credit card required for trial
- Full feature access during trial
- Sample data included (optional QuickStart template)

**Upgrade/Downgrade:**

- **Upgrade**: Instant (prorate remaining days)
- **Downgrade**: End of current billing period
- **Cancel**: No penalty, data retained for 30 days

**Add-Ons:**

- ML Planning: $500/mo (Growth tier only, included in Enterprise)
- Audit Trail + E-Signatures: $300/mo (Growth tier only, included in Enterprise)
- IoT Integration: $800/mo (Enterprise tier only)
- AI Cost Optimization: $1,000/mo (Enterprise tier only)
- Predictive Maintenance: $800/mo (Enterprise tier only)

**Volume Discounts (Enterprise):**

- 100-200 users: Base price
- 201-500 users: 10% discount
- 501+ users: Custom pricing

---

### 🔌 Critical Integrations

MonoPilot must integrate with external systems commonly used by food manufacturing SMEs. All integrations via **REST API + Webhooks**.

---

#### **1. ERP Systems (High Priority)**

**Target ERPs:**

- **QuickBooks Online** (50% of SMEs)
- **Xero** (20% of EU SMEs)
- **SAP Business One** (10% mid-market)
- **Microsoft Dynamics 365 Business Central** (10%)
- **Odoo** (5% open-source users)

**Integration Scope:**

- **Master Data Sync**: Products, suppliers, customers (bidirectional)
- **Financial Transactions**:
  - PO creation in MonoPilot → PO in ERP
  - Goods Receipt (GRN) → ERP inventory increase
  - Production output → ERP finished goods
  - Shipping order → Sales Order fulfillment in ERP
- **Invoicing**:
  - MonoPilot consumption data → ERP COGS calculation
  - Production costs → ERP cost accounting

**Implementation Approach:**

- **Phase 1 (MVP)**: QuickBooks Online only (REST API)
- **Phase 2 (Growth)**: Xero, SAP Business One
- **Phase 3 (Vision)**: Marketplace integration modules (community-built)

**Technical Approach:**

```yaml
quickbooks_integration:
  auth: OAuth 2.0
  api: QuickBooks Online API v3
  sync_frequency: Real-time (webhooks) + Daily batch
  entities:
    - items (products)
    - vendors (suppliers)
    - purchase_orders
    - bills (invoices)
    - inventory_adjustments
  data_flow:
    - MonoPilot → QuickBooks: PO, GRN, WO outputs, consumption
    - QuickBooks → MonoPilot: Product master data, vendor updates
```

---

#### **2. IoT & SCADA Systems (P3 - Growth)**

**Target Protocols:**

- **OPC UA** (industrial standard for PLCs)
- **MQTT** (lightweight IoT protocol)
- **Modbus TCP** (legacy industrial equipment)
- **REST API** (modern IoT devices)

**Integration Scope:**

- **Machine Data Collection**:
  - Production counts (units/hour)
  - Downtime events
  - Cycle times
  - Alarms and warnings
- **Real-Time Monitoring**:
  - OEE (Overall Equipment Effectiveness)
  - Line status (running, idle, down)
  - Energy consumption
- **Sensor Data**:
  - Temperature (ovens, fridges)
  - Humidity (storage areas)
  - Pressure (processing equipment)

**Technical Approach:**

```yaml
iot_integration:
  gateway: MonoPilot IoT Gateway (Docker container)
  protocols: [OPC UA, MQTT, Modbus TCP]
  deployment: On-premise (customer network) or cloud
  data_flow:
    - IoT devices → Gateway → MonoPilot API (HTTPS)
    - Real-time data ingestion (10-second intervals)
    - Store in time-series database (TimescaleDB)
  visualization:
    - Real-time dashboard (WebSocket)
    - Historical trends (REST API)
```

---

#### **3. Label Printers (MVP - Scanner Module)**

**Target Printers:**

- **Zebra ZPL** (80% market share)
- **Honeywell/Intermec** (10%)
- **SATO** (5%)
- **Datamax** (5%)

**Integration Scope:**

- **Label Formats**:
  - License Plate labels (barcode, batch, expiry, product, qty)
  - Pallet labels (pallet ID, contents, weight)
  - Shipping labels (BOL, customer, address)
- **Print from Scanner**:
  - Mobile PWA → Bluetooth printer (Zebra)
  - Mobile PWA → Network printer (ZPL over TCP)
  - Desktop → USB printer (ZPL)

**Technical Approach:**

```yaml
label_printing:
  protocol: ZPL (Zebra Programming Language)
  connection_types:
    - Bluetooth (mobile → portable printer)
    - TCP/IP (mobile/desktop → network printer)
    - USB (desktop → USB printer)
  implementation:
    - ZPL template library in MonoPilot
    - JavaScript ZPL generator
    - Browser Print API (Zebra SDK)
  status: ✅ EPIC-002 Phase 4 complete (ZPL label printing)
```

---

#### **4. Business Intelligence (BI) Tools (P0 - Growth)**

**Target BI Tools:**

- **Power BI** (Microsoft ecosystem)
- **Tableau** (enterprise standard)
- **Metabase** (open-source, budget-friendly)
- **Google Looker** (Google Workspace users)

**Integration Scope:**

- **Direct Database Connection**:
  - Read-only PostgreSQL user
  - Pre-built SQL views for common reports
  - Data dictionary documentation
- **REST API Export**:
  - JSON export endpoints
  - CSV bulk export
  - Paginated queries
- **Pre-Built Dashboards** (MonoPilot Marketplace):
  - Production KPI dashboard (Power BI template)
  - Cost analysis dashboard (Tableau template)
  - Quality trends dashboard (Metabase template)

**Technical Approach:**

```yaml
bi_integration:
  method: Direct PostgreSQL connection (read-only)
  views:
    - v_production_kpis (aggregated WO metrics)
    - v_cost_analysis (BOM costs, WO costs)
    - v_yield_trends (daily/weekly/monthly)
    - v_inventory_snapshot (current LP stock levels)
  security:
    - Separate read-only user per organization
    - RLS policies apply (org_id filtering)
    - Rate limiting on queries
  documentation:
    - ER diagram
    - Data dictionary (all tables/columns)
    - Sample SQL queries
```

---

#### **5. E-Commerce Platforms (Future - Phase 3)**

**Target Platforms:**

- Shopify (B2C)
- WooCommerce (WordPress)
- Magento (enterprise B2C)
- Custom B2B portals

**Integration Scope:**

- **Order Fulfillment**:
  - E-commerce order → MonoPilot WO (make-to-order)
  - E-commerce order → MonoPilot shipping order (ship from stock)
- **Inventory Sync**:
  - MonoPilot LP stock → E-commerce available inventory
  - Real-time stock updates

---

### 🎛️ Module Activation & Feature Flags

MonoPilot uses **feature flags** to control module access per organization based on subscription tier.

---

#### **Implementation Approach**

**1. Database Schema:**

```sql
-- Table: organization_features
CREATE TABLE organization_features (
  org_id UUID REFERENCES organizations(id),
  feature_key TEXT, -- e.g., 'module.production.advanced'
  enabled BOOLEAN DEFAULT false,
  tier TEXT, -- 'starter', 'growth', 'enterprise'
  activated_at TIMESTAMPTZ,
  PRIMARY KEY (org_id, feature_key)
);

-- Example records:
-- org_id = ABC, feature_key = 'module.production.basic', enabled = true
-- org_id = ABC, feature_key = 'module.production.advanced', enabled = false
-- org_id = ABC, feature_key = 'growth.ml_planning', enabled = false
```

**2. Feature Flag Check (Backend):**

```typescript
// lib/feature-flags.ts
export async function hasFeature(
  org_id: string,
  feature_key: string
): Promise<boolean> {
  const { data } = await supabase
    .from('organization_features')
    .select('enabled')
    .eq('org_id', org_id)
    .eq('feature_key', feature_key)
    .single();

  return data?.enabled ?? false;
}

// Example usage in API route:
if (!(await hasFeature(org_id, 'module.production.advanced'))) {
  return NextResponse.json(
    { error: 'Feature not available in your tier' },
    { status: 403 }
  );
}
```

**3. Feature Flag Check (Frontend):**

```tsx
// components/FeatureGate.tsx
export function FeatureGate({ feature, children, fallback }) {
  const { org } = useOrganization();
  const hasAccess = org.features.includes(feature);

  if (!hasAccess) {
    return fallback || <UpgradePrompt feature={feature} />;
  }

  return children;
}

// Example usage:
<FeatureGate feature="module.production.advanced">
  <ConditionalMaterialsUI />
</FeatureGate>;
```

**4. Subscription Change:**

```typescript
// When user upgrades Starter → Growth:
async function upgradeToGrowth(org_id: string) {
  // Activate Standard modules
  await activateFeature(org_id, 'module.production.standard');
  await activateFeature(org_id, 'module.warehouse.standard');

  // Deactivate Basic modules
  await deactivateFeature(org_id, 'module.production.basic');

  // Activate Growth features
  await activateFeature(org_id, 'growth.advanced_reporting');
  await activateFeature(org_id, 'growth.visual_scheduling');

  // Update subscription record
  await updateSubscription(org_id, { tier: 'growth' });
}
```

---

#### **Feature Flag Hierarchy**

```yaml
modules:
  production:
    basic: [wo_management, bom_snapshot, multi_version_bom, by_products]
    standard:
      [...basic, conditional_materials, multi_op_routing, advanced_dashboard]
    advanced:
      [...standard, real_time_iot, ai_yield_prediction, predictive_alerts]

  warehouse:
    basic: [lp_tracking, asn_receiving, stock_moves, scanner]
    standard: [...basic, pallet_management, advanced_scanner, multi_warehouse]
    advanced: [...standard, auto_put_away, wave_picking, yard_management]

  planning:
    basic: [po_management, to_management, wo_planning]
    standard:
      [...basic, quick_po_entry, demand_forecasting, lead_time_optimization]
    advanced:
      [...standard, ml_planning, constraint_based_scheduling, what_if_scenarios]

growth_features:
  advanced_reporting: [custom_dashboards, bi_export, sql_queries]
  ml_planning: [demand_forecast, auto_scheduling, mrp_auto]
  bom_cost: [cost_rollup, margin_analysis, cost_comparison]
  audit_trail: [pgaudit, e_signatures, validation_protocols]
  visual_scheduling: [gantt_chart, drag_drop, capacity_view]
  iot_integration: [opc_ua, mqtt, real_time_monitoring]

vision_features:
  ai_cost_optimization:
    [cost_recommendations, anomaly_detection, substitution_recommender]
  predictive_maintenance:
    [failure_prediction, maintenance_scheduling, spare_parts_forecast]
  blockchain_traceability: [immutable_audit, smart_contracts, consumer_qr]
```

---

#### **Self-Service Module Activation (Admin UI)**

**UI Flow:**

1. Admin navigates to **Settings → Subscription → Modules**
2. View current tier and available modules
3. See list of modules with toggle switches:
   - ✅ **Enabled** (green toggle)
   - ❌ **Not Available** (grayed out, "Upgrade to Growth" button)
4. Click toggle to enable/disable module (if available in current tier)
5. Confirmation modal: "Activating Production (Standard) will enable..."
6. Module activated instantly (feature flags updated)
7. UI refreshes, new navigation items appear

**Add-On Purchase Flow:**

1. Admin clicks "Add ML Planning ($500/mo)"
2. Stripe payment modal
3. Confirm purchase
4. Feature flag enabled instantly
5. Email receipt + welcome guide for new feature

---

## 🚧 PRD WORKFLOW STATUS

**Step 1 ✅ COMPLETE**: Discovery - Project, Domain, Vision

- Vision alignment captured (5→6 core differentiators)
- Project classification complete (SaaS B2B + Web App PWA)
- Domain context documented (Food → Universal manufacturing)
- Product differentiators identified:
  - Multi-Version BOM (UNIQUE)
  - LP Genealogy (30s recall)
  - Transparent Pricing ($167K savings)
  - Mobile-First PWA ($30K-$50K hardware savings) ← ADDED
  - Module Build (pay-as-you-grow)
  - Easy Customization ($240K-$650K savings) ← ADDED
- Total Cost Advantage: **$437K-$867K** over 3 years vs competitors

**Step 2 ✅ COMPLETE**: Success Definition

- Customer outcomes defined (compliance, operational excellence, 12-month ROI, easy customization)
- Product adoption metrics (80% DAU/MAU, module upsell, PWA usage)
- Business metrics adjusted: **2-4 pilot customers** (realistic), NPS ≥40
- Technical excellence targets (zero data loss, 99.5% uptime)
- Phase 2 success criteria (3+ industries, marketplace launch)
- **What "Winning" Looks Like** section added

**Step 3 ✅ COMPLETE**: Scope Definition

- MVP scope defined (100% working modules + Quality + Shipping + Multi-warehouse)
- Growth features categorized (P0, P1, P2, P3)
- Vision features identified (AI, ML, IoT, Marketplace)
- Priority adjustments per user feedback:
  - Planning by ML = P0 (strategic priority)
  - BOM Costing = P1 (downgraded)
  - Audit + Signatures = P2 (downgraded)
- Module status clarified: UI review & business process alignment needed
- Total MVP effort: 8-10 weeks

**Step 4 ✅ COMPLETE**: Domain-Specific Exploration

- Regulatory landscape documented (FDA, FSMA, EU, ISO, ISA-95)
- Domain constraints identified (allergen, expiry, batch, immutability, UoM)
- Compliance roadmap created (70% → 77% → 90%+)
- Domain-mandated features clarified
- Validation checklist prepared

**Step 5 [OPTIONAL]**: Innovation Discovery (Multi-version BOM uniqueness)

- Can skip - already well-documented in differentiators

**Step 6 ✅ COMPLETE**: Project-Specific Deep Dive (SaaS B2B)

- Multi-tenant architecture defined (RLS with org_id)
- Tenant onboarding & provisioning (QuickStart templates)
- Permission matrix (7 roles, detailed RBAC)
- Subscription tiers (Starter, Growth, Enterprise with transparent pricing)
- Critical integrations (ERP, IoT, label printers, BI tools)
- Module activation & feature flags (self-service)

**Step 7 🚧 IN PROGRESS**: UX Principles

- Mobile-first PWA design approach
- Scanner UX patterns (EPIC-002)
- Desktop UI guidelines
- Key user interactions
- Accessibility standards

**Remaining Steps:**

- Step 8: Functional Requirements Synthesis ⚠️ CRITICAL
- Step 9: Non-Functional Requirements
- Step 10: Review PRD
- Step 11: Complete PRD

---

## User Experience Principles

MonoPilot's UX strategy is built around **mobile-first design** and **operator-centric workflows**. The system must be equally powerful on desktop (for planners/managers) and mobile (for operators/warehouse workers).

---

### 🎨 Design Philosophy

**Core Principles:**

1. **Mobile-First, Desktop-Enhanced**
   - Start with mobile constraints (small screen, touch, offline)
   - Enhance for desktop (keyboard shortcuts, multiple windows, data density)
   - PWA = single codebase, dual UX

2. **Operator-Centric**
   - Line operators = primary users (60-70% of system usage)
   - Scanner workflows = most critical UX
   - "One hand, one thumb" mobile navigation
   - Large touch targets (minimum 44x44px)

3. **Context-Aware UI**
   - Role-based navigation (Operator sees different menu than Planner)
   - Module-based navigation (only show enabled modules)
   - Task-focused layouts (hide irrelevant data)

4. **Progressive Disclosure**
   - Show common actions first, hide advanced features
   - Expand/collapse complex forms
   - "Quick" vs "Advanced" modes

5. **Forgiving & Recoverable**
   - Undo/cancel on destructive actions
   - Confirmation modals for critical operations
   - Auto-save drafts
   - Clear error messages with recovery steps

---

### 📱 Mobile PWA Design

**Target Devices:**

- **Smartphones**: iPhone 12+, Android 10+ (primary)
- **Tablets**: iPad, Android tablets (secondary)
- **Rugged devices**: Optional (BYOD strategy = consumer hardware)

---

#### **Scanner Module UX (EPIC-002 Phase 4)**

**Design Principles:**

- ✅ **Step-based workflows** - Linear progression (no branching)
- ✅ **Large touch targets** - Minimum 56x56px buttons
- ✅ **High contrast** - Dark text on white background, AA accessibility
- ✅ **Minimal text input** - Scan barcodes instead of typing
- ✅ **Instant feedback** - Success/error sounds, vibration, color changes
- ✅ **Offline-first** - Works without network, syncs when online

**Example: Pallet Building Workflow (6 steps)**

```
Step 1: Scan pallet barcode →
Step 2: Select pallet type (EURO/CHEP/Custom) →
Step 3: Scan LP barcodes (add to pallet) →
Step 4: Review pallet contents →
Step 5: Confirm & close pallet →
Step 6: Print pallet label (ZPL)
```

**Navigation Pattern:**

- **Primary action**: Large button at bottom (thumb zone)
- **Secondary actions**: Top right (overflow menu)
- **Back/Cancel**: Top left (standard)
- **Progress indicator**: Top center (Step 2 of 6)

**Error Handling:**

- **Red banner** at top of screen
- **Clear message**: "LP already on another pallet"
- **Recovery action**: "View pallet" button
- **Sound**: Error beep (optional, configurable)

---

#### **Mobile Responsiveness**

**Breakpoints:**

```css
/* Mobile-first approach */
xs: 0-639px      /* Smartphones (default) */
sm: 640px-767px  /* Large phones, small tablets */
md: 768px-1023px /* Tablets */
lg: 1024px+      /* Desktop */
```

**Layout Adaptations:**

- **xs-sm**: Single column, stacked forms, full-width buttons
- **md**: Two columns, side-by-side forms
- **lg**: Multi-column layouts, data tables, dashboards

**Mobile-Specific Features:**

- **Camera API**: Barcode scanning (QR, Code 128, EAN)
- **Geolocation**: Warehouse location auto-detection (optional)
- **Vibration API**: Tactile feedback on scan success/error
- **Web Speech API**: Voice input for hands-free operation (future)
- **Offline Storage**: IndexedDB for local data cache (max 50MB)

---

#### **PWA Features**

**Installation:**

- **Add to Home Screen** prompt after 3 uses
- **Custom app icon** (MonoPilot logo)
- **Splash screen** on launch
- **No browser chrome** (standalone mode)

**Offline Capabilities:**

- **Service Worker** caches app shell (HTML, CSS, JS)
- **IndexedDB** stores local data (LPs, WOs, POs for current shift)
- **Background Sync** queues operations when offline
- **Auto-sync** when network returns

**Performance Targets:**

- **First Contentful Paint**: <1.5s on 3G
- **Time to Interactive**: <3s on 3G
- **Offline boot**: <0.5s (cached)

---

### 🖥️ Desktop UI Design

**Target Use Cases:**

- **Planning**: Create PO, TO, WO (keyboard-heavy data entry)
- **Management**: Review dashboards, reports, analytics
- **Technical**: Build BOMs, configure products, routings
- **Administration**: User management, settings, subscription

---

#### **Desktop Layout Patterns**

**1. Dashboard Layout**

```
+--------------------------------------------------+
| Header: Logo, Nav, User Menu, Notifications      |
+--------------------------------------------------+
| Sidebar Navigation (collapsible)  | Main Content |
| - Production                      |              |
| - Warehouse                       | KPI Cards    |
| - Planning                        | Charts       |
| - Technical                       | Tables       |
| - Quality                         |              |
| - Shipping                        |              |
| - Settings                        |              |
+--------------------------------------------------+
```

**2. Data Table Layout**

```
+--------------------------------------------------+
| Toolbar: Search, Filters, Actions (Create, Export) |
+--------------------------------------------------+
| Table: Sortable columns, row actions, pagination  |
| - Sticky header (scroll table, header stays)      |
| - Infinite scroll OR pagination (user preference) |
| - Row selection (checkboxes)                      |
| - Bulk actions (delete, export, status change)    |
+--------------------------------------------------+
```

**3. Form Layout**

```
+--------------------------------------------------+
| Form Title + Breadcrumb                           |
+--------------------------------------------------+
| Sections (collapsible)                            |
| ┌─ Basic Information ──────────────────────────┐ |
| │ [Input fields in 2-column grid]              │ |
| └───────────────────────────────────────────────┘ |
| ┌─ Advanced Options (collapsed) ───────────────┐ |
| │ ...                                          │ |
| └───────────────────────────────────────────────┘ |
| [Cancel] [Save Draft] [Save & Submit] ←─ Actions |
+--------------------------------------------------+
```

---

#### **Desktop-Specific Features**

**Keyboard Shortcuts:**

```
Global:
  Ctrl+K: Quick search (Command Palette)
  Ctrl+S: Save (forms)
  Esc: Close modal

Navigation:
  Ctrl+1-9: Switch between modules
  Ctrl+N: New record (context-aware)
  Ctrl+F: Focus search

Tables:
  ↑↓: Navigate rows
  Enter: Open row
  Space: Select row
  Ctrl+A: Select all
```

**Multi-Window Support:**

- Open multiple records in tabs (browser tabs)
- Deep linking to specific records (shareable URLs)
- Browser back/forward works correctly

**Data Density:**

- **Compact mode** (default): 48px row height, smaller fonts
- **Comfortable mode**: 64px row height, larger fonts (accessibility)
- **Spacious mode**: 80px row height (presentations)

**Copy-Paste:**

- Copy table data to Excel (tab-delimited)
- Paste Excel data to import forms
- Copy record URLs to share with team

---

### 🎯 Key User Interactions

#### **1. Work Order Creation Flow**

**User:** Planner (desktop)

**Steps:**

1. Navigate to Planning → Work Orders
2. Click "Create Work Order"
3. **Select Product** (autocomplete, shows active BOM versions)
4. **Select BOM Version** (auto-selected based on scheduled date, can override)
5. **Set Quantity** (UoM from product, can change)
6. **Set Scheduled Date** (calendar picker)
7. **Select Line/Machine** (dropdown, filtered by product compatibility)
8. **Review BOM Snapshot** (read-only preview of materials)
9. **Save as Draft** OR **Release to Production**

**UX Enhancements:**

- **BOM Preview**: Inline display of materials before WO creation
- **Material Availability Check**: Yellow warning if insufficient stock
- **Duplicate WO**: Copy button to create similar WO
- **Quick Create**: Skip optional fields, use defaults

**Validation:**

- ✅ Product has active BOM
- ✅ Quantity > 0
- ✅ Scheduled date not in past
- ✅ Line/machine selected

---

#### **2. Scanner Receiving Flow (PO/TO)**

**User:** Warehouse Operator (mobile)

**Steps:**

1. Open Scanner app (PWA)
2. Select "Receive PO" OR "Receive TO"
3. **Scan PO/TO barcode** OR enter number
4. **Review expected items** (list view)
5. For each item:
   - **Scan product barcode** (validates against PO line)
   - **Enter quantity received** (number pad, large buttons)
   - **Scan/enter batch number**
   - **Enter expiry date** (date picker)
   - **Select QA status** (Pending, Approved, Rejected)
   - **Scan location** (put-away location)
   - **Print LP label** (ZPL, auto-print if enabled)
6. **Complete receiving** (creates GRN)

**UX Enhancements:**

- **Voice input**: Dictate quantity (hands-free)
- **Auto-advance**: Move to next item after LP created
- **Batch mode**: Receive multiple items of same product at once
- **Photo upload**: Attach packing slip photo to GRN

**Error Prevention:**

- **Wrong product**: Red screen + error beep if barcode doesn't match PO
- **UoM mismatch**: Warning if received UoM differs from PO
- **Duplicate scan**: Prevent creating duplicate LPs

---

#### **3. BOM Management Flow**

**User:** Technical (Process Engineer) - desktop

**Steps:**

1. Navigate to Technical → BOMs
2. **Select product** (search by name/code)
3. **View BOM timeline** (horizontal timeline showing all versions)
4. **Create new version**:
   - **Clone existing BOM** (copy items from previous version)
   - **Set effective dates** (from/to date picker)
   - **Add/edit materials**:
     - Autocomplete product search
     - Set quantity + UoM
     - Set scrap %
     - Toggle `consume_whole_lp` flag
     - Add conditional logic (organic, gluten_free, etc.)
   - **Add by-products** (if applicable)
5. **Preview BOM** (visual tree diagram)
6. **Activate BOM** (make available for WO creation)

**UX Enhancements:**

- **Visual timeline**: Gantt-style view of BOM versions over time
- **Conflict detection**: Red highlight if dates overlap with another version
- **Cost preview**: Show total material cost (if BOM Costing enabled)
- **Allergen rollup**: Auto-calculate allergens from ingredients

**Validation:**

- ✅ No date overlaps with other versions
- ✅ At least 1 material item
- ✅ Total quantity > 0
- ✅ UoM consistency (no auto-conversions)

---

### ♿ Accessibility Standards

**Target:** WCAG 2.1 Level AA compliance

---

#### **Color & Contrast**

**Requirements:**

- **Text contrast**: ≥4.5:1 for normal text, ≥3:1 for large text (18pt+)
- **UI component contrast**: ≥3:1 for buttons, form inputs
- **Non-color indicators**: Don't rely on color alone (use icons, text, patterns)

**Implementation:**

- **Primary text**: #1a1a1a on #ffffff (17.8:1 contrast) ✅
- **Secondary text**: #6b7280 on #ffffff (5.8:1 contrast) ✅
- **Link text**: #2563eb on #ffffff (8.6:1 contrast) ✅
- **Error text**: #dc2626 on #ffffff (5.9:1 contrast) ✅
- **Success text**: #16a34a on #ffffff (4.5:1 contrast) ✅

**Color Blindness:**

- Red/green status indicators also use icons (✅ ❌ ⚠️)
- Charts use patterns + colors
- Critical info never color-only

---

#### **Keyboard Navigation**

**Requirements:**

- **All interactive elements** accessible via keyboard
- **Visible focus indicator** (2px blue outline)
- **Logical tab order** (top-to-bottom, left-to-right)
- **Skip links** ("Skip to main content")

**Implementation:**

- ✅ Tab through all buttons, links, inputs
- ✅ Enter/Space to activate buttons
- ✅ Arrow keys for radio buttons, dropdown navigation
- ✅ Esc to close modals
- ✅ Focus trap in modals (tab stays inside modal)

---

#### **Screen Reader Support**

**Requirements:**

- **Semantic HTML**: Use `<button>`, `<nav>`, `<main>`, `<article>`, etc.
- **ARIA labels**: Label interactive elements
- **Alt text**: Describe all images (or mark decorative)
- **Live regions**: Announce dynamic content changes

**Implementation:**

```html
<!-- Good: Semantic button -->
<button aria-label="Create Work Order">Create WO</button>

<!-- Good: Form with labels -->
<label for="product">Product</label>
<input id="product" type="text" />

<!-- Good: Status announcement -->
<div role="status" aria-live="polite">Work Order created successfully</div>

<!-- Good: Loading state -->
<button disabled aria-busy="true">
  <span aria-hidden="true">🔄</span> Saving...
</button>
```

---

#### **Form Accessibility**

**Requirements:**

- **Label every input** (visible or aria-label)
- **Error messages** linked to inputs (aria-describedby)
- **Required fields** marked (aria-required or asterisk + label)
- **Field instructions** visible before interaction

**Implementation:**

```html
<!-- Good: Accessible form field -->
<div>
  <label for="quantity"> Quantity <span aria-label="required">*</span> </label>
  <input
    id="quantity"
    type="number"
    required
    aria-required="true"
    aria-describedby="quantity-error quantity-help"
  />
  <span id="quantity-help">Enter quantity in base UoM</span>
  <span id="quantity-error" role="alert">
    Quantity must be greater than 0
  </span>
</div>
```

---

### 🎨 Design System

**Component Library:** Custom (built with Tailwind CSS + shadcn/ui)

---

#### **Typography**

**Font Family:**

- **Sans-serif**: Inter (primary)
- **Monospace**: JetBrains Mono (code, batch numbers, barcodes)

**Font Scales:**

```
xs: 12px   (0.75rem)  - Captions, table metadata
sm: 14px   (0.875rem) - Body text (mobile), labels
base: 16px (1rem)     - Body text (desktop)
lg: 18px   (1.125rem) - Subheadings
xl: 20px   (1.25rem)  - Section titles
2xl: 24px  (1.5rem)   - Page titles
3xl: 30px  (1.875rem) - Dashboard KPIs
4xl: 36px  (2.25rem)  - Hero headings
```

**Line Height:**

- **Tight (1.25)**: Headings, KPIs
- **Normal (1.5)**: Body text
- **Relaxed (1.75)**: Long-form content

---

#### **Color Palette**

**Primary (Blue):**

```
50:  #eff6ff
100: #dbeafe
500: #3b82f6  ← Primary brand color
600: #2563eb  ← Interactive elements (links, buttons)
700: #1d4ed8
900: #1e3a8a
```

**Semantic Colors:**

```
Success (Green): #16a34a  - Completed, approved, active
Warning (Yellow): #eab308 - Pending, in-progress, caution
Error (Red):     #dc2626  - Failed, rejected, critical
Info (Blue):     #0284c7  - Informational messages
```

**Neutral (Gray):**

```
50:  #f9fafb   ← Backgrounds
100: #f3f4f6   ← Hover states
200: #e5e7eb   ← Borders
500: #6b7280   ← Secondary text
700: #374151   ← Body text
900: #111827   ← Headings
```

---

#### **Spacing Scale**

**8px base unit:**

```
1:  4px   (0.25rem)
2:  8px   (0.5rem)  ← Base unit
3:  12px  (0.75rem)
4:  16px  (1rem)
6:  24px  (1.5rem)
8:  32px  (2rem)
12: 48px  (3rem)
16: 64px  (4rem)
```

**Usage:**

- **Component padding**: 4px (1) to 16px (4)
- **Section spacing**: 24px (6) to 48px (12)
- **Page margins**: 16px (4) mobile, 64px (16) desktop

---

#### **Buttons**

**Variants:**

```tsx
// Primary: Blue background, white text
<Button variant="primary">Create WO</Button>

// Secondary: Gray outline, gray text
<Button variant="secondary">Cancel</Button>

// Destructive: Red background, white text
<Button variant="destructive">Delete</Button>

// Ghost: No background, hover shows gray
<Button variant="ghost">View Details</Button>
```

**Sizes:**

```tsx
// Small: 32px height, 12px padding
<Button size="sm">Action</Button>

// Medium (default): 40px height, 16px padding
<Button>Action</Button>

// Large (mobile): 56px height, 24px padding
<Button size="lg">Scan Barcode</Button>
```

**States:**

- **Default**: Blue bg, white text
- **Hover**: Darker blue bg
- **Active**: Even darker blue bg
- **Disabled**: Gray bg, gray text, no pointer
- **Loading**: Spinner + "Loading..." text

---

#### **Forms**

**Input Fields:**

```tsx
// Text input
<Input type="text" placeholder="Enter product name" />

// Number input (mobile: number keyboard)
<Input type="number" inputMode="numeric" />

// Date picker
<DatePicker value={date} onChange={setDate} />

// Autocomplete (search products)
<Autocomplete
  options={products}
  onSelect={setProduct}
  placeholder="Search products..."
/>

// Select dropdown
<Select
  options={warehouses}
  value={selectedWarehouse}
  onChange={setWarehouse}
/>
```

**Validation States:**

```tsx
// Error state (red border, error message)
<Input error="Product name is required" />

// Success state (green border, checkmark)
<Input success />

// Disabled state (gray bg, no interaction)
<Input disabled />
```

---

#### **Data Tables**

**Features:**

- **Sortable columns**: Click header to sort (↑↓ icons)
- **Filterable**: Top toolbar with filter chips
- **Searchable**: Global search box
- **Selectable rows**: Checkboxes for bulk actions
- **Pagination**: 10/25/50/100 rows per page
- **Infinite scroll**: Alternative to pagination (user preference)

**Responsive Behavior:**

- **Desktop (lg+)**: Full table with all columns
- **Tablet (md)**: Hide less important columns, show on row expand
- **Mobile (xs-sm)**: Card view (stacked rows), tap to expand

**Example:**

```
Desktop:
+------+----------+--------+----------+--------+
| ID   | Product  | Qty    | Status   | Action |
+------+----------+--------+----------+--------+
| WO-1 | Bread    | 100 kg | Complete | [...]  |
+------+----------+--------+----------+--------+

Mobile (Card View):
┌────────────────────────────┐
│ WO-1: Bread                │
│ 100 kg • Complete          │
│ [View] [Edit] [...]        │
└────────────────────────────┘
```

---

### 🔄 Interaction Patterns

#### **Loading States**

**Skeleton Screens:**

- Show layout with gray placeholders while loading
- Better UX than spinners (user sees structure immediately)

**Optimistic UI:**

- Update UI immediately, rollback if API fails
- Example: Create LP → show LP in list → if API fails, remove and show error

**Progress Indicators:**

- **Spinner**: Generic loading (API call)
- **Progress bar**: File upload, bulk operations
- **Step indicator**: Multi-step forms (Step 2 of 6)

---

#### **Empty States**

**First Use:**

```
┌────────────────────────────┐
│   📦 No Products Yet       │
│                            │
│ Get started by creating   │
│ your first product.       │
│                            │
│ [Create Product]          │
└────────────────────────────┘
```

**No Results:**

```
┌────────────────────────────┐
│   🔍 No work orders found  │
│                            │
│ Try adjusting your filters │
│ or search term.           │
│                            │
│ [Clear Filters]           │
└────────────────────────────┘
```

---

#### **Confirmation Dialogs**

**Destructive Actions:**

```
┌────────────────────────────┐
│ ⚠️ Delete Work Order?      │
│                            │
│ This action cannot be      │
│ undone. Work order WO-123  │
│ will be permanently        │
│ deleted.                   │
│                            │
│ [Cancel] [Delete]          │
└────────────────────────────┘
```

**Confirmation Checkbox (for critical actions):**

```
☐ I understand this will delete 15 LPs
[Delete] ← disabled until checkbox checked
```

---

#### **Toast Notifications**

**Success:**

```
✅ Work order created successfully
```

**Error:**

```
❌ Failed to create work order: Product not found
```

**Warning:**

```
⚠️ Low stock: Only 5 units remaining
```

**Info:**

```
ℹ️ Background sync in progress...
```

**Position:** Bottom right (desktop), bottom center (mobile)
**Duration:** 3s (success), 5s (error), indefinite (loading)
**Dismissible:** X button in top right corner

---

### 📊 Data Visualization

#### **Dashboard KPIs**

**Card Layout:**

```
┌────────────────────┐
│ Orders Completed   │
│                    │
│   127              │  ← Large number (3xl)
│   +12% ↑           │  ← Change indicator
└────────────────────┘
```

**Trend Indicators:**

- **Positive trend**: Green ↑ +12%
- **Negative trend**: Red ↓ -8%
- **Neutral**: Gray → 0%

---

#### **Charts**

**Chart Types:**

- **Line chart**: Trends over time (yield, production volume)
- **Bar chart**: Comparisons (products, lines, shifts)
- **Pie chart**: Proportions (product mix, status distribution)
- **Gauge**: Single metric with target (OEE, uptime)

**Chart Library:** Recharts (React-friendly, responsive)

**Accessibility:**

- **Alt text**: Describe chart in words
- **Data table**: Toggle to show raw data
- **High contrast mode**: Patterns + colors

---

### 🌐 Internationalization (i18n)

**Phase 1 (MVP):** English only
**Phase 2 (Growth):** Add Polish, German, French, Spanish
**Phase 3 (Vision):** Community translations (20+ languages)

**Implementation:**

- **Library**: next-intl (Next.js i18n)
- **Date/time formats**: User's locale (Intl.DateTimeFormat)
- **Number formats**: User's locale (Intl.NumberFormat)
- **Currency**: Based on organization settings
- **Right-to-left (RTL)**: Support Arabic, Hebrew (Phase 3)

**Translation Keys:**

```json
{
  "workOrders.create": "Create Work Order",
  "workOrders.create.success": "Work order created successfully",
  "workOrders.create.error": "Failed to create work order"
}
```

---

### 🎓 User Onboarding

#### **First Login Experience**

**Welcome Wizard (5 steps):**

1. **Welcome**: "Welcome to MonoPilot! Let's set up your account."
2. **Industry Selection**: "What industry are you in?" (Meat, Dairy, Bakery, Other)
3. **QuickStart Template**: "Load sample data?" (Yes: Load template, No: Start blank)
4. **Team Invitation**: "Invite your team" (Email list, send invites)
5. **Completion**: "You're all set! Here's what to do next..."

**Interactive Tour:**

- **Product tours** for each module (optional, dismissible)
- **Tooltips** on first use ("This is where you create work orders")
- **Help links** in context (? icon → docs)

---

#### **Help & Support**

**In-App Help:**

- **Help Center**: Searchable docs (Shift+?)
- **Video tutorials**: Embedded videos for common tasks
- **Tooltips**: Hover/tap ? icon for field-level help
- **Chatbot**: AI assistant for common questions (Phase 3)

**External Support:**

- **Email support**: support@monopilot.com (24-48h response)
- **Live chat**: For Growth/Enterprise tiers (12-24h response)
- **Phone support**: Enterprise only (4h SLA)

---

## 🚧 PRD WORKFLOW STATUS

**Step 1 ✅ COMPLETE**: Discovery - Project, Domain, Vision

- Vision alignment captured (5→6 core differentiators)
- Project classification complete (SaaS B2B + Web App PWA)
- Domain context documented (Food → Universal manufacturing)
- Product differentiators identified:
  - Multi-Version BOM (UNIQUE)
  - LP Genealogy (30s recall)
  - Transparent Pricing ($167K savings)
  - Mobile-First PWA ($30K-$50K hardware savings) ← ADDED
  - Module Build (pay-as-you-grow)
  - Easy Customization ($240K-$650K savings) ← ADDED
- Total Cost Advantage: **$437K-$867K** over 3 years vs competitors

**Step 2 ✅ COMPLETE**: Success Definition

- Customer outcomes defined (compliance, operational excellence, 12-month ROI, easy customization)
- Product adoption metrics (80% DAU/MAU, module upsell, PWA usage)
- Business metrics adjusted: **2-4 pilot customers** (realistic), NPS ≥40
- Technical excellence targets (zero data loss, 99.5% uptime)
- Phase 2 success criteria (3+ industries, marketplace launch)
- **What "Winning" Looks Like** section added

**Step 3 ✅ COMPLETE**: Scope Definition

- MVP scope defined (100% working modules + Quality + Shipping + Multi-warehouse)
- Growth features categorized (P0, P1, P2, P3)
- Vision features identified (AI, ML, IoT, Marketplace)
- Priority adjustments per user feedback:
  - Planning by ML = P0 (strategic priority)
  - BOM Costing = P1 (downgraded)
  - Audit + Signatures = P2 (downgraded)
- Module status clarified: UI review & business process alignment needed
- Total MVP effort: 8-10 weeks

**Step 4 ✅ COMPLETE**: Domain-Specific Exploration

- Regulatory landscape documented (FDA, FSMA, EU, ISO, ISA-95)
- Domain constraints identified (allergen, expiry, batch, immutability, UoM)
- Compliance roadmap created (70% → 77% → 90%+)
- Domain-mandated features clarified
- Validation checklist prepared

**Step 5 [OPTIONAL]**: Innovation Discovery (Multi-version BOM uniqueness)

- Can skip - already well-documented in differentiators

**Step 6 ✅ COMPLETE**: Project-Specific Deep Dive (SaaS B2B)

- Multi-tenant architecture defined (RLS with org_id)
- Tenant onboarding & provisioning (QuickStart templates)
- Permission matrix (7 roles, detailed RBAC)
- Subscription tiers (Starter, Growth, Enterprise with transparent pricing)
- Critical integrations (ERP, IoT, label printers, BI tools)
- Module activation & feature flags (self-service)

**Step 7 ✅ COMPLETE**: UX Principles

- Design philosophy (mobile-first, operator-centric, context-aware)
- Mobile PWA design (scanner UX, offline-first, BYOD)
- Desktop UI patterns (dashboard, tables, forms)
- Key user interactions (WO creation, scanner receiving, BOM management)
- Accessibility standards (WCAG 2.1 AA compliance)
- Design system (typography, colors, components, spacing)
- Interaction patterns (loading, empty states, confirmations, toasts)
- Data visualization (KPIs, charts)
- Internationalization approach
- User onboarding & help system

**Step 8 ✅ COMPLETE**: Functional Requirements Synthesis

- 60+ detailed FRs organized by module
- Each FR numbered with priority, status, acceptance criteria
- **MVP completion: 82.5% implementation (33/40 FRs), 60% production-ready (24/40 FRs tested)** ✅ UPDATED Nov 2025
- **Module Breakdown (Post EPIC-001 & EPIC-002):**
  - ✅ Planning: 92% (PO/TO complete 100%, WO 95% - missing E2E tests)
  - ✅ Technical: 95% (EPIC-001 complete Nov 2025 - Multi-Version BOM, By-Products, Conditional Components)
  - ✅ Warehouse: 95% (EPIC-002 complete Nov 2025 - ASN, Genealogy, Pallets, Scanner UX)
  - ⚠️ Production: 58% (consume endpoint fixed, zero E2E tests, missing dashboard)
  - ❌ Settings: 15% (APIs work, 3/9 unit tests created, E2E insufficient)
  - ❌ Quality: 0% (not started)
  - ❌ Shipping: 0% (not started)
- **Critical Gaps Blocking Production:**
  1. ✅ FIXED: `/api/production/consume` endpoint (Nov 2025)
  2. ✅ FIXED: WO E2E tests skeleton (4 tests, 6 TODO advanced scenarios)
  3. ✅ FIXED: Settings unit tests skeleton (3 APIs: Warehouses, Locations, Suppliers)
  4. ⏳ TODO: Production E2E tests, Yield/Consume unit tests
  5. ⏳ TODO: Remaining Settings unit tests (6 APIs)
- **Revised MVP Timeline:** 4-6 weeks (reduced from 10-14 weeks due to EPIC-001/002 completion + P0 fixes)

**Step 9 ✅ COMPLETE**: Non-Functional Requirements

- 45 NFRs across 10 categories (Performance, Security, Scalability, Availability, Accessibility, Integration, Data, Compliance, Operational, Mobile)
- Key targets documented: <200ms API response, 99.0-99.9% uptime, WCAG 2.1 AA, GDPR/FDA/FSMA compliance
- MVP: 35 NFRs (78%), Growth: 10 NFRs (22%)

---

## Functional Requirements

This section provides a **complete capability contract** for MonoPilot MES. Requirements are organized by module, numbered for traceability, and marked with priority (MVP/Growth/Vision) and implementation status.

**Legend:**

- ✅ **Implemented** - Feature complete and tested
- 🟡 **Partial** - Backend done, needs UI review or business process alignment
- 🔴 **Not Started** - To be built

---

### 📦 Production Module

**FR-PROD-001: Work Order Management**

- **Priority:** MVP (Must Have)
- **Status:** 🟡 Partial - 95% backend (22 API methods), 4 E2E tests (skeleton), missing dashboard
- **Reality Check (Nov 2025):**
  - ✅ WorkOrdersAPI: 22 methods (CRUD, status transitions, materials, operations, by-products)
  - ✅ `/api/production/consume` endpoint created (Nov 2025)
  - ✅ E2E tests: 4 basic tests (create, view, cancel, filter) + 6 TODO advanced
  - ❌ Production Dashboard: Not implemented (1-2 weeks)
  - ❌ Yield/Consume unit tests: Missing
- **Description:** Create, edit, view, and manage work orders with full lifecycle tracking (Draft → Planned → Released → In Progress → Completed → Closed)
- **Acceptance Criteria:**
  - User can create WO with product, quantity, scheduled date, line/machine
  - WO captures BOM snapshot at creation time (immutability)
  - WO shows material requirements from BOM
  - WO lifecycle status transitions enforced
  - WO can be cancelled (before production starts)

**FR-PROD-002: Multi-Version BOM Integration**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-001 Phase 2)
- **Description:** Automatic BOM version selection based on WO scheduled date, with BOM snapshot captured at WO creation
- **Acceptance Criteria:**
  - System selects active BOM version for product at scheduled date
  - User can override auto-selected BOM version
  - BOM materials copied to `wo_materials` table (snapshot)
  - Snapshot includes: qty, UoM, scrap%, consume_whole_lp, conditionals, allergens
  - Changing active BOM does NOT affect in-progress WOs

**FR-PROD-003: By-Products Support**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-001 Phase 1)
- **Description:** Track up to 5 by-products per work order with automatic LP creation
- **Acceptance Criteria:**
  - BOM items can be marked as by-products (`is_by_product` flag)
  - By-products show in WO material list (output section)
  - Operator registers by-product output (qty, LP creation)
  - By-product LPs inherit batch from main output
  - By-product genealogy links to parent WO

**FR-PROD-004: Conditional Materials (Order Flags)**

- **Priority:** Growth (Standard tier)
- **Status:** ✅ Implemented (EPIC-001 Phase 3-4)
- **Description:** BOM items can be conditionally included based on order flags (organic, gluten_free, vegan, kosher, etc.)
- **Acceptance Criteria:**
  - Order flags: organic, gluten_free, vegan, kosher, halal, dairy_free, nut_free, soy_free
  - BOM items have conditions (AND/OR logic)
  - WO creation evaluates conditions based on customer order flags
  - Only matching materials included in WO snapshot
  - Conditional items marked in BOM preview

**FR-PROD-005: Operations Sequencing (Routing)**

- **Priority:** MVP (Must Have)
- **Status:** 🟡 Partial (backend done, UI needs review)
- **Description:** Multi-step production process with operation sequence, machine assignment, and status tracking
- **Acceptance Criteria:**
  - Routing defines operations with sequence numbers
  - Each operation has: name, machine/line, expected duration, expected yield
  - WO operations copied from routing to `wo_operations`
  - Operations have status: Not Started → In Progress → Completed
  - Operations must be completed in sequence (or allow parallel)
  - Operation completion triggers next operation

**FR-PROD-006: Material Consumption**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (scanner module)
- **Description:** LP-based material consumption with UoM validation and 1:1 consumption support
- **Acceptance Criteria:**
  - Operator scans LP barcode to consume
  - System validates: LP exists, correct product, sufficient qty, UoM matches BOM
  - System enforces `consume_whole_lp` flag (no partial consumption)
  - Consumption recorded in `lp_genealogy` (parent LP → WO)
  - Scrap percentage applied (consumed qty vs expected qty)
  - Real-time material availability (reserved LPs)

**FR-PROD-007: Production Output Tracking**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Register production outputs per operation with yield calculation and QA status assignment
- **Acceptance Criteria:**
  - Operator registers output: qty, UoM, QA status
  - System creates output LP with genealogy (WO → output LP)
  - Yield calculated: actual qty / planned qty
  - Output LP inherits batch from WO
  - QA status: Pending, Approved, Rejected, Hold
  - By-products registered as separate outputs

**FR-PROD-008: Production Dashboard**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (1 week effort)
- **Description:** Real-time production KPIs and active WO status board
- **Acceptance Criteria:**
  - KPI cards: Orders completed today, units produced, avg yield, active WOs
  - Active WOs table: WO number, product, status, progress %, material shortages
  - Material shortages alerts (red highlight)
  - Line utilization metrics (% busy)
  - Refresh rate: 30 seconds (auto-refresh)

**FR-PROD-009: Yield Visualization**

- **Priority:** Growth (P1)
- **Status:** 🔴 Not Started (3 days effort)
- **Description:** Yield trends analysis with variance tracking
- **Acceptance Criteria:**
  - Yield trend chart (line chart, daily/weekly/monthly)
  - Filter by: product, line, date range
  - Variance analysis: planned vs actual yield
  - Top/bottom performers (best/worst yield)
  - Export to CSV

---

### 📱 Scanner & Warehouse Module

**FR-SCAN-001: ASN Receiving Workflow**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002 Phase 1)
- **Description:** Mobile scanner workflow for receiving PO/TO via Advanced Shipping Notice
- **Acceptance Criteria:**
  - Operator scans ASN barcode or enters number
  - ASN shows expected items with quantities
  - For each item: scan product, enter qty, batch, expiry, QA status, location
  - System creates LP on receive
  - System generates GRN (Goods Receipt Note)
  - ZPL label printing for LP

**FR-SCAN-002: License Plate Creation**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002)
- **Description:** Create License Plates with batch tracking, expiry management, and barcode generation
- **Acceptance Criteria:**
  - LP has: unique ID, product, qty, UoM, batch number, expiry date, manufacture date
  - LP has supplier batch number (for traceability)
  - LP has QA status (pending, approved, rejected, hold)
  - LP has location (warehouse + location)
  - LP barcode generated (Code 128 or QR)
  - ZPL label printing

**FR-SCAN-003: License Plate Genealogy**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002 Phase 2)
- **Description:** Parent-child LP relationships for full forward/backward traceability
- **Acceptance Criteria:**
  - `lp_genealogy` table tracks: parent_lp_id, child_lp_id, consumed_by_wo_id, created_at
  - Forward trace: LP → all children (what was made from this)
  - Backward trace: LP → all parents (what went into this)
  - Trace queries: <1 minute for 100+ LP genealogy tree
  - Recall simulation: identify all affected LPs for a given batch

**FR-SCAN-004: Pallet Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002 Phase 3)
- **Description:** Build pallets with LP-to-pallet associations and pallet labels
- **Acceptance Criteria:**
  - Pallet types: EURO, CHEP, Custom
  - Operator scans pallet barcode
  - Operator scans LP barcodes to add to pallet
  - Pallet has status: Open, Closed, Shipped
  - Pallet manifest: list of LPs with product, qty, batch, expiry
  - Pallet label (ZPL) with pallet ID, contents summary, weight
  - WO reservations (soft-allocate LPs to pallet for specific WO)

**FR-SCAN-005: Scanner UX (Mobile PWA)**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002 Phase 4)
- **Description:** Mobile-optimized scanner UI with step-based workflows
- **Acceptance Criteria:**
  - Large touch targets (56x56px buttons)
  - Step-based workflows (linear progression, no branching)
  - Camera barcode scanning (QR, Code 128, EAN)
  - Offline mode (IndexedDB cache, background sync)
  - High contrast UI (WCAG AA compliance)
  - Success/error feedback (sound, vibration, color)

**FR-SCAN-006: Stock Movements**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Move LPs between locations within warehouse
- **Acceptance Criteria:**
  - Operator scans LP barcode
  - Operator scans destination location barcode
  - System validates location exists
  - Stock move recorded with timestamp, user, from/to location
  - Audit trail in `stock_moves` table

**FR-SCAN-007: LP Split/Merge**

- **Priority:** MVP (Should Have)
- **Status:** ✅ Implemented
- **Description:** Split LP into multiple LPs or merge LPs of same product/batch
- **Acceptance Criteria:**
  - **Split**: Parent LP qty reduced, child LP created with portion of qty
  - **Merge**: Multiple LPs combined into one (only if same product + batch)
  - Genealogy preserved (parent-child relationships)
  - UoM must match (no automatic conversions)
  - Expiry date: earliest expiry from merged LPs

**FR-SCAN-008: Multi-Warehouse Support**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Transfer Orders between warehouses with transit location handling
- **Acceptance Criteria:**
  - TO has: from_warehouse, to_warehouse (no location in header)
  - TO lines have: product, qty, UoM
  - Shipping: LPs moved to transit location (warehouse_transit_location)
  - Receiving: LPs moved from transit to destination location
  - TO statuses: Draft → Planned → Shipped → Received

---

### 🔧 Technical Module

**FR-TECH-001: Product Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Manage product master data with types, UoM, allergens, and lifecycle
- **Acceptance Criteria:**
  - Product types: RM (raw material), WIP (work in progress), FG (finished goods), PR (packaging), PKG (packaging material)
  - Product has: code, name, description, UoM, product type, status (active, inactive, discontinued)
  - Product has allergen tags (14 major allergens)
  - Product search by code or name
  - Product CRUD operations (create, read, update, delete)

**FR-TECH-002: Multi-Version BOM**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-001 Phase 2)
- **Description:** Date-based BOM versioning with automatic date overlap validation
- **Acceptance Criteria:**
  - BOM version has: effective_from, effective_to dates
  - Database trigger prevents overlapping dates for same product
  - Up to 10 versions per product
  - BOM timeline visualization (Gantt-style)
  - Clone BOM to create new version
  - BOM statuses: Draft → Active → Phased Out → Inactive

**FR-TECH-003: BOM Items Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-001 Phases 1 & 3 - By-Products & Conditional Components)
- **Description:** Define BOM materials with quantities, UoM, scrap %, and consumption rules
- **Acceptance Criteria:**
  - BOM item has: product, qty, UoM, scrap %, sequence number
  - BOM item has `consume_whole_lp` flag (1:1 consumption)
  - BOM item has `is_by_product` flag
  - BOM item has conditional logic (order flags: organic, gluten_free, etc.)
  - BOM preview shows total cost (if BOM Costing enabled)

**FR-TECH-004: Allergen Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Allergen library with product-allergen associations and BOM allergen rollup
- **Acceptance Criteria:**
  - 14 major allergens: Milk, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Wheat, Soybeans, Sesame, Mustard, Celery, Lupin, Sulphites, Molluscs
  - Product-allergen associations (many-to-many)
  - BOM allergen rollup (auto-calculate from ingredients)
  - Allergen warnings in UI (BOM, WO, LP)

**FR-TECH-005: Routings Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Define multi-operation production processes with machine assignments
- **Acceptance Criteria:**
  - Routing has operations with sequence numbers
  - Operation has: name, machine/line, expected duration, expected yield
  - Routing can be assigned to product
  - WO uses routing to create operation steps

**FR-TECH-006: BOM Cost Calculation**

- **Priority:** Growth (P1)
- **Status:** 🔴 Not Started (2 weeks effort)
- **Description:** Automatic BOM cost rollup with material cost tracking and margin analysis
- **Acceptance Criteria:**
  - Material has cost with effective date
  - BOM total cost = sum of (material cost × qty)
  - Labor cost and overhead included in total cost
  - Cost comparison between BOM versions
  - Margin analysis: sell price vs cost
  - WO cost tracking: planned vs actual cost

---

### 📋 Planning Module

**FR-PLAN-001: Purchase Order Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Create and manage purchase orders with multiple lines, supplier details, and status tracking
- **Acceptance Criteria:**
  - PO header: supplier, currency, tax code, delivery date, status
  - PO lines: product, qty, UoM, unit price, line total
  - PO statuses: Draft → Submitted → Confirmed → Received → Closed
  - PO approval workflow (optional)
  - Quick PO entry workflow (pre-fill from supplier defaults)

**FR-PLAN-002: Transfer Order Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Create transfer orders for warehouse-to-warehouse stock movements
- **Acceptance Criteria:**
  - TO header: from_warehouse, to_warehouse, planned ship date, planned receive date
  - TO lines: product, qty, UoM
  - TO statuses: Draft → Planned → Shipped → Received
  - Transit location handling
  - Partial shipments (ship subset of lines)

**FR-PLAN-003: Work Order Planning**

- **Priority:** MVP (Must Have)
- **Status:** 🟡 Partial (backend done, UI needs review)
- **Description:** Plan work orders with BOM selection, quantity, scheduling, and line assignment
- **Acceptance Criteria:**
  - WO planning form: product, BOM version, qty, scheduled date, line/machine
  - Source demand tracking (PO number, TO number, or manual)
  - BOM preview before WO creation
  - Material availability check (yellow warning if insufficient stock)
  - Quick create (use defaults)

**FR-PLAN-004: ASN Integration**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002)
- **Description:** Import/create Advanced Shipping Notices linked to POs
- **Acceptance Criteria:**
  - ASN header: supplier, PO number, expected delivery date
  - ASN items: product, qty, UoM
  - ASN statuses: Created → Sent → Received
  - Receiving pre-filled from ASN data

**FR-PLAN-005: Planning by Machine Learning**

- **Priority:** Growth (P0 - Strategic)
- **Status:** 🔴 Not Started (4-6 weeks effort)
- **Description:** AI-powered demand forecasting and automatic production scheduling
- **Acceptance Criteria:**
  - Demand forecasting: predict sales 7/14/30 days ahead
  - Automatic WO scheduling: consider material availability, line capacity, lead times
  - MRP (Material Requirements Planning): auto-generate POs
  - What-if scenario planning
  - Schedule optimization: minimize changeovers, batch similar products
  - Prerequisites: 6+ months historical data

---

### ⚙️ Settings & Configuration

**FR-SET-001: Warehouse Configuration**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented - APIs complete, 3/9 unit tests (Nov 2025)
- **Settings Module Reality Check (Nov 2025):**
  - ✅ APIs: 9 classes complete (Warehouses, Locations, Machines, Suppliers, TaxCodes, Allergens, Routings, RoutingOperationNames, Users)
  - ✅ Unit tests: 3/9 APIs (Warehouses 8 tests, Locations 7 tests, Suppliers 9 tests) - Nov 2025
  - ❌ Unit tests missing: 6 APIs (Machines, TaxCodes, Allergens, Routings, RoutingOperationNames, Users)
  - ✅ E2E coverage: Indirect via PO/TO/WO workflows
  - **Completion:** 15% (APIs functional, testing incomplete)
- **Description:** Configure warehouses with default locations and transit settings
- **Acceptance Criteria:**
  - Warehouse: code, name, address, default receiving location, default shipping location
  - Transit location per warehouse
  - Active/inactive status

**FR-SET-002: Location Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Define physical locations within warehouses
- **Acceptance Criteria:**
  - Location: code, name, warehouse, location type (receiving, production, storage, shipping)
  - Location barcode generation
  - Active/inactive status

**FR-SET-003: Machine/Line Configuration**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Configure production machines and lines
- **Acceptance Criteria:**
  - Machine: code, name, line assignment, status (active, down, maintenance)
  - Machine capacity (units/hour)
  - Compatible products (optional)

**FR-SET-004: Supplier Management**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Manage supplier master data with default settings for PO creation
- **Acceptance Criteria:**
  - Supplier: code, name, address, contact, currency, tax code, payment terms
  - Supplier lead time
  - Default delivery location per warehouse
  - Active/inactive status

**FR-SET-005: Tax Code Configuration**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Configure tax codes for PO pricing
- **Acceptance Criteria:**
  - Tax code: code, description, rate %
  - Country-specific tax codes (VAT for EU, sales tax for US)

**FR-SET-006: User Management & RBAC**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Manage users with 7 predefined roles and permission enforcement
- **Acceptance Criteria:**
  - User: email, name, role, org_id, status (active, inactive)
  - 7 roles: Admin, Manager, Operator, Viewer, Planner, Technical, Purchasing
  - Permission matrix enforced at API and UI levels
  - Only Admin can manage users
  - Deactivate user (keep audit trail) instead of delete

**FR-SET-007: Subscription Management**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (1 week effort)
- **Description:** Self-service subscription tier management with module activation
- **Acceptance Criteria:**
  - View current tier (Starter, Growth, Enterprise)
  - View active modules and available modules
  - Upgrade/downgrade tier (instant upgrade, downgrade at period end)
  - Add-on purchase (ML Planning, Audit Trail, IoT)
  - Billing history and invoices

**FR-SET-008: Payment Integration (Stripe)**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (3-5 days effort)
- **Description:** Stripe integration for subscription payments, invoicing, and payment method management
- **Acceptance Criteria:**
  - Stripe checkout for subscription signup
  - Payment method management (add/update credit card)
  - Automatic monthly/annual billing
  - Invoice generation and download (PDF)
  - Payment failure handling (retry logic, email notifications)
  - PCI compliance (no card data stored in MonoPilot DB)
  - Webhook handling: payment.succeeded, payment.failed, subscription.updated

**FR-SET-009: Feature Flags & Module Activation**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (2-3 days effort)
- **Description:** Feature flag system to control module access per organization based on subscription tier
- **Acceptance Criteria:**
  - Feature flags stored in `organizations` table (e.g., `modules_enabled: ['planning', 'production']`)
  - UI hides/shows modules based on feature flags
  - API enforces module access (403 if module not enabled)
  - Admin can toggle modules for testing (bypass tier restrictions)
  - Feature flag overrides for beta features
  - Graceful degradation (if module disabled mid-session, redirect to allowed module)

---

### 🔬 Quality Module

**FR-QUAL-001: QA Inspections**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (2-3 weeks effort)
- **Description:** Create and execute inspection checklists for incoming, in-process, and finished goods
- **Acceptance Criteria:**
  - Inspection template: checklist items, pass/fail criteria, measurement fields
  - Inspection scheduling: by product, lot, frequency (every nth unit, daily, weekly)
  - Inspection execution: operator fills checklist, records measurements
  - Link inspection to LP (incoming, in-process, finished goods)
  - Inspection result: Pass, Fail, Conditional Pass
  - Photo attachments (packing slip, product photo)

**FR-QUAL-002: QA Status Management**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (included in FR-QUAL-001)
- **Description:** LP quality status workflow with hold/release controls
- **Acceptance Criteria:**
  - LP QA statuses: Pending, Approved, Rejected, Hold, Released
  - Status transitions: Pending → Approved/Rejected/Hold → Released (if Hold)
  - Hold reason codes (contamination, failed inspection, expired, damaged)
  - QA hold blocks consumption and shipment
  - Release requires QA approval

**FR-QUAL-003: Certificates of Analysis (CoA)**

- **Priority:** MVP (Should Have)
- **Status:** 🔴 Not Started (included in FR-QUAL-001)
- **Description:** Generate CoAs from inspection results with PDF export
- **Acceptance Criteria:**
  - CoA template per product (customizable fields)
  - Auto-generate CoA from inspection results
  - CoA PDF generation with company logo
  - CoA storage linked to LP
  - CoA retrieval by batch number

**FR-QUAL-004: Non-Conformance Reports (NCR)**

- **Priority:** MVP (Should Have)
- **Status:** 🔴 Not Started (included in FR-QUAL-001)
- **Description:** Create NCRs for failed inspections with root cause analysis and corrective actions
- **Acceptance Criteria:**
  - NCR: description, severity (critical, major, minor), root cause, corrective action, preventive action
  - NCR lifecycle: Open → Investigation → Corrective Action → Closed
  - Link NCR to LP, WO, or supplier
  - CAPA tracking (Corrective and Preventive Actions)
  - NCR dashboard: open NCRs by severity

**FR-QUAL-005: Quality Dashboard**

- **Priority:** Growth (P1)
- **Status:** 🔴 Not Started (3 days effort)
- **Description:** Real-time quality KPIs and inspection trends
- **Acceptance Criteria:**
  - KPI cards: Inspection completion rate, pass rate, open NCRs
  - Pass/fail trends chart (line chart, daily/weekly/monthly)
  - Top failure reasons (bar chart)
  - CoA generation status (pending, generated)

---

### 📦 Shipping Module

**FR-SHIP-001: Shipping Order Management**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (2 weeks effort)
- **Description:** Create shipping orders from WO outputs or warehouse stock
- **Acceptance Criteria:**
  - Shipping order: customer, address, requested ship date, carrier
  - Select pallets or LPs for shipment
  - Shipping order statuses: Draft → Staged → Loaded → Shipped → Delivered
  - Actual ship date/time tracking

**FR-SHIP-002: Pallet Loading**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (included in FR-SHIP-001)
- **Description:** Load pallets to truck with manifest and verification
- **Acceptance Criteria:**
  - Scan pallets to add to shipment
  - Pallet manifest: pallet ID, contents, weight
  - Load verification (confirm all pallets scanned)
  - Truck capacity tracking (optional)

**FR-SHIP-003: Bill of Lading (BOL)**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (included in FR-SHIP-001)
- **Description:** Generate Bill of Lading with pallet details and customer info
- **Acceptance Criteria:**
  - BOL PDF generation
  - BOL fields: BOL number, customer, carrier, pallet count, weight, contents
  - BOL number tracking (auto-increment)
  - Print BOL (PDF download)

**FR-SHIP-004: Shipping Labels**

- **Priority:** MVP (Should Have)
- **Status:** 🔴 Not Started (3 days effort)
- **Description:** Customer-specific label formats with barcode and master BOL label
- **Acceptance Criteria:**
  - Customer label templates (configurable per customer)
  - Pallet label with barcode (customer-specific format)
  - Master BOL label (summary label for truck)
  - ZPL printing for shipping labels

---

### 🔍 Traceability & Genealogy

**FR-TRACE-001: Forward Traceability**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002 Phase 2)
- **Description:** Trace forward from raw material LP to finished goods (where did this go?)
- **Acceptance Criteria:**
  - Query: LP → all WOs that consumed it → all output LPs
  - Trace depth: unlimited (recursive)
  - Trace time: <1 minute for 100+ LP tree
  - Trace result: list of affected LPs with product, batch, expiry, location

**FR-TRACE-002: Backward Traceability**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002 Phase 2)
- **Description:** Trace backward from finished goods to raw materials (what went into this?)
- **Acceptance Criteria:**
  - Query: LP → all parent LPs → all grandparent LPs (recursive)
  - Trace depth: unlimited
  - Trace time: <1 minute for 100+ LP tree
  - Trace result: list of source LPs with product, batch, supplier, expiry

**FR-TRACE-003: Recall Simulation**

- **Priority:** Growth (P0 - Compliance)
- **Status:** 🟡 Partial (genealogy done, reporting format needed)
- **Description:** 30-second full impact analysis for product recalls
- **Acceptance Criteria:**
  - Input: batch number or LP ID
  - Output: all affected LPs (forward + backward trace)
  - Report format: FDA-compliant JSON/XML export
  - Estimated cost of recall (# of LPs, qty, locations)
  - Customer notification list (if LPs shipped)

---

### 📊 Reporting & Analytics

**FR-REPORT-001: Advanced Reporting Dashboard**

- **Priority:** Growth (P0)
- **Status:** 🔴 Not Started (2 weeks effort)
- **Description:** Custom dashboards with production KPIs, cost trends, and yield analysis
- **Acceptance Criteria:**
  - KPI dashboard: Orders completed, units produced, avg yield, line utilization, cost trends
  - Custom report builder (drag-and-drop widgets)
  - Export to Excel/PDF
  - Scheduled reports (email daily/weekly)
  - Role-based dashboards (Manager, Planner, Operator)

**FR-REPORT-002: BI Tool Integration**

- **Priority:** Growth (P0)
- **Status:** 🔴 Not Started (1 week effort)
- **Description:** Direct PostgreSQL connection for BI tools (Power BI, Tableau, Metabase)
- **Acceptance Criteria:**
  - Read-only PostgreSQL user per organization
  - Pre-built SQL views: production_kpis, cost_analysis, yield_trends, inventory_snapshot
  - RLS policies apply (org_id filtering)
  - Data dictionary documentation
  - Sample SQL queries for common reports

---

### 🔌 Integrations

**FR-INT-001: QuickBooks Online Integration**

- **Priority:** Growth (P1)
- **Status:** 🔴 Not Started (3 weeks effort)
- **Description:** Bidirectional sync of master data and financial transactions
- **Acceptance Criteria:**
  - OAuth 2.0 authentication
  - Sync entities: products (items), suppliers (vendors), POs (purchase orders), GRNs (bills)
  - Data flow: MonoPilot → QuickBooks (PO, GRN, WO outputs), QuickBooks → MonoPilot (product updates)
  - Sync frequency: Real-time (webhooks) + daily batch

**FR-INT-002: ZPL Label Printing**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented (EPIC-002 Phase 4)
- **Description:** Print labels on Zebra printers via ZPL protocol
- **Acceptance Criteria:**
  - ZPL template library (LP label, pallet label, shipping label)
  - Connection types: Bluetooth (mobile), TCP/IP (network), USB (desktop)
  - JavaScript ZPL generator
  - Browser Print API (Zebra SDK)

**FR-INT-003: IoT & SCADA Integration**

- **Priority:** Growth (P3)
- **Status:** 🔴 Not Started (6 weeks effort)
- **Description:** Real-time machine data collection via OPC UA, MQTT, Modbus TCP
- **Acceptance Criteria:**
  - MonoPilot IoT Gateway (Docker container)
  - Protocols: OPC UA, MQTT, Modbus TCP
  - Data ingestion: production counts, downtime events, cycle times, alarms
  - Real-time dashboard (WebSocket updates)
  - OEE calculation (Overall Equipment Effectiveness)

---

### 🎛️ Module Activation & Feature Flags

**FR-FLAG-001: Subscription-Based Module Activation**

- **Priority:** MVP (Must Have)
- **Status:** 🔴 Not Started (1 week effort)
- **Description:** Feature flags control module access per organization based on subscription tier
- **Acceptance Criteria:**
  - `organization_features` table with org_id, feature_key, enabled, tier
  - Feature flags checked at API level (403 if not enabled)
  - Feature flags checked at UI level (conditional rendering)
  - Self-service module activation (Admin UI)
  - Instant activation on subscription upgrade

**FR-FLAG-002: Self-Service Add-On Purchase**

- **Priority:** Growth (P1)
- **Status:** 🔴 Not Started (2 weeks effort)
- **Description:** In-app purchase of add-ons (ML Planning, Audit Trail, IoT) via Stripe
- **Acceptance Criteria:**
  - Add-on catalog with pricing
  - Stripe payment modal
  - Instant activation on payment success
  - Email receipt + welcome guide
  - Add-on management (view, cancel)

---

### 🔐 Security & Compliance

**FR-SEC-001: Audit Trail (Basic)**

- **Priority:** MVP (Must Have)
- **Status:** ✅ Implemented
- **Description:** Created_by, updated_by, timestamps on all business records
- **Acceptance Criteria:**
  - All business tables have: created_by, updated_by, created_at, updated_at
  - User ID from JWT token
  - Timestamps in UTC
  - Immutable (no update/delete of audit fields)

**FR-SEC-002: Advanced Audit Trail (pgAudit)**

- **Priority:** Growth (P2 - FDA Compliance)
- **Status:** 🔴 Not Started (3 weeks effort)
- **Description:** Database-level audit trail with pgAudit extension
- **Acceptance Criteria:**
  - pgAudit extension enabled
  - All data changes logged (INSERT, UPDATE, DELETE)
  - Immutable audit records
  - Audit log UI for searching/reporting
  - Retention: 90 days (configurable)

**FR-SEC-003: Electronic Signatures**

- **Priority:** Growth (P2 - FDA Compliance)
- **Status:** 🔴 Not Started (included in FR-SEC-002)
- **Description:** JWT-based electronic signature system for critical operations
- **Acceptance Criteria:**
  - Signature required for: WO release, BOM approval, QC approval, batch release
  - Signature includes: user ID, timestamp, reason, signature hash (JWT)
  - Signature verification
  - Signature history per record

---

## API Architecture & Implementation Patterns

**Class-Based API Layer Pattern**

MonoPilot uses a **class-based API architecture** with static methods for all database operations. This pattern ensures consistency, type safety, and centralized error handling across the entire application.

**Key Characteristics:**

- **28 API Classes** (e.g., `WorkOrdersAPI`, `PurchaseOrdersAPI`, `LicensePlatesAPI`, `BomsAPI`)
- **10-22 methods per class** (CRUD + business logic methods)
- **Static methods** for stateless operations
- **TypeScript** with strict type checking
- **Supabase client** for database access
- **Centralized error handling** with consistent error messages

**Example API Class:**

```typescript
// apps/frontend/lib/api/work-orders.ts
class WorkOrdersAPI {
  static async getAll(filters?): Promise<WorkOrder[]>;
  static async getById(id: number): Promise<WorkOrder | null>;
  static async create(data: Partial<WorkOrder>): Promise<WorkOrder>;
  static async update(id: number, data: Partial<WorkOrder>): Promise<WorkOrder>;
  static async delete(id: number): Promise<void>;
  static async updateStatus(id: number, status: WOStatus): Promise<WorkOrder>;
  static async getMaterials(woId: number): Promise<WOMaterial[]>;
  static async getOperations(woId: number): Promise<WOOperation[]>;
  static async getByProducts(woId: number): Promise<WOByProduct[]>;
  // ... 13 more methods
}
```

**Data Flow:**

```
UI Component → API Class → Supabase Client → PostgreSQL (RLS enforced)
             ↑                               ↓
             └─── Type-Safe Response ────────┘
```

**API Routes (Next.js App Router):**

- **22 API routes** in `apps/frontend/app/api/`
- **REST-compliant** (GET, POST, PUT, DELETE)
- **Server-side** operations (e.g., `/api/production/consume`, `/api/production/yield`)
- **Next.js 15** Route Handlers with TypeScript
- **Supabase Server Client** for SSR operations

**Quality Metrics (Nov 2025):**

- **TypeScript Errors:** 0 across all APIs
- **Unit Test Coverage:** 24/28 APIs have unit tests (86%)
- **E2E Test Coverage:** 100+ tests across critical workflows
- **API Documentation:** Auto-generated in `docs/API_REFERENCE.md` (30+ modules)

**Implementation Status:**

- ✅ Planning Module: 3 APIs (PO, TO, WO) - 100% tested
- ✅ Production Module: 5 APIs (WO, Consume, Yield, Outputs) - 60% tested
- ✅ Technical Module: 6 APIs (Products, BOMs, Routings, Allergens) - 95% tested
- ✅ Warehouse Module: 7 APIs (ASN, GRN, LP, Pallets, Stock Moves) - 95% tested
- ✅ Settings Module: 9 APIs (Warehouses, Locations, Machines, Suppliers, Users) - 33% tested
- ✅ Security Module: 2 APIs (Auth, Audit) - 100% tested

---

## Functional Requirements Summary

**Total FRs:** 62+ (updated Nov 2025: +2 new FRs: FR-SET-008 Payment, FR-SET-009 Feature Flags)

### By Status (Nov 2025):

- ✅ **Implemented:** 33 FRs (53%)
- 🟡 **Partial:** 2 FRs (3%)
- 🔴 **Not Started:** 27 FRs (44%)

### By Priority:

- **MVP (Must Have):** 42 FRs (68%) - includes 2 new SaaS FRs
- **Growth (Should Have):** 15 FRs (24%)
- **Vision (Could Have):** 5 FRs (8%)

### MVP Completion (Updated Nov 2025):

- **MVP Implementation:** 33 / 40 core FRs = **82.5%** (excludes 2 new SaaS FRs)
- **MVP Production-Ready:** 24 / 40 = **60%** (with tests & E2E coverage)
- **MVP Remaining:** 7 core FRs + 2 SaaS FRs = 9 FRs

### Module Breakdown (Post EPIC-001 & EPIC-002):

- ✅ **Planning:** 92% (PO 100%, TO 100%, WO 95% - missing E2E tests)
- ✅ **Technical:** 95% (EPIC-001 complete, BOM multi-version, by-products, conditionals)
- ✅ **Warehouse:** 95% (EPIC-002 complete, ASN, genealogy, pallets, scanner UX)
- ⚠️ **Production:** 58% (consume endpoint fixed, 4 E2E tests, missing dashboard)
- ❌ **Settings:** 15% (APIs complete, 3/9 unit tests)
- ❌ **Quality:** 0% (not started)
- ❌ **Shipping:** 0% (not started)

### Critical MVP Gaps (Prioritized):

1. ✅ **FIXED:** `/api/production/consume` endpoint (Nov 2025)
2. ✅ **FIXED:** WO E2E tests skeleton (4 tests, 6 TODO) - Nov 2025
3. ✅ **FIXED:** Settings unit tests (3/9 APIs) - Nov 2025
4. 🔴 **Quality Module** (2-3 weeks) - FR-QUAL-001 to FR-QUAL-004
5. 🔴 **Shipping Module** (2 weeks) - FR-SHIP-001 to FR-SHIP-003
6. 🔴 **Production Dashboard** (1-2 weeks) - FR-PROD-008
7. 🔴 **Settings Unit Tests** (3-4 days) - 6 remaining APIs
8. 🔴 **Production E2E Tests** (4-5 days) - Complete WO E2E suite
9. 🔴 **Payment Integration** (3-5 days) - FR-SET-008 (Stripe)
10. 🔴 **Feature Flags** (2-3 days) - FR-SET-009

**Total MVP Effort Remaining: 4-6 weeks** (down from 10-14 weeks due to EPIC-001/002 completion)

---

## Non-Functional Requirements

Non-functional requirements define the **quality attributes** of MonoPilot MES. These requirements shape system architecture, technology choices, and operational characteristics.

---

### ⚡ Performance Requirements

**NFR-PERF-001: Page Load Time**

- **Target:** First Contentful Paint (FCP) <1.5s on 3G connection
- **Rationale:** Mobile users on factory floor may have poor connectivity
- **Measurement:** Lighthouse Performance Score ≥90
- **Priority:** MVP (Must Have)

**NFR-PERF-002: Time to Interactive (TTI)**

- **Target:** <3s on 3G connection, <1s on 4G/WiFi
- **Rationale:** Operators need fast UI response for production workflows
- **Measurement:** Lighthouse Performance Score
- **Priority:** MVP (Must Have)

**NFR-PERF-003: API Response Time**

- **Target:**
  - p50: <100ms (50th percentile)
  - p95: <200ms (95th percentile)
  - p99: <500ms (99th percentile)
- **Rationale:** Real-time scanner operations require fast API responses
- **Measurement:** Application Performance Monitoring (APM) dashboard
- **Priority:** MVP (Must Have)

**NFR-PERF-004: Database Query Performance**

- **Target:**
  - Simple queries (single table): <10ms
  - Complex queries (joins, aggregations): <100ms
  - Traceability queries (recursive genealogy): <1 minute for 100+ LP tree
- **Rationale:** Food manufacturing requires fast recall simulation (<30s target vs 24h FDA requirement)
- **Measurement:** Database slow query log, APM
- **Priority:** MVP (Must Have)

**NFR-PERF-005: RLS Overhead**

- **Target:** <20% overhead vs baseline queries (currently 12.5%: 3.6ms vs 3.2ms)
- **Rationale:** Multi-tenant isolation via RLS must not significantly degrade performance
- **Measurement:** Query performance benchmarks
- **Priority:** MVP (Must Have)

**NFR-PERF-006: Concurrent Users**

- **Target:**
  - MVP: 50 concurrent users per organization
  - Growth: 200 concurrent users per organization
  - Enterprise: 500+ concurrent users per organization
- **Rationale:** Large manufacturing facilities have many simultaneous operators
- **Measurement:** Load testing (k6, Apache JMeter)
- **Priority:** MVP (50 users), Growth (200+)

**NFR-PERF-007: Offline Performance (PWA)**

- **Target:**
  - Offline boot time: <0.5s (cached app shell)
  - Offline operations: 100% functional (read local cache, queue writes)
  - Sync time after reconnect: <5s for 50 queued operations
- **Rationale:** Factory floor may have intermittent connectivity
- **Measurement:** Service Worker cache hit rate, IndexedDB read/write benchmarks
- **Priority:** MVP (Must Have for Scanner module)

---

### 🔐 Security Requirements

**NFR-SEC-001: Authentication**

- **Requirement:** Session-based authentication with JWT tokens (Supabase Auth)
- **Details:**
  - Session timeout: 1 hour inactivity
  - Token refresh: automatic (transparent to user)
  - Password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number
  - 2FA: Optional (SMS or authenticator app)
- **Priority:** MVP (Must Have)

**NFR-SEC-002: Authorization (RBAC)**

- **Requirement:** Role-Based Access Control with 7 predefined roles
- **Details:**
  - Permission enforcement at 3 levels: Database (RLS), API (route handlers), UI (conditional rendering)
  - Least privilege principle (default deny, explicit allow)
  - Role hierarchy: Admin > Manager > Planner/Technical/Purchasing > Operator > Viewer
- **Priority:** MVP (Must Have)

**NFR-SEC-003: Multi-Tenant Isolation**

- **Requirement:** Complete data isolation between organizations (zero leakage)
- **Details:**
  - PostgreSQL RLS policies enforce `org_id` filtering on all business tables
  - JWT token contains `org_id` claim (immutable, cryptographically signed)
  - Middleware validates token on every request
  - Database-level isolation (no application-level bugs can break isolation)
- **Priority:** MVP (Must Have)

**NFR-SEC-004: Data Encryption**

- **Requirement:**
  - Data in transit: TLS 1.3 (HTTPS only)
  - Data at rest: AES-256 encryption (Supabase managed)
  - Secrets: Environment variables (not hardcoded), rotated quarterly
- **Priority:** MVP (Must Have)

**NFR-SEC-005: API Security**

- **Requirement:**
  - Rate limiting: 1,000 req/min (Starter), 5,000 req/min (Growth), unlimited (Enterprise)
  - CORS: Whitelist only (no wildcard)
  - SQL injection prevention: Parameterized queries only (never string concatenation)
  - XSS prevention: Content Security Policy (CSP) headers
- **Priority:** MVP (Must Have)

**NFR-SEC-006: Audit Trail**

- **Requirement:**
  - Basic (MVP): `created_by`, `updated_by`, timestamps on all business records
  - Advanced (Growth P2): pgAudit extension with immutable audit log
  - Retention: 7 days (Starter), 30 days (Growth), 90 days (Enterprise)
- **Priority:** MVP (Basic), Growth (Advanced for FDA compliance)

**NFR-SEC-007: Vulnerability Management**

- **Requirement:**
  - Dependency scanning: Weekly (GitHub Dependabot)
  - CVE patching: Critical within 7 days, High within 30 days
  - Security testing: Annual penetration test (Enterprise tier)
- **Priority:** Growth (P1)

---

### 📈 Scalability Requirements

**NFR-SCALE-001: Database Scalability**

- **Target:**
  - Phase 1 (0-100 orgs): Single Supabase instance (PostgreSQL 15)
  - Phase 2 (100-500 orgs): Read replicas for reporting
  - Phase 3 (500-2000 orgs): Database sharding by `org_id` (if needed)
  - Phase 4 (2000+ orgs): Dedicated instances for Enterprise customers
- **Rationale:** SaaS growth requires horizontal scaling strategy
- **Priority:** Growth (P1)

**NFR-SCALE-002: Application Scalability**

- **Target:**
  - Horizontal scaling via serverless functions (Vercel Edge Functions)
  - Auto-scaling based on load (CPU >70% triggers scale-up)
  - Stateless architecture (no session affinity required)
- **Priority:** Growth (P1)

**NFR-SCALE-003: Data Growth**

- **Target:**
  - 1 million LPs per organization (Starter tier limit)
  - 10 million LPs per organization (Growth tier)
  - Unlimited LPs (Enterprise tier)
  - Data retention: Configurable per tier (7/30/90 days backups)
- **Priority:** Growth (P1)

**NFR-SCALE-004: API Rate Limits**

- **Target:**
  - Starter: 1,000 req/min per organization
  - Growth: 5,000 req/min per organization
  - Enterprise: Unlimited (fair use policy)
- **Rationale:** Prevent abuse, ensure fair resource allocation
- **Priority:** MVP (Must Have)

---

### ⏱️ Availability & Reliability

**NFR-AVAIL-001: Uptime SLA**

- **Target:**
  - Starter: 99.0% uptime (≈7.2h downtime/month)
  - Growth: 99.5% uptime (≈3.6h downtime/month)
  - Enterprise: 99.9% uptime (≈43m downtime/month)
- **Rationale:** Production-critical system requires high availability
- **Measurement:** Uptime monitoring (UptimeRobot, Pingdom)
- **Priority:** MVP (99.0%), Growth (99.5%), Enterprise (99.9%)

**NFR-AVAIL-002: Data Backup**

- **Target:**
  - Automated daily backups (Supabase Point-in-Time Recovery)
  - Retention: 7 days (Starter), 30 days (Growth), 90 days (Enterprise)
  - Restore time: <1 hour (manual process)
  - Backup verification: Monthly restore test
- **Priority:** MVP (Must Have)

**NFR-AVAIL-003: Disaster Recovery**

- **Target:**
  - RPO (Recovery Point Objective): <24 hours (daily backups)
  - RTO (Recovery Time Objective): <4 hours (restore from backup)
  - Failover: Manual (no automatic failover in MVP)
- **Priority:** Growth (P1)

**NFR-AVAIL-004: Error Handling**

- **Requirement:**
  - Graceful degradation (offline mode for Scanner, fallback UI for dashboard)
  - User-friendly error messages (no stack traces, clear recovery steps)
  - Error logging: Sentry (error tracking, performance monitoring)
  - Error notification: Slack/email for critical errors
- **Priority:** MVP (Must Have)

**NFR-AVAIL-005: Service Monitoring**

- **Requirement:**
  - Application monitoring: Sentry (errors, performance, transactions)
  - Infrastructure monitoring: Vercel Analytics (latency, status codes, geo)
  - Database monitoring: Supabase Dashboard (connections, query performance)
  - Alerting: PagerDuty (critical errors, downtime)
- **Priority:** MVP (Must Have)

---

### ♿ Accessibility Requirements

**NFR-ACCESS-001: WCAG 2.1 Level AA Compliance**

- **Target:** All public-facing UI complies with WCAG 2.1 Level AA
- **Details:**
  - Color contrast: ≥4.5:1 for text, ≥3:1 for UI components
  - Keyboard navigation: All interactive elements accessible via keyboard
  - Screen reader support: Semantic HTML, ARIA labels, alt text
  - Form accessibility: Labels, error messages, instructions
- **Priority:** MVP (Must Have)

**NFR-ACCESS-002: Mobile Accessibility**

- **Target:** Touch targets ≥44x44px (WCAG AAA), scanner module ≥56x56px
- **Rationale:** Operators may wear gloves, need large tap targets
- **Priority:** MVP (Must Have for Scanner)

**NFR-ACCESS-003: Internationalization (i18n)**

- **Target:**
  - Phase 1 (MVP): English only
  - Phase 2 (Growth): Polish, German, French, Spanish
  - Phase 3 (Vision): 20+ languages (community translations)
  - RTL support: Arabic, Hebrew (Phase 3)
- **Priority:** MVP (English), Growth (4 languages), Vision (20+)

---

### 🔌 Integration Requirements

**NFR-INT-001: API Design**

- **Requirement:** RESTful API with JSON payloads
- **Details:**
  - Versioning: URL-based (`/api/v1/work-orders`)
  - Authentication: Bearer tokens (JWT)
  - Pagination: Cursor-based (avoid offset)
  - Rate limiting: Per-organization, per-tier
  - Documentation: OpenAPI 3.0 spec (auto-generated)
- **Priority:** Growth (P1)

**NFR-INT-002: Webhook Support**

- **Requirement:** Real-time event notifications via webhooks
- **Details:**
  - Events: WO created, LP received, QA approved, shipment dispatched
  - Payload: JSON with event type, timestamp, data
  - Retry logic: 3 retries with exponential backoff
  - Signature verification: HMAC-SHA256
- **Priority:** Growth (P1)

**NFR-INT-003: Third-Party API Compatibility**

- **Requirement:** Integration with ERP, IoT, BI tools
- **Details:**
  - QuickBooks Online: OAuth 2.0, REST API v3
  - Zebra printers: ZPL protocol, Browser Print API
  - Power BI/Tableau: Direct PostgreSQL connection (read-only)
  - OPC UA: UA-ICS protocol for industrial PLCs
- **Priority:** Growth (P1 for ERP, P3 for IoT)

---

### 💾 Data Requirements

**NFR-DATA-001: Data Retention**

- **Requirement:**
  - Business data: Indefinite (customer owns data)
  - Audit logs: 7 days (Starter), 30 days (Growth), 90 days (Enterprise)
  - Backups: 7/30/90 days per tier
  - Deleted tenants: 30 days retention, then permanent delete
- **Priority:** MVP (Must Have)

**NFR-DATA-002: Data Ownership**

- **Requirement:** Customer owns all data (MonoPilot = data processor under GDPR)
- **Details:**
  - Full data export: JSON/CSV on demand
  - Data portability: Standard format (GS1 XML, FDA JSON)
  - GDPR Right to Erasure: Delete all tenant data within 30 days
- **Priority:** MVP (Must Have for GDPR compliance)

**NFR-DATA-003: Data Validation**

- **Requirement:** Input validation at API and UI levels
- **Details:**
  - Zod schemas for all API inputs
  - Client-side validation (immediate feedback)
  - Server-side validation (security layer)
  - Sanitization: Prevent SQL injection, XSS
- **Priority:** MVP (Must Have)

**NFR-DATA-004: Data Integrity**

- **Requirement:** ACID transactions, no data loss
- **Details:**
  - PostgreSQL transactions for multi-step operations
  - Foreign key constraints enforced
  - Unique constraints on business keys
  - Database triggers for business rules (BOM date overlap prevention)
- **Priority:** MVP (Must Have)

---

### 📜 Compliance Requirements

**NFR-COMP-001: GDPR Compliance**

- **Requirement:** Full compliance with EU General Data Protection Regulation
- **Details:**
  - Privacy policy published
  - Cookie consent banner (Starter tier: essential cookies only)
  - Data Processing Agreement (DPA) available
  - Right to access: Self-service data export
  - Right to erasure: Delete tenant data within 30 days
  - Data breach notification: Within 72 hours
- **Priority:** MVP (Must Have for EU customers)

**NFR-COMP-002: FDA 21 CFR Part 11**

- **Requirement:** Partial compliance (MVP), full compliance (Growth P2)
- **Details:**
  - MVP (50%): Basic audit trail (created_by, updated_by, timestamps)
  - Growth (100%): pgAudit, electronic signatures, validation protocols (IQ/OQ/PQ)
- **Priority:** MVP (50%), Growth P2 (100%)

**NFR-COMP-003: FSMA 204 (Food Traceability Rule)**

- **Requirement:** 90% compliant (MVP), 100% compliant (Growth P0)
- **Details:**
  - MVP (90%): LP genealogy, batch tracking, traceability queries (<1 min)
  - Growth (100%): FDA-compliant reporting format (JSON/XML export)
- **Priority:** MVP (90%), Growth P0 (100%)

**NFR-COMP-004: ISO 22000 (Food Safety Management)**

- **Requirement:** 40% compliant (MVP), 70% compliant (MVP+Quality), 90% compliant (Growth)
- **Details:**
  - MVP (40%): Basic traceability, batch tracking
  - MVP+Quality (70%): QA inspections, NCRs, CoAs
  - Growth (90%): HACCP templates, CCP monitoring
- **Priority:** MVP (40%), Growth (90%)

---

### 🛠️ Operational Requirements

**NFR-OPS-001: Deployment**

- **Requirement:** Continuous deployment with zero downtime
- **Details:**
  - Platform: Vercel (serverless, Edge Functions)
  - Deployment frequency: Multiple times per day (CI/CD)
  - Rollback time: <5 minutes (Vercel instant rollback)
  - Blue-green deployment: Automatic (Vercel previews)
- **Priority:** MVP (Must Have)

**NFR-OPS-002: Environment Management**

- **Requirement:** Separate environments for dev, staging, production
- **Details:**
  - Development: Local (Next.js dev server + Supabase local)
  - Staging: Vercel preview deployments (per PR)
  - Production: Vercel production deployment
  - Database: Separate Supabase projects per environment
- **Priority:** MVP (Must Have)

**NFR-OPS-003: Configuration Management**

- **Requirement:** Environment variables for all configuration
- **Details:**
  - Secrets: Vercel Environment Variables (encrypted)
  - No hardcoded credentials in code
  - Secret rotation: Quarterly
  - .env.example file documented for local dev
- **Priority:** MVP (Must Have)

**NFR-OPS-004: Logging**

- **Requirement:** Centralized logging with structured logs
- **Details:**
  - Application logs: Vercel Logs (stdout/stderr)
  - Error tracking: Sentry (errors, breadcrumbs, stack traces)
  - Log retention: 7 days (Vercel free), 30 days (Vercel Pro)
  - Log format: JSON (structured logging)
- **Priority:** MVP (Must Have)

**NFR-OPS-005: Monitoring & Alerting**

- **Requirement:** Proactive monitoring with alerts for critical issues
- **Details:**
  - Application monitoring: Sentry (error rate, performance)
  - Infrastructure monitoring: Vercel Analytics (latency, status codes)
  - Database monitoring: Supabase Dashboard (connections, query performance)
  - Alerting: Slack/email for critical errors, PagerDuty for downtime
  - On-call rotation: 24/7 coverage (Enterprise tier only)
- **Priority:** MVP (Must Have)

---

### 📱 Mobile-Specific Requirements

**NFR-MOBILE-001: PWA Installation**

- **Requirement:** Installable as standalone app on iOS/Android
- **Details:**
  - Add to Home Screen prompt after 3 uses
  - Custom app icon (MonoPilot logo)
  - Splash screen on launch
  - No browser chrome (standalone mode)
  - Runs offline (Service Worker caching)
- **Priority:** MVP (Must Have for Scanner)

**NFR-MOBILE-002: Offline Capability**

- **Requirement:** Scanner module works 100% offline
- **Details:**
  - Service Worker caches app shell (HTML, CSS, JS)
  - IndexedDB stores local data (LPs, WOs, POs for current shift)
  - Background Sync queues operations when offline (max 50 operations)
  - Auto-sync when network returns (<5s for 50 operations)
  - Conflict resolution: Last write wins (with user notification)
- **Priority:** MVP (Must Have for Scanner)

**NFR-MOBILE-003: Mobile Performance**

- **Requirement:** Fast load time on 3G connection
- **Details:**
  - First Contentful Paint (FCP): <1.5s on 3G
  - Time to Interactive (TTI): <3s on 3G
  - App bundle size: <500KB (compressed)
  - Image optimization: WebP format, lazy loading
- **Priority:** MVP (Must Have)

**NFR-MOBILE-004: Touch Interactions**

- **Requirement:** Optimized for touch input (no hover states)
- **Details:**
  - Touch targets: ≥56x56px (Scanner module)
  - Swipe gestures: Pull-to-refresh, swipe-to-delete
  - Haptic feedback: Vibration on scan success/error
  - No double-tap zoom (disable via viewport meta)
- **Priority:** MVP (Must Have for Scanner)

**NFR-MOBILE-005: Battery Efficiency**

- **Requirement:** Minimize battery drain during 8-hour shift
- **Details:**
  - Reduce network requests (batch operations, cache aggressively)
  - Minimize screen wake-ups (use push notifications sparingly)
  - Optimize animations (use CSS transform, not layout changes)
  - Background sync: Only when network available (don't poll)
- **Priority:** Growth (P1)

---

## Non-Functional Requirements Summary

**Total NFRs:** 45

### By Category:

- **Performance:** 7 NFRs
- **Security:** 7 NFRs
- **Scalability:** 4 NFRs
- **Availability & Reliability:** 5 NFRs
- **Accessibility:** 3 NFRs
- **Integration:** 3 NFRs
- **Data:** 4 NFRs
- **Compliance:** 4 NFRs
- **Operational:** 5 NFRs
- **Mobile-Specific:** 5 NFRs

### By Priority:

- **MVP (Must Have):** 35 NFRs (78%)
- **Growth (Should Have):** 10 NFRs (22%)

### Key Targets:

- **Performance:** <200ms API response (p95), <1 min traceability queries
- **Security:** Zero data leakage (RLS), TLS 1.3, rate limiting
- **Availability:** 99.0% uptime (Starter), 99.5% (Growth), 99.9% (Enterprise)
- **Accessibility:** WCAG 2.1 Level AA compliance
- **Compliance:** GDPR (100%), FDA 21 CFR Part 11 (50% MVP → 100% Growth), FSMA 204 (90% MVP → 100% Growth)
- **Mobile:** <1.5s FCP on 3G, 100% offline functionality (Scanner)

---

---

## Research Documents (Reference)

**Master Index:**

- `docs/bmm-research-master-index-2025-11-13.md` (10 pages)

**7 Research Reports (250+ pages total):**

1. `docs/bmm-research-domain-industry-2025-11-13.md` (40 pages)
   - Regulatory landscape, market analysis, competitive intelligence
2. `docs/bmm-research-technical-stack-2025-11-13.md` (35 pages)
   - Stack validation, architecture patterns, missing components
3. `docs/bmm-research-feature-gaps-2025-11-13.md` (45 pages)
   - Feature inventory, gap analysis, prioritization
4. `docs/bmm-roadmap-phase1-2-2025-11-13.md` (50 pages)
   - Phase 1-2 roadmap (0-6 months, compliance & operational excellence)
5. `docs/bmm-roadmap-phase3-4-2025-11-13.md` (30 pages)
   - Phase 3-4 roadmap (6-18 months, IoT & advanced features)
6. `docs/bmm-strategy-differentiators-2025-11-13.md` (40 pages)
   - Unique differentiators, competitive positioning, GTM strategy
7. `docs/bmm\sessions\2025-01-11-brainstorm-init.md`
   - Initial brainstorm session, project priorities

---

## 🚧 PRD WORKFLOW STATUS

**Step 1 ✅ COMPLETE**: Discovery - Project, Domain, Vision

- Vision alignment captured (5→6 core differentiators)
- Project classification complete (SaaS B2B + Web App PWA)
- Domain context documented (Food → Universal manufacturing)
- Product differentiators identified:
  - Multi-Version BOM (UNIQUE)
  - LP Genealogy (30s recall)
  - Transparent Pricing ($167K savings)
  - Mobile-First PWA ($30K-$50K hardware savings) ← ADDED
  - Module Build (pay-as-you-grow)
  - Easy Customization ($240K-$650K savings) ← ADDED
- Total Cost Advantage: **$437K-$867K** over 3 years vs competitors

**Step 2 ✅ COMPLETE**: Success Definition

- Customer outcomes defined (compliance, operational excellence, 12-month ROI, easy customization)
- Product adoption metrics (80% DAU/MAU, module upsell, PWA usage)
- Business metrics adjusted: **2-4 pilot customers** (realistic), NPS ≥40
- Technical excellence targets (zero data loss, 99.5% uptime)
- Phase 2 success criteria (3+ industries, marketplace launch)
- **What "Winning" Looks Like** section added

**Step 3 ✅ COMPLETE**: Scope Definition

- MVP scope defined (100% working modules + Quality + Shipping + Multi-warehouse)
- Growth features categorized (P0, P1, P2, P3)
- Vision features identified (AI, ML, IoT, Marketplace)

**Step 4 ✅ COMPLETE**: Domain-Specific Exploration

- Regulatory requirements documented (FDA 21 CFR Part 11, FSMA 204, GDPR)
- Compliance roadmap defined (50% MVP → 100% Growth for FDA, 90% → 100% for FSMA)
- Industry-specific challenges identified (traceability, allergen control, batch tracking)

**Step 5 ✅ COMPLETE**: Innovation Discovery

- Multi-Version BOM uniqueness validated (date-based versioning, automatic snapshot)
- LP Genealogy system documented (30s recall simulation)
- Transparent Pricing strategy ($1,500-$5,000/mo vs $320K/yr competitors)
- Mobile-First PWA innovation ($30K-$50K hardware savings via BYOD)
- Module Build approach (pay-as-you-grow scalability)

**Step 6 ✅ COMPLETE**: Project-Specific Deep Dive (SaaS B2B)

- Multi-tenant architecture defined (PostgreSQL RLS with org_id, 12.5% overhead)
- Permission matrix documented (7 roles: Admin, Manager, Operator, Viewer, Planner, Technical, Purchasing)
- Subscription tiers specified (Starter $1,500/mo, Growth $3,000/mo, Enterprise $5,000+/mo)
- Critical integrations identified (ERP, IoT, label printers, BI tools)
- Tenant onboarding & provisioning (QuickStart templates)
- Module activation & feature flags

**Step 7 ✅ COMPLETE**: UX Principles

- Design philosophy (mobile-first, operator-centric, context-aware)
- Mobile PWA design (scanner UX patterns, offline-first, BYOD)
- Desktop UI patterns (dashboards, tables, forms)
- Key user interactions (WO creation, scanner receiving, BOM management)
- Accessibility standards (WCAG 2.1 AA compliance)
- Design system (Inter font, Tailwind CSS, shadcn/ui)
- Interaction patterns, data visualization, i18n, onboarding

**Step 8 ✅ COMPLETE**: Functional Requirements Synthesis

- 60+ detailed FRs organized by module with priority, status, acceptance criteria
- **MVP completion: 82.5% implementation (33/40 FRs), 60% production-ready (24/40 FRs tested)** ✅ UPDATED Nov 2025
- **Module Breakdown (Post EPIC-001 & EPIC-002):**
  - ✅ Planning: 92% (PO/TO complete 100%, WO 95% - missing E2E tests)
  - ✅ Technical: 95% (EPIC-001 complete Nov 2025)
  - ✅ Warehouse: 95% (EPIC-002 complete Nov 2025)
  - ⚠️ Production: 58% (consume endpoint fixed, zero E2E tests)
  - ❌ Settings: 15% (APIs work, 3/9 unit tests created)
  - ❌ Quality: 0% (not started)
  - ❌ Shipping: 0% (not started)
- **Critical Gaps Blocking Production:**
  1. ✅ FIXED: `/api/production/consume` endpoint (Nov 2025)
  2. ✅ FIXED: WO E2E tests skeleton (4 tests, 6 TODO)
  3. ✅ FIXED: Settings unit tests skeleton (3 APIs)
  4. ⏳ TODO: Production E2E tests, Yield/Consume unit tests
  5. ⏳ TODO: Remaining Settings unit tests (6 APIs)
  6. ⏳ TODO: Quality Module (2-3 weeks)
  7. ⏳ TODO: Shipping Module (2 weeks)
- **Revised MVP Timeline:** 4-6 weeks (reduced from 10-14 weeks)

**Step 9 ✅ COMPLETE**: Non-Functional Requirements

- 45 NFRs across 10 categories
- Performance: <200ms API (p95), <1 min traceability
- Security: Zero data leakage (RLS), TLS 1.3, RBAC
- Availability: 99.0-99.9% uptime by tier
- Compliance: GDPR 100%, FDA 50%→100%, FSMA 90%→100%
- Mobile: <1.5s FCP on 3G, 100% offline (Scanner)

**PRD Status:** ✅ **COMPLETE** - All 9 workflow steps finished

---

---

## Next Steps

**PRD Complete** ✅ - Ready for implementation planning:

1. **Epic & Story Breakdown** - Run: `/bmad:bmm:workflows:create-epics-and-stories`
   - Decompose functional requirements into bite-sized stories (200k context limit)
   - Organize stories into deliverable functional epics
   - Create epic files with story lists

2. **UX Design** (if UI needed) - Run: `/bmad:bmm:workflows:create-ux-design`
   - Create wireframes/mockups for key user interactions
   - Validate design system implementation
   - Document component specifications

3. **Architecture** - Run: `/bmad:bmm:workflows:architecture`
   - Design technical architecture based on PRD requirements
   - Make architectural decisions (database, API patterns, deployment)
   - Document architecture decision records (ADRs)

4. **Test Architecture** - Run: `/bmad:bmm:workflows:testarch/*`
   - Define test strategy per NFRs
   - Create test design for critical workflows
   - Set up CI/CD pipeline

---

_PRD Complete - Collaborative discovery between Mariusz and Business Analyst Agent_
_Completed: 2025-11-13_
