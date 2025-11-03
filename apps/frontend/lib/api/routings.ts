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
      .select(`
        *,
        products(id, part_number, description)
      `)
      .order('name');

    if (error) {
      console.error('Error fetching routings:', error);
      throw new Error('Failed to fetch routings');
    }

    // Try to fetch routing operations separately if the table exists
    let routingOperations: any[] = [];
    try {
      const { data: operationsData, error: operationsError } = await supabase
        .from('routing_operations')
        .select('*');
      
      if (operationsError) {
        console.warn('Routing operations table not available:', operationsError.message);
      } else {
        routingOperations = operationsData || [];
      }
    } catch (operationsError) {
      console.warn('Routing operations table not available:', operationsError);
    }

    // Manually join the data and map to RoutingOperation format
    const routingsWithOperations = (data || []).map(routing => ({
      ...routing,
      operations: routingOperations
        .filter(op => op.routing_id === routing.id)
        .map(op => ({
          id: op.id,
          routing_id: op.routing_id,
          seq_no: op.sequence_number,
          name: op.operation_name,
          code: op.code || undefined,
          description: op.description || undefined,
          requirements: op.requirements || [],
          created_at: op.created_at,
          updated_at: op.updated_at,
        }))
    }));

    return routingsWithOperations;
  }

  static async getById(id: number): Promise<Routing> {
    const { data, error } = await supabase
      .from('routings')
      .select(`
        *,
        products(id, part_number, description)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching routing:', error);
      throw new Error('Failed to fetch routing');
    }

    // Try to fetch routing operations separately if the table exists
    let routingOperations: any[] = [];
    try {
      const { data: operationsData } = await supabase
        .from('routing_operations')
        .select('*')
        .eq('routing_id', id);
      routingOperations = operationsData || [];
    } catch (operationsError) {
      console.warn('Routing operations table not available:', operationsError);
    }

    return {
      ...data,
      operations: routingOperations.map(op => ({
        id: op.id,
        routing_id: op.routing_id,
        seq_no: op.sequence_number,
        name: op.operation_name,
        code: op.code || undefined,
        description: op.description || undefined,
        requirements: op.requirements || [],
        created_at: op.created_at,
        updated_at: op.updated_at,
      }))
    };
  }

  static async create(data: CreateRoutingDTO): Promise<Routing> {
    const { data: routing, error: routingError } = await supabase
      .from('routings')
      .insert({
        name: data.name,
        product_id: data.product_id,
        is_active: data.is_active ?? true,
        notes: data.notes
      })
      .select('*')
      .single();

    if (routingError) {
      console.error('Error creating routing:', routingError);
      throw new Error('Failed to create routing');
    }

    // Create routing operations if provided
    if (data.operations && data.operations.length > 0) {
      const operations = data.operations.map(op => ({
        routing_id: routing.id,
        sequence_number: op.seq_no,
        operation_name: op.name,
        code: op.code || null,
        description: op.description || null,
        requirements: op.requirements && op.requirements.length > 0 ? op.requirements : []
      }));

      const { error: operationsError, data: insertedOperations } = await supabase
        .from('routing_operations')
        .insert(operations)
        .select();

      if (operationsError) {
        console.error('Error creating routing operations:', operationsError);
        throw new Error(`Failed to create routing operations: ${operationsError.message}`);
      }

      // Map inserted operations to RoutingOperation format
      const mappedOperations = (insertedOperations || []).map(op => ({
        id: op.id,
        routing_id: op.routing_id,
        seq_no: op.sequence_number,
        name: op.operation_name,
        code: op.code || undefined,
        description: op.description || undefined,
        requirements: op.requirements || [],
        created_at: op.created_at,
        updated_at: op.updated_at,
      }));

      return {
        ...routing,
        operations: mappedOperations
      };
    }

    return {
      ...routing,
      operations: []
    };
  }

  static async update(id: number, data: Partial<Omit<Routing, 'id' | 'created_at' | 'updated_at' | 'operations'>>): Promise<Routing> {
    const { data: result, error } = await supabase
      .from('routings')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating routing:', error);
      throw new Error('Failed to update routing');
    }

    return result;
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('routings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting routing:', error);
      throw new Error('Failed to delete routing');
    }
  }

  static async addOperation(routingId: number, operation: Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>): Promise<RoutingOperation> {
    const { data, error } = await supabase
      .from('routing_operations')
      .insert({
        routing_id: routingId,
        seq_no: operation.seq_no,
        name: operation.name,
        code: operation.code,
        description: operation.description
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding routing operation:', error);
      throw new Error('Failed to add routing operation');
    }

    return data;
  }

  static async updateOperation(operationId: number, data: Partial<Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>>): Promise<RoutingOperation> {
    const { data: result, error } = await supabase
      .from('routing_operations')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', operationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating routing operation:', error);
      throw new Error('Failed to update routing operation');
    }

    return result;
  }

  static async deleteOperation(operationId: number): Promise<void> {
    const { error } = await supabase
      .from('routing_operations')
      .delete()
      .eq('id', operationId);

    if (error) {
      console.error('Error deleting routing operation:', error);
      throw new Error('Failed to delete routing operation');
    }
  }
}
