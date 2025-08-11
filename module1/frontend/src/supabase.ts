import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables, using fallback values')
}

export const supabase = createClient(
  supabaseUrl || 'https://xfrgkzlugacowzcfthwk.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmcmdrembsdWdhY293emNmdGh3ayIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM1NDYzNzkzLCJleHAiOjIwNTEwMzk3OTN9.S7zRa8OAGNOk3xPF17f0z4Nd5Dy7OjxGKJUXj2w8kRU'
)