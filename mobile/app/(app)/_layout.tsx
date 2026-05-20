import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useLocale } from "../../context/LocaleProvider";

function TabIcon({ name, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    receipt: "📄",
    people: "👥",
  };
  return <Text style={{ fontSize: size - 4 }}>{icons[name] || "•"}</Text>;
}

export default function AppLayout() {
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "rgba(255,255,255,0.1)",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#34d399",
        tabBarInactiveTintColor: "#64748b",
        tabBarLabelStyle: {
          fontSize: 11,
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
        name="invoice"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
