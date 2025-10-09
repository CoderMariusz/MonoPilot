'use client';

import { useState } from 'react';
import { Eye, CheckCircle } from 'lucide-react';
import { useGRNs, updateGRN } from '@/lib/clientState';
import { GRNDetailsModal } from './GRNDetailsModal';
import { toast } from '@/lib/toast';

export function GRNTable() {
  const grns = useGRNs();
  const [selectedGRN, setSelectedGRN] = useState<number | null>(null);

  const handleComplete = (id: number) => {
    const result = updateGRN(id, { 
      status: 'completed',
      received_date: new Date().toISOString().split('T')[0]
    });
    if (result) {
      toast.success('GRN completed successfully');
    }
  };

  return (
    <>
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
            {grns.map((grn) => (
              <tr key={grn.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{grn.grn_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{grn.po?.po_number || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{grn.po?.supplier || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{grn.received_date || '-'}</td>
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
            ))}
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
