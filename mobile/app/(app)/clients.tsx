import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useLocale } from "../../context/LocaleProvider";
import { db } from "../../lib/firebase";
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
import { getSessionClient, type SessionData } from "../../lib/auth";
import { s, vs, ms } from "../../lib/responsive";

interface ClientData {
  id: string;
  name: string;
  ice: string;
}

export default function ClientsScreen() {
  const { t } = useLocale();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ice, setIce] = useState("");
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
      snap.forEach((d) =>
        list.push({ id: d.id, ...d.data() } as ClientData)
      );
      list.sort((a, b) => a.name.localeCompare(b.name));
      setClients(list);

      // Fetch invoices for current year and compute per-client count
      const year = new Date().getFullYear();
      const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`).toISOString();
      const invoicesSnap = await getDocs(
        query(collection(db, "invoices"), where("createdAt", ">=", startOfYear))
      );
      const counts: Record<string, number> = {};
      invoicesSnap.forEach((d) => {
        const data = d.data();
        if (data.customerName) {
          const key = (data.customerName as string).toLowerCase().trim();
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      setInvoiceCountsThisYear(counts);
    } catch (e) {
      console.error("Error fetching clients:", e);
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

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, "clients", editingId), {
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
    } catch (e) {
      console.error("Error saving client:", e);
    }
  };

  const handleEdit = (client: ClientData) => {
    setEditingId(client.id);
    setName(client.name);
    setIce(client.ice);
  };

  const handleDelete = (id: string) => {
    Alert.alert(t("confirmDelete"), "", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "clients", id));
            fetchClients();
          } catch (e) {
            console.error("Error deleting client:", e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Add / Edit Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={["#34d399", "#14b8a6"]}
              style={styles.cardIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={{ fontSize: ms(22) }}>👥</Text>
            </LinearGradient>
            <Text style={styles.cardTitle}>{t("manageClients")}</Text>
          </View>

          <Text style={styles.label}>{t("customerName")}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("customerNamePlaceholder")}
            placeholderTextColor="#64748b"
          />

          <Text style={[styles.label, { marginTop: vs(16) }]}>{t("clientIce")}</Text>
          <TextInput
            style={styles.input}
            value={ice}
            onChangeText={setIce}
            placeholder={t("clientIcePlaceholder")}
            placeholderTextColor="#64748b"
          />

          <View style={styles.btnRow}>
            {editingId && (
              <TouchableOpacity onPress={resetForm} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.8}
              style={{ flex: editingId ? 2 : 1 }}
            >
              <LinearGradient
                colors={["#10b981", "#14b8a6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>
                  {editingId ? t("updateClient") : t("addClient")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Client List */}
        <View style={[styles.card, { marginTop: vs(16) }]}>
          <Text style={styles.sectionTitle}>{t("clientsTitle")}</Text>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#34d399" />
              <Text style={styles.emptyText}>{t("loadingClients")}</Text>
            </View>
          ) : clients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: ms(28) }}>👥</Text>
              <Text style={styles.emptyText}>{t("noClientsFound")}</Text>
            </View>
          ) : (
            clients.map((client) => {
              const count = invoiceCountsThisYear[client.name.toLowerCase().trim()] || 0;
              return (
                <View key={client.id} style={styles.clientRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clientName}>{client.name}</Text>
                    {client.ice ? (
                      <Text style={styles.clientIce}>
                        {t("ice")}: {client.ice}
                      </Text>
                    ) : null}
                  </View>
                  {/* Yearly invoice count badge */}
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{count}</Text>
                    <Text style={styles.countBadgeLabel}> {t("invoiceCount")}</Text>
                  </View>
                  <View style={styles.clientActions}>
                    <TouchableOpacity
                      onPress={() => handleEdit(client)}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                    {isAdmin && (
                      <TouchableOpacity
                        onPress={() => handleDelete(client.id)}
                        style={styles.actionBtn}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
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
  content: { padding: s(16), paddingBottom: vs(40) },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: s(24),
  },
  cardHeader: { alignItems: "center", marginBottom: vs(20) },
  cardIcon: {
    width: s(48),
    height: s(48),
    borderRadius: s(14),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(10),
  },
  cardTitle: { color: "#fff", fontSize: ms(18), fontWeight: "800", letterSpacing: -0.3 },
  label: { color: "#94a3b8", fontSize: ms(13), fontWeight: "500", marginBottom: vs(8) },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: s(10),
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    color: "#fff",
    fontSize: ms(15),
  },
  btnRow: { flexDirection: "row", gap: s(10), marginTop: vs(20) },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: "center",
  },
  cancelBtnText: { color: "#fff", fontSize: ms(14), fontWeight: "600" },
  submitBtn: {
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.25,
    shadowRadius: s(12),
    elevation: 6,
  },
  submitBtnText: { color: "#fff", fontSize: ms(15), fontWeight: "700" },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: ms(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: vs(12),
  },
  emptyState: { alignItems: "center", paddingVertical: vs(32), gap: vs(8) },
  emptyText: { color: "#64748b", fontSize: ms(13) },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: s(12),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: vs(6),
  },
  clientName: { color: "#e2e8f0", fontSize: ms(14), fontWeight: "500" },
  clientIce: { color: "#64748b", fontSize: ms(11), marginTop: vs(2), fontVariant: ["tabular-nums"] },
  clientActions: { flexDirection: "row", gap: s(4) },
  actionBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(8),
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: { fontSize: ms(16) },
  deleteIcon: { fontSize: ms(16) },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
    borderRadius: s(20),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    marginRight: s(6),
  },
  countBadgeText: { color: "#34d399", fontSize: ms(12), fontWeight: "700" },
  countBadgeLabel: { color: "rgba(52,211,153,0.7)", fontSize: ms(10) },
});
