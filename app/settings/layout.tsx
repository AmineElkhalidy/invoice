"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionClient, isAdmin } from "@/lib/auth";
import { Header } from "@/components/Header";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const s = getSessionClient();
    if (!s) {
      router.push("/login");
    } else if (s.role !== "admin") {
      router.push("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (authorized === null) {
    return <div className="min-h-dvh bg-slate-950 flex items-center justify-center"></div>;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
