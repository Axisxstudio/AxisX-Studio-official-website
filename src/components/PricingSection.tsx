"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PricingPackage } from "@/types";
import { selectClause, fromDatabaseRows } from "@/lib/supabase-api";
import { CONTACT_INFO } from "@/lib/contact-info";

export function formatPrice(rawPrice: number, hasPlus: boolean): string {
  // If price is a neat hundred (e.g. 200, 400), subtract 1 to get $199, $399
  const roundedAmount = rawPrice % 100 === 0 ? rawPrice - 1 : rawPrice;
  return `$${roundedAmount}${hasPlus ? "+" : ""}`;
}

const initialPackages: PricingPackage[] = [
  {
    category: "Website Packages",
    title: "Starter Website",
    slug: "starter-website",
    rawPrice: 200,
    hasPlus: false,
    isPopular: false,
    bestFor: "Small businesses & personal brands",
    features: [
      "Up to 5 pages",
      "Mobile responsive design",
      "Modern UI layout",
      "Contact form with email notifications",
      "Basic SEO setup",
      "Fast loading optimization",
      "1 revision"
    ],
    contactSubject: "Starter Website",
    enabled: true,
    sortOrder: 10
  },
  {
    category: "Website Packages",
    title: "Business Website",
    slug: "business-website",
    rawPrice: 400,
    hasPlus: false,
    isPopular: true,
    badge: "Most Popular",
    bestFor: "Growing businesses",
    features: [
      "Up to 10 pages",
      "Fully custom UI/UX design tailored to brand",
      "Mobile + tablet optimized",
      "Contact forms & WhatsApp chat integration",
      "On-page SEO optimization",
      "Speed & performance optimization",
      "Google indexing setup",
      "2–3 revision rounds"
    ],
    contactSubject: "Business Website",
    enabled: true,
    sortOrder: 20
  },
  {
    category: "Website Packages",
    title: "Premium Website",
    slug: "premium-website",
    rawPrice: 800,
    hasPlus: true,
    isPopular: false,
    bestFor: "Companies & startups",
    features: [
      "Fully custom design",
      "Unlimited pages within agreed scope",
      "Advanced UI/UX experience",
      "API integrations if required",
      "Admin panel optional",
      "Advanced performance optimization",
      "SEO-ready architecture",
      "Priority support"
    ],
    contactSubject: "Premium Website",
    enabled: true,
    sortOrder: 30
  },
  {
    category: "eCommerce Packages",
    title: "Starter eCommerce",
    slug: "starter-ecommerce",
    rawPrice: 400,
    hasPlus: false,
    isPopular: false,
    bestFor: "Small online shops",
    features: [
      "Up to 25 products",
      "Shopping cart & checkout",
      "Payment gateway integration",
      "Mobile responsive design",
      "Basic SEO",
      "Order management system"
    ],
    contactSubject: "Starter eCommerce",
    enabled: true,
    sortOrder: 40
  },
  {
    category: "eCommerce Packages",
    title: "Business eCommerce",
    slug: "business-ecommerce",
    rawPrice: 700,
    hasPlus: false,
    isPopular: true,
    badge: "Recommended",
    bestFor: "Growing online stores",
    features: [
      "Up to 100 products",
      "Custom UI/UX design",
      "Payment & delivery integration",
      "Customer accounts",
      "Inventory management",
      "Speed optimization",
      "SEO optimization"
    ],
    contactSubject: "Business eCommerce",
    enabled: true,
    sortOrder: 50
  },
  {
    category: "eCommerce Packages",
    title: "Advanced eCommerce",
    slug: "advanced-ecommerce",
    rawPrice: 1300,
    hasPlus: true,
    isPopular: false,
    bestFor: "Large-scale businesses",
    features: [
      "Unlimited products",
      "Fully custom system",
      "Admin dashboard",
      "Advanced analytics",
      "API integrations",
      "Multi-vendor optional",
      "High-performance architecture"
    ],
    contactSubject: "Advanced eCommerce",
    enabled: true,
    sortOrder: 60
  }
];

export default function PricingSection() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeMobileCategory, setActiveMobileCategory] = useState("Website Packages");
  
  const [mobileWebIndex, setMobileWebIndex] = useState(0);
  const [mobileEcomIndex, setMobileEcomIndex] = useState(0);
  
  const webScrollRef = useRef<HTMLDivElement>(null);
  const ecomScrollRef = useRef<HTMLDivElement>(null);

  const handleWebScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;
    const idx = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
    setMobileWebIndex(idx);
  };

  const handleEcomScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return;
    const idx = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
    setMobileEcomIndex(idx);
  };

  useEffect(() => {
    const autoScroll = setInterval(() => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return;
      
      const activeRef = activeMobileCategory === "Website Packages" ? webScrollRef.current : ecomScrollRef.current;
      if (!activeRef) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = activeRef;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        activeRef.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        activeRef.scrollBy({ left: clientWidth, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(autoScroll);
  }, [activeMobileCategory]);

  useEffect(() => {
    async function fetchPricing() {
      try {
        const { data, error } = await supabase
          .from("pricing_packages")
          .select(selectClause("pricing_packages"))
          .order("sortorder", { ascending: true });

        if (error) {
          console.error("Error fetching pricing packages:", error);
          setPackages(initialPackages); // Fall back to hardcoded data
          return;
        }

        if (data && data.length > 0) {
          setPackages(fromDatabaseRows<PricingPackage>("pricing_packages", data));
        } else {
          // If DB table is completely empty, default to the initial packages
          setPackages(initialPackages);
        }
      } catch (err) {
        console.error("Unexpected error fetching prices:", err);
        setPackages(initialPackages);
      } finally {
        setLoading(false);
      }
    }

    fetchPricing();
  }, []);

  const handleContactClick = (subject: string) => {
    // Navigate to contact section
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
      
      // Auto-fill subject by setting a custom event or writing to a global state/window
      // For this implementation, we will dispatch a custom window event that the contact form can listen to.
      window.dispatchEvent(new CustomEvent("set-contact-subject", { detail: subject }));
    } else {
      // If contact section doesn't exist on this page, navigate to contact page with query param
      window.location.href = `/contact?subject=${encodeURIComponent(subject)}`;
    }
  };

  const handleWhatsAppClick = (pkg: PricingPackage) => {
    const price = formatPrice(pkg.rawPrice, pkg.hasPlus);
    const message = `Hi AxisX Studio, I am interested in the ${pkg.title} package (${price}). Can you provide more details?`;
    const phone = CONTACT_INFO.phone.display.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  // Group by category
  const websitePackages = packages.filter(p => p.category.includes("Website"));
  const eComPackages = packages.filter(p => p.category.includes("eCommerce") || p.category.includes("e-commerce"));

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-[#0e0e11]">
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#3B82F6]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <div className="text-center mb-16 md:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111827]/80 border border-[#3B82F6]/20 mb-6 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#3B82F6]">Pricing & Packages</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-outfit text-[#F8FAFC] mb-6">
            Transparent Pricing, <br className="hidden md:block" /> <span className="gradient-text-alt uppercase">Unmatched Value</span>
          </h2>
          <p className="text-[#94A3B8] max-w-2xl mx-auto text-sm sm:text-lg">
            Choose the perfect engineering package tailored exactly to the scale and vision of your modern brand.
          </p>
        </div>

        {/* Mobile Category Toggle */}
        <div className="md:hidden flex justify-center mb-10">
          <div className="flex p-1 bg-[#111827] rounded-full border border-white/5 relative isolate">
            <button
              onClick={() => setActiveMobileCategory("Website Packages")}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-colors z-10 ${
                activeMobileCategory === "Website Packages" 
                  ? "text-white" 
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {activeMobileCategory === "Website Packages" && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 rounded-full btn-ltr-blue shadow-lg shadow-blue-500/10 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              Website
            </button>
            <button
              onClick={() => setActiveMobileCategory("eCommerce Packages")}
              className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-colors z-10 ${
                activeMobileCategory === "eCommerce Packages" 
                  ? "text-white" 
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {activeMobileCategory === "eCommerce Packages" && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 rounded-full btn-ltr-blue shadow-lg shadow-blue-500/10 -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              eCommerce
            </button>
          </div>
        </div>

        {/* Website Packages Title (Desktop) */}
        {websitePackages.length > 0 && (
          <div className="hidden md:block mb-12 text-center md:text-left">
            <h3 className="text-2xl font-bold font-outfit text-white mb-2">Website Packages</h3>
            <p className="text-[#94A3B8] text-sm">Professional platforms for businesses, personal brands, and agencies.</p>
          </div>
        )}

        {/* Website Cards Grid */}
        {websitePackages.length > 0 && (
          <div className="relative">
            <div 
               ref={webScrollRef}
               onScroll={handleWebScroll}
               className={`
               ${activeMobileCategory === "Website Packages" ? "flex" : "hidden md:flex"}
               md:grid md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-8 mb-6 md:mb-20 
               overflow-x-auto pt-8 pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:pt-0 snap-x snap-mandatory md:overflow-visible items-stretch scrollbar-hide
            `}>
              {websitePackages.map((pkg, idx) => (
              <div key={pkg.id || idx} className="min-w-full px-2 sm:min-w-[340px] md:min-w-0 md:px-0 snap-center shrink-0 box-border">
                <PricingCard pkg={pkg} onContactClick={handleContactClick} onWhatsAppClick={handleWhatsAppClick} idx={idx} />
              </div>
            ))}
            </div>

            {/* Pagination Dots (Mobile) */}
            <div className={`flex justify-center gap-2 mb-16 md:hidden ${activeMobileCategory === "Website Packages" ? "flex" : "hidden"}`}>
              {websitePackages.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${mobileWebIndex === idx ? 'w-6 bg-[#3B82F6]' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* eCommerce Packages Title (Desktop) */}
        {eComPackages.length > 0 && (
          <div className="hidden md:block mb-12 text-center md:text-left">
            <h3 className="text-2xl font-bold font-outfit text-white mb-2">eCommerce Packages</h3>
            <p className="text-[#94A3B8] text-sm">Powerful online storefronts designed for high conversions and scale.</p>
          </div>
        )}

        {/* eCommerce Cards Grid */}
        {eComPackages.length > 0 && (
          <div className="relative">
            <div 
               ref={ecomScrollRef}
               onScroll={handleEcomScroll}
               className={`
               ${activeMobileCategory === "eCommerce Packages" ? "flex" : "hidden md:flex"}
               md:grid md:grid-cols-2 lg:grid-cols-3 gap-0 md:gap-8 mb-6 md:mb-20
               overflow-x-auto pt-8 pb-4 -mx-6 px-6 md:mx-0 md:px-0 md:pt-0 snap-x snap-mandatory md:overflow-visible items-stretch scrollbar-hide
            `}>
              {eComPackages.map((pkg, idx) => (
                <div key={pkg.id || idx} className="min-w-full px-2 sm:min-w-[340px] md:min-w-0 md:px-0 snap-center shrink-0 box-border">
                  <PricingCard pkg={pkg} onContactClick={handleContactClick} onWhatsAppClick={handleWhatsAppClick} idx={idx} />
                </div>
              ))}
            </div>

            {/* Pagination Dots (Mobile) */}
            <div className={`flex justify-center gap-2 mb-16 md:hidden ${activeMobileCategory === "eCommerce Packages" ? "flex" : "hidden"}`}>
              {eComPackages.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${mobileEcomIndex === idx ? 'w-6 bg-[#3B82F6]' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PricingCard({ pkg, onContactClick, onWhatsAppClick, idx }: { 
  pkg: PricingPackage; 
  onContactClick: (subject: string) => void; 
  onWhatsAppClick: (pkg: PricingPackage) => void;
  idx: number 
}) {
  const isDisabled = pkg.enabled === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: idx * 0.1, duration: 0.5 }}
      whileHover={!isDisabled ? { y: -8 } : {}}
      className={`glass-strong rounded-3xl p-8 relative flex flex-col h-full border transition-all duration-300 group ${
        isDisabled 
          ? 'border-[#ef4444]/50 bg-[#0e0e11] opacity-75'
          : pkg.isPopular 
            ? 'border-[#3B82F6]/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] bg-[#0B0F14]/80' 
            : 'border-[#3B82F6]/10 hover:border-[#3B82F6]/30 hover:shadow-xl hover:bg-[#0B0F14]/60'
      }`}
    >
      {isDisabled && (
        <div className="absolute -top-4 left-8 px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full text-white shadow-lg bg-[#ef4444] z-10 border border-[#ef4444]/50">
          Currently Not Available
        </div>
      )}
      
      {!isDisabled && pkg.badge && (
        <motion.div 
          animate={pkg.isPopular ? { 
            y: [0, -3, 0],
            filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
          } : {}}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className={`absolute -top-4 left-8 px-4 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full text-white shadow-lg z-10 ${
            pkg.isPopular ? 'bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]' : 'bg-[#111827] border border-[#3B82F6]/30'
          }`}
        >
          {pkg.badge}
        </motion.div>
      )}

      <div className={`mb-6 pt-2 ${isDisabled ? 'opacity-60 grayscale' : ''}`}>
        <h4 className="text-xl font-bold font-outfit text-[#F8FAFC] mb-1">{pkg.title}</h4>
        <p className="text-[#94A3B8] text-xs font-medium tracking-tight">{pkg.bestFor}</p>
      </div>

      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl md:text-4xl font-black font-outfit text-white tracking-tight">{formatPrice(pkg.rawPrice, pkg.hasPlus)}</span>
          {!pkg.hasPlus && <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-widest">/one-time</span>}
        </div>
      </div>

      <div className={`space-y-4 mb-10 flex-grow ${isDisabled ? 'opacity-60 grayscale' : ''}`}>
        {pkg.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-[#3B82F6] shrink-0 mt-0.5" />
            <span className="text-[#CBD5E1] text-sm leading-snug">{feature}</span>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
        <button
          disabled={isDisabled}
          onClick={() => onContactClick(pkg.contactSubject)}
          className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${
             isDisabled 
               ? 'bg-[#111827] text-[#4A5568] cursor-not-allowed border border-white/5'
               : pkg.isPopular 
                 ? 'btn-ltr-blue text-white shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20' 
                 : 'bg-[#111827] border border-[#3B82F6]/20 text-white hover:border-[#3B82F6]/50 hover:bg-[#1F2937]'
          }`}
        >
          <span>{isDisabled ? "Unavailable" : "Choose Package"}</span>
          <ChevronRight size={18} className={!isDisabled ? "group-hover:translate-x-1 transition-transform" : ""} />
        </button>
      </div>
      
      {/* Absolute Contact Icon button at bottom right */}
      {!isDisabled && (
        <button
          onClick={() => onWhatsAppClick(pkg)}
          title={`Enquire about ${pkg.title} on WhatsApp`}
          className={`absolute bottom-[-16px] right-6 w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg ${
             pkg.isPopular
                ? 'bg-[#25D366] text-white border-4 border-[#0e0e11]'
                : 'bg-[#1F2937] text-[#25D366] hover:text-white hover:bg-[#25D366] border-4 border-[#0e0e11]'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </button>
      )}

    </motion.div>
  );
}
