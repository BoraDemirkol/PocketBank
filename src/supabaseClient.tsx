import { createClient } from '@supabase/supabase-js';
 
// .env veya doğrudan configten alabilirsin
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);