import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client — uses the service role key when available,
 * falls back to the anon key. NEVER import this from client components.
 */
export function createServerSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(url, key);
}
