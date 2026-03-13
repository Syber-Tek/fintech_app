import React, { useState, useEffect } from "react";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { OtpInput } from "react-native-otp-entry";
import BackButton from "@/components/BackButton";
import SuccessScreen from "@/components/SuccessScreen";
import PhoneInput from "react-native-international-phone-number";
import { Toast } from "@/components/CustomToast";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";

const ForgotPassword = () => {
  const router = useRouter();
  const { userEmail } = useLocalSearchParams();
  const [step, setStep] = useState(1); // 1: Method, 2: Phone Input (if SMS), 3: OTP, 4: Reset
  const [loading, setLoading] = useState(false);

  // States
  const [method, setMethod] = useState<"email" | "sms" | null>(null);
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<any>(undefined);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(45);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step === 3 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, step]);

  useEffect(() => {
    const handleDeepLink = (url: string | null) => {
      if (!url) return;

      // Check if the URL contains the recovery type or our path
      if (url.includes("type=recovery") || url.includes("forgot_password")) {
        setStep(4); // Jump straight to the "Create New Password" step
      }
    };

    // 1. If the app was completely closed, get the URL that opened it
    Linking.getInitialURL().then(handleDeepLink);

    // 2. If the app was in the background, listen for the new URL
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  const handleMethodContinue = async () => {
    if (method === "sms") {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithOtp({
          // Make sure 'phone' includes the '+' and country code (e.g., +233...)
          phone: phone,
        });
        if (error) throw error;
        setStep(3); // Move to the OTP verification step
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Error", text2: error.message });
      } finally {
        setLoading(false);
      }
    } else if (method === "email") {
      if (!userEmail) {
        Toast.show({
          type: "error",
          text1: "Email Required",
          text2: "No email address found.",
        });
        return;
      }
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(
          userEmail as string,
          {
            // Updated to match your app.json scheme 'fintech'
            redirectTo: "fintech://forgot_password",
          },
        );
        if (error) throw error;
        setShowEmailSent(true);
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Error", text2: error.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      });
      if (error) throw error;
      setStep(4); // Move to password reset
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Invalid Code",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      // Success!
      setShowSuccess(true);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid =
    newPassword.length >= 8 &&
    /[a-zA-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword);
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword.length > 0;

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
          <View className="mb-6">
            <BackButton />
          </View>

          <SuccessScreen
            visible={showSuccess}
            title="Password created"
            description="Your password has been created"
            onContinue={() => {
              setShowSuccess(false);
              router.replace("/login");
            }}
          />

          <SuccessScreen
            visible={showEmailSent}
            title="Email Sent"
            description={`A password reset link has been sent to ${userEmail}`}
            onContinue={() => {
              setShowEmailSent(false);
              router.replace("/(auth)/login");
            }}
          />

          {/* STEP 1: SELECT RESET METHOD */}
          {step === 1 && (
            <View className="flex-1">
              <Text className="text-3xl font-bold">Forgot Password?</Text>
              <Text className="mt-2 text-gray-500">
                Select which contact details we should use to reset your
                password.
              </Text>

              <View className="mt-10 gap-y-4">
                <TouchableOpacity
                  onPress={() => setMethod("sms")}
                  className={`flex-row items-center p-4 border rounded-2xl ${method === "sms" ? "border-emerald-600 bg-emerald-50" : "border-gray-200"}`}
                >
                  <View className="p-3 bg-gray-100 rounded-full">
                    <MaterialCommunityIcons
                      name="comment-text-outline"
                      size={24}
                      color="#059669"
                    />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-xs text-gray-400 uppercase">
                      via SMS
                    </Text>
                    <Text className="font-bold text-gray-900">
                      Reset via Phone Number
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMethod("email")}
                  className={`flex-row items-center p-4 border rounded-2xl ${method === "email" ? "border-emerald-600 bg-emerald-50" : "border-gray-200"}`}
                >
                  <View className="p-3 bg-gray-100 rounded-full">
                    <MaterialCommunityIcons
                      name="email-outline"
                      size={24}
                      color="#059669"
                    />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-xs text-gray-400 uppercase">
                      via Email
                    </Text>
                    <Text className="font-bold text-gray-900 truncate">
                      {userEmail || "Reset via Email"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                disabled={!method || loading}
                onPress={handleMethodContinue}
                className={`py-4 rounded-xl mt-auto ${method && !loading ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-bold text-center text-white">
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: PHONE NUMBER INPUT (Only for SMS) */}
          {step === 2 && (
            <View className="flex-1 gap-y-6">
              <View>
                <Text className="text-3xl font-bold">
                  What&apos;s your number?
                </Text>
                <Text className="mt-2 text-gray-500">
                  Enter the phone number associated with your account to receive
                  a code.
                </Text>
              </View>

              <View>
                <Text className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                  Phone number
                </Text>
                <PhoneInput
                  value={phone}
                  onChangePhoneNumber={setPhone}
                  selectedCountry={selectedCountry}
                  onChangeSelectedCountry={setSelectedCountry}
                  defaultCountry="GH"
                  phoneInputStyles={{
                    container: {
                      borderRadius: 12,
                      borderColor: "#e5e7eb",
                      height: 56,
                    },
                  }}
                />
              </View>

              <TouchableOpacity
                disabled={!phone}
                onPress={() => setStep(3)}
                className={`py-4 rounded-xl mt-auto ${phone ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
              >
                <Text className="text-lg font-bold text-center text-white">
                  Send code
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: OTP VERIFICATION */}
          {step === 3 && (
            <View className="flex-1">
              <Text className="text-3xl font-bold">Verify Code</Text>
              <Text className="mt-2 text-gray-500">
                Enter the code sent to {method === "email" ? userEmail : phone}
              </Text>

              <View className="mt-10">
                <OtpInput
                  numberOfDigits={6}
                  onTextChange={setOtp}
                  focusColor="#059669"
                />
              </View>

              <View className="flex-row items-center justify-between mt-6">
                <TouchableOpacity disabled={!canResend}>
                  <Text
                    className={`text-gray-600 ${canResend ? "" : "opacity-50"}`}
                  >
                    Didn&apos;t get the code?{" "}
                    <Text className="font-bold text-emerald-700">
                      Resend it
                    </Text>
                  </Text>
                </TouchableOpacity>
                <Text className="text-gray-400">{timeLeft}s</Text>
              </View>

              <TouchableOpacity
                disabled={otp.length !== 6 || loading}
                onPress={handleVerifyOtp}
                className={`py-4 rounded-xl mt-auto ${otp.length === 6 && !loading ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-bold text-center text-white">
                    Verify
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: RESET PASSWORD */}
          {step === 4 && (
            <View className="flex-1 gap-y-6">
              <View>
                <Text className="text-3xl font-bold">Create new password</Text>
                <Text className="mt-2 text-gray-500">
                  Choose a strong password to protect your account.
                </Text>
              </View>

              <View className="gap-y-4">
                <View>
                  <Text className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                    New Password
                  </Text>
                  <View className="relative justify-center">
                    <TextInput
                      className={`px-4 py-4 bg-white border rounded-xl ${newPassword.length > 0 ? "border-emerald-600" : "border-gray-200"}`}
                      placeholder="New Password"
                      secureTextEntry={!showPass}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPass(!showPass)}
                      className="absolute right-4"
                    >
                      <MaterialCommunityIcons
                        name={showPass ? "eye" : "eye-off"}
                        size={22}
                        color="#888"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                    Confirm Password
                  </Text>
                  <View className="relative justify-center">
                    <TextInput
                      className={`px-4 py-4 bg-white border rounded-xl ${passwordsMatch ? "border-emerald-600" : "border-gray-200"}`}
                      placeholder="Confirm Password"
                      secureTextEntry={!showConfirmPass}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-4"
                    >
                      <MaterialCommunityIcons
                        name={showConfirmPass ? "eye" : "eye-off"}
                        size={22}
                        color="#888"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                disabled={!isPasswordValid || !passwordsMatch || loading}
                onPress={handleUpdatePassword}
                className={`py-4 rounded-xl mt-auto ${isPasswordValid && passwordsMatch && !loading ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-bold text-center text-white">
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
