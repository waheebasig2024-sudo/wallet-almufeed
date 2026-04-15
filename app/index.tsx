import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  BackHandler,
  Alert,
  StatusBar,
  PermissionsAndroid,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSettings } from '@/hooks/useSettings';
import { SettingsDrawer } from '@/components/SettingsDrawer';
import t from '@/constants/i18n';

const ASSISTANT_URL = 'http://127.0.0.1:8081';

function getAndroidPermissions(): string[] {
  if (Platform.OS !== 'android' || !PermissionsAndroid.PERMISSIONS) return [];
  const P = PermissionsAndroid.PERMISSIONS;
  return [
    P.CAMERA,
    P.RECORD_AUDIO,
    P.ACCESS_FINE_LOCATION,
    P.ACCESS_COARSE_LOCATION,
    P.READ_CONTACTS,
    P.WRITE_CONTACTS,
    P.READ_CALL_LOG,
    P.WRITE_CALL_LOG,
    P.READ_PHONE_STATE,
    P.CALL_PHONE,
    P.READ_PHONE_NUMBERS,
    P.SEND_SMS,
    P.RECEIVE_SMS,
    P.READ_SMS,
    P.RECEIVE_MMS,
    P.READ_EXTERNAL_STORAGE,
    P.WRITE_EXTERNAL_STORAGE,
    P.READ_MEDIA_IMAGES,
    P.READ_MEDIA_VIDEO,
    P.READ_MEDIA_AUDIO,
    P.READ_CALENDAR,
    P.WRITE_CALENDAR,
    P.BODY_SENSORS,
    P.ACTIVITY_RECOGNITION,
    P.BLUETOOTH_SCAN,
    P.BLUETOOTH_CONNECT,
    P.BLUETOOTH_ADVERTISE,
    P.NEARBY_WIFI_DEVICES,
    P.PROCESS_OUTGOING_CALLS,
    P.ANSWER_PHONE_CALLS,
  ].filter(Boolean) as string[];
}

async function requestAllPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    const perms = getAndroidPermissions();
    if (perms.length > 0) {
      await PermissionsAndroid.requestMultiple(perms as Parameters<typeof PermissionsAndroid.requestMultiple>[0]);
    }
  } catch (_) {}
}

const BRIDGE_INJECTION = `
(function() {
  window.__assistantBridge = {
    postToNative: function(type, payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
      }
    },
    onNativeMessage: null,
  };
  window.addEventListener('message', function(e) {
    try {
      var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (window.__assistantBridge.onNativeMessage) {
        window.__assistantBridge.onNativeMessage(data);
      }
    } catch(_) {}
  });
  true;
})();
`;

type BridgeMessage = {
  type: string;
  payload?: Record<string, unknown>;
};

function handleBridgeMessage(webViewRef: React.MutableRefObject<unknown>, raw: string): void {
  try {
    const msg: BridgeMessage = JSON.parse(raw);
    switch (msg.type) {
      case 'REQUEST_PERMISSIONS':
        requestAllPermissions().then(() => {
          if (webViewRef.current) {
            (webViewRef.current as { injectJavaScript: (s: string) => void }).injectJavaScript(
              `window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'PERMISSIONS_GRANTED' }) })); true;`
            );
          }
        });
        break;
      case 'PING':
        if (webViewRef.current) {
          (webViewRef.current as { injectJavaScript: (s: string) => void }).injectJavaScript(
            `window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'PONG', payload: { platform: '${Platform.OS}', version: '${Platform.Version}' } }) })); true;`
          );
        }
        break;
      default:
        break;
    }
  } catch (_) {}
}

function WebContent({ language }: { language: 'ar' | 'en' }) {
  const tr = t[language];
  if (Platform.OS === 'web') {
    return (
      <View style={webStyles.webContainer}>
        <View style={webStyles.webCard}>
          <Text style={webStyles.webIcon}>🌐</Text>
          <Text style={webStyles.webNotice}>{tr.webNotice}</Text>
          <a
            href={ASSISTANT_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={webStyles.webLink as React.CSSProperties}
          >
            {tr.openInBrowser}
          </a>
        </View>
      </View>
    );
  }

  const { WebView } = require('react-native-webview');
  const webViewRef = useRef<InstanceType<typeof WebView>>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
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
        source={{ uri: ASSISTANT_URL }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        injectedJavaScript={BRIDGE_INJECTION}
        injectedJavaScriptBeforeContentLoaded={BRIDGE_INJECTION}
        onMessage={(e: { nativeEvent: { data: string } }) =>
          handleBridgeMessage(webViewRef, e.nativeEvent.data)
        }
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={(s: { canGoBack: boolean }) => setCanGoBack(s.canGoBack)}
        onError={() => setIsLoading(false)}
        allowsBackForwardNavigationGestures
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        allowFileAccess
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        geolocationEnabled
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

export default function AssistantScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { biometricsEnabled, language } = useSettings();
  const tr = t[language];

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      requestAllPermissions();
    }
  }, []);

  const authenticate = useCallback(async () => {
    setAuthError(null);

    if (Platform.OS === 'web' || !biometricsEnabled) {
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
        promptMessage: tr.authDesc,
        fallbackLabel: 'رمز المرور',
        cancelLabel: tr.cancel,
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else if (result.error !== 'user_cancel') {
        setAuthError(tr.authError);
      }
    } catch {
      setAuthError(tr.authError);
    }
  }, [biometricsEnabled, language]);

  useEffect(() => {
    authenticate();
  }, [authenticate]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && isAuthenticated) {
      const handler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (drawerOpen) { setDrawerOpen(false); return true; }
        Alert.alert(tr.closeApp, tr.closeAppMsg, [
          { text: tr.cancel, style: 'cancel' },
          { text: tr.exit, style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });
      return () => handler.remove();
    }
  }, [isAuthenticated, drawerOpen, language]);

  const topPadding = Platform.OS === 'web'
    ? insets.top + 67
    : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1a' }]}>
            <MaterialCommunityIcons name="fingerprint" size={44} color={colors.primary} />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>{tr.authTitle}</Text>
          <Text style={[styles.authDesc, { color: authError ? '#ef4444' : colors.mutedForeground }]}>
            {authError || tr.authDesc}
          </Text>
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={authenticate}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="fingerprint" size={20} color="#fff" />
            <Text style={styles.authBtnText}>{authError ? tr.authRetry : tr.authButton}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.settingsLink}>
            <Feather name="settings" size={14} color={colors.mutedForeground} />
            <Text style={[styles.settingsLinkText, { color: colors.mutedForeground }]}>{tr.settings}</Text>
          </TouchableOpacity>
        </View>
        <SettingsDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </View>
    );
  }

  if (isConnected === false) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#ef444418' }]}>
            <Feather name="wifi-off" size={40} color="#ef4444" />
          </View>
          <Text style={[styles.authTitle, { color: colors.foreground }]}>{tr.noInternet}</Text>
          <Text style={[styles.authDesc, { color: colors.mutedForeground }]}>{tr.noInternetDesc}</Text>
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={() => NetInfo.fetch().then((s) => setIsConnected(s.isConnected ?? false))}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={18} color="#fff" />
            <Text style={styles.authBtnText}>{tr.retry}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isConnected === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const headerTop = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: '#0a1628' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />

      <View style={[styles.appHeader, { paddingTop: headerTop, backgroundColor: '#0a1628' }]}>
        <TouchableOpacity
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.menuBtn}
        >
          <Feather name="menu" size={22} color="#d4a843" />
        </TouchableOpacity>
        <Text style={styles.appHeaderTitle} numberOfLines={1}>{tr.appName}</Text>
        <View style={{ width: 38 }} />
      </View>

      <WebContent language={language} />

      <SettingsDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  authTitle: { fontSize: 21, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  authDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 21 },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 14,
    marginTop: 6,
  },
  authBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  settingsLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, opacity: 0.7 },
  settingsLinkText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  menuBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  appHeaderTitle: { flex: 1, color: '#ffffff', fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  loadingOverlay: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a1628', zIndex: 10 },
});

const webStyles = {
  webContainer: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#0a1628',
    padding: 24,
  },
  webCard: {
    backgroundColor: '#112240',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center' as const,
    maxWidth: 360,
    width: '100%' as const,
    gap: 16,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  webIcon: {
    fontSize: 48,
  },
  webNotice: {
    color: '#94a3b8',
    fontSize: 15,
    textAlign: 'center' as const,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  webLink: {
    display: 'block',
    marginTop: 8,
    backgroundColor: '#d4a843',
    color: '#0a1628',
    padding: '14px 28px',
    borderRadius: 12,
    fontWeight: 'bold',
    fontSize: 15,
    textDecoration: 'none',
    textAlign: 'center' as const,
    fontFamily: 'Inter_700Bold',
  },
};
