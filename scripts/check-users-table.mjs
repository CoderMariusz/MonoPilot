#!/usr/bin/env node
/**
 * Check users table structure and RLS policies in PRODUCTION
 */

const PROJECT_REF = 'pgroxddbtaevdegnidaz';
const ACCESS_TOKEN = 'sbp_11f65c1a940eb66ed8084ce71b04bdf026ee1b56';

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure in PRODUCTION...\n');

    // Check table columns
    const columnsQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position;
    `;

    const columnsResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: columnsQuery })
      }
    );

    if (!columnsResponse.ok) {
      throw new Error(`Failed to fetch columns: ${columnsResponse.status}`);
    }

    const columnsResult = await columnsResponse.json();
    console.log('📊 Users table columns:');
    console.table(columnsResult);

    // Check RLS policies
    const policiesQuery = `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'users';
    `;

    const policiesResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: policiesQuery })
      }
    );

    if (!policiesResponse.ok) {
      throw new Error(`Failed to fetch policies: ${policiesResponse.status}`);
    }

    const policiesResult = await policiesResponse.json();
    console.log('\n🔒 RLS Policies on users table:');
    console.table(policiesResult);

    // Check if RLS is enabled
    const rlsQuery = `
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'users';
    `;

    const rlsResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: rlsQuery })
      }
    );

    if (!rlsResponse.ok) {
      throw new Error(`Failed to check RLS: ${rlsResponse.status}`);
    }

    const rlsResult = await rlsResponse.json();
    console.log('\n🛡️  RLS Status:');
    console.table(rlsResult);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersTable();
