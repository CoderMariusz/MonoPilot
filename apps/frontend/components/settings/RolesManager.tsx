'use client';

import { useState } from 'react';
import { RoleList } from './RoleList';
import { RoleForm } from './RoleForm';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: {
    [module: string]: {
      [action: string]: boolean;
    };
  };
  userCount?: number;
  createdAt?: string;
}

const DEFAULT_MODULES = {
  'dashboard': ['view', 'edit'],
  'tasks': ['create', 'read', 'update', 'delete'],
  'shopping': ['create', 'read', 'update', 'delete'],
  'settings': ['view', 'manage_roles', 'manage_integrations', 'manage_webhooks'],
  'analytics': ['view', 'export']
};

export function RolesManager() {
  const [roles, setRoles] = useState<Role[]>([
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full system access',
      permissions: {
        dashboard: { view: true, edit: true },
        tasks: { create: true, read: true, update: true, delete: true },
        shopping: { create: true, read: true, update: true, delete: true },
        settings: { view: true, manage_roles: true, manage_integrations: true, manage_webhooks: true },
        analytics: { view: true, export: true }
      },
      userCount: 1,
      createdAt: '2026-01-01T00:00:00Z'
    },
    {
      id: 'user',
      name: 'User',
      description: 'Standard user access',
      permissions: {
        dashboard: { view: true, edit: true },
        tasks: { create: true, read: true, update: true, delete: false },
        shopping: { create: true, read: true, update: true, delete: false },
        settings: { view: true, manage_roles: false, manage_integrations: false, manage_webhooks: false },
        analytics: { view: true, export: false }
      },
      userCount: 5,
      createdAt: '2026-01-05T00:00:00Z'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleSaveRole = (role: Omit<Role, 'id' | 'createdAt'>) => {
    if (editingRole) {
      setRoles(roles.map(r => r.id === editingRole.id ? { ...role, id: editingRole.id, createdAt: editingRole.createdAt } : r));
    } else {
      const newRole: Role = {
        ...role,
        id: role.name.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date().toISOString()
      };
      setRoles([...roles, newRole]);
    }
    setEditingRole(null);
    setShowForm(false);
  };

  const handleDeleteRole = (roleId: string) => {
    if (roleId === 'admin' || roleId === 'user') {
      alert('Cannot delete default roles');
      return;
    }
    if (confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== roleId));
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Create Role Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {roles.length} role{roles.length !== 1 ? 's' : ''} configured
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Create Role
        </button>
      </div>

      {/* Role Form */}
      {showForm && (
        <RoleForm
          role={editingRole}
          defaultModules={DEFAULT_MODULES}
          onSave={handleSaveRole}
          onCancel={() => {
            setShowForm(false);
            setEditingRole(null);
          }}
        />
      )}

      {/* Roles List */}
      <RoleList
        roles={roles}
        onEdit={handleEditRole}
        onDelete={handleDeleteRole}
      />
    </div>
  );
}
