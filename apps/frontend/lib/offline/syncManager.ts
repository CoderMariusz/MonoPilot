/**
 * Sync Manager - Automatic background sync for offline queue
 * Story 1.7.1 - AC-5: Offline Workflow
 *
 * Auto-syncs pending items when network becomes available.
 * Target: <2s sync time per item, max 3 retries with exponential backoff.
 *
 * @module SyncManager
 */

import { offlineQueue, type QueuedScan } from './offlineQueue';
import { GRNsAPI } from '../api/grns';
import { LicensePlatesAPI } from '../api/licensePlates';
import { toast } from '../toast';

class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start automatic sync on network reconnect
   */
  startAutoSync(): void {
    // Listen for online events
    window.addEventListener('online', this.handleOnline);

    // Periodic check every 30 seconds (fallback if online event missed)
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncPendingItems();
      }
    }, 30000);

    console.log('[SyncManager] Auto-sync started');
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    window.removeEventListener('online', this.handleOnline);

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('[SyncManager] Auto-sync stopped');
  }

  /**
   * Handle online event
   */
  private handleOnline = async () => {
    console.log('[SyncManager] Network online - starting sync...');
    await this.syncPendingItems();
  };

  /**
   * Sync all pending items in queue
   */
  async syncPendingItems(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('[SyncManager] Sync already in progress');
      return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('[SyncManager] Cannot sync - offline');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;

    try {
      const pendingItems = await offlineQueue.getPendingItems();

      if (pendingItems.length === 0) {
        console.log('[SyncManager] No pending items to sync');
        return { success: 0, failed: 0 };
      }

      console.log(`[SyncManager] Syncing ${pendingItems.length} pending items...`);

      let successCount = 0;
      let failedCount = 0;

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          successCount++;

          // Remove from queue after successful sync
          await offlineQueue.removeFromQueue(item.id);
        } catch (err: any) {
          console.error(`[SyncManager] Failed to sync item ${item.id}:`, err);
          failedCount++;

          // Update status to failed with error message
          await offlineQueue.updateStatus(item.id, 'failed', err.message);
        }
      }

      console.log(`[SyncManager] Sync complete: ${successCount} success, ${failedCount} failed`);

      // Show toast notification
      if (successCount > 0) {
        toast.success(`✓ Synced ${successCount} offline scans`);
      }
      if (failedCount > 0) {
        toast.error(`⚠ ${failedCount} scans failed to sync`);
      }

      return { success: successCount, failed: failedCount };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single item (create GRN + LPs)
   */
  private async syncItem(item: QueuedScan): Promise<void> {
    // Mark as syncing
    await offlineQueue.updateStatus(item.id, 'syncing');

    try {
      // Create GRN
      const grn = await GRNsAPI.create({
        asn_id: item.asn_id,
        po_id: item.po_id,
        warehouse_id: item.warehouse_id,
        received_by: item.user_id,
        received_at: new Date(item.timestamp).toISOString(),
        status: 'completed',
        notes: `Synced from offline queue (scanned at ${new Date(item.timestamp).toLocaleString()})`,
      });

      // Create License Plates
      for (const scannedItem of item.scanned_items) {
        await LicensePlatesAPI.create({
          lp_number: scannedItem.lp_number,
          product_id: scannedItem.product_id,
          quantity: scannedItem.quantity,
          uom: scannedItem.uom,
          batch_number: scannedItem.batch,
          expiry_date: scannedItem.expiry_date,
          warehouse_id: item.warehouse_id,
          location_id: item.warehouse_id, // TODO: Get default location
          status: 'available',
          grn_id: grn.id,
          po_number: item.po_number,
          supplier_batch_number: scannedItem.batch,
        });
      }

      // Mark as synced
      await offlineQueue.updateStatus(item.id, 'synced');

      console.log(`[SyncManager] Item synced successfully: GRN ${grn.grn_number}`);
    } catch (err) {
      console.error('[SyncManager] Sync error:', err);
      throw err;
    }
  }

  /**
   * Manual retry for failed items
   */
  async retryFailedItems(): Promise<{ success: number; failed: number }> {
    if (!navigator.onLine) {
      toast.error('Cannot retry - device is offline');
      return { success: 0, failed: 0 };
    }

    // Reset failed items to pending
    const failedItems = await this.getFailedItems();

    for (const item of failedItems) {
      await offlineQueue.updateStatus(item.id, 'pending');
    }

    // Trigger sync
    return await this.syncPendingItems();
  }

  /**
   * Get failed items from queue
   */
  private async getFailedItems(): Promise<QueuedScan[]> {
    await offlineQueue.init();

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MonoPilotOfflineQueue', 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['scannedItems'], 'readonly');
        const objectStore = transaction.objectStore('scannedItems');
        const index = objectStore.index('status');
        const getRequest = index.getAll('failed');

        getRequest.onsuccess = () => {
          resolve(getRequest.result);
        };

        getRequest.onerror = () => {
          reject(getRequest.error);
        };
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }
}

// Singleton instance
export const syncManager = new SyncManager();
