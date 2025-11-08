'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { RoutingOperationNamesAPI } from '@/lib/api/routingOperationNames';
import type { RoutingOperationName } from '@/lib/types';
import { useToast } from '@/lib/toast';

export function RoutingOperationNamesTable() {
  const { showToast } = useToast();
  const [operationNames, setOperationNames] = useState<RoutingOperationName[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RoutingOperationName | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    description: '',
    is_active: true,
  });

  useEffect(() => {
    fetchOperationNames();
  }, []);

  const fetchOperationNames = async () => {
    try {
      setLoading(true);
      const data = await RoutingOperationNamesAPI.getAllIncludingInactive();
      setOperationNames(data);
    } catch (error) {
      console.error('Error fetching operation names:', error);
      showToast('Failed to load operation names', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      alias: '',
      description: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item: RoutingOperationName) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      alias: item.alias || '',
      description: item.description || '',
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast('Please enter an operation name', 'error');
      return;
    }

    try {
      if (editingItem) {
        await RoutingOperationNamesAPI.update(editingItem.id, formData);
        showToast('Operation name updated successfully', 'success');
      } else {
        await RoutingOperationNamesAPI.create(formData);
        showToast('Operation name created successfully', 'success');
      }
      
      await fetchOperationNames();
      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving operation name:', error);
      showToast(error.message || 'Failed to save operation name', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this operation name?')) {
      return;
    }

    try {
      await RoutingOperationNamesAPI.delete(id);
      showToast('Operation name deactivated successfully', 'success');
      await fetchOperationNames();
    } catch (error: any) {
      console.error('Error deleting operation name:', error);
      showToast(error.message || 'Failed to delete operation name', 'error');
    }
  };

  const handleToggleActive = async (item: RoutingOperationName) => {
    try {
      await RoutingOperationNamesAPI.update(item.id, {
        is_active: !item.is_active
      });
      showToast(`Operation name ${!item.is_active ? 'activated' : 'deactivated'} successfully`, 'success');
      await fetchOperationNames();
    } catch (error: any) {
      console.error('Error toggling operation name:', error);
      showToast(error.message || 'Failed to update operation name', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Routing Operation Names</h3>
          <p className="text-sm text-slate-600">Manage standard operation names used in routing definitions</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Operation Name
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Alias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {operationNames.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                      No operation names found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  operationNames.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.alias || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(item)}
                            className="text-slate-600 hover:text-slate-900"
                            title={item.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
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
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingItem ? 'Edit Operation Name' : 'Add Operation Name'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-600 hover:text-slate-900"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g., Smoke"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alias
                </label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g., SMK"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  rows={3}
                  placeholder="Describe this operation"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
              >
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

