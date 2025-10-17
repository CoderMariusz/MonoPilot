import { shouldUseMockData } from './config';
import { supabase } from '../supabase/client';
import { clientState } from '../clientState';
import type { User } from '../types';

// User API - Dual mode (mock/real data)
export class UsersAPI {
  // Get all users
  static async getAll(): Promise<User[]> {
    if (shouldUseMockData()) {
      return clientState.getUsers();
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Get user by ID
  static async getById(id: string): Promise<User | null> {
    if (shouldUseMockData()) {
      const users = clientState.getUsers();
      return users.find(user => user.id === id) || null;
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  // Create new user (admin only - creates auth user + profile)
  static async create(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    status?: string;
  }): Promise<{ user?: User; error?: any }> {
    if (shouldUseMockData()) {
      const newUser = clientState.addUser({
        name: userData.name,
        email: userData.email,
        role: userData.role as any,
        status: userData.status as any || 'Active',
        last_login: null,
      });
      return { user: newUser };
    }
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          name: userData.name,
          role: userData.role,
        },
        email_confirm: true, // Auto-confirm email
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return { error: authError };
      }

      // The trigger should have created the profile, but let's fetch it
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching created profile:', profileError);
        return { error: profileError };
      }

      return { user: profile };
    } catch (error) {
      console.error('Error creating user:', error);
      return { error };
    }
  }

  // Update user
  static async update(id: string, updates: Partial<User>): Promise<{ user?: User; error?: any }> {
    if (shouldUseMockData()) {
      const updatedUser = clientState.updateUser(parseInt(id), updates);
      return { user: updatedUser };
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user:', error);
        return { error };
      }

      return { user: data };
    } catch (error) {
      console.error('Error updating user:', error);
      return { error };
    }
  }

  // Delete user
  static async delete(id: string): Promise<{ error?: any }> {
    if (shouldUseMockData()) {
      clientState.deleteUser(parseInt(id));
      return {};
    }
    
    try {
      // Delete the auth user (this will cascade to the profile due to foreign key)
      const { error } = await supabase.auth.admin.deleteUser(id);

      if (error) {
        console.error('Error deleting user:', error);
        return { error };
      }

      return {};
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error };
    }
  }

  // Update user status
  static async updateStatus(id: string, status: string): Promise<{ user?: User; error?: any }> {
    return this.update(id, { status: status as any });
  }

  // Update user role
  static async updateRole(id: string, role: string): Promise<{ user?: User; error?: any }> {
    return this.update(id, { role: role as any });
  }
}
