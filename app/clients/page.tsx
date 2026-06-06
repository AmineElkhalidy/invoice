"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { getSessionClient } from "@/lib/auth";

interface ClientData { id: string; name: string; ice: string; }

// ── Client Avatar ─────────────────────────────────────────────────────────────
function ClientAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white shadow-md shadow-emerald-500/20">
      {initials}
    </div>
  );
}

export default function ClientsPage() {
  const { t } = useLocale();
  const session = getSessionClient();
  const admin = session?.role === "admin";

  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceCountsThisYear, setInvoiceCountsThisYear] = useState<Record<string, number>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ice, setIce] = useState("");
  const [search, setSearch] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  const fetchClients = useCallback(async () => {
    try {
      if (!db) { setLoading(false); return; }
      const snap = await getDocs(collection(db, "clients"));
      const list: ClientData[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as ClientData));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setClients(list);

      const year = new Date().getFullYear();
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`).toISOString();
      const invSnap = await getDocs(query(collection(db, "invoices"), where("createdAt", ">=", startOfYear)));
      const counts: Record<string, number> = {};
      invSnap.forEach((d) => {
        const data = d.data();
        if (data.customerName) { const key = (data.customerName as string).toLowerCase().trim(); counts[key] = (counts[key] || 0) + 1; }
      });
      setInvoiceCountsThisYear(counts);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const resetForm = () => { setEditingId(null); setName(""); setIce(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editingId) await updateDoc(doc(db, "clients", editingId), { name: name.trim(), ice: ice.trim() });
      else await addDoc(collection(db, "clients"), { name: name.trim(), ice: ice.trim() });
      resetForm(); fetchClients();
    } catch (e) { console.error(e); }
  };

  const handleEdit = (client: ClientData) => {
    setEditingId(client.id); setName(client.name); setIce(client.ice);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try { await deleteDoc(doc(db, "clients", id)); fetchClients(); } catch (e) { console.error(e); }
  };

  const filtered = clients.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="h-6 w-6 text-white" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t("manageClients")}</h1>
            <p className="text-sm text-slate-500">
              {loading ? "…" : clients.length} {t("clientsTitle").toLowerCase()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">

        {/* ── Left: Add / Edit Form ─────────────────────────────────── */}
        <div ref={formRef}>
          <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30 sticky top-6">
            <CardContent className="pt-6">
              {/* Card header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-lg shrink-0 ${editingId ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/20" : "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white" aria-hidden="true">
                    {editingId
                      ? <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>
                      : <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>
                    }
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{editingId ? t("updateClient") : t("addClient")}</h2>
                  {editingId && <p className="text-xs text-slate-500 mt-0.5">Editing: <span className="text-slate-400">{name}</span></p>}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="client-name-input" className="text-slate-300 text-sm">{t("customerName")}</Label>
                  <Input id="client-name-input" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder={t("customerNamePlaceholder")}
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client-ice-input" className="text-slate-300 text-sm">{t("clientIce")}</Label>
                  <Input id="client-ice-input" type="text" value={ice} onChange={(e) => setIce(e.target.value)}
                    placeholder={t("clientIcePlaceholder")}
                    className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-mono" />
                </div>
                <div className="flex gap-3 pt-2">
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}
                      id="cancel-edit-button"
                      className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white">
                      {t("cancel")}
                    </Button>
                  )}
                  <Button type="submit"
                    id="save-client-button"
                    className={`${editingId ? "flex-[2]" : "w-full"} bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all duration-200 active:scale-[0.98]`}>
                    {editingId ? t("updateClient") : t("addClient")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Client List ────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Header + search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t("filterByClient")}
                className="pl-9 border-white/15 bg-white/[0.04] text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                id="search-clients"
              />
            </div>
            {!loading && (
              <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-400 tabular-nums">
                {filtered.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
              <svg className="h-5 w-5 animate-spin text-emerald-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              <span className="text-sm">{t("loadingClients")}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 gap-3">
              <svg className="h-12 w-12 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="17" y1="11" x2="23" y2="11" />
              </svg>
              <p className="text-sm text-slate-600">{t("noClientsFound")}</p>
            </div>
          ) : (
            filtered.map((client) => {
              const count = invoiceCountsThisYear[client.name.toLowerCase().trim()] || 0;
              const isEditing = editingId === client.id;
              return (
                <div
                  key={client.id}
                  className={`group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                    isEditing
                      ? "border-amber-500/25 bg-amber-500/8"
                      : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <ClientAvatar name={client.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-200 truncate">{client.name}</p>
                    {client.ice && <p className="text-xs text-slate-500 font-mono mt-0.5">{t("ice")}: {client.ice}</p>}
                  </div>
                  {/* Yearly invoice count */}
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
                    <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">{count}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(client)}
                      id={`edit-client-${client.id}`}
                      className="h-8 w-8 p-0 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title={t("edit")}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
                      </svg>
                    </Button>
                    {admin && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(client.id)}
                        id={`delete-client-${client.id}`}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title={t("delete")}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
