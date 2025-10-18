export const testUsers = {
  admin: {
    email: 'admin@forza.com',
    password: 'password123',
    name: 'Admin User',
    role: 'Admin'
  },
  planner: {
    email: 'planner@forza.com',
    password: 'password123',
    name: 'Planner User',
    role: 'Planner'
  },
  operator: {
    email: 'operator@forza.com',
    password: 'password123',
    name: 'Operator User',
    role: 'Operator'
  },
  technical: {
    email: 'technical@forza.com',
    password: 'password123',
    name: 'Technical User',
    role: 'Technical'
  },
  purchasing: {
    email: 'purchasing@forza.com',
    password: 'password123',
    name: 'Purchasing User',
    role: 'Purchasing'
  },
  warehouse: {
    email: 'warehouse@forza.com',
    password: 'password123',
    name: 'Warehouse User',
    role: 'Warehouse'
  },
  qc: {
    email: 'qc@forza.com',
    password: 'password123',
    name: 'QC User',
    role: 'QC'
  }
};

export const testProducts = {
  meat: {
    partNumber: 'MEAT-001',
    description: 'Test Beef',
    category: 'MEAT',
    uom: 'kg',
    price: '25.50',
    supplierId: '1',
    expiryPolicy: 'FROM_DELIVERY_DATE',
    shelfLifeDays: '7'
  },
  drygoods: {
    partNumber: 'DRY-001',
    description: 'Test Flour',
    category: 'DRYGOODS',
    uom: 'kg',
    price: '2.50'
  },
  finishedGoods: {
    partNumber: 'FG-001',
    description: 'Test Final Product',
    category: 'FINISHED_GOODS',
    uom: 'box',
    price: '50.00'
  },
  process: {
    partNumber: 'PROC-001',
    description: 'Test Processed Item',
    category: 'PROCESS',
    uom: 'kg',
    price: '15.00'
  }
};

export const testWorkOrders = {
  basic: {
    productId: '1',
    quantity: '100',
    lineNumber: 'Line 1',
    scheduledDate: new Date().toISOString().split('T')[0],
    priority: 'Normal'
  },
  urgent: {
    productId: '1',
    quantity: '50',
    lineNumber: 'Line 2',
    scheduledDate: new Date().toISOString().split('T')[0],
    priority: 'Urgent'
  }
};

export const testPurchaseOrders = {
  basic: {
    supplierId: '1',
    items: [
      { productId: '1', quantity: '100', price: '10.00' },
      { productId: '2', quantity: '50', price: '5.00' }
    ]
  },
  singleItem: {
    supplierId: '1',
    items: [
      { productId: '1', quantity: '200', price: '12.00' }
    ]
  }
};

export const testTransferOrders = {
  basic: {
    fromWarehouse: '1',
    toWarehouse: '2',
    items: [
      { productId: '1', quantity: '50' },
      { productId: '2', quantity: '25' }
    ]
  },
  singleItem: {
    fromWarehouse: '1',
    toWarehouse: '2',
    items: [
      { productId: '1', quantity: '100' }
    ]
  }
};

export const testGRNs = {
  basic: {
    purchaseOrderId: '1',
    items: [
      { productId: '1', quantity: '100', receivedQuantity: '100' },
      { productId: '2', quantity: '50', receivedQuantity: '50' }
    ]
  },
  partial: {
    purchaseOrderId: '1',
    items: [
      { productId: '1', quantity: '100', receivedQuantity: '95' },
      { productId: '2', quantity: '50', receivedQuantity: '50' }
    ]
  }
};

export const testStockMoves = {
  basic: {
    moveType: 'TRANSFER',
    fromLocation: '1',
    toLocation: '2',
    items: [
      { productId: '1', quantity: '25' }
    ]
  },
  adjustment: {
    moveType: 'ADJUSTMENT',
    fromLocation: '1',
    toLocation: '1',
    items: [
      { productId: '1', quantity: '10' }
    ]
  }
};

export const testLicensePlates = {
  basic: {
    lpCode: 'LP-001',
    productId: '1',
    quantity: '100',
    location: '1'
  },
  split: {
    lpCode: 'LP-002',
    productId: '1',
    quantity: '50',
    location: '1'
  }
};

export const testSuppliers = {
  basic: {
    name: 'Test Supplier',
    contactPerson: 'John Doe',
    email: 'john@testsupplier.com',
    phone: '+1234567890',
    address: '123 Test Street, Test City, TC 12345'
  },
  withProducts: {
    name: 'Test Supplier with Products',
    contactPerson: 'Jane Smith',
    email: 'jane@testsupplier.com',
    phone: '+0987654321',
    address: '456 Test Avenue, Test City, TC 54321'
  }
};

export const testWarehouses = {
  basic: {
    name: 'Test Warehouse',
    code: 'TW001',
    address: '789 Warehouse Street, Test City, TC 67890',
    manager: 'Warehouse Manager'
  },
  secondary: {
    name: 'Test Warehouse 2',
    code: 'TW002',
    address: '321 Secondary Street, Test City, TC 10987',
    manager: 'Secondary Manager'
  }
};

export const testLocations = {
  basic: {
    name: 'Test Location',
    code: 'TL001',
    warehouse: '1',
    type: 'STORAGE'
  },
  production: {
    name: 'Test Production Line',
    code: 'TPL001',
    warehouse: '1',
    type: 'PRODUCTION'
  }
};

export const testMachines = {
  basic: {
    name: 'Test Machine',
    code: 'TM001',
    type: 'PROCESSING',
    location: '1'
  },
  packaging: {
    name: 'Test Packaging Machine',
    code: 'TPM001',
    type: 'PACKAGING',
    location: '1'
  }
};

export const testAllergens = {
  basic: {
    name: 'Test Allergen',
    code: 'TA001',
    description: 'Test allergen for testing purposes'
  },
  common: {
    name: 'Common Allergen',
    code: 'CA001',
    description: 'Common allergen found in many products'
  }
};

export const testTaxCodes = {
  basic: {
    code: 'TAX001',
    name: 'Test Tax Code',
    rate: '10.00',
    description: 'Test tax code for testing purposes'
  },
  reduced: {
    code: 'TAX002',
    name: 'Reduced Tax Code',
    rate: '5.00',
    description: 'Reduced tax rate for certain products'
  }
};

export const testRoutings = {
  basic: {
    name: 'Test Routing',
    code: 'TR001',
    description: 'Test routing for testing purposes',
    operations: [
      {
        sequence: 1,
        name: 'Preparation',
        description: 'Prepare materials',
        plannedTime: 30
      },
      {
        sequence: 2,
        name: 'Processing',
        description: 'Process materials',
        plannedTime: 60
      },
      {
        sequence: 3,
        name: 'Packaging',
        description: 'Package finished goods',
        plannedTime: 20
      }
    ]
  },
  simple: {
    name: 'Simple Routing',
    code: 'SR001',
    description: 'Simple routing with single operation',
    operations: [
      {
        sequence: 1,
        name: 'Single Operation',
        description: 'Single operation for simple routing',
        plannedTime: 45
      }
    ]
  }
};

export const testBOMComponents = {
  basic: [
    {
      materialId: '1',
      quantity: '10',
      uom: 'kg',
      isOptional: false,
      isPhantom: false,
      oneToOne: false
    },
    {
      materialId: '2',
      quantity: '5',
      uom: 'kg',
      isOptional: true,
      isPhantom: false,
      oneToOne: false
    }
  ],
  withPhantom: [
    {
      materialId: '1',
      quantity: '10',
      uom: 'kg',
      isOptional: false,
      isPhantom: false,
      oneToOne: false
    },
    {
      materialId: '3',
      quantity: '2',
      uom: 'kg',
      isOptional: false,
      isPhantom: true,
      oneToOne: true
    }
  ]
};

export const testProductionLines = {
  line1: {
    name: 'Line 1',
    code: 'L1',
    capacity: 100,
    status: 'ACTIVE'
  },
  line2: {
    name: 'Line 2',
    code: 'L2',
    capacity: 150,
    status: 'ACTIVE'
  }
};

export const testQualityChecks = {
  basic: {
    name: 'Basic Quality Check',
    description: 'Basic quality check for testing',
    parameters: [
      { name: 'Temperature', value: '20', unit: '°C' },
      { name: 'Humidity', value: '50', unit: '%' }
    ]
  },
  advanced: {
    name: 'Advanced Quality Check',
    description: 'Advanced quality check with multiple parameters',
    parameters: [
      { name: 'Temperature', value: '20', unit: '°C' },
      { name: 'Humidity', value: '50', unit: '%' },
      { name: 'Pressure', value: '1013', unit: 'hPa' }
    ]
  }
};

export const testYieldData = {
  pr: {
    workOrderId: '1',
    inputWeight: 100,
    outputWeight: 85,
    yieldPercentage: 85,
    losses: {
      cooking: 10,
      trim: 3,
      marinade: 2
    }
  },
  fg: {
    workOrderId: '1',
    inputWeight: 85,
    outputWeight: 80,
    yieldPercentage: 94.12,
    losses: {
      packaging: 3,
      quality: 2
    }
  }
};

export const testConsumptionData = {
  basic: {
    workOrderId: '1',
    materialId: '1',
    standardQuantity: 100,
    actualQuantity: 105,
    variance: 5,
    variancePercentage: 5.0
  },
  negative: {
    workOrderId: '1',
    materialId: '2',
    standardQuantity: 50,
    actualQuantity: 45,
    variance: -5,
    variancePercentage: -10.0
  }
};

export const testTraceabilityData = {
  forward: {
    startLP: 'LP-001',
    endProducts: ['FG-001', 'FG-002'],
    workOrders: ['WO-001', 'WO-002'],
    operations: ['Preparation', 'Processing', 'Packaging']
  },
  backward: {
    startProduct: 'FG-001',
    sourceMaterials: ['MEAT-001', 'DRY-001'],
    workOrders: ['WO-001'],
    operations: ['Preparation', 'Processing']
  }
};

export const testScannerData = {
  packTerminal: {
    workOrderId: '1',
    productionLine: 'Line 1',
    stagedMaterials: [
      { lpCode: 'LP-001', quantity: 100 },
      { lpCode: 'LP-002', quantity: 50 }
    ],
    outputQuantity: 80
  },
  processTerminal: {
    workOrderId: '1',
    operations: [
      { sequence: 1, name: 'Preparation', status: 'COMPLETED' },
      { sequence: 2, name: 'Processing', status: 'IN_PROGRESS' }
    ],
    qualityChecks: [
      { name: 'Temperature', value: '20', status: 'PASSED' }
    ]
  }
};

export const testSystemSettings = {
  basic: {
    companyName: 'Test Company',
    timezone: 'Europe/London',
    dateFormat: 'DD/MM/YYYY',
    currency: 'GBP',
    language: 'en'
  },
  production: {
    defaultProductionLine: 'Line 1',
    defaultWarehouse: 'Main Warehouse',
    qualityCheckRequired: true,
    traceabilityEnabled: true
  }
};

export const testNotifications = {
  workOrderComplete: {
    type: 'WORK_ORDER_COMPLETE',
    message: 'Work Order WO-001 has been completed',
    priority: 'INFO'
  },
  lowStock: {
    type: 'LOW_STOCK',
    message: 'Product MEAT-001 is running low on stock',
    priority: 'WARNING'
  },
  qualityAlert: {
    type: 'QUALITY_ALERT',
    message: 'Quality check failed for Work Order WO-001',
    priority: 'ERROR'
  }
};

export const testReports = {
  yield: {
    type: 'YIELD',
    period: 'last-7-days',
    filters: {
      productionLine: 'Line 1',
      product: 'FG-001'
    }
  },
  consumption: {
    type: 'CONSUMPTION',
    period: 'last-30-days',
    filters: {
      material: 'MEAT-001',
      workOrder: 'WO-001'
    }
  },
  traceability: {
    type: 'TRACEABILITY',
    lpCode: 'LP-001',
    direction: 'forward'
  }
};

export const testExports = {
  yieldPR: {
    filename: 'yield-pr-last-7-days.xlsx',
    type: 'YIELD_PR',
    period: 'last-7-days'
  },
  yieldFG: {
    filename: 'yield-fg-last-7-days.xlsx',
    type: 'YIELD_FG',
    period: 'last-7-days'
  },
  consumption: {
    filename: 'consumption-last-30-days.xlsx',
    type: 'CONSUMPTION',
    period: 'last-30-days'
  },
  traceability: {
    filename: 'traceability-LP-001.xlsx',
    type: 'TRACEABILITY',
    lpCode: 'LP-001'
  }
};

export const testPermissions = {
  admin: [
    'bom:read', 'bom:write', 'bom:delete',
    'planning:read', 'planning:write', 'planning:delete',
    'production:read', 'production:write', 'production:delete',
    'warehouse:read', 'warehouse:write', 'warehouse:delete',
    'scanner:read', 'scanner:write',
    'settings:read', 'settings:write', 'settings:delete',
    'admin:read', 'admin:write', 'admin:delete'
  ],
  planner: [
    'bom:read',
    'planning:read', 'planning:write', 'planning:delete',
    'production:read',
    'warehouse:read'
  ],
  operator: [
    'production:read',
    'scanner:read', 'scanner:write'
  ],
  technical: [
    'bom:read', 'bom:write', 'bom:delete',
    'settings:read', 'settings:write'
  ],
  purchasing: [
    'planning:read', 'planning:write',
    'warehouse:read'
  ],
  warehouse: [
    'warehouse:read', 'warehouse:write', 'warehouse:delete',
    'scanner:read'
  ],
  qc: [
    'production:read',
    'warehouse:read', 'warehouse:write',
    'scanner:read', 'scanner:write'
  ]
};

export const testErrorMessages = {
  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    password: 'Password must be at least 8 characters',
    number: 'Please enter a valid number',
    date: 'Please enter a valid date'
  },
  api: {
    network: 'Network error. Please check your connection.',
    timeout: 'Request timeout. Please try again.',
    server: 'Server error. Please try again later.',
    unauthorized: 'Unauthorized access. Please login again.',
    forbidden: 'Access denied. You do not have permission.',
    notFound: 'Resource not found.',
    conflict: 'Resource already exists.'
  },
  business: {
    insufficientStock: 'Insufficient stock for this operation.',
    workOrderNotReleased: 'Work order must be released before processing.',
    qualityCheckFailed: 'Quality check failed. Cannot proceed.',
    materialNotAvailable: 'Required material is not available.',
    productionLineBusy: 'Production line is currently busy.'
  }
};

export const testSuccessMessages = {
  created: 'Record created successfully',
  updated: 'Record updated successfully',
  deleted: 'Record deleted successfully',
  saved: 'Changes saved successfully',
  exported: 'Export completed successfully',
  imported: 'Import completed successfully',
  processed: 'Operation completed successfully',
  qualityPassed: 'Quality check passed',
  workOrderCompleted: 'Work order completed successfully',
  materialStaged: 'Material staged successfully',
  productionStarted: 'Production started successfully',
  productionCompleted: 'Production completed successfully'
};

export const testLoadingStates = {
  saving: 'Saving...',
  loading: 'Loading...',
  processing: 'Processing...',
  exporting: 'Exporting...',
  importing: 'Importing...',
  validating: 'Validating...',
  calculating: 'Calculating...',
  generating: 'Generating...',
  uploading: 'Uploading...',
  downloading: 'Downloading...'
};

export const testFormData = {
  valid: {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '+1234567890',
    address: '123 Test Street, Test City, TC 12345'
  },
  invalid: {
    email: 'invalid-email',
    password: '123',
    name: '',
    phone: 'invalid-phone',
    address: ''
  }
};

export const testSearchQueries = {
  products: ['MEAT', 'DRY', 'FG', 'PROC'],
  workOrders: ['WO-001', 'WO-002', 'WO-003'],
  purchaseOrders: ['PO-001', 'PO-002', 'PO-003'],
  transferOrders: ['TO-001', 'TO-002', 'TO-003'],
  grns: ['GRN-001', 'GRN-002', 'GRN-003'],
  stockMoves: ['SM-001', 'SM-002', 'SM-003'],
  licensePlates: ['LP-001', 'LP-002', 'LP-003'],
  suppliers: ['Test Supplier', 'Another Supplier'],
  warehouses: ['Main Warehouse', 'Secondary Warehouse'],
  locations: ['Location 1', 'Location 2'],
  machines: ['Machine 1', 'Machine 2'],
  users: ['admin@forza.com', 'planner@forza.com']
};

export const testFilterOptions = {
  status: ['Draft', 'Planned', 'Released', 'In Progress', 'Completed', 'Cancelled'],
  priority: ['Low', 'Normal', 'High', 'Urgent'],
  category: ['MEAT', 'DRYGOODS', 'FINISHED_GOODS', 'PROCESS'],
  role: ['Admin', 'Planner', 'Operator', 'Technical', 'Purchasing', 'Warehouse', 'QC'],
  productionLine: ['Line 1', 'Line 2', 'Line 3'],
  warehouse: ['Main Warehouse', 'Secondary Warehouse'],
  supplier: ['Test Supplier', 'Another Supplier'],
  dateRange: ['Last 7 days', 'Last 30 days', 'Last 3 months', 'Last year', 'Custom range']
};

export const testSortOptions = {
  products: ['Part Number', 'Description', 'Category', 'Price', 'Created Date'],
  workOrders: ['Work Order Number', 'Product', 'Quantity', 'Status', 'Scheduled Date'],
  purchaseOrders: ['PO Number', 'Supplier', 'Total Amount', 'Status', 'Created Date'],
  transferOrders: ['Transfer Order Number', 'From Warehouse', 'To Warehouse', 'Status', 'Created Date'],
  grns: ['GRN Number', 'Purchase Order', 'Total Amount', 'Status', 'Created Date'],
  stockMoves: ['Stock Move Number', 'Move Type', 'From Location', 'To Location', 'Date'],
  licensePlates: ['LP Code', 'Product', 'Quantity', 'Location', 'Status'],
  suppliers: ['Name', 'Contact Person', 'Email', 'Phone', 'Created Date'],
  warehouses: ['Name', 'Code', 'Manager', 'Address', 'Created Date'],
  locations: ['Name', 'Code', 'Warehouse', 'Type', 'Created Date'],
  machines: ['Name', 'Code', 'Type', 'Location', 'Created Date'],
  users: ['Name', 'Email', 'Role', 'Status', 'Created Date']
};
