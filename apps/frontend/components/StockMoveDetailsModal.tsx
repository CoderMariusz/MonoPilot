'use client';

import { X } from 'lucide-react';
import { useStockMoves } from '@/lib/clientState';

interface StockMoveDetailsModalProps {
  moveId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function StockMoveDetailsModal({ moveId, isOpen, onClose }: StockMoveDetailsModalProps) {
  const stockMoves = useStockMoves();
  const move = stockMoves.find(m => m.id === moveId);

  if (!isOpen || !move) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Stock Move Details - {move.move_number}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
              <div className="text-base text-slate-900">{move.lp?.lp_number || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
              <div className="text-base text-slate-900">{move.lp?.product?.description || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">From Location</label>
              <div className="text-base text-slate-900">{move.from_location?.name || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To Location</label>
              <div className="text-base text-slate-900">{move.to_location?.name || 'N/A'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
              <div className="text-base text-slate-900">{move.quantity}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                move.status === 'completed' ? 'bg-green-100 text-green-800' :
                move.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {move.status}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Move Date</label>
              <div className="text-base text-slate-900">{move.move_date || 'Not completed'}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Created At</label>
              <div className="text-base text-slate-900">{new Date(move.created_at).toLocaleDateString()}</div>
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
