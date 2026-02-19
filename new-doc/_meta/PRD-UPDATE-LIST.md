# PRD Update Master List
**Date**: 2026-02-16
**Sources**: D365 screenshots (31), Raporting module (25 stories), existing PRD analysis

---

## MODULE-BY-MODULE UPDATE LIST

### 1. SETTINGS (Epic 01)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 1.1 | Add multi-country VAT codes (POL-*, RC+/-, packing duty) | D365 VAT codes | HIGH |
| 1.2 | Add waste category configuration (fat, floor, giveaway + custom) | D365 production | HIGH |
| 1.3 | Add grade thresholds config (A/B/C/D for Yield%, GA%, Eff%) | Raporting 3.2 | MEDIUM |
| 1.4 | Add fiscal calendar config (4-4-5 period system, year start) | Raporting 1.2 | HIGH |
| 1.5 | Add target KPIs per line/product (yield%, GA%, efficiency%) | Raporting 2.1 | HIGH |
| 1.6 | Add disposition codes for returns (Accept/Reject/Quarantine/Scrap) | D365 warehouse | MEDIUM |
| 1.7 | Add cost per KG setting (for variance £ calculations) | Raporting 3.3 | MEDIUM |

### 2. TECHNICAL / PRODUCTS (Epic 02)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 2.1 | Add weight fields: net_weight, tare_weight, gross_weight | D365 product | HIGH |
| 2.2 | Add shelf life fields: shelf_life_days, best_before_days, shelf_advice_days | D365 product | HIGH |
| 2.3 | Add catch weight support: is_catch_weight, cw_unit, nominal/min/max_qty | D365 product | HIGH |
| 2.4 | Add yield_percent (expected) on product | D365 product | HIGH |
| 2.5 | Add preferred_supplier_id on product | D365 product purchase | HIGH |
| 2.6 | Add over/under_delivery_tolerance_pct | D365 product purchase | HIGH |
| 2.7 | Add default purchase price | D365 product purchase | MEDIUM |
| 2.8 | Add Formula/BOM versioning (version_id, active, approved flags) | D365 formula | HIGH |
| 2.9 | Add co-products table (formula → main product + co-products) | D365 co-products | HIGH |
| 2.10 | Add per BOM line: variable_scrap_pct | D365 formula | HIGH |
| 2.11 | Add per BOM line: flushing_principle (BACKFLUSH/MANUAL) | D365 formula audit | HIGH |
| 2.12 | Add per BOM line: priority (consumption order) | D365 formula | MEDIUM |
| 2.13 | Add per BOM line: valid_from/valid_to dates | D365 formula audit | MEDIUM |
| 2.14 | Add formula change audit trail | D365 formula audit (Power BI) | HIGH |
| 2.15 | Add item_group classification (RawMeat, Packaging, Consumables, FinGoods) | D365 production | HIGH |

### 3. WAREHOUSE (Epic 05)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 3.1 | Enrich Transfer Orders: header+lines model, multi-status flow | D365 transfer orders | HIGH |
| 3.2 | Add CW fields on transfer order lines (cw_transfer_qty) | D365 transfer orders | HIGH |
| 3.3 | Add GRN validation rules (qty vs PO matching, tolerance check) | D365 GRN | HIGH |
| 3.4 | Add stock status dimension (Available/QC Hold/Blocked/Expired) | D365 warehouse | HIGH |
| 3.5 | Add basic put-away rules (location directives simplified) | D365 warehouse setup | MEDIUM |
| 3.6 | Add Load concept (group multiple arrivals into one load) | D365 item arrival | MEDIUM |
| 3.7 | Add GS1-128 barcode scanning on GRN lines | D365 item arrival | HIGH |
| 3.8 | Add ship_date + receipt_date on transfers (in-transit tracking) | D365 transfer orders | MEDIUM |

### 4. PLANNING (Epic 03)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 4.1 | Simplify PO creation (smart defaults from supplier master) | D365 vs MonoPilot design | HIGH |
| 4.2 | Add planning_priority on work orders (numeric) | D365 batch order | MEDIUM |
| 4.3 | Add "release to warehouse" action on WO (triggers pick list) | D365 batch order | HIGH |

### 5. PRODUCTION (Epic 04)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 5.1 | Add waste categories tracking (fat, floor, giveaway per batch) | D365 job checker | HIGH |
| 5.2 | Add weight-based yield (wgt_consumed vs wgt_made, wgt_yield_pct) | D365 production overview | HIGH |
| 5.3 | Add meat_yield_pct / product-specific yield KPI | D365 job checker | HIGH |
| 5.4 | Add target_yield per product for comparison | D365 + Raporting | HIGH |
| 5.5 | Add rework_batch flag on work order | D365 batch order | MEDIUM |
| 5.6 | Add LP-level consumption tracking (which LP was consumed) | D365 consumption details | HIGH |
| 5.7 | Add co-product output tracking on batch order | D365 co-products | HIGH |
| 5.8 | Add route per product-line combination | D365 routes | HIGH |
| 5.9 | Add route versioning + approval workflow | D365 routes | MEDIUM |
| 5.10 | Add consumption by item_group breakdown (RawMeat/Packaging) | D365 job checker | MEDIUM |
| 5.11 | Add CW quantity fields on batch order | D365 batch order | HIGH |
| 5.12 | Add downtime tracking: 3 categories (People/Process/Plant) + minutes | Raporting 4.2 | HIGH |
| 5.13 | Add shift concept: AM/PM shifts with separate reporting | Raporting 4.1, 4.4 | HIGH |
| 5.14 | Add hourly efficiency tracking (per line, per hour) | Raporting 4.4 | MEDIUM |
| 5.15 | Add QC holds from production (line, code, boxes held/rejected) | Raporting 4.4 | HIGH |

### 6. QUALITY (Epic 06)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 6.1 | Add QC Hold tracking linked to production batch | Raporting 4.4 | HIGH |
| 6.2 | Add yield issue tracking (code, target vs actual, claim %, value) | Raporting 4.4 | HIGH |
| 6.3 | Add accident/near miss reporting | Raporting 4.4 | MEDIUM |

### 7. SHIPPING (Epic 07)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 7.1 | Add CW quantity on sales order lines | D365 sales order | HIGH |
| 7.2 | Add pack_quantity on SO lines | D365 sales order | HIGH |
| 7.3 | Add delivery address per order (ship-to) | D365 sales order | HIGH |
| 7.4 | Add mode_of_delivery field | D365 sales order | MEDIUM |
| 7.5 | Add order charges (delivery fee, surcharges) | D365 sales order | MEDIUM |
| 7.6 | Add delivery_type (Stock vs Direct) | D365 sales order | MEDIUM |

### 8. FINANCE (Epic 09)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 8.1 | Add variance £ tracking (yield variance in monetary terms) | Raporting 2.1 | HIGH |
| 8.2 | Add potential savings calculator (best vs actual yield × cost) | Raporting 3.3 | MEDIUM |
| 8.3 | Add cost_per_kg per product for financial yield analysis | Raporting all | HIGH |

### 9. OEE (Epic 10)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 9.1 | Integrate downtime categories (People/Process/Plant) from production | Raporting 4.2 | HIGH |
| 9.2 | Add efficiency % tracking per line per hour | Raporting 4.4 | HIGH |
| 9.3 | Add slow_running_pct, stops_pct metrics | Raporting 4.4 | MEDIUM |
| 9.4 | Add engineering downtime % | Raporting 4.4 | MEDIUM |

### 10. NEW: REPORTING MODULE (Epic 15 - NEW)
| # | What to Add | Source | Priority |
|---|------------|--------|----------|
| 10.1 | Factory Overview Dashboard (5 KPI cards + trend + variance) | Raporting 2.1 | HIGH |
| 10.2 | Yield by Line analysis (sortable table + inline trends) | Raporting 2.2 | HIGH |
| 10.3 | Yield by SKU drill-down (contribution %) | Raporting 2.3 | HIGH |
| 10.4 | Giveaway Analysis Dashboard | Raporting 3.1 | HIGH |
| 10.5 | Line Leader Performance Scorecard (A/B/C/D grading) | Raporting 3.2 | HIGH |
| 10.6 | Supervisor Team Comparison (savings calculator) | Raporting 3.3 | MEDIUM |
| 10.7 | Period Reports (4-4-5 fiscal, YoY comparison) | Raporting 3.5 | MEDIUM |
| 10.8 | Daily Issues Analysis (top 3 downtime issues) | Raporting 4.2 | HIGH |
| 10.9 | Shift Performance Overview (comprehensive daily dashboard) | Raporting 4.4 | HIGH |
| 10.10 | Multi-granularity time selection (Day/Week/Period/Year) | Raporting 7 | MEDIUM |

### 11. MULTI-SITE (Epic 11)
| # | What to Update | Source | Priority |
|---|---------------|--------|----------|
| 11.1 | Transfer orders as inter-site bridge | D365 transfer orders | HIGH |
| 11.2 | Multi-company support (FORZ + KOBE in D365) | D365 all screens | HIGH |
| 11.3 | Site-level filtering on all reports | D365 warehouse | HIGH |

---

## SUMMARY COUNTS

| Module | HIGH | MEDIUM | Total |
|--------|------|--------|-------|
| Settings | 3 | 4 | 7 |
| Technical/Products | 12 | 3 | 15 |
| Warehouse | 5 | 3 | 8 |
| Planning | 2 | 1 | 3 |
| Production | 11 | 4 | 15 |
| Quality | 2 | 1 | 3 |
| Shipping | 3 | 3 | 6 |
| Finance | 2 | 1 | 3 |
| OEE | 2 | 2 | 4 |
| Reporting (NEW) | 6 | 4 | 10 |
| Multi-Site | 3 | 0 | 3 |
| **TOTAL** | **51** | **26** | **77** |

---

## KEY METRICS TO TRACK (Master KPI List)

### Production KPIs
- Yield % (weight-based, weighted average)
- Giveaway % (GA - lower is better)
- Efficiency %
- KG Output / Cases / Packets
- Variance £ (yield variance in money)
- Meat Yield % (industry-specific)
- Downtime minutes (People/Process/Plant split)
- Slow Running %, Stops %

### Quality KPIs
- QC Holds (boxes held, rejected, labour hours)
- Yield Issues (target vs actual, claim value)
- Accidents / Near Misses

### People KPIs
- Leader Grade (A/B/C/D)
- Team Comparison (supervisor level)
- Staffing variance (+/-)

### Financial KPIs
- Cost per KG
- Variance £ (per line, per SKU)
- Potential Savings £ (vs best performer)

### Time Comparisons
- Week-over-Week (W/W)
- Period-over-Period (4-4-5)
- Year-over-Year (YoY)
- AM vs PM shift
- vs Target

---

## NEXT STEPS

1. User adds more screenshots (our MonoPilot UI that they like)
2. Per module: synthesize new PRD from existing docs + D365 analysis + Raporting specs
3. Start with highest-impact modules: Technical (15 items), Production (15 items)
4. Create Reporting as new Epic 15 with full story set
5. Update database schema for new fields
6. Update validation schemas (Zod)
