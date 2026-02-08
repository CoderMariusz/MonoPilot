-- Migration: Fix customers RLS policies to use get_my_org_id()
-- Problem: RLS policies for customers tables use subquery to users table,
--          which can cause recursion issues or performance problems
-- Solution: Use public.get_my_org_id() SECURITY DEFINER function
-- Date: 2026-02-08

-- ============================================================================
-- STEP 1: Fix customers table RLS policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "customers_select_org" ON customers;
DROP POLICY IF EXISTS "customers_insert_org" ON customers;
DROP POLICY IF EXISTS "customers_update_org" ON customers;
DROP POLICY IF EXISTS "customers_delete_org" ON customers;

-- Ensure RLS is enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- SELECT: Any authenticated user in same org can read customers
CREATE POLICY "customers_select_org" ON customers
FOR SELECT TO authenticated
USING (org_id = public.get_my_org_id());

-- INSERT: Roles that can create customers
CREATE POLICY "customers_insert_org" ON customers
FOR INSERT TO authenticated
WITH CHECK (
  org_id = public.get_my_org_id()
);

-- UPDATE: Roles that can update customers
CREATE POLICY "customers_update_org" ON customers
FOR UPDATE TO authenticated
USING (org_id = public.get_my_org_id())
WITH CHECK (org_id = public.get_my_org_id());

-- DELETE: Roles that can delete customers
CREATE POLICY "customers_delete_org" ON customers
FOR DELETE TO authenticated
USING (org_id = public.get_my_org_id());

-- ============================================================================
-- STEP 2: Fix customer_contacts table RLS policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "customer_contacts_select_org" ON customer_contacts;
DROP POLICY IF EXISTS "customer_contacts_insert_org" ON customer_contacts;
DROP POLICY IF EXISTS "customer_contacts_update_org" ON customer_contacts;
DROP POLICY IF EXISTS "customer_contacts_delete_org" ON customer_contacts;

-- Ensure RLS is enabled
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;

-- SELECT: Any authenticated user in same org can read contacts
CREATE POLICY "customer_contacts_select_org" ON customer_contacts
FOR SELECT TO authenticated
USING (org_id = public.get_my_org_id());

-- INSERT: Any authenticated user in same org can create contacts
CREATE POLICY "customer_contacts_insert_org" ON customer_contacts
FOR INSERT TO authenticated
WITH CHECK (org_id = public.get_my_org_id());

-- UPDATE: Any authenticated user in same org can update contacts
CREATE POLICY "customer_contacts_update_org" ON customer_contacts
FOR UPDATE TO authenticated
USING (org_id = public.get_my_org_id())
WITH CHECK (org_id = public.get_my_org_id());

-- DELETE: Any authenticated user in same org can delete contacts
CREATE POLICY "customer_contacts_delete_org" ON customer_contacts
FOR DELETE TO authenticated
USING (org_id = public.get_my_org_id());

-- ============================================================================
-- STEP 3: Fix customer_addresses table RLS policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "customer_addresses_select_org" ON customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_insert_org" ON customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_update_org" ON customer_addresses;
DROP POLICY IF EXISTS "customer_addresses_delete_org" ON customer_addresses;

-- Ensure RLS is enabled
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- SELECT: Any authenticated user in same org can read addresses
CREATE POLICY "customer_addresses_select_org" ON customer_addresses
FOR SELECT TO authenticated
USING (org_id = public.get_my_org_id());

-- INSERT: Any authenticated user in same org can create addresses
CREATE POLICY "customer_addresses_insert_org" ON customer_addresses
FOR INSERT TO authenticated
WITH CHECK (org_id = public.get_my_org_id());

-- UPDATE: Any authenticated user in same org can update addresses
CREATE POLICY "customer_addresses_update_org" ON customer_addresses
FOR UPDATE TO authenticated
USING (org_id = public.get_my_org_id())
WITH CHECK (org_id = public.get_my_org_id());

-- DELETE: Any authenticated user in same org can delete addresses
CREATE POLICY "customer_addresses_delete_org" ON customer_addresses
FOR DELETE TO authenticated
USING (org_id = public.get_my_org_id());

-- ============================================================================
-- STEP 4: Ensure GRANT permissions
-- ============================================================================

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_addresses TO authenticated;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'customers';

  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Customers RLS policies fixed! Using get_my_org_id() function.';
  ELSE
    RAISE WARNING '⚠️ Expected 4 policies on customers, found %', policy_count;
  END IF;
END $$;
