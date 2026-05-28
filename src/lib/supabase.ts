import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Validate that the URL is a proper HTTP/HTTPS endpoint and not a placeholder template
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
