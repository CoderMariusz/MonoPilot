'use client';

import { useState, useMemo, useEffect } from 'react';
import { Eye, Search, Loader2 } from 'lucide-react';
import type { StockMove } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { StockMoveDetailsModal } from './StockMoveDetailsModal';
import { toast } from '@/lib/toast';

export function StockMoveTable() {
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadStockMoves();
    }
  }, [user]);

  const loadStockMoves = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stock_moves')
        .select(`
          *,
          from_location:locations!from_location_id (name),
          to_location:locations!to_location_id (name),
          product:products (
            part_number,
            description,
            uom
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStockMoves(data || []);
    } catch (error) {
      console.error('Error loading stock moves:', error);
      toast.error('Failed to load stock moves');
    } finally {
      setLoading(false);
    }
  };

  const filteredStockMoves = useMemo(() => {
    if (!searchQuery) return stockMoves;
    
    const query = searchQuery.toLowerCase();
    return stockMoves.filter(move => {
      const isGRN = move.move_number?.startsWith('GRN-');
      const fromLocation = isGRN 
        ? (move.wo_number || 'N/A')
        : (move.from_location?.name || move.wo_number || 'N/A');
      const toLocation = isGRN
        ? (move.to_location?.name || 'N/A')
        : (move.wo_number && move.from_location ? move.wo_number : move.to_location?.name || 'N/A');
      
      return (
        move.move_number?.toLowerCase().includes(query) ||
        move.lp?.lp_number?.toLowerCase().includes(query) ||
        move.lp?.product?.part_number?.toLowerCase().includes(query) ||
        fromLocation?.toLowerCase().includes(query) ||
        toLocation?.toLowerCase().includes(query)
      );
    });
  }, [stockMoves, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        <span className="ml-3 text-sm text-slate-600">Loading stock moves...</span>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search stock moves..."
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
            {filteredStockMoves.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No items found matching your search' : 'No items found'}
                </td>
              </tr>
            ) : (
              filteredStockMoves.map((move) => {
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
                        onClick={() => setSelectedMove(parseInt(move.id))}
                        className="text-slate-600 hover:text-slate-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
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
