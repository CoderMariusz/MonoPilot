'use client';

import { useState, useEffect } from 'react';
import { Package, Plus, RefreshCw, Eye, Loader2, Search } from 'lucide-react';
import { PalletsAPI } from '@/lib/api/pallets';
import { toast } from '@/lib/toast';

interface PalletsTableProps {
  onCreatePallet?: () => void;
  onViewPallet?: (palletId: number) => void;
}

interface Pallet {
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
  item_count: number;
  total_quantity: number;
  created_at: string;
  created_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
}

export function PalletsTable({
  onCreatePallet,
  onViewPallet
}: PalletsTableProps) {
  const [loading, setLoading] = useState(true);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [filteredPallets, setFilteredPallets] = useState<Pallet[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadPallets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pallets, searchTerm, statusFilter]);

  const loadPallets = async () => {
    setLoading(true);
    try {
      const result = await PalletsAPI.getAll();
      setPallets(result.data);
      setSummary(result.summary);
    } catch (error) {
      console.error('Error loading pallets:', error);
      toast.error('Failed to load pallets');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...pallets];

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.pallet_number.toLowerCase().includes(term) ||
        (p.wo_number && p.wo_number.toLowerCase().includes(term)) ||
        (p.location_name && p.location_name.toLowerCase().includes(term)) ||
        (p.line && p.line.toLowerCase().includes(term))
      );
    }

    setFilteredPallets(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <span className="ml-3 text-sm text-slate-600">Loading pallets...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pallets</h2>
          {summary && (
            <div className="flex items-center gap-6 mt-2 text-sm text-slate-600">
              <span>Total: {summary.total_pallets}</span>
              {Object.entries(summary.status_counts).map(([status, count]) => (
                <span key={status} className="capitalize">
                  {status}: {count as number}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadPallets}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {onCreatePallet && (
            <button
              onClick={onCreatePallet}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" />
              Create Pallet
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pallet number, WO, location..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="shipped">Shipped</option>
        </select>
      </div>

      {/* Pallets Table */}
      {filteredPallets.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">
            {searchTerm || statusFilter ? 'No pallets match your filters' : 'No pallets found'}
          </p>
          {onCreatePallet && !searchTerm && !statusFilter && (
            <button
              onClick={onCreatePallet}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm"
            >
              Create First Pallet
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pallet Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Work Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Line</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPallets.map((pallet) => (
                  <tr key={pallet.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-slate-900">
                      {pallet.pallet_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {pallet.pallet_type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        pallet.status === 'open' ? 'bg-green-100 text-green-800' :
                        pallet.status === 'closed' ? 'bg-blue-100 text-blue-800' :
                        pallet.status === 'shipped' ? 'bg-gray-100 text-gray-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {pallet.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-slate-600">
                      {pallet.wo_number || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {pallet.line || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {pallet.location_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {pallet.item_count} LP{pallet.item_count !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {pallet.total_quantity.toFixed(2)}
                      {pallet.target_boxes && (
                        <div className="text-xs text-slate-500 mt-1">
                          Target: {pallet.target_boxes} boxes
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(pallet.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {onViewPallet && (
                        <button
                          onClick={() => onViewPallet(pallet.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
            Showing {filteredPallets.length} of {pallets.length} pallets
          </div>
        </div>
      )}
    </div>
  );
}
