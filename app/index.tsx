import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  BackHandler,
  Alert,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const WALLET_URL = "https://almufeed-net.infinityfreeapp.com/wallet/index.php";

function WebContent() {
  if (Platform.OS === "web") {
    return (
      <iframe
        src={WALLET_URL}
        style={{ flex: 1, width: "100%", height: "100%", border: "none" } as React.CSSProperties}
        title="Wallet"
      />
    );
  }
  const { WebView } = require("react-native-webview");
  const webViewRef = useRef<InstanceType<typeof WebView>>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === "android") {
      const handler = BackHandler.addEventListener("hardwareBackPress", () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        Alert.alert("إغلاق التطبيق", "هل تريد الخروج من التطبيق؟", [
          { text: "إلغاء", style: "cancel" },
          { text: "خروج", style: "destructive", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });
      return () => handler.remove();
    }
  }, [canGoBack]);

  return (
    <View style={{ flex: 1 }}>
      {isLoading && (
        <View style={[StyleSheet.absoluteFillObject, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color="#1a6ef5" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: WALLET_URL }}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={(navState: { canGoBack: boolean }) => {
          setCanGoBack(navState.canGoBack);
        }}
        onError={() => setIsLoading(false)}
        allowsBackForwardNavigationGestures={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        mixedContentMode="always"
      />
    </View>
  );
}

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    setAuthError(null);

    if (Platform.OS === "web") {
      setIsAuthenticated(true);
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "تأكيد الهوية للدخول إلى المحفظة",
        fallbackLabel: "استخدم رمز المرور",
        cancelLabel: "إلغاء",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        if (result.error !== "user_cancel") {
          setAuthError("فشل التحقق. يرجى المحاولة مرة أخرى.");
        }
      }
    } catch {
      setAuthError("حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.");
    }
  }, []);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <View style={[styles.authCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
            <MaterialCommunityIcons name="fingerprint" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>
            المحفظة الإلكترونية
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.mutedForeground }]}>
            {authError || "يرجى التحقق من هويتك للمتابعة"}
          </Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={authenticate}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="fingerprint" size={20} color={colors.primaryForeground} />
            <Text style={[styles.authButtonText, { color: colors.primaryForeground }]}>
              {authError ? "إعادة المحاولة" : "التحقق بالبصمة"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isConnected === false) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <View style={[styles.authCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: "#ef444422" }]}>
            <Feather name="wifi-off" size={36} color="#ef4444" />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>
            عذراً، لا يوجد اتصال بالإنترنت
          </Text>
          <Text style={[styles.authSubtitle, { color: colors.mutedForeground }]}>
            يرجى التحقق من الشبكة وإعادة المحاولة
          </Text>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.primary }]}
            onPress={() => NetInfo.fetch().then((state) => setIsConnected(state.isConnected ?? false))}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={18} color={colors.primaryForeground} />
            <Text style={[styles.authButtonText, { color: colors.primaryForeground }]}>
              إعادة المحاولة
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isConnected === null) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? topPadding : 0 }]}>
      <WebContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4ff",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  authCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  authTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    lineHeight: 30,
  },
  authSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  authButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginTop: 8,
  },
  authButtonText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  loadingOverlay: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4ff",
    zIndex: 10,
  },
});
