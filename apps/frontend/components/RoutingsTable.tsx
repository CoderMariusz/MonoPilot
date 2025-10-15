'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Route } from 'lucide-react';
import { useRoutings, addRouting, updateRouting, deleteRouting } from '@/lib/clientState';
import type { Routing } from '@/lib/types';
import { useToast } from '@/lib/toast';
import { RoutingBuilder } from './RoutingBuilder';

export function RoutingsTable() {
  const routings = useRoutings();
  const { showToast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRouting, setEditingRouting] = useState<Routing | null>(null);

  const handleCreate = () => {
    setEditingRouting(null);
    setShowCreateModal(true);
  };

  const handleEdit = (routing: Routing) => {
    setEditingRouting(routing);
    setShowEditModal(true);
  };

  const handleDelete = (routing: Routing) => {
    if (confirm(`Are you sure you want to delete "${routing.name}"?`)) {
      const success = deleteRouting(routing.id);
      if (success) {
        showToast('Routing deleted successfully', 'success');
      } else {
        showToast('Failed to delete routing', 'error');
      }
    }
  };

  const handleSave = (routingData: Omit<Routing, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingRouting) {
        const success = updateRouting(editingRouting.id, routingData);
        if (success) {
          showToast('Routing updated successfully', 'success');
          setShowEditModal(false);
          setEditingRouting(null);
        } else {
          showToast('Failed to update routing', 'error');
        }
      } else {
        const success = addRouting(routingData);
        if (success) {
          showToast('Routing created successfully', 'success');
          setShowCreateModal(false);
        } else {
          showToast('Failed to create routing', 'error');
        }
      }
    } catch (error) {
      showToast('An error occurred while saving routing', 'error');
    }
  };

  const handleClose = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingRouting(null);
  };

  const getRequirementsText = (requirements: string[] = []) => {
    if (requirements.length === 0) return 'None';
    return requirements.join(', ');
  };

  const getOperationsCount = (routing: Routing) => {
    return routing.operations?.length || 0;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900">Routings</h3>
          <p className="text-sm text-slate-600">Manage production routings and their operations</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Routing
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
                  Product ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Operations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {routings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No routings found. Click "Create Routing" to create your first one.
                  </td>
                </tr>
              ) : (
                routings.map((routing) => (
                  <tr key={routing.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Route className="w-4 h-4 text-slate-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">{routing.name}</div>
                          {routing.operations && routing.operations.length > 0 && (
                            <div className="text-xs text-slate-500 mt-1">
                              {routing.operations.map(op => op.name).join(' → ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {routing.product_id || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        {getOperationsCount(routing)} operations
                      </div>
                      {routing.operations && routing.operations.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          {routing.operations.map(op => {
                            const reqs = getRequirementsText(op.requirements);
                            return `${op.name}${reqs !== 'None' ? ` (${reqs})` : ''}`;
                          }).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        routing.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {routing.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 max-w-xs truncate">
                        {routing.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(routing)}
                          className="text-slate-600 hover:text-slate-900 p-1"
                          title="Edit routing"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(routing)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete routing"
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

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <RoutingBuilder
            routing={editingRouting || undefined}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </div>
      )}
    </div>
  );
}
