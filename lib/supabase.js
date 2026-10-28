import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mlkprcglqgvnykhognzj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1sa3ByY2dscWd2bnlraG9nbnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODIxMjAsImV4cCI6MjA1Njg1ODEyMH0.KyEwv12RZqCX7V-3cNlIKQsH1RybpblifTDvS8KQPw4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
