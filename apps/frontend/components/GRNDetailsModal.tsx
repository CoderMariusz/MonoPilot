'use client';

import { X } from 'lucide-react';
import { useGRNs } from '@/lib/clientState';

interface GRNDetailsModalProps {
  grnId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function GRNDetailsModal({ grnId, isOpen, onClose }: GRNDetailsModalProps) {
  const grns = useGRNs();
  const grn = grns.find(g => g.id === grnId);

  if (!isOpen || !grn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">GRN Details - {grn.grn_number}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PO Number</label>
              <div className="text-base text-slate-900">{grn.po?.po_number || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <div className="text-base text-slate-900">{grn.po?.supplier || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                grn.status === 'completed' ? 'bg-green-100 text-green-800' :
                grn.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {grn.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Received Date</label>
              <div className="text-base text-slate-900">{grn.received_date || 'Not received'}</div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-slate-900 mb-4">Received Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Ordered</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Received</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Location</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">LP Number</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {grn.grn_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-slate-900">{item.product?.description || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">{item.quantity_ordered}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">{item.quantity_received}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">{item.location?.name || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm text-slate-600">{item.lp_number || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
