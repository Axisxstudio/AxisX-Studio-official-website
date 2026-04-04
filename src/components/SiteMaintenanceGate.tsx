"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { defaultSiteSettings, getSiteSettings, isSiteSettingsSchemaMissing } from "@/lib/site-settings";
import type { SiteSettings } from "@/types";
import BrandLogo from "./BrandLogo";

type SiteMaintenanceGateProps = {
  children: ReactNode;
};

function isAdminAccessibleRoute(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/admin");
}

function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0e0e10] px-6 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a3a6ff]/8 blur-[120px]" />
      </div>

      <div className="absolute left-6 top-6 z-10">
        <BrandLogo className="h-8 w-auto opacity-90 md:h-10" variant="lockup" />
      </div>

      <Link
        aria-label="Admin login"
        className="absolute right-6 top-6 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#a3a6ff]/15 bg-[#19191c]/90 text-[#adaaad] transition-all hover:border-[#a3a6ff]/40 hover:text-[#a3a6ff]"
        href="/login"
      >
        <Lock size={18} />
      </Link>

      <div className="relative z-10 max-w-xl">
        <h1 className="text-3xl font-bold font-outfit text-[#f9f5f8] md:text-5xl">
          {message}
        </h1>
      </div>
    </div>
  );
}

function PublicRouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0e0e10]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#a3a6ff]/20 border-t-[#a3a6ff]" />
    </div>
  );
}

export default function SiteMaintenanceGate({ children }: SiteMaintenanceGateProps) {
  const pathname = usePathname() ?? "/";
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loaded, setLoaded] = useState(false);
  const hasResolvedPublicSettings = useRef(false);
  const schemaMissing = useRef(false);
  const previousRouteWasAdminAccessible = useRef(false);

  const adminAccessibleRoute = isAdminAccessibleRoute(pathname);

  useEffect(() => {
    if (adminAccessibleRoute) {
      previousRouteWasAdminAccessible.current = true;
      setLoaded(true);
      return;
    }

    const shouldShowLoader = previousRouteWasAdminAccessible.current || !hasResolvedPublicSettings.current;
    previousRouteWasAdminAccessible.current = false;

    if (shouldShowLoader) {
      setLoaded(false);
    }

    let active = true;

    const syncSettings = async () => {
      try {
        const nextSettings = await getSiteSettings();
        if (!active) {
          return;
        }

        schemaMissing.current = false;
        setSettings(nextSettings);
      } catch (error) {
        if (!active) {
          return;
        }

        if (isSiteSettingsSchemaMissing(error)) {
          schemaMissing.current = true;
        }

        setSettings(defaultSiteSettings);
      } finally {
        if (active) {
          hasResolvedPublicSettings.current = true;
          setLoaded(true);
        }
      }
    };

    void syncSettings();

    if (schemaMissing.current) {
      return () => {
        active = false;
      };
    }

    const intervalId = window.setInterval(() => {
      void syncSettings();
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncSettings();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [adminAccessibleRoute, pathname]);

  if (adminAccessibleRoute) {
    return <>{children}</>;
  }

  if (!loaded) {
    return <PublicRouteLoader />;
  }

  if (settings.maintenanceMode) {
    return <MaintenanceScreen message={settings.maintenanceMessage} />;
  }

  return <>{children}</>;
}
