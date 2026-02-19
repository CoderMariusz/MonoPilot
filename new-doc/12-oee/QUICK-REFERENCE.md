# OEE Module Documentation - Quick Reference

**Analysis Date**: 2026-02-16  
**Full Analysis**: See `ANALYSIS.md` (557 lines)

---

## File Structure at a Glance

```
12-oee/
├── prd/
│   └── oee.md                          # Complete Product Requirement Doc (926 lines)
├── decisions/
│   └── oee-arch.md                     # Architecture Decision Doc (665 lines)
├── stories/
│   ├── 10.1.oee-settings-targets.md
│   ├── 10.2.downtime-reason-codes.md
│   ├── 10.3.downtime-event-tracking.md
│   ├── 10.4.oee-calculation-engine.md
│   ├── 10.5.realtime-machine-dashboard.md
│   ├── 10.6.oee-threshold-alerts.md
│   ├── 10.7.shift-report-generation.md
│   ├── 10.8.energy-consumption-tracking.md
│   ├── 10.9.historical-trend-analysis.md
│   ├── 10.10.machine-utilization-heatmap.md
│   ├── 10.11.downtime-pareto-analysis.md
│   ├── 10.12.performance-dashboard.md
│   ├── 10.13.custom-report-builder.md
│   ├── 10.14.email-alerts-shift-handover.md
│   ├── 10.15.production-rate-tracking.md
│   ├── 10.16.mtbf-mttr-calculation.md
│   ├── 10.17.bottleneck-analysis.md
│   ├── 10.18.mobile-downtime-logging.md
│   ├── 10.19.tpm-benchmarking.md
│   ├── 10.20.export-to-bi-tools.md                    # 20 stories total
│   ├── implementation-plan.md
│   ├── IMPLEMENTATION-ROADMAP.yaml
│   └── context/                        # 100 YAML files (5 per story)
│       ├── 10.1/ {_index.yaml, api.yaml, database.yaml, frontend.yaml, tests.yaml}
│       ├── 10.2/ ... (missing _index.yaml for 10.6-10.9)
│       └── ... 10.20/
├── ux/
│   ├── OEE-001-real-time-machine-dashboard.md
│   ├── OEE-002-downtime-event-tracking.md
│   ├── OEE-003-oee-settings-page.md
│   ├── OEE-004-shift-report.md
│   ├── OEE-005-energy-consumption-dashboard.md
│   ├── OEE-006-historical-trend-analysis.md
│   ├── OEE-007-machine-utilization-heatmap.md
│   ├── OEE-008-downtime-pareto.md
│   ├── OEE-009-performance-dashboard.md
│   └── OEE-010-mobile-downtime-logging.md             # 10 UX wireframes
├── ANALYSIS.md                         # This analysis (557 lines)
└── QUICK-REFERENCE.md                  # You are here
```

---

## Critical Issues Found

### 🔴 REQUIRED FIXES (Must Fix Before Development)

| Issue | Location | Action |
|-------|----------|--------|
| **Timeline mismatch** | PRD lines 9-17 vs Implementation Plan | Update PRD Phase Mapping to show 14 weeks (not 24) |
| **OEE storage format unclear** | Story 10.4 database schema | Clarify: DECIMAL(5,2) or INTEGER? Recommend DECIMAL(5,2) |
| **Missing _index.yaml files** | Stories 10.6, 10.7, 10.8, 10.9 | Create 4 files for consistency |

### 🟡 RECOMMENDED CLEANUP (Nice to Have)

| Item | Location | Action |
|------|----------|--------|
| API endpoints duplication | PRD lines 133-204 + ARCH lines 333-390 | Keep in PRD, DELETE from ARCH |
| Alert config duplication | PRD lines 593-612 + ARCH lines 615-623 | Keep in PRD, DELETE from ARCH |
| Benchmarks duplication | PRD lines 890-918 + ARCH lines 637-657 | Keep in PRD, DELETE from ARCH |

---

## Functional Requirements Summary

### All 28 FRs are covered (100% ✅)

```
Phase 1A (MVP Core):         9 FRs → Stories 10.1-10.5
Phase 1B (MVP Complete):     6 FRs → Stories 10.6-10.9
Phase 2 (Growth):            6 FRs → Stories 10.10-10.15
Phase 3 (Enterprise):        7 FRs → Stories 10.16-10.20
```

### Core Formula (OEE Calculation)

```
OEE = Availability × Performance × Quality

Where:
- Availability = (Planned Time - Downtime) / Planned Time
- Performance = (Good Pieces × Ideal Cycle Time) / Production Time
- Quality = Good Pieces / Total Pieces
```

---

## Database Tables (14 Total)

### Core OEE Tables
- `oee_snapshots` - Point-in-time OEE calculations
- `oee_downtime_events` - Downtime tracking
- `oee_downtime_reasons` - Reason code catalog
- `oee_performance_logs` - Cycle time tracking
- `oee_quality_events` - Scrap/defect tracking

### Energy Tables
- `energy_readings` - Meter readings
- `energy_baselines` - Target consumption
- `energy_costs` - Rate configuration

### Shift & Performance Tables
- `shift_reports` - Automated shift summaries
- `shift_handover_notes` - Shift communication
- `performance_targets` - OEE targets
- `performance_alerts` - Threshold alerts

### Analytics Tables
- `oee_daily_summary` - Daily aggregations
- `oee_hourly_summary` - Hourly aggregations
- `machine_utilization` - Utilization tracking

---

## API Endpoints (48 Total)

All endpoints are defined in story context files. Example categories:

- **OEE Calculation** (3 endpoints): calculate, snapshots list/detail
- **Downtime Management** (6 endpoints): events CRUD, reasons CRUD, Pareto
- **Performance Metrics** (3 endpoints): logs, machine data, cycle time
- **Quality Metrics** (3 endpoints): events, yield, scrap
- **Energy Tracking** (5 endpoints): readings, consumption, baselines, cost
- **Shift Reports** (5 endpoints): list, detail, generate, approve, export
- **Alerts** (4 endpoints): list, active, acknowledge, config
- **Analytics** (5 endpoints): trends, comparisons, utilization, bottlenecks, MTBF
- **Targets** (3 endpoints): list, create, update, delete

---

## Story Dependencies

### Phase 1A (MVP Core) - 5 Stories
1. **10.1 - OEE Settings & Targets** (M, 2-3 days) → Configuration foundation
2. **10.2 - Downtime Reason Codes** (M, 2-3 days) → Blocking 10.3, 10.11
3. **10.3 - Downtime Event Tracking** (L, 4-5 days) → Blocking 10.4, 10.6
4. **10.4 - OEE Calculation Engine** (L, 5-6 days) → Blocking 10.5, 10.9, 10.12
5. **10.5 - Real-Time Dashboard** (L, 4-5 days) → Depends on 10.1-10.4

**Estimated effort**: 16-20 days (4 weeks)

### Phase 1B (MVP Complete) - 4 Stories
6. **10.6 - Threshold Alerts** → Blocking 10.14
7. **10.7 - Shift Report Generation** → Blocking 10.14
8. **10.8 - Energy Consumption Tracking**
9. **10.9 - Historical Trend Analysis**

**Estimated effort**: 12-16 days (3 weeks)

### Phase 2 (Growth) - 6 Stories
10. **10.10 - Machine Utilization Heatmap**
11. **10.11 - Downtime Pareto Analysis** (depends on 10.2)
12. **10.12 - Performance Dashboard** (depends on 10.4)
13. **10.13 - Custom Report Builder**
14. **10.14 - Email Alerts & Shift Handover** (depends on 10.6, 10.7)
15. **10.15 - Production Rate Tracking**

**Estimated effort**: 18-24 days (4 weeks)

### Phase 3 (Enterprise) - 5 Stories
16. **10.16 - MTBF/MTTR Calculation**
17. **10.17 - Bottleneck Analysis**
18. **10.18 - Mobile Downtime Logging**
19. **10.19 - TPM & Benchmarking**
20. **10.20 - Export to BI Tools**

**Estimated effort**: 14-18 days (3 weeks)

---

## UX Wireframes (10 Screens)

All screens have ASCII mockups in `ux/` directory:

1. **OEE-001**: Real-time machine dashboard (KPIs + machine grid)
2. **OEE-002**: Downtime event tracking (quick log form)
3. **OEE-003**: OEE settings page (targets configuration)
4. **OEE-004**: Shift report (summary + approval)
5. **OEE-005**: Energy consumption (charts + costs)
6. **OEE-006**: Historical trends (line charts)
7. **OEE-007**: Machine utilization heatmap (calendar view)
8. **OEE-008**: Downtime Pareto chart (bar + pie)
9. **OEE-009**: Performance dashboard (comprehensive)
10. **OEE-010**: Mobile downtime logging (phone UI)

---

## Documentation Quality Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Completeness** | 95% | All 28 FRs specified; timeline needs update |
| **Clarity** | 4.5/5 | Well-written; good examples and mockups |
| **Consistency** | 3/5 | 2 critical inconsistencies found |
| **Actionability** | 4.5/5 | Stories ready to implement; context specs complete |
| **Maintainability** | 3.5/5 | Some duplication; missing 4 index files |

---

## How to Use This Analysis

1. **For Project Leads**: Review "Critical Issues" section → Fix timeline + storage format
2. **For Developers**: Start with Phase 1A stories → Dependencies in "Story Dependencies" section
3. **For Architects**: See "Database Tables" and review ARCH doc for SQL schemas
4. **For QA**: See "Functional Requirements Summary" for test coverage planning
5. **For UX/Designers**: Reference `ux/` wireframes and story context `frontend.yaml` files

---

## Next Steps

### Week 1
- [ ] Fix timeline in PRD (Phase 1A should be 4 weeks, not 8)
- [ ] Clarify OEE storage format (recommend DECIMAL(5,2))
- [ ] Create 4 missing _index.yaml files

### Week 2
- [ ] Remove 150 lines of duplication from ARCH doc
- [ ] Add cross-references in ARCH pointing to PRD
- [ ] Add UX wireframe links to story files

### Week 3+
- [ ] Start Phase 1A development (stories 10.1-10.5)
- [ ] Parallel: Create developer environment setup docs

---

**Generated**: 2026-02-16  
**Analysis Document**: ANALYSIS.md (557 lines, 23KB)
