'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { GRN } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';

interface GRNDetailsModalProps {
  grnId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function GRNDetailsModal({ grnId, isOpen, onClose }: GRNDetailsModalProps) {
  const [grn, setGrn] = useState<GRN | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && grnId) {
      loadGRNDetails();
    }
  }, [isOpen, grnId]);

  const loadGRNDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('grns')
        .select(`
          *,
          po_header:po_id (
            po_number:number,
            supplier:suppliers (
              name
            )
          ),
          grn_items (
            *,
            product:products (
              description
            ),
            location:locations (
              name
            )
          )
        `)
        .eq('id', grnId)
        .single();

      if (fetchError) throw fetchError;
      
      // Transform data to match expected structure
      const transformedGRN: GRN = {
        ...data,
        po: data.po_header ? {
          po_number: data.po_header.po_number,
          supplier: data.po_header.supplier
        } : undefined
      };
      
      setGrn(transformedGRN);
    } catch (err: any) {
      console.error('Error loading GRN details:', err);
      setError(err.message || 'Failed to load GRN details');
      toast.error('Failed to load GRN details');
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
          <p className="mt-2 text-sm text-slate-600">Loading GRN details...</p>
        </div>
      </div>
    );
  }

  if (error || !grn) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-sm text-slate-600 mb-4">{error || 'GRN not found'}</p>
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
              <div className="text-base text-slate-900">{grn.po?.supplier?.name || 'N/A'}</div>
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
