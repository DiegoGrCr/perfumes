'use client'
import React, { useRef, useState, useEffect, DragEvent } from 'react'
import { Upload, X, Star, Wand2, Loader2, Check, Eraser, Paintbrush } from 'lucide-react'
import { PerfumeImage } from '@/types/perfume'
import { refineMask, applyAlpha, estimateBackground, trimCanvas, CleanupLevel } from '@/lib/bg-cleanup'

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
/** Longest side used for processing — plenty for the storefront, keeps the AI + cleanup fast. */
const MAX_SIDE = 2000

interface Segmentation { data: ImageData; raw: Float32Array }

// Singleton del modelo RMBG (se carga una sola vez y queda en memoria)
let _rmbgModel:     unknown = null
let _rmbgProcessor: unknown = null

// ── Canvas retoque ────────────────────────────────────────────────────────────
const CHECKER = {
  backgroundImage: 'linear-gradient(45deg,#333 25%,transparent 25%),linear-gradient(-45deg,#333 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#333 75%),linear-gradient(-45deg,transparent 75%,#333 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0,0 8px,8px -8px,-8px 0',
}

const PREVIEW_BGS = {
  cuadros: { label: 'Cuadros', style: CHECKER },
  tienda:  { label: 'Tienda',  style: { background: '#EEE6DC' } },
  oscuro:  { label: 'Oscuro',  style: { background: '#120C0B' } },
} as const

const LEVELS: { id: CleanupLevel; label: string; hint: string }[] = [
  { id: 'suave',  label: 'Suave',  hint: 'Conserva más detalle (vidrio, sombras finas).' },
  { id: 'normal', label: 'Normal', hint: 'Recomendado para la mayoría de las fotos.' },
  { id: 'fuerte', label: 'Fuerte', hint: 'Elimina más restos y manchas; puede comerse orillas finas.' },
]

function BgRemovalEditor({
  originalFile, resultBlob, level, onLevelChange, onApprove, onCancel,
}: {
  originalFile: File
  resultBlob:   Blob
  level?:       CleanupLevel
  onLevelChange?: (l: CleanupLevel) => Promise<void>
  onApprove:    (blob: Blob) => void
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
  const [previewBg, setPreviewBg] = useState<keyof typeof PREVIEW_BGS>('tienda')
  const [trim,      setTrim]      = useState(true)
  const [recomputing, setRecomputing] = useState(false)

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

    // Original: URL fresca desde el File — nunca queda inválida
    const origUrl = URL.createObjectURL(originalFile)
    const orig = new Image()
    orig.src = origUrl
    origImgRef.current = orig
    orig.onload  = () => { /* listo para modo restaurar */ }
    orig.onerror = () => console.warn('Original image failed to load')

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
    return () => { URL.revokeObjectURL(origUrl) }
  }, [resultBlob, originalFile])

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
      // naturalWidth === 0 significa imagen rota o no cargada aún
      if (!orig) return
      const isReady = orig.complete && orig.naturalWidth > 0
      const doDraw = () => {
        if (!origImgRef.current?.naturalWidth) return
        ctx.save()
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(origImgRef.current, 0, 0, canvas.width, canvas.height)
        ctx.restore()
      }
      if (!isReady) { orig.onload = doDraw; return }
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
    const canvas = canvasRef.current
    if (!canvas) return
    // Crop to the product with even padding so every photo is framed the same
    const out = trim ? trimCanvas(canvas) : canvas
    out.toBlob(b => { if (b) onApprove(b) }, 'image/png')
  }

  async function changeLevel(l: CleanupLevel) {
    if (!onLevelChange || l === level) return
    setRecomputing(true)
    setReady(false)
    await onLevelChange(l)
    setRecomputing(false)
  }

  const accent = mode === 'restore' ? '#a78bfa' : '#f87171'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl p-5 space-y-4"
        style={{ background: '#111', border: '1px solid #2a2a2a' }}>

        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium tracking-widest uppercase" style={{ color: '#C9A84C' }}>
            Revisar y retocar
          </h3>
          <button type="button" onClick={onCancel} style={{ color: '#555' }}><X size={16} /></button>
        </div>

        {/* Limpieza automática */}
        {onLevelChange && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>Limpieza</span>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                {LEVELS.map(l => (
                  <button key={l.id} type="button" onClick={() => changeLevel(l.id)} disabled={recomputing}
                    className="px-3 py-1.5 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-60"
                    style={{ background: level === l.id ? '#C9A84C' : '#1a1a1a', color: level === l.id ? '#000' : '#888' }}>
                    {l.label}
                  </button>
                ))}
              </div>
              {recomputing && <Loader2 size={13} className="animate-spin" style={{ color: '#C9A84C' }} />}
            </div>
            <p className="text-[10px]" style={{ color: '#555' }}>
              {LEVELS.find(l => l.id === level)?.hint} Elige el nivel antes de retocar con el pincel.
            </p>
          </div>
        )}

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
        <div className="flex items-center justify-end gap-1">
          <span className="mr-1 text-[10px] uppercase tracking-wider" style={{ color: '#555' }}>Ver sobre</span>
          {(Object.keys(PREVIEW_BGS) as (keyof typeof PREVIEW_BGS)[]).map(k => (
            <button key={k} type="button" onClick={() => setPreviewBg(k)}
              className="rounded px-2 py-1 text-[10px] transition-colors"
              style={{ background: previewBg === k ? '#2a2a2a' : 'transparent', color: previewBg === k ? '#F5F0E8' : '#555' }}>
              {PREVIEW_BGS[k].label}
            </button>
          ))}
        </div>
        <div className="rounded-xl overflow-hidden mx-auto"
          style={{ position: 'relative', width: 'fit-content', maxWidth: '100%', ...PREVIEW_BGS[previewBg].style }}>

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

        <label className="flex items-center gap-2 text-[11px] cursor-pointer" style={{ color: '#888' }}>
          <input type="checkbox" checked={trim} onChange={e => setTrim(e.target.checked)} />
          Recortar al producto con margen uniforme (todas las fotos quedan del mismo encuadre)
        </label>

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
    statusMsg: string
    resultBlob: Blob | null
    error: string | null
    seg: Segmentation | null
    level: CleanupLevel
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

  // ── 1) Segmentación: imagen (máx. 2000 px) + máscara cruda 0..1 ─────────────
  // La máscara se guarda para poder cambiar el nivel de limpieza sin volver a correr la IA.
  async function loadScaled(file: File): Promise<{ data: ImageData; canvas: HTMLCanvasElement }> {
    const url = URL.createObjectURL(file)
    try {
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image()
        im.onload = () => res(im)
        im.onerror = () => rej(new Error('No se pudo leer la imagen'))
        im.src = url
      })
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      return { data: ctx.getImageData(0, 0, canvas.width, canvas.height), canvas }
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  // RMBG-1.4 (BRIA AI) vía @huggingface/transformers.
  // Calidad: WebGPU → fp16 (~88 MB); sin WebGPU → fp32 (~176 MB); si falla → q8 (~44 MB).
  // Se descarga una sola vez y queda en caché del navegador.
  async function segmentWithRMBG(file: File, onStatus: (msg: string) => void): Promise<Segmentation> {
    const { AutoModel, AutoProcessor, RawImage } = await import('@huggingface/transformers')

    if (!_rmbgModel || !_rmbgProcessor) {
      const hasGPU = typeof navigator !== 'undefined' && 'gpu' in navigator
      const attempts: { device: string; dtype: string; label: string }[] = hasGPU
        ? [{ device: 'webgpu', dtype: 'fp16', label: '~88 MB' }, { device: 'wasm', dtype: 'fp32', label: '~176 MB' }, { device: 'wasm', dtype: 'q8', label: '~44 MB' }]
        : [{ device: 'wasm', dtype: 'fp32', label: '~176 MB' }, { device: 'wasm', dtype: 'q8', label: '~44 MB' }]
      let lastErr: unknown
      for (const a of attempts) {
        try {
          onStatus(`Descargando modelo IA de alta calidad (${a.label}, solo la primera vez)…`)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          _rmbgModel = await (AutoModel as any).from_pretrained('briaai/RMBG-1.4', {
            config: { model_type: 'custom' }, device: a.device, dtype: a.dtype,
          })
          break
        } catch (e) { lastErr = e; _rmbgModel = null }
      }
      if (!_rmbgModel) throw lastErr
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _rmbgProcessor = await (AutoProcessor as any).from_pretrained('briaai/RMBG-1.4', {
        config: {
          do_normalize: true, do_pad: false, do_rescale: true, do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          feature_extractor_type: 'ImageFeatureExtractor',
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 },
        },
      })
    }

    onStatus('Detectando el producto…')
    const { data, canvas } = await loadScaled(file)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const image = await (RawImage as any).fromCanvas(canvas)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { pixel_values } = await (_rmbgProcessor as any)(image)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { output } = await (_rmbgModel as any)({ input: pixel_values })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mask = await (RawImage as any).fromTensor(output[0].mul(255).to('uint8')).resize(data.width, data.height)
    const m = mask.data as Uint8Array
    const raw = new Float32Array(data.width * data.height)
    // fromTensor may return 1 or more channels — read the first one
    const ch = Math.max(1, Math.round(m.length / raw.length))
    for (let i = 0; i < raw.length; i++) raw[i] = m[i * ch] / 255
    return { data, raw }
  }

  // Fallback sin descarga: fondo por color + flood-fill desde los bordes
  async function segmentByColor(file: File): Promise<Segmentation> {
    const { data } = await loadScaled(file)
    const { width, height } = data
    const px = data.data
    const n = width * height

    const S = 5
    let sr = 0, sg = 0, sb = 0, sc = 0
    for (let dy = 0; dy < S; dy++) {
      for (let dx = 0; dx < S; dx++) {
        for (const i of [
          dx + dy * width, (width - 1 - dx) + dy * width,
          dx + (height - 1 - dy) * width, (width - 1 - dx) + (height - 1 - dy) * width,
        ]) { sr += px[i*4]; sg += px[i*4+1]; sb += px[i*4+2]; sc++ }
      }
    }
    const bgR = sr / sc, bgG = sg / sc, bgB = sb / sc

    const THRESH = 50
    const isMaybe = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      const dr = px[i*4] - bgR, dg = px[i*4+1] - bgG, db = px[i*4+2] - bgB
      if (dr*dr + dg*dg + db*db <= THRESH * THRESH) isMaybe[i] = 1
    }
    const isBG = new Uint8Array(n)
    const queue = new Int32Array(n)
    let head = 0, tail = 0
    const seed = (i: number) => { if (isMaybe[i] && !isBG[i]) { isBG[i] = 1; queue[tail++] = i } }
    for (let x = 0; x < width; x++) { seed(x); seed((height-1)*width+x) }
    for (let y = 1; y < height-1; y++) { seed(y*width); seed(y*width+width-1) }
    while (head < tail) {
      const i = queue[head++]
      const x = i % width, y = (i / width) | 0
      if (x > 0 && isMaybe[i-1] && !isBG[i-1]) { isBG[i-1] = 1; queue[tail++] = i-1 }
      if (x < width-1 && isMaybe[i+1] && !isBG[i+1]) { isBG[i+1] = 1; queue[tail++] = i+1 }
      if (y > 0 && isMaybe[i-width] && !isBG[i-width]) { isBG[i-width] = 1; queue[tail++] = i-width }
      if (y < height-1 && isMaybe[i+width] && !isBG[i+width]) { isBG[i+width] = 1; queue[tail++] = i+width }
    }
    // Slight blur so refineMask gets a soft edge to work with
    const raw = new Float32Array(n)
    for (let i = 0; i < n; i++) raw[i] = isBG[i] ? 0 : 1
    const tmp = new Float32Array(n)
    const K = 2
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      let s = 0, c = 0
      for (let dx = -K; dx <= K; dx++) { const nx = x + dx; if (nx >= 0 && nx < width) { s += raw[y*width+nx]; c++ } }
      tmp[y*width+x] = s / c
    }
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      let s = 0, c = 0
      for (let dy = -K; dy <= K; dy++) { const ny = y + dy; if (ny >= 0 && ny < height) { s += tmp[ny*width+x]; c++ } }
      raw[y*width+x] = s / c
    }
    return { data, raw }
  }

  // ── 2) Composición: máscara limpia + bordes sin halo → PNG ──────────────────
  function compose(seg: Segmentation, level: CleanupLevel): Promise<Blob> {
    const { data, raw } = seg
    const { width: w, height: h } = data
    const rgba = new Uint8ClampedArray(data.data)
    const bg = estimateBackground(data.data, raw, w, h)
    const alpha = refineMask(raw, w, h, level, data.data, bg)
    applyAlpha(rgba, alpha, bg)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    canvas.getContext('2d')!.putImageData(new ImageData(rgba, w, h), 0, 0)
    return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('No se pudo generar el PNG'))), 'image/png'))
  }

  async function handleRemoveBg(index: number) {
    const setStatus = (msg: string) =>
      setBgState(prev => prev ? { ...prev, statusMsg: msg } : null)

    setBgState({ index, processing: true, statusMsg: 'Eliminando fondo…', resultBlob: null, error: null, seg: null, level: 'normal' })
    await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))
    let seg: Segmentation
    try {
      seg = await segmentWithRMBG(newImages[index].file, setStatus)
    } catch {
      try {
        setStatus('Usando método alternativo…')
        seg = await segmentByColor(newImages[index].file)
      } catch (err2) {
        setBgState(prev => prev ? { ...prev, processing: false, error: err2 instanceof Error ? err2.message : 'No se pudo procesar la imagen.' } : null)
        return
      }
    }
    setStatus('Limpiando bordes y restos de fondo…')
    await new Promise<void>(r => requestAnimationFrame(() => r()))
    const blob = await compose(seg, 'normal')
    setBgState({ index, processing: false, statusMsg: '', resultBlob: blob, error: null, seg, level: 'normal' })
  }

  async function handleLevelChange(level: CleanupLevel) {
    if (!bgState?.seg) return
    const blob = await compose(bgState.seg, level)
    setBgState(prev => prev ? { ...prev, level, resultBlob: blob } : null)
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
            <p className="text-sm" style={{ color: '#888' }}>{bgState?.statusMsg || 'Eliminando fondo…'}</p>
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
          originalFile={newImages[bgState.index]!.file}
          resultBlob={bgState.resultBlob}
          level={bgState.level}
          onLevelChange={bgState.seg ? handleLevelChange : undefined}
          onApprove={handleApproveResult}
          onCancel={handleCancelBg}
        />
      )}
    </div>
  )
}
