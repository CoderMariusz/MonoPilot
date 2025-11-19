'use client';

import { useState, useEffect  } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client-browser';
import { SuppliersAPI } from '@/lib/api/suppliers';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Product, Warehouse, Supplier } from '@/lib/types';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface LineItem {
  id: string;
  product_id: string;
  quantity: string;
  unit_price: string;
}

export function CreatePurchaseOrderModal({ isOpen, onClose, onSuccess }: CreatePurchaseOrderModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  // profile not needed here
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    due_date: '',
    payment_due_date: '',
    status: 'draft' as const,
    warehouse_id: '',
    request_delivery_date: '',
    expected_delivery_date: '',
    currency: 'USD',
    exchange_rate: '1.0',
    notes: '',
  });

  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', product_id: '', quantity: '', unit_price: '' }
  ]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      // Load products from MEAT and DRYGOODS categories
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('product_group', ['MEAT', 'DRYGOODS'])
        .eq('is_active', true)
        .order('part_number');

      if (productsError) throw productsError;

      // Load warehouses
      const { data: warehousesData, error: warehousesError } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (warehousesError) throw warehousesError;

      // Load suppliers
      const suppliersData = await SuppliersAPI.getAll();

      setProducts(productsData || []);
      setWarehouses(warehousesData || []);
      setSuppliers(suppliersData);
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
        
        // Auto-fill unit price and supplier when product changes
        if (field === 'product_id' && value) {
          const product = products.find(p => p.id === Number(value));
          if (product) {
            // Auto-fill unit price from std_price
            if (product.std_price) {
              updatedItem.unit_price = product.std_price.toString();
            }
            
            // Auto-select supplier from supplier_id
            if (product.supplier_id) {
              const supplier = suppliers.find(s => s.id === product.supplier_id);
              if (supplier) {
                setFormData(prev => ({ ...prev, supplier_id: supplier.id.toString() }));
                setSelectedSupplier(supplier);
              }
            }
          }
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
      if (!formData.supplier_id) {
        setError('Please select a supplier');
        setLoading(false);
        return;
      }

      // Get product details for UOM
      const lines = lineItems.map((item, index) => {
        const product = products.find(p => p.id === Number(item.product_id));
        if (!product) throw new Error(`Product not found for item ${index + 1}`);
        
        return {
          item_id: Number(item.product_id),
          uom: product.uom,
          qty_ordered: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          vat_rate: 0, // Default VAT rate
          default_location_id: formData.warehouse_id ? Number(formData.warehouse_id) : null
        };
      });

      // Use API endpoint to create PO
      const response = await fetch('/api/planning/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: Number(formData.supplier_id),
          currency: formData.currency || 'USD',
          exchange_rate: formData.currency !== 'USD' ? parseFloat(formData.exchange_rate) : 1.0,
          order_date: new Date().toISOString(),
          requested_delivery_date: formData.request_delivery_date || null,
          promised_delivery_date: formData.expected_delivery_date || null,
          payment_due_date: formData.payment_due_date || null,
          lines
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create purchase order');
      }
      
      onSuccess();
      onClose();
      setFormData({
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
      });
      setLineItems([{ id: '1', product_id: '', quantity: '', unit_price: '' }]);
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create Purchase Order</h2>
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

              {/* LINE ITEMS - GÓRA */}
              <div className="border border-slate-200 rounded-lg p-4">
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
                            data-testid={`po-line-${item.id}-product-select`}
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
                            data-testid={`po-line-${item.id}-quantity-input`}
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
                            data-testid={`po-line-${item.id}-price-input`}
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

              {/* PO HEADER FIELDS - DÓŁ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    data-testid="po-supplier-select"
                    value={formData.supplier_id}
                    onChange={(e) => {
                      const supplierId = e.target.value;
                      setFormData({ ...formData, supplier_id: supplierId });
                      const supplier = suppliers.find(s => s.id === Number(supplierId));
                      setSelectedSupplier(supplier || null);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select supplier...</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {selectedSupplier && (
                    <p className="text-xs text-slate-500 mt-1">
                      Selected: {selectedSupplier.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Warehouse
                  </label>
                  <select
                    data-testid="po-warehouse-select"
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map((warehouse) => (
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

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value, exchange_rate: e.target.value === 'USD' ? '1.0' : formData.exchange_rate })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="PLN">PLN</option>
                  </select>
                </div>

                {formData.currency !== 'USD' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Exchange Rate
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      value={formData.exchange_rate}
                      onChange={(e) => setFormData({ ...formData, exchange_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                      placeholder="1.0000"
                    />
                  </div>
                )}

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
                  <p className="text-xs text-slate-500 mt-1">Optional: Payment deadline (e.g., Net 30)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3">
            <button
              data-testid="po-cancel-button"
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
              data-testid="po-submit-button"
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
