import { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocale } from "../../context/LocaleProvider";
import { logoutClient, getSessionClient } from "../../lib/auth";
import { stationConfig } from "../../config/station";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { s, vs, ms } from "../../lib/responsive";

interface SavedClient { name: string; ice: string; }

function formatCurrency(n: number) {
  return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export default function DashboardScreen() {
  const { t, toggleLocale } = useLocale();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fuelType, setFuelType] = useState<"gasoil" | "unleaded">("gasoil");
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const snap = await getDocs(collection(db, "clients"));
          const list: SavedClient[] = [];
          snap.forEach((d) => list.push(d.data() as SavedClient));
          setSavedClients(list);
        } catch (e) { console.error(e); }
      })();
    }, [])
  );

  const price = parseFloat(unitPrice) || 0;
  const qty = parseFloat(quantity) || 0;
  const totalHT = price * qty;
  const totalTTC = totalHT * 1.1;
  const hasValidData = customerName.trim() && price > 0 && qty > 0;

  const filteredClients = savedClients.filter((c) =>
    c.name.toLowerCase().includes(customerName.toLowerCase())
  );

  const handleGenerate = useCallback(async () => {
    if (!hasValidData) return;
    const trimmedName = customerName.trim();
    const trimmedIce = clientIce.trim();
    const exists = savedClients.find((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (!exists) addDoc(collection(db, "clients"), { name: trimmedName, ice: trimmedIce }).catch(console.error);

    const now = new Date();
    const year = now.getFullYear();
    const key = `invoice_yearly_count_${year}`;
    let count = 0;
    try { const stored = await AsyncStorage.getItem(key); if (stored) count = parseInt(stored, 10) || 0; } catch {}
    const next = count + 1;
    try { await AsyncStorage.setItem(key, String(next)); } catch {}
    const invoiceId = `${String(next).padStart(4, "0")}/${year}`;

    const session = await getSessionClient();
    addDoc(collection(db, "invoices"), {
      invoiceId, customerName: trimmedName, clientIce: trimmedIce,
      unitPrice: price, quantity: qty, fuelType, totalHT, totalTTC,
      date: now.toISOString(), createdBy: session?.username || "unknown", createdAt: now.toISOString(),
    }).catch(console.error);

    router.push({
      pathname: "/(app)/invoice",
      params: { id: invoiceId, customerName: trimmedName, clientIce: trimmedIce, unitPrice: String(price), quantity: String(qty), fuelType, date: now.toISOString(), invoiceNumber: String(next) },
    });
  }, [customerName, clientIce, price, qty, fuelType, totalHT, totalTTC, savedClients, hasValidData, router]);

  const handleLogout = async () => { await logoutClient(); router.replace("/login"); };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={["#34d399", "#14b8a6"]} style={styles.headerIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: ms(16) }}>⛽</Text>
            </LinearGradient>
            <View>
              <Text style={styles.headerTitle}>{stationConfig.name}</Text>
              <Text style={styles.headerSub}>{t("appTitle")}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleLocale} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>{t("switchLang")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={[styles.headerBtn, styles.headerBtnDanger]}>
              <Text style={[styles.headerBtnText, { color: "#f87171" }]}>{t("logout")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Live Total Banner ─────────────────────────────────────── */}
          {hasValidData && (
            <View style={styles.totalBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.totalBannerLabel}>{t("totalTTC")}</Text>
                <Text style={styles.totalBannerValue}>{formatCurrency(totalTTC)} <Text style={styles.totalBannerMad}>{t("mad")}</Text></Text>
              </View>
              <View style={styles.totalBannerDivider} />
              <View>
                <Text style={styles.totalBannerLabel}>{t("totalHT")}</Text>
                <Text style={styles.totalBannerHT}>{formatCurrency(totalHT)}</Text>
              </View>
            </View>
          )}

          {/* ── Form Card ─────────────────────────────────────────────── */}
          <View style={styles.card}>
            {/* Card Header */}
            <View style={styles.cardHeaderRow}>
              <LinearGradient colors={["#34d399", "#14b8a6"]} style={styles.cardIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={{ fontSize: ms(20) }}>📄</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t("dashboardTitle")}</Text>
                <Text style={styles.cardSubtitle}>{t("customerName")}</Text>
              </View>
            </View>

            {/* Customer Name */}
            <Text style={styles.label}>{t("customerName")}</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={(v) => { setCustomerName(v); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t("customerNamePlaceholder")}
              placeholderTextColor="#64748b"
            />
            {showSuggestions && filteredClients.length > 0 && (
              <View style={styles.suggestions}>
                {filteredClients.slice(0, 5).map((c, i) => (
                  <TouchableOpacity
                    key={i} style={[styles.suggestionItem, i > 0 && { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" }]}
                    onPress={() => { setCustomerName(c.name); setClientIce(c.ice); setShowSuggestions(false); }}
                  >
                    <Text style={styles.suggestionName}>{c.name}</Text>
                    {c.ice ? <Text style={styles.suggestionIce}>{t("ice")}: {c.ice}</Text> : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ICE */}
            <Text style={[styles.label, { marginTop: vs(16) }]}>{t("clientIce")}</Text>
            <TextInput
              style={[styles.input, { fontFamily: "monospace" }]}
              value={clientIce}
              onChangeText={setClientIce}
              placeholder={t("clientIcePlaceholder")}
              placeholderTextColor="#64748b"
            />

            {/* Price & Quantity in grid */}
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { marginTop: vs(16) }]}>{t("unitPriceInput")}</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
                    value={unitPrice} onChangeText={setUnitPrice}
                    placeholder="0.00" placeholderTextColor="#64748b"
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unitLabel}>MAD</Text>
                </View>
              </View>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { marginTop: vs(16) }]}>{t("quantityInput")}</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
                    value={quantity} onChangeText={setQuantity}
                    placeholder="0.00" placeholderTextColor="#64748b"
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unitLabel}>L</Text>
                </View>
              </View>
            </View>

            {/* Fuel Type */}
            <Text style={[styles.label, { marginTop: vs(16) }]}>{t("fuelType")}</Text>
            <View style={styles.fuelRow}>
              {(["gasoil", "unleaded"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.fuelBtn, fuelType === f && styles.fuelBtnActive]}
                  onPress={() => setFuelType(f)}
                >
                  <Text style={{ fontSize: ms(18), marginBottom: vs(2) }}>{f === "gasoil" ? "⛽" : "🔵"}</Text>
                  <Text style={[styles.fuelBtnText, fuelType === f && styles.fuelBtnTextActive]}>
                    {f === "gasoil" ? t("gasoil") : t("unleaded")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Generate Button */}
            <TouchableOpacity onPress={handleGenerate} activeOpacity={0.8} style={{ marginTop: vs(24) }} disabled={!hasValidData}>
              <LinearGradient
                colors={hasValidData ? ["#10b981", "#14b8a6"] : ["#334155", "#1e293b"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                <Text style={[styles.submitBtnText, !hasValidData && { opacity: 0.5 }]}>{t("generateInvoice")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },

  // Header
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: s(16), paddingVertical: vs(12),
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0f172a",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: s(10) },
  headerIcon: { width: s(36), height: s(36), borderRadius: s(10), justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: ms(13), fontWeight: "700" },
  headerSub: { color: "#64748b", fontSize: ms(10) },
  headerRight: { flexDirection: "row", gap: s(6) },
  headerBtn: { backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: s(10), paddingVertical: vs(6), borderRadius: s(8), borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  headerBtnDanger: { borderColor: "rgba(248,113,113,0.2)", backgroundColor: "rgba(248,113,113,0.06)" },
  headerBtnText: { color: "#94a3b8", fontSize: ms(11), fontWeight: "600" },

  content: { padding: s(16), paddingBottom: vs(50) },

  // Live total banner
  totalBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.25)",
    borderRadius: s(14), padding: s(14), marginBottom: vs(16),
  },
  totalBannerLabel: { color: "#6ee7b7", fontSize: ms(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  totalBannerValue: { color: "#34d399", fontSize: ms(20), fontWeight: "800" },
  totalBannerMad: { color: "#6ee7b7", fontSize: ms(12), fontWeight: "600" },
  totalBannerDivider: { width: 1, height: s(36), backgroundColor: "rgba(16,185,129,0.2)", marginHorizontal: s(14) },
  totalBannerHT: { color: "#10b981", fontSize: ms(14), fontWeight: "700" },

  // Card
  card: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: s(20), borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: s(20) },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: s(12), marginBottom: vs(20) },
  cardIcon: { width: s(44), height: s(44), borderRadius: s(12), justifyContent: "center", alignItems: "center", flexShrink: 0 },
  cardTitle: { color: "#fff", fontSize: ms(17), fontWeight: "800" },
  cardSubtitle: { color: "#64748b", fontSize: ms(11), marginTop: vs(2) },

  // Form
  label: { color: "#64748b", fontSize: ms(11), fontWeight: "700", marginBottom: vs(6), textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    borderRadius: s(10), paddingHorizontal: s(14), paddingVertical: vs(13), color: "#fff", fontSize: ms(15),
  },
  inputWithUnit: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    borderRadius: s(10), paddingHorizontal: s(14), paddingVertical: vs(2),
  },
  unitLabel: { color: "#475569", fontSize: ms(11), fontWeight: "700" },
  row: { flexDirection: "row", gap: s(12) },
  halfCol: { flex: 1 },

  // Autocomplete
  suggestions: { backgroundColor: "#1e293b", borderRadius: s(10), borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginTop: vs(4), overflow: "hidden" },
  suggestionItem: { paddingHorizontal: s(14), paddingVertical: vs(10) },
  suggestionName: { color: "#e2e8f0", fontSize: ms(14), fontWeight: "500" },
  suggestionIce: { color: "#64748b", fontSize: ms(11), marginTop: vs(2) },

  // Fuel picker
  fuelRow: { flexDirection: "row", gap: s(10) },
  fuelBtn: { flex: 1, paddingVertical: vs(14), borderRadius: s(12), borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.02)", alignItems: "center" },
  fuelBtnActive: { borderColor: "rgba(16,185,129,0.5)", backgroundColor: "rgba(16,185,129,0.12)" },
  fuelBtnText: { color: "#64748b", fontSize: ms(13), fontWeight: "700" },
  fuelBtnTextActive: { color: "#34d399" },

  // Submit
  submitBtn: { borderRadius: s(14), paddingVertical: vs(16), alignItems: "center", elevation: 6, shadowColor: "#10b981", shadowOffset: { width: 0, height: vs(4) }, shadowOpacity: 0.3, shadowRadius: s(12) },
  submitBtnText: { color: "#fff", fontSize: ms(16), fontWeight: "800", letterSpacing: 0.3 },
});
