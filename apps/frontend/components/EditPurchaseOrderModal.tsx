'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { mockProducts, mockPurchaseOrders } from '@/lib/mockData';
import type { Product, PurchaseOrderItem } from '@/lib/types';

interface EditPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: number | null;
  onSuccess: () => void;
}

interface LineItem {
  id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
}

export function EditPurchaseOrderModal({ isOpen, onClose, purchaseOrderId, onSuccess }: EditPurchaseOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    supplier: string;
    due_date: string;
    status: 'draft' | 'submitted' | 'confirmed' | 'received' | 'cancelled';
  }>({
    supplier: '',
    due_date: '',
    status: 'draft',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', product_id: '', quantity: '', unit_price: '' }
  ]);

  useEffect(() => {
    if (isOpen && purchaseOrderId) {
      loadData();
    }
  }, [isOpen, purchaseOrderId]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const rmProducts = mockProducts.filter(p => p.type === 'RM');
      setProducts(rmProducts);

      const po = mockPurchaseOrders.find(p => p.id === purchaseOrderId);
      if (po) {
        setFormData({
          supplier: po.supplier,
          due_date: po.due_date || '',
          status: po.status,
        });

        if (po.purchase_order_items && po.purchase_order_items.length > 0) {
          setLineItems(po.purchase_order_items.map((item: PurchaseOrderItem) => ({
            id: item.id.toString(),
            product_id: item.product_id.toString(),
            quantity: item.quantity,
            unit_price: item.unit_price,
          })));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now().toString(), product_id: '', quantity: '', unit_price: '' }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string) => {
    setLineItems(lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!purchaseOrderId) return;
      
      const { updatePurchaseOrder } = await import('@/lib/clientState');
      
      const purchase_order_items = lineItems.map((item, index) => {
        const product = products.find(p => p.id === Number(item.product_id));
        return {
          id: Number(item.id) || (Date.now() + index),
          purchase_order_id: purchaseOrderId,
          product_id: Number(item.product_id),
          product,
          quantity: item.quantity,
          unit_price: item.unit_price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
      
      updatePurchaseOrder(purchaseOrderId, {
        supplier: formData.supplier,
        status: formData.status,
        due_date: formData.due_date || null,
        purchase_order_items,
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update purchase order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Edit Purchase Order</h2>
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
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
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
                  <option value="confirmed">Confirmed</option>
                  <option value="received">Received</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-md">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Product <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={item.product_id}
                            onChange={(e) => updateLineItem(item.id, 'product_id', e.target.value)}
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
                            onChange={(e) => updateLineItem(item.id, 'quantity', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Unit Price <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unit_price}
                            onChange={(e) => updateLineItem(item.id, 'unit_price', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
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
