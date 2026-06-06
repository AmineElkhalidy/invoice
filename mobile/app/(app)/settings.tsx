import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Pressable,
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

// ── Password visibility toggle ───────────────────────────────────────────────
function PasswordInput({
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = "#64748b",
  style,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: object;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.pwContainer, style]}>
      <TextInput
        style={[styles.input, { flex: 1, borderWidth: 0, paddingHorizontal: 0 }]}
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={() => setShow((v) => !v)} style={styles.eyeBtn}>
        <Text style={{ color: show ? "#94a3b8" : "#475569", fontSize: ms(18) }}>
          {show ? "👁" : "🙈"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── User Avatar ───────────────────────────────────────────────────────────────
function UserAvatar({ name, role }: { name: string; role: "admin" | "user" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
  const colors: [string, string] =
    role === "admin" ? ["#fbbf24", "#f97316"] : ["#a78bfa", "#a855f7"];
  return (
    <LinearGradient colors={colors} style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </LinearGradient>
  );
}

// ── Alert Banner ─────────────────────────────────────────────────────────────
function Banner({ msg }: { msg: { type: "success" | "error"; text: string } | null }) {
  if (!msg) return null;
  const isSuccess = msg.type === "success";
  return (
    <View style={[styles.banner, isSuccess ? styles.bannerSuccess : styles.bannerError]}>
      <Text style={{ fontSize: ms(16), marginRight: s(8) }}>{isSuccess ? "✅" : "⚠️"}</Text>
      <Text style={[styles.bannerText, isSuccess ? styles.bannerTextSuccess : styles.bannerTextError]}>
        {msg.text}
      </Text>
    </View>
  );
}

// ── Strength bar ──────────────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const strength = Math.min(Math.floor(password.length / 3), 4);
  const color = password.length < 4 ? "#ef4444" : password.length < 6 ? "#f59e0b" : "#10b981";
  const label = password.length < 4 ? "Trop court" : password.length < 6 ? "Faible" : password.length < 10 ? "Moyen" : "Fort";
  return (
    <View style={{ marginTop: vs(8) }}>
      <View style={{ flexDirection: "row", gap: s(4) }}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={[styles.strengthBar, { backgroundColor: i < strength ? color : "rgba(255,255,255,0.1)" }]} />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { t } = useLocale();
  const [session, setSession] = useState<{ username: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"password" | "users">("password");
  const scrollRef = useRef<ScrollView>(null);

  // Password State
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Users State
  const [users, setUsers] = useState<UserData[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "user">("user");
  const [userLoading, setUserLoading] = useState(false);
  const [userMsg, setUserMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  // ── Password Change ─────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPw || !newPw || !confirmPw) {
      setPwMsg({ type: "error", text: "Veuillez remplir tous les champs" });
      return;
    }
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: t("passwordMismatch") }); return; }
    if (newPw.length < 4) { setPwMsg({ type: "error", text: "Minimum 4 caractères" }); return; }

    setPwLoading(true);
    const result = await changePassword(session!.username, currentPw, newPw);
    setPwLoading(false);

    if (result.success) {
      setPwMsg({ type: "success", text: t("passwordChanged") });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      setPwMsg({ type: "error", text: result.error === "wrong_current_password" ? t("wrongCurrentPassword") : "Erreur" });
    }
  };

  // ── User CRUD ─────────────────────────────────────────────────────────
  const resetUserForm = () => {
    setEditingId(null); setFormUsername(""); setFormDisplayName("");
    setFormPassword(""); setFormRole("user"); setUserMsg(null);
  };

  const handleUserSubmit = async () => {
    setUserMsg(null);
    if (!formDisplayName.trim() || (!editingId && (!formUsername.trim() || !formPassword))) {
      setUserMsg({ type: "error", text: "Veuillez remplir les champs requis" });
      return;
    }

    setUserLoading(true);
    if (editingId) {
      const data: { displayName?: string; role?: "admin" | "user"; password?: string } = { displayName: formDisplayName, role: formRole };
      if (formPassword) data.password = formPassword;
      const result = await updateUser(editingId, data);
      setUserLoading(false);
      if (result.success) { resetUserForm(); loadUsers(); }
      else setUserMsg({ type: "error", text: result.error || "Erreur" });
    } else {
      const result = await createUser(formUsername, formPassword, formDisplayName, formRole);
      setUserLoading(false);
      if (result.success) { resetUserForm(); loadUsers(); }
      else setUserMsg({ type: "error", text: result.error === "username_exists" ? t("usernameExists") : result.error || "Erreur" });
    }
  };

  const handleEditUser = (u: UserData) => {
    setEditingId(u.id); setFormUsername(u.username);
    setFormDisplayName(u.displayName); setFormPassword(""); setFormRole(u.role);
    setUserMsg(null);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 50);
  };

  const handleDeleteUser = (id: string) => {
    Alert.alert("Confirmer", t("confirmDeleteUser"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: async () => { await deleteUser(id); loadUsers(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <View style={styles.pageHeader}>
          <LinearGradient colors={["#334155", "#1e293b"]} style={styles.pageIconWrap}>
            <Text style={{ fontSize: ms(18) }}>⚙️</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>{t("settings")}</Text>
            <Text style={styles.pageSubtitle}>{t("loggedInAs")} @{session?.username ?? "..."}</Text>
          </View>
        </View>

        {/* ── Tab Switcher ─────────────────────────────────────────────── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "password" && styles.tabActivePassword]}
            onPress={() => setActiveTab("password")}
          >
            <Text style={[styles.tabText, activeTab === "password" && styles.tabTextActivePassword]}>
              🔐 {t("changePassword")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "users" && styles.tabActiveUsers]}
            onPress={() => setActiveTab("users")}
          >
            <Text style={[styles.tabText, activeTab === "users" && styles.tabTextActiveUsers]}>
              👥 {t("manageUsers")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            PASSWORD TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "password" && (
          <View style={styles.card}>
            {/* Card header */}
            <View style={styles.cardHeaderRow}>
              <LinearGradient colors={["#fbbf24", "#f97316"]} style={styles.cardIcon}>
                <Text style={{ fontSize: ms(18) }}>🔑</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{t("changePassword")}</Text>
                <Text style={styles.cardSubtitle}>@{session?.username}</Text>
              </View>
            </View>

            <Text style={styles.label}>{t("currentPassword")}</Text>
            <PasswordInput
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="••••••••"
              style={styles.inputWrap}
            />

            <Text style={[styles.label, { marginTop: vs(12) }]}>{t("newPassword")}</Text>
            <PasswordInput
              value={newPw}
              onChangeText={setNewPw}
              placeholder="••••••••"
              style={styles.inputWrap}
            />
            <StrengthBar password={newPw} />

            <Text style={[styles.label, { marginTop: vs(12) }]}>{t("confirmNewPassword")}</Text>
            <PasswordInput
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="••••••••"
              style={styles.inputWrap}
            />

            <Banner msg={pwMsg} />

            <TouchableOpacity onPress={handleChangePassword} style={{ marginTop: vs(20) }} disabled={pwLoading}>
              <LinearGradient
                colors={["#fbbf24", "#f97316"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {pwLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>{t("changePassword")}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════
            USERS TAB
        ════════════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <>
            {/* ── Form card ─────────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <LinearGradient
                  colors={editingId ? ["#fbbf24", "#f97316"] : ["#a78bfa", "#a855f7"]}
                  style={styles.cardIcon}
                >
                  <Text style={{ fontSize: ms(18) }}>{editingId ? "✏️" : "➕"}</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{editingId ? t("updateUser") : t("addUser")}</Text>
                  {editingId && (
                    <Text style={styles.cardSubtitle}>@{formUsername}</Text>
                  )}
                </View>
                {editingId && (
                  <TouchableOpacity onPress={resetUserForm} style={styles.clearBtn}>
                    <Text style={styles.clearBtnText}>✕ {t("cancel")}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!editingId && (
                <>
                  <Text style={styles.label}>{t("username")}</Text>
                  <TextInput
                    style={[styles.input, styles.inputFocusViolet]}
                    value={formUsername}
                    onChangeText={setFormUsername}
                    placeholder={t("usernamePlaceholder")}
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                  />
                </>
              )}

              <Text style={[styles.label, { marginTop: vs(12) }]}>{t("displayNameLabel")}</Text>
              <TextInput
                style={[styles.input, styles.inputFocusViolet]}
                value={formDisplayName}
                onChangeText={setFormDisplayName}
                placeholder={t("displayNamePlaceholder")}
                placeholderTextColor="#64748b"
              />

              <Text style={[styles.label, { marginTop: vs(12) }]}>
                {t("password")}{editingId ? " (laisser vide pour garder)" : ""}
              </Text>
              <PasswordInput
                value={formPassword}
                onChangeText={setFormPassword}
                placeholder={t("passwordPlaceholder")}
                style={[styles.inputWrap, styles.inputFocusViolet]}
              />

              <Text style={[styles.label, { marginTop: vs(12) }]}>{t("roleLabel")}</Text>
              <View style={{ flexDirection: "row", gap: s(10) }}>
                {(["user", "admin"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setFormRole(r)}
                    style={[
                      styles.roleBtn,
                      formRole === r && (r === "admin" ? styles.roleBtnActiveAdmin : styles.roleBtnActive),
                    ]}
                  >
                    <Text style={{ fontSize: ms(14), marginBottom: vs(2) }}>{r === "admin" ? "👑" : "👤"}</Text>
                    <Text style={[styles.roleBtnText, formRole === r && (r === "admin" ? styles.roleBtnTextActiveAdmin : styles.roleBtnTextActive)]}>
                      {r === "admin" ? t("roleAdmin") : t("roleUser")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Banner msg={userMsg} />

              <View style={[styles.btnRow, { marginTop: vs(20) }]}>
                {editingId && (
                  <TouchableOpacity onPress={resetUserForm} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleUserSubmit} style={{ flex: editingId ? 2 : 1 }} disabled={userLoading}>
                  <LinearGradient
                    colors={editingId ? ["#fbbf24", "#f97316"] : ["#8b5cf6", "#a855f7"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.submitBtn}
                  >
                    {userLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>{editingId ? t("updateUser") : t("addUser")}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── User List ────────────────────────────────────────── */}
            <View style={[styles.card, { marginTop: vs(16) }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: vs(16) }}>
                <Text style={styles.sectionTitle}>{t("usersTitle")}</Text>
                {!usersLoading && (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{users.length}</Text>
                  </View>
                )}
              </View>

              {usersLoading ? (
                <ActivityIndicator color="#a855f7" style={{ paddingVertical: vs(24) }} />
              ) : users.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyText}>{t("noUsersFound")}</Text>
                </View>
              ) : (
                users.map((u) => {
                  const isSelf = u.username === session?.username;
                  const isEditing = editingId === u.id;
                  return (
                    <View
                      key={u.id}
                      style={[
                        styles.userRow,
                        isEditing && styles.userRowEditing,
                      ]}
                    >
                      <UserAvatar name={u.displayName} role={u.role} />
                      <View style={{ flex: 1, marginLeft: s(12) }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: s(6), flexWrap: "wrap" }}>
                          <Text style={styles.userName}>{u.displayName}</Text>
                          <View style={[styles.badge, u.role === "admin" ? styles.badgeAdmin : styles.badgeUser]}>
                            <Text style={[styles.badgeText, u.role === "admin" ? styles.badgeTextAdmin : styles.badgeTextUser]}>
                              {u.role === "admin" ? t("roleAdmin") : t("roleUser")}
                            </Text>
                          </View>
                          {isSelf && (
                            <View style={styles.selfBadge}>
                              <Text style={styles.selfBadgeText}>Vous</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userUsername}>@{u.username}</Text>
                      </View>
                      <View style={styles.actions}>
                        <TouchableOpacity
                          onPress={() => handleEditUser(u)}
                          style={[styles.actionBtn, styles.actionBtnEdit]}
                        >
                          <Text style={{ fontSize: ms(14) }}>✏️</Text>
                        </TouchableOpacity>
                        {!isSelf && (
                          <TouchableOpacity
                            onPress={() => handleDeleteUser(u.id)}
                            style={[styles.actionBtn, styles.actionBtnDelete]}
                          >
                            <Text style={{ fontSize: ms(14) }}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },
  content: { padding: s(16), paddingBottom: vs(50) },

  // Page Header
  pageHeader: { flexDirection: "row", alignItems: "center", gap: s(12), marginBottom: vs(20) },
  pageIconWrap: { width: s(44), height: s(44), borderRadius: s(12), justifyContent: "center", alignItems: "center" },
  pageTitle: { color: "#f1f5f9", fontSize: ms(22), fontWeight: "800" },
  pageSubtitle: { color: "#475569", fontSize: ms(12), marginTop: vs(2) },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    gap: s(6),
    padding: s(4),
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: vs(20),
  },
  tab: {
    flex: 1,
    paddingVertical: vs(10),
    borderRadius: s(10),
    alignItems: "center",
  },
  tabText: { color: "#64748b", fontSize: ms(12), fontWeight: "600" },
  tabActivePassword: { backgroundColor: "rgba(251,191,36,0.12)", borderWidth: 1, borderColor: "rgba(251,191,36,0.25)" },
  tabActiveUsers: { backgroundColor: "rgba(168,85,247,0.12)", borderWidth: 1, borderColor: "rgba(168,85,247,0.25)" },
  tabTextActivePassword: { color: "#fbbf24" },
  tabTextActiveUsers: { color: "#a855f7" },

  // Card
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: s(20),
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: s(12), marginBottom: vs(20) },
  cardIcon: { width: s(44), height: s(44), borderRadius: s(12), justifyContent: "center", alignItems: "center", flexShrink: 0 },
  cardTitle: { color: "#fff", fontSize: ms(16), fontWeight: "800" },
  cardSubtitle: { color: "#64748b", fontSize: ms(11), marginTop: vs(2) },

  // Form
  label: { color: "#94a3b8", fontSize: ms(12), fontWeight: "600", marginBottom: vs(6), textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: s(10),
    paddingHorizontal: s(14),
    paddingVertical: vs(13),
    color: "#fff",
    fontSize: ms(15),
  },
  inputFocusViolet: { borderColor: "rgba(168,85,247,0.3)" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: s(10),
    paddingHorizontal: s(14),
  },
  pwContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: s(10),
    paddingHorizontal: s(14),
  },
  eyeBtn: { padding: s(6) },

  // Strength
  strengthBar: { flex: 1, height: vs(3), borderRadius: s(4) },
  strengthLabel: { fontSize: ms(10), marginTop: vs(4), fontWeight: "600" },

  // Banner
  banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: s(12),
    borderWidth: 1,
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    marginTop: vs(14),
  },
  bannerSuccess: { backgroundColor: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.25)" },
  bannerError: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)" },
  bannerText: { flex: 1, fontSize: ms(13), fontWeight: "500" },
  bannerTextSuccess: { color: "#34d399" },
  bannerTextError: { color: "#f87171" },

  // Buttons
  submitBtn: { borderRadius: s(12), paddingVertical: vs(15), alignItems: "center", elevation: 6 },
  submitBtnText: { color: "#fff", fontSize: ms(15), fontWeight: "700" },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: s(12),
    paddingVertical: vs(15),
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: { color: "#94a3b8", fontSize: ms(14), fontWeight: "600" },
  clearBtn: {
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
    borderRadius: s(8),
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  clearBtnText: { color: "#64748b", fontSize: ms(11), fontWeight: "600" },
  btnRow: { flexDirection: "row", gap: s(10) },

  // Role picker
  roleBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
  },
  roleBtnActive: { borderColor: "rgba(168,85,247,0.45)", backgroundColor: "rgba(168,85,247,0.1)" },
  roleBtnActiveAdmin: { borderColor: "rgba(251,191,36,0.45)", backgroundColor: "rgba(251,191,36,0.1)" },
  roleBtnText: { color: "#64748b", fontSize: ms(13), fontWeight: "700" },
  roleBtnTextActive: { color: "#a855f7" },
  roleBtnTextActiveAdmin: { color: "#fbbf24" },

  // Section
  sectionTitle: { color: "#64748b", fontSize: ms(11), fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  countBadge: { paddingHorizontal: s(10), paddingVertical: vs(3), borderRadius: s(20), backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  countBadgeText: { color: "#94a3b8", fontSize: ms(11), fontWeight: "700" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: vs(32) },
  emptyIcon: { fontSize: ms(40), marginBottom: vs(8), opacity: 0.4 },
  emptyText: { color: "#475569", fontSize: ms(14) },

  // User row
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: vs(12),
    paddingHorizontal: s(4),
    borderRadius: s(12),
    marginBottom: vs(6),
    borderWidth: 1,
    borderColor: "transparent",
  },
  userRowEditing: {
    backgroundColor: "rgba(168,85,247,0.07)",
    borderColor: "rgba(168,85,247,0.25)",
    paddingHorizontal: s(10),
  },

  // Avatar
  avatar: { width: s(42), height: s(42), borderRadius: s(21), justifyContent: "center", alignItems: "center", flexShrink: 0 },
  avatarText: { color: "#fff", fontSize: ms(14), fontWeight: "800" },

  userName: { color: "#e2e8f0", fontSize: ms(14), fontWeight: "600" },
  userUsername: { color: "#475569", fontSize: ms(11), marginTop: vs(2) },

  // Badges
  badge: { paddingHorizontal: s(7), paddingVertical: vs(2), borderRadius: s(20), borderWidth: 1 },
  badgeAdmin: { backgroundColor: "rgba(251,191,36,0.12)", borderColor: "rgba(251,191,36,0.3)" },
  badgeUser: { backgroundColor: "rgba(148,163,184,0.12)", borderColor: "rgba(148,163,184,0.25)" },
  badgeText: { fontSize: ms(9), fontWeight: "800" },
  badgeTextAdmin: { color: "#fbbf24" },
  badgeTextUser: { color: "#94a3b8" },
  selfBadge: { paddingHorizontal: s(7), paddingVertical: vs(2), borderRadius: s(20), borderWidth: 1, backgroundColor: "rgba(52,211,153,0.12)", borderColor: "rgba(52,211,153,0.3)" },
  selfBadgeText: { color: "#34d399", fontSize: ms(9), fontWeight: "800" },

  // Actions
  actions: { flexDirection: "row", gap: s(6) },
  actionBtn: { width: s(36), height: s(36), borderRadius: s(10), justifyContent: "center", alignItems: "center", borderWidth: 1 },
  actionBtnEdit: { backgroundColor: "rgba(168,85,247,0.08)", borderColor: "rgba(168,85,247,0.2)" },
  actionBtnDelete: { backgroundColor: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" },
});
