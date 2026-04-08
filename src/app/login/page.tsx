"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "@/lib/supabase-api";
import { auth } from "@/lib/supabase-api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, Cpu, Zap, Layout } from "lucide-react";
import { isAdminUser } from "@/lib/admin";
import BrandLogo from "@/components/BrandLogo";
import { motion, AnimatePresence } from "framer-motion";

function getLoginErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message =
    typeof error === "object" && error && "message" in error ? String(error.message).toLowerCase() : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many login attempts. Please try again shortly.";
    default:
      if (message.includes("email not confirmed")) {
        return "Please confirm this email address before signing in.";
      }
      return "Unable to sign in with those credentials.";
  }
}

const features = [
  { icon: <Cpu size={18} />, label: "Engineered Security" },
  { icon: <ShieldCheck size={18} />, label: "Bespoke Authentication" },
  { icon: <Zap size={18} />, label: "Performance Driven" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const isAllowedAdmin = await isAdminUser(credential.user);

      if (!isAllowedAdmin) {
        await signOut(auth);
        toast.error("Unauthorized access attempt.");
        return;
      }

      toast.success("Identity verified. Welcome back.");
      router.replace("/admin");
    } catch (error) {
      console.error(error);
      toast.error(getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-[#0B0F14] border border-[#3B82F6]/20 rounded-xl px-4 py-3.5 text-[#F8FAFC] focus:border-[#3B82F6]/60 focus:ring-1 focus:ring-[#3B82F6]/40 outline-none transition-all placeholder:text-[#4A5568]";

  return (
    <main className="h-screen bg-[#0B0F14] flex flex-col lg:flex-row relative overflow-hidden">
      {/* ── Visual Branding Panel (Large screens only) ── */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 overflow-hidden border-r border-[#3B82F6]/10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#0B0F14] opacity-90 z-10" />
          <div className="grid-bg absolute inset-0 z-20 opacity-40" />
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}
            className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-[#3B82F6]/10 rounded-full blur-[140px] z-0"
          />
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 0.5 }}
            className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-[#1F2937]/10 rounded-full blur-[120px] z-0"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="relative z-30"
        >
          <Link href="/" className="inline-block transition-transform hover:scale-105">
            <img src="/admin-logo.png" alt="AxisX" className="h-10 w-auto object-contain" />
          </Link>
        </motion.div>

        <div className="relative z-30 max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[1px] w-12 bg-gradient-to-r from-[#3B82F6] to-transparent" />
              <span className="text-xs uppercase tracking-widest font-bold text-[#3B82F6]">Secure Administration</span>
            </div>
            <h2 className="text-5xl font-bold font-outfit text-[#F8FAFC] leading-tight mb-6">
              Management Portal for <span className="gradient-text">AxisX Studio</span>
            </h2>
            <p className="text-[#94A3B8] text-lg leading-relaxed mb-10">
              Access the mission control for your digital infrastructure. Manage projects, analyze performance, and govern your technical ecosystem with high-fidelity control.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-1 gap-5"
          >
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4 text-sm font-medium text-[#F8FAFC]/80 group">
                <div className="w-10 h-10 rounded-xl bg-[#111827] border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  {f.icon}
                </div>
                {f.label}
              </div>
            ))}
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} transition={{ delay: 1 }}
          className="relative z-30 text-xs text-[#94A3B8] font-medium tracking-tight"
        >
          © {new Date().getFullYear()} AxisX Studio. Technical Governance Systems.
        </motion.p>
      </div>

      {/* ── Login Section ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-y-auto">
        {/* Mobile Background Elements */}
        <div className="lg:hidden absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#3B82F6]/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-[#1F2937]/10 rounded-full blur-[80px]" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <div className="lg:hidden text-center mb-6">
              <Link href="/" className="inline-block mb-4 transition-transform hover:scale-105">
                <img src="/admin-logo.png" alt="AxisX" className="h-8 w-auto mx-auto object-contain" />
              </Link>
              <h1 className="text-3xl font-bold font-outfit text-white mb-2">Admin Portal</h1>
              <p className="text-[#94A3B8] text-sm">Secure access for the AxisX engineering team.</p>
            </div>

            <div className="hidden lg:block mb-8">
              <h1 className="text-3xl font-bold font-outfit text-white mb-3">Sign in</h1>
              <p className="text-[#94A3B8] text-sm">Authentication is required to proceed.</p>
            </div>

            <div className="glass-strong rounded-[32px] p-8 sm:p-10 border border-[#3B82F6]/15 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
              <div className="lg:hidden flex justify-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[#0B0F14] border border-[#3B82F6]/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                  <Lock className="text-[#3B82F6]" size={24} />
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Email Address</label>
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="name@axisx.studio"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Secret Key</label>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-ltr-white w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {loading ? "Authenticating..." : "Authorize Access"}
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-[#3B82F6]/10 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#94A3B8] hover:text-[#3B82F6] transition-all group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Back to main infrastructure
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center px-6">
              <p className="text-[10px] text-[#4A5568] leading-relaxed uppercase tracking-[0.05em]">
                Restricted area. Unauthorized access attempts are monitored and recorded electronically.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
