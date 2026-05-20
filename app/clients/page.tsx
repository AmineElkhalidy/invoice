"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

interface ClientData {
  id: string;
  name: string;
  ice: string;
}

export default function ClientsPage() {
  const { t } = useLocale();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  
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
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientsList: ClientData[] = [];
      querySnapshot.forEach((doc) => {
        clientsList.push({ id: doc.id, ...doc.data() } as ClientData);
      });
      // Sort by name
      clientsList.sort((a, b) => a.name.localeCompare(b.name));
      setClients(clientsList);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        // Update
        const clientRef = doc(db, "clients", editingId);
        await updateDoc(clientRef, {
          name: name.trim(),
          ice: ice.trim(),
        });
      } else {
        // Create
        await addDoc(collection(db, "clients"), {
          name: name.trim(),
          ice: ice.trim(),
        });
      }
      
      // Reset form
      setName("");
      setIce("");
      setEditingId(null);
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client. Check Firebase configuration.");
    }
  };

  const handleEdit = (client: ClientData) => {
    setEditingId(client.id);
    setName(client.name);
    setIce(client.ice);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-6">
      <Card className="border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/30">
        <CardHeader className="pb-4 border-b border-white/5">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Manage Clients
          </h2>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-8 p-4 bg-slate-800/50 rounded-xl border border-white/5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300 text-sm">Client Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter client name"
                required
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ice" className="text-slate-300 text-sm">Client ICE</Label>
              <Input
                id="ice"
                value={ice}
                onChange={(e) => setIce(e.target.value)}
                placeholder="Enter ICE (optional)"
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                {editingId ? "Update Client" : "Add Client"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => { setEditingId(null); setName(""); setIce(""); }} className="border-white/20 text-slate-300 hover:text-white">
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading clients...</div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800/80 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">ICE</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        No clients found. Add one above.
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-200">{client.name}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono">{client.ice || "—"}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(client)} className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(client.id)} className="h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
