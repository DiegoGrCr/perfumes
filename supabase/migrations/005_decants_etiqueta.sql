-- Decant label: optional short name for the label + liquid colour.
-- label NULL → the store prints the perfume's cleaned name automatically.
-- liquid_color NULL → colour detected from the product photo (or golden amber).
ALTER TABLE public.decants
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS liquid_color text;

ALTER TABLE public.decants
  DROP CONSTRAINT IF EXISTS decants_liquid_color_hex;
ALTER TABLE public.decants
  ADD CONSTRAINT decants_liquid_color_hex CHECK (liquid_color IS NULL OR liquid_color ~* '^#[0-9a-f]{6}$');

NOTIFY pgrst, 'reload schema';
