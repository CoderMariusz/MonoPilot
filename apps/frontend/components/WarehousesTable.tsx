'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { WarehousesAPI } from '@/lib/api/warehouses';
import { useWarehouses } from '@/lib/clientState';
import type { Warehouse } from '@/lib/types';

export function WarehousesTable() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Use mock data for now
  const mockWarehouses = useWarehouses();

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoading(true);
        const data = await WarehousesAPI.getAll();
        setWarehouses(data);
      } catch (error) {
        console.error('Error loading warehouses:', error);
        // Fallback to mock data
        setWarehouses(mockWarehouses);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouses();
  }, [mockWarehouses]);

  const handleToggleActive = async (warehouse: Warehouse) => {
    try {
      await WarehousesAPI.update(warehouse.id, { is_active: !warehouse.is_active });
      setWarehouses(prev => prev.map(w => 
        w.id === warehouse.id ? { ...w, is_active: !warehouse.is_active } : w
      ));
    } catch (error) {
      console.error('Error toggling warehouse status:', error);
    }
  };

  const handleDelete = async (warehouse: Warehouse) => {
    if (!confirm(`Are you sure you want to delete ${warehouse.name}?`)) return;
    
    try {
      await WarehousesAPI.delete(warehouse.id);
      setWarehouses(prev => prev.filter(w => w.id !== warehouse.id));
    } catch (error) {
      console.error('Error deleting warehouse:', error);
    }
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
          <h3 className="text-lg font-medium text-slate-900">Warehouses</h3>
          <p className="text-sm text-slate-600">Manage your warehouses and storage locations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Warehouse
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {warehouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No warehouses found
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">
                        {warehouse.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {warehouse.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        warehouse.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {warehouse.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {new Date(warehouse.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingWarehouse(warehouse)}
                          className="text-slate-600 hover:text-slate-900 p-1"
                          title="Edit warehouse"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(warehouse)}
                          className={`p-1 ${
                            warehouse.is_active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={warehouse.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {warehouse.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(warehouse)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete warehouse"
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

      {/* TODO: Add CreateWarehouseModal and EditWarehouseModal components */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Warehouse</h3>
            <p className="text-slate-600 mb-4">Create warehouse modal will be implemented here.</p>
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

      {editingWarehouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Warehouse</h3>
            <p className="text-slate-600 mb-4">Edit warehouse modal will be implemented here.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingWarehouse(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => setEditingWarehouse(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
