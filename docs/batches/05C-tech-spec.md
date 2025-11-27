# Epic 5 Batch C: Warehouse - Scanner & Offline
## Technical Specification

**Date:** 2025-11-27
**Author:** Claude Code
**Epic ID:** 5
**Batch ID:** 5C (Scanner)
**Status:** Draft

---

## Overview

Epic 5 Batch C (Warehouse Scanner) implementuje mobilne operacje magazynowe z obsługą offline:

1. **Scanner UI** - Aplikacja mobilna z guided workflows (Receive, Consume, Output, Move, Count)
2. **Offline Queue** - Buffering operacji przy braku sieci z auto-sync (Sprint 0 Gap 5)
3. **Session Management** - Auto-logout po inaktywności
4. **Barcode Validation** - Real-time feedback na scanned barcodes
5. **Traceability UI** - Forward/backward trace visualization (z Batch 5A genealogy)

Batch obejmuje 14 stories (5.23-5.36) i realizuje FR-WH-23 do FR-WH-30 + offline support.

### Key Features
- ✅ Guided Scanner Workflows (Receive, Put-away, Pick, Move, Count)
- ✅ Barcode Validation z real-time feedback (✅/❌)
- ✅ Session Timeout (5 min inactivity default)
- ✅ Offline Queue Management (100 ops, configurable)
- ✅ Auto-Sync on Reconnect (FIFO, batch 10 ops per API)
- ✅ Failed Operation Queue (manual review & retry)
- ✅ Forward/Backward Traceability (recursive queries)
- ✅ Source Document Linking (PO/GRN/WO/TO)
- ✅ Inventory Count (cycle counting prep)

---

## Objectives and Scope

### In Scope
- ✅ **Scanner PWA**: Touch-optimized UI dla warehouse operations
- ✅ **Guided Workflows**: Step-by-step state machine dla receive/consume/output/move/count
- ✅ **Barcode Scanning**: Camera/input validation (LP, Product, Location, WO)
- ✅ **Real-time Feedback**: Visual (✅/❌), haptic (vibration), audio (beep)
- ✅ **Offline Queue Management**: IndexedDB buffer z 100-op limit (Gap 5)
- ✅ **Auto-Sync**: On reconnect + manual trigger
- ✅ **Failed Operations**: Separate queue dla manual review/retry
- ✅ **Session Management**: Auto-logout after timeout
- ✅ **Traceability UI**: Forward trace (parent→descendants), backward trace (child→ancestors)
- ✅ **Source Document Links**: LP linked to PO/GRN/WO/TO
- ✅ **Inventory Count**: Cycle count workflow (prep for P2 full cycle counting)
- ✅ **Settings Configuration**: Scanner timeout, queue size, sync batch size, etc.

### Out of Scope
- ❌ Advanced Putaway Algorithms (P2)
- ❌ Robot Integration (P2+)
- ❌ Voice Commands (P2)
- ❌ Multi-language Voice (future)
- ❌ AR/VR Features (P3+)
- ❌ ML-based Picking Optimization (future)

---

## System Architecture Alignment

### Technology Stack
- **Frontend**: Next.js PWA (Progressive Web App)
- **State**: Service Worker + IndexedDB (offline queue)
- **API**: Supabase REST endpoints (same as desktop)
- **Offline**: IndexedDB for queuing, localStorage for config
- **Sync**: Custom sync engine (batch 10 ops per POST)
- **UI**: Touch-optimized (Tailwind + custom components)
- **Barcode Input**: Camera API (Barcode Detection API) or input field fallback

### Database Changes (Minimal)
- Add `scanner_offline_queue` IndexedDB (browser-side only)
- Add `warehouse_settings.scanner_*` columns for config
- Add `source` field to license_plates (for linking)

---

## Implementation Dependencies

### Required from Previous Batches
- ✅ Batch 5A: LP, ASN, GRN, genealogy tables
- ✅ Batch 5B: Stock moves, pallets
- ✅ Epic 4: Work Orders (for consume/output operations)

### Dependencies Within Batch 5C
1. **Story 5.23** (Guided Workflows) → Base UI framework
2. **Story 5.24** (Barcode Validation) → Depends on 5.23
3. **Story 5.25** (Feedback) → Depends on 5.23, 5.24
4. **Story 5.26** (Operations Menu) → Depends on 5.23
5. **Story 5.27** (Session Timeout) → Depends on 5.23
6. **Story 5.28-5.30** (Traceability UI) → Depends on Batch 5A genealogy
7. **Story 5.31** (Settings) → Independent
8. **Story 5.32-5.34** (Desktop Receive + Scanner) → Depends on 5.11 (GRN)
9. **Story 5.35** (Inventory Count) → Depends on 5.1 (LP list)
10. **Story 5.36** (Offline Queue) → Depends on 5.23, requires Service Worker

### Parallel Tracks
- **Track 1**: Scanner UI (5.23-5.27) - ~30-40 hours
- **Track 2**: Traceability (5.28-5.30) - ~15-20 hours
- **Track 3**: Offline Queue (5.36) - ~20-25 hours (complex)
- **Track 4**: Receive/Count Workflows (5.32-5.35) - ~20-25 hours

---

## Data Models & API

### Offline Queue Structure (IndexedDB)
```typescript
// IndexedDB database: 'monopilot_warehouse'
// Store: 'scanner_offline_queue_{org_id}_{user_id}'

interface OfflineOperation {
  id: string;                    // UUID
  org_id: string;
  user_id: string;
  operation_type: 'receive' | 'consume' | 'output' | 'move' | 'split' | 'count';
  payload: {
    [key: string]: any;         // Operation-specific data
  };
  status: 'queued' | 'synced' | 'failed';
  performed_at: ISO8601;         // When user executed operation
  synced_at?: ISO8601;           // When synced to server
  error_message?: string;        // If failed
  retry_count: number;           // Retry attempts
}
```

### Scanner Settings Table
```sql
CREATE TABLE warehouse_settings (
  -- Existing columns...

  -- Scanner settings (new)
  scanner_timeout_minutes INT DEFAULT 5,
  scanner_idle_warning_seconds INT DEFAULT 30,
  scanner_max_queue_size INT DEFAULT 100,
  scanner_queue_warning_threshold INT DEFAULT 80,
  scanner_auto_sync_enabled BOOLEAN DEFAULT true,
  scanner_sync_batch_size INT DEFAULT 10,
  scanner_failed_queue_retention_days INT DEFAULT 7,

  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### API Endpoints (New)

#### Offline Sync
| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| Sync Queue | `/api/scanner/sync-offline-queue` | POST | authenticated | Bulk endpoint for 10 ops |
| Retry Failed | `/api/scanner/sync-offline-queue/retry` | POST | authenticated | Retry specific failed ops |
| Get Queue Status | `/api/scanner/queue-status` | GET | authenticated | Current queue size, failed count |

#### Traceability
| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| Trace Forward | `/api/warehouse/license-plates/:id/trace-forward` | GET | authenticated | All descendants (children, grandchildren) |
| Trace Backward | `/api/warehouse/license-plates/:id/trace-backward` | GET | authenticated | All ancestors (parents, grandparents) |

---

## Testing Strategy

### Unit Tests
- Offline queue operations (add, remove, clear)
- Barcode validation logic
- Sync batch logic
- Session timeout logic

### Integration Tests
- Full offline flow: 10 operations → queue filled → sync
- Partial sync failure: 70 success, 1 fail, 29 continue
- Concurrent operations on same LP

### E2E Tests
- **Story 5.34**: Full scanner receive workflow (PO scan → product scan → qty → location → label)
- **Story 5.36**: 100 offline ops → reconnect → all synced successfully
- **Story 5.28**: Forward trace: LP → all descendants (splits, merges, consumption)

---

## References
- Epic 5 Definition: [docs/epics/05-warehouse.md]
- Gap 5 (Offline Queue): [docs/readiness-assessment/3-gaps-and-risks.md]
- Batch 5A (Prerequisite): [docs/batches/05A-tech-spec.md]
- Batch 5B (Prerequisite): [docs/batches/05B-tech-spec.md]
