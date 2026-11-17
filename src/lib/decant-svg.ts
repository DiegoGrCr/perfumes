/**
 * Draws the Velvet decant atomizer (5 / 10 ml, or both as a pair) as SVG markup.
 * Same design as redes-sociales/03-plantillas/decant.html, rendered live in the
 * store so the label always shows the perfume's name.
 */

export interface Juice { h: number; s: number }
export const DEFAULT_JUICE: Juice = { h: 38, s: 0.8 } // golden amber

export interface DecantArt {
  label: string        // name printed on the label
  brand: string
  concentration?: string
  juice: Juice
  size: 5 | 10 | 'par'
}

const esc = (t: string) => t.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

/** Word wrap by estimated glyph width (serif ≈ .5em). */
function wrap(text: string, maxW: number, size: number, maxLines: number) {
  const lines: string[] = []
  let cur = ''
  for (const w of text.split(' ')) {
    const t = cur ? `${cur} ${w}` : w
    if (t.length * size * 0.5 > maxW && cur) { lines.push(cur); cur = w } else cur = t
  }
  if (cur) lines.push(cur)
  return lines.slice(0, maxLines)
}

/** False when the name would be cut off on the (smaller) 5 ml label. */
export function labelFits(label: string) {
  const lw = 148 - 22
  return wrap(label, lw - 22, 15, 99).length <= 3
}

/** Deterministic id (same on server and client → no hydration mismatch). */
function idOf(...parts: (string | number)[]) {
  let h = 5381
  for (const c of parts.join('|')) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0
  return 'dv' + h.toString(36)
}

function vial(cx: number, base: number, ml: 5 | 10, art: DecantArt) {
  const id = idOf(art.label, art.brand, art.concentration ?? '', art.juice.h, art.juice.s, ml, cx)
  const tall = ml === 10
  const bw = tall ? 168 : 148, bh = tall ? 560 : 360, top = base - bh
  const lq = top + bh * (1 - (tall ? 0.84 : 0.82))
  const { h, s } = art.juice
  const L = (l: number, sat = s) => `hsl(${h} ${Math.round(sat * 100)}% ${l}%)`
  const capW = bw * 0.74, capH = tall ? 150 : 128, collarH = 26
  const serif = 'font-family:var(--font-cormorant),Cormorant Garamond,serif'
  const sans = 'font-family:var(--font-montserrat),Montserrat,sans-serif'

  // label
  const lw = bw - 22, lh = tall ? 190 : 150, ly = top + bh * (tall ? 0.42 : 0.36)
  let nameSize = tall ? 29 : 25
  while (wrap(art.label, lw - 22, nameSize, 9).length > 2 && nameSize > (tall ? 17 : 15)) nameSize--
  const lines = wrap(art.label, lw - 22, nameSize, 3)
  const brandSize = Math.min(tall ? 9.5 : 8.5, (lw - 26) / Math.max(1, art.brand.length * 0.78))

  return `
  <defs>
    <linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".08" stop-color="#fff" stop-opacity=".07"/><stop offset=".5" stop-color="#fff" stop-opacity=".02"/><stop offset=".86" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${id}j" x1="0" x2="1"><stop offset="0" stop-color="${L(12)}"/><stop offset=".14" stop-color="${L(24)}"/><stop offset=".42" stop-color="${L(36, Math.min(0.9, s + 0.05))}"/><stop offset=".62" stop-color="${L(32)}"/><stop offset=".88" stop-color="${L(20)}"/><stop offset="1" stop-color="${L(10)}"/></linearGradient>
    <linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".12" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
    <linearGradient id="${id}o" x1="0" x2="1"><stop offset="0" stop-color="#6d4f23"/><stop offset=".18" stop-color="#d9b56b"/><stop offset=".32" stop-color="#fff0c8"/><stop offset=".5" stop-color="#b98e45"/><stop offset=".72" stop-color="#e9cd8a"/><stop offset=".9" stop-color="#8a6630"/><stop offset="1" stop-color="#5a401b"/></linearGradient>
    <linearGradient id="${id}l" x1="0" x2="1"><stop offset="0" stop-color="#d9d0c6"/><stop offset=".15" stop-color="#f7f2ec"/><stop offset=".7" stop-color="#f3ede6"/><stop offset="1" stop-color="#cfc5ba"/></linearGradient>
    <clipPath id="${id}c"><rect x="${cx - bw / 2}" y="${top}" width="${bw}" height="${bh}" rx="18"/></clipPath>
  </defs>
  <g clip-path="url(#${id}c)">
    <rect x="${cx - bw / 2}" y="${lq}" width="${bw}" height="${base - lq}" fill="url(#${id}j)"/>
    <rect x="${cx - bw / 2}" y="${lq}" width="${bw}" height="${base - lq}" fill="url(#${id}v)"/>
    <ellipse cx="${cx}" cy="${lq}" rx="${bw / 2}" ry="7" fill="${L(30)}" opacity=".9"/>
    <ellipse cx="${cx}" cy="${lq - 1}" rx="${bw / 2 - 6}" ry="3" fill="#fff" opacity=".18"/>
    <rect x="${cx - bw * 0.18}" y="${lq + 12}" width="${bw * 0.16}" height="${base - lq - 50}" rx="${bw * 0.08}" fill="#fff" opacity=".10"/>
    <rect x="${cx - bw / 2}" y="${base - 30}" width="${bw}" height="30" fill="#fff" opacity=".10"/>
    <rect x="${cx - 2.5}" y="${top}" width="5" height="${bh - 34}" fill="#fff" opacity=".35"/>
  </g>
  <rect x="${cx - bw / 2}" y="${top}" width="${bw}" height="${bh}" rx="18" fill="url(#${id}g)" stroke="#fff" stroke-opacity=".55" stroke-width="2.2"/>
  <rect x="${cx - bw / 2 + 12}" y="${top + 16}" width="12" height="${bh - 52}" rx="6" fill="#fff" opacity=".45"/>
  <rect x="${cx + bw / 2 - 22}" y="${top + 26}" width="5" height="${bh - 80}" rx="2.5" fill="#fff" opacity=".25"/>
  <rect x="${cx - lw / 2}" y="${ly}" width="${lw}" height="${lh}" rx="3" fill="url(#${id}l)"/>
  <rect x="${cx - lw / 2 + 7}" y="${ly + 7}" width="${lw - 14}" height="${lh - 14}" fill="none" stroke="#b97f6e" stroke-width="1" opacity=".7"/>
  <text x="${cx}" y="${ly + (tall ? 34 : 30)}" text-anchor="middle" style="${serif}" font-size="${tall ? 16 : 14}" letter-spacing="4" fill="#17120f">VELVET</text>
  <line x1="${cx - 22}" x2="${cx + 22}" y1="${ly + (tall ? 44 : 39)}" y2="${ly + (tall ? 44 : 39)}" stroke="#b97f6e" stroke-width="1"/>
  ${lines.map((t, i) => `<text x="${cx}" y="${ly + (tall ? 84 : 72) + i * nameSize * 1.05}" text-anchor="middle" style="${serif}" font-size="${nameSize}" fill="#17120f">${esc(t)}</text>`).join('')}
  <text x="${cx}" y="${ly + lh - (tall ? 46 : 38)}" text-anchor="middle" style="${sans}" font-size="${brandSize}" letter-spacing="1" fill="#7a6f66">${esc(art.brand.toUpperCase())}</text>
  <text x="${cx}" y="${ly + lh - (tall ? 24 : 20)}" text-anchor="middle" style="${sans}" font-size="${tall ? 12 : 11}" font-weight="600" letter-spacing="2" fill="#17120f">${ml} ML${art.concentration ? ' · ' + esc(art.concentration) : ''}</text>
  <rect x="${cx - capW / 2 + 4}" y="${top - collarH}" width="${capW - 8}" height="${collarH + 6}" rx="4" fill="url(#${id}o)"/>
  <rect x="${cx - capW / 2 + 4}" y="${top - collarH}" width="${capW - 8}" height="5" rx="2.5" fill="#fff6dc" opacity=".6"/>
  <rect x="${cx - capW * 0.32}" y="${top - collarH - capH * 0.5}" width="${capW * 0.64}" height="${capH * 0.5 + 2}" rx="8" fill="url(#${id}o)"/>
  <rect x="${cx - capW * 0.32 + 9}" y="${top - collarH - capH * 0.5 + 8}" width="6" height="${capH * 0.5 - 16}" rx="3" fill="#fff" opacity=".5"/>
  <circle cx="${cx + capW * 0.12}" cy="${top - collarH - capH * 0.28}" r="${tall ? 6 : 5}" fill="#3a2a14" opacity=".85"/>
  <rect x="${cx - capW * 0.32}" y="${top - collarH - capH * 0.5}" width="${capW * 0.64}" height="8" rx="4" fill="#fff6dc" opacity=".55"/>`
}

/** Full SVG markup. Single vial: 1000×1250 viewBox · pair: 1400×1250. */
export function decantSvg(art: DecantArt) {
  const H = 1250, base = H - 70
  const W = art.size === 'par' ? 1400 : 1000
  const big = (cx: number, ml: 5 | 10, k: number) =>
    `<g transform="translate(${cx} ${base}) scale(${k}) translate(${-cx} ${-base})">${vial(cx, base, ml, art)}</g>`
  const body = art.size === 'par'
    ? big(500, 10, 1.42) + big(960, 5, 1.42)
    : big(W / 2, art.size, art.size === 10 ? 1.55 : 1.95)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;display:block">${body}</svg>`
}

/** #rrggbb → hue/saturation for the juice gradient. */
export function hexToJuice(hex?: string | null): Juice | null {
  const m = hex?.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return null
  const [r, g, b] = [m[1], m[2], m[3]].map(x => parseInt(x, 16) / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  if (max === min) return { h: 0, s: 0 }
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: Math.round((h / 6) * 360), s: Math.min(0.9, s) }
}

/** hue/saturation → a representative #rrggbb (for the admin colour picker). */
export function juiceToHex({ h, s }: Juice) {
  const l = 0.36, a = s * Math.min(l, 1 - l)
  const f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)) }
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

/** Browser only: dominant saturated colour of a product photo → juice (null if not colourful). */
export function detectJuice(url?: string): Promise<Juice | null> {
  return new Promise(resolve => {
    if (!url || typeof window === 'undefined') return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 80
        const x = c.getContext('2d', { willReadFrequently: true })!
        x.drawImage(img, 0, 0, 80, 80)
        const d = x.getImageData(0, 0, 80, 80).data
        const bins = Array.from({ length: 36 }, () => ({ w: 0, h: 0, s: 0 }))
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 200) continue
          const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255
          const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
          if (max === min) continue
          const dl = max - min, s = l > 0.5 ? dl / (2 - max - min) : dl / (max + min)
          if (s < 0.3 || l < 0.12 || l > 0.85) continue
          const hh = (max === r ? (g - b) / dl + (g < b ? 6 : 0) : max === g ? (b - r) / dl + 2 : (r - g) / dl + 4) / 6
          const bin = bins[Math.floor(hh * 36) % 36], w = s * (1 - Math.abs(l - 0.5))
          bin.w += w; bin.h += hh * w; bin.s += s * w
        }
        const best = bins.reduce((a, b) => (b.w > a.w ? b : a))
        resolve(best.w < 1 ? null : { h: Math.round((best.h / best.w) * 360), s: Math.min(0.85, best.s / best.w) })
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}
