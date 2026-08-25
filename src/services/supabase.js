import { createClient } from '@supabase/supabase-js'

// ATENÇÃO: Você precisará criar um arquivo .env na raiz do sinaliza_web_dashboard
// com as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-do-supabase.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
