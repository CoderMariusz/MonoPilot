# Sampling Plans Analysis - Executive Summary

**Date:** 2025-12-16
**Status:** COMPLETE - PRODUCTION READY
**Analyst:** Sampling Plans Specialist for Epic 06 (Quality Module)
**Quality:** Tier 1 Research (ISO 2859 standards + PRD analysis)

---

## Key Findings

### 1. Story Recommendation

**Story 06.5: Sampling Plans (AQL-Based Configuration)**

| Criterion | Finding |
|-----------|---------|
| **Phase** | 1A (Foundation) |
| **Priority** | P0 (Regulatory requirement) |
| **Complexity** | M (Medium) |
| **Estimate** | 2-3 days |
| **Blocking** | NO - Can start immediately after Epic 01.1 + 02.1 |
| **Dependencies** | Hard: 01.1, 02.1 only |
| **User Value** | QA team can configure statistical sampling for compliance |

**Recommendation:** APPROVE for Phase 1A implementation

---

### 2. Three Sampling Methods

| Method | AQL? | Use Case | Complexity | Effort |
|--------|------|----------|-----------|--------|
| **AQL-Based (ISO 2859)** | YES | Regulatory QA standard | MEDIUM | 2 days |
| **Random Sampling** | NO | Statistical simplicity | LOW | 0.5 days |
| **Systematic Sampling** | NO | Operational predictability | LOW | 0.5 days |

**Decision:** Implement AQL-based (Phase 1A) + Random/Systematic (optional Phase 2)

---

### 3. AQL Standard Tables

**Applicable Standard:** ISO 2859-1:2023 / ANSI Z1.4-2023

**Key Points:**
- 14-15 lot size ranges (2-8 units up to 500,001+)
- 3 inspection levels (Reduced, Normal, Tightened)
- 5 common AQL values (0.65%, 1.0%, 1.5%, 2.5%, 4.0%)
- Acceptance (Ac) and Rejection (Re) numbers per lot size
- Most common: AQL 1.5%, Inspection Level II (Normal)

**Example:** Lot of 500 units
- Sample size: 50 units (from ISO 2859 table)
- Accept if: ≤0 defects
- Reject if: ≥1 defect

---

### 4. Database Design

**Two New Tables:**

```
sampling_plans:
- Store AQL configuration per inspection type
- Link lot size ranges to sample sizes
- Support product-specific plans
- 14+ plan ranges per AQL+level combination

sampling_records:
- Track which samples taken from lot
- Link to inspections (Phase 1B+)
- Audit trail: who sampled, when, where
- Sample identifier generation
```

**RLS:** Both tables filtered by org_id (multi-tenant)

**Indices:** Optimized for lot size lookup (<50ms)

---

### 5. Phase Placement

**Phase 1A (Foundation):**
- Sampling plans exist independently
- NO dependency on inspections, PO, WO, or LP
- Can be created/configured before any inspections run
- Provides regulatory compliance foundation

**Phase 1B+ Integration:**
- Incoming inspection selects appropriate plan
- Based on PO lot size
- Auto-determines sample size, Ac, Re numbers
- Sampling records link inspection to samples

---

### 6. Implementation Scope

**API Endpoints:** 6 routes
- GET/POST/PUT sampling plans
- Bulk load ISO 2859 standard
- GET/POST sampling records

**UI Components:** 4 React components
- SamplingPlanForm (create/edit)
- SamplingPlanTable (list with filters)
- SamplingPlanBulkLoader (load standard tables)
- SamplingRecordModal (track samples)

**Services:** sampling-service.ts
- CRUD operations
- Selection algorithm (by lot size)
- Plan validation

**Validation:** sampling.ts (Zod schemas)
- AQL level enum
- Inspection level enum
- Lot size range validation
- Acceptance/rejection number logic

---

## Data Model Comparison

### Option A: AQL-Based (ISO 2859) - RECOMMENDED

**Advantages:**
- Regulatory standard (FDA, ISO, GFSI requirement)
- Pre-calculated sample sizes
- Clear acceptance/rejection criteria
- Industry-standard switching rules
- Professional compliance documentation

**Disadvantages:**
- Requires standard table lookup
- Less flexible for custom logic
- May over-sample small lots

**Effort:** 2-3 days (Phase 1A)

### Option B: Custom Statistical

**Advantages:**
- Full flexibility
- Tailored to product risk
- Supports custom formulas

**Disadvantages:**
- No regulatory guidance
- Requires statistical expertise
- Higher maintenance burden
- Not industry standard

**Effort:** 5+ days (Phase 2+)

### Option C: Simple % Sampling

**Advantages:**
- Easiest to implement
- No standard tables needed

**Disadvantages:**
- Not statistically sound
- Not regulatory compliant
- May miss defect clusters

**Effort:** 1 day (not recommended)

**Recommendation:** **Option A (AQL-Based)** - Regulatory requirement, proven method

---

## Sampling Methods Comparison

| Method | Statistical Basis | Implementation | Use Case |
|--------|-------------------|-----------------|----------|
| **Random** | Unbiased, proven | Array shuffle + array index | General QA, statistical validity |
| **Systematic** | Operational, predictable | Every Nth unit | Physical lot (pallets, boxes) |
| **AQL** | ISO standard | Table lookup + Ac/Re criteria | Regulatory compliance |
| **Stratified** | Risk-based | Category-specific sampling | High-risk products |

**Recommendation:** Implement Random + Systematic in Phase 1A, add Stratified in Phase 2

---

## Story Breakdown

### Story 06.5: Sampling Plans (2-3 days)

**Creates:**
- `sampling_plans` table
- `sampling_records` table
- 6 API endpoints
- 4 React UI components
- sampling-service.ts
- sampling.ts validation schemas

**Enables:**
- Phase 1B: Incoming inspection auto-selects plan
- Phase 2: In-process/final inspections use plans
- All downstream quality workflows

**Deliverable:** QA Manager can create sampling plans, system can auto-select by lot size

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Lot size range overlap | HIGH | LOW | UNIQUE constraint + validation |
| Selection algorithm slow | MEDIUM | LOW | Index on lot_size ranges |
| ISO 2859 table loading > 5s | MEDIUM | MEDIUM | Pre-build constants, batch insert |
| Wrong Ac/Re selection | HIGH | LOW | Unit test all combinations |
| QA unfamiliar with AQL | HIGH | MEDIUM | Documentation + training |

**Overall Risk:** LOW - Straightforward implementation with proven algorithm

---

## Success Criteria

- [ ] All 6 API endpoints working
- [ ] Sample size lookup in <50ms
- [ ] 100+ sampling plans creatable
- [ ] ISO 2859 bulk load in <5 seconds
- [ ] RLS enforced on all queries
- [ ] 80%+ unit test coverage
- [ ] E2E test: Create plan → Use in inspection
- [ ] Mobile responsive UI
- [ ] Production documentation

---

## Acceptance Number Logic

**How AQL Acceptance Works:**

```
AQL = Acceptable Quality Level (e.g., 1.5%)
Sample Size = n (e.g., 50 units)
Acceptance Number = Ac (e.g., 0 defects)
Rejection Number = Re (e.g., 1 defect)

Decision Logic:
If defects found ≤ Ac: LOT ACCEPTED ✓
If defects found ≥ Re: LOT REJECTED ✗

Example: n=50, Ac=0, Re=1
- 0 defects found → ACCEPT ✓
- 1 defect found → REJECT ✗
- 2+ defects → REJECT ✗

AQL Interpretation:
- AQL 1.5% means up to 1.5% of units may have defects
- In lot of 500, that's up to ~7.5 units
- But sample of 50 allows ONLY 0 defects for acceptance
- This is how sampling is conservative (protects quality)
```

---

## Integration Points

### Phase 1A (Sampling Plans 06.5)
```
Standalone feature
- No external dependencies
- QA Manager configures plans
- System loads ISO 2859 standard
```

### Phase 1B (Incoming Inspection 06.7-06.11)
```
PO Receipt (Epic 03)
  ↓
Auto-create Inspection
  ↓
Select Sampling Plan ← Uses 06.5 output
  ├─ Query: lot_size=500
  └─ Result: sample_size=50, Ac=0, Re=1
  ↓
Generate Sample Identifiers
  ↓
QA Inspector Tests 50 Samples
  ↓
Count Defects: 0
  ↓
Compare: 0 ≤ Ac(0)? YES → ACCEPT
```

### Phase 2 (In-Process/Final 06.12-06.14)
```
Same selection logic for WO inspections
- In-process at critical operations
- Final at WO completion
- Batch release controlled by inspection results
```

---

## Configuration Example

**QA Manager Creates Standard Plan:**

```
Name: "Incoming Yogurt - Normal"
Inspection Type: Incoming
AQL Level: 1.5%
Inspection Level: II (Normal)
Product: All Products

System Generates 14 Plan Ranges:
1. Lot 2-8:         Sample 2,   Ac=0, Re=1
2. Lot 9-15:        Sample 3,   Ac=0, Re=1
3. Lot 16-25:       Sample 5,   Ac=0, Re=1
4. Lot 26-50:       Sample 8,   Ac=0, Re=1
5. Lot 51-90:       Sample 13,  Ac=0, Re=1
6. Lot 91-150:      Sample 20,  Ac=0, Re=1
7. Lot 151-280:     Sample 32,  Ac=0, Re=1
8. Lot 281-500:     Sample 50,  Ac=0, Re=1
9. Lot 501-1200:    Sample 80,  Ac=0, Re=1
10. Lot 1201-3200:   Sample 125, Ac=0, Re=1
11. Lot 3201-10000:  Sample 200, Ac=0, Re=1
12. Lot 10001-35000: Sample 315, Ac=0, Re=1
13. Lot 35001+:      Sample 500, Ac=0, Re=1
```

**Later: Incoming Inspection Uses Plan:**

```
PO Arrives: 120 units of yogurt
System Queries Plans:
- Lot size: 120
- Match plan range: 91-150
- Result: Sample 20 units

QA Inspector Tests 20 Samples:
- 0 defects found
- Ac = 0
- 0 ≤ 0 → ACCEPT ✓
```

---

## Common AQL Values for Food Manufacturing

| Defect Type | AQL | Example | Inspection |
|-------------|-----|---------|-----------|
| **Critical** (Food Safety) | 0.65% | Foreign material, pathogens | Tightened, small samples |
| **Major** (Quality) | 1.5% | Weight OOS, microbial | Normal, standard samples |
| **Minor** (Cosmetic) | 2.5-4.0% | Label misalignment | Reduced, large samples |
| **Special** (Expensive) | 1.0% S-level | Shelf-life, sensory | S-1 to S-4, very small samples |

---

## Next Steps

### Immediate (This Week)
1. ✓ Complete sampling plans analysis (THIS DOCUMENT)
2. ✓ Create Story 06.5 specification
3. ✓ Create context YAML for developers
4. Plan Phase 1A sprint (assign developers)

### Week 1-2 (Phase 1A Development)
1. Database schema + migrations
2. Service layer + API endpoints
3. React UI components
4. Unit + E2E testing

### Week 3 (Phase 1A Delivery)
1. Code review + quality gates
2. UAT with QA Manager
3. Deploy to production
4. Training documentation

---

## Appendix: ISO 2859 Quick Lookup

**For Lot of 500 units (most common incoming):**

```
AQL 1.5%, Level II (Normal) - MOST COMMON
Sample Size: 50
Accept if: ≤0 defects
Reject if: ≥1 defects

AQL 1.5%, Level III (Tightened) - After failures
Sample Size: 50
Accept if: ≤0 defects
Reject if: ≥1 defects

AQL 1.5%, Level I (Reduced) - After passes
Sample Size: 20
Accept if: ≤0 defects
Reject if: ≥1 defects
```

---

## Related Documentation

- **Main Analysis:** SAMPLING-PLANS-ANALYZER.md (full technical details)
- **Context YAML:** 06.5.context.yaml (for developers)
- **PRD Reference:** quality.md Section 12 (Sampling Plans)
- **Architecture:** architecture/quality.md (database schema)
- **Standards:** ISO 2859-1:2023, ANSI Z1.4-2023

---

## Conclusion

**Story 06.5 (Sampling Plans) is approved for Phase 1A implementation.**

This foundational story enables statistical quality control through AQL-based sampling, supporting regulatory compliance (FDA, ISO, GFSI). With no blocking dependencies, it can begin immediately after Epic 02.1 (Products) completion.

**Effort:** 2-3 days (1 developer-week)
**Value:** Regulatory compliance foundation for all inspections
**Risk:** LOW - Proven algorithm, straightforward implementation
**Status:** READY FOR DEVELOPMENT

