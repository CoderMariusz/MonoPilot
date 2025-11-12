'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, GitBranch } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LocationsAPI } from '@/lib/api/locations';
import type { Location, LicensePlate } from '@/lib/types';
import { toast } from '@/lib/toast';
import LPGenealogyTree from './LPGenealogyTree';

interface AmendLPModalProps {
  lpId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AmendLPModal({ lpId, isOpen, onClose, onSuccess }: AmendLPModalProps) {
  const [lp, setLp] = useState<LicensePlate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGenealogy, setShowGenealogy] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [locationId, setLocationId] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (isOpen && lpId) {
      loadData();
    }
  }, [isOpen, lpId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load LP
      const { data: lpData, error: lpError } = await supabase
        .from('license_plates')
        .select(`
          *,
          product:products (
            part_number,
            description,
            uom
          ),
          location:locations (
            name,
            warehouse:warehouses (
              code,
              name
            )
          )
        `)
        .eq('id', lpId)
        .single();

      if (lpError) throw lpError;
      
      setLp(lpData);
      setQuantity(lpData.quantity.toString());
      setLocationId(lpData.location_id || 0);
      setNotes('');

      // Load locations
      const locationsData = await LocationsAPI.getAll();
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load license plate');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lp) return;

    setSaving(true);

    try {
      // Update LP
      const { error } = await supabase
        .from('license_plates')
        .update({
          quantity: parseFloat(quantity),
          location_id: locationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', lpId);

      if (error) throw error;

      // If notes provided, record in genealogy (amendment note)
      if (notes.trim()) {
        const { data: { user } } = await supabase.auth.getUser();

        const { error: noteError } = await supabase
          .from('lp_genealogy')
          .insert({
            child_lp_id: lpId,
            parent_lp_id: lp.parent_lp_id || null,
            quantity_consumed: 0, // Amendment doesn't consume
            uom: lp.product?.uom || 'kg',
            wo_id: null,
            operation_sequence: null,
            notes: `Amendment: ${notes} | Qty: ${lp.quantity} → ${quantity} | Location: ${lp.location?.name} → ${locations.find(l => l.id === locationId)?.name}`
          });

        if (noteError) console.error('Failed to record amendment note:', noteError);
      }

      toast.success('License Plate updated successfully');
      if (onSuccess) onSuccess();
      onClose();
      setNotes('');
    } catch (error: any) {
      console.error('Error updating license plate:', error);
      toast.error('Failed to update license plate');
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
          <h2 className="text-xl font-semibold text-slate-900">Amend License Plate</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Parent LP Info & Genealogy */}
          {lp.parent_lp_id && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <GitBranch className="w-4 h-4" />
                  <span className="font-medium">This LP was created from a split operation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenealogy(!showGenealogy)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showGenealogy ? 'Hide' : 'View'} Genealogy
                </button>
              </div>
              {showGenealogy && (
                <div className="mt-3">
                  <LPGenealogyTree lpId={lpId} lpNumber={lp.lp_number} maxDepth={3} compact />
                </div>
              )}
            </div>
          )}

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

            <div className="grid grid-cols-2 gap-4">
              {lp.batch && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={lp.batch}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600 font-mono"
                  />
                </div>
              )}
              {lp.expiry_date && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={new Date(lp.expiry_date).toLocaleDateString()}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current Location
              </label>
              <input
                type="text"
                value={lp.location?.name || 'N/A'}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Location *
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                <option value={0}>Select location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.warehouse?.code} - {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amendment Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reason for amendment (e.g., inventory correction, location change...)"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500">
                Amendment notes will be recorded in genealogy history for traceability
              </p>
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
                'Update LP'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
