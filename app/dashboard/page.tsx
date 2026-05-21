"use client";

import { useState, useCallback } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { Invoice, type InvoiceData } from "@/components/Invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { getSessionClient } from "@/lib/auth";

interface SavedClient {
  name: string;
  ice: string;
}

function getNextInvoiceIdForClient(clientName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const datePart = `${year}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  
  if (typeof window === "undefined") {
    const randomPart = String(Math.floor(1000 + Math.random() * 9000));
    return `FAC-${datePart}-${randomPart}`;
  }

  const normalizedName = clientName.trim().toLowerCase();
  const storageKey = `invoice_counts_${year}`;
  let counts: Record<string, number> = {};
  
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      counts = JSON.parse(stored);
    }
  } catch (e) {}

  const currentCount = counts[normalizedName] || 0;
  const nextCount = currentCount + 1;
  
  counts[normalizedName] = nextCount;
  window.localStorage.setItem(storageKey, JSON.stringify(counts));
  
  return `FAC-${datePart}-${String(nextCount).padStart(4, "0")}`;
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
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Load saved clients from Firebase on mount
  useEffect(() => {
    async function fetchClients() {
      if (!db) return;
      try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        const clientsList: SavedClient[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          clientsList.push({ name: data.name, ice: data.ice });
        });
        setSavedClients(clientsList);
      } catch (error) {
        console.error("Error fetching clients from Firebase:", error);
      }
    }
    fetchClients();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const parsedUnitPrice = parseFloat(unitPrice);
      const parsedQuantity = parseFloat(quantity);
      if (
        !customerName.trim() ||
        isNaN(parsedUnitPrice) ||
        parsedUnitPrice <= 0 ||
        isNaN(parsedQuantity) ||
        parsedQuantity <= 0
      )
        return;

      const newCustomerName = customerName.trim();
      const newClientIce = clientIce.trim();

      // Ensure db exists
      if (db) {
        // Save to known clients if not exists
        const existingClients = [...savedClients];
        const existingIndex = existingClients.findIndex(
          (c) => c.name.toLowerCase() === newCustomerName.toLowerCase()
        );
        
        const newClientData = { name: newCustomerName, ice: newClientIce };
        if (existingIndex >= 0) {
          existingClients[existingIndex] = newClientData;
          setSavedClients(existingClients);
        } else {
          existingClients.push(newClientData);
          setSavedClients(existingClients);
          
          addDoc(collection(db, "clients"), {
            name: newCustomerName,
            ice: newClientIce,
          }).catch((err) => console.error("Failed to add client to Firebase:", err));
        }
      }

      const invoiceId = getNextInvoiceIdForClient(newCustomerName);
      const totalHT = parsedUnitPrice * parsedQuantity;
      const totalTTC = totalHT + totalHT * 0.1;
      const now = new Date();

      const newInvoiceData: InvoiceData = {
        id: invoiceId,
        customerName: newCustomerName,
        clientIce: newClientIce,
        unitPrice: parsedUnitPrice,
        quantity: parsedQuantity,
        fuelType,
        date: now,
      };

      // Save invoice to Firestore for history
      if (db) {
        const session = getSessionClient();
        addDoc(collection(db, "invoices"), {
          invoiceId,
          customerName: newCustomerName,
          clientIce: newClientIce,
          unitPrice: parsedUnitPrice,
          quantity: parsedQuantity,
          fuelType,
          totalHT,
          totalTTC,
          date: now.toISOString(),
          createdBy: session?.username || "unknown",
          createdAt: now.toISOString(),
        }).catch((err) => console.error("Failed to save invoice:", err));
      }

      setInvoiceData(newInvoiceData);
    },
    [customerName, clientIce, unitPrice, quantity, fuelType, savedClients]
  );

  const handleNewInvoice = useCallback(() => {
    setInvoiceData(null);
    setCustomerName("");
    setClientIce("");
    setUnitPrice("");
    setQuantity("");
    setFuelType("gasoil");
  }, []);

  if (invoiceData) {
    return <Invoice data={invoiceData} onNewInvoice={handleNewInvoice} />;
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {t("dashboardTitle")}
          </h2>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Customer Name */}
            <div className="space-y-2 relative" ref={suggestionRef}>
              <Label htmlFor="customer-name" className="text-slate-300 text-sm">
                {t("customerName")}
              </Label>
              <Input
                id="customer-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setShowClientSuggestions(true);
                }}
                onFocus={() => setShowClientSuggestions(true)}
                placeholder={t("customerNamePlaceholder")}
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
                autoComplete="off"
              />
              {/* Client Suggestions Dropdown */}
              {showClientSuggestions && savedClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                  {savedClients
                    .filter((c) =>
                      c.name.toLowerCase().includes(customerName.toLowerCase())
                    )
                    .map((client, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 cursor-pointer hover:bg-white/10 text-slate-200 transition-colors border-b border-white/5 last:border-0 flex flex-col"
                        onClick={() => {
                          setCustomerName(client.name);
                          setClientIce(client.ice);
                          setShowClientSuggestions(false);
                        }}
                      >
                        <span className="font-medium">{client.name}</span>
                        {client.ice && (
                          <span className="text-xs text-slate-400">
                            {t("ice")}: {client.ice}
                          </span>
                        )}
                      </div>
                    ))}
                  {savedClients.filter((c) =>
                    c.name.toLowerCase().includes(customerName.toLowerCase())
                  ).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">
                      No matching clients found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Client ICE */}
            <div className="space-y-2">
              <Label htmlFor="client-ice" className="text-slate-300 text-sm">
                {t("clientIce")}
              </Label>
              <Input
                id="client-ice"
                type="text"
                value={clientIce}
                onChange={(e) => setClientIce(e.target.value)}
                placeholder={t("clientIcePlaceholder")}
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Unit Price and Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit-price" className="text-slate-300 text-sm">
                  {t("unitPriceInput")}
                </Label>
                <Input
                  id="unit-price"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder={t("unitPricePlaceholder")}
                  className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-slate-300 text-sm">
                  {t("quantityInput")}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={t("quantityPlaceholder")}
                  className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Fuel Type */}
            <div className="space-y-2">
              <Label htmlFor="fuel-type" className="text-slate-300 text-sm">
                {t("fuelType")}
              </Label>
              <Select
                value={fuelType}
                onValueChange={(val) =>
                  setFuelType(val as "gasoil" | "unleaded")
                }
              >
                <SelectTrigger
                  id="fuel-type"
                  className="border-white/15 bg-white/5 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800 text-white">
                  <SelectItem value="gasoil">{t("gasoil")}</SelectItem>
                  <SelectItem value="unleaded">{t("unleaded")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleNewInvoice}
                className="flex-1 border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                id="reset-form-button"
              >
                {t("resetForm")}
              </Button>
              <Button
                type="submit"
                className="flex-[2] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200"
                id="generate-invoice-button"
              >
                {t("generateInvoice")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
