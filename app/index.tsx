import { View, ActivityIndicator } from "react-native";
import React, { useEffect } from "react";
import { getItem } from "@/utils/asyncStorage";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const router = useRouter();

  useEffect(() => {
    const checkAndNavigate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const onboarded = await getItem("onboarded");

        if (session) {
          // If logged in, go to main app
          router.replace("/(drawer)/(tabs)");
        } else if (onboarded === "true") {
          // If not logged in but onboarded, go to login
          router.replace("/(auth)/login");
        } else {
          // Otherwise, go to onboarding
          router.replace("/(screens)/onboarding");
        }
      } catch (error) {
        console.error("Initial check failed:", error);
        router.replace("/(screens)/onboarding");
      }
    };
    checkAndNavigate();
  }, [router]);
  return (
    <View className="items-center justify-center flex-1 bg-white">
      <ActivityIndicator size="large" color="#059669" />
    </View>
  );
};

export default Index;
