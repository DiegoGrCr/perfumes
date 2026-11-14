'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Minus, Plus, Pin, ImageIcon, Loader2 } from 'lucide-react'
import { useAdmin, useLivePerfume } from '@/context/AdminContext'
import type { PerfumePatch } from '@/app/actions/perfume'
import {
  Perfume, Category, Gender, Concentration,
  CATEGORY_LABELS, GENDER_LABELS,
} from '@/types/perfume'

const CONCENTRATIONS: Concentration[] = ['Parfum', 'EDP', 'EDT', 'EDC', 'Body Mist', 'Body Spray']
const SCENT_TYPES = ['Floral', 'Amaderado', 'Oriental', 'Fresco', 'Gourmand', 'Marino', 'Cítrico', 'Especiado', 'Herbal', 'Chypre', 'Fougère']
const LONGEVITY = ['Corta', 'Moderada', 'Larga', 'Muy larga']
const SILLAGE = ['Íntima', 'Suave', 'Moderada', 'Fuerte']
const SEASONS = ['Primavera', 'Verano', 'Otoño', 'Invierno']
const OCCASIONS = ['Día', 'Noche', 'Trabajo', 'Romántico', 'Casual', 'Sport', 'Ocasión especial']

type Form = {
  name: string; brand: string; description: string
  price: string; original_price: string
  category: Category; gender: Gender; concentration: Concentration; volume_ml: string
  in_stock: boolean; stock_quantity: string; featured: boolean
  scent_type: string; longevity: string; sillage: string
  notes_top: string; notes_heart: string; notes_base: string
  seasons: string[]; occasions: string[]
}

const toForm = (p: Perfume): Form => ({
  name: p.name, brand: p.brand, description: p.description ?? '',
  price: String(p.price ?? ''), original_price: p.original_price ? String(p.original_price) : '',
  category: p.category, gender: p.gender, concentration: p.concentration, volume_ml: String(p.volume_ml ?? ''),
  in_stock: p.in_stock, stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : '', featured: p.featured,
  scent_type: p.scent_type ?? '', longevity: p.longevity ?? '', sillage: p.sillage ?? '',
  notes_top: (p.notes_top ?? []).join(', '), notes_heart: (p.notes_heart ?? []).join(', '), notes_base: (p.notes_base ?? []).join(', '),
  seasons: p.seasons ?? [], occasions: p.occasions ?? [],
})

const list = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)
const num = (s: string) => (s.trim() === '' ? null : Number(s))
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/** Only the fields that actually changed. */
function diff(p: Perfume, f: Form): PerfumePatch {
  const next: PerfumePatch = {
    name: f.name.trim(), brand: f.brand.trim(), description: f.description.trim(),
    price: Number(f.price), original_price: num(f.original_price) ?? undefined,
    category: f.category, gender: f.gender, concentration: f.concentration, volume_ml: Number(f.volume_ml),
    in_stock: f.in_stock, stock_quantity: num(f.stock_quantity) ?? undefined, featured: f.featured,
    scent_type: f.scent_type || undefined, longevity: f.longevity || undefined, sillage: f.sillage || undefined,
    notes_top: list(f.notes_top), notes_heart: list(f.notes_heart), notes_base: list(f.notes_base),
    seasons: f.seasons, occasions: f.occasions,
  }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(next)) {
    if (!same(v, (p as unknown as Record<string, unknown>)[k])) out[k] = v ?? null
  }
  return out as PerfumePatch
}

/* ── Small form atoms ─────────────────────────────────────── */
const inputCls = 'w-full rounded-none border-b border-line bg-transparent py-2.5 text-[14px] text-ink outline-none transition-colors placeholder:text-faint focus:border-ink'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="eyebrow text-[8px] text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-7 first:border-t-0 first:pt-2">
      <h3 className="display mb-5 text-2xl">{title}</h3>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Chips({ options, value, onChange, single = false }: { options: string[]; value: string[]; onChange: (v: string[]) => void; single?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = value.includes(o)
        return (
          <button
            type="button"
            key={o}
            onClick={() => onChange(single ? (on ? [] : [o]) : on ? value.filter(x => x !== o) : [...value, o])}
            className={`rounded-full border px-3 py-1.5 text-[11px] transition-all ${on ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-soft hover:border-ink/40'}`}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

/* ── Panel ────────────────────────────────────────────────── */
export default function QuickEditPanel() {
  const { editing, closeEditor } = useAdmin()
  const open = !!editing

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEditor() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-velvet/45 backdrop-blur-[2px] transition-opacity duration-500 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={closeEditor}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Editar fragancia"
        className={`fixed right-0 top-0 z-[60] flex h-full w-full max-w-[520px] flex-col bg-paper transition-[transform,visibility] duration-700 ease-lux ${
          open ? 'visible translate-x-0 shadow-[-20px_0_60px_-20px_rgba(23,18,15,0.3)]' : 'invisible translate-x-full'
        }`}
      >
        {editing && <EditorBody key={editing.id} perfume={editing} />}
      </aside>
    </>
  )
}

function EditorBody({ perfume: base }: { perfume: Perfume }) {
  const { closeEditor, save, saveState, lastError } = useAdmin()
  const perfume = useLivePerfume(base)
  const [f, setF] = useState<Form>(() => toForm(perfume))
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF(prev => ({ ...prev, [k]: v }))

  const patch = diff(perfume, f)
  const dirty = Object.keys(patch).length > 0
  const invalid = !f.name.trim() || !f.brand.trim() || !(Number(f.price) > 0) || !(Number(f.volume_ml) > 0)
  const saving = saveState === 'saving'

  function setQty(q: number | null) {
    const qty = q == null ? '' : String(Math.max(0, q))
    setF(prev => ({
      ...prev,
      stock_quantity: qty,
      // keep the status in sync with the count when it crosses zero
      in_stock: q == null ? prev.in_stock : q > 0,
    }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!dirty || invalid) return
    const ok = await save(perfume, patch)
    if (ok) closeEditor()
  }

  return (
    <form onSubmit={onSubmit} className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-6 sm:px-8">
        <div className="min-w-0">
          <p className="eyebrow text-[8px] text-rose">Modo administrador</p>
          <h2 className="display mt-2 truncate text-3xl">{perfume.name}</h2>
          <Link
            href={`/admin/perfumes/${perfume.id}/edit`}
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted link-underline hover:text-ink"
          >
            <ImageIcon size={12} /> Fotos y edición completa
          </Link>
        </div>
        <button type="button" onClick={closeEditor} className="-mr-2 p-2 text-muted transition-transform duration-500 hover:rotate-90 hover:text-ink" aria-label="Cerrar">
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-8">
        <Section title="Disponibilidad">
          <div className="grid grid-cols-2 rounded-full border border-line p-1">
            {[true, false].map(v => (
              <button
                type="button"
                key={String(v)}
                onClick={() => set('in_stock', v)}
                className={`rounded-full py-2.5 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${f.in_stock === v ? 'bg-ink text-ivory' : 'text-muted hover:text-ink'}`}
              >
                {v ? 'En existencia' : 'Sobre pedido'}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-ink">Piezas en existencia</p>
              <p className="text-[11px] text-faint">Al llegar a 0 pasa a “Sobre pedido”.</p>
            </div>
            <div className="flex items-center rounded-full border border-line">
              <button type="button" onClick={() => setQty((num(f.stock_quantity) ?? 0) - 1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink" aria-label="Restar"><Minus size={13} /></button>
              <input
                inputMode="numeric"
                value={f.stock_quantity}
                onChange={e => setQty(e.target.value === '' ? null : Number(e.target.value.replace(/\D/g, '')))}
                placeholder="—"
                className="w-10 bg-transparent text-center text-[14px] outline-none"
                aria-label="Piezas en existencia"
              />
              <button type="button" onClick={() => setQty((num(f.stock_quantity) ?? 0) + 1)} className="flex h-9 w-9 items-center justify-center text-muted hover:text-ink" aria-label="Sumar"><Plus size={13} /></button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-4">
            <span>
              <span className="flex items-center gap-2 text-[13px] text-ink"><Pin size={13} /> Fijar arriba</span>
              <span className="text-[11px] text-faint">Aparece primero en el catálogo y con la etiqueta “Destacado”.</span>
            </span>
            <span className="relative inline-flex shrink-0">
              <input type="checkbox" className="peer sr-only" checked={f.featured} onChange={e => set('featured', e.target.checked)} />
              <span className="h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-ink" />
              <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-paper shadow transition-transform duration-300 ease-lux peer-checked:translate-x-5" />
            </span>
          </label>
        </Section>

        <Section title="Precio">
          <div className="grid grid-cols-2 gap-5">
            <Field label="Precio (MXN)">
              <input inputMode="decimal" className={inputCls} value={f.price} onChange={e => set('price', e.target.value)} />
            </Field>
            <Field label="Precio anterior" hint="Opcional, para mostrar descuento">
              <input inputMode="decimal" className={inputCls} value={f.original_price} onChange={e => set('original_price', e.target.value)} placeholder="—" />
            </Field>
          </div>
        </Section>

        <Section title="Datos">
          <Field label="Nombre"><input className={inputCls} value={f.name} onChange={e => set('name', e.target.value)} /></Field>
          <Field label="Marca"><input className={inputCls} value={f.brand} onChange={e => set('brand', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-5">
            <Field label="Categoría">
              <select className={inputCls} value={f.category} onChange={e => set('category', e.target.value as Category)}>
                {(Object.keys(CATEGORY_LABELS) as Category[])
                  .filter(c => c !== 'nicho' || f.category === 'nicho')
                  .map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </Field>
            <Field label="Para">
              <select className={inputCls} value={f.gender} onChange={e => set('gender', e.target.value as Gender)}>
                {(Object.keys(GENDER_LABELS) as Gender[]).map(g => <option key={g} value={g}>{GENDER_LABELS[g]}</option>)}
              </select>
            </Field>
            <Field label="Concentración">
              <select className={inputCls} value={f.concentration} onChange={e => set('concentration', e.target.value as Concentration)}>
                {CONCENTRATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Volumen (ml)">
              <input inputMode="numeric" className={inputCls} value={f.volume_ml} onChange={e => set('volume_ml', e.target.value)} />
            </Field>
          </div>
          <Field label="Descripción">
            <textarea rows={5} className={`${inputCls} resize-y leading-relaxed`} value={f.description} onChange={e => set('description', e.target.value)} />
          </Field>
        </Section>

        <Section title="Perfil olfativo">
          <Field label="Familia"><div className="mt-3"><Chips single options={SCENT_TYPES} value={f.scent_type ? [f.scent_type] : []} onChange={v => set('scent_type', v[0] ?? '')} /></div></Field>
          <Field label="Duración"><div className="mt-3"><Chips single options={LONGEVITY} value={f.longevity ? [f.longevity] : []} onChange={v => set('longevity', v[0] ?? '')} /></div></Field>
          <Field label="Estela"><div className="mt-3"><Chips single options={SILLAGE} value={f.sillage ? [f.sillage] : []} onChange={v => set('sillage', v[0] ?? '')} /></div></Field>
          <Field label="Notas de salida" hint="Separadas por comas"><input className={inputCls} value={f.notes_top} onChange={e => set('notes_top', e.target.value)} /></Field>
          <Field label="Notas de corazón"><input className={inputCls} value={f.notes_heart} onChange={e => set('notes_heart', e.target.value)} /></Field>
          <Field label="Notas de fondo"><input className={inputCls} value={f.notes_base} onChange={e => set('notes_base', e.target.value)} /></Field>
        </Section>

        <Section title="Ideal para">
          <Field label="Temporadas"><div className="mt-3"><Chips options={SEASONS} value={f.seasons} onChange={v => set('seasons', v)} /></div></Field>
          <Field label="Ocasiones"><div className="mt-3"><Chips options={OCCASIONS} value={f.occasions} onChange={v => set('occasions', v)} /></div></Field>
        </Section>
      </div>

      {/* Footer */}
      <div className="space-y-3 border-t border-line bg-ivory px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
        {saveState === 'error' && lastError && (
          <p className="rounded-sm bg-rose-soft px-4 py-2.5 text-[12px] text-ink-soft">{lastError}</p>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={closeEditor} className="btn btn-ghost flex-1 px-4">Cancelar</button>
          <button type="submit" disabled={!dirty || invalid || saving} className="btn btn-ink flex-[2] px-4 disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : dirty ? `Guardar ${Object.keys(patch).length} ${Object.keys(patch).length === 1 ? 'cambio' : 'cambios'}` : 'Sin cambios'}
          </button>
        </div>
      </div>
    </form>
  )
}
