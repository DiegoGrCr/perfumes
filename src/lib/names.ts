/**
 * Short display name: "Jean Paul Gaultier Le Beau Caballero 125ml Edt" → "Le Beau Caballero".
 * Same rules as redes-sociales/herramientas/catalogo.mjs — keep both in sync.
 */
export function cleanName(name = '', brand = '') {
  const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let s = ` ${name} `
  const bw = brand.trim().split(/\s+/).filter(Boolean)
  if (bw.length) {
    s = s.replace(new RegExp(`\\b(de\\s+)?${bw.map(esc).join('\\s+')}\\b`, 'gi'), ' ')
    for (const w of bw) if (w.length >= 3) s = s.replace(new RegExp(`\\b${esc(w)}\\b`, 'gi'), ' ')
  }
  s = s
    .replace(/\bbeauty\b/gi, ' ')
    .replace(/\b(le|la)\s+parfum\b/gi, '$1 PARFUMKEEP')
    .replace(/\b\d+(\.\d+)?\s*(ml|mi|oz)\b/gi, ' ')
    .replace(/\b(eau\s+de\s+(parfum|toilette|cologne)|extrait(\s+de\s+parfum)?|edp|edt|edc|parfum|spray|vaporizador|set|body\s+(mist|spray)|spray\s+corporal)\b/gi, ' ')
    .replace(/\b(perfume|fragancia|loci[oó]n)\b/gi, ' ')
    .replace(/\b(para\s+)?(hombre|mujer|dama|unisex|men|women)\b/gi, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\s+-\s+|\s+-$|^-\s+/g, ' ')
    .replace(/\s+(de|para|y)\s*$/i, ' ')
    .replace(/^\s*(de|para)\s+/i, ' ')
    .replace(/\s+/g, ' ')
    .replace(/PARFUMKEEP/g, 'Parfum')
    .trim()
  if (s.length < 2) s = name.trim()
  return s.toLowerCase().split(' ').map((w, i) =>
    i > 0 && ['de', 'di', 'du', 'del', 'y', 'of'].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export const cleanNameOf = (p: { name: string; brand: string }) => cleanName(p.name, p.brand)
