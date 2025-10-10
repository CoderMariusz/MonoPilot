'use client';

import { useState, useMemo } from 'react';
import { Eye, CheckCircle, Search } from 'lucide-react';
import { useGRNs, updateGRN } from '@/lib/clientState';
import { GRNDetailsModal } from './GRNDetailsModal';
import { toast } from '@/lib/toast';

const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export function GRNTable() {
  const grns = useGRNs();
  const [selectedGRN, setSelectedGRN] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleComplete = (id: number) => {
    const result = updateGRN(id, { 
      status: 'completed',
      received_date: new Date().toISOString()
    });
    if (result) {
      toast.success('GRN completed successfully');
    }
  };

  const filteredGRNs = useMemo(() => {
    if (!searchQuery) return grns;
    
    const query = searchQuery.toLowerCase();
    return grns.filter(grn => 
      grn.grn_number?.toLowerCase().includes(query) ||
      grn.po?.po_number?.toLowerCase().includes(query) ||
      grn.po?.supplier?.toLowerCase().includes(query)
    );
  }, [grns, searchQuery]);

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search goods receipts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GRN Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PO Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredGRNs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No items found matching your search' : 'No items found'}
                </td>
              </tr>
            ) : (
              filteredGRNs.map((grn) => (
                <tr key={grn.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{grn.grn_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{grn.po?.po_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{grn.po?.supplier || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDateTime(grn.received_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      grn.status === 'completed' ? 'bg-green-100 text-green-800' :
                      grn.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {grn.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{grn.grn_items?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedGRN(grn.id)}
                        className="text-slate-600 hover:text-slate-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {grn.status === 'draft' && (
                        <button
                          onClick={() => handleComplete(grn.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Complete"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedGRN && (
        <GRNDetailsModal
          grnId={selectedGRN}
          isOpen={selectedGRN !== null}
          onClose={() => setSelectedGRN(null)}
        />
      )}
    </>
  );
}
