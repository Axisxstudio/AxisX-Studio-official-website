"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { defaultSiteSettings, getSiteSettings, isSiteSettingsSchemaMissing } from "@/lib/site-settings";
import type { SiteSettings } from "@/types";
import BrandLogo from "./BrandLogo";
import { TypingText } from "./TypingText";
import { CONTACT_INFO } from "@/lib/contact-info";

/* ── Social SVG Icons (pure SVG) ── */
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const socialLinks = [
  {
    icon: <InstagramIcon />,
    label: "Instagram",
    href: CONTACT_INFO.socials.instagram,
    className: "border-[#E1306C]/40 text-[#E1306C] shadow-[0_0_12px_rgba(225,48,108,0.20)] hover:shadow-[0_0_16px_rgba(225,48,108,0.35)] hover:border-[#E1306C]/60",
  },
  {
    icon: <FacebookIcon />,
    label: "Facebook",
    href: CONTACT_INFO.socials.facebook,
    className: "border-[#1877F2]/40 text-[#1877F2] shadow-[0_0_12px_rgba(24,119,242,0.20)] hover:shadow-[0_0_16px_rgba(24,119,242,0.35)] hover:border-[#1877F2]/60",
  },
  {
    icon: <LinkedInIcon />,
    label: "LinkedIn",
    href: CONTACT_INFO.socials.linkedin,
    className: "border-[#0A66C2]/40 text-[#0A66C2] shadow-[0_0_12px_rgba(10,102,194,0.20)] hover:shadow-[0_0_16px_rgba(10,102,194,0.35)] hover:border-[#0A66C2]/60",
  },
];

type SiteMaintenanceGateProps = {
  children: ReactNode;
};

function isAdminAccessibleRoute(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/admin");
}

function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0c] px-6 text-center">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#3B82F6]/10 blur-[140px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 flex flex-col items-center gap-0"
      >
        {/* Logo Section */}
        <div className="relative">
          <motion.div
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute -inset-10 bg-[#3B82F6]/10 blur-3xl rounded-full"
          />
          <img 
            src="/site-logo.png" 
            alt="AxisX Studio"
            className="w-[180px] md:w-[220px] h-auto relative drop-shadow-[0_0_25px_rgba(59,130,246,0.2)] object-contain" 
          />
        </div>

        <div className="space-y-2 mt-6 mb-10">
          <div className="flex flex-col items-center gap-1">
            <TypingText 
              text="WELCOME TO AXISX STUDIO" 
              className="text-[10px] md:text-xs font-bold tracking-[0.4em] text-[#3B82F6] uppercase opacity-80"
              delay={0.5}
            />
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-7xl font-bold font-outfit text-white tracking-[2px] leading-tight flex items-center justify-center gap-3">
              <motion.span
                animate={{ 
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                style={{
                  background: "linear-gradient(90deg, #fff 0%, #3B82F6 50%, #fff 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                SYSTEM UPDATE
              </motion.span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-xl md:text-3xl font-medium tracking-[4px] text-[#94A3B8] uppercase">
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                IN PROCESS
              </motion.span>
              <div className="flex w-8 justify-start">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                  >
                    .
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
          
          <p className="text-[#94A3B8] text-sm md:text-lg max-w-lg mx-auto leading-relaxed font-light">
            {message || "System update in process, Anything Else contact admin"}
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="flex gap-3 mt-12">
           {[0, 1, 2].map((i) => (
             <motion.div
               key={i}
               animate={{ 
                 scale: [1, 1.5, 1],
                 opacity: [0.2, 1, 0.2] 
               }}
               transition={{ 
                 duration: 1.5, 
                 repeat: Infinity, 
                 delay: i * 0.25 
               }}
               className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]"
             />
           ))}
        </div>
      </motion.div>

      {/* Admin Access & Legal */}
      <div className="mt-auto w-full py-10 z-10 flex flex-col items-center gap-6">
        {/* Social Links */}
        <div className="flex items-center gap-4 mb-2">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                group relative w-10 h-10 rounded-xl flex items-center justify-center
                bg-white/[0.03] transition-all duration-300 border hover:scale-110
                ${s.className}
              `}
            >
              {s.icon}
            </a>
          ))}
        </div>

        <Link
          aria-label="Admin login"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/5 bg-white/5 text-[10px] uppercase font-bold tracking-widest text-[#94A3B8] transition-all hover:border-[#3B82F6]/30 hover:text-white group active:scale-95"
          href="/login"
        >
          <Lock size={12} className="group-hover:text-[#3B82F6] transition-colors" />
          <span>Admin Access Only</span>
        </Link>
        <p className="text-[10px] text-[#4a4a5a] uppercase tracking-widest" suppressHydrationWarning>© {new Date().getFullYear()} AxisX Studio. All rights reserved.</p>
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
