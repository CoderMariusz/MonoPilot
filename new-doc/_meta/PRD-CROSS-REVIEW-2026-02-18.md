# Cross-Review PRD M00-M15 (FULL)
Data: 2026-02-18

---

## Podsumowanie

| PRD | Struktura | Foundation | UPDATE-LIST | Backend-first | Cross-module | Jakosc | Ocena |
|-----|-----------|-----------|-------------|---------------|-------------|--------|-------|
| M00 Foundation | PASS | N/A (zrodlo) | PASS | N/A | PASS | PASS | **PASS** |
| M01 Settings | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M02 Technical | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M03 Warehouse | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M04 Planning | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M05 Scanner | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| M06 Production | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M07 Shipping | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M08 Quality | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M09 NPD | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| M10 Finance | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M11 Multi-Site | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M12 OEE | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |
| M13 Integrations | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| M14 Maintenance | PASS | PASS | N/A | PASS | PASS | PASS | **PASS** |
| M15 Reporting | PASS | PASS | PASS | PASS | PASS | PASS | **PASS** |

**Ogolna ocena**: 16/16 PASS. Wszystkie PRD sa strukturalnie kompletne, spojne z Foundation PRD i pokrywaja wymagane pozycje z PRD-UPDATE-LIST. **24/24 rekomendacji RESOLVED** (0 HIGH, 8 MEDIUM ✅, 16 LOW ✅). 13 PRD zaktualizowanych (M00, M01, M02, M03, M04, M05, M06, M07, M09, M11, M12, M14, M15).

---

## 1. Struktura

### 1.1 Sekcje (12 wymaganych)

| PRD | Exec Sum | Obj | Pers | Scope | Constr | Dec | ModMap | Req | KPIs | Risks | Success | Refs | Ocena |
|-----|----------|-----|------|-------|--------|-----|--------|-----|------|-------|---------|------|-------|
| M00 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M01 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M02 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M03 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M04 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M05 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M06 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M07 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M08 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M09 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M10 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M11 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M12 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M13 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M14 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |
| M15 | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | OK | 12/12 |

Wszystkie PRD maja pelne 12 sekcji.

**Uwaga**: M06 Production ma dodatkowa sekcje 13 (Pytania doprecyzowujace) — to bonus, nie naruszenie.

### 1.2 Naglowek

| PRD | Format naglowka | Wersja | Data | Status | Ocena |
|-----|-----------------|--------|------|--------|-------|
| M00 | `**Wersja**: 2.3 \| **Data**: 2026-02-16 \| **Status**: Draft` | 2.3 | OK | Draft | OK |
| M01 | `**Wersja**: 3.2 \| **Data**: 2026-02-16 \| **Status**: Draft` | 3.2 | OK | Draft | OK |
| M02 | `**Wersja**: 3.2 \| **Data**: 2026-02-16 \| **Status**: Draft` | 3.2 | OK | Draft | OK |
| M03 | `**Wersja**: 2.1 \| **Data**: 2026-02-16 \| **Status**: Draft` | 2.1 | OK | Draft | OK |
| M04 | `**Wersja**: 3.2 \| **Data**: 2026-02-16 \| **Status**: Draft` | 3.2 | OK | Draft | OK |
| M05 | `**Wersja**: 1.2 \| **Data**: 2026-02-16 \| **Status**: Draft` | 1.2 | OK | Draft | OK |
| M06 | `**Wersja**: 3.1 \| **Data**: 2026-02-17 \| **Status**: Draft` | 3.1 | OK | Draft | OK |
| M07 | `**Wersja**: 3.1 \| **Data**: 2026-02-18 \| **Status**: Draft` | 3.1 | OK | Draft | OK |
| M08 | `**Wersja**: 2.0 \| **Data**: 2026-02-17 \| **Status**: Draft` | 2.0 | OK | Draft | OK |
| M09 | `**Wersja**: 1.1 \| **Data**: 2026-02-17 \| **Status**: Draft` | 1.1 | OK | Draft | OK |
| M10 | `**Wersja**: 1.0 \| **Data**: 2026-02-18 \| **Status**: Draft` | 1.0 | OK | Draft | OK |
| M11 | `**Wersja**: 1.0 \| **Data**: 2026-02-18 \| **Status**: Draft` | 1.0 | OK | Draft | OK |
| M12 | `**Wersja**: 1.0 \| **Data**: 2026-02-18 \| **Status**: Draft` | 1.0 | OK | Draft | OK |
| M13 | `**Wersja**: 1.0 \| **Data**: 2026-02-18 \| **Status**: Draft` | 1.0 | OK | Draft | OK |
| M14 | `**Wersja**: 1.0 \| **Data**: 2026-02-18 \| **Status**: Draft` | 1.0 | OK | Draft | OK |
| M15 | `**Wersja**: 1.0 \| **Data**: 2026-02-18 \| **Status**: Draft` | 1.0 | OK | Draft | OK |

### 1.3 Jezyk

Wszystkie PRD sa w jezyku polskim. M09 NPD ma wiecej terminow angielskich (Stage-Gate, Handoff, Clone, Compare) — dopuszczalne jako terminy domenowe bez polskich odpowiednikow.

---

## 2. Spojnosc z Foundation PRD

### 2.1 Numeracja modulow

| PRD | Numer w PRD | Numer w Foundation | Zgodne? |
|-----|-------------|-------------------|---------|
| M00 Foundation | M00 | M00 | OK |
| M01 Settings | M01 | M01 | OK |
| M02 Technical | M02 | M02 | OK |
| M03 Warehouse | M03 | M03 | OK |
| M04 Planning | M04 | M04 | OK |
| M05 Scanner | M05 | M05 | OK |
| M06 Production | M06 | M06 | OK |
| M07 Shipping | M07 | M07 | OK |
| M08 Quality | M08 | M08 | OK |
| M09 NPD | M09 | M09 | OK |
| M10 Finance | M10 | M10 | OK |
| M11 Multi-Site | M11 | M11 | OK |
| M12 OEE | M12 | M12 | OK |
| M13 Integrations | M13 | M13 | OK |
| M14 Maintenance | M14 | M14 | OK |
| M15 Reporting | M15 | M15 | OK |

### 2.2 Zaleznosci modulowe vs Foundation Module Map

| PRD | Zaleznosci w PRD | Zaleznosci w Foundation | Zgodne? | Uwagi |
|-----|-------------------|------------------------|---------|-------|
| M01 | — (fundament) | — | OK | |
| M02 | M01 | M01 | OK | |
| M03 | M01, M02, M04 | M01, M02 | OK | M04 to implicit (PO/TO/WO) |
| M04 | M01, M02, M03 | M01, M02, M03 | OK | |
| M05 | M01, M03, M04, M06, M07, M08 | M03 (base), M04, M06, M07, M08 | OK | M01 implicit |
| M06 | M02, M04, M03, M01 | M02, M04 | OK | M03/M01 implicit |
| M07 | M01, M02, M03, M08 | M03, M08 | OK | PRD rozszerza -- M01/M02 implicit |
| M08 | M01, M02, M03, M06 | M03, M06 | OK | M01/M02 implicit |
| M09 | M01, M02 | M02 | OK | M01 implicit |
| M10 | M06, M03, M02, M01 | M06, M03 | OK | |
| M11 | M01, M03 | M01, M03 | OK | |
| M12 | M06 + M01, M02, M08, M14 | M06 | OK | PRD rozszerza o cross-module |
| M13 | "Wszystkie" | "Wszystkie" | OK | |
| M14 | M01, M06, M12 | M01, M06, M12 | OK | |
| M15 | M06, M03, M08 | M06, M03, M08 | OK | |

### 2.3 Zgodnosc z ADR (decyzje Foundation)

| ADR | Wymaganie | M01 | M02 | M03 | M04 | M05 | M06 | M07 | M08 | M09 |
|-----|-----------|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| ADR-001 LP | LP-based, brak luznych qty | N/A | OK (D5) | OK (D1) | OK (5) | OK | OK (D2) | OK (D-SHP-1) | OK (D1) | N/A |
| ADR-002 BOM Snapshot | WO kopia BOM | N/A | OK (D1) | N/A | OK (D3) | N/A | OK (D1) | N/A | N/A | OK (09.12) |
| ADR-003/013 RLS | org_id NOT NULL, RLS | OK (D-SET-1) | OK (D4) | OK (D7) | OK (D5) | OK (5) | OK (5) | OK (D-SHP-7) | OK (D10) | OK (D-NPD-11) |
| ADR-004 GS1 | GTIN-14, GS1-128, SSCC-18 | N/A | OK (D6) | OK (D2) | N/A | OK (D4) | N/A | OK (D-SHP-4) | N/A | N/A |
| ADR-005 FIFO/FEFO | FEFO default | N/A | N/A | OK (D3) | N/A | OK | OK (D5) | OK (D-SHP-2) | N/A | N/A |
| ADR-006 Scanner-first | 48px, scan-first | N/A | N/A | OK (D8) | N/A | OK (D1) | OK (D3) | OK (D-SHP-6) | OK (D8) | N/A |
| ADR-007 WO State Machine | 6 stanow | N/A | N/A | N/A | OK (D1) | N/A | OK (D4) | N/A | N/A | N/A |
| ADR-008 Audit Trail | PG triggers + app ctx | OK (D-SET-4) | OK (D7) | OK (5) | OK (5) | OK (SC-BE-004) | OK (5) | OK (D-SHP-11) | OK (D14) | OK (D-NPD-09) |
| ADR-009 Routing Costs | setup/working/overhead | N/A | OK (D2) | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| ADR-010 Procurement | lead_time/moq per product | N/A | OK (D3) | N/A | OK (D10) | N/A | N/A | N/A | N/A | N/A |
| ADR-011 Module Toggle | modules table | OK (D-SET-3) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | OK (D-NPD-01) |
| ADR-012 Role Permissions | JSONB CRUD | OK (D-SET-2) | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| ADR-019 TO State Machine | draft->closed | N/A | N/A | N/A | OK (D2) | N/A | N/A | N/A | N/A | N/A |
| site_id NULL | Na WSZYSTKICH tabelach | OK (D-SET-12) | OK (5) | OK (5) | OK (5) | N/A | N/A | OK (sek.5) | OK (5) | N/A |

**Kontynuacja — M10-M15**: Patrz poprzedni raport, sekcja 2.3. Wszystkie zgodne.

**Uwaga LOW-NEW-1**: ~~M05 Scanner nie wymienia explicite `site_id NULL` na swojej tabeli `scanner_audit_log`.~~ RESOLVED w M05 v1.2: site_id + device_type + scan_method dodane do scanner_audit_log.

**Uwaga LOW-NEW-2**: ~~M06 Production nie wymienia explicite `site_id NULL` na nowych tabelach Phase 1 (`waste_categories`, `downtime_reasons`, `downtime_records`, `shifts`, `production_outputs`).~~ RESOLVED w M06 v3.1: site_id dodane do wszystkich tabel Phase 1.

**Uwaga MEDIUM-NEW-1**: ~~M09 NPD nie wymienia `site_id NULL` na zadnej ze swoich 16 tabel.~~ RESOLVED w M09 v1.1: site_id UUID NULL dodane do wszystkich 16 tabel NPD.

### 2.4 Phase 1/Phase 2 podzial vs Foundation

| PRD | Phase w PRD | Phase w Foundation | Zgodne? |
|-----|-------------|-------------------|---------|
| M01 Settings | Phase 1 (MVP) | Phase 1 | OK |
| M02 Technical | Phase 1 (MVP basic) + Phase 2 (versioning, co-products) | Phase 1 basic + Phase 2 adv. | OK |
| M03 Warehouse | Phase 1 (LP, GRN, moves) + Phase 2 (ASN, TO, palety) | Phase 1 basic + Phase 2 adv. | OK |
| M04 Planning | Phase 1 (PO, TO, WO) + Phase 2 (MRP) | Phase 1 + Phase 2 | OK |
| M05 Scanner | Phase 1 inkr. (M03/M04/M06/M08) + Phase 2 (offline, PWA) | Phase 1 inkr. + Phase 2 | OK |
| M06 Production | Phase 1 (WO exec, waste, downtime) + Phase 2 (OEE, routes) | Phase 1 + Phase 2 | OK |
| M07 Shipping | Phase 1 (MVP basic) | Phase 1 | OK |
| M08 Quality | Phase 1 (QA holds, NCR basic, HACCP basic) + Phase 2 (full) | Phase 1 basic + Phase 2 | OK |
| M09 NPD | Phase 2 (3 sub-phases) | Phase 2 | OK |
| M10 Finance | Phase 2 | Phase 2 | OK |
| M11 Multi-Site | Phase 2 | Phase 2 | OK |
| M12 OEE | Phase 2 | Phase 2 | OK |
| M13 Integrations | Phase 2 | Phase 2 | OK |
| M14 Maintenance | Phase 2 | Phase 2 | OK |
| M15 Reporting | Phase 1 inkr. + Phase 2 | Phase 1 inkr. + Phase 2 | OK |

### 2.5 Problemy spojnosci z Foundation

1. **Brak problemow blokujacych**. Wszystkie 16 PRD sa spojne z Foundation PRD w kluczowych decyzjach.

2. **Uwaga LOW-2 (z poprzedniego raportu)**: Foundation mowi o EDI "PO 850, ASN 856, faktury 810" (X12), a M13 Integrations poprawnie uzywa EDIFACT. Foundation PRD powinien byc zaktualizowany.

3. **Uwaga LOW-3 (z poprzedniego raportu)**: Foundation linia 12 mowi "rynek docelowy UK" ale linia 163 "GBP". Sprzecznosc z wczesniejszym opisem "Polscy producenci" -- Foundation zaktualizowany w v2.2 (linia 12 = "Brytyjscy producenci"), wiec ROZWIAZANE.

---

## 3. PRD-UPDATE-LIST pokrycie

### 3.1 Settings (1.1-1.7)

| Pozycja | Opis | Pokryta? | Gdzie w M01 PRD |
|---------|------|----------|-----------------|
| 1.1 | Multi-country VAT codes | TAK | E01.6 [1.1], sekcja 8, s. 397-405: nowe pola country_code, tax_type na tax_codes |
| 1.2 | Waste category configuration | TAK | E01.6 [1.2], sekcja 8, s. 407-415: tabela waste_categories, CRUD API |
| 1.3 | Grade thresholds config A/B/C/D | TAK | E01.6 [1.3], sekcja 8, s. 417-424: tabela grade_thresholds, API |
| 1.4 | Fiscal calendar config 4-4-5 | TAK | E01.6 [1.4], sekcja 8, s. 426-436: tabela fiscal_calendar, typ kalendarza |
| 1.5 | Target KPIs per line/product | TAK | E01.6 [1.5], sekcja 8, s. 438-446: tabela target_kpis, API |
| 1.6 | Disposition codes | TAK | E01.6 [1.6], sekcja 8, s. 448-455: tabela disposition_codes, API |
| 1.7 | Cost per KG setting | TAK (przeniesione do M02) | E01.6 [1.7], s. 457-459: explicite przeniesione do M02 jako products.cost_per_kg |

Pokrycie: **7/7 (100%)**

### 3.2 Technical / Products (2.1-2.15)

| Pozycja | Opis | Pokryta? | Gdzie w M02 PRD |
|---------|------|----------|-----------------|
| 2.1 | Weight fields: net/tare/gross | TAK | E02.1 tabela, s. 293-295: DECIMAL(15,4), gross auto-computed |
| 2.2 | Shelf life: shelf_life_days, best_before, shelf_advice | TAK | E02.1, s. 296-298: trzy osobne pola z opisami |
| 2.3 | Catch weight: is_catch_weight, cw_unit, nominal/min/max | TAK | E02.1, s. 299-303: 5 pol, WARN nie block |
| 2.4 | yield_percent (expected) | TAK | E02.1, s. 304: DECIMAL(5,2), [0,200] |
| 2.5 | preferred_supplier_id | TAK | E02.1, s. 305: UUID FK suppliers, NULL dozwolone |
| 2.6 | over/under_delivery_tolerance_pct | TAK | E02.1, s. 306-307: DECIMAL(5,2), [0,100] |
| 2.7 | Default purchase price | TAK | E02.7 Phase 2, s. 632: products.default_purchase_price |
| 2.8 | BOM versioning (version_id, active, approved) | TAK | E02.6 Phase 2, s. 571-579: approval workflow, version history |
| 2.9 | Co-products table | TAK | E02.6, s. 581-593: tabela co_products, cost allocation |
| 2.10 | variable_scrap_pct per BOM line | TAK | E02.6, s. 595-597: zastepuje scrap_percent |
| 2.11 | flushing_principle (BACKFLUSH/MANUAL) | TAK | E02.6, s. 599-605: DEFAULT BACKFLUSH |
| 2.12 | BOM line priority (consumption order) | TAK | E02.6, s. 607-609: consumption_priority INTEGER |
| 2.13 | BOM line valid_from/valid_to | TAK | E02.6, s. 611-613: DATE, pomijane w WO snapshot |
| 2.14 | Formula change audit trail | TAK | E02.6, s. 615-624: tabela formula_audit_log, JSONB |
| 2.15 | item_group classification | TAK | E02.1, s. 308, 312-318: tabela item_groups, seeded |

Pokrycie: **15/15 (100%)**

### 3.3 Warehouse (3.1-3.8)

| Pozycja | Opis | Pokryta? | Gdzie w M03 PRD |
|---------|------|----------|-----------------|
| 3.1 | TO header+lines, multi-status | TAK | E05-J Phase 2, s. 543-544: state machine ADR-019 |
| 3.2 | CW na TO lines | TAK | E05-J, s. 546: cw_transfer_qty na transfer_order_lines |
| 3.3 | GRN validation (qty vs PO, tolerance) | TAK | E05-B Phase 1, s. 300-306, D6: full spec |
| 3.4 | Stock status dimension | TAK | E05-B, D5, s. 142-147: Available/QC Hold/Blocked/Expired |
| 3.5 | Put-away rules | TAK | E05-M Phase 2, s. 569-571: tabela putaway_rules |
| 3.6 | Load concept | TAK | E05-N Phase 2, s. 574-577: tabela loads |
| 3.7 | GS1-128 scanning na GRN | TAK | E05-B Phase 1, s. 309: barcode-parser-service.ts |
| 3.8 | Ship/receipt dates na transferach | TAK | E05-J, s. 548: ship_date, expected/actual_receipt_date |

Pokrycie: **8/8 (100%)**

### 3.4 Planning (4.1-4.3)

| Pozycja | Opis | Pokryta? | Gdzie w M04 PRD |
|---------|------|----------|-----------------|
| 4.1 | PO smart defaults z supplier master | TAK | E04-1 FR-PLAN-005, s. 243-245, D11: auto-fill currency, tax, price |
| 4.2 | planning_priority na WO | TAK (jako priority) | E04-3, s. 341: priority (low/normal/high/critical) na WO. Notatka w changelog: "planning_priority usuniety (duplikat priority)" |
| 4.3 | Release to warehouse action on WO | TAK | E04-3 FR-PLAN-026, s. 383-389, D12: flaga released_to_warehouse |

Pokrycie: **3/3 (100%)**

### 3.5 Production (5.1-5.15)

| Pozycja | Opis | Pokryta? | Gdzie w M06 PRD |
|---------|------|----------|-----------------|
| 5.1 | Waste categories tracking | TAK | M06-E5, PR-BE-040/041/044, s. 423-428: Phase 1 |
| 5.2 | Weight-based yield (wgt_consumed vs wgt_made) | TAK | M06-E5, PR-BE-042, D9, s. 425-426: Phase 1 |
| 5.3 | meat_yield_pct / product-specific yield | TAK | M06-E7, PR-BE-060, s. 484: Phase 2 |
| 5.4 | target_yield per product | TAK | M06-E7, PR-BE-061, s. 485: Phase 2 |
| 5.5 | rework_batch flag | TAK | M06-E10, PR-BE-090, s. 537: Phase 2 |
| 5.6 | LP-level consumption tracking | TAK | M06-E5, PR-BE-043, s. 426: Phase 1 |
| 5.7 | Co-product output tracking | TAK | M06-E8, PR-BE-070, s. 501: Phase 2 |
| 5.8 | Route per product-line | TAK | M06-E8, PR-BE-071, s. 502: Phase 2 |
| 5.9 | Route versioning + approval | TAK | M06-E8, PR-BE-072, s. 503: Phase 2 |
| 5.10 | Consumption by item_group | TAK | M06-E10, PR-BE-091, s. 538: Phase 2 |
| 5.11 | CW qty fields on batch order | TAK | M06-E10, PR-BE-092, s. 539: Phase 2 |
| 5.12 | Downtime: People/Process/Plant + minutes | TAK | M06-E6, PR-BE-050/051/052, D10, s. 453-456: Phase 1 |
| 5.13 | Shift concept AM/PM | TAK | M06-E6, PR-BE-053/054, D11, s. 457-458: Phase 1 |
| 5.14 | Hourly efficiency tracking | TAK | M06-E10, PR-BE-093, s. 540: Phase 2 |
| 5.15 | QC holds from production | TAK | M06-E7, PR-BE-062, s. 486: Phase 2 |

Pokrycie: **15/15 (100%)**

### 3.6 Quality (6.1-6.3)

| Pozycja | Opis | Pokryta? | Gdzie w M08 PRD |
|---------|------|----------|-----------------|
| 6.1 | QC Hold tracking linked to production batch | TAK | Epic 8A, D11, s. 243, 422: Phase 1 MVP, reference_type='wo' |
| 6.2 | Yield issue tracking | TAK | Epic 8L, D12, s. 414, 423: Phase 2, NCR z ncr_type='yield_issue' |
| 6.3 | Accident/near miss reporting | TAK | Epic 8L, D13, s. 415, 424: Phase 2, osobna tabela quality_incidents |

Pokrycie: **3/3 (100%)**

### 3.7 Shipping (7.1-7.6)

| Pozycja | Opis | Pokryta? | Gdzie w M07 PRD |
|---------|------|----------|-----------------|
| 7.1 | CW quantity na SO lines | TAK | Sekcja 4.2 (Phase 2), E07.7, tabela z kolumnami cw_quantity, cw_unit |
| 7.2 | pack_quantity na SO lines | TAK | Sekcja 4.2 (Phase 2), E07.7, tabela z kolumna pack_quantity |
| 7.3 | Delivery address per order (ship-to) | TAK | Sekcja 4.1 (Phase 1 Must Have), E07.2, shipping_address_id NOT NULL |
| 7.4 | mode_of_delivery | TAK | Sekcja 4.2 (Phase 2), E07.7, enum road/rail/air/sea/courier |
| 7.5 | Order charges | TAK | Sekcja 4.2 (Phase 2), E07.7, order_charges JSONB |
| 7.6 | delivery_type (Stock vs Direct) | TAK | Sekcja 4.2 (Phase 2), E07.7, delivery_type enum |

Pokrycie: **6/6 (100%)**

### 3.8 Finance (8.1-8.3)

| Pozycja | Opis | Pokryta? | Gdzie w M10 PRD |
|---------|------|----------|-----------------|
| 8.1 | Variance GBP tracking | TAK | E10.7 (Phase 2), D-FIN-2 |
| 8.2 | Savings calculator | TAK | E10.8 (Phase 2), D-FIN-10 |
| 8.3 | cost_per_kg analysis | TAK | E10.2 (Phase 1), D-FIN-9 |

Pokrycie: **3/3 (100%)**

### 3.9 OEE (9.1-9.4)

| Pozycja | Opis | Pokryta? | Gdzie w M12 PRD |
|---------|------|----------|-----------------|
| 9.1 | Downtime categories z produkcji | TAK | E12.5 (Phase 1), D-OEE-3 |
| 9.2 | Efficiency % per linia/godzina | TAK | E12.3 (Phase 1), D-OEE-7 |
| 9.3 | slow_running_pct, stops_pct | TAK | E12.11 (Phase 2), D-OEE-8 |
| 9.4 | engineering downtime % | TAK | E12.11 (Phase 2), D-OEE-9 |

Pokrycie: **4/4 (100%)**

### 3.10 Reporting (10.1-10.10)

| Pozycja | Opis | Pokryta? | Gdzie w M15 PRD |
|---------|------|----------|-----------------|
| 10.1 | Factory Overview Dashboard | TAK | M15-E1, RPT-001 do RPT-005 |
| 10.2 | Yield by Line analysis | TAK | M15-E1, RPT-010 do RPT-016 |
| 10.3 | Yield by SKU drill-down | TAK | M15-E1, RPT-020 do RPT-023 |
| 10.4 | Giveaway Analysis Dashboard | TAK | M15-E3, RPT-040 do RPT-044 |
| 10.5 | Leader Scorecard (A/B/C/D) | TAK | M15-E3, RPT-050 do RPT-054 |
| 10.6 | Supervisor Team Comparison | TAK | M15-E4, RPT-080 do RPT-084 |
| 10.7 | Period Reports 4-4-5 | TAK | M15-E4, RPT-090 do RPT-096 |
| 10.8 | Daily Issues Analysis | TAK | M15-E3, RPT-060 do RPT-065 |
| 10.9 | Shift Performance Overview | TAK | M15-E3, RPT-070 do RPT-076 |
| 10.10 | Multi-granularity time selection | TAK | M15-E4, RPT-100 do RPT-104 |

Pokrycie: **10/10 (100%)**

### 3.11 Multi-Site (11.1-11.3)

| Pozycja | Opis | Pokryta? | Gdzie w M11 PRD |
|---------|------|----------|-----------------|
| 11.1 | TO jako most miedzyzakladowy | TAK | E11.2, D-MS-3 |
| 11.2 | Multi-company support (FORZ+KOBE) | TAK | E11.1, D-MS-1 |
| 11.3 | Site-level filtering na raportach | TAK | E11.4, site filter |

Pokrycie: **3/3 (100%)**

### 3.12 Moduly bez pozycji w UPDATE-LIST

M05 Scanner, M09 NPD, M13 Integrations i M14 Maintenance nie maja dedykowanych pozycji w PRD-UPDATE-LIST. To jest poprawne -- M05/M09 nie byly czescia analizy D365/Raporting, M13/M14 sa nowymi modulami.

### Podsumowanie pokrycia

| Modul | Pozycje | Pokryte | % |
|-------|---------|---------|---|
| Settings | 7 | 7 | 100% |
| Technical | 15 | 15 | 100% |
| Warehouse | 8 | 8 | 100% |
| Planning | 3 | 3 | 100% |
| Production | 15 | 15 | 100% |
| Quality | 3 | 3 | 100% |
| Shipping | 6 | 6 | 100% |
| Finance | 3 | 3 | 100% |
| OEE | 4 | 4 | 100% |
| Reporting | 10 | 10 | 100% |
| Multi-Site | 3 | 3 | 100% |
| **TOTAL** | **77** | **77** | **100%** |

---

## 4. Backend-first

| PRD | Backend-first? | Kolejnosc w Requirements | Uwagi |
|-----|----------------|-------------------------|-------|
| M01 | TAK | Kazdy epik: tabele DB -> API Endpoints -> Validation (Zod) -> Frontend/UX | Wzorcowe |
| M02 | TAK | Kazdy epik: Backend (tabele, walidacje, API) -> Frontend/UX | Wzorcowe |
| M03 | TAK | Kazdy epik: Backend (tabele, API, serwisy, walidacje Zod) -> Frontend/UX | Wzorcowe, najpelniejsze |
| M04 | TAK | Kazdy epik: Backend (FR-PLAN, tabele) -> Frontend/UX | Wzorcowe |
| M05 | TAK | Kazdy epik: Backend (SC-BE-*) -> Frontend/UX (SC-FE-*) -> Integracje | Wzorcowe, numerowane ID |
| M06 | TAK | Kazdy epik: Backend (PR-BE-*) -> Frontend/UX (PR-FE-*) -> Integracje | Wzorcowe, numerowane ID |
| M07 | TAK | Kazdy epik: tabele DB -> API -> Validation -> Frontend/UX | Wzorcowe |
| M08 | TAK | Kazdy epik: Backend (DB, API, Zod, Service) -> Frontend/UX | Wzorcowe |
| M09 | TAK | Kazdy story: Backend -> Frontend/UX -> Integracje | Wzorcowe, per-story layout |
| M10 | TAK | Kazdy epik: tabele DB -> API -> Validation -> Frontend/UX | Wzorcowe |
| M11 | TAK | Kazdy epik: Backend -> API -> Validation -> Frontend/UX | Wzorcowe |
| M12 | TAK | Kazdy epik: tabele DB -> API -> Validation -> Frontend/UX | Wzorcowe |
| M13 | TAK | Kazdy epik: tabele DB -> API -> Validation -> Frontend/UX | Wzorcowe |
| M14 | TAK | Kazdy epik: tabele DB -> API -> Validation -> Frontend/UX | Wzorcowe |
| M15 | TAK | Kazdy epik: MV/tabele DB -> API -> Validation -> Frontend/UX | Wzorcowe |

Wszystkie PRD konsekwentnie stosuja kolejnosc: Backend (DB, tabele) -> API Endpoints -> Zod Validation -> Frontend/UX -> Integracje.

---

## 5. Cross-module spojnosc

### 5.1 Odwolania miedzymodulowe

| Relacja | Oczekiwana | Zrealizowana? | Uwagi |
|---------|-----------|---------------|-------|
| Settings -> Technical (alergeny) | M01 definiuje allergens, M02 konsumuje | TAK | D-SET-8 alergeny globalne, M02 product_allergens |
| Technical -> Warehouse (CW, shelf life) | M02 definiuje, M03 czyta | TAK | M03 E05-L references is_catch_weight, shelf_life_days |
| Technical -> Planning (lead_time, moq) | M02 definiuje, M04 czyta | TAK | ADR-010 lead_time per product, M04 D10 |
| Planning -> Warehouse (PO, TO) | M04 tworzy PO/TO, M03 realizuje GRN | TAK | M03 E05-B GRN from PO, M04 FR-PLAN-012 TO |
| Planning -> Production (WO) | M04 tworzy WO, M06 wykonuje | TAK | M04 E04-3, M06 E1 WO execution |
| Production -> Warehouse (LP consume) | M06 konsumuje LP, M03 aktualizuje | TAK | M06 D2 LP-based consumption, M03 LP status |
| Production -> Quality (QC holds) | M06 tworzy QC holds, M08 zarzadza | TAK | M06-E7 [5.15], M08 D11 [6.1] |
| Production -> Scanner (consume/output) | M06 dostarcza serwisy, M05 UX | TAK | M06 D3, M05 E4 consume/output |
| Quality -> Warehouse (LP QA status) | M08 zmienia QA, M03 gating | TAK | M08 D1, M03 D4 QA Status Gating |
| Quality -> Shipping (QA gating) | M08 qa_status, M07 allocation | TAK | M08 D1 only passed->allocation |
| NPD -> Technical (handoff Product+BOM) | M09 tworzy product/BOM, M02 tabele | TAK | M09 09.12 handoff formulation->BOM |
| NPD -> Planning (pilot WO) | M09 tworzy pilot WO | TAK | M09 09.13 handoff pilot WO |
| OEE -> Production downtime | M12 czyta downtime z M06 | TAK | D-OEE-2: synchronizacja M06->M12 |
| Finance -> Production cost | M10 czyta WO, consumption z M06 | TAK | E10.4: work_order_costs |
| Finance -> Warehouse inventory | M10 czyta LP/stock z M03 | TAK | E10.5: inventory_cost_layers |
| Reporting -> Production data | M15 czyta wo_outputs z M06 | TAK | M15-DP: MV z wo_outputs |
| Reporting -> Quality data | M15 czyta quality_holds z M08 | TAK | M15-E2: mv_qc_holds_summary |
| Maintenance -> OEE (MTBF/MTTR) | M14 czyta z M12 | TAK | D-MNT-3 |
| Multi-Site -> Warehouse (TO) | M11 rozszerza transfer_orders | TAK | E11.2: from_site_id, to_site_id |
| Integrations -> Finance (Comarch) | M13 eksport danych M10 | TAK | E13.7/E13.10 |
| Scanner -> Warehouse (receive, move) | M05 uzywa serwisow M03 | TAK | M05-E2 |

### 5.2 RLS/org_id

| PRD | org_id wspomniane? | Explicite w Constraints? | Explicite w Decisions? | RLS policy wzorzec? |
|-----|---------------------|-------------------------|----------------------|---------------------|
| M00 | TAK | TAK (sek.5) | TAK (D3) | TAK (SQL przyklad) |
| M01 | TAK | TAK (sek.5) | TAK (D-SET-1) | TAK |
| M02 | TAK | TAK (sek.5) | TAK (D4) | TAK (SQL przyklad) |
| M03 | TAK | TAK (sek.5) | TAK (D7) | TAK (SQL przyklad) |
| M04 | TAK | TAK (sek.5) | TAK (D5) | TAK |
| M05 | TAK | TAK (sek.5) | TAK (D6 API routes) | TAK |
| M06 | TAK | TAK (sek.5) | N/A (ADR ref) | TAK |
| M07 | TAK | TAK (sek.5) | TAK (D-SHP-7) | TAK |
| M08 | TAK | TAK (sek.5) | TAK (D10) | TAK |
| M09 | TAK | TAK (sek.5) | TAK (D-NPD-11) | TAK |
| M10 | TAK | TAK (sek.5) | TAK (D-FIN-7) | TAK |
| M11 | TAK | TAK (sek.5) | TAK (D-MS-1, D-MS-2) | TAK (wzorzec SQL) |
| M12 | TAK | TAK (sek.5) | TAK (D-OEE-6) | TAK |
| M13 | TAK | TAK (sek.5) | TAK (D-INT-7) | TAK |
| M14 | TAK | TAK (sek.5) | TAK (D-MNT-8) | TAK |
| M15 | TAK | TAK (sek.5) | N/A (MV w service layer) | TAK (service layer filtr) |

### 5.3 site_id NULL

| PRD | site_id wspomniane? | Gdzie? |
|-----|---------------------|--------|
| M00 | TAK | Sek. 6 (D12): "site_id UUID NULL na WSZYSTKICH tabelach" |
| M01 | TAK | D-SET-12: explicite, retroaktywna migracja |
| M02 | TAK | Sek. 5: "site_id opcjonalny na tabelach" |
| M03 | TAK | Sek. 5: "site_id — przygotowanie na Multi-Site (M11)" |
| M04 | TAK | Sek. 5: "site_id NULL" |
| M05 | TAK | site_id + device_type + scan_method dodane do scanner_audit_log w M05 v1.2 |
| M06 | TAK | site_id dodane do tabel Phase 1 w M06 v3.1 |
| M07 | TAK | Sekcja 5 Constraints: "site_id NULL na tabelach" |
| M08 | TAK | Sek. 5: "site_id NULL" na tabelach |
| M09 | TAK | site_id UUID NULL dodane do wszystkich 16 tabel w M09 v1.1 |
| M10 | TAK | Sekcja 5 |
| M11 | TAK | Core feature |
| M12 | TAK | D-OEE-10 |
| M13 | TAK | D-INT-10 |
| M14 | TAK | D-MNT-8 |
| M15 | TAK | site_id dodane do wszystkich tabel/MV M15 w M15 v1.1 |

### 5.4 LP model (ADR-001)

| PRD | LP model spójny? | Uwagi |
|-----|-------------------|-------|
| M03 Warehouse | TAK | Pełna definicja LP lifecycle, genealogy |
| M04 Planning | TAK | Hard lock rezerwacje LP |
| M05 Scanner | TAK | Scan LP -> consume/output/move |
| M06 Production | TAK | LP-based consumption obowiązkowe, genealogy linking |
| M07 Shipping | TAK | LP-based picking, qa_status gating |
| M08 Quality | TAK | QA status per LP, 7 statusów |
| M09 NPD | N/A | NPD nie operuje na LP bezposrednio |

### 5.5 BOM snapshot (ADR-002)

| PRD | BOM snapshot spójny? | Uwagi |
|-----|----------------------|-------|
| M02 Technical | TAK | Definicja wzorca, effective dates |
| M04 Planning | TAK | D3: skalowanie, immutability po release |
| M06 Production | TAK | D1: WO self-contained, re-copy przed startem |
| M09 NPD | TAK | 09.12: formulation -> BOM -> WO snapshot |

### 5.6 WO state machine (ADR-007)

| PRD | Stany WO | Spójne z Foundation? | Uwagi |
|-----|----------|---------------------|-------|
| Foundation | DRAFT->RELEASED->IN_PROGRESS->COMPLETED (+CANCELLED) | Zrodlo | |
| M04 Planning | DRAFT->RELEASED->IN_PROGRESS->ON_HOLD<->IN_PROGRESS->COMPLETED->CLOSED (+CANCELLED) | TAK (rozszerzony) | Dodane ON_HOLD i CLOSED |
| M06 Production | DRAFT->RELEASED->IN_PROGRESS->ON_HOLD<->IN_PROGRESS->COMPLETED (+CANCELLED) | TAK | Ujednolicone do ON_HOLD w M06 v3.1 |

**Uwaga MEDIUM-NEW-2**: ~~M04 uzywa nazwy ON_HOLD a M06 uzywa PAUSED dla tego samego konceptu.~~ RESOLVED w M06 v3.1: ujednolicono do ON_HOLD we wszystkich PRD (M04 i M06). PAUSED usuniete.

---

## 6. Braki i niejasnosci

### M00 Foundation

Brak istotnych brakow. Foundation PRD jest kompletnym dokumentem zrodlowym z 16 modulami, 18 ADR i 77+ wymaganiami.

### M01 Settings

1. **LOW-NEW-3**: D-SET-9 (Waste categories) definiuje tabele i domyslne kategorie, ale M06 Production E5 tez definiuje `waste_categories`. Ownership niejednoznaczny -- M01 definiuje konfiguracje, M06 konsumuje. PRD M01 mowi "Dependency: M06 Production (wo_waste references waste_categories)" co jest poprawne, ale tabela powinna byc zdefiniowana w jednym miejscu.

2. **LOW-NEW-4**: D-SET-10 (Fiscal calendar) mowi o tabeli `fiscal_calendar`, ale Foundation mowi o polu `fiscal_calendar_type` w `organization_settings`. Oba sa w M01 -- spójne wewnetrznie.

### M02 Technical

3. **LOW-NEW-5**: Brak wzmianki o `cost_per_kg` jako osobnym polu -- M02 ma `cost_per_unit` i `default_purchase_price`, ale [1.7] z UPDATE-LIST mowi o `cost_per_kg`. Foundation (linia 171) mowi: "cost_per_kg: pole per produkt w products (M02)". M02 powinien explicite definiowac `products.cost_per_kg` w tabeli E02.1, a nie tylko odnosic sie do istniejacego `cost_per_unit`.

4. **MEDIUM-NEW-3**: M02 E02.1 definiuje `item_group_id UUID FK item_groups` jako nullable, ale KPI w sekcji 9 mowi "% produktow z item_group = 100%". Sprzecznosc -- jesli ma byc 100% pokrycia, pole powinno byc NOT NULL (po migracji). PRD adresuje to czesciowo ("Migration z DEFAULT; UI wymuszenie przy edycji") ale brak jasnej decyzji NOT NULL vs nullable.

### M03 Warehouse

5. **LOW-NEW-6**: M03 uzywa numeracji epikow "E05-A" do "E05-Q" zamiast "M03-E1" do "M03-Exx". To jest legacy z poprzedniej numeracji (Epic 05 = Warehouse). Nie blokuje ale wprowadza niespojnosc z innymi PRD (M01 uzywa E01.1, M02 uzywa E02.1 itd.).

6. **MEDIUM-NEW-4**: M03 definiuje dlugi PRD (810 linii) z bardzo szczegolowymi specyfikacjami. Sekcja "Decyzje doprecyzowane" (14 decyzji) na koncu dokumentu powinna byc zintegrowana z sekcja 6 (Decisions) dla spojnosci.

### M04 Planning

7. **LOW-NEW-7**: M04 D8 mowi ze TO = "transfer miedzy magazynami w jednym site". Ale M03 E05-J tez definiuje TO header+lines (Phase 2). Ownership TO jest rozdzielony miedzy M04 (definicja, state machine) i M03 (fizyczna realizacja). To jest poprawne architektonicznie, ale moze powodowac zamieszanie u developerow.

8. **LOW-NEW-8**: M04 PRD nie definiuje tabeli `planning_settings` szczegolowo (kolumny) -- mowi tylko "15+ settings" z ogolnym opisem. M06 Production definiuje swoje `production_settings` z pelna lista. M04 powinien miec analogiczna liste.

### M05 Scanner

9. **MEDIUM-NEW-5**: M05 definiuje `scanner_audit_log` jako osobna tabele od `audit_log` (ADR-008). To jest uzasadnione wolumenem, ale Foundation ADR-008 nie wymienia tej tabeli. ADR-008 powinien byc zaktualizowany o wzmiank o scanner_audit_log jako wyjatku.

10. **LOW-NEW-9**: M05 E3 "Production Pick" mowi "Phase 1 = pick TYLKO dla WO", a SO pick po M07. Ale M05-E3b (SO pick) nie ma jasnego Phase assignment -- jest to "rozszerzenie po M07" co moze byc Phase 1 lub Phase 2.

### M06 Production

11. **MEDIUM-NEW-6**: M06 ma sekcje 13 (Pytania doprecyzowujace) z 12 nierozstrzygniętymi pytaniami. Pytania 1-7 (biznesowe) i 8-12 (techniczne) powinny zostac rozstrzygniete PRZED rozpoczeciem implementacji. Np.:
    - Pytanie 7: auto-complete WO trigger -- brak decyzji czy tolerance %
    - Pytanie 10: shift auto-detection -- brak decyzji co jesli timestamp poza shiftami
    - Pytanie 11: dashboard cache -- 30s TTL vs event-driven

12. **LOW-NEW-10**: M06 D4 (WO State Machine) uzywa stanu "PAUSED" ale ADR-007 i M04 uzywaja "ON_HOLD". Nalezy ujednolicic nazewnictwo.

### M07 Shipping

13. **LOW-4 (z poprzedniego raportu)**: Brak wzmianki o `default_sell_price` na tabeli `products`. Powinien byc cross-reference do M02.

14. **LOW-5 (z poprzedniego raportu)**: Wave picking w Phase 1 jako "basic" -- brak precyzyjnej definicji.

### M08 Quality

15. **MEDIUM-NEW-7**: M08 definiuje 7 statusow QA (PENDING, PASSED, FAILED, HOLD, RELEASED, QUARANTINED, COND_APPROVED), ale M03 Warehouse E05-A definiuje 4 statusy QA (pending, passed, failed, quarantine). Roznica: M08 dodaje HOLD, RELEASED, COND_APPROVED. Nalezy upewnic sie ze M03 jest zaktualizowane o pelna liste 7 statusow.

16. **LOW-NEW-11**: M08 D2 mowi "LP po produkcji wychodzą jako AVAILABLE, NIE jako PENDING". Ale M03 D5 (Stock Status) mowi "QC Hold = qa_status='pending'" co sugeruje ze pending LP sa w QC Hold. Te decyzje nie sa sprzeczne (pending dotyczy incoming, nie production), ale brak jasnego rozgraniczenia moze mylic.

### M09 NPD

17. **MEDIUM-NEW-8**: M09 definiuje wlasne 6 rol NPD (NPD_LEAD, R&D, FINANCE, REGULATORY, PRODUCTION, ADMIN) ale Foundation ADR-012 definiuje 10 rol systemowych. M09 nie wyjasnia jak 6 rol NPD mapuje sie na 10 rol systemowych. Czy to osobny system uprawnien? Czy NPD_LEAD = production_manager? Nalezy explicite zmapowac.

18. **LOW-NEW-12**: M09 story references uzywaja numeracji "08.x" (np. 08.1.npd-settings-module-config.md) ale PRD mowi o "09.x" stories. To legacy numeracja z folderu epics -- numer w PRD (09.x) jest poprawny, ale sciezki plikow uzywaja 08.x.

### M10 Finance

19. **LOW-6 (z poprzedniego raportu)**: Ownership pola `products.cost_per_kg` niejasny -- M02 definiuje, M10 czyta.

### M11 Multi-Site

20. **LOW-NEW-13 (z poprzedniego raportu punkt 5)**: Brak jasnej decyzji czy `production_shifts` sa site-specific od poczatku.

### M12 OEE

21. **LOW-7 (z poprzedniego raportu)**: `oee_shift_metrics` referencowane w M14 ale NIE zdefiniowane w M12 PRD.

### M14 Maintenance

22. **LOW-8 (z poprzedniego raportu)**: PRD referencuje `oee_shift_metrics` -- ta tabela nie istnieje w M12 PRD.

### M15 Reporting

23. **LOW-9 (z poprzedniego raportu)**: Brak explicite site_id NULL na tabelach M15.
24. **LOW-6 (z poprzedniego raportu)**: Brak explicite sciezek plikow PRD upstream.

---

## 7. Jakosc tresci (DEEP)

### 7.1 M00 Foundation

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | 77 pozycji PRD-UPDATE-LIST z priorytetami HIGH/MEDIUM |
| Epiki z jasnym scope | PASS | 16 modulow z jasnym podzialem i build order |
| KPI mierzalne | PASS | 11 metryk z celami i metodami pomiaru |
| Ryzyka z mitygacjami | PASS | 16 ryzyk z prawdop./wplyw/mitygacja |
| Success criteria weryfikowalne | PASS | 3 kategorie (funkcjonalne, niefunkcjonalne, biznesowe) z checklistami |

### 7.2 M01 Settings

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | 106 wymagan FR-SET-xxx, tabele z kolumnami, API endpoints |
| Epiki z jasnym scope | PASS | 8 epikow (5 MVP + 2 Phase 2 + 1 Phase 3), jasne granice |
| KPI mierzalne | PASS | 6 operacyjnych + 5 wydajnosciowych + 3 Phase 2, z celami |
| Ryzyka z mitygacjami | PASS | 8 ryzyk + 5 tech debt z mitygacjami |
| Success criteria weryfikowalne | PASS | 14 funkcjonalnych + 5 niefunkcjonalnych + 3 biznesowych |

### 7.3 M02 Technical

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | Pelne specyfikacje kolumn z typami, API endpointy, reguly biznesowe |
| Epiki z jasnym scope | PASS | 8 epikow z jasnymi zaleznosami |
| KPI mierzalne | PASS | 9 funkcjonalnych + 6 wydajnosciowych + 6 jakosciowych |
| Ryzyka z mitygacjami | PASS | 11 ryzyk z mitygacjami, tech debt |
| Success criteria weryfikowalne | PASS | 13 funkcjonalnych + 5 niefunkcjonalnych + 4 regulacyjne |

**Dodatkowa jakosc**: M02 ma sekcje "Wyjasnione decyzje" (Q&A) z 11 pytaniami/odpowiedziami -- wzorcowe.

### 7.4 M03 Warehouse

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | 30 FR + pelne specyfikacje tabel (25+ kolumn LP), SQL query FIFO/FEFO |
| Epiki z jasnym scope | PASS | 17 epikow (8 Phase 1 + 9 Phase 2) |
| KPI mierzalne | PASS | 3 kategorie (operations, health, system) z celami |
| Ryzyka z mitygacjami | PASS | 11 ryzyk z mitygacjami |
| Success criteria weryfikowalne | PASS | 15 funkcjonalnych + 9 niefunkcjonalnych + 3 biznesowych |

**Dodatkowa jakosc**: M03 ma 14 "Decyzji doprecyzowanych" -- najbardziej szczegolowy PRD ze wszystkich. Wzorcowe pokrycie edge cases (LP merge, concurrent locking, under-receipt).

### 7.5 M04 Planning

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | 29+ FR-PLAN-xxx, pelne state machines, guards |
| Epiki z jasnym scope | PASS | 6 epikow (4 Phase 1 + 1 Phase 2 + 1 Phase 3) |
| KPI mierzalne | PASS | 9 operacyjnych + 4 systemowych |
| Ryzyka z mitygacjami | PASS | 8 ryzyk |
| Success criteria weryfikowalne | PASS | 15 funkcjonalnych + 4 niefunkcjonalnych + 4 integracyjne |

**Dodatkowa jakosc**: M04 ma 12 Decisions (D1-D12) z jasnymi uzasadnieniami. Wzorcowa sekcja Changelog na koncu PRD.

### 7.6 M05 Scanner

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | ~60 wymagan z numeracją SC-BE/SC-FE, szczegolowe flow charts |
| Epiki z jasnym scope | PASS | 12 epikow (5+E3b Phase 1, 7 Phase 2), inkrementalna budowa |
| KPI mierzalne | PASS | 4 kategorie (operacyjne, modulowe, UX, system) |
| Ryzyka z mitygacjami | PASS | 8 Phase 1 + 5 Phase 2 ryzyk |
| Success criteria weryfikowalne | PASS | 12 funkcjonalnych + 7 niefunkcjonalnych + 4 hardware |

**Dodatkowa jakosc**: M05 ma najlepiej zdefiniowane wymagania UX ze wszystkich PRD -- feedback patterns (audio/haptic/visual), touch target sizes, device detection. 8 gap items z ANALYSIS.md tez uwzglednione.

### 7.7 M06 Production

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | ~80 wymagan PR-BE/PR-FE z numeracja, ustandaryzowane error codes |
| Epiki z jasnym scope | PASS | 10 epikow (6 Phase 1 + 4 Phase 2) |
| KPI mierzalne | PASS | 3 kategorie (produkcja, OEE, efektywnosc, system) |
| Ryzyka z mitygacjami | PASS | 8 Phase 1 + 5 Phase 2 ryzyk |
| Success criteria weryfikowalne | PASS | 16 funkcjonalnych + 7 niefunkcjonalnych + 4 integracyjne + 11 Phase 2 |

**Uwaga**: M06 ma 12 nierozstrzygniętych pytan (sekcja 13). Te powinny byc rozstrzygniete przed implementacja, ale nie blokuja review PRD.

### 7.8 M08 Quality

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | 26 FR-QA-xxx, 12 epikow, 30 tabel DB, pelna specyfikacja |
| Epiki z jasnym scope | PASS | 12 epikow (5 MVP + 7 Phase 2), jasny effort estimate per epik |
| KPI mierzalne | PASS | 6 Phase 1 + 7 Phase 2 KPI z targetami |
| Ryzyka z mitygacjami | PASS | 10 ryzyk z mitygacjami |
| Success criteria weryfikowalne | PASS | 11 funkcjonalnych + 6 niefunkcjonalnych + 5 biznesowych |

**Dodatkowa jakosc**: M08 ma 14 Decisions (D1-D14) z jasnymi uzasadnieniami + 17-punktowa checklista kluczowych regul. 5 "Rozstrzygniętych pytan" na koncu PRD.

### 7.9 M09 NPD

| Kryterium | Ocena | Uzasadnienie |
|-----------|-------|-------------|
| Wymagania jednoznaczne i testowalne | PASS | 18 stories z rozmiarami (S/M/L), effort estimates, pelne specyfikacje tabel+API+UX per story |
| Epiki z jasnym scope | PASS | 3 fazy (8+7+3 stories), jasne zaleznosci (HARD/SOFT) |
| KPI mierzalne | PASS | 14 performance + 6 business KPI z targetami |
| Ryzyka z mitygacjami | PASS | 12 ryzyk z mitygacjami |
| Success criteria weryfikowalne | PASS | 4 fazy (Phase 1/2/3 + cross-cutting) z checklistami |

**Dodatkowa jakosc**: M09 jest najbardziej szczegolowym PRD -- kazdy story ma pelna specyfikacje Backend+Frontend+Integracje+Compliance. Trigger'y PG, funkcje, indeksy DB zdefiniowane inline. Jedyny PRD z effort estimates per story.

---

## Rekomendacje

Priorytet: HIGH / MEDIUM / LOW

### HIGH (0 items)

Brak. Wszystkie PRD sa poprawne w kluczowych aspektach.

### MEDIUM (8 items — 8/8 RESOLVED ✅)

1. **REC-M1** ✅ RESOLVED: Foundation PRD zaktualizowany w M00 v2.3 — EDI EDIFACT (ORDERS, DESADV, INVOIC) na linii 88.

2. **REC-M2** ✅ RESOLVED: `oee_shift_metrics` w pelni zdefiniowana w M12 OEE (14 kolumn). M14 Maintenance ma cross-reference "read-only z M12".

3. **REC-M3** ✅ RESOLVED: M02 v3.2 — ownership blockquote dodany: M02 Technical OWNS `default_purchase_price`, M10 Finance reads only. `cost_per_kg` zastapione przez `default_purchase_price` per UOM.

4. **REC-M4** ✅ RESOLVED: M09 v1.1 — `site_id UUID NULL` dodane do wszystkich 16 tabel NPD z wzorcem migracji.

5. **REC-M5** ✅ RESOLVED: M06 v3.1 — PAUSED→ON_HOLD ujednolicone (commit 4c56e2b7). M04 i M06 uzywaja ON_HOLD.

6. **REC-M6** ✅ RESOLVED: M03 v2.1 — juz mial 7 statusow QA w tabelach. Persona table rozszerzona o pelna liste (PENDING, PASSED, FAILED, HOLD, RELEASED, QUARANTINED, COND_APPROVED).

7. **REC-M7** ✅ RESOLVED: M09 v1.1 — 6 rol NPD zmapowanych na role systemowe: NPD_LEAD→production_manager, R&D→quality_manager+custom, FINANCE→finance_manager, REGULATORY→quality_manager, PRODUCTION→production_manager (read-only), ADMIN→admin.

8. **REC-M8** ✅ RESOLVED: M06 v3.1 — wszystkie 12 pytan rozstrzygnietych z konkretnymi odpowiedziami (sekcja 13 "Rozstrzygniete pytania"). Kluczowe: auto-complete = exact comparison, shift gaps = nearest shift + unassigned_shift flag, cache = Redis 30s Phase 1 → event-driven Phase 2.

### LOW (16 items — 16/16 RESOLVED ✅)

9. **REC-L1** ✅ RESOLVED: M15 — `site_id UUID NULL` dodane do wszystkich tabel i materialized views.

10. **REC-L2** ✅ RESOLVED (wczesniej): Foundation v2.2 — "Brytyjscy producenci". ZAMKNIETE.

11. **REC-L3** ✅ RESOLVED: M07 v3.1 — wave picking Phase 1 doprecyzowany: max 50 SO lines/wave, manual selection, FIFO/FEFO, brak auto-wave.

12. **REC-L4** ✅ RESOLVED: M07 v3.1 — cross-reference `products.default_sell_price` z M02 Technical dodany.

13. **REC-L5** ✅ RESOLVED: M11 — production_shifts site-specific od poczatku dzieki `site_id UUID NULL`.

14. **REC-L6** ✅ RESOLVED: M15 — sciezki plikow PRD upstream dodane w sekcji References.

15. **REC-L7** ✅ RESOLVED: M03 v2.1 — numeracja E05-A..Q → M03-E01..E17 (17 epikow przenumerowanych).

16. **REC-L8** ✅ RESOLVED: M03 v2.1 — 14 decyzji doprecyzowanych zintegrowanych z sekcja 6 jako D10-D23.

17. **REC-L9** ✅ RESOLVED: M01 v3.2 — ownership statement dodany: M01 Settings jest wlascicielem tabeli `waste_categories`. M06 Production referencuje przez FK.

18. **REC-L10** ✅ RESOLVED: M02 v3.2 — `default_purchase_price DECIMAL(15,4) NOT NULL DEFAULT 0.00` per UOM unit. Zastepuje `cost_per_kg` jako single source of truth. `item_group_id` zmieniony na NOT NULL.

19. **REC-L11** ✅ RESOLVED: M04 v3.2 — tabela `planning_settings` z 18 kolumnami (id, org_id, default_po_currency, po_auto_number, po_number_prefix, po_approval_required, po_approval_threshold, wo_auto_number, wo_number_prefix, to_auto_number, to_number_prefix, default_lead_time_days, enable_mrp, auto_create_wo_from_demand, default_wo_priority, site_id, created_at, updated_at).

20. **REC-L12** ✅ RESOLVED: M05 v1.2 — `site_id UUID NULL`, `device_type`, `scan_method` dodane do `scanner_audit_log`.

21. **REC-L13** ✅ RESOLVED: M06 v3.1 — `site_id UUID NULL` dodane do wszystkich tabel Phase 1 w sekcji 5.

22. **REC-L14** ✅ RESOLVED: M05 v1.2 — E3b przypisane do "Phase 1 (po dostarczeniu M07 Shipping)".

23. **REC-L15** ✅ RESOLVED: M09 v1.1 — mapping note dodany: story files 08.x (legacy) = 09.x w PRD.

24. **REC-L16** ✅ RESOLVED: M05 v1.2 — blok "Wyjatek od ADR-008" dodany z uzasadnieniem osobnej tabeli scanner_audit_log.

---

_Cross-Review PRD M00-M15 (FULL) zakonczony. 16/16 PRD PASS. 77/77 PRD-UPDATE-LIST items pokryte (100%). **24/24 rekomendacji RESOLVED** (0 HIGH, 8 MEDIUM ✅, 16 LOW ✅)._
_Reviewer: Claude Opus 4.6_
_Resolutions applied: 2026-02-18_
