import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type DatabaseRecord = Record<string, unknown>;
type CollectionName = string;
type AuthError = Error & { code: string; cause?: unknown };
type WhereValue = string | number | boolean | null;

type OrderByOperation = {
  type: "orderBy";
  field: string;
  dir: "asc" | "desc";
};

type WhereOperation = {
  type: "where";
  field: string;
  op: "==";
  value: WhereValue;
};

type LimitOperation = {
  type: "limit";
  value: number;
};

type QueryOperation = OrderByOperation | WhereOperation | LimitOperation;

type QueryReference = {
  col: CollectionName;
  ops: QueryOperation[];
};

type QuerySource = CollectionName | QueryReference;

const tableColumnMaps = {
  admins: {
    id: "id",
    uid: "uid",
    email: "email",
    role: "role",
    createdAt: "createdat",
    updatedAt: "updatedat",
  },
  contacts: {
    id: "id",
    name: "name",
    email: "email",
    phone: "phone",
    subject: "subject",
    message: "message",
    status: "status",
    createdAt: "createdat",
  },
  feedback: {
    id: "id",
    clientName: "clientname",
    companyName: "companyname",
    email: "email",
    projectName: "projectname",
    message: "message",
    imageUrls: "imageurls",
    videoUrls: "videourls",
    consentToPublish: "consenttopublish",
    createdAt: "createdat",
    updatedAt: "updatedat",
  },
  projects: {
    id: "id",
    title: "title",
    slug: "slug",
    category: "category",
    clientName: "clientname",
    description: "description",
    technologies: "technologies",
    coverImageUrl: "coverimageurl",
    galleryImageUrls: "galleryimageurls",
    videoUrls: "videourls",
    isPublished: "ispublished",
    createdAt: "createdat",
    updatedAt: "updatedat",
  },
} as const satisfies Record<string, Record<string, string>>;

export type DocumentReference = {
  path: CollectionName;
  id: string;
};

export type QueryDocumentSnapshot<T extends DatabaseRecord = DatabaseRecord> = {
  id: string;
  data: () => T;
  ref: DocumentReference;
};

export type QuerySnapshot<T extends DatabaseRecord = DatabaseRecord> = {
  docs: Array<QueryDocumentSnapshot<T>>;
  size: number;
  empty: boolean;
};

export type User = SupabaseUser & {
  uid: string;
};

let currentUser: User | null = null;

function normalizeUser(user: SupabaseUser | null): User | null {
  if (!user) {
    return null;
  }

  return {
    ...user,
    uid: user.id,
  };
}

void supabase.auth.getUser().then(({ data }) => {
  currentUser = normalizeUser(data.user);
});

function createAuthError(code: string, message: string, cause?: unknown): AuthError {
  const error = new Error(message) as AuthError;
  error.code = code;

  if (cause !== undefined) {
    error.cause = cause;
  }

  return error;
}

function normalizeAuthError(error: unknown): AuthError {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error as AuthError;
  }

  const message =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "Unexpected authentication error.";

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return createAuthError("auth/invalid-credential", message, error);
  }

  if (normalized.includes("user already registered") || normalized.includes("already been registered")) {
    return createAuthError("auth/email-already-in-use", message, error);
  }

  if (normalized.includes("weak password") || normalized.includes("password should be at least")) {
    return createAuthError("auth/weak-password", message, error);
  }

  if (normalized.includes("email address") && normalized.includes("invalid")) {
    return createAuthError("auth/invalid-email", message, error);
  }

  if (normalized.includes("rate limit")) {
    return createAuthError("auth/too-many-requests", message, error);
  }

  return createAuthError("auth/unknown", message, error);
}

function getColumnMap(table: CollectionName): Record<string, string> | undefined {
  return tableColumnMaps[table as keyof typeof tableColumnMaps];
}

function getReverseColumnMap(table: CollectionName): Record<string, string> {
  const map = getColumnMap(table);

  if (!map) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(map).map(([appField, databaseField]) => [databaseField, appField]),
  );
}

export function toDatabaseField(table: CollectionName, field: string): string {
  return getColumnMap(table)?.[field] ?? field.toLowerCase();
}

export function toDatabasePayload<T extends DatabaseRecord>(
  table: CollectionName,
  payload: T,
): DatabaseRecord {
  return Object.fromEntries(
    Object.entries(payload).map(([field, value]) => [toDatabaseField(table, field), value]),
  );
}

export function fromDatabaseRow<T extends DatabaseRecord = DatabaseRecord>(
  table: CollectionName,
  row: DatabaseRecord,
): T {
  const reverseColumnMap = getReverseColumnMap(table);

  return Object.fromEntries(
    Object.entries(row).map(([field, value]) => [reverseColumnMap[field] ?? field, value]),
  ) as T;
}

export function fromDatabaseRows<T extends DatabaseRecord = DatabaseRecord>(
  table: CollectionName,
  rows: DatabaseRecord[],
): T[] {
  return rows.map((row) => fromDatabaseRow<T>(table, row));
}

export function selectClause(table: CollectionName): string {
  const map = getColumnMap(table);

  if (!map) {
    return "*";
  }

  return Object.entries(map)
    .map(([appField, databaseField]) => (appField === databaseField ? databaseField : `${appField}:${databaseField}`))
    .join(", ");
}

export const db = {} as const;

export const auth = {
  get currentUser(): User | null {
    return currentUser;
  },
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      currentUser = normalizeUser(session?.user ?? null);
      callback(currentUser);
    });

    void supabase.auth.getUser().then(({ data }) => {
      currentUser = normalizeUser(data.user);
      callback(currentUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  },
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw normalizeAuthError(error);
    }

    currentUser = null;
  },
};

export type Auth = typeof auth;

export function collection(_db: typeof db, name: string): CollectionName {
  return name;
}

export function doc(_db: typeof db, name: string, id: string): DocumentReference {
  return { path: name, id };
}

export function query(col: CollectionName, ...ops: QueryOperation[]): QueryReference {
  return { col, ops };
}

export function orderBy(field: string, dir: "asc" | "desc" = "asc"): OrderByOperation {
  return { type: "orderBy", field, dir };
}

export function where(field: string, op: "==", value: WhereValue): WhereOperation {
  return { type: "where", field, op, value };
}

export function limit(value: number): LimitOperation {
  return { type: "limit", value };
}

async function executeQuery(source: QuerySource): Promise<{ table: string; rows: DatabaseRecord[] }> {
  const table = typeof source === "string" ? source : source.col;
  let statement = supabase.from(table).select(selectClause(table));

  if (typeof source !== "string") {
    for (const operation of source.ops) {
      if (operation.type === "orderBy") {
        statement = statement.order(toDatabaseField(table, operation.field), { ascending: operation.dir === "asc" });
      }

      if (operation.type === "where") {
        statement = statement.eq(toDatabaseField(table, operation.field), operation.value);
      }

      if (operation.type === "limit") {
        statement = statement.limit(operation.value);
      }
    }
  }

  const { data, error } = await statement;

  if (error) {
    throw error;
  }

  return {
    table,
    rows: (data ?? []) as unknown as DatabaseRecord[],
  };
}

export async function getDocs<T extends DatabaseRecord = DatabaseRecord>(
  source: QuerySource,
): Promise<QuerySnapshot<T>> {
  const { table, rows } = await executeQuery(source);

  const docs = rows.map((row) => {
    const id = typeof row.id === "string" ? row.id : String(row.id ?? "");
    const mappedRow = fromDatabaseRow<T>(table, row);

    return {
      id,
      data: () => mappedRow,
      ref: { path: table, id },
    };
  });

  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
  };
}

export async function addDoc<T extends DatabaseRecord = DatabaseRecord>(
  col: CollectionName,
  payload: T,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from(col)
    .insert([toDatabasePayload(col, payload)])
    .select(selectClause(col))
    .single();

  if (error) {
    throw error;
  }

  return {
    id: String(((data as unknown as DatabaseRecord).id) ?? ""),
  };
}

export async function updateDoc(
  docRef: DocumentReference,
  payload: Partial<DatabaseRecord>,
): Promise<void> {
  const { error } = await supabase
    .from(docRef.path)
    .update(toDatabasePayload(docRef.path, payload))
    .eq("id", docRef.id);

  if (error) {
    throw error;
  }
}

export async function deleteDoc(docRef: DocumentReference): Promise<void> {
  const { error } = await supabase.from(docRef.path).delete().eq("id", docRef.id);

  if (error) {
    throw error;
  }
}

export async function setDoc(
  docRef: DocumentReference,
  payload: DatabaseRecord,
  options?: { merge?: boolean },
): Promise<void> {
  if (options?.merge === false) {
    // Supabase upserts by primary key, so we keep this branch only for API compatibility.
  }

  const { error } = await supabase
    .from(docRef.path)
    .upsert([{ id: docRef.id, ...toDatabasePayload(docRef.path, payload) }]);

  if (error) {
    throw error;
  }
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}

export async function signInWithEmailAndPassword(
  _auth: Auth,
  email: string,
  password: string,
): Promise<{ user: User }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw normalizeAuthError(error);
  }

  const user = normalizeUser(data.user);

  if (!user) {
    throw createAuthError("auth/unknown", "Supabase did not return a user for this sign-in.");
  }

  currentUser = user;
  return { user };
}

export async function signOut(authInstance: Auth): Promise<void> {
  void authInstance;
  await auth.signOut();
}

export function onAuthStateChanged(
  _auth: Auth,
  callback: (user: User | null) => void,
): () => void {
  return auth.onAuthStateChanged(callback);
}

export const EmailAuthProvider = {
  credential(email: string, pass: string) {
    return { email, pass };
  },
};

export async function reauthenticateWithCredential(
  _user: User,
  credential: { email: string; pass: string },
): Promise<{ user: User }> {
  return signInWithEmailAndPassword(auth, credential.email, credential.pass);
}

export async function updateEmail(_user: User, newEmail: string): Promise<void> {
  const { data, error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    throw normalizeAuthError(error);
  }

  currentUser = normalizeUser(data.user) ?? currentUser;
}

export async function updatePassword(_user: User, newPassword: string): Promise<void> {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw normalizeAuthError(error);
  }

  currentUser = normalizeUser(data.user) ?? currentUser;
}
