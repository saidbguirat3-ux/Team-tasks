import { createClient } from '@supabase/supabase-js'

// Hardcoded directly to bypass Vercel environment variable sync issues
const supabaseUrl = 'https://mlkprcglqgvnykhognzj.supabase.co'
const supabaseAnonKey = 'sb_publishable_KJgZAoHy50ztbLugUvbGtQ_K1PMoKbJ' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
