'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTransferOrders, useWarehouses } from '@/lib/clientState';
import { TransferOrdersAPI } from '@/lib/api';
import type { TransferOrder } from '@/lib/types';
import { toast } from '@/lib/toast';

interface TransferOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferOrderId: number | null;
}

export function TransferOrderDetailsModal({ isOpen, onClose, transferOrderId }: TransferOrderDetailsModalProps) {
  const transferOrders = useTransferOrders();
  const warehouses = useWarehouses();
  const [transferOrder, setTransferOrder] = useState<TransferOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transferOrderId) {
      loadDetails();
    }
  }, [isOpen, transferOrderId]);

  const loadDetails = async () => {
    if (!transferOrderId) return;
    
    setLoading(true);
    setError(null);
    try {
      const to = transferOrders.find(t => t.id === transferOrderId);
      if (!to) {
        throw new Error('Transfer order not found');
      }
      setTransferOrder(to);
    } catch (err: any) {
      setError(err.message || 'Failed to load transfer order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const canCancel = () => {
    if (!transferOrder) return false;
    return !['received', 'cancelled'].includes(transferOrder.status);
  };

  const handleCancel = async () => {
    if (!transferOrder) return;
    
    if (!confirm('Are you sure you want to cancel this transfer order?')) return;
    
    const reason = prompt('Cancellation reason (optional):');
    
    const result = await TransferOrdersAPI.cancel(transferOrder.id, reason);
    
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Transfer Order Details</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          </div>
        ) : transferOrder ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-600 mb-1">TO Number</div>
                  <div className="text-lg font-semibold text-slate-900">{transferOrder.to_number}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Status</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(transferOrder.status)}`}>
                    {transferOrder.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">From Warehouse</div>
                  <div className="text-base font-medium text-slate-900">
                    {(() => {
                      const fromWarehouse = warehouses.find(w => w.id === transferOrder.from_warehouse_id);
                      return fromWarehouse ? `${fromWarehouse.code} - ${fromWarehouse.name}` : 'Unknown';
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">To Warehouse</div>
                  <div className="text-base font-medium text-slate-900">
                    {(() => {
                      const toWarehouse = warehouses.find(w => w.id === transferOrder.to_warehouse_id);
                      return toWarehouse ? `${toWarehouse.code} - ${toWarehouse.name}` : 'Unknown';
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Created Date</div>
                  <div className="text-base font-medium text-slate-900">
                    {new Date(transferOrder.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Total Items</div>
                  <div className="text-base font-medium text-slate-900">
                    {transferOrder.transfer_order_items?.length || 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Transfer Items</h3>
              
              {!transferOrder.transfer_order_items || transferOrder.transfer_order_items.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No transfer items found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferOrder.transfer_order_items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-sm">
                            <div className="font-medium text-slate-900">
                              {item.product?.part_number || '-'}
                            </div>
                            <div className="text-slate-600 text-xs">
                              {item.product?.description || '-'}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-700">
                            {item.quantity} {item.product?.uom || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="p-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex items-center gap-3">
              {canCancel() && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Cancel Transfer
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
