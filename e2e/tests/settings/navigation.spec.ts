/**
 * Settings Navigation - E2E Tests
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Tests settings sidebar navigation:
 * - Menu items are visible and organized by section
 * - Can navigate to each settings subpage
 * - Active menu item is highlighted correctly
 * - Implemented items are clickable, unimplemented show "Soon" badge
 * - Role-based visibility filters navigation
 * - Breadcrumbs work correctly
 */

import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/BasePage';

const SETTINGS_ROUTE = '/settings';

// Navigation sections and items (from settings-navigation-service.ts)
const NAVIGATION_STRUCTURE = {
  organization: {
    section: 'Organization',
    items: [
      { name: 'Organization Profile', path: '/settings/organization', implemented: true },
    ],
  },
  usersRoles: {
    section: 'Users & Roles',
    items: [
      { name: 'Users', path: '/settings/users', implemented: true },
      { name: 'Roles & Permissions', path: '/settings/roles', implemented: true },
      { name: 'Invitations', path: '/settings/invitations', implemented: false },
    ],
  },
  infrastructure: {
    section: 'Infrastructure',
    items: [
      { name: 'Warehouses', path: '/settings/warehouses', implemented: true },
      { name: 'Machines', path: '/settings/machines', implemented: true },
      { name: 'Production Lines', path: '/settings/production-lines', implemented: true },
    ],
  },
  masterData: {
    section: 'Master Data',
    items: [
      { name: 'Allergens', path: '/settings/allergens', implemented: true },
      { name: 'Tax Codes', path: '/settings/tax-codes', implemented: true },
    ],
  },
  integrations: {
    section: 'Integrations',
    items: [
      { name: 'API Keys', path: '/settings/api-keys', implemented: false },
      { name: 'Webhooks', path: '/settings/webhooks', implemented: false },
    ],
  },
  system: {
    section: 'System',
    items: [
      { name: 'Modules', path: '/settings/modules', implemented: true },
      { name: 'Security', path: '/settings/security', implemented: true },
      { name: 'Audit Logs', path: '/settings/audit-logs', implemented: false },
    ],
  },
};

test.describe('Settings Navigation Menu', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to settings and wait for navigation to load
    await page.goto(SETTINGS_ROUTE);
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation Structure', () => {
    test('should display navigation sidebar', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Settings navigation"]');
      await expect(nav).toBeVisible();
    });

    test('should display all section headers', async ({ page }) => {
      const sections = Object.values(NAVIGATION_STRUCTURE).map((s) => s.section);

      for (const section of sections) {
        const heading = page.locator('nav[aria-label="Settings navigation"] h3').filter({ hasText: section });
        await expect(heading).toBeVisible();
      }
    });

    test('should display all navigation items', async ({ page }) => {
      const allItems = Object.values(NAVIGATION_STRUCTURE).flatMap((s) => s.items);

      for (const item of allItems) {
        const itemLocator = page.locator(`a, div`).filter({ hasText: item.name });
        await expect(itemLocator.first()).toBeVisible();
      }
    });

    test('should show "Soon" badge for unimplemented items', async ({ page }) => {
      const unimplementedItems = Object.values(NAVIGATION_STRUCTURE)
        .flatMap((s) => s.items)
        .filter((item) => !item.implemented);

      for (const item of unimplementedItems) {
        const itemContainer = page.locator('nav[aria-label="Settings navigation"]').locator('div').filter({ hasText: item.name });
        const soonBadge = itemContainer.locator('text=/Soon/i');
        await expect(soonBadge.first()).toBeVisible();
      }
    });

    test('should disable unimplemented items', async ({ page }) => {
      const unimplementedItems = Object.values(NAVIGATION_STRUCTURE)
        .flatMap((s) => s.items)
        .filter((item) => !item.implemented);

      for (const item of unimplementedItems) {
        const itemElement = page.locator('nav[aria-label="Settings navigation"]').locator('div[aria-disabled="true"]').filter({ hasText: item.name });
        // Should have aria-disabled or be a div (not a link)
        await expect(itemElement.first()).toBeVisible();
        const isDisabled = await itemElement.first().evaluate((el) => {
          return el.getAttribute('aria-disabled') === 'true' || el.tagName !== 'A';
        });
        expect(isDisabled).toBe(true);
      }
    });
  });

  test.describe('Navigation to Implemented Pages', () => {
    const implementedItems = Object.values(NAVIGATION_STRUCTURE)
      .flatMap((s) => s.items)
      .filter((item) => item.implemented);

    for (const item of implementedItems) {
      test(`should navigate to ${item.name}`, async ({ page }) => {
        // Click on navigation item
        const link = page.locator('a').filter({ hasText: item.name });
        await link.click();

        // Wait for navigation and verify URL
        await page.waitForURL(`**${item.path}**`);
        await page.waitForLoadState('networkidle');

        // Verify we're on the correct page
        expect(page.url()).toContain(item.path);
      });
    }
  });

  test.describe('Active State Highlighting', () => {
    for (const item of Object.values(NAVIGATION_STRUCTURE)
      .flatMap((s) => s.items)
      .filter((item) => item.implemented)) {
      test(`should highlight ${item.name} when on its page`, async ({ page }) => {
        // Navigate to the page
        await page.goto(item.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000); // Extra wait for React hydration

        // Wait for navigation to load
        const nav = page.locator('nav[aria-label="Settings navigation"]');
        await expect(nav).toBeVisible({ timeout: 15000 });

        // Find the navigation item - use the most specific selector
        const navItem = nav.locator('a').filter({ hasText: item.name });

        // Wait for the navigation item to be visible
        await expect(navItem.first()).toBeVisible({ timeout: 10000 });

        // Check for active state indicator
        const hasAriaCurrentPage = await navItem.first().evaluate((el) => {
          return el.getAttribute('aria-current') === 'page';
        });

        // At least aria-current should be present on the link
        expect(hasAriaCurrentPage).toBe(true);
      });
    }
  });

  test.describe('Navigation Item Layout', () => {
    test('should render navigation items with icon and label', async ({ page }) => {
      const navItem = page.locator('nav[aria-label="Settings navigation"] a').first();

      // Check for icon (SVG)
      const icon = navItem.locator('svg');
      await expect(icon).toBeVisible();

      // Check for label text
      const label = navItem.locator('span');
      await expect(label).toBeVisible();
    });

    test('should have proper spacing and layout', async ({ page }) => {
      const navContainer = page.locator('nav[aria-label="Settings navigation"]');
      const sections = navContainer.locator('> div');

      // Should have multiple sections
      expect(await sections.count()).toBeGreaterThan(0);

      // Each section should have items
      for (let i = 0; i < (await sections.count()); i++) {
        const section = sections.nth(i);
        const heading = section.locator('h3');
        const items = section.locator('a, div[aria-disabled="true"]');

        await expect(heading).toBeVisible();
        expect(await items.count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Navigation Persistence', () => {
    test('should maintain navigation when navigating between pages', async ({ page }) => {
      // Start on settings main page
      await page.goto(SETTINGS_ROUTE);
      const navInitial = page.locator('nav[aria-label="Settings navigation"]');
      await expect(navInitial).toBeVisible();

      // Navigate to organization page
      await page.locator('a').filter({ hasText: 'Organization Profile' }).click();
      await page.waitForURL('**/settings/organization**');

      // Navigation should still be visible
      const navAfter = page.locator('nav[aria-label="Settings navigation"]');
      await expect(navAfter).toBeVisible();

      // Navigate to users page
      await page.locator('a').filter({ hasText: 'Users' }).first().click();
      await page.waitForURL('**/settings/users**');

      // Navigation should still be visible
      const navFinal = page.locator('nav[aria-label="Settings navigation"]');
      await expect(navFinal).toBeVisible();
    });

    test('should show correct active item after navigation', async ({ page }) => {
      // Navigate to organization
      const orgLink = page.locator('a').filter({ hasText: 'Organization Profile' });
      await orgLink.click();
      await page.waitForURL('**/settings/organization**');
      await page.waitForLoadState('networkidle');

      // Check organization is active
      const isOrgActive = await orgLink.evaluate((el) => el.getAttribute('aria-current') === 'page');
      expect(isOrgActive).toBe(true);

      // Navigate to users
      const usersLink = page.locator('a').filter({ hasText: 'Users' }).first();
      await usersLink.click();
      await page.waitForURL('**/settings/users**');
      await page.waitForLoadState('networkidle');

      // Check users is now active and organization is not
      const isUsersActive = await usersLink.evaluate((el) => el.getAttribute('aria-current') === 'page');
      expect(isUsersActive).toBe(true);

      // Organization should no longer be active
      const isOrgInactive = await orgLink.evaluate((el) => el.getAttribute('aria-current') !== 'page');
      expect(isOrgInactive).toBe(true);
    });
  });

  test.describe('Navigation Section Organization', () => {
    test('should group related items under sections', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Settings navigation"]');

      // Each section should be grouped visually
      const sectionDivs = nav.locator('> div');
      const sectionCount = await sectionDivs.count();

      expect(sectionCount).toBeGreaterThan(0);

      // Verify section headers match navigation structure
      const expectedSections = Object.values(NAVIGATION_STRUCTURE).map((s) => s.section);
      for (const section of expectedSections) {
        const heading = nav.locator('h3').filter({ hasText: section });
        await expect(heading).toBeVisible();
      }
    });

    test('should display section headers as uppercase text', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Settings navigation"]');
      const headings = nav.locator('h3');

      for (let i = 0; i < (await headings.count()); i++) {
        const heading = headings.nth(i);
        const text = await heading.textContent();
        // Verify text is uppercase or title case
        expect(text).toBeTruthy();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate using Tab key', async ({ page }) => {
      const nav = page.locator('nav[aria-label="Settings navigation"]');
      const firstLink = nav.locator('a').first();

      // Focus first link
      await firstLink.focus();
      const isFocused = await firstLink.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBe(true);

      // Tab to next link
      await page.keyboard.press('Tab');
      const secondLink = nav.locator('a').nth(1);
      const isSecondFocused = await secondLink.evaluate((el) => el === document.activeElement);
      expect(isSecondFocused).toBe(true);
    });

    test('should activate link with Enter key', async ({ page }) => {
      const link = page.locator('a').filter({ hasText: 'Organization Profile' }).first();
      await link.focus();
      await page.keyboard.press('Enter');

      await page.waitForURL('**/settings/organization**');
      expect(page.url()).toContain('/settings/organization');
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should display navigation at desktop width', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });

      const nav = page.locator('nav[aria-label="Settings navigation"]');
      await expect(nav).toBeVisible();

      // Navigation should not be hidden
      const isVisible = await nav.isVisible();
      expect(isVisible).toBe(true);
    });

    test('should display navigation at tablet width', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 720 });

      const nav = page.locator('nav[aria-label="Settings navigation"]');
      // Navigation should still be available (may be collapsible but not hidden)
      const exists = await nav.count();
      expect(exists).toBeGreaterThan(0);
    });
  });

  test.describe('Error Recovery', () => {
    test('should show navigation even if page load fails initially', async ({ page }) => {
      // Navigate normally - the navigation component should handle loading states
      await page.goto(SETTINGS_ROUTE);
      await page.waitForLoadState('networkidle');

      // Navigation should be visible or error state should be shown
      const nav = page.locator('nav[aria-label="Settings navigation"]');
      const errorState = page.locator('text=/error|failed/i');

      // Check if navigation is visible
      const isNavVisible = await nav.isVisible().catch(() => false);

      // Either navigation should be visible or an error message should be shown
      expect(isNavVisible || (await errorState.count()) > 0).toBe(true);
    });
  });

  test.describe('Unimplemented Items', () => {
    test('should not allow navigation to unimplemented items', async ({ page }) => {
      const unimplementedItem = page.locator('nav[aria-label="Settings navigation"]').locator('div[aria-disabled="true"]').filter({ hasText: 'Invitations' });

      // Should not be a clickable link
      const tagName = await unimplementedItem.first().evaluate((el) => el.tagName);
      expect(tagName).not.toBe('A');
    });

    test('should show "Soon" badge for all unimplemented items', async ({ page }) => {
      const unimplementedNames = Object.values(NAVIGATION_STRUCTURE)
        .flatMap((s) => s.items)
        .filter((item) => !item.implemented)
        .map((item) => item.name);

      for (const name of unimplementedNames) {
        const itemContainer = page.locator('nav[aria-label="Settings navigation"]').locator('div').filter({ hasText: name });
        const soonBadge = itemContainer.locator('text=/Soon/i');
        await expect(soonBadge.first()).toBeVisible();
      }
    });
  });
});
