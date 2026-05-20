"use client";

import { useState } from "react";
import { loginClient } from "@/lib/auth";
import { useLocale } from "@/components/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { t } = useLocale();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    // Simulate slight network delay for the animation effect
    setTimeout(() => {
      const result = loginClient(username, password);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "invalid_credentials");
        setIsPending(false);
      }
    }, 500);
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      {/* Language toggle in corner */}
      <div className="absolute top-4 end-4 z-10">
        <LanguageToggle />
      </div>

      <Card className="relative z-10 w-full max-w-md border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/40">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-white"
              aria-hidden="true"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h6" />
              <path d="M14 3h4a2 2 0 0 1 2 2v2" />
              <path d="M21 14v3a2 2 0 0 1-2 2h-4" />
              <path d="M10 21H5a2 2 0 0 1-2-2v-4" />
              <path d="M8 10h8v4H8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t("appTitle")}</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300 text-sm">
                {t("username")}
              </Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                autoComplete="username"
                placeholder="admin"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300 text-sm">
                {t("password")}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 animate-in fade-in slide-in-from-top-1 duration-300"
              >
                {t("loginError")}
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200 disabled:opacity-60"
              id="login-submit-button"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      fill="currentColor"
                      className="opacity-75"
                    />
                  </svg>
                  ...
                </span>
              ) : (
                t("loginButton")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
