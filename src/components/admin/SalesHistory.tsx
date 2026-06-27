'use client'
import { useState, useMemo } from 'react'
import { Download, Trash2, TrendingUp, ShoppingCart, DollarSign } from 'lucide-react'
import { Sale } from '@/types/perfume'
import { deleteSale } from '@/lib/admin-api'

interface Props {
  initialSales: Sale[]
}

function exportSalesCSV(sales: Sale[]) {
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }
  const headers = ['Fecha','Perfume','Marca','Volumen (ml)','Cantidad','Costo unitario','Precio venta','Ganancia unitaria','Ganancia total','Notas']
  const rows = sales.map(s => {
    const ganUnit = s.sale_price - s.cost_price
    const ganTotal = ganUnit * s.quantity
    return [
      new Date(s.sold_at).toLocaleDateString('es-MX'),
      s.perfume_name,
      s.perfume_brand,
      s.volume_ml,
      s.quantity,
      s.cost_price.toFixed(2),
      s.sale_price.toFixed(2),
      ganUnit.toFixed(2),
      ganTotal.toFixed(2),
      s.notes ?? '',
    ].map(escape).join(',')
  })

  const totalVentas  = sales.reduce((a, s) => a + s.sale_price * s.quantity, 0)
  const totalCosto   = sales.reduce((a, s) => a + s.cost_price  * s.quantity, 0)
  const totalGanancia = totalVentas - totalCosto

  const summary = [
    '',
    escape('RESUMEN'),
    '',
    `Total vendido,$${totalVentas.toFixed(2)}`,
    `Total en costos,$${totalCosto.toFixed(2)}`,
    `Ganancia neta,$${totalGanancia.toFixed(2)}`,
  ]

  const csv = '﻿' + [headers.join(','), ...rows, ...summary].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `velvet-ventas-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function SalesHistory({ initialSales }: Props) {
  const [sales, setSales]       = useState<Sale[]>(initialSales)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState('')

  const filtered = useMemo(() => {
    if (!filterMonth) return sales
    return sales.filter(s => s.sold_at.slice(0, 7) === filterMonth)
  }, [sales, filterMonth])

  const totalVentas   = filtered.reduce((a, s) => a + s.sale_price * s.quantity, 0)
  const totalCosto    = filtered.reduce((a, s) => a + s.cost_price  * s.quantity, 0)
  const totalGanancia = totalVentas - totalCosto

  async function handleDelete(id: string) {
    setDeleting(id)
    const ok = await deleteSale(id)
    if (ok) setSales(s => s.filter(x => x.id !== id))
    setDeleting(null)
    setConfirmId(null)
  }

  const cardStyle = (color: string) => ({
    background: '#111',
    border: `1px solid #1e1e1e`,
    borderLeft: `3px solid ${color}`,
  })

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg px-5 py-4 flex items-center gap-4" style={cardStyle('#C9A84C')}>
          <ShoppingCart size={20} style={{ color: '#C9A84C' }} />
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Total vendido</p>
            <p className="text-xl font-light" style={{ color: '#F5F0E8' }}>${totalVentas.toFixed(2)}</p>
          </div>
        </div>
        <div className="rounded-lg px-5 py-4 flex items-center gap-4" style={cardStyle('#f87171')}>
          <DollarSign size={20} style={{ color: '#f87171' }} />
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Total en costos</p>
            <p className="text-xl font-light" style={{ color: '#F5F0E8' }}>${totalCosto.toFixed(2)}</p>
          </div>
        </div>
        <div className="rounded-lg px-5 py-4 flex items-center gap-4" style={cardStyle('#4CAF50')}>
          <TrendingUp size={20} style={{ color: '#4CAF50' }} />
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#555' }}>Ganancia neta</p>
            <p className="text-xl font-light" style={{ color: totalGanancia >= 0 ? '#4CAF50' : '#f87171' }}>
              ${totalGanancia.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase tracking-widest" style={{ color: '#555' }}>Mes</label>
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="px-3 py-1.5 rounded text-sm outline-none"
            style={{ background: '#0d0d0d', border: '1px solid #2a2a2a', color: '#F5F0E8' }}
          />
          {filterMonth && (
            <button onClick={() => setFilterMonth('')}
              className="text-xs" style={{ color: '#555' }}>Limpiar</button>
          )}
          <span className="text-xs" style={{ color: '#444' }}>{filtered.length} ventas</span>
        </div>
        <button
          onClick={() => exportSalesCSV(filtered)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-30"
          style={{ background: '#1a1a1a', color: '#C9A84C', border: '1px solid #2a2a2a' }}
        >
          <Download size={13} />
          Exportar CSV
        </button>
      </div>

      {/* Tabla */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: '#444' }}>
          <ShoppingCart size={36} />
          <p className="text-sm">No hay ventas registradas{filterMonth ? ' en este mes' : ''}.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid #1e1e1e' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
                {['Fecha', 'Perfume', 'Qty', 'Costo unit.', 'Precio venta', 'Ganancia', 'Notas', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium" style={{ color: '#555' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const ganUnit  = s.sale_price - s.cost_price
                const ganTotal = ganUnit * s.quantity
                return (
                  <tr key={s.id}
                    style={{ background: idx % 2 === 0 ? '#111' : '#0f0f0f', borderBottom: '1px solid #1a1a1a' }}>
                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#666' }}>
                      {new Date(s.sold_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium" style={{ color: '#F5F0E8' }}>{s.perfume_name}</p>
                      <p className="text-xs" style={{ color: '#555' }}>{s.perfume_brand} · {s.volume_ml}ml</p>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: '#aaa' }}>{s.quantity}</td>
                    <td className="px-4 py-3" style={{ color: '#aaa' }}>${s.cost_price.toFixed(2)}</td>
                    <td className="px-4 py-3" style={{ color: '#F5F0E8' }}>${s.sale_price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span style={{ color: ganTotal >= 0 ? '#4CAF50' : '#f87171' }}>
                        ${ganTotal.toFixed(2)}
                      </span>
                      {s.quantity > 1 && (
                        <span className="text-xs ml-1" style={{ color: '#444' }}>
                          (${ganUnit.toFixed(2)} c/u)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[140px] truncate" style={{ color: '#555' }}>
                      {s.notes ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {confirmId === s.id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id}
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: '#4a1a1a', color: '#f87171', border: '1px solid #6a2a2a' }}>
                            {deleting === s.id ? '…' : 'Sí'}
                          </button>
                          <button onClick={() => setConfirmId(null)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}>
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmId(s.id)}
                          className="p-1.5 rounded hover:opacity-80" style={{ color: '#3a1a1a' }}
                          title="Eliminar venta">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
