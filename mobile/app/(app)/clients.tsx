import { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocale } from "../../context/LocaleProvider";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { getSessionClient } from "../../lib/auth";
import { s, vs, ms } from "../../lib/responsive";

interface ClientData { id: string; name: string; ice: string; }

// ── Client Avatar ─────────────────────────────────────────────────────────────
function ClientAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  return (
    <LinearGradient colors={["#34d399", "#14b8a6"]} style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </LinearGradient>
  );
}

export default function ClientsScreen() {
  const { t } = useLocale();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ice, setIce] = useState("");
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [invoiceCountsThisYear, setInvoiceCountsThisYear] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const session = await getSessionClient();
      setIsAdmin(session?.role === "admin");
    })();
  }, []);

  const fetchClients = useCallback(async () => {
    try {
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

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) await updateDoc(doc(db, "clients", editingId), { name: name.trim(), ice: ice.trim() });
      else await addDoc(collection(db, "clients"), { name: name.trim(), ice: ice.trim() });
      resetForm(); fetchClients();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleEdit = (client: ClientData) => { setEditingId(client.id); setName(client.name); setIce(client.ice); };

  const handleDelete = (id: string) => {
    Alert.alert(t("confirmDelete"), "", [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: async () => { try { await deleteDoc(doc(db, "clients", id)); fetchClients(); } catch {} } },
    ]);
  };

  const filtered = clients.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Page Header ────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <LinearGradient colors={["#34d399", "#14b8a6"]} style={styles.pageIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={{ fontSize: ms(20) }}>👥</Text>
          </LinearGradient>
          <View>
            <Text style={styles.pageTitle}>{t("manageClients")}</Text>
            <Text style={styles.pageSubtitle}>{loading ? "…" : clients.length} {t("clientsTitle").toLowerCase()}</Text>
          </View>
        </View>

        {/* ── Add / Edit Card ────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <LinearGradient
              colors={editingId ? ["#fbbf24", "#f97316"] : ["#34d399", "#14b8a6"]}
              style={styles.cardIcon}
            >
              <Text style={{ fontSize: ms(18) }}>{editingId ? "✏️" : "➕"}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{editingId ? t("updateClient") : t("addClient")}</Text>
              {editingId && <Text style={styles.cardSubtitle}>{name}</Text>}
            </View>
            {editingId && (
              <TouchableOpacity onPress={resetForm} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.label}>{t("customerName")}</Text>
          <TextInput
            style={styles.input} value={name} onChangeText={setName}
            placeholder={t("customerNamePlaceholder")} placeholderTextColor="#64748b"
          />

          <Text style={[styles.label, { marginTop: vs(14) }]}>{t("clientIce")}</Text>
          <TextInput
            style={[styles.input, { fontFamily: "monospace" }]} value={ice} onChangeText={setIce}
            placeholder={t("clientIcePlaceholder")} placeholderTextColor="#64748b"
          />

          <View style={styles.btnRow}>
            {editingId && (
              <TouchableOpacity onPress={resetForm} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSubmit} style={{ flex: editingId ? 2 : 1 }} disabled={saving}>
              <LinearGradient
                colors={editingId ? ["#fbbf24", "#f97316"] : ["#10b981", "#14b8a6"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{editingId ? t("updateClient") : t("addClient")}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Client List ─────────────────────────────────────────────── */}
        <View style={[styles.card, { marginTop: vs(16) }]}>
          {/* Header + search */}
          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>{t("clientsTitle")}</Text>
            {!loading && (
              <View style={styles.countBadgePill}>
                <Text style={styles.countBadgePillText}>{filtered.length}</Text>
              </View>
            )}
          </View>

          {/* Search */}
          <View style={styles.searchWrap}>
            <Text style={{ color: "#64748b", fontSize: ms(14), marginRight: s(8) }}>🔍</Text>
            <TextInput
              style={styles.searchInput} value={search} onChangeText={setSearch}
              placeholder={t("filterByClient")} placeholderTextColor="#475569"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={{ color: "#64748b", fontSize: ms(16) }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#34d399" />
              <Text style={styles.emptyText}>{t("loadingClients")}</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: ms(36), opacity: 0.4 }}>👥</Text>
              <Text style={styles.emptyText}>{t("noClientsFound")}</Text>
            </View>
          ) : (
            filtered.map((client) => {
              const count = invoiceCountsThisYear[client.name.toLowerCase().trim()] || 0;
              const isEditing = editingId === client.id;
              return (
                <View key={client.id} style={[styles.clientRow, isEditing && styles.clientRowEditing]}>
                  <ClientAvatar name={client.name} />
                  <View style={{ flex: 1, marginLeft: s(12) }}>
                    <Text style={styles.clientName} numberOfLines={1}>{client.name}</Text>
                    {client.ice ? <Text style={styles.clientIce}>{t("ice")}: {client.ice}</Text> : null}
                  </View>
                  {/* Invoice count badge */}
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{count}</Text>
                  </View>
                  {/* Actions */}
                  <View style={styles.clientActions}>
                    <TouchableOpacity onPress={() => handleEdit(client)} style={[styles.actionBtn, styles.actionBtnEdit]}>
                      <Text style={{ fontSize: ms(14) }}>✏️</Text>
                    </TouchableOpacity>
                    {isAdmin && (
                      <TouchableOpacity onPress={() => handleDelete(client.id)} style={[styles.actionBtn, styles.actionBtnDelete]}>
                        <Text style={{ fontSize: ms(14) }}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
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

  // Card
  card: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: s(20), borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: s(20) },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: s(12), marginBottom: vs(20) },
  cardIcon: { width: s(44), height: s(44), borderRadius: s(12), justifyContent: "center", alignItems: "center", flexShrink: 0 },
  cardTitle: { color: "#fff", fontSize: ms(16), fontWeight: "800" },
  cardSubtitle: { color: "#64748b", fontSize: ms(11), marginTop: vs(2) },
  clearBtn: { width: s(32), height: s(32), borderRadius: s(8), backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" },
  clearBtnText: { color: "#64748b", fontSize: ms(14), fontWeight: "700" },

  // Form
  label: { color: "#64748b", fontSize: ms(11), fontWeight: "700", marginBottom: vs(6), textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
    borderRadius: s(10), paddingHorizontal: s(14), paddingVertical: vs(13), color: "#fff", fontSize: ms(15),
  },
  btnRow: { flexDirection: "row", gap: s(10), marginTop: vs(20) },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: s(12), paddingVertical: vs(15), alignItems: "center", justifyContent: "center" },
  cancelBtnText: { color: "#94a3b8", fontSize: ms(14), fontWeight: "600" },
  submitBtn: { borderRadius: s(12), paddingVertical: vs(15), alignItems: "center", elevation: 6 },
  submitBtnText: { color: "#fff", fontSize: ms(15), fontWeight: "700" },

  // List header
  listHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(14) },
  sectionTitle: { color: "#64748b", fontSize: ms(11), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  countBadgePill: { paddingHorizontal: s(10), paddingVertical: vs(3), borderRadius: s(20), backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  countBadgePillText: { color: "#94a3b8", fontSize: ms(11), fontWeight: "700" },

  // Search
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderRadius: s(10), paddingHorizontal: s(12), marginBottom: vs(12) },
  searchInput: { flex: 1, color: "#fff", fontSize: ms(14), paddingVertical: vs(10) },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: vs(32), gap: vs(8) },
  emptyText: { color: "#475569", fontSize: ms(13) },

  // Client row
  clientRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: vs(12), paddingHorizontal: s(4),
    borderRadius: s(12), marginBottom: vs(6),
    borderWidth: 1, borderColor: "transparent",
  },
  clientRowEditing: { backgroundColor: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)", paddingHorizontal: s(10) },
  avatar: { width: s(42), height: s(42), borderRadius: s(21), justifyContent: "center", alignItems: "center", flexShrink: 0 },
  avatarText: { color: "#fff", fontSize: ms(14), fontWeight: "800" },
  clientName: { color: "#e2e8f0", fontSize: ms(14), fontWeight: "600" },
  clientIce: { color: "#475569", fontSize: ms(11), marginTop: vs(2), fontFamily: "monospace" },
  countBadge: { paddingHorizontal: s(8), paddingVertical: vs(3), borderRadius: s(20), backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.25)", marginRight: s(6) },
  countBadgeText: { color: "#34d399", fontSize: ms(11), fontWeight: "700" },
  clientActions: { flexDirection: "row", gap: s(6) },
  actionBtn: { width: s(36), height: s(36), borderRadius: s(10), justifyContent: "center", alignItems: "center", borderWidth: 1 },
  actionBtnEdit: { backgroundColor: "rgba(52,211,153,0.08)", borderColor: "rgba(52,211,153,0.2)" },
  actionBtnDelete: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" },
});
