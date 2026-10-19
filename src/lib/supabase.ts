import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

const isPlaceholder = (val: string) =>
  !val ||
  val.includes('your_supabase') ||
  val.includes('placeholder') ||
  val.includes('example');

const isValidUrl = (url: string) => {
  return url.startsWith('https://') || url.startsWith('http://');
};

export const getMissingEnvVars = (): string[] => {
  const missing: string[] = [];
  if (!rawUrl || isPlaceholder(rawUrl) || !isValidUrl(rawUrl)) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  if (!rawKey || isPlaceholder(rawKey)) {
    missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }
  return missing;
};

export const isSupabaseConfigured = getMissingEnvVars().length === 0;

if (!isSupabaseConfigured) {
  console.warn(
    `[Supabase] Environment configuration incomplete. Missing: ${getMissingEnvVars().join(', ')}`
  );
}

// Fallback dummy credentials to prevent createClient from throwing at module evaluation time
const SUPABASE_URL = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
