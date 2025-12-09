import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type RoutingStatus = 'active' | 'inactive';

export interface Routing {
  id?: string;
  org_id: string;
  code: string;
  name: string;
  description?: string | null;
  status: RoutingStatus;
  is_reusable: boolean;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RoutingOperation {
  id?: string;
  routing_id: string;
  sequence: number;
  operation_name: string;
  machine_id?: string | null;
  line_id?: string | null;
  expected_duration_minutes: number;
  expected_yield_percent: number;
  setup_time_minutes?: number;
  labor_cost?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProductRouting {
  id?: string;
  product_id: string;
  routing_id: string;
  is_default: boolean;
  created_at?: string;
  created_by?: string | null;
}

/**
 * RoutingFactory - creates test routings for Epic 2 tests.
 *
 * Features:
 * - Generates realistic routing data with operations
 * - Supports reusable and single-product routings
 * - Tracks created routings for automatic cleanup
 * - Integrates with Supabase for routing creation
 */
export class RoutingFactory {
  private createdRoutings: string[] = [];
  private createdOperations: string[] = [];
  private createdProductRoutings: string[] = [];
  private sequence = 0;

  /**
   * Create a test routing with optional field overrides
   */
  async createRouting(overrides: Partial<Routing> = {}): Promise<Routing> {
    this.sequence++;

    const routing: Omit<Routing, 'id' | 'created_at' | 'updated_at'> = {
      org_id: process.env.TEST_ORG_ID || '',
      code: `RTG-TEST-${this.sequence.toString().padStart(4, '0')}`,
      name: `Test Routing ${faker.commerce.productAdjective()} Process`,
      description: faker.lorem.sentence(),
      status: 'active',
      is_reusable: true,
      created_by: null,
      updated_by: null,
      ...overrides,
    };

    const { data, error } = await supabase
      .from('routings')
      .insert(routing)
      .select()
      .single();

    if (error) throw new Error(`RoutingFactory: ${error.message}`);

    this.createdRoutings.push(data.id);
    return data;
  }

  /**
   * Create a routing operation (step)
   */
  async createOperation(overrides: Partial<RoutingOperation> = {}): Promise<RoutingOperation> {
    const operation: Omit<RoutingOperation, 'id' | 'created_at' | 'updated_at'> = {
      routing_id: '', // Must be provided
      sequence: 1,
      operation_name: faker.helpers.arrayElement([
        'Mixing', 'Cooking', 'Cooling', 'Packaging', 'Labeling',
        'Quality Check', 'Assembly', 'Testing', 'Curing', 'Filling'
      ]),
      machine_id: null,
      line_id: null,
      expected_duration_minutes: faker.number.int({ min: 5, max: 120 }),
      expected_yield_percent: faker.number.float({ min: 90, max: 100, fractionDigits: 2 }),
      setup_time_minutes: faker.number.int({ min: 0, max: 30 }),
      labor_cost: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
      ...overrides,
    };

    if (!operation.routing_id) {
      throw new Error('RoutingFactory: routing_id is required for operation');
    }

    const { data, error } = await supabase
      .from('routing_operations')
      .insert(operation)
      .select()
      .single();

    if (error) throw new Error(`RoutingFactory createOperation: ${error.message}`);

    this.createdOperations.push(data.id);
    return data;
  }

  /**
   * Create a complete routing with operations in one call
   */
  async createRoutingWithOperations(
    routingOverrides: Partial<Routing>,
    operations: Array<Partial<RoutingOperation>>
  ): Promise<{ routing: Routing; operations: RoutingOperation[] }> {
    const routing = await this.createRouting(routingOverrides);

    const createdOps: RoutingOperation[] = [];
    for (let i = 0; i < operations.length; i++) {
      const op = await this.createOperation({
        routing_id: routing.id,
        sequence: i + 1,
        ...operations[i],
      });
      createdOps.push(op);
    }

    return { routing, operations: createdOps };
  }

  /**
   * Create a standard 3-step production routing
   */
  async createStandardRouting(userId?: string): Promise<{ routing: Routing; operations: RoutingOperation[] }> {
    return this.createRoutingWithOperations(
      { created_by: userId, updated_by: userId },
      [
        { operation_name: 'Preparation', expected_duration_minutes: 15 },
        { operation_name: 'Processing', expected_duration_minutes: 45 },
        { operation_name: 'Packaging', expected_duration_minutes: 20 },
      ]
    );
  }

  /**
   * Assign a routing to a product
   */
  async assignToProduct(
    productId: string,
    routingId: string,
    isDefault: boolean = true,
    userId?: string
  ): Promise<ProductRouting> {
    const assignment: Omit<ProductRouting, 'id' | 'created_at'> = {
      product_id: productId,
      routing_id: routingId,
      is_default: isDefault,
      created_by: userId || null,
    };

    const { data, error } = await supabase
      .from('product_routings')
      .insert(assignment)
      .select()
      .single();

    if (error) throw new Error(`RoutingFactory assignToProduct: ${error.message}`);

    this.createdProductRoutings.push(data.id);
    return data;
  }

  /**
   * Create a non-reusable routing (single product only)
   */
  async createSingleUseRouting(overrides: Partial<Routing> = {}): Promise<Routing> {
    return this.createRouting({ ...overrides, is_reusable: false });
  }

  /**
   * Cleanup all created routings, operations, and assignments
   */
  async cleanup(): Promise<void> {
    // Delete assignments first
    if (this.createdProductRoutings.length > 0) {
      const { error: assignError } = await supabase
        .from('product_routings')
        .delete()
        .in('id', this.createdProductRoutings);

      if (assignError) {
        console.error(`[RoutingFactory] Assignment cleanup error: ${assignError.message}`);
      }
    }

    // Delete operations
    if (this.createdOperations.length > 0) {
      const { error: opError } = await supabase
        .from('routing_operations')
        .delete()
        .in('id', this.createdOperations);

      if (opError) {
        console.error(`[RoutingFactory] Operation cleanup error: ${opError.message}`);
      }
    }

    // Delete routings
    if (this.createdRoutings.length > 0) {
      const { error: routingError } = await supabase
        .from('routings')
        .delete()
        .in('id', this.createdRoutings);

      if (routingError) {
        console.error(`[RoutingFactory] Routing cleanup error: ${routingError.message}`);
      }
    }

    console.log(`[RoutingFactory] Cleanup: ${this.createdRoutings.length} routings, ${this.createdOperations.length} operations, ${this.createdProductRoutings.length} assignments removed`);
    this.createdRoutings = [];
    this.createdOperations = [];
    this.createdProductRoutings = [];
    this.sequence = 0;
  }

  getCreatedRoutingIds(): string[] {
    return [...this.createdRoutings];
  }
}
