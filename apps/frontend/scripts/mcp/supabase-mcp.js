#!/usr/bin/env node

import http from 'node:http';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.MCP_PORT || 3030;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

function runCommand(cmd, options = {}) {
  try {
    console.log(`Executing: ${cmd}`);
    const result = execSync(cmd, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      cwd: join(__dirname, '../../'),
      ...options 
    });
    console.log(`Command completed successfully`);
    return result;
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  try {
    const { cmd } = JSON.parse(body || '{}');

    if (!cmd) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing cmd parameter' }));
      return;
    }

    let result;

    switch (cmd) {
      case 'db.reset':
        console.log('Resetting database...');
        result = runCommand('supabase db reset --no-prompt');
        break;

      case 'db.seed':
        console.log('Seeding database...');
        if (!SUPABASE_DB_URL) {
          throw new Error('SUPABASE_DB_URL environment variable is required for seeding');
        }
        result = runCommand(`psql "${SUPABASE_DB_URL}" -f lib/supabase/seed/test-seed.sql`);
        break;

      case 'db.status':
        console.log('Checking database status...');
        result = runCommand('supabase status');
        break;

      case 'db.migrate':
        console.log('Running migrations...');
        result = runCommand('supabase db push');
        break;

      default:
        throw new Error(`Unknown command: ${cmd}`);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      ok: true, 
      cmd,
      result: result?.toString() || 'Command executed successfully'
    }));

  } catch (error) {
    console.error('MCP Server Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      ok: false, 
      error: error.message,
      stack: error.stack
    }));
  }
});

server.listen(PORT, () => {
  console.log(`Supabase MCP Server running on port ${PORT}`);
  console.log(`Environment: SUPABASE_URL=${SUPABASE_URL}`);
  console.log(`Available commands: db.reset, db.seed, db.status, db.migrate`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down MCP server...');
  server.close(() => {
    console.log('MCP server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\nShutting down MCP server...');
  server.close(() => {
    console.log('MCP server closed');
    process.exit(0);
  });
});
