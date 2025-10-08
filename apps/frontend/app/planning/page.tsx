'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, ShoppingCart, ArrowRightLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { WorkOrdersTable } from '@/components/WorkOrdersTable';
import { CreateWorkOrderModal } from '@/components/CreateWorkOrderModal';
import type { PurchaseOrder, TransferOrder } from '@/lib/types';

type TabType = 'work-orders' | 'purchase-orders' | 'transfer-orders';

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState<TabType>('work-orders');

  const tabs = [
    { id: 'work-orders' as TabType, label: 'Work Orders', icon: ClipboardList },
    { id: 'purchase-orders' as TabType, label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'transfer-orders' as TabType, label: 'Transfer Orders', icon: ArrowRightLeft },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Planning</h1>
      
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
          {activeTab === 'purchase-orders' && <PurchaseOrdersTab />}
          {activeTab === 'transfer-orders' && <TransferOrdersTab />}
        </div>
      </div>
    </div>
  );
}

function WorkOrdersTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Work Orders</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
        >
          Create Work Order
        </button>
      </div>
      <WorkOrdersTable key={refreshKey} />
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

function PurchaseOrdersTab() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.purchaseOrders.list()
      .then(setPurchaseOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Purchase Orders</h2>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm">
          Create Purchase Order
        </button>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}
      
      {error && (
        <div className="py-4 px-6 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Error loading purchase orders: {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">PO Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Supplier</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Due Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Items</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 ? (
                <tr className="border-b border-slate-100">
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                purchaseOrders.map(po => (
                  <tr key={po.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm">{po.po_number}</td>
                    <td className="py-3 px-4 text-sm">{po.supplier}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        po.status === 'received' ? 'bg-green-100 text-green-800' :
                        po.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{po.due_date || '-'}</td>
                    <td className="py-3 px-4 text-sm">{po.purchase_order_items?.length || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransferOrdersTab() {
  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.transferOrders.list()
      .then(setTransferOrders)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Transfer Orders</h2>
        <button className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm">
          Create Transfer Order
        </button>
      </div>
      
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}
      
      {error && (
        <div className="py-4 px-6 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          Error loading transfer orders: {error}
        </div>
      )}
      
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">TO Number</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">From Location</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">To Location</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Items</th>
              </tr>
            </thead>
            <tbody>
              {transferOrders.length === 0 ? (
                <tr className="border-b border-slate-100">
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    No transfer orders found
                  </td>
                </tr>
              ) : (
                transferOrders.map(to => (
                  <tr key={to.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-sm">{to.to_number}</td>
                    <td className="py-3 px-4 text-sm">{to.from_location?.code || '-'}</td>
                    <td className="py-3 px-4 text-sm">{to.to_location?.code || '-'}</td>
                    <td className="py-3 px-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        to.status === 'received' ? 'bg-green-100 text-green-800' :
                        to.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                        to.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {to.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{to.transfer_order_items?.length || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
