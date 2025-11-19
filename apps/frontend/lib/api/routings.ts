import { supabase } from '@/lib/supabase/client-browser';
import type { Routing, RoutingOperation } from '@/lib/types';

export interface CreateRoutingDTO {
  name: string;
  product_id?: number;
  is_active?: boolean;
  notes?: string;
  operations?: Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>[];
}

export class RoutingsAPI {
  static async getAll(): Promise<Routing[]> {
    const { data, error } = await supabase
      .from('routings')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching routings:', error);
      throw new Error('Failed to fetch routings');
    }

    let routingOperations: any[] = [];
    try {
      const { data: operationsData } = await supabase
        .from('routing_operations')
        .select('*');
      routingOperations = operationsData || [];
    } catch (e) {
      console.warn('Routing operations not available');
    }

    return (data || []).map(routing => ({
      ...routing,
      operations: routingOperations
        .filter(op => op.routing_id === routing.id)
        .map(op => ({
          id: op.id,
          routing_id: op.routing_id,
          sequence: op.sequence,
          operation_name: op.operation_name,
          machine_id: op.machine_id,
          run_time_mins: op.run_time_mins,
          setup_time_mins: op.setup_time_mins,
          work_center: op.work_center,
          notes: op.notes,
          created_at: op.created_at,
          updated_at: op.updated_at,
        }))
    }));
  }

  static async getById(id: number): Promise<Routing> {
    const { data, error } = await supabase
      .from('routings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching routing:', error);
      throw new Error('Failed to fetch routing');
    }

    let operations: any[] = [];
    try {
      const { data: ops } = await supabase
        .from('routing_operations')
        .select('*')
        .eq('routing_id', id)
        .order('sequence');
      operations = ops || [];
    } catch (e) {}

    return {
      ...data,
      operations: operations.map(op => ({
        id: op.id,
        routing_id: op.routing_id,
        sequence: op.sequence,
        operation_name: op.operation_name,
        machine_id: op.machine_id,
        run_time_mins: op.run_time_mins,
        setup_time_mins: op.setup_time_mins,
        work_center: op.work_center,
        notes: op.notes,
        created_at: op.created_at,
        updated_at: op.updated_at,
      }))
    };
  }

  static async create(data: CreateRoutingDTO): Promise<Routing> {
    // Get user's org_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user's org_id from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.org_id) {
      console.error('Error getting user org_id:', userError);
      throw new Error('Failed to get user organization');
    }

    const { data: routing, error } = await supabase
      .from('routings')
      .insert({
        name: data.name,
        product_id: data.product_id || null,
        is_active: data.is_active ?? true,
        notes: data.notes || null,
        org_id: userData.org_id
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating routing:', error);
      throw new Error('Failed to create routing');
    }

    if (data.operations && data.operations.length > 0) {
      const ops = data.operations.map(op => ({
        routing_id: routing.id,
        sequence: op.sequence,
        operation_name: op.operation_name,
        machine_id: op.machine_id || null,
        run_time_mins: op.run_time_mins || null,
        setup_time_mins: op.setup_time_mins || null,
        work_center: op.work_center || null,
        notes: op.notes || null
      }));

      const { data: insertedOps, error: opsError } = await supabase
        .from('routing_operations')
        .insert(ops)
        .select();

      if (opsError) {
        console.error('Error creating operations:', opsError);
        throw new Error('Failed to create routing operations');
      }

      return { ...routing, operations: insertedOps || [] };
    }

    return { ...routing, operations: [] };
  }

  static async update(id: number, data: any): Promise<Routing> {
    const { operations, ...routingData } = data;

    const { data: result, error } = await supabase
      .from('routings')
      .update({ ...routingData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating routing:', error);
      throw new Error('Failed to update routing');
    }

    if (operations !== undefined) {
      await supabase.from('routing_operations').delete().eq('routing_id', id);

      if (operations.length > 0) {
        const ops = operations.map((op: any) => ({
          routing_id: id,
          sequence: op.sequence,
          operation_name: op.operation_name,
          machine_id: op.machine_id || null,
          run_time_mins: op.run_time_mins || null,
          setup_time_mins: op.setup_time_mins || null,
          work_center: op.work_center || null,
          notes: op.notes || null
        }));

        const { data: insertedOps } = await supabase
          .from('routing_operations')
          .insert(ops)
          .select();

        return { ...result, operations: insertedOps || [] };
      }
    }

    const { data: existingOps } = await supabase
      .from('routing_operations')
      .select('*')
      .eq('routing_id', id)
      .order('sequence');

    return { ...result, operations: existingOps || [] };
  }

  static async delete(id: number): Promise<void> {
    await supabase.from('routing_operations').delete().eq('routing_id', id);
    const { error } = await supabase.from('routings').delete().eq('id', id);
    if (error) throw new Error('Failed to delete routing');
  }
}
