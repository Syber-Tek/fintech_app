import { setItem, getItem } from "../../utils/asyncStorage";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

const emerald600 = "#059669";
const emerald700 = "#047857";

// ── Reusable Components ───────────────────────────────────

const SectionLabel = ({ label }: { label: string }) => (
  <Text className="px-5 mt-5 mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
    {label}
  </Text>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <View className="gap-1 mx-5 overflow-hidden">{children}</View>
);

const Divider = () => <View className="h-px mx-4 bg-gray-100" />;

const SettingRow = ({
  icon,
  label,
  sublabel,
  right,
  onPress,
  iconBg,
  iconColor,
  danger,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  iconBg?: string;
  iconColor?: string;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-4 py-4 bg-white rounded-lg "
  >
    <View
      style={{ backgroundColor: iconBg ?? "#ecfdf5" }}
      className="items-center justify-center mr-3 w-9 h-9 rounded-xl"
    >
      <Feather name={icon as any} size={17} color={iconColor ?? emerald600} />
    </View>
    <View className="flex-1">
      <Text
        className="text-sm font-medium"
        style={{ color: danger ? "#ef4444" : "#1f2937" }}
      >
        {label}
      </Text>
      {sublabel && (
        <Text className="text-gray-400 text-xs mt-0.5">{sublabel}</Text>
      )}
    </View>
    {right ?? <Feather name="chevron-right" size={17} color="#d1d5db" />}
  </TouchableOpacity>
);

const ToggleRow = ({
  icon,
  label,
  sublabel,
  value,
  onChange,
  iconBg,
  iconColor,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  iconBg?: string;
  iconColor?: string;
}) => (
  <SettingRow
    icon={icon}
    label={label}
    sublabel={sublabel}
    iconBg={iconBg}
    iconColor={iconColor}
    right={
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }}
        thumbColor={value ? emerald600 : "#9ca3af"}
      />
    }
  />
);

// ── Theme Picker Modal ────────────────────────────────────
const ThemeModal = ({
  visible,
  onClose,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (v: string) => void;
}) => {
  const options = [
    {
      label: "System Default",
      icon: "monitor",
      sub: "Follows your device theme",
    },
    { label: "Light", icon: "sun", sub: "Always use light mode" },
    { label: "Dark", icon: "moon", sub: "Always use dark mode" },
  ];
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View className="justify-end flex-1 bg-black/40">
        <View className="px-5 pt-5 pb-10 bg-white rounded-t-3xl">
          <View className="flex-row items-center justify-between mb-5">
            <Text className="m-4 text-lg font-bold text-gray-900">
              Choose Theme
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt.label}
              onPress={() => {
                onSelect(opt.label);
                onClose();
              }}
              className="flex-row items-center py-4"
            >
              <View
                style={{
                  backgroundColor:
                    selected === opt.label ? "#ecfdf5" : "#f3f4f6",
                }}
                className="items-center justify-center w-10 h-10 mr-3 rounded-xl"
              >
                <Feather
                  name={opt.icon as any}
                  size={18}
                  color={selected === opt.label ? emerald600 : "#6b7280"}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-800">
                  {opt.label}
                </Text>
                <Text className="text-xs text-gray-400">{opt.sub}</Text>
              </View>
              {selected === opt.label && (
                <Feather name="check-circle" size={20} color={emerald600} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

// ── Language Picker Modal ─────────────────────────────────
const LanguageModal = ({
  visible,
  onClose,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (v: string) => void;
}) => {
  const languages = ["English"];
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="justify-end flex-1 bg-black/40">
        <View className="px-5 pt-5 pb-10 bg-white rounded-t-3xl">
          <Text className="mb-4 text-lg font-bold text-gray-900">
            Select Language
          </Text>
          <ScrollView style={{ maxHeight: 320 }}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => {
                  onSelect(lang);
                  onClose();
                }}
                className="flex-row items-center justify-between py-4 border-b border-gray-50"
              >
                <Text className="text-sm font-medium text-gray-800">
                  {lang}
                </Text>
                {selected === lang && (
                  <Feather name="check" size={18} color={emerald600} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── Session Timeout Modal ─────────────────────────────────
const TimeoutModal = ({
  visible,
  onClose,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  selected: string;
  onSelect: (v: string) => void;
}) => {
  const options = [
    "1 minute",
    "5 minutes",
    "15 minutes",
    "30 minutes",
    "1 hour",
    "Never",
  ];
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="justify-end flex-1 bg-black/40">
        <View className="px-5 pt-5 pb-10 bg-white rounded-t-3xl">
          <Text className="mb-4 text-lg font-bold text-gray-900">
            Auto-Lock After
          </Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => {
                onSelect(opt);
                onClose();
              }}
              className="flex-row items-center justify-between py-4 border-b border-gray-50"
            >
              <Text className="text-sm font-medium text-gray-800">{opt}</Text>
              {selected === opt && (
                <Feather name="check" size={18} color={emerald600} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────
export default function SettingsScreen() {
  const router = useRouter();
  // Appearance
  const [theme, setTheme] = useState("System Default");
  const [language, setLanguage] = useState("English");

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Logout Error", error.message);
    }
  };

  // App
  const [sessionTimeout, setSessionTimeout] = useState("5 minutes");
  const [haptics, setHaptics] = useState(true);
  const [sounds, setSounds] = useState(true);

  // Modals
  const [showTheme, setShowTheme] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View style={{ backgroundColor: emerald700 }} className="px-5 pt-6 pb-6">
        <Text className="text-2xl font-bold text-white">Settings</Text>
        <Text className="mt-1 text-sm text-emerald-200">
          Manage your app preferences
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Appearance */}
        <SectionLabel label="Appearance" />
        <Card>
          <SettingRow
            icon="moon"
            label="Theme"
            sublabel="Choose app appearance"
            onPress={() => setShowTheme(true)}
            right={
              <View className="flex-row items-center gap-1">
                <Text className="text-xs text-gray-400">{theme}</Text>
                <Feather name="chevron-right" size={15} color="#d1d5db" />
              </View>
            }
          />
        </Card>

        {/* App Experience */}
        <SectionLabel label="App Experience" />
        <Card>
          <ToggleRow
            icon="zap"
            label="Haptic Feedback"
            sublabel="Vibration on interactions"
            value={haptics}
            onChange={setHaptics}
          />
          <Divider />
          <ToggleRow
            icon="volume-2"
            label="Sound Effects"
            sublabel="Play sounds for actions"
            value={sounds}
            onChange={setSounds}
          />
          <Divider />
          <SettingRow
            icon="refresh-cw"
            label="Check for Updates"
            sublabel="App version 1.0.0"
          />
          <Divider />
          <SettingRow
            icon="star"
            label="Rate the App"
            sublabel="Share your experience"
          />
          <Divider />
          <SettingRow
            icon="share-2"
            label="Share App"
            sublabel="Invite friends to RingPay"
          />
        </Card>

        {/* Support */}
        <SectionLabel label="Support" />
        <Card>
          <SettingRow
            icon="message-circle"
            label="Help & Support"
            sublabel="Chat with us or browse FAQs"
          />
          <Divider />
          <SettingRow icon="file-text" label="Terms & Conditions" />
          <Divider />
          <SettingRow icon="lock" label="Privacy Policy" />
          <Divider />
          <SettingRow
            icon="alert-circle"
            label="Report a Problem"
            sublabel="Let us know what went wrong"
          />
        </Card>

        {/* Danger Zone */}
        <SectionLabel label="Account" />
        <Card>
          <TouchableOpacity
            className="flex-row items-center px-4 py-4 bg-white rounded-lg"
            onPress={() =>
              Alert.alert("Logout", "Are you sure you want to logout?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Logout",
                  style: "destructive",
                  onPress: handleLogout,
                },
              ])
            }
          >
            <View className="items-center justify-center mr-3 w-9 h-9 rounded-xl bg-red-50">
              <Feather name="log-out" size={17} color="#ef4444" />
            </View>
            <Text className="flex-1 text-sm font-medium text-red-500">
              Logout
            </Text>
            <Feather name="chevron-right" size={17} color="#fca5a5" />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            className="flex-row items-center px-4 py-4 bg-white rounded-lg"
            onPress={() =>
              Alert.alert(
                "Delete Account",
                "This action is permanent and cannot be undone. All your data will be lost.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive" },
                ],
              )
            }
          >
            <View className="items-center justify-center mr-3 w-9 h-9 rounded-xl bg-red-50">
              <Feather name="trash-2" size={17} color="#ef4444" />
            </View>
            <Text className="flex-1 text-sm font-medium text-red-500">
              Delete Account
            </Text>
            <Feather name="chevron-right" size={17} color="#fca5a5" />
          </TouchableOpacity>
        </Card>

        {/* App Version Footer */}
        <View className="items-center mt-8 mb-4">
          <Text className="text-xs text-gray-300">
            RingPay v1.0.0 • Made with ❤️
          </Text>
        </View>
      </ScrollView>

      {/* Modals */}
      <ThemeModal
        visible={showTheme}
        onClose={() => setShowTheme(false)}
        selected={theme}
        onSelect={setTheme}
      />
      <LanguageModal
        visible={showLanguage}
        onClose={() => setShowLanguage(false)}
        selected={language}
        onSelect={setLanguage}
      />
      <TimeoutModal
        visible={showTimeout}
        onClose={() => setShowTimeout(false)}
        selected={sessionTimeout}
        onSelect={setSessionTimeout}
      />
    </View>
  );
}
