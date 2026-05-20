"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSessionClient } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = getSessionClient();
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return <div className="min-h-dvh bg-slate-950 flex items-center justify-center"></div>;
}
