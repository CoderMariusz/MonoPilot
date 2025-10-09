'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useStockMoves } from '@/lib/clientState';
import { StockMoveDetailsModal } from './StockMoveDetailsModal';

export function StockMoveTable() {
  const stockMoves = useStockMoves();
  const [selectedMove, setSelectedMove] = useState<number | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Move Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">LP Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">From Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">To Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {stockMoves.map((move) => {
              const isGRN = move.move_number?.startsWith('GRN-');
              const fromLocation = isGRN 
                ? (move.wo_number || 'N/A')
                : (move.from_location?.name || move.wo_number || 'N/A');
              const toLocation = isGRN
                ? (move.to_location?.name || 'N/A')
                : (move.wo_number && move.from_location ? move.wo_number : move.to_location?.name || 'N/A');
              
              return (
                <tr key={move.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{move.move_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{move.lp?.lp_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{move.lp?.product?.part_number || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{fromLocation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{toLocation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{move.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{move.move_date || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      move.status === 'completed' ? 'bg-green-100 text-green-800' :
                      move.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {move.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedMove(move.id)}
                      className="text-slate-600 hover:text-slate-900"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedMove && (
        <StockMoveDetailsModal
          moveId={selectedMove}
          isOpen={selectedMove !== null}
          onClose={() => setSelectedMove(null)}
        />
      )}
    </>
  );
}
