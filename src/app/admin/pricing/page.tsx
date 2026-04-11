"use client";

import { useEffect, useMemo, useState } from "react";
import { Tag, Edit, Trash2, Plus, Save, X, Eye, EyeOff, Layout, CheckCircle2 } from "lucide-react";
import { PricingPackage } from "@/types";
import { formatPrice } from "@/components/PricingSection";
import { supabase } from "@/lib/supabase";
import { selectClause, toDatabaseField, toDatabasePayload, fromDatabaseRows } from "@/lib/supabase-api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type PackageForm = {
  category: string;
  title: string;
  slug: string;
  hasPlus: boolean;
  rawPrice: number;
  isPopular: boolean;
  badge: string;
  bestFor: string;
  features: string;
  contactSubject: string;
  enabled: boolean;
  sortOrder: number;
};

const emptyForm: PackageForm = {
  category: "Website Packages",
  title: "",
  slug: "",
  hasPlus: false,
  rawPrice: 0,
  isPopular: false,
  badge: "",
  bestFor: "",
  features: "",
  contactSubject: "",
  enabled: true,
  sortOrder: 0,
};

const initialPackages: Omit<PricingPackage, 'id'>[] = [
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
      "Up to 100 products",
      "Fully custom UI/UX design tailored to brand",
      "Mobile + tablet optimized",
      "Contact forms & WhatsApp chat integration",
      "On-page SEO optimization",
      "Speed & performance optimization",
      "Google indexing setup",
      "2-3 revision rounds"
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

export default function AdminPricing() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PackageForm>(emptyForm);
  const [viewingPkg, setViewingPkg] = useState<PricingPackage | null>(null);

  // Custom Confirmation Modal State
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onAction: () => void | Promise<void>;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onAction: () => {},
  });

  const triggerConfirm = (title: string, message: string, onAction: () => void | Promise<void>, isDanger = false) => {
    setConfirmData({ isOpen: true, title, message, onAction, isDanger });
  };

  // Prevent background scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isFormOpen || !!viewingPkg || confirmData.isOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFormOpen, viewingPkg, confirmData.isOpen]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("pricing_packages")
          .select(selectClause("pricing_packages"))
          .order("sortorder", { ascending: true });
        if (error) throw error;
        setPackages((data ?? []) as unknown as PricingPackage[]);
      } catch {
        toast.error("Failed to fetch packages.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEdit = (pkg: PricingPackage) => {
    setEditingId(pkg.id ?? null);
    setFormData({
      category: pkg.category,
      title: pkg.title,
      slug: pkg.slug,
      hasPlus: pkg.hasPlus,
      rawPrice: pkg.rawPrice,
      isPopular: pkg.isPopular,
      badge: pkg.badge || "",
      bestFor: pkg.bestFor,
      features: pkg.features.join("\n"),
      contactSubject: pkg.contactSubject,
      enabled: pkg.enabled,
      sortOrder: pkg.sortOrder,
    });
    setIsFormOpen(true);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      setFormData((current) => ({ ...current, [name]: (event.target as HTMLInputElement).checked }));
      return;
    }
    setFormData((current) => ({
      ...current,
      [name]: name === "rawPrice" || name === "sortOrder" ? Number(value) : value,
    }));
  };

  const persistPackage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title.trim() || !formData.slug.trim()) {
      toast.error("Please fill required fields (Title, Slug).");
      return;
    }

    const action = async () => {
      setSubmitLoading(true);
      try {
        const payload = {
          category: formData.category,
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          hasPlus: formData.hasPlus,
          rawPrice: formData.rawPrice,
          isPopular: formData.isPopular,
          badge: formData.badge.trim(),
          bestFor: formData.bestFor.trim(),
          features: formData.features.split("\n").map(f => f.trim()).filter(Boolean),
          contactSubject: formData.contactSubject.trim() || formData.title.trim(),
          enabled: formData.enabled,
          sortOrder: formData.sortOrder,
        };

        if (editingId) {
          const { error } = await supabase
            .from("pricing_packages")
            .update(toDatabasePayload("pricing_packages", { ...payload, updatedAt: new Date().toISOString() }))
            .eq("id", editingId);

          if (error) throw error;
          setPackages((current) =>
            current.map((p) => (p.id === editingId ? { ...p, ...payload } : p))
          );
          toast.success("Package updated.");
        } else {
          const { data, error } = await supabase
            .from("pricing_packages")
            .insert([toDatabasePayload("pricing_packages", { ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })])
            .select(selectClause("pricing_packages"))
            .single();

          if (error) throw error;
          setPackages((current) => [...current, data as unknown as PricingPackage]);
          toast.success("Package created.");
        }

        resetForm();
      } catch {
        toast.error("Failed to save package.");
      } finally {
        setSubmitLoading(false);
      }
    };

    triggerConfirm(
      editingId ? "Update Pricing Package" : "Create Pricing Package",
      editingId ? `Save all changes to "${formData.title}"?` : "Confirm creating this new pricing category?",
      action
    );
  };

  const removePackage = async (id: string, title: string) => {
    if (!id) return;
    
    const action = async () => {
      try {
        const { error } = await supabase.from("pricing_packages").delete().eq("id", id);
        if (error) throw error;
        setPackages((current) => current.filter((item) => item.id !== id));
        toast.success("Package deleted.");
      } catch {
        toast.error("Failed to delete package.");
      }
    };

    triggerConfirm("Delete Package", `Are you sure you want to permanently delete "${title}"? This cannot be undone.`, action, true);
  };

  const toggleStatus = async (pkg: PricingPackage) => {
    if (!pkg.id) return;
    
    const action = async () => {
      try {
        const next = !pkg.enabled;
        const { error } = await supabase
          .from("pricing_packages")
          .update(toDatabasePayload("pricing_packages", { enabled: next, updatedAt: new Date().toISOString() }))
          .eq("id", pkg.id);
        if (error) throw error;
        setPackages((current) =>
          current.map((item) => (item.id === pkg.id ? { ...item, enabled: next } : item))
        );
        toast.success(next ? "Package enabled." : "Package disabled.");
      } catch {
        toast.error("Failed to update status.");
      }
    };

    triggerConfirm(
      pkg.enabled ? "Disable Package" : "Enable Package",
      `${pkg.enabled ? "Disable" : "Enable"} package "${pkg.title}"?`,
      action
    );
  };

  const inputCls = "w-full rounded-xl border border-[#3B82F6]/15 bg-[#0B0F14] px-4 py-3 text-[#F8FAFC] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/30 outline-none transition-all placeholder:text-[#4A5568] text-sm";
  const btnPrimary = "inline-flex items-center gap-2 rounded-xl bg-[#3B82F6] px-6 py-3 text-[#0B0F14] font-bold text-xs uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50";

  const seedDefaults = async () => {
    setSubmitLoading(true);
    try {
      const payload = initialPackages.map(p => toDatabasePayload("pricing_packages", {
        ...p,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from("pricing_packages")
        .insert(payload)
        .select(selectClause("pricing_packages"));
        
      if (error) throw error;
      
      setPackages(fromDatabaseRows<PricingPackage>("pricing_packages", data));
      toast.success("Default packages synced to database!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to seed packages.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSeedDefaults = () => {
    triggerConfirm(
      "Seed Default Packages", 
      "This will populate your database with the 6 standard AxisX pricing cards. Continue?", 
      seedDefaults
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#3B82F6]/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
              <Tag size={20} />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-[#F8FAFC]">Pricing Packages</h1>
          </div>
          <p className="text-[#94A3B8]">Manage pricing tables, features and availability.</p>
        </div>

        <button onClick={isFormOpen ? resetForm : openCreate} className={btnPrimary}>
          {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          {isFormOpen ? "Cancel Form" : "Create Package"}
        </button>
      </header>

      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={persistPackage}
            className="glass-strong rounded-[32px] border border-[#3B82F6]/15 p-8 md:p-10 space-y-8 relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/10">
                {editingId ? <Edit size={16} /> : <Plus size={16} />}
              </div>
              <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">
                {editingId ? "Update Package" : "New Pricing Package"}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} className={inputCls}>
                  <option value="Website Packages">Website Packages</option>
                  <option value="eCommerce Packages">eCommerce Packages</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Package Title *</label>
                <input name="title" value={formData.title} onChange={handleChange} className={inputCls} placeholder="e.g. Starter Website" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Slug *</label>
                <input name="slug" value={formData.slug} onChange={handleChange} className={inputCls} placeholder="starter-website" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col justify-end pt-1">
                <label className="inline-flex items-center gap-3 cursor-pointer group mt-[28px]">
                  <div className="relative">
                    <input type="checkbox" name="hasPlus" checked={formData.hasPlus} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#111827] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Append &apos;+&apos; Sign</span>
                </label>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Raw Price (Number) *</label>
                <input name="rawPrice" type="number" value={formData.rawPrice} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Sort Order</label>
                <input name="sortOrder" type="number" value={formData.sortOrder} onChange={handleChange} className={inputCls} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Best For text</label>
                <input name="bestFor" value={formData.bestFor} onChange={handleChange} className={inputCls} placeholder="Small businesses & startups..." />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Optional Badge</label>
                <input name="badge" value={formData.badge} onChange={handleChange} className={inputCls} placeholder="Most Popular" />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Features (One per line)</label>
                  <textarea name="features" rows={6} value={formData.features} onChange={handleChange} className={`${inputCls} resize-none`} placeholder="Up to 5 pages\nMobile responsive..." />
               </div>
               <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] ml-1 mb-2 block">Contact Subject Override</label>
                  <input name="contactSubject" value={formData.contactSubject} onChange={handleChange} className={inputCls} placeholder="Overrides default title if set" />
               </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-4">
              <label className="inline-flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" name="isPopular" checked={formData.isPopular} onChange={handleChange} className="sr-only peer" />
                  <div className="w-11 h-6 bg-[#111827] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3B82F6]"></div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#94A3B8]">Highlight as Popular</span>
              </label>

              <button type="submit" disabled={submitLoading} className={`${btnPrimary} min-w-[200px]`}>
                <Save size={16} /> {submitLoading ? "Processing..." : editingId ? "Sync Update" : "Create Package"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(n => <div key={n} className="h-48 rounded-[32px] bg-[#111827]/40 border border-[#3B82F6]/10 animate-pulse" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="rounded-[32px] border border-[#3B82F6]/10 py-32 text-center glass-strong">
          <Tag size={48} className="mx-auto text-[#4A5568] mb-6" />
          <p className="text-[#F8FAFC] font-bold text-xl font-outfit">No pricing packages found</p>
          <p className="text-[#94A3B8] text-sm mt-1 mb-8">Your database is currently empty. Would you like to load the 6 default AxisX Studio packages?</p>
          <button 
            disabled={submitLoading}
            onClick={handleSeedDefaults}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-white font-bold text-xs uppercase tracking-widest hover:bg-[#3B82F6] hover:text-[#0B0F14] transition-all hover:border-[#3B82F6]"
          >
            {submitLoading ? "Seeding..." : "Load Default Packages"}
          </button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <motion.div
              layout
              key={pkg.id}
              onClick={() => setViewingPkg(pkg)}
              className="glass-strong rounded-3xl p-6 border border-[#3B82F6]/10 hover:border-[#3B82F6]/30 transition-all flex flex-col cursor-pointer group/card h-full"
            >
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <span className="text-[10px] font-bold text-[#3B82F6] uppercase">{pkg.category}</span>
                    <h3 className="font-bold text-xl text-[#F8FAFC] font-outfit mt-1 group-hover/card:text-[#3B82F6] transition-colors">{pkg.title}</h3>
                 </div>
                 <button
                    onClick={(e) => { e.stopPropagation(); toggleStatus(pkg); }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${pkg.enabled
                      ? 'bg-[#10B981]/20 text-[#10B981]'
                      : 'bg-[#ef4444]/20 text-[#ef4444]'
                    }`}
                 >
                    {pkg.enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                 </button>
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                 <span className="text-3xl font-black text-[#F8FAFC]">{formatPrice(pkg.rawPrice, pkg.hasPlus)}</span>
              </div>
              
              <ul className="space-y-2 mb-6 flex-grow">
                 {pkg.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="text-xs text-[#94A3B8] flex items-center gap-2">
                       <span className="w-1 h-1 rounded-full bg-[#3B82F6]"></span> {f}
                    </li>
                 ))}
                 {pkg.features.length > 3 && (
                    <li className="text-xs text-[#4A5568] mt-1 italic group-hover/card:text-[#3B82F6] transition-colors">+{pkg.features.length - 3} more...</li>
                 )}
              </ul>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A5568] group-hover/card:text-[#3B82F6] transition-colors flex items-center gap-1.5">
                  <Layout size={12} /> Inspect Unit
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(pkg); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0B0F14] border border-white/5 hover:border-[#3B82F6]/20 text-[#4A5568] hover:text-[#3B82F6] transition-all"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removePackage(pkg.id!, pkg.title); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0B0F14] border border-white/5 hover:border-[#ef4444]/20 text-[#4A5568] hover:text-[#ef4444] transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Package Detail View Modal */}
      <AnimatePresence>
        {viewingPkg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setViewingPkg(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl glass-strong border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
            >
              <button 
                onClick={() => setViewingPkg(null)}
                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors border border-white/10"
              >
                <X size={20} />
              </button>

              <div className="mb-10">
                <span className="inline-block px-3 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] font-bold text-[10px] uppercase tracking-widest mb-4 border border-[#3B82F6]/20">
                  {viewingPkg.category}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold font-outfit text-white mb-2">{viewingPkg.title}</h2>
                <p className="text-[#94A3B8] text-lg font-medium">{viewingPkg.bestFor}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div>
                   <h4 className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em] mb-6">Price & Structure</h4>
                   <div className="space-y-6">
                      <div>
                         <p className="text-[#4A5568] text-[10px] font-bold uppercase tracking-widest mb-1">Raw Price</p>
                         <p className="text-3xl font-black text-white">{formatPrice(viewingPkg.rawPrice, viewingPkg.hasPlus)}</p>
                      </div>
                      <div className="flex items-center gap-10">
                        <div>
                           <p className="text-[#4A5568] text-[10px] font-bold uppercase tracking-widest mb-1">Status</p>
                           <span className={`text-[10px] font-bold uppercase ${viewingPkg.enabled ? 'text-[#10B981]' : 'text-[#ef4444]'}`}>
                              {viewingPkg.enabled ? 'Publicly Visible' : 'Hidden/Disabled'}
                           </span>
                        </div>
                        <div>
                           <p className="text-[#4A5568] text-[10px] font-bold uppercase tracking-widest mb-1">Highlighted</p>
                           <span className="text-[10px] font-bold uppercase text-[#94A3B8]">
                              {viewingPkg.isPopular ? 'Popular Badge Active' : 'Standard Card'}
                           </span>
                        </div>
                      </div>
                   </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em] mb-6">Included Features</h4>
                   <ul className="space-y-3">
                      {viewingPkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                           <CheckCircle2 size={16} className="text-[#3B82F6] mt-0.5 shrink-0" />
                           <span className="text-sm text-[#CBD5E1] leading-relaxed">{f}</span>
                        </li>
                      ))}
                   </ul>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
                <button
                  onClick={() => {
                    setViewingPkg(null);
                    openEdit(viewingPkg);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-[#3B82F6] text-[#0B0F14] font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
                >
                  Edit Package
                </button>
                <button
                  onClick={() => setViewingPkg(null)}
                  className="flex-1 py-4 rounded-2xl bg-white/5 text-[#94A3B8] font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal Component */}
      <AnimatePresence>
        {confirmData.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-strong border border-white/10 rounded-[32px] p-8 shadow-2xl overflow-hidden"
            >
              {confirmData.isDanger && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              )}
              <h3 className="text-xl font-bold font-outfit text-[#F8FAFC] mb-4">{confirmData.title}</h3>
              <p className="text-[#94A3B8] text-sm leading-relaxed mb-8">{confirmData.message}</p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setConfirmData(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 rounded-2xl bg-white/5 text-[#94A3B8] font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmData.onAction();
                    setConfirmData(prev => ({ ...prev, isOpen: false }));
                  }}
                  className={`flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
                    confirmData.isDanger 
                      ? "bg-red-500 text-white hover:bg-red-600" 
                      : "bg-[#3B82F6] text-[#0B0F14] hover:bg-white"
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


