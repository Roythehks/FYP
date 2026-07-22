import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig && Constants.expoConfig.extra) || (Constants.manifest && Constants.manifest.extra) || {};
const supabaseUrl = extra.supabaseUrl;
const supabaseAnonKey = extra.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Set them in app.json under expo.extra.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');


