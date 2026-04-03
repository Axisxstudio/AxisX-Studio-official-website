"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { selectClause, toDatabaseField } from "@/lib/supabase-api";
import { Feedback } from "@/types";
import { formatTimestamp } from "@/lib/date";
import { X, Play, Maximize2, Star, ImageIcon, Video, MessageSquarePlus, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import Link from "next/link";

const AUTO_SCROLL_DURATION_MS = 40000;
const MANUAL_PAUSE_MS = 6000;
const MEDIA_SWIPE_THRESHOLD = 50;

type LoopMetrics = {
  middleStart: number;
  loopWidth: number;
  step: number;
};

type FeedbackMediaItem = {
  url: string;
  type: "image" | "video";
};

function measureLoopMetrics(viewport: HTMLDivElement | null, feedbackCount: number): LoopMetrics | null {
  if (!viewport || feedbackCount === 0) return null;

  const cards = viewport.querySelectorAll<HTMLElement>("[data-feedback-card]");
  const middleCard = cards[feedbackCount];
  const thirdCard = cards[feedbackCount * 2];
  const nextCard = cards[feedbackCount + 1];

  if (!middleCard || !thirdCard) return null;

  return {
    middleStart: middleCard.offsetLeft,
    loopWidth: thirdCard.offsetLeft - middleCard.offsetLeft,
    step: nextCard ? nextCard.offsetLeft - middleCard.offsetLeft : middleCard.offsetWidth,
  };
}

function normalizeLoopScroll(viewport: HTMLDivElement | null, metrics: LoopMetrics) {
  if (!viewport || metrics.loopWidth <= 0) return;

  const min = metrics.middleStart - metrics.loopWidth / 2;
  const max = metrics.middleStart + metrics.loopWidth / 2;

  if (viewport.scrollLeft < min) {
    viewport.scrollLeft += metrics.loopWidth;
  } else if (viewport.scrollLeft > max) {
    viewport.scrollLeft -= metrics.loopWidth;
  }
}

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
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const gestureStateRef = useRef<{ startX: number | null; pointerId: number | null; isDragging: boolean }>({
    startX: null,
    pointerId: null,
    isDragging: false,
  });
  const suppressOpenRef = useRef(false);

  const mediaItems: FeedbackMediaItem[] = [
    ...(fb.imageUrls ?? []).map((url) => ({ url, type: "image" as const })),
    ...(fb.videoUrls ?? []).map((url) => ({ url, type: "video" as const })),
  ];

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (mediaItems.length <= 1) return;
      if (e.key === "ArrowLeft") {
        setActiveMediaIndex((current) => (current - 1 + mediaItems.length) % mediaItems.length);
      }
      if (e.key === "ArrowRight") {
        setActiveMediaIndex((current) => (current + 1) % mediaItems.length);
      }
    };
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("keydown", esc); };
  }, [mediaItems.length, onClose]);

  const hasMedia = mediaItems.length > 0;
  const activeMedia = mediaItems[activeMediaIndex] ?? mediaItems[0];

  const showMediaAt = (index: number) => {
    if (mediaItems.length === 0) return;
    const nextIndex = (index + mediaItems.length) % mediaItems.length;
    setActiveMediaIndex(nextIndex);
  };

  const moveMedia = (direction: -1 | 1) => {
    showMediaAt(activeMediaIndex + direction);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (mediaItems.length <= 1) return;

    gestureStateRef.current = {
      startX: event.clientX,
      pointerId: event.pointerId,
      isDragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gestureStateRef.current.pointerId !== event.pointerId || gestureStateRef.current.startX === null) return;

    if (Math.abs(event.clientX - gestureStateRef.current.startX) > 8) {
      gestureStateRef.current.isDragging = true;
    }
  };

  const completeSwipeGesture = (endX: number) => {
    const { startX, isDragging } = gestureStateRef.current;
    if (startX === null || mediaItems.length <= 1) return;

    const deltaX = endX - startX;
    gestureStateRef.current = { startX: null, pointerId: null, isDragging: false };

    if (Math.abs(deltaX) < MEDIA_SWIPE_THRESHOLD) {
      if (isDragging) suppressOpenRef.current = true;
      return;
    }
    suppressOpenRef.current = true;
    moveMedia(deltaX < 0 ? 1 : -1);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gestureStateRef.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    completeSwipeGesture(event.clientX);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    if (gestureStateRef.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    gestureStateRef.current = { startX: null, pointerId: null, isDragging: false };
  };

  const handleMediaOpen = () => {
    if (!activeMedia) return;
    if (suppressOpenRef.current) {
      suppressOpenRef.current = false;
      return;
    }

    setLightbox(activeMedia);
  };

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

              <div className="rounded-[28px] border border-[#a3a6ff]/15 bg-[#141418] p-4 sm:p-5">
                <div className="relative px-2 sm:px-3">
                  <div
                    className="relative overflow-hidden rounded-[22px] border border-[#a3a6ff]/10 bg-[#0e0e10] cursor-grab active:cursor-grabbing select-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    style={{ touchAction: mediaItems.length > 1 ? "pan-y" : "auto" }}
                  >
                    <div className="relative aspect-square w-full overflow-hidden sm:aspect-[4/3]">
                      {activeMedia.type === "image" ? (
                        <button
                          type="button"
                          onClick={handleMediaOpen}
                          className="absolute inset-0 block"
                          aria-label="Open image in full view"
                        >
                          <Image
                            src={activeMedia.url}
                            alt={`${fb.clientName} media ${activeMediaIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleMediaOpen}
                          className="absolute inset-0 block"
                          aria-label="Open video in full view"
                        >
                          <video
                            src={activeMedia.url}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        </button>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0e0e10]/65 via-transparent to-transparent" />

                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] ${
                          activeMedia.type === "video" ? "text-[#c180ff]" : "text-[#a3a6ff]"
                        }`}
                      >
                        {activeMedia.type === "video" ? <Video size={16} /> : <ImageIcon size={16} />}
                      </div>
                    </div>

                      <div className="absolute right-3 top-3 rounded-full bg-[#0e0e10]/70 px-3 py-1 text-[11px] font-medium text-[#f9f5f8] backdrop-blur-sm">
                        {activeMediaIndex + 1} / {mediaItems.length}
                      </div>

                      <button
                        type="button"
                        onClick={handleMediaOpen}
                        className="absolute bottom-3 right-3 z-10 rounded-full bg-[#0e0e10]/75 p-2 text-[#f9f5f8] backdrop-blur-sm transition-all hover:bg-[#19191c]"
                        aria-label="Open media in full view"
                      >
                        {activeMedia.type === "video" ? <Play size={16} className="ml-0.5" /> : <Maximize2 size={16} />}
                      </button>
                    </div>

                    {mediaItems.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0e0e10]/68 px-3 py-2 backdrop-blur-sm">
                        {mediaItems.map((item, index) => (
                          <button
                            key={`${item.type}-${item.url}-${index}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              showMediaAt(index);
                            }}
                            className={`h-2.5 rounded-full transition-all ${index === activeMediaIndex ? "w-6 bg-[#a3a6ff]" : "w-2.5 bg-white/40"}`}
                            aria-label={`Show media ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {mediaItems.length > 1 && (
                    <>
                      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center">
                        <button
                          type="button"
                          onClick={() => moveMedia(-1)}
                          className="pointer-events-auto flex h-9 w-9 -translate-x-1/2 items-center justify-center text-[#f9f5f8] drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] transition-all hover:text-[#a3a6ff] sm:h-10 sm:w-10"
                          aria-label="Previous media"
                        >
                          <ChevronLeft size={18} />
                        </button>
                      </div>

                      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center">
                        <button
                          type="button"
                          onClick={() => moveMedia(1)}
                          className="pointer-events-auto flex h-9 w-9 translate-x-1/2 items-center justify-center text-[#f9f5f8] drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] transition-all hover:text-[#a3a6ff] sm:h-10 sm:w-10"
                          aria-label="Next media"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {mediaItems.length > 1 && (
                  <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {mediaItems.map((item, index) => (
                      <button
                        key={`${item.type}-${item.url}-thumb-${index}`}
                        type="button"
                        onClick={() => showMediaAt(index)}
                        className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border transition-all ${index === activeMediaIndex ? "border-[#a3a6ff]/60 ring-2 ring-[#a3a6ff]/25" : item.type === "video" ? "border-[#c180ff]/20" : "border-[#a3a6ff]/15"}`}
                        aria-label={`Preview media ${index + 1}`}
                      >
                        {item.type === "image" ? (
                          <Image
                            src={item.url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <>
                            <video src={item.url} className="h-full w-full object-cover" muted />
                            <div className="absolute inset-0 flex items-center justify-center bg-[#0e0e10]/45">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c180ff] text-[#0e0e10]">
                                <Play size={14} className="ml-0.5" />
                              </div>
                            </div>
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── View All Feedback Modal ─── */
function FeedbackLibraryModal({
  feedbacks,
  onClose,
  onSelect,
}: {
  feedbacks: Feedback[];
  onClose: () => void;
  onSelect: (fb: Feedback) => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(14,14,16,0.94)", backdropFilter: "blur(18px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-[#a3a6ff]/15 shadow-[0_0_100px_rgba(163,166,255,0.14)]"
        style={{ background: "linear-gradient(180deg, rgba(31,31,34,0.98) 0%, rgba(25,25,28,0.98) 100%)" }}
      >
        <div className="sticky top-0 z-20 shrink-0 border-b border-[#a3a6ff]/10 bg-[#1f1f22]/95 backdrop-blur-xl">
          <div className="h-1 w-full bg-gradient-to-r from-[#a3a6ff] via-[#c180ff] to-[#a3a6ff]" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 rounded-full bg-[#262528] p-2 text-[#adaaad] transition-all hover:bg-[#ff6e84] hover:text-white"
            aria-label="Close feedback library"
          >
            <X size={18} />
          </button>

          <div className="px-6 pb-5 pt-8 pr-16 sm:px-8 sm:pb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#a3a6ff]">Testimonials</p>
            <h3 className="text-3xl font-bold font-outfit text-[#f9f5f8] sm:text-4xl">All Client Feedback</h3>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 scrollbar-hide sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-2xl text-sm text-[#adaaad] sm:text-base">
              Explore every published review in one place. Select any card to open the full testimonial with media.
            </p>

            <div className="inline-flex items-center gap-3 self-start rounded-full border border-[#a3a6ff]/15 bg-[#19191c]/80 px-4 py-2 text-sm text-[#f9f5f8]">
              <LayoutGrid size={16} className="text-[#a3a6ff]" />
              <span>{feedbacks.length} published reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {feedbacks.map((fb, idx) => {
              const previewImage = fb.imageUrls?.[0];
              const hasMedia = (fb.imageUrls?.length ?? 0) > 0 || (fb.videoUrls?.length ?? 0) > 0;

              return (
                <button
                  key={fb.id ?? `${fb.clientName}-${idx}`}
                  type="button"
                  onClick={() => onSelect(fb)}
                  className="group overflow-hidden rounded-3xl border border-[#a3a6ff]/10 bg-[#19191c]/82 text-left transition-all hover:-translate-y-1 hover:border-[#a3a6ff]/30 hover:shadow-[0_18px_50px_rgba(163,166,255,0.12)]"
                >
                  {previewImage ? (
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={previewImage}
                        alt={fb.clientName}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#19191c] via-[#19191c]/35 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                        <span className="rounded-full border border-[#a3a6ff]/15 bg-[#0e0e10]/70 px-3 py-1 text-xs text-[#f9f5f8] backdrop-blur-sm">
                          {fb.projectName}
                        </span>
                        {hasMedia && (
                          <div className="flex items-center gap-2 rounded-full border border-[#c180ff]/15 bg-[#0e0e10]/70 px-3 py-1 text-xs text-[#c180ff] backdrop-blur-sm">
                            {(fb.imageUrls?.length ?? 0) > 0 && <span className="flex items-center gap-1"><ImageIcon size={11} /> {fb.imageUrls.length}</span>}
                            {(fb.videoUrls?.length ?? 0) > 0 && <span className="flex items-center gap-1"><Video size={11} /> {fb.videoUrls.length}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 w-full bg-gradient-to-r from-[#a3a6ff]/10 via-[#c180ff]/10 to-[#a3a6ff]/10" />
                  )}

                  <div className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#a3a6ff]/20 bg-gradient-to-br from-[#a3a6ff]/18 to-[#c180ff]/18 text-sm font-bold text-[#a3a6ff]">
                          {fb.clientName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-[#f9f5f8]">{fb.clientName}</p>
                          <p className="truncate text-sm text-[#adaaad]">
                            {fb.companyName || fb.projectName}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-[#adaaad]">{formatTimestamp(fb.createdAt)}</span>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-4">
                      <Stars />
                      <span className="rounded-full border border-[#a3a6ff]/10 bg-[#0e0e10]/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[#adaaad]">
                        Review
                      </span>
                    </div>

                    <p className="line-clamp-5 text-sm leading-7 text-[#d7d2d8]">
                      &ldquo;{fb.message}&rdquo;
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#a3a6ff]/10 pt-4 text-sm">
                      <span className="text-[#a3a6ff]">Open full testimonial</span>
                      <ChevronRight size={16} className="text-[#a3a6ff] transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
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
      className="feedback-card shrink-0 w-[320px] sm:w-[360px] glass-strong rounded-2xl border border-[#a3a6ff]/10 hover:border-[#a3a6ff]/35 transition-all cursor-pointer group overflow-hidden select-none"
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
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pauseTimerRef = useRef<number | null>(null);
  const loopMetricsRef = useRef<LoopMetrics>({ middleStart: 0, loopWidth: 0, step: 0 });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from("feedback")
          .select(selectClause("feedback"))
          .eq(toDatabaseField("feedback", "consentToPublish"), true)
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

  const tripledFeedbacks = feedbacks.length > 0 ? [...feedbacks, ...feedbacks, ...feedbacks] : [];

  const clearManualPauseTimer = () => {
    if (pauseTimerRef.current !== null) {
      window.clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  };

  const pauseAutoplayTemporarily = (duration = MANUAL_PAUSE_MS) => {
    setIsManualPaused(true);
    clearManualPauseTimer();
    pauseTimerRef.current = window.setTimeout(() => {
      setIsManualPaused(false);
      pauseTimerRef.current = null;
    }, duration);
  };

  const scrollByReview = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    const { step } = loopMetricsRef.current;
    if (!viewport || step <= 0) return;

    pauseAutoplayTemporarily();
    normalizeLoopScroll(viewport, loopMetricsRef.current);
    viewport.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  useEffect(() => {
    if (feedbacks.length === 0) return;

    const syncLoopMetrics = (alignToMiddle = false) => {
      const metrics = measureLoopMetrics(viewportRef.current, feedbacks.length);
      if (!metrics) return;

      loopMetricsRef.current = metrics;

      if (alignToMiddle && viewportRef.current) {
        viewportRef.current.scrollLeft = metrics.middleStart;
      }
    };

    syncLoopMetrics(true);

    const handleResize = () => {
      syncLoopMetrics();
      normalizeLoopScroll(viewportRef.current, loopMetricsRef.current);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [feedbacks.length]);

  useEffect(() => {
    if (feedbacks.length <= 1) return;

    let frameId = 0;
    let lastTimestamp = 0;

    const animate = (timestamp: number) => {
      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
        frameId = window.requestAnimationFrame(animate);
        return;
      }

      const viewport = viewportRef.current;
      const { loopWidth } = loopMetricsRef.current;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (viewport && loopWidth > 0 && !isHoverPaused && !isManualPaused) {
        viewport.scrollLeft += delta * (loopWidth / AUTO_SCROLL_DURATION_MS);
        normalizeLoopScroll(viewport, loopMetricsRef.current);
      }

      frameId = window.requestAnimationFrame(animate);
    };

    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, [feedbacks.length, isHoverPaused, isManualPaused]);

  useEffect(() => () => clearManualPauseTimer(), []);

  useEffect(() => {
    if (!isLibraryOpen && !selected) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLibraryOpen, selected]);

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
            <p className="text-[#adaaad] max-w-xl">What our clients say after partnering with AxisX. Swipe or drag to browse, or click any card to read the full review.</p>
          </div>
          <div className="relative z-20 flex flex-wrap items-center gap-3">
            {feedbacks.length > 0 && (
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#a3a6ff]/25 bg-[#19191c]/80 px-5 py-3 text-sm font-semibold text-[#f9f5f8] transition-all hover:border-[#a3a6ff]/50 hover:bg-[#222228]"
              >
                <LayoutGrid size={16} className="text-[#a3a6ff]" />
                View All Feedback
              </button>
            )}

            <Link
              href="/feedback/new"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full glass border border-[#a3a6ff]/25 px-5 py-3 text-sm font-semibold transition-all hover:border-[#a3a6ff]/50 hover:bg-[#19191c] group"
            >
              <MessageSquarePlus size={16} className="group-hover:text-[#a3a6ff] transition-colors" />
              Submit Your Review
            </Link>
          </div>
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
          onMouseEnter={() => setIsHoverPaused(true)}
          onMouseLeave={() => setIsHoverPaused(false)}
        >
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-24 sm:w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to right, #0e0e10, transparent)" }} />
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-24 sm:w-32 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to left, #0e0e10, transparent)" }} />

          <div className="absolute inset-y-0 left-4 z-20 hidden sm:flex items-center">
            <button
              type="button"
              onClick={() => scrollByReview(-1)}
              className="h-11 w-11 rounded-full border border-[#a3a6ff]/20 bg-[#19191c]/85 text-[#f9f5f8] backdrop-blur-sm transition-all hover:border-[#a3a6ff]/45 hover:text-[#a3a6ff]"
              aria-label="Previous review"
            >
              <ChevronLeft size={18} className="mx-auto" />
            </button>
          </div>

          <div className="absolute inset-y-0 right-4 z-20 hidden sm:flex items-center">
            <button
              type="button"
              onClick={() => scrollByReview(1)}
              className="h-11 w-11 rounded-full border border-[#a3a6ff]/20 bg-[#19191c]/85 text-[#f9f5f8] backdrop-blur-sm transition-all hover:border-[#a3a6ff]/45 hover:text-[#a3a6ff]"
              aria-label="Next review"
            >
              <ChevronRight size={18} className="mx-auto" />
            </button>
          </div>

          <div
            ref={viewportRef}
            className="overflow-x-auto scrollbar-hide touch-pan-x cursor-grab active:cursor-grabbing"
            onPointerDown={() => pauseAutoplayTemporarily()}
            onScroll={() => normalizeLoopScroll(viewportRef.current, loopMetricsRef.current)}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="flex w-max gap-6 px-6 py-4">
              {tripledFeedbacks.map((fb, idx) => (
                <div
                  key={`${fb.id}-${idx}`}
                  data-feedback-card
                  className="shrink-0"
                  aria-hidden={idx < feedbacks.length || idx >= feedbacks.length * 2}
                >
                  <FeedbackCard fb={fb} onClick={() => setSelected(fb)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popup Modal */}
      {isLibraryOpen && (
        <FeedbackLibraryModal
          feedbacks={feedbacks}
          onClose={() => setIsLibraryOpen(false)}
          onSelect={(fb) => {
            setIsLibraryOpen(false);
            setSelected(fb);
          }}
        />
      )}
      {selected && <FeedbackModal key={selected.id ?? selected.clientName} fb={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
