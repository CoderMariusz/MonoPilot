'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import type { Supplier, Product, TaxCode, SupplierProduct } from '@/lib/types';

interface SupplierProductsModalProps {
  supplier: Supplier;
  products: Product[];
  taxCodes: TaxCode[];
  supplierProducts: SupplierProduct[];
  onClose: () => void;
  onSave: (products: SupplierProduct[]) => void;
}

export function SupplierProductsModal({
  supplier,
  products,
  taxCodes,
  supplierProducts,
  onClose,
  onSave
}: SupplierProductsModalProps) {
  const [localProducts, setLocalProducts] = useState<SupplierProduct[]>(supplierProducts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<SupplierProduct>>({
    product_id: undefined,
    supplier_sku: '',
    lead_time_days: undefined,
    moq: undefined,
    price_excl_tax: undefined,
    tax_code_id: undefined,
    currency: 'USD',
    is_active: true,
  });

  useEffect(() => {
    setLocalProducts(supplierProducts);
  }, [supplierProducts]);

  const handleAddProduct = () => {
    if (!newProduct.product_id) return;

    const product: SupplierProduct = {
      id: Math.max(...localProducts.map(p => p.id), 0) + 1,
      supplier_id: supplier.id,
      product_id: newProduct.product_id,
      supplier_sku: newProduct.supplier_sku || '',
      lead_time_days: newProduct.lead_time_days,
      moq: newProduct.moq,
      price_excl_tax: newProduct.price_excl_tax,
      tax_code_id: newProduct.tax_code_id,
      currency: newProduct.currency || 'USD',
      is_active: newProduct.is_active ?? true,
    };

    setLocalProducts(prev => [...prev, product]);
    setNewProduct({
      product_id: undefined,
      supplier_sku: '',
      lead_time_days: undefined,
      moq: undefined,
      price_excl_tax: undefined,
      tax_code_id: undefined,
      currency: 'USD',
      is_active: true,
    });
    setShowAddForm(false);
  };

  const handleRemoveProduct = (id: number) => {
    setLocalProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleUpdateProduct = (id: number, updates: Partial<SupplierProduct>) => {
    setLocalProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const handleSave = () => {
    onSave(localProducts);
    onClose();
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.part_number} - ${product.description}` : 'Unknown Product';
  };

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
              Configure supplier-specific pricing, lead times, and product details
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
                    value={newProduct.product_id || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, product_id: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Select product...</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.part_number} - {product.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Supplier SKU
                  </label>
                  <input
                    type="text"
                    value={newProduct.supplier_sku || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, supplier_sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="Supplier's SKU"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.lead_time_days || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, lead_time_days: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="7"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    MOQ
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.moq || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, moq: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="50.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price (excl. tax)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price_excl_tax || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price_excl_tax: parseFloat(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    placeholder="12.50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tax Code
                  </label>
                  <select
                    value={newProduct.tax_code_id || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, tax_code_id: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="">Select tax code...</option>
                    {taxCodes.map(taxCode => (
                      <option key={taxCode.id} value={taxCode.id}>
                        {taxCode.code} ({(taxCode.rate * 100).toFixed(1)}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProduct}
                  disabled={!newProduct.product_id}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Add Product
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
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Supplier SKU
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
                  {localProducts.length === 0 ? (
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
                            {getProductName(product.product_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={product.supplier_sku || ''}
                            onChange={(e) => handleUpdateProduct(product.id, { supplier_sku: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                            placeholder="Supplier SKU"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={product.lead_time_days || ''}
                            onChange={(e) => handleUpdateProduct(product.id, { lead_time_days: parseInt(e.target.value) || undefined })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                            placeholder="Days"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.moq || ''}
                            onChange={(e) => handleUpdateProduct(product.id, { moq: parseFloat(e.target.value) || undefined })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.price_excl_tax || ''}
                            onChange={(e) => handleUpdateProduct(product.id, { price_excl_tax: parseFloat(e.target.value) || undefined })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={product.tax_code_id || ''}
                            onChange={(e) => handleUpdateProduct(product.id, { tax_code_id: parseInt(e.target.value) || undefined })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                          >
                            <option value="">Select...</option>
                            {taxCodes.map(taxCode => (
                              <option key={taxCode.id} value={taxCode.id}>
                                {taxCode.code}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={product.is_active}
                              onChange={(e) => handleUpdateProduct(product.id, { is_active: e.target.checked })}
                              className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                            />
                            <span className="ml-2 text-sm text-slate-700">Active</span>
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleRemoveProduct(product.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Remove product"
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
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
