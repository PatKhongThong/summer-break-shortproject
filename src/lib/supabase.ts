import { createClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG } from "./config";

// Read from config file first, otherwise fall back to environment variables
const supabaseUrl =
  SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== "your-supabase-project-url-here"
    ? SUPABASE_CONFIG.url
    : (process.env.NEXT_PUBLIC_SUPABASE_URL || "");

const supabaseAnonKey =
  SUPABASE_CONFIG.anonKey && SUPABASE_CONFIG.anonKey !== "your-supabase-anon-key-here"
    ? SUPABASE_CONFIG.anonKey
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

// Validate that the URL is a proper HTTP/HTTPS endpoint
const isUrlValid = (url: string) => {
  return (
    (url.startsWith("http://") || url.startsWith("https://")) &&
    url !== "your-supabase-project-url"
  );
};

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  isUrlValid(supabaseUrl)
);

// If keys are missing or invalid, we fall back to a valid dummy URL to prevent compile crashes
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder-project.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-anon-key"
);
