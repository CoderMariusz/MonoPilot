# MonoPilot - Project Brief

## Document Info
- **Version:** 1.0
- **Created:** 2025-12-09
- **Author:** PM Agent (John)
- **Status:** Approved
- **Discovery Ref:** @docs/0-DISCOVERY/DISCOVERY-REPORT.md

---

## 1. Project Overview

### Project Name
**MonoPilot** - Manufacturing Execution System for Food Industry

### Vision Statement
> "MES dla producentow spozywczych, ktorzy wyrosli z Excela ale nie potrzebuja (i nie stac ich na) wielkich systemow. Wdrozenie w tygodnie, nie miesiace. Cena dostepna dla malych firm. Funkcje sprawdzone w duzych korporacjach."

### Product Type
- **Category:** MES/MOM (Manufacturing Execution System / Manufacturing Operations Management)
- **Business Model:** SaaS (subscription)
- **Deployment:** 100% Cloud-native

---

## 2. Problem Statement

### Current State
Male i srednie firmy spozywcze w Polsce (5-100 pracownikow) nie maja dostepnego narzedzia laczacego planning z produkcja. Istnieja dwa bieguny:

1. **Excel/Manual** - brak integracji, bledy, brak traceability
2. **Enterprise ERP** (D365, SAP) - za ciezkie, drogie, 6-24 miesiace wdrozenia

### Core Pain Points

| Pain Point | Impact | Current Workaround |
|------------|--------|-------------------|
| Brak przeplywu informacji miedzy dzialami | Opoznienia, bledy | Telefony, email, Excel |
| Excel-based chaos | Brak centralizacji danych | Reczne kopiowanie |
| Niedostosowalne ERP | Wymaga consultantow | Obejscia, shadow IT |
| Slaba integracja | Manualna synchronizacja | Podwojne wprowadzanie danych |
| Dlugi czas wdrozenia | 6-24 miesiace | Czekanie lub rezygnacja |

### Key Problem Quantified
- **Czas traceability:** Excel = 30 godzin, MonoPilot = 30 sekund
- **Wdrozenie:** Enterprise MES = 6-24 msc, MonoPilot = tygodnie
- **Koszt wdrozenia:** Enterprise = $100K-500K, MonoPilot = dostepny dla SMB

---

## 3. Target Market

### Primary Segment (80%)
- **Size:** Male/Srednie firmy produkcyjne
- **Employees:** 5-100 pracownikow
- **Revenue:** $1M-50M rocznie
- **Industry:** Przemysl spozywczy (food manufacturing)
- **Geography:** Polska (primary), EU (secondary)

### Secondary Segment (20%)
- **Size:** Wieksze przedsiebiorstwa
- **Employees:** 100+ pracownikow
- **Use Case:** Uzupelnienie istniejacych systemow lub modernizacja

### Market Gap
```
                    COMPLEXITY
                Low <-----------> High
           +--------------------------------+
    High   |                                |
           |  CSB-System    AVEVA MES       |
           |     *             *            |
    COST   |                                |
           |  Aptean      Plex              |
           |    *           *               |
           |                                |
           |         MonoPilot              |
           |        [OPPORTUNITY]           |
    Low    |                                |
           +--------------------------------+
```

---

## 4. User Personas

### Persona 1: Operator Produkcji

| Aspect | Details |
|--------|---------|
| **Role** | Frontline worker, hala produkcyjna |
| **Tech Savviness** | Low-Medium |
| **Primary Tasks** | Konsumpcja materialow, robienie stockow, przyjmowanie towarow |
| **Daily Workflow** | Skanuje WO -> skanuje LP materialow -> potwierdza konsumpcje -> tworzy output LP -> drukuje etykiety |
| **Hardware** | Dedykowane skanery (Zebra, Honeywell), telefony (Samsung Galaxy), drukarki Zebra |
| **Pain Points** | Papierowa dokumentacja, brak real-time info, reczne przepisywanie danych |
| **Success Metric** | Czas na operacje < 30 sekund, zero bledow przy skanowaniu |

**Key Quote:** *"Chce szybko zeskanowac i isc dalej, nie chce sie zastanawiac nad systemem"*

### Persona 2: Manager / Supervisor

| Aspect | Details |
|--------|---------|
| **Role** | Kierownik produkcji / Quality Manager |
| **Tech Savviness** | Medium-High |
| **Primary Tasks** | Monitoring produkcji, akceptacje, raporty, reklamacje |
| **Daily Workflow** | Dashboard -> sprawdza WO status -> approvale -> raporty KPI -> edge cases |
| **Hardware** | Desktop PC, tablet |
| **Pain Points** | Brak real-time visibility, reczne raporty, trudne sledenie yieldu |
| **Success Metric** | 100% visibility na produkcje, raporty w < 5 minut |

**Key Quote:** *"Muszę w kazdej chwili wiedziec co sie dzieje na produkcji"*

### Persona 3: Admin / IT

| Aspect | Details |
|--------|---------|
| **Role** | Administrator systemu / Wlasciciel firmy |
| **Tech Savviness** | High |
| **Primary Tasks** | Setup organizacji, zarzadzanie uzytkownikami, konfiguracja modulow |
| **Daily Workflow** | Onboarding nowych userow -> konfiguracja settings -> monitoring systemu |
| **Hardware** | Desktop PC |
| **Pain Points** | Zlozonosc konfiguracji ERP, potrzeba consultantow, dlugi onboarding |
| **Success Metric** | Self-service setup w < 1 dzien, zero potrzeby wsparcia zewnetrznego |

**Key Quote:** *"Chce sam skonfigurowac system bez dzwonienia do supportu"*

---

## 5. Core Value Proposition

### Primary USP
> **"D365 for SMB with Notion UX"**

### Value Pillars

| Pillar | Description | vs Competition |
|--------|-------------|----------------|
| **Szybkie wdrozenie** | Tygodnie zamiast miesiecy | AVEVA: 6-18 msc, Plex: 3-9 msc |
| **Przystepna cena** | Dostepna dla SMB | Competitors: $100K-500K |
| **Self-service** | Konfiguracja bez consultantow | Competitors: wymagaja IT/consultants |
| **Food-specific** | Natywne: alergeny, traceability, lot tracking | Generic ERP: add-ons |
| **Modern UX** | Cloud-native, responsive, intuicyjny | Legacy: skomplikowane UI |

### What MonoPilot IS
- MES/MOM dla przemyslu spozywczego
- Cloud-native SaaS
- Self-service configuration
- LP-based inventory tracking
- Full traceability (forward/backward)

### What MonoPilot is NOT
- Pelny ERP (brak Finance/Accounting)
- System CRM
- System HR
- Replacement dla ksiegowosci

---

## 6. Success Criteria (MVP)

### Functional Completeness

| Criterion | Target | Status |
|-----------|--------|--------|
| Epic 1 (Settings) | 100% done | DONE |
| Epic 2 (Technical) | 100% done | DONE |
| Epic 3 (Planning) | 100% done | DONE |
| Epic 4 (Production) | 100% done | DONE |
| Epic 5 (Warehouse) | 100% done | 92% |
| Print integration | Working | Blocked (BUG-001/002) |
| Scanner workflows | Complete | 90% |
| Critical bugs | 0 | 5 open |

### Operational Metrics (Post-MVP)

| Metric | Target | Rationale |
|--------|--------|-----------|
| Uptime | 99.5%+ | Produkcja wymaga ciaglosci |
| MTTR | < 30 min | Przestoj = straty |
| Traceability query | < 30 sec | Wymog recall/audyt |
| Page load (P95) | < 2s | UX dla operatorow |
| Test coverage | > 70% | Stabilnosc przy zmianach |

### Security Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| RLS audit | PASSED | Pending (DEBT-002) |
| Penetration test | PASSED | TBD (before production) |
| Multi-tenant isolation | Verified | Needs audit |

---

## 7. Constraints

### Technical Constraints

| Constraint | Reason | Impact |
|------------|--------|--------|
| **Supabase** | Wybrany stack | PostgreSQL + RLS + Auth |
| **Next.js 15** | Frontend framework | App Router, React 19 |
| **Vercel hosting** | Planned deployment | Edge functions, CDN |
| **No on-premise** | Cloud-only (MVP) | Niektore firmy moga preferowac on-prem |

### Business Constraints

| Constraint | Reason | Impact |
|------------|--------|--------|
| **No Finance module** | Stay in MES lane | Integracja z external accounting |
| **Poland first** | Initial market | Multi-language later |
| **SMB focus** | Target segment | Feature set optimized for 5-100 emp |

### Timeline Constraints

| Phase | Target | Stories |
|-------|--------|---------|
| MVP (Phase 1) | Q1 2025 | ~132 (95% done) |
| Phase 2 | Q2-Q3 2025 | ~56 |
| Phase 3 | Q4 2025 | ~40 |

---

## 8. Competitive Positioning

### Competitive Landscape

| Competitor | Target Market | Strengths | Weakness vs MonoPilot |
|------------|---------------|-----------|----------------------|
| **AVEVA MES** | Enterprise (500+ emp) | 40+ lat, AI/ML, global | Za ciezki/drogi dla SMB |
| **Plex** | Mid-Large (50-5000) | 100% SaaS, F&B proven | $3K/msc min, US-centric |
| **Aptean** | SMB-Mid (20-500) | Full ERP, food-specific | Legacy UX, mobile issues |
| **CSB-System** | Mid-Large DACH | 47 lat food focus | Regional, legacy, support issues |
| **Excel** | All | Free, familiar | Zero integracji, bledy |

### Competitive Messaging

| vs Competitor | Message |
|---------------|---------|
| **AVEVA/Plex** | "Jesli masz 500+ pracownikow i budzet $500K+ - wybierz ich. Jesli nie - wybierz nas." |
| **Aptean** | "Nowoczesny interfejs, szybsze wdrozenie, brak problemow z mobile." |
| **CSB** | "Cloud-native od pierwszego dnia. Polski support. Cena dla SMB." |
| **Excel** | "Traceability w 30 sekund, nie 30 godzin. Audyt sanepidu bez stresu." |

---

## 9. Key Stakeholders

| Role | Responsibility | Decisions |
|------|---------------|-----------|
| Product Owner | Product direction, prioritization | Scope, features, roadmap |
| Tech Lead | Architecture, technical decisions | Stack, patterns, security |
| Dev Team | Implementation | Code quality, velocity |
| QA | Quality assurance | Test coverage, bug verification |
| Pilot Customers | Validation | Feature feedback, UX testing |

---

## 10. Assumptions & Risks

### Key Assumptions

| Assumption | Impact if Wrong | Validation |
|------------|-----------------|------------|
| SMB chce MES (nie Excel) | Brak adopcji | Pilot program |
| Self-service jest wystarczajace | Potrzeba supportu | User testing |
| Cloud-only OK dla target | Lost customers | Market research |
| Polish market first | Opoznienie expansion | Focus validation |

### Key Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| RLS security gap | Medium | HIGH | Security audit (DEBT-002) |
| Print integration delay | High | HIGH | Prioritize BUG-001/002 |
| SMB prefers Excel | Medium | HIGH | ROI demonstration, pilot |
| Competition launches SMB tier | Medium | Medium | Speed to market, Polish focus |
| Performance issues at scale | Low | Medium | Load testing, optimization |

---

## 11. Next Steps

### Immediate (MVP Completion)
1. Fix BUG-001/002 (Print integration)
2. Fix BUG-005 (Warehouse Settings UI)
3. Fix BUG-003/004 (GRN navigation, Scanner PO)
4. RLS security audit (DEBT-002)

### Short-term (Pre-launch)
5. Performance baseline (DEBT-001)
6. Test coverage >70% (DEBT-003)
7. User documentation
8. Pilot customer onboarding

### Medium-term (Post-MVP)
9. Phase 2: Quality module (Epic 6)
10. Phase 2: Shipping module (Epic 7)
11. Polish accounting integration
12. GS1 barcode support

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| LP | License Plate - atomic unit of inventory |
| BOM | Bill of Materials - recipe/formulation |
| WO | Work Order - production order |
| PO | Purchase Order - order to supplier |
| TO | Transfer Order - internal transfer |
| GRN | Goods Receipt Note - receiving document |
| NCR | Non-Conformance Report - quality issue |
| RLS | Row Level Security - PostgreSQL security |
| MES | Manufacturing Execution System |

### References

- Discovery Report: @docs/0-DISCOVERY/DISCOVERY-REPORT.md
- Market Analysis: @docs/0-DISCOVERY/DISCOVERY-MARKET-REPORT.md
- Bug Tracker: @docs/BUGS.md
- MVP Phases: @docs/MVP-PHASES.md

---

**Document End**
**Status:** Approved
**Next:** Master PRD (@docs/1-BASELINE/product/prd.md)
