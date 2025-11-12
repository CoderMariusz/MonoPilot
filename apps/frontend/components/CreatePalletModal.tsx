'use client';

import { useState, useEffect } from 'react';
import { X, Package, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PalletsAPI } from '@/lib/api/pallets';
import { toast } from '@/lib/toast';

interface CreatePalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  wo_id?: number; // Optional: pre-select work order
}

interface Location {
  id: number;
  name: string;
}

interface WorkOrder {
  id: number;
  wo_number: string;
  status: string;
}

export function CreatePalletModal({
  isOpen,
  onClose,
  onSuccess,
  wo_id
}: CreatePalletModalProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [formData, setFormData] = useState({
    pallet_number: '',
    pallet_type: 'EURO' as 'EURO' | 'CHEP' | 'CUSTOM' | 'OTHER',
    wo_id: wo_id || undefined,
    line: '',
    location_id: undefined as number | undefined,
    target_boxes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadLocations();
      loadWorkOrders();
      if (wo_id) {
        setFormData(prev => ({ ...prev, wo_id }));
      }
    }
  }, [isOpen, wo_id]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const loadWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('id, wo_number, status')
        .in('status', ['Released', 'Realise', 'In Progress'])
        .order('wo_number', { ascending: false })
        .limit(50);

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error('Error loading work orders:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await PalletsAPI.create({
        pallet_number: formData.pallet_number || undefined, // Auto-generate if empty
        pallet_type: formData.pallet_type,
        wo_id: formData.wo_id,
        line: formData.line || undefined,
        location_id: formData.location_id,
        target_boxes: formData.target_boxes ? parseInt(formData.target_boxes, 10) : undefined,
        userId: user.id
      });

      toast.success(`Pallet ${result.pallet_number} created successfully`);
      if (onSuccess) onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error creating pallet:', error);
      toast.error(error.message || 'Failed to create pallet');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      pallet_number: '',
      pallet_type: 'EURO',
      wo_id: wo_id || undefined,
      line: '',
      location_id: undefined,
      target_boxes: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">Create Pallet</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Pallet Number (optional - auto-generated if empty) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pallet Number
              <span className="ml-2 text-xs text-slate-500">(Optional - auto-generated if empty)</span>
            </label>
            <input
              type="text"
              value={formData.pallet_number}
              onChange={(e) => setFormData({ ...formData, pallet_number: e.target.value })}
              placeholder="Leave empty to auto-generate"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500">
              Format: PALLET-YYYY-NNNNNN (e.g., PALLET-2025-000001)
            </p>
          </div>

          {/* Pallet Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Pallet Type *
            </label>
            <select
              value={formData.pallet_type}
              onChange={(e) => setFormData({ ...formData, pallet_type: e.target.value as any })}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              disabled={loading}
            >
              <option value="EURO">EURO (800x1200mm)</option>
              <option value="CHEP">CHEP (1000x1200mm)</option>
              <option value="CUSTOM">CUSTOM</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          {/* Work Order (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Work Order
              <span className="ml-2 text-xs text-slate-500">(Optional)</span>
            </label>
            <select
              value={formData.wo_id || ''}
              onChange={(e) => setFormData({ ...formData, wo_id: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              disabled={loading || !!wo_id} // Disable if wo_id passed as prop
            >
              <option value="">-- No Work Order --</option>
              {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                  {wo.wo_number} ({wo.status})
                </option>
              ))}
            </select>
          </div>

          {/* Line (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Production Line
              <span className="ml-2 text-xs text-slate-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.line}
              onChange={(e) => setFormData({ ...formData, line: e.target.value })}
              placeholder="e.g., Line 1, Packing Area"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              disabled={loading}
            />
          </div>

          {/* Location (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location
              <span className="ml-2 text-xs text-slate-500">(Optional)</span>
            </label>
            <select
              value={formData.location_id || ''}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              disabled={loading}
            >
              <option value="">-- Select Location --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Target Boxes (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Boxes
              <span className="ml-2 text-xs text-slate-500">(Optional)</span>
            </label>
            <input
              type="number"
              value={formData.target_boxes}
              onChange={(e) => setFormData({ ...formData, target_boxes: e.target.value })}
              min="1"
              placeholder="Expected number of boxes"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500">
              Target quantity from BOM boxes_per_pallet (if applicable)
            </p>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Pallet will be created in <strong>open</strong> status.
              Add license plates to the pallet, then close it when ready to ship.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Create Pallet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
