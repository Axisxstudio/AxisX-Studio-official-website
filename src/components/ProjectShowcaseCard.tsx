"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Briefcase, Code, ImageIcon, Video } from "lucide-react";
import { Project } from "@/types";

type ProjectShowcaseCardProps = {
  project: Project;
  href?: string;
  ctaLabel?: string;
  compact?: boolean;
  priorityImage?: boolean;
};

export default function ProjectShowcaseCard({
  project,
  href,
  ctaLabel = "View Project",
  compact = false,
  priorityImage = false,
}: ProjectShowcaseCardProps) {
  const galleryCount = project.galleryImageUrls?.length ?? 0;
  const videoCount = project.videoUrls?.length ?? 0;
  const techCount = project.technologies?.length ?? 0;
  const visibleTech = project.technologies?.slice(0, compact ? 3 : 5) ?? [];
  const remainingTech = Math.max(techCount - visibleTech.length, 0);

  const cardContent = (
    <article className="group relative h-full overflow-hidden rounded-[30px] border border-[#a3a6ff]/12 bg-[linear-gradient(180deg,rgba(31,31,34,0.96)_0%,rgba(22,22,26,0.98)_100%)] shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-all duration-500 hover:-translate-y-2 hover:border-[#a3a6ff]/28 hover:shadow-[0_30px_80px_rgba(163,166,255,0.12)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a3a6ff]/60 to-transparent opacity-70" />
      <div className="pointer-events-none absolute -right-20 top-10 h-40 w-40 rounded-full bg-[#a3a6ff]/8 blur-[90px]" />
      <div className="pointer-events-none absolute -left-16 bottom-12 h-36 w-36 rounded-full bg-[#c180ff]/8 blur-[90px]" />

      <div className={`relative overflow-hidden bg-[#141418] ${compact ? "h-60" : "h-72 md:h-80"}`}>
        {project.coverImageUrl ? (
          <Image
            src={project.coverImageUrl}
            alt={project.title}
            fill
            priority={priorityImage}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,rgba(163,166,255,0.2),transparent_55%),linear-gradient(180deg,#18181b_0%,#111114_100%)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#a3a6ff]/15 bg-[#0e0e10]/80 text-[#a3a6ff]">
              <Briefcase size={28} />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,14,16,0.05)_0%,rgba(14,14,16,0.16)_45%,rgba(14,14,16,0.95)_100%)]" />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#a3a6ff]/18 bg-[#0e0e10]/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f9f5f8] backdrop-blur-sm">
            {project.category}
          </span>
          {project.clientName && (
            <span className="rounded-full border border-white/8 bg-[#0e0e10]/55 px-3 py-1 text-xs text-[#d8d2df] backdrop-blur-sm">
              {project.clientName}
            </span>
          )}
        </div>

        <div className="absolute right-4 top-4 flex items-center gap-2">
          {galleryCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#a3a6ff]/16 bg-[#0e0e10]/68 px-3 py-1 text-xs text-[#f9f5f8] backdrop-blur-sm">
              <ImageIcon size={12} className="text-[#a3a6ff]" />
              {galleryCount}
            </span>
          )}
          {videoCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c180ff]/16 bg-[#0e0e10]/68 px-3 py-1 text-xs text-[#f9f5f8] backdrop-blur-sm">
              <Video size={12} className="text-[#c180ff]" />
              {videoCount}
            </span>
          )}
        </div>
      </div>

      <div className={`relative flex h-full flex-col ${compact ? "p-6" : "p-7 md:p-8"}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#adaaad]">
              Featured Project
            </p>
            <h3 className={`font-bold font-outfit text-[#f9f5f8] transition-colors group-hover:text-[#a3a6ff] ${compact ? "text-2xl" : "text-2xl md:text-[2rem]"}`}>
              {project.title}
            </h3>
          </div>

          <div className="hidden shrink-0 rounded-2xl border border-[#a3a6ff]/10 bg-[#0e0e10]/60 px-3 py-2 text-right sm:block">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#adaaad]">Stack</p>
            <p className="mt-1 text-sm font-semibold text-[#f9f5f8]">{techCount} tools</p>
          </div>
        </div>

        <p className={`text-[#b8b3bd] leading-relaxed ${compact ? "mb-5 line-clamp-3 text-sm" : "mb-6 line-clamp-4 text-sm md:text-base"}`}>
          {project.description}
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {visibleTech.map((tech, index) => (
            <span
              key={`${project.id ?? project.slug}-${tech}-${index}`}
              className="rounded-full border border-[#a3a6ff]/10 bg-[#101014]/82 px-3 py-1.5 text-xs font-medium text-[#f9f5f8]"
            >
              {tech}
            </span>
          ))}
          {remainingTech > 0 && (
            <span className="rounded-full border border-[#a3a6ff]/10 bg-[#101014]/82 px-3 py-1.5 text-xs font-medium text-[#adaaad]">
              +{remainingTech}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-[#a3a6ff]/10 pt-5">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#adaaad]">
            <span className="inline-flex items-center gap-1.5">
              <Code size={12} className="text-[#a3a6ff]" />
              {techCount} technologies
            </span>
            {(galleryCount > 0 || videoCount > 0) && (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase size={12} className="text-[#c180ff]" />
                {galleryCount + videoCount} media assets
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#a3a6ff] transition-all group-hover:gap-3">
            {ctaLabel}
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
