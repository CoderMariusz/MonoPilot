# Production Module Specification

## Overview
The Production Module is the core component of the MonoPilot MES system, responsible for managing work orders, production tracking, yield reporting, and material consumption analysis. It provides real-time visibility into production operations and performance metrics.

## Current Functionality

### Module Structure
- **Route**: `/production`
- **Main Component**: `apps/frontend/app/production/page.tsx`
- **Key Components**: WorkOrdersTable, ProductionLinesDropdown
- **State Management**: SWR for data fetching, React hooks for local state

### Tab-Based Interface
The production module uses a tabbed interface with three main sections:

#### 1. Work Orders Tab
- **Purpose**: Primary work order management interface
- **Component**: `WorkOrdersTable`
- **Features**:
  - Work order listing with filtering and sorting
  - Create, edit, delete operations
  - Work order status management
  - Production line assignment
  - BOM integration for material requirements

#### 2. Yield Report Tab
- **Purpose**: Production yield analysis and reporting
- **Data Source**: `useYieldReports()` hook
- **Features**:
  - Overall yield metrics (total output, target, yield rate, scrap rate)
  - Work order specific yield data
  - Performance tracking by production line
  - Historical yield trends

#### 3. Consume Report Tab
- **Purpose**: Material consumption analysis
- **Data Source**: `mockConsumeReport` (mock data)
- **Features**:
  - Material consumption tracking
  - Variance analysis (planned vs actual)
  - Cost analysis
  - Material efficiency metrics

## Component Architecture

### WorkOrdersTable Component
```typescript
// Location: apps/frontend/components/WorkOrdersTable.tsx
export function WorkOrdersTable() {
  // State management
  const workOrders = useWorkOrders();
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  
  // Features
  - Search and filtering
  - Sorting by multiple columns
  - CRUD operations
  - Status management
  - Production line assignment
}
```

### Key Features

#### Work Order Management
- **Create Work Orders**: Modal-based creation with product selection
- **Edit Work Orders**: In-place editing with validation
- **Delete Work Orders**: Confirmation-based deletion
- **Status Updates**: Work order lifecycle management
- **Production Line Assignment**: Line-specific work order routing

#### Production Line Integration
- **ProductionLinesDropdown**: Line selection component
- **Line-specific filtering**: Filter work orders by production line
- **Line capacity management**: Track line utilization
- **Line performance metrics**: Yield and efficiency by line

#### BOM Integration
- **Material Requirements**: Automatic BOM calculation
- **Material Availability**: Stock level checking
- **Production Planning**: Material requirement planning
- **Cost Analysis**: Material cost tracking

## Data Flow & State Management

### Data Sources
```typescript
// Primary data hooks
const workOrders = useWorkOrders();           // Work order data
const yieldReports = useYieldReports();       // Yield report data
const consumeReport = mockConsumeReport;      // Consumption data (mock)

// BOM integration
const bomItems = getFilteredBomForWorkOrder(workOrder);
```

### State Management Pattern
```typescript
// Local state for UI
const [activeTab, setActiveTab] = useState<TabType>('work-orders');
const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<number | null>(null);
const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

// Server state via SWR
const { data: workOrders, error, isLoading } = useWorkOrders();
```

## Work Order Lifecycle

### Status Flow
```
draft → planned → released → in_progress → completed
                                    ↓
                               cancelled
```

### Key Status Transitions
- **Planned**: Work order created and scheduled
- **Released**: Materials allocated, ready for production
- **In Progress**: Active production
- **Completed**: Production finished, quality checked
- **Cancelled**: Work order cancelled (any stage)

### Production Line Assignment
- **Line Selection**: Assign work orders to specific production lines
- **Line Capacity**: Track line utilization and capacity
- **Line Performance**: Monitor line-specific metrics
- **Line Scheduling**: Optimize line utilization

## BOM Handling & Routing

### Bill of Materials Integration
```typescript
// BOM data structure
interface Bom {
  id: number;
  product_id: number;
  version: string;
  status: 'draft' | 'active' | 'archived';
  is_active: boolean;
  requires_routing: boolean;
  bomItems?: BomItem[];
}

// BOM item structure
interface BomItem {
  id: number;
  bom_id: number;
  material_id: number;
  quantity: number;
  uom: string;
  sequence: number;
  priority?: number;
  production_lines?: string[];
  material?: Product;
}
```

### Material Requirements
- **Automatic Calculation**: BOM-based material requirements
- **Stock Checking**: Material availability verification
- **Production Lines**: Line-specific material requirements
- **Cost Analysis**: Material cost tracking and analysis

### Routing Integration
- **Routing Requirements**: Production routing for complex products
- **Operation Sequences**: Step-by-step production processes
- **Line Restrictions**: Material-specific line requirements
- **Quality Gates**: Quality checkpoints in production

## Production Line Management

### Line Configuration
```typescript
// Production line data
interface ProductionLine {
  id: string;
  name: string;
  type: string;
  capacity: number;
  is_active: boolean;
  current_work_order?: WorkOrder;
  utilization_rate: number;
}
```

### Line Operations
- **Line Assignment**: Assign work orders to specific lines
- **Capacity Management**: Track line utilization
- **Performance Monitoring**: Line-specific metrics
- **Scheduling**: Optimize line utilization

## Yield Reporting

### Yield Metrics
```typescript
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

### Performance Tracking
- **Overall Yield**: System-wide yield metrics
- **Line Performance**: Line-specific yield analysis
- **Product Performance**: Product-specific yield tracking
- **Historical Trends**: Yield trend analysis over time

## Material Consumption Analysis

### Consumption Tracking
```typescript
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

### Variance Analysis
- **Planned vs Actual**: Material consumption variance
- **Cost Analysis**: Material cost tracking
- **Efficiency Metrics**: Material utilization efficiency
- **Trend Analysis**: Consumption trend monitoring

## Integration Points

### Scanner Module Integration
- **Pack Terminal**: Packing operations integration
- **Process Terminal**: Processing operations integration
- **Material Consumption**: Real-time consumption tracking
- **Staged LPs**: License plate staging for production

### Warehouse Module Integration
- **Material Availability**: Stock level checking
- **License Plate Management**: LP tracking for production
- **Stock Movements**: Material movement tracking
- **Quality Control**: QA status management

### Planning Module Integration
- **Work Order Planning**: Production planning integration
- **Resource Planning**: Resource allocation and planning
- **Scheduling**: Production scheduling integration
- **Capacity Planning**: Production capacity management

## Areas Needing Development

### 1. Real-time Production Tracking
- **Current State**: Basic work order management
- **Needed**: Real-time production status updates
- **Implementation**: WebSocket integration for live updates

### 2. Advanced Scheduling
- **Current State**: Basic work order scheduling
- **Needed**: Advanced scheduling algorithms
- **Implementation**: Production scheduling optimization

### 3. Quality Control Integration
- **Current State**: Basic QA status tracking
- **Needed**: Comprehensive quality control workflow
- **Implementation**: QC process integration

### 4. Performance Analytics
- **Current State**: Basic yield reporting
- **Needed**: Advanced analytics and reporting
- **Implementation**: Analytics dashboard and reporting

### 5. Mobile Support
- **Current State**: Desktop-only interface
- **Needed**: Mobile-responsive design
- **Implementation**: Mobile-first responsive design

## Known Issues from Deployment

### 1. Scanner Integration Issues
- **Issue**: Null reference errors in scanner pages
- **Status**: Fixed in deployment
- **Solution**: Added null checks for `selectedWOId`

### 2. Mock Data Limitations
- **Issue**: Limited mock data for testing
- **Status**: Partially resolved
- **Solution**: Enhanced mock data with realistic scenarios

### 3. Performance Optimization
- **Issue**: Large data sets may impact performance
- **Status**: Needs optimization
- **Solution**: Implement pagination and lazy loading

## Development Priorities

### Phase 1: Core Functionality
1. **Real-time Updates**: WebSocket integration
2. **Advanced Filtering**: Enhanced search and filtering
3. **Bulk Operations**: Batch work order operations
4. **Export Functionality**: Data export capabilities

### Phase 2: Advanced Features
1. **Production Scheduling**: Advanced scheduling algorithms
2. **Performance Analytics**: Comprehensive analytics
3. **Mobile Support**: Mobile-responsive design
4. **Integration**: Enhanced scanner and warehouse integration

### Phase 3: Optimization
1. **Performance**: Performance optimization
2. **Scalability**: Scalability improvements
3. **User Experience**: Enhanced user experience
4. **Reporting**: Advanced reporting capabilities

## Technical Requirements

### Dependencies
- **React**: 19.0.0
- **Next.js**: 15.5.4
- **SWR**: 2.2.6 (data fetching)
- **Lucide React**: 0.469.0 (icons)
- **TypeScript**: 5.7.2

### API Requirements
- **Work Orders API**: CRUD operations
- **Yield Reports API**: Report generation
- **Consumption API**: Material consumption tracking
- **Production Lines API**: Line management

### Database Requirements
- **Work Orders Table**: Work order data
- **BOM Tables**: Bill of materials data
- **Production Lines Table**: Line configuration
- **Yield Reports Table**: Yield data storage
- **Consumption Table**: Material consumption data

## Testing Requirements

### Unit Testing
- Component testing for WorkOrdersTable
- Hook testing for data fetching
- Utility function testing

### Integration Testing
- API integration testing
- Database integration testing
- Cross-module integration testing

### End-to-End Testing
- User workflow testing
- Production process testing
- Performance testing

## Deployment Considerations

### Environment Variables
- **Database URL**: Supabase connection
- **API Keys**: External service keys
- **Feature Flags**: Feature toggle configuration

### Performance Monitoring
- **Response Times**: API response monitoring
- **Error Tracking**: Error monitoring and alerting
- **Usage Analytics**: User behavior tracking

### Security Considerations
- **Authentication**: User authentication and authorization
- **Data Protection**: Sensitive data protection
- **Access Control**: Role-based access control
