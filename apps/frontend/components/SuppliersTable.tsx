'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import { SuppliersAPI } from '@/lib/api/suppliers';
import type { Supplier, Product, TaxCode, SupplierProduct } from '@/lib/types';
import { SupplierProductsModal } from './SupplierProductsModal';
import { SupplierModal } from './SupplierModal';
import { useToast } from '@/lib/toast';
import { useProducts, useTaxCodes } from '@/lib/clientState';

export function SuppliersTable() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const { products } = useProducts();
  const taxCodes = useTaxCodes();

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const data = await SuppliersAPI.getAll();
        setSuppliers(data);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        showToast('Failed to load suppliers', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, [showToast]);

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      await SuppliersAPI.update(supplier.id, { is_active: !supplier.is_active });
      setSuppliers(prev => prev.map(s => 
        s.id === supplier.id ? { ...s, is_active: !supplier.is_active } : s
      ));
    } catch (error) {
      console.error('Error toggling supplier status:', error);
    }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Are you sure you want to delete ${supplier.name}?`)) return;
    
    try {
      await SuppliersAPI.delete(supplier.id);
      setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
      showToast('Supplier deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showToast('Failed to delete supplier', 'error');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
  };

  const handleCreateSuccess = () => {
    const loadSuppliers = async () => {
      try {
        const data = await SuppliersAPI.getAll();
        setSuppliers(data);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        showToast('Failed to load suppliers', 'error');
      }
    };
    loadSuppliers();
  };

  const handleManageProducts = async (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    try {
      const { SupplierProductsAPI } = await import('@/lib/api/supplierProducts');
      const products = await SupplierProductsAPI.getBySupplier(supplier.id);
      setSupplierProducts(products);
    } catch (error) {
      console.error('Failed to load supplier products:', error);
      showToast('Failed to load supplier products', 'error');
      setSupplierProducts([]);
    }
    setShowProductsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Suppliers</h3>
          <p className="text-sm text-slate-600">Manage your suppliers and vendors</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Legal Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {supplier.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {supplier.legal_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {supplier.country || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {supplier.currency || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {supplier.payment_terms || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleManageProducts(supplier)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Manage products"
                        >
                          <Package className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingSupplier(supplier)}
                          className="text-slate-600 hover:text-slate-900 p-1"
                          title="Edit supplier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(supplier)}
                          className={`p-1 ${
                            supplier.is_active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={supplier.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {supplier.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TODO: Add CreateSupplierModal and EditSupplierModal components */}
      <SupplierModal
        isOpen={showCreateModal || !!editingSupplier}
        onClose={() => {
          setShowCreateModal(false);
          setEditingSupplier(null);
        }}
        supplier={editingSupplier}
        onSuccess={handleCreateSuccess}
      />

      {/* Supplier Products Modal */}
      {showProductsModal && selectedSupplier && (
        <SupplierProductsModal
          supplier={selectedSupplier}
          products={products}
          taxCodes={taxCodes}
          supplierProducts={supplierProducts}
          onClose={() => {
            setShowProductsModal(false);
            setSelectedSupplier(null);
          }}
          onSave={async (products) => {
            try {
              const { SupplierProductsAPI } = await import('@/lib/api/supplierProducts');
              
              // Get original products to compare
              const originalIds = new Set(supplierProducts.map(p => p.id));
              const currentIds = new Set(products.map(p => p.id));
              
              // Find products to delete (in original but not in current)
              const toDelete = supplierProducts.filter(p => !currentIds.has(p.id) && p.id > 0);
              for (const product of toDelete) {
                await SupplierProductsAPI.delete(product.id);
              }
              
              // Find products to create (negative IDs or not in original)
              const toCreate = products.filter(p => p.id < 0 || !originalIds.has(p.id));
              for (const product of toCreate) {
                await SupplierProductsAPI.create({
                  supplier_id: product.supplier_id,
                  product_id: product.product_id,
                  supplier_sku: product.supplier_sku,
                  lead_time_days: product.lead_time_days,
                  moq: product.moq,
                  price_excl_tax: product.price_excl_tax,
                  tax_code_id: product.tax_code_id,
                  currency: product.currency,
                  is_active: product.is_active ?? true,
                });
              }
              
              // Find products to update (positive IDs that exist in both)
              const toUpdate = products.filter(p => p.id > 0 && originalIds.has(p.id));
              for (const product of toUpdate) {
                const original = supplierProducts.find(op => op.id === product.id);
                if (original && (
                  original.supplier_sku !== product.supplier_sku ||
                  original.lead_time_days !== product.lead_time_days ||
                  original.moq !== product.moq ||
                  original.price_excl_tax !== product.price_excl_tax ||
                  original.tax_code_id !== product.tax_code_id ||
                  original.currency !== product.currency ||
                  original.is_active !== product.is_active
                )) {
                  await SupplierProductsAPI.update(product.id, {
                    supplier_sku: product.supplier_sku,
                    lead_time_days: product.lead_time_days,
                    moq: product.moq,
                    price_excl_tax: product.price_excl_tax,
                    tax_code_id: product.tax_code_id,
                    currency: product.currency,
                    is_active: product.is_active ?? true,
                  });
                }
              }
              
              // Reload products from backend
              const updatedProducts = await SupplierProductsAPI.getBySupplier(selectedSupplier!.id);
              setSupplierProducts(updatedProducts);
              showToast('Supplier products saved successfully', 'success');
            } catch (error) {
              console.error('Failed to save supplier products:', error);
              showToast('Failed to save supplier products', 'error');
            }
          }}
        />
      )}
    </div>
  );
}
