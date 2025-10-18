// API Layer - Database-first data access
// This layer provides a clean interface for data access using Supabase

export { API_CONFIG } from './config';
export { WorkOrdersAPI } from './workOrders';
export { UsersAPI } from './users';
export { PurchaseOrdersAPI } from './purchaseOrders';
export { TransferOrdersAPI } from './transferOrders';
export { ASNsAPI } from './asns';
export { TaxCodesAPI } from './taxCodes';
export { SupplierProductsAPI } from './supplierProducts';
export { RoutingsAPI } from './routings';

// Re-export all API classes for easy importing
export * from './workOrders';
export * from './users';
export * from './purchaseOrders';
export * from './transferOrders';
export * from './asns';
export * from './taxCodes';
export * from './supplierProducts';
export * from './routings';

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
