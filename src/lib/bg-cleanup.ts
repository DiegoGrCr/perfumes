/**
 * Post-processing for AI background-removal masks.
 *
 * The raw model mask is "soft": background pixels often keep a small non-zero
 * alpha (specks / haze), stray blobs survive far from the product, small holes
 * appear inside glass, and edge pixels still carry the old background colour
 * (white halo). These helpers fix each of those.
 */

export type CleanupLevel = 'suave' | 'normal' | 'fuerte'

const PRESETS: Record<CleanupLevel, { lo: number; hi: number; islandFrac: number; holeFrac: number }> = {
  //            alpha below lo → 0, above hi → 1 | drop blobs < islandFrac of the main one | fill holes < holeFrac of subject
  suave:  { lo: 0.06, hi: 0.92, islandFrac: 0.004, holeFrac: 0.0015 },
  normal: { lo: 0.14, hi: 0.86, islandFrac: 0.015, holeFrac: 0.006 },
  fuerte: { lo: 0.24, hi: 0.78, islandFrac: 0.05,  holeFrac: 0.02 },
}

/** Maps v so that ≤lo → 0, ≥hi → 1, linear in between. */
function levelsOf(v: number, lo: number, hi: number) {
  const t = (v - lo) / (hi - lo)
  return t <= 0 ? 0 : t >= 1 ? 1 : t
}

/** Labels connected regions of `on` pixels (8-connectivity). Returns labels + area per label (index 0 unused). */
function label(on: Uint8Array, w: number, h: number) {
  const labels = new Int32Array(w * h)
  const areas: number[] = [0]
  const touchesBorder: boolean[] = [false]
  const stack = new Int32Array(w * h)
  let next = 1
  for (let start = 0; start < on.length; start++) {
    if (!on[start] || labels[start]) continue
    let sp = 0, area = 0, border = false
    stack[sp++] = start
    labels[start] = next
    while (sp > 0) {
      const i = stack[--sp]
      area++
      const x = i % w, y = (i / w) | 0
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy
        if (ny < 0 || ny >= h) continue
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= w || (dx === 0 && dy === 0)) continue
          const j = ny * w + nx
          if (on[j] && !labels[j]) { labels[j] = next; stack[sp++] = j }
        }
      }
    }
    areas.push(area)
    touchesBorder.push(border)
    next++
  }
  return { labels, areas, touchesBorder }
}

/** Separable max filter (square dilation) of radius r. */
function dilate(src: Uint8Array, w: number, h: number, r: number) {
  const tmp = new Uint8Array(w * h)
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0
      for (let dx = -r; dx <= r && !v; dx++) {
        const nx = x + dx
        if (nx >= 0 && nx < w && src[y * w + nx]) v = 1
      }
      tmp[y * w + x] = v
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0
      for (let dy = -r; dy <= r && !v; dy++) {
        const ny = y + dy
        if (ny >= 0 && ny < h && tmp[ny * w + x]) v = 1
      }
      out[y * w + x] = v
    }
  }
  return out
}

/**
 * Turns a raw soft mask (0..1) into a clean alpha channel (0..255).
 */
export function refineMask(
  raw: Float32Array, w: number, h: number, level: CleanupLevel = 'normal',
  /** Original pixels + background colour: lets enclosed holes that are just
   *  background seen through a cut-out (lattice, gap between bottle and box) stay transparent. */
  rgba?: Uint8ClampedArray, bgColor?: [number, number, number],
): Uint8ClampedArray {
  const { lo, hi, islandFrac, holeFrac } = PRESETS[level]
  const n = w * h
  const a = new Float32Array(n)

  // 1. Main subject: solid blobs that are reasonably large vs the biggest one
  const core = new Uint8Array(n)
  for (let i = 0; i < n; i++) core[i] = raw[i] > 0.5 ? 1 : 0
  const { labels, areas } = label(core, w, h)
  const largest = Math.max(0, ...areas)
  const minArea = Math.max(64, largest * islandFrac)
  const keep = new Uint8Array(n)
  let subjectArea = 0
  for (let i = 0; i < n; i++) {
    if (labels[i] && areas[labels[i]] >= minArea) { keep[i] = 1; subjectArea++ }
  }

  // 2. Silhouette = subject + everything it encloses. Enclosed regions are often
  //    see-through glass, labels or emblems — real product, not background.
  const notKeep = new Uint8Array(n)
  for (let i = 0; i < n; i++) notKeep[i] = keep[i] ? 0 : 1
  const holes = label(notKeep, w, h)
  const maxHole = subjectArea * holeFrac
  const near = dilate(keep, w, h, 3)

  // Per-hole: does it look like the original background? (mean colour distance)
  const holeIsBg = new Uint8Array(holes.areas.length)
  if (rgba && bgColor) {
    const sum = new Float64Array(holes.areas.length)
    for (let i = 0; i < n; i++) {
      const hl = holes.labels[i]
      if (!hl || holes.touchesBorder[hl]) continue
      const p = i * 4
      const dr = rgba[p] - bgColor[0], dg = rgba[p + 1] - bgColor[1], db = rgba[p + 2] - bgColor[2]
      sum[hl] += Math.sqrt(dr * dr + dg * dg + db * db)
    }
    for (let l = 1; l < holes.areas.length; l++) holeIsBg[l] = sum[l] / holes.areas[l] < 38 ? 1 : 0
  }

  for (let i = 0; i < n; i++) {
    const hl = holes.labels[i]
    const enclosed = hl > 0 && !holes.touchesBorder[hl]
    if (keep[i]) {
      // inside the solid subject: only crush near-zero noise
      a[i] = levelsOf(raw[i], 0.03, 0.97)
    } else if (enclosed && holeIsBg[hl]) {
      // background seen through a cut-out → keep it see-through, cleanly
      a[i] = levelsOf(raw[i], lo, hi)
    } else if (enclosed) {
      // tiny holes get filled; big ones keep the model's own transparency (glass)
      a[i] = holes.areas[hl] <= maxHole ? 1 : levelsOf(raw[i], 0.03, 0.97)
    } else if (near[i]) {
      // outer edge: firmer levels → clean, soft outline without haze
      a[i] = levelsOf(raw[i], lo, hi)
    } else {
      // far outside the product: specks, stray blobs, shadows → gone
      a[i] = 0
    }
  }

  const out = new Uint8ClampedArray(n)
  for (let i = 0; i < n; i++) out[i] = Math.round(a[i] * 255)
  return out
}

/** Average colour of pixels the model is confident are background (falls back to the corners). */
export function estimateBackground(rgba: Uint8ClampedArray, raw: Float32Array, w: number, h: number): [number, number, number] {
  let r = 0, g = 0, b = 0, c = 0
  for (let i = 0; i < w * h; i += 3) {
    if (raw[i] < 0.03) { r += rgba[i * 4]; g += rgba[i * 4 + 1]; b += rgba[i * 4 + 2]; c++ }
  }
  if (c < 50) {
    for (const [x, y] of [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]]) {
      const i = (y * w + x) * 4
      r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; c++
    }
  }
  return [r / c, g / c, b / c]
}

/**
 * Writes `alpha` into `rgba` and removes the background colour that bleeds into
 * semi-transparent edge pixels (the white halo): F = (C − (1−α)·B) / α
 */
export function applyAlpha(rgba: Uint8ClampedArray, alpha: Uint8ClampedArray, bg: [number, number, number]) {
  for (let i = 0; i < alpha.length; i++) {
    const A = alpha[i]
    const p = i * 4
    rgba[p + 3] = A
    if (A === 0 || A === 255) continue
    const t = A / 255
    for (let k = 0; k < 3; k++) {
      const v = (rgba[p + k] - (1 - t) * bg[k]) / t
      rgba[p + k] = v < 0 ? 0 : v > 255 ? 255 : v
    }
  }
}

/**
 * Crops a canvas to its visible content plus uniform padding, so every product
 * photo has the same framing. Returns the original canvas if it's empty.
 */
export function trimCanvas(src: HTMLCanvasElement, padFrac = 0.06, threshold = 12): HTMLCanvasElement {
  const { width: w, height: h } = src
  const data = src.getContext('2d')!.getImageData(0, 0, w, h).data
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > threshold) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) return src
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * padFrac)
  const cw = x1 - x0 + 1 + pad * 2
  const ch = y1 - y0 + 1 + pad * 2
  const out = document.createElement('canvas')
  out.width = cw
  out.height = ch
  out.getContext('2d')!.drawImage(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1, pad, pad, x1 - x0 + 1, y1 - y0 + 1)
  return out
}
