import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";

const emerald600 = "#059669";
const emerald700 = "#047857";

const currencySymbols: { [key: string]: string } = {
  GHS: "GH₵",
  NGN: "₦",
  USD: "$",
};

// ── Reusable Components ───────────────────────────────────

const MenuRow = ({
  icon,
  label,
  sublabel,
  right,
  onPress,
  iconBg,
  iconColor,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  iconBg?: string;
  iconColor?: string;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center px-4 py-4 bg-white rounded-lg"
  >
    <View
      style={{ backgroundColor: iconBg ?? "#ecfdf5" }}
      className="items-center justify-center mr-3 w-9 h-9 rounded-xl"
    >
      <Feather name={icon as any} size={17} color={iconColor ?? emerald600} />
    </View>
    <View className="flex-1">
      <Text className="text-sm font-medium text-gray-800">{label}</Text>
      {sublabel && (
        <Text className="text-gray-400 text-xs mt-0.5">{sublabel}</Text>
      )}
    </View>
    {right ?? <Feather name="chevron-right" size={17} color="#d1d5db" />}
  </TouchableOpacity>
);

const Divider = () => <View className="h-px mx-4 bg-gray-100" />;

const SectionLabel = ({ label }: { label: string }) => (
  <Text className="px-5 mt-5 mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
    {label}
  </Text>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <View className="gap-1 mx-5 overflow-hidden">{children}</View>
);

// ── Edit Profile Modal ────────────────────────────────────
const EditProfileModal = ({
  visible,
  onClose,
  profile,
  onUpdate,
}: {
  visible: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: () => void;
}) => {
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const email = profile?.email || "";
  const [phone, setPhone] = useState(profile?.phone_number || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
        })
        .eq("id", profile.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4 mt-10 border-b border-gray-100">
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-gray-900">
            Edit Profile
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={emerald600} />
            ) : (
              <Text
                style={{ color: emerald600 }}
                className="text-sm font-semibold"
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-5 pt-6">
          <View className="items-center mb-8">
            <View className="items-center justify-center w-20 h-20 mb-3 border-2 rounded-full bg-emerald-100 border-emerald-200">
              <Text
                style={{ color: emerald600 }}
                className="text-2xl font-bold"
              >
                {firstName[0]}
                {lastName[0]}
              </Text>
            </View>
            <TouchableOpacity>
              <Text
                style={{ color: emerald600 }}
                className="text-sm font-medium"
              >
                Change Photo
              </Text>
            </TouchableOpacity>
          </View>
          {[
            {
              label: "First Name",
              value: firstName,
              setter: setFirstName,
              keyboard: "default",
            },
            {
              label: "Last Name",
              value: lastName,
              setter: setLastName,
              keyboard: "default",
            },
            {
              label: "Phone",
              value: phone,
              setter: setPhone,
              keyboard: "phone-pad",
            },
          ].map((field) => (
            <View key={field.label} className="mb-4">
              <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">
                {field.label}
              </Text>
              <View className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                <TextInput
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.keyboard as any}
                  className="text-sm text-gray-800"
                />
              </View>
            </View>
          ))}
          <View className="mb-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">
              Email
            </Text>
            <View className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-100">
              <Text className="text-sm text-gray-500">{email}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ── Change Password Modal ─────────────────────────────────
const ChangePasswordModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (newPw !== confirm) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      Alert.alert("Success", "Password updated successfully");
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4 mt-10 border-b border-gray-100">
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-gray-900">
            Change Password
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View className="flex-1 px-5 pt-6">
          {[
            { label: "New Password", value: newPw, setter: setNewPw },
            {
              label: "Confirm New Password",
              value: confirm,
              setter: setConfirm,
            },
          ].map((field) => (
            <View key={field.label} className="mb-4">
              <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">
                {field.label}
              </Text>
              <View className="flex-row items-center px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                <TextInput
                  value={field.value}
                  onChangeText={field.setter}
                  secureTextEntry={!show}
                  className="flex-1 text-sm text-gray-800"
                  placeholderTextColor="#9ca3af"
                  placeholder="••••••••"
                />
                <TouchableOpacity onPress={() => setShow(!show)}>
                  <Feather
                    name={show ? "eye" : "eye-off"}
                    size={16}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            className={`items-center py-4 rounded-xl  ${newPw && confirm ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
            onPress={handleUpdatePassword}
            disabled={!newPw || !confirm || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-bold text-white">
                Update Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Change Pin Modal ──────────────────────────────────────
const ChangePinModal = ({
  visible,
  onClose,
  profileId,
}: {
  visible: boolean;
  onClose: () => void;
  profileId: string;
}) => {
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePin = async () => {
    if (newPin.length !== 4 || confirmPin.length !== 4) {
      Alert.alert("Error", "Pin must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert("Error", "Pins do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ transaction_pin: newPin })
        .eq("id", profileId);

      if (error) throw error;
      Alert.alert("Success", "Transaction pin updated successfully");
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent={true}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-5 pt-12 pb-4 mt-10 border-b border-gray-100">
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-gray-900">
            Change Transaction Pin
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View className="flex-1 px-5 pt-6">
          <View className="mb-4">
            <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">
              New 4-Digit Pin
            </Text>
            <View className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
              <TextInput
                value={newPin}
                onChangeText={setNewPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                className="text-sm text-gray-800 text-center"
                placeholder="••••"
              />
            </View>
          </View>
          <View className="mb-8">
            <Text className="text-gray-500 text-xs font-semibold uppercase mb-1.5">
              Confirm New Pin
            </Text>
            <View className="px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
              <TextInput
                value={confirmPin}
                onChangeText={setConfirmPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
                className="text-sm text-gray-800 text-center"
                placeholder="••••"
              />
            </View>
          </View>
          <TouchableOpacity
            className={`items-center py-4 rounded-xl  ${newPin.length === 4 && confirmPin.length === 4 ? "bg-emerald-700" : "bg-emerald-700 opacity-50"}`}
            onPress={handleUpdatePin}
            disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-bold text-white">Update Pin</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Linked Accounts Modal ─────────────────────────────────
const LinkedAccountsModal = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => (
  <Modal
    visible={visible}
    animationType="fade"
    presentationStyle="pageSheet"
    statusBarTranslucent={true}
  >
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pt-12 pb-4 mt-10 border-b border-gray-100">
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900">
          Linked Accounts
        </Text>
        <TouchableOpacity>
          <Feather name="plus" size={22} color={emerald600} />
        </TouchableOpacity>
      </View>
      <View className="flex-1 px-5 pt-4">
        {[
          {
            bank: "Wema Bank",
            number: "•••• 6790",
            type: "Primary",
            color: "#d1fae5",
            textColor: emerald600,
          },
          {
            bank: "Access Bank",
            number: "•••• 4521",
            type: "Savings",
            color: "#e0e7ff",
            textColor: "#6366f1",
          },
          {
            bank: "GTBank",
            number: "•••• 8833",
            type: "Current",
            color: "#fef3c7",
            textColor: "#f59e0b",
          },
        ].map((acc) => (
          <View
            key={acc.bank}
            className="flex-row items-center px-4 py-4 mb-3 bg-gray-50 rounded-2xl"
          >
            <View
              style={{ backgroundColor: acc.color }}
              className="items-center justify-center w-10 h-10 mr-3 rounded-xl"
            >
              <Feather name="home" size={18} color={acc.textColor} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-800">
                {acc.bank}
              </Text>
              <Text className="text-xs text-gray-400">{acc.number}</Text>
            </View>
            <View
              style={{ backgroundColor: acc.color }}
              className="px-3 py-1 rounded-full"
            >
              <Text
                style={{ color: acc.textColor }}
                className="text-xs font-semibold"
              >
                {acc.type}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  </Modal>
);

// ── Main Screen ───────────────────────────────────────────
export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [twoFA, setTwoFA] = useState(true);
  // const [balanceVisible, setBalanceVisible] = useState(true)

  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLinked, setShowLinked] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // const currency = useCurrency();
  const currencySymbol = profile?.primary_currency ? currencySymbols[profile.primary_currency] : currencySymbols["NGN"];

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile({ ...data, email: user.email });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-50">
        <ActivityIndicator size="large" color={emerald600} />
      </View>
    );
  }

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : "??";
  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "User";

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Green Header */}
        <View
          style={{ backgroundColor: emerald700 }}
          className="px-5 pt-6 pb-20"
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-white">My Profile</Text>
          </View>
          <View className="flex-row items-center gap-4">
            <View className="items-center justify-center w-16 h-16 border-2 rounded-full bg-emerald-100 border-white/30">
              <Text style={{ color: emerald600 }} className="text-xl font-bold">
                {initials}
              </Text>
            </View>
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-bold text-white">{fullName}</Text>
                {/* Verified badge */}
                <View
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  className="px-2 py-0.5 rounded-full flex-row items-center gap-1"
                >
                  <Feather name="check-circle" size={11} color="#6ee7b7" />
                  <Text className="text-xs text-emerald-200">Verified</Text>
                </View>
              </View>
              <Text className="text-sm text-emerald-200">{profile?.email}</Text>
              <Text className="text-sm text-emerald-200">
                {profile?.phone_number}
              </Text>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View className="mx-5 mb-2 -mt-12">
          <View
            style={{ backgroundColor: emerald600 }}
            className="p-6 rounded-2xl"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-emerald-200">Balance</Text>
            </View>
            <Text
              className="mb-4 font-bold text-white"
              style={{ fontSize: 28, letterSpacing: -1 }}
            >
              {currencySymbol}
              {Number(profile?.account_balance || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </Text>
            <View className="flex-row items-center gap-3">
              <Feather
                name="credit-card"
                size={18}
                color="rgba(255,255,255,0.6)"
              />
              <Text className="text-sm tracking-widest text-white/60">
                •••• •••• •••• 3765
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mx-5 mt-4">
          {[
            {
              label: "Total Sent",
              value: `${currencySymbol}12,450`,
              icon: "send",
            },
            {
              label: "Total Received",
              value: `${currencySymbol}18,320`,
              icon: "download",
            },
            { label: "Transactions", value: "10", icon: "list" },
          ].map((stat) => (
            <View
              key={stat.label}
              className="items-center flex-1 px-2 py-3 bg-white rounded-lg shadow-sm"
            >
              <View
                style={{ backgroundColor: "#ecfdf5" }}
                className="items-center justify-center w-8 h-8 mb-1 rounded-full"
              >
                <Feather name={stat.icon as any} size={14} color={emerald600} />
              </View>
              <Text className="text-sm font-bold text-gray-900">
                {stat.value}
              </Text>
              <Text className="text-xs text-center text-gray-400">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Personal Information */}
        <SectionLabel label="Personal Information" />
        <Card>
          <MenuRow
            icon="user"
            label="Edit Profile"
            sublabel="Update your personal details"
            onPress={() => setShowEdit(true)}
          />
          <Divider />
          <MenuRow
            icon="calendar"
            label="Date of Birth"
            sublabel={profile?.dob ? new Date(profile.dob).toLocaleDateString() : "Not set"}
          />
          <Divider />
          <MenuRow
            icon="lock"
            label="Change Password"
            sublabel="Update your login password"
            onPress={() => setShowPassword(true)}
          />
          <Divider />
          <MenuRow
            icon="mail"
            label="Email Preferences"
            sublabel="Manage email communications"
          />
          <Divider />
          <MenuRow
            icon="bell"
            label="Push Notifications"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }}
                thumbColor={notifications ? emerald600 : "#9ca3af"}
              />
            }
          />
        </Card>

        {/* Security */}
        <SectionLabel label="Security" />
        <Card>
          <MenuRow
            icon="shield"
            label="Two-Factor Authentication"
            sublabel="Extra layer of security"
            right={
              <Switch
                value={twoFA}
                onValueChange={setTwoFA}
                trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }}
                thumbColor={twoFA ? emerald600 : "#9ca3af"}
              />
            }
          />
          <Divider />
          <MenuRow
            icon="smartphone"
            label="Biometric Login"
            sublabel="Use fingerprint or Face ID"
            right={
              <Switch
                value={biometrics}
                onValueChange={setBiometrics}
                trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }}
                thumbColor={biometrics ? emerald600 : "#9ca3af"}
              />
            }
          />
          <Divider />
          <MenuRow
            icon="eye-off"
            label="Transaction Pin"
            sublabel="Change your transaction pin"
            onPress={() => setShowPin(true)}
          />
        </Card>

        {/* Marketing Preferences */}
        <SectionLabel label="Preferences" />
        <Card>
          <MenuRow
            icon="mail"
            label="Marketing Communications"
            sublabel="Be informed about special offers"
            right={
              <Switch
                value={profile?.marketing_accepted}
                onValueChange={async (value) => {
                  try {
                    const { error } = await supabase
                      .from("profiles")
                      .update({ marketing_accepted: value })
                      .eq("id", profile.id);
                    if (error) throw error;
                    setProfile({ ...profile, marketing_accepted: value });
                  } catch (error: any) {
                    Alert.alert("Error", error.message);
                  }
                }}
                trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }}
                thumbColor={profile?.marketing_accepted ? emerald600 : "#9ca3af"}
              />
            }
          />
        </Card>

        {/* Accounts & Payments */}
        <SectionLabel label="Accounts & Payments" />
        <Card>
          <MenuRow
            icon="home"
            label="Linked Bank Accounts"
            sublabel="Manage connected accounts"
            onPress={() => setShowLinked(true)}
          />
          <Divider />
          <MenuRow
            icon="credit-card"
            label="Virtual Cards"
            sublabel="Manage your virtual cards"
          />
          <Divider />
          <MenuRow
            icon="dollar-sign"
            label="Transaction Limits"
            sublabel="View and request limit changes"
          />
        </Card>

        {/* Subscription */}
        <SectionLabel label="Subscription" />
        <Card>
          <MenuRow
            icon="star"
            label="Upgrade to Pro"
            sublabel="Unlock premium features"
            right={
              <View
                style={{ backgroundColor: emerald600 }}
                className="px-3 py-1 rounded-full"
              >
                <Text className="text-xs font-bold text-white">PRO</Text>
              </View>
            }
          />
          <Divider />
          <MenuRow
            icon="gift"
            label="Referral Program"
            sublabel="Invite friends and earn rewards"
          />
        </Card>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        profile={profile}
        onUpdate={fetchProfile}
      />
      <ChangePasswordModal
        visible={showPassword}
        onClose={() => setShowPassword(false)}
      />
      <LinkedAccountsModal
        visible={showLinked}
        onClose={() => setShowLinked(false)}
      />
      <ChangePinModal
        visible={showPin}
        onClose={() => setShowPin(false)}
        profileId={profile?.id}
      />
    </View>
  );
}
