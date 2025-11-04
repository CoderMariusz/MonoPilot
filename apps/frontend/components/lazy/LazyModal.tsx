'use client';

import { lazy, Suspense } from 'react';

// Lazy load heavy modals
// Note: AddItemModal removed - file does not exist
export const LazyWorkOrderDetailsModal = lazy(() => import('../WorkOrderDetailsModal').then(module => ({ default: module.WorkOrderDetailsModal })));
export const LazyPurchaseOrderDetailsModal = lazy(() => import('../PurchaseOrderDetailsModal').then(module => ({ default: module.PurchaseOrderDetailsModal })));
export const LazyTransferOrderDetailsModal = lazy(() => import('../TransferOrderDetailsModal').then(module => ({ default: module.TransferOrderDetailsModal })));
export const LazyGRNDetailsModal = lazy(() => import('../GRNDetailsModal').then(module => ({ default: module.GRNDetailsModal })));
export const LazyStockMoveDetailsModal = lazy(() => import('../StockMoveDetailsModal').then(module => ({ default: module.StockMoveDetailsModal })));

// Wrapper component with loading state
export function LazyModalWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      {children}
    </Suspense>
  );
}
