"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { selectClause, toDatabaseField } from "@/lib/supabase-api";
import { Feedback } from "@/types";
import { formatTimestamp } from "@/lib/date";
import { X, Play, Maximize2, Star, ImageIcon, Video, MessageSquarePlus, ChevronRight } from "lucide-react";
import Link from "next/link";

/* ─── Star Rating ─── */
function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={13}
          fill={i < count ? "#a3a6ff" : "transparent"}
          stroke={i < count ? "#a3a6ff" : "#4a4a5a"}
        />
      ))}
    </div>
  );
}

/* ─── Full Details Modal ─── */
function FeedbackModal({ fb, onClose }: { fb: Feedback; onClose: () => void }) {
  const [lightbox, setLightbox] = useState<{ url: string; type: "image" | "video" } | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [onClose]);

  const hasMedia = (fb.imageUrls?.length > 0) || (fb.videoUrls?.length > 0);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(14,14,16,0.92)", backdropFilter: "blur(16px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Lightbox sub-layer */}
      {lightbox && (
        <div
          className="absolute inset-0 z-[210] flex items-center justify-center bg-[#0e0e10]/95"
          onClick={() => setLightbox(null)}
        >
          <button onClick={() => setLightbox(null)} className="absolute top-6 right-6 p-2 rounded-full bg-[#262528] text-[#f9f5f8] hover:bg-[#ff6e84] transition-colors z-30">
            <X size={20} />
          </button>
          <div className="max-w-5xl max-h-[90vh] w-full flex items-center justify-center p-4">
            {lightbox.type === "image"
              ? (
                <Image
                  src={lightbox.url}
                  alt="Feedback media"
                  width={1600}
                  height={900}
                  unoptimized
                  className="max-w-full max-h-[85vh] h-auto w-auto object-contain rounded-2xl border border-[#a3a6ff]/20 shadow-2xl"
                />
              )
              : <video src={lightbox.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl border border-[#c180ff]/20 shadow-2xl" />
            }
          </div>
        </div>
      )}

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#a3a6ff]/20 shadow-[0_0_80px_rgba(163,166,255,0.12)] scrollbar-hide"
        style={{ background: "rgba(25,25,28,0.98)" }}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2 rounded-full bg-[#262528] text-[#adaaad] hover:bg-[#ff6e84] hover:text-white transition-all"
        >
          <X size={18} />
        </button>

        {/* Header gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#a3a6ff] via-[#c180ff] to-[#a3a6ff] rounded-t-3xl" />

        <div className="p-8">
          {/* Avatar + Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#a3a6ff]/20 to-[#c180ff]/20 border border-[#a3a6ff]/30 flex items-center justify-center text-2xl font-bold text-[#a3a6ff] font-outfit">
              {fb.clientName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-[#f9f5f8] font-outfit truncate">{fb.clientName}</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#adaaad] mt-1">
                {fb.companyName && <span className="text-[#a3a6ff] font-medium">{fb.companyName}</span>}
                {fb.companyName && <span>·</span>}
                <span>Project: <span className="text-[#f9f5f8]">{fb.projectName}</span></span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Stars />
                <span className="text-xs text-[#adaaad]">{formatTimestamp(fb.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <blockquote className="relative text-[#f9f5f8]/90 text-lg leading-relaxed italic border-l-2 border-[#a3a6ff]/40 pl-5 mb-6">
            <span className="absolute -top-4 -left-2 text-5xl text-[#a3a6ff]/20 font-serif leading-none">&ldquo;</span>
            {fb.message}
            <span className="text-5xl text-[#a3a6ff]/20 font-serif leading-none align-bottom ml-1">&rdquo;</span>
          </blockquote>

          {/* Media Gallery */}
          {hasMedia && (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-widest text-[#adaaad] font-semibold mb-3 flex items-center gap-2">
                <ImageIcon size={12} /> Attached Media
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fb.imageUrls?.map((url, i) => (
                  <div
                    key={`img-${i}`}
                    onClick={() => setLightbox({ url, type: "image" })}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-[#a3a6ff]/15 group"
                  >
                    <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-[#0e0e10]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 size={20} className="text-white drop-shadow" />
                    </div>
                  </div>
                ))}
                {fb.videoUrls?.map((url, i) => (
                  <div
                    key={`vid-${i}`}
                    onClick={() => setLightbox({ url, type: "video" })}
                    className="relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-[#c180ff]/15 group"
                  >
                    <video src={url} className="w-full h-full object-cover" muted />
                    <div className="absolute inset-0 bg-[#0e0e10]/50 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#c180ff] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play size={16} className="text-[#0e0e10] ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 bg-[#c180ff]/80 px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1">
                      <Video size={8} /> VIDEO
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Single Feedback Card in marquee ─── */
function FeedbackCard({ fb, onClick }: { fb: Feedback; onClick: () => void }) {
  const mainImage = fb.imageUrls?.[0];
  return (
    <div
      onClick={onClick}
      className="feedback-card shrink-0 w-[320px] sm:w-[360px] glass-strong rounded-2xl border border-[#a3a6ff]/10 hover:border-[#a3a6ff]/35 transition-all cursor-pointer group overflow-hidden"
      style={{ margin: "0 12px" }}
    >
      {/* Top image strip */}
      {mainImage ? (
        <div className="relative h-36 w-full overflow-hidden">
          <Image src={mainImage} alt={fb.clientName} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#19191c] via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
            <span className="text-xs bg-[#0e0e10]/70 backdrop-blur-sm px-2 py-1 rounded-full text-[#adaaad] border border-[#a3a6ff]/10">{fb.projectName}</span>
            {(fb.videoUrls?.length > 0) && (
              <span className="text-xs bg-[#c180ff]/20 backdrop-blur-sm px-2 py-1 rounded-full text-[#c180ff] border border-[#c180ff]/20 flex items-center gap-1">
                <Video size={9} /> Video
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="h-10 w-full bg-gradient-to-r from-[#a3a6ff]/10 to-[#c180ff]/10" />
      )}

      <div className="p-5">
        {/* Stars */}
        <div className="flex items-center justify-between mb-3">
          <Stars />
          <span className="text-[10px] text-[#adaaad]">{formatTimestamp(fb.createdAt)}</span>
        </div>

        {/* Message preview */}
        <p className="text-[#adaaad] text-sm leading-relaxed line-clamp-3 mb-4 italic">
          &ldquo;{fb.message}&rdquo;
        </p>

        {/* Client info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a3a6ff]/20 to-[#c180ff]/20 border border-[#a3a6ff]/20 flex items-center justify-center text-sm font-bold text-[#a3a6ff]">
              {fb.clientName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[#f9f5f8] text-sm font-semibold leading-tight">{fb.clientName}</p>
              {fb.companyName && <p className="text-[10px] text-[#adaaad]">{fb.companyName}</p>}
            </div>
          </div>
          <ChevronRight size={16} className="text-[#a3a6ff] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Exported Feedback Section ─── */
export default function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("feedback")
          .select(selectClause("feedback"))
          .order(toDatabaseField("feedback", "createdAt"), { ascending: false });
        if (error) throw error;
        setFeedbacks((data ?? []) as unknown as Feedback[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Duplicate for infinite loop
  const doubledFeedbacks = feedbacks.length > 0 ? [...feedbacks, ...feedbacks] : [];

  return (
    <section id="feedback" className="py-24 border-t border-[#a3a6ff]/10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#a3a6ff]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl mb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold font-outfit mb-3">
              Client <span className="gradient-text">Voices</span>
            </h2>
            <p className="text-[#adaaad] max-w-xl">What our clients say after partnering with AxisX. Click any card to read the full review.</p>
          </div>
          <Link
            href="/feedback/new"
            className="relative z-20 shrink-0 inline-flex cursor-pointer items-center gap-2 px-5 py-3 rounded-full glass border border-[#a3a6ff]/25 text-sm font-semibold hover:border-[#a3a6ff]/50 hover:bg-[#19191c] transition-all group"
          >
            <MessageSquarePlus size={16} className="group-hover:text-[#a3a6ff] transition-colors" />
            Submit Your Review
          </Link>
        </div>
      </div>

      {/* Marquee */}
      {loading ? (
        <div className="flex gap-6 px-6 overflow-hidden">
          {[1, 2, 3].map(n => (
            <div key={n} className="shrink-0 w-[320px] h-52 glass rounded-2xl animate-pulse bg-[#19191c]/50" />
          ))}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#adaaad] text-lg">No public testimonials yet. Be the first to leave one!</p>
        </div>
      ) : (
        <div
          className="relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #0e0e10, transparent)" }} />
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, #0e0e10, transparent)" }} />

          <div
            ref={trackRef}
            className="flex py-4"
            style={{
              animation: `marquee-scroll 40s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
              width: "max-content",
            }}
          >
            {doubledFeedbacks.map((fb, idx) => (
              <FeedbackCard key={`${fb.id}-${idx}`} fb={fb} onClick={() => setSelected(fb)} />
            ))}
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {selected && <FeedbackModal fb={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
