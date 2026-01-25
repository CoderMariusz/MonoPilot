/**
 * Page Object Model - Index
 *
 * Export all page objects from a single location.
 */

// Base
export { BasePage } from './BasePage';

// Common
export { LoginPage } from './LoginPage';
export { DashboardPage } from './DashboardPage';
export { DataTablePage } from './DataTablePage';
export { FormPage } from './FormPage';

// Technical Module
export { ProductsPage } from './ProductsPage';
export { BOMsPage } from './BOMsPage';
export { TraceabilityPage } from './TraceabilityPage';

// Module-specific pages can be added here:
// export { SettingsPage } from './modules/SettingsPage';
// export { WorkOrdersPage } from './modules/WorkOrdersPage';
// etc.
