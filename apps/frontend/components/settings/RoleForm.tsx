'use client';

import { useState } from 'react';
import { PermissionMatrix } from './PermissionMatrix';

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

interface RoleFormProps {
  role: Role | null;
  defaultModules: {
    [module: string]: string[];
  };
  onSave: (role: Omit<Role, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function RoleForm({ role, defaultModules, onSave, onCancel }: RoleFormProps) {
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [permissions, setPermissions] = useState(
    role?.permissions ?? initializePermissions(defaultModules)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function initializePermissions(modules: typeof defaultModules) {
    const perms: Role['permissions'] = {};
    Object.entries(modules).forEach(([module, actions]) => {
      perms[module] = {};
      actions.forEach(action => {
        perms[module][action] = false;
      });
    });
    return perms;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Role name is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }

    const hasPermissions = Object.values(permissions).some(module =>
      Object.values(module).some(allowed => allowed)
    );
    if (!hasPermissions) {
      newErrors.permissions = 'At least one permission must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave({
      name,
      description,
      permissions,
      userCount: role?.userCount ?? 0
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {role ? 'Edit Role' : 'Create New Role'}
        </h2>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Editor, Reviewer, Viewer"
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.name
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-700'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
          />
          {errors.name && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this role's purpose"
            rows={2}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.description
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-300 dark:border-gray-700'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none`}
          />
          {errors.description && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>
      </div>

      {/* Permission Matrix */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Permissions *
        </label>
        <PermissionMatrix
          permissions={permissions}
          onChange={setPermissions}
          modules={defaultModules}
        />
        {errors.permissions && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.permissions}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
        >
          {role ? 'Update Role' : 'Create Role'}
        </button>
      </div>
    </form>
  );
}
