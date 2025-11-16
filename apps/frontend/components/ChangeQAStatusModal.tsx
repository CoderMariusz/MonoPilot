'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { QAStatus, LicensePlate } from '@/lib/types';
import { toast } from '@/lib/toast';
import { QA_STATUS_VALUES, getQAStatusLabel, getQAStatusColor } from '@/lib/warehouse/qaStatus';

interface ChangeQAStatusModalProps {
  lpId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ChangeQAStatusModal({ lpId, isOpen, onClose, onSuccess }: ChangeQAStatusModalProps) {
  const [lp, setLp] = useState<LicensePlate | null>(null);
  const [qaStatus, setQAStatus] = useState<QAStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && lpId) {
      loadLP();
    }
  }, [isOpen, lpId]);

  const loadLP = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('license_plates')
        .select(`
          *,
          product:products (
            part_number,
            description,
            uom
          )
        `)
        .eq('id', lpId)
        .single();

      if (error) throw error;
      
      setLp(data);
      setQAStatus((data.qa_status as QAStatus) || 'pending');
    } catch (error) {
      console.error('Error loading license plate:', error);
      toast.error('Failed to load license plate');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('license_plates')
        .update({
          qa_status: qaStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', lpId);

      if (error) throw error;

      toast.success('QA Status updated successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating QA status:', error);
      toast.error('Failed to update QA status');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
            <span className="ml-3 text-sm text-slate-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!lp) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <p className="text-center text-slate-600">License plate not found</p>
          <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-slate-900 text-white rounded-md">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Change QA Status</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                LP Number
              </label>
              <input
                type="text"
                value={lp.lp_number}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product
              </label>
              <input
                type="text"
                value={lp.product?.description || 'N/A'}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current QA Status
              </label>
              <div className="px-3 py-2 border border-slate-300 rounded-md bg-slate-50">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getQAStatusColor(lp.qa_status as QAStatus)}`}>
                  {getQAStatusLabel(lp.qa_status as QAStatus)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New QA Status
              </label>
              <select
                value={qaStatus}
                onChange={(e) => setQAStatus(e.target.value as QAStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                {QA_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>{getQAStatusLabel(status)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
