import pg from 'pg'
const { Client } = pg

// Construct database URL from env
const dbUrl = `postgresql://postgres.pgroxddbtaevdegnidaz:${process.env.DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

const migrationSQL = `
-- Migration 010: Create allergens table
CREATE TABLE IF NOT EXISTS allergens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_major BOOLEAN NOT NULL DEFAULT false,
    is_custom BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_allergens_org_code UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS idx_allergens_org_id ON allergens(org_id);
CREATE INDEX IF NOT EXISTS idx_allergens_flags ON allergens(org_id, is_major, is_custom);
CREATE INDEX IF NOT EXISTS idx_allergens_code ON allergens(org_id, code);

ALTER TABLE allergens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'allergens'
        AND policyname = 'allergens_org_isolation'
    ) THEN
        CREATE POLICY allergens_org_isolation ON allergens
            FOR ALL
            USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
    END IF;
END$$;

COMMENT ON TABLE allergens IS 'Master data table for allergen library - 14 EU major allergens + custom allergens per organization';
COMMENT ON COLUMN allergens.code IS 'Unique allergen code per org (e.g., MILK, EGGS, CUSTOM-01)';
COMMENT ON COLUMN allergens.name IS 'Display name of allergen (e.g., "Milk", "Eggs")';
COMMENT ON COLUMN allergens.is_major IS 'True for 14 EU major allergens (Regulation EU 1169/2011)';
COMMENT ON COLUMN allergens.is_custom IS 'False for preloaded EU allergens, true for user-added custom allergens';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'set_allergens_updated_at'
    ) THEN
        CREATE TRIGGER set_allergens_updated_at
            BEFORE UPDATE ON allergens
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;

GRANT SELECT ON allergens TO authenticated;
GRANT INSERT, UPDATE, DELETE ON allergens TO authenticated;
`

async function runMigration() {
  console.log('🚀 Running Migration 010: Create Allergens Table')
  console.log('=' .repeat(60))

  if (!process.env.DB_PASSWORD) {
    console.error('❌ DB_PASSWORD environment variable not set')
    console.error('Please check apps/frontend/.env.local for DATABASE_URL or DB_PASSWORD')
    process.exit(1)
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    await client.query(migrationSQL)
    console.log('✅ Migration executed successfully')

    // Verify table
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'allergens'
      ORDER BY ordinal_position
    `)

    console.log('\n📋 Table structure:')
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`)
    })

    console.log('\n✅ Migration 010 complete!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration()
