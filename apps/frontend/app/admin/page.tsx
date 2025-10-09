'use client';

import { useState } from 'react';
import { Users, Monitor, Settings } from 'lucide-react';
import { UsersTable } from '@/components/UsersTable';
import { CreateUserModal } from '@/components/CreateUserModal';
import { SessionsTable } from '@/components/SessionsTable';
import { SettingsForm } from '@/components/SettingsForm';

type TabType = 'users' | 'sessions' | 'settings';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users');

  const tabs = [
    { id: 'users' as TabType, label: 'User Management', icon: Users },
    { id: 'sessions' as TabType, label: 'Sessions', icon: Monitor },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Admin</h1>
      
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
          {activeTab === 'users' && <UserManagementTab />}
          {activeTab === 'sessions' && <SessionsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  );
}

function UserManagementTab() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">User Management</h2>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm"
        >
          Create User
        </button>
      </div>
      <UsersTable key={refreshKey} />
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

function SessionsTab() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Active Sessions</h2>
        <p className="text-sm text-slate-600 mt-1">Manage user sessions and security</p>
      </div>
      <SessionsTable />
    </div>
  );
}

function SettingsTab() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">System Settings</h2>
        <p className="text-sm text-slate-600 mt-1">Configure system-wide settings and preferences</p>
      </div>
      <SettingsForm />
    </div>
  );
}
