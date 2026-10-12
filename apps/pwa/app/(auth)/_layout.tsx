import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { initAuthStore, useAuthStore } from "@features/auth/stores/authStore";

export default function AuthLayout() {
  const router = useRouter();
  const { status } = useAuthStore();

  useEffect(() => {
    void initAuthStore();
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/(app)/home");
    }
  }, [status, router]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="login" />
    </Stack>
  );
}
