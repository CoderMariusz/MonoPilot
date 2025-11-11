# Module Connections and Data Flow

## Overview
This document describes how the different modules in MonoPilot MES connect and share data, creating a cohesive manufacturing execution system.

## Module Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Technical     │    │    Planning     │    │   Production    │
│   (BOM Mgmt)    │◄──►│  (Work Orders)  │◄──►│  (Execution)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Warehouse     │    │     Scanner     │    │    Quality      │
│  (Inventory)    │◄──►│   (Terminals)   │◄──►│   (Control)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Data Flow Between Modules

### 1. Technical → Planning

#### Data Shared
- **Products**: Product definitions and specifications
- **BOMs**: Bill of Materials with components
- **BOM Items**: Material requirements and consumption rules

#### Integration Points
```
Technical Module
├── Product Creation
├── BOM Definition
└── Material Specifications
    ↓
Planning Module
├── Work Order Creation
├── Material Requirements
└── Production Scheduling
```

#### API Calls
- `GET /api/products` - Fetch product catalog
- `GET /api/products/:id/bom` - Get BOM for work order
- `POST /api/work-orders` - Create work order with BOM snapshot

### 2. Planning → Production

#### Data Shared
- **Work Orders**: Production instructions
- **WO Materials**: BOM snapshots with material requirements
- **LP Reservations**: Material reservations for production

#### Integration Points
```
Planning Module
├── Work Order Release
├── Material Reservation
└── Production Scheduling
    ↓
Production Module
├── Work Order Execution
├── Material Consumption
└── Production Tracking
```

#### API Calls
- `GET /api/work-orders/:id` - Fetch work order details
- `GET /api/work-orders/:id/materials` - Get material requirements
- `POST /api/production/start` - Start work order execution

### 3. Production → Warehouse

#### Data Shared
- **Stock Moves**: Material consumption and production output
- **License Plates**: LP creation and movement
- **LP Compositions**: Parent-child LP relationships

#### Integration Points
```
Production Module
├── Material Consumption
├── Production Output
└── LP Creation
    ↓
Warehouse Module
├── Stock Movement
├── LP Management
└── Inventory Updates
```

#### API Calls
- `POST /api/stock-moves` - Record material consumption
- `POST /api/license-plates` - Create production LPs
- `PUT /api/license-plates/:id` - Update LP status

### 4. Scanner → All Modules

#### Data Shared
- **Real-time Operations**: Scanner terminal operations
- **Material Scanning**: LP scanning and validation
- **Production Recording**: Actual production data

#### Integration Points
```
Scanner Terminals
├── Pack Terminal
│   ├── LP Scanning
│   ├── Material Consumption
│   └── Production Output
└── Process Terminal
    ├── Material Processing
    ├── Stage-based LP Creation
    └── Quality Recording
```

## Module-Specific Connections

### Technical Module Connections

#### Input Sources
- **User Input**: Product and BOM creation
- **Supplier Data**: Material specifications
- **Quality Standards**: Allergen and compliance data

#### Output Destinations
- **Planning**: BOM data for work order creation
- **Warehouse**: Material specifications for inventory
- **Quality**: Product specifications for QC

#### Key APIs
```typescript
// Product Management
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

// BOM Management
GET /api/products/:id/bom
POST /api/products/:id/bom
PUT /api/bom/:id
DELETE /api/bom/:id
```

### Planning Module Connections

#### Input Sources
- **Technical**: Product and BOM data
- **Sales**: Customer orders and demand
- **Production**: Capacity and constraints

#### Output Destinations
- **Production**: Work orders and schedules
- **Warehouse**: Material reservations
- **Procurement**: Material requirements

#### Key APIs
```typescript
// Work Order Management
GET /api/work-orders
POST /api/work-orders
PUT /api/work-orders/:id
DELETE /api/work-orders/:id

// Material Planning
GET /api/work-orders/:id/materials
POST /api/work-orders/:id/reserve
```

### Production Module Connections

#### Input Sources
- **Planning**: Work orders and schedules
- **Warehouse**: Material availability
- **Scanner**: Real-time production data

#### Output Destinations
- **Warehouse**: Production output and LP creation
- **Quality**: Production data for QC
- **Planning**: Production status updates

#### Key APIs
```typescript
// Production Execution
POST /api/production/start/:wo_id
POST /api/production/complete/:wo_id
GET /api/production/status/:wo_id

// Material Consumption
POST /api/production/consume
POST /api/production/output
```

### Warehouse Module Connections

#### Input Sources
- **Production**: Material consumption and output
- **Procurement**: Material receipts
- **Scanner**: Real-time inventory updates

#### Output Destinations
- **Production**: Material availability
- **Planning**: Inventory status
- **Quality**: Material traceability

#### Key APIs
```typescript
// Inventory Management
GET /api/license-plates
POST /api/license-plates
PUT /api/license-plates/:id
GET /api/stock-moves

// Stock Operations
POST /api/stock-moves
GET /api/inventory/available
POST /api/inventory/reserve
```

## Data Dependencies

### Critical Dependencies
1. **Products** → **BOMs** → **Work Orders** → **Production**
2. **Materials** → **LP Reservations** → **Stock Moves** → **Inventory**
3. **Work Orders** → **Production Output** → **LP Creation** → **Warehouse**

### Optional Dependencies
1. **Allergens** → **Product Specifications** → **Quality Control**
2. **Suppliers** → **Material Costs** → **Production Planning**
3. **Machines** → **Production Lines** → **Work Order Scheduling**

## Error Handling and Rollback

### Transaction Boundaries
- **Product Creation**: Atomic with BOM creation
- **Work Order Creation**: Atomic with material reservation
- **Production Execution**: Atomic with material consumption

### Rollback Scenarios
- **BOM Changes**: Rollback work orders if BOM is modified
- **Material Shortage**: Rollback work order if materials unavailable
- **Production Failure**: Rollback material consumption if production fails

## Performance Considerations

### Data Volume
- **Products**: ~10,000 records
- **BOM Items**: ~50,000 records
- **Work Orders**: ~1,000 active records
- **Stock Moves**: ~100,000 records/month

### Optimization Strategies
- **Caching**: Product and BOM data caching
- **Indexing**: Database indexes for common queries
- **Pagination**: Large dataset pagination
- **Async Processing**: Background material calculations

## Security and Access Control

### Role-Based Access
- **Technical**: Product and BOM management
- **Planning**: Work order creation and scheduling
- **Production**: Work order execution and tracking
- **Warehouse**: Inventory and material management

### Data Isolation
- **Plant-Level**: Multi-plant data isolation
- **User-Level**: User-specific data access
- **Module-Level**: Module-specific permissions

## Monitoring and Analytics

### Key Metrics
- **BOM Accuracy**: BOM vs actual consumption
- **Production Efficiency**: Planned vs actual output
- **Material Utilization**: Material waste tracking
- **Inventory Turnover**: Material movement frequency

### Integration Points
- **BI Tools**: Data warehouse integration
- **Reporting**: Real-time dashboards
- **Alerts**: Exception notifications
- **Audit**: Complete audit trail

## Future Enhancements

### Planned Integrations
- **ERP Systems**: SAP, Oracle integration
- **MES Systems**: Advanced manufacturing execution
- **IoT Devices**: Sensor data integration
- **AI/ML**: Predictive analytics and optimization

### Scalability Considerations
- **Microservices**: Module decomposition
- **Event-Driven**: Asynchronous communication
- **Cloud-Native**: Scalable infrastructure
- **API Gateway**: Centralized API management
