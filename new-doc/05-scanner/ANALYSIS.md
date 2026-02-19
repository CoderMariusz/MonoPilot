# Scanner Module Documentation Analysis

**Date**: February 16, 2026
**Analyzed Files**: 6 in scanner module + 40+ cross-module references
**Analysis Type**: Inventory, Duplicates, Gaps, Cross-Module References

---

## 1. INVENTORY: ALL FILES IN /05-SCANNER

| File | Type | Summary |
|------|------|---------|
| `bugs/BUG-03-12-001-DESCRIPTION-NULL.md` | Bug Report | WO operations routing copy hardcodes description as NULL instead of copying from source (CRITICAL - AC failure) |
| `bugs/BUG-03-12-002-MISSING-HOOKS.md` | Bug Report | Missing React Query hooks for WO operations (use-wo-operations.ts, use-wo-operation-detail.ts) prevent frontend components from rendering |
| `bugs/BUG-SC-002.md` | Bug Report | Scanner Receive showing 0/0 line items due to missing test data; root cause: no POs with status 'confirmed' in database |
| `bugs/BUG-SC-002-FIX-SUMMARY.md` | Fix Summary | Solution: Created test data seed scripts to populate POs, suppliers, products, warehouses; issue was test data not code defect |
| `decisions/ADR-006-scanner-first-mobile-ux.md` | Architecture Decision | Scanner-first mobile UX strategy: dedicated /scanner/* routes, 48dp+ touch targets, barcode-driven input, offline support, not responsive desktop |
| `qa/TEST_PLAN_SCANNER.md` | Test Plan | Comprehensive test plan covering: dashboard, goods receipt, inventory move, picking, stock audit, QC, settings with buttons/forms/modals/workflows/error states |

---

## 2. DUPLICATES: OVERLAPPING CONTENT ANALYSIS

### Issue #1: Barcode Scanning Specification
**Location**: ADR-006 + multiple warehouse/production/quality wireframes
**Status**: ⚠️ Partially Duplicated

**Content**:
- **ADR-006 (lines 339-384)**: Generic scanner hardware support (Zebra, Honeywell, ring scanners)
- **WH-010 (lines 672-835)**: GS1 barcode parsing (01=GTIN, 10=Batch, 17=Expiry, etc.) for warehouse receive
- **PROD-005 (lines 53-90)**: Barcode input mechanism for material consumption
- **QA-025 (lines 1668-1684)**: Barcode type support (GTIN, Batch, LP, CCP QR, Operation QR)

**Recommendation**: CONSOLIDATE
- Create `/05-scanner/patterns/BARCODE-INTEGRATION.md` documenting:
  - Universal barcode formats (Code 128, QR, GS1-128)
  - GS1 AI codes (unified spec)
  - Hardware scanner integration (Bluetooth/USB)
  - Format validation rules
- Reference from warehouse/production/quality modules instead of duplicating
- **Action**: Keep ADR-006 (high-level), DELETE warehouse-specific GS1 details from WH-010, CONSOLIDATE to single patterns file

---

### Issue #2: Scanner Touch Targets & Accessibility
**Location**: ADR-006 + WH-010 + WH-011 + PROD-005 + QA-025
**Status**: ✅ Consistent but Wordy

**Content** (all consistent):
- ADR-006 (lines 209-239): 48dp minimum, 72dp for primary actions
- WH-010 (lines 1083-1317): 64dp minimum, 72dp for primary
- WH-011 (lines 1068-1076): 48dp minimum, 56dp primary
- PROD-005 (lines 1307-1319): 48dp height, 64dp for number pad keys
- QA-025 (lines 1430-1437): 72x72dp primary, 64dp minimum

**Recommendation**: KEEP as is (consistency is good for implementation)
- Each UX spec adds context-specific details (WH-010 vs QA-025)
- No functional conflict, just slightly different emphasis
- Developers can reference ADR-006 for principle, specific wireframes for measurements

---

### Issue #3: Offline Mode & IndexedDB Queue
**Location**: ADR-006 + WH-010 + WH-011 + PROD-005 + QA-025
**Status**: ⚠️ Slightly Inconsistent Queue Sizes

**Content**:
- ADR-006 (line 255): Max 100 operations
- WH-010 (line 1174): Max 100 operations
- PROD-005: No offline queue mentioned (should it be?)
- QA-025 (line 1388): Max 50 operations

**Recommendation**: STANDARDIZE
- **Action**: Update all modules to max 100 operations (warehouse is bottleneck)
- Update QA-025 from 50 → 100
- Add offline mode to PROD-005 consume workflow
- **Rationale**: Larger queue better supports all scenarios; 100 ops at ~5KB each = ~500KB (well within IndexedDB limits)

---

### Issue #4: Error Handling Pattern
**Location**: WH-010 + WH-011 + PROD-005 + QA-025
**Status**: ✅ Consistent

**Pattern** (all modules):
1. Invalid scan → Error message + retry options
2. Validation failure → Field-level or full-screen error
3. Network error → Offline mode + queue
4. Timeout → Show error, retry button

**Recommendation**: KEEP (good consistency for user experience)

---

### Issue #5: Audible/Haptic Feedback
**Location**: ADR-006 + WH-010 + WH-011 + PROD-005 + QA-025
**Status**: ✅ Consistent

**Pattern** (all modules):
- Success: 1 long beep (500ms) + short pulse (100ms)
- Error: 2 short beeps (200ms each) + double pulse (100ms x2)
- Warning: 1 mid-tone + long pulse (300ms)
- Critical: 3 short beeps + strong pulse (500ms)

**Recommendation**: KEEP (good UX consistency)

---

## 3. GAPS: MISSING DOCUMENTATION FOR SCANNER MODULE

### Critical Gaps

#### Gap #1: PWA Architecture NOT DOCUMENTED
**Missing**: `/05-scanner/architecture/PWA-STRATEGY.md`
**Should Include**:
- Service Worker lifecycle and cache strategy
- Manifest.json configuration (app name, icon, theme color)
- Offline data sync protocol
- Background Sync API integration
- Web app installation flow
- Capability detection (camera, vibration, audio)

**Impact**: Medium - ADR-006 mentions PWA (line 23) but no implementation details
**Action**: Create `/05-scanner/architecture/PWA-STRATEGY.md`

---

#### Gap #2: Mobile UX Patterns NOT CENTRALIZED
**Missing**: `/05-scanner/patterns/MOBILE-UX-PATTERNS.md`
**Should Include**:
- Large touch targets (why 48dp minimum)
- Linear workflows (no complex navigation)
- Scan-first input (keyboard fallback)
- Minimal decisions per screen
- Full-screen error states
- Auto-advance behavior
- Progressive disclosure pattern

**Impact**: Medium - Documented in 5 different wireframes (WH-010, WH-011, PROD-005, QA-025, ADR-006)
**Action**: Consolidate to single patterns document; reference from all modules

---

#### Gap #3: Scanner Workflows NOT DOCUMENTED SEPARATELY
**Missing**: `/05-scanner/workflows/RECEIVE-WORKFLOW.md`, `/05-scanner/workflows/CONSUME-WORKFLOW.md`, etc.
**Should Include** (4 workflows):
1. **Receive** (Warehouse): Scan PO → Scan Product → Enter Qty → Confirm → GRN/LP creation
2. **Move** (Warehouse): Scan LP → Scan Destination → Confirm → Update LP.location
3. **Consume** (Production): Scan WO → Scan Material LP → Enter Qty → Confirm → Update LP.qty
4. **QA** (Quality): Scan Product/CCP → Record Result → Confirm → Update LP.qa_status OR create NCR

**Current State**: Embedded in warehouse/production/quality wireframes (distributed)
**Impact**: High - Hard to understand scanner module as unified system
**Action**: Create `/05-scanner/workflows/` subdirectory with 4 workflow documents

---

#### Gap #4: Barcode Format Specification MISSING
**Missing**: `/05-scanner/integration/BARCODE-FORMATS.md`
**Should Include**:
- Supported formats (Code 128, QR, GS1-128, SSCC-18)
- GS1 AI codes (01, 10, 17, 13, 15, 21, 310x)
- Format validation rules
- Examples for each barcode type
- Parsing error handling

**Impact**: Medium - GS1 codes documented in WH-010 (lines 606-616), not generalized
**Action**: Extract to `/05-scanner/integration/BARCODE-FORMATS.md`

---

#### Gap #5: Camera/Scanner Hardware Integration NOT DOCUMENTED
**Missing**: `/05-scanner/integration/HARDWARE-INTEGRATION.md`
**Should Include**:
- Hardware scanner support (Zebra, Honeywell, Datalogic)
- Camera API (iOS/Android)
- Ring scanner pairing (Bluetooth HID)
- Input event handling (keyboard wedge simulation)
- Device compatibility matrix
- Fallback mechanisms

**Impact**: High - ADR-006 mentions hardware (lines 352-384) but implementation details missing
**Action**: Create `/05-scanner/integration/HARDWARE-INTEGRATION.md`

---

#### Gap #6: API Route Consolidation NOT DOCUMENTED
**Missing**: `/05-scanner/api/SCANNER-API-ROUTES.md`
**Should Include**:
- Unified API path structure (e.g., `/api/mobile/scanner/...` vs `/api/warehouse/scanner/...`)
- Shared endpoints (license-plate lookup, product lookup)
- Module-specific endpoints (warehouse receive vs production consume)
- Request/response schemas
- Error codes (PRODUCT_NOT_FOUND, LP_NOT_AVAILABLE, etc.)

**Impact**: Medium - APIs scattered across WH-010 (lines 673-991), PROD-005 (lines 1541-1581), QA-025 (lines 994-1331)
**Action**: Create consolidated `/05-scanner/api/SCANNER-API-ROUTES.md`

---

#### Gap #7: Testing Strategy NOT DOCUMENTED
**Missing**: `/05-scanner/testing/SCANNER-TEST-STRATEGY.md`
**Should Include**:
- E2E test scenarios (warehouse/production/quality)
- Device testing matrix (Zebra TC52, iPhone 12, Samsung A10, etc.)
- Offline mode testing (airplane mode workflow)
- Performance benchmarks
- Accessibility testing (WCAG 2.1 AA)
- Security testing (RLS, permission checks)

**Impact**: High - TEST_PLAN_SCANNER.md exists but covers only UI elements, not integration
**Action**: Create `/05-scanner/testing/SCANNER-TEST-STRATEGY.md`

---

#### Gap #8: Offline Sync Protocol NOT DOCUMENTED
**Missing**: `/05-scanner/architecture/OFFLINE-SYNC-PROTOCOL.md`
**Should Include**:
- Queue structure (FIFO, retry logic)
- Sync timing (auto-sync on connection, manual retry)
- Conflict resolution (server validation fails on sync)
- Media handling (photo/voice attachment timing)
- State transitions (queued → syncing → synced/failed)
- TTL and cleanup rules

**Impact**: High - Mentioned in multiple places (ADR-006, WH-010, PROD-005, QA-025) but no unified specification
**Action**: Create `/05-scanner/architecture/OFFLINE-SYNC-PROTOCOL.md`

---

## 4. CROSS-MODULE REFERENCES: SCANNER MENTIONED IN

### Warehouse Module (03)
**Files Referencing Scanner** (11 files):
1. `prd/warehouse.md` - High-level feature requirements (FR-WH-011 through FR-WH-013)
2. `ANALYSIS.md` - Module-level analysis
3. `api/scanner-move.md` - API endpoint for inventory move
4. `api/scanner-putaway.md` - API endpoint for putaway workflow
5. `guides/fifo-fefo-picking.md` - FIFO/FEFO picking strategy (used by scanner)
6. `guides/scanner-move-workflow.md` - Scanner move walkthrough
7. `guides/scanner-putaway-workflow.md` - Scanner putaway walkthrough
8. `stories/05.21.scanner-putaway-workflow.md` - Story 05.21
9. `stories/05.19.scanner-receive.md` - Story 05.19 (scanner receive)
10. `stories/05.20.scanner-move-workflow.md` - Story 05.20 (scanner move)
11. `ux/WH-010-scanner-receive.md` - Wireframe for receive (1,487 lines)
12. `ux/WH-011-scanner-move.md` - Wireframe for move (1,629 lines)

**Key Dependencies**:
- Scanner receive depends on: GS1 barcode parsing, LP creation, GRN creation
- Scanner move depends on: LP validation, stock move recording
- Both require: RLS enforcement, offline queue support

---

### Production Module (06)
**Files Referencing Scanner** (9 files):
1. `prd/production.md` - Feature requirements (FR-PROD-007, FR-PROD-008)
2. `api/material-consumption.md` - Material consumption API
3. `api/scanner-consumption-api.md` - Scanner-specific consumption endpoint
4. `guides/by-product-registration-guide.md` - By-product workflow guide
5. `guides/scanner-output-api.md` - Output registration via scanner
6. `guides/scanner-output-components.md` - Output UI components
7. `guides/scanner-consume-components.md` - Consumption UI components
8. `guides/offline-queue-guide.md` - Offline queue documentation
9. `stories/04.6b.material-consumption-scanner.md` - Story 04.6b (consumption)
10. `stories/04.7b.output-registration-scanner.md` - Story 04.7b (output)
11. `ux/PROD-005-scanner-consume-material.md` - Wireframe for consumption (1,815 lines)
12. `ux/PROD-006-scanner-register-output.md` - Wireframe for output (not analyzed)

**Key Dependencies**:
- Consumption depends on: WO material validation, LP consumption (qty update), 1:1 enforcement
- Output registration depends on: By-product tracking, QA status check
- Both require: Offline queue, test data fixtures

---

### Quality Module (08)
**Files Referencing Scanner** (7 files):
1. `prd/quality.md` - Feature requirements (QA-FR-025)
2. `api/scanner-qa.md` - QA inspection API
3. `guides/scanner-qa-workflow.md` - QA workflow walkthrough
4. `stories/06.8.scanner-qa-pass-fail.md` - Story 06.8 (QA pass/fail)
5. `stories/06.24.ccp-monitoring-scanner.md` - Story 06.24 (CCP monitoring)
6. `ux/QA-025-scanner-qa.md` - Wireframe for QA (1,831 lines - ANALYZED ABOVE)

**Key Dependencies**:
- QA inspection depends on: Product/LP lookup, LP QA status update
- CCP monitoring depends on: CCP definition, deviation threshold validation, NCR auto-creation
- Both require: Offline queue, photo/voice attachment

---

### Foundation Module (00)
**Files Referencing Scanner** (6 files):
1. `prd/project-brief.md` - Project overview mentions scanner
2. `decisions/ADR-006-scanner-first-mobile-ux.md` - Architecture decision (ANALYZED ABOVE)
3. `ux/patterns/scanner-ui-patterns.md` - UI patterns documentation
4. `ux/patterns/accessibility-checklist.md` - Accessibility requirements
5. `ANALYSIS.md` - Module analysis

**Key Dependencies**:
- Foundation provides architecture decisions and patterns
- All scanner workflows inherit from ADR-006
- Accessibility standards apply to all scanner screens

---

## 5. CROSS-MODULE DEPENDENCY MATRIX

| Scanner Feature | Warehouse | Production | Quality | Foundation |
|-----------------|-----------|------------|---------|------------|
| **Receive** | ✅ WH-010, 05.19 | — | ✅ GRN → QA pending | ✅ ADR-006 |
| **Move** | ✅ WH-011, 05.20 | — | — | ✅ ADR-006 |
| **Putaway** | ✅ WH-012 | — | — | ✅ ADR-006 |
| **Consume** | — | ✅ PROD-005, 04.6b | ✅ Validate LP status | ✅ ADR-006 |
| **Output** | — | ✅ PROD-006, 04.7b | ✅ Pre-release QA | ✅ ADR-006 |
| **QA Check** | ✅ LP QA status | ✅ By-product QA | ✅ QA-025, 06.8 | ✅ ADR-006 |
| **CCP Monitor** | — | ✅ WO context | ✅ QA-025, 06.24 | ✅ ADR-006 |
| **Offline Mode** | ✅ All WH workflows | ✅ All PROD workflows | ✅ All QA workflows | ✅ ADR-006 |

---

## 6. RECOMMENDATIONS & ACTION ITEMS

### High Priority (Blocks Implementation)

1. **CREATE** `/05-scanner/architecture/PWA-STRATEGY.md`
   - Document Service Worker, manifest, offline capability
   - Impact: Needed for implementation
   - Effort: 2-3 hours
   - Owner: Frontend architect

2. **CREATE** `/05-scanner/api/SCANNER-API-ROUTES.md`
   - Consolidate 40+ endpoints from warehouse/production/quality
   - Unified request/response schemas
   - Impact: Needed to avoid API conflicts
   - Effort: 3-4 hours
   - Owner: Backend architect + API designer

3. **CREATE** `/05-scanner/workflows/` (4 documents)
   - Receive, Move, Consume, QA workflows
   - Step-by-step flow diagrams
   - Impact: Clarifies module boundaries
   - Effort: 4-6 hours
   - Owner: UX designer + PM

4. **STANDARDIZE** Offline Queue Size
   - Update QA-025 from 50 → 100 ops
   - Add PROD-005 offline mode
   - Impact: Consistency & reliability
   - Effort: 1 hour
   - Owner: PM

### Medium Priority (Improves Clarity)

5. **CREATE** `/05-scanner/integration/BARCODE-FORMATS.md`
   - Extract GS1 spec from WH-010
   - Document all barcode types
   - Impact: Single source of truth
   - Effort: 2-3 hours
   - Owner: Backend engineer

6. **CREATE** `/05-scanner/integration/HARDWARE-INTEGRATION.md`
   - Consolidate hardware details from ADR-006
   - Implementation guide for device support
   - Impact: Implementation clarity
   - Effort: 2-3 hours
   - Owner: Mobile engineer

7. **CREATE** `/05-scanner/patterns/MOBILE-UX-PATTERNS.md`
   - Extract patterns from 5 wireframes
   - Design principles for scanner UX
   - Impact: Consistency across modules
   - Effort: 2-3 hours
   - Owner: UX designer

### Low Priority (Nice to Have)

8. **CREATE** `/05-scanner/architecture/OFFLINE-SYNC-PROTOCOL.md`
   - Detailed sync algorithm
   - State machine diagram
   - Impact: Advanced feature reference
   - Effort: 1-2 hours
   - Owner: Backend engineer

9. **CREATE** `/05-scanner/testing/SCANNER-TEST-STRATEGY.md`
   - Comprehensive test matrix
   - Device/offline scenarios
   - Impact: QA reference
   - Effort: 2-3 hours
   - Owner: QA lead

---

## 7. MODULE METRICS

| Metric | Value | Status |
|--------|-------|--------|
| **Total Files in Scanner** | 6 | ✅ Good |
| **Cross-Module References** | 40+ files | ⚠️ High coupling |
| **Missing Documentation** | 8 documents | ⚠️ Critical gaps |
| **Duplicate Content** | 4 instances | ⚠️ Consolidation needed |
| **Barcode Specs** | 4 different places | ⚠️ Not unified |
| **API Endpoints** | ~50 (scattered) | ⚠️ Not consolidated |
| **Offline Queue Spec** | 5 different (1 inconsistent) | ⚠️ Standardization needed |
| **Accessibility Docs** | ✅ Complete | ✅ Good |
| **Wireframe Quality** | 1,487-1,831 lines | ✅ Excellent |
| **ADR Coverage** | ADR-006 only | ⚠️ Could use ADR for APIs |

---

## 8. CONCLUSION

**Overall Assessment**: Scanner is **HIGH-QUALITY** but **UNDERDOCUMENTED** at module level.

**Strengths**:
- Excellent wireframes (5 detailed specifications)
- Clear architecture decision (ADR-006)
- Consistent UX patterns across modules
- Good test plan coverage

**Weaknesses**:
- Documentation scattered across 40+ module files
- No unified barcode specification
- No consolidated API route documentation
- Missing PWA architecture details
- Offline sync protocol not clearly specified
- 8 critical documentation gaps

**Recommended Action**:
1. **Immediate** (Week 1): Create unified API routes + PWA strategy + workflow diagrams
2. **Short-term** (Week 2): Consolidate barcode specs, hardware integration, mobile patterns
3. **Follow-up** (Week 3): Create offline sync protocol, test strategy, implementation guides

**Risk if Not Addressed**:
- Frontend teams will implement based on different wireframes (inconsistency)
- Backend teams will create conflicting APIs
- Offline mode may not work reliably (queue sizes differ)
- New developers cannot understand scanner module as cohesive system

---

**Analysis Complete**
Generated: 2026-02-16
Analyst: Claude Code
