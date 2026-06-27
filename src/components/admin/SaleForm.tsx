'use client'
import { useState, useMemo } from 'react'
import { Search, CheckCircle } from 'lucide-react'
import { Perfume } from '@/types/perfume'
import { createSale, SalePayload } from '@/lib/admin-api'

interface Props {
  perfumes: Perfume[]
  onSaved: () => void
}

export function SaleForm({ perfumes, onSaved }: Props) {
  const [query,    setQuery]    = useState('')
  const [selected, setSelected] = useState<Perfume | null>(null)
  const [showList, setShowList] = useState(false)

  const [quantity,   setQuantity]   = useState(1)
  const [costPrice,  setCostPrice]  = useState('')
  const [salePrice,  setSalePrice]  = useState('')
  const [notes,      setNotes]      = useState('')
  const [soldAt,     setSoldAt]     = useState(() => new Date().toISOString().slice(0, 10))
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return perfumes.filter(p =>
      p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [query, perfumes])

  function pick(p: Perfume) {
    setSelected(p)
    setQuery(`${p.name} – ${p.brand}`)
    setShowList(false)
    setSalePrice(String(p.price))
    if (p.cost_price != null) setCostPrice(String(p.cost_price))
  }

  function reset() {
    setSelected(null)
    setQuery('')
    setQuantity(1)
    setCostPrice('')
    setSalePrice('')
    setNotes('')
    setSoldAt(new Date().toISOString().slice(0, 10))
    setSaved(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) { setError('Selecciona un perfume'); return }
    if (!costPrice || !salePrice) { setError('Ingresa costo y precio de venta'); return }

    setSaving(true)
    setError(null)

    const payload: SalePayload = {
      perfume_id:    selected.id,
      perfume_name:  selected.name,
      perfume_brand: selected.brand,
      volume_ml:     selected.volume_ml,
      quantity,
      cost_price:    parseFloat(costPrice),
      sale_price:    parseFloat(salePrice),
      notes:         notes || undefined,
      sold_at:       new Date(soldAt + 'T12:00:00').toISOString(),
    }

    const result = await createSale(payload)
    setSaving(false)

    if (!result) {
      setError('Error al guardar. Verifica que el SQL de migración fue ejecutado en Supabase.')
      return
    }

    setSaved(true)
    onSaved()
  }

  const cost = parseFloat(costPrice) || 0
  const sale = parseFloat(salePrice) || 0
  const profit = (sale - cost) * quantity
  const margin = cost > 0 ? ((sale - cost) / cost * 100) : 0

  const inputStyle = { background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#F5F0E8' }
  const inputClass = 'w-full px-3 py-2.5 rounded text-sm outline-none'

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <CheckCircle size={48} style={{ color: '#4CAF50' }} />
        <p className="text-lg font-light" style={{ color: '#F5F0E8' }}>Venta registrada</p>
        <p className="text-sm" style={{ color: '#666' }}>
          Ganancia: <span style={{ color: profit >= 0 ? '#4CAF50' : '#f87171' }}>${profit.toFixed(2)}</span>
        </p>
        <button
          onClick={reset}
          className="mt-2 px-6 py-2.5 rounded text-sm font-medium uppercase tracking-widest"
          style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C86D)', color: '#000' }}
        >
          Registrar otra venta
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">

      {/* Buscador de perfume */}
      <div>
        <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
          Perfume *
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }} />
          <input
            type="text"
            value={query}
            placeholder="Buscar por nombre o marca…"
            onChange={e => { setQuery(e.target.value); setShowList(true); setSelected(null) }}
            onFocus={() => setShowList(true)}
            className={`${inputClass} pl-9`}
            style={inputStyle}
          />
          {showList && results.length > 0 && (
            <div className="absolute z-20 w-full mt-1 rounded-lg overflow-hidden shadow-xl"
              style={{ background: '#111', border: '1px solid #2a2a2a' }}>
              {results.map(p => (
                <button key={p.id} type="button"
                  onClick={() => pick(p)}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:brightness-125"
                  style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <span style={{ color: '#F5F0E8' }}>{p.name}</span>
                  <span className="text-xs ml-2" style={{ color: '#555' }}>{p.brand} · {p.volume_ml}ml · ${p.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <p className="text-xs mt-1" style={{ color: '#4CAF50' }}>
            ✓ {selected.name} ({selected.volume_ml}ml)
            {selected.stock_quantity != null && (
              <span style={{ color: '#555' }}> · {selected.stock_quantity} uds en inventario</span>
            )}
          </p>
        )}
      </div>

      {/* Cantidad */}
      <div>
        <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
          Cantidad
        </label>
        <input type="number" min={1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)}
          className={inputClass} style={{ ...inputStyle, width: '120px' }} />
      </div>

      {/* Costo y precio de venta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
            Costo unitario *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#555' }}>$</span>
            <input type="number" min={0} step={0.01} value={costPrice}
              onChange={e => setCostPrice(e.target.value)}
              placeholder="0.00"
              className={`${inputClass} pl-7`} style={inputStyle} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
            Precio de venta *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#555' }}>$</span>
            <input type="number" min={0} step={0.01} value={salePrice}
              onChange={e => setSalePrice(e.target.value)}
              placeholder="0.00"
              className={`${inputClass} pl-7`} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Resumen de ganancia en tiempo real */}
      {cost > 0 && sale > 0 && (
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-3 rounded-lg"
          style={{ background: profit >= 0 ? '#0a1a0a' : '#1a0a0a', border: `1px solid ${profit >= 0 ? '#1a3a1a' : '#3a1a1a'}` }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Ganancia x unidad</p>
            <p className="text-lg font-medium" style={{ color: profit >= 0 ? '#4CAF50' : '#f87171' }}>
              ${(sale - cost).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Margen</p>
            <p className="text-lg font-medium" style={{ color: profit >= 0 ? '#4CAF50' : '#f87171' }}>
              {margin.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Total ({quantity} uds)</p>
            <p className="text-lg font-medium" style={{ color: profit >= 0 ? '#4CAF50' : '#f87171' }}>
              ${profit.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Fecha */}
      <div>
        <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
          Fecha de venta
        </label>
        <input type="date" value={soldAt} onChange={e => setSoldAt(e.target.value)}
          className={inputClass} style={{ ...inputStyle, width: '180px' }} />
      </div>

      {/* Notas */}
      <div>
        <label className="block text-xs font-medium mb-1.5 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
          Notas (opcional)
        </label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Cliente, canal de venta, etc."
          className={inputClass} style={inputStyle} />
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded" style={{ background: '#1a0a0a', color: '#f87171', border: '1px solid #3a1a1a' }}>
          {error}
        </p>
      )}

      <button type="submit" disabled={saving}
        className="px-8 py-3 rounded text-sm font-medium uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C86D)', color: '#000' }}>
        {saving ? 'Guardando…' : 'Registrar venta'}
      </button>
    </form>
  )
}
