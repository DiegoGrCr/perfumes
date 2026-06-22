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

  // Elimina fondo por color + flood-fill desde bordes.
  // Funciona bien para fondos sólidos (blanco, gris, etc.) sin afectar
  // las partes del frasco que coinciden en color con el fondo.
  async function removeBgByColor(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
      img.onload = () => {
        URL.revokeObjectURL(url)
        const { width, height } = img
        const cv = document.createElement('canvas')
        cv.width = width; cv.height = height
        const ctx = cv.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, width, height)
        const px = imgData.data
        const n  = width * height

        // 1. Muestra el color de fondo desde las 4 esquinas (5×5 px cada una)
        const S = 5
        let sr = 0, sg = 0, sb = 0, sc = 0
        for (let dy = 0; dy < S; dy++) {
          for (let dx = 0; dx < S; dx++) {
            for (const i of [
              dx + dy * width,
              (width - 1 - dx) + dy * width,
              dx + (height - 1 - dy) * width,
              (width - 1 - dx) + (height - 1 - dy) * width,
            ]) {
              sr += px[i*4]; sg += px[i*4+1]; sb += px[i*4+2]; sc++
            }
          }
        }
        const bgR = sr / sc, bgG = sg / sc, bgB = sb / sc

        // 2. Marcar píxeles candidatos a fondo (similares en color al fondo muestreado)
        // Umbral amplio para capturar gradientes de borde
        const THRESH = 50
        const isMaybe = new Uint8Array(n)
        for (let i = 0; i < n; i++) {
          const dr = px[i*4]   - bgR
          const dg = px[i*4+1] - bgG
          const db = px[i*4+2] - bgB
          if (dr*dr + dg*dg + db*db <= THRESH * THRESH) isMaybe[i] = 1
        }

        // 3. Flood-fill desde los 4 bordes → solo lo conectado al exterior es fondo
        const isBG = new Uint8Array(n)
        const queue = new Int32Array(n)
        let head = 0, tail = 0
        const seed = (i: number) => { if (isMaybe[i] && !isBG[i]) { isBG[i] = 1; queue[tail++] = i } }
        for (let x = 0; x < width; x++) { seed(x); seed((height-1)*width+x) }
        for (let y = 1; y < height-1; y++) { seed(y*width); seed(y*width+width-1) }
        while (head < tail) {
          const i = queue[head++]
          const x = i % width, y = (i / width) | 0
          if (x > 0          && isMaybe[i-1]     && !isBG[i-1])     { isBG[i-1]     = 1; queue[tail++] = i-1     }
          if (x < width-1    && isMaybe[i+1]     && !isBG[i+1])     { isBG[i+1]     = 1; queue[tail++] = i+1     }
          if (y > 0          && isMaybe[i-width]  && !isBG[i-width]) { isBG[i-width] = 1; queue[tail++] = i-width }
          if (y < height-1   && isMaybe[i+width]  && !isBG[i+width]) { isBG[i+width] = 1; queue[tail++] = i+width }
        }

        // 4. Alpha inicial: fondo=0, sujeto=255
        for (let i = 0; i < n; i++) px[i*4+3] = isBG[i] ? 0 : 255

        // 5. Feathering: box-blur separable sobre el canal alpha (suaviza orillas)
        const alpha = new Float32Array(n)
        for (let i = 0; i < n; i++) alpha[i] = px[i*4+3] / 255
        const tmp = new Float32Array(n)
        const K = 2  // radio del blur
        for (let y = 0; y < height; y++) {       // blur horizontal
          for (let x = 0; x < width; x++) {
            let s = 0, c = 0
            for (let dx = -K; dx <= K; dx++) {
              const nx = x + dx
              if (nx >= 0 && nx < width) { s += alpha[y*width+nx]; c++ }
            }
            tmp[y*width+x] = s / c
          }
        }
        for (let y = 0; y < height; y++) {       // blur vertical
          for (let x = 0; x < width; x++) {
            let s = 0, c = 0
            for (let dy = -K; dy <= K; dy++) {
              const ny = y + dy
              if (ny >= 0 && ny < height) { s += tmp[ny*width+x]; c++ }
            }
            px[(y*width+x)*4+3] = Math.round(s / c * 255)
          }
        }

        ctx.putImageData(imgData, 0, 0)
        cv.toBlob(b => resolve(b!), 'image/png')
      }
      img.src = url
    })
  }

  async function handleRemoveBg(index: number) {
    setBgState({ index, processing: true, resultBlob: null, error: null })
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    try {
      const blob = await removeBgByColor(newImages[index].file)
      setBgState({ index, processing: false, resultBlob: blob, error: null })
    } catch (err) {
      setBgState(prev => prev ? { ...prev, processing: false, error: err instanceof Error ? err.message : 'No se pudo procesar la imagen.' } : null)
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
          <Wand2 size={10} className="inline mb-0.5" /> elimina fondo automático (retocable)
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
