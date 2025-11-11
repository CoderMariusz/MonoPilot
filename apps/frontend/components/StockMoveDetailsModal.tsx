'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { StockMove } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';

interface StockMoveDetailsModalProps {
  moveId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function StockMoveDetailsModal({ moveId, isOpen, onClose }: StockMoveDetailsModalProps) {
  const [move, setMove] = useState<StockMove | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && moveId) {
      loadStockMoveDetails();
    }
  }, [isOpen, moveId]);

  const loadStockMoveDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('stock_moves')
        .select(`
          *,
          from_location:locations!from_location_id (
            name
          ),
          to_location:locations!to_location_id (
            name
          ),
          product:products (
            description
          )
        `)
        .eq('id', moveId)
        .single();

      if (fetchError) throw fetchError;
      
      setMove(data);
    } catch (err: any) {
      console.error('Error loading stock move details:', err);
      setError(err.message || 'Failed to load stock move details');
      toast.error('Failed to load stock move details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
          <p className="mt-2 text-sm text-slate-600">Loading stock move details...</p>
        </div>
      </div>
    );
  }

  if (error || !move) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-sm text-slate-600 mb-4">{error || 'Stock move not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
              <div className="text-base text-slate-900">{move.wo_number || move.from_location?.name || 'N/A'}</div>
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
