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
import { s, vs, ms } from "../../lib/responsive";
import {
  getSessionClient,
  changePassword,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserData,
} from "../../lib/auth";

export default function SettingsScreen() {
  const { t } = useLocale();
  const [session, setSession] = useState<{ username: string } | null>(null);

  // Password State
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Users State
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "user">("user");
  const [userLoading, setUserLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const list = await fetchUsers();
    setUsers(list);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await getSessionClient();
      setSession(s);
    })();
    loadUsers();
  }, [loadUsers]);

  // ─── Password Change ───
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) {
      Alert.alert("Error", t("passwordMismatch"));
      return;
    }
    if (newPw.length < 4) {
      Alert.alert("Error", "Minimum 4 characters");
      return;
    }

    setPwLoading(true);
    const result = await changePassword(session!.username, currentPw, newPw);
    setPwLoading(false);

    if (result.success) {
      Alert.alert("Success", t("passwordChanged"));
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } else {
      Alert.alert(
        "Error",
        result.error === "wrong_current_password" ? t("wrongCurrentPassword") : "Error"
      );
    }
  };

  // ─── User CRUD ───
  const resetUserForm = () => {
    setEditingId(null);
    setFormUsername("");
    setFormDisplayName("");
    setFormPassword("");
    setFormRole("user");
  };

  const handleUserSubmit = async () => {
    if (!formDisplayName.trim() || (!editingId && (!formUsername.trim() || !formPassword))) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    setUserLoading(true);
    if (editingId) {
      const data: any = { displayName: formDisplayName, role: formRole };
      if (formPassword) data.password = formPassword;
      const result = await updateUser(editingId, data);
      if (result.success) {
        resetUserForm();
        loadUsers();
      } else {
        Alert.alert("Error", result.error || "Error");
      }
    } else {
      const result = await createUser(formUsername, formPassword, formDisplayName, formRole);
      if (result.success) {
        resetUserForm();
        loadUsers();
      } else {
        Alert.alert(
          "Error",
          result.error === "username_exists" ? t("usernameExists") : result.error || "Error"
        );
      }
    }
    setUserLoading(false);
  };

  const handleEditUser = (u: UserData) => {
    setEditingId(u.id);
    setFormUsername(u.username);
    setFormDisplayName(u.displayName);
    setFormPassword("");
    setFormRole(u.role);
  };

  const handleDeleteUser = (id: string) => {
    Alert.alert("Confirm", t("confirmDeleteUser"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          await deleteUser(id);
          loadUsers();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ── Change Password Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={["#fbbf24", "#f97316"]} style={styles.cardIcon}>
              <Text style={{ fontSize: ms(20) }}>🔑</Text>
            </LinearGradient>
            <Text style={styles.cardTitle}>{t("changePassword")}</Text>
          </View>

          <Text style={styles.label}>{t("currentPassword")}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={currentPw}
            onChangeText={setCurrentPw}
          />

          <Text style={[styles.label, { marginTop: vs(12) }]}>{t("newPassword")}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPw}
            onChangeText={setNewPw}
          />

          <Text style={[styles.label, { marginTop: vs(12) }]}>{t("confirmNewPassword")}</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={confirmPw}
            onChangeText={setConfirmPw}
          />

          <TouchableOpacity onPress={handleChangePassword} style={{ marginTop: vs(20) }} disabled={pwLoading}>
            <LinearGradient colors={["#fbbf24", "#f97316"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
              {pwLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{t("changePassword")}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── User Management Form ── */}
        <View style={[styles.card, { marginTop: vs(16) }]}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={["#a78bfa", "#a855f7"]} style={styles.cardIcon}>
              <Text style={{ fontSize: ms(20) }}>👤</Text>
            </LinearGradient>
            <Text style={styles.cardTitle}>{t("manageUsers")}</Text>
          </View>

          {!editingId && (
            <>
              <Text style={styles.label}>{t("username")}</Text>
              <TextInput
                style={styles.input}
                value={formUsername}
                onChangeText={setFormUsername}
                placeholder={t("usernamePlaceholder")}
                placeholderTextColor="#64748b"
                autoCapitalize="none"
              />
            </>
          )}

          <Text style={[styles.label, { marginTop: editingId ? 0 : vs(12) }]}>{t("displayNameLabel")}</Text>
          <TextInput
            style={styles.input}
            value={formDisplayName}
            onChangeText={setFormDisplayName}
            placeholder={t("displayNamePlaceholder")}
            placeholderTextColor="#64748b"
          />

          <Text style={[styles.label, { marginTop: vs(12) }]}>
            {t("password")} {editingId ? "(leave empty to keep)" : ""}
          </Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={formPassword}
            onChangeText={setFormPassword}
            placeholder={t("passwordPlaceholder")}
            placeholderTextColor="#64748b"
          />

          <Text style={[styles.label, { marginTop: vs(12) }]}>{t("roleLabel")}</Text>
          <View style={{ flexDirection: "row", gap: s(10) }}>
            <TouchableOpacity
              onPress={() => setFormRole("user")}
              style={[styles.roleBtn, formRole === "user" && styles.roleBtnActive]}
            >
              <Text style={[styles.roleBtnText, formRole === "user" && styles.roleBtnTextActive]}>
                {t("roleUser")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFormRole("admin")}
              style={[styles.roleBtn, formRole === "admin" && styles.roleBtnActiveAdmin]}
            >
              <Text style={[styles.roleBtnText, formRole === "admin" && styles.roleBtnTextActiveAdmin]}>
                {t("roleAdmin")}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            {editingId && (
              <TouchableOpacity onPress={resetUserForm} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleUserSubmit} style={{ flex: editingId ? 2 : 1 }} disabled={userLoading}>
              <LinearGradient colors={["#8b5cf6", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                {userLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{editingId ? t("updateUser") : t("addUser")}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── User List ── */}
        <View style={[styles.card, { marginTop: vs(16) }]}>
          <Text style={styles.sectionTitle}>{t("usersTitle")}</Text>
          {usersLoading ? (
            <ActivityIndicator color="#a855f7" style={{ paddingVertical: vs(20) }} />
          ) : users.length === 0 ? (
            <Text style={{ color: "#64748b", textAlign: "center", paddingVertical: vs(20) }}>{t("noUsersFound")}</Text>
          ) : (
            users.map((u) => (
              <View key={u.id} style={styles.userRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: s(6) }}>
                    <Text style={styles.userName}>{u.displayName}</Text>
                    <View style={[styles.badge, u.role === "admin" ? styles.badgeAdmin : styles.badgeUser]}>
                      <Text style={[styles.badgeText, u.role === "admin" ? styles.badgeTextAdmin : styles.badgeTextUser]}>
                        {u.role === "admin" ? t("roleAdmin") : t("roleUser")}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.userUsername}>@{u.username}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEditUser(u)} style={styles.actionBtn}>
                    <Text style={{ fontSize: ms(16) }}>✏️</Text>
                  </TouchableOpacity>
                  {u.username !== session?.username && (
                    <TouchableOpacity onPress={() => handleDeleteUser(u.id)} style={styles.actionBtn}>
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
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: s(20),
  },
  cardHeader: { alignItems: "center", marginBottom: vs(20) },
  cardIcon: {
    width: s(44),
    height: s(44),
    borderRadius: s(12),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: vs(8),
  },
  cardTitle: { color: "#fff", fontSize: ms(18), fontWeight: "800" },
  label: { color: "#94a3b8", fontSize: ms(13), fontWeight: "500", marginBottom: vs(6) },
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
  submitBtn: {
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: "center",
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.25,
    shadowRadius: s(12),
    elevation: 6,
  },
  submitBtnText: { color: "#fff", fontSize: ms(15), fontWeight: "700" },
  roleBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
  },
  roleBtnActive: { borderColor: "#a855f7", backgroundColor: "rgba(168,85,247,0.1)" },
  roleBtnActiveAdmin: { borderColor: "#fbbf24", backgroundColor: "rgba(251,191,36,0.1)" },
  roleBtnText: { color: "#94a3b8", fontSize: ms(14), fontWeight: "600" },
  roleBtnTextActive: { color: "#a855f7" },
  roleBtnTextActiveAdmin: { color: "#fbbf24" },
  btnRow: { flexDirection: "row", gap: s(10), marginTop: vs(20) },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: "#fff", fontSize: ms(14), fontWeight: "600" },
  sectionTitle: { color: "#94a3b8", fontSize: ms(11), fontWeight: "700", textTransform: "uppercase", marginBottom: vs(12) },
  userRow: {
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
  userName: { color: "#e2e8f0", fontSize: ms(14), fontWeight: "500" },
  userUsername: { color: "#64748b", fontSize: ms(11), marginTop: vs(2) },
  badge: { paddingHorizontal: s(6), paddingVertical: vs(2), borderRadius: s(8), borderWidth: 1 },
  badgeAdmin: { backgroundColor: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.3)" },
  badgeUser: { backgroundColor: "rgba(148,163,184,0.15)", borderColor: "rgba(148,163,184,0.3)" },
  badgeText: { fontSize: ms(9), fontWeight: "700" },
  badgeTextAdmin: { color: "#fbbf24" },
  badgeTextUser: { color: "#94a3b8" },
  actions: { flexDirection: "row", gap: s(4) },
  actionBtn: { width: s(36), height: s(36), borderRadius: s(8), justifyContent: "center", alignItems: "center" },
});
