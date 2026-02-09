'use client';

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

interface RoleListProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
}

export function RoleList({ roles, onEdit, onDelete }: RoleListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const countPermissions = (role: Role) => {
    let count = 0;
    Object.values(role.permissions).forEach(module => {
      Object.values(module).forEach(allowed => {
        if (allowed) count++;
      });
    });
    return count;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Name</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Description</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Permissions</th>
            <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Users</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Created</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-100">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role, index) => (
            <tr
              key={role.id}
              className={`border-b border-gray-200 dark:border-gray-800 ${
                index % 2 === 0
                  ? 'bg-white dark:bg-gray-900'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              } hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
            >
              <td className="px-6 py-4">
                <div className="font-medium text-gray-900 dark:text-gray-100">{role.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">ID: {role.id}</div>
              </td>
              <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-sm">
                {role.description}
              </td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-sm font-medium">
                  {countPermissions(role)}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {role.userCount ?? 0}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(role.createdAt)}
              </td>
              <td className="px-6 py-4 text-right space-x-2">
                <button
                  onClick={() => onEdit(role)}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
                >
                  Edit
                </button>
                {role.id !== 'admin' && role.id !== 'user' && (
                  <button
                    onClick={() => onDelete(role.id)}
                    className="text-red-600 dark:text-red-400 hover:underline font-medium text-sm"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
