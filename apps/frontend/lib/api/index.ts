// API Layer - Centralized data access with dual-mode support
// This layer provides a clean interface for data access that can switch between
// mock data (development) and real Supabase data (production) seamlessly

export { API_CONFIG, shouldUseMockData } from './config';
export { WorkOrdersAPI } from './workOrders';
export { UsersAPI } from './users';
export { PurchaseOrdersAPI } from './purchaseOrders';
export { TransferOrdersAPI } from './transferOrders';
export { ASNsAPI } from './asns';

// Re-export all API classes for easy importing
export * from './workOrders';
export * from './users';
export * from './purchaseOrders';
export * from './transferOrders';
export * from './asns';

// TODO: Add other API classes as needed:
// export { PurchaseOrdersAPI } from './purchaseOrders';
// export { TransferOrdersAPI } from './transferOrders';
// export { ProductsAPI } from './products';
// export { GRNsAPI } from './grns';
// export { LicensePlatesAPI } from './licensePlates';
// export { StockMovesAPI } from './stockMoves';
// export { UsersAPI } from './users';
// export { SessionsAPI } from './sessions';
// export { SettingsAPI } from './settings';
// export { LocationsAPI } from './locations';
// export { MachinesAPI } from './machines';
// export { AllergensAPI } from './allergens';
