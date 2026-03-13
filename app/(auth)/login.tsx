import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Toast } from "@/components/CustomToast";
import * as Haptics from "expo-haptics";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = validateEmail(email) && password.length >= 6;

  const onGoogleButtonPress = async () => {
    Toast.show({
      type: "info",
      text1: "Google Sign-In",
      text2: "Social login is currently unavailable.",
    });
  };

  const handleSubmit = async () => {
    if (isFormValid) {
      setLoading(true);
      try {
        // 1. Sign in with Supabase Auth
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) throw error;

        // 2. Success handling
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        Toast.show({
          type: "success",
          text1: "Welcome Back!",
          text2: "Login successful",
        });

        // Navigate to the main app
        router.replace("/(drawer)/(tabs)");
      } catch (error: any) {
        // Handle incorrect credentials or network issues
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: error.message || "Please check your credentials.",
        });
      } finally {
        setLoading(false);
      }
    } else {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: "Please enter valid credentials.",
      });
    }
  };
  const handleForgotPassword = () => {
    // 1. Validation Fail
    if (!email || !validateEmail(email)) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Toast.show({
        type: "error",
        text1: "Email Required",
        text2: "Please enter a valid email to reset your password.",
      });
      return;
    }

    // 2. Validation Success
    if (Platform.OS !== "web") {
      // Use Success or Medium Impact for positive navigation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    router.push({
      pathname: "/forgot_password",
      params: { userEmail: email },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6 pb-12"
        >
          <View className="justify-between flex-1">
            {/* TOP SECTION */}
            <View>
              <View className="mb-6">
                <BackButton />
              </View>

              <View className="mb-10">
                <Text className="text-3xl font-bold">
                  Continue Your Journey
                </Text>
                <Text className="text-gray-500">
                  Welcome back. Let’s continue your journey.
                </Text>
              </View>

              <View className="gap-y-4">
                <TextInput
                  className="px-4 py-4 bg-white border border-gray-300 rounded-xl focus:border-emerald-600 focus:border-2"
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="username"
                  autoComplete="email"
                  value={email}
                  onChangeText={setEmail}
                />

                <View className="relative justify-center">
                  <TextInput
                    className="px-4 py-4 bg-white border border-gray-300 rounded-xl focus:border-emerald-600 focus:border-2"
                    placeholder="Password"
                    secureTextEntry={!show}
                    autoCapitalize="none"
                    textContentType="password"
                    autoComplete="password"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShow(!show)}
                    className="absolute right-4"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons
                      name={!show ? "eye-off" : "eye"}
                      size={24}
                      color="#888"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                disabled={!isFormValid || loading}
                onPress={handleSubmit}
                activeOpacity={0.7}
                className={`py-4 rounded-xl mt-6 ${isFormValid && !loading ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-bold text-center text-white">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View className="flex-row items-center my-6">
                <View className="flex-1 h-[1px] bg-gray-200" />
                <Text className="mx-4 text-gray-400">or</Text>
                <View className="flex-1 h-[1px] bg-gray-200" />
              </View>

              {/* Social Buttons Section */}
              <View className="gap-y-3">
                <TouchableOpacity
                  className="flex-row items-center justify-center py-4 bg-white border border-gray-300 rounded-xl"
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="apple"
                    size={24}
                    color="black"
                  />
                  <Text className="ml-3 text-base font-semibold text-black">
                    Continue with Apple
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center justify-center py-4 bg-white border border-gray-300 rounded-xl"
                  activeOpacity={0.7}
                  onPress={onGoogleButtonPress}
                >
                  <MaterialCommunityIcons
                    name="google"
                    size={20}
                    color="#4285F4"
                  />
                  <Text className="ml-3 text-base font-semibold text-gray-700">
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BOTTOM SECTION */}
            <View className="items-center mt-8 gap-y-2">
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text className="font-bold text-emerald-600">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
              <View className="flex-row justify-center mt-4">
                <Text className="text-gray-500">
                  Don&apos;t have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register")}
                >
                  <Text className="font-bold text-emerald-600">Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;
