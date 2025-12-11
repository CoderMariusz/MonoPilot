# Batch 5C-3: Offline Queue - Technical Specification

**Batch:** 5C-3 (Scanner Offline Queue)
**Stories:** 5.36
**Status:** Solutioning
**Sprint:** 0 (Gap 5)

---

## Overview

This batch covers the **Scanner Offline Queue Management** feature (Sprint 0 Gap 5):
- **Offline Queue Storage**: IndexedDB persistence for warehouse operations during network outages
- **Capacity Management**: Max 100 operations with configurable warnings and blocks
- **Automatic Sync**: FIFO sync with batching and retry logic on reconnection
- **Failure Handling**: Separate failed queue for manual review
- **Multi-User Isolation**: Per-user queue isolation on shared devices
- **Performance**: 100 operations synced in <30 seconds

**Key Concept:** Operators continue warehouse work during network outages with automatic sync when online.

---

## Architecture

### Browser Storage - IndexedDB

```javascript
// Database structure
const DB_NAME = 'monopilot_scanner';
const STORE_OFFLINE_QUEUE = 'offline_queue_{org_id}_{user_id}';
const STORE_FAILED_QUEUE = 'failed_queue_{org_id}_{user_id}';

// Offline queue entry schema
interface OfflineOperation {
  id: UUID;
  operation_type: string; // 'receive', 'consume', 'output', 'move', 'split', 'count'
  payload: object;
  performed_at: ISO8601; // When operator executed
  synced_at?: ISO8601; // When uploaded to server
  retry_count: number;
  user_id: UUID;
  org_id: UUID;
}

// Example queue entry
{
  id: "uuid-123",
  operation_type: "receive",
  payload: {
    po_id: "uuid-po",
    qty: 100,
    batch_number: "BATCH-001",
    location_id: "uuid-loc"
  },
  performed_at: "2025-01-20T10:00:00Z",
  retry_count: 0,
  user_id: "uuid-user",
  org_id: "uuid-org"
}
```

### Sync Engine

```typescript
// SyncEngine orchestrates offline queue sync
class SyncEngine {
  async syncQueue(): Promise<SyncResult>
  // 1. Load queue from IndexedDB
  // 2. Batch operations (10 per request)
  // 3. Send via POST /api/scanner/sync-offline-queue
  // 4. Handle failures → move to failed queue
  // 5. Clear successful from queue
  // 6. Update UI with progress
}

// Retry Strategy
- Max retries per batch: 3
- Backoff: 2s, 4s, 8s
- If all 3 attempts fail → mark batch as failed, continue with next batch
```

---

## Database Schema

### Scanner Settings Extension (warehouse_settings)

```sql
-- Add offline queue configuration columns
ALTER TABLE warehouse_settings ADD COLUMN IF NOT EXISTS
  max_offline_operations INT DEFAULT 100 CHECK (50-500),
  offline_warning_threshold_pct INT DEFAULT 80 CHECK (50-90),
  auto_sync_on_reconnect BOOLEAN DEFAULT true,
  sync_batch_size INT DEFAULT 10 CHECK (5-50),
  failed_queue_retention_days INT DEFAULT 7 CHECK (1-30);
```

### Sync Operation Logging (Optional)

```sql
-- Log all sync attempts for audit trail
CREATE TABLE IF NOT EXISTS scanner_sync_logs (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  sync_started_at TIMESTAMP,
  sync_completed_at TIMESTAMP,
  operations_queued INT,
  operations_synced INT,
  operations_failed INT,
  retry_attempts INT,
  status VARCHAR(20), -- 'success', 'partial', 'failed'
  error_message TEXT,

  INDEX(org_id),
  INDEX(user_id),
  INDEX(sync_started_at)
);
```

---

## API Endpoints

### POST /api/scanner/sync-offline-queue

**Purpose:** Bulk sync offline operations

**Request:**
```json
{
  "operations": [
    {
      "id": "uuid",
      "operation_type": "receive",
      "payload": {...},
      "performed_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

**Response:** Batch result
```json
{
  "synced_count": 8,
  "failed_count": 2,
  "failed_operations": [
    {
      "id": "uuid-71",
      "error": "LP-001 no longer exists"
    }
  ]
}
```

### GET /api/scanner/settings/offline

**Purpose:** Get offline queue settings (cache on client)

**Response:**
```json
{
  "max_offline_operations": 100,
  "offline_warning_threshold_pct": 80,
  "auto_sync_on_reconnect": true,
  "sync_batch_size": 10
}
```

---

## Frontend - IndexedDB Service

### IndexedDBService

```typescript
export class IndexedDBService {
  // Queue management
  async addOperation(operation: OfflineOperation): Promise<void>
  async getQueue(): Promise<OfflineOperation[]>
  async clearQueue(): Promise<void>

  // Failed queue
  async addFailedOperation(operation: OfflineOperation, error: string): Promise<void>
  async getFailedQueue(): Promise<FailedOperation[]>
  async retryFailedOperation(id: UUID): Promise<void>
  async discardFailedOperation(id: UUID): Promise<void>
}
```

### SyncService

```typescript
export class SyncService {
  async syncOfflineQueue(): Promise<SyncResult>
  // Called on network 'online' event
  // Handles batching, retries, progress updates

  async manualSync(): Promise<void>
  // User clicks "Sync Now" button

  private async syncBatch(operations: OfflineOperation[]): Promise<SyncBatchResult>
  // Send 10 operations per request with retry logic
}
```

### NetworkMonitor

```typescript
export class NetworkMonitor {
  constructor() {
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());

    // Periodic ping (every 30s) to detect stale connection
    setInterval(() => this.ping(), 30000);
  }

  private async onOnline(): Promise<void>
  // Triggered when connection restored
  // Auto-start sync within 2 seconds

  isOnline(): boolean
  // navigator.onLine + last ping success
}
```

---

## Frontend - Components

### OfflineQueueIndicator.tsx

**Props:**
```typescript
interface OfflineQueueIndicatorProps {
  queueCount: number;
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress?: { current: number; total: number };
}
```

**Renders:**
- Network badge: 🔴 Offline | 🟢 Online (top-right)
- Queue counter: 📦 Queue: 23 (top-center, if > 0)
- Sync status: ⏳ Syncing... | ✅ Synced (during sync)
- Warning: 80/100 queued (at 80%)
- Error: Queue full (at 100%)

### OfflineQueueManager.tsx

**Manages:**
- Queue state (IndexedDB)
- Failed queue display
- Manual sync trigger
- Settings (max queue, warning threshold)

### FailedQueueUI.tsx

**Displays:**
- List of failed operations
- Operation details: type, timestamp, error
- Actions: Retry, Discard
- Auto-purge after 7 days

---

## State Management

### Redux Store (or Context API)

```typescript
interface ScannerOfflineState {
  queue: OfflineOperation[];
  failedQueue: FailedOperation[];
  isSyncing: boolean;
  syncProgress: {
    current: number;
    total: number;
  };
  isOnline: boolean;
  settings: {
    maxOperations: number;
    warningThreshold: number;
    autoSync: boolean;
  };
}
```

---

## Operation Types Supported Offline

| Operation | Handler | Payload |
|-----------|---------|---------|
| **receive** | ReceiveService | po_id, qty, batch, expiry, location |
| **consume** | WOService | wo_id, line_id, qty |
| **output** | WOService | wo_id, product_id, qty, location |
| **move** | LPService | lp_id, to_location_id |
| **split** | LPService | lp_id, split_qty |
| **count** | InventoryService | count_id, scanned_lps |

---

## Sync Flow Diagram

```
1. Operator performs operation while offline
   ↓
2. Operation added to IndexedDB queue
   ↓
3. Queue counter updated (warn at 80%, block at 100%)
   ↓
4. Network restored (navigator.onLine or ping success)
   ↓
5. SyncEngine starts (within 2 seconds)
   ↓
6. Batch 10 operations → POST /api/scanner/sync-offline-queue
   ↓
7a. Success → Remove from queue, update progress
   ↓
7b. Failure → Move to failed queue, continue with next batch
   ↓
8. All batches processed → Show "✅ All synced" or "⚠️ Some failed"
   ↓
9. User can retry failed operations or discard
```

---

## Testing Strategy

### Unit Tests
- Queue operations (add, remove, clear)
- Capacity validation (max 100)
- Warning/error thresholds (80%, 100%)
- Retry logic (exponential backoff)
- FIFO ordering
- Failed queue management

### Integration Tests
- Offline operation → IndexedDB stored
- Network reconnect → Auto-sync triggered
- Sync progress updates
- Failed operations moved to failed queue
- Multi-user queue isolation
- Queue persistence across app restart

### E2E Tests
- Full offline→online workflow (AC 10)
- 100 operations offline → sync all in <30s
- Failure handling with partial success
- Manual sync trigger
- Settings configuration

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Operations per batch | 10 |
| Max queue capacity | 100 |
| Sync time for 100 ops | <30 seconds |
| Auto-sync delay | <2 seconds after reconnect |
| Manual sync response | <5 seconds |
| Failed queue retention | 7 days |

---

## Security & Privacy

- **Multi-User Isolation**: Queue keyed by `{org_id}_{user_id}`
- **Data Validation**: Server validates operation payloads (already done by existing services)
- **Timestamps**: `performed_at` immutable, used for audit trail
- **Offline-only**: Critical data (auth, balances) never queued offline
- **RLS**: All synced operations respect existing RLS policies

---

## Effort Estimate

| Component | Hours |
|-----------|-------|
| IndexedDB Service | 6-8 |
| SyncEngine | 8-10 |
| NetworkMonitor | 4-5 |
| UI Components | 8-10 |
| Testing (unit/integration/e2e) | 10-12 |
| **TOTAL** | **36-45** |

---

## Dependencies

### Requires
- Story 5.23: Scanner Guided Workflows (base scanner PWA)
- Story 5.31: Warehouse Settings (for configuration)

### Enables
- None (final story for Scanner module)

### Blocks
- None

---

## References

- **Gap 5:** Scanner Offline Queue Management - docs/readiness-assessment/3-gaps-and-risks.md
- **IndexedDB API:** https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- **Service Workers:** For background sync (optional future enhancement)
- **PWA Offline:** https://web.dev/offline-fallback-page/

---
