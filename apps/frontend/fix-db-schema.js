const { Client } = require('pg')

// Supabase connection - direct to database host
const connectionString = 'postgres://postgres:MA2025ma%21%21%21@db.pgroxddbtaevdegnidaz.supabase.co:5432/postgres'

async function fixSchema() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } })

  try {
    console.log('Connecting to Supabase database...')
    await client.connect()
    console.log('Connected!')

    // First, check current columns in bom_items
    console.log('\n--- Current bom_items columns ---')
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bom_items'
      ORDER BY ordinal_position;
    `)
    console.table(columnsResult.rows)

    // Check if is_by_product exists
    const hasByProduct = columnsResult.rows.some(r => r.column_name === 'is_by_product')
    const hasIsOutput = columnsResult.rows.some(r => r.column_name === 'is_output')
    const hasConsumeWholeLp = columnsResult.rows.some(r => r.column_name === 'consume_whole_lp')

    console.log('\n--- Column status ---')
    console.log('has is_by_product:', hasByProduct)
    console.log('has is_output:', hasIsOutput)
    console.log('has consume_whole_lp:', hasConsumeWholeLp)

    // Fix: Rename is_by_product to is_output if needed
    if (hasByProduct && !hasIsOutput) {
      console.log('\n--- Renaming is_by_product to is_output ---')
      await client.query(`ALTER TABLE bom_items RENAME COLUMN is_by_product TO is_output;`)
      console.log('Column renamed successfully!')
    } else if (hasIsOutput) {
      console.log('\n✓ is_output column already exists')
    } else if (!hasByProduct && !hasIsOutput) {
      console.log('\n--- Adding is_output column ---')
      await client.query(`ALTER TABLE bom_items ADD COLUMN is_output BOOLEAN DEFAULT false;`)
      console.log('Column added successfully!')
    }

    // Fix: Add consume_whole_lp if not exists
    if (!hasConsumeWholeLp) {
      console.log('\n--- Adding consume_whole_lp column ---')
      await client.query(`ALTER TABLE bom_items ADD COLUMN consume_whole_lp BOOLEAN DEFAULT false;`)
      console.log('Column added successfully!')
    } else {
      console.log('\n✓ consume_whole_lp column already exists')
    }

    // Reload PostgREST schema cache
    console.log('\n--- Reloading PostgREST schema cache ---')
    await client.query(`NOTIFY pgrst, 'reload schema';`)
    console.log('Schema cache reload notified!')

    // Verify final state
    console.log('\n--- Final bom_items columns ---')
    const finalResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'bom_items'
      ORDER BY ordinal_position;
    `)
    console.table(finalResult.rows)

    console.log('\n✅ Schema fix completed!')

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await client.end()
    console.log('\nConnection closed.')
  }
}

fixSchema()
