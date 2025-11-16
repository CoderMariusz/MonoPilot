'use client';

/**
 * LPGenealogyTree Component
 * EPIC-002 Scanner & Warehouse v2 - Phase 2: LP Genealogy & Traceability
 *
 * Visual tree component showing license plate genealogy (parent → children chain).
 * Displays full split chain: original LP → split 1 → split 2 → etc.
 */

import { useEffect, useState } from 'react';
import { LicensePlatesAPI } from '@/lib/api/licensePlates';

interface GenealogyNode {
  lp_id: number;
  lp_number: string;
  parent_lp_id: number | null;
  parent_lp_number: string | null;
  level: number;
  quantity: number;
  uom: string;
  batch: string | null;
  expiry_date: string | null;
  product_description: string;
  location: string;
  qa_status: string;
  is_consumed: boolean;
  created_at: string;
}

interface LPGenealogyTreeProps {
  lpId: number;
  lpNumber: string;
  maxDepth?: number; // For scanner: show only last 3 levels
  compact?: boolean; // Compact mode for scanner terminal
}

export default function LPGenealogyTree({
  lpId,
  lpNumber,
  maxDepth,
  compact = false
}: LPGenealogyTreeProps) {
  const [tree, setTree] = useState<GenealogyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGenealogy() {
      try {
        setLoading(true);
        setError(null);

        const result = await LicensePlatesAPI.getGenealogy(lpId);

        // Filter by maxDepth if specified (for scanner view)
        let filteredTree = result.tree;
        if (maxDepth !== undefined) {
          const targetNode = result.tree.find(n => n.lp_id === lpId);
          const targetLevel = targetNode?.level || 0;
          filteredTree = result.tree.filter(
            n => n.level >= targetLevel && n.level <= targetLevel + maxDepth
          );
        }

        setTree(filteredTree);
      } catch (err: any) {
        console.error('Error fetching genealogy:', err);
        setError(err.message || 'Failed to load genealogy tree');
      } finally {
        setLoading(false);
      }
    }

    fetchGenealogy();
  }, [lpId, maxDepth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading genealogy tree...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Error Loading Genealogy</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600">No genealogy data available</p>
      </div>
    );
  }

  // Group nodes by level
  const nodesByLevel = tree.reduce((acc, node) => {
    if (!acc[node.level]) acc[node.level] = [];
    acc[node.level].push(node);
    return acc;
  }, {} as Record<number, GenealogyNode[]>);

  const levels = Object.keys(nodesByLevel).map(Number).sort((a, b) => a - b);

  // Compact mode for scanner
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-gray-700 mb-2">
          Genealogy ({tree.length} LP{tree.length > 1 ? 's' : ''})
        </div>
        {levels.map(level => (
          <div key={level} className="space-y-1">
            <div className="text-xs text-gray-500 font-medium">
              Level {level} {level === 0 ? '(Current)' : level < 0 ? '(Parent)' : '(Child)'}
            </div>
            {nodesByLevel[level].map(node => (
              <div
                key={node.lp_id}
                className={`
                  p-2 rounded border text-xs
                  ${node.lp_id === lpId ? 'bg-blue-50 border-blue-300 font-semibold' : 'bg-white border-gray-200'}
                  ${node.is_consumed ? 'opacity-60' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono">{node.lp_number}</span>
                  <span className="text-gray-600">{node.quantity} {node.uom}</span>
                </div>
                {node.batch && (
                  <div className="text-gray-500 mt-1">
                    Batch: {node.batch}
                    {node.expiry_date && ` | Exp: ${new Date(node.expiry_date).toLocaleDateString()}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Full desktop mode
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Genealogy Tree</h3>
          <p className="text-sm text-gray-600 mt-1">
            License Plate: <span className="font-mono font-semibold">{lpNumber}</span>
          </p>
        </div>
        <div className="text-sm text-gray-600">
          {tree.length} LP{tree.length > 1 ? 's' : ''} in tree
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
          <span className="text-gray-600">Current LP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-gray-600">Parent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
          <span className="text-gray-600">Children</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded opacity-60"></div>
          <span className="text-gray-600">Consumed</span>
        </div>
      </div>

      {/* Tree visualization */}
      <div className="space-y-8">
        {levels.map(level => {
          const isTargetLevel = nodesByLevel[level].some(n => n.lp_id === lpId);
          const levelLabel = level < 0 ? 'Parent' : level === 0 ? 'Current' : 'Child';

          return (
            <div key={level} className="relative">
              {/* Level label */}
              <div className="flex items-center gap-2 mb-3">
                <div className="text-sm font-semibold text-gray-700">
                  Level {level}
                  <span className="ml-2 text-gray-500 font-normal">({levelLabel})</span>
                </div>
                {level > levels[0] && (
                  <div className="flex-1 h-px bg-gray-300"></div>
                )}
              </div>

              {/* Nodes at this level */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodesByLevel[level].map(node => {
                  const bgColor = node.lp_id === lpId
                    ? 'bg-blue-50 border-blue-400'
                    : level < 0
                    ? 'bg-green-50 border-green-300'
                    : 'bg-purple-50 border-purple-300';

                  return (
                    <div
                      key={node.lp_id}
                      className={`
                        p-4 rounded-lg border-2 transition-all hover:shadow-md
                        ${bgColor}
                        ${node.is_consumed ? 'opacity-60' : ''}
                      `}
                    >
                      {/* LP Number */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-semibold text-gray-900">
                          {node.lp_number}
                        </span>
                        {node.is_consumed && (
                          <span className="text-xs bg-gray-600 text-white px-2 py-0.5 rounded">
                            Consumed
                          </span>
                        )}
                      </div>

                      {/* Product */}
                      <div className="text-sm text-gray-700 mb-2 truncate" title={node.product_description}>
                        {node.product_description}
                      </div>

                      {/* Quantity & Location */}
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>
                          <span className="text-gray-600">Qty:</span>{' '}
                          <span className="font-semibold">{node.quantity} {node.uom}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Location:</span>{' '}
                          <span className="font-semibold">{node.location}</span>
                        </div>
                      </div>

                      {/* Batch & Expiry */}
                      {(node.batch || node.expiry_date) && (
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          {node.batch && (
                            <div>
                              <span className="text-gray-600">Batch:</span>{' '}
                              <span className="font-mono text-xs">{node.batch}</span>
                            </div>
                          )}
                          {node.expiry_date && (
                            <div>
                              <span className="text-gray-600">Expiry:</span>{' '}
                              <span className="text-xs">
                                {new Date(node.expiry_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* QA Status */}
                      <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gray-200">
                        <span className={`
                          px-2 py-0.5 rounded font-medium
                          ${node.qa_status === 'passed' ? 'bg-green-100 text-green-800' : ''}
                          ${node.qa_status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                          ${node.qa_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${node.qa_status === 'on_hold' ? 'bg-orange-100 text-orange-800' : ''}
                        `}>
                          {node.qa_status}
                        </span>
                        <span className="text-gray-500">
                          {new Date(node.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Parent link */}
                      {node.parent_lp_number && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
                          ↑ From: <span className="font-mono">{node.parent_lp_number}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Connection line to next level */}
              {level < levels[levels.length - 1] && (
                <div className="flex justify-center mt-4">
                  <div className="w-px h-8 bg-gray-300"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-2">Summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total LPs:</span>{' '}
            <span className="font-semibold">{tree.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Consumed:</span>{' '}
            <span className="font-semibold">{tree.filter(n => n.is_consumed).length}</span>
          </div>
          <div>
            <span className="text-gray-600">Levels:</span>{' '}
            <span className="font-semibold">{levels.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Max Depth:</span>{' '}
            <span className="font-semibold">{Math.max(...levels) - Math.min(...levels)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
