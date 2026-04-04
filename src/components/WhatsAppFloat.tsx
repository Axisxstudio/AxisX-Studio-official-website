"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { CONTACT_INFO } from "@/lib/contact-info";

/* WhatsApp phone number (digits only, no + or spaces) */
const WA_NUMBER = CONTACT_INFO.phone.display.replace(/\D/g, "");
const WA_MESSAGE = encodeURIComponent(
  "Hello AxisX Studio! I'd like to discuss a project and learn more about your services."
);
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

const WhatsAppIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

export default function WhatsAppFloat() {
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Hide on login page and all admin portal pages
  const isHiddenPage = pathname === "/login" || pathname?.startsWith("/admin");

  if (dismissed || isHiddenPage) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-3"
      aria-label="WhatsApp contact"
    >
      {/* Tooltip card — appears on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="wa-tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-64 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(11, 15, 20, 0.96)",
              border: "1px solid rgba(37, 211, 102, 0.2)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Green top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: "linear-gradient(90deg, transparent, #25D366, transparent)",
              }}
            />

            {/* Dismiss × */}
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[#4A5568] hover:text-[#F8FAFC] hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>

            <div className="p-4 pr-8">
              {/* Avatar row */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{ background: "#25D366" }}
                >
                  <WhatsAppIcon />
                </div>
                <div>
                  <p className="text-[#F8FAFC] text-xs font-bold leading-tight">AxisX Studio</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                    <span className="text-[#25D366] text-[10px] font-medium">Typically replies instantly</span>
                  </div>
                </div>
              </div>

              {/* Message bubble */}
              <div
                className="rounded-xl rounded-tl-sm p-3 mb-3 text-xs text-[#CDD5E0] leading-relaxed"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                👋 Hi there! Have a project in mind or need expert web development advice? Let&apos;s chat.
              </div>

              {/* CTA */}
              <a
                href={WA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #25D366 0%, #1aab54 100%)",
                  boxShadow: "0 4px 14px rgba(37,211,102,0.3)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 20px rgba(37,211,102,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 14px rgba(37,211,102,0.3)";
                }}
              >
                <span>Start a Conversation</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <motion.a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1.2 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #25D366 0%, #1aab54 100%)",
          boxShadow: "0 8px 24px rgba(37,211,102,0.45), 0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        <WhatsAppIcon />

        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ background: "#25D366", animationDuration: "2.5s" }}
        />
      </motion.a>
    </div>
  );
}
