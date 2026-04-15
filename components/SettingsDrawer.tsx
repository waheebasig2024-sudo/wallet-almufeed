import React, { useRef, useEffect, useState } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  ScrollView,
  TextInput,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSettings } from '@/hooks/useSettings';
import t from '@/constants/i18n';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

interface Props {
  visible: boolean;
  onClose: () => void;
  onReload?: () => void;
}

export function SettingsDrawer({ visible, onClose, onReload }: Props) {
  const colors = useColors();
  const { biometricsEnabled, setBiometricsEnabled, language, setLanguage, deviceId, serverUrl, setServerUrl } = useSettings();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const tr = t[language];

  const [urlInput, setUrlInput] = useState(serverUrl);
  const [urlSaved, setUrlSaved] = useState(false);

  useEffect(() => {
    setUrlInput(serverUrl);
  }, [serverUrl]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSaveUrl = async () => {
    if (!urlInput.trim()) return;
    await setServerUrl(urlInput.trim());
    setUrlSaved(true);
    setTimeout(() => setUrlSaved(false), 2000);
  };

  const handleReload = () => {
    onClose();
    onReload?.();
  };

  const topPadding = Platform.OS === 'web' ? 87 : Platform.OS === 'ios' ? 52 : 36;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.drawer,
            { backgroundColor: colors.card, width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={[styles.header, { backgroundColor: '#0a1628', paddingTop: topPadding }]}>
            <MaterialCommunityIcons name="robot" size={28} color="#d4a843" />
            <Text style={styles.headerTitle} numberOfLines={1}>{tr.appName}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Feather name="x" size={20} color="#ffffff88" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

            {/* Server URL */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {tr.serverUrl}
              </Text>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: '#1a6ef518' }]}>
                  <Feather name="link" size={18} color="#1a6ef5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{tr.serverUrl}</Text>
                  <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{tr.serverUrlDesc}</Text>
                </View>
              </View>
              <TextInput
                value={urlInput}
                onChangeText={setUrlInput}
                placeholder={tr.serverUrlPlaceholder}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[
                  styles.urlInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
              <View style={styles.urlActions}>
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: urlSaved ? '#22c55e' : colors.primary }]}
                  onPress={handleSaveUrl}
                  activeOpacity={0.8}
                >
                  <Feather name={urlSaved ? 'check' : 'save'} size={14} color="#fff" />
                  <Text style={styles.saveBtnText}>
                    {urlSaved ? tr.serverUrlSaved : tr.serverUrlSave}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reloadBtn, { borderColor: colors.border }]}
                  onPress={handleReload}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={14} color={colors.foreground} />
                  <Text style={[styles.reloadBtnText, { color: colors.foreground }]}>{tr.reload}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Security */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {tr.security}
              </Text>
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
                  <MaterialCommunityIcons name="fingerprint" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{tr.biometrics}</Text>
                  <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{tr.biometricsDesc}</Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={setBiometricsEnabled}
                  trackColor={{ false: colors.border, true: colors.primary + 'aa' }}
                  thumbColor={biometricsEnabled ? colors.primary : '#ccc'}
                />
              </View>
            </View>

            {/* Language */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {tr.language}
              </Text>
              <View style={styles.langRow}>
                <TouchableOpacity
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor: language === 'ar' ? colors.primary : colors.secondary,
                      borderColor: language === 'ar' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setLanguage('ar')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langText, { color: language === 'ar' ? '#fff' : colors.foreground }]}>
                    {tr.arabic}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor: language === 'en' ? colors.primary : colors.secondary,
                      borderColor: language === 'en' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langText, { color: language === 'en' ? '#fff' : colors.foreground }]}>
                    {tr.english}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* About */}
            <View style={[styles.section, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                {tr.about}
              </Text>
              <View style={styles.aboutRow}>
                <View style={[styles.iconWrap, { backgroundColor: '#22c55e18' }]}>
                  <Feather name="info" size={16} color="#22c55e" />
                </View>
                <Text style={[styles.aboutText, { color: colors.foreground }]}>{tr.version}</Text>
              </View>
              <View style={styles.aboutRow}>
                <View style={[styles.iconWrap, { backgroundColor: '#f59e0b18' }]}>
                  <Feather name="smartphone" size={16} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowDesc, { color: colors.mutedForeground }]}>{tr.deviceId}</Text>
                  <Text style={[styles.deviceIdText, { color: colors.foreground }]} numberOfLines={1}>
                    {deviceId || '---'}
                  </Text>
                </View>
              </View>
              <View style={styles.aboutRow}>
                <View style={[styles.iconWrap, { backgroundColor: '#3b82f618' }]}>
                  <Feather name="shield" size={16} color="#3b82f6" />
                </View>
                <Text style={[styles.aboutText, { color: colors.mutedForeground }]}>{tr.deviceLocked}</Text>
              </View>
            </View>

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { flex: 1, color: '#ffffff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  section: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  rowDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  urlInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'left',
  },
  urlActions: { flexDirection: 'row', gap: 8 },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  reloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  reloadBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  langRow: { flexDirection: 'row', gap: 8 },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  langText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aboutText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  deviceIdText: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 2 },
});
