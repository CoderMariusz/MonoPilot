-- Ensure products RLS includes DG in type filters
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND polname='products_read'
  ) THEN
    DROP POLICY products_read ON public.products;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='products' AND polname='products_write'
  ) THEN
    DROP POLICY products_write ON public.products;
  END IF;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

CREATE POLICY products_read ON public.products
  FOR SELECT USING (
    auth.role() = 'authenticated' AND type IN ('RM','DG','PR','FG','WIP')
  );

CREATE POLICY products_write ON public.products
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND type IN ('RM','DG','PR','FG','WIP')
  );


