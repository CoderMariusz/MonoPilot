'use client';

import { useState, useEffect } from 'react';
import { BomHistoryAPI } from '@/lib/api/bomHistory';
import type { BomHistory } from '@/lib/types';
import { BomHistoryModal } from '@/components/BomHistoryModal';

export default function BomHistoryPage() {
  const [history, setHistory] = useState<BomHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<BomHistory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    product: '',
    dateFrom: '',
    dateTo: '',
    user: ''
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await BomHistoryAPI.getAll({ limit: 100 });
      setHistory(data);
    } catch (error) {
      console.error('Failed to load BOM history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = history.filter(entry => {
    if (filters.product && entry.bom?.products?.part_number) {
      const partNumber = entry.bom.products.part_number.toLowerCase();
      if (!partNumber.includes(filters.product.toLowerCase())) return false;
    }
    if (filters.dateFrom && new Date(entry.changed_at) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(entry.changed_at) > new Date(filters.dateTo)) return false;
    if (filters.user && entry.changed_by_user?.email) {
      if (!entry.changed_by_user.email.toLowerCase().includes(filters.user.toLowerCase())) return false;
    }
    return true;
  });

  const handleViewDetails = (entry: BomHistory) => {
    if (entry.bom_id) {
      setSelectedEntry(entry);
      setShowModal(true);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">BOM History</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
            <input
              type="text"
              value={filters.product}
              onChange={(e) => setFilters({ ...filters, product: e.target.value })}
              placeholder="Part number..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">User</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              placeholder="User email..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No history entries found.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Changed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredHistory.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {new Date(entry.changed_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {entry.bom?.products?.part_number ? (
                      <div>
                        <div className="font-medium">{entry.bom.products.part_number}</div>
                        <div className="text-xs text-slate-500">{entry.bom.products.description}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {entry.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {entry.changed_by_user?.email || 'System'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.status_from && entry.status_to ? (
                      <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
                        {entry.status_from} → {entry.status_to}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                    {entry.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleViewDetails(entry)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedEntry && (
        <BomHistoryModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedEntry(null);
          }}
          bomId={selectedEntry.bom_id}
        />
      )}
    </div>
  );
}


