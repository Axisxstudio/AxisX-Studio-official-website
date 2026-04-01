"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

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
    <footer className="border-t border-[#a3a6ff]/10 bg-[#0e0e10] py-12 mt-4 relative">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 text-[#adaaad] text-sm">
          <div>
            <Link href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2 mb-5">
              <span className="w-8 h-8 rounded bg-gradient-to-br from-[#a3a6ff] to-[#c180ff] flex items-center justify-center text-[#0e0e10] font-black text-xl">X</span>
              <span className="font-outfit text-[#f9f5f8]">Axis<span className="text-[#a3a6ff]">X</span></span>
            </Link>
            <p className="leading-relaxed">
              Premium web development services. We build exceptional digital experiences for modern brands.
            </p>
          </div>

          <div>
            <h4 className="text-[#f9f5f8] font-semibold mb-5">Services</h4>
            <ul className="space-y-3">
              {["Web Development", "UI/UX Design", "E-commerce Solutions", "Web Applications"].map(s => (
                <li key={s}>
                  <button suppressHydrationWarning onClick={() => scrollTo("services")} className="hover:text-[#a3a6ff] transition-colors text-left">{s}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#f9f5f8] font-semibold mb-5">Company</h4>
            <ul className="space-y-3">
              {[
                { label: "About Us", id: "about" },
                { label: "Portfolio", id: "projects" },
                { label: "Client Feedback", id: "feedback" },
                { label: "Contact", id: "contact" },
              ].map(item => (
                <li key={item.id}>
                  <button suppressHydrationWarning onClick={() => scrollTo(item.id)} className="hover:text-[#a3a6ff] transition-colors text-left">{item.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#f9f5f8] font-semibold mb-5">Contact Us</h4>
            <ul className="space-y-3">
              <li>hello@axisx.dev</li>
              <li>+1 (555) 000-0000</li>
              <li>123 Innovation Drive<br />Tech City, TC 90210</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#a3a6ff]/10 mt-14 pt-8 text-sm text-[#adaaad]">
          <p>© {currentYear} AxisX. All rights reserved.</p>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <Link
              href="/login"
              aria-label="Admin Login"
              className="relative z-10 inline-flex items-center gap-2 rounded-full border border-[#a3a6ff]/15 px-3 py-2 text-xs font-medium text-[#adaaad] opacity-70 transition-all hover:opacity-100 hover:border-[#a3a6ff]/35 hover:text-[#a3a6ff]"
            >
              <Lock size={14} />
              <span>Admin Login</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
