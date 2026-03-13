import { supabase } from './supabase'

const BUCKET = 'route-images'

export async function uploadRouteImage(
  routeKey: string,
  file: File
): Promise<string | null> {
  if (!supabase) return null

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${routeKey}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

  if (error) {
    console.error('Image upload failed:', error)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
