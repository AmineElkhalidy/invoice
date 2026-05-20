import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LocaleProvider } from "../context/LocaleProvider";

export default function RootLayout() {
  return (
    <LocaleProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#020617" },
          animation: "fade",
        }}
      />
    </LocaleProvider>
  );
}
