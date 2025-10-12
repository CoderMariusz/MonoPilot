'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { UsersAPI } from '@/lib/api/users';
import type { User } from '@/lib/types';
import { EditUserModal } from './EditUserModal';
import { toast } from '@/lib/toast';

const getRoleBadgeColor = (role: string) => {
  const colors: Record<string, string> = {
    Admin: 'bg-red-100 text-red-700',
    QC: 'bg-purple-100 text-purple-700',
    Planner: 'bg-blue-100 text-blue-700',
    Technical: 'bg-cyan-100 text-cyan-700',
    Purchasing: 'bg-green-100 text-green-700',
    Warehouse: 'bg-yellow-100 text-yellow-700',
    Operator: 'bg-slate-100 text-slate-700',
  };
  return colors[role] || 'bg-slate-100 text-slate-700';
};

const getStatusBadgeColor = (status: string) => {
  return status === 'Active' 
    ? 'bg-green-100 text-green-700' 
    : 'bg-red-100 text-red-700';
};

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersData = await UsersAPI.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      try {
        const { error } = await UsersAPI.delete(user.id);
        if (error) {
          toast.error(error.message || 'Failed to delete user');
          return;
        }
        toast.success(`User ${user.name} deleted successfully`);
        fetchUsers(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Name</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Email</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Role</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Last Login</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-900">{user.name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-slate-600">{formatDate(user.last_login)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-slate-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers(); // Refresh the list
          }}
          user={selectedUser}
        />
      )}
    </>
  );
}
