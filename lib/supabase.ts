import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseBrowserClient = () => {
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing Supabase Browser env vars");
    return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabaseServerClient = () => {
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase Server env vars");
    return createClient(supabaseUrl, supabaseServiceKey);
};
