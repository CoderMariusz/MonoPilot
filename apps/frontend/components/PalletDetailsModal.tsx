'use client';

import { useState, useEffect } from 'react';
import { X, Package, Plus, Trash2, Lock, Unlock, Truck, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PalletsAPI } from '@/lib/api/pallets';
import { toast } from '@/lib/toast';

interface PalletDetailsModalProps {
  palletId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onAddLP?: () => void; // Callback to open AddLPToPalletModal
}

interface PalletDetails {
  pallet: {
    id: number;
    pallet_number: string;
    pallet_type: string;
    wo_id: number | null;
    wo_number: string | null;
    line: string | null;
    location_id: number | null;
    location_name: string | null;
    status: string;
    target_boxes: number | null;
    actual_boxes: number | null;
    created_at: string;
    created_by: string | null;
    closed_at: string | null;
    closed_by: string | null;
  };
  items: Array<{
    id: number;
    lp_id: number;
    lp_number: string;
    product_description: string;
    quantity: number;
    uom: string;
    batch: string | null;
    expiry_date: string | null;
    added_at: string;
    added_by: string | null;
  }>;
}

export function PalletDetailsModal({
  palletId,
  isOpen,
  onClose,
  onSuccess,
  onAddLP
}: PalletDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<PalletDetails | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && palletId) {
      loadDetails();
    }
  }, [isOpen, palletId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await PalletsAPI.getById(palletId);
      setDetails(data);
    } catch (error) {
      console.error('Error loading pallet details:', error);
      toast.error('Failed to load pallet details');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLP = async (lpId: number, lpNumber: string) => {
    if (!confirm(`Remove LP ${lpNumber} from pallet?`)) return;

    setActionLoading(`remove-${lpId}`);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await PalletsAPI.removeLP({
        pallet_id: palletId,
        lp_id: lpId,
        userId: user.id
      });

      toast.success(`LP ${lpNumber} removed from pallet`);
      await loadDetails();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error removing LP:', error);
      toast.error(error.message || 'Failed to remove LP');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClosePallet = async () => {
    if (!confirm('Close this pallet? No more items can be added after closing.')) return;

    setActionLoading('close');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await PalletsAPI.close({
        pallet_id: palletId,
        actual_boxes: details?.items.length,
        userId: user.id
      });

      toast.success('Pallet closed successfully');
      await loadDetails();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error closing pallet:', error);
      toast.error(error.message || 'Failed to close pallet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReopenPallet = async () => {
    if (!confirm('Reopen this pallet? You will be able to add/remove items again.')) return;

    setActionLoading('reopen');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await PalletsAPI.reopen({
        pallet_id: palletId,
        userId: user.id
      });

      toast.success('Pallet reopened successfully');
      await loadDetails();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error reopening pallet:', error);
      toast.error(error.message || 'Failed to reopen pallet');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkShipped = async () => {
    if (!confirm('Mark this pallet as shipped? This action cannot be undone.')) return;

    setActionLoading('ship');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await PalletsAPI.markShipped({
        pallet_id: palletId,
        userId: user.id
      });

      toast.success('Pallet marked as shipped');
      await loadDetails();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error marking pallet as shipped:', error);
      toast.error(error.message || 'Failed to mark as shipped');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
            <span className="ml-3 text-sm text-slate-600">Loading pallet details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
          <p className="text-center text-slate-600">Pallet not found</p>
          <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-slate-900 text-white rounded-md">
            Close
          </button>
        </div>
      </div>
    );
  }

  const { pallet, items } = details;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-slate-700" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{pallet.pallet_number}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  pallet.status === 'open' ? 'bg-green-100 text-green-800' :
                  pallet.status === 'closed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {pallet.status.toUpperCase()}
                </span>
                <span className="text-sm text-slate-500">{pallet.pallet_type}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pallet Info */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Work Order</label>
              <div className="text-sm font-medium text-slate-900">
                {pallet.wo_number || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Line</label>
              <div className="text-sm font-medium text-slate-900">
                {pallet.line || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
              <div className="text-sm font-medium text-slate-900">
                {pallet.location_name || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Items</label>
              <div className="text-sm font-medium text-slate-900">
                {items.length} LP{items.length !== 1 ? 's' : ''} ({totalQuantity.toFixed(2)} total)
              </div>
            </div>
          </div>

          {pallet.target_boxes && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-xs font-medium text-slate-500 mb-1">Target/Actual Boxes</label>
              <div className="text-sm font-medium text-slate-900">
                {pallet.actual_boxes || 0} / {pallet.target_boxes}
                {pallet.target_boxes && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({Math.round((pallet.actual_boxes || 0) / pallet.target_boxes * 100)}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">Pallet Contents</h3>
            {pallet.status === 'open' && onAddLP && (
              <button
                onClick={onAddLP}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800"
              >
                <Plus className="w-4 h-4" />
                Add LP
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">No items on this pallet yet</p>
              {pallet.status === 'open' && onAddLP && (
                <button
                  onClick={onAddLP}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm"
                >
                  Add First LP
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">LP Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Added</th>
                    {pallet.status === 'open' && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">{item.lp_number}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.product_description}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {item.quantity.toFixed(2)} {item.uom}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{item.batch || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(item.added_at).toLocaleDateString()}
                      </td>
                      {pallet.status === 'open' && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveLP(item.lp_id, item.lp_number)}
                            disabled={actionLoading === `remove-${item.lp_id}`}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Remove LP"
                          >
                            {actionLoading === `remove-${item.lp_id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            Created {new Date(pallet.created_at).toLocaleString()}
            {pallet.closed_at && (
              <> • Closed {new Date(pallet.closed_at).toLocaleString()}</>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Close
            </button>

            {pallet.status === 'open' && items.length > 0 && (
              <button
                onClick={handleClosePallet}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === 'close' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                Close Pallet
              </button>
            )}

            {pallet.status === 'closed' && (
              <>
                <button
                  onClick={handleReopenPallet}
                  disabled={!!actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                >
                  {actionLoading === 'reopen' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  Reopen
                </button>
                <button
                  onClick={handleMarkShipped}
                  disabled={!!actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading === 'ship' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                  Mark as Shipped
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
