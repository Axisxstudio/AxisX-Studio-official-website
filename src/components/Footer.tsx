"use client";

import { Lock, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { CONTACT_INFO } from "@/lib/contact-info";
import { usePathname, useRouter } from "next/navigation";
import { TypingText } from "@/components/TypingText";

/* ── Social SVG Icons (pure SVG, no extra dependencies) ── */
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

export default function Footer() {
  const currentYear = new Date().getUTCFullYear();
  const pathname = usePathname();
  const router = useRouter();

  const scrollTo = (id: string) => {
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="border-t border-[#3B82F6]/10 bg-[#0B0F14] py-12 mt-4 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 text-[#94A3B8] text-sm">

          {/* Brand + social */}
          <div className="lg:col-span-1">
            <Link href="/" aria-label="AxisX home" className="mb-5 inline-flex items-center">
              <BrandLogo className="h-auto w-[10.5rem]" />
            </Link>
            <p className="leading-relaxed mb-6">
              <TypingText text="AxisX Studio" className="font-bold text-[#f8fafc]" /> | Specializing in high-performance web applications and modern UI/UX design.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2.5">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  className={`
                    group relative w-9 h-9 rounded-xl flex items-center justify-center
                    bg-white/[0.03] transition-all duration-300 border hover:scale-110
                    ${s.className}
                  `}
                >
                  {s.icon}
                  {/* Tooltip */}
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap bg-[#1F2937] text-[#F8FAFC] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {s.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[#F8FAFC] font-semibold mb-5">Services</h4>
            <ul className="space-y-3">
              {["Web Development", "UI/UX Design", "E-commerce Solutions", "Web Applications"].map(s => (
                <li key={s}>
                  <button suppressHydrationWarning onClick={() => scrollTo("services")} className="hover:text-[#3B82F6] transition-colors text-left">{s}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[#F8FAFC] font-semibold mb-5">Company</h4>
            <ul className="space-y-3">
              {[
                { label: "About Us", id: "about" },
                { label: "Portfolio", id: "projects" },
                { label: "Client Feedback", id: "feedback" },
                { label: "Contact", id: "contact" },
              ].map(item => (
                <li key={item.id}>
                  <button suppressHydrationWarning onClick={() => scrollTo(item.id)} className="hover:text-[#3B82F6] transition-colors text-left">{item.label}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#F8FAFC] font-semibold mb-5">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", href: "/privacy-policy" },
                { label: "Terms & Conditions", href: "/terms-and-conditions" },
                { label: "Return Policy", href: "/return-policy" },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-[#3B82F6] transition-colors text-left">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[#F8FAFC] font-semibold mb-5">Contact Us</h4>
            <ul className="space-y-3.5">
              <li>
                <a href={`mailto:${CONTACT_INFO.email}`} className="flex items-start gap-2.5 transition-colors hover:text-[#3B82F6] group">
                  <Mail size={14} className="mt-0.5 shrink-0 text-[#4A5568] group-hover:text-[#3B82F6] transition-colors" />
                  <span>{CONTACT_INFO.email}</span>
                </a>
              </li>
              <li>
                <a href={CONTACT_INFO.phone.href} className="flex items-start gap-2.5 transition-colors hover:text-[#3B82F6] group">
                  <Phone size={14} className="mt-0.5 shrink-0 text-[#4A5568] group-hover:text-[#3B82F6] transition-colors" />
                  <span>{CONTACT_INFO.phone.display}</span>
                </a>
              </li>
              <li>
                <a href={CONTACT_INFO.location.href} rel="noopener noreferrer" target="_blank" className="flex items-start gap-2.5 transition-colors hover:text-[#3B82F6] group">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[#4A5568] group-hover:text-[#3B82F6] transition-colors" />
                  <span>{CONTACT_INFO.location.label}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#3B82F6]/10 mt-14 pt-8 text-sm text-[#94A3B8]">
          <p>© {currentYear} <TypingText text="AxisX Studio" className="font-semibold" />. All rights reserved.</p>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            <span className="text-[#2A3545] text-xs hidden sm:block">Engineered with precision.</span>
            <Link
              href="/login"
              aria-label="Admin Login"
              className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#3B82F6]/15 text-[#94A3B8] opacity-60 transition-all hover:opacity-100 hover:border-[#3B82F6]/35 hover:text-[#3B82F6]"
            >
              <Lock size={14} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
