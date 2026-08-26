import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://xtjvondyvczuqtyhplnl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_U9GyEsvReFxSPjQvm7A00w_Hv0Pveop';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
