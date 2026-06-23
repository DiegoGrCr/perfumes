'use client'
import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, ArrowLeft, Sparkles, Clock } from 'lucide-react'
import { Perfume, PerfumeImage, Category, Gender, Concentration } from '@/types/perfume'
import { createPerfume, updatePerfume, PerfumeFormData } from '@/lib/admin-api'
import { savePerfumeImages, deletePerfumeImageRecord, setPrimaryImage } from '@/lib/storage'
import { TagInput } from './TagInput'
import { ImageUploader, NewImageFile } from './ImageUploader'

interface PerfumeFormProps {
  initialData?: Perfume
}

const EMPTY: PerfumeFormData = {
  name: '', brand: '', description: '',
  price: 0, original_price: undefined,
  category: 'arabe', gender: 'hombre', concentration: 'EDP',
  volume_ml: 100, available_volumes: [100],
  notes_top: [], notes_heart: [], notes_base: [],
  image_url: undefined, in_stock: true, featured: false,
  scent_type: undefined, seasons: [], occasions: [],
  longevity: undefined, sillage: undefined,
}

const SCENT_TYPES = ['Floral', 'Amaderado', 'Oriental', 'Fresco', 'Gourmand', 'Marino', 'Cítrico', 'Especiado', 'Herbal', 'Chypre', 'Fougère']
const LONGEVITY_OPTIONS = ['Corta', 'Moderada', 'Larga', 'Muy larga']
const SILLAGE_OPTIONS   = ['Íntima', 'Suave', 'Moderada', 'Fuerte']
const SEASONS_OPTIONS   = ['Primavera', 'Verano', 'Otoño', 'Invierno']
const OCCASIONS_OPTIONS = ['Día', 'Noche', 'Trabajo', 'Romántico', 'Casual', 'Sport', 'Ocasión especial']

const selectClass = `w-full px-3 py-2 rounded text-sm outline-none transition-colors`
const selectStyle = { background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#F5F0E8' }
const inputStyle  = { background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#F5F0E8' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ChipToggle({
  options, values, onChange,
}: {
  options: string[]
  values: string[]
  onChange: (vals: string[]) => void
}) {
  const toggle = (opt: string) => {
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = values.includes(opt)
        return (
          <button
            key={opt} type="button" onClick={() => toggle(opt)}
            className="text-[10px] tracking-wider uppercase px-3 py-1.5 rounded-full transition-all"
            style={{
              background: active ? '#C9A84C' : '#1a1a1a',
              color: active ? '#000' : '#888',
              border: `1px solid ${active ? '#C9A84C' : '#2a2a2a'}`,
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function PerfumeForm({ initialData }: PerfumeFormProps) {
  const router = useRouter()
  const isEdit = !!initialData

  const [form, setForm] = useState<PerfumeFormData>(() =>
    initialData
      ? {
          name: initialData.name, brand: initialData.brand,
          description: initialData.description ?? '',
          price: initialData.price, original_price: initialData.original_price,
          category: initialData.category, gender: initialData.gender,
          concentration: initialData.concentration,
          volume_ml: initialData.volume_ml,
          available_volumes: initialData.available_volumes ?? [initialData.volume_ml],
          notes_top:   initialData.notes_top   ?? [],
          notes_heart: initialData.notes_heart ?? [],
          notes_base:  initialData.notes_base  ?? [],
          image_url: initialData.image_url,
          in_stock: initialData.in_stock, featured: initialData.featured,
          scent_type: initialData.scent_type,
          seasons:    initialData.seasons    ?? [],
          occasions:  initialData.occasions  ?? [],
          longevity:  initialData.longevity,
          sillage:    initialData.sillage,
        }
      : EMPTY
  )

  const [existingImages, setExistingImages] = useState<PerfumeImage[]>(initialData?.images ?? [])
  const [newImages, setNewImages]           = useState<NewImageFile[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<PerfumeImage[]>([])
  const [saving, setSaving]   = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiRetryIn, setAiRetryIn] = useState<number | null>(null)

  useEffect(() => {
    if (aiRetryIn === null || aiRetryIn <= 0) return
    const id = setInterval(() => setAiRetryIn(s => (s !== null && s > 1 ? s - 1 : null)), 1000)
    return () => clearInterval(id)
  }, [aiRetryIn === null || aiRetryIn <= 0])
  const [error, setError]     = useState<string | null>(null)

  function set<K extends keyof PerfumeFormData>(key: K, value: PerfumeFormData[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function fillWithAI() {
    if (!form.name) return
    setAiLoading(true)
    setAiError(null)
    setAiRetryIn(null)
    try {
      const res = await fetch('/api/ai/perfume-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, brand: form.brand }),
      })
      const data = await res.json()
      if (res.status === 429 || data.error === 'rate_limited') {
        setAiRetryIn(data.retryAfter ?? 60)
        return
      }
      if (!res.ok) throw new Error(data.error ?? JSON.stringify(data))

      const VALID_CONC = ['Parfum','EDP','EDT','EDC','Body Mist','Body Spray'] as const
      // Detectar concentración: primero del nombre, luego de la IA
      function guessConc(name: string): Concentration | null {
        const n = name.toUpperCase()
        if (/\bBODY MIST\b|\bMIST\b/.test(n)) return 'Body Mist'
        if (/\bBODY SPRAY\b|\bSPRAY\b/.test(n)) return 'Body Spray'
        if (/\bEDT\b|EAU DE TOILETTE/.test(n)) return 'EDT'
        if (/\bEDC\b|EAU DE COLOGNE/.test(n)) return 'EDC'
        if (/\bEDP\b|EAU DE PARFUM/.test(n)) return 'EDP'
        if (/\bEXTRAIT\b|\bPARFUM\b/.test(n)) return 'Parfum'
        return null
      }
      const concFromName = guessConc(form.name)
      const concFromAI   = VALID_CONC.includes(data.concentration) ? data.concentration as Concentration : null

      setForm(f => ({
        ...f,
        brand:         (data.brand && data.brand.trim()) ? data.brand.trim() : f.brand,
        gender:        (['hombre','mujer','unisex'] as const).includes(data.gender) ? data.gender : f.gender,
        category:      (['arabe','disenador','nicho','otros'] as const).includes(data.category) ? data.category : f.category,
        concentration: concFromName ?? concFromAI ?? f.concentration,
        description:   data.description ?? f.description,
        notes_top:     Array.isArray(data.notes_top)   && data.notes_top.length   ? data.notes_top   : f.notes_top,
        notes_heart:   Array.isArray(data.notes_heart) && data.notes_heart.length ? data.notes_heart : f.notes_heart,
        notes_base:    Array.isArray(data.notes_base)  && data.notes_base.length  ? data.notes_base  : f.notes_base,
        scent_type:    data.scent_type  || f.scent_type,
        longevity:     data.longevity   || f.longevity,
        sillage:       data.sillage     || f.sillage,
        seasons:       Array.isArray(data.seasons)   && data.seasons.length   ? data.seasons   : f.seasons,
        occasions:     Array.isArray(data.occasions) && data.occasions.length ? data.occasions : f.occasions,
      }))
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setAiLoading(false)
    }
  }

  function handleSetPrimary(source: 'existing' | 'new', id: string | number) {
    if (source === 'existing') {
      setExistingImages(imgs => imgs.map(img => ({ ...img, is_primary: img.id === id })))
      setNewImages(imgs => imgs.map(img => ({ ...img, isPrimary: false })))
    } else {
      setExistingImages(imgs => imgs.map(img => ({ ...img, is_primary: false })))
      setNewImages(imgs => imgs.map((img, i) => ({ ...img, isPrimary: i === id })))
    }
  }

  function handleRemoveExisting(image: PerfumeImage) {
    setExistingImages(imgs => imgs.filter(i => i.id !== image.id))
    setImagesToDelete(prev => [...prev, image])
    if (image.is_primary) {
      const rest = existingImages.filter(i => i.id !== image.id)
      if (rest.length > 0) setExistingImages(imgs => imgs.map((img, i) => ({ ...img, is_primary: i === 0 })))
      else if (newImages.length > 0) setNewImages(imgs => imgs.map((img, i) => ({ ...img, isPrimary: i === 0 })))
    }
  }

  function handleRemoveNew(index: number) {
    const removed = newImages[index]
    URL.revokeObjectURL(removed.preview)
    setNewImages(imgs => {
      const next = imgs.filter((_, i) => i !== index)
      if (removed.isPrimary && next.length > 0) next[0].isPrimary = true
      return next
    })
  }

  function handleReplaceNew(index: number, replacement: NewImageFile) {
    setNewImages(imgs => {
      const next = [...imgs]
      URL.revokeObjectURL(next[index].preview)
      next[index] = replacement
      return next
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      let perfume: Perfume | null

      if (isEdit) {
        perfume = await updatePerfume(initialData!.id, form)
      } else {
        perfume = await createPerfume(form)
      }

      if (!perfume) throw new Error('No se pudo guardar el perfume.')

      for (const img of imagesToDelete) {
        await deletePerfumeImageRecord(img.id, img.storage_path)
      }

      if (newImages.length > 0) {
        await savePerfumeImages(
          perfume.id,
          newImages.map(n => ({ file: n.file, isPrimary: n.isPrimary })),
        )
      }

      const primaryExisting = existingImages.find(i => i.is_primary)
      if (primaryExisting) {
        await setPrimaryImage(perfume.id, primaryExisting.id)
      }

      router.push('/admin/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setSaving(false)
    }
  }

  useEffect(() => {
    return () => { newImages.forEach(n => URL.revokeObjectURL(n.preview)) }
  }, [newImages])

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => router.back()} className="p-2 rounded transition-colors hover:opacity-70" style={{ color: '#C9A84C' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-light tracking-widest" style={{ color: '#F5F0E8' }}>
          {isEdit ? 'Editar perfume' : 'Nuevo perfume'}
        </h1>
      </div>

      {error && (
        <div className="px-4 py-3 rounded text-sm" style={{ background: '#2a0a0a', border: '1px solid #5a1a1a', color: '#f87171' }}>
          {error}
        </div>
      )}

      {/* Panel: Información principal */}
      <section className="rounded-lg p-6 space-y-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid #1e1e1e' }}>
          <h2 className="text-xs uppercase tracking-widest font-medium" style={{ color: '#C9A84C' }}>
            Información principal
          </h2>
          <button
            type="button"
            onClick={fillWithAI}
            disabled={!form.name || aiLoading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase font-medium transition-all disabled:opacity-40"
            style={{ background: '#1a1a00', border: '1px solid #C9A84C', color: '#C9A84C' }}
            title={!form.name ? 'Escribe el nombre primero' : 'Autocompletar con Gemini AI'}
          >
            {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {aiLoading ? 'Generando…' : 'Autocompletar con IA'}
          </button>
        </div>

        {aiRetryIn !== null && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded text-xs" style={{ background: '#1a1500', border: '1px solid #3a2e00', color: '#C9A84C' }}>
            <Clock size={13} className="mt-0.5 shrink-0" />
            <span>
              Límite de consultas IA alcanzado por hoy — es el plan gratuito de Gemini (20/día).
              Vuelve a intentarlo en ~{aiRetryIn}s o mañana.
            </span>
          </div>
        )}
        {aiError && (
          <div className="px-3 py-2 rounded text-xs" style={{ background: '#2a0a0a', border: '1px solid #5a1a1a', color: '#f87171' }}>
            {aiError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nombre *">
            <input required className={`${selectClass} w-full`} style={inputStyle}
              value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre del perfume" />
          </Field>
          <Field label="Marca *">
            <input required className={`${selectClass} w-full`} style={inputStyle}
              value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Ej: Chanel, Dior, Lattafa…" />
          </Field>
        </div>

        <Field label="Descripción">
          <textarea rows={3} className={`${selectClass} w-full resize-none`} style={inputStyle}
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Describe la fragancia, sus características, ocasión de uso…" />
        </Field>
      </section>

      {/* Panel: Clasificación */}
      <section className="rounded-lg p-6 space-y-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <h2 className="text-xs uppercase tracking-widest font-medium pb-3" style={{ color: '#C9A84C', borderBottom: '1px solid #1e1e1e' }}>
          Clasificación
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Categoría *">
            <select required className={selectClass} style={selectStyle} value={form.category} onChange={e => set('category', e.target.value as Category)}>
              <option value="arabe">Árabe</option>
              <option value="disenador">Diseñador</option>
              <option value="nicho">Nicho</option>
              <option value="otros">Otros</option>
            </select>
          </Field>
          <Field label="Género *">
            <select required className={selectClass} style={selectStyle} value={form.gender} onChange={e => set('gender', e.target.value as Gender)}>
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
              <option value="unisex">Unisex</option>
            </select>
          </Field>
          <Field label="Concentración *">
            <select required className={selectClass} style={selectStyle} value={form.concentration} onChange={e => set('concentration', e.target.value as Concentration)}>
              <option value="Parfum">Parfum</option>
              <option value="EDP">EDP – Eau de Parfum</option>
              <option value="EDT">EDT – Eau de Toilette</option>
              <option value="EDC">EDC – Eau de Cologne</option>
              <option value="Body Mist">Body Mist</option>
              <option value="Body Spray">Body Spray</option>
            </select>
          </Field>
        </div>
      </section>

      {/* Panel: Precio y volumen */}
      <section className="rounded-lg p-6 space-y-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <h2 className="text-xs uppercase tracking-widest font-medium pb-3" style={{ color: '#C9A84C', borderBottom: '1px solid #1e1e1e' }}>
          Precio y volumen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Precio *">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#C9A84C' }}>$</span>
              <input required type="number" min={0} step={0.01} className={`${selectClass} pl-7`} style={inputStyle}
                value={form.price} onChange={e => set('price', parseFloat(e.target.value) || 0)} />
            </div>
          </Field>
          <Field label="Precio original (opcional)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#C9A84C' }}>$</span>
              <input type="number" min={0} step={0.01} className={`${selectClass} pl-7`} style={inputStyle}
                value={form.original_price ?? ''} onChange={e => set('original_price', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="Para mostrar descuento" />
            </div>
          </Field>
          <Field label="Volumen (ml) *">
            <input required type="number" min={1} className={selectClass} style={inputStyle}
              value={form.volume_ml} onChange={e => set('volume_ml', parseInt(e.target.value) || 100)} />
          </Field>
        </div>

        <TagInput
          label="Volúmenes disponibles (ml)"
          values={(form.available_volumes ?? []).map(String)}
          onChange={vals => set('available_volumes', vals.map(Number))}
          placeholder="Ej: 50 · Enter · 100 · Enter"
          isNumber
        />
      </section>

      {/* Panel: Notas olfativas */}
      <section className="rounded-lg p-6 space-y-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <h2 className="text-xs uppercase tracking-widest font-medium pb-3" style={{ color: '#C9A84C', borderBottom: '1px solid #1e1e1e' }}>
          Notas olfativas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <TagInput label="Notas de salida" values={form.notes_top ?? []} onChange={v => set('notes_top', v)} placeholder="Bergamota · Enter" />
          <TagInput label="Notas de corazón" values={form.notes_heart ?? []} onChange={v => set('notes_heart', v)} placeholder="Rosa · Enter" />
          <TagInput label="Notas de fondo" values={form.notes_base ?? []} onChange={v => set('notes_base', v)} placeholder="Sándalo · Enter" />
        </div>
      </section>

      {/* Panel: Perfil y recomendaciones */}
      <section className="rounded-lg p-6 space-y-5" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <h2 className="text-xs uppercase tracking-widest font-medium pb-3" style={{ color: '#C9A84C', borderBottom: '1px solid #1e1e1e' }}>
          Perfil y recomendaciones
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Tipo de fragancia">
            <select className={selectClass} style={selectStyle}
              value={form.scent_type ?? ''} onChange={e => set('scent_type', e.target.value || undefined)}>
              <option value="">— Sin especificar —</option>
              {SCENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Duración">
            <select className={selectClass} style={selectStyle}
              value={form.longevity ?? ''} onChange={e => set('longevity', e.target.value || undefined)}>
              <option value="">— Sin especificar —</option>
              {LONGEVITY_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Proyección (sillage)">
            <select className={selectClass} style={selectStyle}
              value={form.sillage ?? ''} onChange={e => set('sillage', e.target.value || undefined)}>
              <option value="">— Sin especificar —</option>
              {SILLAGE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Temporadas recomendadas">
          <div className="mt-1">
            <ChipToggle options={SEASONS_OPTIONS} values={form.seasons ?? []} onChange={v => set('seasons', v)} />
          </div>
        </Field>

        <Field label="Ocasiones">
          <div className="mt-1">
            <ChipToggle options={OCCASIONS_OPTIONS} values={form.occasions ?? []} onChange={v => set('occasions', v)} />
          </div>
        </Field>
      </section>

      {/* Panel: Imágenes */}
      <section className="rounded-lg p-6" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <h2 className="text-xs uppercase tracking-widest font-medium pb-3 mb-5" style={{ color: '#C9A84C', borderBottom: '1px solid #1e1e1e' }}>
          Fotos
        </h2>
        <ImageUploader
          existingImages={existingImages}
          newImages={newImages}
          onAddImages={imgs => setNewImages(prev => [...prev, ...imgs])}
          onRemoveExisting={handleRemoveExisting}
          onRemoveNew={handleRemoveNew}
          onReplaceNew={handleReplaceNew}
          onSetPrimary={handleSetPrimary}
        />
      </section>

      {/* Panel: Estado */}
      <section className="rounded-lg p-6" style={{ background: '#111', border: '1px solid #1e1e1e' }}>
        <h2 className="text-xs uppercase tracking-widest font-medium pb-3 mb-5" style={{ color: '#C9A84C', borderBottom: '1px solid #1e1e1e' }}>
          Estado
        </h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set('in_stock', !form.in_stock)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ background: form.in_stock ? '#C9A84C' : '#2a2a2a' }}
            >
              <span className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                style={{ background: '#fff', left: form.in_stock ? '22px' : '2px' }} />
            </div>
            <span className="text-sm" style={{ color: '#F5F0E8' }}>En stock</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => set('featured', !form.featured)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ background: form.featured ? '#C9A84C' : '#2a2a2a' }}
            >
              <span className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                style={{ background: '#fff', left: form.featured ? '22px' : '2px' }} />
            </div>
            <span className="text-sm" style={{ color: '#F5F0E8' }}>Destacado (aparece primero en el catálogo)</span>
          </label>
        </div>
      </section>

      {/* Botón guardar */}
      <div className="flex justify-end pb-8">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 rounded font-medium text-sm uppercase tracking-widest transition-opacity disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C86D)', color: '#000' }}
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear perfume'}
        </button>
      </div>
    </form>
  )
}
