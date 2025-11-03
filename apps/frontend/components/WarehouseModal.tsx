'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { WarehousesAPI } from '@/lib/api/warehouses';
import type { Warehouse } from '@/lib/types';
import { useToast } from '@/lib/toast';

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse?: Warehouse | null;
  onSuccess: () => void;
}

export function WarehouseModal({ isOpen, onClose, warehouse, onSuccess }: WarehouseModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    is_active: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (warehouse) {
        // Edit mode - populate form
        setFormData({
          code: warehouse.code || '',
          name: warehouse.name || '',
          is_active: warehouse.is_active ?? true,
        });
      } else {
        // Create mode - reset form
        setFormData({
          code: '',
          name: '',
          is_active: true,
        });
      }
    }
  }, [isOpen, warehouse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim()) {
      showToast('Code is required', 'error');
      return;
    }

    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const warehouseData = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        is_active: formData.is_active,
      };

      if (warehouse) {
        await WarehousesAPI.update(warehouse.id, warehouseData);
        showToast('Warehouse updated successfully', 'success');
      } else {
        await WarehousesAPI.create(warehouseData);
        showToast('Warehouse created successfully', 'success');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving warehouse:', error);
      showToast(error?.message || 'Failed to save warehouse', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {warehouse ? 'Edit Warehouse' : 'Add Warehouse'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
                placeholder="e.g., WH-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
                placeholder="e.g., Main Warehouse"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                Active
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : warehouse ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

