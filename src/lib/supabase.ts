import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[DontaBus] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — Supabase client disabled')
}

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function ensureAnonymousAuth() {
  if (!supabase) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session.user
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.error('Anonymous auth failed:', error)
    return null
  }
  return data.user
}
