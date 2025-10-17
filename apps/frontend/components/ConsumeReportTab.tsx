'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ConsumeAPI } from '@/lib/api/consume';

interface ConsumeData {
  wo_number: string;
  production_date_london: string;
  production_date_utc: string;
  product: string;
  material: string;
  material_part_number: string;
  bom_standard_kg: number;
  actual_consumed_kg: number;
  variance_kg: number;
  variance_percent: number;
  production_line: string;
  work_order_status: string;
  one_to_one: boolean;
  is_optional: boolean;
}

interface ConsumeSummary {
  total_materials: number;
  avg_variance_percent: number;
  total_standard_kg: number;
  total_actual_kg: number;
  total_variance_kg: number;
}

export function ConsumeReportTab() {
  const [woId, setWoId] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [materialId, setMaterialId] = useState<string>('');
  const [line, setLine] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consumeData, setConsumeData] = useState<ConsumeData[]>([]);
  const [summary, setSummary] = useState<ConsumeSummary | null>(null);

  const loadConsumeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        woId: woId ? parseInt(woId) : undefined,
        from: from || undefined,
        to: to || undefined,
        materialId: materialId ? parseInt(materialId) : undefined,
        line: line || undefined
      };

      const result = await ConsumeAPI.getConsumptionData(params);
      setConsumeData(result.data);
      setSummary(result.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consumption data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsumeData();
  }, [woId, from, to, materialId, line]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (woId) params.append('woId', woId);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (materialId) params.append('materialId', materialId);
      if (line) params.append('line', line);

      const response = await fetch(`/api/exports/consume.xlsx?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Consumption_Variance_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVarianceColor = (variancePercent: number) => {
    if (Math.abs(variancePercent) <= 5) return 'text-green-600';
    if (Math.abs(variancePercent) <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (variancePercent: number) => {
    if (Math.abs(variancePercent) <= 5) return <CheckCircle className="w-4 h-4" />;
    if (Math.abs(variancePercent) <= 10) return <AlertTriangle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  const getVarianceBgColor = (variancePercent: number) => {
    if (Math.abs(variancePercent) <= 5) return 'bg-green-50';
    if (Math.abs(variancePercent) <= 10) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Work Order ID</label>
            <input
              type="number"
              value={woId}
              onChange={(e) => setWoId(e.target.value)}
              placeholder="Filter by WO ID"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Material ID</label>
            <input
              type="number"
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              placeholder="Filter by material"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Production Line</label>
            <input
              type="text"
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="Filter by line"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Total Materials</div>
            <div className="text-2xl font-bold text-slate-900">{summary.total_materials}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Avg Variance %</div>
            <div className={`text-2xl font-bold ${getVarianceColor(summary.avg_variance_percent)}`}>
              {summary.avg_variance_percent.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Standard (kg)</div>
            <div className="text-2xl font-bold text-slate-900">{summary.total_standard_kg.toFixed(1)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Actual (kg)</div>
            <div className="text-2xl font-bold text-slate-900">{summary.total_actual_kg.toFixed(1)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">Variance (kg)</div>
            <div className={`text-2xl font-bold ${getVarianceColor((summary.total_variance_kg / summary.total_standard_kg) * 100)}`}>
              {summary.total_variance_kg.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      {/* Consumption Data Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Material Consumption Variance</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">WO Number</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Material</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">BOM Standard (kg)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actual (kg)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Variance (kg)</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Variance %</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Line</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {consumeData.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {row.wo_number}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {formatDate(row.production_date_london)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {row.product}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div>
                      <div className="font-medium">{row.material}</div>
                      <div className="text-slate-500">{row.material_part_number}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right">
                    {row.bom_standard_kg.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right">
                    {row.actual_consumed_kg.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 text-right">
                    {row.variance_kg.toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-medium ${getVarianceColor(row.variance_percent)}`}>
                    {row.variance_percent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {row.production_line}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.work_order_status === 'completed' ? 'bg-green-100 text-green-800' :
                      row.work_order_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.work_order_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center gap-1">
                      {row.one_to_one && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          1:1
                        </span>
                      )}
                      {row.is_optional && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          OPT
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

