'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TransferOrdersAPI, type MarkReceivedLineUpdate } from '@/lib/api/transferOrders';
import { WarehousesAPI } from '@/lib/api/warehouses';
import type { TransferOrder, Warehouse } from '@/lib/types';
import { toast } from '@/lib/toast';

interface TransferOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferOrderId: number | null;
}

export function TransferOrderDetailsModal({ isOpen, onClose, transferOrderId }: TransferOrderDetailsModalProps) {
  const [transferOrder, setTransferOrder] = useState<TransferOrder | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [shipDate, setShipDate] = useState('');
  const [receiveDate, setReceiveDate] = useState('');
  const [lineUpdates, setLineUpdates] = useState<Record<number, { qty_moved: string; lp_id?: string; batch?: string }>>({});

  useEffect(() => {
    async function loadWarehouses() {
      try {
        const data = await WarehousesAPI.getAll();
        setWarehouses(data);
      } catch (err) {
        console.error('Failed to load warehouses for details modal', err);
      }
    }
    loadWarehouses();
  }, []);

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
      const to = await TransferOrdersAPI.getById(transferOrderId);
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
      loadDetails(); // Reload to refresh status
    } else {
      toast.error(result.message);
    }
  };

  const handleMarkShippedClick = () => {
    // Set default ship date to today
    const today = new Date().toISOString().split('T')[0];
    setShipDate(today);
    setShowShipModal(true);
  };

  const handleMarkShipped = async () => {
    if (!transferOrder || !shipDate) return;
    
    setLoading(true);
    try {
      const shipDateTime = new Date(shipDate).toISOString();
      await TransferOrdersAPI.markShipped(transferOrder.id, shipDateTime);
      toast.success('Transfer order marked as shipped');
      setShowShipModal(false);
      await loadDetails(); // Reload to refresh dates and status
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as shipped');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceivedClick = () => {
    // Set default receive date to today
    const today = new Date().toISOString().split('T')[0];
    setReceiveDate(today);
    // Initialize line updates with planned quantities
    const updates: Record<number, { qty_moved: string; lp_id?: string; batch?: string }> = {};
    transferOrder?.transfer_order_items?.forEach(item => {
      updates[item.id] = {
        qty_moved: String(item.quantity || 0),
        lp_id: '',
        batch: item.batch || ''
      };
    });
    setLineUpdates(updates);
    setShowReceiveModal(true);
  };

  const handleMarkReceived = async () => {
    if (!transferOrder || !receiveDate) return;
    
    setLoading(true);
    try {
      const receiveDateTime = new Date(receiveDate).toISOString();
      
      // Build line updates array
      const updates: MarkReceivedLineUpdate[] = Object.entries(lineUpdates).map(([id, data]) => ({
        line_id: Number(id),
        qty_moved: Number(data.qty_moved),
        lp_id: data.lp_id ? Number(data.lp_id) : undefined,
        batch: data.batch || undefined
      }));
      
      await TransferOrdersAPI.markReceived(transferOrder.id, receiveDateTime, updates);
      toast.success('Transfer order marked as received');
      setShowReceiveModal(false);
      await loadDetails(); // Reload to refresh dates and status
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as received');
    } finally {
      setLoading(false);
    }
  };

  const updateLineField = (lineId: number, field: string, value: string) => {
    setLineUpdates(prev => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [field]: value
      }
    }));
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
                      const fromWarehouse =
                        (transferOrder.from_warehouse as Warehouse | undefined) ||
                        warehouses.find(w => w.id === transferOrder.from_warehouse_id);
                      return fromWarehouse
                        ? `${fromWarehouse.code} - ${fromWarehouse.name}`
                        : 'Unknown';
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">To Warehouse</div>
                  <div className="text-base font-medium text-slate-900">
                    {(() => {
                      const toWarehouse =
                        (transferOrder.to_warehouse as Warehouse | undefined) ||
                        warehouses.find(w => w.id === transferOrder.to_warehouse_id);
                      return toWarehouse
                        ? `${toWarehouse.code} - ${toWarehouse.name}`
                        : 'Unknown';
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

            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Shipping & Receiving</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-slate-600 mb-2">Planned Ship Date</div>
                  <div className="text-base font-medium text-slate-900">
                    {transferOrder.planned_ship_date 
                      ? new Date(transferOrder.planned_ship_date).toLocaleDateString() 
                      : '–'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-2">Actual Ship Date</div>
                  <div className={`text-base font-bold ${transferOrder.actual_ship_date ? 'text-green-700' : 'text-slate-400'}`}>
                    {transferOrder.actual_ship_date 
                      ? new Date(transferOrder.actual_ship_date).toLocaleDateString() 
                      : 'Not shipped'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-2">Planned Receive Date</div>
                  <div className="text-base font-medium text-slate-900">
                    {transferOrder.planned_receive_date 
                      ? new Date(transferOrder.planned_receive_date).toLocaleDateString() 
                      : '–'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-2">Actual Receive Date</div>
                  <div className={`text-base font-bold ${transferOrder.actual_receive_date ? 'text-green-700' : 'text-slate-400'}`}>
                    {transferOrder.actual_receive_date 
                      ? new Date(transferOrder.actual_receive_date).toLocaleDateString() 
                      : 'Not received'}
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
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Ordered</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Qty Sent</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">License Plate</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Batch</th>
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
                            {(item.quantity_planned ?? item.quantity) ?? 0} {item.product?.uom || ''}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-slate-700">
                            {(item.quantity_actual ?? 0)} {item.product?.uom || ''}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {item.lp_id ? `LP-${item.lp_id}` : '–'}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {item.batch || '–'}
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
            <div className="flex items-center gap-3">
              {transferOrder?.status === 'submitted' && (
                <button
                  onClick={handleMarkShippedClick}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark as Shipped
                </button>
              )}
              {transferOrder?.status === 'in_transit' && (
                <button
                  onClick={handleMarkReceivedClick}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark as Received
                </button>
              )}
            </div>
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

      {/* Ship Date Modal */}
      {showShipModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Mark as Shipped</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Actual Ship Date
              </label>
              <input
                type="date"
                value={shipDate}
                onChange={(e) => setShipDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowShipModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkShipped}
                disabled={loading || !shipDate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Date Modal */}
      {showReceiveModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 m-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Mark as Received</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Actual Receive Date
              </label>
              <input
                type="date"
                value={receiveDate}
                onChange={(e) => setReceiveDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Line Items</h4>
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Product</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-700">Planned</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-700">Qty Moved</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">LP ID</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferOrder?.transfer_order_items?.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="py-2 px-3 text-xs">
                          <div className="font-medium text-slate-900">{item.product?.part_number || '-'}</div>
                        </td>
                        <td className="py-2 px-3 text-xs text-right text-slate-600">{item.quantity}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={lineUpdates[item.id]?.qty_moved || ''}
                            onChange={(e) => updateLineField(item.id, 'qty_moved', e.target.value)}
                            step="0.01"
                            min="0"
                            max={item.quantity}
                            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={lineUpdates[item.id]?.lp_id || ''}
                            onChange={(e) => updateLineField(item.id, 'lp_id', e.target.value)}
                            placeholder="Optional"
                            className="w-24 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={lineUpdates[item.id]?.batch || ''}
                            onChange={(e) => updateLineField(item.id, 'batch', e.target.value)}
                            placeholder="Optional"
                            className="w-32 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowReceiveModal(false)}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkReceived}
                disabled={loading || !receiveDate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
