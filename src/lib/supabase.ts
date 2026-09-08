import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as any).env || {};

function getSupabaseCredentials() {
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') : null;
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') : null;

  const url = localUrl || metaEnv.VITE_SUPABASE_URL || '';
  const key = localKey || metaEnv.VITE_SUPABASE_ANON_KEY || '';

  const configured = Boolean(url && key && url !== 'YOUR_SUPABASE_URL' && !url.includes('YOUR_'));
  return { url, key, configured };
}

const creds = getSupabaseCredentials();

export let isSupabaseConfigured = creds.configured;
export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(creds.url, creds.key)
  : null;

export function updateSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', key.trim());
  }
  const configured = Boolean(url && key && url !== 'YOUR_SUPABASE_URL');
  isSupabaseConfigured = configured;
  supabase = configured ? createClient(url.trim(), key.trim()) : null;
}
