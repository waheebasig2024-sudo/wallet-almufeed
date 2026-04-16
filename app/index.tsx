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

const DEFAULT_URL = 'http://127.0.0.1:8081';

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
      await PermissionsAndroid.requestMultiple(
        perms as Parameters<typeof PermissionsAndroid.requestMultiple>[0]
      );
    }
  } catch {}
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

function handleBridgeMessage(webViewRef: React.MutableRefObject<any>, raw: string): void {
  try {
    const msg: BridgeMessage = JSON.parse(raw);

    switch (msg.type) {
      case 'REQUEST_PERMISSIONS':
        requestAllPermissions().then(() => {
          webViewRef.current?.injectJavaScript(
            `window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'PERMISSIONS_GRANTED' }) })); true;`
          );
        });
        break;

      case 'PING':
        webViewRef.current?.injectJavaScript(
          `window.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ type: 'PONG', payload: { platform: '${Platform.OS}', version: '${Platform.Version}' } }) })); true;`
        );
        break;

      default:
        break;
    }
  } catch {}
}

function WebContent({ serverUrl }: { serverUrl: string }) {
  const url = serverUrl || DEFAULT_URL;

  if (Platform.OS === 'web') {
    return (
      <iframe
        src={url}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        } as React.CSSProperties}
        title="الحسن المساعد الشخصي"
        allow="camera; microphone; geolocation; notifications"
      />
    );
  }

  const { WebView } = require('react-native-webview');
  const webViewRef = useRef<any>(null);
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
        key={url}
        ref={webViewRef}
        source={{ uri: url }}
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
  const { biometricsEnabled, language, serverUrl } = useSettings();
  const tr = t[language];

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  const handleReload = useCallback(() => {
    setWebViewKey(k => k + 1);
  }, []);

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
  }, [biometricsEnabled, tr]);

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
        if (drawerOpen) {
          setDrawerOpen(false);
          return true;
        }

        Alert.alert(tr.closeApp, tr.closeAppMsg, [
          { text: tr.cancel, style: 'cancel' },
          { text: tr.exit, style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });

      return () => handler.remove();
    }
  }, [isAuthenticated, drawerOpen, tr]);

  const topPadding = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  if (!isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1a' }]}>
            <MaterialCommunityIcons name="fingerprint" size={44} color={colors.primary} />
          </View>

          <Text style={[styles.authTitle, { color: colors.foreground }]}>
            {tr.authTitle}
          </Text>

          <Text style={[styles.authDesc, { color: authError ? '#ef4444' : colors.mutedForeground }]}>
            {authError || tr.authDesc}
          </Text>

          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={authenticate}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="fingerprint" size={20} color="#fff" />
            <Text style={styles.authBtnText}>
              {authError ? tr.authRetry : tr.authButton}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.settingsLink}>
            <Feather name="settings" size={14} color={colors.mutedForeground} />
            <Text style={[styles.settingsLinkText, { color: colors.mutedForeground }]}>
              {tr.settings}
            </Text>
          </TouchableOpacity>
        </View>

        <SettingsDrawer
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onReload={handleReload}
        />
      </View>
    );
  }

  if (isConnected === false) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topPadding }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="wifi-off" size={44} color="#ef4444" />
          <Text style={[styles.authTitle, { color: colors.foreground, marginTop: 16 }]}>
            {tr.noInternetTitle || 'لا يوجد اتصال بالإنترنت'}
          </Text>
          <Text style={[styles.authDesc, { color: colors.mutedForeground }]}>
            {tr.noInternetMessage || 'تحقق من الشبكة ثم حاول مرة أخرى'}
          </Text>
          <TouchableOpacity
            style={[styles.authBtn, { backgroundColor: colors.primary }]}
            onPress={handleReload}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={18} color="#fff" />
            <Text style={styles.authBtnText}>{tr.retry || 'إعادة المحاولة'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: topPadding }}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <WebContent key={`${webViewKey}-${serverUrl}`} serverUrl={serverUrl || DEFAULT_URL} />
      <SettingsDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onReload={handleReload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  authDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
  },
  authBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  settingsLinkText: {
    fontSize: 14,
  },
  loadingOverlay: {
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
