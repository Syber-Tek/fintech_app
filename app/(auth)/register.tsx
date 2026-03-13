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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BackButton from "@/components/BackButton";
import StepIndicator from "@/components/StepIndicator";
import { OtpInput } from "react-native-otp-entry";
import { Toast } from "@/components/CustomToast";
import SuccessScreen from "@/components/SuccessScreen";
import AllDone from "@/components/AllDone";
import { Checkbox } from "expo-checkbox";
import { useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import PhoneInput from "react-native-international-phone-number";
import * as Haptics from "expo-haptics";
import CurrencyPicker from "@/components/CurrencyPicker";
import { setItem } from "@/utils/asyncStorage";
import { supabase } from "@/lib/supabase";

const Register = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const onGoogleButtonPress = async () => {
    Toast.show({
      type: "info",
      text1: "Google Sign-In",
      text2: "Social registration is currently unavailable.",
    });
  };

  // Step 1 States (Email & Password)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [emailCode, setEmailCode] = useState("");

  // Step 2 States (Phone Verification)
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<any>(undefined);
  const [isPhoneSubmitted, setIsPhoneSubmitted] = useState(false);
  const [smsCode, setSmsCode] = useState("");

  // Step 3 States (Profile Info & DOB)
  const [innerStep, setInnerStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [isDobSet, setIsDobSet] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

  // ── NEW: Step 4 — Transaction Pin ──────────────────────
  const [txPin, setTxPin] = useState<string[]>(["", "", "", ""]);

  // ── NEW: Step 5 — Primary Currency ────────────────────
  const [selectedCurrency, setSelectedCurrency] = useState("GHS");

  // Visibility States
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [showPhoneSuccess, setShowPhoneSuccess] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [showAllDone, setShowAllDone] = useState(false);

  // Validations
  const isPasswordValid =
    password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  const isProfileValid = firstName.trim() !== "" && lastName.trim() !== "";

  const cleanPhone = phone.replace(/[^0-9]/g, "");

  const isPhoneValid = React.useMemo((): boolean => {
    if (!selectedCountry) return cleanPhone.length >= 9;
    const minLength = 8;
    const maxLength = 15;
    return cleanPhone.length >= minLength && cleanPhone.length <= maxLength;
  }, [cleanPhone, selectedCountry]);

  // ── NEW: Pin helpers ───────────────────────────────────
  const isTxPinComplete = txPin.every((d) => d !== "");

  const handleTxPinChange = (value: string, index: number) => {
    const updated = [...txPin];
    updated[index] = value.slice(-1);
    setTxPin(updated);
  };

  const handleTxPinDelete = (index: number) => {
    const updated = [...txPin];
    updated[index] = "";
    setTxPin(updated);
  };
  // ──────────────────────────────────────────────────────

  const handleSendEmailCode = () => {
    setIsEmailVerified(false);
    triggerSuccessHaptic();
    Toast.show({ type: "success", text2: "Email code sent!" });
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // 1. Create the user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Insert into the profiles table in the 'fintech' schema
        const { error: profileError } = await supabase
          .schema("fintech")
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              first_name: firstName,
              last_name: lastName,
              dob: dob.toISOString().split("T")[0],
              phone_number: phone,
              transaction_pin: txPin.join(""),
              primary_currency: selectedCurrency,
            },
          ]);

        if (profileError) throw profileError;

        setShowAllDone(true);
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (selectedDate) {
      setDob(selectedDate);
      setIsDobSet(true);
    }
  };

  const triggerSuccessHaptic = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSendPhoneCode = () => {
    if (!isPhoneValid) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Toast.show({
        type: "error",
        text1: "Invalid Number",
        text2: `Please enter a valid number for ${selectedCountry?.name?.en || "your country"}.`,
        visibilityTime: 3000,
      });
      return;
    }
    triggerSuccessHaptic();
    setIsPhoneSubmitted(true);
  };

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const currencyFlags: { [key: string]: string } = {
    GHS: "🇬🇭",
    NGN: "🇳🇬",
    USD: "🇺🇸",
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
          <View className="mb-4">
            <BackButton />
          </View>

          <AllDone
            visible={showAllDone}
            onContinue={() => {
              setShowAllDone(false);
              router.replace("/(drawer)/(tabs)");
            }}
          />

          <SuccessScreen
            visible={showEmailSuccess}
            title="Email verified"
            description="Your email address has been verified successfully"
            onContinue={() => {
              setShowEmailSuccess(false);
              setStep(2);
            }}
          />

          <SuccessScreen
            visible={showPhoneSuccess}
            title="Verification complete"
            description="Your Phone number has been verified."
            onContinue={() => {
              setShowPhoneSuccess(false);
              setStep(3);
            }}
          />

          <View className="items-center justify-center mb-8">
            <StepIndicator currentStep={step} />
          </View>

          {/* STEP 1: EMAIL & PASSWORD */}
          {step === 1 && (
            <View className="flex-1">
              {isEmailVerified ? (
                <View className="gap-y-6">
                  <View>
                    <Text className="text-3xl font-bold">
                      Create your account
                    </Text>
                    <Text className="mt-2 text-gray-500">
                      Join the thousands already growing with us
                    </Text>
                  </View>

                  <View className="gap-y-4">
                    <TextInput
                      className="px-4 py-4 bg-white border border-gray-300 rounded-xl focus:border-emerald-600 focus:border-2"
                      placeholder="Email"
                      keyboardType="email-address"
                      autoComplete="email"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />

                    <View className="relative justify-center">
                      <TextInput
                        className="px-4 py-4 bg-white border border-gray-300 rounded-xl focus:border-emerald-600 focus:border-2"
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-4"
                      >
                        <MaterialCommunityIcons
                          name={showPassword ? "eye" : "eye-off"}
                          size={22}
                          color="#888"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    className={`py-4 rounded-xl ${email.includes("@") && isPasswordValid ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
                    onPress={handleSendEmailCode}
                    disabled={!email.includes("@") || !isPasswordValid}
                  >
                    <Text className="text-lg font-bold text-center text-white">
                      Continue
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center my-2">
                    <View className="flex-1 h-[1px] bg-gray-200" />
                    <Text className="mx-4 text-gray-400">or</Text>
                    <View className="flex-1 h-[1px] bg-gray-200" />
                  </View>

                  <View className="gap-y-3">
                    <TouchableOpacity className="flex-row items-center justify-center py-4 bg-white border border-gray-300 rounded-xl">
                      <MaterialCommunityIcons
                        name="apple"
                        size={24}
                        color="black"
                      />
                      <Text className="ml-3 text-base font-semibold">
                        Continue with Apple
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center justify-center py-4 bg-white border border-gray-300 rounded-xl"
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

                  <View className="flex-row justify-center mt-4">
                    <Text className="text-gray-500">
                      Already have an account?{" "}
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/(auth)/login")}
                    >
                      <Text className="font-bold text-emerald-600">
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View className="gap-y-6">
                  <Text className="text-3xl font-bold">Verify your email</Text>
                  <OtpInput
                    numberOfDigits={5}
                    onTextChange={setEmailCode}
                    focusColor="#059669"
                    autoFocus={true}
                  />
                  <TouchableOpacity
                    className={`py-4 rounded-xl ${emailCode.length === 5 ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
                    onPress={() => setShowEmailSuccess(true)}
                    disabled={!emailCode}
                  >
                    <Text className="text-lg font-bold text-center text-white">
                      Verify
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* STEP 2: PHONE VERIFICATION */}
          {step === 2 && (
            <View className="flex-1">
              {!isPhoneSubmitted ? (
                <View className="flex-1 gap-y-6">
                  <View>
                    <Text className="text-3xl font-bold">
                      Verify your phone number with code
                    </Text>
                    <Text className="mt-2 text-gray-500">
                      We&apos;ll send you a code. It helps keep your account
                      secure.
                    </Text>
                  </View>
                  <View>
                    <Text className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Your Phone number
                    </Text>
                    <PhoneInput
                      value={phone}
                      onChangePhoneNumber={(number: string) => setPhone(number)}
                      selectedCountry={selectedCountry}
                      onChangeSelectedCountry={(country: any) =>
                        setSelectedCountry(country)
                      }
                      defaultCountry="GH"
                      placeholder="Phone number"
                      onFocus={() => setIsPhoneFocused(true)}
                      onBlur={() => setIsPhoneFocused(false)}
                      phoneInputStyles={{
                        container: {
                          width: "100%",
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isPhoneFocused ? "#059669" : "#e5e7eb",
                          backgroundColor: "#f9fafb",
                        },
                        input: {
                          backgroundColor: "transparent",
                          paddingVertical: 0,
                        },
                      }}
                    />
                  </View>
                  <TouchableOpacity
                    className={`py-4 rounded-xl mt-auto ${isPhoneValid ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
                    onPress={handleSendPhoneCode}
                    disabled={!isPhoneValid}
                  >
                    <Text className="text-lg font-bold text-center text-white">
                      Send code
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-1 gap-y-6">
                  <View>
                    <Text className="text-3xl font-bold">
                      We just sent an SMS
                    </Text>
                    <Text className="mt-2 text-gray-500">
                      Enter the security code we sent to {phone}
                    </Text>
                  </View>
                  <OtpInput
                    numberOfDigits={6}
                    onTextChange={setSmsCode}
                    focusColor="#059669"
                    autoFocus={true}
                  />
                  <TouchableOpacity
                    className={`py-4 rounded-xl mt-auto ${smsCode.length === 6 ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
                    onPress={() => setShowPhoneSuccess(true)}
                    disabled={!smsCode}
                  >
                    <Text className="text-lg font-bold text-center text-white">
                      Done
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* STEP 3: PROFILE & DOB */}
          {step === 3 && (
            <View className="flex-1">
              {innerStep === 1 ? (
                <View className="flex-1 gap-y-6">
                  <View>
                    <Text className="text-3xl font-bold">
                      Lastly, tell us more about yourself
                    </Text>
                    <Text className="mt-2 text-sm text-gray-500">
                      Please enter your legal name. This information will be
                      used to verify your account.
                    </Text>
                  </View>
                  <View className="gap-y-4">
                    <View>
                      <Text className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                        First name
                      </Text>
                      <TextInput
                        className="px-4 py-4 border border-gray-300 rounded-xl focus:border-emerald-600 focus:border-2"
                        placeholder="First name"
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="words"
                      />
                    </View>
                    <View>
                      <Text className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                        Last name
                      </Text>
                      <TextInput
                        className="px-4 py-4 border border-gray-300 rounded-xl focus:border-emerald-600 focus:border-2"
                        placeholder="Last name"
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    className={`py-4 rounded-xl mt-auto ${isProfileValid ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
                    onPress={() => setInnerStep(2)}
                  >
                    <Text className="text-lg font-bold text-center text-white">
                      Continue
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-1 gap-y-6">
                  <View>
                    <Text className="text-3xl font-bold">
                      What is your date of birth?
                    </Text>
                    <Text className="mt-2 text-gray-500">
                      We need your DOB to verify your account
                    </Text>
                  </View>
                  <View>
                    <Text className="mb-2 text-xs font-semibold text-gray-400 uppercase">
                      Date of birth
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowPicker(true)}
                      className="flex-row items-center justify-between px-4 py-4 bg-white border border-gray-300 rounded-xl"
                    >
                      <Text
                        className={isDobSet ? "text-black" : "text-gray-400"}
                      >
                        {isDobSet ? dob.toLocaleDateString() : "MM/DD/YYYY"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity className="flex-row items-center gap-x-2">
                    <MaterialCommunityIcons
                      name="plus-circle"
                      size={20}
                      color="#059669"
                    />
                    <Text className="font-semibold text-emerald-700">
                      Add a Referral code
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row items-start mt-2 gap-x-3">
                    <Checkbox
                      value={marketingAccepted}
                      onValueChange={setMarketingAccepted}
                      color={marketingAccepted ? "#059669" : undefined}
                    />
                    <Text className="flex-1 text-sm text-gray-600">
                      Check box to be informed about marketing information or
                      any special offer
                    </Text>
                  </View>

                  <Text className="text-[10px] text-gray-400">
                    By registering, you agree to our{" "}
                    <Text className="font-bold text-emerald-700">
                      Terms of use
                    </Text>{" "}
                    and{" "}
                    <Text className="font-bold text-emerald-700">
                      Privacy Policies
                    </Text>
                  </Text>

                  {showPicker && (
                    <DateTimePicker
                      value={dob}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onDateChange}
                      maximumDate={new Date()}
                      minimumDate={new Date(1920, 0, 1)}
                    />
                  )}

                  <TouchableOpacity
                    className={`py-4 rounded-xl mt-auto ${isDobSet ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
                    onPress={() => setStep(4)} // ← goes to pin step now
                    disabled={!isDobSet}
                  >
                    <Text className="text-lg font-bold text-center text-white">
                      Continue
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* ── STEP 4: SET TRANSACTION PIN ── */}
          {step === 4 && (
            <View className="flex-1">
              <View className="mb-10 gap-y-3">
                <Text className="text-3xl font-bold text-center">
                  Set Transaction Pin
                </Text>
                <Text className="text-sm text-center text-gray-500">
                  This pin will be required whenever you{"\n"}want to carryout a
                  transaction, keep it safe.
                </Text>
              </View>

              {/* Dot indicators */}
              <View className="flex-row justify-center mb-10 gap-x-3">
                {txPin.map((val, i) => (
                  <View
                    key={i}
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: val !== "" ? "#059669" : "#d1d5db",
                    }}
                  />
                ))}
              </View>

              {/* Numpad */}
              <View className="mb-10 gap-y-4">
                {[
                  [1, 2, 3],
                  [4, 5, 6],
                  [7, 8, 9],
                ].map((row, ri) => (
                  <View key={ri} className="flex-row justify-around">
                    {row.map((num) => (
                      <TouchableOpacity
                        key={num}
                        className="items-center justify-center w-20 h-20 bg-gray-100 rounded-full"
                        onPress={() => {
                          const emptyIndex = txPin.findIndex((d) => d === "");
                          if (emptyIndex !== -1)
                            handleTxPinChange(String(num), emptyIndex);
                        }}
                      >
                        <Text className="text-2xl font-semibold text-gray-800">
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                <View className="flex-row justify-around">
                  <View className="w-20 h-20" />
                  <TouchableOpacity
                    className="items-center justify-center w-20 h-20 bg-gray-100 rounded-full"
                    onPress={() => {
                      const emptyIndex = txPin.findIndex((d) => d === "");
                      if (emptyIndex !== -1) handleTxPinChange("0", emptyIndex);
                    }}
                  >
                    <Text className="text-2xl font-semibold text-gray-800">
                      0
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="items-center justify-center w-20 h-20 bg-gray-100 rounded-full"
                    onPress={() => {
                      const lastFilled = [...txPin]
                        .map((v, i) => ({ v, i }))
                        .filter((x) => x.v !== "")
                        .pop();
                      if (lastFilled) handleTxPinDelete(lastFilled.i);
                    }}
                  >
                    <MaterialCommunityIcons
                      name="backspace-outline"
                      size={24}
                      color="#374151"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                className={`py-4 rounded-2xl ${isTxPinComplete ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
                onPress={() => {
                  if (isTxPinComplete) setStep(5);
                }}
                disabled={!isTxPinComplete}
              >
                <Text className="text-lg font-bold text-center text-white">
                  Set Pin
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 5: SET PRIMARY CURRENCY ── */}
          {step === 5 && (
            <View className="flex-1">
              <View className="mb-10 gap-y-3">
                <Text className="text-3xl font-bold text-center">
                  Set Primary Currency
                </Text>
                <Text className="text-sm text-center text-gray-500">
                  Choose the primary currency for your{"\n"}account. This can
                  not be changed
                </Text>
              </View>

              {/* Currency Selector */}
              <TouchableOpacity
                className="flex-row items-center justify-between px-4 py-4 mb-10 border border-gray-200 rounded-2xl bg-gray-50"
                onPress={() => setShowCurrencyPicker(true)}
              >
                <Text className="font-medium text-gray-700">
                  Select Currency
                </Text>
                <View className="flex-row items-center gap-x-2">
                  <Text className="text-lg">
                    {currencyFlags[selectedCurrency]}
                  </Text>
                  <Text className="font-semibold text-gray-700">
                    {selectedCurrency}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={20}
                    color="#6b7280"
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className={`py-4 rounded-2xl bg-emerald-700 ${loading ? "opacity-50" : ""}`}
                disabled={loading}
                onPress={async () => {
                  await setItem("currency", selectedCurrency);
                  handleFinalSubmit();
                }}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-lg font-bold text-center text-white">
                    Set Currency
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
      <CurrencyPicker
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        selected={selectedCurrency}
        onSelect={setSelectedCurrency}
      />
    </SafeAreaView>
  );
};

export default Register;
