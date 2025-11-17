'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Bom, BomItem } from '@/lib/types';
import { BomsAPI } from '@/lib/api/boms';

interface BOMComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  version1Id: number;
  version2Id: number;
}

interface ComparisonItem {
  material_id: number;
  material_name: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  v1_quantity?: number;
  v2_quantity?: number;
  quantity_delta?: number;
  uom: string;
}

export function BOMComparisonModal({ isOpen, onClose, version1Id, version2Id }: BOMComparisonModalProps) {
  const [version1, setVersion1] = useState<Bom | null>(null);
  const [version2, setVersion2] = useState<Bom | null>(null);
  const [items1, setItems1] = useState<BomItem[]>([]);
  const [items2, setItems2] = useState<BomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadVersions = async () => {
      try {
        setLoading(true);
        setError(null);

        const [v1, v2] = await Promise.all([
          BomsAPI.getById(version1Id),
          BomsAPI.getById(version2Id),
        ]);

        if (!v1 || !v2) {
          setError('Failed to load BOM versions');
          return;
        }

        setVersion1(v1);
        setVersion2(v2);

        // Load BOM items for both versions
        const [items1Data, items2Data] = await Promise.all([
          BomsAPI.getItems(version1Id),
          BomsAPI.getItems(version2Id),
        ]);

        setItems1(items1Data);
        setItems2(items2Data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load BOM versions');
      } finally {
        setLoading(false);
      }
    };

    loadVersions();
  }, [isOpen, version1Id, version2Id]);

  // Compute comparison
  const comparison = useMemo((): ComparisonItem[] => {
    const result: ComparisonItem[] = [];
    const processedMaterialIds = new Set<number>();

    // Check items from version 1
    items1.forEach((item1) => {
      const item2 = items2.find((i) => i.material_id === item1.material_id);

      if (!item2) {
        // Item removed in version 2
        result.push({
          material_id: item1.material_id,
          material_name: `Material ${item1.material_id}`,
          status: 'removed',
          v1_quantity: item1.quantity,
          v2_quantity: undefined,
          uom: item1.uom,
        });
      } else {
        // Item exists in both - check if changed
        const quantityChanged = item1.quantity !== item2.quantity;
        const uomChanged = item1.uom !== item2.uom;

        result.push({
          material_id: item1.material_id,
          material_name: `Material ${item1.material_id}`,
          status: quantityChanged || uomChanged ? 'changed' : 'unchanged',
          v1_quantity: item1.quantity,
          v2_quantity: item2.quantity,
          quantity_delta: item2.quantity - item1.quantity,
          uom: item1.uom,
        });
      }

      processedMaterialIds.add(item1.material_id);
    });

    // Check for new items in version 2
    items2.forEach((item2) => {
      if (!processedMaterialIds.has(item2.material_id)) {
        result.push({
          material_id: item2.material_id,
          material_name: `Material ${item2.material_id}`,
          status: 'added',
          v1_quantity: undefined,
          v2_quantity: item2.quantity,
          uom: item2.uom,
        });
      }
    });

    return result;
  }, [items1, items2]);

  // Summary stats
  const summary = useMemo(() => {
    const added = comparison.filter((c) => c.status === 'added').length;
    const removed = comparison.filter((c) => c.status === 'removed').length;
    const changed = comparison.filter((c) => c.status === 'changed').length;
    const unchanged = comparison.filter((c) => c.status === 'unchanged').length;

    return { added, removed, changed, unchanged };
  }, [comparison]);

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export functionality coming soon');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">BOM Version Comparison</h2>
              {version1 && version2 && (
                <p className="text-sm text-slate-600 mt-1">
                  v{version1.version} ({version1.status}) vs v{version2.version} ({version2.status})
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-600">Loading comparison...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700">{summary.added}</div>
                  <div className="text-sm text-green-600">Added</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-700">{summary.removed}</div>
                  <div className="text-sm text-red-600">Removed</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-700">{summary.changed}</div>
                  <div className="text-sm text-yellow-600">Changed</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-slate-700">{summary.unchanged}</div>
                  <div className="text-sm text-slate-600">Unchanged</div>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                        v{version1?.version} Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                        v{version2?.version} Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase">
                        Delta
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                        UoM
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {comparison.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No differences found
                        </td>
                      </tr>
                    ) : (
                      comparison.map((item) => {
                        const statusColors = {
                          added: 'bg-green-100 text-green-700',
                          removed: 'bg-red-100 text-red-700',
                          changed: 'bg-yellow-100 text-yellow-700',
                          unchanged: 'bg-slate-50 text-slate-600',
                        };

                        return (
                          <tr key={item.material_id} className={statusColors[item.status]}>
                            <td className="px-4 py-3 text-sm font-medium">{item.material_name}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                                  item.status === 'added'
                                    ? 'bg-green-200 text-green-800'
                                    : item.status === 'removed'
                                    ? 'bg-red-200 text-red-800'
                                    : item.status === 'changed'
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {item.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {item.v1_quantity !== undefined ? item.v1_quantity.toFixed(2) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {item.v2_quantity !== undefined ? item.v2_quantity.toFixed(2) : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {item.quantity_delta !== undefined && item.quantity_delta !== 0 ? (
                                <span
                                  className={
                                    item.quantity_delta > 0 ? 'text-green-700' : 'text-red-700'
                                  }
                                >
                                  {item.quantity_delta > 0 ? '+' : ''}
                                  {item.quantity_delta.toFixed(2)}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">{item.uom}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between">
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            Export to PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
