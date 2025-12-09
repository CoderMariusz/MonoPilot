# MonoPilot - Phase 3 Roadmap

**Version:** 3.0
**Last Updated:** 2025-12-09
**Status:** PLANNED
**Author:** PM-Agent (John)

---

## Executive Summary

Phase 3 wprowadza zaawansowane funkcjonalnosci wykraczajace poza podstawowy MES:
- **NPD (New Product Development)** - strukturyzowany proces rozwoju produktow
- **OEE & Performance** - sledzenie wydajnosci produkcji w czasie rzeczywistym
- **Advanced Planning (MRP)** - demand forecasting, auto-replenishment
- **Reports & Analytics** - self-service dashboards, KPI builder
- **Compliance & Certifications** - BRC/IFS, 21 CFR Part 11

**Kluczowe metryki Phase 3:**
- **Nowych epicow:** 5 (NPD, OEE, Advanced Planning, Reports, Compliance)
- **Total stories:** ~109
- **Estimated effort:** 36-40 tygodni (9-10 miesiecy)
- **Target:** H2 2025 - H1 2026

**Uwaga:** AI & Digital Twin przesuniete do Phase 4 - buduja na danych z OEE i innych modulow.

---

## Przeglad Faz

| Faza | Epiki | Cel | Horyzont |
|------|-------|-----|----------|
| **Phase 1** | 1-5 | MVP Core Manufacturing | Q1 2025 (95% done) |
| **Phase 2** | 6, 7, 10-12, 14 | Quality, Shipping, GS1, Catch Weight, Finance, SQM | Q2-Q4 2025 |
| **Phase 3** | 8, 9, 13, 15, 16 | NPD, OEE, MRP, Reports, Compliance | Q4 2025 - Q2 2026 |
| **Phase 4** | 17-22 | AI, Digital Twin, IIoT, Supply Chain, Multi-site | H2 2026+ |

---

## Phase 3 Epics Overview

| Order | Epic | Nazwa | Stories | Priority | Effort | Document |
|-------|------|-------|---------|----------|--------|----------|
| 1 | 9 | OEE & Performance | 25 | P1 | 8-10 tyg | `epics/09-oee-performance.md` |
| 2 | 15 | Reports & Analytics | 18 | P2 | 6-8 tyg | `epics/15-reports-analytics.md` |
| 3 | 8 | NPD (New Product Development) | 28 | P2 | 8-10 tyg | `epics/08-npd.md` |
| 4 | 13 | Advanced Planning (MRP) | 20 | P2 | 8-10 tyg | `epics/13-advanced-planning.md` |
| 5 | 16 | Compliance & Certifications | 18 | P2 | 6-8 tyg | `epics/16-compliance.md` |

**Total Phase 3 Stories:** ~109
**Total Phase 3 Effort:** 36-40 tygodni

---

## Epic Details

### Epic 9: OEE & Performance (8-10 tyg) - ORDER 1

**Goal:** Real-time OEE tracking i performance dashboards

**Rationale:** Krytyczna luka (4/4 konkurentow ma), fundament dla AI w Phase 4

**Key Features:**
- Machine performance configuration
- Shift management
- Downtime tracking & categorization
- Production counting (good/reject)
- OEE calculation engine (Availability x Performance x Quality)
- Real-time OEE display
- OEE dashboards & reports
- Downtime analysis (Pareto, MTBF, MTTR)
- Six Big Losses analysis

**Stories:** 25
- Must Have: 14
- Should Have: 9
- Could Have: 2

**Dependencies:** Epic 4 (Production)

---

### Epic 15: Reports & Analytics (6-8 tyg) - ORDER 2

**Goal:** Self-service dashboards i KPI builder

**Rationale:** Potrzebne dla OEE dashboards, uniwersalne dla wszystkich modulow

**Key Features:**
- Dashboard builder (CRUD, layout)
- Widget library (pre-built per module)
- Widget configuration
- Dashboard sharing
- Custom KPI definition
- Standard report library
- Report parameters & export
- Scheduled reports
- Power BI connector (API)
- Data export API

**Stories:** 18
- Must Have: 9
- Should Have: 9

**Dependencies:** All core modules (data sources)

---

### Epic 8: NPD - New Product Development (8-10 tyg) - ORDER 3

**Goal:** Strukturyzowany proces wprowadzania nowych produktow

**Rationale:** Roznicowanie konkurencyjne, zwiazane z Quality

**Key Features:**
- Stage-Gate process (Idea -> Development -> Testing -> Launch)
- Trial BOMs & Routings
- Trial Work Orders
- Costing Analysis (estimated vs actual)
- Launch to Production workflow
- NPD Dashboard & Reports

**Stories:** 28
- Must Have: 17
- Should Have: 9
- Could Have: 2

**Dependencies:** Epic 2, Epic 4, Epic 6

---

### Epic 13: Advanced Planning/MRP (8-10 tyg) - ORDER 4

**Goal:** Demand forecasting i auto-replenishment

**Rationale:** Zaawansowane planowanie, buduje na Phase 2

**Key Features:**
- Historical demand analysis
- Demand forecast generation
- Forecast vs actual comparison
- Safety stock management
- Auto-replenishment rules & execution
- MRP run dashboard
- Planned orders management
- Multi-level BOM explosion
- ABC classification

**Stories:** 20
- Must Have: 13
- Should Have: 6
- Could Have: 1

**Dependencies:** Epic 3, Epic 5, Epic 12

---

### Epic 16: Compliance & Certifications (6-8 tyg) - ORDER 5

**Goal:** Wsparcie BRC/IFS, FSSC 22000, 21 CFR Part 11

**Rationale:** Regulatory, potrzebuje danych z Quality i innych modulow

**Key Features:**
- Certification standard definitions (BRC, IFS, FSSC)
- Compliance self-assessment
- Gap analysis reports
- Certification tracking & renewal alerts
- Electronic signature (21 CFR Part 11)
- Enhanced audit trail
- Tamper-evident storage
- Traceability report
- HACCP compliance report
- Batch record report
- Document version control

**Stories:** 18
- Must Have: 15
- Should Have: 3

**Dependencies:** Epic 6, Epic 14

---

## Execution Order & Timeline

### Recommended Order

| Order | Epic | Rationale | Dependencies |
|-------|------|-----------|--------------|
| 1 | Epic 9: OEE | Krytyczna luka (4/4 konkurentow), fundament dla Phase 4 AI | Epic 4 |
| 2 | Epic 15: Reports | Potrzebne dla OEE dashboards, uniwersalne | All |
| 3 | Epic 8: NPD | Roznicowanie, zwiazane z Quality | Epic 2, 6 |
| 4 | Epic 13: MRP | Zaawansowane, buduje na Phase 2 | Epic 3, 5, 12 |
| 5 | Epic 16: Compliance | Regulatory, potrzebuje danych z innych modulow | Epic 6, 14 |

### Timeline (9-10 months)

```
Week    1-4    5-8    9-12   13-16   17-20   21-24   25-28   29-32   33-36   37-40
        |------|------|------|-------|-------|-------|-------|-------|-------|------|
        [============== Epic 9: OEE (8-10 weeks) ==============]
               [======== Epic 15: Reports (6-8 weeks) ========]
                              [============== Epic 8: NPD (8-10 weeks) ==============]
                                             [============= Epic 13: MRP (8-10 weeks) =============]
                                                                    [======= Epic 16: Compliance (6-8 weeks) =======]
```

### Parallel Execution

| Team | Epics | Focus | Weeks |
|------|-------|-------|-------|
| **Team A** (Core) | Epic 9, Epic 13 | OEE + MRP backend | 1-32 |
| **Team B** (Product) | Epic 8, Epic 16 | NPD + Compliance | 9-40 |
| **Team C** (Analytics) | Epic 15 | Reports + Dashboards | 5-16 |
| **Team D** (Frontend) | All | UI/UX dla wszystkich | 1-40 |

---

## Dependencies from Phase 2

### Required Before Phase 3

| Item | Source | Required For |
|------|--------|--------------|
| Quality Module complete | Epic 6 | NPD, Compliance |
| Shipping complete | Epic 7 | Reports data |
| Finance Basics | Epic 12 | MRP, NPD costing |
| Supplier Quality | Epic 14 | Compliance |
| Production complete | Epic 4 | OEE |

### Phase 2 Outputs Used

| Epic | Uses From Phase 2 |
|------|-------------------|
| Epic 8 (NPD) | BOMs, Routings, Quality specs |
| Epic 9 (OEE) | WO data, machine tables |
| Epic 13 (MRP) | Stock levels, PO, SO |
| Epic 15 (Reports) | All module data |
| Epic 16 (Compliance) | Audit logs, NCR, CoA |

---

## Phase 3 to Phase 4 Handoff

### What Moves to Phase 4

| Feature | Reason | Phase 4 Epic |
|---------|--------|--------------|
| AI & Machine Learning | Wymaga OEE + danych historycznych | Epic 17 |
| Digital Twin & Simulation | Zaawansowana funkcjonalnosc | Epic 18 |
| IIoT & Edge Integration | Infrastruktura hardware | Epic 19 |
| Supply Chain Collaboration | Portal dostawcy/klienta | Epic 20 |
| Advanced Security | Zero-trust, on-premise | Epic 21 |
| Multi-Site Operations | Enterprise feature | Epic 22 |

### Phase 4 Preview

| Epic | Name | Estimated Effort |
|------|------|------------------|
| 17 | AI & Machine Learning | 12 tyg |
| 18 | Digital Twin & Simulation | 10 tyg |
| 19 | IIoT & Edge Integration | 14 tyg |
| 20 | Supply Chain Collaboration | 12 tyg |
| 21 | Advanced Security | 10 tyg |
| 22 | Multi-Site Operations | 12 tyg |

---

## Success Criteria for Phase 3

### Functional Criteria

| Epic | Success Criteria |
|------|-----------------|
| Epic 9 (OEE) | Real-time OEE display, downtime tracking, reports |
| Epic 15 (Reports) | Custom dashboards, scheduled reports, API export |
| Epic 8 (NPD) | Stage-Gate working, trial WO, launch to production |
| Epic 13 (MRP) | Forecast working, auto-replenishment, planned orders |
| Epic 16 (Compliance) | 21 CFR Part 11 signatures, BRC self-assessment |

### Quality Criteria

| Metric | Target |
|--------|--------|
| Test Coverage | >75% |
| Bug Severity | No P0/P1 bugs at release |
| Performance | Dashboard load <3s (P95) |
| OEE Accuracy | Match manual calculation within 1% |

### Business Criteria

| Metric | Target |
|--------|--------|
| OEE Visibility | All customers tracking OEE |
| NPD Adoption | 30% customers using Stage-Gate |
| Compliance Ready | BRC/IFS self-assessment available |
| Analytics Usage | 50% managers with custom dashboards |

---

## Milestones

| Milestone | Week | Deliverables |
|-----------|------|--------------|
| **M1: OEE MVP** | 6 | Downtime tracking, basic OEE calculation |
| **M2: OEE Complete** | 10 | Full OEE, dashboards, reports |
| **M3: Reports MVP** | 12 | Dashboard builder, widget library |
| **M4: NPD MVP** | 18 | Stage-Gate, trial BOM |
| **M5: NPD Complete** | 22 | Full NPD with launch workflow |
| **M6: MRP MVP** | 28 | Forecast, safety stock |
| **M7: MRP Complete** | 32 | Full MRP, auto-replenishment |
| **M8: Compliance MVP** | 36 | E-signatures, self-assessment |
| **M9: Phase 3 Complete** | 40 | All epics done, tested, documented |

---

## Resource Requirements

### Team Composition

| Role | FTE | Responsibility |
|------|-----|----------------|
| **Backend Dev (Core)** | 2 | OEE, MRP engines |
| **Backend Dev (Domain)** | 1 | NPD, Compliance logic |
| **Frontend Dev** | 1.5 | Dashboards, charts, forms |
| **QA Engineer** | 0.5 | Testing, automation |
| **PM** | 0.5 | Coordination, stories |

### Infrastructure

| Item | Notes |
|------|-------|
| TimescaleDB | Time-series storage for OEE data |
| Chart Library | Recharts or Chart.js for dashboards |
| PDF Generation | react-pdf or server-side |
| E-signature | Custom implementation (no external service) |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OEE data accuracy | High | High | Clear definitions, validation, training |
| MRP complexity | Medium | High | Phased implementation, start simple |
| 21 CFR Part 11 | Medium | High | Expert review, phased rollout |
| Stage-Gate adoption | Medium | Medium | Training, templates, champions |
| Performance at scale | Medium | Medium | Caching, materialized views |

---

## Related Documents

| Document | Path |
|----------|------|
| Epic 8: NPD | `docs/2-MANAGEMENT/epics/08-npd.md` |
| Epic 9: OEE | `docs/2-MANAGEMENT/epics/09-oee-performance.md` |
| Epic 13: MRP | `docs/2-MANAGEMENT/epics/13-advanced-planning.md` |
| Epic 15: Reports | `docs/2-MANAGEMENT/epics/15-reports-analytics.md` |
| Epic 16: Compliance | `docs/2-MANAGEMENT/epics/16-compliance.md` |
| Phase 2 Roadmap | `docs/2-MANAGEMENT/PHASE-2-ROADMAP.md` |
| Feature Gap Analysis | `docs/0-DISCOVERY/FEATURE-GAP-ANALYSIS.md` |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Phase 3 Roadmap |
| 2.0 | 2025-12-09 | PM-Agent | Added NPD (Epic 8), OEE (Epic 9), MRP (Epic 13), AI/DT at END |
| 3.0 | 2025-12-09 | PM-Agent | Full rewrite with new epics (8, 9, 13, 15, 16), AI/DT moved to Phase 4 |

---

**Document End**

**Next Steps:**
1. Complete Phase 2 execution
2. Validate Epic dependencies
3. Prepare OEE pilot (first Phase 3 epic)
4. Setup TimescaleDB for time-series data
5. Review compliance requirements with legal
