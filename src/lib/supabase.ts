import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, supabaseEnv } from "@/lib/env";

assertSupabaseEnv();

// Create a single Supabase client for interacting with the database
export const supabase = createClient(
  supabaseEnv.url as string,
  supabaseEnv.anonKey as string
);
