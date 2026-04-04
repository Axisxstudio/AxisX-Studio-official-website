"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/supabase-api";
import { signOut } from "@/lib/supabase-api";
import { LayoutDashboard, MessageSquare, Briefcase, Mail, LogOut, Settings, Menu, X } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-[#0e0e10]">
        <div className="w-10 h-10 border-4 border-[#a3a6ff]/20 border-t-[#a3a6ff] rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-[#0e0e10] flex overflow-hidden">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
           className="fixed inset-0 bg-black/60 z-40 lg:hidden"
           onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-64 bg-[#19191c] border-r border-[#a3a6ff]/10 flex flex-col transition-transform duration-300 z-50 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:relative'}`}>
         <div className="p-6 h-20 flex items-center justify-between border-b border-[#a3a6ff]/10">
            <Link href="/admin" className="font-outfit text-xl font-bold flex items-center gap-3">
               <BrandLogo alt="" className="h-auto w-10 shrink-0" variant="mark" />
               <span>Admin<span className="text-[#a3a6ff]">OS</span></span>
            </Link>
            <button className="lg:hidden text-[#adaaad]" onClick={() => setSidebarOpen(false)}>
               <X size={24} />
            </button>
         </div>

         <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-[#a3a6ff]/10 text-[#a3a6ff] shadow-sm' : 'text-[#adaaad] hover:bg-[#a3a6ff]/5 hover:text-[#f9f5f8]'}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ))}
         </nav>

         <div className="p-4 border-t border-[#a3a6ff]/10">
            <button 
               onClick={handleLogout}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#ff6e84] hover:bg-[#ff6e84]/10 transition-colors font-medium text-sm"
            >
               <LogOut size={20} />
               Sign Out
            </button>
         </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
         <header className="h-20 border-b border-[#a3a6ff]/10 bg-[#19191c]/50 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 shrink-0">
            <button 
               className="lg:hidden text-[#f9f5f8] p-2 -ml-2 hover:bg-[#1f1f22] rounded-lg"
               onClick={() => setSidebarOpen(true)}
            >
               <Menu size={24} />
            </button>

            <div className="flex items-center gap-4 ml-auto">
               <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-[#f9f5f8]">{user.email}</p>
                  <p className="text-xs text-[#adaaad]">Administrator</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#a3a6ff] to-[#c180ff] border-2 border-[#19191c] shadow-lg"></div>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#0e0e10] relative">
            <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#a3a6ff]/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
            {children}
         </div>
      </main>
    </div>
  );
}
