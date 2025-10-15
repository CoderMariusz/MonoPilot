'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Package } from 'lucide-react';
import { SuppliersAPI } from '@/lib/api/suppliers';
import { useSuppliers, useProducts, useTaxCodes } from '@/lib/clientState';
import type { Supplier, Product, TaxCode, SupplierProduct } from '@/lib/types';
import { SupplierProductsModal } from './SupplierProductsModal';

export function SuppliersTable() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);

  // Use mock data for now
  const mockSuppliers = useSuppliers();
  const products = useProducts();
  const taxCodes = useTaxCodes();

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const data = await SuppliersAPI.getAll();
        setSuppliers(data);
      } catch (error) {
        console.error('Error loading suppliers:', error);
        // Fallback to mock data
        setSuppliers(mockSuppliers);
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, [mockSuppliers]);

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
    } catch (error) {
      console.error('Error deleting supplier:', error);
    }
  };

  const handleManageProducts = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowProductsModal(true);
    // TODO: Load supplier products for this supplier
    setSupplierProducts([]);
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
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Supplier</h3>
            <p className="text-slate-600 mb-4">Create supplier modal will be implemented here.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Supplier</h3>
            <p className="text-slate-600 mb-4">Edit supplier modal will be implemented here.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingSupplier(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingSupplier(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
          onSave={(products) => {
            setSupplierProducts(products);
            // TODO: Save to backend
          }}
        />
      )}
    </div>
  );
}
