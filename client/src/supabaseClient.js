import { createClient } from '@supabase/supabase-js';

// Menggunakan REACT_APP_ karena kamu tidak pakai Vite
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL atau Anon Key hilang di file .env!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);