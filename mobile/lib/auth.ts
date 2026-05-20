import AsyncStorage from "@react-native-async-storage/async-storage";

const VALID_USERNAME = "admin";
const VALID_PASSWORD = "password";
const SESSION_KEY = "invoice_session";

export async function loginClient(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (username === VALID_USERNAME && password === VALID_PASSWORD) {
    await AsyncStorage.setItem(SESSION_KEY, "authenticated");
    return { success: true };
  }
  return { success: false, error: "invalid_credentials" };
}

export async function logoutClient(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function getSessionClient(): Promise<boolean> {
  const val = await AsyncStorage.getItem(SESSION_KEY);
  return val === "authenticated";
}
