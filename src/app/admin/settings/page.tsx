"use client";

import { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "@/lib/supabase-api";
import { Key, Mail, Save, Shield, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/supabase-api";
import { emitAdminAuthChange, syncAdminEmail } from "@/lib/admin";

function getSettingsErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "That email address is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Current password is incorrect.";
    case "auth/requires-recent-login":
      return "Please sign in again before changing account details.";
    default:
      return "Unable to update these settings right now.";
  }
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setLoginEmail(user?.email ?? "");
  }, [user?.email]);

  const reauthenticateAdmin = async (password: string) => {
    const currentUser = auth.currentUser;

    if (!currentUser?.email) {
      throw new Error("No authenticated admin account found.");
    }

    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
    return currentUser;
  };

  const handleEmailUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextEmail = loginEmail.trim().toLowerCase();
    if (!nextEmail) {
      toast.error("Please enter an email address.");
      return;
    }

    if (!emailPassword) {
      toast.error("Please confirm your current password.");
      return;
    }

    setEmailLoading(true);

    try {
      const currentUser = await reauthenticateAdmin(emailPassword);
      const previousEmail = currentUser.email;

      await updateEmail(currentUser, nextEmail);
      await syncAdminEmail(currentUser.uid, previousEmail, nextEmail);
      emitAdminAuthChange();

      setEmailPassword("");
      toast.success("Admin email updated.");
    } catch (error) {
      toast.error(getSettingsErrorMessage(error));
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    setPasswordLoading(true);

    try {
      await reauthenticateAdmin(currentPassword);

      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Admin password updated.");
    } catch (error) {
      toast.error(getSettingsErrorMessage(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <h1 className="text-3xl font-bold font-outfit text-[#f9f5f8] mb-2">Settings</h1>
        <p className="text-[#adaaad]">Manage your account preferences and security.</p>
      </header>

      <div className="glass-strong rounded-3xl p-8 border border-[#a3a6ff]/10 max-w-3xl">
        <h2 className="text-xl font-bold font-outfit text-[#f9f5f8] mb-6 flex items-center gap-2">
          <User size={20} className="text-[#a3a6ff]" /> Admin Profile
        </h2>

        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-[#19191c] p-4 rounded-xl border border-[#a3a6ff]/5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#a3a6ff] to-[#c180ff] flex items-center justify-center font-bold text-[#0e0e10] text-xl">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[#f9f5f8]">Primary Administrator</p>
              <p className="text-sm text-[#adaaad] flex items-center gap-1">
                <Mail size={14} className="text-[#a3a6ff]/70" /> {user?.email}
              </p>
              <p className="text-xs text-[#adaaad] mt-1">
                Using Supabase Authentication.
              </p>
            </div>
          </div>

          <form onSubmit={handleEmailUpdate} className="rounded-xl border border-[#a3a6ff]/10 bg-[#0e0e10]/50 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Shield size={18} className="text-[#c180ff] mt-0.5" />
              <div>
                <p className="font-medium text-[#f9f5f8] text-sm">Change Login Email</p>
                <p className="text-xs text-[#adaaad]">Use your current password to confirm the change.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 outline-none transition-colors"
                placeholder="New admin email"
              />
              <input
                type="password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 outline-none transition-colors"
                placeholder="Current password"
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#a3a6ff]/20 px-4 py-2.5 text-sm font-semibold text-[#a3a6ff] hover:bg-[#a3a6ff]/10 transition-colors disabled:opacity-60"
            >
              <Save size={16} />
              {emailLoading ? "Updating..." : "Update Email"}
            </button>
          </form>

          <form onSubmit={handlePasswordUpdate} className="rounded-xl border border-[#a3a6ff]/10 bg-[#0e0e10]/50 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Key size={18} className="text-[#a3a6ff] mt-0.5" />
              <div>
                <p className="font-medium text-[#f9f5f8] text-sm">Change Password</p>
                <p className="text-xs text-[#adaaad]">Your current password is required before saving a new one.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 outline-none transition-colors"
                placeholder="Current password"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 outline-none transition-colors"
                placeholder="New password"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 outline-none transition-colors"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#a3a6ff]/20 px-4 py-2.5 text-sm font-semibold text-[#a3a6ff] hover:bg-[#a3a6ff]/10 transition-colors disabled:opacity-60"
            >
              <Save size={16} />
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
