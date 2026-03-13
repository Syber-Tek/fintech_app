import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ToastProvider } from "@/components/CustomToast";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { supabase } from "@/lib/supabase";
import { MotiView, AnimatePresence } from "moti";

SplashScreen.preventAutoHideAsync();

function CustomSplashScreen() {
    return (
        <View style={{ flex: 1, backgroundColor: "#007b4b", justifyContent: "center", alignItems: "center" }}>
            <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 1000 }}
            >
                <Text style={{ fontSize: 42, fontWeight: "bold", color: "white", letterSpacing: 2 }}>
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

    useEffect(() => {
        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setInitializing(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (initializing) setInitializing(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (initializing) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inTabsGroup = segments[0] === "(drawer)";
        const inOnboarding = segments[0] === "(screens)" && segments[1] === "onboarding";

        if (user && (inAuthGroup || inOnboarding || segments.length === 0 || segments[0] === "index")) {
            // If logged in, go to main app
            router.replace("/(drawer)/(tabs)");
        } else if (!user && inTabsGroup) {
            // If not logged in and trying to access tabs, go to login
            router.replace("/(auth)/login");
        }
    }, [user, initializing, segments]);

    useEffect(() => {
        async function prepare() {
            try {
                // Pre-load fonts or other assets here if needed
                await new Promise(resolve => setTimeout(resolve, 2000)); // Show splash for 2s
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

    if (initializing || !appIsReady) {
        return <CustomSplashScreen />;
    }

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