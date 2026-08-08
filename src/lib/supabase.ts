import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Undefined when no project is configured — every call site must check
 * `isSupabaseConfigured` first. This keeps the app runnable standalone
 * (localStorage-backed) for anyone who clones the repo without Supabase.
 */
export const supabase: SupabaseClient | undefined = isSupabaseConfigured ? createClient(url!, anonKey!) : undefined;
