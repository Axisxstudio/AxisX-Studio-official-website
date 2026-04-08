"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Play, Globe } from "lucide-react";
import { Project } from "@/types";

export default function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const allMedia = [
    ...(project.coverImageUrl ? [{ type: "image" as const, url: project.coverImageUrl }] : []),
    ...(project.galleryImageUrls ?? []).map((url) => ({ type: "image" as const, url })),
    ...(project.videoUrls ?? []).map((url) => ({ type: "video" as const, url })),
  ];
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isVisiting, setIsVisiting] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeIdx !== null) setActiveIdx(null);
        else onClose();
      }
      if (e.key === "ArrowRight" && activeIdx !== null) setActiveIdx((i) => Math.min((i ?? 0) + 1, allMedia.length - 1));
      if (e.key === "ArrowLeft" && activeIdx !== null) setActiveIdx((i) => Math.max((i ?? 0) - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIdx, allMedia.length, onClose]);

  const handleVisit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!project.slug) return;
    setIsVisiting(true);
    setTimeout(() => {
      window.open(project.slug, "_blank", "noopener,noreferrer");
      setIsVisiting(false);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-xl bg-[#0B0F14]/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 24 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-strong rounded-[32px] border border-[#3B82F6]/20 shadow-2xl"
      >
        {/* Header Image */}
        {project.coverImageUrl && (
          <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-t-[32px] bg-[#111827]">
            <Image src={project.coverImageUrl} alt={project.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/40 to-transparent" />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2.5 bg-[#111827]/80 hover:bg-[#1F2937] text-[#94A3B8] hover:text-[#F8FAFC] rounded-full border border-white/10 backdrop-blur-md transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Live Site pill */}
        {project.slug && project.slug.startsWith("http") && (
          <button
            onClick={handleVisit}
            disabled={isVisiting}
            className="absolute top-5 right-16 flex items-center gap-2 px-4 py-2 bg-[#3B82F6]/20 hover:bg-[#3B82F6]/40 border border-[#3B82F6]/40 text-[#3B82F6] text-xs font-bold rounded-full backdrop-blur-md transition-all z-10 disabled:opacity-50"
          >
            {isVisiting ? (
              <div className="h-3 w-3 border-2 border-[#3B82F6]/30 border-t-[#3B82F6] rounded-full animate-spin" />
            ) : <Globe size={13} />} 
            {isVisiting ? "Opening..." : "Live Site"}
          </button>
        )}

        {/* Body */}
        <div className="p-8 md:p-12">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#3B82F6] mb-2 block">{project.category}</span>
              <h2 className="text-3xl md:text-4xl font-black font-outfit text-[#F8FAFC]">{project.title}</h2>
              {project.clientName && <p className="text-[#94A3B8] text-sm mt-1">Client: <span className="text-[#F8FAFC] font-semibold">{project.clientName}</span></p>}
            </div>
          </div>

          <p className="text-[#94A3B8] leading-relaxed mb-8 whitespace-pre-wrap">{project.description}</p>

          {/* Tech stack */}
          {project.technologies?.length > 0 && (
            <div className="mb-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3B82F6] mb-3">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech, i) => (
                  <span key={i} className="text-xs px-4 py-1.5 rounded-full bg-[#111827] border border-[#3B82F6]/15 text-[#F8FAFC] font-medium">{tech}</span>
                ))}
              </div>
            </div>
          )}

          {/* Instagram-style gallery */}
          {allMedia.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#3B82F6] mb-4">Media Gallery</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allMedia.map((media, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setActiveIdx(i)}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-[#111827] cursor-pointer border border-white/5 hover:border-[#3B82F6]/30 transition-all"
                  >
                    {media.type === "image" ? (
                      <Image src={media.url} alt={`media-${i}`} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0B0F14]">
                        <Play size={32} className="text-[#3B82F6]" />
                        <video src={media.url} className="absolute inset-0 w-full h-full object-cover opacity-50" muted />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="flex justify-end mt-10">
            {project.slug && project.slug.startsWith("http") && (
              <button
                onClick={handleVisit}
                disabled={isVisiting}
                style={{ 
                   backgroundPosition: isVisiting ? '0 0' : '',
                   transitionDuration: isVisiting ? '1000ms' : ''
                }}
                className={`btn-ltr-white relative inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-[#0e0e10] text-sm font-bold border border-[#3B82F6]/25 transition-all w-full sm:w-auto text-center justify-center disabled:opacity-70 ${isVisiting ? 'text-[#0B0F14]' : ''}`}
              >
                {isVisiting ? (
                  <div className="h-4 w-4 border-2 border-[#0e0e10]/30 border-t-[#0e0e10] rounded-full animate-spin" />
                ) : <Globe size={16} />}
                {isVisiting ? "Opening Live Site..." : "Visit Live Site"}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Lightbox for gallery media */}
      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0B0F14]/95 backdrop-blur-2xl"
            onClick={() => setActiveIdx(null)}
          >
            <button onClick={(e) => { e.stopPropagation(); setActiveIdx(null); }} className="absolute top-5 right-5 p-2 text-[#94A3B8] hover:text-white bg-[#111827] rounded-full border border-white/10">
              <X size={22} />
            </button>
            {activeIdx > 0 && (
              <button onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => Math.max((i ?? 1) - 1, 0)); }} className="absolute left-4 p-3 bg-[#111827]/80 hover:bg-[#1F2937] border border-white/10 rounded-full text-[#F8FAFC] transition-all">
                <ChevronLeft size={24} />
              </button>
            )}
            {activeIdx < allMedia.length - 1 && (
              <button onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => Math.min((i ?? 0) + 1, allMedia.length - 1)); }} className="absolute right-4 p-3 bg-[#111827]/80 hover:bg-[#1F2937] border border-white/10 rounded-full text-[#F8FAFC] transition-all">
                <ChevronRight size={24} />
              </button>
            )}
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl max-h-[85vh] flex items-center justify-center px-16"
            >
              {allMedia[activeIdx].type === "image" ? (
                <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                  <Image src={allMedia[activeIdx].url} alt="gallery" fill className="object-contain rounded-2xl" />
                </div>
              ) : (
                <video src={allMedia[activeIdx].url} controls autoPlay className="w-full rounded-2xl max-h-[80vh]" />
              )}
            </motion.div>
            <div className="absolute bottom-6 flex gap-2">
              {allMedia.map((_, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }} className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? "bg-[#3B82F6] w-6" : "bg-white/30"}`} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
