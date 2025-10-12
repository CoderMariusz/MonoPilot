'use client';

import { useState } from 'react';
import { MapPin, Cog, AlertTriangle, Truck, Warehouse } from 'lucide-react';
import { LocationsTable } from '@/components/LocationsTable';
import { MachinesTable } from '@/components/MachinesTable';
import { AllergensTable } from '@/components/AllergensTable';
import { SuppliersTable } from '@/components/SuppliersTable';
import { WarehousesTable } from '@/components/WarehousesTable';

type TabType = 'locations' | 'machines' | 'allergens' | 'suppliers' | 'warehouses';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('locations');

  const tabs = [
    { id: 'locations' as TabType, label: 'Locations', icon: MapPin },
    { id: 'machines' as TabType, label: 'Machines', icon: Cog },
    { id: 'allergens' as TabType, label: 'Allergens', icon: AlertTriangle },
    { id: 'suppliers' as TabType, label: 'Suppliers', icon: Truck },
    { id: 'warehouses' as TabType, label: 'Warehouses', icon: Warehouse },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Settings</h1>
      
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
          {activeTab === 'locations' && <LocationsTab />}
          {activeTab === 'machines' && <MachinesTab />}
          {activeTab === 'allergens' && <AllergensTab />}
          {activeTab === 'suppliers' && <SuppliersTab />}
          {activeTab === 'warehouses' && <WarehousesTab />}
        </div>
      </div>
    </div>
  );
}

function LocationsTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Locations</h2>
      </div>
      <LocationsTable />
    </div>
  );
}

function MachinesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Machines</h2>
      </div>
      <MachinesTable />
    </div>
  );
}

function AllergensTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Allergens</h2>
      </div>
      <AllergensTable />
    </div>
  );
}

function SuppliersTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Suppliers</h2>
      </div>
      <SuppliersTable />
    </div>
  );
}

function WarehousesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Warehouses</h2>
      </div>
      <WarehousesTable />
    </div>
  );
}
