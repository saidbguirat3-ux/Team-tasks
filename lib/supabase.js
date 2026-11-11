import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mlkprcglqgvnykhognzj.supabase.co'
const supabaseAnonKey = 'sb_publishable_KJgZAoHy50ztbLugUvbGtQ_K1PMoKbJ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
