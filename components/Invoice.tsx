"use client";

import { useLocale } from "@/components/LocaleProvider";
import { stationConfig } from "@/config/station";
import { Button } from "@/components/ui/button";

export interface InvoiceData {
  id: string;
  customerName: string;
  amount: number;
  fuelType: "gasoil" | "unleaded";
  date: Date;
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function Invoice({
  data,
  onNewInvoice,
}: {
  data: InvoiceData;
  onNewInvoice: () => void;
}) {
  const { t, locale } = useLocale();

  const totalHT = data.amount;
  const tvaAmount = totalHT * 0.2;
  const totalTTC = totalHT + tvaAmount;
  const fuelLabel = data.fuelType === "gasoil" ? t("gasoil") : t("unleaded");

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Action Buttons — hidden in print */}
      <div className="print:hidden flex items-center gap-3 mb-6 justify-end">
        <Button
          variant="outline"
          onClick={onNewInvoice}
          className="border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white"
          id="new-invoice-button"
        >
          {t("newInvoice")}
        </Button>
        <Button
          onClick={() => window.print()}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25"
          id="print-invoice-button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 me-2"
            aria-hidden="true"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          {t("printInvoice")}
        </Button>
      </div>

      {/* Printable Invoice */}
      <article
        id="printable-invoice"
        className="mx-auto w-full max-w-[210mm] bg-white text-slate-900 rounded-xl shadow-2xl shadow-black/20 print:shadow-none print:rounded-none overflow-hidden"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header Band */}
        <header className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6 print:from-slate-900 print:to-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {stationConfig.name}
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {stationConfig.address}
              </p>
              <p className="mt-0.5 text-sm text-slate-300">
                {t("phone")}: {stationConfig.phone}
              </p>
            </div>
            <div className="text-end">
              <span className="inline-block rounded-md bg-emerald-500 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                {t("invoiceTitle")}
              </span>
            </div>
          </div>
        </header>

        {/* Meta Row */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 px-8 py-4 text-sm">
          <div className="space-y-1">
            <p>
              <span className="font-semibold text-slate-600">
                {t("ice")}:
              </span>{" "}
              {stationConfig.ice}
            </p>
            <p>
              <span className="font-semibold text-slate-600">
                {t("rc")}:
              </span>{" "}
              {stationConfig.rc}
            </p>
          </div>
          <div className="space-y-1 text-end">
            <p>
              <span className="font-semibold text-slate-600">
                {t("identifiantFiscal")}:
              </span>{" "}
              {stationConfig.identifiantFiscal}
            </p>
            <p>
              <span className="font-semibold text-slate-600">
                {t("patente")}:
              </span>{" "}
              {stationConfig.patente}
            </p>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 px-8 py-4">
          <div className="space-y-1 text-sm">
            <p className="font-bold text-slate-800">
              {t("invoiceNumber")}:
              <span className="ms-1 font-mono text-emerald-700">
                {data.id}
              </span>
            </p>
            <p className="text-slate-600">
              {t("date")}: {formatDate(data.date, locale)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-end">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              {t("clientLabel")}
            </p>
            <p className="mt-1 text-base font-bold text-slate-800">
              {data.customerName}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="pb-3 text-start font-semibold text-slate-600 uppercase tracking-wider text-xs">
                  {t("descriptionLabel")}
                </th>
                <th className="pb-3 text-center font-semibold text-slate-600 uppercase tracking-wider text-xs">
                  {t("quantityLabel")}
                </th>
                <th className="pb-3 text-end font-semibold text-slate-600 uppercase tracking-wider text-xs">
                  {t("unitPriceLabel")}
                </th>
                <th className="pb-3 text-end font-semibold text-slate-600 uppercase tracking-wider text-xs">
                  {t("totalLabel")}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 text-start font-medium text-slate-800">
                  {t("fuelPurchase")} — {fuelLabel}
                </td>
                <td className="py-4 text-center text-slate-600">1</td>
                <td className="py-4 text-end font-mono text-slate-700">
                  {formatCurrency(totalHT)}
                </td>
                <td className="py-4 text-end font-mono font-semibold text-slate-800">
                  {formatCurrency(totalHT)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-slate-200 px-8 py-5">
          <div className="ms-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t("totalHT")}</span>
              <span className="font-mono">{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t("tva")}</span>
              <span className="font-mono">{formatCurrency(tvaAmount)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-slate-800 pt-2 text-base font-bold text-slate-900">
              <span>{t("totalTTC")}</span>
              <span className="font-mono">
                {formatCurrency(totalTTC)} {t("mad")}
              </span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border-t border-slate-200 px-8 py-4">
          <p className="text-xs italic text-slate-500">
            {t("amountInWords")}{" "}
            <span className="font-semibold text-slate-700">
              {formatCurrency(totalTTC)} {t("mad")}
            </span>
          </p>
        </div>

        {/* Signature */}
        <div className="border-t border-slate-200 px-8 py-8">
          <div className="flex justify-end">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t("signature")}
              </p>
              <div className="mt-2 h-20 w-48 rounded-lg border-2 border-dashed border-slate-300" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-slate-50 px-8 py-3 text-center">
          <p className="text-[11px] text-slate-400">{t("thankYou")}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {stationConfig.address} • {t("phone")}: {stationConfig.phone}
          </p>
        </footer>
      </article>
    </section>
  );
}
