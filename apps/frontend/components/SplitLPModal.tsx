'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2, GitBranch } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LicensePlatesAPI } from '@/lib/api/licensePlates';
import type { LicensePlate } from '@/lib/types';
import { toast } from '@/lib/toast';
import LPGenealogyTree from './LPGenealogyTree';

interface SplitLPModalProps {
  lpId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SplitItem {
  id: string;
  quantity: string;
}

export function SplitLPModal({ lpId, isOpen, onClose, onSuccess }: SplitLPModalProps) {
  const [lp, setLp] = useState<LicensePlate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGenealogy, setShowGenealogy] = useState(false);
  const [splitItems, setSplitItems] = useState<SplitItem[]>([
    { id: '1', quantity: '' },
    { id: '2', quantity: '' }
  ]);

  useEffect(() => {
    if (isOpen && lpId) {
      loadLP();
      setSplitItems([{ id: '1', quantity: '' }, { id: '2', quantity: '' }]);
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
          ),
          location:locations (
            name
          )
        `)
        .eq('id', lpId)
        .single();

      if (error) throw error;
      setLp(data);
    } catch (error) {
      console.error('Error loading license plate:', error);
      toast.error('Failed to load license plate');
    } finally {
      setLoading(false);
    }
  };

  const totalSplitQty = splitItems.reduce((sum, item) => 
    sum + (parseFloat(item.quantity) || 0), 0
  );

  const handleAddSplit = () => {
    setSplitItems([...splitItems, { id: Date.now().toString(), quantity: '' }]);
  };

  const handleRemoveSplit = (id: string) => {
    if (splitItems.length > 2) {
      setSplitItems(splitItems.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lp) return;

    if (totalSplitQty > lp.quantity) {
      toast.error('Total split quantity exceeds available quantity');
      return;
    }

    if (totalSplitQty !== lp.quantity) {
      toast.error('Total split quantity must equal available quantity');
      return;
    }

    setSaving(true);

    try {
      // Use new API method with genealogy tracking
      const childQuantities = splitItems.map(item => ({
        quantity: parseFloat(item.quantity),
        uom: lp.product?.uom
      }));

      // Get current user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const result = await LicensePlatesAPI.split(
        lpId,
        childQuantities,
        user.id
      );

      toast.success(`License Plate split successfully into ${result.child_lps.length} LPs with genealogy tracking`);
      if (onSuccess) onSuccess();
      onClose();
      setSplitItems([{ id: '1', quantity: '' }, { id: '2', quantity: '' }]);
    } catch (error: any) {
      console.error('Error splitting license plate:', error);
      toast.error(error.message || 'Failed to split license plate');
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Split License Plate</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Current LP Info */}
          <div className="mb-6 p-4 bg-slate-50 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Current License Plate</h3>
              {lp.parent_lp_id && (
                <button
                  type="button"
                  onClick={() => setShowGenealogy(!showGenealogy)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <GitBranch className="w-4 h-4" />
                  {showGenealogy ? 'Hide' : 'View'} Genealogy
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">LP Number</label>
                <div className="text-base text-slate-900">{lp.lp_number}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Product</label>
                <div className="text-base text-slate-900">{lp.product?.description}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Available Quantity</label>
                <div className="text-base text-slate-900">{lp.quantity} {lp.product?.uom}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Total Split Qty</label>
                <div className={`text-base ${totalSplitQty > lp.quantity ? 'text-red-600' : 'text-slate-900'}`}>
                  {totalSplitQty.toFixed(2)} {lp.product?.uom}
                </div>
              </div>
              {lp.batch && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Batch</label>
                  <div className="text-base text-slate-900 font-mono">{lp.batch}</div>
                </div>
              )}
              {lp.expiry_date && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Expiry Date</label>
                  <div className="text-base text-slate-900">
                    {new Date(lp.expiry_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Info about inherited fields */}
            {(lp.batch || lp.expiry_date) && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Child LPs will inherit batch, expiry date, and QA status from this LP
                </p>
              </div>
            )}
          </div>

          {/* Genealogy View */}
          {showGenealogy && lp.parent_lp_id && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <LPGenealogyTree lpId={lpId} lpNumber={lp.lp_number} maxDepth={3} compact />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-slate-900">Split Quantities</h3>
              <button
                type="button"
                onClick={handleAddSplit}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Split
              </button>
            </div>
            
            {splitItems.map((item, index) => (
              <div key={item.id} className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Quantity {index + 1}
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...splitItems];
                      newItems[index].quantity = e.target.value;
                      setSplitItems(newItems);
                    }}
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    required
                  />
                </div>
                {splitItems.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSplit(item.id)}
                    className="mt-6 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
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
              disabled={totalSplitQty !== lp.quantity || saving}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Splitting...
                </>
              ) : (
                'Split LP'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
