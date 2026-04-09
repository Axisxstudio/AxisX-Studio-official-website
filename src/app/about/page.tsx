"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Users, Zap, Code } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { TypingText } from "@/components/TypingText";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function About() {
  return (
    <>
      <Navigation />
      
      <main className="flex-grow pt-28 overflow-x-hidden">
        {/* Header */}
        <section className="relative py-20 overflow-hidden text-center">
             <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}
                className="absolute top-0 right-1/3 w-[300px] h-[300px] bg-[#a3a6ff]/10 rounded-full blur-[100px] mix-blend-screen z-0"
             />
            <motion.div 
               initial="hidden" animate="visible" variants={fadeUp}
               className="container mx-auto px-6 max-w-4xl relative z-10"
            >
                <h1 className="text-5xl md:text-6xl font-bold font-outfit mb-6">
                   About <TypingText text="AxisX Studio" className="gradient-text" />
                </h1>
                <p className="text-xl text-[#adaaad] max-w-2xl mx-auto">
                   We are a collective of digital craftsmen focused on engineering modern, high-performance web applications that drive real business growth.
                </p>
            </motion.div>
        </section>

        {/* Mission */}
        <section className="py-16">
          <div className="container mx-auto px-6 max-w-5xl">
             <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                className="glass-strong rounded-3xl p-10 md:p-16 border border-[#a3a6ff]/20"
             >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <div>
                      <h2 className="text-3xl font-bold font-outfit mb-6">Our Mission</h2>
                      <p className="text-[#adaaad] leading-relaxed mb-6">
                         At <TypingText text="AxisX Studio" className="font-bold" />, we believe that the web should be fast, beautiful, and accessible. In a sea of templates and bloated codebases, we stand for bespoke engineering and meticulous attention to detail.
                      </p>
                      <p className="text-[#adaaad] leading-relaxed">
                         Our goal is to partner with forward-thinking brands and translate their vision into robust digital products. From complex SaaS architectures to dazzling marketing sites, we build technology that empowers.
                      </p>
                   </div>
                   <div className="pl-0 md:pl-10 grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                         <div className="glass p-6 rounded-2xl border border-[#a3a6ff]/10 text-center hover:-translate-y-1 transition-transform">
                            <span className="block text-4xl font-bold text-[#a3a6ff] mb-2">5+</span>
                            <span className="text-xs text-[#adaaad] uppercase tracking-wider">Years Exp</span>
                         </div>
                         <div className="glass p-6 rounded-2xl border border-[#a3a6ff]/10 text-center hover:-translate-y-1 transition-transform">
                            <span className="block text-4xl font-bold text-[#c180ff] mb-2">100%</span>
                            <span className="text-xs text-[#adaaad] uppercase tracking-wider">In-House</span>
                         </div>
                      </div>
                      <div className="space-y-4 mt-8">
                         <div className="glass p-6 rounded-2xl border border-[#a3a6ff]/10 text-center hover:-translate-y-1 transition-transform">
                            <span className="block text-4xl font-bold text-[#f9f5f8] mb-2">30+</span>
                            <span className="text-xs text-[#adaaad] uppercase tracking-wider">Projects</span>
                         </div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 border-t border-[#a3a6ff]/10">
          <div className="container mx-auto px-6 max-w-6xl">
             <motion.div 
                 initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                 className="text-center mb-16"
             >
                 <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-4">Core Values</h2>
                 <p className="text-[#adaaad]">The principles that guide our code and our culture.</p>
             </motion.div>
             
             <motion.div 
                 initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
                 variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
                 className="grid grid-cols-1 md:grid-cols-3 gap-8"
             >
                 {[
                   { icon: <Code />, title: "Engineering Excellence", text: "We write clean, semantic, and highly optimized code tailored for scale." },
                   { icon: <Zap />, title: "Performance First", text: "Speed is a feature. We architect our stack to guarantee zero friction." },
                   { icon: <Users />, title: "Radical Transparency", text: "No black boxes. We act as an extension of your internal team." }
                 ].map((val, i) => (
                    <motion.div key={i} variants={fadeUp} className="glass p-8 rounded-2xl border border-transparent hover:border-[#a3a6ff]/20 transition-all text-center">
                        <div className="w-14 h-14 mx-auto rounded-full bg-[#19191c] border border-[#a3a6ff]/10 flex items-center justify-center mb-6 text-[#a3a6ff] glow-accent">
                           {val.icon}
                        </div>
                        <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                        <p className="text-[#adaaad] text-sm">{val.text}</p>
                    </motion.div>
                 ))}
             </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
