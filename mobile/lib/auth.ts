import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// ─── Types ───────────────────────────────────────────────────
export interface UserData {
  id: string;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
  displayName: string;
  createdAt: string;
}

export interface SessionData {
  username: string;
  role: "admin" | "user";
  displayName: string;
}

const SESSION_KEY = "invoice_session";

// ─── Password Hashing ───────────────────────────────────────
// Use a simple hash approach compatible with React Native
async function hashPassword(password: string): Promise<string> {
  // Use the same SHA-256 approach — available in RN via crypto.subtle (Hermes)
  // Fallback: simple deterministic hash for environments without crypto.subtle
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback: simple hash (djb2 + hex padding for compatibility)
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash + password.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash).toString(16).padStart(64, "0");
}

// ─── Seed Admin ─────────────────────────────────────────────
export async function seedAdminUser(): Promise<void> {
  if (!db) return;
  try {
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const snap = await getDocs(q);
    if (snap.empty) {
      const hash = await hashPassword("password");
      await addDoc(collection(db, "users"), {
        username: "admin",
        passwordHash: hash,
        role: "admin",
        displayName: "Administrateur",
        createdAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.error("Error seeding admin:", e);
  }
}

// ─── Login ──────────────────────────────────────────────────
export async function loginClient(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "no_db" };
  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", username.trim().toLowerCase())
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { success: false, error: "invalid_credentials" };
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    const hash = await hashPassword(password);

    if (userData.passwordHash !== hash) {
      return { success: false, error: "invalid_credentials" };
    }

    const session: SessionData = {
      username: userData.username,
      role: userData.role,
      displayName: userData.displayName,
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true };
  } catch (e) {
    console.error("Login error:", e);
    return { success: false, error: "server_error" };
  }
}

// ─── Session ────────────────────────────────────────────────
export async function getSessionClient(): Promise<SessionData | null> {
  try {
    const stored = await AsyncStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored) as SessionData;
    }
  } catch (e) {}
  return null;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSessionClient();
  return session?.role === "admin";
}

export async function logoutClient(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// ─── Password Change ────────────────────────────────────────
export async function changePassword(
  username: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "no_db" };
  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", username)
    );
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: "user_not_found" };

    const userDoc = snap.docs[0];
    const userData = userDoc.data();
    const currentHash = await hashPassword(currentPassword);

    if (userData.passwordHash !== currentHash) {
      return { success: false, error: "wrong_current_password" };
    }

    const newHash = await hashPassword(newPassword);
    await updateDoc(doc(db, "users", userDoc.id), {
      passwordHash: newHash,
    });

    return { success: true };
  } catch (e) {
    console.error("Change password error:", e);
    return { success: false, error: "server_error" };
  }
}

// ─── User Management (Admin only) ──────────────────────────
export async function fetchUsers(): Promise<UserData[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, "users"));
    const users: UserData[] = [];
    snap.forEach((d) => {
      users.push({ id: d.id, ...d.data() } as UserData);
    });
    users.sort((a, b) => a.username.localeCompare(b.username));
    return users;
  } catch (e) {
    console.error("Error fetching users:", e);
    return [];
  }
}

export async function createUser(
  username: string,
  password: string,
  displayName: string,
  role: "admin" | "user"
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "no_db" };
  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", username.trim().toLowerCase())
    );
    const existing = await getDocs(q);
    if (!existing.empty) {
      return { success: false, error: "username_exists" };
    }

    const hash = await hashPassword(password);
    await addDoc(collection(db, "users"), {
      username: username.trim().toLowerCase(),
      passwordHash: hash,
      role,
      displayName: displayName.trim(),
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (e) {
    console.error("Create user error:", e);
    return { success: false, error: "server_error" };
  }
}

export async function updateUser(
  userId: string,
  data: { displayName?: string; role?: "admin" | "user"; password?: string }
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "no_db" };
  try {
    const updateData: Record<string, string> = {};
    if (data.displayName) updateData.displayName = data.displayName.trim();
    if (data.role) updateData.role = data.role;
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    await updateDoc(doc(db, "users", userId), updateData);
    return { success: true };
  } catch (e) {
    console.error("Update user error:", e);
    return { success: false, error: "server_error" };
  }
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: "no_db" };
  try {
    await deleteDoc(doc(db, "users", userId));
    return { success: true };
  } catch (e) {
    console.error("Delete user error:", e);
    return { success: false, error: "server_error" };
  }
}
