# API Reference Documentation

## Overview
The MonoPilot MES system uses a dual-mode API layer that seamlessly switches between mock data (development) and real Supabase data (production). This approach enables rapid development while maintaining production-ready functionality.

## API Architecture

### Dual-Mode Operation
```typescript
// API Configuration
export const API_CONFIG = {
  useMockData: process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  endpoints: {
    workOrders: '/api/work-orders',
    purchaseOrders: '/api/purchase-orders',
    // ... other endpoints
  }
};

// Data source determination
export const shouldUseMockData = () => {
  return API_CONFIG.useMockData || !API_CONFIG.supabaseUrl;
};
```

### API Layer Structure
```
apps/frontend/lib/api/
├── config.ts              # API configuration
├── index.ts               # API exports
├── workOrders.ts          # Work orders API
├── users.ts               # Users API
├── purchaseOrders.ts      # Purchase orders API
├── transferOrders.ts     # Transfer orders API
├── suppliers.ts           # Suppliers API
├── warehouses.ts          # Warehouses API
├── routings.ts            # Routings API
├── supplierProducts.ts    # Supplier products API
├── taxCodes.ts            # Tax codes API
└── asns.ts                # ASNs API
```

## Core API Classes

### WorkOrdersAPI
```typescript
export class WorkOrdersAPI {
  // Get all work orders
  static async getAll(): Promise<WorkOrder[]>
  
  // Get work order by ID
  static async getById(id: number): Promise<WorkOrder | null>
  
  // Create new work order
  static async create(data: CreateWorkOrderData): Promise<WorkOrder>
  
  // Update work order
  static async update(id: number, data: UpdateWorkOrderData): Promise<WorkOrder>
  
  // Delete work order
  static async delete(id: number): Promise<void>
  
  // Get work orders by status
  static async getByStatus(status: WorkOrderStatus): Promise<WorkOrder[]>
  
  // Get work orders by production line
  static async getByProductionLine(line: string): Promise<WorkOrder[]>
}
```

### UsersAPI
```typescript
export class UsersAPI {
  // Get all users
  static async getAll(): Promise<User[]>
  
  // Get user by ID
  static async getById(id: string): Promise<User | null>
  
  // Create new user
  static async create(data: CreateUserData): Promise<User>
  
  // Update user
  static async update(id: string, data: UpdateUserData): Promise<User>
  
  // Delete user
  static async delete(id: string): Promise<void>
  
  // Get users by role
  static async getByRole(role: UserRole): Promise<User[]>
}
```

### PurchaseOrdersAPI
```typescript
export class PurchaseOrdersAPI {
  // Get all purchase orders
  static async getAll(): Promise<PurchaseOrder[]>
  
  // Get purchase order by ID
  static async getById(id: number): Promise<PurchaseOrder | null>
  
  // Create new purchase order
  static async create(data: CreatePurchaseOrderData): Promise<PurchaseOrder>
  
  // Update purchase order
  static async update(id: number, data: UpdatePurchaseOrderData): Promise<PurchaseOrder>
  
  // Delete purchase order
  static async delete(id: number): Promise<void>
  
  // Get purchase orders by status
  static async getByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]>
  
  // Get purchase orders by supplier
  static async getBySupplier(supplierId: number): Promise<PurchaseOrder[]>
}
```

### TransferOrdersAPI
```typescript
export class TransferOrdersAPI {
  // Get all transfer orders
  static async getAll(): Promise<TransferOrder[]>
  
  // Get transfer order by ID
  static async getById(id: number): Promise<TransferOrder | null>
  
  // Create new transfer order
  static async create(data: CreateTransferOrderData): Promise<TransferOrder>
  
  // Update transfer order
  static async update(id: number, data: UpdateTransferOrderData): Promise<TransferOrder>
  
  // Delete transfer order
  static async delete(id: number): Promise<void>
  
  // Get transfer orders by status
  static async getByStatus(status: string): Promise<TransferOrder[]>
}
```

## Data Access Patterns

### Mock Data Pattern
```typescript
// Mock data implementation
static async getAll(): Promise<WorkOrder[]> {
  if (shouldUseMockData()) {
    return clientState.getWorkOrders();
  }
  
  // Real data implementation
  const { data, error } = await supabase.from('work_orders').select('*');
  return data || [];
}
```

### Supabase Integration Pattern
```typescript
// Supabase query pattern
static async getById(id: number): Promise<WorkOrder | null> {
  if (shouldUseMockData()) {
    const workOrders = clientState.getWorkOrders();
    return workOrders.find(wo => wo.id === id.toString()) || null;
  }
  
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  return data;
}
```

### Error Handling Pattern
```typescript
// Error handling implementation
static async create(data: CreateWorkOrderData): Promise<WorkOrder> {
  try {
    if (shouldUseMockData()) {
      return clientState.addWorkOrder(data);
    }
    
    const { data: result, error } = await supabase
      .from('work_orders')
      .insert(data)
      .select()
      .single();
      
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Error creating work order:', error);
    throw error;
  }
}
```

## Request/Response Formats

### Work Order API
```typescript
// Create Work Order Request
interface CreateWorkOrderData {
  wo_number: string;
  product_id: string;
  quantity: number;
  status: WorkOrderStatus;
  due_date: string;
  scheduled_start?: string;
  scheduled_end?: string;
  machine_id?: string;
  line_number?: string;
  priority?: number;
}

// Update Work Order Request
interface UpdateWorkOrderData {
  wo_number?: string;
  product_id?: string;
  quantity?: number;
  status?: WorkOrderStatus;
  due_date?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  machine_id?: string;
  line_number?: string;
  priority?: number;
}

// Work Order Response
interface WorkOrder {
  id: string;
  wo_number: string;
  product_id: string;
  quantity: number;
  status: WorkOrderStatus;
  due_date: string;
  scheduled_start?: string;
  scheduled_end?: string;
  machine_id?: string;
  machine?: Machine;
  product?: Product;
  line_number?: string;
  priority?: number;
  created_at: string;
  updated_at: string;
}
```

### Purchase Order API
```typescript
// Create Purchase Order Request
interface CreatePurchaseOrderData {
  po_number: string;
  supplier_id: number;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery: string;
  due_date?: string;
  warehouse_id?: number;
  request_delivery_date?: string;
  expected_delivery_date?: string;
  buyer_id?: string;
  buyer_name?: string;
  total_amount: number;
  notes?: string;
}

// Purchase Order Response
interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery: string;
  due_date?: string;
  warehouse_id?: number;
  request_delivery_date?: string;
  expected_delivery_date?: string;
  buyer_id?: string;
  buyer_name?: string;
  total_amount: number;
  notes?: string;
  supplier?: Supplier;
  warehouse?: Warehouse;
  purchase_order_items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}
```

## Authentication & Authorization

### Supabase Auth Integration
```typescript
// Authentication context
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Auth state management
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  return { user, loading };
};
```

### Role-Based Access Control
```typescript
// Role-based API access
export class WorkOrdersAPI {
  static async getAll(): Promise<WorkOrder[]> {
    const { user } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }
    
    // Role-based filtering
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('created_by', user.id); // User can only see their own work orders
      
    return data || [];
  }
}
```

## Error Handling Patterns

### API Error Types
```typescript
// API Error interface
interface APIError {
  code: string;
  message: string;
  details?: any;
  status?: number;
}

// Error handling utility
export const handleAPIError = (error: any): APIError => {
  if (error.code) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      status: error.status
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unknown error occurred',
    details: error
  };
};
```

### Error Handling in API Classes
```typescript
// Error handling pattern
static async create(data: CreateWorkOrderData): Promise<WorkOrder> {
  try {
    if (shouldUseMockData()) {
      return clientState.addWorkOrder(data);
    }
    
    const { data: result, error } = await supabase
      .from('work_orders')
      .insert(data)
      .select()
      .single();
      
    if (error) {
      throw handleAPIError(error);
    }
    
    return result;
  } catch (error) {
    console.error('WorkOrdersAPI.create error:', error);
    throw error;
  }
}
```

## Data Validation

### Input Validation
```typescript
// Validation schemas
import { z } from 'zod';

const CreateWorkOrderSchema = z.object({
  wo_number: z.string().min(1, 'Work order number is required'),
  product_id: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be positive'),
  status: z.enum(['draft', 'planned', 'released', 'in_progress', 'completed', 'cancelled']),
  due_date: z.string().datetime('Invalid date format'),
  scheduled_start: z.string().datetime().optional(),
  scheduled_end: z.string().datetime().optional(),
  machine_id: z.string().optional(),
  line_number: z.string().optional(),
  priority: z.number().optional()
});

// Validation in API methods
static async create(data: CreateWorkOrderData): Promise<WorkOrder> {
  // Validate input data
  const validatedData = CreateWorkOrderSchema.parse(data);
  
  // Proceed with creation
  // ...
}
```

### Response Validation
```typescript
// Response validation
const WorkOrderSchema = z.object({
  id: z.string(),
  wo_number: z.string(),
  product_id: z.string(),
  quantity: z.number(),
  status: z.enum(['draft', 'planned', 'released', 'in_progress', 'completed', 'cancelled']),
  due_date: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

// Validate response data
static async getById(id: number): Promise<WorkOrder | null> {
  const data = await supabase.from('work_orders').select('*').eq('id', id).single();
  
  if (data.error) {
    throw handleAPIError(data.error);
  }
  
  // Validate response
  const validatedData = WorkOrderSchema.parse(data.data);
  return validatedData;
}
```

## Performance Optimization

### Caching Strategy
```typescript
// SWR integration for caching
import useSWR from 'swr';

export const useWorkOrders = () => {
  const { data, error, mutate } = useSWR(
    'work-orders',
    () => WorkOrdersAPI.getAll(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000 // 30 seconds
    }
  );
  
  return {
    workOrders: data || [],
    loading: !error && !data,
    error,
    mutate
  };
};
```

### Pagination
```typescript
// Pagination support
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class WorkOrdersAPI {
  static async getPaginated(
    page: number = 1,
    limit: number = 20,
    filters?: any
  ): Promise<PaginatedResponse<WorkOrder>> {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    
    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      hasNext: (offset + limit) < (count || 0),
      hasPrev: page > 1
    };
  }
}
```

## Testing Patterns

### Mock Data Testing
```typescript
// Mock data for testing
export const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    wo_number: 'WO-2024-001',
    product_id: '1',
    quantity: 100,
    status: 'planned',
    due_date: '2024-12-31T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Test utilities
export const createMockWorkOrder = (overrides: Partial<WorkOrder> = {}): WorkOrder => ({
  id: '1',
  wo_number: 'WO-2024-001',
  product_id: '1',
  quantity: 100,
  status: 'planned',
  due_date: '2024-12-31T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides
});
```

### API Testing
```typescript
// API testing utilities
export const testWorkOrdersAPI = async () => {
  // Test getAll
  const workOrders = await WorkOrdersAPI.getAll();
  expect(workOrders).toBeDefined();
  expect(Array.isArray(workOrders)).toBe(true);
  
  // Test create
  const newWO = await WorkOrdersAPI.create({
    wo_number: 'WO-TEST-001',
    product_id: '1',
    quantity: 50,
    status: 'draft',
    due_date: '2024-12-31T00:00:00Z'
  });
  
  expect(newWO).toBeDefined();
  expect(newWO.wo_number).toBe('WO-TEST-001');
  
  // Test update
  const updatedWO = await WorkOrdersAPI.update(newWO.id, {
    status: 'planned'
  });
  
  expect(updatedWO.status).toBe('planned');
  
  // Test delete
  await WorkOrdersAPI.delete(newWO.id);
  
  const deletedWO = await WorkOrdersAPI.getById(newWO.id);
  expect(deletedWO).toBeNull();
};
```

## Environment Configuration

### Development Environment
```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Production Environment
```bash
# Production environment variables
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

## API Documentation Best Practices

### Code Documentation
```typescript
/**
 * Work Orders API - Handles all work order operations
 * 
 * @example
 * ```typescript
 * // Get all work orders
 * const workOrders = await WorkOrdersAPI.getAll();
 * 
 * // Create new work order
 * const newWO = await WorkOrdersAPI.create({
 *   wo_number: 'WO-2024-001',
 *   product_id: '1',
 *   quantity: 100,
 *   status: 'planned',
 *   due_date: '2024-12-31T00:00:00Z'
 * });
 * ```
 */
export class WorkOrdersAPI {
  /**
   * Get all work orders
   * @returns Promise<WorkOrder[]> Array of work orders
   * @throws {APIError} When request fails
   */
  static async getAll(): Promise<WorkOrder[]> {
    // Implementation
  }
}
```

### API Usage Examples
```typescript
// Basic usage examples
import { WorkOrdersAPI, UsersAPI, PurchaseOrdersAPI } from '@/lib/api';

// Work Orders
const workOrders = await WorkOrdersAPI.getAll();
const workOrder = await WorkOrdersAPI.getById(1);
const newWO = await WorkOrdersAPI.create(workOrderData);

// Users
const users = await UsersAPI.getAll();
const user = await UsersAPI.getById('user-id');

// Purchase Orders
const purchaseOrders = await PurchaseOrdersAPI.getAll();
const po = await PurchaseOrdersAPI.getById(1);
```

## Future Enhancements

### Planned API Improvements
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Filtering**: Complex query filtering
3. **Bulk Operations**: Batch operations for efficiency
4. **Export Functionality**: Data export capabilities
5. **Audit Logging**: Comprehensive audit trails
6. **Rate Limiting**: API rate limiting and throttling
7. **Caching**: Advanced caching strategies
8. **Monitoring**: API performance monitoring
