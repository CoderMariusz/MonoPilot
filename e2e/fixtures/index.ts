/**
 * E2E Test Fixtures - Index
 *
 * Export all fixtures and test utilities.
 */

export * from './test-data';

// Re-export commonly used Playwright utilities
export { test, expect } from '@playwright/test';

// Re-export page objects
export * from '../pages';
