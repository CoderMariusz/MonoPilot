'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LicensePlate } from '@/lib/types';
import { toast } from '@/lib/toast';

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
      // Generate LP numbers for new LPs
      const timestamp = Date.now();
      
      // Process splits in a transaction-like manner
      for (let i = 0; i < splitItems.length; i++) {
        const item = splitItems[i];
        const quantity = parseFloat(item.quantity);

        if (i === 0) {
          // Update original LP with first split quantity
          const { error } = await supabase
            .from('license_plates')
            .update({
              quantity: quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', lpId);

          if (error) throw error;
        } else {
          // Create new LPs for additional splits
          const newLPNumber = `${lp.lp_number}-S${i}`;
          
          const { error } = await supabase
            .from('license_plates')
            .insert({
              lp_number: newLPNumber,
              lp_code: newLPNumber,
              product_id: lp.product_id,
              location_id: lp.location_id,
              quantity: quantity,
              qa_status: lp.qa_status,
              grn_id: lp.grn_id,
              item_id: lp.item_id,
              status: lp.status,
              parent_lp_id: lpId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (error) throw error;
        }
      }

      toast.success('License Plate split successfully');
      if (onSuccess) onSuccess();
      onClose();
      setSplitItems([{ id: '1', quantity: '' }, { id: '2', quantity: '' }]);
    } catch (error: any) {
      console.error('Error splitting license plate:', error);
      toast.error('Failed to split license plate');
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
          <div className="mb-6 p-4 bg-slate-50 rounded-md">
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
            </div>
          </div>

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
