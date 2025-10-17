'use client';

import { useState, useEffect } from 'react';
import { Loader2, Edit, Trash2, Package, CheckCircle, XCircle, AlertTriangle, AlertCircle } from 'lucide-react';

interface StagedLP {
  id: number;
  lp_number: string;
  product_description: string;
  quantity: number;
  uom: string;
  qa_status: 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
  stage_suffix?: string;
  location: string;
  available_quantity: number;
  reserved_quantity: number;
  is_reserved: boolean;
  reservation_conflicts: boolean;
}

interface StagedLPsListProps {
  woId: number;
  operationSeq?: number;
  onEditLP?: (lp: StagedLP) => void;
  onRemoveLP?: (lpId: number) => void;
  onRefresh?: () => void;
}

export function StagedLPsList({ woId, operationSeq, onEditLP, onRemoveLP, onRefresh }: StagedLPsListProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagedLPs, setStagedLPs] = useState<StagedLP[]>([]);
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved' | 'conflicts'>('all');

  const loadStagedLPs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (operationSeq) params.append('operation_seq', operationSeq.toString());
      
      const response = await fetch(`/api/scanner/wo/${woId}/staged-lps?${params}`);
      if (!response.ok) throw new Error('Failed to load staged LPs');
      
      const data = await response.json();
      setStagedLPs(data.lps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staged LPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (woId) {
      loadStagedLPs();
    }
  }, [woId, operationSeq]);

  const getQAStatusIcon = (qaStatus: string) => {
    switch (qaStatus) {
      case 'Passed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'Quarantine':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getQAStatusColor = (qaStatus: string) => {
    switch (qaStatus) {
      case 'Passed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Quarantine':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (lp: StagedLP) => {
    if (lp.reservation_conflicts) return 'border-red-200 bg-red-50';
    if (lp.is_reserved) return 'border-blue-200 bg-blue-50';
    if (lp.available_quantity > 0) return 'border-green-200 bg-green-50';
    return 'border-gray-200 bg-gray-50';
  };

  const filteredLPs = stagedLPs.filter(lp => {
    switch (filter) {
      case 'available':
        return lp.available_quantity > 0 && !lp.is_reserved;
      case 'reserved':
        return lp.is_reserved;
      case 'conflicts':
        return lp.reservation_conflicts;
      default:
        return true;
    }
  });

  const handleRemoveLP = async (lpId: number) => {
    if (!confirm('Are you sure you want to remove this LP from staging?')) return;
    
    try {
      const response = await fetch(`/api/scanner/wo/${woId}/staged-lps/${lpId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to remove LP');
      
      setStagedLPs(prev => prev.filter(lp => lp.id !== lpId));
      onRemoveLP?.(lpId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove LP');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
        {error}
        <button
          onClick={loadStagedLPs}
          className="ml-2 text-red-800 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Staged License Plates</h3>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-slate-300 rounded-md text-sm"
          >
            <option value="all">All LPs</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="conflicts">Conflicts</option>
          </select>
          <button
            onClick={loadStagedLPs}
            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* LPs List */}
      <div className="space-y-2">
        {filteredLPs.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Staged LPs</h3>
            <p className="text-slate-600">
              {filter === 'all' 
                ? 'No license plates are currently staged for this work order.'
                : `No license plates match the "${filter}" filter.`
              }
            </p>
          </div>
        ) : (
          filteredLPs.map((lp) => (
            <div
              key={lp.id}
              className={`p-4 rounded-lg border-2 ${getAvailabilityColor(lp)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Package className="w-5 h-5 text-slate-600" />
                    <div>
                      <h4 className="font-medium text-slate-900">{lp.lp_number}</h4>
                      <p className="text-sm text-slate-600">{lp.product_description}</p>
                    </div>
                    {lp.stage_suffix && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {lp.stage_suffix}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Quantity</div>
                      <div className="font-medium">{lp.quantity.toFixed(2)} {lp.uom}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Available</div>
                      <div className="font-medium">{lp.available_quantity.toFixed(2)} {lp.uom}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Location</div>
                      <div className="font-medium">{lp.location}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">QA Status</div>
                      <div className="flex items-center gap-1">
                        {getQAStatusIcon(lp.qa_status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQAStatusColor(lp.qa_status)}`}>
                          {lp.qa_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  {lp.reservation_conflicts && (
                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                      ⚠️ Reservation conflicts detected
                    </div>
                  )}
                  
                  {lp.is_reserved && (
                    <div className="mt-2 p-2 bg-blue-100 border border-blue-200 rounded text-sm text-blue-800">
                      ℹ️ Reserved for this work order
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEditLP?.(lp)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                    title="Edit LP"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveLP(lp.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded"
                    title="Remove LP"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {stagedLPs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-slate-600">Total LPs</div>
            <div className="text-xl font-bold text-slate-900">{stagedLPs.length}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-slate-600">Available</div>
            <div className="text-xl font-bold text-green-600">
              {stagedLPs.filter(lp => lp.available_quantity > 0 && !lp.is_reserved).length}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-slate-600">Reserved</div>
            <div className="text-xl font-bold text-blue-600">
              {stagedLPs.filter(lp => lp.is_reserved).length}
            </div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-slate-600">Conflicts</div>
            <div className="text-xl font-bold text-red-600">
              {stagedLPs.filter(lp => lp.reservation_conflicts).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

