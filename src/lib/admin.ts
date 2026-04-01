import { collection, getDocs, limit, query, updateDoc, where } from "@/lib/supabase-api";
import type { User } from "@/lib/supabase-api";
import { db } from "@/lib/supabase-api";

export const ADMIN_AUTH_CHANGE_EVENT = "axisx-admin-auth-change";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function normalizeEmail(email: string | null | undefined): string {
  return email?.trim().toLowerCase() ?? "";
}

export function emitAdminAuthChange(): void {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(ADMIN_AUTH_CHANGE_EVENT));
}

export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user?.email) {
    return false;
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
    // Ignore sync failures so email updates can still finish.
  }
}
