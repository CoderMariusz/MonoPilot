#!/usr/bin/env node
/**
 * Verify RLS policies for all Settings tables in PRODUCTION
 */

const PROJECT_REF = 'pgroxddbtaevdegnidaz';
const ACCESS_TOKEN = 'sbp_11f65c1a940eb66ed8084ce71b04bdf026ee1b56';

const SETTINGS_TABLES = [
  'warehouses',
  'locations',
  'settings_tax_codes',
  'allergens',
  'machines',
  'production_lines',
  'suppliers',
  'routing_operation_names'
];

async function verifyPolicies() {
  try {
    console.log('🔍 Verifying RLS policies for all Settings tables in PRODUCTION...\n');

    for (const tableName of SETTINGS_TABLES) {
      // Check if RLS is enabled
      const rlsQuery = `
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = '${tableName}';
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
        throw new Error(`Failed to check RLS for ${tableName}: ${rlsResponse.status}`);
      }

      const rlsResult = await rlsResponse.json();

      // Check policies
      const policiesQuery = `
        SELECT policyname, cmd
        FROM pg_policies
        WHERE tablename = '${tableName}';
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
        throw new Error(`Failed to fetch policies for ${tableName}: ${policiesResponse.status}`);
      }

      const policiesResult = await policiesResponse.json();

      const hasRLS = rlsResult[0]?.rowsecurity;
      const policyCount = policiesResult.length;

      if (hasRLS && policyCount > 0) {
        console.log(`✅ ${tableName.padEnd(30)} RLS: ${hasRLS ? 'ON' : 'OFF'}, Policies: ${policyCount}`);
      } else if (hasRLS && policyCount === 0) {
        console.log(`❌ ${tableName.padEnd(30)} RLS: ON, Policies: 0 (BLOCKED!)`);
      } else {
        console.log(`⚠️  ${tableName.padEnd(30)} RLS: OFF, Policies: ${policyCount}`);
      }
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyPolicies();
