"use client";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "password";
const SESSION_KEY = "invoice_session";

export function loginClient(username: string, password: string): { success: boolean; error?: string } {
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_KEY, "authenticated");
    }
    return { success: true };
  }
  return { success: false, error: "invalid_credentials" };
}

export function logoutClient(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function getSessionClient(): boolean {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(SESSION_KEY) === "authenticated";
  }
  return false;
}
