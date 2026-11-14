'use client'

import { FilterState, Gender, GENDER_LABELS } from '@/types/perfume'
import { formatPrice } from '@/lib/brand'

export interface FilterOptions {
  genders: [Gender, number][]
  scentTypes: [string, number][]
  seasons: [string, number][]
  priceCeil: number
  saleCount: number
}

interface Props {
  filters: FilterState
  onChange: (filters: FilterState) => void
  options: FilterOptions
}

const SCENT_LABELS: Record<string, string> = { Gourmand: 'Dulce' }
const SEASON_LABELS: Record<string, string> = { Verano: 'Calor', Invierno: 'Frío' }

function Group({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="border-t border-line py-7 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline justify-between">
        <h4 className="display text-xl">{title}</h4>
        {aside}
      </div>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] tracking-wide transition-all duration-300 ease-lux ${
        active
          ? 'border-ink bg-ink text-ivory'
          : 'border-line bg-transparent text-ink-soft hover:border-ink/40'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-[9px] ${active ? 'text-ivory/60' : 'text-faint'}`}>{count}</span>
      )}
    </button>
  )
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-[13px] text-ink-soft">{label}<span className="block text-[11px] text-faint">{hint}</span></span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line transition-colors duration-300 peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-rose" />
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-paper shadow transition-transform duration-300 ease-lux peer-checked:translate-x-5" />
      </span>
    </label>
  )
}

function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter(x => x !== v) : [...list, v]
}

export default function FilterSidebar({ filters, onChange, options }: Props) {
  const { priceCeil } = options
  const step = priceCeil > 2000 ? 100 : 50
  const presets = [
    { label: `Hasta ${formatPrice(500)}`, min: 0, max: 500 },
    { label: `${formatPrice(500)} – ${formatPrice(1000)}`, min: 500, max: 1000 },
    { label: `${formatPrice(1000)} – ${formatPrice(2000)}`, min: 1000, max: 2000 },
    { label: `Más de ${formatPrice(2000)}`, min: 2000, max: priceCeil },
  ].filter(p => p.min < priceCeil)

  const minPct = (filters.minPrice / priceCeil) * 100
  const maxPct = (filters.maxPrice / priceCeil) * 100

  return (
    <div className="flex flex-col">
      {options.genders.length > 0 && (
        <Group title="Para">
          <div className="flex flex-wrap gap-2">
            {options.genders.map(([g, n]) => (
              <Chip key={g} active={filters.genders.includes(g)} count={n}
                onClick={() => onChange({ ...filters, genders: toggle(filters.genders, g) })}>
                {GENDER_LABELS[g]}
              </Chip>
            ))}
          </div>
        </Group>
      )}

      {options.scentTypes.length > 0 && (
        <Group title="Aroma">
          <div className="flex flex-wrap gap-2">
            {options.scentTypes.map(([v, n]) => (
              <Chip key={v} active={filters.scentTypes.includes(v)} count={n}
                onClick={() => onChange({ ...filters, scentTypes: toggle(filters.scentTypes, v) })}>
                {SCENT_LABELS[v] ?? v}
              </Chip>
            ))}
          </div>
        </Group>
      )}

      {options.seasons.length > 0 && (
        <Group title="Temporada">
          <div className="flex flex-wrap gap-2">
            {options.seasons.map(([v, n]) => (
              <Chip key={v} active={filters.seasons.includes(v)} count={n}
                onClick={() => onChange({ ...filters, seasons: toggle(filters.seasons, v) })}>
                {SEASON_LABELS[v] ?? v}
              </Chip>
            ))}
          </div>
        </Group>
      )}

      <Group
        title="Precio"
        aside={
          <span className="text-[11px] text-muted">
            {formatPrice(filters.minPrice)} – {formatPrice(filters.maxPrice)}
          </span>
        }
      >
        {/* Dual range */}
        <div className="relative h-6">
          <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-line" />
          <div
            className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-ink"
            style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
          />
          <input
            type="range" min={0} max={priceCeil} step={step} value={filters.minPrice}
            aria-label="Precio mínimo"
            onChange={e => onChange({ ...filters, minPrice: Math.min(Number(e.target.value), filters.maxPrice - step) })}
            className="range-thumb absolute inset-0 w-full"
          />
          <input
            type="range" min={0} max={priceCeil} step={step} value={filters.maxPrice}
            aria-label="Precio máximo"
            onChange={e => onChange({ ...filters, maxPrice: Math.max(Number(e.target.value), filters.minPrice + step) })}
            className="range-thumb absolute inset-0 w-full"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map(p => (
            <Chip key={p.label}
              active={filters.minPrice === p.min && filters.maxPrice === p.max}
              onClick={() => onChange({ ...filters, minPrice: p.min, maxPrice: p.max })}>
              {p.label}
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Disponibilidad">
        <div className="space-y-5">
          {options.saleCount > 0 && (
            <Toggle
              label="Solo en oferta"
              hint={`${options.saleCount} con descuento activo`}
              checked={filters.onSaleOnly}
              onChange={v => onChange({ ...filters, onSaleOnly: v })}
            />
          )}
          <Toggle
            label="Solo en existencia"
            hint="Oculta las de sobre pedido"
            checked={filters.inStockOnly}
            onChange={v => onChange({ ...filters, inStockOnly: v })}
          />
        </div>
      </Group>
    </div>
  )
}
