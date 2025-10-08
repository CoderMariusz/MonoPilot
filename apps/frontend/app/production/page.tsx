'use client';

import { useState } from 'react';
import { ClipboardList, TrendingUp, Package } from 'lucide-react';
import { WorkOrdersTable } from '@/components/WorkOrdersTable';

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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Total Output</div>
          <div className="text-2xl font-bold text-slate-900">1,250 pcs</div>
          <div className="text-xs text-green-600 mt-1">+12% from last period</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Yield Rate</div>
          <div className="text-2xl font-bold text-slate-900">94.5%</div>
          <div className="text-xs text-green-600 mt-1">+2.3% from last period</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Scrap Rate</div>
          <div className="text-2xl font-bold text-slate-900">5.5%</div>
          <div className="text-xs text-red-600 mt-1">-0.8% from last period</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">WO Number</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Product</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Target Qty</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Actual Output</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Scrap</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Yield %</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                No production data available for selected period
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConsumeReportTab() {
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
          <div className="text-2xl font-bold text-slate-900">45 items</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Total Value</div>
          <div className="text-2xl font-bold text-slate-900">$12,450</div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="text-sm text-slate-600 mb-1">Variance</div>
          <div className="text-2xl font-bold text-slate-900">-2.3%</div>
          <div className="text-xs text-green-600 mt-1">Within tolerance</div>
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
            <tr className="border-b border-slate-100">
              <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                No consumption data available for selected period
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
