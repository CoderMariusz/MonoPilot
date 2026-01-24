/**
 * Technical Module - Page Object Exports
 *
 * Central export for all Technical module page objects.
 * Makes it easy to import all pages at once.
 *
 * Usage:
 *   import { ProductsPage, BOMsPage, RoutingsPage, ProductTypesPage } from '../pages/TechnicalPages';
 *   const productsPage = new ProductsPage(page);
 */

export { ProductsPage, type ProductData } from './ProductsPage';
export { BOMsPage, type BOMData, type BOMItemData } from './BOMsPage';
export { RoutingsPage, type RoutingData, type OperationData } from './RoutingsPage';
export { ProductTypesPage, type ProductTypeData } from './ProductTypesPage';

// Re-export base page for convenience
export { BasePage } from './BasePage';
export { DataTablePage } from './DataTablePage';
export { FormPage } from './FormPage';
