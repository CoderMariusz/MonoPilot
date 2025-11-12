'use client';

/**
 * TraceabilityView Component
 * EPIC-002 Scanner & Warehouse v2 - Phase 2: LP Genealogy & Traceability
 *
 * Full traceability view: RM → PR → Pack → Box
 * Shows complete production chain using both genealogy and composition data.
 */

import { useEffect, useState } from 'react';
import { LicensePlatesAPI } from '@/lib/api/licensePlates';

interface TraceNode {
  lp_id: number;
  lp_number: string;
  product_description: string;
  quantity: number;
  uom: string;
  batch: string | null;
  expiry_date: string | null;
  location: string;
  qa_status: string;
  is_consumed: boolean;
  created_at: string;
  level: number;
  node_type: 'genealogy' | 'composition';
  quantity_consumed?: number;
  wo_number?: string;
}

interface TraceabilityViewProps {
  lpId: number;
  lpNumber: string;
  direction?: 'forward' | 'backward' | 'both'; // forward = where did it go, backward = where did it come from
}

export default function TraceabilityView({
  lpId,
  lpNumber,
  direction = 'both'
}: TraceabilityViewProps) {
  const [forwardTrace, setForwardTrace] = useState<TraceNode[]>([]);
  const [backwardTrace, setBackwardTrace] = useState<TraceNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTraceability() {
      try {
        setLoading(true);
        setError(null);

        const promises: Promise<any>[] = [];

        // Backward trace: genealogy (where did it come from)
        if (direction === 'backward' || direction === 'both') {
          promises.push(
            LicensePlatesAPI.getReverseGenealogy(lpId).then(result => {
              const nodes: TraceNode[] = result.chain
                .filter(n => n.lp_id !== lpId) // Exclude target LP
                .map(n => ({
                  lp_id: n.lp_id,
                  lp_number: n.lp_number,
                  product_description: n.product_description,
                  quantity: n.quantity,
                  uom: n.uom,
                  batch: n.batch,
                  expiry_date: n.expiry_date,
                  location: n.location,
                  qa_status: n.qa_status,
                  is_consumed: n.is_consumed,
                  created_at: n.created_at,
                  level: Math.abs(n.level), // Convert negative levels to positive for display
                  node_type: 'genealogy' as const,
                  quantity_consumed: n.quantity_consumed,
                  wo_number: n.wo_number
                }));
              setBackwardTrace(nodes);
            })
          );
        }

        // Forward trace: composition (where did it go)
        if (direction === 'forward' || direction === 'both') {
          promises.push(
            LicensePlatesAPI.getLPComposition(lpId).then(result => {
              const nodes: TraceNode[] = result.forward
                .filter(n => n.node_id !== lpId) // Exclude target LP
                .map(n => ({
                  lp_id: n.node_id,
                  lp_number: n.lp_number,
                  product_description: n.product_description,
                  quantity: n.quantity,
                  uom: n.uom,
                  batch: null, // Composition doesn't have batch info
                  expiry_date: null,
                  location: n.location,
                  qa_status: n.qa_status,
                  is_consumed: false,
                  created_at: '',
                  level: n.depth,
                  node_type: 'composition' as const,
                  quantity_consumed: n.composition_qty
                }));
              setForwardTrace(nodes);
            })
          );
        }

        await Promise.all(promises);
      } catch (err: any) {
        console.error('Error fetching traceability:', err);
        setError(err.message || 'Failed to load traceability data');
      } finally {
        setLoading(false);
      }
    }

    fetchTraceability();
  }, [lpId, direction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading traceability chain...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Error Loading Traceability</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  const hasBackward = backwardTrace.length > 0;
  const hasForward = forwardTrace.length > 0;

  if (!hasBackward && !hasForward) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">No traceability data available</p>
        <p className="text-sm text-gray-500 mt-1">
          This LP has no parent or child relationships
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Full Traceability Chain</h3>
          <p className="text-sm text-gray-600 mt-1">
            License Plate: <span className="font-mono font-semibold">{lpNumber}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {hasBackward && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">
              ← {backwardTrace.length} Source{backwardTrace.length > 1 ? 's' : ''}
            </span>
          )}
          {hasForward && (
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
              {forwardTrace.length} Output{forwardTrace.length > 1 ? 's' : ''} →
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
          <span className="text-gray-700">Source (where it came from)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></div>
          <span className="text-gray-700">Current LP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-400 rounded"></div>
          <span className="text-gray-700">Output (where it went)</span>
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        {/* Backward trace (sources) */}
        {hasBackward && (direction === 'backward' || direction === 'both') && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-sm font-semibold text-green-700">
                ← Sources (Where it came from)
              </div>
              <div className="flex-1 h-px bg-green-300"></div>
            </div>

            <div className="space-y-3">
              {backwardTrace
                .sort((a, b) => b.level - a.level) // Furthest first
                .map((node, index) => (
                  <div key={`back-${node.lp_id}`} className="flex items-start gap-3">
                    {/* Timeline marker */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-400 flex items-center justify-center text-green-700 font-semibold text-xs">
                        {backwardTrace.length - index}
                      </div>
                      {index < backwardTrace.length - 1 && (
                        <div className="w-0.5 h-16 bg-green-300"></div>
                      )}
                    </div>

                    {/* Node card */}
                    <div className="flex-1 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-mono font-semibold text-gray-900">
                            {node.lp_number}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            {node.product_description}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              Qty: <span className="font-semibold">{node.quantity} {node.uom}</span>
                            </span>
                            {node.batch && <span>Batch: {node.batch}</span>}
                            {node.location && <span>Location: {node.location}</span>}
                          </div>
                          {node.wo_number && (
                            <div className="mt-2 text-xs text-gray-600">
                              Work Order: {node.wo_number}
                              {node.quantity_consumed && ` | Consumed: ${node.quantity_consumed} ${node.uom}`}
                            </div>
                          )}
                        </div>
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded ml-2">
                          Level -{node.level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Current LP (center) */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 border-4 border-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 p-4 bg-blue-100 border-4 border-blue-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-700 font-semibold mb-1">CURRENT LP</div>
                <div className="font-mono font-bold text-gray-900 text-lg">{lpNumber}</div>
              </div>
              <div className="text-sm text-blue-700 font-semibold">Level 0</div>
            </div>
          </div>
        </div>

        {/* Forward trace (outputs) */}
        {hasForward && (direction === 'forward' || direction === 'both') && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-sm font-semibold text-purple-700">
                Outputs (Where it went) →
              </div>
              <div className="flex-1 h-px bg-purple-300"></div>
            </div>

            <div className="space-y-3">
              {forwardTrace
                .sort((a, b) => a.level - b.level) // Closest first
                .map((node, index) => (
                  <div key={`fwd-${node.lp_id}`} className="flex items-start gap-3">
                    {/* Timeline marker */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-purple-400 flex items-center justify-center text-purple-700 font-semibold text-xs">
                        {index + 1}
                      </div>
                      {index < forwardTrace.length - 1 && (
                        <div className="w-0.5 h-16 bg-purple-300"></div>
                      )}
                    </div>

                    {/* Node card */}
                    <div className="flex-1 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-mono font-semibold text-gray-900">
                            {node.lp_number}
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            {node.product_description}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              Qty: <span className="font-semibold">{node.quantity} {node.uom}</span>
                            </span>
                            {node.location && <span>Location: {node.location}</span>}
                            <span className={`
                              px-2 py-0.5 rounded text-xs font-medium
                              ${node.qa_status === 'Passed' ? 'bg-green-100 text-green-800' : ''}
                              ${node.qa_status === 'Failed' ? 'bg-red-100 text-red-800' : ''}
                              ${node.qa_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                            `}>
                              {node.qa_status}
                            </span>
                          </div>
                          {node.quantity_consumed && (
                            <div className="mt-2 text-xs text-gray-600">
                              Used: {node.quantity_consumed} {node.uom} from this LP
                            </div>
                          )}
                        </div>
                        <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded ml-2">
                          Level +{node.level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary statistics */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-3">Traceability Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Sources:</span>{' '}
            <span className="font-semibold text-green-700">{backwardTrace.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Outputs:</span>{' '}
            <span className="font-semibold text-purple-700">{forwardTrace.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Max Source Depth:</span>{' '}
            <span className="font-semibold">
              {backwardTrace.length > 0 ? Math.max(...backwardTrace.map(n => n.level)) : 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Max Output Depth:</span>{' '}
            <span className="font-semibold">
              {forwardTrace.length > 0 ? Math.max(...forwardTrace.map(n => n.level)) : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
