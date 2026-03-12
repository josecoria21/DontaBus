import { supabase } from './supabase'
import type { FieldCollectionEntry } from '../types'

const adminSecret = import.meta.env.VITE_ADMIN_SECRET || ''

export async function saveFieldLinks(
  entries: FieldCollectionEntry[]
): Promise<{ success: boolean; inserted?: number; skipped?: number; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' }
  if (!adminSecret) return { success: false, error: 'Admin secret not configured' }
  if (entries.length === 0) return { success: true, inserted: 0, skipped: 0 }

  const links = entries.map(e => ({
    route_key: e.route_key,
    stop_id: e.stop_id,
    sequence: e.sequence,
  }))

  const { data, error } = await supabase.rpc('add_route_stop_links', {
    secret: adminSecret,
    links,
  })

  if (error) return { success: false, error: error.message }
  if (data && !data.success) return { success: false, error: data.error }
  return { success: true, inserted: data?.inserted, skipped: data?.skipped }
}
