'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Package, AlertCircle } from 'lucide-react';

interface StageBoardData {
  operation_seq: number;
  required_kg: number;
  staged_kg: number;
  in_kg: number;
  remaining_kg: number;
  overall_percentage: number;
  overall_status: string;
  components: ComponentData[];
  summary: {
    total_components: number;
    components_ready: number;
    components_partial: number;
    components_missing: number;
    one_to_one_components: number;
  };
}

interface ComponentData {
  material_id: number;
  part_number: string;
  description: string;
  uom: string;
  required_kg: number;
  staged_kg: number;
  in_kg: number;
  remaining_kg: number;
  staged_percentage: number;
  in_percentage: number;
  status_color: string;
  one_to_one: boolean;
  staged_lps: StagedLP[];
  warnings: Warning[];
}

interface StagedLP {
  id: number;
  lp_number: string;
  quantity: number;
  qa_status: string;
  stage_suffix?: string;
}

interface Warning {
  type: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface StageBoardProps {
  woId: number;
  operationSeq: number;
  onRefresh?: () => void;
}

export function StageBoard({ woId, operationSeq, onRefresh }: StageBoardProps) {
  const [stageBoardData, setStageBoardData] = useState<StageBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStageBoardData();
  }, [woId, operationSeq]);

  const fetchStageBoardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/scanner/wo/${woId}/stage-status?operation_seq=${operationSeq}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch stage board data');
      }

      const data = await response.json();
      setStageBoardData(data.stage_board);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'amber':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'red':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'amber':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWarningIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-red-200">
        <div className="flex items-center gap-3 text-red-600">
          <XCircle className="w-6 h-6" />
          <div>
            <h3 className="font-semibold">Error Loading Stage Board</h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchStageBoardData}
              className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!stageBoardData) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Stage Board - Operation {stageBoardData.operation_seq}
              </h3>
              <p className="text-sm text-slate-600">
                Overall Progress: {stageBoardData.overall_percentage}%
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(stageBoardData.overall_status)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(stageBoardData.overall_status)}`}>
              {stageBoardData.overall_status.toUpperCase()}
            </span>
            <button
              onClick={fetchStageBoardData}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">
              {stageBoardData.required_kg.toFixed(1)}
            </div>
            <div className="text-sm text-slate-600">Required (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {stageBoardData.staged_kg.toFixed(1)}
            </div>
            <div className="text-sm text-slate-600">Staged (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stageBoardData.in_kg.toFixed(1)}
            </div>
            <div className="text-sm text-slate-600">IN (kg)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {stageBoardData.remaining_kg.toFixed(1)}
            </div>
            <div className="text-sm text-slate-600">Remaining (kg)</div>
          </div>
        </div>
      </div>

      {/* Components */}
      <div className="px-6 py-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">
          Components ({stageBoardData.summary.total_components})
        </h4>
        <div className="space-y-3">
          {stageBoardData.components.map((component) => (
            <div
              key={component.material_id}
              className="border border-slate-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-medium text-slate-900">
                      {component.part_number}
                    </h5>
                    {component.one_to_one && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                        1:1
                      </span>
                    )}
                    {component.staged_lps.some(lp => lp.stage_suffix) && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                        {component.staged_lps.find(lp => lp.stage_suffix)?.stage_suffix}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {component.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Required: {component.required_kg.toFixed(1)} {component.uom}</span>
                    <span className="text-blue-600">Staged: {component.staged_kg.toFixed(1)} {component.uom}</span>
                    <span className="text-green-600">IN: {component.in_kg.toFixed(1)} {component.uom}</span>
                    <span className="text-red-600">Remaining: {component.remaining_kg.toFixed(1)} {component.uom}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(component.status_color)}
                  <span className="text-sm font-medium">
                    {component.in_percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>Progress</span>
                  <span>{component.in_percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      component.status_color === 'green'
                        ? 'bg-green-500'
                        : component.status_color === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(component.in_percentage, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Staged LPs */}
              {component.staged_lps.length > 0 && (
                <div className="mb-3">
                  <h6 className="text-xs font-medium text-slate-700 mb-2">Staged LPs:</h6>
                  <div className="flex flex-wrap gap-2">
                    {component.staged_lps.map((lp) => (
                      <span
                        key={lp.id}
                        className={`px-2 py-1 rounded text-xs ${
                          lp.qa_status === 'Passed'
                            ? 'bg-green-100 text-green-800'
                            : lp.qa_status === 'Failed'
                            ? 'bg-red-100 text-red-800'
                            : lp.qa_status === 'Quarantine'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {lp.lp_number} ({lp.quantity.toFixed(1)} {component.uom})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {component.warnings.length > 0 && (
                <div className="space-y-1">
                  {component.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      {getWarningIcon(warning.severity)}
                      <span
                        className={
                          warning.severity === 'error'
                            ? 'text-red-700'
                            : warning.severity === 'warning'
                            ? 'text-amber-700'
                            : 'text-blue-700'
                        }
                      >
                        {warning.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              {stageBoardData.summary.components_ready} Ready
            </span>
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {stageBoardData.summary.components_partial} Partial
            </span>
            <span className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              {stageBoardData.summary.components_missing} Missing
            </span>
          </div>
          {stageBoardData.summary.one_to_one_components > 0 && (
            <span className="flex items-center gap-2 text-purple-700">
              <Package className="w-4 h-4" />
              {stageBoardData.summary.one_to_one_components} 1:1 Components
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
