'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { WorkOrdersAPI } from '@/lib/api/workOrders';
import { toast } from '@/lib/toast';

interface WOReservationsTableProps {
  woId: number;
  showRequiredMaterials?: boolean; // Show checklist of required materials
  compact?: boolean; // Compact mode for scanner
}

interface RequiredMaterial {
  material_id: number;
  material_part_number: string;
  material_description: string;
  required_qty: number;
  reserved_qty: number;
  consumed_qty: number;
  remaining_qty: number;
  uom: string;
  operation_sequence: number;
  progress_pct: number;
}

interface Reservation {
  id: number;
  material_id: number;
  material_part_number: string;
  material_description: string;
  lp_id: number;
  lp_number: string;
  quantity_reserved: number;
  quantity_consumed: number;
  uom: string;
  status: string;
  batch: string | null;
  expiry_date: string | null;
  reserved_at: string;
  reserved_by: string | null;
  consumed_at: string | null;
}

export function WOReservationsTable({
  woId,
  showRequiredMaterials = true,
  compact = false
}: WOReservationsTableProps) {
  const [loading, setLoading] = useState(true);
  const [requiredMaterials, setRequiredMaterials] = useState<RequiredMaterial[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (woId) {
      loadData();
    }
  }, [woId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [materialsData, reservationsData] = await Promise.all([
        showRequiredMaterials ? WorkOrdersAPI.getRequiredMaterials(woId) : Promise.resolve([]),
        WorkOrdersAPI.getReservations(woId)
      ]);

      setRequiredMaterials(materialsData);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading WO reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <span className="ml-3 text-sm text-slate-600">Loading reservations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Required Materials Checklist */}
      {showRequiredMaterials && requiredMaterials.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold text-slate-900 ${compact ? 'text-sm' : 'text-base'}`}>
              Required Materials
            </h3>
            <button
              onClick={loadData}
              className="text-slate-500 hover:text-slate-700"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {requiredMaterials.map((material) => {
              const isComplete = material.progress_pct >= 100;
              const isStarted = material.reserved_qty > 0;
              const isPartial = isStarted && material.progress_pct < 100;

              return (
                <div
                  key={material.material_id}
                  className={`p-4 border rounded-lg ${
                    isComplete ? 'bg-green-50 border-green-200' :
                    isPartial ? 'bg-yellow-50 border-yellow-200' :
                    'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : isPartial ? (
                          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                        <span className={`font-medium truncate ${compact ? 'text-sm' : 'text-base'}`}>
                          {material.material_part_number}
                        </span>
                      </div>
                      {!compact && (
                        <p className="text-sm text-slate-600 truncate">{material.material_description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`font-semibold ${
                        isComplete ? 'text-green-700' :
                        isPartial ? 'text-yellow-700' :
                        'text-slate-700'
                      } ${compact ? 'text-sm' : 'text-base'}`}>
                        {material.consumed_qty.toFixed(2)} / {material.required_qty.toFixed(2)} {material.uom}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {material.progress_pct.toFixed(0)}% complete
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isComplete ? 'bg-green-600' :
                          isPartial ? 'bg-yellow-500' :
                          'bg-slate-400'
                        }`}
                        style={{ width: `${Math.min(material.progress_pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Reserved vs Consumed */}
                  {!compact && material.reserved_qty > 0 && (
                    <div className="mt-2 flex gap-4 text-xs text-slate-600">
                      <span>Reserved: {material.reserved_qty.toFixed(2)} {material.uom}</span>
                      <span>Consumed: {material.consumed_qty.toFixed(2)} {material.uom}</span>
                      <span>Remaining: {material.remaining_qty.toFixed(2)} {material.uom}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reservations Detail Table */}
      {reservations.length > 0 && (
        <div>
          <h3 className={`font-semibold text-slate-900 mb-4 ${compact ? 'text-sm' : 'text-base'}`}>
            Reservation Details ({reservations.length})
          </h3>

          {compact ? (
            // Compact view for scanner
            <div className="space-y-2">
              {reservations.map((res) => (
                <div key={res.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono font-medium text-slate-900">{res.lp_number}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      res.status === 'consumed' ? 'bg-green-100 text-green-800' :
                      res.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {res.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>{res.material_part_number}</div>
                    <div className="flex justify-between">
                      <span>Reserved: {res.quantity_reserved.toFixed(2)} {res.uom}</span>
                      <span>Consumed: {res.quantity_consumed.toFixed(2)} {res.uom}</span>
                    </div>
                    {res.batch && (
                      <div className="font-mono">Batch: {res.batch}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Full desktop table view
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">LP Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Material</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reserved</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Consumed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reserved At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono text-slate-900">{res.lp_number}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <div>{res.material_part_number}</div>
                        <div className="text-xs text-slate-500 truncate max-w-xs">{res.material_description}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {res.quantity_reserved.toFixed(2)} {res.uom}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className={res.quantity_consumed > 0 ? 'text-green-700 font-medium' : 'text-slate-500'}>
                          {res.quantity_consumed.toFixed(2)} {res.uom}
                        </div>
                        {res.quantity_consumed < res.quantity_reserved && (
                          <div className="text-xs text-slate-500 mt-1">
                            {(res.quantity_reserved - res.quantity_consumed).toFixed(2)} remaining
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          res.status === 'consumed' ? 'bg-green-100 text-green-800' :
                          res.status === 'active' ? 'bg-blue-100 text-blue-800' :
                          res.status === 'released' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{res.batch || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {res.expiry_date ? new Date(res.expiry_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(res.reserved_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {reservations.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <AlertCircle className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No material reservations yet</p>
          <p className="text-slate-400 text-xs mt-1">Scan license plates on scanner to reserve materials</p>
        </div>
      )}
    </div>
  );
}
