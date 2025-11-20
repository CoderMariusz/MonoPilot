'use client';

import { useState, useEffect } from 'react';
import { UsersAPI } from '@/lib/api/users';
import type { User, UsersFilters } from '@/lib/api/users';
import UserTable from '@/components/settings/UserTable';
import UserDialog from '@/components/settings/UserDialog';
import { UserRoleEnum } from '@/lib/schemas/user';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UsersFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await UsersAPI.getUsers(filters);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: searchInput || undefined });
  };

  const handleRoleFilter = (role: string) => {
    if (role === '') {
      const { role: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, role });
    }
  };

  const handleStatusFilter = (status: string) => {
    if (status === '') {
      const { status: _, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({ ...filters, status });
    }
  };

  const handleCreateClick = () => {
    setSelectedUser(null);
    setDialogMode('create');
    setIsDialogOpen(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleDeleteClick = async (user: User) => {
    try {
      await UsersAPI.deleteUser(user.id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate user');
    }
  };

  const handleDialogSuccess = () => {
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage users, roles, and permissions
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-800 bg-red-100 rounded-lg" data-testid="error-message">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    data-testid="search-input"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    data-testid="search-button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Search
                  </button>
                </form>

                <select
                  value={filters.role || ''}
                  onChange={(e) => handleRoleFilter(e.target.value)}
                  data-testid="role-filter"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  {UserRoleEnum.options.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status || ''}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  data-testid="status-filter"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                onClick={handleCreateClick}
                data-testid="create-user-button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                + Create User
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              Loading users...
            </div>
          ) : (
            <UserTable
              users={users}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          )}
        </div>
      </div>

      <UserDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        user={selectedUser}
        mode={dialogMode}
      />
    </div>
  );
}
