#!/usr/bin/env node

import { execSync } from 'node:child_process';

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://127.0.0.1:3030';
const REQUIRED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE'];

async function isMcpAvailable() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${MCP_BASE_URL}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cmd: 'db.status' }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    if (!result?.ok) {
      throw new Error(result?.error || 'Unknown MCP error');
    }

    return true;
  } catch (error) {
    console.warn('Skipping critical E2E tests: MCP server unavailable.', error.message);
    return false;
  }
}

async function main() {
  if (process.env.SKIP_E2E === '1') {
    console.warn('Skipping critical E2E tests because SKIP_E2E=1.');
    return;
  }

  const missingEnv = REQUIRED_ENV_VARS.filter(name => !process.env[name]);
  if (missingEnv.length > 0) {
    console.warn(
      `Skipping critical E2E tests: missing environment variables ${missingEnv.join(', ')}.`,
    );
    return;
  }

  const available = await isMcpAvailable();
  if (!available) {
    return;
  }

  try {
    execSync('pnpm --dir apps/frontend test:e2e:auth', { stdio: 'inherit' });
  } catch (error) {
    console.error('Critical E2E tests failed.');
    process.exit(error.status || 1);
  }
}

main().catch(error => {
  console.error('Unexpected error while running critical E2E tests:', error);
  process.exit(1);
});

