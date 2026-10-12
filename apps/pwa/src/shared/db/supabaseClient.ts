import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Database } from "./supabaseTypes";

// ─── Variables d'environnement ────────────────────────────────────────────────
// Renseigner dans .env.local (voir .env.example)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables manquantes : EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY " +
    "doivent être définies dans .env.local"
  );
}

// ─── Singleton client Supabase ────────────────────────────────────────────────
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage = persistance native React Native (chiffrement Expo SecureStore optionnel)
    storage: AsyncStorage,
    // Refresh automatique du token avant expiration
    autoRefreshToken: true,
    // Session persistée entre les relances de l'app
    persistSession: true,
    // Désactiver la détection d'URL (pas de browser en RN)
    detectSessionInUrl: false,
  },
});
