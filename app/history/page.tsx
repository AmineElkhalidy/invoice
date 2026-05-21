"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getSessionClient, isAdmin } from "@/lib/auth";

interface InvoiceRecord {
  id: string;
  invoiceId: string;
  customerName: string;
  clientIce: string;
  unitPrice: number;
  quantity: number;
  fuelType: string;
  totalHT: number;
  totalTTC: number;
  date: string;
  createdBy: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { t, locale } = useLocale();
  const session = getSessionClient();
  const admin = session?.role === "admin";

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fuelFilter, setFuelFilter] = useState<"all" | "gasoil" | "unleaded">("all");

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "invoices"));
        const list: InvoiceRecord[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as InvoiceRecord));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setInvoices(list);
      } catch (e) {
        console.error("Error fetching invoices:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !search ||
        inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
        inv.createdBy.toLowerCase().includes(search.toLowerCase());
      const matchFuel = fuelFilter === "all" || inv.fuelType === fuelFilter;
      return matchSearch && matchFuel;
    });
  }, [invoices, search, fuelFilter]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    return { count: filtered.length, total };
  }, [filtered]);

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteDoc(doc(db, "invoices", id));
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (e) {
      console.error("Error deleting invoice:", e);
    }
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg shadow-blue-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-white" aria-hidden="true">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">{t("invoiceHistory")}</h2>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{t("totalInvoices")}</p>
            <p className="text-2xl font-bold text-white mt-1 font-mono">{stats.count}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-slate-400 uppercase tracking-wider">{t("totalTTC")}</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{formatCurrency(stats.total)} <span className="text-sm">{t("mad")}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchInvoices")}
              className="flex-1 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              id="search-invoices"
            />
            <div className="flex gap-2">
              {(["all", "gasoil", "unleaded"] as const).map((f) => (
                <Button
                  key={f}
                  variant={fuelFilter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFuelFilter(f)}
                  className={fuelFilter === f
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
                    : "border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"}
                  id={`filter-${f}`}
                >
                  {f === "all" ? t("allInvoices") : f === "gasoil" ? t("gasoil") : t("unleaded")}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="h-6 w-6 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 text-slate-500" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">{t("noInvoicesFound")}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((inv) => (
                <div key={inv.id} className="group flex items-center gap-4 px-5 py-4 transition-all hover:bg-white/[0.03]">
                  {/* Invoice icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${inv.fuelType === "gasoil" ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-200 truncate">{inv.customerName}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${inv.fuelType === "gasoil" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-sky-500/15 text-sky-400 border border-sky-500/20"}`}>
                        {inv.fuelType === "gasoil" ? t("gasoil") : t("unleaded")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{inv.invoiceId}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDate(inv.date)} · {t("createdBy")}: {inv.createdBy}</p>
                  </div>
                  {/* Amount */}
                  <div className="text-end shrink-0">
                    <p className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(inv.totalTTC)}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{t("mad")}</p>
                  </div>
                  {/* Delete (admin only) */}
                  {admin && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(inv.id)} className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" id={`delete-invoice-${inv.id}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
