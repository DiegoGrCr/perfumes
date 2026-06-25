import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60  // permite hasta 60s de respuesta en Vercel

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'

async function callGemini(apiKey: string, body: string) {
  const isNewFormat = !apiKey.startsWith('AIzaSy')
  const url = isNewFormat ? GEMINI_URL : `${GEMINI_URL}?key=${apiKey}`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (isNewFormat) headers['x-goog-api-key'] = apiKey

  const res = await fetch(url, { method: 'POST', headers, body })
  return res
}

export async function POST(req: NextRequest) {
  const { name, brand } = await req.json()

  if (!name) return NextResponse.json({ error: 'name requerido' }, { status: 400 })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY no configurado' }, { status: 500 })

  const SCENT_TYPES    = ['Floral','Amaderado','Oriental','Fresco','Gourmand','Marino','Cítrico','Especiado','Herbal','Chypre','Fougère']
  const LONGEVITY      = ['Corta','Moderada','Larga','Muy larga']
  const SILLAGE        = ['Íntima','Suave','Moderada','Fuerte']
  const SEASONS        = ['Primavera','Verano','Otoño','Invierno']
  const OCCASIONS      = ['Día','Noche','Trabajo','Romántico','Casual','Sport','Ocasión especial']
  const GENDERS        = ['hombre','mujer','unisex']
  const CATEGORIES     = ['arabe','disenador','nicho','otros']
  const CONCENTRATIONS = ['Parfum','EDP','EDT','EDC','Body Mist','Body Spray']

  const prompt = `Eres un experto en perfumería. Analiza el perfume: "${name}"${brand ? ` de ${brand}` : ''}.

IMPORTANTE:
- "brand": pon la marca fabricante real (ej: Dior, Chanel, Lattafa, Creed, Al Haramain, Grandeur Elite). OJO: el nombre de la fragancia o colección NO es la marca. Si no puedes identificar al fabricante, deja brand "".
- "concentration": EDT/Toilette→EDT, Mist→Body Mist, Spray→Body Spray, EDC/Cologne→EDC, Parfum sin Eau→Parfum.
- Notas olfativas: reales y específicas de ESTE perfume, no genéricas.

Responde SOLO con JSON válido (sin markdown):
{"brand":"${brand || ''}","gender":"${GENDERS.join('|')}","category":"${CATEGORIES.join('|')}","concentration":"${CONCENTRATIONS.join('|')}","description":"2-3 oraciones evocadoras","notes_top":["nota1","nota2","nota3"],"notes_heart":["nota1","nota2","nota3"],"notes_base":["nota1","nota2"],"scent_type":"${SCENT_TYPES.join('|')}","longevity":"${LONGEVITY.join('|')}","sillage":"${SILLAGE.join('|')}","seasons":["season"],"occasions":["occasion"]}`

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      maxOutputTokens: 1024,
    },
  })

  const res = await callGemini(apiKey, body)

  if (!res.ok) {
    const detail = await res.text()
    console.error('[gemini] status:', res.status, '| detail:', detail)
    if (res.status === 429) {
      let retryAfter = 60
      try {
        const parsed = JSON.parse(detail)
        const delayStr = parsed?.error?.details?.find((d: { retryDelay?: string }) => d.retryDelay)?.retryDelay
        if (delayStr) retryAfter = Math.ceil(parseFloat(delayStr)) || 60
      } catch {}
      return NextResponse.json({ error: 'rate_limited', retryAfter }, { status: 429 })
    }
    return NextResponse.json({ error: `Gemini ${res.status}: ${detail}` }, { status: 500 })
  }

  const geminiData = await res.json()

  // Buscar en todas las partes (incluyendo posibles partes de "pensamiento")
  // la que contenga JSON válido
  const parts: { text?: string; thought?: boolean }[] =
    geminiData.candidates?.[0]?.content?.parts ?? []

  let parsed: Record<string, unknown> | null = null

  for (const part of parts) {
    if (!part.text || part.thought) continue
    // Intento directo
    try { parsed = JSON.parse(part.text); break } catch {}
    // Intento extrayendo bloque JSON del texto (si viene con markdown)
    const match = part.text.match(/\{[\s\S]*\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]); break } catch {}
    }
  }

  if (parsed) return NextResponse.json(parsed)

  console.error('[gemini] no se pudo parsear. partes:', JSON.stringify(parts).slice(0, 500))
  return NextResponse.json({ error: 'Respuesta inválida de Gemini' }, { status: 500 })
}
