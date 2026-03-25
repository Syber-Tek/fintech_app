import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastProvider } from "@/components/CustomToast";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "@/lib/supabase";
import { MotiView } from "moti";

SplashScreen.preventAutoHideAsync();

function CustomSplashScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#007b4b",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "timing", duration: 1000 }}
      >
        <Text
          style={{
            fontSize: 42,
            fontWeight: "bold",
            color: "white",
            letterSpacing: 2,
          }}
        >
          RingPay
        </Text>
      </MotiView>
    </View>
  );
}

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [appIsReady, setAppIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  const router = useRouter();
  const segments = useSegments();

  // 🔐 AUTH STATE
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setInitializing(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🚦 ROUTE GUARD (FIXED)
  useEffect(() => {
    if (initializing) return;

    const [firstSegment, secondSegment] = segments;

    const inAuthGroup = firstSegment === "(auth)";
    const inTabsGroup = firstSegment === "(drawer)";
    const inOnboarding =
      firstSegment === "(screens)" && secondSegment === "onboarding";

    const isPublicRoute = inAuthGroup || inOnboarding;

    // Logged in → redirect away from auth/onboarding
    if (user && isPublicRoute) {
      router.replace("/(drawer)/(tabs)");
      return;
    }

    // Not logged in → block protected routes
    if (!user && !isPublicRoute) {
      router.replace("/(auth)/login");
    }
  }, [user, initializing, segments]);

  // ⏳ SPLASH CONTROL
  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    if (!initializing) {
      prepare();
    }
  }, [initializing]);

  // 🟢 SHOW SPLASH
  if (initializing || !appIsReady) {
    return <CustomSplashScreen />;
  }

  // 📱 APP
  return (
    <ToastProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(drawer)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(screens)" />
      </Stack>
    </ToastProvider>
  );
}
