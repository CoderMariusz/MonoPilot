#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking suppliers table schema...\n');

  const { data: suppliersData, error: suppliersError } = await supabase
    .from('suppliers')
    .select('*')
    .limit(1);

  if (suppliersError) {
    console.log('Error:', suppliersError.message);
  } else {
    console.log('Suppliers columns:', Object.keys(suppliersData[0] || {}));
  }

  console.log('\nChecking warehouses table schema...\n');

  const { data: warehousesData, error: warehousesError } = await supabase
    .from('warehouses')
    .select('*')
    .limit(1);

  if (warehousesError) {
    console.log('Error:', warehousesError.message);
  } else {
    console.log('Warehouses columns:', Object.keys(warehousesData[0] || {}));
  }

  console.log('\nChecking work_orders table schema...\n');

  const { data: woData, error: woError } = await supabase
    .from('work_orders')
    .select('*')
    .limit(1);

  if (woError) {
    console.log('Error:', woError.message);
  } else {
    console.log('Work Orders columns:', Object.keys(woData[0] || {}));
  }

  console.log('\nChecking license_plates table schema...\n');

  const { data: lpData, error: lpError } = await supabase
    .from('license_plates')
    .select('*')
    .limit(1);

  if (lpError) {
    console.log('Error:', lpError.message);
  } else {
    console.log('License Plates columns:', Object.keys(lpData[0] || {}));
  }
}

checkSchema();
