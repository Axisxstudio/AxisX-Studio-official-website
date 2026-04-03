"use client";

import { useState } from "react";
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
import FeedbackSection from "@/components/FeedbackSection";
import ProjectShowcaseCard from "@/components/ProjectShowcaseCard";
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
  { icon: <Utensils size={22} />, label: "Restaurants & Cafés", color: "text-[#ff9a6c]", bg: "bg-[#ff9a6c]/10", border: "border-[#ff9a6c]/20", desc: "Custom digital menus, reservation systems, and vibrant websites to attract more diners." },
  { icon: <GraduationCap size={22} />, label: "Tuition & Education", color: "text-[#a3a6ff]", bg: "bg-[#a3a6ff]/10", border: "border-[#a3a6ff]/20", desc: "LMS integrations, student portals, and engaging institutional websites for modern learning." },
  { icon: <ShoppingBag size={22} />, label: "Retail & Shops", color: "text-[#c180ff]", bg: "bg-[#c180ff]/10", border: "border-[#c180ff]/20", desc: "High-conversion e-commerce storefronts, inventory management, and seamless checkouts." },
  { icon: <Briefcase size={22} />, label: "Corporate & Portfolios", color: "text-[#6cffb0]", bg: "bg-[#6cffb0]/10", border: "border-[#6cffb0]/20", desc: "Professional corporate sites and stunning portfolios that showcase your brand authority." },
  { icon: <HeartPulse size={22} />, label: "Clinics & Healthcare", color: "text-[#ff6e84]", bg: "bg-[#ff6e84]/10", border: "border-[#ff6e84]/20", desc: "Secure patient portals, appointment scheduling, and compliant medical websites." },
  { icon: <Scissors size={22} />, label: "Salons & Beauty", color: "text-[#ffd56c]", bg: "bg-[#ffd56c]/10", border: "border-[#ffd56c]/20", desc: "Booking systems, service galleries, and elegant designs that reflect your brand's aesthetic." },
  { icon: <Hotel size={22} />, label: "Hotels & Hospitality", color: "text-[#6cb2ff]", bg: "bg-[#6cb2ff]/10", border: "border-[#6cb2ff]/20", desc: "Direct booking engines, property showcases, and immersive digital hospitality experiences." },
  { icon: <Layout size={22} />, label: "Agencies & Startups", color: "text-[#c180ff]", bg: "bg-[#c180ff]/10", border: "border-[#c180ff]/20", desc: "Cutting-edge web apps, SaaS landing pages, and scalable platforms to fuel hyper-growth." },
];

/* ─── Services Data ─── */
const services = [
  { icon: <FileCode2 className="text-[#a3a6ff]" size={36} />, title: "Full-Stack Development", desc: "End-to-end web applications with powerful frontends, robust backends, and scalable databases — all crafted bespoke for your business." },
  { icon: <Palette className="text-[#c180ff]" size={36} />, title: "UI/UX Engineering", desc: "Pixel-perfect, conversion-focused interfaces designed from scratch or built faithfully to your design files." },
  { icon: <Server className="text-[#a3a6ff]" size={36} />, title: "API & Backend Systems", desc: "Robust, secure APIs and serverless infrastructure designed to scale effortlessly with your business growth." },
  { icon: <Zap className="text-[#c180ff]" size={36} />, title: "Performance Optimization", desc: "Core Web Vitals auditing, smart caching, and architecture improvements to make your site blazing fast." },
  { icon: <LayoutDashboard className="text-[#a3a6ff]" size={36} />, title: "Admin Tools & Dashboards", desc: "Custom internal tools built precisely for your workflow — replace spreadsheets with powerful, intuitive dashboards." },
  { icon: <Search className="text-[#c180ff]" size={36} />, title: "Technical SEO", desc: "Semantic markup, dynamic sitemaps, server-side rendering, and structured data for maximum search visibility." },
];

/* ─── About Values ─── */
const values = [
  { icon: <Code size={24} />, title: "Engineering Excellence", text: "We write clean, semantic, and highly optimized code tailored for scale." },
  { icon: <Zap size={24} />, title: "Performance First", text: "Speed is a feature. We architect our stack to guarantee zero friction." },
  { icon: <Users size={24} />, title: "Radical Transparency", text: "No black boxes. We act as an extension of your internal team." },
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

  const inputCls = "w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 transition-colors placeholder:text-[#4a4a5a] text-sm";

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
              <label htmlFor="name" className="block text-xs font-medium text-[#adaaad] mb-1.5">Name *</label>
              <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className={inputCls} placeholder="John Doe" />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#adaaad] mb-1.5">Email *</label>
              <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className={inputCls} placeholder="john@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-[#adaaad] mb-1.5">Phone (Optional)</label>
              <input type="text" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputCls} placeholder="+1 (234) 567-890" />
            </div>
            <div>
              <label htmlFor="subject" className="block text-xs font-medium text-[#adaaad] mb-1.5">Subject *</label>
              <input type="text" id="subject" name="subject" required value={formData.subject} onChange={handleChange} className={inputCls} placeholder="Project inquiry" />
            </div>
          </div>
          <div>
            <label htmlFor="message" className="block text-xs font-medium text-[#adaaad] mb-1.5">Message *</label>
            <textarea id="message" name="message" required rows={5} value={formData.message} onChange={handleChange} className={`${inputCls} resize-none`} placeholder="Tell us about your project..." />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#a3a6ff] to-[#c180ff] text-[#0e0e10] font-bold hover:shadow-[0_0_30px_rgba(163,166,255,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? "Sending…" : "Send Message"}
            {!loading && <Send size={18} />}
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
          <h3 className="text-2xl font-bold font-outfit mb-3 text-[#f9f5f8]">Message Sent!</h3>
          <p className="text-[#adaaad] mb-8 max-w-sm">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
          <button onClick={() => setSubmitted(false)} className="px-6 py-2.5 rounded-xl bg-[#19191c] border border-[#a3a6ff]/20 hover:border-[#a3a6ff]/50 text-sm font-semibold transition-all">
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
    <section id="projects" className="py-24 border-t border-[#a3a6ff]/10 relative">
      <div className="absolute right-0 top-1/3 w-[400px] h-[400px] bg-[#c180ff]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="container mx-auto px-6 max-w-7xl">
        <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">Our <span className="gradient-text-alt">Portfolio</span></h2>
          <p className="text-[#adaaad] max-w-2xl mx-auto">A selection of web applications and digital experiences we&apos;ve engineered.</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(n => <div key={n} className="glass rounded-3xl h-[360px] animate-pulse bg-[#19191c]/50" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 glass-strong rounded-3xl border border-[#a3a6ff]/10">
            <div className="w-20 h-20 bg-[#19191c] rounded-full mx-auto mb-6 flex items-center justify-center border border-[#a3a6ff]/20">
              <ExternalLink className="text-[#a3a6ff]" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-3">New Projects Coming Soon</h3>
            <p className="text-[#adaaad] max-w-md mx-auto">We are curating our portfolio and adding our latest case studies. Check back shortly.</p>
          </div>
        ) : (
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                variants={fadeUp}
                className="h-full"
              >
                <ProjectShowcaseCard
                  project={project}
                  href="/projects"
                  ctaLabel="Explore Portfolio"
                  compact
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
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
      <main className="flex-grow pt-28 overflow-x-hidden">

        {/* ── HERO ── */}
        <section id="home" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[#0e0e10]/80 z-10" />
            <div className="grid-bg absolute inset-0 z-20" />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}
              className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#a3a6ff]/20 rounded-full blur-[120px] mix-blend-screen z-0" />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.5 }}
              className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#c180ff]/20 rounded-full blur-[100px] mix-blend-screen z-0" />
          </div>

          <motion.div initial="hidden" animate="visible" variants={stagger}
            className="container mx-auto px-6 relative z-30 max-w-5xl text-center">
            <motion.div variants={fadeUp} className="inline-flex items-center px-4 py-1.5 rounded-full border border-[#a3a6ff]/30 bg-[#a3a6ff]/5 text-[#a3a6ff] text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a3a6ff] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a3a6ff]" />
              </span>
              Premium Web Development Services
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 font-outfit">
              Engineering <span className="gradient-text text-glow">Digital Excellence</span>{" "}
              <br className="hidden md:block" />for Modern Brands
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-[#adaaad] max-w-3xl mx-auto mb-10 leading-relaxed">
              AxisX is a boutique digital agency specialising in high-performance web applications, stunning user interfaces, and scalable architectures. We do not just write code; we build businesses.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 rounded-full bg-[#f9f5f8] text-[#0e0e10] font-semibold hover:bg-[#a3a6ff] transition-all w-full sm:w-auto flex items-center justify-center gap-2 group"
              >
                Start a Project <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 rounded-full glass font-semibold hover:bg-white/5 transition-all w-full sm:w-auto border border-[#a3a6ff]/20 text-[#f9f5f8]"
              >
                View Our Work
              </button>
            </motion.div>
          </motion.div>
        </section>

        {/* ── SERVICES ── */}
        <section id="services" className="py-24 border-t border-[#a3a6ff]/10 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#a3a6ff]/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="container mx-auto px-6 max-w-7xl">
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">Engineering <span className="gradient-text">Solutions</span></h2>
              <p className="text-[#adaaad] max-w-2xl mx-auto">From MVPs to enterprise-grade platforms, we deliver technical excellence at every layer of the stack.</p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="glass-strong p-8 rounded-2xl border border-[#a3a6ff]/10 hover:border-[#a3a6ff]/30 transition-all hover:-translate-y-2 group">
                  <div className="w-14 h-14 rounded-xl bg-[#262528] border border-[#a3a6ff]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform glow-accent">
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-bold text-[#f9f5f8] mb-3">{s.title}</h3>
                  <p className="text-[#adaaad] text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* ── Business Types Sub-section ── */}
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="mt-20">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#a3a6ff]/20 bg-[#a3a6ff]/5 text-[#a3a6ff] text-xs font-semibold uppercase tracking-widest mb-4">
                  <CheckCircle size={13} /> We Build For
                </span>
                <h3 className="text-2xl md:text-3xl font-bold font-outfit text-[#f9f5f8]">
                  Websites &amp; Portfolios for <span className="gradient-text-alt">Every Business</span>
                </h3>
                <p className="text-[#adaaad] mt-3 text-sm max-w-xl mx-auto">
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
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${bt.border} ${bt.bg} glass hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:brightness-110 transition-all group cursor-pointer`}
                  >
                    <div className={`w-9 h-9 shrink-0 rounded-xl bg-[#19191c] flex items-center justify-center ${bt.color} group-hover:scale-110 transition-transform border border-white/5`}>
                      {bt.icon}
                    </div>
                    <span className="text-sm font-medium text-[#f9f5f8] leading-tight">{bt.label}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Bottom note */}
              <motion.p
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={vp} transition={{ delay: 0.4 }}
                className="text-center text-[#adaaad] text-sm mt-8"
              >
                Don&apos;t see your industry?{" "}
                <button
                  onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                  className="text-[#a3a6ff] hover:underline font-medium"
                >
                  Let&apos;s talk — we build for everyone.
                </button>
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="py-24 border-t border-[#a3a6ff]/10 relative overflow-hidden">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={vp} transition={{ duration: 1.5 }}
            className="absolute top-0 right-1/3 w-[300px] h-[300px] bg-[#a3a6ff]/8 rounded-full blur-[100px] pointer-events-none" />
          <div className="container mx-auto px-6 max-w-7xl">

            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">About <span className="gradient-text">AxisX</span></h2>
              <p className="text-[#adaaad] max-w-2xl mx-auto">
                A collective of digital craftsmen focused on engineering modern, high-performance web applications that drive real business growth.
              </p>
            </motion.div>

            {/* Mission */}
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="glass-strong rounded-3xl p-8 md:p-14 border border-[#a3a6ff]/20 mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold font-outfit mb-5">Our Mission</h3>
                  <p className="text-[#adaaad] leading-relaxed mb-4">
                    At AxisX, we believe the web should be fast, beautiful, and accessible. In a sea of templates and bloated codebases, we stand for bespoke engineering and meticulous attention to detail.
                  </p>
                  <p className="text-[#adaaad] leading-relaxed">
                    Our goal is to partner with forward-thinking brands and translate their vision into robust digital products—from complex SaaS architectures to dazzling marketing sites.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { val: "5+", label: "Years Exp", color: "text-[#a3a6ff]" },
                    { val: "100%", label: "In-House", color: "text-[#c180ff]" },
                    { val: "30+", label: "Projects", color: "text-[#f9f5f8]" },
                    { val: "24h", label: "Response", color: "text-[#a3a6ff]" },
                  ].map((stat, i) => (
                    <div key={i} className="glass p-5 rounded-2xl border border-[#a3a6ff]/10 text-center hover:-translate-y-1 transition-transform">
                      <span className={`block text-3xl font-bold ${stat.color} mb-1`}>{stat.val}</span>
                      <span className="text-xs text-[#adaaad] uppercase tracking-wider">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Values */}
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((v, i) => (
                <motion.div key={i} variants={fadeUp} className="glass p-8 rounded-2xl border border-transparent hover:border-[#a3a6ff]/20 transition-all text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#19191c] border border-[#a3a6ff]/10 flex items-center justify-center mb-6 text-[#a3a6ff] glow-accent">
                    {v.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                  <p className="text-[#adaaad] text-sm">{v.text}</p>
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
        <section id="contact" className="py-24 border-t border-[#a3a6ff]/10 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={vp} transition={{ duration: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c180ff]/8 rounded-full blur-[100px] pointer-events-none"
          />
          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">Let&apos;s <span className="gradient-text-alt">Connect</span></h2>
              <p className="text-[#adaaad] max-w-2xl mx-auto">
                Tell us about your next project, idea, or technical challenge. We&apos;re ready to engineer the solution.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={stagger} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Info */}
              <motion.div variants={fadeUp} className="glass-strong rounded-3xl p-8 md:p-12 border border-[#a3a6ff]/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-bold font-outfit mb-5">Reach Out</h3>
                  <p className="text-[#adaaad] mb-10 text-base leading-relaxed">
                    Whether it&apos;s a technical query, project request, or you just want to talk code — our inbox is open.
                  </p>
	                  <div className="space-y-7">
	                    {[
	                      {
	                        color: "text-[#a3a6ff]",
	                        href: `mailto:${CONTACT_INFO.email}`,
	                        icon: <Mail size={22} />,
	                        label: "Email",
	                        rel: undefined,
	                        target: undefined,
	                        val: CONTACT_INFO.email,
	                      },
	                      {
	                        color: "text-[#c180ff]",
	                        href: CONTACT_INFO.phone.href,
	                        icon: <Phone size={22} />,
	                        label: "Phone",
	                        rel: undefined,
	                        target: undefined,
	                        val: CONTACT_INFO.phone.display,
	                      },
	                      {
	                        color: "text-[#a3a6ff]",
	                        href: CONTACT_INFO.location.href,
	                        icon: <MapPin size={22} />,
	                        label: "HQ",
	                        rel: "noopener noreferrer",
	                        target: "_blank",
	                        val: CONTACT_INFO.location.label,
	                      },
	                    ].map((item, idx) => (
	                      <div key={idx} className="flex items-start gap-4">
	                        <div className={`p-3 bg-[#19191c] rounded-xl border border-white/5 ${item.color}`}>
	                          {item.icon}
	                        </div>
	                        <div>
	                          <h4 className="text-[#f9f5f8] font-semibold mb-0.5">{item.label}</h4>
	                          <a
	                            className="text-[#adaaad] text-sm transition-colors hover:text-[#f9f5f8]"
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
              <motion.div variants={fadeUp} className="glass rounded-3xl p-8 md:p-12 border border-[#a3a6ff]/10">
                <ContactForm />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#a3a6ff]/5 z-0" />
          <motion.div initial="hidden" whileInView="visible" viewport={vp} variants={fadeUp}
            className="container mx-auto px-6 max-w-5xl relative z-10">
            <div className="glass-strong rounded-3xl p-10 md:p-16 border border-[#a3a6ff]/20 text-center glow-accent-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c180ff]/20 rounded-full blur-[80px]" />
              <h2 className="text-4xl md:text-5xl font-bold font-outfit mb-6 text-[#f9f5f8] relative z-10">
                Ready to transform your <br className="hidden md:block" /> digital presence?
              </h2>
              <p className="text-[#adaaad] text-lg mb-10 max-w-2xl mx-auto relative z-10">
                Partner with AxisX to build technology that moves the needle.
              </p>
              <button
                onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex px-8 py-4 rounded-full bg-gradient-to-r from-[#a3a6ff] to-[#c180ff] text-[#0e0e10] font-bold hover:scale-105 transition-transform items-center justify-center gap-2 relative z-10 shadow-[0_0_30px_rgba(163,166,255,0.4)]"
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-[#0e0e10]/60"
            onClick={() => setActiveBusiness(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-lg glass-strong rounded-3xl p-8 border ${activeBusiness.border} shadow-2xl overflow-hidden`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${activeBusiness.bg} rounded-full blur-[60px] pointer-events-none`} />
              <button
                onClick={() => setActiveBusiness(null)}
                className="absolute top-4 right-4 p-2 text-[#adaaad] hover:text-[#f9f5f8] bg-[#19191c]/50 hover:bg-[#19191c] rounded-full transition-colors border border-white/5"
              >
                <X size={20} />
              </button>
              
              <div className={`w-14 h-14 rounded-2xl bg-[#19191c] flex items-center justify-center ${activeBusiness.color} mb-6 border ${activeBusiness.border} shadow-inner`}>
                {activeBusiness.icon}
              </div>
              
              <h3 className="text-2xl font-bold font-outfit text-[#f9f5f8] mb-3">{activeBusiness.label}</h3>
              <p className="text-[#adaaad] leading-relaxed mb-8">
                {activeBusiness.desc}
              </p>
              
              <button
                onClick={() => {
                  setActiveBusiness(null);
                  setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 300);
                }}
                className={`w-full py-3.5 rounded-xl bg-[#19191c] text-[#f9f5f8] font-semibold hover:bg-[#262528] transition-colors border ${activeBusiness.border} flex items-center justify-center gap-2`}
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
