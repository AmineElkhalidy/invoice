import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useState, useEffect } from "react";
import { useLocale } from "../../context/LocaleProvider";
import { getSessionClient } from "../../lib/auth";
import { ms, vs } from "../../lib/responsive";

function TabIcon({ name, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    receipt: "📄",
    people: "👥",
    history: "📋",
    settings: "⚙️",
  };
  return <Text style={{ fontSize: ms(size - 4) }}>{icons[name] || "•"}</Text>;
}

export default function AppLayout() {
  const { t } = useLocale();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const session = await getSessionClient();
      setIsAdmin(session?.role === "admin");
    })();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
          height: vs(60),
          paddingBottom: vs(8),
          paddingTop: vs(8),
        },
        tabBarActiveTintColor: "#34d399",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: ms(11),
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabInvoice"),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t("tabClients"),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="people" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("tabHistory"),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="history" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabSettings"),
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="invoice"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
