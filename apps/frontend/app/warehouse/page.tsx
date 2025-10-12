'use client';

import { useState } from 'react';
import { Package, TruckIcon, ClipboardList } from 'lucide-react';
import { GRNTable } from '@/components/GRNTable';
import { CreateGRNModal } from '@/components/CreateGRNModal';
import { StockMoveTable } from '@/components/StockMoveTable';
import { CreateStockMoveModal } from '@/components/CreateStockMoveModal';
import { LPOperationsTable } from '@/components/LPOperationsTable';

type TabType = 'grn' | 'stock-move' | 'lp-operations';


export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState<TabType>('grn');

  const tabs = [
    { id: 'grn' as TabType, label: 'GRN', icon: ClipboardList },
    { id: 'stock-move' as TabType, label: 'Stock Move', icon: TruckIcon },
    { id: 'lp-operations' as TabType, label: 'LP Stock', icon: Package },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Warehouse</h1>
      
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
          {activeTab === 'grn' && <GRNTab />}
          {activeTab === 'stock-move' && <StockMoveTab />}
          {activeTab === 'lp-operations' && <LPOperationsTab />}
        </div>
      </div>
    </div>
  );
}

function GRNTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Goods Receipt Notes</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
        >
          Create GRN
        </button>
      </div>
      <GRNTable key={refreshKey} />
      <CreateGRNModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

function StockMoveTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Stock Moves</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
        >
          Create Stock Move
        </button>
      </div>
      <StockMoveTable key={refreshKey} />
      <CreateStockMoveModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

function LPOperationsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">LP Stock</h2>
      </div>
      <LPOperationsTable />
    </div>
  );
}
