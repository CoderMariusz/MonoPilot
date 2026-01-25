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
export { RoutingsPage } from './RoutingsPage';

// Planning Module
export { WorkOrdersPage } from './WorkOrdersPage';

// Production Module
export { ProductionDashboardPage } from './production/ProductionDashboardPage';
export { WorkOrderExecutionPage } from './production/WorkOrderExecutionPage';
export { MaterialConsumptionPage } from './production/MaterialConsumptionPage';
export { OutputRegistrationPage } from './production/OutputRegistrationPage';

// Module-specific pages can be added here as they're created
