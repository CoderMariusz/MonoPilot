# Offline Queue Guide

**Story:** 04.7b - Output Registration Scanner
**Version:** 1.0
**Last Updated:** 2026-01-21

## Overview

The Offline Queue system allows scanner operations to be queued locally when network connectivity is unavailable, then automatically synced when the connection is restored. This ensures production operators can continue registering output even during network outages.

---

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Scanner        │     │  Offline        │     │  Server         │
│  Operation      │────>│  Queue          │────>│  API            │
│                 │     │  (IndexedDB)    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │   Network Error       │                       │
        │<──────────────────────│                       │
        │                       │                       │
        │   "Save Offline"      │                       │
        │──────────────────────>│                       │
        │                       │                       │
        │   Network Restored    │                       │
        │                       │──────────────────────>│
        │                       │   Sync Operations     │
```

---

## User Flow

### When Network Fails

1. User attempts to register output
2. Network error occurs
3. Error modal displays: "Network error. Retry?"
4. Two buttons appear:
   - **Retry** - Try again immediately
   - **Save Offline** - Queue for later sync

### When Saved Offline

1. Operation stored in local IndexedDB
2. Confirmation: "Saved for later sync"
3. Pending badge shows in header (e.g., "2 pending")
4. User can continue with next operation

### When Network Restored

1. System detects connectivity (navigator.onLine)
2. Automatic sync triggers
3. Operations processed in order
4. Success/failure notifications
5. Badge count updates

---

## Service Implementation

### OfflineQueueService

Location: `lib/services/offline-queue-service.ts`

```typescript
// Types
export interface OfflineOperation {
  operation_type: 'register_output' | 'register_by_product'
  payload: Record<string, unknown>
}

export interface QueuedOperation extends OfflineOperation {
  id: string
  created_at: string
  status: 'pending' | 'synced' | 'failed'
  retry_count: number
  error_message?: string
}

export interface SyncResult {
  synced_count: number
  failed_count: number
  errors: string[]
}

// Queue an operation
export async function queueOperation(operation: OfflineOperation): Promise<void>

// Sync all pending operations
export async function syncQueue(): Promise<SyncResult>

// Get pending count (synchronous for UI)
export function getPendingCount(): number

// Clear all queued operations
export function clearQueue(): void

// Get all operations (for debugging)
export function getQueuedOperations(): QueuedOperation[]
```

### Usage Examples

```typescript
import {
  queueOperation,
  syncQueue,
  getPendingCount,
  clearQueue,
} from '@/lib/services/offline-queue-service'

// Queue an output registration
await queueOperation({
  operation_type: 'register_output',
  payload: {
    wo_id: 'uuid-...',
    quantity: 250,
    qa_status: 'approved',
    batch_number: 'WO-2026-0156',
    expiry_date: '2026-02-20T00:00:00.000Z',
    location_id: 'uuid-...',
  },
})

// Check pending count
const pending = getPendingCount()
console.log(`${pending} operations pending`)

// Sync when online
if (navigator.onLine) {
  const result = await syncQueue()
  console.log(`Synced: ${result.synced_count}, Failed: ${result.failed_count}`)
}

// Clear queue (admin only)
clearQueue()
```

---

## Database Schema

### offline_queue Table

```sql
CREATE TABLE offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL, -- 'register_output', 'register_by_product'
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_offline_queue_org_status ON offline_queue(org_id, status);
CREATE INDEX idx_offline_queue_user_status ON offline_queue(user_id, status);
```

### RLS Policy

```sql
-- User can only access their own queue
CREATE POLICY "offline_queue_user_isolation" ON offline_queue
FOR ALL USING (user_id = auth.uid());
```

---

## Client-Side Storage

### IndexedDB Schema

```typescript
// Database: 'offline-queue'
// Version: 1
// Store: 'operations'

interface IndexedDBOperation {
  id: string            // Auto-generated
  operation_type: string
  payload: object
  status: string
  retry_count: number
  error_message?: string
  created_at: string
  synced_at?: string
}
```

### IndexedDB Implementation

```typescript
// Open database
const request = indexedDB.open('offline-queue', 1)

request.onupgradeneeded = (event) => {
  const db = event.target.result
  const store = db.createObjectStore('operations', { keyPath: 'id', autoIncrement: true })
  store.createIndex('status', 'status', { unique: false })
}

// Add operation
function addToQueue(operation: OfflineOperation): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-queue', 1)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('operations', 'readwrite')
      const store = tx.objectStore('operations')
      const id = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      store.add({
        id,
        ...operation,
        status: 'pending',
        retry_count: 0,
        created_at: new Date().toISOString(),
      })
      tx.oncomplete = () => resolve(id)
      tx.onerror = () => reject(tx.error)
    }
  })
}

// Get pending operations
function getPendingOperations(): Promise<QueuedOperation[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('offline-queue', 1)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('operations', 'readonly')
      const store = tx.objectStore('operations')
      const index = store.index('status')
      const getRequest = index.getAll('pending')
      getRequest.onsuccess = () => resolve(getRequest.result)
      getRequest.onerror = () => reject(getRequest.error)
    }
  })
}
```

---

## Auto-Sync Implementation

### Network Status Detection

```typescript
// lib/hooks/use-network-status.ts

import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Auto-Sync Hook

```typescript
// lib/hooks/use-offline-sync.ts

import { useEffect, useCallback } from 'react'
import { useNetworkStatus } from './use-network-status'
import { syncQueue, getPendingCount } from '@/lib/services/offline-queue-service'

export function useOfflineSync() {
  const isOnline = useNetworkStatus()

  const sync = useCallback(async () => {
    if (!isOnline) return

    const pending = getPendingCount()
    if (pending === 0) return

    try {
      const result = await syncQueue()
      if (result.synced_count > 0) {
        toast.success(`${result.synced_count} operations synced`)
      }
      if (result.failed_count > 0) {
        toast.warning(`${result.failed_count} operations failed to sync`)
      }
    } catch (error) {
      console.error('Sync failed:', error)
    }
  }, [isOnline])

  // Sync when coming back online
  useEffect(() => {
    if (isOnline) {
      sync()
    }
  }, [isOnline, sync])

  // Periodic sync (every 30 seconds when online)
  useEffect(() => {
    if (!isOnline) return

    const interval = setInterval(sync, 30000)
    return () => clearInterval(interval)
  }, [isOnline, sync])

  return { isOnline, sync, pendingCount: getPendingCount() }
}
```

---

## UI Components

### Offline Status Badge

```tsx
// components/scanner/shared/OfflineStatusBadge.tsx

import { useOfflineSync } from '@/lib/hooks/use-offline-sync'

export function OfflineStatusBadge() {
  const { isOnline, pendingCount, sync } = useOfflineSync()

  if (isOnline && pendingCount === 0) return null

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
      isOnline ? 'bg-yellow-500' : 'bg-red-500'
    }`}>
      {!isOnline && (
        <span className="text-white text-sm font-medium">Offline</span>
      )}
      {pendingCount > 0 && (
        <button
          onClick={sync}
          className="text-white text-sm font-medium"
          disabled={!isOnline}
        >
          {pendingCount} pending
        </button>
      )}
    </div>
  )
}
```

### Network Error Modal

```tsx
// components/scanner/shared/NetworkErrorModal.tsx

interface NetworkErrorModalProps {
  show: boolean
  message: string
  onRetry: () => void
  onSaveOffline: () => void
  onClose: () => void
}

export function NetworkErrorModal({
  show,
  message,
  onRetry,
  onSaveOffline,
  onClose,
}: NetworkErrorModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 m-4 max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h3 className="text-white text-xl font-bold text-center mb-2">
          Network Error
        </h3>
        <p className="text-slate-300 text-center mb-6">
          {message}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium min-h-[48px]"
          >
            Retry
          </button>
          <button
            onClick={onSaveOffline}
            className="w-full py-3 bg-slate-700 text-white rounded-lg font-medium min-h-[48px]"
          >
            Save Offline
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-medium min-h-[48px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## Error Handling

### Retry Logic

Operations are retried up to 3 times:

```typescript
const MAX_RETRIES = 3

async function processOperation(op: QueuedOperation): Promise<boolean> {
  if (op.retry_count >= MAX_RETRIES) {
    op.status = 'failed'
    op.error_message = 'Max retries exceeded'
    return false
  }

  try {
    if (op.operation_type === 'register_output') {
      await registerOutput(op.payload)
    } else if (op.operation_type === 'register_by_product') {
      await registerByProduct(op.payload)
    }
    op.status = 'synced'
    op.synced_at = new Date().toISOString()
    return true
  } catch (error) {
    op.retry_count++
    op.error_message = error.message
    return false
  }
}
```

### Conflict Resolution

If an operation conflicts with server state (e.g., WO already completed):

1. Mark operation as `failed`
2. Store error message
3. Notify user in sync summary
4. Allow manual review in admin

---

## Data Expiry

Offline operations expire after 7 days:

```sql
-- Cleanup job (run daily)
DELETE FROM offline_queue
WHERE created_at < NOW() - INTERVAL '7 days'
  AND status = 'pending';
```

---

## Security Considerations

1. **Encryption at Rest**
   - IndexedDB data encrypted by browser
   - Sensitive payload fields not logged

2. **User Isolation**
   - RLS enforces user-level access
   - Operations tagged with user_id

3. **Validation on Sync**
   - Full validation on server
   - Invalid operations rejected

4. **Audit Trail**
   - All synced operations logged
   - Failed operations preserved for review

---

## Testing

### Unit Tests

```typescript
import { queueOperation, syncQueue, getPendingCount, clearQueue } from './offline-queue-service'

describe('OfflineQueueService', () => {
  beforeEach(() => {
    clearQueue()
  })

  it('queues operations', async () => {
    await queueOperation({
      operation_type: 'register_output',
      payload: { quantity: 100 },
    })

    expect(getPendingCount()).toBe(1)
  })

  it('syncs pending operations', async () => {
    await queueOperation({
      operation_type: 'register_output',
      payload: { quantity: 100 },
    })

    const result = await syncQueue()

    expect(result.synced_count).toBe(1)
    expect(result.failed_count).toBe(0)
    expect(getPendingCount()).toBe(0)
  })

  it('handles sync failures', async () => {
    await queueOperation({
      operation_type: 'register_output',
      payload: { wo_id: 'wo-will-fail' },
    })

    const result = await syncQueue()

    expect(result.synced_count).toBe(0)
    expect(result.failed_count).toBe(1)
    expect(result.errors).toContain('Simulated sync failure')
  })
})
```

---

## Related Documentation

- [Scanner Output Components Guide](./scanner-output-components.md)
- [Scanner Output API Reference](./scanner-output-api.md)
- [MDN IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

---

## Support

**Story:** 04.7b
**Last Updated:** 2026-01-21
