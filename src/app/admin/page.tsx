"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Code, MessageSquare, TrendingUp, ChevronRight, Activity, Cloud, Database, ShieldCheck, Box } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    feedback: 0,
    contacts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ count: pCount }, { count: mCount }, { count: cCount }] = await Promise.all([
          supabase.from("projects").select("*", { count: "exact", head: true }),
          supabase.from("feedback").select("*", { count: "exact", head: true }),
          supabase.from("contacts").select("*", { count: "exact", head: true }).eq("status", "unread"),
        ]);
        setStats({
          projects: pCount || 0,
          feedback: mCount || 0,
          contacts: cCount || 0
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Live Projects", value: stats.projects, icon: <Box size={20} />, link: "/admin/projects", color: "#3B82F6", detail: "Active infrastructure" },
    { title: "Client Insights", value: stats.feedback, icon: <MessageSquare size={20} />, link: "/admin/feedback", color: "#60A5FA", detail: "Validated responses" },
    { title: "Inbound Leads", value: stats.contacts, icon: <Users size={20} />, link: "/admin/contacts", color: "#93C5FD", detail: "Unread communications" },
    { title: "Uptime Rate", value: "99.9%", icon: <Activity size={20} />, link: "#", color: "#3B82F6", detail: "System availability" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      <header className="pb-6 border-b border-[#3B82F6]/10">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
               <Activity size={20} />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-[#F8FAFC]">Operational Overview</h1>
         </div>
         <p className="text-[#94A3B8]">Critical monitoring and command center for AxisX digital assets.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat, i) => (
            <Link key={i} href={stat.link} className="glass-strong rounded-[24px] p-4 md:p-6 border border-[#3B82F6]/10 hover:border-[#3B82F6]/30 transition-all group relative overflow-hidden h-full flex flex-col justify-between">
               <div className="relative z-10 w-full">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                     <div className="w-9 h-9 md:w-10 md:h-10 bg-[#0B0F14] rounded-xl border border-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] group-hover:scale-110 transition-transform">
                        {stat.icon}
                     </div>
                     <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#4A5568] truncate ml-2">{stat.detail}</span>
                  </div>
                  <h3 className="text-[#94A3B8] text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</h3>
                  <div className="flex items-end justify-between">
                     <p className="text-2xl md:text-4xl font-bold font-outfit text-[#F8FAFC] tracking-tight">
                        {loading ? "..." : stat.value}
                     </p>
                     <div className="text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <ChevronRight size={18} />
                     </div>
                  </div>
               </div>
               <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#3B82F6]/5 rounded-full blur-2xl group-hover:bg-[#3B82F6]/10 transition-colors" />
            </Link>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
         {/* Quick Actions */}
         <div className="lg:col-span-3 glass-strong rounded-[32px] p-8 border border-[#3B82F6]/10">
            <h2 className="text-xl font-bold font-outfit mb-8 flex items-center gap-2">
               <Code size={20} className="text-[#3B82F6]" /> Mission Control
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Link href="/admin/projects" className="flex flex-col p-5 rounded-2xl bg-[#0B0F14]/40 border border-[#3B82F6]/5 hover:border-[#3B82F6]/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] mb-4"><Code size={18} /></div>
                  <h4 className="font-bold text-[#F8FAFC] text-sm mb-1 uppercase tracking-wide">Publish Project</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">Stage and deploy new technical case studies to production.</p>
               </Link>

               <Link href="/admin/feedback" className="flex flex-col p-5 rounded-2xl bg-[#0B0F14]/40 border border-[#3B82F6]/5 hover:border-[#3B82F6]/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] mb-4"><MessageSquare size={18} /></div>
                  <h4 className="font-bold text-[#F8FAFC] text-sm mb-1 uppercase tracking-wide">Moderate Insights</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">Analyze and respond to verified client feedback submissions.</p>
               </Link>
            </div>
         </div>

         {/* System Heartbeat */}
         <div className="lg:col-span-2 glass-strong rounded-[32px] p-8 border border-[#3B82F6]/10">
            <h2 className="text-xl font-bold font-outfit mb-8 flex items-center gap-2">
               <ShieldCheck size={20} className="text-[#3B82F6]" /> System Heartbeat
            </h2>
            <div className="space-y-5">
               <div className="flex justify-between items-center bg-[#0B0F14]/40 p-4 rounded-xl border border-[#3B82F6]/5">
                  <div className="flex items-center gap-3">
                     <Database size={16} className="text-[#3B82F6]" />
                     <span className="text-sm font-medium text-[#F8FAFC]">SQL Cluster</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#10B981]">
                     <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
                     Operational
                  </div>
               </div>
               <div className="flex justify-between items-center bg-[#0B0F14]/40 p-4 rounded-xl border border-[#3B82F6]/5">
                  <div className="flex items-center gap-3">
                     <Cloud size={16} className="text-[#3B82F6]" />
                     <span className="text-sm font-medium text-[#F8FAFC]">Storage Gateway</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#10B981]">
                     <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
                     Syncing
                  </div>
               </div>
               <div className="flex justify-between items-center bg-[#0B0F14]/40 p-4 rounded-xl border border-[#3B82F6]/5">
                  <div className="flex items-center gap-3">
                     <ShieldCheck size={16} className="text-[#3B82F6]" />
                     <span className="text-sm font-medium text-[#F8FAFC]">Auth Handshake</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#3B82F6]">
                     <span className="w-2 h-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]"></span>
                     Secured
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

