import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocale } from "../../context/LocaleProvider";
import { logoutClient } from "../../lib/auth";
import { stationConfig } from "../../config/station";
import { db } from "../../lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

interface SavedClient {
  name: string;
  ice: string;
}

export default function DashboardScreen() {
  const { t, toggleLocale, locale } = useLocale();
  const router = useRouter();

  const [customerName, setCustomerName] = useState("");
  const [clientIce, setClientIce] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fuelType, setFuelType] = useState<"gasoil" | "unleaded">("gasoil");
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Re-fetch clients every time the dashboard tab gains focus
  // This ensures clients added in the Clients tab appear as suggestions immediately
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const snap = await getDocs(collection(db, "clients"));
          const list: SavedClient[] = [];
          snap.forEach((d) => list.push(d.data() as SavedClient));
          setSavedClients(list);
        } catch (e) {
          console.error("Error fetching clients:", e);
        }
      })();
    }, [])
  );

  const filteredClients = savedClients.filter((c) =>
    c.name.toLowerCase().includes(customerName.toLowerCase())
  );

  const handleGenerate = useCallback(() => {
    const price = parseFloat(unitPrice);
    const qty = parseFloat(quantity);
    if (!customerName.trim() || isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) return;

    // Save client if new
    const exists = savedClients.find(
      (c) => c.name.toLowerCase() === customerName.trim().toLowerCase()
    );
    if (!exists) {
      addDoc(collection(db, "clients"), {
        name: customerName.trim(),
        ice: clientIce.trim(),
      }).catch(console.error);
    }

    // Generate invoice ID
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const invoiceId = `FAC-${datePart}-${rand}`;

    router.push({
      pathname: "/(app)/invoice",
      params: {
        id: invoiceId,
        customerName: customerName.trim(),
        clientIce: clientIce.trim(),
        unitPrice: String(price),
        quantity: String(qty),
        fuelType,
        date: now.toISOString(),
      },
    });
  }, [customerName, clientIce, unitPrice, quantity, fuelType, savedClients, router]);

  const handleLogout = async () => {
    await logoutClient();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={["#34d399", "#14b8a6"]}
              style={styles.headerIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={{ fontSize: 16 }}>⛽</Text>
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
            <TouchableOpacity onPress={handleLogout} style={styles.headerBtn}>
              <Text style={styles.headerBtnText}>{t("logout")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={["#34d399", "#14b8a6"]}
                style={styles.cardIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={{ fontSize: 22 }}>📄</Text>
              </LinearGradient>
              <Text style={styles.cardTitle}>{t("dashboardTitle")}</Text>
            </View>

            {/* Customer Name */}
            <Text style={styles.label}>{t("customerName")}</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={(v) => {
                setCustomerName(v);
                setShowSuggestions(true);
              }}
              placeholder={t("customerNamePlaceholder")}
              placeholderTextColor="#64748b"
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && filteredClients.length > 0 && (
              <View style={styles.suggestions}>
                {filteredClients.slice(0, 5).map((c, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setCustomerName(c.name);
                      setClientIce(c.ice);
                      setShowSuggestions(false);
                    }}
                  >
                    <Text style={styles.suggestionName}>{c.name}</Text>
                    {c.ice ? (
                      <Text style={styles.suggestionIce}>
                        {t("ice")}: {c.ice}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ICE */}
            <Text style={[styles.label, { marginTop: 16 }]}>{t("clientIce")}</Text>
            <TextInput
              style={styles.input}
              value={clientIce}
              onChangeText={setClientIce}
              placeholder={t("clientIcePlaceholder")}
              placeholderTextColor="#64748b"
            />

            {/* Price & Quantity */}
            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { marginTop: 16 }]}>{t("unitPriceInput")}</Text>
                <TextInput
                  style={[styles.input, styles.monoInput]}
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                  placeholder={t("unitPricePlaceholder")}
                  placeholderTextColor="#64748b"
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={[styles.label, { marginTop: 16 }]}>{t("quantityInput")}</Text>
                <TextInput
                  style={[styles.input, styles.monoInput]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder={t("quantityPlaceholder")}
                  placeholderTextColor="#64748b"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Fuel Type */}
            <Text style={[styles.label, { marginTop: 16 }]}>{t("fuelType")}</Text>
            <View style={styles.fuelRow}>
              <TouchableOpacity
                style={[
                  styles.fuelBtn,
                  fuelType === "gasoil" && styles.fuelBtnActive,
                ]}
                onPress={() => setFuelType("gasoil")}
              >
                <Text
                  style={[
                    styles.fuelBtnText,
                    fuelType === "gasoil" && styles.fuelBtnTextActive,
                  ]}
                >
                  {t("gasoil")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.fuelBtn,
                  fuelType === "unleaded" && styles.fuelBtnActive,
                ]}
                onPress={() => setFuelType("unleaded")}
              >
                <Text
                  style={[
                    styles.fuelBtnText,
                    fuelType === "unleaded" && styles.fuelBtnTextActive,
                  ]}
                >
                  {t("unleaded")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity onPress={handleGenerate} activeOpacity={0.8} style={{ marginTop: 24 }}>
              <LinearGradient
                colors={["#10b981", "#14b8a6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                <Text style={styles.submitBtnText}>{t("generateInvoice")}</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#0f172a",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 13, fontWeight: "700" },
  headerSub: { color: "#64748b", fontSize: 10 },
  headerRight: { flexDirection: "row", gap: 6 },
  headerBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerBtnText: { color: "#94a3b8", fontSize: 11, fontWeight: "600" },
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
  monoInput: { fontVariant: ["tabular-nums"] },
  suggestions: {
    backgroundColor: "#1e293b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 4,
    overflow: "hidden",
  },
  suggestionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  suggestionName: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" },
  suggestionIce: { color: "#64748b", fontSize: 11, marginTop: 2 },
  row: { flexDirection: "row", gap: 12 },
  halfCol: { flex: 1 },
  fuelRow: { flexDirection: "row", gap: 10 },
  fuelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  fuelBtnActive: {
    borderColor: "#10b981",
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  fuelBtnText: { color: "#94a3b8", fontSize: 14, fontWeight: "600" },
  fuelBtnTextActive: { color: "#34d399" },
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
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
