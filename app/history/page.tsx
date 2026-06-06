"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getSessionClient } from "@/lib/auth";

interface InvoiceRecord {
  id: string; invoiceId: string; customerName: string; clientIce: string;
  unitPrice: number; quantity: number; fuelType: string; totalHT: number;
  totalTTC: number; date: string; createdBy: string; createdAt: string;
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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = useMemo(() => invoices.filter((inv) => {
    const matchSearch = !search ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
      inv.createdBy.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (fuelFilter === "all" || inv.fuelType === fuelFilter);
  }), [invoices, search, fuelFilter]);

  const stats = useMemo(() => ({
    count: filtered.length,
    total: filtered.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0),
    gasoilCount: filtered.filter((i) => i.fuelType === "gasoil").length,
    unleadedCount: filtered.filter((i) => i.fuelType === "unleaded").length,
  }), [filtered]);

  const formatDate = (d: string) => {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      }).format(new Date(d));
    } catch { return d; }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try { await deleteDoc(doc(db, "invoices", id)); setInvoices((p) => p.filter((i) => i.id !== id)); }
    catch (e) { console.error(e); }
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg shadow-blue-500/25">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="h-6 w-6 text-white" aria-hidden="true">
            <path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t("invoiceHistory")}</h1>
          <p className="text-sm text-slate-500">{loading ? "…" : invoices.length} {t("totalInvoices").toLowerCase()}</p>
        </div>
      </div>

      {/* ── Stats Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t("totalInvoices"), value: stats.count.toString(), color: "text-white", bg: "from-blue-500/15 to-cyan-500/5", border: "border-blue-500/20" },
          { label: t("totalTTC"), value: `${formatCurrency(stats.total)} ${t("mad")}`, color: "text-emerald-400", bg: "from-emerald-500/15 to-teal-500/5", border: "border-emerald-500/20" },
          { label: t("gasoil"), value: stats.gasoilCount.toString(), color: "text-amber-400", bg: "from-amber-500/10 to-orange-500/5", border: "border-amber-500/20" },
          { label: t("unleaded"), value: stats.unleadedCount.toString(), color: "text-sky-400", bg: "from-sky-500/10 to-blue-500/5", border: "border-sky-500/20" },
        ].map((s) => (
          <Card key={s.label} className={`border bg-gradient-to-br ${s.bg} ${s.border} backdrop-blur-xl`}>
            <CardContent className="p-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1 truncate">{s.label}</p>
              <p className={`text-xl font-bold font-mono ${s.color} leading-tight truncate`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchInvoices")}
                className="pl-9 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                id="search-invoices"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "gasoil", "unleaded"] as const).map((f) => (
                <Button key={f} size="sm" id={`filter-${f}`}
                  onClick={() => setFuelFilter(f)}
                  className={fuelFilter === f
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg shadow-blue-500/20"
                    : "border-white/15 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"}
                  variant={fuelFilter === f ? "default" : "outline"}>
                  {f === "all" ? t("allInvoices") : f === "gasoil" ? t("gasoil") : t("unleaded")}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Invoice List ─────────────────────────────────────────────── */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <svg className="h-6 w-6 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <svg className="h-14 w-14 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p className="text-sm text-slate-600">{t("noInvoicesFound")}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((inv) => (
                <div key={inv.id} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025]">
                  {/* Type icon */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                    inv.fuelType === "gasoil"
                      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                      : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  {/* Main info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-200 truncate">{inv.customerName}</p>
                      <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${
                        inv.fuelType === "gasoil"
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          : "bg-sky-500/15 text-sky-400 border-sky-500/20"
                      }`}>
                        {inv.fuelType === "gasoil" ? t("gasoil") : t("unleaded")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">#{inv.invoiceId}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{formatDate(inv.date)} · {t("createdBy")}: <span className="text-slate-500">{inv.createdBy}</span></p>
                  </div>
                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(inv.totalTTC)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-600">{t("mad")}</p>
                  </div>
                  {/* Delete (admin) */}
                  {admin && (
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(inv.id)}
                      id={`delete-invoice-${inv.id}`}
                      className="h-8 w-8 p-0 shrink-0 text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
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
