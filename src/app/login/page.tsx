"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "@/lib/supabase-api";
import { auth } from "@/lib/supabase-api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import { Lock } from "lucide-react";
import { isAdminUser } from "@/lib/admin";

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
    case "auth/network-request-failed":
      return "Network error while trying to sign in.";
    default:
      if (message.includes("email not confirmed")) {
        return "Please confirm this email address in Supabase before signing in.";
      }

      return "Unable to sign in with those credentials.";
  }
}

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
        toast.error("This account is not authorized for admin access.");
        return;
      }

      toast.success("Welcome back, Admin");
      router.replace("/admin");
    } catch (error) {
      console.error(error);
      toast.error(getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0e0e10]">
      {/* Abstract Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#a3a6ff]/10 rounded-full blur-[120px] mix-blend-screen z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#c180ff]/10 rounded-full blur-[100px] mix-blend-screen z-0 delay-100"></div>

      <div className="w-full max-w-md relative z-10 px-6">
        <div className="text-center mb-10">
           <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:scale-105 transition-transform">
              <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#a3a6ff] to-[#c180ff] flex items-center justify-center text-[#0e0e10] font-black text-2xl">X</span>
           </Link>
           <h1 className="text-3xl font-bold font-outfit text-[#f9f5f8] mb-2">Admin Portal</h1>
           <p className="text-[#adaaad] text-sm">Secure access to AxisX management system.</p>
        </div>

        <div className="glass-strong rounded-3xl p-8 border border-[#a3a6ff]/20 shadow-2xl animate-fade-in-up">
           <div className="flex justify-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[#19191c] border border-[#a3a6ff]/20 flex items-center justify-center glow-accent">
                 <Lock className="text-[#a3a6ff]" size={24} />
              </div>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-6">
              <div>
                 <label className="block text-sm font-medium text-[#adaaad] mb-2">Admin Email</label>
                 <input 
                   type="email" 
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 outline-none transition-colors"
                 />
                 <p className="mt-2 text-xs text-[#adaaad]">
                   Sign in with a Supabase Auth user that also has an entry in the <code>admins</code> table.
                 </p>
              </div>
              <div>
                 <label className="block text-sm font-medium text-[#adaaad] mb-2">Password</label>
                 <input 
                   type="password" 
                   required
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   className="w-full bg-[#0e0e10] border border-[#a3a6ff]/20 rounded-xl px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 outline-none transition-colors"
                 />
                 <p className="mt-2 text-xs text-[#adaaad]">
                   Use the password stored for that Supabase Auth account.
                 </p>
              </div>

              <button 
                 type="submit" 
                 disabled={loading}
                 className="w-full py-3.5 mt-4 rounded-xl bg-gradient-to-r from-[#a3a6ff] to-[#c180ff] text-[#0e0e10] font-bold text-lg hover:shadow-[0_0_20px_rgba(163,166,255,0.4)] transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                 {loading ? "Authenticating..." : "Sign In"}
              </button>
           </form>
           
           <div className="mt-8 text-center">
              <Link href="/" className="text-sm text-[#adaaad] hover:text-[#a3a6ff] transition-colors">
                 &larr; Return to public site
              </Link>
           </div>
        </div>
      </div>
    </main>
  );
}
