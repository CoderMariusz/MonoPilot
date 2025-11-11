'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { PurchaseOrdersAPI, type QuickPOEntryLine, type QuickPOCreatedPO } from '@/lib/api/purchaseOrders';
import { ProductsAPI } from '@/lib/api/products';
import { WarehousesAPI } from '@/lib/api/warehouses';
import type { Product, Warehouse } from '@/lib/types';
import { toast } from '@/lib/toast';

interface QuickPOEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EntryLine {
  id: string;
  product_code: string;
  quantity: string;
  product?: Product;
  error?: string;
}

export function QuickPOEntryModal({ isOpen, onClose, onSuccess }: QuickPOEntryModalProps) {
  const [lines, setLines] = useState<EntryLine[]>([
    { id: '1', product_code: '', quantity: '' }
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [createdPOs, setCreatedPOs] = useState<QuickPOCreatedPO[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadWarehouses();
      setLines([{ id: '1', product_code: '', quantity: '' }]);
      setCreatedPOs([]);
      setShowResults(false);
      setSelectedWarehouse('');
    }
  }, [isOpen]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await ProductsAPI.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await WarehousesAPI.getAll();
      setWarehouses(data);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
      toast.error('Failed to load warehouses');
    }
  };

  const addLine = () => {
    setLines([...lines, { id: Date.now().toString(), product_code: '', quantity: '' }]);
  };

  const removeLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const updateLine = (id: string, field: keyof EntryLine, value: string) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updated = { ...line, [field]: value, error: undefined };
        
        // If updating product_code, try to find matching product
        if (field === 'product_code' && value) {
          const product = products.find(p => 
            p.part_number.toLowerCase() === value.toLowerCase()
          );
          
          if (product) {
            updated.product = product;
            // Validate product
            if (!product.is_active) {
              updated.error = 'Product is inactive';
            } else if (!product.supplier_id) {
              updated.error = 'Product has no supplier assigned';
            }
          } else {
            updated.product = undefined;
            updated.error = 'Product not found';
          }
        }
        
        return updated;
      }
      return line;
    }));
  };

  const validateLines = (): boolean => {
    let isValid = true;
    const updatedLines = lines.map(line => {
      let error: string | undefined;
      
      if (!line.product_code.trim()) {
        error = 'Product code required';
        isValid = false;
      } else if (!line.product) {
        error = 'Product not found';
        isValid = false;
      } else if (!line.product.is_active) {
        error = 'Product is inactive';
        isValid = false;
      } else if (!line.product.supplier_id) {
        error = 'Product has no supplier';
        isValid = false;
      }
      
      const qty = parseFloat(line.quantity);
      if (!line.quantity || isNaN(qty) || qty <= 0) {
        error = 'Quantity must be > 0';
        isValid = false;
      }
      
      return { ...line, error };
    });
    
    setLines(updatedLines);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLines()) {
      toast.error('Please fix validation errors');
      return;
    }
    
    setLoading(true);
    try {
      // Aggregate quantities for duplicate product codes (case-insensitive, preserve canonical code)
      const aggregated = new Map<string, { code: string; quantity: number }>();
      lines.forEach(line => {
        const canonicalCode = (line.product?.part_number ?? line.product_code).trim();
        const key = canonicalCode.toLowerCase();
        const qty = parseFloat(line.quantity);
        const existing = aggregated.get(key);
        if (existing) {
          aggregated.set(key, { code: existing.code, quantity: existing.quantity + qty });
        } else {
          aggregated.set(key, { code: canonicalCode, quantity: qty });
        }
      });
      
      // Build request
      const request: QuickPOEntryLine[] = Array.from(aggregated.values()).map(({ code, quantity }) => ({
        product_code: code,
        quantity
      }));
      
      const response = await PurchaseOrdersAPI.quickCreate({ 
        lines: request,
        warehouse_id: selectedWarehouse ? Number(selectedWarehouse) : undefined
      });
      
      setCreatedPOs(response.purchase_orders);
      setShowResults(true);
      
      toast.success(`Created ${response.purchase_orders.length} purchase order(s)`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (showResults) {
      onSuccess(); // Trigger refresh
    }
    onClose();
  };

  if (!isOpen) return null;

  if (showResults) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Purchase Orders Created</h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {createdPOs.map((po) => (
                <div key={po.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{po.number}</h3>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded font-medium">
                          {po.currency}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 space-y-1">
                        <div><span className="font-medium">Supplier:</span> {po.supplier_name}</div>
                        <div><span className="font-medium">Lines:</span> {po.total_lines}</div>
                        <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-100">
                          <div><span className="font-medium">Net:</span> {po.net_total.toFixed(2)}</div>
                          <div><span className="font-medium">VAT:</span> {po.vat_total.toFixed(2)}</div>
                          <div><span className="font-medium text-slate-900">Gross:</span> {po.gross_total.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    <a
                      href={`/planning?po=${po.id}`}
                      className="ml-4 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-md hover:bg-slate-800 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View PO
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border-t border-slate-200">
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Quick PO Entry</h2>
            <p className="text-sm text-slate-600 mt-1">
              Enter product codes and quantities. POs will be auto-split by supplier.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {loadingProducts ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-600">Loading products...</span>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Destination Warehouse
                  </label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="">Select warehouse (optional)...</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code} - {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Optional: Specify where goods should be delivered</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 w-1/3">
                          Product Code <span className="text-red-500">*</span>
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 w-1/3">
                          Product Name
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 w-1/6">
                          Quantity <span className="text-red-500">*</span>
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 w-16">
                          Unit
                        </th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, index) => (
                        <tr key={line.id} className="border-b border-slate-100">
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={line.product_code}
                              onChange={(e) => updateLine(line.id, 'product_code', e.target.value)}
                              className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 ${
                                line.error 
                                  ? 'border-red-300 focus:ring-red-500' 
                                  : 'border-slate-300 focus:ring-slate-900'
                              }`}
                              placeholder="Enter code..."
                              required
                            />
                            {line.error && (
                              <div className="text-xs text-red-600 mt-1">{line.error}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-slate-900">
                              {line.product?.description || '–'}
                            </div>
                            {line.product?.supplier_id && (
                              <div className="text-xs text-slate-500">
                                Supplier ID: {line.product.supplier_id}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={line.quantity}
                              onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                              placeholder="0"
                              required
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-slate-600">
                              {line.product?.uom || '–'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {lines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLine(line.id)}
                                className="text-slate-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Line
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingProducts}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Purchase Orders
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

