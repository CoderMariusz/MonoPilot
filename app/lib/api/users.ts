import type { CreateUserInput, UpdateUserInput } from '@/lib/schemas/user';

export interface User {
  id: string;
  org_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  last_login_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsersFilters {
  role?: string;
  status?: string;
  search?: string;
}

export class UsersAPI {
  static async getUsers(filters?: UsersFilters): Promise<User[]> {
    const params = new URLSearchParams();

    if (filters?.role) {
      params.append('role', filters.role);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `/api/settings/users${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }

    return response.json();
  }

  static async createUser(data: CreateUserInput): Promise<User> {
    const response = await fetch('/api/settings/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }

    return response.json();
  }

  static async updateUser(id: string, data: UpdateUserInput): Promise<User> {
    const response = await fetch(`/api/settings/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }

    return response.json();
  }

  static async deleteUser(id: string): Promise<void> {
    const response = await fetch(`/api/settings/users/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to deactivate user');
    }
  }
}
