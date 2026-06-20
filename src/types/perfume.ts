export interface PerfumeImage {
  id: string
  perfume_id: string
  storage_path: string
  url: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

export type Category = 'arabe' | 'disenador' | 'nicho' | 'otros'
export type Gender = 'hombre' | 'mujer' | 'unisex'
export type Concentration = 'Parfum' | 'EDP' | 'EDT' | 'EDC' | 'Body Mist' | 'Body Spray'
export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'name_asc'

export interface Perfume {
  id: string
  name: string
  brand: string
  description: string
  price: number
  original_price?: number
  category: Category
  gender: Gender
  concentration: Concentration
  volume_ml: number
  available_volumes?: number[]
  notes_top?: string[]
  notes_heart?: string[]
  notes_base?: string[]
  image_url?: string
  images?: PerfumeImage[]
  in_stock: boolean
  featured: boolean
  created_at: string
  scent_type?: string
  seasons?: string[]
  occasions?: string[]
  longevity?: string
  sillage?: string
}

export interface FilterState {
  categories: Category[]
  genders: Gender[]
  minPrice: number
  maxPrice: number
  search: string
  inStockOnly: boolean
  sortBy: SortOption
}

export const CATEGORY_LABELS: Record<Category, string> = {
  arabe: 'Árabe',
  disenador: 'Diseñador',
  nicho: 'Nicho',
  otros: 'Otros',
}

export const GENDER_LABELS: Record<Gender, string> = {
  hombre: 'Hombre',
  mujer: 'Mujer',
  unisex: 'Unisex',
}

export const CATEGORY_COLORS: Record<Category, { bg: string; text: string; border: string }> = {
  arabe: { bg: '#1C0F00', text: '#D4843E', border: '#3D2010' },
  disenador: { bg: '#001A33', text: '#4A9EDB', border: '#0A2A4A' },
  nicho: { bg: '#1A0A2E', text: '#9B6DD4', border: '#2E1050' },
  otros: { bg: '#001A10', text: '#3DAB6E', border: '#0A3020' },
}

export const GENDER_COLORS: Record<Gender, { bg: string; text: string }> = {
  hombre: { bg: '#0A1A2E', text: '#7EB3D4' },
  mujer: { bg: '#2E0A1A', text: '#D47EB3' },
  unisex: { bg: '#1A1A0A', text: '#D4C87E' },
}

export const CATEGORY_GRADIENTS: Record<Category, string> = {
  arabe: 'linear-gradient(160deg, #1C0F00 0%, #3D2010 40%, #1A0800 100%)',
  disenador: 'linear-gradient(160deg, #000D1A 0%, #0A2040 40%, #001020 100%)',
  nicho: 'linear-gradient(160deg, #0D0018 0%, #1A0835 40%, #080012 100%)',
  otros: 'linear-gradient(160deg, #000D08 0%, #0A2018 40%, #001A0C 100%)',
}
