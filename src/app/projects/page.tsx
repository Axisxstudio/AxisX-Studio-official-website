"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { selectClause, toDatabaseField } from "@/lib/supabase-api";
import { Project } from "@/types";
import ProjectShowcaseCard from "@/components/ProjectShowcaseCard";

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select(selectClause("projects"))
          .eq(toDatabaseField("projects", "isPublished"), true)
          .order(toDatabaseField("projects", "createdAt"), { ascending: false });
        if (error) throw error;
        setProjects((data ?? []) as unknown as Project[]);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <>
      <Navigation />
      
      <main className="flex-grow pt-28">
        <section className="py-20 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e10] via-[#19191c]/50 to-[#0e0e10] z-0"></div>
             <div className="container mx-auto px-6 max-w-4xl relative z-10">
                 <h1 className="text-5xl md:text-6xl font-bold font-outfit mb-6 animate-fade-in-up">
                    Our <span className="gradient-text">Portfolio</span>
                 </h1>
                 <p className="text-xl text-[#adaaad] max-w-2xl mx-auto animate-fade-in-up delay-100">
                    A selection of web applications and digital experiences we&apos;ve engineered.
                 </p>
             </div>
        </section>

        <section className="py-16 pb-32">
          <div className="container mx-auto px-6 max-w-7xl">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[1, 2, 3, 4].map((n) => (
                   <div key={n} className="glass rounded-3xl h-[400px] animate-pulse bg-[#19191c]/50"></div>
                 ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20 glass-strong rounded-3xl border border-[#a3a6ff]/10">
                 <div className="w-20 h-20 bg-[#19191c] rounded-full mx-auto mb-6 flex items-center justify-center border border-[#a3a6ff]/20">
                    <ExternalLink className="text-[#a3a6ff]" size={32} />
                 </div>
                 <h3 className="text-2xl font-bold mb-4">New Projects Coming Soon</h3>
                 <p className="text-[#adaaad] max-w-md mx-auto">We are currently curating our portfolio and adding our latest case studies. Check back shortly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 {projects.map((project, idx) => (
                    <div key={project.id} className="h-full animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                      <ProjectShowcaseCard
                        project={project}
                        ctaLabel="Portfolio Highlight"
                        priorityImage={idx < 2}
                      />
                    </div>
                 ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
