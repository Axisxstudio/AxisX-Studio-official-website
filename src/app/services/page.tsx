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
    desc: "Eliminate technical debt before it starts. We architect end-to-end web applications designed for scale, utilizing robust serverless backends to handle traffic spikes effortlessly."
  },
  {
    icon: <Palette className="text-[#c180ff]" size={40} />,
    title: "UI/UX Engineering",
    desc: "Stop losing users to confusion. We engineer intuitive, high-conversion interfaces rooted in buyer psychology, mapping complex user journeys to reduce bounce rates and increase sales."
  },
  {
    icon: <Server className="text-[#a3a6ff]" size={40} />,
    title: "API & Backend Systems",
    desc: "Robust, secure APIs and microservices architecture designed to integrate seamlessly and scale effortlessly with your business growth and data demands."
  },
  {
    icon: <Zap className="text-[#c180ff]" size={40} />,
    title: "Performance Optimization",
    desc: "Make speed your competitive advantage. We forensically audit your codebase, implementing advanced caching to deliver sub-second loading speeds that actively boost SEO."
  },
  {
    icon: <LayoutDashboard className="text-[#a3a6ff]" size={40} />,
    title: "Admin Tools & Dashboards",
    desc: "Reclaim wasted operational hours. We build bespoke internal tools tailored precisely to your workflow, automating repetitive tasks and turning raw data into actionable insights."
  },
  {
    icon: <Search className="text-[#c180ff]" size={40} />,
    title: "Technical SEO Validation",
    desc: "Semantic markup, dynamic sitemaps, server-side rendering, and structured JSON-LD data implementations to guarantee maximum visibility across search engine algorithms."
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
