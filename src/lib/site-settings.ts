import { fromDatabaseRow, selectClause, toDatabasePayload } from "@/lib/supabase-api";
import { supabase } from "@/lib/supabase";
import type { SiteSettings } from "@/types";

const SITE_SETTINGS_TABLE = "site_settings";
const SITE_SETTINGS_ROW_ID = "global";

export const DEFAULT_MAINTENANCE_MESSAGE = "System update in process, Anything Else contact admin";

export const defaultSiteSettings: SiteSettings = {
  id: SITE_SETTINGS_ROW_ID,
  maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
  maintenanceMode: false,
  updatedAt: null,
};

type SiteSettingsError = {
  code?: string;
  message?: string;
};

function normalizeSiteSettings(settings?: Partial<SiteSettings> | null): SiteSettings {
  return {
    ...defaultSiteSettings,
    ...settings,
    id: SITE_SETTINGS_ROW_ID,
    maintenanceMessage: settings?.maintenanceMessage?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
    maintenanceMode: Boolean(settings?.maintenanceMode),
  };
}

export function isSiteSettingsSchemaMissing(error: unknown): boolean {
  const candidate = error as SiteSettingsError | null | undefined;
  return candidate?.code === "PGRST205" || candidate?.message?.includes("public.site_settings") === true;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .select(selectClause(SITE_SETTINGS_TABLE))
    .eq("id", SITE_SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return defaultSiteSettings;
  }

  return normalizeSiteSettings(
    fromDatabaseRow<SiteSettings>(SITE_SETTINGS_TABLE, data as unknown as Record<string, unknown>),
  );
}

export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
  const payload = normalizeSiteSettings({
    ...settings,
    updatedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from(SITE_SETTINGS_TABLE)
    .upsert([toDatabasePayload(SITE_SETTINGS_TABLE, payload)], { onConflict: "id" })
    .select(selectClause(SITE_SETTINGS_TABLE))
    .single();

  if (error) {
    throw error;
  }

  return normalizeSiteSettings(
    fromDatabaseRow<SiteSettings>(SITE_SETTINGS_TABLE, data as unknown as Record<string, unknown>),
  );
}
