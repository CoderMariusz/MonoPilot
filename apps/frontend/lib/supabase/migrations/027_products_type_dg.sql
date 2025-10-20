-- Add DG to products.type CHECK, sanitize data, and fix sequence (idempotent)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.products'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%CHECK%type%IN%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', cname);
  END IF;

  ALTER TABLE public.products
    ADD CONSTRAINT products_type_check
    CHECK (type IN ('RM','DG','PR','FG','WIP'));
END $$;

-- Sanity of existing data
UPDATE public.products
SET type = 'DG'
WHERE product_group = 'DRYGOODS' AND type <> 'DG';

UPDATE public.products
SET type = 'RM'
WHERE product_group = 'MEAT' AND type <> 'RM';

-- Optional: repair sequence to avoid 23505 on id
SELECT setval(
  pg_get_serial_sequence('public.products','id'),
  COALESCE((SELECT MAX(id) FROM public.products), 0) + 1,
  false
);

-- Ensure boms table exists (plural) and FK in bom_items points to boms(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='boms'
  ) THEN
    CREATE TABLE public.boms (
      id serial PRIMARY KEY,
      product_id int NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
      version text NOT NULL DEFAULT '1.0',
      status text NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Ensure FK for bom_items -> boms(id) and sequence NOT NULL
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='bom_items' AND column_name='sequence' AND is_nullable='NO'
  ) THEN
    ALTER TABLE public.bom_items ALTER COLUMN sequence SET NOT NULL;
  END IF;

  -- Recreate FK if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema='public' AND tc.table_name='bom_items' AND tc.constraint_type='FOREIGN KEY'
      AND kcu.column_name='bom_id'
  ) THEN
    ALTER TABLE public.bom_items
    ADD CONSTRAINT bom_items_bom_id_fkey FOREIGN KEY (bom_id) REFERENCES public.boms(id) ON DELETE CASCADE;
  END IF;
END $$;

-- RLS policy update to include DG where filtering by type
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT polname FROM pg_policies WHERE schemaname='public' AND tablename='products'
  LOOP
    -- No-op block; explicit policies are defined in separate files. This block is a placeholder to mark migration ordering.
    -- Ensure downstream policy files include DG in type sets.
    RETURN; 
  END LOOP;
END $$;

-- Helpful indexes
CREATE UNIQUE INDEX IF NOT EXISTS products_part_number_unique ON public.products(part_number);
CREATE INDEX IF NOT EXISTS products_type_idx ON public.products(type);
CREATE INDEX IF NOT EXISTS products_group_type_idx ON public.products(product_group, product_type);


