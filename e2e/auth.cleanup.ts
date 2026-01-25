/**
 * Authentication Cleanup for E2E Tests
 *
 * This file runs after all tests complete to clean up auth state if needed.
 * By default, it keeps auth files for faster subsequent runs.
 * Can also clean up test database data if CLEANUP_TEST_DATA=true.
 */

import { test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { cleanupProductionData } from './fixtures/seed-production-data';

teardown('cleanup', async () => {
  console.log('\n');

  // Clean up test database data if requested
  if (process.env.CLEANUP_TEST_DATA === 'true') {
    try {
      console.log('📦 Cleaning up test database...');

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        });

        await cleanupProductionData(supabase);
      } else {
        console.warn('⚠️  Supabase credentials missing - skipping database cleanup');
      }
    } catch (error) {
      console.warn('⚠️  Failed to cleanup test database:', error);
    }
  } else {
    console.log('ℹ️  Test database preserved for faster subsequent runs');
    console.log('   Set CLEANUP_TEST_DATA=true to remove test data');
  }

  // Only clean up auth files if explicitly requested
  if (process.env.CLEANUP_AUTH === 'true') {
    const authDir = path.join(process.cwd(), '.auth');

    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(authDir, file));
          console.log(`🗑️  Removed: .auth/${file}`);
        }
      }
    }

    console.log('✅ Auth cleanup complete');
  } else {
    console.log('ℹ️  Auth files preserved for faster subsequent runs');
    console.log('   Set CLEANUP_AUTH=true to remove them');
  }

  console.log('\n');
});
