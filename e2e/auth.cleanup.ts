/**
 * Authentication Cleanup for E2E Tests
 *
 * This file runs after all tests complete to clean up auth state if needed.
 * By default, it keeps auth files for faster subsequent runs.
 */

import { test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';

teardown('cleanup auth state', async () => {
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
});
