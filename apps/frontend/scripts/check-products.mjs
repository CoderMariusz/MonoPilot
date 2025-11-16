#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  console.log('Checking products in database...\n');

  const { data: products, error } = await supabase
    .from('products')
    .select('part_number, description, supplier_id, is_active')
    .limit(5);

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log(`Found ${products?.length || 0} products:`);
    products?.forEach(p => {
      console.log(`  - ${p.part_number}: ${p.description} (supplier: ${p.supplier_id}, active: ${p.is_active})`);
    });
  }
}

checkProducts();
