import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { loginClient } from "../lib/auth";
import { useLocale } from "../context/LocaleProvider";
import { s, vs, ms } from "../lib/responsive";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t, locale, toggleLocale } = useLocale();
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const result = await loginClient(username, password);
    if (result.success) {
      router.replace("/(app)/dashboard");
    } else {
      setError(result.error || "invalid_credentials");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Language toggle */}
      <TouchableOpacity style={styles.langToggle} onPress={toggleLocale}>
        <Text style={styles.langToggleText}>{t("switchLang")}</Text>
      </TouchableOpacity>

      {/* Logo */}
      <View style={styles.logoWrap}>
        <LinearGradient
          colors={["#34d399", "#14b8a6"]}
          style={styles.logoBox}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.logoIcon}>⛽</Text>
        </LinearGradient>
      </View>

      <Text style={styles.title}>{t("loginTitle")}</Text>
      <Text style={styles.subtitle}>{t("appTitle")}</Text>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.label}>{t("username")}</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="admin"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { marginTop: vs(16) }]}>{t("password")}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#64748b"
          secureTextEntry
        />

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{t("loginError")}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#10b981", "#14b8a6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, loading && { opacity: 0.6 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{t("loginButton")}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    justifyContent: "center",
    alignItems: "center",
    padding: s(24),
  },
  langToggle: {
    position: "absolute",
    top: vs(56),
    right: s(20),
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: s(8),
  },
  langToggleText: {
    color: "#94a3b8",
    fontSize: ms(13),
    fontWeight: "600",
  },
  logoWrap: {
    marginBottom: vs(16),
  },
  logoBox: {
    width: s(56),
    height: s(56),
    borderRadius: s(16),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.3,
    shadowRadius: s(12),
    elevation: 8,
  },
  logoIcon: {
    fontSize: ms(28),
  },
  title: {
    fontSize: ms(24),
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: ms(14),
    color: "#94a3b8",
    marginTop: vs(4),
    marginBottom: vs(28),
  },
  card: {
    width: "100%",
    maxWidth: s(400),
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: s(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: s(24),
  },
  label: {
    fontSize: ms(13),
    color: "#94a3b8",
    marginBottom: vs(8),
    fontWeight: "500",
  },
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
  errorBox: {
    marginTop: vs(16),
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: s(10),
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
  },
  errorText: {
    color: "#f87171",
    fontSize: ms(14),
  },
  button: {
    marginTop: vs(20),
    borderRadius: s(10),
    paddingVertical: vs(14),
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.25,
    shadowRadius: s(12),
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "700",
  },
});
