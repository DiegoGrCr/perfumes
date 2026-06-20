import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('perfumes')
      .select('id, name, brand')

    return NextResponse.json({
      ok: !error,
      count: data?.length ?? 0,
      error: error?.message ?? null,
      perfumes: data,
      env: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (e) {
    return NextResponse.json({ ok: false, exception: String(e) })
  }
}
