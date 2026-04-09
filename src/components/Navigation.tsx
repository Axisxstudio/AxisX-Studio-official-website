"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import { AnimatePresence, motion } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isNavigating, setIsNavigating] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const sections = ["home", "about", "services", "projects", "feedback", "contact"];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    setIsNavigating(true);

    if (pathname !== "/") {
      router.push(`/#${id}`);
      setTimeout(() => setIsNavigating(false), 800);
      return;
    }

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // Flash the indicator off after scroll starts
      setTimeout(() => setIsNavigating(false), 600);
    }
  };

  const links = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "projects", label: "Projects" },
    { id: "feedback", label: "Feedback" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
        style={{ background: "linear-gradient(90deg, #2B7FFF, #5BA3FF)" }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isNavigating ? 1 : 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      />

      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${isScrolled
          ? "bg-[#0B0F14]/85 backdrop-blur-xl border-b border-[#3B82F6]/10 py-3 shadow-[0_1px_0_rgba(43,127,255,0.08)]"
          : "bg-transparent py-4"
          }`}
      >
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              aria-label="AxisX home"
              className="flex items-center opacity-90 hover:opacity-100 transition-opacity duration-200"
            >
              <BrandLogo
                className="h-auto w-[9.5rem] sm:w-[10.75rem]"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <nav ref={navRef} className="hidden md:flex items-center gap-8">
              {links.map((link) => {
                const isActive = activeSection === link.id;
                return (
                  <button
                    suppressHydrationWarning
                    key={link.id}
                    onClick={() => scrollTo(link.id)}
                    className="relative text-sm font-medium transition-colors duration-500 group"
                    style={{ color: isActive ? "#F8FAFC" : "#94A3B8" }}
                  >
                    <span className="relative z-10 group-hover:text-[#F8FAFC] transition-colors duration-500">
                      {link.label}
                    </span>

                    {/* Active/hover underline */}
                    <span
                      className="absolute bottom-[-3px] left-0 h-[1.5px] rounded-full transition-all duration-500 ease-in-out"
                      style={{
                        background: "linear-gradient(90deg, #2B7FFF, #5BA3FF)",
                        width: isActive ? "100%" : "0%",
                      }}
                    />
                    {/* Hover underline (CSS-only) */}
                    <span className="absolute bottom-[-3px] left-0 h-[1.5px] w-0 rounded-full bg-[#3B82F6]/40 transition-all duration-500 group-hover:w-full" />

                    {/* Active dot */}
                    {isActive && (
                      <motion.span
                        layoutId="nav-dot"
                        className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2B7FFF]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}

              <button
                suppressHydrationWarning
                onClick={() => scrollTo("contact")}
                className="btn-ltr-dark relative px-5 py-2 rounded-full text-sm font-semibold border border-[#3B82F6]/25"
              >
                Get Started
              </button>
            </nav>

            {/* Mobile Toggle */}
            <button
              suppressHydrationWarning
              className="md:hidden text-[#94A3B8] hover:text-[#F8FAFC] transition-colors duration-200 p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {mobileMenuOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block"
                  >
                    <X size={22} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="block"
                  >
                    <Menu size={22} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Nav — animated slide-down */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="md:hidden absolute top-full left-0 w-full border-b border-[#3B82F6]/10 py-4 px-6 flex flex-col gap-1"
              style={{
                background: "rgba(11, 15, 20, 0.97)",
                backdropFilter: "blur(20px)",
              }}
            >
              {links.map((link, i) => (
                <motion.button
                  key={link.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                  onClick={() => scrollTo(link.id)}
                  className={`text-[0.95rem] font-medium py-3 text-left border-b last:border-0 flex items-center justify-between group transition-colors duration-200 ${activeSection === link.id
                    ? "text-[#3B82F6] border-[#3B82F6]/10"
                    : "text-[#94A3B8] border-white/5 hover:text-[#F8FAFC]"
                    }`}
                >
                  {link.label}
                  {activeSection === link.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  )}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: links.length * 0.05 }}
                onClick={() => scrollTo("contact")}
                className="btn-ltr-dark mt-3 w-full py-3 rounded-xl text-sm font-semibold border border-[#3B82F6]/25"
              >
                Get Started
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
