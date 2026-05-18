"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "password";
const SESSION_COOKIE = "invoice_session";

export async function login(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string } | null> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, "authenticated", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
    });
    redirect("/dashboard");
  }

  return { error: "invalid_credentials" };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function getSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === "authenticated";
}
