/**
 * ASN Details Modal Component
 * EPIC-002 Scanner & Warehouse v2 - Phase 1
 * 
 * Displays full ASN details:
 * - Header info (supplier, dates, status)
 * - Items list with batch/expiry
 * - Actions (Submit, Mark Received, Edit, Delete)
 * - Related GRNs/LPs (if received)
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ASNsAPI } from '../lib/api/asns';
import type { ASN, ASNStatus } from '../lib/types';

interface ASNDetailsModalProps {
  asnId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ASNDetailsModal({
  asnId,
  isOpen,
  onClose,
  onRefresh,
}: ASNDetailsModalProps) {
  const [asn, setAsn] = useState<ASN | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && asnId) {
      loadASN();
    }
  }, [isOpen, asnId]);

  const loadASN = async () => {
    if (!asnId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await ASNsAPI.getById(asnId);
      setAsn(data);
    } catch (err) {
      console.error('Error loading ASN:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ASN');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'submit' | 'receive' | 'cancel' | 'delete') => {
    if (!asn) return;

    try {
      if (action === 'delete') {
        if (!confirm(`Are you sure you want to delete ASN ${asn.asn_number}?`)) {
          return;
        }
        await ASNsAPI.delete(asn.id);
        onClose();
      } else if (action === 'submit') {
        await ASNsAPI.submit(asn.id);
        loadASN();
      } else if (action === 'receive') {
        await ASNsAPI.markReceived(asn.id);
        loadASN();
      } else if (action === 'cancel') {
        if (!confirm(`Are you sure you want to cancel ASN ${asn.asn_number}?`)) {
          return;
        }
        await ASNsAPI.cancel(asn.id);
        loadASN();
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert(`Failed to ${action} ASN: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getStatusBadge = (status: ASNStatus) => {
    const styles: Record<ASNStatus, string> = {
      draft: 'bg-slate-100 text-slate-700',
      submitted: 'bg-blue-100 text-blue-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    return (
      <span className={`px-3 py-1 text-sm font-medium rounded ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
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
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              {asn ? asn.asn_number : 'ASN Details'}
            </h2>
            {asn && getStatusBadge(asn.status)}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="text-slate-600">Loading ASN...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {asn && !loading && (
            <div className="space-y-6">
              {/* ASN Header Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Supplier Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Supplier</p>
                      <p className="text-sm font-medium text-slate-900">
                        {asn.supplier?.name || 'Unknown'}
                      </p>
                    </div>
                    {asn.supplier?.email && (
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm text-slate-700">{asn.supplier.email}</p>
                      </div>
                    )}
                    {asn.supplier?.phone && (
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="text-sm text-slate-700">{asn.supplier.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Shipment Details</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Expected Arrival</p>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDate(asn.expected_arrival)}
                      </p>
                    </div>
                    {asn.actual_arrival && (
                      <div>
                        <p className="text-xs text-slate-500">Actual Arrival</p>
                        <p className="text-sm font-medium text-green-700">
                          {formatDate(asn.actual_arrival)}
                        </p>
                      </div>
                    )}
                    {asn.po_id && asn.purchase_order && (
                      <div>
                        <p className="text-xs text-slate-500">Purchase Order</p>
                        <p className="text-sm text-slate-700">
                          {asn.purchase_order.number} ({asn.purchase_order.status})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {asn.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Notes</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
                    {asn.notes}
                  </p>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Items ({asn.asn_items?.length || 0})
                </h3>
                {asn.asn_items && asn.asn_items.length > 0 ? (
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
                        {asn.asn_items.map((item) => (
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
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-center text-slate-600">
                    No items in this ASN
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  {asn.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleAction('submit')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Submit ASN
                      </button>
                      <button
                        onClick={() => handleAction('delete')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {asn.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleAction('receive')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Mark as Received
                      </button>
                      <button
                        onClick={() => handleAction('cancel')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Cancel ASN
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

