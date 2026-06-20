import { supabase } from './supabase'
import { PerfumeImage } from '@/types/perfume'

const BUCKET = 'perfume-images'

export async function uploadPerfumeImage(
  file: File,
  perfumeId: string,
  sortOrder: number,
): Promise<{ path: string; url: string } | null> {
  if (!supabase) return null

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${perfumeId}/${sortOrder}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

  if (error) {
    console.error('Error subiendo imagen:', error)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export async function deletePerfumeImage(storagePath: string): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) console.error('Error borrando imagen del storage:', error)
  return !error
}

export async function savePerfumeImages(
  perfumeId: string,
  newFiles: { file: File; isPrimary: boolean }[],
): Promise<PerfumeImage[]> {
  if (!supabase || newFiles.length === 0) return []

  const uploaded: PerfumeImage[] = []

  for (let i = 0; i < newFiles.length; i++) {
    const { file, isPrimary } = newFiles[i]
    const result = await uploadPerfumeImage(file, perfumeId, i)
    if (!result) continue

    const { data, error } = await supabase
      .from('perfume_images')
      .insert({
        perfume_id: perfumeId,
        storage_path: result.path,
        url: result.url,
        is_primary: isPrimary,
        sort_order: i,
      })
      .select()
      .single()

    if (!error && data) uploaded.push(data)
  }

  return uploaded
}

export async function deletePerfumeImageRecord(imageId: string, storagePath: string): Promise<boolean> {
  if (!supabase) return false

  await deletePerfumeImage(storagePath)

  const { error } = await supabase
    .from('perfume_images')
    .delete()
    .eq('id', imageId)

  if (error) console.error('Error borrando registro de imagen:', error)
  return !error
}

export async function setPrimaryImage(perfumeId: string, imageId: string): Promise<boolean> {
  if (!supabase) return false

  await supabase
    .from('perfume_images')
    .update({ is_primary: false })
    .eq('perfume_id', perfumeId)

  const { error } = await supabase
    .from('perfume_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  return !error
}
