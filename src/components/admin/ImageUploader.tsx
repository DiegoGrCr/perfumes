'use client'
import React, { useRef, useState, useEffect, DragEvent } from 'react'
import { Upload, X, Star, Wand2, Loader2, Check, Eraser, Paintbrush } from 'lucide-react'
import { PerfumeImage } from '@/types/perfume'

export interface NewImageFile {
  file: File
  preview: string
  isPrimary: boolean
}

interface ImageUploaderProps {
  existingImages: PerfumeImage[]
  newImages: NewImageFile[]
  onAddImages:    (files: NewImageFile[]) => void
  onRemoveExisting: (image: PerfumeImage) => void
  onRemoveNew:    (index: number) => void
  onReplaceNew:   (index: number, replacement: NewImageFile) => void
  onSetPrimary:   (source: 'existing' | 'new', id: string | number) => void
}

const MAX_IMAGES = 3

// ── Canvas retoque ────────────────────────────────────────────────────────────
const CHECKER = {
  backgroundImage: 'linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
}

function BgRemovalEditor({
  originalSrc, resultBlob, onApprove, onCancel,
}: {
  originalSrc: string
  resultBlob:  Blob
  onApprove:   (blob: Blob) => void
  onCancel:    () => void
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const origImgRef = useRef<HTMLImageElement | null>(null)
  const drawing    = useRef(false)
  // Refs para evitar closures obsoletas en doPaint
  const modeRef    = useRef<'restore' | 'erase'>('restore')
  const brushRef   = useRef(28)
  const readyRef   = useRef(false)

  const [mode,      setMode]      = useState<'restore' | 'erase'>('restore')
  const [brushSize, setBrushSize] = useState(28)
  const [ready,     setReady]     = useState(false)
  const [cursor,    setCursor]    = useState<{ x: number; y: number } | null>(null)

  // Mantener refs sincronizados con el estado
  useEffect(() => { modeRef.current  = mode      }, [mode])
  useEffect(() => { brushRef.current = brushSize }, [brushSize])
  useEffect(() => { readyRef.current = ready     }, [ready])

  // Soltar el pincel aunque el mouseup ocurra fuera del canvas
  useEffect(() => {
    const stop = () => { drawing.current = false }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  // Carga resultado en canvas + guarda original en memoria
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // Original: en memoria para modo restaurar (sin mostrarlo como ghost)
    const orig = new Image()
    orig.src = originalSrc
    origImgRef.current = orig

    // Resultado: única imagen necesaria para activar el editor
    const url = URL.createObjectURL(resultBlob)
    const img = new Image()
    img.onload = () => {
      canvas.width  = img.width
      canvas.height = img.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      readyRef.current = true
      setReady(true)
    }
    img.onerror = () => { URL.revokeObjectURL(url) }
    img.src = url
  }, [resultBlob, originalSrc])

  // Lee siempre de refs → nunca hay closure stale
  function paintAt(clientX: number, clientY: number) {
    if (!drawing.current || !readyRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    const sx   = canvas.width  / rect.width
    const sy   = canvas.height / rect.height
    const x    = (clientX - rect.left) * sx
    const y    = (clientY - rect.top)  * sy
    const r    = (brushRef.current / 2) * Math.max(sx, sy)

    if (modeRef.current === 'restore') {
      const orig = origImgRef.current
      if (!orig) return
      const doDraw = () => {
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(orig, 0, 0, canvas.width, canvas.height)
        ctx.restore()
      }
      if (!orig.complete) { orig.onload = doDraw; return }
      ctx.save()
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(orig, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    } else {
      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0,0,0,1)'
      ctx.fill()
      ctx.restore()
    }
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    paintAt(e.clientX, e.clientY)
  }

  // Touch: listeners no-pasivos para poder llamar preventDefault() y evitar scroll
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      drawing.current = true
      const t = e.touches[0]
      if (!t) return
      const rect = canvas!.getBoundingClientRect()
      setCursor({ x: t.clientX - rect.left, y: t.clientY - rect.top })
      paintAt(t.clientX, t.clientY)
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      const t = e.touches[0]
      if (!t) return
      const rect = canvas!.getBoundingClientRect()
      setCursor({ x: t.clientX - rect.left, y: t.clientY - rect.top })
      paintAt(t.clientX, t.clientY)
    }
    function onTouchEnd() {
      drawing.current = false
      setCursor(null)
    }

    canvas.addEventListener('touchstart',  onTouchStart,  { passive: false })
    canvas.addEventListener('touchmove',   onTouchMove,   { passive: false })
    canvas.addEventListener('touchend',    onTouchEnd)
    canvas.addEventListener('touchcancel', onTouchEnd)
    return () => {
      canvas.removeEventListener('touchstart',  onTouchStart)
      canvas.removeEventListener('touchmove',   onTouchMove)
      canvas.removeEventListener('touchend',    onTouchEnd)
      canvas.removeEventListener('touchcancel', onTouchEnd)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  function handleApprove() {
    canvasRef.current?.toBlob(b => { if (b) onApprove(b) }, 'image/png')
  }

  const accent = mode === 'restore' ? '#a78bfa' : '#f87171'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="w-full max-w-2xl rounded-2xl p-5 space-y-4"
        style={{ background: '#111', border: '1px solid #2a2a2a' }}>

        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium tracking-widest uppercase" style={{ color: '#C9A84C' }}>
            Revisar y retocar
          </h3>
          <button type="button" onClick={onCancel} style={{ color: '#555' }}><X size={16} /></button>
        </div>

        {/* Herramientas */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
            <button type="button" onClick={() => setMode('restore')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors"
              style={{ background: mode === 'restore' ? '#a78bfa' : '#1a1a1a', color: mode === 'restore' ? '#fff' : '#666' }}>
              <Paintbrush size={11} /> Restaurar
            </button>
            <button type="button" onClick={() => setMode('erase')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors"
              style={{ background: mode === 'erase' ? '#f87171' : '#1a1a1a', color: mode === 'erase' ? '#fff' : '#666' }}>
              <Eraser size={11} /> Borrar más
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-36">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>Tamaño</span>
            <input type="range" min={8} max={80} value={brushSize}
              onChange={e => setBrushSize(+e.target.value)}
              className="flex-1" style={{ accentColor: accent }} />
            <span className="text-[10px] w-6 text-center" style={{ color: '#666' }}>{brushSize}</span>
          </div>
        </div>

        <p className="text-[10px]" style={{ color: '#555' }}>
          {mode === 'restore'
            ? 'La imagen original aparece de guía (transparente). Pinta encima para recuperar partes del frasco borradas por error.'
            : 'Pinta sobre restos de fondo que no se eliminaron para borrarlos.'}
        </p>

        {/* Área canvas con ghost original de guía */}
        {/* fit-content hace que el div encoja al ancho exacto del canvas */}
        <div className="rounded-xl overflow-hidden mx-auto"
          style={{ position: 'relative', width: 'fit-content', maxWidth: '100%', ...CHECKER }}>

          {/* Canvas de trabajo */}
          <canvas
            ref={canvasRef}
            style={{
              display: 'block', position: 'relative',
              maxWidth: '100%', maxHeight: '380px',
              cursor: 'none',
            }}
            onMouseDown={e => { e.preventDefault(); drawing.current = true }}
            onMouseUp={e => { e.preventDefault(); drawing.current = false }}
            onMouseLeave={() => { drawing.current = false; setCursor(null) }}
            onMouseMove={onMouseMove}
          />

          {/* Círculo del pincel */}
          {cursor && ready && (
            <div style={{
              position: 'absolute',
              left:   cursor.x - brushSize / 2,
              top:    cursor.y - brushSize / 2,
              width:  brushSize,
              height: brushSize,
              borderRadius: '50%',
              border: `2px solid ${accent}`,
              boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }} />
          )}

          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin" style={{ color: '#a78bfa' }} />
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={handleApprove}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs uppercase tracking-widest font-medium"
            style={{ background: '#a78bfa', color: '#fff' }}>
            <Check size={13} /> Usar imagen
          </button>
          <button type="button" onClick={onCancel}
            className="px-5 py-2 rounded-full text-xs uppercase tracking-widest"
            style={{ border: '1px solid #2a2a2a', color: '#666' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ImageUploader principal ───────────────────────────────────────────────────
export function ImageUploader({
  existingImages, newImages, onAddImages,
  onRemoveExisting, onRemoveNew, onReplaceNew, onSetPrimary,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [bgState, setBgState]   = useState<{
    index: number
    processing: boolean
    resultBlob: Blob | null
    error: string | null
  } | null>(null)

  const totalCount = existingImages.length + newImages.length
  const canAdd     = totalCount < MAX_IMAGES

  function processFiles(fileList: FileList) {
    const remaining = MAX_IMAGES - totalCount
    const files = Array.from(fileList).slice(0, remaining)
    const entries: NewImageFile[] = files.map((file, i) => ({
      file,
      preview: URL.createObjectURL(file),
      isPrimary: totalCount === 0 && i === 0,
    }))
    if (entries.length > 0) onAddImages(entries)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files)
  }

  // Rellena huecos interiores del sujeto (partes blancas del frasco que la IA quitó por error)
  // usando flood-fill desde los 4 bordes: solo los píxeles transparentes conectados
  // al borde son fondo real; el resto son huecos internos → se restauran.
  async function fixMask(inputBlob: Blob): Promise<Blob> {
    return new Promise(resolve => {
      const url = URL.createObjectURL(inputBlob)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        const { width, height } = img
        const c = document.createElement('canvas')
        c.width = width; c.height = height
        const ctx = c.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, width, height)
        const px = imgData.data
        const n  = width * height

        // isFG: 1 = el modelo dejó este píxel como sujeto
        const THRESH = 64
        const isFG = new Uint8Array(n)
        for (let i = 0; i < n; i++) isFG[i] = px[i * 4 + 3] >= THRESH ? 1 : 0

        // BFS desde todos los píxeles de borde que son transparentes → fondo confirmado
        const isBG = new Uint8Array(n)
        const queue = new Int32Array(n)
        let head = 0, tail = 0

        const seed = (i: number) => { if (!isFG[i] && !isBG[i]) { isBG[i] = 1; queue[tail++] = i } }

        for (let x = 0; x < width; x++)  { seed(x); seed((height - 1) * width + x) }
        for (let y = 1; y < height - 1; y++) { seed(y * width); seed(y * width + width - 1) }

        while (head < tail) {
          const i = queue[head++]
          const x = i % width, y = (i / width) | 0
          if (x > 0         && !isFG[i - 1]     && !isBG[i - 1])     { isBG[i - 1]     = 1; queue[tail++] = i - 1 }
          if (x < width - 1 && !isFG[i + 1]     && !isBG[i + 1])     { isBG[i + 1]     = 1; queue[tail++] = i + 1 }
          if (y > 0         && !isFG[i - width]  && !isBG[i - width]) { isBG[i - width] = 1; queue[tail++] = i - width }
          if (y < height - 1&& !isFG[i + width]  && !isBG[i + width]) { isBG[i + width] = 1; queue[tail++] = i + width }
        }

        // Transparente pero NO conectado al borde = hueco interior → restaurar opaco
        for (let i = 0; i < n; i++) {
          if (!isFG[i] && !isBG[i]) px[i * 4 + 3] = 255
        }

        // Suavizar orillas: feathering de 3px en la frontera sujeto↔fondo real
        const orig = new Float32Array(n)
        for (let i = 0; i < n; i++) orig[i] = px[i * 4 + 3] / 255
        const FEATHER = 3
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x
            if (orig[idx] > 0.5) continue
            if (!isBG[idx]) continue  // hueco ya restaurado, no tocar
            let best = 0
            for (let dy = -FEATHER; dy <= FEATHER; dy++) {
              for (let dx = -FEATHER; dx <= FEATHER; dx++) {
                const nx = x + dx, ny = y + dy
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
                if (orig[ny * width + nx] <= 0.5) continue
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist > FEATHER) continue
                const a = 1 - dist / (FEATHER + 1)
                if (a > best) best = a
              }
            }
            if (best > 0) px[idx * 4 + 3] = Math.round(best * 255)
          }
        }

        ctx.putImageData(imgData, 0, 0)
        c.toBlob(b => resolve(b!), 'image/png')
      }
      img.src = url
    })
  }

  async function handleRemoveBg(index: number) {
    setBgState({ index, processing: true, resultBlob: null, error: null })
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    try {
      const { removeBackground } = await import('@imgly/background-removal')
      const raw  = await removeBackground(newImages[index].file, { debug: false })
      const blob = await fixMask(raw)
      setBgState({ index, processing: false, resultBlob: blob, error: null })
    } catch {
      setBgState(prev => prev ? { ...prev, processing: false, error: 'No se pudo procesar la imagen. Intenta con otra.' } : null)
    }
  }

  function handleApproveResult(blob: Blob) {
    if (!bgState) return
    const { index } = bgState
    const original  = newImages[index]
    const newFile   = new File([blob], original.file.name.replace(/\.\w+$/, '.png'), { type: 'image/png' })
    onReplaceNew(index, { file: newFile, preview: URL.createObjectURL(blob), isPrimary: original.isPrimary })
    setBgState(null)
  }

  function handleCancelBg() {
    setBgState(null)
  }

  return (
    <div>
      <label className="block text-xs font-medium mb-2 uppercase tracking-widest" style={{ color: '#C9A84C' }}>
        Fotos del perfume <span style={{ color: '#666' }}>({totalCount}/{MAX_IMAGES})</span>
      </label>

      <div className="flex flex-wrap gap-3 mb-3">
        {/* Imágenes existentes */}
        {existingImages.map(img => (
          <div key={img.id} className="relative group w-24 h-24 rounded overflow-hidden"
            style={{ border: img.is_primary ? '2px solid #C9A84C' : '2px solid #2a2a2a' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.75)' }}>
              {!img.is_primary && (
                <button type="button" onClick={() => onSetPrimary('existing', img.id)}
                  className="p-1 rounded-full" style={{ color: '#C9A84C' }}>
                  <Star size={13} />
                </button>
              )}
              <button type="button" onClick={() => onRemoveExisting(img)}
                className="p-1 rounded-full text-red-400">
                <X size={13} />
              </button>
            </div>
            {img.is_primary && (
              <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold py-0.5"
                style={{ background: '#C9A84C', color: '#000' }}>PRINCIPAL</span>
            )}
          </div>
        ))}

        {/* Nuevas imágenes */}
        {newImages.map((img, idx) => (
          <div key={idx} className="relative group w-24 h-24 rounded overflow-hidden"
            style={{ border: img.isPrimary ? '2px solid #C9A84C' : '2px solid #3a3a3a' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.78)' }}>
              {!img.isPrimary && (
                <button type="button" onClick={() => onSetPrimary('new', idx)}
                  title="Hacer principal" className="p-1 rounded-full" style={{ color: '#C9A84C' }}>
                  <Star size={12} />
                </button>
              )}
              <button type="button" onClick={() => handleRemoveBg(idx)}
                title="Eliminar fondo con IA"
                className="p-1 rounded-full" style={{ color: '#a78bfa' }}>
                <Wand2 size={12} />
              </button>
              <button type="button" onClick={() => onRemoveNew(idx)}
                className="p-1 rounded-full text-red-400">
                <X size={12} />
              </button>
            </div>
            {img.isPrimary && (
              <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold py-0.5"
                style={{ background: '#C9A84C', color: '#000' }}>PRINCIPAL</span>
            )}
            <span className="absolute top-1 left-1 text-[8px] px-1 rounded"
              style={{ background: 'rgba(0,0,0,0.7)', color: '#aaa' }}>nueva</span>
          </div>
        ))}

        {/* Zona drop */}
        {canAdd && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
            style={{
              border: `2px dashed ${dragging ? '#C9A84C' : '#333'}`,
              background: dragging ? '#1a1400' : '#0d0d0d',
              color: dragging ? '#C9A84C' : '#555',
            }}
          >
            <Upload size={18} />
            <span className="text-[10px] text-center leading-tight">
              {dragging ? 'Soltar' : 'Agregar foto'}
            </span>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple className="hidden"
        onChange={e => e.target.files && processFiles(e.target.files)} />

      <p className="text-xs" style={{ color: '#555' }}>
        Máx. {MAX_IMAGES} fotos · JPG, PNG o WebP · hasta 5 MB ·{' '}
        <span style={{ color: '#a78bfa' }}>
          <Wand2 size={10} className="inline mb-0.5" /> elimina fondo con IA (retocable)
        </span>
      </p>

      {/* ── Procesando ── */}
      {bgState?.processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="rounded-2xl p-8 flex flex-col items-center gap-4"
            style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <Loader2 size={36} className="animate-spin" style={{ color: '#a78bfa' }} />
            <p className="text-sm" style={{ color: '#888' }}>Eliminando fondo…</p>
            <p className="text-xs" style={{ color: '#555' }}>La primera vez descarga el modelo (~15 MB)</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {bgState && !bgState.processing && bgState.error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="rounded-2xl p-6 space-y-4" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
            <p className="text-sm" style={{ color: '#f87171' }}>{bgState.error}</p>
            <button type="button" onClick={handleCancelBg}
              className="px-4 py-2 rounded-full text-xs uppercase tracking-widest"
              style={{ border: '1px solid #2a2a2a', color: '#666' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── Editor de retoque ── */}
      {bgState && !bgState.processing && !bgState.error && bgState.resultBlob && (
        <BgRemovalEditor
          originalSrc={newImages[bgState.index]?.preview ?? ''}
          resultBlob={bgState.resultBlob}
          onApprove={handleApproveResult}
          onCancel={handleCancelBg}
        />
      )}
    </div>
  )
}
