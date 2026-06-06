"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Invoice, type InvoiceData } from "@/components/Invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { getSessionClient } from "@/lib/auth";
import { stationConfig } from "@/config/station";

interface SavedClient { name: string; ice: string; }

function getNextYearlyInvoiceId(): string {
  const now = new Date();
  const year = now.getFullYear();
  if (typeof window === "undefined") return `${Math.floor(1000 + Math.random() * 9000)}/${year}`;
  const key = `invoice_yearly_count_${year}`;
  let count = 0;
  try { const stored = window.localStorage.getItem(key); if (stored) count = parseInt(stored, 10) || 0; } catch {}
  const next = count + 1;
  try { window.localStorage.setItem(key, String(next)); } catch {}
  return `${String(next).padStart(4, "0")}/${year}`;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function DashboardPage() {
  const { t } = useLocale();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fuelType, setFuelType] = useState<"gasoil" | "unleaded">("gasoil");
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchClients() {
      if (!db) return;
      try {
        const snap = await getDocs(collection(db, "clients"));
        const list: SavedClient[] = [];
        snap.forEach((d) => list.push(d.data() as SavedClient));
        setSavedClients(list);
      } catch {}
    }
    fetchClients();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live calculation
  const price = parseFloat(unitPrice) || 0;
  const qty = parseFloat(quantity) || 0;
  const totalHT = price * qty;
  const totalTTC = totalHT * 1.1;
  const hasValidData = customerName.trim() && price > 0 && qty > 0;

  const filteredClients = savedClients.filter((c) =>
    c.name.toLowerCase().includes(customerName.toLowerCase())
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!hasValidData) return;
      const trimmedName = customerName.trim();
      const trimmedIce = clientIce.trim();
      if (db) {
        const existing = savedClients.findIndex((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (existing >= 0) {
          const updated = [...savedClients];
          updated[existing] = { name: trimmedName, ice: trimmedIce };
          setSavedClients(updated);
        } else {
          setSavedClients((prev) => [...prev, { name: trimmedName, ice: trimmedIce }]);
          addDoc(collection(db, "clients"), { name: trimmedName, ice: trimmedIce }).catch(console.error);
        }
      }
      const invoiceId = getNextYearlyInvoiceId();
      const now = new Date();
      const session = getSessionClient();
      if (db) {
        addDoc(collection(db, "invoices"), {
          invoiceId, customerName: trimmedName, clientIce: trimmedIce,
          unitPrice: price, quantity: qty, fuelType,
          totalHT, totalTTC, date: now.toISOString(),
          createdBy: session?.username || "unknown", createdAt: now.toISOString(),
        }).catch(console.error);
      }
      setInvoiceData({ id: invoiceId, customerName: trimmedName, clientIce: trimmedIce, unitPrice: price, quantity: qty, fuelType, date: now });
    },
    [customerName, clientIce, price, qty, fuelType, totalHT, totalTTC, savedClients, hasValidData]
  );

  const handleReset = useCallback(() => {
    setInvoiceData(null); setCustomerName(""); setClientIce(""); setUnitPrice(""); setQuantity(""); setFuelType("gasoil");
  }, []);

  if (invoiceData) return <Invoice data={invoiceData} onNewInvoice={handleReset} />;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-6 w-6 text-white" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t("dashboardTitle")}</h1>
            <p className="text-sm text-slate-500">{stationConfig.name}</p>
          </div>
        </div>

        {/* Live total pill */}
        {hasValidData && (
          <div className="animate-in fade-in duration-300 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">{t("totalTTC")}</p>
              <p className="text-lg font-bold text-emerald-400 font-mono leading-tight">
                {formatCurrency(totalTTC)} <span className="text-sm font-normal text-emerald-600">{t("mad")}</span>
              </p>
            </div>
            <div className="h-8 w-px bg-emerald-500/20" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">{t("totalHT")}</p>
              <p className="text-sm font-semibold text-emerald-500 font-mono">{formatCurrency(totalHT)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Form Card ────────────────────────────────────────────────── */}
      <Card className="mx-auto max-w-xl border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Customer Name with autocomplete */}
            <div className="space-y-2 relative" ref={suggestionRef}>
              <Label htmlFor="customer-name" className="text-slate-300 text-sm font-medium">
                {t("customerName")}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <Input
                  id="customer-name" type="text" required
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={t("customerNamePlaceholder")}
                  autoComplete="off"
                  className="pl-9 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              {/* Autocomplete dropdown */}
              {showSuggestions && filteredClients.length > 0 && (
                <div className="absolute z-20 w-full mt-1 overflow-hidden rounded-xl border border-white/10 bg-slate-800/95 shadow-2xl backdrop-blur-xl">
                  <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
                    {filteredClients.slice(0, 6).map((client, i) => (
                      <button
                        key={i} type="button"
                        className="w-full px-4 py-2.5 text-left hover:bg-white/10 transition-colors flex flex-col"
                        onClick={() => { setCustomerName(client.name); setClientIce(client.ice); setShowSuggestions(false); }}
                      >
                        <span className="text-sm font-medium text-slate-200">{client.name}</span>
                        {client.ice && <span className="text-xs text-slate-500 font-mono">{t("ice")}: {client.ice}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Client ICE */}
            <div className="space-y-2">
              <Label htmlFor="client-ice" className="text-slate-300 text-sm font-medium">{t("clientIce")}</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                </span>
                <Input
                  id="client-ice" type="text"
                  value={clientIce} onChange={(e) => setClientIce(e.target.value)}
                  placeholder={t("clientIcePlaceholder")}
                  className="pl-9 border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Price & Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-price" className="text-slate-300 text-sm font-medium">{t("unitPriceInput")}</Label>
                <div className="relative">
                  <Input
                    id="unit-price" type="number" required min="0.01" step="0.01"
                    value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder={t("unitPricePlaceholder")}
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-mono pr-14"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 font-semibold">MAD</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-slate-300 text-sm font-medium">{t("quantityInput")}</Label>
                <div className="relative">
                  <Input
                    id="quantity" type="number" required min="0.01" step="0.01"
                    value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    placeholder={t("quantityPlaceholder")}
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-mono pr-6"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 font-semibold">L</span>
                </div>
              </div>
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">{t("fuelType")}</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["gasoil", "unleaded"] as const).map((f) => (
                  <button
                    key={f} type="button"
                    onClick={() => setFuelType(f)}
                    className={`flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      fuelType === f
                        ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-400 shadow-sm shadow-emerald-500/10"
                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-300"
                    }`}
                    id={`fuel-${f}`}
                  >
                    <span className="text-base">{f === "gasoil" ? "⛽" : "🔵"}</span>
                    {f === "gasoil" ? t("gasoil") : t("unleaded")}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleReset}
                id="reset-form-button"
                className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white transition-all duration-200">
                {t("resetForm")}
              </Button>
              <Button
                type="submit"
                disabled={!hasValidData}
                id="generate-invoice-button"
                className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {t("generateInvoice")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
