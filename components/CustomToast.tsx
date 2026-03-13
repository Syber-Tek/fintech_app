import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  Keyboard,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import {
  CheckCircle,
  XCircle,
  Warning,
  Info,
  X,
  WifiSlash,
} from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";

type ToastType =
  | "success"
  | "danger"
  | "warning"
  | "error"
  | "info"
  | "offline";

interface ToastOptions {
  type: ToastType;
  text1: string;
  text2?: string;
  duration?: number;
}

interface ToastContextType {
  show: (options: ToastOptions) => void;
  hide: () => void;
}

let showToastInternal: (options: ToastOptions) => void = () => {};
let hideToastInternal: () => void = () => {};

export const Toast = {
  show: (options: ToastOptions) => {
    showToastInternal(options);
  },
  hide: () => {
    hideToastInternal();
  },
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const hide = useCallback(() => {
    setVisible(false);
    // Give time for the exit animation to complete before clearing toast data
    setTimeout(() => setToast(null), 300);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      setToast(options);
      setVisible(true);

      // Auto-hide if duration is not 0 (0 means persistent)
      if (options.duration !== 0) {
        const timer = setTimeout(() => {
          hide();
        }, options.duration || 4000); // Default to 4 seconds
        return () => clearTimeout(timer); // Clear timer on unmount/re-render
      }
    },
    [hide],
  );

  // Monitor internet connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // If offline and no offline toast is currently showing
      if (
        state.isConnected === false &&
        (toast === null || toast.type !== "offline")
      ) {
        show({
          type: "offline",
          text1: "No Internet Connection",
          text2: "Please check your network settings.",
          duration: 0, // Keep it visible while offline
        });
      }
      // If back online and an offline toast is currently showing
      else if (state.isConnected === true && toast?.type === "offline") {
        hide(); // Hide the persistent offline toast
        show({
          type: "success",
          text1: "Back Online",
          text2: "Internet connection restored.",
          duration: 3000, // Show success toast briefly
        });
      }
    });

    return () => unsubscribe(); // Clean up the listener
  }, [show, hide, toast]); // Re-run effect if show/hide/toast changes

  // Update internal references for global Toast object
  showToastInternal = show;
  hideToastInternal = hide;

  const getIcon = (type: ToastType) => {
    const size = 20; // Slightly smaller icons for the image style
    switch (type) {
      case "success":
        return <CheckCircle size={size} color="#10b981" weight="fill" />;
      case "danger":
      case "error":
        return <XCircle size={size} color="#ef4444" weight="fill" />;
      case "warning":
        return <Warning size={size} color="#f59e0b" weight="fill" />;
      case "offline":
        return <WifiSlash size={size} color="#6b7280" weight="fill" />;
      case "info":
      default:
        return <Info size={size} color="#3b82f6" weight="fill" />;
    }
  };

  const getToastBgColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-emerald-50"; // Light green
      case "danger":
      case "error":
        return "bg-red-50"; // Light red
      case "warning":
        return "bg-amber-50"; // Light yellow
      case "offline":
        return "bg-gray-100"; // Light gray
      case "info":
      default:
        return "bg-blue-50"; // Light blue
    }
  };

  const getToastBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-emerald-300";
      case "danger":
      case "error":
        return "border-red-300";
      case "warning":
        return "border-amber-300";
      case "offline":
        return "border-gray-300";
      case "info":
      default:
        return "border-blue-300";
    }
  };

  const getIconBgColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-emerald-200";
      case "danger":
      case "error":
        return "bg-red-200";
      case "warning":
        return "bg-amber-200";
      case "offline":
        return "bg-gray-200";
      case "info":
      default:
        return "bg-blue-200";
    }
  };

  const getTextColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "text-emerald-800";
      case "danger":
      case "error":
        return "text-red-800";
      case "warning":
        return "text-amber-800";
      case "offline":
        return "text-gray-800";
      case "info":
      default:
        return "text-blue-800";
    }
  };

  const getSubTextColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "text-emerald-700";
      case "danger":
      case "error":
        return "text-red-700";
      case "warning":
        return "text-amber-700";
      case "offline":
        return "text-gray-700";
      case "info":
      default:
        return "text-blue-700";
    }
  };

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <SafeAreaView
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          pointerEvents: "box-none",
        }}
      >
        <AnimatePresence>
          {visible && toast && (
            <MotiView
              from={{ opacity: 0, translateY: -50, scale: 0.9 }}
              animate={{ opacity: 1, translateY: 0, scale: 1 }}
              exit={{ opacity: 0, translateY: -50, scale: 0.9 }}
              transition={{ type: "spring", damping: 15 }}
              className="px-4 mt-2"
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={hide}
                className={`flex-row items-center p-4 rounded-xl ${getToastBgColor(toast.type)} ${getToastBorderColor(toast.type)}`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <View
                  className={`p-1 rounded-full mr-3 ${getIconBgColor(toast.type)}`}
                >
                  {getIcon(toast.type)}
                </View>

                <View className="flex-1">
                  <Text
                    className={`font-semibold text-base ${getTextColor(toast.type)} leading-snug`}
                  >
                    {toast.text1}
                  </Text>
                  {toast.text2 && (
                    <Text
                      className={`text-sm mt-0.5 ${getSubTextColor(toast.type)} leading-snug`}
                    >
                      {toast.text2}
                    </Text>
                  )}
                </View>

                <TouchableOpacity onPress={hide} className="ml-2 p-1">
                  <X
                    size={20}
                    color={getSubTextColor(toast.type).replace("text-", "")}
                    weight="bold"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </MotiView>
          )}
        </AnimatePresence>
      </SafeAreaView>
    </ToastContext.Provider>
  );
};
