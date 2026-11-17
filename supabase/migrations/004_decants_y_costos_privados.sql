-- ══════════════════════════════════════════════════════════════════
-- 004 · Decants (5 y 10 ml) + costos de adquisición privados
--
-- Cómo correrlo: Supabase → SQL Editor → New query → pega todo → Run.
-- IMPORTANTE: córrelo DESPUÉS de publicar la versión de la página que
-- ya pide columnas explícitas (si no, la tienda deja de cargar).
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Decants ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.decants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perfume_id  uuid NOT NULL REFERENCES public.perfumes(id) ON DELETE CASCADE,
  volume_ml   int  NOT NULL CHECK (volume_ml IN (5, 10)),
  price       numeric(10,2) NOT NULL CHECK (price > 0),   -- precio final al público
  in_stock    boolean NOT NULL DEFAULT true,
  active      boolean NOT NULL DEFAULT true,               -- false = oculto en la tienda
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (perfume_id, volume_ml)
);

CREATE INDEX IF NOT EXISTS idx_decants_perfume ON public.decants (perfume_id);

ALTER TABLE public.decants ENABLE ROW LEVEL SECURITY;

-- Lectura pública (la tienda muestra precios), escritura solo admin
DROP POLICY IF EXISTS "Lectura pública decants" ON public.decants;
CREATE POLICY "Lectura pública decants"
  ON public.decants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Escritura admin decants" ON public.decants;
CREATE POLICY "Escritura admin decants"
  ON public.decants FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── 2. Costo de adquisición: solo para el admin ───────────────────
-- Antes, cualquier visitante podía leer cost_price con la llave pública.
-- Los visitantes (rol anon) ahora solo pueden leer estas columnas;
-- el admin (rol authenticated) sigue viendo todo.
REVOKE SELECT ON public.perfumes FROM anon;
GRANT SELECT (
  id, name, brand, description, price, original_price, category, gender,
  concentration, volume_ml, available_volumes, notes_top, notes_heart, notes_base,
  image_url, in_stock, featured, created_at, updated_at, scent_type, seasons,
  occasions, longevity, sillage, stock_quantity
) ON public.perfumes TO anon;

-- Nota: si en el futuro agregas una columna pública a perfumes,
-- agrégala también a este GRANT (o la tienda no podrá leerla).
