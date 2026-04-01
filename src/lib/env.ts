export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "AxisX",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  maxImageMb: Number(process.env.NEXT_PUBLIC_MAX_IMAGE_MB ?? 8),
  maxVideoMb: Number(process.env.NEXT_PUBLIC_MAX_VIDEO_MB ?? 60),
  maxFeedbackImages: Number(process.env.NEXT_PUBLIC_MAX_FEEDBACK_IMAGES ?? 6),
  maxFeedbackVideos: Number(process.env.NEXT_PUBLIC_MAX_FEEDBACK_VIDEOS ?? 3),
};

export const adminEnv = {
  defaultEmail: process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL ?? "vijayakumarvithusan2912@gmail.com",
  defaultPassword: process.env.NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD ?? "vithu2912#",
};

export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function assertSupabaseEnv(): void {
  const missing = Object.entries(supabaseEnv)
    .filter(([, value]) => !value || value === "your-supabase-url-here" || value === "your-supabase-key-here")
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Supabase environment values: ${missing.join(", ")}. Please update your .env.local file.`);
  }
}
