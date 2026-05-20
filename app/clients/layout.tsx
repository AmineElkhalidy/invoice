"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionClient } from "@/lib/auth";
import { Header } from "@/components/Header";

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = getSessionClient();
    if (!auth) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Don't render children until we know they are authenticated to avoid hydration flicker
  if (isAuthenticated === null) {
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
