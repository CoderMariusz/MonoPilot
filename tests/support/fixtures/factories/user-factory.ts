import { faker } from '@faker-js/faker';

/**
 * User Factory - creates test users with realistic fake data.
 *
 * Features:
 * - Generates realistic user data using Faker
 * - Tracks created users for automatic cleanup
 * - Supports field overrides for specific test cases
 * - Integrates with API or Supabase for user creation
 *
 * @example
 * const factory = new UserFactory();
 * const user = await factory.createUser({ role: 'admin' });
 * console.log(user.email); // faker-generated email
 */
export class UserFactory {
  private createdUsers: string[] = [];

  /**
   * Create a test user with optional field overrides
   */
  async createUser(overrides: Partial<User> = {}): Promise<User> {
    const user: User = {
      email: faker.internet.email().toLowerCase(),
      name: faker.person.fullName(),
      password: faker.internet.password({ length: 12 }),
      role: 'operator',
      org_id: process.env.TEST_ORG_ID || '1',
      ...overrides,
    };

    // TODO: Replace with actual API call or Supabase client
    // Example API call:
    // const response = await fetch(`${process.env.API_URL}/users`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(user),
    // });
    // const created = await response.json();

    // For now, mock the created user (replace with real implementation)
    const created = {
      ...user,
      id: faker.string.uuid(),
      created_at: new Date().toISOString(),
    };

    this.createdUsers.push(created.id);
    return created;
  }

  /**
   * Create multiple users at once
   */
  async createUsers(count: number, overrides: Partial<User> = {}): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.createUser(overrides));
    }
    return users;
  }

  /**
   * Create a user with admin role
   */
  async createAdmin(overrides: Partial<User> = {}): Promise<User> {
    return this.createUser({ ...overrides, role: 'admin' });
  }

  /**
   * Cleanup all created users (called automatically by fixture)
   */
  async cleanup(): Promise<void> {
    // TODO: Replace with actual API delete calls
    // for (const userId of this.createdUsers) {
    //   await fetch(`${process.env.API_URL}/users/${userId}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    //     },
    //   });
    // }

    console.log(`[UserFactory] Cleanup: ${this.createdUsers.length} users removed`);
    this.createdUsers = [];
  }
}

// Type definition for User
export interface User {
  id?: string;
  email: string;
  name: string;
  password: string;
  role: string;
  org_id: string;
  created_at?: string;
}
