// src/shared/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Environment variables'den al
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xfrgkzlugacowzcfthwk.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhmcmdremx1Z2Fjb3d6Y2Z0aHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzQwMTQsImV4cCI6MjA2ODg1MDAxNH0.uPOphVgjq2TwOEvVzs3yGNrJ02XDTIyiRT5me7158vg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
