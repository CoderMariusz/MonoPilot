'use client';

import { useState, useEffect } from 'react';
import { Loader2, Download, TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';
import { YieldAPI } from '@/lib/api/yield';

interface YieldKPIs {
  yield_percent: number;
  consumption_per_kg: number;
  plan_accuracy_percent: number;
  on_time_percent: number;
  total_work_orders: number;
  total_input_kg: number;
  total_output_kg: number;
}

interface YieldData {
  production_date: string;
  production_date_utc: string;
  production_line: string;
  product: string;
  part_number: string;
  work_order_count: number;
  total_input_kg: number;
  total_output_kg: number;
  pr_yield_percent?: number;
  pr_consumption_per_kg?: number;
  fg_yield_percent?: number;
  total_planned_boxes?: number;
  total_actual_boxes?: number;
  avg_box_weight_kg?: number;
  total_fg_weight_kg?: number;
  total_meat_input_kg?: number;
  plan_accuracy_percent: number;
  waste_kg?: number;
}

export function YieldReportTab() {
  const [kpiScope, setKpiScope] = useState<'PR' | 'FG'>('PR');
  const [bucket, setBucket] = useState<'day' | 'week' | 'month'>('day');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [line, setLine] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yieldData, setYieldData] = useState<YieldData[]>([]);
  const [kpis, setKpis] = useState<YieldKPIs | null>(null);

  const loadYieldData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        bucket,
        from: from || undefined,
        to: to || undefined,
        line: line || undefined
      };

      let data, summary;
      if (kpiScope === 'PR') {
        const result = await YieldAPI.getPRYield(params);
        data = result.data;
        summary = result.summary;
      } else {
        const result = await YieldAPI.getFGYield(params);
        data = result.data;
        summary = result.summary;
      }

      setYieldData(data);
      setKpis({
        yield_percent: summary.avg_yield_percent,
        consumption_per_kg: kpiScope === 'PR' ? summary.total_input_kg / summary.total_output_kg : 0,
        plan_accuracy_percent: 95.0, // TODO: Calculate from data
        on_time_percent: 95.0, // TODO: Calculate from data
        total_work_orders: summary.total_work_orders,
        total_input_kg: summary.total_input_kg,
        total_output_kg: summary.total_output_kg
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load yield data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadYieldData();
  }, [kpiScope, bucket, from, to, line]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        bucket,
        ...(from && { from }),
        ...(to && { to }),
        ...(line && { line })
      });

      const response = await fetch(`/api/exports/yield-${kpiScope.toLowerCase()}.xlsx?${params}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${kpiScope}_Yield_${bucket}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      year: 'numeric'
    });
  };

  const getYieldColor = (yieldPercent: number) => {
    if (yieldPercent >= 95) return 'text-green-600';
    if (yieldPercent >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getYieldIcon = (yieldPercent: number) => {
    if (yieldPercent >= 95) return <TrendingUp className="w-4 h-4" />;
    if (yieldPercent >= 90) return <Target className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
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
            <label className="block text-sm font-medium text-slate-700 mb-1">KPI Scope</label>
            <select
              value={kpiScope}
              onChange={(e) => setKpiScope(e.target.value as 'PR' | 'FG')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="PR">Process (PR)</option>
              <option value="FG">Finished Goods (FG)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Time Bucket</label>
            <select
              value={bucket}
              onChange={(e) => setBucket(e.target.value as 'day' | 'week' | 'month')}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
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

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Yield %</p>
                <p className={`text-2xl font-bold ${getYieldColor(kpis.yield_percent)}`}>
                  {kpis.yield_percent.toFixed(1)}%
                </p>
              </div>
              {getYieldIcon(kpis.yield_percent)}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  {kpiScope === 'PR' ? 'Consumption/kg' : 'Waste (kg)'}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {kpiScope === 'PR' 
                    ? kpis.consumption_per_kg.toFixed(2)
                    : (kpis.total_input_kg - kpis.total_output_kg).toFixed(1)
                  }
                </p>
              </div>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Plan Accuracy %</p>
                <p className="text-2xl font-bold text-slate-900">
                  {kpis.plan_accuracy_percent.toFixed(1)}%
                </p>
              </div>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">On-Time %</p>
                <p className="text-2xl font-bold text-slate-900">
                  {kpis.on_time_percent.toFixed(1)}%
                </p>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
      )}

      {/* Yield Data Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {kpiScope} Yield Report - {bucket.charAt(0).toUpperCase() + bucket.slice(1)}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Line</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">WOs</th>
                {kpiScope === 'PR' ? (
                  <>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Input (kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Output (kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Yield %</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Consumption/kg</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Planned Boxes</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Actual Boxes</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">FG Weight (kg)</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Yield %</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Waste (kg)</th>
                  </>
                )}
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Plan Accuracy %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {yieldData.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {formatDate(row.production_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {row.production_line}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <div>
                      <div className="font-medium">{row.product}</div>
                      <div className="text-slate-500">{row.part_number}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    {row.work_order_count}
                  </td>
                  {kpiScope === 'PR' ? (
                    <>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {row.total_input_kg.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {row.total_output_kg.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${getYieldColor(row.pr_yield_percent || 0)}`}>
                        {(row.pr_yield_percent || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {(row.pr_consumption_per_kg || 0).toFixed(2)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {row.total_planned_boxes || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {row.total_actual_boxes || 0}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {(row.total_fg_weight_kg || 0).toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${getYieldColor(row.fg_yield_percent || 0)}`}>
                        {(row.fg_yield_percent || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900 text-right">
                        {(row.waste_kg || 0).toFixed(1)}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3 text-sm text-slate-900 text-right">
                    {(row.plan_accuracy_percent || 0).toFixed(1)}%
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

