-- Agregar campos de perfil olfativo y recomendaciones
ALTER TABLE perfumes
  ADD COLUMN IF NOT EXISTS scent_type text,
  ADD COLUMN IF NOT EXISTS seasons    text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS occasions  text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS longevity  text,
  ADD COLUMN IF NOT EXISTS sillage    text;
