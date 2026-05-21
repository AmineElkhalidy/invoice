import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocale } from "../../context/LocaleProvider";
import { s, vs, ms } from "../../lib/responsive";
import { db } from "../../lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { getSessionClient } from "../../lib/auth";

interface InvoiceRecord {
  id: string;
  invoiceId: string;
  customerName: string;
  clientIce: string;
  unitPrice: number;
  quantity: number;
  fuelType: string;
  totalHT: number;
  totalTTC: number;
  date: string;
  createdBy: string;
  createdAt: string;
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
      fetchInvoices();
    })();
  }, []);

  const fetchInvoices = async () => {
    try {
      const snap = await getDocs(collection(db, "invoices"));
      const list: InvoiceRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as InvoiceRecord));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInvoices(list);
    } catch (e) {
      console.error("Error fetching invoices:", e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch =
        !search ||
        inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceId.toLowerCase().includes(search.toLowerCase());
      const matchFuel = fuelFilter === "all" || inv.fuelType === fuelFilter;
      return matchSearch && matchFuel;
    });
  }, [invoices, search, fuelFilter]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, inv) => sum + (inv.totalTTC || 0), 0);
    return { count: filtered.length, total };
  }, [filtered]);

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : "fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Confirm", t("confirmDelete"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "invoices", id));
            setInvoices((prev) => prev.filter((inv) => inv.id !== id));
          } catch (e) {
            console.error("Error deleting invoice:", e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient colors={["#3b82f6", "#06b6d4"]} style={styles.headerIcon}>
            <Text style={{ fontSize: ms(24) }}>📋</Text>
          </LinearGradient>
          <Text style={styles.headerTitle}>{t("invoiceHistory")}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t("totalInvoices")}</Text>
            <Text style={styles.statValueCount}>{stats.count}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{t("totalTTC")}</Text>
            <Text style={styles.statValueTotal}>
              {formatCurrency(stats.total)}{" "}
              <Text style={styles.mad}>{t("mad")}</Text>
            </Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersCard}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t("searchInvoices")}
            placeholderTextColor="#64748b"
          />
          <View style={styles.filterBtns}>
            {(["all", "gasoil", "unleaded"] as const).map((f) => {
              const active = fuelFilter === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFuelFilter(f)}
                  style={[styles.filterBtn, active && styles.filterBtnActive]}
                >
                  <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>
                    {f === "all" ? t("allInvoices") : f === "gasoil" ? t("gasoil") : t("unleaded")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* List */}
        <View style={[styles.listCard, { marginTop: vs(16) }]}>
          {loading ? (
            <ActivityIndicator color="#3b82f6" style={{ paddingVertical: vs(40) }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: ms(32) }}>📭</Text>
              <Text style={styles.emptyText}>{t("noInvoicesFound")}</Text>
            </View>
          ) : (
            filtered.map((inv) => (
              <View key={inv.id} style={styles.invoiceRow}>
                <View style={styles.invoiceMain}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: s(8) }}>
                    <Text style={styles.invName} numberOfLines={1}>{inv.customerName}</Text>
                    <View style={[styles.badge, inv.fuelType === "gasoil" ? styles.badgeGasoil : styles.badgeUnleaded]}>
                      <Text style={[styles.badgeText, inv.fuelType === "gasoil" ? styles.badgeTextGasoil : styles.badgeTextUnleaded]}>
                        {inv.fuelType === "gasoil" ? t("gasoil") : t("unleaded")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.invId}>{inv.invoiceId}</Text>
                  <Text style={styles.invMeta}>
                    {formatDate(inv.date)} • {t("createdBy")}: {inv.createdBy}
                  </Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={styles.invAmount}>{formatCurrency(inv.totalTTC)}</Text>
                  {isAdmin && (
                    <TouchableOpacity onPress={() => handleDelete(inv.id)} style={styles.deleteBtn}>
                      <Text style={{ fontSize: ms(16) }}>🗑️</Text>
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
  content: { padding: s(16), paddingBottom: vs(40) },
  header: { alignItems: "center", marginBottom: vs(24) },
  headerIcon: {
    width: s(56),
    height: s(56),
    borderRadius: s(16),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(12),
  },
  headerTitle: { color: "#fff", fontSize: ms(22), fontWeight: "800" },
  statsContainer: { flexDirection: "row", gap: s(12), marginBottom: vs(16) },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(12),
    padding: s(16),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statLabel: { color: "#94a3b8", fontSize: ms(11), fontWeight: "700", textTransform: "uppercase", marginBottom: vs(6) },
  statValueCount: { color: "#fff", fontSize: ms(24), fontWeight: "700" },
  statValueTotal: { color: "#34d399", fontSize: ms(20), fontWeight: "700" },
  mad: { fontSize: ms(12), color: "#94a3b8" },
  filtersCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(12),
    padding: s(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: s(10),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    color: "#fff",
    fontSize: ms(14),
    marginBottom: vs(12),
  },
  filterBtns: { flexDirection: "row", gap: s(8) },
  filterBtn: {
    flex: 1,
    paddingVertical: vs(8),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
  },
  filterBtnActive: { borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.15)" },
  filterBtnText: { color: "#94a3b8", fontSize: ms(12), fontWeight: "600" },
  filterBtnTextActive: { color: "#3b82f6" },
  listCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingTop: vs(8),
    paddingBottom: vs(8),
  },
  emptyState: { alignItems: "center", paddingVertical: vs(32), gap: vs(8) },
  emptyText: { color: "#64748b", fontSize: ms(14) },
  invoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  invoiceMain: { flex: 1, paddingRight: s(12) },
  invName: { color: "#e2e8f0", fontSize: ms(14), fontWeight: "600", flex: 1 },
  invId: { color: "#64748b", fontSize: ms(11), marginTop: vs(4), fontFamily: "monospace" },
  invMeta: { color: "#475569", fontSize: ms(10), marginTop: vs(4) },
  badge: { paddingHorizontal: s(6), paddingVertical: vs(2), borderRadius: s(6), borderWidth: 1 },
  badgeGasoil: { backgroundColor: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.3)" },
  badgeUnleaded: { backgroundColor: "rgba(14,165,233,0.15)", borderColor: "rgba(14,165,233,0.3)" },
  badgeText: { fontSize: ms(9), fontWeight: "700" },
  badgeTextGasoil: { color: "#f59e0b" },
  badgeTextUnleaded: { color: "#0ea5e9" },
  invoiceRight: { alignItems: "flex-end", justifyContent: "center", gap: vs(8) },
  invAmount: { color: "#34d399", fontSize: ms(14), fontWeight: "700", fontFamily: "monospace" },
  deleteBtn: { padding: s(4) },
});
