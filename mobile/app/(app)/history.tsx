import { useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocale } from "../../context/LocaleProvider";
import { s, vs, ms } from "../../lib/responsive";
import { db } from "../../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getSessionClient } from "../../lib/auth";

interface InvoiceRecord {
  id: string; invoiceId: string; customerName: string; clientIce: string;
  unitPrice: number; quantity: number; fuelType: string; totalHT: number;
  totalTTC: number; date: string; createdBy: string; createdAt: string;
}

export default function HistoryScreen() {
  const { t, locale } = useLocale();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fuelFilter, setFuelFilter] = useState<"all" | "gasoil" | "unleaded">("all");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await getSessionClient();
      setIsAdmin(session?.role === "admin");
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
      inv.invoiceId.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (fuelFilter === "all" || inv.fuelType === fuelFilter);
  }), [invoices, search, fuelFilter]);

  const stats = useMemo(() => ({
    count: filtered.length,
    total: filtered.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0),
    gasoilCount: filtered.filter((i) => i.fuelType === "gasoil").length,
    unleadedCount: filtered.filter((i) => i.fuelType === "unleaded").length,
  }), [filtered]);

  const formatDate = (d: string) => {
    try { return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d)); }
    catch { return d; }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  const handleDelete = (id: string) => {
    Alert.alert("Confirmer", t("confirmDelete"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: async () => { try { await deleteDoc(doc(db, "invoices", id)); setInvoices((p) => p.filter((i) => i.id !== id)); } catch {} } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Page Header ────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <LinearGradient colors={["#3b82f6", "#06b6d4"]} style={styles.pageIcon}>
            <Text style={{ fontSize: ms(20) }}>📋</Text>
          </LinearGradient>
          <View>
            <Text style={styles.pageTitle}>{t("invoiceHistory")}</Text>
            <Text style={styles.pageSubtitle}>{loading ? "…" : invoices.length} {t("totalInvoices").toLowerCase()}</Text>
          </View>
        </View>

        {/* ── Stats ─────────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statLabel}>{t("totalInvoices")}</Text>
            <Text style={[styles.statValue, { color: "#93c5fd" }]}>{stats.count}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardGreen]}>
            <Text style={styles.statLabel}>{t("totalTTC")}</Text>
            <Text style={[styles.statValue, { color: "#34d399", fontSize: ms(16) }]} numberOfLines={1}>
              {formatCurrency(stats.total)}
              <Text style={{ fontSize: ms(10), color: "#6ee7b7" }}> {t("mad")}</Text>
            </Text>
          </View>
          <View style={[styles.statCard, styles.statCardAmber]}>
            <Text style={styles.statLabel}>{t("gasoil")}</Text>
            <Text style={[styles.statValue, { color: "#fbbf24" }]}>{stats.gasoilCount}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardSky]}>
            <Text style={styles.statLabel}>{t("unleaded")}</Text>
            <Text style={[styles.statValue, { color: "#38bdf8" }]}>{stats.unleadedCount}</Text>
          </View>
        </View>

        {/* ── Filters ───────────────────────────────────────────────── */}
        <View style={styles.filtersCard}>
          {/* Search */}
          <View style={styles.searchWrap}>
            <Text style={{ color: "#64748b", fontSize: ms(16), marginRight: s(8) }}>🔍</Text>
            <TextInput
              style={styles.searchInput} value={search} onChangeText={setSearch}
              placeholder={t("searchInvoices")} placeholderTextColor="#475569"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={{ color: "#64748b", fontSize: ms(16) }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {/* Fuel filter pills */}
          <View style={styles.filterBtns}>
            {(["all", "gasoil", "unleaded"] as const).map((f) => (
              <TouchableOpacity
                key={f} style={[styles.filterBtn, fuelFilter === f && styles.filterBtnActive]}
                onPress={() => setFuelFilter(f)}
              >
                <Text style={[styles.filterBtnText, fuelFilter === f && styles.filterBtnTextActive]}>
                  {f === "all" ? t("allInvoices") : f === "gasoil" ? t("gasoil") : t("unleaded")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Invoice List ──────────────────────────────────────────── */}
        <View style={styles.listCard}>
          {loading ? (
            <ActivityIndicator color="#3b82f6" style={{ paddingVertical: vs(40) }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: ms(36), opacity: 0.4, marginBottom: vs(8) }}>📭</Text>
              <Text style={styles.emptyText}>{t("noInvoicesFound")}</Text>
            </View>
          ) : (
            filtered.map((inv, i) => (
              <View key={inv.id} style={[styles.invoiceRow, i > 0 && styles.invoiceRowBorder]}>
                {/* Fuel icon dot */}
                <View style={[styles.fuelDot, inv.fuelType === "gasoil" ? styles.fuelDotGasoil : styles.fuelDotUnleaded]}>
                  <Text style={{ fontSize: ms(14) }}>{inv.fuelType === "gasoil" ? "⛽" : "🔵"}</Text>
                </View>
                <View style={{ flex: 1, paddingRight: s(10) }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: s(6) }}>
                    <Text style={styles.invName} numberOfLines={1}>{inv.customerName}</Text>
                    <View style={[styles.badge, inv.fuelType === "gasoil" ? styles.badgeGasoil : styles.badgeUnleaded]}>
                      <Text style={[styles.badgeText, inv.fuelType === "gasoil" ? styles.badgeTextGasoil : styles.badgeTextUnleaded]}>
                        {inv.fuelType === "gasoil" ? t("gasoil") : t("unleaded")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.invId}>#{inv.invoiceId}</Text>
                  <Text style={styles.invMeta}>{formatDate(inv.date)} · {t("createdBy")}: {inv.createdBy}</Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={styles.invAmount}>{formatCurrency(inv.totalTTC)}</Text>
                  <Text style={styles.invMad}>{t("mad")}</Text>
                  {isAdmin && (
                    <TouchableOpacity onPress={() => handleDelete(inv.id)} style={styles.deleteBtn}>
                      <Text style={{ fontSize: ms(14) }}>🗑️</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },
  content: { padding: s(16), paddingBottom: vs(50) },

  // Page Header
  pageHeader: { flexDirection: "row", alignItems: "center", gap: s(12), marginBottom: vs(20) },
  pageIcon: { width: s(48), height: s(48), borderRadius: s(14), justifyContent: "center", alignItems: "center" },
  pageTitle: { color: "#f1f5f9", fontSize: ms(22), fontWeight: "800" },
  pageSubtitle: { color: "#475569", fontSize: ms(12), marginTop: vs(2) },

  // Stats grid
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: s(10), marginBottom: vs(16) },
  statCard: { flex: 1, minWidth: "45%", borderRadius: s(14), padding: s(14), borderWidth: 1 },
  statCardBlue: { backgroundColor: "rgba(59,130,246,0.1)", borderColor: "rgba(59,130,246,0.2)" },
  statCardGreen: { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)" },
  statCardAmber: { backgroundColor: "rgba(251,191,36,0.1)", borderColor: "rgba(251,191,36,0.2)" },
  statCardSky: { backgroundColor: "rgba(14,165,233,0.1)", borderColor: "rgba(14,165,233,0.2)" },
  statLabel: { color: "#64748b", fontSize: ms(10), fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: vs(4) },
  statValue: { fontSize: ms(22), fontWeight: "800" },

  // Filters
  filtersCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: s(14), borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: s(14), marginBottom: vs(14) },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: s(10), paddingHorizontal: s(12), marginBottom: vs(12) },
  searchInput: { flex: 1, color: "#fff", fontSize: ms(14), paddingVertical: vs(10) },
  filterBtns: { flexDirection: "row", gap: s(8) },
  filterBtn: { flex: 1, paddingVertical: vs(8), borderRadius: s(10), borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.02)", alignItems: "center" },
  filterBtnActive: { borderColor: "rgba(59,130,246,0.5)", backgroundColor: "rgba(59,130,246,0.14)" },
  filterBtnText: { color: "#64748b", fontSize: ms(12), fontWeight: "700" },
  filterBtnTextActive: { color: "#60a5fa" },

  // List
  listCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: s(16), borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", overflow: "hidden" },
  emptyState: { alignItems: "center", paddingVertical: vs(40) },
  emptyText: { color: "#475569", fontSize: ms(14) },

  // Invoice row
  invoiceRow: { flexDirection: "row", alignItems: "center", paddingVertical: vs(14), paddingHorizontal: s(14) },
  invoiceRowBorder: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  fuelDot: { width: s(42), height: s(42), borderRadius: s(12), justifyContent: "center", alignItems: "center", marginRight: s(12), flexShrink: 0, borderWidth: 1 },
  fuelDotGasoil: { backgroundColor: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.25)" },
  fuelDotUnleaded: { backgroundColor: "rgba(14,165,233,0.12)", borderColor: "rgba(14,165,233,0.25)" },
  invName: { color: "#e2e8f0", fontSize: ms(14), fontWeight: "600", flex: 1 },
  invId: { color: "#475569", fontSize: ms(10), marginTop: vs(3), fontFamily: "monospace" },
  invMeta: { color: "#334155", fontSize: ms(10), marginTop: vs(3) },
  badge: { paddingHorizontal: s(6), paddingVertical: vs(2), borderRadius: s(6), borderWidth: 1, flexShrink: 0 },
  badgeGasoil: { backgroundColor: "rgba(245,158,11,0.12)", borderColor: "rgba(245,158,11,0.25)" },
  badgeUnleaded: { backgroundColor: "rgba(14,165,233,0.12)", borderColor: "rgba(14,165,233,0.25)" },
  badgeText: { fontSize: ms(9), fontWeight: "700" },
  badgeTextGasoil: { color: "#f59e0b" },
  badgeTextUnleaded: { color: "#0ea5e9" },
  invoiceRight: { alignItems: "flex-end", gap: vs(2) },
  invAmount: { color: "#34d399", fontSize: ms(14), fontWeight: "800", fontFamily: "monospace" },
  invMad: { color: "#475569", fontSize: ms(9), textTransform: "uppercase", letterSpacing: 0.5 },
  deleteBtn: { marginTop: vs(4), padding: s(4), borderRadius: s(6), backgroundColor: "rgba(239,68,68,0.08)", borderWidth: 1, borderColor: "rgba(239,68,68,0.15)" },
});
