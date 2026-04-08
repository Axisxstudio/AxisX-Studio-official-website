"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, signOut } from "@/lib/supabase-api";
import { LayoutDashboard, MessageSquare, Briefcase, Mail, LogOut, Settings, Menu, X, ExternalLink, ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
   const { user, loading, isAdmin } = useAuth();
   const router = useRouter();
   const pathname = usePathname();
   const [sidebarOpen, setSidebarOpen] = useState(false);

   useEffect(() => {
      if (!loading && (!user || !isAdmin)) {
         router.push("/login");
      }
   }, [user, loading, isAdmin, router]);

   if (loading) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-[#0B0F14]">
            <div className="w-12 h-12 border-2 border-[#3B82F6]/10 border-t-[#3B82F6] rounded-full animate-spin"></div>
         </div>
      );
   }

   if (!user || !isAdmin) return null;

   const handleLogout = async () => {
      try {
         await signOut(auth);
         toast.success("Logged out successfully");
         router.replace("/login");
      } catch {
         toast.error("Error logging out.");
      }
   };

   const navItems = [
      { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      { href: "/admin/projects", label: "Projects", icon: <Briefcase size={20} /> },
      { href: "/admin/feedback", label: "Feedback", icon: <MessageSquare size={20} /> },
      { href: "/admin/contacts", label: "Inbox", icon: <Mail size={20} /> },
      { href: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
   ];

   return (
      <div className="min-h-screen bg-[#0B0F14] flex overflow-hidden font-inter">
         {/* Sidebar Overlay */}
         {sidebarOpen && (
            <div
               className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
               onClick={() => setSidebarOpen(false)}
            ></div>
         )}

         {/* Sidebar */}
         <aside className={`fixed top-0 left-0 h-screen w-72 bg-[#0B0F14] border-r border-[#3B82F6]/10 flex flex-col transition-transform duration-300 z-50 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:relative'}`}>
            <div className="p-8 h-24 flex items-center justify-between border-b border-[#3B82F6]/5">
               <Link href="/admin" className="font-outfit text-xl font-bold flex items-center gap-3">
               <div className="w-32 h-20 flex items-center justify-center">
                  <img src="/site-logo.png" alt="AxisX" className="w-full h-auto object-contain" />
               </div>
                  <span className="text-[#F8FAFC]">Admin<span className="text-[#3B82F6] font-black uppercase text-xs tracking-widest ml-1">OS</span></span>
               </Link>
               <button className="lg:hidden text-[#94A3B8] hover:text-white" onClick={() => setSidebarOpen(false)}>
                  <X size={24} />
               </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-6 py-10 space-y-3">
               <div className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em] mb-4 px-2">Primary Navigation</div>
               {navItems.map((item) => (
                  <Link
                     key={item.href}
                     href={item.href}
                     className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${pathname === item.href
                           ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                           : 'text-[#94A3B8] hover:bg-[#3B82F6]/5 hover:text-[#F8FAFC]'
                        }`}
                     onClick={() => setSidebarOpen(false)}
                  >
                     <span className={`${pathname === item.href ? 'text-[#3B82F6]' : 'text-[#4A5568] group-hover:text-[#3B82F6] transition-colors'}`}>
                        {item.icon}
                     </span>
                     <span className="font-bold text-[13px] uppercase tracking-wider">{item.label}</span>
                  </Link>
               ))}

               <div className="pt-8 space-y-3">
                  <div className="text-[10px] font-bold text-[#4A5568] uppercase tracking-[0.2em] mb-4 px-2">External Resources</div>
                  <Link
                     href="/"
                     target="_blank"
                     className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-[#94A3B8] hover:bg-[#3B82F6]/5 hover:text-[#F8FAFC] transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <ExternalLink size={18} className="text-[#4A5568] group-hover:text-[#3B82F6]" />
                        <span className="font-bold text-[13px] uppercase tracking-wider">View Site</span>
                     </div>
                     <CheckCircle2 size={14} className="text-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
               </div>
            </nav>

            <div className="p-6 border-t border-[#3B82F6]/5">
               <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-[#ef4444] hover:bg-[#ef4444]/10 transition-all font-bold text-[13px] uppercase tracking-wider bg-[#ef4444]/5 border border-[#ef4444]/10"
               >
                  <LogOut size={18} />
                  Terminate Session
               </button>
            </div>
         </aside>

         {/* Main Content */}
         <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0e0e10]">
            <header className="h-24 border-b border-[#3B82F6]/5 bg-[#0B0F14]/80 backdrop-blur-xl flex items-center justify-between px-8 lg:px-12 shrink-0 z-30">
               <button
                  className="lg:hidden text-[#F8FAFC] p-3 -ml-3 bg-[#3B82F6]/10 rounded-xl"
                  onClick={() => setSidebarOpen(true)}
               >
                  <Menu size={24} />
               </button>

               <div className="flex items-center gap-6 ml-auto">
                  <div className="text-right hidden sm:block">
                     <p className="text-xs font-black text-[#F8FAFC] uppercase tracking-widest">{user?.email?.split('@')[0]}</p>
                     <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_5px_#10B981]"></span>
                        <p className="text-[10px] font-bold text-[#4A5568] uppercase tracking-widest">Root Auth</p>
                     </div>
                  </div>
                  <div className="w-28 h-20 flex items-center justify-center">
                     <img src="/site-logo.png" alt="Admin" className="w-full h-auto object-contain pl-2" />
                  </div>
               </div>
            </header>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 relative scroll-smooth">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3B82F6]/5 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse"></div>
               {children}
            </div>
         </main>
      </div>
   );
}

