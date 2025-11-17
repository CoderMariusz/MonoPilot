#!/usr/bin/env node
/**
 * Diagnose authentication issue - why 403 still happening?
 */

const PROJECT_REF = 'pgroxddbtaevdegnidaz';
const ACCESS_TOKEN = 'sbp_11f65c1a940eb66ed8084ce71b04bdf026ee1b56';

async function diagnoseAuth() {
  try {
    console.log('🔍 Diagnosing authentication issue...\n');

    // 1. Check if settings_tax_codes table exists and has data
    const checkTableQuery = `
      SELECT COUNT(*) as count FROM settings_tax_codes;
    `;

    console.log('1️⃣ Checking if settings_tax_codes table exists...');
    const tableResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: checkTableQuery })
      }
    );

    if (!tableResponse.ok) {
      console.log('❌ Table check failed:', tableResponse.status);
    } else {
      const result = await tableResponse.json();
      console.log('✅ Table exists, row count:', result[0]?.count);
    }

    // 2. Check table structure (does it have org_id?)
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'settings_tax_codes'
      ORDER BY ordinal_position;
    `;

    console.log('\n2️⃣ Checking table structure...');
    const structureResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: structureQuery })
      }
    );

    if (structureResponse.ok) {
      const columns = await structureResponse.json();
      console.log('📊 Table columns:');
      console.table(columns);

      const hasOrgId = columns.some(col => col.column_name === 'org_id');
      if (hasOrgId) {
        console.log('\n⚠️  WARNING: Table has org_id column!');
        console.log('   RLS policies need to filter by org_id, not just authenticated!');
      }
    }

    // 3. Check current RLS policies
    const policiesQuery = `
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'settings_tax_codes';
    `;

    console.log('\n3️⃣ Checking RLS policies...');
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

    if (policiesResponse.ok) {
      const policies = await policiesResponse.json();
      console.log('🔒 Current policies:');
      console.table(policies);
    }

    // 4. Test direct insert (as service role)
    console.log('\n4️⃣ Testing direct insert as service role...');
    const testInsertQuery = `
      INSERT INTO settings_tax_codes (code, description, rate, is_active)
      VALUES ('TEST_AUTH', 'Auth test code', 0.23, true)
      RETURNING id, code;
    `;

    const insertResponse = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({ query: testInsertQuery })
      }
    );

    if (insertResponse.ok) {
      const result = await insertResponse.json();
      console.log('✅ Service role INSERT works:', result);

      // Clean up test record
      if (result[0]?.id) {
        const deleteQuery = `DELETE FROM settings_tax_codes WHERE id = ${result[0].id};`;
        await fetch(
          `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${ACCESS_TOKEN}`,
            },
            body: JSON.stringify({ query: deleteQuery })
          }
        );
        console.log('   (Test record cleaned up)');
      }
    } else {
      console.log('❌ Service role INSERT failed:', insertResponse.status);
    }

    console.log('\n📋 DIAGNOSIS SUMMARY:');
    console.log('   If table has org_id → RLS policies MUST check org_id');
    console.log('   If service role works → problem is with authenticated user token/session');
    console.log('   Check browser console for auth.uid() value');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

diagnoseAuth();
