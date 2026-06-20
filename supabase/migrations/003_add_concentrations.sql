-- Agregar Body Mist y Body Spray al enum de concentración
ALTER TYPE perfume_concentration ADD VALUE IF NOT EXISTS 'Body Mist';
ALTER TYPE perfume_concentration ADD VALUE IF NOT EXISTS 'Body Spray';
