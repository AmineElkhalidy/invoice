import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { getSessionClient } from "../lib/auth";

export default function IndexScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const isAuth = await getSessionClient();
      if (isAuth) {
        router.replace("/(app)/dashboard");
      } else {
        router.replace("/login");
      }
      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#020617" }}>
        <ActivityIndicator size="large" color="#34d399" />
      </View>
    );
  }

  return null;
}
