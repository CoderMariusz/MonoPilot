// Seed script for Epic 3 Batch 3A - Suppliers and Tax Codes
// Creates sample tax codes and suppliers for testing

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seed() {
  console.log('🌱 Seeding Epic 3A data: Tax Codes and Suppliers...\n');

  // Get first organization and user
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .limit(1)
    .single();

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .single();

  if (!org || !user) {
    console.error('❌ No organization or user found');
    process.exit(1);
  }

  const orgId = org.id;
  const userId = user.id;

  console.log(`📦 Using org_id: ${orgId}`);
  console.log(`👤 Using user_id: ${userId}\n`);

  // ============================================================================
  // 1. Insert Tax Codes
  // ============================================================================
  console.log('📝 Inserting tax codes...');

  const taxCodes = [
    {
      org_id: orgId,
      code: 'VAT23',
      description: 'VAT 23% - Standard rate',
      rate: 23.00,
    },
    {
      org_id: orgId,
      code: 'VAT8',
      description: 'VAT 8% - Reduced rate',
      rate: 8.00,
    },
    {
      org_id: orgId,
      code: 'VAT0',
      description: 'VAT 0% - Zero rated',
      rate: 0.00,
    },
    {
      org_id: orgId,
      code: 'EXEMPT',
      description: 'VAT Exempt',
      rate: 0.00,
    },
  ];

  const { data: insertedTaxCodes, error: taxError } = await supabase
    .from('tax_codes')
    .insert(taxCodes)
    .select();

  let finalTaxCodes = insertedTaxCodes;

  if (taxError) {
    console.error('❌ Error inserting tax codes:', taxError.message);

    // Try to get existing tax codes
    const { data: existingTaxCodes } = await supabase
      .from('tax_codes')
      .select('*')
      .eq('org_id', orgId);

    if (existingTaxCodes && existingTaxCodes.length > 0) {
      console.log(`✅ Using ${existingTaxCodes.length} existing tax codes`);
      finalTaxCodes = existingTaxCodes;
    } else {
      process.exit(1);
    }
  } else {
    console.log(`✅ Inserted ${insertedTaxCodes.length} tax codes`);
  }

  // Get VAT23 tax code ID for suppliers
  const vat23 = finalTaxCodes?.find(tc => tc.code === 'VAT23');
  const vat8 = finalTaxCodes?.find(tc => tc.code === 'VAT8');

  if (!vat23 || !vat8) {
    console.error('❌ VAT23 or VAT8 tax code not found');
    process.exit(1);
  }

  // ============================================================================
  // 2. Insert Suppliers
  // ============================================================================
  console.log('\n🏢 Inserting suppliers...');

  const suppliers = [
    {
      org_id: orgId,
      code: 'SUP-001',
      name: 'ABC Ingredients Ltd.',
      currency: 'PLN',
      tax_code_id: vat23.id,
      payment_terms: 'Net 30',
      lead_time_days: 7,
      contact_person: 'Jan Kowalski',
      email: 'jan.kowalski@abc-ingredients.pl',
      phone: '+48 22 123 4567',
      address: 'ul. Przemysłowa 15',
      city: 'Warszawa',
      postal_code: '01-234',
      country: 'Poland',
      is_active: true,
      created_by: userId,
      updated_by: userId,
    },
    {
      org_id: orgId,
      code: 'SUP-002',
      name: 'Euro Packaging GmbH',
      currency: 'EUR',
      tax_code_id: vat23.id,
      payment_terms: 'Net 60',
      lead_time_days: 14,
      contact_person: 'Hans Mueller',
      email: 'h.mueller@europack.de',
      phone: '+49 30 987 6543',
      address: 'Industriestraße 42',
      city: 'Berlin',
      postal_code: '10115',
      country: 'Germany',
      is_active: true,
      created_by: userId,
      updated_by: userId,
    },
    {
      org_id: orgId,
      code: 'SUP-003',
      name: 'Global Flavors Inc.',
      currency: 'USD',
      tax_code_id: vat8.id,
      payment_terms: 'Net 45',
      lead_time_days: 21,
      contact_person: 'John Smith',
      email: 'j.smith@globalflavors.com',
      phone: '+1 555 123 4567',
      address: '123 Business Ave',
      city: 'New York',
      postal_code: '10001',
      country: 'USA',
      is_active: true,
      created_by: userId,
      updated_by: userId,
    },
    {
      org_id: orgId,
      code: 'SUP-004',
      name: 'UK Organic Supplies',
      currency: 'GBP',
      tax_code_id: vat23.id,
      payment_terms: 'Net 30',
      lead_time_days: 10,
      contact_person: 'Emma Watson',
      email: 'e.watson@ukorganic.co.uk',
      phone: '+44 20 7123 4567',
      address: '56 Market Street',
      city: 'London',
      postal_code: 'SW1A 1AA',
      country: 'United Kingdom',
      is_active: true,
      created_by: userId,
      updated_by: userId,
    },
  ];

  const { data: insertedSuppliers, error: supplierError } = await supabase
    .from('suppliers')
    .insert(suppliers)
    .select();

  if (supplierError) {
    console.error('❌ Error inserting suppliers:', supplierError.message);
    process.exit(1);
  }

  console.log(`✅ Inserted ${insertedSuppliers.length} suppliers`);

  // ============================================================================
  // 3. Summary
  // ============================================================================
  console.log('\n✅ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Tax Codes: ${finalTaxCodes?.length || 0}`);
  console.log(`   - Suppliers: ${insertedSuppliers.length}`);
  console.log('\n🎉 Epic 3 Batch 3A foundation data is ready for testing!');
}

seed().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
