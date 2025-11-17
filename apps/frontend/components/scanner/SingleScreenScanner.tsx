/**
 * Single-Screen Scanner (Variant B) - Main Component
 * Story 1.7.1 - Scanner Module UX Redesign
 *
 * All-in-one scanner interface:
 * - Top 40%: Camera viewfinder (always visible)
 * - Middle 40%: Scanned items list
 * - Bottom 20%: Action buttons (thumb zone)
 *
 * Target metrics:
 * - 8-10 items/min (vs current 4-5 = 100% faster)
 * - 2-5 taps per workflow (vs 40-50 = 90% reduction)
 * - 0 typing (vs 100 chars = 100% reduction)
 *
 * @component SingleScreenScanner
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CameraViewfinder from './CameraViewfinder';
import EditItemModal, { type EditItemData } from './EditItemModal';
import { ArrowLeft, CheckCircle, Package, WifiOff, Edit2 } from 'lucide-react';
import type { ASN, ASNItem } from '../../lib/types';
import { toast } from '../../lib/toast';
import { offlineQueue } from '../../lib/offline/offlineQueue';
import { syncManager } from '../../lib/offline/syncManager';
import { predictBatch, type BatchPrediction } from '../../lib/scanner/batchPrediction';
import { generateValidatedLPNumber } from '../../lib/scanner/lpGenerator';

interface ScannedItem {
  asn_item_id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  uom: string;
  lp_number: string;
  batch: string;
  batch_confidence?: number; // AI prediction confidence (0-100)
  expiry_date: string | null;
  scanned_at: Date;
}

interface SingleScreenScannerProps {
  asn: ASN;
  onFinish: (scannedItems: ScannedItem[]) => Promise<void>;
  onCancel: () => void;
}

/**
 * ScannedItemCard - Individual scanned item with swipe-to-remove gesture + tap-to-edit
 */
interface ScannedItemCardProps {
  item: ScannedItem;
  onRemove: (item: ScannedItem) => void;
  onEdit: (item: ScannedItem) => void;
  isNew?: boolean; // Flash green animation for newly scanned items
}

function ScannedItemCard({ item, onRemove, onEdit, isNew = false }: ScannedItemCardProps) {
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchCurrent, setTouchCurrent] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showFlash, setShowFlash] = useState(isNew);

  // Trigger flash animation on mount if isNew
  useEffect(() => {
    if (isNew) {
      setShowFlash(true);
      const timer = setTimeout(() => setShowFlash(false), 500); // Flash for 500ms
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchCurrent(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    setTouchCurrent(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    const swipeDistance = touchStart - touchCurrent;

    // Swipe left threshold: 50px
    if (swipeDistance > 50) {
      onRemove(item);
    }

    // Reset
    setTouchStart(0);
    setTouchCurrent(0);
    setIsSwiping(false);
  };

  // Calculate translate offset for visual feedback
  const translateX = isSwiping ? Math.min(0, touchCurrent - touchStart) : 0;
  const showRemoveIndicator = isSwiping && (touchStart - touchCurrent) > 30;

  return (
    <div className="relative" data-testid="scanned-item">
      {/* Background indicator (shown when swiping left) */}
      {showRemoveIndicator && (
        <div className="absolute inset-0 bg-red-500 flex items-center justify-end px-4 rounded-lg">
          <span className="text-white font-semibold">Remove</span>
        </div>
      )}

      {/* Item card (swipeable) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
        className={`bg-white border-2 rounded-lg p-3 flex items-start gap-3 relative z-10 transition-all duration-300 ${
          showFlash ? 'border-green-500 bg-green-50 shadow-lg shadow-green-200' : 'border-green-200'
        }`}
      >
        <CheckCircle className="w-5 h-5 text-green-600 flex-none mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {item.product_name}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {item.quantity} {item.uom}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <span>{item.lp_number} • {item.batch}</span>
            {item.batch_confidence !== undefined && item.batch_confidence < 100 && (
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${
                  item.batch_confidence >= 80
                    ? 'bg-green-100 text-green-700'
                    : item.batch_confidence >= 60
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
                title={`AI prediction: ${item.batch_confidence}%`}
              >
                AI: {item.batch_confidence}%
              </span>
            )}
          </div>
        </div>
        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(item);
          }}
          className="flex-none p-2 hover:bg-gray-100 rounded-full"
          aria-label="Edit item"
          data-testid="edit-item-btn"
        >
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

export default function SingleScreenScanner({
  asn,
  onFinish,
  onCancel,
}: SingleScreenScannerProps) {
  const router = useRouter();

  // State
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [remainingItems, setRemainingItems] = useState<ASNItem[]>(asn.asn_items || []);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cameraFallback, setCameraFallback] = useState(false);
  const [finishing, setFinishing] = useState(false);

  // Undo state (for swipe-to-remove error correction)
  const [undoItem, setUndoItem] = useState<ScannedItem | null>(null);
  const [undoOriginalItem, setUndoOriginalItem] = useState<ASNItem | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Edit modal state
  const [editingItem, setEditingItem] = useState<ScannedItem | null>(null);

  // Track newly scanned items for flash animation
  const [newlyScannedLPs, setNewlyScannedLPs] = useState<Set<string>>(new Set());

  // Offline queue state
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  // Initialize offline queue and sync manager
  useEffect(() => {
    const init = async () => {
      try {
        await offlineQueue.init();
        syncManager.startAutoSync();

        // Load pending queue count
        const count = await offlineQueue.getQueueCount('pending');
        setPendingQueueCount(count);

        console.log('[SingleScreenScanner] Offline queue initialized:', count, 'pending items');
      } catch (err) {
        console.error('[SingleScreenScanner] Failed to initialize offline queue:', err);
      }
    };

    init();

    return () => {
      syncManager.stopAutoSync();
    };
  }, []);

  // Generate LP number in format: LP-YYYYMMDD-NNN (ATOMIC)
  // Story 1.7.1 AC-4 Gap 1 Fix: Uses database sequence for atomicity
  // Story 1.7.1 AC-4 Gap 5 Fix: Validates uniqueness before returning
  const generateLpNumber = useCallback(async (): Promise<string> => {
    try {
      const lpNumber = await generateValidatedLPNumber();
      console.log('[SingleScreenScanner] Generated LP:', lpNumber);
      return lpNumber;
    } catch (error) {
      console.error('[SingleScreenScanner] Failed to generate LP:', error);
      // Fallback: client-side generation (should never happen in production)
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      return `LP-${year}${month}${day}-${random}`;
    }
  }, []);

  // Handle barcode scan
  const handleScan = useCallback(
    async (barcode: string) => {
      console.log('[SingleScreenScanner] Scanned:', barcode);

      // Clear any existing undo timer (prevent memory leak)
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        setUndoItem(null);
        setUndoOriginalItem(null);
      }

      // Find matching item in remaining items
      const matchedItem = remainingItems.find(
        item =>
          item.product?.part_number === barcode ||
          item.product?.description?.toLowerCase().includes(barcode.toLowerCase())
      );

      if (!matchedItem) {
        // Item not in ASN
        toast.error('Item not found in ASN');
        // Haptic feedback for error (100ms)
        if ('vibrate' in navigator) {
          navigator.vibrate(100);
        }
        return;
      }

      // Check if already scanned
      const alreadyScanned = scannedItems.find(
        item => item.asn_item_id === matchedItem.id
      );

      if (alreadyScanned) {
        // Duplicate scan
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 50, 50]);
        }
        return;
      }

      // Auto-generate LP number (atomic, with uniqueness validation)
      const lpNumber = await generateLpNumber();

      // Use AI batch prediction
      const batchPrediction = await predictBatch(
        matchedItem.product_id,
        asn.supplier_id || null,
        matchedItem.batch
      );

      // Create scanned item
      const scannedItem: ScannedItem = {
        asn_item_id: matchedItem.id,
        product_id: matchedItem.product_id,
        product_code: matchedItem.product?.part_number || '',
        product_name: matchedItem.product?.description || 'Unknown Product',
        quantity: matchedItem.quantity,
        uom: matchedItem.uom,
        lp_number: lpNumber,
        batch: batchPrediction.batch,
        batch_confidence: batchPrediction.confidence,
        expiry_date: matchedItem.expiry_date || null,
        scanned_at: new Date(),
      };

      // Add to scanned items
      setScannedItems(prev => [...prev, scannedItem]);

      // Mark as newly scanned for flash animation
      setNewlyScannedLPs(prev => new Set(prev).add(lpNumber));

      // Remove from "new" set after 600ms (longer than animation)
      setTimeout(() => {
        setNewlyScannedLPs(prev => {
          const next = new Set(prev);
          next.delete(lpNumber);
          return next;
        });
      }, 600);

      // Remove from remaining items
      setRemainingItems(prev => prev.filter(item => item.id !== matchedItem.id));

      // Success haptic feedback (50ms)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }

      // Success toast
      toast.success(`✓ ${matchedItem.product?.description || 'Item'} scanned`);
    },
    [remainingItems, scannedItems, generateLpNumber, asn.supplier_id]
  );

  // Handle camera error - fallback to Variant A
  const handleCameraError = useCallback((error: string) => {
    console.error('[SingleScreenScanner] Camera error:', error);

    if (error === 'permission_denied' || error === 'no_camera') {
      setCameraFallback(true);
      toast.error('Camera unavailable. Redirecting to manual mode...');

      // Redirect to Variant A (existing receive workflow) after 2s
      setTimeout(() => {
        router.push(`/scanner/receive?asn_id=${asn.id}`);
      }, 2000);
    }
  }, [asn.id, router]);

  // Handle item removal (swipe-to-remove)
  const handleRemoveItem = useCallback((item: ScannedItem) => {
    // Clear any existing undo timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    // Remove item from scanned list
    setScannedItems(prev => prev.filter(i => i.lp_number !== item.lp_number));

    // Find original ASN item to restore to remaining list
    const originalItem = asn.asn_items?.find(i => i.id === item.asn_item_id);
    if (originalItem) {
      setRemainingItems(prev => [...prev, originalItem]);
      setUndoOriginalItem(originalItem);
    }

    // Store for undo
    setUndoItem(item);

    // Haptic feedback for removal
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }

    // Show undo toast with 5-second expiry
    toast.error('Item removed. Tap Undo within 5 seconds to restore.');

    // Auto-clear undo buffer after 5 seconds
    undoTimerRef.current = setTimeout(() => {
      setUndoItem(null);
      setUndoOriginalItem(null);
    }, 5000);
  }, [asn.asn_items]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (!undoItem || !undoOriginalItem) return;

    // Clear timer
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    // Restore item to scanned list
    setScannedItems(prev => [...prev, undoItem]);

    // Remove from remaining list
    setRemainingItems(prev => prev.filter(i => i.id !== undoOriginalItem.id));

    // Clear undo buffer
    setUndoItem(null);
    setUndoOriginalItem(null);

    // Haptic feedback for undo
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    toast.success('Item restored');
  }, [undoItem, undoOriginalItem]);

  // Handle edit item (tap-to-edit modal)
  const handleEditItem = useCallback((item: ScannedItem) => {
    setEditingItem(item);
  }, []);

  // Handle save edited item
  const handleSaveEdit = useCallback((updatedItem: EditItemData) => {
    setScannedItems(prev =>
      prev.map(item =>
        item.lp_number === updatedItem.lp_number
          ? { ...item, batch: updatedItem.batch, quantity: updatedItem.quantity, expiry_date: updatedItem.expiry_date }
          : item
      )
    );
    setEditingItem(null);
    toast.success('Item updated');

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  // Handle finish
  const handleFinish = async () => {
    if (scannedItems.length === 0) {
      toast.error('No items scanned');
      return;
    }

    setFinishing(true);

    try {
      await onFinish(scannedItems);
      toast.success(`GRN created with ${scannedItems.length} items`);
    } catch (err: any) {
      console.error('[SingleScreenScanner] Finish error:', err);
      toast.error(`Failed to create GRN: ${err.message}`);
    } finally {
      setFinishing(false);
    }
  };

  // Calculate completion
  const totalItems = asn.asn_items?.length || 0;
  const scannedCount = scannedItems.length;
  const allScanned = scannedCount === totalItems && totalItems > 0;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header (fixed) */}
      <div className="flex-none bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1 hover:bg-blue-700 rounded"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="font-semibold">ASN {asn.asn_number}</div>
            <div className="text-xs text-blue-100">
              {asn.supplier?.name || 'Unknown Supplier'}
            </div>
          </div>
        </div>

        {/* Offline indicator with queue count */}
        {isOffline && (
          <div className="flex items-center gap-2 bg-red-500 px-3 py-1 rounded text-sm" data-testid="offline-indicator">
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
            {pendingQueueCount > 0 && (
              <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {pendingQueueCount}
              </span>
            )}
          </div>
        )}

        {/* Online with pending queue - show retry button */}
        {!isOffline && pendingQueueCount > 0 && (
          <button
            onClick={async () => {
              const result = await syncManager.retryFailedItems();
              if (result.success > 0) {
                const newCount = await offlineQueue.getQueueCount('pending');
                setPendingQueueCount(newCount);
              }
            }}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-sm text-white font-medium"
          >
            🔄 Retry ({pendingQueueCount})
          </button>
        )}
      </div>

      {/* Camera Viewfinder (40% of screen) */}
      {!cameraFallback && (
        <div className="flex-none h-[40%]">
          <CameraViewfinder
            onScan={handleScan}
            onCameraError={handleCameraError}
            onCameraReady={() => console.log('[SingleScreenScanner] Camera ready')}
            className="h-full"
          />
        </div>
      )}

      {/* Scanned Items List (40% of screen) */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50">
        {/* Scanned count badge */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            Scanned Items ({scannedCount} of {totalItems})
          </h3>
          {allScanned && (
            <CheckCircle className="w-5 h-5 text-green-600" data-testid="all-scanned-checkmark" />
          )}
        </div>

        {/* Scanned items */}
        {scannedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No items scanned yet</p>
            <p className="text-xs mt-1">Point camera at barcode to scan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scannedItems.map((item, index) => (
              <ScannedItemCard
                key={item.lp_number}
                item={item}
                onRemove={handleRemoveItem}
                onEdit={handleEditItem}
                isNew={newlyScannedLPs.has(item.lp_number)}
              />
            ))}
          </div>
        )}

        {/* Remaining items */}
        {remainingItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Remaining:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {remainingItems.map(item => (
                <div key={item.id}>
                  {item.product?.description || 'Unknown'} ({item.quantity} {item.uom})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons (20% of screen - thumb zone) */}
      <div className="flex-none bg-white border-t border-gray-200 p-4">
        {/* Undo button (floating above action buttons) */}
        {undoItem && (
          <div className="mb-3">
            <button
              onClick={handleUndo}
              className="w-full h-[50px] bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg text-lg flex items-center justify-center gap-2 shadow-lg"
            >
              ↶ Undo ({undoItem.product_name})
            </button>
          </div>
        )}

        <div className="flex gap-3">
          {/* Retry Last button (left) */}
          <button
            onClick={() => {
              if (scannedItems.length > 0) {
                const lastItem = scannedItems[scannedItems.length - 1];
                handleRemoveItem(lastItem);
              }
            }}
            disabled={scannedItems.length === 0}
            className="flex-1 h-[60px] bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-lg flex items-center justify-center gap-2"
          >
            🔄 Retry Last
          </button>

          {/* Finish button (right) */}
          <button
            onClick={handleFinish}
            disabled={scannedItems.length === 0 || finishing}
            className={`flex-1 h-[60px] font-semibold rounded-lg text-lg flex items-center justify-center gap-2 ${
              allScanned
                ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse'
                : 'bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white'
            }`}
          >
            {finishing ? 'Processing...' : '✓ Finish'}
          </button>
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          item={{
            lp_number: editingItem.lp_number,
            batch: editingItem.batch,
            quantity: editingItem.quantity,
            uom: editingItem.uom,
            expiry_date: editingItem.expiry_date,
            product_name: editingItem.product_name,
          }}
          batchConfidence={editingItem.batch_confidence}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}
