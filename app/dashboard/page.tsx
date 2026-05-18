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

function generateInvoiceId(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomPart = String(Math.floor(1000 + Math.random() * 9000));
  return `FAC-${datePart}-${randomPart}`;
}

export default function DashboardPage() {
  const { t } = useLocale();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [fuelType, setFuelType] = useState<"gasoil" | "unleaded">("gasoil");

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const parsedAmount = parseFloat(amount);
      if (!customerName.trim() || isNaN(parsedAmount) || parsedAmount <= 0)
        return;

      setInvoiceData({
        id: generateInvoiceId(),
        customerName: customerName.trim(),
        amount: parsedAmount,
        fuelType,
        date: new Date(),
      });
    },
    [customerName, amount, fuelType]
  );

  const handleNewInvoice = useCallback(() => {
    setInvoiceData(null);
    setCustomerName("");
    setAmount("");
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
            <div className="space-y-2">
              <Label htmlFor="customer-name" className="text-slate-300 text-sm">
                {t("customerName")}
              </Label>
              <Input
                id="customer-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t("customerNamePlaceholder")}
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-slate-300 text-sm">
                {t("amount")}
              </Label>
              <Input
                id="amount"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("amountPlaceholder")}
                className="border-white/15 bg-white/5 text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all font-mono"
              />
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
