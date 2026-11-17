/**
 * Columns the public storefront may read from `perfumes`.
 * cost_price (acquisition cost) is intentionally NOT here: visitors (anon role)
 * are not allowed to read it — see supabase/migrations/004_decants_y_costos_privados.sql.
 * Keep this list in sync with the GRANT in that migration.
 * (Written as literal strings so supabase-js can type the result.)
 */

/** Public perfume row + its photos (the usual storefront select). */
export const PUBLIC_PERFUME_SELECT =
  'id, name, brand, description, price, original_price, category, gender, concentration, volume_ml, available_volumes, notes_top, notes_heart, notes_base, image_url, in_stock, featured, created_at, updated_at, scent_type, seasons, occasions, longevity, sillage, stock_quantity, images:perfume_images(*)'

/** Decant row joined with the minimum perfume data the storefront needs. */
export const PUBLIC_DECANT_SELECT =
  'id, perfume_id, volume_ml, price, in_stock, active, label, liquid_color, perfume:perfumes(id, name, brand, concentration, volume_ml, gender, category, scent_type, in_stock, images:perfume_images(url, is_primary, sort_order))'

/** Same without label/liquid_color — fallback while migration 005 isn't applied. */
export const PUBLIC_DECANT_SELECT_LEGACY =
  'id, perfume_id, volume_ml, price, in_stock, active, perfume:perfumes(id, name, brand, concentration, volume_ml, gender, category, scent_type, in_stock, images:perfume_images(url, is_primary, sort_order))'
