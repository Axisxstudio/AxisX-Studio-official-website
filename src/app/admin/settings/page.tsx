"use client";

import { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "@/lib/supabase-api";
import { AlertTriangle, Key, Mail, Power, Save, Shield, User, Settings2, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/supabase-api";
import { emitAdminAuthChange, syncAdminEmail } from "@/lib/admin";
import {
  DEFAULT_MAINTENANCE_MESSAGE,
  getSiteSettings,
  isSiteSettingsSchemaMissing,
  saveSiteSettings,
} from "@/lib/site-settings";
import { motion } from "framer-motion";

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
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(DEFAULT_MAINTENANCE_MESSAGE);
  const [siteSettingsLoading, setSiteSettingsLoading] = useState(true);
  const [siteSettingsSaving, setSiteSettingsSaving] = useState(false);
  const [siteSettingsError, setSiteSettingsError] = useState<string | null>(null);
  const [siteSettingsSchemaMissing, setSiteSettingsSchemaMissing] = useState(false);

  useEffect(() => {
    setLoginEmail(user?.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    let active = true;

    const loadSiteSettings = async () => {
      try {
        const settings = await getSiteSettings();
        if (!active) {
          return;
        }

        setSiteSettingsError(null);
        setSiteSettingsSchemaMissing(false);
        setMaintenanceMode(settings.maintenanceMode);
        setMaintenanceMessage(settings.maintenanceMessage);
      } catch (error) {
        if (!active) {
          return;
        }

        if (isSiteSettingsSchemaMissing(error)) {
          setSiteSettingsSchemaMissing(true);
          setSiteSettingsError("Run the Supabase migration schema to enable maintenance mode.");
          return;
        }

        setSiteSettingsError("Unable to load site visibility settings.");
        toast.error("Unable to load site visibility settings.");
      } finally {
        if (active) {
          setSiteSettingsLoading(false);
        }
      }
    };

    void loadSiteSettings();

    return () => {
      active = false;
    };
  }, []);

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

  const handleSiteSettingsUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (siteSettingsSchemaMissing) {
      toast.error("Run the Supabase migration schema first to enable maintenance mode.");
      return;
    }

    setSiteSettingsSaving(true);

    try {
      const savedSettings = await saveSiteSettings({
        maintenanceMessage: maintenanceMessage.trim() || DEFAULT_MAINTENANCE_MESSAGE,
        maintenanceMode,
      });

      setMaintenanceMode(savedSettings.maintenanceMode);
      setMaintenanceMessage(savedSettings.maintenanceMessage);
      setSiteSettingsError(null);
      toast.success(savedSettings.maintenanceMode ? "Maintenance mode enabled." : "Maintenance mode disabled.");
    } catch (error) {
      if (isSiteSettingsSchemaMissing(error)) {
        setSiteSettingsSchemaMissing(true);
        setSiteSettingsError("Run the Supabase migration schema to enable maintenance mode.");
        toast.error("Run the Supabase migration schema first to enable maintenance mode.");
      } else {
        toast.error("Unable to update maintenance mode right now.");
      }
    } finally {
      setSiteSettingsSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-[#3B82F6]/15 bg-[#0B0F14] px-4 py-3 text-[#F8FAFC] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/30 outline-none transition-all placeholder:text-[#4A5568] text-sm";
  const btnCls = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-[#3B82F6] hover:bg-[#3B82F6] hover:text-[#0B0F14] transition-all disabled:opacity-50 cursor-pointer";

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up">
      <header className="flex items-center gap-4 pb-6 border-b border-[#3B82F6]/10">
        <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
          <Settings2 size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-outfit text-[#F8FAFC]">System Settings</h1>
          <p className="text-[#94A3B8]">Configure your administrative environment and site visibility.</p>
        </div>
      </header>

      <div className="space-y-8">
        {/* Profile Card */}
        <div className="glass-strong rounded-[32px] p-8 border border-[#3B82F6]/10">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#3B82F6] to-[#1F2937] flex items-center justify-center text-3xl font-bold text-[#0B0F14] shadow-2xl">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#0B0F14] border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shadow-lg">
                <Shield size={16} />
              </div>
            </div>
            <div className="text-center md:text-left">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[10px] font-bold uppercase tracking-widest text-[#3B82F6] mb-2">
                 Root Account Verified
               </div>
               <h2 className="text-2xl font-bold font-outfit text-[#F8FAFC]">{user?.email?.split('@')[0]}</h2>
               <p className="text-[#94A3B8] text-sm flex items-center justify-center md:justify-start gap-2 mt-1">
                 <Mail size={14} className="text-[#3B82F6]" /> {user?.email}
               </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#0B0F14]/40 border border-[#3B82F6]/5">
              <p className="text-[10px] uppercase font-bold text-[#4A5568] tracking-widest mb-1">Provider</p>
              <p className="text-sm font-medium text-[#94A3B8]">Supabase Engineering</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#0B0F14]/40 border border-[#3B82F6]/5">
              <p className="text-[10px] uppercase font-bold text-[#4A5568] tracking-widest mb-1">Access Level</p>
              <p className="text-sm font-medium text-[#3B82F6]">Global Administrator</p>
            </div>
          </div>
        </div>

        {/* Visibility Controls */}
        <section className="glass-strong rounded-[32px] p-8 border border-[#3B82F6]/10 overflow-hidden relative">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/20">
              <Power size={20} />
            </div>
            <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">Deployment Visibility</h2>
          </div>

          <form onSubmit={handleSiteSettingsUpdate} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-[#0B0F14]/60 border border-[#3B82F6]/10 gap-6">
              <div className="max-w-md">
                <p className="font-bold text-[#F8FAFC] text-sm mb-1">Maintenance Mode</p>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Toggle this to prevent public access while performing critical system updates. 
                  Login and administrative endpoints will remain available.
                </p>
              </div>

              <button
                aria-checked={maintenanceMode}
                className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border-2 transition-all duration-300 ${maintenanceMode
                  ? "border-[#3B82F6] bg-[#3B82F6]/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  : "border-[#1F2937] bg-[#0B0F14]"
                  }`}
                disabled={siteSettingsLoading || siteSettingsSaving || siteSettingsSchemaMissing}
                onClick={() => setMaintenanceMode((current) => !current)}
                role="switch"
                type="button"
              >
                <span
                  className={`inline-block h-6 w-6 rounded-full transition-transform duration-300 ${maintenanceMode ? "translate-x-8 bg-[#3B82F6] shadow-[0_0_10px_#3B82F6]" : "translate-x-1 bg-[#1F2937]"}`}
                />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#4A5568]" htmlFor="maintenance-message">
                Public Announcement Message
              </label>
              <textarea
                className="min-h-32 w-full rounded-2xl border border-[#3B82F6]/15 bg-[#0B0F14] px-4 py-4 text-[#F8FAFC] focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 outline-none transition-all resize-none text-sm leading-relaxed"
                disabled={siteSettingsLoading || siteSettingsSaving || siteSettingsSchemaMissing}
                id="maintenance-message"
                onChange={(event) => setMaintenanceMessage(event.target.value)}
                placeholder={DEFAULT_MAINTENANCE_MESSAGE}
                value={maintenanceMessage}
              />
            </div>

            <button
              type="submit"
              disabled={siteSettingsLoading || siteSettingsSaving || siteSettingsSchemaMissing}
              className={btnCls}
            >
              <Save size={16} />
              {siteSettingsSaving ? "Processing..." : "Sync Site State"}
            </button>
          </form>
        </section>

        {/* Security / Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email Update */}
          <section className="glass-strong rounded-[32px] p-8 border border-[#3B82F6]/10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/20">
                <Shield size={20} />
              </div>
              <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">Update Email</h2>
            </div>

            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className={inputCls}
                placeholder="New Email Endpoint"
              />
              <input
                type="password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                className={inputCls}
                placeholder="Account Password"
              />
              <button type="submit" disabled={emailLoading} className={btnCls}>
                <Save size={16} /> Update Endpoint
              </button>
            </form>
          </section>

          {/* Password Update */}
          <section className="glass-strong rounded-[32px] p-8 border border-[#3B82F6]/10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/20">
                <Lock size={20} />
              </div>
              <h2 className="text-xl font-bold font-outfit text-[#F8FAFC]">Security Keys</h2>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={inputCls}
                placeholder="Current Secret Key"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={inputCls}
                placeholder="New Secret Key"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputCls}
                placeholder="Confirm Secret Key"
              />
              <button type="submit" disabled={passwordLoading} className={btnCls}>
                <Key size={16} /> Renew Access
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

