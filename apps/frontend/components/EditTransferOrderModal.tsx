'use client';

import { useState, useEffect  } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { ProductsAPI } from '@/lib/api/products';
import { TransferOrdersAPI } from '@/lib/api/transferOrders';
import { WarehousesAPI } from '@/lib/api/warehouses';
import type { Product, Warehouse, TOStatus } from '@/lib/types';
import { toast } from '@/lib/toast';

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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{
    from_warehouse_id: string;
    to_warehouse_id: string;
    status: TOStatus;
    planned_ship_date: string;
    planned_receive_date: string;
  }>({
    from_warehouse_id: '',
    to_warehouse_id: '',
    status: 'draft',
    planned_ship_date: '',
    planned_receive_date: '',
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
      const [productsData, warehousesData, to] = await Promise.all([
        ProductsAPI.getAll(),
        WarehousesAPI.getAll(),
        transferOrderId ? TransferOrdersAPI.getById(transferOrderId) : Promise.resolve(null),
      ]);

      setProducts(productsData);
      setWarehouses(warehousesData);

      if (to) {
        setFormData({
          from_warehouse_id: to.from_warehouse_id?.toString() || '',
          to_warehouse_id: to.to_warehouse_id?.toString() || '',
          status: to.status as TOStatus,
          planned_ship_date: to.planned_ship_date ? new Date(to.planned_ship_date).toISOString().split('T')[0] : '',
          planned_receive_date: to.planned_receive_date ? new Date(to.planned_receive_date).toISOString().split('T')[0] : '',
        });

        if (to.items && to.items.length > 0) {
          setTransferItems(to.items.map(item => ({
            id: item.id.toString(),
            product_id: item.item_id.toString(),
            quantity: item.qty_planned.toString(),
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
      
      const lines = transferItems.map((item, index) => {
        const product = products.find(p => p.id === Number(item.product_id));
        if (!product) {
          throw new Error(`Line ${index + 1}: product not found`);
        }
        const quantityNum = Number(item.quantity);
        if (!quantityNum || quantityNum <= 0) {
          throw new Error(`Line ${index + 1}: quantity must be greater than zero`);
        }
        return {
          item_id: Number(item.product_id),
          uom: product.uom || 'EA',
          qty_planned: quantityNum,
          qty_shipped: 0,
          qty_received: 0,
        };
      });
      
      await TransferOrdersAPI.update(transferOrderId, {
        from_wh_id: Number(formData.from_warehouse_id),
        to_wh_id: Number(formData.to_warehouse_id),
        status: formData.status,
        planned_ship_date: formData.planned_ship_date || null,
        planned_receive_date: formData.planned_receive_date || null,
        requested_date: formData.planned_ship_date || null,
        lines,
      });
      
      toast.success('Transfer order updated successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err.message || 'Failed to update transfer order';
      setError(message);
      toast.error(message);
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
                    From Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.from_warehouse_id}
                    onChange={(e) => setFormData({ ...formData, from_warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.filter(w => w.is_active).map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    To Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.to_warehouse_id}
                    onChange={(e) => setFormData({ ...formData, to_warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.filter(w => w.is_active).map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Planned Ship Date
                  </label>
                  <input
                    type="date"
                    value={formData.planned_ship_date}
                    onChange={(e) => setFormData({ ...formData, planned_ship_date: e.target.value })}
                    disabled={formData.status !== 'draft' && formData.status !== 'submitted'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.status !== 'draft' && formData.status !== 'submitted' 
                      ? 'Cannot edit after submission' 
                      : 'Optional: When goods will be shipped'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Planned Receive Date
                  </label>
                  <input
                    type="date"
                    value={formData.planned_receive_date}
                    onChange={(e) => {
                      const receiveDate = e.target.value;
                      if (formData.planned_ship_date && receiveDate < formData.planned_ship_date) {
                        setError('Planned receive date must be after planned ship date');
                        return;
                      }
                      setFormData({ ...formData, planned_receive_date: receiveDate });
                    }}
                    min={formData.planned_ship_date || undefined}
                    disabled={formData.status !== 'draft' && formData.status !== 'submitted'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.status !== 'draft' && formData.status !== 'submitted' 
                      ? 'Cannot edit after submission' 
                      : 'Optional: When goods should arrive'}
                  </p>
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
