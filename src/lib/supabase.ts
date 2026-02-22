import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://qfitpwdrswvnbmzvkoyd.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmaXRwd2Ryc3d2bmJtenZrb3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNTc4NTIsImV4cCI6MjA3NjkzMzg1Mn0.owLaj3VrcyR7_LW9xMwOTTFQupbDKlvAlVwYtbidiNE';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidKey(key: string): boolean {
  try {
    const payload = JSON.parse(atob(key.split('.')[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

const supabaseUrl = rawUrl && rawUrl !== '' ? rawUrl : FALLBACK_URL;
const supabaseAnonKey = rawKey && isValidKey(rawKey) ? rawKey : FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
