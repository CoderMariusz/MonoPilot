'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import type { Supplier, Product, TaxCode } from '@/lib/types';
import { ProductsAPI } from '@/lib/api/products';

interface SupplierProductsModalProps {
  supplier: Supplier;
  products: Product[]; // All products
  taxCodes: TaxCode[];
  onClose: () => void;
  onSave: () => void; // Callback after save, parent will refresh
}

export function SupplierProductsModal({
  supplier,
  products: allProducts,
  taxCodes,
  onClose,
  onSave
}: SupplierProductsModalProps) {
  // Filter products by supplier_id
  const supplierProducts = allProducts.filter(p => p.supplier_id === supplier.id);
  const [localProducts, setLocalProducts] = useState<Product[]>(supplierProducts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const filtered = allProducts.filter(p => p.supplier_id === supplier.id);
    setLocalProducts(filtered);
  }, [allProducts, supplier.id]);

  const handleAddProduct = async () => {
    if (!selectedProductId) return;

    // Check if product already assigned to this supplier
    const existing = localProducts.find(p => p.id === selectedProductId);
    if (existing) {
      alert('This product is already assigned to this supplier');
      return;
    }

    setLoading(true);
    try {
      const productToUpdate = allProducts.find(p => p.id === selectedProductId);
      if (!productToUpdate) {
        alert('Product not found');
        return;
      }

      // Update product's supplier_id
      await ProductsAPI.update(selectedProductId, {
        supplier_id: supplier.id
      });

      // Update local state
      const updatedProduct = { ...productToUpdate, supplier_id: supplier.id };
      setLocalProducts(prev => [...prev, updatedProduct]);
      
      setSelectedProductId(undefined);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product to supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to remove this product from this supplier?')) {
      return;
    }

    setLoading(true);
    try {
      // Update product's supplier_id to NULL
      await ProductsAPI.update(productId, {
        supplier_id: null
      });

      // Update local state
      setLocalProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Failed to remove product:', error);
      alert('Failed to remove product from supplier');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // All changes are saved immediately when adding/removing, so just call onSave
    onSave();
    onClose();
  };

  // Get products that are NOT assigned to this supplier (for "Add Product" dropdown)
  const availableProducts = allProducts.filter(p => 
    p.supplier_id !== supplier.id && p.is_active
  );

  const getTaxCodeName = (taxCodeId?: number) => {
    if (!taxCodeId) return '-';
    const taxCode = taxCodes.find(tc => tc.id === taxCodeId);
    return taxCode ? `${taxCode.code} (${(taxCode.rate * 100).toFixed(1)}%)` : '-';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Manage Products - {supplier.name}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Products assigned to this supplier
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Add Product Form */}
          {showAddForm && (
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-medium text-slate-900 mb-4">Add Product</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProductId || ''}
                    onChange={(e) => setSelectedProductId(parseInt(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    disabled={loading}
                  >
                    <option value="">Select product...</option>
                    {availableProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.part_number} - {product.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedProductId(undefined);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={!selectedProductId || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
              </div>
            </div>
          )}

          {/* Products Table */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h4 className="text-lg font-medium text-slate-900">Supplier Products</h4>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Part Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Lead Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      MOQ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Tax Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {!localProducts || localProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        No products configured for this supplier. Click "Add Product" to get started.
                      </td>
                    </tr>
                  ) : (
                    localProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {product.part_number}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900">
                            {product.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {product.lead_time_days ? `${product.lead_time_days} days` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {product.moq || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {product.std_price ? `$${product.std_price.toFixed(2)}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {getTaxCodeName(product.tax_code_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleRemoveProduct(product.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Remove product from supplier"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
