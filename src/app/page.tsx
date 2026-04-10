"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Code, Layout, Zap, Users,
  Server, LayoutDashboard, Search, FileCode2, Palette,
  Mail, Phone, MapPin, Send, CheckCircle2,
  ExternalLink, Utensils, GraduationCap, ShoppingBag,
  Briefcase, HeartPulse, Scissors, Hotel, CheckCircle, X,
} from "lucide-react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProjectModal from "@/components/ProjectModal";
import FeedbackSection from "@/components/FeedbackSection";
import { TypingText } from "@/components/TypingText";
import { CountUp } from "@/components/CountUp";
import { supabase } from "@/lib/supabase";
import { selectClause, toDatabaseField, toDatabasePayload } from "@/lib/supabase-api";
import { CONTACT_INFO } from "@/lib/contact-info";
import { Project } from "@/types";
import { useEffect } from "react";
import toast from "react-hot-toast";

/* ─── Animation Variants ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const vp = { once: true, margin: "-80px" } as const;

/* ─── Business Verticals ─── */
const businessTypes = [
  { icon: <Utensils size={18} />, label: "Restaurants & Cafés", color: "text-[#F97316]", shadow: "shadow-[#F97316]/20", border: "border-[#F97316]/20", desc: "Custom digital menus, reservation systems, and vibrant websites to attract more diners." },
  { icon: <GraduationCap size={18} />, label: "Tuition & Education", color: "text-[#3B82F6]", shadow: "shadow-[#3B82F6]/20", border: "border-[#3B82F6]/20", desc: "LMS integrations, student portals, and engaging institutional websites for modern learning." },
  { icon: <ShoppingBag size={18} />, label: "Retail & Shops", color: "text-[#A855F7]", shadow: "shadow-[#A855F7]/20", border: "border-[#A855F7]/20", desc: "High-conversion e-commerce storefronts, inventory management, and seamless checkouts." },
  { icon: <Briefcase size={18} />, label: "Corporate & Portfolios", color: "text-[#10B981]", shadow: "shadow-[#10B981]/20", border: "border-[#10B981]/20", desc: "Professional corporate sites and stunning portfolios that showcase your brand authority." },
  { icon: <HeartPulse size={18} />, label: "Clinics & Healthcare", color: "text-[#F43F5E]", shadow: "shadow-[#F43F5E]/20", border: "border-[#F43F5E]/20", desc: "Secure patient portals, appointment scheduling, and compliant medical websites." },
  { icon: <Scissors size={18} />, label: "Salons & Beauty", color: "text-[#F59E0B]", shadow: "shadow-[#F59E0B]/20", border: "border-[#F59E0B]/20", desc: "Booking systems, service galleries, and elegant designs that reflect your brand's aesthetic." },
  { icon: <Hotel size={18} />, label: "Hotels & Hospitality", color: "text-[#0EA5E9]", shadow: "shadow-[#0EA5E9]/20", border: "border-[#0EA5E9]/20", desc: "Direct booking engines, property showcases, and immersive digital hospitality experiences." },
  { icon: <Layout size={18} />, label: "Agencies & Startups", color: "text-[#8B5CF6]", shadow: "shadow-[#8B5CF6]/20", border: "border-[#8B5CF6]/20", desc: "Cutting-edge web apps, SaaS landing pages, and scalable platforms to fuel hyper-growth." },
];

/* ─── Services Data ─── */
const services = [
  { icon: <FileCode2 className="text-[#3B82F6]" size={36} />, title: "Full-Stack Development", desc: "Eliminate technical debt before it starts. We architect end-to-end web applications designed for scale, utilizing robust serverless backends to handle traffic spikes effortlessly." },
  { icon: <Palette className="text-[#94A3B8]" size={36} />, title: "UI/UX Engineering", desc: "Stop losing users to confusion. We engineer intuitive, high-conversion interfaces rooted in buyer psychology, mapping complex user journeys to reduce bounce rates and increase sales." },
  { icon: <Server className="text-[#3B82F6]" size={36} />, title: "API & Backend Systems", desc: "Robust, secure APIs and microservices architecture designed to integrate seamlessly and scale effortlessly with your business growth and data demands." },
  { icon: <Zap className="text-[#94A3B8]" size={36} />, title: "Performance Optimization", desc: "Make speed your competitive advantage. We forensically audit your codebase, implementing advanced caching to deliver sub-second loading speeds that actively boost SEO." },
  { icon: <LayoutDashboard className="text-[#3B82F6]" size={36} />, title: "Admin Tools & Dashboards", desc: "Reclaim wasted operational hours. We build bespoke internal tools tailored precisely to your workflow, automating repetitive tasks and turning raw data into actionable insights." },
  { icon: <Search className="text-[#94A3B8]" size={36} />, title: "Technical SEO", desc: "Semantic markup, dynamic sitemaps, server-side rendering, and structured JSON-LD data implementations to guarantee maximum visibility across search engine algorithms." },
];

/* ─── About Values ─── */
const values = [
  { icon: <Code size={24} />, title: "Engineering Excellence", text: "We write clean, strongly-typed, and modular code that ensures your digital infrastructure is stable today and easily extensible tomorrow." },
  { icon: <Zap size={24} />, title: "Performance First", text: "Speed is a critical business metric. We architect every layer of our stack to guarantee zero friction for your users." },
  { icon: <Users size={24} />, title: "Radical Transparency", text: "No black boxes. We provide continuous visibility into our cycles, acting directly as an extension of your command team." },
];

/* ─── Contact Form ─── */
function ContactForm() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = { name: formData.name.trim(), email: formData.email.trim().toLowerCase(), phone: formData.phone.trim(), subject: formData.subject.trim(), message: formData.message.trim() };
    if (!p.name || !p.email || !p.subject || !p.message) { toast.error("Please fill all required fields."); return; }
    setLoading(true);
    try {
      // Premium loading feel
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { error } = await supabase
        .from("contacts")
        .insert([toDatabasePayload("contacts", { ...p, status: "unread", createdAt: new Date().toISOString() })]);
      if (error) throw error;
      toast.success("Message sent successfully!");
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#0B0F14] border border-[#3B82F6]/20 rounded-xl px-4 py-3 text-[#F8FAFC] focus:border-[#3B82F6]/60 transition-colors placeholder:text-[#4a4a5a] text-sm";

  return (
    <AnimatePresence mode="wait">
      {!submitted ? (
        <motion.form
          key="form"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-[#94A3B8] mb-1.5">Name *</label>
              <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className={inputCls} placeholder="Nuwan Perera" />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#94A3B8] mb-1.5">Email *</label>
              <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className={inputCls} placeholder="hello@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-[#94A3B8] mb-1.5">Phone (Optional)</label>
              <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} placeholder="+94 77 123 4567" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-xs font-medium text-[#94A3B8] mb-1.5">Subject *</label>
              <input type="text" id="subject" name="subject" required value={formData.subject} onChange={handleChange} className={inputCls} placeholder="Project inquiry" />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="block text-xs font-medium text-[#94A3B8] mb-1.5">Message *</label>
            <textarea id="message" name="message" required rows={5} value={formData.message} onChange={handleChange} className={`${inputCls} resize-none`} placeholder="Tell us about your project..." />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.5 }}
            type="submit" disabled={loading}
            style={{
              backgroundPosition: loading ? '0 0' : '',
              transitionDuration: loading ? '1000ms' : ''
            }}
            className="btn-ltr-blue w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70 transition-all shadow-xl shadow-blue-500/10"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Send size={18} />}
            {loading ? "Sending..." : "Send Message"}
          </motion.button>
        </motion.form>
      ) : (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-12 text-center"
        >
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400">
            <CheckCircle2 size={40} />
          </div>
          <h3 className="text-2xl font-bold font-outfit mb-3 text-[#F8FAFC]">Message Sent!</h3>
          <p className="text-[#94A3B8] mb-8 max-w-sm">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
          <button onClick={() => setSubmitted(false)} className="px-6 py-2.5 rounded-xl bg-[#111827] border border-[#3B82F6]/20 hover:border-[#3B82F6]/50 text-sm font-semibold transition-all">
            Send Another
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Projects Section ─── */
function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select(selectClause("projects"))
          .eq(toDatabaseField("projects", "isPublished"), true)
          .order(toDatabaseField("projects", "createdAt"), { ascending: false });
        if (error) throw error;
        setProjects((data ?? []) as unknown as Project[]);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <section id="projects" className="py-24 border-t border-[#3B82F6]/10 relative">
      <div className="absolute right-0 top-1/3 w-[400px] h-[400px] bg-[#1F2937]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">Our <span className="gradient-text-alt">Portfolio</span></h2>
          <p className="text-[#94A3B8] max-w-2xl mx-auto">A selection of web applications and digital experiences we&apos;ve engineered.</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(n => <div key={n} className="glass rounded-3xl h-[360px] animate-pulse bg-[#111827]/50" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 glass-strong rounded-3xl border border-[#3B82F6]/10">
            <div className="w-20 h-20 bg-[#111827] rounded-full mx-auto mb-6 flex items-center justify-center border border-[#3B82F6]/20">
              <ExternalLink className="text-[#3B82F6]" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-3">New Projects Coming Soon</h3>
            <p className="text-[#94A3B8] max-w-md mx-auto">We are curating our portfolio and adding our latest case studies. Check back shortly.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
            className={`grid gap-10 ${projects.length === 1
              ? "grid-cols-1 max-w-xl mx-auto"
              : "grid-cols-1 md:grid-cols-2"
              }`}
          >
            {projects.map((project) => (
              <motion.div
                key={project.id}
                variants={fadeUp}
                onClick={() => setActiveProject(project)}
                className="group glass-strong rounded-3xl border border-[#3B82F6]/10 overflow-hidden hover:border-[#3B82F6]/30 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
              >
                <div className="relative h-56 md:h-72 w-full overflow-hidden bg-[#111827]">
                  {project.coverImageUrl ? (
                    <Image src={project.coverImageUrl} alt={project.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#94A3B8]">No Cover Image</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-transparent to-transparent opacity-80" />
                  <div className="absolute top-4 right-4 backdrop-blur-md bg-[#0B0F14]/60 border border-[#3B82F6]/20 rounded-full px-3 py-1 text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider">
                    {project.category}
                  </div>
                </div>
                <div className="p-7">
                  <h3 className="text-xl font-bold font-outfit mb-2 group-hover:text-[#3B82F6] transition-colors">{project.title}</h3>
                  <p className="text-[#94A3B8] text-sm line-clamp-2 mb-5 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.technologies?.slice(0, 4).map((tech, i) => (
                      <span key={i} className="text-xs px-3 py-1 rounded-full bg-[#161F2C] border border-[#3B82F6]/10 text-[#F8FAFC]">{tech}</span>
                    ))}
                    {project.technologies?.length > 4 && (
                      <span className="text-xs px-3 py-1 rounded-full bg-[#161F2C] border border-[#3B82F6]/10 text-[#94A3B8]">+{project.technologies.length - 4}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[#94A3B8] font-medium">Click to view details</span>
                    {project.slug && project.slug.startsWith("http") && (
                      <a
                        href={project.slug}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[#3B82F6] font-medium text-sm group-hover:gap-2 transition-all"
                      >
                        Live Site <ArrowRight size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {activeProject && (
          <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─── Page Root ─── */
export default function Home() {
  const [activeBusiness, setActiveBusiness] = useState<typeof businessTypes[0] | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveBusiness(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Navigation />
      <main className="flex-grow pt-20 md:pt-28 overflow-x-hidden">

        {/* ── HERO ── */}
        <section id="home" className="relative min-h-[85vh] md:min-h-[92vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#0B0F14]/80 z-10" />
            <div className="grid-bg absolute inset-0 z-20" />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}
              className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#3B82F6]/20 rounded-full blur-[120px] mix-blend-screen z-0" />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.5 }}
              className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#1F2937]/20 rounded-full blur-[100px] mix-blend-screen z-0" />
          </div>

          <motion.div initial="hidden" animate="visible" variants={stagger}
            className="container mx-auto px-6 relative z-30 max-w-5xl text-center">
            <motion.div variants={fadeUp} className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/5 text-[#3B82F6] text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B82F6]" />
              </span>
              <TypingText text="AxisX Studio | Web Development Company" />
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 font-outfit text-center leading-[1.1] max-w-[95vw] lg:max-w-[1400px] mx-auto">
              <span className="block mb-2 md:mb-4 lg:whitespace-nowrap">
                <TypingText text="Engineering" className="gradient-text" />{" "}
                <TypingText text="Digital Excellence" className="gradient-text-alt text-glow" delay={0.3} />
              </span>
              <span className="block lg:whitespace-nowrap">
                <TypingText text="for Modern Brands" delay={0.8} />
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-base md:text-lg text-[#94A3B8] max-w-3xl mx-auto mb-10 leading-relaxed">
              <TypingText text="AxisX Studio" className="font-bold" /> specializes in high-performance web application development, modern UI/UX design, and scalable software solutions tailored for businesses and startups.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-ltr-white px-8 py-4 rounded-full font-semibold w-full sm:w-auto flex items-center justify-center gap-2 group"
              >
                Start a Project <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
                className="btn-ltr-dark px-8 py-4 rounded-full font-semibold w-full sm:w-auto border border-[#3B82F6]/20"
              >
                View Our Work
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" className="py-24 border-t border-[#3B82F6]/10 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">Engineering <span className="gradient-text">Solutions</span></h2>
              <p className="text-[#94A3B8] max-w-2xl mx-auto">From MVPs to enterprise-grade platforms, we deliver technical excellence at every layer of the stack.</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="glass-strong p-8 rounded-2xl border border-[#3B82F6]/10 hover:border-[#3B82F6]/30 transition-all duration-500 hover:-translate-y-2 group">
                  <div className="w-14 h-14 rounded-xl bg-[#1F2937] border border-[#3B82F6]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow-accent">
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#F8FAFC] mb-3">{s.title}</h3>
                  <p className="text-[#94A3B8] text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Business Types Sub-section ── */}
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="mt-20">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#3B82F6]/20 bg-[#3B82F6]/5 text-[#3B82F6] text-xs font-semibold uppercase tracking-widest mb-4">
                  <CheckCircle size={13} /> We Build For
                </span>
                <h3 className="text-2xl md:text-3xl font-bold font-outfit text-[#F8FAFC]">
                  Websites &amp; Portfolios for <span className="gradient-text-alt">Every Business</span>
                </h3>
                <p className="text-[#94A3B8] mt-3 text-sm max-w-xl mx-auto">
                  Whether you run a restaurant, a tuition centre, a boutique shop, or a corporate firm — we craft a stunning online presence tailored to your audience.
                </p>
              </div>

              <motion.div
                initial="hidden" whileInView="visible" viewport={vp} variants={stagger}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
              >
                {businessTypes.map((bt, i) => (
                  <motion.div
                    key={i} variants={fadeUp}
                    onClick={() => setActiveBusiness(bt)}
                    className="flex items-center gap-4 p-5 rounded-[24px] border border-white/5 bg-[#0B0F14]/60 hover:bg-[#0B0F14] hover:border-[#3B82F6]/30 transition-all duration-500 group cursor-pointer shadow-xl"
                  >
                    <div className={`w-11 h-11 shrink-0 rounded-xl bg-[#111827] flex items-center justify-center ${bt.color} ${bt.shadow} shadow-[inset_0_0_12px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform border border-white/5`}>
                      {bt.icon}
                    </div>
                    <span className="text-sm font-bold text-[#F8FAFC] font-outfit tracking-tight">{bt.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Bottom note */}
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={vp} transition={{ delay: 0.4 }}
                className="text-center text-[#94A3B8] text-sm mt-8"
              >
                Don&apos;t see your industry?{" "}
                <button
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-[#3B82F6] hover:underline font-medium"
                >
                  Let&apos;s talk — we build for everyone.
                </button>
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-24 border-t border-[#3B82F6]/10 relative overflow-hidden">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={vp} transition={{ duration: 1.5 }}
            className="absolute top-0 right-1/3 w-[300px] h-[300px] bg-[#3B82F6]/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-6 max-w-7xl">

            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">About <TypingText text="AxisX Studio" className="gradient-text" /></h2>
              <p className="text-[#94A3B8] max-w-2xl mx-auto">
                A collective of digital craftsmen focused on engineering modern, high-performance web applications that drive real business growth.
              </p>
            </motion.div>

            {/* Mission */}
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="glass-strong rounded-3xl p-8 md:p-14 border border-[#3B82F6]/20 mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold font-outfit mb-5">Architecting Predictable Growth</h3>
                  <p className="text-[#94A3B8] leading-relaxed mb-4">
                    Too many digital projects fail because of a communication gap between business strategy and technical execution. Developers often build what was asked, but not what was <span className="text-[#F8FAFC] font-semibold">needed</span>.
                  </p>
                  <p className="text-[#94A3B8] leading-relaxed">
                    At <TypingText text="AxisX Studio" className="font-bold" />, our mission is to eliminate that gap. We interrogate your requirements and take ownership of the technical complexity, allowing you to focus entirely on scaling your business.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { to: 2, suffix: "+", label: "Years Exp", color: "text-[#3B82F6]" },
                    { to: 100, suffix: "%", label: "In-House", color: "text-[#F8FAFC]" },
                    { to: 3, suffix: "+", label: "Projects", color: "text-[#F8FAFC]" },
                    { to: 24, suffix: "h", label: "Response", color: "text-[#3B82F6]" },
                  ].map((stat, i) => (
                    <div key={i} className="glass p-5 rounded-2xl border border-[#3B82F6]/10 text-center hover:-translate-y-1 transition-transform">
                      <span className={`block text-3xl font-bold ${stat.color} mb-1`}>
                        <CountUp to={stat.to} suffix={stat.suffix} />
                      </span>
                      <span className="text-xs text-[#94A3B8] uppercase tracking-wider">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Values */}
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((v, i) => (
                <motion.div key={i} variants={fadeUp} className="glass p-8 rounded-2xl border border-transparent hover:border-[#3B82F6]/20 transition-all text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#111827] border border-[#3B82F6]/10 flex items-center justify-center mb-6 text-[#3B82F6] glow-accent">
                    {v.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                  <p className="text-[#94A3B8] text-sm">{v.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── PROJECTS ── */}
        <ProjectsSection />

        {/* ── FEEDBACK MARQUEE ── */}
        <FeedbackSection />

        {/* ── CONTACT ── */}
        <section id="contact" className="py-24 border-t border-[#3B82F6]/10 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={vp} transition={{ duration: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1F2937]/8 rounded-full blur-[100px] pointer-events-none"
          />
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">Let&apos;s <span className="gradient-text-alt">Connect</span></h2>
              <p className="text-[#94A3B8] max-w-2xl mx-auto">
                Tell us about your next project, idea, or technical challenge. We&apos;re ready to engineer the solution.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Info */}
              <motion.div variants={fadeUp} className="glass-strong rounded-3xl p-8 md:p-12 border border-[#3B82F6]/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-outfit mb-5">Reach Out</h3>
                  <p className="text-[#94A3B8] mb-10 text-base leading-relaxed">
                    Whether it&apos;s a technical query, project request, or you just want to talk code — our inbox is open.
                  </p>
                  <div className="space-y-7">
                    {[
                      {
                        color: "text-[#3B82F6]",
                        href: `mailto:${CONTACT_INFO.email}`,
                        icon: <Mail size={22} />,
                        label: "Email",
                        rel: undefined,
                        target: undefined,
                        val: CONTACT_INFO.email,
                      },
                      {
                        color: "text-[#94A3B8]",
                        href: CONTACT_INFO.phone.href,
                        icon: <Phone size={22} />,
                        label: "Phone",
                        rel: undefined,
                        target: undefined,
                        val: CONTACT_INFO.phone.display,
                      },
                      {
                        color: "text-[#3B82F6]",
                        href: CONTACT_INFO.location.href,
                        icon: <MapPin size={22} />,
                        label: "HQ",
                        rel: "noopener noreferrer",
                        target: "_blank",
                        val: CONTACT_INFO.location.label,
                      },
                      {
                        color: "text-[#25D366]",
                        href: `https://wa.me/${CONTACT_INFO.phone.display.replace(/\D/g, "")}`,
                        icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[22px] h-[22px]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" /></svg>,
                        label: "WhatsApp",
                        rel: "noopener noreferrer",
                        target: "_blank",
                        val: "Chat with us",
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div className={`p-3 bg-[#111827] rounded-xl border border-white/5 ${item.color}`}>
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-[#F8FAFC] font-semibold mb-0.5">{item.label}</h4>
                          <a
                            className="text-[#94A3B8] text-sm transition-colors hover:text-[#F8FAFC]"
                            href={item.href}
                            rel={item.rel}
                            target={item.target}
                          >
                            {item.val}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Form */}
              <motion.div variants={fadeUp} className="glass rounded-3xl p-8 md:p-12 border border-[#3B82F6]/10">
                <ContactForm />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#3B82F6]/5 z-0" />
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
            className="container mx-auto px-6 max-w-5xl relative z-10">
            <div className="glass-strong rounded-3xl p-10 md:p-16 border border-[#3B82F6]/20 text-center glow-accent-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#1F2937]/20 rounded-full blur-[80px]" />
              <h2 className="text-4xl md:text-5xl font-bold font-outfit mb-6 text-[#F8FAFC] relative z-10">
                Ready to transform your <br className="hidden md:block" /> digital presence?
              </h2>
              <p className="text-[#94A3B8] text-lg mb-10 max-w-2xl mx-auto relative z-10">
                Partner with <TypingText text="AxisX Studio" className="font-bold gradient-text" /> to build technology that moves the needle.
              </p>
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex px-8 py-4 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#1F2937] text-[#0B0F14] font-bold hover:scale-105 transition-transform items-center justify-center gap-2 relative z-10 shadow-[0_0_30px_rgba(163,166,255,0.4)]"
              >
                Contact Our Team <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </section>

      </main>

      <AnimatePresence>
        {activeBusiness && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-[#0B0F14]/60"
            onClick={() => setActiveBusiness(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-lg glass-strong rounded-[32px] p-8 border ${activeBusiness.border} shadow-2xl overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/5 rounded-full blur-[60px] pointer-events-none opacity-20`} />
              <button
                onClick={() => setActiveBusiness(null)}
                className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-[#F8FAFC] bg-[#111827]/50 hover:bg-[#111827] rounded-full transition-colors border border-white/5"
              >
                <X size={20} />
              </button>

              <div className={`w-14 h-14 rounded-2xl bg-[#111827] flex items-center justify-center ${activeBusiness.color} mb-6 border ${activeBusiness.border} shadow-inner`}>
                {activeBusiness.icon}
              </div>

              <h3 className="text-2xl font-bold font-outfit text-[#F8FAFC] mb-3">{activeBusiness.label}</h3>
              <p className="text-[#94A3B8] leading-relaxed mb-8">
                {activeBusiness.desc}
              </p>

              <button
                onClick={() => {
                  setActiveBusiness(null);
                  setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 300);
                }}
                className={`w-full py-3.5 rounded-xl bg-[#111827] text-[#F8FAFC] font-semibold hover:bg-[#1F2937] transition-colors border border-white/5 flex items-center justify-center gap-2`}
              >
                Discuss Your Project <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
