import { createClient } from '@supabase/supabase-js'

// Hardcoded directly to bypass Vercel environment variable sync issues
const supabaseUrl = 'https://mlkprcglqgvnykhognzj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa3ByY2dscWd2bnllaG9nbnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNzk1NzcsImV4cCI6MjEwODc1NTU3N30.KyeEwv12RZqCX7V-3cNlIKQsH1RypbliFTdVS8KQPw4' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
