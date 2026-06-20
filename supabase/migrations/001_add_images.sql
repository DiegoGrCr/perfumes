-- ============================================================
--  MIGRACIÓN 001: Imágenes de perfumes + Storage bucket
--  Ejecutar en: Supabase > SQL Editor > New Query
-- ============================================================

-- ── 1. Tabla de imágenes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfume_images (
  id            UUID         DEFAULT uuid_generate_v4() PRIMARY KEY,
  perfume_id    UUID         NOT NULL REFERENCES perfumes(id) ON DELETE CASCADE,
  storage_path  TEXT         NOT NULL,
  url           TEXT         NOT NULL,
  is_primary    BOOLEAN      NOT NULL DEFAULT false,
  sort_order    INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_perfume_images_perfume_id ON perfume_images (perfume_id);

-- Solo puede haber una imagen primaria por perfume
CREATE UNIQUE INDEX idx_perfume_images_primary
  ON perfume_images (perfume_id)
  WHERE is_primary = true;

-- RLS para la tabla de imágenes
ALTER TABLE perfume_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública imágenes"
  ON perfume_images FOR SELECT
  USING (true);

CREATE POLICY "Escritura admin imágenes"
  ON perfume_images FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── 2. Storage bucket ─────────────────────────────────────────
-- Crea el bucket público para las fotos de los perfumes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'perfume-images',
  'perfume-images',
  true,
  5242880,                                        -- 5 MB por archivo
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública de los archivos
CREATE POLICY "Lectura pública storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'perfume-images');

-- Solo admin puede subir archivos
CREATE POLICY "Subida admin storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'perfume-images'
    AND auth.role() = 'authenticated'
  );

-- Solo admin puede actualizar archivos
CREATE POLICY "Actualizar admin storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'perfume-images'
    AND auth.role() = 'authenticated'
  );

-- Solo admin puede borrar archivos
CREATE POLICY "Borrar admin storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'perfume-images'
    AND auth.role() = 'authenticated'
  );
