"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Code, MessageSquare, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

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
    { title: "Total Projects", value: stats.projects, icon: <Code size={24} className="text-[#a3a6ff]" />, link: "/admin/projects", bg: "from-[#a3a6ff]/20 to-transparent" },
    { title: "Client Feedback", value: stats.feedback, icon: <MessageSquare size={24} className="text-[#c180ff]" />, link: "/admin/feedback", bg: "from-[#c180ff]/20 to-transparent" },
    { title: "Contact Requests", value: stats.contacts, icon: <Users size={24} className="text-[#a3a6ff]" />, link: "/admin/contacts", bg: "from-[#a3a6ff]/20 to-transparent" },
    { title: "System Health", value: "99.9%", icon: <TrendingUp size={24} className="text-[#c180ff]" />, link: "#", bg: "from-[#c180ff]/20 to-transparent" },
  ];

  return (
    <div className="space-y-10 animate-fade-in-up">
      <header>
         <h1 className="text-3xl font-bold font-outfit text-[#f9f5f8] mb-2">Overview</h1>
         <p className="text-[#adaaad]">Welcome back to your AxisX management dashboard.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {statCards.map((stat, i) => (
            <Link key={i} href={stat.link} className="glass-strong rounded-2xl p-6 border border-[#a3a6ff]/10 hover:border-[#a3a6ff]/30 transition-all group overflow-hidden relative">
               <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.bg} rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100`}></div>
               
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-[#19191c] rounded-xl border border-[#a3a6ff]/20 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                     {stat.icon}
                  </div>
                  <h3 className="text-[#adaaad] text-sm font-medium mb-1">{stat.title}</h3>
                  <div className="flex items-end justify-between">
                     <p className="text-4xl font-bold font-outfit text-[#f9f5f8]">
                        {loading ? <span className="text-[#19191c] animate-pulse">0</span> : stat.value}
                     </p>
                     <div className="text-[#a3a6ff] opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                        <ChevronRight size={20} />
                     </div>
                  </div>
               </div>
            </Link>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Quick Actions */}
         <div className="glass rounded-2xl p-8 border border-[#a3a6ff]/10">
            <h2 className="text-xl font-bold font-outfit mb-6">Quick Actions</h2>
            <div className="space-y-4">
               <Link href="/admin/projects" className="w-full flex items-center justify-between p-4 rounded-xl bg-[#19191c] border border-[#a3a6ff]/5 hover:border-[#a3a6ff]/20 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-[#a3a6ff]/10 flex items-center justify-center text-[#a3a6ff]"><Code size={20} /></div>
                     <div>
                        <h4 className="font-semibold text-[#f9f5f8] text-sm">Add New Project</h4>
                        <p className="text-xs text-[#adaaad]">Publish a new case study</p>
                     </div>
                  </div>
                  <ChevronRight size={16} className="text-[#adaaad] group-hover:text-[#f9f5f8]" />
               </Link>

               <Link href="/admin/feedback" className="w-full flex items-center justify-between p-4 rounded-xl bg-[#19191c] border border-[#a3a6ff]/5 hover:border-[#a3a6ff]/20 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-[#c180ff]/10 flex items-center justify-center text-[#c180ff]"><MessageSquare size={20} /></div>
                     <div>
                        <h4 className="font-semibold text-[#f9f5f8] text-sm">Review Client Feedback</h4>
                        <p className="text-xs text-[#adaaad]">Moderate incoming submissions</p>
                     </div>
                  </div>
                  <ChevronRight size={16} className="text-[#adaaad] group-hover:text-[#f9f5f8]" />
               </Link>
            </div>
         </div>

         {/* System Info */}
         <div className="glass rounded-2xl p-8 border border-[#a3a6ff]/10">
            <h2 className="text-xl font-bold font-outfit mb-6">System Status</h2>
            <div className="space-y-6">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-[#adaaad]">Database</span>
                  <span className="flex items-center gap-2 text-[#f9f5f8]"><span className="w-2 h-2 rounded-full bg-green-400"></span> Online</span>
               </div>
               <div className="w-full h-px bg-[#a3a6ff]/10"></div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-[#adaaad]">Storage Gateway</span>
                  <span className="flex items-center gap-2 text-[#f9f5f8]"><span className="w-2 h-2 rounded-full bg-green-400"></span> Online</span>
               </div>
               <div className="w-full h-px bg-[#a3a6ff]/10"></div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-[#adaaad]">Auth Service</span>
                  <span className="flex items-center gap-2 text-[#f9f5f8]"><span className="w-2 h-2 rounded-full bg-green-400"></span> Protected</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
