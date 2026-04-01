"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const sections = ["home", "about", "services", "projects", "feedback", "contact"];
      for (const id of sections.reverse()) {
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
    
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }

    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#0e0e10]/80 backdrop-blur-md border-b border-[#a3a6ff]/10 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-[#a3a6ff] to-[#c180ff] flex items-center justify-center text-[#0e0e10] font-black text-xl">X</span>
            <span className="font-outfit">Axis<span className="text-[#a3a6ff]">X</span></span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((link) => (
               <button
                suppressHydrationWarning
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`text-sm font-medium transition-colors hover:text-[#a3a6ff] ${
                  activeSection === link.id ? "text-[#a3a6ff]" : "text-[#adaaad]"
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              suppressHydrationWarning
              onClick={() => scrollTo("contact")}
              className="px-5 py-2 rounded-full bg-[#19191c] border border-[#a3a6ff]/20 text-sm font-medium hover:bg-[#1f1f22] hover:border-[#a3a6ff]/40 transition-all glow-accent"
            >
              Get Started
            </button>
          </nav>

          {/* Mobile Toggle */}
          <button suppressHydrationWarning className="md:hidden text-[#f9f5f8]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0e0e10]/95 backdrop-blur-md border-b border-[#a3a6ff]/10 py-4 px-6 flex flex-col gap-4">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className={`text-lg font-medium py-2 text-left ${
                activeSection === link.id ? "text-[#a3a6ff]" : "text-[#adaaad]"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
