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
} from "firebase/firestore";

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

  const fetchClients = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "clients"));
      const list: ClientData[] = [];
      snap.forEach((d) =>
        list.push({ id: d.id, ...d.data() } as ClientData)
      );
      list.sort((a, b) => a.name.localeCompare(b.name));
      setClients(list);
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
              <Text style={{ fontSize: 22 }}>👥</Text>
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

          <Text style={[styles.label, { marginTop: 16 }]}>{t("clientIce")}</Text>
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
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>{t("clientsTitle")}</Text>

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#34d399" />
              <Text style={styles.emptyText}>{t("loadingClients")}</Text>
            </View>
          ) : clients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 28 }}>👥</Text>
              <Text style={styles.emptyText}>{t("noClientsFound")}</Text>
            </View>
          ) : (
            clients.map((client) => (
              <View key={client.id} style={styles.clientRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  {client.ice ? (
                    <Text style={styles.clientIce}>
                      {t("ice")}: {client.ice}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.clientActions}>
                  <TouchableOpacity
                    onPress={() => handleEdit(client)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.editIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(client.id)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
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
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 24,
  },
  cardHeader: { alignItems: "center", marginBottom: 20 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  label: { color: "#94a3b8", fontSize: 13, fontWeight: "500", marginBottom: 8 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 15,
  },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  sectionTitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyState: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyText: { color: "#64748b", fontSize: 13 },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: 6,
  },
  clientName: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" },
  clientIce: { color: "#64748b", fontSize: 11, marginTop: 2, fontVariant: ["tabular-nums"] },
  clientActions: { flexDirection: "row", gap: 4 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: { fontSize: 16 },
  deleteIcon: { fontSize: 16 },
});
