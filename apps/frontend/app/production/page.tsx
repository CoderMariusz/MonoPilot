'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, TrendingUp, Package, Loader2 } from 'lucide-react';
import { WorkOrdersTable } from '@/components/WorkOrdersTable';
import { mockConsumeReport } from '@/lib/mockData';
import { useYieldReports, useWorkOrders, getFilteredBomForWorkOrder } from '@/lib/clientState';
import type { ConsumeReport, YieldReportDetail } from '@/lib/types';

type TabType = 'work-orders' | 'yield-report' | 'consume-report';

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState<TabType>('work-orders');

  const tabs = [
    { id: 'work-orders' as TabType, label: 'Work Orders', icon: ClipboardList },
    { id: 'yield-report' as TabType, label: 'Yield Report', icon: TrendingUp },
    { id: 'consume-report' as TabType, label: 'Consume Report', icon: Package },
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
  const yieldReports = useYieldReports();
  const workOrders = useWorkOrders();

  const sortedReports = [...yieldReports].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600 font-semibold';
    if (efficiency >= 70) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const getWorkOrder = (workOrderId: number) => {
    return workOrders.find(wo => wo.id === workOrderId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Yield Report</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
            <option>Custom range</option>
          </select>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm">
            Export Report
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">WO Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Line</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Target Qty</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actual Qty</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">BOM Materials</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Consumed Materials</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Yield %</th>
            </tr>
          </thead>
          <tbody>
            {sortedReports.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={8} className="py-8 text-center text-slate-500 text-sm">
                  No yield reports available. Close a work order in the scanner terminal to generate a report.
                </td>
              </tr>
            ) : (
              sortedReports.map((report) => {
                const workOrder = getWorkOrder(report.work_order_id);
                const targetQty = workOrder ? parseFloat(workOrder.quantity) : 0;
                const actualQty = report.actual_quantity;
                const yieldPercent = targetQty > 0 ? Math.round((actualQty / targetQty) * 100) : 0;
                const bomItems = workOrder ? getFilteredBomForWorkOrder(workOrder) : [];

                return (
                  <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm font-medium">{report.work_order_number}</td>
                    <td className="py-3 px-4 text-sm">{report.product_name}</td>
                    <td className="py-3 px-4 text-sm">{report.line_number || '-'}</td>
                    <td className="py-3 px-4 text-sm">{targetQty.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm">{actualQty.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm">
                      {bomItems.length > 0 ? (
                        <div className="space-y-1">
                          {bomItems.map((item) => {
                            const totalNeeded = actualQty * parseFloat(item.quantity);
                            return (
                              <div key={item.id} className="text-xs">
                                <span className="font-medium">{item.material?.part_number || 'N/A'}</span>
                                {' - '}
                                <span className="text-slate-600">{totalNeeded.toFixed(2)} {item.uom}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No BOM</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {report.materials_used.length > 0 ? (
                        <div className="space-y-1">
                          {report.materials_used.map((material, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{material.item_code}</span>
                              {' - '}
                              <span className="text-slate-600">{material.quantity.toFixed(2)} {material.uom}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className={getEfficiencyColor(yieldPercent)}>
                        {yieldPercent}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConsumeReportTab() {
  const [data, setData] = useState<ConsumeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setData(mockConsumeReport);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Consume Report</h2>
        <div className="flex gap-2">
          <select className="px-3 py-2 border border-slate-300 rounded-md text-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>This month</option>
            <option>Custom range</option>
          </select>
          <button className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Total Materials Consumed</div>
          <div className="text-2xl font-bold text-slate-900">
            {data?.summary.total_materials_consumed} items
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Unique Materials</div>
          <div className="text-2xl font-bold text-slate-900">
            {data?.summary.unique_materials}
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Work Orders</div>
          <div className="text-2xl font-bold text-slate-900">
            {data?.summary.total_work_orders}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">WO Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Material</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Standard Qty</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Consumed Qty</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Variance</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {data?.consumption_records.length === 0 ? (
              <tr className="border-b border-slate-100">
                <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                  No consumption data available for selected period
                </td>
              </tr>
            ) : (
              data?.consumption_records.map((record, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{record.wo_number}</td>
                  <td className="py-3 px-4 text-sm">
                    {record.material ? (
                      <div>
                        <div className="font-medium">{record.material.part_number}</div>
                        <div className="text-xs text-slate-500">{record.material.description}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {record.standard_qty.toFixed(2)} {record.material?.uom}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {record.consumed_qty.toFixed(2)} {record.material?.uom}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={record.variance > 0 ? 'text-red-600' : record.variance < 0 ? 'text-green-600' : 'text-slate-600'}>
                      {record.variance > 0 ? '+' : ''}{record.variance.toFixed(2)} ({record.variance_percentage.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{record.date}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
