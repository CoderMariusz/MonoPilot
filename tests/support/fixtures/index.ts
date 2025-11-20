import { test as base } from '@playwright/test';
import { UserFactory } from './factories/user-factory';
import { AuthHelper } from '../helpers/auth-helper';

/**
 * Extended Playwright test fixtures with custom factories and helpers.
 *
 * This provides automatic setup and cleanup for test data and authentication.
 *
 * @example
 * import { test, expect } from './support/fixtures';
 *
 * test('should create and login user', async ({ page, userFactory, authHelper }) => {
 *   const user = await userFactory.createUser();
 *   await authHelper.login(page, user.email, user.password);
 *   // Test continues...
 *   // Auto-cleanup happens after test completes
 * });
 */

type TestFixtures = {
  userFactory: UserFactory;
  authHelper: AuthHelper;
};

export const test = base.extend<TestFixtures>({
  /**
   * User factory fixture - creates test users with automatic cleanup
   */
  userFactory: async ({}, use) => {
    const factory = new UserFactory();
    await use(factory);
    // Auto-cleanup: delete all created users after test
    await factory.cleanup();
  },

  /**
   * Authentication helper fixture - provides login/logout utilities
   */
  authHelper: async ({}, use) => {
    const helper = new AuthHelper();
    await use(helper);
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
