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

        <Text style={[styles.label, { marginTop: 16 }]}>{t("password")}</Text>
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
    padding: 24,
  },
  langToggle: {
    position: "absolute",
    top: 56,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  langToggleText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  logoWrap: {
    marginBottom: 16,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
    marginBottom: 28,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 24,
  },
  label: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 8,
    fontWeight: "500",
  },
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
  errorBox: {
    marginTop: 16,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
  },
  button: {
    marginTop: 20,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
