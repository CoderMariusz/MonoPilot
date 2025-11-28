# 📋 BATCH 4A - PHASE 2 (Future Features)

**Status:** Planning Phase
**Created:** 2025-11-28
**Target:** Next Sprint (after Phase 1 complete)

---

## Overview

Phase 2 features are NOT included in current Batch 4A (Stories 4.1-4.9). These are identified for future implementation based on PO feedback and product evolution.

---

## PHASE 2 FEATURES

### 1. Operation Skipping/Cancellation (from Story 4.4 Q2.4)

**Feature:** Allow operators to skip operations or cancel them without completing

**User Story:**
> As an Operator, I want to skip an operation (if not needed) or cancel it (if aborted), so that production can adapt to changes

**Acceptance Criteria:**
- [ ] AC-P2.1: Skip operation (mark as 'skipped', don't block next)
- [ ] AC-P2.2: Cancel operation (mark as 'cancelled', rollback any consumption)
- [ ] AC-P2.3: Audit trail for skip/cancel decisions
- [ ] AC-P2.4: Notes field for skip reason

**Implementation Notes:**
- Add status: 'skipped', 'cancelled' to operation enum
- Sequence enforcement: if op is skipped, next op still available
- Genealogy: handle consumption rollback on cancel

**Effort:** 3-4 hours, 2 story points

---

### 2. Partial Consumption Handling (from Story 4.7/4.8)

**Feature:** Support splitting reserved LPs when only partial qty consumed

**User Story:**
> As a System, I want to split reserved LPs that are only partially consumed, so that remaining material is available for other WOs

**Current Status:**
- Story 4.7/4.8 assume full LP consumption
- Phase 2: Handle partial consumption with LP splitting

**Implementation Notes:**
- When reserved_qty < LP.qty, split LP
- Create new LP with remaining qty (status='available')
- Update genealogy to track split
- Consumption record tracks both parts

**Effort:** 4-5 hours, 2 story points

---

### 3. Auto-Complete WO (from Story 4.6 Q4.3)

**Feature:** Automatically mark WO as complete when output_qty >= planned_qty

**User Story:**
> As a System, I want to auto-complete WO when production meets target, so that operators don't need manual confirmation

**Current Status:**
- AC-4.6.3 mentions auto_complete_wo feature
- PO said: "narazie zrezygnujemy z auto complite" (skip for now)
- Phase 2: Implement if needed

**Configuration:**
- production_settings.auto_complete_wo = BOOLEAN (per warehouse)
- Trigger: Check after each operation complete

**Effort:** 2-3 hours, 1 story point

---

### 4. Genealogy Detailed Tracking (from Story 4.6/4.7)

**Feature:** Enhanced genealogy with material tracking per operation

**Current Status:**
- Basic genealogy: parent LP → child LP per operation
- Phase 2: Add material-level genealogy

**Implementation:**
- Track which materials went into which operation
- Which operation consumed which LP portions
- Detailed traceability per production step

**Effort:** 5-6 hours, 3 story points

---

### 5. Production Dashboard Enhancements (from Story 4.1)

**Feature:** Advanced dashboard widgets (real-time alerts, predictive ETAs, anomaly detection)

**Current Phase 1:**
- KPI cards, active WO table, alerts panel
- 30-second auto-refresh

**Phase 2 Ideas:**
- Real-time WebSocket instead of polling
- Predictive completion times (based on operation history)
- Quality anomaly alerts (yield < 80%)
- Production bottleneck detection

**Effort:** 8-10 hours, 5 story points

---

### 6. Operation Notes & Timestamping (from Story 4.5)

**Feature:** Rich operation notes with photo/video attachments

**Current Status:**
- Simple text notes field in 4.5
- Phase 2: Add photos, video, timestamp marks

**Use Cases:**
- Operator adds photo of defect
- Video of mixing process
- Timestamp marks within operation (e.g., "Added preservative at 10:15")

**Effort:** 4-5 hours, 2 story points

---

### 7. Offline Queue Integration (Story 4.8 reference to Story 5.36)

**Feature:** Queue operations when offline (scanner mode)

**Current Status:**
- AC-4.8.5 references offline queue
- Story 5.36 in later batch
- Phase 2: Integrate offline queue into material reservation scanner

**Implementation:**
- Queue reservations when network unavailable
- Sync when reconnected
- Conflict handling for concurrent updates

**Effort:** 6-7 hours, 3 story points

---

### 8. Production Line Assignment (Future)

**Feature:** Assign/reassign WOs to production lines dynamically

**Current Status:**
- WO assigned to line during planning (Story 3.10)
- Phase 2: Allow runtime reassignment if line becomes unavailable

**Use Cases:**
- Equipment failure → reassign to backup line
- Load balancing → move WO to less-loaded line

**Effort:** 5-6 hours, 2 story points

---

### 9. Production Reporting & Analytics

**Feature:** Historical reports on production efficiency, yield trends, downtime analysis

**Reports:**
- Daily/weekly/monthly production summary
- Yield trends by product/material/supplier
- Downtime root cause analysis
- Operator performance metrics

**Effort:** 10-12 hours, 5 story points

---

### 10. Exception Handling & Approvals

**Feature:** System for handling production exceptions (over-yield, material shortage, quality holds)

**Current Status:**
- Basic error handling in Phase 1
- Exceptions logged

**Phase 2:**
- Exception workflow (alert → supervisor approval → resolution)
- Audit trail of exceptions
- Root cause tracking

**Effort:** 8-10 hours, 3 story points

---

## PHASE 2 PRIORITIZATION

| Feature | Priority | Effort | Value |
|---------|----------|--------|-------|
| Operation Skipping | 🟡 Medium | 2pts | High (operational flexibility) |
| Partial Consumption | 🟡 Medium | 2pts | High (material accuracy) |
| Auto-Complete WO | 🟠 Low | 1pt | Medium (convenience) |
| Genealogy Details | 🟢 High | 3pts | High (traceability) |
| Dashboard Enhancements | 🟡 Medium | 5pts | Medium (visibility) |
| Operation Notes | 🟠 Low | 2pts | Low (nice-to-have) |
| Offline Queue | 🟡 Medium | 3pts | High (mobile usability) |
| Line Reassignment | 🟠 Low | 2pts | Medium (flexibility) |
| Reporting | 🟡 Medium | 5pts | High (analytics) |
| Exception Handling | 🟢 High | 3pts | High (safety) |

**Phase 2 Recommended Total:** 25-30 story points (3-4 week sprint)

---

## IMPLEMENTATION ROADMAP

### Sprint 1 (Week 1-2)
- [ ] Genealogy Details Tracking (3pts)
- [ ] Exception Handling & Approvals (3pts)
- [ ] Operation Skipping/Cancellation (2pts)
- **Total: 8pts**

### Sprint 2 (Week 2-3)
- [ ] Partial Consumption Handling (2pts)
- [ ] Offline Queue Integration (3pts)
- [ ] Production Reporting (5pts)
- **Total: 10pts**

### Sprint 3 (Week 3-4)
- [ ] Dashboard Enhancements (5pts)
- [ ] Line Reassignment (2pts)
- [ ] Operation Notes (2pts)
- [ ] Auto-Complete WO (1pt)
- **Total: 10pts**

---

## NOTES

- Phase 2 features depend on Phase 1 completion
- Some features (e.g., genealogy, offline queue) may be moved forward if business critical
- Will reassess priorities after Phase 1 production feedback
- Client feedback loop important for Phase 2 prioritization

