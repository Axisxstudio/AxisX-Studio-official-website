import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Server, LayoutDashboard, Search, FileCode2, Zap, Palette } from "lucide-react";

export const metadata = {
  title: "Services | AxisX",
  description: "Web development and digital engineering services by AxisX.",
};

const services = [
  {
    icon: <FileCode2 className="text-[#a3a6ff]" size={40} />,
    title: "Full-Stack Development",
    desc: "End-to-end web applications built with Next.js, React, Node, and scalable databases. We handle the frontend UI and the complex backend business logic."
  },
  {
    icon: <Palette className="text-[#c180ff]" size={40} />,
    title: "UI/UX Engineering",
    desc: "Beautiful, intuitive interfaces that convert users. We design from scratch or implement your existing Figma designs with pixel-perfect accuracy."
  },
  {
    icon: <Server className="text-[#a3a6ff]" size={40} />,
    title: "API & Backend Systems",
    desc: "Robust REST and GraphQL APIs, headless CMS integrations, and scalable serverless architectures centered on Supabase and modern cloud tooling."
  },
  {
    icon: <Zap className="text-[#c180ff]" size={40} />,
    title: "Performance Optimization",
    desc: "Core Web Vitals auditing, code splitting, image optimization, and caching strategies to ensure your site is lightning fast."
  },
  {
    icon: <LayoutDashboard className="text-[#a3a6ff]" size={40} />,
    title: "Admin Tools & Dashboards",
    desc: "Custom internal tools to manage your data, inventory, or users. Say goodbye to spreadsheets and generic CRMs."
  },
  {
    icon: <Search className="text-[#c180ff]" size={40} />,
    title: "Technical SEO Validation",
    desc: "Server-side rendering, valid semantic HTML, dynamic sitemaps, and structured data implementation for maximum visibility."
  }
];

export default function Services() {
  return (
    <>
      <Navigation />
      
      <main className="flex-grow pt-28">
        <section className="relative py-20 overflow-hidden text-center">
             <div className="absolute inset-0 bg-[#0e0e10]/80 z-10"></div>
             <div className="grid-bg absolute inset-0 z-20 opacity-50"></div>
             
             <div className="container mx-auto px-6 max-w-4xl relative z-30">
                 <h1 className="text-5xl md:text-6xl font-bold font-outfit mb-6 animate-fade-in-up">
                    Engineering <span className="gradient-text">Solutions</span>
                 </h1>
                 <p className="text-xl text-[#adaaad] max-w-2xl mx-auto animate-fade-in-up delay-100">
                    From minimum viable products to enterprise-grade platforms, we deliver technical excellence at every layer of the stack.
                 </p>
             </div>
        </section>

        <section className="py-16 pb-32">
          <div className="container mx-auto px-6 max-w-7xl">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {services.map((service, i) => (
                    <div key={i} className="glass-strong p-10 rounded-3xl border border-[#a3a6ff]/10 hover:border-[#a3a6ff]/40 transition-all hover:transform hover:-translate-y-2 group">
                        <div className="mb-8 p-4 bg-[#19191c] rounded-2xl inline-block border border-[#a3a6ff]/5 glow-accent-2">
                           {service.icon}
                        </div>
                        <h3 className="text-2xl font-bold mb-4">{service.title}</h3>
                        <p className="text-[#adaaad] leading-relaxed mb-6">{service.desc}</p>
                        <div className="w-8 h-1 bg-gradient-to-r from-[#a3a6ff] to-transparent rounded"></div>
                    </div>
                 ))}
             </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
