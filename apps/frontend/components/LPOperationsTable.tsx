'use client';

import { useState } from 'react';
import { Split, Edit, RotateCcw } from 'lucide-react';
import { useLicensePlates } from '@/lib/clientState';
import { SplitLPModal } from './SplitLPModal';
import { AmendLPModal } from './AmendLPModal';
import { ChangeQAStatusModal } from './ChangeQAStatusModal';

export function LPOperationsTable() {
  const licensePlates = useLicensePlates();
  const [splitLPId, setSplitLPId] = useState<number | null>(null);
  const [amendLPId, setAmendLPId] = useState<number | null>(null);
  const [qaLPId, setQALPId] = useState<number | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">LP Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">QA Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {licensePlates.map((lp) => (
              <tr key={lp.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{lp.lp_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{lp.product?.part_number || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{lp.product?.description || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{lp.location?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{lp.quantity} {lp.product?.uom}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    lp.qa_status === 'Passed' ? 'bg-green-100 text-green-800' :
                    lp.qa_status === 'Failed' ? 'bg-red-100 text-red-800' :
                    lp.qa_status === 'Quarantine' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {lp.qa_status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSplitLPId(lp.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Split LP"
                    >
                      <Split className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAmendLPId(lp.id)}
                      className="text-slate-600 hover:text-slate-900"
                      title="Amend LP"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setQALPId(lp.id)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Change QA Status"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {splitLPId && (
        <SplitLPModal
          lpId={splitLPId}
          isOpen={splitLPId !== null}
          onClose={() => setSplitLPId(null)}
        />
      )}

      {amendLPId && (
        <AmendLPModal
          lpId={amendLPId}
          isOpen={amendLPId !== null}
          onClose={() => setAmendLPId(null)}
        />
      )}

      {qaLPId && (
        <ChangeQAStatusModal
          lpId={qaLPId}
          isOpen={qaLPId !== null}
          onClose={() => setQALPId(null)}
        />
      )}
    </>
  );
}
