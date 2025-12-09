# MonoPilot - MVP Phases

**Last Updated:** 2025-12-09
**Product Type:** Manufacturing ERP (MES/MOM) for Food Industry
**Business Model:** SaaS

---

## Phase Overview

| Phase | Epics | Status | Goal |
|-------|-------|--------|------|
| **MVP (Phase 1)** | 1-5 | ~95% Done | Core manufacturing operations |
| **Phase 2** | 6-7 | Not Started | Quality & Shipping |
| **Phase 3** | 8-11 | Planned | AI, Digital Twin, IIoT, Sustainability |
| **Phase 4** | 12-14 | Future | Supply Chain, Security, UX |

---

## MVP (Phase 1) - Core Manufacturing

**Goal:** Complete manufacturing workflow from planning to warehouse

### Epics Included

| Epic | Name | Stories | Status | Notes |
|------|------|---------|--------|-------|
| 1 | Settings | ~20 | DONE | Org, users, roles, warehouses, locations |
| 2 | Technical | ~25 | DONE | Products, BOMs, Routings, UoM |
| 3 | Planning | ~30 | DONE | PO, TO, Suppliers, MRP basics |
| 4 | Production | ~21 | DONE | WO lifecycle, consumption, output |
| 5 | Warehouse | 36 | 92% | LP, receiving, movements, scanner |

### Epic 5 Remaining Work

| Area | Status | Stories Needed |
|------|--------|----------------|
| Print Integration | NOT DONE | Real ZPL/IPP printer support |
| Warehouse Settings UI | NOT DONE | /settings/warehouse page |
| Scanner PO Barcode | PARTIAL | Scan PO to start receive |
| Scanner Session Timeout | NOT DONE | Auto-logout after inactivity |
| Offline Queue/PWA | NOT DONE | Phase 3 candidate |

### MVP Exit Criteria

- [ ] All Epic 1-5 stories DONE
- [ ] Print integration working (labels)
- [ ] Warehouse settings UI complete
- [ ] Bug fixes: BUG-001 through BUG-005
- [ ] RLS audit passed
- [ ] Performance baseline established
- [ ] Test coverage >70%

---

## Phase 2 - Quality & Shipping

**Goal:** Complete outbound logistics and quality compliance

### Epics Included

| Epic | Name | Stories | Priority | Dependency |
|------|------|---------|----------|------------|
| 6 | Quality | 28 | HIGH | Epic 5 (LP) |
| 7 | Shipping | 28 | HIGH | Epic 5, Epic 6 |

### Epic 6: Quality Control (28 stories)

**Key Features:**
- LP QA Status (pending/passed/failed/quarantine)
- Quality Holds with investigation
- Product Specifications & Test Results
- NCR (Non-Conformance Reports)
- Certificate of Analysis (CoA)
- Quality Dashboard & Reports

**Critical Stories:**
- 6.1-6.5: QA Status Management
- 6.6-6.9: Quality Holds
- 6.10-6.14: Specifications & Testing
- 6.15-6.18: NCR Workflow
- 6.19-6.21: CoA Management
- 6.22-6.24: Reporting

### Epic 7: Shipping & Fulfillment (28 stories)

**Key Features:**
- Sales Orders (SO) CRUD & lifecycle
- Pick Lists with FIFO/FEFO
- Packing & Package tracking
- Shipment tracking (carrier, tracking#)
- Scanner picking/packing workflows
- Shipping documents (packing slip, labels)

**Critical Stories:**
- 7.1-7.4: Sales Orders
- 7.5-7.8: Shipments
- 7.9-7.14: Picking
- 7.15-7.17: Packing
- 7.18-7.21: Documents
- 7.22-7.24: Scanner Workflows

### Phase 2 Exit Criteria

- [ ] All Epic 6 stories DONE
- [ ] All Epic 7 stories DONE
- [ ] QA blocking shipping works
- [ ] Full order-to-ship workflow tested
- [ ] Customer can receive CoA with shipment

---

## Phase 3 - AI, Digital Twin & Sustainability

**Goal:** Inteligentna produkcja z AI, Digital Twins, IIoT i ESG

### Epics Included

| Epic | Name | Stories | Priority | Dependency |
|------|------|---------|----------|------------|
| 8 | AI & Machine Learning | ~40 | HIGH | Epic 5, Epic 9 |
| 9 | Digital Twin & Simulation | ~35 | MED-HIGH | Epic 2, Epic 4 |
| 10 | IIoT & Edge Integration | ~45 | HIGH | Infrastructure |
| 11 | Sustainability & ESG | ~28 | MEDIUM | Epic 10 |

### Epic 8: AI & Machine Learning

**Key Features:**
- Predictive Maintenance - prognozowanie awarii maszyn
- AI-Optimized Scheduling - optymalizacja kolejnosci WO
- Anomaly Detection - wykrywanie odchylen
- Quality Prediction - prognoza jakosci
- Automated Quality Inspection (computer vision)

### Epic 9: Digital Twin & Simulation

**Key Features:**
- Process Modelling - wirtualne modele linii
- BOM What-If Analysis - symulacja zmian receptur
- Routing Simulation - alternatywne sciezki produkcji
- Capacity Planning - symulacja obciazenia
- Energy Optimization - modelowanie zuzycia

### Epic 10: IIoT & Edge Integration

**Key Features:**
- MQTT Gateway - polaczenie z maszynami
- OPC UA Connector - standard przemyslowy
- Real-time sensor data - dane z sensorow
- Edge Processing - lokalne przetwarzanie
- Event-driven architecture (NATS/Kafka)
- Time-series storage (TimescaleDB)

### Epic 11: Sustainability & ESG

**Key Features:**
- Energy Tracking per maszyna/WO
- CO2 Emission Calculator
- Waste & Scrap Reporting
- ESG Dashboard
- Certification Support (BRC, IFS, FSSC 22000)

### Phase 3 Exit Criteria

- [ ] Basic AI anomaly detection working
- [ ] Machine connectivity (5+ PLC types)
- [ ] Energy tracking active
- [ ] Digital twin visualization
- [ ] ESG dashboard live

---

## Phase 3+ Preview - Zaawansowane Funkcje

> Pelna dokumentacja: @docs/2-MANAGEMENT/PHASE-3-ROADMAP.md
> User Stories: @docs/2-MANAGEMENT/epics/ADVANCED-FEATURES-BACKLOG.md

### Phase 4: Zaawansowane Operacje (H1 2026)

| Epic | Nazwa | Kluczowe Funkcje |
|------|-------|------------------|
| 12 | Supply Chain Collaboration | Supplier Portal, Demand Forecasting, Auto-Replenishment, EDI |
| 13 | Advanced Security | Zero-Trust, ABAC, 21 CFR Part 11, On-Premise deployment |
| 14 | UX Enhancements | Guided Work Instructions, AR Integration, Self-Service Analytics |

### Phase 5: Skalowanie (H2 2026+)

| Epic | Nazwa | Kluczowe Funkcje |
|------|-------|------------------|
| 15 | Multi-Site Operations | Multi-factory support, Centralized management |
| 16 | Market Expansion | Multi-language, Multi-currency, Regional compliance |
| 17 | Partner Ecosystem | Public API, Marketplace, Certified integrators |

### Roadmap Timeline

```
2025 Q1-Q2: Phase 1-2 (MVP + Quality/Shipping)
           |
2025 Q3:   Epic 10 (IIoT) - Foundation layer
           |
2025 Q4:   Epic 8 (AI/ML) + Epic 11 (Sustainability)
           |
2026 Q1:   Epic 9 (Digital Twin)
           |
2026 Q2:   Epic 12 (Supply Chain) + Epic 13 (Security)
           |
2026 Q3+:  Epic 14-17 (UX, Multi-Site, Expansion, Partners)
```

### Dlaczego Phase 3+ jest wazne?

Na podstawie analizy trendow branzy MES 2025 (DISCOVERY-REPORT-V4.md):

1. **AI & ML** - Predictive maintenance i AI scheduling staja sie standardem w nowoczesnych MES
2. **Digital Twins** - Symulacja procesow pozwala na optymalizacje bez ryzyka produkcyjnego
3. **IIoT** - Bezposrednie polaczenie z maszynami eliminuje reczne wprowadzanie danych
4. **Sustainability** - Wymagania ESG i CSRD (EU) wymuszaja tracking energii i emisji

Te funkcje odroznia MonoPilot od konkurencji i pozwola na wejscie do segmentu mid-market.

---

## Story Count Summary

| Phase | Epics | Est. Stories | Status |
|-------|-------|--------------|--------|
| MVP | 1-5 | ~132 | 95% |
| Phase 2 | 6-7 | ~56 | 0% |
| Phase 3 | 8-11 | ~148 | 0% |
| Phase 4 | 12-14 | ~100 | Future |
| **Total** | **1-14** | **~436** | **~30%** |

---

## Current Priority Queue

### Immediate (MVP Completion)

1. **BUG-001/002**: Print integration (ZPL/IPP)
2. **BUG-005**: Warehouse Settings UI page
3. **BUG-003**: GRN Items LP navigation
4. **BUG-004**: Scanner PO barcode receive

### Next Sprint (MVP Polish)

5. Scanner session timeout
6. RLS security audit
7. Performance baseline
8. Test coverage improvement

### After MVP

9. Start Epic 6 (Quality)
10. Parallel: Epic 7 planning

---

## Dependencies Graph

```
Epic 1 (Settings)
    |
Epic 2 (Technical) <---------------------------+
    |                                           |
Epic 3 (Planning) -----> Epic 8 (AI/ML) -------+
    |                         ^
Epic 4 (Production)           |
    |                         |
Epic 5 (Warehouse) <-- CURRENT
    |                         |
Epic 6 (Quality) ------> Phase 2
    |                         |
Epic 7 (Shipping) -----> Phase 2
    |                         |
    +----> Epic 10 (IIoT) ----+
                |
                v
         Epic 11 (Sustainability)
                |
                v
         Epic 9 (Digital Twin) --> Phase 3
                |
                v
         Epic 12-17 --> Phase 4-5
```

---

## Notes

### What moved from MVP to Phase 2/3

| Feature | Originally | Now | Reason |
|---------|-----------|-----|--------|
| Quality Module | MVP | Phase 2 | Core manufacturing works without QA |
| Shipping Module | MVP | Phase 2 | Can ship via manual process |
| Offline Scanner | MVP | Phase 3 | Network is available in staging |
| NPD | Phase 2 | Phase 3 | Not critical for initial customers |

### Risk Items

1. **RLS Policies** - Need security audit before production
2. **Print Integration** - Blocking warehouse workflow
3. **Test Coverage** - Currently unknown, need measurement
4. **Performance** - No baseline metrics yet

---

## Phase 3+ Investment Rationale

| Feature Area | ROI Driver | Competitive Advantage |
|--------------|-----------|----------------------|
| AI/ML | Reduced downtime, better planning | Differentiator vs Excel/basic MES |
| Digital Twin | Risk reduction, faster NPD | Enterprise-level capability |
| IIoT | Real-time visibility, automation | Modern architecture vs legacy |
| Sustainability | Compliance, cost reduction | Regulatory requirement (CSRD) |
| Supply Chain | Efficiency, automation | Full value chain coverage |
| Security | Enterprise sales enabler | Opens new market segment |

---

**Document End**
