/**
 * Client-side product search: accent/case-insensitive, typo-tolerant,
 * synonym-aware, ranked by where the match happens (name > brand > notes…).
 */
import type { Perfume } from '@/types/perfume'
import { CATEGORY_LABELS, GENDER_LABELS } from '@/types/perfume'

export type SearchablePerfume = Pick<
  Perfume,
  'id' | 'name' | 'brand' | 'price' | 'original_price' | 'in_stock' | 'featured' |
  'category' | 'gender' | 'concentration' | 'volume_ml' | 'scent_type' |
  'notes_top' | 'notes_heart' | 'notes_base' | 'description'
> & { image?: string }

export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9ñ%]+/g, ' ').trim()

/** Words people use → words that appear in our data. */
const SYNONYMS: Record<string, string[]> = {
  caballero: ['hombre'], masculino: ['hombre'], men: ['hombre'], him: ['hombre'], homme: ['hombre'], man: ['hombre'],
  dama: ['mujer'], femenino: ['mujer'], women: ['mujer'], her: ['mujer'], femme: ['mujer'], woman: ['mujer'],
  dulce: ['gourmand', 'vainilla'], vainilla: ['vanilla'], vanilla: ['vainilla'],
  fresco: ['fresco', 'citrico', 'marino'], arabe: ['arabe', 'oud'], arabes: ['arabe'],
  disenador: ['disenador'], diseñador: ['disenador'],
  edp: ['edp', 'parfum'], edt: ['edt', 'toilette'], perfume: [], fragancia: [], loción: [], locion: [],
  oferta: [], ofertas: [], de: [], para: [], el: [], la: [], los: [], las: [], y: [], con: [], ml: [],
}
const STOP = new Set(Object.entries(SYNONYMS).filter(([, v]) => v.length === 0).map(([k]) => k))

function levenshtein(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (cur[j] < best) best = cur[j]
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

interface Indexed {
  p: SearchablePerfume
  name: string[]; brand: string[]; notes: string[]; tags: string[]; desc: string
  nameStr: string; brandStr: string
}

const index = new WeakMap<SearchablePerfume[], Indexed[]>()

function build(list: SearchablePerfume[]): Indexed[] {
  const cached = index.get(list)
  if (cached) return cached
  const out = list.map(p => {
    const nameStr = normalize(p.name)
    const brandStr = normalize(p.brand)
    return {
      p,
      nameStr, brandStr,
      name: nameStr.split(' '),
      brand: brandStr.split(' '),
      notes: normalize([...(p.notes_top ?? []), ...(p.notes_heart ?? []), ...(p.notes_base ?? [])].join(' ')).split(' ').filter(Boolean),
      tags: normalize([
        p.scent_type ?? '', CATEGORY_LABELS[p.category] ?? '', GENDER_LABELS[p.gender] ?? '',
        p.concentration ?? '', `${p.volume_ml}`,
      ].join(' ')).split(' ').filter(Boolean),
      desc: normalize(p.description ?? ''),
    }
  })
  index.set(list, out)
  return out
}

/** Score one query token against a word list. */
function wordScore(token: string, words: string[], exact: number, prefix: number, fuzzy: number) {
  let best = 0
  const maxTypos = token.length >= 7 ? 2 : token.length >= 4 ? 1 : 0
  for (const w of words) {
    if (!w) continue
    if (w === token) return exact
    if (w.startsWith(token)) best = Math.max(best, prefix)
    // inside another word only for longer tokens ("oud" must not match "cloud")
    else if (token.length >= 4 && w.includes(token)) best = Math.max(best, prefix * 0.6)
    else if (maxTypos && levenshtein(token, w.slice(0, token.length + maxTypos), maxTypos) <= maxTypos) {
      best = Math.max(best, fuzzy)
    }
  }
  return best
}

function tokenScore(t: string, d: Indexed) {
  return Math.max(
    wordScore(t, d.name, 10, 7, 4),
    wordScore(t, d.brand, 9, 7, 4),
    wordScore(t, d.tags, 5, 4, 0),
    wordScore(t, d.notes, 4, 3, 2),
    t.length >= 4 && d.desc.includes(t) ? 1 : 0,
  )
}

export interface SearchResult {
  items: SearchablePerfume[]
  /** true when nothing matched every word and we fell back to partial matches */
  partial: boolean
}

export function searchPerfumes(list: SearchablePerfume[], query: string, limit = Infinity): SearchResult {
  const q = normalize(query)
  if (!q) return { items: [], partial: false }
  const docs = build(list)

  const raw = q.split(' ').filter(Boolean)
  // Each query word becomes a group of alternatives (itself + synonyms); stop-words dropped
  const kept = raw.filter(t => !STOP.has(t) || raw.length === 1)
  const groups = kept.map(t => [t, ...(SYNONYMS[t] ?? [])])
  if (groups.length === 0) return { items: [], partial: false }

  const fullPhrase = q.length >= 3 ? q : ''
  const scored = docs.map(d => {
    let total = 0, matched = 0, strong = false
    groups.forEach((alts, gi) => {
      const s = Math.max(...alts.map(a => tokenScore(a, d)))
      if (s > 0) matched++
      // a solid (non-fuzzy) hit on a real word, not on "no" / "5"
      if (s >= 7 && kept[gi].length >= 3) strong = true
      total += s
    })
    if (fullPhrase && (d.nameStr.includes(fullPhrase) || `${d.brandStr} ${d.nameStr}`.includes(fullPhrase))) total += 12
    if (total > 0) total += (d.p.in_stock ? 1.5 : 0) + (d.p.featured ? 0.5 : 0)
    return { p: d.p, total, matched, strong }
  }).filter(r => r.total > 0)

  let all = scored.filter(r => r.matched === groups.length)
  // when there are strong matches, drop the ones that only "look similar"
  if (all.length) {
    const top = Math.max(...all.map(r => r.total))
    all = all.filter(r => r.total >= top * 0.45)
  }
  const pool = all.length > 0
    ? all
    : scored.filter(r => r.strong && r.matched >= Math.ceil(groups.length / 2))
  pool.sort((a, b) => b.total - a.total || a.p.name.localeCompare(b.p.name))
  return { items: pool.slice(0, limit).map(r => r.p), partial: all.length === 0 && pool.length > 0 }
}

/** Closest product names for "¿Quisiste decir…?" when nothing matches. */
export function suggest(list: SearchablePerfume[], query: string, n = 3): SearchablePerfume[] {
  const q = normalize(query)
  if (q.length < 3) return []
  const docs = build(list)
  return docs
    .map(d => {
      const words = [...d.name, ...d.brand]
      // best (token → word) pair, with a typo budget that grows with word length
      let ok = false, dist = 9
      for (const t of q.split(' ')) {
        if (t.length < 4 || STOP.has(t)) continue
        const budget = t.length >= 7 ? 2 : 1
        for (const w of words) {
          const dd = levenshtein(t, w, budget)
          if (dd <= budget && dd < dist) { dist = dd; ok = true }
        }
      }
      return { p: d.p, dist: ok ? dist : 99 }
    })
    .filter(r => r.dist < 99)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, n)
    .map(r => r.p)
}

/** Splits text into [plain, highlighted, plain…] pieces for the query words. */
export function highlight(text: string, query: string): { text: string; hit: boolean }[] {
  const words = normalize(query).split(' ').filter(w => w.length >= 2 && !STOP.has(w))
  if (!words.length) return [{ text, hit: false }]
  const norm = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const marks = new Array(text.length).fill(false)
  for (const w of words) {
    let i = norm.indexOf(w)
    while (i !== -1) { for (let k = i; k < i + w.length; k++) marks[k] = true; i = norm.indexOf(w, i + 1) }
  }
  const out: { text: string; hit: boolean }[] = []
  for (let i = 0; i < text.length; i++) {
    const last = out[out.length - 1]
    if (last && last.hit === marks[i]) last.text += text[i]
    else out.push({ text: text[i], hit: marks[i] })
  }
  return out
}

export const notFoundWhatsAppText = (query: string) =>
  `¡Hola! Busco "${query.trim()}" y no lo encontré en el catálogo. ¿Lo pueden conseguir sobre pedido?`
