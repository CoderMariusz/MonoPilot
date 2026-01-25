/**
 * Global Setup for Playwright E2E Tests
 *
 * This runs once before all tests to:
 * - Ensure .auth directory exists
 * - Validate environment variables
 * - Seed production test data
 */

import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { seedProductionData } from './fixtures/seed-production-data';

async function globalSetup(config: FullConfig) {
  // Create .auth directory if it doesn't exist
  const authDir = path.join(process.cwd(), '.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Validate required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('   Make sure .env.test is configured properly.');
  }

  // Seed production test data
  try {
    console.log('\n📦 Initializing test database...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.warn('⚠️  Supabase credentials missing - skipping test data seeding');
      console.warn('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable');
    } else {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      });

      // Seed production test data
      await seedProductionData(supabase);
    }
  } catch (error) {
    console.warn('⚠️  Failed to seed test data:', error);
    console.warn('   Tests may fail if they depend on this data');
    console.warn('   You can manually run: pnpm test:seed-production');
  }

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
