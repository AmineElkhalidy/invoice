import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Platform, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { useLocale } from "../../context/LocaleProvider";
import { stationConfig } from "../../config/station";
import { s, vs, ms } from "../../lib/responsive";

const signatureAsset = require("../../assets/signature.png");

async function getSignatureBase64(): Promise<string | null> {
  try {
    // In production EAS builds, Asset.loadAsync may leave localUri null
    // because assets remain inside the bundle. We must call downloadAsync()
    // to force extraction to a writable local file:// path first.
    const asset = Asset.fromModule(signatureAsset);
    await asset.downloadAsync();
    const localUri = asset.localUri;
    if (!localUri) {
      console.warn("Signature asset localUri is null after downloadAsync");
      return null;
    }
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch (e) {
    console.error("Failed to load signature for PDF:", e);
    return null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function generateInvoiceHTML(data: any, t: any, locale: string, signatureBase64?: string | null) {
  const totalHT = data.unitPrice * data.quantity;
  const tvaAmount = totalHT * 0.1;
  const totalTTC = totalHT + tvaAmount;
  const fuelLabel = data.fuelType === "gasoil" ? t("gasoil") : t("unleaded");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; background: #fff; }
    .header { background: linear-gradient(135deg, #1e293b, #334155); color: #fff; padding: 24px; }
    .header h2 { font-size: 18px; font-weight: 700; }
    .header p { font-size: 12px; color: #cbd5e1; margin-top: 4px; }
    .badge { display: inline-block; background: #10b981; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; float: right; margin-top: -30px; }
    .meta { display: flex; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    .meta .col { }
    .meta .col p { margin: 3px 0; }
    .meta .col span { font-weight: 600; color: #64748b; }
    .invoice-info { display: flex; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; }
    .invoice-info .left p { font-size: 12px; }
    .invoice-info .left .num { font-family: monospace; color: #059669; font-weight: 700; }
    .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: right; }
    .client-box .lbl { font-size: 10px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; }
    .client-box .name { font-size: 15px; font-weight: 700; margin-top: 4px; }
    .client-box .ice { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 24px; font-size: 13px; }
    table { width: calc(100% - 48px); margin: 20px 24px; }
    th { border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px 0; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    th:nth-child(2), th:nth-child(3) { text-align: center; }
    th:last-child { text-align: right; }
    td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
    td:nth-child(2), td:nth-child(3) { text-align: center; }
    td:last-child { text-align: right; font-weight: 600; font-family: monospace; }
    .totals { padding: 16px 24px; border-top: 1px solid #e2e8f0; }
    .totals .row { display: flex; justify-content: space-between; max-width: 280px; margin-left: auto; padding: 4px 0; font-size: 13px; color: #64748b; }
    .totals .row span:last-child { font-family: monospace; }
    .totals .total-row { border-top: 2px solid #1e293b; padding-top: 8px; margin-top: 4px; font-size: 15px; font-weight: 700; color: #0f172a; }
    .words { padding: 12px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; font-style: italic; }
    .words span { font-weight: 600; color: #475569; }
    .signature-section { padding: 24px 24px 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; }
    .signature-box { text-align: center; }
    .signature-box .sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; margin-bottom: 8px; }
    .signature-box img { max-height: 100px; max-width: 220px; object-fit: contain; mix-blend-mode: multiply; }
    .footer { background: #f8fafc; padding: 12px 24px; text-align: center; font-size: 10px; color: #94a3b8; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${stationConfig.name}</h2>
    <p>${stationConfig.address}</p>
    <p>${t("phone")}: ${stationConfig.phone}</p>
    <div class="badge">${t("invoiceTitle")}</div>
  </div>
  <div class="meta">
    <div class="col">
      <p><span>${t("ice")}:</span> ${stationConfig.ice}</p>
      <p><span>${t("rc")}:</span> ${stationConfig.rc}</p>
    </div>
    <div class="col" style="text-align:right">
      <p><span>${t("identifiantFiscal")}:</span> ${stationConfig.identifiantFiscal}</p>
      <p><span>${t("patente")}:</span> ${stationConfig.patente}</p>
    </div>
  </div>
  <div class="invoice-info">
    <div class="left">
      <p><strong>${t("invoiceNumber")}:</strong> <span class="num">${data.id}</span></p>
      <p style="color:#64748b;font-size:12px">${t("date")}: ${formatDate(data.date, locale)}</p>
    </div>
    <div class="client-box">
      <p class="lbl">${t("clientLabel")}</p>
      <p class="name">${data.customerName}</p>
      ${data.clientIce ? `<p class="ice"><strong>${t("ice")}:</strong> ${data.clientIce}</p>` : ""}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>${t("descriptionLabel")}</th>
        <th>${t("quantityLabel")}</th>
        <th>${t("unitPriceLabel")}</th>
        <th>${t("totalLabel")}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${t("fuelPurchase")} — ${fuelLabel}</td>
        <td>${data.quantity}</td>
        <td style="font-family:monospace">${formatCurrency(data.unitPrice)}</td>
        <td>${formatCurrency(totalHT)}</td>
      </tr>
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>${t("totalHT")}</span><span>${formatCurrency(totalHT)}</span></div>
    <div class="row"><span>${t("tva")}</span><span>${formatCurrency(tvaAmount)}</span></div>
    <div class="row total-row"><span>${t("totalTTC")}</span><span>${formatCurrency(totalTTC)} ${t("mad")}</span></div>
  </div>
  <div class="words">${t("amountInWords")} <span>${formatCurrency(totalTTC)} ${t("mad")}</span></div>
  ${signatureBase64 ? `
  <div class="signature-section">
    <div class="signature-box">
      <p class="sig-label">${t("signature")}</p>
      <img src="${signatureBase64}" alt="Signature & Cachet" />
    </div>
  </div>` : ""}
  <div class="footer">
    <p>${t("thankYou")}</p>
    <p style="margin-top:4px">${stationConfig.address} • ${t("phone")}: ${stationConfig.phone}</p>
  </div>
</body>
</html>`;
}

export default function InvoiceScreen() {
  const params = useLocalSearchParams<{
    id: string;
    customerName: string;
    clientIce: string;
    unitPrice: string;
    quantity: string;
    fuelType: string;
    date: string;
    invoiceNumber: string;
  }>();
  const { t, locale } = useLocale();
  const router = useRouter();

  const data = {
    id: params.id,
    customerName: params.customerName,
    clientIce: params.clientIce,
    unitPrice: parseFloat(params.unitPrice || "0"),
    quantity: parseFloat(params.quantity || "0"),
    fuelType: params.fuelType || "gasoil",
    date: params.date || new Date().toISOString(),
  };

  const invoiceNumber = params.invoiceNumber || "1";

  const totalHT = data.unitPrice * data.quantity;
  const tvaAmount = totalHT * 0.1;
  const totalTTC = totalHT + tvaAmount;
  const fuelLabel = data.fuelType === "gasoil" ? t("gasoil") : t("unleaded");

  const handleSavePDF = async () => {
    try {
      const signatureBase64 = await getSignatureBase64();
      const html = generateInvoiceHTML(data, t, locale, signatureBase64);
      const { uri } = await Print.printToFileAsync({ html });

      // Rename to: Station BENKHALED - Client Name - Facture N°X.pdf
      const pdfFileName = `${stationConfig.name} - ${data.customerName} - Facture N°${invoiceNumber}.pdf`;
      const source = new File(uri);
      const dest = new File(Paths.cache, pdfFileName);
      source.move(dest);

      await Sharing.shareAsync(dest.uri, { mimeType: "application/pdf" });
    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF");
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Invoice Preview Card */}
        <View style={styles.invoiceCard}>
          {/* Header */}
          <LinearGradient
            colors={["#1e293b", "#334155"]}
            style={styles.invoiceHeader}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.invoiceHeaderTitle}>{stationConfig.name}</Text>
              <Text style={styles.invoiceHeaderSub}>{stationConfig.address}</Text>
              <Text style={styles.invoiceHeaderSub}>
                {t("phone")}: {stationConfig.phone}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{t("invoiceTitle")}</Text>
            </View>
          </LinearGradient>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>{t("ice")}:</Text> {stationConfig.ice}
              </Text>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>{t("rc")}:</Text> {stationConfig.rc}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", flex: 1 }}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>{t("identifiantFiscal")}:</Text>{" "}
                {stationConfig.identifiantFiscal}
              </Text>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>{t("patente")}:</Text>{" "}
                {stationConfig.patente}
              </Text>
            </View>
          </View>

          {/* Invoice info + Client */}
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>
                {t("invoiceNumber")}:{" "}
                <Text style={styles.invoiceId}>{data.id}</Text>
              </Text>
              <Text style={styles.infoDate}>
                {t("date")}: {formatDate(data.date, locale)}
              </Text>
            </View>
            <View style={styles.clientBox}>
              <Text style={styles.clientLabel}>{t("clientLabel")}</Text>
              <Text style={styles.clientName}>{data.customerName}</Text>
              {data.clientIce ? (
                <Text style={styles.clientIce}>
                  {t("ice")}: {data.clientIce}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.th, { flex: 3, textAlign: "left" }]}>
                {t("descriptionLabel")}
              </Text>
              <Text style={[styles.th, { flex: 1, textAlign: "center" }]}>
                {t("quantityLabel")}
              </Text>
              <Text style={[styles.th, { flex: 1.5, textAlign: "right" }]}>
                {t("unitPriceLabel")}
              </Text>
              <Text style={[styles.th, { flex: 1.5, textAlign: "right" }]}>
                {t("totalLabel")}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.td, { flex: 3 }]}>
                {t("fuelPurchase")} — {fuelLabel}
              </Text>
              <Text style={[styles.td, { flex: 1, textAlign: "center" }]}>
                {data.quantity}
              </Text>
              <Text style={[styles.td, styles.mono, { flex: 1.5, textAlign: "right" }]}>
                {formatCurrency(data.unitPrice)}
              </Text>
              <Text
                style={[styles.td, styles.mono, { flex: 1.5, textAlign: "right", fontWeight: "700" }]}
              >
                {formatCurrency(totalHT)}
              </Text>
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("totalHT")}</Text>
              <Text style={[styles.totalValue, styles.mono]}>{formatCurrency(totalHT)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("tva")}</Text>
              <Text style={[styles.totalValue, styles.mono]}>{formatCurrency(tvaAmount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>{t("totalTTC")}</Text>
              <Text style={[styles.grandTotalValue, styles.mono]}>
                {formatCurrency(totalTTC)} {t("mad")}
              </Text>
            </View>
          </View>

          {/* Signature & Cachet */}
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>{t("signature")}</Text>
              <Image
                source={signatureAsset}
                style={styles.signatureImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.invoiceFooter}>
            <Text style={styles.footerText}>{t("thankYou")}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.secondaryBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>{t("newInvoice")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSavePDF} activeOpacity={0.8} style={{ flex: 2 }}>
            <LinearGradient
              colors={["#10b981", "#14b8a6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>{t("printInvoice")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },
  content: { padding: s(16), paddingBottom: vs(40) },
  invoiceCard: {
    backgroundColor: "#fff",
    borderRadius: s(12),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: vs(8) },
    shadowOpacity: 0.3,
    shadowRadius: s(20),
    elevation: 10,
  },
  invoiceHeader: { padding: s(20), flexDirection: "row", justifyContent: "space-between" },
  invoiceHeaderTitle: { color: "#fff", fontSize: ms(16), fontWeight: "800" },
  invoiceHeaderSub: { color: "#cbd5e1", fontSize: ms(11), marginTop: vs(2) },
  badge: {
    backgroundColor: "#10b981",
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(4),
    alignSelf: "flex-start",
  },
  badgeText: { color: "#fff", fontSize: ms(9), fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: s(14),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  metaLabel: { fontWeight: "600", color: "#64748b" },
  metaText: { fontSize: ms(11), color: "#334155", marginBottom: vs(2) },
  infoRow: {
    flexDirection: "row",
    padding: s(14),
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    gap: s(12),
  },
  infoLabel: { fontSize: ms(12), fontWeight: "700", color: "#1e293b" },
  invoiceId: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", color: "#059669" },
  infoDate: { fontSize: ms(11), color: "#64748b", marginTop: vs(4) },
  clientBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: s(8),
    padding: s(10),
    alignItems: "flex-end",
    flex: 1,
  },
  clientLabel: { fontSize: ms(9), textTransform: "uppercase", color: "#94a3b8", letterSpacing: 1 },
  clientName: { fontSize: ms(14), fontWeight: "800", color: "#1e293b", marginTop: vs(4) },
  clientIce: { fontSize: ms(11), color: "#64748b", marginTop: vs(2) },
  table: { padding: s(14) },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#e2e8f0", paddingBottom: vs(8) },
  th: { fontSize: ms(9), fontWeight: "700", textTransform: "uppercase", color: "#64748b", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  td: { fontSize: ms(12), color: "#334155" },
  mono: { fontVariant: ["tabular-nums"] },
  totals: { paddingHorizontal: s(14), paddingVertical: vs(10), borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: vs(4) },
  totalLabel: { fontSize: ms(12), color: "#64748b" },
  totalValue: { fontSize: ms(12), color: "#64748b" },
  grandTotal: { borderTopWidth: 2, borderTopColor: "#1e293b", paddingTop: vs(8), marginTop: vs(4) },
  grandTotalLabel: { fontSize: ms(14), fontWeight: "800", color: "#0f172a" },
  grandTotalValue: { fontSize: ms(14), fontWeight: "800", color: "#0f172a" },
  signatureSection: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: s(14),
    paddingTop: vs(16),
    paddingBottom: vs(8),
    alignItems: "flex-end",
  },
  signatureBox: { alignItems: "center" },
  signatureLabel: {
    fontSize: ms(9),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#94a3b8",
    marginBottom: vs(6),
  },
  signatureImage: {
    width: s(160),
    height: vs(72),
  },
  invoiceFooter: {
    backgroundColor: "#f8fafc",
    padding: s(12),
    alignItems: "center",
  },
  footerText: { fontSize: ms(10), color: "#94a3b8" },
  actions: { flexDirection: "row", gap: s(10), marginTop: vs(16) },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: "center",
  },
  secondaryBtnText: { color: "#fff", fontSize: ms(14), fontWeight: "600" },
  primaryBtn: {
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.25,
    shadowRadius: s(12),
    elevation: 6,
  },
  primaryBtnText: { color: "#fff", fontSize: ms(14), fontWeight: "700" },
});
