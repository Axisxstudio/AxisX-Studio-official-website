"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, User, Tag, ChevronRight, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Project } from "@/types";

export default function ProjectContent({ project }: { project: Project }) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#0B0F14]">
        {/* Cinematic Hero */}
        <section className="relative h-[70vh] flex items-end pb-20">
          <div className="absolute inset-0 z-0">
            {project.coverImageUrl && (
              <Image 
                src={project.coverImageUrl} 
                alt={project.title} 
                fill 
                className="object-cover" 
                priority 
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/70 to-transparent"></div>
          </div>

          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <Link href="/projects" className="inline-flex items-center gap-2 text-[#94A3B8] hover:text-[#3B82F6] transition-colors mb-8 text-sm font-bold tracking-widest uppercase">
                <ArrowLeft size={16} /> Back to Portfolio
              </Link>
              <h1 className="text-5xl md:text-8xl font-black font-outfit text-[#F8FAFC] mb-8 tracking-tighter leading-[0.9]">
                {project.title}
              </h1>
              <div className="flex flex-wrap gap-8 items-center text-sm font-bold tracking-widest uppercase text-white/60">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-[#3B82F6]" /> {project.clientName}
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-[#3B82F6]" /> {project.category}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-8 space-y-16">
                <div>
                  <h2 className="text-2xl font-bold font-outfit mb-6 text-[#3B82F6] tracking-widest uppercase text-xs">Overview</h2>
                  <div className="text-xl text-[#94A3B8] leading-[1.6] font-light whitespace-pre-wrap">{project.description}</div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold font-outfit mb-6 text-[#3B82F6] tracking-widest uppercase text-xs">Stack</h2>
                  <div className="flex flex-wrap gap-3">
                    {project.technologies?.map((tech, i) => (
                      <div key={i} className="px-5 py-2.5 rounded-full bg-[#111827] border border-white/5 text-sm font-bold">{tech}</div>
                    ))}
                  </div>
                </div>

                {project.galleryImageUrls && project.galleryImageUrls.length > 0 && (
                  <div className="grid grid-cols-1 gap-10">
                    {project.galleryImageUrls.map((url, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true }} 
                        className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                      >
                        <Image src={url} alt={`${project.title} ${i}`} fill className="object-cover" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-4">
                <div className="sticky top-32 glass-strong p-10 rounded-[32px] border border-[#3B82F6]/20">
                  <h3 className="text-xl font-bold font-outfit mb-8">Project Details</h3>
                  <div className="space-y-6 text-sm">
                    <div>
                      <p className="text-[#3B82F6] font-black uppercase tracking-widest text-[10px] mb-1">Client</p>
                      <p className="text-white font-bold">{project.clientName}</p>
                    </div>
                    <div>
                      <p className="text-[#3B82F6] font-black uppercase tracking-widest text-[10px] mb-1">Vertical</p>
                      <p className="text-white font-bold">{project.category}</p>
                    </div>
                    <div>
                      <p className="text-[#3B82F6] font-black uppercase tracking-widest text-[10px] mb-1">Date</p>
                      <p className="text-white font-bold">
                        {project.createdAt ? new Date(project.createdAt as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Link href="/#contact" className="btn-ltr-blue w-full py-4 rounded-xl mt-12 flex items-center justify-center gap-2 font-bold group">
                    Start a Project <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 border-t border-white/5 text-center">
          <Link href="/projects" className="group inline-flex flex-col items-center">
            <p className="text-[#3B82F6] font-black uppercase tracking-widest text-[10px] mb-4">Interested in more?</p>
            <h3 className="text-4xl md:text-6xl font-black font-outfit group-hover:text-[#3B82F6] transition-colors flex items-center gap-4">
              See Full Portfolio <ArrowRight size={40} className="group-hover:translate-x-4 transition-transform" />
            </h3>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
