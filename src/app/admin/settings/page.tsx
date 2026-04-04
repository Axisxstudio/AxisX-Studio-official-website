"use client";

import { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "@/lib/supabase-api";
import { AlertTriangle, Key, Mail, Power, Save, Shield, User } from "lucide-react";
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

          <form onSubmit={handleSiteSettingsUpdate} className="rounded-xl border border-[#a3a6ff]/10 bg-[#0e0e10]/50 p-5 space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-[#a3a6ff] mt-0.5" />
              <div>
                <p className="font-medium text-[#f9f5f8] text-sm">Public Site Visibility</p>
                <p className="text-xs text-[#adaaad]">
                  When maintenance mode is active, visitors only see the maintenance message and the admin login icon.
                </p>
              </div>
            </div>

            {siteSettingsError && (
              <div className={`rounded-xl border px-4 py-3 text-sm ${siteSettingsSchemaMissing
                ? "border-[#ffb86b]/20 bg-[#ffb86b]/10 text-[#ffd7a8]"
                : "border-[#ff6e84]/20 bg-[#ff6e84]/10 text-[#ffd0d8]"
                }`}>
                {siteSettingsError}
                {siteSettingsSchemaMissing && (
                  <span className="block mt-1 text-xs text-[#adaaad]">
                    Apply the SQL in `SUPABASE_MIGRATION_SCHEMA.sql`, then refresh this page.
                  </span>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-[#a3a6ff]/10 bg-[#19191c] p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#f9f5f8]">Maintenance mode</p>
                  <p className="text-xs text-[#adaaad]">
                    Admin pages and the login page stay accessible while public pages are hidden.
                  </p>
                </div>

                <button
                  aria-checked={maintenanceMode}
                  className={`inline-flex h-8 w-14 items-center rounded-full border px-1 transition-colors ${maintenanceMode
                    ? "border-[#c180ff]/40 bg-[#c180ff]/20"
                    : "border-[#a3a6ff]/15 bg-[#0e0e10]"
                    }`}
                  disabled={siteSettingsLoading || siteSettingsSaving || siteSettingsSchemaMissing}
                  onClick={() => setMaintenanceMode((current) => !current)}
                  role="switch"
                  type="button"
                >
                  <span
                    className={`h-6 w-6 rounded-full bg-[#f9f5f8] shadow-sm transition-transform ${maintenanceMode ? "translate-x-6" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#adaaad]" htmlFor="maintenance-message">
                Public maintenance message
              </label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-[#a3a6ff]/20 bg-[#0e0e10] px-4 py-3 text-[#f9f5f8] focus:border-[#a3a6ff]/60 outline-none transition-colors resize-none"
                disabled={siteSettingsLoading || siteSettingsSaving || siteSettingsSchemaMissing}
                id="maintenance-message"
                onChange={(event) => setMaintenanceMessage(event.target.value)}
                placeholder={DEFAULT_MAINTENANCE_MESSAGE}
                value={maintenanceMessage}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={siteSettingsLoading || siteSettingsSaving || siteSettingsSchemaMissing}
                className="inline-flex items-center gap-2 rounded-xl border border-[#a3a6ff]/20 px-4 py-2.5 text-sm font-semibold text-[#a3a6ff] hover:bg-[#a3a6ff]/10 transition-colors disabled:opacity-60"
              >
                <Save size={16} />
                {siteSettingsSaving ? "Saving..." : "Save Maintenance Settings"}
              </button>

              <div className="inline-flex items-center gap-2 rounded-full border border-[#a3a6ff]/10 bg-[#19191c] px-3 py-2 text-xs text-[#adaaad]">
                <Power size={14} className={maintenanceMode ? "text-[#c180ff]" : "text-[#a3a6ff]"} />
                {maintenanceMode ? "Public site hidden" : "Public site visible"}
              </div>
            </div>
          </form>

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
