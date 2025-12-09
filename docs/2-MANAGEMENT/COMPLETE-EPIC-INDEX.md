# MonoPilot - Complete Epic Index

**Version:** 1.0
**Last Updated:** 2025-12-09
**Author:** PM-Agent (John)
**Status:** Approved

---

## Przeglad

Ten dokument zawiera pelna liste wszystkich epicow w projekcie MonoPilot, od MVP (Phase 1) do planowanych funkcjonalnosci enterprise (Phase 4+).

---

## Summary

| Phase | Epics | Est. Stories | Status | Timeline |
|-------|-------|--------------|--------|----------|
| Phase 1 (MVP) | 1-5 | ~132 | 95% | Q1 2025 |
| Phase 2 | 6, 7, 10-12, 14 | ~161 | 0% | Q2-Q4 2025 |
| Phase 3 | 8, 9, 13, 15, 16 | ~180 | 0% | Q4 2025 - Q2 2026 |
| Phase 4 | 17-19 | ~80 | 0% | H2 2026+ |
| **Total** | **1-19** | **~553** | **~23%** | - |

---

## Complete Epic Table

| Epic | Name | Phase | Stories | Priority | Status | Dependencies | Notes |
|------|------|-------|---------|----------|--------|--------------|-------|
| **1** | **Settings** | Phase 1 | ~20 | P0 | DONE | None | Foundation - org, users, roles |
| **2** | **Technical** | Phase 1 | ~25 | P0 | DONE | Epic 1 | Products, BOMs, Routings |
| **3** | **Planning** | Phase 1 | ~30 | P0 | DONE | Epic 1, 2 | PO, TO, Suppliers |
| **4** | **Production** | Phase 1 | ~21 | P0 | DONE | Epic 1, 2, 3 | WO lifecycle, consumption |
| **5** | **Warehouse** | Phase 1 | 36 | P0 | 92% | Epic 1, 2, 3 | LP, GRN, movements, scanner |
| **6** | **Quality Enhanced** | Phase 2 | 33 | P1 | Planned | Epic 1, 5 | HACCP, NCR, CoA |
| **7** | **Shipping Enhanced** | Phase 2 | 39 | P1 | Planned | Epic 5, 6, 10 | SO, FEFO, picking, packing |
| **8** | **NPD** | Phase 3 | ~35 | P2 | Planned | Epic 2 | Stage-gate, trial BOMs |
| **9** | **OEE & Performance** | Phase 3 | ~30 | P2 | Planned | Epic 4, 5 | Real-time OEE tracking |
| **10** | **GS1 & Barcodes (FULL)** | Phase 2 | 34 | P1 | Planned | Epic 2, 5 | GTIN, GS1-128, SSCC, DataMatrix, Digital Link |
| **11** | **Catch Weight** | Phase 2 | 22 | P1 | Planned | Epic 2, 4, 5 | Variable weight (meat/fish) |
| **12** | **Finance Basics** | Phase 2 | ~18 | P1 | Planned | Epic 3, 4 | Cost tracking, margin |
| **13** | **Advanced Planning/MRP** | Phase 3 | ~40 | P2 | Planned | Epic 3, 4, 5 | Full MRP, capacity planning |
| **14** | **Supplier Quality** | Phase 2 | ~15 | P1 | Planned | Epic 3 | SQM basics, rating |
| **15** | **AI & ML** | Phase 3 | ~40 | P2 | Planned | All Phase 2 | Predictive, forecasting (END) |
| **16** | **Digital Twin** | Phase 3 | ~35 | P2 | Planned | Epic 15 | Simulation, what-if (END) |
| **17** | **Full Compliance** | Phase 4 | ~25 | P3 | Future | All | 21 CFR Part 11 |
| **18** | **Advanced Analytics** | Phase 4 | ~30 | P3 | Future | All | BI, multi-site reports |
| **19** | **Multi-Site** | Phase 4 | ~25 | P3 | Future | All | Enterprise multi-site |

---

## Phase 1: MVP (Core Manufacturing)

**Status:** 95% Complete
**Target:** Q1 2025

| Epic | Name | Stories | Status | Key Deliverables |
|------|------|---------|--------|------------------|
| 1 | Settings | ~20 | DONE | Organization, users, roles, warehouses |
| 2 | Technical | ~25 | DONE | Products, BOMs, Routings, Allergens |
| 3 | Planning | ~30 | DONE | PO, TO, Suppliers, MRP basics |
| 4 | Production | ~21 | DONE | WO lifecycle, consumption, yield |
| 5 | Warehouse | 36 | 92% | LP, GRN, ASN, movements, scanner |

**Open Issues:**
- BUG-001: Print integration incomplete
- BUG-002: Print API stub only
- BUG-003: GRN LP navigation (FIXED)
- BUG-004: Scanner PO barcode (FIXED)
- BUG-005: Warehouse Settings UI

---

## Phase 2: Quality, Shipping & Food-Specific

**Status:** Planned
**Timeline:** Q2-Q4 2025 (44-50 tygodni)

| Order | Epic | Name | Stories | Effort | Key Deliverables |
|-------|------|------|---------|--------|------------------|
| 1 | 6 | Quality Enhanced | 33 | 10-12 tyg | QA status, HACCP/CCP, NCR, CoA |
| 2 | 11 | Catch Weight | 22 | 6 tyg | Variable weight products (meat/fish) |
| 3 | 10 | GS1 & Barcodes (FULL) | 34 | 10 tyg | GTIN, GS1-128, SSCC, DataMatrix, Digital Link |
| 4 | 7 | Shipping Enhanced | 39 | 10-12 tyg | SO, FEFO picking, packing, labels |
| 5 | 12 | Finance Basics | ~18 | 4-6 tyg | Product costing, margin, variance |
| 6 | 14 | Supplier Quality | ~15 | 4 tyg | Supplier rating, incoming QC, NCR |

**Key Decisions:**
- Quality in Phase 2 (not Phase 1)
- GS1 FULL scope (10 weeks instead of 6)
- Catch Weight EARLY (after Quality)
- Finance Basics + Supplier Quality added

---

## Phase 3: NPD, OEE, Advanced Planning, AI/Digital Twin

**Status:** Planned
**Timeline:** Q4 2025 - Q2 2026 (48-54 tygodni)

| Order | Epic | Name | Stories | Effort | Key Deliverables |
|-------|------|------|---------|--------|------------------|
| 1 | 8 | NPD | ~35 | 8 tyg | Stage-gate, trial BOMs, costing |
| 2 | 9 | OEE & Performance | ~30 | 8 tyg | Real-time OEE, downtime tracking |
| 3 | 13 | Advanced Planning/MRP | ~40 | 10 tyg | Full MRP, capacity planning |
| 4 | 15 | AI & ML | ~40 | 12 tyg | Predictive maintenance, demand forecast (END) |
| 5 | 16 | Digital Twin | ~35 | 10 tyg | BOM simulation, what-if (END) |

**Key Decisions:**
- AI/Digital Twin at END of Phase 3
- 50/50 priority between AI and Digital Twin
- Can parallel if resources allow

---

## Phase 4: Enterprise Features

**Status:** Future
**Timeline:** H2 2026+

| Epic | Name | Stories | Key Deliverables |
|------|------|---------|------------------|
| 17 | Full Compliance | ~25 | 21 CFR Part 11, electronic signatures |
| 18 | Advanced Analytics | ~30 | BI dashboards, advanced reporting |
| 19 | Multi-Site | ~25 | Multi-site operations, cross-site transfers |

---

## Epic Dependency Graph

```
                            Epic 1 (Settings)
                                   |
                                   v
                            Epic 2 (Technical)
                                   |
            +----------------------+----------------------+
            |                      |                      |
            v                      v                      v
      Epic 3 (Planning)      Epic 8 (NPD)          Epic 10 (GS1)
            |               [Phase 3]              [Phase 2]
            |
      +-----+-----+
      |           |
      v           v
Epic 4 (Prod)  Epic 12 (Finance)
      |        [Phase 2]
      |
      v
Epic 5 (Warehouse) <- CURRENT (92%)
      |
      +---------------------+----------------------+
      |                     |                      |
      v                     v                      v
Epic 6 (Quality)    Epic 11 (Catch Weight)  Epic 14 (Supplier QM)
[Phase 2 - 1st]     [Phase 2 - 2nd]          [Phase 2 - 6th]
      |
      v
Epic 7 (Shipping) [Phase 2 - 4th]
      |
      v
Epic 9 (OEE) [Phase 3]
      |
      v
Epic 13 (MRP) [Phase 3]
      |
      +---------------------+
      |                     |
      v                     v
Epic 15 (AI/ML)      Epic 16 (Digital Twin)
[Phase 3 - END]      [Phase 3 - END]
      |                     |
      +----------+----------+
                 |
                 v
         Phase 4 Epics (17-19)
```

---

## Story Count by Module

| Epic | Module | Est. Stories | Must Have | Should Have | Could Have |
|------|--------|--------------|-----------|-------------|------------|
| 1 | Settings | ~20 | 16 | 3 | 1 |
| 2 | Technical | ~25 | 18 | 5 | 2 |
| 3 | Planning | ~30 | 22 | 6 | 2 |
| 4 | Production | ~21 | 15 | 4 | 2 |
| 5 | Warehouse | 36 | 28 | 6 | 2 |
| 6 | Quality | 33 | 17 | 12 | 4 |
| 7 | Shipping | 39 | 21 | 14 | 4 |
| 8 | NPD | ~35 | 25 | 8 | 2 |
| 9 | OEE | ~30 | 22 | 6 | 2 |
| 10 | GS1 (FULL) | 34 | 23 | 8 | 3 |
| 11 | Catch Weight | 22 | 11 | 8 | 3 |
| 12 | Finance | ~18 | 10 | 6 | 2 |
| 13 | MRP | ~40 | 27 | 10 | 3 |
| 14 | Supplier QM | ~15 | 8 | 5 | 2 |
| 15 | AI/ML | ~40 | 24 | 12 | 4 |
| 16 | Digital Twin | ~35 | 20 | 10 | 5 |
| 17 | Compliance | ~25 | 15 | 8 | 2 |
| 18 | Analytics | ~30 | 18 | 10 | 2 |
| 19 | Multi-Site | ~25 | 15 | 8 | 2 |
| **Total** | | **~553** | **~355** | **~149** | **~49** |

---

## Timeline Overview

```
2025 Q1:  Phase 1 (MVP) - 95% done
          |
2025 Q2:  Epic 6 (Quality) + Epic 11 (Catch Weight)
          |
2025 Q3:  Epic 10 (GS1) + Epic 7 (Shipping)
          |
2025 Q4:  Epic 12 (Finance) + Epic 14 (SQM) + Epic 8 (NPD)
          |
2026 Q1:  Epic 9 (OEE) + Epic 13 (MRP)
          |
2026 Q2:  Epic 15 (AI) + Epic 16 (Digital Twin)
          |
2026 H2:  Phase 4 (17-19)
```

---

## PRD References

| Epic | PRD Location | Status |
|------|--------------|--------|
| 1-5 | @docs/1-BASELINE/product/modules/ | Complete |
| 6 | @docs/2-MANAGEMENT/epics/06-quality-enhanced.md | Draft |
| 7 | @docs/2-MANAGEMENT/epics/07-shipping-enhanced.md | Draft |
| 8-9 | TBD | Not started |
| 10 | @docs/2-MANAGEMENT/epics/10-gs1-barcodes.md | Draft |
| 11 | @docs/2-MANAGEMENT/epics/11-catch-weight.md | Draft |
| 12-19 | TBD | Not started |

---

## Related Documents

| Document | Path |
|----------|------|
| Master PRD | @docs/1-BASELINE/product/prd.md |
| Phase 2 Roadmap | @docs/2-MANAGEMENT/PHASE-2-ROADMAP.md |
| Phase 3 Roadmap | @docs/2-MANAGEMENT/PHASE-3-ROADMAP.md |
| Bug Tracker | @docs/BUGS.md |
| MVP Phases | @docs/MVP-PHASES.md |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial Complete Epic Index |

---

**Document End**
