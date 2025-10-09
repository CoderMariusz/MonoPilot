'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { mockProducts, mockLocations, mockTransferOrders } from '@/lib/mockData';
import type { Product, Location } from '@/lib/types';

interface EditTransferOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  transferOrderId: number | null;
  onSuccess: () => void;
}

interface TransferItem {
  id: string;
  product_id: string;
  quantity: string;
}

export function EditTransferOrderModal({ isOpen, onClose, transferOrderId, onSuccess }: EditTransferOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    from_location_id: string;
    to_location_id: string;
    status: 'draft' | 'submitted' | 'in_transit' | 'received' | 'cancelled';
  }>({
    from_location_id: '',
    to_location_id: '',
    status: 'draft',
  });

  const [transferItems, setTransferItems] = useState<TransferItem[]>([
    { id: '1', product_id: '', quantity: '' }
  ]);

  useEffect(() => {
    if (isOpen && transferOrderId) {
      loadData();
    }
  }, [isOpen, transferOrderId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      setProducts(mockProducts);
      setLocations(mockLocations);

      const transferOrders = typeof window !== 'undefined' ? (await import('@/lib/clientState')).default?.getTransferOrders?.() || mockTransferOrders : mockTransferOrders;
      const to = transferOrders.find((t: any) => t.id === transferOrderId) || mockTransferOrders.find(t => t.id === transferOrderId);
      if (to) {
        setFormData({
          from_location_id: to.from_location_id.toString(),
          to_location_id: to.to_location_id.toString(),
          status: to.status,
        });

        if (to.transfer_order_items && to.transfer_order_items.length > 0) {
          setTransferItems(to.transfer_order_items.map(item => ({
            id: item.id.toString(),
            product_id: item.product_id.toString(),
            quantity: item.quantity,
          })));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const addTransferItem = () => {
    setTransferItems([
      ...transferItems,
      { id: Date.now().toString(), product_id: '', quantity: '' }
    ]);
  };

  const removeTransferItem = (id: string) => {
    if (transferItems.length > 1) {
      setTransferItems(transferItems.filter(item => item.id !== id));
    }
  };

  const updateTransferItem = (id: string, field: keyof TransferItem, value: string) => {
    setTransferItems(transferItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!transferOrderId) return;
      
      const { updateTransferOrder } = await import('@/lib/clientState');
      const from_location = locations.find(l => l.id === Number(formData.from_location_id));
      const to_location = locations.find(l => l.id === Number(formData.to_location_id));
      
      const transfer_order_items = transferItems.map((item, index) => {
        const product = products.find(p => p.id === Number(item.product_id));
        return {
          id: Number(item.id) || (Date.now() + index),
          transfer_order_id: transferOrderId,
          product_id: Number(item.product_id),
          product,
          quantity: item.quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
      
      updateTransferOrder(transferOrderId, {
        from_location_id: Number(formData.from_location_id),
        from_location,
        to_location_id: Number(formData.to_location_id),
        to_location,
        status: formData.status,
        transfer_order_items,
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update transfer order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Edit Transfer Order</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadingData ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    From Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.from_location_id}
                    onChange={(e) => setFormData({ ...formData, from_location_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select location...</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.code} - {location.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    To Location <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.to_location_id}
                    onChange={(e) => setFormData({ ...formData, to_location_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select location...</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.code} - {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="in_transit">In Transit</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Transfer Items</h3>
                  <button
                    type="button"
                    onClick={addTransferItem}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {transferItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-md">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Product <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) => updateTransferItem(item.id, 'product_id', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            required
                          >
                            <option value="">Select...</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.part_number} - {product.description}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => updateTransferItem(item.id, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      {transferItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTransferItem(item.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors mt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Update
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
