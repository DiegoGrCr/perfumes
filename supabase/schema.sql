-- ============================================================
-- Essence Parfumerie — Supabase Schema
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tipos ENUM ────────────────────────────────────────────────
CREATE TYPE perfume_category AS ENUM ('arabe', 'disenador', 'nicho', 'otros');
CREATE TYPE perfume_gender   AS ENUM ('hombre', 'mujer', 'unisex');
CREATE TYPE perfume_concentration AS ENUM ('Parfum', 'EDP', 'EDT', 'EDC');

-- ── Tabla principal ────────────────────────────────────────────
CREATE TABLE perfumes (
  id                UUID             DEFAULT uuid_generate_v4() PRIMARY KEY,
  name              VARCHAR(255)     NOT NULL,
  brand             VARCHAR(255)     NOT NULL,
  description       TEXT,
  price             DECIMAL(10,2)    NOT NULL CHECK (price >= 0),
  original_price    DECIMAL(10,2)    CHECK (original_price >= 0),
  category          perfume_category NOT NULL,
  gender            perfume_gender   NOT NULL,
  concentration     perfume_concentration,
  volume_ml         INTEGER          DEFAULT 100,
  available_volumes INTEGER[]        DEFAULT '{100}',
  notes_top         TEXT[]           DEFAULT '{}',
  notes_heart       TEXT[]           DEFAULT '{}',
  notes_base        TEXT[]           DEFAULT '{}',
  image_url         TEXT,
  in_stock          BOOLEAN          NOT NULL DEFAULT true,
  featured          BOOLEAN          NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX idx_perfumes_category  ON perfumes (category);
CREATE INDEX idx_perfumes_gender    ON perfumes (gender);
CREATE INDEX idx_perfumes_price     ON perfumes (price);
CREATE INDEX idx_perfumes_featured  ON perfumes (featured) WHERE featured = true;
CREATE INDEX idx_perfumes_in_stock  ON perfumes (in_stock) WHERE in_stock = true;

-- Búsqueda de texto completo en español
CREATE INDEX idx_perfumes_fts ON perfumes USING GIN (
  to_tsvector('spanish',
    COALESCE(name, '') || ' ' ||
    COALESCE(brand, '') || ' ' ||
    COALESCE(description, '')
  )
);

-- ── Trigger: updated_at automático ───────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER perfumes_set_updated_at
  BEFORE UPDATE ON perfumes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE perfumes ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el catálogo es visible para todos)
CREATE POLICY "Lectura pública"
  ON perfumes FOR SELECT
  USING (true);

-- Escritura solo para usuarios autenticados (admin)
CREATE POLICY "Escritura admin"
  ON perfumes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── Datos de prueba ───────────────────────────────────────────
INSERT INTO perfumes
  (name, brand, description, price, original_price, category, gender,
   concentration, volume_ml, available_volumes,
   notes_top, notes_heart, notes_base, in_stock, featured)
VALUES

-- ÁRABES -------------------------------------------------------
(
  'Ameer Al Oudh', 'Lattafa',
  'Una fragancia oriental profunda con notas de oud, especias y madera de sándalo. Perfecta para ocasiones especiales, su sillage majestuoso perdura horas en la piel.',
  45.00, NULL, 'arabe', 'hombre', 'EDP', 100, '{50,100}',
  '{"Bergamota","Cardamomo"}', '{"Oud","Rosa"}', '{"Sándalo","Almizcle","Ámbar"}',
  true, true
),
(
  'Shaghaf Oud Aswad', 'Swiss Arabian',
  'Una composición audaz y oscura que combina oud ahumado con especias orientales y maderas preciosas. Intensidad y sofisticación en cada nota.',
  65.00, 80.00, 'arabe', 'hombre', 'EDP', 100, '{100}',
  '{"Azafrán","Rosa Negra"}', '{"Oud Negro","Pachulí"}', '{"Ámbar","Sándalo","Almizcle"}',
  true, true
),
(
  'La Yuqawam', 'Rasasi',
  'Una fragancia unisex que equilibra flores exóticas con maderas cálidas y oud suave. Elegancia oriental accesible con longevidad excepcional.',
  55.00, NULL, 'arabe', 'unisex', 'EDP', 100, '{50,100,200}',
  '{"Neroli","Bergamota"}', '{"Oud","Rosa","Jazmín"}', '{"Sándalo","Cedro","Vetiver"}',
  true, false
),
(
  'Yara Moi', 'Lattafa',
  'Fragancia femenina dulce y cautivadora con flores blancas y vainilla cremosa sobre base almizclada. Un abrazo en forma de perfume.',
  40.00, NULL, 'arabe', 'mujer', 'EDP', 100, '{100}',
  '{"Pera","Bergamota","Fresia"}', '{"Jazmín","Rosa","Lila"}', '{"Vainilla","Almizcle Blanco","Pachulí"}',
  true, false
),
(
  'Oud For Glory', 'Ard Al Zaafaran',
  'Una oda al oud con capas de especias cálidas, resinas preciosas y maderas nobles. Longevidad excepcional, proyección imponente.',
  35.00, 50.00, 'arabe', 'unisex', 'Parfum', 100, '{100}',
  '{"Azafrán","Canela"}', '{"Oud Puro","Sándalo"}', '{"Ámbar Gris","Resina","Almizcle"}',
  false, false
),

-- DISEÑADOR ----------------------------------------------------
(
  'Bleu de Chanel', 'Chanel',
  'Una oda al hombre libre. Aromática y fresca con madera y tonos cítricos vibrantes. El clásico moderno por excelencia, atemporal y elegante.',
  125.00, NULL, 'disenador', 'hombre', 'EDP', 100, '{50,100,150}',
  '{"Limón","Pomelo","Menta"}', '{"Jazmín","Jengibre","Nuez Moscada"}', '{"Sándalo","Cedro","Vetiver"}',
  true, true
),
(
  'Sauvage', 'Dior',
  'Salvaje y noble. Bergamota de Calabria y Ambroxan mineral evocan el desierto en hora azul. La fragancia masculina más vendida del mundo.',
  140.00, NULL, 'disenador', 'hombre', 'EDP', 100, '{60,100,200}',
  '{"Bergamota de Calabria","Pimienta"}', '{"Lavanda Sichuan","Geranio"}', '{"Ambroxan","Cedro de Virginia"}',
  true, true
),
(
  'Black Opium', 'Yves Saint Laurent',
  'Glamour oscuro y adictivo. Café negro, flores blancas y vainilla en una composición audaz que redefine la feminidad contemporánea.',
  115.00, NULL, 'disenador', 'mujer', 'EDP', 90, '{30,50,90}',
  '{"Pera","Grosella Negra","Flor de Naranjo"}', '{"Café","Jazmín","Almendro Amargo"}', '{"Vainilla","Pachulí","Cedro"}',
  true, true
),
(
  'La Vie Est Belle', 'Lancôme',
  'La felicidad como elección. Un bouquet de iris, pralinado y vainilla que revolucionó la perfumería femenina. Icónico e inconfundible.',
  110.00, 130.00, 'disenador', 'mujer', 'EDP', 100, '{30,50,75,100}',
  '{"Grosella Negra","Pera"}', '{"Iris","Jazmín","Flor de Naranjo"}', '{"Praliné","Vainilla","Pachulí","Tonka"}',
  true, false
),
(
  'Acqua di Giò', 'Giorgio Armani',
  'El Mediterráneo en un frasco. Frescura marina, notas acuáticas y madera blanca. La fragancia masculina más icónica desde 1996.',
  95.00, NULL, 'disenador', 'hombre', 'EDP', 100, '{40,75,100}',
  '{"Bergamota","Mandarina","Lima"}', '{"Mar","Romero","Vetiver"}', '{"Pachulí","Musgo Marino","Almizcle"}',
  true, false
),

-- NICHO --------------------------------------------------------
(
  'Replica Jazz Club', 'Maison Margiela',
  'Cierra los ojos y estás ahí. Ron, tabaco, vetiver y almizcle evocan una noche de jazz en Nueva Orleans. Experiencia más que fragancia.',
  190.00, NULL, 'nicho', 'unisex', 'EDT', 100, '{30,100}',
  '{"Bergamota","Anís"}', '{"Ron de Jamaica","Tabaco","Vetiver"}', '{"Vainilla de Madagascar","Almizcle Blanco"}',
  true, true
),
(
  'Bal d''Afrique', 'Byredo',
  'Energía y libertad africana. Bergamota, neroli, violeta y cálamo aromático en una sinfonía alegre y sofisticada. Arte en estado gaseoso.',
  235.00, NULL, 'nicho', 'unisex', 'EDP', 100, '{50,100}',
  '{"Bergamota Africana","Neroli"}', '{"Violeta","Jazmín Africano","Cálamo"}', '{"Cedro","Vetiver","Almizcle Blanco"}',
  true, false
),
(
  'Santal 33', 'Le Labo',
  'Sándalo australiano, cedro, cardamomo y cuero. La fragancia de culto que redefinió la perfumería de nicho. Adictiva, imposible de ignorar.',
  275.00, NULL, 'nicho', 'unisex', 'EDP', 100, '{50,100}',
  '{"Cardamomo","Iris","Violeta"}', '{"Sándalo Australiano","Cedro de Virginia","Ambrette"}', '{"Cuero","Cashmere Wood","Almizcle"}',
  true, true
),
(
  'Oud for Greatness', 'Initio Parfums',
  'La máxima expresión del oud. Oud laotiano, azafrán y ámbar gris. Para quienes no aceptan límites. La grandeza tiene un aroma.',
  395.00, NULL, 'nicho', 'unisex', 'EDP', 90, '{90}',
  '{"Azafrán","Bergamota"}', '{"Oud Laotiano","Sándalo"}', '{"Ámbar Gris","Almizcle Animal"}',
  true, true
),

-- OTROS --------------------------------------------------------
(
  'Wonder Rose', 'Zara',
  'Elegancia accesible. Rosa fresca, peonía y almizcle en una fragancia cotidiana perfecta para la mujer moderna. Sencilla y encantadora.',
  18.00, NULL, 'otros', 'mujer', 'EDT', 80, '{80}',
  '{"Rosa","Bergamota"}', '{"Peonía","Jazmín"}', '{"Almizcle Blanco","Cedro"}',
  true, false
),
(
  'Chrome', 'Azzaro',
  'Energía urbana y modernidad. Notas acuáticas, especiadas y amaderadas para el hombre dinámico del siglo XXI. Clásico y versátil.',
  55.00, 70.00, 'otros', 'hombre', 'EDT', 100, '{30,50,100,200}',
  '{"Bergamota","Anís","Neroli"}', '{"Cardamomo","Cuero","Mimosa"}', '{"Cedro del Himalaya","Sándalo","Almizcle"}',
  true, false
);

-- ── Vista útil para el catálogo ───────────────────────────────
CREATE OR REPLACE VIEW catalog_view AS
SELECT
  id, name, brand, description,
  price, original_price,
  ROUND((1 - price / NULLIF(original_price, 0)) * 100) AS discount_pct,
  category, gender, concentration,
  volume_ml, available_volumes,
  notes_top, notes_heart, notes_base,
  image_url, in_stock, featured, created_at
FROM perfumes
ORDER BY featured DESC, created_at DESC;
