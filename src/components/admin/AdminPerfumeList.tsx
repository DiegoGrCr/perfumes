'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Plus, Package, Star, Download } from 'lucide-react'
import { Perfume } from '@/types/perfume'
import { CATEGORY_LABELS, GENDER_LABELS } from '@/types/perfume'
import { deletePerfume } from '@/lib/admin-api'

function exportCSV(perfumes: Perfume[]) {
  const headers = [
    'Nombre', 'Marca', 'Categoría', 'Género', 'Concentración',
    'Volumen (ml)', 'Precio compra', 'Precio venta', 'Ganancia', 'Stock',
  ]
  const escape = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const rows = perfumes.map(p => [
    p.name,
    p.brand,
    CATEGORY_LABELS[p.category],
    GENDER_LABELS[p.gender],
    p.concentration,
    p.volume_ml,
    p.original_price ?? '',
    p.price,
    p.original_price != null ? (p.price - p.original_price).toFixed(2) : '',
    p.in_stock ? 'Sí' : 'No',
  ].map(escape).join(','))

  const csv = '﻿' + [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `velvet-catalogo-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

interface AdminPerfumeListProps {
  initialPerfumes: Perfume[]
}

export function AdminPerfumeList({ initialPerfumes }: AdminPerfumeListProps) {
  const router = useRouter()
  const [perfumes, setPerfumes] = useState(initialPerfumes)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    const ok = await deletePerfume(id)
    if (ok) {
      setPerfumes(p => p.filter(x => x.id !== id))
    }
    setDeleting(null)
    setConfirmId(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light tracking-widest" style={{ color: '#F5F0E8' }}>Catálogo</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>{perfumes.length} perfume{perfumes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV(perfumes)}
            disabled={perfumes.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#1a1a1a', color: '#C9A84C', border: '1px solid #2a2a2a' }}
            title="Exportar lista como CSV"
          >
            <Download size={15} />
            Exportar
          </button>
          <button
            onClick={() => router.push('/admin/perfumes/new')}
            className="flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium uppercase tracking-widest transition-opacity hover:opacity-80"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #E8C86D)', color: '#000' }}
          >
            <Plus size={16} />
            Nuevo perfume
          </button>
        </div>
      </div>

      {perfumes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: '#444' }}>
          <Package size={40} />
          <p className="text-sm">No hay perfumes aún.</p>
          <button onClick={() => router.push('/admin/perfumes/new')} className="text-sm underline" style={{ color: '#C9A84C' }}>
            Agrega el primero
          </button>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #1e1e1e' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #1e1e1e' }}>
                {['Perfume', 'Categoría', 'Género', 'Precio', 'Stock', 'Destacado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-widest font-medium" style={{ color: '#555' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perfumes.map((p, idx) => {
                const primaryImg = p.images?.find(i => i.is_primary) ?? p.images?.[0]
                return (
                  <tr
                    key={p.id}
                    style={{
                      background: idx % 2 === 0 ? '#111' : '#0f0f0f',
                      borderBottom: '1px solid #1a1a1a',
                    }}
                    className="hover:brightness-110 transition-all"
                  >
                    {/* Perfume */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                        >
                          {primaryImg
                            ? <img src={primaryImg.url} alt="" className="w-full h-full object-cover" />  // eslint-disable-line @next/next/no-img-element
                            : <Package size={14} style={{ color: '#333' }} />
                          }
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: '#F5F0E8' }}>{p.name}</p>
                          <p className="text-xs" style={{ color: '#666' }}>{p.brand} · {p.concentration} · {p.volume_ml}ml</p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#1a1a1a', color: '#C9A84C', border: '1px solid #2a2a2a' }}>
                        {CATEGORY_LABELS[p.category]}
                      </span>
                    </td>

                    {/* Género */}
                    <td className="px-4 py-3 text-xs" style={{ color: '#aaa' }}>
                      {GENDER_LABELS[p.gender]}
                    </td>

                    {/* Precio */}
                    <td className="px-4 py-3">
                      <span className="font-medium" style={{ color: '#F5F0E8' }}>${p.price}</span>
                      {p.original_price && (
                        <span className="text-xs ml-1 line-through" style={{ color: '#555' }}>${p.original_price}</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: p.in_stock ? '#0a2010' : '#200a0a',
                          color: p.in_stock ? '#4CAF50' : '#f87171',
                          border: `1px solid ${p.in_stock ? '#1a4020' : '#4a1a1a'}`,
                        }}
                      >
                        {p.in_stock ? 'En stock' : 'Sin stock'}
                      </span>
                    </td>

                    {/* Destacado */}
                    <td className="px-4 py-3">
                      {p.featured && <Star size={14} style={{ color: '#C9A84C' }} fill="#C9A84C" />}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      {confirmId === p.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: '#aaa' }}>¿Eliminar?</span>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deleting === p.id}
                            className="text-xs px-2 py-1 rounded transition-colors"
                            style={{ background: '#4a1a1a', color: '#f87171', border: '1px solid #6a2a2a' }}
                          >
                            {deleting === p.id ? '…' : 'Sí'}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a' }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/perfumes/${p.id}/edit`)}
                            className="p-2 rounded transition-colors hover:opacity-80"
                            style={{ color: '#C9A84C' }}
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmId(p.id)}
                            className="p-2 rounded transition-colors hover:opacity-80"
                            style={{ color: '#f87171' }}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
