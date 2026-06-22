import { NextRequest, NextResponse } from 'next/server'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

async function callGemini(apiKey: string, body: string) {
  // Nuevo formato de clave (AQ.) → x-goog-api-key header
  // Formato clásico (AIzaSy) → query param ?key=
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

  const prompt = `Eres un experto en perfumería de alta gama. Analiza el perfume "${name}"${brand ? ` de ${brand}` : ''} y devuelve información REAL y ESPECÍFICA para ese perfume concreto, no valores genéricos.

IMPORTANTE para "concentration": lee con atención el nombre del perfume. Si el nombre contiene "EDT", "Eau de Toilette" o "Toilette" → usa "EDT". Si contiene "Body Mist" o "Mist" → usa "Body Mist". Si contiene "Body Spray" o "Spray" → usa "Body Spray". Si contiene "EDC" o "Cologne" → usa "EDC". Si contiene "Parfum" sin "Eau" o "Extrait" → usa "Parfum". En otro caso usa el que corresponda realmente a ese perfume.

Responde SOLO con JSON válido (sin markdown):
{
  "brand": "${brand || 'marca real del perfume (ej: Dior, Lattafa, Creed...), o vacío si no la conoces'}",
  "gender": "para quién es ESTE perfume específicamente, elige uno de: ${GENDERS.join(', ')}",
  "category": "categoría de ESTE perfume, elige uno de: ${CATEGORIES.join(', ')} (arabe=perfumería árabe/oriental, disenador=grandes marcas de moda, nicho=perfumería artesanal exclusiva, otros=resto)",
  "concentration": "tipo de concentración de ESTE perfume, elige uno de: ${CONCENTRATIONS.join(', ')}",
  "description": "descripción elegante y evocadora de 2-3 oraciones específica para este perfume",
  "notes_top": ["notas de salida reales de este perfume"],
  "notes_heart": ["notas de corazón reales de este perfume"],
  "notes_base": ["notas de fondo reales de este perfume"],
  "scent_type": "elige el más apropiado para ESTE perfume de: ${SCENT_TYPES.join(', ')}",
  "longevity": "duración real conocida de ESTE perfume de: ${LONGEVITY.join(', ')}",
  "sillage": "proyección real de ESTE perfume de: ${SILLAGE.join(', ')}",
  "seasons": ["temporadas donde mejor encaja ESTE perfume de: ${SEASONS.join(', ')}"],
  "occasions": ["ocasiones donde se usa ESTE perfume de: ${OCCASIONS.join(', ')}"]
}`

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  })

  const res = await callGemini(apiKey, body)

  if (!res.ok) {
    const detail = await res.text()
    console.error('[gemini] status:', res.status, '| key prefix:', apiKey.slice(0, 6), '| detail:', detail)
    return NextResponse.json({ error: `Gemini ${res.status}: ${detail}` }, { status: 500 })
  }

  const geminiData = await res.json()
  const text: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Respuesta inválida de Gemini', raw: text }, { status: 500 })
  }
}
