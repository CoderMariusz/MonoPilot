'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, TrendingUp, Package, Loader2, Route, Workflow } from 'lucide-react';
import { WorkOrdersTable } from '@/components/WorkOrdersTable';
import { RecordWeightsModal } from '@/components/RecordWeightsModal';
import { mockConsumeReport } from '@/lib/mockData';
import { useYieldReports, useWorkOrders, getFilteredBomForWorkOrder } from '@/lib/clientState';
import type { ConsumeReport } from '@/lib/types';

type TabType = 'work-orders' | 'yield-report' | 'consume-report' | 'operations' | 'trace';


export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState<TabType>('work-orders');

  const tabs = [
    { id: 'work-orders' as TabType, label: 'Work Orders', icon: ClipboardList },
    { id: 'yield-report' as TabType, label: 'Yield', icon: TrendingUp },
    { id: 'consume-report' as TabType, label: 'Consume', icon: Package },
    { id: 'operations' as TabType, label: 'Operations', icon: Workflow },
    { id: 'trace' as TabType, label: 'Trace', icon: Route },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Production</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-md text-base font-medium transition-colors
                    ${isActive 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'work-orders' && <WorkOrdersTab />}
          {activeTab === 'yield-report' && <YieldReportTab />}
          {activeTab === 'consume-report' && <ConsumeReportTab />}
          {activeTab === 'operations' && <OperationsTab />}
          {activeTab === 'trace' && <TraceTab />}
        </div>
      </div>
    </div>
  );
}

function WorkOrdersTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Work Orders</h2>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm">
          Create Work Order
        </button>
      </div>
      <WorkOrdersTable />
    </div>
  );
}

function YieldReportTab() {
  const [yieldType, setYieldType] = useState<'PR' | 'FG'>('PR');
  const [bucket, setBucket] = useState<'day' | 'week' | 'month'>('day');
  const [dateRange, setDateRange] = useState('last-7-days');
  const [yieldData, setYieldData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [kpiData, setKpiData] = useState({
    yieldPercent: 0,
    consumptionPerKg: 0,
    planAccuracy: 0,
    onTimePercent: 0
  });

  useEffect(() => {
    fetchYieldData();
  }, [yieldType, bucket, dateRange]);

  const fetchYieldData = async () => {
    setLoading(true);
    try {
      const endpoint = yieldType === 'PR' ? '/api/production/yield/pr' : '/api/production/yield/fg';
      const params = new URLSearchParams({
        bucket,
        from: getDateFrom(dateRange),
        to: new Date().toISOString()
      });
      
      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setYieldData(data.data || []);
        calculateKPIs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch yield data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFrom = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'last-7-days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'last-30-days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'this-month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const calculateKPIs = (data: any[]) => {
    if (data.length === 0) {
      setKpiData({ yieldPercent: 0, consumptionPerKg: 0, planAccuracy: 0, onTimePercent: 0 });
      return;
    }

    const totalOutput = data.reduce((sum, item) => sum + (item.actual_output_kg || 0), 0);
    const totalInput = data.reduce((sum, item) => sum + (item.actual_input_kg || 0), 0);
    const totalPlanned = data.reduce((sum, item) => sum + (item.planned_qty || 0), 0);
    const onTimeCount = data.filter(item => item.on_time).length;

    setKpiData({
      yieldPercent: totalInput > 0 ? (totalOutput / totalInput) * 100 : 0,
      consumptionPerKg: totalOutput > 0 ? totalInput / totalOutput : 0,
      planAccuracy: totalPlanned > 0 ? (totalOutput / totalPlanned) * 100 : 0,
      onTimePercent: data.length > 0 ? (onTimeCount / data.length) * 100 : 0
    });
  };

  const handleExport = async () => {
    try {
      const endpoint = yieldType === 'PR' ? '/api/exports/yield-pr.xlsx' : '/api/exports/yield-fg.xlsx';
      const params = new URLSearchParams({
        bucket,
        from: getDateFrom(dateRange),
        to: new Date().toISOString()
      });
      
      const response = await fetch(`${endpoint}?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `yield-${yieldType.toLowerCase()}-${bucket}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Yield Report</h2>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="last-7-days">Last 7 days</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="this-month">This month</option>
            <option value="custom">Custom range</option>
          </select>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* PR/FG Toggle */}
      <div className="mb-6">
        <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setYieldType('PR')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              yieldType === 'PR' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PR (Processed Raw)
          </button>
          <button
            onClick={() => setYieldType('FG')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              yieldType === 'FG' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FG (Finished Goods)
          </button>
        </div>
      </div>

      {/* Time Bucket Selector */}
      <div className="mb-6">
        <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
          {(['day', 'week', 'month'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBucket(b)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                bucket === b 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Yield %</div>
          <div className="text-2xl font-bold text-slate-900">
            {kpiData.yieldPercent.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">
            {yieldType === 'PR' ? 'Consumption/kg' : 'Waste'}
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {yieldType === 'PR' 
              ? `${kpiData.consumptionPerKg.toFixed(2)} kg` 
              : `${(100 - kpiData.yieldPercent).toFixed(1)}%`
            }
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Plan Accuracy</div>
          <div className="text-2xl font-bold text-slate-900">
            {kpiData.planAccuracy.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">On-Time WO%</div>
          <div className="text-2xl font-bold text-slate-900">
            {kpiData.onTimePercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Drill-down Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {yieldType} Yield Details ({bucket.charAt(0).toUpperCase() + bucket.slice(1)})
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading yield data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Line</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">WO</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Planned</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actual</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Yield%</th>
                  {yieldType === 'PR' && (
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Per-Op Yield</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {yieldData.length === 0 ? (
                  <tr className="border-b border-slate-100">
                    <td colSpan={yieldType === 'PR' ? 8 : 7} className="py-8 text-center text-slate-500 text-sm">
                      No yield data available for selected period
                    </td>
                  </tr>
                ) : (
                  yieldData.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm">
                        {new Date(item.date_bucket).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm">{item.line_name || '-'}</td>
                      <td className="py-3 px-4 text-sm">{item.product_name}</td>
                      <td className="py-3 px-4 text-sm font-medium">{item.wo_number}</td>
                      <td className="py-3 px-4 text-sm">{item.planned_qty?.toFixed(2) || '-'}</td>
                      <td className="py-3 px-4 text-sm">{item.actual_output_kg?.toFixed(2) || '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`font-medium ${
                          item.yield_percent >= 90 ? 'text-green-600' :
                          item.yield_percent >= 70 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {item.yield_percent?.toFixed(1)}%
                        </span>
                      </td>
                      {yieldType === 'PR' && (
                        <td className="py-3 px-4 text-sm">
                          <div className="text-xs">
                            {item.per_operation_yield ? 
                              Object.entries(item.per_operation_yield).map(([op, yieldValue]) => (
                                <div key={op}>{op}: {String(yieldValue)}%</div>
                              )) : '-'
                            }
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsumeReportTab() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('last-7-days');
  const [summary, setSummary] = useState({
    totalMaterials: 0,
    uniqueMaterials: 0,
    totalWorkOrders: 0,
    totalVariance: 0
  });

  useEffect(() => {
    fetchConsumeData();
  }, [dateRange]);

  const fetchConsumeData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: getDateFrom(dateRange),
        to: new Date().toISOString()
      });
      
      const response = await fetch(`/api/production/consume?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data || []);
        calculateSummary(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load consume data');
    } finally {
      setLoading(false);
    }
  };

  const getDateFrom = (range: string) => {
    const now = new Date();
    switch (range) {
      case 'last-7-days':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'last-30-days':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      case 'this-month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const calculateSummary = (records: any[]) => {
    const uniqueMaterials = new Set(records.map(r => r.material_id)).size;
    const uniqueWOs = new Set(records.map(r => r.wo_number)).size;
    const totalVariance = records.reduce((sum, r) => sum + (r.variance || 0), 0);

    setSummary({
      totalMaterials: records.length,
      uniqueMaterials,
      totalWorkOrders: uniqueWOs,
      totalVariance
    });
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        from: getDateFrom(dateRange),
        to: new Date().toISOString()
      });
      
      const response = await fetch(`/api/exports/consume.xlsx?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `consume-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleBOMClick = (woNumber: string) => {
    // Navigate to BOM details or open modal
    console.log('View BOM for WO:', woNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-600">Loading consume report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="font-semibold">Error loading report</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Consume Report</h2>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="last-7-days">Last 7 days</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="this-month">This month</option>
            <option value="custom">Custom range</option>
          </select>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Total Materials</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.totalMaterials} items
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Unique Materials</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.uniqueMaterials}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Work Orders</div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.totalWorkOrders}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Total Variance</div>
          <div className={`text-2xl font-bold ${
            summary.totalVariance > 0 ? 'text-red-600' : 
            summary.totalVariance < 0 ? 'text-green-600' : 'text-slate-900'
          }`}>
            {summary.totalVariance > 0 ? '+' : ''}{summary.totalVariance.toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Material Variance Table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Material Variance Analysis</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">WO Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Material</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">BOM Standard</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actual Consumed</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Variance (Qty)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Variance (%)</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Line</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr className="border-b border-slate-100">
                  <td colSpan={9} className="py-8 text-center text-slate-500 text-sm">
                    No consumption data available for selected period
                  </td>
                </tr>
              ) : (
                data.map((record, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium">{record.wo_number}</td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <div className="font-medium">{record.material_part_number}</div>
                        <div className="text-xs text-slate-500">{record.material_description}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {record.standard_qty?.toFixed(2) || '-'} {record.uom}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {record.consumed_qty?.toFixed(2) || '-'} {record.uom}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`font-medium ${
                        record.variance > 0 ? 'text-red-600' : 
                        record.variance < 0 ? 'text-green-600' : 'text-slate-600'
                      }`}>
                        {record.variance > 0 ? '+' : ''}{record.variance?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`font-medium ${
                        record.variance_percentage > 0 ? 'text-red-600' : 
                        record.variance_percentage < 0 ? 'text-green-600' : 'text-slate-600'
                      }`}>
                        {record.variance_percentage > 0 ? '+' : ''}{record.variance_percentage?.toFixed(1) || '0.0'}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{record.line_name || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      {record.date ? new Date(record.date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <button
                        onClick={() => handleBOMClick(record.wo_number)}
                        className="text-slate-600 hover:text-slate-900 text-sm underline"
                      >
                        View BOM
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OperationsTab() {
  const [selectedWO, setSelectedWO] = useState<string>('');
  const [operations, setOperations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<any>(null);

  useEffect(() => {
    if (selectedWO) {
      fetchOperations();
    }
  }, [selectedWO]);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/production/work-orders/${selectedWO}`);
      const result = await response.json();
      
      if (result.success && result.data.operations) {
        setOperations(result.data.operations);
      }
    } catch (error) {
      console.error('Failed to fetch operations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordWeights = (operation: any) => {
    setSelectedOperation(operation);
    setShowWeightModal(true);
  };

  const handleWeightSubmit = async (weights: any) => {
    try {
      const response = await fetch(`/api/production/wo/${selectedWO}/operations/${selectedOperation.sequence}/weights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights)
      });
      
      const result = await response.json();
      if (result.success) {
        setShowWeightModal(false);
        fetchOperations(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to record weights:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Operations</h2>
        <div className="flex gap-2">
          <select 
            value={selectedWO} 
            onChange={(e) => setSelectedWO(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-md text-sm"
          >
            <option value="">Select Work Order</option>
            {/* WO options would be populated from API */}
          </select>
          <button 
            onClick={() => setShowWeightModal(true)}
            disabled={!selectedWO}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Record Weights
          </button>
        </div>
      </div>

      {selectedWO ? (
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">
              Operations for WO {selectedWO}
            </h3>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              <span className="ml-2 text-slate-600">Loading operations...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Seq</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Operation</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Planned IN</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Planned OUT</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actual IN</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actual OUT</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Losses</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Yield %</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Start/End</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Operator</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.length === 0 ? (
                    <tr className="border-b border-slate-100">
                      <td colSpan={11} className="py-8 text-center text-slate-500 text-sm">
                        No operations found for this work order
                      </td>
                    </tr>
                  ) : (
                    operations.map((op, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-medium">{op.sequence}</td>
                        <td className="py-3 px-4 text-sm">
                          <div className="font-medium">{op.operation_name}</div>
                          <div className="text-xs text-slate-500">{op.description}</div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {op.planned_input_weight?.toFixed(2) || '-'} kg
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {op.planned_output_weight?.toFixed(2) || '-'} kg
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {op.actual_input_weight?.toFixed(2) || '-'} kg
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {op.actual_output_weight?.toFixed(2) || '-'} kg
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="text-xs">
                            {op.cooking_loss_weight && (
                              <div>Cooking: {op.cooking_loss_weight.toFixed(2)} kg</div>
                            )}
                            {op.trim_loss_weight && (
                              <div>Trim: {op.trim_loss_weight.toFixed(2)} kg</div>
                            )}
                            {op.marinade_gain_weight && (
                              <div>Gain: +{op.marinade_gain_weight.toFixed(2)} kg</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`font-medium ${
                            op.yield_percent >= 90 ? 'text-green-600' :
                            op.yield_percent >= 70 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {op.yield_percent?.toFixed(1) || '-'}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="text-xs">
                            {op.started_at && (
                              <div>Start: {new Date(op.started_at).toLocaleString()}</div>
                            )}
                            {op.finished_at && (
                              <div>End: {new Date(op.finished_at).toLocaleString()}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {op.operator_name || '-'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button
                            onClick={() => handleRecordWeights(op)}
                            className="text-slate-600 hover:text-slate-900 text-sm underline"
                          >
                            Record
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-slate-500 text-sm">
            Select a work order to view its operations
          </div>
        </div>
      )}

      {/* Weight Recording Modal */}
      {showWeightModal && (
        <RecordWeightsModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
          operation={selectedOperation}
          onSubmit={handleWeightSubmit}
          woId={selectedOperation?.wo_id || ''}
          operationSeq={selectedOperation?.seq_no || 0}
        />
      )}
    </div>
  );
}

function TraceTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [traceType, setTraceType] = useState<'forward' | 'backward'>('forward');
  const [traceData, setTraceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const endpoint = traceType === 'forward' ? '/api/production/trace/forward' : '/api/production/trace/backward';
      const params = new URLSearchParams({ lp: searchQuery });
      
      const response = await fetch(`${endpoint}?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setTraceData(result.data);
      } else {
        setError(result.error || 'No trace data found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trace data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!traceData) return;
    
    try {
      const params = new URLSearchParams({ lp: searchQuery });
      const response = await fetch(`/api/exports/trace.xlsx?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trace-${traceType}-${searchQuery}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const renderTraceNode = (node: any, level = 0) => {
    const indent = level * 20;
    
    return (
      <div key={node.id} className="mb-2">
        <div 
          className="flex items-center p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
          style={{ marginLeft: `${indent}px` }}
          onClick={() => setSelectedNode(node)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{node.type}</span>
              <span className="text-sm text-slate-600">{node.identifier}</span>
              {node.qa_status && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  node.qa_status === 'Passed' ? 'bg-green-100 text-green-800' :
                  node.qa_status === 'Failed' ? 'bg-red-100 text-red-800' :
                  node.qa_status === 'Quarantine' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {node.qa_status}
                </span>
              )}
              {node.stage_suffix && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {node.stage_suffix}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500 mt-1">
              {node.description}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Qty: {node.quantity} {node.uom} | Date: {node.date}
            </div>
          </div>
        </div>
        
        {node.children && node.children.map((child: any) => renderTraceNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Trace</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            disabled={!traceData}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export Trace
          </button>
        </div>
      </div>

      {/* Search Controls */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter LP number or WO number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Search
          </button>
        </div>
        
        <div className="flex bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTraceType('forward')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              traceType === 'forward' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Forward Trace
          </button>
          <button
            onClick={() => setTraceType('backward')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              traceType === 'backward' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Backward Trace
          </button>
        </div>
      </div>

      {/* Trace Results */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-600">Loading trace data...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {traceData && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trace Tree */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">
                  {traceType === 'forward' ? 'Forward' : 'Backward'} Trace Tree
                </h3>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {traceData.root ? renderTraceNode(traceData.root) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No trace data found
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Node Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Node Details</h3>
              </div>
              <div className="p-4">
                {selectedNode ? (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-slate-700">Type</div>
                      <div className="text-sm text-slate-900">{selectedNode.type}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">Identifier</div>
                      <div className="text-sm text-slate-900">{selectedNode.identifier}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">Description</div>
                      <div className="text-sm text-slate-900">{selectedNode.description}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">Quantity</div>
                      <div className="text-sm text-slate-900">{selectedNode.quantity} {selectedNode.uom}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">Date</div>
                      <div className="text-sm text-slate-900">{selectedNode.date}</div>
                    </div>
                    {selectedNode.qa_status && (
                      <div>
                        <div className="text-sm font-medium text-slate-700">QA Status</div>
                        <div className="text-sm text-slate-900">{selectedNode.qa_status}</div>
                      </div>
                    )}
                    {selectedNode.stage_suffix && (
                      <div>
                        <div className="text-sm font-medium text-slate-700">Stage Suffix</div>
                        <div className="text-sm text-slate-900">{selectedNode.stage_suffix}</div>
                      </div>
                    )}
                    {selectedNode.location && (
                      <div>
                        <div className="text-sm font-medium text-slate-700">Location</div>
                        <div className="text-sm text-slate-900">{selectedNode.location}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Click on a node to view details
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
