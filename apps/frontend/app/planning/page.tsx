'use client';

import { useState } from 'react';
import { ClipboardList, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { WorkOrdersTable } from '@/components/WorkOrdersTable';
import { CreateWorkOrderModal } from '@/components/CreateWorkOrderModal';
import { PurchaseOrdersTable } from '@/components/PurchaseOrdersTable';
import { CreatePurchaseOrderModal } from '@/components/CreatePurchaseOrderModal';
import { TransferOrdersTable } from '@/components/TransferOrdersTable';
import { CreateTransferOrderModal } from '@/components/CreateTransferOrderModal';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Purchase Orders</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
        >
          Create Purchase Order
        </button>
      </div>
      <PurchaseOrdersTable key={refreshKey} />
      <CreatePurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

function TransferOrdersTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Transfer Orders</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
        >
          Create Transfer Order
        </button>
      </div>
      <TransferOrdersTable key={refreshKey} />
      <CreateTransferOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
