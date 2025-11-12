/**
 * Receive ASN Modal Component
 * EPIC-002 Scanner & Warehouse v2 - Phase 1
 * 
 * Modal for receiving ASN and creating GRN:
 * - Select ASN from submitted list
 * - Preview ASN items with batch/expiry
 * - Create GRN with prefilled items
 * - Auto-create LPs with batch/expiry
 * - Mark ASN as received
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ASNsAPI } from '../lib/api/asns';
import { supabase } from '../lib/supabase/client';
import { useAuth } from '../lib/auth/AuthContext';
import type { ASN, ASNForReceiving } from '../lib/types';
import { toast } from '../lib/toast';

interface ReceiveASNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (grnId: number, grnNumber: string) => void;
  preselectedASNId?: number;
}

export default function ReceiveASNModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedASNId,
}: ReceiveASNModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'select' | 'preview' | 'confirm'>('select');
  const [asnList, setAsnList] = useState<ASNForReceiving[]>([]);
  const [selectedASN, setSelectedASN] = useState<ASN | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Load ASNs ready for receiving
  useEffect(() => {
    if (isOpen) {
      if (preselectedASNId) {
        loadASNDetails(preselectedASNId);
      } else {
        loadASNList();
      }
    }
  }, [isOpen, preselectedASNId]);

  const loadASNList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ASNsAPI.getForReceiving();
      setAsnList(data);
    } catch (err) {
      console.error('Error loading ASNs:', err);
      setError('Failed to load ASNs for receiving');
    } finally {
      setLoading(false);
    }
  };

  const loadASNDetails = async (asnId: number) => {
    try {
      setLoading(true);
      setError(null);
      const asn = await ASNsAPI.getById(asnId);
      if (!asn) {
        throw new Error('ASN not found');
      }
      setSelectedASN(asn);
      setStep('preview');
    } catch (err) {
      console.error('Error loading ASN details:', err);
      setError('Failed to load ASN details');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectASN = (asnId: number) => {
    loadASNDetails(asnId);
  };

  const handleReceive = async () => {
    if (!selectedASN || !user) {
      setError('Missing ASN or user information');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call RPC function to create GRN from ASN
      const { data, error: rpcError } = await supabase.rpc('create_grn_from_asn', {
        p_asn_id: selectedASN.id,
        p_received_by: parseInt(user.id, 10),
        p_notes: notes || null,
      });

      if (rpcError) {
        console.error('RPC error:', rpcError);
        throw new Error(rpcError.message);
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from GRN creation');
      }

      const result = data[0];
      const grnId = result.grn_id;
      const grnNumber = result.grn_number;
      const itemsCreated = result.items_created;

      toast.success(`GRN ${grnNumber} created with ${itemsCreated} items`);

      if (onSuccess) {
        onSuccess(grnId, grnNumber);
      }

      onClose();
      resetForm();
    } catch (err) {
      console.error('Error creating GRN from ASN:', err);
      setError(err instanceof Error ? err.message : 'Failed to create GRN');
      toast.error('Failed to create GRN from ASN');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('select');
    setSelectedASN(null);
    setNotes('');
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900">
            Receive ASN {step === 'preview' && selectedASN ? `- ${selectedASN.asn_number}` : ''}
          </h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="text-slate-600">Loading...</div>
            </div>
          )}

          {!loading && step === 'select' && (
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Select an ASN to receive. The system will create a GRN with prefilled items.
              </p>

              {asnList.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-md p-8 text-center">
                  <p className="text-slate-600">No ASNs ready for receiving</p>
                  <p className="text-slate-500 text-sm mt-2">
                    ASNs must be in &quot;submitted&quot; status to be received
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {asnList.map((asn) => (
                    <button
                      key={asn.asn_id}
                      onClick={() => handleSelectASN(asn.asn_id)}
                      className="w-full text-left border border-slate-200 rounded-md p-4 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-slate-900">{asn.asn_number}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            Supplier: {asn.supplier_name}
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            Expected: {formatDate(asn.expected_arrival)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-slate-600">{asn.items_count} items</div>
                          <div className="text-sm text-slate-500">
                            Total: {asn.total_quantity}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && step === 'preview' && selectedASN && (
            <div className="space-y-6">
              {/* ASN Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Supplier</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedASN.supplier?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Expected Arrival</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(selectedASN.expected_arrival)}
                    </p>
                  </div>
                  {selectedASN.po_id && selectedASN.purchase_order && (
                    <div>
                      <p className="text-xs text-slate-500">Purchase Order</p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedASN.purchase_order.number}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Preview */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Items to Receive ({selectedASN.asn_items?.length || 0})
                </h3>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Product</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-slate-700">Quantity</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">UOM</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Batch</th>
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-700">Expiry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {selectedASN.asn_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 text-sm">
                            <div className="font-medium text-slate-900">
                              {item.product?.part_number || 'Unknown'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.product?.description || ''}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-sm text-right font-medium">
                            {item.quantity}
                          </td>
                          <td className="py-2 px-3 text-sm text-slate-700">
                            {item.uom}
                          </td>
                          <td className="py-2 px-3 text-sm text-slate-700">
                            {item.batch || '-'}
                          </td>
                          <td className="py-2 px-3 text-sm text-slate-700">
                            {item.expiry_date 
                              ? new Date(item.expiry_date).toLocaleDateString('en-GB')
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Receiving Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  rows={3}
                  placeholder="Add any notes about this receipt..."
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>What happens next:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>GRN will be created with items prefilled from ASN</li>
                  <li>Batch and expiry data will be copied to GRN items</li>
                  <li>ASN will be marked as &quot;received&quot;</li>
                  <li>You can then create License Plates from the GRN</li>
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t mt-6">
            <button
              onClick={() => {
                if (step === 'preview') {
                  setStep('select');
                  setSelectedASN(null);
                } else {
                  onClose();
                  resetForm();
                }
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
              disabled={loading}
            >
              {step === 'preview' ? 'Back' : 'Cancel'}
            </button>

            {step === 'preview' && (
              <button
                onClick={handleReceive}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-slate-400"
                disabled={loading}
              >
                {loading ? 'Creating GRN...' : 'Receive ASN & Create GRN'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

