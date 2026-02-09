'use client';

interface PermissionMatrixProps {
  permissions: {
    [module: string]: {
      [action: string]: boolean;
    };
  };
  onChange: (permissions: PermissionMatrixProps['permissions']) => void;
  modules: {
    [module: string]: string[];
  };
}

const MODULE_ICONS: Record<string, string> = {
  dashboard: '📊',
  tasks: '✅',
  shopping: '🛒',
  settings: '⚙️',
  analytics: '📈'
};

const ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
  edit: 'Edit',
  export: 'Export',
  manage_roles: 'Manage Roles',
  manage_integrations: 'Manage Integrations',
  manage_webhooks: 'Manage Webhooks'
};

export function PermissionMatrix({ permissions, onChange, modules }: PermissionMatrixProps) {
  const handleToggle = (module: string, action: string, checked: boolean) => {
    const updated = {
      ...permissions,
      [module]: {
        ...permissions[module],
        [action]: checked
      }
    };
    onChange(updated);
  };

  const handleSelectAll = (module: string, checked: boolean) => {
    const updated = {
      ...permissions,
      [module]: {}
    };
    modules[module].forEach(action => {
      updated[module][action] = checked;
    });
    onChange(updated);
  };

  const getModuleCoveragePercent = (module: string) => {
    const actions = modules[module];
    const selected = actions.filter(action => permissions[module][action]).length;
    return Math.round((selected / actions.length) * 100);
  };

  return (
    <div className="space-y-4">
      {Object.entries(modules).map(([module, actions]) => (
        <div
          key={module}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          {/* Module Header */}
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="text-lg">{MODULE_ICONS[module] || '📦'}</span>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {module}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {actions.length} permissions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getModuleCoveragePercent(module)}%
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={actions.every(action => permissions[module][action])}
                  onChange={(e) => handleSelectAll(module, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Select All</span>
              </label>
            </div>
          </div>

          {/* Module Permissions */}
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {actions.map((action) => (
              <label
                key={action}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={permissions[module][action] || false}
                  onChange={(e) => handleToggle(module, action, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100">
                  {ACTION_LABELS[action] || action}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
