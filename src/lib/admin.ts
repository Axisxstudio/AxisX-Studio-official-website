import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where } from "@/lib/supabase-api";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type Auth,
  type User,
} from "@/lib/supabase-api";
import { db } from "@/lib/supabase-api";
import { adminEnv } from "@/lib/env";

export type AdminCredentials = {
  email: string;
  password: string;
};

const ADMIN_SESSION_STORAGE_KEY = "axisx_admin_mock";
const ADMIN_CREDENTIALS_STORAGE_KEY = "axisx_admin_credentials";
const LOCAL_ADMIN_UID = "axisx-local-admin";

export const ADMIN_AUTH_CHANGE_EVENT = "axisx-admin-auth-change";

function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getAuthErrorCode(error: unknown): string {
  return typeof error === "object" && error && "code" in error ? String(error.code) : "";
}

export function emitAdminAuthChange(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export function getDefaultAdminCredentials(): AdminCredentials {
  return {
    email: normalizeEmail(adminEnv.defaultEmail),
    password: adminEnv.defaultPassword,
  };
}

export function getAdminCredentials(): AdminCredentials {
  const defaults = getDefaultAdminCredentials();

  if (!isBrowser()) {
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_CREDENTIALS_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Partial<AdminCredentials>;
    const email = normalizeEmail(parsed.email);
    const password = typeof parsed.password === "string" ? parsed.password : "";

    if (!email || !password) {
      return defaults;
    }

    return { email, password };
  } catch {
    return defaults;
  }
}

export function saveAdminCredentials(credentials: AdminCredentials): void {
  if (!isBrowser()) return;

  window.localStorage.setItem(
    ADMIN_CREDENTIALS_STORAGE_KEY,
    JSON.stringify({
      email: normalizeEmail(credentials.email),
      password: credentials.password,
    }),
  );

  emitAdminAuthChange();
}

export function adminCredentialsMatch(email: string, password: string): boolean {
  const configured = getAdminCredentials();
  return normalizeEmail(email) === configured.email && password === configured.password;
}

export function isConfiguredAdminEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email) === getAdminCredentials().email;
}

export function isMockAdminSessionActive(): boolean {
  return isBrowser() && window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) === "true";
}

export function activateMockAdminSession(): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, "true");
  emitAdminAuthChange();
}

export function clearMockAdminSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  emitAdminAuthChange();
}

async function syncConfiguredAdminRecord(user: User): Promise<void> {
  if (!user.email) return;

  try {
    await setDoc(
      doc(db, "admins", user.uid),
      {
        uid: user.uid,
        email: normalizeEmail(user.email),
        role: "owner",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // Ignore admin profile sync failures so sign-in can still continue.
  }
}

export function getMockAdminUser(): User {
  return {
    email: getAdminCredentials().email,
    uid: LOCAL_ADMIN_UID,
  } as User;
}

export async function establishConfiguredAdminSession(
  authInstance: Auth,
  email: string,
  password: string,
): Promise<User | null> {
  const normalizedEmail = normalizeEmail(email);

  if (!adminCredentialsMatch(normalizedEmail, password)) {
    return null;
  }

  const finalize = async (user: User): Promise<User> => {
    await syncConfiguredAdminRecord(user);
    clearMockAdminSession();
    return user;
  };

  try {
    const credential = await signInWithEmailAndPassword(authInstance, normalizedEmail, password);
    return finalize(credential.user);
  } catch (signInError) {
    const shouldProvision = [
      "auth/invalid-credential",
      "auth/invalid-login-credentials",
      "auth/user-not-found",
    ].includes(getAuthErrorCode(signInError));

    if (!shouldProvision) {
      throw signInError;
    }

    try {
      const credential = await createUserWithEmailAndPassword(authInstance, normalizedEmail, password);
      return finalize(credential.user);
    } catch (createError) {
      if (getAuthErrorCode(createError) === "auth/email-already-in-use") {
        throw signInError;
      }

      throw createError;
    }
  }
}

export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user?.email) return false;

  if (isConfiguredAdminEmail(user.email)) {
    return true;
  }

  const normalizedEmail = normalizeEmail(user.email);

  try {
    const adminByUid = query(collection(db, "admins"), where("uid", "==", user.uid), limit(1));
    const adminByEmail = query(collection(db, "admins"), where("email", "==", normalizedEmail), limit(1));

    const [uidSnapshot, emailSnapshot] = await Promise.all([
      getDocs(adminByUid),
      getDocs(adminByEmail),
    ]);

    return !uidSnapshot.empty || !emailSnapshot.empty;
  } catch {
    return false;
  }
}

export async function syncAdminEmail(
  uid: string,
  previousEmail: string | null | undefined,
  nextEmail: string,
): Promise<void> {
  const normalizedEmail = normalizeEmail(nextEmail);

  try {
    const adminByUid = query(collection(db, "admins"), where("uid", "==", uid), limit(1));
    const uidSnapshot = await getDocs(adminByUid);

    if (!uidSnapshot.empty) {
      await updateDoc(uidSnapshot.docs[0].ref, { email: normalizedEmail });
      return;
    }

    const previousNormalizedEmail = normalizeEmail(previousEmail);
    if (!previousNormalizedEmail) {
      return;
    }

    const adminByEmail = query(
      collection(db, "admins"),
      where("email", "==", previousNormalizedEmail),
      limit(1),
    );
    const emailSnapshot = await getDocs(adminByEmail);

    if (!emailSnapshot.empty) {
      await updateDoc(emailSnapshot.docs[0].ref, {
        email: normalizedEmail,
        uid,
      });
    }
  } catch {
    // Ignore sync failures so credential updates can still finish.
  }
}
