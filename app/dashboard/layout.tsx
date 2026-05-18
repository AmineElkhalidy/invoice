import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuthenticated = await getSession();

  if (!isAuthenticated) {
    redirect("/login");
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
