import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function setupPOTestData() {
  try {
    const testOrgId = randomUUID()
    const testUserId = randomUUID()
    const testWarehouseId = randomUUID()
    const testSupplierId = randomUUID()
    const testTaxCodeId = randomUUID()

    console.log('Creating test organization...')
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .insert({ id: testOrgId, company_name: `Test-PO-${Date.now()}` })
      .select()
    if (orgErr) throw orgErr
    console.log('✓ Organization created')

    console.log('Creating test user...')
    const { data: user, error: userErr } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        org_id: testOrgId,
        email: `po-test-${Date.now()}@test.com`,
        role: 'admin',
        status: 'active',
      })
      .select()
    if (userErr) throw userErr
    console.log('✓ User created')

    console.log('Creating test warehouse...')
    const { data: warehouse, error: whErr } = await supabase
      .from('warehouses')
      .insert({
        id: testWarehouseId,
        org_id: testOrgId,
        code: `WH-PO-TEST-${Date.now()}`,
        name: 'Test Warehouse',
        is_active: true,
      })
      .select()
    if (whErr) throw whErr
    console.log('✓ Warehouse created')

    console.log('Creating test tax code...')
    const { data: taxCode, error: taxErr } = await supabase
      .from('tax_codes')
      .insert({
        id: testTaxCodeId,
        org_id: testOrgId,
        code: `TAX-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        description: 'Test Tax Code',
        rate: 8,
      })
      .select()
    if (taxErr) throw taxErr
    console.log('✓ Tax code created')

    console.log('Creating test supplier...')
    const { data: supplier, error: supErr } = await supabase
      .from('suppliers')
      .insert({
        id: testSupplierId,
        org_id: testOrgId,
        code: `SUP-TEST-${Math.floor(Math.random() * 9999)}`,
        name: 'Test Supplier Inc',
        currency: 'USD',
        tax_code_id: testTaxCodeId,
        payment_terms: 'NET30',
        is_active: true,
        created_by: testUserId,
        updated_by: testUserId,
      })
      .select()
    if (supErr) throw supErr
    console.log('✓ Supplier created')

    console.log('\n✅ Test setup complete!\n')
    console.log('Test IDs:')
    console.log(`  ORG_ID: ${testOrgId}`)
    console.log(`  USER_ID: ${testUserId}`)
    console.log(`  WAREHOUSE_ID: ${testWarehouseId}`)
    console.log(`  SUPPLIER_ID: ${testSupplierId}`)
    console.log(`  TAX_CODE_ID: ${testTaxCodeId}`)
  } catch (error) {
    console.error('Setup failed:', error.message)
    process.exit(1)
  }
}

setupPOTestData()
