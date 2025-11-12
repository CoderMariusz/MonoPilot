/**
 * ASN Table Component
 * EPIC-002 Scanner & Warehouse v2 - Phase 1
 * 
 * Displays list of Advanced Shipping Notices (ASN) with:
 * - Filtering by status, supplier, date range
 * - Sorting by expected arrival
 * - Quick actions: View details, Submit, Mark received, Cancel
 * - Status badges and visual indicators
 * 
 * @component
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ASNsAPI } from '../lib/api/asns';
import type { ASN, ASNStatus } from '../lib/types';

interface ASNTableProps {
  onViewDetails?: (asn: ASN) => void;
  onCreateNew?: () => void;
  refreshTrigger?: number; // Increment to force refresh
}

export default function ASNTable({ 
  onViewDetails, 
  onCreateNew,
  refreshTrigger = 0 
}: ASNTableProps) {
  const [asns, setAsns] = useState<ASN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ASNStatus | 'all'>('all');
  const [sortAscending, setSortAscending] = useState(false);

  // Load ASNs
  const loadASNs = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const data = await ASNsAPI.getAll(filters);

      // Sort by expected arrival
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a.expected_arrival).getTime();
        const dateB = new Date(b.expected_arrival).getTime();
        return sortAscending ? dateA - dateB : dateB - dateA;
      });

      setAsns(sorted);
    } catch (err) {
      console.error('Error loading ASNs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ASNs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadASNs();
  }, [statusFilter, sortAscending, refreshTrigger]);

  const getStatusBadge = (status: ASNStatus) => {
    const styles: Record<ASNStatus, string> = {
      draft: 'bg-slate-100 text-slate-700',
      submitted: 'bg-blue-100 text-blue-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
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

  const handleQuickAction = async (asn: ASN, action: 'submit' | 'receive' | 'cancel') => {
    try {
      if (action === 'submit') {
        await ASNsAPI.submit(asn.id);
      } else if (action === 'receive') {
        await ASNsAPI.markReceived(asn.id);
      } else if (action === 'cancel') {
        if (!confirm(`Are you sure you want to cancel ASN ${asn.asn_number}?`)) {
          return;
        }
        await ASNsAPI.cancel(asn.id);
      }
      
      loadASNs(); // Refresh table
    } catch (err) {
      console.error(`Error performing ${action} on ASN:`, err);
      alert(`Failed to ${action} ASN: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading ASNs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
        <p className="text-red-700 font-medium">Error loading ASNs</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={loadASNs}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Advanced Shipping Notices</h2>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
          >
            Create ASN
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 items-center">
        <label className="text-sm font-medium text-slate-700">
          Status:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ASNStatus | 'all')}
            className="ml-2 px-3 py-1 border border-slate-300 rounded-md"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <button
          onClick={() => setSortAscending(!sortAscending)}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Sort: {sortAscending ? '↑ Oldest First' : '↓ Newest First'}
        </button>

        <div className="ml-auto text-sm text-slate-600">
          {asns.length} {asns.length === 1 ? 'ASN' : 'ASNs'}
        </div>
      </div>

      {/* Table */}
      {asns.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-md p-8 text-center">
          <p className="text-slate-600">No ASNs found</p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="mt-3 text-slate-900 underline"
            >
              Show all ASNs
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">ASN Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Supplier</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Expected Arrival</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Items</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {asns.map((asn) => (
                <tr key={asn.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">{asn.asn_number}</div>
                    {asn.po_id && asn.purchase_order && (
                      <div className="text-xs text-slate-500 mt-1">
                        PO: {asn.purchase_order.number}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {asn.supplier?.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {formatDate(asn.expected_arrival)}
                    {asn.actual_arrival && (
                      <div className="text-xs text-green-600 mt-1">
                        Arrived: {formatDate(asn.actual_arrival)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-700">
                    {asn.asn_items?.length || 0} items
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(asn.status)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(asn)}
                          className="text-sm text-slate-600 hover:text-slate-900 underline"
                        >
                          Details
                        </button>
                      )}
                      
                      {asn.status === 'draft' && (
                        <button
                          onClick={() => handleQuickAction(asn, 'submit')}
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Submit
                        </button>
                      )}
                      
                      {asn.status === 'submitted' && (
                        <button
                          onClick={() => handleQuickAction(asn, 'receive')}
                          className="text-sm text-green-600 hover:text-green-800 underline"
                        >
                          Mark Received
                        </button>
                      )}
                      
                      {(asn.status === 'draft' || asn.status === 'submitted') && (
                        <button
                          onClick={() => handleQuickAction(asn, 'cancel')}
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

