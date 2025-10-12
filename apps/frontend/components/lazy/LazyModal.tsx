'use client';

import { lazy, Suspense } from 'react';

// Lazy load heavy modals
export const LazyAddItemModal = lazy(() => import('../AddItemModal'));
export const LazyWorkOrderDetailsModal = lazy(() => import('../WorkOrderDetailsModal'));
export const LazyPurchaseOrderDetailsModal = lazy(() => import('../PurchaseOrderDetailsModal'));
export const LazyTransferOrderDetailsModal = lazy(() => import('../TransferOrderDetailsModal'));
export const LazyGRNDetailsModal = lazy(() => import('../GRNDetailsModal'));
export const LazyStockMoveDetailsModal = lazy(() => import('../StockMoveDetailsModal'));

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
