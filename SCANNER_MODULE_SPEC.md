# Scanner Module Specification

## Overview
The Scanner Module provides terminal-based interfaces for production operations, specifically for packing and processing operations. It enables real-time material consumption tracking, license plate management, and production output recording.

## Module Architecture

### Scanner Routes
- **Main Scanner**: `/scanner` - Scanner selection page
- **Pack Terminal**: `/scanner/pack` - Packing operations terminal
- **Process Terminal**: `/scanner/process` - Processing operations terminal

### Component Structure
```
apps/frontend/app/scanner/
├── page.tsx                    # Scanner selection page
├── pack/
│   └── page.tsx               # Pack terminal
└── process/
    └── page.tsx               # Process terminal
```

## Pack Terminal (`/scanner/pack`)

### Purpose
The Pack Terminal is designed for packing operations where finished goods are packed into final packaging. It handles material consumption, license plate staging, and production output recording.

### Key Features

#### 1. Work Order Selection
```typescript
// Work order selection and filtering
const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
const [selectedLine, setSelectedLine] = useState<string | null>(null);

// Filter work orders by production line
const filteredWorkOrders = workOrders.filter(wo => 
  !selectedLine || wo.line_number === selectedLine
);
```

#### 2. License Plate Scanning
```typescript
// License plate scanning and validation
const [lpNumber, setLpNumber] = useState('');
const [currentScannedLP, setCurrentScannedLP] = useState<LicensePlate | null>(null);

// LP validation logic
const handleLPScan = (lpNumber: string) => {
  const lp = licensePlates.find(lp => lp.lp_code === lpNumber);
  if (lp) {
    setCurrentScannedLP(lp);
    // Validate LP for current work order
  }
};
```

#### 3. Material Staging
```typescript
// Staged license plates management
const [stagedLPsByOrder, setStagedLPsByOrder] = useState<{ [key: number]: StagedLP[] }>({});
const [stageQuantity, setStageQuantity] = useState('');

// Staging logic
const stageLP = (lp: LicensePlate, quantity: number) => {
  const stagedLP: StagedLP = {
    lp,
    quantity,
    staged_at: new Date().toISOString(),
    line: selectedLine
  };
  
  setStagedLPsByOrder(prev => ({
    ...prev,
    [selectedWOId!]: [...(prev[selectedWOId!] || []), stagedLP]
  }));
};
```

#### 4. Material Consumption Tracking
```typescript
// Material consumption management
const [consumedMaterials, setConsumedMaterials] = useState<{ [materialId: number]: number }>({});

// Consumption calculation
const calculateConsumption = (workOrder: WorkOrder, bomItems: BomItem[]) => {
  const consumption: { [materialId: number]: number } = {};
  
  bomItems.forEach(item => {
    const totalNeeded = item.quantity * workOrder.quantity;
    consumption[item.material_id] = totalNeeded;
  });
  
  return consumption;
};
```

#### 5. Production Output Recording
```typescript
// Production output management
const [quantityToCreate, setQuantityToCreate] = useState('');
const [createdItemsCount, setCreatedItemsCount] = useState(0);

// Output recording
const recordOutput = async (workOrder: WorkOrder, quantity: number) => {
  const output = {
    wo_id: workOrder.id,
    product_id: workOrder.product_id,
    quantity,
    uom: workOrder.product?.uom || 'EA',
    created_by: 'current_user'
  };
  
  await addYieldReport(output);
  setCreatedItemsCount(prev => prev + quantity);
};
```

### Pack Terminal Workflow

#### 1. Setup Phase
1. **Select Production Line**: Choose production line for operations
2. **Select Work Order**: Choose work order to process
3. **Load BOM**: Load bill of materials for selected work order
4. **Check Material Availability**: Verify material availability

#### 2. Material Staging Phase
1. **Scan License Plates**: Scan material license plates
2. **Stage Materials**: Stage materials for production
3. **Validate Quantities**: Ensure sufficient material quantities
4. **Check Material Sufficiency**: Verify material availability

#### 3. Production Phase
1. **Record Output**: Record production output quantities
2. **Track Consumption**: Track material consumption
3. **Update Work Order**: Update work order status
4. **Generate Reports**: Generate yield and consumption reports

#### 4. Completion Phase
1. **Finalize Production**: Complete production process
2. **Update Inventory**: Update inventory levels
3. **Generate Reports**: Generate production reports
4. **Clear Staging**: Clear staged materials

## Process Terminal (`/scanner/process`)

### Purpose
The Process Terminal is designed for processing operations where raw materials are processed into intermediate or finished goods. It handles material consumption, processing operations, and quality control.

### Key Features

#### 1. Processing Operations
```typescript
// Processing operation management
const [processingStep, setProcessingStep] = useState<string>('');
const [processingParameters, setProcessingParameters] = useState<{[key: string]: any}>({});

// Processing workflow
const handleProcessingStep = (step: string, parameters: any) => {
  setProcessingStep(step);
  setProcessingParameters(parameters);
  // Execute processing logic
};
```

#### 2. Quality Control Integration
```typescript
// Quality control management
const [qaStatus, setQaStatus] = useState<string>('Pending');
const [qaResults, setQaResults] = useState<{[key: string]: any}>({});

// QA workflow
const handleQA = (status: string, results: any) => {
  setQaStatus(status);
  setQaResults(results);
  // Update LP QA status
  updateLicensePlate(currentScannedLP!.id, { qa_status: status });
};
```

#### 3. Material Transformation
```typescript
// Material transformation tracking
const [transformedMaterials, setTransformedMaterials] = useState<{[key: string]: number}>({});

// Transformation logic
const transformMaterials = (inputMaterials: {[key: string]: number}, outputMaterials: {[key: string]: number}) => {
  // Record material transformation
  setTransformedMaterials(prev => ({
    ...prev,
    ...outputMaterials
  }));
};
```

### Process Terminal Workflow

#### 1. Setup Phase
1. **Select Work Order**: Choose work order to process
2. **Load Routing**: Load production routing
3. **Check Materials**: Verify material availability
4. **Setup Equipment**: Configure processing equipment

#### 2. Processing Phase
1. **Load Materials**: Load input materials
2. **Execute Operations**: Perform processing operations
3. **Quality Control**: Perform quality checks
4. **Record Output**: Record processed materials

#### 3. Completion Phase
1. **Finalize Processing**: Complete processing operations
2. **Update Inventory**: Update inventory levels
3. **Generate Reports**: Generate processing reports
4. **Clear Materials**: Clear processed materials

## Common Features

### 1. License Plate Management
```typescript
// License plate operations
interface LicensePlate {
  id: string;
  lp_code: string;
  lp_number?: string;
  item_id: string;
  product_id?: string;
  product?: Product;
  quantity: number;
  location_id?: string;
  location?: Location;
  status: LicensePlateStatus;
  qa_status?: string;
  grn_id?: number;
  created_at: string;
  updated_at: string;
}
```

### 2. Material Consumption Tracking
```typescript
// Consumption tracking
interface ConsumeReport {
  summary: {
    total_materials_consumed: number;
    total_value: number;
    unique_materials: number;
    total_work_orders: number;
  };
  consumption_records: Array<{
    wo_number: string;
    material: { id: number; part_number: string; description: string; uom: string };
    standard_qty: number;
    consumed_qty: number;
    variance: number;
    variance_percentage: number;
    date: string;
    wo_status: string;
  }>;
}
```

### 3. Yield Reporting
```typescript
// Yield reporting
interface YieldReport {
  summary: {
    total_output: number;
    total_target: number;
    yield_rate: number;
    scrap_rate: number;
    total_work_orders: number;
  };
  work_orders: Array<{
    id: number;
    wo_number: string;
    product: { id: number; part_number: string; description: string };
    target_qty: number;
    actual_output: number;
    scrap: number;
    yield_percentage: number;
    date: string;
    status: string;
  }>;
}
```

## Fixed Issues

### 1. Null Reference Errors
**Issue**: `TypeError: Cannot read properties of null (reading 'toString')`
**Location**: `apps/frontend/app/scanner/pack/page.tsx:59` and `apps/frontend/app/scanner/process/page.tsx:59`
**Root Cause**: `selectedWOId` was null when calling `.toString()`
**Solution**: Added null checks before calling `.toString()`

```typescript
// Before (causing error)
const selectedWO = workOrders.find(wo => wo.id === selectedWOId.toString());

// After (fixed)
const selectedWO = selectedWOId ? workOrders.find(wo => wo.id === selectedWOId.toString()) : undefined;
```

### 2. State Management Issues
**Issue**: State not properly initialized
**Solution**: Added proper state initialization and validation

```typescript
// Proper state initialization
const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
const [selectedLine, setSelectedLine] = useState<string | null>(null);
const [stagedLPsByOrder, setStagedLPsByOrder] = useState<{ [key: number]: StagedLP[] }>({});
```

## Data Flow & State Management

### State Management Pattern
```typescript
// Local state for UI
const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
const [selectedLine, setSelectedLine] = useState<string | null>(null);
const [stagedLPsByOrder, setStagedLPsByOrder] = useState<{ [key: number]: StagedLP[] }>({});

// Server state via SWR
const workOrders = useWorkOrders();
const licensePlates = useLicensePlates();
const yieldReports = useYieldReports();
const settings = useSettings();
const machines = useMachines();
```

### Data Flow
1. **Work Order Selection**: User selects work order and production line
2. **BOM Loading**: Load bill of materials for selected work order
3. **Material Staging**: Stage materials for production
4. **Production Execution**: Execute production operations
5. **Output Recording**: Record production output
6. **Report Generation**: Generate yield and consumption reports

## Integration Points

### 1. Production Module Integration
- **Work Order Management**: Work order status updates
- **BOM Integration**: Material requirement planning
- **Yield Reporting**: Production yield tracking
- **Performance Metrics**: Production performance analysis

### 2. Warehouse Module Integration
- **License Plate Management**: LP tracking and management
- **Stock Movement**: Material movement tracking
- **Inventory Updates**: Real-time inventory updates
- **Quality Control**: QA status management

### 3. Planning Module Integration
- **Production Planning**: Production planning integration
- **Resource Planning**: Resource allocation and planning
- **Scheduling**: Production scheduling integration
- **Capacity Planning**: Production capacity management

## User Interface Features

### 1. Scanner Interface
- **Barcode Scanning**: Barcode scanner integration
- **Manual Entry**: Manual data entry options
- **Validation**: Real-time data validation
- **Error Handling**: Comprehensive error handling

### 2. Production Line Selection
- **Line Dropdown**: Production line selection
- **Line Filtering**: Filter work orders by line
- **Line Status**: Line status and capacity display
- **Line Performance**: Line performance metrics

### 3. Material Management
- **Material Staging**: Material staging interface
- **Quantity Management**: Quantity input and validation
- **Availability Checking**: Material availability checking
- **Consumption Tracking**: Real-time consumption tracking

### 4. Output Recording
- **Output Entry**: Production output entry
- **Quantity Validation**: Output quantity validation
- **Quality Control**: QA status management
- **Report Generation**: Automatic report generation

## Error Handling & Validation

### 1. Input Validation
```typescript
// LP number validation
const validateLPNumber = (lpNumber: string): boolean => {
  return lpNumber.length > 0 && /^[A-Z0-9]+$/.test(lpNumber);
};

// Quantity validation
const validateQuantity = (quantity: string): boolean => {
  const num = parseFloat(quantity);
  return !isNaN(num) && num > 0;
};
```

### 2. Error Handling
```typescript
// Error handling pattern
const handleError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);
  toast.error(`Error: ${error.message}`);
  setShowAlert(true);
  setAlertMessage(error.message);
};
```

### 3. Data Validation
```typescript
// Data validation
const validateWorkOrder = (wo: WorkOrder): boolean => {
  return wo.id > 0 && wo.status === 'released' && wo.quantity > 0;
};

const validateLicensePlate = (lp: LicensePlate): boolean => {
  return lp.id.length > 0 && lp.quantity > 0 && lp.status === 'Available';
};
```

## Performance Considerations

### 1. Data Loading
- **Lazy Loading**: Load data only when needed
- **Caching**: Cache frequently accessed data
- **Optimization**: Optimize data queries

### 2. State Management
- **State Optimization**: Minimize state updates
- **Memoization**: Use React.memo for components
- **Debouncing**: Debounce user input

### 3. Real-time Updates
- **WebSocket Integration**: Real-time data updates
- **State Synchronization**: Keep state synchronized
- **Conflict Resolution**: Handle concurrent updates

## Testing Requirements

### 1. Unit Testing
- Component testing for scanner terminals
- Hook testing for data fetching
- Utility function testing

### 2. Integration Testing
- Scanner integration testing
- Database integration testing
- Cross-module integration testing

### 3. End-to-End Testing
- User workflow testing
- Production process testing
- Performance testing

## Deployment Considerations

### 1. Environment Configuration
- **Scanner Hardware**: Barcode scanner configuration
- **Network**: Network connectivity requirements
- **Security**: Security configuration

### 2. Performance Monitoring
- **Response Times**: API response monitoring
- **Error Tracking**: Error monitoring and alerting
- **Usage Analytics**: User behavior tracking

### 3. Maintenance
- **Updates**: Regular system updates
- **Backup**: Data backup procedures
- **Monitoring**: System monitoring and alerting
