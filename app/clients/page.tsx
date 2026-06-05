"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { getSessionClient } from "@/lib/auth";

interface ClientData {
  id: string;
  name: string;
  ice: string;
}

export default function ClientsPage() {
  const { t } = useLocale();
  const session = getSessionClient();
  const admin = session?.role === "admin";
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceCountsThisYear, setInvoiceCountsThisYear] = useState<Record<string, number>>({});

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ice, setIce] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      if (!db) {
        setLoading(false);
        return;
      }

      // Fetch clients
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientsList: ClientData[] = [];
      querySnapshot.forEach((docSnap) => {
        clientsList.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as ClientData);
      });
      clientsList.sort((a, b) => a.name.localeCompare(b.name));
      setClients(clientsList);

      // Fetch invoices for current year and count per client
      const year = new Date().getFullYear();
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`).toISOString();
      const invoicesSnap = await getDocs(
        query(collection(db, "invoices"), where("createdAt", ">=", startOfYear))
      );
      const counts: Record<string, number> = {};
      invoicesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.customerName) {
          const key = (data.customerName as string).toLowerCase().trim();
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      setInvoiceCountsThisYear(counts);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setIce("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        const clientRef = doc(db, "clients", editingId);
        await updateDoc(clientRef, {
          name: name.trim(),
          ice: ice.trim(),
        });
      } else {
        await addDoc(collection(db, "clients"), {
          name: name.trim(),
          ice: ice.trim(),
        });
      }

      resetForm();
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  const handleEdit = (client: ClientData) => {
    setEditingId(client.id);
    setName(client.name);
    setIce(client.ice);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Add / Edit Client Card ── */}
      <Card className="mx-auto max-w-lg border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white"
              aria-hidden="true"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t("manageClients")}
          </h2>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client-name-input" className="text-slate-300 text-sm">
                {t("customerName")}
              </Label>
              <Input
                id="client-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("customerNamePlaceholder")}
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Client ICE */}
            <div className="space-y-2">
              <Label htmlFor="client-ice-input" className="text-slate-300 text-sm">
                {t("clientIce")}
              </Label>
              <Input
                id="client-ice-input"
                type="text"
                value={ice}
                onChange={(e) => setIce(e.target.value)}
                placeholder={t("clientIcePlaceholder")}
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                  id="cancel-edit-button"
                >
                  {t("cancel")}
                </Button>
              )}
              <Button
                type="submit"
                className={`${editingId ? "flex-[2]" : "w-full"} bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200`}
                id="save-client-button"
              >
                {editingId ? t("updateClient") : t("addClient")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Client List ── */}
      <Card className="mx-auto max-w-lg border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30 mt-6">
        <CardHeader className="pb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            {t("clientsTitle")}
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg
                className="h-5 w-5 animate-spin text-emerald-400"
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
              <span className="ms-3 text-sm text-slate-400">
                {t("loadingClients")}
              </span>
            </div>
          ) : clients.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
              </div>
              <p className="text-sm text-slate-500">{t("noClientsFound")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => {
                const count = invoiceCountsThisYear[client.name.toLowerCase().trim()] || 0;
                return (
                  <div
                    key={client.id}
                    className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 transition-all hover:bg-white/5 hover:border-white/10"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {client.name}
                      </p>
                      {client.ice && (
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {t("ice")}: {client.ice}
                        </p>
                      )}
                    </div>
                    {/* Yearly invoice count badge */}
                    <div className="mx-3 flex-shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-emerald-400" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      <span className="text-xs font-semibold text-emerald-400 tabular-nums">{count}</span>
                      <span className="text-xs text-emerald-500/70">{t("invoiceCount")}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(client)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                        id={`edit-client-${client.id}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                        <span className="sr-only">{t("edit")}</span>
                      </Button>
                      {admin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(client.id)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                          id={`delete-client-${client.id}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                          <span className="sr-only">{t("delete")}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
