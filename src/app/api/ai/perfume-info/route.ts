import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60  // permite hasta 60s de respuesta en Vercel

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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

  // Prompt compacto para reducir tokens de pensamiento
  const prompt = `Experto en perfumería. Perfume: "${name}"${brand ? ` de ${brand}` : ''}.

Concentration: si el nombre dice EDT/Toilette→EDT, Mist→Body Mist, Spray→Body Spray, EDC/Cologne→EDC, Parfum sin Eau→Parfum.

JSON válido sin markdown:
{"brand":"${brand || 'marca real'}","gender":"${GENDERS.join('|')}","category":"${CATEGORIES.join('|')}","concentration":"${CONCENTRATIONS.join('|')}","description":"2-3 oraciones evocadoras","notes_top":["nota1","nota2","nota3"],"notes_heart":["nota1","nota2","nota3"],"notes_base":["nota1","nota2"],"scent_type":"${SCENT_TYPES.join('|')}","longevity":"${LONGEVITY.join('|')}","sillage":"${SILLAGE.join('|')}","seasons":["${SEASONS.join('|')}"],"occasions":["${OCCASIONS.join('|')}"]}`

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
  const text: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    // Intentar extraer JSON del texto si viene envuelto en markdown
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]))
      } catch {}
    }
    return NextResponse.json({ error: 'Respuesta inválida de Gemini', raw: text }, { status: 500 })
  }
}
