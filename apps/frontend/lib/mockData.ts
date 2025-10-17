// @ts-nocheck
import type {
  Product,
  Machine,
  Location,
  WorkOrder,
  PurchaseOrder,
  TransferOrder,
  YieldReport,
  ConsumeReport,
  Bom,
  BomItem,
  GRN,
  LicensePlate,
  StockMove,
  User,
  Session,
  Settings,
  Allergen,
  Supplier,
  Warehouse,
  TaxCode,
  SupplierProduct,
  Routing,
  RoutingOperation,
  ProductAllergen,
  ProductGroup,
  ProductType,
} from './types';
import { getFilteredBomForWorkOrder } from './clientState';

// Minimal mock data for local development testing
// Only loads when NEXT_PUBLIC_USE_MOCK_DATA=true

export const mockSuppliers: Supplier[] = [
  { 
    id: 1, 
    name: 'ABC Meats Ltd', 
    legal_name: 'ABC Meats Limited',
    vat_number: 'GB123456789',
    country: 'UK',
    currency: 'GBP',
    payment_terms: 'Net 30',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  { 
    id: 2, 
    name: 'Fresh Produce Co', 
    legal_name: 'Fresh Produce Company Inc',
    vat_number: 'US987654321',
    country: 'USA',
    currency: 'USD',
    payment_terms: 'Net 15',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockWarehouses: Warehouse[] = [
  { 
    id: 1, 
    code: 'WH-MAIN', 
    name: 'Main Warehouse', 
    is_active: true, 
    created_at: '2024-01-01T00:00:00Z', 
    updated_at: '2024-01-01T00:00:00Z' 
  },
  { 
    id: 2, 
    code: 'WH-COLD', 
    name: 'Cold Storage Warehouse', 
    is_active: true, 
    created_at: '2024-01-01T00:00:00Z', 
    updated_at: '2024-01-01T00:00:00Z' 
  }
];

export const mockTaxCodes: TaxCode[] = [
  { id: 1, code: 'STD', name: 'Standard Rate', rate: 0.20, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, code: 'RED', name: 'Reduced Rate', rate: 0.05, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
];

export const mockSupplierProducts: SupplierProduct[] = [
  { id: 1, supplier_id: 1, product_id: 1, supplier_sku: 'ABC-BEEF-001', lead_time_days: 7, moq: 50.0, price_excl_tax: 12.50, tax_code_id: 1, currency: 'GBP', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, supplier_id: 2, product_id: 2, supplier_sku: 'FPC-SALT-001', lead_time_days: 14, moq: 100.0, price_excl_tax: 2.25, tax_code_id: 2, currency: 'USD', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
];

export const mockRoutings: Routing[] = [
  {
    id: 1,
    name: 'Standard Sausage Production',
    product_id: 5,
    is_active: true,
    notes: 'Standard routing for sausage production',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    operations: [
      { id: 1, routing_id: 1, seq_no: 1, name: 'Preparation', code: 'PREP', description: 'Prepare materials and setup', requirements: ['Smoke', 'Dice'], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      { id: 2, routing_id: 1, seq_no: 2, name: 'Mixing', code: 'MIX', description: 'Mix ingredients', requirements: ['Mix'], created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
    ]
  }
];

export const mockProductAllergens: ProductAllergen[] = [
  { id: 1, product_id: 1, allergen_id: 1, contains: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, product_id: 2, allergen_id: 1, contains: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
];

export const mockLocations: Location[] = [
  { id: 1, code: 'WH-01', name: 'Main Warehouse - Zone A1', type: 'warehouse', warehouse_id: 1, zone: 'A', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, code: 'WH-02', name: 'Cold Storage - Zone B1', type: 'warehouse', warehouse_id: 2, zone: 'B', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
];

export const mockMachines: Machine[] = [
  { id: 1, code: 'MCH-001', name: 'Mixer A', type: 'Mixer', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, code: 'MCH-002', name: 'Oven B', type: 'Oven', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
];

export const mockAllergens: Allergen[] = [
  { id: 1, code: 'ALG-001', name: 'Gluten', description: 'Contains wheat gluten', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 2, code: 'ALG-002', name: 'Dairy', description: 'Contains milk products', is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
];

export const mockBomItems: Record<number, BomItem[]> = {
  1: [
    { id: 1, bom_id: 1, material_id: 1, quantity: 2.5, uom: 'KG', unit_cost_std: 12.50, sequence: 1, priority: 1, is_optional: false, is_phantom: false, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
    { id: 2, bom_id: 1, material_id: 4, quantity: 0.1, uom: 'KG', unit_cost_std: 8.75, sequence: 2, priority: 2, is_optional: false, is_phantom: false, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
  ]
};

const mockBoms: Record<number, Bom> = {
  9: { id: 1, product_id: 9, version: '1.0', status: 'active', is_active: true, requires_routing: false, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }
};

export const mockProducts: Product[] = [
  {
    id: 1,
    part_number: 'MT-001',
    description: 'Premium Beef Chuck',
    uom: 'KG',
    is_active: true,
    group: 'MEAT',
    product_type: 'RM_MEAT',
    subtype: undefined,
    expiry_policy: 'FROM_DELIVERY_DATE',
    shelf_life_days: 14,
    std_price: 12.50,
    allergens: [],
    preferred_supplier_id: 1,
    lead_time_days: 7,
    moq: 50.0,
    tax_code_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 2,
    part_number: 'MT-002',
    description: 'Fresh Pork Shoulder',
    uom: 'KG',
    is_active: true,
    group: 'MEAT',
    product_type: 'RM_MEAT',
    subtype: undefined,
    expiry_policy: 'FROM_DELIVERY_DATE',
    shelf_life_days: 10,
    std_price: 8.75,
    allergens: [],
    preferred_supplier_id: 1,
    lead_time_days: 7,
    moq: 30.0,
    tax_code_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 9,
    part_number: 'PR-001',
    description: 'Seasoned Beef Mix',
    uom: 'KG',
    is_active: true,
    group: 'COMPOSITE',
    product_type: 'PR',
    subtype: undefined,
    expiry_policy: 'FROM_CREATION_DATE',
    shelf_life_days: 3,
    std_price: 14.25,
    allergens: [],
    preferred_supplier_id: undefined,
    lead_time_days: undefined,
    moq: undefined,
    tax_code_id: undefined,
    production_lines: ['3', '4'],
    activeBom: mockBoms[9],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-25T00:00:00Z',
  }
];

Object.keys(mockBoms).forEach((productId) => {
  const bom = mockBoms[Number(productId)];
  if (bom && mockBomItems[bom.id]) {
    bom.bomItems = mockBomItems[bom.id].map(item => {
      const material = mockProducts.find(p => p.id === item.material_id);
      return { ...item, material };
    });
  }
});

mockProducts.forEach(product => {
  if (product.activeBom && mockBomItems[product.activeBom.id]) {
    product.activeBom.bomItems = mockBomItems[product.activeBom.id].map(item => {
      const material = mockProducts.find(p => p.id === item.material_id);
      return { ...item, material };
    });
  }
});

export const mockWorkOrders: WorkOrder[] = [
  {
    id: '1',
    wo_number: 'WO-2024-001',
    product_id: '9',
    product: mockProducts.find(p => p.id === 9),
    quantity: 500,
    status: 'in_progress',
    due_date: '2024-02-15',
    scheduled_start: '2024-02-14T08:00:00',
    scheduled_end: '2024-02-14T16:00:00',
    machine_id: '1',
    machine: mockMachines[0],
    line_number: 'Line 1',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-08T00:00:00Z',
  },
  {
    id: '2',
    wo_number: 'WO-2024-002',
    product_id: '1',
    product: mockProducts.find(p => p.id === 1),
    quantity: 1000,
    status: 'planned',
    due_date: '2024-02-20',
    scheduled_start: '2024-02-19T09:00:00',
    scheduled_end: '2024-02-19T17:00:00',
    machine_id: '2',
    machine: mockMachines[1],
    line_number: 'Line 2',
    created_at: '2024-02-05T00:00:00Z',
    updated_at: '2024-02-05T00:00:00Z',
  }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 1,
    po_number: 'PO-2024-001',
    supplier_id: 1,
    supplier: mockSuppliers[0],
    status: 'confirmed',
    order_date: '2024-02-01',
    expected_delivery: '2024-02-11',
    due_date: '2024-02-12',
    total_amount: 8875,
    warehouse_id: 2,
    request_delivery_date: '2024-02-12',
    expected_delivery_date: '2024-02-11',
    buyer_name: 'Sarah Johnson',
    notes: 'Ensure cold chain compliance during delivery.',
    purchase_order_items: [
      { id: 1, po_id: 1, product_id: 1, product: mockProducts.find(p => p.id === 1), quantity_ordered: 500, quantity_received: 0, unit_price: 12.50, total_price: 6250, confirmed: true }
    ],
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-02-03T14:30:00Z',
  },
  {
    id: 2,
    po_number: 'PO-2024-002',
    supplier_id: 2,
    supplier: mockSuppliers[1],
    status: 'received',
    order_date: '2024-01-28',
    expected_delivery: '2024-02-07',
    due_date: '2024-02-08',
    total_amount: 2500,
    warehouse_id: 1,
    request_delivery_date: '2024-02-08',
    expected_delivery_date: '2024-02-08',
    buyer_name: 'Michael Chen',
    notes: 'Verify expiry dates on all spice products upon receipt.',
    purchase_order_items: [
      { id: 2, po_id: 2, product_id: 2, product: mockProducts.find(p => p.id === 2), quantity_ordered: 100, quantity_received: 100, unit_price: 1.20, total_price: 120, confirmed: true }
    ],
    created_at: '2024-01-28T10:30:00Z',
    updated_at: '2024-02-08T16:45:00Z',
  }
];

export const mockTransferOrders: TransferOrder[] = [
  {
    id: 1,
    to_number: 'TO-2024-001',
    from_warehouse_id: 1,
    from_warehouse: mockWarehouses[0],
    to_warehouse_id: 2,
    to_warehouse: mockWarehouses[1],
    status: 'in_transit',
    transfer_date: '2024-02-07',
    transfer_order_items: [
      { id: 1, transfer_order_id: 1, product_id: 1, product: mockProducts.find(p => p.id === 1), quantity: '100', created_at: '2024-02-07T00:00:00Z', updated_at: '2024-02-07T00:00:00Z' }
    ],
    created_at: '2024-02-07T00:00:00Z',
    updated_at: '2024-02-08T00:00:00Z',
  }
];

export const mockYieldReport: YieldReport = {
  summary: {
    total_output: 3250,
    total_target: 3500,
    yield_rate: 92.86,
    scrap_rate: 7.14,
    total_work_orders: 2,
  },
  work_orders: [
    {
      id: 1,
      wo_number: 'WO-2024-001',
      product: { id: 9, part_number: 'PR-001', description: 'Seasoned Beef Mix' },
      target_qty: 500,
      actual_output: 485,
      scrap: 15,
      yield_percentage: 97.0,
      date: '2024-02-08',
      status: 'in_progress',
    },
    {
      id: 2,
      wo_number: 'WO-2024-002',
      product: { id: 1, part_number: 'MT-001', description: 'Premium Beef Chuck' },
      target_qty: 1000,
      actual_output: 920,
      scrap: 80,
      yield_percentage: 92.0,
      date: '2024-02-09',
      status: 'planned',
    }
  ],
};

export const mockConsumeReport: ConsumeReport = {
  summary: {
    total_materials_consumed: 2567.5,
    total_value: 28456.75,
    unique_materials: 2,
    total_work_orders: 2,
  },
  consumption_records: [
    {
      wo_number: 'WO-2024-001',
      material: { id: 1, part_number: 'MT-001', description: 'Premium Beef Chuck', uom: 'KG' },
      standard_qty: 1250,
      consumed_qty: 1275,
      variance: 25,
      variance_percentage: 2.0,
      date: '2024-02-08',
      wo_status: 'in_progress',
    },
    {
      wo_number: 'WO-2024-002',
      material: { id: 2, part_number: 'MT-002', description: 'Fresh Pork Shoulder', uom: 'KG' },
      standard_qty: 1000,
      consumed_qty: 980,
      variance: -20,
      variance_percentage: -2.0,
      date: '2024-02-09',
      wo_status: 'planned',
    }
  ],
};

export const mockWorkOrderDetails = (workOrderId: number) => {
  const workOrder = mockWorkOrders.find(wo => wo.id === workOrderId.toString());
  if (!workOrder || !workOrder.product) {
    return null;
  }

  const bomItems = getFilteredBomForWorkOrder(workOrder);
  
  return {
    work_order: {
      id: workOrder.id,
      wo_number: workOrder.wo_number,
      product_id: workOrder.product_id,
      product_name: workOrder.product.description,
      product_part_number: workOrder.product.part_number,
      quantity: Number(workOrder.quantity),
      uom: workOrder.product.uom,
      status: workOrder.status,
      due_date: workOrder.due_date,
      machine_id: workOrder.machine_id,
      machine_name: workOrder.machine?.name || null,
    },
    bom_components: bomItems.map(item => ({
      material_id: item.material_id,
      part_number: item.material?.part_number || '',
      description: item.material?.description || '',
      uom: item.uom,
      qty_per_unit: Number(item.quantity),
      total_qty_needed: Number(item.quantity) * Number(workOrder.quantity),
      stock_on_hand: Math.random() > 0.3 ? Number(item.quantity) * Number(workOrder.quantity) * 1.5 : Number(item.quantity) * Number(workOrder.quantity) * 0.8,
      qty_completed: workOrder.status === 'completed' ? Number(item.quantity) * Number(workOrder.quantity) : 0,
    })),
  };
};

export const mockLicensePlates: LicensePlate[] = [
  { id: '1', lp_code: 'LP-2024-001', lp_number: 'LP-2024-001', item_id: '1', product_id: '1', product: mockProducts.find(p => p.id === 1), location_id: '1', location: mockLocations[0], quantity: 500, status: 'Available', qa_status: 'Passed', grn_id: 1, created_at: '2024-02-08T00:00:00Z', updated_at: '2024-02-08T00:00:00Z' },
  { id: '2', lp_code: 'LP-2024-002', lp_number: 'LP-2024-002', item_id: '2', product_id: '2', product: mockProducts.find(p => p.id === 2), location_id: '2', location: mockLocations[1], quantity: 300, status: 'Available', qa_status: 'Passed', grn_id: 1, created_at: '2024-02-08T00:00:00Z', updated_at: '2024-02-08T00:00:00Z' }
];

export const mockGRNs: GRN[] = [
  {
    id: 1,
    grn_number: 'GRN-2024-001',
    po_id: 1,
    po: mockPurchaseOrders.find(po => po.id === 1),
    status: 'completed',
    received_date: '2024-02-08',
    grn_items: [
      { id: 1, grn_id: 1, product_id: 1, product: mockProducts.find(p => p.id === 1), quantity_ordered: '500', quantity_received: '500', location_id: 1, location: mockLocations[0], lp_number: 'LP-2024-001', created_at: '2024-02-08T00:00:00Z', updated_at: '2024-02-08T00:00:00Z' }
    ],
    created_by: 'system',
    created_at: '2024-02-08T00:00:00Z',
    updated_at: '2024-02-08T00:00:00Z',
  }
];

export const mockStockMoves: StockMove[] = [
  {
    id: '1',
    move_number: 'SM-2024-001',
    lp_id: '1',
    lp: mockLicensePlates.find(lp => lp.id === '1'),
    from_location_id: '1',
    from_location: mockLocations[0],
    to_location_id: '2',
    to_location: mockLocations[1],
    quantity: 100,
    reason: 'Transfer to production',
    status: 'completed',
    move_date: '2024-02-09',
    created_at: '2024-02-09T00:00:00Z',
    updated_at: '2024-02-09T00:00:00Z',
  }
];

export const mockUsers: User[] = [
  {
    id: 1,
    name: 'John Admin',
    email: 'john.admin@example.com',
    role: 'Admin',
    status: 'Active',
    created_at: '2024-01-01T00:00:00Z',
    last_login: '2024-02-10T08:30:00Z',
  },
  {
    id: 2,
    name: 'Sarah Planner',
    email: 'sarah.planner@example.com',
    role: 'Planner',
    status: 'Active',
    created_at: '2024-01-05T00:00:00Z',
    last_login: '2024-02-10T09:15:00Z',
  }
];

export const mockSessions: Session[] = [
  {
    id: 1,
    user_id: 1,
    user_name: 'John Admin',
    ip_address: '192.168.1.100',
    location: 'New York, USA',
    device: 'Chrome 120 on Windows 11',
    login_time: '2024-02-10T08:30:00Z',
    status: 'Active',
  },
  {
    id: 2,
    user_id: 2,
    user_name: 'Sarah Planner',
    ip_address: '192.168.1.105',
    location: 'Los Angeles, USA',
    device: 'Safari 17 on macOS Sonoma',
    login_time: '2024-02-10T09:15:00Z',
    status: 'Active',
  }
];

export const mockSettings: Settings = {
  general: {
    company_name: 'Forza Manufacturing Inc.',
    timezone: 'America/New_York',
    date_format: 'MM/DD/YYYY',
    currency: 'USD',
  },
  production: {
    default_lp_prefix: 'LP',
    wo_number_format: 'WO-YYYY-####',
    auto_complete_wos: false,
  },
  warehouse: {
    default_location_id: 1,
    qa_required: true,
    lp_split_allowed: true,
  },
  notifications: {
    email_notifications: true,
    low_stock_alerts: true,
    threshold_quantity: 10,
  },
};