'use client';

import { useState, useMemo, useEffect } from 'react';
import { Split, Edit, RotateCcw, Search, Loader2 } from 'lucide-react';
import type { LicensePlate } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { SplitLPModal } from './SplitLPModal';
import { AmendLPModal } from './AmendLPModal';
import { ChangeQAStatusModal } from './ChangeQAStatusModal';

export function LPOperationsTable() {
  const [licensePlates, setLicensePlates] = useState<LicensePlate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [splitLPId, setSplitLPId] = useState<number | null>(null);
  const [amendLPId, setAmendLPId] = useState<number | null>(null);
  const [qaLPId, setQALPId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadLicensePlates();
    }
  }, [user]);

  const loadLicensePlates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('license_plates')
        .select(`
          *,
          product:products (
            part_number,
            description,
            uom
          ),
          location:locations (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLicensePlates(data || []);
    } catch (error) {
      console.error('Error loading license plates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLPs = useMemo(() => {
    if (!searchQuery) return licensePlates;
    
    const query = searchQuery.toLowerCase();
    return licensePlates.filter(lp => 
      lp.lp_number?.toLowerCase().includes(query) ||
      lp.product?.part_number?.toLowerCase().includes(query) ||
      lp.product?.description?.toLowerCase().includes(query) ||
      lp.location?.name?.toLowerCase().includes(query) ||
      lp.qa_status?.toLowerCase().includes(query)
    );
  }, [licensePlates, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        <span className="ml-3 text-sm text-slate-600">Loading license plates...</span>
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
            placeholder="Search license plates..."
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
            {filteredLPs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                  {searchQuery ? 'No items found matching your search' : 'No items found'}
                </td>
              </tr>
            ) : (
              filteredLPs.map((lp) => (
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
                        onClick={() => setSplitLPId(parseInt(lp.id))}
                        className="text-blue-600 hover:text-blue-900"
                        title="Split LP"
                      >
                        <Split className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setAmendLPId(parseInt(lp.id))}
                        className="text-slate-600 hover:text-slate-900"
                        title="Amend LP"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setQALPId(parseInt(lp.id))}
                        className="text-purple-600 hover:text-purple-900"
                        title="Change QA Status"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
