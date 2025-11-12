'use client';

import { useState, useEffect } from 'react';
import { X, Package, Search, Loader2, Scan } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PalletsAPI } from '@/lib/api/pallets';
import { toast } from '@/lib/toast';

interface AddLPToPalletModalProps {
  palletId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface LicensePlate {
  id: number;
  lp_number: string;
  product_description: string;
  quantity: number;
  uom: string;
  batch: string | null;
  expiry_date: string | null;
  location_name: string;
  qa_status: string;
}

export function AddLPToPalletModal({
  palletId,
  isOpen,
  onClose,
  onSuccess
}: AddLPToPalletModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableLPs, setAvailableLPs] = useState<LicensePlate[]>([]);
  const [selectedLP, setSelectedLP] = useState<LicensePlate | null>(null);
  const [quantity, setQuantity] = useState('');
  const [useFullQty, setUseFullQty] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAvailableLPs();
      setSearchTerm('');
      setSelectedLP(null);
      setQuantity('');
      setUseFullQty(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedLP && useFullQty) {
      setQuantity(selectedLP.quantity.toString());
    }
  }, [selectedLP, useFullQty]);

  const loadAvailableLPs = async () => {
    setLoading(true);
    try {
      // Get all available LPs (QA Passed, not consumed)
      const { data, error } = await supabase
        .from('license_plates')
        .select(`
          id,
          lp_number,
          quantity,
          uom,
          batch,
          expiry_date,
          qa_status,
          is_consumed,
          product:products(description),
          location:locations(name)
        `)
        .eq('qa_status', 'Passed')
        .eq('is_consumed', false)
        .order('lp_number', { ascending: false })
        .limit(100);

      if (error) throw error;

      const lps: LicensePlate[] = (data || []).map(lp => ({
        id: lp.id,
        lp_number: lp.lp_number,
        product_description: lp.product?.description || '',
        quantity: parseFloat(lp.quantity),
        uom: lp.uom,
        batch: lp.batch,
        expiry_date: lp.expiry_date,
        location_name: lp.location?.name || '',
        qa_status: lp.qa_status
      }));

      setAvailableLPs(lps);
    } catch (error) {
      console.error('Error loading available LPs:', error);
      toast.error('Failed to load available license plates');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLP) {
      toast.error('Please select a license plate');
      return;
    }

    const qtyToAdd = parseFloat(quantity);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (qtyToAdd > selectedLP.quantity) {
      toast.error(`Quantity cannot exceed LP quantity (${selectedLP.quantity})`);
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await PalletsAPI.addLP({
        pallet_id: palletId,
        lp_id: selectedLP.id,
        quantity: qtyToAdd,
        userId: user.id
      });

      toast.success(`LP ${selectedLP.lp_number} added to pallet`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error adding LP to pallet:', error);
      toast.error(error.message || 'Failed to add LP to pallet');
    } finally {
      setSaving(false);
    }
  };

  const filteredLPs = availableLPs.filter(lp =>
    lp.lp_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lp.product_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lp.batch && lp.batch.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-700" />
            <h2 className="text-xl font-semibold text-slate-900">Add LP to Pallet</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Search/Scan LP */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Search or Scan License Plate *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan barcode or type LP number, product, batch..."
                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                autoFocus
                disabled={saving}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Scan className="w-5 h-5 text-slate-400" />
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Tip: Use barcode scanner for quick LP selection
            </p>
          </div>

          {/* Available LPs List */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available License Plates ({filteredLPs.length})
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="ml-2 text-sm text-slate-500">Loading LPs...</span>
              </div>
            ) : filteredLPs.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-lg">
                <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">
                  {searchTerm ? 'No matching license plates found' : 'No available license plates'}
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Select</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">LP Number</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Batch</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Expiry</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredLPs.map((lp) => (
                      <tr
                        key={lp.id}
                        onClick={() => setSelectedLP(lp)}
                        className={`cursor-pointer hover:bg-slate-50 ${
                          selectedLP?.id === lp.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-2">
                          <input
                            type="radio"
                            name="lp_selection"
                            checked={selectedLP?.id === lp.id}
                            onChange={() => setSelectedLP(lp)}
                            className="w-4 h-4 text-blue-600"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm font-mono text-slate-900">{lp.lp_number}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{lp.product_description}</td>
                        <td className="px-4 py-2 text-sm text-slate-900">
                          {lp.quantity.toFixed(2)} {lp.uom}
                        </td>
                        <td className="px-4 py-2 text-sm font-mono text-slate-600">{lp.batch || '-'}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">
                          {lp.expiry_date ? new Date(lp.expiry_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-500">{lp.location_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Selected LP Details */}
          {selectedLP && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Selected License Plate</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-blue-700">LP:</span>{' '}
                  <span className="font-mono text-blue-900">{selectedLP.lp_number}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Product:</span>{' '}
                  <span className="text-blue-900">{selectedLP.product_description}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Available:</span>{' '}
                  <span className="text-blue-900">{selectedLP.quantity.toFixed(2)} {selectedLP.uom}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Batch:</span>{' '}
                  <span className="font-mono text-blue-900">{selectedLP.batch || 'N/A'}</span>
                </div>
              </div>

              {/* Quantity to Add */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-blue-900 mb-2">
                  Quantity to Add *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setUseFullQty(false);
                    }}
                    min="0.01"
                    max={selectedLP.quantity}
                    step="0.01"
                    required
                    disabled={useFullQty || saving}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseFullQty(true);
                      setQuantity(selectedLP.quantity.toString());
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      useFullQty
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-50'
                    }`}
                    disabled={saving}
                  >
                    Use Full Qty
                  </button>
                </div>
                {!useFullQty && parseFloat(quantity) < selectedLP.quantity && (
                  <p className="mt-1 text-xs text-blue-700">
                    Partial quantity: {quantity} / {selectedLP.quantity} {selectedLP.uom}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4">
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
              disabled={!selectedLP || saving}
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Add to Pallet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
