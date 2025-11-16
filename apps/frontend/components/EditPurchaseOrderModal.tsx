'use client';

import { useState, useEffect  } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client-browser';
import { WarehousesAPI } from '@/lib/api/warehouses';
import { ProductsAPI } from '@/lib/api/products';
import { PurchaseOrdersAPI } from '@/lib/api/purchaseOrders';
import { SuppliersAPI } from '@/lib/api/suppliers';
import type { Product, PurchaseOrderItem, Warehouse, POStatus, Supplier } from '@/lib/types';

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
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Helper function to resolve default unit price
  const resolveDefaultUnitPrice = (productId: number): number => {
    const product = products.find(p => p.id === productId);
    return product?.std_price || 0;
  };
  
  const [formData, setFormData] = useState<{
    supplier_id: string;
    due_date: string;
    payment_due_date: string;
    status: POStatus;
    warehouse_id: string;
    request_delivery_date: string;
    expected_delivery_date: string;
    currency: string;
    exchange_rate: string;
    notes: string;
    buyer: string;
  }>({
    supplier_id: '',
    due_date: '',
    payment_due_date: '',
    status: 'draft',
    warehouse_id: '',
    request_delivery_date: '',
    expected_delivery_date: '',
    currency: 'USD',
    exchange_rate: '1.0',
    notes: '',
    buyer: '',
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
      // Load products - show all active products
      const allProducts = await ProductsAPI.getAll();
      const activeProducts = allProducts.filter(p => p.is_active);
      setProducts(activeProducts);
      
      // Load warehouses
      const warehousesData = await WarehousesAPI.getAll();
      setWarehouses(warehousesData);
      
      // Load suppliers
      const suppliersData = await SuppliersAPI.getAll();
      setSuppliers(suppliersData);

      // Load purchase order
      const po = await PurchaseOrdersAPI.getById(purchaseOrderId);
      if (po) {
        // Get the buyer name from the user who created the PO
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', po.created_by)
          .single();
        
        const buyerName = userData?.full_name || userData?.email || 'Unknown';
        
        setFormData({
          supplier_id: po.supplier_id?.toString() || '',
          due_date: po.due_date || '',
          payment_due_date: po.payment_due_date ? new Date(po.payment_due_date).toISOString().split('T')[0] : '',
          status: po.status,
          warehouse_id: po.warehouse_id?.toString() || '',
          request_delivery_date: po.request_delivery_date ? new Date(po.request_delivery_date).toISOString().split('T')[0] : '',
          expected_delivery_date: po.expected_delivery_date ? new Date(po.expected_delivery_date).toISOString().split('T')[0] : '',
          currency: po.currency || 'USD',
          exchange_rate: (po.exchange_rate || 1.0).toString(),
          notes: po.notes || '',
          buyer: buyerName,
        });

        if (po.purchase_order_items && po.purchase_order_items.length > 0) {
          setLineItems(po.purchase_order_items.map((item: PurchaseOrderItem) => ({
            id: item.id.toString(),
            product_id: item.product_id.toString(),
            quantity: item.quantity_ordered.toString(),
            unit_price: item.unit_price.toString(),
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
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-fill unit price when product changes
        if (field === 'product_id' && value) {
          const defaultPrice = resolveDefaultUnitPrice(Number(value));
          updatedItem.unit_price = defaultPrice.toString();
        }
        
        return updatedItem;
      }
      return item;
    }));
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
        const quantity = parseFloat(item.quantity);
        const unitPrice = parseFloat(item.unit_price);
        const itemId = Number(item.id) || (Date.now() + index);
        return {
          // POLine properties
          id: itemId,
          po_id: purchaseOrderId,
          line_no: index + 1,
          item_id: itemId,
          uom: product?.uom || 'EACH',
          qty_ordered: quantity,
          qty_received: 0,
          unit_price: unitPrice,
          vat_rate: 0,
          requested_delivery_date: formData.request_delivery_date || undefined,
          promised_delivery_date: formData.expected_delivery_date || undefined,
          default_location_id: undefined,
          note: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // PurchaseOrderItem properties
          product_id: Number(item.product_id),
          quantity_ordered: quantity,
          quantity_received: 0,
          total_price: quantity * unitPrice,
          product,
        };
      });
      
      // Status from formData is already POStatus type
      updatePurchaseOrder(purchaseOrderId, {
        supplier_id: Number(formData.supplier_id),
        status: formData.status,
        due_date: formData.due_date || null,
        payment_due_date: formData.payment_due_date || undefined,
        currency: formData.currency || 'USD',
        exchange_rate: formData.currency !== 'USD' ? parseFloat(formData.exchange_rate) : 1.0,
        warehouse_id: formData.warehouse_id ? Number(formData.warehouse_id) : undefined,
        request_delivery_date: formData.request_delivery_date || undefined,
        expected_delivery_date: formData.expected_delivery_date || undefined,
        notes: formData.notes || undefined,
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
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent bg-slate-100"
                    disabled
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Supplier cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Warehouse
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent ${
                      formData.status === 'confirmed' ? 'bg-slate-100' : ''
                    }`}
                    disabled={formData.status === 'confirmed'}
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                  {formData.status === 'confirmed' && (
                    <p className="text-xs text-slate-500 mt-1">Warehouse cannot be changed after confirmation</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Request Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.request_delivery_date}
                    onChange={(e) => setFormData({ ...formData, request_delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={formData.currency}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-700"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-slate-500 mt-1">Currency cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.payment_due_date}
                    onChange={(e) => setFormData({ ...formData, payment_due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">Optional: Payment deadline</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Buyer
                  </label>
                  <input
                    type="text"
                    value={formData.buyer}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-700"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-slate-500 mt-1">User who created the PO</p>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  rows={3}
                  placeholder="Add any additional notes or special instructions..."
                />
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
